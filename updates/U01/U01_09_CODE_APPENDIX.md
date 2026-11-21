# U01_09: Code appendix

Every code file shipped with update U01, verbatim. **Use the shipped files.** Recreate a file from here only if it's missing, and copy it exactly.

Verified before shipping: 34/34 lead tests pass; `tsc --noEmit` is clean; the migration was applied twice on PostgreSQL 16 (with stand-ins for pg_net, pg_cron and Vault), and its insert-only security, checks, rate limit and report trigger were all tested; sample PDFs were rendered in English and Indonesian; the secret scanner blocks leaked keys and `.env` files.

## `supabase/migrations/20261121090000_homyvest_leads.sql`
```sql
-- HOMYVEST lead capture + automatic PDF report to Google Drive
-- Tables: lead_starts (phone entered in the hero), leads (completed form)
-- Security: the public (anon) key can only INSERT. Nobody can read leads except the service role.
-- Automation: after each insert, pg_net calls the `generate-report` Edge Function. A cron job retries failures.
-- Secrets are NOT in this file: the function URL and webhook secret are read from Supabase Vault at runtime
-- (see HUMAN_SETUP_SUPABASE_AND_GOOGLE_DRIVE.md, step A8).

create extension if not exists pgcrypto;
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------- tables
create table if not exists public.lead_starts (
  id          uuid primary key,
  created_at  timestamptz not null default now(),
  phone       text not null check (phone ~ '^\+628[0-9]{7,11}$'),
  lang        text not null default 'en' check (lang in ('en', 'id')),
  source      jsonb not null default '{}'::jsonb check (pg_column_size(source) < 4000)
);

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  start_id        uuid,
  lang            text not null default 'en' check (lang in ('en', 'id')),
  phone           text not null check (phone ~ '^\+628[0-9]{7,11}$'),
  funding         text not null check (funding in ('bank_loan', 'personal_funds', 'no_funds')),
  name            text not null check (char_length(btrim(name)) between 2 and 80),
  owned_assets    text[] not null default '{}'
                  check (owned_assets <@ array['kost','apartment','house','shophouse','hotel','vacant_land','unfinished_building','other']::text[]),
  owned_other     text check (owned_other is null or char_length(owned_other) <= 120),
  build_types     text[] not null default '{}'
                  check (build_types <@ array['kost','hybrid_stay','apartment','rental_houses','mixed_use','commercial','not_sure','other']::text[]),
  build_other     text check (build_other is null or char_length(build_other) <= 120),
  need            text check (need is null or need in ('rent_out','manage_kost','raise_occupancy','feasibility','other')),
  need_other      text check (need_other is null or char_length(need_other) <= 200),
  cities          text[] not null
                  check (cardinality(cities) between 1 and 12
                         and cities <@ array['jakarta','bodetabek','bandung','semarang','yogyakarta','solo','surabaya','malang','bali','bandar_lampung','medan','other']::text[]),
  city_other      text check (city_other is null or char_length(city_other) <= 80),
  calc            jsonb check (calc is null or pg_column_size(calc) < 4000),
  source          jsonb not null default '{}'::jsonb check (pg_column_size(source) < 4000),
  user_agent      text check (user_agent is null or char_length(user_agent) <= 400),
  -- managed by the server only (forced on insert by the trigger below)
  report_status   text not null default 'pending' check (report_status in ('pending','processing','done','failed')),
  report_attempts int  not null default 0,
  report_file_id  text,
  report_url      text,
  report_error    text,
  report_at       timestamptz,
  constraint leads_path_check check (
    (funding in ('bank_loan','personal_funds') and cardinality(owned_assets) > 0 and cardinality(build_types) > 0)
    or (funding = 'no_funds' and need is not null)
  )
);

create index if not exists leads_report_status_idx on public.leads (report_status, created_at);
create index if not exists leads_phone_idx on public.leads (phone, created_at desc);
create index if not exists lead_starts_phone_idx on public.lead_starts (phone, created_at desc);

-- ---------------------------------------------------------------- guards (server-managed columns + simple rate limits)
create or replace function public.leads_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.created_at      := now();
  new.name            := btrim(new.name);
  new.report_status   := 'pending';
  new.report_attempts := 0;
  new.report_file_id  := null;
  new.report_url      := null;
  new.report_error    := null;
  new.report_at       := null;
  if (select count(*) from public.leads
      where phone = new.phone and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists leads_before_insert on public.leads;
create trigger leads_before_insert before insert on public.leads
  for each row execute function public.leads_before_insert();

create or replace function public.lead_starts_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.created_at := now();
  if (select count(*) from public.lead_starts
      where phone = new.phone and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists lead_starts_before_insert on public.lead_starts;
create trigger lead_starts_before_insert before insert on public.lead_starts
  for each row execute function public.lead_starts_before_insert();

-- ---------------------------------------------------------------- row level security: insert-only for the public key
alter table public.leads       enable row level security;
alter table public.lead_starts enable row level security;

revoke all on public.leads       from anon, authenticated;
revoke all on public.lead_starts from anon, authenticated;
grant insert on public.leads       to anon, authenticated;
grant insert on public.lead_starts to anon, authenticated;

drop policy if exists leads_insert_public on public.leads;
create policy leads_insert_public on public.leads
  for insert to anon, authenticated with check (true);

drop policy if exists lead_starts_insert_public on public.lead_starts;
create policy lead_starts_insert_public on public.lead_starts
  for insert to anon, authenticated with check (true);

-- ---------------------------------------------------------------- automation: ask the Edge Function for a report
create or replace function public.leads_request_report() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'report_function_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'report_webhook_secret';
  if v_url is null or v_secret is null then
    return new;                       -- automation not configured yet: keep the lead, the cron will pick it up later
  end if;
  perform net.http_post(
    url                  := v_url,
    body                 := jsonb_build_object('lead_id', new.id),
    headers              := jsonb_build_object('Content-Type', 'application/json', 'x-report-secret', v_secret),
    timeout_milliseconds := 30000
  );
  return new;
exception when others then
  raise warning 'leads_request_report failed: %', sqlerrm;   -- never block a lead because of the automation
  return new;
end $$;

drop trigger if exists leads_after_insert_report on public.leads;
create trigger leads_after_insert_report after insert on public.leads
  for each row execute function public.leads_request_report();

-- Retry every 10 minutes: pending/failed reports (max 5 attempts) and reports stuck in "processing".
select cron.unschedule('homyvest-retry-reports')
where exists (select 1 from cron.job where jobname = 'homyvest-retry-reports');

select cron.schedule('homyvest-retry-reports', '*/10 * * * *', $cron$
  select net.http_post(
    url                  := (select decrypted_secret from vault.decrypted_secrets where name = 'report_function_url'),
    body                 := '{"retry": true}'::jsonb,
    headers              := jsonb_build_object(
                              'Content-Type', 'application/json',
                              'x-report-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'report_webhook_secret')),
    timeout_milliseconds := 120000
  )
  where exists (select 1 from vault.decrypted_secrets where name = 'report_function_url')
    and exists (select 1 from public.leads
                where (report_status in ('pending','failed') and report_attempts < 5 and created_at < now() - interval '2 minutes')
                   or (report_status = 'processing' and report_at < now() - interval '15 minutes'));
$cron$);
```

## `supabase/config.toml`
```toml
# Minimal Supabase CLI config for HOMYVEST. The CLI fills in defaults for everything not listed.
project_id = "homyvest"

[functions.generate-report]
# Called by the database with a shared secret header, not with a user JWT.
verify_jwt = false
```

## `supabase/functions/generate-report/index.ts`
```ts
// Supabase Edge Function: generate-report
// Called by the database (pg_net) after each new lead, and every 10 minutes by pg_cron for retries.
// Deploy with:  npx supabase functions deploy generate-report --no-verify-jwt
// Auth: a shared secret header (x-report-secret) that matches the REPORT_WEBHOOK_SECRET function secret.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildReportPdf, reportFileName, type Lang, type LeadRow } from "./report.ts";
import { uploadPdfToDrive } from "./drive.ts";

const env = (k: string) => Deno.env.get(k);
const SECRET = env("REPORT_WEBHOOK_SECRET") ?? "";
const REPORT_LANG: Lang = env("REPORT_LANGUAGE") === "id" ? "id" : "en";
const TZ = env("REPORT_TIMEZONE") ?? "Asia/Jakarta";
const MAX_ATTEMPTS = 5;

const db = createClient(env("SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pickRetryIds(): Promise<string[]> {
  const twoMinAgo = new Date(Date.now() - 2 * 60_000).toISOString();
  const fifteenMinAgo = new Date(Date.now() - 15 * 60_000).toISOString();
  const a = await db.from("leads").select("id")
    .in("report_status", ["pending", "failed"]).lt("report_attempts", MAX_ATTEMPTS).lt("created_at", twoMinAgo)
    .order("created_at", { ascending: true }).limit(10);
  const b = await db.from("leads").select("id")
    .eq("report_status", "processing").lt("report_at", fifteenMinAgo).lt("report_attempts", MAX_ATTEMPTS).limit(5);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  return [...new Set([...(a.data ?? []), ...(b.data ?? [])].map((r) => r.id as string))];
}

async function processLead(id: string): Promise<{ id: string; status: string; error?: string }> {
  const { data: lead, error } = await db.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) return { id, status: "error", error: error.message };
  if (!lead) return { id, status: "not_found" };
  if (lead.report_status === "done") return { id, status: "already_done" };
  if (lead.report_attempts >= MAX_ATTEMPTS) return { id, status: "gave_up" };

  // Claim it (optimistic: only succeeds if nobody else bumped the attempt counter first).
  const { data: claimed, error: claimErr } = await db.from("leads")
    .update({ report_status: "processing", report_attempts: lead.report_attempts + 1, report_at: new Date().toISOString() })
    .eq("id", id).eq("report_attempts", lead.report_attempts)
    .select("*").maybeSingle();
  if (claimErr) return { id, status: "error", error: claimErr.message };
  if (!claimed) return { id, status: "claimed_elsewhere" };

  try {
    const bytes = await buildReportPdf(claimed as LeadRow, { lang: REPORT_LANG, timeZone: TZ });
    const file = await uploadPdfToDrive(env, bytes, reportFileName(claimed as LeadRow, TZ));
    await db.from("leads").update({
      report_status: "done", report_file_id: file.id, report_url: file.webViewLink ?? null,
      report_error: null, report_at: new Date().toISOString(),
    }).eq("id", id);
    return { id, status: "done" };
  } catch (e) {
    const message = (e instanceof Error ? e.message : String(e)).slice(0, 500);
    await db.from("leads").update({ report_status: "failed", report_error: message, report_at: new Date().toISOString() }).eq("id", id);
    console.error(`report failed for ${id}: ${message}`);
    return { id, status: "failed", error: message };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!safeEqual(req.headers.get("x-report-secret") ?? "", SECRET)) return new Response("Unauthorized", { status: 401 });

  let body: { lead_id?: string; retry?: boolean } = {};
  try { body = await req.json(); } catch { /* empty body */ }

  try {
    const ids = body.lead_id ? [body.lead_id] : body.retry ? await pickRetryIds() : [];
    const results = [];
    for (const id of ids) results.push(await processLead(id));
    return Response.json({ ok: true, results });
  } catch (e) {
    console.error(`generate-report error: ${e instanceof Error ? e.message : String(e)}`);
    return Response.json({ ok: false }, { status: 500 });
  }
});
```

## `supabase/functions/generate-report/report.ts`
```ts
// Builds the one-page (or two-page) PDF lead report. Pure: no network, no env access.
// Runs in Supabase Edge Functions (Deno). Vitest maps "npm:pdf-lib@1.17.1" to "pdf-lib" for tests.
import { PDFDocument, PDFFont, PDFPage, PDFString, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

export type Lang = "en" | "id";

export type LeadRow = {
  id: string;
  created_at: string;
  lang: Lang;
  phone: string;
  funding: "bank_loan" | "personal_funds" | "no_funds";
  name: string;
  owned_assets: string[];
  owned_other?: string | null;
  build_types: string[];
  build_other?: string | null;
  need?: string | null;
  need_other?: string | null;
  cities: string[];
  city_other?: string | null;
  calc?: {
    P?: number; L?: number; A?: number; kdb?: number; klb?: number; kdh?: number; maxFloors?: number | null;
    floorArea?: number; idea?: string | null; paybackYears?: number | null;
  } | null;
  source?: { page?: string; referrer?: string; utm?: Record<string, string> } | null;
  user_agent?: string | null;
};

// Labels must stay in sync with src/lib/leads/leads.ts (a test checks the keys).
export const LABELS: Record<Lang, Record<string, Record<string, string>>> = {
  en: {
    funding: { bank_loan: "Loan from bank / financial institution", personal_funds: "Personal funds", no_funds: "No construction funds yet" },
    owned: { kost: "Kost / coliving", apartment: "Apartment", house: "House", shophouse: "Shophouse (ruko)", hotel: "Hotel / guesthouse", vacant_land: "Vacant land", unfinished_building: "Unfinished building", other: "Other" },
    build: { kost: "Kost / coliving", hybrid_stay: "Hybrid stay / guesthouse", apartment: "Apartment", rental_houses: "Rental houses / townhouses", mixed_use: "Mixed-use", commercial: "Commercial (café, office, sports)", not_sure: "Not sure yet", other: "Other" },
    need: { rent_out: "Wants to rent out an apartment or house", manage_kost: "Needs help managing a boarding house", raise_occupancy: "Wants to raise boarding-house occupancy", feasibility: "Has a strategic property and wants a feasibility check", other: "Other" },
    city: { jakarta: "Jakarta", bodetabek: "Bodetabek", bandung: "Bandung", semarang: "Semarang", yogyakarta: "Yogyakarta", solo: "Solo", surabaya: "Surabaya", malang: "Malang", bali: "Bali", bandar_lampung: "Bandar Lampung", medan: "Medan", other: "Other" },
    idea: { kos: "Kos-kosan", ruko: "Ruko", rumah: "Rental houses", gudang: "Warehouse" },
    ui: {
      title: "Lead report", submitted: "Submitted", ref: "Reference", contact: "Contact", name: "Name", phone: "Phone",
      whatsapp: "WhatsApp", language: "Website language", funding: "Funding source", property: "About the property",
      owned: "Currently owns", build: "Wants to build", need: "Main need", cities: "City / area",
      calc: "Land check (from the website calculator)", land: "Land", rules: "Rules", allowed: "Allowed floor area",
      idea: "Idea of interest", payback: "Estimated payback", source: "Source", page: "Page", referrer: "Referrer",
      utm: "Campaign", device: "Device", next: "Suggested next step", none: "-",
      years: "years", footer: "Generated automatically by the HOMYVEST website. Calculator figures are the visitor's own rough gross estimates.",
      nextBuild: "Call or WhatsApp within one working day. Confirm the land size, location and rules, then book a site survey and a feasibility check with Behomy's data. HomyEight prepares a free design concept and cost estimate.",
      nextNeedsOps: "Introduce Behomy's operating options (Full Management starts with a free trial period and no upfront management fee). Ask for the property address, room count and current occupancy.",
      nextNeedsFeas: "Book a site check. Explain what HOMYVEST looks at (rules, location, demand) and that design concepts and cost estimates are free.",
    },
  },
  id: {
    funding: { bank_loan: "Pinjaman bank / lembaga keuangan", personal_funds: "Dana pribadi", no_funds: "Belum ada dana pembangunan" },
    owned: { kost: "Kos / coliving", apartment: "Apartemen", house: "Rumah", shophouse: "Ruko", hotel: "Hotel / guesthouse", vacant_land: "Lahan kosong", unfinished_building: "Bangunan belum selesai", other: "Lainnya" },
    build: { kost: "Kos / coliving", hybrid_stay: "Hunian hybrid / guesthouse", apartment: "Apartemen", rental_houses: "Rumah sewa / townhouse", mixed_use: "Mixed-use", commercial: "Komersial (kafe, kantor, olahraga)", not_sure: "Belum yakin", other: "Lainnya" },
    need: { rent_out: "Ingin menyewakan apartemen atau rumah", manage_kost: "Butuh bantuan mengelola kos", raise_occupancy: "Ingin meningkatkan okupansi kos", feasibility: "Punya properti strategis dan ingin studi kelayakan", other: "Lainnya" },
    city: { jakarta: "Jakarta", bodetabek: "Bodetabek", bandung: "Bandung", semarang: "Semarang", yogyakarta: "Yogyakarta", solo: "Solo", surabaya: "Surabaya", malang: "Malang", bali: "Bali", bandar_lampung: "Bandar Lampung", medan: "Medan", other: "Lainnya" },
    idea: { kos: "Kos-kosan", ruko: "Ruko", rumah: "Rumah sewa", gudang: "Gudang" },
    ui: {
      title: "Laporan prospek", submitted: "Dikirim", ref: "Referensi", contact: "Kontak", name: "Nama", phone: "Telepon",
      whatsapp: "WhatsApp", language: "Bahasa website", funding: "Sumber dana", property: "Tentang properti",
      owned: "Saat ini memiliki", build: "Ingin membangun", need: "Kebutuhan utama", cities: "Kota / wilayah",
      calc: "Cek lahan (dari kalkulator website)", land: "Lahan", rules: "Aturan", allowed: "Luas lantai yang diizinkan",
      idea: "Ide yang diminati", payback: "Perkiraan balik modal", source: "Sumber", page: "Halaman", referrer: "Perujuk",
      utm: "Kampanye", device: "Perangkat", next: "Saran langkah berikutnya", none: "-",
      years: "tahun", footer: "Dibuat otomatis oleh website HOMYVEST. Angka kalkulator adalah perkiraan kasar dan kotor dari pengunjung.",
      nextBuild: "Hubungi via telepon atau WhatsApp dalam satu hari kerja. Pastikan ukuran lahan, lokasi, dan aturannya, lalu jadwalkan survei lokasi dan studi kelayakan dengan data Behomy. HomyEight menyiapkan konsep desain dan estimasi biaya gratis.",
      nextNeedsOps: "Perkenalkan pilihan pengelolaan Behomy (Full Management diawali masa uji coba gratis tanpa biaya manajemen di muka). Tanyakan alamat properti, jumlah kamar, dan okupansi saat ini.",
      nextNeedsFeas: "Jadwalkan cek lokasi. Jelaskan apa yang dinilai HOMYVEST (aturan, lokasi, permintaan) dan bahwa konsep desain serta estimasi biaya gratis.",
    },
  },
};

const INK = rgb(0.043, 0.043, 0.039);
const MUTED = rgb(0.45, 0.45, 0.42);
const LINE = rgb(0.86, 0.855, 0.83);
const PAPER2 = rgb(0.95, 0.945, 0.925);

// ---------------------------------------------------------------- text helpers
const REPLACE: Record<string, string> = {
  "\u2018": "'", "\u2019": "'", "\u201C": '"', "\u201D": '"', "\u2013": "-", "\u2014": "-",
  "\u2026": "...", "\u00A0": " ", "\u2192": "->", "\u2248": "~", "\u2009": " ", "\u202F": " ",
  "\u00B2": "2", "\u00D7": "x",   // superscript/multiply glyphs are unreliable in non-embedded fonts
};

function makeCleaner(font: PDFFont) {
  const ok = new Map<string, boolean>();
  return (input: unknown): string =>
    [...String(input ?? "")].map((ch) => REPLACE[ch] ?? ch).map((ch) => {
      if (ch === "\n") return " ";
      if (!ok.has(ch)) {
        try { font.widthOfTextAtSize(ch, 10); ok.set(ch, true); } catch { ok.set(ch, false); }
      }
      return ok.get(ch) ? ch : "?";
    }).join("");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) { line = test; continue; }
    if (line) lines.push(line);
    if (font.widthOfTextAtSize(w, size) <= maxWidth) { line = w; continue; }
    let chunk = "";                                   // hard-break very long words (URLs)
    for (const ch of w) {
      if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) { lines.push(chunk); chunk = ch; } else chunk += ch;
    }
    line = chunk;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function addLink(page: PDFPage, x: number, y: number, w: number, h: number, url: string) {
  const ctx = page.doc.context;
  const annot = ctx.register(ctx.obj({
    Type: "Annot", Subtype: "Link", Rect: [x, y, x + w, y + h], Border: [0, 0, 0],
    A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
  }));
  page.node.addAnnot(annot);
}

// ---------------------------------------------------------------- formatting helpers
export function formatDate(iso: string, lang: Lang, timeZone = "Asia/Jakarta"): string {
  const d = new Date(iso);
  const s = new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
    timeZone, day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d);
  return `${s} WIB`;
}

export function reportFileName(lead: Pick<LeadRow, "created_at" | "name" | "phone" | "funding">, timeZone = "Asia/Jakarta"): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(lead.created_at)).map((p) => [p.type, p.value]));
  const stamp = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}${parts.minute}`;
  const safe = (s: string) => s.replace(/[\\/:*?"<>|\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  const funding = { bank_loan: "bank loan", personal_funds: "personal funds", no_funds: "no funds" }[lead.funding];
  return `${stamp} - ${safe(lead.name)} - ${lead.phone} - ${funding}.pdf`;
}

const nf = (lang: Lang, digits = 0) =>
  new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US", { maximumFractionDigits: digits });

function listOf(keys: string[] | undefined | null, dict: Record<string, string>, other?: string | null): string {
  const items = (keys ?? []).map((k) => (k === "other" && other ? `${dict.other}: ${other}` : dict[k] ?? k));
  return items.length ? items.join(", ") : "-";
}

// ---------------------------------------------------------------- main
export async function buildReportPdf(lead: LeadRow, opts: { lang?: Lang; timeZone?: string } = {}): Promise<Uint8Array> {
  const lang: Lang = opts.lang ?? "en";
  const L = LABELS[lang];
  const ui = L.ui;
  const tz = opts.timeZone ?? "Asia/Jakarta";

  const pdf = await PDFDocument.create();
  pdf.setTitle(`HOMYVEST ${ui.title} - ${lead.name}`);
  pdf.setAuthor("HOMYVEST website");
  pdf.setCreator("HOMYVEST generate-report");
  pdf.setCreationDate(new Date(lead.created_at));

  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ital = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const clean = makeCleaner(reg);

  const W = 595.28, H = 841.89, M = 48, CW = W - M * 2, LABEL_W = 150;
  let page = pdf.addPage([W, H]);
  let y = H - M;

  const newPageIfNeeded = (need: number) => {
    if (y - need < M + 40) { page = pdf.addPage([W, H]); y = H - M; }
  };

  // Header
  page.drawText("HOMYVEST", { x: M, y: y - 22, size: 26, font: bold, color: INK });
  page.drawText(clean(ui.title.toUpperCase()), { x: M, y: y - 40, size: 9, font: bold, color: MUTED });
  const sub = clean(`${ui.submitted}: ${formatDate(lead.created_at, lang, tz)}`);
  const ref = clean(`${ui.ref}: ${lead.id.slice(0, 8).toUpperCase()}`);
  page.drawText(sub, { x: W - M - reg.widthOfTextAtSize(sub, 9), y: y - 14, size: 9, font: reg, color: INK });
  page.drawText(ref, { x: W - M - reg.widthOfTextAtSize(ref, 9), y: y - 28, size: 9, font: reg, color: MUTED });
  y -= 56;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1.2, color: INK });
  y -= 22;

  const section = (title: string) => {
    newPageIfNeeded(40);
    page.drawText(clean(title.toUpperCase()), { x: M, y, size: 8.5, font: bold, color: MUTED });
    y -= 8;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: LINE });
    y -= 16;
  };

  const row = (label: string, value: string, link?: string) => {
    const lines = wrap(clean(value || ui.none), reg, 10.5, CW - LABEL_W);
    newPageIfNeeded(lines.length * 14 + 6);
    page.drawText(clean(label), { x: M, y, size: 9.5, font: bold, color: INK });
    lines.forEach((ln, i) => {
      page.drawText(ln, { x: M + LABEL_W, y: y - i * 14, size: 10.5, font: reg, color: INK });
      if (link && i === 0) addLink(page, M + LABEL_W, y - 3, reg.widthOfTextAtSize(ln, 10.5), 13, link);
    });
    y -= lines.length * 14 + 6;
  };

  // Contact
  section(ui.contact);
  row(ui.name, lead.name);
  row(ui.phone, lead.phone);
  const wa = `https://wa.me/${lead.phone.replace(/\D/g, "")}`;
  row(ui.whatsapp, wa, wa);
  row(ui.language, lead.lang === "id" ? "Bahasa Indonesia" : "English");
  y -= 6;

  // Funding + property
  section(ui.property);
  row(ui.funding, L.funding[lead.funding] ?? lead.funding);
  if (lead.funding === "no_funds") {
    row(ui.need, lead.need === "other" && lead.need_other ? `${L.need.other}: ${lead.need_other}` : (L.need[lead.need ?? ""] ?? "-"));
  } else {
    row(ui.owned, listOf(lead.owned_assets, L.owned, lead.owned_other));
    row(ui.build, listOf(lead.build_types, L.build, lead.build_other));
  }
  row(ui.cities, listOf(lead.cities, L.city, lead.city_other));
  y -= 6;

  // Calculator snapshot (optional)
  const c = lead.calc;
  if (c && c.P && c.L) {
    section(ui.calc);
    const n0 = nf(lang), n2 = nf(lang, 2), n1 = nf(lang, 1);
    row(ui.land, `${n2.format(c.P)} x ${n2.format(c.L)} m (${n0.format(c.A ?? c.P * c.L)} m²)`);
    row(ui.rules, `KDB ${n1.format(c.kdb ?? 0)}%, KLB ${n2.format(c.klb ?? 0)}x, KDH ${n1.format(c.kdh ?? 0)}%` +
      (c.maxFloors ? (lang === "id" ? `, maks. ${c.maxFloors} lantai` : `, max ${c.maxFloors} floors`) : ""));
    if (typeof c.floorArea === "number") row(ui.allowed, `${n0.format(c.floorArea)} m²`);
    if (c.idea) row(ui.idea, L.idea[c.idea] ?? c.idea);
    if (typeof c.paybackYears === "number") row(ui.payback, `${n1.format(c.paybackYears)} ${ui.years}`);
    y -= 6;
  }

  // Suggested next step (boxed)
  const nextText = lead.funding !== "no_funds" ? ui.nextBuild
    : lead.need === "feasibility" || lead.need === "other" ? ui.nextNeedsFeas : ui.nextNeedsOps;
  const nextLines = wrap(clean(nextText), reg, 10.5, CW - 24);
  const boxH = 30 + nextLines.length * 14;
  newPageIfNeeded(boxH + 10);
  page.drawRectangle({ x: M, y: y - boxH + 12, width: CW, height: boxH, color: PAPER2 });
  page.drawText(clean(ui.next.toUpperCase()), { x: M + 12, y: y - 4, size: 8.5, font: bold, color: MUTED });
  nextLines.forEach((ln, i) => page.drawText(ln, { x: M + 12, y: y - 22 - i * 14, size: 10.5, font: reg, color: INK }));
  y -= boxH + 16;

  // Source
  section(ui.source);
  const s = lead.source ?? {};
  row(ui.page, s.page ?? "-");
  row(ui.referrer, s.referrer || "-");
  const utm = s.utm && Object.keys(s.utm).length ? Object.entries(s.utm).map(([k, v]) => `${k}=${v}`).join(", ") : "-";
  row(ui.utm, utm);
  row(ui.device, (lead.user_agent ?? "-").slice(0, 160));

  // Footer on every page
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const f = clean(`${ui.footer}  ·  ID ${lead.id}`);
    const lines = wrap(f, ital, 7.5, CW - 40);
    lines.forEach((ln, j) => p.drawText(ln, { x: M, y: M - 10 - j * 10, size: 7.5, font: ital, color: MUTED }));
    const pn = `${i + 1}/${pages.length}`;
    p.drawText(pn, { x: W - M - reg.widthOfTextAtSize(pn, 7.5), y: M - 10, size: 7.5, font: reg, color: MUTED });
  });

  return await pdf.save();
}
```

## `supabase/functions/generate-report/drive.ts`
```ts
// Google Drive upload for the HOMYVEST report function.
// Two auth modes (set GDRIVE_AUTH_MODE):
//   "oauth"           -> personal Gmail. Uses GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN,
//                        scope drive.file. Files go to a folder the app creates in your My Drive
//                        (GDRIVE_FOLDER_NAME, default "HOMYVEST Leads"), unless GDRIVE_FOLDER_ID is set
//                        to a folder this same app created.
//   "service_account" -> Google Workspace with a Shared Drive. Uses GOOGLE_SERVICE_ACCOUNT_JSON_B64
//                        (base64 of the JSON key) and GDRIVE_FOLDER_ID (a folder inside a Shared Drive
//                        where the service account is a Content manager).
// Never logs secrets.

type Env = (key: string) => string | undefined;

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

let tokenCache: { token: string; exp: number } | null = null;
let folderCache: string | null = null;

export function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function signServiceAccountJwt(
  sa: { client_email: string; private_key: string; token_uri?: string },
  scope: string,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<string> {
  const enc = new TextEncoder();
  const header = base64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = base64url(enc.encode(JSON.stringify({
    iss: sa.client_email, scope, aud: sa.token_uri ?? TOKEN_URL, iat: nowSec, exp: nowSec + 3600,
  })));
  const input = `${header}.${claims}`;
  const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(input)));
  return `${input}.${base64url(sig)}`;
}

export function buildMultipart(metadata: Record<string, unknown>, file: Uint8Array, mime: string, boundary: string): Uint8Array {
  const enc = new TextEncoder();
  const head = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
  );
  const tail = enc.encode(`\r\n--${boundary}--\r\n`);
  const out = new Uint8Array(head.length + file.length + tail.length);
  out.set(head, 0); out.set(file, head.length); out.set(tail, head.length + file.length);
  return out;
}

async function postForm(url: string, form: Record<string, string>): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google token request failed (${res.status}): ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

function mode(env: Env): "oauth" | "service_account" {
  const m = (env("GDRIVE_AUTH_MODE") ?? "oauth").trim().toLowerCase();
  if (m !== "oauth" && m !== "service_account") throw new Error(`GDRIVE_AUTH_MODE must be "oauth" or "service_account"`);
  return m;
}

export async function getAccessToken(env: Env): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;
  let res: { access_token: string; expires_in: number };
  if (mode(env) === "oauth") {
    const id = env("GOOGLE_CLIENT_ID"), secret = env("GOOGLE_CLIENT_SECRET"), refresh = env("GOOGLE_REFRESH_TOKEN");
    if (!id || !secret || !refresh) throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN");
    res = await postForm(TOKEN_URL, { client_id: id, client_secret: secret, refresh_token: refresh, grant_type: "refresh_token" });
  } else {
    const b64 = env("GOOGLE_SERVICE_ACCOUNT_JSON_B64");
    if (!b64) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON_B64");
    const sa = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64.trim()), (c) => c.charCodeAt(0))));
    const jwt = await signServiceAccountJwt(sa, "https://www.googleapis.com/auth/drive");
    res = await postForm(sa.token_uri ?? TOKEN_URL, { grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt });
  }
  tokenCache = { token: res.access_token, exp: Date.now() + res.expires_in * 1000 };
  return res.access_token;
}

async function driveJson(url: string, token: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

export async function ensureFolder(env: Env, token: string): Promise<string> {
  const configured = env("GDRIVE_FOLDER_ID")?.trim();
  if (configured) return configured;
  if (mode(env) === "service_account") {
    throw new Error("GDRIVE_FOLDER_ID is required in service_account mode (a folder inside a Shared Drive)");
  }
  if (folderCache) return folderCache;
  const name = (env("GDRIVE_FOLDER_NAME") ?? "HOMYVEST Leads").trim();
  const q = `name = '${name.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const found = await driveJson(`${DRIVE}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1&spaces=drive`, token);
  if (found.files?.length) return (folderCache = found.files[0].id as string);
  const created = await driveJson(`${DRIVE}/files?fields=id`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder" }),
  });
  return (folderCache = created.id as string);
}

export async function uploadPdfToDrive(env: Env, bytes: Uint8Array, fileName: string): Promise<{ id: string; webViewLink?: string }> {
  const token = await getAccessToken(env);
  const folderId = await ensureFolder(env, token);
  const boundary = `homyvest_${crypto.randomUUID().replace(/-/g, "")}`;
  const body = buildMultipart({ name: fileName, mimeType: "application/pdf", parents: [folderId] }, bytes, "application/pdf", boundary);
  return await driveJson(`${UPLOAD}?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink`, token, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body: body as unknown as BodyInit,   // Uint8Array is a valid body; the cast only satisfies strict DOM typings
  });
}
```

## `supabase/.env.secrets.example`
```bash
# Copy to supabase/.env.secrets (git-ignored), fill in, then run:
#   npx supabase secrets set --env-file supabase/.env.secrets
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided to the function automatically. Do not add them here.

# Long random string. Use the SAME value in the Vault secret "report_webhook_secret" (setup step A8).
REPORT_WEBHOOK_SECRET=

# "oauth" for a personal Gmail Drive, "service_account" for a Google Workspace Shared Drive
GDRIVE_AUTH_MODE=oauth

# --- oauth mode (personal Gmail) ---
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
# Folder the app creates in your My Drive on the first report (leave GDRIVE_FOLDER_ID empty in oauth mode)
GDRIVE_FOLDER_NAME=HOMYVEST Leads

# --- service_account mode (Workspace Shared Drive) ---
# base64 of the downloaded JSON key file
GOOGLE_SERVICE_ACCOUNT_JSON_B64=
# ID of a folder inside the Shared Drive (the part after /folders/ in its URL)
GDRIVE_FOLDER_ID=

# Report options
REPORT_LANGUAGE=en
REPORT_TIMEZONE=Asia/Jakarta
```

## `.env.example`
```bash
# Copy to .env.local (git-ignored). On your host (Vercel/Netlify), add the same two variables in the project settings.
# Use the PUBLISHABLE (anon) key only. Never put the service_role / secret key in the website.
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

## `scripts/check-secrets.mjs`
```js
// Fails (exit 1) if staged (or all tracked) files contain secrets or secret files.
// Usage: node scripts/check-secrets.mjs --staged   (pre-commit)
//        node scripts/check-secrets.mjs --all      (whole repo audit)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const mode = process.argv.includes('--all') ? 'all' : 'staged';
const files = (mode === 'all'
  ? execSync('git ls-files', { encoding: 'utf8' })
  : execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' }))
  .split('\n').map((s) => s.trim()).filter(Boolean);

const SELF = path.normalize('scripts/check-secrets.mjs');

// File names that must never be committed
const BAD_NAMES = [
  /(^|\/)\.env(\.[^/]*)?$/,                 // .env, .env.local, .env.production …
  /(^|\/)supabase\/\.env[^/]*$/,            // supabase/.env.secrets
  /\.pem$/i, /\.p12$/i, /\.key$/i,
  /service[-_]?account[^/]*\.json$/i, /credentials[^/]*\.json$/i, /client_secret[^/]*\.json$/i,
];
const ALLOWED_NAMES = [/\.example$/i];

// Content patterns (built from parts so this file doesn't match itself)
const P = (...parts) => new RegExp(parts.join(''));
const BAD_CONTENT = [
  ['Supabase secret key', P('sb_', 'secret_', '[A-Za-z0-9_-]{16,}')],
  ['JWT (service_role or anon key)', P('eyJhbGciOi', '[A-Za-z0-9_-]{20,}\\.', '[A-Za-z0-9_-]{20,}')],
  ['Private key', P('-----BEGIN ', '(RSA |EC )?', 'PRIVATE KEY-----')],
  ['Google OAuth client secret', P('GOC', 'SPX-', '[A-Za-z0-9_-]{20,}')],
  ['Google refresh token', P('1\\/\\/0', '[A-Za-z0-9_-]{30,}')],
  ['Google service account JSON', P('"type"\\s*:\\s*"service', '_account"')],
  ['Filled secret variable', P('^(REPORT_WEBHOOK_SECRET|GOOGLE_CLIENT_SECRET|GOOGLE_REFRESH_TOKEN|GOOGLE_SERVICE_ACCOUNT_JSON_B64|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN)\\s*=\\s*\\S{8,}')],
];

const problems = [];
for (const f of files) {
  const norm = path.normalize(f);
  if (norm === SELF) continue;
  if (BAD_NAMES.some((r) => r.test(f)) && !ALLOWED_NAMES.some((r) => r.test(f))) {
    problems.push(`${f}: secret file must not be committed`);
    continue;
  }
  if (!fs.existsSync(f) || fs.statSync(f).size > 2_000_000) continue;
  const buf = fs.readFileSync(f);
  if (buf.includes(0)) continue;                         // binary
  const lines = buf.toString('utf8').split('\n');
  lines.forEach((line, i) => {
    for (const [name, re] of BAD_CONTENT) {
      if (re.test(line)) problems.push(`${f}:${i + 1}: looks like a ${name}`);
    }
  });
}

if (problems.length) {
  console.error('Secret check FAILED:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}
console.log(`Secret check passed (${files.length} ${mode} file${files.length === 1 ? '' : 's'}).`);
```

## `scripts/gdrive-auth.mjs`
```js
// One-time helper (run by the owner, on their own computer) to get a Google Drive refresh token
// for GDRIVE_AUTH_MODE=oauth. No dependencies.
//
//   npm run gdrive:auth            -> prints the refresh token
//   npm run gdrive:auth -- --write -> also writes it into supabase/.env.secrets
//
// Reads GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET from the environment or from supabase/.env.secrets.
// Scope: drive.file (the app can only see files and folders it created).
import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';

const SECRETS = 'supabase/.env.secrets';
const PORT = 53682;
const REDIRECT = `http://127.0.0.1:${PORT}/callback`;
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(fs.readFileSync(file, 'utf8').split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]));
}
const fileEnv = readEnvFile(SECRETS);
const clientId = process.env.GOOGLE_CLIENT_ID || fileEnv.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || fileEnv.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error(`Put GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in ${SECRETS} first (see HUMAN_SETUP, step B).`);
  process.exit(1);
}

const b64u = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const verifier = b64u(crypto.randomBytes(48));
const challenge = b64u(crypto.createHash('sha256').update(verifier).digest());
const state = b64u(crypto.randomBytes(16));

const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: clientId, redirect_uri: REDIRECT, response_type: 'code', scope: SCOPE,
  access_type: 'offline', prompt: 'consent', state, code_challenge: challenge, code_challenge_method: 'S256',
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (url.pathname !== '/callback') { res.writeHead(404).end(); return; }
  const done = (code, msg) => { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' }).end(`<p style="font:16px system-ui">${msg}</p>`); };
  if (url.searchParams.get('state') !== state) { done(400, 'State mismatch. Close this tab and run the command again.'); return; }
  const code = url.searchParams.get('code');
  if (!code) { done(400, `Google said: ${url.searchParams.get('error') ?? 'no code'}`); return; }
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: REDIRECT, grant_type: 'authorization_code', code_verifier: verifier }),
    });
    const json = await r.json();
    if (!json.refresh_token) throw new Error(JSON.stringify(json));
    done(200, 'Done. You can close this tab and go back to the terminal.');
    if (process.argv.includes('--write')) {
      let text = fs.existsSync(SECRETS) ? fs.readFileSync(SECRETS, 'utf8') : '';
      text = /^GOOGLE_REFRESH_TOKEN=.*$/m.test(text)
        ? text.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, `GOOGLE_REFRESH_TOKEN=${json.refresh_token}`)
        : `${text.trimEnd()}\nGOOGLE_REFRESH_TOKEN=${json.refresh_token}\n`;
      fs.writeFileSync(SECRETS, text);
      console.log(`\nSaved GOOGLE_REFRESH_TOKEN into ${SECRETS} (this file is git-ignored).`);
    } else {
      console.log(`\nYour refresh token (paste it into ${SECRETS} as GOOGLE_REFRESH_TOKEN, keep it private):\n\n${json.refresh_token}\n`);
    }
  } catch (e) {
    done(500, 'Token exchange failed. See the terminal.');
    console.error('Token exchange failed:', e.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Opening Google sign-in. Sign in with the account whose Google Drive should receive the reports.');
  console.log(`If the browser doesn't open, paste this link into it:\n\n${authUrl}\n`);
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
  exec(`${opener} "${authUrl}"`, () => {});
});
```

## `.githooks/pre-commit`
```sh
#!/bin/sh
# Blocks commits that contain secrets. Installed with: git config core.hooksPath .githooks
node scripts/check-secrets.mjs --staged || {
  echo "Commit blocked: a secret or a secret file is staged. Remove it (git restore --staged <file>) and try again."
  exit 1
}
```

## `reference/leads/leads.ts`
```ts
// HOMYVEST lead funnel: data layer (no UI). Copy to src/lib/leads/leads.ts.
// Enum values MUST match supabase/migrations/*_homyvest_leads.sql (a test checks this).
import { potential, ideas, rank, type Land, type Ideas, type IdeaKey } from "../calc/calc.ts";

export type Lang = "en" | "id";
export const FUNDING = ["bank_loan", "personal_funds", "no_funds"] as const;
export const OWNED = ["kost", "apartment", "house", "shophouse", "hotel", "vacant_land", "unfinished_building", "other"] as const;
export const BUILD = ["kost", "hybrid_stay", "apartment", "rental_houses", "mixed_use", "commercial", "not_sure", "other"] as const;
export const NEEDS = ["rent_out", "manage_kost", "raise_occupancy", "feasibility", "other"] as const;
export const CITIES = ["jakarta", "bodetabek", "bandung", "semarang", "yogyakarta", "solo", "surabaya", "malang", "bali", "bandar_lampung", "medan", "other"] as const;
export type Funding = (typeof FUNDING)[number];

export const WHATSAPP_NUMBER = "6282110106088";

// Visitor-facing option labels (the funding options are the owner's exact wording).
export const OPTION_LABELS: Record<Lang, { funding: Record<string, string>; owned: Record<string, string>; build: Record<string, string>; need: Record<string, string>; city: Record<string, string> }> = {
  en: {
    funding: { bank_loan: "Loan from bank / financial institution", personal_funds: "Personal funds", no_funds: "Currently do not have funds for construction" },
    owned: { kost: "Kost / coliving", apartment: "Apartment", house: "House", shophouse: "Shophouse (ruko)", hotel: "Hotel / guesthouse", vacant_land: "Vacant land", unfinished_building: "Unfinished building", other: "Other" },
    build: { kost: "Kost / coliving", hybrid_stay: "Hybrid stay / guesthouse", apartment: "Apartment", rental_houses: "Rental houses / townhouses", mixed_use: "Mixed-use", commercial: "Café, office or sports venue", not_sure: "Not sure yet, help me decide", other: "Other" },
    need: { rent_out: "I want to rent out my apartment or house", manage_kost: "I need help running my boarding house", raise_occupancy: "I want more of my rooms filled", feasibility: "I have a property in a good location and want to know what it could become", other: "Something else" },
    city: { jakarta: "Jakarta", bodetabek: "Bodetabek", bandung: "Bandung", semarang: "Semarang", yogyakarta: "Yogyakarta", solo: "Solo", surabaya: "Surabaya", malang: "Malang", bali: "Bali", bandar_lampung: "Bandar Lampung", medan: "Medan", other: "Other" },
  },
  id: {
    funding: { bank_loan: "Pinjaman bank / lembaga keuangan", personal_funds: "Dana pribadi", no_funds: "Saat ini belum memiliki dana untuk pembangunan" },
    owned: { kost: "Kos / coliving", apartment: "Apartemen", house: "Rumah", shophouse: "Ruko", hotel: "Hotel / guesthouse", vacant_land: "Lahan kosong", unfinished_building: "Bangunan belum selesai", other: "Lainnya" },
    build: { kost: "Kos / coliving", hybrid_stay: "Hunian hybrid / guesthouse", apartment: "Apartemen", rental_houses: "Rumah sewa / townhouse", mixed_use: "Mixed-use", commercial: "Kafe, kantor, atau arena olahraga", not_sure: "Belum yakin, bantu saya memilih", other: "Lainnya" },
    need: { rent_out: "Saya ingin menyewakan apartemen atau rumah saya", manage_kost: "Saya butuh bantuan mengelola kos", raise_occupancy: "Saya ingin kamar saya lebih banyak terisi", feasibility: "Saya punya properti di lokasi strategis dan ingin tahu bisa dijadikan apa", other: "Hal lain" },
    city: { jakarta: "Jakarta", bodetabek: "Bodetabek", bandung: "Bandung", semarang: "Semarang", yogyakarta: "Yogyakarta", solo: "Solo", surabaya: "Surabaya", malang: "Malang", bali: "Bali", bandar_lampung: "Bandar Lampung", medan: "Medan", other: "Lainnya" },
  },
};

// ---------------------------------------------------------------- phone
/** Accepts "0812 3456 7890", "812-3456-7890", "+62 812 3456 7890", "6281234567890". Returns "+6281234567890" or null. */
export function normalizePhone(input: string): string | null {
  let d = String(input ?? "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (d.startsWith("620")) d = "62" + d.slice(3);       // "+62 0812..." typed after the +62 prefix
  else if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return /^628\d{7,11}$/.test(d) ? `+${d}` : null;
}

/** "+6281234567890" -> "+62 812-3456-7890" */
export function formatPhoneDisplay(e164: string): string {
  const rest = e164.replace(/^\+62/, "");
  return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}${rest.length > 7 ? "-" + rest.slice(7) : ""}`;
}

// ---------------------------------------------------------------- form state
export type CalcSnapshot = {
  P: number; L: number; A: number; kdb: number; klb: number; kdh: number; maxFloors: number | null;
  floorArea: number; idea: IdeaKey | null; paybackYears: number | null;
};

export type LeadForm = {
  lang: Lang;
  phone: string;               // normalized "+628…"
  startId?: string | null;
  funding?: Funding | null;
  name: string;
  owned: string[]; ownedOther?: string;
  build: string[]; buildOther?: string;
  need?: string | null; needOther?: string;
  cities: string[]; cityOther?: string;
  calc?: CalcSnapshot | null;
  source?: { page?: string; referrer?: string; utm?: Record<string, string> };
  userAgent?: string;
  honeypot?: string;           // hidden field; bots fill it
  openedAt?: number;           // Date.now() when the funnel opened
};

export type FieldError = "required" | "invalid" | "tooLong" | "chooseOne";

export function isBuildPath(f: Pick<LeadForm, "funding">): boolean {
  return f.funding === "bank_loan" || f.funding === "personal_funds";
}

export function validateLead(f: LeadForm): Partial<Record<string, FieldError>> {
  const e: Partial<Record<string, FieldError>> = {};
  if (!normalizePhone(f.phone)) e.phone = "invalid";
  if (!f.funding || !(FUNDING as readonly string[]).includes(f.funding)) e.funding = "chooseOne";
  const name = (f.name ?? "").trim();
  if (name.length < 2) e.name = "required"; else if (name.length > 80) e.name = "tooLong";
  if (isBuildPath(f)) {
    if (!f.owned?.length) e.owned = "chooseOne";
    if (!f.build?.length) e.build = "chooseOne";
    if (f.owned?.includes("other") && !(f.ownedOther ?? "").trim()) e.ownedOther = "required";
    if (f.build?.includes("other") && !(f.buildOther ?? "").trim()) e.buildOther = "required";
  } else if (f.funding === "no_funds") {
    if (!f.need || !(NEEDS as readonly string[]).includes(f.need)) e.need = "chooseOne";
    if (f.need === "other" && !(f.needOther ?? "").trim()) e.needOther = "required";
  }
  if (!f.cities?.length) e.cities = "chooseOne";
  if (f.cities?.includes("other") && !(f.cityOther ?? "").trim()) e.cityOther = "required";
  for (const k of ["ownedOther", "buildOther", "cityOther"] as const) if ((f[k] ?? "").length > 120) e[k] = "tooLong";
  if ((f.needOther ?? "").length > 200) e.needOther = "tooLong";
  return e;
}

const clip = (s: string | undefined, n: number) => (s ?? "").trim().slice(0, n) || null;

/** Row for supabase.from('leads').insert(row). Only fields that belong to the chosen path are sent. */
export function toLeadRow(f: LeadForm) {
  const build = isBuildPath(f);
  return {
    start_id: f.startId ?? null,
    lang: f.lang,
    phone: normalizePhone(f.phone)!,
    funding: f.funding!,
    name: f.name.trim().slice(0, 80),
    owned_assets: build ? f.owned.filter((k) => (OWNED as readonly string[]).includes(k)) : [],
    owned_other: build && f.owned.includes("other") ? clip(f.ownedOther, 120) : null,
    build_types: build ? f.build.filter((k) => (BUILD as readonly string[]).includes(k)) : [],
    build_other: build && f.build.includes("other") ? clip(f.buildOther, 120) : null,
    need: build ? null : (f.need ?? null),
    need_other: !build && f.need === "other" ? clip(f.needOther, 200) : null,
    cities: f.cities.filter((k) => (CITIES as readonly string[]).includes(k)),
    city_other: f.cities.includes("other") ? clip(f.cityOther, 80) : null,
    calc: f.calc ?? null,
    source: f.source ?? {},
    user_agent: (f.userAgent ?? "").slice(0, 400) || null,
  };
}

/** Snapshot of the calculator, attached to the lead only if the visitor actually used it. */
export function calcSnapshot(land: Land, ideaInputs: Ideas, selected: IdeaKey | null): CalcSnapshot | null {
  const r = potential(land);
  if (!r) return null;
  const res = ideas(r, ideaInputs);
  const pick = selected ? res[selected] : rank(res).fastest;
  return {
    P: r.P, L: r.L, A: r.A, kdb: r.kdb, klb: r.klb, kdh: r.kdh,
    maxFloors: Number(land.maxFloors) > 0 ? Number(land.maxFloors) : null,
    floorArea: r.floorArea,
    idea: pick && pick.payback !== null ? pick.key : null,
    paybackYears: pick && pick.payback !== null ? Math.round(pick.payback * 10) / 10 : null,
  };
}

// ---------------------------------------------------------------- WhatsApp (thank-you screen + fallback when saving fails)
export function buildLeadWhatsAppMessage(f: LeadForm, lang: Lang = f.lang): string {
  const L = OPTION_LABELS[lang];
  const list = (keys: string[], dict: Record<string, string>, other?: string) =>
    keys.map((k) => (k === "other" && other?.trim() ? `${dict.other} (${other.trim()})` : dict[k] ?? k)).join(", ");
  const id = lang === "id";
  const lines = [id ? "Halo HOMYVEST! Saya baru mengisi formulir di website Anda." : "Hi HOMYVEST! I just filled in the form on your website."];
  if (f.name?.trim()) lines.push(`• ${id ? "Nama" : "Name"}: ${f.name.trim()}`);
  if (f.funding) lines.push(`• ${id ? "Sumber dana" : "Funding"}: ${L.funding[f.funding]}`);
  if (isBuildPath(f)) {
    if (f.owned?.length) lines.push(`• ${id ? "Properti saya" : "I own"}: ${list(f.owned, L.owned, f.ownedOther)}`);
    if (f.build?.length) lines.push(`• ${id ? "Ingin membangun" : "I'd like to build"}: ${list(f.build, L.build, f.buildOther)}`);
  } else if (f.need) {
    lines.push(`• ${id ? "Kebutuhan" : "What I need"}: ${f.need === "other" && f.needOther?.trim() ? f.needOther.trim() : L.need[f.need]}`);
  }
  if (f.cities?.length) lines.push(`• ${id ? "Kota" : "City"}: ${list(f.cities, L.city, f.cityOther)}`);
  lines.push(id ? "Mohon hubungi saya untuk konsultasi." : "Please get in touch for a consultation.");
  return lines.join("\n");
}

export const whatsAppUrl = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// ---------------------------------------------------------------- submit
type InsertClient = { from: (t: string) => { insert: (row: unknown) => PromiseLike<{ error: { message: string; code?: string } | null }> } };

export type SubmitResult =
  | { ok: true; spam?: boolean }
  | { ok: false; reason: "invalid"; errors: Partial<Record<string, FieldError>> }
  | { ok: false; reason: "not_configured" | "rate_limited" | "failed" };

export async function submitLead(client: InsertClient | null, f: LeadForm, now = Date.now()): Promise<SubmitResult> {
  if ((f.honeypot ?? "").trim() || (f.openedAt && now - f.openedAt < 1500)) return { ok: true, spam: true }; // look successful to bots
  const errors = validateLead(f);
  if (Object.keys(errors).length) return { ok: false, reason: "invalid", errors };
  if (!client) return { ok: false, reason: "not_configured" };
  try {
    const { error } = await client.from("leads").insert(toLeadRow(f));
    if (!error) return { ok: true };
    return { ok: false, reason: /rate_limited/.test(error.message) ? "rate_limited" : "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/** Fire-and-forget: records that a phone number was entered in the hero (so abandoned funnels aren't lost). */
export async function recordLeadStart(client: InsertClient | null, row: { id: string; phone: string; lang: Lang; source?: unknown }): Promise<void> {
  if (!client) return;
  try { await client.from("lead_starts").insert({ id: row.id, phone: row.phone, lang: row.lang, source: row.source ?? {} }); } catch { /* ignore */ }
}

export function collectSource(loc: { href: string; search: string }, referrer: string) {
  const utm: Record<string, string> = {};
  const params = new URLSearchParams(loc.search);
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = params.get(k);
    if (v) utm[k] = v.slice(0, 100);
  }
  return { page: loc.href.split("#")[0].slice(0, 300), referrer: (referrer ?? "").slice(0, 300), utm };
}
```

## `reference/leads/leads.test.ts`
```ts
// Copy to src/lib/leads/leads.test.ts. Requires devDependency "pdf-lib" and the vitest alias
// { 'npm:pdf-lib@1.17.1': 'pdf-lib' } (see updates/U01/U01_03_BACKEND.md §7).
import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  normalizePhone, formatPhoneDisplay, validateLead, toLeadRow, buildLeadWhatsAppMessage, whatsAppUrl,
  submitLead, collectSource, calcSnapshot, FUNDING, OWNED, BUILD, NEEDS, CITIES, OPTION_LABELS, type LeadForm,
} from "./leads.ts";
import { buildReportPdf, reportFileName, LABELS } from "../../../supabase/functions/generate-report/report.ts";
import { signServiceAccountJwt, buildMultipart, ensureFolder, getAccessToken, base64url } from "../../../supabase/functions/generate-report/drive.ts";

const base: LeadForm = {
  lang: "en", phone: "+6281234567890", funding: "bank_loan", name: "Budi Santoso",
  owned: ["vacant_land"], build: ["hybrid_stay", "not_sure"], cities: ["bodetabek"],
};

describe("phone", () => {
  it.each([
    ["0812 3456 7890", "+6281234567890"], ["812-3456-7890", "+6281234567890"], ["+62 812 3456 7890", "+6281234567890"],
    ["6281234567890", "+6281234567890"], ["+62 0812 3456 789", "+628123456789"], ["08123456", null], ["0212345678", null], ["abc", null],
  ])("%s -> %s", (input, out) => expect(normalizePhone(input)).toBe(out));
  it("formats for display", () => expect(formatPhoneDisplay("+6281234567890")).toBe("+62 812-3456-7890"));
});

describe("validation and payload", () => {
  it("build path needs owned + build", () => {
    expect(validateLead({ ...base, owned: [], build: [] })).toMatchObject({ owned: "chooseOne", build: "chooseOne" });
    expect(validateLead(base)).toEqual({});
  });
  it("no-funds path needs a need", () => {
    const f: LeadForm = { ...base, funding: "no_funds", owned: [], build: [], need: null };
    expect(validateLead(f)).toMatchObject({ need: "chooseOne" });
    expect(validateLead({ ...f, need: "feasibility" })).toEqual({});
  });
  it("'other' needs text", () => {
    expect(validateLead({ ...base, cities: ["other"] })).toMatchObject({ cityOther: "required" });
  });
  it("row only carries the chosen path", () => {
    const row = toLeadRow({ ...base, funding: "no_funds", need: "rent_out", owned: ["house"], build: ["kost"] });
    expect(row.owned_assets).toEqual([]); expect(row.build_types).toEqual([]); expect(row.need).toBe("rent_out");
    const row2 = toLeadRow(base);
    expect(row2.need).toBeNull(); expect(row2.owned_assets).toEqual(["vacant_land"]); expect(row2.phone).toBe("+6281234567890");
  });
});

describe("enums match the database migration", () => {
  const dir = path.resolve(process.cwd(), "supabase/migrations");
  const sql = fs.readdirSync(dir).filter((f) => f.endsWith("_homyvest_leads.sql")).map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
  it.each([["funding", FUNDING], ["owned", OWNED], ["build", BUILD], ["need", NEEDS], ["city", CITIES]])("%s values exist in SQL", (_n, list) => {
    for (const v of list as readonly string[]) expect(sql).toContain(`'${v}'`);
  });
  it("UI labels and report labels cover the same keys in both languages", () => {
    for (const lang of ["en", "id"] as const) {
      expect(Object.keys(OPTION_LABELS[lang].owned).sort()).toEqual([...OWNED].sort());
      expect(Object.keys(OPTION_LABELS[lang].build).sort()).toEqual([...BUILD].sort());
      expect(Object.keys(OPTION_LABELS[lang].need).sort()).toEqual([...NEEDS].sort());
      expect(Object.keys(OPTION_LABELS[lang].city).sort()).toEqual([...CITIES].sort());
      expect(Object.keys(LABELS[lang].owned).sort()).toEqual([...OWNED].sort());
      expect(Object.keys(LABELS[lang].build).sort()).toEqual([...BUILD].sort());
      expect(Object.keys(LABELS[lang].need).sort()).toEqual([...NEEDS].sort());
      expect(Object.keys(LABELS[lang].city).sort()).toEqual([...CITIES].sort());
    }
  });
});

describe("WhatsApp fallback", () => {
  it("summarises the answers", () => {
    const msg = buildLeadWhatsAppMessage({ ...base, owned: ["other"], ownedOther: "Gudang tua" });
    expect(msg).toContain("Budi Santoso"); expect(msg).toContain("Loan from bank / financial institution");
    expect(msg).toContain("Other (Gudang tua)"); expect(msg).toContain("Bodetabek");
    expect(whatsAppUrl(msg)).toMatch(/^https:\/\/wa\.me\/6282110106088\?text=Hi%20HOMYVEST/);
  });
  it("Indonesian", () => {
    expect(buildLeadWhatsAppMessage({ ...base, lang: "id", funding: "no_funds", need: "manage_kost" }))
      .toContain("Saya butuh bantuan mengelola kos");
  });
});

describe("submit", () => {
  const okClient = { from: () => ({ insert: async () => ({ error: null }) }) };
  it("inserts", async () => expect(await submitLead(okClient, base, 10_000)).toEqual({ ok: true }));
  it("maps rate limit", async () => {
    const c = { from: () => ({ insert: async () => ({ error: { message: "rate_limited" } }) }) };
    expect(await submitLead(c, base)).toEqual({ ok: false, reason: "rate_limited" });
  });
  it("not configured", async () => expect(await submitLead(null, base)).toEqual({ ok: false, reason: "not_configured" }));
  it("honeypot looks successful", async () => expect(await submitLead(okClient, { ...base, honeypot: "x" })).toEqual({ ok: true, spam: true }));
  it("invalid", async () => expect((await submitLead(okClient, { ...base, name: "" })).ok).toBe(false));
});

describe("source + calc snapshot", () => {
  it("collects utm", () => {
    expect(collectSource({ href: "https://x.test/?utm_source=ig#top", search: "?utm_source=ig" }, "https://ig.com"))
      .toEqual({ page: "https://x.test/?utm_source=ig", referrer: "https://ig.com", utm: { utm_source: "ig" } });
  });
  it("snapshot from defaults picks kos at 6.6 years", () => {
    const snap = calcSnapshot({ P: 30, L: 20, kdb: 60, klb: 2, kdh: 20, maxFloors: "" }, {
      occ: 85, kos: { size: 18, rent: 1_200_000, cost: 4_500_000 }, ruko: { width: 4.5, rent: 70_000_000, cost: 5_000_000 },
      rumah: { land: 100, floor: 70, rent: 2_500_000, cost: 4_500_000 }, gudang: { rent: 50_000, cost: 3_500_000 },
    }, null)!;
    expect(snap).toMatchObject({ A: 600, floorArea: 1200, idea: "kos", paybackYears: 6.6, maxFloors: null });
  });
});

describe("PDF report", () => {
  const row = {
    id: "3f2a9c1e-0000-4000-8000-000000000001", created_at: "2026-11-21T07:32:00Z",
    ...toLeadRow({ ...base, calc: { P: 30, L: 20, A: 600, kdb: 60, klb: 2, kdh: 20, maxFloors: null, floorArea: 1200, idea: "kos", paybackYears: 6.6 } }),
  };
  it("builds a valid PDF in both languages, even with unusual characters", async () => {
    for (const lang of ["en", "id"] as const) {
      const bytes = await buildReportPdf({ ...row, name: "Budi “Ucok” Santoso 🙂 王" } as never, { lang });
      expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
      expect(bytes.length).toBeGreaterThan(2000);
      fs.mkdirSync("qa/tmp", { recursive: true });
      fs.writeFileSync(`qa/tmp/sample-report-${lang}.pdf`, bytes);
    }
  });
  it("names files predictably in Jakarta time", () => {
    expect(reportFileName(row as never)).toBe("2026-11-21 1432 - Budi Santoso - +6281234567890 - bank loan.pdf");
  });
});

describe("Drive helpers", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("signs a verifiable service-account JWT", async () => {
    const kp = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
    const pk = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
    const tag = (t: string) => `-----${t} PRIV` + `ATE KEY-----`;   // split so the secret scanner does not flag this test
    const pem = `${tag("BEGIN")}\n${btoa(String.fromCharCode(...pk)).replace(/(.{64})/g, "$1\n")}\n${tag("END")}\n`;
    const jwt = await signServiceAccountJwt({ client_email: "bot@x.iam.gserviceaccount.com", private_key: pem }, "scope", 1000);
    const [h, c, s] = jwt.split(".");
    const sig = Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (s.length % 4)) % 4)), (ch) => ch.charCodeAt(0));
    expect(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", kp.publicKey, sig, new TextEncoder().encode(`${h}.${c}`))).toBe(true);
    expect(JSON.parse(atob(c.replace(/-/g, "+").replace(/_/g, "/")))).toMatchObject({ iss: "bot@x.iam.gserviceaccount.com", exp: 4600 });
  });
  it("builds multipart bodies", () => {
    const body = new TextDecoder().decode(buildMultipart({ name: "a.pdf" }, new TextEncoder().encode("PDF"), "application/pdf", "B"));
    expect(body).toBe('--B\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{"name":"a.pdf"}\r\n--B\r\nContent-Type: application/pdf\r\n\r\nPDF\r\n--B--\r\n');
    expect(base64url(new Uint8Array([251, 255]))).toBe("-_8");
  });
  it("oauth token + creates the folder when missing", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url.split("?")[0]}`);
      if (url.includes("oauth2")) return new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }));
      if (init?.method === "POST") return new Response(JSON.stringify({ id: "folder123" }));
      return new Response(JSON.stringify({ files: [] }));
    });
    const env = (k: string) => ({ GDRIVE_AUTH_MODE: "oauth", GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "s", GOOGLE_REFRESH_TOKEN: "r" } as Record<string, string>)[k];
    const token = await getAccessToken(env);
    expect(token).toBe("t");
    expect(await ensureFolder(env, token)).toBe("folder123");
    expect(calls).toEqual(["POST https://oauth2.googleapis.com/token", "GET https://www.googleapis.com/drive/v3/files", "POST https://www.googleapis.com/drive/v3/files"]);
  });
  it("service account mode requires a folder id", async () => {
    const env = (k: string) => ({ GDRIVE_AUTH_MODE: "service_account" } as Record<string, string>)[k];
    await expect(ensureFolder(env, "t")).rejects.toThrow(/GDRIVE_FOLDER_ID/);
  });
});
```

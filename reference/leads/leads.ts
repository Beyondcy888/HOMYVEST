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

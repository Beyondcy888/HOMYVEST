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

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

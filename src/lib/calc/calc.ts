export const EPS = 1e-9;
export const CAR_BAY = 12.5;
export const DRIVEWAY_SHARE = 0.5;

export type Lang = 'en' | 'id';
export type Land = { P: number; L: number; kdb: number; klb: number; kdh: number; maxFloors: number | '' };
export type Ideas = {
  occ: number;
  kos: { size: number; rent: number; cost: number };
  ruko: { width: number; rent: number; cost: number };
  rumah: { land: number; floor: number; rent: number; cost: number };
  gudang: { rent: number; cost: number };
};
export type Check = { fp: number; tfa: number; green: number };

const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) && x > 0 ? x : 0; }; // empty/negative -> 0
const pct = (v: unknown) => Math.min(100, n(v));                                                    // clamp 0..100

export type Potential = {
  P: number; L: number; A: number; kdb: number; klb: number; kdh: number;
  fp: number; greenMin: number; conflict: boolean; floorArea: number; capped: boolean;
  full: number; partial: number; open: number; cars: number;
};

export function potential(land: Land): Potential | null {
  const P = n(land.P), L = n(land.L), kdb = pct(land.kdb), klb = n(land.klb), kdh = pct(land.kdh);
  const maxF = n(land.maxFloors);
  const A = P * L;
  if (!(A > 0)) return null;
  const greenMin = A * kdh / 100;
  const conflict = kdb + kdh > 100;
  const fp = Math.max(0, Math.min(A * kdb / 100, A - greenMin));
  let floorArea = A * klb; let capped = false;
  if (maxF > 0 && maxF * fp < floorArea) { floorArea = maxF * fp; capped = true; }
  const full = fp > 0 ? Math.floor(floorArea / fp + EPS) : 0;
  let partial = Math.max(0, floorArea - full * fp);
  if (partial < 0.5) partial = 0;
  const open = Math.max(0, A - fp - greenMin);
  const cars = Math.floor(open * DRIVEWAY_SHARE / CAR_BAY);
  return { P, L, A, kdb, klb, kdh, fp, greenMin, conflict, floorArea, capped, full, partial, open, cars };
}

export type IdeaKey = 'kos' | 'ruko' | 'rumah' | 'gudang';
export type IdeaResult = {
  key: IdeaKey; units: number; built: number; perUnit?: number; fits: boolean;
  cost: number; income: number; payback: number | null; yieldPct: number | null;
};

export function ideas(r: Potential, I: Ideas): Record<IdeaKey, IdeaResult> {
  const occ = pct(I.occ) / 100;
  const finish = (key: IdeaKey, units: number, built: number, income: number, costPerM2: number, extra: Partial<IdeaResult> = {}): IdeaResult => {
    const fits = key === 'gudang' ? built > 0 : units > 0;
    const cost = built * n(costPerM2);
    const ok = fits && income > 0 && cost > 0;
    return { key, units, built, fits, cost, income, payback: ok ? cost / income : null, yieldPct: ok ? income / cost * 100 : null, ...extra };
  };
  const kosSize = n(I.kos.size);
  const kosUnits = kosSize > 0 ? Math.floor(r.floorArea / kosSize) : 0;
  const kos = finish('kos', kosUnits, kosUnits * kosSize, kosUnits * n(I.kos.rent) * 12 * occ, I.kos.cost);

  const rw = n(I.ruko.width);
  const rukoUnits = rw > 0 ? Math.floor(r.P / rw + EPS) : 0;
  const ruko = finish('ruko', rukoUnits, rukoUnits ? r.floorArea : 0, rukoUnits * n(I.ruko.rent) * occ, I.ruko.cost,
    { perUnit: rukoUnits ? r.floorArea / rukoUnits : 0 });

  const hl = n(I.rumah.land), hf = n(I.rumah.floor);
  const rumahUnits = hl > 0 && hf > 0 ? Math.min(Math.floor(r.A / hl), Math.floor(r.floorArea / hf)) : 0;
  const rumah = finish('rumah', rumahUnits, rumahUnits * hf, rumahUnits * n(I.rumah.rent) * 12 * occ, I.rumah.cost);

  const gBuilt = Math.min(r.fp, r.floorArea);
  const gudang = finish('gudang', gBuilt > 0 ? 1 : 0, gBuilt, gBuilt * n(I.gudang.rent) * 12 * occ, I.gudang.cost);
  return { kos, ruko, rumah, gudang };
}

export function rank(res: Record<IdeaKey, IdeaResult>) {
  const valid = Object.values(res).filter(x => x.payback !== null).sort((a, b) => a.payback! - b.payback!);
  const fastest = valid[0] ?? null;
  const second = valid[1] ?? null;
  const cheapest = valid.length ? [...valid].sort((a, b) => a.cost - b.cost)[0] : null;
  return { valid, fastest, second, cheapest: cheapest && fastest && cheapest.key !== fastest.key ? cheapest : null };
}

export function check(land: Land, c: Check) {
  const P = n(land.P), L = n(land.L), kdb = pct(land.kdb), klb = n(land.klb), kdh = pct(land.kdh);
  const A = P * L; if (!(A > 0)) return null;
  const fp = n(c.fp), tfa = n(c.tfa), green = n(c.green);
  const vKdb = fp / A * 100, vKlb = tfa / A, vKdh = green / A * 100;
  const okKdb = vKdb <= kdb + EPS, okKlb = vKlb <= klb + EPS, okKdh = vKdh >= kdh - EPS;
  const fpRoom = A * kdb / 100 - fp, faRoom = A * klb - tfa;
  const greenShort = Math.max(0, A * kdh / 100 - green);
  const leftover = A - fp - green;
  let answer: { kind: 'broken' | 'needFootprint' | 'many' | 'one' | 'smaller' | 'none'; extra: number };
  if (!okKdb || !okKlb || !okKdh) answer = { kind: 'broken', extra: 0 };
  else if (fp <= 0) answer = { kind: 'needFootprint', extra: 0 };
  else {
    const extra = Math.floor(faRoom / fp + EPS);
    answer = extra > 1 ? { kind: 'many', extra } : extra === 1 ? { kind: 'one', extra } : faRoom > 0 ? { kind: 'smaller', extra: 0 } : { kind: 'none', extra: 0 };
  }
  return { A, fp, tfa, green, vKdb, vKlb, vKdh, okKdb, okKlb, okKdh, fpRoom, faRoom, greenShort, leftover, answer };
}

// ---------- formatting ----------
const loc = (lang: Lang) => (lang === 'id' ? 'id-ID' : 'en-US');
export const fmtArea = (v: number, lang: Lang) => `${Math.round(v).toLocaleString(loc(lang))} m²`;
export const fmtPct = (v: number, lang: Lang) => `${v.toLocaleString(loc(lang), { maximumFractionDigits: 1 })}%`;
export const fmtKlb = (v: number, lang: Lang) => `${v.toLocaleString(loc(lang), { maximumFractionDigits: 2 })}×`;
export const fmtYears = (v: number, lang: Lang) =>
  `${v.toLocaleString(loc(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${lang === 'id' ? 'tahun' : 'years'}`;
export const fmtMoney = (v: number, lang: Lang) => `Rp ${Math.round(v).toLocaleString(loc(lang))}`;
export function fmtMoneyShort(v: number, lang: Lang) {
  const f = (x: number, d: number) => x.toLocaleString(loc(lang), { maximumFractionDigits: d });
  if (v >= 1e12) return `Rp ${f(v / 1e12, 2)} T`;
  if (v >= 1e9) return `Rp ${f(v / 1e9, 2)} ${lang === 'id' ? 'M' : 'B'}`;
  if (v >= 1e6) return `Rp ${f(v / 1e6, 0)} ${lang === 'id' ? 'jt' : 'M'}`;
  return fmtMoney(v, lang);
}

// Every case from docs/05 §10. These must stay green. Do not edit expected values.
import { describe, it, expect } from 'vitest';
import { potential, ideas, rank, check, fmtArea, fmtPct, fmtKlb, fmtYears, fmtMoney, fmtMoneyShort, type Land, type Ideas } from './calc.ts';
import { buildWhatsAppMessage, whatsAppUrl } from './whatsapp.ts';

const LAND: Land = { P: 30, L: 20, kdb: 60, klb: 2, kdh: 20, maxFloors: '' };
const IDEAS: Ideas = {
  occ: 85,
  kos: { size: 18, rent: 1_200_000, cost: 4_500_000 },
  ruko: { width: 4.5, rent: 70_000_000, cost: 5_000_000 },
  rumah: { land: 100, floor: 70, rent: 2_500_000, cost: 4_500_000 },
  gudang: { rent: 50_000, cost: 3_500_000 },
};
const CHECK = { fp: 240, tfa: 480, green: 150 };

describe('Step 1: potential (defaults)', () => {
  const r = potential(LAND)!;
  it('areas', () => {
    expect(r.A).toBe(600); expect(r.fp).toBe(360); expect(r.greenMin).toBe(120);
    expect(r.floorArea).toBe(1200); expect(r.open).toBe(120); expect(r.cars).toBe(4);
  });
  it('floors: 3 full + 120 m² partial', () => { expect(r.full).toBe(3); expect(r.partial).toBe(120); expect(r.capped).toBe(false); });
  it('split bar 60/20/20', () => {
    expect(Math.round((r.fp / r.A) * 100)).toBe(60);
    expect(Math.round((r.greenMin / r.A) * 100)).toBe(20);
    expect(Math.round((r.open / r.A) * 100)).toBe(20);
  });
});

describe('Step 1: variations', () => {
  it('maxFloors = 2 caps floor area', () => {
    const r = potential({ ...LAND, maxFloors: 2 })!;
    expect([r.floorArea, r.capped, r.full, r.partial]).toEqual([720, true, 2, 0]);
  });
  it('KDB 70 + KDH 40 conflict', () => {
    const r = potential({ ...LAND, kdb: 70, kdh: 40 })!;
    expect([r.conflict, r.fp, r.open, r.cars]).toEqual([true, 360, 0, 0]);
  });
  it('KLB 0.5 < KDB', () => {
    const r = potential({ ...LAND, klb: 0.5 })!;
    expect([r.floorArea, r.full, r.partial]).toEqual([300, 0, 300]);
  });
  it('empty state when P or L = 0', () => {
    expect(potential({ ...LAND, P: 0 })).toBeNull();
    expect(potential({ ...LAND, L: 0 })).toBeNull();
  });
  it('negative and empty inputs count as 0, percentages clamp to 100', () => {
    expect(potential({ ...LAND, P: -5 })).toBeNull();
    const r = potential({ ...LAND, kdb: 150, kdh: 0 })!;
    expect(r.fp).toBe(600);
  });
});

describe('Step 2: ideas (defaults, occupancy 85%)', () => {
  const res = ideas(potential(LAND)!, IDEAS);
  it('kos-kosan', () => {
    expect(res.kos.units).toBe(66); expect(res.kos.built).toBe(1188);
    expect(res.kos.cost).toBe(5_346_000_000); expect(Math.round(res.kos.income)).toBe(807_840_000);
    expect(res.kos.yieldPct!).toBeCloseTo(15.11, 2); expect(res.kos.payback!).toBeCloseTo(6.62, 2);
  });
  it('ruko', () => {
    expect(res.ruko.units).toBe(6); expect(res.ruko.perUnit).toBe(200); expect(res.ruko.built).toBe(1200);
    expect(res.ruko.cost).toBe(6_000_000_000); expect(Math.round(res.ruko.income)).toBe(357_000_000);
    expect(res.ruko.yieldPct!).toBeCloseTo(5.95, 2); expect(res.ruko.payback!).toBeCloseTo(16.81, 2);
  });
  it('rental houses', () => {
    expect(res.rumah.units).toBe(6); expect(res.rumah.built).toBe(420);
    expect(res.rumah.cost).toBe(1_890_000_000); expect(Math.round(res.rumah.income)).toBe(153_000_000);
    expect(res.rumah.yieldPct!).toBeCloseTo(8.1, 1); expect(res.rumah.payback!).toBeCloseTo(12.35, 2);
  });
  it('warehouse', () => {
    expect(res.gudang.built).toBe(360); expect(res.gudang.cost).toBe(1_260_000_000);
    expect(Math.round(res.gudang.income)).toBe(183_600_000);
    expect(res.gudang.yieldPct!).toBeCloseTo(14.57, 2); expect(res.gudang.payback!).toBeCloseTo(6.86, 2);
  });
  it('ranking: kos fastest, warehouse second and cheapest', () => {
    const r = rank(res);
    expect(r.fastest?.key).toBe('kos'); expect(r.second?.key).toBe('gudang'); expect(r.cheapest?.key).toBe('gudang');
  });
  it('displayed values', () => {
    expect(fmtYears(res.kos.payback!, 'en')).toBe('6.6 years');
    expect(fmtYears(res.ruko.payback!, 'en')).toBe('16.8 years');
    expect(fmtYears(res.rumah.payback!, 'en')).toBe('12.4 years');
    expect(fmtYears(res.gudang.payback!, 'en')).toBe('6.9 years');
    expect(fmtPct(res.kos.yieldPct!, 'en')).toBe('15.1%');
    expect(fmtPct(res.ruko.yieldPct!, 'en')).toBe('5.9%');   // raw 5.9499…; see 05 §10 note
    expect(fmtPct(res.gudang.yieldPct!, 'en')).toBe('14.6%');
  });
  it("an idea that doesn't fit has no payback", () => {
    const r = ideas(potential({ ...LAND, P: 4 })!, IDEAS); // 4 m frontage < 4.5 m ruko unit
    expect(r.ruko.fits).toBe(false); expect(r.ruko.payback).toBeNull();
  });
});

describe('Step 3: check (defaults)', () => {
  const c = check(LAND, CHECK)!;
  it('ratios and room', () => {
    expect(c.vKdb).toBe(40); expect(c.vKlb).toBe(0.8); expect(c.vKdh).toBe(25);
    expect(c.okKdb && c.okKlb && c.okKdh).toBe(true);
    expect(c.fpRoom).toBe(120); expect(c.faRoom).toBe(720);
  });
  it('answer: up to 3 more floors of 240 m²', () => { expect(c.answer).toEqual({ kind: 'many', extra: 3 }); });
  it('leftover 210 m² (35%)', () => { expect(c.leftover).toBe(210); expect((c.leftover / c.A) * 100).toBe(35); });
  it('broken rule blocks extra floors', () => { expect(check(LAND, { fp: 500, tfa: 500, green: 50 })!.answer.kind).toBe('broken'); });
});

describe('Formatting', () => {
  it('short money never mixes languages', () => {
    expect(fmtMoneyShort(807_840_000, 'id')).toBe('Rp 808 jt');
    expect(fmtMoneyShort(807_840_000, 'en')).toBe('Rp 808 M');
    expect(fmtMoneyShort(5_346_000_000, 'id')).toBe('Rp 5,35 M');
    expect(fmtMoneyShort(5_346_000_000, 'en')).toBe('Rp 5.35 B');
    expect(fmtMoneyShort(1.2e12, 'id')).toBe('Rp 1,2 T');
    expect(fmtMoneyShort(1.2e12, 'en')).toBe('Rp 1.2 T');
  });
  it('full money, area, KLB, years', () => {
    expect(fmtMoney(1_200_000, 'id')).toBe('Rp 1.200.000');
    expect(fmtMoney(1_200_000, 'en')).toBe('Rp 1,200,000');
    expect(fmtArea(1188, 'en')).toBe('1,188 m²');
    expect(fmtArea(1188, 'id')).toBe('1.188 m²');
    expect(fmtKlb(2, 'en')).toBe('2×');
    expect(fmtKlb(1.255, 'id')).toBe('1,26×');
    expect(fmtYears(6.62, 'id')).toBe('6,6 tahun');
  });
});

describe('WhatsApp handoff', () => {
  it('includes the land and the fastest idea', () => {
    const msg = buildWhatsAppMessage({ lang: 'en', land: LAND, ideas: IDEAS, check: CHECK });
    expect(msg).toContain('30 × 20 m (600 m²)');
    expect(msg).toContain('up to 1,200 m²');
    expect(msg).toContain('Kos-kosan (pays back in about 6.6 years)');
  });
  it('Indonesian version and URL encoding', () => {
    const msg = buildWhatsAppMessage({ lang: 'id', land: LAND, ideas: IDEAS, check: CHECK, usedStep3: true });
    expect(msg).toContain('hingga 1.200 m²');
    expect(msg).toContain('bisa tambah 3 lantai');
    expect(whatsAppUrl(msg)).toMatch(/^https:\/\/wa\.me\/6282110106088\?text=Halo%20HOMYVEST/);
  });
  it('generic message without land', () => {
    expect(buildWhatsAppMessage({ lang: 'en', land: { ...LAND, P: 0 }, ideas: IDEAS, check: CHECK })).toMatch(/^Hi HOMYVEST!/);
  });
});

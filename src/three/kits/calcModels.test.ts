// The 3D must be truthful (docs/05 §9): these tests measure the boxes the scene actually draws and
// compare them with what the calculator reports. Nothing here reads a copied "info" number as proof.
import { describe, it, expect } from 'vitest';
import { potential, ideas, check, type Land, type Ideas, type Check } from '../../lib/calc/calc.ts';
import { describeScene, toPieces, roomsPerFloor, fillGreen, tuftLayout } from './calcModels.js';

const LAND: Land = { P: 30, L: 20, kdb: 60, klb: 2, kdh: 20, maxFloors: '' };
const IDEAS: Ideas = {
  occ: 85,
  kos: { size: 18, rent: 1_200_000, cost: 4_500_000 },
  ruko: { width: 4.5, rent: 70_000_000, cost: 5_000_000 },
  rumah: { land: 100, floor: 70, rent: 2_500_000, cost: 4_500_000 },
  gudang: { rent: 50_000, cost: 3_500_000 },
};
const CHECK: Check = { fp: 240, tfa: 480, green: 150 };

type Part = { key: string; kind: string; role?: string; level: number; x: number; z: number; w: number; d: number; y0: number; h: number; over?: string; unit?: number };
type Scene = Omit<ReturnType<typeof describeScene>, 'ground' | 'parts' | 'info'> & { ground: Part[]; parts: Part[]; info: Record<string, any> };

const scene = (over: Record<string, unknown> = {}): Scene =>
  describeScene({ land: LAND, ideas: IDEAS, check: CHECK, step: 1, selectedIdea: null, ...over }) as unknown as Scene;
const all = (s: Scene): Part[] => [...s.ground, ...s.parts];
const area = (parts: Part[]) => parts.reduce((a, p) => a + p.w * p.d, 0);
const role = (s: Scene, name: string) => all(s).filter((p) => p.role === name);
const floorsAt = (s: Scene, level: number) => role(s, 'floor').filter((p) => p.level === level);
const overlap = (a: Part, b: Part) =>
  Math.max(0, Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2)) *
  Math.max(0, Math.min(a.z + a.d / 2, b.z + b.d / 2) - Math.max(a.z - a.d / 2, b.z - b.d / 2));

/** What must hold for every state: the plate is the land, and nothing meaningful leaves it or overlaps. */
function invariants(s: Scene, land: Land, { greenOverlap = false } = {}) {
  const r = potential(land)!;
  expect(area(role(s, 'land'))).toBeCloseTo(r.A, 6);
  for (const p of all(s).filter((q) => ['green', 'greenShort', 'pad', 'floor', 'ghost', 'parcel', 'bay', 'apron'].includes(q.role ?? ''))) {
    expect(p.w).toBeGreaterThan(0);
    expect(p.d).toBeGreaterThan(0);
    expect(Math.abs(p.x) + p.w / 2).toBeLessThanOrEqual(r.P / 2 + 1e-6);
    expect(p.z - p.d / 2).toBeGreaterThanOrEqual(-1e-6);
    expect(p.z + p.d / 2).toBeLessThanOrEqual(r.L + 1e-6);
  }
  const greens = role(s, 'green');
  const pads = role(s, 'pad');
  for (let i = 0; i < pads.length; i++) for (let j = i + 1; j < pads.length; j++) expect(overlap(pads[i], pads[j])).toBeLessThan(1e-6);
  for (let i = 0; i < greens.length; i++) for (let j = i + 1; j < greens.length; j++) expect(overlap(greens[i], greens[j])).toBeLessThan(1e-6);
  if (!greenOverlap) for (const g of greens) for (const p of pads) expect(overlap(g, p)).toBeLessThan(1e-6);
  // the clay pad is the footprint: the ground floor never reaches past it, and fills it when the
  // building has at least one full floor
  expect(area(floorsAt(s, 0))).toBeLessThanOrEqual(area(pads) + 1e-6);
  if (s.info.full > 0) expect(area(floorsAt(s, 0))).toBeCloseTo(area(pads), 6);
  // open = land − building − green, never negative
  if (!greenOverlap) expect(r.A - area(pads) - area(greens)).toBeGreaterThanOrEqual(-1e-6);
  return r;
}

describe('step 1: the maximum building (defaults)', () => {
  const s = scene();
  const r = invariants(s, LAND);
  it('zones: 360 m² building, 120 m² green at the back, 120 m² open in front', () => {
    expect(area(role(s, 'pad'))).toBeCloseTo(r.fp, 6);
    expect(area(role(s, 'green'))).toBeCloseTo(r.greenMin, 6);
    expect(r.A - area(role(s, 'pad')) - area(role(s, 'green'))).toBeCloseTo(r.open, 6);
    const green = role(s, 'green')[0];
    expect(green.d).toBeCloseTo(4, 9);
    expect(green.z + green.d / 2).toBeCloseTo(20, 9); // against the back boundary
    const pad = role(s, 'pad')[0];
    expect([pad.w, pad.d]).toEqual([30, 12]);
    expect(pad.z - pad.d / 2).toBeCloseTo(4, 9); // a 4 m open band in front
  });
  it('3 floors of 30 × 12 m plus a 120 m² top floor: 1,200 m² in total', () => {
    expect(s.levels).toEqual([3.2, 3.2, 3.2, 3.2]);
    for (const k of [0, 1, 2]) expect(area(floorsAt(s, k))).toBeCloseTo(360, 6);
    expect(area(floorsAt(s, 3))).toBeCloseTo(r.partial, 6);
    expect(floorsAt(s, 3)[0].w).toBe(30); // same width, shallower
    expect(area(role(s, 'floor'))).toBeCloseTo(r.floorArea, 6);
    expect(role(s, 'floor').length).toBe(r.full + 1);
  });
  it('at most `cars` parking bays, inside the open band', () => {
    const bays = role(s, 'bay');
    expect(bays.length).toBe(4);
    expect(bays.length).toBeLessThanOrEqual(r.cars);
    for (const b of bays) expect(b.z + b.d / 2).toBeLessThanOrEqual(4 + 1e-9);
  });
  it('labels carry the drawn numbers', () => {
    const top = s.labels.find((l: any) => l.key === 'top') as any;
    expect(top.area).toBeCloseTo(area(role(s, 'floor')), 6);
    const floors = s.labels.find((l: any) => l.key === 'floors') as any;
    expect([floors.full, floors.partial]).toEqual([3, 120]);
    expect((s.labels.find((l: any) => l.key === 'front') as any).value).toBe(30);
    expect((s.labels.find((l: any) => l.key === 'depth') as any).value).toBe(20);
  });
  it('pieces are in world metres: the stack is 12.8 m tall and stands on the land', () => {
    const pieces = toPieces(s).filter((p: any) => p.role === 'floor');
    expect(Math.max(...pieces.map((p: any) => p.pos[1] + p.size[1] / 2))).toBeCloseTo(12.8, 9);
    for (const p of pieces as any[]) expect(p.pos[2]).toBeLessThanOrEqual(0); // the road is at +z
  });
});

describe('step 1: variations', () => {
  it('max floors 2: two full floors, no top floor', () => {
    const land = { ...LAND, maxFloors: 2 };
    const s = scene({ land });
    const r = invariants(s, land);
    expect(s.levels.length).toBe(2);
    expect(area(role(s, 'floor'))).toBeCloseTo(r.floorArea, 6);
    expect(r.floorArea).toBe(720);
  });
  it('KDB 70 + KDH 40: no open band, the building meets the green', () => {
    const land = { ...LAND, kdb: 70, kdh: 40 };
    const s = scene({ land });
    const r = invariants(s, land);
    expect(area(role(s, 'pad'))).toBeCloseTo(360, 6);
    expect(area(role(s, 'green'))).toBeCloseTo(240, 6);
    expect(r.A - area(role(s, 'pad')) - area(role(s, 'green'))).toBeCloseTo(0, 6);
    expect(role(s, 'bay').length).toBe(0);
    expect(role(s, 'pad')[0].z - role(s, 'pad')[0].d / 2).toBeCloseTo(0, 9);
  });
  it('KLB 0.5: one smaller floor of 300 m², centred in its band', () => {
    const land = { ...LAND, klb: 0.5 };
    const s = scene({ land });
    invariants(s, land);
    expect(s.levels.length).toBe(1);
    const f = floorsAt(s, 0)[0];
    expect(f.w * f.d).toBeCloseTo(300, 6);
    expect(f.z).toBeCloseTo(10, 9); // band is 4 … 16 m
  });
  it('a very large plot and a tiny one stay exact', () => {
    for (const land of [{ ...LAND, P: 120, L: 80 }, { ...LAND, P: 6, L: 10 }]) {
      const s = scene({ land });
      const r = invariants(s, land);
      expect(area(role(s, 'floor'))).toBeCloseTo(r.floorArea, 4);
      expect(area(role(s, 'green'))).toBeCloseTo(r.greenMin, 6);
      expect(role(s, 'bay').length).toBeLessThanOrEqual(r.cars);
    }
  });
  it('KLB 0 or KDB 0: no building is drawn', () => {
    for (const land of [{ ...LAND, klb: 0 }, { ...LAND, kdb: 0 }]) {
      const s = scene({ land });
      expect(role(s, 'floor').length).toBe(0);
      expect(role(s, 'pad').length).toBe(0);
    }
  });
  it('more than 40 floors: 40 drawn, the label says how many there are', () => {
    const land = { ...LAND, klb: 33 };
    const s = scene({ land });
    expect(s.levels.length).toBe(40);
    const floors = s.labels.find((l: any) => l.key === 'floors') as any;
    expect(floors.cap).toBe(55);
    expect(role(s, 'floor').length).toBe(40);
  });
  it('empty land: only the road and a faint outline', () => {
    const s = scene({ land: { ...LAND, P: 0 } });
    expect(s.empty).toBe(true);
    expect(s.parts.length).toBe(0);
    expect(area(role(s, 'land'))).toBe(0);
    expect(role(s, 'placeholder').length).toBe(1);
    expect(role(s, 'road').length).toBe(1);
    expect(s.labels.length).toBe(0);
  });
});

describe('step 2: ideas (defaults)', () => {
  const r = potential(LAND)!;
  const res = ideas(r, IDEAS);

  it('kos is shown first (fastest payback): 1,188 m² and one window per room', () => {
    const s = scene({ step: 2 });
    invariants(s, LAND);
    expect(s.id).toBe('kos');
    expect(area(role(s, 'floor'))).toBeCloseTo(res.kos.built, 6);
    expect(area(floorsAt(s, 3))).toBeCloseTo(108, 6);
    expect(role(s, 'window').length).toBe(res.kos.units); // 66
    const perFloor = [0, 1, 2, 3].map((k) => role(s, 'window').filter((w) => w.level === k).length);
    expect(perFloor).toEqual([20, 20, 20, 6]);
    expect((s.labels.find((l: any) => l.key === 'floors') as any).partial).toBeCloseTo(108, 6);
  });

  it('ruko: 6 units of 4.5 × 12 m, 3 floors plus a partial, 200 m² each', () => {
    const s = scene({ step: 2, selectedIdea: 'ruko' });
    invariants(s, LAND);
    const floors = role(s, 'floor');
    const units = new Set(floors.map((f) => f.unit));
    expect(units.size).toBe(res.ruko.units); // 6 countable units
    for (const u of units) {
      const mine = floors.filter((f) => f.unit === u);
      expect(area(mine)).toBeCloseTo(res.ruko.perUnit!, 6); // 200 m²
      for (const f of mine.filter((q) => q.level < 3)) expect([f.w, f.d]).toEqual([4.5, 12]); // 54 m², not shrunk by a gap
    }
    expect(area(floors)).toBeCloseTo(res.ruko.built, 6);
    expect(s.levels).toEqual([4, 3.5, 3.5, 3.5]);
    expect(role(s, 'pad')[0].w).toBeCloseTo(27, 9); // the row, centred
    expect(role(s, 'shopfront').length).toBe(6);
  });

  it('rental houses: 6 parcels of 10 × 10 m, two-storey houses of 35 m², 420 m² built', () => {
    const s = scene({ step: 2, selectedIdea: 'rumah' });
    invariants(s, LAND);
    const parcels = role(s, 'parcel');
    expect(parcels.length).toBe(res.rumah.units);
    for (const p of parcels) expect([p.w, p.d]).toEqual([10, 10]);
    expect(area(parcels)).toBeCloseTo(600, 6);
    const pads = role(s, 'pad');
    expect(pads.length).toBe(6);
    for (const p of pads) expect(p.w * p.d).toBeCloseTo(35, 6);
    expect(role(s, 'floor').length).toBe(12); // 6 houses × 2 floors
    expect(area(role(s, 'floor'))).toBeCloseTo(res.rumah.built, 6);
    expect(s.parts.filter((p) => p.kind === 'roof').length).toBe(6);
    // the green is in the yards and still adds up to the required 120 m²
    expect(area(role(s, 'green'))).toBeCloseTo(r.greenMin, 6);
    expect(s.info.greenShortfall).toBeCloseTo(0, 9);
  });

  it('warehouse: one 30 × 12 m box, 7 m to the ridge', () => {
    const s = scene({ step: 2, selectedIdea: 'gudang' });
    invariants(s, LAND);
    const f = role(s, 'floor');
    expect(f.length).toBe(1);
    expect([f[0].w, f[0].d]).toEqual([30, 12]);
    expect(area(f)).toBeCloseTo(res.gudang.built, 6);
    expect(s.levels[0] + s.levels[1]).toBeCloseTo(7, 9);
    expect(role(s, 'apron').length).toBeGreaterThan(0);
    expect(role(s, 'bay').length).toBe(0);
  });

  it('every idea stays exact on other plots', () => {
    const lands: Land[] = [
      { ...LAND, P: 120, L: 80 }, { ...LAND, P: 6, L: 10 }, { ...LAND, kdb: 70, kdh: 40 }, { ...LAND, klb: 0.5 },
      { ...LAND, maxFloors: 2 }, { P: 17.5, L: 43, kdb: 50, klb: 1.2, kdh: 30, maxFloors: '' }, { P: 45, L: 12, kdb: 70, klb: 4, kdh: 10, maxFloors: '' },
    ];
    for (const land of lands) {
      const rr = potential(land)!;
      const rs = ideas(rr, IDEAS);
      for (const key of ['kos', 'ruko', 'rumah', 'gudang'] as const) {
        const s = scene({ land, step: 2, selectedIdea: key });
        invariants(s, land);
        if (s.info.clamped) continue;
        const built = key === 'rumah' ? rs.rumah.built : rs[key].built;
        if (rs[key].fits) expect(area(role(s, 'floor'))).toBeCloseTo(built, 4);
        else expect(role(s, 'floor').length).toBe(0);
        expect(area(role(s, 'green'))).toBeCloseTo(rr.greenMin, 5);
        if (key === 'kos' && !s.info.windowsCapped) expect(role(s, 'window').length).toBe(rs.kos.units);
        if (key === 'rumah' && rs.rumah.fits) expect(role(s, 'pad').length).toBe(rs.rumah.units);
      }
    }
  });

  it('house yards spill to free land when the parcels cannot hold the green', () => {
    // few houses on a deep plot: the parcels are smaller than their rows
    const land = { ...LAND, klb: 0.3, kdh: 45 };
    const s = scene({ land, step: 2, selectedIdea: 'rumah' });
    const rr = invariants(s, land);
    expect(area(role(s, 'green'))).toBeCloseTo(rr.greenMin, 6);
    expect(s.info.greenShortfall).toBeCloseTo(0, 9);
  });
});

describe('step 3: existing building', () => {
  it('defaults: 240 m² footprint, 2 solid floors, 3 ghost floors, 150 m² green', () => {
    const s = scene({ step: 3 });
    invariants(s, LAND);
    const c = check(LAND, CHECK)!;
    expect(area(role(s, 'pad'))).toBeCloseTo(c.fp, 6);
    expect(area(role(s, 'floor'))).toBeCloseTo(c.tfa, 6);
    expect(new Set(role(s, 'floor').map((f) => f.level)).size).toBe(2);
    const ghosts = role(s, 'ghost');
    expect(ghosts.length).toBe(c.answer.extra); // 3
    for (const g of ghosts) expect(g.w * g.d).toBeCloseTo(c.fp, 6);
    expect(area(role(s, 'green'))).toBeCloseTo(c.green, 6);
    expect(all(s).filter((p) => p.kind === 'hatch' || p.kind === 'hatchflat').length).toBe(0);
    // leftover for driveway, parking and service
    expect(600 - area(role(s, 'pad')) - area(role(s, 'green'))).toBeCloseTo(c.leftover, 6);
  });
  it('footprint 500: the part past the KDB limit is hatched, exactly 140 m²', () => {
    const chk = { ...CHECK, fp: 500 };
    const s = scene({ step: 3, check: chk });
    invariants(s, LAND, { greenOverlap: true }); // 500 + 150 m² do not fit on 600 m²: the calculator warns
    const c = check(LAND, chk)!;
    const hatched = role(s, 'floor').filter((p) => p.kind === 'hatch');
    expect(area(role(s, 'pad'))).toBeCloseTo(500, 6);
    expect(hatched.every((p) => p.over === 'kdb')).toBe(true);
    // the footprint slice past the limit: 500 − 360 = 140 m² of ground
    const ground = floorsAt(s, 0);
    const sliceShare = area(ground.filter((p) => p.kind === 'hatch')) / area(ground);
    expect(sliceShare * c.fp).toBeCloseTo(-c.fpRoom, 6);
    expect(area(role(s, 'floor'))).toBeCloseTo(c.tfa, 6);
    expect(role(s, 'ghost').length).toBe(0);
    expect(s.info.overlapsGreen).toBe(true);
  });
  it('floor area past the KLB limit is hatched from the top down, exactly', () => {
    const chk = { fp: 300, tfa: 1500, green: 150 }; // limit 1,200 m²
    const s = scene({ step: 3, check: chk });
    invariants(s, LAND);
    const c = check(LAND, chk)!;
    const hatched = role(s, 'floor').filter((p) => p.over === 'klb');
    expect(area(hatched)).toBeCloseTo(-c.faRoom, 6); // 300 m²
    expect(area(role(s, 'floor'))).toBeCloseTo(c.tfa, 6);
    expect(Math.min(...hatched.map((p) => p.level))).toBe(4); // the top floor
  });
  it('too little green: the missing area is hatched on the ground', () => {
    const chk = { ...CHECK, green: 60 };
    const s = scene({ step: 3, check: chk });
    invariants(s, LAND);
    const c = check(LAND, chk)!;
    expect(area(role(s, 'green'))).toBeCloseTo(60, 6);
    expect(area(role(s, 'greenShort'))).toBeCloseTo(c.greenShort, 6); // 60 m²
  });
  it('a smaller top floor and one ghost floor', () => {
    const chk = { fp: 240, tfa: 600, green: 150 };
    const s = scene({ step: 3, check: chk });
    invariants(s, LAND);
    expect(area(role(s, 'floor'))).toBeCloseTo(600, 6);
    expect(role(s, 'ghost').length).toBe(check(LAND, chk)!.answer.extra);
  });
});

describe('helpers', () => {
  it('rooms per floor follow floor area and add up exactly', () => {
    expect(roomsPerFloor(66, [360, 360, 360, 108])).toEqual([20, 20, 20, 6]);
    expect(roomsPerFloor(7, [100, 100, 100]).reduce((a: number, b: number) => a + b, 0)).toBe(7);
    expect(roomsPerFloor(0, [100])).toEqual([0]);
  });
  it('fillGreen fills groups in order and reports what does not fit', () => {
    const g = fillGreen(30, [
      [{ key: 'a', x0: 0, x1: 10, z0: 0, z1: 2, axis: 'z', from: 'max' }],
      [{ key: 'b', x0: 0, x1: 10, z0: 5, z1: 7, axis: 'z', from: 'min' }],
    ]);
    expect(g.rects.map((x: any) => x.w * x.d)).toEqual([20, 10]);
    expect(g.shortfall).toBe(0);
    expect(fillGreen(50, [[{ key: 'a', x0: 0, x1: 10, z0: 0, z1: 2, axis: 'z', from: 'max' }]]).shortfall).toBe(30);
  });
  it('grass tufts: capped at 400, stable as the area grows', () => {
    const a = tuftLayout([{ key: 'g', w: 30, d: 4 }]);
    const b = tuftLayout([{ key: 'g', w: 30, d: 6 }]);
    expect(a.length).toBe(60);
    expect(b.slice(0, a.length)).toEqual(a);
    expect(tuftLayout([{ key: 'g', w: 120, d: 16 }]).length).toBe(400);
  });
});

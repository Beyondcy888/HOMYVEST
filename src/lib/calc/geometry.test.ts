// Geometry check from docs/05 §10. The 3D must match the numbers, so these stay green.
import { describe, it, expect } from 'vitest';
import { potential, ideas, check, type Land, type Ideas } from './calc.ts';
import { bands, stack, maxBuilding, kosModel, rukoModel, housesModel, warehouseModel, existingModel, drawnFloors, parkingBays } from './geometry.ts';

const LAND: Land = { P: 30, L: 20, kdb: 60, klb: 2, kdh: 20, maxFloors: '' };
const IDEAS: Ideas = {
  occ: 85,
  kos: { size: 18, rent: 1_200_000, cost: 4_500_000 },
  ruko: { width: 4.5, rent: 70_000_000, cost: 5_000_000 },
  rumah: { land: 100, floor: 70, rent: 2_500_000, cost: 4_500_000 },
  gudang: { rent: 50_000, cost: 3_500_000 },
};
const r = potential(LAND)!;
const res = ideas(r, IDEAS);

describe('bands (defaults)', () => {
  it('4 m open, 12 m building, 4 m green', () => {
    const b = bands(r);
    expect(b.dFront).toBeCloseTo(4, 9); expect(b.dMid).toBeCloseTo(12, 9); expect(b.dBack).toBeCloseTo(4, 9);
  });
  it('band areas add up to the land exactly', () => {
    const b = bands(r);
    expect(b.dFront * r.P + b.dMid * r.P + b.dBack * r.P).toBeCloseTo(r.A, 6);
    expect(b.dMid * r.P).toBeCloseTo(r.fp, 6);
  });
});

describe('max building', () => {
  it('30 × 12 m footprint, 3 full floors + 120 m² top floor', () => {
    const m = maxBuilding(r);
    expect(m.width).toBe(30); expect(m.depth).toBeCloseTo(12, 9);
    expect(m.full).toBe(3); expect(m.partial).toBe(120);
    expect(m.partialDepth).toBeCloseTo(4, 9); // same width, depth scaled by 120/360
  });
  it('KLB < KDB: a single smaller floor, centred in the band', () => {
    const r2 = potential({ ...LAND, klb: 0.5 })!;
    const m = maxBuilding(r2);
    expect(m.fpUsed).toBe(300); expect(m.full).toBe(1); expect(m.partial).toBe(0);
    expect(m.width * m.depth).toBeCloseTo(300, 6);
    expect(m.z0).toBeCloseTo(4 + (12 - 10) / 2, 9);
  });
  it('max floors = 2', () => {
    const m = maxBuilding(potential({ ...LAND, maxFloors: 2 })!);
    expect([m.full, m.partial]).toEqual([2, 0]);
  });
});

describe('ideas', () => {
  it('kos: 1,188 m² over a 360 m² footprint', () => {
    const k = kosModel(r, res);
    expect(k.full).toBe(3); expect(k.partial).toBe(108); expect(k.floors).toBe(4);
    expect(k.roomsPerFloor).toBeCloseTo(16.5, 9);
  });
  it('ruko: 6 units, 27 m row, 12 m deep, 54 m² per floor, 3 full floors + a partial', () => {
    const m = rukoModel(r, res, IDEAS);
    expect(m.units).toBe(6); expect(m.rowWidth).toBeCloseTo(27, 9); expect(m.unitDepth).toBeCloseTo(12, 9);
    expect(m.unitFootprint).toBeCloseTo(54, 9); expect(m.full).toBe(3); expect(m.partial).toBeCloseTo(38, 6);
  });
  it('houses: 6 parcels of 10 × 10 m, 35 m² footprint, 2 floors', () => {
    const h = housesModel(r, res, IDEAS);
    expect(h.units).toBe(6); expect(h.cols).toBe(3); expect(h.rows).toBe(2);
    expect(h.parcelW).toBeCloseTo(10, 9); expect(h.parcelD).toBeCloseTo(10, 9);
    expect(h.floorsPerHouse).toBe(2); expect(h.footprint).toBe(35);
    expect(h.houseW * h.houseD).toBeCloseTo(35, 6);
    expect(h.houseW).toBeLessThanOrEqual(h.parcelW); expect(h.houseD).toBeLessThanOrEqual(h.parcelD);
  });
  it('warehouse: 360 m² in the building band, 7 m high', () => {
    const w = warehouseModel(r, res);
    expect(w.area).toBe(360); expect(w.width).toBe(30); expect(w.depth).toBeCloseTo(12, 9); expect(w.height).toBe(7);
  });
});

describe('existing building (step 3 defaults)', () => {
  const c = check(LAND, { fp: 240, tfa: 480, green: 150 })!;
  const m = existingModel(LAND, c);
  it('240 m² footprint, 2 floors, 3 ghost floors', () => {
    expect(m.footprint).toBe(240); expect(m.full).toBe(2); expect(m.partial).toBe(0); expect(m.ghostFloors).toBe(3);
    expect(m.width * m.depth).toBeCloseTo(240, 6);
  });
  it('fits on the land beside its green band', () => {
    expect(m.width).toBeLessThanOrEqual(30); expect(m.greenDepth).toBeCloseTo(5, 9);
    expect(m.z0 + m.depth).toBeLessThanOrEqual(20 - m.greenDepth + 1e-6);
    expect(m.broken).toBe(false);
  });
});

describe('helpers', () => {
  it('stack handles zero and tiny remainders', () => {
    expect(stack(0, 100)).toEqual({ full: 0, partial: 0 });
    expect(stack(100, 0)).toEqual({ full: 0, partial: 0 });
    expect(stack(300.2, 100)).toEqual({ full: 3, partial: 0 });
  });
  it('drawn floors cap at 40', () => {
    expect(drawnFloors(55, 0)).toEqual({ full: 40, partial: 0, total: 55, capped: true });
    expect(drawnFloors(3, 120)).toEqual({ full: 3, partial: 120, total: 4, capped: false });
  });
  it('parking bays never exceed the car count', () => {
    expect(parkingBays(r).length).toBe(4);
    expect(parkingBays(potential({ ...LAND, kdb: 70, kdh: 40 })!).length).toBe(0);
  });
});

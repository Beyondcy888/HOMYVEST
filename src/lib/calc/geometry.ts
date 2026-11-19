// 3D / 2D layout helpers for the calculator scenes. Pure functions, no rendering.
// Every dimension the calculator draws comes from here, so the picture always matches the numbers.
// Spec: docs/05 §9 and docs/06 §5.4. Visual-only constants (floor heights) never affect the calc.
import { EPS, type Potential, type IdeaResult, type IdeaKey, type Ideas, type Land } from './calc.ts';

export const FLOOR_H = { max: 3.2, kos: 3.2, rukoGround: 4.0, rukoUpper: 3.5, house: 3.0, warehouse: 7.0 } as const;
export const MAX_DRAWN_FLOORS = 40;
export const ROAD_DEPTH = 6;
export const CAR_BAY_W = 2.5;
export const CAR_BAY_D = 5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Front-to-back bands: open (front, by the road), building, green (back). Areas are exact. */
export function bands(r: Potential) {
  const dFront = r.P > 0 ? r.open / r.P : 0;
  const dBack = r.P > 0 ? r.greenMin / r.P : 0;
  const dMid = Math.max(0, r.L - dFront - dBack);
  return { dFront, dBack, dMid };
}

/** Split a floor area into full floors of `footprint` plus a smaller top floor. */
export function stack(area: number, footprint: number) {
  if (!(footprint > 0) || !(area > 0)) return { full: 0, partial: 0 };
  const full = Math.floor(area / footprint + EPS);
  let partial = Math.max(0, area - full * footprint);
  if (partial < 0.5) partial = 0;
  return { full, partial };
}

/** Floors actually drawn (capped), plus the true total for the "Showing 40 of N" label. */
export function drawnFloors(full: number, partial: number) {
  const total = full + (partial > 0 ? 1 : 0);
  if (total <= MAX_DRAWN_FLOORS) return { full, partial, total, capped: false };
  return { full: MAX_DRAWN_FLOORS, partial: 0, total, capped: true };
}

export type Box = {
  /** centre x, relative to the land's centre line (land spans −P/2 … +P/2) */
  cx: number;
  /** front edge z, measured from the road edge of the land (0 … L) */
  z0: number;
  width: number;
  depth: number;
};

/** A footprint of `area` m², `width` wide, centred in the building band. */
function centredInBand(r: Potential, area: number, width: number): Box {
  const b = bands(r);
  const w = Math.max(0, Math.min(width, r.P));
  const depth = w > 0 ? area / w : 0;
  const z0 = b.dFront + Math.max(0, (b.dMid - depth) / 2);
  return { cx: 0, z0, width: w, depth };
}

/** Step 1: the largest building the rules allow. */
export function maxBuilding(r: Potential) {
  const fpUsed = Math.min(r.fp, r.floorArea);
  const box = centredInBand(r, fpUsed, r.P);
  const s = stack(r.floorArea, fpUsed);
  return { fpUsed, ...box, ...s, partialDepth: fpUsed > 0 ? box.depth * (s.partial / fpUsed) : 0, floorHeight: FLOOR_H.max };
}

/** Kos-kosan: same footprint as the max building, total area = rooms × size. */
export function kosModel(r: Potential, res: Record<IdeaKey, IdeaResult>) {
  const fpUsed = Math.min(r.fp, r.floorArea);
  const box = centredInBand(r, fpUsed, r.P);
  const s = stack(res.kos.built, fpUsed);
  const floors = s.full + (s.partial > 0 ? 1 : 0);
  return {
    fpUsed, ...box, ...s,
    partialDepth: fpUsed > 0 ? box.depth * (s.partial / fpUsed) : 0,
    floors,
    roomsPerFloor: floors > 0 ? res.kos.units / floors : 0,
    floorHeight: FLOOR_H.kos,
  };
}

/** Ruko: units side by side along the frontage, sharing all the allowed floor area. */
export function rukoModel(r: Potential, res: Record<IdeaKey, IdeaResult>, I: Ideas) {
  const units = res.ruko.units;
  const width = Math.max(0, Number(I.ruko.width) || 0);
  const rowWidth = units * width;
  const { dFront, dMid } = bands(r);
  const unitDepth = rowWidth > 0 ? Math.min(dMid, r.fp / rowWidth) : 0;
  const unitFootprint = width * unitDepth;
  const s = stack(res.ruko.perUnit ?? 0, unitFootprint);
  return {
    units, unitWidth: width, rowWidth, unitDepth, unitFootprint, ...s,
    partialDepth: unitFootprint > 0 ? unitDepth * (s.partial / unitFootprint) : 0,
    cx: 0, z0: dFront + Math.max(0, (dMid - unitDepth) / 2),
    groundHeight: FLOOR_H.rukoGround, upperHeight: FLOOR_H.rukoUpper,
  };
}

/** Rental houses: equal parcels in rows along the frontage, one house centred on each. */
export function housesModel(r: Potential, res: Record<IdeaKey, IdeaResult>, I: Ideas) {
  const units = res.rumah.units;
  const landPer = Math.max(0, Number(I.rumah.land) || 0);
  const floorPer = Math.max(0, Number(I.rumah.floor) || 0);
  if (!(units > 0) || !(landPer > 0) || !(floorPer > 0)) {
    return { units: 0, cols: 0, rows: 0, parcelW: 0, parcelD: 0, floorsPerHouse: 0, footprint: 0, houseW: 0, houseD: 0, floorHeight: FLOOR_H.house };
  }
  const cols = clamp(Math.round(r.P / Math.sqrt(landPer)), 1, units);
  const rows = Math.ceil(units / cols);
  const parcelW = r.P / cols;
  const parcelD = Math.min(r.L / rows, landPer / parcelW);
  const perHouseFp = r.fp / units;
  const floorsPerHouse = perHouseFp > 0 ? Math.max(1, Math.ceil(floorPer / perHouseFp - EPS)) : 1;
  const footprint = floorPer / floorsPerHouse;
  // House plan: a little wider than deep, never larger than 80% of its parcel in either direction.
  let houseW = Math.min(parcelW * 0.8, Math.sqrt(footprint * 1.25));
  let houseD = houseW > 0 ? footprint / houseW : 0;
  if (houseD > parcelD * 0.8 && parcelD > 0) { houseD = parcelD * 0.8; houseW = footprint / houseD; }
  return { units, cols, rows, parcelW, parcelD, floorsPerHouse, footprint, houseW, houseD, floorHeight: FLOOR_H.house };
}

/** Warehouse: one floor, as large as allowed, in the building band. */
export function warehouseModel(r: Potential, res: Record<IdeaKey, IdeaResult>) {
  const area = res.gudang.built;
  const { dMid } = bands(r);
  const width = dMid > 0 ? Math.min(r.P, area / dMid) : 0;
  const box = centredInBand(r, area, width);
  return { area, ...box, height: FLOOR_H.warehouse };
}

type CheckResult = { fp: number; tfa: number; green: number; A: number; answer: { kind: string; extra: number }; okKdb: boolean; okKlb: boolean; okKdh: boolean };

/** Step 3: the existing building (solid) and the extra floors the rules still allow (ghost). */
export function existingModel(land: Pick<Land, 'P' | 'L'>, c: CheckResult) {
  const P = Math.max(0, Number(land.P) || 0), L = Math.max(0, Number(land.L) || 0);
  const s = stack(c.tfa, c.fp);
  // Green sits at the back as a full-width band; the building keeps the land's proportions and stays inside the land.
  const greenDepth = P > 0 ? Math.min(L, c.green / P) : 0;
  let width = Math.min(P, Math.sqrt((c.fp * P) / Math.max(L, EPS)));
  let depth = width > 0 ? c.fp / width : 0;
  if (depth > L && L > 0) { depth = L; width = Math.min(P, c.fp / depth); }
  const free = Math.max(0, L - greenDepth - depth);
  const z0 = Math.min(Math.max(0, L - depth), free * 0.6);
  return {
    footprint: c.fp, ...s,
    partialDepth: c.fp > 0 ? depth * (s.partial / c.fp) : 0,
    ghostFloors: c.answer.extra,
    cx: 0, z0, width, depth, greenDepth,
    overlapsGreen: depth + greenDepth > L + EPS,
    broken: !c.okKdb || !c.okKlb || !c.okKdh,
    floorHeight: FLOOR_H.max,
  };
}

/** Parking bays to outline in the open band: at most `cars`, laid out in a row along the frontage. */
export function parkingBays(r: Potential) {
  const { dFront } = bands(r);
  if (!(r.cars > 0) || dFront < CAR_BAY_D * 0.6) return [] as { cx: number; z0: number; w: number; d: number }[];
  const perRow = Math.max(1, Math.floor(r.P / CAR_BAY_W));
  const n = Math.min(r.cars, perRow);
  const d = Math.min(CAR_BAY_D, dFront);
  const start = -((n * CAR_BAY_W) / 2) + CAR_BAY_W / 2;
  return Array.from({ length: n }, (_, i) => ({ cx: start + i * CAR_BAY_W, z0: Math.max(0, dFront - d), w: CAR_BAY_W, d }));
}

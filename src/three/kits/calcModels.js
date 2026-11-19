// Calculator models: pure functions that turn the calculator's numbers into drawable parts.
//
// Every plan dimension comes from src/lib/calc/geometry.ts (bands, stack, maxBuilding, kosModel, …);
// this file only decides how those rectangles are dressed (shadow gaps, windows, roofs) and adds the
// few layout numbers geometry.ts does not provide (see "Added layout" notes below). No three.js here,
// so the truth of the picture can be unit-tested: see calcModels.test.ts.
//
// Coordinates ("land space", the same convention as geometry.ts):
//   x  metres from the land's centre line (land spans −P/2 … +P/2)
//   z  metres from the road edge of the land (0 = front boundary, L = back boundary; the road is at z < 0)
//   y  metres above the top of the land plate
//
// A Part is one box (or roof prism, or outline):
//   { key, kind, tone, role, level, x, z, w, d, y0, h }
//     key    stable identity, so the scene can morph a part instead of replacing it
//     kind   'plate' | 'green' | 'box' | 'roof' | 'ghost' | 'hatch' | 'hatchflat' | 'dark' | 'outline'
//     tone   clay tone for 'box' / 'roof' ('base' | 'slab' | 'wall' | 'soft' | 'deep' | 'glass')
//     role   what the part MEANS: 'land' | 'green' | 'greenShort' | 'pad' | 'floor' | 'ghost' | 'window'
//            | 'parcel' | 'bay' | 'apron' | 'road' (parts without a role are dressing only)
//     level  −1 = on the ground; n ≥ 0 = belongs to storey n of the model (levels[n] is its height)
//     x, z   CENTRE of the part in plan;  w, d  size along x and z
//     y0, h  bottom offset above its level's base (or above the plate for level −1) and height
// toPieces() converts parts to the assembly engine's Piece shape ({ kind, size, pos, tone }) in world metres.
import { potential, ideas as calcIdeas, rank, check as calcCheck } from '../../lib/calc/calc.ts';
import {
  bands, drawnFloors, maxBuilding, kosModel, rukoModel, housesModel, warehouseModel, existingModel, parkingBays,
  ROAD_DEPTH, MAX_DRAWN_FLOORS,
} from '../../lib/calc/geometry.ts';

// ---------- visual-only constants (they never change an area or a count) ----------
export const GAP_H = 0.2; // recessed shadow gap under every storey, so floors can be counted
export const GAP_IN = 0.1;
export const PAD_H = 0.05; // the building band: a clay slab, slightly raised (docs/06 §5.2)
export const ZONE_H = 0.03;
export const KERB_W = 0.35;
export const ROAD_DROP = 0.1;
const WIN_T = 0.07; // window panels stand 3 cm proud of the wall
const WIN_OUT = 0.03;
const MIN_BAY = 0.9; // narrowest window bay drawn
const MAX_WINDOWS = 2400;
const MAX_BODIES = 4000;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const sum = (list) => list.reduce((a, b) => a + b, 0);
/** Rectangle from a centre x, a front edge z0, a width and a depth. */
const R = (cx, z0, w, d) => ({ x: cx, z: z0 + d / 2, w, d });

/** Plate thickness and dimension-line offset scale with the plot so they read the same at any size. */
export const plateThickness = (P, L) => clamp(Math.hypot(P, L) * 0.012, 0.18, 1.2);
export const dimOffset = (P, L) => clamp(Math.hypot(P, L + ROAD_DEPTH) * 0.045, 0.7, 9);
/** The road runs past the plot on both sides, so it reads as a road and not as a doormat. */
export const roadReach = (P) => clamp(P * 0.12, 3, 10);

const ground = (key, kind, rect, y0, h, extra = {}) => ({ key, kind, tone: 'base', level: -1, ...rect, y0, h, ...extra });

/** One storey: a recessed shadow gap, then the body. The body is the exact footprint. */
function storey(out, id, level, rect, h, { gap = true, kind = 'box', tone = 'wall', over } = {}) {
  const g = gap ? gapPart(out, id, level, rect) : 0;
  out.push({ key: `${id}:f${level}`, kind, tone, role: 'floor', level, ...rect, y0: g, h: h - g, ...(over ? { over } : {}) });
  return g;
}
function gapPart(out, id, level, rect) {
  if (!(rect.w > 4 * GAP_IN && rect.d > 4 * GAP_IN)) return 0;
  out.push({ key: `${id}:g${level}`, kind: 'box', tone: 'gap', level, x: rect.x, z: rect.z, w: rect.w - 2 * GAP_IN, d: rect.d - 2 * GAP_IN, y0: 0, h: GAP_H });
  return GAP_H;
}
/** A flat panel on a facade that faces the road (`front`) or the back. `zFace` is the wall plane. */
const panel = (key, level, x, zFace, w, y0, h, front, extra = {}) => ({
  key, kind: 'box', tone: 'glass', level, x, z: zFace + (front ? 1 : -1) * (WIN_T / 2 - WIN_OUT), w, d: WIN_T, y0, h, ...extra,
});

// ---------- shared ground: plate, road, kerb ----------
function baseParts(P, L, roadP, th) {
  const out = [];
  // The land plate IS the open zone (paper tone with dots). Green and building pads sit on top of it,
  // so "open" is always exactly the land minus what is drawn on it.
  out.push(ground('plate', 'plate', R(0, 0, P, L), -th, th, { role: 'land' }));
  if (roadP > 0) {
    roadP += 2 * roadReach(roadP);
    const roadD = ROAD_DEPTH - KERB_W;
    out.push(ground('road', 'dark', R(0, -ROAD_DEPTH, roadP, roadD), -th, th - ROAD_DROP, { role: 'road' }));
    out.push(ground('kerb', 'box', R(0, -KERB_W, roadP, KERB_W), -th, th, { tone: 'base' }));
    const n = Math.max(1, Math.round(roadP / 4.5));
    const pitch = roadP / n;
    const len = Math.min(1.8, pitch * 0.45);
    for (let i = 0; i < n; i++) {
      out.push(ground(`dash:${i}`, 'box', { x: -roadP / 2 + pitch * (i + 0.5), z: -KERB_W - roadD / 2, w: len, d: 0.16 }, -ROAD_DROP, 0.02, { tone: 'wall' }));
    }
  }
  return out;
}

/** Front-to-back bands (docs/05 §9.3): green at the back, a clay pad under each real footprint. */
function bandGround(r, footprints, { bays = true } = {}) {
  const b = bands(r);
  const out = [];
  if (b.dBack > 1e-6) out.push(ground('green:band', 'green', R(0, r.L - b.dBack, r.P, b.dBack), 0, ZONE_H, { role: 'green' }));
  footprints.forEach((f, i) => out.push(ground(`pad:${i}`, 'box', f, 0, PAD_H, { tone: 'slab', role: 'pad' })));
  if (bays) parkingBays(r).forEach((bay, i) => out.push(ground(`bay:${i}`, 'outline', R(bay.cx, bay.z0, bay.w, bay.d), 0, 0, { role: 'bay' })));
  return out;
}

const greenLabel = (r, area, depth) => {
  if (!(depth > 0.8)) return [];
  const end = r.P / 2; // on the band's end, where it shows past a building that hides the middle
  return [['green', 0], ['green:l', -end], ['green:r', end]].map(([key, x]) => ({ key, group: 'green', type: 'green', x, z: r.L - depth / 2, lv: [0, 0], dy: 0.1, area }));
};

const noModel = (id, r, extra = {}) => ({
  id, levels: [], parts: [], ground: bandGround(r, []), labels: [...greenLabel(r, r.greenMin, bands(r).dBack)], stack: null, boxes: [],
  info: { fits: false, floorArea: 0, total: 0, ...extra },
});

/** Full floors + the shallower top floor, set back from the road. Returns the rectangles per level. */
function stackRects({ cx, z0, width, depth, partialDepth }, df) {
  const rects = [];
  for (let k = 0; k < df.full; k++) rects.push(R(cx, z0, width, depth));
  // a lone smaller floor is centred on the footprint; a top floor is set back from the road
  if (df.partial > 0) rects.push(R(cx, z0 + (depth - partialDepth) * (df.full === 0 ? 0.5 : 1), width, partialDepth));
  return rects;
}

// ---------- step 1: the maximum building ----------
function buildMax(r) {
  const m = maxBuilding(r);
  if (!(m.fpUsed > 0) || !(m.width > 0) || m.full + (m.partial > 0 ? 1 : 0) === 0) return noModel('max', r);
  const df = drawnFloors(m.full, m.partial);
  const rects = stackRects(m, df);
  const parts = [];
  rects.forEach((rect, k) => storey(parts, 'm', k, rect, m.floorHeight));
  const levels = rects.map(() => m.floorHeight);
  const fp = rects[0];
  return {
    id: 'max', levels, parts, ground: bandGround(r, [fp]),
    labels: [
      { key: 'top', type: 'area', x: fp.x, z: fp.z, lv: [levels.length, levels.length], area: m.full * m.fpUsed + m.partial },
      { key: 'floors', type: 'floors', lv: [0, levels.length], full: m.full, partial: m.partial },
      ...greenLabel(r, r.greenMin, bands(r).dBack),
      ...capLabel(df, fp, levels.length),
    ],
    stack: { x: fp.x + fp.w / 2, z: fp.z - fp.d / 2 },
    boxes: rects.map((rect, k) => ({ ...rect, from: k, to: k + 1 })),
    info: { fits: true, full: m.full, partial: m.partial, total: df.total, capped: df.capped, footprint: m.fpUsed, floorArea: m.full * m.fpUsed + m.partial },
  };
}

const capLabel = (df, fp, top) => (df.capped ? [{ key: 'cap', type: 'cap', x: fp.x, z: fp.z, lv: [top, top], n: df.total }] : []);

/**
 * Rooms per floor in proportion to floor area (largest remainder), so the rooms add up to exactly `units`.
 * Added layout: geometry.ts gives only the average (units / floors); the top floor is smaller, so it gets fewer.
 */
export function roomsPerFloor(units, areas) {
  const total = sum(areas);
  if (!(total > 0) || !(units > 0)) return areas.map(() => 0);
  const quota = areas.map((a) => (units * a) / total);
  const out = quota.map((q) => Math.floor(q + 1e-9));
  let left = units - sum(out);
  const order = quota.map((q, i) => [q - out[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let j = 0; left > 0 && j < order.length; j++, left--) out[order[j][1]] += 1;
  return out;
}

// ---------- step 2: kos-kosan ----------
function buildKos(r, res) {
  const m = kosModel(r, res);
  if (!res.kos.fits || !(m.fpUsed > 0) || m.floors === 0) return noModel('kos', r, { units: 0 });
  const df = drawnFloors(m.full, m.partial);
  const rects = stackRects(m, df);
  const parts = [];
  rects.forEach((rect, k) => storey(parts, 'k', k, rect, m.floorHeight));
  const levels = rects.map(() => m.floorHeight);

  // One window per room. Deep floors are double-loaded (rooms front and back), shallow ones single-loaded.
  const areas = [...Array.from({ length: m.full }, () => m.fpUsed), ...(m.partial > 0 ? [m.partial] : [])];
  const rooms = roomsPerFloor(res.kos.units, areas);
  const perSideCap = Math.max(1, Math.floor(MAX_WINDOWS / (2 * rects.length)));
  let windows = 0;
  let windowsCapped = df.capped;
  rects.forEach((rect, k) => {
    const n = rooms[k] ?? 0;
    const nFront = rect.d >= 7 ? Math.ceil(n / 2) : n;
    const most = Math.min(perSideCap, Math.max(1, Math.floor(rect.w / MIN_BAY)));
    const sides = [[true, Math.min(nFront, most)], [false, Math.min(n - nFront, most)]];
    if (sides[0][1] + sides[1][1] < n) windowsCapped = true;
    for (const [front, count] of sides) {
      const bay = rect.w / Math.max(1, count);
      const ww = clamp(bay * 0.5, 0.3, 1.25);
      const zFace = front ? rect.z - rect.d / 2 : rect.z + rect.d / 2;
      for (let i = 0; i < count; i++) {
        parts.push(panel(`k:w${k}:${front ? 'f' : 'b'}${i}`, k, rect.x - rect.w / 2 + bay * (i + 0.5), zFace, ww, 1.05, 1.25, front, { role: 'window' }));
        windows += 1;
      }
    }
  });
  const fp = rects[0];
  const built = m.full * m.fpUsed + m.partial;
  return {
    id: 'kos', levels, parts, ground: bandGround(r, [fp]),
    labels: [
      { key: 'top', type: 'idea', idea: 'kos', x: fp.x, z: fp.z, lv: [levels.length, levels.length], units: res.kos.units },
      { key: 'floors', type: 'floors', lv: [0, levels.length], full: m.full, partial: m.partial },
      ...greenLabel(r, r.greenMin, bands(r).dBack),
      ...capLabel(df, fp, levels.length),
    ],
    stack: { x: fp.x + fp.w / 2, z: fp.z - fp.d / 2 },
    boxes: rects.map((rect, k) => ({ ...rect, from: k, to: k + 1 })),
    info: { fits: true, units: res.kos.units, rooms, windows, windowsCapped, full: m.full, partial: m.partial, total: df.total, capped: df.capped, footprint: m.fpUsed, floorArea: built },
  };
}

// ---------- step 2: ruko ----------
function buildRuko(r, res, I) {
  const m = rukoModel(r, res, I);
  if (!(m.units > 0) || !(m.unitFootprint > 0) || m.full + (m.partial > 0 ? 1 : 0) === 0) return noModel('ruko', r, { units: 0 });
  const df = drawnFloors(m.full, m.partial);
  const uw = m.unitWidth;
  const n = m.units;
  const x0 = m.cx - m.rowWidth / 2;
  const count = df.full + (df.partial > 0 ? 1 : 0);
  const levels = Array.from({ length: count }, (_, k) => (k === 0 ? m.groundHeight : m.upperHeight));
  const merged = n * count > MAX_BODIES; // absurd inputs only: one body per storey for the whole row
  const detail = n * count <= 500 && uw >= 1.6;
  const parts = [];
  const rowRects = [];
  for (let k = 0; k < count; k++) {
    const top = k >= df.full; // the shallower top storey, set back from the road
    const d = top ? m.partialDepth : m.unitDepth;
    const z0 = top ? m.z0 + m.unitDepth - m.partialDepth : m.z0;
    const h = levels[k];
    const row = R(m.cx, z0, m.rowWidth, d);
    rowRects.push(row);
    const g = gapPart(parts, 'r', k, row);
    if (merged) parts.push({ key: `r:row${k}`, kind: 'box', tone: 'wall', role: 'floor', level: k, ...row, y0: g, h: h - g, units: n });
    else for (let i = 0; i < n; i++) parts.push({ key: `r${i}:f${k}`, kind: 'box', tone: 'wall', role: 'floor', level: k, unit: i, ...R(x0 + uw * (i + 0.5), z0, uw, d), y0: g, h: h - g });

    // Party lines: a thin strip on the facade and a low parapet on the roof at every unit boundary,
    // so the units can be counted. They sit inside the footprint: the unit boxes keep their exact width.
    const roofFront = z0;
    const roofDepth = k === df.full - 1 && df.partial > 0 ? d - m.partialDepth : d; // roof left open by the storey above
    const exposed = k === count - 1 || (k === df.full - 1 && df.partial > 0);
    if (n * count <= 1500) {
      for (let b = 0; b <= n; b++) {
        const xb = clamp(x0 + uw * b, x0 + 0.07, x0 + m.rowWidth - 0.07);
        if (detail) {
          parts.push({ key: `r:j${k}:f${b}`, kind: 'box', tone: 'slab', level: k, x: xb, z: z0 + 0.02, w: 0.14, d: 0.1, y0: g, h: h - g });
          parts.push({ key: `r:j${k}:b${b}`, kind: 'box', tone: 'slab', level: k, x: xb, z: z0 + d - 0.02, w: 0.14, d: 0.1, y0: g, h: h - g });
        }
        if (exposed && roofDepth > 0.3) parts.push({ key: `r:p${k}:${b}`, kind: 'box', tone: 'slab', level: k, x: xb, z: roofFront + roofDepth / 2, w: 0.14, d: roofDepth, y0: h, h: 0.28 });
      }
    }
    if (detail) {
      for (let i = 0; i < n; i++) {
        const cx = x0 + uw * (i + 0.5);
        if (k === 0) {
          // shop front: glazing almost the full width, with a fascia band above
          parts.push(panel(`r${i}:shop`, 0, cx, z0, uw - 0.8, 0.3, Math.min(2.6, h - 1.3), true, { role: 'shopfront', unit: i }));
          parts.push({ key: `r${i}:fascia`, kind: 'box', tone: 'slab', level: 0, x: cx, z: z0 + 0.01, w: uw - 0.34, d: 0.12, y0: h - 0.95, h: 0.5 });
        } else {
          parts.push(panel(`r${i}:w${k}f`, k, cx, z0, Math.min(uw * 0.52, 2.4), 1.05, 1.5, true));
        }
        parts.push(panel(`r${i}:w${k}b`, k, cx, z0 + d, Math.min(uw * 0.3, 1.2), 1.1, 1.3, false));
      }
    }
  }
  const fp = rowRects[0];
  const perUnit = m.full * m.unitFootprint + m.partial;
  return {
    id: 'ruko', levels, parts, ground: bandGround(r, [fp]),
    labels: [
      { key: 'top', type: 'idea', idea: 'ruko', x: fp.x, z: fp.z, lv: [count, count], units: n, perUnit },
      { key: 'floors', type: 'floors', lv: [0, count], full: m.full, partial: m.partial },
      ...greenLabel(r, r.greenMin, bands(r).dBack),
      ...capLabel(df, fp, count),
    ],
    stack: { x: fp.x + fp.w / 2, z: fp.z - fp.d / 2 },
    boxes: rowRects.map((rect, k) => ({ ...rect, from: k, to: k + 1 })),
    info: { fits: true, units: n, unitWidth: uw, unitFootprint: m.unitFootprint, perUnit, merged, full: m.full, partial: m.partial, total: df.total, capped: df.capped, footprint: fp.w * fp.d, floorArea: n * perUnit },
  };
}

/**
 * Green for the rental houses: yards inside the parcels instead of one band (docs/05 §9.5), filled in a
 * fixed order until the total is exactly `target` m². Each group is filled evenly.
 * Added layout: geometry.ts has no helper for this.
 * A region is { key, x0, x1, z0, z1, axis: 'x' | 'z', from: 'min' | 'max' } and grows along `axis` from that side.
 */
export function fillGreen(target, groups) {
  const out = [];
  let left = target;
  for (const group of groups) {
    const cap = sum(group.map((g) => Math.max(0, g.x1 - g.x0) * Math.max(0, g.z1 - g.z0)));
    if (!(cap > 1e-9) || !(left > 1e-9)) continue;
    const f = Math.min(1, left / cap);
    for (const g of group) {
      let { x0, x1, z0, z1 } = g;
      if (!(x1 - x0 > 1e-9) || !(z1 - z0 > 1e-9)) continue;
      if (g.axis === 'z') { if (g.from === 'max') z0 = z1 - (z1 - z0) * f; else z1 = z0 + (z1 - z0) * f; }
      else if (g.from === 'max') x0 = x1 - (x1 - x0) * f;
      else x1 = x0 + (x1 - x0) * f;
      out.push({ key: g.key, x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 });
    }
    left -= f * cap;
  }
  return { rects: out, shortfall: Math.max(0, left) };
}

// ---------- step 2: rental houses ----------
function buildHouses(r, res, I) {
  const m = housesModel(r, res, I);
  if (!(m.units > 0) || !(m.footprint > 0)) return { ...noModel('rumah', r, { units: 0 }) };
  const { P, L } = r;
  const rowBand = L / m.rows;
  // geometry.ts lets a house grow wider than its parcel when the footprint is over 80% of it: keep it inside.
  let hw = m.houseW;
  let hd = m.houseD;
  if (hw > m.parcelW) { hw = m.parcelW; hd = m.footprint / hw; }
  const clamped = hd > rowBand + 1e-9; // cannot be drawn truthfully on this grid (reported, never silent)
  if (clamped) hd = rowBand;
  const pd = Math.max(m.parcelD, hd);
  const df = drawnFloors(m.floorsPerHouse, 0);
  const floors = df.full;
  const units = Math.min(m.units, Math.floor(MAX_BODIES / floors));
  const detail = units * floors <= 400;
  const ridgeX = hw >= hd;
  const roofH = clamp(Math.min(hw, hd) * 0.42, 0.9, 2.4);
  const eave = Math.max(0, Math.min(0.25, (m.parcelW - hw) / 2, (pd - hd) / 2));
  const levels = [...Array.from({ length: floors }, () => m.floorHeight), roofH];
  const parts = [];
  const pads = [];
  const outlines = [];
  const cells = [];
  for (let i = 0; i < units; i++) {
    const col = i % m.cols;
    const row = Math.floor(i / m.cols);
    const cx = -P / 2 + m.parcelW * (col + 0.5);
    const cz = rowBand * (row + 0.5);
    const rect = { x: cx, z: cz, w: hw, d: hd };
    cells.push({ i, cx, cz, row, col });
    for (let k = 0; k < floors; k++) {
      storey(parts, `h${i}`, k, rect, m.floorHeight, { gap: detail });
      if (detail && hw >= 3.2) {
        const zFace = cz - hd / 2;
        const ww = clamp(hw * 0.18, 0.55, 1.2);
        parts.push(panel(`h${i}:w${k}l`, k, cx - hw * 0.27, zFace, ww, 1.0, 1.2, true));
        parts.push(panel(`h${i}:w${k}r`, k, cx + hw * 0.27, zFace, ww, 1.0, 1.2, true));
        if (k === 0 && hw >= 4.4) parts.push(panel(`h${i}:door`, 0, cx, zFace, 0.95, GAP_H, 2.05, true));
      }
    }
    parts.push({ key: `h${i}:roof`, kind: 'roof', tone: 'slab', level: floors, x: cx, z: cz, w: hw + 2 * eave, d: hd + 2 * eave, y0: 0, h: roofH, ridge: ridgeX ? 'x' : 'z' });
    pads.push(ground(`pad:${i}`, 'box', rect, 0, PAD_H, { tone: 'slab', role: 'pad' }));
    outlines.push(ground(`parcel:${i}`, 'outline', { x: cx, z: cz, w: m.parcelW, d: pd }, 0, 0, { role: 'parcel' }));
  }
  // Green: first the land between the rows (when parcels do not fill the depth), then back yards, front
  // yards, side yards, and finally any grid cell left without a house.
  const gapD = (rowBand - pd) / 2;
  const rows = Array.from({ length: m.rows }, (_, row) => row);
  const empties = [];
  for (let i = units; i < m.cols * m.rows; i++) empties.push({ col: i % m.cols, row: Math.floor(i / m.cols) });
  const green = fillGreen(r.greenMin, [
    rows.map((row) => ({ key: `green:gb${row}`, x0: -P / 2, x1: P / 2, z0: rowBand * (row + 1) - gapD, z1: rowBand * (row + 1), axis: 'z', from: 'max' })),
    rows.map((row) => ({ key: `green:gf${row}`, x0: -P / 2, x1: P / 2, z0: rowBand * row, z1: rowBand * row + gapD, axis: 'z', from: 'min' })),
    cells.map((c) => ({ key: `green:b${c.i}`, x0: c.cx - m.parcelW / 2, x1: c.cx + m.parcelW / 2, z0: c.cz + hd / 2, z1: c.cz + pd / 2, axis: 'z', from: 'max' })),
    cells.map((c) => ({ key: `green:f${c.i}`, x0: c.cx - m.parcelW / 2, x1: c.cx + m.parcelW / 2, z0: c.cz - pd / 2, z1: c.cz - hd / 2, axis: 'z', from: 'min' })),
    cells.flatMap((c) => [
      { key: `green:l${c.i}`, x0: c.cx - m.parcelW / 2, x1: c.cx - hw / 2, z0: c.cz - hd / 2, z1: c.cz + hd / 2, axis: 'x', from: 'min' },
      { key: `green:r${c.i}`, x0: c.cx + hw / 2, x1: c.cx + m.parcelW / 2, z0: c.cz - hd / 2, z1: c.cz + hd / 2, axis: 'x', from: 'max' },
    ]),
    empties.map((e) => ({
      key: `green:e${e.row}:${e.col}`, x0: -P / 2 + m.parcelW * e.col, x1: -P / 2 + m.parcelW * (e.col + 1),
      z0: rowBand * (e.row + 0.5) - pd / 2, z1: rowBand * (e.row + 0.5) + pd / 2, axis: 'z', from: 'max',
    })),
  ]);
  const first = { x: cells[0].cx, z: cells[0].cz, w: hw, d: hd };
  return {
    id: 'rumah', levels, parts,
    ground: [...green.rects.map((g) => ground(g.key, 'green', g, 0, ZONE_H, { role: 'green' })), ...pads, ...outlines],
    labels: [
      { key: 'top', type: 'idea', idea: 'rumah', x: 0, z: L / 2, lv: [levels.length, levels.length], units: m.units },
      { key: 'floors', type: 'floors', lv: [0, floors], full: m.floorsPerHouse, partial: 0 },
      ...capLabel(df, first, levels.length),
    ],
    stack: { x: first.x + hw / 2, z: first.z - hd / 2 },
    boxes: cells.length <= 48 ? cells.map((c) => ({ x: c.cx, z: c.cz, w: hw, d: hd, from: 0, to: floors + 1 })) : [],
    info: {
      fits: true, units: m.units, drawnUnits: units, cols: m.cols, rows: m.rows, parcelW: m.parcelW, parcelD: pd, houseW: hw, houseD: hd,
      floorsPerHouse: m.floorsPerHouse, footprint: m.footprint, clamped, greenShortfall: green.shortfall,
      full: m.floorsPerHouse, partial: 0, total: df.total, capped: df.capped, floorArea: m.units * m.footprint * m.floorsPerHouse,
    },
  };
}

// ---------- step 2: warehouse ----------
function buildWarehouse(r, res) {
  const m = warehouseModel(r, res);
  if (!(m.area > 0) || !(m.width > 0) || !(m.depth > 0)) return noModel('gudang', r);
  const fp = R(m.cx, m.z0, m.width, m.depth);
  const ridgeX = m.width >= m.depth;
  const rise = clamp(Math.min(m.width, m.depth) * 0.075, 0.4, 1.8); // low pitch; the ridge is at `height`
  const eaves = m.height - rise;
  const parts = [];
  storey(parts, 'g', 0, fp, eaves);
  parts.push({ key: 'g:roof', kind: 'roof', tone: 'slab', level: 1, ...fp, y0: 0, h: rise, ridge: ridgeX ? 'x' : 'z' });
  // Loading doors on the road side, and the loading apron marked in the open band in front of them.
  const doors = m.width >= 5 ? clamp(Math.round(m.width / 9), 1, 8) : 0;
  const pitch = m.width / Math.max(1, doors);
  const doorW = Math.min(3.6, pitch * 0.6);
  const apronD = Math.min(m.z0, 14);
  const extra = [];
  for (let i = 0; i < doors; i++) {
    const cx = m.cx - m.width / 2 + pitch * (i + 0.5);
    parts.push(panel(`g:door${i}`, 0, cx, m.z0, doorW, GAP_H, Math.min(4.4, eaves - 0.9), true));
    if (apronD >= 2.5) extra.push(ground(`apron:bay${i}`, 'outline', R(cx, m.z0 - apronD, Math.min(3.6, pitch * 0.8), apronD), 0, 0, { role: 'apron' }));
  }
  if (apronD >= 2.5) extra.push(ground('apron', 'outline', R(m.cx, m.z0 - apronD, m.width, apronD), 0, 0, { role: 'apron' }));
  return {
    id: 'gudang', levels: [eaves, rise], parts, ground: [...bandGround(r, [fp], { bays: false }), ...extra],
    labels: [
      { key: 'top', type: 'idea', idea: 'gudang', x: fp.x, z: fp.z, lv: [2, 2], area: m.area },
      ...greenLabel(r, r.greenMin, bands(r).dBack),
    ],
    stack: null,
    boxes: [{ ...fp, from: 0, to: 2 }],
    info: { fits: true, area: m.area, height: m.height, full: 1, partial: 0, total: 1, capped: false, footprint: m.area, floorArea: m.area },
  };
}

// ---------- step 3: the existing building and what could be added ----------
function buildExisting(land, r, C) {
  const c = calcCheck(land, C);
  const e = existingModel(land, c);
  const { P, L } = r;
  const zones = [];
  if (e.greenDepth > 1e-6) zones.push(ground('green:band', 'green', R(0, L - e.greenDepth, P, e.greenDepth), 0, ZONE_H, { role: 'green' }));
  // KDH broken: the green that is still missing, hatched, in front of the green there is.
  const shortD = Math.min(c.greenShort / P, Math.max(0, L - e.greenDepth));
  if (shortD > 1e-6) zones.push(ground('green:short', 'hatchflat', R(0, L - e.greenDepth - shortD, P, shortD), 0, ZONE_H + 0.005, { role: 'greenShort' }));

  const has = e.footprint > 0 && e.width > 0 && e.depth > 0;
  const df = drawnFloors(e.full, e.partial);
  const solid = has ? df.full + (df.partial > 0 ? 1 : 0) : 0;
  const ghosts = has && !df.capped ? Math.min(e.ghostFloors, MAX_DRAWN_FLOORS - solid) : 0;
  const trueTotal = df.total + e.ghostFloors;
  const capped = df.capped || ghosts < e.ghostFloors;
  const fh = e.floorHeight;
  const parts = [];
  const rects = has ? stackRects(e, df) : [];
  const main = has ? R(e.cx, e.z0, e.width, e.depth) : null;

  // Over-limit amounts straight from check(): never estimated.
  const overFp = !c.okKdb ? Math.max(0, -c.fpRoom) : 0;
  const overFa = !c.okKlb ? Math.max(0, -c.faRoom) : 0;
  const sliceW = has && c.fp > 0 ? e.width * Math.min(1, overFp / c.fp) : 0; // KDB: the part of the footprint past the limit
  let rem = overFa; // KLB: floor area past the limit, counted from the top floor down
  const klbFrac = [];
  for (let k = rects.length - 1; k >= 0; k--) {
    const area = k < df.full ? c.fp : e.partial;
    const f = area > 0 ? Math.min(1, rem / area) : 0;
    klbFrac[k] = f;
    rem -= f * area;
  }
  rects.forEach((rect, k) => {
    const g = gapPart(parts, 'e', k, rect);
    const zA = rect.z - rect.d / 2;
    const dOver = rect.d * klbFrac[k]; // front slice of this floor is over the KLB limit
    const xL = rect.x - rect.w / 2;
    const xR = rect.x + rect.w / 2;
    const xs = xR - sliceW;
    const push = (key, kind, x0, x1, z0, z1, over) => {
      if (!(x1 - x0 > 1e-6) || !(z1 - z0 > 1e-6)) return;
      parts.push({ key, kind, tone: 'wall', role: 'floor', level: k, x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, y0: g, h: fh - g, ...(over ? { over } : {}) });
    };
    push(`e:k${k}`, 'hatch', xL, xR, zA, zA + dOver, 'klb');
    push(`e:f${k}`, 'box', xL, xs, zA + dOver, zA + rect.d);
    push(`e:b${k}`, 'hatch', xs, xR, zA + dOver, zA + rect.d, 'kdb');
  });
  for (let j = 0; j < ghosts; j++) parts.push({ key: `e:x${j}`, kind: 'ghost', tone: 'base', role: 'ghost', level: solid + j, ...main, y0: 0, h: fh });
  const levels = Array.from({ length: solid + ghosts }, () => fh);

  const labels = [...greenLabel(r, c.green, e.greenDepth)];
  if (has && solid > 0) labels.push({ key: 'existing', type: 'existing', lv: [0, solid], full: e.full, partial: e.partial });
  if (ghosts > 0) labels.push({ key: 'ghost', type: 'ghost', lv: [solid, solid + ghosts], floors: e.ghostFloors });
  if (capped && main) labels.push({ key: 'cap', type: 'cap', x: main.x, z: main.z, lv: [levels.length, levels.length], n: trueTotal });
  return {
    id: 'existing', levels, parts,
    ground: [...zones, ...(main ? [ground('pad:0', 'box', main, 0, PAD_H, { tone: 'slab', role: 'pad' })] : [])],
    labels,
    stack: main && levels.length ? { x: main.x + main.w / 2, z: main.z - main.d / 2 } : null,
    boxes: [...rects.map((rect, k) => ({ ...rect, from: k, to: k + 1 })), ...(ghosts ? [{ ...main, from: solid, to: solid + ghosts }] : [])],
    info: {
      fits: has, fp: c.fp, tfa: c.tfa, green: c.green, full: e.full, partial: e.partial, ghostFloors: e.ghostFloors, drawnGhosts: ghosts,
      broken: e.broken, overFp, overFa, greenShort: c.greenShort, overlapsGreen: e.overlapsGreen,
      clamped: has && e.width * e.depth < c.fp - 1e-6, total: trueTotal, capped, footprint: has ? e.width * e.depth : 0, floorArea: c.tfa,
    },
  };
}

/** Which idea step 2 shows: the visitor's choice, else the fastest payback, else the first that fits. */
export function shownIdea(res, selectedIdea) {
  if (selectedIdea && res[selectedIdea]) return selectedIdea;
  return rank(res).fastest?.key ?? Object.values(res).find((x) => x.fits)?.key ?? 'kos';
}

/**
 * The whole scene for the calculator's current state.
 *   { land, ideas, check, step, selectedIdea }  the store's values
 *   placeholder { P, L }  the last valid land size, used only for the faint outline of the empty state
 * Returns { id, empty, land, th, u, ground, levels, parts, labels, stack, boxes, info, height }.
 */
export function describeScene({ land, ideas, check, step = 1, selectedIdea = null, placeholder = { P: 30, L: 20 } }) {
  const r = potential(land);
  if (!r) {
    // Empty state: the road and a faint plot outline. The plate keeps the entered size (zero in one direction).
    const P = Math.max(0, Number(land?.P) || 0);
    const L = Math.max(0, Number(land?.L) || 0);
    const gp = placeholder.P > 0 ? placeholder.P : 30;
    const gl = placeholder.L > 0 ? placeholder.L : 20;
    const th = plateThickness(gp, gl);
    return {
      id: 'empty', empty: true, land: { P: gp, L: gl }, th, u: dimOffset(gp, gl),
      ground: [...baseParts(P, L, gp, th), ground('plot:empty', 'outline', R(0, 0, gp, gl), 0, 0, { style: 'dash', role: 'placeholder' })],
      levels: [], parts: [], labels: [], stack: null, boxes: [], info: { fits: false }, height: 0,
    };
  }
  const { P, L } = r;
  const th = plateThickness(P, L);
  const u = dimOffset(P, L);
  let model;
  if (step === 3) model = buildExisting(land, r, check);
  else if (step === 2) {
    const res = calcIdeas(r, ideas);
    const key = shownIdea(res, selectedIdea);
    model = key === 'ruko' ? buildRuko(r, res, ideas) : key === 'rumah' ? buildHouses(r, res, ideas) : key === 'gudang' ? buildWarehouse(r, res) : buildKos(r, res);
    if (!model.info.fits) model.labels.push({ key: 'top', type: 'nofit', x: 0, z: L / 2, lv: [0, 0] });
  } else model = buildMax(r);

  const labels = [
    { key: 'front', type: 'front', x: 0, z: -ROAD_DEPTH - u, lv: [0, 0], dy: 0, value: P },
    { key: 'depth', type: 'depth', x: -P / 2 - u, z: L / 2, lv: [0, 0], dy: 0, value: L },
    { key: 'road', type: 'road', x: -P / 2 + Math.min(P * 0.2, 3.5), z: -KERB_W - (ROAD_DEPTH - KERB_W) / 2, lv: [0, 0], dy: 0 },
    ...model.labels.map((l) => ({ dy: 0, ...l })),
  ];
  // labels that hang beside the stack share its front-left corner
  for (const l of labels) {
    if (l.x === undefined && model.stack) { l.x = model.stack.x + u * 0.55; l.z = model.stack.z; }
  }
  return {
    id: model.id, empty: false, land: { P, L }, th, u,
    ground: [...baseParts(P, L, P, th), ...model.ground],
    levels: model.levels, parts: model.parts, labels: labels.filter((l) => l.x !== undefined),
    stack: model.stack, boxes: model.boxes, info: model.info, height: sum(model.levels),
  };
}

/** Parts → assembly Pieces in world metres (x right, y up, z toward the road), at rest. */
export function toPieces(scene) {
  const base = [0];
  for (const h of scene.levels) base.push(base[base.length - 1] + h);
  return [...scene.ground, ...scene.parts].map((p) => {
    const y = (p.level >= 0 ? base[p.level] : 0) + p.y0;
    return { ...p, size: [p.w, p.h, p.d], pos: [p.x, y + p.h / 2, -p.z] };
  });
}

/** Seeded, stable positions for the grass tufts: tuft i of a green part never moves as the count grows. */
export function tuftLayout(greens, { cap = 400, perM2 = 0.5 } = {}) {
  const total = sum(greens.map((g) => g.w * g.d));
  if (!(total > 0)) return [];
  const n = Math.min(cap, Math.round(total * perM2));
  const out = [];
  greens.forEach((g, j) => {
    const count = Math.round((n * g.w * g.d) / total);
    for (let i = 0; i < count; i++) {
      // R2 low-discrepancy sequence, offset per part: even cover for any count, no reshuffling
      const s = i + 1 + j * 7;
      const a = (0.5 + s * 0.7548776662466927) % 1;
      const b = (0.5 + s * 0.5698402909980532) % 1;
      out.push({ key: g.key, u: a, v: b, s: 0.75 + ((s * 0.618034) % 1) * 0.5, rot: ((s * 2.399963) % 6.2832) });
    }
  });
  return out;
}

// The hybrid stay (docs/06 §2.3): 24 × 12 m, four floors at 3.2 m. Perimeter walls with real window
// openings on a 3 m bay, a central corridor with rooms on both sides, a glazed lobby on the ground
// floor and a dark stair core at the east end (garden side, so the street front stays regular). The top floor is cut at 1.4 m with no roof, so the
// rooms (bathroom pods, beds) read as a plan.
//
// Pure: (params) → Piece[] in metres. `origin` is the centre of the footprint at its base; the front
// (street side) faces +z. Pieces: 'box' (clay), 'glass' (windows, lobby front), 'dark' (stair core).
import { box, sequence } from '../assembly/pieces.js';

const T = 0.2; // outer wall thickness
const SLAB = 0.2;
const BAY = 3; // solid 0.7 · window 1.6 · solid 0.7
const SILL = 0.9;
const LINTEL = 0.5;
const PART = 0.1; // partition thickness
const CORRIDOR = 0.9; // half width

/** A run of window bays along x at depth z. Each window is a sill, a lintel and a pane: the opening is a real gap. */
function windowRun(out, at, { x0, n, z, y, h, open }) {
  for (let j = 0; j <= n; j++) {
    const left = j > 0 ? 0.7 : 0;
    const right = j < n ? 0.7 : 0;
    out.push(box([left + right, h, T], at(x0 + j * BAY + (right - left) / 2, y + h / 2, z), { tone: 'wall' }));
  }
  const head = open ? h : h - LINTEL;
  for (let i = 0; i < n; i++) {
    const cx = x0 + i * BAY + BAY / 2;
    out.push(box([1.6, SILL, T], at(cx, y + SILL / 2, z), { tone: 'wall' }));
    if (!open) out.push(box([1.6, LINTEL, T], at(cx, y + h - LINTEL / 2, z), { tone: 'wall' }));
    out.push({ kind: 'glass', size: [1.6, head - SILL, 0.05], pos: at(cx, y + SILL + (head - SILL) / 2, z) });
  }
}

export function buildStay({
  origin = [0, 0, 0],
  stage = 0,
  seed = 3,
  floors = 4,
  bays = 8,
  depth = 12,
  floorHeight = 3.2,
  cut = 1.4,
  lobbyBays = 3,
} = {}) {
  const [ox, oy, oz] = origin;
  const at = (x, y, z) => [ox + x, oy + y, oz + z];
  const W = bays * BAY;
  const hx = W / 2;
  const hz = depth / 2;
  const zF = hz - T / 2;
  const inner = hz - T; // inner face of the long walls
  const core = { w: 3, d: 6 };
  const coreX0 = hx - T - core.w;
  const roomZ = CORRIDOR + PART; // where a room starts, measured from the centre line
  const groups = [];

  for (let f = 0; f < floors; f++) {
    const top = f === floors - 1;
    const ground = f === 0;
    const y = f * floorHeight + SLAB; // top of this floor's slab
    const h = top ? cut : floorHeight - SLAB;
    const pad = ground ? 0.5 : 0.16;
    groups.push([box([W + pad, SLAB, depth + pad], at(0, y - SLAB / 2, 0), { tone: 'slab' })]);

    // ---- perimeter
    const walls = [];
    windowRun(walls, at, { x0: -hx, n: bays, z: -zF, y, h, open: top });
    if (ground && lobbyBays > 0) {
      // lobby: a glazed front in place of the first rooms, under a thin canopy
      const x1 = -hx + lobbyBays * BAY;
      const gh = top ? h : h - LINTEL;
      walls.push(box([0.3, h, T], at(-hx + 0.15, y + h / 2, zF), { tone: 'wall' }));
      let edge = -hx + 0.3;
      for (let k = 1; k <= lobbyBays; k++) {
        const mx = -hx + k * BAY;
        const end = k === lobbyBays ? x1 : mx - 0.07;
        walls.push({ kind: 'glass', size: [end - edge, gh, 0.05], pos: at((edge + end) / 2, y + gh / 2, zF) });
        if (k < lobbyBays) walls.push(box([0.14, gh, 0.16], at(mx, y + gh / 2, zF), { tone: 'wall' }));
        edge = mx + 0.07;
      }
      if (!top) {
        walls.push(box([x1 + hx - 0.3, LINTEL, T], at((x1 - hx + 0.3) / 2, y + gh + LINTEL / 2, zF), { tone: 'wall' }));
        walls.push(box([x1 + hx + 0.4, 0.14, 1.8], at((x1 - hx) / 2, y + gh + 0.07, hz + 0.9), { tone: 'slab' }));
      }
      windowRun(walls, at, { x0: x1, n: bays - lobbyBays, z: zF, y, h, open: top });
    } else {
      windowRun(walls, at, { x0: -hx, n: bays, z: zF, y, h, open: top });
    }
    // west end: a window at the end of the corridor
    const xw = -hx + T / 2;
    const side = inner - 0.8;
    for (const s of [-1, 1]) walls.push(box([T, h, side], at(xw, y + h / 2, s * (0.8 + side / 2)), { tone: 'wall' }));
    walls.push(box([T, SILL, 1.6], at(xw, y + SILL / 2, 0), { tone: 'wall' }));
    const head = top ? h : h - LINTEL;
    if (!top) walls.push(box([T, LINTEL, 1.6], at(xw, y + h - LINTEL / 2, 0), { tone: 'wall' }));
    walls.push({ kind: 'glass', size: [0.05, head - SILL, 1.6], pos: at(xw, y + SILL + (head - SILL) / 2, 0) });
    // east end
    walls.push(box([T, h, depth - 2 * T], at(hx - T / 2, y + h / 2, 0), { tone: 'wall' }));
    groups.push(walls);

    // ---- inside
    const parts = [];
    const furniture = [];
    const zc = CORRIDOR + PART / 2;
    if (!top) {
      // lower floors are hidden under the next slab: corridor walls only (they close the view through the windows)
      const frontStart = ground && lobbyBays > 0 ? -hx + lobbyBays * BAY : -hx + T;
      const run = (x0, x1, z) => {
        const n = Math.max(1, Math.round((x1 - x0) / 6));
        for (let k = 0; k < n; k++) parts.push(box([(x1 - x0) / n, h, PART], at(x0 + ((k + 0.5) * (x1 - x0)) / n, y + h / 2, z), { tone: 'soft' }));
      };
      run(-hx + T, coreX0, -zc);
      run(frontStart, hx - T, zc);
      if (ground && lobbyBays > 0) {
        const lx = -hx + lobbyBays * BAY;
        parts.push(box([PART, h, inner - roomZ], at(lx + PART / 2, y + h / 2, (inner + roomZ) / 2), { tone: 'soft' }));
        furniture.push(box([2.6, 1.05, 0.7], at(lx - 3.6, y + 0.525, 1.7), { tone: 'soft' })); // reception desk
        furniture.push(box([2.0, 0.45, 0.85], at(-hx + 2.2, y + 0.225, 4.3), { tone: 'soft' }));
        furniture.push(box([0.85, 0.45, 2.0], at(lx - 1.2, y + 0.225, 4.0), { tone: 'soft' }));
      }
    } else {
      // top floor: rooms 3 m wide on both sides of the corridor, each with a bathroom pod and a bed
      const hp = Math.min(1.25, h - 0.15);
      const rooms = [];
      for (let i = 0; i < bays; i++) rooms.push({ xa: -hx + i * BAY, xb: -hx + (i + 1) * BAY, s: 1, limit: hx - T });
      for (let i = 0; i < bays; i++) {
        const xa = -hx + i * BAY;
        const xb = Math.min(xa + BAY, coreX0);
        if (xb - xa > 2.2) rooms.push({ xa, xb, s: -1, limit: coreX0 });
      }
      for (const r of rooms) {
        const last = r.xb >= r.limit - 0.01;
        const end = last ? r.limit : r.xb;
        // corridor wall with a door gap at the start of each room
        parts.push(box([end - (r.xa + 1), hp, PART], at((end + r.xa + 1) / 2, y + hp / 2, r.s * zc), { tone: 'soft' }));
        // wall to the next room
        if (!last) parts.push(box([PART, hp, inner - roomZ], at(r.xb, y + hp / 2, (r.s * (inner + roomZ)) / 2), { tone: 'soft' }));
        // bathroom pod 1.5 × 1.8 beside the door
        const bx = r.xb - 1.5;
        const bEnd = last ? end : r.xb - PART / 2;
        parts.push(box([PART, hp, 1.8], at(bx, y + hp / 2, r.s * (roomZ + 0.9)), { tone: 'soft' }));
        parts.push(box([bEnd - (bx + PART / 2), hp, PART], at((bEnd + bx + PART / 2) / 2, y + hp / 2, r.s * (roomZ + 1.8 - PART / 2)), { tone: 'soft' }));
        // bed and pillow
        furniture.push(box([2.0, 0.45, 1.5], at(end - 1.1, y + 0.225, r.s * 4.4), { tone: 'base' }));
        furniture.push(box([0.4, 0.12, 1.2], at(end - 0.35, y + 0.51, r.s * 4.4), { tone: 'wall' }));
      }
    }
    if (parts.length) groups.push(parts);
    if (furniture.length) groups.push(furniture);

    // ---- stair core: the one dark element. It lands last on each floor and rises above the cut.
    const ch = top ? h + 1.2 : h;
    groups.push([{ kind: 'dark', size: [core.w - 0.02, ch, core.d - 0.02], pos: at(coreX0 + core.w / 2 - 0.01, y + ch / 2, -(inner - core.d / 2 - 0.01)) }]);
  }
  return sequence(groups, { seed, stage });
}

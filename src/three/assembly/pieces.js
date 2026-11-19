// The assembly engine's data model (docs/06 §1.6). Pure: no three.js objects, so it can be unit-tested.
//
// A Piece is one box or cylinder of a model:
//   {
//     kind:  'box' | 'cyl' | 'glass' | 'dark' | <custom>   which instanced mesh it belongs to
//     size:  [w, h, d]  metres (cyl: [radius, height, radius-z or 0 = round])
//     pos:   [x, y, z]  final CENTRE position
//     rotY:  final yaw in radians (optional)
//     tone:  'base' | 'slab' | 'wall' | 'soft' | 'deep'    per-instance clay tone (box and cyl kinds)
//     order: 0..1  when it starts within its stage
//     stage: integer  which stage / slide it belongs to
//     drop:  true  → falls straight down from high above (roofs)
//     grow:  true  → scales up from the ground in place (trees, people, grass)
//   }
import { makeRandom } from '../shared/rng.js';

export const box = (size, pos, extra = {}) => ({ kind: 'box', size, pos, tone: 'base', ...extra });
export const cyl = (radius, height, pos, extra = {}) => ({ kind: 'cyl', size: [radius, height, radius], pos, tone: 'base', ...extra });

/**
 * Assigns `order` so pieces arrive as a wave sweeping across the building:
 * groups come one after another (slab → walls → partitions → furniture → next floor …), and inside a
 * group pieces are ordered by distance from a seeded corner, with a little jitter.
 *
 * groups: Piece[][] in build order. Returns one flat Piece[] with order in 0..1 and `stage` set.
 * weights: optional number[] giving each group a share of the stage (default: by piece count, min 1).
 */
export function sequence(groups, { seed = 1, stage = 0, weights, overlap = 0.35 } = {}) {
  const R = makeRandom(seed);
  const all = groups.flat();
  if (!all.length) return [];
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of all) {
    minX = Math.min(minX, p.pos[0]); maxX = Math.max(maxX, p.pos[0]);
    minZ = Math.min(minZ, p.pos[2]); maxZ = Math.max(maxZ, p.pos[2]);
  }
  const corner = [R.rand() < 0.5 ? minX : maxX, R.rand() < 0.5 ? minZ : maxZ];
  const diag = Math.hypot(maxX - minX, maxZ - minZ) || 1;
  const w = groups.map((g, i) => (weights?.[i] ?? Math.max(1, Math.sqrt(g.length))));
  const total = w.reduce((a, b) => a + b, 0);
  const out = [];
  let cursor = 0;
  groups.forEach((group, gi) => {
    const share = w[gi] / total;
    // groups overlap a little so the build reads as one continuous drift, not a queue
    const start = Math.max(0, cursor - share * overlap);
    const end = cursor + share;
    for (const p of group) {
      const d = Math.hypot(p.pos[0] - corner[0], p.pos[2] - corner[1]) / diag;
      const jitter = R.range(-0.03, 0.03);
      const order = Math.min(1, Math.max(0, start + (end - start) * d * 0.85 + jitter * (end - start + 0.1)));
      out.push({ ...p, order, stage: p.stage ?? stage });
    }
    cursor = end;
  });
  return out;
}

/**
 * Turns Piece[] into typed arrays, one bucket per kind, including seeded start transforms:
 * horizontal offset = random direction × 8–20 m, vertical +3–12 m (drop: straight down from +15–25 m),
 * yaw ±25–70°, pitch and roll ±10°. Scale stays 1.
 *
 * Returns { kinds: { [kind]: Bucket }, count, bounds, stages }.
 * Bucket: { count, final (x,y,z)*n, start (x,y,z)*n, size (x,y,z)*n, yaw n, startEuler (x,y,z)*n,
 *           order n, stage n, flags n (1 = grow), tone string[] }
 */
export function prepare(pieces, { seed = 1, spread = 1 } = {}) {
  const R = makeRandom(seed);
  const byKind = new Map();
  for (const p of pieces) {
    if (!byKind.has(p.kind)) byKind.set(p.kind, []);
    byKind.get(p.kind).push(p);
  }
  const deg = Math.PI / 180;
  const kinds = {};
  const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  let stages = 0;
  for (const [kind, list] of byKind) {
    const n = list.length;
    const b = {
      count: n,
      final: new Float32Array(n * 3),
      start: new Float32Array(n * 3),
      size: new Float32Array(n * 3),
      yaw: new Float32Array(n),
      startEuler: new Float32Array(n * 3),
      order: new Float32Array(n),
      stage: new Uint8Array(n),
      flags: new Uint8Array(n),
      tone: new Array(n),
    };
    list.forEach((p, i) => {
      const [x, y, z] = p.pos;
      b.final.set([x, y, z], i * 3);
      b.size.set([p.size[0], p.size[1], p.size[2] || p.size[0]], i * 3);
      b.yaw[i] = p.rotY || 0;
      b.order[i] = p.order ?? 0;
      b.stage[i] = p.stage ?? 0;
      b.tone[i] = p.tone || 'base';
      stages = Math.max(stages, b.stage[i] + 1);
      for (let a = 0; a < 3; a++) {
        const half = (a === 1 ? p.size[1] : Math.max(p.size[0], p.size[2] || p.size[0])) / 2;
        bounds.min[a] = Math.min(bounds.min[a], p.pos[a] - half);
        bounds.max[a] = Math.max(bounds.max[a], p.pos[a] + half);
      }
      if (p.grow) {
        b.flags[i] = 1;
        b.start.set([x, y, z], i * 3);
        b.startEuler.set([0, p.rotY || 0, 0], i * 3);
      } else if (p.drop) {
        b.start.set([x, y + R.range(15, 25) * spread, z], i * 3);
        b.startEuler.set([0, p.rotY || 0, 0], i * 3);
      } else {
        const angle = R.range(0, Math.PI * 2);
        const dist = R.range(8, 20) * spread;
        b.start.set([x + Math.cos(angle) * dist, y + R.range(3, 12) * spread, z + Math.sin(angle) * dist], i * 3);
        b.startEuler.set(
          [R.range(-10, 10) * deg, (p.rotY || 0) + R.sign() * R.range(25, 70) * deg, R.range(-10, 10) * deg],
          i * 3,
        );
      }
    });
    kinds[kind] = b;
  }
  return { kinds, count: pieces.length, bounds, stages };
}

/** Per-piece progress inside its stage: starts at order·0.7 and takes 0.3 of the stage (docs/06 §1.6). */
export const pieceT = (stageProgress, order) => {
  const t = (stageProgress - order * 0.7) / 0.3;
  return t <= 0 ? 0 : t >= 1 ? 1 : t;
};

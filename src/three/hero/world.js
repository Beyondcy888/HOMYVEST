// Hero story: the ground the buildings stand on. Pure builders (no three.js).
//   buildStreet()  road, sidewalk, centre-line dashes, the four plot plates and their kerbs
//   buildStakes()  plot 0's survey stakes and string (idle dressing; they leave when building starts)
//   buildGrass()   plot 0's tufts, as typed arrays for one InstancedMesh
import { box } from '../assembly/pieces.js';
import { makeRandom } from '../shared/rng.js';
import { PLOT, PLATE_TOP, BUILD_Z } from './camera.js';

/** The street runs well past the plots; its ends are hidden by the street fog (see HeroScene). */
export const STREET = { x0: -64, x1: 202, road: [2, 10], walk: [0, 2] };

export function buildStreet() {
  const pieces = [];
  const len = STREET.x1 - STREET.x0;
  const cx = (STREET.x0 + STREET.x1) / 2;
  const [r0, r1] = STREET.road;
  const [w0, w1] = STREET.walk;
  pieces.push(box([len, 0.1, r1 - r0], [cx, 0.05, (r0 + r1) / 2], { tone: 'deep' }));
  pieces.push(box([len, 0.18, w1 - w0], [cx, 0.09, (w0 + w1) / 2], { tone: 'slab' }));
  // a faint dashed centre line
  for (let x = STREET.x0 + 3; x < STREET.x1 - 3; x += 6) {
    pieces.push(box([2.4, 0.02, 0.16], [x, 0.11, (r0 + r1) / 2], { tone: 'wall' }));
  }
  const k = 0.2; // kerb width
  const kh = 0.12; // kerb height above the plate
  for (const px of PLOT.xs) {
    const zc = -PLOT.d / 2;
    pieces.push(box([PLOT.w, PLATE_TOP, PLOT.d], [px, PLATE_TOP / 2, zc], { tone: 'base' }));
    const y = PLATE_TOP + kh / 2;
    pieces.push(box([PLOT.w, kh, k], [px, y, -k / 2], { tone: 'slab' }));
    pieces.push(box([PLOT.w, kh, k], [px, y, -PLOT.d + k / 2], { tone: 'slab' }));
    pieces.push(box([k, kh, PLOT.d - 2 * k], [px - PLOT.w / 2 + k / 2, y, zc], { tone: 'slab' }));
    pieces.push(box([k, kh, PLOT.d - 2 * k], [px + PLOT.w / 2 - k / 2, y, zc], { tone: 'slab' }));
  }
  return pieces.map((p) => ({ ...p, order: 0, stage: 0 }));
}

/** Four corner stakes and a taut string around plot 0. `grow` pieces scale in place, so stage 1 → 0 retracts them. */
export function buildStakes({ stage = 0, line = 0.05 } = {}) {
  const pieces = [];
  const inset = 0.75;
  const hx = PLOT.w / 2 - inset;
  const z0 = -inset;
  const z1 = -PLOT.d + inset;
  const h = 1.35;
  const sy = PLATE_TOP + 1.08; // string height
  const corners = [
    [-hx, z0],
    [hx, z0],
    [hx, z1],
    [-hx, z1],
  ];
  corners.forEach(([x, z], i) => {
    pieces.push(box([0.16, h, 0.16], [x, PLATE_TOP + h / 2, z], { tone: 'soft', grow: true, order: 0.5 + i * 0.1, stage }));
  });
  const str = (size, pos, order) => ({ kind: 'dark', size, pos, grow: true, order, stage });
  pieces.push(str([2 * hx, line, line], [0, sy, z0], 0.1));
  pieces.push(str([2 * hx, line, line], [0, sy, z1], 0.3));
  pieces.push(str([line, line, z0 - z1], [-hx, sy, (z0 + z1) / 2], 0));
  pieces.push(str([line, line, z0 - z1], [hx, sy, (z0 + z1) / 2], 0.2));
  return pieces;
}

/**
 * Tufts scattered over plot 0, loosely clumped, tallest toward the back.
 * Returns typed arrays (n = count): pos (x, z)·n, size (width, height)·n, yaw n, lean (x, z)·n,
 * order n (0..1: when the tuft sinks; nearest the first slab goes first).
 */
export function buildGrass(count = 600, seed = 5) {
  const R = makeRandom(seed);
  const pos = new Float32Array(count * 2);
  const size = new Float32Array(count * 2);
  const yaw = new Float32Array(count);
  const lean = new Float32Array(count * 2);
  const order = new Float32Array(count);
  const hx = PLOT.w / 2 - 1.1;
  const z0 = -1.1;
  const z1 = -PLOT.d + 1.1;
  const clumps = Array.from({ length: 34 }, () => [R.range(-hx, hx), R.range(z1, z0), R.range(0.9, 2.6)]);
  const far = Math.hypot(PLOT.w / 2, PLOT.d / 2);
  for (let i = 0; i < count; i++) {
    let x;
    let z;
    if (R.rand() < 0.62) {
      const c = R.pick(clumps);
      const a = R.range(0, Math.PI * 2);
      const r = Math.sqrt(R.rand()) * c[2];
      x = Math.min(hx, Math.max(-hx, c[0] + Math.cos(a) * r));
      z = Math.min(z0, Math.max(z1, c[1] + Math.sin(a) * r));
    } else {
      x = R.range(-hx, hx);
      z = R.range(z1, z0);
    }
    pos[i * 2] = x;
    pos[i * 2 + 1] = z;
    const tall = R.rand();
    size[i * 2] = R.range(0.85, 1.35);
    size[i * 2 + 1] = 0.38 + tall * tall * 0.85;
    yaw[i] = R.range(0, Math.PI * 2);
    lean[i * 2] = R.range(-0.16, 0.16);
    lean[i * 2 + 1] = R.range(-0.16, 0.16);
    order[i] = Math.min(1, Math.hypot(x, z - BUILD_Z) / far + R.range(-0.05, 0.05));
    if (order[i] < 0) order[i] = 0;
  }
  return { count, pos, size, yaw, lean, order };
}

/** Two low bushes on plot 0, each a clump of rounded blobs: [x, y, z, radius]. */
export const BUSHES = [
  [-10.6, PLATE_TOP + 0.35, -15.2, 1.0],
  [-9.5, PLATE_TOP + 0.3, -16.1, 0.8],
  [-11.4, PLATE_TOP + 0.25, -16.3, 0.65],
  [9.2, PLATE_TOP + 0.3, -4.6, 0.85],
  [10.3, PLATE_TOP + 0.26, -4.0, 0.7],
  [8.6, PLATE_TOP + 0.2, -3.7, 0.5],
];

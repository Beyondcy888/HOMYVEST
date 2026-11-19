// The padel hall as assembly pieces (docs/06 §4.3). Pure: (params) → Piece[], metres, no three.js.
//
// Everything here was measured on the cleaned renders (.cache/padel-clean). They are true isometric
// views (see src/three/padel/alignment.js), so the ground plane can be rectified exactly and read like
// a plan. Scale: the courts' service lines are 6.95 m from the net and the courts are 20 m long, which
// gives 26.46 px per metre on padel-1 (and 18.99 px/m on padel-2 and padel-3).
//
// What the renders actually show: FOUR courts of 10 × 20 m (three side by side, one turned 90°), each
// with a single net, on a slab of about 41.7 × 37.9 m. The hall is roofed by a faceted vault spanning
// 38.5 m with a glazed strip along the ridge, and its street corner is a 12.6 m brick screen.
//
// Site coordinates used below: p runs along the front-right edge (B → R), q along the front-left edge
// (B → L), y is up from the floor. toWorld() centres the model: x = p − CP, z = CQ − q.
import { box, cyl, sequence } from '../assembly/pieces.js';
import { makeRandom } from '../shared/rng.js';

export const SITE = {
  pxPerMetre: 26.46, // padel-1, along the ground axes
  slab: 0.1, // slab thickness; the floor is y = 0, the slab's underside y = −0.1
  p1: 41.68, // slab extent toward R
  q1: 37.9, // slab extent toward L (the paved strip's tip L is at 37.87)
  step: 0.774, // the main slab's front-right edge sits this far behind the paved strip's edge
  notch: 19.79, // the paved strip (and the brick front) end here along the front-right edge
  paveP: 1.42, // paved strip width on the front-left side
  paveQ: 1.31, // … and on the front-right side
  cut: 1.66, // height at which the ground-floor render is cut
  cut2: 5.85, // height at which the upper-floor render cuts the brick front
  centre: [20.84, 18.95],
};
const [CP, CQ] = SITE.centre;

/** Site (p, y, q) → world [x, y, z]. */
export const toWorld = (p, y, q) => [p - CP, y, CQ - q];

/** The slab's outline at its underside: the anchors measured on all three renders. */
export const ANCHORS = {
  L: toWorld(0, -SITE.slab, 37.87),
  B: toWorld(0, -SITE.slab, 0),
  N: toWorld(SITE.notch, -SITE.slab, 0),
  R: toWorld(SITE.p1, -SITE.slab, SITE.step),
};

// Courts: centre (p, q) and the direction of the long axis.
export const COURTS = [
  { c: [8.725, 26.565], along: 'q' },
  { c: [21.705, 26.565], along: 'q' },
  { c: [34.65, 26.565], along: 'q' },
  { c: [29.7, 7.29], along: 'p' },
];

// Structural grid: the timber frames stand every 6.03 m along p.
export const FRAMES = [1.78, 7.8, 13.83, 19.86, 25.89, 31.92, 37.94];
const EDGE_BACK = 37.6; // q of the back column line
const EDGE_RIGHT = 41.4; // p of the right column line
const EDGE_FRONT = 1.05; // q of the front-right column line
const EDGE_LEFT = 1.78; // p of the left (gable) column line
const COLS_RIGHT = [7.27, 13.33, 19.4, 25.47, 31.53]; // q positions along the right edge
const COLS_LEFT = [19.45, 25.5, 31.55]; // q positions along the left edge (behind the planting)
const COL_TOP = 4.9;

/**
 * The vault: a faceted arch across q, the same section along the whole length (p).
 * Knots are [distance from the centre line, height above the eave], measured on padel-3's end section.
 */
export const ROOF = {
  p0: 1.7,
  p1: 42.63,
  centreQ: 19.3,
  half: 19.25,
  eaveY: 4.8,
  knots: [
    [0, 7.95],
    [3.2, 7.83],
    [6.35, 7.44],
    [10.8, 6.74],
    [15.15, 4.18],
    [19.25, 0],
  ],
  glassHalf: 6.35, // the glazed strip spans the centre ± this
  strip: 1.52, // stage 2 shows only this much of the lowest front facet (the render is cut there)
};

/** Height of the roof's outer surface at q. */
export function roofY(q) {
  const d = Math.min(ROOF.half, Math.abs(q - ROOF.centreQ));
  const k = ROOF.knots;
  for (let i = 1; i < k.length; i++) {
    if (d <= k[i][0]) {
      const t = (d - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      return ROOF.eaveY + k[i - 1][1] + (k[i][1] - k[i - 1][1]) * t;
    }
  }
  return ROOF.eaveY;
}

/** Roof section between two q values as [q, y] points, including every knot in between. */
export function roofSection(qa, qb) {
  const qs = [qa, qb];
  for (const [d] of ROOF.knots) {
    for (const s of d === 0 ? [0] : [-1, 1]) {
      const q = ROOF.centreQ + s * d;
      if (q > qa + 1e-6 && q < qb - 1e-6) qs.push(q);
    }
  }
  return qs.sort((a, b) => a - b).map((q) => [q, roofY(q)]);
}

// ---------- small helpers ----------

/** A box given by its extents in site coordinates. */
const slabBox = (p0, p1, q0, q1, y0, y1, extra) =>
  box([p1 - p0, y1 - y0, q1 - q0], toWorld((p0 + p1) / 2, (y0 + y1) / 2, (q0 + q1) / 2), extra);
const kindBox = (kind, p0, p1, q0, q1, y0, y1, extra) => ({ ...slabBox(p0, p1, q0, q1, y0, y1, extra), kind });
const post = (p, q, y0, y1, w = 0.12, extra) => slabBox(p - w / 2, p + w / 2, q - w / 2, q + w / 2, y0, y1, extra);
const column = (p, q, y0, y1, extra) => ({ ...post(p, q, y0, y1, 0.34), kind: 'dark', ...extra });
const round = (r, p, q, y0, y1, extra) => cyl(r, y1 - y0, toWorld(p, (y0 + y1) / 2, q), extra);

/** Court-local frame: a along the long axis (±10), b across (±5). Returns a box builder in that frame. */
function courtFrame({ c, along }) {
  const map = (a0, a1, b0, b1) =>
    along === 'q' ? [c[0] + b0, c[0] + b1, c[1] + a0, c[1] + a1] : [c[0] + a0, c[0] + a1, c[1] + b0, c[1] + b1];
  const order = (v0, v1) => (v0 < v1 ? [v0, v1] : [v1, v0]);
  return (a0, a1, b0, b1, y0, y1, extra, kind) => {
    const [p0, p1, q0, q1] = map(...order(a0, a1), ...order(b0, b1));
    const piece = slabBox(p0, p1, q0, q1, y0, y1, extra);
    return kind ? { ...piece, kind } : piece;
  };
}

const HALF_L = 10;
const HALF_W = 5;
const GLASS_RUN = 4; // glass on the side walls, from each end
const MESH_RUN = 4.5; // then mesh panels; the last 1.5 m beside the net stays open
const RAIL = 0.1;

/** One court up to the cut height: turf, lines, glass, mesh frames, net. Returns groups in build order. */
function courtStage1(court) {
  const b = courtFrame(court);
  const h = SITE.cut;
  const surface = [b(-HALF_L, HALF_L, -HALF_W, HALF_W, 0, 0.06, { tone: 'deep' })];
  const lines = [
    b(-6.95 - 0.04, -6.95 + 0.04, -HALF_W, HALF_W, 0.06, 0.075, { tone: 'wall' }),
    b(6.95 - 0.04, 6.95 + 0.04, -HALF_W, HALF_W, 0.06, 0.075, { tone: 'wall' }),
    b(-6.95, 6.95, -0.04, 0.04, 0.06, 0.075, { tone: 'wall' }),
  ];
  const glass = [];
  const frames = [];
  for (const sa of [-1, 1]) {
    // end wall: one sheet of glass, posts every 2 m
    glass.push(b(sa * HALF_L - 0.025, sa * HALF_L + 0.025, -HALF_W, HALF_W, 0.06, h, {}, 'glass'));
    for (let i = 0; i <= 5; i++) frames.push(b(sa * HALF_L - 0.06, sa * HALF_L + 0.06, -HALF_W + i * 2 - 0.06, -HALF_W + i * 2 + 0.06, 0.06, h, { tone: 'slab' }));
    for (const sb of [-1, 1]) {
      // side wall: 4 m of glass from the corner …
      glass.push(b(sa * HALF_L, sa * (HALF_L - GLASS_RUN), sb * HALF_W - 0.025, sb * HALF_W + 0.025, 0.06, h, {}, 'glass'));
      for (const d of [2, 4]) frames.push(b(sa * (HALF_L - d) - 0.06, sa * (HALF_L - d) + 0.06, sb * HALF_W - 0.06, sb * HALF_W + 0.06, 0.06, h, { tone: 'slab' }));
    }
  }
  const mesh = [];
  for (const sa of [-1, 1]) {
    for (const sb of [-1, 1]) {
      // … then 4.5 m of mesh panels: posts and rails only
      const a0 = HALF_L - GLASS_RUN;
      const a1 = a0 - MESH_RUN;
      mesh.push(b(sa * a0, sa * a1, sb * HALF_W - RAIL / 2, sb * HALF_W + RAIL / 2, h - RAIL, h, { tone: 'deep' }));
      mesh.push(b(sa * a0, sa * a1, sb * HALF_W - RAIL / 2, sb * HALF_W + RAIL / 2, 0.06, 0.06 + RAIL, { tone: 'deep' }));
      for (const d of [1.5, 3, 4.5]) mesh.push(b(sa * (a0 - d) - 0.06, sa * (a0 - d) + 0.06, sb * HALF_W - 0.06, sb * HALF_W + 0.06, 0.06, h, { tone: 'deep' }));
    }
  }
  const net = [
    b(-0.03, 0.03, -HALF_W, HALF_W, 0.06, 0.94, { tone: 'wall' }),
    b(-0.07, 0.07, -HALF_W - 0.07, -HALF_W + 0.07, 0.06, 1.05, { tone: 'slab' }),
    b(-0.07, 0.07, HALF_W - 0.07, HALF_W + 0.07, 0.06, 1.05, { tone: 'slab' }),
  ];
  return [[...surface, ...lines], [...glass, ...frames], mesh, net];
}

/** The same court from the cut up to its full height: glass to 3 m, mesh to 4 m at the ends, lights. */
function courtStage2(court) {
  const b = courtFrame(court);
  const h0 = SITE.cut;
  const walls = [];
  for (const sa of [-1, 1]) {
    walls.push(b(sa * HALF_L - 0.025, sa * HALF_L + 0.025, -HALF_W, HALF_W, h0, 3, {}, 'glass'));
    walls.push(b(sa * HALF_L - RAIL / 2, sa * HALF_L + RAIL / 2, -HALF_W, HALF_W, 3 - RAIL / 2, 3 + RAIL / 2, { tone: 'slab' }));
    walls.push(b(sa * HALF_L - RAIL / 2, sa * HALF_L + RAIL / 2, -HALF_W, HALF_W, 4 - RAIL, 4, { tone: 'deep' }));
    for (let i = 0; i <= 5; i++) walls.push(b(sa * HALF_L - 0.06, sa * HALF_L + 0.06, -HALF_W + i * 2 - 0.06, -HALF_W + i * 2 + 0.06, h0, i === 0 || i === 5 ? 4 : 3, { tone: 'slab' }));
    for (const sb of [-1, 1]) {
      walls.push(b(sa * HALF_L, sa * (HALF_L - GLASS_RUN), sb * HALF_W - 0.025, sb * HALF_W + 0.025, h0, 3, {}, 'glass'));
      walls.push(b(sa * HALF_L, sa * (HALF_L - GLASS_RUN), sb * HALF_W - RAIL / 2, sb * HALF_W + RAIL / 2, 3 - RAIL / 2, 3 + RAIL / 2, { tone: 'slab' }));
      // the 4 m crown returns 2 m along each side
      walls.push(b(sa * HALF_L, sa * (HALF_L - 2), sb * HALF_W - RAIL / 2, sb * HALF_W + RAIL / 2, 4 - RAIL, 4, { tone: 'deep' }));
      walls.push(b(sa * (HALF_L - 2) - 0.06, sa * (HALF_L - 2) + 0.06, sb * HALF_W - 0.06, sb * HALF_W + 0.06, h0, 4, { tone: 'slab' }));
      walls.push(b(sa * (HALF_L - 4) - 0.06, sa * (HALF_L - 4) + 0.06, sb * HALF_W - 0.06, sb * HALF_W + 0.06, h0, 3, { tone: 'slab' }));
      // mesh panels up to 3 m
      const a0 = HALF_L - GLASS_RUN;
      walls.push(b(sa * a0, sa * (a0 - MESH_RUN), sb * HALF_W - RAIL / 2, sb * HALF_W + RAIL / 2, 3 - RAIL, 3, { tone: 'deep' }));
      for (const d of [1.5, 3, 4.5]) walls.push(b(sa * (a0 - d) - 0.06, sa * (a0 - d) + 0.06, sb * HALF_W - 0.06, sb * HALF_W + 0.06, h0, 3, { tone: 'deep' }));
    }
  }
  const lights = [];
  for (const sa of [-1, 1]) {
    for (const sb of [-1, 1]) {
      const centre = b(sa * 5 - 0.07, sa * 5 + 0.07, sb * (HALF_W + 0.45) - 0.07, sb * (HALF_W + 0.45) + 0.07, 0, 6, { tone: 'slab' });
      lights.push({ ...cyl(0.07, 6, centre.pos, { tone: 'slab' }) });
      lights.push(b(sa * 5 - 0.32, sa * 5 + 0.32, sb * (HALF_W + 0.05), sb * (HALF_W + 0.6), 5.9, 6.12, { tone: 'deep' }));
    }
  }
  return [walls, lights];
}

// ---------- the site (always present) ----------

/** The slab: the paved strip on the two street sides and the hall floor. One "stage" that never moves. */
export function buildSite({ stage = 3 } = {}) {
  const s = SITE;
  return [
    slabBox(0, s.paveP, 0, 37.87, -s.slab, 0, { tone: 'soft' }),
    slabBox(s.paveP, s.notch, 0, s.paveQ, -s.slab, 0, { tone: 'soft' }),
    slabBox(s.paveP, s.p1, s.paveQ, s.q1, -s.slab, 0.005, { tone: 'slab' }),
    slabBox(s.notch, s.p1, s.step, s.paveQ, -s.slab, 0.005, { tone: 'slab' }),
  ].map((p) => ({ ...p, order: 0, stage }));
}

// ---------- stage 1: the ground floor, cut at 1.66 m ----------

const BAYS_LEFT = [1.66, 4.6, 7.5, 10.4, 13.3, 16.0]; // pilasters along the entrance front (q)
const PIERS_RIGHT = [1.8, 7.84, 13.88, 19.4]; // main piers along the street front (p), on the structural grid
const FINS_RIGHT = [4.82, 10.86, 16.64]; // brick fins between them

function brickFront(y0, y1, { sign = false } = {}) {
  const out = [];
  const s = SITE;
  // street front (along p)
  for (const p of PIERS_RIGHT) out.push(slabBox(p - 0.42, p + 0.42, s.paveQ - 0.08, s.paveQ + 0.62, y0, y1, { tone: 'wall' }));
  for (const p of FINS_RIGHT) out.push(slabBox(p - 0.24, p + 0.24, s.paveQ - 0.03, s.paveQ + 0.5, y0, y1 - (y1 > 10 ? 0.25 : 0), { tone: 'wall' }));
  for (let i = 0; i < PIERS_RIGHT.length - 1; i++) {
    out.push(slabBox(PIERS_RIGHT[i] + 0.42, PIERS_RIGHT[i + 1] - 0.42, s.paveQ + 0.1, s.paveQ + 0.45, y0, y1 - (y1 > 10 ? 0.15 : 0), { tone: 'base' }));
  }
  // entrance front (along q)
  for (const q of BAYS_LEFT) {
    if (q === BAYS_LEFT[0]) continue; // the corner pier is PIERS_RIGHT[0]
    out.push(slabBox(s.paveP - 0.06, s.paveP + 0.6, q - 0.36, q + 0.36, y0, y1, { tone: 'wall' }));
  }
  if (sign) out.push(kindBox('dark', s.paveP - 0.2, s.paveP - 0.06, 13.75, 15.6, 4.35, 5.25));
  return out;
}

function cafe() {
  const h = SITE.cut;
  const wall = (p0, p1, q0, q1, extra) => slabBox(p0, p1, q0, q1, 0, h, { tone: 'wall', ...extra });
  const walls = [
    // toilets
    wall(3.9, 10.6, 7.5, 7.65),
    wall(3.9, 4.05, 2.0, 7.5),
    wall(10.45, 10.6, 2.0, 7.5),
    wall(4.05, 10.45, 4.78, 4.92),
    wall(7.35, 7.5, 2.0, 4.78),
    wall(7.95, 8.1, 4.92, 7.5),
    wall(5.5, 5.6, 2.0, 3.5, { tone: 'soft' }),
    wall(5.9, 6.0, 6.1, 7.5, { tone: 'soft' }),
    // service rooms
    wall(12.9, 17.2, 7.5, 7.65),
    wall(17.2, 17.5, 2.0, 15.8),
    wall(14.3, 17.2, 4.6, 4.74),
    wall(14.3, 14.44, 2.0, 4.6),
    // café: back wall and the wall that turns the lobby
    wall(5.4, 9.3, 15.5, 15.8),
    wall(11.2, 17.2, 15.5, 15.8),
    wall(3.25, 3.55, 11.4, 15.6),
    wall(5.3, 9.4, 9.2, 9.5),
    { ...slabBox(3.25, 3.55, 9.9, 11.5, 0, h, { tone: 'wall' }), pos: toWorld(3.72, h / 2, 10.72), rotY: -0.5 },
    { ...slabBox(3.25, 3.55, 9.2, 10.5, 0, h, { tone: 'wall' }), pos: toWorld(4.62, h / 2, 9.72), rotY: -1.1 },
  ];
  // louvred screen between the toilets and the service rooms
  for (let i = 0; i < 8; i++) walls.push(slabBox(11.5, 12.3, 2.3 + i * 0.7, 2.36 + i * 0.7, 0, h, { tone: 'soft' }));
  const fit = [
    // bar
    slabBox(8.3, 11.3, 10.2, 10.65, 0, 1.1, { tone: 'soft' }),
    slabBox(8.3, 8.75, 10.65, 12.3, 0, 1.1, { tone: 'soft' }),
    slabBox(10.85, 11.3, 10.65, 12.3, 0, 1.1, { tone: 'soft' }),
    slabBox(13.2, 16.8, 6.5, 7.1, 0, 0.9, { tone: 'soft' }),
  ];
  // the stair to the upper floor, cut at the same height as everything else
  for (let i = 0; i < 10; i++) fit.push(slabBox(11.75, 13.1, 13.3 - (i + 1) * 0.44, 13.3 - i * 0.44, 0, (h / 10) * (i + 1), { tone: 'base' }));
  for (const [p, q] of [[14.45, 10.9], [16.2, 10.9], [14.45, 13.6], [16.2, 13.6]]) {
    fit.push(round(0.5, p, q, 0.7, 0.76, { tone: 'wall' }), round(0.07, p, q, 0, 0.7, { tone: 'slab' }));
    for (const [dp, dq] of [[0.72, 0], [-0.72, 0], [0, 0.72], [0, -0.72]]) fit.push(slabBox(p + dp - 0.2, p + dp + 0.2, q + dq - 0.2, q + dq + 0.2, 0, 0.46, { tone: 'soft' }));
  }
  for (const [p, q] of [[5.0, 12.2], [6.0, 13.7], [6.9, 12.1], [5.5, 14.6], [7.5, 14.1]]) fit.push(round(0.42, p, q, 0, 0.4, { tone: 'soft' }));
  for (const q of [4.0, 6.4, 8.8, 11.2]) fit.push(round(0.42, 18.35, q, 0, 1.0, { tone: 'soft' }));
  // low planters in the entrance bays
  for (let i = 0; i < 4; i++) fit.push(slabBox(SITE.paveP + 0.05, SITE.paveP + 0.5, BAYS_LEFT[i] + 0.75, BAYS_LEFT[i + 1] - 0.75, 0, 0.85, { tone: 'soft' }));
  return [walls, fit];
}

function person(p, q) {
  return [round(0.2, p, q, 0, 1.2, { grow: true, tone: 'wall' }), round(0.15, p, q, 1.24, 1.56, { grow: true, tone: 'wall' })];
}

export function buildStage1({ stage = 0, seed = 21 } = {}) {
  const R = makeRandom(seed);
  const s = SITE;
  const h = s.cut;

  const perimeter = [
    // planting beds
    slabBox(s.paveP + 0.1, 3.55, 16.4, s.q1 - 0.2, 0, 0.28, { tone: 'soft' }),
    slabBox(40.8, s.p1 - 0.1, s.step + 0.2, s.q1 - 0.2, 0, 0.28, { tone: 'soft' }),
    // planters between the three courts and the fourth
    slabBox(21.3, 26.0, 13.25, 14.35, 0, 0.5, { tone: 'soft' }),
    slabBox(30.9, 34.5, 13.25, 14.35, 0, 0.5, { tone: 'soft' }),
    slabBox(35.2, 38.8, 13.25, 14.35, 0, 0.5, { tone: 'soft' }),
    // benches in the walks between the courts
    slabBox(15.0, 15.45, 21.0, 26.0, 0, 0.45, { tone: 'soft' }),
    slabBox(15.0, 15.45, 30.0, 34.8, 0, 0.45, { tone: 'soft' }),
    slabBox(27.95, 28.4, 21.0, 26.0, 0, 0.45, { tone: 'soft' }),
    slabBox(27.95, 28.4, 30.0, 34.8, 0, 0.45, { tone: 'soft' }),
  ];
  // the timber columns, cut at the same height as the walls
  for (const p of FRAMES) perimeter.push(column(p, EDGE_BACK, 0, h));
  perimeter.push(column(EDGE_RIGHT, EDGE_BACK, 0, h), column(EDGE_RIGHT, EDGE_FRONT + 0.1, 0, h));
  for (const q of COLS_RIGHT) perimeter.push(column(EDGE_RIGHT, q, 0, h));
  for (const p of FRAMES.slice(4)) perimeter.push(column(p, EDGE_FRONT, 0, h));
  for (const q of COLS_LEFT) perimeter.push(column(EDGE_LEFT, q, 0, h));

  const planting = [];
  for (let q = 17.2; q < s.q1 - 0.6; q += 1.3) planting.push(round(R.range(0.5, 0.68), R.range(2.3, 2.75), q + R.range(-0.2, 0.2), 0.2, R.range(1.2, 1.7), { grow: true, tone: 'soft' }));
  for (let q = 1.9; q < s.q1 - 0.6; q += 1.45) planting.push(round(R.range(0.34, 0.42), 41.18, q + R.range(-0.2, 0.2), 0.2, R.range(1.0, 1.5), { grow: true, tone: 'soft' }));
  for (const [p0, p1] of [[21.3, 26.0], [30.9, 34.5], [35.2, 38.8]]) {
    for (let p = p0 + 0.6; p < p1 - 0.3; p += 1.15) planting.push(round(0.36, p, 13.8, 0.45, R.range(0.95, 1.2), { grow: true, tone: 'soft' }));
  }

  const front = brickFront(0, h);
  const [cafeWalls, cafeFit] = cafe();
  const courts = COURTS.flatMap(courtStage1);
  const people = [
    [0.7, 24.3], [0.62, 9.3], [0.8, 8.4], [6.3, 0.6], [2.75, 12.3], [9.6, 13.2], [15.35, 12.25],
    [20.2, 21.6], [23.3, 23.4], [20.4, 31.4], [23.1, 30.2],
  ].flatMap(([p, q]) => person(p, q));

  const groups = [perimeter, planting, ...courts, front, cafeWalls, cafeFit, people];
  const weights = [3, 2, ...COURTS.flatMap(() => [1.2, 2.2, 1.6, 0.8]), 2.2, 2.6, 2.4, 1.2];
  return sequence(groups, { seed, stage, weights, overlap: 0.4 });
}

// ---------- stage 2: the upper floor and the structure ----------

export function buildStage2({ stage = 1, seed = 22 } = {}) {
  const s = SITE;
  const h = s.cut;
  const top = COL_TOP;

  const columns = [];
  const rise = (p, q) => columns.push({ ...column(p, q, h, top), grow: true });
  for (const p of FRAMES) rise(p, EDGE_BACK);
  rise(EDGE_RIGHT, EDGE_BACK);
  rise(EDGE_RIGHT, EDGE_FRONT + 0.1);
  for (const q of COLS_RIGHT) rise(EDGE_RIGHT, q);
  for (const p of FRAMES.slice(4)) rise(p, EDGE_FRONT);
  for (const q of COLS_LEFT) rise(EDGE_LEFT, q);

  // beams on the column heads, and the translucent band below them on the two far sides
  const beams = [];
  const band = [];
  const backLine = [...FRAMES, EDGE_RIGHT];
  for (let i = 0; i < backLine.length - 1; i++) {
    beams.push(kindBox('dark', backLine[i], backLine[i + 1], EDGE_BACK - 0.15, EDGE_BACK + 0.15, top, top + 0.32));
    band.push(kindBox('glass', backLine[i] + 0.17, backLine[i + 1] - 0.17, EDGE_BACK - 0.03, EDGE_BACK + 0.03, 2.9, top));
    band.push(slabBox(backLine[i] + 0.17, backLine[i + 1] - 0.17, EDGE_BACK - 0.06, EDGE_BACK + 0.06, 2.84, 2.96, { tone: 'slab' }));
  }
  const rightLine = [EDGE_FRONT + 0.1, ...COLS_RIGHT, EDGE_BACK];
  for (let i = 0; i < rightLine.length - 1; i++) {
    beams.push(kindBox('dark', EDGE_RIGHT - 0.15, EDGE_RIGHT + 0.15, rightLine[i], rightLine[i + 1], top, top + 0.32));
    band.push(kindBox('glass', EDGE_RIGHT - 0.03, EDGE_RIGHT + 0.03, rightLine[i] + 0.17, rightLine[i + 1] - 0.17, 2.9, top));
    band.push(slabBox(EDGE_RIGHT - 0.06, EDGE_RIGHT + 0.06, rightLine[i] + 0.17, rightLine[i + 1] - 0.17, 2.84, 2.96, { tone: 'slab' }));
  }
  const frontLine = [s.notch, ...FRAMES.slice(4), EDGE_RIGHT];
  for (let i = 0; i < frontLine.length - 1; i++) beams.push(kindBox('dark', frontLine[i], frontLine[i + 1], EDGE_FRONT - 0.15, EDGE_FRONT + 0.15, top, top + 0.32));
  const leftLine = [16.4, ...COLS_LEFT, EDGE_BACK];
  for (let i = 0; i < leftLine.length - 1; i++) {
    beams.push(kindBox('dark', EDGE_LEFT - 0.15, EDGE_LEFT + 0.15, leftLine[i], leftLine[i + 1], top, top + 0.32));
    band.push(kindBox('glass', EDGE_LEFT - 0.03, EDGE_LEFT + 0.03, leftLine[i] + 0.17, leftLine[i + 1] - 0.17, 1.0, top));
    band.push(slabBox(EDGE_LEFT - 0.06, EDGE_LEFT + 0.06, leftLine[i] + 0.17, leftLine[i + 1] - 0.17, 2.84, 2.96, { tone: 'slab' }));
  }

  const courts = COURTS.map(courtStage2);
  const walls = courts.flatMap(([w]) => w);
  const lights = courts.flatMap(([, l]) => l);

  const front = brickFront(h, s.cut2);
  // arch heads over the entrance bays
  for (let i = 0; i < BAYS_LEFT.length - 1; i++) front.push(slabBox(s.paveP + 0.08, s.paveP + 0.45, BAYS_LEFT[i] + 0.36, BAYS_LEFT[i + 1] - 0.36, 3.5, s.cut2 - 0.12, { tone: 'base' }));

  // the upper floor: a slab with the stair opening left out
  const f0 = 3.12;
  const f1 = 3.4;
  const floor = [
    slabBox(1.95, 10.6, 1.85, 15.55, f0, f1, { tone: 'slab' }),
    slabBox(13.3, 17.85, 1.85, 15.55, f0, f1, { tone: 'slab' }),
    slabBox(10.6, 13.3, 1.85, 8.4, f0, f1, { tone: 'slab' }),
    slabBox(10.6, 13.3, 13.4, 15.55, f0, f1, { tone: 'slab' }),
  ];
  const fit = [
    // rail around the stair opening
    slabBox(10.5, 10.58, 8.4, 13.4, f1, f1 + 1, { tone: 'deep' }),
    slabBox(10.5, 13.4, 8.32, 8.4, f1, f1 + 1, { tone: 'deep' }),
    slabBox(13.32, 13.4, 8.4, 11.6, f1, f1 + 1, { tone: 'deep' }),
    // glass balustrade toward the courts
    kindBox('glass', 1.95, 17.85, 15.5, 15.55, f1, f1 + 1.1),
    kindBox('glass', 17.8, 17.85, 1.85, 15.5, f1, f1 + 1.1),
    slabBox(1.95, 17.85, 15.48, 15.57, f1 + 1.06, f1 + 1.14, { tone: 'slab' }),
    slabBox(17.78, 17.87, 1.85, 15.5, f1 + 1.06, f1 + 1.14, { tone: 'slab' }),
  ];
  // the stair continues up through the opening
  fit.push(slabBox(10.7, 13.1, 8.45, 8.9, h - 0.14, h, { tone: 'base' })); // landing
  for (let i = 0; i < 10; i++) {
    const y = h + ((i + 1) * (f1 - h)) / 10;
    fit.push(slabBox(10.7, 11.65, 8.9 + i * 0.44, 8.9 + (i + 1) * 0.44, y - 0.14, y, { tone: 'base' }));
  }
  for (const [p, q] of [[15.1, 10.9], [15.05, 5.8], [11.5, 5.8], [8.2, 5.9], [4.6, 6.0], [4.6, 11.0]]) {
    fit.push(round(0.5, p, q, f1 + 0.7, f1 + 0.76, { tone: 'wall' }), round(0.07, p, q, f1, f1 + 0.7, { tone: 'slab' }));
    for (const [dp, dq] of [[0.72, 0], [-0.72, 0], [0, 0.72], [0, -0.72]]) fit.push(slabBox(p + dp - 0.2, p + dp + 0.2, q + dq - 0.2, q + dq + 0.2, f1, f1 + 0.46, { tone: 'soft' }));
  }
  for (const [p, q] of [[6.6, 9.0], [7.7, 13.3], [9.4, 3.9], [13.1, 3.8], [14.7, 8.3], [15.9, 13.5], [6.1, 13.9], [8.9, 8.3]]) fit.push(round(0.42, p, q, f1, f1 + 0.42, { tone: 'soft' }));

  const trees = [];
  for (const [p, q] of [[28.2, 35.9], [15.2, 35.4], [28.2, 23.2], [15.2, 23.2], [28.2, 17.5], [20.4, 15.0], [15.2, 17.4], [40.2, 16.2]]) {
    trees.push(round(0.11, p, q, 0, 3.0, { grow: true, tone: 'slab' }));
    trees.push(round(1.05, p, q, 2.7, 4.3, { grow: true, tone: 'soft' }));
    trees.push(round(0.7, p, q, 4.2, 5.3, { grow: true, tone: 'soft' }));
  }

  const groups = [columns, [...beams, ...band], walls, lights, front, floor, fit.filter(Boolean), trees];
  const weights = [1.4, 2.4, 3.4, 1.2, 2, 1.2, 2.2, 1.2];
  return sequence(groups, { seed, stage, weights, overlap: 0.45 });
}

// ---------- stage 3: the vault's small parts and the full brick front ----------
// The shells, the glazed strip and the frames are their own geometry (see PadelScene: they come down as
// rigid bodies). These pieces follow them, so their order starts late in the stage.

export function buildStage3({ stage = 2, seed = 23, from = 0.52 } = {}) {
  const s = SITE;
  const R0 = ROOF;
  const purlins = [];
  for (const d of [-5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4]) {
    const q = R0.centreQ + d;
    purlins.push({ ...kindBox('dark', R0.p0 + 0.2, R0.p1 - 0.2, q - 0.07, q + 0.07, roofY(q) - 0.26, roofY(q) - 0.1), drop: true });
  }
  // gutters where the glazing meets the shells
  for (const sgn of [-1, 1]) {
    const q = R0.centreQ + sgn * R0.glassHalf;
    purlins.push({ ...slabBox(R0.p0, R0.p1, q - 0.16, q + 0.16, roofY(q) - 0.05, roofY(q) + 0.1, { tone: 'slab' }), drop: true });
  }
  // the glazed gable's mullions and transom
  const gable = [];
  for (const q of [22.5, 28.5, 34.5]) gable.push(slabBox(EDGE_LEFT - 0.07, EDGE_LEFT + 0.07, q - 0.07, q + 0.07, COL_TOP + 0.32, roofY(q) - 0.45, { tone: 'slab' }));
  gable.push(slabBox(EDGE_LEFT - 0.06, EDGE_LEFT + 0.06, 16.4, 34.5, 8.0, 8.12, { tone: 'slab' }));

  const front = brickFront(s.cut2, 12.6, { sign: true });
  for (let i = 0; i < BAYS_LEFT.length - 1; i++) front.push(slabBox(s.paveP + 0.08, s.paveP + 0.45, BAYS_LEFT[i] + 0.36, BAYS_LEFT[i + 1] - 0.36, s.cut2 - 0.12, 12.45, { tone: 'base' }));

  const groups = [purlins, gable, front];
  return sequence(groups, { seed, stage, weights: [1.2, 0.6, 2.4], overlap: 0.3 }).map((p) => ({ ...p, order: from + (1 - from) * p.order }));
}

/** Every piece of the scene: the site (stage 3, always complete) and the three stages (0, 1, 2). */
export function buildPadel() {
  return [...buildSite({ stage: 3 }), ...buildStage1({ stage: 0 }), ...buildStage2({ stage: 1 }), ...buildStage3({ stage: 2 })];
}

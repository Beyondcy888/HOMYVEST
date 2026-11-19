// The walk: one camera path, one progress → camera mapping. Pure maths, no three.js, so the mini-map,
// the render cards, the 3D camera and the collision test all read the same numbers (docs/06 §3.7).
//
// Conventions
//   position: metres, x east, y up, z south (plan.js)
//   yaw:      radians, 0 = looking north (−z), +90° = east, 180° = south  (a compass heading)
//   pitch:    radians, + = up, −90° = straight down (then north is up on screen, like the plan)
import { PLAN } from './plan.js';

const D2R = Math.PI / 180;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const span = (p, a, b) => clamp01((p - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/* ------------------------------------------------------------------ keys */
// Camera positions with the point they look at. `stop` marks a dwell. Eye height 1.6 m above the local floor
// (the street is 0.45 m below the building floor, so the first keys are lower).
export const KEYS = [
  { pos: [23.05, 1.17, 20.4], look: [22.75, 2.3, 9.0], stop: 0 }, // on the street
  { pos: [23.02, 1.2, 16.5], look: [22.7, 2.1, 8.0] }, // foot of the steps
  { pos: [23.0, 1.6, 14.3], look: [22.6, 1.9, 7.5] }, // top of the steps
  { pos: [23.0, 1.6, 12.3], look: [22.3, 1.8, 7.3] }, // walkway between the core and the planter beds
  { pos: [23.4, 1.6, 10.2], look: [20.8, 1.7, 6.0] },
  { pos: [23.35, 1.6, 8.5], look: [19.6, 1.65, 4.8] }, // swinging in toward the doors
  { pos: [22.4, 1.6, 7.38], look: [18.4, 1.55, 3.8] }, // through the entrance
  { pos: [21.5, 1.56, 7.7], look: [17.9, 1.45, 3.8], stop: 1 }, // S1 the welcome (render 1)
  { pos: [19.0, 1.5, 7.05], look: [9.0, 1.32, 7.0], stop: 2 }, // S2 the dining hall (render 2)
  { pos: [17.3, 1.52, 6.15], look: [9.0, 1.35, 5.4] }, // north lane, past the planters
  { pos: [15.8, 1.55, 5.42], look: [8.0, 1.4, 5.2] }, // north of the marble column
  { pos: [13.7, 1.55, 5.45], look: [7.2, 1.4, 5.0] },
  { pos: [12.55, 1.55, 5.85], look: [7.0, 1.4, 4.7] }, // stepping back into the aisle between the round tables
  { pos: [11.95, 1.52, 6.9], look: [7.6, 1.4, 4.4] },
  { pos: [11.92, 1.5, 8.25], look: [8.2, 1.3, 4.55], stop: 3 }, // S3a buffet and bar (render 5)
  { pos: [9.6, 1.5, 8.25], look: [9.3, 1.4, 4.0] }, // tracking west along the aisle
  { pos: [8.0, 1.5, 8.18], look: [12.0, 1.4, 3.6] },
  { pos: [7.2, 1.5, 7.6], look: [14.5, 1.38, 5.2], stop: 3.5 }, // S3b looking back east (render 3)
  { pos: [7.0, 1.45, 7.0], look: [8.55, 5.5, 3.95], stop: 4 }, // S4 look up into the void (render 7)
  { pos: [7.35, 1.5, 7.95], look: [12.5, 2.2, 6.8] },
  { pos: [8.4, 1.55, 8.25], look: [14.5, 1.6, 8.6] },
  { pos: [10.3, 1.6, 8.27], look: [14.0, 1.6, 11.0] },
  { pos: [11.92, 1.6, 8.3], look: [11.92, 1.72, 14.5], stop: 5 }, // S5 by the windows (render 6, from inside)
];

/**
 * Timeline. Dwell windows keep the camera almost still (a slow drift); between them it walks.
 * The windows are the ones in docs/06 §3.7, with S2 moved 2% earlier so the two long walks have room.
 */
export const DWELLS = [
  { stop: 0, a: 0.0, b: 0.03 },
  { stop: 1, a: 0.16, b: 0.24 },
  { stop: 2, a: 0.31, b: 0.39 },
  { stop: 3, a: 0.47, b: 0.512 },
  { stop: 3.5, a: 0.548, b: 0.58 },
  { stop: 4, a: 0.63, b: 0.71 },
  { stop: 5, a: 0.77, b: 0.84 },
];
export const RISE = { a: 0.84, b: 0.935 }; // lift through the ceiling to the top view
export const PLAN_FADE = { a: 0.925, b: 0.972 }; // model → floor plan
export const UPPER_FADE = { y0: 1.85, y1: 2.85 }; // ceiling and upper floor fade while the eye passes these heights

/** Stops as the visitor knows them (index into homyeight.walk.stops). `at` is where a "go to" lands. */
export const STOPS = [
  { index: 0, a: 0.0, b: 0.1, at: 0.0 },
  { index: 1, a: 0.16, b: 0.24, at: 0.2 },
  { index: 2, a: 0.31, b: 0.39, at: 0.35 },
  { index: 3, a: 0.47, b: 0.58, at: 0.495 },
  { index: 4, a: 0.63, b: 0.71, at: 0.67 },
  { index: 5, a: 0.77, b: 0.84, at: 0.805 },
  { index: 6, a: 0.9, b: 1.0, at: 0.985 },
];

/** Render cards: which render shows at which stop, on which side (desktop), and when. */
export const CARDS = [
  { stop: 1, ids: ['maxone/1'], side: 'right', a: 0.16, b: 0.24 },
  { stop: 2, ids: ['maxone/2'], side: 'left', a: 0.31, b: 0.39 },
  { stop: 3, ids: ['maxone/5', 'maxone/3'], side: 'right', a: 0.47, b: 0.58, swap: [0.519, 0.541] },
  { stop: 4, ids: ['maxone/7'], side: 'left', a: 0.63, b: 0.71 },
  { stop: 5, ids: ['maxone/6'], side: 'right', a: 0.77, b: 0.84 },
  { stop: 6, ids: ['maxone/4'], side: 'left', a: 0.9, b: 1.01 },
];
const CARD_IN = 0.022; // progress taken by the reveal (≈ 15 vh of scroll)
const CARD_OUT = 0.018;

/** 0..1 presence of a card at progress p (reveal on the way in, leave on the way out). */
export function cardPresence(card, p) {
  const enter = span(p, card.a - 0.004, card.a - 0.004 + CARD_IN);
  const leave = 1 - span(p, card.b - CARD_OUT + 0.004, card.b + 0.004);
  return Math.min(enter, leave);
}
/** State of every card: { presence 0..1, mix 0..1 (second image of a two-render card), entering } */
export function cardStates(p) {
  return CARDS.map((card) => {
    const presence = cardPresence(card, p);
    const mix = card.swap ? smooth(span(p, card.swap[0], card.swap[1])) : 0;
    return { presence, mix, entering: p < (card.a + card.b) / 2 };
  });
}
/** −1 (subject sits left, card on the right) … +1, eased: where the 3D picture should slide to stay clear of the card. */
export function cardShift(p) {
  let v = 0;
  for (const card of CARDS) {
    const k = smooth(cardPresence(card, p));
    if (k > 0) v += (card.side === 'right' ? -1 : 1) * k;
  }
  return Math.max(-1, Math.min(1, v));
}

/* --------------------------------------------------- centripetal Catmull-Rom */

const SUB = 28; // samples per segment for the arc-length table

function crPoint(p0, p1, p2, p3, t, out) {
  // Centripetal parameterisation (alpha = 0.5), Barry–Goldman form.
  const d01 = Math.sqrt(Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2])) || 1e-4;
  const d12 = Math.sqrt(Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2])) || 1e-4;
  const d23 = Math.sqrt(Math.hypot(p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2])) || 1e-4;
  const t0 = 0;
  const t1 = t0 + d01;
  const t2 = t1 + d12;
  const t3 = t2 + d23;
  const u = t1 + (t2 - t1) * t;
  for (let i = 0; i < 3; i++) {
    const a1 = ((t1 - u) / (t1 - t0)) * p0[i] + ((u - t0) / (t1 - t0)) * p1[i];
    const a2 = ((t2 - u) / (t2 - t1)) * p1[i] + ((u - t1) / (t2 - t1)) * p2[i];
    const a3 = ((t3 - u) / (t3 - t2)) * p2[i] + ((u - t2) / (t3 - t2)) * p3[i];
    const b1 = ((t2 - u) / (t2 - t0)) * a1 + ((u - t0) / (t2 - t0)) * a2;
    const b2 = ((t3 - u) / (t3 - t1)) * a2 + ((u - t1) / (t3 - t1)) * a3;
    out[i] = ((t2 - u) / (t2 - t1)) * b1 + ((u - t1) / (t2 - t1)) * b2;
  }
  return out;
}

function buildPath(keys) {
  const pts = keys.map((k) => k.pos);
  const n = pts.length;
  const mirror = (a, b) => [2 * a[0] - b[0], 2 * a[1] - b[1], 2 * a[2] - b[2]];
  const ext = [mirror(pts[0], pts[1]), ...pts, mirror(pts[n - 1], pts[n - 2])];
  const samples = []; // flat [x, y, z, s] per sample
  const keyS = [0];
  let s = 0;
  const prev = [...pts[0]];
  const cur = [0, 0, 0];
  samples.push(prev[0], prev[1], prev[2], 0);
  for (let i = 0; i < n - 1; i++) {
    for (let j = 1; j <= SUB; j++) {
      crPoint(ext[i], ext[i + 1], ext[i + 2], ext[i + 3], j / SUB, cur);
      s += Math.hypot(cur[0] - prev[0], cur[1] - prev[1], cur[2] - prev[2]);
      samples.push(cur[0], cur[1], cur[2], s);
      prev[0] = cur[0];
      prev[1] = cur[1];
      prev[2] = cur[2];
    }
    keyS.push(s);
  }
  return { samples, keyS, length: s, count: samples.length / 4 };
}

const PATH = buildPath(KEYS);
export const PATH_LENGTH = PATH.length;

/** Position at arc length s (metres from the start), written into out [x, y, z]. Even speed along the path. */
export function positionAt(s, out = [0, 0, 0]) {
  const { samples, count, length } = PATH;
  const v = s <= 0 ? 0 : s >= length ? length : s;
  let lo = 0;
  let hi = count - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid * 4 + 3] <= v) lo = mid;
    else hi = mid;
  }
  const s0 = samples[lo * 4 + 3];
  const s1 = samples[hi * 4 + 3];
  const t = s1 > s0 ? (v - s0) / (s1 - s0) : 0;
  out[0] = lerp(samples[lo * 4], samples[hi * 4], t);
  out[1] = lerp(samples[lo * 4 + 1], samples[hi * 4 + 1], t);
  out[2] = lerp(samples[lo * 4 + 2], samples[hi * 4 + 2], t);
  return out;
}

/* ------------------------------------------------------- heading along the path */

// Each key's yaw and pitch from its look target, yaw unwrapped so the camera always takes the short way round.
const ANGLES = (() => {
  const yaw = [];
  const pitch = [];
  KEYS.forEach((k, i) => {
    const dx = k.look[0] - k.pos[0];
    const dy = k.look[1] - k.pos[1];
    const dz = k.look[2] - k.pos[2];
    let y = Math.atan2(dx, -dz);
    if (i > 0) {
      const prev = yaw[i - 1];
      while (y - prev > Math.PI) y -= 2 * Math.PI;
      while (y - prev < -Math.PI) y += 2 * Math.PI;
    }
    yaw.push(y);
    pitch.push(Math.atan2(dy, Math.hypot(dx, dz)));
  });
  return { yaw, pitch };
})();

// How far the camera drifts along the path while it dwells at a stop (before / after the key), in metres.
const DRIFT = 0.16;
const keyIndexOfStop = (stop) => KEYS.findIndex((k) => k.stop === stop);
const DWELL_S = DWELLS.map((d) => {
  const i = keyIndexOfStop(d.stop);
  const s = PATH.keyS[i];
  const before = i > 0 ? Math.min(DRIFT, (s - PATH.keyS[i - 1]) * 0.1) : 0;
  const after = i < KEYS.length - 1 ? Math.min(DRIFT, (PATH.keyS[i + 1] - s) * 0.1) : 0.05;
  return { ...d, key: i, s0: s - before, s1: Math.min(PATH.length, s + after) };
});

// Knots for the angle curves: every key, with each stop widened into a flat zone so the view holds still while dwelling.
const KNOTS = (() => {
  const s = [];
  const yaw = [];
  const pitch = [];
  KEYS.forEach((k, i) => {
    const d = DWELL_S.find((w) => w.key === i);
    if (d && d.s1 - d.s0 > 1e-4) {
      s.push(d.s0, d.s1);
      yaw.push(ANGLES.yaw[i], ANGLES.yaw[i]);
      pitch.push(ANGLES.pitch[i], ANGLES.pitch[i]);
    } else {
      s.push(PATH.keyS[i]);
      yaw.push(ANGLES.yaw[i]);
      pitch.push(ANGLES.pitch[i]);
    }
  });
  return { s, yaw, pitch };
})();

/** Monotone cubic (Fritsch–Carlson) through (xs, ys): smooth, and it never overshoots a key. */
function monotone(xs, ys) {
  const n = xs.length;
  const d = new Array(n - 1);
  const m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const h = Math.hypot(a, b);
      if (h > 3) {
        m[i] = (3 * a * d[i]) / h;
        m[i + 1] = (3 * b * d[i]) / h;
      }
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] <= x) lo = mid;
      else hi = mid;
    }
    const h = xs[hi] - xs[lo];
    const t = (x - xs[lo]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[lo] + (t3 - 2 * t2 + t) * h * m[lo] + (-2 * t3 + 3 * t2) * ys[hi] + (t3 - t2) * h * m[hi];
  };
}
const yawAt = monotone(KNOTS.s, KNOTS.yaw);
const pitchAt = monotone(KNOTS.s, KNOTS.pitch);

/* ------------------------------------------------------ progress → distance walked */

const WALK_END = DWELL_S[DWELL_S.length - 1].s1;

/** Arc length walked at progress p. Flat (a slow drift) inside dwells, eased in between, C1 everywhere. */
export function distanceAt(p) {
  const first = DWELL_S[0];
  if (p <= first.a) return first.s0;
  for (let i = 0; i < DWELL_S.length; i++) {
    const d = DWELL_S[i];
    if (p <= d.b) return lerp(d.s0, d.s1, span(p, d.a, d.b));
    const next = DWELL_S[i + 1];
    if (!next) return d.s1;
    if (p < next.a) {
      const dp = next.a - d.b;
      const t = (p - d.b) / dp;
      const v0 = (d.s1 - d.s0) / (d.b - d.a); // drift speed leaving this dwell
      const v1 = (next.s1 - next.s0) / (next.b - next.a); // drift speed entering the next
      const L = next.s0 - d.s1;
      const w = t - Math.sin(2 * Math.PI * t) / (2 * Math.PI);
      return d.s1 + dp * (v0 * t + ((v1 - v0) * t * t) / 2) + (L - (dp * (v0 + v1)) / 2) * w;
    }
  }
  return WALK_END;
}

/* ------------------------------------------------------------- the top view */

export const FOV = { landscape: 55, portrait: 62, top: 24 };
export const isPortrait = (aspect) => aspect < 0.85;

/**
 * How the stage is laid out around the 3D picture, shared by the camera and the CSS:
 *  - landscape: cards take 46% of the width on one side, so the subject slides 0.25 of the width to the other
 *  - portrait:  cards take the lower 45%, so the subject slides up by 0.19 of the height
 */
export function layoutFor(aspect) {
  return isPortrait(aspect) ? { shiftX: 0, shiftY: 0.19, planW: 0.9, planH: 0.36 } : { shiftX: 0.25, shiftY: 0, planW: 0.42, planH: 0.6 };
}

/** The final camera: straight down over the centre of the plan, high enough that the whole plan fits its slot. */
export function topView(aspect) {
  const L = layoutFor(aspect);
  const metresWide = PLAN.w / L.planW;
  const visibleH = Math.max(metresWide / aspect, PLAN.h / L.planH);
  const height = visibleH / (2 * Math.tan((FOV.top * D2R) / 2));
  return { x: PLAN.w / 2, z: PLAN.h / 2, y: height, visibleH, visibleW: visibleH * aspect };
}

/* ---------------------------------------------------------------- the route */

const tmp = [0, 0, 0];

/**
 * Everything about the walk at progress p (0..1).
 * @param {number} p
 * @param {{ aspect?: number, shift?: boolean }} [view] viewport aspect (width / height); shift=false keeps the picture centred
 * @returns {{
 *   position: number[], lookAt: number[], yaw: number, pitch: number, heading: number, fov: number,
 *   stopIndex: number, distance: number, walked: number, shiftX: number, shiftY: number,
 *   upper: number, plan: number, rise: number
 * }}
 */
export function routeAt(p, view = {}, out = {}) {
  const aspect = view.aspect ?? 1.6;
  const portrait = isPortrait(aspect);
  const q = clamp01(p);
  const s = distanceAt(q);
  positionAt(s, tmp);
  let x = tmp[0];
  let y = tmp[1];
  let z = tmp[2];
  let yaw = yawAt(s);
  let pitch = pitchAt(s);
  let fov = portrait ? FOV.portrait : FOV.landscape;
  let rise = 0;

  if (q > RISE.a) {
    // Lift: tilt down first, then climb, turning through west to north so the plan ends north-up.
    rise = span(q, RISE.a, RISE.b);
    const top = topView(aspect);
    const climb = smoother(rise);
    const k = climb * climb * (3 - 2 * climb); // slow start so the eye leaves the room gently
    const hy = Math.pow(k, 1.6);
    x = lerp(x, top.x, smoother(span(rise, 0.08, 0.92)));
    z = lerp(z, top.z, smoother(span(rise, 0.08, 0.92)));
    y = lerp(y, top.y, hy);
    yaw = lerp(yaw, Math.ceil((yaw - 1e-6) / (2 * Math.PI)) * 2 * Math.PI, smoother(span(rise, 0.02, 0.82)));
    pitch = lerp(pitch, -Math.PI / 2, smoother(span(rise, 0.0, 0.7)));
    fov = lerp(fov, FOV.top, smoother(span(rise, 0.1, 0.9)));
  }

  // Lens shift: slide the picture clear of the render card (and frame the plan beside the last card).
  const L = layoutFor(aspect);
  const cs = view.shift === false ? 0 : cardShift(q);
  const shiftX = cs * L.shiftX;
  const shiftY = view.shift === false ? 0 : Math.abs(cs) * L.shiftY;

  const cp = Math.cos(pitch);
  const dx = Math.sin(yaw) * cp;
  const dy = Math.sin(pitch);
  const dz = -Math.cos(yaw) * cp;

  let stopIndex = 0;
  for (const st of STOPS) if (q >= st.a - 0.03) stopIndex = st.index;

  // Reuse the caller's arrays: the 3D camera calls this every frame and must not allocate.
  const pos = out.position || (out.position = [0, 0, 0]);
  const look = out.lookAt || (out.lookAt = [0, 0, 0]);
  pos[0] = x;
  pos[1] = y;
  pos[2] = z;
  look[0] = x + dx * 5;
  look[1] = y + dy * 5;
  look[2] = z + dz * 5;
  out.yaw = yaw;
  out.pitch = pitch;
  out.heading = (((yaw / D2R) % 360) + 360) % 360;
  out.fov = fov;
  out.stopIndex = stopIndex;
  out.distance = s;
  out.walked = s / WALK_END;
  out.shiftX = shiftX;
  out.shiftY = shiftY;
  out.upper = 1 - smooth(span(y, UPPER_FADE.y0, UPPER_FADE.y1));
  out.plan = smooth(span(q, PLAN_FADE.a, PLAN_FADE.b));
  out.rise = rise;
  return out;
}

/** The walked path as a polyline in plan metres [[x, z], …] with cumulative fraction, for the mini-map. */
export function pathPolyline(step = 0.25) {
  const pts = [];
  const o = [0, 0, 0];
  for (let s = 0; s <= WALK_END + 1e-6; s += step) {
    positionAt(Math.min(s, WALK_END), o);
    pts.push([o[0], o[2], Math.min(s, WALK_END) / WALK_END]);
  }
  return pts;
}
export const WALK_LENGTH = WALK_END;

/** Plan position of each stop (where the camera stands), for the mini-map markers. */
export function stopPositions() {
  return STOPS.map((st) => {
    const r = routeAt(st.index === 6 ? RISE.a : (st.a + Math.min(st.b, st.a + 0.08)) / 2, { shift: false });
    return { index: st.index, x: r.position[0], z: r.position[2] };
  });
}

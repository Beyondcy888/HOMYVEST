// Hero story: the world's layout, the beat timing and the camera path. Pure (no three.js), so the
// section's text overlay can share the same numbers without pulling 3D into the initial bundle.
//
// World (metres): four plots in a row along +x. A plot is 30 wide (x) and 20 deep; its depth runs
// toward −z and the road lies on the +z side, where the camera stands. docs/06 §2.1 writes the depth
// with the opposite sign; it is mirrored here so the calibrated key light (upper left, slightly
// behind) throws shadows toward the viewer.
import { clamp01, easeInOut } from '../../lib/scroll/progress.js';

export const FOV = 22;
export const PLOT = { w: 30, d: 20, xs: [0, 46, 92, 138] };
/** Bands from the street inward: open 0–4, building 4–16, green 16–20 (as the calculator). */
export const BUILD_Z = -10; // centre of the building band
export const PLATE_TOP = 0.22; // top of a plot plate: buildings stand on it
export const ROW_CENTRE = [69, 0, -6];

/** Scroll-progress windows. One source of truth for the 3D and the DOM overlay. */
export const BEATS = {
  idle: [0, 0.1],
  sink: [0.095, 0.17], // grass, stakes and string leave
  build: [0.105, 0.355], // the stay assembles
  swipes: [
    [0.375, 0.41],
    [0.47, 0.505],
    [0.57, 0.605],
  ],
  // office, café, sports: each starts as its swipe is settling
  assemble: [
    [0.395, 0.468],
    [0.49, 0.568],
    [0.59, 0.662],
  ],
  pull: [0.665, 0.75], // up and back to see the whole street
  warm: [0.705, 0.775], // windows
  life: [0.72, 0.8], // people and cars
  dissolve: [0.8, 0.86],
  earn: [0.86, 1],
};

const RAD = Math.PI / 180;
const TAN = Math.tan((FOV / 2) * RAD);

// Where the model may sit on screen (fractions of the stage: x0, y0, x1, y1) and what must fit there.
// Landscape keeps the left third for the headline; portrait keeps the top for it.
const LAYOUTS = {
  landscape: {
    region: [0.35, 0.11, 0.985, 0.9],
    plot: { hx: 16, hy: 6.6, hz: 12.5, cy: 6.4, cz: -8 },
    row: { hx: 86, hy: 6, hz: 15, cy: 5, cz: -6 },
    az: [-35, -23],
    el: 32,
    wideAz: -50,
    wideEl: 40,
  },
  portrait: {
    region: [0.02, 0.4, 0.98, 0.93],
    plot: { hx: 13.2, hy: 6.6, hz: 7.5, cy: 6.4, cz: -9 },
    row: { hx: 84, hy: 6, hz: 13, cy: 5, cz: -6 },
    az: [-40, -30],
    el: 34,
    wideAz: -66,
    wideEl: 40,
  },
};

/** Camera distance at which a box (half sizes) seen from az/el fits a fraction of the frame. */
function fitDistance(box, az, el, aspect, fw, fh) {
  const ca = Math.abs(Math.cos(az));
  const sa = Math.abs(Math.sin(az));
  const w = 2 * (ca * box.hx + sa * box.hz);
  const h = 2 * (Math.sin(el) * (sa * box.hx + ca * box.hz) + Math.cos(el) * box.hy);
  return Math.max(w / (2 * TAN * aspect * fw), h / (2 * TAN * fh));
}

/**
 * Builds the keyframes for one stage aspect ratio. Call again when the stage is resized.
 * Returns { portrait, cx, cy, keys } where cx, cy is the screen point (0..1) the camera target lands on.
 */
export function createRig(aspect) {
  const portrait = aspect < 0.9;
  const L = portrait ? LAYOUTS.portrait : LAYOUTS.landscape;
  const [x0, y0, x1, y1] = L.region;
  const fw = x1 - x0;
  const fh = y1 - y0;
  const el = L.el * RAD;
  const dist = (box, az, elev) => fitDistance(box, az * RAD, elev, aspect, fw, fh);

  const plotKey = (p, index, az, push, ease) => ({
    p,
    ease,
    x: PLOT.xs[index],
    y: L.plot.cy,
    z: L.plot.cz,
    az: az * RAD,
    el,
    lnd: Math.log(dist(L.plot, az, el) * push),
  });
  const wideEl = L.wideEl * RAD;
  const wideKey = (p, push, ease) => ({
    p,
    ease,
    x: ROW_CENTRE[0],
    y: L.row.cy,
    z: L.row.cz,
    az: L.wideAz * RAD,
    el: wideEl,
    lnd: Math.log(dist(L.row, L.wideAz, wideEl) * push),
  });

  const [azIdle, azBuilt] = L.az;
  const S = BEATS.swipes;
  const keys = [
    plotKey(0, 0, azIdle, 1.15),
    plotKey(BEATS.idle[1], 0, azIdle, 1.075, 'out'),
    plotKey(0.36, 0, azBuilt, 1, 'inOut'),
    plotKey(S[0][0], 0, azBuilt, 1),
    plotKey(S[0][1], 1, azBuilt, 1, 'inOut'),
    plotKey(S[1][0], 1, azBuilt, 1),
    plotKey(S[1][1], 2, azBuilt, 1, 'inOut'),
    plotKey(S[2][0], 2, azBuilt, 1),
    plotKey(S[2][1], 3, azBuilt, 1, 'inOut'),
    plotKey(BEATS.pull[0], 3, azBuilt, 1),
    wideKey(BEATS.pull[1], 1.035, 'smooth'),
    wideKey(BEATS.dissolve[0], 1, 'out'),
    wideKey(1, 1),
  ];
  return { portrait, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, keys };
}

const EASE = {
  inOut: easeInOut, // power2.inOut: the sideways swipes
  out: (t) => 1 - (1 - t) * (1 - t),
  smooth: (t) => t * t * t * (t * (t * 6 - 15) + 10), // the pull-back starts and lands very gently
};

/**
 * The camera at progress p. Writes { x, y, z (target), az, el, dist } into `out` (no allocation).
 * Camera position = target + dist · (sin az · cos el, sin el, cos az · cos el).
 */
export function cameraAt(p, rig, out) {
  const keys = rig.keys;
  let i = 1;
  while (i < keys.length - 1 && p > keys[i].p) i += 1;
  const a = keys[i - 1];
  const b = keys[i];
  const raw = clamp01((p - a.p) / (b.p - a.p || 1));
  const t = b.ease ? EASE[b.ease](raw) : raw;
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  out.z = a.z + (b.z - a.z) * t;
  out.az = a.az + (b.az - a.az) * t;
  out.el = a.el + (b.el - a.el) * t;
  // distance is interpolated in log space, so a long pull-back zooms at an even visual rate
  out.dist = Math.exp(a.lnd + (b.lnd - a.lnd) * t);
  return out;
}

/** Which of the four options the camera is on (0..3), for the slide labels. */
export function slideAt(p) {
  let index = 0;
  for (const [a, b] of BEATS.swipes) if (p >= (a + b) / 2) index += 1;
  return index;
}

// Camera calibration and render alignment for the padel assembly (docs/06 §4.2, §4.5). Pure maths, no three.js.
//
// Measured on the cleaned masters (.cache/padel-clean): the slab's two ground edges were fitted on the lower
// silhouette of each image (subpixel line fits over 300–800 columns). All three come out at 29.95°–29.98° on
// both sides, so tan α₁ · tan α₂ = sin²(elevation) gives 35.26° and tan(azimuth) = tan α₁ / sin(elevation)
// gives 45°: the renders are true isometric views, and one camera serves all three.
//
// World frame: +x runs along the slab's front-right edge (B → R, up-right on screen), −z along the
// front-left edge (B → L), +y is up. The camera looks down the (1, −1, −1) diagonal.

export const ELEVATION = Math.atan(Math.SQRT1_2); // 35.264°
export const AZIMUTH = Math.PI / 4; // 45°
/** Unit vector from the scene toward the camera. */
export const VIEW = [-1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)];
/** Camera-plane basis: screen right and screen up, as world vectors. */
export const RIGHT = [Math.SQRT1_2, 0, Math.SQRT1_2];
export const UP = [1 / Math.sqrt(6), 2 / Math.sqrt(6), -1 / Math.sqrt(6)];
/** One metre along any world axis covers this much of the camera plane (isometric foreshortening). */
export const AXIS_SCALE = Math.sqrt(2 / 3);

/** World point → camera-plane coordinates [right, up] in metres, relative to the world origin. */
export const project = ([x, y, z]) => [x * RIGHT[0] + z * RIGHT[2], x * UP[0] + y * UP[1] + z * UP[2]];

/** Camera-plane point → the world point on the plane through the origin facing the camera. */
export const unproject = ([cx, cy]) => [cx * RIGHT[0] + cy * UP[0], cy * UP[1], cx * RIGHT[2] + cy * UP[2]];

/**
 * Least-squares similarity (uniform scale + translation, no rotation: the camera is already matched)
 * mapping camera-plane points onto image pixels:  u = ox + s·cx,  v = oy − s·cy.
 * pairs: [{ plane: [cx, cy], px: [u, v] }]. Returns { scale, origin: [ox, oy], rms, max } (errors in px).
 */
export function fitSimilarity(pairs) {
  const n = pairs.length;
  let mx = 0, my = 0, mu = 0, mv = 0;
  for (const { plane, px } of pairs) {
    mx += plane[0] / n; my += plane[1] / n; mu += px[0] / n; mv += px[1] / n;
  }
  let num = 0, den = 0;
  for (const { plane, px } of pairs) {
    const dx = plane[0] - mx, dy = plane[1] - my;
    num += dx * (px[0] - mu) - dy * (px[1] - mv);
    den += dx * dx + dy * dy;
  }
  const scale = num / den;
  const origin = [mu - scale * mx, mv + scale * my];
  const t = { scale, origin };
  const errs = pairs.map(({ plane, px }) => residual(t, plane, px));
  return { ...t, rms: Math.sqrt(errs.reduce((a, e) => a + e * e, 0) / n), max: Math.max(...errs) };
}

/** Camera-plane point → image pixel under a fitted transform. */
export const toPixel = (t, [cx, cy]) => [t.origin[0] + t.scale * cx, t.origin[1] - t.scale * cy];
/** Image pixel → camera-plane point. */
export const toPlane = (t, [u, v]) => [(u - t.origin[0]) / t.scale, -(v - t.origin[1]) / t.scale];
/** Distance in px between where the model puts a point and where the image has it. */
export const residual = (t, plane, px) => {
  const [u, v] = toPixel(t, plane);
  return Math.hypot(u - px[0], v - px[1]);
};

/** The image's rectangle on the camera plane: { x0, x1, y0, y1 } (y up). */
export function imageBounds(t, [w, h]) {
  const [x0, y1] = toPlane(t, [0, 0]);
  const [x1, y0] = toPlane(t, [w, h]);
  return { x0, x1, y0, y1 };
}

/** Union of several camera-plane rectangles. */
export function unionBounds(list) {
  return list.reduce(
    (a, b) => ({ x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), y0: Math.min(a.y0, b.y0), y1: Math.max(a.y1, b.y1) }),
    { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity },
  );
}

/**
 * Where an image sits over the canvas, in CSS px. Recomputed on every resize and whenever the zoom moves,
 * because the orthographic frustum follows the canvas size.
 *  - t:      fitted transform of that image
 *  - view:   { width, height, zoom, centre: [cx, cy] }  canvas size in CSS px, orthographic zoom
 *            (CSS px per metre on the camera plane) and the camera-plane point at the canvas centre
 * Returns { left, top, scale }: the image's top-left corner and CSS px per image px.
 */
export function imagePlacement(t, view) {
  const scale = view.zoom / t.scale;
  const [x0, y1] = toPlane(t, [0, 0]);
  return {
    left: view.width / 2 + (x0 - view.centre[0]) * view.zoom,
    top: view.height / 2 - (y1 - view.centre[1]) * view.zoom,
    scale,
  };
}

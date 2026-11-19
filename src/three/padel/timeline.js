// The padel scene's clock (docs/06 §4.4). Pure numbers, shared by the 3D scene and the section's text,
// so the two cannot drift apart. No three.js here: the section imports this without loading the scene.
import { span, easeInOut, lerp } from '../../lib/scroll/progress.js';

/** When each stage assembles, as [start, end] of the scroll progress. */
export const STAGES = [
  [0.05, 0.3],
  [0.4, 0.62],
  [0.72, 0.92],
];

/**
 * When each render wipes in over the model and when it wipes back out to clay.
 * The last one stays: the scene ends on the finished hall in colour.
 */
export const REVEALS = [
  { in: [0.3, 0.345], out: [0.365, 0.4] },
  { in: [0.62, 0.665], out: [0.685, 0.72] },
  { in: [0.92, 0.975], out: null },
];

/** The slab is a faint ghost while the section arrives, then becomes solid. */
export const SLAB = [0, 0.05];

/** Progress at which each stage's sentence takes over from the previous one. */
export const TEXT_AT = [0, 0.375, 0.695];

/** Good moments for posters and for checking the alignment: each render fully revealed. */
export const REVEALED_AT = [0.355, 0.675, 1];

/** The camera never moves; it only closes in very slowly (×1 → ×1.06 over the whole scene). */
export const ZOOM_GAIN = 0.06;
export const zoomFactor = (p) => (1 + ZOOM_GAIN * p) / (1 + ZOOM_GAIN);

/** Stage progress 0..1 for stage i at scroll progress p. */
export const stageProgress = (p, i) => span(p, STAGES[i][0], STAGES[i][1]);

/**
 * The wipe of render i at progress p: { lead, trail } in 0..1.
 * The band between the trailing and the leading edge shows the render; outside it the clay shows.
 * lead runs 0 → 1 as the render arrives; trail runs 0 → 1 as it leaves in the same direction.
 */
export function wipe(p, i) {
  const r = REVEALS[i];
  return {
    lead: easeInOut(span(p, r.in[0], r.in[1])),
    trail: r.out ? easeInOut(span(p, r.out[0], r.out[1])) : 0,
  };
}

/** Which stage the reader is in (0, 1 or 2): drives the sentence and the counter. */
export const stageAt = (p) => (p >= TEXT_AT[2] ? 2 : p >= TEXT_AT[1] ? 1 : 0);

/** Opacity of the model layer: a ghost of the plot first, solid once the scene is pinned. */
export const slabOpacity = (p) => lerp(0.3, 1, easeInOut(span(p, SLAB[0], SLAB[1])));

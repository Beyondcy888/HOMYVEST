// Scroll lengths and smoothing for the pinned scenes on /portofolio/ (U01_04 §3). Single source of truth:
// every pinned scene reads its length here, and the 3D scenes read their damping times here.
// Progress fractions and beat ranges (docs/06) never change; only the pixel length that maps to 0 → 1 does.

// Pixel length of each pinned scene = vh × innerHeight / 100. Tune here only.
export const SCROLL = {
  story: { desktop: 1000, mobile: 800 }, // was 500 / 420
  maxone: { desktop: 1400, mobile: 1100 }, // was 700 / 560
  padel: { desktop: 800, mobile: 640 }, // was 360 / ~360
  beyondPanel: { desktop: 110 }, // horizontal pin, per panel (tablet and mobile: no pin)
};

export const SMOOTH = {
  lenisLerp: 0.075, // portfolio page (the main page keeps 0.1)
  wheelMultiplier: 0.85, // portfolio page only: each wheel notch moves less
  cameraSmoothTime: 0.28, // was ~0.18 (maath damp)
  assemblySmoothTime: 0.2, // was ~0.12
};

/** "Mobile" for scroll lengths = a coarse pointer and a viewport narrower than 768 px. */
export const MOBILE_SCROLL_QUERY = '(pointer: coarse) and (max-width: 767px)';

/** Scroll length (in viewport-height units × 100) of a scene for the current device class. */
export const scrollLength = (key, mobile) => (mobile ? (SCROLL[key].mobile ?? SCROLL[key].desktop) : SCROLL[key].desktop);

// A tiny observable number. Scroll writes it; 3D scenes read it inside useFrame and damp towards it.
// Never React state: scroll must not re-render components (docs/06 §1.5).
export function createProgress(initial = 0) {
  const listeners = new Set();
  return {
    current: initial,
    set(v) {
      if (v === this.current) return;
      this.current = v;
      listeners.forEach((fn) => fn(v));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Progress of `p` through the window [a, b], clamped to 0..1. */
export const span = (p, a, b) => clamp01((p - a) / (b - a));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2); // power2.inOut
export const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
export const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

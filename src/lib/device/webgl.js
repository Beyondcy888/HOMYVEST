import { query } from '../storage.js';

let cached;

/** True when a WebGL2 context can be created. Checked once. `?nowebgl=1` forces false for QA. */
export function hasWebGL() {
  if (cached !== undefined) return cached;
  if (typeof window === 'undefined') return (cached = false);
  if (query('nowebgl') === '1') return (cached = false);
  try {
    if (!window.WebGL2RenderingContext) return (cached = false);
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    cached = Boolean(gl);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}

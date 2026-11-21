// Idle-time preparation of the portfolio's 3D scenes (U01_04 §4, items 1 and 8).
//
// Each scene's code is a separate chunk, and two of them build heavy geometry when they first mount
// (the Maxone room, the padel hall). Done at mount time that work lands one viewport before the scene,
// which is inside the previous scene's pin. So, while the visitor reads the intro, the page fetches the
// chunks one by one in idle time and asks each module to build its world ahead of time (`prebuild`),
// in small slices that never hold the main thread for long. When the scene mounts, it finds its world ready.
import { hasWebGL } from '../../lib/device/webgl.js';
import { getTier } from '../../lib/device/tier.js';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';
import { query } from '../../lib/storage.js';

const LOADERS = {
  story: () => import('../../three/hero/HeroScene.jsx'),
  maxone: () => import('../../three/maxone/MaxoneScene.jsx'),
  padel: () => import('../../three/padel/PadelScene.jsx'),
};

const idle = (fn, timeout = 2000) =>
  typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(fn, { timeout }) : window.setTimeout(() => fn({ timeRemaining: () => 8, didTimeout: true }), 200);

/** Whether a scene will run live on this device (the same rules its section uses). */
function willRun(key) {
  if (prefersReducedMotion() || !hasWebGL()) return false;
  const tier = getTier();
  if (key === 'maxone') return query('maxone') !== 'fallback' && (tier.maxone3d || query('maxone') === '3d');
  if (key === 'padel') return tier.name !== 'low';
  return true;
}

const started = new Set();

/** Fetches one scene's chunk in idle time, then lets it build its world in idle slices. Resolves when done. */
export function prepareScene(key) {
  if (started.has(key) || !LOADERS[key] || !willRun(key)) return Promise.resolve();
  started.add(key);
  return new Promise((resolve) => {
    idle(() =>
      LOADERS[key]()
        .then((mod) => (typeof mod.prebuild === 'function' ? mod.prebuild(idle) : undefined))
        .catch(() => undefined)
        .then(resolve),
    );
  });
}

/** Prepares the scenes in page order, one after another, starting when the page is idle. */
export async function prepareScenes(keys = ['story', 'maxone', 'padel']) {
  for (const key of keys) await prepareScene(key);
}

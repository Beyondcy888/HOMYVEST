// Registry of the pinned scenes, exposed on window.__homyvest for QA (docs/06 §7, docs/09 §5).
// Each entry: { start, end } in page pixels, plus a progress() reader.
// `pinned` is the id of the scene pinned to the viewport right now (null between scenes).
export const registry = { lenis: null, triggers: {}, pinned: null };

if (typeof window !== 'undefined') window.__homyvest = registry;

export function registerTrigger(id, st) {
  registry.triggers[id] = {
    get start() {
      return st.start;
    },
    get end() {
      return st.end;
    },
    progress: () => st.progress,
  };
  return () => {
    delete registry.triggers[id];
  };
}

const pinListeners = new Set();

/** Called by PinnedScene when a scene starts or stops being pinned. */
export function setPinnedScene(id, active) {
  const next = active ? id : registry.pinned === id ? null : registry.pinned;
  if (next === registry.pinned) return;
  registry.pinned = next;
  pinListeners.forEach((fn) => fn(next));
}

/** Follows which scene is pinned. Returns an unsubscribe function. */
export function onPinnedScene(fn) {
  pinListeners.add(fn);
  return () => pinListeners.delete(fn);
}

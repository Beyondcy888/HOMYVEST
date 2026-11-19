// Registry of the pinned scenes, exposed on window.__homyvest for QA (docs/06 §7, docs/09 §5).
// Each entry: { start, end } in page pixels, plus a progress() reader.
export const registry = { lenis: null, triggers: {} };

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

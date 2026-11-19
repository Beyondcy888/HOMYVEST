import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.(QUERY).matches);

const subscribe = (fn) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', fn);
  return () => mq.removeEventListener('change', fn);
};

/** Follows the OS "reduce motion" setting live. */
export const useReducedMotion = () => useSyncExternalStore(subscribe, prefersReducedMotion, () => false);

/** Generic media-query hook. */
export function useMediaQuery(q) {
  return useSyncExternalStore(
    (fn) => {
      const mq = window.matchMedia(q);
      mq.addEventListener('change', fn);
      return () => mq.removeEventListener('change', fn);
    },
    () => window.matchMedia(q).matches,
    () => false,
  );
}

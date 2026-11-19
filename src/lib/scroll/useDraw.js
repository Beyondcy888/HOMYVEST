import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from '../device/useReducedMotion.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Scrubs a CSS variable `--draw` from 0 to 1 on the element as it scrolls through the viewport.
 * Used for the hairlines that draw themselves (team chain, next steps). Reversible; skipped for
 * reduced motion, where the line is simply complete.
 */
export function useDraw({ start = 'top 80%', end = 'bottom 55%' } = {}) {
  const ref = useRef(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el,
        { '--draw': 0 },
        { '--draw': 1, ease: 'none', scrollTrigger: { trigger: el, start, end, scrub: true } },
      );
    },
    { scope: ref },
  );
  return ref;
}

/** Adds `is-in` once when the element enters the viewport (image scale-in and similar one-shot reveals). */
export function useInViewClass(options = { rootMargin: '0px 0px -12% 0px' }) {
  const ref = useRef(null);
  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return undefined;
      const targets = root.matches('[data-reveal]') ? [root] : root.querySelectorAll('[data-reveal]');
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, options);
      targets.forEach((t) => io.observe(t));
      return () => io.disconnect();
    },
    { scope: ref },
  );
  return ref;
}

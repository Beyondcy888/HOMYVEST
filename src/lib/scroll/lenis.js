// Smooth scrolling. Lenis and ScrollTrigger share GSAP's ticker so they never drift (docs/09 §5).
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { registry } from './triggers.js';
import { prefersReducedMotion } from '../device/useReducedMotion.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

let lenis = null;
let tick = null;
let stops = 0;

/**
 * Starts smooth scrolling. The main page uses lerp 0.1; the portfolio page passes a softer lerp and a smaller
 * wheel step so its long scenes move slowly (U01_04 §3, src/content/scroll-config.js).
 */
export function startLenis({ reducedMotion, lerp = 0.1, wheelMultiplier = 1 }) {
  if (reducedMotion || lenis) return lenis; // reduced motion keeps native scrolling
  lenis = new Lenis({ lerp, smoothWheel: true, wheelMultiplier, touchMultiplier: 1, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  tick = (time) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  registry.lenis = lenis;
  return lenis;
}

export function destroyLenis() {
  if (tick) gsap.ticker.remove(tick);
  lenis?.destroy();
  lenis = null;
  tick = null;
  registry.lenis = null;
}

export const getLenis = () => lenis;

const headerOffset = () => {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'));
  return Number.isFinite(v) ? v : 72;
};

/**
 * Scroll to an element, a selector or a pixel position.
 * Short hops glide; long ones (which would race through the pinned 3D scenes) jump behind a quick veil.
 */
export function scrollToTarget(target, { offset, focus, onArrive, immediate = false } = {}) {
  // On a first visit the sections below the hero mount a moment after the intro. A link clicked in that
  // moment waits for its target instead of doing nothing.
  if (typeof target === 'string' && !document.querySelector(target)) {
    let tries = 0;
    const wait = () => {
      if (document.querySelector(target)) scrollToTarget(target, { offset, focus, onArrive, immediate });
      else if ((tries += 1) < 120) requestAnimationFrame(wait);
    };
    requestAnimationFrame(wait);
    return;
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target instanceof Element ? target : null;
  const y =
    typeof target === 'number'
      ? target
      : el
        ? el.getBoundingClientRect().top + window.scrollY + (offset ?? -headerOffset() + 1)
        : null;
  if (y === null) return;
  const top = Math.max(0, Math.round(y));
  const arrive = () => {
    if (focus) {
      const node = typeof focus === 'string' ? document.querySelector(focus) : focus;
      node?.focus?.({ preventScroll: true });
      // If the focused field is off screen (on phones the inputs sit below the sticky 3D), bring it to
      // just below the middle of the viewport, clear of anything sticky at the top.
      const rect = node?.getBoundingClientRect?.();
      if (rect && (rect.top < 90 || rect.bottom > window.innerHeight - 40)) {
        const y = Math.max(0, Math.round(window.scrollY + rect.top - window.innerHeight * 0.58));
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo({ top: y, behavior: 'auto' });
      }
    }
    onArrive?.();
  };
  const far = Math.abs(top - window.scrollY) > window.innerHeight * 2.5;

  if (!lenis || prefersReducedMotion()) {
    window.scrollTo({ top, behavior: 'auto' });
    requestAnimationFrame(arrive);
    return;
  }
  // A deep link on load (/#calculator, /?focus=phone) lands at once, without gliding through the page.
  if (immediate) {
    lenis.scrollTo(top, { immediate: true, force: true });
    ScrollTrigger.update();
    requestAnimationFrame(arrive);
    return;
  }
  if (far) {
    const veil = document.documentElement;
    veil.classList.add('is-jumping');
    window.setTimeout(() => {
      lenis.scrollTo(top, { immediate: true, force: true });
      ScrollTrigger.update();
      requestAnimationFrame(() => {
        veil.classList.remove('is-jumping');
        arrive();
      });
    }, 160);
    return;
  }
  lenis.scrollTo(top, { duration: 1.2, force: true, onComplete: arrive });
}

/** Pause page scrolling while a dialog is open. Calls nest. */
export function lockScroll() {
  stops += 1;
  if (lenis) lenis.stop();
  else document.documentElement.style.overflow = 'hidden';
}
export function unlockScroll() {
  stops = Math.max(0, stops - 1);
  if (stops > 0) return;
  if (lenis) lenis.start();
  else document.documentElement.style.overflow = '';
}

let refreshQueued = false;
/** Recalculate trigger positions after layout changes (fonts, language, lazy sections). Coalesced. */
export function refreshTriggers() {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    ScrollTrigger.refresh();
    lenis?.resize();
  });
}

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { session, query } from '../../lib/storage.js';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';
import { canHover } from '../../lib/device/tier.js';
import { useUi } from '../../lib/ui/store.js';
import { hasDeepLink } from '../../lib/page.js';
import Wordmark from './Wordmark.jsx';
import './Intro.css';

const KEY = 'homyvest:intro';

/**
 * Logo → story. The page opens on the wordmark, centred and huge; it expands to HOMY INVESTASI,
 * collapses, then flies into the header position while the hero appears beneath (docs/03 §4).
 * Never blocks content: the hero renders behind it. Click, scroll or any key skips it.
 * Once per session; skipped entirely with reduced motion, on a deep link (/#calculator, /?focus=phone: the
 * visitor came for something specific) and on the portfolio page (enabled = false).
 */
export default function Intro({ headerMark, enabled = true }) {
  const setIntroDone = useUi((s) => s.setIntroDone);
  const [show] = useState(
    () =>
      enabled &&
      !(prefersReducedMotion() || session.get(KEY) === '1' || query('nointro') === '1' || window.scrollY > 40 || hasDeepLink()),
  );
  const [gone, setGone] = useState(!show);
  const ref = useRef(null);
  const mark = useRef(null);

  useEffect(() => {
    if (!show) {
      setIntroDone();
      // Touch devices never hover: show the expansion once even when the intro is skipped per session.
      return undefined;
    }
    session.set(KEY, '1');
    const overlay = ref.current;
    const big = mark.current.el;
    const wm = big.querySelector('.wm');
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      tl.kill();
      setIntroDone();
      gsap.to(overlay, { opacity: 0, duration: 0.25, ease: 'none', onComplete: () => setGone(true) });
      cleanup();
      if (!canHover()) gsap.delayedCall(0.4, () => headerMark.current?.play());
    };

    const flyToHeader = () => {
      const target = headerMark.current?.el?.querySelector('.wm');
      if (!target) return finish();
      mark.current.collapse();
      const from = wm.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const scale = to.height / from.height;
      gsap.to(overlay.querySelector('.intro__bg'), { opacity: 0, duration: 0.7, ease: 'power2.inOut' });
      gsap.to(wm, {
        x: to.left - from.left,
        y: to.top - from.top,
        scale,
        transformOrigin: '0 0',
        duration: 0.8,
        ease: 'expo.inOut',
        onComplete: finish,
      });
    };

    const tl = gsap.timeline();
    tl.fromTo(
      wm,
      { opacity: 0, letterSpacing: '0.1em' },
      { opacity: 1, letterSpacing: '-0.02em', duration: 0.6, ease: 'expo.out' },
    )
      .call(() => mark.current.expand(), null, 0.6)
      .call(() => mark.current.collapse(), null, 1.15)
      .call(flyToHeader, null, 1.5);

    const skip = () => finish();
    const cleanup = () => {
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchstart', skip);
      window.removeEventListener('keydown', skip);
      overlay.removeEventListener('pointerdown', skip);
    };
    window.addEventListener('wheel', skip, { passive: true });
    window.addEventListener('touchstart', skip, { passive: true });
    window.addEventListener('keydown', skip);
    overlay.addEventListener('pointerdown', skip);
    return () => {
      cleanup();
      tl.kill();
    };
  }, [show, setIntroDone, headerMark]);

  if (gone) return null;
  return (
    <div ref={ref} className="intro" aria-hidden="true">
      <div className="intro__bg" />
      <Wordmark ref={mark} as="div" interactive={false} className="intro__mark" />
    </div>
  );
}

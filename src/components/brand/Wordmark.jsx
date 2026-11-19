import { useEffect, useImperativeHandle, useRef } from 'react';
import { gsap } from 'gsap';
import { useT } from '../../i18n/useT.js';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';
import { canHover } from '../../lib/device/tier.js';
import './Wordmark.css';

/**
 * HOMYVEST → HOMY INVESTASI.
 * The letters of HOMYVEST never move out of order; "IN" and "ASI" slide in around them while the
 * whole word eases from width 125% to 104%, so it reads as the word breathing (docs/03 §4).
 *
 * ref API: { expand(), collapse(), play(hold = 1.2) → Promise, el }
 */
export default function Wordmark({ ref, as: Tag = 'a', className = '', interactive = true, playOnView = false, ...rest }) {
  const { t } = useT();
  const hostRef = useRef(null);
  const wmRef = useRef(null);
  const tl = useRef(null);
  const drive = useRef(null);

  const build = () => {
    const wm = wmRef.current;
    if (!wm) return null;
    tl.current?.kill();
    const ins = wm.querySelectorAll('.wm-ins');
    const gap = wm.querySelector('.wm-gap');
    const letters = wm.querySelectorAll('.wm-ins i');

    // Measure each insert's natural width at the END state (width axis 104) on a hidden clone.
    const clone = wm.cloneNode(true);
    clone.style.cssText = 'position:absolute;left:-200vw;top:0;visibility:hidden;pointer-events:none;--wm-wdth:104';
    clone.querySelectorAll('.wm-ins').forEach((n) => (n.style.width = 'auto'));
    wm.parentNode.appendChild(clone);
    const widths = [...clone.querySelectorAll('.wm-ins')].map((n) => n.getBoundingClientRect().width);
    clone.remove();
    const em = parseFloat(getComputedStyle(wm).fontSize) || 16;

    const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    timeline
      .fromTo(wm, { '--wm-wdth': 125 }, { '--wm-wdth': 104, duration: 1 }, 0)
      .fromTo(gap, { width: 0 }, { width: em * 0.28, duration: 1 }, 0)
      .fromTo(ins[0], { width: 0 }, { width: widths[0], duration: 1 }, 0)
      .fromTo(ins[1], { width: 0 }, { width: widths[1], duration: 1 }, 0)
      .fromTo(letters, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.05 }, 0.05);
    tl.current = timeline;
    return timeline;
  };

  const expand = () => {
    if (prefersReducedMotion()) return;
    const timeline = tl.current && tl.current.progress() > 0 ? tl.current : build();
    if (!timeline) return;
    drive.current?.kill();
    drive.current = gsap.to(timeline, { progress: 1, duration: 0.6, ease: 'expo.out' });
  };
  const collapse = () => {
    if (!tl.current) return;
    drive.current?.kill();
    drive.current = gsap.to(tl.current, { progress: 0, duration: 0.45, ease: 'power3.inOut' });
  };
  const play = (hold = 1.2) =>
    new Promise((resolve) => {
      if (prefersReducedMotion()) return resolve();
      expand();
      gsap.delayedCall(0.6 + hold, () => {
        collapse();
        gsap.delayedCall(0.45, resolve);
      });
    });

  useImperativeHandle(ref, () => ({ expand, collapse, play, get el() { return hostRef.current; } }));

  // Touch devices have no hover: play once when the wordmark scrolls into view (footer).
  useEffect(() => {
    if (!playOnView || canHover() || prefersReducedMotion()) return undefined;
    const el = hostRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          play();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [playOnView]);

  useEffect(
    () => () => {
      drive.current?.kill();
      tl.current?.kill();
    },
    [],
  );

  const hover = interactive
    ? {
        onMouseEnter: expand,
        onMouseLeave: collapse,
        onFocus: (e) => e.target.matches?.(':focus-visible') && expand(),
        onBlur: collapse,
      }
    : {};
  const label = Tag === 'a' || Tag === 'button' ? { 'aria-label': t('wordmark.aria') } : { role: 'img', 'aria-label': t('wordmark.aria') };

  return (
    <Tag ref={hostRef} className={`wordmark ${className}`} {...label} {...hover} {...rest}>
      <span ref={wmRef} className="wm" aria-hidden="true">
        HOMY
        <span className="wm-gap" />
        <span className="wm-ins wm-in">
          <i>I</i>
          <i>N</i>
        </span>
        VEST
        <span className="wm-ins wm-asi">
          <i>A</i>
          <i>S</i>
          <i>I</i>
        </span>
      </span>
    </Tag>
  );
}

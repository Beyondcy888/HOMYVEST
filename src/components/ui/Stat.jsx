import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useT } from '../../i18n/useT.js';
import { fmtNum } from '../../i18n/format.js';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';
import './ui.css';

/**
 * A big number with a one-line label and an optional footnote marker.
 * Numbers roll up once when they enter view (1.2 s, power3.out, tabular figures).
 * stat: { n, digits?, suffix?, label, note? }  or  { text, label } for non-numeric values ("In-house").
 */
export default function Stat({ stat, className = '', size = 'stat', start }) {
  const { lang, t } = useT();
  const numRef = useRef(null);
  const isNumber = typeof stat.n === 'number';
  const final = isNumber ? fmtNum(stat.n, lang, stat.digits ?? 0) : stat.text;

  useEffect(() => {
    const el = numRef.current;
    if (!isNumber || !el) return undefined;
    el.textContent = final;
    if (prefersReducedMotion()) return undefined;
    const state = { v: 0 };
    let tween;
    const run = () => {
      tween = gsap.fromTo(
        state,
        { v: 0 },
        {
          v: stat.n,
          duration: 1.2,
          ease: 'power3.out',
          onUpdate: () => (el.textContent = fmtNum(state.v, lang, stat.digits ?? 0)),
          onComplete: () => (el.textContent = final),
        },
      );
    };
    // `start` lets a scroll-scrubbed scene trigger the roll itself instead of the viewport.
    if (start !== undefined) {
      if (start) run();
      else el.textContent = fmtNum(0, lang, stat.digits ?? 0);
      return () => tween?.kill();
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [stat.n, stat.digits, lang, final, isNumber, start]);

  return (
    <div className={`stat ${className}`}>
      <p className={`stat__value t-${size} ${isNumber ? '' : 'stat__value--text'}`}>
        {/* the full value is in the DOM from the first paint; the roll only replaces its text */}
        <span ref={numRef}>{final}</span>
        {stat.suffix ? <span className="stat__suffix">{stat.suffix}</span> : null}
      </p>
      <p className="stat__label">
        {stat.label}
        {stat.note ? (
          <sup className="fn">
            <a href={`#note-${stat.note}`} aria-label={`${t('notes.label')} ${stat.note}`}>
              {stat.note}
            </a>
          </sup>
        ) : null}
      </p>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/useT.js';
import { beforeAfter } from '../../content/behomy.js';
import { Picture } from '../../components/media/Img.jsx';
import Caption from '../../components/ui/Caption.jsx';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';

/**
 * "From idle to running" (U01_01 §2.4, item 6): four real buildings, before (greyscale originals) and after,
 * side by side. Desktop: a 2 × 2 grid. Phones: a horizontal snap carousel, one pair per view with the two
 * photos stacked, dots and "1 / 4". The sources are small, so every photo stays under 420 CSS px wide.
 */
export default function BeforeAfter() {
  const { t } = useT();
  const track = useRef(null);
  const [current, setCurrent] = useState(0);
  const total = beforeAfter.length;

  // Which pair is in view in the carousel (phones). On desktop the grid never scrolls sideways, so it stays 0.
  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const card = el.firstElementChild;
        if (!card) return;
        const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || '0');
        setCurrent(Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / Math.max(1, step)))));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', onScroll);
    };
  }, [total]);

  const go = (i) => {
    const el = track.current;
    const card = el?.children[i];
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <div className="ba">
      <div className="ba__head">
        <h3 className="t-h2 ba__title">{t('behomy.ba.title')}</h3>
        <p className="ba__sub ink-2">{t('behomy.ba.sub')}</p>
      </div>
      {/* focusable: on phones it scrolls sideways, and keyboard users must be able to scroll it too */}
      <ul className="ba__track" ref={track} aria-label={t('behomy.ba.label')} tabIndex={0}>
        {beforeAfter.map((pair, i) => (
          <li key={pair.n} className="ba__card" aria-label={t('behomy.ba.pair', { n: i + 1, total })}>
            <figure className="ba__fig">
              <div className="ba__pair">
                <div className="ba__shot">
                  <Picture id={pair.before} sizes="(min-width: 1024px) 22vw, 86vw" className="ba__img" style={{ objectPosition: pair.beforePosition }} />
                  <span className="ba__tag ba__tag--before">{t('behomy.ba.before')}</span>
                </div>
                <div className="ba__shot">
                  <Picture id={pair.after} sizes="(min-width: 1024px) 22vw, 86vw" className="ba__img" />
                  <span className="ba__tag">{t('behomy.ba.after')}</span>
                </div>
              </div>
              <Caption id={pair.after} />
            </figure>
          </li>
        ))}
      </ul>
      <div className="ba__nav">
        <p className="ba__count nums" aria-hidden="true">
          {current + 1} / {total}
        </p>
        <div className="ba__dots">
          {beforeAfter.map((pair, i) => (
            <button
              key={pair.n}
              type="button"
              className="ba__dot"
              aria-label={t('behomy.ba.pair', { n: i + 1, total })}
              aria-current={current === i ? 'true' : undefined}
              onClick={() => go(i)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

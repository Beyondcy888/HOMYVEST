import { useRef } from 'react';
import { gsap } from 'gsap';
import { useT } from '../../i18n/useT.js';
import { PORTFOLIO_URL } from '../../lib/page.js';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';
import { prefetchPortfolio } from '../../components/layout/Header.jsx';
import { Picture } from '../../components/media/Img.jsx';
import { ArrowRight } from '../../components/ui/Icons.jsx';

// The three scenes, as stills from the media library. (The scene posters live on the portfolio page; the main
// page never requests them before the visitor shows interest: U01_04 §6.)
const THUMBS = ['facades/best', 'maxone/1', 'padel-clean/padel-3'];
// The thumbnails overlap (CSS); at rest they fan slightly, on hover/focus they spread apart and lift.
// x and y in px (scaled down on phones), rotation in degrees.
const REST = [
  { x: 0, y: 0, r: -7 },
  { x: 0, y: 0, r: 0 },
  { x: 0, y: 0, r: 7 },
];
const OPEN = [
  { x: -36, y: -8, r: -10 },
  { x: 0, y: -14, r: 0 },
  { x: 36, y: -8, r: 10 },
];
const scale = () => (window.matchMedia('(max-width: 767px)').matches ? 0.4 : 1);

/**
 * "See our full portfolio" (U01_01 §2.7): one large link card. On hover or focus the thumbnails spread and lift,
 * the arrow slides and the card inverts (ink background, paper text). The portfolio page is prefetched then.
 */
export default function PortfolioCard() {
  const { t } = useT();
  const fan = useRef(null);

  const move = (open) => {
    if (open) prefetchPortfolio();
    const cards = fan.current?.children;
    if (!cards || prefersReducedMotion()) return;
    const k = scale();
    [...cards].forEach((el, i) => {
      const to = open ? OPEN[i] : REST[i];
      gsap.to(el, { x: to.x * k, y: to.y * k, rotation: to.r, duration: 0.5, ease: 'expo.out', overwrite: true });
    });
  };

  return (
    <div className="pfcard-wrap">
      <a
        className="pfcard"
        href={PORTFOLIO_URL}
        onPointerEnter={() => move(true)}
        onPointerLeave={() => move(false)}
        onFocus={() => move(true)}
        onBlur={() => move(false)}
      >
        <span className="pfcard__text">
          <span className="pfcard__title">{t('next.pf.title')}</span>
          <span className="pfcard__body">{t('next.pf.body')}</span>
        </span>
        <span className="pfcard__fan" ref={fan} aria-hidden="true">
          {THUMBS.map((id, i) => (
            <span key={id} className="pfcard__thumb" style={{ transform: `rotate(${REST[i].r}deg)` }}>
              <Picture id={id} sizes="160px" alt="" />
            </span>
          ))}
        </span>
        <span className="pfcard__arrow" aria-hidden="true">
          <ArrowRight />
        </span>
      </a>
      <p className="pfcard__list t-small">{t('next.pf.list')}</p>
    </div>
  );
}

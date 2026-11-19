import { useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useT } from '../../i18n/useT.js';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';
import { mulberry32 } from '../../three/shared/rng.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FLOORS = 5;
const BAYS = 9;
// Share of rooms taking daily guests in each month. Purely illustrative: it shows the idea of the
// hybrid model (busy months lean daily, quiet months lean monthly). No real figures are implied,
// and none are printed.
const DAILY_SHARE = [0.62, 0.34, 0.3, 0.42, 0.5, 0.74, 0.8, 0.6, 0.36, 0.32, 0.4, 0.78];

/**
 * One building drawn in line, its rooms as cells. As you scroll the months pass and cells switch
 * between daily stays (solid ink) and monthly stays (outlined). The building stays occupied.
 */
export default function HybridDiagram() {
  const { t } = useT();
  const ref = useRef(null);
  const [month, setMonth] = useState(6);
  const months = t('behomy.hybrid.months');

  // Each room has a fixed rank; a room takes daily guests when its rank is under the month's share.
  const rooms = useMemo(() => {
    const rand = mulberry32(42);
    const list = [];
    for (let f = 0; f < FLOORS; f++) for (let b = 0; b < BAYS; b++) list.push({ f, b, rank: rand(), lobby: f === FLOORS - 1 && b >= 3 && b <= 5 });
    return list;
  }, []);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top 85%',
        end: 'bottom 25%',
        onUpdate: (self) => {
          const next = Math.min(11, Math.floor(self.progress * 12));
          setMonth((prev) => (prev === next ? prev : next));
        },
      });
    },
    { scope: ref },
  );

  const cell = 44;
  const gap = 8;
  const W = BAYS * cell + (BAYS - 1) * gap;
  const H = FLOORS * cell + (FLOORS - 1) * gap;
  const share = DAILY_SHARE[month];

  return (
    <figure className="hybrid" ref={ref}>
      <div className="hybrid__frame">
        <svg className="hybrid__svg" viewBox={`-72 -34 ${W + 144} ${H + 62}`} role="img" aria-label={t('behomy.hybrid.alt')}>
          {/* An elevation, not a chart: a roof slab that overhangs, two side walls, and a ground line
              that runs on past the building. */}
          <path d={`M-26 -18H${W + 26}`} stroke="currentColor" strokeWidth="3" fill="none" />
          <path d={`M-14 -18V${H + 14}M${W + 14} -18V${H + 14}`} stroke="currentColor" strokeWidth="1" fill="none" />
          <path d={`M-72 ${H + 14}H${W + 72}`} stroke="currentColor" strokeWidth="1.5" fill="none" />
          {rooms.map((r) => {
            const x = r.b * (cell + gap);
            const y = r.f * (cell + gap);
            if (r.lobby) {
              // ground-floor lobby: one wide glazed opening with a door, running down to the ground line
              return r.b === 3 ? (
                <g key="lobby" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x={x} y={y} width={cell * 3 + gap * 2} height={cell + 14} />
                  <path d={`M${x + cell + gap / 2} ${y}V${y + cell + 14}M${x + cell * 2 + gap * 1.5} ${y}V${y + cell + 14}M${x + cell * 1.5 + gap} ${y + 10}V${y + cell + 14}`} />
                </g>
              ) : null;
            }
            const daily = r.rank < share;
            return (
              <rect
                key={`${r.f}-${r.b}`}
                className="hybrid__cell"
                data-daily={daily}
                x={x + 0.5}
                y={y + 0.5}
                width={cell - 1}
                height={cell - 1}
              />
            );
          })}
        </svg>
      </div>

      <div className="hybrid__months" aria-hidden="true">
        {months.map((name, i) => (
          <span key={name} data-active={i === month}>
            {name}
          </span>
        ))}
        <i className="hybrid__cursor" style={{ '--m': month }} />
      </div>

      <figcaption className="hybrid__caption">
        <ul className="hybrid__legend">
          <li>
            <i className="hybrid__key hybrid__key--daily" />
            {t('behomy.hybrid.daily')}
          </li>
          <li>
            <i className="hybrid__key hybrid__key--monthly" />
            {t('behomy.hybrid.monthly')}
          </li>
          <li className="hybrid__tag t-eyebrow">{t('behomy.hybrid.illustration')}</li>
        </ul>
        <p className="t-lead">{t('behomy.hybrid.caption')}</p>
      </figcaption>
    </figure>
  );
}

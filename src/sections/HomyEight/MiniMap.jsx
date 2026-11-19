import { useEffect, useMemo, useRef } from 'react';
import { useT } from '../../i18n/useT.js';
import { Picture } from '../../components/media/Img.jsx';
import { PLAN } from '../../three/maxone/plan.js';
import { routeAt, pathPolyline, stopPositions } from '../../three/maxone/route.js';

/**
 * The floor plan, small, with the camera's position and heading, the walked path, and one button per
 * stop. It is also the accessible list of stops: each button scrolls to its stop (docs/06 §3.9).
 */
export default function MiniMap({ progress, current, onGo }) {
  const { t } = useT();
  const names = t('homyeight.walk.stops');
  const here = useRef(null);
  const cone = useRef(null);
  const walked = useRef(null);
  const points = useMemo(() => pathPolyline(0.25).map(([x, z]) => `${x.toFixed(2)},${z.toFixed(2)}`).join(' '), []);
  const stops = useMemo(() => stopPositions(), []);

  useEffect(() => {
    const r = {};
    const apply = (p) => {
      routeAt(p, { shift: false }, r);
      here.current?.setAttribute('transform', `translate(${r.position[0].toFixed(3)} ${r.position[2].toFixed(3)})`);
      if (cone.current) {
        cone.current.setAttribute('transform', `rotate(${r.heading.toFixed(1)})`);
        cone.current.style.opacity = String(1 - Math.min(1, r.rise * 3));
      }
      if (walked.current) walked.current.style.strokeDashoffset = String(1 - r.walked);
    };
    apply(progress.current);
    return progress.subscribe(apply);
  }, [progress]);

  return (
    <nav className="mmap" aria-label={t('homyeight.walk.mapLabel')}>
      <div className="mmap__plan">
        <Picture id="maxone/layout" sizes="220px" alt="" />
        <svg className="mmap__svg" viewBox={`0 0 ${PLAN.w} ${PLAN.h}`} preserveAspectRatio="none" aria-hidden="true">
          <polyline className="mmap__path" points={points} />
          <polyline ref={walked} className="mmap__walked" points={points} pathLength="1" />
          {stops.map((s) => (
            <circle key={s.index} className="mmap__stop" cx={s.x} cy={s.z} r="0.3" data-on={s.index <= current} />
          ))}
          <g ref={here}>
            {/* compass heading: 0° looks north, which is up on the plan */}
            <path ref={cone} className="mmap__cone" d="M0 0 L-1.7 -3.2 A3.6 3.6 0 0 1 1.7 -3.2 Z" />
            <circle className="mmap__dot" r="0.62" />
          </g>
        </svg>
      </div>
      <ol className="mmap__stops">
        {names.map((name, i) => (
          <li key={name}>
            <button type="button" aria-label={t('homyeight.walk.goTo', { n: i + 1, name })} aria-current={current === i ? 'step' : undefined} onClick={() => onGo(i)}>
              {i + 1}
            </button>
          </li>
        ))}
      </ol>
      <p className="mmap__name" aria-live="polite">
        {names[current]}
      </p>
    </nav>
  );
}

// "Step inside": a scroll-driven walk through the Maxone lobby and dining room (docs/04 §4, docs/06 §3).
//
// Three modes
//   3d        the procedural room (src/three/maxone/MaxoneScene.jsx) with the real renders as cards at each stop
//   fallback  "fallback B": the same pinned route told with the renders themselves, full-bleed, with a slow
//             Ken Burns move in the direction of travel (low tier, no WebGL, a failed scene, or ?maxone=fallback)
//   static    reduced motion: no pin, the stops as a calm vertical sequence
// The route, the stops and the card timing all come from src/three/maxone/route.js, so the camera, the
// cards and the mini-map can never drift apart.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../i18n/useT.js';
import { createProgress, clamp01, span } from '../../lib/scroll/progress.js';
import { scrollToTarget } from '../../lib/scroll/lenis.js';
import { registry } from '../../lib/scroll/triggers.js';
import { useTier } from '../../lib/device/tier.js';
import { hasWebGL } from '../../lib/device/webgl.js';
import { useReducedMotion } from '../../lib/device/useReducedMotion.js';
import { useInViewClass } from '../../lib/scroll/useDraw.js';
import { query } from '../../lib/storage.js';
import PinnedScene from '../../components/layout/PinnedScene.jsx';
import SceneMount from '../../components/media/SceneMount.jsx';
import DepthImage from '../../components/media/DepthImage.jsx';
import { Picture } from '../../components/media/Img.jsx';
import Caption from '../../components/ui/Caption.jsx';
import { ArrowDown } from '../../components/ui/Icons.jsx';
import { STOPS, CARDS, cardStates, routeAt } from '../../three/maxone/route.js';
import MiniMap from './MiniMap.jsx';
import StopCard from './StopCard.jsx';
import './Walkthrough.css';

const sceneModules = import.meta.glob('../../three/maxone/MaxoneScene.jsx');
const loadScene = sceneModules['../../three/maxone/MaxoneScene.jsx'] ?? null;

// Flipped to true once the 3D room has passed its side-by-side comparison with the renders (docs/06 §3.12).
// Until then every visitor gets the render-led walkthrough; `?maxone=3d` shows the room for review.
const SCENE_READY = false;

// Fallback B: which render fills the stage over which part of the scroll, and how it drifts.
// s0 → s1 is the scale, (dx, dy) the pan in percent, chosen to follow the direction of travel.
const SHOTS = [
  { id: 'maxone/1', a: 0.0, b: 0.275, s0: 1.02, s1: 1.14, dx: -2, dy: 0 }, // arriving, then the welcome
  { id: 'maxone/2', a: 0.275, b: 0.43, s0: 1.04, s1: 1.14, dx: 2, dy: 0 }, // into the dining hall
  { id: 'maxone/5', a: 0.43, b: 0.53, s0: 1.1, s1: 1.1, dx: 5, dy: 0 }, // along the buffet
  { id: 'maxone/3', a: 0.53, b: 0.605, s0: 1.1, s1: 1.1, dx: -5, dy: 0 }, // looking back at the bar
  { id: 'maxone/7', a: 0.605, b: 0.74, s0: 1.1, s1: 1.1, dx: 0, dy: 6 }, // looking up
  { id: 'maxone/6', a: 0.74, b: 0.87, s0: 1.03, s1: 1.13, dx: 0, dy: 0 }, // toward the windows
  { id: 'maxone/4', a: 0.87, b: 1.0, s0: 1.14, s1: 1.0, dx: 0, dy: -2 }, // stepping back to see the whole floor
];
const FADE = 0.028;

function useMode(failed) {
  const reduced = useReducedMotion();
  const tier = useTier();
  return useMemo(() => {
    if (reduced) return 'static';
    const forced = query('maxone');
    if (forced === 'fallback' || failed || !loadScene || !hasWebGL()) return 'fallback';
    if (forced === '3d') return '3d';
    return SCENE_READY && tier.maxone3d ? '3d' : 'fallback';
  }, [reduced, tier, failed]);
}

/** Reduced motion: the stops in order, everything visible. */
function StaticWalk() {
  const { t } = useT();
  const names = t('homyeight.walk.stops');
  const ref = useInViewClass();
  return (
    <div className="walk walk--static" ref={ref}>
      <div className="wrap">
        <h3 className="t-h1 walk__title">{t('homyeight.walk.title')}</h3>
        <ol className="walk__list">
          {CARDS.map((card, i) => (
            <li key={card.stop} className={`walk__item ${i % 2 ? 'walk__item--alt' : ''}`}>
              <p className="t-eyebrow muted nums" aria-hidden="true">
                {card.stop + 1} / {names.length}
              </p>
              <h4 className="t-h2 walk__item-name">{names[card.stop]}</h4>
              <div className={`walk__item-media ${card.ids.length > 1 ? 'walk__item-media--pair' : ''}`}>
                {card.ids.map((id) => (
                  <figure key={id} className="fig">
                    <Picture id={id} sizes="(min-width: 821px) 60vw, 100vw" />
                    <Caption id={id} />
                  </figure>
                ))}
              </div>
            </li>
          ))}
        </ol>
        <figure className="fig walk__planfig">
          <Picture id="maxone/layout" sizes="(min-width: 821px) 60vw, 100vw" />
        </figure>
      </div>
    </div>
  );
}

export default function Walkthrough() {
  const { t } = useT();
  const [failed, setFailed] = useState(false);
  const mode = useMode(failed);
  const progress = useMemo(() => createProgress(0), []);
  const [stop, setStop] = useState(0);
  const blockRef = useRef(null);
  const cardRefs = useRef([]);
  const shotRefs = useRef([]);
  const hintRef = useRef(null);
  const planRef = useRef(null);
  const names = t('homyeight.walk.stops');

  // One subscription drives every scroll-linked DOM detail. No React state except the stop number.
  useEffect(() => {
    if (mode === 'static') return undefined;
    const r = {};
    const apply = (p) => {
      const states = cardStates(p);
      states.forEach((s, i) => {
        const el = cardRefs.current[i];
        if (!el) return;
        el.style.setProperty('--in', s.presence.toFixed(3));
        el.style.setProperty('--mix', s.mix.toFixed(3));
        const off = s.presence <= 0.001 ? 'true' : 'false';
        if (el.dataset.depthOff !== off) el.dataset.depthOff = off; // pauses the depth view while the card is away
        el.dataset.second = s.mix > 0.5 ? 'true' : 'false';
      });
      SHOTS.forEach((shot, i) => {
        const el = shotRefs.current[i];
        if (!el) return;
        const o = i === 0 ? 1 : clamp01((p - (shot.a - FADE / 2)) / FADE); // each shot fades in over the one below
        const gone = SHOTS[i + 1] && p > SHOTS[i + 1].a + FADE; // fully covered: stop painting it
        el.style.setProperty('--o', gone ? '0' : o.toFixed(3));
        el.style.setProperty('--k', span(p, shot.a - FADE, shot.b + FADE).toFixed(4));
      });
      routeAt(p, { shift: false }, r);
      setStop((prev) => (prev === r.stopIndex ? prev : r.stopIndex));
      if (hintRef.current) hintRef.current.style.opacity = String(1 - clamp01((p - 0.012) / 0.03));
      if (planRef.current) planRef.current.style.setProperty('--in', r.plan.toFixed(3));
    };
    apply(progress.current);
    return progress.subscribe(apply);
  }, [progress, mode]);

  const yAt = (p) => {
    const tr = registry.triggers.homyeight;
    return tr ? tr.start + (tr.end - tr.start) * p : null;
  };
  const go = useCallback((i) => {
    const y = yAt(STOPS[i].at);
    if (y !== null) scrollToTarget(y);
  }, []);
  const skip = (e) => {
    e.preventDefault();
    const el = blockRef.current;
    if (!el) return;
    const bottom = el.getBoundingClientRect().bottom + window.scrollY;
    scrollToTarget(bottom - 80, { focus: '#walk-after' });
  };

  if (mode === 'static') return <StaticWalk />;

  return (
    <div className="walk" data-mode={mode} ref={blockRef}>
      <div className="wrap walk__head">
        <h3 className="t-h1 walk__title">{t('homyeight.walk.title')}</h3>
        <p className="walk__lede">
          {t('homyeight.walk.hint')}
          <ArrowDown />
        </p>
      </div>

      <PinnedScene id="homyeight" lengthVh={700} mobileLengthVh={560} progress={progress} className="walk__pin">
        <a className="walk__skip" href="#behomy" onClick={skip}>
          {t('homyeight.walk.skip')}
          <ArrowDown />
        </a>

        {mode === '3d' ? (
          <SceneMount load={loadScene} sceneProps={{ progress }} label={t('homyeight.walk.sceneAlt')} onFail={() => setFailed(true)} className="walk__scene" />
        ) : (
          <div className="walk__shots" role="img" aria-label={t('homyeight.walk.sceneAlt')}>
            {SHOTS.map((shot, i) => (
              <div
                key={shot.id}
                ref={(el) => (shotRefs.current[i] = el)}
                className="walk__shot"
                style={{ '--s0': shot.s0, '--s1': shot.s1, '--dx': shot.dx, '--dy': shot.dy, '--o': i === 0 ? 1 : 0, '--k': 0 }}
              >
                <Picture id={shot.id} sizes="100vw" alt="" className="walk__shot-pic" priority={i < 2} />
              </div>
            ))}
          </div>
        )}

        {CARDS.map((card, i) => (
          <StopCard key={card.stop} ref={(el) => (cardRefs.current[i] = el)} card={card} name={names[card.stop]} variant={mode === '3d' ? 'image' : 'label'} />
        ))}

        {mode === 'fallback' ? (
          // In the 3D room the top view dissolves into the plan inside the canvas. Here the plan arrives as a sheet.
          <figure ref={planRef} className="walk__plan">
            <Picture id="maxone/layout" sizes="(max-aspect-ratio: 85/100) 90vw, 42vw" />
          </figure>
        ) : null}

        <p ref={hintRef} className="walk__hint" aria-hidden="true">
          {t('homyeight.walk.hint')}
          <ArrowDown />
        </p>

        <MiniMap progress={progress} current={stop} onGo={go} />
      </PinnedScene>
      <span id="walk-after" tabIndex={-1} className="sr-only" />
    </div>
  );
}

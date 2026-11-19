// Beyond stays, part 1: the padel hall assembling in three stages (docs/04 §7, docs/06 §4).
// Live: a pinned scene, text on the left, the clay model on the right; each stage resolves into its render.
// Static (reduced motion, no WebGL, the low tier, or the scene failing): the three renders in sequence
// with the same text, nothing pinned (docs/06 §4.6).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../i18n/useT.js';
import { Picture } from '../../components/media/Img.jsx';
import Caption from '../../components/ui/Caption.jsx';
import { ArrowDown } from '../../components/ui/Icons.jsx';
import PinnedScene from '../../components/layout/PinnedScene.jsx';
import SceneMount, { useSceneMode } from '../../components/media/SceneMount.jsx';
import { createProgress } from '../../lib/scroll/progress.js';
import { scrollToTarget } from '../../lib/scroll/lenis.js';
import { useTier } from '../../lib/device/tier.js';
import { REVEALS, TEXT_AT, SLAB, stageAt } from '../../three/padel/timeline.js';
import './PadelSection.css';

const STAGES = [0, 1, 2];
const renderId = (i) => `padel-clean/padel-${i + 1}`;
const POSTERS = STAGES.map((i) => `/media/posters/padel-${i + 1}.webp`);
const loadScene = () => import('../../three/padel/PadelScene.jsx');

/** The three cleaned renders, one after another, each beside its sentence. */
function PadelStatic() {
  const { t } = useT();
  return (
    <div className="padel padel--static">
      <ol className="wrap padel-steps">
        {STAGES.map((i) => (
          <li key={i} className="padel-step grid12">
            <div className="padel-step__text">
              <p className="t-eyebrow muted nums" aria-hidden="true">
                {i + 1} / {STAGES.length}
              </p>
              <p className="t-h2 padel-step__line">{t(`beyond.padel.stages.${i}`)}</p>
            </div>
            <figure className="padel-step__fig">
              <Picture id={renderId(i)} sizes="(min-width: 821px) 60vw, 92vw" imgClassName="padel-step__img" />
              <div className="padel-step__meta">
                <Caption id={renderId(i)} />
                <p className="t-small muted padel-step__tag">{t('beyond.padel.tag')}</p>
              </div>
            </figure>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The pinned scene. Text and credits are real DOM text, scrubbed by the same scroll as the model. */
function PadelLive({ onFail }) {
  const { t } = useT();
  // The ref sits inside PinnedScene: its timeline is built in a layout effect, before an outer ref exists.
  const text = useRef(null);
  const progress = useMemo(() => createProgress(0), []);
  const sceneProps = useMemo(() => ({ progress }), [progress]);

  const timeline = useCallback((tl) => {
    const q = (sel) => text.current.querySelector(sel);
    const swap = 0.02;
    for (let i = 1; i < STAGES.length; i++) {
      tl.to(q(`.padel-live__stage--${i - 1}`), { opacity: 0, y: -14, duration: swap }, TEXT_AT[i] - swap);
      tl.fromTo(q(`.padel-live__stage--${i}`), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: swap }, TEXT_AT[i]);
    }
    REVEALS.forEach((r, i) => {
      const credit = q(`.padel-live__credit--${i}`);
      tl.fromTo(credit, { opacity: 0 }, { opacity: 1, duration: 0.02 }, r.in[0] + 0.015);
      if (r.out) tl.to(credit, { opacity: 0, duration: 0.015 }, r.out[0]);
    });
  }, []);

  const onSkip = useCallback((event) => {
    event.preventDefault();
    scrollToTarget('#padel-end', { offset: 0, focus: '#padel-end' });
  }, []);

  // A poster only when the reader lands mid-scene (a reload, a deep link): at the start the model
  // itself is still an empty plot, and a finished poster would flash before it.
  const [posterStage, setPosterStage] = useState(-1);
  useEffect(() => {
    const pick = (p) => setPosterStage(p > SLAB[1] ? stageAt(p) : -1);
    pick(progress.current);
    return progress.subscribe(pick);
  }, [progress]);
  const poster = posterStage < 0 ? null : <img src={POSTERS[posterStage]} alt="" decoding="async" />;

  return (
    <div className="padel padel--live">
      <PinnedScene id="beyond" lengthVh={360} progress={progress} timeline={timeline} className="padel-live">
        <div className="padel-live__scene">
          <SceneMount load={loadScene} sceneProps={sceneProps} label={t('beyond.padel.sceneAlt')} onFail={onFail} poster={poster} />
        </div>
        <div className="wrap padel-live__text" ref={text}>
          <ol className="padel-live__stages">
            {STAGES.map((i) => (
              <li key={i} className={`padel-live__stage padel-live__stage--${i}`}>
                <p className="t-eyebrow muted nums" aria-hidden="true">
                  {i + 1} / {STAGES.length}
                </p>
                <p className="t-h2 padel-live__line">{t(`beyond.padel.stages.${i}`)}</p>
              </li>
            ))}
          </ol>
          <div className="padel-live__credits">
            {STAGES.map((i) => (
              <figure key={i} className={`padel-live__credit padel-live__credit--${i}`}>
                <p className="t-small muted">{t('beyond.padel.tag')}</p>
                <Caption id={renderId(i)} />
              </figure>
            ))}
          </div>
        </div>
        <a className="scene-skip padel-live__skip" href="#padel-end" onClick={onSkip}>
          {t('beyond.padel.skip')}
          <ArrowDown />
        </a>
      </PinnedScene>
      <div id="padel-end" tabIndex={-1} />
    </div>
  );
}

export default function PadelSection() {
  const mode = useSceneMode();
  const tier = useTier();
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  const live = mode === 'live' && tier.name !== 'low' && !failed;
  return live ? <PadelLive onFail={onFail} /> : <PadelStatic />;
}

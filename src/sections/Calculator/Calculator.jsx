import { useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/useT.js';
import { useCalc } from '../../lib/calc/store.ts';
import { hasWebGL } from '../../lib/device/webgl.js';
import { scrollToTarget, refreshTriggers } from '../../lib/scroll/lenis.js';
import { registry } from '../../lib/scroll/triggers.js';
import { fmtArea, fmtNum, fmtYears } from '../../i18n/format.js';
import Heading from '../../components/ui/Heading.jsx';
import SceneMount from '../../components/media/SceneMount.jsx';
import { Reset } from '../../components/ui/Icons.jsx';
import { RollingArea, SplitBar } from './parts.jsx';
import { useResults, floorsText, fitsText, answerText } from './useResults.js';
import Step1 from './Step1.jsx';
import Step2 from './Step2.jsx';
import Step3 from './Step3.jsx';
import Fallback2D from './Fallback2D.jsx';
import '../sections.css';
import './Calculator.css';

// The live 3D is a separate lazy chunk (no three.js in the first load). If it is missing or fails,
// the SVG plan takes over: the numbers never depend on the 3D.
const sceneModules = import.meta.glob('../../three/calc/CalcScene.jsx');
const loadScene = sceneModules['../../three/calc/CalcScene.jsx'] ?? null;

const STEPS = [1, 2, 3];

// QA hook: window.__homyvest.calc is the calculator store (used by the Playwright specs and screenshots).
registry.calc = useCalc;

/** The land check: three steps, one shared land, results live as you type. */
export default function Calculator() {
  const { t, lang } = useT();
  const results = useResults();
  const { r, res, ranking, chk } = results;
  const step = useCalc((s) => s.ui.step);
  const setStep = useCalc((s) => s.setStep);
  const selected = useCalc((s) => s.ui.selectedIdea);
  const reset = useCalc((s) => s.reset);
  const [failed, setFailed] = useState(false);
  const tabsRef = useRef(null);
  const idea = step === 2 ? (selected ?? ranking?.fastest?.key ?? null) : null;
  const use3d = Boolean(loadScene) && hasWebGL() && !failed;

  const goStep = (n) => {
    setStep(n);
    // bring the top of the workspace back into view when the step changes from further down
    const top = tabsRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) scrollToTarget(tabsRef.current, { offset: -8 });
    refreshTriggers();
  };

  const onTabKey = (e) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = ((step - 1 + dir + 3) % 3) + 1;
    setStep(next);
    tabsRef.current?.querySelector(`#calc-tab-${next}`)?.focus();
  };

  // ---- text alternative for the 3D, regenerated from the same numbers ----
  let alt = t('calc.scene.alt.empty');
  if (r) {
    const parts = [t('calc.scene.alt.land', { P: fmtNum(r.P, lang, Number.isInteger(r.P) ? 0 : 1), L: fmtNum(r.L, lang, Number.isInteger(r.L) ? 0 : 1) })];
    if (step === 2 && idea && res) {
      parts.push(t('calc.scene.alt.idea', { name: t(`calc.s2.names.${idea}`), fits: fitsText(idea, res[idea], t, lang), built: fmtArea(res[idea].built, lang) }));
    } else if (step === 3 && chk) {
      parts.push(t('calc.scene.alt.existing', { fp: fmtArea(chk.fp, lang), tfa: fmtArea(chk.tfa, lang), answer: answerText(chk, t, lang) }));
    } else {
      parts.push(t('calc.scene.alt.max', { fp: fmtArea(r.fp, lang), floors: floorsText(r, t, lang), floorArea: fmtArea(r.floorArea, lang) }));
    }
    parts.push(t('calc.scene.alt.green', { green: fmtArea(r.greenMin, lang), cars: fmtNum(r.cars, lang) }));
    alt = parts.join(' ');
  }

  // ---- polite live region, debounced so screen readers aren't flooded while typing ----
  const [live, setLive] = useState('');
  const headline = r ? t('calc.r.headline', { floorArea: fmtArea(r.floorArea, lang) }) : t('calc.w.empty');
  const liveText =
    step === 1
      ? `${headline} ${r ? floorsText(r, t, lang) : ''}`
      : step === 2
        ? idea && res
          ? `${t(`calc.s2.names.${idea}`)}: ${fitsText(idea, res[idea], t, lang)}${res[idea].payback !== null ? `, ${fmtYears(res[idea].payback, lang)}` : ''}`
          : t('calc.s2.sum.noLand')
        : answerText(chk, t, lang);
  useEffect(() => {
    const id = window.setTimeout(() => setLive(liveText), 400);
    return () => window.clearTimeout(id);
  }, [liveText]);

  const [pre, post] = t('calc.r.headline').split('{floorArea}');
  const fallback = <Fallback2D results={results} step={step} idea={idea} />;

  return (
    <section id="calculator" className="calc" aria-labelledby="calc-title" data-step={step}>
      <div className="wrap calc__head grid12">
        <div className="calc__headline sec-head">
          <p className="t-eyebrow label-line">{t('calc.eyebrow')}</p>
          <Heading as="h2" id="calc-title" className="t-display calc__title">
            {t('calc.title')}
          </Heading>
        </div>
        <div className="calc__lede">
          <p className="t-lead ink-2">{t('calc.body')}</p>
          <p className="t-small muted">{t('calc.note')}</p>
        </div>
      </div>

      <div className="wrap calc__work">
        <div className="calc__tabs" role="tablist" aria-label={t('calc.stepsLabel')} ref={tabsRef} onKeyDown={onTabKey}>
          {STEPS.map((n) => (
            <button
              key={n}
              type="button"
              role="tab"
              id={`calc-tab-${n}`}
              className="calc__tab"
              aria-selected={step === n}
              aria-controls="calc-panel"
              tabIndex={step === n ? 0 : -1}
              onClick={() => setStep(n)}
            >
              <span className="calc__tab-n nums">{n}</span>
              <span className="calc__tab-long">{t('calc.tabs')[n - 1]}</span>
              <span className="calc__tab-short">{t('calc.tabsShort')[n - 1]}</span>
            </button>
          ))}
        </div>

        <div className="calc__right">
          <div className="calc__canvas" data-3d={use3d}>
            {use3d ? (
              <SceneMount load={loadScene} poster={fallback} onFail={() => setFailed(true)} />
            ) : (
              <div className="calc__fallback" data-fallback="2d">
                {fallback}
              </div>
            )}
            <p className="sr-only" data-scene-alt>
              {alt}
            </p>
          </div>

          <div className="calc__result" data-result={step}>
            {step === 1 ? (
              r ? (
                <>
                  <p className="calc__big">
                    <span className="calc__big-pre">{pre.trim()}</span>
                    <RollingArea value={r.floorArea} className="t-stat calc__big-n" />
                    <span className="calc__big-post">{post.trim()}</span>
                  </p>
                  <p className="calc__floors">{floorsText(r, t, lang)}</p>
                  <SplitBar r={r} />
                </>
              ) : (
                <p className="t-h2 calc__answer">{t('calc.w.empty')}</p>
              )
            ) : null}
            {step === 2 ? (
              idea && res ? (
                <>
                  <p className="t-eyebrow muted">{t('calc.s2.showing')}</p>
                  <p className="t-h1 calc__idea-name">{t(`calc.s2.names.${idea}`)}</p>
                  <p className="calc__floors nums">
                    {fitsText(idea, res[idea], t, lang)}
                    {res[idea].payback !== null ? ` · ${t('calc.s2.rows.payback').toLowerCase()} ${fmtYears(res[idea].payback, lang)}` : ''}
                  </p>
                </>
              ) : (
                <p className="t-h2 calc__answer">{t('calc.s2.sum.noLand')}</p>
              )
            ) : null}
            {step === 3 ? (
              <p className="t-h2 calc__answer" data-answer>
                {answerText(chk, t, lang)}
              </p>
            ) : null}
          </div>
        </div>

        <div id="calc-panel" className="calc__panel" role="tabpanel" aria-labelledby={`calc-tab-${step}`} tabIndex={-1}>
          {step === 1 ? <Step1 results={results} goStep={goStep} /> : null}
          {step === 2 ? <Step2 results={results} goStep={goStep} /> : null}
          {step === 3 ? <Step3 results={results} goStep={goStep} /> : null}

          <div className="calc__foot">
            <button type="button" className="link calc__reset" onClick={reset}>
              <Reset />
              {t('calc.reset')}
            </button>
          </div>
        </div>
      </div>

      <div className="wrap">
        <p className="t-small muted calc__disclaimer">{t('calc.disclaimer')}</p>
      </div>
      <p className="sr-only" aria-live="polite" data-live>
        {live}
      </p>
    </section>
  );
}

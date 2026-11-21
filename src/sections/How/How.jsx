import { useT } from '../../i18n/useT.js';
import { useDraw, useInViewClass } from '../../lib/scroll/useDraw.js';
import Heading from '../../components/ui/Heading.jsx';
import { Picture } from '../../components/media/Img.jsx';
import '../sections.css';
import './How.css';

// One photo per step (U01_01 §2.3). The plan is the Maxone floor plan, cropped toward the dining area.
// Low-resolution sources are capped in CSS at half their pixel width, so they are never upscaled.
const STEPS = [
  { id: 'maxone/layout', className: 'how-step--plan' },
  { id: 'photos/step-design' },
  { id: 'photos/step-build' },
  { id: 'photos/step-operate' },
];

/** End-to-end: Plan · Design · Build · Operate, and who does each (the old "three names, one team"). */
export default function How() {
  const { t } = useT();
  const steps = t('how.steps');
  const line = useDraw({ start: 'top 80%', end: 'center 55%' });
  const reveal = useInViewClass();
  return (
    <section id="how" className="section how" aria-labelledby="how-title" ref={reveal}>
      <div className="wrap">
        <div className="how__head grid12">
          <div className="sec-head how__headline">
            <p className="t-eyebrow label-line">{t('how.eyebrow')}</p>
            <Heading as="h2" id="how-title" className="t-h1 how__title">
              {t('how.title')}
            </Heading>
          </div>
          <p className="t-lead ink-2 how__sub">{t('how.sub')}</p>
        </div>

        <ol className="how__steps" ref={line}>
          {STEPS.map((step, i) => {
            const copy = steps[i];
            return (
              <li key={step.id} className={`how-step ${step.className ?? ''}`} style={{ '--i': i }}>
                <figure className="how-step__media" data-reveal>
                  <Picture id={step.id} sizes="(min-width: 1024px) 22vw, (min-width: 560px) 44vw, 90vw" imgClassName="how-step__img" />
                </figure>
                <div className="how-step__rail" aria-hidden="true">
                  <span className="how-step__n nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className="how-step__line" />
                </div>
                <div className="how-step__text">
                  <h3 className="how-step__name">{copy.name}</h3>
                  <p className="how-step__body">{copy.body}</p>
                  <p className="how-step__by">{copy.by}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="how__closing">{t('how.closing')}</p>
      </div>
    </section>
  );
}

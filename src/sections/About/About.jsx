import { useT } from '../../i18n/useT.js';
import { useCalc } from '../../lib/calc/store.ts';
import { scrollToTarget } from '../../lib/scroll/lenis.js';
import { useInViewClass } from '../../lib/scroll/useDraw.js';
import Heading from '../../components/ui/Heading.jsx';
import DepthImage from '../../components/media/DepthImage.jsx';
import { ArrowDown, ArrowRight } from '../../components/ui/Icons.jsx';
import '../sections.css';
import './About.css';

/** Door A: an empty plot, staked out with a string line. A line drawing, not a render. */
function PlotDrawing() {
  return (
    <svg className="door__art" viewBox="0 0 400 240" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M40 150 200 70l160 80-160 80L40 150Z" />
      <path d="M40 150v-22M200 70V48M360 150v-22M200 230v-22" />
      <path d="M40 128 200 48l160 80-160 80L40 128Z" strokeDasharray="3 5" />
      <path d="M120 150v-9M132 156v-12M144 148v-8M210 132v-10M222 138v-13M236 131v-9M270 162v-10M282 168v-12M176 178v-10M188 184v-13M96 138v-7M300 146v-9" />
    </svg>
  );
}

/** Door B: a half-built frame of columns and beams. */
function FrameDrawing() {
  return (
    <svg className="door__art" viewBox="0 0 400 240" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M40 170 200 100l160 70-160 70L40 170Z" />
      <path d="M40 170V96M200 240v-74M360 170V96M200 100V26" />
      <path d="M40 133 200 203l160-70M40 133l160-70 160 70" />
      <path d="M40 96 200 166l160-70" />
      <path d="M40 96 200 26" strokeDasharray="3 5" />
      <path d="M200 26l160 70" strokeDasharray="3 5" />
      <path d="M120 135v70M280 135v70M120 61v74" />
      <path d="M280 61v74" strokeDasharray="3 5" />
    </svg>
  );
}

export default function About() {
  const { t } = useT();
  const setEntry = useCalc((s) => s.setEntry);
  const setStep = useCalc((s) => s.setStep);
  const ref = useInViewClass();

  // Both doors lead to the calculator's first step with the front-width field focused.
  const open = (e, entry) => {
    e.preventDefault();
    setEntry(entry);
    setStep(1, { silent: true });
    scrollToTarget('#calculator', { focus: '#calc-P' });
  };

  return (
    <section id="about" className="section about" aria-labelledby="about-title" ref={ref}>
      <div className="wrap">
        <div className="about__top grid12">
          <div className="about__head sec-head">
            <p className="t-eyebrow label-line">{t('about.eyebrow')}</p>
            <Heading as="h2" id="about-title" className="t-display about__title">
              {t('about.title')}
            </Heading>
          </div>
          <p className="t-lead about__body">{t('about.body')}</p>
          <figure className="about__detail fig">
            <DepthImage
              id="interiors/interior-6"
              sizes="(min-width: 821px) 30vw, 70vw"
              strength={0.8}
              className="depth--enter about__detail-img"
              data-reveal
            />
          </figure>
        </div>

        <div className="doors">
          <h3 className="t-h2 doors__title">{t('about.doorsTitle')}</h3>
          <div className="doors__grid">
            <a className="door" href="#calculator" data-door="land" onClick={(e) => open(e, 'land')}>
              <PlotDrawing />
              <span className="door__letter t-eyebrow" aria-hidden="true">
                A
              </span>
              <span className="door__title">{t('about.doorA.title')}</span>
              <span className="door__body">{t('about.doorA.body')}</span>
              <span className="door__cta">
                {t('about.doorA.cta')}
                <ArrowRight />
              </span>
            </a>
            <a className="door" href="#calculator" data-door="building" onClick={(e) => open(e, 'building')}>
              <FrameDrawing />
              <span className="door__letter t-eyebrow" aria-hidden="true">
                B
              </span>
              <span className="door__title">{t('about.doorB.title')}</span>
              <span className="door__body">{t('about.doorB.body')}</span>
              <span className="door__cta">
                {t('about.doorB.cta')}
                <ArrowRight />
              </span>
            </a>
          </div>
        </div>

        <div className="sec-bridge">
          <p className="bridge">{t('about.bridge')}</p>
          <ArrowDown />
        </div>
      </div>
    </section>
  );
}

import { useT } from '../../i18n/useT.js';
import { useDraw } from '../../lib/scroll/useDraw.js';
import Heading from '../../components/ui/Heading.jsx';
import DepthImage from '../../components/media/DepthImage.jsx';
import { WhatsAppButton, useWhatsApp } from '../../components/ui/Button.jsx';
import '../sections.css';
import './Next.css';

/** What happens next: six steps on a line that draws itself, then the closing invitation. */
export default function Next() {
  const { t } = useT();
  const steps = t('next.steps');
  const line = useDraw({ start: 'top 75%', end: 'bottom 60%' });
  const { href, hasResults } = useWhatsApp();
  return (
    <section id="next" className="next" aria-labelledby="next-title">
      <div className="section next__plan">
        <div className="wrap">
          <div className="sec-head">
            <p className="t-eyebrow label-line">{t('next.eyebrow')}</p>
            <Heading as="h2" id="next-title" className="t-h1 next__title">
              {t('next.title')}
            </Heading>
          </div>

          <ol className="steps" ref={line}>
            <span className="steps__line" aria-hidden="true" />
            {steps.map((step, i) => (
              <li key={step.title} className="step" style={{ '--i': i }}>
                <span className="step__n nums" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__body">{step.body}</p>
                <p className="step__who">{step.who}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* The dusk render returns, darkened: the page closes on the colour it opened with. */}
      <div className="closing">
        <DepthImage id="facades/best" sizes="100vw" alt="" className="closing__bg" />
        <div className="closing__scrim" aria-hidden="true" />
        <div className="wrap closing__in">
          <h3 className="t-display closing__title">{t('next.close.title')}</h3>
          <div className="closing__side">
            <p className="t-lead closing__body">{t('next.close.body')}</p>
            <WhatsAppButton label={t('wa.next')} variant="on-photo" className="closing__cta" />
            <p className="closing__phone nums">
              <a href={href} target="_blank" rel="noopener" data-wa className="link link--underlined">
                +62 821-1010-6088
              </a>
            </p>
            {hasResults ? <p className="t-small closing__note">{t('next.close.withResults')}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

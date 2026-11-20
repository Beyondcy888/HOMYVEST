// The hero story's text layer: five beats of copy, the slide labels, the closing stats and CTAs.
// Everything is real DOM text from the first paint; Story.jsx animates it on the pinned timeline.
import { useT } from '../../i18n/useT.js';
import { Button, WhatsAppButton } from '../../components/ui/Button.jsx';
import Stat from '../../components/ui/Stat.jsx';
import { ArrowDown } from '../../components/ui/Icons.jsx';

export default function StoryOverlay({ ref, earning, onSkip, onCalculator, onReveal }) {
  const { t } = useT();
  const labels = t('hero.b3.labels');
  return (
    <div ref={ref} className="story__ui">
      <div className="story__col">
        <div className="story__beat story__b1">
          <h1 id="story-title" className="story__title">
            {t('hero.b1.title')}
          </h1>
          <p className="story__body">{t('hero.b1.body')}</p>
          <p className="story__cue t-eyebrow" aria-hidden="true">
            <span>{t('hero.scrollCue')}</span>
            <ArrowDown />
          </p>
        </div>
        {['b2', 'b3', 'b4'].map((key) => (
          <div key={key} className={`story__beat story__${key}`}>
            <h2 className="story__title">{t(`hero.${key}.title`)}</h2>
            <p className="story__body">{t(`hero.${key}.body`)}</p>
            {key === 'b3' ? (
              // The four options, with a thin line showing which one the camera is on. Decorative:
              // the sentence above already names them. Kept beside the copy so it never sits on the model.
              <div className="story__labels" aria-hidden="true">
                <span className="story__track">
                  <span className="story__thumb" />
                </span>
                <ol>
                  {labels.map((label) => (
                    <li key={label} className="story__label t-eyebrow">
                      {label}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <a className="scene-skip story__skip" href="#about" onClick={onSkip}>
        {t('hero.skip')}
        <ArrowDown />
      </a>

      <div className="story__earn" onFocus={onReveal}>
        <h2 className="story__title story__title--earn">{t('hero.b5.title')}</h2>
        <div className="story__stats">
          <Stat stat={t('hero.b5.stat1')} start={earning} />
          <Stat stat={t('hero.b5.stat2')} start={earning} />
        </div>
        <div className="story__ctas">
          <Button variant="on-photo" href="#calculator" onClick={onCalculator}>
            {t('hero.b5.cta1')}
          </Button>
          <WhatsAppButton variant="ghost-on-photo" label={t('hero.b5.cta2')} />
        </div>
      </div>
    </div>
  );
}

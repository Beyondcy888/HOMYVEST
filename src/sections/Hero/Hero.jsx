// Temporary hero (U1). Replaced by the full hero + lead funnel in U4/U5.
import { useT } from '../../i18n/useT.js';

export default function Hero() {
  const { t } = useT();
  return (
    <section id="top" className="section" data-hero aria-labelledby="hero-title">
      <div className="wrap">
        <h1 id="hero-title" className="t-display">
          {t('hero.title1')} {t('hero.title2')}
        </h1>
        <p className="t-lead">{t('hero.body')}</p>
      </div>
    </section>
  );
}

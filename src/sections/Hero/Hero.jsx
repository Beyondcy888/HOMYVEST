import { useMemo } from 'react';
import { useT } from '../../i18n/useT.js';
import { genericWhatsAppHref } from '../../lib/leads/client.js';
import DepthImage from '../../components/media/DepthImage.jsx';
import PartnerLogo from '../../components/brand/PartnerLogo.jsx';
import { WhatsApp } from '../../components/ui/Icons.jsx';
import HeroPhone from '../../components/funnel/HeroPhone.jsx';
import './Hero.css';

/**
 * #top (U01_01 §2.1): within five seconds a visitor knows what we do and who is behind it, and can leave a
 * number. Left: partners, the promise (the page's only <h1>), the phone card and the free consultation.
 * Right: the lit building at dusk, with the occupancy figure.
 */
export default function Hero() {
  const { t, lang } = useT();
  const consultHref = useMemo(() => genericWhatsAppHref(lang), [lang]);
  return (
    <section id="top" className="hero" data-hero aria-labelledby="hero-title">
      <div className="hero__grid">
        <div className="hero__content">
          <div className="hero__inner">
            <p className="hero__partners">
              <span className="hero__partners-label">{t('hero.partner')}</span>
              <PartnerLogo brand="homyeight" height={22} paired className="hero__logo" />
              <span className="hero__sep" aria-hidden="true" />
              <PartnerLogo brand="behomy" height={22} paired className="hero__logo" />
            </p>
            <h1 id="hero-title" className="hero__title">
              <span className="hero__t1">{t('hero.title1')}</span> <span className="hero__t2">{t('hero.title2')}</span>
            </h1>
            <p className="hero__body">{t('hero.body')}</p>
            <HeroPhone />
            <p className="hero__consult">
              <span>{t('consult.label')}</span>
              <a className="hero__wa link" href={consultHref} target="_blank" rel="noopener" data-wa>
                <WhatsApp />
                <span className="nums">{t('consult.number')}</span>
                <span className="sr-only"> ({t('wa.newTab')})</span>
              </a>
            </p>
          </div>
        </div>
        <figure className="hero__photo">
          <DepthImage id="facades/best" priority strength={1.2} sizes="(min-width: 1024px) 58vw, (min-width: 768px) 45vw, (orientation: landscape) and (max-height: 500px) 45vw, 100vw" className="hero__img" />
          <p className="hero__chip">
            {t('hero.chip')}
            <sup className="fn">
              <a href="#note-1" aria-label={`${t('notes.label')} 1`}>
                1
              </a>
            </sup>
          </p>
        </figure>
      </div>
    </section>
  );
}

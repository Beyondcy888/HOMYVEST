import { useT } from '../../i18n/useT.js';
import { scrollToTarget } from '../../lib/scroll/lenis.js';
import DepthImage from '../../components/media/DepthImage.jsx';
import PartnerLogo from '../../components/brand/PartnerLogo.jsx';
import Heading from '../../components/ui/Heading.jsx';
import { ArrowDown } from '../../components/ui/Icons.jsx';

/**
 * The Behomy section opens on a full-bleed Behomy room (U01_01 §2.4a): the on-dark Behomy logo, then the
 * promise, over a scrim that keeps the type legible. "See how it works" goes to the hybrid diagram.
 */
export default function BehomyHero() {
  const { t } = useT();
  const more = (e) => {
    e.preventDefault();
    scrollToTarget('#behomy-hybrid');
  };
  return (
    <div className="bh-hero">
      <DepthImage id="photos/behomy-hero" sizes="100vw" strength={1} alt={t('alt.photos/behomy-hero')} className="bh-hero__img" />
      <div className="bh-hero__scrim" aria-hidden="true" />
      <div className="wrap bh-hero__in">
        <div className="bh-hero__text">
          <PartnerLogo brand="behomy" tone="dark" height={40} className="bh-hero__logo" />
          <p className="t-eyebrow label-line bh-hero__eyebrow">{t('behomy.hero.eyebrow')}</p>
          <Heading as="h2" id="behomy-title" className="t-h1 bh-hero__title">
            {t('behomy.hero.title')}
          </Heading>
          <p className="t-lead bh-hero__body">{t('behomy.hero.body')}</p>
          <a className="link bh-hero__more" href="#behomy-hybrid" onClick={more}>
            {t('behomy.hero.more')}
            <ArrowDown />
          </a>
        </div>
      </div>
    </div>
  );
}

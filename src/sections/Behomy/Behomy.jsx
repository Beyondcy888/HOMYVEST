import { useT } from '../../i18n/useT.js';
import { useInViewClass } from '../../lib/scroll/useDraw.js';
import Heading from '../../components/ui/Heading.jsx';
import Stat from '../../components/ui/Stat.jsx';
import Caption from '../../components/ui/Caption.jsx';
import DepthImage from '../../components/media/DepthImage.jsx';
import { Picture } from '../../components/media/Img.jsx';
import { ArrowDown } from '../../components/ui/Icons.jsx';
import HybridDiagram from './HybridDiagram.jsx';
import BehomyHero from './BehomyHero.jsx';
import BehomyPortfolio from './BehomyPortfolio.jsx';
import BeforeAfter from './BeforeAfter.jsx';
import '../sections.css';
import './Behomy.css';

/**
 * Operated by Behomy (U01_01 §2.4): the Behomy hero, then how the hybrid model works, the numbers, what Behomy
 * takes off the owner's hands, the places it runs today, buildings before and after, and the team.
 */
export default function Behomy() {
  const { t } = useT();
  const stats = t('behomy.stats');
  const handles = t('behomy.handles.items');
  const brands = t('behomy.brands');
  const reveal = useInViewClass();
  return (
    <section id="behomy" className="behomy" aria-labelledby="behomy-title" ref={reveal}>
      <BehomyHero />

      <div className="section behomy__main">
        <div className="wrap">
          <div className="behomy__head grid12">
            <Heading as="h3" className="t-h1 behomy__title behomy__headline">
              {t('behomy.title')}
            </Heading>
            <p className="t-lead behomy__body">{t('behomy.body')}</p>
          </div>

          <div id="behomy-hybrid" className="behomy__hybrid">
            <HybridDiagram />
          </div>

          <div className="behomy__stats">
            {stats.map((stat) => (
              <Stat key={stat.label} stat={stat} />
            ))}
          </div>
          <ol className="notes behomy__notes" aria-label={t('notes.label')}>
            {[1, 2, 3, 4].map((n) => (
              <li key={n} id={`note-${n}`}>
                <span className="nums">{n}</span>
                <span>{t(`notes.${n}`)}</span>
              </li>
            ))}
          </ol>

          <div className="behomy__handles grid12">
            <div className="behomy__handles-side">
              <h3 className="t-h2 behomy__handles-title">{t('behomy.handles.title')}</h3>
              <figure className="behomy__training fig" data-reveal>
                <Picture id="photos/staff-training" sizes="(min-width: 1024px) 34vw, 100vw" className="behomy__training-img" />
                <Caption id="photos/staff-training" />
              </figure>
            </div>
            <ul className="behomy__handles-list">
              {handles.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong> {item.body}
                </li>
              ))}
            </ul>
          </div>

          <BehomyPortfolio />
          <BeforeAfter />

          <div className="behomy__foot">
            <ul className="behomy__brands" aria-label={t('behomy.brandsLabel')}>
              {brands.map((brand) => (
                <li key={brand}>{brand}</li>
              ))}
            </ul>
            <p className="behomy__uplift t-small">
              {t('behomy.uplift')}
              <sup className="fn">
                <a href="#note-3" aria-label={`${t('notes.label')} 3`}>
                  3
                </a>
              </sup>
            </p>
          </div>
        </div>
      </div>

      {/* A human close: the people who run it. */}
      <figure className="behomy__team">
        <DepthImage id="photos/behomy-team" sizes="100vw" className="behomy__team-img depth--enter" data-reveal />
        <Caption id="photos/behomy-team" className="behomy__team-cap" />
      </figure>

      <div className="wrap">
        <div className="sec-bridge behomy__bridge">
          <p className="bridge">{t('behomy.bridge')}</p>
          <ArrowDown />
        </div>
      </div>
    </section>
  );
}

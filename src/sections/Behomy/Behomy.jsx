import { useT } from '../../i18n/useT.js';
import Heading from '../../components/ui/Heading.jsx';
import Stat from '../../components/ui/Stat.jsx';
import { ArrowDown } from '../../components/ui/Icons.jsx';
import HybridDiagram from './HybridDiagram.jsx';
import '../sections.css';
import './Behomy.css';

export default function Behomy() {
  const { t } = useT();
  const stats = t('behomy.stats');
  const handles = t('behomy.handles.items');
  const brands = t('behomy.brands');
  return (
    <section id="behomy" className="section behomy" aria-labelledby="behomy-title">
      <div className="wrap">
        <div className="behomy__head grid12">
          <div className="behomy__headline sec-head">
            <p className="t-eyebrow label-line">{t('behomy.eyebrow')}</p>
            <Heading as="h2" id="behomy-title" className="t-h1 behomy__title">
              {t('behomy.title')}
            </Heading>
          </div>
          <p className="t-lead behomy__body">{t('behomy.body')}</p>
        </div>

        <HybridDiagram />

        <div className="behomy__stats">
          {stats.map((stat) => (
            <Stat key={stat.label} stat={stat} />
          ))}
        </div>

        <div className="behomy__handles grid12">
          <h3 className="t-h2 behomy__handles-title">{t('behomy.handles.title')}</h3>
          <ul className="behomy__handles-list">
            {handles.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong> {item.body}
              </li>
            ))}
          </ul>
        </div>

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

        <ol className="notes behomy__notes" aria-label={t('notes.label')}>
          {[1, 2, 3].map((n) => (
            <li key={n} id={`note-${n}`}>
              <span className="nums">{n}</span>
              <span>{t(`notes.${n}`)}</span>
            </li>
          ))}
        </ol>

        <div className="sec-bridge">
          <p className="bridge">{t('behomy.bridge')}</p>
          <ArrowDown />
        </div>
      </div>
    </section>
  );
}

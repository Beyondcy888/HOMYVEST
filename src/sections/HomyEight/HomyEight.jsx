import { useT } from '../../i18n/useT.js';
import { useInViewClass } from '../../lib/scroll/useDraw.js';
import Heading from '../../components/ui/Heading.jsx';
import Stat from '../../components/ui/Stat.jsx';
import DepthImage from '../../components/media/DepthImage.jsx';
import { ArrowDown } from '../../components/ui/Icons.jsx';
import '../sections.css';
import './HomyEight.css';

/**
 * Built by HomyEight. Part 1: who they are, with three facts. Part 2 (children): the Maxone walkthrough.
 */
export default function HomyEight({ children }) {
  const { t } = useT();
  const stats = t('homyeight.stats');
  const ref = useInViewClass();
  return (
    <section id="homyeight" className="homyeight" aria-labelledby="homyeight-title" ref={ref}>
      <div className="section homyeight__intro">
        <div className="wrap grid12 homyeight__grid">
          <div className="homyeight__text">
            <p className="t-eyebrow label-line">{t('homyeight.eyebrow')}</p>
            <Heading as="h2" id="homyeight-title" className="t-h1 homyeight__title">
              {t('homyeight.title')}
            </Heading>
            <p className="t-lead homyeight__body">{t('homyeight.body')}</p>
          </div>
          <figure className="homyeight__image fig">
            <DepthImage
              id="interiors/interior-3"
              sizes="(min-width: 821px) 38vw, 100vw"
              className="depth--enter homyeight__img"
              data-reveal
            />
          </figure>
          <div className="homyeight__stats">
            {stats.map((stat) => (
              <Stat key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </div>

      {children}

      <div className="wrap">
        <div className="sec-bridge homyeight__bridge">
          <p className="bridge">{t('homyeight.bridge')}</p>
          <ArrowDown />
        </div>
      </div>
    </section>
  );
}

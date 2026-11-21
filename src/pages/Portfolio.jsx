// The full portfolio (U01_04 §1): the story, Maxone, the padel hall, beyond stays, then a way back to the land.
// The scenes keep their choreography; only their scroll lengths (src/content/scroll-config.js) changed.
import { useT } from '../i18n/useT.js';
import Story from '../sections/Story/Story.jsx';
import Walkthrough from '../sections/HomyEight/Walkthrough.jsx';
import PadelSection from '../sections/Beyond/PadelSection.jsx';
import Beyond from '../sections/Beyond/Beyond.jsx';

export default function Portfolio() {
  const { t } = useT();
  return (
    <>
      <section id="pf-intro" className="section" data-hero aria-labelledby="pf-title">
        <div className="wrap">
          <p className="t-eyebrow label-line">{t('pf.eyebrow')}</p>
          <h1 id="pf-title" className="t-display">
            {t('pf.title')}
          </h1>
          <p className="t-lead">{t('pf.intro')}</p>
        </div>
      </section>
      <Story />
      <section id="maxone" aria-label={t('pf.index.1')}>
        <Walkthrough />
      </section>
      <section id="padel" aria-label={t('pf.index.2')}>
        <PadelSection />
      </section>
      <Beyond />
    </>
  );
}

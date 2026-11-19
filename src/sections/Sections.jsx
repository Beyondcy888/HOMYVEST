// The page, in order (docs/04). Each section answers the question the previous one raised.
import { useT } from '../i18n/useT.js';

// Temporary stand-ins while the sections are being built (M4). Each is replaced by its real component.
function Stub({ id, title }) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-title`} style={{ minHeight: '70vh' }}>
      <div className="wrap">
        <h2 id={`${id}-title`} className="t-h1">
          {title}
        </h2>
      </div>
    </section>
  );
}

export default function Sections() {
  const { t } = useT();
  return (
    <>
      <section id="story" className="section" aria-labelledby="story-title" style={{ minHeight: '100vh', display: 'grid', alignItems: 'center' }}>
        <div className="wrap">
          <h1 id="story-title" className="t-display">
            {t('hero.b1.title')}
          </h1>
        </div>
      </section>
      <Stub id="about" title={t('about.title')} />
      <Stub id="team" title={t('team.title')} />
      <Stub id="homyeight" title={t('homyeight.title')} />
      <Stub id="behomy" title={t('behomy.title')} />
      <Stub id="projects" title={t('projects.title')} />
      <Stub id="beyond" title={t('beyond.title')} />
      <Stub id="calculator" title={t('calc.title')} />
      <Stub id="next" title={t('next.title')} />
      <Stub id="faq" title={t('faq.title')} />
    </>
  );
}

import { useT } from '../../i18n/useT.js';
import Heading from '../../components/ui/Heading.jsx';
import '../sections.css';
import './About.css';

/** What is HOMYVEST? A short breather after the hero: the heading, one paragraph, one small line (U01_01 §2.2). */
export default function About() {
  const { t } = useT();
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="wrap grid12 about__grid">
        <Heading as="h2" id="about-title" className="t-h1 about__title">
          {t('about.title')}
        </Heading>
        <div className="about__text">
          <p className="t-lead about__body">{t('about.body')}</p>
          <p className="about__note">{t('about.note')}</p>
        </div>
      </div>
    </section>
  );
}

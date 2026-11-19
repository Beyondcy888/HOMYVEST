// The page, in order (docs/04). Each section answers the question the previous one raised:
// HOOK → PROMISE → PEOPLE → PROOF → POSSIBILITIES → PERSONAL → PLAN.
import { useT } from '../i18n/useT.js';
import About from './About/About.jsx';
import Team from './Team/Team.jsx';
import HomyEight from './HomyEight/HomyEight.jsx';
import Behomy from './Behomy/Behomy.jsx';

// Scene sections arrive from their own folders. While one is still being built it is simply absent
// and a plain stand-in keeps the page whole.
const optional = import.meta.glob(
  ['./Story/Story.jsx', './HomyEight/Walkthrough.jsx', './Beyond/PadelSection.jsx', './Projects/Projects.jsx', './Beyond/Beyond.jsx', './Calculator/Calculator.jsx', './Next/Next.jsx', './Faq/Faq.jsx'],
  { eager: true },
);
const pick = (path) => optional[path]?.default ?? null;

function Stub({ id, title, hero }) {
  const Tag = hero ? 'h1' : 'h2';
  return (
    <section id={id} className="section" aria-labelledby={`${id}-title`} style={{ minHeight: hero ? '100vh' : '60vh', display: 'grid', alignItems: 'center' }}>
      <div className="wrap">
        <Tag id={`${id}-title`} className={hero ? 't-display' : 't-h1'}>
          {title}
        </Tag>
      </div>
    </section>
  );
}

export default function Sections() {
  const { t } = useT();
  const Story = pick('./Story/Story.jsx');
  const Walkthrough = pick('./HomyEight/Walkthrough.jsx');
  const Projects = pick('./Projects/Projects.jsx');
  const Beyond = pick('./Beyond/Beyond.jsx');
  const PadelSection = pick('./Beyond/PadelSection.jsx');
  const Calculator = pick('./Calculator/Calculator.jsx');
  const Next = pick('./Next/Next.jsx');
  const Faq = pick('./Faq/Faq.jsx');
  return (
    <>
      {Story ? <Story /> : <Stub id="story" title={t('hero.b1.title')} hero />}
      <About />
      <Team />
      <HomyEight>{Walkthrough ? <Walkthrough /> : null}</HomyEight>
      <Behomy />
      {Projects ? <Projects /> : <Stub id="projects" title={t('projects.title')} />}
      {Beyond ? <Beyond>{PadelSection ? <PadelSection /> : null}</Beyond> : <Stub id="beyond" title={t('beyond.title')} />}
      {Calculator ? <Calculator /> : <Stub id="calculator" title={t('calc.title')} />}
      {Next ? <Next /> : <Stub id="next" title={t('next.title')} />}
      {Faq ? <Faq /> : <Stub id="faq" title={t('faq.title')} />}
    </>
  );
}

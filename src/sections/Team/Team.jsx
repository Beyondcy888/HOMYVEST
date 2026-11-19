import { useT } from '../../i18n/useT.js';
import { useDraw } from '../../lib/scroll/useDraw.js';
import Heading from '../../components/ui/Heading.jsx';
import '../sections.css';
import './Team.css';

const MEMBERS = ['homyvest', 'homyeight', 'behomy'];

/** Three names on one line that draws itself: finds the potential → builds it → runs it. */
export default function Team() {
  const { t } = useT();
  const chain = useDraw({ start: 'top 78%', end: 'top 30%' });
  return (
    <section id="team" className="section team" aria-labelledby="team-title">
      <div className="wrap">
        <Heading as="h2" id="team-title" className="t-h1 team__title">
          {t('team.title')}
        </Heading>

        <ol className="chain" ref={chain}>
          <span className="chain__line draw-x" aria-hidden="true" />
          {MEMBERS.map((key, i) => (
            <li key={key} className={`chain__item chain__item--${key}`} style={{ '--i': i }}>
              <span className="chain__node" aria-hidden="true" />
              <p className="chain__role t-eyebrow">{t(`team.${key}.role`)}</p>
              <h3 className="chain__name">{t(`team.${key}.name`)}</h3>
              <p className="chain__body">{t(`team.${key}.body`)}</p>
            </li>
          ))}
        </ol>

        <p className="t-h2 team__closing">{t('team.closing')}</p>
      </div>
    </section>
  );
}

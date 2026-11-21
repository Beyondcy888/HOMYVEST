// §0 of /portofolio/ (U01_04 §1): the page title, one line, an index of the four parts and a calm cue.
// Short on purpose (≤ 70svh): the first scene starts right below it. Marked data-hero: the floating
// WhatsApp button appears once the visitor is past it.
import { useT } from '../../i18n/useT.js';
import { Picture } from '../../components/media/Img.jsx';
import { ArrowDown } from '../../components/ui/Icons.jsx';
import { scrollToTarget } from '../../lib/scroll/lenis.js';
import { registry } from '../../lib/scroll/triggers.js';

/** The index: where each item goes, and its thumbnail (a scene poster, or a Beyond render). */
export const PARTS = [
  { id: 'story', poster: '/media/posters/hero-2.webp' },
  { id: 'maxone', poster: '/media/posters/maxone-1.webp' },
  { id: 'padel', poster: '/media/posters/padel-3.webp' },
  { id: 'beyond', image: 'others/athero-1' },
];

/** A pinned scene starts where its trigger starts; anything else (static modes, Beyond) at its section. */
export function goToPart(id) {
  const trig = registry.triggers[id];
  if (trig && id !== 'beyond') scrollToTarget(Math.ceil(trig.start) + 1);
  else scrollToTarget(`#${id}`);
}

export default function Intro() {
  const { t } = useT();
  const names = t('pf.index');
  const go = (e, id) => {
    e.preventDefault();
    goToPart(id);
    window.history.replaceState(null, '', `#${id}`);
  };
  return (
    <section id="intro" className="pf-intro" data-hero aria-labelledby="pf-title">
      <div className="wrap pf-intro__inner">
        <div className="pf-intro__head">
          <p className="t-eyebrow label-line">{t('pf.eyebrow')}</p>
          <h1 id="pf-title" className="pf-intro__title">
            {t('pf.title')}
          </h1>
          <p className="t-lead pf-intro__lead">{t('pf.intro')}</p>
        </div>
        <nav className="pf-index" aria-label={t('pf.indexLabel')}>
          <ol className="pf-index__list">
            {PARTS.map((part, i) => (
              <li key={part.id}>
                <a className="pf-index__item" href={`#${part.id}`} onClick={(e) => go(e, part.id)}>
                  <span className="pf-index__thumb" aria-hidden="true">
                    {part.image ? (
                      <Picture id={part.image} sizes="(min-width: 768px) 16vw, 72px" alt="" />
                    ) : (
                      <img src={part.poster} alt="" width="1600" height="1000" decoding="async" />
                    )}
                  </span>
                  <span className="pf-index__text">
                    <span className="pf-index__n nums" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="pf-index__name">{names[i]}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <p className="pf-intro__cue t-eyebrow" aria-hidden="true">
          <span>{t('pf.begin')}</span>
          <ArrowDown />
        </p>
      </div>
    </section>
  );
}

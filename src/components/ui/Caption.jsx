import { captions } from '../../content/projects.js';
import { useT } from '../../i18n/useT.js';
import './ui.css';

/** A caption value may be a plain string or one per language: { en: 'Lobby', id: 'Lobi' }. */
const pick = (value, lang) => (value && typeof value === 'object' ? (value[lang] ?? value.en ?? null) : value);

/**
 * Project caption in three voices: name (bold) · place (regular) · type and year (muted italic).
 * Until the owner fills in src/content/projects.js (or behomy.js), it shows a deliberate placeholder name and
 * place and carries data-placeholder="true" so QA can count what is left. A known type is shown even then.
 * `typeOnly` captions (e.g. a training photo) show just their type line.
 */
export default function Caption({ id, className = '', onPhoto = false }) {
  const { t, lang } = useT();
  const c = captions[id];
  const cls = `caption ${onPhoto ? 'caption--on-photo' : ''} ${className}`;
  if (c?.typeOnly) {
    return (
      <figcaption className={cls} data-caption-for={id}>
        <span className="caption__type">{pick(c.type, lang)}</span>
      </figcaption>
    );
  }
  const filled = Boolean(c?.name);
  const name = filled ? pick(c.name, lang) : t('projects.caption.name');
  const place = filled ? pick(c.place, lang) : (pick(c?.place, lang) ?? t('projects.caption.place'));
  const type = filled
    ? [pick(c.type, lang), pick(c.status, lang)].filter(Boolean).join(' · ')
    : (pick(c?.type, lang) ?? t('projects.caption.type'));
  return (
    <figcaption className={cls} data-placeholder={filled ? undefined : 'true'} data-caption-for={id}>
      <span className="caption__name">{name}</span>
      {place ? <span className="caption__place">{place}</span> : null}
      {type ? <span className="caption__type">{type}</span> : null}
    </figcaption>
  );
}

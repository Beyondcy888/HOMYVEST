import { captions } from '../../content/projects.js';
import { useT } from '../../i18n/useT.js';
import './ui.css';

/**
 * Project caption in three voices: name (bold) · place (regular) · type and year (muted italic).
 * Until the owner fills in src/content/projects.js, it shows a deliberate placeholder and carries
 * data-placeholder="true" so QA can count what is left.
 */
export default function Caption({ id, className = '', onPhoto = false }) {
  const { t } = useT();
  const c = captions[id];
  const filled = Boolean(c?.name);
  const name = filled ? c.name : t('projects.caption.name');
  const place = filled ? c.place : t('projects.caption.place');
  const type = filled ? [c.type, c.status].filter(Boolean).join(' · ') : t('projects.caption.type');
  return (
    <figcaption
      className={`caption ${onPhoto ? 'caption--on-photo' : ''} ${className}`}
      data-placeholder={filled ? undefined : 'true'}
      data-caption-for={id}
    >
      <span className="caption__name">{name}</span>
      {place ? <span className="caption__place">{place}</span> : null}
      {type ? <span className="caption__type">{type}</span> : null}
    </figcaption>
  );
}

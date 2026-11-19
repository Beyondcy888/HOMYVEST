// Beyond stays, part 1: the padel hall assembling in three stages (docs/04 §7, docs/06 §4).
// Live: a pinned scene, text on the left, the clay model on the right; each stage resolves into its render.
// Static (reduced motion, no WebGL, the low tier, or the scene failing): the three renders in sequence
// with the same text, nothing pinned (docs/06 §4.6).
import { useT } from '../../i18n/useT.js';
import { Picture } from '../../components/media/Img.jsx';
import Caption from '../../components/ui/Caption.jsx';
import './PadelSection.css';

const STAGES = [0, 1, 2];
const renderId = (i) => `padel-clean/padel-${i + 1}`;

/** The three cleaned renders, one after another, each beside its sentence. */
function PadelStatic() {
  const { t } = useT();
  return (
    <div className="padel padel--static">
      <ol className="wrap padel-steps">
        {STAGES.map((i) => (
          <li key={i} className="padel-step grid12">
            <div className="padel-step__text">
              <p className="t-eyebrow muted nums" aria-hidden="true">
                {i + 1} / {STAGES.length}
              </p>
              <p className="t-h2 padel-step__line">{t(`beyond.padel.stages.${i}`)}</p>
            </div>
            <figure className="padel-step__fig">
              <Picture id={renderId(i)} sizes="(min-width: 821px) 60vw, 92vw" imgClassName="padel-step__img" />
              <div className="padel-step__meta">
                <Caption id={renderId(i)} />
                <p className="t-small muted padel-step__tag">{t('beyond.padel.tag')}</p>
              </div>
            </figure>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function PadelSection() {
  return <PadelStatic />;
}

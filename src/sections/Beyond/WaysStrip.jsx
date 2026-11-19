import { useEffect, useMemo, useRef } from 'react';
import { useT } from '../../i18n/useT.js';
import { createProgress } from '../../lib/scroll/progress.js';
import { useMediaQuery, useReducedMotion } from '../../lib/device/useReducedMotion.js';
import PinnedScene from '../../components/layout/PinnedScene.jsx';
import DepthImage from '../../components/media/DepthImage.jsx';
import Caption from '../../components/ui/Caption.jsx';

// athero-1 has labels baked into the image, so it is not used (docs/08 §4).
const WAYS = [
  { key: 'soccer', lead: 'others/athero-3', more: ['others/athero-2', 'others/athero-4'] },
  { key: 'cafe', lead: 'cafe/cafe', more: [] },
  { key: 'office', lead: 'office/office-1', more: ['office/office-2', 'office/office-3'] },
];

function Panel({ way, index, total }) {
  const { t } = useT();
  return (
    <article className={`way ${way.more.length ? '' : 'way--single'}`} aria-labelledby={`way-${way.key}`}>
      <div className="way__text">
        <p className="t-eyebrow muted nums" aria-hidden="true">
          {index + 1} / {total}
        </p>
        <h3 id={`way-${way.key}`} className="way__title">
          {t(`beyond.ways.${way.key}.title`)}
        </h3>
        <p className="t-lead way__body">{t(`beyond.ways.${way.key}.body`)}</p>
      </div>
      <figure className="way__lead">
        <DepthImage id={way.lead} sizes="(min-width: 981px) 52vw, 86vw" className="way__lead-img" />
        <Caption id={way.lead} />
      </figure>
      {way.more.length ? (
        <div className="way__more">
          {way.more.map((id) => (
            <figure key={id} className="way__small">
              <DepthImage id={id} sizes="(min-width: 981px) 22vw, 42vw" strength={0.8} className="way__small-img" />
            </figure>
          ))}
        </div>
      ) : null}
    </article>
  );
}

/**
 * Three more ways to earn: mini soccer, café, office.
 * Desktop: the strip is pinned and travels sideways as you scroll. Touch and reduced motion: a
 * native horizontal swipe with snap points (no pin).
 */
export default function WaysStrip() {
  const { t } = useT();
  const desktop = useMediaQuery('(min-width: 981px) and (hover: hover)');
  const reduced = useReducedMotion();
  const trackRef = useRef(null);
  const progress = useMemo(() => createProgress(0), []);
  const pinned = desktop && !reduced;

  useEffect(() => {
    if (!pinned) return undefined;
    const apply = (p) => trackRef.current?.style.setProperty('--p', p.toFixed(4));
    apply(progress.current);
    return progress.subscribe(apply);
  }, [pinned, progress]);

  const track = (
    <div className="ways__track" ref={trackRef}>
      <div className="ways__intro">
        <h3 className="t-h2">{t('beyond.ways.label')}</h3>
      </div>
      {WAYS.map((way, i) => (
        <Panel key={way.key} way={way} index={i} total={WAYS.length} />
      ))}
    </div>
  );

  if (!pinned) {
    return (
      <div className="ways ways--swipe" role="region" aria-label={t('beyond.ways.label')} tabIndex={0}>
        {track}
      </div>
    );
  }
  return (
    <PinnedScene id="ways" lengthVh={260} progress={progress} className="ways ways--pinned">
      {track}
    </PinnedScene>
  );
}

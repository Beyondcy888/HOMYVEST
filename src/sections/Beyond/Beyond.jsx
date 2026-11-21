// Beyond stays on /portofolio/ (#beyond, U01_04 §5): mini soccer, a café and an office, in landscape only.
//
//   ≥ 1024 px  a horizontal strip, pinned while it slides (length: SCROLL.beyondPanel × panels). Each panel is
//              a 16:9 lead (about 80vw, capped by the screen height) with a row of 3:2 thumbnails under it,
//              and the group's name and sentence on a paper card at its left edge.
//   768–1023   no pin: the panels stacked, each lead 16:9 with a sideways-scrolling row of 3:2 thumbnails.
//   < 768      no pin: cards, a full-width 16:9 lead and swipeable 3:2 thumbnails (70vw, snapping).
// Reduced motion gets the stacked layout at every width. Every image box is landscape, object-fit: cover, and
// never wider than its source pixels. Any image opens the lightbox with its group's images.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../i18n/useT.js';
import { createProgress } from '../../lib/scroll/progress.js';
import { useMediaQuery, useReducedMotion } from '../../lib/device/useReducedMotion.js';
import PinnedScene from '../../components/layout/PinnedScene.jsx';
import DepthImage from '../../components/media/DepthImage.jsx';
import { Picture, media } from '../../components/media/Img.jsx';
import Lightbox from '../../components/media/Lightbox.jsx';
import Caption from '../../components/ui/Caption.jsx';
import { SCROLL } from '../../content/scroll-config.js';
import '../sections.css';
import './Beyond.css';

// athero-1 (the site overview) leads mini soccer: its built-in Indonesian labels read as a site plan.
export const GROUPS = [
  { key: 'soccer', ids: ['others/athero-1', 'others/athero-3', 'others/athero-2', 'others/athero-4'] },
  { key: 'cafe', ids: ['cafe/cafe'] },
  { key: 'office', ids: ['office/office-1', 'office/office-2', 'office/office-3'] },
];

/** CSS px an image may be shown at without upscaling (low-res sources: half their width, U01_05 §1). */
const maxCss = (id) => {
  const e = media(id);
  return e ? (e.lowRes ? Math.floor(e.width / 2) : e.width) : 9999;
};

function Panel({ group, index, total, onOpen, pinned }) {
  const { t } = useT();
  const [lead, ...more] = group.ids;
  const name = t(`beyond.ways.${group.key}.title`);
  const open = t('beyond.ways.open', { name });
  return (
    <article
      className={`bpanel ${more.length ? '' : 'bpanel--single'}`}
      data-group={group.key}
      aria-labelledby={`bpanel-${group.key}`}
      style={{ '--lead-max': `${maxCss(lead)}px` }}
    >
      <div className="bpanel__text">
        <p className="t-eyebrow muted nums bpanel__n" aria-hidden="true">
          {index + 1} / {total}
        </p>
        <h3 id={`bpanel-${group.key}`} className="bpanel__name">
          {name}
        </h3>
        <p className="bpanel__body">{t(`beyond.ways.${group.key}.body`)}</p>
      </div>
      <figure className="bpanel__lead">
        <button type="button" className="bpanel__open" onClick={() => onOpen(group, 0)} aria-label={`${open}: ${t(`alt.${lead}`)}`}>
          <DepthImage
            id={lead}
            strength={0.8}
            alt=""
            sizes={pinned ? 'min(80vw, 133svh)' : '(min-width: 768px) 92vw, 100vw'}
            className="bpanel__img"
            data-beyond-img
          />
        </button>
        <Caption id={lead} className="bpanel__caption" />
      </figure>
      {more.length ? (
        <ul className="bpanel__thumbs" aria-label={open}>
          {more.map((id, i) => (
            <li key={id} className="bpanel__thumb" style={{ '--thumb-max': `${maxCss(id)}px` }}>
              <button type="button" className="bpanel__open" onClick={() => onOpen(group, i + 1)}>
                <Picture id={id} sizes={pinned ? '24svh' : '(min-width: 768px) 36vw, 70vw'} className="bpanel__pic" data-beyond-img />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

/** The sliding strip (≥ 1024 px, motion allowed). The track and each card's parallax follow one progress value. */
function Strip({ onOpen }) {
  const progress = useMemo(() => createProgress(0), []);
  const trackRef = useRef(null);
  const geo = useRef({ travel: 0, view: 0, centres: [], texts: [] });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const apply = (p) => {
      const g = geo.current;
      const x = -g.travel * p;
      track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      // the cards drift a little slower than the pictures under them: up to 48 px either way
      for (let i = 0; i < g.texts.length; i++) {
        const d = Math.max(-1, Math.min(1, (g.centres[i] + x - g.view / 2) / g.view));
        g.texts[i].style.transform = `translate3d(${(d * -48).toFixed(1)}px, 0, 0)`;
      }
    };
    // Measured once per size change, never while scrolling.
    const measure = () => {
      const view = track.parentElement.clientWidth;
      const panels = [...track.querySelectorAll('.bpanel')];
      geo.current = {
        travel: Math.max(0, track.scrollWidth - view),
        view,
        centres: panels.map((el) => el.offsetLeft + el.offsetWidth / 2),
        texts: panels.map((el) => el.querySelector('.bpanel__text')),
      };
      apply(progress.current);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(track.parentElement);
    measure();
    const off = progress.subscribe(apply);
    return () => {
      ro.disconnect();
      off();
    };
  }, [progress]);

  return (
    <PinnedScene id="beyond" lengthVh={SCROLL.beyondPanel.desktop * GROUPS.length} progress={progress} className="bstrip">
      <div className="bstrip__view">
        <div ref={trackRef} className="bstrip__track">
          {GROUPS.map((group, i) => (
            <Panel key={group.key} group={group} index={i} total={GROUPS.length} onOpen={onOpen} pinned />
          ))}
        </div>
      </div>
    </PinnedScene>
  );
}

export default function Beyond() {
  const { t } = useT();
  const wide = useMediaQuery('(min-width: 1024px)');
  const reduced = useReducedMotion();
  const pinned = wide && !reduced;
  const [view, setView] = useState({ ids: GROUPS[0].ids, index: null });
  const onOpen = useCallback((group, index) => setView({ ids: group.ids, index }), []);
  const onIndex = useCallback((index) => setView((v) => ({ ...v, index })), []);

  return (
    <div className="beyond" data-mode={pinned ? 'pinned' : 'stacked'}>
      <div className="wrap grid12 beyond__head">
        <p className="t-h1 beyond__title">{t('beyond.title')}</p>
        <p className="t-lead beyond__body">{t('beyond.body')}</p>
      </div>
      {pinned ? (
        <Strip onOpen={onOpen} />
      ) : (
        <div className="wrap bstack">
          {GROUPS.map((group, i) => (
            <Panel key={group.key} group={group} index={i} total={GROUPS.length} onOpen={onOpen} pinned={false} />
          ))}
        </div>
      )}
      <Lightbox ids={view.ids} index={view.index} onIndex={onIndex} />
    </div>
  );
}

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useT } from '../../i18n/useT.js';
import { captions, gallery, CATEGORIES } from '../../content/projects.js';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';
import { refreshTriggers } from '../../lib/scroll/lenis.js';
import { useInViewClass } from '../../lib/scroll/useDraw.js';
import Heading from '../../components/ui/Heading.jsx';
import Caption from '../../components/ui/Caption.jsx';
import DepthImage from '../../components/media/DepthImage.jsx';
import { media } from '../../components/media/Img.jsx';
import Lightbox from '../../components/media/Lightbox.jsx';
import { ArrowDown } from '../../components/ui/Icons.jsx';
import '../sections.css';
import './Projects.css';

// The FLIP plugin is only needed when a filter is used, so it is fetched then (and warmed on hover).
let flipPromise = null;
const loadFlip = () =>
  (flipPromise ??= import('gsap/Flip').then((m) => {
    gsap.registerPlugin(m.Flip);
    return m.Flip;
  }));

// How wide each size renders, for an accurate `sizes` attribute (the browser then picks the right file).
const SIZES = {
  xl: '(min-width: 821px) 64vw, 100vw',
  l: '(min-width: 821px) 46vw, 100vw',
  m: '(min-width: 821px) 34vw, 100vw',
  s: '(min-width: 821px) 26vw, 62vw',
};

/** Projects: an editorial, asymmetric gallery with type filters and a full-screen viewer. */
export default function Projects() {
  const { t } = useT();
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);
  const gridRef = useRef(null);
  const flipState = useRef(null);
  const flipRef = useRef(null);
  const sectionRef = useInViewClass();

  const visible = useMemo(
    () => gallery.filter((item) => filter === 'all' || captions[item.id]?.category === filter),
    [filter],
  );
  const visibleIds = useMemo(() => visible.map((v) => v.id), [visible]);

  const choose = (next) => {
    if (next === filter) return;
    if (prefersReducedMotion() || !gridRef.current) {
      setFilter(next);
      return;
    }
    loadFlip()
      .then((Flip) => {
        flipRef.current = Flip;
        flipState.current = Flip.getState(gridRef.current.querySelectorAll('.pj'));
      })
      .catch(() => undefined)
      .then(() => setFilter(next));
  };

  // FLIP: items glide to their new places; leaving items fade, entering items fade in.
  useLayoutEffect(() => {
    const state = flipState.current;
    flipState.current = null;
    if (!state) {
      refreshTriggers();
      return;
    }
    // When the two views share no image (e.g. Kost → Villa) there is nothing to glide: just fade the new set in.
    const targets = [...gridRef.current.querySelectorAll('.pj')];
    const before = new Set(state.targets.map((el) => el.dataset.flipId));
    if (!targets.some((el) => before.has(el.dataset.flipId))) {
      if (targets.length) gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
      refreshTriggers();
      return;
    }
    flipRef.current.from(state, {
      duration: 0.7,
      ease: 'expo.out',
      absolute: false,
      targets,
      onEnter: (els) => (els.length ? gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }) : null),
      onComplete: refreshTriggers,
    });
  }, [filter]);

  const tabs = ['all', ...CATEGORIES];
  const onTabKey = (e) => {
    const i = tabs.indexOf(filter);
    const next = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : e.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length] : null;
    if (!next) return;
    e.preventDefault();
    choose(next);
    e.currentTarget.querySelector(`[data-filter="${next}"]`)?.focus();
  };

  return (
    <section id="projects" className="section projects" aria-labelledby="projects-title" ref={sectionRef}>
      <div className="wrap">
        <div className="projects__head">
          <div className="sec-head">
            <p className="t-eyebrow label-line">{t('projects.eyebrow')}</p>
            <Heading as="h2" id="projects-title" className="t-display projects__title">
              {t('projects.title')}
            </Heading>
          </div>
          <div className="projects__meta">
            <p className="t-lead ink-2">{t('projects.body')}</p>
            <div className="filters" role="tablist" aria-label={t('projects.filterLabel')} onKeyDown={onTabKey} onPointerEnter={() => loadFlip().catch(() => undefined)} onFocus={() => loadFlip().catch(() => undefined)}>
              {tabs.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`pj-tab-${key}`}
                  aria-selected={filter === key}
                  aria-controls="pj-panel"
                  tabIndex={filter === key ? 0 : -1}
                  data-filter={key}
                  className="filters__tab"
                  onClick={() => choose(key)}
                >
                  {t(`projects.filters.${key}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div id="pj-panel" role="tabpanel" aria-labelledby={`pj-tab-${filter}`} className="pj-grid" ref={gridRef} data-filtered={filter !== 'all'}>
          {visible.map((item) => {
            const entry = media(item.id);
            // Low-res sources are only ever shown small (docs/08 §2).
            const size = entry.lowRes ? 's' : item.size;
            return (
              <figure key={item.id} className={`pj pj--${size}`} data-flip-id={item.id} data-id={item.id} style={{ '--start': item.start, '--drop': item.drop ?? 0 }}>
                <button
                  type="button"
                  className="pj__open"
                  onClick={() => setOpen(visibleIds.indexOf(item.id))}
                  aria-label={`${t('projects.viewer.open')}: ${t(`alt.${item.id}`)}`}
                >
                  <DepthImage id={item.id} sizes={SIZES[size]} fit="natural" className="depth--enter pj__img" data-reveal />
                </button>
                <Caption id={item.id} />
              </figure>
            );
          })}
        </div>

        <div className="sec-bridge">
          <p className="bridge">{t('projects.bridge')}</p>
          <ArrowDown />
        </div>
      </div>
      <Lightbox ids={visibleIds} index={open} onIndex={setOpen} />
    </section>
  );
}

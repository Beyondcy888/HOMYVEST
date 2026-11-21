import { useState } from 'react';
import { useT } from '../../i18n/useT.js';
import { gallery } from '../../content/projects.js';
import { useInViewClass } from '../../lib/scroll/useDraw.js';
import Heading from '../../components/ui/Heading.jsx';
import Caption from '../../components/ui/Caption.jsx';
import DepthImage from '../../components/media/DepthImage.jsx';
import { media } from '../../components/media/Img.jsx';
import Lightbox from '../../components/media/Lightbox.jsx';
import { ArrowDown } from '../../components/ui/Icons.jsx';
import '../sections.css';
import './Projects.css';

// How wide each size renders, for an accurate `sizes` attribute (the browser then picks the right file).
const SIZES = {
  xl: '(min-width: 821px) 64vw, 100vw',
  l: '(min-width: 821px) 46vw, 100vw',
  m: '(min-width: 821px) 34vw, 100vw',
  s: '(min-width: 821px) 26vw, 62vw',
};

const IDS = gallery.map((item) => item.id);

/**
 * Projects: every project image in one curated, editorial sequence (U01_01 §2.5). No filters: large and small,
 * left and right, each one revealed as it scrolls in. A click opens the full-screen viewer.
 */
export default function Projects() {
  const { t } = useT();
  const [open, setOpen] = useState(null);
  const sectionRef = useInViewClass();

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
          </div>
        </div>

        <div className="pj-grid">
          {gallery.map((item, i) => {
            const entry = media(item.id);
            // Low-res sources are only ever shown small (docs/08 §2).
            const size = entry.lowRes ? 's' : item.size;
            return (
              <figure key={item.id} className={`pj pj--${size}`} data-id={item.id} style={{ '--start': item.start, '--drop': item.drop ?? 0 }}>
                <button
                  type="button"
                  className="pj__open"
                  onClick={() => setOpen(i)}
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
      <Lightbox ids={IDS} index={open} onIndex={setOpen} />
    </section>
  );
}

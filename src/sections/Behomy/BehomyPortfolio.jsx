import { useState } from 'react';
import { useT } from '../../i18n/useT.js';
import { behomyMosaic } from '../../content/behomy.js';
import { Picture } from '../../components/media/Img.jsx';
import DepthImage from '../../components/media/DepthImage.jsx';
import Caption from '../../components/ui/Caption.jsx';
import Lightbox from '../../components/media/Lightbox.jsx';

const IDS = behomyMosaic.map((item) => item.id);
const SIZES = {
  wide: '(min-width: 1024px) 48vw, 100vw',
  tall: '(min-width: 1024px) 24vw, 50vw',
  cell: '(min-width: 1024px) 24vw, 50vw',
};

/**
 * "Places Behomy runs today": an editorial mosaic of real Behomy properties with their brand captions.
 * One large image, two portrait facades in tall cells beside stacked landscapes, the rest in single cells.
 * A click opens the shared viewer.
 */
export default function BehomyPortfolio() {
  const { t } = useT();
  const [open, setOpen] = useState(null);
  return (
    <div className="bp">
      <h3 className="t-h2 bp__title">{t('behomy.portfolio.title')}</h3>
      <ul className="bp__grid">
        {behomyMosaic.map((item, i) => {
          const shape = item.shape ?? 'cell';
          const label = `${t('projects.viewer.open')}: ${t(`alt.${item.id}`)}`;
          return (
            <li key={item.id} className={`bp__item bp__item--${shape}`}>
              <figure className="bp__fig" data-reveal>
                <button type="button" className="bp__open" onClick={() => setOpen(i)} aria-label={label}>
                  {item.depth ? (
                    <DepthImage id={item.id} sizes={SIZES[shape]} className="bp__img" />
                  ) : (
                    <Picture id={item.id} sizes={SIZES[shape]} className="bp__img" imgClassName="bp__pic" style={item.position ? { objectPosition: item.position } : undefined} />
                  )}
                </button>
                <Caption id={item.id} />
              </figure>
            </li>
          );
        })}
      </ul>
      <Lightbox ids={IDS} index={open} onIndex={setOpen} />
    </div>
  );
}

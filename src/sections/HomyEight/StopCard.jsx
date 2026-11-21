import { memo, useEffect, useRef } from 'react';
import DepthImage from '../../components/media/DepthImage.jsx';
import Caption from '../../components/ui/Caption.jsx';

// phones: 62vw (U01_05 §3) · landscape phones: about 35vw · tablets in portrait: the full width · desktop: 46vw
const SIZES = '(max-width: 767px) and (orientation: portrait) 62vw, (max-height: 520px) and (max-width: 1023px) 36vw, (max-aspect-ratio: 85/100) 100vw, 46vw';

/**
 * What appears at a stop of the walkthrough.
 *  - variant "image" (over the 3D room): the real render in a hairline frame, the stop's name and the caption.
 *  - variant "label" (render-led fallback, where the render already fills the stage): name and caption only.
 * Presence is driven from scroll through the CSS variables --in (0..1) and --mix (second render of a pair).
 */
function StopCard({ ref, card, name, variant = 'image' }) {
  const [first, second] = card.ids;
  const media = useRef(null);
  // A card is fully clipped until its stop, so the browser would decode its picture on the frame it first
  // shows (on phones, where the picture stays a plain image, that was a 60–100 ms frame). Decode it ahead,
  // in idle time, once it has loaded.
  useEffect(() => {
    const box = media.current;
    if (!box) return undefined;
    let id = 0;
    const decode = () => box.querySelectorAll('img').forEach((img) => img.decode?.().catch(() => undefined));
    id = window.requestIdleCallback ? window.requestIdleCallback(decode, { timeout: 3000 }) : window.setTimeout(decode, 800);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : window.clearTimeout(id));
  }, []);
  return (
    <figure ref={ref} className={`scard scard--${variant} scard--${card.side}`} data-stop={card.stop} data-depth-host data-depth-off="true">
      {variant === 'image' ? (
        <div className="scard__media" ref={media}>
          <DepthImage id={first} sizes={SIZES} strength={0.8} className="scard__img" />
          {second ? <DepthImage id={second} sizes={SIZES} strength={0.8} className="scard__img scard__img--b" /> : null}
        </div>
      ) : null}
      <figcaption className="scard__cap">
        <span className="scard__name">{name}</span>
        <span className="scard__caps">
          <Caption id={first} className="scard__caption" />
          {second ? <Caption id={second} className="scard__caption scard__caption--b" /> : null}
        </span>
      </figcaption>
    </figure>
  );
}

// memo: the walkthrough re-renders when the stop changes; the cards themselves do not change.
export default memo(StopCard);

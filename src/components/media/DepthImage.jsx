import { Picture } from './Img.jsx';
import './DepthImage.css';

/**
 * A photographic render with a subtle 2.5D "looking into the room" motion (docs/06 §6).
 * It always renders a normal <picture> (SEO, LCP and fallback). The WebGL depth view is layered
 * on top by the shared depth canvas when a depth map exists, the tier allows it and motion is on.
 *
 *  - id, sizes, alt, priority: as <Img>
 *  - strength: hero photo 1.2, cards 0.8, gallery 1.0
 *  - fit: 'cover' (fills its frame; give the frame a size) or 'natural' (keeps the image's aspect ratio)
 */
export default function DepthImage({ id, sizes, alt, priority, strength = 1, fit = 'cover', className = '', ...rest }) {
  return (
    <div className={`depth depth--${fit} ${className}`} data-depth-id={id} data-depth-strength={strength} {...rest}>
      <Picture id={id} sizes={sizes} alt={alt} priority={priority} className="depth__picture" />
    </div>
  );
}

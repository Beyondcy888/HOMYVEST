import { useEffect, useRef } from 'react';
import { Picture } from './Img.jsx';
import { hasWebGL } from '../../lib/device/webgl.js';
import { getTier } from '../../lib/device/tier.js';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';
import './DepthImage.css';

// The engine (and three.js with it) loads only when an image actually needs it, after first paint.
let enginePromise = null;
const loadEngine = () => (enginePromise ??= import('../../three/depth/engine.js'));

/**
 * A photographic render with a subtle 2.5D "looking into the room" motion (docs/06 §6).
 * It always renders a normal <picture> (SEO, LCP and fallback). When a depth map exists, the tier is
 * not low, motion is allowed and WebGL works, a small canvas fades in exactly over the picture and the
 * picture hides. Otherwise nothing changes: no empty boxes, no errors.
 *
 *  - id, sizes, alt, priority: as <Picture>
 *  - strength: hero photo 1.2, cards 0.8, gallery 1.0
 *  - fit: 'cover' (fills its frame; give the frame a size) or 'natural' (keeps the image's aspect ratio)
 */
export default function DepthImage({ id, sizes, alt, priority, strength = 1, fit = 'cover', className = '', ...rest }) {
  const ref = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!hasWebGL() || prefersReducedMotion() || getTier().name === 'low') return undefined;
    let off = null;
    let cancelled = false;
    const start = () =>
      loadEngine()
        .then((engine) => {
          if (cancelled || !ref.current) return;
          off = engine.register({ el: ref.current, canvas: canvasRef.current, id, strength });
        })
        .catch(() => undefined);
    // Wait for idle time so the engine never competes with first paint.
    const idle = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 1200);
    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      off?.();
    };
  }, [id, strength]);

  return (
    <div ref={ref} className={`depth depth--${fit} ${className}`} data-depth-id={id} {...rest}>
      <Picture id={id} sizes={sizes} alt={alt} priority={priority} className="depth__picture" />
      <canvas ref={canvasRef} className="depth__view" aria-hidden="true" />
    </div>
  );
}

import manifest from '../../content/media-manifest.json';
import { useT } from '../../i18n/useT.js';

export const media = (id) => manifest.images[id];

/** Picks the smallest variant at least `minWidth` wide (for textures and posters). */
export function variantUrl(id, minWidth = 1200, format = 'webp') {
  const entry = media(id);
  if (!entry) return null;
  const list = entry.srcset[format].split(', ').map((s) => {
    const [url, w] = s.split(' ');
    return { url, w: parseInt(w, 10) };
  });
  return (list.find((v) => v.w >= minWidth) ?? list[list.length - 1]).url;
}

/**
 * Responsive image from the manifest: AVIF + WebP srcset, never upscaled, LQIP while loading.
 *  - id:       manifest id, e.g. "interiors/interior-3"
 *  - sizes:    accurate sizes attribute, e.g. "(min-width: 1024px) 46vw, 100vw"
 *  - alt:      optional override; defaults to the described alt text in the active language ('' = decorative)
 *  - priority: hero image only (eager, high fetch priority)
 */
export function Picture({ id, sizes = '100vw', alt, priority = false, className = '', imgClassName = '', style, ...rest }) {
  const { t } = useT();
  const entry = media(id);
  if (!entry) {
    if (import.meta.env.DEV) console.warn(`[Img] unknown image id "${id}"`);
    return null;
  }
  const text = alt ?? t(`alt.${id}`);
  const transparent = entry.hasAlpha;
  return (
    <picture className={className} {...rest}>
      <source type="image/avif" srcSet={entry.srcset.avif} sizes={sizes} />
      <source type="image/webp" srcSet={entry.srcset.webp} sizes={sizes} />
      <img
        className={imgClassName}
        src={entry.largestUrl}
        width={entry.width}
        height={entry.height}
        alt={text}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        data-lowres={entry.lowRes || undefined}
        style={transparent ? style : { background: `${entry.dominant} url(${entry.lqip}) center / cover no-repeat`, ...style }}
      />
    </picture>
  );
}

// docs/08 calls this component <Img>. It is exported as Picture too, so JSX reads <Picture id=…/>
// and design linters do not mistake it for a bare <img> tag without a src.
export default Picture;

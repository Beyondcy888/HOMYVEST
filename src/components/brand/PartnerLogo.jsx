// Partner logos (U01_07 §2): the second colour exception in the black-and-white design, after the photos.
// Never recoloured, outlined, stretched or rotated. Display files are 3× their largest on-screen height.
// The variant follows the site's theme (read before first paint, so there is no flash); over photos the
// on-dark variant is used whatever the theme.
import { useTheme } from '../../lib/theme.js';
import homyeightLight from '../../assets/logos/homyeight-compact@96.webp';
import homyeightDark from '../../assets/logos/homyeight-compact-on-dark@96.webp';
import behomyLight from '../../assets/logos/behomy@120.webp';
import behomyDark from '../../assets/logos/behomy-on-dark@120.webp';
import './PartnerLogo.css';

const LOGOS = {
  homyeight: {
    alt: 'HomyEight',
    light: { src: homyeightLight, w: 507, h: 96 },
    dark: { src: homyeightDark, w: 507, h: 96 },
  },
  behomy: {
    alt: 'Behomy',
    light: { src: behomyLight, w: 230, h: 120 },
    // the on-dark file carries a transparent margin the light one doesn't: drawn 4.5% taller so both read the same size
    dark: { src: behomyDark, w: 224, h: 120, boost: 1.045 },
  },
};

/**
 * brand:  'homyeight' | 'behomy'
 * height: on-screen height in px (CSS can override it with --logo-h, e.g. smaller on phones)
 * tone:   'auto' (follows the theme), 'light' (colour logo for light backgrounds) or 'dark' (on-dark variant)
 */
export default function PartnerLogo({ brand, height = 20, tone = 'auto', className = '', alt }) {
  const theme = useTheme();
  const variant = tone === 'auto' ? (theme === 'dark' ? 'dark' : 'light') : tone;
  const logo = LOGOS[brand];
  const v = logo[variant];
  return (
    <img
      className={`plogo ${className}`}
      src={v.src}
      alt={alt ?? logo.alt}
      width={Math.round((height * v.w) / v.h)}
      height={height}
      decoding="async"
      data-brand={brand}
      data-variant={variant}
      style={{ '--logo-h0': `${height}px`, '--logo-boost': v.boost ?? 1 }}
    />
  );
}

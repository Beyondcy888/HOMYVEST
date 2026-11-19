import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { useT } from '../../i18n/useT.js';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * A heading that rises line by line behind a mask when it enters view (docs/03 §7).
 * The text is real, visible DOM text first; the split is an enhancement and re-runs on resize,
 * font load and language change. Reduced motion: no split, no animation.
 */
export default function Heading({ as: Tag = 'h2', className = '', children, delay = 0, start = 'top 88%', ...rest }) {
  const ref = useRef(null);
  const { lang } = useT();

  useGSAP(
    () => {
      if (prefersReducedMotion()) return undefined;
      const el = ref.current;
      let played = false;
      const split = SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit(self) {
          if (played) return undefined; // after a re-split (resize, fonts) keep the lines where they are
          return gsap.from(self.lines, {
            yPercent: 108,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.09,
            delay,
            scrollTrigger: { trigger: el, start, once: true },
            onComplete: () => (played = true),
          });
        },
      });
      return () => split.revert();
    },
    { scope: ref, dependencies: [lang, children], revertOnUpdate: true },
  );

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}

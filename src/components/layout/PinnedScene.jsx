import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { registerTrigger } from '../../lib/scroll/triggers.js';
import { useUi } from '../../lib/ui/store.js';
import { useMediaQuery } from '../../lib/device/useReducedMotion.js';
import './PinnedScene.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * A pinned, scroll-driven scene.
 *
 * The stage is pinned with CSS `position: sticky` inside a tall wrapper, and one ScrollTrigger reports
 * progress 0..1. Sticky pinning is done by the browser's compositor, so there is no pin-spacer, no
 * layout jump when lazy content mounts above, and no jitter with native touch scrolling.
 *
 * Props
 *  - id:            registry key (window.__homyvest.triggers[id]) and data attribute
 *  - lengthVh:      scroll length on desktop, in viewport heights × 100 (500 = five screens of scrolling)
 *  - mobileLengthVh: same for narrow screens
 *  - progress:      object from createProgress(); receives 0..1
 *  - timeline:      optional (tl) => void. Build GSAP tweens on a timeline scrubbed by the same scroll range.
 *                   Use positions 0..1 (the timeline is 1 "second" long), so text and 3D share one clock.
 *  - onActive:      optional (bool) => void when the scene enters or leaves the viewport-pinned state
 *  - deps:          re-create the timeline when these change (e.g. [lang])
 */
export default function PinnedScene({
  id,
  lengthVh = 400,
  mobileLengthVh,
  progress,
  timeline,
  onActive,
  deps = [],
  className = '',
  children,
}) {
  const wrapRef = useRef(null);
  const narrow = useMediaQuery('(max-width: 820px)');
  const len = narrow && mobileLengthVh ? mobileLengthVh : lengthVh;

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const { pin, unpin } = useUi.getState();
      let active = false;
      const setActive = (next) => {
        if (next === active) return;
        active = next;
        next ? pin() : unpin();
        onActive?.(next);
      };

      const st = ScrollTrigger.create({
        trigger: wrap,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => progress?.set(self.progress),
        onToggle: (self) => setActive(self.isActive),
        onRefresh: (self) => progress?.set(self.progress),
      });
      const unregister = registerTrigger(id, st);

      let tl;
      if (timeline) {
        tl = gsap.timeline({
          defaults: { ease: 'none', duration: 0.05 },
          scrollTrigger: { trigger: wrap, start: 'top top', end: 'bottom bottom', scrub: true },
        });
        timeline(tl);
        // Pad the timeline to exactly 1 so positions read as scroll progress.
        tl.set({}, {}, 1);
      }

      return () => {
        unregister();
        setActive(false);
      };
    },
    { scope: wrapRef, dependencies: [id, len, ...deps], revertOnUpdate: true },
  );

  return (
    <div
      ref={wrapRef}
      className={`pinned ${className}`}
      data-pinned={id}
      style={{ height: `calc(var(--vh) * ${100 + len})` }}
    >
      <div className="pinned__stage">{children}</div>
    </div>
  );
}

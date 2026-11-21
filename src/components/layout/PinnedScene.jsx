import { createContext, useContext, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { registerTrigger, setPinnedScene } from '../../lib/scroll/triggers.js';
import { useUi } from '../../lib/ui/store.js';
import { useMediaQuery } from '../../lib/device/useReducedMotion.js';
import { MOBILE_SCROLL_QUERY, SCROLL, scrollLength } from '../../content/scroll-config.js';
import './PinnedScene.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The id of the pinned scene a component sits in (null outside one). SceneCanvas uses it. */
const PinContext = createContext(null);
export const usePinnedScene = () => useContext(PinContext);

/**
 * A pinned, scroll-driven scene.
 *
 * The stage is pinned with CSS `position: sticky` inside a tall wrapper, and one ScrollTrigger reports
 * progress 0..1. Sticky pinning is done by the browser's compositor, so there is no pin-spacer, no
 * layout jump when lazy content mounts above, and no jitter with native touch scrolling. (That is also why
 * ScrollTrigger's anticipatePin and pinSpacing are not used: they only apply to ScrollTrigger's own pin.)
 *
 * Props
 *  - id:            registry key (window.__homyvest.triggers[id]) and data attribute. When it names an entry of
 *                   SCROLL (src/content/scroll-config.js), the scroll length comes from there.
 *  - lengthVh:      scroll length in viewport heights × 100 (1000 = ten screens of scrolling). Overrides SCROLL.
 *  - mobileLengthVh: same for phones (coarse pointer and narrower than 768 px)
 *  - progress:      object from createProgress(); receives 0..1
 *  - timeline:      optional (tl) => void. Build GSAP tweens on a timeline scrubbed by the same scroll range.
 *                   Use positions 0..1 (the timeline is 1 "second" long), so text and 3D share one clock.
 *  - onActive:      optional (bool) => void when the scene enters or leaves the viewport-pinned state
 *  - deps:          re-create the timeline when these change (e.g. [lang])
 */
export default function PinnedScene({
  id,
  lengthVh,
  mobileLengthVh,
  progress,
  timeline,
  onActive,
  deps = [],
  className = '',
  children,
}) {
  const wrapRef = useRef(null);
  const mobile = useMediaQuery(MOBILE_SCROLL_QUERY);
  const fromConfig = SCROLL[id] ? scrollLength(id, mobile) : 400;
  const len = mobile ? (mobileLengthVh ?? lengthVh ?? fromConfig) : (lengthVh ?? fromConfig);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const { pin, unpin } = useUi.getState();
      let active = false;
      const setActive = (next) => {
        if (next === active) return;
        active = next;
        next ? pin() : unpin();
        setPinnedScene(id, next);
        onActive?.(next);
      };

      // The progress reader. It drives no animation of its own (the 3D scenes damp the raw value), so
      // invalidateOnRefresh and fastScrollEnd have nothing to act on here.
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
          // scrub: true, never a number: Lenis and the scenes' damping already smooth the input.
          // invalidateOnRefresh re-records the tweens' start values when the layout is measured again
          // (fonts, language, a resize); fastScrollEnd settles the text when the scene is left at speed.
          scrollTrigger: { trigger: wrap, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true, fastScrollEnd: true },
        });
        timeline(tl);
        // Pad the timeline to exactly 1 so positions read as scroll progress.
        // (inherit: false keeps timeline defaults such as force3D off this empty placeholder tween)
        tl.set({}, { inherit: false }, 1);
      }

      return () => {
        unregister();
        setActive(false);
      };
    },
    { scope: wrapRef, dependencies: [id, len, ...deps], revertOnUpdate: true },
  );

  return (
    <PinContext.Provider value={id}>
      <div
        ref={wrapRef}
        className={`pinned ${className}`}
        data-pinned={id}
        style={{ height: `calc(var(--vh) * ${100 + len})` }}
      >
        <div className="pinned__stage">{children}</div>
      </div>
    </PinContext.Provider>
  );
}

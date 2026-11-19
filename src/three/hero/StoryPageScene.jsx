// DEV ONLY (not part of the site): mounts the whole #story section in a tall scrolling page inside the
// scene harness, so the pinned text and photo layers can be checked before the section is wired into
// Sections.jsx.
//
//   /dev.html?scene=storypage&ui=0        then: node qa/tools/shot.mjs "…" out.png --scene story --p 0.5
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Story from '../../sections/Story/Story.jsx';
import { startLenis, destroyLenis, refreshTriggers } from '../../lib/scroll/lenis.js';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';

const stub = { minHeight: '120vh', padding: '96px var(--gutter)', borderTop: '1px solid var(--line)' };

export default function StoryPageScene({ onReady }) {
  useEffect(() => {
    startLenis({ reducedMotion: prefersReducedMotion() });
    refreshTriggers();
    onReady?.();
    return () => destroyLenis();
  }, [onReady]);

  return createPortal(
    <div style={{ position: 'relative', zIndex: 1, background: 'var(--paper)' }}>
      <main>
        <Story />
        <section id="about" style={stub}>
          <h2 className="t-h1">#about (dev stub)</h2>
        </section>
        <section id="calculator" style={stub}>
          <h2 className="t-h1">#calculator (dev stub)</h2>
        </section>
      </main>
    </div>,
    document.body,
  );
}

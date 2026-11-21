// The rest between two scenes (U01_04 §1): about 30svh with the next scene's number and name in large type.
// It is that section's heading. While the visitor reads it, the scene below has its code and world ready
// (see prefetch.js); `onNear` is a last call to prepare it if idle time never came.
import { useEffect, useRef } from 'react';

export default function Divider({ n, id, title, onNear, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !onNear) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        onNear();
      },
      { rootMargin: '200% 0px 200% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onNear]);
  const num = String(n).padStart(2, '0');
  return (
    <header ref={ref} className="pf-divider">
      <div className="wrap pf-divider__inner">
        <h2 id={id} className="pf-divider__title">
          {/* the spaces between the spans keep the heading's text "02 Step inside Maxone" for screen readers */}
          <span className="pf-divider__num nums">{num}</span>{' '}
          <span className="pf-divider__dot" aria-hidden="true">
            ·
          </span>{' '}
          <span className="pf-divider__name">{title}</span>
        </h2>
        {children}
      </div>
    </header>
  );
}

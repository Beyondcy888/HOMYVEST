// Mounts a lazy 3D scene only while its section is near the viewport, shows a poster until the first
// frame is drawn, and swaps to the poster if the scene throws. Contains no three.js itself, so the
// initial bundle stays free of it (docs/06 §1.2, docs/09 §4).
import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { hasWebGL } from '../../lib/device/webgl.js';
import { useReducedMotion } from '../../lib/device/useReducedMotion.js';
import './SceneMount.css';

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error('[scene] falling back to the poster:', error);
    this.props.onFail?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** 'live' when the animated 3D can run, 'static' for reduced motion or no WebGL. */
export function useSceneMode() {
  const reduced = useReducedMotion();
  return reduced || !hasWebGL() ? 'static' : 'live';
}

/** True while the element is within `margin` viewports of the screen. */
function useNear(ref, margin) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: `${margin * 100}% 0px ${margin * 100}% 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return near;
}

/**
 * Props
 *  - load:       () => import('…Scene.jsx')  (a stable, module-level function)
 *  - sceneProps: props for the scene component; it also receives onReady
 *  - poster:     node shown before the canvas is ready, and instead of it on failure
 *  - label:      text alternative describing the scene's key content
 *  - active:     set false to keep the scene unmounted (e.g. static mode)
 *  - onFail:     called if the scene throws
 */
export default function SceneMount({ load, sceneProps, poster, label, active = true, onFail, className = '', children }) {
  const ref = useRef(null);
  const mountNear = useNear(ref, 1); // mount within ~1 viewport
  const keepNear = useNear(ref, 2); // unmount beyond ~2 viewports
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const Scene = useMemo(() => lazy(load), [load]);

  useEffect(() => {
    if (!active) {
      setMounted(false);
      setReady(false);
    } else if (mountNear) setMounted(true);
    else if (!keepNear) {
      setMounted(false);
      setReady(false);
    }
  }, [active, mountNear, keepNear]);

  const live = active && mounted && !failed;
  return (
    <div ref={ref} className={`scene-mount ${className}`} role="img" aria-label={label} data-ready={ready && live}>
      <div className="scene-mount__poster" aria-hidden="true">
        {poster}
      </div>
      {live ? (
        <SceneBoundary
          onFail={() => {
            setFailed(true);
            onFail?.();
          }}
        >
          <Suspense fallback={null}>
            <Scene {...sceneProps} onReady={() => setReady(true)} />
          </Suspense>
        </SceneBoundary>
      ) : null}
      {children}
    </div>
  );
}

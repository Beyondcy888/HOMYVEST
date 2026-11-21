// The <Canvas> every big scene uses: tier-aware quality, render-on-demand, transparent background.
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { useTier, isCoarsePointer } from '../../lib/device/tier.js';
import { usePage } from '../../lib/page.js';
import { FrameWatch, PerfProbe } from './Stage.jsx';

// On /portofolio/ the long scenes cap the pixel ratio (U01_04 §4.7): 1.75 on desktop, 1.5 on phones.
// The main page's calculator canvas keeps its tier's ratio.
const PORTFOLIO_DPR = { desktop: 1.75, mobile: 1.5 };
function dprFor(tier, page) {
  if (page !== 'portfolio') return tier.dpr;
  const mobile = isCoarsePointer() || (typeof window !== 'undefined' && window.innerWidth < 768);
  const cap = mobile ? PORTFOLIO_DPR.mobile : PORTFOLIO_DPR.desktop;
  const [min, max] = tier.dpr;
  return [Math.min(min, cap), Math.min(max, cap)];
}

const TEXTURE_SLOTS = ['map', 'alphaMap', 'aoMap', 'bumpMap', 'emissiveMap', 'lightMap', 'metalnessMap', 'normalMap', 'roughnessMap'];

/**
 * Uploads the scene's image textures to the GPU before its first frame, one per animation frame, so no single
 * frame pays for all of them (U01_04 §4.1). Textures that are still loading upload when they arrive.
 */
function uploadTextures(gl, scene, alive) {
  const found = new Set();
  scene.traverse((obj) => {
    const list = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const m of list) {
      for (const slot of TEXTURE_SLOTS) {
        const tex = m[slot];
        if (tex?.isTexture && !tex.isRenderTargetTexture && tex.image && (tex.image.width || tex.image.videoWidth)) found.add(tex);
      }
    }
  });
  const queue = [...found];
  return new Promise((resolve) => {
    const next = () => {
      if (!alive() || queue.length === 0) return resolve();
      try {
        gl.initTexture(queue.shift());
      } catch {
        /* a texture that cannot upload now uploads on first use, as before */
      }
      requestAnimationFrame(next);
    };
    requestAnimationFrame(next);
  });
}

// React Three Fiber 9.8 still creates a THREE.Clock internally, which three r187 reports as deprecated
// on every canvas. It is not ours to fix, so that one message is filtered; everything else passes through.
if (typeof THREE.setConsoleFunction === 'function') {
  THREE.setConsoleFunction((level, message, ...rest) => {
    if (typeof message === 'string' && message.includes('THREE.Clock: This module has been deprecated')) return;
    (console[level] ?? console.log)(message, ...rest);
  });
}

const TONE = { aces: THREE.ACESFilmicToneMapping, neutral: THREE.NeutralToneMapping, agx: THREE.AgXToneMapping, none: THREE.NoToneMapping };

/** Calls invalidate() whenever the scroll progress changes, so a static scene costs nothing while idle. */
export function InvalidateOn({ progress }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
    return progress?.subscribe(() => invalidate());
  }, [progress, invalidate]);
  return null;
}

/**
 * Brings a scene up without freezing the page.
 *
 * A cold GPU needs time to compile a scene's shaders (measured: up to 1.5 s for the walkthrough on a first
 * visit). Done on the first draw, that is one long frozen frame, right while the visitor is scrolling toward
 * the scene. So the canvas starts with its frame loop off, every material in the scene graph (hidden objects
 * included) is compiled in the background with compileAsync, and only then does drawing begin. The poster
 * stays up in the meantime. The onReady callback fires after the first frame has been drawn.
 */
function Warm({ live, onLive, onReady }) {
  const get = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    let alive = true;
    const go = () => alive && onLive();
    // one frame later, so the children's own effects (materials, environment map) have run
    const id = requestAnimationFrame(() => {
      try {
        const { gl, scene, camera } = get();
        (typeof gl.compileAsync === 'function' ? gl.compileAsync(scene, camera) : Promise.resolve())
          .then(() => uploadTextures(gl, scene, () => alive))
          .then(go, go);
      } catch {
        go();
      }
    });
    const safety = window.setTimeout(go, 5000); // never leave a scene dark because a compile stalled
    return () => {
      alive = false;
      cancelAnimationFrame(id);
      window.clearTimeout(safety);
    };
  }, [get, onLive]);

  useEffect(() => {
    if (!live) return undefined;
    invalidate();
    let id2;
    const id = requestAnimationFrame(() => {
      invalidate();
      id2 = requestAnimationFrame(() => onReady?.());
    });
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(id2);
    };
  }, [live, invalidate, onReady]);
  return null;
}

/**
 * Props
 *  - camera:       R3F camera props ({ fov, position, near, far } or an orthographic config with `orthographic`)
 *  - orthographic: use an orthographic camera
 *  - shadows:      set false to disable shadow maps for this scene regardless of tier
 *  - progress:     optional createProgress() object; the canvas re-renders when it changes
 *  - onReady:      called after the first frame
 *  - name:         label for the ?perf=1 probe
 *  - exposure:     tone-mapping exposure (default 1)
 *  - toneMapping:  'neutral' (default: Khronos PBR Neutral keeps white clay at its true brightness; ACES greys it),
 *                  'aces', 'agx' or 'none'
 *  - frameloop:    'demand' (default) or 'always'
 */
export default function SceneCanvas({
  children,
  camera,
  orthographic = false,
  shadows = true,
  progress,
  onReady,
  name = 'scene',
  frameloop = 'demand',
  exposure = 1,
  toneMapping = 'neutral',
  className = '',
  style,
  ...rest
}) {
  const tier = useTier();
  const page = usePage();
  const dpr = useMemo(() => dprFor(tier, page), [tier, page]);
  const [live, setLive] = useState(false);
  const onLive = useCallback(() => setLive(true), []);
  return (
    <Canvas
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
      dpr={dpr}
      frameloop={live ? frameloop : 'never'}
      orthographic={orthographic}
      camera={camera}
      // three r182+ removed PCFSoftShadowMap; PCFShadowMap ("percentage") is the soft-filtered map now
      shadows={tier.shadows && shadows ? 'percentage' : false}
      gl={{ antialias: tier.name !== 'low', powerPreference: 'high-performance', alpha: true, stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = TONE[toneMapping] ?? THREE.NeutralToneMapping;
        gl.toneMappingExposure = exposure;
        gl.setClearColor(0x000000, 0);
      }}
      aria-hidden="true"
      tabIndex={-1}
      {...rest}
    >
      {progress ? <InvalidateOn progress={progress} /> : null}
      <FrameWatch />
      <PerfProbe label={name} />
      {children}
      <Warm live={live} onLive={onLive} onReady={onReady} />
    </Canvas>
  );
}

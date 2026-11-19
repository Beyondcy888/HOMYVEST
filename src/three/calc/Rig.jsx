// Camera for the calculator scene (docs/06 §5.1): FOV 30°, orbit with damping, polar 15°–80°, no pan
// (so the view can never go below the ground), zoom limits scaled to the plot, and an automatic
// 0.6 s re-frame whenever the land or the model's height changes.
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ROAD_DEPTH } from '../../lib/calc/geometry.ts';

const DEG = Math.PI / 180;
export const FOV = 30;
// Front-left: the key light comes from the upper left, slightly behind, so this side shows a lit flank,
// a softly shaded street front and the shadow falling toward the viewer.
const HOME_AZ = -42 * DEG;
const HOME_POLAR = 52 * DEG;
const FRAME = 0.6; // seconds
const MARGIN = 0.86; // the scene fills this share of the panel, leaving room for labels

/** World-space box that must stay in view: land, road, dimension lines and the model with its top label. */
export function sceneBox(scene, height) {
  const { P, L } = scene.land;
  const u = scene.u;
  return {
    min: [-P / 2 - 1.7 * u, -scene.th, -L - 0.3 * u],
    max: [P / 2 + 1.6 * u, height + 0.9 * u, ROAD_DEPTH + 1.6 * u],
  };
}

/** Smallest camera distance from the box centre at which every corner is inside the frustum. */
export function fitDistance(box, az, polar, aspect) {
  const sp = Math.sin(polar), cp = Math.cos(polar), sa = Math.sin(az), ca = Math.cos(az);
  const d = [sp * sa, cp, sp * ca]; // from the target toward the camera
  const r = [ca, 0, -sa];
  const up = [-sa * cp, sp, -ca * cp];
  const tv = Math.tan((FOV * DEG) / 2) * MARGIN;
  const th = tv * aspect;
  const c = [0, 1, 2].map((i) => (box.min[i] + box.max[i]) / 2);
  let dist = 0;
  for (let i = 0; i < 8; i++) {
    const p = [i & 1 ? box.max[0] : box.min[0], i & 2 ? box.max[1] : box.min[1], i & 4 ? box.max[2] : box.min[2]];
    const rel = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
    const along = rel[0] * d[0] + rel[1] * d[1] + rel[2] * d[2];
    const x = Math.abs(rel[0] * r[0] + rel[1] * r[1] + rel[2] * r[2]);
    const y = Math.abs(rel[0] * up[0] + rel[1] * up[1] + rel[2] * up[2]);
    dist = Math.max(dist, along + x / th, along + y / tv);
  }
  return { dist, center: c };
}

const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2); // power2.inOut
const _v = new THREE.Vector3();

/**
 *  - scene:   the current description (kits/calcModels.js)
 *  - reduced: no camera moves, just cut
 *  - zoom:    wheel and pinch zoom enabled
 *  - api:     ref that receives { reset() } for the "Reset view" button
 *  - onStart: called when the visitor starts to orbit
 */
export default function Rig({ scene, reduced, zoom, api, onStart }) {
  const controls = useRef(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const events = useThree((s) => s.events);
  const invalidate = useThree((s) => s.invalidate);
  const move = useRef(null); // the running re-frame
  const framed = useRef({ P: 0, L: 0, h: 0, aspect: 0, ready: false });
  const { P, L } = scene.land;
  const aspect = size.width / Math.max(1, size.height);

  // Height used for framing: the model's, but a plot never frames tighter than a low building would need,
  // and small changes in height do not move the camera.
  const height = useMemo(() => {
    const f = framed.current;
    const want = Math.max(scene.height, 0.3 * Math.min(P, L));
    const sameLand = f.P === P && f.L === L;
    if (sameLand && want <= f.h * 1.02 && want >= f.h * 0.5) return f.h;
    return want;
  }, [scene.height, P, L]);

  const limits = (dist) => {
    const c = controls.current;
    if (!c) return;
    const now = camera.position.distanceTo(c.target);
    c.minDistance = Math.min(dist * 0.35, now);
    c.maxDistance = Math.max(dist * 1.7, now);
    camera.near = Math.max(0.05, dist * 0.02);
    camera.far = dist * 9;
    camera.updateProjectionMatrix();
  };

  const place = (az, polar, dist, target) => {
    const c = controls.current;
    const sp = Math.sin(polar);
    c.target.set(target[0], target[1], target[2]);
    camera.position.set(target[0] + dist * sp * Math.sin(az), target[1] + dist * Math.cos(polar), target[2] + dist * sp * Math.cos(az));
    camera.lookAt(c.target);
  };

  const frame = (home, instant) => {
    const c = controls.current;
    if (!c || !(size.width > 0)) return;
    const box = sceneBox(scene, height);
    const az = home ? HOME_AZ : c.getAzimuthalAngle();
    const polar = home ? HOME_POLAR : c.getPolarAngle();
    const fit = fitDistance(box, az, polar, aspect);
    framed.current = { P, L, h: height, aspect, ready: true, dist: fit.dist };
    if (instant) {
      move.current = null;
      c.minDistance = 0;
      c.maxDistance = Infinity;
      place(az, polar, fit.dist, fit.center);
      c.update();
      limits(fit.dist);
    } else {
      const from = { az: c.getAzimuthalAngle(), polar: c.getPolarAngle(), dist: camera.position.distanceTo(c.target), target: c.target.toArray() };
      let daz = az - from.az;
      daz -= Math.round(daz / (2 * Math.PI)) * 2 * Math.PI; // the short way round
      move.current = { t0: performance.now() / 1000, from, to: { az: from.az + daz, polar, dist: fit.dist, target: fit.center } };
      c.minDistance = 0;
      c.maxDistance = Infinity;
      camera.near = Math.max(0.05, Math.min(from.dist, fit.dist) * 0.02);
      camera.far = Math.max(from.dist, fit.dist) * 9;
      camera.updateProjectionMatrix();
    }
    invalidate();
  };
  const frameRef = useRef(frame);
  frameRef.current = frame;

  // First view: cut to the home view. Later: glide whenever the land, the framed height or the panel changes.
  useEffect(() => {
    const f = framed.current;
    if (!f.ready) frameRef.current(true, true);
    else if (f.P !== P || f.L !== L || f.h !== height || Math.abs(f.aspect - aspect) > 0.01) frameRef.current(false, reduced);
  }, [P, L, height, aspect, reduced]);

  useEffect(() => {
    if (!api) return undefined;
    api.current = { reset: () => frameRef.current(true, reduced) };
    return () => { api.current = null; };
  }, [api, reduced]);

  useFrame(() => {
    const m = move.current;
    const c = controls.current;
    if (!m || !c) return;
    const u = Math.min(1, (performance.now() / 1000 - m.t0) / FRAME);
    const e = ease(u);
    const mix = (a, b) => a + (b - a) * e;
    place(mix(m.from.az, m.to.az), mix(m.from.polar, m.to.polar), mix(m.from.dist, m.to.dist), [0, 1, 2].map((i) => mix(m.from.target[i], m.to.target[i])));
    if (u >= 1) {
      move.current = null;
      limits(m.to.dist);
    }
    invalidate();
  }, -2);

  // OrbitControls switches touch scrolling off on the element it listens on. Hand vertical swipes back
  // to the page: the browser scrolls them, everything else (horizontal drags, two fingers) reaches the controls.
  useEffect(() => {
    const el = events.connected || gl.domElement;
    if (el?.style) el.style.touchAction = 'pan-y';
  });

  useEffect(() => {
    const c = controls.current;
    if (!c) return undefined;
    c.touches.ONE = THREE.TOUCH.ROTATE;
    c.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    if (import.meta.env.DEV) window.__calcView = { controls: c, camera, azimuth: () => c.getAzimuthalAngle(), distance: () => camera.position.distanceTo(c.target) };
    return undefined;
  }, [camera]);

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableZoom={zoom}
      enableDamping={!reduced}
      dampingFactor={0.09}
      rotateSpeed={0.75}
      zoomSpeed={0.8}
      minPolarAngle={15 * DEG}
      maxPolarAngle={80 * DEG}
      onStart={() => {
        // the visitor takes over: stop gliding, keep whatever distance they are at
        if (move.current) {
          const dist = move.current.to.dist;
          move.current = null;
          limits(dist);
        }
        onStart?.();
      }}
    />
  );
}

// Camera for the calculator scene (docs/06 §5.1): FOV 30°, orbit with damping, polar 15°–80°, no pan
// (so the view can never go below the ground), zoom limits scaled to the plot, and an automatic
// 0.6 s re-frame whenever the land or the model's height changes.
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ROAD_DEPTH } from '../../lib/calc/geometry.ts';
import { roadReach } from '../kits/calcModels.js';

const DEG = Math.PI / 180;
export const FOV = 30;
// Front-left: the key light comes from the upper left, slightly behind, so this side shows a lit flank,
// a softly shaded street front and the shadow falling toward the viewer.
const HOME_AZ = -42 * DEG;
const HOME_POLAR = 52 * DEG;
const FRAME = 0.6; // seconds
const MARGIN = 0.9; // the scene fills this share of the panel, leaving room for labels

/** World points that must stay in view: land, road, dimension lines, and the model with its top label. */
export function fitPoints(scene, height) {
  const { P, L } = scene.land;
  const u = scene.u;
  const pts = [
    [-P / 2 - 1.5 * u, 0, 0], [-P / 2 - 1.5 * u, 0, -L], [P / 2, 0, -L],
    [-P / 2, 0, ROAD_DEPTH + 1.5 * u], [P / 2, 0, ROAD_DEPTH + 1.5 * u],
    [-P / 2 - roadReach(P), 0, ROAD_DEPTH], [P / 2 + roadReach(P), 0, ROAD_DEPTH], [P / 2 + roadReach(P), 0, 0],
  ];
  let x0 = -P / 2, x1 = P / 2, z0 = 0, z1 = L;
  if (scene.boxes.length) {
    x0 = Math.min(...scene.boxes.map((b) => b.x - b.w / 2));
    x1 = Math.max(...scene.boxes.map((b) => b.x + b.w / 2));
    z0 = Math.min(...scene.boxes.map((b) => b.z - b.d / 2));
    z1 = Math.max(...scene.boxes.map((b) => b.z + b.d / 2));
  }
  const top = height + 0.8 * u;
  pts.push([x0, top, -z0], [x1 + 1.6 * u, top, -z0], [x0, top, -z1], [x1, top, -z1]);
  return pts;
}

/**
 * Camera target and distance that put the points in the middle of the panel, as large as the margins
 * allow. "bottom" is the share of the panel's height kept free at the bottom (hint and reset button).
 */
export function frameView(points, az, polar, aspect, bottom = 0) {
  const sp = Math.sin(polar), cp = Math.cos(polar), sa = Math.sin(az), ca = Math.cos(az);
  const d = [sp * sa, cp, sp * ca]; // from the target toward the camera
  const r = [ca, 0, -sa];
  const up = [-sa * cp, sp, -ca * cp];
  const tv = Math.tan((FOV * DEG) / 2);
  const th = tv * aspect;
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of points) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); }
  const target = [0, 1, 2].map((i) => (lo[i] + hi[i]) / 2);
  let dist = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) * 3;
  const halfY = MARGIN - bottom; // usable area in NDC: x ±MARGIN, y from −MARGIN + 2·bottom to MARGIN
  for (let n = 0; n < 8; n++) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of points) {
      const rel = [p[0] - target[0], p[1] - target[1], p[2] - target[2]];
      const depth = Math.max(1e-3, dist - dot(rel, d));
      const x = dot(rel, r) / (depth * th), y = dot(rel, up) / (depth * tv);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    const mx = ((x0 + x1) / 2) * dist * th, my = ((y0 + y1) / 2 - bottom) * dist * tv;
    for (let i = 0; i < 3; i++) target[i] += r[i] * mx + up[i] * my;
    dist *= Math.max((x1 - x0) / (2 * MARGIN), (y1 - y0) / (2 * halfY));
  }
  target[1] = Math.max(0, target[1]);
  return { dist, center: target };
}

const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2); // power2.inOut

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
    const az = home ? HOME_AZ : c.getAzimuthalAngle();
    const polar = home ? HOME_POLAR : c.getPolarAngle();
    const fit = frameView(fitPoints(scene, height), az, polar, aspect, Math.min(0.2, 50 / Math.max(1, size.height)));
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

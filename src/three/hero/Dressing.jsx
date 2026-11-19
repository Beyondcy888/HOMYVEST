// Hero story: plot 0's idle dressing (grass tufts and two low bushes). They sink into the ground when
// building starts; the driver in HeroScene writes `anim.current.sink` (0 = standing, 1 = gone).
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildGrass, BUSHES } from './world.js';
import { PLATE_TOP, BUILD_Z } from './camera.js';

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _zero = new THREE.Matrix4().makeScale(0, 0, 0);

/** One tuft: three tapered blades fanning out from a point. Unit height, base at y = 0. */
function tuftGeometry() {
  const blades = [
    [0, 0, 1, 0, 0],
    [0.07, 0.03, 0.78, 0.26, 2.1],
    [-0.05, 0.06, 0.62, 0.3, 4.3],
  ].map(([x, z, h, tilt, dir]) => {
    const g = new THREE.CylinderGeometry(0.014, 0.062, h, 4, 1);
    g.translate(0, h / 2, 0);
    g.rotateZ(tilt);
    g.rotateY(dir);
    g.translate(x, 0, z);
    return g;
  });
  const merged = mergeGeometries(blades);
  blades.forEach((g) => g.dispose());
  return merged;
}

export function Grass({ anim, material, count }) {
  const ref = useRef(null);
  const last = useRef(-1);
  const invalidate = useThree((s) => s.invalidate);
  const data = useMemo(() => buildGrass(count), [count]);
  const geometry = useMemo(() => tuftGeometry(), []);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    last.current = -1;
    if (ref.current) ref.current.frustumCulled = false;
    invalidate();
  }, [data, invalidate]);

  useFrame(() => {
    const mesh = ref.current;
    const sink = anim.current.sink;
    if (!mesh || sink === last.current) return;
    last.current = sink;
    const { pos, size, yaw, lean, order } = data;
    for (let i = 0; i < data.count; i++) {
      // each tuft takes 0.3 of the window, staggered outward from where the first slab lands
      const t = (sink - order[i] * 0.7) / 0.3;
      if (t >= 1) {
        mesh.setMatrixAt(i, _zero);
        continue;
      }
      const k = t <= 0 ? 1 : (1 - t) * (1 - t);
      const w = size[i * 2] * (0.35 + 0.65 * k);
      _p.set(pos[i * 2], PLATE_TOP, pos[i * 2 + 1]);
      _e.set(lean[i * 2], yaw[i], lean[i * 2 + 1], 'YXZ');
      _q.setFromEuler(_e);
      _s.set(w, size[i * 2 + 1] * k, w);
      mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} name="grass" args={[geometry, material, data.count]} castShadow />;
}

const blob = new THREE.IcosahedronGeometry(1, 2);
const BUSH_FAR = 13;

export function Bushes({ anim, material }) {
  const ref = useRef(null);
  const last = useRef(-1);
  useLayoutEffect(() => {
    last.current = -1;
  }, []);
  useFrame(() => {
    const mesh = ref.current;
    const sink = anim.current.sink;
    if (!mesh || sink === last.current) return;
    last.current = sink;
    BUSHES.forEach(([x, y, z, r], i) => {
      const order = Math.min(1, Math.hypot(x, z - BUILD_Z) / BUSH_FAR);
      const t = (sink - order * 0.7) / 0.3;
      const k = t <= 0 ? 1 : t >= 1 ? 0 : (1 - t) * (1 - t);
      _p.set(x, PLATE_TOP + (y - PLATE_TOP) * k, z);
      _s.set(r * (0.4 + 0.6 * k), r * 0.62 * k, r * (0.4 + 0.6 * k));
      mesh.setMatrixAt(i, k === 0 ? _zero : _m.compose(_p, _q.identity(), _s));
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} name="bushes" args={[blob, material, BUSHES.length]} castShadow receiveShadow frustumCulled={false} />;
}

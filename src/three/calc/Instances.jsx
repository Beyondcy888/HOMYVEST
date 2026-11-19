// One InstancedMesh per kind of part, with a fixed capacity: the engine's current parts are written
// into it every frame something moved, and `count` says how many are live. Nothing is remounted when
// the numbers change, so nothing can flicker.
import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { resolve } from './engine.js';

export const unitBox = new THREE.BoxGeometry(1, 1, 1);

/** Unit gable roof: 1 × 1 × 1, ridge along x at the top, eaves along the two long sides. */
export const unitRoof = (() => {
  const A = [-0.5, -0.5, -0.5], B = [0.5, -0.5, -0.5], C = [0.5, -0.5, 0.5], D = [-0.5, -0.5, 0.5], E = [-0.5, 0.5, 0], F = [0.5, 0.5, 0];
  const tris = [D, C, F, D, F, E, B, A, E, B, E, F, A, D, E, C, B, F, A, B, C, A, C, D];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals();
  return g;
})();

/** Grass tuft: a small three-sided spike standing on y = 0. */
export const unitTuft = (() => {
  const g = new THREE.ConeGeometry(0.5, 1, 3, 1, true);
  g.translate(0, 0.5, 0);
  return g;
})();

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qRidgeZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
const _zero = new THREE.Matrix4().makeScale(0, 0, 0);
const _box = { x: 0, y: 0, z: 0, sx: 0, sy: 0, sz: 0 };
const EMPTY = [];

/**
 * Draws the engine's parts of one `kind`.
 *  - engine:   ref to the engine (engine.js)
 *  - tones:    { tone: THREE.Color } for per-instance clay tones, or null
 * Parts with no visible size are hidden (a collapsed plate must not leave a sliver).
 */
export default function Instances({ engine, kind, geometry = unitBox, material, capacity, tones = null, castShadow = false, receiveShadow = true, renderOrder = 0 }) {
  const ref = useRef(null);
  const seen = useRef(-1);
  const tonesSeen = useRef(null);
  // A new mesh starts empty and is filled on the next frame.
  const attach = useCallback((mesh) => {
    if (mesh && !mesh.userData.calcReady) {
      mesh.userData.calcReady = true;
      mesh.count = 0;
      seen.current = -1;
    }
    ref.current = mesh;
  }, []);

  useFrame(() => {
    const E = engine.current;
    const mesh = ref.current;
    if (!E || !mesh) return;
    const changed = seen.current !== E.version || tonesSeen.current !== tones;
    if (!E.dirty && !changed) return;
    const list = E.buckets[kind] || EMPTY;
    const n = Math.min(list.length, capacity);
    for (let i = 0; i < n; i++) {
      const st = list[i];
      if (!resolve(st, _box) || _box.sy < 1e-5) {
        mesh.setMatrixAt(i, _zero);
        continue;
      }
      _p.set(_box.x, _box.y, _box.z);
      if (st.ridge === 'z') {
        _s.set(_box.sz, _box.sy, _box.sx);
        _m.compose(_p, _qRidgeZ, _s);
      } else {
        _s.set(_box.sx, _box.sy, _box.sz);
        _m.compose(_p, _q, _s);
      }
      mesh.setMatrixAt(i, _m);
    }
    mesh.count = n;
    mesh.instanceMatrix.clearUpdateRanges();
    mesh.instanceMatrix.addUpdateRange(0, n * 16);
    mesh.instanceMatrix.needsUpdate = true;
    if (changed) {
      if (tones) {
        for (let i = 0; i < n; i++) mesh.setColorAt(i, tones[list[i].tone] ?? tones.base);
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
      seen.current = E.version;
      tonesSeen.current = tones;
    }
  });

  // The material is a prop, not a constructor argument: a theme change swaps it without rebuilding the mesh.
  return (
    <instancedMesh
      ref={attach}
      name={`calc-${kind}`}
      args={[geometry, undefined, capacity]}
      material={material}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
      renderOrder={renderOrder}
    />
  );
}

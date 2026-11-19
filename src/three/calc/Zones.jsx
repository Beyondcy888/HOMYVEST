// The ground of the calculator scene (docs/05 §9.2–9.3, docs/06 §5.2), styled like the 2D legend:
//   open  = the land plate itself: --paper-2 with dots (whatever is not building or green is open)
//   green = --zone-green, with small instanced grass tufts (density by area, at most 400)
//   road  = an ink strip in front of the plot, with a kerb and a dashed centre line (those are clay boxes)
// The building's clay pad, the parking bays and the parcel outlines are drawn by Model.jsx and Lines.jsx.
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { tuftLayout, ZONE_H } from '../kits/calcModels.js';
import Instances, { unitTuft } from './Instances.jsx';

const TUFT_CAP = 400;
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _y = new THREE.Vector3(0, 1, 0);

function Tufts({ engine, scene, material }) {
  const ref = useRef(null);
  const seen = useRef(null);
  // Positions are normalised inside each green part and seeded by index, so the grass never reshuffles.
  const tufts = useMemo(() => tuftLayout(scene.ground.filter((p) => p.role === 'green'), { cap: TUFT_CAP }), [scene]);

  useFrame(() => {
    const E = engine.current;
    const mesh = ref.current;
    if (!E || !mesh) return;
    if (!E.dirty && seen.current === tufts) return;
    seen.current = tufts;
    const size = Math.min(1.3, Math.max(0.22, E.u.v * 0.2));
    let n = 0;
    for (let i = 0; i < tufts.length && n < TUFT_CAP; i++) {
      const t = tufts[i];
      const st = E.ground.get(t.key);
      if (!st) continue;
      const g = st.geo.v;
      const a = st.alpha.v;
      _p.set(g[0] + (t.u - 0.5) * g[2] * 0.94, ZONE_H * a, -(g[1] + (t.v - 0.5) * g[3] * 0.9));
      _q.setFromAxisAngle(_y, t.rot);
      _s.set(size * 0.42 * t.s * a, size * t.s * a, size * 0.42 * t.s * a);
      mesh.setMatrixAt(n++, _m.compose(_p, _q, _s));
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} name="calc-tufts" args={[unitTuft, undefined, TUFT_CAP]} material={material} count={0} frustumCulled={false} receiveShadow />;
}

export default function Zones({ engine, scene, materials }) {
  return (
    <>
      <Instances engine={engine} kind="plate" material={materials.plate} capacity={2} />
      <Instances engine={engine} kind="green" material={materials.green} capacity={512} />
      <Instances engine={engine} kind="hatchflat" material={materials.hatchFlat} capacity={4} />
      <Instances engine={engine} kind="dark" material={materials.dark} capacity={4} />
      <Tufts engine={engine} scene={scene} material={materials.tuft} />
    </>
  );
}

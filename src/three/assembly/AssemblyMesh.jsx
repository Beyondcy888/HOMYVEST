// Draws a prepared kit (see pieces.js): one InstancedMesh per kind, so a whole building is 2–5 draw calls.
// Pieces glide from their scattered start transform and settle: quartic ease-out for position,
// quintic for rotation. No bounce, no overshoot.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { pieceT } from './pieces.js';
import { clayTones } from '../shared/ClayMaterials.js';

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 20, 1);

/** Which unit geometry each kind uses. Custom kinds default to a box. */
const SHAPES = { box: 'box', dark: 'box', glass: 'box', cyl: 'cyl', darkcyl: 'cyl' };

// Scratch objects: nothing is allocated inside useFrame.
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qa = new THREE.Quaternion();
const _qb = new THREE.Quaternion();
const _e = new THREE.Euler();
const _zero = new THREE.Matrix4().makeScale(0, 0, 0);

function Bucket({ kind, bucket, material, shape, stages, tones, castShadow, receiveShadow, grow = 0.15 }) {
  const ref = useRef(null);
  const lastT = useMemo(() => new Float32Array(bucket.count).fill(-1), [bucket]);
  const invalidate = useThree((s) => s.invalidate);

  // Pre-compute start and final quaternions once.
  const quats = useMemo(() => {
    const a = new Float32Array(bucket.count * 4);
    const b = new Float32Array(bucket.count * 4);
    for (let i = 0; i < bucket.count; i++) {
      _e.set(bucket.startEuler[i * 3], bucket.startEuler[i * 3 + 1], bucket.startEuler[i * 3 + 2], 'YXZ');
      _q.setFromEuler(_e).toArray(a, i * 4);
      _e.set(0, bucket.yaw[i], 0, 'YXZ');
      _q.setFromEuler(_e).toArray(b, i * 4);
    }
    return { a, b };
  }, [bucket]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    lastT.fill(-1);
    if (tones) {
      const c = new THREE.Color();
      for (let i = 0; i < bucket.count; i++) mesh.setColorAt(i, c.copy(tones[bucket.tone[i]] ?? tones.base));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    for (let i = 0; i < bucket.count; i++) mesh.setMatrixAt(i, _zero);
    mesh.instanceMatrix.needsUpdate = true;
    // Instances travel far from their final spot while assembling: skip per-mesh frustum culling.
    mesh.frustumCulled = false;
    invalidate();
  }, [bucket, tones, lastT, invalidate]);

  useFrame(() => {
    const mesh = ref.current;
    const sp = stages.current;
    if (!mesh || !sp) return;
    let dirty = false;
    const { final, start, size, order, stage, flags, count } = bucket;
    for (let i = 0; i < count; i++) {
      const t = pieceT(sp[stage[i]] ?? 0, order[i]);
      if (t === lastT[i]) continue;
      lastT[i] = t;
      dirty = true;
      if (t <= 0) {
        mesh.setMatrixAt(i, _zero);
        continue;
      }
      const i3 = i * 3;
      const inv = 1 - t;
      const ep = 1 - inv * inv * inv * inv; // position: 1 − (1 − t)^4
      const er = 1 - inv * inv * inv * inv * inv; // rotation: 1 − (1 − t)^5
      if (flags[i] === 1) {
        // grow in place from the ground (trees, people)
        const g = ep;
        _p.set(final[i3], final[i3 + 1] - (size[i3 + 1] * (1 - g)) / 2, final[i3 + 2]);
        _qb.fromArray(quats.b, i * 4);
        _s.set(size[i3] * g, size[i3 + 1] * g, size[i3 + 2] * g);
        _m.compose(_p, _qb, _s);
      } else {
        _p.set(
          start[i3] + (final[i3] - start[i3]) * ep,
          start[i3 + 1] + (final[i3 + 1] - start[i3 + 1]) * ep,
          start[i3 + 2] + (final[i3 + 2] - start[i3 + 2]) * ep,
        );
        _qa.fromArray(quats.a, i * 4);
        _qb.fromArray(quats.b, i * 4);
        _q.slerpQuaternions(_qa, _qb, er);
        // materialise over the first moments of the flight so nothing pops into view
        const k = t < grow ? t / grow : 1;
        const sc = k * k * (3 - 2 * k);
        _s.set(size[i3] * sc, size[i3 + 1] * sc, size[i3 + 2] * sc);
        _m.compose(_p, _q, _s);
      }
      mesh.setMatrixAt(i, _m);
    }
    if (dirty) mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={ref}
      name={`assembly-${kind}`}
      args={[shape === 'cyl' ? unitCyl : unitBox, material, bucket.count]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}

/**
 * <AssemblyMesh kit={prepare(pieces)} stages={ref} materials={createClayMaterials()} />
 *
 *  - kit:       from prepare()
 *  - stages:    ref to a Float32Array (or array) of stage progress values 0..1, updated by the scene's
 *               own useFrame. Give that driver a NEGATIVE priority (useFrame(cb, -1)) so it runs first.
 *  - materials: from createClayMaterials(); kinds map to: box/cyl → clay (with per-instance tones),
 *               dark/darkcyl → dark, glass → glass. Pass `materialFor` to map custom kinds.
 *  - shapes:    optional { kind: 'box' | 'cyl' } for custom kinds
 */
export default function AssemblyMesh({ kit, stages, materials, materialFor, shapes, castShadow = true, receiveShadow = true, grow }) {
  const tones = useMemo(() => clayTones(), []);
  const pick = (kind) => {
    const custom = materialFor?.(kind);
    if (custom) return custom;
    if (kind === 'dark' || kind === 'darkcyl') return materials.dark;
    if (kind === 'glass') return materials.glass;
    if (kind === 'green') return materials.green;
    return materials.clay;
  };
  useEffect(() => () => undefined, []);
  return (
    <group>
      {Object.entries(kit.kinds).map(([kind, bucket]) => {
        const material = pick(kind);
        const toned = material === materials.clay;
        const isGlass = kind === 'glass';
        return (
          <Bucket
            key={kind}
            kind={kind}
            bucket={bucket}
            material={material}
            shape={shapes?.[kind] ?? SHAPES[kind] ?? 'box'}
            stages={stages}
            tones={toned ? tones : null}
            castShadow={castShadow && !isGlass}
            receiveShadow={receiveShadow && !isGlass}
            grow={grow}
          />
        );
      })}
    </group>
  );
}

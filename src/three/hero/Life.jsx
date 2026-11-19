// Hero story, beat 4: small people and cars. Both are driven by `anim.current.life` (0 → 1 across the
// beat, written by the driver in HeroScene), so they run backwards when the page scrolls back.
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildPeople, CARS } from './people.js';

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qFlip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const _zero = new THREE.Matrix4().makeScale(0, 0, 0);
const outQuart = (t) => 1 - (1 - t) ** 4;
const window01 = (v, a, len) => (v <= a ? 0 : v >= a + len ? 1 : (v - a) / len);

/** A capsule-like figure, 1.7 m: a tapered body and a head. Feet at y = 0. */
function personGeometry() {
  const body = new THREE.CylinderGeometry(0.15, 0.25, 1.26, 10, 1).translate(0, 0.63, 0);
  const head = new THREE.SphereGeometry(0.2, 12, 8).translate(0, 1.5, 0);
  const merged = mergeGeometries([body, head]);
  body.dispose();
  head.dispose();
  return merged;
}

/** A clay model car, nose toward +x: body, cabin and four wheels. */
function carGeometry() {
  const parts = [new THREE.BoxGeometry(4.3, 0.72, 1.8).translate(0, 0.62, 0), new THREE.BoxGeometry(2.3, 0.58, 1.6).translate(-0.25, 1.27, 0)];
  for (const x of [-1.35, 1.35]) {
    for (const z of [-0.82, 0.82]) parts.push(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14).rotateX(Math.PI / 2).translate(x, 0.34, z));
  }
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return merged;
}

export function People({ anim, material, density = 1 }) {
  const ref = useRef(null);
  const last = useRef(-1);
  const people = useMemo(() => {
    const all = buildPeople();
    const n = Math.max(10, Math.round(all.length * density));
    if (n >= all.length) return all;
    // keep the characteristic ones (players, café guests), then thin the rest evenly
    const rest = all.slice(8);
    return [...all.slice(0, 8), ...Array.from({ length: n - 8 }, (_, i) => rest[Math.floor((i * rest.length) / (n - 8))])];
  }, [density]);
  const geometry = useMemo(() => personGeometry(), []);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    last.current = -1;
  }, [people]);

  useFrame(() => {
    const mesh = ref.current;
    const life = anim.current.life;
    if (!mesh || life === last.current) return;
    last.current = life;
    mesh.visible = life > 0;
    if (!mesh.visible) return;
    for (let i = 0; i < people.length; i++) {
      const o = people[i];
      const t = window01(life, o.delay * 0.4, 0.25);
      if (t <= 0) {
        mesh.setMatrixAt(i, _zero);
        continue;
      }
      const g = outQuart(t) * o.h;
      const walk = (life - 0.5) * o.range;
      _p.set(o.x + o.dx * walk, o.y, o.z + o.dz * walk);
      _s.set(g, g, g);
      mesh.setMatrixAt(i, _m.compose(_p, _q.identity(), _s));
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} name="people" args={[geometry, material, people.length]} castShadow frustumCulled={false} visible={false} />;
}

export function Cars({ anim, material }) {
  const ref = useRef(null);
  const last = useRef(-1);
  const geometry = useMemo(() => carGeometry(), []);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    last.current = -1;
  }, []);

  useFrame(() => {
    const mesh = ref.current;
    const life = anim.current.life;
    if (!mesh || life === last.current) return;
    last.current = life;
    mesh.visible = life > 0;
    if (!mesh.visible) return;
    for (let i = 0; i < CARS.length; i++) {
      const c = CARS[i];
      const t = window01(life, c.delay * 0.6, 0.42);
      if (t <= 0) {
        mesh.setMatrixAt(i, _zero);
        continue;
      }
      // glide in and settle; materialise over the first moments so nothing pops into view
      const k = Math.min(1, t / 0.22);
      const g = k * k * (3 - 2 * k);
      _p.set(c.x - c.dir * c.travel * (1 - outQuart(t)), 0.1, c.z);
      _s.set(g, g, g);
      mesh.setMatrixAt(i, _m.compose(_p, c.dir > 0 ? _q.identity() : _qFlip, _s));
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} name="cars" args={[geometry, material, CARS.length]} castShadow receiveShadow frustumCulled={false} visible={false} />;
}

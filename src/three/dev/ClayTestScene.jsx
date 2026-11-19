// Reference scene for the shared foundation. It shows how a scene is put together:
// builder (pure) → sequence() → prepare() → <AssemblyMesh>, driven by a damped scroll progress.
// Open: /dev.html?scene=claytest&p=1
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import SceneCanvas from '../shared/SceneCanvas.jsx';
import { Environment, Lights, Ground, PaperFog } from '../shared/Stage.jsx';
import { createClayMaterials } from '../shared/ClayMaterials.js';
import AssemblyMesh from '../assembly/AssemblyMesh.jsx';
import { box, sequence, prepare } from '../assembly/pieces.js';
import { useTheme } from '../../lib/theme.js';

/** A small two-storey block with real window openings, its top floor left open (no roof). */
export function buildTestBlock({ w = 18, d = 10, floors = 2, fh = 3.2 } = {}) {
  const groups = [];
  const t = 0.2;
  for (let f = 0; f < floors; f++) {
    const y0 = f * fh;
    groups.push([box([w, t, d], [0, y0 + t / 2, 0], { tone: 'slab' })]);
    const walls = [];
    const bay = 3;
    const bays = Math.round(w / bay);
    for (const z of [-d / 2 + t / 2, d / 2 - t / 2]) {
      for (let i = 0; i < bays; i++) {
        const x0 = -w / 2 + i * bay;
        // solid 0.7 · window 1.6 · solid 0.7; sill + lintel leave a real gap
        walls.push(box([0.7, fh - t, t], [x0 + 0.35, y0 + t + (fh - t) / 2, z], { tone: 'wall' }));
        walls.push(box([0.7, fh - t, t], [x0 + bay - 0.35, y0 + t + (fh - t) / 2, z], { tone: 'wall' }));
        walls.push(box([1.6, 0.9, t], [x0 + 1.5, y0 + t + 0.45, z], { tone: 'wall' }));
        walls.push(box([1.6, 0.5, t], [x0 + 1.5, y0 + fh - 0.25, z], { tone: 'wall' }));
        walls.push({ kind: 'glass', size: [1.6, fh - t - 1.4, 0.04], pos: [x0 + 1.5, y0 + t + 0.9 + (fh - t - 1.4) / 2, z] });
      }
    }
    for (const x of [-w / 2 + t / 2, w / 2 - t / 2]) walls.push(box([t, fh - t, d - 2 * t], [x, y0 + t + (fh - t) / 2, 0], { tone: 'wall' }));
    groups.push(walls);
    const parts = [];
    for (let i = 1; i < bays; i++) parts.push(box([0.12, fh - t, d / 2 - 1.2], [-w / 2 + i * bay, y0 + t + (fh - t) / 2, -d / 4 - 0.3], { tone: 'soft' }));
    parts.push({ kind: 'dark', size: [3, fh - t, 4], pos: [w / 2 - 1.8, y0 + t + (fh - t) / 2, d / 2 - 2.3] });
    groups.push(parts);
  }
  return sequence(groups, { seed: 7 });
}

function Model({ progress }) {
  const theme = useTheme();
  const materials = useMemo(() => createClayMaterials(theme), [theme]);
  useEffect(() => () => materials.dispose(), [materials]);
  const kit = useMemo(() => prepare(buildTestBlock(), { seed: 11 }), []);
  const stages = useRef(new Float32Array(1));
  const state = useRef({ p: 0 });

  // The driver runs first (priority −1): it damps toward the scroll progress, then the mesh reads it.
  useFrame((three, delta) => {
    const moving = easing.damp(state.current, 'p', progress.current, 0.12, delta);
    stages.current[0] = state.current.p;
    if (moving) three.invalidate();
  }, -1);

  return (
    <>
      <AssemblyMesh kit={kit} stages={stages} materials={materials} />
      <mesh position={[0, -0.05, 6]} receiveShadow>
        <boxGeometry args={[30, 0.1, 30]} />
        <primitive object={materials.solid} attach="material" />
      </mesh>
    </>
  );
}

const q = (name, fallback) => {
  const v = new URLSearchParams(window.location.search).get(name);
  return v === null ? fallback : Number(v);
};

export default function ClayTestScene({ progress, onReady }) {
  // Tuning aids: ?env=0.15&hemi=1.7&key=2.7&exp=1&sh=0.13&tm=neutral
  const env = q('env', 0.15), hemi = q('hemi', 1.7), key = q('key', 2.7), exp = q('exp', 1), sh = q('sh', 0.13);
  return (
    <SceneCanvas name="claytest" progress={progress} onReady={onReady} exposure={exp} toneMapping={new URLSearchParams(window.location.search).get("tm") || "neutral"} camera={{ fov: 22, position: [-52, 46, 62], near: 1, far: 600 }}>
      <Environment intensity={env} />
      <Lights target={[0, 2, 0]} bounds={26} distance={90} intensity={key} fill={hemi} />
      <Ground shadowOpacity={sh} />
      <PaperFog near={120} far={320} />
      <Model progress={progress} />
      <CameraAim />
    </SceneCanvas>
  );
}

function CameraAim() {
  useFrame(({ camera }) => camera.lookAt(0, 3, 1));
  return null;
}

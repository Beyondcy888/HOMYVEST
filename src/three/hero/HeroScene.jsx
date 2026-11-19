// The hero story (docs/06 §2): an idle plot beside a road becomes a hybrid stay, the camera swipes to
// three neighbouring plots (office, café, sports court), then pulls up to the whole street as it comes
// to life. Everything is a pure function of the damped scroll progress, so it plays backwards too.
//
//   /dev.html?scene=hero&p=0.3&ui=0
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import SceneCanvas from '../shared/SceneCanvas.jsx';
import { Environment, Lights, KEY_DIRECTION } from '../shared/Stage.jsx';
import { createClayMaterials } from '../shared/ClayMaterials.js';
import AssemblyMesh from '../assembly/AssemblyMesh.jsx';
import { prepare } from '../assembly/pieces.js';
import { cssVar, useTheme } from '../../lib/theme.js';
import { useTier, isCoarsePointer } from '../../lib/device/tier.js';
import { span } from '../../lib/scroll/progress.js';
import { buildStay } from '../kits/stay.js';
import { buildOffice } from '../kits/office.js';
import { buildCafe } from '../kits/cafe.js';
import { buildSports } from '../kits/sports.js';
import { BEATS, BUILD_Z, FOV, PLATE_TOP, PLOT, ROW_CENTRE, cameraAt, createRig } from './camera.js';
import { buildStakes, buildStreet } from './world.js';
import { createStreetUniform, withStreetFog } from './streetFog.js';
import { Bushes, Grass } from './Dressing.jsx';

const CAMERA = { fov: FOV, near: 30, far: 600, position: [-60, 66, 70] };
const SHADOW_BOUNDS = 80;
const LIGHT_DISTANCE = 140;
const LIGHT_TARGET = [0, 0, -6];

// Scratch objects: nothing is allocated inside useFrame.
const _cam = { x: 0, y: 0, z: 0, az: 0, el: 0, dist: 100 };
const _v = new THREE.Vector3();
const smooth = (t) => t * t * (3 - 2 * t);

// The shadow camera's right and up axes on the ground plane. The light's follow point is snapped to
// whole shadow texels along them, so shadow edges do not crawl while the camera travels.
const LIGHT_AXES = (() => {
  const dir = new THREE.Vector3(...KEY_DIRECTION).normalize();
  const right = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
  const up = dir.clone().cross(right).normalize();
  return { rx: right.x, rz: right.z, ux: up.x, uz: up.z, det: right.x * up.z - right.z * up.x };
})();

function snapToShadowTexels(x, z, texel, out) {
  const { rx, rz, ux, uz, det } = LIGHT_AXES;
  const u = Math.round((rx * x + rz * z) / texel) * texel;
  const v = Math.round((ux * x + uz * z) / texel) * texel;
  out.x = (u * uz - rz * v) / det;
  out.z = (rx * v - ux * u) / det;
}

function buildKits() {
  const at = (i) => [PLOT.xs[i], PLATE_TOP, BUILD_Z];
  const pieces = [
    ...buildStay({ origin: at(0), stage: 0 }),
    ...buildOffice({ origin: at(1), stage: 1 }),
    ...buildCafe({ origin: at(2), stage: 2 }),
    ...buildSports({ origin: at(3), stage: 3 }),
  ];
  // Panes that must not cast shadows or take the standard glass material go to a second mesh.
  const soft = (p) => p.kind === 'curtain' || p.kind === 'court' || p.kind === 'mesh';
  return {
    solid: prepare(pieces.filter((p) => !soft(p)), { seed: 31, spread: 0.85 }),
    soft: prepare(pieces.filter(soft), { seed: 32, spread: 0.85 }),
  };
}

function Scene({ progress, onAnchor }) {
  const theme = useTheme();
  const tier = useTier();
  const { camera, gl, scene, size } = useThree();
  const root = useRef(null);

  const uStreet = useMemo(() => createStreetUniform(), []);
  const uSway = useMemo(() => ({ value: 0 }), []);
  const sway = tier.name === 'high';

  const materials = useMemo(() => {
    const set = createClayMaterials(theme);
    Object.values(set).forEach((m) => m?.isMaterial && withStreetFog(m, uStreet));
    const extra = {
      // office curtain wall: warms gently, stays see-through
      curtain: withStreetFog(set.glass.clone(), uStreet),
      // padel-court glass and mesh screens never warm
      court: withStreetFog(set.glass.clone(), uStreet),
      mesh: withStreetFog(set.glass.clone(), uStreet),
      grass: withStreetFog(new THREE.MeshStandardMaterial({ color: new THREE.Color(cssVar('--clay') || '#eeece6').multiplyScalar(0.94), roughness: 0.95 }), uStreet, sway ? uSway : null),
      shadow: withStreetFog(new THREE.ShadowMaterial({ transparent: true, opacity: theme === 'dark' ? 0.3 : 0.13 }), uStreet),
    };
    extra.court.emissiveIntensity = 0;
    extra.mesh.emissiveIntensity = 0;
    extra.mesh.opacity *= 0.6;
    const base = { opacity: set.glass.opacity };
    const dispose = () => {
      set.dispose();
      Object.values(extra).forEach((m) => m.dispose());
    };
    return { ...set, ...extra, base, dispose };
  }, [theme, uStreet, uSway, sway]);
  useEffect(() => () => materials.dispose(), [materials]);

  // The page colour, in three's fog (so everything outside the street window is exactly paper).
  useEffect(() => {
    scene.fog = new THREE.Fog(cssVar('--paper') || '#fafaf7', 17, 28);
    return () => {
      scene.fog = null;
    };
  }, [scene, theme]);

  const kits = useMemo(() => buildKits(), []);
  const street = useMemo(() => prepare(buildStreet(), { seed: 1 }), []);
  const stakes = useMemo(() => prepare(buildStakes({ stage: 0, line: size.width / size.height < 0.9 ? 0.09 : 0.055 }), { seed: 2 }), [size.width, size.height]);

  const stages = useRef(new Float32Array(4));
  const fixed = useRef(new Float32Array([1]));
  const stakeStage = useRef(new Float32Array([1]));
  const follow = useRef({ x: 0, z: LIGHT_TARGET[2] });
  const anim = useRef({ p: progress.current, pc: progress.current, sink: 0 });
  const rig = useMemo(() => createRig(size.width / size.height), [size.width, size.height]);
  const view = useRef({ w: 0, h: 0, rig: null });
  const anchor = useRef({ x: -1, y: -1 });
  const blur = useRef(0);
  const lastX = useRef(null);
  const canBlur = tier.name !== 'low' && !isCoarsePointer();
  const texel = (2 * SHADOW_BOUNDS) / (tier.shadowMap || 1024);
  const materialFor = useMemo(() => (kind) => (kind === 'curtain' ? materials.curtain : kind === 'court' ? materials.court : kind === 'mesh' ? materials.mesh : null), [materials]);

  useEffect(
    () => () => {
      gl.domElement.style.filter = '';
    },
    [gl],
  );

  // The driver: runs before the meshes (priority −1) so they read fresh values in the same frame.
  useFrame((state, delta) => {
    const a = anim.current;
    const dt = Math.min(delta, 0.1);
    const moving1 = easing.damp(a, 'p', progress.current, 0.12, dt, Infinity, undefined, 0.00005);
    const moving2 = easing.damp(a, 'pc', progress.current, 0.18, dt, Infinity, undefined, 0.00005);
    const p = a.p;

    // assembly
    stages.current[0] = span(p, BEATS.build[0], BEATS.build[1]);
    for (let i = 0; i < 3; i++) stages.current[i + 1] = span(p, BEATS.assemble[i][0], BEATS.assemble[i][1]);
    a.sink = span(p, BEATS.sink[0], BEATS.sink[1]);
    stakeStage.current[0] = 1 - span(p, BEATS.sink[0], BEATS.sink[0] + 0.045);

    // camera
    cameraAt(a.pc, rig, _cam);
    const ce = Math.cos(_cam.el);
    camera.position.set(_cam.x + _cam.dist * Math.sin(_cam.az) * ce, _cam.y + _cam.dist * Math.sin(_cam.el), _cam.z + _cam.dist * Math.cos(_cam.az) * ce);
    camera.lookAt(_cam.x, _cam.y, _cam.z);
    camera.near = _cam.dist * 0.4;
    camera.far = _cam.dist * 2.2 + 160;
    const vw = view.current;
    if (vw.w !== size.width || vw.h !== size.height || vw.rig !== rig) {
      vw.w = size.width;
      vw.h = size.height;
      vw.rig = rig;
      // shift the picture so the camera target lands in the part of the stage kept free for the model
      camera.setViewOffset(size.width, size.height, (0.5 - rig.cx) * size.width, (0.5 - rig.cy) * size.height, size.width, size.height);
    }
    camera.updateProjectionMatrix();

    // the light's shadow box travels with the camera target
    snapToShadowTexels(_cam.x, _cam.z, texel, follow.current);

    // street fog: one plot in focus, then the whole street
    const wide = smooth(span(a.pc, BEATS.pull[0], BEATS.pull[0] + 0.07));
    uStreet.value.x = _cam.x;
    if (scene.fog) {
      scene.fog.near = 16.5 + (98 - 16.5) * wide;
      scene.fog.far = 27 + (130 - 27) * wide;
    }

    // windows warm up only in the "alive" beat
    const warm = smooth(span(p, BEATS.warm[0], BEATS.warm[1]));
    materials.glass.emissiveIntensity = warm * 1.15;
    materials.glass.opacity = materials.base.opacity + (0.92 - materials.base.opacity) * warm;
    materials.curtain.emissiveIntensity = warm * 0.9;
    materials.curtain.opacity = materials.base.opacity + (0.42 - materials.base.opacity) * warm;

    // grass sway: the only time-driven motion, on the high tier and only while the plot is idle
    const idle = sway && a.pc < BEATS.idle[1] && !document.hidden;
    if (idle) uSway.value = state.clock.elapsedTime;

    // where the stay sits on screen (the photo's wipe opens from here)
    if (onAnchor && a.pc > 0.6) {
      _v.set(PLOT.xs[0], 7, BUILD_Z).project(camera);
      const ax = (_v.x + 1) / 2;
      const ay = (1 - _v.y) / 2;
      if (Math.abs(ax - anchor.current.x) > 0.002 || Math.abs(ay - anchor.current.y) > 0.002) {
        anchor.current.x = ax;
        anchor.current.y = ay;
        onAnchor(ax, ay);
      }
    }

    // a touch of blur while the camera swipes sideways, proportional to its real speed
    if (canBlur) {
      let px = 0;
      const inSwipe = a.pc > BEATS.swipes[0][0] && a.pc < BEATS.swipes[2][1] + 0.01;
      if (inSwipe && lastX.current !== null && dt > 0) {
        const metresPerPx = (2 * Math.tan((FOV * Math.PI) / 360) * _cam.dist) / size.height;
        const speed = Math.abs(_cam.x - lastX.current) / metresPerPx / dt; // px per second
        px = Math.min(5, speed * 0.0028);
      }
      lastX.current = _cam.x;
      const next = px < 0.4 ? 0 : Math.round(px * 4) / 4;
      if (next !== blur.current) {
        blur.current = next;
        gl.domElement.style.filter = next ? `blur(${next}px)` : '';
      }
    }

    // once the photo covers the stage there is nothing to draw
    if (root.current) root.current.visible = a.pc < BEATS.dissolve[1] + 0.012;

    if (moving1 || moving2 || idle) state.invalidate();
  }, -1);

  return (
    <>
      <Environment />
      <Lights target={LIGHT_TARGET} bounds={SHADOW_BOUNDS} distance={LIGHT_DISTANCE} softness={3} follow={follow} />
      <group ref={root}>
        {tier.shadows ? (
          <mesh rotation-x={-Math.PI / 2} position={[ROW_CENTRE[0], 0, ROW_CENTRE[2]]} receiveShadow>
            <planeGeometry args={[520, 240]} />
            <primitive object={materials.shadow} attach="material" />
          </mesh>
        ) : null}
        <AssemblyMesh kit={street} stages={fixed} materials={materials} castShadow={false} />
        <AssemblyMesh kit={stakes} stages={stakeStage} materials={materials} />
        <Grass anim={anim} material={materials.grass} count={Math.round(620 * tier.density)} />
        <Bushes anim={anim} material={materials.solid} />
        <AssemblyMesh kit={kits.solid} stages={stages} materials={materials} />
        {kits.soft.count ? <AssemblyMesh kit={kits.soft} stages={stages} materials={materials} materialFor={materialFor} castShadow={false} receiveShadow={false} /> : null}
      </group>
    </>
  );
}

function HeroScene({ progress, onReady, onAnchor }) {
  return (
    <SceneCanvas name="hero" progress={progress} onReady={onReady} camera={CAMERA}>
      <Scene progress={progress} onAnchor={onAnchor} />
    </SceneCanvas>
  );
}

export default memo(HeroScene);

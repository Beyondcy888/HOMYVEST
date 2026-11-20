// The Maxone walkthrough: a coloured, softly lit architectural model of the hotel lobby and dining room,
// walked by a first-person camera on scroll (docs/06 §3). The room is procedural (plan.js → room.js),
// the route is pure maths (route.js) shared with the mini-map and the render cards.
//
//   /dev.html?scene=maxone&p=0.2&ui=0          one moment of the walk
//   /dev.html?scene=maxone&p=1&debug=maxone    trace mode: the plan at 50% over the model, path and stops
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import SceneCanvas from '../shared/SceneCanvas.jsx';
import { Environment } from '../shared/Stage.jsx';
import { useTier } from '../../lib/device/tier.js';
import { cssVar, useTheme } from '../../lib/theme.js';
import { query } from '../../lib/storage.js';
import { variantUrl } from '../../components/media/Img.jsx';
import { COLOURS as C, PLAN } from './plan.js';
import { pathPolyline, routeAt, stopPositions } from './route.js';
import { buildRoom } from './room.js';
import { UPPER_TYPES, blobs, buildUnits, instanced, placeFurniture } from './furniture.js';
import { blobTexture, deckTexture, herringboneTexture, lineArtTexture, muralTexture, signTexture, tileTexture } from './textures.js';

const GLASS_OPACITY = 0.13;
// Sun from the south-east, 38° up: it comes in through the street glazing, the entrance wall and the skylight.
const SUN = new THREE.Vector3(0.55, 0.62, 0.56).normalize();
const SUN_TARGET = [14.5, 0, 9.5];

/** Everything three.js: geometry, materials, meshes. Built once; nothing here depends on React. */
function createWorld(debug) {
  const bin = [];
  const track = (x) => {
    bin.push(x);
    return x;
  };
  const tex = {
    tiles: track(tileTexture()),
    herring: track(herringboneTexture()),
    deck: track(deckTexture()),
    mural: track(muralTexture()),
    lineart: track(lineArtTexture()),
    signs: track(signTexture()),
    blob: track(blobTexture()),
  };
  const std = (o) => track(new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o }));
  // glass is an unlit tint: a lit pane turns milky in the sun and hides the room behind it
  const glass = () => track(new THREE.MeshBasicMaterial({ color: C.glass, transparent: true, opacity: GLASS_OPACITY, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  const mats = {
    lower: std({ vertexColors: true }),
    // always in the transparent pass (the shader must keep its alpha), opaque until the camera rises
    upper: std({ vertexColors: true, transparent: true }),
    glass: glass(),
    glassUp: glass(),
    glow: track(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })),
    glowUp: track(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, transparent: true })),
    tiles: std({ map: tex.tiles, roughness: 0.82 }),
    herring: std({ map: tex.herring, roughness: 0.8 }),
    deck: std({ map: tex.deck }),
    mural: std({ map: tex.mural, side: THREE.DoubleSide }),
    lineart: std({ map: tex.lineart }),
    signs: std({ map: tex.signs, roughness: 0.7 }),
  };

  const group = new THREE.Group();
  const upper = [];
  const lists = {};
  const place = (type, item) => (lists[type] ||= []).push(item);
  const kit = buildRoom(place);
  placeFurniture(place);

  for (const name of kit.names()) {
    const mesh = new THREE.Mesh(track(kit.merged(name)), mats[name]);
    const up = name === 'upper' || name === 'glassUp' || name === 'glowUp';
    mesh.name = name;
    mesh.castShadow = name === 'lower' || name === 'upper';
    mesh.receiveShadow = !/glass|glow/.test(name);
    mesh.renderOrder = /glass/.test(name) ? 3 : up ? 2 : 0;
    if (up) upper.push(mesh);
    group.add(mesh);
  }

  const units = buildUnits();
  for (const [type, geometry] of Object.entries(units)) {
    const list = lists[type];
    if (!list?.length) {
      geometry.dispose();
      continue;
    }
    const up = UPPER_TYPES.includes(type);
    const mesh = track(instanced(track(geometry), up ? mats.upper : mats.lower, list));
    mesh.name = type;
    if (up) {
      mesh.renderOrder = 2;
      upper.push(mesh);
    }
    group.add(mesh);
  }

  // soft floor shadows under the furniture
  const blobMat = track(new THREE.MeshBasicMaterial({ map: tex.blob, color: '#000000', transparent: true, opacity: 0.4, depthWrite: false, toneMapped: false }));
  const blobMesh = instanced(
    track(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)),
    blobMat,
    blobs().map(([x, z, w, d]) => ({ x, y: 0.012, z, sx: w, sz: d })),
    { shadow: false },
  );
  blobMesh.receiveShadow = false;
  blobMesh.renderOrder = 1;
  group.add(blobMesh);

  // The floor plan, at true scale on the floor. At the end of the walk a veil in the page colour and then
  // the plan fade in over everything (no depth test), so the model dissolves into the drawing. In trace
  // mode the same plane sits over the model at 50%.
  const veilMat = track(new THREE.MeshBasicMaterial({ color: '#fafaf7', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false }));
  const veil = new THREE.Mesh(track(new THREE.PlaneGeometry(1600, 1600).rotateX(-Math.PI / 2)), veilMat);
  veil.position.set(PLAN.w / 2, 0.015, PLAN.h / 2);
  veil.renderOrder = 10;
  veil.visible = false;
  const planMat = track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false }));
  const plan = new THREE.Mesh(track(new THREE.PlaneGeometry(PLAN.w, PLAN.h).rotateX(-Math.PI / 2)), planMat);
  plan.position.set(PLAN.w / 2, 0.02, PLAN.h / 2);
  plan.renderOrder = 11;
  plan.visible = false;
  group.add(veil, plan);

  if (debug) {
    // the camera path and the stops, drawn over everything
    const pts = pathPolyline(0.1).map(([x, z]) => new THREE.Vector3(x, 0.05, z));
    const lineMat = track(new THREE.LineBasicMaterial({ color: '#e0241b', depthTest: false, toneMapped: false }));
    const line = new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(pts)), lineMat);
    line.renderOrder = 20;
    group.add(line);
    const dotGeo = track(new THREE.SphereGeometry(0.16, 12, 8));
    const dotMat = track(new THREE.MeshBasicMaterial({ color: '#e0241b', depthTest: false, toneMapped: false }));
    for (const s of stopPositions()) {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(s.x, 0.1, s.z);
      dot.renderOrder = 21;
      group.add(dot);
    }
  }

  return {
    group,
    tex,
    planMat,
    veilMat,
    setUpper(v) {
      mats.upper.opacity = v;
      mats.glowUp.opacity = v;
      mats.glassUp.opacity = GLASS_OPACITY * v;
      const on = v > 0.004;
      for (const m of upper) m.visible = on;
    },
    setPlan(v, withVeil) {
      planMat.opacity = v;
      plan.visible = v > 0.002;
      veilMat.opacity = withVeil ? v : 0;
      veil.visible = withVeil && v > 0.002;
    },
    dispose() {
      for (const x of bin) x.dispose();
    },
  };
}

function Room({ progress }) {
  const tier = useTier();
  const theme = useTheme();
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const debug = useMemo(() => query('debug') === 'maxone', []);
  const world = useMemo(() => createWorld(debug), [debug]);
  const sun = useRef(null);
  const state = useRef({ p: null, frames: 0, route: {} });
  // &shift=0 keeps the picture centred (dev aid for comparing a stop with its render)
  const view = useMemo(() => ({ aspect: 1.6, shift: query('shift') !== '0' }), []);

  useEffect(() => () => world.dispose(), [world]);

  // Texture quality, the mural lettering (redrawn once Archivo is loaded) and the plan image.
  useEffect(() => {
    let alive = true;
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    for (const t of Object.values(world.tex)) {
      t.anisotropy = aniso;
      t.needsUpdate = true;
    }
    document.fonts
      ?.load('800 40px "Archivo Variable"')
      .then(() => {
        if (!alive) return;
        world.tex.mural.userData.redraw();
        world.tex.signs.userData.redraw();
        invalidate();
      })
      .catch(() => {});
    const planTex = new THREE.TextureLoader().load(variantUrl('maxone/layout', 1600), () => alive && invalidate());
    planTex.colorSpace = THREE.SRGBColorSpace;
    planTex.anisotropy = aniso;
    world.planMat.map = planTex;
    world.planMat.needsUpdate = true;
    return () => {
      alive = false;
      world.planMat.map = null;
      planTex.dispose();
    };
  }, [world, gl, invalidate]);

  // The veil is the page itself: it follows the theme.
  useEffect(() => {
    world.veilMat.color.set(cssVar('--paper') || '#fafaf7');
    invalidate();
  }, [world, theme, invalidate]);

  // The sun never moves, so its shadow map is drawn once (docs/06 §3.5).
  useLayoutEffect(() => {
    const l = sun.current;
    if (!l) return;
    l.target.position.set(SUN_TARGET[0], SUN_TARGET[1], SUN_TARGET[2]);
    l.position.set(SUN_TARGET[0] + SUN.x * 60, SUN.y * 60, SUN_TARGET[2] + SUN.z * 60);
    l.target.updateMatrixWorld();
    const cam = l.shadow.camera;
    cam.left = -25;
    cam.right = 25;
    cam.top = 22;
    cam.bottom = -22;
    cam.near = 1;
    cam.far = 130;
    cam.updateProjectionMatrix();
    l.shadow.autoUpdate = false;
    l.shadow.needsUpdate = true;
    state.current.frames = 0;
    invalidate();
  }, [tier.shadows, tier.shadowMap, invalidate]);

  // The camera drives everything and runs first.
  useFrame((three, delta) => {
    const s = state.current;
    const target = progress?.current ?? 0;
    if (s.p === null) s.p = target;
    // A far jump (a stop button on the mini-map, the skip link, an anchor link) cuts straight to the new place
    // instead of sweeping the camera through walls on the way there.
    if (Math.abs(target - s.p) > 0.12) s.p = target;
    const moving = easing.damp(s, 'p', target, 0.18, Math.min(delta, 0.05), Infinity, undefined, 1e-5);
    const { camera, size } = three;
    view.aspect = size.width / size.height;
    const r = routeAt(s.p, view, s.route);

    camera.position.set(r.position[0], r.position[1], r.position[2]);
    camera.rotation.set(r.pitch, -r.yaw, 0, 'YXZ');
    camera.fov = r.fov;
    // high above the roof the near plane moves out, so the floor and what lies on it never shimmer
    const y = r.position[1];
    camera.near = y < 6 ? 0.1 : Math.min(40, 0.1 + (y - 6) * 0.35);
    // lens shift: the picture slides clear of the render card without changing the perspective
    if (r.shiftX !== 0 || r.shiftY !== 0) camera.setViewOffset(size.width, size.height, -r.shiftX * size.width, r.shiftY * size.height, size.width, size.height);
    else if (camera.view) camera.clearViewOffset();
    camera.updateProjectionMatrix();

    // The first two frames keep the ceiling on whatever the progress, so the one-off shadow map includes it.
    const warm = s.frames < 2;
    if (warm && sun.current) sun.current.shadow.needsUpdate = true;
    s.frames += 1;
    world.setUpper(warm ? 1 : r.upper);
    world.setPlan(debug ? 0.5 : r.plan, !debug);

    if (moving || warm) three.invalidate();
  }, -1);

  const size = tier.shadowMap || 1024;
  // Without shadow maps (low tier) the sun would light the rooms through the ceiling: keep it to a hint.
  const sunPower = tier.shadows ? 2.0 : 0.25;
  return (
    <>
      <Environment intensity={0.3} />
      <hemisphereLight args={['#fffaf0', '#cdc6ba', tier.shadows ? 1.6 : 1.8]} />
      {/* a weak fill without shadows, from the north-west: walls that face different ways get different tones */}
      <directionalLight position={[-6, 7, -4]} intensity={0.5} color="#f4f6ff" />
      <directionalLight
        ref={sun}
        color="#fff3e0"
        intensity={sunPower}
        castShadow={tier.shadows}
        shadow-mapSize={[size, size]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
        shadow-radius={3}
      />
      <primitive object={world.group} />
    </>
  );
}

export default function MaxoneScene({ progress, onReady }) {
  return (
    <SceneCanvas name="maxone" progress={progress} onReady={onReady} toneMapping="neutral" exposure={1} camera={{ fov: 55, near: 0.1, far: 700, position: [23, 1.2, 20] }}>
      <Room progress={progress} />
    </SceneCanvas>
  );
}

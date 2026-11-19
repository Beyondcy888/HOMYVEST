// The padel hall: a white-clay model that assembles in three stages; each stage resolves into its
// real render, wiped in over the model (docs/06 §4).
//
// The renders are true isometric views, so one fixed orthographic camera matches all three
// (alignment.js). The renders are DOM images laid over the canvas with a per-image similarity
// transform; the same damped progress drives the model, the zoom, the image position and the wipe,
// so the picture always lands on the model.
//
//   /dev.html?scene=padel&p=0.35            the scene alone
//   /dev.html?scene=padel&p=0.35&debug=padel  the current render at 50 % over the model (fit check)
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import SceneCanvas from '../shared/SceneCanvas.jsx';
import { Environment, Lights, Ground } from '../shared/Stage.jsx';
import { createClayMaterials } from '../shared/ClayMaterials.js';
import AssemblyMesh from '../assembly/AssemblyMesh.jsx';
import { prepare } from '../assembly/pieces.js';
import { buildPadel, roofSection, ROOF, SITE } from '../kits/padel.js';
import { VIEW, unproject, imageBounds, unionBounds } from './alignment.js';
import { REVEALS, stageProgress, stageAt, zoomFactor, slabOpacity } from './timeline.js';
import alignment from '../../content/padel-alignment.json';
import { media } from '../../components/media/Img.jsx';
import { useTheme, cssVar } from '../../lib/theme.js';
import { query } from '../../lib/storage.js';
import { span, easeInOut, easeOutQuart } from '../../lib/scroll/progress.js';
import './PadelScene.css';

const IDS = ['padel-clean/padel-1', 'padel-clean/padel-2', 'padel-clean/padel-3'];
const IMAGES = IDS.map((id) => alignment.images[id]);

// The frame: everything the three renders cover on the camera plane, plus a little air.
const BOUNDS = unionBounds(IMAGES.map((t) => imageBounds(t, t.size)));
const CENTRE = [(BOUNDS.x0 + BOUNDS.x1) / 2, (BOUNDS.y0 + BOUNDS.y1) / 2];
const SPAN = [BOUNDS.x1 - BOUNDS.x0, BOUNDS.y1 - BOUNDS.y0];
const PAD = 1.1;
const TARGET = unproject(CENTRE);
const CAMERA_POSITION = TARGET.map((v, i) => v + VIEW[i] * 220);
// Each image's top-left corner on the camera plane (metres).
const IMG_X0 = IMAGES.map((t) => -t.origin[0] / t.scale);
const IMG_Y1 = IMAGES.map((t) => t.origin[1] / t.scale);

// The wipe travels along the ground's B → R axis: its edge is parallel to the slab's front-left edge.
const WIPE_N = [0.5, -Math.sqrt(3) / 2]; // direction of travel, in CSS px (y down)
const WIPE_D = [Math.sqrt(3) / 2, 0.5]; // along the edge
const FAR = 6000;
// How far the clay model's shadow reaches past the building along the wipe, as a share of the image width.
const SHADOW_REACH = [0.04, 0.09, 0.2];
const wipeS = (x, y) => WIPE_N[0] * x + WIPE_N[1] * y;

const DROP = 62; // metres the roof falls: it starts above the frame
const DEBUG = query('debug') === 'padel';

/** Camera, stage progress, and the DOM renders. Runs first (priority −1), so the meshes read fresh values. */
function Driver({ progress, stages, layers, model, onProject }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const state = useRef({ p: progress.current, fit: 1, key: ['', '', ''], opacity: -1 });

  useLayoutEffect(() => {
    camera.position.set(...CAMERA_POSITION);
    camera.up.set(0, 1, 0);
    camera.lookAt(...TARGET);
    camera.updateMatrixWorld();
  }, [camera]);

  // Layout: the renders get their size from the canvas (recomputed on every resize).
  useLayoutEffect(() => {
    const s = state.current;
    s.fit = Math.min(size.width / (SPAN[0] * PAD), size.height / (SPAN[1] * PAD));
    layers.current.forEach((layer, i) => {
      if (!layer?.img) return;
      const k = s.fit / IMAGES[i].scale; // CSS px per image px at full zoom
      const w = IMAGES[i].size[0] * k;
      layer.img.style.width = `${w.toFixed(2)}px`;
      layer.img.style.height = `${(IMAGES[i].size[1] * k).toFixed(2)}px`;
      const sizes = `${Math.ceil(w)}px`;
      layer.el.querySelectorAll('source').forEach((node) => node.setAttribute('sizes', sizes));
      layer.img.setAttribute('sizes', sizes);
    });
    s.key = ['', '', ''];
    onProject?.({
      zoom: s.fit,
      left: size.width / 2 - (SPAN[0] / 2) * s.fit,
      right: size.width / 2 + (SPAN[0] / 2) * s.fit,
      top: size.height / 2 - (SPAN[1] / 2) * s.fit,
      bottom: size.height / 2 + (SPAN[1] / 2) * s.fit,
    });
    invalidate();
  }, [size.width, size.height, layers, invalidate, onProject]);

  useFrame((three, delta) => {
    const s = state.current;
    // demand-driven frames can be far apart: never let one long gap swallow the glide
    const moving = easing.damp(s, 'p', progress.current, 0.14, Math.min(delta, 1 / 30));
    const p = s.p;
    const st = stages.current;
    st[0] = stageProgress(p, 0);
    st[1] = stageProgress(p, 1);
    st[2] = stageProgress(p, 2);
    st[3] = 1;

    const zoom = s.fit * zoomFactor(p);
    if (camera.zoom !== zoom) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }

    const opacity = DEBUG ? 1 : slabOpacity(p);
    if (opacity !== s.opacity && model.current) {
      s.opacity = opacity;
      model.current.style.opacity = opacity.toFixed(3);
    }

    const current = stageAt(p);
    for (let i = 0; i < 3; i++) {
      const layer = layers.current[i];
      if (!layer?.img) continue;
      const k = zoom / IMAGES[i].scale;
      const left = size.width / 2 + (IMG_X0[i] - CENTRE[0]) * zoom;
      const top = size.height / 2 - (IMG_Y1[i] - CENTRE[1]) * zoom;
      let clip = 'none';
      let visible;
      if (DEBUG) {
        visible = i === current;
      } else {
        const r = REVEALS[i];
        const lead = easeInOut(span(p, r.in[0], r.in[1]));
        const trail = r.out ? easeInOut(span(p, r.out[0], r.out[1])) : 0;
        visible = lead > 0 && trail < 1;
        if (visible && (lead < 1 || trail > 0)) {
          // the band crosses the building and the clay model's shadow, not the empty paper around them
          const origin = wipeS(left, top);
          const a = origin + k * (IMAGES[i].wipe[0] - 0.012 * IMAGES[i].size[0]);
          const b = origin + k * (IMAGES[i].wipe[1] + SHADOW_REACH[i] * IMAGES[i].size[0]);
          const s0 = lead >= 1 ? FAR * 2 : a + (b - a) * lead;
          const s1 = trail <= 0 ? -FAR * 2 : a + (b - a) * trail;
          const ax = WIPE_N[0] * s0, ay = WIPE_N[1] * s0, bx = WIPE_N[0] * s1, by = WIPE_N[1] * s1;
          const dx = WIPE_D[0] * FAR, dy = WIPE_D[1] * FAR;
          clip = `polygon(${(ax + dx).toFixed(1)}px ${(ay + dy).toFixed(1)}px, ${(ax - dx).toFixed(1)}px ${(ay - dy).toFixed(1)}px, ${(bx - dx).toFixed(1)}px ${(by - dy).toFixed(1)}px, ${(bx + dx).toFixed(1)}px ${(by + dy).toFixed(1)}px)`;
        }
      }
      const key = visible ? `${left.toFixed(2)}|${top.toFixed(2)}|${(zoom / s.fit).toFixed(5)}|${clip}` : 'hidden';
      if (key === s.key[i]) continue;
      s.key[i] = key;
      layer.el.style.visibility = visible ? 'visible' : 'hidden';
      if (!visible) continue;
      layer.el.style.clipPath = clip;
      layer.img.style.transform = `translate3d(${left.toFixed(2)}px, ${top.toFixed(2)}px, 0) scale(${(zoom / s.fit).toFixed(5)})`;
    }

    if (moving) three.invalidate();
  }, -1);

  return null;
}

/** A length of the vault between two q positions, as one rigid extrusion (site p0 → p1). */
function shellGeometry(qa, qb, p0, p1, thickness) {
  const pts = roofSection(qa, qb);
  const shape = new THREE.Shape();
  pts.forEach(([q, y], i) => (i ? shape.lineTo(q, y) : shape.moveTo(q, y)));
  for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(pts[i][0], pts[i][1] - thickness);
  shape.closePath();
  return place(new THREE.ExtrudeGeometry(shape, { depth: p1 - p0, bevelEnabled: false }), p0);
}

/** The glazed gable under the vault at the entrance end. */
function gableGeometry(p, qa, qb, y0) {
  const pts = roofSection(qa, qb);
  const shape = new THREE.Shape();
  shape.moveTo(qa, y0);
  pts.forEach(([q, y]) => shape.lineTo(q, Math.max(y0, y - 0.45)));
  shape.lineTo(qb, y0);
  shape.closePath();
  return place(new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false }), p - 0.03);
}

/** Shape space (x = q, y = height, z = distance along p) → world. */
function place(geometry, p0) {
  geometry.rotateY(Math.PI / 2);
  geometry.translate(p0 - SITE.centre[0], 0, SITE.centre[1]);
  return geometry;
}

/** The vault comes down from above the frame as rigid bodies and settles. */
function Roof({ stages, materials, extra }) {
  const refs = useRef({});
  const geo = useMemo(() => {
    const { p0, p1, centreQ, half, glassHalf, strip } = ROOF;
    const q0 = centreQ - half;
    return {
      strip: shellGeometry(q0, q0 + strip, SITE.notch + 0.1, p1, 0.3),
      front: shellGeometry(q0 + strip, centreQ - glassHalf, p0, p1, 0.3),
      back: shellGeometry(centreQ + glassHalf, centreQ + half, p0, p1, 0.3),
      glass: shellGeometry(centreQ - glassHalf, centreQ + glassHalf, p0 + 0.15, p1 - 0.15, 0.08),
      gable: gableGeometry(1.78, 16.4, 37.6, 5.22),
    };
  }, []);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  useFrame(() => {
    const st = stages.current;
    const set = (name, t) => {
      const mesh = refs.current[name];
      if (!mesh) return;
      mesh.visible = t > 0;
      mesh.position.y = (1 - easeOutQuart(t)) * DROP;
    };
    set('strip', span(st[1], 0.5, 0.94));
    set('back', span(st[2], 0, 0.44));
    set('front', span(st[2], 0.08, 0.52));
    set('glass', span(st[2], 0.26, 0.68));
    set('gable', span(st[2], 0.38, 0.78));
  });

  const hold = (name) => (node) => {
    refs.current[name] = node;
  };
  return (
    <group>
      <mesh ref={hold('strip')} geometry={geo.strip} material={extra.roof} castShadow receiveShadow visible={false} />
      <mesh ref={hold('front')} geometry={geo.front} material={extra.roof} castShadow receiveShadow visible={false} />
      <mesh ref={hold('back')} geometry={geo.back} material={extra.roof} castShadow receiveShadow visible={false} />
      <mesh ref={hold('glass')} geometry={geo.glass} material={extra.glass} visible={false} />
      <mesh ref={hold('gable')} geometry={geo.gable} material={extra.glass} visible={false} />
    </group>
  );
}

function Model({ stages }) {
  const theme = useTheme();
  const materials = useMemo(() => createClayMaterials(theme), [theme]);
  useEffect(() => () => materials.dispose(), [materials]);
  // Three tones of its own, all colourless: grey court plates so the courts read at a glance, glass
  // strong enough to show the court walls, and a roof dark that still shows the vault's facets.
  const extra = useMemo(() => {
    const clay = new THREE.Color(cssVar('--clay') || '#eeece6');
    const turf = new THREE.MeshStandardMaterial({ color: clay.clone().multiplyScalar(0.7), roughness: 0.95, metalness: 0 });
    const glass = materials.glass.clone();
    glass.color.multiplyScalar(0.8);
    glass.opacity = theme === 'dark' ? 0.36 : 0.3;
    const roof = materials.dark.clone();
    roof.color.set('#2d2c29');
    roof.roughness = 0.72;
    return { turf, glass, roof };
  }, [materials, theme]);
  useEffect(() => () => Object.values(extra).forEach((m) => m.dispose()), [extra]);
  const kit = useMemo(() => prepare(buildPadel(), { seed: 31, spread: 0.8 }), []);
  const materialFor = useMemo(() => (kind) => (kind === 'turf' ? extra.turf : kind === 'glass' ? extra.glass : null), [extra]);
  return (
    <>
      <AssemblyMesh kit={kit} stages={stages} materials={materials} materialFor={materialFor} />
      <Roof stages={stages} materials={materials} extra={extra} />
    </>
  );
}

export default function PadelScene({ progress, onReady, onProject }) {
  const stages = useRef(new Float32Array(4));
  const layers = useRef([]);
  const model = useRef(null);

  return (
    <div className="padel-scene" data-debug={DEBUG || undefined}>
      <div className="padel-scene__model" ref={model}>
        <SceneCanvas
          name="padel"
          orthographic
          progress={progress}
          onReady={onReady}
          camera={{ position: CAMERA_POSITION, zoom: 10, near: 1, far: 700 }}
        >
          <Environment />
          <Lights target={[0, 2, 0]} bounds={52} distance={150} />
          <Ground y={-SITE.slab} shadowOpacity={0.13} />
          <Driver progress={progress} stages={stages} layers={layers} model={model} onProject={onProject} />
          <Model stages={stages} />
        </SceneCanvas>
      </div>
      {IDS.map((id, i) => {
        const entry = media(id);
        return (
          <picture
            key={id}
            className="padel-reveal"
            aria-hidden="true"
            ref={(el) => {
              layers.current[i] = el ? { el, img: el.querySelector('img') } : null;
            }}
          >
            <source type="image/avif" srcSet={entry.srcset.avif} sizes="60vw" />
            <source type="image/webp" srcSet={entry.srcset.webp} sizes="60vw" />
            <img
              className="padel-reveal__img"
              src={entry.largestUrl}
              width={entry.width}
              height={entry.height}
              alt=""
              decoding="async"
              draggable="false"
              onLoad={(e) => e.currentTarget.decode?.().catch(() => undefined)}
            />
          </picture>
        );
      })}
    </div>
  );
}

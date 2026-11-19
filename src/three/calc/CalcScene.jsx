// The calculator's live 3D scene: a white-clay model of the visitor's land, drawn from the calculator's
// numbers and nothing else (docs/05 §9, docs/06 §5).
//
//   store (useCalc) ─ 120 ms debounce ─▶ describeScene()  pure: parts, levels, labels   kits/calcModels.js
//                                        └▶ engine        keyed tweens: morph, sink, rise    engine.js
//                                           └▶ Zones · Model · Lines · Labels               one frame, on demand
//
// Fills its parent (position: absolute; inset: 0). Props: { onReady }.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import SceneCanvas from '../shared/SceneCanvas.jsx';
import { Environment, Lights, Ground } from '../shared/Stage.jsx';
import { useCalc } from '../../lib/calc/store.ts';
import { useT } from '../../i18n/useT.js';
import { useTheme } from '../../lib/theme.js';
import { useReducedMotion } from '../../lib/device/useReducedMotion.js';
import { session } from '../../lib/storage.js';
import { ROAD_DEPTH } from '../../lib/calc/geometry.ts';
import { describeScene } from '../kits/calcModels.js';
import { createEngine, applyScene, stepEngine } from './engine.js';
import { createCalcMaterials, dotPitch } from './materials.js';
import Zones from './Zones.jsx';
import Model from './Model.jsx';
import Lines from './Lines.jsx';
import Labels from './Labels.jsx';
import Rig, { FOV } from './Rig.jsx';
import './calc-scene.css';

// QA hook for the scene harness (the real page exposes the same store as window.__homyvest.calc).
if (import.meta.env.DEV && typeof window !== 'undefined') window.__calc = useCalc;

const DEBOUNCE = 120; // ms: typing settles before the model morphs
const HINT_KEY = 'homyvest:calc:hint';
const now = () => performance.now() / 1000;

/** The store's values. Numbers are debounced; switching step or idea is immediate. */
function useSceneInput() {
  const land = useCalc((s) => s.land);
  const ideas = useCalc((s) => s.ideas);
  const check = useCalc((s) => s.check);
  const step = useCalc((s) => s.ui.step);
  const selectedIdea = useCalc((s) => s.ui.selectedIdea);
  const [numbers, setNumbers] = useState({ land, ideas, check });
  useEffect(() => {
    const id = window.setTimeout(
      () => setNumbers((prev) => (prev.land === land && prev.ideas === ideas && prev.check === check ? prev : { land, ideas, check })),
      DEBOUNCE,
    );
    return () => window.clearTimeout(id);
  }, [land, ideas, check]);
  return { ...numbers, step, selectedIdea };
}

/** Feeds the engine and keeps frames coming only while something is moving. */
function Driver({ engine, scene, reduced }) {
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const E = engine.current;
    applyScene(E, scene, now(), reduced);
    E.touched = true;
    invalidate();
  }, [engine, scene, reduced, invalidate]);
  useFrame(() => {
    const E = engine.current;
    const moving = stepEngine(E, now());
    E.dirty = moving || E.touched;
    E.touched = false;
    if (moving) invalidate();
  }, -1);
  return null;
}

function World({ engine, scene, reduced, zoom, api, onOrbit }) {
  const theme = useTheme();
  const materials = useMemo(() => createCalcMaterials(theme), [theme]);
  useEffect(() => () => materials.dispose(), [materials]);
  const invalidate = useThree((s) => s.invalidate);
  const { P, L } = scene.land;

  useEffect(() => {
    materials.setScale(dotPitch(Math.hypot(P, L)));
    invalidate();
  }, [materials, P, L, invalidate]);

  // Light and shadow box fitted to the plot and the model (rounded up, so small edits do not re-fit it).
  const stage = useMemo(() => {
    const reach = Math.hypot(P, L + ROAD_DEPTH) / 2 + scene.height * 0.9 + scene.u * 2;
    const bounds = Math.ceil(reach / 5) * 5 + 3;
    return { target: [0, 0, (ROAD_DEPTH - L) / 2], bounds, distance: bounds * 3 };
  }, [P, L, scene.height, scene.u]);

  return (
    <>
      <Environment />
      <Lights target={stage.target} bounds={stage.bounds} distance={stage.distance} />
      <Ground size={stage.bounds * 12} y={-scene.th} position={stage.target} shadowOpacity={0.14} />
      <Driver engine={engine} scene={scene} reduced={reduced} />
      <Zones engine={engine} scene={scene} materials={materials} />
      <Model engine={engine} materials={materials} />
      <Lines engine={engine} materials={materials} reduced={reduced} />
      <Labels engine={engine} scene={scene} />
      <Rig scene={scene} reduced={reduced} zoom={zoom} api={api} onStart={onOrbit} />
    </>
  );
}

export default function CalcScene({ onReady }) {
  const { t } = useT();
  const reduced = useReducedMotion();
  const input = useSceneInput();
  const engine = useRef(null);
  if (!engine.current) engine.current = createEngine();
  const api = useRef(null);

  // The empty state keeps the last valid plot's size for its faint outline, so nothing jumps when a
  // field is cleared and typed again.
  const lastLand = useRef({ P: 30, L: 20 });
  const scene = useMemo(() => {
    const s = describeScene({ ...input, placeholder: lastLand.current });
    if (!s.empty) lastLand.current = s.land;
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.land, input.ideas, input.check, input.step, input.selectedIdea]);

  // Wheel zoom is armed by a click or drag on the model and released when the pointer leaves, so
  // scrolling the page with the pointer over the (sticky) panel never gets trapped. Touch always pinches.
  const [zoom, setZoom] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState(() => session.get(HINT_KEY) !== '1');
  const dismissHint = () => {
    if (!hint) return;
    setHint(false);
    session.set(HINT_KEY, '1');
  };
  useEffect(() => {
    if (!hint) return undefined;
    const id = window.setTimeout(() => setHint(false), 9000);
    return () => window.clearTimeout(id);
  }, [hint]);

  return (
    <div
      className="calc-scene"
      data-dragging={dragging}
      {...(zoom ? { 'data-lenis-prevent-wheel': '' } : {})}
      onPointerDown={(e) => {
        if (e.target.closest?.('button')) return;
        setZoom(true);
        setDragging(true);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onPointerLeave={(e) => {
        setDragging(false);
        if (e.pointerType !== 'touch') setZoom(false);
      }}
    >
      <SceneCanvas name="calc" onReady={onReady} camera={{ fov: FOV, position: [-40, 45, 50], near: 0.5, far: 2000 }}>
        <World engine={engine} scene={scene} reduced={reduced} zoom={zoom} api={api} onOrbit={dismissHint} />
      </SceneCanvas>
      <p className="calc-scene__hint" data-show={hint} aria-hidden={!hint}>
        {t('calc.view.hint')}
      </p>
      <button type="button" className="calc-scene__reset" onClick={() => api.current?.reset()}>
        {t('calc.view.reset')}
      </button>
    </div>
  );
}

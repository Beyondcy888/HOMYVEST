// Labels (docs/06 §5.3): HTML tags on the dimension lines. Paper background, ink text, small type;
// every value goes through the formatters in the active language. A label is hidden when the model
// stands between it and the camera, or when it would overlap a more important one.
//
// Two halves share one ref: <LabelLayer> is plain DOM beside the canvas (real text, always sharp), and
// <Labels> runs inside the canvas and moves those elements to their projected anchors each frame.
// (drei <Html> was tried first: with React 19 StrictMode it logs "synchronously unmount a root" and
// drops a label, so the scene keeps the same idea without the extra React roots.)
import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useT } from '../../i18n/useT.js';
import { fmtArea, fmtMetres, fmtNum } from '../../i18n/format.js';
import { labelPoint, liveInstance } from './engine.js';
import { TAG_LIFT } from './Lines.jsx';

// Most important first: when two labels collide, the later one gives way.
const ORDER = ['front', 'depth', 'area', 'idea', 'nofit', 'floors', 'existing', 'ghost', 'cap', 'green', 'road'];

function labelText(l, t, lang) {
  const floors = (full, partial) => {
    if (full === 0 && partial > 0) return t('calc.r.floors.single', { partial: fmtArea(partial, lang) });
    const base = full === 1 ? t('calc.r.floors.fullOne') : t('calc.r.floors.fullMany', { full: fmtNum(full, lang) });
    return partial > 0 ? `${base} + ${fmtArea(partial, lang)}` : base;
  };
  switch (l.type) {
    case 'front': return t('calc.scene.width', { v: fmtMetres(l.value, lang) });
    case 'depth': return t('calc.scene.depth', { v: fmtMetres(l.value, lang) });
    case 'road': return t('calc.scene.road');
    case 'area': return fmtArea(l.area, lang);
    case 'green': return `${t('calc.legend.green')} ${fmtArea(l.area, lang)}`;
    case 'floors': return floors(l.full, l.partial);
    case 'existing': return `${t('calc.scene.existing')} · ${floors(l.full, l.partial)}`;
    case 'ghost': return `${t('calc.scene.ghost')} · ${floors(l.floors, 0)}`;
    case 'cap': return t('calc.s3.floorsCap', { n: fmtNum(l.n, lang) });
    case 'nofit': return t('calc.s2.fits.none');
    case 'idea':
      if (l.idea === 'kos') return t('calc.s2.fits.kos', { n: fmtNum(l.units, lang) });
      if (l.idea === 'ruko') return t('calc.s2.fits.ruko', { n: fmtNum(l.units, lang), m: fmtArea(l.perUnit, lang) });
      if (l.idea === 'rumah') return t('calc.s2.fits.rumah', { n: fmtNum(l.units, lang) });
      return t('calc.s2.fits.gudang', { m: fmtArea(l.area, lang) });
    default: return '';
  }
}

/** Shared between the two halves: { items, els: { key: element }, state: { key: { w, h, text, shown } } }. */
export const createLabelStore = () => ({ items: [], els: {}, state: {} });

/** The DOM half: render it beside the canvas, inside the scene's root. */
export function LabelLayer({ scene, store }) {
  const { t, lang } = useT();
  const items = useMemo(
    () =>
      scene.labels
        .map((l) => ({ key: l.key, group: l.group ?? l.key, type: l.type, lift: TAG_LIFT[l.type] ?? 0, text: labelText(l, t, lang) }))
        .sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type)),
    [scene, t, lang],
  );
  if (store?.current) store.current.items = items;
  return (
    <div className="calc-labels" aria-hidden="true">
      {items.map((it) => (
        <span
          key={it.key}
          ref={(el) => {
            const S = store?.current;
            if (!S) return;
            if (el) S.els[it.key] = el;
            else { delete S.els[it.key]; delete S.state[it.key]; }
          }}
          className="calc-label"
          data-type={it.type}
        >
          {it.text}
        </span>
      ))}
    </div>
  );
}

const _pt = { x: 0, y: 0, z: 0 };
const _v = new THREE.Vector3();

/** Does the segment from `p` to the camera pass through the box (centre x,z; size w,d; y0..y1)? */
function blocked(p, cam, bx, y0, y1) {
  const lo = [bx.x - bx.w / 2 + 0.06, y0, -bx.z - bx.d / 2 + 0.06];
  const hi = [bx.x + bx.w / 2 - 0.06, y1 - 0.06, -bx.z + bx.d / 2 - 0.06];
  const o = [p.x, p.y, p.z];
  const d = [cam.x - p.x, cam.y - p.y, cam.z - p.z];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < lo[i] || o[i] > hi[i]) return false;
      continue;
    }
    let a = (lo[i] - o[i]) / d[i];
    let b = (hi[i] - o[i]) / d[i];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  return true;
}

/** The canvas half: projects every anchor and decides which labels show. Runs after the camera has moved. */
export default function Labels({ engine, store }) {
  useFrame(({ camera, size }) => {
    const E = engine.current;
    const S = store?.current;
    if (!E?.scene || !S) return; // frames can run before the DOM half exists, or after it has gone
    const inst = liveInstance(E);
    const base = inst?.base ?? [0];
    const at = (i) => base[Math.min(i, base.length - 1)] ?? 0;
    const u = E.u.v;
    const taken = [];
    const groupsShown = new Set();
    for (const it of S.items) {
      const el = S.els[it.key];
      if (!el || !labelPoint(E, it.key, _pt)) continue;
      _pt.y += it.lift * u;
      const st = (S.state[it.key] ??= { w: 0, h: 0, text: null, shown: null, x: null, y: null });
      if (st.text !== it.text) {
        st.text = it.text;
        st.w = el.offsetWidth;
        st.h = el.offsetHeight;
      }
      let show = !groupsShown.has(it.group);
      if (show) {
        for (const bx of E.scene.boxes) {
          if (blocked(_pt, camera.position, bx, at(bx.from), at(bx.to))) { show = false; break; }
        }
      }
      _v.set(_pt.x, _pt.y, _pt.z).project(camera);
      const cx = Math.round((_v.x * 0.5 + 0.5) * size.width);
      const cy = Math.round((-_v.y * 0.5 + 0.5) * size.height);
      if (show) {
        // a label that is already showing needs a little less room to stay, so nothing flickers at the limit
        const pad = st.shown ? 2 : 8;
        const box = [cx - st.w / 2 - pad, cy - st.h / 2 - pad, cx + st.w / 2 + pad, cy + st.h / 2 + pad];
        if (_v.z > 1 || taken.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) show = false;
        else taken.push(box);
      }
      if (show) groupsShown.add(it.group);
      if (st.x !== cx || st.y !== cy) {
        st.x = cx; st.y = cy;
        el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      }
      if (st.shown !== show) {
        st.shown = show;
        el.style.opacity = show ? '1' : '0';
      }
    }
  });
  return null;
}

// Labels (docs/06 §5.3): drei <Html> tags on the dimension lines. Paper background, ink text, small
// type; every value goes through the formatters in the active language. A label is hidden when the
// model stands between it and the camera, or when it would overlap a more important one.
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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

export default function Labels({ engine, scene }) {
  const { t, lang } = useT();
  const items = useMemo(
    () =>
      scene.labels
        .map((l) => ({ key: l.key, group: l.group ?? l.key, type: l.type, lift: TAG_LIFT[l.type] ?? 0, text: labelText(l, t, lang) }))
        .sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type)),
    [scene, t, lang],
  );
  const groups = useRef({});
  const els = useRef({});
  const state = useRef({}); // key → { w, h, text, shown }

  useFrame(({ camera, size }) => {
    const E = engine.current;
    if (!E?.scene) return;
    const inst = liveInstance(E);
    const base = inst?.base ?? [0];
    const at = (i) => base[Math.min(i, base.length - 1)] ?? 0;
    const u = E.u.v;
    const taken = [];
    const groupsShown = new Set();
    for (const it of items) {
      const g = groups.current[it.key];
      const el = els.current[it.key];
      if (!g || !labelPoint(E, it.key, _pt)) continue;
      _pt.y += it.lift * u;
      g.position.set(_pt.x, _pt.y, _pt.z);
      if (!el) continue;
      const st = (state.current[it.key] ??= { w: 0, h: 0, text: null, shown: null });
      if (st.text !== it.text) {
        st.text = it.text;
        st.w = el.offsetWidth;
        st.h = el.offsetHeight;
      }
      let show = !groupsShown.has(it.group);
      // hidden behind the model?
      if (show) {
        for (const bx of E.scene.boxes) {
          if (blocked(_pt, camera.position, bx, at(bx.from), at(bx.to))) { show = false; break; }
        }
      }
      // overlapping a label that matters more? (a shown label needs a little more room to stay: no flicker)
      if (show) {
        _v.set(_pt.x, _pt.y, _pt.z).project(camera);
        const cx = (_v.x * 0.5 + 0.5) * size.width;
        const cy = (-_v.y * 0.5 + 0.5) * size.height;
        const pad = st.shown ? 2 : 8;
        const box = [cx - st.w / 2 - pad, cy - st.h / 2 - pad, cx + st.w / 2 + pad, cy + st.h / 2 + pad];
        if (_v.z > 1 || taken.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) show = false;
        else taken.push(box);
      }
      if (show) groupsShown.add(it.group);
      if (st.shown !== show) {
        st.shown = show;
        el.style.opacity = show ? '1' : '0';
      }
    }
  }, -1);

  return items.map((it) => (
    <group key={it.key} ref={(g) => { groups.current[it.key] = g; }}>
      <Html center zIndexRange={[20, 0]} pointerEvents="none" wrapperClass="calc-label-wrap">
        <span
          ref={(el) => {
            els.current[it.key] = el;
            if (el && state.current[it.key]) { state.current[it.key].shown = null; state.current[it.key].text = null; }
          }}
          className="calc-label"
          data-type={it.type}
          style={{ opacity: 0 }}
        >
          {it.text}
        </span>
      </Html>
    </group>
  ));
}

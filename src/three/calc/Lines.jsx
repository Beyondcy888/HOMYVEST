// Every line in the scene, in five draw calls: the land boundary and dimension lines (ink), the
// footprint outline (ink on clay), parking bays / parcels / loading apron (faint dashes), ghost-floor
// edges (dashes) and the rule highlight (a soft pulse, drawn through the model so it is never hidden).
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ROAD_DEPTH } from '../../lib/calc/geometry.ts';
import { useCalc } from '../../lib/calc/store.ts';
import { ZONE_H } from '../kits/calcModels.js';
import { resolve, labelPoint, liveInstance } from './engine.js';
import { LineSet } from './lines.js';

const _b = { x: 0, y: 0, z: 0, sx: 0, sy: 0, sz: 0 };
const _pt = { x: 0, y: 0, z: 0 };
const EMPTY = [];
/** How far above its anchor a floating tag sits, in units of the dimension offset. */
export const TAG_LIFT = { area: 0.55, idea: 0.55, nofit: 0.4, cap: 1.25 };

export default function Lines({ engine, materials, reduced }) {
  const invalidate = useThree((s) => s.invalidate);
  const sets = useMemo(
    () => ({
      ink: new LineSet({ capacity: 96, width: 1.4 }),
      clay: new LineSet({ capacity: 1024, width: 1.1, opacity: 0.6 }),
      faint: new LineSet({ capacity: 1024, width: 1, opacity: 0.42, dashed: true }),
      ghost: new LineSet({ capacity: 512, width: 1.2, opacity: 0.85, dashed: true }),
      pulse: new LineSet({ capacity: 640, width: 2.6, depthTest: false, renderOrder: 5 }),
    }),
    [],
  );
  useEffect(() => () => Object.values(sets).forEach((s) => s.dispose()), [sets]);
  useEffect(() => {
    sets.ink.material.color.set(materials.ink);
    sets.clay.material.color.set(materials.inkOnClay);
    sets.faint.material.color.set(materials.ink);
    sets.ghost.material.color.set(materials.ink);
    invalidate();
  }, [sets, materials, invalidate]);
  // re-draw when the visitor focuses another rule field
  useEffect(() => useCalc.subscribe((s, prev) => s.focusRule !== prev.focusRule && invalidate()), [invalidate]);

  const seen = useRef({ version: -1, focus: null });

  useFrame(() => {
    const E = engine.current;
    if (!E?.scene) return;
    const focus = useCalc.getState().focusRule;
    const stale = E.dirty || seen.current.version !== E.version || seen.current.focus !== focus;
    if (stale) {
      seen.current.version = E.version;
      seen.current.focus = focus;
      const { ink, clay, faint, ghost, pulse } = sets;
      const u = E.u.v;
      const lift = 0.012 + u * 0.006;
      const tk = u * 0.2;
      ink.begin(); clay.begin(); faint.begin(); ghost.begin(); pulse.begin();
      faint.material.dashSize = u * 0.3; faint.material.gapSize = u * 0.2;
      ghost.material.dashSize = u * 0.3; ghost.material.gapSize = u * 0.2;

      let P = 0;
      let L = 0;
      E.ground.forEach((st) => {
        if (!resolve(st, _b)) return;
        const top = _b.y + _b.sy / 2 + lift;
        if (st.kind === 'plate') {
          P = _b.sx; L = _b.sz;
          ink.rect(_b.x, top, _b.z, _b.sx, _b.sz);
        } else if (st.kind === 'outline') faint.rect(_b.x, ZONE_H + lift * 1.5, _b.z, _b.sx, _b.sz);
        else if (st.role === 'pad') {
          clay.rect(_b.x, top, _b.z, _b.sx, _b.sz);
          if (focus === 'kdb') pulse.rect(_b.x, top, _b.z, _b.sx, _b.sz);
        } else if (focus === 'kdh' && (st.role === 'green' || st.role === 'greenShort')) pulse.rect(_b.x, top, _b.z, _b.sx, _b.sz);
      });
      for (const st of E.buckets.ghost || EMPTY) if (resolve(st, _b) && _b.sy > 0.01) ghost.box(_b.x, _b.y, _b.z, _b.sx, _b.sy, _b.sz);

      const inst = liveInstance(E);
      const base = inst?.base ?? EMPTY;
      const at = (i) => base[Math.min(i, base.length - 1)] ?? 0;
      if (!E.scene.empty && P > 0 && L > 0) {
        // front width, in front of the road; depth, along the left side
        const zf = ROAD_DEPTH + u;
        ink.seg(-P / 2, 0, zf, P / 2, 0, zf);
        ink.seg(-P / 2, 0, zf - tk, -P / 2, 0, zf + tk);
        ink.seg(P / 2, 0, zf - tk, P / 2, 0, zf + tk);
        const xd = -P / 2 - u;
        ink.seg(xd, 0, 0, xd, 0, -L);
        ink.seg(xd - tk, 0, 0, xd + tk, 0, 0);
        ink.seg(xd - tk, 0, -L, xd + tk, 0, -L);
        for (const l of E.scene.labels) {
          if (!labelPoint(E, l.key, _pt)) continue;
          if (l.lv[0] !== l.lv[1]) {
            // height dimension beside the stack
            const y0 = at(l.lv[0]);
            const y1 = at(l.lv[1]);
            if (y1 - y0 < 0.05) continue;
            ink.seg(_pt.x, y0, _pt.z, _pt.x, y1, _pt.z);
            ink.seg(_pt.x - tk, y0, _pt.z, _pt.x + tk, y0, _pt.z);
            ink.seg(_pt.x - tk, y1, _pt.z, _pt.x + tk, y1, _pt.z);
          } else if (TAG_LIFT[l.type] && l.type !== 'nofit') ink.seg(_pt.x, _pt.y, _pt.z, _pt.x, _pt.y + TAG_LIFT[l.type] * u, _pt.z);
        }
      }
      if (focus === 'klb') {
        for (const bx of E.scene.boxes) {
          const y0 = at(bx.from);
          const y1 = at(bx.to);
          if (y1 - y0 > 0.05) pulse.box(bx.x, (y0 + y1) / 2, -bx.z, bx.w, y1 - y0, bx.d);
        }
      }
      ink.end(); clay.end(); faint.end(); ghost.end(); pulse.end();
      // on clay the highlight is dark in both themes; on the ground it follows the theme's ink
      sets.pulse.material.color.set(focus === 'kdh' ? materials.ink : materials.inkOnClay);
    }
    if (focus) {
      const beat = reduced ? 1 : 0.5 + 0.5 * Math.sin((performance.now() / 1000) * ((2 * Math.PI) / 1.5));
      sets.pulse.material.opacity = 0.3 + 0.55 * beat;
      if (!reduced) invalidate();
    }
  });

  return (
    <>
      {Object.entries(sets).map(([name, set]) => (
        <primitive key={name} object={set.object} />
      ))}
    </>
  );
}

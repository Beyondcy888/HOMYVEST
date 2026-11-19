// 2D plan + floor stack (SVG). The fallback when WebGL is unavailable or the 3D fails, and the
// truthful placeholder shown before the 3D has loaded. It draws from the same geometry helpers as
// the 3D, so the picture always matches the numbers (docs/05 §9.6).
import { useT } from '../../i18n/useT.js';
import { fmtArea, fmtMetres, fmtNum } from '../../i18n/format.js';
import {
  bands, maxBuilding, kosModel, rukoModel, housesModel, warehouseModel, existingModel, drawnFloors, parkingBays, ROAD_DEPTH,
} from '../../lib/calc/geometry.ts';

const W = 520;
const H = 360;

/** Builds the list of footprints (plan) and the stack (elevation) for the current step. */
function describe({ r, res, chk, step, idea, land, ideasIn }) {
  const b = bands(r);
  if (step === 3 && chk) {
    const m = existingModel(land, chk);
    return {
      bands: { dFront: 0, dMid: r.L - m.greenDepth, dBack: m.greenDepth },
      plan: [{ x: -m.width / 2, z: m.z0, w: m.width, d: m.depth, hatch: m.broken }],
      stack: { width: m.width, floorH: m.floorHeight, ...drawnFloors(m.full, m.partial), partialRatio: m.depth ? m.partialDepth / m.depth : 0, ghost: m.ghostFloors },
      bays: [],
    };
  }
  if (step === 2 && res && idea) {
    if (idea === 'ruko') {
      const m = rukoModel(r, res, ideasIn);
      return {
        bands: b,
        plan: Array.from({ length: m.units }, (_, i) => ({ x: -m.rowWidth / 2 + i * m.unitWidth, z: m.z0, w: m.unitWidth, d: m.unitDepth })),
        stack: { width: m.rowWidth, floorH: m.upperHeight, ...drawnFloors(m.full, m.partial), partialRatio: m.unitDepth ? m.partialDepth / m.unitDepth : 0, units: m.units },
        bays: parkingBays(r),
      };
    }
    if (idea === 'rumah') {
      const m = housesModel(r, res, ideasIn);
      const plan = [];
      for (let i = 0; i < m.units; i++) {
        const col = i % m.cols;
        const row = Math.floor(i / m.cols);
        const cx = -r.P / 2 + m.parcelW * (col + 0.5);
        const cz = (r.L / m.rows) * (row + 0.5);
        plan.push({ x: cx - m.houseW / 2, z: cz - m.houseD / 2, w: m.houseW, d: m.houseD, parcel: { x: cx - m.parcelW / 2, z: cz - m.parcelD / 2, w: m.parcelW, d: m.parcelD } });
      }
      return { bands: null, plan, stack: { width: m.houseW, floorH: m.floorHeight, ...drawnFloors(m.floorsPerHouse, 0), partialRatio: 0, roof: true }, bays: [] };
    }
    if (idea === 'gudang') {
      const m = warehouseModel(r, res);
      return {
        bands: b,
        plan: m.area > 0 ? [{ x: -m.width / 2, z: m.z0, w: m.width, d: m.depth }] : [],
        stack: { width: m.width, floorH: m.height, ...drawnFloors(m.area > 0 ? 1 : 0, 0), partialRatio: 0 },
        bays: [],
      };
    }
    const m = kosModel(r, res);
    return {
      bands: b,
      plan: [{ x: -m.width / 2, z: m.z0, w: m.width, d: m.depth }],
      stack: { width: m.width, floorH: m.floorHeight, ...drawnFloors(m.full, m.partial), partialRatio: m.depth ? m.partialDepth / m.depth : 0 },
      bays: parkingBays(r),
    };
  }
  const m = maxBuilding(r);
  return {
    bands: b,
    plan: m.fpUsed > 0 ? [{ x: -m.width / 2, z: m.z0, w: m.width, d: m.depth }] : [],
    stack: { width: m.width, floorH: m.floorHeight, ...drawnFloors(m.full, m.partial), partialRatio: m.depth ? m.partialDepth / m.depth : 0 },
    bays: parkingBays(r),
  };
}

export default function Fallback2D({ results, step, idea }) {
  const { t, lang } = useT();
  const { r } = results;

  if (!r) {
    return (
      <div className="plan2d plan2d--empty">
        <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <rect x="130" y="70" width="260" height="170" fill="none" stroke="currentColor" strokeDasharray="4 6" />
          <rect x="60" y="262" width="400" height="34" className="plan2d__road" />
        </svg>
      </div>
    );
  }

  const d = describe({ ...results, step, idea });
  // Plan (top-down, road at the bottom) on the left; floor stack (elevation) on the right.
  const planBox = { x: 28, y: 44, w: 270, h: 250 };
  const scale = Math.min(planBox.w / r.P, (planBox.h - 26) / (r.L + ROAD_DEPTH));
  const pw = r.P * scale;
  const pl = r.L * scale;
  const px0 = planBox.x + (planBox.w - pw) / 2;
  const py0 = planBox.y + (planBox.h - 26 - (pl + ROAD_DEPTH * scale)) / 2;
  // land z = 0 is the road edge, drawn at the bottom
  const X = (x) => px0 + (x + r.P / 2) * scale;
  const Y = (z) => py0 + pl - z * scale;

  const st = d.stack;
  const total = st.full + (st.partial > 0 ? 1 : 0);
  const ghost = st.ghost ?? 0;
  const elevBox = { x: 330, y: 44, w: 164, h: 224 };
  const totalH = Math.max(1, (total + ghost) * st.floorH + (st.roof ? st.floorH * 0.5 : 0));
  const es = Math.min(elevBox.w / Math.max(st.width, 1), elevBox.h / totalH);
  const ew = st.width * es;
  const ex0 = elevBox.x + (elevBox.w - ew) / 2;
  const groundY = elevBox.y + elevBox.h;
  const fh = st.floorH * es;

  return (
    <div className="plan2d">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('calc.scene.fallbackTitle')}>
        <defs>
          <pattern id="p2d-dots" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="currentColor" opacity="0.35" />
          </pattern>
          <pattern id="p2d-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2" height="7" fill="currentColor" />
          </pattern>
        </defs>

        {/* ---- plan ---- */}
        <rect x={X(-r.P / 2) - 14} y={Y(0) + 3} width={pw + 28} height={ROAD_DEPTH * scale} className="plan2d__road" />
        <rect x={X(-r.P / 2)} y={Y(r.L)} width={pw} height={pl} className="plan2d__open" />
        <rect x={X(-r.P / 2)} y={Y(r.L)} width={pw} height={pl} fill="url(#p2d-dots)" />
        {d.bands && d.bands.dBack > 0 ? (
          <rect x={X(-r.P / 2)} y={Y(r.L)} width={pw} height={d.bands.dBack * scale} className="plan2d__green" />
        ) : null}
        {d.bays.map((bay, i) => (
          <rect key={i} x={X(bay.cx - bay.w / 2)} y={Y(bay.z0 + bay.d)} width={bay.w * scale} height={bay.d * scale} className="plan2d__bay" />
        ))}
        {d.plan.map((p, i) => (
          <g key={i}>
            {p.parcel ? <rect x={X(p.parcel.x)} y={Y(p.parcel.z + p.parcel.d)} width={p.parcel.w * scale} height={p.parcel.d * scale} className="plan2d__parcel" /> : null}
            <rect x={X(p.x)} y={Y(p.z + p.d)} width={p.w * scale} height={p.d * scale} className="plan2d__building" />
            {p.hatch ? <rect x={X(p.x)} y={Y(p.z + p.d)} width={p.w * scale} height={p.d * scale} fill="url(#p2d-hatch)" opacity="0.5" /> : null}
          </g>
        ))}
        <rect x={X(-r.P / 2)} y={Y(r.L)} width={pw} height={pl} className="plan2d__boundary" />
        <text x={X(0)} y={Y(0) + ROAD_DEPTH * scale + 20} textAnchor="middle" className="plan2d__label">
          {t('calc.scene.width', { v: fmtMetres(r.P, lang) })}
        </text>
        <text x={X(-r.P / 2) - 10} y={Y(r.L / 2)} textAnchor="middle" className="plan2d__label" transform={`rotate(-90 ${X(-r.P / 2) - 10} ${Y(r.L / 2)})`}>
          {t('calc.scene.depth', { v: fmtMetres(r.L, lang) })}
        </text>

        {/* ---- floor stack ---- */}
        <path d={`M${elevBox.x - 6} ${groundY}H${elevBox.x + elevBox.w + 6}`} className="plan2d__ground" />
        {Array.from({ length: st.full }, (_, i) => (
          <rect key={`f${i}`} x={ex0} y={groundY - (i + 1) * fh} width={ew} height={fh} className="plan2d__floor" />
        ))}
        {st.partial > 0 ? (
          <rect x={ex0} y={groundY - (st.full + 1) * fh} width={ew * Math.max(0.08, st.partialRatio)} height={fh} className="plan2d__floor" />
        ) : null}
        {Array.from({ length: ghost }, (_, i) => (
          <rect key={`g${i}`} x={ex0} y={groundY - (total + i + 1) * fh} width={ew} height={fh} className="plan2d__ghost" />
        ))}
        {st.roof ? <path d={`M${ex0 - 4} ${groundY - total * fh}L${ex0 + ew / 2} ${groundY - total * fh - fh * 0.5}L${ex0 + ew + 4} ${groundY - total * fh}Z`} className="plan2d__floor" /> : null}
        <text x={elevBox.x + elevBox.w / 2} y={groundY + 20} textAnchor="middle" className="plan2d__label">
          {st.capped
            ? t('calc.s3.floorsCap', { n: fmtNum(st.total, lang) })
            : `${fmtNum(st.total, lang)} × ${t('calc.r.floors.label').toLowerCase()}${ghost ? ` + ${fmtNum(ghost, lang)}` : ''}`}
        </text>
        <text x={X(0)} y={planBox.y - 16} textAnchor="middle" className="plan2d__label plan2d__label--strong">
          {fmtArea(r.A, lang)}
        </text>
      </svg>
    </div>
  );
}

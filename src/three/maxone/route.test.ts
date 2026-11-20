// The walk must never brush a wall, a counter or a column, and it must be smooth (docs/06 §3.7).
// Pure maths: no three.js, no rendering.
import { describe, expect, it } from 'vitest';
import { CARDS, DWELLS, PATH_LENGTH, RISE, STOPS, WALK_LENGTH, cardStates, pathPolyline, positionAt, routeAt, stopPositions, topView } from './route.js';
import { LEVEL, PLAN, furnitureCircles, solids } from './plan.js';

type Pt = number[];

function distToSegment(x: number, z: number, a: Pt, b: Pt) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len2 = dx * dx + dz * dz || 1e-9;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / len2));
  return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
}
function inside(x: number, z: number, poly: Pt[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
}
function distToPolygon(x: number, z: number, poly: Pt[]) {
  if (inside(x, z, poly)) return 0;
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) d = Math.min(d, distToSegment(x, z, poly[i], poly[(i + 1) % poly.length]));
  return d;
}
function clearance(x: number, z: number) {
  let best = { d: Infinity, name: '' };
  for (const s of solids() as any[]) {
    const d = s.poly ? distToPolygon(x, z, s.poly) : distToSegment(x, z, s.seg[0], s.seg[1]);
    if (d < best.d) best = { d, name: s.name };
  }
  return best;
}
function furnitureClearance(x: number, z: number) {
  let best = { d: Infinity, name: '' };
  for (const c of furnitureCircles()) {
    const d = Math.hypot(x - c.x, z - c.z) - c.r;
    if (d < best.d) best = { d, name: c.name };
  }
  return best;
}

const STEP = 0.25;
const CLEAR = 0.35;

describe('Maxone route: collisions', () => {
  it('keeps at least 0.35 m from walls, counters and columns, sampled every 0.25 m', () => {
    const p = [0, 0, 0];
    let worst = { d: Infinity, name: '', s: 0 };
    for (let s = 0; s <= WALK_LENGTH + 1e-6; s += STEP) {
      positionAt(Math.min(s, WALK_LENGTH), p);
      const c = clearance(p[0], p[2]);
      if (c.d < worst.d) worst = { ...c, s };
    }
    console.info(`[maxone route] path ${WALK_LENGTH.toFixed(1)} m · tightest wall clearance ${worst.d.toFixed(2)} m (${worst.name}) at ${worst.s.toFixed(2)} m`);
    expect(worst.d, `too close to ${worst.name} at ${worst.s.toFixed(2)} m`).toBeGreaterThanOrEqual(CLEAR);
  });

  it('does not walk through furniture (0.15 m body margin)', () => {
    const p = [0, 0, 0];
    let worst = { d: Infinity, name: '', s: 0 };
    for (let s = 0; s <= WALK_LENGTH + 1e-6; s += STEP) {
      positionAt(Math.min(s, WALK_LENGTH), p);
      const c = furnitureClearance(p[0], p[2]);
      if (c.d < worst.d) worst = { ...c, s };
    }
    console.info(`[maxone route] tightest furniture clearance ${worst.d.toFixed(2)} m (${worst.name}) at ${worst.s.toFixed(2)} m`);
    expect(worst.d, `too close to ${worst.name} at ${worst.s.toFixed(2)} m`).toBeGreaterThanOrEqual(0.15);
  });

  it('rises through the ceiling without drifting into a wall', () => {
    for (let p = RISE.a; p <= RISE.b; p += 0.001) {
      const r = routeAt(p, { aspect: 1.6 });
      if (r.position[1] > LEVEL.ceiling) break;
      const c = clearance(r.position[0], r.position[2]);
      expect(c.d, `rise too close to ${c.name} at p=${p.toFixed(3)}`).toBeGreaterThanOrEqual(CLEAR);
    }
  });

  it('keeps the eye at standing height while walking', () => {
    const p = [0, 0, 0];
    for (let s = 0; s <= WALK_LENGTH; s += STEP) {
      positionAt(s, p);
      // the steps ramp from the street (z 15.8) up to the walkway (z 14.6)
      const k = Math.max(0, Math.min(1, (p[2] - 14.6) / 1.2));
      const floor = LEVEL.street * k;
      expect(p[1] - floor).toBeGreaterThan(1.3);
      expect(p[1] - floor).toBeLessThan(1.8);
    }
  });
});

describe('Maxone route: smoothness', () => {
  for (const aspect of [1.6, 390 / 844]) {
    it(`has no jumps in position, heading or field of view (aspect ${aspect.toFixed(2)})`, () => {
      const dp = 0.0005;
      let prev = routeAt(0, { aspect }, {});
      let maxMove = 0;
      let maxZoom = 0;
      let maxTurn = 0;
      for (let p = dp; p <= 1 + 1e-9; p += dp) {
        const r = routeAt(Math.min(1, p), { aspect }, {});
        const move = Math.hypot(r.position[0] - prev.position[0], r.position[1] - prev.position[1], r.position[2] - prev.position[2]);
        const turn = Math.hypot(r.yaw - prev.yaw, r.pitch - prev.pitch);
        // walking: metres per step. Rising: the picture scales with height, so judge the relative change.
        if (r.rise === 0) maxMove = Math.max(maxMove, move);
        else maxZoom = Math.max(maxZoom, move / Math.max(1.6, r.position[1]));
        maxTurn = Math.max(maxTurn, turn);
        expect(Math.abs(r.fov - prev.fov)).toBeLessThan(0.5);
        expect(Math.abs(r.shiftX - prev.shiftX)).toBeLessThan(0.02);
        prev = r;
      }
      console.info(`[maxone route] aspect ${aspect.toFixed(2)}: per 0.05% of progress, walks ≤ ${(maxMove * 100).toFixed(1)} cm, rises ≤ ${(maxZoom * 100).toFixed(1)}% of its height, turns ≤ ${((maxTurn * 180) / Math.PI).toFixed(2)}°`);
      // 0.0005 of progress is 0.35 vh of scrolling: under 10 cm of walking, 5% of height, 2° of turning per step
      expect(maxMove).toBeLessThan(0.1);
      expect(maxZoom).toBeLessThan(0.05);
      expect(maxTurn).toBeLessThan(0.035);
    });
  }

  it('dwells: the camera drifts less than 0.35 m and holds its view at every stop', () => {
    for (const d of DWELLS) {
      const a = routeAt(d.a, { shift: false }, {});
      const b = routeAt(d.b, { shift: false }, {});
      expect(Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2])).toBeLessThan(0.35);
      expect(Math.abs(a.yaw - b.yaw)).toBeLessThan(0.02);
    }
  });

  it('never whips the view round: under 40° of turning per 1% of progress (7 vh of scroll)', () => {
    let prev = routeAt(0, { shift: false }, {});
    let worst = { v: 0, p: 0 };
    for (let p = 0.002; p <= 1; p += 0.002) {
      const r = routeAt(p, { shift: false }, {});
      const turned = Math.hypot(r.yaw - prev.yaw, r.pitch - prev.pitch) * (180 / Math.PI) * 5;
      if (turned > worst.v) worst = { v: turned, p };
      prev = r;
    }
    console.info(`[maxone route] fastest turn ${worst.v.toFixed(1)}° per 1% of progress at p=${worst.p.toFixed(3)}`);
    expect(worst.v).toBeLessThan(40);
  });
});

describe('Maxone route: the shared contract', () => {
  it('ends straight above the plan, north up, with the plan inside its slot', () => {
    for (const aspect of [1.6, 390 / 844, 2.2]) {
      const r = routeAt(1, { aspect }, {});
      const top = topView(aspect);
      expect(r.position[0]).toBeCloseTo(PLAN.w / 2, 3);
      expect(r.position[2]).toBeCloseTo(PLAN.h / 2, 3);
      expect(r.pitch).toBeCloseTo(-Math.PI / 2, 4);
      expect(Math.cos(r.yaw)).toBeCloseTo(1, 4); // north is up on screen
      expect(r.plan).toBe(1);
      expect(r.upper).toBe(0);
      expect(top.visibleW).toBeGreaterThanOrEqual(PLAN.w - 1e-6);
      expect(top.visibleH).toBeGreaterThanOrEqual(PLAN.h - 1e-6);
    }
  });

  it('keeps the ceiling on for the whole walk and the plan off until the top view', () => {
    for (let p = 0; p <= RISE.a; p += 0.01) {
      const r = routeAt(p, {}, {});
      expect(r.upper).toBe(1);
      expect(r.plan).toBe(0);
    }
  });

  it('reports stops in order and shows each card only around its stop', () => {
    let last = 0;
    for (let p = 0; p <= 1; p += 0.005) {
      const r = routeAt(p, {}, {});
      expect(r.stopIndex).toBeGreaterThanOrEqual(last);
      last = r.stopIndex;
      const states = cardStates(p);
      expect(states.filter((s) => s.presence > 0).length).toBeLessThanOrEqual(1);
    }
    expect(last).toBe(6);
    expect(CARDS.length).toBe(6);
    expect(STOPS.length).toBe(7);
    for (const st of STOPS) expect(routeAt(st.at, {}, {}).stopIndex).toBe(st.index);
  });

  it('gives the mini-map a path and stop positions inside the plan', () => {
    const line = pathPolyline();
    expect(line.length).toBeGreaterThan(100);
    expect(line[line.length - 1][2]).toBeCloseTo(1, 5);
    expect(PATH_LENGTH).toBeGreaterThan(30);
    const stops = stopPositions();
    expect(stops.length).toBe(7);
    for (const s of stops.slice(1)) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(PLAN.w);
      expect(s.z).toBeGreaterThan(0);
      expect(s.z).toBeLessThan(PLAN.h);
    }
  });
});

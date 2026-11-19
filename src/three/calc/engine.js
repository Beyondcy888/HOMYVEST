// The calculator scene's morphing engine. No three.js and no React: it keeps a tweened copy of the
// description produced by kits/calcModels.js and tells the renderers where every part is right now.
//
//  - Parts are matched by key. A part that stays is tweened to its new rectangle (the footprint morphs);
//    a new part grows in; a part that left shrinks away.
//  - A model is a stack of levels. Each level has a grow factor 0..1, and a part's height and position are
//    derived from the levels below it, so floors telescope up from the slab with a small stagger and can
//    never float.
//  - Same model id → morph. Different id (another idea, another step) → the old model sinks into the slab,
//    then the new one rises floor by floor.
//  - Every tween restarts from its current value, so typing never makes anything jump.
//
// World space: x = land x, y = up, z = −(land z). The road edge of the land is z = 0, the road at +z.

export const MORPH = 0.45; // s, footprint and zone changes
export const RISE = 0.5; // s, one floor rising
export const SINK = 0.3; // s, the old model sinking
export const STAGGER = 0.04; // s, between floors
export const POP = 0.28; // s, a single part appearing or leaving

const easeOut = (u) => 1 - (1 - u) ** 4;
const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);

/** A scalar tween that always restarts from where it is. */
class Tw {
  constructor(v) { this.v = v; this.a = v; this.b = v; this.t0 = 0; this.dur = 0; this.ease = easeOut; }
  to(b, now, dur, delay = 0, ease = easeOut) {
    if (b === this.b && (this.v === b || this.dur > 0)) return; // already there, or already on its way
    this.a = this.v; this.b = b; this.t0 = now + delay; this.dur = dur; this.ease = ease;
    if (dur <= 0 && delay <= 0) this.v = b;
  }
  step(now) {
    if (this.v === this.b && now >= this.t0) return false;
    const u = this.dur > 0 ? (now - this.t0) / this.dur : now >= this.t0 ? 1 : 0;
    if (u >= 1) { this.v = this.b; return false; }
    if (u > 0) this.v = this.a + (this.b - this.a) * this.ease(u);
    return true;
  }
}

/** Six numbers (x, z, w, d, y0, h) on one clock. */
class Geo {
  constructor(p) { this.v = [p.x, p.z, p.w, p.d, p.y0 ?? 0, p.h ?? 0]; this.a = this.v.slice(); this.b = this.v.slice(); this.t0 = 0; this.dur = 0; this.done = true; }
  to(p, now, dur) {
    const b = [p.x, p.z, p.w, p.d, p.y0 ?? 0, p.h ?? 0];
    let same = true;
    for (let i = 0; i < 6; i++) if (Math.abs(b[i] - this.b[i]) > 1e-9) same = false;
    if (same) return;
    this.a = this.v.slice(); this.b = b; this.t0 = now; this.dur = dur; this.done = false;
    if (dur <= 0) { this.v = b.slice(); this.done = true; }
  }
  step(now) {
    if (this.done) return false;
    const u = (now - this.t0) / this.dur;
    if (u >= 1) { this.v = this.b.slice(); this.done = true; return false; }
    const e = easeOut(Math.max(0, u));
    for (let i = 0; i < 6; i++) this.v[i] = this.a[i] + (this.b[i] - this.a[i]) * e;
    return true;
  }
}

const makePart = (p, inst, alpha) => ({
  key: p.key, kind: p.kind, tone: p.tone, role: p.role, level: p.level, ridge: p.ridge, style: p.style, over: p.over,
  geo: new Geo(p), alpha: new Tw(alpha), inst, leaving: false,
});

export function createEngine() {
  return {
    ground: new Map(), // key → part state (level −1)
    instances: [], // models: the live one, plus any that are still sinking
    labels: new Map(), // key → { geo, lv }
    buckets: {}, // kind → part states, rebuilt whenever membership changes
    version: 0, // bumps when buckets change (renderers then refresh colours and counts)
    dirty: true, // true on frames where something moved
    scene: null,
    u: new Tw(1),
    th: new Tw(0.4),
    started: false,
  };
}

function rebuild(E) {
  const buckets = {};
  const add = (st) => (buckets[st.kind] ??= []).push(st);
  E.ground.forEach(add);
  for (const inst of E.instances) inst.parts.forEach(add);
  E.buckets = buckets;
  E.version += 1;
}

function sink(inst, now, instant) {
  if (inst.dying) return;
  inst.dying = true;
  for (const lv of inst.levels) lv.g.to(0, now, instant ? 0 : SINK, 0, easeInOut);
}

/** Point the engine at a new scene description. `instant` skips every animation (reduced motion, first frame). */
export function applyScene(E, scene, now, instant = false) {
  const first = !E.started;
  E.started = true;
  const snap = instant || first;
  const morph = snap ? 0 : MORPH;
  E.scene = scene;
  E.u.to(scene.u, now, morph);
  E.th.to(scene.th, now, morph);

  // ---- ground: plate, road, zones, pads, outlines ----
  const seen = new Set();
  for (const p of scene.ground) {
    seen.add(p.key);
    const st = E.ground.get(p.key);
    if (st && st.kind === p.kind) {
      st.geo.to(p, now, morph);
      st.alpha.to(1, now, snap ? 0 : POP);
      st.leaving = false;
      st.tone = p.tone; st.role = p.role; st.style = p.style;
    } else {
      const fresh = makePart(p, null, snap ? 1 : 0);
      fresh.alpha.to(1, now, snap ? 0 : POP);
      E.ground.set(p.key, fresh);
    }
  }
  E.ground.forEach((st, key) => {
    if (seen.has(key)) return;
    st.leaving = true;
    st.alpha.to(0, now, snap ? 0 : POP);
  });

  // ---- model ----
  let inst = E.instances.find((i) => i.id === scene.id);
  const othersStanding = E.instances.some((i) => i !== inst && !i.dying && i.levels.some((l) => l.g.v > 0.02));
  for (const other of E.instances) if (other !== inst) sink(other, now, snap);
  const wait = othersStanding && !snap ? SINK : 0;
  if (!inst) {
    inst = { id: scene.id, levels: [], parts: new Map(), dying: false, base: [0] };
    E.instances.push(inst);
  }
  inst.dying = false;
  const n = scene.levels.length;
  let fresh = 0;
  for (let k = 0; k < n; k++) {
    let lv = inst.levels[k];
    if (!lv) {
      lv = inst.levels[k] = { h: new Tw(scene.levels[k]), g: new Tw(snap ? 1 : 0), leaving: false, born: true };
      lv.g.to(1, now, snap ? 0 : RISE, wait + STAGGER * fresh++);
    } else {
      lv.h.to(scene.levels[k], now, morph);
      lv.leaving = false;
      lv.born = lv.g.v < 0.5;
      if (lv.g.b !== 1 || lv.g.v !== 1) lv.g.to(1, now, snap ? 0 : RISE, wait + (lv.g.v < 1 ? STAGGER * fresh++ : 0));
    }
  }
  for (let k = inst.levels.length - 1, i = 0; k >= n; k--, i++) {
    const lv = inst.levels[k];
    lv.leaving = true;
    lv.g.to(0, now, snap ? 0 : SINK, STAGGER * i, easeInOut);
  }
  const keep = new Set();
  for (const p of scene.parts) {
    keep.add(p.key);
    const st = inst.parts.get(p.key);
    if (st && st.kind === p.kind) {
      st.geo.to(p, now, morph);
      st.alpha.to(1, now, snap ? 0 : POP);
      st.leaving = false;
      st.level = p.level; st.tone = p.tone; st.role = p.role; st.over = p.over; st.ridge = p.ridge;
    } else {
      // parts of a floor that is still rising arrive with it; others grow in on their own
      const withLevel = snap || inst.levels[p.level]?.born;
      const made = makePart(p, inst, withLevel ? 1 : 0);
      made.alpha.to(1, now, snap ? 0 : POP);
      inst.parts.set(p.key, made);
    }
  }
  inst.parts.forEach((st, key) => {
    if (keep.has(key)) return;
    st.leaving = true;
    if (st.level < n) st.alpha.to(0, now, snap ? 0 : POP); // its floor stays: shrink the part away
  });

  // ---- label anchors ----
  const live = new Set();
  for (const l of scene.labels) {
    live.add(l.key);
    const p = { x: l.x, z: l.z, w: 0, d: 0, y0: l.dy ?? 0, h: 0 };
    const st = E.labels.get(l.key);
    if (st) { st.geo.to(p, now, morph); st.lv = l.lv; } else E.labels.set(l.key, { geo: new Geo(p), lv: l.lv });
  }
  E.labels.forEach((_, key) => { if (!live.has(key)) E.labels.delete(key); });

  prune(E);
  rebuild(E);
  E.dirty = true;
}

function prune(E) {
  let changed = false;
  E.ground.forEach((st, key) => {
    if (st.leaving && st.alpha.v <= 0 && st.alpha.b === 0) { E.ground.delete(key); changed = true; }
  });
  for (let i = E.instances.length - 1; i >= 0; i--) {
    const inst = E.instances[i];
    while (inst.levels.length) {
      const top = inst.levels[inst.levels.length - 1];
      if (!((top.leaving || inst.dying) && top.g.v <= 0 && top.g.b === 0)) break;
      inst.levels.pop();
      changed = true;
    }
    inst.parts.forEach((st, key) => {
      if (st.level >= inst.levels.length || (st.leaving && st.alpha.v <= 0 && st.alpha.b === 0)) { inst.parts.delete(key); changed = true; }
    });
    if (inst.dying && inst.levels.length === 0) { E.instances.splice(i, 1); changed = true; }
  }
  return changed;
}

/** Advance every tween to `now` (seconds). Returns true while anything is still moving. */
export function stepEngine(E, now) {
  let active = false;
  if (E.u.step(now)) active = true;
  if (E.th.step(now)) active = true;
  E.ground.forEach((st) => {
    if (st.geo.step(now)) active = true;
    if (st.alpha.step(now)) active = true;
  });
  for (const inst of E.instances) {
    let y = 0;
    inst.base.length = 0;
    for (const lv of inst.levels) {
      if (lv.h.step(now)) active = true;
      if (lv.g.step(now)) active = true;
      inst.base.push(y);
      y += lv.h.v * lv.g.v;
    }
    inst.base.push(y);
    inst.height = y;
    inst.parts.forEach((st) => {
      if (st.geo.step(now)) active = true;
      if (st.alpha.step(now)) active = true;
    });
  }
  E.labels.forEach((l) => { if (l.geo.step(now)) active = true; });
  if (prune(E)) { rebuild(E); active = true; }
  return active;
}

/** The model the scene currently describes (not one that is sinking). */
export const liveInstance = (E) => E.instances.find((i) => !i.dying && i.id === E.scene?.id) ?? null;

/**
 * Where a part is right now, in world metres: writes centre (x, y, z) and size (sx, sy, sz) into `out`.
 * Returns false when the part has no visible size.
 */
export function resolve(st, out) {
  const g = st.geo.v;
  const a = st.alpha.v;
  let y;
  let sy;
  if (st.level >= 0) {
    const lv = st.inst.levels[st.level];
    if (!lv) return false;
    const grow = lv.g.v;
    y = st.inst.base[st.level] + (g[4] + g[5] / 2) * grow;
    sy = g[5] * grow * a;
  } else {
    y = g[4] + g[5] / 2;
    sy = g[5] * a;
  }
  out.x = g[0]; out.y = y; out.z = -g[1];
  out.sx = g[2] * a; out.sy = sy; out.sz = g[3] * a;
  return out.sx > 1e-4 && out.sz > 1e-4;
}

/** World position of a label anchor: halfway between the bases of levels lv[0] and lv[1], plus its offset. */
export function labelPoint(E, key, out) {
  const l = E.labels.get(key);
  if (!l) return false;
  const inst = liveInstance(E);
  const base = inst?.base ?? [0];
  const at = (i) => base[Math.min(i, base.length - 1)] ?? 0;
  out.x = l.geo.v[0];
  out.y = (at(l.lv[0]) + at(l.lv[1])) / 2 + l.geo.v[4];
  out.z = -l.geo.v[1];
  return true;
}

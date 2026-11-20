// A small geometry kit for the Maxone room: every helper adds a vertex-coloured piece to a named bucket,
// and each bucket is merged into ONE geometry (one draw call per material, docs/06 §3.10).
// Plan coordinates as in plan.js: x east, z south, y up, metres.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const KEEP = ['position', 'normal', 'uv', 'color'];
const colour = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const quat = new THREE.Quaternion();
const mat = new THREE.Matrix4();
const euler = new THREE.Euler();

/** Normalise a geometry for merging: non-indexed, position + normal + uv + a flat vertex colour. */
export function paint(geo, hex = '#ffffff') {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const name of Object.keys(g.attributes)) if (!KEEP.includes(name)) g.deleteAttribute(name);
  if (!g.attributes.normal) g.computeVertexNormals();
  const n = g.attributes.position.count;
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  const arr = new Float32Array(n * 3);
  colour.set(hex);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = colour.r;
    arr[i * 3 + 1] = colour.g;
    arr[i * 3 + 2] = colour.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  g.clearGroups();
  return g;
}

/** Points of a thick arc (a closed polygon in plan): angles in radians, x = cx + r·cos a, z = cz + r·sin a. */
export function arcBand(cx, cz, r0, r1, a0, a1, seg = 10) {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const a = a0 + ((a1 - a0) * i) / seg;
    pts.push([cx + Math.cos(a) * r1, cz + Math.sin(a) * r1]);
  }
  for (let i = seg; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / seg;
    pts.push([cx + Math.cos(a) * r0, cz + Math.sin(a) * r0]);
  }
  return pts;
}

/** Trace a rectangle with optional rounded corners onto a Shape or Path. r = { bl, br, tr, tl } */
export function traceRect(path, x0, y0, x1, y1, { bl = 0, br = 0, tr = 0, tl = 0 } = {}) {
  path.moveTo(x0 + bl, y0);
  path.lineTo(x1 - br, y0);
  if (br) path.absarc(x1 - br, y0 + br, br, -Math.PI / 2, 0, false);
  path.lineTo(x1, y1 - tr);
  if (tr) path.absarc(x1 - tr, y1 - tr, tr, 0, Math.PI / 2, false);
  path.lineTo(x0 + tl, y1);
  if (tl) path.absarc(x0 + tl, y1 - tl, tl, Math.PI / 2, Math.PI, false);
  path.lineTo(x0, y0 + bl);
  if (bl) path.absarc(x0 + bl, y0 + bl, bl, Math.PI, Math.PI * 1.5, false);
  return path;
}
export const rectShape = (x0, y0, x1, y1, r) => traceRect(new THREE.Shape(), x0, y0, x1, y1, r);
export const rectHole = (x0, y0, x1, y1, r) => traceRect(new THREE.Path(), x0, y0, x1, y1, r);

/** A vertical strip along a plan polyline, facing left-hand-normal (−dz, dx); u runs along it, v up. */
export function ribbonGeometry(pts, y0, y1, uv = [0, 0, 1, 1]) {
  const pos = [];
  const nor = [];
  const uvs = [];
  let total = 0;
  const lens = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    lens.push(l);
    total += l;
  }
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const l = lens[i] || 1e-6;
    const nx = -(bz - az) / l;
    const nz = (bx - ax) / l;
    const u0 = uv[0] + ((uv[2] - uv[0]) * acc) / total;
    acc += lens[i];
    const u1 = uv[0] + ((uv[2] - uv[0]) * acc) / total;
    pos.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y0, az, bx, y1, bz, ax, y1, az);
    for (let k = 0; k < 6; k++) nor.push(nx, 0, nz);
    uvs.push(u0, uv[1], u1, uv[1], u1, uv[3], u0, uv[1], u1, uv[3], u0, uv[3]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return g;
}

function planarUV(g, { ox = 0, oz = 0, sx = 1, sz = 1 }) {
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (p.getX(i) - ox) / sx;
    uv[i * 2 + 1] = (p.getZ(i) - oz) / sz;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

export class Kit {
  constructor() {
    this.buckets = new Map();
  }
  /** Add any geometry (optionally transformed) in a flat colour. */
  add(bucket, geo, hex, matrix) {
    if (matrix) geo.applyMatrix4(matrix);
    if (!this.buckets.has(bucket)) this.buckets.set(bucket, []);
    this.buckets.get(bucket).push(paint(geo, hex));
    return this;
  }
  box(bucket, x0, y0, z0, x1, y1, z1, hex) {
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return this.add(bucket, g, hex);
  }
  /** Box from a plan rect [x0, z0, x1, z1]. */
  rect(bucket, r, y0, y1, hex) {
    return this.box(bucket, r[0], y0, r[1], r[2], y1, r[3], hex);
  }
  /** Box of size w × h × d centred at (cx, cy, cz), turned by `angle` in plan (radians from +x toward +z). */
  obox(bucket, cx, cy, cz, w, h, d, angle, hex) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.rotateY(-angle);
    g.translate(cx, cy, cz);
    return this.add(bucket, g, hex);
  }
  /** Extrude a plan polygon [[x, z], …] from y0 up to y1. */
  prism(bucket, poly, y0, y1, hex) {
    const shape = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, z)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(Math.PI / 2); // (x, y, z) → (x, −z, y): shape y becomes plan z, the extrusion runs downward
    g.translate(0, y1, 0);
    return this.add(bucket, g, hex);
  }
  cyl(bucket, x, y0, z, r, h, hex, seg = 16, rTop = r) {
    const g = new THREE.CylinderGeometry(rTop, r, h, seg);
    g.translate(x, y0 + h / 2, z);
    return this.add(bucket, g, hex);
  }
  /** Ellipsoid: an icosphere scaled by [sx, sy, sz], optionally rotated (Euler x, y, z). */
  ball(bucket, x, y, z, scale, hex, detail = 1, rot) {
    const g = new THREE.IcosahedronGeometry(1, detail);
    const s = typeof scale === 'number' ? [scale, scale, scale] : scale;
    if (rot) euler.set(rot[0], rot[1], rot[2]);
    else euler.set(0, 0, 0);
    mat.compose(v1.set(x, y, z), quat.setFromEuler(euler), v2.set(s[0], s[1], s[2]));
    return this.add(bucket, g, hex, mat);
  }
  /** Thin cylinder between two points [x, y, z]. */
  rod(bucket, a, b, r, hex, seg = 6) {
    v1.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = v1.length();
    const g = new THREE.CylinderGeometry(r, r, len, seg);
    quat.setFromUnitVectors(UP, v1.normalize());
    mat.compose(v2.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), quat, v1.set(1, 1, 1));
    return this.add(bucket, g, hex, mat);
  }
  /** Tube through 3D points [[x, y, z], …]. */
  tube(bucket, pts, r, hex, { closed = false, seg = pts.length * 3, radial = 6 } = {}) {
    const curve = new THREE.CatmullRomCurve3(
      pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
      closed,
      'centripetal',
    );
    return this.add(bucket, new THREE.TubeGeometry(curve, seg, r, radial, closed), hex);
  }
  /** A flat plate standing in the x–y plane (shape in x, y), from z0, `t` thick toward +z. */
  plate(bucket, shape, z0, t, hex) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 8 });
    g.translate(0, 0, z0);
    return this.add(bucket, g, hex);
  }
  /** A flat plate standing in the z–y plane (shape in z, y), from x0, `t` thick toward +x. */
  plateX(bucket, shape, x0, t, hex) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 8 });
    g.rotateY(-Math.PI / 2); // (x, y, z) → (−z, y, x): shape x becomes plan z
    g.translate(x0 + t, 0, 0);
    return this.add(bucket, g, hex);
  }
  /** Horizontal textured rectangle facing up, with world-space UVs { ox, oz, sx, sz }. */
  floor(bucket, r, y, uv, hex) {
    const g = new THREE.PlaneGeometry(r[2] - r[0], r[3] - r[1]);
    g.rotateX(-Math.PI / 2);
    g.translate((r[0] + r[2]) / 2, y, (r[1] + r[3]) / 2);
    const n = g.toNonIndexed();
    return this.add(bucket, planarUV(n, uv), hex);
  }
  /** Horizontal textured polygon facing up. */
  floorPoly(bucket, poly, y, uv, hex) {
    const shape = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2); // (x, y, 0) → (x, 0, −y)
    g.translate(0, y, 0);
    return this.add(bucket, planarUV(g.toNonIndexed(), uv), hex);
  }
  /** Vertical strip along a plan polyline (see ribbonGeometry). */
  ribbon(bucket, pts, y0, y1, hex, uv) {
    return this.add(bucket, ribbonGeometry(pts, y0, y1, uv), hex);
  }
  merged(bucket) {
    const list = this.buckets.get(bucket);
    if (!list || !list.length) return null;
    const g = mergeGeometries(list, false);
    list.forEach((x) => x.dispose());
    this.buckets.delete(bucket);
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
  names() {
    return [...this.buckets.keys()];
  }
}

/** Small seeded random source (mulberry32), so the room is identical on every visit. */
export function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

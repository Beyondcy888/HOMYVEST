// Furniture for the Maxone room (docs/06 §3.6): each type is built once as a small merged geometry with
// baked vertex colours, then instanced. Units face north (−z); a seat's `rot` is a compass angle (plan.js).
import * as THREE from 'three';
import { Kit, arcBand, prng } from './kit.js';
import * as P from './plan.js';

const C = P.COLOURS;
const D2R = Math.PI / 180;

function unit(build) {
  const k = new Kit();
  build(k);
  return k.merged('u');
}
const LEAVES = [C.leafA, C.leafB, C.leafC];

function navyChair(k) {
  k.cyl('u', 0, 0.43, 0, 0.2, 0.04, C.navyDark, 14);
  for (const [x, z] of [[-0.16, -0.15], [0.16, -0.15], [-0.15, 0.16], [0.15, 0.16]]) k.rod('u', [x * 1.12, 0, z * 1.12], [x, 0.44, z], 0.016, C.navy, 5);
  const hoopAt = (deg) => {
    const a = deg * D2R;
    return [0.25 * Math.sin(a), 0.72 - 0.07 * Math.pow(Math.abs(deg) / 115, 2), 0.25 * Math.cos(a) - 0.03];
  };
  const hoop = [];
  for (let i = 0; i <= 12; i++) hoop.push(hoopAt(-115 + (230 * i) / 12));
  k.tube('u', hoop, 0.017, C.navy, { seg: 16, radial: 5 });
  for (const sgn of [-1, 1]) {
    const rope = [];
    for (let i = 0; i <= 4; i++) rope.push(hoopAt(sgn * (58 + 10 * i)));
    k.tube('u', rope, 0.027, C.rope, { seg: 5, radial: 5 }); // the rope-wrapped arms
    k.rod('u', [sgn * 0.13, 0.45, 0.15], [sgn * 0.14, 0.71, 0.2], 0.013, C.navy, 5);
    k.rod('u', [sgn * 0.18, 0.45, -0.1], [sgn * 0.225, 0.66, -0.13], 0.013, C.navy, 5);
  }
}

// Upholstered shell chair: the pads are white and take the instance colour; the frame is a second mesh.
function shellPads(k) {
  k.cyl('u', 0, 0.42, 0, 0.21, 0.06, '#ffffff', 14);
  k.prism('u', arcBand(0, 0, 0.2, 0.265, 22 * D2R, 158 * D2R, 8), 0.6, 0.84, '#ffffff');
}
function shellLegs(k) {
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.rod('u', [x * 0.2, 0, z * 0.2], [x * 0.15, 0.43, z * 0.15], 0.015, C.timberLight, 5);
  for (const sgn of [-1, 1]) k.rod('u', [sgn * 0.16, 0.43, 0.14], [sgn * 0.19, 0.64, 0.14], 0.014, C.timberLight, 5);
}

function stool(k) {
  k.cyl('u', 0, 0.74, 0, 0.18, 0.04, C.mustard, 14);
  k.prism('u', arcBand(0, 0, 0.15, 0.185, 30 * D2R, 150 * D2R, 6), 0.78, 0.9, C.mustard);
  const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [x, z] of legs) k.rod('u', [x * 0.17, 0, z * 0.17], [x * 0.11, 0.74, z * 0.11], 0.012, C.mustardDark, 5);
  for (let i = 0; i < 4; i++) {
    const [ax, az] = legs[i];
    const [bx, bz] = legs[(i + 1) % 4];
    k.rod('u', [ax * 0.148, 0.28, az * 0.148], [bx * 0.148, 0.28, bz * 0.148], 0.01, C.mustardDark, 4);
  }
}

function armchair(k) {
  k.cyl('u', 0, 0.2, 0, 0.33, 0.22, C.burgundy, 18);
  k.prism('u', arcBand(0, 0, 0.27, 0.4, -20 * D2R, 200 * D2R, 12), 0.3, 0.76, C.burgundy);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.rod('u', [x * 0.24, 0, z * 0.24], [x * 0.22, 0.2, z * 0.22], 0.018, C.black, 5);
}

function rattanChair(k) {
  k.cyl('u', 0, 0.42, 0, 0.23, 0.04, C.rattan, 14);
  k.prism('u', arcBand(0, 0, 0.215, 0.25, 8 * D2R, 172 * D2R, 10), 0.46, 0.88, C.rattan);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.rod('u', [x * 0.2, 0, z * 0.2], [x * 0.16, 0.43, z * 0.16], 0.012, C.black, 5);
}

function plant(k) {
  const rnd = prng(7);
  k.cyl('u', 0, 0, 0, 0.13, 0.3, C.pot, 12, 0.17);
  k.cyl('u', 0, 0.28, 0, 0.15, 0.02, '#3b2f25', 12);
  for (let i = 0; i < 15; i++) {
    const a = i * 2.4 + rnd() * 0.5;
    const rad = 0.1 + rnd() * 0.3;
    const h = 0.5 + (i / 15) * 0.75 + rnd() * 0.1;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    k.rod('u', [0, 0.28, 0], [x * 0.9, h, z * 0.9], 0.006, C.leafB, 4);
    k.ball('u', x, h, z, [0.15 + rnd() * 0.05, 0.012, 0.095 + rnd() * 0.03], LEAVES[i % 3], 1, [rnd() * 0.5 - 0.25, -a, 0.25 + rnd() * 0.45]);
  }
}
// A low rosette of rounded leaves: fills planters, beds and hedges.
function tuft(k) {
  const rnd = prng(19);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4 + rnd() * 0.6;
    const rad = 0.06 + rnd() * 0.15;
    const h = 0.06 + rnd() * 0.22;
    k.ball('u', Math.cos(a) * rad, h, Math.sin(a) * rad, [0.1 + rnd() * 0.04, 0.016, 0.065 + rnd() * 0.025], LEAVES[i % 3], 1, [rnd() * 0.5 - 0.25, -a, 0.2 + rnd() * 0.5]);
  }
  k.ball('u', 0, 0.07, 0, [0.12, 0.08, 0.12], C.leafB, 0);
}
// Planter box hanging from the timber grid, with trailing green (render 7). Origin at the top of the box.
function hanging(k) {
  const rnd = prng(23);
  k.box('u', -0.26, -0.2, -0.26, 0.26, 0, 0.26, C.sageDeep);
  k.ball('u', 0, -0.05, 0, [0.4, 0.17, 0.4], C.leafA, 1);
  // trailing strands of different lengths, each a string of small leaves
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4;
    const rad = 0.2 + rnd() * 0.2;
    const len = 0.5 + rnd() * 1.1;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    k.ball('u', x, -0.12 - len * 0.5, z, [0.035, len * 0.52, 0.035], LEAVES[i % 3], 0, [rnd() * 0.16 - 0.08, a, rnd() * 0.16 - 0.08]);
    k.ball('u', x * 1.05, -0.2 - len * 0.35, z * 1.05, [0.085, 0.06, 0.085], LEAVES[(i + 1) % 3], 1);
    k.ball('u', x * 0.95, -0.15 - len * 0.85, z * 0.95, [0.07, 0.055, 0.07], LEAVES[(i + 2) % 3], 1);
  }
}

/** Unit geometries by type. */
export function buildUnits() {
  return {
    roundTable: unit((k) => {
      k.cyl('u', 0, 0.72, 0, 0.45, 0.03, C.stone, 28);
      k.cyl('u', 0, 0.02, 0, 0.035, 0.7, C.black, 8);
      k.cyl('u', 0, 0, 0, 0.24, 0.025, C.black, 20);
    }),
    squareTable: unit((k) => {
      k.box('u', -0.5, 0.72, -0.5, 0.5, 0.75, 0.5, C.stone);
      k.box('u', -0.05, 0.02, -0.05, 0.05, 0.72, 0.05, C.black);
      k.box('u', -0.3, 0, -0.3, 0.3, 0.02, 0.3, C.black);
    }),
    navyChair: unit(navyChair),
    shellPads: unit(shellPads),
    shellLegs: unit(shellLegs),
    stool: unit(stool),
    armchair: unit(armchair),
    rattanChair: unit(rattanChair),
    pot: unit((k) => {
      k.cyl('u', 0, 0, 0, 0.16, 0.13, '#ffffff', 16);
      k.cyl('u', 0, 0.13, 0, 0.165, 0.02, '#ffffff', 16);
      k.cyl('u', 0, 0.15, 0, 0.03, 0.03, '#ffffff', 8);
    }),
    plant: unit(plant),
    tuft: unit(tuft),
    hanging: unit(hanging),
  };
}

/** Which types belong to the upper level (they fade with the ceiling). */
export const UPPER_TYPES = ['hanging'];

/** Place everything the plan lists. `place(type, { x, y, z, rot, s, sx, sy, sz, colour })` */
export function placeFurniture(place) {
  for (const t of P.ROUND_TABLES) place('roundTable', { x: t.x, z: t.z });
  for (const t of P.squareTables()) place('squareTable', { x: t.x, z: t.z, sx: t.w, sz: t.d });
  for (const s of P.seats()) {
    if (s.type === 'navy') place('navyChair', { x: s.x, z: s.z, rot: s.rot });
    else {
      place('shellPads', { x: s.x, z: s.z, rot: s.rot, colour: C[s.colour] });
      place('shellLegs', { x: s.x, z: s.z, rot: s.rot });
    }
  }
  for (const [x, z] of P.STOOLS) place('stool', { x, z, rot: 0.18 });
  for (const a of P.ARMCHAIRS) place('armchair', a);
  for (const [x, z, col] of P.BUFFET_POTS) place('pot', { x, y: P.BUFFET.h, z, colour: C[col] });
  P.PLANTS.forEach(([x, z, s], i) => place('plant', { x, z, s, rot: i * 1.7 }));
  for (const t of P.DECK_TABLES) {
    place('rattanChair', { x: t.x - 0.62, z: t.z, rot: Math.PI / 2 });
    place('rattanChair', { x: t.x + 0.62, z: t.z, rot: -Math.PI / 2 });
  }
}

/** Soft floor shadows: [x, z, width (x), depth (z)] */
export function blobs() {
  const out = [];
  for (const t of P.ROUND_TABLES) out.push([t.x, t.z, 1.75, 1.75]);
  for (const t of P.ROW_B) out.push([t.x, t.z, 1.9, 1.6]);
  for (const t of P.ROW_C) out.push([t.x, t.z, 1.6, 1.95]);
  out.push([(P.COMMUNAL.r[0] + P.COMMUNAL.r[2]) / 2, (P.COMMUNAL.r[1] + P.COMMUNAL.r[3]) / 2, 3.1, 2.1]);
  for (const [x, z] of P.STOOLS) out.push([x, z, 0.6, 0.6]);
  for (const a of P.ARMCHAIRS) out.push([a.x, a.z, 1.05, 1.05]);
  out.push([P.SIDE_TABLE.x, P.SIDE_TABLE.z, 0.7, 0.7]);
  for (const [x0, z0, x1, z1] of P.PLANTERS) out.push([(x0 + x1) / 2, (z0 + z1) / 2, 0.9, z1 - z0 + 0.5]);
  for (const [x, z, s] of P.PLANTS) out.push([x, z, 0.9 * s, 0.9 * s]);
  for (const t of P.DECK_TABLES) out.push([t.x, t.z, 1.9, 1.0]);
  return out;
}

const m = new THREE.Matrix4();
const q = new THREE.Quaternion();
const e = new THREE.Euler();
const pos = new THREE.Vector3();
const scl = new THREE.Vector3();
const col = new THREE.Color();

/** One InstancedMesh for a list of placements. */
export function instanced(geometry, material, list, { shadow = true } = {}) {
  const mesh = new THREE.InstancedMesh(geometry, material, list.length);
  list.forEach((it, i) => {
    e.set(0, -(it.rot || 0), 0);
    q.setFromEuler(e);
    pos.set(it.x, it.y || 0, it.z);
    const k = it.s || 1;
    scl.set((it.sx || 1) * k, (it.sy || 1) * k, (it.sz || 1) * k);
    m.compose(pos, q, scl);
    mesh.setMatrixAt(i, m);
    if (it.colour) mesh.setColorAt(i, col.set(it.colour));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

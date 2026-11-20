// The static room, built from plan.js into a handful of merged geometries (one per material bucket).
//
// Buckets: lower (matte, vertex colours) · upper (matte, fades when the camera rises) · glass · glassUp ·
// glow (unlit warm white: lamps and back-lit shelves) · glowUp · tiles · herring · deck · mural · lineart · signs
import * as THREE from 'three';
import { Kit, prng, rectHole, rectShape } from './kit.js';
import * as P from './plan.js';
import { SIGN_UV } from './textures.js';

const C = P.COLOURS;
const L = P.LEVEL;

/* ------------------------------------------------------------------ floors */

function floors(k) {
  const T = P.TILE.size * 8;
  const uv = { ox: P.TILE.x0, oz: P.TILE.z0, sx: T, sz: T };
  k.floor('tiles', [2.6, 3.7, 22.45, 10.7], 0, uv);
  k.floor('tiles', [13.0, 0.75, 14.7, 3.7], 0, uv);
  k.floor('tiles', [5.4, 10.7, 17.2, 14.6], 0, uv);
  k.floor('tiles', [17.2, 10.7, 22.45, 11.8], 0, uv);
  k.floorPoly('herring', P.RECEPTION_FLOOR, 0.006, { ox: 0, oz: 0, sx: 0.6, sz: 0.6 });
  k.floor('deck', P.DECK, 0, { ox: 0, oz: 0, sx: 1.12, sz: 1.12 });

  // what the floors sit on: the building plinth, the walkway, the deck base, the steps and the street
  k.box('lower', 2.6, L.street, 3.7, 22.45, -0.02, 14.6, C.concrete);
  k.box('lower', 13.0, L.street, 0.75, 22.45, -0.02, 3.7, C.concrete);
  k.box('lower', 22.45, L.street, 5.85, 27.4, 0, 14.6, C.paving);
  k.box('lower', 22.45, L.street, -0.6, 27.4, -0.02, 5.85, C.timberDark);
  // three risers down to the street (plan.js STEPS)
  const tread = (P.STEPS[3] - P.STEPS[1]) / 2;
  for (let i = 0; i < 2; i++) k.box('lower', P.STEPS[0], L.street, P.STEPS[1] + i * tread, P.STEPS[2], -0.15 * (i + 1), P.STEPS[1] + (i + 1) * tread, C.paving);
  // the street reaches only as far as the plan shows it, so the top view lines up with the drawing
  k.box('lower', 0.8, L.street - 0.2, 14.6, P.PLAN.w, L.street, P.PLAN.h, C.asphalt);
  // joints in the walkway paving (1.2 m slabs)
  for (let x = 23.65; x < 27.4; x += 1.2) k.box('lower', x - 0.006, 0, 5.85, x + 0.006, 0.003, 14.6, '#b5b4ae');
  for (let z = 7.05; z < 14.6; z += 1.2) k.box('lower', 22.45, 0, z - 0.006, 27.4, 0.003, z + 0.006, '#b5b4ae');
}

/* ------------------------------------------------------------------- walls */

function walls(k) {
  const tone = { plaster: C.plaster, brick: C.brick, beige: C.beige };
  // Every wall carries a thin dark cap, hidden inside the ceiling slab: when the ceiling fades for the
  // top view, the walls read as the black lines of the floor plan.
  const cap = (r, hex) => k.box('lower', r[0] + 0.005, L.ceiling, r[1] + 0.005, r[2] - 0.005, L.ceiling + 0.015, r[3] - 0.005, hex);
  for (const w of P.WALLS) {
    const h = w.h ?? L.ceiling;
    const hex = tone[w.kind] ?? C.plaster;
    k.rect('lower', w.r, 0, L.ceiling, hex);
    if (h > L.ceiling) k.rect('upper', w.r, L.ceiling, h, hex);
    cap(w.r, w.solid ? C.ceilingLight : C.black);
  }
  // the rounded corner of the void wall behind the buffet
  const { corner, rWall, wallX, wallZ } = P.BUFFET;
  const fill = [[wallX, wallZ]];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * (Math.PI / 2);
    fill.push([corner[0] + Math.cos(a) * rWall, corner[1] + Math.sin(a) * rWall]);
  }
  k.prism('lower', fill, 0, L.ceiling, C.beige);
  k.prism('upper', fill, L.ceiling, L.voidTop, C.beige);

  k.prism('lower', P.FEATURE_WALL, 0, L.ceiling, C.plaster);
  k.prism('lower', P.FEATURE_WALL, L.ceiling, L.ceiling + 0.015, C.black);
  for (const p of P.PIERS) {
    k.rect('lower', p.r, 0, L.ceiling, C.brick);
    cap(p.r, C.black);
  }
  for (const c of P.COLUMNS) {
    if (c.big) {
      k.rect('lower', c.r, 0, 3.22, C.concrete);
      k.rect('lower', c.r, 3.22, L.ceiling, C.black);
    } else k.rect('lower', c.r, 0, L.ceiling, C.plaster);
    cap(c.r, C.black);
  }
}

/* ------------------------------------------- ceiling, void and upper floor */

function upperFloor(k, place) {
  const slabs = [
    [2.6, 8.2, 22.45, 14.6],
    [2.6, 3.7, 5.2, 8.2],
    [13.15, 0.75, 22.45, 8.2],
  ];
  for (const r of slabs) {
    k.rect('upper', r, L.ceiling, L.upper, C.ceiling);
    k.rect('upper', r, L.voidTop, L.roof, C.plaster);
  }
  // outer walls of the upper floor (plain massing: the renders do not show them)
  for (const r of [
    [2.6, 3.7, 2.8, 14.6],
    [2.8, 14.4, 22.25, 14.6],
    [22.25, 0.75, 22.45, 14.6],
    [13.15, 0.75, 22.25, 0.95],
    [2.8, 3.7, 5.08, 3.9],
  ])
    k.rect('upper', r, L.upper, L.voidTop, C.plaster);
  k.rect('upper', [13.0, 0.75, 13.15, 3.86], L.ceiling, L.voidTop, C.plaster);

  // white edge of the mezzanine around the void, with its glass railing (render 4)
  k.box('upper', 5.2, 3.56, 8.14, 13.25, 4.1, 8.3, C.ceilingLight);
  k.box('upper', 13.09, 3.56, 3.86, 13.25, 4.1, 8.14, C.ceilingLight);
  k.box('glassUp', 5.25, 4.1, 8.2, 13.2, L.rail, 8.22, C.glass);
  k.box('glassUp', 13.18, 4.1, 3.86, 13.2, L.rail, 8.2, C.glass);
  k.box('upper', 5.25, L.rail, 8.19, 13.22, L.rail + 0.04, 8.23, C.black);
  k.box('upper', 13.17, L.rail, 3.86, 13.21, L.rail + 0.04, 8.19, C.black);

  // deep dark beams under the ceiling (render 2)
  const beam = (r) => k.rect('upper', r, L.beam, L.ceiling, C.beam);
  beam([2.78, 8.2, 22.3, 8.6]);
  beam([2.78, 10.26, 17.12, 10.66]);
  beam([14.5, 5.8, 22.3, 6.2]);
  beam([14.5, 6.2, 14.9, 8.2]);
  beam([14.5, 8.6, 14.9, 10.26]);
  beam([9.07, 8.6, 9.47, 10.26]);
  beam([4.05, 8.6, 4.45, 10.26]);
  beam([19.2, 6.2, 19.6, 8.2]);
  beam([19.2, 8.6, 19.6, 11.74]);

  // timber grid under the skylight, slatted in alternate bays, planters hanging in the open ones (render 7)
  const [vx0, vz0, vx1, vz1] = P.VOID;
  const nx = 6;
  const nz = 4;
  const cw = (vx1 - vx0) / nx;
  const cd = (vz1 - vz0) / nz;
  for (let i = 0; i <= nx; i++) k.box('upper', vx0 + i * cw - 0.06, L.grid, vz0, vx0 + i * cw + 0.06, L.grid + 0.24, vz1, C.timberDark);
  for (let j = 0; j <= nz; j++) k.box('upper', vx0, L.grid + 0.02, vz0 + j * cd - 0.06, vx1, L.grid + 0.22, vz0 + j * cd + 0.06, C.timberDark);
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const x0 = vx0 + i * cw;
      const z0 = vz0 + j * cd;
      if ((i + j) % 2 === 0) {
        for (let s = 0; s < 7; s++) {
          const x = x0 + 0.13 + (s * (cw - 0.26)) / 6;
          k.box('upper', x - 0.04, L.grid + 0.08, z0 + 0.06, x + 0.04, L.grid + 0.13, z0 + cd - 0.06, C.timber);
        }
      } else if ((i * 2 + j) % 5 !== 0) {
        place('hanging', { x: x0 + cw / 2, y: L.grid + 0.02, z: z0 + cd / 2, rot: i * 1.3 + j, s: 0.95 + ((i + j) % 3) * 0.12 });
      }
    }
  }

  // downlights: small glowing discs in the dark ceiling
  const spots = [];
  for (let x = 3.9; x < 22; x += 2.25) spots.push([x, 9.45]);
  for (let x = 15.75; x < 22; x += 2.1) spots.push([x, 7.25]);
  for (let x = 6.6; x < 17; x += 2.1) spots.push([x, 13.6]);
  for (const z of [9.6, 11.0]) spots.push([18.3, z], [20.7, z]);
  for (const [x, z] of spots) k.cyl('glowUp', x, L.ceiling - 0.012, z, 0.075, 0.012, C.lamp, 12);
}

/* -------------------------------------------------------------- reception */

/** Timber lattice with tilted brochure pockets, standing on the plan line a → b. */
function lattice(k, a, b, cells, h = 3.05) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const M = new THREE.Matrix4().makeRotationY(-ang).setPosition(a[0], 0, a[1]);
  const cw = len / cells;
  const rows = Math.round(h / 0.34);
  const ch = h / rows;
  const part = (x0, y0, z0, x1, y1, z1, hex, tilt) => {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    if (tilt) g.rotateX(tilt);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    k.add('lower', g, hex, M);
  };
  for (let i = 0; i <= cells; i++) part(i * cw - 0.02, 0, -0.03, i * cw + 0.02, h, 0.03, C.timber);
  for (let j = 0; j <= rows; j++) part(0, Math.max(0, j * ch - 0.02), -0.028, len, Math.min(h, j * ch + 0.02), 0.028, C.timber);
  for (let j = 2; j < rows - 2; j++) for (let i = 0; i < cells; i++) part(i * cw + 0.05, j * ch + 0.05, -0.008, (i + 1) * cw - 0.05, j * ch + 0.29, 0.008, C.white, 0.5);
}

function reception(k) {
  // counter: terrazzo bar end to the west, grey-green tiled front to the east, white top
  const west = [[15.12, 3.22], [15.36, 3.19], [17.2, 3.526], [17.2, 4.353], [15.24, 4.0], [15.06, 3.84], [15.02, 3.46]];
  const east = [[17.2, 3.526], [18.86, 3.83], [19.5, 2.02], [19.74, 1.92], [20.02, 2.06], [20.08, 2.36], [19.56, 4.3], [19.36, 4.58], [19.02, 4.68], [17.2, 4.353]];
  k.prism('lower', west, 0, 1.04, C.terrazzo);
  k.prism('lower', east, 0, 1.04, C.tileGreen);
  k.prism('lower', P.receptionOutline(), 1.04, P.RECEPTION.h, C.white);
  // slim vertical tiles on the public face (render 1): a joint every 8.5 cm
  const face = [[17.2, 4.353], [19.02, 4.68], [19.36, 4.58], [19.56, 4.3], [20.08, 2.36], [20.02, 2.06], [19.74, 1.92]];
  for (let i = 0; i < face.length - 1; i++) {
    const [ax, az] = face[i];
    const [bx, bz] = face[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / 0.085));
    for (let j = 0; j < n; j++) {
      const t = (j + 0.5) / n;
      k.obox('lower', ax + (bx - ax) * t - ((bz - az) / len) * 0.003, 0.54, az + (bz - az) * t + ((bx - ax) / len) * 0.003, 0.012, 0.92, 0.008, Math.atan2(bz - az, bx - ax), C.tileJoint);
    }
  }
  // espresso machine and jugs at the bar end, two screens on the short arm
  k.obox('lower', 15.62, 1.29, 3.62, 0.5, 0.38, 0.36, 0.178, C.blue);
  k.obox('lower', 15.62, 1.5, 3.62, 0.52, 0.04, 0.38, 0.178, '#c9c9c6');
  k.cyl('lower', 16.15, 1.1, 3.72, 0.06, 0.16, '#c9c9c6', 10);
  k.cyl('lower', 16.32, 1.1, 3.76, 0.06, 0.16, '#c9c9c6', 10);
  const { a, b } = P.RECEPTION.short;
  const arm = Math.atan2(b[1] - a[1], b[0] - a[0]);
  for (const t of [0.32, 0.66]) {
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[1] + (b[1] - a[1]) * t;
    k.obox('lower', x, 1.34, z, 0.42, 0.3, 0.03, arm, C.black);
    k.obox('lower', x, 1.15, z, 0.12, 0.1, 0.1, arm, C.black);
  }

  // arched display in front of the mural: back-lit shelves of small bottles and the sign
  const D = P.DISPLAY;
  const frame = '#3d5a5c';
  const outer = rectShape(D.x0, 0, D.x1, D.h, { tl: 0.42, tr: 0.42 });
  outer.holes.push(rectHole(D.x0 + 0.07, 0.07, D.x1 - 0.07, D.h - 0.07, { tl: 0.36, tr: 0.36 }));
  k.plate('lower', outer, D.z0, D.z1 - D.z0, frame);
  k.plate('glow', rectShape(D.x0 + 0.06, 0.06, D.x1 - 0.06, D.h - 0.06, { tl: 0.37, tr: 0.37 }), D.z0, 0.02, '#fbf2d8');
  const rnd = prng(31);
  const bottle = ['#b9d23c', '#f3f1ec', '#4f8f8a', '#f3f1ec'];
  for (let i = 0; i < 6; i++) {
    const y = 0.34 + i * 0.32;
    k.box('lower', D.x0 + 0.07, y, D.z0 + 0.02, D.x1 - 0.07, y + 0.02, D.z1 - 0.02, frame);
    if (i === 3) continue; // behind the sign
    for (let j = i === 5 ? 1 : 0; j < (i === 5 ? 8 : 9); j++) {
      const x = D.x0 + 0.16 + j * 0.128;
      k.box('lower', x - 0.035, y + 0.02, D.z0 + 0.14, x + 0.035, y + 0.12 + rnd() * 0.05, D.z0 + 0.21, bottle[(i + j) % 4]);
    }
  }
  k.box('lower', 16.25, 1.12, D.z1 - 0.06, 17.0, 1.42, D.z1 + 0.04, C.black);
  k.ribbon('signs', [[16.25, D.z1 + 0.045], [17.0, D.z1 + 0.045]], 1.12, 1.42, '#ffffff', SIGN_UV.display);

  // the mural, then the warm timber wall with three round lights
  k.ribbon('mural', P.MURAL_LINE, 0, 3.25);
  k.box('lower', 18.9, 0, 0.9, 22.3, 3.25, 0.96, C.timber);
  for (let i = 1; i < 3; i++) k.box('lower', 18.9 + i * 1.133 - 0.008, 0, 0.96, 18.9 + i * 1.133 + 0.008, 3.25, 0.964, C.timberDark);
  for (let j = 1; j < 5; j++) k.box('lower', 18.9, j * 0.65 - 0.008, 0.96, 22.3, j * 0.65 + 0.008, 0.964, C.timberDark);
  k.box('lower', 19.3, 2.272, 0.96, 21.9, 2.288, 0.975, C.black);
  for (const x of [19.47, 20.6, 21.73]) k.ball('glow', x, 2.28, 1.06, 0.075, C.lamp, 1);

  // ceiling feature: black grid frame with sage ribbons hanging under it (render 1)
  for (let z = 1.0; z <= 5.71; z += 0.67) k.box('upper', 14.8, 3.2, z - 0.015, 22.2, 3.25, z + 0.015, C.black);
  for (let x = 14.8; x <= 22.21; x += 0.74) k.box('upper', x - 0.015, 3.2, 1.0, x + 0.015, 3.25, 5.7, C.black);
  const loops = [
    [17.6, 3.5, 2.3, 1.3, 0.2],
    [19.8, 3.25, 1.6, 1.85, 1.1],
    [16.6, 4.2, 1.5, 0.9, 2.0],
  ];
  loops.forEach(([cx, cz, rx, rz, ph], n) => {
    const pts = [];
    for (let i = 0; i < 18; i++) {
      const t = (i / 18) * Math.PI * 2;
      const w = 1 + 0.17 * Math.sin(3 * t + ph);
      pts.push([cx + Math.cos(t) * rx * w, 3.07 - 0.045 * n + 0.04 * Math.sin(2 * t + ph), cz + Math.sin(t) * rz * w]);
    }
    k.tube('upper', pts, 0.032, C.sage, { closed: true, seg: 72, radial: 5 });
  });

  // lattice screen at the bar end, side table between the armchairs
  const s = P.LATTICES[1];
  lattice(k, s.a, s.b, s.cells, 3.2);
  const t = P.SIDE_TABLE;
  k.cyl('lower', t.x, 0.42, t.z, t.r, 0.025, C.mustard, 18);
  k.cyl('lower', t.x, 0, t.z, 0.02, 0.42, C.black, 6);
  k.cyl('lower', t.x, 0, t.z, 0.16, 0.015, C.black, 14);
}

/* ----------------------------------------------------------------- buffet */

/** The buffet wall line, `off` metres in front of the wall: up the west arm, round the corner, along the north arm. */
function buffetLine(off, zSouth, xEast, seg = 12) {
  const { corner, rWall } = P.BUFFET;
  const r = rWall - off;
  const pts = [[corner[0] - r, zSouth]];
  for (let i = 0; i <= seg; i++) {
    const a = Math.PI + (i / seg) * (Math.PI / 2);
    pts.push([corner[0] + Math.cos(a) * r, corner[1] + Math.sin(a) * r]);
  }
  pts.push([xEast, corner[1] - r]);
  return pts;
}

function buffet(k) {
  const B = P.BUFFET;
  const outline = P.buffetOutline(12);
  k.prism('lower', outline, 0.1, 0.86, C.sage);
  k.prism('lower', outline, 0, 0.1, C.sageDeep);
  k.prism('lower', outline, 0.86, B.h, C.terrazzo);
  // back-lit tiled splashback and the wall cabinets above it (render 5)
  k.ribbon('glow', buffetLine(0.012, B.south - 0.02, B.east - 0.02), B.h, 1.52, '#f7ecd2');
  const band = [...buffetLine(0, B.south, B.east), ...buffetLine(0.36, B.south, B.east).reverse()];
  k.prism('lower', band, 1.52, 2.5, C.sage);
  const door = '#dfe3d2';
  const xw = B.corner[0] - B.rWall + 0.365;
  for (let i = 0; i < 4; i++) k.ribbon('lower', [[xw, B.south - 0.06 - i * 0.48], [xw, B.south - 0.5 - i * 0.48]], 1.6, 2.42, door);
  const zn = B.corner[1] - B.rWall + 0.365;
  for (let i = 0; i < 4; i++) k.ribbon('lower', [[B.corner[0] + 0.12 + i * 0.46, zn], [B.corner[0] + 0.54 + i * 0.46, zn]], 1.6, 2.42, door);
  // two red desk lamps at the ends
  for (const [x, z] of [[5.72, 7.42], [8.42, 4.55]]) {
    k.cyl('lower', x, B.h, z, 0.06, 0.012, C.burgundy, 10);
    k.rod('lower', [x, B.h, z], [x, B.h + 0.3, z], 0.008, C.burgundy, 5);
    k.cyl('lower', x + 0.04, B.h + 0.27, z + 0.04, 0.09, 0.1, C.burgundy, 10, 0.03);
  }
}

/* -------------------------------------------------------------------- bar */

function archPath(x0, x1, y0, H, R, z) {
  const pts = [[x0, y0, z], [x0, (y0 + H - R) / 2, z], [x0, H - R - 0.06, z]];
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI - (i / 6) * (Math.PI / 2);
    pts.push([x0 + R + Math.cos(a) * R, H - R + Math.sin(a) * R, z]);
  }
  pts.push([(x0 + x1) / 2, H, z]);
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI / 2 - (i / 6) * (Math.PI / 2);
    pts.push([x1 - R + Math.cos(a) * R, H - R + Math.sin(a) * R, z]);
  }
  pts.push([x1, H - R - 0.06, z], [x1, (y0 + H - R) / 2, z], [x1, y0, z]);
  return pts;
}

function bar(k, place) {
  const [x0, z0, x1, z1] = P.BAR.r;
  const R = 0.3;
  const body = [[x0, z0], [x1, z0], [x1, z1 - R]];
  for (let i = 1; i <= 6; i++) body.push([x1 - R + Math.cos((i / 6) * (Math.PI / 2)) * R, z1 - R + Math.sin((i / 6) * (Math.PI / 2)) * R]);
  for (let i = 0; i <= 6; i++) body.push([x0 + R + Math.cos(Math.PI / 2 + (i / 6) * (Math.PI / 2)) * R, z1 - R + Math.sin(Math.PI / 2 + (i / 6) * (Math.PI / 2)) * R]);
  k.prism('lower', body, 0.08, 0.9, C.mustard);
  k.prism('lower', body, 0, 0.08, C.mustardDark);
  k.prism('lower', body, 0.9, P.BAR.h + 0.02, C.terrazzo);
  // drawer fronts: a fine grid of joints, and an open shelf of plates in the middle
  for (const y of [0.3, 0.5, 0.7]) k.box('lower', x0 + R, y - 0.006, z1, x1 - R, y + 0.006, z1 + 0.004, C.mustardDark);
  for (let x = x0 + R; x <= x1 - R + 0.01; x += 0.2) k.box('lower', x - 0.005, 0.1, z1, x + 0.005, 0.88, z1 + 0.004, C.mustardDark);
  k.box('lower', 10.56, 0.52, z1, 11.36, 0.8, z1 + 0.006, '#3a3a39');
  for (let i = 0; i < 5; i++) k.cyl('lower', 10.66 + i * 0.15, 0.53, z1 + 0.02, 0.06, 0.12, C.white, 8);
  // bread on a raised shelf
  k.box('lower', x0 + 0.2, 0.94, z0 + 0.05, x1 - 0.2, 1.1, z0 + 0.4, C.terrazzo);
  const rnd = prng(41);
  for (let i = 0; i < 9; i++) k.ball('lower', x0 + 0.5 + i * 0.27, 0.99, z1 - 0.3 + (i % 2) * 0.08, [0.13, 0.055, 0.07], i % 3 ? '#b9783f' : '#a5652f', 1, [0, rnd() * 0.8 - 0.4, 0]);

  // the white arched frame with two shelves (renders 3 and 5)
  const A = P.BAR.arch;
  const y0 = P.BAR.h;
  k.box('lower', A.x0 + 0.06, y0, z0 - 0.02, A.x1 - 0.06, A.h - 0.2, z0 + 0.01, C.white);
  for (let x = A.x0 + 0.14; x < A.x1 - 0.1; x += 0.09) k.box('lower', x - 0.012, y0, z0 + 0.01, x + 0.012, A.h - 0.22, z0 + 0.02, '#dcdad4');
  for (const z of [z0 + 0.05, z0 + 0.42]) k.tube('lower', archPath(A.x0, A.x1, y0, A.h, 0.55, z), 0.022, C.white, { radial: 6 });
  for (const x of [A.x0, A.x0 + 0.75, (A.x0 + A.x1) / 2, A.x1 - 0.75, A.x1]) {
    const top = x === A.x0 || x === A.x1 ? A.h - 0.6 : A.h;
    k.rod('lower', [x, top, z0 + 0.05], [x, top, z0 + 0.42], 0.016, C.white, 5);
  }
  for (const y of [1.74, 2.2]) {
    k.box('lower', A.x0, y, z0 + 0.03, A.x1, y + 0.035, z0 + 0.42, C.mustard);
    k.box('glow', A.x0 + 0.1, y - 0.012, z0 + 0.03, A.x1 - 0.1, y, z0 + 0.09, '#fff0c4');
  }
  for (let i = 0; i < 6; i++) k.cyl('lower', A.x0 + 0.95 + i * 0.27, 1.775, z0 + 0.24, 0.07, 0.07, i % 2 ? '#8fa3a8' : '#6f8f94', 10, 0.1);
  for (const x of [A.x0 + 0.35, A.x1 - 0.35]) k.cyl('lower', x, 1.775, z0 + 0.24, 0.05, 0.13, '#c98f7a', 8);
  k.ribbon('signs', [[A.x0 + 0.25, z0 + 0.3], [A.x0 + 1.03, z0 + 0.3]], 2.25, 2.51, '#ffffff', SIGN_UV.bar);
  place('plant', { x: A.x1 - 0.95, y: 2.235, z: z0 + 0.24, s: 0.42, rot: 1 });
  place('plant', { x: A.x1 - 0.45, y: 2.235, z: z0 + 0.24, s: 0.36, rot: 3 });
}

/* ------------------------------------------------- partition and terrace */

function windowBay(k, x0, x1, panes) {
  const z = P.PARTITION_Z;
  const shape = rectShape(x0, 0, x1, L.beam);
  shape.holes.push(rectHole(x0 + 0.22, 0.55, x1 - 0.22, 2.5, { bl: 0.38, br: 0.38 }));
  shape.holes.push(rectHole(x0 + 0.22, 2.62, x1 - 0.22, 2.93));
  k.plate('lower', shape, z - 0.05, 0.1, C.timber);
  const w = (x1 - x0 - 0.44) / panes;
  for (let i = 1; i < panes; i++) {
    const x = x0 + 0.22 + i * w;
    k.box('lower', x - 0.018, 0.55, z - 0.03, x + 0.018, 2.5, z + 0.03, C.timberDark);
    k.box('lower', x - 0.018, 2.62, z - 0.03, x + 0.018, 2.93, z + 0.03, C.timberDark);
  }
  k.box('glass', x0 + 0.2, 0.5, z - 0.008, x1 - 0.2, 2.95, z + 0.008, C.glass);
}

function partition(k) {
  for (const b of P.WINDOW_BAYS) windowBay(k, b.x0, b.x1, b.panes);
  for (const p of P.PIERS) {
    // sage panel with rounded ends and a two-globe wall lamp, on the hall side (renders 2 and 4)
    const zf = p.r[1];
    const x = p.lampX;
    const half = Math.min(0.3, (p.r[2] - p.r[0]) / 2 - 0.06);
    k.plate('lower', rectShape(x - half, 0.3, x + half, 2.95, { bl: half, br: half, tl: half, tr: half }), zf - 0.03, 0.03, C.sage);
    k.box('lower', x - 0.025, 1.72, zf - 0.09, x + 0.025, 2.22, zf - 0.03, C.black);
    k.ball('glow', x, 2.3, zf - 0.08, 0.065, C.lamp, 1);
    k.ball('glow', x, 1.64, zf - 0.08, 0.065, C.lamp, 1);
  }
  const s = P.LATTICES[0];
  lattice(k, s.a, s.b, s.cells, L.beam);
}

function terrace(k, place) {
  const G = P.PERGOLA;
  // sage pergola: long round-ended beams on dark cross rafters (render 6)
  for (const [xa, xb] of G.sections) {
    for (let i = 0; i < 4; i++) {
      const g = new THREE.CapsuleGeometry(0.11, xb - xa - 0.22, 4, 10);
      g.rotateZ(Math.PI / 2);
      g.translate((xa + xb) / 2, G.y, G.z0 + 0.2 + i * 0.72);
      k.add('lower', g, C.sage);
    }
    for (let x = xa + 0.35; x < xb; x += 1.2) k.box('lower', x - 0.03, G.y - 0.26, G.z0, x + 0.03, G.y - 0.1, G.z1 + 0.25, C.sageDark);
  }
  // glazed timber screen inside the terrace
  const S = P.TERRACE_SCREEN;
  const frame = rectShape(S.z0, 0, S.z1, 3.0);
  frame.holes.push(rectHole(S.z0 + 0.18, 0.5, S.z1 - 0.18, 2.6, { bl: 0.34, br: 0.34 }));
  k.plateX('lower', frame, S.x - 0.04, 0.08, C.timber);
  k.box('glass', S.x - 0.006, 0.45, S.z0 + 0.15, S.x + 0.006, 2.65, S.z1 - 0.15, C.glass);
  // street shopfront: glass in slim dark frames
  const F = P.SHOPFRONT;
  k.box('glass', F.x0, 0.05, F.z - 0.008, F.x1, 3.3, F.z + 0.008, C.glass);
  for (let x = F.x0; x <= F.x1 + 0.01; x += F.module) k.box('lower', x - 0.02, 0, F.z - 0.03, x + 0.02, 3.3, F.z + 0.03, C.black);
  k.box('lower', F.x0, 0, F.z - 0.03, F.x1, 0.05, F.z + 0.03, C.black);
  k.box('lower', F.x0, 2.5, F.z - 0.02, F.x1, 2.54, F.z + 0.02, C.black);
  k.box('lower', F.x0, 3.3, F.z - 0.1, F.x1, L.ceiling, F.z + 0.1, C.beam);
  // communal table
  const [x0, z0, x1, z1] = P.COMMUNAL.r;
  k.box('lower', x0, 0.72, z0, x1, 0.76, z1, C.stone);
  for (const x of [x0 + 0.12, x1 - 0.12]) for (const z of [z0 + 0.1, z1 - 0.1]) k.box('lower', x - 0.025, 0, z - 0.025, x + 0.025, 0.72, z + 0.025, C.black);
  // dark timber lining on the east wall with a row of globe lights (render 6)
  k.box('lower', 17.05, 0, 10.7, 17.12, 3.3, 14.42, C.timberDark);
  k.box('lower', 17.03, 2.335, 11.1, 17.05, 2.35, 14.0, C.black);
  for (let i = 0; i < 4; i++) k.ball('glow', 16.98, 2.34, 11.3 + i * 0.85, 0.075, C.lamp, 1);
  // long planters between the dining rows and the lobby (render 2)
  const rnd = prng(53);
  for (const [px0, pz0, px1, pz1] of P.PLANTERS) {
    for (const x of [px0, px1]) for (const z of [pz0, pz1]) k.box('lower', x - 0.015, 0, z - 0.015, x + 0.015, 1.0, z + 0.015, C.white);
    k.box('lower', px0, 0.62, pz0, px1, 0.98, pz1, C.sage);
    k.box('lower', px0 + 0.02, 0.2, pz0 + 0.02, px1 - 0.02, 0.225, pz1 - 0.02, C.white);
    for (let z = pz0 + 0.16; z < pz1; z += 0.22) place('tuft', { x: (px0 + px1) / 2 + (rnd() - 0.5) * 0.1, y: 0.95, z, rot: rnd() * 6, s: 1.0 + rnd() * 0.3, sy: 1.25 });
  }
}

/* ------------------------------------------------------ lobby glazing */

function lobby(k) {
  const G = P.EAST_GLAZING;
  const E = P.ENTRANCE;
  const x = G.x;
  k.box('glass', x - 0.008, 0.05, G.z0, x + 0.008, L.ceiling, E.z0, C.glass);
  k.box('glass', x - 0.008, 0.05, E.z1, x + 0.008, L.ceiling, G.z1, C.glass);
  k.box('glass', x - 0.008, 2.5, E.z0, x + 0.008, L.ceiling, E.z1, C.glass);
  const post = (z) => k.box('lower', x - 0.035, 0, z - 0.03, x + 0.035, L.ceiling, z + 0.03, C.white);
  for (let z = G.z0 + 0.03; z < G.z1 - 0.3; z += 1.2) if (z < E.z0 - 0.3 || z > E.z1 + 0.3) post(z);
  post(E.z0);
  post(E.z1);
  post(G.z1 - 0.03);
  k.box('lower', x - 0.035, 2.47, G.z0, x + 0.035, 2.53, G.z1, C.white);
  k.box('lower', x - 0.035, 0, G.z0, x + 0.035, 0.05, E.z0, C.white);
  k.box('lower', x - 0.035, 0, E.z1, x + 0.035, 0.05, G.z1, C.white);
  // the entrance doors stand open, folded back against the outside of the glazing
  for (const [za, zb] of [[E.z0 - 0.9, E.z0 - 0.04], [E.z1 + 0.04, E.z1 + 0.9]]) {
    k.box('glass', x + 0.09, 0.06, za, x + 0.1, 2.4, zb, C.glass);
    k.box('lower', x + 0.075, 0, za, x + 0.115, 0.06, zb, C.white);
    k.box('lower', x + 0.075, 2.4, za, x + 0.115, 2.46, zb, C.white);
    for (const z of [za, zb]) k.box('lower', x + 0.075, 0, z - 0.02, x + 0.115, 2.46, z + 0.02, C.white);
    const hz = za < E.z0 ? za + 0.1 : zb - 0.1;
    k.box('lower', x + 0.13, 0.9, hz - 0.012, x + 0.15, 1.4, hz + 0.012, C.black);
  }
}

/* ----------------------------------------------------------------- outdoor */

function inside(x, z, poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
}

function outdoor(k, place) {
  const rnd = prng(67);
  for (const t of P.DECK_TABLES) {
    k.cyl('lower', t.x, 0.71, t.z, 0.34, 0.03, C[t.colour], 20);
    k.cyl('lower', t.x, 0, t.z, 0.025, 0.71, C.black, 6);
    k.cyl('lower', t.x, 0, t.z, 0.2, 0.02, C.black, 14);
  }
  // bench along the east edge of the deck, black planter boxes at its ends, a hedge behind
  const [bx0, bz0, bx1, bz1] = P.DECK_BENCH;
  k.box('lower', bx0, 0.38, bz0, bx1, 0.45, bz1, C.timber);
  for (const z of [bz0 + 0.1, (bz0 + bz1) / 2, bz1 - 0.1]) k.box('lower', bx0 + 0.04, 0, z - 0.03, bx1 - 0.04, 0.38, z + 0.03, C.black);
  for (const z of [bz0 - 0.62, bz1 + 0.12]) {
    k.box('lower', bx0 - 0.05, 0, z, bx1 + 0.05, 0.55, z + 0.5, C.black);
    place('tuft', { x: (bx0 + bx1) / 2, y: 0.5, z: z + 0.25, s: 1.4, sy: 1.5, rot: z });
  }
  k.box('lower', 26.95, 0, -0.6, 27.36, 0.95, 5.85, C.leafB);
  for (let z = -0.4; z < 5.8; z += 0.34) place('tuft', { x: 27.12 + (rnd() - 0.5) * 0.14, y: 0.86, z, rot: rnd() * 6, s: 1.1 + rnd() * 0.4 });
  // The closed core beside the walkway: dark timber lining with a row of globe lights, as on its terrace side.
  k.box('lower', 22.45, 0, 11.74, 22.5, 3.3, 14.65, C.timberDark);
  k.box('lower', 17.12, 0, 14.6, 22.45, 3.3, 14.65, C.timberDark);
  for (let z = 12.6; z < 14.6; z += 0.9) k.box('lower', 22.5, 0, z - 0.008, 22.504, 3.3, z + 0.008, '#5c3f2c');
  for (let x = 18.0; x < 22.4; x += 0.9) k.box('lower', x - 0.008, 0, 14.65, x + 0.008, 3.3, 14.654, '#5c3f2c');
  k.box('lower', 22.5, 2.335, 12.1, 22.52, 2.35, 14.3, C.black);
  for (let i = 0; i < 3; i++) k.ball('glow', 22.58, 2.34, 12.35 + i * 0.85, 0.075, C.lamp, 1);
  k.box('lower', 18.4, 2.335, 14.65, 21.6, 2.35, 14.67, C.black);
  for (let i = 0; i < 4; i++) k.ball('glow', 18.7 + i * 0.87, 2.34, 14.73, 0.075, C.lamp, 1);
  // upper floor windows (invented: the renders do not show the upper facade)
  for (let i = 0; i < 6; i++) k.box('upper', 6.2 + i * 2.7, 4.8, 14.6, 7.9 + i * 2.7, 7.1, 14.62, C.window);
  for (let i = 0; i < 5; i++) k.box('upper', 22.45, 4.8, 1.6 + i * 2.6, 22.47, 7.1, 3.3 + i * 2.6, C.window);
  // raised planter beds beside the walkway
  for (const bed of P.BEDS) {
    k.prism('lower', bed, 0, 0.42, C.concrete);
    const xs = bed.map((p) => p[0]);
    const zs = bed.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    const inner = bed.map(([x, z]) => [x + Math.sign(cx - x) * 0.09, z + Math.sign(cz - z) * 0.09]);
    k.prism('lower', inner, 0.42, 0.45, C.leafC);
    let n = 0;
    for (let i = 0; i < 600 && n < 46; i++) {
      const x = Math.min(...xs) + rnd() * (Math.max(...xs) - Math.min(...xs));
      const z = Math.min(...zs) + rnd() * (Math.max(...zs) - Math.min(...zs));
      if (!inside(x, z, inner)) continue;
      place('tuft', { x, y: 0.43, z, rot: rnd() * 6, s: 0.9 + rnd() * 0.6, sy: 1.2 });
      n++;
    }
  }
}

/**
 * Build the whole static room.
 * @param {(type: string, item: object) => void} place adds an instanced piece (plants, hanging planters)
 * @returns {Kit} buckets ready to merge
 */
export function buildRoom(place) {
  const k = new Kit();
  floors(k);
  walls(k);
  upperFloor(k, place);
  reception(k);
  buffet(k);
  bar(k, place);
  partition(k);
  terrace(k, place);
  lobby(k);
  outdoor(k, place);
  // the mustard line drawing on the brick wall at the west end of the hall (renders 2 and 5)
  k.ribbon('lineart', [[2.792, 9.95], [2.792, 8.05]], 0.55, 2.75);
  return k;
}

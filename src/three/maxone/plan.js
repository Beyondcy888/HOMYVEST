// The Maxone ground floor, in metres, traced from renders/maxone/layout.png (docs/06 §3.2–3.3).
//
//   x = east  (right in layout.png)      origin = top-left corner of layout.png
//   z = south (down in layout.png)       72 px per metre at the original 1976 × 1274 px
//   y = up, 0 = finished floor of the building; the street is 0.45 m lower
//
// Pure data, no three.js: the route, the collision test, the mini-map and the 3D builder all read it.
// Rects are [x0, z0, x1, z1]. Polygons are [[x, z], …].

export const PX_PER_M = 72;
export const PLAN_PX = { w: 1976, h: 1274 };
export const PLAN = { w: PLAN_PX.w / PX_PER_M, h: PLAN_PX.h / PX_PER_M }; // 27.44 × 17.69 m
export const px = (v) => v / PX_PER_M;

export const LEVEL = {
  street: -0.45, // the building sits three risers above the street (white plinth in render 6)
  ceiling: 3.6, // underside of the main ceiling
  beam: 3.05, // underside of the deep beams (render 2)
  upper: 4.0, // upper floor finish (mezzanine)
  rail: 5.1, // top of the glass railing
  grid: 7.5, // timber grid with hanging planters (render 7)
  voidTop: 8.0,
  roof: 8.3,
};

// Floor tile grid: 0.6 m, aligned to the joints visible in the plan.
export const TILE = { size: 0.6, x0: 2.604, z0: 4.25 };

/* ------------------------------------------------------------------ rooms */

export const HALL = [2.78, 4.15, 22.3, 10.46]; // dining hall + east lobby (interior faces)
export const VOID = [5.25, 3.86, 13.15, 8.2]; // double-height opening over the buffet and bar
export const TERRACE = [5.56, 10.67, 17.12, 14.5]; // street-side room under the pergola
export const CORRIDOR = [13.15, 0.9, 14.57, 3.86];
export const DECK = [22.45, -0.6, 26.85, 5.85];
export const WALKWAY = [22.45, 5.85, 27.4, 14.6];
export const STEPS = [22.45, 14.6, 26.0, 15.8]; // three risers down to the street
export const BOH = [17.12, 11.74, 22.45, 14.6]; // closed core (lifts), east of the terrace
export const WEST_BLOCK = [2.6, 10.67, 5.56, 14.6]; // closed rooms west of the terrace
export const ALCOVE = [2.78, 4.15, 5.08, 7.63]; // closed room behind the curved buffet wall

// Herringbone floor of the reception (north wall line, west edge, the curved south-west border, east wall).
export const RECEPTION_FLOOR = [
  [14.7, 2.32],
  [18.3, 2.5],
  [18.52, 2.2],
  [18.84, 0.9],
  [22.3, 0.9],
  [22.3, 6.12],
  [19.0, 6.12],
  [18.2, 5.86],
  [17.2, 5.6],
  [16.4, 5.42],
  [15.83, 5.2],
  [15.3, 4.86],
  [14.9, 4.45],
  [14.66, 4.0],
  [14.6, 3.4],
  [14.6, 2.32],
];

// The feature wall behind the reception: thick structural wall plus the skewed mural lining with its rounded corner.
export const FEATURE_WALL = [
  [14.57, 2.04],
  [18.26, 2.04],
  [18.26, 0.75],
  [18.84, 0.75],
  [18.84, 0.9],
  [18.6, 1.9],
  [18.5, 2.26],
  [18.3, 2.5],
  [14.7, 2.32],
  [14.57, 2.32],
];
// The mural runs along this line (south face, rounded corner, then the short east face).
export const MURAL_LINE = [
  [14.72, 2.335],
  [17.9, 2.495],
  [18.18, 2.5],
  [18.38, 2.42],
  [18.52, 2.25],
  [18.6, 2.02],
  [18.86, 0.93],
];

/* ------------------------------------------------------------------ walls */
// kind: plaster | brick | beige (void wall) | dark | timber. h = top (m). y0 = base (default 0).
export const WALLS = [
  // hall, west and north
  { r: [2.6, 4.0, 2.78, 10.7], kind: 'brick' },
  { r: [2.78, 7.45, 5.25, 7.63], kind: 'brick' }, // closes the alcove behind the buffet
  { r: [5.08, 3.95, 5.25, 7.63], kind: 'beige', h: LEVEL.voidTop }, // buffet west wall, rises through the void
  { r: [5.08, 3.95, 8.72, 4.15], kind: 'beige', h: LEVEL.voidTop }, // buffet north wall
  { r: [8.63, 3.68, 8.72, 4.15], kind: 'beige', h: LEVEL.voidTop }, // jog
  { r: [8.63, 3.68, 13.15, 3.86], kind: 'beige', h: LEVEL.voidTop }, // wall behind the BAR arch
  { r: [2.6, 4.0, 5.08, 4.15], kind: 'plaster' },
  // service corridor
  { r: [13.0, 0.75, 13.15, 3.86], kind: 'plaster' },
  { r: [13.0, 0.75, 14.7, 0.9], kind: 'plaster' },
  { r: [14.57, 0.75, 14.7, 2.18], kind: 'plaster' },
  // reception north wall, east part (timber panels on its south face)
  { r: [18.26, 0.75, 22.45, 0.9], kind: 'plaster' },
  // window partition: the closed bay west of pier 1 and the door bay to the west block
  { r: [2.78, 10.46, 3.86, 10.67], kind: 'brick' },
  { r: [4.64, 10.46, 5.56, 10.67], kind: 'brick' },
  // closed blocks
  { r: WEST_BLOCK, kind: 'plaster', solid: true },
  { r: BOH, kind: 'plaster', solid: true },
  { r: [17.12, 10.33, 17.35, 11.74], kind: 'plaster', solid: true }, // core stub beside the lattice
];

// Brick piers of the window partition (hall side carries a sage panel with a wall lamp).
export const PIERS = [
  { r: [3.86, 10.07, 4.64, 10.67], lampX: 4.25 },
  { r: [8.6, 10.07, 9.94, 10.67], lampX: 9.27 },
  { r: [13.9, 10.07, 15.25, 10.67], lampX: 14.55 },
];
// Timber-framed window bays between the piers (rounded lower corners, renders 4 and 6).
export const WINDOW_BAYS = [
  { x0: 5.56, x1: 8.6, panes: 4 },
  { x0: 9.94, x1: 13.9, panes: 5 },
];
export const PARTITION_Z = 10.55;
// See-through timber lattice with brochure pockets: partition east end, and the screen west of the reception.
export const LATTICES = [
  { a: [15.28, 10.37], b: [17.11, 10.37], cells: 6 },
  { a: [14.56, 3.08], b: [14.56, 4.03], cells: 3 },
];

// Marble-grey column (renders 1, 3, 7) and the slimmer structural ones on the grid lines.
// The plan draws a second black rectangle at x 19.0–19.7, z 5.8–6.1. Render 1 shows a clear view of the
// reception from exactly there, so it is left out (listed as an assumption in the report).
export const COLUMNS = [
  { r: [14.35, 5.78, 15.05, 6.18], big: true },
  { r: [21.5, 10.33, 21.8, 11.04] },
  { r: [9.11, 13.84, 9.42, 14.53] },
  { r: [14.37, 13.84, 14.59, 14.53] },
];

// East curtain wall (x = 22.3–22.45): glass with white mullions; two door openings.
export const EAST_GLAZING = { x: 22.375, z0: 0.9, z1: 11.74, doors: [{ z0: 3.63, z1: 4.51, open: false }, { z0: 6.4, z1: 8.2, open: true }] };
export const ENTRANCE = { x: 22.375, z0: 6.4, z1: 8.2 };
// Street shopfront of the terrace (z = 14.5).
export const SHOPFRONT = { z: 14.5, x0: 5.56, x1: 17.12, module: 0.96 };
// Glazed timber screen inside the terrace.
export const TERRACE_SCREEN = { x: 9.27, z0: 11.06, z1: 13.75 };
// Pergola canopy over the terrace (render 6): two sections either side of the screen.
export const PERGOLA = { y: 2.72, z0: 10.75, z1: 13.25, sections: [[5.75, 9.05], [9.5, 16.95]] };

/* --------------------------------------------------------------- counters */

// Curved sage buffet: follows the rounded wall. Fillet centre and radii in plan.
export const BUFFET = {
  corner: [6.65, 5.55], // centre of the rounded corner
  rWall: 1.4, // wall face
  rFront: 0.56, // counter front (0.84 m deep)
  south: 7.62, // end of the west arm
  east: 8.63, // end of the north arm
  wallX: 5.25,
  wallZ: 4.15,
  h: 0.9,
};
/** Outline of the buffet counter in plan (used for geometry and collisions). */
export function buffetOutline(seg = 10) {
  const { corner, rWall, rFront, south, east, wallX, wallZ } = BUFFET;
  const pts = [[wallX, south]];
  for (let i = 0; i <= seg; i++) {
    const a = Math.PI + (i / seg) * (Math.PI / 2); // west → north
    pts.push([corner[0] + Math.cos(a) * rWall, corner[1] + Math.sin(a) * rWall]);
  }
  pts.push([east, wallZ]);
  pts.push([east, corner[1] - rFront]);
  for (let i = seg; i >= 0; i--) {
    const a = Math.PI + (i / seg) * (Math.PI / 2);
    pts.push([corner[0] + Math.cos(a) * rFront, corner[1] + Math.sin(a) * rFront]);
  }
  pts.push([corner[0] - rFront, south]);
  return pts;
}
// Pots on the buffet: [x, z, colour key]
export const BUFFET_POTS = [
  [5.67, 7.03, 'mustard'],
  [5.67, 6.38, 'mustard'],
  [5.67, 5.73, 'mustard'],
  [5.86, 5.1, 'teal'],
  [6.3, 4.74, 'teal'],
  [6.9, 4.62, 'teal'],
  [7.48, 4.62, 'teal'],
  [8.06, 4.62, 'teal'],
];

// Mustard drawer counter with the "BAR" arch shelving above it.
export const BAR = { r: [9.36, 3.9, 12.56, 4.78], h: 0.92, arch: { x0: 9.5, x1: 12.42, z: 4.02, h: 2.95 } };

// Reception counter: a boomerang. Centre lines of the two arms, with widths.
export const RECEPTION = {
  long: { a: [15.3, 3.6], b: [18.75, 4.22], w: 0.78 },
  short: { a: [19.2, 4.25], b: [19.82, 2.2], w: 0.62 },
  h: 1.1,
};
/** Outline of the reception counter (rounded ends approximated). */
export function receptionOutline() {
  return [
    [15.12, 3.22],
    [15.36, 3.19],
    [18.86, 3.83],
    [19.5, 2.02],
    [19.74, 1.92],
    [20.02, 2.06],
    [20.08, 2.36],
    [19.56, 4.3],
    [19.36, 4.58],
    [19.02, 4.68],
    [15.24, 4.0],
    [15.06, 3.84],
    [15.02, 3.46],
  ];
}
// "maxone" arched display in front of the mural.
export const DISPLAY = { x0: 15.95, x1: 17.3, z0: 2.5, z1: 2.86, h: 2.35 };

/* -------------------------------------------------------------- furniture */
// Rows A and B are nudged 0.1 m apart from the plan so the aisle between them takes the camera.

export const ROUND_TABLES = [8.46, 10.75, 13.04, 15.33].map((x) => ({ x, z: 7.06, r: 0.45 }));
export const ROW_B = [8.49, 10.78, 13.08, 15.38].map((x) => ({ x, z: 9.33 })); // two tables stacked N–S, chairs W and E
export const ROW_C = [10.6, 12.56, 14.5, 16.36].map((x) => ({ x, z: 12.49 })); // two tables side by side, chairs N and S
export const COMMUNAL = { r: [6.2, 12.08, 8.68, 12.78], seatsX: [6.53, 7.14, 7.74, 8.35], north: ['navy', 'sage', 'navy', 'sage'], south: ['sage', 'mustard', 'sage', 'mustard'] };

/** Every seat: { x, z, rot (radians, 0 = faces north), type, colour } */
export function seats() {
  const out = [];
  for (const t of ROUND_TABLES) {
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      out.push({ x: t.x + sx * 0.47, z: t.z + sz * 0.47, rot: Math.atan2(-sx, sz), type: 'navy' });
    }
  }
  for (const t of ROW_B) {
    for (const [sz, i] of [[-0.32, 0], [0.32, 1]]) {
      out.push({ x: t.x - 0.6, z: t.z + sz, rot: Math.PI / 2, type: 'shell', colour: i === 0 ? 'mint' : 'salmon' });
      out.push({ x: t.x + 0.6, z: t.z + sz, rot: -Math.PI / 2, type: 'shell', colour: i === 0 ? 'salmon' : 'mint' });
    }
  }
  for (const t of ROW_C) {
    for (const [sx, i] of [[-0.33, 0], [0.33, 1]]) {
      out.push({ x: t.x + sx, z: t.z - 0.62, rot: Math.PI, type: 'shell', colour: i === 0 ? 'salmon' : 'mint' });
      out.push({ x: t.x + sx, z: t.z + 0.62, rot: 0, type: 'shell', colour: i === 0 ? 'mint' : 'salmon' });
    }
  }
  COMMUNAL.seatsX.forEach((x, i) => {
    out.push({ x, z: 11.76, rot: Math.PI, type: 'shell', colour: COMMUNAL.north[i] });
    out.push({ x, z: 13.1, rot: 0, type: 'shell', colour: COMMUNAL.south[i] });
  });
  return out;
}
/** Square tables: { x, z, w (x size), d (z size) } */
export function squareTables() {
  const out = [];
  for (const t of ROW_B) {
    out.push({ x: t.x, z: t.z - 0.32, w: 0.68, d: 0.62 });
    out.push({ x: t.x, z: t.z + 0.32, w: 0.68, d: 0.62 });
  }
  for (const t of ROW_C) {
    out.push({ x: t.x - 0.33, z: t.z, w: 0.63, d: 0.72 });
    out.push({ x: t.x + 0.33, z: t.z, w: 0.63, d: 0.72 });
  }
  return out;
}

export const STOOLS = [
  [15.79, 4.63],
  [16.39, 4.7],
  [16.98, 4.78],
  [17.57, 4.86],
];
export const ARMCHAIRS = [
  { x: 21.75, z: 4.9, rot: 2.3 },
  { x: 21.0, z: 5.72, rot: 0.25 },
];
export const SIDE_TABLE = { x: 21.72, z: 5.62, r: 0.26 };

// Long indoor planters between the dining rows and the east lobby.
export const PLANTERS = [
  [16.9, 7.55, 17.25, 8.72],
  [16.9, 9.0, 17.25, 10.21],
];
// Potted plants: [x, z, scale]
export const PLANTS = [
  [12.95, 4.42, 1.25],
  [21.35, 1.45, 1.2],
  [21.95, 1.7, 1.05],
  [8.38, 14.08, 1.15],
  [16.33, 14.1, 1.2],
  [22.85, 0.25, 1.1],
  [26.35, 0.5, 1.2],
];

// Outdoor deck: round tables with coloured tops, two rattan chairs each, a bench along the east edge.
export const DECK_TABLES = [
  { x: 24.3, z: 0.35, colour: 'lime' },
  { x: 24.3, z: 1.93, colour: 'teal' },
  { x: 24.3, z: 3.53, colour: 'mustard' },
  { x: 24.3, z: 5.1, colour: 'sage' },
];
export const DECK_BENCH = [26.2, 1.82, 26.6, 5.65];
// Raised planter beds on the walkway.
export const BEDS = [
  [
    [23.57, 11.88],
    [26.23, 10.27],
    [27.2, 10.27],
    [27.2, 12.53],
    [23.57, 12.53],
  ],
  [
    [23.57, 13.74],
    [27.2, 13.74],
    [27.2, 14.6],
    [23.57, 14.6],
  ],
];

/* -------------------------------------------------------------- colliders */

const rectPoly = ([x0, z0, x1, z1]) => [
  [x0, z0],
  [x1, z0],
  [x1, z1],
  [x0, z1],
];

/**
 * Everything the camera must keep 0.35 m away from: walls, counters and columns.
 * Each entry is { name, poly } (closed polygon, any winding) or { name, seg: [[x,z],[x,z]] } for thin screens.
 */
export function solids() {
  const out = [];
  WALLS.forEach((w, i) => out.push({ name: `wall-${i}`, poly: rectPoly(w.r) }));
  out.push({ name: 'alcove', poly: rectPoly(ALCOVE) });
  out.push({ name: 'feature-wall', poly: FEATURE_WALL });
  PIERS.forEach((p, i) => out.push({ name: `pier-${i}`, poly: rectPoly(p.r) }));
  WINDOW_BAYS.forEach((b, i) => out.push({ name: `window-bay-${i}`, seg: [[b.x0, PARTITION_Z], [b.x1, PARTITION_Z]] }));
  LATTICES.forEach((l, i) => out.push({ name: `lattice-${i}`, seg: [l.a, l.b] }));
  COLUMNS.forEach((c, i) => out.push({ name: `column-${i}`, poly: rectPoly(c.r) }));
  // east curtain wall, split around the open entrance
  out.push({ name: 'east-glazing-n', seg: [[EAST_GLAZING.x, EAST_GLAZING.z0], [EAST_GLAZING.x, ENTRANCE.z0]] });
  out.push({ name: 'east-glazing-s', seg: [[EAST_GLAZING.x, ENTRANCE.z1], [EAST_GLAZING.x, EAST_GLAZING.z1]] });
  out.push({ name: 'shopfront', seg: [[SHOPFRONT.x0, SHOPFRONT.z], [SHOPFRONT.x1, SHOPFRONT.z]] });
  out.push({ name: 'terrace-screen', seg: [[TERRACE_SCREEN.x, TERRACE_SCREEN.z0], [TERRACE_SCREEN.x, TERRACE_SCREEN.z1]] });
  out.push({ name: 'buffet', poly: buffetOutline(8) });
  out.push({ name: 'bar-counter', poly: rectPoly(BAR.r) });
  out.push({ name: 'reception-counter', poly: receptionOutline() });
  out.push({ name: 'display', poly: rectPoly([DISPLAY.x0, DISPLAY.z0, DISPLAY.x1, DISPLAY.z1]) });
  BEDS.forEach((b, i) => out.push({ name: `planter-bed-${i}`, poly: b }));
  return out;
}

/** Furniture footprints as circles { name, x, z, r }: the camera keeps a smaller margin from these. */
export function furnitureCircles() {
  const out = [];
  ROUND_TABLES.forEach((t, i) => out.push({ name: `round-table-${i}`, x: t.x, z: t.z, r: t.r }));
  squareTables().forEach((t, i) => out.push({ name: `square-table-${i}`, x: t.x, z: t.z, r: 0.36 }));
  seats().forEach((s, i) => out.push({ name: `seat-${i}`, x: s.x, z: s.z, r: 0.27 }));
  STOOLS.forEach(([x, z], i) => out.push({ name: `stool-${i}`, x, z, r: 0.2 }));
  ARMCHAIRS.forEach((a, i) => out.push({ name: `armchair-${i}`, x: a.x, z: a.z, r: 0.4 }));
  out.push({ name: 'side-table', x: SIDE_TABLE.x, z: SIDE_TABLE.z, r: SIDE_TABLE.r });
  PLANTERS.forEach(([x0, z0, x1, z1], i) => {
    for (let z = z0 + 0.17; z < z1; z += 0.3) out.push({ name: `planter-${i}`, x: (x0 + x1) / 2, z, r: 0.2 });
  });
  PLANTS.forEach(([x, z], i) => out.push({ name: `plant-${i}`, x, z, r: 0.3 }));
  for (let x = COMMUNAL.r[0] + 0.3; x < COMMUNAL.r[2]; x += 0.45) out.push({ name: 'communal-table', x, z: (COMMUNAL.r[1] + COMMUNAL.r[3]) / 2, r: 0.36 });
  DECK_TABLES.forEach((t, i) => out.push({ name: `deck-table-${i}`, x: t.x, z: t.z, r: 0.3 }));
  return out;
}

/* ---------------------------------------------------------------- palette */
// Starting values from docs/06 §3.5, refined against the renders (see qa/tmp/maxone/palette notes in the report).
export const COLOURS = {
  tileA: '#cfcfcc',
  tileB: '#b9bab7',
  tileC: '#a5a6a3',
  grout: '#8f8f8d',
  paving: '#d6d5d0',
  herringLight: '#f1f1ee',
  herringDark: '#232322',
  ceiling: '#2f2e2c',
  ceilingLight: '#ebe8e1',
  beam: '#262524',
  plaster: '#e9e5de',
  brick: '#e3e1dc',
  beige: '#c2b7a7',
  sage: '#93a076',
  sageDark: '#5d6b49',
  sageDeep: '#3f4a34',
  mustard: '#dba93a',
  mustardDark: '#b98722',
  navy: '#435f7e',
  navyDark: '#34495f',
  rope: '#d8c8a8',
  salmon: '#d58c76',
  mint: '#9dc8b4',
  teal: '#3f6f72',
  lime: '#b9cf7a',
  burgundy: '#84292f',
  timber: '#a57448',
  timberLight: '#d9c3a0',
  timberDark: '#6e4a33',
  deck: '#7a5440',
  black: '#222221',
  white: '#f3f1ec',
  stone: '#3a3a39',
  terrazzo: '#eeebe4',
  concrete: '#cfcdc8',
  tileGreen: '#8fa39a',
  rattan: '#b9905a',
  leafA: '#4f7a3a',
  leafB: '#3c5f2c',
  leafC: '#6b9448',
  pot: '#9a9a96',
  asphalt: '#4a4a4c',
  ground: '#dedcd5',
  glass: '#cfe0e4',
  lamp: '#fff3d6',
  blue: '#3b4f9a',
};

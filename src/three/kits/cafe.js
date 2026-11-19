// The café (docs/06 §2.3): 16 × 10 m, one floor of 4.2 m with a full-height glazed front and no roof.
// Inside: an L-shaped counter with a dark top, a back shelf, a window bar and eight round tables.
// In front (the plot's open band): planters and a pergola with slats on a 0.6 m rhythm over four tables.
//
// Pure: (params) → Piece[] in metres. `origin` is the centre of the footprint at its base; the front
// faces +z. Pieces: 'box' and 'cyl' (clay), 'glass' (shopfront), 'dark' (counter tops).
import { box, cyl, sequence } from '../assembly/pieces.js';

const W = 16;
const D = 10;
const SLAB = 0.2;
const T = 0.25;
const HEAD = 0.5; // header beam over the glazing

/** A round table with n chairs around it (seat + back), starting at angle a0. */
function tableSet(tables, chairs, at, x, y, z, n, a0) {
  tables.push(cyl(0.06, 0.7, at(x, y + 0.35, z), { tone: 'base' }));
  tables.push(cyl(0.4, 0.05, at(x, y + 0.725, z), { tone: 'soft' }));
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    const rotY = Math.PI / 2 - a;
    chairs.push(box([0.42, 0.45, 0.42], at(x + Math.cos(a) * 0.78, y + 0.225, z + Math.sin(a) * 0.78), { rotY, tone: 'base' }));
    chairs.push(box([0.42, 0.42, 0.06], at(x + Math.cos(a) * 0.97, y + 0.66, z + Math.sin(a) * 0.97), { rotY, tone: 'base' }));
  }
}

export function buildCafe({ origin = [0, 0, 0], stage = 0, seed = 5, height = 4.2 } = {}) {
  const [ox, oy, oz] = origin;
  const at = (x, y, z) => [ox + x, oy + y, oz + z];
  const hx = W / 2;
  const hz = D / 2;
  const y = SLAB;
  const H = height - SLAB;
  const gh = H - HEAD;
  const deck = 0.08;

  const base = [box([W + 0.4, SLAB, D + 0.4], at(0, SLAB / 2, 0), { tone: 'slab' }), box([14.8, deck, 3.8], at(0, deck / 2, 7.8), { tone: 'slab' })];

  const walls = [
    box([W, H, T], at(0, y + H / 2, -hz + T / 2), { tone: 'wall' }),
    box([T, H, D - T], at(hx - T / 2, y + H / 2, T / 2), { tone: 'wall' }),
    box([T, H, hz - T], at(-hx + T / 2, y + H / 2, -(hz - T) / 2), { tone: 'wall' }),
    box([T, HEAD, hz - T], at(-hx + T / 2, y + H - HEAD / 2, (hz - T) / 2), { tone: 'wall' }),
    box([W, HEAD, T], at(0, y + H - HEAD / 2, hz - T / 2), { tone: 'wall' }),
  ];

  // shopfront: mullions and full-height panes; the west wall's front half is glazed too
  const front = [{ kind: 'glass', size: [0.05, gh, hz - 0.16], pos: at(-hx + 0.1, y + gh / 2, (hz - 0.16) / 2) }];
  const step = (W - 0.2) / 6;
  for (let k = 0; k <= 6; k++) {
    const x = -hx + 0.1 + k * step;
    front.push(box([0.14, gh, 0.18], at(x, y + gh / 2, hz - 0.1), { tone: 'wall' }));
    if (k < 6) front.push({ kind: 'glass', size: [step - 0.14, gh, 0.05], pos: at(x + step / 2, y + gh / 2, hz - 0.1) });
  }

  // counter (L-shaped, dark top), back shelf, machine, stools, window bar
  const counter = [
    box([5.2, 1.0, 0.8], at(3.6, y + 0.5, -2.6), { tone: 'soft' }),
    box([0.8, 1.0, 2.4], at(5.8, y + 0.5, -1.0), { tone: 'soft' }),
    { kind: 'dark', size: [5.4, 0.08, 1.0], pos: at(3.6, y + 1.04, -2.6) },
    { kind: 'dark', size: [1.0, 0.08, 2.5], pos: at(5.8, y + 1.04, -0.85) },
    box([5.6, 2.3, 0.45], at(3.6, y + 1.15, -hz + T + 0.25), { tone: 'soft' }),
    box([0.8, 0.45, 0.5], at(2.2, y + 1.305, -2.6), { tone: 'base' }),
    box([0.45, 1.0, 3.6], at(-hx + 0.5, y + 0.5, 2.6), { tone: 'soft' }),
  ];
  for (const x of [1.6, 2.7, 3.8, 4.8]) counter.push(cyl(0.2, 0.72, at(x, y + 0.36, -1.5), { tone: 'base' }));
  for (const z of [1.5, 2.6, 3.7]) counter.push(cyl(0.2, 0.72, at(-hx + 1.15, y + 0.36, z), { tone: 'base' }));

  const tables = [];
  const chairs = [];
  const spots = [
    [-5.6, -3.2, 4],
    [-2.6, -3.3, 2],
    [-4.9, -0.5, 3],
    [-1.9, -0.3, 4],
    [-4.2, 2.6, 2],
    [-1.2, 2.8, 4],
    [1.9, 2.4, 3],
    [4.9, 2.6, 2],
  ];
  spots.forEach(([x, z, n], i) => tableSet(tables, chairs, at, x, y, z, n, 0.4 + i * 1.3));

  // outside: planters along the front, the pergola, four tables under it
  const planters = [];
  for (const x of [-6.3, -2.9, 2.9, 6.3]) {
    planters.push(box([2.2, 0.55, 0.55], at(x, 0.275, hz + 0.55), { tone: 'soft' }));
    [-0.7, 0, 0.7].forEach((dx, i) => planters.push(cyl(0.3, 0.4 + i * 0.1, at(x + dx, 0.55 + (0.4 + i * 0.1) / 2, hz + 0.55), { tone: 'base' })));
  }
  const frame = [];
  for (const x of [-7, -2.33, 2.33, 7]) for (const z of [6.2, 9.4]) frame.push(box([0.16, 2.7, 0.16], at(x, deck + 1.35, z), { tone: 'wall' }));
  for (const z of [6.2, 9.4]) frame.push(box([14.4, 0.2, 0.14], at(0, deck + 2.8, z), { tone: 'wall' }));
  const slats = [];
  for (let k = 0; k < 24; k++) slats.push(box([0.08, 0.14, 3.7], at(-6.9 + k * 0.6, deck + 2.97, 7.8), { tone: 'wall' }));
  const outTables = [];
  const outChairs = [];
  [-5.2, -1.75, 1.75, 5.2].forEach((x, i) => tableSet(outTables, outChairs, at, x, deck, 7.8, 3, 0.9 + i * 0.8));

  const groups = [base, walls, front, counter, [...tables, ...chairs], planters, frame, slats, [...outTables, ...outChairs]];
  return sequence(groups, { seed, stage });
}

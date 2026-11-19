// The sports court (docs/06 §2.3): one padel court 20 × 10 m along x (turf, lines, a net, glass back
// walls 3 m with 1 m of mesh above, stepped side walls, mesh fencing between, four light poles) and
// a small clubhouse 7 × 8 m on the east side with a glazed front and no roof.
//
// Pure: (params) → Piece[] in metres. `origin` is the centre of the building band at its base; the
// front faces +z. Pieces: 'box' and 'cyl' (clay), 'court' (court glass), 'mesh' (fence screens),
// 'glass' (clubhouse front), 'dark' (the net, the counter top). Pass plainGlass to get 'glass' only.
import { box, cyl, sequence } from '../assembly/pieces.js';

const L = 20; // court length (x)
const B = 10; // court width (z)
const TURF = 0.12;

export function buildSports({ origin = [0, 0, 0], stage = 0, seed = 6, plainGlass = false } = {}) {
  const [ox, oy, oz] = origin;
  const at = (x, y, z) => [ox + x, oy + y, oz + z];
  const court = plainGlass ? 'glass' : 'court';
  const mesh = plainGlass ? 'glass' : 'mesh';
  const cx = -4; // court centre; the clubhouse sits east of it
  const hl = L / 2;
  const hb = B / 2;
  const y = TURF;

  const turf = [box([L, TURF, B], at(cx, TURF / 2, 0), { tone: 'deep' })];
  const lines = [
    box([0.1, 0.02, B - 0.3], at(cx - 6.95, y + 0.01, 0), { tone: 'wall' }),
    box([0.1, 0.02, B - 0.3], at(cx + 6.95, y + 0.01, 0), { tone: 'wall' }),
    box([13.8, 0.02, 0.1], at(cx, y + 0.01, 0), { tone: 'wall' }),
    box([L - 0.3, 0.02, 0.1], at(cx, y + 0.01, -hb + 0.2), { tone: 'wall' }),
    box([L - 0.3, 0.02, 0.1], at(cx, y + 0.01, hb - 0.2), { tone: 'wall' }),
  ];

  // back walls (the short ends): posts every 2 m, glass 3 m, mesh 1 m above, a top rail
  const ends = [];
  const endPanes = [];
  for (const s of [-1, 1]) {
    const x = cx + s * (hl - 0.05);
    for (let k = 0; k <= 5; k++) ends.push(box([0.1, 4, 0.1], at(x, y + 2, -hb + 0.05 + k * ((B - 0.1) / 5)), { tone: 'wall' }));
    ends.push(box([0.1, 0.1, B], at(x, y + 4.05, 0), { tone: 'wall' }));
    for (let k = 0; k < 5; k++) {
      const z = -hb + 0.05 + (k + 0.5) * ((B - 0.1) / 5);
      endPanes.push({ kind: court, size: [0.05, 3, (B - 0.1) / 5 - 0.1], pos: at(x, y + 1.5, z) });
      endPanes.push({ kind: mesh, size: [0.04, 1, (B - 0.1) / 5 - 0.1], pos: at(x, y + 3.5, z) });
    }
  }

  // side walls (the long sides): from each end 2 m of 3 m glass, 2 m of 2 m glass, then mesh fencing
  const sides = [];
  const sidePanes = [];
  for (const s of [-1, 1]) {
    const z = s * (hb - 0.05);
    for (const e of [-1, 1]) {
      sides.push(box([0.1, 3, 0.1], at(cx + e * (hl - 2), y + 1.5, z), { tone: 'wall' }));
      sides.push(box([0.1, 3, 0.1], at(cx + e * (hl - 4), y + 1.5, z), { tone: 'wall' }));
      sidePanes.push({ kind: court, size: [1.85, 3, 0.05], pos: at(cx + e * (hl - 1.02), y + 1.5, z) });
      sidePanes.push({ kind: court, size: [1.9, 2, 0.05], pos: at(cx + e * (hl - 3), y + 1, z) });
      sidePanes.push({ kind: mesh, size: [1.9, 1, 0.04], pos: at(cx + e * (hl - 3), y + 2.5, z) });
    }
    for (let x = -5; x <= 5; x += 1) sides.push(box([0.06, 3, 0.06], at(cx + x, y + 1.5, z), { tone: 'wall' }));
    sides.push(box([L - 0.2, 0.08, 0.08], at(cx, y + 3.04, z), { tone: 'wall' }));
    sides.push(box([12, 0.05, 0.05], at(cx, y + 1.5, z), { tone: 'wall' }));
    for (let x = -5; x <= 5; x += 2) sidePanes.push({ kind: mesh, size: [1.94, 3, 0.04], pos: at(cx + x, y + 1.5, z) });
  }

  const net = [
    { kind: 'dark', size: [0.06, 0.88, B - 0.3], pos: at(cx, y + 0.46, 0) },
    cyl(0.06, 1, at(cx, y + 0.5, -hb + 0.12), { tone: 'wall' }),
    cyl(0.06, 1, at(cx, y + 0.5, hb - 0.12), { tone: 'wall' }),
  ];

  const poles = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      poles.push(cyl(0.09, 6.4, at(cx + sx * 5, 3.2, sz * (hb + 0.45)), { tone: 'wall' }));
      poles.push(box([0.9, 0.14, 0.42], at(cx + sx * 5, 6.4, sz * (hb + 0.2)), { tone: 'base' }));
    }
  }

  // clubhouse 7 × 8, one floor, glazed toward the street and toward the court
  const hx0 = 7.2;
  const hx1 = 14.2;
  const hw = (hx1 - hx0) / 2;
  const hc = (hx0 + hx1) / 2;
  const hd = 4;
  const hy = 0.2;
  const hh = 3.2;
  const gh = hh - 0.5;
  const house = [
    box([hx1 - hx0 + 0.3, hy, 2 * hd + 0.3], at(hc, hy / 2, 0), { tone: 'slab' }),
    box([hx1 - hx0, hh, 0.2], at(hc, hy + hh / 2, -hd + 0.1), { tone: 'wall' }),
    box([0.2, hh, 2 * hd - 0.2], at(hx1 - 0.1, hy + hh / 2, 0.1), { tone: 'wall' }),
    box([0.2, hh, hd - 0.2], at(hx0 + 0.1, hy + hh / 2, -(hd - 0.2) / 2), { tone: 'wall' }),
    box([0.2, 0.5, hd - 0.2], at(hx0 + 0.1, hy + hh - 0.25, (hd - 0.2) / 2), { tone: 'wall' }),
    box([hx1 - hx0, 0.5, 0.2], at(hc, hy + hh - 0.25, hd - 0.1), { tone: 'wall' }),
    box([hx1 - hx0 + 0.4, 0.14, 1.4], at(hc, hy + gh + 0.07, hd + 0.7), { tone: 'slab' }),
  ];
  const houseGlass = [{ kind: 'glass', size: [0.05, gh, hd - 0.3], pos: at(hx0 + 0.1, hy + gh / 2, (hd - 0.3) / 2) }];
  const step = (2 * hw - 0.2) / 3;
  for (let k = 0; k <= 3; k++) {
    const x = hx0 + 0.1 + k * step;
    houseGlass.push(box([0.14, gh, 0.16], at(x, hy + gh / 2, hd - 0.1), { tone: 'wall' }));
    if (k < 3) houseGlass.push({ kind: 'glass', size: [step - 0.14, gh, 0.05], pos: at(x + step / 2, hy + gh / 2, hd - 0.1) });
  }
  const inside = [
    box([2.6, 1.0, 0.7], at(hc + 0.8, hy + 0.5, -2.4), { tone: 'soft' }),
    { kind: 'dark', size: [2.8, 0.08, 0.9], pos: at(hc + 0.8, hy + 1.04, -2.4) },
    box([0.5, 1.9, 3.0], at(hx1 - 0.5, hy + 0.95, 1.6), { tone: 'soft' }),
    box([1.8, 0.45, 0.45], at(hx0 + 1.6, hy + 0.225, -3.2), { tone: 'soft' }),
    box([0.45, 0.45, 1.8], at(hx0 + 0.75, hy + 0.225, 1.8), { tone: 'soft' }),
  ];
  for (const [x, z] of [
    [hc - 0.4, 1.9],
    [hc + 1.4, 0.3],
  ]) {
    inside.push(cyl(0.06, 0.7, at(x, hy + 0.35, z), { tone: 'base' }));
    inside.push(cyl(0.4, 0.05, at(x, hy + 0.725, z), { tone: 'soft' }));
    for (const a of [0.6, 3.6]) inside.push(box([0.42, 0.45, 0.42], at(x + Math.cos(a) * 0.78, hy + 0.225, z + Math.sin(a) * 0.78), { rotY: Math.PI / 2 - a, tone: 'base' }));
  }

  // in the open band: a path to the door, benches facing the court, planters
  const yard = [box([3.2, 0.06, 3.6], at(hc, 0.03, 7.9), { tone: 'slab' }), box([3.0, 0.45, 0.5], at(cx - 4.5, 0.225, 7.4), { tone: 'soft' }), box([3.0, 0.45, 0.5], at(cx + 4.5, 0.225, 7.4), { tone: 'soft' })];
  for (const x of [cx - 9, cx, cx + 9]) {
    yard.push(box([1.8, 0.5, 0.55], at(x, 0.25, 8.9), { tone: 'soft' }));
    for (const dx of [-0.5, 0.5]) yard.push(cyl(0.3, 0.45, at(x + dx, 0.725, 8.9), { tone: 'base' }));
  }

  const groups = [turf, lines, ends, endPanes, sides, sidePanes, net, poles, house, houseGlass, inside, yard];
  return sequence(groups, { seed, stage });
}

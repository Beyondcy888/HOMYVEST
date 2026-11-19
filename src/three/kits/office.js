// The office (docs/06 §2.3): 22 × 12 m, three floors at 3.8 m. Columns on a 5.25 × 5.5 m grid, a
// glass curtain wall with slim mullions, a dark core at the west end. The top floor is cut at 1.4 m
// with no roof: six desk clusters, a glazed meeting room and a lounge.
//
// Pure: (params) → Piece[] in metres. `origin` is the centre of the footprint at its base; the front
// faces +z. Pieces: 'box' (clay), 'curtain' (curtain-wall glass; pass plainGlass to get 'glass'),
// 'dark' (core).
import { box, sequence } from '../assembly/pieces.js';

const SLAB = 0.25;
const W = 22;
const D = 12;
const COLS_X = [-10.5, -5.25, 0, 5.25, 10.5];
const COLS_Z = [-5.5, 0, 5.5];

export function buildOffice({ origin = [0, 0, 0], stage = 0, seed = 4, floors = 3, floorHeight = 3.8, cut = 1.4, plainGlass = false } = {}) {
  const [ox, oy, oz] = origin;
  const at = (x, y, z) => [ox + x, oy + y, oz + z];
  const pane = plainGlass ? 'glass' : 'curtain';
  const hx = W / 2;
  const hz = D / 2;
  const groups = [];

  for (let f = 0; f < floors; f++) {
    const top = f === floors - 1;
    const ground = f === 0;
    const y = f * floorHeight + SLAB;
    const h = top ? cut : floorHeight - SLAB;
    const pad = ground ? 0.5 : 0;
    groups.push([box([W + pad, SLAB, D + pad], at(0, y - SLAB / 2, 0), { tone: 'slab' })]);

    const columns = [];
    for (const x of COLS_X) for (const z of COLS_Z) columns.push(box([0.5, h, 0.5], at(x, y + h / 2, z), { tone: 'base' }));
    groups.push(columns);

    // curtain wall: mullions and panes on all four sides
    const skin = [];
    const inset = 0.08;
    const stepX = (W - 2 * inset) / 8;
    for (const s of [-1, 1]) {
      const z = s * (hz - inset);
      for (let k = 0; k <= 8; k++) {
        const x = -hx + inset + k * stepX;
        skin.push(box([0.12, h, 0.16], at(x, y + h / 2, z), { tone: 'wall' }));
        if (k < 8) skin.push({ kind: pane, size: [stepX - 0.12, h, 0.05], pos: at(x + stepX / 2, y + h / 2, z) });
      }
    }
    const stepZ = (D - 2 * inset) / 4;
    for (const s of [-1, 1]) {
      const x = s * (hx - inset);
      for (let k = 0; k < 4; k++) {
        const z = -hz + inset + k * stepZ;
        if (k > 0) skin.push(box([0.16, h, 0.12], at(x, y + h / 2, z), { tone: 'wall' }));
        skin.push({ kind: pane, size: [0.05, h, stepZ - 0.12], pos: at(x, y + h / 2, z + stepZ / 2) });
      }
    }
    if (ground && !top) skin.push(box([5.6, 0.14, 1.6], at(2.7, y + 2.85, hz + 0.8), { tone: 'slab' })); // entrance canopy
    groups.push(skin);

    const furniture = [];
    if (!top) {
      // long benches, seen through the glass
      for (const x of [-2.6, 2.65, 7.9]) for (const z of [-2.8, 2.8]) furniture.push(box([4.2, 0.75, 1.4], at(x, y + 0.375, z), { tone: 'soft' }));
    } else {
      // six clusters of four desks, with chairs
      const clusters = [
        [-4.2, -3.2],
        [0.2, -3.2],
        [4.4, -3.2],
        [-4.2, 3.1],
        [1.0, 3.1],
        [6.2, 3.1],
      ];
      for (const [cx, cz] of clusters) {
        for (const dx of [-0.8, 0.8]) {
          for (const dz of [-0.4, 0.4]) furniture.push(box([1.6, 0.75, 0.8], at(cx + dx, y + 0.375, cz + dz), { tone: 'soft' }));
          for (const dz of [-1.1, 1.1]) furniture.push(box([0.5, 0.5, 0.5], at(cx + dx, y + 0.25, cz + dz), { tone: 'base' }));
        }
      }
      // meeting room behind glass partitions
      furniture.push({ kind: pane, size: [0.05, h, 4.6], pos: at(6.6, y + h / 2, -2.9) });
      furniture.push({ kind: pane, size: [3.6, h, 0.05], pos: at(8.4, y + h / 2, -0.6) });
      furniture.push(box([2.2, 0.75, 1.1], at(8.4, y + 0.375, -2.9), { tone: 'soft' }));
      for (const dx of [-0.7, 0.7]) for (const dz of [-0.95, 0.95]) furniture.push(box([0.5, 0.5, 0.5], at(8.4 + dx, y + 0.25, -2.9 + dz), { tone: 'base' }));
      for (const dx of [-1.5, 1.5]) furniture.push(box([0.5, 0.5, 0.5], at(8.4 + dx, y + 0.25, -2.9), { tone: 'base' }));
      // lounge beside the core
      for (const z of [-4.4, 4.4]) furniture.push(box([2.4, 0.45, 0.9], at(-8.2, y + 0.225, z), { tone: 'soft' }));
    }
    groups.push(furniture);

    // core 4 × 6 at the west end
    const ch = top ? h + 1.1 : h;
    groups.push([{ kind: 'dark', size: [4, ch, 6], pos: at(-8.2, y + ch / 2, 0) }]);
  }
  return sequence(groups, { seed, stage });
}

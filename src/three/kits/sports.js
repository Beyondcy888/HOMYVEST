// BLOCK-OUT placeholder (replaced by the detailed kit).
import { box, sequence } from '../assembly/pieces.js';
export function buildSports({ origin = [0, 0, 0], stage = 0, seed = 3 } = {}) {
  const [ox, oy, oz] = origin;
  const groups = [
    [box([27, 0.2, 10], [ox, oy + 0.1, oz], { tone: 'slab' })],
    [box([27, 4 - 0.2, 10], [ox, oy + 0.2 + (4 - 0.2) / 2, oz], { tone: 'wall' })],
    [{ kind: 'dark', size: [3, 4 + 0.4, 5], pos: [ox + 10, oy + (4 + 0.4) / 2, oz + 0] }],
  ];
  return sequence(groups, { seed, stage });
}

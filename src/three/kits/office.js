// BLOCK-OUT placeholder (replaced by the detailed kit).
import { box, sequence } from '../assembly/pieces.js';
export function buildOffice({ origin = [0, 0, 0], stage = 0, seed = 3 } = {}) {
  const [ox, oy, oz] = origin;
  const groups = [
    [box([22, 0.2, 12], [ox, oy + 0.1, oz], { tone: 'slab' })],
    [box([22, 11.4 - 0.2, 12], [ox, oy + 0.2 + (11.4 - 0.2) / 2, oz], { tone: 'wall' })],
    [{ kind: 'dark', size: [3, 11.4 + 0.4, 5], pos: [ox + -9, oy + (11.4 + 0.4) / 2, oz + 0] }],
  ];
  return sequence(groups, { seed, stage });
}

// BLOCK-OUT placeholder (replaced by the detailed kit).
import { box, sequence } from '../assembly/pieces.js';
export function buildStay({ origin = [0, 0, 0], stage = 0, seed = 3 } = {}) {
  const [ox, oy, oz] = origin;
  const groups = [
    [box([24, 0.2, 12], [ox, oy + 0.1, oz], { tone: 'slab' })],
    [box([24, 12.8 - 0.2, 12], [ox, oy + 0.2 + (12.8 - 0.2) / 2, oz], { tone: 'wall' })],
    [{ kind: 'dark', size: [3, 12.8 + 0.4, 5], pos: [ox + 10.5, oy + (12.8 + 0.4) / 2, oz + 3] }],
  ];
  return sequence(groups, { seed, stage });
}

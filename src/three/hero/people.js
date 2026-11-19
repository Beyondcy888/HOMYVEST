// Hero story, beat 4 ("alive"): who appears on the street. Pure data (no three.js), seeded so every
// visit is identical. World coordinates as in camera.js (plots toward −z, the road on +z).
import { makeRandom } from '../shared/rng.js';
import { PLOT, PLATE_TOP, BUILD_Z } from './camera.js';

const WALK = 0.18; // sidewalk surface
const DECK = PLATE_TOP + 0.08; // café terrace
const TURF = PLATE_TOP + 0.12; // padel court

/**
 * People, most characteristic first (so a thinned list keeps the players and the café guests):
 * { x, y, z: home spot · dx, dz: unit walking direction · range: metres walked across the beat ·
 *   delay: 0..1 when they appear · h: height factor }.
 */
export function buildPeople(seed = 9) {
  const R = makeRandom(seed);
  const [stay, office, cafe, sports] = PLOT.xs;
  const list = [];
  const add = (x, y, z, dx, dz, range) => {
    const len = Math.hypot(dx, dz) || 1;
    list.push({ x, y, z, dx: dx / len, dz: dz / len, range, delay: R.range(0, 0.55), h: R.range(0.93, 1.08) });
  };

  // four players on the court (court centre: sports − 4)
  const cx = sports - 4;
  add(cx - 5.6, TURF, BUILD_Z - 2.3, 1, 0.4, 1.8);
  add(cx - 3.4, TURF, BUILD_Z + 2.4, 0.5, -1, 1.5);
  add(cx + 3.6, TURF, BUILD_Z - 2.0, -1, 0.6, 1.8);
  add(cx + 6.2, TURF, BUILD_Z + 2.6, -0.4, -1, 1.4);
  // café terrace, between the tables
  add(cafe - 3.5, DECK, -2.6, 1, 0.2, 0.9);
  add(cafe + 0.1, DECK, -1.5, -1, 0.1, 0.8);
  add(cafe + 3.4, DECK, -2.7, 1, -0.2, 1.0);
  add(cafe - 6.6, DECK, -1.4, 1, 0, 1.2);
  // arriving at the stay's lobby and the office door
  add(stay - 8.6, PLATE_TOP, -2.2, 0.3, -1, 1.6);
  add(stay - 6.4, PLATE_TOP, -1.3, 0, -1, 1.2);
  add(stay + 2.5, PLATE_TOP, -2.4, -1, 0, 2.2);
  add(office + 2.2, PLATE_TOP, -1.2, 0.1, -1, 1.5);
  add(office + 4.0, PLATE_TOP, -2.5, -1, 0.2, 1.4);
  add(office - 6.5, PLATE_TOP, -2.2, 1, 0, 2.4);
  // by the clubhouse
  add(sports + 10.2, PLATE_TOP, -3.0, 0.2, -1, 1.0);
  add(sports + 12.0, PLATE_TOP, -2.0, -1, 0.3, 1.2);
  // walkers along the sidewalk, in both directions
  const count = 40 - list.length;
  for (let i = 0; i < count; i++) {
    const x = -13 + ((i + R.range(0.15, 0.85)) / count) * 166;
    const dir = i % 2 ? -1 : 1;
    add(x, WALK, dir > 0 ? R.range(0.45, 0.9) : R.range(1.1, 1.6), dir, 0, R.range(3, 5.5));
  }
  return list;
}

/**
 * Cars: { x, z: where it comes to rest · dir: +1 heading +x, −1 heading −x · travel: metres it glides ·
 *         delay: 0..1 }. Left-hand traffic: the lane next to the plots heads +x.
 */
export const CARS = [
  { x: 10, z: 3.05, dir: 1, travel: 24, delay: 0.0 }, // at the kerb
  { x: 60, z: 3.05, dir: 1, travel: 28, delay: 0.14 },
  { x: 124, z: 3.05, dir: 1, travel: 26, delay: 0.26 },
  { x: 33, z: 5.2, dir: 1, travel: 34, delay: 0.06 }, // passing
  { x: 84, z: 8.1, dir: -1, travel: 36, delay: 0.1 },
  { x: 146, z: 8.1, dir: -1, travel: 30, delay: 0.2 },
];

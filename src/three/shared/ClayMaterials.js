// The clay look (docs/03 §5, docs/06 §1.3): matte white architectural-model material.
// White clay = planned and being built. Colour never appears in these materials, with two exceptions
// used only by the calculator: the green zone and the paper-coloured open zone.
import * as THREE from 'three';
import { cssVar } from '../../lib/theme.js';

export const ACCENT_DARK = '#1c1b19'; // the single dark element in clay scenes (stair core and similar)
export const WARM_WINDOW = '#ffd9a8'; // emissive tint for the hero's "alive" beat only

const shade = (hex, factor) => new THREE.Color(hex).multiplyScalar(factor);

/** Per-instance tones for the 'box' kind: lets one InstancedMesh read as slabs, walls and furniture. */
export function clayTones(clayHex = cssVar('--clay') || '#eeece6') {
  return {
    base: new THREE.Color(clayHex),
    slab: shade(clayHex, 0.93), // slab edges, ground plates
    wall: shade(clayHex, 1.03), // walls, a touch lighter
    soft: shade(clayHex, 0.97), // furniture, partitions
    deep: shade(clayHex, 0.86), // roads, recesses
  };
}

/**
 * Creates the material set for a clay scene. Call once per scene (in useMemo) and dispose on unmount.
 * theme: 'light' | 'dark' (the clay stays light in dark mode; only glass and ground tints change).
 */
export function createClayMaterials(theme = 'light') {
  const clayHex = cssVar('--clay') || '#eeece6';
  const paper2 = cssVar('--paper-2') || '#f2f1ec';
  const clay = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, metalness: 0 });
  // instanceColor multiplies the base colour, so the base is white and tones carry the clay.
  const solid = new THREE.MeshStandardMaterial({ color: clayHex, roughness: 0.92, metalness: 0 });
  const dark = new THREE.MeshStandardMaterial({ color: ACCENT_DARK, roughness: 0.8, metalness: 0 });
  const glass = new THREE.MeshStandardMaterial({
    color: new THREE.Color(clayHex).lerp(new THREE.Color(theme === 'dark' ? '#9a9890' : paper2), 0.5),
    roughness: 0.25,
    metalness: 0,
    transparent: true,
    opacity: theme === 'dark' ? 0.24 : 0.18,
    depthWrite: false,
    emissive: new THREE.Color(WARM_WINDOW),
    emissiveIntensity: 0,
  });
  const green = new THREE.MeshStandardMaterial({ color: cssVar('--zone-green') || '#8c9c7a', roughness: 0.95, metalness: 0 });
  const set = { clay, solid, dark, glass, green };
  set.dispose = () => Object.values(set).forEach((m) => m?.dispose?.());
  return set;
}

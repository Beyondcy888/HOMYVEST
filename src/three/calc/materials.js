// Materials for the calculator scene. The clay comes from the shared set; this file adds the zone
// styling that must match the calculator's 2D legend (docs/03 §3):
//   building = clay, green = --zone-green, open = --paper-2 with dots, over-limit = diagonal hatch (never red).
// Dots and hatch are drawn in world space by the shader, so they keep their scale while a zone morphs
// (a texture would stretch) and they line up across every part.
import * as THREE from 'three';
import { cssVar } from '../../lib/theme.js';
import { createClayMaterials, clayTones, ACCENT_DARK } from '../shared/ClayMaterials.js';

const VARY = 'varying vec3 vCalcW;\n';
const WORLD = `
  #include <begin_vertex>
  vec4 calcW = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    calcW = instanceMatrix * calcW;
  #endif
  vCalcW = ( modelMatrix * calcW ).xyz;
`;

/** Adds a world-space pattern to a standard material. `pattern` is GLSL that sets `float calcMask` (0..1). */
function patterned(material, name, pattern, uniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = VARY + shader.vertexShader.replace('#include <begin_vertex>', WORLD);
    shader.fragmentShader =
      `${VARY}uniform vec3 uCalcInk;\nuniform float uCalcScale;\nuniform float uCalcAlpha;\n` +
      shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>\n{\n  float calcMask = 0.0;\n${pattern}\n  diffuseColor.rgb = mix( diffuseColor.rgb, uCalcInk, calcMask * uCalcAlpha );\n}`,
      );
  };
  material.customProgramCacheKey = () => `calc-${name}`;
  material.userData.uniforms = uniforms;
  return material;
}

// Dots on a square grid, on upward faces only. When the grid gets too fine for the screen they fade to
// their average tone instead of shimmering.
const DOTS = `
  vec2 cell = vCalcW.xz / uCalcScale;
  vec2 g = fract( cell ) - 0.5;
  float aa = max( fwidth( cell.x ), fwidth( cell.y ) );
  float disc = 1.0 - smoothstep( 0.16 - aa, 0.16 + aa, length( g ) );
  float flat_ = clamp( ( aa - 0.16 ) / 0.3, 0.0, 1.0 );
  vec3 n = normalize( cross( dFdx( vCalcW ), dFdy( vCalcW ) ) );
  calcMask = mix( disc, 0.08, flat_ ) * step( 0.5, abs( n.y ) );
`;
// 135° stripes, 2 in 7 inked like the CSS .hatch, diagonal on every face of a box.
const HATCH = `
  float s = ( vCalcW.x + vCalcW.y - vCalcW.z ) / uCalcScale;
  float aa = fwidth( s );
  float tri = abs( fract( s ) - 0.5 );
  calcMask = mix( 1.0 - smoothstep( 0.143 - aa, 0.143 + aa, tri ), 0.286, clamp( ( aa - 0.25 ) / 0.4, 0.0, 1.0 ) );
`;

export function createCalcMaterials(theme = 'light') {
  const clay = createClayMaterials(theme);
  const clayHex = cssVar('--clay') || '#eeece6';
  const paper2 = cssVar('--paper-2') || '#f2f1ec';
  const ink = cssVar('--ink') || '#0b0b0a';
  const green = cssVar('--zone-green') || '#8c9c7a';
  const scale = { value: 0.5 };

  const tones = clayTones(clayHex);
  tones.glass = new THREE.Color(clayHex).multiplyScalar(0.6); // glazing: windows, shop fronts, doors
  tones.gap = new THREE.Color(clayHex).multiplyScalar(0.55); // the shadow gap between storeys

  const plate = patterned(new THREE.MeshStandardMaterial({ color: paper2, roughness: 0.95, metalness: 0 }), 'dots', DOTS, {
    uCalcInk: { value: new THREE.Color(ink) }, uCalcScale: scale, uCalcAlpha: { value: theme === 'dark' ? 0.26 : 0.45 },
  });
  // Over-limit parts of the building: the clay stays light in both themes, so the hatch on it is always dark.
  const hatchScale = { value: 0.6 };
  const hatch = patterned(new THREE.MeshStandardMaterial({ color: new THREE.Color(clayHex).multiplyScalar(1.03), roughness: 0.92, metalness: 0 }), 'hatch', HATCH, {
    uCalcInk: { value: new THREE.Color(ACCENT_DARK) }, uCalcScale: hatchScale, uCalcAlpha: { value: 0.92 },
  });
  // Missing green on the ground: hatch in the theme's ink over the open tone.
  const hatchFlat = patterned(new THREE.MeshStandardMaterial({ color: paper2, roughness: 0.95, metalness: 0 }), 'hatch', HATCH, {
    uCalcInk: { value: new THREE.Color(ink) }, uCalcScale: hatchScale, uCalcAlpha: { value: 0.85 },
  });
  // Ghost floors: glass kind, opacity 0.22 (docs/06 §5.3).
  const ghost = new THREE.MeshStandardMaterial({
    color: new THREE.Color(clayHex), roughness: 0.4, metalness: 0, transparent: true, opacity: theme === 'dark' ? 0.2 : 0.22, depthWrite: false,
  });
  const tuft = new THREE.MeshStandardMaterial({ color: new THREE.Color(green).multiplyScalar(0.82), roughness: 1, metalness: 0 });

  const set = {
    clay: clay.clay, dark: clay.dark, green: clay.green, plate, hatch, hatchFlat, ghost, tuft, tones,
    ink, inkOnClay: ACCENT_DARK,
    /** Pattern scale in metres (dot pitch); the hatch follows it. */
    setScale(metres) { scale.value = metres; hatchScale.value = metres * 1.25; },
  };
  set.dispose = () => {
    clay.dispose();
    [plate, hatch, hatchFlat, ghost, tuft].forEach((m) => m.dispose());
  };
  return set;
}

/** A dot pitch that reads the same at any plot size: about 1/70 of the plot's diagonal, snapped. */
export function dotPitch(diagonal) {
  const raw = diagonal / 70;
  const steps = [0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10];
  return steps.reduce((best, s) => (Math.abs(s - raw) < Math.abs(best - raw) ? s : best), steps[0]);
}

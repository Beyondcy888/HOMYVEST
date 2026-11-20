// "Street fog": the hero's version of the paper fog (docs/06 §1.3). Instead of fading with distance
// from the camera, the model fades into the page with distance ALONG THE STREET from the plot in
// focus. While the camera is on one plot, its neighbours and the far road are simply paper; when the
// camera pulls back, the window opens and the whole street appears.
//
// It reuses three's fog switch and its near / far uniforms (metres from the focus), but instead of
// mixing toward a colour it fades the fragment's ALPHA. The canvas is transparent, so whatever page
// colour is behind it shows through: light theme, dark theme, or nothing at all (transparent posters).
// The distance is evaluated per fragment, because the road is one 266 m piece.
// The window is wider on the +x side (uStreet.w < 1): the key light throws shadows that way.
import * as THREE from 'three';

const VERTEX = /* glsl */ `
#include <fog_vertex>
vec4 streetPos = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  streetPos = instanceMatrix * streetPos;
#endif
vStreet = ( modelMatrix * streetPos ).xz;
`;

// Opaque materials are drawn without blending, so their colour is premultiplied here; transparent ones
// are alpha-blended by three and only need their alpha scaled.
const fragment = (opaque) => /* glsl */ `
#ifdef USE_FOG
  float streetDx = vStreet.x - uStreet.x;
  float streetDist = max( streetDx > 0.0 ? streetDx * uStreet.w : - streetDx, abs( vStreet.y - uStreet.y ) * uStreet.z );
  float streetVis = 1.0 - smoothstep( fogNear, fogFar, streetDist );
  gl_FragColor.a *= streetVis;
  ${opaque ? 'gl_FragColor.rgb *= streetVis;' : ''}
#endif
`;

const SWAY = /* glsl */ `
#include <begin_vertex>
#ifdef USE_INSTANCING
  // tufts lean a couple of degrees, each with its own phase
  float swayPhase = instanceMatrix[3][0] * 0.42 + instanceMatrix[3][2] * 0.31;
  transformed.x += sin( uSway * 1.15 + swayPhase ) * 0.045 * position.y;
  transformed.z += cos( uSway * 0.83 + swayPhase * 1.7 ) * 0.03 * position.y;
#endif
`;

/** One shared uniform: (focus x, focus z, z weight, +x side scale). */
export const createStreetUniform = () => ({ value: new THREE.Vector4(0, -5, 0.8, 0.68) });

/**
 * Patches a material so it fades with distance from the street focus. `sway` (a { value } uniform
 * holding seconds) additionally adds the grass's slow lean.
 */
export function withStreetFog(material, uStreet, sway) {
  const opaque = !material.transparent;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uStreet = uStreet;
    let vs = `varying vec2 vStreet;\n${shader.vertexShader}`.replace('#include <fog_vertex>', VERTEX);
    if (sway) {
      shader.uniforms.uSway = sway;
      vs = `uniform float uSway;\n${vs}`.replace('#include <begin_vertex>', SWAY);
    }
    shader.vertexShader = vs;
    shader.fragmentShader = `uniform vec4 uStreet;\nvarying vec2 vStreet;\n${shader.fragmentShader}`.replace('#include <fog_fragment>', fragment(opaque));
  };
  material.customProgramCacheKey = () => `street-fog-${opaque ? 'o' : 't'}${sway ? '-sway' : ''}`;
  material.needsUpdate = true;
  return material;
}

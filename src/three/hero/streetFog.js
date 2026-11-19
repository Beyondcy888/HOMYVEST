// "Street fog": the hero's version of the paper fog (docs/06 §1.3). Instead of fading with distance
// from the camera, the model fades into the page with distance ALONG THE STREET from the plot in
// focus. While the camera is on one plot, its neighbours and the far road are simply paper; when the
// camera pulls back, the window opens and the whole street appears.
//
// It reuses three's own fog uniforms (so the colour is exactly the page colour, applied after tone
// mapping): scene.fog.near / .far are metres from the focus. The distance is evaluated per fragment,
// because the road is one 266 m piece and per-vertex fog cannot describe a window in its middle.
import * as THREE from 'three';

const VERTEX = /* glsl */ `
#include <fog_vertex>
vec4 streetPos = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  streetPos = instanceMatrix * streetPos;
#endif
vStreet = ( modelMatrix * streetPos ).xz;
`;

const FRAGMENT = /* glsl */ `
#ifdef USE_FOG
  float streetDist = max( abs( vStreet.x - uStreet.x ), abs( vStreet.y - uStreet.y ) * uStreet.z );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, smoothstep( fogNear, fogFar, streetDist ) );
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

/** One shared uniform: (focus x, focus z, z weight). */
export const createStreetUniform = () => ({ value: new THREE.Vector3(0, -5, 0.8) });

/**
 * Patches a material so its fog follows the street focus. `sway` (a { value } uniform holding seconds)
 * additionally adds the grass's slow lean.
 */
export function withStreetFog(material, uStreet, sway) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uStreet = uStreet;
    let vs = `varying vec2 vStreet;\n${shader.vertexShader}`.replace('#include <fog_vertex>', VERTEX);
    if (sway) {
      shader.uniforms.uSway = sway;
      vs = `uniform float uSway;\n${vs}`.replace('#include <begin_vertex>', SWAY);
    }
    shader.vertexShader = vs;
    shader.fragmentShader = `uniform vec3 uStreet;\nvarying vec2 vStreet;\n${shader.fragmentShader}`.replace('#include <fog_fragment>', FRAGMENT);
  };
  material.customProgramCacheKey = () => (sway ? 'street-fog-sway' : 'street-fog');
  material.needsUpdate = true;
  return material;
}

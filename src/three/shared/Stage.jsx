// Shared scene dressing for the clay scenes: environment, key light, fill, ground shadows, fog.
// The canvas is transparent, so the "ground" IS the page's paper colour: no plane, no horizon.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { cssVar, useTheme } from '../../lib/theme.js';
import { useTier, declineTier } from '../../lib/device/tier.js';
import { query } from '../../lib/storage.js';

/**
 * Procedural studio environment (nothing downloaded), as a PMREM texture.
 * Kept low (0.15): RoomEnvironment is brighter on one side, and at higher values it fights the key light
 * and flattens the model. It is there to give glass a little life, not to light the clay.
 *
 * Calibrated look (measured on the test scene, light theme): lit faces ≈ #f0eee6, shaded faces ≈ #cfcdc7,
 * ground shadow ≈ #b3b1ad on paper #fafaf7. Key 2.7, hemisphere 1.7, environment 0.15, Neutral tone mapping.
 */
export function Environment({ intensity = 0.15 }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const tex = pmrem.fromScene(room, 0.04).texture;
    scene.environment = tex;
    invalidate();
    return () => {
      scene.environment = null;
      tex.dispose();
      pmrem.dispose();
      room.dispose?.();
    };
  }, [gl, scene, invalidate]);
  useEffect(() => {
    scene.environmentIntensity = intensity;
    invalidate();
  }, [scene, intensity, invalidate]);
  return null;
}

// Light comes from the upper left, slightly behind the model, so shadows fall toward the viewer
// (front-right) where they ground the model. A light on the camera side hides them behind the building.
export const KEY_DIRECTION = [-0.7, 0.66, -0.28];

/**
 * Key light from the upper-left with a tightly fitted shadow camera, plus a hemisphere fill.
 *  - target: [x, y, z] the light looks at (centre of the scene)
 *  - bounds: half-size of the shadow camera box in metres (fit it to the scene: smaller = sharper shadows)
 *  - follow: optional ref to an object {x, z}; the light and its shadow box follow it (for travelling cameras)
 */
export function Lights({ target = [0, 0, 0], bounds = 40, distance = 120, intensity = 2.7, fill = 1.7, direction = KEY_DIRECTION, softness = 5, follow }) {
  const tier = useTier();
  const theme = useTheme();
  const light = useRef(null);
  const dim = theme === 'dark' ? 0.9 : 1;
  const dir = useMemo(() => new THREE.Vector3(...direction).normalize(), [direction]);

  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(...target);
    l.position.set(target[0] + dir.x * distance, target[1] + dir.y * distance, target[2] + dir.z * distance);
    l.target.updateMatrixWorld();
    const cam = l.shadow.camera;
    cam.left = -bounds;
    cam.right = bounds;
    cam.top = bounds;
    cam.bottom = -bounds;
    cam.near = 1;
    cam.far = distance * 2.2;
    cam.updateProjectionMatrix();
    l.shadow.needsUpdate = true;
  }, [target, bounds, distance, dir]);

  useFrame(() => {
    const f = follow?.current;
    const l = light.current;
    if (!f || !l) return;
    l.target.position.set(f.x, target[1], f.z);
    l.position.set(f.x + dir.x * distance, target[1] + dir.y * distance, f.z + dir.z * distance);
    l.target.updateMatrixWorld();
  });

  return (
    <>
      <hemisphereLight args={['#ffffff', '#d8d4cc', fill * dim]} />
      <directionalLight
        ref={light}
        intensity={intensity * dim}
        castShadow={tier.shadows}
        shadow-mapSize={[tier.shadowMap || 512, tier.shadowMap || 512]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={softness}
        shadow-blurSamples={12}
      />
    </>
  );
}

/**
 * Ground: an invisible plane that only shows the shadows falling on it, plus soft contact shadows.
 *  - size: plane size in metres
 *  - contact: { position, scale, far, blur, opacity, resolution } for the contact-shadow pass, or false
 *  - contactKey: change it to re-render the contact shadows (they render once, not every frame)
 */
export function Ground({ size = 600, y = 0, position = [0, 0, 0], shadowOpacity = 0.13, contact, contactKey = 0 }) {
  const tier = useTier();
  const theme = useTheme();
  return (
    <>
      {tier.shadows ? (
        <mesh rotation-x={-Math.PI / 2} position={[position[0], y, position[2]]} receiveShadow>
          <planeGeometry args={[size, size]} />
          <shadowMaterial transparent opacity={theme === 'dark' ? shadowOpacity * 2.4 : shadowOpacity} />
        </mesh>
      ) : null}
      {contact ? (
        <ContactShadows
          key={`${contactKey}-${theme}`}
          frames={1}
          position={contact.position ?? [position[0], y + 0.01, position[2]]}
          scale={contact.scale ?? 80}
          far={contact.far ?? 20}
          blur={contact.blur ?? 2.5}
          opacity={(contact.opacity ?? 0.35) * (theme === 'dark' ? 1.5 : 1)}
          resolution={contact.resolution ?? (tier.name === 'low' ? 256 : 512)}
          color="#1a1814"
        />
      ) : null}
    </>
  );
}

/** Linear fog in the page colour, so distant geometry melts into the page. */
export function PaperFog({ near = 150, far = 420 }) {
  const scene = useThree((s) => s.scene);
  const theme = useTheme();
  useEffect(() => {
    scene.fog = new THREE.Fog(cssVar('--paper') || '#fafaf7', near, far);
    return () => {
      scene.fog = null;
    };
  }, [scene, theme, near, far]);
  return null;
}

/**
 * Steps the device tier down when frames stay slow. Written for frameloop="demand": it only
 * judges runs of consecutive frames, so idle time between renders never counts as a slow frame.
 */
export function FrameWatch() {
  const slow = useRef(0);
  const count = useRef(0);
  useFrame((_, delta) => {
    if (delta > 0.1) return; // a gap, not a frame time
    count.current += 1;
    if (delta > 0.03) slow.current += 1; // under ~33 fps
    if (count.current >= 120) {
      if (slow.current / count.current > 0.5) declineTier();
      count.current = 0;
      slow.current = 0;
    }
  });
  return null;
}

/** `?perf=1` logs draw calls and triangles once a second (dev aid for the budgets in docs/06 §1.7). */
export function PerfProbe({ label = 'scene' }) {
  const gl = useThree((s) => s.gl);
  const last = useRef(0);
  const enabled = useMemo(() => query('perf') === '1', []);
  useFrame((state) => {
    if (!enabled) return;
    // frames drawn per canvas, for QA: proves which canvases render while another scene is pinned
    const frames = (window.__homyvestFrames ??= {});
    frames[label] = (frames[label] ?? 0) + 1;
    const now = state.clock.elapsedTime;
    if (now - last.current < 1) return;
    last.current = now;
    const { calls, triangles } = gl.info.render;
    window.__homyvestPerf = { ...(window.__homyvestPerf || {}), [label]: { calls, triangles, textures: gl.info.memory.textures, geometries: gl.info.memory.geometries } };
    console.info(`[perf:${label}] draw calls ${calls} · triangles ${triangles} · textures ${gl.info.memory.textures}`);
  });
  return null;
}

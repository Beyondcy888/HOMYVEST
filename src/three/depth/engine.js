// Depth parallax engine (docs/06 §6): a subtle 2.5D "looking into the room" motion on photographic renders.
//
// One shared, off-screen WebGL context draws every depth image. Each image owns a small 2D canvas that
// sits exactly over its <img> in the normal page flow, and the shared renderer's output is copied into it.
// That keeps a single WebGL context for all images, and because each view is an ordinary DOM element,
// stacking, clipping, text over photos, the header and the lightbox all behave as they would with a plain image.
//
// Nothing renders while nothing moves: frames are drawn only while an offset is still settling.
import * as THREE from 'three';
import depthStatus from '../../content/depth-status.json';
import { variantUrl, media } from '../../components/media/Img.jsx';
import { getTier } from '../../lib/device/tier.js';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';

const POINTER_MAX = 0.012; // UV units
const SCROLL_MAX = 0.008;
const OVERSCAN = 1.04; // the image is drawn 4% larger so shifted edges never show a border
const MIN_WIDTH = 360; // CSS px: smaller images keep the plain <picture>

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const FRAG = /* glsl */ `
  uniform sampler2D uImage;
  uniform sampler2D uDepth;
  uniform vec2 uOffset;
  uniform float uFocus;
  uniform vec4 uCover; // scale.xy, offset.xy
  varying vec2 vUv;
  vec2 cover(vec2 uv) { return uv * uCover.xy + uCover.zw; }
  void main() {
    vec2 uv = cover(vUv);
    float d = texture2D(uDepth, uv).r;
    vec2 shift = uOffset * (d - uFocus);
    // three taps soften tearing at depth edges
    vec4 c = texture2D(uImage, clamp(uv + shift, 0.001, 0.999)) * 0.6
           + texture2D(uImage, clamp(uv + shift * 0.85, 0.001, 0.999)) * 0.2
           + texture2D(uImage, clamp(uv + shift * 1.15, 0.001, 0.999)) * 0.2;
    gl_FragColor = c;
    #include <colorspace_fragment>
  }
`;

let renderer = null;
let scene = null;
let camera = null;
let material = null;
let failed = false;
let raf = 0;
let bufferW = 0;
let bufferH = 0;
const items = new Set();
const pointer = { x: 0, y: 0, active: false };
// ImageBitmapLoader decodes off the main thread, so a texture upload never costs a long frame.
// flipY is ignored for bitmaps, so the flip is requested from the decoder instead.
const bitmaps = typeof createImageBitmap === 'function';
const loader = bitmaps ? new THREE.ImageBitmapLoader().setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' }) : new THREE.TextureLoader();
const uploads = []; // textures waiting for their GPU upload: at most one per frame

export const depthAvailable = (id) => Boolean(depthStatus.available && depthStatus.items?.[id]);

function init() {
  if (renderer || failed) return !failed;
  try {
    const canvas = document.createElement('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'default' });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      shutdown();
    });
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uImage: { value: null },
        uDepth: { value: null },
        uOffset: { value: new THREE.Vector2() },
        uFocus: { value: 0.5 },
        uCover: { value: new THREE.Vector4(1, 1, 0, 0) },
      },
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.addEventListener(
        'pointermove',
        (e) => {
          pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
          pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
          pointer.active = true;
          wake();
        },
        { passive: true },
      );
    }
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', () => {
      items.forEach((it) => (it.dirty = true));
      wake();
    });
    return true;
  } catch (error) {
    console.warn('[depth] disabled:', error?.message ?? error);
    failed = true;
    return false;
  }
}

/** Something broke (context lost): fall back to the plain pictures everywhere. */
function shutdown() {
  failed = true;
  cancelAnimationFrame(raf);
  raf = 0;
  items.forEach((it) => {
    it.el.dataset.depthLive = 'false';
    it.io.disconnect();
  });
  items.clear();
}

function loadTexture(url, srgb) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (loaded) => {
        const tex = bitmaps ? new THREE.Texture(loaded) : loaded;
        tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

async function ensureTextures(it) {
  if (it.loading || it.image) return;
  it.loading = true;
  try {
    const cssW = it.el.clientWidth || 800;
    const want = Math.min(1600, Math.ceil(cssW * Math.min(window.devicePixelRatio || 1, 1.5)));
    const [image, depth] = await Promise.all([
      loadTexture(variantUrl(it.id, want), true),
      loadTexture(depthStatus.items[it.id].url, false),
    ]);
    if (!items.has(it)) {
      image.dispose();
      depth.dispose();
      return;
    }
    // Hand the pair to the upload queue; the image goes live once both are on the GPU.
    uploads.push({ it, image, depth, step: 0 });
    wake();
  } catch {
    it.broken = true; // keep the plain picture
  } finally {
    it.loading = false;
  }
}

function releaseTextures(it) {
  it.image?.dispose();
  it.depth?.dispose();
  it.image = null;
  it.depth = null;
  it.el.dataset.depthLive = 'false';
}

function draw(it, dt) {
  const rect = it.el.getBoundingClientRect();
  if (rect.width < MIN_WIDTH || rect.height < 40) return false;
  // Target offset: pointer (desktop) plus the image's position in the viewport (all devices).
  const scrollPos = Math.max(-1, Math.min(1, ((rect.top + rect.height / 2) / window.innerHeight) * 2 - 1));
  const tx = (pointer.active ? -pointer.x * POINTER_MAX : 0) * it.strength;
  const ty = ((pointer.active ? pointer.y * POINTER_MAX : 0) + scrollPos * SCROLL_MAX) * it.strength;
  const k = 1 - Math.exp(-dt / 0.15); // damping, smooth time ≈ 0.15 s
  it.ox += (tx - it.ox) * k;
  it.oy += (ty - it.oy) * k;
  const moving = Math.abs(tx - it.ox) > 0.00008 || Math.abs(ty - it.oy) > 0.00008;
  if (!moving && !it.dirty) return false;

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = Math.max(2, Math.min(1920, Math.round(rect.width * dpr)));
  const h = Math.max(2, Math.round((w * rect.height) / rect.width));
  if (it.canvas.width !== w || it.canvas.height !== h) {
    it.canvas.width = w;
    it.canvas.height = h;
  }
  if (w > bufferW || h > bufferH) {
    bufferW = Math.max(bufferW, w);
    bufferH = Math.max(bufferH, h);
    renderer.setSize(bufferW, bufferH, false);
  }
  // object-fit: cover, then the 4% overscan
  const boxAspect = w / h;
  let sx = 1;
  let sy = 1;
  if (boxAspect > it.aspect) sy = it.aspect / boxAspect;
  else sx = boxAspect / it.aspect;
  sx /= OVERSCAN;
  sy /= OVERSCAN;
  material.uniforms.uCover.value.set(sx, sy, (1 - sx) / 2, (1 - sy) / 2);
  material.uniforms.uImage.value = it.image;
  material.uniforms.uDepth.value = it.depth;
  // Offsets are fractions of the visible frame, not of the whole image, so a tightly cropped image
  // (a tall crop of a wide render) moves exactly as gently as an uncropped one.
  material.uniforms.uOffset.value.set(it.ox * sx, it.oy * sy);
  renderer.setViewport(0, 0, w, h);
  renderer.setScissor(0, 0, w, h);
  renderer.setScissorTest(true);
  renderer.render(scene, camera);
  // WebGL's origin is bottom-left; in 2D-canvas terms the viewport is the bottom strip of the buffer.
  it.ctx.drawImage(renderer.domElement, 0, bufferH - h, w, h, 0, 0, w, h);
  it.dirty = false;
  if (it.el.dataset.depthLive !== 'true') it.el.dataset.depthLive = 'true';
  return moving;
}

let last = 0;
function frame(now) {
  raf = 0;
  if (failed || !renderer) return;
  const dt = Math.min(0.1, (now - last) / 1000 || 0.016);
  last = now;
  let again = false;
  // one texture upload per frame, so several images arriving together never pile into one long frame
  const job = uploads[0];
  if (job) {
    if (!items.has(job.it)) {
      job.image.dispose();
      job.depth.dispose();
      uploads.shift();
    } else {
      renderer.initTexture(job.step === 0 ? job.image : job.depth);
      job.step += 1;
      if (job.step === 2) {
        job.it.image = job.image;
        job.it.depth = job.depth;
        job.it.dirty = true;
        uploads.shift();
      }
    }
    again = uploads.length > 0 || again;
  }
  for (const it of items) {
    if (!it.visible || !it.image || !it.depth) continue;
    // a host can pause its depth views while they are off stage (e.g. walkthrough cards that are not showing)
    if (it.host && it.host.dataset.depthOff === "true") { it.dirty = true; continue; }
    if (draw(it, dt)) again = true;
  }
  if (again || uploads.length) raf = requestAnimationFrame(frame);
}
function wake() {
  if (!raf && !failed) {
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
}

/**
 * Registers a depth image. Returns an unregister function, or null when the effect does not apply
 * (no depth map, low tier, reduced motion, no WebGL). The plain <picture> stays as it is in that case.
 */
export function register({ el, canvas, id, strength = 1 }) {
  if (!depthAvailable(id) || getTier().name === 'low' || prefersReducedMotion()) return null;
  if (!init()) return null;
  const entry = media(id);
  const it = {
    el, canvas, id, strength,
    ctx: canvas.getContext('2d'),
    aspect: entry.width / entry.height,
    ox: 0, oy: 0, visible: false, dirty: true, image: null, depth: null, loading: false, broken: false, io: null, far: null, host: el.closest("[data-depth-host]"),
  };
  // Near the viewport: load and draw. Far away: free the textures again.
  it.io = new IntersectionObserver(
    ([e]) => {
      it.visible = e.isIntersecting;
      if (it.visible) {
        if (!it.broken) ensureTextures(it);
        it.dirty = true;
        wake();
      }
    },
    { rootMargin: '25% 0px 25% 0px' },
  );
  it.far = new IntersectionObserver(([e]) => !e.isIntersecting && releaseTextures(it), { rootMargin: '250% 0px 250% 0px' });
  it.io.observe(el);
  it.far.observe(el);
  items.add(it);
  return () => {
    it.io.disconnect();
    it.far.disconnect();
    releaseTextures(it);
    items.delete(it);
  };
}

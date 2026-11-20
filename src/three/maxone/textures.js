// Canvas-generated textures for the Maxone room (docs/06 §3.5). Nothing is downloaded; nothing exceeds 1024 px.
import * as THREE from 'three';
import { COLOURS as C } from './plan.js';
import { prng } from './kit.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}
function finish(c, { repeat = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
const FONT = '"Archivo Variable", "Archivo", ui-sans-serif, system-ui, sans-serif';

/** Floor tiles: 8 × 8 tiles (4.8 m) in a random mix of three greys with fine grout. Repeats. */
export function tileTexture() {
  const N = 8;
  const S = 64;
  const [c, g] = canvas(N * S, N * S);
  const rnd = prng(11);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const r = rnd();
      g.fillStyle = r < 0.56 ? C.tileA : r < 0.86 ? C.tileB : C.tileC;
      g.fillRect(i * S, j * S, S, S);
      // a little grain, so large areas do not look like flat plastic
      for (let k = 0; k < 26; k++) {
        g.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '60,60,60'},0.045)`;
        g.fillRect(i * S + rnd() * S, j * S + rnd() * S, 2 + rnd() * 5, 2 + rnd() * 5);
      }
    }
  }
  g.fillStyle = C.grout;
  for (let i = 0; i < N; i++) {
    g.fillRect(i * S, 0, 1, N * S);
    g.fillRect(0, i * S, N * S, 1);
  }
  return finish(c, { repeat: true });
}

/** Reception floor: light bars woven on a dark mosaic ground (a 0.6 m repeat). */
export function herringboneTexture() {
  const S = 256; // 0.6 m
  const [c, g] = canvas(S, S);
  g.fillStyle = C.herringDark;
  g.fillRect(0, 0, S, S);
  // faint mosaic joints
  g.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < S; i += 16) {
    g.fillRect(i, 0, 1, S);
    g.fillRect(0, i, S, 1);
  }
  const P = S / 2; // 0.3 m cell
  const L = (0.4 / 0.6) * S;
  const W = (0.1 / 0.6) * S;
  g.fillStyle = C.herringLight;
  const bar = (cx, cy, horizontal) => {
    for (const ox of [-S, 0, S]) {
      for (const oy of [-S, 0, S]) {
        if (horizontal) g.fillRect(cx - L / 2 + ox, cy - W / 2 + oy, L, W);
        else g.fillRect(cx - W / 2 + ox, cy - L / 2 + oy, W, L);
      }
    }
  };
  bar(P / 2, P / 2, true);
  bar(P * 1.5, P / 2, false);
  bar(P / 2, P * 1.5, false);
  bar(P * 1.5, P * 1.5, true);
  return finish(c, { repeat: true });
}

/** Timber decking: boards running along v. Repeats every 1.12 m. */
export function deckTexture() {
  const S = 256;
  const [c, g] = canvas(S, S);
  const rnd = prng(3);
  const tones = ['#7d5642', '#74503d', '#84604a', '#6c4a39'];
  for (let i = 0; i < 8; i++) {
    g.fillStyle = tones[Math.floor(rnd() * tones.length)];
    g.fillRect(i * 32, 0, 32, S);
    g.fillStyle = 'rgba(30,18,10,0.55)';
    g.fillRect(i * 32, 0, 2, S);
    g.fillRect(i * 32, Math.floor(rnd() * S), 32, 2); // one butt joint per board
  }
  return finish(c, { repeat: true });
}

/* --------------------------------------------------------------- mural */

const INK = { red: '#d24a40', green: '#55a561', blue: '#3b60a6', mustard: '#dcae3a' };

function arcText(g, text, cx, cy, r, start, size, colour) {
  g.save();
  g.fillStyle = colour;
  g.font = `800 ${size}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const step = (size * 0.74) / r;
  let a = start - (step * (text.length - 1)) / 2;
  for (const ch of text) {
    g.save();
    g.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    g.rotate(a + Math.PI / 2);
    g.fillText(ch, 0, 0);
    g.restore();
    a += step;
  }
  g.restore();
}
function roundStamp(g, cx, cy, r, colour, around, centre) {
  g.save();
  g.globalAlpha = 0.86;
  g.strokeStyle = colour;
  g.fillStyle = colour;
  g.lineWidth = r * 0.085;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = r * 0.03;
  g.beginPath();
  g.arc(cx, cy, r * 0.86, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
  g.stroke();
  arcText(g, around, cx, cy, r * 0.68, -Math.PI / 2, r * 0.22, colour);
  // centre band with a word
  g.fillRect(cx - r * 0.98, cy - r * 0.15, r * 1.96, r * 0.3);
  g.fillStyle = '#ecebe6';
  g.font = `800 ${r * 0.24}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(centre, cx, cy + r * 0.01);
  // small stars below
  g.fillStyle = colour;
  for (const dx of [-0.3, 0, 0.3]) {
    g.beginPath();
    g.arc(cx + dx * r, cy + r * 0.66, r * 0.045, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}
function boxStamp(g, cx, cy, w, h, angle, colour, top, word) {
  g.save();
  g.translate(cx, cy);
  g.rotate(angle);
  g.globalAlpha = 0.86;
  g.strokeStyle = colour;
  g.fillStyle = colour;
  g.lineWidth = h * 0.07;
  const r = h * 0.14;
  const path = (x0, y0, x1, y1, rr) => {
    g.beginPath();
    g.moveTo(x0 + rr, y0);
    g.arcTo(x1, y0, x1, y1, rr);
    g.arcTo(x1, y1, x0, y1, rr);
    g.arcTo(x0, y1, x0, y0, rr);
    g.arcTo(x0, y0, x1, y0, rr);
    g.closePath();
  };
  path(-w / 2, -h / 2, w / 2, h / 2, r);
  g.stroke();
  path(-w / 2 + h * 0.13, -h * 0.2, w / 2 - h * 0.13, h * 0.24, r * 0.4);
  g.fill();
  g.font = `700 ${h * 0.15}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(top, 0, -h * 0.33);
  g.fillText(top, 0, h * 0.37);
  g.fillStyle = '#ecebe6';
  g.font = `800 ${h * 0.34}px ${FONT}`;
  g.fillText(word, 0, h * 0.03);
  g.restore();
}

function drawMural(g, W, H) {
  const rnd = prng(5);
  g.globalAlpha = 1;
  g.fillStyle = '#e8e6e0';
  g.fillRect(0, 0, W, H);
  // soft concrete mottling
  for (let i = 0; i < 150; i++) {
    const v = rnd() < 0.5 ? 255 : 150;
    g.fillStyle = `rgba(${v},${v},${v},0.06)`;
    g.beginPath();
    g.arc(rnd() * W, rnd() * H, 20 + rnd() * 80, 0, Math.PI * 2);
    g.fill();
  }
  // Stamps: inspired by render 1 (passport stamps), not copied from it.
  roundStamp(g, 96, 150, 82, INK.green, 'MADE IN INDONESIA', 'JAKARTA');
  boxStamp(g, 250, 120, 190, 150, -0.06, INK.red, 'MADE IN', 'INDONESIA');
  roundStamp(g, 420, 120, 100, INK.mustard, 'MADE IN INDONESIA', 'INDONESIA');
  roundStamp(g, 120, 380, 104, INK.blue, 'JAKARTA · INDONESIA', 'JAKARTA');
  roundStamp(g, 330, 400, 88, INK.red, 'MADE IN INDONESIA', 'INDONESIA');
  roundStamp(g, 560, 180, 112, INK.green, 'JAKARTA · INDONESIA', 'INDONESIA');
  boxStamp(g, 800, 110, 300, 170, 0.05, INK.red, 'MADE IN', 'INDONESIA');
  roundStamp(g, 640, 380, 108, INK.blue, 'MADE IN INDONESIA', 'JAKARTA');
  boxStamp(g, 850, 300, 280, 130, -0.04, INK.blue, 'JAKARTA', 'INDONESIA');
  boxStamp(g, 520, 462, 210, 84, 0.03, INK.green, '', 'JAKARTA');
  roundStamp(g, 900, 440, 62, INK.mustard, 'MADE IN INDONESIA', 'JAKARTA');
  roundStamp(g, 990, 210, 56, INK.green, 'JAKARTA', 'ID');
  // worn ink: small flecks of the wall showing through
  g.globalAlpha = 1;
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(232,230,224,${0.35 + rnd() * 0.5})`;
    g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 4, 1 + rnd() * 3);
  }
}

/** Passport-stamp mural behind the reception (1024 × 512). `redraw()` repaints it once Archivo has loaded. */
export function muralTexture() {
  const [c, g] = canvas(1024, 512);
  drawMural(g, 1024, 512);
  const t = finish(c);
  t.userData.redraw = () => {
    drawMural(g, 1024, 512);
    t.needsUpdate = true;
  };
  return t;
}

/** Mustard line drawing on the brick wall at the west end of the hall (renders 2 and 5). */
export function lineArtTexture() {
  const S = 512;
  const [c, g] = canvas(S, S);
  g.fillStyle = C.brick;
  g.fillRect(0, 0, S, S);
  g.strokeStyle = C.mustard;
  g.fillStyle = C.mustard;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.lineWidth = 7;
  g.strokeRect(22, 22, S - 44, S - 44);
  g.lineWidth = 5;
  const sun = (cx, cy, r, a0, a1) => {
    g.beginPath();
    g.arc(cx, cy, r, a0, a1);
    g.stroke();
    for (let a = a0; a <= a1 + 0.01; a += (a1 - a0) / 14) {
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r * 1.18, cy + Math.sin(a) * r * 1.18);
      g.lineTo(cx + Math.cos(a) * r * 1.75, cy + Math.sin(a) * r * 1.75);
      g.stroke();
    }
  };
  sun(110, 120, 46, -0.3, Math.PI * 1.25);
  sun(400, 380, 58, Math.PI * 0.75, Math.PI * 2.2);
  // a few loose shapes: a leaf, a boat, a kite
  const blob = (pts) => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.stroke();
  };
  blob([[290, 70], [420, 60], [450, 110], [390, 150], [360, 110], [300, 120]]);
  blob([[90, 300], [200, 250], [230, 300], [150, 350]]);
  blob([[130, 400], [250, 390], [280, 440], [160, 462]]);
  for (const [x, y] of [[250, 190], [300, 250], [200, 200], [330, 300], [80, 230], [440, 230]]) {
    g.beginPath();
    g.ellipse(x, y, 13, 8, 0.6, 0, Math.PI * 2);
    g.stroke();
  }
  return finish(c);
}

/** Small signs in one atlas (512 × 256): the display sign (top) and the three "BAR" letter tiles (bottom). */
export const SIGN_UV = { display: [0, 0.5, 0.625, 1], bar: [0, 0, 0.75, 0.5] };
function drawSigns(g) {
  g.fillStyle = '#1c1c1b';
  g.fillRect(0, 0, 512, 256);
  // display sign 320 × 128
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.font = `500 64px ${FONT}`;
  const a = 'max';
  const b = 'one';
  const wa = g.measureText(a).width;
  const wb = g.measureText(b).width;
  const x0 = 160 - (wa + wb) / 2;
  g.fillStyle = '#b9d23c';
  g.fillText(a, x0, 66);
  g.fillStyle = '#f3f1ec';
  g.fillText(b, x0 + wa, 66);
  // BAR tiles 384 × 128
  g.fillStyle = '#d8c7a6';
  g.fillRect(0, 128, 384, 128);
  ['B', 'A', 'R'].forEach((ch, i) => {
    g.fillStyle = '#e7dcc4';
    g.fillRect(i * 128 + 8, 136, 112, 112);
    g.strokeStyle = '#8a6a4a';
    g.lineWidth = 4;
    g.strokeRect(i * 128 + 8, 136, 112, 112);
    g.fillStyle = '#8c2f2a';
    g.font = `800 92px ${FONT}`;
    g.textAlign = 'center';
    g.fillText(ch, i * 128 + 64, 197);
  });
}
export function signTexture() {
  const [c, g] = canvas(512, 256);
  drawSigns(g);
  const t = finish(c);
  t.userData.redraw = () => {
    drawSigns(g);
    t.needsUpdate = true;
  };
  return t;
}

/** Soft round shadow for under the furniture. */
export function blobTexture() {
  const [c, g] = canvas(64, 64);
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, 'rgba(0,0,0,0.9)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.42)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Removes captions ("AKSONOMETRI", "LANTAI 1/2", "BANGUNAN") and the white background
// from the padel axonometric renders. Keeps only the building, on transparency.
// Usage: node scripts/clean-padel.mjs                      (auto: <render root>/padel-court -> .cache/padel-clean)
//        node scripts/clean-padel.mjs <srcDir> <outDir>
// Output: transparent PNG masters padel-1.png, padel-2.png, padel-3.png (optimize-images.mjs makes web variants).
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

function findRenderRoot(start) {
  for (const c of ['render', 'renders', 'render/renders', 'renders/renders', 'render/render']) {
    const p = path.join(start, c);
    if (fs.existsSync(path.join(p, 'maxone')) && fs.existsSync(path.join(p, 'padel-court'))) return p;
  }
  throw new Error('Render folder not found. Expected render/ (or renders/) containing maxone/ and padel-court/.');
}
const args = process.argv.slice(2);
const srcDir = args[0] ?? path.join(findRenderRoot(process.cwd()), 'padel-court');
const outDir = args[1] ?? path.join(process.cwd(), '.cache', 'padel-clean');
fs.mkdirSync(outDir, { recursive: true });

const NONWHITE = 235;   // a pixel is "ink" if its darkest channel is below this
const WHITE = 246;      // background = near-white pixels connected to the border
const DILATE = 6;       // px; merges the building's parts into one blob before labelling

function labelComponents(mask, w, h) {
  const lab = new Int32Array(w * h); let n = 0; const sizes = [0];
  const stack = new Int32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || lab[i]) continue;
    n++; let size = 0, sp = 0; stack[sp++] = i; lab[i] = n;
    while (sp) {
      const p = stack[--sp]; size++;
      const x = p % w, y = (p / w) | 0;
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of nb) if (q >= 0 && mask[q] && !lab[q]) { lab[q] = n; stack[sp++] = q; }
    }
    sizes.push(size);
  }
  return { lab, n, sizes };
}

function dilate(mask, w, h, r) {
  let cur = mask;
  for (let k = 0; k < r; k++) {
    const nxt = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (cur[i] || (x > 0 && cur[i - 1]) || (x < w - 1 && cur[i + 1]) || (y > 0 && cur[i - w]) || (y < h - 1 && cur[i + w])) nxt[i] = 1;
    }
    cur = nxt;
  }
  return cur;
}

for (const file of ['1.png', '2.png', '3.png']) {
  const src = path.join(srcDir, file);
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const minc = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) minc[i] = Math.min(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);

  // 1) keep only the largest ink blob (the building); captions and specks are separate blobs
  const ink = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) ink[i] = minc[i] < NONWHITE ? 1 : 0;
  const blobs = labelComponents(dilate(ink, w, h, DILATE), w, h);
  let best = 1; for (let k = 2; k <= blobs.n; k++) if (blobs.sizes[k] > blobs.sizes[best]) best = k;

  // 2) background = near-white regions touching the image border
  const nearWhite = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) nearWhite[i] = minc[i] >= WHITE ? 1 : 0;
  const bgL = labelComponents(nearWhite, w, h);
  const borderLabels = new Set();
  for (let x = 0; x < w; x++) { borderLabels.add(bgL.lab[x]); borderLabels.add(bgL.lab[(h - 1) * w + x]); }
  for (let y = 0; y < h; y++) { borderLabels.add(bgL.lab[y * w]); borderLabels.add(bgL.lab[y * w + w - 1]); }
  borderLabels.delete(0);

  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = (blobs.lab[i] === best && !borderLabels.has(bgL.lab[i])) ? 255 : 0;

  // 3) soften the 1px rim so edges don't look jagged on a dark or tinted page
  const out = Buffer.alloc(w * h * 4);
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; let a = alpha[i];
    if (a) {
      const rim = (x > 0 && !alpha[i - 1]) || (x < w - 1 && !alpha[i + 1]) || (y > 0 && !alpha[i - w]) || (y < h - 1 && !alpha[i + w]);
      if (rim) a = Math.max(60, Math.min(255, (255 - minc[i]) * 4));
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    out[i * 4] = data[i * 3]; out[i * 4 + 1] = data[i * 3 + 1]; out[i * 4 + 2] = data[i * 3 + 2]; out[i * 4 + 3] = a;
  }
  const pad = 8;
  const left = Math.max(0, x0 - pad), top = Math.max(0, y0 - pad);
  const cw = Math.min(w, x1 + pad + 1) - left, ch = Math.min(h, y1 + pad + 1) - top;
  const name = `padel-${path.parse(file).name}`;
  const img = sharp(out, { raw: { width: w, height: h, channels: 4 } }).extract({ left, top, width: cw, height: ch });
  await img.png({ compressionLevel: 9 }).toFile(path.join(outDir, `${name}.png`)); // PNG master; optimize-images.mjs makes the web variants
  console.log(`${file}: ${w}x${h} -> ${name} ${cw}x${ch} (crop at ${left},${top}; kept blob ${best} of ${blobs.n})`);
}

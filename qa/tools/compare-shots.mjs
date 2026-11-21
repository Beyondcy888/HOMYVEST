// Compares two folders of same-named screenshots (before / after) and prints the share of pixels that differ.
//   node qa/tools/compare-shots.mjs qa/tmp/before-desktop qa/tmp/after-desktop [--tol 24] [--diff qa/tmp/diff]
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [a, b] = process.argv.slice(2);
const opt = (n, f) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : f;
};
const tol = Number(opt('tol', 24));
const diffDir = opt('diff');
if (diffDir) fs.mkdirSync(diffDir, { recursive: true });
for (const f of fs.readdirSync(a).filter((x) => x.endsWith('.png'))) {
  if (!fs.existsSync(path.join(b, f))) continue;
  const A = await sharp(path.join(a, f)).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const B = await sharp(path.join(b, f)).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  if (A.info.width !== B.info.width || A.info.height !== B.info.height) {
    console.log(`${f}: size differs`);
    continue;
  }
  let n = 0;
  const out = diffDir ? Buffer.alloc(A.data.length) : null;
  for (let i = 0; i < A.data.length; i += 4) {
    const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
    const hit = d > tol;
    if (hit) n += 1;
    if (out) {
      const g = Math.round((A.data[i] + A.data[i + 1] + A.data[i + 2]) / 6 + 128);
      out[i] = hit ? 255 : g; out[i + 1] = hit ? 0 : g; out[i + 2] = hit ? 0 : g; out[i + 3] = 255;
    }
  }
  const share = (100 * n) / (A.data.length / 4);
  console.log(`${f}: ${share.toFixed(2)}% of pixels differ (> ${tol})`);
  if (out) await sharp(out, { raw: { width: A.info.width, height: A.info.height, channels: 4 } }).png().toFile(path.join(diffDir, f));
}

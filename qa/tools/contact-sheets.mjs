// Groups the screenshot review set (npm run shots) into contact sheets, so a whole viewport/theme
// can be reviewed in a handful of images instead of hundreds.
//   node qa/tools/contact-sheets.mjs            → qa/screenshots/sheets/*.jpg
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'qa/screenshots';
const OUT = path.join(ROOT, 'sheets');
fs.mkdirSync(OUT, { recursive: true });

async function sheet(name, files, { cols, tile }) {
  if (!files.length) return;
  const tiles = [];
  for (const f of files) {
    const buf = await sharp(f).resize({ width: tile }).png().toBuffer();
    const { height } = await sharp(buf).metadata();
    tiles.push({ buf, h: height });
  }
  const gap = 10;
  const rows = Math.ceil(tiles.length / cols);
  const rowH = Array.from({ length: rows }, (_, r) => Math.max(...tiles.slice(r * cols, r * cols + cols).map((t) => t.h)));
  const W = cols * tile + (cols + 1) * gap;
  const H = rowH.reduce((a, b) => a + b, 0) + (rows + 1) * gap;
  const comps = [];
  let y = gap;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = tiles[r * cols + c];
      if (t) comps.push({ input: t.buf, left: gap + c * (tile + gap), top: y });
    }
    y += rowH[r] + gap;
  }
  const out = path.join(OUT, `${name}.jpg`);
  await sharp({ create: { width: W, height: H, channels: 3, background: '#808080' } }).composite(comps).jpeg({ quality: 80 }).toFile(out);
  console.log(`${out}  (${files.length} shots, ${W}x${H})`);
}

const list = (dir) => (fs.existsSync(path.join(ROOT, dir)) ? fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.png')).sort() : []);
const layout = (vp) => (vp === 'mobile' ? { cols: 6, tile: 300 } : vp === 'tablet' ? { cols: 4, tile: 440 } : { cols: 3, tile: 620 });

// sections and calculator: one sheet per viewport-theme-language
for (const dir of ['sections', 'calculator']) {
  const groups = {};
  for (const f of list(dir)) {
    const [vp, theme, lang] = f.split('-');
    (groups[`${vp}-${theme}-${lang}`] ??= []).push(path.join(ROOT, dir, f));
  }
  for (const [key, files] of Object.entries(groups)) await sheet(`${dir}-${key}`, files, layout(key.split('-')[0]));
}
// 3D scenes: one sheet per viewport-theme-scene
{
  const groups = {};
  for (const f of list('3d')) {
    const [vp, theme, scene] = f.split('-');
    (groups[`${vp}-${theme}-${scene}`] ??= []).push(path.join(ROOT, '3d', f));
  }
  for (const [key, files] of Object.entries(groups)) await sheet(`3d-${key}`, files, key.startsWith('mobile') ? { cols: 7, tile: 260 } : { cols: 4, tile: 470 });
}

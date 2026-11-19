// Tiles screenshots into one contact sheet so several can be reviewed at once.
//   node qa/tools/sheet.mjs <out.jpg> <cols> <tileWidth> <img1> <img2> …
import sharp from 'sharp';

const [out, colsArg, widthArg, ...files] = process.argv.slice(2);
const cols = Number(colsArg);
const tw = Number(widthArg);
const tiles = [];
for (const f of files) {
  const img = sharp(f).resize({ width: tw });
  const buf = await img.png().toBuffer();
  const meta = await sharp(buf).metadata();
  tiles.push({ buf, h: meta.height });
}
const rows = Math.ceil(tiles.length / cols);
const rowH = Array.from({ length: rows }, (_, r) => Math.max(...tiles.slice(r * cols, r * cols + cols).map((t) => t.h)));
const gap = 12;
const W = cols * tw + (cols + 1) * gap;
const H = rowH.reduce((a, b) => a + b, 0) + (rows + 1) * gap;
let y = gap;
const comps = [];
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const t = tiles[r * cols + c];
    if (t) comps.push({ input: t.buf, left: gap + c * (tw + gap), top: y });
  }
  y += rowH[r] + gap;
}
await sharp({ create: { width: W, height: H, channels: 3, background: '#7a7a7a' } }).composite(comps).jpeg({ quality: 82 }).toFile(out);
console.log(`sheet ${out} ${W}x${H}`);

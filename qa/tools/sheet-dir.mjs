// Contact sheet of PNGs: node qa/tools/sheet-dir.mjs <out.png> <w> <cols> file1 file2 ...
import sharp from 'sharp';
const [out, w, cols, ...files] = process.argv.slice(2);
const W = Number(w);
const metas = await Promise.all(files.map((f) => sharp(f).metadata()));
const H = Math.round((W * metas[0].height) / metas[0].width);
const C = Number(cols);
const rows = Math.ceil(files.length / C);
const comp = await Promise.all(files.map(async (f, i) => ({ input: await sharp(f).resize(W, H, { fit: 'contain', background: '#888' }).toBuffer(), left: (i % C) * (W + 8), top: Math.floor(i / C) * (H + 8) })));
await sharp({ create: { width: C * (W + 8), height: rows * (H + 8), channels: 3, background: '#888' } }).composite(comp).png().toFile(out);

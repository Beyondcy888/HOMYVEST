// Partner logos (HomyEight, Behomy) for the site.
// 1. Copies the original PNGs from assets-src/logos/ to src/assets/logos/ unchanged.
// 2. Builds display versions at 3x their largest on-screen height (updates/U01/U01_07_ASSETS.md §2)
//    as PNG + lossless WebP, keeping the alpha channel. Never upscales.
// assets-src/ holds originals: read only. Usage: npm run assets:logos
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'assets-src', 'logos');
const OUT_DIR = path.join(ROOT, 'src', 'assets', 'logos');

// name (file in assets-src/logos without .png) -> display height in px
const DISPLAY = {
  'homyeight-compact': 96,
  'homyeight-compact-on-dark': 96,
  behomy: 120,
  'behomy-on-dark': 120,
};

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const f of fs.readdirSync(SRC_DIR).filter((f) => /\.png$/i.test(f)).sort()) {
  fs.copyFileSync(path.join(SRC_DIR, f), path.join(OUT_DIR, f));
  console.log(`copy     ${f}`);
}

for (const [name, height] of Object.entries(DISPLAY)) {
  const src = path.join(SRC_DIR, `${name}.png`);
  const meta = await sharp(src).metadata();
  if (height > meta.height) throw new Error(`${name}: ${height}px would upscale a ${meta.height}px source`);
  const resized = sharp(src).ensureAlpha().resize({ height, kernel: sharp.kernel.lanczos3, withoutEnlargement: true });
  const base = `${name}@${height}`;
  const png = await resized.clone().png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toFile(path.join(OUT_DIR, `${base}.png`));
  await resized.clone().webp({ lossless: true, effort: 6 }).toFile(path.join(OUT_DIR, `${base}.webp`));
  const kb = (p) => (fs.statSync(path.join(OUT_DIR, p)).size / 1024).toFixed(1);
  console.log(`display  ${base.padEnd(32)} ${png.width}x${png.height}  png ${kb(`${base}.png`)} KB  webp ${kb(`${base}.webp`)} KB`);
}

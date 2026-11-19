// Builds web-ready, never-upscaled AVIF + WebP variants from the ORIGINAL renders,
// plus a manifest the site reads. Originals are never modified.
// Usage: node scripts/optimize-images.mjs            (auto-detects the render folder)
//        node scripts/optimize-images.mjs <renderRoot>
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'media');
const MANIFEST = path.join(ROOT, 'src', 'content', 'media-manifest.json');
const EXTRA_GROUPS = { 'padel-clean': path.join(ROOT, '.cache', 'padel-clean') }; // produced by clean-padel.mjs
const WIDTHS = [480, 800, 1200, 1600, 2000, 2560];
const IMG = /\.(png|jpe?g|webp|tiff?)$/i;

function findRenderRoot(start) {
  // The render folder is the directory that directly contains "maxone" and "padel-court".
  const candidates = ['render', 'renders', 'render/renders', 'renders/renders', 'render/render'];
  for (const c of candidates) {
    const p = path.join(start, c);
    if (fs.existsSync(path.join(p, 'maxone')) && fs.existsSync(path.join(p, 'padel-court'))) return p;
  }
  throw new Error('Render folder not found. Expected render/ (or renders/) containing maxone/ and padel-court/.');
}

const slug = (name) => path.parse(name).name.toLowerCase().replace(/[()]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function processImage(srcPath, group) {
  const id = `${group}/${slug(path.basename(srcPath))}`;
  const img = sharp(srcPath, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  const { width, height } = meta;
  const hasAlpha = Boolean(meta.hasAlpha) && group === 'padel-clean';     // only the cut-outs need transparency
  const widths = [...new Set([...WIDTHS.filter((w) => w < width), width])].sort((a, b) => a - b);
  const dir = path.join(OUT_DIR, group); fs.mkdirSync(dir, { recursive: true });
  const base = slug(path.basename(srcPath));
  const variants = { avif: [], webp: [] };
  for (const w of widths) {
    const pipeline = sharp(srcPath, { failOn: 'none' }).rotate().resize({ width: w, withoutEnlargement: true });
    const src = hasAlpha ? pipeline : pipeline.flatten({ background: '#ffffff' });
    const avifFile = `${base}-${w}.avif`, webpFile = `${base}-${w}.webp`;
    await src.clone().avif({ quality: hasAlpha ? 70 : 58, effort: 2 }).toFile(path.join(dir, avifFile));
    await src.clone().webp({ quality: hasAlpha ? 90 : 80, alphaQuality: 100 }).toFile(path.join(dir, webpFile));
    variants.avif.push({ w, url: `/media/${group}/${avifFile}` });
    variants.webp.push({ w, url: `/media/${group}/${webpFile}` });
  }
  const lqipBuf = await sharp(srcPath, { failOn: 'none' }).rotate().resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  const { dominant } = await sharp(srcPath, { failOn: 'none' }).stats();
  return {
    id, group, source: path.relative(ROOT, srcPath).split(path.sep).join('/'),
    width, height, aspect: +(width / height).toFixed(4), hasAlpha,
    largestUrl: variants.webp.at(-1).url,
    srcset: { avif: variants.avif.map((v) => `${v.url} ${v.w}w`).join(', '), webp: variants.webp.map((v) => `${v.url} ${v.w}w`).join(', ') },
    lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
    dominant: `#${[dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, '0')).join('')}`,
    lowRes: width < 1200,           // flag: keep these small on screen (see docs/08_ASSETS.md)
  };
}

const renderRoot = process.argv[2] ? path.resolve(process.argv[2]) : findRenderRoot(ROOT);
const groups = fs.readdirSync(renderRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => [d.name, path.join(renderRoot, d.name)]);
for (const [g, p] of Object.entries(EXTRA_GROUPS)) if (fs.existsSync(p)) groups.push([g, p]);

const manifest = { generatedAt: new Date().toISOString(), renderRoot: path.relative(ROOT, renderRoot), images: {} };
for (const [group, dir] of groups) {
  for (const f of fs.readdirSync(dir).filter((f) => IMG.test(f)).sort()) {
    const id = `${group}/${slug(f)}`;
    if (manifest.images[id]) { console.warn(`skip duplicate ${id} (${f})`); continue; }
    const entry = await processImage(path.join(dir, f), group);
    manifest.images[entry.id] = entry;
    console.log(`${entry.id.padEnd(28)} ${entry.width}x${entry.height}${entry.lowRes ? '  (low-res)' : ''}`);
  }
}
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`\n${Object.keys(manifest.images).length} images -> ${path.relative(ROOT, MANIFEST)}`);

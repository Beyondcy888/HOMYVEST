// Generates the favicon PNGs and the Open Graph image with the real Archivo font (docs/08 §7).
// Rendered in headless Chromium so the type is exactly the site's type; no system-font fallback.
//   node scripts/make-brand-assets.mjs
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
// Embedded as data URIs: a page created with setContent may not load file:// resources.
const dataUri = (file, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(ROOT, file)).toString('base64');
const font = dataUri('node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2', 'font/woff2');
const photo = dataUri('public/media/facades/best-1600.webp', 'image/webp');
const out = (f) => path.join(ROOT, 'public', f);

const css = `
  @font-face { font-family: 'Archivo Variable'; src: url('${font}') format('woff2-variations'); font-weight: 100 900; font-stretch: 62% 125%; }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; }
  body { font-family: 'Archivo Variable'; -webkit-font-smoothing: antialiased; }
`;

const browser = await chromium.launch();

// ---- Favicons: a bold H in paper on an ink square ----
// The H is drawn (an SVG icon cannot load a web font) with the proportions of Archivo at weight 900,
// width 125%. The PNG sizes are rendered from the same SVG with sharp, so all three match and stay crisp.
const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0b0b0a"/><path fill="#fafaf7" d="M11 14h15v12h12V14h15v36H38V37H26v13H11z"/></svg>\n';
fs.writeFileSync(out('favicon.svg'), iconSvg);
await sharp(Buffer.from(iconSvg), { density: 384 }).resize(32, 32).png().toFile(out('favicon-32.png'));
await sharp(Buffer.from(iconSvg), { density: 768 }).resize(180, 180).png().toFile(out('apple-touch-icon.png'));

// ---- Open Graph image 1200 × 630: the dusk render darkened, wordmark centred, tagline below ----
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(`<style>${css}
  body { position: relative; display: grid; place-items: center; color: #fafaf7; background: #0b0b0a; overflow: hidden; }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .scrim { position: absolute; inset: 0; background: rgb(11 11 10 / 0.5); }
  .in { position: relative; text-align: center; }
  h1 { font-weight: 900; font-variation-settings: 'wdth' 125; font-size: 136px; letter-spacing: -0.02em; line-height: 1; }
  p { margin-top: 26px; font-weight: 500; font-size: 34px; letter-spacing: -0.01em; }
</style>
<img src="${photo}" alt=""><div class="scrim"></div>
<div class="in"><h1>HOMYVEST</h1><p>Turn idle land into income</p></div>`);
await page.evaluate(() => document.fonts.ready);
await page.waitForLoadState('networkidle');
const png = await page.screenshot();
await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(out('og.jpg'));
await page.close();
await browser.close();

for (const f of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'og.jpg']) {
  console.log(f.padEnd(22), `${(fs.statSync(out(f)).size / 1024).toFixed(1)} KB`);
}

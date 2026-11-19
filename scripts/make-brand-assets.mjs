// Generates the favicon PNGs and the Open Graph image with the real Archivo font (docs/08 §7).
// Rendered in headless Chromium so the type is exactly the site's type; no system-font fallback.
//   node scripts/make-brand-assets.mjs
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const font = pathToFileURL(path.join(ROOT, 'node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2')).href;
const photo = pathToFileURL(path.join(ROOT, 'public/media/facades/best-1600.webp')).href;
const out = (f) => path.join(ROOT, 'public', f);

const css = `
  @font-face { font-family: 'Archivo Variable'; src: url('${font}') format('woff2-variations'); font-weight: 100 900; font-stretch: 62% 125%; }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; }
  body { font-family: 'Archivo Variable'; -webkit-font-smoothing: antialiased; }
`;

const browser = await chromium.launch();

// ---- Favicons: a bold H in paper on an ink square ----
async function icon(size, file) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<style>${css}
    body { display: grid; place-items: center; background: #0b0b0a; color: #fafaf7; }
    span { font-weight: 900; font-variation-settings: 'wdth' 125; font-size: ${Math.round(size * 0.74)}px; line-height: 1; transform: translateY(${size * 0.02}px); }
  </style><span>H</span>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out(file) });
  await page.close();
}
await icon(32, 'favicon-32.png');
await icon(180, 'apple-touch-icon.png');

// The SVG favicon uses a drawn H with the same proportions (an SVG icon cannot load a web font).
fs.writeFileSync(
  out('favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0b0b0a"/><path fill="#fafaf7" d="M11 14h15v12h12V14h15v36H38V37H26v13H11z"/></svg>\n`,
);

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

// Screenshot helper for visual checks while building. Uses the real GPU (not SwiftShader).
//
//   node qa/tools/shot.mjs <url-or-path> <out.png> [options]
//
// Options (all optional):
//   --w 1440 --h 900        viewport (default 1440x900). Use --w 390 --h 844 for mobile.
//   --mobile                mobile emulation (touch, DPR 2.6, coarse pointer) at 390x844 unless --w/--h given
//   --dpr 1                 device scale factor (default 1; keeps PNGs small)
//   --wait 800              ms to wait after load / scroll before the shot (default 800)
//   --scene story --p 0.5   scroll so pinned scene <id> (window.__homyvest.triggers) is at progress p (0..1)
//   --y 1200                scroll to an absolute pixel position
//   --sel "#about"          scroll an element to the top of the viewport
//   --full                  full-page screenshot
//   --dark                  dark colour scheme
//   --reduced               prefers-reduced-motion: reduce
//   --hover ".header__mark" hover an element before the shot
//   --click ".selector"     click an element before the shot (repeatable, comma-separated)
//   --eval "js"             run JS in the page before the shot
//   --clip "x,y,w,h"        clip rectangle
//   --console               print console errors and warnings
// URL: a full URL, or a path such as "/?lang=id" (resolved against http://localhost:5173).
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const [target, out] = args;
if (!target || !out) {
  console.error('usage: node qa/tools/shot.mjs <url-or-path> <out.png> [options]');
  process.exit(1);
}
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const mobile = flag('mobile');
const w = Number(opt('w', mobile ? 390 : 1440));
const h = Number(opt('h', mobile ? 844 : 900));
const wait = Number(opt('wait', 800));
const url = /^https?:/.test(target) ? target : `http://localhost:${opt('port', 5173)}${target.startsWith('/') ? '' : '/'}${target}`;

const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl'] });
const context = await browser.newContext({
  ...(mobile ? { ...devices['Pixel 7'] } : {}),
  viewport: { width: w, height: h },
  deviceScaleFactor: Number(opt('dpr', 1)),
  colorScheme: flag('dark') ? 'dark' : 'light',
  reducedMotion: flag('reduced') ? 'reduce' : 'no-preference',
});
const page = await context.newPage();
const logs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

const scene = opt('scene');
if (scene) {
  const p = Number(opt('p', 0));
  await page.waitForFunction((id) => window.__homyvest?.triggers?.[id], scene, { timeout: 15000 });
  await page.evaluate(
    ({ id, p }) => {
      const t = window.__homyvest.triggers[id];
      const y = t.start + (t.end - t.start) * p;
      const l = window.__homyvest.lenis;
      if (l) l.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    },
    { id: scene, p },
  );
} else if (opt('y') !== undefined) {
  await page.evaluate((y) => {
    const l = window.__homyvest?.lenis;
    if (l) l.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }, Number(opt('y')));
} else if (opt('sel')) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY;
    const l = window.__homyvest?.lenis;
    if (l) l.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }, opt('sel'));
}
if (opt('eval')) await page.evaluate(opt('eval'));
for (const sel of (opt('click', '') || '').split(',').filter(Boolean)) {
  await page.click(sel.trim());
  await page.waitForTimeout(250);
}
if (opt('hover')) await page.hover(opt('hover'));
await page.waitForTimeout(wait);

fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
const clip = opt('clip') ? opt('clip').split(',').map(Number) : null;
await page.screenshot({
  path: out,
  fullPage: flag('full'),
  ...(clip ? { clip: { x: clip[0], y: clip[1], width: clip[2], height: clip[3] } } : {}),
});
if (flag('console') || logs.length) console.log(logs.length ? logs.join('\n') : 'console: clean');
console.log(`saved ${out} (${w}x${h}${mobile ? ' mobile' : ''})`);
await browser.close();

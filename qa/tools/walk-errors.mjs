// Scrolls through the page like the smoke test and reports where page errors happen (with stacks).
//   node qa/tools/walk-errors.mjs [url]
import { chromium } from '@playwright/test';
const url = process.argv[2] || 'http://localhost:5173/?nointro=1';
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let y = 0;
const seen = [];
page.on('pageerror', (e) => seen.push({ y, msg: e.message, stack: (e.stack || '').split('\n').slice(0, 14).join('\n') }));
page.on('console', (m) => m.type() === 'error' && seen.push({ y, msg: `[console] ${m.text().slice(0, 600)}` }));
await page.goto(url, { waitUntil: 'load' });
await page.waitForSelector('#calculator');
const height = await page.evaluate(() => document.documentElement.scrollHeight);
const sections = await page.evaluate(() => [...document.querySelectorAll('main section[id], [data-pinned]')].map((s) => `${s.id || s.dataset.pinned}@${Math.round(s.getBoundingClientRect().top + scrollY)}`).join(' '));
console.log('height', height, '|', sections);
for (y = 0; y < height; y += 1400) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(150);
}
await page.waitForTimeout(1200);
for (const s of seen) console.log(`\n--- at y=${s.y}: ${s.msg}\n${s.stack || ''}`);
if (!seen.length) console.log('no errors');
await browser.close();

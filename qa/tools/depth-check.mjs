// Checks the depth parallax: does it go live, does the canvas match the picture, does it move with the pointer?
//   node qa/tools/depth-check.mjs
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto('http://localhost:5173/?nointro=1', { waitUntil: 'load' });
await page.evaluate(() => {
  const el = document.querySelector('#homyeight');
  window.__homyvest.lenis?.scrollTo(el.offsetTop, { immediate: true, force: true });
});
await page.mouse.move(720, 450);
await page.waitForTimeout(4500);
const box = await page.locator('.homyeight__img').boundingBox();
const state = await page.evaluate(() => [...document.querySelectorAll('.depth')].map((d) => `${d.dataset.depthId}:${d.dataset.depthLive ?? '-'}`).join('  '));
console.log('depth states:', state);
const clip = { x: box.x, y: Math.max(0, box.y), width: box.width, height: Math.min(box.height, 900 - Math.max(0, box.y)) };
await page.screenshot({ path: 'qa/tmp/depth-a.png', clip });
await page.mouse.move(200, 200, { steps: 4 });
await page.waitForTimeout(900);
await page.screenshot({ path: 'qa/tmp/depth-b.png', clip });
await page.mouse.move(1240, 700, { steps: 4 });
await page.waitForTimeout(900);
await page.screenshot({ path: 'qa/tmp/depth-c.png', clip });
// plain picture for colour comparison
await page.evaluate(() => document.querySelectorAll('.depth').forEach((d) => (d.dataset.depthLive = 'false')));
await page.waitForTimeout(500);
await page.screenshot({ path: 'qa/tmp/depth-plain.png', clip });

const diff = async (a, b) => {
  const A = await sharp(a).raw().toBuffer();
  const B = await sharp(b).raw().toBuffer();
  let sum = 0;
  let max = 0;
  for (let i = 0; i < A.length; i++) {
    const d = Math.abs(A[i] - B[i]);
    sum += d;
    if (d > max) max = d;
  }
  return `mean ${(sum / A.length).toFixed(2)} max ${max}`;
};
console.log('pointer left-top vs right-bottom:', await diff('qa/tmp/depth-b.png', 'qa/tmp/depth-c.png'));
console.log('centre vs plain picture     :', await diff('qa/tmp/depth-a.png', 'qa/tmp/depth-plain.png'));
console.log(logs.length ? logs.join('\n') : 'console: clean');
await browser.close();

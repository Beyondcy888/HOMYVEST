// Records a Chrome performance trace while wheeling through part of a pinned scene, then lists the long main-thread
// tasks (> 40 ms) with what took the time inside them. For hunting the cause of a slow frame.
//   node qa/tools/trace-scene.mjs --base http://localhost:4273 --page /portofolio/ --scene maxone --from 0.12 --to 0.22 [--mobile]
import { chromium, devices } from '@playwright/test';

const args = process.argv.slice(2);
const opt = (n, f) => {
  const i = args.indexOf(`--${n}`);
  return i > -1 ? args[i + 1] : f;
};
const BASE = opt('base', 'http://localhost:4273');
const PAGE = opt('page', '/portofolio/');
const scene = opt('scene', 'maxone');
const from = Number(opt('from', 0));
const to = Number(opt('to', 1));
const mobile = args.includes('--mobile');

const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl'] });
const context = await browser.newContext(mobile ? { ...devices['Pixel 7'] } : { viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
if (mobile) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const THRESH = Number(opt('thresh', 40)) * 1000;
await page.goto(`${BASE}${PAGE}`, { waitUntil: 'load' });
await page.waitForTimeout(3000);
const r = await page.evaluate((k) => ({ start: window.__homyvest.triggers[k].start, end: window.__homyvest.triggers[k].end }), scene);
const y0 = r.start + (r.end - r.start) * from;
const y1 = r.start + (r.end - r.start) * to;
await page.evaluate((y) => window.__homyvest.lenis.scrollTo(y, { immediate: true, force: true }), y0);
await page.waitForTimeout(2500);
const vp = page.viewportSize();
await page.mouse.move(vp.width / 2, vp.height / 2);

const events = [];
cdp.on('Tracing.dataCollected', (e) => events.push(...e.value));
const done = new Promise((res) => cdp.once('Tracing.tracingComplete', res));
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,v8.execute,blink.user_timing', transferMode: 'ReportEvents' });
for (;;) {
  const y = await page.evaluate(() => window.scrollY);
  if (y >= y1) break;
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(50);
}
await page.waitForTimeout(300);
await cdp.send('Tracing.end');
await done;

const main = events.filter((e) => (e.name === 'RunTask' || e.name === 'GPUTask' || e.name === 'ThreadControllerImpl::RunTask') && e.dur > THRESH);
const children = (task) => events.filter((e) => e.pid === task.pid && e.tid === task.tid && e.ts >= task.ts && e.ts + (e.dur || 0) <= task.ts + task.dur && e !== task && e.dur > 3000);
for (const t of main) {
  const kids = children(t)
    .map((e) => {
      const d = e.args?.data || {};
      const what = d.url ? `${d.functionName || ''} ${String(d.url).split('/').pop()}:${d.lineNumber}` : d.type || d.frame || '';
      return `${e.name}${what ? ` (${what})` : ''} ${(e.dur / 1000).toFixed(1)}ms`;
    })
    .slice(0, 14);
  console.log(`\nlong task ${(t.dur / 1000).toFixed(1)} ms`);
  for (const k of kids) console.log(`   ${k}`);
}
console.log(`\n${main.length} long tasks`);
await browser.close();

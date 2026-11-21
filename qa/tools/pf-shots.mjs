// Screenshot set for the portfolio page's pinned scenes: one browser, many shots (U01_04, U01_05 §5).
//
//   node qa/tools/pf-shots.mjs --base http://localhost:4273 --out qa/tmp/after [--keys story=story,maxone=maxone,padel=padel]
//        [--w 1440 --h 900] [--mobile] [--dark] [--lang id] [--query "tier=low"] [--set desktop|full]
//
// --keys maps the scene names used in file names to the trigger keys of the build being shot, so the same
// set can be taken from an older build whose keys differ (e.g. maxone=homyeight,padel=beyond).
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const base = opt('base', 'http://localhost:4273');
const out = opt('out', 'qa/tmp/shots');
const mobile = flag('mobile');
const w = Number(opt('w', mobile ? 390 : 1440));
const h = Number(opt('h', mobile ? 844 : 900));
const keys = Object.fromEntries(
  (opt('keys', 'story=story,maxone=maxone,padel=padel,beyond=beyond') || '').split(',').map((kv) => kv.split('=')),
);
const lang = opt('lang');
const extra = opt('query', '');
const set = opt('set', 'desktop');

const POINTS = {
  story: [0, 0.2, 0.5, 0.8, 0.97],
  maxone: [0.06, 0.2, 0.5, 0.95],
  padel: [0.1, 0.45, 0.95],
};
if (set === 'full') POINTS.beyond = [0.05, 0.5, 0.95];
if (set === 'quick') {
  POINTS.story = [0.5, 0.97];
  POINTS.maxone = [0.2];
  POINTS.padel = [0.95];
}

const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl'] });
const context = await browser.newContext({
  ...(mobile ? { ...devices['Pixel 7'] } : {}),
  viewport: { width: w, height: h },
  deviceScaleFactor: 1,
  colorScheme: flag('dark') ? 'dark' : 'light',
  reducedMotion: flag('reduced') ? 'reduce' : 'no-preference',
});
const page = await context.newPage();
const logs = [];
page.on('console', (m) => m.type() === 'error' && logs.push(`[error] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

const q = [lang ? `lang=${lang}` : '', extra].filter(Boolean).join('&');
await page.goto(`${base}/portofolio/${q ? `?${q}` : ''}`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);
fs.mkdirSync(out, { recursive: true });

const scrollTo = (y) =>
  page.evaluate((top) => {
    const l = window.__homyvest?.lenis;
    if (l) l.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo(0, top);
  }, y);

if (flag('page')) {
  // the page top to bottom in viewport steps, outside the pins
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: path.join(out, 'top.png') });
  for (const sel of ['#maxone', '#padel', '#beyond', '#closing']) {
    const y = await page.evaluate((s) => {
      const el = document.querySelector(s);
      return el ? el.getBoundingClientRect().top + window.scrollY : null;
    }, sel);
    if (y === null) continue;
    await scrollTo(Math.max(0, y - 1));
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(out, `at-${sel.slice(1)}.png`) });
  }
  await scrollTo(total);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, 'bottom.png') });
}

for (const [name, points] of Object.entries(POINTS)) {
  const key = keys[name];
  if (!key) continue;
  const ok = await page
    .waitForFunction((id) => window.__homyvest?.triggers?.[id], key, { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (!ok) {
    console.log(`no trigger ${key} (${name})`);
    continue;
  }
  for (const p of points) {
    const y = await page.evaluate(
      ({ id, p }) => {
        const t = window.__homyvest.triggers[id];
        return t.start + (t.end - t.start) * p;
      },
      { id: key, p },
    );
    // arrive from slightly before, so the scene mounts and damps toward the point like a visitor would see it
    await scrollTo(y - 4);
    await page.waitForTimeout(name === 'story' && p === points[0] ? 2500 : 1500);
    await scrollTo(y);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(out, `${name}-${String(p).replace('.', '_')}.png`) });
  }
}
console.log(logs.length ? logs.join('\n') : 'console: clean');
console.log(`saved to ${out} (${w}x${h}${mobile ? ' mobile' : ''})`);
await browser.close();

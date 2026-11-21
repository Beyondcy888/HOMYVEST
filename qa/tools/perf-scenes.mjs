// Frame timing through the pinned scenes with a steady wheel (U01_04 §4): 120 px every 50 ms, real wheel
// events (so Lenis, its lerp and its wheel multiplier are part of the measurement), on desktop (1440 × 900,
// no throttle) and on a phone (Pixel 7, CPU × 4 through CDP).
//
//   node qa/tools/perf-scenes.mjs --label after  --base http://localhost:4273 --page /portofolio/
//   node qa/tools/perf-scenes.mjs --label before --base http://localhost:4275 --page "/?nointro=1" --keys story=story,maxone=homyeight,padel=beyond
//        [--profiles desktop,mobile] [--walk] [--out qa/perf-u01.json]
//
// For each scene: jump to 200 px before its pin, wait until its canvas has drawn (warm-up), then wheel through
// the pin to 200 px past it while recording every frame. Frames over 50 ms are logged with the scene progress
// where they happened. The scene's mode (live 3D, fallback, static) is recorded before and after, so a scene
// that dropped to its fallback is never reported as a faster live scene. --walk adds one continuous wheel down
// the whole page (catches the cost of each scene mounting while the previous one is still pinned).
// Results merge into --out under report[label].
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const BASE = opt('base', 'http://localhost:4273');
const PAGE = opt('page', '/portofolio/');
const LABEL = opt('label', 'after');
const OUT = opt('out', 'qa/perf-u01.json');
const KEYS = Object.fromEntries(opt('keys', 'story=story,maxone=maxone,padel=padel').split(',').map((kv) => kv.split('=')));
const PROFILES = opt('profiles', 'desktop,mobile').split(',');
const STEP = 120;
const EVERY = 50;

const gpuArgs = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl'];
const pct = (arr, p) => (arr.length ? arr.slice().sort((a, b) => a - b)[Math.min(arr.length - 1, Math.floor((p / 100) * arr.length))] : 0);
const round = (v, d = 1) => Number(v.toFixed(d));

const PROFILE = {
  desktop: { context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, throttle: 1, name: 'desktop 1440×900, no throttle' },
  mobile: { context: { ...devices['Pixel 7'] }, throttle: 4, name: 'Pixel 7, CPU ×4' },
};

const browser = await chromium.launch({ args: gpuArgs });

const sceneMode = (page) =>
  page.evaluate(() => ({
    story: document.querySelector('#story.story--live') ? 'live' : document.querySelector('#story') ? 'static' : 'absent',
    maxone: document.querySelector('.walk[data-mode]')?.getAttribute('data-mode') ?? (document.querySelector('.walk--static') ? 'static' : 'absent'),
    padel: document.querySelector('.padel--live') ? 'live' : document.querySelector('.padel--static') ? 'static' : 'absent',
    ready: document.querySelectorAll('.scene-mount[data-ready="true"]').length,
  }));

const jump = (page, y) =>
  page.evaluate((top) => {
    const l = window.__homyvest?.lenis;
    if (l) l.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo(0, top);
  }, y);

/** Starts recording frame deltas and the scroll position at each frame. */
const startRecorder = (page) =>
  page.evaluate(() => {
    const rec = { deltas: [], ys: [], on: true };
    window.__rec = rec;
    let last = performance.now();
    const step = (now) => {
      if (!rec.on) return;
      rec.deltas.push(now - last);
      rec.ys.push(window.scrollY);
      last = now;
      requestAnimationFrame(step);
    };
    requestAnimationFrame((now) => {
      last = now;
      requestAnimationFrame(step);
    });
  });
const stopRecorder = (page) =>
  page.evaluate(() => {
    window.__rec.on = false;
    return { deltas: window.__rec.deltas, ys: window.__rec.ys };
  });

/** Wheels down at a steady rate until scrollY reaches `to` (or a safety limit). */
async function wheelTo(page, to, limitMs) {
  const t0 = Date.now();
  for (;;) {
    const y = await page.evaluate(() => window.scrollY);
    if (y >= to || Date.now() - t0 > limitMs) return Date.now() - t0;
    const tick = Date.now();
    await page.mouse.wheel(0, STEP);
    const spent = Date.now() - tick;
    if (spent < EVERY) await page.waitForTimeout(EVERY - spent);
  }
}

function summarise(deltas, ys, range) {
  const frames = deltas.slice(2);
  const yy = ys.slice(2);
  const hitches = [];
  frames.forEach((d, i) => {
    if (d > 50) hitches.push({ p: Number(((yy[i] - range.start) / (range.end - range.start)).toFixed(3)), ms: Math.round(d) });
  });
  return {
    frames: frames.length,
    p50: round(pct(frames, 50)),
    p95: round(pct(frames, 95)),
    max: round(frames.length ? Math.max(...frames) : 0),
    over50ms: hitches.length,
    hitches,
  };
}

async function runProfile(key) {
  const prof = PROFILE[key];
  const context = await browser.newContext(prof.context);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  if (prof.throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: prof.throttle });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const sep = PAGE.includes('?') ? '&' : '?';
  await page.goto(`${BASE}${PAGE}${sep}perf=1`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3000);
  // warm-up includes the page's own idle preparation (/portofolio/ builds the scenes' worlds while the
  // visitor reads the intro); the original page has none, so this returns at once there
  const prep = Date.now();
  await page.waitForFunction(() => window.__homyvest?.prepared !== false, null, { timeout: 20000 }).catch(() => undefined);
  const prepared = await page.evaluate(() => window.__homyvest?.prepared ?? null);
  const prepMs = Date.now() - prep;
  const vp = page.viewportSize();
  await page.mouse.move(vp.width / 2, vp.height / 2);
  const out = { profile: prof.name, prepared, waitedForPrepMs: prepMs, scenes: {} };

  for (const [scene, trig] of Object.entries(KEYS)) {
    const has = await page.evaluate((k) => Boolean(window.__homyvest?.triggers?.[k]), trig);
    if (!has) {
      out.scenes[scene] = { skipped: `no trigger "${trig}" (not pinned in this profile)`, mode: await sceneMode(page) };
      continue;
    }
    const range = await page.evaluate((k) => ({ start: window.__homyvest.triggers[k].start, end: window.__homyvest.triggers[k].end }), trig);
    await jump(page, Math.max(0, range.start - 200));
    // warm-up: the scene mounts, compiles and draws its first frame before measuring starts
    const pinEl = await page.$(`[data-pinned="${trig}"] .scene-mount`);
    if (pinEl) await page.waitForFunction((el) => el.getAttribute('data-ready') === 'true', pinEl, { timeout: 12000 }).catch(() => undefined);
    await page.waitForTimeout(1500);
    const modeBefore = await sceneMode(page);
    await startRecorder(page);
    const ms = await wheelTo(page, range.end + 200, 120000);
    await page.waitForTimeout(400);
    const { deltas, ys } = await stopRecorder(page);
    const modeAfter = await sceneMode(page);
    out.scenes[scene] = {
      lengthPx: Math.round(range.end - range.start),
      seconds: round(ms / 1000, 1),
      ...summarise(deltas, ys, range),
      mode: modeBefore[scene] === modeAfter[scene] ? modeAfter[scene] : `${modeBefore[scene]} → ${modeAfter[scene]}`,
    };
    console.log(`${LABEL} · ${key} · ${scene}: p95 ${out.scenes[scene].p95} ms, max ${out.scenes[scene].max} ms, >50 ms ${out.scenes[scene].over50ms} (${out.scenes[scene].mode})`);
  }

  if (flag('walk')) {
    // one continuous wheel from the top of the page to the end of the last scene
    await jump(page, 0);
    await page.waitForTimeout(1500);
    const ends = await page.evaluate((keys) => keys.map((k) => window.__homyvest?.triggers?.[k]).filter(Boolean).map((t) => ({ start: t.start, end: t.end })), Object.values(KEYS));
    const to = Math.max(...ends.map((e) => e.end)) + 200;
    await startRecorder(page);
    const ms = await wheelTo(page, to, 240000);
    const { deltas, ys } = await stopRecorder(page);
    const frames = deltas.slice(3);
    const where = (y) => {
      const keys = Object.keys(KEYS);
      for (let i = ends.length - 1; i >= 0; i--) if (y >= ends[i].start - 900) return `${keys[i]} @ ${((y - ends[i].start) / (ends[i].end - ends[i].start)).toFixed(3)}`;
      return 'intro';
    };
    const hitches = [];
    frames.forEach((d, i) => d > 50 && hitches.push({ at: where(ys[i + 3]), ms: Math.round(d) }));
    out.walk = { seconds: round(ms / 1000, 1), frames: frames.length, p50: round(pct(frames, 50)), p95: round(pct(frames, 95)), max: round(Math.max(...frames)), over50ms: hitches.length, hitches };
    console.log(`${LABEL} · ${key} · walk: p95 ${out.walk.p95} ms, max ${out.walk.max} ms, >50 ms ${out.walk.over50ms}`);
  }
  out.drawCalls = await page.evaluate(() => window.__homyvestPerf ?? null);
  out.errors = errors;
  await context.close();
  return out;
}

const result = { generatedAt: new Date().toISOString(), base: BASE, page: PAGE, keys: KEYS, input: `${STEP} px wheel every ${EVERY} ms` };
for (const key of PROFILES) result[key] = await runProfile(key);
await browser.close();

let report = {};
try {
  report = JSON.parse(fs.readFileSync(OUT, 'utf8'));
} catch {
  report = {};
}
report[LABEL] = result;
fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(`wrote ${OUT} [${LABEL}]`);

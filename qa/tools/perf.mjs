// Performance checks (docs/10 §4) against the production preview on :4173.
//   npm run build && npm run preview   (in another terminal), then:  node qa/tools/perf.mjs
//
// 1. Load metrics on a mobile profile (Pixel 7, CPU ×4, Fast 4G): LCP, CLS, long tasks, an INP-like
//    typing latency in the calculator, and transferred bytes by type.
// 2. Frame timing while scrolling through each pinned scene at a steady speed, on desktop (no throttle)
//    and on the throttled mobile profile: p50, p95, max, frames over 50 ms.
// Writes qa/perf.json and prints a summary.
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const gpuArgs = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl'];
const FAST_4G = { offline: false, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (9 * 1024 * 1024) / 8, latency: 150 };
const pct = (arr, p) => (arr.length ? arr.slice().sort((a, b) => a - b)[Math.min(arr.length - 1, Math.floor((p / 100) * arr.length))] : 0);
const round = (v, d = 1) => Number(v.toFixed(d));

const browser = await chromium.launch({ args: gpuArgs });
const report = { generatedAt: new Date().toISOString(), base: BASE, load: {}, frames: {} };

// ---------- 1. load metrics ----------
async function loadMetrics(label, contextOptions, throttle) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  if (throttle) {
    await cdp.send('Network.emulateNetworkConditions', FAST_4G);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  await page.addInitScript(() => {
    window.__perf = { lcp: 0, lcpEl: '', cls: 0, long: [] };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__perf.lcp = e.startTime;
        window.__perf.lcpEl = e.element ? `${e.element.tagName.toLowerCase()}${e.element.id ? `#${e.element.id}` : ''}.${String(e.element.className).split(' ')[0]}` : '';
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__perf.long.push(Math.round(e.duration));
    }).observe({ type: 'longtask', buffered: true });
  });
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(6000); // intro, idle work, lazy chunks
  const bytes = await page.evaluate(() => {
    const out = { js: 0, css: 0, font: 0, img: 0, other: 0, total: 0 };
    const add = (name, size) => {
      const k = /\.js(\?|$)/.test(name) ? 'js' : /\.css(\?|$)/.test(name) ? 'css' : /\.woff2?(\?|$)/.test(name) ? 'font' : /\.(avif|webp|png|jpe?g|svg)(\?|$)/.test(name) ? 'img' : 'other';
      out[k] += size;
      out.total += size;
    };
    for (const e of performance.getEntriesByType('resource')) add(e.name, e.transferSize || e.encodedBodySize || 0);
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) add('document.html', nav.transferSize || 0);
    return out;
  });
  const initialJs = await page.evaluate(() =>
    performance.getEntriesByType('resource').filter((e) => /\.js(\?|$)/.test(e.name) && e.startTime < 1500).reduce((a, e) => a + (e.transferSize || e.encodedBodySize || 0), 0),
  );
  const perf = await page.evaluate(() => window.__perf);

  // INP-like: latency of typing into the calculator (keydown → next paint)
  await page.evaluate(() => {
    const el = document.querySelector('.calc__tabs');
    const y = el.getBoundingClientRect().top + window.scrollY - 90;
    const l = window.__homyvest?.lenis;
    if (l) l.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  });
  await page.waitForTimeout(2500);
  await page.locator('#calc-P').focus();
  const typing = [];
  for (const key of ['Backspace', '5', 'Backspace', '0', '1', 'Backspace']) {
    const t = await page.evaluate(
      (k) =>
        new Promise((resolve) => {
          const start = performance.now();
          const el = document.activeElement;
          const v = el.value;
          const next = k === 'Backspace' ? v.slice(0, -1) : v + k;
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, next);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - start)));
        }),
      key,
    );
    typing.push(t);
  }
  report.load[label] = {
    lcpMs: Math.round(perf.lcp), lcpElement: perf.lcpEl, cls: round(perf.cls, 4),
    longTasks: perf.long.length, longestTaskMs: Math.max(0, ...perf.long),
    typingLatencyMs: { median: Math.round(pct(typing, 50)), max: Math.round(Math.max(...typing)) },
    transferredKB: Object.fromEntries(Object.entries(bytes).map(([k, v]) => [k, Math.round(v / 1024)])),
    initialJsKB: Math.round(initialJs / 1024),
  };
  await context.close();
}

// ---------- 2. frame timing in the pinned scenes ----------
async function frameTiming(label, contextOptions, throttle) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  if (throttle) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(`${BASE}/?nointro=1&perf=1`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  report.frames[label] = {};
  for (const id of ['story', 'homyeight', 'beyond', 'ways']) {
    const has = await page.evaluate((k) => Boolean(window.__homyvest?.triggers?.[k]), id);
    if (!has) {
      report.frames[label][id] = 'not pinned in this profile';
      continue;
    }
    const range = await page.evaluate((k) => ({ start: window.__homyvest.triggers[k].start, end: window.__homyvest.triggers[k].end }), id);
    await page.evaluate((y) => {
      const l = window.__homyvest.lenis;
      if (l) l.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    }, Math.max(0, range.start - 200));
    await page.waitForTimeout(2500); // let the scene mount and settle
    // steady scroll: ~2400 px per second, driven from inside the page so timing is exact
    const { deltas, hitches } = await page.evaluate(
      ({ start, end }) =>
        new Promise((resolve) => {
          const out = [];
          const hitches = [];
          const from = Math.max(0, start - 200);
          const to = end + 200;
          const speed = 2400;
          const t0 = performance.now();
          let last = t0;
          const step = (now) => {
            const y = from + ((now - t0) / 1000) * speed;
            out.push(now - last);
            if (now - last > 50) hitches.push({ p: Number(((y - start) / (end - start)).toFixed(3)), ms: Math.round(now - last) });
            last = now;
            window.scrollTo(0, y);
            if (y < to) requestAnimationFrame(step);
            else resolve({ deltas: out.slice(2), hitches });
          };
          requestAnimationFrame(step);
        }),
      range,
    );
    report.frames[label][id] = {
      frames: deltas.length, p50: round(pct(deltas, 50)), p95: round(pct(deltas, 95)), max: round(Math.max(...deltas)),
      over50ms: deltas.filter((d) => d > 50).length, fpsMedian: round(1000 / pct(deltas, 50), 0),
      hitches, // where in the scene (progress 0..1) each frame over 50 ms happened
    };
  }
  report.frames[label].drawCalls = await page.evaluate(() => window.__homyvestPerf ?? null);
  await context.close();
}

// ---------- 3. one continuous walk down the whole page ----------
// Catches what the per-scene runs cannot: the cost of each 3D scene mounting as its section approaches.
async function pageWalk(label, contextOptions) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await page.goto(`${BASE}/?nointro=1`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const result = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const marks = [...document.querySelectorAll('main section[id]')].map((s) => ({ id: s.id, top: s.getBoundingClientRect().top + scrollY }));
        const where = (y) => marks.filter((m) => m.top <= y + innerHeight).pop()?.id ?? 'top';
        const out = [];
        const hitches = [];
        const to = document.documentElement.scrollHeight - innerHeight;
        const speed = 3000;
        const t0 = performance.now();
        let last = t0;
        const step = (now) => {
          const y = ((now - t0) / 1000) * speed;
          out.push(now - last);
          if (now - last > 50 && out.length > 3) hitches.push({ near: where(y), y: Math.round(y), ms: Math.round(now - last) });
          last = now;
          window.scrollTo(0, y);
          if (y < to) requestAnimationFrame(step);
          else resolve({ deltas: out.slice(3), hitches });
        };
        requestAnimationFrame(step);
      }),
  );
  report.walk = report.walk || {};
  report.walk[label] = {
    frames: result.deltas.length, p50: round(pct(result.deltas, 50)), p95: round(pct(result.deltas, 95)), max: round(Math.max(...result.deltas)),
    over50ms: result.hitches.length, hitches: result.hitches,
  };
  await context.close();
}

const mobile = { ...devices['Pixel 7'] };
const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
// ONLY=frames skips the load metrics (quicker when tuning a scene)
if (process.env.ONLY !== 'frames') {
  await loadMetrics('mobile, CPU ×4, Fast 4G', mobile, true);
  await loadMetrics('desktop, no throttle', desktop, false);
}
if (process.env.ONLY === 'load') { await browser.close(); fs.writeFileSync('qa/perf-load.json', JSON.stringify(report.load, null, 2)); console.log(JSON.stringify(report.load, null, 2)); process.exit(0); }
await frameTiming('desktop, no throttle', desktop, false);
await frameTiming('mobile, CPU ×4', mobile, true);
await pageWalk('desktop, no throttle, 3000 px/s', desktop);
await browser.close();

fs.writeFileSync('qa/perf.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

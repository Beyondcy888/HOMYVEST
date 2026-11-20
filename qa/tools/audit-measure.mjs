// Measurable checks for the design audit: horizontal overflow and undersized touch targets per viewport.
//   node qa/tools/audit-measure.mjs
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
for (const [w, h, touch] of [[320, 640, true], [390, 844, true], [768, 1024, true], [1024, 768, false], [1440, 900, false]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/?nointro=1&nowebgl=1', { waitUntil: 'load' });
  await page.waitForSelector('#faq');
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const overflow = document.documentElement.scrollWidth - vw;
    const wide = [...document.querySelectorAll('main *, footer *, header *')]
      .filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.right > vw + 1 && !el.closest('.ways, .sr-only, .mmenu'); })
      .slice(0, 4).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
    const small = [];
    const tiny = [];
    for (const el of document.querySelectorAll('a[href], button, input, summary, label.idea__head')) {
      if (el.closest('.sr-only, .skip-link, [inert], .mmenu') || el.offsetParent === null) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 1 || b.height < 1) continue;
      const inline = getComputedStyle(el).display === 'inline' && el.closest('p, li, dd, sup');
      if (inline) continue; // links inside running text are exempt
      const name = `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0] || el.parentElement.className.split(' ')[0]}(${Math.round(b.width)}x${Math.round(b.height)})`;
      if (b.width < 24 || b.height < 24) tiny.push(name);
      else if (b.width < 44 || b.height < 44) small.push(name);
    }
    return { overflow, wide, small: [...new Set(small)], tiny: [...new Set(tiny)] };
  });
  console.log(`${w}x${h}: overflow ${r.overflow}px ${r.wide.join(' ')} | under 24px: ${r.tiny.join(' ') || 'none'} | 24–44px: ${r.small.slice(0, 14).join(' ') || 'none'}${r.small.length > 14 ? ` … +${r.small.length - 14}` : ''}`);
  await ctx.close();
}
await browser.close();

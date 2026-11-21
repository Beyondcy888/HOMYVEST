// Helpers for qa/portfolio.spec.ts (/portofolio/). Kept apart from qa/helpers.ts, which serves the main page.
import { expect, type Page } from '@playwright/test';

/** The page's parts in order: the intro, four scenes, the closing call to action. */
export const PORTFOLIO_SECTION_IDS = ['intro', 'story', 'maxone', 'padel', 'beyond', 'closing'];

/** Collects console errors and uncaught exceptions. */
export function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`[error] ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`));
  return problems;
}

/**
 * Opens /portofolio/ and waits for fonts and the first scene. `query` is appended (e.g. "tier=medium").
 * Tests that need the live scenes force a tier, so the result does not depend on the machine running them.
 */
export async function openPortfolio(page: Page, query = '') {
  await page.goto(`/portofolio/${query ? `?${query.replace(/^[?&]/, '')}` : ''}`);
  await page.waitForSelector('#closing');
  await page.evaluate(() => document.fonts.ready);
}

/** Jumps the page scroll to a pixel position, with or without Lenis. */
export async function scrollToY(page: Page, y: number, settle = 150) {
  await page.evaluate((top) => {
    const lenis = (window as any).__homyvest?.lenis;
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo(0, top);
  }, y);
  await page.waitForTimeout(settle);
}

/** Waits for pinned scene `id` and returns its trigger range in page pixels. */
export async function triggerRange(page: Page, id: string) {
  await page.waitForFunction((key) => (window as any).__homyvest?.triggers?.[key], id, { timeout: 15_000 });
  return page.evaluate((key) => {
    const t = (window as any).__homyvest.triggers[key];
    return { start: t.start as number, end: t.end as number };
  }, id);
}

/** Scrolls so that pinned scene `id` is at progress p (0..1), then waits for the damping to settle. */
export async function scrollToProgress(page: Page, id: string, p: number, settle = 900) {
  const r = await triggerRange(page, id);
  await scrollToY(page, r.start + (r.end - r.start) * p - 4, 300);
  await scrollToY(page, r.start + (r.end - r.start) * p, settle);
}

/** Scrolls an element to the top of the viewport. */
export async function scrollToSel(page: Page, selector: string, offset = 0, settle = 300) {
  const y = await page.evaluate(
    ({ selector, offset }) => {
      const el = document.querySelector(selector);
      return el ? el.getBoundingClientRect().top + window.scrollY + offset : 0;
    },
    { selector, offset },
  );
  await scrollToY(page, Math.max(0, y), settle);
}

/** The page has no sideways scroll. */
export async function expectNoSideScroll(page: Page, where: string) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(sw, `horizontal scroll ${where}: scrollWidth ${sw} > innerWidth ${iw}`).toBeLessThanOrEqual(iw);
}

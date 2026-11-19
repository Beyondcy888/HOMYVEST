import { expect, type Page } from '@playwright/test';

export const SECTION_IDS = ['story', 'about', 'team', 'homyeight', 'behomy', 'projects', 'beyond', 'calculator', 'next', 'faq'];

/** Collects console errors, warnings and uncaught exceptions for a page. */
export function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`[error] ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`));
  return problems;
}

/** Opens the page with the intro skipped and waits until fonts and the app are ready. */
export async function open(page: Page, query = '') {
  const sep = query ? `&${query.replace(/^[?&]/, '')}` : '';
  await page.goto(`/?nointro=1${sep}`);
  await page.waitForSelector('#calculator');
  await page.evaluate(() => document.fonts.ready);
}

/** Jumps the page scroll to a pixel position, with or without Lenis. */
export async function scrollToY(page: Page, y: number) {
  await page.evaluate((top) => {
    const lenis = (window as any).__homyvest?.lenis;
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo(0, top);
  }, y);
  await page.waitForTimeout(150);
}

/** Scrolls an element to the top of the viewport (leaving room for the sticky header). */
export async function scrollToSel(page: Page, selector: string, offset = -90) {
  const y = await page.evaluate(
    ({ selector, offset }) => {
      const el = document.querySelector(selector);
      return el ? el.getBoundingClientRect().top + window.scrollY + offset : 0;
    },
    { selector, offset },
  );
  await scrollToY(page, Math.max(0, y));
}

/** Scrolls so that pinned scene `id` is at progress p (0..1), then waits for damping (docs/06 §7). */
export async function scrollToProgress(page: Page, id: string, p: number, settle = 700) {
  await page.waitForFunction((key) => (window as any).__homyvest?.triggers?.[key], id, { timeout: 15_000 });
  const y = await page.evaluate(
    ({ id, p }) => {
      const t = (window as any).__homyvest.triggers[id];
      return t.start + (t.end - t.start) * p;
    },
    { id, p },
  );
  await scrollToY(page, y);
  await page.waitForTimeout(settle);
}

/** Clicks through the DOM, for controls that may sit under the sticky header at the time. */
export const press = (page: Page, selector: string) => page.locator(selector).first().evaluate((el: HTMLElement) => el.click());

/** Brings the calculator into view and selects a step. */
export async function calcStep(page: Page, step: 1 | 2 | 3) {
  await scrollToSel(page, '.calc__tabs');
  await press(page, `#calc-tab-${step}`);
  await expect(page.locator('#calculator')).toHaveAttribute('data-step', String(step));
}

export const decodeWa = (href: string) => decodeURIComponent(href.split('?text=')[1] ?? '');

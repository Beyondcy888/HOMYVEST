// /portofolio/: the full portfolio page (U01_04, U01_05 §3–4, U01_08 §2).
import { test, expect, devices } from '@playwright/test';
import { SCROLL } from '../src/content/scroll-config.js';
import {
  PORTFOLIO_SECTION_IDS,
  expectNoSideScroll,
  openPortfolio,
  scrollToProgress,
  scrollToSel,
  scrollToY,
  triggerRange,
  watchConsole,
} from './portfolio-helpers';

// The live scenes are forced to the medium tier wherever a test depends on them, so the result does not
// depend on the cores and memory of the machine running the tests.
const LIVE = 'tier=medium';

test.describe('portfolio page', () => {
  test('loads cleanly, with one h1 and the parts in order', async ({ page }) => {
    const problems = watchConsole(page);
    await openPortfolio(page, LIVE);
    await expect(page).toHaveTitle(/Portfolio/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(/Our full portfolio/);
    const ids = await page.evaluate(() => [...document.querySelectorAll('main > section[id]')].map((s) => s.id));
    expect(ids).toEqual(PORTFOLIO_SECTION_IDS);
    // the intro is short and marked for the floating WhatsApp button
    const intro = await page.locator('#intro').boundingBox();
    const vh = await page.evaluate(() => window.innerHeight);
    expect(intro!.height).toBeLessThanOrEqual(vh * 0.7 + 1);
    expect(await page.locator('#intro').getAttribute('data-hero')).not.toBeNull();
    // walk the page once so every scene mounts, then look at the console
    for (const id of ['story', 'maxone', 'padel']) await scrollToProgress(page, id, 0.5, 600);
    await scrollToSel(page, '#closing');
    await page.waitForTimeout(500);
    expect(problems, problems.join('\n')).toEqual([]);
  });

  test('/portofolio without the slash reaches the portfolio', async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto('/portofolio');
    const title = await page.title();
    // Static hosts redirect it (vercel.json, netlify.toml). `vite preview` has no redirect and serves the main
    // page instead; that is the preview server, not the site.
    test.skip(!/Portfolio/.test(title), `the server answered /portofolio with "${title}" (no redirect in vite preview)`);
    await page.waitForSelector('#closing');
    expect(problems, problems.join('\n')).toEqual([]);
  });

  test('the header marks Portfolio as the current page', async ({ page }) => {
    await openPortfolio(page);
    const current = page.locator('header a[aria-current="page"]');
    await expect(current.first()).toHaveAttribute('href', '/portofolio/');
  });

  test('each pinned scene is as long as SCROLL says', async ({ page }, info) => {
    await openPortfolio(page, LIVE);
    const mobile = info.project.name === 'mobile';
    const vh = await page.evaluate(() => window.innerHeight);
    const expected: Record<string, number> = {
      story: mobile ? SCROLL.story.mobile : SCROLL.story.desktop,
      maxone: mobile ? SCROLL.maxone.mobile : SCROLL.maxone.desktop,
      padel: mobile ? SCROLL.padel.mobile : SCROLL.padel.desktop,
    };
    // Beyond's strip is pinned on screens 1024 px and wider only
    if (!mobile) expected.beyond = SCROLL.beyondPanel.desktop * 3;
    for (const [id, units] of Object.entries(expected)) {
      await scrollToSel(page, `#${id}`, 0, 200);
      const r = await triggerRange(page, id);
      const want = (units * vh) / 100;
      const got = r.end - r.start;
      expect(Math.abs(got - want) / want, `${id}: ${got}px, expected ${want}px`).toBeLessThanOrEqual(0.02);
    }
    if (mobile) expect(await page.evaluate(() => Boolean((window as any).__homyvest.triggers.beyond))).toBe(false);
  });

  test('the index jumps to each part', async ({ page }) => {
    await openPortfolio(page, LIVE);
    for (const id of ['maxone', 'padel', 'story']) {
      await scrollToY(page, 0, 300);
      await page.locator(`.pf-index a[href="#${id}"]`).click();
      await page.waitForTimeout(1600);
      const { y, start } = await page.evaluate((k) => ({ y: window.scrollY, start: (window as any).__homyvest.triggers[k].start }), id);
      expect(Math.abs(y - start), `${id}: at ${y}, pin starts at ${start}`).toBeLessThanOrEqual(4);
    }
  });

  test('the skip links jump past each pin', async ({ page }) => {
    await openPortfolio(page, LIVE);
    const cases = [
      { id: 'story', link: '.story__skip', at: 0.04 },
      { id: 'maxone', link: '.walk__skip', at: 0.1 },
      { id: 'padel', link: '.padel-live__skip', at: 0.1 },
    ];
    for (const c of cases) {
      await scrollToProgress(page, c.id, c.at, 500);
      await page.locator(c.link).click();
      await page.waitForTimeout(1200);
      const { y, end } = await page.evaluate((k) => ({ y: window.scrollY, end: (window as any).__homyvest.triggers[k].end }), c.id);
      expect(y, `${c.id}: skip landed at ${y}, the pin ends at ${end}`).toBeGreaterThanOrEqual(end - 2);
    }
    await expect(page.locator('.story__skip')).toHaveText(/Skip the story/);
    await expect(page.locator('.padel-live__skip')).toHaveText(/Skip padel hall/);
  });

  test('the story ends on the calculator link and WhatsApp', async ({ page }) => {
    await openPortfolio(page, LIVE);
    const cta = page.locator('#story .story__ctas a').first();
    await expect(cta).toHaveAttribute('href', '/#calculator');
    await expect(page.locator('#story .story__ctas a[data-wa]')).toHaveCount(1);
    // the beats are h2: the page title is the only h1
    await expect(page.locator('#story h1')).toHaveCount(0);
  });

  test('the closing leads back to the land', async ({ page }) => {
    await openPortfolio(page);
    await expect(page.locator('#closing a[href="/?focus=phone"]')).toHaveText(/Leave your number/);
    await expect(page.locator('#closing a[data-wa]')).toHaveCount(1);
    await expect(page.locator('#closing a[href="/"]')).toHaveText(/Back to home/);
    await page.locator('#closing a[href="/?focus=phone"]').click();
    await page.waitForURL((url) => url.pathname === '/');
    const hasPhone = await page.waitForSelector('input[type="tel"], #hero-phone', { timeout: 6000 }).then(() => true, () => false);
    test.skip(!hasPhone, 'the main page has no phone field yet (lead funnel, U5)');
    await expect.poll(() => page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.type)).toBe('tel');
  });
});

test.describe('beyond stays', () => {
  for (const width of [390, 768, 1440]) {
    test(`every image box is landscape at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 1024 ? 844 : 900 });
      await openPortfolio(page);
      await scrollToSel(page, '#beyond', 0, 400);
      const boxes = await page.evaluate(() =>
        [...document.querySelectorAll('#beyond [data-beyond-img], #beyond img, #beyond canvas')]
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { id: el.closest('[data-depth-id]')?.getAttribute('data-depth-id') ?? el.tagName, w: r.width, h: r.height };
          })
          .filter((b) => b.w > 0 && b.h > 0),
      );
      expect(boxes.length).toBeGreaterThanOrEqual(8);
      for (const b of boxes) expect(b.w, `${b.id} is ${b.w} × ${b.h}`).toBeGreaterThan(b.h);
      // athero-1 is in, as the mini soccer lead
      await expect(page.locator('#beyond [data-depth-id="others/athero-1"]')).toHaveCount(1);
    });
  }

  test('an image opens the lightbox with its group', async ({ page }) => {
    await openPortfolio(page);
    await scrollToSel(page, '#beyond', 0, 400);
    await page.locator('#beyond .bpanel[data-group="office"] .bpanel__lead .bpanel__open').evaluate((el: HTMLElement) => el.click());
    const box = page.getByRole('dialog');
    await expect(box).toBeVisible();
    await expect(box.locator('.lightbox__count')).toHaveText(/1 \/ 3/);
    await page.keyboard.press('Escape');
    await expect(box).toHaveCount(0);
  });
});

test.describe('phones', () => {
  const { defaultBrowserType: _browser, ...pixel7 } = devices['Pixel 7'];
  test.use({ ...pixel7, viewport: { width: 360, height: 740 } });

  test('no sideways scroll at 360 × 740, and a small Maxone card at S1', async ({ page }) => {
    await openPortfolio(page, LIVE);
    await expectNoSideScroll(page, 'at the top');
    for (const id of ['story', 'maxone', 'padel']) {
      await scrollToProgress(page, id, 0.5, 400);
      await expectNoSideScroll(page, `in ${id}`);
    }
    await scrollToSel(page, '#beyond', 0, 300);
    await expectNoSideScroll(page, 'in beyond');
    await scrollToSel(page, '#closing', 0, 300);
    await expectNoSideScroll(page, 'at the closing');

    // S1 "The welcome": the card is fully in between progress 0.16 and 0.24
    await scrollToProgress(page, 'maxone', 0.2, 1200);
    const card = await page.locator('.scard[data-stop="1"]').boundingBox();
    expect(card!.width).toBeLessThanOrEqual(360 * 0.65);
    expect(card!.height).toBeLessThanOrEqual(740 * 0.31);
    // anchored bottom-left, clear of the mini-map
    expect(card!.x).toBeLessThan(40);
    const map = await page.locator('.mmap').boundingBox();
    expect(map!.width).toBeLessThanOrEqual(97);
    expect(card!.y).toBeGreaterThan(map!.y + map!.height);
  });

  test('the fallback walk (low tier) uses the same small card', async ({ page }) => {
    await openPortfolio(page, 'tier=low');
    await expect(page.locator('.walk')).toHaveAttribute('data-mode', 'fallback');
    await scrollToProgress(page, 'maxone', 0.2, 1200);
    const card = await page.locator('.scard[data-stop="1"]').boundingBox();
    expect(card!.width).toBeLessThanOrEqual(360 * 0.65);
    expect(card!.height).toBeLessThanOrEqual(740 * 0.31);
  });
});

test.describe('without motion or WebGL', () => {
  test('reduced motion renders the static versions', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const problems = watchConsole(page);
    await openPortfolio(page);
    await expect(page.locator('#story.story--static')).toHaveCount(1);
    await expect(page.locator('.walk--static')).toHaveCount(1);
    await expect(page.locator('.padel--static')).toHaveCount(1);
    await expect(page.locator('#beyond .beyond')).toHaveAttribute('data-mode', 'stacked');
    const keys = await page.evaluate(() => Object.keys((window as any).__homyvest?.triggers ?? {}));
    expect(keys).toEqual([]);
    expect(problems, problems.join('\n')).toEqual([]);
    await context.close();
  });

  test('?nowebgl=1 keeps every part readable', async ({ page }) => {
    const problems = watchConsole(page);
    await openPortfolio(page, 'nowebgl=1');
    await expect(page.locator('#story.story--static')).toHaveCount(1);
    await expect(page.locator('.walk')).toHaveAttribute('data-mode', 'fallback');
    await expect(page.locator('.padel--static')).toHaveCount(1);
    expect(problems, problems.join('\n')).toEqual([]);
  });
});

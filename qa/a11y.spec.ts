import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { open, calcStep } from './helpers.ts';

// Whole page, both themes and both languages: no serious or critical violations.
for (const scheme of ['light', 'dark'] as const) {
  for (const lang of ['en', 'id']) {
    test.describe(`${scheme} / ${lang}`, () => {
      test.use({ colorScheme: scheme, reducedMotion: 'reduce' }); // static layout: every section is in the flow
      test('axe finds no serious or critical violations', async ({ page }) => {
        await open(page, `lang=${lang}`);
        await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
        await page.waitForTimeout(500);
        const run = async () => {
          const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
          return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        };
        let bad = await run();
        expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes[0]?.target}`), 'step 1').toEqual([]);
        await calcStep(page, 2);
        bad = await run();
        expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes[0]?.target}`), 'step 2').toEqual([]);
        await calcStep(page, 3);
        bad = await run();
        expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes[0]?.target}`), 'step 3').toEqual([]);
      });
    });
  }
}

test('live page (with the pinned scenes) has no serious or critical violations', async ({ page }) => {
  await open(page);
  await page.waitForTimeout(800);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes[0]?.target}`)).toEqual([]);
});

test('keyboard: skip link first, a visible focus ring, and a logical order', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop keyboard path');
  await open(page);
  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await expect(skip).toHaveAttribute('href', '#main');

  // every focused control shows a ring
  const ring = () =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const s = getComputedStyle(el);
      const box = el.closest('.field__box') ? getComputedStyle(el.closest('.field__box')!).boxShadow : 'none';
      return { tag: el.tagName, cls: el.className?.toString().slice(0, 40), outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2, box: box !== 'none' };
    });
  const seen: string[] = [];
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab');
    const r = await ring();
    seen.push(`${r.tag}.${r.cls}`);
    expect(r.outline || r.box, `no focus ring on ${r.tag}.${r.cls}`).toBe(true);
  }
  // wordmark, then the six nav links (How it works … Portfolio), then language and WhatsApp
  expect(seen[0]).toContain('header__mark');
  expect(seen.slice(1, 7).every((s) => s.startsWith('A.link'))).toBe(true);

  // the phone field, the calculator's fields, the tabs, the FAQ, the portfolio card and WhatsApp are reachable
  const focusable = await page.evaluate(() => {
    const ok = (sel: string) => [...document.querySelectorAll(sel)].some((el) => (el as HTMLElement).tabIndex >= 0 && (el as HTMLElement).offsetParent !== null);
    return { phone: ok('#hero-phone'), fields: ok('#calc-P'), tabs: ok('#calc-tab-1'), faq: ok('.faq__q button'), portfolio: ok('a.pfcard'), wa: ok('a[data-wa]') };
  });
  expect(focusable).toEqual({ phone: true, fields: true, tabs: true, faq: true, portfolio: true, wa: true });
});

test('FAQ buttons expose their state', async ({ page }) => {
  await open(page);
  const first = page.locator('.faq__q button').first();
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  const second = page.locator('.faq__q button').nth(1);
  await second.evaluate((el: HTMLElement) => el.click());
  await expect(second).toHaveAttribute('aria-expanded', 'true');
  await expect(first).toHaveAttribute('aria-expanded', 'false'); // single-open
  const controls = await second.getAttribute('aria-controls');
  await expect(page.locator(`#${controls}`)).toBeVisible();
});

test('the mobile menu is a dialog that traps focus and returns it', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile menu');
  await open(page);
  const btn = page.locator('.header__menu');
  await btn.click();
  const menu = page.locator('#mobile-menu');
  await expect(menu).toHaveAttribute('data-open', 'true');
  await expect(menu).toHaveAttribute('role', 'dialog');
  await expect(page.locator('.mmenu__close')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('data-open', 'false');
  await expect(btn).toBeFocused();
});

const axeBad = async (page: import('@playwright/test').Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes[0]?.target}`);
};

// U01_08 §2: the portfolio page, and the funnel open at steps 2 and 3, in both themes.
for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme}: portfolio and funnel`, () => {
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' });

    test('/portofolio/ has no serious or critical violations', async ({ page }) => {
      await page.goto('/portofolio/?nointro=1');
      await page.waitForSelector('#beyond');
      await page.waitForTimeout(500);
      expect(await axeBad(page)).toEqual([]);
    });

    test('the funnel at steps 2 and 3 has no serious or critical violations', async ({ page }) => {
      await open(page);
      await page.fill('#hero-phone', '081234567890');
      await page.click('#hero-continue');
      await expect(page.locator('.funnel')).toHaveAttribute('data-open', 'true');
      await expect(page.locator('#funnel-title')).toBeFocused();
      await page.waitForTimeout(500);
      expect(await axeBad(page), 'step 2').toEqual([]);
      await page.locator('label.rcard:has(input[value="personal_funds"])').click();
      await page.locator('.funnel__primary').click();
      await expect(page.locator('.funnel')).toHaveAttribute('data-step', '3');
      await page.waitForTimeout(500); // each step fades in over 0.35 s: measure contrast once it has settled
      await page.locator('.funnel__primary').click(); // send empty: the errors show
      await expect(page.locator('.ffield__error').first()).toBeVisible();
      expect(await axeBad(page), 'step 3A with errors').toEqual([]);
      await page.locator('.funnel__back').click();
      await page.locator('label.rcard:has(input[value="no_funds"])').click();
      await page.locator('.funnel__primary').click();
      await expect(page.locator('.funnel')).toHaveAttribute('data-step', '3');
      await page.waitForTimeout(500); // each step fades in over 0.35 s: measure contrast once it has settled
      expect(await axeBad(page), 'step 3B').toEqual([]);
    });
  });
}

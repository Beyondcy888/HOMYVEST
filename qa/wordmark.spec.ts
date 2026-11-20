import { test, expect, type Page } from '@playwright/test';
import { open } from './helpers.ts';

const widths = (page: Page) =>
  page.evaluate(() => {
    const mark = document.querySelector('.header__mark')!;
    return ['.wm-in', '.wm-asi'].map((s) => mark.querySelector(s)!.getBoundingClientRect().width);
  });

test('the accessible name always includes "Homy Investasi"', async ({ page }) => {
  await open(page);
  await expect(page.locator('.header__mark')).toHaveAttribute('aria-label', /Homy Investasi/);
});

test('hovering the header wordmark reveals IN and ASI, and leaving hides them', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'hover needs a fine pointer');
  await open(page);
  expect(await widths(page)).toEqual([0, 0]);
  await page.locator('.header__mark').hover();
  await page.waitForTimeout(700);
  const open_ = await widths(page);
  expect(open_[0]).toBeGreaterThan(0);
  expect(open_[1]).toBeGreaterThan(0);
  await page.mouse.move(700, 500);
  await page.waitForTimeout(700);
  expect(await widths(page)).toEqual([0, 0]);
});

test('keyboard focus expands it too', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop keyboard path');
  await open(page);
  await page.keyboard.press('Tab'); // skip link
  await page.keyboard.press('Tab'); // wordmark
  await expect(page.locator('.header__mark')).toBeFocused();
  await page.waitForTimeout(700);
  const w = await widths(page);
  expect(w[0]).toBeGreaterThan(0);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no animation runs', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'hover needs a fine pointer');
    await open(page);
    await page.locator('.header__mark').hover();
    await page.waitForTimeout(700);
    expect(await widths(page)).toEqual([0, 0]);
  });
});

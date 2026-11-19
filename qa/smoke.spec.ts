import { test, expect } from '@playwright/test';
import { SECTION_IDS, open, watchConsole } from './helpers.ts';

test('page loads cleanly with every section in order', async ({ page }) => {
  const problems = watchConsole(page);
  await open(page);

  await expect(page.locator('.header__mark')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);

  const ids = await page.evaluate(() => [...document.querySelectorAll('main section[id]')].map((s) => s.id));
  expect(ids).toEqual(SECTION_IDS);

  // walk the page so lazy sections mount, then check nothing complained
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 1400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
  expect(problems, problems.join('\n')).toEqual([]);
});

test('the intro plays once and gets out of the way', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.intro')).toBeVisible();
  await expect(page.locator('.intro')).toHaveCount(0, { timeout: 6000 });
  await expect(page.locator('.header__mark')).toBeVisible();
  // second visit in the same session: no intro
  await page.reload();
  await page.waitForTimeout(300);
  await expect(page.locator('.intro')).toHaveCount(0);
});

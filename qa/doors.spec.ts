import { test, expect } from '@playwright/test';
import { open, scrollToSel } from './helpers.ts';

test('door A leads to step 1 with the front-width field focused', async ({ page }) => {
  await open(page);
  await scrollToSel(page, '.doors');
  await page.locator('[data-door="land"]').evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('#calc-P')).toBeFocused({ timeout: 8000 });
  await expect(page.locator('#calculator')).toHaveAttribute('data-step', '1');
  await expect(page.locator('#calc-P')).toBeInViewport();
  await expect(page.locator('[data-next="ideas"]')).toContainText('Next: see what this space could earn');
});

test('door B shows the building note and goes straight to step 3', async ({ page }) => {
  await open(page);
  await scrollToSel(page, '.doors');
  await page.locator('[data-door="building"]').evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('#calc-P')).toBeFocused({ timeout: 8000 });
  await expect(page.locator('#calculator')).toHaveAttribute('data-step', '1');
  await expect(page.locator('#calc-panel')).toContainText('First, tell us about the land, then about your building.');
  const next = page.locator('[data-next="building"]');
  await expect(next).toContainText('Check my building');
  await next.evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('#calculator')).toHaveAttribute('data-step', '3');
  await expect(page.locator('[data-answer]')).toContainText('3 more floors');
});

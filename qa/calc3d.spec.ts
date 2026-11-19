import { test, expect } from '@playwright/test';
import { open, scrollToSel, calcStep } from './helpers.ts';

test('with WebGL: the 3D canvas exists and its text alternative states the numbers', async ({ page }) => {
  await open(page);
  await scrollToSel(page, '.calc__tabs');
  await expect(page.locator('.calc__canvas[data-3d="true"] canvas').first()).toBeVisible({ timeout: 20_000 });
  const alt = page.locator('[data-scene-alt]');
  await expect(alt).toContainText('30 by 20 metre land');
  await expect(alt).toContainText('1,200 m²');
  await expect(alt).toContainText('3 floors');
  await expect(alt).toContainText('Green area 120 m²');

  // the alternative follows the step and the selected idea
  await calcStep(page, 2);
  await expect(alt).toContainText('Kos-kosan');
  await expect(alt).toContainText('66 rooms');
  await calcStep(page, 3);
  await expect(alt).toContainText('footprint 240 m²');
  await expect(alt).toContainText('3 more floors');
});

test('without WebGL: the SVG plan is shown with the same numbers', async ({ page }) => {
  await open(page, 'nowebgl=1');
  await scrollToSel(page, '.calc__tabs');
  await expect(page.locator('[data-fallback="2d"] svg')).toBeVisible();
  await expect(page.locator('.calc__canvas canvas')).toHaveCount(0);
  await expect(page.locator('[data-fallback="2d"]')).toContainText('600 m²');
  await expect(page.locator('[data-fallback="2d"]')).toContainText('Front 30 m');
  await expect(page.locator('[data-fallback="2d"]')).toContainText('4 × floors');
  await expect(page.locator('[data-scene-alt]')).toContainText('1,200 m²');
  await expect(page.locator('[data-scene-alt]')).toContainText('3 floors');
  // the numbers never depend on the 3D
  await expect(page.locator('.calc__result')).toContainText('1,200 m²');
});

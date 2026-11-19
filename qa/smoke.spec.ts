import { test, expect } from '@playwright/test';

test('page loads and shows HOMYVEST', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toContainText('HOMYVEST');
});

// Phones (U01_05, U01_08 §2). The Maxone stop-card size on /portofolio/ is checked in portfolio.spec.ts.
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 360, height: 740 } });

const noSideScroll = () => document.documentElement.scrollWidth <= window.innerWidth;

test('no horizontal scroll at 360 px on either page', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'phones');
  for (const path of ['/?nointro=1', '/?nointro=1&lang=id', '/portofolio/?nointro=1', '/portofolio/?nointro=1&lang=id']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 900) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(60);
      expect(await page.evaluate(noSideScroll), `${path} at ${y}`).toBe(true);
    }
  }
});

test('the funnel keeps its primary button above the keyboard', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'phones');
  await page.goto('/?nointro=1');
  await page.fill('#hero-phone', '0812 3456 7890');
  await page.click('#hero-continue');
  await expect(page.locator('.funnel')).toHaveAttribute('data-open', 'true');
  await page.locator('label.rcard:has(input[name="funding"][value="personal_funds"])').click();
  await page.locator('.funnel__primary').click();
  await page.locator('#f-name').focus();
  // the keyboard takes the lower part of the screen: the visual viewport shrinks to 420 px
  await page.setViewportSize({ width: 360, height: 420 });
  await page.waitForTimeout(400);
  const btn = page.locator('.funnel__primary');
  await expect(btn).toBeVisible();
  const box = await btn.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(420);
  await expect(btn).toBeInViewport();
});

test('the floating WhatsApp button hides while the funnel is open', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'phones');
  await page.goto('/?nointro=1');
  await page.waitForSelector('#calculator');
  // past the hero, the button shows
  await page.evaluate(() => {
    const y = document.getElementById('how')!.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, y);
  });
  await expect(page.locator('.fab')).toHaveAttribute('data-show', 'true');
  // open the panel (as the hero's Continue does)
  await page.evaluate(() => (window as any).__homyvest.funnel.getState().start('+6281234567890', '00000000-0000-4000-8000-000000000000'));
  await expect(page.locator('.funnel')).toHaveAttribute('data-open', 'true');
  await expect(page.locator('.fab')).toHaveAttribute('data-show', 'false');
  await page.keyboard.press('Escape');
  await expect(page.locator('.funnel')).toHaveAttribute('data-open', 'false');
});

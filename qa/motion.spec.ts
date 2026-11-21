import { test, expect } from '@playwright/test';
import { open, watchConsole } from './helpers.ts';

test.describe('prefers-reduced-motion: reduce', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no pinned sections and all copy visible', async ({ page }) => {
    const problems = watchConsole(page);
    await open(page);
    await page.waitForTimeout(600);

    // nothing is pinned and nothing scrubs
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('[data-pinned]')).toHaveCount(0);
    // no intro overlay
    await expect(page.locator('.intro')).toHaveCount(0);
    // native scrolling (Lenis is off)
    expect(await page.evaluate(() => Boolean((window as any).__homyvest?.lenis))).toBe(false);

    const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
    for (const copy of [
      'Turn idle land into steady income.',
      'Built by HomyEight, operated by Behomy.',
      'What is HOMYVEST?',
      'From the first sketch to full rooms, we take care of it.',
      'Building it is half the story. Behomy keeps it full.',
      'Places Behomy runs today',
      'From idle to running',
      "Places we've built and run.",
      'What can your land become?',
      'Ready when you are.',
      'See our full portfolio',
    ]) {
      expect(text, `missing: ${copy}`).toContain(copy);
    }

    // images that reveal on scroll are simply there: no clip is left on any of them
    const clipped = await page.evaluate(
      () => [...document.querySelectorAll('.pj .depth--enter, .bp__open, .how-step__media')].filter((el) => getComputedStyle(el).clipPath !== 'none').length,
    );
    expect(clipped).toBe(0);
    expect(problems, problems.join('\n')).toEqual([]);
  });

  test('the calculator still works and numbers appear without rolling', async ({ page }) => {
    await open(page);
    await page.locator('#calculator').scrollIntoViewIfNeeded();
    await expect(page.locator('.calc__result')).toContainText('1,200 m²');
  });
});

import { test, expect } from '@playwright/test';
import { open, watchConsole } from './helpers.ts';

test.describe('prefers-reduced-motion: reduce', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no pinned sections, posters instead of 3D scenes, all copy visible', async ({ page }) => {
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
      // hero: all five beats are on the page as text
      'Your land is waiting.',
      'First, we build it right.',
      "It doesn't have to be a guesthouse.",
      'Then we bring it to life.',
      'From idle to earning.',
      // walkthrough and padel stages
      'Step inside one of our projects.',
      'The dining hall',
      'Ground floor: the courts, a café and changing rooms.',
      'Finished: one hall, ready to book.',
      // the rest of the story
      'We help idle land and buildings start earning.',
      'Three names. One team, from empty land to monthly report.',
      'What can your land become?',
      'Ready when you are.',
    ]) {
      expect(text, `missing: ${copy}`).toContain(copy);
    }

    // the pinned 3D scenes are replaced by images
    for (const id of ['story', 'homyeight', 'beyond']) {
      const imgs = await page.locator(`#${id} img`).count();
      expect(imgs, `#${id} should show poster or render images`).toBeGreaterThan(0);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  test('the calculator still works and numbers appear without rolling', async ({ page }) => {
    await open(page);
    await page.locator('#calculator').scrollIntoViewIfNeeded();
    await expect(page.locator('.calc__result')).toContainText('1,200 m²');
  });
});

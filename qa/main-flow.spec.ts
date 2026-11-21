// The main page after update U01 (U01_01, U01_08 §2).
import { test, expect, type Page } from '@playwright/test';
import { SECTION_IDS, open, watchConsole } from './helpers.ts';

/** Walks the whole page so every lazy part mounts and every reveal fires. */
async function walk(page: Page, step = 600) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += step) {
    await page.evaluate((top) => {
      const lenis = (window as any).__homyvest?.lenis;
      if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
      else window.scrollTo(0, top);
    }, y);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(500);
}

test('the sections are in the new order and the removed ones are gone', async ({ page }) => {
  const problems = watchConsole(page);
  await open(page);
  const ids = await page.evaluate(() => [...document.querySelectorAll('main section[id]')].map((s) => s.id));
  expect(ids).toEqual(SECTION_IDS);
  const text = await page.evaluate(() => document.body.innerText);
  expect(text).not.toContain('Which one sounds like you?');
  expect(text).not.toContain("Here's who does the work.");
  expect(text).not.toContain('Drawn with care');
  expect(text).not.toContain('Three names. One team');
  // no 3D scenes, doors or filters on this page
  for (const sel of ['#story', '#maxone', '#padel', '#beyond', '#team', '#homyeight', '.door', '#projects [role="tablist"]', '.filters']) {
    await expect(page.locator(sel), sel).toHaveCount(0);
  }
  expect(await page.locator('h1').count()).toBe(1);
  expect(problems, problems.join('\n')).toEqual([]);
});

test('every project image appears as it scrolls in', async ({ page }) => {
  await open(page);
  await walk(page);
  const pics = page.locator('#projects .pj');
  await expect(pics).toHaveCount(13);
  const notIn = await page.evaluate(() => [...document.querySelectorAll('#projects .pj .depth')].filter((el) => !el.classList.contains('is-in')).length);
  expect(notIn).toBe(0);
});

test('the hero names the operator in both languages', async ({ page }) => {
  await open(page);
  await expect(page.locator('h1')).toContainText('operated by Behomy');
  await open(page, 'lang=id');
  await expect(page.locator('h1')).toContainText('dioperasikan oleh Behomy');
});

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`partner logos (${scheme})`, () => {
    test.use({ colorScheme: scheme });
    test('are visible and match the theme', async ({ page }) => {
      await open(page);
      const logos = page.locator('.hero__partners img.plogo');
      await expect(logos).toHaveCount(2);
      for (const i of [0, 1]) {
        await expect(logos.nth(i)).toBeVisible();
        const src = (await logos.nth(i).getAttribute('src')) ?? '';
        if (scheme === 'dark') expect(src).toContain('on-dark');
        else expect(src).not.toContain('on-dark');
      }
      await expect(logos.nth(0)).toHaveAttribute('alt', 'HomyEight');
      await expect(logos.nth(1)).toHaveAttribute('alt', 'Behomy');
    });
  });
}

test('the portfolio card links to /portofolio/', async ({ page }) => {
  await open(page);
  const card = page.locator('a.pfcard');
  await expect(card).toHaveAttribute('href', '/portofolio/');
  await expect(card).toContainText('See our full portfolio');
  await expect(page.locator('.header__nav a[href="/portofolio/"]').first()).toHaveCount(1);
});

test('the main page never loads the 3D scenes of the portfolio', async ({ page }) => {
  const scenes: string[] = [];
  page.on('request', (r) => {
    if (/(HeroScene|MaxoneScene|PadelScene|StoryPageScene)[-.]/.test(r.url()) || /\/media\/posters\//.test(r.url())) scenes.push(r.url());
  });
  await open(page);
  await walk(page, 800);
  expect(scenes).toEqual([]);
});

test('deep links land: /#calculator and /?focus=phone', async ({ page }) => {
  await page.goto('/#calculator');
  await expect(page.locator('.intro')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => Math.abs(document.getElementById('calculator')!.getBoundingClientRect().top) < 160)).toBe(true);
  await page.goto('/?focus=phone');
  await expect(page.locator('#hero-phone')).toBeFocused();
});

// Screenshot review set (docs/10 §3). Run with: npm run shots
// Output: qa/screenshots/sections, qa/screenshots/3d, qa/screenshots/calculator, qa/screenshots/header
// Then make contact sheets for review: node qa/tools/contact-sheets.mjs
import { test, type Page } from '@playwright/test';
import { SECTION_IDS, open, scrollToSel, scrollToProgress, scrollToY } from './helpers.ts';

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  large: { width: 1920, height: 1080 },
} as const;
const THEMES = ['light', 'dark'] as const;

// Key progress points per pinned scene on /portofolio/ (docs/06 §2.4, §3.7, §4.4).
const SCENES: Record<string, number[]> = {
  story: [0, 0.06, 0.18, 0.3, 0.38, 0.44, 0.52, 0.62, 0.72, 0.78, 0.83, 0.92, 1],
  maxone: [0, 0.07, 0.12, 0.2, 0.29, 0.37, 0.52, 0.67, 0.8, 0.9, 0.95, 1],
  padel: [0.02, 0.15, 0.28, 0.33, 0.38, 0.5, 0.6, 0.65, 0.7, 0.82, 0.9, 0.96, 1],
};
const PORTFOLIO_PARTS = ['intro', 'story', 'maxone', 'padel', 'beyond', 'closing'];

test.describe.configure({ mode: 'parallel' });
test.setTimeout(600_000);

const settle = (page: Page, ms = 500) => page.waitForTimeout(ms);

for (const [vp, size] of Object.entries(VIEWPORTS)) {
  for (const theme of THEMES) {
    const langs = vp === 'mobile' || vp === 'desktop' ? ['en', 'id'] : ['en'];
    for (const lang of langs) {
      test.describe(`${vp} ${theme} ${lang}`, () => {
        test.use({ viewport: size, colorScheme: theme, hasTouch: vp === 'mobile', isMobile: vp === 'mobile' });

        test('sections at rest', async ({ page }) => {
          await open(page, `lang=${lang}`);
          for (const id of SECTION_IDS) {
            if (id === 'top') await scrollToY(page, 0);
            else await scrollToSel(page, `#${id}`, 0);
            await settle(page, 900);
            await page.screenshot({ path: `qa/screenshots/sections/${vp}-${theme}-${lang}-${id}.png` });
          }
          // a few sections are taller than one screen: capture their other parts too
          for (const [name, sel] of [
            ['how-steps', '.how__steps'],
            ['behomy-hybrid', '.hybrid'],
            ['behomy-stats', '.behomy__stats'],
            ['behomy-places', '.bp'],
            ['behomy-before-after', '.ba'],
            ['behomy-team', '.behomy__team'],
            ['projects-grid', '.pj-grid'],
            ['next-closing', '.closing'],
            ['footer', 'footer'],
          ]) {
            await scrollToSel(page, sel, -40);
            await settle(page, 900);
            await page.screenshot({ path: `qa/screenshots/sections/${vp}-${theme}-${lang}-${name}.png` });
          }
        });

        test('calculator steps', async ({ page }) => {
          await open(page, `lang=${lang}`);
          await scrollToSel(page, '.calc__tabs', -20);
          await settle(page, 2500);
          const calc = (js: string) => page.evaluate(`window.__homyvest.calc.getState().${js}`);
          const shot = (name: string) => page.screenshot({ path: `qa/screenshots/calculator/${vp}-${theme}-${lang}-${name}.png` });
          await shot('step1');
          await calc('setLand({ kdb: 70, kdh: 40 })');
          await settle(page, 1500);
          await shot('step1-conflict');
          await calc('reset()');
          await calc('setStep(2)');
          await settle(page, 1800);
          await shot('step2');
          await calc("selectIdea('ruko')");
          await settle(page, 1800);
          await shot('step2-ruko');
          await calc('setStep(3)');
          await settle(page, 1800);
          await shot('step3');
          await calc('reset()');
        });

        test('portfolio page at rest', async ({ page }) => {
          await page.goto(`/portofolio/?nointro=1&lang=${lang}`);
          await page.waitForSelector('#beyond');
          await page.evaluate(() => document.fonts.ready);
          for (const id of PORTFOLIO_PARTS) {
            if (id === 'intro') await scrollToY(page, 0);
            else await scrollToSel(page, `#${id}`, 0);
            await settle(page, 1200);
            await page.screenshot({ path: `qa/screenshots/sections/${vp}-${theme}-${lang}-portfolio-${id}.png` });
          }
        });

        if (lang === 'en' && (vp === 'mobile' || vp === 'desktop')) {
          for (const [scene, points] of Object.entries(SCENES)) {
            test(`3D scene: ${scene}`, async ({ page }) => {
              await page.goto('/portofolio/?nointro=1&tier=high');
              await page.evaluate(() => document.fonts.ready);
              for (const p of points) {
                await scrollToProgress(page, scene, p, 1400);
                await page.screenshot({ path: `qa/screenshots/3d/${vp}-${theme}-${scene}-${String(Math.round(p * 100)).padStart(3, '0')}.png` });
              }
            });
          }
        }

        if (vp === 'desktop' && lang === 'en') {
          test('header with the wordmark expanded', async ({ page }) => {
            await open(page);
            await page.locator('.header__mark').hover();
            await settle(page, 900);
            await page.screenshot({ path: `qa/screenshots/header/${vp}-${theme}-wordmark-expanded.png`, clip: { x: 0, y: 0, width: size.width, height: 120 } });
          });
          test('portfolio card hover', async ({ page }) => {
            await open(page);
            await scrollToSel(page, '.closing__card', -200);
            await page.locator('a.pfcard').hover();
            await settle(page, 900);
            await page.screenshot({ path: `qa/screenshots/sections/${vp}-${theme}-${lang}-portfolio-card-hover.png` });
          });
        }

        // The funnel's states (U01_08 §3), against the fake-Supabase build with every request intercepted.
        if (vp === 'mobile' || vp === 'desktop') {
          test('funnel states', async ({ page }) => {
            let reply = 201;
            await page.route('https://e2e-fake.supabase.co/**', (route) =>
              route.request().method() === 'OPTIONS'
                ? route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } })
                : route.fulfill({
                    status: route.request().url().includes('/leads') ? reply : 201,
                    headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
                    body: reply === 201 ? '' : '{"message":"boom"}',
                  }),
            );
            const base = 'http://localhost:4174';
            const shot = (name: string) => page.screenshot({ path: `qa/screenshots/funnel/${vp}-${theme}-${lang}-${name}.png` });
            await page.goto(`${base}/?nointro=1&lang=${lang}`);
            await page.evaluate(() => document.fonts.ready);
            await page.fill('#hero-phone', '0812 3456 7890');
            await page.click('#hero-continue');
            await settle(page, 800);
            await shot('2-funding');
            await page.locator('label.rcard:has(input[value="no_funds"])').click();
            await page.locator('.funnel__primary').click();
            await settle(page, 700);
            await shot('3b-needs');
            await page.locator('.funnel__back').click();
            await page.locator('label.rcard:has(input[value="personal_funds"])').click();
            await page.locator('.funnel__primary').click();
            await settle(page, 700);
            await shot('3a-build');
            await page.locator('.funnel__primary').click();
            await settle(page, 400);
            await shot('3a-errors');
            await page.fill('#f-name', 'Budi Santoso');
            for (const [n, v] of [['owned', 'vacant_land'], ['build', 'hybrid_stay'], ['cities', 'bodetabek']]) {
              await page.locator(`label.fchip:has(input[name="${n}"][value="${v}"])`).click();
            }
            await settle(page, 1600);
            reply = 500;
            await page.locator('.funnel__primary').click();
            await settle(page, 900);
            await shot('error');
            reply = 201;
            await page.getByRole('button', { name: /Try again|Coba lagi/ }).click();
            await settle(page, 500);
            await page.locator('.funnel__primary').click();
            await settle(page, 1400);
            await shot('thank-you');
            // the handoff: the keyless build
            await page.goto(`/?nointro=1&lang=${lang}`);
            await page.fill('#hero-phone', '0812 3456 7890');
            await page.click('#hero-continue');
            await page.locator('label.rcard:has(input[value="no_funds"])').click();
            await page.locator('.funnel__primary').click();
            await page.locator('label.rcard:has(input[name="need"][value="rent_out"])').click();
            await page.fill('#f-name', 'Budi Santoso');
            await page.locator('label.fchip:has(input[name="cities"][value="jakarta"])').click();
            await settle(page, 1600);
            await page.locator('.funnel__primary').click();
            await settle(page, 900);
            await shot('handoff');
          });
        }
      });
    }
  }
}

// Reduced motion and no-WebGL paths (docs/10 §6): full-page captures.
for (const [name, query, reduced] of [['reduced-motion', '', true], ['no-webgl', 'nowebgl=1', false]] as const) {
  for (const vp of ['mobile', 'desktop'] as const) {
    test.describe(`${name} ${vp}`, () => {
      test.use({ viewport: VIEWPORTS[vp], reducedMotion: reduced ? 'reduce' : 'no-preference' });
      test('full page', async ({ page }) => {
        await open(page, query);
        // touch every part of the page so lazy images load
        const h = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < h; y += 700) {
          await page.evaluate((top) => window.scrollTo(0, top), y);
          await page.waitForTimeout(120);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await settle(page, 800);
        await page.screenshot({ path: `qa/screenshots/fallbacks/${name}-${vp}.png`, fullPage: true });
      });
    });
  }
}

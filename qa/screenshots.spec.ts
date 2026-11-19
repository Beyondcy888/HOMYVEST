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

// Key progress points per pinned scene (docs/06 §2.4, §3.7, §4.4).
const SCENES: Record<string, number[]> = {
  story: [0, 0.06, 0.18, 0.3, 0.38, 0.44, 0.52, 0.62, 0.72, 0.78, 0.83, 0.92, 1],
  homyeight: [0, 0.07, 0.12, 0.2, 0.29, 0.37, 0.52, 0.67, 0.8, 0.9, 0.95, 1],
  beyond: [0.02, 0.15, 0.28, 0.33, 0.38, 0.5, 0.6, 0.65, 0.7, 0.82, 0.9, 0.96, 1],
};

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
            if (id === 'story') await scrollToY(page, 0);
            else await scrollToSel(page, `#${id}`, 0);
            await settle(page, 900);
            await page.screenshot({ path: `qa/screenshots/sections/${vp}-${theme}-${lang}-${id}.png` });
          }
          // a few sections are taller than one screen: capture their second part too
          for (const [name, sel] of [['about-doors', '.doors'], ['behomy-hybrid', '.hybrid'], ['behomy-stats', '.behomy__stats'], ['projects-grid', '.pj-grid'], ['next-closing', '.closing'], ['footer', 'footer']]) {
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

        if (lang === 'en' && (vp === 'mobile' || vp === 'desktop')) {
          for (const [scene, points] of Object.entries(SCENES)) {
            test(`3D scene: ${scene}`, async ({ page }) => {
              await open(page, 'tier=high');
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

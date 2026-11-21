import { test, expect } from '@playwright/test';
import { open, scrollToSel } from './helpers.ts';

// The hero's <h1> (U01_06 §1)
const EN_B1 = 'Turn idle land into steady income. Built by HomyEight, operated by Behomy.';
const ID_B1 = 'Ubah lahan menganggur jadi penghasilan rutin. Dibangun oleh HomyEight, dioperasikan oleh Behomy.';

test('the language toggle switches copy, <html lang> and number formats', async ({ page }, info) => {
  await open(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText(EN_B1);

  // switch to Indonesian (the footer toggle is always present; the header one hides in pinned scenes)
  await page.locator('footer .lang button[lang="id"]').evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');
  await expect(page.locator('h1')).toHaveText(ID_B1);
  await expect(page).toHaveTitle('HOMYVEST: Ubah lahan menganggur jadi penghasilan');

  if (info.project.name === 'desktop') {
    await expect(page.locator('.header__nav')).toContainText('Cara kerja');
    await expect(page.locator('.header__nav')).toContainText('Cek lahan');
    await expect(page.locator('.header__nav')).toContainText('Portofolio');
  }
  await scrollToSel(page, '.calc__tabs');
  await expect(page.locator('.calc__result')).toContainText('1.200 m²');

  // and back
  await page.locator('footer .lang button[lang="en"]').evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText(EN_B1);
  await expect(page.locator('.calc__result')).toContainText('1,200 m²');
});

test('?lang=id loads directly in Indonesian and the choice is remembered', async ({ page }) => {
  await open(page, 'lang=id');
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');
  await expect(page.locator('h1')).toHaveText(ID_B1);
  await page.locator('footer .lang button[lang="id"]').evaluate((el: HTMLElement) => el.click());
  await page.goto('/?nointro=1');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en'); // ?lang only applies when present…
  await page.locator('footer .lang button[lang="id"]').evaluate((el: HTMLElement) => el.click());
  await page.goto('/?nointro=1');
  await expect(page.locator('html')).toHaveAttribute('lang', 'id'); // …the toggle is what persists
});

for (const lang of ['en', 'id']) {
  test(`no untranslated keys in ${lang}`, async ({ page }) => {
    const missing: string[] = [];
    page.on('console', (m) => m.text().includes('[i18n] missing') && missing.push(m.text()));
    await open(page, `lang=${lang}`);
    for (const step of [2, 3]) {
      await page.locator(`#calc-tab-${step}`).evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(150);
    }
    const text = await page.evaluate(() => document.body.innerText);
    expect(text).not.toContain('[missing:');
    expect(missing).toEqual([]);
  });
}

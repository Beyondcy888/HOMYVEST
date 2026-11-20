// UI checks from docs/05 §10 and docs/10 §2. Expected strings come straight from the spec.
import { test, expect, type Page } from '@playwright/test';
import { open, calcStep, scrollToSel } from './helpers.ts';

const result = (page: Page) => page.locator('.calc__result');
const panel = (page: Page) => page.locator('#calc-panel');

test('default values in English', async ({ page }) => {
  await open(page);
  await scrollToSel(page, '.calc__tabs');
  await expect(result(page)).toContainText('1,200 m²');
  await expect(result(page)).toContainText('3 floors + a smaller top floor of 120 m²');
  await expect(panel(page)).toContainText('360 m² (60% of the land)');
  await expect(panel(page)).toContainText('About 4 cars');

  await calcStep(page, 2);
  await expect(page.locator('[data-idea="kos"]')).toContainText('66 rooms');
  await expect(page.locator('[data-idea="kos"] .idea__badge')).toHaveText('Fastest');
  await expect(page.locator('.idea__badge')).toHaveCount(1);
  await expect(page.locator('[data-idea="ruko"]')).toContainText('6 units, 200 m² each');
  await expect(page.locator('[data-idea="rumah"]')).toContainText('6 houses');
  await expect(page.locator('[data-idea="gudang"]')).toContainText('360 m², one floor');
  await expect(page.locator('[data-idea="ruko"]')).toContainText('5.9%'); // 5.9499… displays as 5.9% (05 §10 note)
  await expect(page.locator('[data-summary]')).toContainText('Rp 5.35 B');
  await expect(page.locator('[data-summary]')).toContainText('6.6 years');
  await expect(page.locator('[data-summary]')).toContainText('Next is Warehouse');
  await expect(page.locator('[data-summary]')).toContainText('Warehouse costs the least to build');
  // the fastest idea is pre-selected and shown in 3D
  await expect(page.locator('[data-idea="kos"]')).toHaveAttribute('data-selected', 'true');

  await calcStep(page, 3);
  await expect(page.locator('[data-answer]')).toContainText('3 more floors');
  await expect(page.locator('[data-answer]')).toContainText('240 m²');
  await expect(page.locator('[data-leftover]')).toContainText('210 m²');
  await expect(page.locator('[data-leftover]')).toContainText('35%');
});

test('default values in Indonesian', async ({ page }) => {
  await open(page, 'lang=id');
  await scrollToSel(page, '.calc__tabs');
  await expect(result(page)).toContainText('1.200 m²');
  await calcStep(page, 2);
  await expect(page.locator('[data-idea="kos"]')).toContainText('66 kamar');
  await expect(page.locator('[data-idea="kos"] .idea__badge')).toHaveText('Tercepat');
  await expect(page.locator('[data-summary]')).toContainText('Rp 5,35 M');
  await expect(page.locator('[data-summary]')).toContainText('6,6 tahun');
});

test('variations from the spec', async ({ page }) => {
  await open(page);
  await scrollToSel(page, '.calc__tabs');

  // max floors = 2 → 720 m², capped
  await page.locator('#calc-maxFloors').fill('2');
  await expect(result(page)).toContainText('720 m²');
  await expect(panel(page)).toContainText('Limited by the max-floors rule.');
  await page.locator('#calc-maxFloors').fill('');
  await expect(result(page)).toContainText('1,200 m²');

  // KDB 70 + KDH 40 → conflict warning, footprint stays 360
  await page.locator('#calc-kdb').fill('70');
  await page.locator('#calc-kdh').fill('40');
  await expect(panel(page).locator('.notice')).toContainText('add up to more than 100%');
  await expect(panel(page).locator('.notice')).toContainText('360 m²');
  await expect(panel(page)).toContainText('Very tight');
  await page.locator('#calc-kdb').fill('60');
  await page.locator('#calc-kdh').fill('20');
  await expect(panel(page).locator('.notice')).toHaveCount(0);

  // KLB 0.5 → one floor of 300 m² + the KLB warning (a comma works as the decimal separator too)
  await page.locator('#calc-klb').fill('0,5');
  await expect(result(page)).toContainText('1 floor of 300 m²');
  await expect(panel(page).locator('.notice')).toContainText('KLB is lower than your KDB');
  await page.locator('#calc-klb').fill('2');

  // width 0 → empty state
  await page.locator('#calc-P').fill('');
  await expect(panel(page)).toContainText('Enter the front width and depth of your land to begin.');
  await page.locator('#calc-P').fill('30');
  await expect(result(page)).toContainText('1,200 m²');
});

test('money fields keep their separators while typing', async ({ page }) => {
  await open(page);
  await calcStep(page, 2);
  const kos = page.locator('[data-idea="kos"]');
  await kos.locator('summary').evaluate((el: HTMLElement) => el.click());
  const rent = kos.locator('.field--money input').first();
  await expect(rent).toHaveValue('1,200,000');
  await expect(kos.locator('.field__tag').first()).toHaveText('Example');
  await rent.fill('');
  await rent.pressSequentially('1500000');
  await expect(rent).toHaveValue('1,500,000');
  // 66 rooms × 1,500,000 × 12 × 85% = 1,009,800,000
  await expect(kos).toContainText('Rp 1,009,800,000');
});

test('values survive a reload, and reset restores the examples', async ({ page }) => {
  await open(page);
  await scrollToSel(page, '.calc__tabs');
  await page.locator('#calc-P').fill('40');
  await expect(result(page)).toContainText('1,600 m²');
  await page.waitForTimeout(200);
  await page.reload();
  await page.waitForSelector('#calculator');
  await scrollToSel(page, '.calc__tabs');
  await expect(page.locator('#calc-P')).toHaveValue('40');
  await expect(result(page)).toContainText('1,600 m²');

  await page.locator('.calc__reset').evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('#calc-P')).toHaveValue('30');
  await expect(result(page)).toContainText('1,200 m²');
});

test('presets overwrite only the three rules', async ({ page }) => {
  await open(page);
  await scrollToSel(page, '.calc__tabs');
  await page.locator('.presets__btn', { hasText: 'Busy commercial road' }).evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('#calc-kdb')).toHaveValue('70');
  await expect(page.locator('#calc-klb')).toHaveValue('4');
  await expect(page.locator('#calc-kdh')).toHaveValue('10');
  await expect(page.locator('#calc-P')).toHaveValue('30');
  await expect(result(page)).toContainText('2,400 m²');
});

test('step tabs follow the WAI-ARIA tabs pattern and ideas are a radio group', async ({ page }) => {
  await open(page);
  await scrollToSel(page, '.calc__tabs');
  await expect(page.locator('.calc__tabs [role="tab"][aria-selected="true"]')).toHaveAttribute('id', 'calc-tab-1');
  await page.locator('#calc-tab-1').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#calc-tab-2')).toBeFocused();
  await expect(page.locator('#calculator')).toHaveAttribute('data-step', '2');
  await expect(page.locator('[role="radiogroup"] input[type="radio"]')).toHaveCount(4);
  await page.locator('[data-idea="ruko"] input[type="radio"]').check({ force: true });
  await expect(page.locator('[data-idea="ruko"]')).toHaveAttribute('data-selected', 'true');
  await expect(result(page)).toContainText('Ruko');
});

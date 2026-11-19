import { test, expect } from '@playwright/test';
import { open, scrollToSel, decodeWa, calcStep } from './helpers.ts';

const BASE = 'https://wa.me/6282110106088?text=';
const hrefs = (page) => page.evaluate(() => [...document.querySelectorAll('a[data-wa]')].map((a) => (a as HTMLAnchorElement).href));

test('every WhatsApp link goes to the right number with a prefilled message', async ({ page }) => {
  await open(page);
  const links = await hrefs(page);
  expect(links.length).toBeGreaterThanOrEqual(4);
  for (const href of links) expect(href.startsWith(BASE)).toBe(true);
  // all buttons open in a new tab without handing over the opener
  const attrs = await page.evaluate(() => [...document.querySelectorAll('a[data-wa]')].map((a) => `${a.getAttribute('target')}|${a.getAttribute('rel')}`));
  for (const a of attrs) expect(a).toBe('_blank|noopener');
});

test('before the calculator is used the message is the generic one', async ({ page }) => {
  await open(page);
  const text = decodeWa((await hrefs(page))[0]);
  expect(text).toBe("Hi HOMYVEST! I have land or a building that isn't earning yet, and I'd like to know what it could become. Can we talk?");
});

test('after the calculator is used the message carries the results', async ({ page }) => {
  await open(page);
  await scrollToSel(page, '.calc__tabs');
  await page.locator('#calc-P').fill('30'); // same value, but the visitor has now used it
  await calcStep(page, 2);
  const text = decodeWa((await hrefs(page))[0]);
  expect(text).toContain('Hi HOMYVEST! I tried the land check on your website.');
  expect(text).toContain('30 × 20 m');
  expect(text).toContain('1,200 m²');
  expect(text).toContain('Kos-kosan (pays back in about 6.6 years)');
  // the closing block confirms that results will be included
  await expect(page.locator('.closing')).toContainText('Your land check results will be included.');
  // step 3 results join once the visitor edits a step 3 field
  await calcStep(page, 3);
  await page.locator('#calc-fp').fill('260'); // the visitor edits a step 3 field…
  await page.locator('#calc-fp').fill('240'); // …and settles on 240
  expect(decodeWa((await hrefs(page))[0])).toContain('Existing building: footprint 240 m², total floor area 480 m² (room for 3 more floors)');
});

test('in Indonesian the message starts with "Halo HOMYVEST"', async ({ page }) => {
  await open(page, 'lang=id');
  expect(decodeWa((await hrefs(page))[0]).startsWith('Halo HOMYVEST')).toBe(true);
  await scrollToSel(page, '.calc__tabs');
  await page.locator('#calc-L').fill('25');
  await page.locator('#calc-L').fill('20');
  const text = decodeWa((await hrefs(page))[0]);
  expect(text.startsWith('Halo HOMYVEST! Saya sudah mencoba cek lahan')).toBe(true);
  expect(text).toContain('1.200 m²');
});

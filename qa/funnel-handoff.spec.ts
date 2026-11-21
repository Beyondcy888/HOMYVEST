// The funnel on the build WITHOUT Supabase settings (:4173, U01_08 §2): sending hands over to WhatsApp with the
// answers written into the message, and nothing ever goes to supabase.co.
import { test, expect } from '@playwright/test';
import { decodeWa } from './helpers.ts';

test('with no Supabase settings, sending leads to the WhatsApp handoff', async ({ page }) => {
  const toSupabase: string[] = [];
  page.on('request', (r) => {
    if (/supabase\.co/.test(new URL(r.url()).hostname)) toSupabase.push(r.url());
  });
  await page.goto('/?nointro=1');
  await page.fill('#hero-phone', '0812 3456 7890');
  await page.click('#hero-continue');
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', '2');
  await page.locator('label.rcard:has(input[name="funding"][value="bank_loan"])').click();
  await page.locator('.funnel__primary').click();
  await page.fill('#f-name', 'Budi Santoso');
  await page.locator('label.fchip:has(input[name="owned"][value="vacant_land"])').click();
  await page.locator('label.fchip:has(input[name="build"][value="hybrid_stay"])').click();
  await page.locator('label.fchip:has(input[name="cities"][value="jakarta"])').click();
  await page.waitForTimeout(1600);
  await page.locator('.funnel__primary').click();
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', 'handoff');
  await expect(page.locator('#funnel-title')).toHaveText('Almost there: send your details on WhatsApp');
  const href = await page.locator('[data-handoff]').getAttribute('href');
  expect(href).toContain('wa.me/6282110106088?text=');
  const text = decodeWa(href!);
  expect(text).toContain('Budi Santoso');
  expect(text).toContain('Loan from bank / financial institution');
  expect(toSupabase).toEqual([]);
});

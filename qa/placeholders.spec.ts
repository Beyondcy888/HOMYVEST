// Counts the caption placeholders still on the page and writes them to qa/placeholders.json,
// so the report can list what the owner still needs to fill in. Never fails.
import { test } from '@playwright/test';
import fs from 'node:fs';
import { open } from './helpers.ts';

test.use({ reducedMotion: 'reduce' }); // static layout: every caption is in the DOM at once

test('list remaining caption placeholders', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one list is enough');
  await open(page);
  await page.waitForTimeout(500);
  const ids = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-placeholder="true"]')].map((el) => el.getAttribute('data-caption-for')))]);
  const all = await page.evaluate(() => document.querySelectorAll('[data-caption-for]').length);
  fs.writeFileSync('qa/placeholders.json', `${JSON.stringify({ generatedAt: new Date().toISOString(), captionsOnPage: all, placeholders: ids.length, images: ids.sort() }, null, 2)}\n`);
  console.log(`${ids.length} images still show a placeholder caption`);
});

// Counts the caption placeholders still showing on both pages and writes them to qa/placeholders.json,
// so the report can list what the owner still needs to fill in. Never fails.
import { test } from '@playwright/test';
import fs from 'node:fs';
import { open } from './helpers.ts';

test.use({ reducedMotion: 'reduce' }); // static layout: every caption is in the DOM at once

test('list remaining caption placeholders', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one list is enough');
  const collect = () =>
    page.evaluate(() => ({
      ids: [...new Set([...document.querySelectorAll('[data-placeholder="true"]')].map((el) => el.getAttribute('data-caption-for')))],
      all: [...new Set([...document.querySelectorAll('[data-caption-for]')].map((el) => el.getAttribute('data-caption-for')))],
    }));
  await open(page);
  await page.waitForTimeout(500);
  const home = await collect();
  await page.goto('/portofolio/?nointro=1');
  await page.waitForSelector('#beyond');
  await page.waitForTimeout(500);
  const pf = await collect();
  const ids = [...new Set([...home.ids, ...pf.ids])].filter(Boolean).sort();
  const all = new Set([...home.all, ...pf.all]).size;
  fs.writeFileSync(
    'qa/placeholders.json',
    `${JSON.stringify({ generatedAt: new Date().toISOString(), captionsOnPages: all, placeholders: ids.length, images: ids }, null, 2)}\n`,
  );
  console.log(`${ids.length} images still show a placeholder caption`);
});

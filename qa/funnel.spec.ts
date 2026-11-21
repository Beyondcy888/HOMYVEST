// The lead funnel against a FAKE Supabase (U01_08 §2). Runs on the :4174 build, made with a fake project URL and
// key passed through the environment only. Every request to it is intercepted here: nothing leaves the machine.
import { test, expect, type Page, type Route } from '@playwright/test';
import { decodeWa } from './helpers.ts';

const FAKE = 'https://e2e-fake.supabase.co';
test.use({ baseURL: 'http://localhost:4174' });

type Captured = { leads: any[]; starts: any[] };
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' };

/** Intercepts the two tables. `leads` decides the reply to a lead insert (default 201, empty body). */
async function mockSupabase(page: Page, leads?: (route: Route) => Promise<void>): Promise<Captured> {
  const seen: Captured = { leads: [], starts: [] };
  await page.route(`${FAKE}/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const url = req.url();
    const body = req.postDataJSON();
    if (url.includes('/rest/v1/lead_starts')) {
      seen.starts.push(body);
      return route.fulfill({ status: 201, headers: CORS, body: '' });
    }
    if (url.includes('/rest/v1/leads')) {
      seen.leads.push(body);
      if (leads) return leads(route);
      return route.fulfill({ status: 201, headers: CORS, body: '' });
    }
    return route.fulfill({ status: 404, headers: CORS, body: '{}' });
  });
  return seen;
}

const row = (body: any) => (Array.isArray(body) ? body[0] : body);

async function openFunnel(page: Page, query = '') {
  await page.goto(`/?nointro=1${query ? `&${query}` : ''}`);
  await page.evaluate(() => document.fonts.ready);
  await page.fill('#hero-phone', '0812 3456 7890');
  await page.click('#hero-continue');
  await expect(page.locator('.funnel')).toHaveAttribute('data-open', 'true');
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', '2');
}

async function choose(page: Page, funding: 'bank_loan' | 'personal_funds' | 'no_funds') {
  await page.locator(`label.rcard:has(input[name="funding"][value="${funding}"])`).click();
  await page.locator('.funnel__primary').click();
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', '3');
  // each new step's heading takes the focus
  await expect(page.locator('#funnel-title')).toBeFocused();
}

const chip = (page: Page, name: string, value: string) => page.locator(`label.fchip:has(input[name="${name}"][value="${value}"])`).click();

/** Real people never send within 1.5 s of opening the panel; the anti-bot check in submitLead relies on it. */
const humanPause = (page: Page) => page.waitForTimeout(1600);

test('an invalid number shows the error and the panel stays closed', async ({ page }) => {
  const seen = await mockSupabase(page);
  await page.goto('/?nointro=1');
  await page.fill('#hero-phone', '0812');
  await page.click('#hero-continue');
  await expect(page.locator('#hero-phone-error')).toContainText('valid Indonesian mobile number');
  await expect(page.locator('#hero-phone')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#hero-phone')).toBeFocused();
  expect(await page.locator('.funnel[data-open="true"]').count()).toBe(0);
  expect(seen.starts).toHaveLength(0);
});

test('a valid number opens step 2 and records one lead start', async ({ page }) => {
  const seen = await mockSupabase(page);
  await openFunnel(page);
  await expect(page.locator('#funnel-title')).toBeFocused();
  await expect(page.locator('.funnel__count')).toHaveText('Step 2 of 3');
  await expect.poll(() => seen.starts.length).toBe(1);
  expect(row(seen.starts[0])).toMatchObject({ phone: '+6281234567890', lang: 'en' });
  expect(row(seen.starts[0]).id).toMatch(/^[0-9a-f-]{36}$/);
});

test('path A: personal funds → build form → saved → thank you', async ({ page }) => {
  const seen = await mockSupabase(page);
  await openFunnel(page);
  await choose(page, 'personal_funds');
  // sending empty shows the field errors and moves the focus to the first one
  await page.locator('.funnel__primary').click();
  await expect(page.locator('#f-name-err')).toBeVisible();
  await expect(page.locator('#f-owned-err')).toBeVisible();
  await expect(page.locator('#f-build-err')).toBeVisible();
  await expect(page.locator('#f-cities-err')).toBeVisible();
  await expect(page.locator('#f-name')).toBeFocused();
  expect(seen.leads).toHaveLength(0);

  await page.fill('#f-name', 'Budi Santoso');
  await chip(page, 'owned', 'vacant_land');
  await chip(page, 'build', 'hybrid_stay');
  await chip(page, 'cities', 'bodetabek');
  await humanPause(page);
  await page.locator('.funnel__primary').click();
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', 'done');
  expect(seen.leads).toHaveLength(1);
  const body = row(seen.leads[0]);
  expect(body).toMatchObject({
    funding: 'personal_funds',
    owned_assets: ['vacant_land'],
    build_types: ['hybrid_stay'],
    cities: ['bodetabek'],
    need: null,
    phone: '+6281234567890',
    name: 'Budi Santoso',
    lang: 'en',
    calc: null, // the calculator was not used
  });
  expect(body.start_id).toBe(row(seen.starts[0]).id);
  await expect(page.locator('#funnel-title')).toContainText('Thank you, Budi.');
  const wa = await page.locator('.fresult a[data-wa]').getAttribute('href');
  expect(decodeWa(wa!)).toContain('Personal funds');
  // the hero now confirms instead of asking again
  await page.keyboard.press('Escape');
  await expect(page.locator('.phone--done')).toContainText("we'll be in touch at +62 812-3456-7890");
});

test('path B: no funds → needs form → saved', async ({ page }) => {
  const seen = await mockSupabase(page);
  await openFunnel(page);
  await choose(page, 'no_funds');
  await expect(page.locator('.fstep__intro')).toContainText('Plenty of owners start here.');
  await page.locator('label.rcard:has(input[name="need"][value="manage_kost"])').click();
  await page.fill('#f-name', 'Siti Aminah');
  await chip(page, 'cities', 'malang');
  await humanPause(page);
  await page.locator('.funnel__primary').click();
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', 'done');
  expect(row(seen.leads[0])).toMatchObject({ funding: 'no_funds', need: 'manage_kost', owned_assets: [], build_types: [], cities: ['malang'] });
});

test('a server error offers WhatsApp (prefilled) and Try again', async ({ page }) => {
  await mockSupabase(page, (route) => route.fulfill({ status: 500, headers: { ...CORS, 'content-type': 'application/json' }, body: '{"message":"boom"}' }));
  await openFunnel(page);
  await choose(page, 'bank_loan');
  await page.fill('#f-name', 'Budi Santoso');
  await chip(page, 'owned', 'house');
  await chip(page, 'build', 'kost');
  await chip(page, 'cities', 'jakarta');
  await humanPause(page);
  await page.locator('.funnel__primary').click();
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', 'error');
  const wa = await page.locator('[data-handoff]').getAttribute('href');
  expect(decodeWa(wa!)).toContain('Budi Santoso');
  expect(decodeWa(wa!)).toContain('Loan from bank / financial institution');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', '3');
  await expect(page.locator('#f-name')).toHaveValue('Budi Santoso'); // nothing was lost
});

test('the rate limit shows a friendly note with WhatsApp', async ({ page }) => {
  await mockSupabase(page, (route) =>
    route.fulfill({ status: 400, headers: { ...CORS, 'content-type': 'application/json' }, body: '{"message":"rate_limited","code":"P0001"}' }),
  );
  await openFunnel(page);
  await choose(page, 'personal_funds');
  await page.fill('#f-name', 'Budi Santoso');
  await chip(page, 'owned', 'vacant_land');
  await chip(page, 'build', 'not_sure');
  await chip(page, 'cities', 'bali');
  await humanPause(page);
  await page.locator('.funnel__primary').click();
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', 'rate');
  await expect(page.locator('#funnel-title')).toContainText("You've already sent this a few times.");
  await expect(page.locator('[data-handoff]')).toHaveAttribute('href', /wa\.me\/6282110106088\?text=/);
});

test('a reload in step 3 keeps the answers', async ({ page }) => {
  const seen = await mockSupabase(page);
  await openFunnel(page);
  await choose(page, 'personal_funds');
  await page.fill('#f-name', 'Budi Santoso');
  await chip(page, 'owned', 'unfinished_building');
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.locator('.funnel')).toHaveAttribute('data-open', 'true');
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', '3');
  await expect(page.locator('#f-name')).toHaveValue('Budi Santoso');
  await expect(page.locator('input[name="owned"][value="unfinished_building"]')).toBeChecked();
  // shown without the country code: the fixed +62 sits in front of the field
  await expect(page.locator('#hero-phone')).toHaveValue('812-3456-7890');
  // and it still sends (the restored opening time is not mistaken for a bot)
  await chip(page, 'build', 'kost');
  await chip(page, 'cities', 'solo');
  await humanPause(page);
  await page.locator('.funnel__primary').click();
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', 'done');
  expect(seen.leads).toHaveLength(1);
  expect(row(seen.leads[0])).toMatchObject({ owned_assets: ['unfinished_building'], build_types: ['kost'], cities: ['solo'] });
});

test('a used calculator comes along as a snapshot', async ({ page }) => {
  const seen = await mockSupabase(page);
  await page.goto('/?nointro=1');
  await page.locator('#calc-P').scrollIntoViewIfNeeded();
  await page.locator('#calc-P').fill('40');
  await page.locator('#calc-L').fill('25');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.fill('#hero-phone', '0812 3456 7890');
  await page.click('#hero-continue');
  await expect(page.locator('.funnel')).toHaveAttribute('data-open', 'true');
  await choose(page, 'personal_funds');
  await page.fill('#f-name', 'Budi Santoso');
  await chip(page, 'owned', 'vacant_land');
  await chip(page, 'build', 'kost');
  await chip(page, 'cities', 'bandung');
  await humanPause(page);
  await page.locator('.funnel__primary').click();
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', 'done');
  const calc = row(seen.leads[0]).calc;
  expect(calc).toMatchObject({ P: 40, L: 25, A: 1000 });
});

test('Esc closes the panel and the focus returns to Continue', async ({ page }) => {
  await mockSupabase(page);
  await openFunnel(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('.funnel')).toHaveAttribute('data-open', 'false');
  await expect(page.locator('#hero-continue')).toBeFocused();
  // reopening keeps the place
  await page.click('#hero-continue');
  await expect(page.locator('.funnel')).toHaveAttribute('data-step', '2');
});

test('in Indonesian the steps, options and chips are in Indonesian', async ({ page }) => {
  await mockSupabase(page);
  await openFunnel(page, 'lang=id');
  await expect(page.locator('.funnel__count')).toHaveText('Langkah 2 dari 3');
  await expect(page.locator('.rcards')).toContainText('Pinjaman bank / lembaga keuangan');
  await expect(page.locator('.rcards')).toContainText('Saat ini belum memiliki dana untuk pembangunan');
  await page.locator('label.rcard:has(input[name="funding"][value="personal_funds"])').click();
  await page.locator('.funnel__primary').click();
  await expect(page.locator('#funnel-title')).toHaveText('Ceritakan tentang properti Anda');
  await expect(page.locator('.fchips').first()).toContainText('Lahan kosong');
  await expect(page.locator('.funnel__primary')).toHaveText('Kirim');
});

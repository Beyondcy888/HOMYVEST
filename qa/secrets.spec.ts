// Secrets stay out of the repo (U01_08 §2). Node only: no browser is opened.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

test('.gitignore covers every secret file and the scanner passes on the whole repo', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'one run is enough');
  const ignore = fs.readFileSync('.gitignore', 'utf8').split(/\r?\n/).map((l) => l.trim());
  for (const rule of ['.env.*', '!.env.example', 'supabase/.env*', '*service-account*.json']) expect(ignore, rule).toContain(rule);
  // exits 0 when nothing looks like a secret (execFileSync throws otherwise)
  const out = execFileSync(process.execPath, ['scripts/check-secrets.mjs', '--all'], { encoding: 'utf8' });
  expect(out).toContain('Secret check passed');
});

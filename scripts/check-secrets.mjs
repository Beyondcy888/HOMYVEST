// Fails (exit 1) if staged (or all tracked) files contain secrets or secret files.
// Usage: node scripts/check-secrets.mjs --staged   (pre-commit)
//        node scripts/check-secrets.mjs --all      (whole repo audit)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const mode = process.argv.includes('--all') ? 'all' : 'staged';
const files = (mode === 'all'
  ? execSync('git ls-files', { encoding: 'utf8' })
  : execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' }))
  .split('\n').map((s) => s.trim()).filter(Boolean);

const SELF = path.normalize('scripts/check-secrets.mjs');

// File names that must never be committed
const BAD_NAMES = [
  /(^|\/)\.env(\.[^/]*)?$/,                 // .env, .env.local, .env.production …
  /(^|\/)supabase\/\.env[^/]*$/,            // supabase/.env.secrets
  /\.pem$/i, /\.p12$/i, /\.key$/i,
  /service[-_]?account[^/]*\.json$/i, /credentials[^/]*\.json$/i, /client_secret[^/]*\.json$/i,
];
const ALLOWED_NAMES = [/\.example$/i];

// Content patterns (built from parts so this file doesn't match itself)
const P = (...parts) => new RegExp(parts.join(''));
const BAD_CONTENT = [
  ['Supabase secret key', P('sb_', 'secret_', '[A-Za-z0-9_-]{16,}')],
  ['JWT (service_role or anon key)', P('eyJhbGciOi', '[A-Za-z0-9_-]{20,}\\.', '[A-Za-z0-9_-]{20,}')],
  ['Private key', P('-----BEGIN ', '(RSA |EC )?', 'PRIVATE KEY-----')],
  ['Google OAuth client secret', P('GOC', 'SPX-', '[A-Za-z0-9_-]{20,}')],
  ['Google refresh token', P('1\\/\\/0', '[A-Za-z0-9_-]{30,}')],
  ['Google service account JSON', P('"type"\\s*:\\s*"service', '_account"')],
  ['Filled secret variable', P('^(REPORT_WEBHOOK_SECRET|GOOGLE_CLIENT_SECRET|GOOGLE_REFRESH_TOKEN|GOOGLE_SERVICE_ACCOUNT_JSON_B64|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN)\\s*=\\s*\\S{8,}')],
];

const problems = [];
for (const f of files) {
  const norm = path.normalize(f);
  if (norm === SELF) continue;
  if (BAD_NAMES.some((r) => r.test(f)) && !ALLOWED_NAMES.some((r) => r.test(f))) {
    problems.push(`${f}: secret file must not be committed`);
    continue;
  }
  if (!fs.existsSync(f) || fs.statSync(f).size > 2_000_000) continue;
  const buf = fs.readFileSync(f);
  if (buf.includes(0)) continue;                         // binary
  const lines = buf.toString('utf8').split('\n');
  lines.forEach((line, i) => {
    for (const [name, re] of BAD_CONTENT) {
      if (re.test(line)) problems.push(`${f}:${i + 1}: looks like a ${name}`);
    }
  });
}

if (problems.length) {
  console.error('Secret check FAILED:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}
console.log(`Secret check passed (${files.length} ${mode} file${files.length === 1 ? '' : 's'}).`);

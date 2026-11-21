// One-time helper (run by the owner, on their own computer) to get a Google Drive refresh token
// for GDRIVE_AUTH_MODE=oauth. No dependencies.
//
//   npm run gdrive:auth            -> prints the refresh token
//   npm run gdrive:auth -- --write -> also writes it into supabase/.env.secrets
//
// Reads GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET from the environment or from supabase/.env.secrets.
// Scope: drive.file (the app can only see files and folders it created).
import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';

const SECRETS = 'supabase/.env.secrets';
const PORT = 53682;
const REDIRECT = `http://127.0.0.1:${PORT}/callback`;
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(fs.readFileSync(file, 'utf8').split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]));
}
const fileEnv = readEnvFile(SECRETS);
const clientId = process.env.GOOGLE_CLIENT_ID || fileEnv.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || fileEnv.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error(`Put GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in ${SECRETS} first (see HUMAN_SETUP, step B).`);
  process.exit(1);
}

const b64u = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const verifier = b64u(crypto.randomBytes(48));
const challenge = b64u(crypto.createHash('sha256').update(verifier).digest());
const state = b64u(crypto.randomBytes(16));

const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: clientId, redirect_uri: REDIRECT, response_type: 'code', scope: SCOPE,
  access_type: 'offline', prompt: 'consent', state, code_challenge: challenge, code_challenge_method: 'S256',
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (url.pathname !== '/callback') { res.writeHead(404).end(); return; }
  const done = (code, msg) => { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' }).end(`<p style="font:16px system-ui">${msg}</p>`); };
  if (url.searchParams.get('state') !== state) { done(400, 'State mismatch. Close this tab and run the command again.'); return; }
  const code = url.searchParams.get('code');
  if (!code) { done(400, `Google said: ${url.searchParams.get('error') ?? 'no code'}`); return; }
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: REDIRECT, grant_type: 'authorization_code', code_verifier: verifier }),
    });
    const json = await r.json();
    if (!json.refresh_token) throw new Error(JSON.stringify(json));
    done(200, 'Done. You can close this tab and go back to the terminal.');
    if (process.argv.includes('--write')) {
      let text = fs.existsSync(SECRETS) ? fs.readFileSync(SECRETS, 'utf8') : '';
      text = /^GOOGLE_REFRESH_TOKEN=.*$/m.test(text)
        ? text.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, `GOOGLE_REFRESH_TOKEN=${json.refresh_token}`)
        : `${text.trimEnd()}\nGOOGLE_REFRESH_TOKEN=${json.refresh_token}\n`;
      fs.writeFileSync(SECRETS, text);
      console.log(`\nSaved GOOGLE_REFRESH_TOKEN into ${SECRETS} (this file is git-ignored).`);
    } else {
      console.log(`\nYour refresh token (paste it into ${SECRETS} as GOOGLE_REFRESH_TOKEN, keep it private):\n\n${json.refresh_token}\n`);
    }
  } catch (e) {
    done(500, 'Token exchange failed. See the terminal.');
    console.error('Token exchange failed:', e.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Opening Google sign-in. Sign in with the account whose Google Drive should receive the reports.');
  console.log(`If the browser doesn't open, paste this link into it:\n\n${authUrl}\n`);
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
  exec(`${opener} "${authUrl}"`, () => {});
});

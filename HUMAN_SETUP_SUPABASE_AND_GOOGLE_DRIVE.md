# Connecting the form to Supabase and Google Drive (owner's guide)

Do this **once, after the agent has finished update U01**. It takes 30–45 minutes. Until it's done, the website still works: the form hands visitors over to WhatsApp with their answers prefilled.

**Golden rules for your keys**
- Paste keys only into the places named below: `.env.local`, `supabase/.env.secrets`, Supabase's dashboard, and your hosting provider's settings. **Never** paste them into chat, into docs, or into any other file.
- `.env.local` and `supabase/.env.secrets` are git-ignored, and a pre-commit check blocks keys from being committed. If a commit is blocked, the message tells you which file to remove.
- The only key that ever goes into the website is the **publishable (anon)** key. It's public by design, and the database only lets it *add* form entries.

---

## A. Supabase

**A1. Create the project.** At supabase.com → New project. Name it `homyvest` and choose region **Southeast Asia (Singapore)**, the closest to Indonesia. Save the database password in your password manager.

**A2. Website keys.** In the project, open **Connect**, or **Project Settings → API Keys / Data API**. Copy:
- the **Project URL** (`https://<project-ref>.supabase.co`)
- the **Publishable key** (`sb_publishable_…`). On older projects it's the **anon** key. Either works.

In the project folder, copy `.env.example` to **`.env.local`** and fill in:
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```
❌ Never use the `service_role` / secret key here.

**A3. Log in the command-line tool** (a terminal in the project folder):
```bash
npx supabase login                               # opens the browser
npx supabase link --project-ref <project-ref>    # asks for the database password from A1
```

**A4. Create the tables and the automation:**
```bash
npx supabase db push
```
If it complains about `pg_net` or `pg_cron`: in the dashboard, go to **Database → Extensions**, enable **pg_net** and **pg_cron**, then run `npx supabase db push` again.

**A5. Make the webhook secret.** This is a long random password that the database and the report function share:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output. You'll use it twice: in A6 and in A8.

**A6. Fill in the function secrets.** Copy `supabase/.env.secrets.example` to **`supabase/.env.secrets`**. Set `REPORT_WEBHOOK_SECRET` to the value from A5. Choose the report language (`REPORT_LANGUAGE=en` or `id`). Leave the Google lines for section B, then come back to A7.

**A7. Upload the secrets and deploy the function** (after section B is done):
```bash
npx supabase secrets set --env-file supabase/.env.secrets
npx supabase functions deploy generate-report --no-verify-jwt
```

**A8. Tell the database where the function is.** In the dashboard, open **SQL Editor** → New query. Paste this, replacing the two values, and run it:
```sql
select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/generate-report', 'report_function_url', 'HOMYVEST report function URL');
select vault.create_secret('<the secret from A5>', 'report_webhook_secret', 'HOMYVEST report webhook secret');
```
To change one later:
```sql
select vault.update_secret((select id from vault.secrets where name = 'report_webhook_secret'), '<new value>');
```
(If you change the webhook secret, also update it in `supabase/.env.secrets` and repeat the `secrets set` command.)

---

## B. Google Drive: pick ONE option

### Option 1: personal Gmail (most likely your case)
**B1.** Go to console.cloud.google.com → create a project called `HOMYVEST Leads`.

**B2.** Go to **APIs & Services → Library → Google Drive API → Enable**.

**B3.** Open **Google Auth Platform** (or "OAuth consent screen"):
- **Branding:** app name `HOMYVEST Leads`, your email as support and developer contact.
- **Audience:** User type **External**. Add your Gmail as a **test user**.
- **Data Access:** add the scope `https://www.googleapis.com/auth/drive.file`. It only lets the app see files it creates itself.
- Back on **Audience**, click **Publish app** so it's "In production". Otherwise Google expires the sign-in after 7 days. With this limited scope, no Google review is needed.

**B4.** Go to **Clients → Create client → Application type: Desktop app** → Create. Copy the **Client ID** and **Client secret** into `supabase/.env.secrets`:
```
GDRIVE_AUTH_MODE=oauth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
```

**B5.** Get the refresh token (it's a one-time sign-in):
```bash
npm run gdrive:auth -- --write
```
A browser opens. Sign in with **the Google account whose Drive should receive the reports**. Google may say "Google hasn't verified this app": choose **Advanced → Go to HOMYVEST Leads**. It's your own app. The token is saved into `supabase/.env.secrets`.

**B6.** Leave `GDRIVE_FOLDER_ID` empty. On the first report, a folder named **"HOMYVEST Leads"** is created in your My Drive, and every report lands there. To rename it, change `GDRIVE_FOLDER_NAME` before the first report.

### Option 2: Google Workspace with a Shared Drive
**B1–B2** as above. Then:
- **IAM & Admin → Service Accounts → Create**, named `homyvest-reports`. Open it → **Keys → Add key → JSON**. A file downloads. Keep it **outside** the project folder, and never commit it. (If your organisation blocks key creation, ask your Workspace admin, or use Option 1.)
- In Google Drive, open your **Shared Drive** → create a folder `HOMYVEST Leads` → **Share** it with the service account's email as **Content manager**. Copy the folder ID: the part after `/folders/` in its URL.
- Turn the key into one line:
  ```bash
  node -e "console.log(Buffer.from(require('fs').readFileSync('PATH/TO/key.json')).toString('base64'))"
  ```
- In `supabase/.env.secrets`:
  ```
  GDRIVE_AUTH_MODE=service_account
  GOOGLE_SERVICE_ACCOUNT_JSON_B64=<the long line>
  GDRIVE_FOLDER_ID=<folder id>
  ```
- Then delete the downloaded JSON file, or store it in a password manager.

Now go back and do **A7** and **A8**.

---

## C. Test it
1. `npm run dev`, open http://localhost:5173, enter your own number, and complete the form.
2. Supabase → **Table Editor → leads**: your row appears. Within about 30 seconds, `report_status` becomes `done` and `report_url` holds the Drive link.
3. Open Google Drive → **HOMYVEST Leads**: the PDF is there.
4. If the status is `failed`, read `report_error` in the row and check **Edge Functions → generate-report → Logs**. The troubleshooting table is in `docs/REPORT_U01.md`. Failed reports retry automatically every 10 minutes (up to 5 times).
5. Delete your test rows afterwards (Table Editor → select → delete).

## D. Going live
- On your hosting provider (Vercel or Netlify), add the two variables from A2 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) in the project's **Environment Variables**, then redeploy.
- Before pushing to GitHub, check `git status`. It must **not** list `.env.local` or `supabase/.env.secrets`. Also check `git config core.hooksPath`, which should print `.githooks`.

## E. Day-to-day
- **New leads:** Table Editor → `leads` (newest first), or the PDFs in Drive. Phone numbers that started the form but didn't finish are in `lead_starts`.
- **Re-send a report:** set the row's `report_status` to `pending` and `report_attempts` to `0`. It's retried within 10 minutes.
- **If a key leaks:** rotate it. Create a new Google client secret or key, or a new webhook secret. Update `supabase/.env.secrets`, run `npx supabase secrets set --env-file supabase/.env.secrets`, and update Vault (A8) for the webhook secret.

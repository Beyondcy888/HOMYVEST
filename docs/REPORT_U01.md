# Update U01 report

2026-11-21 · Commits: `e898d19` (U1) → see `git log --oneline e898d19~1..HEAD`. Task list: `tasklist-update2.md`. Decisions: `docs/DECISIONS.md` (U01-D1 …).

## What changed

### Main page (`/`), in the new order
1. **Hero + lead funnel (`#top`).**
   - **Left column:**
     - "In partnership with" with the HomyEight and Behomy logos
     - the headline ("Turn idle land into steady income. / Built by HomyEight, operated by Behomy.")
     - the phone field with a fixed +62
     - the free WhatsApp consultation
   - **Right:** the dusk photo with the 82% occupancy chip.
2. **What is HOMYVEST? (`#about`):** a short paragraph.
3. **End-to-end (`#how`):** Plan · Design · Build · Operate. A photo each, who does what, and a hairline that draws through the numbers. This replaces the old Team section.
4. **Behomy (`#behomy`):**
   - a new full-bleed Behomy hero
   - the hybrid diagram (unchanged)
   - five stats, including the estimated break-even (< 3.5 years, with footnote 4)
   - what Behomy takes off your hands, with the training photo
   - "Places Behomy runs today" (a mosaic with brand captions)
   - "From idle to running" (four before/after pairs)
   - the team photo
5. **Projects (`#projects`):** no filters. All 13 images in the curated order, each revealed as it scrolls in.
6. **Land check (`#calculator`):** formulas, defaults and rounding unchanged. The doors are gone, and "Land check" links always open step 1.
7. **What happens next (`#next`), ending in "Ready when you are":**
   - the big **See our full portfolio** card
   - WhatsApp
   - "Leave your number", which goes back to the phone field
8. **FAQ:** question 2 replaced, plus a new last question about what happens to the details sent.
9. **Footer:** partner logos and a Portfolio link.

**Removed:** the doors ("Which one sounds like you?" and "Here's who does the work."), Team, and the HomyEight intro ("Built by HomyEight / Drawn with care…"). Their components, styles, copy keys and tests are deleted.

### Portfolio page (`/portofolio/`)
PORTFOLIO-SECTION

### Lead funnel
1. **Phone (step 1 of 3).** Accepts 0812…, 812… or a pasted +62…. A valid number opens the panel and records the number in `lead_starts` (fire and forget).
2. **Funding (step 2 of 3).** Three options.
3. **Details (step 3 of 3).**
   - With a bank loan or personal funds: name, what you own, what you'd like to build, and where.
   - Without construction funds: a short reassurance, the main need, name and where.
4. **Send.** The answers are saved to Supabase, then a thank-you with WhatsApp, the land check and the portfolio.
   - **If saving isn't configured:** the visitor is handed over to WhatsApp with every answer already written in the message.
   - **If saving fails:** WhatsApp or "Try again".
   - **Rate limit:** a friendly note.
- **Answers survive closing and reloading** (until sent).
- **Panel:** a right-side sheet on desktop, full screen on phones with the button kept above the keyboard.
- **Accessibility:** keyboard and screen-reader friendly, in both languages.

### Backend files (prepared, not deployed)
`supabase/` holds the kit, unchanged:
- **The migration:** tables, checks, insert-only security, rate limits, and a trigger that asks the report function for a PDF.
- **The `generate-report` function:** a PDF lead report uploaded to Google Drive.
- **`config.toml`.**

The 34 lead tests pass. The sample reports in English and Indonesian were rendered and checked.

### Mobile pass
- **Phones (< 768 px):**
  - 56 px header, tighter section spacing, capped headline sizes, and a menu that fits all six links
  - no horizontal scroll at 360 px
  - the phone field and funnel checked at 360, 390, 414, 768 and 844 × 390, in light and dark, English and Indonesian
- **Desktop (1440 px):** screenshots before and after the pass are identical.

## How to try it
```
npm run dev   →  http://localhost:5173/  and  http://localhost:5173/portofolio/
```
- `npm run dev` uses your Supabase project: the URL and publishable key you gave are in the git-ignored `.env.development.local`.
- **Your database has no tables yet.** I checked with one read-only request: the key works, and the `leads` table doesn't exist. So until you finish the setup, sending the form on `npm run dev` shows "We couldn't send your details just now" and offers WhatsApp with the answers filled in. That's expected.
- A normal `npm run build` has no Supabase settings, so it hands visitors over to WhatsApp.

## Smoothness (portfolio page)
SMOOTHNESS-SECTION

## Load (main page)
| Measure | Result | Budget |
|---|---|---|
| First-load JavaScript, gzip (main page) | 172.4 KB (was 184.8 before the two fixes below) | ≤ 180 KB |
| LCP, mobile 4G, CPU ×4 (hero photo) | 1.2–1.7 s | ≤ 2.5 s |
| CLS | ≤ 0.003 | ≤ 0.05 |
| 3D scene chunks or posters requested on `/` | none (checked by `qa/main-flow.spec.ts`) | none |

Two things brought the first load under budget:
- **The land check's interface is its own chunk,** fetched right after the first paint.
- **The media manifest is sent to the browser in a slimmer form** with identical values.

The Supabase client and the funnel panel load only when someone starts the form.

## Needs you (in this order)
1. **Follow `HUMAN_SETUP_SUPABASE_AND_GOOGLE_DRIVE.md`** (about 30–45 minutes, once):
   - **A3–A4:** `npx supabase login`, `link` and `db push`. This creates the tables.
   - **A5–A8:** the webhook secret, the function secrets and deploy, and the two Vault secrets.
   - **B:** Google Drive, option 1 (personal Gmail) or option 2 (Workspace).
   - **C:** test it.

   Your URL and publishable key are already in `.env.development.local` for `npm run dev`. Step A2 is done for development. Never put the service-role key anywhere in the website.
2. **Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`** to your hosting provider's environment settings (Vercel or Netlify), then redeploy. Without them, the live site keeps handing visitors over to WhatsApp.
3. **Confirm the photo captions:**
   - **Before/after pairs** (`src/content/behomy.js`): the project names and cities. Pair 4's "after" shows "Behomy Metropolim" on the building.
   - **Behomy facades and corridor:** the project names.
   - **The team photo:** U01 captions it "The Behomy team", but its banner reads "Homy Group".
4. **Check the rights to two before/after photos.** Pairs 3 and 4 "before" are Google Street View captures; 4 shows the "Google Maps" watermark. Using them may need attribution or a replacement.
5. **Captions still pending from the first build:** the project names, places and years in `src/content/projects.js`. `qa/placeholders.json` lists every image that still shows "Project Name".
6. **Domain:** replace `homyvest.example` (canonical URLs, sitemap, robots.txt, OG tags).
7. **Optional:** pairs 3/4 and the staff-training photo show third-party signs and phone numbers, and some photos show identifiable people (including a toddler in the team photo). Make sure you have consent to publish them.

## Troubleshooting
| Symptom | Likely cause | Fix |
|---|---|---|
| Form always goes to WhatsApp | `VITE_SUPABASE_*` missing at build time | Add them to `.env.local` / host settings and rebuild |
| Form says "We couldn't send your details just now" | Supabase is configured but the tables don't exist yet (setup A3–A4 not done) | Run `npx supabase db push` (setup A4) |
| Row saved but `report_status` stays `pending` | Vault secrets missing, or function not deployed | Setup step A8 / A7. The cron retries within 10 minutes |
| `report_status = failed`, error mentions `invalid_grant` | Refresh token revoked or expired (app left in "Testing") | Publish the OAuth app, re-run `npm run gdrive:auth`, update the secret |
| Error mentions `storageQuotaExceeded` / `Service Accounts do not have storage quota` | Service account pointed at a personal Drive | Use `oauth` mode, or a Shared Drive folder |
| Error mentions `File not found` for the folder | `GDRIVE_FOLDER_ID` not created by this app (oauth) or not shared with the service account | oauth: leave `GDRIVE_FOLDER_ID` empty. Service account: share the folder as Content manager |
| Need to re-send a report | Any | In the Supabase table editor, set `report_status` to `pending` and `report_attempts` to `0`. The cron picks it up |

## Tests
TESTS-SECTION

## Decisions worth knowing
- **Your keys (U01-D1):** they are used by `npm run dev` only. Production builds take them from the host settings. Tests never use them: they run on two builds, one with no settings and one with a fake project whose every request is intercepted.
- **The logo intro (U01-D3):** it still opens the main page, but not on the portfolio page or on deep links (`/#calculator`, `/?focus=phone`).
- **The hero headline (U01-D6):** sized to its column rather than the full display size, so the phone field stays above the fold.
- **The Behomy logo (U01-D7):** drawn larger than HomyEight's when the two sit side by side, so they look the same size.
- **The portfolio card (U01-D8):** its thumbnails are library images, not the 3D posters, so the main page loads nothing from the portfolio until you hover it.
- **Small photos (U01-D10):** never shown wider than half their pixels.
- **Form safety (U01-D11):** the hidden anti-spam field is also invisible to browser autofill, so a real visitor's autofill can't get their lead dropped.
- **The PDF report:** it uses a standard font. Emoji or non-Latin characters in a name print as "?"; Indonesian names are fine.
- **Redirects (U01-D13):** `/portfolio` and `/portofolio` redirect to `/portofolio/`. On Netlify only the English-spelling rule is needed.

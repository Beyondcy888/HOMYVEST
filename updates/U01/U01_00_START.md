# Update U01: Streamline the main page, add the lead funnel, move the showpieces to /portofolio

This update changes an existing, finished build. Everything in `docs/` still applies **except where this update says otherwise**. When they conflict, **this update wins**. At the end, you edit `docs/` so it describes the new truth (U9).

---

## Part A: For the human (before launching)

1. **Copy everything in this kit into the project root**, merging folders. You'll get: `updates/U01/`, `HUMAN_SETUP_SUPABASE_AND_GOOGLE_DRIVE.md`, `assets-src/` (logos and photos), `supabase/`, `scripts/` (2 new files), `reference/leads/`, `.env.example`, `.githooks/`.
2. **No credentials are needed for this run.** The agent builds everything, including the database schema, the PDF report and the Drive upload function. Until you connect Supabase, the form hands visitors over to WhatsApp, so no lead is lost. **Don't put keys in the chat or in any file the agent creates.**
3. Open Claude Code in the project folder and paste:

> Read updates/U01/U01_00_START.md and apply update U01 end to end, following every U01 document in order. Work autonomously and don't wait for me. Never read, print or commit secret files. Log progress in docs/PROGRESS.md, decisions in docs/DECISIONS.md, and finish with docs/REPORT_U01.md.

4. When it's done, follow **`HUMAN_SETUP_SUPABASE_AND_GOOGLE_DRIVE.md`** (about 30–45 minutes, once). That's where your Supabase and Google Drive credentials go: into git-ignored files and Supabase's own secret store, never into GitHub.

---

## Part B: For the agent

### B1. What changes, in one look
**Main page (`/`), new order:**
1. **Hero + lead funnel**: tagline including "operated by Behomy", small partner line (HomyEight + Behomy logos), phone number field, free-consultation WhatsApp link. After the phone number: a funding question with 3 options, then one of two forms. Submissions are saved to Supabase.
2. **What is HOMYVEST?**: a short paragraph.
3. **End-to-end**: Plan · Design · Build · Operate, with a photo each. This absorbs the old "Three names, one team" section, with rewritten copy.
4. **Behomy hero** (new) + the existing Behomy section (hybrid diagram animation, stats with the new break-even estimate) + Behomy portfolio photos + before/after pairs.
5. **Projects**: no filters. Everything reveals as you scroll.
6. **Land check** (calculator, logic unchanged).
7. **What happens next** → **Ready when you are**, with a big **"See our full portfolio"** button.
8. **FAQ** (updated). 9. Footer.

**Full portfolio (`/portofolio/`), new page:**
1. Story (the old 3D hero story) → 2. Maxone walkthrough → 3. Padel assembly → 4. Beyond stays (mini soccer incl. `athero-1`, café, office) in landscape → closing CTA.
All three animations get **much longer scroll distances** so they move slower and stay smooth (U01_04).

**Deleted:** the "Which one sounds like you?" doors section (with its "Here's who does the work." line) and the "Built by HomyEight / Drawn with care…" intro block. The **Team** section is merged into End-to-end.

**Backend:** Supabase tables + security + a database trigger that calls an Edge Function, which builds a **PDF lead report** and uploads it to **Google Drive**. All code is provided and tested in this kit (U01_03).

### B2. Rules (in addition to CLAUDE.md)
1. **Secrets.** Never create, read, print, log or commit real credentials. Never open `.env.local`, `supabase/.env.secrets` or any `*.json` key file, even if they exist. Use only the `*.example` files. Run `node scripts/check-secrets.mjs --all` before every commit; it must pass. Install the pre-commit hook (U1).
2. **Don't deploy the backend.** Don't run `supabase login`, `link`, `db push`, `secrets set` or `functions deploy`. The human does that via the setup guide. You prepare and verify locally.
3. **Don't break the animations.** Story, Maxone and padel keep their choreography (the beat ranges in progress units). Only their scroll distances, smoothing and mobile framing change.
4. **Calculator formulas stay locked** (`docs/05`). Only its entry points change.
5. **Facts:** only `docs/02` §6 plus the new rows in U01_06 §0 (break-even estimate, brand captions).
6. **Copy:** use U01_06 verbatim in both languages (small fit edits allowed, logged).
7. Fallback-first, reduced motion, no-WebGL and accessibility rules from `docs/` still apply to every new section.
8. Commit after each milestone (`U1: …`).

### B3. Milestones (in order)
| # | Milestone | Doc | Exit check |
|---|---|---|---|
| U1 | Setup: place the kit files, install `@supabase/supabase-js` and dev `pdf-lib`, update `.gitignore`, install the git hook, add npm scripts, add the Vitest alias, set up multi-page Vite | U01_03 §7–8, U01_01 §6 | `npm run dev` serves `/` and `/portofolio/`; `npm run test` green; `node scripts/check-secrets.mjs --all` passes |
| U2 | Assets: logos into the app, new photos through the optimizer, depth maps for the new photos | U01_07 | Manifest includes the `photos/*` group; logos render crisp in both themes |
| U3 | Portfolio page: move Story, Maxone, Padel and Beyond; new scroll config and smoothness work | U01_04 | All three scenes play fully on `/portofolio/` with the new lengths; p95 frame time within budget |
| U4 | Main page restructure: new order, deletions, Behomy hero + portfolio + before/after, Projects without filters, portfolio button | U01_01 | Section order exactly as B1; deleted sections gone; no dead anchors |
| U5 | Lead funnel UI + data layer (`src/lib/leads/`) + Supabase client with graceful fallback | U01_02 | Both funnel paths work end to end with a mocked Supabase; WhatsApp fallback works with no env vars |
| U6 | Backend files in place and verified locally (tests, sample PDFs rendered and inspected) | U01_03 | Lead tests (34) green; `qa/tmp/sample-report-*.pdf` look right |
| U7 | Mobile pass across both pages | U01_05 | Screenshots at 360/390/414 px wide reviewed and fixed |
| U8 | QA: e2e specs updated and added, screenshots, performance | U01_08 | All specs pass on desktop + mobile |
| U9 | Docs sync + `CLAUDE.md` additions + `docs/REPORT_U01.md` | U01_08 §5 | `docs/` describes the new site; report lists what the human must do |

### B4. Definition of done
- `/` matches B1 in order and content in EN and ID. `/portofolio/` matches B1. Both work at 360 px and up, in both themes, with reduced motion and without WebGL.
- The funnel saves to Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set, and falls back to WhatsApp (answers prefilled) when they aren't set or saving fails.
- `supabase/` contains the migration, `config.toml` and the `generate-report` function, unchanged from the kit unless a bug was found (log it).
- No secret is in the repo (`check-secrets --all` passes), and `.gitignore` covers every secret file.
- Tests, typecheck, build and e2e all pass.
- `docs/REPORT_U01.md` exists and points the owner to `HUMAN_SETUP_SUPABASE_AND_GOOGLE_DRIVE.md`.

### B5. Convention for future updates
Add this to `CLAUDE.md` (U9):
> **Updates.** Owner updates live in `updates/Uxx/` and start at `Uxx_00_START.md`. Apply them in number order. An update overrides `docs/` where they conflict. After applying it, edit `docs/` so it describes the current site, log changes in `docs/DECISIONS.md`, and write `docs/REPORT_Uxx.md`.
> **Secrets.** Never read, print or commit `.env*` (except `*.example`), `supabase/.env*`, or key files. Run `node scripts/check-secrets.mjs --all` before committing.

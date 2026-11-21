# HOMYVEST — Update 2 (U01) task list

**How to read this:** `[x]` done · `[~]` in progress · `[ ]` not started · `[!]` blocked / shipped differently (see note).
Instructions: `updates/U01/U01_00_START.md` (delivered in `update2/`). Detailed log: `docs/PROGRESS.md` · decisions: `docs/DECISIONS.md` · final report: `docs/REPORT_U01.md`.

**To resume after an interrupted session:** open Claude Code in this folder and say
"Resume update 2 from tasklist-update2.md and docs/PROGRESS.md." The next unchecked item below is where to continue.

- Started: 2026-11-21 (WIB)
- Supabase: project URL + publishable key received from the owner → written only to the git-ignored `.env.development.local` (see DECISIONS U01-D1). Backend deploy is the owner's step (HUMAN_SETUP guide).

---

## U1 — Setup
- [x] Place the kit in the project root (`updates/U01/`, `HUMAN_SETUP_…md`, `assets-src/`, `supabase/`, `scripts/check-secrets.mjs`, `scripts/gdrive-auth.mjs`, `reference/leads/`, `.env.example`, `.githooks/`)
- [x] Install `@supabase/supabase-js`, dev `pdf-lib@1.17.1`, dev `supabase`
- [x] `.gitignore` secrets block (+ `dist-e2e/`, `update2/`), `git rm --cached` safety
- [x] Git hook (`core.hooksPath .githooks`) + verify it blocks a fake token
- [x] npm scripts (`check:secrets`, `gdrive:auth`, `supabase:deploy`)
- [x] Vitest alias + tsconfig (`paths`, `exclude supabase/functions`)
- [x] Multi-page Vite (`portofolio/index.html`, `src/portfolio-main.jsx`, shared `SiteShell`)
- [x] Owner's Supabase URL + publishable key in `.env.development.local` (git-ignored)
- [x] Exit check: dev serves `/` and `/portofolio/`; `npm run test` green; `check-secrets --all` passes
- [x] Commit `U1`

## U2 — Assets
- [x] Logos → `src/assets/logos/` + display versions (PNG + WebP, 96 px / 120 px tall)
- [x] Optimizer: `photos` group; depth script: `photos` group + excludes
- [x] Run optimizer (manifest gains 25 `photos/*`) and depth maps
- [x] Captions for Behomy photos (`src/content/behomy.js`), alt text EN + ID
- [x] Logos crisp in both themes (checked on light and dark backgrounds; in-page check in U7)
- [x] Commit `U2`

## U3 — Portfolio page (`/portofolio/`) — being built by a helper agent on branch `u3-portfolio` (worktree ../HOMYVEST-u3)
- [x] `src/content/scroll-config.js` (SCROLL + SMOOTH) + test (done in U1)
- [ ] Portfolio page: intro + index, Story, dividers, Maxone, Padel, Beyond (landscape), closing CTA
- [ ] Story beat-5 CTA → `/#calculator`; headings h2; skip links incl. "Skip padel hall"
- [ ] Pins read SCROLL; ScrollTrigger settings; Lenis lerp/wheel for portfolio
- [ ] Smoothness: damp times from SMOOTH, warm-up, pause off-screen canvases, DPR caps
- [ ] Beyond: landscape panels (desktop pin, tablet stack, mobile cards), athero-1, lightbox
- [ ] Measure frame times (before/after)
- [ ] Commit `U3`

## U4 — Main page restructure
- [x] Delete doors, Team, HomyEight intro, Story/Maxone/Padel/Beyond from `/` (components, styles, keys, tests) — HomyEight intro files deleted after the U3 merge
- [x] Hero + lead funnel shell (`#top`)
- [x] `#about` short; `#how` End-to-end (4 steps + closing line)
- [x] `#behomy`: Behomy hero, 5 stats, staff training, portfolio mosaic, before/after, team photo
- [x] `#projects` without filters, curated order, reveals
- [x] Calculator: door entry logic removed
- [x] `#next` closing with portfolio card, WhatsApp, "Leave your number"
- [x] FAQ updated; footer Portfolio link + logos; header nav + `?focus=phone`
- [x] Redirects (vercel/netlify), sitemap
- [x] Commit `U4` (9c53041, with U5)

## U5 — Lead funnel
- [x] `src/lib/leads/leads.ts` + test (verbatim), `supabase.ts` (lazy)
- [x] Hero phone step (normalize, error, lead_starts fire-and-forget)
- [x] Panel (dialog, focus trap, Esc, lenis stop, sessionStorage, recap, cross-slide)
- [x] Step 2 funding; Step 3A build; Step 3B needs; honeypot; consent
- [x] Send + results (thank you / handoff / error / rate limit / spam)
- [x] Mobile sheet + sticky footer above keyboard
- [x] Commit `U5` (9c53041)

## U6 — Backend verified locally
- [x] 34 lead tests green
- [x] Sample PDFs rendered and inspected (EN + ID)
- [x] Commit `U6` (nothing to change: the kit files are as delivered; verified with the 34 tests + rendered PDFs)

## U7 — Mobile pass
- [ ] Desktop 1440 screenshots before/after
- [ ] 360 / 390 / 414 / 768 / 844×390, light + dark, EN + ID; funnel states; Maxone S1/S3/S5
- [ ] Fixes + re-shoot
- [ ] Commit `U7`

## U8 — QA
- [x] Playwright: second web server (fake Supabase env), specs removed/updated/added (5e42c49; portfolio.spec comes with U3)
- [ ] `npm run test`, `typecheck`, `build`, `e2e` all pass
- [ ] Screenshots reviewed; performance (LCP, CLS, initial JS, frame times)
- [ ] Originals in `renders/` and `assets-src/` untouched
- [ ] Commit `U8`

## U9 — Docs sync + report
- [ ] `CLAUDE.md` (Updates + Secrets rules), `docs/02…10` synced, DECISIONS logged
- [ ] `docs/REPORT_U01.md`
- [ ] Commit `U9`

---
## Session log
- Session 1: 2026-11-21 — read all U01 docs and the kit; U1 committed (e898d19). U2 assets and U3 portfolio running as helper agents; main session on U4/U5.

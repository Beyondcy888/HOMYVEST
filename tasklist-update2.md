# HOMYVEST — Update 2 (U01) task list

**How to read this:** `[x]` done · `[~]` in progress · `[ ]` not started · `[!]` blocked / shipped differently (see note).
Instructions: `updates/U01/U01_00_START.md` (delivered in `update2/`). Detailed log: `docs/PROGRESS.md` · decisions: `docs/DECISIONS.md` · final report: `docs/REPORT_U01.md`.

**To resume after an interrupted session:** open Claude Code in this folder and say
"Resume update 2 from tasklist-update2.md and docs/PROGRESS.md." The next unchecked item below is where to continue.

- Started: 2026-11-21 (WIB)
- Supabase: project URL + publishable key received from the owner → written only to the git-ignored `.env.development.local` (see DECISIONS U01-D1). Backend deploy is the owner's step (HUMAN_SETUP guide).

---

## U1 — Setup
- [ ] Place the kit in the project root (`updates/U01/`, `HUMAN_SETUP_…md`, `assets-src/`, `supabase/`, `scripts/check-secrets.mjs`, `scripts/gdrive-auth.mjs`, `reference/leads/`, `.env.example`, `.githooks/`)
- [ ] Install `@supabase/supabase-js`, dev `pdf-lib@1.17.1`, dev `supabase`
- [ ] `.gitignore` secrets block (+ `dist-e2e/`, `update2/`), `git rm --cached` safety
- [ ] Git hook (`core.hooksPath .githooks`) + verify it blocks a fake token
- [ ] npm scripts (`check:secrets`, `gdrive:auth`, `supabase:deploy`)
- [ ] Vitest alias + tsconfig (`paths`, `exclude supabase/functions`)
- [ ] Multi-page Vite (`portofolio/index.html`, `src/portfolio-main.jsx`, shared `SiteShell`)
- [ ] Owner's Supabase URL + publishable key in `.env.development.local` (git-ignored)
- [ ] Exit check: dev serves `/` and `/portofolio/`; `npm run test` green; `check-secrets --all` passes
- [ ] Commit `U1`

## U2 — Assets
- [ ] Logos → `src/assets/logos/` + display versions (PNG + WebP, 96 px / 120 px tall)
- [ ] Optimizer: `photos` group; depth script: `photos` group + excludes
- [ ] Run optimizer (manifest gains 25 `photos/*`) and depth maps
- [ ] Captions for Behomy photos (`src/content/behomy.js`), alt text EN + ID
- [ ] Logos crisp in both themes (checked)
- [ ] Commit `U2`

## U3 — Portfolio page (`/portofolio/`)
- [ ] `src/content/scroll-config.js` (SCROLL + SMOOTH) + test
- [ ] Portfolio page: intro + index, Story, dividers, Maxone, Padel, Beyond (landscape), closing CTA
- [ ] Story beat-5 CTA → `/#calculator`; headings h2; skip links incl. "Skip padel hall"
- [ ] Pins read SCROLL; ScrollTrigger settings; Lenis lerp/wheel for portfolio
- [ ] Smoothness: damp times from SMOOTH, warm-up, pause off-screen canvases, DPR caps
- [ ] Beyond: landscape panels (desktop pin, tablet stack, mobile cards), athero-1, lightbox
- [ ] Measure frame times (before/after)
- [ ] Commit `U3`

## U4 — Main page restructure
- [ ] Delete doors, Team, HomyEight intro, Story/Maxone/Padel/Beyond from `/` (components, styles, keys, tests)
- [ ] Hero + lead funnel shell (`#top`)
- [ ] `#about` short; `#how` End-to-end (4 steps + closing line)
- [ ] `#behomy`: Behomy hero, 5 stats, staff training, portfolio mosaic, before/after, team photo
- [ ] `#projects` without filters, curated order, reveals
- [ ] Calculator: door entry logic removed
- [ ] `#next` closing with portfolio card, WhatsApp, "Leave your number"
- [ ] FAQ updated; footer Portfolio link + logos; header nav + `?focus=phone`
- [ ] Redirects (vercel/netlify), sitemap
- [ ] Commit `U4`

## U5 — Lead funnel
- [ ] `src/lib/leads/leads.ts` + test (verbatim), `supabase.ts` (lazy)
- [ ] Hero phone step (normalize, error, lead_starts fire-and-forget)
- [ ] Panel (dialog, focus trap, Esc, lenis stop, sessionStorage, recap, cross-slide)
- [ ] Step 2 funding; Step 3A build; Step 3B needs; honeypot; consent
- [ ] Send + results (thank you / handoff / error / rate limit / spam)
- [ ] Mobile sheet + sticky footer above keyboard
- [ ] Commit `U5`

## U6 — Backend verified locally
- [ ] 34 lead tests green
- [ ] Sample PDFs rendered and inspected (EN + ID)
- [ ] Commit `U6`

## U7 — Mobile pass
- [ ] Desktop 1440 screenshots before/after
- [ ] 360 / 390 / 414 / 768 / 844×390, light + dark, EN + ID; funnel states; Maxone S1/S3/S5
- [ ] Fixes + re-shoot
- [ ] Commit `U7`

## U8 — QA
- [ ] Playwright: second web server (fake Supabase env), specs removed/updated/added
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
- Session 1: 2026-11-21 — read all U01 docs and the kit; oriented in the codebase.

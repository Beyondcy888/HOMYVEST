# 10 — QA and launch (Milestone M11, plus checks during every milestone)

## 1. Commands
```bash
npm run test            # Vitest: calc engine, geometry, formatters, WhatsApp, leads (34), scroll config (must be 100% green)
npm run typecheck       # TypeScript (src, qa and the configs; supabase/functions excluded)
npm run build           # production build: dist/index.html and dist/portofolio/index.html
npm run e2e             # Playwright: builds and serves :4173 and :4174 (§2), runs qa/*.spec.ts on desktop + mobile
npm run shots           # Playwright: regenerates screenshots into qa/screenshots/
node scripts/check-secrets.mjs --all   # (= npm run check:secrets) before every commit; must pass
```
Run `npm run test` from PowerShell, cmd or the VS Code terminal, not Git Bash (DECISIONS D16).

## 2. Playwright specs (all in `qa/`)
### Two builds, two web servers
`playwright.config.ts` starts two preview servers, so both funnel outcomes are tested without real credentials (DECISIONS U01-D15):
- **`:4173`**: `npm run build && npm run preview`, with `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_ANON_KEY` explicitly blank, so a local `.env.local` can never leak in. The funnel hands over to WhatsApp. Every spec uses it by default.
- **`:4174`**: `vite build --outDir dist-e2e` and a preview on port 4174, built with a **fake** URL and key (`https://e2e-fake.supabase.co`, `e2e-fake-key`) passed through the `env` option, never written to a file. Specs that use it intercept every request to that URL with `page.route` (`/rest/v1/leads*` and `/rest/v1/lead_starts*`; reply `201` by default) and assert on the captured JSON.

`reuseExistingServer` is on: stop any old preview server first, so the tests never run against a stale build.

**Never script the funnel against `npm run dev`.** The dev server reads `.env.development.local`, which holds the owner's real Supabase project (DECISIONS U01-D1); a test there would write real leads.

### Specs
| File | What it asserts |
|---|---|
| `smoke.spec.ts` | `/` loads; no console errors or unhandled rejections; wordmark visible; one `<h1>`; the section IDs are exactly `top, about, how, behomy, projects, calculator, next, faq`; the intro plays once and gets out of the way. |
| `i18n.spec.ts` | Toggle to ID: `<html lang="id">`, the hero `<h1>` and the page title equal the ID copy, the nav labels change ("Cara kerja", "Cek lahan", "Portofolio"), the number formats change (`1.200 m²`). Toggling back restores English. `?lang=id` loads directly in Indonesian but applies only while present; the toggle's choice is what's remembered. No untranslated keys in either language (calculator steps 2 and 3 included). |
| `wordmark.spec.ts` | Hovering the header wordmark reveals "IN" and "ASI" (each insert's width > 0 after 700 ms) and leaving hides them; keyboard focus expands it too; the accessible name contains "Homy Investasi"; with reduced motion, no animation runs. |
| `calculator.spec.ts` | Default values in EN show exactly: `1,200 m²`, `66 rooms`, `6 units, 200 m² each`, `6 houses`, `360 m², one floor`, `Fastest` on Kos-kosan, summary containing `Rp 5.35 B` and `6.6 years`, Step 3 answer containing `3 more floors`, leftover `210 m²` and `35%`. In ID: `1.200 m²`, `66 kamar`, `Rp 5,35 M`, `6,6 tahun`. Variations from `05` §10 (maxFloors 2 → `720 m²`; KDB 70 + KDH 40 → conflict warning; KLB 0.5 → `1 floor of 300 m²` + KLB warning; width 0 → empty-state prompt). Typing in a money field keeps the separators. Reload keeps the values (localStorage). "Reset to example values" works. |
| `calc3d.spec.ts` | With WebGL: the canvas exists, and its text alternative contains `1,200 m²` and `3 floors`. With `?nowebgl=1`: the SVG fallback is shown with the same numbers. |
| `whatsapp.spec.ts` | Every WhatsApp link starts with `https://wa.me/6282110106088?text=`. After the calculator is used, the decoded text contains `30 × 20 m` and `1,200 m²`. Without calculator use, it's the generic message. In ID, the text starts with "Halo HOMYVEST". |
| `motion.spec.ts` | With `reducedMotion: 'reduce'`: no pinned sections, no intro, no Lenis, all copy visible and nothing clipped; the calculator still works and its numbers appear without rolling. |
| `a11y.spec.ts` | axe-core (`@axe-core/playwright`): no serious or critical violations on `/` in both themes and both languages, on `/portofolio/` in both themes, and **with the funnel open** at Step 2, Step 3A (with its field errors showing) and Step 3B. Keyboard: Tab reaches the skip link (to `#main`) first, then the wordmark and the six nav links, each with a visible focus ring; the phone field, calculator fields and tabs, FAQ, portfolio card and WhatsApp links are all reachable. FAQ buttons expose their state; the mobile menu is a dialog that traps and returns focus. |
| `placeholders.spec.ts` | Counts `[data-placeholder="true"]` captions on both pages and writes the list to `qa/placeholders.json` (for the report). Doesn't fail. |
| `main-flow.spec.ts` | Section order on `/` is exactly `top, about, how, behomy, projects, calculator, next, faq`; "Which one sounds like you?" and "Drawn with care" are absent; no filter tabs in `#projects`; every project image appears as it scrolls in. The hero `<h1>` contains "operated by Behomy" (EN) and "dioperasikan oleh Behomy" (ID). The partner logos are visible and switch to the on-dark files in the dark theme. The portfolio card links to `/portofolio/`. **No request** on `/` for `HeroScene`, `MaxoneScene`, `PadelScene` or `StoryPageScene` chunks or `/media/posters/` before the card is hovered. `/#calculator` and `/?focus=phone` land; "Land check" opens Step 1; "Leave your number" focuses the field. |
| `funnel.spec.ts` (`:4174`, fake Supabase) | An invalid phone shows the error and the panel stays closed. `0812 3456 7890` opens Step 2 and sends one `lead_starts` POST with `phone: "+6281234567890"`. **Path A** ("Personal funds"): "Send" empty shows the field errors; filled, the POST has `funding: "personal_funds"`, `owned_assets: ["vacant_land"]`, `build_types: ["hybrid_stay"]`, `cities: ["bodetabek"]`, `need: null`; the thank-you shows the first name and its WhatsApp text contains "Personal funds". **Path B** (no funds): intro visible; the POST has `funding: "no_funds"`, a `need` and `owned_assets: []`. **Server error** (500) → "Send on WhatsApp" (prefilled) and "Try again". **Rate limit** (400, `{"message":"rate_limited","code":"P0001"}`) → the rate message. A reload in Step 3 keeps the answers. After the land is changed to 40 × 25 in `#calculator`, the lead's `calc.A` is 1000. Esc closes the panel and focus returns to "Continue". In Indonesian, steps, options and chips are in Indonesian. |
| `funnel-handoff.spec.ts` (`:4173`, no Supabase) | Sending leads to the handoff screen with a `wa.me/6282110106088?text=` link containing the name and the funding label. No request goes to `supabase.co`. |
| `mobile.spec.ts` | At 360 × 740, no horizontal scroll on either page (`scrollWidth` ≤ the device width, not the emulated layout width). The funnel's primary button stays visible above a simulated keyboard (viewport height 420). The floating WhatsApp button hides while the panel is open. |
| `secrets.spec.ts` (Node only, no browser) | `.gitignore` contains `.env.*`, `!.env.example`, `supabase/.env*` and `*service-account*.json`; `node scripts/check-secrets.mjs --all` passes. |
| `portfolio.spec.ts` | `/portofolio/` (and `/portofolio`, where the server redirects) loads cleanly with one `<h1>` and its parts in order (`intro, story, maxone, padel, beyond, closing`). Each pinned scene's length ≈ `SCROLL.*.desktop × innerHeight / 100` (±2%) on desktop and `.mobile` on the mobile project. The index and the skip links jump where they should. The story's last beat links to `/#calculator`; the closing leads back to the land. In `#beyond` every image box is landscape at 390, 768 and 1440 px and `athero-1` is present; an image opens the viewer with its group. "Portfolio" has `aria-current="page"`. At 360 × 740: no sideways scroll, and the Maxone stop card at S1 is ≤ 65% of the viewport wide and ≤ 31% tall (also in the low-tier fallback). Reduced motion and `?nowebgl=1` keep every part readable. |
| `screenshots.spec.ts` | See §3 (`npm run shots`, not part of `npm run e2e`). |

Removed in U01: `doors.spec.ts`, and every assertion about project filters, the Team section, the HomyEight intro, or the story, Maxone and padel on `/`.

## 3. Screenshot review routine (run after every milestone, and in full before handing over)
`npm run shots` (`qa/screenshots.spec.ts`), then `node qa/tools/contact-sheets.mjs` for review sheets. Viewports: **390 × 844** (mobile), **768 × 1024** (tablet), **1440 × 900** (desktop), **1920 × 1080** (large). Themes: light and dark. Languages: EN, plus ID on mobile and desktop.

Capture:
- **Main page:** every section at rest (`qa/screenshots/sections/<viewport>-<theme>-<lang>-<section>.png`), plus the parts taller than a screen: the End-to-end steps, the hybrid diagram, the stats band, Behomy's places, before / after, the team photo, the Projects grid, the `#next` closing block and the footer.
- **Portfolio page:** each part at rest (`…-portfolio-<part>.png`), and each 3D scene at its key progress points (`06` §7), with the Maxone stops placed next to their renders in `qa/maxone-compare/`.
- **Funnel states** (mobile and desktop, against the `:4174` build with every request intercepted): Step 2, Step 3B, Step 3A, Step 3A with its errors, the error screen, the thank-you screen; and the WhatsApp handoff on the keyless `:4173` build (`qa/screenshots/funnel/`).
- Calculator Steps 1–3 with default values, plus the conflict-warning state.
- The header with the wordmark expanded (hover), and the portfolio card hover state (desktop).
- Reduced motion and `?nowebgl=1`: full-page captures on mobile and desktop (`qa/screenshots/fallbacks/`).

**Phones and layout changes below 1024 px:** also shoot both pages at 360 × 740, 390 × 844, 414 × 896, 768 × 1024 and 844 × 390 (landscape), light and dark, ID at 360 and 390, including the funnel steps and the Maxone stops S1, S3 and S5 (`updates/U01/U01_05_MOBILE.md` §5). `screenshots.spec.ts` covers only the four viewports above, so take these with a one-off script. A change meant for phones must leave the desktop pixel-identical: compare 1440 × 900 shots before and after.

**Look at every screenshot** (open the PNGs). For each, check: hierarchy reads at a glance, there's no text over busy image areas without a scrim, no awkward wraps (especially ID at 360–390 px), no overlap or clipping, nothing touches the screen edge, the B&W discipline holds (colour only in renders, photos, partner logos and the one zone-green), and the dark theme is as polished as the light one. Fix, recapture, and note what changed in PROGRESS.md.

## 4. Performance checks
1. Production build (`npm run build && npm run preview`).
2. With Playwright on Chromium, mobile profile, CPU throttled ×4 via CDP (`Emulation.setCPUThrottlingRate`) and the network set to "Fast 4G":
   - Collect LCP, CLS and INP-like metrics with a `PerformanceObserver` injected before load. Collect total transferred bytes per type from `Resource Timing`.
   - Scroll through each pinned scene at a steady speed (e.g. `mouse.wheel` 120 px every 50 ms, or Lenis `scrollTo` with duration). Record a performance trace (`browser.startTracing` / `stopTracing`) and compute the frame-duration distribution (p50, p95, max) from the trace's frame events. Flag frames over 50 ms.
3. Repeat the frame test on desktop without throttling.
4. Report all numbers against `09` §7 and `06` §1.7 in REPORT.md. If a budget is missed, lower the tier defaults or simplify, then re-measure. If it's still missed, explain why.

Per page since U01:
- **`/`:** LCP (the hero photo), CLS and the first-load JavaScript (≤ 180 KB gzip; 172.4 KB at U01), and that no portfolio scene chunk or poster loads.
- **`/portofolio/`:** the frame test above on each pinned scene (steady wheel, 120 px every 50 ms), desktop and phone with ×4 CPU. Targets: p95 ≤ 20 ms desktop, ≤ 34 ms phone, no frame over 50 ms after warm-up.

## 5. Final design review (M10)
1. Run Impeccable **critique** on the full-page screenshots (desktop and mobile), then **audit** (a11y, performance, responsive), then **polish**. Apply what fits these docs. Log any conflicts in DECISIONS.md.
2. Review against Taste Skill's `design-taste-frontend` and `03` §9's anti-patterns. Remove anything generic.
3. Walk the flow checklist in `04` §11. Read only the headlines from top to bottom: they should tell the story.
4. Check the copy fit in both languages. Trim or rebalance lines, never facts.
5. Tune the motion: no two competing movements per viewport, every ease from `03` §7, and the skip links work.

## 6. Pre-handoff checklist
- [ ] `npm run test`, `npm run typecheck`, `npm run build` and `npm run e2e` all pass.
- [ ] `node scripts/check-secrets.mjs --all` passes, and `git config core.hooksPath` prints `.githooks`.
- [ ] No `console.error` or warnings in production.
- [ ] All copy from `07` present in both languages. No placeholder text other than the captions.
- [ ] Facts used are exactly those in `02` §6, with footnotes in place.
- [ ] `render/` and `assets-src/` untouched (`git status` shows nothing there, and the timestamps are unchanged).
- [ ] Posters generated for all 3D scenes; reduced-motion and no-WebGL paths reviewed in screenshots, on both pages.
- [ ] The funnel works on both builds: saved (fake Supabase) and handed over to WhatsApp (no Supabase).
- [ ] Favicon, OG image, robots.txt, sitemap.xml (both pages), redirects and the deploy configs exist.
- [ ] `homyvest.example` placeholders listed.
- [ ] `docs/` describes the current site, and `docs/PROGRESS.md` and `docs/DECISIONS.md` are complete.

## 7. `docs/REPORT.md` template
(For an owner update, write `docs/REPORT_Uxx.md` from the template in that update's QA document instead, e.g. `updates/U01/U01_08_QA.md` §6.)
```md
# HOMYVEST website: build report
Date: … · Agent session(s): … · Final commit: …

## Run it
- `npm install` then `npm run dev` → http://localhost:5173
- Production preview: `npm run build && npm run preview` → http://localhost:4173
- Tests: `npm run test` (unit) · `npm run e2e` (browser)

## What was built
Short tour of the page, section by section, with 1–2 screenshots each (links into qa/screenshots).

## 3D experiences
| Scene | Shipped as | Tiers | Notes |
|---|---|---|---|
| Hero story | full 3D / fallback | high, medium, low | … |
| Maxone walkthrough | procedural 3D / fallback B | … | time-box outcome |
| Padel assembly | 3D + aligned reveals | … | alignment error ≈ …% |
| Calculator | live 3D + SVG fallback | … | |
| Depth parallax | on / off (why) | … | |

## Quality numbers
LCP …, CLS …, INP …, initial JS … KB, frame p95 per scene … ms (desktop / mobile). Budget misses and reasons.

## Setup outcome
Table from M0 (skills, plugins, Python). Anything that needs a restart or a human command.

## Decisions worth knowing
Top 10 from DECISIONS.md (what, why, how to undo).

## Needs you
1. **Project captions**: fill in `src/content/projects.js` (list of N images below, from qa/placeholders.json, with the table from 08 §5).
2. **Domain**: replace `homyvest.example` (N occurrences, files listed).
3. **Confirm provisional project categories** (Kost / Guesthouse / Homestay / Villa).
4. Higher-resolution versions of benhil-1, benhil-2, facade-2 (currently kept small).
5. Anything from setup that needs a human command (e.g. Impeccable plugin via /plugin, if the CLI failed).
6. Deploy: `npx vercel` or `npx netlify deploy --prod` once you have an account and domain.

## Known issues
…
```

## 8. Finish
Commit `M11: QA, performance, report`. Make sure the working tree is clean. Stop.

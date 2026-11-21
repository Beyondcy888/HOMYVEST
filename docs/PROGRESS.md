# HOMYVEST build — progress log

At-a-glance checklist: [../TASKLIST.md](../TASKLIST.md). This file is the detailed log, one entry per milestone.

**Resume rule:** find the last entry below, read its "Next step", re-read the matching doc section in `docs/`, continue.

- Build started: 2026-11-20 01:08 WIB
- Machine: Windows 11, Node v24.13.0, npm 11.6.2, git 2.50.1, Python 3.13.2 (`py -3`), AMD Ryzen AI 9 365 / Radeon 880M, 23 GB RAM
- Project root: `d:\BEHOMY\HOMYVEST` · originals: `renders/` (read-only) · kit source: `HOMYVEST-DEV-PACK/` (untouched)

---

## M0 Setup — 2026-11-20 01:08–01:40
| Item | Result | Notes |
|---|---|---|
| Node / npm | OK v24.13.0 / 11.6.2 | newer than the kit's v22 recommendation; everything installs and runs |
| Git repo | OK | initialised, first commit 41d06b3 |
| Render folder | OK `renders/` | 32 originals hashed into qa/renders-originals.sha256.txt |
| npm packages | OK | react 19.3, three 0.187, R3F 9.8, drei 10.7, gsap 3.15, lenis 1.3, vite 8.3, vitest 5.1, playwright 1.65, sharp 0.35, @axe-core/playwright |
| Impeccable | OK primary CLI | skill v4.10.0 in .claude/skills/impeccable, engine 0.1.27, 5 agents in .claude/agents |
| Impeccable hooks | OK installed by CLI | .claude/settings.local.json (SessionStart, PostToolUse Edit/Write, Stop). No separate `hooks on` step needed |
| Impeccable init | OK PRODUCT.md + DESIGN.md | answered from docs/02 and docs/03 (no live interview, owner away). This version's init writes only PRODUCT.md; DESIGN.md written by hand in the DESIGN.md spec format, mirroring docs/03 |
| Taste Skill (design-taste-frontend) | OK | v2.5.1 in .claude/skills/design-taste-frontend (38 MB incl. its asset kit) |
| Playwright plugin | NOT INSTALLED | The `claude` CLI is not on PATH (extension-only install). Needs the owner: `claude plugin install playwright@claude-plugins-official`. Not required for any test |
| Playwright test runner + Chromium | OK smoke passed | with GPU flags headless Chromium uses the real Radeon 880M (D3D11); default headless is SwiftShader |
| Python depth env | OK | py -3.13 venv, torch 2.15.0+cpu, transformers 5.23.0 |

## M1 Asset pipeline — 2026-11-20 01:40–01:55
- `npm run assets:padel`: 3 transparent cut-outs in .cache/padel-clean (1830x1119, 1342x895, 1341x928). Viewed: no caption text, building intact.
- `npm run assets:images`: 35 images, AVIF + WebP variants, 34 MB in public/media. Manifest has 35 entries; 3 with alpha; 3 flagged lowRes (benhil-1, benhil-2, facade-2).
- `scripts/depth-maps.py`: 28 depth maps, depth-status.json available: true. Viewed interior-3, facades/best, maxone/2: white = near.
- Known issues: none.
- Next step: M2 foundations (tokens, fonts, i18n provider, shell, wordmark, Lenis + GSAP).

## M2 Foundations — 2026-11-20 01:20–01:40
- Done: design tokens (`src/styles`), Archivo variable (weight + width axes) self-hosted and preloaded, i18n provider with EN/ID copy (`src/i18n`), number formatters, safe storage, theme (auto/light/dark, set before first paint), Lenis + ScrollTrigger on one ticker, `PinnedScene` (sticky stage + QA registry), header (transparent over hero, hides on scroll down and during pinned scenes), mobile menu dialog, footer, floating WhatsApp, skip link, wordmark with the HOMYVEST → HOMY INVESTASI animation, intro overlay.
- Verified: screenshots at 1440 and 390, light and dark; wordmark inserts open on hover; EN/ID toggle switches shell text; console clean.
- Known issues: none.

## M3 Calculator engine — 2026-11-20 01:18–01:22
- Done: `calc.ts`, `whatsapp.ts`, `calc.test.ts` copied verbatim from `reference/`; `geometry.ts` + `geometry.test.ts` (bands 4/12/4, ruko 6 units × 27 m × 12 m, houses 6 × 10 × 10 m with 35 m² footprints, and more); `store.ts` (zustand, validated restore, safe storage).
- Verified: `npm run test` 38/38 green (24 reference + 14 geometry), `npm run typecheck` clean.
- Known issue: Vitest must be run from PowerShell/cmd, not Git Bash (DECISIONS D16).

## M5 (part) Shared 3D foundation — 2026-11-20 01:25–01:42
- Done: `SceneCanvas`, `Stage` (environment, key light, shadow-catcher ground, fog, frame watch, perf probe), clay materials, seeded RNG, the assembly engine (`pieces.js`, `AssemblyMesh.jsx`), `SceneMount`, the dev harness (`/dev.html?scene=…`), a test scene, `docs/SCENE_GUIDE.md`.
- Verified: test building assembles and reads as a white architectural model in light and dark; lighting calibrated by measurement (DECISIONS D8).
- Then: four sub-agents started on the hero story, Maxone walkthrough, padel assembly and calculator 3D (DECISIONS D12).

## M4 All sections, static — 2026-11-20 01:42–02:05
- Done: About + two doors (with line drawings), Team chain, HomyEight intro, Behomy (hybrid diagram, stats band, handles, brands, uplift note, footnotes), Projects (asymmetric gallery, FLIP filters, lightbox), Beyond (heading + pinned horizontal ways strip, native swipe on touch), Calculator UI (steps 1–3, live results, presets, idea radio cards, gauges, hatch warnings, SVG plan fallback, WhatsApp handoff, text alternative, live region), What happens next + closing, FAQ.
- Verified: every section at 1440 × 900 (EN) and 390 × 844 (ID, the longer language); console clean.
- Mobile choice for step 2 (docs/05 §6): ideas are a stacked list, not a carousel, so all four stay comparable by scrolling and nothing is hidden behind a swipe.
- Fixed after review: footer wordmark overflowed when expanded; a stray full stop after the Indonesian headline number; centred secondary links.

## M9 Depth parallax — 2026-11-20 02:05–02:12
- Done: `src/three/depth/engine.js` + `DepthImage`. One shared off-screen WebGL context renders every depth image and copies the result into a small canvas over each `<picture>` (so layering, clipping and text over photos behave like plain images). It renders only while an offset is settling.
- Verified with `qa/tools/depth-check.mjs`: goes live, colours match the plain picture, near objects shift against far ones with the pointer; console clean.
- Decision: offsets are fractions of the visible frame, not of the whole image, so cropped images do not move more than uncropped ones.
- Fallback: no depth map, low tier, reduced motion or no WebGL → the plain `<picture>` with the CSS scale-in.

## M11 (part) Tests and assets — 2026-11-20 02:12–02:25
- Done: Playwright specs (`qa/*.spec.ts`): smoke, i18n, wordmark, calculator, calc3d, doors, whatsapp, motion, a11y (axe), placeholders, screenshots (separate `shots` project). Favicons, OG image (rendered with the real Archivo), robots.txt, sitemap.xml, vercel.json, netlify.toml.
- First run on what existed: 56 passed. Two real problems found and fixed: step text in "What happens next" dimmed below contrast limits; Door A on phones focused the width field without scrolling it into view.
- Next step: integrate the four scenes as the sub-agents finish; then M10 polish and the full M11 run.

## Session 2 — 2026-11-20 04:53 onward
Session 1 was stopped by the account's usage limit at 02:17 with four scene agents mid-build. Session 2 resumed them with their saved context. A stream stall froze all agents from about 05:17 to 08:07, and a second usage limit stopped the last two at about 09:45; each time the work on disk was committed and picked up again.

## M4 addendum: Maxone section shell — 05:00–05:10
- Done by the main session so the page was whole without the 3D room: `Walkthrough.jsx`, `MiniMap.jsx`, `StopCard.jsx` (render cards, mini-map with walked path and stop buttons, skip link, render-led fallback B, static mode).
- Also: projects gallery recomposed row by row; step changes on phones land below the sticky 3D; "eight courts" removed from the padel line (DECISIONS D18).

## M8 Calculator live 3D — done 05:17, verified 08:20
- `src/three/kits/calcModels.js`, `src/three/calc/*`. Models for every step and idea, labels, orbit, morphs, rule highlights, touch behaviour, poster.
- Verified in the real page: step 1, ruko, houses, warehouse (dark), step 3 with ghost floors, mobile. 26 unit tests measure the drawn boxes against the calculator's numbers.

## M7 Padel assembly — done 05:14, verified 08:22
- `src/three/kits/padel.js`, `src/three/padel/*`, `src/sections/Beyond/PadelSection.jsx`. True-isometric camera, three-stage assembly, aligned reveals, fallback, posters.
- Verified in the real page at eight progress points, mobile and dark. 18 draw calls, about 42,000 triangles.

## M5 Hero story — done 09:40, verified 10:10
- `src/three/kits/{stay,office,cafe,sports}.js`, `src/three/hero/*`, `src/sections/Story/*`. Five beats, radial dissolve into the dusk render, stats and CTAs, static mode, posters.
- Verified in the real page: desktop, mobile, dark. No frame over 50 ms on desktop after the hitch work.

## M6 Maxone 3D room — done 09:40, verified 10:10
- `src/three/maxone/*`. Compared with the renders at every stop (`qa/maxone-compare/`): passes, so the room is the default (`SCENE_READY = true`). 19–26 draw calls, 104k–142k triangles.
- Assumptions about the room: DECISIONS D22.

## M10 Design polish
- Impeccable: design hook active on every UI file written; `impeccable detect` on the source (no findings beyond advisory type-size notes) and on the rendered page in both languages (seven "label above heading" findings, kept: DECISIONS D10, D26).
- Taste Skill used as a review lens (DECISIONS D11): no gradients, glass, rounded shadow cards, icon grids, carousels or centred-everything layouts; photographs lead; hover answers on buttons, links, doors and gallery images.
- Flow checklist (docs/04 §12): headlines alone tell the story; every section hands over to the next; both doors land in the calculator with the first field focused; WhatsApp within two taps everywhere; every pinned scene has a skip link; colour only in renders and the one zone green; Indonesian checked at 390 px.
- Fixed in review: footer and intro wordmark overflowing when expanded; dimmed step text below contrast; gallery rows; hybrid diagram redrawn as a building elevation; footer partner line; stray full stop in the Indonesian headline.

## M11 QA and performance
- `npm run test`: 76/76. `npm run typecheck`: clean. `npm run build`: clean. `npm run e2e`: 66 passed, 6 skipped by design (hover and keyboard checks that only apply to one device class).
- Performance measured with `node qa/tools/perf.mjs` (numbers in REPORT.md).
- Originals: `node qa/tools/verify-renders.mjs` → 32 of 32 identical.

## Final pass after review — 10:30–10:42
- First-visit path (with the intro) checked in the finished page: all ten sections mount in order, a header link reaches the calculator, no errors. The smoke test now asserts this. A link clicked before its section has mounted waits for it.
- Low tier on a phone checked: hero 3D, render-led walkthrough, padel renders, calculator 3D; no errors.
- Impeccable audit by hand, five dimensions (0–4 each): accessibility 3 (axe clean in both themes and languages, visible focus, skip links; not tested with a screen reader), performance 3 (budgets met; the hero keeps some layers promoted for the whole scene, by measurement), theming 3 (tokens everywhere in the interface; fixed colours only inside 3D materials and the Maxone palette), responsive 4 (no horizontal overflow from 320 to 1920 px; every control at least 44 px after fixing seven), implementation integrity 3 (detector: seven label-above-heading findings, kept by the brief). Total 16/20.
- Fixed: seven undersized touch targets; the period footnote is now beside the 82% figure in the hero; draw calls recorded for all four scenes.
- Final: 76 unit tests, 66 browser tests, typecheck and build clean.


---

# Update U01 (`updates/U01/`, delivered in `update2/`): 2026-11-21

Task list: `tasklist-update2.md`. Decisions: `docs/DECISIONS.md` (U01-D1 …). Report: `docs/REPORT_U01.md`.

## U1 Setup (e898d19)
- **Done:**
  - The kit is placed in the project root without overwriting anything.
  - Packages: `@supabase/supabase-js`, dev `pdf-lib@1.17.1`, dev `supabase`.
  - Secrets: the `.gitignore` block, the pre-commit hook (`core.hooksPath .githooks`; it blocked a fake refresh token in a test), and the npm scripts.
  - Config: the Vitest alias, tsconfig `paths`, and a multi-page Vite build around a shared `SiteShell`.
  - Copy: per-page SEO meta, and every U01 string in English and Indonesian.
- **The owner's Supabase values:** in the git-ignored `.env.development.local`, for `npm run dev` only (U01-D1).

## U2 Assets (f8eb1ba)
- **Done** (by a helper agent; originals hash-verified, no churn in existing media):
  - logos with display versions
  - 25 photos through the optimizer
  - 15 depth maps
  - alt text in both languages
- **Captions:** `src/content/behomy.js`.

## U4 + U5 Main page and lead funnel (9c53041, 5e42c49, d89a8f5)
- **Main page, in this order:** hero + funnel, What is HOMYVEST?, End-to-end, Behomy (hero, diagram, five stats, training, mosaic, before/after, team), Projects (no filters), Land check, What happens next with the portfolio card, FAQ.
- **The funnel** is complete: all paths, result screens, persistence, focus handling, mobile sheet.
- **Checked in the browser** at every state.
- **Bugs found and fixed:**
  - focus didn't enter the panel (GSAP `autoAlpha`, and the reduced-motion transitions)
  - the calculator's `.chip` class clashed with the funnel's chips
  - the About heading clipped its "?"
  - the before/after carousel wasn't keyboard-scrollable
- **First load:** 184.8 → 172.4 KB gzip (budget 180). The calculator's UI is its own chunk, and the manifest is slimmed.

## U6 Backend (kit files unchanged)
- The 34 lead tests are green.
- The sample PDFs were rendered to PNG and checked in both languages. Emoji and non-Latin characters print as "?" (standard font); noted in the report.
- **A read-only probe of the owner's project:** the URL and key work, and the `leads` table doesn't exist yet (`PGRST205`). The owner's setup is still to do.

## U7 Mobile (main page, 940685b)
- **Fixed:** the phone card overflowed at 360 px. The test had missed it because emulation widens the layout viewport; it now compares with the device width.
- **Phone rules:** header 56 px, section spacing, type caps, menu rows; tablet stacking of the phone row; the hero `sizes`.
- **Checked** at 360 (ID), 390 (light and dark), 768, and 844 × 390.
- **Desktop 1440 before/after:** identical.

## U8 QA (in progress)
- **New specs:** main-flow, funnel (fake Supabase on :4174), funnel-handoff (:4173), mobile, secrets. The older specs are updated.
- **e2e:** 112/112 before the portfolio merge. The mobile 360 px check on `/portofolio/` waits for U3.

## U3 Portfolio page
- Being built by a helper agent in the worktree `../HOMYVEST-u3` (branch `u3-portfolio`), to be merged here.

## U3 Portfolio page (merged e38b09f)
- **Built by a helper agent** on branch `u3-portfolio`: intro and index, story, Maxone, padel, Beyond (landscape), closing, dividers.
- **Scroll and smoothness:** lengths from `scroll-config.js`, the smoothness pass, and phone layouts.
- **Frame-time targets met** (`qa/perf-u01.json`). On a throttled phone, Maxone went from 6 frames over 50 ms to 1 frame of exactly 50.1 ms.
- **Fixed after the merge:** the "← Home" link overlapped the language toggle at 360/390 px; `/portofolio` without the slash now redirects in dev and preview too; the last unused copy keys and the HomyEight intro files are deleted.

## U8 QA
- **Tests:** 116 unit and 146 e2e (10 by-design device skips); typecheck, build and `check-secrets --all` are clean.
- **Screenshots:** `npm run shots`, 64 runs (both pages, four viewports, both themes, both languages, every funnel state), reviewed.
- **Fixed from the shots:** the funnel panel's header overlapped its close button on phones; "Powered by" now goes under the wordmark.
- **Load:** main page LCP 1.2–1.7 s on mobile 4G ×4, CLS ≤ 0.003, first-load JS 173.5 KB gzip (budget 180).
- **Originals untouched:** `renders/` 32/32, `assets-src/` 31/31.

## U9 Docs and report
- **Docs:** `CLAUDE.md`, `docs/02–10`, `DESIGN.md` and `PRODUCT.md` describe the new site. DECISIONS U01-D1 … D23. `docs/REPORT_U01.md` written.
- **What's left is the owner's:** the Supabase and Google Drive setup, host environment variables, captions, photo rights and the domain (REPORT_U01 "Needs you").

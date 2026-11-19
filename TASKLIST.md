# HOMYVEST website — task list

**How to read this:** `[x]` done · `[~]` in progress · `[ ]` not started · `[!]` blocked or shipped as fallback (see note).
Detailed log per milestone: [docs/PROGRESS.md](docs/PROGRESS.md) · decisions: [docs/DECISIONS.md](docs/DECISIONS.md) · final report: [docs/REPORT.md](docs/REPORT.md).

**To resume after an interrupted session:** open Claude Code in this folder and say
"Resume the HOMYVEST build from TASKLIST.md and docs/PROGRESS.md." The next unchecked item below is where to continue.

- Build started: 2026-11-20 01:08 (WIB, +07:00)
- Build finished: _not yet_

---

## M0 — Setup
- [~] Lay out the kit in the project root (CLAUDE.md, docs/, scripts/, reference/, .claude/settings.json)
- [ ] Snapshot hashes of the original renders (qa/renders-originals.sha256.txt)
- [ ] git init + .gitignore
- [ ] Project scaffold (package.json, vite, tsconfig, index.html, src/)
- [ ] npm packages installed
- [ ] **Impeccable** installed + initialised (PRODUCT.md, DESIGN.md)
- [ ] **Taste Skill** (design-taste-frontend) installed
- [ ] **Playwright** test runner + Chromium installed, smoke test passes
- [ ] Playwright Claude Code plugin (nice to have)
- [ ] Python depth environment (.venv-depth)
- [ ] Commit `M0`

## M1 — Asset pipeline
- [ ] Clean padel images (captions removed, transparent)
- [ ] Optimise all renders → public/media + media-manifest.json (35 images)
- [ ] Depth maps → public/media/depth + depth-status.json
- [ ] Looked at the outputs (padel cut-outs, two depth maps)
- [ ] Commit `M1`

## M2 — Foundations
- [ ] Design tokens, base styles, typography (Archivo variable)
- [ ] i18n (EN/ID), formatters, safe storage
- [ ] Lenis + GSAP ScrollTrigger wiring, QA trigger registry
- [ ] Header, mobile menu, footer, floating WhatsApp, skip link
- [ ] Wordmark + hover animation (HOMYVEST → HOMY INVESTASI)
- [ ] Intro (logo → story)
- [ ] Light / dark theme
- [ ] Commit `M2`

## M3 — Calculator engine
- [ ] calc.ts, whatsapp.ts, calc.test.ts in src/lib/calc (verbatim from reference/)
- [ ] geometry.ts + geometry.test.ts
- [ ] store.ts (zustand + safe localStorage)
- [ ] `npm run test` all green
- [ ] Commit `M3`

## M4 — All sections, static (no 3D)
- [ ] Hero story (static/poster version)
- [ ] About + two doors
- [ ] Team
- [ ] HomyEight intro + walkthrough fallback B (render-led)
- [ ] Behomy (hybrid diagram, stats, handles)
- [ ] Projects gallery + filters + lightbox
- [ ] Beyond stays (padel fallback + ways strip)
- [ ] Calculator UI: steps 1–3, results, warnings, SVG fallback, WhatsApp CTA
- [ ] What happens next
- [ ] FAQ
- [ ] Reviewed at 390 px and 1440 px, EN + ID
- [ ] Commit `M4`

## M5 — 3D foundation + hero story
- [ ] Shared: SceneCanvas, clay materials, lights, ground, tiers, error boundary
- [ ] Assembly engine (instanced pieces, seeded start transforms)
- [ ] Building kits: stay, office, café, sports
- [ ] Hero choreography (5 beats) + text overlays + dissolve to photo
- [ ] Reduced-motion / no-WebGL fallback
- [ ] Commit `M5`

## M6 — Maxone walkthrough
- [ ] Debug trace mode (`?debug=maxone`)
- [ ] Room shell, floors, ceiling, void, mezzanine
- [ ] Counters, furniture, plants, mural, lights
- [ ] Camera route + dwell stops + collision check
- [ ] Render cards + mini-map
- [ ] Compared against renders (qa/maxone-compare)
- [ ] Commit `M6`

## M7 — Padel assembly
- [ ] Camera calibration + model
- [ ] Three-stage choreography
- [ ] Render alignment + reveals
- [ ] Commit `M7`

## M8 — Calculator live 3D
- [ ] CalcScene: land plate, zones, road, orbit, auto-frame
- [ ] Models: max building, kos, ruko, houses, warehouse, existing + ghost floors
- [ ] Labels + text alternative
- [ ] Commit `M8`

## M9 — Depth parallax
- [ ] DepthImage + shared view canvas + shader
- [ ] Applied to photographic renders; clean fallback
- [ ] Commit `M9`

## M10 — Design polish
- [ ] Impeccable critique / audit / polish
- [ ] Taste review against anti-patterns
- [ ] Flow checklist (04 §12), copy fit EN + ID, motion tuning
- [ ] Commit `M10`

## M11 — QA, performance, report
- [ ] Playwright specs (smoke, i18n, wordmark, calculator, calc3d, doors, whatsapp, motion, a11y, placeholders, screenshots)
- [ ] Posters generated for 3D scenes
- [ ] Performance numbers measured
- [ ] Favicon, OG image, robots, sitemap, deploy configs
- [ ] `npm run test`, `typecheck`, `build`, `e2e` all pass
- [ ] Originals in renders/ verified untouched
- [ ] docs/REPORT.md written, finish time recorded
- [ ] Commit `M11`

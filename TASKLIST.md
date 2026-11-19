# HOMYVEST website — task list

**How to read this:** `[x]` done · `[~]` in progress · `[ ]` not started · `[!]` blocked or shipped as fallback (see note).
Detailed log per milestone: [docs/PROGRESS.md](docs/PROGRESS.md) · decisions: [docs/DECISIONS.md](docs/DECISIONS.md) · final report: [docs/REPORT.md](docs/REPORT.md).

**To resume after an interrupted session:** open Claude Code in this folder and say
"Resume the HOMYVEST build from TASKLIST.md and docs/PROGRESS.md." The next unchecked item below is where to continue.

- Build started: 2026-11-20 01:08 (WIB, +07:00)
- Build finished: _not yet_

---

## M0 — Setup
- [x] Lay out the kit in the project root (CLAUDE.md, docs/, scripts/, reference/, .claude/settings.json)
- [x] Snapshot hashes of the original renders (qa/renders-originals.sha256.txt)
- [x] git init + .gitignore
- [x] Project scaffold (package.json, vite, tsconfig, index.html, src/)
- [x] npm packages installed
- [x] **Impeccable** installed + initialised (PRODUCT.md, DESIGN.md)
- [x] **Taste Skill** (design-taste-frontend) installed
- [x] **Playwright** test runner + Chromium installed, smoke test passes
- [!] Playwright Claude Code plugin (nice to have) — the `claude` CLI is not on PATH on this machine; needs one command from you, see REPORT
- [x] Python depth environment (.venv-depth)
- [x] Commit `M0`

## M1 — Asset pipeline
- [x] Clean padel images (captions removed, transparent)
- [x] Optimise all renders → public/media + media-manifest.json (35 images)
- [x] Depth maps → public/media/depth + depth-status.json
- [x] Looked at the outputs (padel cut-outs, two depth maps)
- [x] Commit `M1`

## M2 — Foundations
- [x] Design tokens, base styles, typography (Archivo variable)
- [x] i18n (EN/ID), formatters, safe storage
- [x] Lenis + GSAP ScrollTrigger wiring, QA trigger registry
- [x] Header, mobile menu, footer, floating WhatsApp, skip link
- [x] Wordmark + hover animation (HOMYVEST → HOMY INVESTASI)
- [x] Intro (logo → story)
- [x] Light / dark theme
- [x] Commit `M2`

## M3 — Calculator engine
- [x] calc.ts, whatsapp.ts, calc.test.ts in src/lib/calc (verbatim from reference/)
- [x] geometry.ts + geometry.test.ts
- [x] store.ts (zustand + safe localStorage)
- [x] `npm run test` all green
- [x] Commit `M3`

> **Note for a resumed session:** the scene work in M5–M8 was handed to four parallel sub-agents (see docs/DECISIONS.md D12 and docs/SCENE_GUIDE.md). Items marked `[~]` there were in their hands. If their folders (`src/three/hero`, `maxone`, `padel`, `calc`, `src/sections/Story`, `src/sections/HomyEight/Walkthrough.jsx`, `src/sections/Beyond/PadelSection.jsx`) are missing or incomplete, finish them following docs/06 and docs/SCENE_GUIDE.md, then mount them in `src/sections/Sections.jsx`.

## M4 — All sections, static (no 3D)
- [x] Hero story (static/poster version)
- [x] About + two doors
- [x] Team
- [x] HomyEight intro + walkthrough fallback B (render-led)
- [x] Behomy (hybrid diagram, stats, handles)
- [x] Projects gallery + filters + lightbox
- [x] Beyond stays (padel fallback + ways strip)
- [x] Calculator UI: steps 1–3, results, warnings, SVG fallback, WhatsApp CTA
- [x] What happens next
- [x] FAQ
- [x] Reviewed at 390 px and 1440 px, EN + ID
- [x] Commit `M4`

## M5 — 3D foundation + hero story
- [x] Shared: SceneCanvas, clay materials, lights, ground, tiers, error boundary
- [x] Assembly engine (instanced pieces, seeded start transforms)
- [~] Building kits: stay, office, café, sports
- [ ] Hero choreography (5 beats) + text overlays + dissolve to photo
- [ ] Reduced-motion / no-WebGL fallback
- [ ] Commit `M5`

## M6 — Maxone walkthrough
- [~] Debug trace mode (`?debug=maxone`)
- [ ] Room shell, floors, ceiling, void, mezzanine
- [ ] Counters, furniture, plants, mural, lights
- [ ] Camera route + dwell stops + collision check
- [ ] Render cards + mini-map
- [ ] Compared against renders (qa/maxone-compare)
- [ ] Commit `M6`

## M7 — Padel assembly
- [~] Camera calibration + model
- [ ] Three-stage choreography
- [ ] Render alignment + reveals
- [ ] Commit `M7`

## M8 — Calculator live 3D
- [~] CalcScene: land plate, zones, road, orbit, auto-frame
- [ ] Models: max building, kos, ruko, houses, warehouse, existing + ghost floors
- [ ] Labels + text alternative
- [ ] Commit `M8`

## M9 — Depth parallax
- [x] DepthImage + shared view canvas + shader
- [x] Applied to photographic renders; clean fallback
- [x] Commit `M9`

## M10 — Design polish
- [ ] Impeccable critique / audit / polish
- [ ] Taste review against anti-patterns
- [ ] Flow checklist (04 §12), copy fit EN + ID, motion tuning
- [ ] Commit `M10`

## M11 — QA, performance, report
- [ ] Playwright specs (smoke, i18n, wordmark, calculator, calc3d, doors, whatsapp, motion, a11y, placeholders, screenshots)
- [ ] Posters generated for 3D scenes
- [ ] Performance numbers measured
- [x] Favicon, OG image, robots, sitemap, deploy configs
- [ ] `npm run test`, `typecheck`, `build`, `e2e` all pass
- [ ] Originals in renders/ verified untouched
- [ ] docs/REPORT.md written, finish time recorded
- [ ] Commit `M11`

---
## Session log
- Session 1: 2026-11-20 01:08 → 02:17 WIB. Stopped by the account's usage limit while four scene agents were mid-build.
- Session 2: resumed 2026-11-20 04:53 WIB. Scene agents resumed with their saved context; the Maxone section shell (cards, mini-map, render-led fallback, static mode) is built by the main session so the page is whole even if a scene is not finished.

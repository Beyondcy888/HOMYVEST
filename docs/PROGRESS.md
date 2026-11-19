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

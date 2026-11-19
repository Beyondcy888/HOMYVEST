# 10 — QA and launch (Milestone M11, plus checks during every milestone)

## 1. Commands
```bash
npm run test            # Vitest: calc engine, geometry, formatters, WhatsApp (must be 100% green)
npm run typecheck       # TypeScript (calc module)
npm run build           # production build
npm run e2e             # Playwright: builds, serves on :4173, runs qa/*.spec.ts on desktop + mobile
npm run shots           # Playwright: regenerates screenshots into qa/screenshots/
```

## 2. Playwright specs (write them all in `qa/`)
| File | What it asserts |
|---|---|
| `smoke.spec.ts` | Page loads; no console errors or unhandled rejections; wordmark visible; every section ID in `04` exists, in order. |
| `i18n.spec.ts` | Toggle to ID: `<html lang="id">`, the hero b1 title equals the ID copy, the nav labels change, the number formats change (`1.200 m²`). `?lang=id` loads directly in Indonesian. Toggling back restores English. No untranslated keys (scan for `[missing:` markers or English fallbacks logged). |
| `wordmark.spec.ts` | Hovering the header wordmark reveals "IN" and "ASI" (each insert's width > 0 after 700 ms); the accessible name contains "Homy Investasi"; with reduced motion, no animation runs. |
| `calculator.spec.ts` | Default values in EN show exactly: `1,200 m²`, `66 rooms`, `6 units, 200 m² each`, `6 houses`, `360 m², one floor`, `Fastest` on Kos-kosan, summary containing `Rp 5.35 B` and `6.6 years`, Step 3 answer containing `3 more floors`, leftover `210 m²` and `35%`. In ID: `1.200 m²`, `66 kamar`, `Rp 5,35 M`, `6,6 tahun`. Variations from `05` §10 (maxFloors 2 → `720 m²`; KDB 70 + KDH 40 → conflict warning; KLB 0.5 → `1 floor of 300 m²` + KLB warning; width 0 → empty-state prompt). Typing in a money field keeps the separators. Reload keeps the values (localStorage). "Reset to example values" works. |
| `calc3d.spec.ts` | With WebGL: the canvas exists, and its text alternative contains `1,200 m²` and `3 floors`. With `?nowebgl=1`: the SVG fallback is shown with the same numbers. |
| `doors.spec.ts` | Door A → calculator Step 1 with the front-width input focused. Door B → Step 1 with the building note; after valid land, the primary button reads "Check my building" and opens Step 3. |
| `whatsapp.spec.ts` | Every WhatsApp link starts with `https://wa.me/6282110106088?text=`. After the calculator is used, the decoded text contains `30 × 20 m` and `1,200 m²`. Without calculator use, it's the generic message. In ID, the text starts with "Halo HOMYVEST". |
| `motion.spec.ts` | With `reducedMotion: 'reduce'`: no pinned sections (`.pin-spacer` absent), posters shown for the 3D scenes, all copy visible. |
| `a11y.spec.ts` | Inject axe-core (`npm i -D @axe-core/playwright`): no serious or critical violations on the whole page in both themes and both languages. Keyboard: Tab reaches the skip link, nav, doors, calculator fields, idea radios, FAQ, and WhatsApp in a logical order with a visible focus ring. |
| `placeholders.spec.ts` | Counts `[data-placeholder="true"]` captions and writes the list to `qa/placeholders.json` (for REPORT.md). Doesn't fail. |
| `screenshots.spec.ts` | See §3. |

## 3. Screenshot review routine (run after every milestone from M4, and in full at M11)
Viewports: **390 × 844** (mobile), **768 × 1024** (tablet), **1440 × 900** (desktop), **1920 × 1080** (large). Themes: light and dark. Languages: EN, plus ID on mobile and desktop.

Capture:
- every section at rest (`qa/screenshots/sections/<viewport>-<theme>-<lang>-<section>.png`)
- each 3D scene at its key progress points (`06` §7), with the Maxone stops placed next to their renders in `qa/maxone-compare/`
- calculator Steps 1–3 with default values, plus the conflict-warning state
- the header with the wordmark expanded (hover)

**Look at every screenshot** (open the PNGs). For each, check: hierarchy reads at a glance, there's no text over busy image areas without a scrim, no awkward wraps (especially ID at 390 px), no overlap or clipping, nothing touches the screen edge, the B&W discipline holds (colour only in renders and the one zone-green), and the dark theme is as polished as the light one. Fix, recapture, and note what changed in PROGRESS.md.

## 4. Performance checks
1. Production build (`npm run build && npm run preview`).
2. With Playwright on Chromium, mobile profile, CPU throttled ×4 via CDP (`Emulation.setCPUThrottlingRate`) and the network set to "Fast 4G":
   - Collect LCP, CLS and INP-like metrics with a `PerformanceObserver` injected before load. Collect total transferred bytes per type from `Resource Timing`.
   - Scroll through each pinned scene at a steady speed (e.g. `mouse.wheel` 120 px every 50 ms, or Lenis `scrollTo` with duration). Record a performance trace (`browser.startTracing` / `stopTracing`) and compute the frame-duration distribution (p50, p95, max) from the trace's frame events. Flag frames over 50 ms.
3. Repeat the frame test on desktop without throttling.
4. Report all numbers against `09` §7 and `06` §1.7 in REPORT.md. If a budget is missed, lower the tier defaults or simplify, then re-measure. If it's still missed, explain why.

## 5. Final design review (M10)
1. Run Impeccable **critique** on the full-page screenshots (desktop and mobile), then **audit** (a11y, performance, responsive), then **polish**. Apply what fits these docs. Log any conflicts in DECISIONS.md.
2. Review against Taste Skill's `design-taste-frontend` and `03` §9's anti-patterns. Remove anything generic.
3. Walk the flow checklist in `04` §12. Read only the headlines from top to bottom: they should tell the story.
4. Check the copy fit in both languages. Trim or rebalance lines, never facts.
5. Tune the motion: no two competing movements per viewport, every ease from `03` §7, and the skip links work.

## 6. Pre-handoff checklist
- [ ] `npm run test`, `npm run typecheck`, `npm run build` and `npm run e2e` all pass.
- [ ] No `console.error` or warnings in production.
- [ ] All copy from `07` present in both languages. No placeholder text other than the captions.
- [ ] Facts used are exactly those in `02` §6, with footnotes in place.
- [ ] `render/` untouched (`git status` shows nothing there, and the timestamps are unchanged).
- [ ] Posters generated for all 3D scenes; reduced-motion and no-WebGL paths reviewed in screenshots.
- [ ] Favicon, OG image, robots.txt, sitemap.xml and the deploy configs exist.
- [ ] `homyvest.example` placeholders listed.
- [ ] `docs/PROGRESS.md` and `docs/DECISIONS.md` complete.

## 7. `docs/REPORT.md` template
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

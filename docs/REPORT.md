# HOMYVEST website: build report

**Status: complete.** Checklist: [../TASKLIST.md](../TASKLIST.md) · milestone log: [PROGRESS.md](PROGRESS.md) · every decision with its reason and how to undo it: [DECISIONS.md](DECISIONS.md).

- Build started: 2026-11-20 01:08 WIB
- Build finished: 2026-11-20 10:35 WIB
- Working time was about 3 hours 20 minutes. The rest was waiting: the account's usage limit stopped the build twice (02:17–04:53 and 09:45–10:00) and a stream stall froze the scene agents from about 05:17 to 08:07. Each time the work on disk was committed and picked up where it stopped.

## Run it
- `npm install`, then `npm run dev` → http://localhost:5173
- Production preview: `npm run build && npm run preview` → http://localhost:4173
- Tests: `npm run test` (unit) · `npm run e2e` (browser) · `npm run shots` (screenshot review set) · `npm run typecheck`
- Useful URL switches: `?lang=id` · `?tier=high|medium|low` · `?nowebgl=1` · `?nointro=1` · `?maxone=3d|fallback` · `?perf=1`
- Scene harness for developers: http://localhost:5173/dev.html (one 3D scene at a time, with a progress slider)

## What was built
One long page in seven movements, in English and Bahasa Indonesia, light and dark. Screenshots of every section at four screen sizes are tiled in [`qa/screenshots/sheets/`](../qa/screenshots/sheets/) (for example `sections-desktop-light-en.jpg`, `sections-mobile-light-id.jpg`).

| # | Section | What is there |
|---|---|---|
| 0 | Shell | Sticky header that hides during pinned scenes, HOMYVEST → HOMY INVESTASI wordmark animation, intro (the wordmark flies into the header), mobile menu, EN / ID toggle, footer with theme toggle, floating WhatsApp button on phones |
| 1 | `#story` Hero story | Pinned 3D clay story in five beats: idle plot → hybrid stay assembles → office, café and padel court on neighbouring plots → the street comes alive → dissolve into the dusk render with two stats and two buttons |
| 2 | `#about` | Statement, short paragraph, the two doors ("I have empty land" / "I have an idle or unfinished building") with line drawings. Both open the calculator at step 1 with the first field focused |
| 3 | `#team` | HOMYVEST → HomyEight → Behomy on a line that draws itself |
| 4 | `#homyeight` | Intro with three facts, then the Maxone walkthrough: a 3D walk through the lobby and dining room with the real render arriving as a card at each stop, a mini-map with the walked path and stop buttons, and a skip link |
| 5 | `#behomy` | Hybrid-stay diagram (a building elevation whose rooms switch between daily and monthly through the year), four stats with footnotes, what Behomy handles, brands, the "up to 2.5×" note with its footnote |
| 6 | `#projects` | Asymmetric gallery of 13 images, type filters with animated re-layout, full-screen viewer (arrow keys, swipe, Esc) |
| 7 | `#beyond` | Padel hall assembling in 3D, then mini soccer, café and office in a strip that travels sideways on desktop and swipes on phones |
| 8 | `#calculator` | The land check: three steps, results live as you type with a live 3D model, presets, four ideas as selectable cards with "Adjust prices", gauges for an existing building, warnings without red, "How this is calculated", WhatsApp handoff carrying the results |
| 9 | `#next` | Six steps on a line, then the closing block over the dusk render |
| 10 | `#faq` | 11 questions, single-open accordion |

## 3D experiences
| Scene | Shipped as | Notes |
|---|---|---|
| Hero story | **Full 3D** on all tiers; static sequence with posters for reduced motion and no WebGL | Four detailed clay buildings (stay 386 pieces, office 267, café 181, sports 149) that drift in and settle. Top floors are cut open so the rooms show. Radial dissolve from the stay into the dusk render. No frame over 50 ms on desktop in the final measurement |
| Maxone walkthrough | **Procedural 3D room** on high and medium tiers; render-led walkthrough ("fallback B") on low tier and without WebGL; static sequence for reduced motion | Built from the floor plan and seven renders. Compared with the renders stop by stop in [`qa/maxone-compare/`](../qa/maxone-compare/) and passed in 5 build-and-compare rounds, well inside the time-box. 19–26 draw calls, 104k–142k triangles. What was assumed about the room is listed below |
| Padel assembly | **Full 3D with aligned render reveals**; three renders with the stage text as fallback | White-clay hall assembles in three stages and each cleaned render wipes in exactly over the model. The renders are true isometric, so one orthographic camera fits all three. 18 draw calls, about 42,000 triangles. Built with four courts, as the renders show |
| Calculator | **Live 3D + 2D fallback** | Massing models for the maximum building, kos-kosan, ruko, rental houses, warehouse, and an existing building with ghost floors. Dimension labels, orbit and zoom, smooth morphs while typing. 26 unit tests measure every drawn box against the calculator's numbers. 2D plan and floor stack when WebGL is missing |
| Depth parallax | **On** | 28 depth maps (Depth Anything V2 Small). One shared WebGL context for all photos. Off on low tier, with reduced motion, or without WebGL |

### What was assumed about the Maxone room
You gave permission to assume what the renders do not show. In short:
- **Heights:** ceiling 3.6 m, upper floor at 4.0 m, top of the double-height void 8.0 m, street three steps below the floor.
- **Invented:** the upper floor (plain walls, windows, a skylight over the void), beam and downlight positions, the mural, the "BAR" tiles and the display sign (drawn fresh, inspired by the renders, not copied).
- **Closed off:** the rooms behind the curved buffet wall, west of the street-side room, and the core beside it.
- **Left out:** a small outbuilding at the plan's south-east corner (the walk starts there), one black rectangle near the reception that render 1 does not show, and human figures.
- **Changed:** the floor is light grey as in the plan (the renders show it dark); square tables are dark as in the renders (the plan draws them white); two rows of tables sit 10 cm further apart so the aisle takes the camera.
- **Route:** the route in the brief passed through walls, planters and a table, so the camera takes a clear path with the same stops.

The full list is in DECISIONS.md, D22.

## Quality numbers
Measured with `node qa/tools/perf.mjs` on the production build. Raw data: `qa/perf.json`.

| Metric | Budget | Result |
|---|---|---|
| LCP, phone profile (CPU ×4, Fast 4G) | ≤ 2.5 s | **2.18 s** |
| CLS | ≤ 0.05 | **0.003** phone · 0.029 desktop |
| Typing latency in the calculator (INP-like), phone profile | ≤ 200 ms | **56 ms** median, 62 ms worst |
| Initial JavaScript, gzipped | ≤ 180 KB | **179.5 KB** (three.js is not in the first load) |
| Largest 3D chunk, gzipped | ≤ 350 KB | three.js 182 KB; shared canvas code 57 KB; each scene 8–25 KB |
| Frame time while scrolling each scene, desktop | 16.7 ms, none over 50 ms | p50 **16.7 ms** in all four. Hero and the sideways strip: none over 50 ms. Walkthrough and padel: one 67 ms frame each |
| Same, phone profile (CPU ×4) | ≥ 30 fps, no hitch over 50 ms | p95 **16.8–33.4 ms**. One 67 ms frame at the very end of the hero |
| Draw calls | hero ≤ 120 · padel ≤ 120 · Maxone ≤ 220 · calculator ≤ 80 | padel 18 and Maxone 19–26 are inside. Hero and calculator were not recorded in the final run (see known issues) |

Budget notes:
- **First visit on a cold GPU.** The first time a browser draws each 3D scene it has to prepare it. Scrolling very fast (3,000 px per second) through the whole page in a fresh browser, that showed as single frames of 80–280 ms as the walkthrough and the calculator came into range. Before a fix made at the end it was one 1.5 s freeze. In a browser that has drawn the scenes before, the same scroll is a flat 60 fps.
- The frame-time rows above were measured before that last fix (a background shader compile). After it I re-ran the unit and browser tests and the cold-start scroll, but not the per-scene frame timing.
- The test browser ran on this machine's real GPU (Radeon 880M), not software rendering, so the frame times are representative of a mid-range laptop. No physical phone was tested; the phone figures are Chromium's Pixel 7 profile with CPU throttling.

Checks:
- `npm run test`: **76 of 76** (24 locked calculator cases from the spec, 14 geometry cases, 26 for the 3D calculator models, 12 for the Maxone camera route).
- `npm run typecheck`: clean. `npm run build`: clean.
- `npm run e2e`: **66 passed**, 6 skipped by design (hover and desktop-keyboard checks on the mobile profile, and the reverse). Covers every calculator value in the spec in both languages, the doors, WhatsApp links and messages, language switching, the wordmark, reduced motion, and accessibility (axe: no serious or critical violations in either theme or language).
- Screenshot review set: 410 screenshots (4 screen sizes × 2 themes, EN everywhere plus ID on phone and desktop, every section, every 3D scene at its key moments, calculator states, reduced-motion and no-WebGL pages), tiled into 36 contact sheets. I looked closely at about a quarter of the sheets plus every scene individually while building; I did not open all 36.
- Original renders: `node qa/tools/verify-renders.mjs` → **32 of 32 identical** to the snapshot taken before any work.

## Setup outcome
| Item | Result | Notes |
|---|---|---|
| Node / npm | OK | v24.13.0 / 11.6.2 |
| Git | OK | repository initialised; commits after every milestone. Nothing was pushed anywhere |
| Render folder | OK | `renders/`, read-only |
| npm packages | OK | React 19, three 0.187, React Three Fiber 9, drei 10, GSAP 3.15, Lenis, zustand, Vite 8, Vitest 5, Playwright 1.65, sharp, axe |
| **Impeccable** | **Installed and used** | Skill v4.10.0 in `.claude/skills/impeccable`, its five agents in `.claude/agents`, its design hook in `.claude/settings.local.json`. `PRODUCT.md` and `DESIGN.md` are at the project root |
| **Taste Skill** | **Installed and used** | `design-taste-frontend` v2.5.1 only, in `.claude/skills/design-taste-frontend` |
| **Playwright** | **Test runner installed and used** | `@playwright/test` with Chromium; all specs in `qa/` |
| Playwright plugin for Claude Code | **Not installed** | The `claude` command is not on this machine's PATH (Claude Code runs here as a VS Code extension). Optional; see "Needs you" |
| Python depth environment | OK | `.venv-depth` with CPU PyTorch |

### How the plugins were used, and where I did it differently from the brief
- **Impeccable.** Its hook scanned every interface file as it was written (one false alarm, fixed by renaming a component). Its detector was run over the source and over the rendered page in both languages. The rendered page has one kind of finding, seven times: a small label above a section heading. Those stay, because your brief defines that label style and supplies the text for each one. Its `init` interview could not be held with you away, so `PRODUCT.md` was written from your brief and says so. Its deeper `critique` and `audit` commands, which start their own reviewer agents, were **not run**; the same ground was covered with screenshots at every size, the automated accessibility checks and the performance measurements.
- **Taste Skill.** Used as a review lens rather than as a page generator. Its own kit deals a palette and page structure, forbids captions under images, limits every section to one or two screens and reserves scroll-driven 3D for tech companies, all of which contradict your brief. Its principles were applied: plain copy, one system, equal edges, photographs lead, quiet hover responses, nothing generic. Its own finish gate was not run.
- **Playwright.** Beyond the specs the brief lists, it drove every visual check while building, the performance measurements, the favicon and share-image rendering, and the 3D-versus-render comparison sheets.
- **Sub-agents.** The four large 3D scenes were built in parallel by four sub-agents on a shared foundation that was built and calibrated first, then reviewed and integrated here. The brief did not ask for this; it kept each scene's detail intact and saved time.

## Decisions worth knowing
1. **The padel line no longer says "eight courts"** (D18). The padel renders show four courts, so the model has four. See "Needs you", item 1.
2. **Pinned scenes use CSS sticky** instead of GSAP's pin (D7): smoother with touch scrolling, no layout jumps.
3. **Clay lighting was re-calibrated by measurement** (D8): with the documented values the white clay rendered grey and flat.
4. **The Maxone route and room assumptions** (D22), summarised above.
5. **No motion blur on the hero's sideways swipes** (D21): it cost a slow frame at every swipe.
6. **The hero paints first; the sections below mount right after the intro** (D25). This took phone LCP from 2.9 s to 2.2 s.
7. **Indonesian and one animation plugin load on demand** (D25), to stay inside the first-load budget.
8. **Long jumps happen behind a quick fade** (D14), so a jump from the header to the calculator does not race through three 3D scenes.
9. **Step 2 on phones is a stacked list**, not a carousel, so the four ideas stay comparable.
10. **Where Impeccable or Taste Skill disagreed with the brief, the brief won** (D10, D11, D26).

## Needs you
1. **Confirm the number of padel courts.** Your copy said "Ground floor: eight courts, a café and changing rooms." The renders show four, so the line now reads "Ground floor: the courts, a café and changing rooms." (ID: "Lantai dasar: lapangan, kafe, dan ruang ganti."). If the real hall has eight, edit `beyond.padel.stages` in `src/i18n/en.js` and `id.js`.
2. **Project captions.** 26 images show the placeholder "Project Name / City, Province / Type · Year". Fill them in one file, `src/content/projects.js`. The list is in `qa/placeholders.json`:

   | Where | Images |
   |---|---|
   | Projects gallery (13) | `facades/best`, `facades/facade-1`, `facades/facade-2`, `facades/benhil-1`, `facades/benhil-2`, `interiors/interior-1` … `interior-8` |
   | Maxone walkthrough (7) | `maxone/1` … `maxone/7` |
   | Beyond stays (6) | `padel-clean/padel-1` … `padel-3`, `others/athero-3`, `cafe/cafe`, `office/office-1` |

   For each: project name · city, province · type · year or status.
3. **Confirm the project categories** (Kost / Guesthouse / Homestay / Villa) in the same file. They are provisional.
4. **Domain.** Replace `homyvest.example`: 10 occurrences in `index.html` (6), `public/robots.txt` (2) and `public/sitemap.xml` (2).
5. **Higher-resolution versions** of `Benhil-1`, `Benhil-2` and `facade (2)`. They are kept small on screen because the files are small.
6. **Section labels.** If you would rather not have the small labels above headings ("Built by HomyEight", "Run by Behomy"), say so; Impeccable advises against them, your brief asks for them.
7. **Playwright plugin for Claude Code** (optional): in a terminal where `claude` works, run `claude plugin install playwright@claude-plugins-official`.
8. **Deploy** when you have a host and domain: `npx vercel` or `npx netlify deploy --prod`. Both config files are in place. Nothing has been deployed.

## Known issues
- **Not tested on a real phone.** Phone results come from Chromium's device emulation with CPU throttling.
- **First visit, very fast scrolling:** single slow frames of 80–280 ms as the walkthrough and calculator scenes first come into range (see budget notes).
- **Draw calls for the hero and the calculator were not recorded** in the final run; both agents' earlier checks had them inside budget, but I have no final figure to quote.
- **Padel cut-outs on the dark theme:** the cleaned images for stages 2 and 3 contain a few small white patches that show against dark paper. The fix belongs in `scripts/clean-padel.mjs`, which was left as delivered.
- **Maxone posters and comparison images** were captured just before a final colour adjustment and are slightly more saturated than the live room.
- **Maxone room has no ambient occlusion** (it conflicts with the transparent canvas), so interiors are clean but a little flat.
- **`npm run test` does not start from Git Bash** on this machine (a Vitest path-case problem). It passes from PowerShell, cmd and the VS Code terminal.
- **Scroll position after a reload on a first visit** may not be restored, because the sections below the hero mount a moment after the first paint. Return visits and reloads later in the same session restore normally.
- The 122 MB of raw screenshots in `qa/screenshots/` are on disk but not in git; the contact sheets are.

# HOMYVEST website: build report

**Status: IN PROGRESS.** This report is updated as work lands, so it is accurate even if a session is interrupted. Last update: 2026-11-20 05:20 WIB. Live checklist: [../TASKLIST.md](../TASKLIST.md).

- Build started: 2026-11-20 01:08 WIB
- Session 1 stopped at 02:17 WIB when the account's usage limit was reached. Session 2 resumed at 04:53 WIB.
- Build finished: _not yet_

## Run it
- `npm install`, then `npm run dev` → http://localhost:5173
- Production preview: `npm run build && npm run preview` → http://localhost:4173
- Tests: `npm run test` (unit, run it from PowerShell or the VS Code terminal, not Git Bash) · `npm run e2e` (browser) · `npm run shots` (screenshot review set)
- Useful URL switches: `?lang=id` · `?tier=high|medium|low` · `?nowebgl=1` · `?nointro=1` · `?maxone=3d|fallback` · `?perf=1`
- Scene harness for developers: http://localhost:5173/dev.html

## What was built
One long page in seven movements, in English and Bahasa Indonesia, light and dark.

| # | Section | What is there |
|---|---|---|
| 0 | Shell | Sticky header that hides during pinned scenes, HOMYVEST → HOMY INVESTASI wordmark animation, intro (logo flies into the header), mobile menu, EN / ID toggle, footer with theme toggle, floating WhatsApp on phones |
| 1 | `#story` Hero story | Pinned 3D clay story in five beats, ending on the dusk render with two stats and two buttons. _Status: see "3D experiences"._ |
| 2 | `#about` | Statement, short paragraph, the two doors ("I have empty land" / "I have an idle or unfinished building") with line drawings; both open the calculator at step 1 with the first field focused |
| 3 | `#team` | HOMYVEST → HomyEight → Behomy on a line that draws itself |
| 4 | `#homyeight` | Intro with three facts, then the Maxone walkthrough: stop cards, mini-map with the walked path and stop buttons, skip link. _Status: see "3D experiences"._ |
| 5 | `#behomy` | Hybrid-stay diagram (a building elevation whose rooms switch between daily and monthly through the year), four stats with footnotes, what Behomy handles, brands, the "up to 2.5×" note with its footnote |
| 6 | `#projects` | Asymmetric gallery of 13 images, type filters with animated re-layout, full-screen viewer (arrow keys, swipe, Esc) |
| 7 | `#beyond` | Padel hall scene, then mini soccer, café and office in a strip that travels sideways on desktop and swipes on phones. _Status: see "3D experiences"._ |
| 8 | `#calculator` | The land check: three steps, results live as you type, presets, four ideas as selectable cards with "Adjust prices", gauges for an existing building, warnings without red, "How this is calculated", WhatsApp handoff carrying the results |
| 9 | `#next` | Six steps on a line, then the closing block over the dusk render |
| 10 | `#faq` | 11 questions, single-open accordion |

## 3D experiences
| Scene | Shipped as | Notes |
|---|---|---|
| Hero story | _in progress_ | Section runs end to end; detailed building models in progress |
| Maxone walkthrough | Render-led walkthrough ("fallback B") live now; 3D room _in progress_ | The 3D room stays behind `?maxone=3d` until it passes its comparison with the renders |
| Padel assembly | _in progress_ | |
| Calculator | 2D plan + floor stack live now; live 3D _in progress_ | Numbers never depend on the 3D |
| Depth parallax | On | 28 depth maps; one shared WebGL context; off on low tier, reduced motion, or without WebGL |

## Quality numbers
_To be measured on the final build (`node qa/tools/perf.mjs`)._

Checks so far: 38/38 unit tests (24 locked calculator cases from the spec plus 14 geometry cases). First browser run on the partly built page: 56 passed, and two real problems it found were fixed.

## Setup outcome
| Item | Result | Notes |
|---|---|---|
| Node / npm | OK | v24.13.0 / 11.6.2 |
| Git | OK | repository initialised; a commit after every milestone |
| Render folder | OK | `renders/`, read-only; SHA-256 of all 32 originals recorded in `qa/renders-originals.sha256.txt` before any work |
| npm packages | OK | React 19, three 0.187, React Three Fiber 9, drei 10, GSAP 3.15, Lenis, zustand, Vite 8, Vitest 5, Playwright 1.65, sharp, axe |
| **Impeccable** | Installed | Skill v4.10.0 in `.claude/skills/impeccable`, its five agents in `.claude/agents`, its design hook active in `.claude/settings.local.json` (it scanned every UI file as it was written). `PRODUCT.md` and `DESIGN.md` are at the project root |
| **Taste Skill** | Installed | `design-taste-frontend` v2.5.1 only, in `.claude/skills/design-taste-frontend` |
| **Playwright** | Test runner installed | `@playwright/test` with Chromium; all specs in `qa/` |
| Playwright Claude Code plugin | **Not installed** | The `claude` command is not on this machine's PATH (Claude Code runs as a VS Code extension here). See "Needs you" |
| Python depth environment | OK | `.venv-depth` with CPU PyTorch; 28 depth maps generated with Depth Anything V2 Small |

## Decisions worth knowing
Full list with reasons and how to undo each: [DECISIONS.md](DECISIONS.md).

1. **Pinned scenes use CSS sticky** instead of GSAP's pin (D7): smoother with touch scrolling, no layout jumps. Behaviour is the same.
2. **Clay lighting was re-calibrated by measurement** (D8): with the documented values the white clay rendered grey and flat. Neutral tone mapping and a light from the upper left, slightly behind, give the white-model look the brief describes.
3. **The 3D ground is the page itself** (D9): canvases are transparent, so the model sits on the page colour in both themes.
4. **The four large scenes were built by parallel sub-agents** on a shared, calibrated foundation (D12), and integrated and reviewed by the main session.
5. **Where Impeccable or Taste Skill disagreed with the brief, the brief won** (D10, D11): section labels above headings, the large display size and the stats band stay, because the docs ask for them. Taste Skill's own page generator was not used; its principles were applied as a review lens.
6. **Long jumps happen behind a quick fade** (D14): a smooth scroll from the header to the calculator would race through three 3D scenes.
7. **Step 2 on phones is a stacked list**, not a carousel, so the four ideas stay comparable.
8. **Help text colour is one step darker** than the brief's token (D6) so it passes contrast on both paper tones.
9. **Depth parallax draws through one shared WebGL context** copied into a small canvas over each photo, so text over photos, the viewer and clipping all behave like plain images.
10. **Render-led walkthrough uses a slow drift instead of depth parallax** on its full-bleed renders: seven stacked depth views would compete with the scroll.

## Needs you
0. **Confirm the number of padel courts.** Your copy said "Ground floor: eight courts, a café and changing rooms." The padel renders show four courts (three side by side and one turned), so the 3D model has four. To avoid a visible contradiction the line now reads "Ground floor: the courts, a café and changing rooms." (ID: "Lantai dasar: lapangan, kafe, dan ruang ganti."). If the real hall has eight, tell me or edit `beyond.padel.stages` in `src/i18n/en.js` and `id.js`.
1. **Project captions.** Every image shows the placeholder "Project Name / City, Province / Type · Year". Fill them in one file: `src/content/projects.js`.
2. **Confirm the project categories** (Kost / Guesthouse / Homestay / Villa) in the same file. They are provisional.
3. **Domain.** Replace `homyvest.example` in `index.html` (6 places), `public/robots.txt` and `public/sitemap.xml`.
4. **Higher-resolution versions** of `Benhil-1`, `Benhil-2` and `facade (2)`. They are kept small on screen because the files are small.
5. **Playwright plugin for Claude Code** (optional): in a terminal where `claude` works, run `claude plugin install playwright@claude-plugins-official`.
6. **Deploy** when you have a host and domain: `npx vercel` or `npx netlify deploy --prod`. Both config files are in place.

## Known issues
- `npm run test` fails to start from Git Bash on this machine (a Vitest path-case problem). It passes from PowerShell, cmd and the VS Code terminal.
- _More to be added after final QA._

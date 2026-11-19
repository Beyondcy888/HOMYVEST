# 00 — Start here

This kit tells an AI coding agent (Claude Code) how to design and build the HOMYVEST website from start to finish without supervision. Part A is for the human who launches it. Part B is for the agent.

---

## Part A — For the human (5 minutes before you leave)

### A1. Folder layout
Put everything in one project folder, for example `homyvest/`:

```
homyvest/
├── CLAUDE.md                 ← from this kit (Claude Code loads it automatically)
├── .claude/settings.json     ← from this kit (pre-approved commands, see A3)
├── docs/                     ← from this kit (00 to 10)
├── scripts/                  ← from this kit (asset scripts, already tested)
├── reference/                ← from this kit (verified calculator code and tests)
└── render/                   ← YOUR ORIGINAL RENDERS (unzipped, untouched)
    ├── cafe/  facades/  interiors/  maxone/  office/  others/  padel-court/
```

It's fine if your renders sit one level deeper (`render/renders/...`). The scripts detect that automatically. Use the **original, unzipped** files: never re-export or compress them.

### A2. Check the machine has
- **Node.js 20.19+** (22 LTS recommended): run `node -v`
- **Git**: run `git --version`
- **Python 3.10+** (recommended, for the 3D depth effect on photos): run `python3 --version`. Without it the site still works, just without that effect.
- **Claude Code** installed and logged in: run `claude --version`
- **About 5 GB of free disk** and a stable internet connection (packages, a browser for testing, a ~100 MB depth model)

### A3. Let the agent work without asking permission
The agent will run many commands (installs, builds, tests). If Claude Code stops to ask "may I run this?", it will sit there until you come back. Choose one:

- **Recommended:** keep `.claude/settings.json` from this kit in the project. It pre-approves the commands this job needs (npm, npx, node, python, git, playwright, file edits).
- **Fully hands-off:** start Claude Code with `claude --dangerously-skip-permissions`. Only do this in this dedicated project folder, on a machine with nothing sensitive in reach, because the agent can then run any command without asking.

### A4. Launch
Open a terminal in the project folder and run `claude` (or the command from A3). Then paste this message:

> Read CLAUDE.md and docs/00_START_HERE.md, then build the HOMYVEST website end to end, following every document in docs/ in order. Work autonomously and don't wait for me. Log progress in docs/PROGRESS.md and decisions in docs/DECISIONS.md. When you're done, write docs/REPORT.md.

If the session stops or runs out of context, start Claude Code again in the same folder and paste: **"Resume the HOMYVEST build from docs/PROGRESS.md."**

### A5. When you come back
Open `docs/REPORT.md`. It lists what was built, how to run it (`npm run dev`), screenshots in `qa/screenshots/`, and **what still needs you**: real project captions, the domain, and anything the agent couldn't finish.

---

## Part B — For the agent

### B1. Mission
Build a bilingual (English default, Bahasa Indonesia toggle), story-driven, single-page marketing website for HOMYVEST. Visitors are Indonesian landowners with idle land or an idle or unfinished building. After a few minutes on the site, they must know:
1. **who we are**: HOMYVEST, with partners HomyEight (builds) and Behomy (operates)
2. **what we do**: turn idle land and buildings into earning properties
3. **why us**, without us ever saying "USP": one team from empty land to monthly report; not only guesthouses; hybrid operations that keep rooms full; honest numbers first
4. **what their own land could become**, through the calculator with live 3D
5. **how to move forward**: a clear path and a WhatsApp button that carries their results

The site must feel premium, calm and confident: black-and-white, Archivo typeface, with colour coming only from the property renders. It also needs three signature 3D moments: the hero story, the Maxone walkthrough and the padel assembly. Smoothness matters more than spectacle.

### B2. Operating rules
1. **Unattended.** Never stop to ask. When a choice is ambiguous, pick what best serves the brief, log it in `docs/DECISIONS.md` (date, decision, reason, how to undo), and keep going.
2. **Progress log.** Create `docs/PROGRESS.md` now. After each milestone, append: milestone, status, what was done, verification results, known issues, next step.
3. **Git.** Run `git init` in M0 if needed. Commit after each milestone (`M3: calculator engine + tests (all green)`). Never commit `node_modules`, `.venv-depth`, `.cache`, or `render/` (see `.gitignore` in 01).
4. **Fallback-first.** Build every section so it works as plain HTML/CSS with images first, then layer GSAP and 3D on top. If a 3D experience can't reach the quality bar on a device tier, ship its fallback for that tier and log it.
5. **Truthfulness.** Facts come only from `02_PROJECT_BRIEF.md` §6. Calculator numbers come only from `05`. 3D in the calculator must match the numbers exactly. Captions stay as styled placeholders until the owner fills them in (see `08` §5).
6. **Originals are sacred.** Read `render/` and never write to it.
7. **Use the design skills.** Impeccable and Taste Skill are installed in M0. Follow `03` §10 for when to run them.
8. **Verify visually.** Use Playwright (`10` §3) to screenshot your work at several viewports and look at the screenshots before declaring anything done.
9. **Time-box heavy experiments.** If one approach to a 3D scene has eaten ~2 hours without converging, switch to the documented fallback approach, log it, and move on. Come back only if time remains at the end.

### B3. Milestones (do them in order)

| # | Milestone | Main doc | Exit check |
|---|---|---|---|
| M0 | Setup: tools, skills, plugins, packages, Python env, git | 01 | `docs/PROGRESS.md` has a green setup checklist; `npm run dev` serves a blank page |
| M1 | Asset pipeline: clean padel images, optimize all renders, depth maps | 08 | `src/content/media-manifest.json` lists 35 images; `public/media/` filled; `depth-status.json` exists (available true or false) |
| M2 | Foundations: design tokens, fonts, i18n, layout shell, header, footer, wordmark and its animation, Lenis + GSAP wiring | 03, 09 | Wordmark expands HOMYVEST → HOMY INVESTASI on hover; EN/ID toggle switches all shell text; light and dark mode both work |
| M3 | Calculator engine (pure TypeScript) + Vitest | 05 | `npm run test` is all green, including every case in 05 §10 |
| M4 | All sections built statically with real copy and images, no 3D yet | 04, 07, 08 | Full page readable in EN and ID on 375 px and 1440 px; no console errors |
| M5 | 3D foundation + hero story | 06 §1–2 | Scrolling the hero is smooth (see 06 §1.7 budgets); reduced-motion fallback works |
| M6 | Maxone walkthrough | 06 §3 | Camera glides the full route with no stutter; render cards appear at stops; mini-map tracks position |
| M7 | Padel assembly | 06 §4 | Three stages assemble and each resolves into its cleaned render |
| M8 | Calculator UI + live 3D | 05, 06 §5 | UI shows every value in 05 §10 for default inputs; 3D matches the numbers; WhatsApp link carries the results |
| M9 | Depth parallax on photographic renders | 06 §6 | Effect visible and subtle; disabled cleanly when depth maps are missing |
| M10 | Design polish: Impeccable critique/audit/polish, Taste review, motion tuning, copy fit in both languages | 03 §10 | Issues found are fixed or logged with a reason |
| M11 | QA, performance, build, report | 10 | All Playwright specs pass; `npm run build` succeeds; `docs/REPORT.md` written |

### B4. Definition of done
- `npm run build` produces a static `dist/` with no errors or warnings that matter. `npm run preview` serves it.
- Every section in `04` exists, in order, in both languages, with the copy from `07`.
- The calculator passes all tests and its UI and 3D show exactly the spec values.
- The hero story, Maxone walkthrough and padel assembly run smoothly on a mid-range laptop and degrade gracefully on phones, on reduced motion, and without WebGL.
- WhatsApp buttons open `https://wa.me/6282110106088` with a prefilled message, which includes calculator results when available.
- Lighthouse-style budgets from `09` §7 are met or the gap is explained in the report.
- `docs/REPORT.md` exists (template in `10` §7).

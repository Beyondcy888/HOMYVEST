# HOMYVEST build — decisions

Each entry: date · decision · reason · how to undo.

## 2026-11-20

### D1. Project lives in the workspace root; the dev pack stays untouched
- **Decision:** the kit zip was extracted and its `CLAUDE.md`, `docs/`, `scripts/`, `reference/` and `.claude/settings.json` were placed in `d:\BEHOMY\HOMYVEST`. `HOMYVEST-DEV-PACK/` is left exactly as delivered.
- **Reason:** `00_START_HERE.md` A1 asks for this layout. The loose docs in the pack are byte-identical to the ones in the zip (hash-checked).
- **Undo:** delete the copied files; the pack still has the originals.

### D2. Render folder is `renders/`
- **Decision:** originals are read from `renders/` (contains `maxone/` and `padel-court/`). Nothing is ever written there.
- **Reason:** that is where the owner put them; the kit scripts auto-detect `renders/`.
- **Proof of no modification:** `qa/renders-originals.sha256.txt` holds SHA-256, size and timestamp of all 32 originals, taken before any work. Re-checked at M11.

### D3. `.claude/settings.json` from the kit was installed
- **Decision:** the kit's permission allowlist (npm, npx, node, git, python, basic file commands; denies `git push` and `rm -rf render`) is in `.claude/settings.json`.
- **Reason:** `00_START_HERE.md` A3 recommends it for an unattended run, and the owner asked for the whole pack to be executed.
- **Undo:** delete the `permissions` block from `.claude/settings.json`.

### D4. Unrelated folders are kept out of git
- **Decision:** `Template-Analisis-Tapak-Zoning-Site-Planning-mindelevate/` (purchased spreadsheet templates) and `HOMYVEST-DEV-PACK/` are in `.gitignore`.
- **Reason:** neither is part of the website; the template pack is third-party paid content.
- **Undo:** remove the lines from `.gitignore`.

### D5. Task list at the project root
- **Decision:** `TASKLIST.md` (root) is the at-a-glance checklist the owner asked for; `docs/PROGRESS.md` is the detailed milestone log the kit asks for.
- **Reason:** the owner asked for a task list to follow progress and to resume from.
- **Undo:** n/a.

### D6. `--muted` is one step darker than the doc token
- **Decision:** `--muted` is `#6f6d67` in the light theme (docs/03 gives `#74726C`).
- **Reason:** `#74726C` passes 4.5:1 on `--paper` but only reaches about 4.2:1 on `--paper-2`, where help text also sits. The darker value passes on both.
- **Undo:** change `--muted` in `src/styles/tokens.css`.

### D7. Pinned scenes use CSS `position: sticky`, not GSAP's `pin: true`
- **Decision:** `src/components/layout/PinnedScene.jsx` pins the stage with CSS sticky inside a tall wrapper; one ScrollTrigger (no pin) reports progress 0..1 and registers itself in `window.__homyvest.triggers`.
- **Reason:** sticky is handled by the browser compositor. There is no pin-spacer, no layout jump when a lazy section mounts above, and no jitter with native touch scrolling. docs/06 §1.5 asks for `pin: true`; the behaviour the docs want (one trigger, scrub, progress in a ref) is unchanged.
- **Undo:** replace the wrapper with a ScrollTrigger using `pin: true` and `end: '+=…'`.

### D8. Clay lighting: Neutral tone mapping, key light from the upper left and slightly behind
- **Decision:** scenes use Khronos PBR Neutral tone mapping (exposure 1), key light 2.7 from `[-0.7, 0.66, -0.28]`, hemisphere 1.7, environment 0.15.
- **Reason:** measured on a test building. With the doc's values (ACES, exposure 1.05, environment 0.6, light from the upper-left-front) the white clay rendered grey (about `#d5d5d3`) and flat: ACES compresses whites, RoomEnvironment is brighter on one side and fought the key light, and a light on the camera's side hid every shadow behind the model. The calibrated set gives lit faces about `#f0eee6`, shaded faces `#cfcdc7`, and a soft shadow falling toward the viewer, which is the white-model-on-white-ground look docs/03 §5 describes.
- **Undo:** defaults live in `src/three/shared/SceneCanvas.jsx` and `Stage.jsx`.

### D9. The 3D ground is the page itself
- **Decision:** canvases are transparent; `<Ground/>` is an invisible shadow-catcher plane. There is no paper-coloured ground plane.
- **Reason:** the ground then matches the page exactly in both themes, with no horizon to hide and no colour drift from tone mapping.
- **Undo:** add a plane with a paper-coloured basic material in `Ground`.

### D10. Impeccable's rules that conflict with the docs
- **Eyebrows:** Impeccable's craft floor bans a small label above a heading. docs/03 defines `--t-eyebrow` and docs/07 supplies eyebrow copy that carries real information ("Built by HomyEight", "Run by Behomy"). **The docs win.** The labels are kept, set as a quiet index line beside a hairline rather than as decorative kickers.
- **Display size:** Impeccable caps display type at 6rem; docs/03 sets `clamp(3rem, 8.5vw, 9.5rem)`. The docs win.
- **Hero-metric template:** Impeccable discourages "big number, small label". docs/03 §8 and docs/04 ask for exactly that in the Behomy stats band. The docs win; the figures are real and footnoted.
- **Init interview:** Impeccable's init wants a live interview. The owner was away and docs/01 §5.1 says to answer from the brief, so `PRODUCT.md` was written from docs/02 and says so at the top.

### D11. Taste Skill is used as a review lens, not as a build pipeline
- **Decision:** `design-taste-frontend` v2.5 is installed and its principles are applied (plain copy, one system, equal edges, hover micro-interactions, no fade-in on every section, real photographs lead). Its own kit (starter.html, dealt palettes and layouts, the `gate.mjs` finish gate) is not used.
- **Reason:** the kit deals its own palette, hero and section structure, bans captions under images, limits every section to one or two screens and forbids scroll-driven scenes outside tech sites. All of that contradicts docs/03, docs/04 and docs/06, and docs/03 §10 says the docs win.
- **Undo:** n/a.

### D12. The four large 3D scenes were built by parallel sub-agents
- **Decision:** after the shared foundation (clay look, assembly engine, pinned-scene and lazy-mount components, harness, `docs/SCENE_GUIDE.md`) was built and calibrated, four sub-agents built the hero story, the Maxone walkthrough, the padel assembly and the calculator's 3D, each inside its own folders. The main session built everything else and integrated and reviewed their work.
- **Reason:** the scenes are independent, each is large, and the owner asked for the best possible 3D. Separate contexts keep each scene's detail intact.
- **Undo:** n/a.

### D13. The image component is used as `<Picture>`
- **Decision:** `src/components/media/Img.jsx` exports `Picture` (and `Img` as default, as docs/08 names it). JSX uses `<Picture id=…/>`.
- **Reason:** Impeccable's design hook reads `<Img id=…/>` as a bare `<img>` tag with no `src` and reports a broken image on every use.
- **Undo:** import the default export under any name.

### D14. Long in-page jumps go behind a quick veil
- **Decision:** `scrollToTarget` glides for short distances; for jumps longer than 2.5 viewports the page fades for 160 ms, jumps, and fades back.
- **Reason:** a 1.2 s smooth scroll from the header to the calculator would race through three pinned 3D scenes, mounting and unmounting canvases on the way.
- **Undo:** remove the `far` branch in `src/lib/scroll/lenis.js`.

### D15. One three.js warning is filtered
- **Decision:** `SceneCanvas.jsx` filters the message "THREE.Clock: This module has been deprecated".
- **Reason:** React Three Fiber 9.8 creates a `THREE.Clock` internally and three 0.187 warns about it on every canvas. It is not this project's code; everything else still reaches the console.
- **Undo:** delete the `setConsoleFunction` block. Remove it when R3F updates.

### D16. Run unit tests from PowerShell or cmd, not Git Bash
- **Decision / known issue:** `npm run test` passes from PowerShell, cmd and the VS Code terminal. From Git Bash, Vitest 5 fails to load with "Cannot read properties of undefined (reading 'config')".
- **Reason:** a drive-letter/path-case difference under MSYS makes Vitest load two copies of its runner. Not a code problem.

### D17. Calculator store details
- **Decision:** besides the documented state, the store persists `edited` (which example prices the visitor has replaced, for the "Example" tag) and keeps `touched`, `entry` and `focusRule` in memory only. Restored values that differ from the examples count as "touched", so WhatsApp links carry them.
- **Reason:** docs/05 §4 and §13 describe these behaviours without fixing where the flags live.


### D18. The padel line no longer says "eight courts"
- **Decision:** `beyond.padel.stages[0]` reads "Ground floor: the courts, a café and changing rooms." (ID: "Lantai dasar: lapangan, kafe, dan ruang ganti."). docs/07 §8 has "eight courts" / "delapan lapangan".
- **Reason:** the padel renders show four glass-walled courts (three side by side and one turned; each has its net and service lines, and the figures in the render give the scale: 10 × 20 m each). docs/06 §4.3 describes "8 courts in 4 blocks of 2", which counts each court's two halves. The 3D model is built from the renders, so it has four. A page that says eight beside a model and a render that show four would be a visible false claim. docs/02 §6 says to rewrite a sentence rather than use a number that is not certain, so the number was removed, not replaced.
- **Undo:** edit the two strings in `src/i18n/en.js` and `src/i18n/id.js` (and the expected text in `qa/motion.spec.ts`). Flagged for the owner in REPORT.md.

### D19. The main session built the Maxone section shell; fallback B drifts instead of using depth parallax
- **Decision:** `src/sections/HomyEight/Walkthrough.jsx`, `MiniMap.jsx` and `StopCard.jsx` (cards, mini-map, render-led fallback B, static mode) were written by the main session on top of the sub-agent's route data (`src/three/maxone/route.js`); the sub-agent builds only the 3D room. In fallback B the full-bleed renders move with a slow Ken Burns drift and cross-fade; they do not also use the depth-parallax shader.
- **Reason:** after the first session was cut off by the usage limit, the walkthrough had to be whole without waiting for the 3D room. Seven stacked full-bleed depth views would all redraw during the scroll and compete with it; the drift alone gives the sense of travel. The cards over the 3D room do use depth parallax, paused while a card is off stage.
- **Undo:** n/a.

### D20. The 3D room is off by default until it passes its comparison
- **Decision:** `SCENE_READY` in `Walkthrough.jsx` gates the 3D room. While it is false every visitor gets fallback B and `?maxone=3d` shows the room.
- **Reason:** docs/06 §3.11 time-box: an unconvincing room must not ship as the default.
- **Undo:** set `SCENE_READY = true`.

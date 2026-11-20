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

### D21. Hero story: deviations from docs/06 §2
- **World mirrored front to back.** Plots run away from the camera and the road is on the camera's side, so the calibrated light (D8) throws shadows toward the viewer. The story and choreography are unchanged.
- **No motion blur on the sideways swipes.** docs/06 §2.4 asks for a CSS blur on the canvas during swipes. Measured: switching the filter on and off cost a 50–100 ms frame per swipe. Smoothness wins; the swipe itself is eased.
- **Neighbouring plots fade into the page** ("street fog": fragments fade with distance along the street) so one plot is in focus at a time; the view opens up for the wide shot.
- **Top floors are cut at 1.4 m** (a section cut) instead of simply having no roof, so the rooms read from the 32° camera.
- **The slide labels (stay · office · café · sports) sit in the text column**, not bottom-centre, so nothing is ever drawn over the model.
- **Piece counts:** stay 386, office 267, café 181, sports 149 (spec: about 360 / 300 / 220 / 200).
- **Text warm-up.** Hidden headlines are painted once at 0.5% opacity so their glyphs are ready (removes 50–150 ms frames). On phones this waits for the first touch, because text painted before any interaction is counted as the page's Largest Contentful Paint.
- **Undo:** `src/three/hero/*`, `src/sections/Story/*`.

### D22. Maxone walkthrough: route and room assumptions
The owner gave permission to assume what the renders and plan do not show. Everything assumed, changed or left out:
- **Heights:** ceiling 3.6 m, beams down to 3.05 m, upper floor at 4.0 m, glass rail to 5.1 m, timber grid at 7.5 m, top of the void 8.0 m, street 0.45 m below the floor (three steps).
- **The line at the south third of the hall** is built as a timber window wall with brick piers (as render 6 shows), not as a pergola beam. The tables beyond it sit in a street-side room under the sage pergola. No door is modelled into that room; the camera looks in through the windows.
- **Upper floor:** plain massing with blank walls, invented windows on the street and entrance sides, and a roof with a skylight over the void. The mezzanine glass rail is on two edges of the void only. Beam and downlight positions are invented.
- **Closed parts:** the area behind the curved buffet wall, the block west of the street-side room and the core east of it are solid closed rooms. The core's outer faces are lined in timber with globe lights, copied from its inner face in render 6.
- **Left out:** the small tiled outbuilding at the south-east corner of the plan (the walk starts there, and the steps are made full width); a second black rectangle the plan draws near the reception (render 1 shows a clear view from that spot); human figures.
- **Entrance side:** a glazed wall with white mullions; the entrance doors stand open.
- **Furniture:** the two middle rows of tables are 0.1 m further apart than the plan, so the aisle takes the camera. Square table tops are dark as in the renders, not white as the plan draws them. The buffet cabinets are simplified.
- **Floor:** light grey tiles (the plan's and the spec's values), not the dark floor of the renders.
- **Drawn fresh, inspired by the renders, not copied:** the passport-stamp mural, the mustard line drawing, the "BAR" letter tiles and the display sign. Plants are stylised low-poly.
- **Light and colour:** sun from the south-east at 38°. Navy, salmon, mint, burgundy, timber, beige, counter tile, table tops and deck were moved toward colours sampled from the renders; mustard, sage, leaf greens, ceiling greys and the exterior cladding were chosen by eye. No ambient occlusion (it conflicts with the transparent canvas); a shadowless fill light stands in.
- **Route:** the route in docs/06 §3.7 passes through the gate wall, the planter beds and a table. The built route is: street → steps → walkway → entrance → S1 just inside the doors → S2 from the east lobby looking west → north lane → S3 mid-hall, then looking back from the west lane → S4 look up → S5 in the aisle looking south through the windows → rise to the top view, north up, dissolving into the plan. Dwell windows were shifted by a few percent so no turn is abrupt. A unit test keeps the path at least 0.35 m from walls.
- **Far jumps** (a stop button, the skip link) cut the camera straight to the new place instead of sweeping it through walls.
- **Undo:** `src/three/maxone/*`. To ship the render-led version instead, set `SCENE_READY = false` in `src/sections/HomyEight/Walkthrough.jsx`.

### D23. Padel assembly
- **One orthographic camera fits all three renders.** Measured: the renders are true isometric (ground edges at 29.95–29.98°, so elevation 35.26°, azimuth 45°), not the 37.5–40° / 42–44° estimated in docs/06 §4.2.
- **Four courts**, as the renders show (see D18). Site about 41.7 × 37.9 m.
- **The roof shells are their own extruded geometry** dropped as rigid bodies, not boxes. The slab is always present. The wipe continues in one direction (in, then out the far side). One slow zoom across the whole scene rather than a reset per stage.
- **Known:** the cleaned cut-outs for stages 2 and 3 contain a few small enclosed white patches that show on the dark theme. The fix belongs in `scripts/clean-padel.mjs`, which was left as delivered.

### D24. Calculator 3D
- **Its own small morph renderer** instead of the shared assembly engine, because the model must morph while the visitor types (heights, footprints, unit counts), which the assembly engine cannot do.
- **Labels are plain DOM**, positioned from the 3D each frame, not drei's `<Html>` (which threw on unmount under React 19).
- **Wheel zoom is armed by a click or drag on the model** and released when the pointer leaves, so scrolling the page over the model still scrolls the page. On touch, a vertical swipe scrolls the page, a horizontal drag rotates, two fingers zoom and rotate.
- **Camera from the front left** so the lit side faces the viewer.

### D25. First paint and first-load size
- **The hero paints first.** On a first visit, the nine sections below the hero mount right after the intro, as a React transition. Mounting everything up front put a 1.4 s task (throttled phone) before the first paint. Reloads and return visits mount everything at once so the browser can restore the scroll position.
- **Indonesian and the gallery's FLIP plugin load on demand**, which brought the first load from 193 KB to 176 KB of JavaScript (gzipped; budget 180).
- **Every scene compiles its shaders at mount** and the depth effect decodes textures off the main thread and uploads one per frame, which removed the one-off slow frames.
- **Undo:** `src/sections/Sections.jsx` (set the initial `below` state to `true`), `src/i18n/I18nProvider.jsx`.

### D26. Impeccable's detector: seven findings left standing
- **Decision:** `impeccable detect` on the rendered page reports only "kicker above heading", seven times (the section labels). They stay.
- **Reason:** see D10; the brief defines them and supplies their text. The tool can only suppress this rule wholesale, which its own guidance reserves for the owner.
- **Undo:** remove the `<p className="t-eyebrow label-line">` lines if the owner prefers no labels.

# Scene guide: how the 3D scenes plug into this codebase

Written during the build for anyone (human or agent) working on a 3D scene. It complements `06_3D_EXPERIENCES.md` (what each scene must do) with how this codebase does it. Where this file and `06` differ on implementation details, this file describes what is actually built; the differences are logged in `DECISIONS.md`.

## 1. Working rules when several agents build scenes in parallel

- One working tree, several agents. **Only create or change files inside the paths you were given.** Never edit shared files (`src/three/shared`, `src/three/assembly`, `src/components`, `src/lib`, `src/i18n`, `src/styles`, `src/App.jsx`, `src/sections/Sections.jsx`, `package.json`, configs). If a shared file needs a change, work around it with props, or describe the change in your final report.
- **Do not commit, do not run `npm install`, do not run `npm run build`, `npm run preview` or `npm run e2e`.** The orchestrator does those. A Vite dev server is already running on `http://localhost:5173` with hot reload: do not start another and do not stop it.
- Never write to `renders/` (the owner's originals). Read from it freely. Small previews are in `.cache/preview/`.
- Shell: use the Bash tool and start every command with `cd /d/BEHOMY/HOMYVEST && …`. Never put backticks inside a double-quoted bash string (bash executes them). Unit tests run from **PowerShell** (`npm run test`), not Git Bash (a path-case issue breaks Vitest there).
- Installed versions are newer than most documentation: three 0.187, React Three Fiber 9.8, drei 10.7, React 19.3, GSAP 3.15, Vite 8. When an API is in doubt, read it in `node_modules`. Known: `PCFSoftShadowMap` is gone (the canvas uses PCFShadowMap); `THREE.Clock` is deprecated (R3F's internal use is filtered).
- All visible text comes from `useT()` (`src/i18n/en.js`, `id.js`). The keys you need already exist. If you truly need a new one, do not edit the i18n files: use a sensible existing key and list the new key with EN and ID text in your report.
- Facts: never invent names, numbers or claims. Project captions are `<Caption id="…"/>` placeholders.
- The console must stay clean: no errors, no warnings.

## 2. Looking at your work (mandatory)

Scenes are developed in the harness, one scene per URL, independent of the rest of the page:

```
http://localhost:5173/dev.html?scene=<name>&p=0.4&ui=0
```
`<name>` is the file name of any `src/three/<folder>/<Name>Scene.jsx` in lower case without "Scene" (`HeroScene.jsx` → `hero`). The scene's default export receives `{ progress, onReady }`. Other params: `theme=dark`, `lang=id`, `tier=high|medium|low`, `w=…&h=…` (stage size), `perf=1` (logs draw calls and triangles, also in `window.__homyvestPerf`).

Screenshot tool (real GPU, not SwiftShader):
```bash
node qa/tools/shot.mjs "/dev.html?scene=hero&p=0.42&ui=0" qa/tmp/hero/p042.png --wait 1800 --console
node qa/tools/shot.mjs "/dev.html?scene=hero&p=0.42&ui=0" qa/tmp/hero/p042-m.png --mobile --wait 1800
# in the real page, at a pinned scene's progress:
node qa/tools/shot.mjs "/?nointro=1" qa/tmp/hero/page-p05.png --scene story --p 0.5 --wait 1500
```
Options: `--w --h --mobile --dark --reduced --wait <ms> --scene <id> --p <0..1> --y <px> --sel <css> --hover <css> --click <css> --eval "<js>" --clip x,y,w,h --full --console`. Save everything under `qa/tmp/<your-scene>/` (git-ignored).

**Open the PNGs with the Read tool and look at them.** Judge composition, the clay look, legibility, clipping and popping. Work in rounds: build → screenshot several progress points → look → fix. A scene is not done because the code runs; it is done when the screenshots look right at 1440 × 900 and 390 × 844, in light and dark.

## 3. The shared foundation (read these files before writing a scene)

| File | What it gives you |
|---|---|
| `src/three/shared/SceneCanvas.jsx` | The `<Canvas>` wrapper: tier DPR, `frameloop="demand"`, transparent background, Neutral tone mapping, shadows by tier, `progress` → invalidate, `onReady`. Use it for every scene. |
| `src/three/shared/Stage.jsx` | `Environment`, `Lights` (key light + hemisphere, fitted shadow box, optional `follow`), `Ground` (shadow-catcher plane, optional contact shadows), `PaperFog`, `KEY_DIRECTION`, `FrameWatch`, `PerfProbe`. |
| `src/three/shared/ClayMaterials.js` | `createClayMaterials(theme)` → `{ clay, solid, dark, glass, green }`, `clayTones()`, `ACCENT_DARK`, `WARM_WINDOW`. |
| `src/three/shared/rng.js` | `mulberry32`, `makeRandom(seed)`: seeded, so every visit is identical. |
| `src/three/assembly/pieces.js` | Piece model, `box()`, `cyl()`, `sequence(groups, {seed, stage})` (wave ordering), `prepare(pieces, {seed})` (typed arrays + seeded start transforms), `pieceT`. Pure, unit-testable. |
| `src/three/assembly/AssemblyMesh.jsx` | Draws a prepared kit: one `InstancedMesh` per kind. Reads a `stages` ref (Float32Array of 0..1 per stage). |
| `src/three/dev/ClayTestScene.jsx` | A small complete example. Start from it. |
| `src/components/layout/PinnedScene.jsx` | Pinned scroll scene: sticky stage + one ScrollTrigger. Writes 0..1 into a `createProgress()` object, registers `window.__homyvest.triggers[id]`, optional scrubbed GSAP `timeline(tl)` with positions 0..1. |
| `src/components/media/SceneMount.jsx` | Lazy-mounts a scene near the viewport, poster until first frame, error boundary → poster. `useSceneMode()` → `'live'` or `'static'` (reduced motion or no WebGL). |
| `src/components/media/DepthImage.jsx`, `Img.jsx` | `<DepthImage id sizes alt strength fit/>` for photographic renders; `<Picture id sizes/>` for plain images; `variantUrl(id, minWidth)` for texture URLs; `media(id)` for the manifest entry (width, height, aspect). |
| `src/lib/scroll/progress.js` | `createProgress()`, `span(p, a, b)`, `clamp01`, `lerp`, easings. |
| `src/lib/scroll/lenis.js` | `scrollToTarget(target, opts)` for skip links. |
| `src/lib/device/tier.js`, `src/lib/theme.js` | `useTier()` (`tier.name`, `tier.density`, `tier.ao`, `tier.shadows`, `tier.maxone3d`), `isCoarsePointer()`; `useTheme()`, `cssVar('--paper')`. |
| `src/components/ui/*` | `Button`, `WhatsAppButton`, `Stat` (with `start` for scrubbed scenes), `Caption`, `Heading`, `Icons`. |
| `src/styles/*` | Tokens and type classes (`t-display`, `t-h1`, `t-h2`, `t-h3`, `t-lead`, `t-small`, `t-eyebrow`, `t-stat`), `.wrap`, `.btn`, `.link`, `.scene-skip`. |

### The calibrated clay look (do not re-tune it per scene without a reason)
- Neutral tone mapping, exposure 1. Key light 2.7 from `KEY_DIRECTION = [-0.7, 0.66, -0.28]` (upper left, slightly behind), hemisphere 1.7, environment 0.15.
- Measured on the test scene: lit faces ≈ `#f0eee6`, shaded faces ≈ `#cfcdc7`, ground shadow ≈ `#b3b1ad` on paper `#fafaf7`. The light is behind-left so shadows fall toward the viewer and ground the model. A camera should therefore look from the front-left or front-right quadrant.
- The canvas is transparent: the ground is the page. `<Ground/>` is an invisible shadow catcher. Give models their own clay plates and slabs.
- Contact shadows render once (`frames={1}`): useless while pieces are moving. Use them only for static moments, with `contactKey`.
- Dark theme: the clay stays light; only the page behind it is dark.

### Patterns that matter
- **Progress is never React state.** Read `progress.current` inside `useFrame`, damp toward it with `maath/easing` (`easing.damp(obj, 'p', target, 0.12–0.18, delta)`), and call `invalidate()` while the damped value is still moving. A static scene must cost nothing.
- **Drivers run first.** The `useFrame` that updates the `stages` array (and the camera) takes priority `-1`: `useFrame(cb, -1)`. `AssemblyMesh` then reads fresh values in the same frame.
- **No allocations in `useFrame`.** Reuse module-level vectors, matrices and colours.
- **Builders are pure:** `(params) → Piece[]` in metres, so they can be unit-tested and reused.
- **One section component per scene** in `src/sections/<Section>/`, default-exported, with two modes: `live` (PinnedScene + SceneMount) and `static` (no pin: a short vertical sequence of posters or renders with the same headlines, everything visible).
- **Posters:** when your scene looks right, capture its key moments with `shot.mjs` (`ui=0`, 1600 × 1000, light theme) and convert them to WebP in `public/media/posters/` with sharp (`<scene>-<n>.webp`, about 1600 px wide, quality ~80). Use them in `SceneMount`'s `poster` and in static mode.
- **Budgets** (docs/06 §1.7): draw calls hero ≤ 120 · padel ≤ 120 · Maxone ≤ 220 · calculator ≤ 80; triangles ≤ 400k high, ≤ 200k medium/low; generated textures ≤ 2048 px. Check with `&perf=1`.
- **Accessibility:** `SceneMount` takes the text alternative (`label`). Every pinned scene has a skip link (`.scene-skip`) and keeps all its copy as real DOM text.

## 4. Final report (what the orchestrator needs back)
1. Files created or changed.
2. How to mount it: the exact import and JSX, and any props.
3. What you verified: which screenshots you looked at, and what you saw.
4. Performance: draw calls and triangles from `&perf=1`.
5. Every assumption you made (for Maxone: every part of the room you had to invent).
6. Known issues and anything you would still improve.
7. Any shared-file change or new i18n key you need.

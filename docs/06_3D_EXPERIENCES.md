# 06 — 3D experiences

Four 3D moments plus one image effect:

| # | Experience | Where | Kind |
|---|---|---|---|
| §2 | Hero story | `#story` | Pinned, scroll-scrubbed, procedural clay |
| §3 | Maxone walkthrough | `#homyeight` | Pinned, scroll-driven first-person camera through a procedural room |
| §4 | Padel assembly | `#beyond` | Pinned, scroll-scrubbed, orthographic clay model → real renders |
| §5 | Calculator scenes | `#calculator` | Interactive, live-updating clay model |
| §6 | Depth parallax | photographic renders everywhere | 2.5D shader effect on images |

The design language is the one from `03` §5: **white clay = planned and being built; full colour = real and alive.**

---

## 1. Shared foundation

### 1.1 Libraries
`three`, `@react-three/fiber` (v9), `@react-three/drei` (v10), `@react-three/postprocessing` + `postprocessing`, `maath` (damping), `gsap` + `ScrollTrigger`, `lenis`. No external model files: **every 3D object is procedural** (boxes, extrusions, tubes, cylinders) generated in code.

### 1.2 Canvas strategy
- Each big scene (hero, Maxone, padel, calculator) has **its own `<Canvas>`**, lazy-loaded with `React.lazy` and **mounted only when its section is within ~1 viewport** (IntersectionObserver, `rootMargin: '100% 0px'`). Unmount, and dispose of geometries and textures, when it's more than 2 viewports away.
- Depth-parallax images (§6) share **one** fixed, full-screen canvas using drei `<View>`.
- **At most two WebGL contexts live at any time** (the active scene plus the shared view canvas).
- Use `frameloop="demand"` and call `invalidate()` from scroll updates, control changes and running tweens. A static scene must cost zero GPU while idle.
- Before a scene's canvas is ready, show its **poster image** (§1.8) in the same box, then cross-fade to the live canvas (300 ms).

### 1.3 Renderer and look
```jsx
<Canvas
  dpr={tier.dpr}                       // [1, 2] high · [1, 1.5] medium · 1 low
  gl={{ antialias: tier.name !== 'low', powerPreference: 'high-performance', alpha: true }}
  shadows={tier.shadows ? 'soft' : false}
  onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}
/>
```
- **Clay material:** `MeshStandardMaterial({ color: clay, roughness: 0.92, metalness: 0 })`, with `clay` read from the CSS variable `--clay` at mount. Create a slightly darker variant (×0.93) for slabs' edges and a slightly lighter one for walls, so the model reads clearly without outlines.
- **Accent in clay scenes:** the single dark element (stair core and similar) uses `#1C1B19`. This is our version of SliderCentral's lone yellow stair.
- **Environment:** `RoomEnvironment` from `three/examples/jsm/environments/RoomEnvironment.js`, turned into a PMREM texture (intensity ≈ 0.6). It's procedural, so nothing is downloaded.
- **Key light:** directional from upper-left-front, intensity ≈ 2.2, `castShadow`, map 2048 (high tier) / 1024 (medium), `bias -0.0004`, `normalBias 0.02`, shadow camera tightly fitted to the scene bounds. Add a hemisphere fill (sky `#ffffff`, ground `#d8d4cc`, ≈ 0.6).
- **Ground:** a large plane in the page's `--paper` colour that receives shadows (`ShadowMaterial` opacity ≈ 0.10 over a paper-coloured plane), plus drei `<ContactShadows>` (blur ≈ 2.5, opacity ≈ 0.35). Re-render contact shadows only when geometry changes (`frames={1}` + key on change).
- **Fog:** linear fog in the paper colour, so far ground melts into the page with no visible horizon.
- **Ambient occlusion (high tier only):** `N8AO` from `@react-three/postprocessing` (half-res, radius ≈ 1.2, intensity ≈ 2). It gives the soft "model" look. Add SMAA when AA is off.
- **Edges:** test faint outlines (drei `<Edges>` threshold 20°, ink at ~8% opacity) on the hero buildings. Keep them only if they make the model read better at 375 px, and log the decision.
- **Dark theme:** ground and fog use the dark `--paper`. The clay stays light. Reduce light intensity ~10% so it doesn't glare.

### 1.4 Device tiers
Decide the tier once at load, then let drei `<PerformanceMonitor>` step **down** (never up) if the frame rate stays low.

| Tier | Detect | DPR | Shadows | AO | Grass/people | Maxone |
|---|---|---|---|---|---|---|
| high | fine pointer, ≥ 8 cores, `deviceMemory ≥ 8` (or unknown on desktop) | [1, 2] | soft 2048 | N8AO | full | full 3D |
| medium | laptop/tablet otherwise, or flagship phone | [1, 1.5] | 1024 | off | 60% | full 3D, no AO |
| low | coarse pointer + (≤ 4 cores or `deviceMemory ≤ 4`), or PerformanceMonitor decline | 1 | contact shadows only | off | 30% | **fallback B** (§3.11) |

Expose `?tier=high|medium|low` to force a tier for testing.

### 1.5 Scroll orchestration (smoothness)
- **Lenis** drives the page scroll (`lerp: 0.1`, `smoothWheel: true`; leave touch scrolling native). Feed it through GSAP's ticker so ScrollTrigger and Lenis share one clock (`09` §5).
- Each pinned scene owns **one ScrollTrigger**: `pin: true`, `scrub: true` (Lenis already smooths), `start: 'top top'`, `end: '+=' + lengthInVh + 'vh'`. Its `onUpdate` writes `progress` (0–1) into a **ref**, never into React state, and calls `invalidate()`.
- Inside `useFrame`, read the ref and **damp towards it** (`maath/easing.damp`, smoothTime ≈ 0.18 s for camera, ≈ 0.12 s for assembly). This removes the "steppy" feel of mouse-wheel notches without lag.
- Text overlays are DOM elements animated by GSAP timelines linked to the same ScrollTrigger (`timeline({ scrollTrigger })`), so text and 3D can't drift apart.
- Never animate layout properties in pinned scenes. Use only transforms and opacity.
- When a pinned scene is active, hide the header and the floating WhatsApp button (`04` §0).

### 1.6 The assembly engine (SliderCentral choreography)
Shared by the hero (§2), padel (§4) and calculator (§5). Put it in `src/three/assembly/`.

**Piece model**
```ts
type Piece = {
  kind: 'box' | 'cyl' | 'glass' | 'dark';   // which instanced mesh it belongs to
  size: [number, number, number];           // metres (box: w,h,d; cyl: r,h,_)
  pos: [number, number, number];            // final centre position
  rotY?: number;                            // final yaw
  order: number;                            // 0..1 when it starts within its stage
  stage: number;                            // stage/slide index
};
```
- **One `InstancedMesh` per kind**, built on a *unit* geometry (1×1×1 box, unit cylinder) and scaled per instance. A whole building is then 2–4 draw calls.
- **Start transforms** come from a seeded RNG (mulberry32, seed per building, so every visit is identical). Horizontal offset is a random direction × 8–20 m; vertical offset +3–12 m (roofs: +15–25 m, falling straight down); yaw ±25–70°; small pitch and roll ±10°; scale stays 1.
- **Per-piece progress:** `t = clamp((stageProgress − order·0.7) / 0.3, 0, 1)`, eased with `1 − (1 − t)^4` for position and `1 − (1 − t)^5` for rotation. Pieces glide and settle. No bounce, no overshoot.
- **Order** within a building: ground slab → floor 1 walls → floor 1 partitions → floor 1 furniture → next floor's slab … Within each group, order by distance from a seeded corner, plus jitter ±0.03. The result is a wave that sweeps across the building, as in the reference.
- Write instance matrices only for pieces whose `t` changed. Mark `instanceMatrix.needsUpdate` once per frame.
- Every builder function is pure, `(params) → Piece[]`, so it can be unit-tested and reused by the calculator.

### 1.7 Performance budgets
| Metric | Target |
|---|---|
| Frame time on a mid-range laptop (e.g. M1 / recent i5 iGPU) | ≤ 16.7 ms (60 fps), never below 45 fps while scrolling |
| Mid-range phone (e.g. Pixel 6a / Galaxy A54) | ≥ 30 fps steady, no hitch > 50 ms |
| Draw calls | hero ≤ 120 · padel ≤ 120 · Maxone ≤ 220 · calculator ≤ 80 |
| Triangles on screen | ≤ 400k (high), ≤ 200k (medium/low) |
| GPU textures | ≤ 64 MB total per scene; generated canvas textures ≤ 2048 px |
| JS work per frame | ≤ 4 ms (no allocations in `useFrame`; reuse vectors and matrices) |
| 3D chunk | lazy, never in the initial bundle |

Measure with a dev-only overlay (`?perf=1`: drei `<Perf>` or `r3f-perf` installed as a devDependency) and with Playwright traces (`10` §4).

### 1.8 Fallbacks
- **Posters:** in M11, generate posters with Playwright. Capture each scene at its key progress points and save them as WebP in `public/media/posters/` (`hero-1..5`, `maxone-0..6`, `padel-1..3`, `calc-step1`). Before posters exist, use the related renders as stand-ins.
- **Reduced motion:** no pinning and no scrubbing. Each pinned scene becomes a short vertical sequence of its posters with the same headlines and captions, all visible, with simple fades.
- **No WebGL** (`!WebGL2RenderingContext` or context creation fails): same as reduced motion. The calculator uses its SVG fallback (`05` §9.6).
- **Errors:** wrap every canvas in an error boundary that swaps in the poster sequence and logs to the console (no user-facing error text).

---

## 2. Hero story (`#story`)

### 2.1 World
- Four plots in a row along +x, each **30 × 20 m** (the calculator's default land, a quiet consistency), with centres at x = 0, 46, 92, 138 m.
- A continuous road strip (8 m deep) runs along the front (z from −8 to 0), with a 2 m sidewalk and a faint dashed centre line. Plot boundaries are drawn as thin, slightly raised kerbs.
- Each plot uses the calculator's band layout: open band z 0–4 (front), building band z 4–16, green band z 16–20.

### 2.2 Idle dressing (plot 0)
- ~600 instanced grass tufts (thin tapered boxes 0.05 × 0.3–0.9 × 0.05, random tilt) scattered over plot 0, plus two low bushes.
- Four corner stakes with a taut string line around the plot (thin boxes).
- During "Build", the grass shrinks into the ground (scale y → 0, 0.3 s per tuft, staggered by distance from the first slab).

### 2.3 The four buildings (builder functions in `src/three/kits/`)
All buildings sit centred in the building band and show their **top floor with no roof**, so the rooms are visible.

**`stay` (plot 0), the hybrid stay**
- Footprint 24 × 12 m, 4 floors, floor-to-floor 3.2 m, slabs 0.2 m.
- Perimeter walls 0.2 m thick with window openings on a 3 m bay: solid 0.7 m · window 1.6 m · solid 0.7 m. Each window is a sill piece plus a lintel piece, so the openings are real gaps.
- A central corridor 1.8 m wide along x. Rooms 3 m wide on both sides, so 8 per side and 16 per floor, with a bathroom partition in each room (1.5 × 1.8 m).
- Stair core 3 × 6 m at the east end, in the **dark accent** material.
- Ground floor: lobby with a glazed front (glass kind) in place of 3 rooms.
- About 360 pieces.

**`office` (plot 1)**
- Footprint 22 × 12 m, 3 floors at 3.8 m. Columns 0.5 × 0.5 on a 5.5 × 6 m grid. Glass curtain panels (glass kind: `MeshStandardMaterial` transparent, opacity 0.18, `depthWrite: false`, slight tint toward `--paper-2`).
- Core 4 × 6 m at the west end (dark accent). The top floor has 6 desk clusters of 4 desks (1.6 × 0.75 × 0.8) plus chairs (0.5 boxes) and a meeting room (glass partitions).
- About 300 pieces.

**`cafe` (plot 2)**
- Footprint 16 × 10 m, one floor at 4.2 m, with a full-height glazed front.
- An L-shaped counter (dark accent top), 8 round tables (cylinders r 0.4) with 2–4 chairs, and planters along the front.
- In the open band: a pergola (posts plus slats on a 0.6 m rhythm) shading 4 outdoor tables.
- About 220 pieces.

**`sports` (plot 3)**
- One padel court 20 × 10 m along x in the building band: turf slab, glass back walls 3 m with 1 m mesh above, side walls stepped (glass 3 m for 2 m from each end, then 2 m glass for 2 m, then mesh posts), a net, line strips, and 4 light poles.
- A clubhouse 7 × 8 m on the east side (one floor, glazed front).
- About 200 pieces.

### 2.4 Choreography (progress 0–1 over ~500 vh)
| Range | Beat | What happens | Camera |
|---|---|---|---|
| 0.00–0.10 | **1 Idle** | Grass sways almost imperceptibly (vertex wobble ±2° on high tier). Headline B1 rises in. | High 3/4 view of plot 0: target (0, 2, 10), distance 92 m, FOV 22°, azimuth −35°, elevation 32°. Slow push-in to 86 m. |
| 0.10–0.36 | **2 Build** | Grass sinks. `stay` assembles floor by floor (wave sweep). The stair core lands last on each floor. Headline B2 at 0.12. | Orbits +12° azimuth while easing to distance 80 m. |
| 0.36–0.46 | **3a Office** | Headline B3 appears (stays through 0.66). Slide label "Office". The camera swipes +46 m in x over the first 30% of the range (`power2.inOut`); office pieces assemble during the rest. | Same angle, translated. During the swipe, apply a horizontal motion blur (CSS `filter: blur()` on the canvas, peak 5 px, high and medium tiers only). |
| 0.46–0.56 | **3b Café** | Swipe to plot 2; the café assembles. Label "Café". | Translate. |
| 0.56–0.66 | **3c Sports** | Swipe to plot 3; the court and clubhouse assemble. Label "Sports court". | Translate. |
| 0.66–0.80 | **4 Alive** | The camera pulls up and back to frame all four buildings. Window glass and lobby fronts warm up (emissive `#FFD9A8`, 0 → 0.6). This is the only warm tint in the clay world, and only in this beat. Then 40 tiny people (capsule-like: cylinder + sphere, 1.7 m) fade in and walk short loops on sidewalks and in open bands, and 6 cars glide into place. Headline B4. | Target (69, 4, 10), distance 230 m, elevation 40°, azimuth −30°. |
| 0.80–0.86 | **Dissolve** | The canvas dissolves into the photo `facades/best` with a soft radial wipe expanding from the `stay` building's projected screen position. The photo scales 1.08 → 1.0. | Freeze camera. |
| 0.86–1.00 | **5 Earn** | Photo with depth parallax (§6) and a soft left-side scrim. Headline B5, two stats counting up (82%, 3,000+), two CTAs. | — |

Slide labels (beat 3) sit bottom-centre in small caps with a thin progress line showing the 4 options (stay · office · café · sports). At 0.36, briefly show "Hybrid stay" for plot 0 before the first swipe.

### 2.5 Text overlays
Copy in `07` §2. DOM layer above the canvas (`pointer-events: none`, except the CTAs). Desktop: left third, vertically centred. Mobile: top 35% of the viewport, with the scene framed in the lower part. Each headline uses a SplitText line reveal; previous text fades out over 6% of progress before the next comes in.

### 2.6 Mobile framing
Portrait camera: distance ×1.35, target lowered so buildings sit in the lower 60% of the screen. Tier rules apply (fewer tufts and people). Scroll length ~420 vh.

### 2.7 Skip link
"Skip intro" (bottom-left, small) jumps to `#about` via Lenis `scrollTo`.

---

## 3. Maxone walkthrough (`#homyeight`, "Step inside")

### 3.1 Approach
There's no source 3D file for Maxone. **Build the room procedurally from `maxone/layout` and the seven renders**, making assumptions where the renders don't show something, and walk a camera through it on scroll. At each stop, the matching real render slides in as a framed card. The goal is a **complete, clean, smooth** experience: a calm, beautiful interpretation of the room, not a photoreal copy.

Style: **coloured, softly lit architectural model.** Use the room's real palette (§3.5), soft light, matte materials and AO, like a high-quality architectural massing model with colour. Don't attempt photorealism, and don't use mannequins.

### 3.2 Coordinate system
- Metres. **x** = east (right in `layout.png`), **z** = south (down in `layout.png`, toward the street), **y** = up. Origin = top-left corner of `layout.png`.
- Scale ≈ **72 px per metre** at the original 1976 × 1274 px. This is derived from the floor tiles: a 43 px pitch for an assumed 0.6 m tile. Sanity checks: round tables ≈ 1.2 m across, the hall ≈ 19.6 × 10.4 m.
- **Debug trace mode** (`?debug=maxone`): show `layout.png` on the floor plane at true scale (opacity 0.5), the camera path as a line, and stop markers. Use it to place every element.

### 3.3 Plan elements (approximate, refine in trace mode)
| Element | x0 | z0 | x1 | z1 | Notes |
|---|---|---|---|---|---|
| Interior hall floor (main box) | 2.6 | 4.1 | 22.2 | 14.5 | Two-tone grey tiles 0.6 m |
| Corridor strip north of hall | 13.1 | 0.8 | 14.7 | 4.1 | Service corridor, tiles |
| Reception/bar zone, patterned floor | 14.7 | 0.8 | 22.3 | 6.1 | Black-and-white herringbone |
| Curved reception/bar counter (L, rounded ends) | 15.1 | 2.0 | 20.4 | 4.6 | Small grey-green tile facing, white top; espresso machine at west end |
| Yellow bar stools ×4 | 15.6 | 4.5 | 17.8 | 5.0 | Mustard |
| Red armchairs ×2 + side table | 20.7 | 4.5 | 22.1 | 6.1 | Burgundy |
| Curved green buffet counter with pots | 5.0 | 4.1 | 8.6 | 7.6 | Sage cabinetry, curved corner, round pots on top |
| Yellow drawer counter + bread display | 9.3 | 3.8 | 12.6 | 4.8 | Mustard drawer fronts |
| Plant cluster | 12.3 | 3.8 | 13.6 | 5.0 | Large leafy plants |
| Row A: 4 round tables, navy chairs (centres x 8.4/10.7/13.0/15.3, z 7.1) | 7.9 | 6.4 | 16.0 | 7.8 | 4 chairs each |
| Row B: 4 square table pairs, salmon + mint chairs (z ≈ 9.2) | 7.7 | 8.5 | 16.2 | 9.9 | |
| Two long indoor planters | 16.8 | 7.5 | 17.5 | 10.2 | |
| Pergola / timber trellis beam (E–W) | 5.6 | 10.3 | 17.2 | 10.6 | At ~3.0 m height, sage-painted frame |
| Pergola beam (N–S) | 9.1 | 10.4 | 9.4 | 13.8 | |
| Communal table, blue/green/yellow chairs | 6.1 | 11.4 | 8.7 | 13.2 | |
| Row C: 4 table pairs salmon + mint (centres x 10.6/12.5/14.4/16.4, z 12.5) | 9.9 | 11.7 | 17.1 | 13.3 | |
| Facade glazing along the street | 5.6 | 14.3 | 17.2 | 14.6 | Tall arched/rectangular doors (renders 4, 6) |
| Back-of-house room (closed) | 17.2 | 11.7 | 22.2 | 14.5 | Plain walls, one door |
| Main entrance double doors (east wall) | 21.9 | 6.4 | 22.5 | 8.2 | Glass doors |
| Outdoor timber deck, 4 round tables + bench | 22.3 | 0.0 | 26.8 | 5.8 | Rattan chairs |
| Outdoor walkway (paved) | 22.3 | 5.8 | 27.4 | 16.0 | |
| Raised planter beds | 23.6 | 10.3 | 27.2 | 14.4 | |
| Entry steps from the street | 22.4 | 15.8 | 26.0 | 17.7 | |
| Street (asphalt) | 0.8 | 14.5 | 22.2 | 17.7 | Dark |

Columns: black square columns (0.45 m) where the plan shows black squares. Place them in trace mode.

### 3.4 Vertical structure (assumed from the renders)
- Main ceiling 3.6 m, **dark** (`#2B2A28`) with deeper bulkheads (render 2).
- **Double-height void** over the buffet and bar area (approx. x 5–13.5, z 4–8) rising to 8.0 m. A tall **curved beige wall** wraps its north-west side (renders 2, 7). A **timber grid with hanging planters** sits at 7.6 m (render 7).
- **Mezzanine edge** with a glass railing along the south side of the void at 4.2 m (render 4).
- Reception ceiling feature: a black rectangular grid frame at 3.2 m, with **sage ribbon shapes** (TubeGeometry along a few smooth closed curves) hanging under it (render 1).
- **Wall behind reception:** a passport-stamp mural (west part) and a warm timber panel wall with three round wall lights (east part). An **arched display shelf** (black arch frame, shelves with small glowing bottles) stands in front of the mural, with a small sign block reading "maxone".
- **"BAR" arch shelving** above the yellow counter: a tall arched steel frame with timber shelves, plates, plants and a small "BAR" letter block (renders 3, 5).
- A timber lattice screen west of the reception counter (render 1).

### 3.5 Materials and palette (sample the renders to refine)
Sample with a few lines of Python (Pillow) over regions of the renders and record the results in `docs/DECISIONS.md`. Starting values:

| Material | Colour | Notes |
|---|---|---|
| Floor tile A / B | `#C9C9C7` / `#A9AAA8` | 0.6 m grid, 2 mm grout `#8E8E8C`, random A/B mix |
| Herringbone | `#F1F1EE` + `#1E1E1E` | Canvas texture, 0.1 × 0.4 m blocks |
| Ceiling | `#2B2A28` | |
| Plaster walls | `#E7E3DC` | |
| Curved void wall | `#BDB2A2` | |
| Sage cabinetry, pergola | `#8E9A6E` | |
| Mustard (stools, drawers) | `#D9A93A` | |
| Navy chairs | `#3E5874` | |
| Salmon chairs | `#D58C76` | |
| Mint chairs | `#9DC8B4` | |
| Burgundy armchairs | `#7E2A2E` | |
| Timber | `#9C6B45` | Wall panels, shelves, deck `#6E4A33` |
| Black metal | `#1F1F1F` | Frames, columns, arches |
| Table tops | `#2E2E2E` (round) / `#EFEFEC` (square) | |
| Plants | `#4F7A3A` / `#3C5F2C` | Low-poly clusters of slightly rotated icosahedrons |

- **Mural texture:** generate procedurally on a canvas (1024 × 512). Overlapping faded circles and rectangles in red, green, blue and mustard on an off-white base, with stamp-like rings and words ("INDONESIA", "JAKARTA", "MADE IN INDONESIA") in Archivo. It's inspired by render 1, not copied from it.
- **Light:** `RoomEnvironment` (≈ 0.8) + a warm directional "sun" through the south glazing (soft shadows, static shadow map: render once, then `shadow.autoUpdate = false`). Ceiling downlights are small emissive discs (no real lights). Add a subtle warm emissive under shelves. On high tier, add N8AO and a light vignette.

### 3.6 Furniture
Build each furniture type once as a small merged geometry, then instance it: round table, square table, navy chair, salmon chair, mint chair, rattan chair, bar stool, armchair, pot, plant, hanging planter. Curved counters use `THREE.Shape` + `ExtrudeGeometry` (outline traced from the plan, bevel 0.01). Use about 25 draw calls for furniture in total.

### 3.7 Camera route
Eye height 1.55–1.65 m. Position and look-target each follow a `CatmullRomCurve3` (centripetal), sampled **by arc length** (`getPointAt`) so speed is even. Each stop has a **dwell**: a flat section in the progress → path mapping where the camera only drifts ~0.3 m, giving the card time to be read. Damp the camera (§1.5).

| Key | Progress | Camera position (x, y, z) | Looks at | Card |
|---|---|---|---|---|
| W0 Street | 0.00 | (24.2, 1.6, 18.5) | (24.0, 1.6, 10.0) | — (title "Step inside") |
| W1 Walkway | 0.07 | (24.4, 1.6, 9.5) | (21.5, 1.7, 7.3) | — |
| W2 Doors | 0.12 | (22.6, 1.6, 7.3) | (17.5, 1.7, 4.0) | — |
| **S1 The welcome** | 0.16–0.24 | (19.6, 1.5, 8.6) | (17.4, 1.6, 2.6) | `maxone/1` |
| W3 | 0.29 | (16.5, 1.6, 10.6) | (11.5, 1.8, 5.0) | — |
| **S2 The dining hall** | 0.33–0.41 | (11.8, 1.6, 11.6) | (11.0, 1.8, 4.0) | `maxone/2` |
| **S3 The buffet and bar** | 0.47–0.58 | (10.6, 1.5, 8.4) | (7.6, 1.5, 5.0) | `maxone/5`, then `maxone/3` |
| **S4 Look up** | 0.63–0.71 | (9.6, 1.4, 7.4) | (8.8, 7.6, 5.8) | `maxone/7` |
| **S5 By the windows** | 0.76–0.84 | (12.8, 1.6, 9.2) | (12.8, 1.9, 14.6) | `maxone/6` |
| **S6 The whole floor** | 0.90–1.00 | rises to (12.0, 26, 9.0) | (12.0, 0, 8.9) | `maxone/4` + plan |

- **Rise (S6):** lift through the ceiling (fade the ceiling and void-top geometry out as the camera passes 3.4 m). Narrow the FOV from 55° to 24° while pulling back (a dolly-zoom), reaching an almost orthographic top-down view. Then cross-fade the model into `maxone/layout` aligned in screen space. Use the debug trace to align them.
- **Collisions:** sample the path every 0.25 m and assert ≥ 0.35 m clearance from walls, counters and columns. Adjust the waypoints until it passes. Write this as a small dev test.
- **Interior FOV** 55° (desktop) and 62° (mobile portrait).

### 3.8 Render cards
- At each stop, the card slides in with a clip-path reveal (0.6 s) as the dwell begins and leaves as it ends. Cards alternate right and left on desktop (≈ 46vw wide, vertically centred). On mobile they're full-width in the lower 45% of the screen.
- Card = the render (with depth parallax, §6) + a hairline frame + the three-voice caption placeholder + the stop name ("The welcome").
- At S3, the two renders cross-fade within the dwell.

### 3.9 Mini-map
`maxone/layout` in greyscale at 220 px (desktop) or 140 px (mobile), bottom-left, at 90% opacity on `--paper-2`. A dot and a small view cone show the camera's position and heading (metres × 72 / scale), and the walked path is drawn as an ink line. Stop numbers on the map are buttons that scroll to that stop (keyboard accessible). This also serves as the accessible list of stops.

### 3.10 Performance
Merge static geometry per material (`BufferGeometryUtils.mergeGeometries`) and instance the furniture. Generated textures are ≤ 2048 px. The static shadow map renders once. Respect the §1.7 budgets.

### 3.11 Fallback B (low tier, reduced motion, no WebGL, or the 3D misses the bar)
A **render-led walkthrough**: the same pinned section and route, but each stop is its full-bleed render with a slow Ken Burns move in the direction of travel, plus depth parallax. Renders cross-fade between stops, the mini-map dot glides between stop positions, and the cards and captions are the same. Reduced motion: no pin, just the sequence of renders with captions.

**Time-box:** if the procedural room still looks unconvincing after ~3 hours of work (judged from screenshots at S1–S5 next to the renders), ship fallback B for all tiers, keep the 3D code behind `?maxone=3d`, and log it in `docs/DECISIONS.md`.

### 3.12 Quality bar
For each stop, capture a Playwright screenshot and place it next to its render (`qa/maxone-compare/`). The same main objects must be in frame in the same arrangement, and the room must read clearly as the same place. Iterate on the camera targets and the model until it does.

---

## 4. Padel assembly (`#beyond`)

### 4.1 Approach
The owner chose a real 3D assembly. **Build a clay model of the Athero padel hall and assemble it in three stages**, matching the three renders. At the end of each stage, the matching **cleaned render** (`padel-clean/padel-1..3`, captions already removed by `scripts/clean-padel.mjs`) is revealed over the model, so the clay becomes colour. Then the scene returns to clay for the next stage. Use **only the building**: never show the original images' text.

### 4.2 Camera (orthographic, matched to the renders)
The renders are near-isometric axonometric views. Measured from the cleaned images, using the slab's left, bottom and right extreme points:

| Image | Size | L (left) | B (bottom) | R (right) | Edge slopes | Elevation | Azimuth |
|---|---|---|---|---|---|---|---|
| padel-1 | 1830 × 1119 | (8, 607) | (876, 1110) | (1820, 505) | 30.1° / 32.7° | ≈ 37.5° | ≈ 43.6° |
| padel-2 | 1342 × 895 | (9, 524) | (632, 885) | (1333, 388) | 30.1° / 35.3° | ≈ 39.9° | ≈ 42.1° |
| padel-3 | 1341 × 928 | (8, 558) | (631, 918) | (1332, 421) | 30.0° / 35.3° | ≈ 39.8° | ≈ 42.1° |

Start with an `OrthographicCamera` at **azimuth 43°, elevation 38°**. Refine with this relation: if the two ground edges appear at screen angles α₁ and α₂ below horizontal, then `sin²(elevation) = tan α₁ · tan α₂` and `tan(azimuth) = tan α₁ / sin(elevation)`. Plants overhanging the slab can skew the extreme points, so confirm the slab corners by viewing the images and re-measure if needed. The images are at different scales (padel-1 is about 1.37× the others), so alignment happens per image (§4.5).

### 4.3 Model (metres; derive layout from `padel-clean/padel-1`)
- **Courts:** 8 padel courts, 20 × 10 m each, in **4 blocks of 2 side-by-side courts**, laid out as in padel-1 (one block at the back, one middle-left, one front-left, one front-right), with walkways between them. Back-project pixel positions to the ground plane with the calibrated camera to get the block positions and the site outline (roughly 60 × 55 m).
- **Court build-up:** turf slab 0.08 m; back walls glass 3 m + mesh 1 m; side walls glass 3 m for 2 m from each back wall, then 2 m glass for the next 2 m, and mesh frames (thin box edges) to 3 m along the rest; posts every ~2.5 m; a net (thin box 0.9 m high) across the middle; line strips.
- **Front zone (stage 1):** perimeter wall and planting strip, the café/lounge floor with tables, a stair, a toilet block (a few walls), an entrance gate, and ~10 tiny people.
- **Stage 2:** the mezzanine slab over the café with tables and glass railings; perimeter columns and roof beams (timber in the render, dark accent in clay); ~10 indoor trees (low-poly); the low side roof along the right edge; the lower part of the front facade wall.
- **Stage 3:** the **vaulted roof**: two curved shells (dark accent) built from a `THREE.Shape` arc extruded along the hall's length, a central translucent skylight band (glass kind), glazed gable ends, the full timber-fin front facade, and a sign block.
- About 600–800 pieces in total, in 4–5 instanced meshes.

### 4.4 Choreography (progress 0–1 over ~360 vh)
| Range | What happens |
|---|---|
| 0.00–0.05 | Empty site slab fades in. Text: stage 1 headline. |
| 0.05–0.30 | **Stage 1** assembles: perimeter, then courts block by block (surface → glass → mesh → net), then the café and toilets, then the people. |
| 0.30–0.36 | **Reveal render 1:** a wipe along the isometric diagonal (from the left corner toward the right) uncovers `padel-clean/padel-1` aligned over the model. Caption placeholder appears. |
| 0.36–0.40 | The render wipes back out to the clay model. Text: stage 2 headline. |
| 0.40–0.62 | **Stage 2** assembles: columns rise, beams land, the mezzanine slides in, trees grow (scale from 0), railings appear. |
| 0.62–0.68 | **Reveal render 2.** |
| 0.68–0.72 | Back to clay. Text: stage 3 headline. |
| 0.72–0.92 | **Stage 3:** roof shells descend from high above and settle, then the skylight, gables and facade fins. |
| 0.92–1.00 | **Reveal render 3** and hold. Final caption placeholder. |

Text sits in the left column (desktop) or above the model (mobile). The camera stays fixed, with only a very slow zoom-in (orthographic zoom ×1.0 → ×1.06 per stage).

### 4.5 Aligning renders to the model
For each image, compute the **similarity transform** (uniform scale + translation) that maps its slab anchors (L, B, R, refined) onto the model's projected slab corners. Use least squares over the three points and store the result in `src/content/padel-alignment.json`. Recompute it on resize, since the orthographic frustum changes. Add a debug mode (`?debug=padel`) with the render at 50% opacity over the model and a slider to scrub progress. If the alignment can't get within ~2% of the image width, keep the wipe, but stage the render as a slightly larger "photo" that overlaps the model rather than pretending to match it exactly.

### 4.6 Fallback
Reduced motion, no WebGL or low tier: show the three cleaned renders in sequence (stacked on mobile, or as a three-step scrubber on desktop) with the same stage text.

---

## 5. Calculator scenes (`#calculator`)
Requirements are in `05` §9 and are binding. This section covers implementation.

### 5.1 Scene
- Perspective camera, FOV 30°. drei `<OrbitControls>` with damping, polar angle 15°–80°, no panning below ground, zoom limits scaled to the land diagonal. On every land-size change, auto-frame with a smooth 0.6 s tween. A reset-view button sits in the scene's corner.
- The same clay look (§1.3), shadows medium (1024), no AO.

### 5.2 Zones and road
- Building band: the clay slab, slightly raised (0.05 m).
- Green band: `--zone-green`, matte, with tiny instanced grass tufts (density scaled to area, capped at 400).
- Open band: `--paper-2` with a dot pattern (canvas texture) and, where `cars > 0`, faint parking bay outlines (2.5 × 5 m), at most `cars` of them.
- Road: an ink strip 6 m deep in front, with a dashed centre line and a kerb.

### 5.3 Models and transitions
- Build every model from the assembly engine's pieces (§1.6), using the **geometry helpers** (§5.4) for all dimensions. Never hard-code numbers.
- **Input changes:** debounce 120 ms, then morph. Floors animate their height (scale y, stagger 0.04 s from the bottom). The footprint tweens its x/z scale. New partial floors fade in.
- **Idea switch:** the old model sinks into the slab (0.3 s), and the new one rises floor by floor (0.5 s, short stagger).
- **Step 3:** the existing building is solid. Extra allowed floors are ghosts (glass kind, opacity 0.22, dashed ink edges). Over-limit parts use a hatch texture.
- **Labels:** dimension lines with drei `<Html>` labels (paper background, ink text, `--t-small`), showing front width, depth, floor count and the headline area. All values come from the calc formatters in the active language. Hide labels that would overlap (simple screen-space check).
- **Hover links:** focusing the KDB, KLB or KDH inputs highlights the footprint outline, the floor stack or the green band (`05` §3).
- **Text alternative:** a visually hidden paragraph next to the canvas, regenerated from the same numbers (e.g. "3D view: 30 by 20 metre land. Building footprint 360 m², 3 floors plus a 120 m² top floor, total 1,200 m². Green area 120 m². Room for about 4 cars.").
- **Floor cap:** draw at most 40 floors, then show the "Showing 40 of N floors" label.

### 5.4 `src/lib/calc/geometry.ts` (pure, tested)
```ts
bands(r)                 → { dFront: r.open / r.P, dBack: r.greenMin / r.P, dMid: r.L - dFront - dBack }
stack(area, footprint)   → { full: floor(area/footprint + EPS), partial: rest < 0.5 ? 0 : rest }
maxBuilding(r)           → { fpUsed: min(r.fp, r.floorArea), width, depth, ...stack(r.floorArea, fpUsed) }
kosModel(r, res)         → footprint as maxBuilding; stack(res.kos.built, r.fp); roomsPerFloor ≈ units / floors
rukoModel(r, res, I)     → { units, rowWidth: units*width, unitDepth: min(dMid, r.fp/(units*width)),
                             unitFootprint, ...stack(res.ruko.perUnit, unitFootprint) }
housesModel(r, res, I)   → { cols: clamp(round(r.P / sqrt(I.rumah.land)), 1, units), rows: ceil(units/cols),
                             parcelW: r.P/cols, parcelD: min(r.L/rows, I.rumah.land/parcelW),
                             floorsPerHouse: ceil(I.rumah.floor / (r.fp/units)), footprint: I.rumah.floor/floorsPerHouse }
warehouseModel(r, res)   → { area: res.gudang.built, width: min(r.P, …), depth: area/width, height: 7 }
existingModel(c)         → { footprint: c.fp, ...stack(c.tfa, c.fp), ghostFloors: c.answer.extra }
```
Tests (`geometry.test.ts`) must reproduce `05` §10 "Geometry check": bands 4/12/4; ruko 6 units, a 27 m row, unit depth 12 m, 54 m² per floor, 3 full floors + a partial; houses 6 parcels of 10 × 10 m, 35 m² footprint, 2 floors.

---

## 6. Depth parallax on renders

### 6.1 What it does
Photographic renders get a **subtle 2.5D "looking into the room" motion**: near objects shift more than far ones as the pointer moves (desktop) and as the image scrolls through the viewport (all devices). Depth maps come from `scripts/depth-maps.py` (`08` §3.3) and are listed in `src/content/depth-status.json`.

### 6.2 Component: `<DepthImage id="interiors/interior-3" sizes="…" alt="…" strength={1} />`
- Always renders a normal `<picture>` (AVIF/WebP srcset from the manifest, LQIP background, `loading="lazy"` except for above-the-fold images). This is the SEO, LCP and fallback path.
- If depth is available for the id, the tier isn't low, motion isn't reduced, and the element is near the viewport, it registers a drei `<View>` tracking the element on the **shared fixed canvas** (§1.2). The view draws a full-rect plane with the shader below. Once the texture is uploaded, fade the WebGL view in over the picture (opacity 0 → 1 in 250 ms) and only then hide the picture.

### 6.3 Shader
```glsl
// vertex: standard full-rect quad, passes vUv
// fragment:
uniform sampler2D uImage;   // the render (≈1600w desktop, ≈960w mobile)
uniform sampler2D uDepth;   // greyscale depth, white = near
uniform vec2  uOffset;      // damped pointer/scroll offset in UV units
uniform float uFocus;       // depth that stays still (0.5)
uniform vec4  uCover;       // object-fit: cover transform (scale.xy, offset.xy)
varying vec2  vUv;

vec2 cover(vec2 uv) { return uv * uCover.xy + uCover.zw; }

void main() {
  vec2 uv = cover(vUv);
  float d = texture2D(uDepth, uv).r;
  vec2 shift = uOffset * (d - uFocus);
  // 3-tap blend reduces tearing at depth edges
  vec4 c = texture2D(uImage, clamp(uv + shift, 0.001, 0.999)) * 0.6
         + texture2D(uImage, clamp(uv + shift * 0.85, 0.001, 0.999)) * 0.2
         + texture2D(uImage, clamp(uv + shift * 1.15, 0.001, 0.999)) * 0.2;
  gl_FragColor = c;
  #include <colorspace_fragment>
}
```
- Scale the image by 1.04 inside its frame, so shifted edges never reveal a border.
- **Strength:** pointer offset ≤ 0.012 UV, and scroll offset ≤ 0.008 UV (from the element's position in the viewport, −1 → 1). Damp with `maath` (smoothTime 0.15). Multiply by the `strength` prop (hero photo 1.2, cards 0.8, gallery 1.0).
- Touch devices: scroll offset only. No gyroscope (iOS asks permission).

### 6.4 Where it's used
Every photographic render: hero photo (`facades/best`), the HomyEight intro image, the Maxone cards (`maxone/1–7`), the projects gallery, the "beyond" panels (Athero, café, office), and the `#next` background. **Not** on: padel cut-outs, the layout plan, or images smaller than 360 CSS px on screen.

### 6.5 Fallback
`depth-status.json` missing or `available: false`, low tier, reduced motion, or a WebGL failure → the plain `<picture>` with the gentle CSS scale-in from `03` §7. No visual errors, no empty boxes.

---

## 7. Visual verification routine (use for every scene)
1. Write a Playwright helper `scrollToProgress(sectionId, p)` that computes the pinned ScrollTrigger's start and end positions (exposed on `window.__homyvest.triggers[sectionId]` in dev and test builds) and scrolls with Lenis to the matching position, then waits 600 ms for damping.
2. Capture screenshots at the key progress points listed for each scene, at 1440 × 900 and 390 × 844, in both themes, into `qa/screenshots/3d/`.
3. Look at them. Check composition, legibility of text over the scene, the clay look, alignment of the reveals, and that nothing clips or pops.
4. Record frame timing with a Playwright trace while scrolling each pinned scene at a steady speed (`10` §4). Flag any frame over 50 ms.

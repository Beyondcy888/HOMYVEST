# U01_07: New assets

All new source files are in `assets-src/` (shipped in this kit). Like `render/`, treat `assets-src/` as originals: **read only, never modify**. Generate web copies elsewhere.

## 1. Files
```
assets-src/logos/
  homyeight.png                  1600×425  colour (orange mark, navy text, tagline) for light backgrounds
  homyeight-compact.png          1600×303  same, WITHOUT the tagline line (use at small sizes)
  homyeight-on-dark.png          1600×425  orange mark, white text (dark backgrounds / photos)
  homyeight-compact-on-dark.png  1600×303  compact on-dark
  behomy.png                     1600×835  colour (navy lettering, light-orange pillow) for light backgrounds
  behomy-on-dark.png             1025×548  white lettering, orange pillow (dark backgrounds / photos)
assets-src/photos/   (extracted by the owner's request from the HomyEight and Behomy 2026 company profiles)
  behomy-hero.jpg            3096×2064  Behomy room, beHomy pillow (Behomy hero)
  step-design.jpg            1280×720   HomyEight 3D design of a kost building (End-to-end: Design)
  step-build.jpg             854×388    construction with scaffolding, B&W (End-to-end: Build) ⚠ small
  step-operate.jpg           800×600    guest checking in at a Behomy reception (End-to-end: Operate)
  behomy-room-1.jpg          1012×679   Behomy Residence room
  behomy-life.jpg            1200×800   residents in a Behomy lounge (guitar)
  behomy-room-2.jpg          960×717    Behomy Residence room
  corvel-room.jpg            1239×826   Corvel room with city view
  corvel-lobby.jpg           1239×826   Corvel lobby
  purnava-pool.jpg           922×615    Purnava Village pool, Bali
  hoteru-room.jpg            810×540    Hoteru room (Japandi) ⚠ small
  hoteru-stair.jpg           810×540    Hoteru corridor and stair ⚠ small
  behomy-facade-1.jpg        1200×1800  Behomy building, timber fins (portrait)
  behomy-facade-2.jpg        908×1210   Behomy building, orange brick screen (portrait)
  behomy-corridor.jpg        3716×2477  Behomy corridor and stair (high-res)
  behomy-team.jpg            2698×1800  The Behomy team
  staff-training.jpg         1200×800   front office and housekeeping training
  before-after-1..4-before.jpg / -after.jpg   470–960 px wide ⚠ small (before = greyscale originals)
```
⚠ = keep at or below its pixel width ÷ 2 in CSS px on screen. The optimizer marks these `lowRes`.

## 2. Logos: where and how
- Copy the 6 PNGs to `src/assets/logos/`. With sharp, generate display versions at 3× their largest on-screen size: compact HomyEight at **96 px tall**, Behomy at **120 px tall**, as PNG and WebP. Import them via Vite (hashed URLs).
- **Usage:**

| Place | Light theme | Dark theme / over photos | Height on screen |
|---|---|---|---|
| Hero partner line | `homyeight-compact`, `behomy` | `*-on-dark` versions | ~22 px desktop, 18 px mobile |
| Funnel panel header ("Powered by") | `homyeight-compact` | `homyeight-compact-on-dark` | 16–18 px |
| Behomy hero (over photo) | `behomy-on-dark` | `behomy-on-dark` | 40 px desktop, 32 px mobile |
| Footer ("Powered by HomyEight · Operated by Behomy") | `homyeight-compact`, `behomy` | `*-on-dark` | 20 px |
| Anywhere ≥ 48 px tall | the full `homyeight` (with tagline) may be used | `homyeight-on-dark` | — |

- **Rules:** never recolour, outline, stretch, rotate or add effects. Keep clear space ≥ the height of the "H" in HomyEight's mark on every side. `alt` text: "HomyEight" / "Behomy". Partner logos are the **second colour exception** in the B&W design, after the renders and photos. Update `docs/03` §3 to say so.
- Switch logo variants with the theme using `<picture>` + `prefers-color-scheme`, or by reading `data-theme`. No flash on load.

## 3. Photos: pipeline and captions
**Pipeline edits** (both scripts are shipped in `scripts/` from the first build):
1. `scripts/optimize-images.mjs`: add the folder as an extra group:
```js
const EXTRA_GROUPS = {
  'padel-clean': path.join(ROOT, '.cache', 'padel-clean'),
  photos: path.join(ROOT, 'assets-src', 'photos'),
};
```
2. `scripts/depth-maps.py`: add `"photos"` to `GROUPS`, and skip the before/after pairs and the team photo (people at the edges smear):
```python
GROUPS = {"facades", "interiors", "cafe", "office", "others", "maxone", "photos"}
EXCLUDE = {"maxone/layout", "photos/behomy-team", "photos/staff-training"} | {f"photos/before-after-{i}-{s}" for i in range(1, 5) for s in ("before", "after")}
```
3. Run `npm run assets:images`, then the depth script. The manifest gains 25 `photos/*` entries.

**Captions** (these are factual brand captions, `U01_06` §0, so not placeholders):

| Photo | Caption (three voices: **name** · place · *type*) |
|---|---|
| behomy-room-1, behomy-room-2 | **Behomy Residence** · *Co-living room* |
| behomy-life | **Behomy Residence** · *Life at Behomy* |
| corvel-room | **Corvel by Behomy** · Jakarta Pusat · *Business stay* |
| corvel-lobby | **Corvel by Behomy** · Jakarta Pusat · *Lobby* |
| purnava-pool | **Purnava Village by Behomy** · Bali · *Villa* |
| hoteru-room, hoteru-stair | **Hoteru by Behomy** · *Shophouse stay* |
| behomy-facade-1, behomy-facade-2, behomy-corridor | Placeholder (project name unknown): **Project Name** · City, Province · *Behomy property* |
| behomy-team | **The Behomy team** |
| staff-training | *Front office and housekeeping training* |
| before-after-1..4 | Placeholder **Project Name** · City · *Before / after*, with the labels "Before" / "After" |
| step-* | No caption (the step text explains them) |

Add these to `src/content/projects.js` (or a sibling `behomy.js`), so the owner can edit them later like the other captions. For the owner's convenience, add a comment with the **unconfirmed** project names visible in the Behomy profile pages (Build-Operate-Share: Behomy Inn Malang, Corner Eight, Cibinong Suite, Suhat Malang; Equity: Metropolim, Urban Connect, Cempaka Putih, Hoteru Bandung). **Don't display them** until the owner confirms which photo is which.

**Alt text:** describe what's visible ("Hotel room with a single bed and a pillow printed with the beHomy logo"). Never invent project names.

## 4. Posters for the portfolio button and index
Reuse the posters from `public/media/posters/` (`hero-2`, `maxone-1`, `padel-3`). If any are missing, regenerate them with the Playwright poster script from the first build (`docs/06` §1.8), now pointing at `/portofolio/`.

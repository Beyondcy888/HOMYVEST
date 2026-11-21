# 08 — Assets (Milestone M1)

## 1. Where the renders are, and the rules
- The owner's **original, unzipped** renders are in `render/` at the project root (possibly nested as `render/renders/`). The scripts find the folder automatically: it's the directory that contains `maxone/` and `padel-court/`.
- **Never modify, move, rename, re-save or delete anything in `render/`.** Everything the site uses is generated from it into `public/media/` and `.cache/`.
- **Never upscale.** Every image is served from responsive variants no wider than its source. That's why the originals are used: the zip the owner sent earlier was only for review.
- **Never show baked-in text** from the padel images ("AKSONOMETRI", "LANTAI 1/2", "BANGUNAN"). Use only the cleaned cut-outs (`padel-clean/*`).

### `assets-src/`: the other originals (update U01)
`assets-src/` holds originals delivered with update U01. **Treat it exactly like the renders: read only. Never modify, move, rename, re-save or delete anything in it.** Web copies are generated elsewhere.
- `assets-src/logos/`: the six partner logo PNGs (HomyEight full, compact and on-dark versions; Behomy and Behomy on-dark). Copied unchanged to `src/assets/logos/`, plus display versions (§8).
- `assets-src/photos/`: 25 photos extracted, at the owner's request, from the HomyEight and Behomy 2026 company profiles. They go through the same optimizer as the renders, as the group `photos` (§3, inventory in §4).

## 2. Low-resolution files: keep them small on screen
`optimize-images.mjs` flags any source narrower than 1200 px as `lowRes: true` in the manifest:

**The rule since U01:** a small source is never shown wider than **half its pixel width** in CSS px, so it stays crisp on 2× screens and is never upscaled (DECISIONS U01-D10). The caps actually in the CSS:

| Id | Source size | Cap on screen | Where it's set |
|---|---|---|---|
| `facades/benhil-1` | 810 × 607 | 405 CSS px (the gallery's small size) | `Projects.css` `.pj--s` |
| `facades/benhil-2` | 810 × 537 | 405 CSS px | same |
| `facades/facade-2` | 1123 × 632 | 405 CSS px; never full-bleed | same |
| `photos/step-design`, `step-build` (854 × 388), `step-operate` (800 × 600) | 1280 / 854 / 800 wide | 400 CSS px, every step photo | `How.css` `.how-step__media` |
| `photos/staff-training` | 1200 × 800 | 600 CSS px | `Behomy.css` `.behomy__training` |
| Behomy mosaic, `lowRes` ones: `hoteru-room`, `hoteru-stair` (810 × 540), `purnava-pool` (922 × 615), `behomy-room-2` (960 × 717), `behomy-room-1` (1012 × 679), `behomy-facade-2` (908 × 1210, portrait) | 810–1012 wide | one column wide only (single or tall cells): a quarter of the content width on desktop, half of at most 820 px below 1024 px. Only the high-resolution corridor takes the large cell (DECISIONS U01-D9) | `Behomy.css` `.bp__grid`, `src/content/behomy.js` |
| `photos/before-after-1..4-*` | 470–960 wide | 420 CSS px (U01_01's cap, although some sources are 470 px) | `Behomy.css` `.ba__shot` |

The Projects gallery always shows a `lowRes` image at its small size, whatever its slot (`Projects.jsx`). On phones a small project image takes at most `min(62%, 405px)` of the column, with its caption beside it.

## 3. Pipeline
Run in this order during M1, and re-run whenever renders or `assets-src/` change:
```bash
npm run assets:padel      # 3.1  → .cache/padel-clean/padel-1..3.png (transparent, captions removed)
npm run assets:images     # 3.2  → public/media/** + src/content/media-manifest.json  (~4 min)
.venv-depth/bin/python scripts/depth-maps.py    # 3.3 → public/media/depth/** + src/content/depth-status.json
#   Windows: .venv-depth/Scripts/python.exe scripts/depth-maps.py   (or: npm run assets:depth)
npm run assets:logos      # §8   → src/assets/logos/ (copies + display versions)
```
Run the optimizer with a generous timeout (≥ 10 min). It processes **60 images**: 32 renders, 3 cleaned padel images (extra group `padel-clean`) and 25 company-profile photos (extra group `photos`, read from `assets-src/photos/`), into AVIF and WebP at widths 480/800/1200/1600/2000/2560 (capped at the source width). Each visitor only downloads the sizes they need.

**Depth maps:** the group `photos` is included, except the photos with people at the edges (`photos/behomy-team`, `photos/staff-training`) and the eight before / after photos, whose edges smear. `maxone/layout` (a floor plan) stays excluded. Today that gives 43 maps, 15 of them photos.

**Verify:**
- `src/content/media-manifest.json` has 60 entries: `padel-clean/padel-1..3` with `hasAlpha: true`, and 25 `photos/*`.
- Open `public/media/padel-clean/padel-1-1200.webp` and the others **and look at them**: no text anywhere, a transparent background, the building intact.
- `src/content/depth-status.json` exists. If `available: true`, view two depth maps: white should be near and black far. If not available, the reason is logged.
- `assets-src/` and the render folder are unchanged (`git status`, timestamps).

The three scripts below are tested and also shipped in `scripts/`. Recreate them from these blocks only if those files are missing.

### 3.1 `scripts/clean-padel.mjs`
Keeps the largest connected drawing (the building) and drops everything else (captions, specks). Makes the border-connected white background transparent, softens the 1 px rim, and crops with 8 px padding. Tested result: `padel-1` 1830 × 1119, `padel-2` 1342 × 895, `padel-3` 1341 × 928.

```js
// Removes captions ("AKSONOMETRI", "LANTAI 1/2", "BANGUNAN") and the white background
// from the padel axonometric renders. Keeps only the building, on transparency.
// Usage: node scripts/clean-padel.mjs                      (auto: <render root>/padel-court -> .cache/padel-clean)
//        node scripts/clean-padel.mjs <srcDir> <outDir>
// Output: transparent PNG masters padel-1.png, padel-2.png, padel-3.png (optimize-images.mjs makes web variants).
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

function findRenderRoot(start) {
  for (const c of ['render', 'renders', 'render/renders', 'renders/renders', 'render/render']) {
    const p = path.join(start, c);
    if (fs.existsSync(path.join(p, 'maxone')) && fs.existsSync(path.join(p, 'padel-court'))) return p;
  }
  throw new Error('Render folder not found. Expected render/ (or renders/) containing maxone/ and padel-court/.');
}
const args = process.argv.slice(2);
const srcDir = args[0] ?? path.join(findRenderRoot(process.cwd()), 'padel-court');
const outDir = args[1] ?? path.join(process.cwd(), '.cache', 'padel-clean');
fs.mkdirSync(outDir, { recursive: true });

const NONWHITE = 235;   // a pixel is "ink" if its darkest channel is below this
const WHITE = 246;      // background = near-white pixels connected to the border
const DILATE = 6;       // px; merges the building's parts into one blob before labelling

function labelComponents(mask, w, h) {
  const lab = new Int32Array(w * h); let n = 0; const sizes = [0];
  const stack = new Int32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || lab[i]) continue;
    n++; let size = 0, sp = 0; stack[sp++] = i; lab[i] = n;
    while (sp) {
      const p = stack[--sp]; size++;
      const x = p % w, y = (p / w) | 0;
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of nb) if (q >= 0 && mask[q] && !lab[q]) { lab[q] = n; stack[sp++] = q; }
    }
    sizes.push(size);
  }
  return { lab, n, sizes };
}

function dilate(mask, w, h, r) {
  let cur = mask;
  for (let k = 0; k < r; k++) {
    const nxt = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (cur[i] || (x > 0 && cur[i - 1]) || (x < w - 1 && cur[i + 1]) || (y > 0 && cur[i - w]) || (y < h - 1 && cur[i + w])) nxt[i] = 1;
    }
    cur = nxt;
  }
  return cur;
}

for (const file of ['1.png', '2.png', '3.png']) {
  const src = path.join(srcDir, file);
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const minc = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) minc[i] = Math.min(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);

  // 1) keep only the largest ink blob (the building); captions and specks are separate blobs
  const ink = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) ink[i] = minc[i] < NONWHITE ? 1 : 0;
  const blobs = labelComponents(dilate(ink, w, h, DILATE), w, h);
  let best = 1; for (let k = 2; k <= blobs.n; k++) if (blobs.sizes[k] > blobs.sizes[best]) best = k;

  // 2) background = near-white regions touching the image border
  const nearWhite = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) nearWhite[i] = minc[i] >= WHITE ? 1 : 0;
  const bgL = labelComponents(nearWhite, w, h);
  const borderLabels = new Set();
  for (let x = 0; x < w; x++) { borderLabels.add(bgL.lab[x]); borderLabels.add(bgL.lab[(h - 1) * w + x]); }
  for (let y = 0; y < h; y++) { borderLabels.add(bgL.lab[y * w]); borderLabels.add(bgL.lab[y * w + w - 1]); }
  borderLabels.delete(0);

  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = (blobs.lab[i] === best && !borderLabels.has(bgL.lab[i])) ? 255 : 0;

  // 3) soften the 1px rim so edges don't look jagged on a dark or tinted page
  const out = Buffer.alloc(w * h * 4);
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; let a = alpha[i];
    if (a) {
      const rim = (x > 0 && !alpha[i - 1]) || (x < w - 1 && !alpha[i + 1]) || (y > 0 && !alpha[i - w]) || (y < h - 1 && !alpha[i + w]);
      if (rim) a = Math.max(60, Math.min(255, (255 - minc[i]) * 4));
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    out[i * 4] = data[i * 3]; out[i * 4 + 1] = data[i * 3 + 1]; out[i * 4 + 2] = data[i * 3 + 2]; out[i * 4 + 3] = a;
  }
  const pad = 8;
  const left = Math.max(0, x0 - pad), top = Math.max(0, y0 - pad);
  const cw = Math.min(w, x1 + pad + 1) - left, ch = Math.min(h, y1 + pad + 1) - top;
  const name = `padel-${path.parse(file).name}`;
  const img = sharp(out, { raw: { width: w, height: h, channels: 4 } }).extract({ left, top, width: cw, height: ch });
  await img.png({ compressionLevel: 9 }).toFile(path.join(outDir, `${name}.png`)); // PNG master; optimize-images.mjs makes the web variants
  console.log(`${file}: ${w}x${h} -> ${name} ${cw}x${ch} (crop at ${left},${top}; kept blob ${best} of ${blobs.n})`);
}
```

### 3.2 `scripts/optimize-images.mjs`
```js
// Builds web-ready, never-upscaled AVIF + WebP variants from the ORIGINAL renders,
// plus a manifest the site reads. Originals are never modified.
// Usage: node scripts/optimize-images.mjs            (auto-detects the render folder)
//        node scripts/optimize-images.mjs <renderRoot>
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'media');
const MANIFEST = path.join(ROOT, 'src', 'content', 'media-manifest.json');
const EXTRA_GROUPS = {
  'padel-clean': path.join(ROOT, '.cache', 'padel-clean'), // produced by clean-padel.mjs
  photos: path.join(ROOT, 'assets-src', 'photos'),          // company-profile photos (updates/U01/U01_07_ASSETS.md); read only
};
const WIDTHS = [480, 800, 1200, 1600, 2000, 2560];
const IMG = /\.(png|jpe?g|webp|tiff?)$/i;

function findRenderRoot(start) {
  // The render folder is the directory that directly contains "maxone" and "padel-court".
  const candidates = ['render', 'renders', 'render/renders', 'renders/renders', 'render/render'];
  for (const c of candidates) {
    const p = path.join(start, c);
    if (fs.existsSync(path.join(p, 'maxone')) && fs.existsSync(path.join(p, 'padel-court'))) return p;
  }
  throw new Error('Render folder not found. Expected render/ (or renders/) containing maxone/ and padel-court/.');
}

const slug = (name) => path.parse(name).name.toLowerCase().replace(/[()]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function processImage(srcPath, group) {
  const id = `${group}/${slug(path.basename(srcPath))}`;
  const img = sharp(srcPath, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  const { width, height } = meta;
  const hasAlpha = Boolean(meta.hasAlpha) && group === 'padel-clean';     // only the cut-outs need transparency
  const widths = [...new Set([...WIDTHS.filter((w) => w < width), width])].sort((a, b) => a - b);
  const dir = path.join(OUT_DIR, group); fs.mkdirSync(dir, { recursive: true });
  const base = slug(path.basename(srcPath));
  const variants = { avif: [], webp: [] };
  for (const w of widths) {
    const pipeline = sharp(srcPath, { failOn: 'none' }).rotate().resize({ width: w, withoutEnlargement: true });
    const src = hasAlpha ? pipeline : pipeline.flatten({ background: '#ffffff' });
    const avifFile = `${base}-${w}.avif`, webpFile = `${base}-${w}.webp`;
    await src.clone().avif({ quality: hasAlpha ? 70 : 58, effort: 2 }).toFile(path.join(dir, avifFile));
    await src.clone().webp({ quality: hasAlpha ? 90 : 80, alphaQuality: 100 }).toFile(path.join(dir, webpFile));
    variants.avif.push({ w, url: `/media/${group}/${avifFile}` });
    variants.webp.push({ w, url: `/media/${group}/${webpFile}` });
  }
  const lqipBuf = await sharp(srcPath, { failOn: 'none' }).rotate().resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  const { dominant } = await sharp(srcPath, { failOn: 'none' }).stats();
  return {
    id, group, source: path.relative(ROOT, srcPath).split(path.sep).join('/'),
    width, height, aspect: +(width / height).toFixed(4), hasAlpha,
    largestUrl: variants.webp.at(-1).url,
    srcset: { avif: variants.avif.map((v) => `${v.url} ${v.w}w`).join(', '), webp: variants.webp.map((v) => `${v.url} ${v.w}w`).join(', ') },
    lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
    dominant: `#${[dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, '0')).join('')}`,
    lowRes: width < 1200,           // flag: keep these small on screen (see docs/08_ASSETS.md)
  };
}

const renderRoot = process.argv[2] ? path.resolve(process.argv[2]) : findRenderRoot(ROOT);
const groups = fs.readdirSync(renderRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => [d.name, path.join(renderRoot, d.name)]);
for (const [g, p] of Object.entries(EXTRA_GROUPS)) if (fs.existsSync(p)) groups.push([g, p]);

const manifest = { generatedAt: new Date().toISOString(), renderRoot: path.relative(ROOT, renderRoot), images: {} };
for (const [group, dir] of groups) {
  for (const f of fs.readdirSync(dir).filter((f) => IMG.test(f)).sort()) {
    const id = `${group}/${slug(f)}`;
    if (manifest.images[id]) { console.warn(`skip duplicate ${id} (${f})`); continue; }
    const entry = await processImage(path.join(dir, f), group);
    manifest.images[entry.id] = entry;
    console.log(`${entry.id.padEnd(28)} ${entry.width}x${entry.height}${entry.lowRes ? '  (low-res)' : ''}`);
  }
}
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`\n${Object.keys(manifest.images).length} images -> ${path.relative(ROOT, MANIFEST)}`);
```

### 3.3 `scripts/depth-maps.py`
```python
#!/usr/bin/env python3
"""
HOMYVEST depth maps (build-time only; visitors never run this).

Creates a soft greyscale depth map for each photographic render so the site can give it
a subtle 3D "look into the room" parallax (see docs/06_3D_EXPERIENCES.md, section 6).

Model: depth-anything/Depth-Anything-V2-Small-hf  (Apache-2.0. Do NOT switch to Base/Large: those are non-commercial.)
Output: public/media/depth/<group>/<slug>.webp  (white = near, black = far)
Status: src/content/depth-status.json  (the site reads this; available:false => effect disabled, site still works)

Run:   .venv-depth/bin/python scripts/depth-maps.py            (Windows: .venv-depth\\Scripts\\python.exe ...)
Flags: --force (regenerate all)   --only <id> (e.g. interiors/interior-3)
"""
import argparse, json, sys, time
from pathlib import Path

ROOT = Path.cwd()
MANIFEST = ROOT / "src" / "content" / "media-manifest.json"
OUT_DIR = ROOT / "public" / "media" / "depth"
STATUS = ROOT / "src" / "content" / "depth-status.json"
MODEL = "depth-anything/Depth-Anything-V2-Small-hf"
GROUPS = {"facades", "interiors", "cafe", "office", "others", "maxone", "photos"}   # photographic renders + photos
# maxone/layout: floor plan, no depth effect. Team/training photos and before/after pairs: people at the edges smear.
EXCLUDE = {"maxone/layout", "photos/behomy-team", "photos/staff-training"} | {f"photos/before-after-{i}-{s}" for i in range(1, 5) for s in ("before", "after")}
MAX_SIDE = 1280                                                          # depth maps are soft; this is plenty


def write_status(available, items, note=""):
    STATUS.parent.mkdir(parents=True, exist_ok=True)
    STATUS.write_text(json.dumps({"available": available, "model": MODEL, "note": note,
                                  "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S"), "items": items}, indent=2))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", default=None)
    args = ap.parse_args()

    if not MANIFEST.exists():
        print("media-manifest.json not found. Run `node scripts/optimize-images.mjs` first.")
        write_status(False, {}, "manifest missing")
        return 0

    try:
        import numpy as np
        import torch
        from PIL import Image, ImageFilter
        from transformers import pipeline
    except Exception as e:  # missing deps => graceful fallback
        print(f"[depth] dependencies unavailable ({e}). Depth effect will be disabled; the site still works.")
        write_status(False, {}, f"dependencies unavailable: {e}")
        return 0

    device = "cuda" if torch.cuda.is_available() else ("mps" if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available() else "cpu")
    print(f"[depth] loading {MODEL} on {device} (first run downloads ~100 MB) ...")
    try:
        estimator = pipeline("depth-estimation", model=MODEL, device=device)
    except Exception as e:
        print(f"[depth] could not load model ({e}). Depth effect disabled.")
        write_status(False, {}, f"model load failed: {e}")
        return 0

    manifest = json.loads(MANIFEST.read_text())["images"]
    prev = json.loads(STATUS.read_text())["items"] if STATUS.exists() else {}
    items = {} if args.force else dict(prev)
    todo = [m for m in manifest.values() if m["group"] in GROUPS and m["id"] not in EXCLUDE and (not args.only or m["id"] == args.only)]

    for i, m in enumerate(todo, 1):
        group, slug = m["id"].split("/", 1)
        out = OUT_DIR / group / f"{slug}.webp"
        if out.exists() and not args.force and m["id"] in items:
            print(f"[{i}/{len(todo)}] {m['id']} (cached)")
            continue
        src = Image.open(ROOT / m["source"]).convert("RGB")
        src.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        t = time.time()
        depth = estimator(src)["predicted_depth"]                     # relative inverse depth: larger = nearer
        d = depth.squeeze().detach().float().cpu().numpy()
        lo, hi = np.percentile(d, 2), np.percentile(d, 98)            # robust normalisation
        d = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1)
        img = Image.fromarray((d * 255).astype("uint8"), "L").resize(src.size, Image.BICUBIC)
        # Grow near objects slightly, then blur: prevents "stretched" halos at foreground edges.
        img = img.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(radius=max(2, src.width // 400)))
        out.parent.mkdir(parents=True, exist_ok=True)
        img.convert("RGB").save(out, "WEBP", quality=88)
        items[m["id"]] = {"url": f"/media/depth/{group}/{slug}.webp", "width": img.width, "height": img.height}
        print(f"[{i}/{len(todo)}] {m['id']} -> {out.relative_to(ROOT)} ({time.time() - t:.1f}s)")
        write_status(True, items)                                       # save progress after every image

    write_status(True, items, f"{len(items)} depth maps")
    print(f"[depth] done: {len(items)} maps. Status -> {STATUS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## 4. Inventory and where each image goes
"Category" was the **provisional** Projects filter. The filters were removed in update U01, so it's no longer used; it stays here only as a hint for the owner's captions. "Suggested caption" lists what's known from the company profiles: **don't display it**. Display the placeholder (§5) until the owner fills in captions. The walkthrough, padel and Beyond images are used on `/portofolio/`.

| Id | Source | What it shows | Used in | Category (provisional) | Suggested caption (not displayed) |
|---|---|---|---|---|---|
| `facades/best` | 1600 × 900 | Corner building at dusk, timber and dark cladding, every window lit | Main hero photo (`#top`, preloaded, the LCP), Projects (first, large), `#next` background, portfolio-card thumbnail, story beats 4–5 on `/portofolio/` (colour arrival), OG image | Villa | — |
| `facades/facade-1` | 1536 × 1024 | 5-storey kost building on a street corner, orange vertical fin, sign "Kost Kebon Bawang" | Projects (large) | Kost | Kost Kebon Bawang |
| `facades/facade-2` | 1123 × 632 ⚠ | Low-rise residence with orange panels and a gate, cyclists | Projects (small) | Guesthouse | — |
| `facades/benhil-1` | 810 × 607 ⚠ | 7-storey kost tower with an orange brick-screen column, street view | Projects (small) | Kost | Benhil (Bendungan Hilir) |
| `facades/benhil-2` | 810 × 537 ⚠ | Same tower, frontal view | Projects (small, paired with benhil-1) | Kost | Benhil |
| `interiors/interior-1` | 1920 × 1080 | Long dining space, concrete walls, "HOMY STAY" lettering, arched niches | Projects | Guesthouse | Homy Stay |
| `interiors/interior-2` | 1483 × 762 | Bedroom with sage headboard, desk by a large window | Projects | Kost | — |
| `interiors/interior-3` | 1672 × 941 | Lobby with reception counter, glass-block wall, timber stair | Projects | Guesthouse | — |
| `interiors/interior-4` | 1535 × 1024 | Bedroom with sage slatted headboard, TV, wardrobe | Projects | Kost | — |
| `interiors/interior-5` | 1920 × 1080 | Double-height living room, chandelier, glass wall | Projects (large) | Homestay | — |
| `interiors/interior-6` | 1920 × 1080 | Lounge and dining table under a timber ceiling | Projects | Homestay | — |
| `interiors/interior-7` | 1920 × 1080 | Bedroom with walk-in wardrobe and a garden view | Projects | Villa | — |
| `interiors/interior-8` | 1920 × 1080 | Kitchen and dining, "WELCOME HOME" and "HOMY" lettering | Projects | Kost | — |
| `maxone/1` | 1976 × 1274 | Reception with a passport-stamp mural, "maxone" display, yellow stools, red armchairs | Walkthrough stop S1, portfolio-card thumbnail | — | Maxone Hotel, Jakarta · Lobby · 2026 |
| `maxone/2` | 1976 × 1274 | Dining hall looking toward the buffet, navy chairs | Walkthrough S2 | — | Maxone Hotel · Dining |
| `maxone/3` | 1976 × 1274 | "BAR" arch shelving, yellow drawer counter, sage cabinets | Walkthrough S3 (second) | — | Maxone Hotel · Buffet and bar |
| `maxone/4` | 1976 × 1380 | Elevation toward the street glazing with the mezzanine above | Walkthrough S6 | — | Maxone Hotel · Dining floor |
| `maxone/5` | 1976 × 1274 | Buffet and bar from the dining tables | Walkthrough S3 (first) | — | Maxone Hotel · Buffet and bar |
| `maxone/6` | 1976 × 1274 | Sage pergola frame over tables by the windows | Walkthrough S5 | — | Maxone Hotel · By the windows |
| `maxone/7` | 1976 × 1274 | Looking up into the double-height void with hanging plants | Walkthrough S4 | — | Maxone Hotel · The void |
| `maxone/layout` | 1976 × 1274 | Floor plan (top view) | End-to-end step 01 "Plan" (`#how`, greyscale crop), 3D modelling reference, mini-map, S6 plan dissolve | — | — |
| `office/office-1` | 2008 × 1133 | Office with red beams, skylights, long desks | Beyond: Office | — | — |
| `office/office-2` | 2008 × 1133 | Office with herringbone floor, wall shelves, plants | Beyond: Office | — | — |
| `office/office-3` | 2008 × 1133 | Office lounge corner with a round table | Beyond: Office | — | — |
| `cafe/cafe` | 1920 × 1080 | Café with red tiles, "CORNER EIGHT" sign, hanging plants | Beyond: Café | — | Corner Eight café, Lippo Karawaci |
| `others/athero-1` | 2820 × 1585 | Aerial view of a mini soccer site **with baked-in labels** | Beyond: Mini soccer, **lead image** (included at the owner's request in U01; its Indonesian labels read as a site plan) | — | Athero Arena, Bogor · Design by HomyEight |
| `others/athero-2` | 2820 × 1585 | Container café and stands beside the pitch | Beyond: Mini soccer | — | Athero Arena · Design by HomyEight |
| `others/athero-3` | 2820 × 1585 | Arena entrance and parking, "ATHERO ARENA" sign | Beyond: Mini soccer (second) | — | Athero Arena · Design by HomyEight |
| `others/athero-4` | 2820 × 1585 | On the pitch, floodlights, nets | Beyond: Mini soccer | — | Athero Arena · Design by HomyEight |
| `padel-court/1..3` | originals | **Never display** (they contain captions). Sources for `padel-clean`. | — | — | — |
| `padel-clean/padel-1` | 1830 × 1119 (alpha) | Padel hall ground floor, axonometric | Padel stage 1 reveal | — | Athero padel hall · Design by HomyEight |
| `padel-clean/padel-2` | 1342 × 895 (alpha) | Upper floor and structure | Padel stage 2 reveal | — | same |
| `padel-clean/padel-3` | 1341 × 928 (alpha) | Finished hall with vaulted roof | Padel stage 3 reveal, portfolio-card thumbnail | — | same |

⚠ = low-res (§2).

### Company-profile photos (`photos/*`, from `assets-src/photos/`, update U01)
All on the main page. Sizes from the manifest; `lowRes` = narrower than 1200 px. "Depth" = has a depth map (§3).

| Id | Source | What it shows | Used in | lowRes | Depth |
|---|---|---|---|---|---|
| `photos/behomy-hero` | 3096 × 2064 | Behomy room, beHomy pillow | Behomy hero (full-bleed) | | yes |
| `photos/step-design` | 1280 × 720 | HomyEight 3D design of a kost building | End-to-end: 02 Design | | yes |
| `photos/step-build` | 854 × 388 | Construction with scaffolding, B&W | End-to-end: 03 Build | ⚠ | yes |
| `photos/step-operate` | 800 × 600 | Guest checking in at a Behomy reception | End-to-end: 04 Operate | ⚠ | yes |
| `photos/behomy-corridor` | 3716 × 2477 | Behomy corridor and stair | Behomy mosaic (the large cell) | | yes |
| `photos/behomy-facade-1` | 1200 × 1800 | Behomy building, timber fins (portrait) | Behomy mosaic (tall cell) | | yes |
| `photos/behomy-facade-2` | 908 × 1210 | Behomy building, orange brick screen (portrait) | Behomy mosaic (tall cell) | ⚠ | yes |
| `photos/behomy-room-1` | 1012 × 679 | Behomy Residence room | Behomy mosaic | ⚠ | yes |
| `photos/behomy-room-2` | 960 × 717 | Behomy Residence room | Behomy mosaic | ⚠ | yes |
| `photos/behomy-life` | 1200 × 800 | Residents in a Behomy lounge (guitar) | Behomy mosaic | | yes |
| `photos/corvel-room` | 1239 × 826 | Corvel room with city view | Behomy mosaic | | yes |
| `photos/corvel-lobby` | 1239 × 826 | Corvel lobby | Behomy mosaic | | yes |
| `photos/purnava-pool` | 922 × 615 | Purnava Village pool, Bali | Behomy mosaic | ⚠ | yes |
| `photos/hoteru-room` | 810 × 540 | Hoteru room (Japandi) | Behomy mosaic | ⚠ | yes |
| `photos/hoteru-stair` | 810 × 540 | Hoteru corridor and stair | Behomy mosaic | ⚠ | yes |
| `photos/staff-training` | 1200 × 800 | Front office and housekeeping training | Behomy, under "What Behomy takes off your hands" | | no |
| `photos/behomy-team` | 2698 × 1800 | The Behomy team | Behomy section close (full-bleed) | | no |
| `photos/before-after-{1..4}-before` / `-after` | 470–960 wide | Before (greyscale originals) and after | "From idle to running" | ⚠ all | no |

Owner checks noted in the asset review (DECISIONS U01-D16, not changed): before / after pairs 3 and 4 are Google Street View captures; pair 4's "after" shows "Behomy Metropolim"; the training photo shows a "Corner Eight" sign; the team photo's banner reads "Homy Group".

## 5. Captions: placeholders now, real text later
Captions live in **two editable files**, so the owner (or a later agent) can fill them in without touching components:
- `src/content/projects.js`: the Projects gallery, the Maxone cards, padel and Beyond. It also holds `gallery`, the curated order and sizes of the Projects section.
- `src/content/behomy.js`: the Behomy photos (`photos/*`). `projects.js` merges them into the one `captions` export.
```js
// Fill in name, place, type and status for each image. While `name` is null, the UI shows the placeholder.
// Any value may also be written per language: { en: 'Lobby', id: 'Lobi' }.
const projectCaptions = {
  'facades/facade-1':     { name: null, place: null, type: null, status: null },
  'interiors/interior-5': { name: null, place: null, type: null, status: null },
  // … one entry per displayed image
};
export const captions = { ...projectCaptions, ...behomyCaptions };
```

**Behomy photo captions** (`src/content/behomy.js`). The brand captions are facts (`02` §6), not placeholders. Three voices: **name** · place · *type*.

| Photo | Caption EN | Type in ID |
|---|---|---|
| `behomy-room-1`, `behomy-room-2` | **Behomy Residence** · *Co-living room* | Kamar co-living |
| `behomy-life` | **Behomy Residence** · *Life at Behomy* | Kehidupan di Behomy |
| `corvel-room` | **Corvel by Behomy** · Jakarta Pusat · *Business stay* | Penginapan bisnis |
| `corvel-lobby` | **Corvel by Behomy** · Jakarta Pusat · *Lobby* | Lobi |
| `purnava-pool` | **Purnava Village by Behomy** · Bali · *Villa* | Vila |
| `hoteru-room`, `hoteru-stair` | **Hoteru by Behomy** · *Shophouse stay* | Penginapan ruko |
| `behomy-facade-1`, `behomy-facade-2`, `behomy-corridor` | placeholder **Project Name** · City, Province · *Behomy property* (project not known yet) | Properti Behomy |
| `behomy-team` | **The Behomy team** (name only) | Tim Behomy |
| `staff-training` | *Front office and housekeeping training* (type only) | Pelatihan front office dan housekeeping |
| `before-after-1..4` | one caption per pair, keyed by the "after" photo: placeholder **Project Name** · City, Province · *Before / after* | Sebelum / sesudah |
| `step-*`, `behomy-hero` | no caption (the text around them explains them) | — |

A comment at the top of `behomy.js` lists the **unconfirmed** project names seen in the Behomy profile (Build-Operate-Share: Behomy Inn Malang, Corner Eight, Cibinong Suite, Suhat Malang; Equity: Metropolim, Urban Connect, Cempaka Putih, Hoteru Bandung). **Don't display them** until the owner confirms which photo is which. Alt text describes what's visible and never names a project (`alt.photos/*` in the i18n files).
**Placeholder rendering** (three voices, `03` §2), identical in EN and ID:
> **Project Name**
> City, Province
> *Type · Year*

Style it deliberately (bold / regular / italic muted) so it looks designed, not broken. Add a `data-placeholder="true"` attribute so QA can count remaining placeholders. List them in `REPORT.md` under "Needs you", with this table for the owner to fill in:

| Image id | Project name | City, province | Type (Kost / Guesthouse / Homestay / Villa / Café / Office / Sports) | Status (Built / In progress / Design) | Built by / Operated by |
|---|---|---|---|---|---|

## 6. Image component
`<Img id="…" sizes="…" alt="…" priority={false} />` reads the manifest:
```html
<picture>
  <source type="image/avif" srcset="{srcset.avif}" sizes="{sizes}">
  <source type="image/webp" srcset="{srcset.webp}" sizes="{sizes}">
  <img src="{largestUrl}" width="{width}" height="{height}" alt="{alt}" loading="lazy" decoding="async"
       style="background: {dominant} url({lqip}) center/cover">
</picture>
```
- Always pass an accurate `sizes` (e.g. `(min-width: 1024px) 46vw, 100vw`).
- `priority` (hero photo only): `loading="eager"`, `fetchpriority="high"`, plus a `<link rel="preload" as="image" imagesrcset=… imagesizes=…>` in the head.
- Alt text: describe what's in the image in the active language (e.g. "Bedroom with a sage headboard and a desk by the window"). Don't invent project names in alt text.
- `DepthImage` (`06` §6) wraps `Img`.

## 7. Generated assets (made by you during the build)
| Asset | How | Where |
|---|---|---|
| Favicon | Bold "H" (Archivo 900) in `--paper` on an `--ink` square. SVG plus 32 px and 180 px PNG (render with sharp from the SVG). | `public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` |
| OG image 1200 × 630 | `facades/best` darkened 35% with the wordmark centred in `--paper` and the tagline below. Composite with sharp; render text as SVG with outlined Archivo (or a system-font SVG if outlining fails, logged). | `public/og.jpg` |
| 3D posters | Playwright captures at key progress points (`06` §1.8). Used on `/portofolio/` only; the main page's portfolio card uses library images instead (DECISIONS U01-D8). | `public/media/posters/*.webp` |
| Partner logo display versions | `npm run assets:logos` (§8) | `src/assets/logos/*@96.*`, `*@120.*` |
| Mural texture (Maxone) | Generated at runtime on a canvas (`06` §3.5) | — |

The door line drawings of the first build were removed with the doors in update U01.

## 8. Partner logos
`scripts/make-logos.mjs` (`npm run assets:logos`):
1. Copies the six PNGs from `assets-src/logos/` to `src/assets/logos/`, unchanged.
2. Builds display versions at 3× their largest on-screen height, as PNG and lossless WebP with alpha, never upscaled: `homyeight-compact` and `homyeight-compact-on-dark` at **96 px** tall, `behomy` and `behomy-on-dark` at **120 px** tall.

`PartnerLogo.jsx` imports the WebP display versions through Vite (hashed URLs). The full `homyeight` logos (with tagline) are copied but not used today. Where each logo goes, its size and the rules: `03` §3.1.

## 9. The manifest in the browser
The page imports `src/content/media-manifest.json`, but the browser never receives the JSON as written. A small Vite plugin in `vite.config.ts` (`slimManifest`) resolves that import to a virtual module built by `scripts/slim-manifest.mjs`:
- It keeps only the fields the site reads (`width`, `height`, `hasAlpha`, `lowRes`, `dominant`, `lqip`, `largestUrl`, `srcset.avif`, `srcset.webp`) and drops build-only fields (source path, group, aspect, `generatedAt`…).
- The srcset strings follow one pattern (`/media/<group>/<slug>-<w>.<ext> <w>w`), so each is stored as a URL base plus a list of widths and rebuilt once at load, giving exactly the same strings. Any entry that doesn't fit the pattern is kept as it was.

Nothing changes for components or scripts: they read the same manifest, and `depth-maps.py` still reads the JSON file. It was part of bringing the main page's first load under budget (`09` §7).

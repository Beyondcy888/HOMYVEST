# 08 — Assets (Milestone M1)

## 1. Where the renders are, and the rules
- The owner's **original, unzipped** renders are in `render/` at the project root (possibly nested as `render/renders/`). The scripts find the folder automatically: it's the directory that contains `maxone/` and `padel-court/`.
- **Never modify, move, rename, re-save or delete anything in `render/`.** Everything the site uses is generated from it into `public/media/` and `.cache/`.
- **Never upscale.** Every image is served from responsive variants no wider than its source. That's why the originals are used: the zip the owner sent earlier was only for review.
- **Never show baked-in text** from the padel images ("AKSONOMETRI", "LANTAI 1/2", "BANGUNAN"). Use only the cleaned cut-outs (`padel-clean/*`).

## 2. Low-resolution files: keep them small on screen
`optimize-images.mjs` flags any source narrower than 1200 px as `lowRes: true` in the manifest:

| Id | Source size | Max display width |
|---|---|---|
| `facades/benhil-1` | 810 × 607 | ≤ 420 CSS px (crisp on 2× screens) or ≤ 600 CSS px if needed |
| `facades/benhil-2` | 810 × 537 | same |
| `facades/facade-2` | 1123 × 632 | ≤ 600 CSS px; never full-bleed |

Enforce this in the gallery layout. Add a dev warning when a `lowRes` image renders wider than 600 CSS px.

## 3. Pipeline
Run in this order during M1, and re-run whenever renders change:
```bash
npm run assets:padel      # 3.1  → .cache/padel-clean/padel-1..3.png (transparent, captions removed)
npm run assets:images     # 3.2  → public/media/** + src/content/media-manifest.json  (~4 min)
.venv-depth/bin/python scripts/depth-maps.py    # 3.3 → public/media/depth/** + src/content/depth-status.json
#   Windows: .venv-depth/Scripts/python.exe scripts/depth-maps.py
```
Run the optimizer with a generous timeout (≥ 10 min). It processes 35 images (32 renders + 3 cleaned padel images) into AVIF and WebP at widths 480/800/1200/1600/2000/2560 (capped at the source width). The output is ~35 MB in total, but each visitor only downloads the sizes they need.

**Verify M1:**
- `src/content/media-manifest.json` has 35 entries, including `padel-clean/padel-1..3` with `hasAlpha: true`.
- Open `public/media/padel-clean/padel-1-1200.webp` and the others **and look at them**: no text anywhere, a transparent background, the building intact.
- `src/content/depth-status.json` exists. If `available: true`, view two depth maps: white should be near and black far. If not available, the reason is logged.

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
const EXTRA_GROUPS = { 'padel-clean': path.join(ROOT, '.cache', 'padel-clean') }; // produced by clean-padel.mjs
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
GROUPS = {"facades", "interiors", "cafe", "office", "others", "maxone"}   # photographic renders only
EXCLUDE = {"maxone/layout"}                                              # floor plan: no depth effect
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
"Category" is the **provisional** projects filter (the owner will confirm). "Suggested caption" lists what's known from the company profiles: **don't display it**. Display the placeholder (§5) until the owner fills in captions.

| Id | Source | What it shows | Used in | Category (provisional) | Suggested caption (not displayed) |
|---|---|---|---|---|---|
| `facades/best` | 1600 × 900 | Corner building at dusk, timber and dark cladding, every window lit | Hero beat 4–5 (colour arrival), `#next` background, OG image | Villa | — |
| `facades/facade-1` | 1536 × 1024 | 5-storey kost building on a street corner, orange vertical fin, sign "Kost Kebon Bawang" | Projects (large) | Kost | Kost Kebon Bawang |
| `facades/facade-2` | 1123 × 632 ⚠ | Low-rise residence with orange panels and a gate, cyclists | Projects (small) | Guesthouse | — |
| `facades/benhil-1` | 810 × 607 ⚠ | 7-storey kost tower with an orange brick-screen column, street view | Projects (small) | Kost | Benhil (Bendungan Hilir) |
| `facades/benhil-2` | 810 × 537 ⚠ | Same tower, frontal view | Projects (small, paired with benhil-1) | Kost | Benhil |
| `interiors/interior-1` | 1920 × 1080 | Long dining space, concrete walls, "HOMY STAY" lettering, arched niches | Projects | Guesthouse | Homy Stay |
| `interiors/interior-2` | 1483 × 762 | Bedroom with sage headboard, desk by a large window | Projects | Kost | — |
| `interiors/interior-3` | 1672 × 941 | Lobby with reception counter, glass-block wall, timber stair | HomyEight intro (tall crop) + Projects | Guesthouse | — |
| `interiors/interior-4` | 1535 × 1024 | Bedroom with sage slatted headboard, TV, wardrobe | Projects | Kost | — |
| `interiors/interior-5` | 1920 × 1080 | Double-height living room, chandelier, glass wall | Projects (large) | Homestay | — |
| `interiors/interior-6` | 1920 × 1080 | Lounge and dining table under a timber ceiling | Projects | Homestay | — |
| `interiors/interior-7` | 1920 × 1080 | Bedroom with walk-in wardrobe and a garden view | Projects | Villa | — |
| `interiors/interior-8` | 1920 × 1080 | Kitchen and dining, "WELCOME HOME" and "HOMY" lettering | Projects | Kost | — |
| `maxone/1` | 1976 × 1274 | Reception with a passport-stamp mural, "maxone" display, yellow stools, red armchairs | Walkthrough stop S1 | — | Maxone Hotel, Jakarta · Lobby · 2026 |
| `maxone/2` | 1976 × 1274 | Dining hall looking toward the buffet, navy chairs | Walkthrough S2 | — | Maxone Hotel · Dining |
| `maxone/3` | 1976 × 1274 | "BAR" arch shelving, yellow drawer counter, sage cabinets | Walkthrough S3 (second) | — | Maxone Hotel · Buffet and bar |
| `maxone/4` | 1976 × 1380 | Elevation toward the street glazing with the mezzanine above | Walkthrough S6 | — | Maxone Hotel · Dining floor |
| `maxone/5` | 1976 × 1274 | Buffet and bar from the dining tables | Walkthrough S3 (first) | — | Maxone Hotel · Buffet and bar |
| `maxone/6` | 1976 × 1274 | Sage pergola frame over tables by the windows | Walkthrough S5 | — | Maxone Hotel · By the windows |
| `maxone/7` | 1976 × 1274 | Looking up into the double-height void with hanging plants | Walkthrough S4 | — | Maxone Hotel · The void |
| `maxone/layout` | 1976 × 1274 | Floor plan (top view) | 3D modelling reference, mini-map, S6 plan dissolve | — | — |
| `office/office-1` | 2008 × 1133 | Office with red beams, skylights, long desks | Beyond: Office | — | — |
| `office/office-2` | 2008 × 1133 | Office with herringbone floor, wall shelves, plants | Beyond: Office | — | — |
| `office/office-3` | 2008 × 1133 | Office lounge corner with a round table | Beyond: Office | — | — |
| `cafe/cafe` | 1920 × 1080 | Café with red tiles, "CORNER EIGHT" sign, hanging plants | Beyond: Café | — | Corner Eight café, Lippo Karawaci |
| `others/athero-1` | 2820 × 1585 | Aerial view of a mini soccer site **with baked-in labels** | Beyond: Mini soccer (last, or omit) | — | Athero Arena, Bogor · Design by HomyEight |
| `others/athero-2` | 2820 × 1585 | Container café and stands beside the pitch | Beyond: Mini soccer | — | Athero Arena · Design by HomyEight |
| `others/athero-3` | 2820 × 1585 | Arena entrance and parking, "ATHERO ARENA" sign | Beyond: Mini soccer (lead image) | — | Athero Arena · Design by HomyEight |
| `others/athero-4` | 2820 × 1585 | On the pitch, floodlights, nets | Beyond: Mini soccer | — | Athero Arena · Design by HomyEight |
| `padel-court/1..3` | originals | **Never display** (they contain captions). Sources for `padel-clean`. | — | — | — |
| `padel-clean/padel-1` | 1830 × 1119 (alpha) | Padel hall ground floor, axonometric | Padel stage 1 reveal | — | Athero padel hall · Design by HomyEight |
| `padel-clean/padel-2` | 1342 × 895 (alpha) | Upper floor and structure | Padel stage 2 reveal | — | same |
| `padel-clean/padel-3` | 1341 × 928 (alpha) | Finished hall with vaulted roof | Padel stage 3 reveal | — | same |

⚠ = low-res (§2).

## 5. Captions: placeholders now, real text later
Keep all captions in **one editable file**, `src/content/projects.js`, so the owner (or a later agent) can fill them in without touching components:
```js
// Fill in name, place, type and status for each image. While `name` is null, the UI shows the placeholder.
export const captions = {
  'facades/facade-1':   { name: null, place: null, type: null, status: null, category: 'kost' },
  'interiors/interior-5': { name: null, place: null, type: null, status: null, category: 'homestay' },
  // … one entry per displayed image, categories from §4
};
```
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
| 3D posters | Playwright captures at key progress points (`06` §1.8) | `public/media/posters/*.webp` |
| Door line drawings | Hand-built SVGs: an empty plot outline; a half-built frame | `src/assets/doors/*.svg` |
| Mural texture (Maxone) | Generated at runtime on a canvas (`06` §3.5) | — |

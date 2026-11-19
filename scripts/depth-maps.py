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

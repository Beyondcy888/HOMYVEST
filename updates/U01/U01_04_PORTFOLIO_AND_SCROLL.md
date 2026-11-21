# U01_04: Portfolio page (`/portofolio/`) and smoother, longer scroll

## 1. Page structure
```
Header (same site header; "Portfolio" current)
§0  Intro: eyebrow "Portfolio", H1 "Our full portfolio", one line, and a 4-item index (anchor links)
§1  #story     The story (the old hero 3D story, unchanged choreography)
§2  #maxone    Step inside Maxone (the walkthrough, unchanged choreography)
§3  #padel     The padel hall (the assembly, unchanged choreography)
§4  #beyond    Beyond stays: mini soccer · café · office (landscape layout, §5)
§5  Closing CTA: "Like what you see? Let's look at your land." → "Leave your number" (/?focus=phone) + WhatsApp + "← Back to home"
Footer
```
- The intro is short (≤ 70svh) and ends with a calm "Scroll to begin ↓" cue. Each index item shows a small poster thumbnail and its name. Clicking jumps to the scene's start (Lenis `scrollTo`).
- Copy in U01_06 §8. The story's beat headlines become `<h2>`. Its beat 5 CTAs change: "See what your land can do" → `/#calculator`, and "Chat on WhatsApp" stays.
- Between scenes, add a short divider (≈ 30svh) with the next scene's number and name in large type ("02 · Step inside Maxone"). It gives the eye a rest, and gives the next scene's chunk time to load while the visitor reads.

## 2. The owner's request
> "When I scroll it's too fast; this makes the web lag. Increase the scroll input so users have to scroll more to continue the animations."

So: **keep every animation exactly as designed**, but **stretch it over more scroll**, smooth the input more, and remove the causes of hitching. Progress fractions and beat ranges in `docs/06` don't change. Only the pixel length that maps to progress 0 → 1 changes.

## 3. New scroll lengths (single source of truth)
Create `src/content/scroll-config.js`, and read it in every pinned scene:
```js
// Pixel length of each pinned scene = vh × innerHeight / 100. Tune here only.
export const SCROLL = {
  story:  { desktop: 1000, mobile: 800 },   // was 500 / 420
  maxone: { desktop: 1400, mobile: 1100 },  // was 700 / 560
  padel:  { desktop: 800,  mobile: 640 },   // was 360 / ~360
  beyondPanel: { desktop: 110 },            // horizontal pin, per panel (mobile: no pin, see §5)
};
export const SMOOTH = {
  lenisLerp: 0.075,          // portfolio page (main page keeps 0.1)
  wheelMultiplier: 0.85,     // portfolio page only: each wheel notch moves less
  cameraSmoothTime: 0.28,    // was ~0.18 (maath damp)
  assemblySmoothTime: 0.2,   // was ~0.12
};
```
- "Mobile" = coarse pointer and viewport width < 768 px.
- Recompute pin lengths on resize, orientation change and font load (`ScrollTrigger.refresh()`).
- **Dwell:** in the Maxone walkthrough, keep the stop dwell ranges (progress units). With the longer scroll, each card now stays readable for more scrolling, which is intended.
- The skip links stay ("Skip intro", "Skip walkthrough", plus a new "Skip padel" link). They jump past each pin.

## 4. Smoothness work (do all of these, then measure)
1. **Shader and texture warm-up before the pin starts.** When a scene's canvas mounts (≈ 1 viewport ahead), call `gl.compile(scene, camera)` once, and upload large textures with `gl.initTexture(texture)`. Keep the poster visible until both finish. First-frame shader compiles cause most "first scroll" hitches.
2. **ScrollTrigger settings** for each pinned scene: `scrub: true`, `anticipatePin: 1`, `fastScrollEnd: true`, `invalidateOnRefresh: true`, `pinSpacing: true`. **Don't** use `scrub: <number>` together with Lenis and maath damping (that's triple smoothing, which feels laggy).
3. **One damped progress value per scene:** write the raw progress to a ref in `onUpdate`, then damp it in `useFrame` (`SMOOTH.*SmoothTime`). Everything in the scene reads the damped value. No React state updates per frame, and no allocations in `useFrame`.
4. **Render only when needed:** keep `frameloop="demand"`. Call `invalidate()` from `onUpdate`, and keep invalidating while the damped value is still settling (|raw − damped| > 0.0005).
5. **Instancing:** write only changed instance matrices each frame (`docs/06` §1.6). Check no scene creates geometries or materials during scroll.
6. **Layers off-screen:** when a scene is pinned, pause the other canvases (`frameloop="never"`) and the shared depth-parallax canvas outside the viewport.
7. **DPR safety:** on the portfolio page, cap DPR at 1.75 on desktop and 1.5 on mobile. Keep the drei `<PerformanceMonitor>` step-down.
8. **Long tasks:** split heavy builder work (Maxone geometry merge, padel pieces) across idle callbacks before the scene enters, never at pin start.

**Measure** (`docs/10` §4) on desktop and on mobile with ×4 CPU throttling. Scroll each scene with a steady wheel (120 px every 50 ms), and record before/after p95 and max frame times in `docs/REPORT_U01.md`. Targets: p95 ≤ 20 ms desktop and ≤ 34 ms mobile-throttled, with no frame over 50 ms after warm-up.

## 5. §4 Beyond stays: landscape only
The owner wants **no portrait crops** for these renders. Every image box uses a landscape ratio (16:9 for lead images, 3:2 for thumbnails) on **every** viewport, with `object-fit: cover`.

**Content:**
| Group | Images (in order) | Notes |
|---|---|---|
| Mini soccer | `others/athero-1` (lead: site overview), `others/athero-3`, `others/athero-2`, `others/athero-4` | `athero-1` is now included as the owner asked. Its built-in Indonesian labels read as a site plan. |
| Café | `cafe/cafe` | |
| Office | `office/office-1` (lead), `office/office-2`, `office/office-3` | |

**Desktop (≥ 1024 px):** a horizontal pinned strip. Each group is one panel, 80vw wide:
- a lead image 16:9 (≈ 80vw × 45vw, capped at 75svh tall)
- below it, a row of 3:2 thumbnails
- on the left edge of the panel, the group name in big type plus one sentence and a placeholder caption

Scroll length = `beyondPanel × number of panels`. Panels slide left with a slight parallax between the image and the text. Clicking any image opens the lightbox with that group's images.

**Tablet (768–1023 px):** no pin. Panels stacked vertically, each with a lead 16:9 image and a horizontally scrollable row of 3:2 thumbnails.

**Mobile (< 768 px):** no pin. Each group is a card:
- the group name and sentence
- a full-width 16:9 lead image
- a swipeable row of 3:2 thumbnails (snap, 70vw each, showing the edge of the next one)

Lightbox on tap.

Depth parallax on lead images (strength 0.8). Use copy from `docs/07` §8 for the group titles and sentences.

## 6. Main page checks after the move
- The main page loads **no** Story, Maxone or Padel code (check the network panel in Playwright: no requests for those chunks or posters until the portfolio button is hovered; prefetch on hover/focus is fine).
- The portfolio button prefetches `/portofolio/` (`<link rel="prefetch">` on hover/focus).

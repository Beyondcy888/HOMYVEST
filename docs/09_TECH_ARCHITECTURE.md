# 09 — Tech architecture

## 1. Stack (no other runtime languages)
| Layer | Choice | Why |
|---|---|---|
| Build | Vite | Fast, static output |
| UI | React 19, JSX | The owner's usual stack |
| Calculator engine | TypeScript (`src/lib/calc/*.ts`) | Type safety protects the locked formulas |
| Motion | GSAP 3 (ScrollTrigger, SplitText) + `@gsap/react` (`useGSAP`) | The owner's usual stack; free plugins |
| Smooth scroll | Lenis | Smooth wheel scrolling that stays in sync with ScrollTrigger |
| 3D | three.js + React Three Fiber 9 + drei 10 + postprocessing | Declarative scenes, `<View>`, controls |
| State | zustand (calculator, UI prefs) | Tiny; already a drei dependency |
| Tests | Vitest (unit), Playwright (e2e, screenshots, traces) | |
| Build-time only | Node scripts (sharp); Python (depth maps) | Never shipped to visitors |

## 2. Folder structure
```
src/
  main.jsx  App.jsx
  styles/          tokens.css  base.css  typography.css  utilities.css
  i18n/            en.js  id.js  I18nProvider.jsx  useT.js  formatters (re-export from calc)
  lib/
    calc/          calc.ts  whatsapp.ts  geometry.ts  store.ts  *.test.ts
    scroll/        lenis.js  useScrollProgress.js  triggers.js (registry for QA)
    device/        tier.js  useReducedMotion.js  webgl.js
    storage.js     safe localStorage/sessionStorage helpers (try/catch)
  content/         media-manifest.json  depth-status.json  projects.js  padel-alignment.json
  components/
    layout/        Header.jsx  MobileMenu.jsx  Footer.jsx  FloatingWhatsApp.jsx  SkipLink.jsx
    brand/         Wordmark.jsx  Intro.jsx
    media/         Img.jsx  DepthImage.jsx  Lightbox.jsx
    ui/            Button.jsx  Field.jsx  MoneyField.jsx  Tabs.jsx  Accordion.jsx  Stat.jsx  Caption.jsx
  sections/
    Story/         Story.jsx  StoryOverlay.jsx  (3D in three/hero)
    About/  Team/  HomyEight/ (Walkthrough.jsx, MiniMap.jsx, StopCard.jsx)
    Behomy/ (HybridDiagram.jsx)  Projects/  Beyond/ (PadelSection.jsx, WaysStrip.jsx)
    Calculator/    Calculator.jsx  Step1.jsx  Step2.jsx  Step3.jsx  LandChip.jsx  SplitBar.jsx  Gauge.jsx  ResultsCta.jsx  Fallback2D.jsx
    Next/  Faq/
  three/
    shared/        ClayMaterials.js  Lights.jsx  Ground.jsx  Environment.jsx  PostFX.jsx  SceneCanvas.jsx  rng.js
    assembly/      pieces.js  AssemblyMesh.jsx  progress.js
    kits/          stay.js  office.js  cafe.js  sports.js  padel.js  calcModels.js
    hero/          HeroScene.jsx  camera.js  people.js
    maxone/        MaxoneScene.jsx  plan.js (§3.3 data)  furniture.js  textures.js  route.js
    padel/         PadelScene.jsx  alignment.js
    calc/          CalcScene.jsx  Zones.jsx  Labels.jsx
    depth/         DepthViews.jsx  depthMaterial.js
public/
  media/  favicon.svg  og.jpg  robots.txt  sitemap.xml
scripts/  reference/  qa/  docs/  render/ (originals)
```

## 3. Internationalisation
- `I18nProvider` holds `lang` (`'en'` default). It's persisted in `localStorage` under `homyvest:lang` (try/catch) and also accepts `?lang=id` in the URL (useful for sharing and QA).
- `useT()` returns `t(key, vars)`. Missing keys log a dev warning and fall back to English.
- When the language changes: set `document.documentElement.lang`, update `<title>` and the meta description, and re-run SplitText on visible headings (revert the old split first).
- All numbers go through the calc formatters with the active `lang`. Never call `toLocaleString` directly in components.
- The language toggle keeps the scroll position, and the layout must not jump. Reserve heading heights where the two languages differ a lot, or animate the height change.

## 4. Code splitting and loading
- The initial bundle contains the shell, all static sections, the copy, and the calc engine. **No three.js.**
- Each 3D scene is `React.lazy(() => import('../three/<scene>/<Scene>.jsx'))`, wrapped in `<Suspense fallback={<Poster/>}>`, and mounted by an `InView` wrapper (`06` §1.2).
- Prefetch the hero scene chunk right after first paint (`import()` in `requestIdleCallback`), because the hero is above the fold. Prefetch other scene chunks when their section is within 2 viewports.
- Fonts: import only the `wdth` and `wdth-italic` CSS from `@fontsource-variable/archivo`. Preload the Latin normal file with `<link rel="preload" as="font" type="font/woff2" crossorigin>` (find its hashed URL via Vite's `?url` import).

## 5. Scroll wiring (smooth and in sync)
```js
// src/lib/scroll/lenis.js
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function startLenis({ reducedMotion }) {
  if (reducedMotion) return null;                       // native scroll
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
```
- Anchor links and "skip" links use `lenis.scrollTo(target, { offset: -headerHeight, duration: 1.2 })`. With reduced motion, use native `scrollIntoView`.
- Pause Lenis (`lenis.stop()`) while the mobile menu, the lightbox or a calculator input with an open keyboard is active. Resume afterwards.
- Pinned sections: create their ScrollTriggers inside `useGSAP` with a scope, so they're cleaned up on unmount. Call `ScrollTrigger.refresh()` after fonts load (`document.fonts.ready`), after the language changes, and after lazy sections mount.
- **QA registry:** in dev and test builds, expose `window.__homyvest = { lenis, triggers: { story, homyeight, beyond } }`, where each trigger has its `start` and `end` in px (`06` §7).

## 6. Device, motion and WebGL detection
- `useReducedMotion()` follows `matchMedia('(prefers-reduced-motion: reduce)')` and updates live.
- `webgl.js` tries to create a WebGL2 context once, caches the result, and exposes `hasWebGL`. Respect `?nowebgl=1` for QA.
- `tier.js` implements `06` §1.4 and respects `?tier=`.

## 7. Performance budgets
| Metric | Budget (mid-range phone, 4G profile, production build) |
|---|---|
| LCP | ≤ 2.5 s (the hero headline or poster is the LCP element) |
| CLS | ≤ 0.05 (reserve space for every image and canvas) |
| INP | ≤ 200 ms (calculator typing must stay instant: debounce 3D, never the numbers) |
| Initial JS (gzip) | ≤ 180 KB, excluding lazy 3D chunks |
| Each 3D chunk (gzip) | ≤ 350 KB |
| Initial images | hero poster + LQIPs only; everything else lazy |
| Fonts | 2 woff2 files on first load (normal Latin, italic Latin only if used above the fold) |
Plus the 3D frame budgets in `06` §1.7. Measure as described in `10` §4 and report the numbers.

## 8. HTML head, SEO and sharing
- `<html lang>` follows the language. Set the theme attribute before paint with an inline script that reads `localStorage` (try/catch) and `prefers-color-scheme`.
- Title and description from `07` §16, updated on language change.
- `<link rel="canonical" href="https://homyvest.example/">` (placeholder domain; flagged in REPORT.md).
- Open Graph and Twitter: `og:title`, `og:description`, `og:image` = `/og.jpg` (1200 × 630), `og:type` = website, `og:locale` = `en_US` with alternate `id_ID`.
- JSON-LD `Organization`: name HOMYVEST, the placeholder URL, `contactPoint` telephone `+62-821-1010-6088` with contactType "customer service" and availableLanguage ["en", "id"].
- `robots.txt` (allow all, sitemap link) and `sitemap.xml` (one URL).
- `<meta name="theme-color">` for both themes.
- One `<h1>` (the hero's first headline). Sections use `<section aria-labelledby>` with `<h2>`.
- Content rendered by 3D must also exist as real text in the DOM (headlines, captions, stats).

## 9. Accessibility implementation notes
- Skip link to `#about` (text "Skip to content").
- Header nav is a `<nav aria-label>`. The mobile menu is a dialog with a focus trap that returns focus on close.
- Pinned scenes: on keyboard focus, show their "Skip" links. Tab order never gets trapped inside a canvas.
- Calculator: native inputs, `aria-describedby` for help text, `aria-live="polite"` results (debounced), step tabs follow the WAI-ARIA tabs pattern, idea cards are a radio group.
- Lightbox: dialog, arrow keys, Esc, focus returns to the thumbnail.
- FAQ: buttons with `aria-expanded` and `aria-controls`.

## 10. Error handling
- Error boundaries around every 3D scene (→ poster sequence) and around the calculator's 3D (→ the SVG fallback). The calculator's numbers must never depend on the 3D.
- `fetch` isn't used at runtime. All content is bundled or static.
- Guard all storage access (`src/lib/storage.js`).

## 11. Deployment readiness
- `npm run build` → static `dist/`. No server code.
- Add `vercel.json` and `netlify.toml` with long-cache headers for `/media/*`, `/assets/*` and fonts (`Cache-Control: public, max-age=31536000, immutable`) and no-cache for `index.html`. Don't deploy: no account or domain is available. REPORT.md explains the one-command deploy for each host.
- The domain is a placeholder until the owner provides it. Search the codebase for `homyvest.example` to replace it.

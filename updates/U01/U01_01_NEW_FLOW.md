# U01_01: New flow (main page) and routing

Goal: a **shorter, faster main page** that gets a visitor to leave their number within seconds, then explains who we are, how it works and who runs it, and proves it with real places. The heavy showpieces move to `/portofolio/`. **Nothing is lost** except the two sections the owner asked to delete.

## 1. Where every old section goes
| Old section (docs/04) | New home |
|---|---|
| `#story` 3D hero story | `/portofolio/` §1 (U01_04) |
| `#about` "What is HOMYVEST" + **two doors** | Short "What is HOMYVEST?" stays on `/`. **Doors deleted** (owner screenshot "delete2"), including the "Here's who does the work." line. |
| `#team` "Three names, one team" | Merged into the new End-to-end section (`#how`), with rewritten copy |
| `#homyeight` intro ("Built by HomyEight / Drawn with care…", stats, lobby image) | **Deleted** (owner screenshot "delete1") |
| `#homyeight` Maxone walkthrough "Step inside" | `/portofolio/` §2 |
| `#behomy` | Stays, now opened by a new **Behomy hero**, with Behomy portfolio and before/after added |
| `#projects` | Stays, **filters removed**, everything reveals on scroll |
| `#beyond` padel assembly | `/portofolio/` §3 |
| `#beyond` mini soccer / café / office strip | `/portofolio/` §4, in landscape, with `athero-1` added |
| `#calculator` | Stays (logic unchanged) |
| `#next` | Stays, ending in "Ready when you are" with the big portfolio button |
| `#faq` | Stays (updated, U01_06 §9) |

Delete the components, styles, copy keys and tests of the removed sections. Don't leave them hidden.

## 2. Main page order and section specs (`/`)

### 2.1 `#top`: Hero + lead funnel
**Purpose:** within 5 seconds, a visitor knows what we do and who's behind it, and can leave a number.

**Desktop layout (≥ 1024 px):** two columns at full viewport height (minus the header).
- **Left, ~5/12:**
  1. Partner line (small): "In partnership with" + HomyEight compact logo + Behomy logo, each about 22 px tall, separated by a hairline. Use the colour logos on light theme and the on-dark variants on dark theme (U01_07 §2).
  2. **H1** with two lines (copy in U01_06 §1): line 1 large (`--t-display`, weight 800); line 2 smaller (`--t-h2`, weight 500, `--ink-2`). Line 2 contains **"operated by Behomy"**.
  3. One supporting sentence.
  4. **Phone card**: label, a large input with a fixed `+62` prefix, a "Continue" primary button on the same row (stacked on narrow widths), privacy microcopy, inline error.
  5. **Free consultation line**: "Free consultation with the HomyEight team", then the WhatsApp glyph and `+62 821-1010-6088` as a link (generic message, `docs/07` §12).
- **Right, ~7/12:** the photo `facades/best` (dusk, all lights on), full height, with depth parallax (`docs/06` §6), square corners. A small chip in the lower-left of the photo: "82% average occupancy across Behomy properties¹".
- **Mobile:** the photo on top (38svh, `object-position` centred on the building), then the content. Details in U01_05.
- After "Continue" with a valid number, the **funnel panel** opens (U01_02). The hero stays as it is underneath.

### 2.2 `#about`: What is HOMYVEST?
A compact section: the heading "What is HOMYVEST?" plus one short paragraph and one small line (U01_06 §3). Desktop: heading left (4/12), paragraph right (6/12). No image. Generous whitespace above and below. It's a breather after the hero.

### 2.3 `#how`: End-to-end (Plan · Design · Build · Operate)
- Eyebrow + title + one sub line (U01_06 §4).
- **Four steps**, each with a landscape photo (4:3), number, name, one sentence, and a small italic "by …" tag:

| Step | Photo id | By |
|---|---|---|
| 01 Plan | `maxone/layout` (floor plan; crop toward the dining area with `object-position: 45% 50%`, slight grey tint so it reads as a drawing) | HOMYVEST, with Behomy's feasibility data |
| 02 Design | `photos/step-design` (HomyEight 3D design of a kost) | HomyEight |
| 03 Build | `photos/step-build` (construction with scaffolding, B&W) | HomyEight |
| 04 Operate | `photos/step-operate` (guest checking in at a Behomy reception) | Behomy |

- **Desktop:** 4 columns in a row. A hairline connects the numbers and draws left to right as the section enters (scrubbed). Photos reveal with a clip from bottom to top, staggered 0.08 s.
- **Mobile:** a vertical list (photo 16:10 full width, then text). A vertical hairline connects the numbers.
- Closing line under the steps (the merged "team" idea, U01_06 §4), set large (`--t-h2`).

### 2.4 `#behomy`: Behomy hero + Behomy section
**a) Behomy hero (new):** full-bleed `photos/behomy-hero` (a Behomy room with the beHomy pillow; 3096 px source), min-height 88svh, `object-position: 60% 50%`. A dark gradient scrim from the bottom-left keeps text legible. Bottom-left content block: the **Behomy on-dark logo** (40 px tall), then eyebrow, headline, body (U01_06 §5), and a small "See how it works ↓" link that scrolls to the hybrid diagram. Depth parallax at strength 1.0. On dark theme, the scrim gets a little stronger.

**b) Existing Behomy content**, kept and tidied:
1. Title + paragraph (existing copy, `docs/07` §6).
2. **The hybrid diagram with its scroll animation** (the building whose rooms switch daily/monthly as months scrub). Keep it exactly.
3. **Stats band, now 5 items:** 82% occupancy · 65.4% GOP margin · **< 3.5 yrs estimated break-even (new)** · 3,000+ rooms · 100+ locations in 18 areas, each with a footnote (U01_06 §5). Desktop: 5 columns (or 3 + 2 if it reads better). Mobile: 2-column grid with the 5th item full width.
4. "What Behomy takes off your hands" (existing four blocks). Add `photos/staff-training` as a wide image beside or under them.
5. **Behomy portfolio (new):** "Places Behomy runs today". An editorial mosaic of `behomy-room-1`, `behomy-life`, `behomy-room-2`, `corvel-room`, `corvel-lobby`, `purnava-pool`, `hoteru-room`, `hoteru-stair`, `behomy-corridor`, `behomy-facade-1`, `behomy-facade-2`, with brand captions (U01_07 §3). Mix one or two large images with smaller ones. Portrait facades go into tall cells next to two stacked landscapes, never stretched. Lightbox on click (reuse the Projects viewer). Depth parallax on images ≥ 360 px wide.
6. **Before / after (new):** "From idle to running". Four pairs (`before-after-1..4`), each a card showing Before (greyscale already) and After side by side, with small "Before" and "After" labels and a placeholder caption. Desktop: a 2 × 2 grid. Mobile: a horizontal snap carousel, one pair per view, with the two images stacked. These sources are small (≈ 470–960 px), so cap each image at ≈ 420 CSS px wide.
7. Brands line (existing), then the `behomy-team` photo full-bleed at the end of the section (a human close), with the caption "The Behomy team".

### 2.5 `#projects`: Projects (no filters)
- Remove the filter tabs, the filter state and the FLIP filtering code. Keep the title and sub.
- Show **all** project images (the same set as before) in a fixed, curated editorial order. Each image reveals as it scrolls in (clip-path from bottom, plus the 1.06 → 1.0 scale), alternating large and small, left and right. Low-res images stay small (`docs/08` §2). Lightbox stays.
- Order: `facades/best`, `interiors/interior-5`, `interiors/interior-2`, `facades/facade-1`, `interiors/interior-1`, `interiors/interior-6`, `facades/benhil-1` + `benhil-2` (paired, small), `interiors/interior-7`, `interiors/interior-3`, `interiors/interior-4`, `facades/facade-2` (small), `interiors/interior-8`.

### 2.6 `#calculator`: Land check
Unchanged. Remove door-based entry logic (`docs/05` §2 "Entry points": drop Door A/B and the `entry` state; the Step 1 primary button is always "Next: see what this space could earn"). The header "Land check" link opens Step 1.

### 2.7 `#next`: What happens next → Ready when you are
- Keep the six steps.
- The closing block gets three actions:
  1. **"See our full portfolio"**, the hero of this block (spec below).
  2. WhatsApp primary button (existing).
  3. "Leave your number" secondary text button → scrolls to `#top` and focuses the phone input.
- **Portfolio button spec:** a large, clickable card spanning the content width. Desktop height ~200 px; mobile ~150 px.
  - Left: title "See our full portfolio" (`--t-h1`, weight 800) and a one-line description.
  - Right: three thumbnails in a slight fan, from the poster images of the three scenes (`posters/hero-2`, `posters/maxone-1`, `posters/padel-3`; fall back to `facades/best`, `maxone/1`, `padel-clean/padel-3`).
  - Hover/focus: thumbnails spread apart and lift (GSAP, 0.5 s `expo.out`), the arrow slides right, and the card background goes from `--paper-2` to `--ink` with text inverting to `--paper`.
  - The whole card is one `<a href="/portofolio/">` with a clear accessible name. On touch, a press state darkens it.
  - Under the card, small: "Story · Step inside Maxone · Padel hall · Beyond stays".

### 2.8 `#faq` and footer
FAQ with the updated list (U01_06 §9). Footer unchanged, plus a "Portfolio" link.

## 3. Header and navigation
- Links: **How it works** (`/#how`) · **Behomy** (`/#behomy`) · **Projects** (`/#projects`) · **Land check** (`/#calculator`) · **FAQ** (`/#faq`) · **Portfolio** (`/portofolio/`). Right side: EN|ID toggle and the WhatsApp button.
- On `/`, hash links scroll with Lenis. From `/portofolio/`, they navigate to `/` and, after load, scroll to the hash once fonts are ready and ScrollTrigger has refreshed.
- On `/portofolio/`, "Portfolio" is marked current (`aria-current="page"`), and a "← Home" link sits next to the wordmark on mobile.
- `?focus=phone` on `/` scrolls to top and focuses the phone input (used by "Leave your number" on the portfolio page).

## 4. Removed copy keys
Delete these from `src/i18n/*`: `about.doors*`, `about.bridge`, `team.*`, `homyeight.eyebrow|title|body|stat1-3`, `projects.filters`, and `calculator.doorBNote`. **Keep** the `homyeight.walk.*` keys (they move with the walkthrough).

## 5. SEO
- `/` keeps its title and description (`docs/07` §16). One `<h1>`: the hero tagline.
- `/portofolio/`: its own `<title>`, description and canonical (U01_06 §8). One `<h1>`: "Our full portfolio". The story headings become `<h2>`.
- Add `/portofolio/` to `sitemap.xml`.

## 6. Routing: two static pages (multi-page Vite)
Static hosting works best with two real HTML files, so no SPA rewrites are needed:
```
index.html                 → src/main.jsx            (main page)
portofolio/index.html      → src/portfolio-main.jsx  (portfolio page)
```
- Both entries render a shared `<SiteShell>` (i18n, theme, Lenis + ScrollTrigger, header, footer, floating WhatsApp) around their page component.
- `vite.config.ts`: add both inputs. Use `build.rollupOptions.input`, or `build.rolldownOptions.input` if the installed Vite warns that `rollupOptions` is deprecated. Verify `dist/portofolio/index.html` exists after `npm run build`.
```ts
import { resolve } from 'node:path';
// inside defineConfig:
build: { /* …existing… */ rollupOptions: { input: { main: resolve(__dirname, 'index.html'), portofolio: resolve(__dirname, 'portofolio/index.html') } } },
```
- Always link to `/portofolio/` (with the trailing slash).
- Redirects in `vercel.json` and `netlify.toml`: `/portofolio` → `/portofolio/` (301), and `/portfolio`, `/portfolio/` → `/portofolio/` (301, for the English spelling).
- Each page lazy-loads only its own 3D. The main page must not ship the Story, Maxone or Padel chunks.

# 03 — Brand and design

## 1. Your design freedom, and its edges
You own the visual design: layout, composition, spacing, components, interactions, motion and the look of the 3D. Aim for something that feels like a quiet, expensive architecture studio rather than a property listing site.

The edges of that freedom:
- Black-and-white palette (§3). Colour comes from the renders and photos, and from the partner logos (§3.1).
- Archivo for everything (§2), including the wordmark (§4).
- The SliderCentral reference (§5) sets the mood of the 3D storytelling.
- Section order, purpose and copy come from `04` and `07`.
- Truthfulness rules from `02` §6 and `05`.

## 2. Typography: Archivo only
Load it self-hosted from the npm package, including the width axis and italics:
```js
import '@fontsource-variable/archivo/wdth.css';          // weight 100–900, width 62–125%
import '@fontsource-variable/archivo/wdth-italic.css';
```
```css
--font: 'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
```
Control weight with `font-weight`, and width with `font-stretch` (62%–125%) or `font-variation-settings: 'wdth' N`. Use `font-variant-numeric: tabular-nums` for every number that changes (calculator, counters, stats).

### Type scale (fluid)
| Token | Size | Weight | Width | Tracking | Line height | Use |
|---|---|---|---|---|---|---|
| `--t-display` | `clamp(3rem, 8.5vw, 9.5rem)` | 800 | 100–112% | −0.035em | 0.92 | Hero beats, section openers |
| `--t-h1` | `clamp(2.25rem, 5vw, 5rem)` | 700 | 100% | −0.03em | 1.0 | Section titles |
| `--t-h2` | `clamp(1.6rem, 3vw, 2.75rem)` | 650 | 100% | −0.02em | 1.08 | Sub-sections |
| `--t-h3` | `clamp(1.15rem, 1.6vw, 1.4rem)` | 600 | 100% | −0.01em | 1.2 | Cards, steps |
| `--t-body` | `clamp(1rem, 1.05vw, 1.125rem)` | 400 | 100% | 0 | 1.55 | Paragraphs |
| `--t-small` | `0.875rem` | 400 | 100% | 0 | 1.45 | Help text, notes |
| `--t-eyebrow` | `0.75rem` | 600 | 112% | 0.12em, uppercase | 1.2 | Labels above titles |
| `--t-stat` | `clamp(3rem, 7vw, 7.5rem)` | 800 | 90% | −0.04em | 0.9 | Big numbers (82%, 50+) |

Indonesian runs about 20–30% longer than English. Test every heading in ID at 375 px. Use `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs.

**Main-page hero headline** (the page's `<h1>`, two lines): line 1 at `clamp(2.4rem, 4.9vw, 6rem)`, display weight 800, sized for the hero's five-column text measure (the full `--t-display` broke it into five or more lines and pushed the phone field below the fold, DECISIONS U01-D6). Line 2 at `--t-h2`, weight 500, `--ink-2`. Tablets (768–1023 px) set line 1 at `clamp(2.4rem, 6vw, 3.6rem)`, phones at `clamp(2.4rem, 11vw, 3.4rem)`.

**Phones (< 768 px):** `--t-display` is capped at `clamp(2.4rem, 11vw, 3.4rem)` and `--t-h1` at `clamp(1.9rem, 8vw, 2.6rem)`; body 16 px, captions 13 px. Use `overflow-wrap: anywhere` only for long tokens such as phone numbers and URLs.

### Caption style: the three voices
Every project caption uses three typographic voices. They're placeholders for now (`08` §5), so make them look deliberate:
- **Project name**: weight 700, normal width
- City, Province: weight 400
- *Type · Status*: weight 400, italic, muted colour

## 3. Colour
Black and white with warm neutrals. **No brand colour, no gradients, no tinted UI.** The renders and photos supply the colour, so every image should feel like a window opening onto a colourful room.

Colour is allowed in exactly these places:
1. **Renders and photos** (the property renders, the company-profile photos).
2. **Partner logos** (HomyEight, Behomy), in their own colours, never recoloured (§3.1). This is the second exception, added in update U01.
3. **The calculator's `--zone-green`**, the one functional colour (below).

```css
:root, [data-theme='light'] {
  --paper: #FAFAF7;     /* page */
  --paper-2: #F2F1EC;   /* raised surfaces, cards */
  --ink: #0B0B0A;       /* text, primary buttons */
  --ink-2: #3B3A37;     /* secondary text */
  --muted: #74726C;     /* captions, help text (≥ 4.5:1 on --paper) */
  --line: #DCDAD3;      /* hairlines */
  --focus: #0B0B0A;
  --clay: #EEECE6;      /* 3D clay material */
  --clay-shadow: #CFCAC0;
  --zone-green: #8C9C7A; /* the ONLY functional colour, see below */
}
[data-theme='dark'] {
  --paper: #0C0C0B; --paper-2: #161614; --ink: #F3F2EE; --ink-2: #C8C6BF;
  --muted: #8E8C86; --line: #2B2A27; --focus: #F3F2EE;
  --clay: #E6E3DC; --clay-shadow: #6E6A62; --zone-green: #7E8E6C;
}
```
- Theme follows `prefers-color-scheme` on first visit. A small toggle in the footer overrides it and is remembered (`localStorage`, try/catch). Set `data-theme` on `<html>` before first paint (inline script in `index.html`) to avoid a flash.
- **One functional exception:** the calculator's "must stay green" zone (KDH) uses `--zone-green` in the split bar, legends and 3D, because "green area" must read as green instantly. Nowhere else.
- Warnings and over-limit states use ink with an icon and a diagonal hatch pattern, never red. Form errors follow the same rule (§8).
- In dark mode the 3D clay stays light. White models on near-black look striking.

### 3.1 Partner logos
Files: originals in `assets-src/logos/` (read only, `08` §1), copies and display versions in `src/assets/logos/` (`08` §8). The component is `src/components/brand/PartnerLogo.jsx`.

| Place | Light theme | Dark theme / over photos | Height on screen |
|---|---|---|---|
| Hero partner line ("In partnership with") | `homyeight-compact`, `behomy` | `*-on-dark` versions | 22 px desktop, 18 px phones |
| Funnel panel header ("Powered by") | `homyeight-compact` | `homyeight-compact-on-dark` | 17 px |
| Behomy hero (over the photo) | `behomy-on-dark` | `behomy-on-dark` | 40 px desktop, 32 px phones |
| Footer ("Powered by HomyEight · Operated by Behomy") | `homyeight-compact`, `behomy` | `*-on-dark` | 20 px |
| Anywhere ≥ 48 px tall | the full `homyeight` (with its tagline) may be used | `homyeight-on-dark` | — (not used on the site today) |

- **Optical size:** when the two logos sit side by side (hero partner line, footer), Behomy's is drawn **1.35× taller** than the stated height, because its compact pillow mark reads about half the size of HomyEight's wide wordmark at the same height. The on-dark Behomy file is also drawn **4.5% taller** everywhere, because it carries a transparent margin the light file doesn't. The artwork itself is never altered (DECISIONS U01-D7; `paired` and `boost` in `PartnerLogo.jsx`).
- **Rules:** never recolour, outline, stretch, rotate or add effects. Keep clear space at least the height of the "H" in HomyEight's mark on every side. `alt` text: "HomyEight" / "Behomy".
- **Theme switching:** the variant follows the site theme (`data-theme`, set before first paint), so there is no flash. Over photos the on-dark variant is used in both themes.

## 4. The wordmark

### Form
`HOMYVEST` set in Archivo, **weight 900, width 125%**, uppercase, tracking −0.02em. No icon or monogram. It's the logo everywhere: header, intro, footer, favicon (a bold `H` on a black square), OG image.

### Hover animation: HOMYVEST → HOMY INVESTASI
The letters of HOMYVEST never move out of order. New letters **slide in around them**:
```
HOMY      VEST            (rest)
HOMY · IN VEST ASI        (hover)  → reads "HOMY INVESTASI"
```
Markup:
```html
<a class="wordmark" href="#top" aria-label="HOMYVEST — Homy Investasi, home">
  <span aria-hidden="true">HOMY<span class="wm-gap"></span><span class="wm-ins wm-in">IN</span>VEST<span class="wm-ins wm-asi">ASI</span></span>
</a>
```
Behaviour:
- At rest: `.wm-gap` and both `.wm-ins` have width 0, overflow hidden.
- On `mouseenter` / `focus-visible`: GSAP measures each insert's natural width (from a hidden clone) and tweens the widths open (`0.6s`, `expo.out`). Inside each insert, the letters rise from 40% below with opacity 0→1, staggered 0.03s. The gap opens to ~0.28em.
- At the same time, tween the whole word's width axis from 125% → 104%, so the expansion feels like the word *breathing* rather than just getting longer. Reverse on leave (`0.45s`, `power3.inOut`).
- Never let the header layout jump: reserve the expanded width, or position the wordmark so its growth doesn't push other elements.
- **Touch devices** (no hover): play the expansion once when the intro finishes, hold 1.2 s, then collapse. Also play it once when the footer wordmark scrolls into view.
- **Reduced motion:** no animation. The accessible name always includes "Homy Investasi".

### Intro (logo → hero)
On a first visit to the main page (`/`), the page opens on the wordmark, centred and huge, over `--paper`:
1. 0–0.6 s: wordmark fades and tightens in (letter-spacing from 0.1em to −0.02em).
2. 0.6–1.4 s: it expands to HOMY INVESTASI, then collapses.
3. 1.4–2.2 s: the wordmark shrinks and flies into the header position (FLIP), while the hero (photo, headline and phone field) appears beneath it.
- Never block content: the hero renders behind the intro, and the intro must not delay LCP. Clicking, scrolling or pressing any key skips it.
- Play it once per session (`sessionStorage`). Skip it entirely on reduced motion.
- **Never on `/portofolio/`, and never on a deep link** (`/#calculator`, `/?focus=phone`): a visitor who followed such a link came for something specific (DECISIONS U01-D3).

## 5. Visual reference: SliderCentral (the owner's favourite)
The reference video shows a **white "clay" architectural model** on a pure white ground with soft contact shadows, seen from a high three-quarter camera with almost no perspective distortion. **Wall fragments drift in from scattered positions and assemble** into a floor plan with the top cut away, so the rooms are visible. It holds, then the camera **swipes sideways** to a new plot where different pieces assemble into a different building. A **single yellow accent** (the stair) is the only colour in the frame.

What to take from it:
- **Material:** matte clay (`--clay`), very soft shadows, gentle ambient occlusion, no outlines or only faint ones, no textures.
- **Choreography:** calm, continuous drift-in. Nothing bounces. Pieces settle with an exponential ease-out.
- **Camera:** high three-quarter view, long lens (narrow FOV, ~20–24°), slow dolly. Sideways swipes between "slides".
- **One accent:** in our B&W world, the "accent" is the moment colour arrives. White clay is the land being planned and built. **Full-colour render = the property alive and earning.** Use this idea consistently: hero, padel, Maxone, calculator.
- **Top cut away:** buildings show their top floor without a roof, so you see the rooms. That says "this is a plan you can understand".

What not to copy: their exact buildings, framing or timing. Adapt everything to HOMYVEST's story.

## 6. Layout
- 12-column grid, max content width 1440 px, outer margins `clamp(20px, 5vw, 80px)`.
- Generous vertical rhythm: sections breathe (`clamp(96px, 14vh, 200px)` between them).
- Asymmetric, editorial compositions. Big type against big images. Avoid rows of identical cards wherever a more considered layout works.
- Images: full-bleed or large, square corners (0–2 px radius), never inside rounded "cards with shadows".
- Hairline rules (`1px var(--line)`) instead of boxes.

## 7. Motion principles
- **Ease:** reveals `expo.out` (0.8–1.2 s); camera and scrubbing `power2.inOut` or linear scrubbed by scroll; never bouncy or elastic.
- **Scroll:** Lenis smooth scrolling (`09` §5) and GSAP ScrollTrigger for pinned scenes. Scrubbed animations must be reversible: scrolling back plays them backwards.
- **Text reveals:** headings rise line by line (SplitText, lines masked). Body text simply fades up. Don't split body text into words or characters.
- **Numbers:** counters roll up once when they enter view (1.2 s, `power3.out`), with tabular figures.
- **Images:** a slow scale from 1.06→1.0 as they enter, plus the depth parallax (`06` §6).
- **Restraint:** one main motion idea per viewport. If two things move, one of them should be slow.
- **Reduced motion** (`prefers-reduced-motion: reduce`): no scrubbing, no parallax, no camera moves, no counters rolling. Show final states with simple opacity fades (≤ 200 ms). Pinned 3D scenes become static sequences of images with text (`06` §1.8).

## 8. Components (look and feel)
- **Buttons:** primary = solid `--ink` with `--paper` text, square corners, generous padding, weight 600. On hover the label slides up and is replaced by a copy of itself (a 0.35 s clip). Secondary = text with an underline that draws in on hover. The WhatsApp button uses the primary style with a small, monochrome WhatsApp glyph.
- **Inputs:** large, quiet fields with hairline bottom borders, labels above, help text below in `--muted`. Units shown inside the field on the right (`m`, `%`, `×`, `Rp`).
- **Tabs and steppers:** typographic (numbers plus words), with an underline indicator that slides.
- **Stats:** huge numbers (`--t-stat`) with a one-line label and a small footnote marker. A stat that isn't a plain number (the break-even "< 3.5 yrs") keeps its unit on the baseline.
- **Icons:** minimal monochrome line icons, only where they add meaning (arrows, external link, language, WhatsApp, warning). No icons in circles. No emoji.

### Lead funnel (`src/components/funnel/funnel.css`)
The funnel borrows only the structure of the owner's reference screenshots, never their look. It stays in the black-and-white system.
- **Phone card (hero):** a label, then one row: a field with a hairline-ink border holding a fixed `+62` prefix (outside the editable text, split off by a `--line` rule) and the input, plus the "Continue" primary button. Privacy note below in `--muted`. The field and button stack on tablets and phones (each 56 px tall on phones, button full width). After a successful send the card is replaced by a bordered confirmation line ("Thanks, we'll be in touch at …").
- **Sheet:** a dialog over the page dimmed with `rgba(11, 11, 10, .45)`.
  - Desktop: a right-side sheet **520 px** wide, full height, `--paper` with a hairline left border, sliding in (0.45 s, `expo.out`).
  - Phones (< 768 px): a **full-screen** sheet sliding up, with a **sticky footer** holding the primary button. The sheet follows the visual viewport (`visualViewport` resize), so the footer stays above the keyboard.
  - Landscape phones (height ≤ 500 px): a right sheet at **70%** width.
  - Reduced motion: no slide, a 0.2 s opacity fade.
  - Header: the static wordmark · "Powered by" + HomyEight compact logo · a 44 px close button. Under it, the step indicator: three line segments (done = `--ink`, to do = `--line`) and "Step 2 of 3".
  - Footer: the primary button ("Continue" / "Send", disabled = `--line` background with `--muted` text), "Back" as a text button from Step 3, and the "Prefer to chat? WhatsApp us" link.
- **Radio cards** (funding, needs): full-width rows at least 60 px tall with a hairline `--line` border and a custom 22 px circle (1.5 px ink ring, 10 px ink dot when chosen). Hover darkens the border to ink; the chosen card gets an ink border plus a 1 px inset ink ring. Native radio inputs underneath, focus ring on the row.
- **Chips** (`.fchip`, multi-select): at least 44 px tall, hairline border, wrapping rows on desktop and a two-column grid on phones. A chosen chip is solid `--ink` with `--paper` text and a small check. Native checkboxes underneath; each group is a `<fieldset>` with a `<legend>`. The class is `fchip` because the calculator owns `.chip` (DECISIONS U01-D11).
- **Text fields:** a 1 px `--ink-2` border, focus ring 2 px `--focus`.
- **Inline errors:** small text under the field, led by a 10 px square of the diagonal **hatch** (`repeating-linear-gradient(135deg, ink 0 2px, transparent 2px 4px)`), the same glyph as the calculator's warnings. The invalid field gets an ink border and a 1 px ink ring. **Never red.**
- **Result screens:** a 64 px check mark drawn with a stroke animation (static under reduced motion), the title, the body, and stacked actions.

### Portfolio card (`#next`, `src/sections/Next/PortfolioCard.jsx`)
One large link to `/portofolio/` spanning the content width: about 200 px tall on desktop, 150 px on phones, on `--paper-2`.
- Left: "See our full portfolio" at `--t-h1`, weight 800, and one line of description in `--ink-2`. Right: three 3:2 thumbnails overlapping in a slight fan (−7°, 0°, 7°), then a round arrow. Under the card, small: "Story · Step inside Maxone · Padel hall · Beyond stays".
- Hover and focus: the thumbnails spread apart and lift (GSAP, 0.5 s `expo.out`), the arrow slides right, and the card inverts (`--ink` background, `--paper` text, 0.35 s). On touch, the pressed card darkens the same way. Reduced motion: the colour change only.
- Phones: thumbnails shrink to 64 px wide, the arrow is hidden.
- The thumbnails are library images (`facades/best`, `maxone/1`, `padel-clean/padel-3`), not the scene posters, so the main page requests nothing from the portfolio before the visitor shows interest (DECISIONS U01-D8). Hover or focus also adds a `<link rel="prefetch" href="/portofolio/">`.

## 9. Anti-patterns (don't)
Gradient blobs, glassmorphism, neon glows, drop-shadowed rounded cards, stock "handshake" imagery, generic 3-column feature grids with icons, testimonial carousels with avatars, "Why choose us" lists, centred-everything layouts, emoji, exclamation marks, more than one accent colour, auto-playing carousels, cursor trails, scroll-jacking that fights the user. Also avoid text over busy render areas without a scrim.

## 10. Using the installed design skills
- **Before designing (M2):** read Taste Skill's `design-taste-frontend` SKILL.md and Impeccable's SKILL.md fully. Run Impeccable `shape` on the page structure from `04` before writing components.
- **During M4–M9:** after each section is built, run Impeccable `critique` on it (from Playwright screenshots, `10` §3) and fix what's real.
- **M10:** run Impeccable `audit` (accessibility, performance, responsiveness) and `polish` on the whole page. Run a final Taste review against the anti-patterns in §9.
- When a skill's advice conflicts with these docs, **these docs win**, but write the conflict and your choice in `docs/DECISIONS.md`.
- Keep the generated `PRODUCT.md` and `DESIGN.md` in sync with this file.

## 11. Accessibility
- WCAG 2.2 AA. Body text contrast ≥ 4.5:1, large text ≥ 3:1, in both themes.
- Visible focus ring (2 px `--focus`, offset 3 px) on every interactive element.
- Every 3D canvas has an accessible text alternative stating its key content (calculator: the key numbers).
- Pinned scroll sections must be skippable with a "Skip" link and fully keyboard-operable.
- Language toggle updates `<html lang>`.
- Touch targets ≥ 44 × 44 px.

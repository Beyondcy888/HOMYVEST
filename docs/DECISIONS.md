# HOMYVEST build — decisions

Each entry: date · decision · reason · how to undo.

## 2026-11-20

### D1. Project lives in the workspace root; the dev pack stays untouched
- **Decision:** the kit zip was extracted and its `CLAUDE.md`, `docs/`, `scripts/`, `reference/` and `.claude/settings.json` were placed in `d:\BEHOMY\HOMYVEST`. `HOMYVEST-DEV-PACK/` is left exactly as delivered.
- **Reason:** `00_START_HERE.md` A1 asks for this layout. The loose docs in the pack are byte-identical to the ones in the zip (hash-checked).
- **Undo:** delete the copied files; the pack still has the originals.

### D2. Render folder is `renders/`
- **Decision:** originals are read from `renders/` (contains `maxone/` and `padel-court/`). Nothing is ever written there.
- **Reason:** that is where the owner put them; the kit scripts auto-detect `renders/`.
- **Proof of no modification:** `qa/renders-originals.sha256.txt` holds SHA-256, size and timestamp of all 32 originals, taken before any work. Re-checked at M11.

### D3. `.claude/settings.json` from the kit was installed
- **Decision:** the kit's permission allowlist (npm, npx, node, git, python, basic file commands; denies `git push` and `rm -rf render`) is in `.claude/settings.json`.
- **Reason:** `00_START_HERE.md` A3 recommends it for an unattended run, and the owner asked for the whole pack to be executed.
- **Undo:** delete the `permissions` block from `.claude/settings.json`.

### D4. Unrelated folders are kept out of git
- **Decision:** `Template-Analisis-Tapak-Zoning-Site-Planning-mindelevate/` (purchased spreadsheet templates) and `HOMYVEST-DEV-PACK/` are in `.gitignore`.
- **Reason:** neither is part of the website; the template pack is third-party paid content.
- **Undo:** remove the lines from `.gitignore`.

### D5. Task list at the project root
- **Decision:** `TASKLIST.md` (root) is the at-a-glance checklist the owner asked for; `docs/PROGRESS.md` is the detailed milestone log the kit asks for.
- **Reason:** the owner asked for a task list to follow progress and to resume from.
- **Undo:** n/a.

### D6. `--muted` is one step darker than the doc token
- **Decision:** `--muted` is `#6f6d67` in the light theme (docs/03 gives `#74726C`).
- **Reason:** `#74726C` passes 4.5:1 on `--paper` but only reaches about 4.2:1 on `--paper-2`, where help text also sits. The darker value passes on both.
- **Undo:** change `--muted` in `src/styles/tokens.css`.

### D7. Pinned scenes use CSS `position: sticky`, not GSAP's `pin: true`
- **Decision:** `src/components/layout/PinnedScene.jsx` pins the stage with CSS sticky inside a tall wrapper; one ScrollTrigger (no pin) reports progress 0..1 and registers itself in `window.__homyvest.triggers`.
- **Reason:** sticky is handled by the browser compositor. There is no pin-spacer, no layout jump when a lazy section mounts above, and no jitter with native touch scrolling. docs/06 §1.5 asks for `pin: true`; the behaviour the docs want (one trigger, scrub, progress in a ref) is unchanged.
- **Undo:** replace the wrapper with a ScrollTrigger using `pin: true` and `end: '+=…'`.

### D8. Clay lighting: Neutral tone mapping, key light from the upper left and slightly behind
- **Decision:** scenes use Khronos PBR Neutral tone mapping (exposure 1), key light 2.7 from `[-0.7, 0.66, -0.28]`, hemisphere 1.7, environment 0.15.
- **Reason:** measured on a test building. With the doc's values (ACES, exposure 1.05, environment 0.6, light from the upper-left-front) the white clay rendered grey (about `#d5d5d3`) and flat: ACES compresses whites, RoomEnvironment is brighter on one side and fought the key light, and a light on the camera's side hid every shadow behind the model. The calibrated set gives lit faces about `#f0eee6`, shaded faces `#cfcdc7`, and a soft shadow falling toward the viewer, which is the white-model-on-white-ground look docs/03 §5 describes.
- **Undo:** defaults live in `src/three/shared/SceneCanvas.jsx` and `Stage.jsx`.

### D9. The 3D ground is the page itself
- **Decision:** canvases are transparent; `<Ground/>` is an invisible shadow-catcher plane. There is no paper-coloured ground plane.
- **Reason:** the ground then matches the page exactly in both themes, with no horizon to hide and no colour drift from tone mapping.
- **Undo:** add a plane with a paper-coloured basic material in `Ground`.

### D10. Impeccable's rules that conflict with the docs
- **Eyebrows:** Impeccable's craft floor bans a small label above a heading. docs/03 defines `--t-eyebrow` and docs/07 supplies eyebrow copy that carries real information ("Built by HomyEight", "Run by Behomy"). **The docs win.** The labels are kept, set as a quiet index line beside a hairline rather than as decorative kickers.
- **Display size:** Impeccable caps display type at 6rem; docs/03 sets `clamp(3rem, 8.5vw, 9.5rem)`. The docs win.
- **Hero-metric template:** Impeccable discourages "big number, small label". docs/03 §8 and docs/04 ask for exactly that in the Behomy stats band. The docs win; the figures are real and footnoted.
- **Init interview:** Impeccable's init wants a live interview. The owner was away and docs/01 §5.1 says to answer from the brief, so `PRODUCT.md` was written from docs/02 and says so at the top.

### D11. Taste Skill is used as a review lens, not as a build pipeline
- **Decision:** `design-taste-frontend` v2.5 is installed and its principles are applied (plain copy, one system, equal edges, hover micro-interactions, no fade-in on every section, real photographs lead). Its own kit (starter.html, dealt palettes and layouts, the `gate.mjs` finish gate) is not used.
- **Reason:** the kit deals its own palette, hero and section structure, bans captions under images, limits every section to one or two screens and forbids scroll-driven scenes outside tech sites. All of that contradicts docs/03, docs/04 and docs/06, and docs/03 §10 says the docs win.
- **Undo:** n/a.

### D12. The four large 3D scenes were built by parallel sub-agents
- **Decision:** after the shared foundation (clay look, assembly engine, pinned-scene and lazy-mount components, harness, `docs/SCENE_GUIDE.md`) was built and calibrated, four sub-agents built the hero story, the Maxone walkthrough, the padel assembly and the calculator's 3D, each inside its own folders. The main session built everything else and integrated and reviewed their work.
- **Reason:** the scenes are independent, each is large, and the owner asked for the best possible 3D. Separate contexts keep each scene's detail intact.
- **Undo:** n/a.

### D13. The image component is used as `<Picture>`
- **Decision:** `src/components/media/Img.jsx` exports `Picture` (and `Img` as default, as docs/08 names it). JSX uses `<Picture id=…/>`.
- **Reason:** Impeccable's design hook reads `<Img id=…/>` as a bare `<img>` tag with no `src` and reports a broken image on every use.
- **Undo:** import the default export under any name.

### D14. Long in-page jumps go behind a quick veil
- **Decision:** `scrollToTarget` glides for short distances; for jumps longer than 2.5 viewports the page fades for 160 ms, jumps, and fades back.
- **Reason:** a 1.2 s smooth scroll from the header to the calculator would race through three pinned 3D scenes, mounting and unmounting canvases on the way.
- **Undo:** remove the `far` branch in `src/lib/scroll/lenis.js`.

### D15. One three.js warning is filtered
- **Decision:** `SceneCanvas.jsx` filters the message "THREE.Clock: This module has been deprecated".
- **Reason:** React Three Fiber 9.8 creates a `THREE.Clock` internally and three 0.187 warns about it on every canvas. It is not this project's code; everything else still reaches the console.
- **Undo:** delete the `setConsoleFunction` block. Remove it when R3F updates.

### D16. Run unit tests from PowerShell or cmd, not Git Bash
- **Decision / known issue:** `npm run test` passes from PowerShell, cmd and the VS Code terminal. From Git Bash, Vitest 5 fails to load with "Cannot read properties of undefined (reading 'config')".
- **Reason:** a drive-letter/path-case difference under MSYS makes Vitest load two copies of its runner. Not a code problem.

### D17. Calculator store details
- **Decision:** besides the documented state, the store persists `edited` (which example prices the visitor has replaced, for the "Example" tag) and keeps `touched`, `entry` and `focusRule` in memory only. Restored values that differ from the examples count as "touched", so WhatsApp links carry them.
- **Reason:** docs/05 §4 and §13 describe these behaviours without fixing where the flags live.


### D18. The padel line no longer says "eight courts"
- **Decision:** `beyond.padel.stages[0]` reads "Ground floor: the courts, a café and changing rooms." (ID: "Lantai dasar: lapangan, kafe, dan ruang ganti."). docs/07 §8 has "eight courts" / "delapan lapangan".
- **Reason:** the padel renders show four glass-walled courts (three side by side and one turned; each has its net and service lines, and the figures in the render give the scale: 10 × 20 m each). docs/06 §4.3 describes "8 courts in 4 blocks of 2", which counts each court's two halves. The 3D model is built from the renders, so it has four. A page that says eight beside a model and a render that show four would be a visible false claim. docs/02 §6 says to rewrite a sentence rather than use a number that is not certain, so the number was removed, not replaced.
- **Undo:** edit the two strings in `src/i18n/en.js` and `src/i18n/id.js` (and the expected text in `qa/motion.spec.ts`). Flagged for the owner in REPORT.md.

### D19. The main session built the Maxone section shell; fallback B drifts instead of using depth parallax
- **Decision:** `src/sections/HomyEight/Walkthrough.jsx`, `MiniMap.jsx` and `StopCard.jsx` (cards, mini-map, render-led fallback B, static mode) were written by the main session on top of the sub-agent's route data (`src/three/maxone/route.js`); the sub-agent builds only the 3D room. In fallback B the full-bleed renders move with a slow Ken Burns drift and cross-fade; they do not also use the depth-parallax shader.
- **Reason:** after the first session was cut off by the usage limit, the walkthrough had to be whole without waiting for the 3D room. Seven stacked full-bleed depth views would all redraw during the scroll and compete with it; the drift alone gives the sense of travel. The cards over the 3D room do use depth parallax, paused while a card is off stage.
- **Undo:** n/a.

### D20. The 3D room is off by default until it passes its comparison
- **Decision:** `SCENE_READY` in `Walkthrough.jsx` gates the 3D room. While it is false every visitor gets fallback B and `?maxone=3d` shows the room.
- **Reason:** docs/06 §3.11 time-box: an unconvincing room must not ship as the default.
- **Undo:** set `SCENE_READY = true`.

### D21. Hero story: deviations from docs/06 §2
- **World mirrored front to back.** Plots run away from the camera and the road is on the camera's side, so the calibrated light (D8) throws shadows toward the viewer. The story and choreography are unchanged.
- **No motion blur on the sideways swipes.** docs/06 §2.4 asks for a CSS blur on the canvas during swipes. Measured: switching the filter on and off cost a 50–100 ms frame per swipe. Smoothness wins; the swipe itself is eased.
- **Neighbouring plots fade into the page** ("street fog": fragments fade with distance along the street) so one plot is in focus at a time; the view opens up for the wide shot.
- **Top floors are cut at 1.4 m** (a section cut) instead of simply having no roof, so the rooms read from the 32° camera.
- **The slide labels (stay · office · café · sports) sit in the text column**, not bottom-centre, so nothing is ever drawn over the model.
- **Piece counts:** stay 386, office 267, café 181, sports 149 (spec: about 360 / 300 / 220 / 200).
- **Text warm-up.** Hidden headlines are painted once at 0.5% opacity so their glyphs are ready (removes 50–150 ms frames). On phones this waits for the first touch, because text painted before any interaction is counted as the page's Largest Contentful Paint.
- **Undo:** `src/three/hero/*`, `src/sections/Story/*`.

### D22. Maxone walkthrough: route and room assumptions
The owner gave permission to assume what the renders and plan do not show. Everything assumed, changed or left out:
- **Heights:** ceiling 3.6 m, beams down to 3.05 m, upper floor at 4.0 m, glass rail to 5.1 m, timber grid at 7.5 m, top of the void 8.0 m, street 0.45 m below the floor (three steps).
- **The line at the south third of the hall** is built as a timber window wall with brick piers (as render 6 shows), not as a pergola beam. The tables beyond it sit in a street-side room under the sage pergola. No door is modelled into that room; the camera looks in through the windows.
- **Upper floor:** plain massing with blank walls, invented windows on the street and entrance sides, and a roof with a skylight over the void. The mezzanine glass rail is on two edges of the void only. Beam and downlight positions are invented.
- **Closed parts:** the area behind the curved buffet wall, the block west of the street-side room and the core east of it are solid closed rooms. The core's outer faces are lined in timber with globe lights, copied from its inner face in render 6.
- **Left out:** the small tiled outbuilding at the south-east corner of the plan (the walk starts there, and the steps are made full width); a second black rectangle the plan draws near the reception (render 1 shows a clear view from that spot); human figures.
- **Entrance side:** a glazed wall with white mullions; the entrance doors stand open.
- **Furniture:** the two middle rows of tables are 0.1 m further apart than the plan, so the aisle takes the camera. Square table tops are dark as in the renders, not white as the plan draws them. The buffet cabinets are simplified.
- **Floor:** light grey tiles (the plan's and the spec's values), not the dark floor of the renders.
- **Drawn fresh, inspired by the renders, not copied:** the passport-stamp mural, the mustard line drawing, the "BAR" letter tiles and the display sign. Plants are stylised low-poly.
- **Light and colour:** sun from the south-east at 38°. Navy, salmon, mint, burgundy, timber, beige, counter tile, table tops and deck were moved toward colours sampled from the renders; mustard, sage, leaf greens, ceiling greys and the exterior cladding were chosen by eye. No ambient occlusion (it conflicts with the transparent canvas); a shadowless fill light stands in.
- **Route:** the route in docs/06 §3.7 passes through the gate wall, the planter beds and a table. The built route is: street → steps → walkway → entrance → S1 just inside the doors → S2 from the east lobby looking west → north lane → S3 mid-hall, then looking back from the west lane → S4 look up → S5 in the aisle looking south through the windows → rise to the top view, north up, dissolving into the plan. Dwell windows were shifted by a few percent so no turn is abrupt. A unit test keeps the path at least 0.35 m from walls.
- **Far jumps** (a stop button, the skip link) cut the camera straight to the new place instead of sweeping it through walls.
- **Undo:** `src/three/maxone/*`. To ship the render-led version instead, set `SCENE_READY = false` in `src/sections/HomyEight/Walkthrough.jsx`.

### D23. Padel assembly
- **One orthographic camera fits all three renders.** Measured: the renders are true isometric (ground edges at 29.95–29.98°, so elevation 35.26°, azimuth 45°), not the 37.5–40° / 42–44° estimated in docs/06 §4.2.
- **Four courts**, as the renders show (see D18). Site about 41.7 × 37.9 m.
- **The roof shells are their own extruded geometry** dropped as rigid bodies, not boxes. The slab is always present. The wipe continues in one direction (in, then out the far side). One slow zoom across the whole scene rather than a reset per stage.
- **Known:** the cleaned cut-outs for stages 2 and 3 contain a few small enclosed white patches that show on the dark theme. The fix belongs in `scripts/clean-padel.mjs`, which was left as delivered.

### D24. Calculator 3D
- **Its own small morph renderer** instead of the shared assembly engine, because the model must morph while the visitor types (heights, footprints, unit counts), which the assembly engine cannot do.
- **Labels are plain DOM**, positioned from the 3D each frame, not drei's `<Html>` (which threw on unmount under React 19).
- **Wheel zoom is armed by a click or drag on the model** and released when the pointer leaves, so scrolling the page over the model still scrolls the page. On touch, a vertical swipe scrolls the page, a horizontal drag rotates, two fingers zoom and rotate.
- **Camera from the front left** so the lit side faces the viewer.

### D25. First paint and first-load size
- **The hero paints first.** On a first visit, the nine sections below the hero mount right after the intro, as a React transition. Mounting everything up front put a 1.4 s task (throttled phone) before the first paint. Reloads and return visits mount everything at once so the browser can restore the scroll position.
- **Indonesian and the gallery's FLIP plugin load on demand**, which brought the first load from 193 KB to 176 KB of JavaScript (gzipped; budget 180).
- **Every scene compiles its shaders at mount** and the depth effect decodes textures off the main thread and uploads one per frame, which removed the one-off slow frames.
- **Undo:** `src/sections/Sections.jsx` (set the initial `below` state to `true`), `src/i18n/I18nProvider.jsx`.

### D26. Impeccable's detector: seven findings left standing
- **Decision:** `impeccable detect` on the rendered page reports only "kicker above heading", seven times (the section labels). They stay.
- **Reason:** see D10; the brief defines them and supplies their text. The tool can only suppress this rule wholesale, which its own guidance reserves for the owner.
- **Undo:** remove the `<p className="t-eyebrow label-line">` lines if the owner prefers no labels.

## 2026-11-21 — Update U01 (`updates/U01/`)

Numbered U01-Dn. Where U01 and the older docs disagree, U01 wins (U01_00 §A).

### U01-D1. The owner's Supabase URL and publishable key: dev only, in `.env.development.local`
- **Decision:** the owner gave the project URL and the publishable key in the chat. They are written only to `.env.development.local` (git-ignored), which `npm run dev` reads and `vite build` does not.
- **Reason:** the publishable key is public by design (insert-only through RLS), and the owner clearly wants to try the form. Putting it in `.env.local` instead would have leaked into every `npm run build`, including the keyless e2e build that must hand over to WhatsApp, and into tests that would then write to the real database. Production builds get the two values from the hosting provider's settings (HUMAN_SETUP §D).
- **Undo:** delete `.env.development.local`, or move the two lines to `.env.local` once the database is set up.

### U01-D2. The delivery folder `update2/` is left as delivered
- **Decision:** its kit was copied into the project root without overwriting anything (`updates/U01`, `assets-src`, `supabase`, `reference/leads`, two scripts, `.env.example`, `.githooks`, the setup guide). `update2/` itself is git-ignored. So is `.claude/worktrees/`, left behind by a failed helper-agent worktree.
- **Undo:** remove the two lines from `.gitignore`.

### U01-D3. The logo intro plays on the main page only, and never on a deep link
- **Decision:** the intro opens `/` on a first visit, as before. It is skipped on `/portofolio/` and whenever the URL carries a hash or `?focus=phone`. On such a deep link every section mounts at once, and the page lands on its target after the fonts load.
- **Reason:** a visitor who follows "Leave your number" or "See what your land can do" came for something specific. A target that mounts after the intro would otherwise not exist yet.
- **Undo:** `src/components/brand/Intro.jsx` (`enabled`, `hasDeepLink`), `src/pages/Home.jsx`.

### U01-D4. One shell, two pages; per-page SEO
- **Decision:** `src/SiteShell.jsx` wraps both entries (`src/main.jsx`, `src/portfolio-main.jsx`). The i18n provider takes a `metaKey`: `meta` on `/`, `pfMeta` on `/portofolio/`. Without it, the language switch would overwrite the portfolio's title and description with the main page's.

### U01-D5. Header and skip link
- **Decision:** six links (How it works · Behomy · Projects · Land check · FAQ · Portfolio). On `/` they scroll with Lenis. On `/portofolio/` the section links are plain links to `/#…`, "Portfolio" carries `aria-current="page"`, and phones get a "← Home" link beside the wordmark. The skip link goes to `#main` on both pages, the start of the content (the hero now holds the form).

### U01-D6. The hero headline is sized for its column
- **Decision:** line 1 of the H1 uses `clamp(2.4rem, 4.9vw, 6rem)`, the display weight and width fitted to the hero's five-column measure. On phones it uses U01_05's `clamp(2.4rem, 11vw, 3.4rem)`.
- **Reason:** the full `--t-display` (up to 9.5rem) set the line in five or more lines inside a 5/12 column and pushed the phone field below the fold.

### U01-D7. Behomy's logo gets an optical size boost beside HomyEight's
- **Decision:** when the two logos sit side by side (hero partner line, footer), Behomy's is drawn 1.35× taller. The on-dark Behomy file is also drawn 4.5% taller everywhere, because it carries a transparent margin the light file doesn't.
- **Reason:** at the same height, Behomy's compact pillow mark looked about half the size of HomyEight's wide wordmark and was barely legible. The artwork is never altered.
- **Undo:** `paired` and `boost` in `src/components/brand/PartnerLogo.jsx`.

### U01-D8. The portfolio card's thumbnails are library images, not the scene posters
- **Decision:** the fan shows `facades/best`, `maxone/1` and `padel-clean/padel-3`, the fallbacks named in U01_01 §2.7.
- **Reason:** U01_04 §6 asks that `/` request no portfolio chunks or posters before the card is hovered. The card is visible long before any hover. The library images also come in 480 px variants.

### U01-D9. Behomy section structure
- **Decision:** the Behomy hero's headline is the section's `<h2>`, and the existing title "Daily guests and monthly tenants…" becomes an `<h3>` under it. The old eyebrow "Run by Behomy" is dropped because the hero says "Operated by Behomy"; its key is removed. Stats are three over two on desktop and two columns on phones with the fifth full width. Footnotes 1–4 sit under the stats band. The training photo sits under "What Behomy takes off your hands".
- **Mosaic:** four columns on desktop, two below 1024 px (capped at 820 px wide). One large image (the corridor, the only high-resolution one), two portrait facades in tall cells, the rest in single cells. Dense packing leaves no holes at either column count.

### U01-D10. Small sources are never shown wider than half their pixels
- **Decision:** the step photos are capped at 400 CSS px (step-operate is 800 px wide), small project images at 405 px (benhil is 810), the training photo at 600 px, the mosaic as in D9, and before/after at 420 px (U01_01 §2.4 sets that cap even though some sources are 470 px).

### U01-D11. Funnel implementation choices
- **The panel's code is its own chunk** (about 5 KB gzip). It loads on the first focus of the phone field or on "Continue", together with the Supabase client, which is reached only through a dynamic import.
- **Persistence** (`sessionStorage`, `homyvest:funnel:v1`) also keeps the open state and `openedAt`. A reload therefore reopens the panel where the visitor left it. A restored form sent quickly is not mistaken for a bot by `submitLead`'s 1.5 s check. Result screens are never restored, and a successful send clears everything.
- **The honeypot** (`name="company"`) is off-screen and `visibility: hidden`. Browser autofill can fill a merely off-screen "company" field from an address profile, which would silently drop a real lead as spam. Naive bots still fill it.
- **The rate-limit screen** has no separate title in U01_06; its one sentence is the heading.
- **Chips use their own class (`fchip`)**, because the calculator already owns `.chip`.
- **Focus** moves to each step's heading, retried for a few frames. Under reduced motion the site-wide 0.01 ms transitions keep the panel's contents "hidden" for one frame. The step animation uses opacity, not GSAP's `autoAlpha`, which would hide the heading through `visibility`.
- **The before/after carousel is focusable** (`tabindex="0"`), so keyboard users can scroll it on phones.

### U01-D12. Copy: removed and added keys
- **Removed besides U01_01 §4:** `calc.next.building` and `calc.next.ideasAlt` (door B only), `homyeight.bridge`, `beyond.bridge` (the portfolio closing follows instead), `behomy.eyebrow`, and `movements` (unused).
- **Added beyond U01_06** (small fit edits, both languages):
  - `pfMeta.ogAlt`
  - `behomy.ba.label`, `behomy.ba.pair` (carousel labels)
  - `pf.indexLabel`, `pf.skipStory`
  - `beyond.ways.open`
  - the Indonesian caption types (Kamar co-living, Kehidupan di Behomy, Penginapan bisnis, Lobi, Vila, Penginapan ruko, Properti Behomy, Sebelum / sesudah)
- **The break-even stat** is written "< 3.5 yrs" / "< 3,5 thn", with the unit on the baseline.

### U01-D13. Redirects
- **Vercel:** `/portofolio`, `/portfolio` and `/portfolio/` redirect (301) to `/portofolio/`.
- **Netlify:** only the `/portfolio` rule. Netlify matches rules with or without the trailing slash, so a `/portofolio` → `/portofolio/` rule would loop. Its Pretty URLs already add the slash.

### U01-D14. The hero photo is preloaded from the HTML
- **Decision:** `index.html` preloads `facades/best` as AVIF (`imagesrcset` and `imagesizes` identical to the hero's `<picture>`) with `fetchpriority="high"`, because it is the LCP element (U01_08 §4).

### U01-D15. Tests run on two builds, never against the real project
- **Decision:** `:4173` is built with the `VITE_SUPABASE_*` variables explicitly blank, so a future `.env.local` can't leak in. `:4174` is built with a fake URL and key passed through the environment. Every request to that fake URL is intercepted by `page.route`. The funnel is never scripted against `npm run dev`, which has the owner's real project (D1).

### U01-D16. Owner checks flagged by the asset review (not changed)
- **Before/after:** pairs 3 and 4 are Google Street View captures ("Google Maps" watermark and arrows on 4-before); licensing and attribution are the owner's call. Pair 4's "after" shows "Behomy Metropolim".
- **Staff-training photo:** it shows a "Corner Eight" sign.
- **Team photo:** its banner reads "Homy Group", while U01 captions it "The Behomy team".
- **Captions:** all kept as U01_07 specifies. No unconfirmed project name is displayed.
- **PDF report:** it uses the standard Helvetica font, so emoji and non-Latin characters in a name print as "?". Indonesian names are unaffected.

### U01-D17. Docs synced to the update
- **Decision:** `docs/` and `CLAUDE.md` now describe the site after U01 (U01_08 §5), checked against the code. Older entries in this file are left as written; where they mention the doors, the Team section or the story on `/`, they describe the first build.
  - `CLAUDE.md`: `updates/` added to the read-first list; the **Updates** and **Secrets** rules from U01_00 §B5, verbatim.
  - `02`: the two new facts (estimated break-even, Behomy brand captions) in §6; "The first step comes first" (the number before the explanation) in §4; contact = the lead funnel plus WhatsApp (§7); partner logos named as a colour source (§11).
  - `03`: colour exceptions listed (renders and photos, then partner logos, then the zone green); new §3.1 with the logo usage table and the optical-size rule (U01-D7); the hero headline sizes (U01-D6) and the phone type caps; the intro on `/` only and never on a deep link (U01-D3); funnel component styles (phone card, sheet, radio cards, chips, hatch-glyph errors, result screens) and the portfolio card in §8.
  - `04`: rewritten for two pages. `/` in the order `top, about, how, behomy, projects, calculator, next, faq`, with the funnel under the hero; `/portofolio/` as §10 (structure only; scene details stay in `06`). The doors, Team, the HomyEight intro and Beyond-on-main are gone, and the optional section-progress rail, never built, is no longer described. The flow checklist is now §11.
  - `05`: only §2 "Entry points" (no doors, no `entry` state; "Land check" and `/#calculator` open Step 1; Step 1's primary button is always "Next: see what this space could earn") and the matching sentence under Step 1's bridge line. Formulas, defaults, rounding and tests untouched.
  - `07`: states that `src/i18n/*.js` is the shipped source of truth; the U01 copy merged with the real key paths (hero, consultation, about, how, Behomy hero and additions, five stats, footnote 4, Projects without filters, `next.leaveNumber`, the portfolio card, nav, FAQ Q2 replaced and Q12 added, `pfMeta`), new §18 (funnel copy and option labels), §19 (portfolio page) and §20 (removed keys, U01-D12). Section numbers 1–17 are unchanged, because other docs and code comments cite them. The padel line now matches the shipped text (D18).
  - `08`: `assets-src/` as read-only originals; the half-pixel-width rule and the caps actually used (U01-D10); the optimizer's `photos` group and the depth groups and exclusions (the embedded script lines updated to match `scripts/`); a photo inventory; the two caption files and the Behomy caption table; logo display versions (§8); the slim manifest module (§9). The door drawings are gone, and the unused "Category" column is marked as such.
  - `09`: multi-page Vite and `SiteShell`; per-page loading (no Story, Maxone or Padel code on `/`; the calculator UI and the funnel panel with the Supabase client as their own chunks; 172.4 KB first load, budget 180); per-page Lenis settings; per-page SEO, one `<h1>` per page, two sitemap URLs, redirects (U01-D13); the skip link to `#main`; the funnel's dialog and error handling; new §12 (backend) and §13 (env vars, `.env.development.local` per U01-D1, the secrets inventory, the scanner and the git hook).
  - `10`: the spec list as it is now, including `portfolio.spec.ts` from the U3 work; the two web servers (U01-D15); "never script the funnel against `npm run dev`"; the screenshot routine with the portfolio page, the funnel states and the phone matrix; `check-secrets --all` in the commands and the pre-handoff checklist.
- **Not changed:** `docs/06` (the portfolio scenes are documented by the U3 work), `PROGRESS.md`, the reports, and the entries above.

### U01-D18. The portfolio page as built (U3, branch `u3-portfolio`, merged in `e38b09f`)
- **Sections:** ids `intro`, `story`, `maxone`, `padel`, `beyond`, `closing`. Each divider is its section's `<h2>` ("02 · Step inside Maxone"). The live walkthrough has no heading block of its own (the divider carries the title); the reduced-motion walk keeps its `h3`.
- **Index:** links jump to the start of the story, Maxone and padel pins, and to `#beyond`.
- **Skip links:** "Skip the story" (`pf.skipStory`), "Skip walkthrough", "Skip padel hall". Each lands exactly at the end of its pin.
- **Beyond stays:**
  - The Beyond divider shows `pf.index[3]` instead of the old eyebrow. The head keeps `beyond.title` and `beyond.body`; the bridge line is gone.
  - Desktop (≥ 1024 px, any pointer) pins horizontally. The name and sentence sit on a paper card over the lead image's left edge, drifting ±48 px against it.
  - The lead image is min(45vw, 75svh, room left above the thumbnails) × 16/9, capped at the source width.
  - Reduced motion gets the stacked layout at every width.
- **Phone Maxone:**
  - The stop name label is top-left with the skip link under it, because at 360 px the skip link overlapped the bottom-left card.
  - The mini-map is 96 px, top-right. The header hides during pins, so "under the header" means the top of the stage.
  - The seven stop buttons can't fit in 96 px. They are visually hidden but focusable, and show as a strip under the map while one has focus.
  - Tablets in portrait keep the full-width sheet.
- **Landscape phones** (height ≤ 520 px, width ≤ 1023 px): Maxone cards about 35vw; story type compact; padel text in the left third. Padel's portrait phone rule is `(max-width: 820px) and (orientation: portrait)`.
- **Story:** the photo no longer has `priority`, since it isn't the page's first image.
- **No Maxone poster in dark theme:** the posters were taken on the light page, and their sky would flash white.
- **QA hooks:** `window.__homyvest.pinned` and `.prepared`, `?prep=0`, and `?perf=1` per-canvas frame counts.
- **Frame times:** recorded in `qa/perf-u01.json` and `docs/REPORT_U01.md`.

### U01-D19. "Land check" always opens step 1
- **Decision:** the header link (and the menu link) sets the calculator to step 1 before scrolling, and so does a `/#calculator` deep link, for example the story's "See what your land can do" (U01_01 §2.6). The calculator otherwise remembers its last step.

### U01-D20. Local servers redirect like the hosts
- **Decision:** a small middleware in `vite.config.ts` (`portfolioRedirects`) sends `/portofolio`, `/portfolio` and `/portfolio/` to `/portofolio/` (301) in `npm run dev` and `vite preview`. Before, both servers fell back to the main page for the slashless path.

### U01-D21. On narrow phones the portfolio header drops its language toggle
- **Decision:** at 420 px and below, on `/portofolio/` only, the header's EN|ID toggle is hidden to make room for the "← Home" link, which overlapped it at 360 and 390 px. The toggle stays in the menu sheet and the footer.

### U01-D22. The phone wordmark is about 22 px tall, not 22 px cap height
- **Decision:** U01_05 §1 asks for "~22 px cap height". A 22 px cap height needs a ~31 px font, and the wordmark would no longer fit beside the language toggle and the menu button at 360 px. The phone wordmark stays at 18 px, about 22 px tall.

### U01-D23. First-load budget
- **Decision:** the land check's interface is its own chunk, fetched as soon as the sections below the hero mount; an empty `#calculator` placeholder holds its place. The media manifest reaches the browser through `scripts/slim-manifest.mjs`, with identical values and a smaller size.
- **Result:** the main page's first-load JavaScript went from 184.8 to 172.4 KB gzip (173.5 after the U3 merge); the budget is 180. The portfolio page is 179.3 KB.
- **Undo:** import `Calculator` statically in `src/pages/Home.jsx`; remove `slimManifest()` from `vite.config.ts`.

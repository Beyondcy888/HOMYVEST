# 09 — Tech architecture

## 1. Stack (no other runtime languages)
| Layer | Choice | Why |
|---|---|---|
| Build | Vite, two HTML entries (multi-page) | Fast, static output; two real pages need no rewrites |
| UI | React 19, JSX | The owner's usual stack |
| Calculator engine | TypeScript (`src/lib/calc/*.ts`) | Type safety protects the locked formulas |
| Lead data layer | TypeScript (`src/lib/leads/leads.ts`) + `@supabase/supabase-js`, loaded lazily | Validation, payloads and WhatsApp fallback in one tested module |
| Motion | GSAP 3 (ScrollTrigger, SplitText) + `@gsap/react` (`useGSAP`) | The owner's usual stack; free plugins |
| Smooth scroll | Lenis | Smooth wheel scrolling that stays in sync with ScrollTrigger |
| 3D | three.js + React Three Fiber 9 + drei 10 + postprocessing | Declarative scenes, `<View>`, controls |
| State | zustand (calculator, funnel, UI prefs) | Tiny; already a drei dependency |
| Backend (owner-deployed) | Supabase: Postgres tables with RLS, a trigger, `pg_cron`, and the Edge Function `generate-report` (Deno, `pdf-lib`, Google Drive) | Stores leads and files a PDF report per lead; no server of our own (§12) |
| Tests | Vitest (unit), Playwright (e2e, screenshots, traces) | |
| Build-time only | Node scripts (sharp); Python (depth maps) | Never shipped to visitors |

## 2. Folder structure
```
index.html               → src/main.jsx            the main page, /
portofolio/index.html    → src/portfolio-main.jsx  the full portfolio, /portofolio/
src/
  main.jsx  portfolio-main.jsx      each renders <SiteShell page=…> around its page
  SiteShell.jsx    i18n, theme, Lenis + ScrollTrigger, skip link, intro (main page only), header, footer, floating WhatsApp
  pages/           Home.jsx (the main page's sections, deep-link landing)  Portfolio.jsx
  styles/          tokens.css  base.css  typography.css  utilities.css
  i18n/            en.js  id.js  I18nProvider.jsx  useT.js  format.js
  lib/
    calc/          calc.ts  whatsapp.ts  geometry.ts  store.ts  *.test.ts
    leads/         leads.ts  leads.test.ts (from the U01 kit)  supabase.ts (the client)  client.js (lazy loader, helpers)
    scroll/        lenis.js  progress.js  triggers.js (registry for QA)  useDraw.js
    device/        tier.js  useReducedMotion.js  webgl.js
    ui/store.js    page.js (which page, PORTFOLIO_URL, deep links)  theme.js  storage.js (safe storage, try/catch)
  content/         media-manifest.json  depth-status.json  projects.js  behomy.js  scroll-config.js (+ .test.ts)  padel-alignment.json
  assets/logos/    partner logos: copies + display versions (08 §8)
  components/
    layout/        Header.jsx  MobileMenu.jsx  Footer.jsx  FloatingWhatsApp.jsx  LangToggle.jsx  PinnedScene.jsx
    brand/         Wordmark.jsx  Intro.jsx  PartnerLogo.jsx
    funnel/        FunnelHost.jsx  FunnelPanel.jsx  HeroPhone.jsx  StepFunding.jsx  StepBuild.jsx  StepNeeds.jsx
                   ThankYou.jsx  Handoff.jsx  Chips.jsx  RadioCards.jsx  fields.jsx  useFunnelStore.js  funnel.css
    media/         Img.jsx  DepthImage.jsx  Lightbox.jsx  SceneMount.jsx
    ui/            Button.jsx  Caption.jsx  Heading.jsx  Icons.jsx  Stat.jsx
  sections/
    main page      Hero/  About/  How/  Behomy/ (BehomyHero, HybridDiagram, BehomyPortfolio, BeforeAfter)
                   Projects/  Calculator/  Next/ (PortfolioCard)  Faq/
    /portofolio/   Story/  HomyEight/ (Walkthrough, MiniMap, StopCard)  Beyond/ (PadelSection, Beyond)
                   plus the page's intro, dividers and closing (06)
  three/           shared/  assembly/  kits/  hero/  maxone/  padel/  calc/  depth/   (the 3D, 06)
supabase/          config.toml  migrations/  functions/generate-report/  .env.secrets.example   (§12)
public/            media/  favicon.svg  og.jpg  robots.txt  sitemap.xml
scripts/           asset pipeline (08 §3), make-logos.mjs, slim-manifest.mjs, check-secrets.mjs, gdrive-auth.mjs
.githooks/         pre-commit (§13)
qa/  docs/  updates/  reference/
assets-src/  renders/      originals, read only (08 §1)
```

## 3. Internationalisation
- `I18nProvider` holds `lang` (`'en'` default). It's persisted in `localStorage` under `homyvest:lang` (try/catch) and also accepts `?lang=id` in the URL (useful for sharing and QA).
- English ships in the first bundle. The Indonesian dictionary is a separate chunk, fetched before the first render when it is the visitor's language, otherwise when the visitor switches.
- `useT()` returns `t(key, vars)`. Missing keys log a dev warning and fall back to English.
- When the language changes: set `document.documentElement.lang`, update `<title>` and the meta description, and re-run SplitText on visible headings (revert the old split first). The provider takes a `metaKey`: `meta` on `/`, `pfMeta` on `/portofolio/`, so each page keeps its own title (DECISIONS U01-D4).
- All numbers go through the calc formatters with the active `lang`. Never call `toLocaleString` directly in components.
- The language toggle keeps the scroll position, and the layout must not jump. Reserve heading heights where the two languages differ a lot, or animate the height change.

## 4. Code splitting and loading
Each page loads only its own code. **The main page ships no Story, Maxone or Padel code and requests no scene posters** before the portfolio card is hovered or focused (then it only prefetches `/portofolio/`). `qa/main-flow.spec.ts` checks this.

**Main page (`/`):**
- The first bundle holds the shell, the hero with the phone card, the sections, the English copy and the calc store. **No three.js.**
- Its own chunks, each loaded on demand:
  - **Calculator UI:** `React.lazy`, fetched as soon as the sections below the hero mount (right after the first paint). Until it arrives, an empty `#calculator` section about one screen tall holds its place. Its 3D scene is a further lazy chunk (`06` §5).
  - **Funnel panel** (about 5 KB gzip) **and the Supabase client:** fetched on the first focus of the phone field or on "Continue". `supabase.ts` is reached only through `loadSupabase()` in `client.js` (a dynamic import), so `@supabase/supabase-js` is never in the first bundle. Never import `supabase.ts` statically.
  - The Indonesian dictionary (§3) and the depth-parallax engine (`06` §6).
- On a first visit only the hero renders first; the other sections mount right after the intro, as a React transition (DECISIONS D25). Reloads, return visits and deep links mount everything at once.
- **First load: 172.4 KB of JavaScript, gzipped** (budget 180; it was 184.8 before the calculator UI and the slim manifest, `08` §9, were split out).
- The hero photo `facades/best` is the LCP element: `index.html` preloads it as AVIF with `fetchpriority="high"`, with `imagesrcset` and `imagesizes` identical to the hero's `<picture>` (DECISIONS U01-D14). Keep the two in sync if the hero's `sizes` change.

**Portfolio page (`/portofolio/`):** each 3D scene is `React.lazy(() => import('../three/<scene>/<Scene>.jsx'))`, wrapped in `<Suspense fallback={<Poster/>}>` and mounted by `SceneMount` before it enters the viewport. Prefetching, warm-up and the smoothness rules: `06`.

**Fonts:** import only the `wdth` and `wdth-italic` CSS from `@fontsource-variable/archivo`. The Latin normal file is preloaded by a small Vite plugin (`preloadFont` in `vite.config.ts`) with its hashed build URL.

**`vite.config.ts`:**
- `build.rolldownOptions.input` has the two pages (`main`, `portofolio`). `npm run build` must produce `dist/index.html` and `dist/portofolio/index.html`.
- `slimManifest` serves the media manifest as a slimmer module (`08` §9).
- `test`: Vitest runs `src/**/*.test.ts` in Node, with the alias `npm:pdf-lib@1.17.1` → `pdf-lib`, so the report function's Deno-style import resolves in tests. `tsconfig.json` has the matching `paths` entry and excludes `supabase/functions` (Deno globals).

## 5. Scroll wiring (smooth and in sync)
```js
// src/lib/scroll/lenis.js
export function startLenis({ reducedMotion, lerp = 0.1, wheelMultiplier = 1 }) {
  if (reducedMotion || lenis) return lenis;             // reduced motion keeps native scrolling
  lenis = new Lenis({ lerp, smoothWheel: true, wheelMultiplier, touchMultiplier: 1, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  tick = (time) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
```
- `SiteShell` starts it per page: the main page with the defaults (`lerp 0.1`, wheel 1), `/portofolio/` with `SMOOTH.lenisLerp` (0.075) and `SMOOTH.wheelMultiplier` (0.85) from `src/content/scroll-config.js`, so its long scenes move slowly.
- Anchor links and "skip" links use `scrollToTarget()` (Lenis `scrollTo` with the header offset; native `scrollIntoView` with reduced motion). Jumps longer than 2.5 viewports go behind a quick fade (DECISIONS D14).
- Pause Lenis (`lockScroll()` / `unlockScroll()`) while the mobile menu, the lightbox, the funnel panel or a calculator input with an open keyboard is active.
- Pinned sections (on `/portofolio/`): their ScrollTriggers are created inside `useGSAP` with a scope, so they're cleaned up on unmount. Their lengths come from `SCROLL` in `scroll-config.js` (the single source of truth, `06`). Call `ScrollTrigger.refresh()` after fonts load (`document.fonts.ready`), after the language changes, after lazy sections mount, and on orientation change.
- **Deep links** into `/` (`/#calculator`, `/?focus=phone`, any section hash from the portfolio's header): the intro is skipped, every section mounts at once, and after the fonts load the page refreshes its triggers and lands on the target (`src/pages/Home.jsx`, DECISIONS U01-D3).
- **QA registry:** `window.__homyvest = { lenis, triggers }`, where each pinned scene registers its `start` and `end` in px and a `progress()` reader (ids in `06` §7).

## 6. Device, motion and WebGL detection
- `useReducedMotion()` follows `matchMedia('(prefers-reduced-motion: reduce)')` and updates live.
- `webgl.js` tries to create a WebGL2 context once, caches the result, and exposes `hasWebGL`. Respect `?nowebgl=1` for QA.
- `tier.js` implements `06` §1.4 and respects `?tier=`.
- `?nointro=1` skips the logo intro (QA).

## 7. Performance budgets
| Metric | Budget (mid-range phone, 4G profile, production build) |
|---|---|
| LCP | ≤ 2.5 s on `/` (the preloaded hero photo is the LCP element) |
| CLS | ≤ 0.05 (reserve space for every image and canvas) |
| INP | ≤ 200 ms (calculator typing must stay instant: debounce 3D, never the numbers) |
| Initial JS (gzip) | ≤ 180 KB on `/`, excluding lazy chunks (measured 172.4 KB after U01) |
| Each 3D chunk (gzip) | ≤ 350 KB |
| Initial images | the hero photo + LQIPs only; everything else lazy |
| Fonts | 2 woff2 files on first load (normal Latin, italic Latin only if used above the fold) |
| Frame time on `/portofolio/` | p95 ≤ 20 ms desktop and ≤ 34 ms on a phone with ×4 CPU throttling; no frame over 50 ms after warm-up |
Plus the 3D frame budgets in `06` §1.7. Measure as described in `10` §4 and report the numbers.

## 8. HTML head, SEO and sharing
- `<html lang>` follows the language. Set the theme attribute before paint with an inline script that reads `localStorage` (try/catch) and `prefers-color-scheme`.
- Each page has its own `<title>`, description, canonical and Open Graph tags: `/` from `meta.*`, `/portofolio/` from `pfMeta.*` (`07` §16), updated on language change.
- Canonicals `https://homyvest.example/` and `https://homyvest.example/portofolio/` (placeholder domain; flagged in the report).
- Open Graph and Twitter: `og:title`, `og:description`, `og:image` = `/og.jpg` (1200 × 630), `og:type` = website, `og:locale` = `en_US` with alternate `id_ID`.
- JSON-LD `Organization` (on `/`): name HOMYVEST, the placeholder URL, `contactPoint` telephone `+62-821-1010-6088` with contactType "customer service" and availableLanguage ["en", "id"].
- `robots.txt` (allow all, sitemap link) and `sitemap.xml` with **two URLs**: `/` and `/portofolio/`.
- Always link to `/portofolio/` with the trailing slash (`PORTFOLIO_URL` in `src/lib/page.js`).
- `<meta name="theme-color">` for both themes.
- **One `<h1>` per page:** on `/` the hero tagline, on `/portofolio/` "Our full portfolio" (the story's beat headlines are `<h2>`). Sections use `<section aria-labelledby>` with `<h2>`.
- Content rendered by 3D must also exist as real text in the DOM (headlines, captions, stats).

## 9. Accessibility implementation notes
- Skip link to `#main` on both pages (text "Skip to content"): the start of the content, since the hero now holds the form.
- Header nav is a `<nav aria-label>`. The mobile menu is a dialog with a focus trap that returns focus on close. On `/portofolio/`, "Portfolio" has `aria-current="page"`.
- **Funnel panel:** `role="dialog"`, `aria-modal="true"`, labelled by the step's heading. Focus trap; Esc closes and returns focus to the hero's "Continue". Focus moves to each step's heading on step change. Every field has a label; groups are `<fieldset>` + `<legend>`; errors are linked with `aria-describedby`, the field gets `aria-invalid`, focus moves to the first invalid field and a polite live region announces "Please check the highlighted fields". Targets at least 44 px. Works with the keyboard only and at 200% zoom.
- Pinned scenes: on keyboard focus, show their "Skip" links. Tab order never gets trapped inside a canvas.
- Calculator: native inputs, `aria-describedby` for help text, `aria-live="polite"` results (debounced), step tabs follow the WAI-ARIA tabs pattern, idea cards are a radio group.
- Lightbox: dialog, arrow keys, Esc, focus returns to the thumbnail.
- The before / after carousel is focusable (`tabindex="0"`), so keyboard users can scroll it on phones.
- FAQ: buttons with `aria-expanded` and `aria-controls`.

## 10. Error handling
- Error boundaries around every 3D scene (→ poster sequence) and around the calculator's 3D (→ the SVG fallback). The calculator's numbers must never depend on the 3D.
- **The only runtime network calls are the funnel's inserts into Supabase**, through `supabase-js`. All content is bundled or static.
  - The hero's lead start (`recordLeadStart`) is fire and forget: it never blocks and never shows an error.
  - `submitLead` maps every outcome to a screen: saved → thank-you; `not_configured` (no env vars) → WhatsApp handoff, with one `console.warn`; `failed` → error screen with "Send on WhatsApp" and "Try again"; `rate_limited` → a friendly note with WhatsApp; a honeypot hit → the normal thank-you. A failed chunk load of the client counts as not configured.
  - Never call `.select()` after an insert: the public key has no read permission, by design.
- Guard all storage access (`src/lib/storage.js`; the funnel's `sessionStorage` adapter in `useFunnelStore.js`).

## 11. Deployment readiness
- `npm run build` → static `dist/` with both pages. The website has no server code; the backend runs in Supabase (§12).
- `vercel.json` and `netlify.toml`: long-cache headers for `/media/*`, `/assets/*` and fonts (`Cache-Control: public, max-age=31536000, immutable`), and no-cache for both pages' HTML (`/`, `/index.html`, `/portofolio/`, `/portofolio/index.html`). Don't deploy the website: no account or domain is available. REPORT.md explains the one-command deploy for each host.
- Redirects (301): Vercel sends `/portofolio`, `/portfolio` and `/portfolio/` to `/portofolio/`. Netlify has only the `/portfolio` rule: it matches with or without the trailing slash, so a `/portofolio` → `/portofolio/` rule would loop, and its Pretty URLs already add the slash (DECISIONS U01-D13). `npm run dev` and `vite preview` apply the same three redirects through a small middleware in `vite.config.ts` (`portfolioRedirects`), so local testing behaves like the hosts.
- The two `VITE_SUPABASE_*` variables must be set in the host's environment settings before the production build, or the funnel hands every lead to WhatsApp (§13).
- The domain is a placeholder until the owner provides it. Search the codebase for `homyvest.example` to replace it.

## 12. Backend: Supabase, PDF report, Google Drive
Everything server-side is in `supabase/` and was delivered with update U01; keep the files as they are unless a bug is found (log it). Full owner instructions: `HUMAN_SETUP_SUPABASE_AND_GOOGLE_DRIVE.md`. Spec: `updates/U01/U01_03_BACKEND.md`.

```
Visitor's browser ──insert (publishable key, insert-only)──▶ public.leads
                                                     │ AFTER INSERT trigger (pg_net, secret header from Vault)
                                                     ▼
                                  Edge Function generate-report (service role, server-side)
                                    1. claims the lead   2. builds the PDF (pdf-lib)
                                    3. uploads it to Google Drive   4. writes the status and Drive link back
                                                     ▲
                         pg_cron every 10 min ───────┘  (retries pending / failed reports, max 5 attempts)
```
| File | What it is |
|---|---|
| `supabase/config.toml` | project id; `verify_jwt = false` for `generate-report` (the database calls it with a shared secret header, not a user JWT) |
| `supabase/migrations/20261121090000_homyvest_leads.sql` | tables `public.leads` and `public.lead_starts`, checks, guards, RLS, the report trigger and the retry cron |
| `supabase/functions/generate-report/index.ts` | entry: secret check, claim, build, upload, status |
| `…/report.ts` | the PDF (one A4 page, two for long answers; EN or ID per `REPORT_LANGUAGE`; Jakarta time; a suggested next step). Standard Helvetica, so emoji and non-Latin characters print as "?" (DECISIONS U01-D16) |
| `…/drive.ts` | Drive auth (`oauth` for a personal Gmail, `service_account` for a Workspace Shared Drive) and the upload |
| `supabase/.env.secrets.example` | the function secrets the owner fills in (into the git-ignored `supabase/.env.secrets`) |
| `scripts/gdrive-auth.mjs` | owner-run helper that gets a Drive refresh token (`npm run gdrive:auth`) |

- **The public key can only insert valid rows.** It can't read, change or delete anything; spoofed report fields are reset on insert; a phone can send at most 3 leads (5 lead starts) per 10 minutes. The kit's tests checked this against a real Postgres.
- `lead_starts` holds the phone-only entries from the hero, so the team can see who started but didn't finish (linked to the lead by `start_id`).
- The website's data layer, `src/lib/leads/leads.ts`, normalises the phone, validates per path, builds the database row, the calculator snapshot and the WhatsApp fallback message, and maps the insert result. Its 34 tests (`leads.test.ts`) also cover the PDF, the Drive signature and the enum ⇄ migration consistency.
- **Agents never deploy the backend:** no `supabase login`, `link`, `db push`, `secrets set` or `functions deploy`. The owner runs `npm run supabase:deploy` (and the other steps) from the setup guide. Agents prepare and verify locally.

## 13. Environment variables and secrets
**The website reads two variables**, both public by design (`.env.example`):

| Variable | Meaning |
|---|---|
| `VITE_SUPABASE_URL` | the Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the publishable (anon) key; `VITE_SUPABASE_ANON_KEY` is accepted as a fallback name |

When either is missing at build time, `supabase` is `null` and the funnel hands over to WhatsApp. Vite reads them from `.env.local` (any build) or `.env.development.local` (only `npm run dev`). In this project the owner's URL and key are in **`.env.development.local`** on purpose: `npm run dev` can try the real form, while `npm run build` and the e2e builds never get the real project (the `:4174` e2e build uses a fake URL and key, `10` §2; DECISIONS U01-D1). Production builds get the values from the host's settings.

**Secrets inventory**

| Secret | Where it lives | Who sets it | Public? |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env.development.local` today (dev only, U01-D1); `.env.local` once the owner prefers it for every build; the host's environment settings | owner | yes (by design) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | same as above | owner | yes (insert-only through RLS) |
| `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` (in the function) | injected into the function by Supabase | nobody | **no** |
| `REPORT_WEBHOOK_SECRET` | Supabase function secrets **and** Vault (`report_webhook_secret`) | owner | **no** |
| Function URL | Vault (`report_function_url`) | owner | not secret; kept in Vault for convenience |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` | Supabase function secrets (from `supabase/.env.secrets`, git-ignored) | owner | **no** |
| `GOOGLE_SERVICE_ACCOUNT_JSON_B64`, `GDRIVE_FOLDER_ID` | Supabase function secrets | owner | **no** |
| `SUPABASE_ACCESS_TOKEN` (CLI) | the owner's shell only | owner | **no** |

**Rules and guards**
- Never create, read, print, log or commit real credentials. Never open `.env*` (except `*.example`), `supabase/.env*` or any key file, even when it exists. Agents use only the `*.example` files; e2e builds get fake values on the command line (`10` §2), never in a file.
- `.gitignore` has a secrets block: `.env`, `.env.*` (except `!.env.example`), `supabase/.env*` (except `!supabase/.env.secrets.example`), `supabase/.temp/`, `supabase/.branches/`, `*.pem`, `*service-account*.json`, `*credentials*.json`, `client_secret*.json`, `qa/tmp/`. Build output `dist-e2e/` is ignored too.
- **`scripts/check-secrets.mjs`** fails on secret file names (`.env*` other than `*.example`, `supabase/.env*`, key and credential files) and on secret-looking content (Supabase secret keys, JWTs, private keys, Google client secrets and refresh tokens, service-account JSON, filled secret variables). `--staged` checks the staged files; `--all` (`npm run check:secrets`) checks every tracked file. Run `node scripts/check-secrets.mjs --all` before every commit.
- **The git hook:** `.githooks/pre-commit` runs the scanner with `--staged` and blocks the commit on a finding. Install it once per clone with `git config core.hooksPath .githooks`.

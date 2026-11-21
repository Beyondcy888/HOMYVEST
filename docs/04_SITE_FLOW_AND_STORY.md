# 04 — Site flow and story

Two static pages share one shell (header, footer, floating WhatsApp; `09` §2):
- **`/`, the main page.** Short and fast. It asks for a phone number in the first screen, then explains who we are, how it works and who runs it, proves it with real places, lets the visitor check their own land, and ends on what happens next.
- **`/portofolio/`, the full portfolio.** The heavy 3D showpieces (the story, the Maxone walkthrough, the padel hall) and the beyond-stays projects, told slowly.

The main page reads like a short story in seven movements. Each section answers the question the previous one raised, so the visitor never wonders "why am I seeing this?".

```
ASK              →  PROMISE      →  PROCESS          →  OPERATOR                 →  PROOF      →  PERSONAL     →  PLAN
Hero + phone        What is         End-to-end          Behomy: hero, hybrid        Projects      Land check      What happens next
number (funnel)     HOMYVEST?       Plan · Design ·     model, stats, places,                     (calculator)    → portfolio card → FAQ
                                    Build · Operate     before / after                                            → Footer
```

The visitor's inner monologue the main page should answer, in order:
1. *"What is this, who's behind it, and can I just ask?"* → **Hero + phone number**
2. *"Not yet. What is it exactly?"* → **What is HOMYVEST?**
3. *"How does it work, and who does what?"* → **End-to-end**
4. *"And who runs it after it's built?"* → **Behomy**
5. *"Show me real places."* → **Behomy's places, before / after, and Projects**
6. *"So what about MY land?"* → **Land check**
7. *"OK, what now?"* → **What happens next** (portfolio, WhatsApp, or the number)
8. *"But what about…"* → **FAQ**

All copy is in `07`. Section IDs below are the anchor targets. Section order on `/` is exactly: `top, about, how, behomy, projects, calculator, next, faq`.

Removed in update U01, don't rebuild them: the two "doors" ("Which one sounds like you?" and its "Here's who does the work." line), the Team section (merged into End-to-end), the HomyEight intro ("Built by HomyEight / Drawn with care…"), and the story, Maxone and Beyond sections on the main page (moved to `/portofolio/`).

---

## 0. Global elements (both pages)

### Header (sticky, minimal)
- Left: the **wordmark** (`03` §4). On `/` it scrolls to the top; on `/portofolio/` it links to `/`, and phones also get a "← Home" link beside it.
- Links (desktop): **How it works** (`/#how`) · **Behomy** (`/#behomy`) · **Projects** (`/#projects`) · **Land check** (`/#calculator`) · **FAQ** (`/#faq`) · **Portfolio** (`/portofolio/`).
  - On `/`, section links scroll with Lenis. From `/portofolio/` they are plain links; the main page then lands on the hash once the fonts are ready and the triggers have been measured (the intro is skipped on such a deep link).
  - "Land check" (and any link to `/#calculator`) opens the calculator at Step 1.
  - On `/portofolio/`, "Portfolio" carries `aria-current="page"`. Hovering or focusing it elsewhere prefetches the page.
- Right: **EN | ID** toggle and a compact **WhatsApp** button.
- Behaviour: transparent at the top; it gains `--paper` and a hairline once the page scrolls. It hides on scroll down and shows on scroll up, but stays hidden while a pinned 3D scene is active (`/portofolio/`), so it doesn't cover the scene.
- Phones: 56 px tall; wordmark, language toggle, and a menu button that opens a full-screen sheet with the links, large and typographic, plus the WhatsApp button.

### Skip link and deep links
- "Skip to content" goes to `#main`, the start of the page content (the hero now holds the form).
- `/?focus=phone` scrolls to the top and focuses the phone field. "Leave your number" on `/portofolio/` uses it.

### Floating WhatsApp (phones only)
A 56 px round ink button with the WhatsApp glyph, bottom-right (16 px inset plus the safe area), shown once the visitor has passed the page's hero. Hidden while a pinned scene is active, while the funnel panel or the menu is open, while any field has focus (so it never covers the keyboard), and while the footer is visible.

---

## 1. `#top`: Hero + lead funnel (ASK)
**Purpose:** within five seconds a visitor knows what we do and who's behind it, and can leave a number.

**Layout (desktop ≥ 1024 px):** two columns at full viewport height (minus the header).
- **Left, ~5/12:**
  1. Partner line, small: "In partnership with" + the HomyEight compact logo + the Behomy logo, separated by a hairline (`03` §3.1).
  2. The page's only `<h1>`, in two lines: "Turn idle land into steady income." large, then "Built by HomyEight, operated by Behomy." smaller in `--ink-2` (`03` §2).
  3. One supporting sentence.
  4. The **phone card**: label, a large field with a fixed `+62` prefix, "Continue", privacy line, inline error (`03` §8).
  5. The **free consultation line**: "Free consultation with the HomyEight team", then the WhatsApp glyph and `+62 821-1010-6088` as a link (generic message, `07` §12).
- **Right, ~7/12:** the photo `facades/best` (dusk, every window lit), full height, depth parallax, square corners. A small chip in its lower-left corner: "82% average occupancy across Behomy properties" with footnote ¹ (linked to the notes under the Behomy stats).

**Tablets:** the field and the button stack. **Phones:** the photo on top (38svh, centred on the building), then the content; the whole hero should fit in about 1.4 screens, and focusing the field scrolls it into view above the keyboard. **Landscape phones:** two columns again, photo right at 45%.

### The lead funnel
After "Continue" with a valid number, a panel opens over the page; the hero stays as it is underneath.
```
[Hero] phone ──Continue──▶ Step 2: funding question (3 options)
                            ├─ "Loan from bank / financial institution" ─┐
                            ├─ "Personal funds" ─────────────────────────┴─▶ Step 3A: build form
                            └─ "Currently do not have funds for construction" ─▶ Step 3B: needs form
                    Step 3 ──Send──▶ saved ──▶ Thank you
                                 ├─ not configured ──▶ WhatsApp handoff (answers prefilled)
                                 ├─ failed ──▶ error: "Send on WhatsApp" (prefilled) or "Try again"
                                 └─ rate limited ──▶ a friendly note with WhatsApp
```
- **Hero step:** accepts `0812…`, `812…` or a pasted `+62812…`. An invalid number shows the inline error and the panel stays closed. A valid one records a phone-only lead start (fire and forget, never blocking) and opens the panel at Step 2.
- **Steps** are numbered for the visitor as Step 1 of 3 (the phone, shown as a recap "We'll contact you at … · Change"), Step 2 of 3 (funding: three radio cards) and Step 3 of 3:
  - **3A, build form** (bank loan or personal funds): name; what they own (chips); what they'd like to build (chips); where the property is (city chips). "Other" opens a short text field.
  - **3B, needs form** (no funds yet): a reassuring intro; which need fits best (radio cards); name; city chips.
  - Both end with a short consent line and "Send". A hidden honeypot field catches naive bots; a caught bot sees the normal thank-you.
- **WhatsApp is always an alternative:** every step has "Prefer to chat? WhatsApp us" (a generic message on Step 2, the answers so far on Step 3).
- **Thank you:** a drawn check mark, "Thank you, {firstName}…", then **Chat on WhatsApp now** (prefilled with the summary), **Try the land check** (closes the panel and scrolls to `#calculator`) and **See our full portfolio**. Until reload, the hero's phone card shows "Thanks, we'll be in touch at …" instead of the field.
- **Calculator results** come along as a snapshot only if the visitor used the calculator in this session.
- **Persistence:** answers, the open state and the step live in `sessionStorage` (`homyvest:funnel:v1`), so closing, reopening or reloading keeps them; a reload reopens the panel where the visitor left it. Result screens are never restored. A successful send clears everything (DECISIONS U01-D11).
- **It's a dialog:** focus moves to each step's heading, the focus is trapped, Esc closes it and the focus returns to "Continue"; the page behind doesn't scroll.

Styles in `03` §8, copy in `07` §18, data and backend in `09` §12.

**Transition:** none needed. The hero ends, and `#about` begins on `--paper` with generous space, as a breather.

---

## 2. `#about`: What is HOMYVEST? (PROMISE)
**Purpose:** say plainly what HOMYVEST is, and what it isn't, for the visitor who isn't ready to leave a number.

**Layout:** compact. The heading "What is HOMYVEST?" on the left (4/12), one short paragraph and one small line ("We're not a developer…") on the right (6/12). Stacked on phones. No image.

**Transition:** the paragraph ends on "HomyEight builds it and Behomy runs it, so you deal with one team", which `#how` unpacks.

---

## 3. `#how`: End-to-end (PROCESS)
**Purpose:** make "one team, from the first sketch to full rooms" obvious, and show who does each part. It replaces the old "Three names, one team" section.

**Layout:** eyebrow, title and one sub line, then **four steps**, each with a 4:3 photo, a number, a name, one sentence and a small italic "by …" tag:

| Step | Photo | By |
|---|---|---|
| 01 Plan | `maxone/layout` (floor plan, cropped toward the dining area, greyscale so it reads as a drawing) | HOMYVEST, with Behomy's feasibility data |
| 02 Design | `photos/step-design` (HomyEight 3D design of a kost) | HomyEight |
| 03 Build | `photos/step-build` (construction with scaffolding, B&W) | HomyEight |
| 04 Operate | `photos/step-operate` (guest checking in at a Behomy reception) | Behomy |

- Desktop: four columns in a row; a hairline connects the numbers and draws left to right as the section enters (scrubbed). Photos reveal with a clip from bottom to top, staggered 0.08 s. Tablets: two columns.
- Phones: one column; a vertical hairline on the left connects the numbers, with a 16:10 photo and the text beside it.
- Photos are capped at 400 CSS px wide (two sources are small, `08` §2).

**Transition:** a closing line set large (`--t-h2`): "HOMYVEST finds the potential, HomyEight builds it, and Behomy keeps it running. You only need to save one number."

---

## 4. `#behomy`: Operated by Behomy (OPERATOR)
**Purpose:** remove the owner's biggest fear: "who runs it after it's built?"

**Layout, in order:**
1. **Behomy hero:** full-bleed `photos/behomy-hero` (a Behomy room with the beHomy pillow), at least 88svh (80svh on phones), with a dark scrim from the bottom left (stronger in the dark theme and on phones). Bottom-left: the on-dark Behomy logo, the eyebrow "Operated by Behomy", the headline (the section's `<h2>`), one paragraph, and "See how it works ↓", which scrolls to the hybrid diagram. Depth parallax.
2. The existing title "Daily guests and monthly tenants…" (now an `<h3>`) and the paragraph explaining the **hybrid stay** idea.
3. **Hybrid diagram:** a building elevation drawn in line, with rooms as cells. A month scrubber (Jan→Dec) animates with the scroll: cells switch between **daily** (solid ink) and **monthly** (outlined) as the seasons change, while an "occupied" counter stays high. Illustrative: no fake percentages on it.
4. **Stats band, five items:** 82% average occupancy¹ · 65.4% average GOP margin² · < 3.5 yrs estimated break-even on Behomy equity partnership projects⁴ · 3,000+ rooms · 100+ locations in 18 areas. Three over two on desktop; two columns on phones with the fifth full width. Footnotes 1–4 sit under the band.
5. **What Behomy takes off your hands:** four short typographic blocks (set-up and staff · getting guests · care and repairs · clear reporting), with `photos/staff-training` under the heading.
6. **Places Behomy runs today:** an editorial mosaic of eleven Behomy photos with brand captions (`08` §5). One large image (the corridor), two portrait facades in tall cells, the rest in single cells; four columns on desktop, two below 1024 px. A click opens the shared viewer.
7. **From idle to running:** four before / after pairs, each a card with Before (greyscale) and After side by side, small "Before" / "After" labels and a placeholder caption. Desktop: a 2 × 2 grid. Phones: a horizontal snap carousel, one pair per view with the two photos stacked, dots and "1 / 4".
8. One quiet line with the brands (Behomy Residence · Corvel · Purnava Village · Hoteru), and the "up to 2.5×" hybrid claim once, as a small attributed note³ (`02` §6).
9. `photos/behomy-team` full-bleed: a human close, captioned "The Behomy team".

Details of the structure: DECISIONS U01-D9.

**Transition:** "Here are some of the places we've built and run." → `#projects`.

---

## 5. `#projects`: Projects (PROOF)
**Purpose:** real places: kost, guesthouses, homestays and villas.

**Layout:** no filters. Every project image in one fixed, curated editorial order, composed row by row on the 12-column grid, alternating large and small, left and right (order and sizes in `src/content/projects.js`, `gallery`). Each image reveals as it scrolls in (a clip from the bottom plus the 1.06 → 1.0 scale) and has depth parallax.
- Each image carries the three-voice caption placeholder (`03` §2).
- Clicking an image opens the full-screen viewer: the image large, its caption, previous / next with arrow keys and swipe. Esc closes it.
- Low-res images (`benhil-1`, `benhil-2`, `facade-2`) are only ever shown small (`08` §2). Phones: one column; landscape images full width, low-res ones at a modest width with the caption beside them.

**Transition:** "Not every plot should be a place to stay." → `#calculator`.

---

## 6. `#calculator`: Land check (PERSONAL)
**Purpose:** the visitor's own numbers, with live 3D. Full spec in `05`, copy in `07` §9–12, 3D in `06` §5. Unchanged by U01 except its entry points (`05` §2).

**Layout (desktop):** a two-column workspace that fills the viewport. Inputs on the left (~40%), a sticky 3D scene and results on the right (~60%). Step tabs across the top: **1 Your land · 2 Ideas for your land · 3 Already built? Add a floor**. A land summary chip appears on steps 2 and 3, with "Edit".

**Layout (phones):** the 3D sits on top (40–45% of the viewport height, sticky). Inputs and results scroll beneath it. Steps are a segmented control.

At the end of Step 1: "Next: see what this space could earn" (→ Step 2) and a link "Already built? See if a floor fits" (→ Step 3). After Step 2 or 3: the **"Send my results on WhatsApp"** CTA.

The calculator's interface loads as its own chunk right after the first paint; until it arrives, an empty section with the same id holds its place.

---

## 7. `#next`: What happens next → Ready when you are (PLAN)
**Purpose:** remove uncertainty about the process, and convert.

**Layout:**
1. Six numbered steps along a line that draws as you scroll (vertical on phones): **Chat with us → Site survey and feasibility → Design and cost estimate (free) → Build → Operate → Report**. Each names who does it (HOMYVEST, HomyEight or Behomy) in small italic.
2. The closing block over `facades/best`, darkened, full-bleed, with depth parallax and `--paper` text. It bookends the hero's photo. "Ready when you are.", one line of body, and, if the visitor has calculator results, "Your land check results will be included." Then three ways on:
   - **"See our full portfolio"**, the hero of the block: a large link card to `/portofolio/` (`03` §8), with "Story · Step inside Maxone · Padel hall · Beyond stays" under it.
   - The **WhatsApp** button (with the calculator results when there are any), plus the number as text.
   - **"Leave your number"**, a secondary button: scrolls to `#top` and focuses the phone field.

---

## 8. `#faq`: FAQ
An accordion of 12 questions (`07` §13), the last one about what happens to the details a visitor sends. Single-open, animated height, keyboard accessible (`button` + `aria-expanded`).

---

## 9. Footer (both pages)
- The wordmark, large (it animates once when it enters view on touch devices).
- "Powered by HomyEight · Operated by Behomy", each line ending in the partner's logo (`03` §3.1).
- A link to the other page: "Portfolio" on `/`, "Home" on `/portofolio/`.
- WhatsApp number, language toggle, theme toggle.
- The short legal disclaimer (`07` §15) in `--t-small`. © year HOMYVEST.

---

## 10. `/portofolio/`: the full portfolio
**Purpose:** the proof in motion, for the visitor who wants to see more. Each scene keeps its choreography from the first build; only its scroll length changed, so it moves slower and stays smooth. Scene choreography, beats, tiers, posters, frame budgets, smoothness rules and mobile framing: **see `06`**.

```
Header            "Portfolio" marked current; "← Home" beside the wordmark on phones
#intro            eyebrow "Portfolio", <h1> "Our full portfolio", one line, a 4-item index, "Scroll to begin ↓"
#story            1. The story: the 3D hero story (pinned)
#maxone           divider "02 · Step inside Maxone", then the Maxone walkthrough (pinned)
#padel            divider "03 · The padel hall", then the padel assembly (pinned)
#beyond           divider "04 · Beyond stays", then mini soccer · café · office, landscape only
#closing          "Like what you see? Let's look at your land."
Footer
```
- **Intro:** short (≤ 70svh). Each index item shows a small poster thumbnail and its name and jumps to the scene's start (2 × 2 grid on phones). The page's only `<h1>` is "Our full portfolio"; the story's beat headlines are `<h2>`.
- **Dividers:** about 30svh between scenes, with the next scene's number and name in large type. They rest the eye and give the next scene's code time to load.
- **Scroll lengths** come from one file, `src/content/scroll-config.js` (story, maxone, padel; beyond per panel on desktop), and the page uses a softer smooth scroll than `/` (`09` §5).
- **Skip links** jump past each pin ("Skip intro" / the story, "Skip walkthrough", "Skip padel hall").
- **The story's last beat** offers "See what your land can do" (→ `/#calculator`) and "Chat on WhatsApp".
- **Beyond stays:** landscape images only, on every viewport (16:9 lead images, 3:2 thumbnails). Mini soccer (`athero-1` as the lead, then `athero-3`, `athero-2`, `athero-4`), café (`cafe`), office (`office-1` lead, `office-2`, `office-3`). Desktop: a horizontal pinned strip of 80vw panels. Tablets: panels stacked. Phones: cards with a swipeable row of thumbnails. Any image opens the viewer with its group.
- **Closing:** "Leave your number" (→ `/?focus=phone`), WhatsApp, "← Back to home".
- The page loads only its own 3D; the main page never loads it (`09` §4).

---

## 11. Flow quality checklist (check after every update)
- [ ] Section order on `/` is exactly `top, about, how, behomy, projects, calculator, next, faq`, and on `/portofolio/` `intro, story, maxone, padel, beyond, closing`.
- [ ] Reading only the headlines of `/` from top to bottom tells the whole story.
- [ ] Within the first screen (desktop and a 360 px phone) a visitor sees what we do, who builds and who runs it, and the phone field.
- [ ] Every section ends with a line or visual that sets up the next one.
- [ ] The funnel never strands anyone: every step offers WhatsApp, and when saving isn't possible the answers go to WhatsApp prefilled.
- [ ] A visitor can reach WhatsApp from anywhere in ≤ 2 taps, and the phone field from anywhere in ≤ 2 ("Leave your number", the hero).
- [ ] No dead anchors: every header link works from both pages, and "Land check" opens Step 1.
- [ ] `/` requests no Story, Maxone or Padel code and no scene posters before the portfolio card is hovered or focused.
- [ ] On `/portofolio/` the pinned scenes don't feel like obstacles: each has a skip link, and the page ends with a way back to the land.
- [ ] Colour appears only in renders, photos and partner logos (plus the calculator's zone green), and every arrival of colour feels earned.
- [ ] In Indonesian, nothing wraps awkwardly at 360 px.

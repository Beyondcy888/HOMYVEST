# 04 — Site flow and story

One long, single page. It reads like a short story told in seven movements. Each section answers the question the previous one raised, so the visitor never wonders "why am I seeing this?".

```
HOOK         →  PROMISE        →  PEOPLE                     →  PROOF        →  POSSIBILITIES  →  PERSONAL      →  PLAN
Hero story      What is            The team · HomyEight +       Projects       Beyond stays      Calculator       What happens next
(3D)            HOMYVEST +         Maxone walkthrough (3D) ·    (stays)        (padel 3D)        (live 3D)        → FAQ → Footer
                two doors          Behomy
```

The visitor's inner monologue the page should answer, in order:
1. *"Huh, nice. What is this?"* → **Hero story**
2. *"Is this for me?"* → **What is HOMYVEST + the two doors**
3. *"Who are these people?"* → **The team**
4. *"Can they actually build?"* → **HomyEight + Maxone walkthrough**
5. *"And who runs it after?"* → **Behomy**
6. *"Show me real places."* → **Projects**
7. *"My land isn't right for a guesthouse."* → **Beyond stays**
8. *"So what about MY land?"* → **Calculator**
9. *"OK, what now?"* → **What happens next + WhatsApp**
10. *"But what about…"* → **FAQ**

All copy is in `07`. Section IDs below are the anchor targets.

---

## 0. Global elements

### Header (sticky, minimal)
- Left: the **wordmark** (`03` §4), which links to top.
- Centre or right (desktop): text links **How it works** (`#about`) · **Projects** (`#projects`) · **Calculator** (`#calculator`) · **FAQ** (`#faq`).
- Right: **EN | ID** toggle, and a compact **WhatsApp** button.
- Behaviour: transparent over the hero. It gains `--paper` background and a hairline once the hero ends. It hides on scroll down and shows on scroll up (but stays hidden while a pinned 3D scene is active, so it doesn't cover the scene).
- Mobile: wordmark, language toggle, and a menu button that opens a full-screen sheet with the links, large and typographic, plus the WhatsApp button.

### Section progress (desktop only, optional)
A thin vertical line at the right edge with tiny ticks for the seven movements. Hovering a tick shows its name. Add it only if it stays out of the way.

### Floating WhatsApp (mobile only)
After the visitor passes the hero, a small round ink button with the WhatsApp glyph sits bottom-right. Hide it while the calculator inputs are focused (so it never covers the keyboard) and while the footer is visible.

---

## 1. `#story`: Hero story (HOOK)
**Purpose:** show what HOMYVEST does in ~20 seconds of scrolling, without a paragraph of explanation.

**Content:** a pinned, scroll-scrubbed 3D story in five beats (full choreography in `06` §2):
1. **Idle:** an empty white clay plot beside a road, tall grass tufts, nothing happening.
2. **Build:** wall pieces drift in and assemble into a hybrid stay, with the top floor cut away to show rooms (HomyEight).
3. **Possibilities:** the camera swipes sideways (SliderCentral style) to neighbouring plots where an office, a café and a sports court assemble. It doesn't have to be a guesthouse.
4. **Alive:** the camera pulls up to see all four plots. Windows warm up, tiny people and cars appear (the Behomy Group runs it). Then the scene dissolves into the full-colour dusk render `facades/best` with depth parallax: colour arrives because the property is alive.
5. **Earn:** over the photo, "From idle to earning", with two real stats (82% occupancy, 3,000+ rooms) and two CTAs: **See what your land can do** (→ `#calculator`) and **Chat on WhatsApp**.

**Text placement:** each beat's headline sits in the left third (desktop) or top area (mobile), large, ink on paper. It fades and rises in as its beat begins, and out as it ends. Keep the scene's subject clear of text.

**Scroll length:** ~500 vh desktop, ~420 vh mobile. A small "Scroll" cue at the start. A "Skip intro" text link (bottom-left) jumps to `#about`.

**Transition out:** the colour photo scrolls up naturally as the pin releases. `#about` begins on `--paper` with generous space, so it feels like turning a page after the colour.

---

## 2. `#about`: What is HOMYVEST + two doors (PROMISE)
**Purpose:** say plainly what HOMYVEST is (and isn't), then let the visitor self-identify.

**Layout:** a large statement headline over two columns: on the left a short paragraph, on the right whitespace or a small detail crop of an interior render.

Below it, **"Which one sounds like you?"**, two large, equal "doors" side by side (stacked on mobile):
- **Door A: "I have empty land"** → scrolls to `#calculator`, opens Step 1, focuses the first input.
- **Door B: "I have an idle or unfinished building"** → scrolls to `#calculator`, opens Step 1 with a short note ("First, tell us about the land, then about your building"). Once land is filled, the step flow offers Step 3.

Each door: big typographic label, one sentence, an arrow. On hover, a faint clay line drawing appears behind it (an empty plot for A, a half-built frame for B). These are SVG line drawings, not renders.

**Transition:** a single line under the doors, "Here's who does the work.", leads into `#team`.

---

## 3. `#team`: Three names, one team (PEOPLE)
**Purpose:** make the "one team, end to end" idea obvious in five seconds.

**Layout:** a horizontal chain of three columns connected by a thin line that draws itself on scroll: **HOMYVEST** (finds the potential) → **HomyEight** (builds it) → **Behomy** (runs it). Each has a one-line role and one sentence. On mobile, a vertical chain.

Below the chain, one sentence: "You talk to one team, from empty land to monthly report."

**Transition:** the HomyEight column's line extends down into the next section.

---

## 4. `#homyeight`: Built by HomyEight + Maxone walkthrough (PEOPLE / PROOF)
**Purpose:** prove craft. Let the visitor *step inside* finished work.

**Part 1, intro:** headline, paragraph and three stats (50+ projects · since 2021, roots 2011 · in-house furniture workshop). Use a split layout: text left, and on the right a tall crop of an interior render with depth parallax (e.g. `interiors/interior-3`, the lobby and stair).

**Part 2, "Step inside":** a full-viewport, pinned, scroll-driven walkthrough of the Maxone hotel lobby and dining room (full spec in `06` §3):
- The camera walks from the street entrance through the reception, the dining hall, the buffet and bar, looks up into the double-height void, moves to the windows, then rises up through the ceiling to a top-down view that dissolves into the floor plan.
- At each stop, the matching real render slides in as a large framed card with a placeholder caption.
- A **mini-map** (the floor plan, small, bottom-left) shows a dot moving along the route.
- A "Skip walkthrough" link sits at the top of the section.

**Scroll length:** ~700 vh desktop, ~560 vh mobile.

**Transition:** the final top-down plan view fades to `--paper`, and the Behomy headline rises: "Built well is half of it. The other half is running it."

---

## 5. `#behomy`: Run by Behomy (PEOPLE / PROOF)
**Purpose:** remove the owner's biggest fear: "who runs it after it's built?"

**Layout:**
1. Headline + paragraph explaining the **hybrid stay** idea.
2. **Hybrid explainer:** a simple, elegant animated diagram, not 3D. A building elevation drawn in line, with rooms as cells. A month scrubber (Jan→Dec) animates as you scroll: cells switch between **daily** (solid ink) and **monthly** (outlined) as the seasons change, while an "occupied" counter stays high. Caption: "Daily guests in busy months, monthly tenants in quiet ones. Rooms keep earning." This is illustrative. Don't print fake percentages on it.
3. **Stats band:** four huge numbers with footnotes: 82% average occupancy · 65.4% average GOP margin · 3,000+ rooms · 100+ locations in 18 areas. The footnotes give the period (Aug 2025–Mar 2026) and source (Behomy).
4. **What Behomy handles:** four short blocks (set-up and staff · getting guests · care and repairs · clear reporting). Use typographic layout, not icon cards.
5. One quiet line with the brands: Behomy Residence · Corvel · Purnava Village · Hoteru.
6. The "up to 2.5×" hybrid claim may appear once here as a small, attributed note (`02` §6).

**Transition:** "Here are some of the places we've built and run." → `#projects`.

---

## 6. `#projects`: Projects (PROOF)
**Purpose:** real places: kost, guesthouses, homestays and villas.

**Layout:** an editorial, asymmetric gallery (not a uniform grid). Mix one or two large full-bleed images with smaller ones, alternating left and right as you scroll. Every photographic image gets depth parallax (`06` §6).
- Filter row: **All · Kost · Guesthouse · Homestay · Villa** (typographic tabs). Filtering animates with a FLIP layout transition. Category assignments are provisional (`08` §4).
- Each image carries the three-voice caption placeholder (`03` §2).
- Clicking an image opens a full-screen viewer: the image large, its caption, and previous/next with arrow keys and swipe. Esc closes it.
- Low-res images (`benhil-1`, `benhil-2`, `facade-2`) are only ever shown small (`08` §2).

Asset set (see `08` §4 for exact IDs): `facades/best`, `facades/facade-1`, `facades/facade-2`, `facades/benhil-1`, `facades/benhil-2`, `interiors/interior-1` … `interior-8`.

**Transition:** "Not every plot should be a place to stay." → `#beyond`.

---

## 7. `#beyond`: Beyond stays (POSSIBILITIES)
**Purpose:** prove "the land decides". Show non-stay projects.

**Part 1, padel assembly:** a pinned scene, ~360 vh. On the left, short text that changes per stage; on the right, the 3D clay padel hall assembling in three stages. Each stage resolves into its cleaned full-colour render (`06` §4):
1. Ground floor: eight courts, the café, changing rooms.
2. Upper floor: the lounge above the café, trees, the structure rising.
3. The finished hall with its vaulted roof.

**Part 2, three more ways to earn:** a horizontal strip (horizontal scroll pinned on desktop; native swipe on mobile) with:
- **Mini soccer**: `others/athero-2`, `athero-3`, `athero-4` (`athero-1` contains baked-in labels, so use it last or not at all).
- **Café**: `cafe/cafe`.
- **Office**: `office/office-1`, `office-2`, `office-3`.

Each panel: a large image with depth parallax, the type name in big type, one sentence, and a caption placeholder.

**Transition:** a large line: "So what could *your* land become?" → `#calculator`.

---

## 8. `#calculator`: Land check (PERSONAL)
**Purpose:** the visitor's own numbers, with live 3D. Full spec in `05`, copy in `07` §9–11, 3D in `06` §5.

**Layout (desktop):** a two-column workspace that fills the viewport. Inputs on the left (~40%), a sticky 3D scene and results on the right (~60%). Step tabs across the top: **1 Your land · 2 Ideas for your land · 3 Already built? Add a floor**. A land summary chip appears on steps 2 and 3, with "Edit".

**Layout (mobile):** the 3D sits on top (40–45% of viewport height, sticky). Inputs and results scroll beneath it. Steps are a segmented control.

At the end of each step: a clear "Next" button and, after Step 2 or 3, the **"Send my results on WhatsApp"** CTA.

**Transition:** below the calculator, "Ready when you are." → `#next`.

---

## 9. `#next`: What happens next (PLAN)
**Purpose:** remove uncertainty about the process, and convert.

**Layout:** six numbered steps along a line that draws as you scroll (vertical on mobile): **Chat with us → Site survey and feasibility → Design and cost estimate (free) → Build → Operate → Report**. Each step names who does it (HOMYVEST, HomyEight or Behomy) in small italic.

Then a big, calm closing block: a headline, the WhatsApp button (with the calculator results if available) and the phone number in text. If the visitor has calculator results, a small line confirms: "Your land check results will be included."

Background: `facades/best` returning in a subtle, darkened full-bleed (or another strong render) with depth parallax, text in `--paper`. This bookends the hero's colour moment.

---

## 10. `#faq`: FAQ
An accordion of ~11 questions (`07` §13). Single-open, animated height, keyboard accessible (`button` + `aria-expanded`). Two columns on desktop (question list left, open answer right) or a simple stacked list. Choose whichever reads better.

---

## 11. Footer
- The wordmark, large (it animates once when it enters view on touch devices).
- "Powered by HomyEight · Operated by Behomy".
- WhatsApp number, language toggle, theme toggle.
- The short legal disclaimer (`07` §15) in `--t-small`.
- © year HOMYVEST.

---

## 12. Flow quality checklist (check in M10)
- [ ] Reading only the headlines from top to bottom tells the whole story.
- [ ] Every section ends with a line or visual that sets up the next one.
- [ ] Neither door leaves the visitor stranded. Both lead somewhere useful in one click.
- [ ] A visitor can reach WhatsApp from anywhere in ≤ 2 taps.
- [ ] The three pinned scenes don't feel like obstacles: each has a skip link, and none exceeds its scroll length.
- [ ] Colour appears only in renders, and every arrival of colour feels earned.
- [ ] In Indonesian, nothing wraps awkwardly at 375 px.

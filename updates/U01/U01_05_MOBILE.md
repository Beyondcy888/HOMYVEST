# U01_05: Mobile pass (both pages)

The owner's notes: the desktop view is perfect. On phones, things can be smaller, the walkthrough images don't need to fill the screen, and everything must stay easy to use and understandable. **Change only the < 1024 px layouts. Desktop stays pixel-identical** (verify with before/after desktop screenshots).

## 1. Global rules (< 768 px unless noted)
- No horizontal page scroll at 360 px. Check `document.documentElement.scrollWidth <= innerWidth` in a test.
- Side margins 20 px. Section spacing `clamp(64px, 12vh, 96px)`.
- Type: `--t-display` capped at `clamp(2.4rem, 11vw, 3.4rem)`; `--t-h1` at `clamp(1.9rem, 8vw, 2.6rem)`; body 16 px; captions 13 px. Check Indonesian at 360 px: no word may overflow (use `overflow-wrap: anywhere` only for long tokens like phone numbers and URLs).
- Header 56 px tall. Wordmark at ~22 px cap height. The menu sheet has links at 28 px with 56 px rows.
- Every tap target ≥ 44 × 44 px, with ≥ 8 px between neighbours.
- Use `svh`/`dvh` for heights, never `vh`, so mobile browser bars don't cause jumps.
- The floating WhatsApp button (56 px, bottom-right, 16 px inset plus the safe-area inset) hides while the funnel panel is open, while any input is focused, and over the footer.
- Images in content columns use `sizes="100vw"`. Low-res images are capped at 100% of the column, never upscaled beyond their source pixels at DPR 2.

## 2. Main page
| Section | Mobile layout |
|---|---|
| Hero | Photo on top, 38svh, `object-position` on the lit building, with the occupancy chip bottom-left of the photo. Then the partner line (logos 18 px), H1 (two lines), the supporting line, then the phone card: the `+62` prefix and input on one row (56 px tall), with "Continue" full width under it. The free-consultation link sits under the card. The whole hero fits in ~1.4 screens. With the keyboard open, scroll the input into view (`scrollIntoView({block:'center'})` on focus). |
| Funnel panel | Full-screen sheet. Sticky footer with the primary button (kept above the keyboard via `visualViewport`). Chips in a 2-column grid. Radio cards full width. The step indicator stays in the sticky header. |
| What is HOMYVEST? | Heading, then paragraph, stacked. |
| End-to-end | A vertical list: 16:10 photo full width, then number + name + sentence + "by" tag. A thin vertical line on the left connects the numbers. |
| Behomy hero | 80svh. `object-position: 62% 50%` keeps the bed and pillow visible. Text block at the bottom, logo 32 px. A stronger scrim. |
| Hybrid diagram | Scale the drawing to the width. The month scrubber labels are abbreviated (`Jan`, `Feb`…). Keep the scroll animation, with a shorter pin if one is used (≤ 150svh). |
| Stats band | A 2-column grid, with the 5th stat full width. Big numbers at `clamp(2.4rem, 12vw, 3.2rem)`. Footnotes under the band, not beside the numbers. |
| Behomy portfolio | A 2-column masonry. Portrait facades span 2 rows. Captions under the images at 13 px. |
| Before / after | A horizontal snap carousel, one pair per view (Before on top, After below, each ≤ 42svh), with dot indicators and "1 / 4". |
| Projects | A single column. Landscape images full width (16:10 crop where needed). Low-res images at max 100% column width with a caption beside, not stretched. |
| Calculator | Unchanged (it was already designed mobile-first), but recheck after the header change. |
| What happens next | A vertical timeline. The portfolio card is full width, ~150 px tall, with the thumbnail fan on the right shrunk to 3 × 64 px. WhatsApp and "Leave your number" are stacked buttons. |
| FAQ | A single column accordion. |

## 3. Portfolio page
| Scene | Mobile layout |
|---|---|
| Intro + index | The index is a 2 × 2 grid of small poster cards. |
| Story | The text sits in the top 30% of the screen; the scene is framed in the lower 70% (`docs/06` §2.6). Headline at `--t-h1` mobile size, body 15 px. |
| **Maxone walkthrough** | The **stop cards get smaller**: width 62vw, image 4:3 (≈ 62vw × 46vw, capped at 30svh tall), anchored bottom-left with a 16 px inset (plus the safe area), and a 12 px caption (name in bold, the rest on one line). The card slides in from the left with the same clip reveal, and stays clear of the mini-map. The **3D view keeps most of the screen.** Mini-map 96 px wide, top-right under the header, 85% opacity. The stop name (e.g. "The dining hall") shows as a small label top-left. The fallback B render sequence (low tier) uses the same card size, over a full-bleed render. |
| Padel | The model fits the width (orthographic zoom fitted to the viewport width with 8% padding). Stage text sits above the model in 2 lines max. The render reveal uses the same alignment math. |
| Beyond stays | Stacked landscape cards (U01_04 §5). |
| Closing CTA | Stacked buttons. |

## 4. Landscape phones (e.g. 844 × 390)
- Pinned 3D scenes put the text to the left (35% width) and the scene to the right, like desktop but smaller.
- The funnel panel becomes a right sheet at 70% width.
- The hero becomes two columns at reduced scale: photo right at 45% width, content left.

## 5. Verify
Screenshot both pages at **360 × 740, 390 × 844, 414 × 896, 768 × 1024, 844 × 390 (landscape)**, in light and dark, EN and ID (ID at 360 and 390). Include the funnel at Steps 2, 3A, 3B and the thank-you screen, and the Maxone walkthrough at stops S1, S3 and S5. Fix anything cramped, overlapping or clipped, then re-shoot. Also take desktop 1440 × 900 screenshots before and after U7, and compare them to prove desktop didn't change (except for intended U01 changes).

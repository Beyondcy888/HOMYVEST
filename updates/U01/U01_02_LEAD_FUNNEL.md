# U01_02: Lead funnel (hero phone → funding question → form → thank you)

The funnel collects a contact and qualifies it in under a minute. It must feel light and calm, in our black-and-white style. **Don't copy the look of the reference screenshots.** We reuse only their structure: the 3 funding options and the two question sets.

## 1. Flow
```
[Hero] phone ──Continue──▶ [Panel] Step 2: funding question (3 options)
                                   ├─ "Loan from bank / financial institution" ─┐
                                   ├─ "Personal funds" ─────────────────────────┴─▶ Step 3A: Build form
                                   └─ "Currently do not have funds for construction" ─▶ Step 3B: Needs form
                           Step 3 ──Send──▶ saved to Supabase ──▶ Thank you (WhatsApp + next links)
                                        └─ save fails / not configured ──▶ WhatsApp handoff (answers prefilled)
```
- **WhatsApp is always an alternative.** The hero has the free-consultation link. Every panel step has a footer link "Prefer to chat? WhatsApp us" (generic message on step 2, a message prefilled with the answers so far on step 3).
- Steps are numbered for the visitor as **Step 1 of 3** (phone, already done in the hero, shown as a recap), **Step 2 of 3** (funding), **Step 3 of 3** (details).

## 2. Hero phone step
- Input: `type="tel"`, `inputmode="tel"`, `autocomplete="tel-national"`, with a fixed visible `+62` prefix outside the editable text. Accept any of `0812…`, `812…`, `+62812…` (pasted). Normalize with `normalizePhone()` (`reference/leads/leads.ts`). Show a live soft format (`812-3456-7890`) without fighting the caret.
- "Continue" validates. If invalid: an inline error under the field (U01_06 §2), `aria-invalid="true"`, focus stays in the field.
- If valid:
  1. Create `startId = crypto.randomUUID()` and call `recordLeadStart(supabase, { id: startId, phone, lang, source })`. This is fire-and-forget: never block, never show errors.
  2. Open the panel at Step 2.
- Enter submits. The button shows a spinner only while opening (≤ 300 ms, no network wait).

## 3. The panel (container)
- **Desktop:** a right-side sheet, 520 px wide, full height, sliding in (0.45 s `expo.out`) over a dimmed page (`rgba(11,11,10,.45)`).
- **Mobile:** a full-screen sheet sliding up, with a **sticky footer** holding the primary button. Keep the footer above the keyboard using `visualViewport` resize events.
- **Header:** the "HOMYVEST" wordmark (small, static, no hover animation here) · "Powered by" · HomyEight compact logo (16–18 px tall, on-dark variant in dark theme) · close button (×). Under it: the step indicator (a three-segment line plus "Step 2 of 3").
- **Body:** the step content. **Footer:** primary button ("Continue" / "Send"), a "Back" text button (from Step 3), and the WhatsApp alternative link.
- It's a dialog: `role="dialog"`, `aria-modal="true"`, labelled by the step title. Focus trap, Esc closes, focus returns to the hero "Continue" button. While open, the background doesn't scroll (`lenis.stop()`).
- **Persistence:** keep the in-progress funnel in `sessionStorage` (`homyvest:funnel:v1`, try/catch), so closing and reopening, or reloading the page, keeps the answers. Clear it after a successful send.
- **Phone recap** at the top of Steps 2 and 3: "We'll contact you at +62 812-3456-7890 · Change" ("Change" closes the panel and focuses the hero input).
- **Motion between steps:** the content cross-slides horizontally (forward → left, back → right), 0.35 s. With reduced motion, a simple fade.

## 4. Step 2: Funding question
- Title (the question) and helper text, U01_06 §2.
- Three **radio cards** (a native `<input type="radio">` group, visually large rows with a custom circle), labels **exactly**:
  1. Loan from bank / financial institution
  2. Personal funds
  3. Currently do not have funds for construction
  (Indonesian in U01_06.) Selecting one enables "Continue". Double-click or Enter on a card selects and continues.

## 5. Step 3A: Build form (funding = bank loan or personal funds)
Fields, in order (the phone is not asked again):
1. **Name**: text, required, 2–80 characters, `autocomplete="name"`.
2. **What property or land do you own now?**: multi-select chips (`OWNED`): Kost / coliving · Apartment · House · Shophouse (ruko) · Hotel / guesthouse · Vacant land · Unfinished building · Other (reveals a short text input, required when chosen).
3. **What would you like to build?**: multi-select chips (`BUILD`): Kost / coliving · Hybrid stay / guesthouse · Apartment · Rental houses / townhouses · Mixed-use · Café, office or sports venue · Not sure yet, help me decide · Other (+ text).
4. **Where is the property?**: multi-select chips (`CITIES`): Jakarta · Bodetabek · Bandung · Semarang · Yogyakarta · Solo · Surabaya · Malang · Bali · Bandar Lampung · Medan · Other (+ text).
5. Hidden honeypot input (`name="company"`, off-screen, `tabindex="-1"`, `autocomplete="off"`).
6. Consent microcopy above the button (U01_06 §2). Primary button: "Send".

Chips: a 2-column grid on mobile, wrapping rows on desktop, min height 44 px. A selected chip shows solid ink with paper text and a small check. Use checkbox semantics (`role="checkbox"` + `aria-checked`, or real checkboxes visually styled). Each group is a `<fieldset>` with a `<legend>`.

## 6. Step 3B: Needs form (funding = no funds)
1. Intro block (title + short paragraph, U01_06 §2). The reassurance matters.
2. **Which of these fits you best?**: single-select radio cards (`NEEDS`): rent out an apartment or house · help running a boarding house · fill more rooms · a property in a good location, want to know what it could become · something else (+ text, required).
3. **Name** (required).
4. **Where is the property?** (city chips, as in 3A).
5. Honeypot, consent microcopy, "Send".

## 7. Sending
- Build a `LeadForm` and call `submitLead(supabase, form)` from `src/lib/leads/leads.ts`. Include:
  - `startId` from the hero step
  - `lang`, `source: collectSource(location, document.referrer)`, `userAgent: navigator.userAgent`
  - `openedAt` (when the panel opened)
  - `calc: calcSnapshot(...)`, **only if the visitor touched the calculator in this session** (the calc store's `touched` flag)
- The button shows "Sending…" and is disabled. Validation errors appear inline per field (U01_06 §2); focus moves to the first invalid field, and a polite live region announces "Please check the highlighted fields".
- **Results:**
  - `{ ok: true }` → Thank-you screen (§8). Clear the session state.
  - `{ ok:false, reason:'not_configured' }` (no env vars) → the **WhatsApp handoff** screen: "Almost there: send your details on WhatsApp", with the prefilled message from `buildLeadWhatsAppMessage()`. Log `console.warn` once.
  - `{ ok:false, reason:'failed' }` → an error screen offering "Send on WhatsApp" (prefilled) and "Try again".
  - `{ ok:false, reason:'rate_limited' }` → a friendly note with WhatsApp.
  - `{ ok:true, spam:true }` → show the normal thank-you (don't tip off bots).

## 8. Thank-you screen
- A big check mark drawn with a stroke animation (reduced motion: static), then "Thank you, {firstName}…" and the body copy (U01_06 §2).
- Actions: **Chat on WhatsApp now** (primary; prefilled with the summary), **Try the land check** (closes the panel, scrolls to `#calculator`), **See our full portfolio** (`/portofolio/`).
- The hero phone card then shows a small confirmation ("We'll be in touch at …") instead of the input, until reload.

## 9. Implementation
```
src/lib/leads/leads.ts          ← copy reference/leads/leads.ts verbatim
src/lib/leads/leads.test.ts     ← copy reference/leads/leads.test.ts verbatim
src/lib/leads/supabase.ts       ← below
src/components/funnel/HeroPhone.jsx  FunnelPanel.jsx  StepFunding.jsx  StepBuild.jsx  StepNeeds.jsx
                    ThankYou.jsx  Handoff.jsx  Chips.jsx  RadioCards.jsx  useFunnelStore.js (zustand + sessionStorage)
```
`src/lib/leads/supabase.ts`:
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

/** null when not configured: the funnel then hands over to WhatsApp. */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
```
- Lazy-load `@supabase/supabase-js` together with the panel (dynamic import when the hero "Continue" is pressed, or on first focus of the phone input), so it isn't in the initial bundle.
- Never call `.select()` after inserts. The public key has no read permission, by design.
- The labels for chips and radios come from `OPTION_LABELS[lang]` in `leads.ts`. Section titles, helpers and buttons come from i18n (U01_06 §2).

## 10. Accessibility checklist
Labels on every field · fieldset/legend for groups · error text linked with `aria-describedby` · focus management on step change (focus the step heading) · a 44 px minimum for all targets · the dialog pattern · readable at 200% zoom · works with keyboard only.

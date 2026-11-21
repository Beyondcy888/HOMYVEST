# 05 — Calculator ("Land check"): logic, behaviour and visuals

This document is the **source of truth for the calculator's logic**. It preserves the owner's original specification (formulas, defaults, rounding, edge cases, test cases) and adds what HOMYVEST needs around it: framing, entry points, the WhatsApp handoff, implementation and verified reference code.

**You decide:** the visual design, layout, motion, component structure and the look of the 3D, following `03` and `06` §5. Copy comes from `07` §9–12. You may polish wording, but you may not change its meaning.

**You must not change:** formulas, rounding rules, default values, edge-case handling, or the meaning of any output. **Every test in §10 must pass** (they're implemented in §12 and already verified green).

Stack: React + Vite, GSAP for motion, three.js via `@react-three/fiber` + `@react-three/drei` for 3D. The engine is pure TypeScript in `src/lib/calc/`.

---

## 0. Why this calculator exists on the HOMYVEST site
HOMYVEST doesn't sell buildings. The calculator is how an owner **discovers what their idle land or building could become**, and **what to take into account before building and operating a property**. It should leave them believing that their land can be productive, through clear, honest numbers rather than hype, and wanting to take the next step with HOMYVEST, HomyEight and Behomy.

Copy and UX intent at every step:
- **Frame it as a land check, not a math tool.** Lead with the question the visitor has ("What can your land become?").
- **Make every result personal and plain.** "Your land can hold up to 1,200 m² of building", not "floorArea: 1200".
- **Explain every technical term in place**: a plain subtitle under each label, plus the 3D reacting as the value changes, so the visual explains it too.
- **Turn the gross-figures caveat into the bridge.** Running costs and operations are exactly what HomyEight and Behomy handle (copy in `07` §10).
- **End every path with a next step**: WhatsApp with the visitor's results prefilled (§13).

## 1. Product context
- **Who uses it:** landowners in Indonesia who **already own land**, empty or with an idle or unfinished building, and don't know what to do with it. It's a public website, **not** an internal tool, and **not** for land buyers.
- **Main question it answers:** "What am I allowed to build on my land, and which use of it earns the most?"
- **Languages:** English (default) and Bahasa Indonesia, using the site-wide toggle. All UI text, labels, units, number formats and disclaimers exist in both.
- **Origin of the math:** steps 1 and 3 come from an architecture site-analysis template (KDB/KLB/KDH zoning checks), turned around to answer an owner's question. Step 2 (income comparison) is HOMYVEST's own addition.
- **No land price input.** The owner already has the land. Don't add "price per m² of land" or "price per buildable m²".

## 2. User flow (three steps, one shared land)

| Step | Name (EN / ID) | Question it answers |
|---|---|---|
| 1 | Your land / Lahan Anda | How much am I allowed to build? |
| 2 | Ideas for your land / Ide untuk lahan Anda | Kos-kosan, ruko, rental houses or warehouse: what fits, what it costs, what it earns |
| 3 | Already built? Add a floor / Sudah ada bangunan? Tambah lantai | Does my existing (finished or unfinished) building follow the rules, and can I add a floor? |

**The land is entered once (step 1) and reused by steps 2 and 3.** Steps 2 and 3 show a short summary of the land in use, with a way to go back and change it. All results update **live as the user types. There is no "Calculate" button.**

### Entry points
Update U01 removed the two "doors" and, with them, door-based entry: there is no `entry` state, no door-B note and no "Check my building" variant.
- **Header "Land check" link** (`/#calculator`, from either page) → scroll to `#calculator` with **Step 1** active. A link to `/#calculator` from elsewhere (the story's "See what your land can do" on `/portofolio/`) lands the same way.
- **Step 1's primary button is always "Next: see what this space could earn"** (→ Step 2). A secondary link, "Already built? See if a floor fits", goes to Step 3.
- **"Try the land check"** on the funnel's thank-you screen closes the panel and scrolls to `#calculator`, keeping whatever step is open.
- Restored state from `localStorage` (§4) → open the step the visitor was last on.

## 3. Glossary (use these terms in both languages)

| Term | Meaning (plain English) | Notes |
|---|---|---|
| **KDB**: Koefisien Dasar Bangunan | Max % of the land the building may cover (building coverage ratio) | Input as % |
| **KLB**: Koefisien Lantai Bangunan | Max total floor area of all floors ÷ land area (floor area ratio) | Input as a multiplier, e.g. 2.0 |
| **KDH**: Koefisien Daerah Hijau | Min % of land that must stay green / open soil | Input as % |
| **KRK / PKKPR** | Official local-government documents that state the KDB/KLB/KDH for a specific plot | Tell users where to find their real limits |
| **PBG**: Persetujuan Bangunan Gedung | Building permit | Mention in disclaimer |
| **Pemda** | Local government | |
| **Kos-kosan** | Boarding house with rentable rooms | Keep the Indonesian word in both languages |
| **Ruko**: rumah toko | Shophouse (shop below, space above), rented per unit | Keep "Ruko" in both languages |
| **Rumah sewa** | Rental houses | EN: "Rental houses" |
| **Gudang** | Warehouse | EN: "Warehouse" |

Land is always treated as a **rectangle**: *front width* (the side facing the road) × *depth* (front to back).

Every term gets a plain subtitle in the UI (`07` §9). On hover or focus of a KDB/KLB/KDH field, the 3D highlights what that rule controls (KDB: the footprint outline pulses; KLB: the floor stack; KDH: the green zone).

## 4. State model
One state object, persisted to `localStorage` under the key **`homyvest:calc:v1`**. Wrap reads and writes in try/catch. If storage is empty, broken or fails validation, fall back to defaults. Use a small zustand store (`src/lib/calc/store.ts`) with a custom storage adapter that swallows errors. The language lives in the site-wide i18n store, not here, but the calculator reads it.

```ts
type State = {
  land: {
    P: number;          // front width (m), side facing the road
    L: number;          // depth (m)
    kdb: number;        // %  (0–100)
    klb: number;        // ×  (≥ 0)
    kdh: number;        // %  (0–100)
    maxFloors: number | ""; // optional height limit in floors; "" or 0 = no limit
  };
  ideas: {
    occ: number;        // expected occupancy %, applies to all ideas
    kos:    { size: number; rent: number; cost: number };
    ruko:   { width: number; rent: number; cost: number };
    rumah:  { land: number; floor: number; rent: number; cost: number };
    gudang: { rent: number; cost: number };
  };
  check: {
    fp: number;         // existing building footprint (m²)
    tfa: number;        // existing total floor area, all floors (m²)
    green: number;      // existing green area (m²)
  };
  // UI-only (persisted): which step was open, which idea is selected in step 2, whether step 3 was used
  ui: { step: 1 | 2 | 3; selectedIdea: "kos" | "ruko" | "rumah" | "gudang" | null; usedStep3: boolean };
};
```

### Defaults
```ts
const DEFAULTS = {
  land:  { P: 30, L: 20, kdb: 60, klb: 2, kdh: 20, maxFloors: "" },
  ideas: {
    occ: 85,
    kos:    { size: 18,  rent: 1_200_000,  cost: 4_500_000 },
    ruko:   { width: 4.5, rent: 70_000_000, cost: 5_000_000 },
    rumah:  { land: 100, floor: 70, rent: 2_500_000, cost: 4_500_000 },
    gudang: { rent: 50_000, cost: 3_500_000 },
  },
  check: { fp: 240, tfa: 480, green: 150 },
  ui: { step: 1, selectedIdea: null, usedStep3: false },
};
```
Provide a **"Reset to example values"** text button in the calculator footer.

### Meaning and units of each idea parameter

| Idea | Param | Meaning | Unit |
|---|---|---|---|
| kos | `size` | Gross floor area per room, incl. bathroom and share of corridor/stairs | m² |
| kos | `rent` | Rent per room **per month** | Rp |
| ruko | `width` | Frontage width of one ruko unit | m |
| ruko | `rent` | Rent per unit **per year** | Rp |
| rumah | `land` | Land needed per house (incl. its yard) | m² |
| rumah | `floor` | Floor area per house | m² |
| rumah | `rent` | Rent per house **per month** | Rp |
| gudang | `rent` | Rent per m² **per month** | Rp |
| all | `cost` | Construction cost per m² of floor built | Rp |

All rents and costs are **examples**. The UI must say clearly that users should replace them with local prices. Show an "Example" tag beside each until the user edits it.

### Zoning presets ("Don't know yet? Try an example")
Selecting a preset overwrites only `kdb`, `klb`, `kdh` in `land`. Label them as examples, not official values.

| id | EN label | ID label | KDB | KLB | KDH |
|---|---|---|---|---|---|
| template | Typical example | Contoh umum | 60 | 2.0 | 20 |
| resid | Quiet housing area | Kawasan perumahan tenang | 50 | 1.2 | 30 |
| comm | Busy commercial road | Jalan komersial ramai | 70 | 4.0 | 10 |

### Input handling
- Money inputs: text fields with `inputmode="numeric"`. Strip non-digits, store as a number, and re-display with thousand separators (in the active locale) while typing. Keep the caret in a sensible place when separators are inserted.
- Numeric inputs: `inputmode="decimal"`. Accept both `,` and `.` as the decimal separator in ID and EN. Empty → treat as 0 in calculations (but keep the field visually empty). Negative values → treat as 0.
- Clamp `kdb`, `kdh`, `occ` to 0–100 in calculations.
- Each field: `<label>` + help text linked with `aria-describedby`. The results region is `aria-live="polite"`, debounced 400 ms so screen readers aren't flooded while typing.

---

## 5. Step 1: Land potential (core math)

Constants: `EPS = 1e-9`, `CAR_BAY = 12.5` (m², 2.5 × 5 m), `DRIVEWAY_SHARE = 0.5`.

```ts
function potential(land) {
  const { P, L, kdb, klb, kdh } = land;            // numbers, empties = 0
  const maxF = Number(land.maxFloors) || 0;
  const A = P * L;                                  // land area
  if (!(A > 0)) return null;                        // → empty state

  const greenMin = A * kdh / 100;                   // must stay green
  const conflict = kdb + kdh > 100;                 // rules overlap
  const fp = Math.max(0, Math.min(A * kdb / 100, A - greenMin)); // max footprint

  let floorArea = A * klb;                          // max total floor area
  let capped = false;
  if (maxF > 0 && maxF * fp < floorArea) { floorArea = maxF * fp; capped = true; }

  const full = fp > 0 ? Math.floor(floorArea / fp + EPS) : 0;  // full floors
  let partial = Math.max(0, floorArea - full * fp);            // smaller top floor
  if (partial < 0.5) partial = 0;

  const open = Math.max(0, A - fp - greenMin);      // driveway / parking / service
  const cars = Math.floor(open * DRIVEWAY_SHARE / CAR_BAY);

  return { P, L, A, kdb, klb, kdh, fp, greenMin, conflict,
           floorArea, capped, full, partial, open, cars };
}
```

### Outputs to show

| Output | Value | Notes |
|---|---|---|
| **Headline: "Your land can hold up to … of building"** | `floorArea` m² | The single most important number. Make it huge (`--t-stat`), and let it roll smoothly to new values as inputs change. |
| Floors | see "floors text" below | |
| Building may cover | `fp` m², and `fp / A × 100` % of land | |
| Land area | `A` m² | |
| Must stay green | `greenMin` m² | |
| Room for parking | "About `cars` cars" (or "Very tight" if 0), plus `open` m² | Label as rough |
| Land split bar | building `fp/A`, green `greenMin/A`, open = remainder (≥ 0) | Three segments that add up to 100%, using the same zone styling as the 3D (`03` §3) |

**Floors text** (EN/ID wording in `07` §9):
- `floorArea <= 0` → "None allowed"
- `full === 0` → "1 floor of {partial} m²" (happens when KLB < KDB)
- otherwise → "{full} floor(s)" + (`partial > 0` ? " + a smaller one (top floor {partial} m²)" : "")
- If `capped`, mention that it's limited by the max-floors rule.

### Warnings

| Condition | Message meaning |
|---|---|
| `conflict` | KDB + KDH > 100%, so the footprint was reduced to `fp` to leave room for green. Ask the user to double-check their rules. |
| `klb > 0 && kdb > 0 && klb < kdb/100` | KLB is lower than KDB, so even one floor can't use the full footprint. `floorArea` is the limit that counts. |
| `A` not > 0 | Empty state: prompt to enter width and depth. |

Provide a **"How this is calculated"** disclosure listing the formulas in plain language, in both languages (`07` §11).

**Bridge line** under the results (new): "Next: see what this space could earn →" (button to Step 2).

---

## 6. Step 2: Ideas for your land
Uses `r = potential(state.land)` and `occ = state.ideas.occ / 100`.

```ts
function ideas(r, I, occ) {
  // KOS-KOSAN
  const kosUnits  = I.kos.size > 0 ? Math.floor(r.floorArea / I.kos.size) : 0;
  const kosBuilt  = kosUnits * I.kos.size;
  const kosIncome = kosUnits * I.kos.rent * 12 * occ;

  // RUKO: units side by side along the front width; all allowed floor area is shared
  const rukoUnits  = I.ruko.width > 0 ? Math.floor(r.P / I.ruko.width + EPS) : 0;
  const rukoBuilt  = rukoUnits ? r.floorArea : 0;
  const rukoPerUnit = rukoUnits ? r.floorArea / rukoUnits : 0;
  const rukoIncome = rukoUnits * I.ruko.rent * occ;          // rent is already yearly

  // RENTAL HOUSES: limited by land per house AND by allowed floor area
  const rumahUnits = (I.rumah.land > 0 && I.rumah.floor > 0)
    ? Math.min(Math.floor(r.A / I.rumah.land), Math.floor(r.floorArea / I.rumah.floor)) : 0;
  const rumahBuilt  = rumahUnits * I.rumah.floor;
  const rumahIncome = rumahUnits * I.rumah.rent * 12 * occ;

  // WAREHOUSE: one floor, as large as allowed
  const gudangBuilt  = Math.min(r.fp, r.floorArea);
  const gudangIncome = gudangBuilt * I.gudang.rent * 12 * occ;

  // For every idea:
  // cost    = built × idea.cost
  // payback = (income > 0 && cost > 0) ? cost / income : null      (years)
  // yield   = (income > 0 && cost > 0) ? income / cost × 100 : null (%)
}
```

### Outputs per idea (shown side by side, one column or card per idea)

| Row | Kos-kosan | Ruko | Rental houses | Warehouse |
|---|---|---|---|---|
| What fits | "{units} rooms" | "{units} units, {perUnit} m² each" | "{units} houses" | "{built} m², one floor" |
| Floor area to build | built | built | built | built |
| Build cost (approx.) | cost | cost | cost | cost |
| Rent per year (approx.) | income | income | income | income |
| Yearly return on build cost | yield % | | | |
| **Pays back the build cost in** | payback years | | | |
| Good to know (short tip) | Many tenants → many motorbikes, plan parking | Best on a busy road | Lower income, steady, easy to manage | Needs truck access and a wide road; one floor |

- If units = 0 (or warehouse built = 0) → "Doesn't fit", and "–" for the other rows.
- **Badge "Fastest"** on the idea with the lowest `payback` (only among ideas with a valid payback).
- Show the land summary above, with an occupancy input (%) that applies to all ideas.
- Each idea is **selectable** (radio-card semantics). Selecting one shows it in the 3D and sets `ui.selectedIdea`, which the WhatsApp message uses. On first arrival, pre-select the "Fastest" idea.
- Each idea's rent and cost inputs sit inside its card behind an "Adjust prices" disclosure, so the comparison stays readable. Occupancy stays visible above all cards.
- On mobile, ideas become a horizontal snap carousel of cards with a 4-dot indicator, or a stacked list. Choose whichever keeps comparison easiest, and log the choice.

### Summary sentence logic
1. No land → ask the user to fill in step 1.
2. No idea has a valid payback → ask the user to add rents and costs.
3. Otherwise: "{best} pays back fastest: about {payback} years for {cost} of building, earning around {income} a year."
4. If a second-best exists: "Next is {second} at {payback} years."
5. If the cheapest-to-build idea (lowest `cost` among valid) is not the fastest: "If you have less to invest, {cheapest} costs the least to build ({cost}) and pays back in about {payback} years."

Use **short money** (§8) in the summary sentence and full money in the cards' detail rows.

### Important caveat to show
Payback and yield are **gross**: they leave out running costs, tax, permits (PBG), financing, vacancy beyond the occupancy %, and the value of the land itself. Present this as the bridge to HOMYVEST's partners (`07` §10), directly under the summary, not hidden in a footnote.

### Hybrid note (new, copy only, no new math)
Under the cards, one line (`07` §10): these examples use plain monthly kost rent, and Behomy's hybrid model mixes daily and monthly guests, so "ask us what that could mean for your land." **Don't** compute or display any hybrid figures.

---

## 7. Step 3: Already built? Add a floor
Uses the land and limits from step 1 plus `state.check`. Works for finished and unfinished buildings (copy makes that clear).

```ts
const A = P * L;                                  // if !(A > 0) → ask to fill step 1
const vKdb = fp / A * 100;        const okKdb = vKdb <= kdb + EPS;
const vKlb = tfa / A;             const okKlb = vKlb <= klb + EPS;
const vKdh = green / A * 100;     const okKdh = vKdh >= kdh - EPS;

const fpRoom     = A * kdb / 100 - fp;     // footprint still allowed (negative = over)
const faRoom     = A * klb - tfa;          // floor area still allowed (negative = over)
const greenShort = Math.max(0, A * kdh / 100 - green);
const leftover   = A - fp - green;         // land for driveway/parking/service
```

### Main answer ("Can I add a floor?")
A new floor is assumed to be the same size as the current footprint `fp`.
1. Any of `okKdb`, `okKlb`, `okKdh` false → "Not yet. The building already breaks a rule; fix that first."
2. `fp <= 0` → ask for the footprint.
3. `extra = Math.floor(faRoom / fp + EPS)`
   - `extra > 1` → "Yes. You could add up to {extra} more floors of {fp} m²."
   - `extra === 1` → "Yes. One more floor of {fp} m² fits."
   - `faRoom > 0` → "Only a smaller one: {faRoom} m² left, less than a full {fp} m² floor."
   - else → "No. You've used all the floor area the rules allow."

### Three gauges (KDB, KLB, KDH)
Each gauge shows: current value, status pill, a bar, a marker at the limit, and one explanatory line.
- Bar scale max = `max(limit × 1.5, value × 1.1)`.
- KDB / KLB are OK when ≤ limit. Show the room left (`fpRoom`, `faRoom`) or the amount over.
- KDH is OK when ≥ limit. Show `greenShort` if not OK.
- Over-limit styling: ink with a diagonal hatch and a warning icon (no red, per `03` §3).

### Note
- If `leftover < 0` → warn that building + green exceeds the land area.
- Otherwise show "{leftover} m² ({leftover/A}%) left for driveway, parking and service".

Set `ui.usedStep3 = true` the first time the visitor edits any Step 3 field.

---

## 8. Number formatting (both languages)

| Kind | Rule |
|---|---|
| Area | Round to integer, thousand separators, suffix " m²" |
| Percent | 1 decimal max |
| KLB | 2 decimals max, suffix "×" |
| Years | 1 decimal |
| Money, full | "Rp " + integer with separators |
| Money, short | ≥ 1e12 → trillions; ≥ 1e9 → billions (2 decimals); ≥ 1e6 → millions (0 decimals); else full |

Use the active language's locale for separators: **ID** → `id-ID` (Rp 1.200.000, 6,6 tahun); **EN** → `en-US` (Rp 1,200,000, 6.6 years).

**Short-money pitfall:** the abbreviations differ by language. Never mix them.

| Value | ID | EN |
|---|---|---|
| 808,000,000 | Rp 808 jt | Rp 808 M (million) |
| 5,346,000,000 | Rp 5,35 M (miliar) | Rp 5.35 B |
| 1.2e12 | Rp 1,2 T (triliun) | Rp 1.2 T |

In Indonesian, "M" means *miliar* (billion). In English, "M" means million. Getting this wrong makes values look 1,000× off. In the UI, give the short form an accessible full expansion (`<abbr title="Rp 5.346.000.000">`) and render the unit word in full for screen readers ("miliar", "billion").

---

## 9. 3D visualization (requirements)
The 2D prototype showed a top-down plan and a floor-stack diagram. Replace both with **an interactive 3D scene that updates live from the calculations**. The 3D must be truthful: every visible area and floor count must come from the numbers in §5–7, not be decorative. Look, materials and implementation are in `06` §5, using the same clay language as the hero.

### 9.1 Scenes required

| Where | Model |
|---|---|
| Step 1 | **Max allowed building** on the land |
| Step 2 | One model **per idea** (kos, ruko, rental houses, warehouse). The selected idea is shown. The "Fastest" idea is pre-selected. |
| Step 3 | Existing building (solid) + allowed extra floors as a ghost/outline on top |

Switching ideas or changing inputs animates (GSAP): floors rise, units appear. Respect `prefers-reduced-motion` (no animation, just update).

### 9.2 Shared scene elements (all models)
- **Land plate:** `P` (x-axis, along the road) × `L` (z-axis, depth). Show the boundary clearly.
- **Road** strip along the front edge (the `P` side), outside the land.
- **Zones on the plate, to scale:** building footprint, green area (`greenMin`), open area for driveway/parking/service (`open`).
- **Labels / dimension lines:** front width, depth, building height or floor count, key areas. They must stay readable while orbiting (HTML labels via drei `<Html>` or billboarded text, with a solid paper background).
- **Camera:** orbit / rotate / zoom with sensible limits. Auto-frame the whole land whenever its size changes. Include a reset-view control.
- The same styling for "building", "green" and "open" in 3D, in the land split bar, and in legends.

### 9.3 Default zone layout (exact areas, no overlap)
Use this front-to-back band layout unless you find a better layout that keeps every area exact:
```
road
──────────────────────────  z = 0 (front)
 open band     depth dFront = open / P        → driveway / parking / service
 building band depth dMid   = L − dFront − dBack
 green band    depth dBack  = greenMin / P
──────────────────────────  z = L (back)
```
Because `fp + greenMin + open = A`, the building band holds exactly `fp` when the building spans the full width. If the model's actual footprint is smaller than `fp` (e.g. KLB < KDB, ruko units not filling the width, warehouse smaller), center it in the building band and treat the unused part of the band as open area.

Default example: `dFront = 4 m`, `dMid = 12 m`, `dBack = 4 m`, building 30 × 12 m = 360 m².

### 9.4 Visual-only constants (floor heights)

| Model | Floor-to-floor height |
|---|---|
| Max building / kos | 3.2 m |
| Ruko | 4.0 m ground floor, 3.5 m upper floors |
| Rental house | 3.0 m, pitched roof |
| Warehouse | one floor, ~7 m high, low-pitched roof |

These affect only the visuals, never the calculations.

### 9.5 Model geometry
**Max building (step 1)**
- Footprint `fpUsed = min(fp, floorArea)` (when KLB < KDB, the single floor is smaller).
- Stack `full` floors of `fpUsed`, plus a top floor of `partial` m² if > 0. Draw the partial floor shallower (same width, depth scaled by `partial / fpUsed`) or visually distinct.
- If `floorArea <= 0`, show the empty land with a message.

**Kos-kosan**
- Same footprint as the max building. Total area = `kosBuilt` (rooms × size).
- Floors = `kosBuilt / fp`: full floors + partial top floor, as above.
- Facade hint: a window grid suggesting about `kosUnits / floors` rooms per floor.

**Ruko**
- `rukoUnits` units side by side along the front, each `width` wide. Total row width = `units × width`; center it if narrower than `P`.
- Unit depth = `min(dMid, fp / (units × width))`.
- Unit footprint = `width × unitDepth`. Floors per unit = `rukoPerUnit / unitFootprint` (full floors + partial top).
- Show the shop-front glazing on the ground floor and small gaps or lines between units so each unit is countable.

**Rental houses**
- Split the land into `rumahUnits` equal parcels of about `I.rumah.land` m² each, arranged in rows along the frontage, as close to square as practical.
- Floors per house = `ceil(floor / (fp / units))`. House footprint = `floor / floorsPerHouse`. Place one house centered on each parcel, with a pitched roof.
- With defaults: 6 parcels of 100 m², houses of 35 m² footprint × 2 floors.
- Green/open zones may be shown as yard area inside each parcel instead of bands, as long as the totals stay true.

**Warehouse**
- One box of `gudangBuilt` m² in the building band, ~7 m high, low-pitched roof.
- Mark a loading apron in the front open band.

**Step 3 (existing + addable)**
- Existing building: footprint `fp`, height = `tfa / fp` floors (full + partial).
- Ghost floors on top for `extra` (from §7), clearly translucent or outlined.
- If a rule is broken, highlight the problem (e.g. the over-limit part in the hatch pattern).

### 9.6 Robustness
- Procedural geometry only (boxes, simple roofs). No external 3D model files needed.
- Must run smoothly on mid-range phones. Cap draw calls: for many rooms or floors, use instancing or merged geometry.
- Cap visible floors at about 40. Beyond that, show a label like "Showing 40 of 55 floors".
- If WebGL is unavailable, fall back to a 2D plan + floor stack (SVG) and a text summary.
- Give the canvas an accessible text alternative that states the key numbers.
- Unit test the geometry helpers (`06` §5.4): band depths, ruko depth and floors, house parcels, against the "Geometry check" in §10.

---

## 10. Test cases (must match exactly)

### Step 1, defaults (30 × 20 m, KDB 60, KLB 2, KDH 20, no floor cap)

| Output | Expected |
|---|---|
| A | 600 m² |
| fp | 360 m² (60%) |
| greenMin | 120 m² |
| floorArea | 1,200 m² |
| full / partial | 3 / 120 m² → "3 floors + a smaller one" |
| open | 120 m² |
| cars | 4 |
| split bar | 60% / 20% / 20% |

### Step 1, variations

| Change | Expected |
|---|---|
| maxFloors = 2 | floorArea 720 m², capped = true, 2 floors, partial 0 |
| KDB 70, KDH 40 | conflict = true, fp = 360 (not 420), open 0, cars 0 |
| KDB 60, KLB 0.5 | floorArea 300, full 0, partial 300 → "1 floor of 300 m²", KLB < KDB warning |
| P or L = 0 | empty state |

### Step 2, defaults (occupancy 85%)

| Idea | What fits | Built | Cost | Rent/year | Yield | Payback |
|---|---|---|---|---|---|---|
| Kos-kosan | 66 rooms | 1,188 m² | Rp 5,346,000,000 | Rp 807,840,000 | ≈ 15.1% | ≈ 6.6 yrs **(Fastest)** |
| Ruko | 6 units, 200 m² each | 1,200 m² | Rp 6,000,000,000 | Rp 357,000,000 | ≈ 5.95% | ≈ 16.8 yrs |
| Rental houses | 6 houses | 420 m² | Rp 1,890,000,000 | Rp 153,000,000 | ≈ 8.1% | ≈ 12.4 yrs |
| Warehouse | 360 m², one floor | 360 m² | Rp 1,260,000,000 | Rp 183,600,000 | ≈ 14.6% | ≈ 6.9 yrs |

Summary: Kos-kosan fastest; next Warehouse; the "less to invest" line names Warehouse (cheapest to build).

> **Clarification (no formula change):** the ruko yield is mathematically 5.95% but is stored as 5.9499…% in floating point, so with the "1 decimal max" rule (§8) it **displays as "5.9%"**. The tests check the raw value ≈ 5.95 and the displayed string "5.9%". Don't "fix" this by changing rounding.

### Step 3, defaults (fp 240, tfa 480, green 150 on the default land)

| Output | Expected |
|---|---|
| KDB | 40% → OK, can still spread 120 m² |
| KLB | 0.8× → OK, 720 m² floor area left |
| KDH | 25% → OK |
| Answer | "Yes. You could add up to 3 more floors of 240 m²." |
| Leftover | 210 m² (35%) for driveway, parking, service |

### Geometry check (defaults)
Bands: dFront 4 m, dMid 12 m, dBack 4 m. Ruko: 6 units × 4.5 m = 27 m row, unit depth 12 m, 54 m² per floor, 200 m² per unit → 3 full floors + a partial 4th. Rental houses: 6 houses, 35 m² footprint, 2 floors each.

### UI checks (Playwright, `10` §2)
With default inputs, in EN the page shows: "1,200 m²", "66 rooms", "6 units, 200 m² each", "Rp 5.35 B" (summary), "6.6 years", "Fastest" on Kos-kosan, and the Step 3 answer with "3 more floors". In ID: "1.200 m²", "66 kamar", "Rp 5,35 M", "6,6 tahun".

---

## 11. Must-haves and must-not-dos
**Must**
- Live updates, no submit button. All three steps share one land.
- Both languages, including units, number formats, short-money abbreviations, tips and disclaimers.
- Clearly mark example values (presets, rents, costs) as examples to replace.
- A "How this is calculated" explainer per step.
- Disclaimer (both languages, `07` §15): example rules, rents and costs are illustrations; real KDB/KLB/KDH and height limits come from the local government (KRK/PKKPR); income figures are rough gross estimates; confirm with the local government, a licensed planner and local agents before deciding.
- Responsive down to small phones, keyboard accessible, visible focus, light and dark mode.
- A WhatsApp CTA after results (§13).

**Must not**
- Add a land price or "price per buildable m²" (wrong audience).
- Present results as legal or official approval, or as a promise of income.
- Let the 3D show areas or floor counts that don't match the calculated numbers.
- Change formulas, defaults or rounding.
- Compute anything for the hybrid model.

---

## 12. Implementation and verified reference code
Place the engine in `src/lib/calc/`:
```
src/lib/calc/
  calc.ts          ← engine + formatters (copy reference/calc.ts verbatim)
  whatsapp.ts      ← message + link builder (copy reference/whatsapp.ts verbatim)
  calc.test.ts     ← Vitest suite (copy reference/calc.test.ts verbatim)
  geometry.ts      ← 3D layout helpers (you write; see 06 §5.4)
  geometry.test.ts ← tests for the geometry check in §10 (you write)
  store.ts         ← zustand store + safe localStorage adapter (you write)
```
The reference code below has been run against all the cases above: **24/24 tests pass**. It's also shipped in `reference/`. If those files are missing, create them from these blocks exactly.

UI components must **only** call these functions and formatters. Never re-implement math in a component.

### `src/lib/calc/calc.ts`
```ts
export const EPS = 1e-9;
export const CAR_BAY = 12.5;
export const DRIVEWAY_SHARE = 0.5;

export type Lang = 'en' | 'id';
export type Land = { P: number; L: number; kdb: number; klb: number; kdh: number; maxFloors: number | '' };
export type Ideas = {
  occ: number;
  kos: { size: number; rent: number; cost: number };
  ruko: { width: number; rent: number; cost: number };
  rumah: { land: number; floor: number; rent: number; cost: number };
  gudang: { rent: number; cost: number };
};
export type Check = { fp: number; tfa: number; green: number };

const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) && x > 0 ? x : 0; }; // empty/negative -> 0
const pct = (v: unknown) => Math.min(100, n(v));                                                    // clamp 0..100

export type Potential = {
  P: number; L: number; A: number; kdb: number; klb: number; kdh: number;
  fp: number; greenMin: number; conflict: boolean; floorArea: number; capped: boolean;
  full: number; partial: number; open: number; cars: number;
};

export function potential(land: Land): Potential | null {
  const P = n(land.P), L = n(land.L), kdb = pct(land.kdb), klb = n(land.klb), kdh = pct(land.kdh);
  const maxF = n(land.maxFloors);
  const A = P * L;
  if (!(A > 0)) return null;
  const greenMin = A * kdh / 100;
  const conflict = kdb + kdh > 100;
  const fp = Math.max(0, Math.min(A * kdb / 100, A - greenMin));
  let floorArea = A * klb; let capped = false;
  if (maxF > 0 && maxF * fp < floorArea) { floorArea = maxF * fp; capped = true; }
  const full = fp > 0 ? Math.floor(floorArea / fp + EPS) : 0;
  let partial = Math.max(0, floorArea - full * fp);
  if (partial < 0.5) partial = 0;
  const open = Math.max(0, A - fp - greenMin);
  const cars = Math.floor(open * DRIVEWAY_SHARE / CAR_BAY);
  return { P, L, A, kdb, klb, kdh, fp, greenMin, conflict, floorArea, capped, full, partial, open, cars };
}

export type IdeaKey = 'kos' | 'ruko' | 'rumah' | 'gudang';
export type IdeaResult = {
  key: IdeaKey; units: number; built: number; perUnit?: number; fits: boolean;
  cost: number; income: number; payback: number | null; yieldPct: number | null;
};

export function ideas(r: Potential, I: Ideas): Record<IdeaKey, IdeaResult> {
  const occ = pct(I.occ) / 100;
  const finish = (key: IdeaKey, units: number, built: number, income: number, costPerM2: number, extra: Partial<IdeaResult> = {}): IdeaResult => {
    const fits = key === 'gudang' ? built > 0 : units > 0;
    const cost = built * n(costPerM2);
    const ok = fits && income > 0 && cost > 0;
    return { key, units, built, fits, cost, income, payback: ok ? cost / income : null, yieldPct: ok ? income / cost * 100 : null, ...extra };
  };
  const kosSize = n(I.kos.size);
  const kosUnits = kosSize > 0 ? Math.floor(r.floorArea / kosSize) : 0;
  const kos = finish('kos', kosUnits, kosUnits * kosSize, kosUnits * n(I.kos.rent) * 12 * occ, I.kos.cost);

  const rw = n(I.ruko.width);
  const rukoUnits = rw > 0 ? Math.floor(r.P / rw + EPS) : 0;
  const ruko = finish('ruko', rukoUnits, rukoUnits ? r.floorArea : 0, rukoUnits * n(I.ruko.rent) * occ, I.ruko.cost,
    { perUnit: rukoUnits ? r.floorArea / rukoUnits : 0 });

  const hl = n(I.rumah.land), hf = n(I.rumah.floor);
  const rumahUnits = hl > 0 && hf > 0 ? Math.min(Math.floor(r.A / hl), Math.floor(r.floorArea / hf)) : 0;
  const rumah = finish('rumah', rumahUnits, rumahUnits * hf, rumahUnits * n(I.rumah.rent) * 12 * occ, I.rumah.cost);

  const gBuilt = Math.min(r.fp, r.floorArea);
  const gudang = finish('gudang', gBuilt > 0 ? 1 : 0, gBuilt, gBuilt * n(I.gudang.rent) * 12 * occ, I.gudang.cost);
  return { kos, ruko, rumah, gudang };
}

export function rank(res: Record<IdeaKey, IdeaResult>) {
  const valid = Object.values(res).filter(x => x.payback !== null).sort((a, b) => a.payback! - b.payback!);
  const fastest = valid[0] ?? null;
  const second = valid[1] ?? null;
  const cheapest = valid.length ? [...valid].sort((a, b) => a.cost - b.cost)[0] : null;
  return { valid, fastest, second, cheapest: cheapest && fastest && cheapest.key !== fastest.key ? cheapest : null };
}

export function check(land: Land, c: Check) {
  const P = n(land.P), L = n(land.L), kdb = pct(land.kdb), klb = n(land.klb), kdh = pct(land.kdh);
  const A = P * L; if (!(A > 0)) return null;
  const fp = n(c.fp), tfa = n(c.tfa), green = n(c.green);
  const vKdb = fp / A * 100, vKlb = tfa / A, vKdh = green / A * 100;
  const okKdb = vKdb <= kdb + EPS, okKlb = vKlb <= klb + EPS, okKdh = vKdh >= kdh - EPS;
  const fpRoom = A * kdb / 100 - fp, faRoom = A * klb - tfa;
  const greenShort = Math.max(0, A * kdh / 100 - green);
  const leftover = A - fp - green;
  let answer: { kind: 'broken' | 'needFootprint' | 'many' | 'one' | 'smaller' | 'none'; extra: number };
  if (!okKdb || !okKlb || !okKdh) answer = { kind: 'broken', extra: 0 };
  else if (fp <= 0) answer = { kind: 'needFootprint', extra: 0 };
  else {
    const extra = Math.floor(faRoom / fp + EPS);
    answer = extra > 1 ? { kind: 'many', extra } : extra === 1 ? { kind: 'one', extra } : faRoom > 0 ? { kind: 'smaller', extra: 0 } : { kind: 'none', extra: 0 };
  }
  return { A, fp, tfa, green, vKdb, vKlb, vKdh, okKdb, okKlb, okKdh, fpRoom, faRoom, greenShort, leftover, answer };
}

// ---------- formatting ----------
const loc = (lang: Lang) => (lang === 'id' ? 'id-ID' : 'en-US');
export const fmtArea = (v: number, lang: Lang) => `${Math.round(v).toLocaleString(loc(lang))} m²`;
export const fmtPct = (v: number, lang: Lang) => `${v.toLocaleString(loc(lang), { maximumFractionDigits: 1 })}%`;
export const fmtKlb = (v: number, lang: Lang) => `${v.toLocaleString(loc(lang), { maximumFractionDigits: 2 })}×`;
export const fmtYears = (v: number, lang: Lang) =>
  `${v.toLocaleString(loc(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${lang === 'id' ? 'tahun' : 'years'}`;
export const fmtMoney = (v: number, lang: Lang) => `Rp ${Math.round(v).toLocaleString(loc(lang))}`;
export function fmtMoneyShort(v: number, lang: Lang) {
  const f = (x: number, d: number) => x.toLocaleString(loc(lang), { maximumFractionDigits: d });
  if (v >= 1e12) return `Rp ${f(v / 1e12, 2)} T`;
  if (v >= 1e9) return `Rp ${f(v / 1e9, 2)} ${lang === 'id' ? 'M' : 'B'}`;
  if (v >= 1e6) return `Rp ${f(v / 1e6, 0)} ${lang === 'id' ? 'jt' : 'M'}`;
  return fmtMoney(v, lang);
}
```

### `src/lib/calc/whatsapp.ts`
```ts
// Builds the prefilled WhatsApp link. Wording lives in docs/07 §12; keep these templates in sync.
import { potential, ideas, rank, check, fmtArea, fmtKlb, fmtYears, type Land, type Ideas, type Check, type Lang, type IdeaKey } from './calc.ts';

export const WHATSAPP_NUMBER = '6282110106088';

const IDEA_NAMES: Record<Lang, Record<IdeaKey, string>> = {
  en: { kos: 'Kos-kosan', ruko: 'Ruko', rumah: 'Rental houses', gudang: 'Warehouse' },
  id: { kos: 'Kos-kosan', ruko: 'Ruko', rumah: 'Rumah sewa', gudang: 'Gudang' },
};

export type Share = { lang: Lang; land: Land; ideas: Ideas; check: Check; selectedIdea?: IdeaKey | null; usedStep3?: boolean };

export function buildWhatsAppMessage(s: Share): string {
  const { lang } = s;
  const r = potential(s.land);
  if (!r) {
    return lang === 'id'
      ? 'Halo HOMYVEST! Saya punya lahan/bangunan yang belum produktif dan ingin tahu bisa dijadikan apa. Bisa kita ngobrol?'
      : "Hi HOMYVEST! I have land or a building that isn't earning yet, and I'd like to know what it could become. Can we talk?";
  }
  const lines: string[] = [];
  const maxF = Number(s.land.maxFloors) || 0;
  const rules = `KDB ${r.kdb}%, KLB ${fmtKlb(r.klb, lang)}, KDH ${r.kdh}%` + (maxF > 0 ? (lang === 'id' ? `, maks. ${maxF} lantai` : `, max ${maxF} floors`) : '');
  if (lang === 'id') {
    lines.push('Halo HOMYVEST! Saya sudah mencoba cek lahan di website Anda.');
    lines.push(`• Lahan: ${r.P} × ${r.L} m (${fmtArea(r.A, lang)})`);
    lines.push(`• Aturan: ${rules}`);
    lines.push(`• Boleh dibangun: hingga ${fmtArea(r.floorArea, lang)}`);
  } else {
    lines.push('Hi HOMYVEST! I tried the land check on your website.');
    lines.push(`• Land: ${r.P} × ${r.L} m (${fmtArea(r.A, lang)})`);
    lines.push(`• Rules: ${rules}`);
    lines.push(`• Allowed to build: up to ${fmtArea(r.floorArea, lang)}`);
  }
  const res = ideas(r, s.ideas);
  const pick = s.selectedIdea ? res[s.selectedIdea] : rank(res).fastest;
  if (pick && pick.payback !== null) {
    const name = IDEA_NAMES[lang][pick.key];
    lines.push(lang === 'id'
      ? `• Ide yang paling saya minati: ${name} (balik modal sekitar ${fmtYears(pick.payback, lang)})`
      : `• Idea I'm most interested in: ${name} (pays back in about ${fmtYears(pick.payback, lang)})`);
  }
  if (s.usedStep3) {
    const c = check(s.land, s.check);
    if (c && c.fp > 0) {
      const ans = c.answer.kind === 'many' || c.answer.kind === 'one'
        ? (lang === 'id' ? `bisa tambah ${c.answer.extra} lantai` : `room for ${c.answer.extra} more floor${c.answer.extra > 1 ? 's' : ''}`)
        : c.answer.kind === 'broken' ? (lang === 'id' ? 'ada aturan yang terlampaui' : 'a rule is currently exceeded')
        : c.answer.kind === 'smaller' ? (lang === 'id' ? 'hanya muat lantai yang lebih kecil' : 'only a smaller floor fits')
        : (lang === 'id' ? 'luas lantai sudah maksimal' : 'floor area is used up');
      lines.push(lang === 'id'
        ? `• Bangunan yang ada: luas dasar ${fmtArea(c.fp, lang)}, total lantai ${fmtArea(c.tfa, lang)} (${ans})`
        : `• Existing building: footprint ${fmtArea(c.fp, lang)}, total floor area ${fmtArea(c.tfa, lang)} (${ans})`);
    }
  }
  lines.push(lang === 'id' ? 'Saya ingin membahas langkah selanjutnya.' : "I'd like to talk about the next steps.");
  return lines.join('\n');
}

export const whatsAppUrl = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
```

### `src/lib/calc/calc.test.ts`
```ts
// Every case from docs/05 §10. These must stay green. Do not edit expected values.
import { describe, it, expect } from 'vitest';
import { potential, ideas, rank, check, fmtArea, fmtPct, fmtKlb, fmtYears, fmtMoney, fmtMoneyShort, type Land, type Ideas } from './calc.ts';
import { buildWhatsAppMessage, whatsAppUrl } from './whatsapp.ts';

const LAND: Land = { P: 30, L: 20, kdb: 60, klb: 2, kdh: 20, maxFloors: '' };
const IDEAS: Ideas = {
  occ: 85,
  kos: { size: 18, rent: 1_200_000, cost: 4_500_000 },
  ruko: { width: 4.5, rent: 70_000_000, cost: 5_000_000 },
  rumah: { land: 100, floor: 70, rent: 2_500_000, cost: 4_500_000 },
  gudang: { rent: 50_000, cost: 3_500_000 },
};
const CHECK = { fp: 240, tfa: 480, green: 150 };

describe('Step 1: potential (defaults)', () => {
  const r = potential(LAND)!;
  it('areas', () => {
    expect(r.A).toBe(600); expect(r.fp).toBe(360); expect(r.greenMin).toBe(120);
    expect(r.floorArea).toBe(1200); expect(r.open).toBe(120); expect(r.cars).toBe(4);
  });
  it('floors: 3 full + 120 m² partial', () => { expect(r.full).toBe(3); expect(r.partial).toBe(120); expect(r.capped).toBe(false); });
  it('split bar 60/20/20', () => {
    expect(Math.round((r.fp / r.A) * 100)).toBe(60);
    expect(Math.round((r.greenMin / r.A) * 100)).toBe(20);
    expect(Math.round((r.open / r.A) * 100)).toBe(20);
  });
});

describe('Step 1: variations', () => {
  it('maxFloors = 2 caps floor area', () => {
    const r = potential({ ...LAND, maxFloors: 2 })!;
    expect([r.floorArea, r.capped, r.full, r.partial]).toEqual([720, true, 2, 0]);
  });
  it('KDB 70 + KDH 40 conflict', () => {
    const r = potential({ ...LAND, kdb: 70, kdh: 40 })!;
    expect([r.conflict, r.fp, r.open, r.cars]).toEqual([true, 360, 0, 0]);
  });
  it('KLB 0.5 < KDB', () => {
    const r = potential({ ...LAND, klb: 0.5 })!;
    expect([r.floorArea, r.full, r.partial]).toEqual([300, 0, 300]);
  });
  it('empty state when P or L = 0', () => {
    expect(potential({ ...LAND, P: 0 })).toBeNull();
    expect(potential({ ...LAND, L: 0 })).toBeNull();
  });
  it('negative and empty inputs count as 0, percentages clamp to 100', () => {
    expect(potential({ ...LAND, P: -5 })).toBeNull();
    const r = potential({ ...LAND, kdb: 150, kdh: 0 })!;
    expect(r.fp).toBe(600);
  });
});

describe('Step 2: ideas (defaults, occupancy 85%)', () => {
  const res = ideas(potential(LAND)!, IDEAS);
  it('kos-kosan', () => {
    expect(res.kos.units).toBe(66); expect(res.kos.built).toBe(1188);
    expect(res.kos.cost).toBe(5_346_000_000); expect(Math.round(res.kos.income)).toBe(807_840_000);
    expect(res.kos.yieldPct!).toBeCloseTo(15.11, 2); expect(res.kos.payback!).toBeCloseTo(6.62, 2);
  });
  it('ruko', () => {
    expect(res.ruko.units).toBe(6); expect(res.ruko.perUnit).toBe(200); expect(res.ruko.built).toBe(1200);
    expect(res.ruko.cost).toBe(6_000_000_000); expect(Math.round(res.ruko.income)).toBe(357_000_000);
    expect(res.ruko.yieldPct!).toBeCloseTo(5.95, 2); expect(res.ruko.payback!).toBeCloseTo(16.81, 2);
  });
  it('rental houses', () => {
    expect(res.rumah.units).toBe(6); expect(res.rumah.built).toBe(420);
    expect(res.rumah.cost).toBe(1_890_000_000); expect(Math.round(res.rumah.income)).toBe(153_000_000);
    expect(res.rumah.yieldPct!).toBeCloseTo(8.1, 1); expect(res.rumah.payback!).toBeCloseTo(12.35, 2);
  });
  it('warehouse', () => {
    expect(res.gudang.built).toBe(360); expect(res.gudang.cost).toBe(1_260_000_000);
    expect(Math.round(res.gudang.income)).toBe(183_600_000);
    expect(res.gudang.yieldPct!).toBeCloseTo(14.57, 2); expect(res.gudang.payback!).toBeCloseTo(6.86, 2);
  });
  it('ranking: kos fastest, warehouse second and cheapest', () => {
    const r = rank(res);
    expect(r.fastest?.key).toBe('kos'); expect(r.second?.key).toBe('gudang'); expect(r.cheapest?.key).toBe('gudang');
  });
  it('displayed values', () => {
    expect(fmtYears(res.kos.payback!, 'en')).toBe('6.6 years');
    expect(fmtYears(res.ruko.payback!, 'en')).toBe('16.8 years');
    expect(fmtYears(res.rumah.payback!, 'en')).toBe('12.4 years');
    expect(fmtYears(res.gudang.payback!, 'en')).toBe('6.9 years');
    expect(fmtPct(res.kos.yieldPct!, 'en')).toBe('15.1%');
    expect(fmtPct(res.ruko.yieldPct!, 'en')).toBe('5.9%');   // raw 5.9499…; see 05 §10 note
    expect(fmtPct(res.gudang.yieldPct!, 'en')).toBe('14.6%');
  });
  it("an idea that doesn't fit has no payback", () => {
    const r = ideas(potential({ ...LAND, P: 4 })!, IDEAS); // 4 m frontage < 4.5 m ruko unit
    expect(r.ruko.fits).toBe(false); expect(r.ruko.payback).toBeNull();
  });
});

describe('Step 3: check (defaults)', () => {
  const c = check(LAND, CHECK)!;
  it('ratios and room', () => {
    expect(c.vKdb).toBe(40); expect(c.vKlb).toBe(0.8); expect(c.vKdh).toBe(25);
    expect(c.okKdb && c.okKlb && c.okKdh).toBe(true);
    expect(c.fpRoom).toBe(120); expect(c.faRoom).toBe(720);
  });
  it('answer: up to 3 more floors of 240 m²', () => { expect(c.answer).toEqual({ kind: 'many', extra: 3 }); });
  it('leftover 210 m² (35%)', () => { expect(c.leftover).toBe(210); expect((c.leftover / c.A) * 100).toBe(35); });
  it('broken rule blocks extra floors', () => { expect(check(LAND, { fp: 500, tfa: 500, green: 50 })!.answer.kind).toBe('broken'); });
});

describe('Formatting', () => {
  it('short money never mixes languages', () => {
    expect(fmtMoneyShort(807_840_000, 'id')).toBe('Rp 808 jt');
    expect(fmtMoneyShort(807_840_000, 'en')).toBe('Rp 808 M');
    expect(fmtMoneyShort(5_346_000_000, 'id')).toBe('Rp 5,35 M');
    expect(fmtMoneyShort(5_346_000_000, 'en')).toBe('Rp 5.35 B');
    expect(fmtMoneyShort(1.2e12, 'id')).toBe('Rp 1,2 T');
    expect(fmtMoneyShort(1.2e12, 'en')).toBe('Rp 1.2 T');
  });
  it('full money, area, KLB, years', () => {
    expect(fmtMoney(1_200_000, 'id')).toBe('Rp 1.200.000');
    expect(fmtMoney(1_200_000, 'en')).toBe('Rp 1,200,000');
    expect(fmtArea(1188, 'en')).toBe('1,188 m²');
    expect(fmtArea(1188, 'id')).toBe('1.188 m²');
    expect(fmtKlb(2, 'en')).toBe('2×');
    expect(fmtKlb(1.255, 'id')).toBe('1,26×');
    expect(fmtYears(6.62, 'id')).toBe('6,6 tahun');
  });
});

describe('WhatsApp handoff', () => {
  it('includes the land and the fastest idea', () => {
    const msg = buildWhatsAppMessage({ lang: 'en', land: LAND, ideas: IDEAS, check: CHECK });
    expect(msg).toContain('30 × 20 m (600 m²)');
    expect(msg).toContain('up to 1,200 m²');
    expect(msg).toContain('Kos-kosan (pays back in about 6.6 years)');
  });
  it('Indonesian version and URL encoding', () => {
    const msg = buildWhatsAppMessage({ lang: 'id', land: LAND, ideas: IDEAS, check: CHECK, usedStep3: true });
    expect(msg).toContain('hingga 1.200 m²');
    expect(msg).toContain('bisa tambah 3 lantai');
    expect(whatsAppUrl(msg)).toMatch(/^https:\/\/wa\.me\/6282110106088\?text=Halo%20HOMYVEST/);
  });
  it('generic message without land', () => {
    expect(buildWhatsAppMessage({ lang: 'en', land: { ...LAND, P: 0 }, ideas: IDEAS, check: CHECK })).toMatch(/^Hi HOMYVEST!/);
  });
});
```

---

## 13. The WhatsApp handoff
- Button label: "Send my results on WhatsApp" (ID: "Kirim hasil saya via WhatsApp"), shown under Step 2 results, under Step 3 results, and in `#next`.
- Link: `whatsAppUrl(buildWhatsAppMessage({...}))`, opened in a new tab (`target="_blank" rel="noopener"`).
- The message includes: land size and area, rules, allowed floor area, the selected idea (or the fastest) with its payback, and Step 3 results if the visitor used Step 3. Wording is in `reference/whatsapp.ts` and mirrored in `07` §12.
- Nothing is sent automatically. The visitor sees and edits the message in WhatsApp before sending.
- The other WhatsApp buttons on the site (header, hero, floating) also use `buildWhatsAppMessage`. If the land is default and untouched, send the generic message instead: track a `touched` flag in the store (not persisted) and pass `P: 0` when untouched, which yields the generic text.

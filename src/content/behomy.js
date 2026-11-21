// ─────────────────────────────────────────────────────────────────────────────
// BEHOMY PHOTO CAPTIONS (main page, Behomy section). Edit here, like src/content/projects.js.
//
// Brand captions are facts from the Behomy 2026 company profile (U01_06 §0). Photos whose project is not
// known yet show the styled placeholder name ("Project Name / City, Province") with their type.
//
// UNCONFIRMED project names seen on the Behomy profile pages (NOT displayed until the owner confirms which
// photo is which):
//   Build-Operate-Share: Behomy Inn Malang, Corner Eight, Cibinong Suite, Suhat Malang
//   Equity:              Metropolim, Urban Connect, Cempaka Putih, Hoteru Bandung
// Notes from the image check: the staff-training photo shows a "Corner Eight" sign; before/after pair 4
// shows "Behomy Metropolim" on the finished building; the team photo's banner reads "Homy Group".
// ─────────────────────────────────────────────────────────────────────────────
const RESIDENCE = 'Behomy Residence';
const CORVEL = 'Corvel by Behomy';
const PURNAVA = 'Purnava Village by Behomy';
const HOTERU = 'Hoteru by Behomy';
const PROPERTY = { en: 'Behomy property', id: 'Properti Behomy' };
const BEFORE_AFTER = { en: 'Before / after', id: 'Sebelum / sesudah' };

export const behomyCaptions = {
  'photos/behomy-room-1': { name: RESIDENCE, place: null, type: { en: 'Co-living room', id: 'Kamar co-living' } },
  'photos/behomy-room-2': { name: RESIDENCE, place: null, type: { en: 'Co-living room', id: 'Kamar co-living' } },
  'photos/behomy-life': { name: RESIDENCE, place: null, type: { en: 'Life at Behomy', id: 'Kehidupan di Behomy' } },
  'photos/corvel-room': { name: CORVEL, place: 'Jakarta Pusat', type: { en: 'Business stay', id: 'Penginapan bisnis' } },
  'photos/corvel-lobby': { name: CORVEL, place: 'Jakarta Pusat', type: { en: 'Lobby', id: 'Lobi' } },
  'photos/purnava-pool': { name: PURNAVA, place: 'Bali', type: { en: 'Villa', id: 'Vila' } },
  'photos/hoteru-room': { name: HOTERU, place: null, type: { en: 'Shophouse stay', id: 'Penginapan ruko' } },
  'photos/hoteru-stair': { name: HOTERU, place: null, type: { en: 'Shophouse stay', id: 'Penginapan ruko' } },
  // project unknown: placeholder name and place, known type
  'photos/behomy-facade-1': { name: null, place: null, type: PROPERTY },
  'photos/behomy-facade-2': { name: null, place: null, type: PROPERTY },
  'photos/behomy-corridor': { name: null, place: null, type: PROPERTY },
  'photos/behomy-team': { name: { en: 'The Behomy team', id: 'Tim Behomy' }, place: null, type: null },
  'photos/staff-training': {
    typeOnly: true,
    type: { en: 'Front office and housekeeping training', id: 'Pelatihan front office dan housekeeping' },
  },
  // before/after pairs: one caption per pair, keyed by the "after" photo
  'photos/before-after-1-after': { name: null, place: null, type: BEFORE_AFTER },
  'photos/before-after-2-after': { name: null, place: null, type: BEFORE_AFTER },
  'photos/before-after-3-after': { name: null, place: null, type: BEFORE_AFTER },
  'photos/before-after-4-after': { name: null, place: null, type: BEFORE_AFTER },
};

/**
 * "Places Behomy runs today": the mosaic, in reading order. wide = 2 × 2 cells, tall = 1 × 2 (portrait facades
 * next to stacked landscapes), the rest one cell. With CSS grid "dense" packing this fills 4 columns on desktop
 * and 2 on tablets and phones with no holes. Small sources sit only in single cells, which never exceed half
 * their pixel width.
 */
export const behomyMosaic = [
  { id: 'photos/behomy-corridor', shape: 'wide', depth: true },
  { id: 'photos/behomy-facade-1', shape: 'tall', position: '62% 40%' },
  { id: 'photos/behomy-room-1' },
  { id: 'photos/behomy-life' },
  { id: 'photos/corvel-room' },
  { id: 'photos/behomy-facade-2', shape: 'tall', position: '62% 50%' },
  { id: 'photos/corvel-lobby' },
  { id: 'photos/purnava-pool' },
  { id: 'photos/hoteru-room' },
  { id: 'photos/hoteru-stair' },
  { id: 'photos/behomy-room-2' },
];

/** "From idle to running": the before (greyscale originals) and after photos of each pair. */
export const beforeAfter = [1, 2, 3, 4].map((n) => ({
  n,
  before: `photos/before-after-${n}-before`,
  after: `photos/before-after-${n}-after`,
  // pair 2's before photo has a thin dark strip along its top edge: crop toward the bottom
  beforePosition: n === 2 ? '50% 100%' : '50% 50%',
}));

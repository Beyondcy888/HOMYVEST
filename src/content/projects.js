// ─────────────────────────────────────────────────────────────────────────────
// PROJECT CAPTIONS: the one file to edit when the real captions are ready.
//
// For each image, fill in:
//   name    project name                       e.g. 'Kost Kebon Bawang'
//   place   city, province                     e.g. 'Jakarta Utara, DKI Jakarta'
//   type    what it is                         e.g. 'Kost'
//   status  year or status                     e.g. '2025' or 'In progress'
// While `name` is null the site shows a styled placeholder ("Project Name / City, Province / Type · Year").
//
// `category` drives the Projects filter (kost | guesthouse | homestay | villa). These are PROVISIONAL
// (docs/08 §4): please confirm or correct them.
// ─────────────────────────────────────────────────────────────────────────────
export const captions = {
  // Projects gallery
  'facades/best': { name: null, place: null, type: null, status: null, category: 'villa' },
  'facades/facade-1': { name: null, place: null, type: null, status: null, category: 'kost' },
  'facades/facade-2': { name: null, place: null, type: null, status: null, category: 'guesthouse' },
  'facades/benhil-1': { name: null, place: null, type: null, status: null, category: 'kost' },
  'facades/benhil-2': { name: null, place: null, type: null, status: null, category: 'kost' },
  'interiors/interior-1': { name: null, place: null, type: null, status: null, category: 'guesthouse' },
  'interiors/interior-2': { name: null, place: null, type: null, status: null, category: 'kost' },
  'interiors/interior-3': { name: null, place: null, type: null, status: null, category: 'guesthouse' },
  'interiors/interior-4': { name: null, place: null, type: null, status: null, category: 'kost' },
  'interiors/interior-5': { name: null, place: null, type: null, status: null, category: 'homestay' },
  'interiors/interior-6': { name: null, place: null, type: null, status: null, category: 'homestay' },
  'interiors/interior-7': { name: null, place: null, type: null, status: null, category: 'villa' },
  'interiors/interior-8': { name: null, place: null, type: null, status: null, category: 'kost' },

  // Maxone walkthrough cards
  'maxone/1': { name: null, place: null, type: null, status: null },
  'maxone/2': { name: null, place: null, type: null, status: null },
  'maxone/3': { name: null, place: null, type: null, status: null },
  'maxone/4': { name: null, place: null, type: null, status: null },
  'maxone/5': { name: null, place: null, type: null, status: null },
  'maxone/6': { name: null, place: null, type: null, status: null },
  'maxone/7': { name: null, place: null, type: null, status: null },

  // Beyond stays
  'padel-clean/padel-1': { name: null, place: null, type: null, status: null },
  'padel-clean/padel-2': { name: null, place: null, type: null, status: null },
  'padel-clean/padel-3': { name: null, place: null, type: null, status: null },
  'others/athero-2': { name: null, place: null, type: null, status: null },
  'others/athero-3': { name: null, place: null, type: null, status: null },
  'others/athero-4': { name: null, place: null, type: null, status: null },
  'cafe/cafe': { name: null, place: null, type: null, status: null },
  'office/office-1': { name: null, place: null, type: null, status: null },
  'office/office-2': { name: null, place: null, type: null, status: null },
  'office/office-3': { name: null, place: null, type: null, status: null },
};

/** Order and size of images in the Projects gallery. `size` is a layout hint, not a crop. */
export const gallery = [
  { id: 'facades/facade-1', size: 'xl' },
  { id: 'interiors/interior-5', size: 'l' },
  { id: 'interiors/interior-2', size: 'm' },
  { id: 'facades/benhil-1', size: 's' },
  { id: 'facades/benhil-2', size: 's' },
  { id: 'interiors/interior-1', size: 'l' },
  { id: 'interiors/interior-4', size: 'm' },
  { id: 'facades/best', size: 'xl' },
  { id: 'interiors/interior-6', size: 'l' },
  { id: 'interiors/interior-3', size: 'm' },
  { id: 'facades/facade-2', size: 's' },
  { id: 'interiors/interior-7', size: 'l' },
  { id: 'interiors/interior-8', size: 'm' },
];

export const CATEGORIES = ['kost', 'guesthouse', 'homestay', 'villa'];

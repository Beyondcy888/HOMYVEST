// ─────────────────────────────────────────────────────────────────────────────
// PROJECT CAPTIONS: the one file to edit when the real captions are ready.
//
// For each image, fill in:
//   name    project name                       e.g. 'Kost Kebon Bawang'
//   place   city, province                     e.g. 'Jakarta Utara, DKI Jakarta'
//   type    what it is                         e.g. 'Kost'
//   status  year or status                     e.g. '2025' or 'In progress'
// While `name` is null the site shows a styled placeholder ("Project Name / City, Province / Type · Year").
// Any value may also be written per language: { en: 'Lobby', id: 'Lobi' }.
//
// The captions of the Behomy photos (Behomy section of the main page) live in src/content/behomy.js.
// ─────────────────────────────────────────────────────────────────────────────
import { behomyCaptions } from './behomy.js';

const projectCaptions = {
  // Projects gallery
  'facades/best': { name: null, place: null, type: null, status: null },
  'facades/facade-1': { name: null, place: null, type: null, status: null },
  'facades/facade-2': { name: null, place: null, type: null, status: null },
  'facades/benhil-1': { name: null, place: null, type: null, status: null },
  'facades/benhil-2': { name: null, place: null, type: null, status: null },
  'interiors/interior-1': { name: null, place: null, type: null, status: null },
  'interiors/interior-2': { name: null, place: null, type: null, status: null },
  'interiors/interior-3': { name: null, place: null, type: null, status: null },
  'interiors/interior-4': { name: null, place: null, type: null, status: null },
  'interiors/interior-5': { name: null, place: null, type: null, status: null },
  'interiors/interior-6': { name: null, place: null, type: null, status: null },
  'interiors/interior-7': { name: null, place: null, type: null, status: null },
  'interiors/interior-8': { name: null, place: null, type: null, status: null },

  // Maxone walkthrough cards (/portofolio/)
  'maxone/1': { name: null, place: null, type: null, status: null },
  'maxone/2': { name: null, place: null, type: null, status: null },
  'maxone/3': { name: null, place: null, type: null, status: null },
  'maxone/4': { name: null, place: null, type: null, status: null },
  'maxone/5': { name: null, place: null, type: null, status: null },
  'maxone/6': { name: null, place: null, type: null, status: null },
  'maxone/7': { name: null, place: null, type: null, status: null },

  // Beyond stays (/portofolio/)
  'padel-clean/padel-1': { name: null, place: null, type: null, status: null },
  'padel-clean/padel-2': { name: null, place: null, type: null, status: null },
  'padel-clean/padel-3': { name: null, place: null, type: null, status: null },
  'others/athero-1': { name: null, place: null, type: null, status: null },
  'others/athero-2': { name: null, place: null, type: null, status: null },
  'others/athero-3': { name: null, place: null, type: null, status: null },
  'others/athero-4': { name: null, place: null, type: null, status: null },
  'cafe/cafe': { name: null, place: null, type: null, status: null },
  'office/office-1': { name: null, place: null, type: null, status: null },
  'office/office-2': { name: null, place: null, type: null, status: null },
  'office/office-3': { name: null, place: null, type: null, status: null },
};

export const captions = { ...projectCaptions, ...behomyCaptions };

/**
 * The Projects gallery, in the curated order of U01_01 §2.5, composed row by row on a 12-column grid.
 * Rows alternate large and small, left and right. Every image reveals as it scrolls in.
 *   size   xl = 8 columns · l = 6 · m = 5 · s = 3 (low-resolution sources are always s)
 *   start  the column the image starts at; an image whose start is left of the previous one begins a new row
 *   drop   0–2: how far the image hangs below the top of its row, for the staggered rhythm
 */
export const gallery = [
  { id: 'facades/best', size: 'xl', start: 1 },
  { id: 'interiors/interior-5', size: 's', start: 10, drop: 2 },
  { id: 'interiors/interior-2', size: 'm', start: 1, drop: 1 },
  { id: 'facades/facade-1', size: 'l', start: 7 },
  { id: 'interiors/interior-1', size: 'l', start: 1 },
  { id: 'interiors/interior-6', size: 'm', start: 8, drop: 2 },
  { id: 'facades/benhil-1', size: 's', start: 1, drop: 1 },
  { id: 'facades/benhil-2', size: 's', start: 4, drop: 1 },
  { id: 'interiors/interior-7', size: 'l', start: 7 },
  { id: 'interiors/interior-3', size: 'l', start: 1 },
  { id: 'interiors/interior-4', size: 'm', start: 8, drop: 1 },
  { id: 'facades/facade-2', size: 's', start: 2, drop: 1 },
  { id: 'interiors/interior-8', size: 'xl', start: 5 },
];

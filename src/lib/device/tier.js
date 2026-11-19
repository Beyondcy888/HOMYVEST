// Device tier, decided once at load (docs/06 §1.4). PerformanceMonitor may step it down, never up.
import { useSyncExternalStore } from 'react';
import { query } from '../storage.js';

export const TIERS = {
  high: { name: 'high', dpr: [1, 2], shadows: true, shadowMap: 2048, ao: true, density: 1, maxone3d: true },
  medium: { name: 'medium', dpr: [1, 1.5], shadows: true, shadowMap: 1024, ao: false, density: 0.6, maxone3d: true },
  low: { name: 'low', dpr: [1, 1], shadows: false, shadowMap: 0, ao: false, density: 0.3, maxone3d: false },
};

function detect() {
  if (typeof window === 'undefined') return 'medium';
  const forced = query('tier');
  if (forced && TIERS[forced]) return forced;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory; // undefined outside Chromium
  if (coarse) {
    if (cores <= 4 || (mem !== undefined && mem <= 4)) return 'low';
    return 'medium'; // flagship phone or tablet
  }
  if (cores >= 8 && (mem === undefined || mem >= 8)) return 'high';
  return 'medium';
}

let current = detect();
const listeners = new Set();
const ORDER = ['high', 'medium', 'low'];

export const getTier = () => TIERS[current];

/** Step down one tier (called when the frame rate stays low). Returns the new tier. */
export function declineTier() {
  if (query('tier')) return TIERS[current]; // a forced tier stays put, for testing
  const next = ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(current) + 1)];
  if (next !== current) {
    current = next;
    listeners.forEach((fn) => fn());
  }
  return TIERS[current];
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** React hook: the current tier object, re-rendering if it declines. */
export const useTier = () => useSyncExternalStore(subscribe, getTier, getTier);

export const isCoarsePointer = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(pointer: coarse)').matches);
export const canHover = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(hover: hover) and (pointer: fine)').matches);

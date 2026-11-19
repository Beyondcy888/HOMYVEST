// Theme: follows the OS on first visit; a footer toggle overrides it and is remembered.
// The same logic runs inline in index.html before first paint to avoid a flash.
import { useSyncExternalStore } from 'react';
import { local } from './storage.js';

const KEY = 'homyvest:theme';
const listeners = new Set();
const mq = () => window.matchMedia('(prefers-color-scheme: dark)');

export const getPref = () => {
  const v = local.get(KEY);
  return v === 'light' || v === 'dark' ? v : 'auto';
};
export const resolve = (pref = getPref()) => (pref === 'auto' ? (mq().matches ? 'dark' : 'light') : pref);

function apply() {
  const theme = resolve();
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0c0c0b' : '#fafaf7');
  listeners.forEach((fn) => fn());
}

export function setPref(pref) {
  local.set(KEY, pref === 'light' || pref === 'dark' ? pref : 'auto');
  apply();
}

if (typeof window !== 'undefined') mq().addEventListener('change', () => getPref() === 'auto' && apply());

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
/** 'auto' | 'light' | 'dark' as chosen by the visitor. */
export const useThemePref = () => useSyncExternalStore(subscribe, getPref, () => 'auto');
/** 'light' | 'dark' actually showing. 3D scenes read this to pick ground and fog colours. */
export const useTheme = () =>
  useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme || 'light',
    () => 'light',
  );

/** Read a CSS custom property as a string (e.g. cssVar('--clay') → '#eeece6'). */
export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

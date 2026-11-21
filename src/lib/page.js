// Which page is showing, and the links between the two pages (U01_01 §3, §6).
import { createContext, useContext } from 'react';

/** 'home' (/) or 'portfolio' (/portofolio/). */
export const PageContext = createContext('home');
export const usePage = () => useContext(PageContext);

/** Always with the trailing slash, so static hosts serve portofolio/index.html directly. */
export const PORTFOLIO_URL = '/portofolio/';

/** A section of the main page, as a link from either page. */
export const homeHref = (page, hash) => (page === 'home' ? hash : `/${hash}`);

/**
 * A deep link into the main page on load: /#calculator or /?focus=phone.
 * When one is present the intro is skipped and every section mounts at once, so the target exists.
 */
export function deepLinkOnLoad() {
  if (typeof window === 'undefined') return { hash: null, focusPhone: false };
  let focusPhone = false;
  try {
    focusPhone = new URLSearchParams(window.location.search).get('focus') === 'phone';
  } catch {
    focusPhone = false;
  }
  const raw = window.location.hash;
  // only plain ids (a section or the hero), never arbitrary selectors from the address bar
  const hash = /^#[A-Za-z][\w-]*$/.test(raw) && raw !== '#top' ? raw : null;
  return { hash, focusPhone };
}

export const hasDeepLink = () => {
  const d = deepLinkOnLoad();
  return Boolean(d.hash || d.focusPhone);
};

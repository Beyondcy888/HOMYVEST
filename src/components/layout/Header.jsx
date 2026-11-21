import { useEffect, useRef } from 'react';
import { PORTFOLIO_URL, homeHref, usePage } from '../../lib/page.js';
import { useCalc } from '../../lib/calc/store.ts';
import { useT } from '../../i18n/useT.js';
import { useUi } from '../../lib/ui/store.js';
import { scrollToTarget } from '../../lib/scroll/lenis.js';
import Wordmark from '../brand/Wordmark.jsx';
import { WhatsAppButton } from '../ui/Button.jsx';
import { ArrowLeft, Menu } from '../ui/Icons.jsx';
import LangToggle from './LangToggle.jsx';
import MobileMenu from './MobileMenu.jsx';
import './Header.css';

// Main-page sections by hash, then the portfolio page (U01_01 §3).
export const NAV = [
  { key: 'how', hash: '#how' },
  { key: 'behomy', hash: '#behomy' },
  { key: 'projects', hash: '#projects' },
  { key: 'calculator', hash: '#calculator' },
  { key: 'faq', hash: '#faq' },
  { key: 'portfolio', url: PORTFOLIO_URL },
];

/** In-page navigation that works with Lenis and with native scrolling. */
export function goTo(e, href, opts) {
  e?.preventDefault();
  scrollToTarget(href, opts);
  window.history.replaceState(null, '', href);
}

/** Warms the portfolio page when a link to it is about to be used (hover or focus). */
export function prefetchPortfolio() {
  if (document.querySelector(`link[rel="prefetch"][href="${PORTFOLIO_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = PORTFOLIO_URL;
  document.head.appendChild(link);
}

/**
 * Props for a navigation link on the current page. Section links scroll on the main page and navigate to it
 * from the portfolio; the portfolio link is marked current on its own page.
 * onFollow(e, hash) replaces the default in-page scroll (the mobile menu closes itself first).
 */
export function navLinkProps(item, page, onFollow) {
  if (item.url) {
    const current = page === 'portfolio';
    return {
      href: item.url,
      'aria-current': current ? 'page' : undefined,
      onClick: current
        ? (e) => {
            e.preventDefault();
            onFollow ? onFollow(e, 0) : scrollToTarget(0);
          }
        : undefined,
      onPointerEnter: current ? undefined : prefetchPortfolio,
      onFocus: current ? undefined : prefetchPortfolio,
    };
  }
  if (page !== 'home') return { href: homeHref(page, item.hash) };
  return {
    href: item.hash,
    onClick: (e) => {
      // "Land check" always opens the calculator at step 1 (U01_01 §2.6), wherever the visitor left it
      if (item.hash === '#calculator') useCalc.getState().setStep(1, { silent: true });
      return onFollow ? onFollow(e, item.hash) : goTo(e, item.hash);
    },
  };
}

export default function Header({ wordmarkRef }) {
  const { t } = useT();
  const page = usePage();
  const ref = useRef(null);
  const menuBtn = useRef(null);
  const pinned = useUi((s) => s.pinned);
  const introDone = useUi((s) => s.introDone);
  const menuOpen = useUi((s) => s.menuOpen);
  const setMenuOpen = useUi((s) => s.setMenuOpen);

  // Transparent over the hero, paper + hairline after it. Hides on scroll down, shows on scroll up.
  useEffect(() => {
    const el = ref.current;
    let lastY = window.scrollY;
    let hidden = false;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      el.dataset.solid = String(y > 8);
      const pinnedNow = useUi.getState().pinned > 0;
      if (y < 60) hidden = false;
      else if (pinnedNow) hidden = true;
      else if (y > lastY + 6) hidden = true;
      else if (y < lastY - 6) hidden = false;
      // keyboard users must never lose the header they are focused in
      if (el.contains(document.activeElement)) hidden = false;
      el.dataset.hidden = String(hidden);
      lastY = y;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    el.addEventListener('focusin', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      el.removeEventListener('focusin', update);
    };
  }, []);

  useEffect(() => {
    // re-evaluate when a pinned scene starts or ends without a scroll event
    window.dispatchEvent(new Event('scroll'));
  }, [pinned]);

  return (
    <>
      <header ref={ref} className="header" data-solid="false" data-hidden="false" data-ready={introDone}>
        <div className="wrap header__in">
          <div className="header__start">
            {page === 'home' ? (
              <Wordmark ref={wordmarkRef} href="#top" className="header__mark" onClick={(e) => goTo(e, '#top', { offset: 0 })} />
            ) : (
              <>
                <Wordmark ref={wordmarkRef} href="/" className="header__mark" />
                {/* phones: a plain way back, beside the wordmark (U01_01 §3) */}
                <a className="header__home tap" href="/">
                  <ArrowLeft />
                  {t('nav.home')}
                </a>
              </>
            )}
          </div>
          <nav className="header__nav" aria-label={t('nav.label')}>
            <ul>
              {NAV.map((item) => (
                <li key={item.key}>
                  <a className="link" {...navLinkProps(item, page)}>
                    {t(`nav.${item.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="header__actions">
            <LangToggle />
            <WhatsAppButton label={t('wa.header')} compact className="header__wa" />
            <button
              ref={menuBtn}
              type="button"
              className="header__menu tap"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
            >
              <span className="sr-only">{t('nav.menu')}</span>
              <Menu />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu returnFocusTo={menuBtn} />
    </>
  );
}

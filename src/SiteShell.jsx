// The frame both pages share (U01_01 §6): language, theme, smooth scrolling, header, footer and the
// floating WhatsApp button, around the page's own sections.
import { useEffect, useRef } from 'react';
import { I18nProvider, useT } from './i18n/I18nProvider.jsx';
import { useReducedMotion } from './lib/device/useReducedMotion.js';
import { startLenis, destroyLenis, refreshTriggers } from './lib/scroll/lenis.js';
import { PageContext } from './lib/page.js';
import { SMOOTH } from './content/scroll-config.js';
import './lib/theme.js';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import FloatingWhatsApp from './components/layout/FloatingWhatsApp.jsx';
import Intro from './components/brand/Intro.jsx';

function Shell({ page, children }) {
  const { t, lang } = useT();
  const reducedMotion = useReducedMotion();
  const headerMark = useRef(null);

  useEffect(() => {
    // The portfolio's long scenes get a softer, slower scroll; the main page keeps the original feel.
    const opts = page === 'portfolio' ? { lerp: SMOOTH.lenisLerp, wheelMultiplier: SMOOTH.wheelMultiplier } : {};
    startLenis({ reducedMotion, ...opts });
    return () => destroyLenis();
  }, [reducedMotion, page]);

  // Trigger positions depend on text metrics: refresh after fonts load and after a language change.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && refreshTriggers());
    // Pinned lengths are in viewport heights: recompute them when a phone turns.
    const onOrient = () => refreshTriggers();
    window.addEventListener('orientationchange', onOrient);
    return () => {
      alive = false;
      window.removeEventListener('orientationchange', onOrient);
    };
  }, []);
  useEffect(() => {
    refreshTriggers();
  }, [lang]);

  return (
    <PageContext.Provider value={page}>
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>
      {/* The logo intro opens the main page only; the portfolio is reached from it. */}
      <Intro headerMark={headerMark} enabled={page === 'home'} />
      <Header wordmarkRef={headerMark} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <FloatingWhatsApp />
    </PageContext.Provider>
  );
}

export default function SiteShell({ page = 'home', children }) {
  return (
    <I18nProvider metaKey={page === 'portfolio' ? 'pfMeta' : 'meta'}>
      <Shell page={page}>{children}</Shell>
    </I18nProvider>
  );
}

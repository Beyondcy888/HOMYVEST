import { useEffect, useRef } from 'react';
import { I18nProvider, useT } from './i18n/I18nProvider.jsx';
import { useReducedMotion } from './lib/device/useReducedMotion.js';
import { startLenis, destroyLenis, refreshTriggers } from './lib/scroll/lenis.js';
import './lib/theme.js';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import FloatingWhatsApp from './components/layout/FloatingWhatsApp.jsx';
import Intro from './components/brand/Intro.jsx';
import Sections from './sections/Sections.jsx';

function Shell() {
  const { t, lang } = useT();
  const reducedMotion = useReducedMotion();
  const headerMark = useRef(null);

  useEffect(() => {
    startLenis({ reducedMotion });
    return () => destroyLenis();
  }, [reducedMotion]);

  // Trigger positions depend on text metrics: refresh after fonts load and after a language change.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && refreshTriggers());
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    refreshTriggers();
  }, [lang]);

  return (
    <>
      <a className="skip-link" href="#about">
        {t('nav.skipToContent')}
      </a>
      <Intro headerMark={headerMark} />
      <Header wordmarkRef={headerMark} />
      <span id="top" aria-hidden="true" />
      <main>
        <Sections />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  );
}

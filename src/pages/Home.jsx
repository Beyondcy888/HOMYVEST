// The main page, in order (U01_01 §2): leave a number → what HOMYVEST is → how it works → who runs it →
// the places → your land → what happens next → questions. The 3D showpieces live on /portofolio/ and none of
// their code is imported here.
import { startTransition, useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useUi } from '../lib/ui/store.js';
import { getLenis, refreshTriggers, scrollToTarget } from '../lib/scroll/lenis.js';
import { session, query } from '../lib/storage.js';
import { prefersReducedMotion } from '../lib/device/useReducedMotion.js';
import { deepLinkOnLoad, hasDeepLink } from '../lib/page.js';
import Hero from '../sections/Hero/Hero.jsx';
import About from '../sections/About/About.jsx';
import How from '../sections/How/How.jsx';
import Behomy from '../sections/Behomy/Behomy.jsx';
import Projects from '../sections/Projects/Projects.jsx';
import Calculator from '../sections/Calculator/Calculator.jsx';
import Next from '../sections/Next/Next.jsx';
import Faq from '../sections/Faq/Faq.jsx';

/** Lands a deep link once everything is mounted and measured: /#calculator scrolls there, /?focus=phone focuses the number field. */
function landDeepLink() {
  const { hash, focusPhone } = deepLinkOnLoad();
  if (!hash && !focusPhone) return;
  ScrollTrigger.refresh();
  getLenis()?.resize();
  if (focusPhone) {
    scrollToTarget(0, { immediate: true });
    requestAnimationFrame(() => document.getElementById('hero-phone')?.focus({ preventScroll: true }));
    // a reload should not pull the visitor back to the field
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('focus');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch {
      /* ignore */
    }
    return;
  }
  scrollToTarget(hash, { immediate: true });
}

export default function Home() {
  // First paint is the hero alone. Everything below it mounts as soon as the intro is out of the way, as a
  // transition, so React renders it in slices and the hero stays responsive on slow phones.
  const introDone = useUi((st) => st.introDone);
  // Only a first visit (the one that plays the intro) defers. A reload, a return visit or a deep link mounts
  // everything at once, so the browser can restore the position and the link finds its target.
  const [below, setBelow] = useState(
    () =>
      prefersReducedMotion() ||
      session.get('homyvest:intro') === '1' ||
      query('nointro') === '1' ||
      window.scrollY > 40 ||
      hasDeepLink(),
  );
  useEffect(() => {
    if (introDone && !below) startTransition(() => setBelow(true));
  }, [introDone, below]);
  useEffect(() => {
    if (!below) return undefined;
    refreshTriggers();
    let alive = true;
    // after the fonts (text sets the section heights) and one frame for the sections' own effects
    (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(() => alive && landDeepLink()));
    return () => {
      alive = false;
    };
  }, [below]);

  return (
    <>
      <Hero />
      {below ? (
        <>
          <About />
          <How />
          <Behomy />
          <Projects />
          <Calculator />
          <Next />
          <Faq />
        </>
      ) : null}
    </>
  );
}

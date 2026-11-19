import { useEffect, useRef } from 'react';
import { useT } from '../../i18n/useT.js';
import { useUi } from '../../lib/ui/store.js';
import { scrollToTarget } from '../../lib/scroll/lenis.js';
import Wordmark from '../brand/Wordmark.jsx';
import { WhatsAppButton } from '../ui/Button.jsx';
import { Menu } from '../ui/Icons.jsx';
import LangToggle from './LangToggle.jsx';
import MobileMenu from './MobileMenu.jsx';
import './Header.css';

export const NAV = [
  { key: 'how', href: '#about' },
  { key: 'projects', href: '#projects' },
  { key: 'calculator', href: '#calculator' },
  { key: 'faq', href: '#faq' },
];

/** In-page navigation that works with Lenis and with native scrolling. */
export function goTo(e, href, opts) {
  e?.preventDefault();
  scrollToTarget(href, opts);
  window.history.replaceState(null, '', href);
}

export default function Header({ wordmarkRef }) {
  const { t } = useT();
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
      const story = document.getElementById('story');
      const heroEnd = story ? story.offsetTop + story.offsetHeight - el.offsetHeight : 0;
      el.dataset.solid = String(y > Math.max(8, heroEnd));
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
          <Wordmark ref={wordmarkRef} href="#top" className="header__mark" onClick={(e) => goTo(e, '#top', { offset: 0 })} />
          <nav className="header__nav" aria-label={t('nav.label')}>
            <ul>
              {NAV.map((item) => (
                <li key={item.key}>
                  <a className="link" href={item.href} onClick={(e) => goTo(e, item.href)}>
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

import { useEffect, useRef } from 'react';
import { useT } from '../../i18n/useT.js';
import { useUi } from '../../lib/ui/store.js';
import { lockScroll, unlockScroll, scrollToTarget } from '../../lib/scroll/lenis.js';
import { WhatsAppButton } from '../ui/Button.jsx';
import { ArrowRight, Close } from '../ui/Icons.jsx';
import LangToggle from './LangToggle.jsx';
import { NAV, goTo, navLinkProps } from './Header.jsx';
import { usePage } from '../../lib/page.js';

/** Full-screen menu sheet: a dialog with a focus trap that returns focus on close. */
export default function MobileMenu({ returnFocusTo }) {
  const { t } = useT();
  const page = usePage();
  const open = useUi((s) => s.menuOpen);
  const setOpen = useUi((s) => s.setMenuOpen);
  const ref = useRef(null);
  const closeBtn = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    lockScroll();
    closeBtn.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key !== 'Tab') return;
      const items = ref.current.querySelectorAll('a[href], button:not([disabled])');
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockScroll();
      returnFocusTo?.current?.focus();
    };
  }, [open, setOpen, returnFocusTo]);

  const follow = (e, target) => {
    e.preventDefault();
    setOpen(false);
    // wait for the scroll lock to release
    requestAnimationFrame(() => (typeof target === 'number' ? scrollToTarget(target) : goTo(null, target)));
  };

  return (
    <div
      ref={ref}
      id="mobile-menu"
      className="mmenu"
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.menu')}
      data-open={open}
      inert={!open}
    >
      <div className="mmenu__top">
        <LangToggle />
        <button ref={closeBtn} type="button" className="mmenu__close tap" onClick={() => setOpen(false)}>
          <span className="sr-only">{t('nav.close')}</span>
          <Close />
        </button>
      </div>
      <nav className="mmenu__nav" aria-label={t('nav.label')}>
        <ul>
          {NAV.map((item, i) => (
            <li key={item.key} style={{ '--i': i }}>
              <a {...navLinkProps(item, page, follow)}>
                {t(`nav.${item.key}`)}
                <ArrowRight />
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mmenu__foot">
        <WhatsAppButton label={t('wa.hero')} block />
      </div>
    </div>
  );
}

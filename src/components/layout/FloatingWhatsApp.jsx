import { useEffect, useState } from 'react';
import { useT } from '../../i18n/useT.js';
import { useUi } from '../../lib/ui/store.js';
import { useWhatsApp } from '../ui/Button.jsx';
import { WhatsApp } from '../ui/Icons.jsx';

const isField = (el) => el instanceof HTMLElement && el.matches('input, textarea, select, [contenteditable="true"]');

/**
 * Mobile only. Appears after the page's hero (the element marked data-hero). Hidden while a pinned scene is
 * active, while the funnel panel or the menu is open, while any field has focus (so it never covers the
 * keyboard) and while the footer is on screen (U01_05 §1).
 */
export default function FloatingWhatsApp() {
  const { t } = useT();
  const { href } = useWhatsApp();
  const pinned = useUi((s) => s.pinned > 0);
  const inputFocused = useUi((s) => s.inputFocused);
  const menuOpen = useUi((s) => s.menuOpen);
  const funnelOpen = useUi((s) => s.funnelOpen);
  const [pastHero, setPastHero] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [fieldFocused, setFieldFocused] = useState(false);

  useEffect(() => {
    const onIn = (e) => setFieldFocused(isField(e.target));
    const onOut = () => window.setTimeout(() => setFieldFocused(isField(document.activeElement)), 0);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector('[data-hero]');
      const end = hero ? hero.offsetTop + hero.offsetHeight - window.innerHeight * 0.5 : 400;
      setPastHero(window.scrollY > end);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const footer = document.querySelector('footer');
    const io = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting), { threshold: 0.05 });
    if (footer) io.observe(footer);
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  const show = pastHero && !pinned && !inputFocused && !fieldFocused && !footerVisible && !menuOpen && !funnelOpen;
  return (
    <a
      className="fab"
      href={href}
      target="_blank"
      rel="noopener"
      data-wa
      data-show={show}
      aria-label={t('wa.floating')}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
    >
      <WhatsApp />
    </a>
  );
}

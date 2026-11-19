import { useEffect, useState } from 'react';
import { useT } from '../../i18n/useT.js';
import { useUi } from '../../lib/ui/store.js';
import { useWhatsApp } from '../ui/Button.jsx';
import { WhatsApp } from '../ui/Icons.jsx';

/**
 * Mobile only. Appears after the hero. Hidden while a pinned scene is active, while a calculator
 * input has focus (so it never covers the keyboard) and while the footer is on screen.
 */
export default function FloatingWhatsApp() {
  const { t } = useT();
  const { href } = useWhatsApp();
  const pinned = useUi((s) => s.pinned > 0);
  const inputFocused = useUi((s) => s.inputFocused);
  const menuOpen = useUi((s) => s.menuOpen);
  const [pastHero, setPastHero] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const story = document.getElementById('story');
      const end = story ? story.offsetTop + story.offsetHeight - window.innerHeight * 0.5 : 400;
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

  const show = pastHero && !pinned && !inputFocused && !footerVisible && !menuOpen;
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

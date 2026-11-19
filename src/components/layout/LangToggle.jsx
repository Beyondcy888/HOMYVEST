import { useT } from '../../i18n/useT.js';
import { refreshTriggers } from '../../lib/scroll/lenis.js';

/** EN | ID. Switches every string, number format and unit label; remembered in localStorage. */
export default function LangToggle({ className = '' }) {
  const { lang, setLang, t } = useT();
  const choose = (next) => {
    if (next === lang) return;
    // Keep the visitor where they are: anchor on the element at the top of the viewport.
    const anchor = document.elementFromPoint(window.innerWidth / 2, Math.min(200, window.innerHeight / 3));
    const before = anchor?.getBoundingClientRect().top ?? 0;
    setLang(next);
    requestAnimationFrame(() => {
      refreshTriggers();
      if (anchor?.isConnected) {
        const delta = anchor.getBoundingClientRect().top - before;
        if (Math.abs(delta) > 2) window.scrollBy(0, delta);
      }
    });
  };
  return (
    <div className={`lang ${className}`} role="group" aria-label={t('nav.lang')}>
      <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => choose('en')}>
        EN
      </button>
      <span className="lang__sep" aria-hidden="true" />
      <button type="button" lang="id" aria-pressed={lang === 'id'} onClick={() => choose('id')}>
        ID
      </button>
    </div>
  );
}

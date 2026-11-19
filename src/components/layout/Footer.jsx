import { useT } from '../../i18n/useT.js';
import { setPref, useThemePref } from '../../lib/theme.js';
import Wordmark from '../brand/Wordmark.jsx';
import { useWhatsApp } from '../ui/Button.jsx';
import LangToggle from './LangToggle.jsx';
import { goTo } from './Header.jsx';
import './Footer.css';

const THEMES = ['light', 'dark', 'auto'];

export default function Footer() {
  const { t } = useT();
  const pref = useThemePref();
  const { href } = useWhatsApp();
  return (
    <footer className="footer">
      <div className="wrap">
        <Wordmark href="#top" className="footer__mark" playOnView onClick={(e) => goTo(e, '#top', { offset: 0 })} />
        <div className="footer__grid">
          <p className="footer__powered">
            {/* two short lines instead of one that wraps with a dangling separator */}
            {t('footer.powered')
              .split(' · ')
              .map((part) => (
                <span key={part}>{part}</span>
              ))}
          </p>
          <div className="footer__contact">
            <span className="t-eyebrow muted">{t('footer.contact')}</span>
            <a className="link link--underlined nums" href={href} target="_blank" rel="noopener" data-wa>
              +62 821-1010-6088
              <span className="sr-only"> ({t('wa.newTab')})</span>
            </a>
          </div>
          <div className="footer__settings">
            <span className="t-eyebrow muted">{t('footer.settings')}</span>
            <div className="footer__toggles">
              <LangToggle />
              <div className="theme" role="group" aria-label={t('theme.label')}>
                {THEMES.map((name) => (
                  <button key={name} type="button" aria-pressed={pref === name} onClick={() => setPref(name)}>
                    {t(`theme.${name}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <hr className="rule" />
        <div className="footer__legal">
          <p className="t-small muted">{t('footer.disclaimer')}</p>
          <p className="t-small muted nums">{t('footer.rights', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}

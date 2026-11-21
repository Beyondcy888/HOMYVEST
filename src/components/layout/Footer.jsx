import { useT } from '../../i18n/useT.js';
import { PORTFOLIO_URL, usePage } from '../../lib/page.js';
import { scrollToTarget } from '../../lib/scroll/lenis.js';
import PartnerLogo from '../brand/PartnerLogo.jsx';
import { setPref, useThemePref } from '../../lib/theme.js';
import Wordmark from '../brand/Wordmark.jsx';
import { useWhatsApp } from '../ui/Button.jsx';
import LangToggle from './LangToggle.jsx';
import { goTo, prefetchPortfolio } from './Header.jsx';
import './Footer.css';

const THEMES = ['light', 'dark', 'auto'];

export default function Footer() {
  const { t } = useT();
  const page = usePage();
  const pref = useThemePref();
  const { href } = useWhatsApp();
  return (
    <footer className="footer">
      <div className="wrap">
        {page === 'home' ? (
          <Wordmark href="#top" className="footer__mark" playOnView onClick={(e) => goTo(e, '#top', { offset: 0 })} />
        ) : (
          <Wordmark
            href="#main"
            className="footer__mark"
            playOnView
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget(0);
            }}
          />
        )}
        <div className="footer__grid">
          <div className="footer__side">
            {/* two short lines, each ending in the partner's logo ("Powered by HomyEight", "Operated by Behomy") */}
            <p className="footer__powered">
              {t('footer.powered')
                .split(' · ')
                .map((part) => {
                  const brand = /behomy\s*$/i.test(part) ? 'behomy' : /homyeight\s*$/i.test(part) ? 'homyeight' : null;
                  const label = brand ? part.replace(/\s*(HomyEight|Behomy)\s*$/i, '') : part;
                  return (
                    <span key={part} className="footer__partner">
                      <span>{label}</span>
                      {brand ? <PartnerLogo brand={brand} height={20} paired /> : null}
                    </span>
                  );
                })}
            </p>
            {page === 'home' ? (
              <a className="link link--underlined footer__pf" href={PORTFOLIO_URL} onPointerEnter={prefetchPortfolio} onFocus={prefetchPortfolio}>
                {t('nav.portfolio')}
              </a>
            ) : (
              <a className="link link--underlined footer__pf" href="/">
                {t('nav.home')}
              </a>
            )}
          </div>
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

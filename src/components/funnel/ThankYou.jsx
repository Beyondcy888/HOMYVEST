import { useT } from '../../i18n/useT.js';
import { buildLeadWhatsAppMessage, whatsAppUrl, formatPhoneDisplay } from '../../lib/leads/leads.ts';
import { PORTFOLIO_URL } from '../../lib/page.js';
import { useFunnel } from './useFunnelStore.js';
import { WhatsApp, ArrowRight } from '../ui/Icons.jsx';

/** The answers as a lead form, for the prefilled WhatsApp messages. */
export function leadFormFrom({ lang, phone, funding, form }) {
  return { lang, phone, funding, ...form };
}

/** Saved (U01_02 §8): a check mark that draws itself, a personal thank-you, and three ways on. */
export default function ThankYou({ titleRef, onCalculator }) {
  const { t, lang } = useT();
  const sentTo = useFunnel((s) => s.sentTo);
  const lastForm = useFunnel((s) => s.lastForm);
  const lastFunding = useFunnel((s) => s.lastFunding);
  const name = (lastForm?.name ?? '').trim();
  const firstName = name.split(/\s+/)[0] || name;
  const href = whatsAppUrl(buildLeadWhatsAppMessage(leadFormFrom({ lang, phone: sentTo ?? '', funding: lastFunding, form: lastForm ?? {} }), lang));
  return (
    <div className="fstep fresult">
      <svg className="fresult__check" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="30" />
        <path d="M19 33.5 28 42.5 46 23.5" />
      </svg>
      <h2 id="funnel-title" ref={titleRef} tabIndex={-1} className="fstep__title">
        {t('funnel.thanks.title', { firstName })}
      </h2>
      <p className="fstep__intro">{t('funnel.thanks.body', { phone: sentTo ? formatPhoneDisplay(sentTo) : '' })}</p>
      <div className="fresult__actions">
        <a className="btn btn--block" href={href} target="_blank" rel="noopener" data-wa>
          <WhatsApp />
          <span>{t('funnel.thanks.whatsapp')}</span>
          <span className="sr-only"> ({t('wa.newTab')})</span>
        </a>
        <button type="button" className="btn btn--ghost btn--block" onClick={onCalculator}>
          {t('funnel.thanks.calc')}
        </button>
        <a className="link fresult__pf" href={PORTFOLIO_URL}>
          {t('funnel.thanks.portfolio')}
          <ArrowRight />
        </a>
      </div>
    </div>
  );
}

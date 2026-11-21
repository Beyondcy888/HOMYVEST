import { useT } from '../../i18n/useT.js';
import { buildLeadWhatsAppMessage, whatsAppUrl } from '../../lib/leads/leads.ts';
import { useFunnel } from './useFunnelStore.js';
import { leadFormFrom } from './ThankYou.jsx';
import { WhatsApp } from '../ui/Icons.jsx';

/**
 * When the answers could not be saved, WhatsApp takes over with everything already written (U01_02 §7):
 *  - 'handoff' the site has no Supabase settings
 *  - 'error'   saving failed: send on WhatsApp, or try again
 *  - 'rate'    this number has sent several times in the last minutes
 */
export default function Handoff({ variant, titleRef, onRetry }) {
  const { t, lang } = useT();
  const phone = useFunnel((s) => s.phone);
  const funding = useFunnel((s) => s.funding);
  const form = useFunnel((s) => s.form);
  const href = whatsAppUrl(buildLeadWhatsAppMessage(leadFormFrom({ lang, phone, funding, form }), lang));
  // the rate note is one friendly sentence: it is the heading, with no body under it
  const title = variant === 'error' ? t('funnel.error.title') : variant === 'rate' ? t('funnel.rate.body') : t('funnel.handoff.title');
  const body = variant === 'error' ? t('funnel.error.body') : variant === 'rate' ? null : t('funnel.handoff.body');
  return (
    <div className="fstep fresult" data-variant={variant}>
      <h2 id="funnel-title" ref={titleRef} tabIndex={-1} className="fstep__title">
        {title}
      </h2>
      {body ? <p className="fstep__intro">{body}</p> : null}
      <div className="fresult__actions">
        <a className="btn btn--block" href={href} target="_blank" rel="noopener" data-wa data-handoff>
          <WhatsApp />
          <span>{t('funnel.handoff.button')}</span>
          <span className="sr-only"> ({t('wa.newTab')})</span>
        </a>
        {variant === 'error' ? (
          <button type="button" className="btn btn--ghost btn--block" onClick={onRetry}>
            {t('funnel.error.retry')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

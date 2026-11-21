// §5 of /portofolio/: back to the visitor's own land (U01_04 §1). "Leave your number" opens the main page
// with the number field focused; WhatsApp is the same prefilled link as everywhere else.
import { useT } from '../../i18n/useT.js';
import { Button, WhatsAppButton } from '../../components/ui/Button.jsx';

export default function Closing() {
  const { t } = useT();
  return (
    <section id="closing" className="pf-close" aria-labelledby="pf-close-title">
      <div className="wrap pf-close__inner">
        <h2 id="pf-close-title" className="pf-close__title">
          {t('pf.close.title')}
        </h2>
        <div className="pf-close__actions">
          <Button href="/?focus=phone">{t('next.leaveNumber')}</Button>
          <WhatsAppButton variant="ghost" label={t('wa.hero')} />
        </div>
        <a className="link pf-close__back" href="/">
          {t('pf.close.back')}
        </a>
      </div>
    </section>
  );
}

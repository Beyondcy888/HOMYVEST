import { useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/useT.js';
import { normalizePhone, formatPhoneDisplay, recordLeadStart, collectSource } from '../../lib/leads/leads.ts';
import { loadSupabase, softFormatPhone, uuid } from '../../lib/leads/client.js';
import { isCoarsePointer } from '../../lib/device/tier.js';
import { useFunnel } from './useFunnelStore.js';
import { loadPanel } from './FunnelHost.jsx';
import './funnel.css';

/**
 * Step 1 of 3, in the hero (U01_02 §2): the phone number. A valid number records a lead start (fire and
 * forget, never blocks) and opens the panel at the funding question. After a successful send the card
 * shows "We'll be in touch at …" instead, until the page reloads.
 */
export default function HeroPhone() {
  const { t, lang } = useT();
  const phone = useFunnel((s) => s.phone);
  const sentTo = useFunnel((s) => s.sentTo);
  const start = useFunnel((s) => s.start);
  const [value, setValue] = useState(() => (phone ? softFormatPhone(phone) : ''));
  const [error, setError] = useState(false);
  const [opening, setOpening] = useState(false);
  const input = useRef(null);
  const timer = useRef(0);

  // A restored session (or a "Change" from the panel) shows the number already entered.
  useEffect(() => {
    if (phone) setValue((v) => (normalizePhone(v) === phone ? v : softFormatPhone(phone)));
  }, [phone]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const warm = () => {
    loadSupabase();
    loadPanel().catch(() => undefined);
  };

  const onFocus = () => {
    warm();
    // phones: keep the field in view above the keyboard
    if (isCoarsePointer()) window.setTimeout(() => input.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320);
  };

  const onChange = (e) => {
    const el = e.target;
    const atEnd = el.selectionStart === el.value.length;
    // Format only while typing at the end; an edit in the middle keeps the caret where it is (formatted on blur).
    setValue(atEnd ? softFormatPhone(el.value) : el.value);
    if (error) setError(false);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const normalized = normalizePhone(value);
    if (!normalized) {
      setError(true);
      input.current?.focus();
      return;
    }
    setError(false);
    setValue(softFormatPhone(normalized));
    const state = useFunnel.getState();
    const isNewStart = state.phone !== normalized || !state.startId;
    const id = uuid();
    start(normalized, id);
    if (isNewStart) {
      const source = collectSource(window.location, document.referrer);
      loadSupabase()
        .then((client) => recordLeadStart(client, { id, phone: normalized, lang, source }))
        .catch(() => undefined);
    }
    // a short spinner while the panel opens; never waits on the network
    setOpening(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpening(false), 300);
  };

  if (sentTo) {
    return (
      <div className="phone phone--done" role="status" tabIndex={-1}>
        <p className="phone__done">{t('funnel.phone.done', { phone: formatPhoneDisplay(sentTo) })}</p>
      </div>
    );
  }

  const describedBy = ['hero-phone-prefix', 'hero-phone-privacy', error ? 'hero-phone-error' : null].filter(Boolean).join(' ');
  return (
    <form className="phone" onSubmit={onSubmit} noValidate>
      <label className="phone__label" htmlFor="hero-phone">
        {t('funnel.phone.label')}
      </label>
      <div className="phone__row">
        <div className="phone__field" data-invalid={error || undefined}>
          <span className="phone__prefix nums" id="hero-phone-prefix">
            +62
          </span>
          <input
            ref={input}
            id="hero-phone"
            className="phone__input nums"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={t('funnel.phone.placeholder')}
            value={value}
            maxLength={20}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={() => value && setValue(softFormatPhone(value))}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
          />
        </div>
        <button id="hero-continue" type="submit" className="btn phone__go" data-busy={opening || undefined}>
          <span className="phone__go-label">{t('funnel.phone.continue')}</span>
          {opening ? <span className="phone__spinner" aria-hidden="true" /> : null}
        </button>
      </div>
      <p id="hero-phone-error" className="phone__error" aria-live="polite">
        {error ? t('funnel.phone.error') : ''}
      </p>
      <p id="hero-phone-privacy" className="phone__privacy">
        {t('funnel.phone.privacy')}
      </p>
    </form>
  );
}

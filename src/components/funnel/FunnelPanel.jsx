// The funnel panel (U01_02 §3): a right-side sheet on desktop, a full-screen sheet on phones. A dialog with a
// focus trap; Esc closes and focus returns to the hero. The page behind does not scroll while it is open.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { gsap } from 'gsap';
import { useT } from '../../i18n/useT.js';
import { useUi } from '../../lib/ui/store.js';
import { lockScroll, unlockScroll, scrollToTarget } from '../../lib/scroll/lenis.js';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';
import { useCalc } from '../../lib/calc/store.ts';
import { validateLead, submitLead, calcSnapshot, collectSource, buildLeadWhatsAppMessage, whatsAppUrl } from '../../lib/leads/leads.ts';
import { loadSupabase, genericWhatsAppHref } from '../../lib/leads/client.js';
import Wordmark from '../brand/Wordmark.jsx';
import PartnerLogo from '../brand/PartnerLogo.jsx';
import { Close, WhatsApp } from '../ui/Icons.jsx';
import { useFunnel } from './useFunnelStore.js';
import StepFunding from './StepFunding.jsx';
import StepBuild from './StepBuild.jsx';
import StepNeeds from './StepNeeds.jsx';
import ThankYou, { leadFormFrom } from './ThankYou.jsx';
import Handoff from './Handoff.jsx';
import { FOCUS_ID } from './fields.jsx';
import './funnel.css';

// The order fields appear in, per path, so the first invalid one gets the focus.
const BUILD_ORDER = ['name', 'owned', 'ownedOther', 'build', 'buildOther', 'cities', 'cityOther'];
const NEEDS_ORDER = ['need', 'needOther', 'name', 'cities', 'cityOther'];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), [tabindex="0"]';

let warnedNotConfigured = false;

export default function FunnelPanel() {
  const { t, lang } = useT();
  const { open, step, dir, funding, form, sending } = useFunnel(
    useShallow((s) => ({ open: s.open, step: s.step, dir: s.dir, funding: s.funding, form: s.form, sending: s.sending })),
  );
  const [shown, setShown] = useState(false);
  const [live, setLive] = useState('');
  const root = useRef(null);
  const sheet = useRef(null);
  const body = useRef(null);
  const content = useRef(null);
  const titleRef = useRef(null);
  // where the focus goes when the panel closes (null: leave it, e.g. when we scroll to the land check)
  const returnTo = useRef('#hero-continue');
  const answering = step === 2 || step === 3;
  const buildPath = funding === 'bank_loan' || funding === 'personal_funds';

  const close = useCallback(() => {
    returnTo.current = '#hero-continue';
    useFunnel.getState().close();
  }, []);

  // A frame between mounting and showing, so the sheet slides in rather than appearing.
  useEffect(() => {
    if (!open) {
      setShown(false);
      return undefined;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  // While open: the page stays still, the floating WhatsApp button hides, Tab stays inside, Esc closes.
  useEffect(() => {
    if (!open) return undefined;
    lockScroll();
    useUi.getState().setFunnelOpen(true);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab' || !sheet.current) return;
      const items = [...sheet.current.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = sheet.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockScroll();
      useUi.getState().setFunnelOpen(false);
      const target = returnTo.current ? (document.querySelector(returnTo.current) ?? document.querySelector('.phone--done')) : null;
      target?.focus?.({ preventScroll: true });
    };
  }, [open, close]);

  // Phones: the sheet follows the visual viewport, so its footer (and the primary button) stays above the keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    const el = root.current;
    if (!open || !vv || !el) return undefined;
    const apply = () => {
      el.style.setProperty('--vvh', `${Math.round(vv.height)}px`);
      el.style.setProperty('--vvt', `${Math.round(vv.offsetTop)}px`);
    };
    apply();
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
    return () => {
      vv.removeEventListener('resize', apply);
      vv.removeEventListener('scroll', apply);
    };
  }, [open]);

  // Each step slides in from the side it comes from (forward: from the right); reduced motion: a fade.
  // The step's heading takes the focus, so screen readers hear where they are.
  useLayoutEffect(() => {
    if (!shown) return;
    if (body.current) body.current.scrollTop = 0;
    const el = content.current;
    if (el) {
      // opacity, not autoAlpha: autoAlpha hides with visibility, and a hidden heading cannot take the focus
      const from = prefersReducedMotion() ? { opacity: 0 } : { opacity: 0, x: 44 * (dir || 1) };
      gsap.fromTo(el, from, { opacity: 1, x: 0, duration: 0.35, ease: 'expo.out', overwrite: true, clearProps: 'transform' });
    }
    // With reduced motion every element carries a tiny transition (base.css), so in this very frame the panel's
    // contents may still count as hidden and refuse the focus: try again on the next frames until it takes.
    let raf = 0;
    let tries = 0;
    const focusTitle = () => {
      const title = titleRef.current;
      if (!title) return;
      title.focus({ preventScroll: true });
      if (document.activeElement !== title && (tries += 1) < 6) raf = requestAnimationFrame(focusTitle);
    };
    focusTitle();
    return () => cancelAnimationFrame(raf);
    // only when the step (or visibility) changes: picking an option must not move the focus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, shown]);

  const announce = (message) => {
    setLive('');
    requestAnimationFrame(() => setLive(message));
  };

  const focusFirst = (errors) => {
    const order = buildPath ? BUILD_ORDER : NEEDS_ORDER;
    const key = order.find((k) => errors[k]);
    if (key) requestAnimationFrame(() => document.getElementById(FOCUS_ID[key])?.focus());
  };

  const toStep3 = (value) => {
    const s = useFunnel.getState();
    if (!(value ?? s.funding)) {
      s.setErrors({ funding: 'chooseOne' });
      announce(t('funnel.err.summary'));
      requestAnimationFrame(() => document.getElementById('f-funding-0')?.focus());
      return;
    }
    s.goStep(3);
  };

  const send = async () => {
    const s = useFunnel.getState();
    if (s.sending) return;
    const calc = useCalc.getState();
    const lead = {
      ...leadFormFrom({ lang, phone: s.phone, funding: s.funding, form: s.form }),
      startId: s.startId,
      // the land check comes along only if the visitor actually used it
      calc: calc.touched ? calcSnapshot(calc.land, calc.ideas, calc.ui.selectedIdea) : null,
      source: collectSource(window.location, document.referrer),
      userAgent: navigator.userAgent,
      openedAt: s.openedAt ?? undefined,
    };
    const errors = validateLead(lead);
    if (Object.keys(errors).length) {
      s.setErrors(errors);
      announce(t('funnel.err.summary'));
      focusFirst(errors);
      return;
    }
    s.setSending(true);
    let res;
    try {
      res = await submitLead(await loadSupabase(), lead);
    } catch {
      res = { ok: false, reason: 'failed' };
    }
    const now = useFunnel.getState();
    if (res.ok) {
      now.result('done');
    } else if (res.reason === 'invalid') {
      now.setSending(false);
      now.setErrors(res.errors);
      announce(t('funnel.err.summary'));
      focusFirst(res.errors);
    } else if (res.reason === 'not_configured') {
      if (!warnedNotConfigured) {
        warnedNotConfigured = true;
        console.warn('[funnel] Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY): handing over to WhatsApp.');
      }
      now.result('handoff');
    } else {
      now.result(res.reason === 'rate_limited' ? 'rate' : 'error');
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (step === 2) toStep3();
    else if (step === 3) send();
  };

  const changePhone = () => {
    returnTo.current = '#hero-phone';
    useFunnel.getState().changePhone();
  };
  const toCalculator = () => {
    returnTo.current = null;
    useFunnel.getState().finish();
    // after the scroll lock has been released
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToTarget('#calculator')));
  };

  const n = step === 2 ? 2 : 3;
  const waHref = step === 3 ? whatsAppUrl(buildLeadWhatsAppMessage(leadFormFrom({ lang, phone: useFunnel.getState().phone, funding, form }), lang)) : genericWhatsAppHref(lang);

  let view;
  if (step === 2) view = <StepFunding titleRef={titleRef} onChangePhone={changePhone} onContinue={toStep3} />;
  else if (step === 3) view = buildPath ? <StepBuild titleRef={titleRef} onChangePhone={changePhone} /> : <StepNeeds titleRef={titleRef} onChangePhone={changePhone} />;
  else if (step === 'done') view = <ThankYou titleRef={titleRef} onCalculator={toCalculator} />;
  else view = <Handoff variant={step} titleRef={titleRef} onRetry={() => useFunnel.getState().goStep(3)} />;

  return (
    <div ref={root} className="funnel" data-open={shown} data-step={step} inert={!shown || undefined}>
      <div className="funnel__dim" onClick={close} aria-hidden="true" />
      <div ref={sheet} className="funnel__sheet" role="dialog" aria-modal="true" aria-labelledby="funnel-title">
        <header className="funnel__head">
          <div className="funnel__brand">
            <Wordmark as="span" interactive={false} aria-label="HOMYVEST" className="funnel__mark" />
            <span className="funnel__powered">{t('funnel.panel.poweredBy')}</span>
            <PartnerLogo brand="homyeight" height={17} className="funnel__logo" />
          </div>
          <button type="button" className="funnel__close" onClick={close}>
            <span className="sr-only">{t('funnel.panel.close')}</span>
            <Close />
          </button>
          <div className="funnel__progress" data-done={!answering || undefined}>
            <span className="funnel__segs" aria-hidden="true">
              {[1, 2, 3].map((i) => (
                <span key={i} className="funnel__seg" data-on={i <= n || undefined} />
              ))}
            </span>
            {answering ? <span className="funnel__count nums">{t('funnel.panel.step', { n })}</span> : null}
          </div>
        </header>

        <div ref={body} className="funnel__body" data-lenis-prevent>
          <form id="funnel-form" className="funnel__form" onSubmit={onSubmit} noValidate>
            <div ref={content} className="funnel__content" key={String(step)}>
              {view}
            </div>
          </form>
        </div>

        {answering ? (
          <footer className="funnel__foot">
            <div className="funnel__actions">
              {step === 3 ? (
                <button type="button" className="funnel__back" onClick={() => useFunnel.getState().goStep(2)}>
                  {t('funnel.panel.back')}
                </button>
              ) : null}
              <button
                type="submit"
                form="funnel-form"
                className="btn funnel__primary"
                disabled={(step === 2 && !funding) || sending}
                aria-busy={sending || undefined}
              >
                {step === 2 ? t('funnel.panel.continue') : sending ? t('funnel.panel.sending') : t('funnel.panel.send')}
              </button>
            </div>
            <a className="funnel__chat" href={waHref} target="_blank" rel="noopener" data-wa>
              <WhatsApp />
              <span>{t('funnel.panel.chat')}</span>
              <span className="sr-only"> ({t('wa.newTab')})</span>
            </a>
          </footer>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </div>
  );
}

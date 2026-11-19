// Small building blocks of the calculator UI.
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useT } from '../../i18n/useT.js';
import { useUi } from '../../lib/ui/store.js';
import { useCalc } from '../../lib/calc/store.ts';
import { prefersReducedMotion } from '../../lib/device/useReducedMotion.js';
import { getLenis } from '../../lib/scroll/lenis.js';
import {
  fmtArea, fmtInput, fmtKlb, fmtMetres, fmtMoney, fmtMoneyInput, fmtMoneyShort, fmtNum, fmtPct,
  moneyShortUnit, parseDecimal, parseMoney,
} from '../../i18n/format.js';
import { WhatsAppButton } from '../../components/ui/Button.jsx';
import { Check, Edit, Warning as WarningIcon } from '../../components/ui/Icons.jsx';

/** Shared focus behaviour: hide the floating WhatsApp button while typing, and tell the 3D which rule is being edited. */
function useFieldFocus(rule) {
  const setInputFocused = useUi((s) => s.setInputFocused);
  const setFocusRule = useCalc((s) => s.setFocusRule);
  return {
    onFocus: () => {
      setInputFocused(true);
      if (rule) setFocusRule(rule);
    },
    onBlur: () => {
      setInputFocused(false);
      if (rule) setFocusRule(null);
    },
  };
}

/**
 * Numeric field. Accepts "," or "." as the decimal separator in both languages. An empty field counts
 * as 0 in the calculation but stays visually empty. Negative values count as 0.
 */
export function Field({ id, label, unit, help, value, onChange, rule, optional = false, tag, className = '' }) {
  const { lang } = useT();
  const auto = useId();
  const fieldId = id ?? auto;
  const show = (v) => (v === '' || v === 0 ? (optional || v === '' ? '' : '0') : fmtInput(v, lang));
  const [draft, setDraft] = useState(() => show(value));
  const focused = useRef(false);
  const focus = useFieldFocus(rule);

  // Follow the store when it changes from outside (preset, reset, language) and the visitor isn't typing here.
  useEffect(() => {
    if (!focused.current) setDraft(show(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, lang]);

  return (
    <div className={`field ${className}`} onMouseEnter={rule ? focus.onFocus : undefined} onMouseLeave={rule ? focus.onBlur : undefined}>
      <label htmlFor={fieldId} className="field__label">
        {label}
        {tag ? <span className="field__tag">{tag}</span> : null}
      </label>
      <div className="field__box">
        <input
          id={fieldId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={draft}
          aria-describedby={help ? `${fieldId}-help` : undefined}
          onChange={(e) => {
            const text = e.target.value.replace(/[^\d.,]/g, '');
            setDraft(text);
            onChange(optional && text.trim() === '' ? '' : parseDecimal(text));
          }}
          onFocus={() => {
            focused.current = true;
            focus.onFocus();
          }}
          onBlur={() => {
            focused.current = false;
            focus.onBlur();
            setDraft(show(optional && draft.trim() === '' ? '' : parseDecimal(draft)));
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        {unit ? (
          <span className="field__unit" aria-hidden="true">
            {unit}
          </span>
        ) : null}
      </div>
      {help ? (
        <p id={`${fieldId}-help`} className="field__help">
          {help}
        </p>
      ) : null}
    </div>
  );
}

/** Money field: digits only, thousand separators while typing, caret kept in a sensible place. */
export function MoneyField({ id, label, help, value, onChange, tag, className = '' }) {
  const { lang } = useT();
  const auto = useId();
  const fieldId = id ?? auto;
  const ref = useRef(null);
  const caret = useRef(null);
  const focus = useFieldFocus();
  const text = fmtMoneyInput(value, lang);

  // After React re-renders the formatted value, put the caret back after the same number of digits.
  useLayoutEffect(() => {
    const el = ref.current;
    if (caret.current === null || !el || document.activeElement !== el) return;
    let digits = 0;
    let pos = el.value.length;
    for (let i = 0; i < el.value.length; i++) {
      if (digits === caret.current) {
        pos = i;
        break;
      }
      if (/\d/.test(el.value[i])) digits += 1;
    }
    el.setSelectionRange(pos, pos);
    caret.current = null;
  });

  return (
    <div className={`field field--money ${className}`}>
      <label htmlFor={fieldId} className="field__label">
        {label}
        {tag ? <span className="field__tag">{tag}</span> : null}
      </label>
      <div className="field__box">
        <span className="field__unit field__unit--lead" aria-hidden="true">
          Rp
        </span>
        <input
          ref={ref}
          id={fieldId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="done"
          value={text}
          aria-describedby={help ? `${fieldId}-help` : undefined}
          onChange={(e) => {
            const before = e.target.value.slice(0, e.target.selectionStart ?? e.target.value.length);
            caret.current = before.replace(/\D/g, '').length;
            onChange(parseMoney(e.target.value));
          }}
          onFocus={focus.onFocus}
          onBlur={focus.onBlur}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </div>
      {help ? (
        <p id={`${fieldId}-help`} className="field__help">
          {help}
        </p>
      ) : null}
    </div>
  );
}

/** Short money with its full value on hover and the unit spoken in full ("Rp 5.35 billion"). */
export function MoneyShort({ value }) {
  const { lang } = useT();
  const short = fmtMoneyShort(value, lang);
  const unit = moneyShortUnit(value, lang);
  const spoken = unit ? short.replace(/\s\S+$/, ` ${unit}`) : short;
  return (
    <abbr className="nums" title={fmtMoney(value, lang)} aria-label={spoken}>
      {short}
    </abbr>
  );
}

/** Fills {placeholders} in a translated sentence with React nodes. */
export function rich(template, nodes) {
  return template.split(/(\{\w+\})/g).map((part, i) => {
    const m = part.match(/^\{(\w+)\}$/);
    return m && m[1] in nodes ? <span key={i}>{nodes[m[1]]}</span> : part;
  });
}

/** An area that rolls smoothly to its new value as inputs change (tabular figures). */
export function RollingArea({ value, className = '' }) {
  const { lang } = useT();
  const ref = useRef(null);
  const shown = useRef(value);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion() || shown.current === value) {
      shown.current = value;
      el.textContent = fmtArea(value, lang);
      return undefined;
    }
    const state = { v: shown.current };
    const tween = gsap.to(state, {
      v: value,
      duration: 0.5,
      ease: 'power3.out',
      onUpdate: () => {
        shown.current = state.v;
        el.textContent = fmtArea(state.v, lang);
      },
      onComplete: () => {
        shown.current = value;
        el.textContent = fmtArea(value, lang);
      },
    });
    return () => tween.kill();
  }, [value, lang]);
  return (
    <span ref={ref} className={`nums ${className}`}>
      {fmtArea(value, lang)}
    </span>
  );
}

/** Land split bar: building / green / open. Three segments that add up to 100%, styled like the 3D zones. */
export function SplitBar({ r }) {
  const { t, lang } = useT();
  const parts = [
    { key: 'building', share: r.fp / r.A, area: r.fp },
    { key: 'green', share: r.greenMin / r.A, area: r.greenMin },
    { key: 'open', share: Math.max(0, r.open / r.A), area: r.open },
  ];
  return (
    <div className="split" data-rule-target>
      <div className="split__bar" role="img" aria-label={`${t('calc.legend.title')}: ${parts.map((p) => `${t(`calc.legend.${p.key}`)} ${fmtPct(p.share * 100, lang)}`).join(', ')}`}>
        {parts.map((p) => (
          <i key={p.key} className={`split__seg zone-${p.key}`} style={{ flexGrow: Math.max(p.share, 0.0001) }} />
        ))}
      </div>
      <ul className="split__legend">
        {parts.map((p) => (
          <li key={p.key}>
            <i className={`split__key zone-${p.key}`} />
            <span>{t(`calc.legend.${p.key}`)}</span>
            <span className="nums split__pct">{fmtPct(p.share * 100, lang)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Warning: ink, an icon and a diagonal hatch. Never red (docs/03 §3). */
export function Notice({ children, tone = 'warn' }) {
  return (
    <p className={`notice notice--${tone}`} role={tone === 'warn' ? 'status' : undefined}>
      {tone === 'warn' ? <WarningIcon /> : null}
      <span>{children}</span>
    </p>
  );
}

/**
 * Gauge for step 3: current value, status, a bar with a marker at the limit, one explanatory line.
 * Scale max = max(limit × 1.5, value × 1.1). `atLeast` flips the rule (KDH is OK when ≥ limit).
 */
export function Gauge({ name, value, limit, ok, format, line, atLeast = false, rule }) {
  const { t } = useT();
  const max = Math.max(limit * 1.5, value * 1.1, 0.0001);
  const pos = (v) => `${Math.min(100, (v / max) * 100)}%`;
  const setFocusRule = useCalc((s) => s.setFocusRule);
  return (
    <div className="gauge" data-ok={ok} onMouseEnter={() => setFocusRule(rule)} onMouseLeave={() => setFocusRule(null)}>
      <div className="gauge__top">
        <span className="gauge__name">{name}</span>
        <span className="gauge__value nums">{format(value)}</span>
        <span className="gauge__status">
          {ok ? <Check /> : <WarningIcon />}
          {ok ? t('calc.s3.g.ok') : t('calc.s3.g.over')}
        </span>
      </div>
      <div className="gauge__track" aria-hidden="true">
        <i className={`gauge__fill ${ok ? '' : 'hatch'}`} style={{ width: pos(value) }} />
        {atLeast ? <i className="gauge__need" style={{ left: 0, width: pos(limit) }} /> : null}
        <i className="gauge__mark" style={{ left: pos(limit) }} />
      </div>
      <div className="gauge__foot">
        <span>{line}</span>
        <span className="nums muted">{t('calc.s3.g.limit', { v: format(limit) })}</span>
      </div>
    </div>
  );
}

/** Summary of the land in use on steps 2 and 3, with a way back to change it. */
export function LandChip({ r, onEdit }) {
  const { t, lang } = useT();
  if (!r) return null;
  return (
    <p className="chip">
      <span className="chip__label">{t('calc.s2.landChip')}</span>
      <span className="nums">
        {fmtNum(r.P, lang, Number.isInteger(r.P) ? 0 : 1)} × {fmtMetres(r.L, lang)} · {fmtArea(r.A, lang)} · KDB {fmtPct(r.kdb, lang)} · KLB {fmtKlb(r.klb, lang)} · KDH {fmtPct(r.kdh, lang)}
      </span>
      <button type="button" className="chip__edit link link--underlined" onClick={onEdit}>
        <Edit />
        {t('calc.s2.edit')}
      </button>
    </p>
  );
}

/** After results: the WhatsApp handoff, carrying the visitor's numbers. */
export function ResultsCta() {
  const { t } = useT();
  return (
    <div className="calc-cta">
      <h4 className="t-h3">{t('calc.cta.title')}</h4>
      <WhatsAppButton label={t('wa.calc')} className="calc-cta__btn" />
      <p className="t-small muted">{t('calc.cta.note')}</p>
    </div>
  );
}

/** "How this is calculated": the formulas in plain language. */
export function How({ step }) {
  const { t } = useT();
  return (
    <details
      className="how"
      onToggle={() => window.setTimeout(() => getLenis()?.resize(), 50)}
    >
      <summary>{t('calc.how')}</summary>
      <p>{t('calc.howText')[step - 1]}</p>
    </details>
  );
}

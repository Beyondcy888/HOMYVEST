import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useT } from '../../i18n/useT.js';
import { useCalc, shareInput } from '../../lib/calc/store.ts';
import { buildWhatsAppMessage, whatsAppUrl } from '../../lib/calc/whatsapp.ts';
import { WhatsApp } from './Icons.jsx';

/**
 * Primary button. On hover the label slides up and is replaced by a copy of itself.
 * variant: 'primary' | 'ghost' | 'on-photo' | 'ghost-on-photo'
 */
export function Button({ as: Tag = 'a', variant = 'primary', compact, block, icon, children, className = '', ...rest }) {
  const cls = [
    'btn',
    variant !== 'primary' && `btn--${variant}`,
    compact && 'btn--compact',
    block && 'btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={cls} {...(Tag === 'button' ? { type: 'button' } : {})} {...rest}>
      {icon}
      <span className="btn__label">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
    </Tag>
  );
}

/** The prefilled WhatsApp link. Carries calculator results once the visitor has used the calculator. */
export function useWhatsApp() {
  const { lang } = useT();
  // Select stable references only (a selector that builds a new object every call would loop).
  const s = useCalc(
    useShallow((st) => ({ land: st.land, ideas: st.ideas, check: st.check, ui: st.ui, touched: st.touched })),
  );
  const href = useMemo(() => whatsAppUrl(buildWhatsAppMessage({ lang, ...shareInput(s) })), [lang, s]);
  const hasResults = s.touched && s.land.P > 0 && s.land.L > 0;
  return { href, hasResults };
}

/** WhatsApp button: primary style with a small monochrome glyph. Always opens in a new tab. */
export function WhatsAppButton({ label, variant, compact, block, className, glyph = true }) {
  const { t } = useT();
  const { href } = useWhatsApp();
  return (
    <Button
      href={href}
      target="_blank"
      rel="noopener"
      variant={variant}
      compact={compact}
      block={block}
      className={className}
      data-wa
      icon={glyph ? <WhatsApp /> : null}
    >
      {label}
      <span className="sr-only"> ({t('wa.newTab')})</span>
    </Button>
  );
}

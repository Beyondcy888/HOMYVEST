// Lazy access to the Supabase client and small helpers for the funnel. The client (and supabase-js with it)
// loads only when the visitor starts the funnel: on first focus of the phone field or on "Continue".
import { buildWhatsAppMessage, whatsAppUrl } from '../calc/whatsapp.ts';
import { DEFAULTS } from '../calc/store.ts';

let clientPromise = null;

/** Resolves to the Supabase client, or null when the site has no Supabase settings (or the chunk fails). */
export function loadSupabase() {
  clientPromise ??= import('./supabase.ts').then(
    (m) => m.supabase,
    () => {
      clientPromise = null; // a failed chunk load may succeed later
      return null;
    },
  );
  return clientPromise;
}

/** A random v4 UUID. crypto.randomUUID is missing on plain-http origins (e.g. testing on a phone over the LAN). */
export function uuid() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  const b = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') crypto.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** The generic WhatsApp link (docs/07 §12): no answers, no calculator results. */
export const genericWhatsAppHref = (lang) =>
  whatsAppUrl(buildWhatsAppMessage({ lang, land: { ...DEFAULTS.land, P: 0 }, ideas: DEFAULTS.ideas, check: DEFAULTS.check }));

/**
 * Soft display format for the phone field, as typed: "0812-3456-7890" or "812-3456-7890". A pasted
 * "+62 812…" or "62812…" drops the country code, which is already shown in front of the field.
 */
export function softFormatPhone(raw) {
  let d = String(raw ?? '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1).startsWith('62') ? d.slice(3) : d.slice(1);
  else if (d.startsWith('62') && d.length > 9) d = d.slice(2);
  d = d.replace(/\D/g, '').slice(0, 13);
  const head = d.startsWith('0') ? 4 : 3;
  const parts = [d.slice(0, head), d.slice(head, head + 4), d.slice(head + 4)].filter(Boolean);
  return parts.join('-');
}

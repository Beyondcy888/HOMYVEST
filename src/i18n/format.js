// All number formatting goes through here (components never call toLocaleString directly).
// The calculator formatters are re-exported untouched from the locked engine.
export { fmtArea, fmtPct, fmtKlb, fmtYears, fmtMoney, fmtMoneyShort } from '../lib/calc/calc.ts';

const loc = (lang) => (lang === 'id' ? 'id-ID' : 'en-US');

/** Plain number with locale separators. `digits` = fixed decimals. */
export const fmtNum = (v, lang, digits = 0) =>
  Number(v).toLocaleString(loc(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Number for an input field: locale separators, up to `maxDigits` decimals, no trailing zeros. */
export const fmtInput = (v, lang, maxDigits = 2) =>
  Number(v).toLocaleString(loc(lang), { maximumFractionDigits: maxDigits, useGrouping: false });

/** Metres with up to 2 decimals: "4.5 m" / "4,5 m". */
export const fmtMetres = (v, lang) => `${Number(v).toLocaleString(loc(lang), { maximumFractionDigits: 2 })} m`;

/** Parses what a visitor typed. Accepts "," or "." as the decimal separator in both languages. */
export function parseDecimal(text) {
  if (typeof text !== 'string') return 0;
  let s = text.trim().replace(/\s/g, '');
  if (!s) return 0;
  // If both separators appear, the last one is the decimal point and the other is grouping.
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    const dec = lastComma > lastDot ? ',' : '.';
    const grp = dec === ',' ? '.' : ',';
    s = s.split(grp).join('').replace(dec, '.');
  } else {
    s = s.replace(',', '.');
  }
  const v = Number.parseFloat(s);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

/** Money fields: digits only. */
export const parseMoney = (text) => {
  const digits = String(text ?? '').replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};
export const fmtMoneyInput = (v, lang) => (v > 0 ? Math.round(v).toLocaleString(loc(lang)) : '');

/** Full words for the short-money unit, for screen readers ("billion" / "miliar"). */
export function moneyShortUnit(v, lang) {
  if (v >= 1e12) return lang === 'id' ? 'triliun' : 'trillion';
  if (v >= 1e9) return lang === 'id' ? 'miliar' : 'billion';
  if (v >= 1e6) return lang === 'id' ? 'juta' : 'million';
  return '';
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.js';
import id from './id.js';
import { local, query } from '../lib/storage.js';

const DICTS = { en, id };
const KEY = 'homyvest:lang';
const I18nContext = createContext(null);

const lookup = (dict, key) => key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);

function initialLang() {
  const q = query('lang');
  if (q === 'en' || q === 'id') return q;
  const stored = local.get(KEY);
  return stored === 'id' || stored === 'en' ? stored : 'en';
}

const fill = (text, vars) =>
  vars && typeof text === 'string' ? text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m)) : text;

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  const setLang = useCallback((next) => {
    if (next !== 'en' && next !== 'id') return;
    local.set(KEY, next);
    setLangState(next);
  }, []);

  const t = useCallback(
    (key, vars) => {
      let value = lookup(DICTS[lang], key);
      if (value === undefined) {
        value = lookup(en, key);
        if (import.meta.env.DEV) console.warn(`[i18n] missing "${key}" in ${lang}`);
        if (value === undefined) return `[missing:${key}]`;
      }
      return fill(value, vars);
    },
    [lang],
  );

  // Keep <html lang>, the title and the description in step with the language.
  useEffect(() => {
    const dict = DICTS[lang];
    document.documentElement.lang = lang;
    document.title = dict.meta.title;
    const set = (selector, attr, value) => document.querySelector(selector)?.setAttribute(attr, value);
    set('meta[name="description"]', 'content', dict.meta.description);
    set('meta[property="og:title"]', 'content', dict.meta.title);
    set('meta[property="og:description"]', 'content', dict.meta.description);
    set('meta[property="og:image:alt"]', 'content', dict.meta.ogAlt);
    set('meta[name="twitter:title"]', 'content', dict.meta.title);
    set('meta[name="twitter:description"]', 'content', dict.meta.description);
    set('meta[property="og:locale"]', 'content', lang === 'id' ? 'id_ID' : 'en_US');
    set('meta[property="og:locale:alternate"]', 'content', lang === 'id' ? 'en_US' : 'id_ID');
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** `const { t, lang, setLang } = useT()` */
export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used inside <I18nProvider>');
  return ctx;
}

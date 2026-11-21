// The lead funnel's state (U01_02). The answers in progress live in sessionStorage under homyvest:funnel:v1,
// so closing and reopening the panel, or reloading the page, keeps them. A successful send clears them.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FUNDING, NEEDS, OWNED, BUILD, CITIES } from '../../lib/leads/leads.ts';
import { registry } from '../../lib/scroll/triggers.js';

export const FUNNEL_KEY = 'homyvest:funnel:v1';

const safeSession = {
  getItem: (name) => {
    try {
      return window.sessionStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.sessionStorage.setItem(name, value);
    } catch {
      /* storage blocked: keep going in memory */
    }
  },
  removeItem: (name) => {
    try {
      window.sessionStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export const EMPTY_FORM = {
  name: '',
  owned: [],
  ownedOther: '',
  build: [],
  buildOther: '',
  need: null,
  needOther: '',
  cities: [],
  cityOther: '',
  honeypot: '',
};

const initial = {
  /** Normalized "+628…" once the hero step has passed, else ''. */
  phone: '',
  /** Links the finished lead to the hero's lead_starts row. */
  startId: null,
  open: false,
  /** 2 | 3 while answering; 'done' | 'handoff' | 'error' | 'rate' after sending (never persisted). */
  step: 2,
  /** 1 forward, -1 back: the direction the step content slides. */
  dir: 1,
  funding: null,
  form: EMPTY_FORM,
  /** When the panel first opened (ms). Persisted, so a restored form sent quickly is not mistaken for a bot. */
  openedAt: null,
  errors: {},
  sending: false,
  /** After a successful send, the hero shows "We'll be in touch at …" instead of the field (until reload). */
  sentTo: null,
};

const pickFrom = (list, value) => (Array.isArray(value) ? value.filter((v) => list.includes(v)) : []);
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');

/** Accepts only well-formed restored state; anything odd falls back to a fresh start. */
function restore(raw) {
  try {
    if (!raw || typeof raw !== 'object') return null;
    const phone = typeof raw.phone === 'string' && /^\+628\d{7,11}$/.test(raw.phone) ? raw.phone : '';
    if (!phone) return null;
    const f = raw.form && typeof raw.form === 'object' ? raw.form : {};
    return {
      phone,
      startId: typeof raw.startId === 'string' && raw.startId.length <= 40 ? raw.startId : null,
      open: Boolean(raw.open),
      step: raw.step === 3 && FUNDING.includes(raw.funding) ? 3 : 2,
      funding: FUNDING.includes(raw.funding) ? raw.funding : null,
      openedAt: Number.isFinite(raw.openedAt) ? raw.openedAt : null,
      form: {
        name: str(f.name, 120),
        owned: pickFrom(OWNED, f.owned),
        ownedOther: str(f.ownedOther, 200),
        build: pickFrom(BUILD, f.build),
        buildOther: str(f.buildOther, 200),
        need: NEEDS.includes(f.need) ? f.need : null,
        needOther: str(f.needOther, 300),
        cities: pickFrom(CITIES, f.cities),
        cityOther: str(f.cityOther, 200),
        honeypot: '',
      },
    };
  } catch {
    return null;
  }
}

export const useFunnel = create()(
  persist(
    (set) => ({
      ...initial,

      /** The hero step passed: remember the number and open the panel at step 2 (or where the visitor left off). */
      start: (phone, startId) =>
        set((s) => {
          const samePhone = s.phone === phone;
          return {
            phone,
            startId: samePhone && s.startId ? s.startId : startId,
            open: true,
            // the same number picks up where the visitor left off; a corrected number keeps the answers too
            step: s.step === 2 || s.step === 3 ? s.step : s.funding ? 3 : 2,
            dir: 1,
            openedAt: s.openedAt ?? Date.now(),
            errors: {},
          };
        }),
      reopen: () => set((s) => ({ open: true, step: s.step === 2 || s.step === 3 ? s.step : 3, dir: 1, openedAt: s.openedAt ?? Date.now() })),
      close: () => set((s) => ({ open: false, sending: false, step: s.step === 2 || s.step === 3 ? s.step : s.funding ? 3 : 2 })),
      setFunding: (funding) => set((s) => ({ funding, errors: s.funding === funding ? s.errors : {} })),
      goStep: (step) => set((s) => ({ step, dir: step > (typeof s.step === 'number' ? s.step : 3) ? 1 : -1, errors: {} })),
      setField: (key, value) =>
        set((s) => {
          const errors = { ...s.errors };
          delete errors[key];
          // a changed choice also clears the error of its "Other" text, and vice versa
          if (key === 'owned') delete errors.ownedOther;
          if (key === 'build') delete errors.buildOther;
          if (key === 'cities') delete errors.cityOther;
          if (key === 'need') delete errors.needOther;
          return { form: { ...s.form, [key]: value }, errors };
        }),
      setErrors: (errors) => set({ errors }),
      setSending: (sending) => set({ sending }),
      /** Shows a result screen; 'done' also forgets the answers and remembers where we'll reach them. */
      result: (step) =>
        set((s) =>
          step === 'done'
            ? { ...initial, open: true, step: 'done', sentTo: s.phone, lastName: s.form.name, lastForm: { ...s.form }, lastFunding: s.funding }
            : { step, sending: false },
        ),
      /** After the thank-you screen closes. */
      finish: () => set((s) => ({ open: false, step: 2, sentTo: s.sentTo })),
      /** "Change" the number: back to the hero field. */
      changePhone: () => set((s) => ({ open: false, step: s.step === 2 || s.step === 3 ? s.step : s.funding ? 3 : 2 })),
    }),
    {
      name: FUNNEL_KEY,
      version: 1,
      storage: createJSONStorage(() => safeSession),
      // Result screens, errors, the sending flag and the post-send confirmation are never restored.
      partialize: (s) =>
        s.phone && s.step !== 'done'
          ? { phone: s.phone, startId: s.startId, open: s.open, step: s.step === 2 || !s.funding ? 2 : 3, funding: s.funding, form: s.form, openedAt: s.openedAt }
          : {},
      merge: (persisted, current) => {
        const ok = restore(persisted);
        return ok ? { ...current, ...ok } : current;
      },
    },
  ),
);

// QA hook: window.__homyvest.funnel is this store (used by the Playwright specs).
registry.funnel = useFunnel;

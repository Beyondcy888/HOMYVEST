// Calculator state. One object, persisted under `homyvest:calc:v1` (docs/05 §4).
// Storage is wrapped so a blocked or broken localStorage never breaks the page.
import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { Land, Ideas, Check, IdeaKey } from './calc.ts';

export const STORAGE_KEY = 'homyvest:calc:v1';

export type Step = 1 | 2 | 3;
export type Ui = { step: Step; selectedIdea: IdeaKey | null; usedStep3: boolean };

export const DEFAULTS: { land: Land; ideas: Ideas; check: Check; ui: Ui } = {
  land: { P: 30, L: 20, kdb: 60, klb: 2, kdh: 20, maxFloors: '' },
  ideas: {
    occ: 85,
    kos: { size: 18, rent: 1_200_000, cost: 4_500_000 },
    ruko: { width: 4.5, rent: 70_000_000, cost: 5_000_000 },
    rumah: { land: 100, floor: 70, rent: 2_500_000, cost: 4_500_000 },
    gudang: { rent: 50_000, cost: 3_500_000 },
  },
  check: { fp: 240, tfa: 480, green: 150 },
  ui: { step: 1, selectedIdea: null, usedStep3: false },
};

export const PRESETS = {
  template: { kdb: 60, klb: 2.0, kdh: 20 },
  resid: { kdb: 50, klb: 1.2, kdh: 30 },
  comm: { kdb: 70, klb: 4.0, kdh: 10 },
} as const;
export type PresetId = keyof typeof PRESETS;

type IdeaGroup = 'kos' | 'ruko' | 'rumah' | 'gudang';

export type CalcState = {
  land: Land;
  ideas: Ideas;
  check: Check;
  ui: Ui;
  /** Example prices the visitor has replaced (keys like "kos.rent"). Drives the "Example" tag. */
  edited: Record<string, true>;
  /** Not persisted. True once the visitor has actually used the calculator. */
  touched: boolean;
  /** Not persisted. Which rule the visitor is editing, so the 3D can highlight what it controls. */
  focusRule: 'kdb' | 'klb' | 'kdh' | null;

  setLand: (patch: Partial<Land>) => void;
  setOcc: (occ: number) => void;
  setIdea: (group: IdeaGroup, key: string, value: number) => void;
  setCheck: (patch: Partial<Check>) => void;
  setStep: (step: Step, opts?: { silent?: boolean }) => void;
  selectIdea: (key: IdeaKey | null, opts?: { silent?: boolean }) => void;
  applyPreset: (id: PresetId) => void;
  setFocusRule: (rule: CalcState['focusRule']) => void;
  reset: () => void;
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const safeStorage: StateStorage = {
  getItem: (name) => { try { return window.localStorage.getItem(name); } catch { return null; } },
  setItem: (name, value) => { try { window.localStorage.setItem(name, value); } catch { /* storage blocked: stay in memory */ } },
  removeItem: (name) => { try { window.localStorage.removeItem(name); } catch { /* ignore */ } },
};

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Returns a clean copy of persisted data, or null when anything looks wrong. */
export function validate(raw: unknown): Pick<CalcState, 'land' | 'ideas' | 'check' | 'ui' | 'edited'> | null {
  try {
    const s = raw as any;
    if (!s || typeof s !== 'object') return null;
    const { land, ideas, check, ui } = s;
    if (!land || !ideas || !check || !ui) return null;
    if (![land.P, land.L, land.kdb, land.klb, land.kdh].every(isNum)) return null;
    if (!(land.maxFloors === '' || isNum(land.maxFloors))) return null;
    if (!isNum(ideas.occ)) return null;
    for (const [g, keys] of Object.entries({ kos: ['size', 'rent', 'cost'], ruko: ['width', 'rent', 'cost'], rumah: ['land', 'floor', 'rent', 'cost'], gudang: ['rent', 'cost'] })) {
      if (!ideas[g] || !keys.every((k) => isNum(ideas[g][k]))) return null;
    }
    if (![check.fp, check.tfa, check.green].every(isNum)) return null;
    if (![1, 2, 3].includes(ui.step)) return null;
    if (!(ui.selectedIdea === null || ['kos', 'ruko', 'rumah', 'gudang'].includes(ui.selectedIdea))) return null;
    const edited: Record<string, true> = {};
    if (s.edited && typeof s.edited === 'object') for (const k of Object.keys(s.edited)) if (s.edited[k] === true) edited[k] = true;
    return {
      land: { P: land.P, L: land.L, kdb: land.kdb, klb: land.klb, kdh: land.kdh, maxFloors: land.maxFloors },
      ideas: clone(ideas), check: { fp: check.fp, tfa: check.tfa, green: check.green },
      ui: { step: ui.step, selectedIdea: ui.selectedIdea, usedStep3: Boolean(ui.usedStep3) }, edited,
    };
  } catch { return null; }
}

const sameAsDefaults = (s: Pick<CalcState, 'land' | 'ideas' | 'check'>) =>
  JSON.stringify([s.land, s.ideas, s.check]) === JSON.stringify([DEFAULTS.land, DEFAULTS.ideas, DEFAULTS.check]);

export const useCalc = create<CalcState>()(
  persist(
    (set) => ({
      ...clone(DEFAULTS),
      edited: {},
      touched: false,
      focusRule: null,

      setLand: (patch) => set((s) => ({ land: { ...s.land, ...patch }, touched: true })),
      setOcc: (occ) => set((s) => ({ ideas: { ...s.ideas, occ }, touched: true })),
      setIdea: (group, key, value) =>
        set((s) => ({
          ideas: { ...s.ideas, [group]: { ...(s.ideas as any)[group], [key]: value } },
          edited: { ...s.edited, [`${group}.${key}`]: true },
          touched: true,
        })),
      setCheck: (patch) => set((s) => ({ check: { ...s.check, ...patch }, ui: { ...s.ui, usedStep3: true }, touched: true })),
      setStep: (step, opts) => set((s) => ({ ui: { ...s.ui, step }, touched: opts?.silent ? s.touched : true })),
      selectIdea: (key, opts) => set((s) => ({ ui: { ...s.ui, selectedIdea: key }, touched: opts?.silent ? s.touched : true })),
      applyPreset: (id) => set((s) => ({ land: { ...s.land, ...PRESETS[id] }, touched: true })),
      setFocusRule: (focusRule) => set({ focusRule }),
      reset: () => set({ ...clone(DEFAULTS), edited: {}, touched: false }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ land: s.land, ideas: s.ideas, check: s.check, ui: s.ui, edited: s.edited }),
      merge: (persisted, current) => {
        const ok = validate(persisted);
        if (!ok) return current;
        // Restored values that differ from the examples count as "the visitor used the calculator".
        return { ...current, ...ok, touched: !sameAsDefaults(ok) };
      },
    },
  ),
);

/** What the WhatsApp message builder needs. Untouched examples yield the generic message (docs/05 §13). */
export function shareInput(s: CalcState) {
  return {
    land: s.touched ? s.land : { ...s.land, P: 0 },
    ideas: s.ideas,
    check: s.check,
    selectedIdea: s.ui.selectedIdea,
    usedStep3: s.ui.usedStep3,
  };
}

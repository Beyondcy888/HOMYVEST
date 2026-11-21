// Small UI state shared across the shell (not persisted).
import { create } from 'zustand';

export const useUi = create((set) => ({
  /** How many pinned scroll scenes are currently on screen. The header and floating button hide while > 0. */
  pinned: 0,
  /** Whether a calculator input has focus (floating WhatsApp hides so it never covers the keyboard). */
  inputFocused: false,
  /** Intro overlay finished (or skipped). The header wordmark shows only after this. */
  introDone: false,
  menuOpen: false,
  /** The lead funnel panel is open (the floating WhatsApp button hides, the page does not scroll). */
  funnelOpen: false,

  pin: () => set((s) => ({ pinned: s.pinned + 1 })),
  unpin: () => set((s) => ({ pinned: Math.max(0, s.pinned - 1) })),
  setInputFocused: (inputFocused) => set({ inputFocused }),
  setIntroDone: () => set({ introDone: true }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setFunnelOpen: (funnelOpen) => set({ funnelOpen }),
}));

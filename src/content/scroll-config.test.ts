// U01_08 §1: the portfolio scenes scroll longer than before, so they move slower.
import { describe, it, expect } from 'vitest';
import { SCROLL, SMOOTH, scrollLength } from './scroll-config.js';

const OLD = { story: { desktop: 500, mobile: 420 }, maxone: { desktop: 700, mobile: 560 }, padel: { desktop: 360, mobile: 360 } };

describe('scroll config', () => {
  it.each(Object.entries(OLD))('%s is longer than before on desktop and mobile', (key, old) => {
    const s = SCROLL[key as keyof typeof OLD];
    expect(typeof s.desktop).toBe('number');
    expect(typeof s.mobile).toBe('number');
    expect(s.desktop).toBeGreaterThan(old.desktop);
    expect(s.mobile).toBeGreaterThan(old.mobile);
  });
  it('beyond panels have a positive length', () => {
    expect(SCROLL.beyondPanel.desktop).toBeGreaterThan(0);
  });
  it('smoothing is gentler than before and Lenis stays in range', () => {
    expect(SMOOTH.cameraSmoothTime).toBeGreaterThan(0.18);
    expect(SMOOTH.assemblySmoothTime).toBeGreaterThan(0.12);
    expect(SMOOTH.lenisLerp).toBeGreaterThan(0);
    expect(SMOOTH.lenisLerp).toBeLessThan(0.1);
    expect(SMOOTH.wheelMultiplier).toBeLessThan(1);
  });
  it('picks the length for the device class', () => {
    expect(scrollLength('story', false)).toBe(SCROLL.story.desktop);
    expect(scrollLength('story', true)).toBe(SCROLL.story.mobile);
    expect(scrollLength('beyondPanel', true)).toBe(SCROLL.beyondPanel.desktop);
  });
});

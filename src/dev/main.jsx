// Dev-only scene harness. Not part of the production build (dev.html is not a build input).
//
//   http://localhost:5173/dev.html?scene=<name>&p=0.4
//
//   scene   file name without "Scene.jsx", lower-case: hero, maxone, padel, calc, claytest …
//           (any src/three/<folder>/<Name>Scene.jsx is picked up automatically)
//   p       scroll progress 0..1 handed to the scene (default 0)
//   theme   light | dark          lang  en | id          tier  high | medium | low
//   ui=0    hide the slider for clean screenshots
//   w,h     optional stage size in px (default: full viewport), e.g. &w=900&h=700
//
// The scene component receives { progress, onReady } where progress is a createProgress() object.
// From Playwright: window.__setP(0.5) moves the scene; window.__ready is true after the first frame.
import { StrictMode, Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/archivo/wdth-italic.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/typography.css';
import '../styles/utilities.css';
import { I18nProvider } from '../i18n/I18nProvider.jsx';
import { createProgress } from '../lib/scroll/progress.js';

const modules = import.meta.glob('../three/*/*Scene.jsx');
const scenes = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => [path.match(/([^/]+)Scene\.jsx$/)[1].toLowerCase(), load]),
);

const params = new URLSearchParams(window.location.search);
const theme = params.get('theme');
if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;

const progress = createProgress(Number(params.get('p') || 0));
window.__setP = (v) => progress.set(Math.min(1, Math.max(0, Number(v))));
window.__progress = progress;

function Harness() {
  const name = (params.get('scene') || '').toLowerCase();
  const load = scenes[name];
  const Scene = useMemo(() => (load ? lazy(load) : null), [load]);
  const [p, setP] = useState(progress.current);
  const [playing, setPlaying] = useState(false);
  const showUi = params.get('ui') !== '0';
  const w = params.get('w');
  const h = params.get('h');

  useEffect(() => progress.subscribe(setP), []);
  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    let last = performance.now();
    const seconds = Number(params.get('dur') || 20);
    const tick = (now) => {
      const next = progress.current + (now - last) / 1000 / seconds;
      last = now;
      progress.set(next >= 1 ? 0 : next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  if (!Scene) {
    return (
      <div style={{ padding: 32 }}>
        <h1 className="t-h2">Scene harness</h1>
        <p className="muted" style={{ marginBlock: 16 }}>
          Add <code>?scene=name</code>. Available:
        </p>
        <ul style={{ display: 'grid', gap: 8 }}>
          {Object.keys(scenes).map((key) => (
            <li key={key}>
              <a className="link link--underlined" href={`?scene=${key}`}>
                {key}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: w && h ? 'auto' : 0,
          width: w ? `${w}px` : undefined,
          height: h ? `${h}px` : undefined,
          top: 0,
          left: 0,
          background: 'var(--paper)',
        }}
      >
        <Suspense fallback={null}>
          <Scene progress={progress} onReady={() => (window.__ready = true)} />
        </Suspense>
      </div>
      {showUi ? (
        <div
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 12,
            zIndex: 100,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            font: '12px/1 ui-monospace, monospace',
            color: 'var(--ink)',
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            padding: '8px 12px',
          }}
        >
          <button type="button" onClick={() => setPlaying((v) => !v)} style={{ minWidth: 48 }}>
            {playing ? 'pause' : 'play'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={p}
            onChange={(e) => progress.set(Number(e.target.value))}
            style={{ flex: 1 }}
            aria-label="progress"
          />
          <span style={{ width: 48, textAlign: 'right' }}>{p.toFixed(3)}</span>
          <span>{name}</span>
        </div>
      ) : null}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <Harness />
    </I18nProvider>
  </StrictMode>,
);

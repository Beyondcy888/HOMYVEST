// #story: the hero. A pinned, scroll-driven clay model in five beats (docs/04 §1, docs/06 §2):
// idle land → built → it could be an office, a café, a court → the street comes alive → colour.
// Live mode pins the stage and scrubs everything from one scroll range; static mode (reduced motion,
// no WebGL, or a failed scene) is a calm vertical sequence with the same copy.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import PinnedScene from '../../components/layout/PinnedScene.jsx';
import SceneMount, { useSceneMode } from '../../components/media/SceneMount.jsx';
import DepthImage from '../../components/media/DepthImage.jsx';
import { Button, WhatsAppButton } from '../../components/ui/Button.jsx';
import Stat from '../../components/ui/Stat.jsx';
import { useT } from '../../i18n/useT.js';
import { createProgress } from '../../lib/scroll/progress.js';
import { scrollToTarget } from '../../lib/scroll/lenis.js';
import { registry } from '../../lib/scroll/triggers.js';
import { BEATS } from '../../three/hero/camera.js';
import StoryOverlay from './StoryOverlay.jsx';
import './Story.css';

gsap.registerPlugin(SplitText);

const loadHero = () => import('../../three/hero/HeroScene.jsx');
const POSTERS = [1, 2, 3, 4].map((n) => `/media/posters/hero-${n}.webp`);

// Where the text changes, in scroll progress. The 3D reads the same BEATS.
const T = {
  b1Out: 0.066,
  b2In: 0.115,
  b2Out: 0.312,
  b3In: 0.345,
  b3Out: 0.646,
  b4In: 0.684,
  b4Out: 0.77,
  earnIn: BEATS.dissolve[1],
};
const phaseOf = (p) => (p < BEATS.dissolve[0] - 0.012 ? 'clay' : p < T.earnIn + 0.014 ? 'wipe' : 'earn');

/** Builds the scrubbed timeline. Positions and durations are in scroll progress (0..1). */
function buildTimeline(tl, ui, photo, split) {
  const q = gsap.utils.selector(ui);
  // keep every tweened element on the GPU for the whole story (see the will-change note in Story.css)
  tl.vars.defaults = { ...tl.vars.defaults, force3D: true };
  const rise = (title, at) => {
    if (split) {
      const lines = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'split-line' }).lines;
      tl.fromTo(lines, { yPercent: 112 }, { yPercent: 0, duration: 0.034, stagger: 0.007, ease: 'power3.out' }, at);
    } else {
      tl.fromTo(title, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.034, ease: 'power3.out' }, at);
    }
  };
  const enter = (name, at) => {
    tl.fromTo(q(`.story__${name}`), { opacity: 0 }, { opacity: 1, duration: 0.004 }, at);
    rise(q(`.story__${name} .story__title`), at);
    tl.fromTo(q(`.story__${name} .story__body`), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.03, ease: 'power2.out' }, at + 0.014);
  };
  const leave = (name, at) => tl.to(q(`.story__${name}`), { opacity: 0, y: -18, duration: 0.028, ease: 'power1.in' }, at);

  // Beat 1 is simply there when the page opens; only its exit is scrubbed.
  leave('b1', T.b1Out);
  enter('b2', T.b2In);
  leave('b2', T.b2Out);
  enter('b3', T.b3In);
  leave('b3', T.b3Out);
  enter('b4', T.b4In);
  leave('b4', T.b4Out);

  // Slide labels: the thumb travels with each camera swipe. Landscape lists the four options down the
  // column; portrait has room for one line, so it shows the current option over a four-step line.
  const labels = q('.story__label');
  const portrait = window.matchMedia('(max-aspect-ratio: 9/10)').matches;
  const step = portrait ? 'xPercent' : 'yPercent';
  tl.fromTo(q('.story__labels'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.03, ease: 'power2.out' }, T.b3In + 0.022);
  BEATS.swipes.forEach(([a, b], i) => {
    const mid = (a + b) / 2;
    tl.to(q('.story__thumb'), { [step]: 100 * (i + 1), duration: b - a, ease: 'power2.inOut' }, a);
    tl.to(labels[i], { opacity: portrait ? 0 : 0.5, duration: 0.012 }, mid - 0.006);
    tl.to(labels[i + 1], { opacity: 1, duration: 0.012 }, mid - 0.006);
  });

  // The dissolve: colour arrives through a soft circle opening from the stay.
  const [d0, d1] = BEATS.dissolve;
  tl.to(q('.story__skip'), { opacity: 0, duration: 0.02 }, d0 - 0.02);
  tl.fromTo(photo, { '--r': 0 }, { '--r': 1, duration: d1 - d0, ease: 'sine.inOut' }, d0);
  // the clay lets go as the photo spreads, so the model never ghosts through the soft edge
  tl.fromTo(ui.parentElement.querySelector('.story__scene'), { opacity: 1 }, { opacity: 0, duration: 0.042, ease: 'sine.in' }, d0 + 0.006);
  tl.fromTo(photo.querySelector('.story__zoom'), { scale: 1.08 }, { scale: 1, duration: 0.12, ease: 'power2.out' }, d0);

  // Beat 5 over the photo.
  tl.fromTo(q('.story__earn'), { opacity: 0 }, { opacity: 1, duration: 0.004 }, T.earnIn);
  rise(q('.story__title--earn'), T.earnIn + 0.002);
  tl.fromTo(q('.story__stats'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.03, ease: 'power2.out' }, T.earnIn + 0.02);
  tl.fromTo(q('.story__ctas'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.03, ease: 'power2.out' }, T.earnIn + 0.04);
}

function StoryLive({ onFail }) {
  const { t, lang } = useT();
  const progress = useMemo(() => createProgress(0), []);
  const ui = useRef(null);
  const photo = useRef(null);
  const section = useRef(null);
  const [layout, setLayout] = useState({ fonts: false, n: 0 });

  // Three coarse phases (clay, the wipe, the photo) switch layers on and off. They are written straight
  // to the section's attributes, so scrolling never re-renders this component (or the canvas under it).
  // The only React state that scrolling changes is the stats' roll-up, kept inside StoryOverlay.
  useLayoutEffect(() => {
    let phase = null;
    let top = null;
    const apply = (v) => {
      const el = section.current;
      if (!el) return;
      const next = phaseOf(v);
      if (next !== phase) {
        phase = next;
        el.dataset.phase = next;
      }
      // the poster shows the opening frame: it may only stand in for the scene at the very top
      const atTop = v < 0.02;
      if (atTop !== top) {
        top = atTop;
        el.toggleAttribute('data-top', atTop);
      }
    };
    apply(progress.current);
    return progress.subscribe(apply);
  }, [progress]);

  // Warm-up. Large text is expensive the first time the GPU rasterises it, and a beat that first
  // appears mid-scroll pays for it with a 50–150 ms frame. So for a moment after load, once the font
  // is in, every hidden beat is painted in place at 0.5% opacity (see Story.css): nothing can be seen,
  // but the glyphs are ready. It ends early if the visitor starts scrolling.
  // On phones the warm-up waits for the first touch. Text painted before any interaction is measured as the
  // page's Largest Contentful Paint (even at 0.5% opacity), which made the page report a load a second slower
  // than it is; after the first interaction that measurement is closed, so warming then costs nothing.
  useEffect(() => {
    const el = section.current;
    const end = () => el.removeAttribute('data-warm');
    let timer;
    const start = () => {
      el.setAttribute('data-warm', '');
      timer = window.setTimeout(end, layout.fonts ? 1200 : 4000);
    };
    const events = ['touchstart', 'pointerdown', 'keydown', 'wheel'];
    const onFirst = () => {
      events.forEach((name) => window.removeEventListener(name, onFirst));
      start();
    };
    if (window.matchMedia('(pointer: coarse)').matches) events.forEach((name) => window.addEventListener(name, onFirst, { passive: true }));
    else start();
    const off = progress.subscribe((v) => v > 0.03 && end());
    return () => {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, onFirst));
      off();
      end();
    };
  }, [progress, layout.fonts]);

  // Line splits depend on the font and the column width: rebuild the timeline when either changes.
  useEffect(() => {
    let alive = true;
    let timer;
    let width = window.innerWidth;
    const bump = (fonts) => alive && setLayout((s) => ({ fonts: s.fonts || fonts, n: s.n + 1 }));
    (document.fonts?.ready ?? Promise.resolve()).then(() => bump(true));
    const onResize = () => {
      if (window.innerWidth === width) return; // mobile URL bars change the height only
      width = window.innerWidth;
      clearTimeout(timer);
      timer = setTimeout(() => bump(false), 180);
    };
    window.addEventListener('resize', onResize);
    return () => {
      alive = false;
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // The scene reports where the stay sits on screen; the photo's wipe opens from that point.
  const onAnchor = useCallback((x, y) => {
    const el = photo.current;
    if (!el) return;
    el.style.setProperty('--ax', `${(x * 100).toFixed(2)}%`);
    el.style.setProperty('--ay', `${(y * 100).toFixed(2)}%`);
    // the circle must reach the farthest corner exactly when the wipe ends
    const far = Math.hypot(Math.max(x, 1 - x) * window.innerWidth, Math.max(y, 1 - y) * window.innerHeight);
    el.style.setProperty('--d', `${Math.ceil(far + 8)}px`);
  }, []);
  const sceneProps = useMemo(() => ({ progress, onAnchor }), [progress, onAnchor]);

  const timeline = (tl) => buildTimeline(tl, ui.current, photo.current, layout.fonts);

  const goTo = (e, target) => {
    e.preventDefault();
    scrollToTarget(target);
    window.history.replaceState(null, '', target);
  };
  // Keyboard focus landing on the closing CTAs brings their beat on screen.
  const reveal = () => {
    const trig = registry.triggers.story;
    if (!trig || progress.current >= 0.93) return;
    scrollToTarget(trig.start + (trig.end - trig.start) * 0.97);
  };

  return (
    <section ref={section} id="story" className="story story--live" aria-labelledby="story-title">
      <PinnedScene id="story" lengthVh={500} mobileLengthVh={420} progress={progress} timeline={timeline} deps={[lang, layout.n]}>
        <SceneMount
          className="story__scene"
          load={loadHero}
          sceneProps={sceneProps}
          label={t('hero.sceneAlt')}
          onFail={onFail}
          poster={<img className="story__poster" src={POSTERS[0]} alt="" decoding="async" />}
        />
        <div ref={photo} className="story__photo">
          <div className="story__zoom">
            <DepthImage id="facades/best" priority strength={1.2} sizes="100vw" />
          </div>
          <div className="story__scrim" />
        </div>
        <StoryOverlay
          key={lang}
          ref={ui}
          progress={progress}
          earnAt={T.earnIn + 0.014}
          onSkip={(e) => goTo(e, '#about')}
          onCalculator={(e) => goTo(e, '#calculator')}
          onReveal={reveal}
        />
      </PinnedScene>
    </section>
  );
}

/** No pin, no scrubbing: the five beats one after another, everything visible. */
function StoryStatic() {
  const { t } = useT();
  const alts = t('hero.posterAlt');
  const goTo = (e, target) => {
    e.preventDefault();
    scrollToTarget(target);
    window.history.replaceState(null, '', target);
  };
  return (
    <section id="story" className="story story--static" aria-labelledby="story-title">
      <div className="wrap story-static__beats">
        {['b1', 'b2', 'b3', 'b4'].map((key, i) => {
          const Title = i === 0 ? 'h1' : 'h2';
          return (
            <div key={key} className="story-static__beat">
              <div className="story-static__text">
                <Title id={i === 0 ? 'story-title' : undefined} className="story__title">
                  {t(`hero.${key}.title`)}
                </Title>
                <p className="story__body">{t(`hero.${key}.body`)}</p>
              </div>
              <img
                className="story-static__poster"
                src={POSTERS[i]}
                alt={alts[i]}
                width="1600"
                height="1000"
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
          );
        })}
      </div>
      <div className="story-static__earn">
        <DepthImage id="facades/best" strength={1.2} sizes="100vw" />
        <div className="story__scrim" />
        <div className="story__earn">
          <h2 className="story__title story__title--earn">{t('hero.b5.title')}</h2>
          <div className="story__stats">
            <Stat stat={t('hero.b5.stat1')} />
            <Stat stat={t('hero.b5.stat2')} />
          </div>
          <div className="story__ctas">
            <Button variant="on-photo" href="#calculator" onClick={(e) => goTo(e, '#calculator')}>
              {t('hero.b5.cta1')}
            </Button>
            <WhatsAppButton variant="ghost-on-photo" label={t('hero.b5.cta2')} />
          </div>
          {/* the period behind the 82% figure, beside the figure itself (docs/02 §6) */}
          <p className="story__note">
            <sup>1</sup> {t('notes.1')}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Story() {
  const mode = useSceneMode();
  const [failed, setFailed] = useState(false);
  return mode === 'static' || failed ? <StoryStatic /> : <StoryLive onFail={() => setFailed(true)} />;
}

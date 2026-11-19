// #story: the hero. A pinned, scroll-driven clay model in five beats (docs/04 §1, docs/06 §2):
// idle land → built → it could be an office, a café, a court → the street comes alive → colour.
// Live mode pins the stage and scrubs everything from one scroll range; static mode (reduced motion,
// no WebGL, or a failed scene) is a calm vertical sequence with the same copy.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  b3Out: 0.632,
  b4In: 0.678,
  b4Out: 0.77,
  earnIn: BEATS.dissolve[1],
};
const phaseOf = (p) => (p < BEATS.dissolve[0] - 0.012 ? 'clay' : p < T.earnIn + 0.014 ? 'wipe' : 'earn');

/** Builds the scrubbed timeline. Positions and durations are in scroll progress (0..1). */
function buildTimeline(tl, ui, photo, split) {
  const q = gsap.utils.selector(ui);
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

  // Slide labels: the thumb travels with each camera swipe.
  const labels = q('.story__label');
  tl.fromTo(q('.story__labels'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.02, ease: 'power2.out' }, T.b3In);
  BEATS.swipes.forEach(([a, b], i) => {
    const mid = (a + b) / 2;
    tl.to(q('.story__thumb'), { xPercent: 100 * (i + 1), duration: b - a, ease: 'power2.inOut' }, a);
    tl.to(labels[i], { opacity: 0.4, duration: 0.012 }, mid - 0.006);
    tl.to(labels[i + 1], { opacity: 1, duration: 0.012 }, mid - 0.006);
  });
  tl.to(q('.story__labels'), { opacity: 0, duration: 0.02 }, T.b3Out + 0.008);

  // The dissolve: colour arrives through a soft circle opening from the stay.
  const [d0, d1] = BEATS.dissolve;
  tl.to(q('.story__skip'), { opacity: 0, duration: 0.02 }, d0 - 0.02);
  tl.fromTo(photo, { '--r': 0 }, { '--r': 1, duration: d1 - d0, ease: 'sine.inOut' }, d0);
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
  const [phase, setPhase] = useState('clay');
  const [layout, setLayout] = useState({ fonts: false, n: 0 });

  // Three coarse phases are all React needs to know: clay, the wipe, and the photo.
  useEffect(() => {
    let current = phaseOf(progress.current);
    setPhase(current);
    return progress.subscribe((v) => {
      const next = phaseOf(v);
      if (next !== current) {
        current = next;
        setPhase(next);
      }
    });
  }, [progress]);

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
    <section id="story" className="story story--live" aria-labelledby="story-title" data-phase={phase}>
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
          earning={phase === 'earn'}
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

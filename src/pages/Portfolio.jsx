// The full portfolio, /portofolio/ (U01_04 §1): the intro and its index, the story, Maxone, the padel hall,
// beyond stays, then a way back to the visitor's own land. A short divider with the next scene's number and
// name sits between scenes. The scenes keep their choreography; only their scroll lengths changed
// (src/content/scroll-config.js).
import { useEffect } from 'react';
import { useT } from '../i18n/useT.js';
import Intro from '../sections/Portfolio/Intro.jsx';
import Divider from '../sections/Portfolio/Divider.jsx';
import Closing from '../sections/Portfolio/Closing.jsx';
import { prepareScene, prepareScenes } from '../sections/Portfolio/prefetch.js';
import Story from '../sections/Story/Story.jsx';
import Walkthrough from '../sections/HomyEight/Walkthrough.jsx';
import PadelSection from '../sections/Beyond/PadelSection.jsx';
import Beyond from '../sections/Beyond/Beyond.jsx';
import '../sections/Portfolio/Portfolio.css';

const nearMaxone = () => prepareScene('maxone');
const nearPadel = () => prepareScene('padel');

export default function Portfolio() {
  const { t } = useT();
  const names = t('pf.index');

  // While the visitor reads the intro, fetch the scenes' code and build their worlds in idle time.
  useEffect(() => {
    const start = () => prepareScenes();
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
  }, []);

  return (
    <>
      <Intro />
      <Story />
      <section id="maxone" className="pf-part" aria-labelledby="maxone-title">
        <Divider n={2} id="maxone-title" title={names[1]} onNear={nearMaxone} />
        <Walkthrough />
      </section>
      <section id="padel" className="pf-part" aria-labelledby="padel-title">
        <Divider n={3} id="padel-title" title={names[2]} onNear={nearPadel} />
        <PadelSection />
      </section>
      <section id="beyond" className="pf-part" aria-labelledby="beyond-title">
        <Divider n={4} id="beyond-title" title={names[3]} />
        <Beyond />
      </section>
      <Closing />
    </>
  );
}

import { useState } from 'react';
import { useT } from '../../i18n/useT.js';
import { refreshTriggers } from '../../lib/scroll/lenis.js';
import Heading from '../../components/ui/Heading.jsx';
import { Plus } from '../../components/ui/Icons.jsx';
import '../sections.css';
import './Faq.css';

/** FAQ: single-open accordion. Buttons with aria-expanded / aria-controls; height animates with CSS grid. */
export default function Faq() {
  const { t } = useT();
  const items = t('faq.items');
  const [open, setOpen] = useState(0);
  const toggle = (i) => {
    setOpen((prev) => (prev === i ? -1 : i));
    window.setTimeout(refreshTriggers, 450);
  };
  return (
    <section id="faq" className="section faq" aria-labelledby="faq-title">
      <div className="wrap grid12 faq__grid">
        <Heading as="h2" id="faq-title" className="t-h1 faq__title">
          {t('faq.title')}
        </Heading>
        <ul className="faq__list">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className="faq__item" data-open={isOpen}>
                <h3 className="faq__q">
                  <button type="button" id={`faq-q-${i}`} aria-expanded={isOpen} aria-controls={`faq-a-${i}`} onClick={() => toggle(i)}>
                    <span>{item.q}</span>
                    <Plus />
                  </button>
                </h3>
                <div id={`faq-a-${i}`} className="faq__a" role="region" aria-labelledby={`faq-q-${i}`} inert={!isOpen}>
                  <div className="faq__a-in">
                    <p>{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

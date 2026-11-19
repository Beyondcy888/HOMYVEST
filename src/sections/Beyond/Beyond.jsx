import { useT } from '../../i18n/useT.js';
import Heading from '../../components/ui/Heading.jsx';
import { ArrowDown } from '../../components/ui/Icons.jsx';
import WaysStrip from './WaysStrip.jsx';
import '../sections.css';
import './Beyond.css';

/**
 * Beyond stays: proof that the land decides.
 * Part 1 (children): the padel hall assembling. Part 2: three more ways to earn.
 */
export default function Beyond({ children }) {
  const { t } = useT();
  return (
    <section id="beyond" className="beyond" aria-labelledby="beyond-title">
      <div className="section beyond__intro">
        <div className="wrap grid12 beyond__head">
          <div className="beyond__headline sec-head">
            <p className="t-eyebrow label-line">{t('beyond.eyebrow')}</p>
            <Heading as="h2" id="beyond-title" className="t-h1 beyond__title">
              {t('beyond.title')}
            </Heading>
          </div>
          <p className="t-lead beyond__body">{t('beyond.body')}</p>
        </div>
      </div>

      {children}

      <WaysStrip />

      <div className="wrap">
        <div className="beyond__bridge">
          <p className="t-display beyond__bridge-line">{t('beyond.bridge')}</p>
          <ArrowDown />
        </div>
      </div>
    </section>
  );
}

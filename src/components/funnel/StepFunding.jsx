import { useT } from '../../i18n/useT.js';
import { FUNDING, OPTION_LABELS, formatPhoneDisplay } from '../../lib/leads/leads.ts';
import { useFunnel } from './useFunnelStore.js';
import RadioCards from './RadioCards.jsx';

/** "We'll contact you at +62 812-3456-7890 · Change" at the top of steps 2 and 3. */
export function Recap({ onChange }) {
  const { t } = useT();
  const phone = useFunnel((s) => s.phone);
  return (
    <p className="frecap">
      <span>{t('funnel.panel.recap', { phone: formatPhoneDisplay(phone) })}</span>
      <span aria-hidden="true"> · </span>
      <button type="button" className="frecap__change" onClick={onChange}>
        {t('funnel.panel.change')}
      </button>
    </p>
  );
}

/** Step 2 of 3: where the money for building would come from (U01_02 §4). */
export default function StepFunding({ titleRef, onChangePhone, onContinue }) {
  const { t, lang } = useT();
  const funding = useFunnel((s) => s.funding);
  const setFunding = useFunnel((s) => s.setFunding);
  const errors = useFunnel((s) => s.errors);
  const options = FUNDING.map((value) => ({ value, label: OPTION_LABELS[lang].funding[value] }));
  return (
    <div className="fstep">
      <Recap onChange={onChangePhone} />
      <h2 id="funnel-title" ref={titleRef} tabIndex={-1} className="fstep__title">
        {t('funnel.funding.title')}
      </h2>
      <p id="funnel-funding-help" className="fstep__help">
        {t('funnel.funding.help')}
      </p>
      <RadioCards
        name="funding"
        legend={t('funnel.funding.title')}
        legendHidden
        describedBy="funnel-funding-help"
        options={options}
        value={funding}
        onChange={setFunding}
        onActivate={(value) => {
          setFunding(value);
          onContinue(value);
        }}
        error={errors.funding ? t('funnel.err.chooseSingle') : ''}
      />
    </div>
  );
}

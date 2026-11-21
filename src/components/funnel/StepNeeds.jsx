import { useT } from '../../i18n/useT.js';
import { NEEDS, OPTION_LABELS } from '../../lib/leads/leads.ts';
import { useFunnel } from './useFunnelStore.js';
import RadioCards from './RadioCards.jsx';
import { Recap } from './StepFunding.jsx';
import { NameField, CityChips, Honeypot, Consent, errorText } from './fields.jsx';

/** Step 3 of 3 with no construction budget yet: reassurance first, then the main need, name and city (U01_02 §6). */
export default function StepNeeds({ titleRef, onChangePhone }) {
  const { t, lang } = useT();
  const form = useFunnel((s) => s.form);
  const errors = useFunnel((s) => s.errors);
  const setField = useFunnel((s) => s.setField);
  return (
    <div className="fstep">
      <Recap onChange={onChangePhone} />
      <h2 id="funnel-title" ref={titleRef} tabIndex={-1} className="fstep__title">
        {t('funnel.needs.title')}
      </h2>
      <p className="fstep__intro">{t('funnel.needs.body')}</p>
      <div className="fstep__fields">
        <RadioCards
          name="need"
          legend={t('funnel.f.need.label')}
          options={NEEDS.map((value) => ({ value, label: OPTION_LABELS[lang].need[value] }))}
          value={form.need}
          onChange={(v) => setField('need', v)}
          error={errorText(t, 'need', errors.need)}
          other={{
            value: form.needOther,
            onChange: (v) => setField('needOther', v),
            label: `${t('funnel.f.need.label')} ${OPTION_LABELS[lang].need.other}`,
            placeholder: t('funnel.f.otherPlaceholder'),
            maxLength: 200,
            error: errorText(t, 'needOther', errors.needOther),
          }}
        />
        <NameField />
        <CityChips />
        <Honeypot />
        <Consent />
      </div>
    </div>
  );
}

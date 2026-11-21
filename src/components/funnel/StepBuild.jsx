import { useT } from '../../i18n/useT.js';
import { OWNED, BUILD, OPTION_LABELS } from '../../lib/leads/leads.ts';
import { useFunnel } from './useFunnelStore.js';
import Chips from './Chips.jsx';
import { Recap } from './StepFunding.jsx';
import { NameField, CityChips, Honeypot, Consent, errorText } from './fields.jsx';

/** Step 3 of 3 when building is funded (bank loan or own funds): what they own, what to build, where (U01_02 §5). */
export default function StepBuild({ titleRef, onChangePhone }) {
  const { t, lang } = useT();
  const form = useFunnel((s) => s.form);
  const errors = useFunnel((s) => s.errors);
  const setField = useFunnel((s) => s.setField);
  const L = OPTION_LABELS[lang];
  return (
    <div className="fstep">
      <Recap onChange={onChangePhone} />
      <h2 id="funnel-title" ref={titleRef} tabIndex={-1} className="fstep__title">
        {t('funnel.build.title')}
      </h2>
      <div className="fstep__fields">
        <NameField />
        <Chips
          name="owned"
          legend={t('funnel.f.owned.label')}
          help={t('funnel.f.owned.help')}
          options={OWNED.map((value) => ({ value, label: L.owned[value] }))}
          value={form.owned}
          onChange={(v) => setField('owned', v)}
          error={errorText(t, 'owned', errors.owned)}
          other={{
            value: form.ownedOther,
            onChange: (v) => setField('ownedOther', v),
            label: `${t('funnel.f.owned.label')} ${L.owned.other}`,
            placeholder: t('funnel.f.otherPlaceholder'),
            maxLength: 120,
            error: errorText(t, 'ownedOther', errors.ownedOther),
          }}
        />
        <Chips
          name="build"
          legend={t('funnel.f.build.label')}
          help={t('funnel.f.build.help')}
          options={BUILD.map((value) => ({ value, label: L.build[value] }))}
          value={form.build}
          onChange={(v) => setField('build', v)}
          error={errorText(t, 'build', errors.build)}
          other={{
            value: form.buildOther,
            onChange: (v) => setField('buildOther', v),
            label: `${t('funnel.f.build.label')} ${L.build.other}`,
            placeholder: t('funnel.f.otherPlaceholder'),
            maxLength: 120,
            error: errorText(t, 'buildOther', errors.buildOther),
          }}
        />
        <CityChips />
        <Honeypot />
        <Consent />
      </div>
    </div>
  );
}

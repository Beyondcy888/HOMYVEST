// Fields shared by step 3A and 3B: name, city chips, the honeypot and the consent line.
import { useT } from '../../i18n/useT.js';
import { CITIES, OPTION_LABELS } from '../../lib/leads/leads.ts';
import { useFunnel } from './useFunnelStore.js';
import Chips from './Chips.jsx';

/** The message for a validation code from validateLead() (src/lib/leads/leads.ts). */
export function errorText(t, key, code) {
  if (!code) return '';
  if (code === 'tooLong') return t('funnel.err.tooLong');
  if (code === 'chooseOne') return key === 'need' || key === 'funding' ? t('funnel.err.chooseSingle') : t('funnel.err.chooseOne');
  if (code === 'invalid' && key === 'phone') return t('funnel.phone.error');
  return t('funnel.err.required');
}

/** Where to put the focus for an invalid field. */
export const FOCUS_ID = {
  name: 'f-name',
  owned: 'f-owned-0',
  ownedOther: 'f-owned-other',
  build: 'f-build-0',
  buildOther: 'f-build-other',
  need: 'f-need-0',
  needOther: 'f-need-other',
  cities: 'f-cities-0',
  cityOther: 'f-cities-other',
};

export function NameField() {
  const { t } = useT();
  const value = useFunnel((s) => s.form.name);
  const error = useFunnel((s) => s.errors.name);
  const setField = useFunnel((s) => s.setField);
  const msg = errorText(t, 'name', error);
  return (
    <div className="ffield" data-invalid={msg ? true : undefined}>
      <label className="ffield__label" htmlFor="f-name">
        {t('funnel.f.name.label')}
      </label>
      <p id="f-name-help" className="ffield__help">
        {t('funnel.f.name.help')}
      </p>
      <input
        id="f-name"
        className="ftext"
        type="text"
        name="name"
        autoComplete="name"
        maxLength={100}
        value={value}
        onChange={(e) => setField('name', e.target.value)}
        aria-invalid={msg ? 'true' : undefined}
        aria-describedby={msg ? 'f-name-help f-name-err' : 'f-name-help'}
      />
      {msg ? (
        <p id="f-name-err" className="ffield__error">
          {msg}
        </p>
      ) : null}
    </div>
  );
}

export function CityChips() {
  const { t, lang } = useT();
  const form = useFunnel((s) => s.form);
  const errors = useFunnel((s) => s.errors);
  const setField = useFunnel((s) => s.setField);
  return (
    <Chips
      name="cities"
      legend={t('funnel.f.city.label')}
      help={t('funnel.f.city.help')}
      options={CITIES.map((value) => ({ value, label: OPTION_LABELS[lang].city[value] }))}
      value={form.cities}
      onChange={(v) => setField('cities', v)}
      error={errorText(t, 'cities', errors.cities)}
      other={{
        value: form.cityOther,
        onChange: (v) => setField('cityOther', v),
        label: `${t('funnel.f.city.label')} ${OPTION_LABELS[lang].city.other}`,
        placeholder: t('funnel.f.otherPlaceholder'),
        maxLength: 80,
        error: errorText(t, 'cityOther', errors.cityOther),
      }}
    />
  );
}

/** Hidden from people (off-screen, not focusable); bots fill it in, and their "send" quietly goes nowhere. */
export function Honeypot() {
  const value = useFunnel((s) => s.form.honeypot);
  const setField = useFunnel((s) => s.setField);
  return (
    <div className="fhoney" aria-hidden="true">
      <label htmlFor="f-company">Company</label>
      <input id="f-company" type="text" name="company" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => setField('honeypot', e.target.value)} />
    </div>
  );
}

export function Consent() {
  const { t } = useT();
  return <p className="fconsent">{t('funnel.consent')}</p>;
}

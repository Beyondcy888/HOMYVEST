import { useEffect } from 'react';
import { useT } from '../../i18n/useT.js';
import { useCalc } from '../../lib/calc/store.ts';
import { fmtArea, fmtMoney, fmtPct, fmtYears } from '../../i18n/format.js';
import { getLenis } from '../../lib/scroll/lenis.js';
import { Field, MoneyField, MoneyShort, LandChip, Notice, ResultsCta, How, rich } from './parts.jsx';
import { fitsText } from './useResults.js';

const KEYS = ['kos', 'ruko', 'rumah', 'gudang'];

function Prices({ idea }) {
  const { t } = useT();
  const I = useCalc((s) => s.ideas);
  const setIdea = useCalc((s) => s.setIdea);
  const edited = useCalc((s) => s.edited);
  const p = (key) => t(`calc.s2.p.${key}`);
  // Example prices carry an "Example" tag until the visitor replaces them.
  const tag = (key) => (edited[`${idea}.${key}`] ? null : t('calc.example'));
  const num = (key, labelKey) => (
    <Field
      label={p(labelKey).label}
      unit={p(labelKey).unit}
      help={p(labelKey).help}
      value={I[idea][key]}
      onChange={(v) => setIdea(idea, key, v)}
      tag={tag(key)}
    />
  );
  const money = (key, labelKey) => (
    <MoneyField label={p(labelKey).label} value={I[idea][key]} onChange={(v) => setIdea(idea, key, v)} tag={tag(key)} />
  );
  return (
    <div className="prices">
      {idea === 'kos' ? (
        <>
          {num('size', 'kosSize')}
          {money('rent', 'kosRent')}
        </>
      ) : null}
      {idea === 'ruko' ? (
        <>
          {num('width', 'rukoWidth')}
          {money('rent', 'rukoRent')}
        </>
      ) : null}
      {idea === 'rumah' ? (
        <>
          {num('land', 'rumahLand')}
          {num('floor', 'rumahFloor')}
          {money('rent', 'rumahRent')}
        </>
      ) : null}
      {idea === 'gudang' ? money('rent', 'gudangRent') : null}
      {money('cost', 'cost')}
    </div>
  );
}

/** Step 2: four ways this land could earn, side by side. */
export default function Step2({ results, goStep }) {
  const { t, lang } = useT();
  const { r, res, ranking } = results;
  const occ = useCalc((s) => s.ideas.occ);
  const setOcc = useCalc((s) => s.setOcc);
  const selected = useCalc((s) => s.ui.selectedIdea);
  const selectIdea = useCalc((s) => s.selectIdea);
  const fastest = ranking?.fastest?.key ?? null;

  // On first arrival the fastest idea is shown in 3D.
  useEffect(() => {
    if (selected === null && fastest) selectIdea(fastest, { silent: true });
  }, [selected, fastest, selectIdea]);

  if (!r) {
    return (
      <>
        <Notice tone="info">{t('calc.s2.sum.noLand')}</Notice>
        <button type="button" className="link link--underlined" onClick={() => goStep(1)}>
          {t('calc.tabs')[0]}
        </button>
      </>
    );
  }

  const name = (key) => t(`calc.s2.names.${key}`);
  const rows = t('calc.s2.rows');
  const dash = '–';
  const { second, cheapest } = ranking;
  const best = ranking.fastest;

  return (
    <>
      <div className="step-head">
        <h3 className="t-h2">{t('calc.s2.title')}</h3>
        <p className="ink-2">{t('calc.s2.body')}</p>
      </div>
      <LandChip r={r} onEdit={() => goStep(1)} />
      <div className="fields fields--2">
        <Field id="calc-occ" label={t('calc.f.occ').label} unit="%" help={t('calc.f.occ').help} value={occ} onChange={setOcc} />
      </div>

      <div className="ideas" role="radiogroup" aria-label={t('calc.s2.ideasLabel')}>
        {KEYS.map((key) => {
          const idea = res[key];
          const isSel = selected === key;
          return (
            <div key={key} className="idea" data-selected={isSel} data-fits={idea.fits} data-idea={key}>
              <label className="idea__head">
                <input type="radio" name="calc-idea" className="sr-only" value={key} checked={isSel} onChange={() => selectIdea(key)} />
                <span className="idea__radio" aria-hidden="true" />
                <span className="idea__name">{name(key)}</span>
                {fastest === key ? <span className="idea__badge">{t('calc.s2.badge')}</span> : null}
                <span className="idea__show">{isSel ? t('calc.s2.showing') : t('calc.s2.select')}</span>
              </label>
              <p className="idea__fits nums">{fitsText(key, idea, t, lang)}</p>
              <dl className="idea__rows">
                <div className="idea__payback">
                  <dt>{rows.payback}</dt>
                  <dd className="nums">{idea.payback !== null ? fmtYears(idea.payback, lang) : dash}</dd>
                </div>
                <div>
                  <dt>{rows.yield}</dt>
                  <dd className="nums">{idea.yieldPct !== null ? fmtPct(idea.yieldPct, lang) : dash}</dd>
                </div>
                <div>
                  <dt>{rows.built}</dt>
                  <dd className="nums">{idea.fits ? fmtArea(idea.built, lang) : dash}</dd>
                </div>
                <div>
                  <dt>{rows.cost}</dt>
                  <dd className="nums">{idea.fits ? fmtMoney(idea.cost, lang) : dash}</dd>
                </div>
                <div>
                  <dt>{rows.income}</dt>
                  <dd className="nums">{idea.fits ? fmtMoney(idea.income, lang) : dash}</dd>
                </div>
              </dl>
              <p className="idea__tip">
                <span className="idea__tip-label">{rows.tip}</span> {t(`calc.s2.tip.${key}`)}
              </p>
              <details className="idea__adjust" onToggle={() => window.setTimeout(() => getLenis()?.resize(), 50)}>
                <summary>{t('calc.s2.adjust')}</summary>
                <Prices idea={key} />
              </details>
            </div>
          );
        })}
      </div>

      <div className="summary" data-summary>
        {best ? (
          <>
            <p className="t-lead">
              {rich(t('calc.s2.sum.best'), {
                best: <strong>{name(best.key)}</strong>,
                payback: <span className="nums">{fmtYears(best.payback, lang)}</span>,
                cost: <MoneyShort value={best.cost} />,
                income: <MoneyShort value={best.income} />,
              })}
            </p>
            {second ? (
              <p>
                {rich(t('calc.s2.sum.second'), {
                  second: name(second.key),
                  payback: <span className="nums">{fmtYears(second.payback, lang)}</span>,
                })}
              </p>
            ) : null}
            {cheapest ? (
              <p>
                {rich(t('calc.s2.sum.cheapest'), {
                  cheapest: name(cheapest.key),
                  cost: <MoneyShort value={cheapest.cost} />,
                  payback: <span className="nums">{fmtYears(cheapest.payback, lang)}</span>,
                })}
              </p>
            ) : null}
          </>
        ) : (
          <p className="t-lead">{t('calc.s2.sum.noPrices')}</p>
        )}
        {/* The caveat is the bridge to the partners, so it sits right under the summary, not in a footnote. */}
        <p className="summary__caveat">{t('calc.s2.caveat')}</p>
        <p className="summary__hybrid">{t('calc.s2.hybridNote')}</p>
      </div>

      <ResultsCta />
      <How step={2} />
    </>
  );
}

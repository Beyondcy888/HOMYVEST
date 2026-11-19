import { useT } from '../../i18n/useT.js';
import { useCalc, PRESETS } from '../../lib/calc/store.ts';
import { fmtArea, fmtNum, fmtPct } from '../../i18n/format.js';
import { Button } from '../../components/ui/Button.jsx';
import { ArrowRight } from '../../components/ui/Icons.jsx';
import { Field, Notice, How } from './parts.jsx';
import { floorsText } from './useResults.js';

/** Step 1: your land. How much am I allowed to build? */
export default function Step1({ results, goStep }) {
  const { t, lang } = useT();
  const land = useCalc((s) => s.land);
  const setLand = useCalc((s) => s.setLand);
  const applyPreset = useCalc((s) => s.applyPreset);
  const entry = useCalc((s) => s.entry);
  const { r, klbLow } = results;
  const f = (key) => t(`calc.f.${key}`);
  const activePreset = Object.keys(PRESETS).find(
    (id) => PRESETS[id].kdb === land.kdb && PRESETS[id].klb === land.klb && PRESETS[id].kdh === land.kdh,
  );

  return (
    <>
      {entry === 'building' ? <Notice tone="info">{t('calc.doorBNote')}</Notice> : null}

      <div className="fields fields--2">
        <Field id="calc-P" label={f('P').label} unit={f('P').unit} help={f('P').help} value={land.P} onChange={(v) => setLand({ P: v })} />
        <Field id="calc-L" label={f('L').label} unit={f('L').unit} help={f('L').help} value={land.L} onChange={(v) => setLand({ L: v })} />
      </div>

      <div className="presets">
        <p className="presets__title">{t('calc.presets.title')}</p>
        <div className="presets__list">
          {Object.keys(PRESETS).map((id) => (
            <button key={id} type="button" className="presets__btn" aria-pressed={activePreset === id} onClick={() => applyPreset(id)}>
              {t(`calc.presets.${id}`)}
            </button>
          ))}
        </div>
        <p className="field__help">{t('calc.presets.note')}</p>
      </div>

      <div className="fields fields--3">
        <Field id="calc-kdb" rule="kdb" label={f('kdb').label} unit={f('kdb').unit} help={f('kdb').help} value={land.kdb} onChange={(v) => setLand({ kdb: v })} />
        <Field id="calc-klb" rule="klb" label={f('klb').label} unit={f('klb').unit} help={f('klb').help} value={land.klb} onChange={(v) => setLand({ klb: v })} />
        <Field id="calc-kdh" rule="kdh" label={f('kdh').label} unit={f('kdh').unit} help={f('kdh').help} value={land.kdh} onChange={(v) => setLand({ kdh: v })} />
      </div>
      <div className="fields fields--2">
        <Field id="calc-maxFloors" optional label={f('maxFloors').label} help={f('maxFloors').help} value={land.maxFloors} onChange={(v) => setLand({ maxFloors: v })} />
      </div>

      {r ? (
        <>
          {r.conflict ? <Notice>{t('calc.w.conflict', { fp: fmtArea(r.fp, lang) })}</Notice> : null}
          {klbLow ? <Notice>{t('calc.w.klbLow', { floorArea: fmtArea(r.floorArea, lang) })}</Notice> : null}

          <dl className="facts">
            <div>
              <dt>{t('calc.r.floors.label')}</dt>
              <dd>
                {floorsText(r, t, lang)}
                {r.capped ? <span className="facts__note"> {t('calc.r.floors.capped')}</span> : null}
              </dd>
            </div>
            <div>
              <dt>{t('calc.r.cover.label')}</dt>
              <dd className="nums">{t('calc.r.cover.value', { fp: fmtArea(r.fp, lang), pct: fmtPct((r.fp / r.A) * 100, lang) })}</dd>
            </div>
            <div>
              <dt>{t('calc.r.area.label')}</dt>
              <dd className="nums">{fmtArea(r.A, lang)}</dd>
            </div>
            <div>
              <dt>{t('calc.r.green.label')}</dt>
              <dd className="nums">{fmtArea(r.greenMin, lang)}</dd>
            </div>
            <div>
              <dt>{t('calc.r.parking.label')}</dt>
              <dd className="nums">
                {r.cars > 0 ? t('calc.r.parking.value', { cars: fmtNum(r.cars, lang) }) : t('calc.r.parking.tight')}
                <span className="facts__note"> ({t('calc.r.parking.detail', { open: fmtArea(r.open, lang) })})</span>
              </dd>
            </div>
          </dl>

          <div className="calc-next">
            {entry === 'building' ? (
              <>
                <Button as="button" onClick={() => goStep(3)} data-next="building" icon={null}>
                  {t('calc.next.building')}
                </Button>
                <button type="button" className="link" onClick={() => goStep(2)}>
                  {t('calc.next.ideasAlt')}
                  <ArrowRight />
                </button>
              </>
            ) : (
              <>
                <Button as="button" onClick={() => goStep(2)} data-next="ideas">
                  {t('calc.next.ideas')}
                </Button>
                <button type="button" className="link" onClick={() => goStep(3)}>
                  {t('calc.next.addFloor')}
                  <ArrowRight />
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <Notice tone="info">{t('calc.w.empty')}</Notice>
      )}

      <How step={1} />
    </>
  );
}

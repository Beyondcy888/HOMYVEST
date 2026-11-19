import { useT } from '../../i18n/useT.js';
import { useCalc } from '../../lib/calc/store.ts';
import { fmtArea, fmtKlb, fmtPct } from '../../i18n/format.js';
import { ArrowRight } from '../../components/ui/Icons.jsx';
import { Field, Gauge, LandChip, Notice, ResultsCta, How } from './parts.jsx';

/** Step 3: already built (finished or not)? Does it follow the rules, and can a floor be added? */
export default function Step3({ results, goStep }) {
  const { t, lang } = useT();
  const { r, chk } = results;
  const c = useCalc((s) => s.check);
  const setCheck = useCalc((s) => s.setCheck);
  const f = (key) => t(`calc.f.${key}`);

  if (!r || !chk) {
    return (
      <>
        <Notice tone="info">{t('calc.s3.needLand')}</Notice>
        <button type="button" className="link link--underlined" onClick={() => goStep(1)}>
          {t('calc.tabs')[0]}
        </button>
      </>
    );
  }

  const g = (key) => t(`calc.s3.g.${key}`);
  return (
    <>
      <div className="step-head">
        <h3 className="t-h2">{t('calc.s3.title')}</h3>
        <p className="ink-2">{t('calc.s3.body')}</p>
      </div>
      <LandChip r={r} onEdit={() => goStep(1)} />

      <div className="fields fields--3">
        <Field id="calc-fp" label={f('fp').label} unit="m²" help={f('fp').help} value={c.fp} onChange={(v) => setCheck({ fp: v })} />
        <Field id="calc-tfa" label={f('tfa').label} unit="m²" help={f('tfa').help} value={c.tfa} onChange={(v) => setCheck({ tfa: v })} />
        <Field id="calc-green" label={f('green').label} unit="m²" help={f('green').help} value={c.green} onChange={(v) => setCheck({ green: v })} />
      </div>

      <div className="gauges">
        <Gauge
          rule="kdb"
          name={g('kdb').name}
          value={chk.vKdb}
          limit={r.kdb}
          ok={chk.okKdb}
          format={(v) => fmtPct(v, lang)}
          line={chk.okKdb ? t('calc.s3.g.kdb.ok', { fpRoom: fmtArea(chk.fpRoom, lang) }) : t('calc.s3.g.kdb.over', { over: fmtArea(-chk.fpRoom, lang) })}
        />
        <Gauge
          rule="klb"
          name={g('klb').name}
          value={chk.vKlb}
          limit={r.klb}
          ok={chk.okKlb}
          format={(v) => fmtKlb(v, lang)}
          line={chk.okKlb ? t('calc.s3.g.klb.ok', { faRoom: fmtArea(chk.faRoom, lang) }) : t('calc.s3.g.klb.over', { over: fmtArea(-chk.faRoom, lang) })}
        />
        <Gauge
          rule="kdh"
          atLeast
          name={g('kdh').name}
          value={chk.vKdh}
          limit={r.kdh}
          ok={chk.okKdh}
          format={(v) => fmtPct(v, lang)}
          line={chk.okKdh ? t('calc.s3.g.kdh.ok') : t('calc.s3.g.kdh.short', { greenShort: fmtArea(chk.greenShort, lang) })}
        />
      </div>

      {chk.leftover < 0 ? (
        <Notice>{t('calc.s3.leftoverNeg')}</Notice>
      ) : (
        <p className="leftover nums" data-leftover>
          {t('calc.s3.leftover', { leftover: fmtArea(chk.leftover, lang), pct: fmtPct((chk.leftover / chk.A) * 100, lang) })}
        </p>
      )}

      <ResultsCta />
      <button type="button" className="link calc-alt" onClick={() => goStep(2)}>
        {t('calc.s3.toIdeas')}
        <ArrowRight />
      </button>
      <How step={3} />
    </>
  );
}

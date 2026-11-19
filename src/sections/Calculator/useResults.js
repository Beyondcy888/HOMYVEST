// Everything the calculator shows is derived here from the locked engine. Components never do math.
import { useMemo } from 'react';
import { potential, ideas, rank, check } from '../../lib/calc/calc.ts';
import { useCalc } from '../../lib/calc/store.ts';
import { fmtArea, fmtNum } from '../../i18n/format.js';

export function useResults() {
  const land = useCalc((s) => s.land);
  const ideasIn = useCalc((s) => s.ideas);
  const checkIn = useCalc((s) => s.check);
  return useMemo(() => {
    const r = potential(land);
    const res = r ? ideas(r, ideasIn) : null;
    const ranking = res ? rank(res) : null;
    const chk = check(land, checkIn);
    const klbLow = Boolean(r && r.klb > 0 && r.kdb > 0 && r.klb < r.kdb / 100);
    return { land, ideasIn, checkIn, r, res, ranking, chk, klbLow };
  }, [land, ideasIn, checkIn]);
}

/** "3 floors + a smaller top floor of 120 m²" (docs/05 §5, wording in docs/07 §9). */
export function floorsText(r, t, lang) {
  if (!r || r.floorArea <= 0) return t('calc.r.floors.none');
  if (r.full === 0) return t('calc.r.floors.single', { partial: fmtArea(r.partial, lang) });
  let text = r.full === 1 ? t('calc.r.floors.fullOne') : t('calc.r.floors.fullMany', { full: fmtNum(r.full, lang) });
  if (r.partial > 0) text += ` ${t('calc.r.floors.plusPartial', { partial: fmtArea(r.partial, lang) })}`;
  return text;
}

/** "What fits" line for an idea card. */
export function fitsText(key, idea, t, lang) {
  if (!idea || !idea.fits) return t('calc.s2.fits.none');
  if (key === 'kos') return t('calc.s2.fits.kos', { n: fmtNum(idea.units, lang) });
  if (key === 'ruko') return t('calc.s2.fits.ruko', { n: fmtNum(idea.units, lang), m: fmtArea(idea.perUnit ?? 0, lang) });
  if (key === 'rumah') return t('calc.s2.fits.rumah', { n: fmtNum(idea.units, lang) });
  return t('calc.s2.fits.gudang', { m: fmtArea(idea.built, lang) });
}

/** The step 3 answer sentence. */
export function answerText(chk, t, lang) {
  if (!chk) return t('calc.s3.needLand');
  const fp = fmtArea(chk.fp, lang);
  switch (chk.answer.kind) {
    case 'broken':
      return t('calc.s3.a.broken');
    case 'needFootprint':
      return t('calc.s3.a.needFp');
    case 'many':
      return t('calc.s3.a.many', { extra: fmtNum(chk.answer.extra, lang), fp });
    case 'one':
      return t('calc.s3.a.one', { fp });
    case 'smaller':
      return t('calc.s3.a.smaller', { faRoom: fmtArea(chk.faRoom, lang), fp });
    default:
      return t('calc.s3.a.none');
  }
}

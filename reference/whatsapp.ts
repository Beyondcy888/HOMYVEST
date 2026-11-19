// Builds the prefilled WhatsApp link. Wording lives in docs/07 §12; keep these templates in sync.
import { potential, ideas, rank, check, fmtArea, fmtKlb, fmtYears, type Land, type Ideas, type Check, type Lang, type IdeaKey } from './calc.ts';

export const WHATSAPP_NUMBER = '6282110106088';

const IDEA_NAMES: Record<Lang, Record<IdeaKey, string>> = {
  en: { kos: 'Kos-kosan', ruko: 'Ruko', rumah: 'Rental houses', gudang: 'Warehouse' },
  id: { kos: 'Kos-kosan', ruko: 'Ruko', rumah: 'Rumah sewa', gudang: 'Gudang' },
};

export type Share = { lang: Lang; land: Land; ideas: Ideas; check: Check; selectedIdea?: IdeaKey | null; usedStep3?: boolean };

export function buildWhatsAppMessage(s: Share): string {
  const { lang } = s;
  const r = potential(s.land);
  if (!r) {
    return lang === 'id'
      ? 'Halo HOMYVEST! Saya punya lahan/bangunan yang belum produktif dan ingin tahu bisa dijadikan apa. Bisa kita ngobrol?'
      : "Hi HOMYVEST! I have land or a building that isn't earning yet, and I'd like to know what it could become. Can we talk?";
  }
  const lines: string[] = [];
  const maxF = Number(s.land.maxFloors) || 0;
  const rules = `KDB ${r.kdb}%, KLB ${fmtKlb(r.klb, lang)}, KDH ${r.kdh}%` + (maxF > 0 ? (lang === 'id' ? `, maks. ${maxF} lantai` : `, max ${maxF} floors`) : '');
  if (lang === 'id') {
    lines.push('Halo HOMYVEST! Saya sudah mencoba cek lahan di website Anda.');
    lines.push(`• Lahan: ${r.P} × ${r.L} m (${fmtArea(r.A, lang)})`);
    lines.push(`• Aturan: ${rules}`);
    lines.push(`• Boleh dibangun: hingga ${fmtArea(r.floorArea, lang)}`);
  } else {
    lines.push('Hi HOMYVEST! I tried the land check on your website.');
    lines.push(`• Land: ${r.P} × ${r.L} m (${fmtArea(r.A, lang)})`);
    lines.push(`• Rules: ${rules}`);
    lines.push(`• Allowed to build: up to ${fmtArea(r.floorArea, lang)}`);
  }
  const res = ideas(r, s.ideas);
  const pick = s.selectedIdea ? res[s.selectedIdea] : rank(res).fastest;
  if (pick && pick.payback !== null) {
    const name = IDEA_NAMES[lang][pick.key];
    lines.push(lang === 'id'
      ? `• Ide yang paling saya minati: ${name} (balik modal sekitar ${fmtYears(pick.payback, lang)})`
      : `• Idea I'm most interested in: ${name} (pays back in about ${fmtYears(pick.payback, lang)})`);
  }
  if (s.usedStep3) {
    const c = check(s.land, s.check);
    if (c && c.fp > 0) {
      const ans = c.answer.kind === 'many' || c.answer.kind === 'one'
        ? (lang === 'id' ? `bisa tambah ${c.answer.extra} lantai` : `room for ${c.answer.extra} more floor${c.answer.extra > 1 ? 's' : ''}`)
        : c.answer.kind === 'broken' ? (lang === 'id' ? 'ada aturan yang terlampaui' : 'a rule is currently exceeded')
        : c.answer.kind === 'smaller' ? (lang === 'id' ? 'hanya muat lantai yang lebih kecil' : 'only a smaller floor fits')
        : (lang === 'id' ? 'luas lantai sudah maksimal' : 'floor area is used up');
      lines.push(lang === 'id'
        ? `• Bangunan yang ada: luas dasar ${fmtArea(c.fp, lang)}, total lantai ${fmtArea(c.tfa, lang)} (${ans})`
        : `• Existing building: footprint ${fmtArea(c.fp, lang)}, total floor area ${fmtArea(c.tfa, lang)} (${ans})`);
    }
  }
  lines.push(lang === 'id' ? 'Saya ingin membahas langkah selanjutnya.' : "I'd like to talk about the next steps.");
  return lines.join('\n');
}

export const whatsAppUrl = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

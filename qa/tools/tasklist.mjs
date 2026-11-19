// Ticks items in TASKLIST.md.
//   node qa/tools/tasklist.mjs done "M2" "M3"                 → every item under those milestone headings becomes [x]
//   node qa/tools/tasklist.mjs set x "Depth maps"             → the first item containing the text becomes [x]
//   node qa/tools/tasklist.mjs set "~" "Hero choreography"    → in progress
//   node qa/tools/tasklist.mjs set "!" "Playwright Claude"    → blocked / fallback
import fs from 'node:fs';

const file = 'TASKLIST.md';
let text = fs.readFileSync(file, 'utf8');
const [cmd, ...args] = process.argv.slice(2);

if (cmd === 'done') {
  for (const name of args) {
    const a = text.indexOf(`## ${name}`);
    if (a < 0) { console.error(`no heading "${name}"`); continue; }
    const b = text.indexOf('\n## ', a + 3);
    const seg = text.slice(a, b < 0 ? undefined : b).replace(/- \[[ ~]\]/g, '- [x]');
    text = text.slice(0, a) + seg + (b < 0 ? '' : text.slice(b));
  }
} else if (cmd === 'set') {
  const [mark, ...needles] = args;
  for (const needle of needles) {
    const lines = text.split('\n');
    const i = lines.findIndex((l) => /^- \[.\]/.test(l) && l.includes(needle));
    if (i < 0) { console.error(`no item containing "${needle}"`); continue; }
    lines[i] = lines[i].replace(/^- \[.\]/, `- [${mark}]`);
    text = lines.join('\n');
  }
}
fs.writeFileSync(file, text);
console.log(`${(text.match(/- \[x\]/g) || []).length} done, ${(text.match(/- \[~\]/g) || []).length} in progress, ${(text.match(/- \[ \]/g) || []).length} to do`);

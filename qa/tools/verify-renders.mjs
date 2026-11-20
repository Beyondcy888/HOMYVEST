// Proves the owner's original renders were not touched: compares every file in renders/ with the
// SHA-256, size and modified time recorded in qa/renders-originals.sha256.txt before any work began.
//   node qa/tools/verify-renders.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const lines = fs.readFileSync('qa/renders-originals.sha256.txt', 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
let ok = 0;
const problems = [];
const listed = new Set();
for (const line of lines) {
  const [hash, size, mtime, ...rest] = line.split(/\s{2}/);
  const rel = rest.join('  ');
  listed.add(rel.toLowerCase());
  if (!fs.existsSync(rel)) { problems.push(`MISSING  ${rel}`); continue; }
  const buf = fs.readFileSync(rel);
  const now = crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
  const st = fs.statSync(rel);
  if (now !== hash) problems.push(`CHANGED  ${rel}`);
  else if (String(st.size) !== size) problems.push(`SIZE     ${rel}`);
  else if (Math.abs(st.mtime.getTime() - new Date(mtime).getTime()) > 2000) problems.push(`TOUCHED  ${rel} (content identical, modified time differs)`);
  else ok += 1;
}
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name).split(path.sep).join('/')]));
for (const f of walk('renders')) if (!listed.has(f.toLowerCase())) problems.push(`NEW FILE ${f}`);
console.log(`${ok} of ${lines.length} originals identical (content, size and modified time).`);
console.log(problems.length ? problems.join('\n') : 'No file in renders/ was changed, added or removed.');
process.exit(problems.length ? 1 : 0);

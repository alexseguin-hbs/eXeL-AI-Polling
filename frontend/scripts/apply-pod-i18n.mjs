// apply-pod-i18n.mjs — append the fleet's translations of the new pod keys to each lib/i18n-sign/<code>.ts, refusing any
// entry that drops a placeholder, is empty, or is still the English. Reads the fleet JSON (argv[2]) and the key list
// (argv[3], { key, en }[]). Writes only the keys a file is missing; never rewrites an existing entry.
import fs from 'fs';
const fleet = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const keys = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const en = Object.fromEntries(keys.map((k) => [k.key, k.en]));
const ph = (s) => (String(s).match(/\{[a-z_]+\}/g) ?? []).sort().join(' ');
const refusals = []; let written = 0;
for (const g of fleet.groups) for (const lang of g.languages) {
  const file = `lib/i18n-sign/${lang.code}.ts`;
  if (!fs.existsSync(file)) { refusals.push(`${lang.code}: no file`); continue; }
  let src = fs.readFileSync(file, 'utf8');
  const have = new Set([...src.matchAll(/^\s*"(soi\.[^"]+)":/gm)].map((m) => m[1]));
  const got = Object.fromEntries(lang.entries.map((e) => [e.key, String(e.text ?? '').trim()]));
  const lines = [];
  for (const k of keys) {
    if (have.has(k.key)) continue;
    const t = got[k.key];
    if (!t) { refusals.push(`${lang.code} ${k.key}: missing`); continue; }
    if (ph(t) !== ph(k.en)) { refusals.push(`${lang.code} ${k.key}: placeholders ${ph(t)} ≠ ${ph(k.en)}`); continue; }
    if (t === k.en && !/^https?:/.test(k.en)) { refusals.push(`${lang.code} ${k.key}: still English`); continue; }
    lines.push(`  ${JSON.stringify(k.key)}: ${JSON.stringify(t)},`);
  }
  if (!lines.length) continue;
  const i = src.lastIndexOf('};');
  src = src.slice(0, i) + '  // Pod page — the guide, the labels, the placeholders (2026-09-12).\n' + lines.join('\n') + '\n' + src.slice(i);
  fs.writeFileSync(file, src); written += lines.length; console.log(`${lang.code}: +${lines.length}`);
}
if (refusals.length) { console.error(`REFUSED ${refusals.length} —\n  ` + refusals.slice(0, 40).join('\n  ')); process.exit(1); }
console.log(`written ${written} entries, 0 refusals`);

// apply-i18n.mjs — append a fleet's translations to a lazy per-language store, refusing any entry that drops a placeholder,
// is empty, or is still the English. Generalises scripts/apply-pod-i18n.mjs (2026-09-12 night) to any store and any key
// list. Never rewrites an existing entry; creates a language file when none exists.
//   node scripts/apply-i18n.mjs <fleet.json> <gaps.json> <lib/i18n-app>
//   fleet.json: { languages: [{ code, entries: [{ key, text }] }] } (or { groups: [{ languages: [...] }] })
//   gaps.json:  { gaps: { code: [{ key, en, context }] } }
import fs from 'fs'; import path from 'path';
const [,, fleetPath, gapsPath, dirArg] = process.argv;
if (!fleetPath || !gapsPath || !dirArg) { console.error('usage: apply-i18n.mjs <fleet.json> <gaps.json> <store dir>'); process.exit(1); }
const fleet = JSON.parse(fs.readFileSync(fleetPath, 'utf8'));
const gapsAll = JSON.parse(fs.readFileSync(gapsPath, 'utf8')).gaps;
const languages = fleet.languages ?? (fleet.groups ?? []).flatMap((g) => g.languages);
const ph = (s) => (String(s).match(/\{[a-z_]+\}/g) ?? []).sort().join(' ');
const KEEP = /^(https?:\/\/|[0-9.\s%×·—–-]+$|[A-Z0-9_\-.]+$)/;   // a URL, a number, a code may stay as they are
const ALLOWED = (() => { const f = path.resolve(process.cwd(), '..', 'docs/asks/2026-09-12_lexicon_identical_allowed.psv'); if (!fs.existsSync(f)) return new Set(); return new Set(fs.readFileSync(f, 'utf8').split('\n').slice(1).filter(Boolean).map((l) => { const [scope, key] = l.split('|'); return `${scope}|${key}`; })); })();   // reviewed: a formula, a name, a unit, or a word the language shares
const allowedIdentical = (code, key) => ALLOWED.has(`*|${key}`) || ALLOWED.has(`${code}|${key}`);
const refusals = []; let written = 0; const perLang = {};
for (const lang of languages) {
  const gaps = gapsAll[lang.code]; if (!gaps) { refusals.push(`${lang.code}: not a language in the gap list`); continue; }
  const file = path.join(dirArg, `${lang.code}.ts`);
  let src = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : `/** App-wide gap fill — ${lang.code}. Every master lexicon key this language lacked elsewhere; placeholders kept verbatim. Loaded on demand (lib/i18n-app/index.ts). */\nconst T: Record<string, string> = {\n};\nexport default T;\n`;
  const have = new Set([...src.matchAll(/^\s*"([^"]+)":/gm)].map((m) => m[1]));
  const unent = (x) => x.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");   // the app renders text, not HTML
  const got = Object.fromEntries(lang.entries.map((e) => [e.key, unent(String(e.text ?? '').trim())]));
  const lines = []; let identical = 0;
  for (const g of gaps) {
    if (have.has(g.key)) continue;
    if (!String(g.en).trim()) continue;   // an empty English default has nothing to translate — not a gap
    const t = got[g.key];
    if (!t) { refusals.push(`${lang.code} ${g.key}: missing`); continue; }
    if (ph(t) !== ph(g.en)) { refusals.push(`${lang.code} ${g.key}: placeholders ${ph(t) || '∅'} ≠ ${ph(g.en) || '∅'}`); continue; }
    if (t === g.en) { if (KEEP.test(g.en) || allowedIdentical(lang.code, g.key)) identical++; else { refusals.push(`${lang.code} ${g.key}: still English`); continue; } }
    lines.push(`  ${JSON.stringify(g.key)}: ${JSON.stringify(t)},`);
  }
  if (lines.length) { const i = src.lastIndexOf('};'); src = src.slice(0, i) + lines.join('\n') + '\n' + src.slice(i); fs.writeFileSync(file, src); }
  written += lines.length; perLang[lang.code] = { written: lines.length, identicalKept: identical };
  console.log(`${lang.code}: +${lines.length}${identical ? ` (${identical} kept as-is: urls/codes)` : ''}`);
}
if (refusals.length) { console.error(`REFUSED ${refusals.length} —\n  ` + refusals.slice(0, 60).join('\n  ') + (refusals.length > 60 ? `\n  … ${refusals.length - 60} more` : '')); fs.writeFileSync(path.join(path.dirname(fleetPath), 'apply-i18n.refusals.txt'), refusals.join('\n')); }
console.log(`written ${written} entries · refused ${refusals.length}`);
process.exit(refusals.length ? 1 : 0);

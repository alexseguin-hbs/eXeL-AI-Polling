// lexicon-identical.mjs — the placeholders the operator means (2026-09-13: "dont use place holders translate"): values
// that EQUAL the English default but are real words, sitting untranslated in a non-English language slot. Yesterday's
// gap measure counted only EMPTY slots; the old seeded store put the English string as the value, so those read as
// filled. This measures the same merged map the app builds and lists every translatable-identical value per language —
// excluding what the coverage gate legitimately keeps (KEEP regex) and the reviewed allow-list.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/lexicon-identical.mjs [--out <file>] [--strict]
import fs from 'node:fs'; import path from 'node:path';
const L = await import('../lib/lexicon-data.ts');
const { SEEDED_TRANSLATIONS } = await import('../lib/lexicon-translations.ts');
const { SOI_R228_TRANSLATIONS } = await import('../lib/lexicon-translations-soi-r228.ts');
const { SIGN_TRANSLATIONS } = await import('../lib/lexicon-translations-sign.ts');
const { ES_SIGN } = await import('../lib/lexicon-translations-es-sign.ts');
const en = L.DEFAULT_ENGLISH_TRANSLATIONS;
const keys = Object.keys(en).filter((k) => String(en[k].englishDefault ?? '').trim());
const codes = L.INITIAL_LANGUAGES.map((l) => l.code).filter((c) => c !== 'en');
// the gate's own definitions, kept in lockstep
const KEEP = /^(https?:\/\/|[0-9.\s%×·—–\-]+$|[A-Z0-9_\-.]+$)/;
const ALLOWED = (() => { const f = path.resolve(process.cwd(), '..', 'docs/asks/2026-09-12_lexicon_identical_allowed.psv'); if (!fs.existsSync(f)) return new Set(); return new Set(fs.readFileSync(f, 'utf8').split('\n').slice(1).filter(Boolean).map((l) => { const [scope, key] = l.split('|'); return `${scope}|${key}`; })); })();
const allowedIdentical = (code, key) => ALLOWED.has(`*|${key}`) || ALLOWED.has(`${code}|${key}`);
const lazy = async (dir, code) => { const f = path.join(process.cwd(), 'lib', dir, `${code}.ts`); if (!fs.existsSync(f)) return {}; try { return (await import(`../lib/${dir}/${code}.ts`)).default ?? {}; } catch { return {}; } };
const out = {}; const rows = [];
for (const code of codes) {
  const m = { ...(SEEDED_TRANSLATIONS[code] ?? {}), ...(SOI_R228_TRANSLATIONS[code] ?? {}), ...(SIGN_TRANSLATIONS[code] ?? {}), ...(code === 'es' ? ES_SIGN : {}), ...(await lazy('i18n-sign', code)), ...(await lazy('i18n-app', code)) };
  const bad = keys.filter((k) => m[k] && m[k] === en[k].englishDefault && !KEEP.test(en[k].englishDefault) && !allowedIdentical(code, k));
  out[code] = bad.map((k) => ({ key: k, en: en[k].englishDefault, context: en[k].context ?? '' }));
  rows.push([code, bad.length]);
}
const outPath = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : path.resolve(process.cwd(), '..', 'docs/asks/2026-09-13_lexicon_identical.json');
fs.writeFileSync(outPath, JSON.stringify({ note: 'translatable-identical: value == English default, not KEEP-trivial, not on the allow-list', identical: out }, null, 1));
rows.sort((a, b) => b[1] - a[1]);
for (const [c, n] of rows) console.log(`${c}  ${String(n).padStart(4)}`);
const total = rows.reduce((n, r) => n + r[1], 0);
console.log(`TOTAL translatable-identical outside the allow-list: ${total} → ${path.relative(path.resolve(process.cwd(), '..'), outPath)}`);
if (process.argv.includes('--strict') && total > 0) process.exit(1);

// lexicon-gaps.mjs — MEASURE the translation gaps before filling any (operator 2026-09-12: "translate UI/UX to standard 33
// languages" → only fill gaps for existing keys). For every non-English language: the master keys whose value is missing
// after the SAME merge the app performs (seeded → r228 → sign → ES_SIGN; plus the lazy lib/i18n-sign and lib/i18n-app
// files). Writes docs/asks/2026-09-12_lexicon_gaps.json ({ code: [{ key, en, context }] }) and prints a summary.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/lexicon-gaps.mjs [--out <file>]
import fs from 'node:fs'; import path from 'node:path';
const L = await import('../lib/lexicon-data.ts');
const { SEEDED_TRANSLATIONS } = await import('../lib/lexicon-translations.ts');
const { SOI_R228_TRANSLATIONS } = await import('../lib/lexicon-translations-soi-r228.ts');
const { SIGN_TRANSLATIONS } = await import('../lib/lexicon-translations-sign.ts');
const { ES_SIGN } = await import('../lib/lexicon-translations-es-sign.ts');
const en = L.DEFAULT_ENGLISH_TRANSLATIONS;
const keys = Object.keys(en);
const codes = L.INITIAL_LANGUAGES.map((l) => l.code).filter((c) => c !== 'en');
const lazy = async (dir, code) => { const f = path.join(process.cwd(), 'lib', dir, `${code}.ts`); if (!fs.existsSync(f)) return {}; try { return (await import(`../lib/${dir}/${code}.ts`)).default ?? {}; } catch { return {}; } };
const gaps = {}; const rows = [];
for (const code of codes) {
  const merged = { ...(SEEDED_TRANSLATIONS[code] ?? {}), ...(SOI_R228_TRANSLATIONS[code] ?? {}), ...(SIGN_TRANSLATIONS[code] ?? {}), ...(code === 'es' ? ES_SIGN : {}), ...(await lazy('i18n-sign', code)), ...(await lazy('i18n-app', code)) };
  const missing = keys.filter((k) => !String(merged[k] ?? '').trim());
  gaps[code] = missing.map((k) => ({ key: k, en: en[k].englishDefault, context: en[k].context ?? '' }));
  rows.push([code, keys.length - missing.length, missing.length]);
}
const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : path.resolve(process.cwd(), '..', 'docs/asks/2026-09-12_lexicon_gaps.json');
fs.writeFileSync(out, JSON.stringify({ masterKeys: keys.length, measuredAt: 'merge = seeded → r228 → sign → ES_SIGN → i18n-sign → i18n-app', gaps }, null, 1));
console.log(`master keys ${keys.length} · languages ${codes.length}`);
for (const [c, have, miss] of rows) console.log(`${c}  ${String(have).padStart(5)} have  ${String(miss).padStart(4)} missing`);
const total = rows.reduce((n, r) => n + r[2], 0);
console.log(`TOTAL missing entries: ${total} → ${path.relative(path.resolve(process.cwd(), '..'), out)}`);
if (process.argv.includes('--strict') && total > 0) process.exit(1);

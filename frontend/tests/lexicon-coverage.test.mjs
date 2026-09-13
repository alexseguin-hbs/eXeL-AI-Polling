// lexicon-coverage — THE POD GATE (operator 2026-09-13: "we should be only updating Innovation Pod"): for every non-English
// language, every soi.pod.* key has a non-empty translation, placeholders match, and NONE equals English outside the
// reviewed allow-list. Scoped to the Innovation Pod (/soi-session); other apps are out of scope here.
// (History: this was briefly a whole-app gate; reverted to pod scope 2026-09-13.) Merge is the app's own
// (seeded → r228 → sign → ES_SIGN → lazy i18n-sign), placeholders match the English, and NO value equals
// the English default unless it is KEEP-trivial or on the reviewed allow-list (operator 2026-09-13: no placeholders). Keys added after the last fill go in AFTER_FILL — listed,
// never silent — until the next fill. Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/lexicon-coverage.test.mjs
import fs from 'node:fs'; import path from 'node:path';
const L = await import('../lib/lexicon-data.ts');
const { SEEDED_TRANSLATIONS } = await import('../lib/lexicon-translations.ts');
const { SOI_R228_TRANSLATIONS } = await import('../lib/lexicon-translations-soi-r228.ts');
const { SIGN_TRANSLATIONS } = await import('../lib/lexicon-translations-sign.ts');
const { ES_SIGN } = await import('../lib/lexicon-translations-es-sign.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const en = L.DEFAULT_ENGLISH_TRANSLATIONS;
// SCOPED TO THE INNOVATION POD (operator 2026-09-13: "we should be only updating Innovation Pod"): this gate enforces the
// pod's own keys — soi.pod.* — in every language, no placeholders. Other apps translate in their own scope, not here.
const keys = Object.keys(en).filter((k) => k.startsWith('soi.pod.'));
const AFTER_FILL = new Set([]);   // 2026-09-12 morning keys: English until the second fill pass lands (listed, never silent)   // keys added after the last fill pass: English until the next pass — listed here, never silent
const ph = (s) => (String(s).match(/\{[a-z_]+\}/g) ?? []).sort().join(' ');
const KEEP = /^(https?:\/\/|[0-9.\s%×·—–-]+$|[A-Z0-9_\-.]+$)/;
const ALLOWED = (() => { const f = path.resolve(process.cwd(), '..', 'docs/asks/2026-09-12_lexicon_identical_allowed.psv'); if (!fs.existsSync(f)) return new Set(); return new Set(fs.readFileSync(f, 'utf8').split('\n').slice(1).filter(Boolean).map((l) => { const [scope, key] = l.split('|'); return `${scope}|${key}`; })); })();   // reviewed: a formula, a name, a unit, or a word the language shares
const allowedIdentical = (code, key) => ALLOWED.has(`*|${key}`) || ALLOWED.has(`${code}|${key}`);

const lazy = async (dir, code) => { const f = path.join(process.cwd(), 'lib', dir, `${code}.ts`); if (!fs.existsSync(f)) return {}; try { return (await import(`../lib/${dir}/${code}.ts`)).default ?? {}; } catch { return {}; } };
const codes = L.INITIAL_LANGUAGES.map((l) => l.code).filter((c) => c !== 'en');
ok(codes.length === 32, `32 languages beyond English (got ${codes.length})`);
for (const code of codes) {
  const m = { ...(SEEDED_TRANSLATIONS[code] ?? {}), ...(SOI_R228_TRANSLATIONS[code] ?? {}), ...(SIGN_TRANSLATIONS[code] ?? {}), ...(code === 'es' ? ES_SIGN : {}), ...(await lazy('i18n-sign', code)) };
  const missing = keys.filter((k) => String(en[k].englishDefault ?? '').trim() && !AFTER_FILL.has(k) && !String(m[k] ?? '').trim());   // an empty English default is not a gap
  const pending = keys.filter((k) => AFTER_FILL.has(k) && !String(m[k] ?? '').trim());
  if (pending.length) console.log(`PENDING ${code}: ${pending.length} key(s) added after the last fill are English`);
  ok(missing.length === 0, `${code}: every master key has a value (missing ${missing.length}: ${missing.slice(0, 4).join(', ')})`);
  const badPh = keys.filter((k) => m[k] && ph(en[k].englishDefault) !== ph(m[k]));
  ok(badPh.length === 0, `${code}: placeholders kept (${badPh.length} differ: ${badPh.slice(0, 3).join(', ')})`);
  // NO PLACEHOLDERS (operator 2026-09-13: "dont use place holders translate"): a value may equal the English default
  // ONLY when it is KEEP-trivial (a URL, number, symbol or all-caps token) or on the reviewed allow-list. Every other
  // real word must be translated — zero tolerance, not the old 10 % slack.
  const same = keys.filter((k) => m[k] && m[k] === en[k].englishDefault && !KEEP.test(en[k].englishDefault) && !allowedIdentical(code, k));
  ok(same.length === 0, `${code}: no untranslated English left outside the allow-list (${same.length}: ${same.slice(0, 6).join(", ")})`);
}
console.log(`lexicon-coverage: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);

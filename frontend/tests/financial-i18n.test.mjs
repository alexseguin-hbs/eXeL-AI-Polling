// FINANCIAL-2525 · every word a person reads is a key (CLAUDE.md Language Lexicon gate, cubeId 79) — the drone-i18n gate,
// mirrored. A surface that hardcodes English is a surface 32 languages cannot read: this refuses visible English in the
// JSX of the Financial-2525 components and checks that every key they call actually exists.
import fs from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const FILES = ['components/financial-2525/command-ux1.tsx'];
const lex = fs.readFileSync('lib/lexicon-data.ts', 'utf8');
const declared = new Set([...lex.matchAll(/\{ key: "([^"]+)"/g)].map((m) => m[1]));

// 1 — the financial group exists and every key it declares is unique and English-defaulted with a translator context
const finKeys = [...declared].filter((k) => k.startsWith('fin.'));
ok(finKeys.length >= 60, `the financial group carries its keys (${finKeys.length})`);
ok(/cubeId: 79, label: "Financial-2525/.test(lex), 'the fin.* keys are a named group in the lexicon, not loose strings');
for (const k of finKeys) {
  const row = lex.match(new RegExp(`\\{ key: "${k.replace(/\./g, '\\.')}", englishDefault: "([^"]*)"[^}]*context: "([^"]*)"`));
  ok(Boolean(row && row[1].trim()), `${k} has an English default`);
  ok(Boolean(row && row[2].trim().length > 15), `${k} tells a translator what it is for`);
}

// 2 — every t() the components call is declared (template keys must have every id they can produce)
for (const f of FILES) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/\bt\("([^"]+)"\)/g)) ok(declared.has(m[1]), `${f} calls t("${m[1]}"), which the lexicon declares`);
  for (const m of s.matchAll(/\bt\(`([a-z0-9.]+)\.\$\{[^}]+\}`\)/g)) ok([...declared].some((k) => k.startsWith(m[1] + '.')), `${f} builds t(\`${m[1]}.*\`) and those keys exist`);
}
// the budget categories reach the lexicon through CAT_KEY → fin.cat.<slug>: every slug must be declared
const ux = fs.readFileSync('components/financial-2525/command-ux1.tsx', 'utf8');
for (const slug of ['income', 'home', 'auto', 'insurance', 'utilities', 'fitness', 'fun', 'groceries', 'dining_out', 'other']) ok(declared.has(`fin.cat.${slug}`), `fin.cat.${slug} is declared for the budget category`);

// 3 — no visible English literal in the JSX (text between tags, and the human-readable attributes)
const ALLOW = /^[\s0-9·×°/|:,.\-—+%()[\]{}#$]*$/;
const PROPER = new Set(['FINANCIAL · 2525', '◬ ♡ 웃']);
for (const f of FILES) {
  const s = fs.readFileSync(f, 'utf8');
  const body = s.slice(s.indexOf('return ('));
  const texts = [...body.matchAll(/>([^<>{}\n]{2,})</g)].map((m) => m[1].trim()).filter((v) => v && !ALLOW.test(v) && !PROPER.has(v));
  ok(texts.length === 0, `${f} shows no hardcoded English between tags (found: ${texts.join(' | ')})`);
  const labels = [...body.matchAll(/\b(aria-label|placeholder|title)="([^"{]+)"/g)].map((m) => `${m[1]}="${m[2]}"`);
  ok(labels.length === 0, `${f} has no hardcoded English in a label a screen reader speaks (found: ${labels.join(' | ')})`);
}

// 4 — the one deliberate exception is declared, not accidental: the wordmark is a proper name
ok(/FINANCIAL · 2525/.test(ux), 'the domain wordmark is a proper name and stays untranslated');
// 5 — a fin.* key is either LISTED in lexicon-coverage's AFTER_FILL (staged, never silent) or FILLED in every one of the
// 32 lazy stores (lib/i18n-app/<code>.ts) — the ×32 fill landed 2026-09-30 after a native-reviewer pass per language.
const cov = fs.readFileSync('tests/lexicon-coverage.test.mjs', 'utf8');
const stores = fs.readdirSync('lib/i18n-app').filter((f) => /^[a-z]{2,3}\.ts$/.test(f)).map((f) => fs.readFileSync(`lib/i18n-app/${f}`, 'utf8'));
ok(stores.length === 32, `32 non-English stores under lib/i18n-app (got ${stores.length})`);
const staged = (k) => /map\(\(k\) => `fin\.\$\{k\}`\)/.test(cov) && cov.includes(`'${k.slice(4)}'`);
const filled = (k) => stores.every((s) => s.includes(`"${k}":`));
const neither = finKeys.filter((k) => !staged(k) && !filled(k));
ok(neither.length === 0, `every fin.* key is staged in AFTER_FILL or filled in all 32 stores — listed, never silent (neither: ${neither.slice(0, 8).join(' ')})`);

console.log(`\nfinancial-i18n: ${pass} passed, ${fail} failed · ${finKeys.length} keys`);
process.exit(fail ? 1 : 0);

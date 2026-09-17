// DRONE-2525 · every word a person reads is a key (CLAUDE.md Language Lexicon gate, cubeId 78).
// A surface that hardcodes English is a surface 32 languages cannot read, so this refuses visible English
// in the JSX of the drone components and checks that every key they call actually exists.
import fs from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const FILES = ['components/drone-2525/command-ux1.tsx', 'components/drone-2525/arena-view.tsx', 'components/drone-2525/wire-svg.tsx', 'components/drone-2525/round.tsx', 'components/drone-2525/self-cal-panel.tsx', 'components/drone-2525/si-panel.tsx', 'components/drone-2525/crew-seat-panel.tsx', 'components/drone-2525/control-deck.tsx', 'components/drone-2525/round-status.tsx'];
const lex = fs.readFileSync('lib/lexicon-data.ts', 'utf8');
const declared = new Set([...lex.matchAll(/\{ key: "([^"]+)"/g)].map((m) => m[1]));

// 1 — the drone group exists and every key it declares is unique and English-defaulted
const droneKeys = [...declared].filter((k) => k.startsWith('drone.'));
ok(droneKeys.length >= 66, `the drone group carries its keys (${droneKeys.length})`);
ok(/cubeId: 78, label: "Drone-2525/.test(lex), 'the drone keys are a named group in the lexicon, not loose strings');
for (const k of droneKeys) {
  const row = lex.match(new RegExp(`\\{ key: "${k.replace(/\./g, '\\.')}", englishDefault: "([^"]*)"[^}]*context: "([^"]*)"`));
  ok(Boolean(row && row[1].trim()), `${k} has an English default`);
  ok(Boolean(row && row[2].trim().length > 15), `${k} tells a translator what it is for`);
}

// 2 — every t() the components call is declared
for (const f of FILES) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/\bt\("([^"]+)"\)/g)) ok(declared.has(m[1]), `${f} calls t("${m[1]}"), which the lexicon declares`);
  // A template key (t(`drone.mode.${id}`)) must have every id it can produce.
  for (const m of s.matchAll(/\bt\(`([a-z0-9.]+)\.\$\{[^}]+\}`\)/g)) {
    const prefix = m[1];
    // Check against EVERY declared key, not just the drone ones: this surface also speaks si.* now.
    ok([...declared].some((k) => k.startsWith(prefix + '.')), `${f} builds t(\`${prefix}.*\`) and those keys exist`);
  }
}

// 3 — no visible English literal in the JSX (text between tags, and the human-readable attributes)
const ALLOW = /^[\s0-9·×°/|:,.\-—+%()[\]{}#$]*$/;             // punctuation, numbers and separators are not words
const PROPER = new Set(['DRONE · 2525']);                     // the domain wordmark is a name, not a sentence
for (const f of FILES) {
  const s = fs.readFileSync(f, 'utf8');
  const body = s.slice(s.indexOf('return ('));
  const texts = [...body.matchAll(/>([^<>{}\n]{2,})</g)].map((m) => m[1].trim()).filter((v) => v && !ALLOW.test(v) && !PROPER.has(v));
  ok(texts.length === 0, `${f} shows no hardcoded English between tags (found: ${texts.join(' | ')})`);
  const labels = [...body.matchAll(/\b(aria-label|placeholder|title)="([^"{]+)"/g)].map((m) => `${m[1]}="${m[2]}"`);
  ok(labels.length === 0, `${f} has no hardcoded English in a label a screen reader speaks (found: ${labels.join(' | ')})`);
}

// 4 — the one deliberate exception is declared, not accidental: the wordmark "DRONE · 2525" is a name.
const shell = fs.readFileSync('components/drone-2525/command-ux1.tsx', 'utf8');
ok(/DRONE · 2525/.test(shell), 'the domain wordmark is a proper name and stays untranslated');

console.log(`\ndrone-i18n: ${pass} passed, ${fail} failed · ${droneKeys.length} keys`);
process.exit(fail ? 1 : 0);

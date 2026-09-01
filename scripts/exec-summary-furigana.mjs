// exec-summary-furigana.mjs — generate Japanese furigana for the Executive Summary.
//
// Operator: "add the japanese furigana analyzer."
//
// WHY THIS IS A GENERATOR AND NOT A BUILD STEP. Japanese needs a dictionary to read:
// a kanji's reading depends on the word it sits in, so unlike pinyin it cannot be
// resolved character by character. That dictionary (kuromoji + IPADIC, ~18 MB) is a
// dev-time tool, and its output is a judgement call that deserves review — so the
// readings are generated ONCE, here, and COMMITTED as
// docs/i18n/exec-summary.ja.furigana.json. The page build then stays synchronous,
// deterministic, and free of the dictionary; and what ships is a file a Japanese
// reader can audit rather than the opaque output of an analyser nobody can see.
//
// Run: node scripts/exec-summary-furigana.mjs [--write]
//
// Three fail-closed guarantees, because a wrong reading is worse than none:
//   1. LOSSLESS — stripping the ruby markup from the output must return the input
//      byte for byte, so annotating can never alter the operator's text.
//   2. OVERRIDES ALL FIRE — every curated correction states how many times it should
//      apply; a miscount fails the run. If the Japanese text is ever re-translated,
//      this is what tells us the corrections need re-reading instead of silently
//      rotting.
//   3. SOURCE STAMPED — the source hash is written into the cache, and the page build
//      refuses a cache that does not match the current ja.json.
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { createRequire } from 'module';

const SRC       = 'docs/i18n/exec-summary.ja.json';
const OVERRIDES = 'docs/i18n/ja-furigana-overrides.json';
const OUT       = 'docs/i18n/exec-summary.ja.furigana.json';
const DICT      = 'frontend/node_modules/kuromoji/dict';
const WRITE     = process.argv.includes('--write');

/* k00 is the <title> and k70 the seal image's alt — plain-text slots where ruby
   markup cannot live. They are left out of the cache entirely. */
const PLAIN = new Set(['k00', 'k70']);

const KANJI = /[㐀-䶿一-鿿]/;
const KANA  = /[ぁ-ゖァ-ヶー]/;
const kata2hira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Undo the annotation: what remains must equal what went in. */
const stripRuby = h => h.replace(/<rt>.*?<\/rt>/g, '').replace(/<\/?ruby>/g, '');

/* Furigana sits over the KANJI, not over kana the reader can already read. Given a
   surface and its reading, peel off the okurigana that matches at each end — 始まる
   with reading はじまる leaves 始 over はじ, and まる stays plain. When the core is
   several kanji the whole reading rides the run (group ruby), which is how print
   furigana sets a compound. */
function align(surface, reading) {
  if (!KANJI.test(surface)) return null;
  let s = surface, r = reading, head = '', tail = '';
  while (s.length && r.length && KANA.test(s[s.length - 1]) && s[s.length - 1] === r[r.length - 1]) {
    tail = s[s.length - 1] + tail; s = s.slice(0, -1); r = r.slice(0, -1);
  }
  while (s.length && r.length && KANA.test(s[0]) && s[0] === r[0]) {
    head += s[0]; s = s.slice(1); r = r.slice(1);
  }
  if (!s || !r || !KANJI.test(s)) return null;
  return { head, core: s, coreReading: r, tail };
}

const ruby = (base, reading) => '<ruby>' + esc(base) + '<rt>' + esc(reading) + '</rt></ruby>';

/* kuromoji is a GENERATOR-ONLY dependency and is deliberately NOT in package.json:
   the page build reads the committed readings and never needs the dictionary, so
   nobody pays 18 MB to build the site. Whoever regenerates installs it for the run. */
const require = createRequire(path.resolve('frontend') + '/package.json');
let kuromoji;
try { kuromoji = require('kuromoji'); }
catch {
  console.error('kuromoji is not installed — it is a generator-only tool, kept out of package.json.');
  console.error('Install it for this run, then re-run:');
  console.error('  cd frontend && npm install --no-save kuromoji');
  process.exit(1);
}
if (!fs.existsSync(DICT)) {
  console.error(`kuromoji dictionary missing at ${DICT} — reinstall kuromoji.`);
  process.exit(1);
}

const RAW = fs.readFileSync(SRC, 'utf8');
const SHA = crypto.createHash('sha256').update(RAW, 'utf8').digest('hex');
const JA  = JSON.parse(RAW);
const OV  = JSON.parse(fs.readFileSync(OVERRIDES, 'utf8'));
const TOK_OV = OV.token || {};
const PHR_OV = OV.phrase || {};
/* Longest phrase first, so 六十分 wins over a shorter run that starts inside it. */
const PHRASES = Object.keys(PHR_OV).sort((a, b) => b.length - a.length);
const fired = Object.fromEntries([...Object.keys(TOK_OV), ...Object.keys(PHR_OV)].map(k => [k, 0]));

const tokenizer = await new Promise((res, rej) =>
  kuromoji.builder({ dicPath: DICT }).build((e, t) => e ? rej(e) : res(t)));

let annotated = 0, plainTokens = 0;

function annotateSegment(seg) {
  const toks = tokenizer.tokenize(seg);
  let out = '', cur = 0;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const pos = t.word_position - 1;
    if (pos > cur) { out += seg.slice(cur, pos); cur = pos; }   // keep whatever sat between

    // A curated phrase reading wins over the analyser's token-by-token guess.
    let matched = null;
    for (const p of PHRASES) {
      let acc = '', j = i;
      while (j < toks.length && acc.length < p.length) { acc += toks[j].surface_form; j++; }
      if (acc === p) { matched = { phrase: p, end: j }; break; }
    }
    if (matched) {
      out += ruby(matched.phrase, PHR_OV[matched.phrase].reading);
      fired[matched.phrase]++;
      annotated++;
      cur += matched.phrase.length;
      i = matched.end - 1;
      continue;
    }

    const surface = t.surface_form;
    let reading = t.reading && t.reading !== '*' ? kata2hira(t.reading) : null;
    if (reading) {
      const key = surface + '|' + reading;
      if (TOK_OV[key]) { reading = TOK_OV[key].reading; fired[key]++; }
    }
    const a = reading ? align(surface, reading) : null;
    if (a) { out += a.head + ruby(a.core, a.coreReading) + a.tail; annotated++; }
    else   { out += surface; if (KANJI.test(surface)) plainTokens++; }
    cur = pos + surface.length;
  }
  out += seg.slice(cur);
  return out;
}

const keys = {};
for (const k of Object.keys(JA)) {
  if (PLAIN.has(k)) continue;
  const value = String(JA[k]);
  // Only text is annotated; tags pass through untouched.
  const built = value.split(/(<[^>]+>)/).map(s => (s.startsWith('<') || !s) ? s : annotateSegment(s)).join('');
  if (stripRuby(built) !== value) {
    console.error(`LOSSLESS CHECK FAILED on ${k} — annotation altered the text. Refusing to write.`);
    process.exit(1);
  }
  keys[k] = built;
}

// Every curated correction must fire exactly as many times as it claims.
const bad = [];
for (const [k, def] of [...Object.entries(TOK_OV), ...Object.entries(PHR_OV)]) {
  if (fired[k] !== def.expect) bad.push(`${k}: fired ${fired[k]}, expected ${def.expect}`);
}
if (bad.length) {
  console.error('OVERRIDE COUNT MISMATCH — the Japanese text moved under the corrections:');
  for (const b of bad) console.error('  ' + b);
  console.error('Re-read the corrections against the new text, then update "expect".');
  process.exit(1);
}

console.log(`ja furigana: ${Object.keys(keys).length} keys · ${annotated} readings placed · ` +
  `${plainTokens} kanji token(s) left unread · ${Object.keys(fired).length} corrections all fired`);
console.log(`source ${SHA.slice(0, 12)}`);
if (!WRITE) { console.log('(dry run — pass --write to apply)'); process.exit(0); }

fs.writeFileSync(OUT, JSON.stringify({
  _why: 'GENERATED by scripts/exec-summary-furigana.mjs — do not hand-edit. Curated corrections live in docs/i18n/ja-furigana-overrides.json; re-run the generator to regenerate.',
  _source_sha256: SHA,
  _generated: new Date().toISOString().slice(0, 10),
  _stats: { keys: Object.keys(keys).length, readings: annotated, unread_kanji_tokens: plainTokens },
  keys,
}, null, 2) + '\n');
console.log(`wrote ${OUT}`);

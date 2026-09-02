// exec-summary-verify-readers.mjs — every symbol that cannot be sounded out must
// carry its reading. One verdict over every built Executive Summary edition.
//
// WHY THIS GATE EXISTS (operator asked whether to add readers to the remaining
// languages; the answer was no, and this is what replaced that work). A reading aid
// is warranted where the script is LOGOGRAPHIC — where the pronunciation is not
// derivable from the shape, even by a native reader. That is true of Han characters
// and cuneiform, and false of every other script in the thirty-four editions, which
// are alphabets and abugidas: the writing already IS the pronunciation.
//
// So the standing risk was never the phonetic editions. It is that a future
// re-translation quietly introduces logographic script into an edition that has no
// reader — hanja creeping into the Korean text, a Chinese term quoted inside the
// Vietnamese one — and nothing catches it. This gate catches it: it fails if any
// edition contains a logographic character that is not carrying a reading.
//
// Run: node scripts/exec-summary-verify-readers.mjs
import fs from 'fs';

const DIR = 'frontend/public/whitepaper';

/* Logographic scripts — sound is not derivable from shape. These need a reading. */
const LOGOGRAPHIC = {
  Han:       /[㐀-䶿一-鿿豈-﫿]/gu,
  Cuneiform: /[\u{12000}-\u{123FF}\u{12400}-\u{1247F}]/gu,
};

const files = fs.readdirSync(DIR)
  .filter(f => /^vision-2525-executive-summary(\.[a-z]{2,3})?\.html$/.test(f))
  .sort();

let bad = 0, withReader = 0, checked = 0;
const lines = [];

for (const f of files) {
  const lang = (/summary\.([a-z]{2,3})\.html$/.exec(f) || [, 'en'])[1];
  const raw = fs.readFileSync(`${DIR}/${f}`, 'utf8');

  /* Body only — the <title> lives in the head and cannot carry ruby markup by
     construction, which is exactly why k00/k70 are the builder's PLAIN keys. */
  let body = raw.split('<body')[1] || '';
  body = body.replace(/<script[\s\S]*?<\/script>/g, '')
             .replace(/<style[\s\S]*?<\/style>/g, '');

  /* The reader's own control is a label, not prose — its glyph (拼, ふ) is the name
     of the button and must not be annotated. Drop the controls before measuring. */
  const hasReader = /<button id="b(?:Read|Study)"/.test(body);
  body = body.replace(/<button id="b(?:Read|Study)"[\s\S]*?<\/button>/g, '');

  /* A complete ruby unit is an annotated symbol. What survives this strip is,
     by definition, a symbol nobody gave a reading to. */
  const unannotated = body.replace(/<ruby>[\s\S]*?<\/ruby>/g, '')
                          .replace(/<[^>]+>/g, ' ');

  const found = {};
  let total = 0;
  for (const [script, re] of Object.entries(LOGOGRAPHIC)) {
    const hits = unannotated.match(re) || [];
    if (hits.length) { found[script] = [...new Set(hits)]; total += hits.length; }
  }

  checked++;
  if (hasReader) withReader++;

  if (total) {
    bad++;
    const detail = Object.entries(found)
      .map(([s, chars]) => `${s}: ${chars.slice(0, 12).join('')}${chars.length > 12 ? '…' : ''}`)
      .join(' · ');
    lines.push(`FAIL  ${lang.padEnd(4)} ${total} logographic character(s) with no reading — ${detail}`);
    if (!hasReader) {
      lines.push(`         this edition has NO reader at all. Add one in scripts/exec-summary-reading.mjs`);
      lines.push(`         (READERS + a branch in annotate()), then rebuild.`);
    }
  } else {
    lines.push(`ok    ${lang.padEnd(4)}${hasReader ? ' reader present, every symbol carries its reading' : ''}`);
  }
}

for (const l of lines) console.log(l);
console.log(`\n${checked} edition(s) checked, ${withReader} with a reader, ${bad} failed`);
if (bad) {
  console.error('\nA logographic symbol is shipping without its reading. Either annotate it');
  console.error('(the edition needs a reader) or, if it is a UI label rather than prose,');
  console.error('exclude that control in this gate — never by leaving prose unread.');
}
process.exit(bad ? 1 : 0);

// exec-summary-extract.mjs — tokenize the English Executive Summary into a
// language-neutral TEMPLATE (structure + CSS + seal, untouched) plus an ordered
// map of translatable strings. Per-language builds replace the tokens; nothing
// else in the file can drift. Run: node scripts/exec-summary-extract.mjs
import fs from 'fs';
const SRC = 'frontend/public/whitepaper/vision-2525-executive-summary.html';
const OUT_TPL = 'docs/i18n/exec-summary.template.html';
const OUT_EN  = 'docs/i18n/exec-summary.en.json';

let h = fs.readFileSync(SRC, 'utf8');
const strings = {}; let n = 0;
// Replace the INNER text of a tag-instance with a {{kNN}} token, recording the English.
// `open` is the exact opening tag (e.g. '<p class=kick>'); closes at the matching close tag.
function tok(open, close) {
  let from = 0, i;
  while ((i = h.indexOf(open, from)) >= 0) {
    const s = i + open.length;
    const e = h.indexOf(close, s);
    if (e < 0) break;
    const en = h.slice(s, e);
    // Skip the numeric page labels (Preamble is translatable; "01".."12" are not).
    if (open === '<span class=pn>' && /^[0-9]+$/.test(en.trim())) { from = e + close.length; continue; }
    const key = 'k' + String(n++).padStart(2, '0');
    strings[key] = en;
    h = h.slice(0, s) + '{{' + key + '}}' + h.slice(e);
    from = s + ('{{' + key + '}}').length + close.length;
  }
}
tok('<title>', '</title>');
tok('<p class=kick>', '</p>');
tok('<p class=subt>', '</p>');
tok('<span class=pn>', '</span>');   // "Preamble" only; numbers skipped above
tok('<h2>', '</h2>');
tok('<p>', '</p>');                    // body paragraphs
tok('<li>', '</li>');                  // seal list
tok('<p class=banner>', '</p>');
tok('<p class=motto>', '</p>');
tok('<p class=motto2>', '</p>');
tok('<span class=sealcap>', '</span>');
// The seal <img alt="..."> text
{
  const marker = '<img alt="';
  const i = h.indexOf(marker);
  if (i >= 0) {
    const s = i + marker.length, e = h.indexOf('"', s);
    const en = h.slice(s, e);
    const key = 'k' + String(n++).padStart(2, '0');
    strings[key] = en;
    h = h.slice(0, s) + '{{' + key + '}}' + h.slice(e);
  }
}

fs.writeFileSync(OUT_TPL, h);
fs.writeFileSync(OUT_EN, JSON.stringify(strings, null, 2));
console.log('template ->', OUT_TPL, Buffer.byteLength(h), 'bytes');
console.log('strings   ->', OUT_EN, Object.keys(strings).length, 'keys');
// Round-trip proof: rebuild EN from the template must equal the source exactly.
let rt = h;
for (const [k, v] of Object.entries(strings)) rt = rt.split('{{' + k + '}}').join(v);
const orig = fs.readFileSync(SRC, 'utf8');
console.log('round-trip EN identical ->', rt === orig);
if (rt !== orig) process.exit(1);

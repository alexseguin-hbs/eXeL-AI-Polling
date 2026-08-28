// exec-summary-one-master.mjs — ONE MASTER proof for the Executive Summary.
//
// Operator (2026-08-28): "make sure there is one master for executive summary."
// Scope: this proof binds the ENGLISH master to the living document's ledger blocks.
// The SUM (Sumerian) edition is verified separately by exec-summary-verify-sum.mjs.
// The summary's text exists in TWO carriers:
//   1. docs/i18n/exec-summary.en.json — THE MASTER (frozen, SHA-locked); the
//      standalone page and all 32 translations are built from it.
//   2. The living document's exec.* ledger blocks — the in-document reading the
//      toggle's fourth cell renders.
// Two carriers of one text is redundancy a reader benefits from; two carriers
// that drift is two masters. This script PROVES the ledger's winning exec.*
// blocks carry every sentence of the master, verbatim, and nothing rides along:
//   · the master still hashes to the recorded freeze (the master itself moved?)
//   · every master value (71 keys) appears, normalized, in the ledger's text
//   · the ledger's exec text contains no words beyond the master's (±2% for
//     block furniture), so nothing was quietly added either
// Exit non-zero on any divergence — run it whenever either carrier is touched.
// A NEW EDITION therefore means: update the master, re-freeze, rebuild the
// pages, AND append superseding exec.* ledger blocks — then this proves them
// equal again. Never edit one carrier alone.
import fs from 'fs';
import crypto from 'crypto';

const EN_RAW = fs.readFileSync('docs/i18n/exec-summary.en.json', 'utf8');
const EN = JSON.parse(EN_RAW);
const FROZEN = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.sentences.json', 'utf8')).sha256;
const DOC = fs.readFileSync('docs/SOI_VISION2525_LIVING_DOCUMENT.html', 'utf8');

const sha = crypto.createHash('sha256').update(EN_RAW, 'utf8').digest('hex');
if (sha !== FROZEN) {
  console.error('FAIL — the master itself moved: exec-summary.en.json no longer hashes to the freeze.');
  console.error('  master ' + sha + '\n  frozen ' + FROZEN);
  process.exit(1);
}

/* Winning exec.* blocks: replay picks the LAST entry per id, so take the last
   L(v,"exec.x",why,'html') in file order for each id. The html body is a JS
   string expression ('…'+'…'); capture to the line's closing `);`. */
const winners = {};
const re = /^L\((\d+),"(exec\.[a-z0-9]+)",/gm;
let m;
while ((m = re.exec(DOC)) !== null) {
  const start = m.index;
  const end = DOC.indexOf("');", start);
  winners[m[2]] = { v: +m[1], src: DOC.slice(start, end) };
}
const ids = Object.keys(winners);
if (ids.length !== 15) {
  console.error(`FAIL — expected 15 exec.* ledger blocks, found ${ids.length}: ${ids.join(' ')}`);
  process.exit(1);
}

const decode = s => s
  .replace(/&rsquo;|&#8217;/g, '’').replace(/&lsquo;|&#8216;/g, '‘')
  .replace(/&ldquo;|&#8220;/g, '“').replace(/&rdquo;|&#8221;/g, '”')
  .replace(/&mdash;|&#8212;/g, '—').replace(/&ndash;|&#8211;/g, '–')
  .replace(/&bull;|&#8226;/g, '•').replace(/&middot;|&#183;/g, '·')
  .replace(/&rarr;|&#8594;/g, '→').replace(/&hellip;|&#8230;/g, '…')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&times;|&#215;/g, '×')
  .replace(/&sect;/g, '§').replace(/&amp;/g, '&')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));

/* Ledger block source -> visible text: join the string concatenation, take
   attribute text a reader still receives (the seal's alt), drop tags. */
const visible = src => {
  let h = src.replace(/'\s*\+\s*'/g, '');                 // '…'+'…' -> one string
  h = h.slice(h.indexOf(",'") + 2);                       // past v, id, why -> body
  h = h.replace(/alt="([^"]*)"/g, (_, a) => '> ' + a + ' <'); // alt text counts as text
  h = h.replace(/<[^>]*>/g, ' ');
  return decode(h);
};

const norm = s => decode(String(s)).toLowerCase().replace(/[\s ]+/g, ' ')
  .replace(/[.,;:!?"'‘’“”()\[\]—–•·…-]/g, ' ')
  .replace(/\s+/g, ' ').trim();

const ledgerAll = norm(ids.map(id => visible(winners[id].src)).join(' '));

/* k00 is the <title> of the standalone page (name + page label), not body text;
   every other key must appear in the ledger reading verbatim. */
const missing = [];
for (const k of Object.keys(EN)) {
  if (k === 'k00') continue;
  if (!ledgerAll.includes(norm(EN[k]))) missing.push(k);
}
if (missing.length) {
  console.error('FAIL — master sentences missing from the ledger reading: ' + missing.join(' '));
  for (const k of missing.slice(0, 3)) console.error(`  ${k}: ${String(EN[k]).slice(0, 90)}…`);
  process.exit(1);
}

/* Nothing beyond the master rides along: word counts must agree within 2%
   (block furniture like the repeated wordmark in the head is the tolerance). */
const masterWords = norm(Object.keys(EN).filter(k => k !== 'k00').map(k => EN[k]).join(' ')).split(' ').length;
const ledgerWords = ledgerAll.split(' ').length;
const drift = Math.abs(ledgerWords - masterWords) / masterWords;
if (drift > 0.02) {
  console.error(`FAIL — the ledger reading carries ${ledgerWords} words vs the master's ${masterWords} (${(drift * 100).toFixed(1)}% drift > 2%) — text is riding along or missing.`);
  process.exit(1);
}

console.log(`ONE MASTER — exec-summary.en.json (sha ${sha.slice(0, 12)}) is the single source:`);
console.log(`  master frozen ✓ · 15/15 ledger blocks (winning v${Math.max(...ids.map(i => winners[i].v))}) carry all 70 body keys verbatim`);
console.log(`  word parity ✓ ${ledgerWords} ledger vs ${masterWords} master (${(drift * 100).toFixed(2)}% furniture)`);

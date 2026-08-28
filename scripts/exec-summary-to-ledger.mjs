// exec-summary-to-ledger.mjs — fold the Executive Summary INTO the living document.
//
// Operator: "make Executive Summary part of main file download feature (~7MB)"
// and "WHERE CAN in-read executive summary?"
//
// Until now the summary was a sibling file the Settings link navigated away to.
// That put the 1 + 12 outside the one thing the whole document claims about
// itself: that everything replays from one append-only ledger. So the summary
// becomes what every other part of this document already is — ledger blocks and
// a view over them. It then travels inside the 7 MB download automatically, in
// every language, because the i18n pipeline already walks the ledger.
//
// The blocks are GENERATED from the frozen canonical English (exec-summary.en.json,
// SHA recorded in exec-summary.sentences.json) rather than retyped, so the page a
// reader saves and the view a reader opens can never drift apart.
//
// Run: node scripts/exec-summary-to-ledger.mjs [--write]
import fs from 'fs';

const DOC   = 'docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const EN    = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.en.json', 'utf8'));
const REL   = 279;   /* living-document release carrying exec r1.002 */
const WRITE = process.argv.includes('--write');

// Page layout, read straight off the frozen template's token order:
// k03 is the eyebrow over the first page; each page is one heading + three paragraphs.
const PAGES = [
  { head:'k04', body:['k17','k18','k19'], eyebrow:'k03' },
  { head:'k05', body:['k20','k21','k22'] },
  { head:'k06', body:['k23','k24','k25'] },
  { head:'k07', body:['k26','k27','k28'] },
  { head:'k08', body:['k29','k30','k31'] },
  { head:'k09', body:['k32','k33','k34'] },
  { head:'k10', body:['k35','k36','k37'] },
  { head:'k11', body:['k38','k39','k40'] },
  { head:'k12', body:['k41','k42','k43'] },
  { head:'k13', body:['k44','k45','k46'] },
  { head:'k14', body:['k47','k48','k49'] },
  { head:'k15', body:['k50','k51','k52'] },
  { head:'k16', body:['k53','k54','k55'] },
];
const LITANY = ['k56','k57','k58','k59','k60','k61','k62','k63','k64','k65'];

// The four source filenames were deliberately stripped from the prose in the
// canonicalization pass; they ride as data-source, exactly as in the template.
/* r1.002 · empty by design. The approved text carries no source filenames in its
   prose, so there is nothing to move into data-source. Kept as a map rather than
   deleted, because provenance may return and the mechanism should not have to be
   rebuilt when it does. */
const SOURCES = {};

const ent = s => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/—/g, '&mdash;').replace(/’/g, '&rsquo;')
  .replace(/·/g, '&middot;').replace(/→/g, '&rarr;')
  .replace(/×/g, '&times;');

// The HTML goes into a single-quoted JS string literal, like every other L() call.
const lit = s => { if (s.includes("'")) throw new Error('raw apostrophe would break the literal: ' + s.slice(0,60)); return s; };

const blocks = [];

/* exec r1.002 · the summary's OWN opening. With the document's front matter
   suppressed in this view, the reading needs a head of its own — the same three
   lines the standalone page opens with (eyebrow, wordmark, subtitle) and nothing
   more. The operator: "should not have all the fluff ... but start with formatted
   text." This is the formatted text it starts with. */
blocks.push({
  id: 'exec.head',
  why: 'exec r1.002 &mdash; the Executive Summary&rsquo;s own opening, so the view reads as itself rather than behind the document&rsquo;s front door.',
  html: '<p class="meta" style="margin:0 0 10px;letter-spacing:.22em;text-transform:uppercase">' + ent(EN.k01) + '</p>' +
        '<h2 style="margin:0 0 6px">Vision &#8226; 2525</h2>' +
        '<p class="sub" style="margin:0 0 4px">' + ent(EN.k02) + '</p>',
});

PAGES.forEach((p, i) => {
  let h = '';
  if (p.eyebrow) h += '<p class="meta" style="margin-bottom:6px">' + ent(EN[p.eyebrow]) + '</p>';
  h += '<h2>' + ent(EN[p.head]) + '</h2>';
  p.body.forEach((k, j) => {
    const src = SOURCES[k] ? ' data-source="' + SOURCES[k] + '"' : '';
    const last = j === p.body.length - 1 ? ' style="margin-bottom:0"' : '';
    h += '<p' + src + last + '>' + ent(EN[k]) + '</p>';
  });
  blocks.push({
    id: 'exec.s' + i,
    why: 'exec r1.002 &mdash; the operator&rsquo;s final approved text. Page ' + (i + 1) + ' of thirteen, generated from the frozen canonical English so the saved page and the in-document view can never drift.',
    html: h,
  });
});

// The close: the litany, the two mottos, and the seal.
let c = '<h2>' + ent(EN.k66) + '</h2>';
c += '<p>' + LITANY.map(k => ent(EN[k])).join(' ') + '</p>';
c += '<p>' + ent(EN.k67) + '</p>';
c += '<p>' + ent(EN.k68) + '</p>';
c += '<p class="meta" style="margin-bottom:0">' + ent(EN.k70) + '</p>';
blocks.push({
  id: 'exec.close',
  why: 'exec r1.002 &mdash; the Executive Summary&rsquo;s close: the ten-line litany, the two mottos, and the Master of Thought seal.',
  html: c,
});

const Lcalls = blocks.map(b => `L(${REL},"${b.id}","${b.why}",'${lit(b.html)}');`).join('\n');
const ORDER  = 'const EXEC_ORDER = [\n ' + blocks.map(b => '"' + b.id + '"').join(', ') + '\n];\n';

/* --emit prints ONLY the L() calls, so a re-generation can replace the existing
   blocks in place. The first run inserts the machinery; every run after that is a
   content refresh, and the two must not be the same code path. */
if (process.argv.includes('--emit')) { console.log(Lcalls); process.exit(0); }
if (!WRITE) {
  console.log(ORDER);
  console.log(`${blocks.length} blocks, ${Lcalls.length} bytes of L() calls`);
  console.log('first block:', Lcalls.slice(0, 300));
  process.exit(0);
}

let doc = fs.readFileSync(DOC, 'utf8');
const once = (needle, replacement, what) => {
  const n = doc.split(needle).length - 1;
  if (n !== 1) { console.error(`ANCHOR "${what}" matched ${n} times — refusing to write.`); process.exit(1); }
  doc = doc.replace(needle, replacement);
};

// 1 — EXEC_ORDER, next to the other orders. Anchored on the comment that opens
//     the union, never on a blind search for "];" (that once ate V2525_LANGS).
once('\n\n/* Every block, exactly once', '\n\n' + ORDER + '\n/* Every block, exactly once', 'EXEC_ORDER insert');

// 2 — the union must reach the new blocks or COVERAGE reports them orphaned.
once('.concat(NOSE_ORDER))]', '.concat(NOSE_ORDER).concat(EXEC_ORDER))]', 'ALL_ORDER union');

// 3 — the view itself.
once('  nose:    {order: NOSE_ORDER,   label: "N.O.S.E.",    hash: "nose",    spine: /^paper\\./}',
     '  nose:    {order: NOSE_ORDER,   label: "N.O.S.E.",    hash: "nose",    spine: /^paper\\./},\n' +
     '  /* r276 · the Executive Summary is a view like any other, not a payload.\n' +
     '     Its spine is its own, so stepping back before r276 shows the honest\n' +
     '     "this view did not exist yet" banner rather than silently falling back. */\n' +
     '  exec:    {order: EXEC_ORDER,   label: "Executive summary", hash: "exec", spine: /^exec\\./}',
     'VIEWS.exec');

// 4 — the reading menu. A text row, so no new icon and no orphan control.
once('const VIEW_MENU_ORDER = ["brief", "outline", "nose", "paper"];',
     'const VIEW_MENU_ORDER = ["brief", "exec", "outline", "nose", "paper"];', 'VIEW_MENU_ORDER');

// 5 — Settings now opens the summary IN the document. The sibling page still
//     exists for sharing and for the per-language editions; this is the in-read.
once('  if (bExec) bExec.addEventListener("click", function(){\n' +
     '    var dir = location.pathname.replace(/[^/]*$/, "");\n' +
     '    location.href = dir + "vision-2525-executive-summary.html";\n' +
     '  });',
     '  if (bExec) bExec.addEventListener("click", function(){\n' +
     '    /* r276 · in-document. The operator asked "WHERE CAN in-read executive\n' +
     '       summary?" — here, as a view over ledger blocks, inside the download. */\n' +
     '    open(false); setView("exec");\n' +
     '  });', 'bExec handler');

// 6 — the blocks, appended after the last existing L() call.
const tail = doc.lastIndexOf('\nL(');
const end  = doc.indexOf('\n', doc.indexOf(');', tail));
if (tail < 0 || end < 0) { console.error('could not locate the end of the L() sequence'); process.exit(1); }
doc = doc.slice(0, end + 1) + Lcalls + '\n' + doc.slice(end + 1);

fs.writeFileSync(DOC, doc);
console.log(`wrote ${blocks.length} exec blocks + EXEC_ORDER + VIEWS.exec + menu row + in-document handler`);

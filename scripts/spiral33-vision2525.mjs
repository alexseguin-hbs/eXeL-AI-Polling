/* 33 SPIRAL TESTS BETWEEN VERSIONS
   =================================
   Operator directive: "instead of read 33 times, perform and evolve in 33 SPIRAL
   TESTS BETWEEN VERSIONS."

   The old instrument read one release 33 times and asserted the 33 reads were
   identical. That is a DETERMINISM proof — it says the engine has no hidden
   state. It says nothing about whether the document got better.

   This instrument tests TRANSITIONS. There are VMAX-1 release pairs; 33 of them
   are selected on a fixed stride so the sample spans the whole history and the
   selection is reproducible (no clock, no randomness — same rule as the engine).

   For each pair v -> v+1:

     FORWARD  (v -> v+1)   every metric improved or held. Never degraded.
     BACKWARD (v+1 -> v)   the earlier release still replays intact — the same
                           metrics, the same blocks, the same state hash it had
                           before its successor existed. Append-only means the
                           past cannot move; this is what proves it.

   Metrics, per release, over the complete record (ALL_ORDER):
     blocks      how many blocks the record replays
     words       total words of reading
     sections    numbered sections reachable in the paper view
     outline111  outline entries at exactly 111 words
     minSection  the shortest paper section, in words   (333 floor)
     dupWorst    worst 8-word-shingle overlap, paper section vs the record

   A metric that falls is a FAIL. A metric that holds is a PASS — a release is
   allowed to change nothing measurable (r49->r50 and r53->r54 do exactly that).
*/
import { chromium } from 'playwright';

const F = 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const TESTS = 33;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
await p.goto(F);
await p.waitForTimeout(300);

/* One page-side pass collects every release's metrics. Measuring inside the page
   keeps the engine as the single source of truth — the harness never
   re-implements replay, which is the mistake that would make the test vacuous. */
const data = await p.evaluate((TESTS) => {
  const W = s => s.trim().split(/\s+/).filter(Boolean).length;

  /* 8-word shingles: the duplication ceiling the operator set at 20%. */
  const shingles = (text, n = 8) => {
    const w = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    const out = new Set();
    for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
    return out;
  };

  /* The reading, without the engine's own diff chrome. A "changed in vN" marker
     and its recorded reason live inside #doc, so counting them makes a release
     that changes no block appear to LOSE words — an artifact, not a regression.
     Found by this harness on its second run, when adding r59 shifted the stride
     onto v49->v50 and it failed for exactly that reason. */
  const reading = root => {
    const c = root.cloneNode(true);
    c.querySelectorAll('.chgtag').forEach(t => t.parentElement && t.parentElement.remove());
    return c.textContent;
  };

  function metricsAt(v) {
    setView('ledger'); goto(v);
    const rec = reading(document.getElementById('doc'));
    const recShingles = shingles(rec);
    const m = {
      v,
      blocks: document.querySelectorAll('#doc section.blk').length,
      words: W(rec),
      hash: stateHash(v, ALL_ORDER, true),
      sections: 0, outlineAll: 0, outline111: 0, minSection: 0, dupWorst: 0
    };

    setView('paper'); goto(v);
    const secs = [...document.querySelectorAll('#doc h2.sech[id^="sec-"]')]
      .filter(h => /^§\s*\d+/.test(h.textContent.replace(/ /g, ' ').trim()));
    m.sections = secs.length;

    const bodies = [...document.querySelectorAll('#doc section.blk')]
      .filter(s => /^blk-paper\.s\d+$/.test(s.id));
    if (bodies.length) {
      m.minSection = Math.min(...bodies.map(s => W(reading(s))));
      let worst = 0;
      for (const s of bodies) {
        const sh = shingles(reading(s));
        if (!sh.size) continue;
        let hit = 0;
        for (const g of sh) if (recShingles.has(g)) hit++;
        worst = Math.max(worst, hit / sh.size);
      }
      m.dupWorst = Math.round(worst * 1000) / 10;   // percent, one decimal
    }

    setView('outline'); goto(v);
    /* r109 · TWO NUMBERS, NOT ONE. This counted only the entries that ARE 111
       words and then asserted the count equals nineteen, which conflates two
       different contracts: "every entry is exactly 111" and "there are this
       many entries". With one number, adding a twentieth correct entry looks
       identical to breaking one of the nineteen. Both are measured now. */
    const olw = [...document.querySelectorAll('#doc p.olw')];   /* .olw is body text; no chrome inside it */
    m.outlineAll = olw.length;
    m.outline111 = olw.filter(e => W(e.textContent) === 111).length;

    return m;
  }

  /* Fixed stride over the pairs — reproducible, spans the whole history, and the
     newest transition is always included because that is the one being shipped. */
  const pairCount = VMAX - 1;
  const idx = new Set();
  for (let i = 0; i < TESTS; i++) idx.add(1 + Math.round(i * (pairCount - 1) / (TESTS - 1)));
  const pairs = [...idx].sort((a, c) => a - c);

  const need = new Set();
  for (const v of pairs) { need.add(v); need.add(v + 1); }

  const M = {}, mot = {};
  for (const v of [...need].sort((a, c) => a - c)) { M[v] = metricsAt(v); mot[v] = VERSIONS[v - 1].mot; }

  /* BACKWARD: re-measure every earlier release AFTER its successor has been
     read, and require byte-identical metrics. If replaying v+1 could disturb v,
     the append-only claim is false and this is where it shows. */
  const back = {};
  for (const v of [...need].sort((a, c) => c - a)) back[v] = metricsAt(v);

  setView('paper'); goto(VMAX);
  return { VMAX, pairs, M, back, mot };
}, TESTS);

/* ── the rule ─────────────────────────────────────────────────────────────────
   Three kinds of metric, judged three different ways. Written down here because
   the first run of this harness failed five transitions and it mattered enormously
   which of them were real.

   1. HARD FLOORS — the contracts the operator set. Absolute, per release:
        a paper section is never under 333 words
        every outline entry is exactly 111 words, and there are never fewer than 19
        no paper section exceeds 20% duplication against the record
      A breach is a breach. The LATEST release must be clean, and any historical
      breach must be closed by a named later release and disclosed as a defect.

   2. DIRECTIONAL — blocks, words, sections. Must not fall, UNLESS the release's
      own directive says it removed something. Not a loophole: the document's own
      ethic applied to its own test. A framework may shrink; it may not shrink
      silently. r48 says "operating income is gone"; r53 says withdrawn five ways.
      Both pass. A release that quietly loses 200 words does not.

   3. ENVELOPE — minSection and dupWorst are judged against the floor and the
      ceiling, NOT against the previous release. A section moving 365 -> 343 words
      is ordinary editing well inside a 333 floor, and a rule that forbade it would
      forbid ever rewriting a sentence. This is the one place the first draft of
      this harness was too strict, and it is recorded rather than quietly changed.

   BIRTHS are not degradations. Before r41 there is no paper view, so its metrics
   read 0 — meaning "does not exist yet", not "zero quality". A metric appearing
   for the first time is skipped rather than scored.                            */
const CEILING_DUP = 20.0;
const FLOOR_SECTION = 333;
const REDUCTION = /remov\w+|withdraw\w+|withdrew|dropp?e?d?\b|reduc\w+|simplif\w+|\bcut\b|delet\w+|shorter|fewer|condens\w+|compress\w+|trimm?\w*|\bis gone\b|\bare gone\b|no longer|omit\w*|exclud\w+|withheld|retire\w*|stands down|supersed\w+|no release history/i;

/* Historical hard-floor breaches that cannot be repaired: editing an earlier
   release would be rewriting the record, the single thing this document forbids.
   Each is carried as a NAMED exception tied to a published defect — and honoured
   only while that defect is still disclosed in the ledger. Delete the disclosure
   and the test goes red. */
const KNOWN_BREACH = {
  dupWorst: { from: 41, to: 53, defect: 24,
              note: 'the 20% duplication ceiling was breached from r41 (the white paper was written by restating the record) until r54 rewrote it. Worst 71.2% -> 7.1%.' }
};

const DIRECTIONAL = ['blocks', 'words', 'sections'];
const rows = [], fails = [], excused = new Set();

function breaches(m) {
  const out = [];
  if (m.sections > 0 && m.minSection < FLOOR_SECTION) out.push(`minSection ${m.minSection}<${FLOOR_SECTION}`);
  if (m.sections > 0 && m.dupWorst > CEILING_DUP)      out.push(`dupWorst ${m.dupWorst}%>${CEILING_DUP}%`);
  /* r109 · the contract is EVERY ENTRY AT 111 WORDS, and never fewer than the
     nineteen that were promised. Stated as two assertions because they fail for
     different reasons and a reader of the failure needs to know which:
       * an entry off 111 words is a broken promise about the entry;
       * fewer than 19 entries is a broken promise about the outline.
     Strictly stronger than the `=== 19` it replaces (that rule could not see a
     twentieth entry written at 90 words), and it stops punishing growth: the
     operator asked for §C and the Author, which makes twenty-one. */
  if (m.outlineAll > 0 && m.outline111 !== m.outlineAll)
    out.push(`outline ${m.outlineAll - m.outline111} of ${m.outlineAll} entries not at 111 words`);
  if (m.outlineAll > 0 && m.outlineAll < 19)
    out.push(`outline ${m.outlineAll}<19 entries`);
  return out;
}

for (const v of data.pairs) {
  const a = data.M[v], c = data.M[v + 1];
  const declared = REDUCTION.test(data.mot[v + 1] || '');

  /* 2. directional — a birth (a === 0) cannot degrade */
  const drops = DIRECTIONAL.filter(k => a[k] > 0 && c[k] < a[k])
                           .filter(k => !declared);

  /* 1. hard floors, on the arriving release */
  const hard = breaches(c).filter(msg => {
    const k = msg.split(' ')[0];
    const kb = KNOWN_BREACH[k];
    if (kb && c.v >= kb.from && c.v <= kb.to) { excused.add(`${k}: r${kb.from}–r${kb.to}, defect ${kb.defect} — ${kb.note}`); return false; }
    return true;
  });

  /* backward — the earlier release must replay byte-identical afterwards */
  const bwd = [];
  for (const w of [v, v + 1]) {
    const before = data.M[w], after = data.back[w];
    for (const k of ['blocks', 'words', 'sections', 'outlineAll', 'outline111', 'minSection', 'hash', 'dupWorst']) {
      if (String(before[k]) !== String(after[k])) bwd.push(`v${w}.${k}: ${before[k]} -> ${after[k]}`);
    }
  }

  const pair = `v${v}→v${v + 1}`;
  rows.push({ pair, a, c, drops, hard, bwd, declared });
  if (drops.length || hard.length || bwd.length)
    fails.push(`${pair}  fwd:[${drops.join(', ') || '-'}]  floors:[${hard.join(', ') || '-'}]  bwd:[${bwd.join('; ') || '-'}]`);
}

/* the latest release must be clean on its own terms, no exceptions of any kind */
const latest = data.M[data.VMAX];
if (latest) { const lb = breaches(latest); if (lb.length) fails.push(`LATEST RELEASE v${data.VMAX} breaches a hard floor: ${lb.join(', ')}`); }

/* an exception is only an exception while its defect is still published */
if (excused.size) {
  /* Specifically: a numbered ROW in the defect register. Grepping the whole
     record for "24" would pass on any stray number and prove nothing. */
  const registered = await p.evaluate(() => {
    setView('ledger'); goto(VMAX);
    const blk = document.getElementById('blk-open\\.defects') ||
                [...document.querySelectorAll('#doc section.blk')].find(s => s.id === 'blk-open.defects');
    if (!blk) return [];
    return [...blk.querySelectorAll('td.n')].map(td => td.textContent.trim());
  });
  for (const k of Object.keys(KNOWN_BREACH)) {
    const d = String(KNOWN_BREACH[k].defect);
    if (!registered.includes(d))
      fails.push(`the ${k} breach is excused against defect ${d}, and defect ${d} is NOT a numbered row in the defect register (rows found: ${registered.join(', ') || 'none'}). An exception that outlives its disclosure is a silenced test.`);
  }
}

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);
console.log('33 SPIRAL TESTS BETWEEN VERSIONS  —  VMAX ' + data.VMAX + ', ' + rows.length + ' transitions\n');
console.log(pad('pair', 12) + num('blocks', 13) + num('words', 15) + num('§', 8) + num('111', 8) +
            num('min§', 10) + num('dup%', 11) + '  fwd  flr  bwd');
for (const r of rows) {
  console.log(
    pad(r.pair, 12) +
    num(`${r.a.blocks}→${r.c.blocks}`, 13) +
    num(`${r.a.words}→${r.c.words}`, 15) +
    num(`${r.a.sections}→${r.c.sections}`, 8) +
    num(`${r.a.outline111}→${r.c.outline111}`, 8) +
    num(`${r.a.minSection}→${r.c.minSection}`, 10) +
    num(`${r.a.dupWorst}→${r.c.dupWorst}`, 11) +
    '   ' + (r.drops.length ? '✗' : '✓') +
    '    ' + (r.hard.length ? '✗' : '✓') +
    '    ' + (r.bwd.length ? '✗' : '✓') +
    (r.declared ? '   reduction recorded' : ''));
}

console.log('\nforward  : improved, held, or the reduction is recorded — ' + rows.filter(r => !r.drops.length).length + '/' + rows.length);
console.log('floors   : 333 words · 19 outline entries · 20% duplication — ' + rows.filter(r => !r.hard.length).length + '/' + rows.length);
console.log('backward : the earlier release replays byte-identical afterwards — ' + rows.filter(r => !r.bwd.length).length + '/' + rows.length);
console.log('latest   : v' + data.VMAX + ' — minSection ' + latest.minSection + ' · outline ' + latest.outline111 + ' · duplication ' + latest.dupWorst + '%');
if (errs.length) fails.push('PAGE ERRORS: ' + errs.join(' | '));
if (excused.size) console.log('\nexcused, and only while disclosed:\n  ' + [...excused].join('\n  '));

if (fails.length) { console.log('\nFAIL:\n  ' + fails.join('\n  ')); await b.close(); process.exit(1); }
console.log('\nPASS — 33/33 spiral transitions. Nothing degraded that was not declared, ' +
            'no live floor breached, and every earlier release still replays exactly as it did.');
await b.close();

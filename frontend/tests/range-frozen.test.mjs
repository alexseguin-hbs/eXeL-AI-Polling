// DD-35 MADE MECHANICAL (operator 2026-10-13: "while making these updates; don't change the range; just use working
// range to start building elements for The Capital").
//
// The Range is not a file. It is a `chNum()===0` branch threaded through one 8,000-line script, so "do not change
// the range" cannot be enforced by freezing a file. It CAN be enforced by freezing the Range's own SOURCE SPANS:
// every top-level definition that belongs to the range alone — the program of record, the magazines, the clock, the
// stop light, his five stances, the lane, its plates and its signs, and the three doors onto it — is extracted by
// name and hashed. A Capital revision that touches any of them is, by definition, changing the range, and this gate
// says so by name before it can reach his phone.
//
// It is sharp and it is not vacuous. Replayed over the real ships: r.204→r.205 moves exactly qualDropStrays,
// rangeTick, boardLabels and drawPlates (the colour and caption work); r.206→r.207 moves exactly boardLabels (his
// D-21 sign decision); r.207→r.208 moves NOTHING. Each match is a line in that patch's own header.
//
// WHAT IT DOES NOT COVER, said plainly: the functions the range SHARES with every other scene — designate, markLock,
// approveDesig, fireN, lockOn, paintCues, hudPhase, placeFace, drawTargets, segs — are deliberately absent, because
// the Capital is required to reuse them (his own instruction, and R-CORE's NO REWORK law). Their range-facing
// behaviour is held by the 242-row boot QA at four viewports (scripts/drone-deck-qa.mjs, in test:ci) and by the two
// play-throughs, which nothing in CI runs yet — that is the owed half of this gate.
//
// A deliberate change to a frozen span updates tests/range-spans.json in the SAME commit, so it is a line in the
// diff the operator can read, never a silent drift.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DECK_REV } from './deck-head.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const html = readFileSync('public/drone-2525/play.html', 'utf8');
const pin = JSON.parse(readFileSync('tests/range-spans.json', 'utf8'));

export function spansOf(src) {
  const re = /^(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
  const st = []; let m; while ((m = re.exec(src))) st.push({ n: m[1], i: m.index });
  const by = {}; st.forEach((d, k) => { if (by[d.n] === undefined) by[d.n] = { i: d.i, j: (st[k + 1] || { i: src.length }).i }; });
  return by;
}
const by = spansOf(html);
const names = Object.keys(pin.spans);

ok(+pin.pinnedAt <= +DECK_REV, `the hashes were last changed deliberately at r.${pin.pinnedAt}, at or before the revision the repo serves (r.${DECK_REV})`);
/* r.208 (round): the first cut asserted pin.rev === DECK_REV, which would have made every later revision edit this file for a
   reason unrelated to the range — and a regenerate-all is exactly where a silent re-baseline of all 98 hashes would hide. The
   hashes themselves are the gate; pinnedAt only records when they last moved on purpose. */
ok(names.length >= 95, `the frozen set is the whole range, not a sample: ${names.length} definitions`);

const missing = names.filter((n) => !by[n]);
ok(missing.length === 0, `every frozen definition is still in the deck — a DELETED range function must fail, not vanish: ${missing.join(',')}`);

const moved = [];
for (const n of names) {
  if (!by[n]) continue;
  const h = createHash('sha256').update(html.slice(by[n].i, by[n].j)).digest('hex').slice(0, 16);
  if (h !== pin.spans[n]) moved.push(`${n} (${pin.spans[n]} → ${h})`);
}
ok(moved.length === 0, `THE RANGE IS UNTOUCHED — no frozen definition changed; moved: ${moved.join(' · ')}`);

/* the gate must be able to fail: the same extractor run over the carried r.206 deck MUST report boardLabels moved */
try {
  const prev = readFileSync('../docs/drone-2525/operator-deck/drone-2525_r.206.html', 'utf8');
  const bp = spansOf(prev);
  const diff = names.filter((n) => bp[n] && by[n] && createHash('sha256').update(prev.slice(bp[n].i, bp[n].j)).digest('hex').slice(0, 16) !== pin.spans[n]);
  ok(diff.length > 0, `a gate that cannot fail is not a gate: against the carried r.206 deck this reports ${diff.length} moved (${diff.slice(0, 4).join(',')})`);
} catch { ok(false, 'the carried r.206 deck could not be read, so the gate could not prove it is able to fail'); }

/* r.208 (rounds 1 and 2): a definition this revision deliberately changes is not dropped from the gate - it is frozen
   under its OWN key, re-pinned at the revision that changed it, with the reason written beside it in the JSON. Three
   qualify here: goRange (the range is now handed back whole after a challenge), mapCam and drawMap (the overhead view
   frames the site it is over). Everything else is byte-identical to r.207. */
const mapNames = Object.keys(pin.movedSpans || {});
ok(mapNames.length >= 3, `the definitions this revision deliberately moved are frozen too, under their own key (${mapNames.length})`);
const mapMoved = [];
for (const n of mapNames) {
  if (!by[n]) { mapMoved.push(`${n} (gone)`); continue; }
  const h = createHash('sha256').update(html.slice(by[n].i, by[n].j)).digest('hex').slice(0, 16);
  if (h !== pin.movedSpans[n]) mapMoved.push(`${n} (${pin.movedSpans[n]} → ${h})`);
}
ok(mapMoved.length === 0, `each is where it was re-pinned at r.${pin.movedPinnedAt}, with its reason in the file; moved since: ${mapMoved.join(' · ')}`);

console.log(`\nrange-frozen: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

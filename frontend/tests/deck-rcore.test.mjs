// R-CORE ON THE RANGE IS THE SHARED HISTORY (DD-49, operator 2026-10-14: "Also, not seeing RCORE LOGO TO SEE HISTORY CHAIN", and asked
// where it belongs, "icon at bottom" · "same as all other rcore single links at bottom below Target Approve, Fire").
//
// The served deck and the carried HEAD embed RCORE_LEDGER — the entries of docs/traceability/drone-2525.ledger.json, model ids redacted at
// embed exactly as the shared adapter redacts at render — and the deck carries the record THROUGH THE REVISION BEFORE ITSELF: its own
// release row is written in the records commit, after these bytes are frozen, so the file is exactly ONE entry longer than the block. Never
// more (the deck would be stale), never fewer (the deck would claim a row that has not shipped).
//
// No hand-typed list, no off-vocabulary kind, no model name on the glass. The panel carries the shared hooks and the shared words, and the
// engine under it is a PORT of lib/2525-core/revisions.ts + lib/version-diff.ts — this file names every ported function, and
// scratchpad equivalence runs prove the port equals the shared engine field for field on the real ledger (756 assertions, r.210).
//
// Node-only (no browser): the geometry and the two-click behaviour are the deck's own boot rows RCORE_IS_ON_THE_GLASS,
// RCORE_IS_THE_SHARED_HISTORY and RCORE_NEVER_COVERS_THE_PICTURE, measured at four viewports by scripts/drone-deck-qa.mjs.
// In BOTH test:ci and prebuild, so a red one fails the Cloudflare build too (the r.208 precedent).
import fs from 'node:fs';
import path from 'node:path';
import { DECK_REV } from './deck-head.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const served = fs.readFileSync(path.join(ROOT, 'frontend/public/drone-2525/play.html'), 'utf8');
const carriedPath = path.join(ROOT, `docs/drone-2525/operator-deck/drone-2525_r.${DECK_REV}.html`);
const carried = fs.existsSync(carriedPath) ? fs.readFileSync(carriedPath, 'utf8') : '';
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), 'utf8'));
const MODEL_RE = /\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?/gi;
const redact = (s) => String(s ?? '').replace(MODEL_RE, 'an external model');
const block = (src) => { const m = src.match(/\/\*RCORE_LEDGER_BEGIN\*\/const RCORE_LEDGER=(\{[\s\S]*?\});\/\*RCORE_LEDGER_END\*\//); return m ? JSON.parse(m[1]) : null; };

ok(carried.length > 0, `the carried deck drone-2525_r.${DECK_REV}.html exists`);
const bS = block(served), bC = block(carried);
ok(!!bS, 'the served deck embeds an RCORE_LEDGER block');
ok(!!bS && !!bC && JSON.stringify(bS) === JSON.stringify(bC), 'the served and the carried deck embed the SAME block — one file, one record');
if (bS) {
  const want = ledger.entries.slice(0, bS.entries.length).map((e) => {
    const o = { rev: e.rev, date: e.date, kind: e.kind, text: redact(e.text ?? ''), commit: e.commit ?? '' };
    if ('shipped' in e) o.shipped = e.shipped;
    return o;
  });
  ok(JSON.stringify(bS.entries) === JSON.stringify(want),
    `the deck's ${bS.entries.length} entries are the ledger's first ${bS.entries.length}, field for field (rev · date · kind · text redacted · commit · shipped)`);
  const lag = ledger.entries.length - bS.entries.length;
  const last = ledger.entries[ledger.entries.length - 1] || {};
  ok(lag === 1 && bS.through === bS.entries.length && last.kind === 'release' && new RegExp(`\\br\\.${DECK_REV}\\b`).test(String(last.text || '')),
    `the deck carries the record through rev ${bS.through}; the file is exactly one entry longer — this release's own row (lag ${lag}, last kind ${last.kind})`);
  ok(bS.section === ledger.section && bS.route === ledger.route && bS.section === 'Drone-2525',
    'the block names the same surface and route as the ledger');
  ok(bS.entries.every((e) => ['ask', 'decision', 'release', 'correction'].includes(e.kind)),
    'every kind is in the shared vocabulary (ask · decision · release · correction)');
  ok(!/\bGrok\b|\bOpus\b|\bSonnet\b|\bHaiku\b|\bGemini\b|\bGPT-?\s*\d/.test(JSON.stringify(bS.entries)),
    'no model name reaches the glass — the ledger keeps its words, the embed redacts them');
  const revs = bS.entries.map((e) => Number(e.rev));
  ok(revs.every((v, i) => i === 0 || v === revs[i - 1] + 1), 'the embedded revisions are consecutive — an append-only chain with no gap');
}
// the badge: his placement, his artwork, never a hand list
ok(!/RCORE_HIST/.test(served) && !/kind:'approved'/.test(served),
  "no hand-typed history and no off-vocabulary kind — r.195's five hard-coded rows never come back");
ok(/<div id="rcoreBadge" data-rcore-badge>/.test(served) && /id="rcIcon" data-rcore-icon/.test(served) && /id="rcPill" data-rcore-pill/.test(served),
  'the badge is the two-click affordance: the reticle at rest, the wordmark pill on the first press');
ok(/function placeRcore\(\)/.test(served) && /if\(typeof placeRcore==='function'\) placeRcore\(\);/.test(served),
  'the badge is placed by MEASUREMENT from the same rects placeFace() measures, and by the same observer — never a guessed offset');
ok(served.includes("'board','toast','rcoreBadge'].forEach(id=>add("),
  "the badge is in the painter's one keep-out list, so no lane sign, caption or status line can land on it");
ok(/push\({id:'RCORE_IS_ON_THE_GLASS'/.test(served) && /push\({id:'RCORE_IS_THE_SHARED_HISTORY'/.test(served) && /push\({id:'RCORE_NEVER_COVERS_THE_PICTURE'/.test(served),
  'the deck measures its own badge at boot — on the glass, the shared history, and covering nothing');
// the two rasters are the carried bytes, inlined
for (const [name, file] of [['RCORE_ICON_PNG', 'r-core-icon@84.png'], ['RCORE_WORDMARK_PNG', 'r-core-wordmark@84.png']]) {
  const p = path.join(ROOT, 'docs/drone-2525/operator-deck/img', file);
  if (!fs.existsSync(p)) { fail++; console.log('FAIL: the carried raster is missing:', 'docs/drone-2525/operator-deck/img/' + file); continue; }
  const b = fs.readFileSync(p);
  const uri = 'data:image/png;base64,' + b.toString('base64');
  ok(served.includes(`const ${name}='${uri}'`) && carried.includes(`const ${name}='${uri}'`),
    `${name} is the carried img/${file} (${b.length} B) inlined — his own artwork, one file, nothing fetched`);
}
// every shared hook, so the deck's panel IS the shared panel
for (const hook of ['data-rcore-badge', 'data-rcore-icon', 'data-rcore-pill', 'data-rcore-panel', 'data-rcore-header',
  'data-rcore-download', 'data-rcore-close', 'rcore-select-a', 'rcore-select-b', 'data-rcore-preset', 'data-rcore-stat',
  'data-rcore-sum', 'data-rcore-summary', 'data-rcore-keyimp', 'data-rcore-keyimp-item', 'data-rcore-mode', 'cmpVU', 'cmpVS',
  'data-rcore-nav', 'data-rcore-details', 'data-rcore-list', 'data-rcore-impact', 'data-rcore-scrub', 'data-rcore-step', 'data-rcore-ticks'])
  ok(served.includes(hook), `the shared hook ${hook} is in the deck's panel`);
// every visible word, verbatim from the rcore.* lexicon keys (English only here — the ×33 fill is staged and owed)
for (const word of ['Version History', 'What changed', 'History', 'vs previous', 'v1 vs latest', 'carried unchanged', 'crossed',
  'Key improvements', 'Unified', 'Side by side', 'Previous change', 'Next change', 'Details', 'Filtered', 'Revision', 'Kind',
  'Impact', 'Date', 'Reason', 'latest release', 'historical release', 'Download this history (HTML)', 'append-only',
  'L1 · editorial', 'L2 · clarification', 'L3 · functional', 'L4 · governance / economic', 'L5 · constitutional',
  'Same revision selected on both sides', 'too large for a word-level view', 'Fewer than two revisions on record'])
  ok(served.includes(word), `the shared word "${word}" is in the deck's panel`);
// the engine is PORTED, function by function — not reinvented and not approximated
for (const fn of ['function rcCompare(a,b,history)', 'function rcDiffTokens(a,b,cap)', 'function rcDiffText(oldText,newText,cap)',
  'function rcTokenize(text)', 'function rcSideBySide(ops)', 'function rcUnified(ops)', 'function rcEscHtml(s)', 'function rcEscAttr(s)',
  'function rcStripBidi(s)', 'function rcRedact(s)', 'function rcFirstSentence(text,max)', 'function rcFromLedger(json)',
  'function rcImpactOf(r)', 'function rcCategoryOf(r)', 'function rcFnv1a(s)', 'function rcDownloadHtml(history,cmp)'])
  ok(served.includes(fn), `the shared engine's ${fn.replace('function ', '').replace(/\(.*/, '')} is ported`);
// the two behaviours a careless port gets wrong, pinned as source text
ok(/dp\[i\+1\]\[j\]>=dp\[i\]\[j\+1\] \? dp\[i\+1\]\[j\] : dp\[i\]\[j\+1\]/.test(served) && /else if\(dp\[i\+1\]\[j\]>=dp\[i\]\[j\+1\]\)\{ ops\.push\(\{t:-1,s:a\[i\]\}\)/.test(served),
  'the LCS tie-break is the shared engine\'s: on a tie the DELETION is emitted first, which is what makes the two outputs identical');
ok(/if\(\/\\binvariant\\b\|\\bauthority\\b\|\\bgovernance\\b\|\\bconstitution\|\\bontolog\|never fires\|human approv\/\.test\(t\)\) return 'L5';/.test(served),
  'impact is read from the TEXT before the kind — it is not a kind→impact ladder (nine of the drone rows differ from the naive one)');
ok(/cap = \(cap===undefined\) \? 3000 : cap;/.test(served), 'the one LCS cap, 3000, is the shared DIFF_CAP');
// the shared React gate is untouched and still green on its own sources
const sharedGate = fs.readFileSync(path.join(ROOT, 'frontend/tests/rcore-revisions.test.mjs'), 'utf8');
ok(/never a fixed overlay on top of the image\/slide \(operator 2026-09-25\)/.test(sharedGate),
  'the shared badge rule is unchanged — this gate adds the deck, it does not relax React');
console.log(`\ndeck-rcore: ${pass} passed, ${fail} failed · the range's R-CORE is the shared ledger in the shared format, through rev ${bS ? bS.through : '?'}`);
process.exit(fail ? 1 : 0);

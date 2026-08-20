#!/usr/bin/env node
/**
 * QIS / H.I. semantic regression check (eXeL + Grok r229/r230 close-out).
 *
 * Asserts that NO winning block's RENDERED HTML BODY (the part readers see — the thrust /
 * changelog metadata is intentionally excluded) recreates any retired doctrine:
 *   - QIS → 웃 second issuance path  ("dollar share ÷ local minimum-wage rate")
 *   - 웃 "redeems for cash" in the ontology
 *   - the old weighted reward formula (0.10 / 0.20 / 0.40 / 0.30)
 *   - gross-profit as the R&D denominator ("Recommendation: gross profit")
 *   - points → housing conversion
 *   - the pre-r219 order "earned = hours × M" (must be M × hours)
 *
 * Retired phrases are allowed to survive in prior ledger versions (replay) and in the
 * thrust/changelog text (which records the removal) — only the WINNING RENDERED BODY is checked.
 *
 * Exit 0 = clean; exit 1 = a retired doctrine resurfaced in a live block.
 */
import { readFileSync } from 'node:fs';
const P = process.argv[2] || '/home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const s = readFileSync(P, 'utf8');

// winning version of each id
const re = /L\((\d+),"([a-z0-9._]+)",/g;
const wins = {};
let m;
while ((m = re.exec(s))) { const v = +m[1], id = m[2]; if (!wins[id] || v > wins[id].v) wins[id] = { v, idx: m.index }; }

// extract the rendered HTML body of a winning block (evaluate the '<..'+'..' string expression,
// i.e. everything after the thrust argument), NOT the thrust/changelog metadata.
function bodyOf(id) {
  const st = wins[id].idx;
  const end = s.indexOf("');", st);
  if (end < 0) return '';
  const stmt = s.slice(st, end + 1);        // include the final closing quote
  const h = stmt.indexOf("'<");             // first HTML string part
  if (h < 0) return '';
  try { return new Function('return (' + stmt.slice(h) + ')')(); } catch (e) { return stmt.slice(h); }
}

const FORBIDDEN = [
  ['QIS→웃 second issuance path', /dollar share &divide; local minimum-wage/i],
  ['웃 redeems for cash', /redeems for cash/i],
  ['old weighted reward formula', /0\.10.{0,4}0\.20.{0,4}0\.40|0\.20.{0,4}0\.40.{0,4}0\.30/],
  ['gross-profit R&D denominator', /Recommendation:\s*gross profit/i],
  ['points→housing conversion', /points?\s*(&rarr;|&#8594;|to)\s*(housing|home|down\s*payment)/i],
  ['pre-r219 order hours×M', /earned\s*=\s*hours\s*(&times;|×|x)\s*M/i],
];

let fails = 0;
for (const [name, rx] of FORBIDDEN) {
  const hits = Object.keys(wins).filter((id) => rx.test(bodyOf(id)));
  if (hits.length) { fails++; console.error(`FAIL  ${name}: winning body in [${hits.map((h) => h + ' r' + wins[h].v).join(', ')}]`); }
  else console.log(`ok    ${name}`);
}

// positive assertions the canon MUST carry
const POSITIVE = [
  ['fund.metrics carries QIS ≠ Ownership', 'fund.metrics', /QIS &ne; Ownership|QIS &#8800; Ownership/],
  ['fund.metrics carries the human line', 'fund.metrics', /Honor the Past/],
  ['brief.formula names QIS', 'brief.formula', /Qualified Innovation Score|QIS = \(R \+ GP \+ OI \+ ERD\)/],
  ['unit.ceiling uses M × hours', 'unit.ceiling', /earned = M &times; hours/],
];
for (const [name, id, rx] of POSITIVE) {
  if (wins[id] && rx.test(bodyOf(id))) console.log(`ok    ${name}`);
  else { fails++; console.error(`FAIL  ${name}: missing in winning ${id}`); }
}

console.log(fails ? `\nQIS SEMANTIC CHECK: ${fails} FAILURE(S)` : `\nQIS SEMANTIC CHECK: PASS (VMAX r${Math.max(...Object.values(wins).map((w) => w.v))})`);
process.exit(fails ? 1 : 0);

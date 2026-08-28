// exec-summary-freeze.mjs — freeze the canonical English and give every sentence an address.
//
// Run this whenever the approved text changes. It does exactly two things and
// changes no prose: it hashes the canonical source, and it issues a stable ID for
// every sentence in it. Everything downstream depends on those two facts —
// exec-summary-build.mjs refuses to build if the hash moves, and the Sumerian
// edition (task #27) is composed and audited sentence by sentence against the IDs.
//
// The freeze is what makes "which text am I holding?" answerable by a reader
// rather than by an assurance.
//
// Run: node scripts/exec-summary-freeze.mjs [--write]
import fs from 'fs';
import crypto from 'crypto';

const EN   = 'docs/i18n/exec-summary.en.json';
const OUT  = 'docs/i18n/exec-summary.sentences.json';
const WRITE = process.argv.includes('--write');

const raw = fs.readFileSync(EN, 'utf8');
const d = JSON.parse(raw);

/* Structural invariants. A freeze over a malformed source would certify the
   malformation, so this refuses instead. */
const problems = [];
if (d.k00 === undefined || Object.keys(d).length !== 71) problems.push(`expected 71 keys, found ${Object.keys(d).length}`);
const expected = Array.from({length: 71}, (_, i) => 'k' + String(i).padStart(2, '0'));
if (expected.join() !== Object.keys(d).join()) problems.push('key order or naming has drifted');
const headings = Object.keys(d).filter(k => k >= 'k03' && k <= 'k16').length;
const body     = Object.keys(d).filter(k => k >= 'k17' && k <= 'k55').length;
if (headings !== 14) problems.push(`expected 14 headings, found ${headings}`);
if (body !== 39)     problems.push(`expected 39 body paragraphs (13 pages x 3), found ${body}`);
for (const [k, v] of Object.entries(d)) {
  if (!String(v).trim()) problems.push(`${k} is empty`);
  if (/\.(html|txt)\b/.test(v)) problems.push(`${k} carries a source filename in visible prose`);
}
if (problems.length) { console.error('REFUSING TO FREEZE:\n  ' + problems.join('\n  ')); process.exit(1); }

/* Body paragraphs split into sentences; everything else is one unit. The split is
   deterministic — same input, same IDs, every run. */
const BODY = k => k >= 'k17' && k <= 'k55';
const sentences = s => s.split(/(?<=[.!?])\s+(?=[A-Z“"'(])/).filter(x => x.trim());

const sid = {};
for (const k of Object.keys(d)) {
  const parts = BODY(k) ? sentences(d[k]) : [d[k]];
  parts.forEach((s, i) => { sid[`${k}.s${String(i + 1).padStart(2, '0')}`] = s; });
}

const sha = crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
const words = Object.values(d).join(' ').trim().split(/\s+/).filter(Boolean).length;

let prev = null;
try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')).sha256; } catch (_) { /* first freeze */ }

console.log(`keys       ${Object.keys(d).length}   headings ${headings}   body ${body}`);
console.log(`words      ${words}`);
console.log(`sentences  ${Object.keys(sid).length}`);
console.log(`sha256     ${sha}`);
if (prev && prev !== sha) console.log(`supersedes ${prev}`);
if (prev === sha) { console.log('\nunchanged — the source already hashes to the recorded freeze'); process.exit(0); }

if (!WRITE) { console.log('\n(dry run — pass --write to record this freeze)'); process.exit(0); }
fs.writeFileSync(OUT, JSON.stringify({ sha256: sha, words, sentences: sid }, null, 2) + '\n');
console.log(`\nwrote ${OUT}`);

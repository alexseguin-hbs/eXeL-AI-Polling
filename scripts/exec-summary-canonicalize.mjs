// exec-summary-canonicalize.mjs — the r1.004 canonicalization pass.
//
// Operator ruling (2026-08-28): "Do not rewrite the philosophy. Do not add new
// doctrine. Do not shorten the 1+12 architecture. Perform a terminology-and-
// grammar normalization pass only."
//
// The frozen four-term hierarchy — Thought -> Thought Mastery -> Thought Master
// -> Master of Thought. One idea, four grammatical views:
//   Master of Thought  = formal title, named responsibility, seal/authorship
//   a Thought Master   = a Human actor practising the discipline
//   Thought Mastery    = the discipline, capability or practice
//   master thought     = ordinary prose, only where grammatically superior
//
// Every edit below is a SUBSTITUTION. None adds a sentence. The script refuses
// to run if any `from` string is not found exactly once, so a silent partial
// application is impossible.
//
// Run: node scripts/exec-summary-canonicalize.mjs [--write]
import fs from 'fs';
import crypto from 'crypto';

const EN_PATH  = 'docs/i18n/exec-summary.en.json';
const TPL_PATH = 'docs/i18n/exec-summary.template.html';
const LOG_PATH = 'docs/i18n/exec-summary.changelog.md';
const SID_PATH = 'docs/i18n/exec-summary.sentences.json';
const WRITE    = process.argv.includes('--write');

// ── Terminology edits ────────────────────────────────────────────────────────
// rule: which of the four grammatical views justifies the change.
const EDITS = [
  { key:'k17', rule:'title', from:'And we call the continuing human responsibility to practice that discipline Master of Thought.',
                             to:'A person who accepts the continuing responsibility to practice it becomes a Master of Thought.' },
  { key:'k19', rule:'discipline', from:'That is Master of Thought at civilization scale:',
                                  to:'That is Thought Mastery at civilization scale:' },
  { key:'k22', rule:'actor', from:'Master of Thought begins by learning to distinguish',
                             to:'A Thought Master begins by learning to distinguish' },
  { key:'k23', rule:'title', from:'The Divinity Guide describes the Master of Thought not as ruler but teacher:',
                             to:'The Divinity Guide presents the Master of Thought not as a ruler, but as a teacher:' },
  { key:'k25', rule:'discipline', from:'Master of Thought therefore becomes a responsibility available to every person:',
                                  to:'Thought Mastery therefore becomes a discipline available to every person:' },
  { key:'k28', rule:'discipline', from:'Master of Thought stands inside this relationship as discipline',
                                  to:'Thought Mastery stands inside this relationship as discipline' },
  { key:'k34', rule:'actor', from:'Master of Thought uses simulation as disciplined imagination.',
                             to:'A Thought Master uses simulation as disciplined imagination.' },
  { key:'k37', rule:'discipline', from:'Master of Thought is the discipline of leaving those questions',
                                  to:'Thought Mastery is the discipline of leaving those questions' },
  { key:'k40', rule:'discipline', from:'Master of Thought is the Human discipline that gives the cycle',
                                  to:'Thought Mastery is the Human discipline that gives the cycle' },
  { key:'k43', rule:'actor', from:'Master of Thought asks the decisive question after every generation',
                             to:'A Thought Master asks the decisive question after every generation' },
  { key:'k46', rule:'actor', from:'Master of Thought must be willing to lose its favorite idea.',
                             to:'A Thought Master must be willing to lose a favorite idea.' },
  { key:'k49', rule:'actor', from:'Master of Thought is tested most clearly by the willingness',
                             to:'A Thought Master is tested most clearly by the willingness' },
  { key:'k49', rule:'title', from:'The living framework describes Master of Thought as responsibility rather than rank;',
                             to:'The living framework defines Master of Thought as a responsibility rather than a rank;' },
  { key:'k52', rule:'title+discipline', from:'Master of Thought is no longer one person writing a framework. It becomes a capability',
                                        to:'The Master of Thought is no longer the name of one person writing a framework. Thought Mastery becomes a capability' },
  { key:'k55', rule:'title', from:'This is where Master of Thought returns to Humanity.',
                             to:'This is where the Master of Thought returns to Humanity.' },
];

// ── Source-filename artifacts: out of visible prose, into template metadata ──
// Operator: "they belong in source metadata or notes."
const ARTIFACTS = [
  { key:'k21', text:'SOI_VISION2525_v.19_LIVING_DOCUMENT.html' },
  { key:'k23', text:'Divinity Guide.txt' },
  { key:'k36', text:'SOI_VISION2525_v.19_LIVING_DOCUMENT.html' },
  { key:'k49', text:'SOI_VISION2525_v.19_LIVING_DOCUMENT.html' },
];

const sentences = s => s.split(/(?<=[.!?])\s+(?=[A-Z“"'(])/).filter(x => x.trim());

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const before = JSON.parse(JSON.stringify(en));
const log = [];
let failed = 0;

for (const e of EDITS) {
  const v = en[e.key];
  if (v === undefined) { console.error(`MISSING KEY ${e.key}`); failed++; continue; }
  const n = v.split(e.from).length - 1;
  if (n !== 1) { console.error(`${e.key}: expected 1 occurrence, found ${n} — ${JSON.stringify(e.from.slice(0,60))}`); failed++; continue; }
  en[e.key] = v.replace(e.from, e.to);
  log.push({ key:e.key, kind:'terminology', rule:e.rule, from:e.from, to:e.to });
}

for (const a of ARTIFACTS) {
  const v = en[a.key];
  if (v === undefined) { console.error(`MISSING KEY ${a.key}`); failed++; continue; }
  const n = v.split(a.text).length - 1;
  if (n !== 1) { console.error(`${a.key}: expected 1 artifact, found ${n} — ${a.text}`); failed++; continue; }
  // Remove the bare filename plus the single space that precedes it, then tidy.
  en[a.key] = v.replace(new RegExp('\\s*' + a.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ''), '')
               .replace(/\s{2,}/g, ' ').trim();
  log.push({ key:a.key, kind:'artifact', rule:'source filename -> template data-source', from:a.text, to:'(removed from prose)' });
}

if (failed) { console.error(`\nREFUSING TO WRITE — ${failed} edit(s) did not match exactly once.`); process.exit(1); }

// ── Invariants: structure must be untouched ─────────────────────────────────
const HEADINGS = Array.from({length:13}, (_,i) => 'k' + String(i+3).padStart(2,'0'));
const BODY     = Array.from({length:39}, (_,i) => 'k' + String(i+17).padStart(2,'0'));
const PROTECTED = [...Array.from({length:13}, (_,i) => 'k' + String(i+56).padStart(2,'0')), 'k69', 'k70'];

const problems = [];
if (Object.keys(en).length !== Object.keys(before).length) problems.push('key count changed');
for (const k of HEADINGS) if (en[k] !== before[k]) problems.push(`heading ${k} changed`);
for (const k of PROTECTED) if (en[k] !== before[k]) problems.push(`protected ${k} changed`);
for (const k of BODY) {
  const a = sentences(before[k]).length, b = sentences(en[k]).length;
  const artifact = ARTIFACTS.some(x => x.key === k);
  if (b !== a && !artifact) problems.push(`${k}: sentence count ${a} -> ${b} (nothing may be added)`);
  if (b > a) problems.push(`${k}: gained a sentence (${a} -> ${b})`);
}
for (const term of ['R-CORE','Replay','Simulation','Qualification','Measurement of Time','9,999','Human Authority','Collective Intelligence']) {
  const c = s => Object.values(s).join(' ').split(term).length - 1;
  if (c(en) !== c(before)) problems.push(`protected term "${term}" count ${c(before)} -> ${c(en)}`);
}
if (problems.length) { console.error('\nINVARIANT FAILURES:\n  ' + problems.join('\n  ')); process.exit(1); }

// ── Sentence IDs — stable addresses for the EN.SAG.KI rebuild ───────────────
const sid = {};
for (const k of Object.keys(en)) {
  const parts = BODY.includes(k) ? sentences(en[k]) : [en[k]];
  parts.forEach((s, i) => { sid[`${k}.s${String(i+1).padStart(2,'0')}`] = s; });
}

const canonical = JSON.stringify(en, null, 2) + '\n';
const sha = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');

const wordsOf = o => Object.values(o).join(' ').trim().split(/\s+/).filter(x => x && !/^[—–\-•·]+$/.test(x)).length;

let md = `# Executive Summary — canonicalization change log\n\n`;
md += `**Pass:** terminology-and-grammar normalization only (v.19 r1.004).\n`;
md += `**Rule set:** Master of Thought = formal title / named responsibility / seal · a Thought Master = a Human actor practising the discipline · Thought Mastery = the discipline or capability · master thought = ordinary prose only where grammatically superior.\n\n`;
md += `**Frozen canonical source SHA-256:** \`${sha}\`\n\n`;
md += `| # | Key | Kind | Rule | From | To |\n|---:|---|---|---|---|---|\n`;
log.forEach((e, i) => {
  const esc = s => s.replace(/\|/g, '\\|');
  md += `| ${i+1} | ${e.key} | ${e.kind} | ${e.rule} | ${esc(e.from)} | ${esc(e.to)} |\n`;
});
md += `\n**Structure held:** ${HEADINGS.length} headings, ${BODY.length} body paragraphs (13 pages x 3), `;
md += `${Object.keys(en).length} keys — unchanged.\n`;
md += `**Words:** ${wordsOf(before)} -> ${wordsOf(en)}.\n`;
md += `**Sentence IDs:** ${Object.keys(sid).length} in \`exec-summary.sentences.json\`.\n`;

if (!WRITE) {
  console.log(md);
  console.log('\n(dry run — pass --write to apply)');
  process.exit(0);
}

fs.writeFileSync(EN_PATH, canonical);
fs.writeFileSync(SID_PATH, JSON.stringify({ sha256: sha, sentences: sid }, null, 2) + '\n');
fs.writeFileSync(LOG_PATH, md);

// Template: carry the stripped provenance as data-source on the paragraph.
let tpl = fs.readFileSync(TPL_PATH, 'utf8');
for (const a of ARTIFACTS) {
  const tok = `<p>{{${a.key}}}`;
  if (!tpl.includes(tok)) { console.error(`template: ${tok} not found`); process.exit(1); }
  tpl = tpl.replace(tok, `<p data-source="${a.text}">{{${a.key}}}`);
}
fs.writeFileSync(TPL_PATH, tpl);

console.log(md);
console.log(`\nwrote ${EN_PATH}, ${SID_PATH}, ${LOG_PATH}, ${TPL_PATH}`);

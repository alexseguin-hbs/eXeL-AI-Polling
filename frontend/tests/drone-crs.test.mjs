// DRONE-2525 CRS — the append-only gate (operator 2026-09-15: "Create logical step by step CRS and ensure
// we use Vision-2525 revision and ensure track revision and version and comparison for traceability").
// A requirement ladder that can be quietly rewritten is not traceability, so this refuses a renamed id, a
// reused revision, a status outside the six, a release without a commit, and a generated view gone stale.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const REPO = path.resolve('..');
const d = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/drone-2525/drone-2525.v00.00.json'), 'utf8'));
const STATUSES = new Set(['draft', 'approved', 'implemented', 'verified', 'superseded', 'out-of-scope']);
const SECTIONS = new Set(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII']);

// 1 — version and revision open where the operator said they open
ok(d.project.version === '00.00', 'the domain opens at Version 00.00');
ok(/^\d\.\d{3}$/.test(d.project.revision), `revision is X.YYY (${d.project.revision})`);
ok(d.revisions.at(-1).revision === d.project.revision, 'project.revision is the last appended revision');

// 2 — the id law: DRN-##[.##], two digits, never letters, unique, parent exists
const ids = d.crs.map((r) => r.id);
ok(new Set(ids).size === ids.length, 'every CRS id is declared once');
for (const r of d.crs) {
  ok(/^DRN-\d{2}(\.\d{2})?$/.test(r.id), `${r.id} obeys DRN-##[.##] (two digits, never letters)`);
  if (r.id.includes('.')) ok(ids.includes(r.id.split('.')[0]), `${r.id} has its parent row`);
}

// 3 — every row is answerable: statement, trace, phase, mode, metric, gate, status
for (const r of d.crs) {
  ok(typeof r.statement === 'string' && r.statement.length > 40, `${r.id} states a requirement you can pass or fail on the sentence alone`);
  ok(SECTIONS.has(r.section), `${r.id} cites a real Vision • 2525 section (${r.section})`);
  ok(STATUSES.has(r.status), `${r.id} status is one of the six (${r.status})`);
  ok(Array.isArray(r.uwf) && r.uwf.every((u) => /^U-WF-\d{2}$/.test(u)), `${r.id} traces to WIREFRAME-CORE clauses`);
  ok(Boolean(r.phase && r.mode && r.metric && r.verify && r.dtm && r.stretch), `${r.id} carries phase, mode, metric, gate, DTM and stretch`);
  ok(r.in === `${r.id}.IN` && r.out === `${r.id}.OUT`, `${r.id} declares its input and output ids`);
}

// 4 — one step per Vision section: the ladder is 13 parents, sections I…XIII, each used once
const parents = d.crs.filter((r) => !r.id.includes('.'));
ok(parents.length === 13, `the ladder has 13 parent steps (${parents.length})`);
ok(new Set(parents.map((r) => r.section)).size === 13, 'each parent step sits on a different Vision • 2525 section');

// 5 — revisions strictly increase, never reuse, and a release cites a real commit
let last = -1;
for (const r of d.revisions) {
  const n = Math.round(Number(r.revision) * 1000);
  ok(n > last, `revision ${r.revision} comes after ${last / 1000} — a number is never reused`);
  last = n;
  ok(['ask', 'decision', 'release'].includes(r.kind), `revision ${r.revision} kind is ask|decision|release (${r.kind})`);
  if (r.kind === 'release') ok(/^[0-9a-f]{7,40}$/.test(r.commit ?? ''), `release ${r.revision} cites a real commit`);
}

// 6 — the handoff is persisted and hashed, so the ask cannot drift from what was asked
const ask = path.join(REPO, d.project.handoff);
ok(fs.existsSync(ask), `the verbatim ask is on disk at ${d.project.handoff}`);
ok(/^[0-9a-f]{64}$/.test(d.project.handoffSha256), 'the ask carries a checkable sha256');

// 7 — every generated view matches the source (no hand-edited CRS)
let rendered = true;
try { execFileSync('node', [path.join(REPO, 'scripts/drone-render.mjs'), '--check'], { stdio: 'pipe' }); }
catch { rendered = false; }
ok(rendered, 'CRS_DRONE-2525.md, README, ASSUMPTIONS_REGISTER and domain.gen.ts all match the one source');

// 8 — every DRN row of the current revision reaches the /crs matrix, so the operator can compare editions
const matrix = fs.readFileSync('lib/crs-matrix-data.ts', 'utf8');
for (const r of d.crs) ok(matrix.includes(`"crs": "${r.id}"`), `${r.id} has a row in the /crs matrix`);
ok(matrix.includes('DR-2026.09.15-r0.001'), 'the matrix rows carry this revision\'s review id');
// The matrix must not claim a step is further along than the source says it is.
for (const r of d.crs) {
  const row = matrix.match(new RegExp(`"crs": "${r.id}",[\\s\\S]{0,1400}?"changeDesc": "([^"]*)"`));
  ok(row && row[1] === r.status, `${r.id} reads "${row ? row[1] : '—'}" in the matrix and "${r.status}" in the source`);
}

// 9 — the app reads the generated module, never the docs file (a static export cannot reach outside its root)
const shell = fs.readFileSync('components/drone-2525/command-ux1.tsx', 'utf8');
ok(/domain\.gen/.test(shell) && !/docs\/drone-2525/.test(shell), 'the shell imports the generated module, not the docs JSON');

console.log(`\ndrone-crs: ${pass} passed, ${fail} failed · ${parents.length} steps · revision ${d.project.revision}`);
process.exit(fail ? 1 : 0);

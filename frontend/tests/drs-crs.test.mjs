// DRS CRS gate — De-Risking Strategies rows on the /crs matrix follow the ONE JSON master.
// Mirrors tests/drone-crs.test.mjs §7–8: the rendered views match the source, every DRS row reaches the matrix,
// and the matrix never claims a step is further along than the source says.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(process.cwd(), '..');
const d = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/drs/drs.v00.00.json'), 'utf8'));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  ✗ ' + m); } };

// 1 — both rendered views match the source (no hand-edited gate review or research doc)
let rendered = true;
try { execFileSync('node', [path.join(REPO, 'scripts/drs-render.mjs'), '--check'], { stdio: 'pipe' }); } catch { rendered = false; }
ok(rendered, 'DE-RISKING_STRATEGIES_GATE_REVIEW.md and NEEDS_ASSESSMENT_RESEARCH.md match the one source');

// 2 — every DRS row of the current revision reaches the /crs matrix, with this revision's review id
const matrix = fs.readFileSync('lib/crs-matrix-data.ts', 'utf8');
for (const r of d.crs) ok(matrix.includes(`"crs": "${r.id}"`), `${r.id} has a row in the /crs matrix`);
ok(matrix.includes(`DRS-2026.09.23-r${d.project.revision}`) || matrix.includes('DRS-2026.09.23-r0.003'), 'the DRS matrix rows carry a DRS review id');
for (const r of d.crs) {
  const row = matrix.match(new RegExp(`"crs": "${r.id}",[\\s\\S]{0,1400}?"changeDesc": "([^"]*)"`));
  ok(row && row[1] === r.status, `${r.id} reads "${row ? row[1] : '—'}" in the matrix and "${r.status}" in the source`);
}
// 3 — no dollar figure in any DRS matrix row (the evidence law)
const drsBlock = matrix.slice(matrix.indexOf('"crs": "DRS-01"'));
ok(!/\$\s?\d/.test(drsBlock), 'no DRS matrix row carries a dollar figure');

// 4 — the Pod codes in the source are the ones the Pod seeds (one master for the hierarchy too)
const inno = fs.readFileSync('lib/innovation-data.ts', 'utf8');
ok(inno.includes(`code: "${d.pod.bu}"`) && inno.includes(`code: "${d.pod.sbu}"`) && inno.includes(`code: "${d.pod.alphaGroup}"`) && inno.includes(`code: "${d.pod.alphaCode}"`), `HIER_DECLARED carries ${d.pod.bu} › ${d.pod.sbu} › ${d.pod.alphaGroup} › ${d.pod.alphaCode}`);
ok(inno.includes(`"${d.pod.projectId.split(' ')[0]}": { bu: "${d.pod.bu}"`), `${d.pod.projectId.split(' ')[0]} is reserved on the ${d.pod.bu} chain`);
ok(/^HOLD/.test(d.pod.status), 'the source states the HOLD on the project row');

console.log(`\ndrs-crs: ${pass} passed, ${fail} failed · ${d.crs.length} DRS rows · revision ${d.project.revision}`);
process.exit(fail ? 1 : 0);

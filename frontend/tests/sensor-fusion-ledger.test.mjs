// THE SENSORFUSION RECORD OBEYS THE SAME LAW AS EVERY OTHER (DD-55).
//
// Operator 2026-10-14: "each innovation project gets its own rcore panel (drone, security, light codex,
// Vision-2525, etc)". SensorFusion already HAD a panel and a record — but its record lives here, as hand-written
// TypeScript at app/SensorFusion-2525/ledger.ts, OUTSIDE docs/traceability, outside gen-rcore-revisions.mjs and
// outside every gate. So nothing had ever checked it, and seven of its release rows carry no commit at all.
//
// The file is NOT moved. It belongs to the SensorFusion rounds, and relocating another workflow's append point
// would break their process to satisfy this one. Instead the law comes to the file:
//
//   · every revision number is consecutive from 1, and every kind is in the shared vocabulary
//   · every cited commit RESOLVES and is an ANCESTOR OF HEAD — not merely that the object exists, which is what
//     git cat-file -e proves and is the hole the traceability gate still has
//   · a `release` row MUST carry a commit — a release without one is a claim, not a record — EXCEPT the seven
//     that rev 77's correction row names, by number, on the record. Only those seven, and only through that row.
//
// So the existing gap is declared rather than hidden, nothing above it is edited (his law: a new edition is an
// append, never an edit), and the eighth unverifiable release row cannot be written.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const FILE = 'frontend/app/SensorFusion-2525/ledger.ts';
const src = fs.readFileSync(path.join(ROOT, FILE), 'utf8');

const rows = [...src.matchAll(/rev:\s*(\d+),\s*date:\s*"([^"]*)",\s*kind:\s*"([^"]*)",\s*text:\s*([\s\S]*?),\s*commit:\s*"([^"]*)",\s*\}/g)]
  .map((m) => ({ rev: +m[1], date: m[2], kind: m[3], text: m[4], commit: m[5] }));
ok(rows.length >= 70, `the ledger parsed (${rows.length} rows); a parse that finds nothing must fail, not pass 0 of 0`);
ok(rows.every((r, i) => r.rev === i + 1), 'the revisions are consecutive from 1 — an append-only chain with no gap');
ok(rows.every((r) => ['ask', 'decision', 'release', 'correction'].includes(r.kind)), 'every kind is in the shared vocabulary');
ok(rows.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date)), 'every row carries an ISO date');

// the seven exempted release rows, read FROM the correction row rather than hardcoded here, so the exemption
// lives on the record and widening it means writing a new correction the reader can see
// the text field may be a JS string CONCATENATION across several lines; join the literals before reading it,
// or a phrase that straddles a `" +` boundary is invisible (it was, the first time this gate ran)
const joinLiterals = (t) => String(t).replace(/"\s*\+\s*\n?\s*"/g, '').replace(/^\s*"/, '').replace(/"\s*$/, '');
rows.forEach((r) => { r.text = joinLiterals(r.text); });
const corrections = rows.filter((r) => r.kind === 'correction');
ok(corrections.length >= 1, 'the record carries at least one correction row');
const exemptRow = corrections.find((r) => /EMPTY commit field/.test(r.text));
ok(!!exemptRow, 'a correction row names the rows that carry no commit');
const exempt = new Set(
  (exemptRow ? (exemptRow.text.match(/Revisions ([\d,\s and]+) are all kind/) || [])[1] || '' : '')
    .split(/[,\s]+/).filter((x) => /^\d+$/.test(x)).map(Number),
);
ok(exempt.size === 7, `the correction names exactly seven exempt revisions (got ${[...exempt].join(',') || 'none'})`);

const resolves = (sha) => { try { execFileSync('git', ['cat-file', '-e', sha + '^{commit}'], { cwd: ROOT, stdio: 'pipe' }); return true; } catch { return false; } };
const isAncestor = (sha) => { try { execFileSync('git', ['merge-base', '--is-ancestor', sha, 'HEAD'], { cwd: ROOT, stdio: 'pipe' }); return true; } catch { return false; } };

let cited = 0;
for (const r of rows) {
  if (!r.commit) {
    if (r.kind === 'release')
      ok(exempt.has(r.rev), `r${r.rev} is a release with NO commit — a release without one is a claim, not a record; it must be named by the correction row`);
    continue;
  }
  cited++;
  ok(resolves(r.commit), `r${r.rev}: the cited commit ${r.commit} resolves`);
  ok(isAncestor(r.commit), `r${r.rev}: ${r.commit} is an ANCESTOR of HEAD — existing is not the same as being in this history`);
}
ok(cited >= 60, `commits were actually checked (${cited}); a run that checks none must fail`);

// the surface still mounts the shared badge over this record
const page = fs.readFileSync(path.join(ROOT, 'frontend/app/SensorFusion-2525/sensor-fusion.tsx'), 'utf8');
ok(/<RCoreBadge\b/.test(page) && /SENSOR_FUSION_RCORE_HISTORY|fromLedgerJson/.test(page),
  'SensorFusion mounts the shared badge over this record');

console.log(`\nsensor-fusion-ledger: ${pass} passed, ${fail} failed · ${rows.length} rows, ${cited} commits each resolved and proven an ancestor of HEAD, ${exempt.size} release rows exempt BY NAME through the correction at r${exemptRow ? exemptRow.rev : '?'}`);
process.exit(fail ? 1 : 0);

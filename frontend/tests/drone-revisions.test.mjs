// EVERY REVISION DOCUMENTED FOR REVIEW (operator 2026-09-19: "ensure each version revision is documented for review
// like we did with the Vision-2525 whitepaper"). docs/drone-2525/operator-deck/REVISIONS.md is the append-only
// register. This gate holds it to the bytes: every carried drone-2525_r.NNN.html from r.128 on has an entry whose
// sha256 and byte count match the file; README HEAD is the last entry; and each row carries a chain hash over the
// previous row's chain, so editing or removing an earlier entry breaks every later one — append, never edit.
import fs from 'node:fs';
import crypto from 'node:crypto';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const dir = new URL('../../docs/drone-2525/operator-deck/', import.meta.url);
const reg = fs.readFileSync(new URL('REVISIONS.md', dir), 'utf8');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const rows = reg.split('\n').map((l) => l.match(/^\| (r\.\d{3}) \| (\d{4}-\d{2}-\d{2}) \| ([^|]+) \| (\d+) \| ([0-9a-f]{64}) \| ([^|]*) \| ([0-9a-f]{64}|—) \|$/)).filter(Boolean)
  .map((m) => ({ rev: m[1], date: m[2], author: m[3].trim(), bytes: +m[4], sha: m[5], shipped: m[6].trim(), chain: m[7] }));
ok(rows.length >= 3, `the register has ${rows.length} entries (r.128, r.129, r.130 …)`);
const carried = fs.readdirSync(dir).filter((f) => /^drone-2525_r\.(\d{3})\.html$/.test(f)).filter((f) => +f.match(/r\.(\d{3})/)[1] >= 128).sort();
for (const f of carried) {
  const rev = 'r.' + f.match(/r\.(\d{3})/)[1]; const row = rows.find((r) => r.rev === rev); const b = fs.readFileSync(new URL(f, dir));
  ok(!!row, `${f} has a register entry`);
  if (row) { ok(row.sha === sha(b), `${rev} entry sha256 matches the carried bytes`); ok(row.bytes === b.length, `${rev} entry byte count ${row.bytes} matches the file (${b.length})`); }
}
for (const r of rows) ok(fs.existsSync(new URL(`drone-2525_${r.rev}.html`, dir)), `${r.rev} in the register is actually carried`);
ok(rows.map((r) => +r.rev.slice(2)).every((n, i, a) => i === 0 || n > a[i - 1]), 'entries are in strictly increasing revision order (never re-numbered)');
let prev = '';
for (const r of rows) { const want = sha(prev + '|' + r.rev + '|' + r.sha + '|' + r.bytes); ok(r.chain === want, `${r.rev} chain hash carries the previous entry forward (append-only)`); prev = want; }
for (const r of rows) ok(new RegExp(`^## ${r.rev.replace('.', '\\.')} — `, 'm').test(reg), `${r.rev} has a narrative section (what changed, corrections)`);
const readme = fs.readFileSync(new URL('README.md', dir), 'utf8');
const last = rows[rows.length - 1];
ok(new RegExp(`HEAD is \`drone-2525_${last.rev.replace('.', '\\.')}\\.html\``).test(readme), `README HEAD is the register's last entry (${last.rev})`);
ok(/Claim made at r\.129 that r\.130 corrects/.test(reg), 'the r.129 forward claim is corrected on the record, not silently edited');
console.log(`\ndrone-revisions: ${pass} passed, ${fail} failed · ${rows.length} entries, ${carried.length} carried files ≥ r.128, chain intact`);
process.exit(fail ? 1 : 0);

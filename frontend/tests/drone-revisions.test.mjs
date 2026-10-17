// EVERY REVISION DOCUMENTED FOR REVIEW (operator 2026-09-19: "ensure each version revision is documented for review
// like we did with the Vision-2525 whitepaper"). docs/drone-2525/operator-deck/REVISIONS.md is the append-only
// register. This gate holds it to the bytes: every carried drone-2525_r.NNN.html from r.128 on has an entry whose
// sha256 and byte count match the file; README HEAD is the last entry; and each row carries a chain hash over the
// previous row's chain, so editing or removing an earlier entry breaks every later one — append, never edit.
// THE CHAIN'S REACH, STATED EXACTLY (2026-10-17): it hashes prev|rev|sha|bytes. It does NOT cover the SHIPPED
// column, so a stray write there leaves every chain hash valid. That is not theoretical — r.212's bookkeeping
// replaced the FIRST '| PENDING (Verify Live) |' in the file to mark r.211 superseded, and fifteen rows were
// carrying that placeholder, so the mark landed on r.151 (2026-09-24) while r.211 kept the placeholder. Every
// gate stayed green over a register that named the wrong revision for three days. The two assertions below
// close it by making the register and the LEDGER agree on which revision was superseded.
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
// THE SHIPPED COLUMN, WHICH THE CHAIN CANNOT SEE. A register row may say a later revision superseded it, but only
// the row the LEDGER says was superseded may say so — one record, one answer. Red-first: with the mark on r.151 and
// r.211 still PENDING (how it shipped), both legs fail by name.
{
  const marked = rows.filter((r) => /SUPERSEDED by r\.\d{3}/.test(r.shipped));
  const led = JSON.parse(fs.readFileSync(new URL('../../docs/traceability/drone-2525.ledger.json', import.meta.url), 'utf8'));
  const ledSup = led.entries.filter((e) => /^SUPERSEDED:r\.\d{3}$/.test(String(e.shipped || '')))
    .map((e) => ({ by: String(e.shipped).slice(-3), rev: (String(e.text || '').match(/\br\.(\d{3})\b/) || [])[1] }));
  ok(marked.length === ledSup.length,
     `the register marks as many revisions SUPERSEDED as the ledger does (${marked.length} vs ${ledSup.length})`);
  for (const r of marked) {
    const by = r.shipped.match(/SUPERSEDED by r\.(\d{3})/)[1];
    const mine = r.rev.replace('r.', '');
    ok(+by > +mine, `${r.rev}: SUPERSEDED names a LATER revision (r.${by})`);
    ok(ledSup.some((l) => l.by === by && l.rev === mine),
       `${r.rev}: the LEDGER agrees this is the revision r.${by} superseded — the register cannot name one the record does not`);
  }
}
for (const r of rows) ok(new RegExp(`^## ${r.rev.replace('.', '\\.')} — `, 'm').test(reg), `${r.rev} has a narrative section (what changed, corrections)`);
const readme = fs.readFileSync(new URL('README.md', dir), 'utf8');
const last = rows[rows.length - 1];
ok(new RegExp(`HEAD is \`drone-2525_${last.rev.replace('.', '\\.')}\\.html\``).test(readme), `README HEAD is the register's last entry (${last.rev})`);
ok(/Claim made at r\.129 that r\.130 corrects/.test(reg), 'the r.129 forward claim is corrected on the record, not silently edited');
console.log(`\ndrone-revisions: ${pass} passed, ${fail} failed · ${rows.length} entries, ${carried.length} carried files ≥ r.128, chain intact`);
process.exit(fail ? 1 : 0);

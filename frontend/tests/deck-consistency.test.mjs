// ONE HEAD ACROSS THE WHOLE RECORD (r.134 · Krishna A, fleet 48): the deck gates' DECK_REV, the register's last row, the
// README HEAD, the domain JSON's last release and the traceability ledger's last release name the SAME revision, and the
// patch that built it is carried beside it with its sha in HASHES_rNNN. Before this gate the JSON sat two editions behind
// the register, green.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { DECK_REV } from './deck-head.mjs';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL: ' + m); } };
const D = new URL('../../docs/drone-2525/', import.meta.url);
const reg = fs.readFileSync(new URL('operator-deck/REVISIONS.md', D), 'utf8');
const rows = [...reg.matchAll(/^\| (r\.\d{3}) \| [^|]+ \| [^|]+ \| (\d+) \| ([0-9a-f]{64}) \| [^|]+ \| [0-9a-f]{64} \|$/gm)];
const last = rows[rows.length - 1];
ok(last && last[1] === 'r.' + DECK_REV, `register last row is r.${DECK_REV} (got ${last && last[1]})`);
const readme = fs.readFileSync(new URL('operator-deck/README.md', D), 'utf8');
ok(readme.includes(`HEAD is \`drone-2525_r.${DECK_REV}.html\``), 'README HEAD names the same file');
const json = JSON.parse(fs.readFileSync(new URL('drone-2525.v00.00.json', D), 'utf8'));
const rel = [...json.revisions].reverse().find((r) => r.kind === 'release');
ok(rel && new RegExp(`\\br\\.${DECK_REV}\\b`).test(rel.why), `domain JSON's last release names r.${DECK_REV} (revision ${rel && rel.revision})`);
ok(json.project.revision === (rel && rel.revision), 'domain JSON project.revision is its last entry');
const led = JSON.parse(fs.readFileSync(new URL('../traceability/drone-2525.ledger.json', D), 'utf8'));
const ents = led.entries || led; const lrel = [...ents].reverse().find((e) => e.kind === 'release');
ok(lrel && new RegExp(`\\br\\.${DECK_REV}\\b`).test(lrel.text), `traceability ledger's last release names r.${DECK_REV}`);
// THE LEDGER NAMES THE SHIP (fleet r.147, Krishna/MoT 11): a release carries `shipped` — the commit that put the bytes on the
// site, distinct from the artefact commit. PENDING is allowed only on the LAST release (the ship sha is unknowable when the
// artefact is committed); every earlier release must name a real 7-hex sha, and the ledger and the domain JSON must agree.
const relsJ = json.revisions.filter((r) => r.kind === 'release'), relsL = ents.filter((e) => e.kind === 'release');
const shipOk = (v, last) => (last ? /^([0-9a-f]{7,40}|PENDING)$/ : /^[0-9a-f]{7,40}$/).test(String(v || ''));
relsJ.forEach((r, i) => { if (r.shipped !== undefined || i === relsJ.length - 1) ok(shipOk(r.shipped, i === relsJ.length - 1), `domain JSON release ${r.revision} names its ship commit (${r.shipped ?? 'missing'})`); });
relsL.forEach((e, i) => { if (e.shipped !== undefined || i === relsL.length - 1) ok(shipOk(e.shipped, i === relsL.length - 1), `ledger release rev ${e.rev} names its ship commit (${e.shipped ?? 'missing'})`); });
ok(String(rel.shipped || '') === String(lrel.shipped || ''), `the domain JSON and the ledger name the SAME ship commit for the last release (${rel.shipped} vs ${lrel.shipped})`);
const hashes = fs.readFileSync(new URL(`operator-deck/HASHES_r${DECK_REV}.sha256`, D), 'utf8');
const prev = String(+DECK_REV - 1);
const patchPath = new URL(`operator-deck/patches/r${prev}_to_r${DECK_REV}.py`, D);
ok(fs.existsSync(patchPath), `the patch r${prev}_to_r${DECK_REV}.py is carried`);
if (fs.existsSync(patchPath)) {
  const psha = createHash('sha256').update(fs.readFileSync(patchPath)).digest('hex');
  ok(hashes.includes(psha), 'HASHES_r' + DECK_REV + ' carries the sha of the patch that built the deck');
  const src = fs.readFileSync(patchPath, 'utf8');
  ok(!/\/home\/user\//.test(src), 'the patch has no absolute /home/user path (it must run anywhere)');
}
const dsha = createHash('sha256').update(fs.readFileSync(new URL(`operator-deck/drone-2525_r.${DECK_REV}.html`, D))).digest('hex');
ok(last && last[3] === dsha, 'the register row sha is the carried file');
console.log(`\ndeck-consistency: ${pass} passed, ${fail} failed · r.${DECK_REV} is ONE head across register, README, domain JSON, ledger, hashes and patch`);
if (fail) process.exit(1);

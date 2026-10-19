// lawn-record — the Capital Lawn siting record is append-only, UCRS, and moves nothing (CRS-CL.11 / CRS-CL.12, 2026-10-19).
// The nine seat lines of docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md live in docs/drone-2525/drone-2525.v00.00.json as
// `lawnSeats`, chain-hashed row by row in the register's idiom (chain[i] = sha256(chain[i-1] + '|' + id + '|' + canonical row)),
// so an edited or removed row breaks every later hash. `place` is null until he drops a point on the grounds; `modes` is null
// because CL.12 names a column the seat table does not carry — his word, never invented; `deckUnit` names an EXISTING sourced
// station only. Red-first (2026.10.19, scratch copy): one edited field, one deleted row, one three-digit `faces` — each red by name.
//   node tests/lawn-record.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const ROOT = path.resolve(process.cwd(), '..');
const FILE = process.env.LAWN_RECORD || path.join(ROOT, 'docs/drone-2525/drone-2525.v00.00.json');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const canon = (v) => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']'
  : (v && typeof v === 'object') ? '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'
  : JSON.stringify(v);
const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const rows = d.lawnSeats, rec = d.lawnSeatsRecord;
ok(Array.isArray(rows), 'lawnSeats is an array'); ok(rec && typeof rec === 'object', 'lawnSeatsRecord exists');
if (!Array.isArray(rows) || !rec) { console.log(`\nlawn-record: ${pass} passed, ${fail} failed`); process.exit(1); }

const CLS = ['Air', 'Cue only', 'Incoming round', 'Ground', 'High track'];
const STEPS = ['Introductory', 'Intermediate', 'Advance', 'Real-World'];
const ARC = /^\d{4}\.\d{4}$/, UCRS4 = /^\d{4}$/, PLACE = /^UCRS \d{1,2}[A-Z]{1,3}·E\d{4}·N\d{4}$/;
const readBack = (s) => { const [a, b] = s.split('.'); const f = { 25: 0.25, 5: 0.5, 75: 0.75 }[b]; return f == null ? null : `${a}.${String(Math.round(f * 3600)).padStart(4, '0')}`; };
const turretIds = new Set((d.turrets || []).map((t) => t.id));
const SEATS = ['A1', 'A2', 'A3', 'A4', 'S1, S2', 'C1', 'C2', 'G1', 'T1']; // CL.12, nine lines, in the delta's order

// ── nine lines, his order, the delta's words ──
const live = rows.filter((r) => !r.withdraws);
ok(live.length === 9, `nine seat lines, not forty-two (CL.12) — ${live.length}`);
ok(live.map((r) => r.seat).join('|') === SEATS.join('|'), `the lines are CL.12's, in its order (${live.map((r) => r.seat).join(', ')})`);
const ids = rows.map((r) => r.id);
ok(new Set(ids).size === ids.length, 'ids never repeat');

// ── every row's shape ──
for (const r of rows) {
  const t = `seat ${r.id}`;
  ok(typeof r.faces === 'string' && r.faces.length > 3 && !/^\d{3,4}$/.test(r.faces), `${t}: faces is the delta's own words, not a bare number ("${r.faces}")`);
  ok(r.facesUcrs === null || UCRS4.test(r.facesUcrs), `${t}: facesUcrs is null or four UCRS digits (${r.facesUcrs})`);
  if (r.facesUcrs !== null) ok(String(r.faces).startsWith(r.facesUcrs), `${t}: facesUcrs ${r.facesUcrs} is the bearing the words carry`);
  ok(ARC.test(r.arc), `${t}: arc is UCRS AAAA.BBBB, never degrees (${r.arc}) — CL.11`);
  ok(r.arcShort === null || readBack(r.arcShort) === r.arc, `${t}: short form ${r.arcShort} reads back as ${r.arc} (CL.11)`);
  ok(CLS.includes(r.cls), `${t}: class is one of CL.12's five (${r.cls})`);
  ok(STEPS.includes(r.firstStep), `${t}: first step is a ladder rung (${r.firstStep})`);
  ok(r.place === null || PLACE.test(r.place), `${t}: place is null or UCRS {zone}{band}·E####·N#### (${r.place})`);
  ok(r.modes === null, `${t}: modes is null — CL.12 names a fire-modes column the seat table does not carry; his word only`);
  ok(r.deckUnit === null || turretIds.has(r.deckUnit), `${t}: deckUnit is null or an EXISTING sourced station (${r.deckUnit})`);
  ok(typeof r.why === 'string' && r.why.length > 20, `${t}: why is written`);
  if (r.withdraws) ok(ids.includes(r.withdraws) && r.id !== r.withdraws, `${t}: a withdrawal names an earlier row and carries its own id`);
}
// ── the record moves nothing ──
ok(live.every((r) => r.place === null), 'every place is null — grid cells stay blank until he drops a point (delta line 89)');
ok(live.filter((r) => r.deckUnit).length === 1 && live.find((r) => r.id === 'A1')?.deckUnit === 't-south', 'exactly one line is served by an existing station: A1 ← t-south');
ok((d.turrets || []).length === 3 && d.turrets.every((t) => typeof t.homeAz === 'number'), 'the three sourced turrets rows are untouched by this block');

// ── the chain: append-only by construction ──
let prev = '';
for (const r of rows) { const { chain, ...body } = r; const want = sha(prev + '|' + r.id + '|' + canon(body)); ok(chain === want, `${r.id}: chain hash carries the previous row forward (append-only)`); prev = want; }
let cprev = '';
for (const c of rec.corrections || []) { const { chain, ...body } = c; const want = sha(cprev + '|' + c.id + '|' + canon(body)); ok(chain === want, `correction ${c.id}: chain intact`); cprev = want; }

// ── the record names its source and the one correction it carries ──
ok(/CRS_Capital_Lawn_2026-10-19\.md/.test(rec.source || '') && /ad4dcb62e/.test(rec.source || ''), 'the record names the delta and its commit');
ok(Array.isArray(rec.crs) && rec.crs.includes('CRS-CL.11') && rec.crs.includes('CRS-CL.12'), 'the record cites CL.11 and CL.12');
const a1 = live.find((r) => r.id === 'A1');
ok(a1 && a1.facesUcrs === '1800' && a1.arc === '1500.2100', 'A1 faces 1800 down Congress, arc 1500.2100 (CL.12)');
const c1 = (rec.corrections || []).find((c) => c.turret === 't-south' && c.field === 'homeAz');
ok(c1 && c1.recorded === 0 && c1.crs === '1800', 't-south.homeAz 0 vs the CRS 1800 is recorded as a correction, not an edit');
ok(d.turrets.find((t) => t.id === 't-south')?.homeAz === 0, 'the turrets row still reads homeAz 0 — corrected by appending, never by editing');

console.log(`\nlawn-record: ${pass} passed, ${fail} failed · ${live.length} seat lines, ${(rec.corrections || []).length} correction(s), chain intact`);
process.exit(fail ? 1 : 0);

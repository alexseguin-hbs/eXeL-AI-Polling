// THE DECISION RECORD, THE CANONICAL EVENT, THE REPLAY HASH — the gate for R-CORE's RECORD step.
//
// Holds the r.042 item-4 record, the r.043 hash projection, and — deliberately — the three defects found
// in the operator's r.050 that this port must NOT reproduce:
//   the revision on a record comes from the ledger, never a literal (r.050 stamps 0.044 in a 0.050 file)
//   the feed line is a view of the canonical row, so no reader can read stale fields (r.050's scrubber)
//   free-form text never enters the hashed stream (r.050's feed() routes through ev())
import {
  initLedger, decide, ev, note, feedLine, replayHash, projection, firstDivergence, fnv1a64,
  metricsOf, sidecarOf,
} from '../lib/drone-2525/decisions.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const stamp = (o = {}) => ({
  t: 42.181, actor: 'Athena', designated: true, hiApproved: false, authorityLevel: 1, challenge: 3, diff: 2, blu: 500, red: 250, ...o,
});

// ── THE RECORD, ITEM 4 VERBATIM ─────────────────────────────────────────────────────────────────
{
  let L = initLedger('0.050');
  const r = decide(L, 'DESIGNATE', 'UAV-04', stamp());
  L = r.ledger;
  const d = r.record;
  ok(d !== null, 'a named actor produces a record');
  for (const f of ['decisionId', 'designated', 'hiApproved', 'authorityLevel', 'actor']) ok(f in d, `the record carries ${f} — item 4`);
  ok(d.decisionId === 'DEC-0001', 'the id is the SEQUENCE, so a replay produces the same id');
  ok(d.t === 42.18, 'time is game seconds to two places');
  ok(d.rev === '0.050', 'the revision is the LEDGER\'s, given once');
  ok(d.actor === 'Athena' && d.challenge === 3 && d.diff === 2, 'actor, challenge and diff are stamped');

  const bad = decide(L, 'REJECT', 'UAV-04', stamp({ actor: '  ' }));
  ok(bad.record === null && bad.ledger === L, 'an unnamed actor produces NO record and leaves the ledger untouched — a decision without a name is not a decision');

  L = decide(L, 'APPROVE', 'UAV-04', stamp({ hiApproved: true, actor: 'Dana' }), { by: 'Dana', from: 'Athena' }).ledger;
  ok(L.decisions.length === 2 && L.decisions[1].decisionId === 'DEC-0002', 'ids count up');
  ok(L.decisions[1].extra.by === 'Dana' && L.decisions[1].extra.from === 'Athena', 'extra fields (by, from) are kept on the record');
}

// ── THE EVENT ROW AND ITS ONE FEED LINE, ITEM 5 VERBATIM ────────────────────────────────────────
{
  let L = initLedger('0.050');
  const { ledger, row } = ev(L, 'TARGET', 'UAV-04', 'HI', stamp(), 'Athena');
  L = ledger;
  ok(row.seq === 1 && row.verb === 'TARGET' && row.id === 'UAV-04' && row.result === 'HI', 'a canonical row');
  ok(feedLine(row) === '42.18 | Athena | TARGET | UAV-04 | HI', `the feed line is time | actor | verb | id | result: "${feedLine(row)}"`);
  // The line is a VIEW of the row. There is no second field set a scrubber could read instead.
  ok(!('k' in row) && !('x' in row), 'no k/x fields exist to be read by mistake — the r.050 scrubber defect cannot recur');

  L = note(L, 'BLU +250 UAV-04');
  ok(L.notes.length === 1 && L.events.length === 1, 'a free-form note sits BESIDE the stream, not in it');
}

// ── THE HASH: r.043's PROJECTION, AND NOTHING ELSE ──────────────────────────────────────────────
{
  const build = (over = {}) => {
    let L = initLedger('0.050');
    L = ev(L, 'DESIGNATE', 'UAV-04', 'AMBER', stamp(over), 'HI').ledger;
    L = ev(L, 'APPROVE', 'UAV-04', 'RED', stamp({ hiApproved: true, ...over }), 'HI').ledger;
    L = ev(L, 'SIM-ACTION', 'UAV-04', '+250', stamp({ hiApproved: true, blu: 750, ...over }), 'HI').ledger;
    return L;
  };
  const a = build(), b = build();
  ok(replayHash(a) === replayHash(b), 'two identical runs hash identically');
  ok(/^[0-9a-f]{16}$/.test(replayHash(a)), 'sixteen hex digits — FNV-1a 64, the same algorithm as the parity harness');

  // What must NOT change the hash: time, and anything free-form.
  const later = build({ t: 99.99 });
  ok(replayHash(later) === replayHash(a), 'a different game time does NOT change the hash — t is not in the projection');
  ok(replayHash(note(a, 'fps 58.3 sid 9f3a')) === replayHash(a), 'a note carrying an FPS figure and a session id does NOT change the hash');
  // What must.
  ok(replayHash(build({ authorityLevel: 3 })) !== replayHash(a), 'a different authority level does');
  ok(replayHash(build({ blu: 999 })) !== replayHash(a), 'a different score does');
  const c = ev(a, 'HOLD', 'UAV-05', 'CH5_NO_APPROVE', stamp(), 'HI').ledger;
  ok(replayHash(c) !== replayHash(a), 'and an extra event does');

  // The projection is r.043's field list, in order, so the app and the harness agree row for row.
  const p = projection(a)[0].split('|');
  ok(p.length === 12, 'twelve fields per row');
  ok(p[0] === '1' && p[3] === 'HI' && p[4] === 'DESIGNATE' && p[5] === 'UAV-04' && p[6] === '1' && p[7] === '0' && p[8] === '1' && p[9] === 'AMBER' && p[10] === '500' && p[11] === '250',
     `seq|challenge|diff|role|verb|id|designated|hiApproved|authorityLevel|result|blu|red: "${projection(a)[0]}"`);
  ok(!projection(a)[0].includes('42.18'), 'and the time is not in it');

  ok(firstDivergence(a, b) === -1, 'identical ledgers diverge nowhere');
  ok(firstDivergence(a, c) === 3, 'a ledger with one more event diverges at that row (index 3)');
  ok(firstDivergence(a, build({ diff: 5 })) === 0, 'a different DIFF diverges at row 0 — the comparison says WHERE, not just that');

  ok(fnv1a64('') === 'cbf29ce484222325', 'FNV-1a 64 of the empty string is the offset basis — the algorithm is the standard one');
}

// ── THE METRICS HE ASKED TO COMPARE ON ──────────────────────────────────────────────────────────
{
  let L = initLedger('0.050');
  const S = stamp();
  L = ev(L, 'DESIGNATE', 'UAV-01', 'AMBER', S).ledger;        L = decide(L, 'DESIGNATE', 'UAV-01', S).ledger;
  L = decide(L, 'REJECT', 'NONE', S, { reason: 'NO_RED_BOX' }).ledger;
  L = decide(L, 'HOLD', 'UAV-01', S, { reason: 'AMBER_NO_APPROVE' }).ledger;
  L = decide(L, 'APPROVE', 'UAV-01', stamp({ actor: 'Dana', hiApproved: true }), { by: 'Dana', from: 'Athena' }).ledger;
  L = decide(L, 'APPROVE', 'UAV-02', stamp({ hiApproved: true }), { by: 'Athena', from: 'Athena' }).ledger;
  L = decide(L, 'REQ', 'T07', S).ledger; L = decide(L, 'GRANT', 'T07', stamp({ actor: 'Dana' })).ledger; L = decide(L, 'REL', 'T07', S).ledger;
  L = ev(L, 'SIM-ACTION', 'UAV-01', '+250', stamp({ blu: 750, hiApproved: true })).ledger;
  const m = metricsOf(L);
  ok(m.designations === 1 && m.n === 2 && m.designationRate === 0.5, `designation rate ${m.designationRate}`);
  ok(m.hiHolds === 1, 'HI holds counted');
  ok(m.authFailures === 1, 'auth failures counted');
  ok(m.handoffs === 3, 'handoffs are REQ + GRANT + REL');
  ok(m.approvals === 2 && m.twoPersonApprovals === 1, 'two approvals, one of them by a second person — told apart');
  ok(m.rev === '0.050', 'the metrics carry the LEDGER\'s revision — never a literal, which is r.050\'s rev:0.044 defect');
  ok(m.replayHash === replayHash(L), 'and the same hash the ledger gives');
  ok(m.blu === 750 && m.red === 250, 'and the final score');
  ok(!('fps' in m), 'FPS is NOT a metric here — it is a telemetry distribution compared beside the hash, as r.043 says');

  const sc = sidecarOf(L, 2525);
  ok(sc.format === 'EXEL-2525-SIDECAR-1' && sc.seed === 2525 && sc.rev === '0.050', 'the sidecar names its format, seed and revision');
  ok(sc.decisions.length === 8 && sc.events.length === 2 && Array.isArray(sc.notes), 'and carries decisions, events and notes as first-class collections');
}

console.log(`\ndrone-decisions: ${pass} passed, ${fail} failed · DEC-0001… · t | actor | verb | id | result · FNV over r.043's projection · notes beside the stream`);
process.exit(fail ? 1 : 0);

// THE HOST SEQUENCER UNDER CONCURRENT ORIGINATORS — the proof r.128 says it lacks ("Logical-clock ordering is
// structurally deterministic; this is not a live 3v3 proof"). No rework: the deck's OWN sequencer functions are
// lifted out of the carried r.128 HTML and instantiated once per peer, each closed over its own `state`/`SID`.
// Then a host and two joiners originate events CONCURRENTLY, the host commits them, and the SEQ_COMMITs are
// delivered to each joiner in a DIFFERENT shuffled order. The claim under test is the reducer law's last word:
// every peer ends with the same committed order and the same replay hash, and a provisional event never enters
// a hash. World mutation (applyWorld) and DOM are stubbed — this is a proof about ORDER and EVIDENCE, not physics.
import fs from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const html = fs.readFileSync(new URL('../../docs/drone-2525/operator-deck/drone-2525_r.128.html', import.meta.url), 'utf8');
const lift = (name) => { const m = html.match(new RegExp(`function ${name}\\([^)]*\\)\\{[\\s\\S]*?\\n\\}`)); if (!m) throw new Error(`r.128 lacks ${name}`); return m[0]; };
const NAMES = ['fnv1a64', 'stableCanon', 'sessionOrderKey', 'sessionClockObserve', 'sessionAdoptHead', 'sessionClockNext', 'sessionCommitEvent', 'eventById', 'appendCanonicalEvent', 'replayHash'];
const src = NAMES.map(lift).join('\n');
ok(src.length > 1500, `lifted ${NAMES.length} sequencer functions from r.128 (${src.length} chars)`);

// One peer = the deck's functions closed over its own state. applyWorld / proof / DOM are stubbed.
function peer(SID) {
  const state = { clock: 0, events: [], replay: [], evSeq: 0, sync: null,
    com: { seq: 0, logical: 0, role: 'LOCAL', hostId: null, sessionSeq: 0, pendingSeq: [], committedIds: new Set(), broadcastedIds: new Set() } };
  const api = new Function('state', 'SID', 'document', 'applyWorld', 'proofObserveCanonical',
    src + `\nreturn { sessionOrderKey, sessionClockObserve, sessionAdoptHead, sessionClockNext, sessionCommitEvent, appendCanonicalEvent, replayHash, eventById };`)(
    state, SID, { getElementById: () => null }, () => {}, () => {});
  return { SID, state, ...api };
}
const mkRow = (p, verb, id = '') => {              // the deck's ev() minus DOM: a fresh local row
  p.state.evSeq += 1;
  return { eventId: `${p.SID}-E${p.state.evSeq}`, seq: p.state.evSeq, logicalClock: p.sessionClockNext(), t: 0,
    challenge: 1, diff: 3, role: 'HI', verb, id, designated: false, hiApproved: false, authorityLevel: 1, result: verb, data: null, blu: 0, red: 0, peerId: p.SID };
};
// A seeded shuffle so a "different arrival order" is reproducible and never Math.random.
const shuffled = (arr, seed) => { const a = arr.slice(); let x = seed >>> 0; for (let i = a.length - 1; i > 0; i--) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; const j = x % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ── THE RUN: host H, joiners A and B, all originating at once ───────────────────────────────────
function run(seedA, seedB, nEach = 6) {
  const H = peer('HOST1'), A = peer('PEER-A'), B = peer('PEER-B');
  H.state.com.role = 'HOST'; H.state.com.hostId = 'HOST1';
  for (const j of [A, B]) { j.state.com.role = 'JOIN'; j.state.com.hostId = 'HOST1'; }
  const commits = [];
  // Interleave originators: A, H, B, A, H, B … each provisional on its joiner, committed by the host.
  for (let k = 0; k < nEach; k++) {
    for (const p of [A, H, B]) {
      const row = mkRow(p, 'DESIGNATE', `D${k}`);
      if (p === H) { const c = H.sessionCommitEvent(row); H.appendCanonicalEvent(c); commits.push(c); }
      else {
        const prov = { ...row, sessionSeq: 0, committed: false, hostId: 'HOST1', orderKey: 'P:' + row.eventId };
        p.appendCanonicalEvent(prov);                           // provisional on the originator
        const c = H.sessionCommitEvent(row);                    // SEQ_SUBMIT → host commits
        H.appendCanonicalEvent(c); commits.push(c);
      }
    }
  }
  // SEQ_COMMIT delivery — a DIFFERENT order to each joiner.
  for (const c of shuffled(commits, seedA)) { A.appendCanonicalEvent(c); A.sessionAdoptHead(c.sessionSeq); }
  for (const c of shuffled(commits, seedB)) { B.appendCanonicalEvent(c); B.sessionAdoptHead(c.sessionSeq); }
  return { H, A, B, commits };
}

const r = run(0x2525, 0x1111);
const hH = r.H.replayHash(), hA = r.A.replayHash(), hB = r.B.replayHash();
ok(r.commits.length === 18 && new Set(r.commits.map((c) => c.sessionSeq)).size === 18, 'the host issued 18 distinct sessionSeqs for 18 concurrent events from 3 originators');
ok(hA === hH && hB === hH, `all three peers converge on ONE replay hash despite different arrival orders (${hH})`);
ok(r.A.state.events.every((e) => e.committed === true) && r.B.state.events.every((e) => e.committed === true), 'every provisional row on a joiner was replaced by its committed twin (no duplicates, none left provisional)');
ok(r.A.state.events.length === 18 && r.B.state.events.length === 18 && r.H.state.events.length === 18, 'no peer holds a duplicate or a missing event');
const order = (p) => p.state.events.filter((e) => e.committed !== false).slice().sort((a, b) => (a.orderKey < b.orderKey ? -1 : 1)).map((e) => e.sessionSeq).join(',');
ok(order(r.A) === order(r.H) && order(r.B) === order(r.H) && order(r.H) === Array.from({ length: 18 }, (_, i) => i + 1).join(','), 'committed order is the host\'s sessionSeq 1..18 on every peer, regardless of who originated or when it arrived');
ok(r.A.state.com.sessionSeq === 18 && r.B.state.com.sessionSeq === 18, 'each joiner adopted the host\'s head (sessionSeq 18)');

// A provisional event never enters the hash: hash before and after its commit differ, and it is excluded until then.
const P = peer('PEER-P'); P.state.com.role = 'JOIN'; P.state.com.hostId = 'HOST1';
const row = mkRow(P, 'APPROVE', 'X');
const before = P.replayHash();
P.appendCanonicalEvent({ ...row, sessionSeq: 0, committed: false, hostId: 'HOST1', orderKey: 'P:' + row.eventId });
ok(P.replayHash() === before, 'a provisional (uncommitted) event does NOT change the replay hash');
const H2 = peer('HOST1'); H2.state.com.role = 'HOST'; H2.state.com.hostId = 'HOST1';
P.appendCanonicalEvent(H2.sessionCommitEvent(row));
ok(P.replayHash() !== before && P.state.events.length === 1 && P.state.events[0].committed === true, 'once committed it enters the hash exactly once, replacing the provisional row');

// Determinism + the structural order rule the deck itself asserts.
const r2 = run(0x2525, 0x1111);
ok(r2.H.replayHash() === hH, 'the same run reproduces the same hash (pure — no clock, no random)');
const r3 = run(0xBEEF, 0xCAFE);
ok(r3.A.replayHash() === r3.H.replayHash() && r3.B.replayHash() === r3.H.replayHash(), 'convergence holds under a second pair of arrival orders');
ok(r.H.sessionOrderKey(7, 'A', 9) < r.H.sessionOrderKey(8, 'A', 1) && r.H.sessionOrderKey(8, 'A', 1) < r.H.sessionOrderKey(8, 'B', 1), 'orderKey = host sessionSeq → peer → local seq (the deck\'s SESSION_ORDER_STRUCT)');
ok(r.H.sessionCommitEvent(r.commits[3]) === r.H.eventById(r.commits[3].eventId) || r.H.sessionCommitEvent(r.commits[3]).sessionSeq === r.commits[3].sessionSeq, 're-committing an already-committed event returns the prior commit, never a second sessionSeq');

console.log(`\nsequencer-2525: ${pass} passed, ${fail} failed · r.128's host sequencer, lifted and driven by 3 concurrent originators → one order, one hash on every peer`);
process.exit(fail ? 1 : 0);

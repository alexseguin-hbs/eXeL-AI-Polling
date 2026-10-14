// A COMPLETED RESPONSE IS NEVER DISCARDED (operator 2026-10-14: "2525 redundancy").
//
// The twin of tests/sign-invariant.test.mjs. That gate holds "a completed signature is never discarded"; this
// one holds the same class for a participant's words. Both exist because the repo's own AAR (CLAUDE.md, FIX THE
// CLASS NEVER THE INSTANCE) found the same bug three times in one path and fixed it once, at the class.
//
// It also holds the source-level invariant that made this necessary: the three Trinity send paths must not be
// fire-and-forget. Before r.T2 every one of them ended in .catch(() => {}) or .then(() => {}, () => {}), so
// nothing — not the page, not the record, not the participant — knew whether a response had been delivered.
//
// Run: node --experimental-strip-types tests/response-outbox.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import {
  queueResponse, readOutbox, dropResponse, recordAttempt, pendingCount, pendingFor,
  describeAttempt, anyDelivered, OUTBOX_MAX, OUTBOX_KEY,
} from '../lib/response-outbox.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

/** A storage double that behaves like localStorage, including the ways it misbehaves. */
const mem = (opts = {}) => {
  const m = new Map();
  return {
    _m: m,
    getItem: (k) => (opts.readThrows ? (() => { throw new Error('blocked'); })() : (m.has(k) ? m.get(k) : null)),
    setItem: (k, v) => { if (opts.writeThrows) throw new Error('quota'); m.set(k, v); },
    removeItem: (k) => m.delete(k),
  };
};

const entry = (over = {}) => ({
  id: 'r-1', shortCode: 'ABCD1234', participantId: 'p-1',
  text: 'the hour is the unit', languageCode: 'en',
  submittedAt: '2026-10-14T20:00:00.000Z', ...over,
});

// ── the invariant itself ───────────────────────────────────────────────────────────────────────────────────
{
  const s = mem();
  ok(queueResponse(entry(), s) === true, 'a response that no path carried is kept on the device');
  const got = readOutbox(s);
  ok(got.length === 1 && got[0].text === 'the hour is the unit', 'the words survive exactly, not a summary of them');
  ok(got[0].tries === 0, 'a freshly queued response has no attempts against it yet');
}

// ── idempotence: a retry must not duplicate the participant's words ────────────────────────────────────────
{
  const s = mem();
  queueResponse(entry(), s);
  queueResponse(entry({ text: 'edited before resend' }), s);
  const got = readOutbox(s);
  ok(got.length === 1, 're-queuing the same id updates rather than duplicating (seenIds dedup happens later)');
  ok(got[0].text === 'edited before resend', 'the newest content wins on re-queue');
}

// ── the ledger line (§5): every attempt is recorded, never swallowed ───────────────────────────────────────
{
  const s = mem();
  queueResponse(entry(), s);
  recordAttempt('r-1', 'no path reached the session (tried A+B+C)', s);
  recordAttempt('r-1', 'no path reached the session (tried A+B+C)', s);
  const got = readOutbox(s)[0];
  ok(got.tries === 2, 'each attempt increments the count on the entry');
  ok(/no path reached/.test(got.lastResult), 'the last outcome is written onto the entry, not discarded');
}

// ── delivery removes it, and only delivery ─────────────────────────────────────────────────────────────────
{
  const s = mem();
  queueResponse(entry(), s);
  dropResponse('r-1', s);
  ok(pendingCount(s) === 0, 'a provably delivered response leaves the device');
  ok(dropResponse('r-nope', s) === true, 'dropping something already gone is not an error');
}

// ── storage that is unreachable or hostile must degrade, never throw ───────────────────────────────────────
{
  ok(readOutbox(null) instanceof Array, 'no storage reads as an empty outbox rather than throwing');
  const ro = mem({ readThrows: true });
  ok(readOutbox(ro).length === 0, 'a storage that throws on read reads as empty');
  const wo = mem({ writeThrows: true });
  ok(queueResponse(entry(), wo) === false, 'a storage that cannot hold the response SAYS SO (returns false)');
}

// ── the cap is honest: full means full, it does not silently drop the oldest work ──────────────────────────
{
  const s = mem();
  for (let i = 0; i < OUTBOX_MAX; i++) queueResponse(entry({ id: `r-${i}` }), s);
  ok(pendingCount(s) === OUTBOX_MAX, `the outbox holds its declared maximum (${OUTBOX_MAX})`);
  ok(queueResponse(entry({ id: 'r-overflow' }), s) === false, 'past the cap the queue REFUSES rather than evicting someone else\'s words');
  ok(readOutbox(s).find((e) => e.id === 'r-0'), 'the oldest entry is still there — nothing was silently evicted');
}

// ── per-session view ───────────────────────────────────────────────────────────────────────────────────────
{
  const s = mem();
  queueResponse(entry({ id: 'a', shortCode: 'S1' }), s);
  queueResponse(entry({ id: 'b', shortCode: 'S2' }), s);
  queueResponse(entry({ id: 'c', shortCode: 'S1' }), s);
  ok(pendingFor('S1', s).map((e) => e.id).join(',') === 'a,c', 'one session sees only its own, in the order written');
}

// ── the definition of delivered ────────────────────────────────────────────────────────────────────────────
{
  ok(anyDelivered({ A: false, B: true, C: false }) === true, 'ONE path succeeding is delivered — the Trinity rule');
  ok(anyDelivered({ A: false, B: false, C: false }) === false, 'no path succeeding is NOT delivered');
  ok(describeAttempt({ A: false, B: false, C: false }) === 'no path reached the session (tried A+B+C)', 'total failure is described plainly');
  ok(describeAttempt({ A: true, B: true, C: true }) === 'delivered via A+B+C', 'full delivery is described');
  ok(describeAttempt({ A: true, B: false, C: false }) === 'delivered via A; B+C failed', 'partial delivery names what failed (§6: publish the lateness WITH its cause)');
}

// ── SOURCE INVARIANT: the send paths are no longer fire-and-forget ─────────────────────────────────────────
// This is the half a unit test cannot reach. It is the reason the outbox exists at all.
{
  const sv = fs.readFileSync(path.join(process.cwd(), 'components/session-view.tsx'), 'utf8');
  const sendBlock = sv.slice(sv.indexOf('// Path A — Supabase Broadcast'), sv.indexOf('// Track sim user submission'));
  ok(sendBlock.length > 400, 'the three-path send block was located (if this fails the anchors moved, not the rule)');
  ok(!/\.catch\(\(\) => \{\}\)/.test(sendBlock), 'NO path swallows its outcome with .catch(() => {}) — §5, nothing is swallowed');
  ok(!/\.then\(\(\) => \{\}, \(\) => \{\}\)/.test(sendBlock), 'NO path swallows its outcome with .then(noop, noop)');
  ok(/allSettled|PATH_RESULTS|deliveryResults/.test(sendBlock), 'the three paths are awaited together so the page knows whether ANY carried it');
  ok(/queueResponse|outbox/i.test(sv), 'a response that no path carried is handed to the device outbox');
}

// ── T3 SOURCE INVARIANT: a reload does not lose the session ────────────────────────────────────────────────
// feedResponses is React state only and no channel replays history, so Channel D's cursor decides whether a
// moderator who reloads mid-session sees the conversation or an empty screen. It used to start at `now`.
{
  const dash = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/page.tsx'), 'utf8');
  const poll = dash.slice(dash.indexOf('// Channel D'), dash.indexOf('// Channel C'));
  ok(poll.length > 300, 'the Channel D poll block was located');
  ok(!/let lastPollTime = new Date\(\)\.toISOString\(\);/.test(poll),
     'Channel D does NOT start its cursor at now — that loses every response already given when a tab reloads');
  ok(/lastPollTime = sessionRef\.current\?\.created_at \?\? new Date\(\)\.toISOString\(\)/.test(poll),
     "Channel D seeds its cursor from the session's own start, falling back to now (never worse than before)");
  ok(/seenIds/.test(dash), 'the backfill is safe because the dashboard de-duplicates through seenIds');
}

console.log(`\nresponse-outbox: ${pass} passed, ${fail} failed · a completed response is never discarded`);
process.exit(fail ? 1 : 0);

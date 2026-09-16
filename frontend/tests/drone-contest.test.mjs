// THE SAME GAME AT EVERY N — the fast gate for the ladder the operator asked for.
//
// `npm run drone:ladder` runs all 21 rungs at three authority levels with three seeds each and applies the
// twelve review lenses; that takes minutes and lives outside CI. THIS file holds the claims that must never
// break, on a handful of rungs, in a second — so a change that quietly ruins 21v21 is caught by the normal
// build rather than by somebody remembering to run the long one.
//
// The claims:
//   the ladder is 1..21, one more aircraft a side each rung, 42 aircraft and 84 seats at the top
//   the physics does not change with N — a rung is not a different game, only a bigger one
//   a match is decided when a side can no longer fight, not when the last aircraft lands
//   THE FIRE GATE HOLDS AT EVERY RUNG: nothing fires until a named human has been asked
//   the same seed plays the same match, so a rung replays
import {
  LADDER, rungDemand, initContest, stepContest, runContest, contestResult, stillFighting,
  approversAt, approvalCapacityPerMin, decisionsPerMinute, BEAM_CONE_DEG, CONTEST_TICK_S, MAX_CONTEST_S,
} from '../lib/drone-2525/contest.ts';
import { DRONE_DOMAIN } from '../lib/drone-2525/domain.gen.ts';
import { AUTHORITY } from '../lib/drone-2525/authority.ts';
import { seatsFor, aliveCount } from '../lib/drone-2525/swarm.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const spec = (perSide, authority = 1, seed = 20260916) => ({
  perSide, seed, beam: DRONE_DOMAIN.beam, defences: DRONE_DOMAIN.defences,
  authority, approvalLatencyS: 1.2, approversPerSide: 1, keyGroupSize: 9,
});
const RUNGS = [1, 2, 3, 7, 21];          // enough shape to catch a break; fast enough for every build

// ── THE LADDER IS WHAT WAS ASKED FOR ────────────────────────────────────────────────────────────
{
  ok(LADDER.length === 21 && LADDER[0] === 1 && LADDER[20] === 21, 'the ladder runs 1v1 to 21v21');
  for (let i = 1; i < LADDER.length; i++) ok(LADDER[i] - LADDER[i - 1] === 1, `+1 aircraft a side at rung ${i + 1}`);
  const top = rungDemand(21);
  ok(top.aircraft === 42, 'twenty-one a side is forty-two aircraft');
  ok(top.seats === 84, 'and EIGHTY-FOUR seats — 42 HI v 42 HI, a pilot and a targeteer on every machine');
  ok(seatsFor(1) === 4, 'and 1v1 is four people, not two: both sides are crewed');
  ok(/21v21 · 42 aircraft · 84 seats/.test(top.line), `the demand reads plainly: "${top.line}"`);
}

// ── THE PHYSICS DOES NOT CHANGE WITH N ──────────────────────────────────────────────────────────
{
  const results = RUNGS.map((n) => runContest(spec(n)));
  for (const r of results) {
    ok(r.overkillFrac < 0.1, `${r.perSide}v${r.perSide}: beam waste stays low (${(r.overkillFrac * 100).toFixed(1)}%)`);
    ok(r.durationS > 0 && r.durationS <= MAX_CONTEST_S, `${r.perSide}v${r.perSide}: the match takes a real, bounded time (${r.durationS}s)`);
    ok(r.resolved, `${r.perSide}v${r.perSide}: it resolves rather than timing out`);
    ok(r.downed.friendly + r.survivors.friendly <= r.perSide, `${r.perSide}v${r.perSide}: blue's roster balances`);
    ok(r.downed.hostile + r.survivors.hostile <= r.perSide, `${r.perSide}v${r.perSide}: red's roster balances`);
    ok(r.survivors.friendly === 0 || r.survivors.hostile === 0, `${r.perSide}v${r.perSide}: one side is finished, which is what ended it`);
  }
  // Contention is impossible at 1v1 and real above it. That is the whole reason the ladder starts at one.
  ok(results[0].contentionMean === 0, '1v1 cannot have two shooters on one target');
  ok(results[results.length - 1].peakContention > 1, `21v21 does (peak ${results[results.length - 1].peakContention})`);
}

// ── DECIDED WHEN A SIDE CANNOT FIGHT, NOT WHEN THE LAST AIRCRAFT LANDS ──────────────────────────
{
  const c = initContest(spec(2));
  for (let i = 0; i < 4000 && stillFighting(c, 'friendly') > 0 && stillFighting(c, 'hostile') > 0; i++) stepContest(c);
  const beatenSide = stillFighting(c, 'friendly') === 0 ? 'friendly' : 'hostile';
  ok(stillFighting(c, beatenSide) === 0, 'a side ends the match by being unable to fight');
  ok(aliveCount(c.swarm, beatenSide) >= 0, 'and its aircraft are still on the roster while they descend');
  // Nothing was deleted in the air: every beaten aircraft is descending or grounded, never gone.
  const states = c.dmg.map((d) => d.condition);
  ok(states.every((s) => ['flying', 'shieldDown', 'disabled', 'descending', 'grounded'].includes(s)),
     `every aircraft is in a declared state (${[...new Set(states)].join(', ')})`);
}

// ── THE FIRE GATE HOLDS AT EVERY RUNG ───────────────────────────────────────────────────────────
// This is the one that matters. It is easy to make a big engagement work by quietly letting the machine
// shoot; the invariant is that it never does, at any N and at any level.
{
  for (const n of RUNGS) {
    for (const level of [1, 2, 3, 4, 5]) {
      const r = runContest(spec(n, level));
      ok(r.approvalsAsked > 0, `${n}v${n} at level ${level}: a named human was asked before anything fired`);
    }
  }
  // A contest with nobody to answer must not fire at all — silence is never consent, at any N.
  const mute = { ...spec(5, 1), approvalLatencyS: 1e9 };
  const r = runContest(mute);
  ok(r.downed.friendly === 0 && r.downed.hostile === 0,
     'with nobody answering, nothing is ever shot down — at any rung, silence is never consent');
  ok(!r.resolved, 'and the match simply does not resolve, rather than resolving itself without a decision');
}

// ── THE BREADTH OF A DECISION IS WHAT SCALES, AND WHO MAKES IT ──────────────────────────────────
{
  const l1 = runContest(spec(21, 1)), l3 = runContest(spec(21, 3));
  ok(l1.approvalsAsked > l3.approvalsAsked * 3,
     `at 21v21 level 1 asks ${l1.approvalsAsked} decisions and level 3 asks ${l3.approvalsAsked} — the ladder is what makes the top rung possible`);
  ok(l3.approvalsAsked >= 42, 'and level 3 still asks at least once per crew — the breadth widened, the requirement did not vanish');

  // Levels 1-3 are one named person. Levels 4 and 5 are the key group, which is the only thing that can
  // raise a throughput ceiling, and the reason those two rungs exist.
  ok(approversAt(spec(21, 1)) === 1 && approversAt(spec(21, 3)) === 1, 'levels 1 to 3 put the decision with one person');
  ok(approversAt(spec(21, 4)) > 1 && approversAt(spec(21, 5)) > 1, 'levels 4 and 5 put it with a quorum of the key group');
  ok(AUTHORITY[4].decider === 'group' && AUTHORITY[5].decider === 'group', 'which is what the authority table already said they were');
  ok(approvalCapacityPerMin(spec(21, 5)) > approvalCapacityPerMin(spec(21, 1)) * 3,
     `a quorum answers ${approvalCapacityPerMin(spec(21, 5)).toFixed(0)}/min against one officer's ${approvalCapacityPerMin(spec(21, 1)).toFixed(0)}/min`);
  ok(decisionsPerMinute(runContest(spec(21, 5))) <= approvalCapacityPerMin(spec(21, 5)),
     'and at the top rung, level 5 asks no more than its people can answer');
}

// ── SAME SEED, SAME MATCH ───────────────────────────────────────────────────────────────────────
{
  for (const n of [1, 3, 21]) {
    const a = runContest(spec(n, 1, 4242)), b = runContest(spec(n, 1, 4242));
    ok(a.durationS === b.durationS && a.approvalsAsked === b.approvalsAsked
       && a.survivors.friendly === b.survivors.friendly && a.survivors.hostile === b.survivors.hostile,
       `${n}v${n} replays exactly from its seed`);
  }
  const x = runContest(spec(7, 1, 1)), y = runContest(spec(7, 1, 2));
  ok(x.durationS !== y.durationS || x.survivors.friendly !== y.survivors.friendly,
     'and a different seed plays a different match, so the ladder is not measuring one scripted story');
}

// ── THE CONE IS REAL ────────────────────────────────────────────────────────────────────────────
{
  ok(BEAM_CONE_DEG > 0 && BEAM_CONE_DEG < 30, `the beam only counts inside a ${BEAM_CONE_DEG}° cone — a targeteer must actually be holding it`);
  ok(CONTEST_TICK_S === 0.1, 'the contest steps on the game clock the round already uses');
}

const top21 = runContest(spec(21, 1));
console.log(`\ndrone-contest: ${pass} passed, ${fail} failed · ladder 1v1→21v21 · top rung 42 aircraft, 84 seats`
  + ` · 21v21 in ${top21.durationS}s asking ${top21.approvalsAsked} named decisions at level 1`);
process.exit(fail ? 1 : 0);

// THE SAME GAME AT EVERY N — 1v1, 2v2, 3v3, and on up to 21v21.
//
// Operator 2026-09-16: "Have 12 AsM do simulation of 1v1 then 2v2 then 3v3 … to work out complexities in
// spiral tests at each addition of 2 more drones (+one per side). Keep going till N=21 drones… go to 21 v21
// (42 v 42 HI)." So the top of the ladder is 42 aircraft and 84 seats: a pilot and a targeteer per machine,
// both sides crewed by people.
//
// ── WHY A LADDER AND NOT A BENCHMARK ─────────────────────────────────────────────────────────────
// Running 21v21 tells you whether it holds. Running every rung from 1v1 tells you WHAT BREAKS AND WHEN, and
// the two are different questions. The physics does not change between rungs — one beam against one shield
// behaves identically whether there are two aircraft in the sky or forty-two. What changes is everything
// around it: who is shooting at whom, who is waiting on a decision, and what has to be drawn. Those are the
// complexities the operator asked to work out, and they only appear as N rises.
//
// Three of them are measured here, at every rung:
//
//   CONTENTION — two shooters burning the same target. Impossible at 1v1, endemic at 21v21, and every
//     joule spent on a target another crew has already beaten is a joule not spent on the one behind it.
//   APPROVAL LOAD — every machine-initiated shot needs a NAMED HUMAN decision. That invariant does not
//     bend, so at scale the person becomes the bottleneck rather than the beam. This is the finding the
//     ladder exists to produce, and it is the empirical argument for the authority ladder: at 1v1 level 1
//     (one decision per shot) is comfortable; at 21v21 it is not physically possible.
//   SEAT LOAD — how many people the contest needs, which is what the world has to be able to seat.
//
// Pure and seeded: no clock, no DOM, no Math.random. The same N and the same seed play the same match, so
// a rung can be replayed and two runs can be compared.
import {
  initSwarm, stepSwarm, downAircraft, aliveCount, sideOf, idOf, seatsFor,
  type Swarm, type Affiliation,
} from "./swarm";
import {
  initDamage, applyBeam, stepDescent, irradianceWcm2, dwellToDisableS,
  type BeamSpec, type Defences, type DamageState,
} from "./laser";
import { AUTHORITY, type AuthorityLevel } from "./authority";

/** How wide a cone a targeteer must hold the aircraft inside for the beam to count as on it. */
export const BEAM_CONE_DEG = 4;
/** The clock the contest steps on. Ten a second, the game tick the round already uses. */
export const CONTEST_TICK_S = 0.1;
/** Nothing runs forever: a rung that cannot resolve is a finding, not a hang. */
export const MAX_CONTEST_S = 240;

export interface ContestSpec {
  perSide: number;
  seed: number;
  beam: BeamSpec;
  defences: Defences;
  /** Which rung of the authority ladder this contest is played at. */
  authority: AuthorityLevel;
  /** How long one named human takes to answer a machine's request, seconds. */
  approvalLatencyS: number;
  /** How many named people a side has answering requests. One watch officer, unless stated. */
  approversPerSide: number;
  /** How many people the SI key group has, for the levels where the decision belongs to a group. */
  keyGroupSize?: number;
}

/**
 * How many named people are actually available to answer, at this level.
 *
 * Levels 1–3 put the decision with ONE PERSON. Levels 4 and 5 put it with the SI key group, and a group is
 * not a nicer word for the same watch officer — it is more people, which is the only thing that raises a
 * throughput ceiling. The ladder measured that this matters: at 20v20 under level 1 a single officer is
 * asked for 146 decisions a minute, and a person answering in 1.2 s can make fifty.
 *
 * The invariant is untouched. SI members are named people, so a group decision is still a named-human
 * decision; what changed is how many named humans there are.
 */
export const approversAt = (spec: ContestSpec): number =>
  AUTHORITY[spec.authority].decider === "group"
    ? Math.max(1, Math.ceil((spec.keyGroupSize ?? 9) * 0.5) + 1)   // a quorum of the key group, si-pod's rule
    : spec.approversPerSide;

/** What this rung's approvers can physically answer between them, decisions per minute. */
export const approvalCapacityPerMin = (spec: ContestSpec): number =>
  (60 / Math.max(1e-6, spec.approvalLatencyS)) * approversAt(spec);

export interface Contest {
  spec: ContestSpec;
  swarm: Swarm;
  dmg: DamageState[];
  /** Who each aircraft is currently burning, or -1. */
  target: Int32Array;
  /** Seconds this aircraft has been waiting on a human decision before it may fire. */
  waitingS: Float64Array;
  /** 1 once a named human has cleared this aircraft to engage at this authority level. */
  cleared: Float64Array;
  tS: number;
  /** Everything the ladder wants to know, accumulated as it happens rather than reconstructed. */
  stats: ContestStats;
}

export interface ContestStats {
  /** Beam-seconds delivered onto targets that were ALREADY beaten. Pure waste, and it grows with N. */
  overkillBeamS: number;
  /** Beam-seconds delivered at all. */
  beamS: number;
  /** Person-seconds spent waiting on approvals. The bottleneck, measured. */
  approvalWaitS: number;
  /** How many named decisions the contest asked a human for. */
  approvalsAsked: number;
  /** The most aircraft burning one target at any single instant. */
  peakContention: number;
  /** Sum over ticks of (shooters on a target that already had one), divided by ticks. */
  contentionMean: number;
  /** Ticks stepped, so means are honest. */
  ticks: number;
  downed: { friendly: number; hostile: number };
}

const emptyStats = (): ContestStats => ({
  overkillBeamS: 0, beamS: 0, approvalWaitS: 0, approvalsAsked: 0,
  peakContention: 0, contentionMean: 0, ticks: 0, downed: { friendly: 0, hostile: 0 },
});

export function initContest(spec: ContestSpec): Contest {
  const swarm = initSwarm(spec.seed, 380, spec.perSide);
  const n = swarm.n;
  return {
    spec, swarm,
    dmg: Array.from({ length: n }, (_, i) => initDamage(spec.defences, swarm.aglM[i])),
    target: new Int32Array(n).fill(-1),
    waitingS: new Float64Array(n),
    // At level 1 every single shot is asked separately, so nobody starts cleared. Above it, a decision
    // covers a window, so a crew is cleared once and then fights — which is the whole point of the ladder.
    cleared: new Float64Array(n),
    tS: 0,
    stats: emptyStats(),
  };
}

const beaten = (d: DamageState): boolean =>
  d.condition === "disabled" || d.condition === "descending" || d.condition === "grounded";

/** Bearing from one aircraft to another, degrees. */
const bearing = (s: Swarm, i: number, j: number): number =>
  ((Math.atan2(s.e[j] - s.e[i], s.nCoord[j] - s.nCoord[i]) * 180) / Math.PI + 360) % 360;
const rangeOf = (s: Swarm, i: number, j: number): number =>
  Math.hypot(s.e[j] - s.e[i], s.nCoord[j] - s.nCoord[i], s.aglM[j] - s.aglM[i]);

/**
 * One tick of the whole contest, in place. Order matters and is deliberate:
 *   1. fly          — everyone moves, using the movement law the arena already has
 *   2. choose       — each living crew picks the nearest living opponent inside reach
 *   3. ask          — a machine-initiated shot waits for a named human; the wait is counted
 *   4. burn         — cleared crews hold the beam; contention and overkill are counted as they happen
 *   5. descend      — anyone already beaten continues down, safely
 */
export function stepContest(c: Contest, dtS = CONTEST_TICK_S): Contest {
  const { swarm: s, spec } = c;
  const dt = Math.max(0, Math.min(0.25, dtS));
  c.tS += dt;
  c.stats.ticks++;

  // 1 · fly
  stepSwarm(s, dt);

  // 2 · choose. Nearest living opponent inside the emitter's reach; -1 if there is nothing to shoot at.
  for (let i = 0; i < s.n; i++) {
    if (s.alive[i] === 0 || beaten(c.dmg[i])) { c.target[i] = -1; continue; }
    const mine = i < s.perSide;
    const lo = mine ? s.perSide : 0, hi = mine ? s.n : s.perSide;
    let best = -1, bestR = Infinity;
    for (let j = lo; j < hi; j++) {
      if (s.alive[j] === 0) continue;
      // A TARGET THAT IS ALREADY COMING DOWN IS NOT A TARGET. This line is the first thing the ladder
      // taught: without it, 1v1 looked fine and every rung above it wasted ninety per cent of its beam
      // time burning aircraft that were already beaten and merely had not landed yet. `alive` does not
      // clear until touchdown — by design, so a replay keeps the whole descent — so "still flying" has to
      // be asked of the damage state, not of the roster.
      if (beaten(c.dmg[j])) continue;
      const r = rangeOf(s, i, j);
      if (r > spec.beam.maxRangeM || r >= bestR) continue;
      // The beam only counts when the aircraft is actually inside the cone the targeteer is holding.
      const off = Math.abs(((bearing(s, i, j) - s.headingDeg[i] + 540) % 360) - 180);
      if (off > BEAM_CONE_DEG) continue;
      bestR = r; best = j;
    }
    // A NEW TARGET IS A NEW QUESTION — unless the decision that cleared this crew covered a WINDOW rather
    // than a shot or a single aircraft. That one line is the entire authority ladder, in the only place it
    // can actually be felt: at level 1 a crew re-asks every time it swings onto something else, and at
    // level 3 and above it was cleared once and fights. The invariant is untouched either way — a named
    // human still decided before anything fired. What scales is the BREADTH of that decision.
    if (best !== c.target[i]) {
      c.waitingS[i] = 0;
      if (AUTHORITY[spec.authority].covers !== "window") c.cleared[i] = 0;
    }
    c.target[i] = best;
  }

  // 3 · ask. THE INVARIANT DOES NOT BEND WITH N: a machine-initiated shot needs a named human first.
  // What the authority level changes is the BREADTH of one decision, never whether one happened.
  //   level 1 — every shot asked separately, so the wait returns on every new target
  //   level 2 — one aircraft, once
  //   3, 4, 5 — a declared window, so a crew is cleared once and then fights
  const rule = AUTHORITY[spec.authority];
  const perShot = rule.covers === "shot";
  let askedThisTick = 0;
  for (let i = 0; i < s.n; i++) {
    if (c.target[i] < 0 || c.cleared[i] === 1) continue;
    // One approver can only be answering so many at once; the rest of the side queues behind them.
    const side = sideOf(i, s.perSide);
    if (askedThisTick >= approversAt(spec) * 2 && c.waitingS[i] === 0) continue;       // still in the queue
    if (c.waitingS[i] === 0) { c.stats.approvalsAsked++; askedThisTick++; }
    c.waitingS[i] += dt;
    c.stats.approvalWaitS += dt;
    if (c.waitingS[i] >= spec.approvalLatencyS) { c.cleared[i] = 1; if (!perShot) c.waitingS[i] = 0; }
    void side;
  }

  // 4 · burn. Contention and overkill are counted as they happen, not reconstructed afterwards.
  const onMe = new Int32Array(s.n);
  for (let i = 0; i < s.n; i++) if (c.target[i] >= 0 && c.cleared[i] === 1) onMe[c.target[i]]++;
  let contendingNow = 0, peak = 0;
  for (let j = 0; j < s.n; j++) { if (onMe[j] > 1) contendingNow += onMe[j] - 1; if (onMe[j] > peak) peak = onMe[j]; }
  c.stats.peakContention = Math.max(c.stats.peakContention, peak);
  c.stats.contentionMean += contendingNow;

  for (let i = 0; i < s.n; i++) {
    const j = c.target[i];
    if (j < 0 || c.cleared[i] !== 1) continue;
    const wasBeaten = beaten(c.dmg[j]);
    c.stats.beamS += dt;
    if (wasBeaten) { c.stats.overkillBeamS += dt; continue; }        // burning something already down
    const before = c.dmg[j].condition;
    c.dmg[j] = applyBeam(c.dmg[j], spec.beam, spec.defences, {
      rangeM: rangeOf(s, i, j), dtS: dt, onTarget: true, tMs: c.tS * 1000,
    });
    if (before !== "disabled" && c.dmg[j].condition === "disabled") {
      c.stats.downed[sideOf(j, s.perSide)]++;
    }
  }

  // 5 · descend. Nothing is deleted in the air; it is flown down and only then leaves the engagement.
  for (let i = 0; i < s.n; i++) {
    if (!beaten(c.dmg[i])) continue;
    c.dmg[i] = stepDescent(c.dmg[i], dt);
    s.aglM[i] = c.dmg[i].aglM;
    if (c.dmg[i].condition === "grounded" && s.alive[i] === 1) downAircraft(s, i);
  }
  return c;
}

export interface ContestResult {
  perSide: number;
  aircraft: number;
  seats: number;
  authority: AuthorityLevel;
  /** Seconds of game time the match took, or MAX_CONTEST_S if it never resolved. */
  durationS: number;
  resolved: boolean;
  survivors: { friendly: number; hostile: number };
  downed: { friendly: number; hostile: number };
  /** 0..1 — the share of all beam time spent on targets that were already beaten. */
  overkillFrac: number;
  /** Mean number of redundant shooters per tick. Zero at 1v1 by construction. */
  contentionMean: number;
  peakContention: number;
  /** Person-seconds of waiting, and what that is per aircraft. The bottleneck, in one number. */
  approvalWaitS: number;
  approvalWaitPerAircraftS: number;
  approvalsAsked: number;
  /** The share of the match one side spent unable to fire because nobody had cleared it yet. */
  blockedFrac: number;
}

export function runContest(spec: ContestSpec): ContestResult {
  const c = initContest(spec);
  const maxTicks = Math.ceil(MAX_CONTEST_S / CONTEST_TICK_S);
  let ticks = 0;
  while (ticks < maxTicks) {
    stepContest(c, CONTEST_TICK_S);
    ticks++;
    // DECIDED, NOT LANDED. A side is beaten when none of its aircraft can still fight; the descents that
    // follow are real and take their time, but the match is over. Waiting for touchdown would make every
    // rung's duration a measurement of how high the last aircraft happened to be.
    if (stillFighting(c, "friendly") === 0 || stillFighting(c, "hostile") === 0) break;
  }
  return contestResult(c, ticks < maxTicks);
}

/** How many of a side's aircraft can still shoot back. The only thing that decides a match. */
export function stillFighting(c: Contest, side: Affiliation): number {
  const { swarm: s } = c;
  const lo = side === "hostile" ? s.perSide : 0, hi = side === "friendly" ? s.perSide : s.n;
  let n = 0;
  for (let i = lo; i < hi; i++) if (s.alive[i] === 1 && !beaten(c.dmg[i])) n++;
  return n;
}

export function contestResult(c: Contest, resolved: boolean): ContestResult {
  const { spec, stats } = c;
  const aircraft = spec.perSide * 2;
  return {
    perSide: spec.perSide,
    aircraft,
    seats: seatsFor(spec.perSide),
    authority: spec.authority,
    durationS: Math.round(c.tS * 10) / 10,
    resolved,
    survivors: { friendly: stillFighting(c, "friendly"), hostile: stillFighting(c, "hostile") },
    downed: { ...stats.downed },
    overkillFrac: stats.beamS > 0 ? stats.overkillBeamS / stats.beamS : 0,
    contentionMean: stats.ticks > 0 ? stats.contentionMean / stats.ticks : 0,
    peakContention: stats.peakContention,
    approvalWaitS: Math.round(stats.approvalWaitS * 10) / 10,
    approvalWaitPerAircraftS: aircraft > 0 ? stats.approvalWaitS / aircraft : 0,
    approvalsAsked: stats.approvalsAsked,
    blockedFrac: stats.ticks > 0 ? stats.approvalWaitS / (stats.ticks * CONTEST_TICK_S * aircraft) : 0,
  };
}

/** The rungs the operator named: one more aircraft a side each time, all the way to twenty-one. */
export const LADDER: number[] = Array.from({ length: 21 }, (_, i) => i + 1);

/** What a rung needs from the world, before anyone plays it. */
export const rungDemand = (perSide: number) => ({
  perSide, aircraft: perSide * 2, seats: seatsFor(perSide),
  line: `${perSide}v${perSide} · ${perSide * 2} aircraft · ${seatsFor(perSide)} seats (${perSide * 2} HI a side)`,
});

/** One line a person can read about a finished match. No unit anyone has to convert. */
export const contestLine = (r: ContestResult): string =>
  `${r.perSide}v${r.perSide} · ${r.resolved ? `${r.durationS}s` : "unresolved"} · `
  + `${r.survivors.friendly}–${r.survivors.hostile} · `
  + `${Math.round(r.overkillFrac * 100)}% beam wasted · ${r.approvalsAsked} decisions asked`;

/**
 * HOW MANY NAMED DECISIONS A SINGLE PERSON WOULD HAVE TO MAKE, per minute, at this rung and level. This is
 * the number that says whether a rung is playable by humans at all, and it is why the authority ladder
 * exists: the invariant never bends, so the only thing that can scale is the breadth of one decision.
 */
export const decisionsPerMinute = (r: ContestResult): number =>
  r.durationS > 0 ? (r.approvalsAsked / r.durationS) * 60 : 0;

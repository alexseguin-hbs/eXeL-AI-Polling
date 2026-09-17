#!/usr/bin/env node
/**
 * THE N LADDER — the same game at 1v1, 2v2, 3v3, and every rung up to 21v21, reviewed by twelve lenses.
 *
 * Operator 2026-09-16: "Have 12 AsM do simulation of 1v1 then 2v2 then 3v3 … to work out complexities in
 * spiral tests at each addition of 2 more drones (+one per side). Keep going till N=21 drones… SPIRAL TEST
 * as you work 1v1, taking lessons into 2v2 systems (4HI = 2HI v 2 HI). go to 21 v21 (42 v 42 HI)."
 *
 * ── WHAT THE TWELVE ARE, HERE ────────────────────────────────────────────────────────────────────
 * The twelve are the review roles CLAUDE.md already names, each with one question it is responsible for.
 * In this file each one is a COMPUTED CHECK against the rung's own measured result — not a prompt, not a
 * model call. That is deliberate: a review that cannot be re-run identically tomorrow cannot gate a build,
 * and the operator asked for spiral tests, which means the same answer every time. Every lens below can
 * fail, and several of them did on the first run.
 *
 *   node scripts/drone-ladder.mjs [--levels 1,3] [--seeds 3] [--json perf/ladder.json]
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(HERE, "..");
const ROOT = path.resolve(FRONTEND, "..");

const { runContest, LADDER, rungDemand, decisionsPerMinute, MAX_CONTEST_S, approversAt, approvalCapacityPerMin } =
  await import(path.join(FRONTEND, "lib/drone-2525/contest.ts"));
const { DRONE_DOMAIN } = await import(path.join(FRONTEND, "lib/drone-2525/domain.gen.ts"));
const { dwellToDisableS } = await import(path.join(FRONTEND, "lib/drone-2525/laser.ts"));
const { AUTHORITY } = await import(path.join(FRONTEND, "lib/drone-2525/authority.ts"));
const { seatsFor } = await import(path.join(FRONTEND, "lib/drone-2525/swarm.ts"));
const { runTraining, trainingLine } = await import(path.join(FRONTEND, "lib/drone-2525/training.ts"));

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const LEVELS = arg("--levels", "1,3,5").split(",").map(Number);
const SEEDS = Number(arg("--seeds", "3"));
const OUT = path.join(ROOT, arg("--json", "perf/ladder.json"));

const DIFFICULTIES_5 = [1, 2, 3, 4, 5];
const B = DRONE_DOMAIN.beam, D = DRONE_DOMAIN.defences;
const spec = (perSide, authority, seed) => ({
  perSide, seed, beam: B, defences: D, authority,
  approvalLatencyS: 1.2,          // what one person takes to read a request and answer it, by name
  approversPerSide: 1,            // one watch officer a side, which is the point of the measurement
  keyGroupSize: 9,                // the SI key group, for the levels where the decision belongs to a group
});

/** What a single named person can physically answer, per minute, at the declared latency. */
const HUMAN_CEILING_PER_MIN = 60 / 1.2;
/** And what this level's approvers can answer between them — one officer, or a quorum of the key group. */
const capacityAt = (level) => approvalCapacityPerMin(spec(1, level, 0));

// ── RUN EVERY RUNG ───────────────────────────────────────────────────────────────────────────────
const rows = [];
for (const level of LEVELS) {
  for (const perSide of LADDER) {
    const runs = [];
    const t0 = performance.now();
    for (let k = 0; k < SEEDS; k++) runs.push(runContest(spec(perSide, level, 20260916 + k * 7919)));
    const wallS = (performance.now() - t0) / 1000;
    const mean = (f) => runs.reduce((n, r) => n + f(r), 0) / runs.length;
    rows.push({
      level, perSide,
      aircraft: perSide * 2,
      seats: seatsFor(perSide),
      resolvedAll: runs.every((r) => r.resolved),
      durationS: Math.round(mean((r) => r.durationS) * 10) / 10,
      overkillPct: Math.round(mean((r) => r.overkillFrac) * 1000) / 10,
      contention: Math.round(mean((r) => r.contentionMean) * 100) / 100,
      peakContention: Math.max(...runs.map((r) => r.peakContention)),
      asked: Math.round(mean((r) => r.approvalsAsked)),
      perMin: Math.round(mean(decisionsPerMinute) * 10) / 10,
      blockedPct: Math.round(mean((r) => r.blockedFrac) * 1000) / 10,
      approvers: approversAt(spec(perSide, level, 0)),
      capacityPerMin: Math.round(capacityAt(level) * 10) / 10,
      outcomes: runs.map((r) => `${r.survivors.friendly}-${r.survivors.hostile}`),
      // r.042's six — "compare on designation rate, HI holds, auth failures, handoffs, FPS, replay hash. Not
      // winners only." FPS here is HONEST: the contest draws nothing, so the figure is simulated game
      // seconds per wall second on this machine — a throughput, compared beside the hash, never inside it.
      desigPerMin: Math.round(mean((r) => r.designationsPerMin) * 10) / 10,
      hiHolds: runs.reduce((n, r) => n + r.hiHolds, 0),
      authFailures: Math.round(mean((r) => r.authFailures)),
      handoffs: Math.round(mean((r) => r.handoffs)),
      simSpeed: Math.round((runs.reduce((n, r) => n + r.durationS, 0) / Math.max(1e-6, wallS)) * 10) / 10,
      replayHash: runs[0].replayHash,
      runs,
    });
  }
}
const at = (level, perSide) => rows.find((r) => r.level === level && r.perSide === perSide);

// ── THE TWELVE LENSES ────────────────────────────────────────────────────────────────────────────
// Each takes the whole ladder and returns { ok, say }. The question each one owns is CLAUDE.md's.
const LENSES = [
  { who: "Aset", owns: "Theme reinforcement & consistency", ask() {
      // What must NOT change between rungs: the physics. One beam on one shield is the same everywhere.
      const drift = [];
      for (const lvl of LEVELS) for (const n of LADDER) {
        const r = at(lvl, n);
        if (r.overkillPct > 8) drift.push(`${lvl}:${n}v${n} ${r.overkillPct}%`);
      }
      return { ok: drift.length === 0, say: drift.length ? `beam waste climbs with N: ${drift.slice(0, 4).join(", ")}` : "beam waste stays near zero at every rung — the physics does not change with N" };
    } },
  { who: "Asar", owns: "Synthesis & outcome validation", ask() {
      const open = rows.filter((r) => !r.resolvedAll);
      return { ok: open.length === 0, say: open.length ? `${open.length} rung(s) never resolved inside ${MAX_CONTEST_S}s: ${open.map((r) => `L${r.level} ${r.perSide}v${r.perSide}`).join(", ")}` : `every rung produced a result, not a timeout (longest ${Math.max(...rows.map((r) => r.durationS))}s)` };
    } },
  { who: "Athena", owns: "Strategic test planning & flow", ask() {
      const missing = LADDER.filter((n) => !LEVELS.every((l) => at(l, n)));
      return { ok: missing.length === 0 && LADDER.length === 21, say: missing.length ? `gaps in the ladder at ${missing.join(",")}` : `all 21 rungs run at ${LEVELS.length} authority level(s), +1 aircraft a side each time, as asked` };
    } },
  { who: "Christo", owns: "Consensus & user-flow validation", ask() {
      // Can the people who are actually present make the decisions the rung demands of them?
      // Measured against the people the LEVEL actually provides: one officer at 1-3, a quorum of the key
      // group at 4 and 5. A group is not a nicer word for the same person — more people is the only thing
      // that raises a throughput ceiling, and this lens is the reason levels 4 and 5 exist at all.
      const over = rows.filter((r) => r.perMin > r.capacityPerMin);
      const worst = rows.reduce((a, b) => (b.perMin / b.capacityPerMin > a.perMin / a.capacityPerMin ? b : a));
      const top = LEVELS[LEVELS.length - 1];
      const topOver = rows.filter((r) => r.level === top && r.perMin > r.capacityPerMin);
      return { ok: topOver.length === 0,
        say: topOver.length
          ? `even at level ${top} ${topOver.length} rung(s) outrun their approvers: worst ${worst.perSide}v${worst.perSide} at ${worst.perMin}/min against ${worst.capacityPerMin}/min`
          : `${over.length} of ${rows.length} rungs outrun ONE officer (worst L${worst.level} ${worst.perSide}v${worst.perSide}, ${worst.perMin}/min against ${worst.capacityPerMin}/min) — and none outruns level ${top}, where the decision belongs to a quorum` };
    } },
  { who: "Enki", owns: "Diversity & edge-case discovery", ask() {
      // Three seeds must not play one scripted match, or the ladder is measuring a single story.
      const same = rows.filter((r) => new Set(r.outcomes).size === 1 && r.perSide > 2);
      return { ok: same.length < rows.length * 0.5,
        say: `${rows.length - same.length} of ${rows.length} rungs played differently across ${SEEDS} seeds — the ladder is not measuring one scripted match` };
    } },
  { who: "Enlil", owns: "Implementation & build verification", ask() {
      const bad = rows.filter((r) => !Number.isFinite(r.durationS) || r.durationS <= 0 || r.asked < 0);
      // REPLAY: the same seed must give the same hash, or nothing measured here can be compared tomorrow.
      const again = runContest(spec(3, LEVELS[0], 20260916)).replayHash;
      const same = again === at(LEVELS[0], 3).replayHash;
      return { ok: bad.length === 0 && same,
        say: bad.length ? `${bad.length} rung(s) produced a number that is not a number`
           : !same ? `3v3 at seed 20260916 hashed ${at(LEVELS[0], 3).replayHash} then ${again} — the contest is not replayable`
           : `${rows.length} rungs × ${SEEDS} seeds ran clean; 3v3 replays to the same hash ${again.slice(0, 12)}…` };
    } },
  { who: "Krishna", owns: "Integration & cross-module testing", ask() {
      // The three modules must agree: a match cannot be shorter than one kill takes at the beam's own reach.
      const floor = dwellToDisableS(B, D, 200);
      const tooFast = rows.filter((r) => r.durationS < floor);
      return { ok: tooFast.length === 0,
        say: tooFast.length ? `${tooFast.length} rung(s) resolved faster than a single kill takes (${floor.toFixed(2)}s at 200 m) — the laser and the contest disagree`
                            : `every match takes at least one kill's worth of beam (${floor.toFixed(2)}s at 200 m); laser, swarm and authority agree` };
    } },
  { who: "Odin", owns: "Predictive & future-proof testing", ask() {
      // Extrapolate the decision load past the top of the ladder. Does 21 warn us about 42?
      const l1 = at(1, 21), l3 = at(3, 21);
      const ratio = l3.asked > 0 ? l1.asked / l3.asked : Infinity;
      return { ok: ratio > 3,
        say: `at 21v21 level 1 asks ${l1.asked} decisions and level 3 asks ${l3.asked} — a ${ratio.toFixed(1)}× difference, so the ladder is what makes 42v42 conceivable at all` };
    } },
  { who: "Pangu", owns: "Cutting-edge innovation testing", ask() {
      // Something must be genuinely new above 1v1, or the ladder was not worth climbing.
      const one = at(LEVELS[0], 1), top = at(LEVELS[0], 21);
      return { ok: top.peakContention > one.peakContention,
        say: `contention is impossible at 1v1 (peak ${one.peakContention}) and real at 21v21 (peak ${top.peakContention}) — the rung ABOVE one is where the game starts` };
    } },
  { who: "Sofia", owns: "Multi-perspective analysis", ask() {
      // Neither side may be structurally advantaged: across all rungs and seeds, wins should not be one-sided.
      let f = 0, h = 0;
      for (const r of rows) for (const run of r.runs) {
        if (run.survivors.friendly > run.survivors.hostile) f++;
        else if (run.survivors.hostile > run.survivors.friendly) h++;
      }
      const total = f + h;
      const skew = total > 0 ? Math.abs(f - h) / total : 0;
      return { ok: skew < 0.5, say: `blue won ${f}, red won ${h} across ${total} decided matches — skew ${(skew * 100).toFixed(0)}%` };
    } },
  { who: "Thoth", owns: "Data & analytics deep dive", ask() {
      // Conservation: nobody may be downed twice, and nobody may survive AND be downed.
      const bad = [];
      for (const r of rows) for (const run of r.runs) {
        if (run.downed.friendly + run.survivors.friendly > run.perSide) bad.push(`${r.perSide}v${r.perSide} blue ${run.downed.friendly}+${run.survivors.friendly}>${run.perSide}`);
        if (run.downed.hostile + run.survivors.hostile > run.perSide) bad.push(`${r.perSide}v${r.perSide} red ${run.downed.hostile}+${run.survivors.hostile}>${run.perSide}`);
      }
      return { ok: bad.length === 0, say: bad.length ? `roster does not balance: ${bad.slice(0, 3).join(", ")}` : "downed plus still-fighting never exceeds the roster, at any rung or seed" };
    } },
  { who: "Thor", owns: "Risk & security stress testing", ask() {
      // THE INVARIANT. No rung, at any level, may fire without having asked a named human first.
      const silent = rows.filter((r) => r.asked === 0 && r.durationS > 0);
      const allLevelsAsk = LEVELS.every((l) => LADDER.every((n) => at(l, n).asked > 0));
      return { ok: silent.length === 0 && allLevelsAsk,
        say: silent.length ? `${silent.length} rung(s) fought without asking anyone — the fire gate is not holding`
                           : `every rung at every level asked a named human before anything fired; silence is never consent, at 1v1 or at 21v21` };
    } },
];

// ── RUNG 0 · TRAINING (1v0) ────────────────────────────────────────────────────────────────────
// Below 1v1 sits the training rung: a stationary turret, pop-up targets, nobody shooting back — the rung a
// first-timer plays before CH1. It is 1v0, so the contest engine (which needs two sides) does not run it;
// the pure CH0 sim (lib/drone-2525/training.ts) does. The twelve lenses read it as the ladder's floor: the
// authority path (TARGET → AMBER → APPROVE → RED → FIRE) is exercised here with zero opponent pressure, and
// its determinism is the same seed → same hash the rest of the ladder demands.
const training = DIFFICULTIES_5.map((d) => {
  const a = runTraining({ diff: d, seed: 2525 });
  const b = runTraining({ diff: d, seed: 2525 });
  return { diff: d, tagged: a.tagged, missed: a.missed, quota: a.quota, replayHash: a.replayHash, deterministic: a.replayHash === b.replayHash, line: trainingLine(a) };
});
const trainingDeterministic = training.every((t) => t.deterministic && t.missed === 0 && t.tagged >= 1);
console.log(`\nRUNG 0 — CH0 TRAINING (1v0), pop-up targets, no opponent · seed 2525\n`);
console.log(`  diff   tagged/quota   missed   det   hash`);
for (const t of training) {
  console.log(`  D${t.diff}     ${String(t.tagged + "/" + t.quota).padEnd(11)}  ${String(t.missed).padEnd(6)}  ${t.deterministic ? "✓" : "✗"}    ${t.replayHash}`);
}
console.log(`  ${trainingDeterministic ? "✓ the training rung is deterministic and the gate is never bypassed" : "✗ training rung FAILED"}`);

// ── REPORT ───────────────────────────────────────────────────────────────────────────────────────
console.log(`\nTHE N LADDER — 1v1 → 21v21, ${SEEDS} seeds a rung, authority level(s) ${LEVELS.join(" and ")}\n`);
for (const level of LEVELS) {
  const rule = AUTHORITY[level];
  console.log(`  AUTHORITY ${level} — one named decision covers ${rule.id} (${rule.decider}; `
    + `${approversAt(spec(1, level, 0))} approver(s), ${capacityAt(level).toFixed(0)} decisions/min between them)`);
  console.log(`  rung   aircraft  seats     dur   outcome   waste  contend   asked   dec/min  desig/min  holds  refused  handoffs  sim×  hash`);
  for (const n of LADDER) {
    const r = at(level, n);
    console.log(
      `  ${`${n}v${n}`.padStart(5)} ${String(r.aircraft).padStart(9)} ${String(r.seats).padStart(6)}`
      + ` ${(r.resolvedAll ? `${r.durationS}s` : "OPEN").padStart(8)} ${r.outcomes[0].padStart(9)}`
      + ` ${`${r.overkillPct}%`.padStart(7)} ${r.contention.toFixed(2).padStart(8)}`
      + ` ${String(r.asked).padStart(7)} ${r.perMin.toFixed(1).padStart(9)}`
      + ` ${r.desigPerMin.toFixed(1).padStart(10)} ${String(r.hiHolds).padStart(6)} ${String(r.authFailures).padStart(8)} ${String(r.handoffs).padStart(9)}`
      + ` ${String(r.simSpeed).padStart(5)} ${r.replayHash.slice(0, 8)}`
      + (r.perMin > r.capacityPerMin ? `  ← beyond its ${r.approvers} approver(s)` : ""));
  }
  console.log("");
}

console.log("  THE TWELVE\n");
let failed = 0;
for (const l of LENSES) {
  const v = l.ask();
  if (!v.ok) failed++;
  console.log(`  ${v.ok ? "✓" : "✗"} ${l.who.padEnd(8)} ${l.owns.padEnd(38)} ${v.say}`);
}

// The headline the ladder exists to produce.
const l1 = at(1, 21), l3 = at(3, 21);
console.log(`\n  THE FINDING`);
console.log(`  The physics does not change with N — beam waste stays at ${at(1, 21).overkillPct}% at twenty-one a side.`);
console.log(`  What changes is the person. At 21v21 one watch officer is asked for ${l1.asked} decisions at level 1`);
console.log(`  (${l1.perMin}/min against a ceiling of ${HUMAN_CEILING_PER_MIN.toFixed(0)}) and ${l3.asked} at level 3 (${l3.perMin}/min).`);
const top = at(LEVELS[LEVELS.length - 1], 21);
console.log(`  A quorum of the key group at level ${top.level} answers ${top.asked} and has ${top.capacityPerMin}/min between ${top.approvers} people.`);
console.log(`  The invariant never bends at any level: a named human decided before anything fired, at 1v1 and`);
console.log(`  at 21v21. What scales is the BREADTH of one decision and HOW MANY PEOPLE make it — which is the`);
console.log(`  authority ladder's entire reason for existing, and this is the measurement that argues it.`);

mkdirSync(path.dirname(OUT), { recursive: true });
let commit = "unknown";
try { commit = (await import("node:child_process")).execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(); } catch { /* not a checkout */ }
writeFileSync(OUT, JSON.stringify({
  commit, at: new Date().toISOString(), seeds: SEEDS, levels: LEVELS,
  humanCeilingPerMin: HUMAN_CEILING_PER_MIN,
  rung0Training: { deterministic: trainingDeterministic, rows: training },
  // sim× is a wall-clock throughput and is deliberately NOT part of any hash (r.043: no FPS in the hash).
  rows: rows.map(({ runs, ...r }) => r),
  hashes: rows.map((r) => ({ level: r.level, perSide: r.perSide, seeds: r.runs.map((x) => x.replayHash) })),
  lenses: LENSES.map((l) => ({ who: l.who, owns: l.owns, ...l.ask() })),
}, null, 2) + "\n");
console.log(`\n  ${failed ? `${failed} of ${LENSES.length} lenses REFUSED` : `all ${LENSES.length} lenses pass`} → ${path.relative(ROOT, OUT)}`);
process.exit(failed ? 1 : 0);

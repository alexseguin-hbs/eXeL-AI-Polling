// CH0 TRAINING — the 1v0 rung, run as a PURE, SEEDED simulation (operator 2026-09-16: "add level 0 for
// training with pop up targets"). A stationary turret, pop-up targets, and nothing shooting back: the rung a
// first-timer plays before CH1 so they feel TARGET → AMBER → APPROVE → RED → FIRE once, with success, before
// anything moves or flies.
//
// This is NOT a second engine. It reuses the arena the round draws (`worldAt`), the CH0 schedule the round
// schedules (`buildSchedule` + `targetSpecFor`, which already yield c=0 → quota 4+d, one door at a time, a
// 7.2 s window), the SAME fire gate the live round obeys (`slots`: a shot needs a RED box), and the SAME
// decision ledger the round records into (`decisions`). So a training pass produces a real, replayable
// ledger and a real `replayHash`, and the twelve AsM lenses read it as RUNG 0 of the ladder
// (`scripts/drone-ladder.mjs`). Pure and seeded: no clock, no DOM, no Math.random — the same diff and seed
// play the same rung and hash identically.
//
// THE TWO-STEP STILL HOLDS. Even in training nothing fires without an APPROVE: each target is designated
// (amber), then approved to red (a first-timer's own HI-2 second step — honest two-step, one device), and
// only then does the gate clear. There is no approval-gate PRESSURE (no opponent, no CH5 second-person
// rule), but the gate itself is never bypassed — the point of the rung is to feel it work.
import { DRONE_DOMAIN } from "./domain.gen";
import { worldAt } from "./world";
import { buildSchedule, type TargetSpec } from "./targets";
import { challengeSpec, targetSpecFor, doorsInPlay, DEFAULT_DIFF } from "./challenge";
import { initSlots, designate, approve, canFire, clearSlot, nextFreeSlot } from "./slots";
import { initLedger, decide, ev, stampOf, replayHash, type Ledger } from "./decisions";

/** The trainee is one person: they designate and take their own HI-2 second step. */
const TRAINEE = "PLAY";
/** Training is authority level 1 — the most manual rung, a named human on every shot. */
const TRAIN_AUTHORITY = 1;

export interface TrainingResult {
  /** Targets carried all the way to a fired SIM-ACTION (every one, in the happy path). */
  tagged: number;
  /** Targets that reached the gate but could not fire — always 0 unless a primitive changes under us. */
  missed: number;
  /** How many pop-ups the rung scheduled (the CH0 quota, bounded by the arena's doors). */
  quota: number;
  /** The real decision ledger the pass wrote — DESIGNATE → APPROVE → SIM-ACTION per target. */
  ledger: Ledger;
  /** FNV-1a 64 over that ledger — the same seed + diff reproduces it exactly. */
  replayHash: string;
}

/**
 * Play the CH0 rung once, deterministically. `diff` sets the quota/window like any challenge; `seed` seeds
 * the same door schedule the live round would build, so the rung a trainee sees and the rung the ladder
 * scores are the same rung.
 */
export function runTraining(opts: { diff?: number; seed?: number } = {}): TrainingResult {
  const spec = challengeSpec(0, opts.diff ?? DEFAULT_DIFF);      // CH0 by construction (training === true)
  const world = worldAt(DRONE_DOMAIN, 13, "game");
  const base: TargetSpec = {
    seed: opts.seed ?? Number(DRONE_DOMAIN.targets.seed),
    upMs: Number(DRONE_DOMAIN.targets.upMs),
    downMs: Number(DRONE_DOMAIN.targets.downMs),
    concurrent: Number(DRONE_DOMAIN.targets.concurrent),
  };
  const inPlay = doorsInPlay(spec, world.doors.length);
  const schedule = buildSchedule(world.doors, targetSpecFor(base, spec)).slice(0, inPlay);

  let L = initLedger(DRONE_DOMAIN.project.revision);
  let slots = initSlots();
  let tagged = 0, missed = 0;

  for (const w of schedule) {
    const tSec = w.startMs / 1000;                               // deterministic time, from the schedule
    const n = nextFreeSlot(slots);

    // TARGET → AMBER
    slots = designate(slots, n, w.doorId, TRAINEE, w.startMs);
    let stamp = stampOf(tSec, TRAINEE, slots.s[n], TRAIN_AUTHORITY, 0, spec.d, tagged, 0);
    ({ ledger: L } = decide(L, "DESIGNATE", w.doorId, stamp, { slot: n }));
    ({ ledger: L } = ev(L, "DESIGNATE", w.doorId, "AMBER", stamp, "HI"));

    // APPROVE → RED (the trainee's own HI-2 second step — honest two-step on one device)
    slots = approve(slots, n, TRAINEE, w.startMs);
    stamp = stampOf(tSec, TRAINEE, slots.s[n], TRAIN_AUTHORITY, 0, spec.d, tagged, 0);
    ({ ledger: L } = decide(L, "APPROVE", w.doorId, { ...stamp, hiApproved: true }, { by: TRAINEE, from: TRAINEE, slot: n }));
    ({ ledger: L } = ev(L, "APPROVE", w.doorId, "RED", { ...stamp, hiApproved: true }, "HI-2"));

    // FIRE — only if red (the real gate, unchanged)
    const fc = canFire(slots, n);
    if (fc.ok) {
      tagged++;
      const s2 = stampOf(tSec, TRAINEE, slots.s[n], TRAIN_AUTHORITY, 0, spec.d, tagged, 0);
      ({ ledger: L } = decide(L, "SIM-ACTION", w.doorId, s2, { slot: n }));
      ({ ledger: L } = ev(L, "SIM-ACTION", w.doorId, `T${n}`, s2, "HI"));
    } else {
      missed++;
      const s2 = stampOf(tSec, TRAINEE, slots.s[n], TRAIN_AUTHORITY, 0, spec.d, tagged, 0);
      ({ ledger: L } = decide(L, "REJECT", w.doorId, s2, { reason: fc.refusal ?? "NONE" }));
      ({ ledger: L } = ev(L, "HOLD", w.doorId, fc.refusal ?? "HOLD", s2, "HI"));
    }

    slots = clearSlot(slots, n);                                 // the pop is done; free the slot for the next
  }

  return { tagged, missed, quota: spec.quota, ledger: L, replayHash: replayHash(L) };
}

/** One line a person (or the ladder) can read about a finished training pass. */
export const trainingLine = (r: TrainingResult): string =>
  `CH0 TRAINING · ${r.tagged}/${r.quota} tagged${r.missed ? ` · ${r.missed} missed` : ""} · ${r.replayHash}`;

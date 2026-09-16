// CH1–CH5 AND DIFF 1–5 — gameplay truth, ported from the operator deck (r.036 → r.050, challengeSpec()).
//
//   CH1 LAWN · CH2 AXIS · CH3 MIX · CH4 RING · CH5 NET      DIFF 1..5
//   quota = 4 + CH×2 + DIFF     rate = max(10, 56 − CH×6 − DIFF×4)     spd = 3 + CH + DIFF×0.8
//   moving = CH ≥ 3 · axes = CH ≥ 4 ? 4 : CH = 2 ? 2 : 1 · net = CH = 5 · pops = CH ≠ 2
//
// Verbatim, so the deck and the app agree on what a challenge IS. This replaced the deck's hidden TG
// selector (his notes: "do not resurrect TG as a second level system"), and it is NOT a second authority
// ladder: authority stays AUTHORITY[1..5]. What CH5 adds is felt, not configured — see ch5 below.
//
// HOW IT LANDS ON THIS ARENA. The deck spawns pop-ups and drones on a lawn; this round opens DOORS on a
// schedule. quota becomes how many of the block's doors are in play this round; rate becomes how long a
// door stays open (the deck's spawn interval in ticks, scaled against its CH1 D3 default); spd and axes are
// the swarm's (moving targets are the flying modes' opponents). Nothing here invents a third target type.
//
// CH5 NET, HONESTLY. In the deck, CH5 puts an explicit HI APPROVE dialog in front of every shot. In this
// app EVERY shot already needs APPROVE (amber → red, r.049), which is stronger than the deck's CH1–CH4.
// So the deck's CH5 step has nowhere to go but UP: at CH5 the red box must come from a SECOND PERSON —
// the other seat over the link, or the crew's named approver for a machine's mark — and a device
// approving its own mark is refused with CH5_NO_APPROVE, recorded as a HOLD. Two-step is not enough on
// the net; two-person is the rule. Said here so nobody reads CH5 as "the same dialog we already had".
import type { TargetSpec } from "./targets";

export type Challenge = 1 | 2 | 3 | 4 | 5;
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export const CH_NAMES = ["LAWN", "AXIS", "MIX", "RING", "NET"] as const;
export const CHALLENGES: readonly Challenge[] = [1, 2, 3, 4, 5];
export const DIFFICULTIES: readonly Difficulty[] = [1, 2, 3, 4, 5];
/** The deck's defaults: CH1 D3. */
export const DEFAULT_CHALLENGE: Challenge = 1;
export const DEFAULT_DIFF: Difficulty = 3;

export interface ChallengeSpec {
  c: Challenge; d: Difficulty; name: string;
  quota: number; rate: number; spd: number;
  moving: boolean; axes: 1 | 2 | 4; net: boolean; pops: boolean;
}

const clamp5 = (v: number, dflt: number): Challenge =>
  (Number.isFinite(v) ? Math.max(1, Math.min(5, Math.round(v))) : dflt) as Challenge;

/** r.050 challengeSpec(), field for field. */
export function challengeSpec(challenge: number = DEFAULT_CHALLENGE, diff: number = DEFAULT_DIFF): ChallengeSpec {
  const c = clamp5(challenge, DEFAULT_CHALLENGE), d = clamp5(diff, DEFAULT_DIFF);
  return {
    c, d, name: `CH${c} ${CH_NAMES[c - 1]} D${d}`,
    quota: 4 + c * 2 + d,
    rate: Math.max(10, 56 - c * 6 - d * 4),
    spd: 3 + c + d * 0.8,
    moving: c >= 3, axes: c >= 4 ? 4 : c === 2 ? 2 : 1, net: c === 5, pops: c !== 2,
  };
}

/** The deck's CH1 D3 rate, against which a window's length is scaled. */
export const RATE_REF = challengeSpec(1, 3).rate;   // 38

/**
 * A pop in the deck stays up `4 + CH` seconds (r.050 spawn(): idle.life = 4 + g). A pop appears in front of
 * you; a door here has to be swung to, captured, marked and approved — sometimes by a second person over a
 * link — so the ARENA's declared window (targets.upMs, 9 s) is the CH1 baseline and the deck's proportion
 * scales it: CH5 stays up (4+5)/(4+1) = 1.8× as long. The two-device harness found the 5 s literal closing
 * a door between the targeteer's mark and the pilot's approval.
 */
export const upFactorFor = (spec: ChallengeSpec): number => (4 + spec.c) / 5;

/**
 * The target schedule for a challenge: the same builder the round already uses, with the deck's numbers
 * folded in the way the deck uses them. quota bounds the doors in play (deterministically — the builder's
 * own seeded ranking picks which). A door stays open 4 + CH seconds, as the deck's pops do. `rate` is the
 * deck's SPAWN INTERVAL, so it scales the GAP between doors, not their life — a first edition scaled the
 * life instead and made CH5 D5 unplayable (2.4 s windows against a 1.5 s reach margin). concurrent grows
 * 1 → 3 with the challenge, so CH1 is one door at a time and CH5 is the block at once.
 */
export function targetSpecFor(base: TargetSpec, spec: ChallengeSpec): TargetSpec {
  return {
    seed: base.seed,
    upMs: Math.round(base.upMs * upFactorFor(spec)),
    downMs: Math.max(500, Math.round((base.downMs * spec.rate) / RATE_REF)),
    concurrent: Math.max(1, Math.min(3, 1 + Math.floor((spec.c - 1) / 2))),
  };
}

/** How many doors are in play. Never more than the block has; never fewer than one. */
export const doorsInPlay = (spec: ChallengeSpec, available: number): number => Math.max(1, Math.min(available, spec.quota));

/**
 * CH5's rule, as a pure check. `by` is who is approving; `designatedBy` who made the mark. On the net the
 * two must differ. Below CH5 the amber → red two-step stands as it is (self-approval reads HI-2 and is
 * recorded as two-step; slots.ts approvalKind).
 */
export const ch5RefusesSelfApproval = (spec: ChallengeSpec, by: string, designatedBy: string): boolean =>
  spec.net && by.trim() === designatedBy.trim();

export const CH5_REASON = "CH5_NO_APPROVE";

/** One HUD line. */
export const challengeLine = (spec: ChallengeSpec, inPlay: number): string =>
  `${spec.name} · ${inPlay} doors · ${spec.moving ? "moving" : "still"}${spec.net ? " · NET: second person approves" : ""}`;

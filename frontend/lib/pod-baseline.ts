/**
 * The locked estimate — Vision 2525 §14 · unit.accel · unit.aitoken.
 *
 * THE RULE: "The estimate is set and signed BEFORE work begins by a party with no stake in the payout", locked, carrying
 * id, version, scope, estimated cost and duration, quality and risk thresholds, the signing authority, and a Replay hash.
 * ◬ is then read "from the witnessed acceleration AGAINST A LOCKED ESTIMATE — not minted at a per-minute rate."
 * And the bonus is payable only if ALL SIX hold: schedule improved · scope preserved · quality maintained or improved ·
 * risk did not materially worsen · SSSES qualification passed · Human Authority accepted the outcome.
 * "Faster is not automatically better; cheaper is not automatically better; and more AI is certainly not automatically better."
 *
 * Before this module the pod typed a baseline at AUDIT time, after the work, with no signer, no lock and no conditions —
 * which is the one shape the rule forbids, because an estimate written after the fact cannot bound anything.
 *
 * Pure: no React, no storage, no network.
 */
import { sha256Hex } from "@/lib/sign-envelope";
import { mint } from "@/lib/pod-yug";

/** What is frozen before the clock starts. Written once; a change is a NEW lock, never an edit (rcore.ledger). */
export interface Baseline {
  id: string;               // pod code + sequence — the lock's own name
  version: number;          // a re-lock appends; it never overwrites
  scope: string;            // what was to be done, in the pod's words
  hours: number;            // the estimated duration — the PLANNED time
  /**
   * THE TASK PLAN (operator 2026-09-11): "every task gets an M, accepted by scope of work or by team before starting
   * task … task gets plan so we can measure plans actual in time and HI TOKEN. This can be predetermined or established
   * by POD upon working together on a project." The multiple is part of the plan, locked with the hours before the clock,
   * and the planned 웃 = M × planned hours is derived from both — never typed, never edited afterwards.
   */
  m: number;                // the multiple this scope of work is accepted at (unit.multiples; M is unbounded)
  yug: number;              // planned 웃 = m × hours — the figure the actual is measured against
  source: "predetermined" | "pod";   // shipped with the task, or set by the trio when it convened
  signedBy: string;         // the signing authority — a party with no stake in the payout
  signedAt: string;         // ISO instant, frozen
  hash: string;             // the Replay hash of everything above
}

/** The six conditions, each answered by a person. None is inferred and none defaults to true. */
export interface AccelConditions {
  scheduleImproved: boolean; scopePreserved: boolean; qualityHeld: boolean;
  riskNotWorse: boolean; ssses: boolean; humanAccepted: boolean;
}
export const CONDITION_IDS: (keyof AccelConditions)[] =
  ["scheduleImproved", "scopePreserved", "qualityHeld", "riskNotWorse", "ssses", "humanAccepted"];
export const noConditions = (): AccelConditions =>
  ({ scheduleImproved: false, scopePreserved: false, qualityHeld: false, riskNotWorse: false, ssses: false, humanAccepted: false });
export const allConditionsMet = (c: AccelConditions): boolean => CONDITION_IDS.every((k) => c[k]);

/** Lock an estimate. The hash covers every field, so a later edit is detectable rather than deniable. */
export type BaselineInput = Omit<Baseline, "hash" | "yug" | "m" | "source"> & { m?: number; source?: Baseline["source"] };
export async function lockBaseline(input: BaselineInput): Promise<Baseline> {
  const m = input.m != null && input.m > 0 ? input.m : 1;      // 1x is the floor of the scale, never a working band
  const source = input.source ?? "pod";
  const yug = m * input.hours;                                  // planned 웃 = M × T, the one mint, restated nowhere else
  const body = `${input.id}|${input.version}|${input.scope}|${input.hours}|${m}|${yug}|${source}|${input.signedBy}|${input.signedAt}`;
  return { ...input, m, yug, source, hash: await sha256Hex(new TextEncoder().encode(body)) };
}
/** Re-check a lock. A baseline whose hash does not match its fields has been edited and is no longer a baseline. */
export async function verifyBaseline(b: Baseline): Promise<boolean> {
  const again = await lockBaseline({ id: b.id, version: b.version, scope: b.scope, hours: b.hours, m: b.m, source: b.source, signedBy: b.signedBy, signedAt: b.signedAt });
  return again.hash === b.hash && again.yug === b.yug;
}

/**
 * The acceleration, read against the locked estimate.
 * `delta` is hours saved and is DELTA-ONLY — never a profit metric (D4), which is what keeps ◬ outside the securities
 * perimeter. It may be zero, and the whitepaper is explicit that the hypothesis is allowed to fail: if the work took
 * LONGER than the estimate, that is the honest result and it is preserved rather than clipped to zero and forgotten.
 */
export interface Acceleration {
  baselineHours: number; actualHours: number;
  delta: number;          // + = earlier than estimate, − = later. Never clamped, so a failed accelerator stays visible.
  earned: number;         // ◬ recognised: the positive delta, and only when every condition holds
  conditionsMet: boolean;
  reason: string;         // why nothing was earned, when nothing was earned
}
export function accelerate(baseline: Baseline | null, actualHours: number, c: AccelConditions): Acceleration {
  if (!baseline) return { baselineHours: 0, actualHours, delta: 0, earned: 0, conditionsMet: false, reason: "no_locked_baseline" };
  const delta = baseline.hours - actualHours;
  const met = allConditionsMet(c);
  if (delta <= 0) return { baselineHours: baseline.hours, actualHours, delta, earned: 0, conditionsMet: met, reason: "no_time_saved" };
  if (!met) return { baselineHours: baseline.hours, actualHours, delta, earned: 0, conditionsMet: false, reason: "conditions_unmet" };
  return { baselineHours: baseline.hours, actualHours, delta, earned: delta, conditionsMet: true, reason: "" };
}

/* ── The two tranches — unit.tranche ────────────────────────────────────────────────────────────────────────────────────
   The WAGE-FLOOR tranche is the hours at the floor: drawable immediately and NEVER clawed back.
   The ACCELERATION tranche is everything the multiple adds above the floor: held in escrow and released through the
   De-Risk Gateway — Pilot → Refine → Qualify → Adopt — against the frozen baseline. */
export interface Tranches {
  floor: number;        // 웃 — drawable now, never clawed back
  escrow: number;       // 웃 — everything the multiple adds above the floor, held
  accelEscrow: number;  // ◬ — the recognition premium, held; a DIFFERENT unit, never added to the 웃 above
  multiple: number;
}
export function split(supportedHours: number, multiple: number, accel: Acceleration): Tranches {
  // Both tranches are in 웃, so both go through the ONE mint (웃 = M × T). Writing the arithmetic out a second time
  // here is how a wrong coefficient survives a correction in one place and not the other; there is exactly one mint.
  const floor = mint(Math.max(0, supportedHours), 1);               // 1× — hi.floor.dignity: "one 웃 for the hour itself"
  const escrow = Math.max(0, mint(Math.max(0, supportedHours), multiple) - floor);  // what the band adds, held
  // ◬ is reported BESIDE the 웃 escrow and never inside it. They release through the same gateway stages, but a person
  // who is told "you are owed 30" must never be handed a number that is part wage and part recognition: one is owed for
  // hours regardless of outcome, the other is not owed at all until the outcome qualifies. Blending them would make the
  // floor look larger than the amount that can never be clawed back, which is the one number that must not be overstated.
  const accelEscrow = Math.max(0, accel.earned);
  return { floor, escrow, accelEscrow, multiple };
}
/** floor + escrow is exactly the 웃 minted for those hours at that band. Held where it is relied upon. */
export const trancheTotalYug = (t: Tranches): number => t.floor + t.escrow;

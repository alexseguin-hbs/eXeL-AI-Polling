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

/** What is frozen before the clock starts. Written once; a change is a NEW lock, never an edit (rcore.ledger). */
export interface Baseline {
  id: string;               // pod code + sequence — the lock's own name
  version: number;          // a re-lock appends; it never overwrites
  scope: string;            // what was to be done, in the pod's words
  hours: number;            // the estimated duration
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
export async function lockBaseline(input: Omit<Baseline, "hash">): Promise<Baseline> {
  const body = `${input.id}|${input.version}|${input.scope}|${input.hours}|${input.signedBy}|${input.signedAt}`;
  return { ...input, hash: await sha256Hex(new TextEncoder().encode(body)) };
}
/** Re-check a lock. A baseline whose hash does not match its fields has been edited and is no longer a baseline. */
export async function verifyBaseline(b: Baseline): Promise<boolean> {
  const again = await lockBaseline({ id: b.id, version: b.version, scope: b.scope, hours: b.hours, signedBy: b.signedBy, signedAt: b.signedAt });
  return again.hash === b.hash;
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
export interface Tranches { floor: number; escrow: number; multiple: number }
export function split(supportedHours: number, multiple: number, accel: Acceleration): Tranches {
  const floor = Math.max(0, supportedHours);                        // 1× — settles at once
  const escrow = Math.max(0, supportedHours * (multiple - 1)) + Math.max(0, accel.earned);
  return { floor, escrow, multiple };
}

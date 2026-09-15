// POP-UP DOOR TARGETS (DRN-05) — "Stationary game shooting pop up targets that dint move and fly"
// (operator 2026-09-15, items 1 and 2). Every door on the block is a target. It rises, stays up for a
// declared window, and goes down again; the goal is to TAG it — capture it first, then shoot it.
//
// INVARIANT, in the operator's terms: THE SAME SEED PLAYS THE SAME ROUND. The schedule is computed from
// (seed, door id, index) with no clock and no Math.random, so a replay puts every target up at the same
// second and a score can be argued about afterwards. A target's state is a FUNCTION of the elapsed time,
// never an accumulated mutation that can drift.
import type { ArenaDoor } from "./arena-model";

export interface TargetSpec { seed: number; upMs: number; downMs: number; concurrent: number }
export type TargetPhase = "down" | "up" | "captured" | "tagged" | "missed";

export interface TargetWindow { doorId: string; startMs: number; endMs: number; slot: number; order: number }
export interface TargetView {
  door: ArenaDoor;
  window: TargetWindow;
  phase: TargetPhase;
  /** 0..1 through its up-window, so a HUD can show how long is left without doing arithmetic. */
  progress: number;
}

/** Deterministic 32-bit mix — the same one the rest of the domain uses for seeded choices. */
function mix(seed: number, s: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0; h ^= h >>> 13;
  return h >>> 0;
}

/**
 * Lay every door out on a schedule: `concurrent` slots, each slot cycling up/down. The order within a slot
 * is a seeded shuffle, so two rounds on one seed match and two seeds differ.
 */
export function buildSchedule(doors: readonly ArenaDoor[], spec: TargetSpec): TargetWindow[] {
  const cycle = spec.upMs + spec.downMs;
  const ranked = doors
    .map((d) => ({ d, k: mix(spec.seed, d.id) }))
    .sort((a, b) => (a.k - b.k) || a.d.id.localeCompare(b.d.id));   // ties broken by id: stable everywhere
  return ranked.map(({ d }, i) => {
    const slot = i % spec.concurrent;
    const round = Math.floor(i / spec.concurrent);
    const startMs = round * cycle + slot * Math.floor(cycle / spec.concurrent);
    return { doorId: d.id, startMs, endMs: startMs + spec.upMs, slot, order: i };
  });
}

/** How long one full round lasts — every door has had exactly one turn by then. */
export const roundLengthMs = (sched: readonly TargetWindow[]): number =>
  sched.reduce((m, w) => Math.max(m, w.endMs), 0);

export interface TagState { captured: Set<string>; tagged: Set<string> }
export const emptyTags = (): TagState => ({ captured: new Set(), tagged: new Set() });

/** What is on screen at `tMs`. A target already tagged stays tagged — a finished capture is never undone. */
export function targetsAt(doors: readonly ArenaDoor[], sched: readonly TargetWindow[], tags: TagState, tMs: number): TargetView[] {
  const byId = new Map(doors.map((d) => [d.id, d]));
  return sched.flatMap((w) => {
    const door = byId.get(w.doorId);
    if (!door) return [];
    const up = tMs >= w.startMs && tMs < w.endMs;
    const past = tMs >= w.endMs;
    const phase: TargetPhase = tags.tagged.has(w.doorId) ? "tagged"
      : tags.captured.has(w.doorId) ? (up ? "captured" : past ? "missed" : "down")
      : up ? "up" : past ? "missed" : "down";
    const progress = up ? (tMs - w.startMs) / (w.endMs - w.startMs) : past ? 1 : 0;
    return [{ door, window: w, phase, progress }];
  });
}

/** Only a target that is UP can be acted on — the rule a score has to rest on. */
export const isActionable = (v: TargetView): boolean => v.phase === "up" || v.phase === "captured";

/** The colour role a target is drawn in, so the arena and the HUD never disagree about what it means. */
export const targetRole = (phase: TargetPhase): "door" | "tagged" | "pending" | "blocked" =>
  phase === "tagged" ? "tagged" : phase === "captured" ? "pending" : phase === "missed" ? "blocked" : "door";

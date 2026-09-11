/**
 * The pod's platform clock — Vision 2525 §14 · unit.witness.
 *
 * THE RULE, verbatim from the White Paper:
 *   "웃 is minted only for TIME CLOCKED BY THE PLATFORM, worked in a pod of three or more, documented by that pod,
 *    audited by that pod, and reviewed by people who gain nothing from the claim."
 *
 * Before this module the pod had no clock at all and minted 웃 from a hand-typed number of hours: it minted for time
 * CLAIMED, not time CLOCKED. This module supplies the missing half and keeps the two numbers apart for ever, which is the
 * Executive Summary's own instruction (k18): "The clock records what actually passed. Human Intelligence records what
 * qualified contribution emerged through that time. The two must never be confused."
 *
 * INVARIANT (stated before the code, as the R-CORE law requires):
 *   Time already recorded is never lost or altered. The measured session is an append-only pair of platform events, the
 *   claim is a separate number, and a claim may never exceed what the platform actually witnessed.
 *
 * Pure: no React, no storage, no network — so the gate can read it and the simulation can drive it.
 */

/** A platform event. Only two exist, and neither is ever rewritten (rcore.ledger: nothing overwritten). */
export interface ClockEvent { kind: "start" | "stop"; at: number; by: string }

/** One run of the clock: a start and, once pressed, its stop. A pod may have several — "adding additional time". */
export interface Segment { startedAt: number; stoppedAt: number | null }

/**
 * The session's measured span, derived from the events — never stored as a mutable total.
 * `ms` is the SUM of every segment; `startedAt`/`stoppedAt` are the first start and the last stop, kept for callers
 * that only need the envelope. `running` is true iff the last segment is still open.
 */
export interface Measured { startedAt: number | null; stoppedAt: number | null; ms: number; running: boolean; segments: Segment[] }

/** 9,999 웃 ÷ 525,600 minutes in a year — the ceiling expressed as a rate (unit.ceiling). */
export const MAX_YUG_PER_MIN = 9999 / 525600;          // 0.0190239726…
/** The annual ceiling per natural person (unit.ceiling, Immutable). */
export const YUG_CEILING = 9999;
/** A pod is three or more: "Two people can quietly agree on a lie in private; three must openly conspire." */
export const POD_MIN = 3;

/**
 * Fold the event log into the measured span. Later events never erase earlier ones; a "start" while a segment is open is
 * ignored, a "stop" while none is open is ignored — the log is append-only, so it must tolerate being appended to.
 *
 * OPERATOR RULING 2026-09-11 — "button should start and end clock … adding additional time": a stop no longer ends the
 * pod's time for good. A later start opens a NEW segment and the span is the sum of all of them. unit.ceiling: "MoT and
 * Replay preserve every recorded minute." A segment once closed is never reopened, shortened or merged.
 */
export function measure(events: ClockEvent[], now: number): Measured {
  const segments: Segment[] = [];
  for (const e of [...events].sort((a, b) => a.at - b.at)) {
    const open = segments.length > 0 && segments[segments.length - 1].stoppedAt === null ? segments[segments.length - 1] : null;
    if (e.kind === "start" && !open) segments.push({ startedAt: e.at, stoppedAt: null });
    else if (e.kind === "stop" && open) open.stoppedAt = e.at;
  }
  if (segments.length === 0) return { startedAt: null, stoppedAt: null, ms: 0, running: false, segments };
  const last = segments[segments.length - 1];
  const ms = segments.reduce((sum, g) => sum + Math.max(0, (g.stoppedAt ?? now) - g.startedAt), 0);
  return { startedAt: segments[0].startedAt, stoppedAt: last.stoppedAt, ms, running: last.stoppedAt === null, segments };
}

/** Whole minutes the platform witnessed. ♡ is one minute given (unit.heart), so this is also the ♡ the session can carry. */
export const witnessedMinutes = (m: Measured): number => Math.floor(m.ms / 60000);
/** The measured span in hours, unrounded — the honest number the clock produces. */
export const witnessedHours = (m: Measured): number => m.ms / 3600000;

/**
 * The cap the witness rule implies: a person may not be recognised for more time than the platform witnessed.
 * Where the platform witnessed nothing (a legacy or offline pod), the claim stands alone and the caller MUST say so —
 * silently trusting an unwitnessed claim is the exact failure the rule exists to prevent.
 */
export function supported(claimHours: number, m: Measured): { hours: number; capped: boolean; witnessed: boolean } {
  const claim = Number.isFinite(claimHours) && claimHours > 0 ? claimHours : 0;
  if (m.startedAt === null) return { hours: claim, capped: false, witnessed: false };
  const seen = witnessedHours(m);
  return { hours: Math.min(claim, seen), capped: claim > seen, witnessed: true };
}

/** `1:04:09` — the reading a person checks against their own watch. Seconds shown because the clock is the evidence. */
export function hhmmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${Math.floor(s / 3600)}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

/* ── The clockless ♡ ladder — decision D12, si.clockless-ladder ─────────────────────────────────────────────────────────
   "a capped ladder, three rungs, fixed values: Noted (1), Adopted (3), Foundational (7) — nothing in between, and nothing
   above", judged after the fact by the witnessing pod, feeding only the S.I. ledger: never cash, settlement, or governance
   weight. ♡ cannot be saved up, spent, traded or leveraged. */
export type Rung = "none" | "noted" | "adopted" | "foundational";
export const RUNGS: { id: Rung; hearts: number }[] = [
  { id: "none", hearts: 0 }, { id: "noted", hearts: 1 }, { id: "adopted", hearts: 3 }, { id: "foundational", hearts: 7 },
];
export const heartsForRung = (r: Rung): number => RUNGS.find((x) => x.id === r)?.hearts ?? 0;

/**
 * A minute is counted as ♡ OR 웃, never both (unit.aitoken). A pod that settles 웃 for its measured time therefore carries
 * no per-minute ♡ for the same minutes; its ♡ comes only from the outcome ladder the pod awards afterwards.
 */
export function heartsFor(opts: { settles웃: boolean; measured: Measured; rung: Rung }): number {
  return opts.settles웃 ? heartsForRung(opts.rung) : witnessedMinutes(opts.measured) + heartsForRung(opts.rung);
}

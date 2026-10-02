/**
 * Financial-2525 · THE $/MIN SERIES (r.056 — addenda 117 · 122 · 127: "$/min is main view" · "so we can see real-time cost structure of
 * personal finances on accrual system default 30D" · "where is $/min chart?!?"; his answers: TradingView Lightweight Charts · income vs
 * spending · numbers upper right like Security-2525 · monthly items repeat across a longer span).
 *
 * INCOME $/min at an instant = every deposit paying out at that instant (amount ÷ its own length in minutes); SPENDING $/min = every
 * withdrawal running out at that instant the same way; NET $/min = income − spending. A transaction recorded as repeating (weekly ·
 * monthly 30 days · quarterly 91 · yearly) is PROJECTED forward every length across the window, so a 91-day span shows three months of
 * pay; the record itself is never touched (this is a picture). A one-time withdrawal (length 0) has no rate — it is a mark on the chart.
 * The series is a step function: one point at every instant a rate changes. Pure: no clock, no React, cents per minute throughout.
 */
import type { FinTx } from "./accrual";

export const MIN_MS = 60_000;
export const DAY_MS = 86_400_000;
export interface RatePoint { t: number; income: number; spending: number; net: number }   // cents per minute, holding until the next point

const REPEATS = new Set(["weekly", "paymot", "month91", "yearly"]);
/** A transaction's length in ms (0 = lands whole, no rate). */
export const lengthMs = (tx: FinTx): number => Math.max(0, tx.motDays ?? 0) * DAY_MS;
/** Does this transaction repeat every length (the person picked a repeating MoT)? */
export const repeats = (tx: FinTx): boolean => !!tx.recurrence && REPEATS.has(tx.recurrence) && lengthMs(tx) > 0;

/** Every start of a transaction whose run overlaps [from, to]: one, or one per length when it repeats (never before its own entry). */
export function occurrences(tx: FinTx, from: number, to: number): number[] {
  const len = lengthMs(tx);
  if (!repeats(tx)) return tx.atMs <= to && (len > 0 ? tx.atMs + len > from : tx.atMs >= from) ? [tx.atMs] : [];
  const out: number[] = [];
  const k0 = Math.max(0, Math.floor((from - tx.atMs) / len));
  for (let s = tx.atMs + k0 * len; s <= to; s += len) if (s + len > from) out.push(s);
  return out;
}
/** Cents per minute a transaction pays or draws at instant t (its repeats counted). */
export function rateAt(tx: FinTx, t: number, from = t, to = t): number {
  const len = lengthMs(tx); if (!(len > 0)) return 0;
  const perMin = tx.amountCents / (len / MIN_MS);
  let r = 0;
  for (const s of occurrences(tx, Math.min(from, t), Math.max(to, t))) if (t >= s && t < s + len) r += perMin;
  return r;
}
const sideAt = (txs: readonly FinTx[], kind: FinTx["kind"], t: number, from: number, to: number): number =>
  txs.reduce((a, x) => (x.kind === kind ? a + rateAt(x, t, from, to) : a), 0);
/** The three $/min lines over [from, to], one point at from and at every instant a rate changes. */
export function rateSeries(txs: readonly FinTx[], from: number, to: number): RatePoint[] {
  if (!(to > from)) return [];
  const cuts = new Set<number>([from]);
  for (const x of txs) { const len = lengthMs(x); if (!(len > 0)) continue; for (const s of occurrences(x, from, to)) { if (s > from && s < to) cuts.add(s); if (s + len > from && s + len < to) cuts.add(s + len); } }
  cuts.add(to);
  return Array.from(cuts).sort((a, b) => a - b).map((t) => {
    const income = sideAt(txs, "deposit", t, from, to), spending = sideAt(txs, "withdrawal", t, from, to);
    return { t, income, spending, net: income - spending };
  });
}
/** The value of the step series at t (the last point at or before t). */
export function rateAtSeries(pts: readonly RatePoint[], t: number): RatePoint | null {
  let hit: RatePoint | null = null;
  for (const p of pts) { if (p.t <= t) hit = p; else break; }
  return hit;
}
/** Net cents accumulated from a to b under the step series (the area under NET $/min) — "where the span ends". */
export function netBetween(pts: readonly RatePoint[], a: number, b: number): number {
  if (!(b > a)) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const s = Math.max(a, pts[i].t), e = Math.min(b, i + 1 < pts.length ? pts[i + 1].t : b);
    if (e > s) sum += pts[i].net * ((e - s) / MIN_MS);
  }
  return sum;
}
/** The start of the current pay cycle: the latest deposit start (a repeating one projected forward) at or before now; NaN when none. */
export function cycleStart(txs: readonly FinTx[], now: number): number {
  let best = NaN;
  for (const x of txs) {
    if (x.kind !== "deposit" || x.atMs > now) continue;
    const len = lengthMs(x);
    const s = repeats(x) ? x.atMs + Math.floor((now - x.atMs) / len) * len : x.atMs;
    if (!(s <= best)) best = s;
  }
  return best;
}
/** THE CHART'S RULE (addendum 128: "$/min takes all transaction records and divides by MoT selected (default 30D)"): every transaction,
 *  deposit or withdrawal, is spread over the MoT picked on the chart from its own entry time — its own length is not used, nothing
 *  repeats. The record is untouched (a picture). Pure. */
export function overSpan(txs: readonly FinTx[], spanDays: number): FinTx[] {
  return txs.map((x) => ({ ...x, motDays: spanDays, recurrence: "once" as const }));
}
/** The chart window's start: the EARLIEST deposit still paying at now (so the window ends exactly when the first one runs out —
 *  no false drop at the right edge); else the current pay cycle. Pure. */
export function windowStart(txs: readonly FinTx[], now: number): number {
  let best = NaN;
  for (const x of txs) { if (x.kind !== "deposit" || x.atMs > now) continue; const len = lengthMs(x); if (len > 0 && now < x.atMs + len && !(x.atMs >= best)) best = x.atMs; }
  return Number.isFinite(best) ? best : cycleStart(txs, now);
}
/** One-time withdrawals inside the window (no rate — drawn as marks). */
export const lumpWithdrawals = (txs: readonly FinTx[], from: number, to: number): FinTx[] =>
  txs.filter((x) => x.kind === "withdrawal" && !(lengthMs(x) > 0) && x.atMs >= from && x.atMs <= to);

/** The rate units the chart offers; $/min first (his main view). Factor converts cents/min → cents/unit. */
export const RATE_UNITS = [
  { id: "sec", label: "/sec", perMin: 1 / 60 },
  { id: "min", label: "/min", perMin: 1 },
  { id: "hr", label: "/hr", perMin: 60 },
  { id: "day", label: "/day", perMin: 1440 },
] as const;
export type RateUnitId = (typeof RATE_UNITS)[number]["id"];
export const rateIn = (centsPerMin: number, unit: RateUnitId): number => centsPerMin * (RATE_UNITS.find((u) => u.id === unit)?.perMin ?? 1);

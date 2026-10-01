/**
 * Financial-2525 · accrual — escrow releases $/min (operator 2026-09-30, v.000_r.001).
 * ====================================================================================================
 * "goal is to pay escrow that releases $/min into account that one can see and deposit as needed. for business they
 *  pay up front financials of 2 weeks or one month, and 3 hrs later individual can withdraw to their account if really
 *  in need of cash. Each transaction gets amount, Deposit day and time, and MoT length of time."
 *
 * THE STATE MACHINE, one deposit at a time:
 *   ESCROWED  — the payer put the whole amount in at `atMs` (the deposit day and time, CST);
 *   RELEASING — from `atMs` the escrow releases amount ÷ (MoT × 1440) per minute, linearly, for the MoT;
 *   RELEASED  — at `atMs + MoT` the whole amount has been released (the A.B..C of the deposit reads 3600.3600..3600);
 *   WITHDRAWABLE — what has been released may be withdrawn to the person's own account only from `atMs + 3 h`
 *                  (HOLD_MS); before that the released money is visible but not yet movable;
 *   a WITHDRAWAL is its own transaction (amount, day and time, MoT). From r.023 (operator addendum 39 + 55: "3600 +320 should accrue
 *                  $/min for 30.333 days; therefore transactions are also 30.333 days should be possible") a withdrawal with a MoT
 *                  runs OUT at $/min over that length, exactly as a deposit runs in; "One time" (a zero length) lands whole. It can
 *                  never take, at any minute, more than is withdrawable then.
 * THE 180-MINUTE RULE, in the operator's words (addendum 55): "If a deposit is 30.33 days then $/min is allocated. using that $/min at
 * 180 min should be in the bank to withdrawal only that amount , not the full deposit . this encourages stability and sustainable
 * thinking." — HOLD_MS below; what is withdrawable is what has accrued, never the deposit.
 * INVARIANTS (in the operator's terms): money released is never more than money deposited; a withdrawal never makes
 * the available balance negative; the rate is amount ÷ MoT-minutes and nothing else; the record is append-only.
 * Pure — every function takes the instant `t`; nothing here reads a clock. Amounts are integer cents.
 */
import { MIN_PER_DAY, MS_PER_DAY, perMin } from "./mot";
import type { Recurrence } from "./ladder";
import type { BudgetCategory } from "./budget";

export const HOLD_HOURS = 3;
export const HOLD_MS = HOLD_HOURS * 3600 * 1000;

export type TxKind = "deposit" | "withdrawal";
export interface FinTx {
  id: string;
  kind: TxKind;
  amountCents: number;   // > 0
  atMs: number;          // the deposit / withdrawal day and time (an instant; displayed in CST)
  motDays?: number;      // the length of time the money covers (30.333 for the worked example); a withdrawal runs out over it at $/min (r.023), 0 = lands whole
  memo?: string;         // "PENDING DIRECT DEPOSIT", "PAYROLL", …
  payer?: string;        // who put it in escrow (the employer, the business, the person)
  category?: BudgetCategory; // the personal-finance element (addendum 16): Income · Mortgage/Rent · Auto · Insurance · … — recorded, never required to accrue
  field?: string;            // the A–U ladder field (addendum 22: "B.rent_mortgage") — the category's successor; recorded, never required to accrue
  recurrence?: Recurrence;   // the transaction's timeline chosen at entry (addendum 22): once · weekly · days33 · month91 · yearly — its $/min runs from atMs for that length
}

export type DepositState = "pending" | "releasing" | "released";
export interface DepositView {
  tx: FinTx;
  state: DepositState;
  releasedCents: number;   // released so far at t
  escrowedCents: number;   // still in escrow at t
  ratePerMinCents: number; // amount ÷ (MoT × 1440)
  holdUntilMs: number;     // atMs + 3 h — before this, released money is visible but not withdrawable
  withdrawableCents: number; // released, if past the hold
  fraction: number;        // elapsed fraction of the MoT (0..1) — the A.B..C source
  endsMs: number;          // atMs + MoT
}

const motMs = (tx: FinTx): number => Math.max(0, tx.motDays ?? 0) * MS_PER_DAY;

/** How much of one deposit has been released at `t` — linear at $/min, clamped to the amount. */
export function releasedAt(tx: FinTx, t: number): number {
  if (tx.kind !== "deposit" || t < tx.atMs) return 0;
  const len = motMs(tx);
  if (len <= 0) return tx.amountCents;                          // a zero-length MoT releases at once
  const f = Math.min(1, (t - tx.atMs) / len);
  return Math.round(tx.amountCents * f);
}

/** How much of one withdrawal has gone out at `t` (r.023): linear at $/min over its MoT, clamped to the amount; a zero-length MoT
 *  ("One time") lands whole at its instant, as every withdrawal did before r.023. */
export function withdrawnAt(w: FinTx, t: number): number {
  if (w.kind !== "withdrawal" || t < w.atMs) return 0;
  const len = motMs(w);
  if (len <= 0) return w.amountCents;
  return Math.round(w.amountCents * Math.min(1, (t - w.atMs) / len));
}

/** One deposit's view at `t`. */
export function depositView(tx: FinTx, t: number): DepositView {
  const releasedCents = releasedAt(tx, t);
  const len = motMs(tx);
  const fraction = t < tx.atMs ? 0 : len <= 0 ? 1 : Math.min(1, (t - tx.atMs) / len);
  const holdUntilMs = tx.atMs + HOLD_MS;
  return {
    tx,
    state: t < tx.atMs ? "pending" : fraction >= 1 ? "released" : "releasing",
    releasedCents,
    escrowedCents: tx.amountCents - releasedCents,
    ratePerMinCents: tx.motDays && tx.motDays > 0 ? tx.amountCents / (tx.motDays * MIN_PER_DAY) : 0,
    holdUntilMs,
    withdrawableCents: t >= holdUntilMs ? releasedCents : 0,
    fraction,
    endsMs: tx.atMs + len,
  };
}

export interface Balance {
  depositedCents: number;    // every deposit at or before t
  escrowedCents: number;     // not yet released
  releasedCents: number;     // released so far (visible)
  withdrawableCents: number; // released AND past the 3 h hold
  withdrawnCents: number;    // what every withdrawal has taken out by t (at $/min over its MoT from r.023)
  availableCents: number;    // withdrawable − withdrawn (never negative on a valid record)
  ratePerMinCents: number;   // the live $/min: the sum over deposits still releasing
  deposits: DepositView[];
}
/** The whole record at `t`. */
export function balanceAt(txs: readonly FinTx[], t: number): Balance {
  const deposits = txs.filter((x) => x.kind === "deposit" && x.atMs <= t).map((x) => depositView(x, t));
  const withdrawnCents = txs.filter((x) => x.kind === "withdrawal" && x.atMs <= t).reduce((s, x) => s + withdrawnAt(x, t), 0);
  const depositedCents = deposits.reduce((s, d) => s + d.tx.amountCents, 0);
  const releasedCents = deposits.reduce((s, d) => s + d.releasedCents, 0);
  const withdrawableCents = deposits.reduce((s, d) => s + d.withdrawableCents, 0);
  return {
    depositedCents,
    escrowedCents: depositedCents - releasedCents,
    releasedCents,
    withdrawableCents,
    withdrawnCents,
    availableCents: Math.max(0, withdrawableCents - withdrawnCents),
    ratePerMinCents: deposits.filter((d) => d.state === "releasing").reduce((s, d) => s + d.ratePerMinCents, 0),
    deposits,
  };
}

/** A withdrawal is legal only if, at EVERY minute from its start, what all withdrawals have taken out stays within what has been
 *  released and is past the 180-minute mark (r.023). Both sides are piecewise linear between the record's breakpoints (each start, each
 *  180-minute mark, each end), and the withdrawable side only jumps UP (at a 180-minute mark), so checking each breakpoint and the
 *  instant just before it finds the first overdraw; the refusal names that instant (`atMs`) so the person can see when it would fail.
 *  Every record accepted before r.023 stays valid: a spread outflow is never above a lump one at any instant. */
export function validateWithdrawal(txs: readonly FinTx[], w: FinTx): { ok: true } | { ok: false; reason: "NOT_A_WITHDRAWAL" | "AMOUNT" | "HOLD" | "INSUFFICIENT"; availableCents: number; atMs?: number } {
  if (w.kind !== "withdrawal") return { ok: false, reason: "NOT_A_WITHDRAWAL", availableCents: 0 };
  if (!(w.amountCents > 0)) return { ok: false, reason: "AMOUNT", availableCents: 0 };
  const others = txs.filter((x) => x.id !== w.id);
  const b0 = balanceAt(others, w.atMs);
  if (b0.releasedCents > 0 && b0.withdrawableCents === 0) {
    const firstMark = Math.min(...b0.deposits.map((d) => d.holdUntilMs));
    return { ok: false, reason: "HOLD", availableCents: 0, atMs: firstMark };
  }
  const all = [...others, w];
  const marks = new Set<number>([w.atMs]);
  for (const x of all) { marks.add(x.atMs); marks.add(x.atMs + motMs(x)); if (x.kind === "deposit") marks.add(x.atMs + HOLD_MS); }
  const over = (t: number) => { const b = balanceAt(all, t); return b.withdrawnCents - b.withdrawableCents; };
  const pts = Array.from(marks).filter((t) => t >= w.atMs).sort((a, b) => a - b);
  let prev = w.atMs;
  for (const t of pts) {
    const probes = t > prev + 1 ? [t - 1, t] : [t];
    for (const p of probes) {
      if (over(p) > 0) {
        // the first minute it fails: both sides are linear on (prev, p], so step back to the crossing, rounded up to a whole minute
        const d0 = over(prev), d1 = over(p);
        const cross = d1 > d0 && d0 <= 0 ? prev + ((p - prev) * (0 - d0)) / (d1 - d0) : p;
        const atMs = Math.min(p, Math.ceil(cross / 60000) * 60000);
        return { ok: false, reason: "INSUFFICIENT", availableCents: balanceAt(others, w.atMs).availableCents, atMs: Math.max(w.atMs, atMs) };
      }
    }
    prev = t;
  }
  return { ok: true };
}

/** The chart's series: the balance sampled every `stepMs` from `fromMs` to `toMs` inclusive. */
export interface SeriesPoint { t: number; released: number; withdrawable: number; available: number; escrowed: number; ratePerMin: number }
export function series(txs: readonly FinTx[], fromMs: number, toMs: number, stepMs: number): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  if (!(stepMs > 0) || toMs < fromMs) return out;
  for (let t = fromMs; t <= toMs; t += stepMs) {
    const b = balanceAt(txs, t);
    out.push({ t, released: b.releasedCents, withdrawable: b.withdrawableCents, available: b.availableCents, escrowed: b.escrowedCents, ratePerMin: b.ratePerMinCents });
  }
  return out;
}

/** The worked example, as data: $3,604.49 · 2026-10-01 07:00 CST · MoT 30.333 days → $/min. */
export const exampleRatePerMin = (amountCents = 360449, motDays = 91 / 3): number => perMin(amountCents, motDays);

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
 *   a WITHDRAWAL is its own transaction (amount, day and time) and can never take more than is withdrawable then.
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
  motDays?: number;      // deposits only — the length of time the money covers (30.333 for the worked example)
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
  withdrawnCents: number;    // every withdrawal at or before t
  availableCents: number;    // withdrawable − withdrawn (never negative on a valid record)
  ratePerMinCents: number;   // the live $/min: the sum over deposits still releasing
  deposits: DepositView[];
}
/** The whole record at `t`. */
export function balanceAt(txs: readonly FinTx[], t: number): Balance {
  const deposits = txs.filter((x) => x.kind === "deposit" && x.atMs <= t).map((x) => depositView(x, t));
  const withdrawnCents = txs.filter((x) => x.kind === "withdrawal" && x.atMs <= t).reduce((s, x) => s + x.amountCents, 0);
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

/** A withdrawal is legal only against money released AND past the hold, net of earlier withdrawals. Says why when not. */
export function validateWithdrawal(txs: readonly FinTx[], w: FinTx): { ok: true } | { ok: false; reason: "NOT_A_WITHDRAWAL" | "AMOUNT" | "HOLD" | "INSUFFICIENT"; availableCents: number } {
  if (w.kind !== "withdrawal") return { ok: false, reason: "NOT_A_WITHDRAWAL", availableCents: 0 };
  if (!(w.amountCents > 0)) return { ok: false, reason: "AMOUNT", availableCents: 0 };
  const b = balanceAt(txs.filter((x) => x.id !== w.id), w.atMs);
  if (b.releasedCents > 0 && b.withdrawableCents === 0) return { ok: false, reason: "HOLD", availableCents: 0 };
  if (w.amountCents > b.availableCents) return { ok: false, reason: "INSUFFICIENT", availableCents: b.availableCents };
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

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
 *   WITHDRAWABLE — what has been released may be withdrawn at once (r.028, operator addendum 57: "there is no 180 min rule
 *                  (that was just example). if 2 hours later, 120 min at $/min should work.");
 *   a WITHDRAWAL is its own transaction (amount, day and time, MoT). From r.023 (operator addendum 39 + 55: "3600 +320 should accrue
 *                  $/min for 30.333 days; therefore transactions are also 30.333 days should be possible") a withdrawal with a MoT
 *                  runs OUT at $/min over that length, exactly as a deposit runs in; "One time" (a zero length) lands whole. It can
 *                  never take, at any minute, more than is withdrawable then.
 * NO HOLD (r.028, addendum 57): what is withdrawable is exactly what has accrued at $/min so far — never the deposit, and never
 * delayed. 2 hours after a deposit, 120 minutes × $/min can move.
 * INVARIANTS (in the operator's terms): money released is never more than money deposited; a withdrawal never makes
 * the available balance negative; the rate is amount ÷ MoT-minutes and nothing else; the record is append-only.
 * Pure — every function takes the instant `t`; nothing here reads a clock. Amounts are integer cents.
 */
import { MIN_PER_DAY, MS_PER_DAY, perMin } from "./mot";
import type { Recurrence } from "./ladder";
import type { BudgetCategory } from "./budget";

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
  corrects?: string;         // r.062 (addendum 133 "add edit feature for transaction record"): this entry CORRECTS the transaction with that id — the original stays on the record
  recurrence?: Recurrence;   // the transaction's timeline chosen at entry (addendum 22): once · weekly · days33 · month91 · yearly — its $/min runs from atMs for that length
}

export type DepositState = "pending" | "releasing" | "released";
export interface DepositView {
  tx: FinTx;
  state: DepositState;
  releasedCents: number;   // released so far at t
  escrowedCents: number;   // still in escrow at t
  ratePerMinCents: number; // amount ÷ (MoT × 1440)
  withdrawableCents: number; // released so far — no hold (r.028)
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
  return {
    tx,
    state: t < tx.atMs ? "pending" : fraction >= 1 ? "released" : "releasing",
    releasedCents,
    escrowedCents: tx.amountCents - releasedCents,
    ratePerMinCents: tx.motDays && tx.motDays > 0 ? tx.amountCents / (tx.motDays * MIN_PER_DAY) : 0,
    withdrawableCents: releasedCents,
    fraction,
    endsMs: tx.atMs + len,
  };
}

export interface Balance {
  depositedCents: number;    // every deposit at or before t
  escrowedCents: number;     // not yet released
  releasedCents: number;     // released so far (visible)
  withdrawableCents: number; // released so far (no hold, r.028)
  withdrawnCents: number;    // what every withdrawal has taken out by t (at $/min over its MoT from r.023)
  availableCents: number;    // withdrawable − withdrawn; below zero when spent AHEAD of accrual (r.066, addendum 142 "Up to all In Escrow")
  ratePerMinCents: number;   // the live $/min: the sum over deposits still releasing
  advanceCents: number;      // spent ahead of accrual: max(0, withdrawn − withdrawable) (r.066)
  netRatePerMinCents: number; // the rate left after the advance is spread over the rest of the releases: rate × (1 − advance ÷ escrow) (r.066, "Spread over rest")
  deposits: DepositView[];
}
/** The whole record at `t`. */
export function balanceAt(txs: readonly FinTx[], t: number): Balance {
  const deposits = txs.filter((x) => x.kind === "deposit" && x.atMs <= t).map((x) => depositView(x, t));
  const withdrawnCents = txs.filter((x) => x.kind === "withdrawal" && x.atMs <= t).reduce((s, x) => s + withdrawnAt(x, t), 0);
  const depositedCents = deposits.reduce((s, d) => s + d.tx.amountCents, 0);
  const releasedCents = deposits.reduce((s, d) => s + d.releasedCents, 0);
  const withdrawableCents = deposits.reduce((s, d) => s + d.withdrawableCents, 0);
  const rate = deposits.filter((d) => d.state === "releasing").reduce((s, d) => s + d.ratePerMinCents, 0);
  const advance = Math.max(0, withdrawnCents - withdrawableCents), escrowed = depositedCents - releasedCents;
  return {
    depositedCents,
    escrowedCents: depositedCents - releasedCents,
    releasedCents,
    withdrawableCents,
    withdrawnCents,
    availableCents: withdrawableCents - withdrawnCents,
    ratePerMinCents: rate,
    advanceCents: advance,
    netRatePerMinCents: escrowed > 0 ? rate * Math.max(0, 1 - advance / escrowed) : rate,
    deposits,
  };
}

/** A withdrawal is legal only if, at EVERY minute from its start, what all withdrawals have taken out stays within what has been
 *  released (r.023; no hold since r.028). Both sides are piecewise linear between the record's breakpoints (each start, each end),
 *  and the withdrawable side only jumps UP (a zero-length deposit landing whole), so checking each breakpoint and the
 *  instant just before it finds the first overdraw; the refusal names that instant (`atMs`) so the person can see when it would fail.
 *  Every record accepted before r.023 stays valid: a spread outflow is never above a lump one at any instant. */
export function validateWithdrawal(txs: readonly FinTx[], w: FinTx): { ok: true } | { ok: false; reason: "NOT_A_WITHDRAWAL" | "AMOUNT" | "INSUFFICIENT"; availableCents: number; atMs?: number } {
  if (w.kind !== "withdrawal") return { ok: false, reason: "NOT_A_WITHDRAWAL", availableCents: 0 };
  if (!(w.amountCents > 0)) return { ok: false, reason: "AMOUNT", availableCents: 0 };
  const others = txs.filter((x) => x.id !== w.id);
  const all = [...others, w];
  const marks = new Set<number>([w.atMs]);
  for (const x of all) { marks.add(x.atMs); marks.add(x.atMs + motMs(x)); }
  // r.066 (addendum 142 + his answer "Up to all In Escrow"): a spend may run AHEAD of accrual — it is refused only when, at some instant,
  // everything spent would pass every deposit recorded by then (released AND still in escrow); the accrual rate drops instead
  const over = (t: number) => { const b = balanceAt(all, t); return b.withdrawnCents - b.depositedCents; };
  const pts = Array.from(marks).filter((t) => t >= w.atMs).sort((a, b) => a - b);
  // walk the probes in time order, remembering the LAST probe that passed (r.026): between two probes the sides are linear unless the
  // later probe is a breakpoint whose instant before it passed — then the shortfall is a jump at that breakpoint (a lump landing), and
  // the refusal names that instant exactly. r.023 interpolated from the previous breakpoint across such a jump and could name a minute
  // with money still to spare.
  let okT = w.atMs, okD = over(w.atMs);
  const refuse = (atMs: number) => ({ ok: false as const, reason: "INSUFFICIENT" as const, availableCents: Math.max(0, balanceAt(others, w.atMs).depositedCents - balanceAt(others, w.atMs).withdrawnCents), atMs });
  if (okD > 0) return refuse(w.atMs);
  for (const t of pts) {
    for (const p of t - 1 > okT ? [t - 1, t] : [t]) {
      if (p <= okT) continue;
      const d = over(p);
      if (d > 0) {
        // a jump at a breakpoint is named at its instant; otherwise the FIRST WHOLE MINUTE after the last passing probe that is short
        // (both sides are linear there, so the shortfall only grows) — found by halving, never estimated across rounding
        if (p === t && okT === t - 1) return refuse(p);
        let a = Math.floor(okT / 60000) + 1, b = Math.floor(p / 60000);
        if (b < a || over(b * 60000) <= 0) return refuse(p);
        while (a < b) { const m = Math.floor((a + b) / 2); if (over(m * 60000) > 0) b = m; else a = m + 1; }
        return refuse(a * 60000);
      }
      okT = p; okD = d;
    }
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

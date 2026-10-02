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
  paidFrom?: string;         // r.067 (addendum 143 "payment selector … Card vs Debit Account"): a card id, or absent / "debit" = the Debit Account
  paysCard?: string;         // r.067: a Debit-Account payment that pays down that card (lowers its balance)
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
  escrowedCents: number;     // still in escrow — it DROPS at once by whatever is spent ahead (r.071, addendum 159)
  releasedCents: number;     // out of escrow so far: by time at $/min, and early when a spend runs ahead (r.071) — Available = Released − Spent
  withdrawableCents: number; // = released (no hold, r.028)
  withdrawnCents: number;    // what every withdrawal has taken out by t (at $/min over its MoT from r.023)
  availableCents: number;    // released − withdrawn; never below zero from r.071 (a spend ahead draws on escrow instead)
  ratePerMinCents: number;   // the schedule's $/min: the sum over deposits still releasing (amount ÷ MoT)
  advanceCents: number;      // released EARLY by spending ahead, so far: released − what time alone would have released (r.071)
  netRatePerMinCents: number; // the $/min escrow is releasing NOW — what is left of each deposit over the rest of its length (r.066 "Spread over rest", exact from r.071)
  deposits: DepositView[];
}

/** r.071 (addendum 159 "escrow should drop, while remaining funds get released … or find way to manage", with his r.066 answers "Up to all
 *  In Escrow" + "Spread over rest"): SPENDING AHEAD RELEASES EARLY FROM ESCROW. Whatever a withdrawal takes beyond what is available is drawn
 *  at once from the escrow of the deposits still releasing (in proportion to what each still holds), so In Escrow drops by it and Available
 *  never goes below zero; every deposit then releases what it has left over the rest of its own length — the lower $/min the card shows. A
 *  spread withdrawal running while nothing is available keeps drawing at its own rate. EXACT, not stepped: the record's events in time order,
 *  closed form between them — with nothing available and a spread outflow w above the release ρ, the total escrow falls at exactly w and
 *  every deposit keeps its share (its own linear run × the common factor (E₀ − wΔ) ÷ (E₀ − ρΔ)). Pure; cents (float) in, cents out. */
export function escrowAt(txs: readonly FinTx[], t: number): { escrowCents: number; availableCents: number; releasePerMinCents: number } {
  type Ev = { at: number; order: number; tx: FinTx; edge: "start" | "end" };
  const evs: Ev[] = [];
  for (const x of txs) {
    if (x.atMs > t || !(x.amountCents > 0)) continue;
    const len = motMs(x);
    // at one instant: money in before money out; a run's end before anything starts (its last cent is released or spent first)
    evs.push({ at: x.atMs, order: x.kind === "deposit" ? 1 : 2, tx: x, edge: "start" });
    if (len > 0 && x.atMs + len <= t) evs.push({ at: x.atMs + len, order: 0, tx: x, edge: "end" });
  }
  evs.sort((a, b) => a.at - b.at || a.order - b.order);
  const deps = new Map<string, { e: number; f: number }>();   // escrow left, and the instant its run ends
  const outs = new Map<string, number>();                     // spread withdrawals running: cents per ms
  let a = 0, cur = evs.length ? evs[0].at : t;
  const releasing = () => Array.from(deps.values()).filter((d) => d.e > 0 && d.f > cur);
  const advance = (to: number) => {
    while (cur < to) {
      const live = releasing();
      const rho = live.reduce((s, d) => s + d.e / (d.f - cur), 0);
      const w = Array.from(outs.values()).reduce((s, v) => s + v, 0);
      if (a > 1e-9 || w <= rho) {
        let end = to;
        if (w > rho) { const tz = cur + a / (w - rho); if (tz < to) end = tz; }   // what is available runs out before `to`
        for (const d of live) d.e *= (d.f - end) / (d.f - cur);
        a += (rho - w) * (end - cur);
        if (end < to) a = 0;
        cur = end;
      } else {
        // nothing available and the outflow above the release: escrow falls at w; each deposit keeps its share of what is left
        const dt = to - cur, E0 = live.reduce((s, d) => s + d.e, 0), G = E0 - rho * dt, E1 = E0 - w * dt;
        const k = G > 0 && E1 > 0 ? E1 / G : 0;
        for (const d of live) d.e *= ((d.f - to) / (d.f - cur)) * k;
        if (E1 < 0) a += E1;   // past every cent in escrow (a record the gate would have refused): the shortfall shows, never hides
        cur = to;
      }
    }
  };
  for (const ev of evs) {
    advance(ev.at);
    const x = ev.tx, len = motMs(x);
    if (ev.edge === "end") {
      if (x.kind === "deposit") { const d = deps.get(x.id); if (d) { a += d.e; deps.delete(x.id); } }   // a float crumb at the run's end is released
      else outs.delete(x.id);
      continue;
    }
    if (x.kind === "deposit") {
      if (len > 0) deps.set(x.id, { e: x.amountCents, f: x.atMs + len }); else a += x.amountCents;
    } else if (len > 0) {
      outs.set(x.id, x.amountCents / len);
    } else {
      a -= x.amountCents;
      if (a < 0) {
        // a one-time spend beyond what is available: the rest comes out of escrow NOW, from every deposit still releasing, by its share
        const live = releasing(), E = live.reduce((s, d) => s + d.e, 0), need = -a;
        if (E >= need) { for (const d of live) d.e *= 1 - need / E; a = 0; }
        else { for (const d of live) d.e = 0; a = E - need; }
      }
    }
  }
  advance(t);
  const live = releasing();
  return {
    escrowCents: live.reduce((s, d) => s + d.e, 0),
    availableCents: a,
    releasePerMinCents: live.reduce((s, d) => s + d.e / (d.f - t), 0) * 60_000,
  };
}

/** The whole record at `t`. */
export function balanceAt(txs: readonly FinTx[], t: number): Balance {
  const deposits = txs.filter((x) => x.kind === "deposit" && x.atMs <= t).map((x) => depositView(x, t));
  const withdrawnCents = txs.filter((x) => x.kind === "withdrawal" && x.atMs <= t).reduce((s, x) => s + withdrawnAt(x, t), 0);
  const depositedCents = deposits.reduce((s, d) => s + d.tx.amountCents, 0);
  const byTime = deposits.reduce((s, d) => s + d.releasedCents, 0);
  const rate = deposits.filter((d) => d.state === "releasing").reduce((s, d) => s + d.ratePerMinCents, 0);
  // r.071: escrow and available from the exact spend-ahead run; Released is what has left escrow, so Available = Released − Spent exactly
  const run = escrowAt(txs, t);
  const availableCents = Math.round(run.availableCents) === 0 ? 0 : Math.round(run.availableCents);   // never a "−$0.00"
  const releasedCents = availableCents + withdrawnCents;
  return {
    depositedCents,
    escrowedCents: Math.max(0, Math.round(run.escrowCents)),
    releasedCents,
    withdrawableCents: releasedCents,
    withdrawnCents,
    availableCents,
    ratePerMinCents: rate,
    advanceCents: Math.max(0, releasedCents - byTime),
    netRatePerMinCents: run.releasePerMinCents,
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

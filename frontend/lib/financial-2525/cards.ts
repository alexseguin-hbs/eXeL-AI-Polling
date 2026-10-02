/**
 * Financial-2525 · CREDIT CARDS IN THE COCKPIT (r.067 — addenda 142 · 143 · 144, operator 2026-10-02: "in think we credit card widget" ·
 * "a read view where Incan see Capital One and USAA card and toggle between two" · "payment and transaction must have payment selector
 * added for Card vs Debit Account" · "a cockpit view for managing a single place of all finances that gives warnings of credit card
 * overspend"; his answers: limit · balance · available; figures + chart; card buys count against BOTH the card and Available at once;
 * Capital One starts at $735.27 after the $2,450 payment (that payment counts only against the Debit Account); warnings are user
 * defined — his: amber at $1,500 (50%) and red at $2,000 (67%) of the $3,000 card).
 *
 * A card's balance at t = its opening balance (as of its opening instant) + every withdrawal PAID FROM that card after the opening
 * − every Debit-Account payment that NAMES that card (paysCard) after the opening. Pure: no clock, no storage, cents throughout.
 * Never holds an account number — only the name the person types, a limit and the levels he sets.
 */
import type { FinTx } from "./accrual";

export interface Card { id: string; name: string; limitCents: number; openingCents: number; openingAtMs: number; amberCents: number; redCents: number }
export type CardLevel = "ok" | "amber" | "red" | "over";
export const DEBIT = "debit";

/** His two cards as of addendum 142/143 (2026-10-02 04:39 CST): Capital One $735.27 of $3,000 (amber $1,500 · red $2,000, his levels);
 *  USAA $0 of $1,000 (amber 50% · red 67%, the same proportions until he sets his own). */
export const OPENING_AT = Date.UTC(2026, 9, 2, 10, 39, 0);   // 2026.10.02_04.39..00 CST
export const CARD_SEED: readonly Card[] = [
  { id: "capone", name: "Capital One", limitCents: 300000, openingCents: 73527, openingAtMs: OPENING_AT, amberCents: 150000, redCents: 200000 },
  { id: "usaa", name: "USAA", limitCents: 100000, openingCents: 0, openingAtMs: OPENING_AT, amberCents: 50000, redCents: 67000 },
];

/** Charges and payments that move a card, in time order. */
export function cardMoves(card: Card, txs: readonly FinTx[]): { t: number; deltaCents: number; tx: FinTx }[] {
  const out: { t: number; deltaCents: number; tx: FinTx }[] = [];
  for (const x of txs) {
    if (x.kind !== "withdrawal" || x.atMs <= card.openingAtMs) continue;
    if (x.paidFrom === card.id) out.push({ t: x.atMs, deltaCents: x.amountCents, tx: x });
    else if ((x.paidFrom ?? DEBIT) === DEBIT && x.paysCard === card.id) out.push({ t: x.atMs, deltaCents: -x.amountCents, tx: x });
  }
  return out.sort((a, b) => a.t - b.t);
}
/** The card's balance at t (cents; can pass the limit — the warning says so, nothing is refused). */
export function cardBalanceAt(card: Card, txs: readonly FinTx[], t: number): number {
  let b = card.openingCents;
  for (const m of cardMoves(card, txs)) if (m.t <= t) b += m.deltaCents;
  return b;
}
/** The level the person set, read against the balance: ok · amber (≥ amber) · red (≥ red) · over (≥ limit). */
export function cardLevel(card: Card, balanceCents: number): CardLevel {
  if (balanceCents >= card.limitCents) return "over";
  if (balanceCents >= card.redCents) return "red";
  if (balanceCents >= card.amberCents) return "amber";
  return "ok";
}
/** The balance as a step series from the opening to `to` (for the card's chart). */
export function cardSeries(card: Card, txs: readonly FinTx[], to: number): { t: number; v: number }[] {
  const pts = [{ t: card.openingAtMs, v: card.openingCents }];
  let b = card.openingCents;
  for (const m of cardMoves(card, txs)) { if (m.t > to) break; b += m.deltaCents; pts.push({ t: m.t, v: b }); }
  pts.push({ t: Math.max(to, card.openingAtMs + 60_000), v: b });
  return pts;
}
/** A card is valid when its numbers make sense: a name, a positive limit, amber ≤ red ≤ limit, levels and opening not negative. */
export function validCard(c: Card): boolean {
  return !!c.name.trim() && c.limitCents > 0 && c.openingCents >= 0 && c.amberCents >= 0 && c.amberCents <= c.redCents && c.redCents <= c.limitCents && Number.isFinite(c.openingAtMs);
}
/** Saved cards merged with the seed by id (a seed card the person never touched still arrives; his edits win). */
export function mergeCards(saved: unknown, seed: readonly Card[] = CARD_SEED): Card[] {
  const list = Array.isArray(saved) ? (saved as Card[]).filter((c) => c && typeof c.id === "string" && validCard(c)) : [];
  const ids = new Set(list.map((c) => c.id));
  return [...list, ...seed.filter((c) => !ids.has(c.id))];
}
/** The seed a person starts from: HIS two cards only for the operator (his balances are never shown to anyone else — AsM review r.067,
 *  Thor); everyone else starts with none. */
export const seedFor = (operator: boolean): Card[] => (operator ? CARD_SEED.map((c) => ({ ...c })) : []);
/** COUNT ONCE (his answer 2026-10-02, AsM review #5): a card purchase already counted against Available when it was made, so a later
 *  Debit-Account payment that names the card counts only for the part that pays down balance no recorded purchase has counted yet (the
 *  opening balance, his $735.27). The accrual view of the record: each such payment's amount reduced to that uncounted part (dropped
 *  when nothing is left). The record itself is untouched; the card balance still uses the full payment. Pure. */
export function accrualTxs(txs: readonly FinTx[]): FinTx[] {
  const pool = new Map<string, number>();   // per card: recorded purchases not yet paid down
  const out: FinTx[] = [];
  for (const x of [...txs].sort((a, b) => a.atMs - b.atMs)) {
    if (x.kind === "withdrawal" && x.paidFrom && x.paidFrom !== DEBIT) { pool.set(x.paidFrom, (pool.get(x.paidFrom) ?? 0) + x.amountCents); out.push(x); continue; }
    if (x.kind === "withdrawal" && (x.paidFrom ?? DEBIT) === DEBIT && x.paysCard) {
      const p = pool.get(x.paysCard) ?? 0, covered = Math.min(p, x.amountCents);
      pool.set(x.paysCard, p - covered);
      if (x.amountCents - covered > 0) out.push({ ...x, amountCents: x.amountCents - covered });
      continue;
    }
    out.push(x);
  }
  return out;
}
export const CARDS_KEY = (owner: string) => `fin-cards:${owner}`;

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

/** r.070 (addendum 157 "allow user to set up their own CC (don't default Capital One and USAA)"): NO card is seeded, for anyone — each person
 *  adds their own. A card someone already saved stays theirs (a saved copy is never discarded); nothing in the code puts a card on a device. */

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
/** r.070 (addendum 157, AsM Thor): a card is named, never numbered — a "name" carrying more than six digits looks like a card or account
 *  number and is refused (a last-four such as "Chase 1234" is fine). */
const ANY_DIGIT = new RegExp("\\p{Nd}", "gu");   // every script's digits, not only 0–9 (AsM, Thor)
export const looksLikeCardNumber = (name: string): boolean => (name.match(ANY_DIGIT)?.length ?? 0) > 6;
/** A card is valid when its numbers make sense: a name (not a number), a positive limit, amber ≤ red ≤ limit, levels and opening not negative. */
export function validCard(c: Card): boolean {
  return !!c.name.trim() && !looksLikeCardNumber(c.name) && [c.limitCents, c.openingCents, c.amberCents, c.redCents].every(Number.isFinite) && c.limitCents > 0 && c.openingCents >= 0 && c.amberCents >= 0 && c.amberCents <= c.redCents && c.redCents <= c.limitCents && Number.isFinite(c.openingAtMs);
}
/** r.070 (addendum 157): a card the person sets up — name, limit and balance as of now; an amber or red level left out takes his proportions —
 *  half the limit and two-thirds of it (his $1,500 and $2,000 on a $3,000 card; "67 %" was his rounding of two-thirds). Returns null when the card would not be valid (nothing half-made is ever saved). Pure. */
export function newCard(input: { name: string; limitCents: number; openingCents?: number; amberCents?: number; redCents?: number }, nowMs: number, id: string): Card | null {
  const limitCents = Math.round(input.limitCents);
  const c: Card = { id, name: input.name.trim(), limitCents, openingCents: Math.round(input.openingCents ?? 0), openingAtMs: nowMs, amberCents: Math.round(input.amberCents ?? limitCents * 0.5), redCents: Math.round(input.redCents ?? (limitCents * 2) / 3) };
  return Number.isFinite(limitCents) && validCard(c) ? c : null;
}
/** r.070 (found by the touch walk): a new card's id is unique among the person's cards — two cards set up within the same second never share
 *  one (a shared id made the second card unreachable and a removal take both). Pure. */
export function uniqueCardId(cards: readonly Card[], nowMs: number): string {
  const base = `c-${Math.round(nowMs).toString(36)}`;
  let id = base, n = 1;
  while (cards.some((c) => c.id === id)) id = `${base}-${n++}`;
  return id;
}
/** r.070 (AsM review, Enki — a real defect since r.067): the card's settings saved. A balance left exactly as shown keeps the card's opening
 *  AND its date, so no purchase or payment since the opening is ever counted twice; only a balance the person changed re-bases the card at
 *  now. Returns null when the result would not be a valid card. Pure. */
export function applyCardSettings(card: Card, edit: { name: string; limitCents: number; amberCents: number; redCents: number; openingCents: number }, balanceNowCents: number, nowMs: number): Card | null {
  const c: Card = { ...card, name: edit.name.trim(), limitCents: edit.limitCents, amberCents: edit.amberCents, redCents: edit.redCents, ...(edit.openingCents === balanceNowCents ? {} : { openingCents: edit.openingCents, openingAtMs: nowMs }) };
  return validCard(c) ? c : null;
}
/** Saved cards, validated, merged with a seed by id when one is passed (none is, from r.070: addendum 157). */
export function mergeCards(saved: unknown, seed: readonly Card[] = []): Card[] {
  const list = Array.isArray(saved) ? (saved as Card[]).filter((c) => c && typeof c.id === "string" && validCard(c)) : [];
  const ids = new Set(list.map((c) => c.id));
  return [...list, ...seed.filter((c) => !ids.has(c.id))];
}
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

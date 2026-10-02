#!/usr/bin/env node
/**
 * Financial-2525 · 144 AsM CARD SCENARIOS (operator 2026-10-02, addendum 155: "implement, SSSES, AsM, and Spiral test"; addendum 153: "a new
 * CC transaction should increase CC BALANCE AND a payment towards CC should reduce available and reduce CC BALANCE"). The twelve reviewer-users
 * (the twelve AsM) × twelve credit-card scenarios, run through the REAL pure modules (lib/financial-2525/cards.ts + accrual.ts) — the card
 * twin of scripts/fin-asm-144.mjs. Each scenario states what must happen and passes only if the code does exactly that. Limits, balances and
 * amounts are seeded per AsM so no two users run the same numbers; every user's levels sit at 50 % (amber) and 67 % (red) of their limit,
 * the operator's own proportions.
 * Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/fin-asm-cards-144.mjs [--json out.json]
 */
const K = await import("../lib/financial-2525/cards.ts");
const A = await import("../lib/financial-2525/accrual.ts");
const M = await import("../lib/financial-2525/mot.ts");
const ASM = ["Aset", "Asar", "Athena", "Christo", "Enki", "Enlil", "Krishna", "Odin", "Pangu", "Sofia", "Thoth", "Thor"];
const HOUR = 3600000, MONTH = 30;
const at = (s) => M.parseStampCST(s);
const results = [];
for (const [ai, who] of ASM.entries()) {
  const t0 = at("2026.10.02_06.00..00") + ai * HOUR;
  const L = 200000 + ai * 25000;                          // limit, cents
  const card = { id: `${who}-cc`, name: `${who} card`, limitCents: L, openingCents: 30000 + ai * 7311, openingAtMs: t0, amberCents: Math.round(L * 0.5), redCents: Math.round(L * 0.67) };
  const O = card.openingCents, P = 41000 + ai * 1777, Y = 9000 + ai * 613;
  const pay = { id: `${who}-d1`, kind: "deposit", amountCents: 380000 + ai * 9999, atMs: t0 - 24 * HOUR, motDays: MONTH };
  const buy = (id, cents, ms) => ({ id: `${who}-${id}`, kind: "withdrawal", amountCents: cents, atMs: ms, motDays: 0, paidFrom: card.id });
  const payCard = (id, cents, ms, field = "I.cards_student") => ({ id: `${who}-${id}`, kind: "withdrawal", amountCents: cents, atMs: ms, motDays: 0, field, paysCard: card.id });
  // r.071 (addendum 159): a spend ahead draws on escrow instead of pushing Available below zero, so "counted once" is measured on what is LEFT —
  // Available + In Escrow (= deposited − counted spending) — never on Available alone
  const avail = (txs, ms) => { const b = A.balanceAt(K.accrualTxs(txs), ms); return b.availableCents + b.escrowedCents; };
  const S = [];
  const add = (name, expect, pass, note = "") => S.push({ asm: who, n: S.length + 1, name, expect, pass: !!pass, note });
  const b1 = buy("b1", P, t0 + HOUR), p1 = payCard("p1", Y, t0 + 2 * HOUR);
  // 1 · a card purchase raises the card balance (addendum 153 "a new CC transaction should increase CC BALANCE")
  { const v = K.cardBalanceAt(card, [pay, b1], t0 + 90 * 60000); add("purchase raises the card balance", "balance = opening + purchase", v === O + P, `${v}¢`); }
  // 2 · it counts against Available once, at purchase (his answer "At purchase (once)")
  { const d = avail([pay], t0 + 90 * 60000) - avail([pay, b1], t0 + 90 * 60000); add("purchase lowers what is left once", "Available + In Escrow drops by the purchase", Math.abs(d - P) <= 1, `${d}¢`); }
  // 3 · a Debit-Account payment that names the card lowers the card balance (addendum 153)
  { const v = K.cardBalanceAt(card, [pay, b1, p1], t0 + 3 * HOUR); add("payment lowers the card balance", "balance = opening + purchase − payment", v === O + P - Y, `${v}¢`); }
  // 4 · count once: a payment covered by recorded purchases does not lower Available again
  { const d = avail([pay, b1], t0 + 3 * HOUR) - avail([pay, b1, p1], t0 + 3 * HOUR); add("covered payment counted once", "what is left unchanged by the payment", Math.abs(d) <= 1, `${d}¢`); }
  // 5 · paying the opening balance (no recorded purchase counted it) lowers Available (addendum 153 "reduce available")
  { const p = payCard("p5", O, t0 + HOUR); const d = avail([pay], t0 + 2 * HOUR) - avail([pay, p], t0 + 2 * HOUR); add("paying the opening balance lowers what is left", "Available + In Escrow drops by the opening", Math.abs(d - O) <= 1 && K.cardBalanceAt(card, [pay, p], t0 + 2 * HOUR) === 0, `${d}¢`); }
  // 6 · a payment larger than the recorded purchases lowers Available only by the excess
  { const X = 1234 + ai, p = payCard("p6", P + X, t0 + 2 * HOUR); const d = avail([pay, b1], t0 + 3 * HOUR) - avail([pay, b1, p], t0 + 3 * HOUR); add("payment beyond purchases counts the excess", "what is left drops by the excess only", Math.abs(d - X) <= 1, `${d}¢`); }
  // 7 · a payment on any field still pays the card (r.068: the picker on every Debit withdrawal)
  { const p = payCard("p7", Y, t0 + 2 * HOUR, "B.rent_mortgage"); const v = K.cardBalanceAt(card, [pay, b1, p], t0 + 3 * HOUR); add("payment on any field pays the card", "balance = opening + purchase − payment", v === O + P - Y, `${v}¢`); }
  // 8 · below the amber line there is no alert
  add("no alert below amber", "ok", K.cardLevel(card, card.amberCents - 1) === "ok");
  // 9 · Amber Alert from exactly the amber line until the red line (addendum 155 key "Amber Alert")
  add("Amber Alert at the amber line", "amber at amber and just under red", K.cardLevel(card, card.amberCents) === "amber" && K.cardLevel(card, card.redCents - 1) === "amber");
  // 10 · Red Alert from exactly the red line until the limit (addendum 155 key "Red Alert")
  add("Red Alert at the red line", "red at red and just under the limit", K.cardLevel(card, card.redCents) === "red" && K.cardLevel(card, L - 1) === "red");
  // 11 · past the limit is shown as over, never refused — the warning says so, the record keeps the purchase
  { const big = buy("b11", L, t0 + HOUR); const v = K.cardBalanceAt(card, [pay, big], t0 + 2 * HOUR); add("over the limit is shown, never refused", "over, balance past the limit", v > L && K.cardLevel(card, v) === "over", `${v}¢`); }
  // 12 · the settings: levels out of order refused; a new balance-as-of-today counts nothing before it; a person's edit wins; others start empty
  { const reb = { ...card, openingCents: 5000, openingAtMs: t0 + 4 * HOUR };
    const edited = { ...card, limitCents: L + 50000 };
    const merged = K.mergeCards([edited], [card, { ...card, id: `${who}-cc2` }]);
    const ok = K.validCard(card) && !K.validCard({ ...card, amberCents: card.redCents + 1 }) && !K.validCard({ ...card, redCents: L + 1 }) && !K.validCard({ ...card, openingCents: -1 })
      && K.cardBalanceAt(reb, [pay, b1, p1], t0 + 5 * HOUR) === 5000
      && merged.length === 2 && merged[0].limitCents === L + 50000 && K.mergeCards(null).length === 0 && K.seedFor === undefined
      && K.newCard({ name: `${who} new`, limitCents: L }, t0, "n1")?.amberCents === Math.round(L * 0.5) && K.newCard({ name: "4111 1111 1111 1111", limitCents: L }, t0, "n2") === null
      && (() => { const txs = [pay, b1, p1], now = t0 + 3 * HOUR, bal = K.cardBalanceAt(card, txs, now); const k = K.applyCardSettings(card, { name: card.name, limitCents: L, amberCents: card.amberCents, redCents: card.redCents, openingCents: bal }, bal, now); return !!k && K.cardBalanceAt(k, txs, now) === bal; })();
    add("settings refuse, re-base, merge and set up", "out of order refused · re-base counts nothing before · edit wins · nobody starts with a card · a new card takes 50 % amber · a card number is refused as a name · saving the levels never counts a move twice", ok); }
  results.push(...S);
}
const passed = results.filter((r) => r.pass).length;
for (const who of ASM) { const s = results.filter((r) => r.asm === who); console.log(`${who.padEnd(8)} ${s.filter((r) => r.pass).length}/12  ${s.filter((r) => !r.pass).map((r) => "FAIL#" + r.n + " " + r.name + " " + r.note).join(" · ")}`); }
console.log(`\nfin-asm-cards-144: ${passed}/${results.length} card scenarios behaved exactly as stated`);
const j = process.argv.indexOf("--json"); if (j > 0) { const fs = await import("node:fs"); fs.writeFileSync(process.argv[j + 1], JSON.stringify({ revision: "0.071", passed, total: results.length, results }, null, 1)); }
process.exit(passed === results.length ? 0 : 1);

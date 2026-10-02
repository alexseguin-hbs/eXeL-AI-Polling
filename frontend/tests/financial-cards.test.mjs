// financial-cards — THE COCKPIT'S CREDIT CARDS (operator 2026-10-02, addenda 142–144 + his answers): a card's balance = its opening
// (as of its opening instant) + purchases PAID FROM it − Debit-Account payments that NAME it; his levels amber $1,500 / red $2,000 on
// the $3,000 Capital One; a card purchase also counts against Available (it is a withdrawal like any other).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/financial-cards.test.mjs
const K = await import("../lib/financial-2525/cards.ts");
const A = await import("../lib/financial-2525/accrual.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const [cap, usaa] = K.CARD_SEED;
ok(cap.name === "Capital One" && cap.limitCents === 300000 && cap.openingCents === 73527 && cap.amberCents === 150000 && cap.redCents === 200000, "seed: Capital One $735.27 of $3,000, amber $1,500 (50%), red $2,000 (67%) — his numbers");
ok(usaa.name === "USAA" && usaa.limitCents === 100000 && usaa.openingCents === 0, "seed: USAA $0 of $1,000");
const t0 = cap.openingAtMs, H = 3600000;
const buy = { id: "b1", kind: "withdrawal", amountCents: 12000, atMs: t0 + H, paidFrom: "capone" };
const pay = { id: "p1", kind: "withdrawal", amountCents: 50000, atMs: t0 + 2 * H, paysCard: "capone" };
const old = { id: "o1", kind: "withdrawal", amountCents: 245000, atMs: t0 - 86400000, memo: "Credit Card Payment" };
const usaaBuy = { id: "u1", kind: "withdrawal", amountCents: 7232, atMs: t0 + 3 * H, paidFrom: "usaa" };
const txs = [old, buy, pay, usaaBuy];
ok(K.cardBalanceAt(cap, txs, t0) === 73527, "the $2,450 payment before the opening does not move the card (his answer: it counts only against the Debit Account)");
ok(K.cardBalanceAt(cap, txs, t0 + H) === 85527, "a $120 purchase paid from Capital One raises its balance to $855.27");
ok(K.cardBalanceAt(cap, txs, t0 + 2 * H) === 35527, "a $500 Debit-Account payment that names Capital One lowers it to $355.27");
ok(K.cardBalanceAt(usaa, txs, t0 + 4 * H) === 7232 && K.cardBalanceAt(cap, [usaaBuy], t0 + 4 * H) === 73527, "a USAA purchase moves only USAA");
ok(K.cardLevel(cap, 149999) === "ok" && K.cardLevel(cap, 150000) === "amber" && K.cardLevel(cap, 200000) === "red" && K.cardLevel(cap, 300000) === "over", "levels: below $1,500 OK · $1,500 amber · $2,000 red · $3,000 over limit");
{ const b = A.balanceAt([{ id: "d", kind: "deposit", amountCents: 392449, atMs: t0 - H, motDays: 30 }, buy], t0 + H); ok(b.withdrawnCents === 12000, "his answer 'Both, right away': a card purchase also counts against Available at once"); }
{ const s = K.cardSeries(cap, txs, t0 + 5 * H); ok(s[0].v === 73527 && s[s.length - 1].v === 35527 && s.every((p, i) => i === 0 || p.t >= s[i - 1].t), "the balance series runs from the opening to now, in time order"); }
ok(K.validCard(cap) && !K.validCard({ ...cap, amberCents: 250000 }) && !K.validCard({ ...cap, redCents: 400000 }) && !K.validCard({ ...cap, name: " " }), "a card is valid only with a name and amber ≤ red ≤ limit");
{ const m = K.mergeCards([{ ...cap, amberCents: 100000 }]); ok(m.length === 2 && m[0].amberCents === 100000 && m[1].id === "usaa", "saved edits win; a seed card he never touched still arrives"); }
ok(K.mergeCards("junk").length === 2 && K.mergeCards([{ id: 3 }]).length === 2, "a damaged saved copy falls back to the seed");
// COUNT ONCE (his answer): buy $120 on the card, pay $120 to it from Debit → Available drops $120 in all; paying the $735.27 opening counts
{ const d = { id: "d", kind: "deposit", amountCents: 392449, atMs: t0 - H, motDays: 30 };
  const b120 = { id: "b", kind: "withdrawal", amountCents: 12000, atMs: t0 + H, paidFrom: "capone" }, p120 = { id: "p", kind: "withdrawal", amountCents: 12000, atMs: t0 + 2 * H, paysCard: "capone" };
  const v = K.accrualTxs([d, b120, p120]); const w = A.balanceAt(v, t0 + 3 * H).withdrawnCents;
  ok(w === 12000 && K.cardBalanceAt(cap, [b120, p120], t0 + 3 * H) === 73527, `count once: a $120 purchase then a $120 payment lowers Available $120 in all and leaves the card at its opening — got ${w}`);
  const p800 = { ...p120, id: "p8", amountCents: 80000 }; const w2 = A.balanceAt(K.accrualTxs([d, b120, p800]), t0 + 3 * H).withdrawnCents;
  ok(w2 === 80000, `paying $800 after a $120 purchase counts $120 (purchase) + $680 (the opening balance paid down) = $800 — got ${w2}`); }
const src = (await import("node:fs")).readFileSync(new URL("../lib/financial-2525/cards.ts", import.meta.url), "utf8");
ok(!/account(Number|No)|routing|cvv|pan\b/i.test(src.replace(/Never holds an account number/, "")), "the card holds no account number, routing number or security code — only a name, a limit and his levels");
console.log(`\nfinancial-cards: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

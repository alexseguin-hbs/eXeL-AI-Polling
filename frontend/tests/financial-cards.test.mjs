// financial-cards — THE COCKPIT'S CREDIT CARDS (operator 2026-10-02, addenda 142–144 + his answers): a card's balance = its opening
// (as of its opening instant) + purchases PAID FROM it − Debit-Account payments that NAME it; his levels amber $1,500 / red $2,000 on
// the $3,000 Capital One; a card purchase also counts against Available (it is a withdrawal like any other).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/financial-cards.test.mjs
const K = await import("../lib/financial-2525/cards.ts");
const A = await import("../lib/financial-2525/accrual.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
// r.070 (addendum 157 "allow user to set up their own CC (don't default Capital One and USAA)"): nothing is seeded — these are TEST fixtures,
// set up through newCard exactly as a person would (his numbers, kept only here as the example)
const T0 = Date.UTC(2026, 9, 2, 10, 39, 0);
const cap = K.newCard({ name: "Capital One", limitCents: 300000, openingCents: 73527, amberCents: 150000, redCents: 200000 }, T0, "capone");
const usaa = K.newCard({ name: "USAA", limitCents: 100000 }, T0, "usaa");
ok(K.CARD_SEED === undefined && K.seedFor === undefined && K.mergeCards(null).length === 0 && K.mergeCards(undefined).length === 0, "no card is seeded for anyone — a person starts with none (addendum 157)");
ok(cap && cap.name === "Capital One" && cap.limitCents === 300000 && cap.openingCents === 73527 && cap.amberCents === 150000 && cap.redCents === 200000 && cap.openingAtMs === T0, "set up: Capital One $735.27 of $3,000, amber $1,500, red $2,000 — the balance dated now");
ok(usaa && usaa.openingCents === 0 && usaa.amberCents === 50000 && usaa.redCents === 66667, "set up with the levels left blank: amber half, red two-thirds of the limit (his proportions)");
{ const c3 = K.newCard({ name: "Capital One", limitCents: 300000 }, T0, "c3"); ok(c3 && c3.amberCents === 150000 && c3.redCents === 200000, "a $3,000 card left blank gets exactly his $1,500 amber and $2,000 red"); }
ok(K.newCard({ name: "", limitCents: 100000 }, T0, "x") === null && K.newCard({ name: "Visa", limitCents: 0 }, T0, "x") === null && K.newCard({ name: "Visa", limitCents: 100000, amberCents: 90000, redCents: 80000 }, T0, "x") === null, "a card without a name, without a limit or with amber above red is never made");
ok(K.newCard({ name: "4111 1111 1111 1111", limitCents: 100000 }, T0, "x") === null && K.newCard({ name: "Acct 12345678", limitCents: 100000 }, T0, "x") === null && K.newCard({ name: "Chase 1234", limitCents: 100000 }, T0, "x") !== null && K.looksLikeCardNumber("5500-0000-0000-0004") && !K.looksLikeCardNumber("Visa 2026"), "a card is named, never numbered: a card or account number is refused as a name; a last-four is fine");
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
{ const m = K.mergeCards([{ ...cap, amberCents: 100000 }]); ok(m.length === 1 && m[0].amberCents === 100000, "a saved card is kept exactly as the person left it — nothing is added to it"); }
{ const m = K.mergeCards([{ ...cap, amberCents: 100000 }], [cap, usaa]); ok(m.length === 2 && m[0].amberCents === 100000 && m[1].id === "usaa", "when a seed IS passed (none is, from r.070) saved edits still win by id"); }
ok(K.mergeCards("junk").length === 0 && K.mergeCards([{ id: 3 }]).length === 0 && K.mergeCards([{ ...cap, name: "4111111111111111" }]).length === 0, "a damaged saved copy, or a card named with a number, yields no card — never a default");
// COUNT ONCE (his answer): buy $120 on the card, pay $120 to it from Debit → Available drops $120 in all; paying the $735.27 opening counts
{ const d = { id: "d", kind: "deposit", amountCents: 392449, atMs: t0 - H, motDays: 30 };
  const b120 = { id: "b", kind: "withdrawal", amountCents: 12000, atMs: t0 + H, paidFrom: "capone" }, p120 = { id: "p", kind: "withdrawal", amountCents: 12000, atMs: t0 + 2 * H, paysCard: "capone" };
  const v = K.accrualTxs([d, b120, p120]); const w = A.balanceAt(v, t0 + 3 * H).withdrawnCents;
  ok(w === 12000 && K.cardBalanceAt(cap, [b120, p120], t0 + 3 * H) === 73527, `count once: a $120 purchase then a $120 payment lowers Available $120 in all and leaves the card at its opening — got ${w}`);
  const p800 = { ...p120, id: "p8", amountCents: 80000 }; const w2 = A.balanceAt(K.accrualTxs([d, b120, p800]), t0 + 3 * H).withdrawnCents;
  ok(w2 === 80000, `paying $800 after a $120 purchase counts $120 (purchase) + $680 (the opening balance paid down) = $800 — got ${w2}`); }
// r.070 (AsM review, Enki): the settings save — a balance left as shown keeps the opening AND its date (no move counted twice); a changed one re-bases at now
{ const card = K.newCard({ name: "Visa", limitCents: 300000, openingCents: 73527, amberCents: 150000, redCents: 200000 }, T0, "v");
  const b1 = { id: "vb", kind: "withdrawal", amountCents: 80000, atMs: T0 + H, paidFrom: "v" }, b2 = { id: "vb2", kind: "withdrawal", amountCents: 50000, atMs: T0 + 2 * H, paidFrom: "v" };
  const now = T0 + 3 * H, bal = K.cardBalanceAt(card, [b1, b2], now);
  const kept = K.applyCardSettings(card, { name: "Visa", limitCents: 300000, amberCents: 200000, redCents: 200000, openingCents: bal }, bal, now);
  ok(bal === 203527 && kept && K.cardBalanceAt(kept, [b1, b2], now) === 203527 && kept.openingAtMs === T0 && kept.openingCents === 73527, `saving the levels with the balance untouched keeps $2,035.27 — got ${kept && K.cardBalanceAt(kept, [b1, b2], now)}`);
  const reb = K.applyCardSettings(card, { name: "Visa", limitCents: 300000, amberCents: 150000, redCents: 200000, openingCents: 100000 }, bal, now);
  ok(reb && reb.openingAtMs === now && K.cardBalanceAt(reb, [b1, b2], now) === 100000, "a balance the person changes re-bases the card at now: the moves before it are inside it");
  ok(K.applyCardSettings(card, { name: "Visa", limitCents: 300000, amberCents: 250000, redCents: 200000, openingCents: bal }, bal, now) === null && K.applyCardSettings(card, { name: "1234 5678 9012", limitCents: 300000, amberCents: 1, redCents: 2, openingCents: bal }, bal, now) === null, "an invalid save (amber above red, or a number for a name) changes nothing"); }
ok(K.looksLikeCardNumber("\uFF15\uFF15\uFF10\uFF10\uFF10\uFF10\uFF10\uFF10\uFF10") && !K.looksLikeCardNumber("Visa \uFF12\uFF10\uFF12\uFF16"), "digits of every script count (full-width digits too)");
{ const a1 = K.newCard({ name: "One", limitCents: 100000 }, T0, K.uniqueCardId([], T0)); const id2 = K.uniqueCardId([a1], T0); const id3 = K.uniqueCardId([a1, { ...a1, id: id2 }], T0);
  ok(a1.id !== id2 && id2 !== id3 && a1.id !== id3, `two or three cards set up in the same second get different ids — ${a1.id} · ${id2} · ${id3}`); }
const src = (await import("node:fs")).readFileSync(new URL("../lib/financial-2525/cards.ts", import.meta.url), "utf8");
ok(!/account(Number|No)|routing|cvv|pan\b/i.test(src.replace(/Never holds an account number/, "")), "the card holds no account number, routing number or security code — only a name, a limit and his levels");
console.log(`\nfinancial-cards: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

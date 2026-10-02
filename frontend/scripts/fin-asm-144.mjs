#!/usr/bin/env node
/**
 * Financial-2525 · 144 AsM SCENARIOS (operator 2026-10-02, addendum 146: "simulate 144 scenarios for AsM users and ensure transactions
 * all pass"). Twelve reviewer-users (the twelve AsM) × twelve transaction scenarios, run through the REAL pure modules
 * (lib/financial-2525/accrual.ts + record.ts) at the served revision. Each scenario states what must happen — accepted, or refused by
 * name — and passes only if the code does exactly that. Amounts are seeded per AsM so no two users run the same numbers.
 * Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/fin-asm-144.mjs [--json out.json]
 */
const A = await import("../lib/financial-2525/accrual.ts");
const R = await import("../lib/financial-2525/record.ts");
const M = await import("../lib/financial-2525/mot.ts");
const ASM = ["Aset", "Asar", "Athena", "Christo", "Enki", "Enlil", "Krishna", "Odin", "Pangu", "Sofia", "Thoth", "Thor"];
const DAY = 86400000, MONTH = 91 / 3;
const at = (s) => M.parseStampCST(s);
const results = [];
for (const [ai, who] of ASM.entries()) {
  const pay = 250000 + ai * 13711;            // seeded monthly pay, cents
  const bonus = 15000 + ai * 2333;
  const t0 = at("2026.10.01_07.00..00") + ai * 3600000;
  const d1 = { id: `${who}-d1`, kind: "deposit", amountCents: pay, atMs: t0, motDays: MONTH };
  const d2 = { id: `${who}-d2`, kind: "deposit", amountCents: bonus, atMs: t0 + 120000, motDays: MONTH };
  const inc = [d1, d2], total = pay + bonus;
  const W = (id, cents, ms, mot = 0) => ({ id: `${who}-${id}`, kind: "withdrawal", amountCents: cents, atMs: ms, motDays: mot });
  const S = [];
  const add = (name, expect, pass, note = "") => S.push({ asm: who, n: S.length + 1, name, expect, pass: !!pass, note });
  // 1 · a deposit releases at $/min over its MoT
  { const v = A.depositView(d1, t0 + DAY); add("deposit releases at $/min", "released = pay × 1 day ÷ 30.3̅", Math.abs(v.releasedCents - Math.round(pay / MONTH)) <= 1, `${v.releasedCents}¢`); }
  // 2 · two deposits accrue together
  { const b = A.balanceAt(inc, t0 + DAY); add("two deposits accrue together", "rate = sum of both", Math.abs(b.ratePerMinCents - (pay + bonus) / (MONTH * 1440)) < 1e-6, `${(b.ratePerMinCents * 60 / 100).toFixed(4)} $/hr`); }
  // 3 · a one-time spend inside what has accrued
  { const w = W("w3", Math.floor(pay / MONTH / 2), t0 + DAY); add("spend within accrued", "accepted", A.validateWithdrawal(inc, w).ok === true); }
  // 4 · a spend AHEAD of accrual (addendum 142)
  { const w = W("w4", Math.round(total * 0.4), t0 + 3600000); add("spend ahead of accrual", "accepted; Available below zero", A.validateWithdrawal(inc, w).ok === true && A.balanceAt([...inc, w], w.atMs).availableCents < 0); }
  // 5 · the card payment at the start of the month (addendum 143)
  { const w = W("w5", 245000 > total ? Math.round(total * 0.9) : 245000, t0 + 60000); const b = A.balanceAt([...inc, w], w.atMs + 1); add("card payment at month start", "accepted; rate drops", A.validateWithdrawal(inc, w).ok === true && b.netRatePerMinCents < b.ratePerMinCents, `${(b.netRatePerMinCents * 60 / 100).toFixed(4)} $/hr net`); }
  // 6 · a Monthly bill spread at $/min
  { const w = W("w6", 7100 + ai * 100, t0 + DAY, MONTH); add("monthly bill spread at $/min", "accepted", A.validateWithdrawal(inc, w).ok === true); }
  // 7 · spending exactly all income recorded (the boundary)
  { const a = W("w7a", Math.floor(total / 2), t0 + 3 * 60000), b = W("w7b", total - Math.floor(total / 2), t0 + 4 * 60000); add("spend exactly all income", "both accepted", A.validateWithdrawal(inc, a).ok === true && A.validateWithdrawal([...inc, a], b).ok === true); }
  // 8 · one cent over all income is refused by name
  { const w = W("w8", total + 1, t0 + 3 * 60000); const v = A.validateWithdrawal(inc, w); add("one cent over all income", "refused INSUFFICIENT", v.ok === false && v.reason === "INSUFFICIENT"); }
  // 9 · a spend before any money exists is refused
  { const w = W("w9", 100, t0 - DAY); const v = A.validateWithdrawal(inc, w); add("spend before any deposit", "refused INSUFFICIENT", v.ok === false && v.reason === "INSUFFICIENT"); }
  // 10 · the record: append, chain-hash, verify
  { let rec = R.emptyRecord(who); for (const x of [d1, d2, W("w10", 5000, t0 + DAY)]) rec = R.append(rec, x, x.atMs); add("record appends and verifies", "chain ok, 3 entries", R.verify(rec).ok && rec.entries.length === 3); }
  // 11 · an edit is an appended correction; replay reads it, the original stays
  { let rec = R.emptyRecord(who); const w = W("w11", 5000, t0 + DAY); for (const x of [d1, w]) rec = R.append(rec, x, x.atMs); rec = R.correctTx(rec, w.id, { amountCents: 4200 }, t0 + 2 * DAY); const txs = R.replay(rec); const e = txs.find((x) => x.id === w.id); add("edit is a correction", "replay 42.00, original kept, chain ok", e?.amountCents === 4200 && rec.entries.length === 3 && R.verify(rec).ok); }
  // 12 · a tampered record is caught
  { let rec = R.emptyRecord(who); for (const x of [d1, d2]) rec = R.append(rec, x, x.atMs); const bad = { ...rec, entries: rec.entries.map((e, i) => (i === 0 ? { ...e, tx: { ...e.tx, amountCents: e.tx.amountCents + 1 } } : e)) }; add("tampering is detected", "verify fails at entry 1", R.verify(bad).ok === false); }
  results.push(...S);
}
const passed = results.filter((r) => r.pass).length;
for (const who of ASM) { const s = results.filter((r) => r.asm === who); console.log(`${who.padEnd(8)} ${s.filter((r) => r.pass).length}/12  ${s.filter((r) => !r.pass).map((r) => "FAIL#" + r.n + " " + r.name).join(" · ")}`); }
console.log(`\nfin-asm-144: ${passed}/${results.length} scenarios behaved exactly as stated`);
const j = process.argv.indexOf("--json"); if (j > 0) { const fs = await import("node:fs"); fs.writeFileSync(process.argv[j + 1], JSON.stringify({ revision: "0.066", passed, total: results.length, results }, null, 1)); }
process.exit(passed === results.length ? 0 : 1);

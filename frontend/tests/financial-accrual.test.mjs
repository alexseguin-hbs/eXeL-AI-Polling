// financial-accrual — ESCROW RELEASES $/min (operator 2026-09-30, v.000_r.001): a deposit's money is released linearly
// over its MoT, is withdrawable as it accrues — no hold (r.028, addendum 57), a withdrawal never overdraws, the record is append-only
// and chain-hashed; the personal budget lands on the $/min · $/sec ladder.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/financial-accrual.test.mjs
const A = await import("../lib/financial-2525/accrual.ts");
const B = await import("../lib/financial-2525/budget.ts");
const R = await import("../lib/financial-2525/record.ts");
const M = await import("../lib/financial-2525/mot.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, eps) => Math.abs(a - b) <= eps;
const H = 3600 * 1000;

// ── 1 · the worked example: $3,604.49 · 2026-10-01 07:00 CST · MoT 30.333 ────────────────────────────────────
const at = M.cstMs(2026, 10, 1, 7, 0, 0);
const dep = { id: "d1", kind: "deposit", amountCents: 360449, atMs: at, motDays: 91 / 3, memo: "PAYROLL", payer: "employer" };
let v = A.depositView(dep, at);
ok(v.state === "releasing" && v.releasedCents === 0 && v.escrowedCents === 360449 && near(v.ratePerMinCents, 8.252, 1e-3) && v.withdrawableCents === 0, "at the deposit instant: nothing released, all in escrow, the rate is 8.252 ¢/min");
ok(A.depositView(dep, at - 1).state === "pending" && A.depositView(dep, at - 1).releasedCents === 0, "before the deposit day and time: pending, nothing released");
v = A.depositView(dep, at + 3 * H);
ok(v.releasedCents === 1485 && v.withdrawableCents === 1485 && !("holdUntilMs" in v), `3 h later $14.85 is released AND withdrawable — got ${v.releasedCents}`);
v = A.depositView(dep, at + 3 * H - 60000);
ok(v.releasedCents === 1477 && v.withdrawableCents === 1477, "no hold (r.028, addendum 57): whatever has accrued is withdrawable at every minute");
v = A.depositView(dep, at + 2 * H);
ok(v.withdrawableCents === 990, `his words (addendum 57): "if 2 hours later, 120 min at $/min should work" — 120 × 8.252 ¢ = $9.90 withdrawable at +2 h — got ${v.withdrawableCents}`);
v = A.depositView(dep, at + (91 / 3) * M.MS_PER_DAY);
ok(v.state === "released" && v.releasedCents === 360449 && v.escrowedCents === 0 && v.fraction === 1, "at the end of the MoT the whole amount is released and escrow is empty");
ok(A.depositView(dep, at + 40 * M.MS_PER_DAY).releasedCents === 360449, "released money never exceeds the deposit, however long after");
ok(A.depositView({ ...dep, motDays: 0 }, at).releasedCents === 360449, "a zero-length MoT releases at once");
ok(near(A.exampleRatePerMin(), 8.252, 1e-3), "the example's $/min helper agrees");

// ── 2 · withdrawals: the hold, never overdrawn, on the record ─────────────────────────────────────────────────
const w1 = { id: "w1", kind: "withdrawal", amountCents: 1000, atMs: at + 3 * H };
ok(A.validateWithdrawal([dep], { ...w1, id: "w2h", amountCents: 990, atMs: at + 2 * H }).ok === true, "his case: 2 hours after the deposit, a $9.90 withdrawal (120 min × $/min) is ACCEPTED — there is no hold");
{ const r = A.validateWithdrawal([dep], { ...w1, id: "w2h1", amountCents: 991, atMs: at + 2 * H }); ok(r.ok === false && r.reason === "INSUFFICIENT" && r.atMs === at + 2 * H, "one cent more than has accrued at +2 h is REFUSED, naming that minute"); }
ok(A.validateWithdrawal([dep], w1).ok === true, "a withdrawal of $10 at +3 h is legal ($14.85 withdrawable)");
ok(A.validateWithdrawal([dep], { ...w1, amountCents: 1486 }).ok === false && A.validateWithdrawal([dep], { ...w1, amountCents: 1486 }).reason === "INSUFFICIENT", "a withdrawal above what is withdrawable is refused: INSUFFICIENT — the balance never goes negative");
ok(A.validateWithdrawal([dep], { ...w1, amountCents: 0 }).reason === "AMOUNT" && A.validateWithdrawal([dep], { ...dep }).reason === "NOT_A_WITHDRAWAL", "a zero amount and a non-withdrawal are refused by name");
let b = A.balanceAt([dep, w1], at + 3 * H);
ok(b.releasedCents === 1485 && b.withdrawnCents === 1000 && b.availableCents === 485 && b.escrowedCents === 358964 && near(b.ratePerMinCents, 8.252, 1e-3), "the balance after the $10 withdrawal: released 1485 · withdrawn 1000 · available 485 · escrow 358,964 · rate live");
ok(A.validateWithdrawal([dep, w1], { id: "w2", kind: "withdrawal", amountCents: 486, atMs: at + 3 * H + 1 }).ok === false, "a second withdrawal cannot take more than what the first left");
ok(A.validateWithdrawal([dep, w1], w1).ok === true, "validating a withdrawal already on the record excludes itself (idempotent check)");
const dep2 = { id: "d2", kind: "deposit", amountCents: 100000, atMs: at + 24 * H, motDays: 14 };
b = A.balanceAt([dep, dep2], at + 25 * H);
ok(near(b.ratePerMinCents, 8.252 + 100000 / (14 * 1440), 1e-3) && b.deposits.length === 2 && b.depositedCents === 460449, "two overlapping deposits: the live rate is the sum; both are on the view");
const s = A.series([dep, w1], at, at + 6 * H, H);
ok(s.length === 7 && s.every((p, i) => i === 0 || p.released >= s[i - 1].released) && s[3].withdrawable === 1485 && s[2].withdrawable === 990 && s[3].available === 485, "the chart series samples the balance; released is monotonic; withdrawable follows released (no hold)");
ok(!("HOLD_MS" in A) && !("HOLD_HOURS" in A), "there is no hold constant (r.028, addendum 57: 'there is no 180 min rule (that was just example)')");

// ── 3 · the personal budget on the ladder ─────────────────────────────────────────────────────────────────────
const sum = B.summarize(B.SHEET_BUDGET, B.SHEET_MONTH_DAYS);
ok(sum.incomeCents === 320000 && sum.fixedCents === 275000 && sum.variableCents === 65000 && sum.expenseCents === 340000 && sum.netCents === -20000, "the sheet's budget: income 3,200 · fixed 2,750 · variable 650 · expenses 3,400 · net −200 per 33 days (its own figures)");
ok(near(sum.income.perDay, 9696.97, 0.01) && near(sum.income.perMin, 6.734, 1e-3) && near(sum.income.perSec, 0.1122, 1e-4), "income 3,200 / 33 d = $96.97/day · 6.73 ¢/min · 0.11 ¢/s");
ok(near(sum.net.perDay, -606.06, 0.01) && sum.lines.length === 8 && sum.lines[0].category === "Income" && near(sum.lines[1].ladder.perMin, 700 * 100 / (33 * 1440), 1e-6), "every line and the net carry the whole ladder (Home 700 → 1.47 ¢/min)");
ok(B.BUDGET_CATEGORIES.join() === "Income,Home,Auto,Insurance,Utilities,Fitness,Fun,Groceries,Dining Out,Other", "the operator's categories, in his order (addendum 3)");
ok(B.SHEET_BUDGET.every((l) => l.amountCents > 0 && ["income", "fixed", "variable"].includes(l.kind)), "the sheet lines are Income / Fixed / Variable");

// ── 4 · the record: append-only, chain-hashed, replayable ────────────────────────────────────────────────────
let rec = R.emptyRecord("owner-1");
rec = R.append(rec, dep, at); rec = R.append(rec, w1, at + 3 * H); rec = R.append(rec, dep2, at + 24 * H);
ok(rec.entries.length === 3 && rec.entries.map((e) => e.rev).join() === "1,2,3" && rec.entries[0].prev === R.GENESIS && rec.entries[1].prev === rec.entries[0].hash, "entries append with revs 1..n and each carries the previous hash");
ok(R.append(rec, dep, at) === rec, "appending an id already on the record returns the same record (idempotent)");
ok(R.verify(rec).ok && R.replay(rec).length === 3 && R.replay(rec, 2).map((t) => t.id).join() === "d1,w1", "the chain verifies and replays to any revision");
const tampered = { ...rec, entries: rec.entries.map((e, i) => (i === 1 ? { ...e, tx: { ...e.tx, amountCents: 1 } } : e)) };
ok(R.verify(tampered).ok === false && R.verify(tampered).brokenAt === 2, "a changed amount breaks the chain at that revision");
ok(/^[0-9a-f]{16}$/.test(rec.entries[0].hash) && R.chainHash(R.GENESIS, dep, 1, at) === rec.entries[0].hash, "hashes are 16 hex and deterministic");

// r.023 — A WITHDRAWAL RUNS OUT AT $/min OVER ITS MoT (operator addendum 39 + 55), checked at every minute; his exact case.
{
  const at = (x) => M.parseStampCST(x);
  const d1 = { id: "d1", kind: "deposit", amountCents: 360449, atMs: at("2026.09.30_19.54..35"), motDays: 91 / 3 };
  const d2 = { id: "d2", kind: "deposit", amountCents: 32000, atMs: at("2026.09.30_19.56..04"), motDays: 91 / 3 };
  const storage = { id: "w1", kind: "withdrawal", amountCents: 7100, atMs: at("2026.10.01_07.00..00"), motDays: 91 / 3, memo: "Storage Unit" };
  ok(A.validateWithdrawal([d1, d2], storage).ok === true, "his $71 Storage Unit, Monthly (30.3 repeating days) from 2026.10.01 07:00, is ACCEPTED against $3,924.49 coming in — it runs out at $0.0016/min");
  const once = A.validateWithdrawal([d1, d2], { ...storage, id: "w2", motDays: 0 });
  ok(once.ok === false && once.reason === "INSUFFICIENT" && once.atMs === storage.atMs && once.availableCents === 5977, `the same $71 One time at 07:00 lands whole and is REFUSED, naming 07:00 (only $59.77 had come in) — got ${JSON.stringify(once)}`);
  const early = A.validateWithdrawal([d1, d2], { ...storage, id: "w3", atMs: at("2026.09.30_20.30..00") });
  ok(early.ok === true, "no hold: a Monthly withdrawal starting 36 minutes after the deposit runs out at $/min and is accepted (r.028)");
  const big = A.validateWithdrawal([d1, d2], { ...storage, id: "w4", amountCents: 400000 });
  ok(big.ok === false && big.reason === "INSUFFICIENT" && big.atMs > storage.atMs + 20 * 86400000 && big.atMs < storage.atMs + 28 * 86400000 && big.atMs % 60000 === 0, `$4,000 Monthly runs out faster than $3,924.49 comes in: refused at the whole minute it would pass (about 24 days in) — got ${big.atMs ? M.fmtStampCST(big.atMs) : big.reason}`);
  ok(A.withdrawnAt(storage, storage.atMs) === 0 && A.withdrawnAt(storage, storage.atMs + (91 / 6) * 86400000) === 3550 && A.withdrawnAt(storage, storage.atMs + 40 * 86400000) === 7100 && A.withdrawnAt({ ...storage, motDays: 0 }, storage.atMs) === 7100, "withdrawnAt is linear over the MoT (half way = half), clamped to the amount; One time lands whole at its instant");
  let neg = 0; for (let t = d1.atMs; t <= d1.atMs + 31 * 86400000; t += 3600000) { const b = A.balanceAt([d1, d2, storage], t); if (b.withdrawnCents > b.withdrawableCents) neg++; }
  ok(neg === 0, "with the $71 Monthly on the record, what has gone out never passes what is withdrawable — every hour of the month");
  const lumpOk = { id: "w5", kind: "withdrawal", amountCents: 25066, atMs: at("2026.10.15_07.00..00"), motDays: 0 };
  ok(A.validateWithdrawal([d1, d2], lumpOk).ok === true && A.validateWithdrawal([d1, d2, lumpOk], storage).ok === true, "a record accepted as a lump before r.023 (his $250.66 on 10.15) stays valid, and the $71 Monthly is still accepted beside it");
}
// r.026 — the refusal names the FIRST short minute exactly (the HI-intent check found r.023 could name a minute with money to spare).
{
  const at = (x) => M.parseStampCST(x);
  const d1 = { id: "d1", kind: "deposit", amountCents: 360449, atMs: at("2026.09.30_19.54..35"), motDays: 91 / 3 };
  const d2 = { id: "d2", kind: "deposit", amountCents: 32000, atMs: at("2026.09.30_19.56..04"), motDays: 91 / 3 };
  const lump = { id: "w9-3", kind: "withdrawal", amountCents: 180000, atMs: at("2026.10.15_07.00..00"), motDays: 0 };
  ok(A.validateWithdrawal([d1, d2], lump).ok === true, "an $1,800 One time on 2026.10.15 07:00 is accepted against his pay");
  const w = { id: "wA-4", kind: "withdrawal", amountCents: 20000, atMs: at("2026.10.01_07.00..00"), motDays: 91 / 3 };
  const v = A.validateWithdrawal([d1, d2, lump], w);
  ok(v.ok === false && v.atMs === lump.atMs, `with the $1,800 planned, a new $200 Monthly from 10.01 runs short exactly when the lump lands (2026.10.15_07.00..00) — got ${v.atMs ? M.fmtStampCST(v.atMs) : v.reason}`);
  const short = (txs, t) => { const b = A.balanceAt(txs, t); return b.withdrawnCents - b.withdrawableCents; };
  const big = { id: "w4-3", kind: "withdrawal", amountCents: 400000, atMs: at("2026.10.01_07.00..00"), motDays: 91 / 3 };
  const vb = A.validateWithdrawal([d1, d2], big);
  ok(vb.ok === false && short([d1, d2, big], vb.atMs) > 0 && short([d1, d2, big], vb.atMs - 60000) <= 0 && vb.atMs % 60000 === 0, `$4,000 Monthly: the named minute is short and the minute before is not (${M.fmtStampCST(vb.atMs)})`);
}
// ── r.053 (addendum 106 "no changes should delete entries"): a save never discards a stored entry ──
{
  const store = new Map(); globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), key: (i) => [...store.keys()][i] ?? null, get length() { return store.size; } };
  const owner = "op-1"; const d = { id: "d1", kind: "deposit", amountCents: 360449, atMs: Date.UTC(2026, 8, 30, 1, 54), motDays: 30 };
  let mine = R.append(R.emptyRecord(owner), d, 1); mine = R.append(mine, { ...d, id: "d2", amountCents: 32000 }, 2);
  ok(R.saveRecord(mine, 10) && R.loadRecord(owner).rec.entries.length === 2, "his record saves and loads (2 entries)");
  ok(R.saveRecord(R.append(mine, { ...d, id: "w1", kind: "withdrawal", amountCents: 25066 }, 3), 11) && R.keptRecords(owner).length === 0, "an append carries every stored entry forward — nothing kept aside, nothing lost");
  const stranger = R.append(R.emptyRecord(owner), { ...d, id: "x" }, 4);
  ok(R.saveRecord(stranger, 12) && R.keptRecords(owner).length === 1 && R.keptRecords(owner)[0].rec.entries.length === 3, "a save that would drop stored entries first KEEPS the stored copy whole (3 entries) under its own key");
  const before = store.get("exel-fin-kept:op-1:12"); R.saveRecord(R.emptyRecord(owner), 13);
  ok(store.get("exel-fin-kept:op-1:12") === before && R.keptRecords(owner).length >= 1, "a kept copy is never overwritten or removed by a later save");
  ok(!/removeItem/.test(R.saveRecord.toString()) && !/removeItem/.test(R.keptRecords.toString()), "the record's save and keep paths contain no delete");
  delete globalThis.localStorage;
}
// ── r.053 (addendum 110): his two deposits, exactly as his record showed them ──
{
  const X = await import("../lib/financial-2525/restore.ts");
  const ds = X.operatorDeposits();
  ok(ds.length === 2 && ds[0].amountCents === 360449 && ds[1].amountCents === 32000 && M.fmtStampCST(ds[0].atMs) === "2026.09.30_19.54..35" && M.fmtStampCST(ds[1].atMs) === "2026.09.30_19.56..04" && ds[0].memo === "State of Texas" && ds[1].memo === "PROMISSORY NOTE" && ds.every((d) => d.kind === "deposit" && d.motDays === 30), "his deposits put back exactly: 3,604.49 State of Texas 2026.09.30_19.54..35 and 320.00 PROMISSORY NOTE 2026.09.30_19.56..04, monthly");
  ok(X.isOperator("Explore@eXeL-AI.com ") && !X.isOperator("someone@else.com") && !X.isOperator(undefined), "offered only to his account");
  ok(X.OPERATOR_WITHDRAWAL.amount === "250.66" && X.OPERATOR_WITHDRAWAL.field === "D.auto_renters_home", "the withdrawal is prefilled, never invented (its day, time and length are his)");
}
console.log(`financial-accrual: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);

// financial-accrual — ESCROW RELEASES $/min (operator 2026-09-30, v.000_r.001): a deposit's money is released linearly
// over its MoT, is withdrawable only from 3 h after the deposit, a withdrawal never overdraws, the record is append-only
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
ok(v.releasedCents === 1485 && v.withdrawableCents === 1485 && v.holdUntilMs === at + 3 * H, `3 h later $14.85 is released AND withdrawable (the hold lifts exactly at +3 h) — got ${v.releasedCents}`);
v = A.depositView(dep, at + 3 * H - 60000);
ok(v.releasedCents === 1477 && v.withdrawableCents === 0, "a minute before the hold lifts: released (visible) but not yet withdrawable");
v = A.depositView(dep, at + (91 / 3) * M.MS_PER_DAY);
ok(v.state === "released" && v.releasedCents === 360449 && v.escrowedCents === 0 && v.fraction === 1, "at the end of the MoT the whole amount is released and escrow is empty");
ok(A.depositView(dep, at + 40 * M.MS_PER_DAY).releasedCents === 360449, "released money never exceeds the deposit, however long after");
ok(A.depositView({ ...dep, motDays: 0 }, at).releasedCents === 360449, "a zero-length MoT releases at once");
ok(near(A.exampleRatePerMin(), 8.252, 1e-3), "the example's $/min helper agrees");

// ── 2 · withdrawals: the hold, never overdrawn, on the record ─────────────────────────────────────────────────
const w1 = { id: "w1", kind: "withdrawal", amountCents: 1000, atMs: at + 3 * H };
ok(A.validateWithdrawal([dep], { ...w1, atMs: at + 2 * H }).ok === false && A.validateWithdrawal([dep], { ...w1, atMs: at + 2 * H }).reason === "HOLD", "a withdrawal before 3 h is refused: HOLD");
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
ok(s.length === 7 && s.every((p, i) => i === 0 || p.released >= s[i - 1].released) && s[3].withdrawable === 1485 && s[2].withdrawable === 0 && s[3].available === 485, "the chart series samples the balance; released is monotonic; withdrawable appears at +3 h");
ok(A.HOLD_HOURS === 3 && A.HOLD_MS === 3 * H, "the hold is 3 hours (operator)");

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

console.log(`financial-accrual: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);

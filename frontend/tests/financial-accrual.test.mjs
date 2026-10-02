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
{ const r = A.validateWithdrawal([dep], { ...w1, id: "w2h1", amountCents: 991, atMs: at + 2 * H }); ok(r.ok === true, "r.066 (addendum 142 'Up to all In Escrow'): one cent more than has accrued at +2 h is now ACCEPTED — a spend may run ahead of accrual"); }
{ const r = A.validateWithdrawal([dep], { ...w1, id: "w2h2", amountCents: 360450, atMs: at + 2 * H }); ok(r.ok === false && r.reason === "INSUFFICIENT" && r.atMs === at + 2 * H, "r.066: one cent more than the whole deposit ($3,604.50 against $3,604.49) is REFUSED, naming that minute"); }
ok(A.validateWithdrawal([dep], w1).ok === true, "a withdrawal of $10 at +3 h is legal ($14.85 withdrawable)");
ok(A.validateWithdrawal([dep], { ...w1, amountCents: 1486 }).ok === true && A.validateWithdrawal([dep], { ...w1, amountCents: 360450 }).reason === "INSUFFICIENT", "r.066: above what has accrued is accepted (spent ahead); above every deposit recorded is refused: INSUFFICIENT");
ok(A.validateWithdrawal([dep], { ...w1, amountCents: 0 }).reason === "AMOUNT" && A.validateWithdrawal([dep], { ...dep }).reason === "NOT_A_WITHDRAWAL", "a zero amount and a non-withdrawal are refused by name");
let b = A.balanceAt([dep, w1], at + 3 * H);
ok(b.releasedCents === 1485 && b.withdrawnCents === 1000 && b.availableCents === 485 && b.escrowedCents === 358964 && near(b.ratePerMinCents, 8.252, 1e-3), "the balance after the $10 withdrawal: released 1485 · withdrawn 1000 · available 485 · escrow 358,964 · rate live");
ok(A.validateWithdrawal([dep, w1], { id: "w2", kind: "withdrawal", amountCents: 359449, atMs: at + 3 * H + 1 }).ok === true && A.validateWithdrawal([dep, w1], { id: "w2", kind: "withdrawal", amountCents: 359450, atMs: at + 3 * H + 1 }).ok === false, "r.066: a second withdrawal may take the rest of the deposit ($3,594.49 after the $10) and not one cent more");
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
  ok(once.ok === true, `r.066: the same $71 One time at 07:00 lands whole and is now ACCEPTED ahead of accrual (only $59.77 had come in) — got ${JSON.stringify(once)}`);
  { const before = A.balanceAt([d1, d2], storage.atMs), b = A.balanceAt([d1, d2, { ...storage, id: "w2", motDays: 0 }], storage.atMs);
    ok(b.availableCents === 0 && b.advanceCents === 7100 - 5977 && b.escrowedCents === before.escrowedCents - (7100 - 5977) && b.releasedCents === 7100 && near(b.netRatePerMinCents / (before.netRatePerMinCents * (1 - (7100 - 5977) / before.escrowedCents)), 1, 1e-4),
      `r.071 (addendum 159, as of r.066 "Up to all In Escrow" + "Spread over rest"): the $71 lands ahead of the $59.77 accrued — Available stays at $0.00, escrow drops by the $11.23 spent ahead, the rate drops by that share — got available ${b.availableCents} escrow ${b.escrowedCents} (was ${before.escrowedCents})`); }
  { const pay = { id: "cc", kind: "withdrawal", amountCents: 245000, atMs: at("2026.10.01_07.00..00"), motDays: 0, memo: "Credit Card Payment" }; const v = A.validateWithdrawal([d1, d2], pay); const b = A.balanceAt([d1, d2, pay], pay.atMs); ok(v.ok === true && b.netRatePerMinCents * 60 / 100 > 1.9 && b.netRatePerMinCents * 60 / 100 < 2.2, `his $2,450 credit-card payment on 2026.10.01_07.00..00 is ACCEPTED (addendum 143) and the accrual falls from $5.45/hr to about $2.05/hr — got $${(b.netRatePerMinCents * 60 / 100).toFixed(4)}/hr`); }
  const early = A.validateWithdrawal([d1, d2], { ...storage, id: "w3", atMs: at("2026.09.30_20.30..00") });
  ok(early.ok === true, "no hold: a Monthly withdrawal starting 36 minutes after the deposit runs out at $/min and is accepted (r.028)");
  const big = A.validateWithdrawal([d1, d2], { ...storage, id: "w4", amountCents: 400000 });
  ok(big.ok === false && big.reason === "INSUFFICIENT" && big.atMs > storage.atMs + 28 * 86400000 && big.atMs < storage.atMs + 30.4 * 86400000 && big.atMs % 60000 === 0, `r.066: $4,000 Monthly passes the $3,924.49 coming in only near the month's end: refused at the whole minute it would pass (about 29.8 days in) — got ${big.atMs ? M.fmtStampCST(big.atMs) : big.reason}`);
  ok(A.withdrawnAt(storage, storage.atMs) === 0 && A.withdrawnAt(storage, storage.atMs + (91 / 6) * 86400000) === 3550 && A.withdrawnAt(storage, storage.atMs + 40 * 86400000) === 7100 && A.withdrawnAt({ ...storage, motDays: 0 }, storage.atMs) === 7100, "withdrawnAt is linear over the MoT (half way = half), clamped to the amount; One time lands whole at its instant");
  let neg = 0; for (let t = d1.atMs; t <= d1.atMs + 31 * 86400000; t += 3600000) { const b = A.balanceAt([d1, d2, storage], t); if (b.withdrawnCents > b.withdrawableCents) neg++; }
  ok(neg === 0, "with the $71 Monthly on the record, what has gone out never passes what is withdrawable — every hour of the month");
  const lumpOk = { id: "w5", kind: "withdrawal", amountCents: 25066, atMs: at("2026.10.15_07.00..00"), motDays: 0 };
  ok(A.validateWithdrawal([d1, d2], lumpOk).ok === true && A.validateWithdrawal([d1, d2, lumpOk], storage).ok === true, "a record accepted as a lump before r.023 (his $250.66 on 10.15) stays valid, and the $71 Monthly is still accepted beside it");
}
// r.071 (addendum 159 "escrow should drop, while remaining funds get released"): SPENDING AHEAD RELEASES EARLY FROM ESCROW — exact engine
{
  const at = (x) => M.parseStampCST(x), H = 3600000, D = 86400000;
  const d1 = { id: "d1", kind: "deposit", amountCents: 360449, atMs: at("2026.09.30_19.54..35"), motDays: 30 };
  const d2 = { id: "d2", kind: "deposit", amountCents: 32000, atMs: at("2026.09.30_19.56..04"), motDays: 30 };
  const pay = { id: "cc", kind: "withdrawal", amountCents: 245000, atMs: at("2026.10.01_07.00..00"), motDays: 0 };
  const b0 = A.balanceAt([d1, d2, pay], pay.atMs), b1 = A.balanceAt([d1, d2, pay], pay.atMs + H), bEnd = A.balanceAt([d1, d2, pay], d2.atMs + 30 * D);
  ok(b0.availableCents === 0 && b0.escrowedCents === 392449 - 245000 && b0.releasedCents === 245000 && b0.withdrawnCents === 245000, `his $2,450 card payment: Available $0.00 (never negative), In Escrow drops to $1,474.49, Released $2,450.00 — got ${b0.availableCents} · ${b0.escrowedCents} · ${b0.releasedCents}`);
  ok(Math.abs(b1.availableCents - Math.round(b0.netRatePerMinCents * 60)) <= 1 && b1.escrowedCents === b0.escrowedCents - b1.availableCents && b0.netRatePerMinCents * 60 / 100 > 1.9 && b0.netRatePerMinCents * 60 / 100 < 2.2, `an hour later the rest has released at the lower rate (~$2.05/hr): Available ${b1.availableCents}¢ — escrow keeps falling by exactly that`);
  ok(bEnd.escrowedCents === 0 && bEnd.availableCents === 392449 - 245000 && bEnd.netRatePerMinCents === 0, "at the end of the month escrow is empty and everything left is available");
  // a spread outflow while nothing is available: escrow falls at exactly its rate (closed form)
  const t0 = at("2026.11.01_00.00..00");
  const dep = { id: "x", kind: "deposit", amountCents: 300000, atMs: t0, motDays: 30 };
  const lump = { id: "l", kind: "withdrawal", amountCents: 200000, atMs: t0 + D, motDays: 0 };
  const run = { id: "r", kind: "withdrawal", amountCents: 60000, atMs: t0 + D, motDays: 10 };
  const e1 = A.balanceAt([dep, lump, run], t0 + D).escrowedCents, e6 = A.balanceAt([dep, lump, run], t0 + 6 * D);
  ok(e1 === 100000 && Math.abs(e6.escrowedCents - (100000 - 30000)) <= 1 && e6.availableCents === 0, `with nothing available a $600 run over 10 days takes $60/day straight from escrow: $1,000 → $700 after 5 days — got ${e6.escrowedCents}`);
  // the exact engine against an independent minute-by-minute run, on seeded records (lumps, runs, several deposits ending at different times)
  let seed = 2525; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const euler = (txs, t, step = 60000) => {
    const deps = [], outs = []; let a = 0;
    const evs = txs.filter((x) => x.atMs <= t).sort((p, q) => p.atMs - q.atMs || (p.kind === "deposit" ? -1 : 1));
    let k = 0, cur = evs.length ? evs[0].atMs : t;
    while (cur < t) {
      while (k < evs.length && evs[k].atMs <= cur) { const x = evs[k++]; const len = (x.motDays ?? 0) * D; if (x.kind === "deposit") { if (len > 0) deps.push({ e: x.amountCents, f: x.atMs + len }); else a += x.amountCents; } else if (len > 0) outs.push({ w: x.amountCents / len, end: x.atMs + len }); else { a -= x.amountCents; if (a < 0) { const live = deps.filter((d) => d.e > 0 && d.f > cur), E = live.reduce((q, d) => q + d.e, 0); for (const d of live) d.e *= 1 - Math.min(1, -a / E); a = 0; } } }
      const dt = Math.min(step, t - cur), live = deps.filter((d) => d.e > 0 && d.f > cur);
      let inflow = 0; for (const d of live) { const r = d.e * Math.min(1, dt / (d.f - cur)); d.e -= r; inflow += r; }
      const w = outs.filter((o) => o.end > cur).reduce((q, o) => q + o.w, 0);
      a += inflow - w * dt;
      if (a < 0) { const l2 = deps.filter((d) => d.e > 0 && d.f > cur + dt), E = l2.reduce((q, d) => q + d.e, 0); if (E > 0) { const take = Math.min(E, -a); for (const d of l2) d.e *= 1 - take / E; a += take; } }
      cur += dt;
    }
    while (k < evs.length && evs[k].atMs <= t) { const x = evs[k++]; const len = (x.motDays ?? 0) * D; if (x.kind === "deposit") { if (len > 0) deps.push({ e: x.amountCents, f: x.atMs + len }); else a += x.amountCents; } else if (len > 0) outs.push({ w: x.amountCents / len, end: x.atMs + len }); else { a -= x.amountCents; if (a < 0) { const live = deps.filter((d) => d.e > 0 && d.f > t), E = live.reduce((q, d) => q + d.e, 0); for (const d of live) d.e *= 1 - Math.min(1, -a / E); a = 0; } } }
    return { escrow: deps.reduce((q, d) => q + d.e, 0), available: a };
  };
  let worst = 0, cases = 0;
  for (let c = 0; c < 6; c++) {
    const base = at("2026.12.01_00.00..00") + c * 40 * D;
    const txs = [{ id: `a${c}`, kind: "deposit", amountCents: 200000 + Math.round(rnd() * 300000), atMs: base, motDays: 30 }, { id: `b${c}`, kind: "deposit", amountCents: 50000 + Math.round(rnd() * 100000), atMs: base + Math.round(rnd() * 5) * D, motDays: 14 }];
    const total = txs.reduce((q, x) => q + x.amountCents, 0);
    txs.push({ id: `l${c}`, kind: "withdrawal", amountCents: Math.round(total * (0.3 + rnd() * 0.3)), atMs: base + D + Math.round(rnd() * 3) * H, motDays: 0 });
    txs.push({ id: `r${c}`, kind: "withdrawal", amountCents: Math.round(total * 0.15), atMs: base + 2 * D, motDays: 10 });
    for (const day of [1.5, 3, 6, 10, 15, 25, 31]) {
      const t = base + day * D, ex = A.balanceAt(txs, t), eu = euler(txs, t);
      worst = Math.max(worst, Math.abs(ex.escrowedCents - eu.escrow), Math.abs(ex.availableCents - eu.available)); cases++;
      if (ex.availableCents < 0) worst = Infinity;
    }
  }
  // r.071 AsM review (Enlil): 25¢ let three planted defects through (a draw from the first deposit only, an Available that runs out ignoring
  // the release, escrow drained while money is still available); the real engine measures 0.5¢, so the bound is 1¢
  ok(worst <= 1, `the exact engine matches an independent minute-by-minute run within 1¢ across ${cases} probes of 6 seeded records (worst ${worst === Infinity ? "a NEGATIVE Available" : worst.toFixed(2) + "¢"})`);
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
  ok(v.ok === true, `r.066: with the $1,800 planned, a new $200 Monthly from 10.01 is ACCEPTED — $2,000 in all stays under the $3,924.49 coming in — got ${v.atMs ? M.fmtStampCST(v.atMs) : "ok"}`);
  const short = (txs, t) => { const b = A.balanceAt(txs, t); return b.withdrawnCents - b.depositedCents; };
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
  // r.073 (round 1): a save from a copy that lacks the stored entries UNITES them — nothing is set aside where no screen reads it
  const stranger = R.append(R.emptyRecord(owner), { ...d, id: "x" }, 4);
  const united = R.saveRecord(stranger, 12);
  ok(united && united.entries.length === 4 && ["d1", "d2", "w1", "x"].every((id) => R.replay(united).some((t) => t.id === id)) && R.verify(united).ok && R.keptRecords(owner).length === 0 && R.loadRecord(owner).rec.entries.length === 4, "a save from a copy that lacks the stored entries carries them forward — all four transactions on the record, nothing kept aside");
  ok(R.saveRecord(R.emptyRecord(owner), 13)?.entries.length === 4, "saving an empty copy over a full record keeps every entry");
  // only a stored copy that cannot be trusted is kept whole (never merged) — and a kept copy is never overwritten or removed
  store.set("exel-fin:op-1", JSON.stringify({ ...united, entries: united.entries.map((e, i) => (i === 1 ? { ...e, tx: { ...e.tx, amountCents: 1 } } : e)) }));
  ok(R.saveRecord(stranger, 14)?.entries.length === 1 && R.keptRecords(owner).length === 1 && R.keptRecords(owner)[0].rec.entries.length === 4, "a stored copy that fails its chain is kept whole under its own key before anything is written (never united)");
  const before = store.get("exel-fin-kept:op-1:14"); R.saveRecord(R.emptyRecord(owner), 15);
  ok(store.get("exel-fin-kept:op-1:14") === before && R.keptRecords(owner).length >= 1, "a kept copy is never overwritten or removed by a later save");
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
// ── r.055 (addendum 112): the cloud copy merges without ever dropping an entry ──
{
  const C = await import("../lib/financial-2525/cloud.ts");
  const d = { id: "d1", kind: "deposit", amountCents: 360449, atMs: 1, motDays: 30 };
  const one = R.append(R.emptyRecord("o"), d, 1), two = R.append(one, { ...d, id: "d2" }, 2), other = R.append(R.emptyRecord("o"), { ...d, id: "x" }, 3);
  let m = C.mergeRecords(R.emptyRecord("o"), two); ok(m.current.entries.length === 2 && !m.keep && !m.push, "empty device + cloud record → the cloud record is taken whole");
  m = C.mergeRecords(two, null); ok(m.current === two && m.push && !m.keep, "device record + empty cloud → pushed");
  m = C.mergeRecords(two, one); ok(m.current === two && m.push && !m.keep, "device ahead of the cloud → device kept and pushed");
  m = C.mergeRecords(one, two); ok(m.current.entries.length === 2 && !m.push && !m.keep, "cloud ahead of the device → cloud taken");
  m = C.mergeRecords(two, other); ok(m.current.entries.length === 3 && ["d1", "d2", "x"].every((id) => R.replay(m.current).some((t) => t.id === id)) && R.verify(m.current).ok && !m.keep && m.push, "r.073: diverged → UNITED — every entry of both copies, nothing kept aside, and the account is sent the union");
  const altered = { ...two, entries: two.entries.map((e, i) => (i === 0 ? { ...e, tx: { ...e.tx, amountCents: 9 } } : e)) };
  m = C.mergeRecords(one, altered); ok(m.current === one && m.keep === altered && m.push, "r.073: an account copy that fails its chain is never adopted — kept whole, the device copy stays");
  m = C.mergeRecords(R.emptyRecord("o"), altered); ok(m.current.entries.length === 0 && m.keep === altered && !m.push, "…and an empty device never writes nothing over it");
  ok((await C.ownerKeyFor("auth0|abc"))?.length === 64 && (await C.ownerKeyFor("auth0|abc")) === (await C.ownerKeyFor("auth0|abc")) && (await C.ownerKeyFor("auth0|abc")) !== (await C.ownerKeyFor("auth0|abd")), "the account key is a stable 64-hex hash of the sign-in id");
  ok(C.PUSH_EVERY_MS === 12 * 3600 * 1000, "pushed again every 12 hours");
  ok(!/delete|remove/i.test(C.cloudPut.toString() + C.mergeRecords.toString()), "the cloud path has no delete");
}
// ── r.062 THE EDIT (addendum 133 "add edit feature for transaction record"): an edit is a correction ENTRY — the original stays
{
  const t0 = Date.UTC(2026, 9, 1, 1, 54, 35);
  let rec = R.emptyRecord("edit-test");
  rec = R.append(rec, { id: "d1", kind: "deposit", amountCents: 360449, atMs: t0, motDays: 30, memo: "State of Texas" }, t0);
  rec = R.append(rec, { id: "w1", kind: "withdrawal", amountCents: 7100, atMs: t0 + 86400000, motDays: 0, memo: "Storage" }, t0 + 1);
  const before = rec.entries.map((e) => e.hash).join();
  const ed1 = R.correctTx(rec, "w1", { amountCents: 25066, memo: "Storage unit" }, t0 + 2);
  ok(ed1.entries.length === 3 && ed1.entries.slice(0, 2).map((e) => e.hash).join() === before, "an edit appends one entry; every earlier entry and hash is untouched");
  ok(R.verify(ed1).ok, "the chain still verifies after an edit");
  const eff = R.replay(ed1);
  ok(eff.length === 2 && eff[1].id === "w1" && eff[1].amountCents === 25066 && eff[1].memo === "Storage unit" && eff[1].kind === "withdrawal" && !eff[1].corrects, "the record reads the corrected values in the original's place (same id, same type) — the correction is not a second transaction");
  const ed2 = R.correctTx(ed1, "w1", { amountCents: 25000 }, t0 + 3);
  ok(R.replay(ed2)[1].amountCents === 25000 && R.replay(ed2)[1].memo === "Storage unit" && R.correctionsOf(ed2, "w1").length === 2, "a second edit wins and keeps the first edit's other fields; both corrections stay on the record");
  ok(R.replay(ed2, 2)[1].amountCents === 7100, "replaying to the revision before the edit shows the original");
  ok(R.correctTx(ed2, "nope", { amountCents: 1 }, t0 + 4) === ed2, "an edit of a transaction that is not on the record changes nothing");
  { const flipped = R.correctTx(rec, "d1", { kind: "withdrawal" }, t0 + 5);   // r.073 (addendum 164): every field is editable, the type included
    ok(R.replay(flipped)[0].kind === "withdrawal" && flipped.entries[0].tx.kind === "deposit" && R.replay(rec)[0].kind === "deposit", "r.073 (addendum 164): the type is editable like every field — the correction reads Withdrawal, the original entry still says Deposit"); }
}
// ── r.071 AsM review folds — every finding pinned by a value that only the right engine produces ──
{
  const K = await import("../lib/financial-2525/cards.ts");
  const D = 86400000, t0 = M.parseStampCST("2026.11.02_06.00..00");
  const dep = (id, cents, at, days) => ({ id, kind: "deposit", amountCents: cents, atMs: at, motDays: days });
  const out = (id, cents, at, days = 0, extra = {}) => ({ id, kind: "withdrawal", amountCents: cents, atMs: at, motDays: days, ...extra });
  // (1) Athena · Krishna — a deposit that lands while Available is short covers the shortfall from its escrow AT ONCE (a corrected record
  //     must never leave −$2,014.84 beside a full escrow); and the record check refuses the correction that would create the shortfall
  { const txs = [dep("d1", 100000, t0, 0), out("w1", 150000, t0 + 3600000), dep("d2", 300000, t0 + 2 * 3600000, 30)];
    const before = A.balanceAt(txs, t0 + 5400000), landed = A.balanceAt(txs, t0 + 2 * 3600000), later = A.balanceAt(txs, t0 + 2 * 3600000 + D);
    ok(before.availableCents === -50000 && landed.availableCents === 0 && landed.escrowedCents === 250000 && near(later.availableCents, 250000 / 30, 1) && A.validateRecord(txs, t0).ok === false && A.validateRecord(txs, t0).atMs === t0 + 3600000,
      `r.071 AsM: a late deposit covers the shortfall the instant it lands (before ${before.availableCents} · landed ${landed.availableCents}/${landed.escrowedCents} · +1 d ${later.availableCents}) and the record check names the short minute`); }
  // (2) Enki — ONE rounding: In Escrow + Released = Deposited and Released − Spent = Available to the cent, every 10 minutes of a month of
  //     his pay with four Monthly bills (rounded one by one they drifted 1–2¢ in 45% of minutes); the minimal record from the review too
  { const p0 = M.parseStampCST("2026.09.30_19.54..35");
    const txs = [dep("p1", 360449, p0, 30), dep("p2", 32000, p0 + 89000, 30), out("s", 248822, p0 + 0.5 * D), out("b1", 7100, p0 + D, 30), out("b2", 4599, p0 + 1.3 * D, 30), out("b3", 1299, p0 + 2.1 * D, 30), out("b4", 999, p0 + 3.7 * D, 30)];
    let bad = 0, neg = 0, n = 0;
    for (let t = p0; t <= p0 + 31 * D; t += 600000) { const b = A.balanceAt(txs, t); n++; if (b.escrowedCents + b.releasedCents !== b.depositedCents || b.releasedCents - b.withdrawnCents !== b.availableCents) bad++; if (b.availableCents < 0) neg++; }
    const mini = [dep("m", 100000, t0, 0), out("r1", 1000, t0, 1), out("r2", 1001, t0, 1), out("r3", 1002, t0, 1), out("r4", 1003, t0, 1)], mb = A.balanceAt(mini, t0 + 33000);
    ok(bad === 0 && neg === 0 && mb.escrowedCents + mb.releasedCents === 100000 && mb.withdrawnCents === 2,
      `r.071 AsM: one rounding — ${n} probes, ${bad} identity breaks, ${neg} negative; the review's minimal record reads Spent ${mb.withdrawnCents}¢ · Released ${mb.releasedCents}¢`); }
  // (3) Enlil X1 — a spend at a deposit's very first instant: money in before money out, the rest comes out of its escrow
  { const txs = [dep("d", 100000, t0, 10), out("w", 60000, t0)], a0 = A.balanceAt(txs, t0), a5 = A.balanceAt(txs, t0 + 5 * D);
    ok(a0.availableCents === 0 && a0.escrowedCents === 40000 && a5.escrowedCents === 20000 && a5.availableCents === 20000, `r.071 AsM: a spend at the deposit's first instant (at 0: ${a0.availableCents}/${a0.escrowedCents}; +5 d: ${a5.availableCents}/${a5.escrowedCents})`); }
  // (3b) Enlil X1, the member that still matters: a one-time deposit and a spend at the SAME instant while another deposit releases — money
  //      in first, so the spend comes out of the new money and the releasing deposit's escrow is never touched
  { const txs = [dep("live", 300000, t0, 30), dep("one", 50000, t0 + D, 0), out("w", 30000, t0 + D)], b = A.balanceAt(txs, t0 + D);
    ok(b.availableCents === 30000 && b.escrowedCents === 290000, `r.071 AsM: money in before money out at one instant (Available ${b.availableCents} · escrow ${b.escrowedCents})`); }
  // (4) Enlil X3 — a spread deficit across TWO live deposits keeps each one's share (worked by hand: after the $3,300 draw both release
  //     $18.4211/day; the $500 over 3 days leaves them $162.50 and $37.50; at +10 d the short one has ended): Available $75.00 · escrow $125.00 · $0.2604/hr
  { const txs = [dep("a", 300000, t0, 30), dep("b", 100000, t0, 10), out("l", 330000, t0 + D), out("r", 50000, t0 + D, 3)];
    const b4 = A.balanceAt(txs, t0 + 4 * D), b10 = A.balanceAt(txs, t0 + 10 * D);
    ok(b4.availableCents === 0 && b4.escrowedCents === 20000 && near(b4.netRatePerMinCents * 1440, 1250, 1e-6) && b10.availableCents === 7500 && b10.escrowedCents === 12500 && near(b10.netRatePerMinCents * 60, 26.0417, 1e-3),
      `r.071 AsM: the two-deposit deficit (+4 d ${b4.availableCents}/${b4.escrowedCents}/${(b4.netRatePerMinCents * 1440).toFixed(2)}¢ a day; +10 d ${b10.availableCents}/${b10.escrowedCents}/${(b10.netRatePerMinCents * 60).toFixed(4)}¢ an hour)`); }
  // (5) Enlil X8/X12 — a shortfall past every cent in escrow SHOWS (never hidden as $0.00): a lump and a spread bill that outrun everything
  { const lump = A.balanceAt([dep("d", 10000, t0, 0), out("w", 15000, t0 + 1000)], t0 + 2000), spread = A.balanceAt([dep("d", 10000, t0, 1), out("w", 30000, t0, 1)], t0 + D);
    ok(lump.availableCents === -5000 && lump.escrowedCents === 0 && spread.availableCents === -20000 && spread.escrowedCents === 0, `r.071 AsM: the shortfall shows (lump ${lump.availableCents} · spread ${spread.availableCents})`); }
  // (6) Enki — a length too small to move a millisecond timestamp is one-time; its money never vanishes
  { const b = A.balanceAt([dep("d", 100000, t0, 1e-15), out("w", 50000, t0 + 60000)], t0 + 120000);
    ok(b.availableCents === 50000 && b.escrowedCents === 0, `r.071 AsM: a vanishing length is one-time (Available ${b.availableCents})`); }
  // (7) Krishna — the check reads the record EXACTLY as the card counts it: paying a card's $3,000 purchase in full is never refused for
  //     money a counted purchase already took, and a new payment that steals coverage from a later one is checked for that later one
  { const pay = dep("pay", 400000, t0, 30), buy = out("buy", 300000, t0 + 3600000, 0, { paidFrom: "c1" });
    const full = out("full", 300000, t0 + 2 * 3600000, 0, { field: "I.cards_student", paysCard: "c1" });
    const okFull = A.validateRecord(K.accrualTxs([pay, buy, full]), full.atMs).ok;
    const mid = out("mid", 300000, t0 + 1.5 * 3600000, 0, { field: "I.cards_student", paysCard: "c1" });
    const stolen = A.validateRecord(K.accrualTxs([pay, buy, full, mid]), mid.atMs);
    ok(okFull === true && stolen.ok === false, `r.071 AsM: a covered card payment passes (${okFull}); one that takes another's coverage is checked for it (${stolen.ok ? "accepted" : "refused at " + M.fmtStampCST(stolen.atMs)})`); }
  // (8) Thoth · Odin — the check never replays the escrow (plain sums; it made every Save 8–10× slower) and the chart walks the record once
  { const src = (await import("node:fs")).readFileSync(new URL("../lib/financial-2525/accrual.ts", import.meta.url), "utf8");
    const overBody = src.slice(src.indexOf("const overAt = "), src.indexOf("export function firstShortfall"));
    const seriesBody = src.slice(src.indexOf("export function series("));
    ok(overBody.length > 50 && !/balanceAt|escrowAt|escrowRun/.test(overBody) && /escrowRun\(txs, times\)/.test(seriesBody) && !/balanceAt\(/.test(seriesBody),
      "r.071 AsM: the withdrawal check sums deposits and spends without the escrow run; the chart's series is one walk of the record"); }
}
// ── r.073 ROUND 1 OF 33 — A FINISHED ENTRY IS NEVER LOST. The reviewer lenses found three paths that lost one: a Monthly entry's length
// edit (no effect), two tabs or two devices writing over each other (5 of 10 entries visible), and a page left open 12 hours pushing its
// opening state back. Each member of the class is pinned here by a value only the right code produces.
{
  const C = await import("../lib/financial-2525/cloud.ts");
  const L = await import("../lib/financial-2525/ladder.ts");
  const T = await import("../lib/financial-2525/typed.ts");
  const t0 = M.parseStampCST("2026.10.02_06.00..00"), D = 86400000;
  const dep = (id, cents, ms, extra = {}) => ({ id, kind: "deposit", amountCents: cents, atMs: ms, motDays: 30, ...extra });
  const ids = (rec) => R.replay(rec).map((x) => x.id).sort().join();
  // (1) the union holds every transaction of both copies, verifies, and is the same chain whichever side unites
  const base = R.append(R.append(R.emptyRecord("u"), dep("a", 1000, t0), t0), dep("b", 2000, t0 + D), t0 + 1);
  const tabA = R.append(base, dep("c", 3000, t0 + 2 * D), t0 + 10), tabB = R.append(base, dep("d", 4000, t0 + 3 * D), t0 + 11);
  const ab = R.unionRecords(tabA, tabB), ba = R.unionRecords(tabB, tabA);
  ok(ids(ab) === "a,b,c,d" && R.verify(ab).ok && ab.entries.map((e) => e.hash).join() === ba.entries.map((e) => e.hash).join(), "r.073: the union holds every entry of both copies, verifies, and is the same chain whichever side unites");
  ok(ab.entries.slice(0, 3).map((e) => e.hash).join() === tabA.entries.map((e) => e.hash).join(), "…the copy whose first new entry was recorded first keeps its chain exactly; the other's entries follow it");
  ok(R.unionRecords(ab, tabB) === ab && R.unionRecords(ab, tabA) === ab && R.unionRecords(tabA, base) === tabA, "…uniting a copy already held changes nothing (same object): no growth, no duplicates");
  ok(R.unionRecords(tabA, { ...tabB, entries: tabB.entries.map((e, i) => (i === 2 ? { ...e, at: e.at + 1 } : e)) }) === tabA, "…a copy that fails its chain is never united");
  // (2) two tabs × 5 alternations, neither hearing the other (the worst case), every save from a stale copy → 10 entries after reload
  { const store = new Map(); globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), key: (i) => [...store.keys()][i] ?? null, get length() { return store.size; } };
    let A1 = R.emptyRecord("tabs"), B1 = R.emptyRecord("tabs"), n = 0;
    for (let k = 0; k < 5; k++) {
      A1 = R.append(A1, dep(`ta${k}`, 100 + k, t0 + (n++) * 60000), t0 + n); A1 = R.saveRecord(A1, n) ?? A1;   // what tab A shows = what it saved
      B1 = R.append(B1, dep(`tb${k}`, 200 + k, t0 + (n++) * 60000), t0 + n); B1 = R.saveRecord(B1, n) ?? B1;
    }
    const after = R.loadRecord("tabs");
    ok(R.replay(after.rec).length === 10 && !after.tampered && R.keptRecords("tabs").length === 0, `r.073 (Krishna): two tabs × 5 alternations → all 10 entries on the record after reload (was 5, the rest in 8 hidden copies) — ${R.replay(after.rec).length}`);
    ok(R.replay(R.unionRecords(A1, R.readStored("tabs"))).length === 10, "…and a tab that hears the other (the storage event) shows all 10 at once");
    delete globalThis.localStorage; }
  // (3) two devices and one account, each syncing get → unite → put, alternately: both end with every entry and the account holds them all
  { let account = null; const devs = [R.emptyRecord("acct"), R.emptyRecord("acct")];
    const sync = (i) => { const m = C.mergeRecords(devs[i], account); devs[i] = m.current; if (devs[i].entries.length && !(account && R.sameChain(devs[i], account))) account = devs[i]; };
    for (let k = 0; k < 4; k++) { devs[k % 2] = R.append(devs[k % 2], dep(`dv${k}`, 500 + k, t0 + k * D), t0 + 100 + k); sync(k % 2); }
    sync(0); sync(1);
    ok(R.replay(account).length === 4 && R.replay(devs[0]).length === 4 && R.replay(devs[1]).length === 4 && R.sameChain(devs[0], devs[1]), "r.073 (Krishna): two devices alternately recording and syncing → each shows all 4 entries and so does the account (each used to see only its own)"); }
  // (4) two tabs that each corrected the same entry: both corrections kept, the id collision renamed, the NEWEST edit wins in either order
  { const x = R.append(R.emptyRecord("c"), dep("x", 1000, t0), t0);
    const e1 = R.correctTx(x, "x", { amountCents: 1100 }, t0 + 50), e2 = R.correctTx(x, "x", { amountCents: 1200 }, t0 + 60);
    const u1 = R.unionRecords(e1, e2), u2 = R.unionRecords(e2, e1);
    ok(e1.entries[1].tx.id === e2.entries[1].tx.id && R.correctionsOf(u1, "x").length === 2 && new Set(u1.entries.map((e) => e.tx.id)).size === u1.entries.length, "r.073: two tabs each made correction c-x-2 — the union keeps both under distinct ids");
    ok(R.replay(u1)[0].amountCents === 1200 && R.replay(u2)[0].amountCents === 1200, "…and the edit recorded last wins whichever copy kept its place (it used to be whichever came later in the chain)");
    ok(R.unionRecords(u1, e2) === u1 && R.unionRecords(u1, e1) === u1, "…uniting again with either tab's copy adds nothing (a renamed correction is still recognised)");
    ok(R.correctTx(u1, "x", { amountCents: 1300 }, t0 + 70).entries.length === u1.entries.length + 1 && R.replay(R.correctTx(u1, "x", { amountCents: 1300 }, t0 + 70))[0].amountCents === 1300, "…and the next edit takes a free id (an edit is never dropped as a duplicate)");
    // the kept copy made a LATER edit after its first one: the newest edit wins, not the one appended last
    const a2 = R.correctTx(e1, "x", { amountCents: 1500 }, t0 + 90), mix = R.unionRecords(a2, e2);
    ok(mix.entries[mix.entries.length - 1].tx.amountCents === 1200 && R.replay(mix)[0].amountCents === 1500, "…the edit recorded last (1,500 at +90) wins even when an older edit (1,200 at +60) is appended after it");
    const gappy = R.append(R.append(x, { ...dep("x", 1000, t0), id: "c-x-1", corrects: "x" }, t0 + 1), { ...dep("x", 900, t0), id: "c-x-3", corrects: "x" }, t0 + 2);
    ok(R.nextCorrectionId(gappy, "x") === "c-x-4", "…and the next correction id skips any number a united copy already holds"); }
  // (5) one id: the same money at the same instant is ONE transaction (a re-entry, "Put back my entries"); different money or a different
  // instant under one id is two, both kept; freshId never reuses an id
  { const p = R.append(R.emptyRecord("i"), dep("dup", 100, t0, { memo: "State of Texas", motDays: 30.333 }), t0), q = R.append(R.emptyRecord("i"), dep("dup", 100, t0, { memo: "State of Texas", motDays: 30, recurrence: "paymot" }), t0 + 1);
    const u = R.unionRecords(p, q);
    ok(R.replay(u).length === 1 && R.unionRecords(q, p).entries.length === 1, "r.073: the same deposit recorded on two devices (one id, the same amount and instant; a length that differs) is one entry — never doubled");
    const q2 = R.append(R.emptyRecord("i"), dep("dup", 150, t0, { memo: "lunch" }), t0 + 1), u2 = R.unionRecords(p, q2);
    ok(R.replay(u2).length === 2 && R.replay(u2).map((t) => t.amountCents).sort().join() === "100,150" && R.unionRecords(u2, q2) === u2 && R.unionRecords(u2, p) === u2, "r.073: two different entries under one id (different amounts) are both kept — and stay two");
    ok(R.freshId(u2, "dup") === "dup~3" && R.freshId(u2, "new") === "new", "r.073: a new entry's id is one no entry holds"); }
  // (6) THE MONTHLY LENGTH EDIT (Enlil): a correction that keeps "paymot" is read at 30 days whatever its length says — the pencil now
  // takes a changed length off the preset; an untouched one keeps it
  { const m0 = R.append(R.emptyRecord("m"), dep("mo", 300000, t0, { motDays: 30, recurrence: "paymot" }), t0);
    const kept = R.correctTx(m0, "mo", { motDays: 7 }, t0 + 1), fixed = R.correctTx(m0, "mo", { motDays: 7, recurrence: "other" }, t0 + 1), once = R.correctTx(m0, "mo", { motDays: 0, recurrence: "once" }, t0 + 1);
    ok(L.withMonthLaw(R.replay(kept)[0]).motDays === 30 && L.withMonthLaw(R.replay(fixed)[0]).motDays === 7 && L.withMonthLaw(R.replay(once)[0]).motDays === 0, "r.073 (Enlil): 30 → 7 on a Monthly entry is read as 7 only off the preset (it read 30 before — the edit had no effect); blank is one time");
    const ux = (await import("node:fs")).readFileSync(new URL("../components/financial-2525/command-ux1.tsx", import.meta.url), "utf8");
    ok(/\.\.\.\(lengthMoved && \(days !== \(withMonthLaw\(cur\)\.motDays \?\? 0\) \|\| ed\.rec !== cur\.recurrence\) \? \{ motDays: days, recurrence: ed\.rec \} : \{\}\),/.test(ux) && /const len = r && r !== "other" && RECURRENCES\.includes\(r\) \? \{ rec: r, otherN: "", otherUnit: "days" as LengthUnit \}/.test(ux), "…the pencil opens on the entry's own preset (Monthly reads Monthly) and a changed length carries its preset");
    ok(/if \(Object\.keys\(edit\)\.length === 0\) \{ setEditId\(null\); return; \}/.test(ux) && /const moved = \(k: keyof typeof ED0\) => String\(ed\[k\]\)\.trim\(\) !== String\(ed0\[k\]\)\.trim\(\);/.test(ux), "r.073 (Christo): only what the person changed goes into the correction; Done with nothing changed appends nothing (an entry recorded at 'now' keeps its exact instant)");
    // (7) Odin — the 12-hour timer, the return to the page and the network coming back call the LATEST sync, which reads the latest record,
    // budget and cards (the old interval kept the opening render's push and wrote the opening state back over the account)
    ok(/const syncRef = useRef\(sync\); syncRef\.current = sync;/.test(ux) && /setInterval\(\(\) => \{ void syncRef\.current\(\); \}, PUSH_EVERY_MS\)/.test(ux) && /const recordRef = useRef\(record\); recordRef\.current = record;/.test(ux) && /const planRef = useRef\(plan\); planRef\.current = plan;/.test(ux) && /const cardsRef = useRef\(cards\); cardsRef\.current = cards;/.test(ux) && !/\bpushAll\b/.test(ux), "r.073 (Odin): every timer calls the latest sync through a ref, which reads the latest record, budget and cards");
    ok(/cloudPut\(key, "fin-plan", \{ lines: mine, at: at0 \} satisfies PlanDoc\)/.test(ux) && /const cp = p\.data, planAt = planAtRef\.current, mine = planRef\.current;/.test(ux) && /const ch = syncChoice\(\{ doc: mine, at: planAt \}, remote\);/.test(ux) && /if \(ch === "take" && remote\) \{ planRef\.current = remote\.doc;/.test(ux), "…the budget is sent only when this device's edit is newer than the account's, and taken from the account when it is older (a stale tab never puts an old budget back)");
    ok(/window\.addEventListener\("pagehide", flush\); window\.addEventListener\("online", flush\);/.test(ux) && /else flush\(\); \};/.test(ux), "r.073: a change made just before the page is hidden or closed is sent at once; a send that failed offline is sent when the network returns");
    ok(/if \(e\.key === recordKey\(owner\)\) \{ const s = readStored\(owner\); if \(s\) \{ const u = recordRef\.current\.owner === owner \? unionRecords\(recordRef\.current, s\) : s;/.test(ux), "r.073 (Krishna): another tab's save is united into this tab at once (and never under another sign-in's name)");
    ok(/if \(r\.state === "ok"\) \{/.test(ux) && /\} else out\.push\(r\.state === "off" \? "offline" : r\.state\);/.test(ux), "r.073: a failed read writes nothing over the account (a failed read is never taken for an empty account)");
    ok(/const lacks = recordRef\.current\.entries\.length > 0 && !\(cloudRec && sameChain\(recordRef\.current, cloudRec\)\);/.test(ux) && /const wrote = kept === "saved" && lacks;/.test(ux) && /const st = kept !== "saved" \? kept : wrote \? await cloudPut\(key, "fin-record", sent\) : "saved";/.test(ux), "r.073: the account record is written only when it lacks something, never with nothing, and never before a copy that fails its chain has been kept");
    ok(/if \(wrote && out\[out\.length - 1\] === "saved"\) readBack\.current = true;/.test(ux) && /if \(readBack\.current\) \{ readBack\.current = false; setTimeout\(\(\) => \{ void syncRef\.current\(\); \}, 4000\); \}/.test(ux), "r.073: a record write is read back once a few seconds later — another device writing in the same moment never leaves an entry out of the account");
    // (8) Thor — a full phone: the form stays open with what was typed, says so, and its button saves the same entry again (never a second one)
    ok(/const retrying = unsaved !== null;/.test(ux) && /onClick=\{retrying \? retrySave : recordTransaction\}/.test(ux) && /const retrySave = \(\) => \{\s*const u = unsaved; if \(!u\) return;/.test(ux) && /if \(persist\(next\)\) \{ setAmt\(""\); setMemo\(""\); setWhen\(""\); foldForm\(\); \} else \{ setUnsaved\(\{ id: uid, ident: u\.ident, key: formKey \}\); setRetryN\(\(n\) => n \+ 1\); \}/.test(ux) && /\{retrying && <p key=\{retryN\} role="alert" data-fin-save-retry/.test(ux), "r.073 (Thor): when the phone will not keep the entry the form stays open, says so, and tries the same save again — never a second copy");
    ok(/\{owner && cloudReady && isOperator\(user\?\.email\) && record\.entries\.length === 0 && \(/.test(ux), "r.073 (Christo): Put back my entries waits until the account copy has been read");
  }
  // (9) Enki — one reader for what is typed
  { const P = T.parseAmountCents;
    ok(P("1,234.56") === 123456 && P("$50") === 5000 && P("R$ 12.00", ["R$"]) === 1200 && P(".55") === 55 && P("50.") === 5000 && P("1,234,567.89") === 123456789 && P("999,999,999,999.99") === T.MAX_AMOUNT_CENTS, "r.073 (Enki): 1,234.56 · $50 · R$ 12.00 · .55 · 50. are amounts");
    ok(["Infinity", "1e400", "1e3", "0x10", "12,50", "1,23", "-5", "0", "0.00", "", "abc", "5.555", "1000000000000", "$"].every((x) => P(x) === null), "…Infinity, 1e400, 0x10, 12,50 (never read as 1,250), negatives, zero, three decimals and a trillion are not");
    ok(T.amountProblem("") === "zero" && T.amountProblem("0.00") === "zero" && T.amountProblem("abc") === "form" && T.amountProblem("12,50") === "form" && T.amountProblem("$0") === "zero" && T.amountProblem("12") === null, "…and the refusal says which: nothing above zero, or not written as a figure");
    ok(T.parseDaysText("") === 0 && T.parseDaysText("7") === 7 && T.parseDaysText("0.125") === 0.125 && ["abc", "-1", "1e3", "0x10", "Infinity"].every((x) => T.parseDaysText(x) === null) && T.parsePositive("0") === null && T.parsePositive("2") === 2 && T.parsePositive("") === null, "r.073 (Aset · Enki): a length is a plain number; Other needs one above zero (never a silent one-time)");
    ok(T.lengthFits(t0, 36525) && !T.lengthFits(t0, 1e20) && !T.lengthFits(t0, Infinity) && !T.lengthFits(t0, -1), "r.073: a length the calendar cannot hold is refused (r.071's law, now one helper)");
    ok(M.parseStampCST("2026.02.31_07.00..00") === null && M.parseStampCST("0050.01.01_00.00..00") === null && M.parseStampCST("2026.02.29_00.00..00") === null && M.parseStampCST("2028.02.29_00.00..00") !== null && M.fmtStampCST(M.parseStampCST("2026.10.02_07.00..00")) === "2026.10.02_07.00..00", "r.073 (Enki): a date the calendar does not have is refused (2026.02.31 recorded 2026.03.03, 0050 recorded 1950); a real one reads back as typed");
    ok(M.stampProblem("2026.02.31_07.00..00") === "day" && M.stampProblem("2026.2.3") === "form" && M.stampProblem("2026.10.02_07.00..00") === null, "…and the refusal says which: a day the calendar does not have, or not written YYYY.MM.DD_HH.MM..SS"); }
}
// ── r.073 PRE-PUSH REVIEW (FIX-FIRST — 1 blocker / 7 should-fix, kept verbatim in docs/financial-2525/rounds/r073_prepush_review.md): each
// fold pinned by a value only the folded code produces, starting from the reviewers' own scenarios
{
  const C = await import("../lib/financial-2525/cloud.ts");
  const T = await import("../lib/financial-2525/typed.ts");
  const K = await import("../lib/financial-2525/cards.ts");
  const fs = await import("node:fs");
  const t0 = M.parseStampCST("2026.10.02_06.00..00"), MIN = 60000;
  const dep = (id, cents, ms) => ({ id, kind: "deposit", amountCents: cents, atMs: ms, motDays: 30 });
  const amount = (rec, id) => R.replay(rec).find((x) => x.id === id)?.amountCents;
  // (B) Krishna's blocker, his numbers: a laptop edits 100 → 120 → 150 → 120; a phone recorded a 5.00 withdrawal just before the first edit.
  // The edit back to 120 is a NEW correction (it was taken for the first one and dropped — 150.00 and Available 145.00 after the union)
  const base = R.append(R.emptyRecord("k"), dep("d", 10000, t0), t0);
  let lap = R.correctTx(base, "d", { amountCents: 12000 }, t0 + 2 * MIN);
  lap = R.correctTx(lap, "d", { amountCents: 15000 }, t0 + 3 * MIN);
  lap = R.correctTx(lap, "d", { amountCents: 12000 }, t0 + 4 * MIN);
  const phone = R.append(base, { id: "w", kind: "withdrawal", amountCents: 500, atMs: t0 + MIN, motDays: 0 }, t0 + MIN);
  const u1 = R.unionRecords(lap, phone), u2 = R.unionRecords(phone, lap);
  ok(amount(lap, "d") === 12000 && amount(u1, "d") === 12000 && amount(u2, "d") === 12000 && R.correctionsOf(u1, "d").length === 3 && R.correctionsOf(u2, "d").length === 3 && R.verify(u1).ok && R.sameChain(u1, u2),
    `r.073 pre-push (Krishna, the blocker): 100 → 120 → 150 → 120 united with the phone's copy reads 120.00 in both orders, all three corrections kept (read ${amount(u1, "d")} · ${amount(u2, "d")})`);
  { const bal = (rec) => A.balanceAt(R.replay(rec), t0 + 40 * 86400000).availableCents;
    ok(bal(u1) === 12000 - 500 && bal(u2) === 12000 - 500, `…and the money follows: Available ${(bal(u1) / 100).toFixed(2)} (120.00 − 5.00), never 145.00`); }
  ok(R.unionRecords(u1, lap) === u1 && R.unionRecords(u1, phone) === u1 && R.unionRecords(u2, u1) === u2, "…uniting a copy already held still changes nothing: the same correction made at the same time is the same correction");
  // (C) Odin: two edits in one tab with the clock set back a minute between them — the later edit wins (r.072 showed 300; r.073 showed 200)
  { let r = R.correctTx(base, "d", { amountCents: 20000 }, t0 + 10 * MIN);
    r = R.correctTx(r, "d", { amountCents: 30000 }, t0 + 9 * MIN);
    ok(amount(r, "d") === 30000 && r.entries[2].at === r.entries[1].at + 1 && R.nextAt(base, t0 + 5 * MIN) === t0 + 5 * MIN && R.nextAt(r, 0) === r.entries[2].at + 1,
      "r.073 pre-push (Odin): a clock moved back between two edits — the later edit still wins (every new entry or correction is stamped after the record's latest)"); }
  // (D) Enlil: a union gives an entry a new id (another device's different entry holds x) — whatever remembered x follows the entry, never the other one
  { const a = R.append(R.emptyRecord("e"), dep("x", 100, t0), t0 + 5), b = R.append(R.emptyRecord("e"), dep("x", 200, t0), t0 + 1);
    const u = R.unionRecords(a, b), ia = R.txIdentity(dep("x", 100, t0)), ib = R.txIdentity(dep("x", 200, t0));
    ok(R.followId(u, "x", ib) === "x" && R.followId(u, "x", ia) === "x~2" && amount(u, "x~2") === 100 && R.followId(a, "x", ia) === "x" && R.followId(R.emptyRecord("e"), "x", ia) === null && R.followId(u, "x", "deposit|999|0") === null,
      "r.073 pre-push (Enlil): an entry a union renamed (x → x~2) is found by what it is — the open editor and the retry never change another entry under the id they remembered"); }
  // (E) Enki: the budget and the card settings read what is typed with strict readers (Number() took "0x10" as 16, "1e3" as 1,000 and "1e400" as Infinity)
  { const PB = T.parseBudgetAmount, PC = T.parseCardCents;
    ok(PB("1,234.56") === 1234.56 && PB("0") === 0 && PB(".5") === 0.5 && PB("0.067300") === 0.0673 && PB("$12") === 12 && PB("R$ 3", ["R$"]) === 3 && ["0x10", "1e3", "12,50", "-1", "Infinity", "1e400", "abc", "", "1000000000000", "1.00000000001"].every((x) => PB(x) === null) && PB("0.0000390008") === 0.0000390008,
      "r.073 pre-push (Enki): a budget figure — 1,234.56 applies, a per-second fraction keeps its decimals (ten since the second review); 0x10, 1e3, 12,50, a sign, Infinity and one trillion never set a line");
    ok(PC("") === 0 && PC("0") === 0 && PC("0.00") === 0 && PC("1,500") === 150000 && PC("2000.5") === 200050 && ["1e400", "0x10", "abc", "-5", "12,50", "Infinity"].every((x) => Number.isNaN(PC(x))),
      "…a card figure — blank or zero reads zero (the form's rule); 1e400 and 0x10 are not a number, never Infinity");
    const card = { id: "c", name: "Visa", limitCents: 300000, openingCents: 1000, openingAtMs: t0, amberCents: 150000, redCents: 200000 };
    ok(K.validCard(card) && !K.validCard({ ...card, openingCents: Infinity }) && !K.validCard({ ...card, openingCents: PC("1e400") }) && !K.validCard({ ...card, limitCents: Infinity, redCents: Infinity, amberCents: 0 }),
      "…and a card whose figure is not a finite number is never valid (an Infinity balance saved as null and read back as 0)"); }
  // (F) Christo: a site with no account store says "off" (nothing to read, nothing lost) — distinct from a read that failed, which never opens
  // the account features
  { const r = await C.cloudRead("o", "fin-record"), all = await C.readAll("o");
    ok(r.state === "off" && r.data === null && ["r", "p", "c"].every((k) => all[k].state === "off"), "r.073 pre-push (Christo): no account store set up → the read says \"off\", never \"offline\" (an unreachable account is \"offline\" or \"error\")"); }
  // (G) the folded component, read as source: each fold where the reviewers said it was missing
  const ux = fs.readFileSync(new URL("../components/financial-2525/command-ux1.tsx", import.meta.url), "utf8");
  ok(/const readOk = r\.state === "ok" \|\| r\.state === "off";/.test(ux) && /if \(ok\) setCloudReady\(true\); else timer = window\.setTimeout\(first, 30000\);/.test(ux) && /window\.addEventListener\("online", onOnline\);/.test(ux) && (ux.match(/\.state === "off" \? "offline" : [rpc]\.state/g) || []).length === 3,
    "r.073 pre-push (Christo): the account features wait for a read that SUCCEEDED (or a site with no account store); offline at sign-in, the first read is tried again every 30 s and when the network returns");
  ok(/const here = \(\) => ownerRef\.current === who && recordRef\.current\.owner === who && cloudKeyRef\.current\?\.key === key;/.test(ux) && (ux.match(/if \(!here\(\)\) return (readOk|false);/g) || []).length >= 4,
    "r.073 pre-push (Thor): the sign-in is checked again after every wait of a sync — nothing of one person is written while another is signed in");
  ok(/const fp = chainFingerprint\(m\.keep\); let last = ""; try \{ last = localStorage\.getItem\(`fin-kept-cloud:\$\{who\}`\)/.test(ux) && /if \(fp !== last && fp !== keptFp\.current\) \{ kept = await cloudPut\(key, `fin-record-kept-\$\{Date\.now\(\)\}`, m\.keep\); if \(kept === "saved"\) \{ keptFp\.current = fp; try \{ localStorage\.setItem\(`fin-kept-cloud:\$\{who\}`, fp\);/.test(ux),
    "r.073 pre-push (Thor): an account copy that fails its chain is kept aside ONCE per copy (a new phone wrote another kept row on every sync)");
  ok(!/if \(!saved\) setCloudState/.test(ux) && /const behind = ok && \(held !== recordRef\.current \|\| heldPlan !== planRef\.current \|\| heldCards !== cardsRef\.current\);/.test(ux) && /setCloudState\(behind \? "saving" : ok \? "saved"/.test(ux) && /out\.push\(st\); if \(st === "saved"\) held = sent;/.test(ux) && /if \(ok\) setHolds\(\{ record: held, plan: heldPlan, cards: heldCards \}\);/.test(ux),
    "r.073 pre-push (Thor): \"saved to your account\" only after a sync that holds the record as it is now — an entry this device would not keep, or one made during a sync, waits for the next");
  ok(/const uid = followId\(next, u\.id, u\.ident\);/.test(ux) && /next = correctTx\(next, cur\.id, edit, at\);/.test(ux) && /for \(const k of Object\.keys\(edit\) as \(keyof TxEdit\)\[\]\) if \(\(edit\[k\] \?\? null\) === \(cur\[k\] \?\? null\)\) delete edit\[k\];/.test(ux) && !/setUnsaved\(formKey\)/.test(ux),
    "r.073 pre-push (Thor): after a failed save, a change in the form is applied to the entry the phone would not keep (a correction) and the save is tried again — fixing a typo never records a second entry");
  ok(/useEffect\(\(\) => \{ if \(!editId\) return; const id = followId\(record, editId, editIdent\); if \(id !== editId\) setEditId\(id\); \}, \[record, editId, editIdent\]\);/.test(ux) && /const eid = editId \? followId\(recordRef\.current, editId, editIdent\) : null;/.test(ux),
    "r.073 pre-push (Enlil): the pencil follows the entry it opened on when a union renames it; Done never edits another entry");
  ok(/const \[planFailed, setPlanFailed\] = useState\(false\);/.test(ux) && /const kept = savePlan\(who, lines\);[^\n]*setPlanFailed\(!kept\); return kept; \};/.test(ux) && /\{planFailed && <p role="alert" data-fin-plan-save-failed/.test(ux) && !/if \(!savePlan\(planOwner, next\)\) setSaveFailed\(true\)/.test(ux),
    "r.073 pre-push (Thor): a budget this device would not keep says so in the budget's own words, on its own flag (a good record save no longer hides it)");
  ok(/const r = typeIntoLine\(plan, fieldId, text, period, focusLine\.current, cur\.symbol \? \[cur\.symbol\] : \[\]\);/.test(ux) && /const n = parseBudgetAmount\(text, marks\);/.test(fs.readFileSync(new URL("../lib/financial-2525/plan.ts", import.meta.url), "utf8")) && /const cents = \(v: string\) => parseCardCents\(v, marks\);/.test(ux),
    "r.073 pre-push (Enki): the budget line and the card settings read through the strict readers");
  ok(/const at0 = ch === "send" && planAt > 0 \? planAt : nextStamp\(Math\.max\(planAt, remote\?\.at \?\? 0\), Date\.now\(\)\);/.test(ux) && /const at1 = ch === "send" \? cardsAt : nextStamp\(Math\.max\(cardsAt, remote\?\.at \?\? 0\), Date\.now\(\)\);/.test(ux),
    "r.073 pre-push (Odin): an account budget or card list that r.072's stale push reverted (the same time, other lines) is repaired — this device's copy goes up under a new time");
}
// ── r.073 SECOND PRE-PUSH REVIEW (FIX-FIRST — 2 blockers / 9 should-fix, kept verbatim in docs/financial-2525/rounds/r073_prepush_review2.md):
// each fold pinned by the reviewer's own scenario, run as behaviour where the code is pure; the page-level halves run on the built page
// (scripts/fin-sync-probe.mjs, after every build)
{
  const C = await import("../lib/financial-2525/cloud.ts");
  const T = await import("../lib/financial-2525/typed.ts");
  const K = await import("../lib/financial-2525/cards.ts");
  const P = await import("../lib/financial-2525/plan.ts");
  const fs = await import("node:fs");
  const ux = fs.readFileSync(new URL("../components/financial-2525/command-ux1.tsx", import.meta.url), "utf8");
  const T0 = M.parseStampCST("2026.10.02_09.00..00"), MIN = 60000;
  // (A) Krishna's blocker: the account store keeps jsonb and hands keys back shortest-first. The cards as the page saves them and as the store
  // returns them are the SAME cards — no write; a sync loop of five never writes; a rename made later on another device reaches everyone.
  const sent = [{ id: "c-1", name: "Capital One", limitCents: 300000, openingCents: 73527, openingAtMs: T0, amberCents: 150000, redCents: 200000 }];
  const jsonb = (v) => JSON.parse(JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort((a, b) => a.length - b.length || (a < b ? -1 : 1)).map((k) => [k, x[k]])) : x)));
  const back = jsonb(sent);
  ok(JSON.stringify(back) !== JSON.stringify(sent) && C.syncChoice({ doc: sent, at: T0 }, { doc: back, at: T0 }, true) === "same",
    "r.073 second review (Krishna, the blocker): identical cards handed back in jsonb key order are the same cards — no write (r.073's tie test re-sent them on every sync)");
  { let acct = { doc: back, at: T0 }, phone = { doc: sent, at: T0 }, laptop = { doc: sent, at: T0 }, writes = 0;
    laptop = { doc: [{ ...sent[0], name: "Capital One Quicksilver" }], at: C.nextStamp(laptop.at, T0 + 5 * MIN) };   // renamed offline
    for (let i = 0; i < 5; i++) { const ch = C.syncChoice(phone, acct, true); if (ch === "send" || ch === "resend") { acct = { doc: jsonb(phone.doc), at: ch === "resend" ? C.nextStamp(Math.max(phone.at, acct.at), T0 + i) : phone.at }; writes++; } }
    { const ch = C.syncChoice(laptop, acct, true); if (ch === "send" || ch === "resend") { acct = { doc: jsonb(laptop.doc), at: laptop.at }; writes++; } }
    { const ch = C.syncChoice(phone, acct, true); if (ch === "take") phone = { doc: acct.doc, at: acct.at }; }
    ok(writes === 1 && acct.doc[0].name === "Capital One Quicksilver" && phone.doc[0].name === "Capital One Quicksilver",
      `…his walk: 5 phone syncs, then the laptop's offline rename comes back — ${writes} write(s), and every copy reads "${phone.doc[0].name}" (r.073: 6 writes, the rename lost)`); }
  { const line = [{ fieldId: "B.rent_mortgage", amountNative: 700, nativePeriod: "month", amount: "700", rec: "month", otherN: "", otherUnit: "days" }];
    ok(C.syncChoice({ doc: line, at: T0 }, { doc: jsonb(line), at: T0 }) === "same" && C.syncChoice({ doc: line, at: T0 }, { doc: [{ ...line[0], amountNative: 701 }], at: T0 }) === "resend",
      "…the same class on the budget: a line still carrying r.021's keys reads the same in any key order; other content at the same time is still repaired"); }
  ok(C.syncChoice({ doc: 1, at: 5 }, { doc: 2, at: 6 }) === "take" && C.syncChoice({ doc: 1, at: 6 }, { doc: 2, at: 5 }) === "send" && C.syncChoice({ doc: 1, at: 5 }, null) === "send" && C.syncChoice({ doc: [], at: 0 }, { doc: [1], at: 0 }, true) === "same",
    "…the rule: the copy edited later wins; no account copy → send; a tie only repairs cards this device edited");
  // (B) Krishna's should-fix: the phone sets rent to 1,500; the laptop, its clock 5 minutes behind, takes it and types 1,550 — its edit is dated
  // after the copy it took, so it goes up (r.073 dated it 5 minutes earlier: the laptop's next sync took 1,500 back and 1,550 was lost)
  { const took = T0, typed = C.nextStamp(took, T0 - 5 * MIN + 1000);
    ok(typed === took + 1 && C.syncChoice({ doc: 1550, at: typed }, { doc: 1500, at: took }) === "send" && C.syncChoice({ doc: 1550, at: T0 - 5 * MIN + 1000 }, { doc: 1500, at: took }) === "take",
      "r.073 second review (Krishna): an edit is never dated at or before the newest time this device has seen — a clock 5 minutes behind no longer loses 1,550"); }
  ok((ux.match(/localStorage\.setItem\(`fin-plan-at:/g) || []).length === 1 && (ux.match(/localStorage\.setItem\(`fin-cards-at:/g) || []).length === 1
    && /const keepPlanHere = \(who: string, lines: LadderLine\[\], at: number\): boolean => \{ const kept = savePlan\(who, lines\); if \(kept\) \{ try \{ localStorage\.setItem\(`fin-plan-at:\$\{who\}`, String\(at\)\);/.test(ux)
    && /const keepCardsHere = \(who: string, list: Card\[\], at: number\) => \{ try \{ localStorage\.setItem\(CARDS_KEY\(who\), JSON\.stringify\(list\)\); localStorage\.setItem\(`fin-cards-at:\$\{who\}`, String\(at\)\);/.test(ux)
    && /const at = nextStamp\(planAtRef\.current, Date\.now\(\)\);/.test(ux) && /const at = nextStamp\(cardsAtRef\.current, Date\.now\(\)\);/.test(ux) && !/String\(Date\.now\(\)\)\); \} catch/.test(ux),
    "r.073 second review (Thor, the blocker): a budget's or the cards' time is written in exactly one place each, after the content it dates was kept (a full phone took the 13-character time and refused the lines, then sent its old lines over the account's newer ones)");
  ok(/\{failed && <p role="alert" data-fin-cards-save-failed/.test(ux) && /failed=\{cardsFailed\}/.test(ux),
    "…and cards a device would not keep are said, in their own words, above the folded panel");
  ok(/const holdsRecord = !!holds && holds\.record === record, acctHolds = holdsRecord && holds\?\.plan === plan && holds\?\.cards === cards;/.test(ux) && /<CloudMark saved=\{acctHolds\} \/>/.test(ux) && /if \(!who \|\| !ck \|\| ck\.owner !== who\) return false;/.test(ux),
    "r.073 second review (Thor): \"saved to your account\" is shown only while the account holds exactly what the page shows; the account key names its person");
  // (C) Enki: the budget box — every prefix of a refused figure puts the line back; a readable figure applies; a cleared box restores it
  { const lines = [{ fieldId: "B.rent_mortgage", amountNative: 700, nativePeriod: "month" }, { fieldId: "F.groceries", amountNative: 400, nativePeriod: "month" }];
    const type = (word, keys = [...word].map((_, i) => word.slice(0, i + 1))) => keys.reduce((st, k) => { const r = P.typeIntoLine(st.lines, "B.rent_mortgage", k, "month", lines[0]); return { lines: r.lines, bad: r.bad }; }, { lines, bad: false });
    const refused = ["1e3", "12,50", "1000000000000", "0x10", "-50", "1e400", "abc"].map((w) => [w, type(w)]);
    ok(refused.every(([, r]) => r.lines[0].amountNative === 700 && r.bad && r.lines[1].amountNative === 400),
      `r.073 second review (Enki): typed one key at a time, every refused figure leaves the line at 700 and says so (${refused.map(([w, r]) => `${w}→${r.lines[0].amountNative}`).join(" · ")})`);
    const good = type("1,234.56"), cleared = type("", ["70", "7", ""]);
    ok(good.lines[0].amountNative === 1234.56 && !good.bad && cleared.lines[0].amountNative === 700 && !cleared.bad,
      "…1,234.56 applies; a box backspaced to nothing puts the line back (it used to keep the first digit, 7.00)"); }
  { const per = 2592000, vals = [101.09 / per, 1000.512 / per, 89.73 / per, 0.0673, 0.1404, 12.5, 123.46];
    const rt = vals.map((v) => { const f = T.budgetFigure(v); return { f, back: T.parseBudgetAmount(f), v }; });
    ok(rt.every((r) => r.back !== null && Math.abs(r.back - r.v) <= Math.abs(r.v) * 1e-4 + 0.005 * (Math.abs(r.v) >= 100) && !/e/i.test(r.f)) && T.budgetFigure(0) === "0" && T.smallDollars(89.73 / per) !== "0.0000",
      `…per second the box shows enough decimals to keep the line (${rt.slice(0, 3).map((r) => r.f).join(" · ")}), never an exponent; the table never reads 0.0000 for a real line`); }
  // (D) Enki: a card in credit can be edited (its balance shows "-264.73", which no reader takes); the currency's mark is read; levels left blank
  { const card = { id: "c", name: "Visa", limitCents: 300000, openingCents: 73527, openingAtMs: T0, amberCents: 150000, redCents: 200000 }, bal = -26473;
    const c2 = K.applyCardSettings(card, { name: "Visa Gold", limitCents: 300000, amberCents: 100000, redCents: 200000, openingCents: bal }, bal, T0 + MIN);
    ok(!!c2 && c2.name === "Visa Gold" && c2.amberCents === 100000 && c2.openingCents === 73527 && c2.openingAtMs === T0 && T.parseCardCents("R$ 3,000", ["R$"]) === 300000,
      "r.073 second review (Enki): a card in credit is renamed and re-levelled, its opening kept; \"R$ 3,000\" reads under BRL");
    ok(/openingCents: draft\.opening\.trim\(\) === \(bal \/ 100\)\.toFixed\(2\) \? bal : cents\(draft\.opening\)/.test(ux) && /if \(unread\(draft\.limit, draft\.opening, draft\.amber, draft\.red\)\) \{ setBad\("amount"\); return; \}/.test(ux) && (ux.match(/setBad\("amount"\)/g) || []).length === 2 && /amberCents: draft\.amber\.trim\(\) \? cents\(draft\.amber\) : Math\.round\(lim \* 0\.5\)/.test(ux),
      "…the gear reads its balance from the text shown, says \"enter the amount in digits\" for a figure that does not read (never a levels problem), and a blank level takes the add form's half / two-thirds"); }
  // (E) Enki's nits
  ok(T.amountProblem("1000000000000") === "large" && T.amountProblem("1,000,000,000,000") === "large" && T.amountProblem("1e3") === "form" && T.amountProblem("") === "zero" && T.parseDaysText("1,000") === 1000 && T.parseDaysText("12,50") === null && M.fmtDays(0.5 / 1440) === "0.00035" && !/e/.test(M.fmtDays(6.9e-11)),
    "r.073 second review (Enki): a trillion is \"too large\" (not \"not digits\"); the Other length takes 1,000; a 0.5-minute length reads 0.00035 days, never 0");
}
console.log(`financial-accrual: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);

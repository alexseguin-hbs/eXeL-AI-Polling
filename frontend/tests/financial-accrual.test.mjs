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
  ok(worst <= 25, `the exact engine matches an independent minute-by-minute run within 25¢ across ${cases} probes of 6 seeded records (worst ${worst === Infinity ? "a NEGATIVE Available" : worst.toFixed(2) + "¢"})`);
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
// ── r.055 (addendum 112): the cloud copy merges without ever dropping an entry ──
{
  const C = await import("../lib/financial-2525/cloud.ts");
  const d = { id: "d1", kind: "deposit", amountCents: 360449, atMs: 1, motDays: 30 };
  const one = R.append(R.emptyRecord("o"), d, 1), two = R.append(one, { ...d, id: "d2" }, 2), other = R.append(R.emptyRecord("o"), { ...d, id: "x" }, 3);
  let m = C.mergeRecords(R.emptyRecord("o"), two); ok(m.current.entries.length === 2 && !m.keep && !m.push, "empty device + cloud record → the cloud record is taken whole");
  m = C.mergeRecords(two, null); ok(m.current === two && m.push && !m.keep, "device record + empty cloud → pushed");
  m = C.mergeRecords(two, one); ok(m.current === two && m.push && !m.keep, "device ahead of the cloud → device kept and pushed");
  m = C.mergeRecords(one, two); ok(m.current.entries.length === 2 && !m.push && !m.keep, "cloud ahead of the device → cloud taken");
  m = C.mergeRecords(two, other); ok(m.current === two && m.keep === other && m.push, "diverged → the device copy stays and the cloud copy is KEPT whole (never dropped)");
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
  ok(R.replay(R.correctTx(rec, "d1", { kind: "withdrawal" }, t0 + 5))[0].kind === "deposit", "the type cannot be edited");
}
console.log(`financial-accrual: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);

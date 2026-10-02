// financial-rate — the $/min series behind the chart's main view (r.056; addenda 117 · 122 · 127: "$/min is main view" ·
// "where is $/min chart?!?"). Pure math on his own record shape: income, spending and net per minute, monthly repeats, the net by
// the span's end, the current pay cycle.
import { rateSeries, rateAtSeries, netBetween, occurrences, rateAt, cycleStart, lumpWithdrawals, rateIn, overSpan, windowStart } from "../lib/financial-2525/rate-series.ts";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL: " + m); } };
const DAY = 86_400_000, MIN = 60_000;
const t0 = Date.UTC(2026, 9, 1, 1, 54, 35);   // 2026.09.30_19.54..35 CST
const wages = { id: "a", kind: "deposit", amountCents: 360449, atMs: t0, motDays: 30, recurrence: "paymot" };
const note = { id: "b", kind: "deposit", amountCents: 32000, atMs: t0 + 89_000, motDays: 30, recurrence: "paymot" };
const rent = { id: "c", kind: "withdrawal", amountCents: 25066, atMs: t0 + DAY, motDays: 30, recurrence: "paymot" };
const lump = { id: "d", kind: "withdrawal", amountCents: 7100, atMs: t0 + 3 * DAY, motDays: 0, recurrence: "once" };
const txs = [wages, note, rent, lump];

// his income per minute: $3,924.49 over 30 days = 9.0844 cents/min ($0.0908/min)
const inc = rateAt(wages, t0 + 5 * DAY) + rateAt(note, t0 + 5 * DAY);
ok(Math.abs(inc - 392449 / (30 * 1440)) < 1e-9, `income per minute is $3,924.49 ÷ 30 days (got ${inc})`);
ok(Math.abs(rateIn(inc, "hr") - 392449 / 720) < 1e-9 && Math.abs(rateIn(inc, "sec") - inc / 60) < 1e-12 && Math.abs(rateIn(inc, "day") - 392449 / 30) < 1e-9, "per second · per hour · per day are the same rate in other units");
// monthly repeats across a longer span: three paydays in 91 days
ok(occurrences(wages, t0, t0 + 91 * DAY).length === 4 && occurrences(wages, t0, t0 + 89 * DAY).length === 3, "a monthly deposit repeats every 30 days across a 91-day span (projected, never before its entry)");
ok(occurrences({ ...wages, recurrence: "once" }, t0, t0 + 91 * DAY).length === 1, "a one-time deposit does not repeat");
ok(occurrences(wages, t0 + 40 * DAY, t0 + 50 * DAY)[0] === t0 + 30 * DAY, "the occurrence covering a later window starts on the right payday");
// the series: steps where a rate changes; net = income − spending
const from = t0, to = t0 + 30 * DAY;
const pts = rateSeries(txs, from, to);
ok(pts.length >= 3 && pts.every((p, i) => i === 0 || p.t > pts[i - 1].t), "the series is strictly increasing in time");
ok(pts.every((p) => Math.abs(p.net - (p.income - p.spending)) < 1e-9), "net is income minus spending at every point");
const mid = rateAtSeries(pts, t0 + 10 * DAY);
ok(mid && Math.abs(mid.spending - 25066 / (30 * 1440)) < 1e-9, "spending per minute is his $250.66 storage over 30 days once it starts");
ok(rateAtSeries(pts, t0 + 3600_000).spending === 0, "before the withdrawal starts, spending is zero");
ok(lumpWithdrawals(txs, from, to).map((x) => x.id).join() === "d" && pts.every((p) => Number.isFinite(p.spending)), "a one-time withdrawal has no rate — it is a mark");
// net by the end of the span = the area under net
const net30 = netBetween(pts, from, to);
const expect = 392449 - 32000 * (89_000 / (30 * DAY)) - 25066 * (29 / 30);
ok(Math.abs(net30 - expect) < 0.5, `net by the span's end is income − spending accrued over the span (got ${net30.toFixed(2)}, expected ${expect.toFixed(2)})`);
ok(netBetween(pts, to, from) === 0, "an empty interval accrues nothing");
// the current pay cycle
ok(cycleStart(txs, t0 + 45 * DAY) === t0 + 89_000 + 30 * DAY, "the current pay cycle starts at the latest deposit start at or before now (repeats projected)");
ok(Number.isNaN(cycleStart([], t0)), "no deposits: no cycle");
// addendum 128: the chart divides EVERY transaction by the MoT picked (default 30D) — not by its own length, no repeats
const at = t0 + 5 * DAY;
const r30 = rateSeries(overSpan(txs, 30), t0, t0 + 30 * DAY), r91 = rateSeries(overSpan(txs, 91), t0, t0 + 91 * DAY);
ok(Math.abs(rateAtSeries(r30, at).income - 392449 / (30 * 1440)) < 1e-9, "30D: income per minute = all deposits ÷ 30 days");
ok(Math.abs(rateAtSeries(r91, at).income - 392449 / (91 * 1440)) < 1e-9, "91D: income per minute = all deposits ÷ 91 days (no monthly repeats)");
ok(Math.abs(rateAtSeries(r30, at).spending - (25066 + 7100) / (30 * 1440)) < 1e-9, "30D: spending per minute = every withdrawal (the one-time one too) ÷ 30 days");
ok(overSpan(txs, 30).every((x) => x.motDays === 30 && x.recurrence === "once") && txs[0].motDays === 30 && txs[3].motDays === 0, "overSpan sets the chart's MoT on a copy — the record itself is untouched");
ok(windowStart(overSpan(txs, 30), t0 + 5 * DAY) === t0, "the window starts at the earliest deposit still paying (his wages), so it ends when they run out — no false drop");
// r.073 (addendum 171 "if the expense circle overlaps (left or right edge overlaps with another expense, merge). 2700.66 and 155.44 should
// merge (sum up) as one red dot since they are overlapping"): dots merge when their circles reach each other SIDE TO SIDE, whatever their
// heights — his two dots sat 4 px apart across and 12 px apart up and down (12.6 px diagonally, more than the 7 px the old rule needed)
{ const { layoutMarks } = await import("../lib/2525-core/mark-layout.ts");
  const R = 3.5, money = (v) => "−$" + (v / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dot = (x, y, cents) => ({ x, y, text: money(cents), w: 60, value: cents, color: "red" });
  const his = layoutMarks([dot(100, 60, 270066), dot(104, 48, 15544)], R, money);
  ok(Math.hypot(4, 12) > 2 * R && his.length === 1 && his[0].merged === 2 && his[0].text === "−$2,856.10",
    `r.073 (addendum 171): his −$2,700.66 and −$155.44, side by side at different heights, read as one dot −$2,856.10 (got ${his.map((l) => l.text).join(" · ")})`);
  const touch = layoutMarks([dot(100, 60, 100), dot(107, 30, 200)], R, money), apart = layoutMarks([dot(100, 60, 100), dot(107.5, 60, 200)], R, money);
  ok(touch.length === 1 && touch[0].text === "−$3.00" && apart.length === 2 && apart[0].align === "right" && apart[1].align === "left",
    "…edges that touch merge (7 px apart with 3.5 px dots); 7.5 px apart they stay two dots, their labels left and right");
  const chain = layoutMarks([dot(0, 50, 100), dot(6, 40, 100), dot(12, 50, 100)], R, money);
  ok(chain.length === 1 && chain[0].merged === 3 && chain[0].text === "−$3.00", "…and a chain merges whole: a dot touching the last dot of a merged group joins it");
}
console.log(`\nfinancial-rate: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

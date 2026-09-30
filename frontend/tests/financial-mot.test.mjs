// financial-mot — THE MoT LAW + THE CALENDAR of Financial-2525 (operator 2026-09-30, v.000_r.001).
// A MoT is one whole; a moment inside it is its elapsed fraction in Base-3600 (A.B..C), 0.0000..0000 at the start and
// 3600.3600..3600 at completion; every position converts to Earth LTU and back. The year resets at perihelion (Austin,
// CST standard); quarters are 91 days, day 365 is DOWN; personal frames run 33 / 66 / 99 days.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/financial-mot.test.mjs
const M = await import("../lib/financial-2525/mot.ts");
const C = await import("../lib/financial-2525/calendar.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, eps) => Math.abs(a - b) <= eps;

// ── 1 · A.B..C of a MoT ────────────────────────────────────────────────────────────────────────────────────────
const MOT = M.motSeconds(M.MOT_PAY_MONTH_DAYS);
ok(near(M.MOT_PAY_MONTH_DAYS, 30.3333, 1e-3) && MOT === 2620800, `the pay MoT is 91/3 = 30.333 days = 2,620,800 s (got ${MOT})`);
ok(M.fmtMot(M.motABC(0, MOT)) === "0.0000..0000", "the start of a MoT reads 0.0000..0000 (perihelion of the period)");
ok(M.fmtMot(M.motABC(MOT, MOT)) === "3600.3600..3600", "the end of a MoT reads 3600.3600..3600 — the operator's FULL");
ok(M.fmtMot(M.motABC(MOT / 2, MOT)) === "1800.0000..0000", "half way reads 1800.0000..0000");
ok(M.fmtMot(M.motABC(MOT * 2, MOT)) === "3600.3600..3600" && M.fmtMot(M.motABC(-5, MOT)) === "0.0000..0000", "clamped to the whole: past the end is FULL, before the start is 0");
ok(M.isFull({ a: 3600, b: 0, c: 0 }) && M.isFull({ a: 3600, b: 3600, c: 3600 }) && M.isFull({ a: 3599, b: 3599, c: 3599 }) && !M.isFull({ a: 3599, b: 3599, c: 3598 }), "the sheet's three writings — 3600.0000..0000 · 3600.3600..3600 · 3599.3599..3599 — are Equal (all FULL)");
const u = M.motUnits(MOT);
ok(near(u.aSec, 728, 1e-9) && near(u.bSec, 728 / 3600, 1e-9) && near(u.cSec, 728 / 3600 / 3600, 1e-12), `in a 30.333-day MoT one A = 728 s (12.13 min), one B = 0.202 s, one C = 56 µs (got A ${u.aSec})`);
for (const e of [0, 1, 59, 3600, 86400, 1234567, MOT - 1, MOT]) {
  const back = M.ltuOfMotABC(M.motABC(e, MOT), MOT);
  ok(near(back, e, 1), `A.B..C ↔ LTU round-trips within 1 s at ${e} s (got ${back.toFixed(3)})`);
}
ok(M.ltuOfMotABC(M.FULL_ABC, 12345) === 12345, "FULL converts to the whole MoT in LTU");
// Mars: the same scale — a sol-based period runs 0 → FULL identically; only the LTU seconds differ
const SOL = 88775.244, MARS_MOT = 30 * SOL;
ok(M.fmtMot(M.motABC(MARS_MOT / 4, MARS_MOT)) === "900.0000..0000" && near(M.ltuOfMotABC({ a: 900, b: 0, c: 0 }, MARS_MOT), MARS_MOT / 4, 1e-6), "a Martian 30-sol MoT reads the same A.B..C at a quarter (900.0000..0000) — the scale never names a planet");

// ── 2 · rates: the worked example and the sheet ───────────────────────────────────────────────────────────────
const AMT = 360449; // $3,604.49 in cents
ok(near(M.perMin(AMT, M.MOT_PAY_MONTH_DAYS), 8.2520, 1e-3), `$3,604.49 over 30.333 days = 8.252 ¢/min = $0.0825/min (got ${M.perMin(AMT, M.MOT_PAY_MONTH_DAYS).toFixed(4)})`);
ok(near(M.perDay(AMT, M.MOT_PAY_MONTH_DAYS), 11882.93, 0.01) && near(M.perHour(AMT, M.MOT_PAY_MONTH_DAYS), 495.12, 0.01) && near(M.perSec(AMT, M.MOT_PAY_MONTH_DAYS), 0.13753, 1e-4), "…= $118.83/day · $4.95/hour · $0.001375/sec (360,449 × 3 ÷ 91 = 11,882.93 ¢/day)");
ok(M.perMin(14400, 1) === 10, "the sheet: 144 $/D = 0.1 $/m (10 ¢/min)");
ok(M.perUnit(14400, 1, "W") === 100800 && M.perUnit(14400, 1, "M") === 475200 && M.perUnit(14400, 1, "Q") === 1425600 && M.perUnit(14400, 1, "Y") === 5256000, "the sheet's ladder: 1,008 $/W · 4,752 $/M33 (the sheet's 4,762 is its own slip) · 14,256 $/Q99 · 52,560 $/Y");
ok(M.LTU_DAYS.D === 1 && M.LTU_DAYS.W === 7 && M.LTU_DAYS.M === 33 && M.LTU_DAYS.Q === 99 && M.LTU_DAYS.Y === 365 && M.MIN_PER_DAY === 1440, "LTU units as the sheet writes them (D · W 7 · M 33 · Q 99 · Y 365 · 1440 m/D)");

// ── 3 · CST stamps and sheet durations ────────────────────────────────────────────────────────────────────────
const t0 = M.cstMs(2026, 10, 1, 7, 0, 0);
ok(t0 === Date.UTC(2026, 9, 1, 13, 0, 0), "07:00 CST on 2026-10-01 is 13:00 UTC — CST standard is UTC−6, no daylight shift");
ok(M.fmtStampCST(t0) === "2026.10.01_07.00..00", `the stamp reads 2026.10.01_07.00..00 (got ${M.fmtStampCST(t0)})`);
ok(M.parseStampCST("2026.10.01_07.00..00") === t0 && M.parseStampCST("2026.01.11_13.11.11") === M.cstMs(2026, 1, 11, 13, 11, 11) && M.parseStampCST("garbage") === null, "the stamp parses back (double or single dot before the seconds); garbage is null, never a date");
ok(M.fmtDurationDays(33) === "0000.00.33_00.00..00" && M.fmtDurationDays(16.5) === "0000.00.16_12.00..00", "durations as the sheet writes them: 33 days · 16.5 days");
ok(M.parseDurationDays("0000.00.16_12.00..00") === 16.5 && M.parseDurationDays("0000.00.33_00.00.00") === 33 && M.parseDurationDays("0001.00.00_00.00..00") === 365 && M.parseDurationDays("x") === null, "durations parse back (years → 365, months → 33)");

// ── 4 · the calendar: perihelion resets the year ──────────────────────────────────────────────────────────────
const p26 = C.perihelionOf(2026), p27 = C.perihelionOf(2027);
ok(p26.ms === Date.parse("2026-01-03T17:15Z") && p26.status === "SOURCED" && C.PERIHELION[2026].source.length > 10, "2026 opens at the sourced perihelion 2026-01-03 17:15 UTC");
ok(C.perihelionOf(2040).status === "DECLARED" && C.perihelionOf(2040).ms === Date.UTC(2040, 0, 3, 12), "a year outside the table is DECLARED (Jan 3 12:00 UTC) and says so — never a silent guess");
ok(Object.keys(C.PERIHELION).length === 12 && Object.values(C.PERIHELION).every((r) => /^\d{4}-01-0\dT\d{2}:\d{2}Z$/.test(r.utc) && r.status === "SOURCED"), "twelve sourced years 2024–2035, each an early-January UTC instant");
const at = (d, h = 0) => p26.ms + d * M.MS_PER_DAY + h * 3600 * 1000;
let y = C.positionInYear(p26.ms);
ok(y.year === 2026 && y.day === 1 && y.quarter === 1 && y.dayInQuarter === 1 && !y.down && M.fmtMot(y.abc) === "0.0000..0000", "the perihelion instant is day 1 · Q1 · 0.0000..0000");
y = C.positionInYear(at(90, 23));
ok(y.day === 91 && y.quarter === 1 && y.dayInQuarter === 91, "day 91 closes Q1");
y = C.positionInYear(at(91));
ok(y.day === 92 && y.quarter === 2 && y.dayInQuarter === 1, "day 92 opens Q2 (91-day quarters)");
y = C.positionInYear(at(363, 12));
ok(y.day === 364 && y.quarter === 4 && y.dayInQuarter === 91 && !y.down, "day 364 closes Q4 — the 4 × 91 grid");
y = C.positionInYear(at(364));
ok(y.day === 365 && y.quarter === 0 && y.down, "day 365 is the DOWN day — no quarter owns it");
y = C.positionInYear(p27.ms - 60000);
ok(y.year === 2026 && y.down && y.abc.a >= 3599, "the minute before the next perihelion is still 2026, down, and reads ~FULL");
y = C.positionInYear(p27.ms);
ok(y.year === 2027 && y.day === 1 && M.fmtMot(y.abc) === "0.0000..0000", "the next perihelion resets to day 1 · 0.0000..0000 — the year is one orbit");
ok(C.positionInYear(Date.UTC(2026, 0, 2)).year === 2025, "2026-01-02 (before the 2026 perihelion) still belongs to financial year 2025");
ok(near(C.positionInYear(p26.ms).lengthDays, 364.39, 0.01), `2026 runs 364.39 days perihelion to perihelion (the orbit, not a calendar) — got ${C.positionInYear(p26.ms).lengthDays.toFixed(3)}`);
const f = C.frameOf(at(40), 33);
ok(f.index === 1 && f.dayInFrame === 8 && f.frameDays === 33 && M.fmtMot(f.abc).startsWith("763."), "personal 33-day frames count from day 1: day 41 is frame 2, day 8 of it");
ok(C.FRAMES.join() === "33,66,99" && C.QUARTER_DAYS === 91 && C.GRID_DAYS === 364 && C.DOWN_DAY === 365 && C.unitDays("Q") === 99, "frames 33/66/99 · quarter 91 · grid 364 · down 365 · Q99 for analysis");

console.log(`financial-mot: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);

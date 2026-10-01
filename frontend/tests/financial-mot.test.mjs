// financial-mot — THE MoT LAW + THE CALENDAR of Financial-2525 (operator 2026-09-30, v.000_r.005).
// The whole is every planet's own revolution, perihelion to perihelion, = 3600 A; for Earth the financial year is EXACTLY
// the EXACT year 365.259636 d = 3600.0000..0000 (half = 1800), so one A = 8,766.23 s; the day · hour · minute · second ladder is DERIVED from the
// scale; a length prints its true A even past 3600; a position past day 365 is shown and flagged, never clamped; below C
// there is D. Quarters are 91 days, day 365 is DOWN (Dec 31 on the calendar anchor — the system's offline day); the
// perihelion anchor stays selectable; personal frames run 33 / 66 / 99 days. Mars: its own revolution, Earth hours for now.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/financial-mot.test.mjs
const M = await import("../lib/financial-2525/mot.ts");
const C = await import("../lib/financial-2525/calendar.ts");
const U = await import("../lib/ucrs-2525.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, eps) => Math.abs(a - b) <= eps;

// ── 1 · the whole: the EXACT revolution, 365.259636 days = 3600 A (addendum 18 — '365.25 etc.'); never clamped ──────
const MOT = M.motSeconds(M.MOT_PAY_MONTH_DAYS);
ok(near(M.MOT_PAY_MONTH_DAYS, 30.3333, 1e-3) && MOT === 2620800, `the pay MoT is 91/3 = 30.333 days = 2,620,800 s (got ${MOT})`);
const FY = M.FINANCIAL_YEAR_SEC;
ok(M.FINANCIAL_YEAR_DAYS === M.EARTH_REVOLUTION_DAYS && M.FINANCIAL_YEAR_DAYS === 365.259636 && near(FY, 31558432.55, 0.01) && near(M.HALF_YEAR_DAYS, 182.629818, 1e-9), "the financial year IS the exact anomalistic year, 365.259636 days = 31,558,432.55 s — one primitive; half is 182.629818 d (r.005's exact 365 superseded, addendum 18)");
ok(M.fmtMot(M.motABC(0, FY)) === "0.0000..0000", "the year's opening reads 0.0000..0000");
ok(M.fmtMot(M.motABC(FY, FY)) === "3600.0000..0000" && M.isFull(M.motABC(FY, FY)), "the exact year reads 3600.0000..0000 — 'which can also be notated 3600' — and is FULL");
ok(M.fmtMot(M.motABC(FY / 2, FY)) === "1800.0000..0000" && M.fmtMot(M.spanABC(M.HALF_YEAR_DAYS)) === "1800.0000..0000", "half a year, 182.629818 days, reads 1800.0000..0000 (position and length)");
ok(M.fmtMot(M.motABC(2 * FY, FY)) === "7200.0000..0000" && M.fmtMot(M.motABC(-5, FY)) === "0.0000..0000", "a position is never clamped above: two years read 7200; before the opening is 0");
ok(M.isFull({ a: 3600, b: 0, c: 0 }) && M.isFull({ a: 3600, b: 3600, c: 3600 }) && M.isFull({ a: 3599, b: 3599, c: 3599 }) && !M.isFull({ a: 3599, b: 3599, c: 3598 }), "the sheet's three writings — 3600.0000..0000 · 3600.3600..3600 · 3599.3599..3599 — are Equal (all FULL), a predicate");
ok(M.fmtMot(M.FULL_ABC) === "3600.3600..3600" && M.FULL_MOT === "3600.3600..3600", "the sheet's writing is kept as text, never substituted for a true A");
const u = M.orbitUnits(FY);
ok(near(u.aSec, 8766.231264, 1e-6) && near(u.bSec, 2.43506, 1e-5) && near(u.cSec, 0.000676407, 1e-9) && near(u.dSec, 1.8789e-7, 1e-11), `one A = 8,766.23 s (2 h 26 min), one B = 2.4351 s, one C = 0.6764 ms, one D = 0.18789 µs (got A ${u.aSec})`);
for (const e of [0, 1, 59, 3600, 86400, 1234567, FY - 1, FY, FY + 86400]) {
  const back = M.ltuOfMotABC(M.motABC(e, FY), FY);
  ok(near(back, e, 1), `A.B..C ↔ LTU round-trips within 1 s at ${e} s of the year, day 366 included (got ${back.toFixed(3)})`);
}
ok(M.ltuOfMotABC(M.FULL_ABC, 12345) === 12345 && M.fractionOf({ a: 7200, b: 0, c: 0 }) === 2 && M.fractionOf({ a: 1800, b: 0, c: 0 }) === 0.5, "an Equal writing converts to exactly the whole; 7200 is two wholes; 1800 is half");
// the derived ladder: "we use this to translate to day/min/sec"
ok(near(M.A_PER.day, 9.856003, 1e-6) && near(M.A_PER.hour, 0.4106668, 1e-7) && near(M.A_PER.min, 0.00684445, 1e-8) && near(M.A_PER.sec, 1.140741e-4, 1e-10), "one day = 9.8560 A · one hour 0.41067 A · one minute 0.0068444 A · one second 0.00011407 A (1,478 C)");
// a LENGTH converts INTO the scale
const span = M.spanABC(M.MOT_PAY_MONTH_DAYS);
ok(span.a === 298 && M.fmtMot(span) === "298.3475..1826" && near(M.daysOfSpanABC(span), M.MOT_PAY_MONTH_DAYS, 1e-6), `the 30.333-day pay MoT is 298.3475..1826 A (≈ 298.97 — r.003's reading on the exact year, back again; r.005's 299.0641..0345 on exactly 365 d superseded) and converts back to 30.333 days (${M.fmtMot(span)})`);
ok(M.fmtMot(M.spanABC(1)) === "9.3081..2196" && M.fmtMot(M.spanABC(M.FINANCIAL_YEAR_DAYS)) === "3600.0000..0000" && M.fmtMot(M.spanABC(2 * M.FINANCIAL_YEAR_DAYS)) === "7200.0000..0000" && M.spanABC(0).a === 0, "one day 9.3081..2196 · the exact year 3600.0000..0000 · two years 7200.0000..0000 — a length prints its true A, never clamped");
ok(M.fmtMot(M.spanABC(365)) === "3597.1587..2508" && M.fmtMot(M.spanABC(730)) === "7194.3175..1416", "365 calendar days are 3597.1587..2508 A — short of the exact revolution by 0.26 d; 730 are 7194.3175..1416 (r.005 read them 3600 / 7200 — superseded)");
ok(M.fmtMot(M.spanABC(0.125)) === "1.0835..0725" && M.fmtMot(M.spanABC(2)) === "19.2563..0793" && M.fmtMot(M.spanABC(1 / 86400)) === "0.0000..1478" && M.fmtMot(M.spanABC(1 / 24)) === "0.1478..1442", "the 3-hour hold 1.0835..0725 · two days 19.2563..0793 · one second 0.0000..1478 · one hour 0.1478..1442");
// the fourth tier D
ok(M.fmtABCD(M.spanABCD(M.MOT_PAY_MONTH_DAYS)) === "298.3475..1825...3469" && M.fmtABCD(M.toABCD(3600)) === "3600.0000..0000...0000", "A.B..C...D: the pay MoT reads 298.3475..1825...3469; 3600 reads 3600.0000..0000...0000");
for (const v of [0, 0.5, 299.178, 3599.99999, 3609.863]) ok(near(M.abcdToValue(M.toABCD(v)), v, 1 / 3600 ** 3), `A.B..C...D round-trips within one D at ${v}`);
// Mars: its own revolution as the whole, Earth hours as the LTU for now (FD-16); the sol form on the record
const MARS_E = M.motSeconds(M.MARS_REVOLUTION_EARTH_DAYS), MARS_S = M.MARS_REVOLUTION_SOLS * M.SOL_SEC;
ok(U.PLANETS.find((p) => p.id === "mars")?.tDays === M.MARS_REVOLUTION_EARTH_DAYS, "Mars' revolution is ONE primitive: mot.ts equals UCRS-2525's PLANETS mars.tDays (686.98 Earth days)");
ok(near(M.orbitUnits(MARS_E).aSec, 16487.52, 0.01) && near(M.orbitUnits(MARS_E).aSec / 3600, 4.58, 0.01), "on Mars one A = 16,487.5 s = 4.58 Earth hours (Earth hours as LTU for now)");
ok(M.spanABC(30 * M.SOL_SEC / M.SEC_PER_DAY, M.MARS_REVOLUTION_EARTH_DAYS).a === 161 && M.spanABC(30, M.MARS_REVOLUTION_EARTH_DAYS).a === 157, "a 30-sol MoT on Mars is 161 A of the Martian revolution; 30 Earth days are 157 A");
ok(near(MARS_S, MARS_E, 30) && M.fmtMot(M.motABC(MARS_S / 4, MARS_S)) === "900.0000..0000" && M.spanABC(30, M.MARS_REVOLUTION_SOLS).a === 161, "the sol form (668.5991 sols × 88,775.244 s) is the same whole within 30 s; a quarter reads 900.0000..0000 on either");

// ── 2 · rates: the worked example and the sheet ───────────────────────────────────────────────────────────────
const AMT = 360449; // $3,604.49 in cents
ok(near(M.perMin(AMT, M.MOT_PAY_MONTH_DAYS), 8.2520, 1e-3), `$3,604.49 over 30.333 days = 8.252 ¢/min = $0.0825/min (got ${M.perMin(AMT, M.MOT_PAY_MONTH_DAYS).toFixed(4)})`);
ok(near(M.perDay(AMT, M.MOT_PAY_MONTH_DAYS), 11882.93, 0.01) && near(M.perHour(AMT, M.MOT_PAY_MONTH_DAYS), 495.12, 0.01) && near(M.perSec(AMT, M.MOT_PAY_MONTH_DAYS), 0.13753, 1e-4), "…= $118.83/day · $4.95/hour · $0.001375/sec (360,449 × 3 ÷ 91 = 11,882.93 ¢/day)");
ok(M.perMin(14400, 1) === 10, "the sheet: 144 $/D = 0.1 $/m (10 ¢/min)");
ok(M.perUnit(14400, 1, "W") === 100800 && M.perUnit(14400, 1, "M") === 475200 && M.perUnit(14400, 1, "Q") === 1425600 && M.perUnit(14400, 1, "Y") === 5256000, "the sheet's ladder: 1,008 $/W · 4,752 $/M33 (the sheet's 4,762 is its own slip) · 14,256 $/Q99 · 52,560 $/Y");
ok(M.LTU_DAYS.D === 1 && M.LTU_DAYS.W === 7 && M.LTU_DAYS.M === 33 && M.LTU_DAYS.Q === 99 && M.LTU_DAYS.Y === 365 && M.MIN_PER_DAY === 1440, "the sheet's personal frame as it writes it (D · W 7 · M 33 · Q 99 · Y 365 · 1440 m/D); the Admin table's Month 91 is the analysis ladder");

// ── 3 · CST stamps and sheet durations ────────────────────────────────────────────────────────────────────────
const t0 = M.cstMs(2026, 10, 1, 7, 0, 0);
ok(t0 === Date.UTC(2026, 9, 1, 13, 0, 0), "07:00 CST on 2026-10-01 is 13:00 UTC — CST standard is UTC−6, no daylight shift");
ok(M.fmtStampCST(t0) === "2026.10.01_07.00..00", `the stamp reads 2026.10.01_07.00..00 (got ${M.fmtStampCST(t0)})`);
ok(M.parseStampCST("2026.10.01_07.00..00") === t0 && M.parseStampCST("2026.01.11_13.11.11") === M.cstMs(2026, 1, 11, 13, 11, 11) && M.parseStampCST("garbage") === null, "the stamp parses back (double or single dot before the seconds); garbage is null, never a date");
ok(M.fmtDurationDays(33) === "0000.00.33_00.00..00" && M.fmtDurationDays(16.5) === "0000.00.16_12.00..00", "durations as the sheet writes them: 33 days · 16.5 days");
ok(M.parseDurationDays("0000.00.16_12.00..00") === 16.5 && M.parseDurationDays("0000.00.33_00.00.00") === 33 && M.parseDurationDays("0001.00.00_00.00..00") === 365 && M.parseDurationDays("x") === null, "durations parse back (years → 365, months → 33)");

// ── 4 · the calendar anchor "calendar" (r.005's default for one edition; kept selectable): Jan 1 opens the year, Dec 31 is the offline day
ok(C.DEFAULT_ANCHOR === "perihelion", "the default anchor is the perihelion (addendum 18: 'remember perihelion exact time for Austin Texas CST is Standard'); the calendar year stays selectable");
const K = (ms) => C.positionInYear(ms, "calendar");
let y = K(M.cstMs(2026, 1, 1));
ok(y.year === 2026 && y.anchor === "calendar" && y.day === 1 && y.quarter === 1 && !y.down && M.fmtMot(y.abc) === "0.0000..0000" && y.lengthDays === 365, "Jan 1 at midnight CST is day 1 · Q1 · 0.0000..0000 of a 365-day calendar year");
y = K(M.cstMs(2026, 7, 2, 12));
ok(y.day === 183 && M.fmtMot(y.abc) === "1798.2593..3054", "noon on Jul 2 is half the CALENDAR year: 1798.2593..3054 on the exact whole (1800 was r.005's exact-365 reading)");
y = K(M.cstMs(2026, 10, 1, 7));
ok(y.day === 274 && y.quarter === 4 && y.dayInQuarter === 1 && M.fmtMot(y.abc) === "2693.2028..1324", "the worked deposit (Oct 1 07:00 CST) is day 274, Q4 day 1, 2693.2028..1324 on the calendar anchor");
y = K(M.cstMs(2026, 12, 30, 12));
ok(y.day === 364 && y.quarter === 4 && y.dayInQuarter === 91 && !y.down, "Dec 30 is day 364 — Q4 day 91 closes the 4 × 91 grid");
y = K(M.cstMs(2026, 12, 31, 23, 59));
ok(y.day === 365 && y.quarter === 0 && y.down && !y.pastFull && M.fmtMot(y.abc).startsWith("3597.") , "Dec 31 is day 365 — the DOWN day, the system's one offline day; its last minute reads 3597.… on the exact whole and is not past full");
y = K(M.cstMs(2028, 12, 31, 12));
ok(y.day === 366 && y.down && y.pastFull && y.abc.a === 3602 && y.lengthDays === 366, "a leap year's Dec 31 is day 366: down, past full (3602.…), said, never clamped");
ok(K(M.cstMs(2027, 1, 1)).year === 2027 && K(M.cstMs(2027, 1, 1)).day === 1, "Jan 1 resets to day 1");
const fc = C.frameOf(M.cstMs(2026, 2, 10), 33, "calendar");
ok(fc.index === 1 && fc.dayInFrame === 8 && M.fmtMot(fc.abc).startsWith("763."), "personal 33-day frames count from day 1 on the calendar anchor: Feb 10 is frame 2, day 8 of it");

// ── 5 · the perihelion anchor (THE DEFAULT again, addendum 18): the reset is the perihelion, never the number ────
const p26 = C.perihelionOf(2026), p27 = C.perihelionOf(2027), p28 = C.perihelionOf(2028), p29 = C.perihelionOf(2029);
ok(p26.ms === Date.parse("2026-01-03T17:15Z") && p26.status === "SOURCED" && C.PERIHELION[2026].source.length > 10, "2026 opens at the sourced perihelion 2026-01-03 17:15 UTC");
ok(C.perihelionOf(2040).status === "DECLARED" && C.perihelionOf(2040).ms === Date.UTC(2040, 0, 3, 12), "a year outside the table is DECLARED (Jan 3 12:00 UTC) and says so — never a silent guess");
ok(Object.keys(C.PERIHELION).length === 12 && Object.values(C.PERIHELION).every((r) => /^\d{4}-01-0\dT\d{2}:\d{2}Z$/.test(r.utc) && r.status === "SOURCED"), "twelve sourced years 2024–2035, each an early-January UTC instant");
const P = (ms) => C.positionInYear(ms);   // the default anchor
ok(C.perihelionCst(2026).cst === "2026.01.03_11.15..00" && C.perihelionCst(2026).status === "SOURCED" && C.perihelionCst(2028).cst === "2028.01.05_06.28..00", "the perihelion instant is written in Austin CST STANDARD (UTC−6, never daylight): 2026-01-03 17:15 UTC = 2026.01.03_11.15..00 CST; 2028 = 2028.01.05_06.28..00");
const at = (d, h = 0) => p26.ms + d * M.MS_PER_DAY + h * 3600 * 1000;
y = P(p26.ms);
ok(y.year === 2026 && y.anchor === "perihelion" && y.day === 1 && y.quarter === 1 && y.dayInQuarter === 1 && !y.down && M.fmtMot(y.abc) === "0.0000..0000", "the perihelion instant is day 1 · Q1 · 0.0000..0000");
y = P(at(90, 23)); ok(y.day === 91 && y.quarter === 1 && y.dayInQuarter === 91, "day 91 closes Q1");
y = P(at(91)); ok(y.day === 92 && y.quarter === 2 && y.dayInQuarter === 1, "day 92 opens Q2 (91-day quarters)");
y = P(at(363, 12)); ok(y.day === 364 && y.quarter === 4 && y.dayInQuarter === 91 && !y.down, "day 364 closes Q4 — the 4 × 91 grid");
y = P(at(364)); ok(y.day === 365 && y.quarter === 0 && y.down, "day 365 is the DOWN day — no quarter owns it");
y = P(p27.ms - 60000);
ok(y.year === 2026 && y.down && !y.pastFull && y.abc.a === 3591, `2026 is a 364.39-day orbit: the minute before the 2027 perihelion reads 3591.… — not FULL — and resets anyway (got ${M.fmtMot(y.abc)})`);
y = P(p27.ms); ok(y.year === 2027 && y.day === 1 && M.fmtMot(y.abc) === "0.0000..0000", "the next perihelion resets to day 1 · 0.0000..0000 — the reset is the perihelion, not the number");
y = P(p27.ms + 365 * M.MS_PER_DAY); ok(y.day === 366 && M.fmtMot(y.abc) === "3597.1587..2508" && !y.pastFull, "365 days into 2027 (a 367.41-day orbit) reads 3597.1587..2508 on day 366 — not yet the exact whole");
y = P(p27.ms + M.FINANCIAL_YEAR_DAYS * M.MS_PER_DAY); ok(M.fmtMot(y.abc) === "3600.0000..0000" && !y.pastFull, "exactly 365.259636 days into 2027 reads 3600.0000..0000 — the whole, not yet past full");
y = P(p27.ms + 366 * M.MS_PER_DAY); ok(y.day === 367 && y.down && y.pastFull && M.fmtMot(y.abc) === "3607.1069..1104", "day 367 reads 3607.1069..1104 — past full, flagged, never clamped");
y = P(p28.ms - 60000); ok(y.year === 2027 && y.day === 368 && y.pastFull && y.abc.a === 3621, "the minute before the 2028 perihelion is day 368 of 2027 at 3621.…");
y = P(p29.ms - 60000); ok(y.year === 2028 && y.day === 364 && y.quarter === 4 && y.dayInQuarter === 91 && !y.down, "2028 (a 363.24-day orbit) never reaches day 365 — recorded, FIN-02.01");
ok(P(Date.UTC(2026, 0, 2)).year === 2025, "2026-01-02 (before the 2026 perihelion) still belongs to perihelion year 2025");
// r.008 — a planet's positions are A-units of ITS revolution (FIN-13.03): Mars passes 686.98 d; the ratio is 365.259636 ÷ 686.98
{ const e = C.positionInYear(at(100)), mrs = C.positionInYear(at(100), "perihelion", M.MARS_REVOLUTION_EARTH_DAYS);
  const ve = M.abcToValue ? null : null; const vE = e.abc.a + e.abc.b / 3600 + e.abc.c / 3600 ** 2, vM = mrs.abc.a + mrs.abc.b / 3600 + mrs.abc.c / 3600 ** 2;
  ok(near(vM / vE, M.FINANCIAL_YEAR_DAYS / M.MARS_REVOLUTION_EARTH_DAYS, 1e-6) && mrs.abc.a === 524 && e.abc.a === 985, `on Mars day 101 reads ${M.fmtMot(mrs.abc)} A of the Martian revolution (Earth ${M.fmtMot(e.abc)}) — the ratio of the two wholes`);
  ok(C.frameOf(at(40), 33, "perihelion", M.MARS_REVOLUTION_EARTH_DAYS).index === 1, "the personal frame takes the planet's revolution too (same frame index — a frame is days, not A)"); }
ok(near(P(p26.ms).lengthDays, 364.39, 0.01), `2026 runs 364.39 days perihelion to perihelion (the orbit, not a calendar) — got ${P(p26.ms).lengthDays.toFixed(3)}`);
const f = C.frameOf(at(40), 33);
ok(f.index === 1 && f.dayInFrame === 8 && f.frameDays === 33 && M.fmtMot(f.abc).startsWith("763."), "personal 33-day frames count from day 1: day 41 is frame 2, day 8 of it (its own 0→3600 progress, a display aid, not the A.B..C coordinate)");
ok(C.FRAMES.join() === "33,66,99" && C.QUARTER_DAYS === 91 && C.GRID_DAYS === 364 && C.DOWN_DAY === 365 && C.unitDays("Q") === 99, "frames 33/66/99 · quarter 91 · grid 364 · down 365 · Q99 for analysis");

// r.025 — A REPEATING DECIMAL SHOWS ITS BAR (addendum 37 + his answer "Everywhere"): 91 ÷ 3 days reads 30.3̅, never 30.333333333333332.
{
  const B = "\u0305";
  ok(M.fmtDays(91 / 3) === "30.3" + B && M.fmtDays(30.333333333333332) === "30.3" + B, "91 ÷ 3 days reads 30.3 with a bar over the 3 (the float 30.333333333333332 too)");
  ok(M.fmtDays(33) === "33" && M.fmtDays(91) === "91" && M.fmtDays(0) === "0" && M.fmtDays(30.25) === "30.25", "whole and terminating counts print as they are");
  ok(M.fmtDays(1 / 3) === "0.3" + B && M.fmtDays(1 / 6) === "0.16" + B && M.fmtDays(30.333) === "30.333" && M.fmtDays(1 / 7) === "0.143", "a third and a sixth carry the bar; a typed 30.333 stays 30.333; a long repeat (1/7) prints three decimals");
  const a = M.parseStampCST("2026.09.30_19.56..04"), z = a + (91 / 3) * 86400000;
  const t6 = M.dayTicks(a, z, 6), t16 = M.dayTicks(a, z, 16);
  ok(t6.length <= 6 && t6.length >= 4 && M.dateLabel(t6[0], "full") === "2026.10.01" && t6.every((t) => M.fmtStampCST(t).endsWith("_00.00..00")), `the chart's date ticks fall on CST midnights from the first whole day, as many as fit (${t6.map((t) => M.dateLabel(t, "mmdd")).join(" ")})`);
  ok(t16.length <= 16 && M.dateLabel(t16[0], "month") === "01" && M.dateLabel(t16[0], "mmdd") === "10.01" && M.DATE_FMTS.join() === "full,mmdd,month", "three formats: 2026.10.01 · 10.01 · 01 under its month");
}

console.log(`financial-mot: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);

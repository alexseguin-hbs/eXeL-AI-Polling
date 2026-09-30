/**
 * Financial-2525 · the calendar (operator 2026-09-30, v.000_r.001).
 * ====================================================================================================
 * "day resets everywhere at perihelion each year for Austin Texas as CST standard" · "91 days for a quarter with
 * down day 365 of year" · personal frames "Real-Time 33D, 66D, 99D · Analysis D · W = 7D · M = 33D · Q = 99D ·
 * Y = 365D" (sheet 3).
 *
 * Day 1 of every Financial-2525 year begins at the PERIHELION INSTANT (the SoI calendar's own anchor,
 * lib/soi-calendar.ts "Day 1 = Perihelion"; Celestial-2525's HU 0). A financial year is therefore one MoT — one
 * orbit — and its A.B..C position is exactly the celestial one: 0.0000..0000 at perihelion, 3600.3600..3600 at the
 * next. The BUSINESS grid is 4 × 91-day quarters = 364 days; day 365 (and whatever fraction remains until the next
 * perihelion, ~365.25 days later) is the DOWN day — no quarter owns it. The PERSONAL frames run in 33-day months
 * from the same day 1. CST standard (UTC−6, fixed) is only how a day is NAMED; the instants are universal.
 *
 * The perihelion table is SOURCED from Fred Espenak's "Earth at Perihelion and Aphelion: 2001 to 2100" as carried
 * by the Farmers' Almanac (EST → UTC, +5 h) and cross-checked against NASA APOD / EarthSky where a year was quoted;
 * one discrepancy is recorded rather than hidden (2028: 12:28 here vs 12:11 in the older soi-calendar seed). Years
 * outside the table are DECLARED (Jan 3 12:00 UTC) and say so — never a silent guess (U-WF-09). Pure; no clock reads.
 */
import type { ABC } from "@/lib/abc-3600";
import { motABC, MS_PER_DAY, LTU_DAYS, type LtuUnit } from "./mot";

export interface PerihelionRow { utc: string; status: "SOURCED" | "DECLARED"; source: string }
export const PERIHELION: Record<number, PerihelionRow> = {
  2024: { utc: "2024-01-03T00:38Z", status: "SOURCED", source: "thesuntoday.org perihelion-2024 (00:38 UTC)" },
  2025: { utc: "2025-01-04T13:28Z", status: "SOURCED", source: "NASA APOD 2025-01-04 (13:28 UTC)" },
  2026: { utc: "2026-01-03T17:15Z", status: "SOURCED", source: "EarthSky 2026 (17:15 UTC); Farmers' Almanac 12:15 pm EST" },
  2027: { utc: "2027-01-03T02:33Z", status: "SOURCED", source: "Farmers' Almanac (Espenak) Jan 2 9:33 pm EST → 02:33 UTC; in-the-sky.org quotes 02:07 UTC" },
  2028: { utc: "2028-01-05T12:28Z", status: "SOURCED", source: "Farmers' Almanac (Espenak) 7:28 am EST → 12:28 UTC (soi-calendar seed said 12:11 — recorded)" },
  2029: { utc: "2029-01-02T18:13Z", status: "SOURCED", source: "Farmers' Almanac (Espenak) 1:13 pm EST → 18:13 UTC" },
  2030: { utc: "2030-01-03T10:12Z", status: "SOURCED", source: "Farmers' Almanac (Espenak) 5:12 am EST → 10:12 UTC" },
  2031: { utc: "2031-01-04T20:48Z", status: "SOURCED", source: "Farmers' Almanac (Espenak) 3:48 pm EST → 20:48 UTC" },
  2032: { utc: "2032-01-03T05:11Z", status: "SOURCED", source: "Farmers' Almanac (Espenak) 12:11 am EST → 05:11 UTC" },
  2033: { utc: "2033-01-04T11:51Z", status: "SOURCED", source: "Farmers' Almanac (Espenak) 6:51 am EST → 11:51 UTC" },
  2034: { utc: "2034-01-04T04:47Z", status: "SOURCED", source: "Farmers' Almanac (Espenak) Jan 3 11:47 pm EST → 04:47 UTC" },
  2035: { utc: "2035-01-03T00:54Z", status: "SOURCED", source: "Farmers' Almanac (Espenak) Jan 2 7:54 pm EST → 00:54 UTC" },
};
export const PERIHELION_SOURCES = [
  "https://www.farmersalmanac.com/aphelion-and-perihelion",
  "https://earthsky.org/tonight/earth-comes-closest-to-sun-every-year-in-early-january/",
  "https://apod.nasa.gov/apod/ap250104.html",
  "http://www.astropixels.com/ephemeris/perap2001.html",
];

/** The perihelion instant that opens financial year `year`, with its provenance. Outside the table: DECLARED Jan 3 12:00 UTC. */
export function perihelionOf(year: number): { ms: number; status: "SOURCED" | "DECLARED" } {
  const row = PERIHELION[year];
  if (row) return { ms: Date.parse(row.utc), status: row.status };
  return { ms: Date.UTC(year, 0, 3, 12, 0, 0), status: "DECLARED" };
}

export const QUARTER_DAYS = 91;
export const GRID_DAYS = QUARTER_DAYS * 4;   // 364 — the business grid
export const DOWN_DAY = GRID_DAYS + 1;       // 365 — "down day 365 of year"; day 366 (a long orbit's last hours) is down too

export interface YearPosition {
  year: number;            // the financial year (named by the calendar year its perihelion falls in)
  startMs: number;         // its perihelion
  endMs: number;           // the next perihelion (the year is one orbit)
  status: "SOURCED" | "DECLARED";
  day: number;             // 1-based day since perihelion (CST-independent: whole 24 h periods from the instant)
  quarter: 1 | 2 | 3 | 4 | 0;   // 0 = the DOWN day(s)
  dayInQuarter: number;    // 1..91, or the down-day index
  down: boolean;
  abc: ABC;                // the orbit position — the celestial A.B..C, 0.0000..0000 at perihelion
  lengthDays: number;      // perihelion to perihelion (~365.25)
}
/** Where an instant sits in its financial year. */
export function positionInYear(ms: number): YearPosition {
  const g = new Date(ms).getUTCFullYear();
  // the perihelion is early January, so the instant belongs to year g unless it precedes g's perihelion
  let year = g;
  if (ms < perihelionOf(g).ms) year = g - 1;
  const start = perihelionOf(year), end = perihelionOf(year + 1);
  const day = Math.floor((ms - start.ms) / MS_PER_DAY) + 1;
  const down = day > GRID_DAYS;
  const quarter = (down ? 0 : (Math.floor((day - 1) / QUARTER_DAYS) + 1)) as YearPosition["quarter"];
  const dayInQuarter = down ? day - GRID_DAYS : ((day - 1) % QUARTER_DAYS) + 1;
  return {
    year, startMs: start.ms, endMs: end.ms, status: start.status === "DECLARED" || end.status === "DECLARED" ? "DECLARED" : "SOURCED",
    day, quarter, dayInQuarter, down, abc: motABC(ms - start.ms, end.ms - start.ms), lengthDays: (end.ms - start.ms) / MS_PER_DAY,
  };
}

/** The personal frames: 33 / 66 / 99 days, counted from day 1 ("Real-Time 33D, 66D, 99D"). */
export type FrameDays = 33 | 66 | 99;
export const FRAMES: FrameDays[] = [33, 66, 99];
export interface Frame { frameDays: FrameDays; index: number; startMs: number; endMs: number; dayInFrame: number; abc: ABC }
export function frameOf(ms: number, frameDays: FrameDays): Frame {
  const y = positionInYear(ms);
  const index = Math.floor((y.day - 1) / frameDays);
  const startMs = y.startMs + index * frameDays * MS_PER_DAY, endMs = startMs + frameDays * MS_PER_DAY;
  return { frameDays, index, startMs, endMs, dayInFrame: ((y.day - 1) % frameDays) + 1, abc: motABC(ms - startMs, endMs - startMs) };
}
/** Days of an LTU analysis unit (D 1 · W 7 · M 33 · Q 99 · Y 365). */
export const unitDays = (u: LtuUnit): number => LTU_DAYS[u];

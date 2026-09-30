/**
 * Financial-2525 · the calendar (operator 2026-09-30, v.000_r.005).
 * ====================================================================================================
 * "day resets everywhere at perihelion each year for Austin Texas as CST standard" · "91 days for a quarter with
 * down day 365 of year" · personal frames "Real-Time 33D, 66D, 99D · Analysis D · W = 7D · M = 33D · Q = 99D ·
 * Y = 365D" (sheet 3) · "LTU Table should show Month 91 for now (with 1 day system off line Dec 31)" (addendum 13).
 *
 * TWO ANCHORS, one law. The year is 365 days = 3600 A exactly (mot.ts FINANCIAL_YEAR_DAYS); 4 × 91-day quarters = 364
 * days; day 365 is the DOWN day — the system's offline day — and no quarter owns it. Which instant OPENS the year is
 * the anchor, a field of the Admin panel's LTU table (lib/planet-ltu.ts yearAnchor):
 *   · "calendar" (the DEFAULT for now, addendum 13): the year opens Jan 1 at midnight CST and day 365 IS Dec 31 — the one
 *     offline day; a leap year's Feb 29 pushes Dec 31 to day 366, which still reads down and is flagged pastFull.
 *   · "perihelion" (r.001–r.004, kept selectable): the year opens at the PERIHELION INSTANT (the SoI calendar's own
 *     anchor, Celestial-2525's HU 0) and runs to the next; a perihelion-to-perihelion interval swings 363–368 days, so
 *     six of the eleven sourced years never reach 3600 before the reset and 2028 / 2031 / 2034 never reach day 365 —
 *     the reset is the perihelion, never the number (FIN-02.01).
 * The A.B..C of an instant is elapsed ÷ 365 d × 3600 on EITHER anchor, NEVER clamped; past 365 days it reads past
 * 3600 and `pastFull` says so. The PERSONAL frames run in 33-day months from day 1. CST standard (UTC−6, fixed) is
 * only how a day is NAMED; the instants are universal.
 *
 * The perihelion table is SOURCED from Fred Espenak's "Earth at Perihelion and Aphelion: 2001 to 2100" as carried
 * by the Farmers' Almanac (EST → UTC, +5 h) and cross-checked against NASA APOD / EarthSky where a year was quoted;
 * one discrepancy is recorded rather than hidden (2028: 12:28 here vs 12:11 in the older soi-calendar seed). Years
 * outside the table are DECLARED (Jan 3 12:00 UTC) and say so — never a silent guess (U-WF-09). Pure; no clock reads.
 */
import type { ABC } from "@/lib/abc-3600";
import { motABC, MS_PER_DAY, LTU_DAYS, FINANCIAL_YEAR_DAYS, cstMs, cstParts, type LtuUnit } from "./mot";

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
export const DOWN_DAY = GRID_DAYS + 1;       // 365 — "down day 365 of year": Dec 31 on the calendar anchor (the system's
                                             // offline day); days 366–368 of a long perihelion year are down too, flagged pastFull
/** Which instant opens the year — the Admin panel's LTU table decides (lib/planet-ltu.ts); "calendar" for now (addendum 13). */
export type YearAnchor = "calendar" | "perihelion";
export const DEFAULT_ANCHOR: YearAnchor = "calendar";

export interface YearPosition {
  year: number;            // the financial year (the CST calendar year, or the year whose perihelion opened it)
  anchor: YearAnchor;
  startMs: number;         // Jan 1 00:00 CST, or the perihelion instant
  endMs: number;           // the next year's opening instant
  status: "SOURCED" | "DECLARED";
  day: number;             // 1-based day since the opening (whole 24 h periods from the instant; CST midnights on the calendar anchor)
  quarter: 1 | 2 | 3 | 4 | 0;   // 0 = the DOWN day(s)
  dayInQuarter: number;    // 1..91, or the down-day index
  down: boolean;
  abc: ABC;                // elapsed ÷ 365 d × 3600 — never clamped (r.005)
  pastFull: boolean;       // more than 365 days into the year (a leap Dec 31, or a long perihelion interval) — said, never hidden
  lengthDays: number;      // the actual length of this year on its anchor (365 / 366 calendar; 363–368 perihelion)
}
/** Where an instant sits in its financial year, on the given anchor (the LTU table's, "calendar" by default). */
export function positionInYear(ms: number, anchor: YearAnchor = DEFAULT_ANCHOR): YearPosition {
  let year: number, start: { ms: number; status: "SOURCED" | "DECLARED" }, end: { ms: number; status: "SOURCED" | "DECLARED" };
  if (anchor === "calendar") {
    year = cstParts(ms).y;
    start = { ms: cstMs(year, 1, 1), status: "SOURCED" };
    end = { ms: cstMs(year + 1, 1, 1), status: "SOURCED" };
  } else {
    const g = new Date(ms).getUTCFullYear();
    // the perihelion is early January, so the instant belongs to year g unless it precedes g's perihelion
    year = ms < perihelionOf(g).ms ? g - 1 : g;
    start = perihelionOf(year); end = perihelionOf(year + 1);
  }
  const elapsed = ms - start.ms;
  const day = Math.floor(elapsed / MS_PER_DAY) + 1;
  const down = day > GRID_DAYS;
  const quarter = (down ? 0 : (Math.floor((day - 1) / QUARTER_DAYS) + 1)) as YearPosition["quarter"];
  const dayInQuarter = down ? day - GRID_DAYS : ((day - 1) % QUARTER_DAYS) + 1;
  return {
    year, anchor, startMs: start.ms, endMs: end.ms, status: start.status === "DECLARED" || end.status === "DECLARED" ? "DECLARED" : "SOURCED",
    day, quarter, dayInQuarter, down,
    abc: motABC(elapsed, FINANCIAL_YEAR_DAYS * MS_PER_DAY),
    pastFull: elapsed > FINANCIAL_YEAR_DAYS * MS_PER_DAY,
    lengthDays: (end.ms - start.ms) / MS_PER_DAY,
  };
}

/** The personal frames: 33 / 66 / 99 days, counted from day 1 ("Real-Time 33D, 66D, 99D"). */
export type FrameDays = 33 | 66 | 99;
export const FRAMES: FrameDays[] = [33, 66, 99];
export interface Frame { frameDays: FrameDays; index: number; startMs: number; endMs: number; dayInFrame: number; abc: ABC }
export function frameOf(ms: number, frameDays: FrameDays, anchor: YearAnchor = DEFAULT_ANCHOR): Frame {
  const y = positionInYear(ms, anchor);
  const index = Math.floor((y.day - 1) / frameDays);
  const startMs = y.startMs + index * frameDays * MS_PER_DAY, endMs = startMs + frameDays * MS_PER_DAY;
  return { frameDays, index, startMs, endMs, dayInFrame: ((y.day - 1) % frameDays) + 1, abc: motABC(ms - startMs, endMs - startMs) };
}
/** Days of an LTU analysis unit on the SHEET's frame (D 1 · W 7 · M 33 · Q 99 · Y 365); the Admin table's ladder is ltuDays(row). */
export const unitDays = (u: LtuUnit): number => LTU_DAYS[u];

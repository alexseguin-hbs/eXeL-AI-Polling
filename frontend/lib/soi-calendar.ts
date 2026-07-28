/**
 * SoI Calendar Engine — pluggable calendar systems for the "$/min System of Innovation" framework.
 * ================================================================================================
 * The clean internal basis is the SoI 13-week quarter (integer, drift-free); the engine DEFAULTS to the regular
 * Gregorian presentation and can convert to Gregorian and future AI-optimized calendars because the SoI basis is
 * cleaner. All period math is expressed in ELAPSED CALENDAR minutes (24h days) so the burn ($/min → $/period)
 * reads on real elapsed time, "Innovating at the Speed of Thought". Deterministic (no clock reads).
 *
 * SoI-year anchor: Day 1 = Earth's PERIHELION (see Celestial-2525). Perihelion drifts ~Jan 2–5 UTC year to year —
 * the table below is a seed; CONFIRM ANNUALLY against NASA/ESA ephemerides before locking a production SoI year.
 */
import type { Cadence } from "./innovation-data";

export type CalendarId = "gregorian" | "soi91";
export interface CalendarSystem {
  id: CalendarId;
  label: string;
  yearDays: number;     // mean solar days per year (astronomical reconciliation target)
  quarterDays: number;  // days per quarter
  monthDays: number;    // days per month
  weekDays: number;     // days per week (7)
  intercalary: number;  // "days out of time" that reconcile the integer grid to the solar year (0 = none)
  note?: string;
}

export const MINUTES_PER_DAY = 24 * 60; // elapsed calendar minutes (not an 8h workday)
const MEAN_YEAR = 365.2425;             // Gregorian mean year

export const CALENDARS: Record<CalendarId, CalendarSystem> = {
  // DEFAULT presentation — traditional Gregorian (mean-year proportions).
  gregorian: {
    id: "gregorian", label: "Gregorian (regular)",
    yearDays: MEAN_YEAR, quarterDays: MEAN_YEAR / 4, monthDays: MEAN_YEAR / 12, weekDays: 7, intercalary: 0,
  },
  // Clean SoI basis — 4 × 91-day quarters (each exactly 13 weeks) = 364-day grid + 1 intercalary "New Year's Eve"
  // day out of time (+1 in leap years); months run a 4-4-5-week pattern (28/28/35 = 91). Day 1 = Perihelion.
  soi91: {
    id: "soi91", label: "SoI · 13-week quarter",
    yearDays: MEAN_YEAR, quarterDays: 91, monthDays: 91 / 3, weekDays: 7, intercalary: 1,
    note: "364-day grid (4×91 = 52 weeks, drift-free) + 1 day out of time (+1 leap); Day 1 = Perihelion",
  },
};

// Engine default is the regular calendar; the SoI-91 basis is the cleaner substrate we convert from.
export const DEFAULT_CALENDAR: CalendarId = "gregorian";
export const activeCalendar = (): CalendarSystem => CALENDARS[DEFAULT_CALENDAR];

/** Elapsed calendar minutes in one cadence period, for the given (or active) calendar. */
export function calMinutes(cadence: Cadence, cal: CalendarSystem = activeCalendar()): number {
  const days = cadence === "Q" ? cal.quarterDays : cadence === "M" ? cal.monthDays : cadence === "W" ? cal.weekDays : 1;
  return days * MINUTES_PER_DAY;
}

// Perihelion anchors (UTC) — seed table; CONFIRM ANNUALLY with NASA/ESA. Source: Celestial-2525 ephemeris.
export const PERIHELION_UTC: Record<number, string> = {
  2024: "2024-01-03T00:39Z",
  2025: "2025-01-04T13:28Z",
  2026: "2026-01-03T17:16Z",
  2027: "2027-01-03T02:33Z",
  2028: "2028-01-05T12:11Z",
};
/** First instant of the SoI year (Perihelion). Returns null when the year isn't in the confirmed table. */
export const soiYearStartUTC = (year: number): string | null => PERIHELION_UTC[year] ?? null;

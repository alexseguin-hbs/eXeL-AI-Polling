/**
 * PLANET LTU — the per-planet Local Time Unit table, MASTER DATA IN THE ADMIN PANEL (operator 2026-09-30, addenda 12–13,
 * Financial-2525 r.005).
 * ====================================================================================================
 * "Standard units for all planets are A.B..C · then we convert to hours for earth and LTU for Mars (for now it is hours
 * minutes and seconds). Therefore in the future if we should change mars LTU, everything should modularly adjust (LTU
 * tables for each planet are in admin panel)" · "LTU Table should show Month 91 for now (with 1 day system off line
 * Dec 31). Day in A.B..C as well as Hours, Minutes, and Seconds with ability to edit".
 *
 * ONE ROW PER PLANET, seeded here, merged into every saved copy under THE SEED LAW (lib/seed-law.ts: fingerprints, a
 * person's edit wins, tombstones), edited in the Admin panel (SoI-2525 › Business Setup › Planet LTU), read by
 * Financial-2525 (lib/financial-2525/planets.ts). Every conversion on the glass derives from the row — the derived
 * columns (Day in A.B..C, A-seconds …) are COMPUTED by derive(), never stored; editing Day-in-A.B..C back-solves the
 * year (yearDays = 3600 ÷ dayA). The whole is the planet's own revolution = 3600 A (mot.ts); `yearDays` is that whole
 * counted in the planet's CURRENT LTU days (Earth 365 exactly; Mars 686.98 Earth days while its LTU is Earth hours),
 * `revLocalDays` the future form (Mars 668.5991 sols). Pure; no I/O.
 */
import { mergeMissingBy } from "@/lib/seed-law";
import {
  SUB, FINANCIAL_YEAR_DAYS, MARS_REVOLUTION_EARTH_DAYS, MARS_REVOLUTION_SOLS, SOL_SEC, HOUR_PER_DAY, MIN_PER_HOUR, SEC_PER_MIN,
  spanABC, fmtMot, orbitUnits,
} from "@/lib/financial-2525/mot";
import type { YearAnchor } from "@/lib/financial-2525/calendar";

export type PlanetStatus = "SOURCED" | "DECLARED" | "OPERATOR";
export interface PlanetLtuRow {
  code: string;              // the UCRS-2525 PLANETS id (earth · mars) — the row key
  name: string;
  revLocalDays: number;      // the revolution in the planet's OWN days (Earth 365 financial; Mars 668.5991 sols) — the future form for Mars
  revEarthDays: number;      // the same revolution in Earth days (Earth 365; Mars 686.98 = PLANETS mars.tDays)
  yearDays: number;          // THE WHOLE = 3600 A, counted in the CURRENT LTU's days (Earth 365; Mars 686.98 while its LTU is Earth hours)
  monthDays: number;         // "Month 91 for now" — the analysis month
  offlineDay: string;        // "12-31" — the one system-offline day (day 365) on the calendar anchor; "—" when the anchor is the perihelion
  yearAnchor: YearAnchor;    // which instant opens the year: "calendar" (Jan 1, offline Dec 31 — for now) or "perihelion"
  hoursPerDay: number;       // the LTU ladder — Earth hours for every planet for now (FD-16)
  minPerHour: number;
  secPerMin: number;
  localDaySec?: number;      // the planet's own solar day in SI seconds (the sol: 88,775.244) — the future LTU, recorded
  status: PlanetStatus;
  note: string;
  _seed?: Record<string, string>;
}
export const PLANET_LTU_KEY = "innovation-planet-ltu";
export const PLANET_LTU_REMOVED_KEY = "innovation-planet-ltu-removed";

/** The seed — every number is the one mot.ts / UCRS-2525 already carries (no redeclared primitive, FD-14 (5)). */
export const PLANET_LTU_SEED: readonly PlanetLtuRow[] = [
  {
    code: "earth", name: "Earth", revLocalDays: FINANCIAL_YEAR_DAYS, revEarthDays: FINANCIAL_YEAR_DAYS, yearDays: FINANCIAL_YEAR_DAYS,
    monthDays: 91, offlineDay: "12-31", yearAnchor: "perihelion", hoursPerDay: HOUR_PER_DAY, minPerHour: MIN_PER_HOUR, secPerMin: SEC_PER_MIN,
    status: "OPERATOR", note: "the EXACT revolution 365.259636 days = 3600 A (addendum 18, '365.25 etc.'); the year opens at the perihelion instant, Austin CST standard; Month 91 for now, one offline day Dec 31 (addendum 13); hours · minutes · seconds",
  },
  {
    code: "mars", name: "Mars", revLocalDays: MARS_REVOLUTION_SOLS, revEarthDays: MARS_REVOLUTION_EARTH_DAYS, yearDays: MARS_REVOLUTION_EARTH_DAYS,
    monthDays: 91, offlineDay: "—", yearAnchor: "perihelion", hoursPerDay: HOUR_PER_DAY, minPerHour: MIN_PER_HOUR, secPerMin: SEC_PER_MIN, localDaySec: SOL_SEC,
    status: "DECLARED", note: "3600 A perihelion to perihelion (addendum 12); LTU = Earth hours · minutes · seconds for now (FD-16); 668.5991 sols is the future form; Month 91 mirrors Earth for now",
  },
];

const listOf = (raw: string | null | undefined): string[] => { try { const v = JSON.parse(raw || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; } };
const rowsOf = (raw: string | null | undefined): PlanetLtuRow[] => {
  try { const v = JSON.parse(raw || "[]"); return Array.isArray(v) ? v.filter((r) => r && typeof r === "object" && typeof (r as PlanetLtuRow).code === "string") : []; } catch { return []; }
};
/** The table as the glass must read it: the saved copy (a raw localStorage / cloud-bundle string) reconciled with the
 *  seed under the seed law — a seed change reaches an untouched row, an edited field stays, a tombstoned planet never
 *  returns, a new seeded planet joins. Same array back when nothing changed. */
export function planetLtuTable(savedRaw?: string | null, removedRaw?: string | null): PlanetLtuRow[] {
  return mergeMissingBy(rowsOf(savedRaw), PLANET_LTU_SEED, (r) => r.code, listOf(removedRaw), []);
}
/** Seconds of one LTU day on the row (Earth hours · minutes · seconds for every planet for now). */
export const daySecOf = (r: PlanetLtuRow): number => r.hoursPerDay * r.minPerHour * r.secPerMin;
/** The whole in SI seconds — yearDays × the LTU day. Earth: 31,536,000 s. */
export const revolutionSec = (r: PlanetLtuRow): number => r.yearDays * daySecOf(r);
/** The analysis ladder from the row: D 1 · W 7 · M (Month 91 for now) · Q 91 · Y (the year). The sheet's 33/66/99 stay frames. */
export const ltuDays = (r: PlanetLtuRow) => ({ D: 1, W: 7, M: r.monthDays, Q: 91, Y: r.yearDays } as const);
/** The DERIVED columns — computed from the row, never stored (Day in A.B..C beside hours · minutes · seconds). */
export function derive(r: PlanetLtuRow) {
  const dayInA = SUB / r.yearDays;
  const u = orbitUnits(revolutionSec(r));
  return {
    dayInA,                                                   // Earth 9.8630
    dayABC: fmtMot(spanABC(1, r.yearDays)),                   // Earth 9.3106..3058
    hourABC: fmtMot(spanABC(1 / r.hoursPerDay, r.yearDays)),  // Earth 0.1479..1627
    minABC: fmtMot(spanABC(1 / r.hoursPerDay / r.minPerHour, r.yearDays)),
    secABC: fmtMot(spanABC(1 / r.hoursPerDay / r.minPerHour / r.secPerMin, r.yearDays)),
    monthABC: fmtMot(spanABC(r.monthDays, r.yearDays)),       // Earth 91 d = 897.1923..1035
    aSeconds: u.aSec, bSeconds: u.bSec, cSeconds: u.cSec, dSeconds: u.dSec,   // Earth 8,760 · 2.4333 · 0.000676 · 1.88e-7
  };
}
/** Editing Day-in-A.B..C back-solves the year: 3600 ÷ dayA days. A number a person typed makes the row DECLARED. */
export const withDayInA = (r: PlanetLtuRow, dayInA: number): PlanetLtuRow => (dayInA > 0 && isFinite(dayInA) ? { ...r, yearDays: SUB / dayInA, status: "DECLARED" } : r);
/** The row for a planet code, the seed's Earth when unknown. */
export const planetRow = (rows: readonly PlanetLtuRow[], code: string): PlanetLtuRow => rows.find((r) => r.code === code) ?? rows.find((r) => r.code === "earth") ?? PLANET_LTU_SEED[0];

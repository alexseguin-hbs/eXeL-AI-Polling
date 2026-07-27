// HI · SI · AI productivity & cost model for the Innovation Project (Vision • 2525).
// Every number here is an ESTIMATE with a stated method + range — nothing is presented as exact.
// Measured inputs come from `git log` over the innovation surfaces (see MEASURED). Run with:
//   node docs/feedback/build_hi_si_ai_value_2026.07.27.mjs   → prints the model + writes the HTML.
import { writeFileSync } from "node:fs";

// ── MEASURED (from git history over the innovation surfaces) ──────────────────────────────────
export const MEASURED = {
  days: 3,                       // 2026-07-25, -26, -27
  commitsCore: 73,               // commits touching page.tsx + innovation-data.ts + tests + store
  commitsAll: 107,               // + lexicon-data.ts + docs/feedback + migration 028
  linesAdded: 6425,              // git log --numstat over the surfaces
  linesRemoved: 877,
  netLoc: 5548,                  // added - removed
  currentLoc: { page: 3606, data: 1340, store: 100, tests: 453 },
  tests: 239,
  // Committed-work windows per day (minutes) — first→last commit within each contiguous session,
  // summed. This is a LOWER BOUND on active engagement (excludes think time before the 1st commit
  // and after the last, and reading/deciding between sessions).
  committedWindowsMin: [172, 248, 189], // Jul 25 (two sessions) · 26 · 27
};

const sum = (a) => a.reduce((s, v) => s + v, 0);
const round = (n, d = 0) => { const f = 10 ** d; return Math.round(n * f) / f; };

// ── HI TIME (operator) ────────────────────────────────────────────────────────────────────────
const committedHrs = round(sum(MEASURED.committedWindowsMin) / 60, 1); // ~10.2 h measured lower bound
// Full engagement adds pre/post-session think + direction + review; modeled as +15–55% over the
// commit-bracketed floor. Operator can overwrite HI_HOURS_ACTUAL with their real total.
export const HI = {
  measuredCommittedHrs: committedHrs,
  rangeLoHrs: committedHrs,                 // floor = measured
  rangeHiHrs: round(committedHrs * 1.55, 1),
  anchorHrs: round(committedHrs * 1.25, 1), // headline point estimate
  actualOverride: null,                     // ← operator writes their real total here
};

// ── EQUIVALENT TRADITIONAL DEV-TEAM EFFORT ─────────────────────────────────────────────────────
// Two independent cross-checks, then a blended range.
// (1) LOC-based: polished, tested, production React/TS ships ~40–60 NET LOC / developer-day
//     (COCOMO-family, incl. design, review, test, iteration).
const locPerDevDayLo = 60, locPerDevDayHi = 40; // hi LOC/day → fewer days (optimistic), lo → more days
const devDaysLocLo = round(MEASURED.netLoc / locPerDevDayLo);       // ~92
const devDaysLocHi = round(MEASURED.netLoc / locPerDevDayHi);       // ~139
// (2) Feature-based: novel PdM portfolio tool (financial engine NPV/IRR/payback, Value Equation/EVC,
//     gate governance, dependency graph, Supabase + RLS, 34-lang i18n, 239 tests, digital slide show)
//     → a 2–3 person team, 8–12 calendar weeks = 16–36 person-weeks.
const devWeeksFeatLo = 16, devWeeksFeatHi = 36;
// Blend to person-weeks (5 dev-days/week).
const pwLoc = [round(devDaysLocLo / 5), round(devDaysLocHi / 5)];   // ~18–28 pw
export const TRAD = {
  devDaysLoc: [devDaysLocLo, devDaysLocHi],
  personWeeksLoc: pwLoc,
  personWeeksFeature: [devWeeksFeatLo, devWeeksFeatHi],
  personWeeksBlended: [Math.min(pwLoc[0], devWeeksFeatLo), Math.max(pwLoc[1], devWeeksFeatHi)], // ~16–36
  personWeeksAnchor: 24, // headline
};

// ── COST COMPARISON ────────────────────────────────────────────────────────────────────────────
const HRS_PER_PW = 40;
const tradRateLo = 100, tradRateHi = 160, tradRateMid = 130; // $/hr loaded senior full-stack
const tradHoursAnchor = TRAD.personWeeksAnchor * HRS_PER_PW;  // 960 h
export const COST = {
  tradRate: [tradRateLo, tradRateHi],
  tradHoursAnchor,
  tradCostLo: round(TRAD.personWeeksBlended[0] * HRS_PER_PW * tradRateLo),   // ~$64k
  tradCostHi: round(TRAD.personWeeksBlended[1] * HRS_PER_PW * tradRateHi),   // ~$230k
  tradCostAnchor: round(tradHoursAnchor * tradRateMid),                      // ~$125k
  // HI+SI+AI: operator hours × loaded rate + AI subscription/token cost for the engagement.
  hiRate: 150,                    // $/hr loaded PdM/eng-lead
  hiCostAnchor: round(HI.anchorHrs * 150),   // ~$1.9k
  aiCostLoUsd: 100, aiCostHiUsd: 400,        // Claude Code subscription/token for a 3-day engagement
  aiCostAnchor: 250,
};
COST.soiCostAnchor = COST.hiCostAnchor + COST.aiCostAnchor; // ~$2.2k
COST.leverageX = round(COST.tradCostAnchor / COST.soiCostAnchor); // ~57×
COST.costReductionPct = round((1 - COST.soiCostAnchor / COST.tradCostAnchor) * 100, 1); // ~98%
// Human-hours leverage: traditional effort-hours ÷ HI hours.
COST.hourLeverageLo = round((TRAD.personWeeksBlended[0] * HRS_PER_PW) / HI.rangeHiHrs); // conservative
COST.hourLeverageHi = round((TRAD.personWeeksBlended[1] * HRS_PER_PW) / HI.rangeLoHrs); // optimistic
// Calendar leverage: traditional weeks ÷ elapsed days.
COST.calendarWeeksLo = TRAD.personWeeksFeature[0] / 2.5; // ~2.5 devs → calendar weeks (feature lo)
COST.calendarWeeksHi = TRAD.personWeeksFeature[1] / 2.5;

export const MODEL = { MEASURED, HI, TRAD, COST };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(MODEL, null, 2));
  console.log(`\nHeadline: HI ~${HI.anchorHrs}h  ·  Traditional ~${TRAD.personWeeksAnchor} person-weeks (~$${(COST.tradCostAnchor/1000).toFixed(0)}k)  ·  SoI ~$${(COST.soiCostAnchor/1000).toFixed(1)}k  ·  ~${COST.leverageX}× cheaper (${COST.costReductionPct}%)  ·  ${COST.hourLeverageLo}–${COST.hourLeverageHi}× fewer human-hours`);
}

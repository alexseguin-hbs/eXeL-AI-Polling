# MoT (Measure of Time) × SoI Framework — Finance Notes

> Captured per operator direction. The **personal-finance instrument** below is **NOTE ONLY — do not build yet**.
> The **calendar alignment** and the **real-time cost/rev/margin spread** are active design inputs for the
> System of Innovation digital deck.

## 1. Calendar alignment (active — implemented in `frontend/lib/soi-calendar.ts`)
- MoT aligns to the **celestial calendar**: **364-day year = 4 × 91-day quarters** (13 weeks each) + 1 intercalary
  "New Year's Eve" day out of time (+1 in leap years). Day 1 = Perihelion (see Celestial-2525; confirm annually
  with NASA/ESA).
- Clean integer basis; the Full Engine still **defaults to the regular Gregorian** presentation and converts to
  the SoI-91 basis and future AI-optimized calendars.

## 2. Real-time cost / revenue / margin spread (active — to build)
- The live financial chart takes the **total cost** and spreads it over a selectable window, then accrues down to
  **$/min**:
  - **91-day** spread (SoI quarter) — default,
  - **365-day** spread (annual), or
  - **user-defined** window.
- The chosen spread **linearizes** the value so the curve is **less lumpy** (smooths lump events across the window).
- Apply the **same spread treatment to revenues and margins** (not just cost) so all three read on a consistent
  $/min basis.
- Builds on the existing `CADENCE_UNIT` / `calMinutes()` (`soi-calendar.ts`) + `costPerMinuteOf` (`innovation-data.ts`).

## 3. Personal-finance instrument (NOTE ONLY — do not build)
A future personal-finance system tied to the SoI Framework:
- All cost is allocated into an **escrow / new financial instrument** so a major **donation can come in spread over
  time** rather than as a lump sum.
- All cost is **allocated to 91 days** so a team can **accrue by the minute** and **withdraw based on that day's
  payment** for Vision-2525.
- A **$1M payout to a founder** defaults to **≥ 1 year**, capping at **$1/min = $60/hr = $525,600/year max** — giving
  people and businesses **future security without lump-sum blows** ("personal runways").
- Recipients may then choose to **invest at a consistent $/min level for a set timeframe** to **unlock new
  innovation models** for Vision-2525.

_Rationale: steady $/min flow > lumpy lump sums — for donors, founders, teams, and the innovation portfolio alike._

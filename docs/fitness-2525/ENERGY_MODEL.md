# Fitness-2525 · Energy budget model

Calories only (no `$` / `$/kcal`). Athlete weight, height, age, steps, and logged intake stay **blank until entered** — the UI shows dashes. Demo screenshots may enable a clearly labeled **EXAMPLE DATA** overlay; that overlay is never written as a default seed.

## Burn (expenditure)

| Component | Formula / rule | Needs athlete input | Source |
| --- | --- | --- | --- |
| **BMR / resting** | Mifflin–St Jeor: ♂ `10·kg + 6.25·cm − 5·age + 5`; ♀ `… − 161` | weight, height, age (sex refines offset) | Mifflin MD, St Jeor ST et al., *Am J Clin Nutr* 1990; Medscape Mifflin–St Jeor calculator |
| **NEAT (steps)** | Walking MET **3.5** × `3.5·kg/200` × minutes; minutes ≈ `steps / 100` | weight **and** steps | Adult Compendium of Physical Activities (walking ~3.5 MET); standard MET→kcal form `MET × 3.5 × kg / 200 × min` |
| **Workout** | Prefer Garmin/device `workout.calories` when present; else `MET(sport) × IF × 3.5 × kg / 200 × min` | weight (unless device kcal logged); duration or swim distance | Compendium METs (swim laps ~7–10, indoor cycling/spin ~8–8.5, mobility ~2.5). Optional **IF** scale inspired by TrainingPeaks TSS/IF (tempo≈1.0, easy≈0.75, race≈1.05) |

Default sport METs (approximations, adjustable later): swim 8.0, bike/spin 8.5, run 9.0, mobility 2.5.

If duration is missing but swim distance is known, minutes ≈ `2 min / 100 m` (plan scaffolding only).

## Intake (fueling budget)

### Per workout window — carbohydrate

ACSM / ISSN-style **during-exercise CHO** by duration (midpoint of published ranges used for the numeric budget):

| Duration | Guidance | Model midpoint |
| --- | --- | --- |
| **&lt; 60 min** | ~0–30 g/h (often optional) | **15 g/h** |
| **1–2.5 h** | **30–60 g/h** | **45 g/h** |
| **&gt; 2.5 h** | up to **60–90 g/h** (multiple transportable CHO) | **75 g/h** |

Window kcal budget ≈ `g CHO × 4 kcal/g`.

**Sources:** ACSM joint position *Nutrition and Athletic Performance* (2016); ACSM fluid/CHO position (30–60 g·h⁻¹ for intense exercise &gt;1 h); ISSN nutrient-timing position stand (~30–60 g/h for extended high-intensity work); GSSI / contemporary endurance reviews (30–90 g/h by duration; &gt;2.5 h up to ~90 g/h with glucose+fructose).

### Daily added sugar (outside workout windows)

- **WHO:** free sugars **&lt; 10%** of energy (stronger aspirational **&lt; 5%** ≈ 25 g/day).
- **AHA:** added sugars ≈ **≤ 25 g/day (women)** / **≤ 36 g/day (men)** (~6% energy).

Model uses the AHA sex-specific cap when sex is set, else **30 g** midpoint, and never exceeds WHO 10%-of-energy when an intake/burn target is known.

**Sources:** WHO guideline *Sugars intake for adults and children* (2015); AHA “Added Sugars” / “How Much Sugar Is Too Much?”.

### Daily deficit (~10 lb in one month)

- Theoretical: `10 lb × 3500 kcal/lb ÷ 30 d ≈ **1167 kcal/day**`.
- **Safety cap:** `min(1167, 1000, 25% of estimated daily burn)` and intake floor **≥ BMR** (deficit cannot pull planned intake below resting).
- **No deficit** on **key** or **long** days (day_type or any session ≥ 150 min) — fuel the work.

## UI pattern (Financial-2525 accrual / budget)

Per window: **planned vs logged** bar (kcal or g sugar).

| State | Rule | Color |
| --- | --- | --- |
| OK | logged &lt; 85% of planned | cyan/green |
| Near | ≥ 85% and &lt; 100% | **amber** |
| Over | ≥ 100% | **red** |
| Unknown | missing planned or logged | dim / dashes |

MoT rates on workout burn: **cal/min**, **cal/sec**, **cal/hr** (calories only).

## Implementation map

- `frontend/lib/fitness-2525/budget.ts` — pure model
- `frontend/lib/fitness-2525/energy.ts` — rate formatting (cal/min·sec·hr)
- `frontend/components/fitness-2525/command-ux1.tsx` — ENERGY / PLANNING budget bars
- Example overlay: query `?example=1` or in-UI toggle — banner **EXAMPLE DATA**

## Non-goals

- Do not invent weight, calories, or sugar logs.
- Do not price energy in `$` / `$/kcal`.

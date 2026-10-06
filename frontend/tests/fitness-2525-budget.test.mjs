// Fitness-2525 · AsM item 1 (Thoth): burn = BMR + NEAT + COMPLETED workouts; device kcal is a workout subtotal;
// planned sessions are projected only; intake target never below BMR; sugar cap from the full-day target;
// race days: no deficit, per-leg MET burn. Run: node --experimental-strip-types --loader ./tests/ts-ext-loader.mjs tests/fitness-2525-budget.test.mjs
import { buildDayBudget, legBudgets } from "../lib/fitness-2525/budget.ts";
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log("FAIL:", msg); } };
const seed = (steps) => ({ v: 1, date: "2026-10-05", steps, calories_in: null, calories_out: 672, day_type: "work", checkins: [], at: 0,
  workouts: [
    { id: "swim", type: "swim", status: "completed", minutes: 83, distance: { value: 4050, unit: "yd" }, calories: 672, garmin: { kcal: 672 } },
    { id: "bike", type: "bike", status: "planned", minutes: 90, notes: "3 × 12 min steady tempo" },
    { id: "mob", type: "mobility", status: "planned", minutes: 15 },
  ] });
const tester = { weightKg: 190 * 0.45359237, heightCm: 70 * 2.54, ageYr: 40, sex: "male" };
const none = { weightKg: null, heightCm: null, ageYr: null, sex: "unspecified" };

const b = buildDayBudget({ day: seed(10000), anthropometrics: tester, dayType: "work" });
ok(b.bmrKcal === 1778, `BMR 1778 (got ${b.bmrKcal})`);
ok(b.neatKcal === 528, `NEAT 528 (got ${b.neatKcal})`);
ok(b.workoutBurnKcal === 672, `completed workouts = swim 672 only (got ${b.workoutBurnKcal})`);
ok(b.totalBurnKcal === 1778 + 528 + 672, `burned = BMR+NEAT+completed = 2978 (got ${b.totalBurnKcal})`);
ok(b.projectedWorkoutKcal > 0 && b.projectedBurnKcal === b.totalBurnKcal + b.projectedWorkoutKcal, "planned sessions are projected, not burned");
ok(b.deviceDayKcal === 672 && b.totalBurnKcal !== 672, "device calories_out never becomes the day burn");
ok(b.intakeTargetKcal >= b.bmrKcal, `intake target ${b.intakeTargetKcal} >= BMR ${b.bmrKcal}`);
ok(b.projectedIntakeTargetKcal >= b.intakeTargetKcal, "full-day target >= so-far target");
ok(b.sugarCapG === 36, `sugar cap from full-day target → AHA male 36 g (got ${b.sugarCapG})`);
ok(b.windows.find((w) => w.id === "bike").projected === true && !b.windows.find((w) => w.id === "swim").projected, "bike window flagged projected");

const n = buildDayBudget({ day: seed(null), anthropometrics: none, dayType: "work" });
ok(n.totalBurnKcal === null && n.intakeTargetKcal === null, "no profile → no day burn / no intake target (no invented weight)");
ok(n.workoutBurnKcal === 672, "no profile → swim subtotal still 672 from the device");

// floor: sweep profiles/steps — intake never below BMR
for (const kg of [45, 60, 86, 120]) for (const steps of [0, 3000, 20000]) for (const done of [true, false]) {
  const d = seed(steps); d.workouts[0].status = done ? "completed" : "planned";
  const r = buildDayBudget({ day: d, anthropometrics: { weightKg: kg, heightCm: 165, ageYr: 30, sex: "female" }, dayType: "work" });
  ok(r.intakeTargetKcal >= r.bmrKcal && r.projectedIntakeTargetKcal >= r.bmrKcal, `floor kg=${kg} steps=${steps} done=${done}`);
}

// race model: Ironman legs, MET × profile weight × minutes; no deficit; intake = fueling plan (projected burn)
const race = { v: 1, date: "2026-11-22", steps: null, day_type: "race", checkins: [], at: 0, workouts: [{ id: "im", type: "race", title: "Ironman Cozumel", status: "planned",
  legs: [ { id: "s", sport: "swim", minutes: 80, distance: { value: 2.4, unit: "mi" } }, { id: "b", sport: "bike", minutes: 360, distance: { value: 112, unit: "mi" }, carb_g_per_hr: 75 }, { id: "r", sport: "run", minutes: 270, distance: { value: 26.2, unit: "mi" }, consumed_kcal: 600 } ] }] };
const rb = buildDayBudget({ day: race, anthropometrics: tester, dayType: "race" });
const legs = legBudgets(race.workouts[0], tester.weightKg);
ok(rb.dayClass === "race" && rb.noDeficitToday && rb.deficitTargetKcal === 0, "race day → no deficit");
ok(legs[0].burnKcal === Math.round(8 * 3.5 * tester.weightKg * 80 / 200), `swim leg MET burn (got ${legs[0].burnKcal})`);
ok(legs[1].plannedCarbG === 450 && legs[2].netKcal === legs[2].burnKcal - 600, "per-leg carb plan + burned-vs-consumed accrual");
ok(rb.intakeTargetKcal === rb.projectedBurnKcal, "race intake target = fueling plan (full projected burn)");
ok(legBudgets(race.workouts[0], null).every((l) => l.burnKcal === null), "race legs: no weight → no invented burn");

console.log(`fitness-2525-budget: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

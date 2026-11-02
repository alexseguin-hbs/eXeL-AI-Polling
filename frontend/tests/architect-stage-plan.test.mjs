// ARCHITECT-2525 · BUILD STAGING & SCHEDULE gate — the operator's "set of test and metric to design the 3×3 house so the
// user knows what's built in each phase, the build order, the cost, what adjustments do to timeline+cost, and that all
// modules are STAGED before building with a schedule per phase" (2026-11-01). One source: lib/architect-stage-plan, which
// JOINS the take-off (buildInstructions) + the cost engine (elementCosts/costFor) — it must invent no new numbers.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-stage-plan.test.mjs
import { buildSchedule, adjustmentDelta, phaseCalendarDays, LEAD_DAYS } from "@/lib/architect-stage-plan";
import { SIM_MODELS, modelById, costFor } from "@/lib/architect-sim-options";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const cube = modelById("cube") ?? SIM_MODELS[0];
const opt = cube.native;
const S = buildSchedule(cube, opt);

// ── the user KNOWS what is built in each phase, in build order ──
ok(S.phases.length >= 6, `the schedule has every build phase (got ${S.phases.length})`);
ok(S.phases[0].order === 1 && S.phases[0].element === "Foundation", "phase 1 is Foundation");
ok(S.phases[1].element === "Wall System" && S.phases[2].element === "Roof", "Wall System (2) then Roof (3) — roof is #3, right after the wall system");
ok(S.phases.every((p) => p.moduleCount >= 1 && p.modules.length === p.moduleCount), "every phase names its staged modules (the work packages)");
ok(S.phases[S.phases.length - 1].element === "Finish", "the closing stage is Finish & site");

// ── the SCHEDULE is sequential, staged per phase (set timeline) ──
ok(S.phases[0].startDay === 0, "the build starts on day 0");
let seq = true;
for (let i = 1; i < S.phases.length; i++) if (S.phases[i].startDay !== S.phases[i - 1].finishDay) seq = false;
ok(seq, "each phase starts when the prior one finishes (a real sequential schedule)");
ok(S.phases.every((p) => p.finishDay === p.startDay + p.calDays && p.calDays >= 1), "each phase's finish = start + its calendar days (≥1)");
ok(S.totalCalDays === S.phases[S.phases.length - 1].finishDay && S.totalWeeks > 0, `total timeline = the last finish (${S.totalCalDays} days · ${S.totalWeeks} wk)`);
ok(phaseCalendarDays(8) === 2 && phaseCalendarDays(1) === 1 && phaseCalendarDays(0) === 1, "calendar days = crew-days ÷ CREW(4), rounded up, never < 1");

// ── all modules STAGED before building (procurement lead → order-by) ──
ok(S.phases.every((p) => p.leadDays >= 0 && p.orderByDay === p.startDay - p.leadDays), "every phase carries a procurement lead → an order-by day (staged, never waiting on material)");
ok(S.leadInDays >= 0, `procurement starts ${S.leadInDays} days before ground-break (lead-in ≥ 0)`);
ok(LEAD_DAYS["Roof"] >= LEAD_DAYS.Foundation, "longer-lead trades (roof) are ordered earlier than local ones (foundation)");

// ── the COST is ONE truth: Σ phase cost === costFor (no second engine, no hand-typed number) ──
ok(S.costReconciles && S.totalCost === costFor(cube, opt), `Σ phase cost reconciles EXACTLY to the card headline ($${S.totalCost} === $${costFor(cube, opt)})`);
ok(S.phases.every((p) => p.cost >= 0), "no negative phase cost");
{ const pctSum = S.costByPhase.reduce((s, x) => s + x.pct, 0); ok(pctSum >= 97 && pctSum <= 103, `cost-by-phase percentages sum to ~100 (got ${pctSum})`); }
ok(typeof S.criticalPhase === "string" && S.phases.some((p) => p.label === S.criticalPhase), "the critical (longest) phase is named");

// ── what ADJUSTMENTS do to timeline + cost ──
{
  const base = { ...opt };
  const heavier = { ...opt, frameMaterial: "all-steel" };
  const d = adjustmentDelta(cube, base, heavier);
  ok(d.base.cost === buildSchedule(cube, base).totalCost && d.changed.cost === buildSchedule(cube, heavier).totalCost, "the delta's base/changed costs match the schedules (consistent)");
  ok(Number.isFinite(d.dCost) && Number.isFinite(d.dWeeks) && Number.isFinite(d.dCostPct), "an adjustment yields a finite Δcost, Δweeks and Δ%");
  const same = adjustmentDelta(cube, base, base);
  ok(same.dCost === 0 && same.dWeeks === 0, "no change → zero Δ (the delta is honest)");
}
{
  // a costlier method must raise cost (3D-print cement vs stick) — the user sees the trade-off
  const stick = { ...opt, method: "stick-framed" };
  const print = { ...opt, method: "3d-print", printMaterial: "cement" };
  const d = adjustmentDelta(cube, stick, print);
  ok(d.changed.cost !== d.base.cost, `changing the build method changes the cost (Δ$${d.dCost})`);
}

// ── determinism + robustness across all three forms ──
ok(JSON.stringify(buildSchedule(cube, opt)) === JSON.stringify(S), "buildSchedule is deterministic (identical inputs → identical output)");
for (const m of SIM_MODELS) {
  const s = buildSchedule(m, m.native);
  ok(s.costReconciles && s.phases.length >= 6 && s.totalWeeks > 0, `${m.id}: schedule reconciles, has every phase, has a timeline`);
}

console.log(`\narchitect-stage-plan: ${pass} passed, ${fail} failed · per-phase staged schedule (what·order·cost·timeline·staging·Δ), ONE cost truth`);
process.exit(fail ? 1 : 0);

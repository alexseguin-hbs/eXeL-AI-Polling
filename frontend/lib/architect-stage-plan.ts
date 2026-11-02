/**
 * ARCHITECT-2525 · BUILD STAGING & SCHEDULE (operator 2026-11-01: "create set of test and metric to design 3x3 house so
 * you can gain comfort that user knows what's being built in each phase; and understands build order, cost, and what
 * adjustments will do to timelines and cost … so all work and modules are STAGED before building with set timeline and
 * schedule per phase").
 * ============================================================================================================
 * This is the ONE place that joins the two existing truths into a per-phase STAGED SCHEDULE — it invents NO new numbers:
 *   • WHAT is built + the crew-days   → buildInstructions (the take-off, R-TO1): phases in BUILD_ORDER, each with its
 *                                       modules (steps) and crew-days (person-days for a CREW-person crew).
 *   • The COST per phase              → elementCosts / costFor (the ONE cost engine): six elements + the finish/site
 *                                       remainder reconcile EXACTLY to the card headline.
 * It adds only the SCHEDULE (sequential start/finish in calendar working days = crew-days ÷ CREW) and the STAGING
 * (a procurement lead per phase → the day its modules must be ordered, so everything is staged before building).
 *
 * Pure + deterministic (no Date/random) → replayable and gate-checked (tests/architect-stage-plan.test.mjs).
 */
import {
  type SimModel, type BuildOption, type CostParams, DEFAULT_COST, type ElementName,
  elementCosts, elementSubtotal, costFor, costBreakdown,
} from "./architect-sim-options";
import { buildInstructions, BUILD_ORDER, CREW, DAYS_PER_WEEK } from "./architect-build-instructions";

/** Procurement lead time per element — how many calendar days BEFORE a phase starts its modules must be ordered so the
 *  work is staged, never waiting on material. Conservative small-build leads (concrete is local; steel/HVAC are long). */
export const LEAD_DAYS: Record<ElementName, number> = {
  Foundation: 3, "Wall System": 7, Roof: 10, Plumbing: 5, Electrical: 5, HVAC: 14,
};
export const FINISH_LEAD_DAYS = 10; // finish / site / fixtures procurement lead
export const FINISH_LABEL = "Finish & site"; // the closing stage (drywall · finish · landscaping · fixtures)

/** calendar WORKING days a phase takes = its crew-days (person-days) ÷ the crew size, rounded up (never < 1). */
export function phaseCalendarDays(crewDays: number): number {
  return Math.max(1, Math.ceil(crewDays / CREW));
}

export interface StagePhase {
  order: number;               // 1..N in build order (Foundation 1 · Framing 2 · Roofing 3 · …)
  element: ElementName | "Finish";
  label: string;
  modules: string[];           // the work packages staged for this phase (take-off step titles)
  moduleCount: number;
  crewDays: number;            // person-days of hands-on work (from the take-off)
  calDays: number;             // calendar working days (crew-days ÷ CREW)
  cost: number;                // ONE-truth cost for this phase ($; six elements + finish reconcile to the headline)
  startDay: number;            // 0-based calendar working day the phase starts (sequential)
  finishDay: number;           // startDay + calDays
  leadDays: number;            // procurement lead
  orderByDay: number;          // startDay − leadDays (negative = order before the build starts)
}

export interface BuildSchedule {
  phases: StagePhase[];
  totalCrewDays: number;
  totalCalDays: number;        // sequential calendar working days end-to-end
  totalWeeks: number;          // totalCalDays ÷ DAYS_PER_WEEK
  totalCost: number;           // = costFor (reconciles — ONE truth)
  costReconciles: boolean;     // Σ phase cost === costFor
  leadInDays: number;          // how many days before ground-break procurement must start (−min orderByDay, ≥0)
  costByPhase: { phase: string; cost: number; pct: number }[];
  criticalPhase: string;       // the longest phase by calendar days
}

/** The staged build schedule for a design at an option — modules, cost, and timeline per phase, in build order. */
export function buildSchedule(m: SimModel, opt: BuildOption, cost: CostParams = DEFAULT_COST): BuildSchedule {
  const instr = buildInstructions(m.id, opt);           // phases in BUILD_ORDER, with modules + crew-days
  const ecosts = elementCosts(m, opt, cost);
  const costOf = (el: ElementName) => ecosts.find((e) => e.element === el)?.usd ?? 0;

  let day = 0;
  const phases: StagePhase[] = [];
  for (let i = 0; i < instr.phases.length; i++) {
    const pi = instr.phases[i];
    const calDays = phaseCalendarDays(pi.crewDays);
    const lead = LEAD_DAYS[pi.element] ?? 5;
    const start = day;
    phases.push({
      order: i + 1, element: pi.element, label: pi.label,
      modules: pi.steps.map((s) => s.title), moduleCount: pi.steps.length,
      crewDays: pi.crewDays, calDays, cost: costOf(pi.element),
      startDay: start, finishDay: start + calDays, leadDays: lead, orderByDay: start - lead,
    });
    day = start + calDays;
  }

  // the closing FINISH & SITE stage — its cost is the headline minus the six construction elements (so Σ reconciles to
  // costFor EXACTLY), and its calendar days scale with its finish LABOUR at the same crew productivity (fixed equipment
  // like a trailer adds cost + lead time, not crew-days).
  const headline = costFor(m, opt, cost);
  const sixSum = elementSubtotal(m, opt, cost);
  const bd = costBreakdown(m, opt, cost);
  const sixLabor = ecosts.reduce((s, e) => s + e.labor, 0);
  const finishCost = headline - sixSum;                 // remainder + fixed
  const sixCalDays = phases.reduce((s, p) => s + p.calDays, 0);
  const finishCalDays = sixLabor > 0 ? Math.max(1, Math.round((sixCalDays * bd.remainder.labor) / sixLabor)) : 1;
  if (finishCost > 0) {
    const start = day;
    phases.push({
      order: phases.length + 1, element: "Finish", label: FINISH_LABEL,
      modules: [bd.remainder.label, ...(bd.fixed ? [bd.fixed.label] : [])],
      moduleCount: bd.fixed ? 2 : 1, crewDays: finishCalDays * CREW, calDays: finishCalDays, cost: finishCost,
      startDay: start, finishDay: start + finishCalDays, leadDays: FINISH_LEAD_DAYS, orderByDay: start - FINISH_LEAD_DAYS,
    });
    day = start + finishCalDays;
  }

  const totalCrewDays = phases.reduce((s, p) => s + p.crewDays, 0);
  const totalCalDays = day;
  const totalCost = phases.reduce((s, p) => s + p.cost, 0);
  const leadInDays = Math.max(0, -Math.min(0, ...phases.map((p) => p.orderByDay)));
  const costByPhase = phases.map((p) => ({ phase: p.label, cost: p.cost, pct: headline > 0 ? Math.round((p.cost / headline) * 100) : 0 }));
  const criticalPhase = phases.reduce((a, b) => (b.calDays > a.calDays ? b : a), phases[0]).label;

  return {
    phases, totalCrewDays, totalCalDays,
    totalWeeks: Math.round((totalCalDays / DAYS_PER_WEEK) * 10) / 10,
    totalCost, costReconciles: totalCost === headline,
    leadInDays, costByPhase, criticalPhase,
  };
}

export interface ScheduleDelta {
  dCost: number;               // Δ total cost ($) changed − base
  dCostPct: number;            // Δ as % of base
  dCalDays: number;            // Δ calendar working days
  dWeeks: number;              // Δ weeks
  base: { cost: number; weeks: number };
  changed: { cost: number; weeks: number };
}

/** What an adjustment DOES to timeline + cost — the operator's "what adjustments will do to timelines and cost". Pure:
 *  schedule(base) vs schedule(changed), both from the same engines, so a heavier method/material shows its real Δ. */
export function adjustmentDelta(m: SimModel, base: BuildOption, changed: BuildOption, cost: CostParams = DEFAULT_COST): ScheduleDelta {
  const b = buildSchedule(m, base, cost);
  const c = buildSchedule(m, changed, cost);
  return {
    dCost: c.totalCost - b.totalCost,
    dCostPct: b.totalCost > 0 ? Math.round(((c.totalCost - b.totalCost) / b.totalCost) * 1000) / 10 : 0,
    dCalDays: c.totalCalDays - b.totalCalDays,
    dWeeks: Math.round((c.totalWeeks - b.totalWeeks) * 10) / 10,
    base: { cost: b.totalCost, weeks: b.totalWeeks },
    changed: { cost: c.totalCost, weeks: c.totalWeeks },
  };
}

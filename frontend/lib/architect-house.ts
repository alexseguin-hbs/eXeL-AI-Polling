/**
 * ARCHITECT-2525 · HOUSE BUILD SPEC — rough cost/time estimates + install phases for chosen components.
 * =================================================================================================
 * The user wireframes a house by SELECTING components from the Layer Tree (R4). Each chosen component
 * carries a rough cost + install-duration + an install PHASE. Phases enable PARALLEL installation so
 * timelines overlap (R5) — e.g. Electrical, Plumbing and Mechanical all run in the MEP phase together.
 * Estimates are deliberately rough (operator: "estimates are okay").
 */
import { findLayer, flattenLayers } from "./architect-layers";

export type Phase = "site" | "foundation" | "framing" | "envelope" | "mep" | "finish";

export const PHASES: { id: Phase; label: string; color: string }[] = [
  { id: "site", label: "Site Prep", color: "#22c55e" },
  { id: "foundation", label: "Foundation", color: "#f59e0b" },
  { id: "framing", label: "Framing", color: "#c084fc" },
  { id: "envelope", label: "Envelope", color: "#19c8cf" },
  { id: "mep", label: "MEP (parallel)", color: "#38bdf8" },
  { id: "finish", label: "Finish", color: "#d946ef" },
];
const PHASE_LABEL: Record<Phase, string> = Object.fromEntries(PHASES.map((p) => [p.id, p.label])) as Record<Phase, string>;
const PHASE_COLOR: Record<Phase, string> = Object.fromEntries(PHASES.map((p) => [p.id, p.color])) as Record<Phase, string>;

// Per physical system: which install phase + rough per-component cost (USD) and duration (days).
const SYSTEM_EST: Record<string, { phase: Phase; cost: number; days: number }> = {
  site: { phase: "site", cost: 2000, days: 2 },
  spaces: { phase: "site", cost: 500, days: 1 },
  foundation: { phase: "foundation", cost: 6000, days: 3 },
  structure: { phase: "framing", cost: 4000, days: 2 },
  "building-envelope": { phase: "envelope", cost: 3500, days: 2 },
  mechanical: { phase: "mep", cost: 2500, days: 2 },
  electrical: { phase: "mep", cost: 2000, days: 2 },
  plumbing: { phase: "mep", cost: 2200, days: 2 },
  "fire-protection": { phase: "mep", cost: 1500, days: 1 },
  "communications-low-voltage": { phase: "mep", cost: 1200, days: 1 },
  interior: { phase: "finish", cost: 2000, days: 2 },
  exterior: { phase: "finish", cost: 2500, days: 2 },
};

// A spec id can be a leaf OR a branch/system. Resolve to the buildable leaf components it represents.
export function specLeafIds(specIds: string[]): string[] {
  const out = new Set<string>();
  specIds.forEach((id) => {
    const f = findLayer(id);
    if (!f) return;
    flattenLayers([f.node]).forEach((n) => { if (!n.children?.length && !n.level3) out.add(n.id); });
  });
  return Array.from(out);
}

export function componentEstimate(id: string): { cost: number; days: number; phase: Phase } | null {
  const m = id.match(/^physical\/([^/]+)/);
  if (!m) return null;
  const e = SYSTEM_EST[m[1]];
  return e ? { cost: e.cost, days: e.days, phase: e.phase } : null;
}

export interface PhaseRollup { phase: Phase; label: string; color: string; count: number; cost: number; days: number; }
export interface HouseEstimate {
  count: number;
  cost: number;
  sequentialDays: number;   // if every phase ran back-to-back
  parallelDays: number;     // with phase overlap (the realistic critical path)
  byPhase: PhaseRollup[];
}

// Within a phase, components run with ~2 crews in parallel → phase duration = max(component, ceil(sum/2)).
function phaseDuration(days: number[]): number {
  if (!days.length) return 0;
  return Math.max(Math.max(...days), Math.ceil(days.reduce((a, b) => a + b, 0) / 2));
}

export function houseEstimate(specIds: string[]): HouseEstimate {
  const leaves = specLeafIds(specIds);
  const buckets = new Map<Phase, { cost: number; days: number[]; count: number }>();
  let cost = 0;
  leaves.forEach((id) => {
    const e = componentEstimate(id);
    if (!e) return;
    cost += e.cost;
    const b = buckets.get(e.phase) ?? { cost: 0, days: [], count: 0 };
    b.cost += e.cost; b.days.push(e.days); b.count += 1;
    buckets.set(e.phase, b);
  });
  const byPhase: PhaseRollup[] = PHASES
    .filter((p) => buckets.has(p.id))
    .map((p) => {
      const b = buckets.get(p.id)!;
      return { phase: p.id, label: PHASE_LABEL[p.id], color: PHASE_COLOR[p.id], count: b.count, cost: b.cost, days: phaseDuration(b.days) };
    });
  const sequentialDays = byPhase.reduce((a, p) => a + p.days, 0);
  // Parallel install: each phase starts when the previous is ~60% done (rough 40% overlap on the seam).
  const parallelDays = byPhase.reduce((acc, p, i) => acc + (i === 0 ? p.days : Math.ceil(p.days * 0.6)), 0);
  return { count: leaves.length, cost, sequentialDays, parallelDays, byPhase };
}

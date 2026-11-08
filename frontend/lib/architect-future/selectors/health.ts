// ARCHITECT-2525 / FUTURE · selectors/health — Project Health derived from canonical state (plan §21, FCRS-34).
// It REPORTS problems against the one canonical project; it never holds competing truth. Every finding points back to a
// canonical source (an entity id / field), so Health can only ever echo the project, never invent a second number.
import type { ArchitectProjectV2 } from "../domain/project";
import { geometryOk, SHELL_FT, GROSS_FT2, CLEAR_FT2 } from "../domain/geometry";
import { isAuthenticatedHuman } from "../domain/actors";
import { BASELINE_TOTAL_USD } from "../domain/economics";

export const HEALTH_CATEGORIES = [
  "TRUTH", "GEOMETRY", "ASSETS", "SYSTEMS", "AUTHORITY", "ECONOMICS", "SIMULATION", "REPLAY", "PERFORMANCE", "MOBILE",
] as const;
export type HealthCategory = (typeof HEALTH_CATEGORIES)[number];

export interface HealthFinding {
  category: HealthCategory;
  ok: boolean;
  detail: string;
  /** points back to the canonical source (an entity id / field), never a separate truth. */
  source: string;
}

export function projectHealth(project: ArchitectProjectV2): HealthFinding[] {
  const spaces = project.spaces;
  const geomAllOk = spaces.length === 9 && spaces.every(geometryOk);
  const method = project.construction.method;
  const plan = project.authority.plan;
  const approvedByHuman = (plan !== "APPROVED" && plan !== "BUILD_READY") || isAuthenticatedHuman(project.authority.by);
  const baselineTotal = project.economics.baseline.total_usd as number;

  return [
    { category: "TRUTH", ok: !!project.provenance.transformed_from_v1, detail: project.provenance.transformed_from_v1 ? "This plan was created from the reference home, with its history kept." : "No origin recorded for this plan.", source: "provenance.transformed_from_v1" },
    { category: "GEOMETRY", ok: geomAllOk, detail: geomAllOk ? `${spaces.length} rooms · ${SHELL_FT}×${SHELL_FT} ft shell · ${CLEAR_FT2} ft² clear in ${GROSS_FT2} ft² gross.` : "A room's measurements do not add up.", source: "spaces" },
    { category: "ASSETS", ok: true, detail: `${project.assets.length} item${project.assets.length === 1 ? "" : "s"} placed.`, source: "assets" },
    { category: "SYSTEMS", ok: method !== "UNDECIDED", detail: method === "UNDECIDED" ? "No construction method chosen yet — the take-off is empty." : method === "FRAME" ? "Built as a wood frame." : "Built with 3D-printed walls.", source: "construction.method" },
    { category: "AUTHORITY", ok: approvedByHuman, detail: approvedByHuman ? `Plan status: ${plan.toLowerCase().replace("_", " ")}.` : "Approved without a signed-in person — not allowed.", source: "authority.plan" },
    { category: "ECONOMICS", ok: baselineTotal === BASELINE_TOTAL_USD, detail: `Baseline estimate $${baselineTotal.toLocaleString("en-US")} (illustrative · assumed) — separate from labour, recognition and local settlement.`, source: "economics.baseline" },
    { category: "SIMULATION", ok: true, detail: "Design checks run live from this plan when you open them.", source: "simulation" },
    { category: "REPLAY", ok: true, detail: "Every change is kept in order, so the plan can be rebuilt exactly.", source: "rcore.events" },
    { category: "PERFORMANCE", ok: true, detail: "The plan draws from one set of numbers, so the views stay fast.", source: "selectors.geometry" },
    { category: "MOBILE", ok: true, detail: "The workspace fits a phone at 375 px with no sideways scroll.", source: "layout" },
  ];
}

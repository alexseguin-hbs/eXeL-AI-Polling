/**
 * ARCHITECT-2525 · Asset Intelligence producer (Vision-2525 Increment 2).
 * =================================================================================================
 * Emits the SHARED `Asset` record (lib/vision2525/asset.ts) for a Layer-Tree component, composing the
 * REUSED engines — NO parallel cost/economy/estimate engine:
 *   cost/time     → architect-house `componentEstimate`
 *   MoT · Trinity → architect-economy `computeEconomy`
 *   confidence/AACE → architect-estimate `confidenceForGate` / `classForGate`
 * Deterministic (no Date/random). `overrides` (quantity/upgrade/supplier/phase) drive live recalculation.
 */
import { findLayer } from "./architect-layers";
import { componentEstimate } from "./architect-house";
import { computeEconomy } from "@/components/architect-2525/architect-economy";
import { confidenceForGate, classForGate } from "./architect-estimate";
import type { Asset, DigitalTwinPhase, Risk } from "./vision2525/asset";

export interface AssetParams { gateIdx?: number; sqft?: number }
export interface AssetOverrides { quantity?: number; phase?: DigitalTwinPhase; upgraded?: boolean; supplier?: string }

// Per-system rough profile: buildable unit, crew, procurement lead (days), insulation R-value, risk.
const SYS_PROFILE: Record<string, { unit: string; crew: number; leadDays: number; rValue: number; risk: Risk }> = {
  site: { unit: "lot", crew: 3, leadDays: 14, rValue: 0, risk: "medium" },
  spaces: { unit: "zone", crew: 2, leadDays: 7, rValue: 0, risk: "low" },
  foundation: { unit: "lf", crew: 6, leadDays: 21, rValue: 5, risk: "medium" },
  structure: { unit: "member", crew: 5, leadDays: 28, rValue: 0, risk: "high" },
  "building-envelope": { unit: "sf", crew: 4, leadDays: 21, rValue: 19, risk: "medium" },
  mechanical: { unit: "unit", crew: 3, leadDays: 35, rValue: 0, risk: "medium" },
  electrical: { unit: "circuit", crew: 2, leadDays: 21, rValue: 0, risk: "medium" },
  plumbing: { unit: "fixture", crew: 2, leadDays: 21, rValue: 0, risk: "medium" },
  "fire-protection": { unit: "device", crew: 2, leadDays: 28, rValue: 0, risk: "high" },
  "communications-low-voltage": { unit: "drop", crew: 2, leadDays: 14, rValue: 0, risk: "low" },
  interior: { unit: "sf", crew: 3, leadDays: 14, rValue: 0, risk: "low" },
  exterior: { unit: "sf", crew: 3, leadDays: 14, rValue: 0, risk: "low" },
};

export function systemOf(id: string): string {
  const m = id.match(/^physical\/([^/]+)/);
  return m ? m[1] : "";
}

export function assetIntel(id: string, params: AssetParams = {}, ov: AssetOverrides = {}): Asset {
  const f = findLayer(id);
  const est = componentEstimate(id);
  const systemId = systemOf(id);
  const prof = SYS_PROFILE[systemId] ?? { unit: "ea", crew: 2, leadDays: 14, rValue: 0, risk: "medium" as Risk };
  const gate = params.gateIdx ?? 6;
  const qty = Math.max(1, Math.round(ov.quantity ?? 1));
  const upgradeMul = ov.upgraded ? 1.25 : 1;

  const baseCost = (est?.cost ?? 1500) * qty * upgradeMul;
  const installDays = (est?.days ?? 2) * (qty > 4 ? Math.ceil(qty / 4) : 1);
  const material = Math.round(baseCost * 0.45), labor = Math.round(baseCost * 0.35);
  const equipment = Math.round(baseCost * 0.12), subcontract = Math.round(baseCost * 0.08);
  const installed = material + labor + equipment + subcontract;

  const laborHours = installDays * 8 * prof.crew;
  const econ = computeEconomy({ laborMin: laborHours * 60, reviewMin: 0, donatedMin: 0, materialsUsd: material });
  const confidence = Math.round(confidenceForGate(gate) * (ov.upgraded ? 0.98 : 1));
  const aaceClass = String(classForGate(gate)) as Asset["status"]["aaceClass"];
  const rValue = ov.upgraded ? prof.rValue + 8 : prof.rValue;
  void rValue; // surfaced by the inspector's energy section (Inc 2 render)

  return {
    id, templateId: `tmpl:${systemId}`, category: f?.path[0]?.label ?? "", subcategory: f?.node.label ?? "",
    name: f?.node.label ?? id, manufacturer: "", model: "", version: "1.0",
    geometry: { building: "V2525-000842", floor: "", room: "", coordinates: [0, 0, 0], orientation: [0, 0, 0] },
    quantities: { count: qty, area: 0, length: 0, volume: 0, weight: 0 },
    cost: { material, labor, equipment, subcontract, installed, maintenance: Math.round(installed * 0.002), replacement: Math.round(installed * 0.8), lifecycle: Math.round(installed * 2.5) },
    schedule: { engineering: Math.max(1, Math.round(installDays * 0.3)), procurement: prof.leadDays, fabrication: Math.round(prof.leadDays * 0.4), shipping: Math.round(prof.leadDays * 0.2), installation: installDays, inspection: 1, commissioning: 1 },
    procurement: { preferredSupplier: ov.supplier ?? "", alternateSuppliers: [], unitPrice: Math.round(baseCost / qty), leadTime: prof.leadDays, deliveryStatus: "ordered" },
    status: { phase: ov.phase ?? "designed", confidence, aaceClass, risk: prof.risk, qualification: { security: "pending", stability: "pending", scalability: "pending", efficiency: "pending", succinctness: "pending" } },
    dependencies: [], successors: [], documents: [], simulations: [], reviews: [], replay: [],
    // Trinity = three ledgers (◬ AI · ♡ spiritual · 웃 human); map computeEconomy: unity→ai, heart→spiritual, human→human.
    economy: { mot: Math.round(laborHours * 60), timeCapital: Math.round(econ.timeCapitalUsd), trinity: { ai: econ.trinity.unity, spiritual: econ.trinity.heart, human: econ.trinity.human, total: Math.round(econ.trinity.unity + econ.trinity.heart + econ.trinity.human) }, budget: installed },
    lifecycle: { maintenance: { frequency: "annual", lastService: 0, nextService: 0 }, warranty: { provider: "", expires: 0, extended: false }, serviceHistory: [] },
    metadata: { sourceFile: "", sourceHash: "", sourceType: "layer-tree", importTimestamp: 0, humanReviewStatus: "unreviewed" },
  };
}

// R-value is a display-only derived value (energy section) — exposed for the inspector without bloating Asset.
export function assetRValue(id: string, ov: AssetOverrides = {}): number {
  const prof = SYS_PROFILE[systemOf(id)];
  const base = prof?.rValue ?? 0;
  return ov.upgraded ? base + 8 : base;
}

/**
 * ARCHITECT-2525 · BILL OF MATERIALS (FIX-10) — turns a room's state into PURCHASABLE, QUOTABLE line items
 * (operator IMG_7533: "plumbing and electrical need length of totals for BOM purchasable items that can be quoted").
 * Pure + deterministic: quantities come from the SAME libs the live designer shows (lib/mep-runs totals + object
 * counts), so the BOM never disagrees with the on-screen numbers. Feeds a designer readout now and Cube 25
 * (Governance & Quote Board) later. No pricing here yet — quantities + units only (est. $ is a later, flagged layer).
 */
import { waterRuns, sewerRuns, electricSpecs, ductRuns } from "./mep-runs";
import { OBJECT_SPEC, type PlacedObject, type ObjectKind } from "./room-objects";

export type BomCategory = "Plumbing" | "Electrical" | "HVAC" | "Openings" | "Structural" | "Furniture";
export type BomUnit = "ft" | "ea";
export interface BomLine { id: string; category: BomCategory; item: string; qty: number; unit: BomUnit }
export interface Bom { lines: BomLine[]; totalLineItems: number; totalUnits: Record<BomUnit, number> }

const catOf = (kind: ObjectKind): BomCategory =>
  kind === "door" || kind === "window" ? "Openings" : kind === "shell" || kind === "roof" ? "Structural" : "Furniture";

/**
 * Build the room's bill of materials. MEP quantities are the live-designer totals; fixtures/furniture/openings are
 * counted from the placed objects (stable order = first appearance). `outlets` drives wire/outlet/breaker lines.
 */
export function roomBom(objects: PlacedObject[], outlets: number): Bom {
  const lines: BomLine[] = [];
  const water = waterRuns(objects).totalFt;
  const sewer = sewerRuns(objects).totalFt;
  const e = electricSpecs(outlets);
  const duct = ductRuns().totalFt;
  if (water > 0) lines.push({ id: "water-pipe", category: "Plumbing", item: "Water supply pipe", qty: water, unit: "ft" });
  if (sewer > 0) lines.push({ id: "sewer-pipe", category: "Plumbing", item: "Sewer / DWV pipe", qty: sewer, unit: "ft" });
  if (e.wireFt > 0) lines.push({ id: "wire", category: "Electrical", item: "Electrical wire", qty: e.wireFt, unit: "ft" });
  if (outlets > 0) lines.push({ id: "outlet", category: "Electrical", item: "Outlet / receptacle", qty: Math.floor(outlets), unit: "ea" });
  if (e.circuits > 0) lines.push({ id: "breaker", category: "Electrical", item: "Breaker (15A circuit)", qty: e.circuits, unit: "ea" });
  if (duct > 0) lines.push({ id: "duct", category: "HVAC", item: "Duct run", qty: duct, unit: "ft" });
  // Fixtures / furniture / openings / structural — counted by kind, stable first-appearance order.
  const counts = new Map<ObjectKind, number>();
  for (const o of objects) counts.set(o.kind, (counts.get(o.kind) ?? 0) + 1);
  counts.forEach((qty, kind) => lines.push({ id: `obj-${kind}`, category: catOf(kind), item: OBJECT_SPEC[kind].label, qty, unit: "ea" }));
  const totalUnits: Record<BomUnit, number> = { ft: 0, ea: 0 };
  for (const l of lines) totalUnits[l.unit] += l.qty;
  return { lines, totalLineItems: lines.length, totalUnits };
}

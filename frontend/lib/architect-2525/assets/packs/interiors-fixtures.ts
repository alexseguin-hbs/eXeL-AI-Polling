/**
 * ARCHITECT-2525 · PACK 2 — INTERIORS & FIXTURES (Rev A: the ids of the kinds that exist TODAY, grouped as the brief's
 * Pack 2 rooms; Revisions B–H land the remaining pieces room by room — see README.md).
 * Packs organise IMPLEMENTATION; rooms/categories organise USE (brief §17) — a pack is a list of stable ids over the one
 * registry, never a second definition. Each room group names the canonical room key it is compatible with (gated).
 * Pure data.
 */
import { ASSET_PARAMS, type ObjectKind, type RoomKey } from "@/lib/room-objects";

const id = (k: ObjectKind): string => ASSET_PARAMS[k].id;

export interface PackRoomGroup { room: RoomKey; label: string; ids: string[] }
export interface AssetPack { id: string; label: string; revisions: string; groups: PackRoomGroup[] }

export const PACK_INTERIORS_FIXTURES: AssetPack = {
  id: "pack2.interiors-fixtures",
  label: "Pack 2 — Interiors & Fixtures",
  revisions: "B (Living + Dining) · C (Kitchen) · D (Bedroom + Closet) · E (Bath) · F (Office) · G (Laundry) · H (Entry)",
  groups: [
    { room: "L", label: "Living",            ids: [id("sofa"), id("tv"), id("table"), id("chair"), id("bookshelf"), id("lamp")] },
    { room: "D", label: "Dining",            ids: [id("table"), id("chair"), id("counter")] },
    { room: "K", label: "Kitchen",           ids: [id("fridge"), id("stove"), id("rangehood"), id("counter"), id("sink")] },
    { room: "M", label: "Bedroom",           ids: [id("bed"), id("nightstand"), id("desk"), id("lamp"), id("mirror"), id("rug")] },
    { room: "C", label: "Master Closet",     ids: [id("wardrobe"), id("dresser"), id("closetrod"), id("shelving"), id("shoerack"), id("mirror")] },
    { room: "B", label: "Master Bath",       ids: [id("toilet"), id("sink"), id("shower"), id("tub"), id("mirror"), id("shelving")] },
    { room: "O", label: "Office",            ids: [id("desk"), id("chair"), id("bookshelf"), id("tv")] },
    { room: "S", label: "Storage · Laundry", ids: [id("washer"), id("sink"), id("counter"), id("shelving")] },
  ],
};

/** Every id the pack references, de-duplicated, in pack order. */
export function packIds(pack: AssetPack = PACK_INTERIORS_FIXTURES): string[] {
  const seen = new Set<string>(); const out: string[] = [];
  for (const g of pack.groups) for (const i of g.ids) if (!seen.has(i)) { seen.add(i); out.push(i); }
  return out;
}

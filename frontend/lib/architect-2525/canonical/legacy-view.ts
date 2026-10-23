// SPECS / ARCHITECT-2525 §37.02 / OPEN#5 — the one bidirectional adapter between the canonical Runtime and
// the legacy RoomCell view the existing Architect UI reads. toRoomCells(project) projects canonical Spaces to
// RoomCell[]; the non-canonical REQUIRED fields (windows/doors/outlets/furniture/objects) are ZEROED — bare
// Space boundaries, NO refabricated openings (honouring the no-walls/no-fabrication truth) — and the
// structural fields come from canonical (bay_code→id/k/label, width_um/depth_um→w,d, semantic bay_code→row,col
// under +Y-North/+X-East). applyEdgeEdit bridges a legacy edge drag to the canonical edge engine. This file is
// the seam; it does NOT rewire the live app — that is the Block-D UI step, and architect-design.tsx is the one
// edge-edit owner (its moveRoomInLayout/resizeRoomInLayout calls at :111/:127 are what gets rewired).
//
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-legacy-view.test.mjs

import { UM_PER_10FT } from "./units";
import { proposeEdgeEdit } from "./runtime-edit";
import type { Edge, ProposeResult } from "./runtime-edit";
import type { ArchitectProject, SpaceEntity, SpaceFunction } from "./types";
import type { RoomCell } from "@/lib/room-layout";

// SpaceFunction → the legacy one-letter map key (M/B/C/L/K/D/O/S/E) and a human label.
const K_BY_FUNCTION: Record<SpaceFunction, string> = {
  BEDROOM: "M", BATH: "B", CLOSET: "C", LIVING: "L", KITCHEN: "K", DINING: "D", OFFICE: "O", UTILITY: "S", ENTRY: "E",
};
const LABEL_BY_FUNCTION: Record<SpaceFunction, string> = {
  BEDROOM: "Bedroom", BATH: "Bath", CLOSET: "Closet", LIVING: "Living", KITCHEN: "Kitchen",
  DINING: "Dining", OFFICE: "Office", UTILITY: "Utility", ENTRY: "Entry",
};

/** bay_code letter → row (A north=0, B=1, C south=2), digit → col (1 west=0, 2=1, 3 east=2). +Y-North/+X-East. */
function rowOf(bay: string): number { return { A: 0, B: 1, C: 2 }[bay[0]] ?? 0; }
function colOf(bay: string): number { return (Number.parseInt(bay.slice(1), 10) || 1) - 1; }

const spacesOf = (p: ArchitectProject) => p.entities.filter((e): e is SpaceEntity => e.entity_type === "SPACE");

/**
 * SPECS §37.02 — project the canonical Runtime to the legacy RoomCell[] view. Structural fields from canonical;
 * every non-canonical field zeroed (no refabricated windows/doors/outlets/furniture/objects). Pure.
 */
export function toRoomCells(project: ArchitectProject): RoomCell[] {
  return spacesOf(project).map((s) => ({
    id: s.bay_code,
    k: K_BY_FUNCTION[s.function],
    label: LABEL_BY_FUNCTION[s.function],
    row: rowOf(s.bay_code),
    col: colOf(s.bay_code),
    w: s.width_um / UM_PER_10FT,
    d: s.depth_um / UM_PER_10FT,
    windows: 0,
    doors: 0,
    outlets: 0,
    furniture: false,
    objects: undefined,
  }));
}

/**
 * SPECS §37.02/§07 — bridge a legacy edge edit (bay_code + direction + µm delta) to the canonical edge engine.
 * Returns the AI PROPOSED IMPACT preview (or a BLOCKED reason); accepts sub-cell µm deltas, so the demo UI can
 * drive the 1-ft edit the proof shows. ACCEPT is the caller's separate act (acceptEdit) — this only proposes.
 */
export function applyEdgeEdit(project: ArchitectProject, bay_code: string, edge: Edge, deltaUm: number): ProposeResult {
  return proposeEdgeEdit(project, { bay_code, edge, deltaUm });
}

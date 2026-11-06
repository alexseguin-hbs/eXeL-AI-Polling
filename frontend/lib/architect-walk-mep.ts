// ARCHITECT-2525 · WALK MEP LAYER — the pure elevation shape of a room's mechanical/electrical/plumbing for the
// first-person walk (operator 2026-11-06: "I can't see electrical when in that phase — see the wires and outlets").
// REUSE: the 2D/3D designer's own run geometry (lib/mep-runs: outletPositions ring, panelAt, waterRuns/sewerRuns/ductRuns,
// OUTLET_AFF_FT) + the one MEP_COLOR source. This converts the plan-grid routes into the ELEVATION a homeowner recognises
// — wires up the wall to the top plate, around, and dropped to outlets at receptacle height; pipes on the floor; ducts at
// the ceiling — all in WALK WORLD space (the Y-AXIS FLIP: plan gy 0 = NORTH → world far). Pure (no React/DOM) so the walk
// AND tests/architect-walk-mep.test.mjs read the SAME geometry.
import { ROOM_GRID, type PlacedObject } from "./room-objects";
import { outletPositions, panelAt, OUTLET_AFF_FT, waterRuns, sewerRuns, ductRuns, MEP_COLOR } from "./mep-runs";
import type { Vec3 } from "./solid-shade";

const RF = ROOM_GRID;                 // 10
const TOP_PLATE = 8;                  // the 8-ft top plate the wiring ring runs along
const PANEL_BOT = 4, PANEL_H = 2.5, PANEL_W = 1.2;   // the service panel: 1.2×2.5 ft, bottom at 4 ft
const OUT_W = 0.45, OUT_H = 0.65, PUSH = 0.03;        // an outlet: 0.45×0.65 ft on the wall face, pushed into the room

export type MepLayer = "wiring" | "water" | "sewer" | "duct";
export interface MepBox { kind: "outlet" | "panel"; pts: Vec3[]; z: number }
export interface WalkMep { lines: Vec3[][]; boxes: MepBox[]; color: string }

// plan cell (gx,gy) + height z → walk world, with the Y-FLIP (plan gy 0 = NORTH → world far), offset by the room origin.
const W3 = (gx: number, gy: number, z: number, ox: number, oy: number): Vec3 => [ox + gx + 0.5, oy + (RF - (gy + 0.5)), z];

// a small vertical quad on the perimeter wall the cell sits on, centred at height z, pushed PUSH into the room.
function wallQuad(gx: number, gy: number, z: number, w: number, h: number, ox: number, oy: number): Vec3[] {
  const cx = ox + gx + 0.5, cy = oy + (RF - (gy + 0.5));
  const z0 = z - h / 2, z1 = z + h / 2, hw = w / 2;
  if (gx === 0)      return [[cx + PUSH, cy - hw, z0], [cx + PUSH, cy + hw, z0], [cx + PUSH, cy + hw, z1], [cx + PUSH, cy - hw, z1]]; // W wall
  if (gx === RF - 1) return [[cx - PUSH, cy - hw, z0], [cx - PUSH, cy + hw, z0], [cx - PUSH, cy + hw, z1], [cx - PUSH, cy - hw, z1]]; // E wall
  if (gy === 0)      return [[cx - hw, cy - PUSH, z0], [cx + hw, cy - PUSH, z0], [cx + hw, cy - PUSH, z1], [cx - hw, cy - PUSH, z1]]; // N wall (world far)
  return [[cx - hw, cy + PUSH, z0], [cx + hw, cy + PUSH, z0], [cx + hw, cy + PUSH, z1], [cx - hw, cy + PUSH, z1]];                     // S wall (world near)
}

/**
 * The walk-world geometry of one MEP layer for a room: wiring = panel box → up to the top plate → around to each outlet
 * → dropped to receptacle height, with outlet boxes; water/sewer = the pipe runs on the floor; duct = at the ceiling.
 */
export function walkMep(layer: MepLayer, outletCount: number, objects: PlacedObject[], ox = 0, oy = 0): WalkMep {
  const lines: Vec3[][] = []; const boxes: MepBox[] = [];
  if (layer === "wiring") {
    const panel = panelAt(objects);
    const outs = outletPositions(outletCount, objects);
    const panelTop = W3(panel.gx, panel.gy, TOP_PLATE, ox, oy);
    boxes.push({ kind: "panel", pts: wallQuad(panel.gx, panel.gy, PANEL_BOT + PANEL_H / 2, PANEL_W, PANEL_H, ox, oy), z: PANEL_BOT + PANEL_H / 2 });
    lines.push([W3(panel.gx, panel.gy, PANEL_BOT + PANEL_H, ox, oy), panelTop]);  // panel top → top plate
    for (const o of outs) {
      const top = W3(o.gx, o.gy, TOP_PLATE, ox, oy);
      lines.push([panelTop, top]);                                 // along the top plate (panel → above the outlet)
      lines.push([top, W3(o.gx, o.gy, OUTLET_AFF_FT, ox, oy)]);    // drop to the outlet
      boxes.push({ kind: "outlet", pts: wallQuad(o.gx, o.gy, OUTLET_AFF_FT, OUT_W, OUT_H, ox, oy), z: OUTLET_AFF_FT });
    }
  } else if (layer === "water" || layer === "sewer") {
    for (const r of (layer === "water" ? waterRuns(objects) : sewerRuns(objects)).runs) lines.push(r.path.map((p) => W3(p.gx, p.gy, 0.3, ox, oy)));
  } else if (layer === "duct") {
    for (const r of ductRuns().runs) lines.push(r.path.map((p) => W3(p.gx, p.gy, RF - 0.5, ox, oy)));
  }
  return { lines, boxes, color: MEP_COLOR[layer] };
}

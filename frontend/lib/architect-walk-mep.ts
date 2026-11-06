// ARCHITECT-2525 · WALK MEP LAYER — the pure elevation shape of a room's mechanical/electrical/plumbing for the
// first-person walk (operator 2026-11-06: "I can't see electrical when in that phase — see the wires and outlets").
// REUSE: the 2D/3D designer's own run geometry (lib/mep-runs: outletPositions ring, panelAt, waterRuns/sewerRuns/ductRuns,
// OUTLET_AFF_FT, STUB_AFF_FT, fixtureEndpoints) + the one MEP_COLOR source. This converts the plan-grid routes into the
// ELEVATION a homeowner recognises — wires up the wall to the top plate, around, and dropped to outlets at receptacle
// height; water risers + ball valves + a PEX manifold + hot-over-cold; sewer drains that FALL to the stack with traps and
// vents through the roof; ducts in the plenum — all in WALK WORLD space (the Y-AXIS FLIP: plan gy 0 = NORTH → world far).
// Pure (no React/DOM) so the walk AND tests/architect-walk-mep.test.mjs read the SAME geometry.
import { ROOM_GRID, type ObjectKind, type PlacedObject } from "./room-objects";
import {
  outletPositions, panelAt, OUTLET_AFF_FT, STUB_AFF_FT, DRAIN_SLOPE_FT_PER_FT,
  waterRuns, sewerRuns, ductRuns, fixtureEndpoints, WATER_FIXTURES, DRAIN_FIXTURES,
  MEP_SOURCE, MEP_COLOR, type MepPt,
} from "./mep-runs";
import type { Vec3 } from "./solid-shade";

const RF = ROOM_GRID;                 // 10 = the INNER clear room / finished ceiling (ROOM_GRID, one source)
const TOP_PLATE = RF;                 // the top plate / wiring ring runs just under the 10-ft inner ceiling (keyed to the cube)
const CEIL = RF;                      // vents + the stack rise to the 10-ft inner ceiling (keyed to the cube)
export const DUCT_Z = RF + 1;         // 11 ft — the trunk centreline sits in the PLENUM (10→12), ABOVE the 10-ft inner ceiling (room-layout SHELL_FT)
const PANEL_BOT = 4, PANEL_H = 2.5, PANEL_W = 1.2;   // the service panel: 1.2×2.5 ft, bottom at 4 ft
const OUT_W = 0.45, OUT_H = 0.65, PUSH = 0.03;        // an outlet: 0.45×0.65 ft on the wall face, pushed into the room
const COLD_Z = 0.3, HOT_Z = 0.55;     // water supply on the floor — cold then hot-over-cold (0.25 ft apart = readable)
const HOT_DX = 0.33;                  // hot riser offset along the wall from the cold riser

export type MepLayer = "wiring" | "water" | "sewer" | "duct";
export type GlyphKind = "valve" | "stop" | "mixer" | "manifold" | "trap" | "flange" | "cleanout" | "vent" | "register" | "vcd" | "return" | "ahu";
export interface MepBox { kind: "outlet" | "panel"; pts: Vec3[]; z: number }
export interface MepSubline { pts: Vec3[]; color: string; dash?: string; w?: number }
export interface MepGlyph { kind: GlyphKind; polys: Vec3[][]; lines?: Vec3[][]; at: Vec3; color: string; label?: string }
export interface WalkMep { lines: Vec3[][]; boxes: MepBox[]; sublines: MepSubline[]; glyphs: MepGlyph[]; color: string }

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

// ── GLYPH HELPERS (world space; ISA-5.1-flavoured shapes, drawn in the vertical plane through a horizontal `dir`) ─────────
const norm2 = (d: [number, number]): [number, number] => { const m = Math.hypot(d[0], d[1]) || 1; return [d[0] / m, d[1] / m]; };
/** ▷◁ a bow-tie (gate/ball valve body): two triangles tip-to-tip at p, in the vertical plane along `dir`. */
export function bowtie(p: Vec3, dir: [number, number], size = 0.4): Vec3[][] {
  const h = 0.4 * size, l = 0.4 * size, [dx, dy] = norm2(dir), ax = dx * l, ay = dy * l;
  return [
    [[p[0], p[1], p[2]], [p[0] - ax, p[1] - ay, p[2] + h], [p[0] - ax, p[1] - ay, p[2] - h]],
    [[p[0], p[1], p[2]], [p[0] + ax, p[1] + ay, p[2] + h], [p[0] + ax, p[1] + ay, p[2] - h]],
  ];
}
/** a regular n-gon disc at p in the vertical plane along `dir` (the valve handwheel / cleanout / mixer disc). */
export function ring(p: Vec3, r: number, n = 6, dir: [number, number] = [1, 0]): Vec3[] {
  const [dx, dy] = norm2(dir), poly: Vec3[] = [];
  for (let i = 0; i < n; i++) { const a = (2 * Math.PI * i) / n; poly.push([p[0] + dx * r * Math.cos(a), p[1] + dy * r * Math.cos(a), p[2] + r * Math.sin(a)]); }
  return poly;
}
/** a ball valve = the bow-tie body + a small handwheel ring. */
export function ballValve(p: Vec3, dir: [number, number], size = 0.5): Vec3[][] {
  return [...bowtie(p, dir, size), ring(p, 0.1 * (size / 0.5), 6, dir)];
}
/** 2D legend shapes at 10 px (for the Plumbing chip row) — one source, same silhouettes as the world glyphs. */
export const GLYPH_PATHS: Record<string, string> = {
  valve: "M0,5 L5,0 L5,10 Z M10,5 L5,0 L5,10 Z",            // ▷◁
  stop: "M0,5 L4,2 L4,8 Z M10,5 L6,2 L6,8 Z M5,5 m-1.5,0 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0", // ▷○◁
  manifold: "M0,2 H10 V8 H0 Z M2,8 V9 M4,8 V9 M6,8 V9 M8,8 V9", // ⊟ + run ticks
  mixer: "M5,5 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0",         // ●
  trap: "M2,0 V5 a3,3 0 0,0 6,0 V0",                          // ∪
  cleanout: "M5,5 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0",       // ○
  vent: "M0,10 L5,0 L10,10 Z",                                 // ▲ (VTR)
  flange: "M5,5 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0 M1,5 H9",// ⊘
};

// direction (plan-grid) between two cells, Y-flipped into world xy.
function dirWorld(a: MepPt, b: MepPt): [number, number] { return norm2([b.gx - a.gx, -(b.gy - a.gy)]); }

/**
 * The walk-world geometry of one MEP layer for a room. Electrical (unchanged): panel → top plate → outlets. Water: a cold
 * floor run (lines, unchanged) PLUS risers, a main ball valve, a PEX manifold, hot-over-cold twins, angle stops and mixing
 * valves (sublines + glyphs). Sewer: drains that FALL to the SE stack with traps, vents and a roof vent-through-roof.
 */
export function walkMep(layer: MepLayer, outletCount: number, objects: PlacedObject[], ox = 0, oy = 0): WalkMep {
  const lines: Vec3[][] = []; const boxes: MepBox[] = []; const sublines: MepSubline[] = []; const glyphs: MepGlyph[] = [];
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
  } else if (layer === "water") {
    const runs = waterRuns(objects).runs;
    const kindAt = new Map(fixtureEndpoints(objects, WATER_FIXTURES).map((e) => [`${e.gx},${e.gy}`, e.kind]));
    const src = MEP_SOURCE.water;                                  // NW
    // 1 · service trunk riser + MAIN ball valve + PEX manifold
    sublines.push({ pts: [W3(src.gx, src.gy, 0.3, ox, oy), W3(src.gx, src.gy, 3.0, ox, oy)], color: MEP_COLOR.water, w: 3.0 });
    glyphs.push({ kind: "valve", polys: ballValve(W3(src.gx, src.gy, 1.0, ox, oy), [0, 1], 0.5), at: W3(src.gx, src.gy, 1.0, ox, oy), color: MEP_COLOR.water, label: "MAIN" });
    const manZ = 2.7, manPts = wallQuad(src.gx, src.gy, manZ, 1.0, 0.6, ox, oy);
    glyphs.push({ kind: "manifold", polys: [manPts], at: W3(src.gx, src.gy, manZ, ox, oy), color: MEP_COLOR.water });
    // 2/3/4 · per fixture: cold floor run (lines), hot twin, risers, angle stops / mixers
    for (const r of runs) {
      const to = r.to, kind = kindAt.get(`${to.gx},${to.gy}`) as ObjectKind | undefined;
      const stub = (kind && STUB_AFF_FT[kind]) ?? 1.67;
      lines.push(r.path.map((p) => W3(p.gx, p.gy, COLD_Z, ox, oy)));                        // cold on the floor (unchanged shape)
      if (kind !== "toilet") sublines.push({ pts: r.path.map((p) => W3(p.gx, p.gy, HOT_Z, ox, oy)), color: MEP_COLOR.hot, w: 2.0 }); // hot-over-cold
      sublines.push({ pts: [W3(to.gx, to.gy, COLD_Z, ox, oy), W3(to.gx, to.gy, stub, ox, oy)], color: MEP_COLOR.water, w: 2.0 });     // cold riser
      if (kind !== "toilet") sublines.push({ pts: [W3(to.gx, to.gy, HOT_Z, ox, oy), [ox + to.gx + 0.5 + HOT_DX, oy + (RF - (to.gy + 0.5)), stub]], color: MEP_COLOR.hot, w: 2.0 }); // hot riser
      const dir = dirWorld(src, to);
      if (kind === "tub" || kind === "shower") {
        glyphs.push({ kind: "mixer", polys: [ring(W3(to.gx, to.gy, 4.0, ox, oy), 0.25, 12, dir)], at: W3(to.gx, to.gy, 4.0, ox, oy), color: MEP_COLOR.water });
      } else {
        const nStops = kind === "toilet" ? 1 : 2;                                           // toilet 1 (cold), sink/counter/washer 2
        glyphs.push({ kind: "stop", polys: ballValve(W3(to.gx, to.gy, stub, ox, oy), dir, 0.35), at: W3(to.gx, to.gy, stub, ox, oy), color: MEP_COLOR.water });
        if (nStops === 2) { const at = [ox + to.gx + 0.5 + HOT_DX, oy + (RF - (to.gy + 0.5)), stub] as Vec3; glyphs.push({ kind: "stop", polys: ballValve(at, dir, 0.35), at, color: MEP_COLOR.hot }); }
      }
    }
  } else if (layer === "sewer") {
    const runs = sewerRuns(objects).runs;
    const kindAt = new Map(fixtureEndpoints(objects, DRAIN_FIXTURES).map((e) => [`${e.gx},${e.gy}`, e.kind]));
    const stack = MEP_SOURCE.sewer;                               // SE
    // 1 · each drain FALLS to the stack: vertex z = 0.1 + slope·(distance remaining to the stack)
    for (const r of runs) {
      const from = r.from, kind = kindAt.get(`${from.gx},${from.gy}`) as ObjectKind | undefined;
      // distance from each vertex to the stack end, along the path
      const segLen: number[] = [];
      for (let i = 1; i < r.path.length; i++) segLen.push(Math.abs(r.path[i].gx - r.path[i - 1].gx) + Math.abs(r.path[i].gy - r.path[i - 1].gy));
      const distToEnd = r.path.map((_, i) => segLen.slice(i).reduce((a, b) => a + b, 0));
      lines.push(r.path.map((p, i) => W3(p.gx, p.gy, 0.1 + DRAIN_SLOPE_FT_PER_FT * distToEnd[i], ox, oy)));
      // 2 · trap at the fixture (every drain but the toilet, which has an integral trap → flange)
      const dir0 = r.path.length > 1 ? dirWorld(r.path[0], r.path[1]) : ([0, 1] as [number, number]);
      if (kind === "toilet") {
        glyphs.push({ kind: "flange", polys: [ring(W3(from.gx, from.gy, 0.02, ox, oy), 0.2, 6, [1, 0])], at: W3(from.gx, from.gy, 0.02, ox, oy), color: MEP_COLOR.sewer });
      } else {
        const zd = kind === "sink" || kind === "counter" ? 1.5 : 0.7;
        const a = W3(from.gx, from.gy, zd, ox, oy), b = W3(from.gx, from.gy, zd - 0.35, ox, oy);
        const c: Vec3 = [b[0] + 0.3 * dir0[0], b[1] + 0.3 * dir0[1], zd - 0.35], d: Vec3 = [c[0], c[1], zd - 0.1];
        sublines.push({ pts: [a, b, c, d], color: MEP_COLOR.sewer, w: 2.2 });               // ∪ trap
      }
      // 3 · vent per run — up through the roof from the fixture (first corner), dashed, in vent green
      sublines.push({ pts: [W3(from.gx, from.gy, 1.2, ox, oy), W3(from.gx, from.gy, CEIL, ox, oy)], color: MEP_COLOR.vent, dash: "2 4", w: 1.6 });
    }
    // 4 · the main stack at the SE anchor: solid 0→4, vent "2 4" above to the ceiling; cleanout at the base; VTR at the top
    sublines.push({ pts: [W3(stack.gx, stack.gy, 0, ox, oy), W3(stack.gx, stack.gy, 4, ox, oy)], color: MEP_COLOR.sewer, w: 4.0 });
    sublines.push({ pts: [W3(stack.gx, stack.gy, 4, ox, oy), W3(stack.gx, stack.gy, CEIL, ox, oy)], color: MEP_COLOR.vent, dash: "2 4", w: 4.0 });
    glyphs.push({ kind: "cleanout", polys: [ring(W3(stack.gx, stack.gy, 0.6, ox, oy), 0.15, 8, [1, 0])], at: W3(stack.gx, stack.gy, 0.6, ox, oy), color: MEP_COLOR.sewer, label: "CO" });
    const vtr = W3(stack.gx, stack.gy, CEIL - 0.2, ox, oy);
    glyphs.push({ kind: "vent", polys: [[[vtr[0] - 0.2, vtr[1], vtr[2]], [vtr[0] + 0.2, vtr[1], vtr[2]], [vtr[0], vtr[1], vtr[2] + 0.4]]], at: vtr, color: MEP_COLOR.vent, label: "VTR" });
  } else if (layer === "duct") {
    for (const r of ductRuns().runs) lines.push(r.path.map((p) => W3(p.gx, p.gy, DUCT_Z, ox, oy)));
  }
  return { lines, boxes, sublines, glyphs, color: MEP_COLOR[layer] };
}

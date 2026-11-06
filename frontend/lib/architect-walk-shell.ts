// ARCHITECT-2525 · WALK SHELL PHASES (P4 + R3 reinforcement) — the real layer for every non-MEP, non-framing build phase so
// NONE renders as an empty box (operator 2026-11-06 via MoT R3: "every build phase must show its REAL layer"). Foundation
// (slab · footings · rebar · anchor bolts), Roofing (pitched rafters + ridge + sheathing in the 10→12 plenum), Insulation
// (batts per bay, window bays skipped), Security (corner cameras + coverage wedges + exterior door/window cams), Internet
// (dish · LAN plate · Cat6 drop · Wi-Fi AP), Finish (floor finish + base/ceiling trim; fixtures are set by the phase draw).
// REUSE: studOffsetsFt + SHELL_COLOR + FRAME_COLOR (architect-phase-palette), boxFaces (solid-shade), ring (architect-walk-mep),
// the 10-ft inner ceiling + 12-ft shell (room-layout). Pure (no React/DOM) so the walk AND the gate read the SAME geometry.
import { boxFaces, type Quad, type Vec3 } from "./solid-shade";
import { studOffsetsFt, SHELL_COLOR, type StudGauge } from "./architect-phase-palette";
import { ring } from "./architect-walk-mep";
import { ROOM_FT, STOREY_FT, SHELL_FT } from "./room-layout";
import { OUTLET_AFF_FT, panelAt } from "./mep-runs";

const RF = ROOM_FT;                 // 10 — inner clear room edge
const CEIL = STOREY_FT;             // 10 — inner clear ceiling
const RIDGE = SHELL_FT;             // 12 — the roof ridge sits at the top of the shell (the 10→12 plenum)
const PUSH = 0.03;

export type Side = "N" | "S" | "W" | "E";
export interface ShellSub { pts: Vec3[]; color: string; dash?: string; w?: number }
export interface ShellGlyph { kind: string; polys: Vec3[][]; lines?: Vec3[][]; at: Vec3; color: string; label?: string }
export interface WalkShell { quads: Quad[]; sublines: ShellSub[]; glyphs: ShellGlyph[]; wallDim: number | null; label?: string }
export interface ShellOpening { side: Side; center: number; span: number; exterior?: boolean }
export interface ShellCtx { gauge?: StudGauge; openings?: ShellOpening[]; kind?: string; nbS?: boolean; ox?: number; oy?: number }

const W3 = (gx: number, gy: number, z: number, ox: number, oy: number): Vec3 => [ox + gx + 0.5, oy + (RF - (gy + 0.5)), z];
// a small vertical quad on the perimeter wall the cell sits on, centred at height z, pushed PUSH into the room.
function wallQuad(gx: number, gy: number, z: number, w: number, h: number, ox: number, oy: number): Vec3[] {
  const cx = ox + gx + 0.5, cy = oy + (RF - (gy + 0.5)), z0 = z - h / 2, z1 = z + h / 2, hw = w / 2;
  if (gx === 0)      return [[cx + PUSH, cy - hw, z0], [cx + PUSH, cy + hw, z0], [cx + PUSH, cy + hw, z1], [cx + PUSH, cy - hw, z1]];
  if (gx === RF - 1) return [[cx - PUSH, cy - hw, z0], [cx - PUSH, cy + hw, z0], [cx - PUSH, cy + hw, z1], [cx - PUSH, cy - hw, z1]];
  if (gy === 0)      return [[cx - hw, cy - PUSH, z0], [cx + hw, cy - PUSH, z0], [cx + hw, cy - PUSH, z1], [cx - hw, cy - PUSH, z1]];
  return [[cx - hw, cy + PUSH, z0], [cx + hw, cy + PUSH, z0], [cx + hw, cy + PUSH, z1], [cx - hw, cy + PUSH, z1]];
}

/** The shell layer of one room for a given phase. Returns quads (join the one solidFaces call), sublines + glyphs (join the
 *  MEP passes), and `wallDim` — the wall fillOpacity this phase wants (null = leave walls solid). `label` → the chip note. */
export function walkShell(phaseId: string | null | undefined, ctx: ShellCtx = {}): WalkShell {
  const ox = ctx.ox ?? 0, oy = ctx.oy ?? 0;
  const quads: Quad[] = []; const sublines: ShellSub[] = []; const glyphs: ShellGlyph[] = [];
  const offs = studOffsetsFt(RF);
  const openings = ctx.openings ?? [];

  if (phaseId === "foundation") {
    // slab (a thin floor box recoloured) + perimeter footings + rebar grid + anchor bolts; the walls are only outlined
    quads.push(...boxFaces(ox, oy, -0.1, RF, RF, 0.1, SHELL_COLOR.slab));
    quads.push(...boxFaces(ox, oy, -0.5, RF, 0.5, 0.5, SHELL_COLOR.footing));            // S footing (world near)
    quads.push(...boxFaces(ox, oy + RF - 0.5, -0.5, RF, 0.5, 0.5, SHELL_COLOR.footing)); // N footing (world far)
    quads.push(...boxFaces(ox, oy, -0.5, 0.5, RF, 0.5, SHELL_COLOR.footing));            // W footing
    quads.push(...boxFaces(ox + RF - 0.5, oy, -0.5, 0.5, RF, 0.5, SHELL_COLOR.footing)); // E footing
    for (const s of offs) {                                                               // rebar grid at z 0.05 (18 lines)
      sublines.push({ pts: [[ox + s, oy, 0.05], [ox + s, oy + RF, 0.05]], color: SHELL_COLOR.rebar, w: 1 });
      sublines.push({ pts: [[ox, oy + s, 0.05], [ox + RF, oy + s, 0.05]], color: SHELL_COLOR.rebar, w: 1 });
    }
    for (const side of ["N", "S", "W", "E"] as const) for (const s of [1, 7]) {           // anchor bolts (8, 6' o.c.)
      const p: Vec3 = side === "S" ? [ox + s, oy + PUSH, 0] : side === "N" ? [ox + s, oy + RF - PUSH, 0] : side === "W" ? [ox + PUSH, oy + s, 0] : [ox + RF - PUSH, oy + s, 0];
      sublines.push({ pts: [p, [p[0], p[1], 0.25]], color: SHELL_COLOR.rebar, w: 2 });
    }
    return { quads, sublines, glyphs, wallDim: 0.08, label: "slab + footings" };
  }

  if (phaseId === "roofing") {
    // THE ROOF GOES ON (not a wall): a GABLE in the 10→12 plenum above the x-rayed ceiling — a ridge beam running E–W at the
    // room centre, rafters rising from each top-plate edge to the ridge, and two sheathing planes. The studs are dropped by
    // the walkthrough so it reads as a roof, not framing. SHELL_COLOR.truss is a distinct roof colour (≠ FRAME_COLOR).
    const col = SHELL_COLOR.truss, ridgeY = RF / 2;
    sublines.push({ pts: [[ox, oy + ridgeY, RIDGE], [ox + RF, oy + ridgeY, RIDGE]], color: col, w: 2.4 });          // ridge beam
    for (let s = 0; s <= RF; s += 2) {                                                                               // rafters @ 24" o.c.
      sublines.push({ pts: [[ox + s, oy, CEIL], [ox + s, oy + ridgeY, RIDGE]], color: col, w: 1.4 });               // S slope rafter
      sublines.push({ pts: [[ox + s, oy + RF, CEIL], [ox + s, oy + ridgeY, RIDGE]], color: col, w: 1.4 });          // N slope rafter
    }
    // two sheathing planes (the pitched roof surface) as translucent glyph quads
    glyphs.push({ kind: "roof", polys: [[[ox, oy, CEIL], [ox + RF, oy, CEIL], [ox + RF, oy + ridgeY, RIDGE], [ox, oy + ridgeY, RIDGE]]], at: [ox + RF / 2, oy + ridgeY / 2, (CEIL + RIDGE) / 2], color: col, label: "roof" });
    glyphs.push({ kind: "roof", polys: [[[ox, oy + RF, CEIL], [ox + RF, oy + RF, CEIL], [ox + RF, oy + ridgeY, RIDGE], [ox, oy + ridgeY, RIDGE]]], at: [ox + RF / 2, oy + RF - ridgeY / 2, (CEIL + RIDGE) / 2], color: col });
    return { quads, sublines, glyphs, wallDim: 0.15, label: "pitched roof + rafters" };
  }

  if (phaseId === "insulation") {
    // one batt per stud bay on each wall plane; the OPENING bay (door or window, by its real span) is skipped — glass is not batted
    for (const side of ["N", "S", "W", "E"] as const) {
      const op = openings.find((o) => o.side === side);
      const hw = op ? op.span / 2 + 0.3 : 0;
      for (let i = 0; i < offs.length - 1; i++) {
        const a = offs[i], b = offs[i + 1], mid = (a + b) / 2;
        if (op && mid > op.center - hw && mid < op.center + hw) continue;                  // skip the opening bay (door OR window)
        const quad = wallBay(side, a, b, 0.125, CEIL - 0.25, ox, oy);
        glyphs.push({ kind: "insulation", polys: [quad], at: [quad[0][0], quad[0][1], (0.125 + CEIL - 0.25) / 2], color: SHELL_COLOR.insulation });
      }
    }
    return { quads, sublines, glyphs, wallDim: 0.15, label: "R-20+5 ci envelope" };
  }

  if (phaseId === "security") {
    // 4 ceiling-corner cameras (lens + housing silhouette) + 90° floor coverage wedges; an OUTWARD camera over each EXTERIOR
    // opening (a wall with no neighbour — the building faces out there), per spec A8, not interior doorways (Odin fix).
    const cam = SHELL_COLOR.camera;
    const corners: [number, number][] = [[0.3, 0.3], [RF - 0.3, 0.3], [0.3, RF - 0.3], [RF - 0.3, RF - 0.3]];
    corners.forEach(([cx, cy], i) => {
      const at: Vec3 = [ox + cx, oy + cy, CEIL - 0.3];
      // lens ring + a short housing stub pointing into the room → reads as a camera, not a bare dot
      const hx = cx < RF / 2 ? 0.3 : -0.3, hy = cy < RF / 2 ? 0.3 : -0.3;
      glyphs.push({ kind: "camera", polys: [ring(at, 0.18, 8, [1, 0])], lines: [[at, [at[0] + hx, at[1] + hy, at[2] - 0.1]]], at, color: cam, label: i === 0 ? "CAM" : undefined });
      glyphs.push({ kind: "wedge", polys: [fanWedge(ox + cx, oy + cy, 6, cx < RF / 2, cy < RF / 2)], at: [ox + cx, oy + cy, 0.02], color: cam });
    });
    for (const op of openings) {
      if (!op.exterior) continue;                                                           // outward cam only on exterior walls
      const c = op.center, atW: Record<Side, Vec3> = {
        N: [ox + c, oy + RF - PUSH, CEIL - 0.8], S: [ox + c, oy + PUSH, CEIL - 0.8],
        W: [ox + PUSH, oy + (RF - c), CEIL - 0.8], E: [ox + RF - PUSH, oy + (RF - c), CEIL - 0.8],
      };
      glyphs.push({ kind: "camera", polys: [ring(atW[op.side], 0.15, 8, [1, 0])], at: atW[op.side], color: cam, label: "out" });
    }
    return { quads, sublines, glyphs, wallDim: 0.2, label: "cameras + coverage" };
  }

  if (phaseId === "internet") {
    // a roof-mast STARLINK DISH + a LAN plate + the Cat6 run (panel → top plate → drop) + a ceiling Wi-Fi AP
    const lan = SHELL_COLOR.lan;
    // dish: a mast rising through the ceiling to a tilted dish face in the plenum (NE corner, clear sky)
    const mast: Vec3 = [ox + RF - 1, oy + RF - 1, CEIL], dishC: Vec3 = [mast[0], mast[1], RIDGE - 0.2];
    sublines.push({ pts: [mast, dishC], color: lan, w: 2 });
    glyphs.push({ kind: "dish", polys: [ring(dishC, 0.5, 10, [1, 0.4])], at: dishC, color: lan, label: "dish" });
    const plateCell = { gx: 5, gy: 0 };
    glyphs.push({ kind: "lan", polys: [wallQuad(plateCell.gx, plateCell.gy, OUTLET_AFF_FT, 0.45, 0.45, ox, oy)], at: W3(plateCell.gx, plateCell.gy, OUTLET_AFF_FT, ox, oy), color: lan, label: "LAN" });
    const panel = panelAt();
    const panelTop = W3(panel.gx, panel.gy, CEIL - 0.25, ox, oy), plateTop = W3(plateCell.gx, plateCell.gy, CEIL - 0.25, ox, oy);
    sublines.push({ pts: [W3(panel.gx, panel.gy, OUTLET_AFF_FT, ox, oy), panelTop, plateTop, W3(plateCell.gx, plateCell.gy, OUTLET_AFF_FT, ox, oy)], color: lan, dash: "2 2", w: 1.6 });
    const ap: Vec3 = [ox + 5, oy + 5, CEIL - 0.05];
    for (const r of [0.2, 0.35, 0.5]) glyphs.push({ kind: "ap", polys: [ring(ap, r, 6, [1, 0])], at: ap, color: lan, label: r === 0.2 ? "AP" : undefined });
    return { quads, sublines, glyphs, wallDim: 0.2, label: "dish + LAN drops" };
  }

  if (phaseId === "finish") {
    // THE FINISHED ROOM — walls stay solid (drywall, full wallDim null), a recoloured floor-finish plane, and base + crown
    // trim lines around the room. The set FIXTURES come from the phase draw (fixtures:true) via the furniture pass, so the
    // finished room is visibly MORE than the framing/insulation shell, not an empty box (Asar/Thoth P0).
    const trim = SHELL_COLOR.trim;
    quads.push(...boxFaces(ox, oy, 0, RF, RF, 0.04, SHELL_COLOR.floorFinish));             // floor-finish plane (flooring laid)
    const ring4 = (z: number): Vec3[][] => [
      [[ox + PUSH, oy + PUSH, z], [ox + RF - PUSH, oy + PUSH, z]], [[ox + RF - PUSH, oy + PUSH, z], [ox + RF - PUSH, oy + RF - PUSH, z]],
      [[ox + RF - PUSH, oy + RF - PUSH, z], [ox + PUSH, oy + RF - PUSH, z]], [[ox + PUSH, oy + RF - PUSH, z], [ox + PUSH, oy + PUSH, z]],
    ];
    for (const ln of ring4(0.33)) sublines.push({ pts: ln, color: trim, w: 2 });           // base trim
    for (const ln of ring4(CEIL - 0.25)) sublines.push({ pts: ln, color: trim, w: 1.4 });  // crown / ceiling trim
    return { quads, sublines, glyphs, wallDim: null, label: "drywall + flooring + trim" };
  }

  return { quads, sublines, glyphs, wallDim: null };
}

// a wall-plane quad spanning along [a,b] (world x for N/S, world y for W/E) from z0 to z1, pushed into the room.
function wallBay(side: Side, a: number, b: number, z0: number, z1: number, ox: number, oy: number): Vec3[] {
  if (side === "N") return [[ox + a, oy + RF - PUSH, z0], [ox + b, oy + RF - PUSH, z0], [ox + b, oy + RF - PUSH, z1], [ox + a, oy + RF - PUSH, z1]];
  if (side === "S") return [[ox + a, oy + PUSH, z0], [ox + b, oy + PUSH, z0], [ox + b, oy + PUSH, z1], [ox + a, oy + PUSH, z1]];
  if (side === "W") return [[ox + PUSH, oy + a, z0], [ox + PUSH, oy + b, z0], [ox + PUSH, oy + b, z1], [ox + PUSH, oy + a, z1]];
  return [[ox + RF - PUSH, oy + a, z0], [ox + RF - PUSH, oy + b, z0], [ox + RF - PUSH, oy + b, z1], [ox + RF - PUSH, oy + a, z1]];
}

// a 90° floor coverage fan from a ceiling-corner camera, pointing into the room (toward the far corner), radius r.
function fanWedge(cx: number, cy: number, r: number, east: boolean, north: boolean, n = 6): Vec3[] {
  const a0 = Math.atan2(north ? 1 : -1, east ? 1 : -1) - Math.PI / 4;  // aim the 90° cone at the room interior
  const poly: Vec3[] = [[cx, cy, 0.02]];
  for (let i = 0; i <= n; i++) { const a = a0 + (Math.PI / 2) * (i / n); poly.push([clampRoom(cx + Math.cos(a) * r), clampRoom(cy + Math.sin(a) * r), 0.02]); }
  return poly;
}
const clampRoom = (v: number) => Math.max(0, Math.min(RF, v));

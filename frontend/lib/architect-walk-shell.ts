// ARCHITECT-2525 · WALK SHELL PHASES (P4) — the minimum real layer for every non-MEP, non-framing build phase so NONE
// renders as an empty box (operator 2026-11-06 via MoT R3: "every build phase must show its REAL layer"). Foundation
// (slab · footings · rebar · anchor bolts), Roofing (truss bottom chords), Insulation (batts per bay), Security (corner
// cameras + coverage wedges), Internet (LAN plate · Cat6 drop · Wi-Fi AP). REUSE: studOffsetsFt + SHELL_COLOR + FRAME_COLOR
// (architect-phase-palette), boxFaces (solid-shade), ring (architect-walk-mep), the 10-ft cube ceiling (room-layout).
// Pure (no React/DOM) so the walk AND tests/architect-walk-shell.test.mjs read the SAME geometry.
import { boxFaces, type Quad, type Vec3 } from "./solid-shade";
import { studOffsetsFt, SHELL_COLOR, type StudGauge } from "./architect-phase-palette";
import { ring } from "./architect-walk-mep";
import { ROOM_FT, STOREY_FT } from "./room-layout";
import { OUTLET_AFF_FT, panelAt } from "./mep-runs";

const RF = ROOM_FT;                 // 10 — inner clear room edge
const CEIL = STOREY_FT;             // 10 — inner clear ceiling
const PUSH = 0.03;

export interface ShellSub { pts: Vec3[]; color: string; dash?: string; w?: number }
export interface ShellGlyph { kind: string; polys: Vec3[][]; lines?: Vec3[][]; at: Vec3; color: string; label?: string }
export interface WalkShell { quads: Quad[]; sublines: ShellSub[]; glyphs: ShellGlyph[]; wallDim: number | null; label?: string }
export interface ShellCtx { gauge?: StudGauge; openings?: { side: "N" | "S" | "W" | "E"; center: number; span: number }[]; kind?: string; nbS?: boolean; ox?: number; oy?: number }

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
    // truss bottom chords E–W at 24" o.c. (6) just under the ceiling; studs from P1 stay on (handled by the walkthrough)
    for (let s = 0; s <= RF; s += 2) sublines.push({ pts: [[ox, oy + s, CEIL - 0.05], [ox + RF, oy + s, CEIL - 0.05]], color: SHELL_COLOR.truss, w: 1.4 });
    return { quads, sublines, glyphs, wallDim: 0.15, label: "trusses + shell" };
  }

  if (phaseId === "insulation") {
    // one batt per stud bay on each wall plane (skip opening bays), drawn translucent in the glyph pass; studs stay on
    for (const side of ["N", "S", "W", "E"] as const) {
      const op = (ctx.openings ?? []).find((o) => o.side === side);
      for (let i = 0; i < offs.length - 1; i++) {
        const a = offs[i], b = offs[i + 1], mid = (a + b) / 2;
        if (op && mid > op.center - 1.9 && mid < op.center + 1.9) continue;               // skip the opening bay
        const quad = wallBay(side, a, b, 0.125, CEIL - 0.25, ox, oy);
        glyphs.push({ kind: "insulation", polys: [quad], at: [quad[0][0], quad[0][1], (0.125 + CEIL - 0.25) / 2], color: SHELL_COLOR.insulation });
      }
    }
    return { quads, sublines, glyphs, wallDim: 0.15, label: "R-20+5 ci envelope" };
  }

  if (phaseId === "security") {
    // 4 ceiling-corner camera domes + 90° floor coverage wedges; a door camera when there is a S neighbour
    const cam = SHELL_COLOR.camera;
    const corners: [number, number][] = [[0.3, 0.3], [RF - 0.3, 0.3], [0.3, RF - 0.3], [RF - 0.3, RF - 0.3]];
    for (const [cx, cy] of corners) {
      const at: Vec3 = [ox + cx, oy + cy, CEIL - 0.3];
      glyphs.push({ kind: "camera", polys: [ring(at, 0.2, 8, [1, 0])], at, color: cam });
      glyphs.push({ kind: "wedge", polys: [fanWedge(ox + cx, oy + cy, 6, cx < RF / 2, cy < RF / 2)], at: [ox + cx, oy + cy, 0.02], color: cam });
    }
    if (ctx.nbS) { const at: Vec3 = [ox + RF / 2, oy + PUSH, CEIL - 0.8]; glyphs.push({ kind: "camera", polys: [ring(at, 0.15, 8, [1, 0])], at, color: cam, label: "door" }); }
    return { quads, sublines, glyphs, wallDim: 0.2, label: "cameras + coverage" };
  }

  if (phaseId === "internet") {
    // LAN plate on the N wall + Cat6 run (panel → top plate → drop) + a ceiling Wi-Fi AP
    const lan = SHELL_COLOR.lan;
    const plateCell = { gx: 5, gy: 0 };
    glyphs.push({ kind: "lan", polys: [wallQuad(plateCell.gx, plateCell.gy, OUTLET_AFF_FT, 0.45, 0.45, ox, oy)], at: W3(plateCell.gx, plateCell.gy, OUTLET_AFF_FT, ox, oy), color: lan, label: "LAN" });
    const panel = panelAt();
    const panelTop = W3(panel.gx, panel.gy, CEIL - 0.25, ox, oy), plateTop = W3(plateCell.gx, plateCell.gy, CEIL - 0.25, ox, oy);
    sublines.push({ pts: [W3(panel.gx, panel.gy, OUTLET_AFF_FT, ox, oy), panelTop, plateTop, W3(plateCell.gx, plateCell.gy, OUTLET_AFF_FT, ox, oy)], color: lan, dash: "2 2", w: 1.6 });
    const ap: Vec3 = [ox + 5, oy + 5, CEIL - 0.05];
    for (const r of [0.2, 0.35, 0.5]) glyphs.push({ kind: "ap", polys: [ring(ap, r, 6, [1, 0])], at: ap, color: lan, label: r === 0.2 ? "AP" : undefined });
    return { quads, sublines, glyphs, wallDim: 0.2, label: "dish + LAN drops" };
  }

  return { quads, sublines, glyphs, wallDim: null };
}

// a wall-plane quad spanning along [a,b] (world x for N/S, world y for W/E) from z0 to z1, pushed into the room.
function wallBay(side: "N" | "S" | "W" | "E", a: number, b: number, z0: number, z1: number, ox: number, oy: number): Vec3[] {
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

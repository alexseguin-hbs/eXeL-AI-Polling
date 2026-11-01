/**
 * ARCHITECT-2525 · THE PHASE MENU (operator 2026-11-01: "Phase menu should only show relevant items for framing; show
 * 2x4 and 2x6 · remove non standard menus · the visual window is key focus like security 2525, all other menus support
 * this").
 * ============================================================================================================
 * ONE source for which palette the Room Designer shows when a construction phase is selected. The phase layer that a
 * phase DRAWS lives in architect-phases.ts (phaseDraw); this is its menu twin — what the operator can PLACE/pick in that
 * phase. No phase (the full design view) and the Interior Design phase keep the full furniture palette, exactly as the
 * designer always was; every construction phase shows only its own items, so the furniture clutter is removed and the
 * model window is the hero (the Security-2525 pattern).
 *
 * Pure data + pure helpers, no React → replayable and gate-checked (tests/architect-phase-palette.test.mjs).
 */
import type { AssetGroup } from "./room-objects";
import { ROOM_GRID } from "./room-objects";
import { phaseById } from "./architect-phases";

/** Which menu a phase shows in the Room Designer.
 *  - furniture : the full room palette (no phase selected, or the Interior Design staging phase) — unchanged.
 *  - framing   : the 2×4 / 2×6 stud selector — the framing members the operator named. No furniture.
 *  - fixtures  : the plumbing fixtures a water/sewer phase serves (the Bath + Kitchen groups).
 *  - openings  : doors + windows set into the framed openings (the Finish phase).
 *  - none      : no placement menu — the model is the focus; a one-line note names the phase's work. */
export type PhasePaletteMode = "furniture" | "framing" | "fixtures" | "openings" | "none";

/** The one mapping phase → menu. No phase, the Interior Design staging phase, or an UNKNOWN id → the full furniture
 *  palette (mirrors phaseDraw's "unknown → the full design view" fallback — a bad id never yields a blank menu). */
export function phasePaletteMode(phaseId: string | null | undefined): PhasePaletteMode {
  if (!phaseId || phaseId === "interior" || !phaseById(phaseId)) return "furniture";
  switch (phaseId) {
    case "framing": return "framing";
    case "plumbing":
    case "sewer": return "fixtures";
    case "finish": return "openings";
    default: return "none"; // foundation · roofing · electrical · internet · security · insulation
  }
}

/** Which furniture AssetGroups the palette may show in a mode. "all" = every group (unchanged). [] = no furniture. */
export function phaseAllowedGroups(mode: PhasePaletteMode): AssetGroup[] | "all" {
  switch (mode) {
    case "furniture": return "all";
    case "fixtures": return ["Kitchen", "Bath"]; // the plumbing fixtures a water/sewer phase serves
    case "openings": return ["Openings"];        // doors + windows set in the framed openings (Finish)
    default: return [];                           // framing + none show no furniture buttons
  }
}

/** The framing members the Framing phase offers — the 2×4 and 2×6 the operator named. Nominal lumber: a 2×4's actual
 *  section is 1.5"×3.5", a 2×6's 1.5"×5.5"; both frame at STUD_SPACING_IN on-centre. The depth is what reads into the
 *  room on the plan (a 2×6 wall reads deeper than a 2×4). */
export interface StudGauge { id: "2x4" | "2x6"; label: string; depthIn: number; thickIn: number; use: string; }
export const STUD_GAUGES: StudGauge[] = [
  { id: "2x4", label: "2×4", depthIn: 3.5, thickIn: 1.5, use: "interior / non-load walls" },
  { id: "2x6", label: "2×6", depthIn: 5.5, thickIn: 1.5, use: "exterior / load-bearing walls" },
];
/** Exterior / load-bearing is the home's envelope default (the Tiny Home + Cube exterior walls are 2×6). */
export const DEFAULT_STUD_GAUGE: StudGauge["id"] = "2x6";
export const STUD_SPACING_IN = 16; // studs on-centre

export function studGaugeById(id: string | null | undefined): StudGauge {
  return STUD_GAUGES.find((g) => g.id === id) ?? STUD_GAUGES.find((g) => g.id === DEFAULT_STUD_GAUGE)!;
}

/** One stud member mark on the plan (viewBox units, 0..100 for the 10-ft room). */
export interface StudTick { x1: number; y1: number; x2: number; y2: number; }

/**
 * The stud skeleton for a square room (sideFt feet) framed at STUD_SPACING_IN on-centre, in the 0..100 plan viewBox.
 * One short member tick per stud along each of the four walls, drawn from the wall line INTO the room by the gauge's
 * depth — so the model window shows the framing, and 2×6 reads deeper than 2×4. Pure + deterministic.
 */
export function studSkeleton(sideFt: number, gauge: StudGauge): {
  ticks: StudTick[]; perWall: number; thick: number; depth: number; spacingFt: number;
} {
  const u = 100 / sideFt;                 // viewBox units per foot (10 ft → 10 u/ft)
  const inset = 1;                         // the wall line sits ~0.1 ft (1 u) inside the viewBox edge
  const usable = 100 - 2 * inset;          // the span studs are laid along, inside the walls
  const stepFt = STUD_SPACING_IN / 12;     // 16" o.c. → 1.333 ft
  // stud offsets along the wall in feet: 0, step, 2·step, … then always the far corner
  const offs: number[] = [];
  for (let f = 0; f <= sideFt - 1e-9; f += stepFt) offs.push(f);
  if (offs[offs.length - 1] < sideFt - 1e-9) offs.push(sideFt);
  const depthU = (gauge.depthIn / 12) * u; // how far the stud reads into the room
  const along = (f: number) => inset + (f / sideFt) * usable; // keep every stud inside the wall rect
  const ticks: StudTick[] = [];
  for (const f of offs) {
    const p = along(f);
    ticks.push({ x1: p, y1: inset, x2: p, y2: inset + depthU });                 // N wall → stud down into room
    ticks.push({ x1: p, y1: 100 - inset, x2: p, y2: 100 - inset - depthU });     // S wall → stud up into room
    ticks.push({ x1: inset, y1: p, x2: inset + depthU, y2: p });                 // W wall → stud right into room
    ticks.push({ x1: 100 - inset, y1: p, x2: 100 - inset - depthU, y2: p });     // E wall → stud left into room
  }
  return { ticks, perWall: offs.length, thick: Math.max(0.6, (gauge.thickIn / 12) * u), depth: depthU, spacingFt: stepFt };
}

/** Convenience: the stud skeleton for the standard 10-ft Room Designer room at a gauge id. */
export function roomStudSkeleton(gaugeId: string | null | undefined) {
  return studSkeleton(ROOM_GRID, studGaugeById(gaugeId));
}

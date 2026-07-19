/**
 * ARCHITECT-2525 · MEP RUNS (P2) — deterministic mechanical/electrical/plumbing routing on the room grid.
 * =================================================================================================
 * Operator (IMG_7487/7488): every Design-Settings system is show/no-show; Plumbing splits into WATER SOURCE
 * + SEWER, Electric adds WIRING-to-outlets + specs (wire length · circuits · amps), Air Flow reports duct run
 * length. This pure module computes the ROUTES (grid polylines) + LENGTH SUMS from a room's placed fixtures +
 * outlet count, so BOTH the 2D/3D render (draw the polyline) and the sub-menu totals read one source of truth.
 *
 * Pure + deterministic (replay law): Manhattan L-routes (horizontal then vertical), fixed source anchors, no
 * Math.random, no I/O. 1 grid cell = 1 ft (matches ROOM_GRID = 10 → a 10'×10' room).
 */
import { ROOM_GRID, type ObjectKind, type PlacedObject } from "./room-objects";

export const MEP_GRID = ROOM_GRID; // 10 — one cell per foot

export interface MepPt { gx: number; gy: number }
export interface MepRun { from: MepPt; to: MepPt; path: MepPt[]; lengthFt: number }
export interface SystemRuns { runs: MepRun[]; totalFt: number }

const clampCell = (n: number) => Math.max(0, Math.min(MEP_GRID - 1, Math.round(n)));

// Fixed service anchors (deterministic) — where each system enters/leaves the room. Corners keep runs legible
// and never collide with a fixture footprint: water NW, sewer stack SE, electric panel SW, air handler NE.
export const MEP_SOURCE: Record<"water" | "sewer" | "panel" | "air", MepPt> = {
  water: { gx: 0, gy: 0 },
  sewer: { gx: MEP_GRID - 1, gy: MEP_GRID - 1 },
  panel: { gx: 0, gy: MEP_GRID - 1 },
  air:   { gx: MEP_GRID - 1, gy: 0 },
};

// Which placed objects need water supply / drain (DWV). Kitchen counter carries a sink → include it.
export const WATER_FIXTURES: ObjectKind[] = ["sink", "tub", "toilet", "washer", "counter"];
export const DRAIN_FIXTURES: ObjectKind[] = ["sink", "tub", "toilet", "washer", "counter"];

/** Manhattan L-route between two cells: run along X to the target column, then along Y. Deterministic. */
export function routeManhattan(from: MepPt, to: MepPt): MepPt[] {
  const a = { gx: clampCell(from.gx), gy: clampCell(from.gy) };
  const b = { gx: clampCell(to.gx), gy: clampCell(to.gy) };
  const path: MepPt[] = [{ ...a }];
  if (b.gx !== a.gx) path.push({ gx: b.gx, gy: a.gy }); // horizontal leg
  if (b.gy !== a.gy) path.push({ gx: b.gx, gy: b.gy }); // vertical leg
  return path;
}

/** Total length of a polyline in feet (1 cell = 1 ft; orthogonal segments). */
export function pathLengthFt(path: MepPt[]): number {
  let ft = 0;
  for (let i = 1; i < path.length; i++) ft += Math.abs(path[i].gx - path[i - 1].gx) + Math.abs(path[i].gy - path[i - 1].gy);
  return ft;
}

/** Build one run from a source to a target cell. */
function makeRun(from: MepPt, to: MepPt): MepRun {
  const path = routeManhattan(from, to);
  return { from: path[0], to: path[path.length - 1], path, lengthFt: pathLengthFt(path) };
}

/** Deterministic runs from a source anchor to every listed endpoint; sums the total length. */
export function runsToEndpoints(source: MepPt, endpoints: MepPt[]): SystemRuns {
  const runs = endpoints.map((e) => makeRun(source, e));
  return { runs, totalFt: runs.reduce((a, r) => a + r.lengthFt, 0) };
}

/** Endpoints for a fixture set from a room's placed objects (deduped by cell, stable order). */
export function fixtureEndpoints(objects: PlacedObject[], kinds: ObjectKind[]): MepPt[] {
  const seen = new Set<string>();
  const out: MepPt[] = [];
  for (const o of objects) {
    if (!kinds.includes(o.kind)) continue;
    const key = `${o.gx},${o.gy}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ gx: clampCell(o.gx), gy: clampCell(o.gy) });
  }
  return out;
}

/** WATER SUPPLY runs — from the water source to every water fixture. */
export function waterRuns(objects: PlacedObject[]): SystemRuns {
  return runsToEndpoints(MEP_SOURCE.water, fixtureEndpoints(objects, WATER_FIXTURES));
}

/** SEWER / DWV runs — from every drain fixture to the sewer stack. */
export function sewerRuns(objects: PlacedObject[]): SystemRuns {
  const eps = fixtureEndpoints(objects, DRAIN_FIXTURES);
  const runs = eps.map((e) => makeRun(e, MEP_SOURCE.sewer));
  return { runs, totalFt: runs.reduce((a, r) => a + r.lengthFt, 0) };
}

/**
 * Deterministic outlet positions — `count` outlets spread evenly around the room perimeter (clockwise from NW).
 * (room-objects has no placeable outlet; the per-room count drives their positions so wiring is reproducible.)
 */
export function outletPositions(count: number): MepPt[] {
  const n = Math.max(0, Math.min(24, Math.floor(count)));
  if (n === 0) return [];
  const g = MEP_GRID - 1;
  const perim: MepPt[] = [];
  for (let x = 0; x <= g; x++) perim.push({ gx: x, gy: 0 });        // top L→R
  for (let y = 1; y <= g; y++) perim.push({ gx: g, gy: y });        // right T→B
  for (let x = g - 1; x >= 0; x--) perim.push({ gx: x, gy: g });    // bottom R→L
  for (let y = g - 1; y >= 1; y--) perim.push({ gx: 0, gy: y });    // left B→T
  const step = perim.length / n;
  const out: MepPt[] = [];
  for (let i = 0; i < n; i++) out.push(perim[Math.floor(i * step) % perim.length]);
  return out;
}

/** ELECTRIC WIRING runs — from the panel to every outlet. */
export function wiringRuns(outletCount: number): SystemRuns {
  return runsToEndpoints(MEP_SOURCE.panel, outletPositions(outletCount));
}

/** ELECTRIC specs from the outlet count — total wire ft, circuits (≤8 outlets/circuit), and service amps. */
export function electricSpecs(outletCount: number): { wireFt: number; circuits: number; amps: number } {
  const n = Math.max(0, Math.floor(outletCount));
  const wireFt = wiringRuns(n).totalFt;
  const circuits = n === 0 ? 0 : Math.ceil(n / 8);   // NEC-style: cap ~8 general-purpose outlets per 15A circuit
  const amps = circuits * 15;
  return { wireFt, circuits, amps };
}

/** AIR FLOW duct runs — one register at the room centre, fed from the air handler. */
export function ductRuns(): SystemRuns {
  const centre: MepPt = { gx: Math.floor(MEP_GRID / 2), gy: Math.floor(MEP_GRID / 2) };
  return runsToEndpoints(MEP_SOURCE.air, [centre]);
}

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
import { ROOM_GRID, wallOf, wallOfObject, worldSpan, type ObjectKind, type PlacedObject, type Wall } from "./room-objects";

export const MEP_GRID = ROOM_GRID; // 10 — one cell per foot

export interface MepPt { gx: number; gy: number; kind?: ObjectKind }
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

// Which placed objects need water supply / drain (DWV). Kitchen counter carries a sink → include it; the shower is a
// default bath fixture and MUST be served (operator 2026-11-06, Enki).
export const WATER_FIXTURES: ObjectKind[] = ["sink", "tub", "shower", "toilet", "washer", "counter"];
export const DRAIN_FIXTURES: ObjectKind[] = ["sink", "tub", "shower", "toilet", "washer", "counter"];

// P2 PLUMBING — rough-in stub heights above finished floor (builder practice, "typical"): sink/counter stops ~20″,
// toilet supply 6″, washer box 42″, tub/shower mixing valve 48″. One source, reused by the walk + any spec readout.
export const STUB_AFF_FT: Partial<Record<ObjectKind, number>> = {
  sink: 1.67, counter: 1.67, toilet: 0.5, washer: 3.5, tub: 4.0, shower: 4.0,
};
// DWV drain slope — ¼″ per foot (IRC P3005.4.1), one source for the walk's falling-drain geometry.
export const DRAIN_SLOPE_FT_PER_FT = 1 / 48;

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
    out.push({ gx: clampCell(o.gx), gy: clampCell(o.gy), kind: o.kind }); // P2: carry the fixture kind (stub height, trap, mixer)
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

/** The perimeter cells a door's opening covers (R5c: no receptacle sits in a door opening — NEC 210.52 measures the wall
 *  space from the door's edge). Keyed "gx,gy". */
export function doorOpeningCells(objects: readonly PlacedObject[]): Set<string> {
  const g = MEP_GRID - 1, cells = new Set<string>();
  for (const o of objects) {
    if (o.kind !== "door") continue;
    const wall = wallOfObject(o), s = worldSpan(o), horiz = wall === "N" || wall === "S";
    const a1 = horiz ? s.x1 : s.y1, a2 = horiz ? s.x2 : s.y2;
    for (let a = Math.max(0, Math.floor(a1 + 1e-9)); a < Math.min(MEP_GRID, Math.ceil(a2 - 1e-9)); a++) {
      cells.add(horiz ? `${a},${wall === "N" ? 0 : g}` : `${wall === "W" ? 0 : g},${a}`);
    }
  }
  return cells;
}

/**
 * Deterministic outlet positions — `count` outlets spread evenly around the room perimeter (clockwise from NW).
 * (room-objects has no placeable outlet; the per-room count drives their positions so wiring is reproducible.)
 * With the room's `objects`, the cells under a door opening are skipped (R5c) — the spread runs over the wall that is left.
 */
export function outletPositions(count: number, objects?: readonly PlacedObject[]): MepPt[] {
  const n = Math.max(0, Math.min(24, Math.floor(count)));
  if (n === 0) return [];
  const g = MEP_GRID - 1;
  const perim: MepPt[] = [];
  for (let x = 0; x <= g; x++) perim.push({ gx: x, gy: 0 });        // top L→R
  for (let y = 1; y <= g; y++) perim.push({ gx: g, gy: y });        // right T→B
  for (let x = g - 1; x >= 0; x--) perim.push({ gx: x, gy: g });    // bottom R→L
  for (let y = g - 1; y >= 1; y--) perim.push({ gx: 0, gy: y });    // left B→T
  const blocked = objects && objects.length ? doorOpeningCells(objects) : null;
  const wall = blocked ? perim.filter((p) => !blocked.has(`${p.gx},${p.gy}`)) : perim;
  const ring = wall.length ? wall : perim;
  const step = ring.length / n;
  const out: MepPt[] = [];
  for (let i = 0; i < n; i++) out.push(ring[Math.floor(i * step) % ring.length]);
  return out;
}

/** ELECTRIC WIRING runs — from the panel to every outlet. */
/** The service panel's cell — the SW anchor, or (R5c) the first free cell up the W wall when a door opening covers it
 *  (Layout A′'s door-1 spans x 0–3 on the S wall, so the panel moves to (0,8)). */
export function panelAt(objects?: readonly PlacedObject[]): MepPt {
  if (!objects || !objects.length) return MEP_SOURCE.panel;
  const blocked = doorOpeningCells(objects);
  let p = { ...MEP_SOURCE.panel };
  while (blocked.has(`${p.gx},${p.gy}`) && p.gy > 0) p = { gx: p.gx, gy: p.gy - 1 };
  return p;
}
export function wiringRuns(outletCount: number, objects?: readonly PlacedObject[]): SystemRuns {
  return runsToEndpoints(panelAt(objects), outletPositions(outletCount, objects));
}

/**
 * FIX-4 — MEP IN THE WALLS: each outlet as a WALL-MOUNTED marker (operator: "not sure how to see outlets in walls").
 * An outlet sits on the perimeter wall it's nearest to, at standard receptacle height (~1.5 ft AFF), so the 2D plan
 * can draw a mark on that wall and the 3D voxel can draw it on the wall FACE at height — not a floor dot.
 */
export const OUTLET_AFF_FT = 1.5; // standard receptacle height above finished floor
export interface OutletMarker { gx: number; gy: number; wall: Wall; affFt: number }
export function outletMarkers(outletCount: number, objects?: readonly PlacedObject[]): OutletMarker[] {
  return outletPositions(outletCount, objects).map((p) => ({ gx: p.gx, gy: p.gy, wall: wallOf(p.gx, p.gy), affFt: OUTLET_AFF_FT }));
}

/** ELECTRIC specs from the outlet count — total wire ft, circuits (≤8 outlets/circuit), and service amps. */
export function electricSpecs(outletCount: number, objects?: readonly PlacedObject[]): { wireFt: number; circuits: number; amps: number } {
  const n = Math.max(0, Math.floor(outletCount));
  const wireFt = wiringRuns(n, objects).totalFt;
  const circuits = n === 0 ? 0 : Math.ceil(n / 8);   // NEC-style: cap ~8 general-purpose outlets per 15A circuit
  const amps = circuits * 15;
  return { wireFt, circuits, amps };
}

/** Rooms where a return-air grille is prohibited (IRC M1602.2): bath, closet, kitchen, storage/laundry. */
export const NO_RETURN_KINDS = new Set(["B", "C", "K", "S"]);

/** AIR FLOW duct runs — one register at the room centre, fed from the air handler via a trunk (N-wall leg) + branch
 *  (the drop to the register). P3: the SAME single run/totalFt (byte-identical — the Design-Settings "duct run length"
 *  never drifts) PLUS the parts the walk draws (trunk, branch, register, VCD, return grille, air handler). */
export interface DuctSystem extends SystemRuns { trunk: MepPt[]; branch: MepPt[]; register: MepPt; vcd: MepPt; returnGrille: MepPt | null; airHandler: boolean }
export function ductRuns(objects?: readonly PlacedObject[], kind?: string): DuctSystem {
  const centre: MepPt = { gx: Math.floor(MEP_GRID / 2), gy: Math.floor(MEP_GRID / 2) }; // (5,5) register
  const base = runsToEndpoints(MEP_SOURCE.air, [centre]);                                // unchanged: 1 run, air→centre
  const path = base.runs[0].path;                                                        // [(9,0),(5,0),(5,5)]
  const trunk = path.slice(0, 2);                                                         // the N-wall leg
  const branch = path.slice(1);                                                           // the drop to the register
  const vcd: MepPt = { gx: centre.gx, gy: 1 };                                            // in the branch, 1 ft off the trunk (IMC 603.18)
  // return grille on the S wall (gy = MEP_GRID-1), skipping door openings — none in the prohibited rooms (M1602.2)
  let returnGrille: MepPt | null = null;
  if (!kind || !NO_RETURN_KINDS.has(kind)) {
    const g = MEP_GRID - 1, blocked = objects && objects.length ? doorOpeningCells(objects) : new Set<string>();
    for (let gx = 2; gx <= g; gx++) { if (!blocked.has(`${gx},${g}`)) { returnGrille = { gx, gy: g }; break; } }
    if (!returnGrille) returnGrille = { gx: 2, gy: g };
  }
  return { ...base, trunk, branch, register: centre, vcd, returnGrille, airHandler: kind === "S" };
}

/** ONE source of the MEP RUN colours — the 2D plan, the 3D voxel and the first-person walk all read this so a run's
 *  colour never drifts between views (operator 2026-11-06: "see the wires"). The Design PhaseBar chip is intentionally
 *  the rainbow phase colour, NOT this. Water cyan · sewer green · wiring gold · duct sky. */
// P2/P3 adds hot (red — the plan's blue/cold + red/hot convention; a repo decision, not ISA), vent (sewer green, drawn
// dashed), and ductReturn (duct sky, drawn dashed). Existing keys unchanged (Release Process #6 — shipped colours stay).
export const MEP_COLOR = { water: "#19c8cf", sewer: "#22c55e", wiring: "#ffd400", duct: "#38bdf8", hot: "#f87171", vent: "#22c55e", ductReturn: "#38bdf8" } as const;

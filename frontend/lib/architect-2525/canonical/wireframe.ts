// SPECS / ARCHITECT-2525 §XXIII / §37.01 — Vector Glass adapter. The pipeline is canonical Runtime →
// WireframeAdapter → Line[] → renderer; the renderer owns NO geometry. PLAN (top-down) and VECTOR-3D (an
// isometric projection) only. Every line is a derived SPACE BOUNDARY — never a Wall/Door/Window entity,
// never an extruded wall mesh (§22/§XXIV hard stops). Pure + framework-free; the UI renderer just draws
// the Line[] it is handed.
//
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-wireframe.test.mjs

import { UM_PER_10FT } from "./units";
import type { ArchitectProject, SpaceEntity, StoreyEntity } from "./types";

export type ViewMode = "PLAN" | "VECTOR3D";
export type LineKind = "space" | "grid" | "north" | "selection";

/** A drawn boundary line in view coordinates (µm-derived); the renderer scales/translates to pixels. */
export interface Line {
  a: [number, number];
  b: [number, number];
  kind: LineKind;
  space_id?: string;
  bay_code?: string;
}

export interface WireframeScene {
  view: ViewMode;
  lines: Line[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface WireframeOpts {
  view?: ViewMode;
  selectedId?: string | null;
  grid?: boolean;     // a faint reference grid at 10 ft (default on)
  north?: boolean;    // a north indicator (default on)
}

// Isometric projection — PRESENTATION only (never canonical). 30° axonometric.
const ISO_COS = Math.cos(Math.PI / 6);
const ISO_SIN = Math.sin(Math.PI / 6);
function iso(x: number, y: number, z: number): [number, number] {
  // +X East, +Y North, +Z Up → screen (right, down). y grows up on screen, so negate for a down-y canvas.
  return [(x - y) * ISO_COS, (x + y) * ISO_SIN - z];
}
function plan(x: number, y: number): [number, number] {
  return [x, y]; // top-down; the renderer flips Y if it wants north-up
}

const spacesOf = (p: ArchitectProject) => p.entities.filter((e): e is SpaceEntity => e.entity_type === "SPACE");
const storeyHeight = (p: ArchitectProject): number => {
  const s = p.entities.find((e) => e.entity_type === "STOREY") as StoreyEntity | undefined;
  return s?.height_um ?? UM_PER_10FT;
};

/** The four PLAN boundary lines of one Space rectangle, in seed-index corner order. */
function planRect(s: SpaceEntity, kind: LineKind): Line[] {
  const x0 = s.x_um, y0 = s.y_um, x1 = s.x_um + s.width_um, y1 = s.y_um + s.depth_um;
  const c: [number, number][] = [plan(x0, y0), plan(x1, y0), plan(x1, y1), plan(x0, y1)];
  const out: Line[] = [];
  for (let i = 0; i < 4; i++) out.push({ a: c[i], b: c[(i + 1) % 4], kind, space_id: s.entity_id, bay_code: s.bay_code });
  return out;
}

/** The VECTOR-3D boundary box of one Space: floor rect + ceiling rect + four verticals (Space boundaries, not walls). */
function iso3dBox(s: SpaceEntity, h: number, kind: LineKind): Line[] {
  const x0 = s.x_um, y0 = s.y_um, x1 = s.x_um + s.width_um, y1 = s.y_um + s.depth_um, z0 = s.z_um, z1 = s.z_um + h;
  const f = [iso(x0, y0, z0), iso(x1, y0, z0), iso(x1, y1, z0), iso(x0, y1, z0)];
  const t = [iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y1, z1), iso(x0, y1, z1)];
  const out: Line[] = [];
  for (let i = 0; i < 4; i++) {
    out.push({ a: f[i], b: f[(i + 1) % 4], kind, space_id: s.entity_id, bay_code: s.bay_code }); // floor
    out.push({ a: t[i], b: t[(i + 1) % 4], kind, space_id: s.entity_id, bay_code: s.bay_code }); // ceiling
    out.push({ a: f[i], b: t[i], kind, space_id: s.entity_id, bay_code: s.bay_code });             // vertical
  }
  return out;
}

/**
 * SPECS §XXIII — project the canonical Runtime to a Line[] scene for PLAN or VECTOR-3D. Selected Space
 * boundaries are kind:'selection'; the optional grid/north are reference lines. Pure.
 */
export function toWireframe(project: ArchitectProject, opts: WireframeOpts = {}): WireframeScene {
  const view: ViewMode = opts.view ?? "PLAN";
  const grid = opts.grid ?? true;
  const north = opts.north ?? true;
  const h = storeyHeight(project);
  const lines: Line[] = [];

  // reference grid at 10 ft, across the Space extent (PLAN only — a VECTOR-3D grid would just be noise here)
  if (grid && view === "PLAN") {
    const xs = spacesOf(project);
    if (xs.length) {
      const minX = Math.min(...xs.map((s) => s.x_um)), maxX = Math.max(...xs.map((s) => s.x_um + s.width_um));
      const minY = Math.min(...xs.map((s) => s.y_um)), maxY = Math.max(...xs.map((s) => s.y_um + s.depth_um));
      for (let x = minX; x <= maxX; x += UM_PER_10FT) lines.push({ a: plan(x, minY), b: plan(x, maxY), kind: "grid" });
      for (let y = minY; y <= maxY; y += UM_PER_10FT) lines.push({ a: plan(minX, y), b: plan(maxX, y), kind: "grid" });
    }
  }

  for (const s of spacesOf(project)) {
    const kind: LineKind = opts.selectedId && s.entity_id === opts.selectedId ? "selection" : "space";
    lines.push(...(view === "PLAN" ? planRect(s, kind) : iso3dBox(s, h, kind)));
  }

  // north indicator — a short line toward +Y (north), anchored at the scene origin
  if (north) {
    const tip = view === "PLAN" ? plan(0, UM_PER_10FT) : iso(0, UM_PER_10FT, 0);
    const base = view === "PLAN" ? plan(0, 0) : iso(0, 0, 0);
    lines.push({ a: base, b: tip, kind: "north" });
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const l of lines) for (const p of [l.a, l.b]) {
    if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
  }
  if (!Number.isFinite(minX)) { minX = minY = 0; maxX = maxY = 0; }
  return { view, lines, bounds: { minX, minY, maxX, maxY } };
}

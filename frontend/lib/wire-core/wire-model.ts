// WIREFRAME-CORE · the canonical model (U-WF-01/02/04/06/08/09/10/12).
//
// ONE model is the truth: the browser renders it, and scripts/wire-export.mjs turns the SAME object into
// .py / .obj / .cs (Unity) / .cpp (Unreal). A change is therefore visible in all five or in none — which is
// what "one step conversion we create from scratch (to ensure Vision-2525 intent)" has to mean to be real.
//
// THE MESH IS EDGES. There are no faces in this file and there is no field to put one in (operator: "edge wire
// frames only"). Labels, targets and photographs are OVERLAYS and never enter the mesh (U-WF-04), so a
// renderer can drop every overlay and still draw a correct world.
//
// Units are metres, always. The frame is ENU (east, north, up) about a lat/lon origin, or a body frame for a
// vehicle/mount. No pixels, no degrees, no feet live in a model — those are render- and UI-side concerns.
import { sha256Hex } from "./sha256";
import type { ColorRole } from "./palette";

export type Vec3 = [number, number, number];          // [east, north, up] metres
export type Edge = [number, number];                  // vertex index pair
export type GroupKind = "extrusion" | "polyline" | "ring" | "tree" | "contour" | "frustum" | "ngon" | "instanced" | "sensor-edges";
export type OverlayKind = "label" | "door" | "window" | "target" | "photo" | "mount" | "hud";
/** LOD 0 = always drawn · 1 = dropped first · 2 = detail, only when compute allows. */
export type Lod = 0 | 1 | 2;

/** U-WF-06 replay packet — what this element is, where it came from, how much it is trusted. */
export interface ReplayMeta {
  source: string;                       // "hand-authored" | "osm" | "dem" | "sensor" | "derived"
  confidence: "low" | "medium" | "high";
  at?: number;                          // ms epoch, supplied by the caller — never Date.now() in here
  classification?: string;              // "training" for everything this domain ships
  replayId?: string;
}

export interface WireGroup {
  id: string;
  kind: GroupKind;
  role: ColorRole;                      // one of the 13 — the type makes a 14th unspellable
  edge0: number;                        // inclusive index into edges[]
  edgeN: number;                        // exclusive
  lod: Lod;
  replay?: ReplayMeta;
}

export interface WireOverlay {
  id: string;
  kind: OverlayKind;
  at: Vec3;
  role: ColorRole;
  ref: "AGL" | "MSL";                   // a height is meaningless without its reference (Security's law)
  textKey?: string;                     // a lexicon key — never a literal string
  data?: Record<string, number | string>;
}

export type Frame =
  | { kind: "enu"; origin: { lat: number; lon: number; mslM: number }; up: "z" }
  | { kind: "body"; up: "z"; forward: "x" };

export interface WireMeta {
  id: string;
  name: string;
  version: string;                      // domain version, e.g. "00.00"
  revision: string;                     // domain revision, e.g. "0.001"
  generator: string;
  stamp: string;                        // U-WF-12, supplied by the caller (build-time env, never a clock)
  source?: string;
}

export interface WireModel {
  meta: WireMeta;
  units: "m";
  frame: Frame;
  vertices: Vec3[];
  edges: Edge[];
  groups: WireGroup[];
  overlays: WireOverlay[];
}

// ── Builder ──────────────────────────────────────────────────────────────────────────────────────
const Q = 1e6;                                        // 1 µm quantisation — the shared grid for dedup AND hashing
const qkey = (p: Vec3) => `${Math.round(p[0] * Q)},${Math.round(p[1] * Q)},${Math.round(p[2] * Q)}`;

/**
 * Accumulates vertices (deduplicated) and edges, and records each group's contiguous edge slice.
 * Contiguity is the point: a renderer draws a group by slicing edges[edge0..edgeN] with no lookup table.
 */
export class WireBuilder {
  private verts: Vec3[] = [];
  private edgs: Edge[] = [];
  private idx = new Map<string, number>();
  private grps: WireGroup[] = [];
  private ovls: WireOverlay[] = [];
  private open: { id: string; kind: GroupKind; role: ColorRole; lod: Lod; replay?: ReplayMeta; edge0: number } | null = null;

  /** Add (or reuse) a vertex; returns its index. */
  v(p: Vec3): number {
    if (!p.every((n) => Number.isFinite(n))) throw new Error(`WireBuilder.v: non-finite vertex ${JSON.stringify(p)}`);
    const k = qkey(p);
    const hit = this.idx.get(k);
    if (hit !== undefined) return hit;
    this.verts.push([p[0], p[1], p[2]]);
    const i = this.verts.length - 1;
    this.idx.set(k, i);
    return i;
  }
  /** Add a segment between two points (or indices). Zero-length segments are skipped, not stored. */
  seg(a: Vec3 | number, b: Vec3 | number): void {
    const ia = typeof a === "number" ? a : this.v(a);
    const ib = typeof b === "number" ? b : this.v(b);
    if (ia === ib) return;
    this.edgs.push([ia, ib]);
  }
  /** Connect a run of points; `closed` returns to the first. */
  path(points: Vec3[], closed = false): void {
    for (let i = 1; i < points.length; i++) this.seg(points[i - 1], points[i]);
    if (closed && points.length > 2) this.seg(points[points.length - 1], points[0]);
  }
  group(id: string, kind: GroupKind, role: ColorRole, lod: Lod, fn: () => void, replay?: ReplayMeta): void {
    if (this.open) throw new Error(`WireBuilder.group: "${id}" opened inside "${this.open.id}" — groups are slices, they do not nest`);
    this.open = { id, kind, role, lod, replay, edge0: this.edgs.length };
    try { fn(); } finally {
      const o = this.open!; this.open = null;
      if (this.edgs.length > o.edge0) this.grps.push({ id: o.id, kind: o.kind, role: o.role, lod: o.lod, replay: o.replay, edge0: o.edge0, edgeN: this.edgs.length });
    }
  }
  overlay(o: WireOverlay): void { this.ovls.push(o); }
  get edgeCount(): number { return this.edgs.length; }

  build(meta: WireMeta, frame: Frame): WireModel {
    const m: WireModel = { meta, units: "m", frame, vertices: this.verts, edges: this.edgs, groups: this.grps, overlays: this.ovls };
    validateWireModel(m);
    return m;
  }
}

// ── Validation — refuse, never repair ────────────────────────────────────────────────────────────
export function validateWireModel(m: WireModel): void {
  const bad = (why: string) => { throw new Error(`WireModel ${m?.meta?.id ?? "?"}: ${why}`); };
  if (m.units !== "m") bad(`units must be "m"`);
  if (!Array.isArray(m.vertices) || !Array.isArray(m.edges)) bad("vertices and edges must be arrays");
  if ((m as unknown as { faces?: unknown }).faces !== undefined) bad("faces are forbidden — the mesh is edges only");
  for (let i = 0; i < m.vertices.length; i++) {
    const v = m.vertices[i];
    if (!Array.isArray(v) || v.length !== 3 || !v.every((n) => Number.isFinite(n))) bad(`vertex ${i} is not a finite [e,n,u]`);
  }
  for (let i = 0; i < m.edges.length; i++) {
    const [a, b] = m.edges[i] ?? [];
    if (!Number.isInteger(a) || !Number.isInteger(b)) bad(`edge ${i} is not an index pair`);
    if (a < 0 || b < 0 || a >= m.vertices.length || b >= m.vertices.length) bad(`edge ${i} points outside vertices`);
    if (a === b) bad(`edge ${i} is degenerate`);
  }
  let cursor = 0;
  for (const g of m.groups) {
    if (g.edge0 !== cursor) bad(`group "${g.id}" starts at ${g.edge0}, expected ${cursor} — groups must be contiguous slices`);
    if (g.edgeN <= g.edge0 || g.edgeN > m.edges.length) bad(`group "${g.id}" has an empty or out-of-range slice`);
    cursor = g.edgeN;
  }
  if (cursor !== m.edges.length) bad(`${m.edges.length - cursor} edges belong to no group`);
  for (const o of m.overlays) {
    if (!o.at.every((n) => Number.isFinite(n))) bad(`overlay "${o.id}" has a non-finite position`);
    if ((o as unknown as { edges?: unknown }).edges !== undefined) bad(`overlay "${o.id}" carries edges — overlays are never part of the mesh (U-WF-04)`);
  }
}

// ── Determinism (U-WF-08) ────────────────────────────────────────────────────────────────────────
/**
 * A hash of the GEOMETRY, independent of vertex ordering or index numbering: every segment is written as
 * its two endpoints in metres (µm-quantised), the endpoints ordered, then the whole list sorted. Two models
 * that draw the same picture hash the same even if one deduplicated its vertices and the other did not —
 * which is exactly what makes the browser model and the per-segment OBJ comparable.
 */
export function canonicalSegments(m: WireModel): string[] {
  const f = (n: number) => (Math.round(n * Q) / Q).toFixed(6);
  const out = m.edges.map(([a, b]) => {
    const p = m.vertices[a], q = m.vertices[b];
    const A = `${f(p[0])},${f(p[1])},${f(p[2])}`, B = `${f(q[0])},${f(q[1])},${f(q[2])}`;
    return A <= B ? `${A}|${B}` : `${B}|${A}`;
  });
  out.sort();
  return out;
}
export const canonicalHash = (m: WireModel): string => sha256Hex(canonicalSegments(m).join("\n"));

// ── LOD (U-WF-09: a cap is never silent) ─────────────────────────────────────────────────────────
export interface LodReport { kept: number; dropped: number; maxLod: Lod; byGroup: { id: string; edges: number; kept: boolean }[] }
/** Select the groups a tier may draw. Reports what it dropped — silence is the defect this prevents. */
export function selectLod(m: WireModel, maxLod: Lod, segmentBudget = Infinity): LodReport {
  let kept = 0, dropped = 0;
  const byGroup = m.groups.map((g) => {
    const n = g.edgeN - g.edge0;
    const fits = g.lod <= maxLod && kept + n <= segmentBudget;
    if (fits) kept += n; else dropped += n;
    return { id: g.id, edges: n, kept: fits };
  });
  return { kept, dropped, maxLod, byGroup };
}

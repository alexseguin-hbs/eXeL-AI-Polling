// THE ARENA — the Texas Capitol lawn as one WireModel, built from the single editable source
// docs/drone-2525/drone-2525.v00.00.json. Edges only, 13 colours only, every element carrying where it came
// from (U-WF-06) so hand-authored geometry can be told apart from a map extract at a glance and in the HUD.
//
// LOD is chosen so the poorest head still reads the world: buildings and doors at 0 (always drawn), roads,
// contours and turrets at 1, trees and windows at 2. That ordering is the difference between a Pi seeing a
// city block and a Pi seeing nothing.
import { WireBuilder, type WireModel, type Lod } from "@/lib/wire-core/wire-model";
import { extrude, tree, polyline3, ngon, ring, type EN } from "@/lib/wire-core/primitives";
import { SEMANTIC } from "@/lib/wire-core/palette";
import { makeGroundSampler, isoContours, type ElevationField, type ArenaOrigin } from "./arena-frame";

export interface DomainBuilding {
  id: string; label: string; footprint: EN[]; heightM: number;
  doors: { at: EN; w: number; h: number }[];
  windows?: { at: EN; w: number; h: number; sill: number }[];
  source: string; confidence: "low" | "medium" | "high"; note?: string;
}
export interface DomainTreeRow { id: string; label: string; from: EN; to: EN; count: number; trunkH: number; canopyR: number; canopyH: number; source: string; confidence: "low" | "medium" | "high" }
export interface DomainRoad { id: string; label: string; tier: number; p: EN[] }
export interface DomainTurret { id: string; label: string; at: EN; heightM: number; homeAz: number; homeEl: number }
export interface DomainSource {
  project: { version: string; revision: string; stampPrefix: string };
  arena: { origin: ArenaOrigin; radiusM: number; maxAltitudeM: number; elevation: ElevationField; demSource: string };
  buildings: DomainBuilding[];
  treeRows: DomainTreeRow[];
  roads: DomainRoad[];
  turrets: DomainTurret[];
}

export interface ArenaOptions {
  /** Curve resolution the fidelity tier is willing to pay for (TIERS[tier].ngonSides). */
  ngonSides?: number;
  /** Contour interval in metres; 0 omits contours entirely. */
  contourStepM?: number;
  stamp?: string;
}

/** A door in world space, ready to become a target — position, the wall normal it faces, and its owner. */
export interface ArenaDoor { id: string; buildingId: string; label: string; at: [number, number, number]; normal: [number, number]; w: number; h: number }

export interface Arena { model: WireModel; doors: ArenaDoor[]; ground: (e: number, n: number) => number }

const lerpEN = (a: EN, b: EN, t: number): EN => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Outward normal of the footprint edge nearest a point — which way a door faces. */
function wallNormal(fp: EN[], at: EN): [number, number] {
  let best = { d: Infinity, nx: 0, ny: 1 };
  for (let i = 0; i < fp.length; i++) {
    const a = fp[i], b = fp[(i + 1) % fp.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if (L < 1e-6) continue;
    const t = Math.max(0, Math.min(1, ((at[0] - a[0]) * dx + (at[1] - a[1]) * dy) / (L * L)));
    const q = lerpEN(a, b, t), d = Math.hypot(at[0] - q[0], at[1] - q[1]);
    if (d < best.d) best = { d, nx: dy / L, ny: -dx / L };     // right-hand normal of a CCW ring points out
  }
  return [best.nx, best.ny];
}

export function buildArena(src: DomainSource, opts: ArenaOptions = {}): Arena {
  const sides = opts.ngonSides ?? 13;
  const step = opts.contourStepM ?? 2;
  const ground = makeGroundSampler(src.arena.elevation);
  const b = new WireBuilder();
  const doors: ArenaDoor[] = [];
  const g = (e: number, n: number) => ground(e, n);

  // ── contours — the lawn's rise, drawn as iso-lines at their true height ──
  if (step > 0) {
    const flat = src.arena.elevation.grid.flat();
    const lo = Math.ceil(Math.min(...flat) / step) * step, hi = Math.max(...flat);
    const levels: number[] = [];
    for (let L = lo; L <= hi; L += step) levels.push(L);
    const iso = isoContours(src.arena.elevation, levels);
    if (iso.length) {
      b.group("arena.contours", "contour", SEMANTIC.contour, 1 as Lod, () => {
        for (const { level, segs } of iso) for (const [p, q] of segs) b.seg([p[0], p[1], level], [q[0], q[1], level]);
      }, { source: src.arena.demSource, confidence: "low", classification: "training" });
    }
  }

  // ── roads — draped on the ground so a street climbs the rise like the real one ──
  b.group("arena.roads", "polyline", SEMANTIC.road, 1 as Lod, () => {
    for (const r of src.roads) {
      const dense: EN[] = [];
      for (let i = 0; i < r.p.length - 1; i++) {
        const a = r.p[i], c = r.p[i + 1];
        const n = Math.max(2, Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / 40));
        for (let k = 0; k < n; k++) dense.push(lerpEN(a, c, k / n));
      }
      dense.push(r.p[r.p.length - 1]);
      polyline3(b, dense, (p) => g(p[0], p[1]) + 0.05);
    }
  }, { source: "hand-authored", confidence: "low", classification: "training" });

  // ── buildings — footprint extrusion + door openings (U-WF-10), one group each so a hit can be attributed ──
  for (const bl of src.buildings) {
    const base = Math.min(...bl.footprint.map((p) => g(p[0], p[1])));   // sit on the lowest corner, never float
    b.group(`bld.${bl.id}`, "extrusion", SEMANTIC.building, 0 as Lod, () => {
      extrude(b, bl.footprint, base, bl.heightM, { doors: bl.doors, windows: bl.windows });
    }, { source: bl.source, confidence: bl.confidence, classification: "training" });

    for (let i = 0; i < bl.doors.length; i++) {
      const d = bl.doors[i];
      const id = `door.${bl.id}.${i + 1}`;
      const nrm = wallNormal(bl.footprint, d.at);
      // the door outline again, in its own group and colour — this is the thing the game asks you to tag
      b.group(id, "ring", SEMANTIC.door, 0 as Lod, () => {
        const half = d.w / 2, along: EN = [-nrm[1], nrm[0]];
        const p0: EN = [d.at[0] - along[0] * half, d.at[1] - along[1] * half];
        const p1: EN = [d.at[0] + along[0] * half, d.at[1] + along[1] * half];
        const u0 = base + 0.02, u1 = base + d.h;
        b.path([[p0[0], p0[1], u0], [p1[0], p1[1], u0], [p1[0], p1[1], u1], [p0[0], p0[1], u1]], true);
      }, { source: bl.source, confidence: bl.confidence, classification: "training" });
      doors.push({ id, buildingId: bl.id, label: bl.label, at: [d.at[0], d.at[1], base + d.h / 2], normal: nrm, w: d.w, h: d.h });
      b.overlay({ id: `ov.${id}`, kind: "door", at: [d.at[0], d.at[1], base + d.h], role: SEMANTIC.door, ref: "MSL", textKey: "drone.target.door", data: { building: bl.label } });
    }
    b.overlay({ id: `ov.bld.${bl.id}`, kind: "label", at: [bl.footprint[0][0], bl.footprint[0][1], base + bl.heightM], role: SEMANTIC.building, ref: "MSL", data: { label: bl.label, source: bl.source, confidence: bl.confidence } });
  }

  // ── the Capitol dome, as an n-gon stack: the tier decides how round it is ──
  const cap = src.buildings.find((x) => x.id === "capitol");
  if (cap) {
    const base = Math.min(...cap.footprint.map((p) => g(p[0], p[1])));
    b.group("bld.capitol.dome", "ngon", SEMANTIC.building, 1 as Lod, () => {
      const cx: EN = [0, 8], r = 15, drum = base + cap.heightM, apex = base + 94;   // 94 m — the real dome apex
      const rings = 4;
      let prev: EN[] | null = null;
      for (let k = 0; k <= rings; k++) {
        const t = k / rings;
        const rr = r * Math.cos((t * Math.PI) / 2);
        const u = drum + (apex - drum) * t;
        if (rr < 0.4) { if (prev) for (const p of prev) b.seg([p[0], p[1], u - (apex - drum) / rings], [cx[0], cx[1], apex]); break; }
        const pts = ngon(cx, rr, sides);
        ring(b, pts, u);
        if (prev) for (let i = 0; i < pts.length; i++) b.seg([prev[i][0], prev[i][1], u - (apex - drum) / rings], [pts[i][0], pts[i][1], u]);
        prev = pts;
      }
    }, { source: "hand-authored", confidence: "low", classification: "training" });
  }

  // ── turrets — a mast and a head; the gimbal draws separately because it moves ──
  b.group("arena.turrets", "polyline", SEMANTIC.mount, 1 as Lod, () => {
    for (const t of src.turrets) {
      const u = g(t.at[0], t.at[1]);
      b.seg([t.at[0], t.at[1], u], [t.at[0], t.at[1], u + t.heightM]);
      ring(b, ngon(t.at, 1.2, Math.min(sides, 8)), u + t.heightM);
    }
  }, { source: "hand-authored", confidence: "low", classification: "training" });

  // ── trees — detail, dropped first on a poor head ──
  b.group("arena.trees", "tree", SEMANTIC.tree, 2 as Lod, () => {
    for (const row of src.treeRows) {
      for (let i = 0; i < row.count; i++) {
        const t = row.count === 1 ? 0 : i / (row.count - 1);
        const p = lerpEN(row.from, row.to, t);
        tree(b, p, g(p[0], p[1]), row.trunkH, row.canopyR, row.canopyH, Math.min(sides, 6));
      }
    }
  }, { source: "hand-authored", confidence: "low", classification: "training" });

  const model = b.build({
    id: "capitol-arena",
    name: "DRONE-2525 · Texas Capitol arena",
    version: src.project.version,
    revision: src.project.revision,
    generator: "lib/drone-2525/arena-model.ts",
    stamp: opts.stamp ?? `${src.project.stampPrefix}-unstamped`,
    source: "docs/drone-2525/drone-2525.v00.00.json",
  }, { kind: "enu", origin: src.arena.origin, up: "z" });

  return { model, doors, ground };
}

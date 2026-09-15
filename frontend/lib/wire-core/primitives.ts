// WIREFRAME-CORE · the primitive set (U-WF-02) — line · polyline · ring · extrusion · n-gon · frustum ·
// instanced repeat. Every one of them emits EDGES into a WireBuilder and nothing else.
//
// Vector-display discipline (operator's references: Star Wars arcade 1983, Battlezone): a curve is an n-gon,
// so its cost is declared rather than implicit, and the fidelity tier can spend or save it deliberately.
// U-WF-10's shared building primitive lives here: a footprint + a wall height + door/window openings is the
// SAME primitive whether it carries a Capitol or a 2x4 shed.
import type { WireBuilder, Vec3, Lod, ReplayMeta } from "./wire-model";
import type { ColorRole } from "./palette";

export type EN = [number, number];                       // [east, north] metres — a footprint corner
export interface Opening { at: EN; w: number; h: number; sill?: number }   // sill 0 = a door, >0 = a window

const TAU = Math.PI * 2;
const at3 = (p: EN, u: number): Vec3 => [p[0], p[1], u];
const lerp = (a: EN, b: EN, t: number): EN => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const sub = (a: EN, b: EN): EN => [a[0] - b[0], a[1] - b[1]];
const len = (a: EN) => Math.hypot(a[0], a[1]);

/** Direction unit vector from azimuth (0 = north, clockwise) and elevation (0 = horizon, + up), radians. */
export function dirOf(azRad: number, elRad: number): Vec3 {
  const c = Math.cos(elRad);
  return [Math.sin(azRad) * c, Math.cos(azRad) * c, Math.sin(elRad)];
}
const addV = (p: Vec3, d: Vec3, k = 1): Vec3 => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];

/** A closed ring of points at one height. */
export function ring(b: WireBuilder, pts: EN[], u: number): void {
  b.path(pts.map((p) => at3(p, u)), true);
}

/** A regular n-gon — the ONLY way a circle is drawn here, so its segment cost is always declared. */
export function ngon(center: EN, r: number, sides: number, phase = 0): EN[] {
  const out: EN[] = [];
  for (let i = 0; i < sides; i++) {
    const t = phase + (i / sides) * TAU;
    out.push([center[0] + r * Math.sin(t), center[1] + r * Math.cos(t)]);
  }
  return out;
}

/**
 * U-WF-10 — the shared building primitive. Base ring + top ring + a vertical at every corner, then each
 * opening drawn as a rectangle lying IN its wall (found by nearest wall segment, so a door is never a
 * floating box). Purely edges: a wall is implied by its boundary, exactly as the arcade references draw it.
 */
export function extrude(
  b: WireBuilder, footprint: EN[], baseU: number, heightU: number,
  opts: { doors?: Opening[]; windows?: Opening[] } = {},
): void {
  if (footprint.length < 3) throw new Error("extrude: a footprint needs at least 3 corners");
  const topU = baseU + heightU;
  ring(b, footprint, baseU);
  ring(b, footprint, topU);
  for (const p of footprint) b.seg(at3(p, baseU), at3(p, topU));
  for (const o of [...(opts.doors ?? []), ...(opts.windows ?? [])]) openingOnWall(b, footprint, baseU, o);
}

/** Projects an opening onto the nearest wall and draws its rectangle in that wall's plane. */
function openingOnWall(b: WireBuilder, footprint: EN[], baseU: number, o: Opening): void {
  let best: { d: number; on: EN; dir: EN } | null = null;
  for (let i = 0; i < footprint.length; i++) {
    const a = footprint[i], c = footprint[(i + 1) % footprint.length];
    const ac = sub(c, a), L = len(ac);
    if (L < 1e-6) continue;                                  // a degenerate wall cannot host a door
    const t = Math.max(0, Math.min(1, ((o.at[0] - a[0]) * ac[0] + (o.at[1] - a[1]) * ac[1]) / (L * L)));
    const on = lerp(a, c, t);
    const d = len(sub(o.at, on));
    if (!best || d < best.d) best = { d, on, dir: [ac[0] / L, ac[1] / L] };
  }
  if (!best) return;                                         // no wall to host it: drop, never invent one
  const half = o.w / 2;
  const u0 = baseU + (o.sill ?? 0), u1 = u0 + o.h;
  const p0: EN = [best.on[0] - best.dir[0] * half, best.on[1] - best.dir[1] * half];
  const p1: EN = [best.on[0] + best.dir[0] * half, best.on[1] + best.dir[1] * half];
  b.path([at3(p0, u0), at3(p1, u0), at3(p1, u1), at3(p0, u1)], true);
}

/**
 * A tree: trunk line, a canopy ring, and spokes to the apex. `sides` is the tier's spend.
 * `baseU` is the GROUND height it stands on — omitting it would plant every tree at MSL 0, which on the
 * Capitol lawn is about 160 m underground.
 */
export function tree(b: WireBuilder, base: EN, baseU: number, trunkH: number, canopyR: number, canopyH: number, sides = 6): void {
  const top = baseU + trunkH;
  const shoulder = top + canopyH * 0.3;
  b.seg(at3(base, baseU), at3(base, top));
  const r = ngon(base, canopyR, sides);
  ring(b, r, shoulder);
  const apex: Vec3 = [base[0], base[1], top + canopyH];
  for (const p of r) { b.seg(at3(p, shoulder), apex); b.seg(at3(p, shoulder), at3(base, top)); }
}

/** A ground polyline (road, path, the Great Walk) draped at a sampled height. */
export function polyline3(b: WireBuilder, pts: EN[], heightAt: (p: EN) => number): void {
  b.path(pts.map((p) => at3(p, heightAt(p))));
}

/**
 * The coverage / sensor solid, as EDGES — the radar-dome object the operator pointed at, rebuilt under the
 * vector law: rings at each elevation and spokes between them, never filled faces.
 */
export function ngonSolid(
  b: WireBuilder, apex: Vec3, rangeM: number, sides: number,
  elevationsRad: number[], azFromRad = 0, azToRad = TAU,
): void {
  const span = azToRad - azFromRad;
  const n = Math.max(3, Math.round((sides * span) / TAU));
  const closed = Math.abs(span - TAU) < 1e-9;
  const at = (az: number, el: number) => addV(apex, dirOf(az, el), rangeM);
  const rings: Vec3[][] = elevationsRad.map((el) => {
    const pts: Vec3[] = [];
    for (let i = 0; i <= n; i++) { if (!closed || i < n) pts.push(at(azFromRad + (span * i) / n, el)); }
    return pts;
  });
  for (const r of rings) b.path(r, closed);
  for (let i = 0; i < rings[0].length; i++) for (let k = 1; k < rings.length; k++) b.seg(rings[k - 1][i], rings[k][i]);
  // the spokes back to the apex — what makes it read as a solid of sight rather than a stack of hoops
  for (const p of rings[rings.length - 1]) b.seg(apex, p);
  if (!closed) for (const p of rings[0]) b.seg(apex, p);
}

/** What the sensor can see: apex, the near rectangle, the far rectangle, and the four sight lines. */
export function frustum(
  b: WireBuilder, apex: Vec3, azRad: number, elRad: number,
  hfovRad: number, vfovRad: number, nearM: number, farM: number,
): void {
  const corner = (dh: number, dv: number, r: number) => addV(apex, dirOf(azRad + dh, elRad + dv), r);
  const h = hfovRad / 2, v = vfovRad / 2;
  const quad = (r: number) => [corner(-h, -v, r), corner(h, -v, r), corner(h, v, r), corner(-h, v, r)];
  const nearQ = quad(nearM), farQ = quad(farM);
  b.path(nearQ, true); b.path(farQ, true);
  for (let i = 0; i < 4; i++) b.seg(nearQ[i], farQ[i]);
}

/** Repeat one set of local edges at many offsets (U-WF-02 instanced repeat) — e.g. a row of trees. */
export function instanced(b: WireBuilder, offsets: EN[], draw: (origin: EN) => void): void {
  for (const o of offsets) draw(o);
}

export type { ColorRole, Lod, ReplayMeta };

// SOLID-SHADE — the ONE shared solid-faces shader (operator 2026-11-04: "use mission planning radar 3D visual to get
// ideas on how to have objects and walls mimic shading … should be same function").
//
// The technique was hand-copied in three places — the radar dome (components/security-2525/mission-planning.tsx:
// FACE_SHADE :444, darkerHex :422-428, radarSolidFaces :449-488), the room voxel (components/architect-2525/
// room-designer.tsx:47-56), and the walkthrough (inline). This is the single extraction: the radar dome, the voxel and
// the Architect walkthrough shade through ONE function. Pure (no DOM/clock). It lives OUTSIDE wire-core because
// wire-core is EDGE-ONLY BY LAW (lib/wire-core/vector-law.ts: "Shading is forbidden"; wire-model.ts: "no faces") —
// shading is presentation. Culling is REFUSAL (a face with any behind/non-finite vertex is DROPPED, never clamped),
// exactly as scene-project.ts does for points.

export type Vec3 = [number, number, number];

// Orientation → darkness factor (× the surface's hex colour): brightest looking up, darker the more side-on, so a
// solid reads as solid and never translucent. Matches the radar's feel ({base:1.0, wall1:0.84, wall2:0.7, cos:0.52})
// and the voxel's {top:1.0, front:0.82, side:0.6}. `front`/`side`/`top` are kept so the room voxel imports this map
// unchanged; `floor`/`ceil` are added for the interior walkthrough.
export type FaceKind = "top" | "front" | "side" | "floor" | "ceil";
export const FACE_SHADE: Record<FaceKind, number> = { top: 1.0, front: 0.82, side: 0.6, floor: 0.9, ceil: 0.5 };

// Multiply a #RRGGBB hex toward black by f (0..1). The identical math the three copies shared (darkerHex / shade).
export function shade(hex: string, f: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** A projector maps a world point (feet/metres — the caller's units) to screen px + a depth, or null if the point is
 *  behind the eye / non-finite (then the whole face is dropped). Each surface passes its OWN camera (the walkthrough's
 *  interior pinhole, the radar's orthographic tilt) — only the face building + shading + sort are shared. */
export type Projector = (p: Vec3) => { x: number; y: number; depth: number } | null;

export interface Quad { pts: Vec3[]; kind: FaceKind; color?: string }
export interface ShadedFace { d: string; depth: number; kind: FaceKind; color?: string }

/** Project tagged quads, drop any with a refused vertex, and return them painter-sorted FAR→NEAR (one fixed
 *  convention — resolves the depth-sort sign that differed across the three copies). The caller fills each polygon
 *  `shade(face.color ?? baseColor, FACE_SHADE[face.kind])`. */
export function solidFaces(quads: Quad[], project: Projector): ShadedFace[] {
  const out: ShadedFace[] = [];
  for (const q of quads) {
    const ps = q.pts.map(project);
    if (ps.some((p) => !p)) continue; // cull by refusal — the radar's push() behaviour
    const depth = ps.reduce((s, p) => s + (p as { depth: number }).depth, 0) / ps.length;
    out.push({
      d: ps.map((p) => `${(p as { x: number }).x.toFixed(1)},${(p as { y: number }).y.toFixed(1)}`).join(" "),
      depth, kind: q.kind, color: q.color,
    });
  }
  out.sort((a, b) => b.depth - a.depth); // FAR first → NEAR last (painter's algorithm)
  return out;
}

/** The six quads of an axis-aligned cuboid, tagged by orientation, from its SW-bottom corner (x east, y north/depth,
 *  z up; w/d/h in the same units). Back faces are removed naturally by the projector's cull + painter order. Used for
 *  furniture boxes AND wall panels so objects and walls feed the SAME solidFaces() call and shade identically. */
export function boxFaces(x: number, y: number, z: number, w: number, d: number, h: number, color?: string): Quad[] {
  const x1 = x + w, y1 = y + d, z1 = z + h;
  return [
    { kind: "top", color, pts: [[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]] },
    { kind: "floor", color, pts: [[x, y, z], [x1, y, z], [x1, y1, z], [x, y1, z]] },
    { kind: "front", color, pts: [[x, y, z], [x1, y, z], [x1, y, z1], [x, y, z1]] },     // south
    { kind: "front", color, pts: [[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]] }, // north
    { kind: "side", color, pts: [[x, y, z], [x, y1, z], [x, y1, z1], [x, y, z1]] },      // west
    { kind: "side", color, pts: [[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]] },  // east
  ];
}

/** NEAR-PLANE SEGMENT CLIPPING (pure). Given a world segment a→b and each end's camera depth (the projector's `depth`,
 *  an affine function of the world point, so linear interpolation is exact), return the segment with a behind-the-eye end
 *  moved onto the near plane (depth = near + eps, so it passes the projector's `depth > near` test) — instead of dropping
 *  the whole segment, which made a wire/duct/dimension line beside the eye vanish the moment one end passed behind the
 *  head. Both ends behind → null (nothing to draw). Both in front → the segment unchanged. */
export function clipNear(a: Vec3, b: Vec3, da: number, db: number, near: number, eps = 0.02): [Vec3, Vec3] | null {
  const aIn = da > near, bIn = db > near;
  if (aIn && bIn) return [a, b];
  if (!aIn && !bIn) return null;
  const t = (near + eps - da) / (db - da);                       // where depth crosses the near plane, 0 at a → 1 at b
  const c: Vec3 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  return aIn ? [a, c] : [c, b];
}

/**
 * ARCHITECT-2525 · GLB → PROJECTOR BRIDGE (Rev A · 3D asset intake) — triangles into the ONE solid-faces shader.
 * =================================================================================================
 * lib/solid-shade.ts is the single shared shader (radar dome · room voxel · walkthrough): `solidFaces(quads, project)`
 * projects each face's `pts`, drops any face with a refused vertex, and painter-sorts FAR→NEAR; the caller fills with
 * `shade(face.color ?? base, FACE_SHADE[face.kind])`. It never assumes four vertices — `pts` is an array, the depth is
 * the mean over whatever is there — so a GLB triangle is simply a 3-vertex `Quad`. NOTHING in solid-shade.ts changes
 * (byte-identical); this bridge is purely additive.
 *
 * FaceKind tagging (so FACE_SHADE applies exactly as to a boxFaces cuboid): from the triangle's geometric normal —
 * |nz| dominant → "top" (up) / "floor" (down); otherwise |ny| ≥ |nx| → "front" (a north/south-facing wall, as the
 * walk tags its N/S panels) else "side" (east/west). Degenerate (zero-area) triangles have no normal and are dropped
 * here — they could never paint a pixel. `opacity` rides along (the glass is 0.43); solidFaces passes `color` through
 * and ignores fields it does not know, so a consumer that wants translucency reads it off the AssetFace it submitted.
 *
 * COPLANAR MERGE (default on): a GLB box face is two triangles sharing a diagonal; painted as two stroked triangles the
 * diagonal shows as a line across every face (seen on the first thumbnails). Two triangles that share an edge, carry the
 * same colour + opacity, lie in the same plane (normals parallel) and whose union is a CONVEX planar quad are merged into
 * ONE 4-vertex face — exactly the Quad boxFaces() produces, so an asset box and a furniture box paint identically and the
 * face count halves. The merge is greedy, order-stable and pure; `{ merge: false }` keeps raw triangles.
 */
import type { FaceKind, Quad } from "@/lib/solid-shade";
import type { AssetMesh, AssetTri, V3 } from "./glb-reader";

export interface AssetFace extends Quad { opacity: number }

/** The (unnormalised) geometric normal of a→b→c, or null when the triangle has no area. */
export function triNormal(a: V3, b: V3, c: V3): V3 | null {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const n: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  const len = Math.hypot(n[0], n[1], n[2]);
  if (!(len > 1e-12)) return null;
  return [n[0] / len, n[1] / len, n[2] / len];
}

/** Orientation → the shade class the shared shader keys on. */
export function faceKindOfNormal(n: V3): FaceKind {
  const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
  if (az >= ax && az >= ay) return n[2] >= 0 ? "top" : "floor";
  return ay >= ax ? "front" : "side";
}

/** One triangle → one 3-vertex face tagged for FACE_SHADE, or null when degenerate. */
export function triToFace(t: AssetTri): AssetFace | null {
  const n = triNormal(t.a, t.b, t.c);
  if (!n) return null;
  return { kind: faceKindOfNormal(n), color: t.color, opacity: t.opacity, pts: [t.a, t.b, t.c] };
}

export interface MeshToFacesOptions { merge?: boolean }

const vkey = (p: V3) => `${p[0]},${p[1]},${p[2]}`;
const ekey = (a: V3, b: V3) => { const ka = vkey(a), kb = vkey(b); return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`; };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (u: V3, v: V3): V3 => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const dot = (u: V3, v: V3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];

/** The convex planar quad formed by triangle (p0,p1,p2) and a neighbour's third vertex q across the shared edge
 *  (p[i], p[(i+1)%3]) — q is inserted between them so the winding stays the triangle's. Null when not convex. */
function mergedQuad(p: V3[], i: number, q: V3, n: V3): V3[] | null {
  const quad: V3[] = i === 0 ? [p[0], q, p[1], p[2]] : i === 1 ? [p[0], p[1], q, p[2]] : [p[0], p[1], p[2], q];
  for (let k = 0; k < 4; k++) {   // every corner turns the same way as the face normal → convex (and simple)
    const a = quad[k], b = quad[(k + 1) % 4], c = quad[(k + 2) % 4];
    if (!(dot(cross(sub(b, a), sub(c, b)), n) > 1e-12)) return null;
  }
  return quad;
}

/** Every paintable triangle of a mesh as solidFaces()-ready faces (the same units as the mesh — convert with toFeet()
 *  BEFORE bridging when the projector is the walk's), coplanar pairs merged into quads unless `merge: false`. Pure. */
export function meshToFaces(mesh: AssetMesh, opts: MeshToFacesOptions = {}): AssetFace[] {
  const merge = opts.merge !== false;
  const tris = mesh.triangles;
  const normals: (V3 | null)[] = tris.map((t) => triNormal(t.a, t.b, t.c));
  const out: AssetFace[] = [];
  if (!merge) {
    tris.forEach((t, i) => { const n = normals[i]; if (n) out.push({ kind: faceKindOfNormal(n), color: t.color, opacity: t.opacity, pts: [t.a, t.b, t.c] }); });
    return out;
  }
  const byEdge = new Map<string, number[]>();
  tris.forEach((t, i) => {
    if (!normals[i]) return;
    const p = [t.a, t.b, t.c];
    for (let e = 0; e < 3; e++) { const k = ekey(p[e], p[(e + 1) % 3]); const l = byEdge.get(k); if (l) l.push(i); else byEdge.set(k, [i]); }
  });
  const used = new Uint8Array(tris.length);
  tris.forEach((t, i) => {
    const n = normals[i];
    if (!n || used[i]) return;
    const p = [t.a, t.b, t.c];
    for (let e = 0; e < 3 && !used[i]; e++) {
      const k = ekey(p[e], p[(e + 1) % 3]);
      for (const j of byEdge.get(k) ?? []) {
        if (j === i || used[j]) continue;
        const u = tris[j], m = normals[j];
        if (!m || u.color !== t.color || u.opacity !== t.opacity || dot(n, m) < 0.999999) continue;
        const shared = new Set([vkey(p[e]), vkey(p[(e + 1) % 3])]);
        const q = [u.a, u.b, u.c].find((v) => !shared.has(vkey(v)));
        if (!q) continue;
        const quad = mergedQuad(p, e, q, n);
        if (!quad) continue;
        used[i] = used[j] = 1;
        out.push({ kind: faceKindOfNormal(n), color: t.color, opacity: t.opacity, pts: quad });
        break;
      }
    }
    if (!used[i]) { used[i] = 1; out.push({ kind: faceKindOfNormal(n), color: t.color, opacity: t.opacity, pts: [t.a, t.b, t.c] }); }
  });
  return out;
}

/**
 * ARCHITECT-2525 · GLB READER (Rev A · 3D asset intake) — a PURE glTF 2.0 / GLB container reader.
 * =================================================================================================
 * The runtime has no three.js, no WebGL, no glTF tooling (engine fact, plan amendment 2026-11-07): its "LIVE" projection
 * is an inline-SVG pinhole projector that paints faces through lib/solid-shade.ts (solidFaces, painter-sorted). The
 * runtime-supported equivalent of "load the GLB" is therefore: parse the GLB container ONCE → walk the scene graph with
 * every node's TRS matrix applied → emit world-space TRIANGLES carrying their material colour → feed the existing
 * projector. This module is that reader. No DOM, no npm dependency, no React — Node and browser alike (DataView +
 * TextDecoder only), so the same bytes parse identically in the gate and in the page.
 *
 * Contract kept INSIDE the reader (the starter pack's law, intake master §5–§6): METRES, X = width, Y = depth, Z = up,
 * origin = floor-centre. Conversion to the room grid's FEET (1 m = 3.280839895 ft) is the explicit `toFeet()` step at the
 * boundary; a placed instance is `transformMesh()` (yaw about Z around the floor-centre pivot, then translate). Nothing
 * here applies a "corrective" rotation — the Z-up contract is preserved, which is exactly the walk's frame (x east ·
 * y north · z up).
 *
 * Refusal, never repair: a bad magic/version/length, an overrunning chunk, an out-of-range accessor, an external buffer,
 * a sparse accessor, a non-finite vertex or an index past the vertex count all THROW. NaN/Infinity never reach a face.
 *
 * Material → colour: `pbrMetallicRoughness.baseColorFactor` ×255 → #RRGGBB (the starter pack authored its factors as
 * sRGB/255 — trimesh — so this recovers the authored hex exactly and round-trips through glb-writer.ts). Opacity is the
 * factor's alpha when alphaMode is BLEND (the glass), else 1. A primitive without a material reads `defaultColor`.
 */
import { MATERIALS } from "../materials";

export type V3 = [number, number, number];
export interface Bounds { min: V3; max: V3 }
export interface AssetTri { a: V3; b: V3; c: V3; color: string; opacity: number }
export interface AssetMesh {
  units: "m" | "ft";          // "m" straight out of the reader (the pack's contract); "ft" after toFeet()
  triangles: AssetTri[];
  bounds: Bounds;              // over every emitted vertex, in `units`
  triCount: number;
  meshCount: number;           // mesh-bearing nodes visited (instances), > 0 for a usable asset
  materials: string[];         // the distinct colours used, first-seen order
}

// ── glTF 2.0 JSON (the subset the reader touches; everything else is carried untouched) ──
export interface GltfAccessor { bufferView?: number; byteOffset?: number; componentType: number; count: number; type: string; normalized?: boolean; sparse?: unknown; min?: number[]; max?: number[] }
export interface GltfBufferView { buffer: number; byteOffset?: number; byteLength: number; byteStride?: number; target?: number }
export interface GltfPrimitive { attributes: Record<string, number>; indices?: number; mode?: number; material?: number }
export interface GltfMesh { name?: string; primitives: GltfPrimitive[]; extras?: unknown }
export interface GltfNode { name?: string; mesh?: number; children?: number[]; matrix?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] }
export interface GltfMaterial { name?: string; alphaMode?: string; doubleSided?: boolean; pbrMetallicRoughness?: { baseColorFactor?: number[]; metallicFactor?: number; roughnessFactor?: number } }
export interface GltfJson {
  asset: { version: string; generator?: string };
  scene?: number; scenes?: { nodes?: number[] }[]; nodes?: GltfNode[]; meshes?: GltfMesh[]; materials?: GltfMaterial[];
  accessors?: GltfAccessor[]; bufferViews?: GltfBufferView[]; buffers?: { byteLength: number; uri?: string }[];
}
export interface GltfDoc { json: GltfJson; bin: Uint8Array | null; byteLength: number }

export const GLB_MAGIC = 0x46546c67;   // "glTF"
export const GLB_VERSION = 2;
export const CHUNK_JSON = 0x4e4f534a;  // "JSON"
export const CHUNK_BIN = 0x004e4942;   // "BIN\0"
export const FT_PER_M = 3.280839895;   // the ONE metres→feet factor at the room boundary
export const MODE_TRIANGLES = 4, MODE_TRIANGLE_STRIP = 5, MODE_TRIANGLE_FAN = 6;

const fail = (m: string): never => { throw new Error(`GLB: ${m}`); };

/** Parse a GLB container (header + JSON chunk + optional BIN chunk). Validates magic, version, the header length against
 *  the bytes given, chunk alignment and bounds, and that the first chunk is JSON. Unknown chunk types are skipped (spec). */
export function parseGlb(buf: ArrayBuffer | Uint8Array): GltfDoc {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (u8.byteLength < 20) fail(`container too short (${u8.byteLength} bytes)`);
  const magic = dv.getUint32(0, true);
  if (magic !== GLB_MAGIC) fail(`bad magic 0x${magic.toString(16)} (expected glTF)`);
  const version = dv.getUint32(4, true);
  if (version !== GLB_VERSION) fail(`unsupported container version ${version}`);
  const length = dv.getUint32(8, true);
  if (length !== u8.byteLength) fail(`header length ${length} ≠ ${u8.byteLength} bytes given`);
  let off = 12, json: GltfJson | null = null, bin: Uint8Array | null = null, first = true;
  while (off + 8 <= length) {
    const clen = dv.getUint32(off, true), ctype = dv.getUint32(off + 4, true);
    off += 8;
    if (clen % 4 !== 0) fail(`chunk 0x${ctype.toString(16)} length ${clen} is not 4-byte aligned`);
    if (off + clen > length) fail(`chunk 0x${ctype.toString(16)} overruns the container`);
    const slice = u8.subarray(off, off + clen);
    if (first && ctype !== CHUNK_JSON) fail("first chunk must be JSON");
    first = false;
    if (ctype === CHUNK_JSON) {
      if (json) fail("duplicate JSON chunk");
      try { json = JSON.parse(new TextDecoder("utf-8").decode(slice)) as GltfJson; } catch { fail("JSON chunk is not valid JSON"); }
    } else if (ctype === CHUNK_BIN) {
      if (bin) fail("duplicate BIN chunk");
      bin = slice;
    }
    off += clen;
  }
  if (off !== length) fail(`trailing ${length - off} bytes after the last chunk`);
  if (!json) fail("no JSON chunk");
  const j = json as GltfJson;
  if (!j.asset || typeof j.asset.version !== "string" || !/^2(\.|$)/.test(j.asset.version)) fail(`asset.version must be 2.x (got ${j.asset?.version})`);
  return { json: j, bin, byteLength: length };
}

// ── accessors ──
const COMPONENT_BYTES: Record<number, number> = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const TYPE_COUNT: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

/** Read one accessor as a flat number array (component-major), honouring bufferView byteStride and byteOffsets. */
export function readAccessor(doc: GltfDoc, index: number): number[] {
  const acc = doc.json.accessors?.[index];
  if (!acc) fail(`accessor ${index} missing`);
  const a = acc as GltfAccessor;
  if (a.sparse) fail(`accessor ${index}: sparse accessors are unsupported`);
  const comps = TYPE_COUNT[a.type], cbytes = COMPONENT_BYTES[a.componentType];
  if (!comps) fail(`accessor ${index}: unknown type ${a.type}`);
  if (!cbytes) fail(`accessor ${index}: unknown componentType ${a.componentType}`);
  if (!Number.isInteger(a.count) || a.count < 0) fail(`accessor ${index}: bad count`);
  const out: number[] = new Array(a.count * comps);
  if (a.bufferView === undefined) { out.fill(0); return out; } // spec: no bufferView → zeros
  const bv = doc.json.bufferViews?.[a.bufferView];
  if (!bv) fail(`accessor ${index}: bufferView ${a.bufferView} missing`);
  const v = bv as GltfBufferView;
  const buffer = doc.json.buffers?.[v.buffer];
  if (!buffer) fail(`bufferView ${a.bufferView}: buffer ${v.buffer} missing`);
  if (v.buffer !== 0 || (buffer as { uri?: string }).uri !== undefined) fail(`bufferView ${a.bufferView}: only the embedded GLB BIN buffer is supported`);
  if (!doc.bin) fail("accessor needs a BIN chunk but the container has none");
  const bin = doc.bin as Uint8Array;
  const bvOff = v.byteOffset ?? 0;
  if (bvOff + v.byteLength > bin.byteLength) fail(`bufferView ${a.bufferView} overruns the BIN chunk`);
  const elem = comps * cbytes, stride = v.byteStride ?? elem;
  if (stride < elem) fail(`bufferView ${a.bufferView}: byteStride ${stride} < element size ${elem}`);
  const base = bvOff + (a.byteOffset ?? 0);
  if (a.count > 0 && base + (a.count - 1) * stride + elem > bvOff + v.byteLength) fail(`accessor ${index} overruns bufferView ${a.bufferView}`);
  const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const norm = a.normalized === true;
  for (let i = 0; i < a.count; i++) {
    for (let c = 0; c < comps; c++) {
      const p = base + i * stride + c * cbytes;
      let x: number;
      switch (a.componentType) {
        case 5120: x = dv.getInt8(p); if (norm) x = Math.max(x / 127, -1); break;
        case 5121: x = dv.getUint8(p); if (norm) x /= 255; break;
        case 5122: x = dv.getInt16(p, true); if (norm) x = Math.max(x / 32767, -1); break;
        case 5123: x = dv.getUint16(p, true); if (norm) x /= 65535; break;
        case 5125: x = dv.getUint32(p, true); break;
        default: x = dv.getFloat32(p, true);
      }
      out[i * comps + c] = x;
    }
  }
  return out;
}

// ── 4×4 column-major matrices (glTF convention) ──
export type Mat4 = number[];
export const IDENTITY: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export function mat4Multiply(a: Mat4, b: Mat4): Mat4 {   // a·b (apply b first, then a)
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
export function mat4Apply(m: Mat4, p: V3): V3 {
  const x = p[0], y = p[1], z = p[2];
  const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
  return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w];
}
/** Determinant of the upper 3×3 — negative means a mirroring transform (winding must flip to keep normals outward). */
export function mat4Det3(m: Mat4): number {
  return m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);
}
/** A node's local matrix: `matrix` (16, column-major) or T·R·S from translation / rotation (quaternion x,y,z,w) / scale. */
export function nodeMatrix(n: GltfNode): Mat4 {
  if (n.matrix) { if (n.matrix.length !== 16) fail("node.matrix must have 16 numbers"); return n.matrix.slice(); }
  const t = n.translation ?? [0, 0, 0], q = n.rotation ?? [0, 0, 0, 1], s = n.scale ?? [1, 1, 1];
  const [x, y, z, w] = q;
  const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  return [
    (1 - 2 * (yy + zz)) * s[0], (2 * (xy + wz)) * s[0], (2 * (xz - wy)) * s[0], 0,
    (2 * (xy - wz)) * s[1], (1 - 2 * (xx + zz)) * s[1], (2 * (yz + wx)) * s[1], 0,
    (2 * (xz + wy)) * s[2], (2 * (yz - wx)) * s[2], (1 - 2 * (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1,
  ];
}

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1);
const hex2 = (v: number) => Math.round(clamp01(v) * 255).toString(16).padStart(2, "0");
/** baseColorFactor [r,g,b,(a)] → #rrggbb (straight ×255 — see the header). */
export function baseColorToHex(f: number[] | undefined): string | null {
  if (!f || f.length < 3) return null;
  return `#${hex2(f[0])}${hex2(f[1])}${hex2(f[2])}`;
}

const finite3 = (p: V3) => Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2]);

/** Recompute bounds over every triangle vertex. Throws on a non-finite coordinate. Empty → a zero box. */
export function meshBounds(tris: AssetTri[]): Bounds {
  if (tris.length === 0) return { min: [0, 0, 0], max: [0, 0, 0] };
  const min: V3 = [Infinity, Infinity, Infinity], max: V3 = [-Infinity, -Infinity, -Infinity];
  for (const t of tris) for (const p of [t.a, t.b, t.c]) {
    if (!finite3(p)) fail("non-finite vertex");
    for (let i = 0; i < 3; i++) { if (p[i] < min[i]) min[i] = p[i]; if (p[i] > max[i]) max[i] = p[i]; }
  }
  return { min, max };
}
/** Width / depth / height of a bounds box (max − min per axis). */
export function boundsExtents(b: Bounds): { w: number; d: number; h: number } {
  return { w: b.max[0] - b.min[0], d: b.max[1] - b.min[1], h: b.max[2] - b.min[2] };
}

export interface TriangulateOptions { defaultColor?: string }

/** Walk the default scene, apply every node's world matrix, and emit world-space triangles with their material colour.
 *  Supports indexed and non-indexed TRIANGLES (plus strips/fans); other primitive modes (points/lines) are skipped.
 *  Units stay METRES, Z stays up (the pack's contract). Throws on any non-finite vertex or out-of-range index. */
export function gltfTriangles(doc: GltfDoc, opts: TriangulateOptions = {}): AssetMesh {
  const j = doc.json;
  const defaultColor = opts.defaultColor ?? MATERIALS.ARCH_TEAL.fill;
  const sceneIdx = j.scene ?? 0;
  const scene = j.scenes?.[sceneIdx] ?? fail(`scene ${sceneIdx} missing`);
  const nodes = j.nodes ?? [], meshes = j.meshes ?? [], materials = j.materials ?? [];
  const triangles: AssetTri[] = [];
  const colours: string[] = [];
  let meshCount = 0;
  const positionCache = new Map<number, V3[]>();   // accessor index → raw vertices (shared accessors parse once)
  const indexCache = new Map<number, number[]>();
  const positionsOf = (acc: number): V3[] => {
    let v = positionCache.get(acc);
    if (!v) {
      const a = j.accessors?.[acc];
      if (!a || a.type !== "VEC3" || a.componentType !== 5126) fail(`POSITION accessor ${acc} must be VEC3 float`);
      const flat = readAccessor(doc, acc);
      v = [];
      for (let i = 0; i < flat.length; i += 3) v.push([flat[i], flat[i + 1], flat[i + 2]]);
      positionCache.set(acc, v);
    }
    return v;
  };
  const indicesOf = (acc: number): number[] => {
    let v = indexCache.get(acc);
    if (!v) {
      const a = j.accessors?.[acc];
      if (!a || a.type !== "SCALAR" || ![5121, 5123, 5125].includes(a.componentType)) fail(`index accessor ${acc} must be SCALAR u8/u16/u32`);
      v = readAccessor(doc, acc);
      indexCache.set(acc, v);
    }
    return v;
  };
  const materialOf = (idx: number | undefined): { color: string; opacity: number } => {
    if (idx === undefined) return { color: defaultColor, opacity: 1 };
    const m = materials[idx];
    if (!m) fail(`material ${idx} missing`);
    const mat = m as GltfMaterial;
    const f = mat.pbrMetallicRoughness?.baseColorFactor;
    const color = baseColorToHex(f) ?? defaultColor;
    const opacity = mat.alphaMode === "BLEND" && f && f.length >= 4 ? clamp01(f[3]) : 1;
    return { color, opacity };
  };
  const visit = (ni: number, parent: Mat4, path: number[]) => {
    if (path.includes(ni)) fail(`node ${ni} is its own ancestor (cycle)`);
    if (path.length > 64) fail("scene graph deeper than 64");
    const n = nodes[ni];
    if (!n) fail(`node ${ni} missing`);
    const world = mat4Multiply(parent, nodeMatrix(n as GltfNode));
    const flip = mat4Det3(world) < 0;
    if ((n as GltfNode).mesh !== undefined) {
      const mesh = meshes[(n as GltfNode).mesh as number];
      if (!mesh) fail(`mesh ${(n as GltfNode).mesh} missing`);
      meshCount++;
      for (const prim of (mesh as GltfMesh).primitives ?? []) {
        const mode = prim.mode ?? MODE_TRIANGLES;
        if (mode !== MODE_TRIANGLES && mode !== MODE_TRIANGLE_STRIP && mode !== MODE_TRIANGLE_FAN) continue;
        const posAcc = prim.attributes?.POSITION;
        if (posAcc === undefined) fail("primitive without POSITION");
        const raw = positionsOf(posAcc);
        const idx = prim.indices !== undefined ? indicesOf(prim.indices) : raw.map((_, i) => i);
        for (const k of idx) if (!Number.isInteger(k) || k < 0 || k >= raw.length) fail(`index ${k} out of range (${raw.length} vertices)`);
        const { color, opacity } = materialOf(prim.material);
        if (!colours.includes(color)) colours.push(color);
        const w = (k: number): V3 => { const p = mat4Apply(world, raw[k]); if (!finite3(p)) fail("non-finite vertex after transform"); return p; };
        const push = (ia: number, ib: number, ic: number) => {
          const a = w(ia), b = w(ib), c = w(ic);
          triangles.push(flip ? { a, b: c, c: b, color, opacity } : { a, b, c, color, opacity });
        };
        if (mode === MODE_TRIANGLES) { for (let i = 0; i + 2 < idx.length; i += 3) push(idx[i], idx[i + 1], idx[i + 2]); }
        else if (mode === MODE_TRIANGLE_STRIP) { for (let i = 0; i + 2 < idx.length; i++) (i % 2 === 0) ? push(idx[i], idx[i + 1], idx[i + 2]) : push(idx[i + 1], idx[i], idx[i + 2]); }
        else { for (let i = 1; i + 1 < idx.length; i++) push(idx[0], idx[i], idx[i + 1]); }
      }
    }
    for (const c of (n as GltfNode).children ?? []) visit(c, world, [...path, ni]);
  };
  for (const root of scene.nodes ?? []) visit(root, IDENTITY, []);
  return { units: "m", triangles, bounds: meshBounds(triangles), triCount: triangles.length, meshCount, materials: colours };
}

/** Parse + triangulate in one call (the model cache's one parse per id). */
export function readGlb(buf: ArrayBuffer | Uint8Array, opts: TriangulateOptions = {}): AssetMesh {
  return gltfTriangles(parseGlb(buf), opts);
}

const scaleTri = (t: AssetTri, s: number): AssetTri => ({
  a: [t.a[0] * s, t.a[1] * s, t.a[2] * s], b: [t.b[0] * s, t.b[1] * s, t.b[2] * s], c: [t.c[0] * s, t.c[1] * s, t.c[2] * s], color: t.color, opacity: t.opacity,
});

/** METRES → FEET at the room boundary (the walk/room grid is feet). Pure; a feet mesh is returned unchanged. */
export function toFeet(mesh: AssetMesh): AssetMesh {
  if (mesh.units === "ft") return mesh;
  const triangles = mesh.triangles.map((t) => scaleTri(t, FT_PER_M));
  return { ...mesh, units: "ft", triangles, bounds: meshBounds(triangles) };
}

export interface Placement { x: number; y: number; z: number }

/** Exact cos/sin for the four cardinal yaws (the pack's allowedDegrees) so a 90° instance has no 6e-17 drift. */
function yawCosSin(deg: number): [number, number] {
  const r = ((deg % 360) + 360) % 360;
  if (r === 0) return [1, 0]; if (r === 90) return [0, 1]; if (r === 180) return [-1, 0]; if (r === 270) return [0, -1];
  const t = (deg * Math.PI) / 180; return [Math.cos(t), Math.sin(t)];
}

/** One placed instance: yaw `rotationDeg` about Z around the model's floor-centre pivot (its origin), then translate by
 *  `at` (the caller's units — the mesh's own). Rotation + translation preserve winding, so normals stay outward. Pure.
 *  Throws on a non-finite placement. */
export function transformMesh(mesh: AssetMesh, at: Placement, rotationDeg = 0): AssetMesh {
  if (!Number.isFinite(at.x) || !Number.isFinite(at.y) || !Number.isFinite(at.z) || !Number.isFinite(rotationDeg)) fail("non-finite placement");
  const [c, s] = yawCosSin(rotationDeg);
  const tp = (p: V3): V3 => [p[0] * c - p[1] * s + at.x, p[0] * s + p[1] * c + at.y, p[2] + at.z];
  const triangles = mesh.triangles.map((t) => ({ a: tp(t.a), b: tp(t.b), c: tp(t.c), color: t.color, opacity: t.opacity }));
  return { ...mesh, triangles, bounds: meshBounds(triangles) };
}

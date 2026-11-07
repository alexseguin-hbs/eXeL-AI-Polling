/**
 * ARCHITECT-2525 · GLB WRITER (Rev A · 3D asset intake) — a PURE glTF 2.0 / GLB container writer.
 * =================================================================================================
 * The build (scripts/architect-assets-build.mjs) compiles authored part compositions (lib/architect-2525/assets/
 * compositions/) into REAL .glb files in the starter pack's exact layout: one node per part under a "world" root,
 * indexed TRIANGLES, per-part material with pbrMetallicRoughness.baseColorFactor, METRES, X width · Y depth · Z up,
 * origin floor-centre. No three.js, no npm dependency, no DOM — DataView + TextEncoder only. DETERMINISTIC: no clock, no
 * random, fixed key order, so the same composition → byte-identical bytes (gated by tests/architect-asset-glb-build).
 * Round trip is the contract: writeGlb → glb-reader.parseGlb → gltfTriangles reproduces the parts' bounds/tris/colours.
 *
 * PRIMITIVES (the operator's 126 rotator families compile through these): box · cyl · sphere · torus, each generated
 * CENTRED at the origin with `size` = full extents [w along X, d along Y, h along Z] in metres, low segment counts
 * (8–12 — picker-weight, silhouette-readable), outward CCW winding, then rotated about its own centre (rotX, then rotY,
 * then rotZ, degrees — cardinal angles exact) and translated to `center` (Z-up, floor-centre origin). `partMesh()` is
 * that one pure path; a composition's parts feed it.
 */
import type { V3 } from "./glb-reader";
import { CHUNK_BIN, CHUNK_JSON, GLB_MAGIC, GLB_VERSION } from "./glb-reader";

export type V3Like = [number, number, number];

export const GLB_GENERATOR = "architect-2525/assets-build";

export interface WriterMaterial { name: string; baseColorFactor: [number, number, number, number]; alphaMode?: "OPAQUE" | "BLEND" | "MASK"; metallicFactor?: number; roughnessFactor?: number }
/** An axis-aligned box from its MIN corner (x, y, z) with extents (w along X, d along Y, h along Z) — metres. */
export interface BoxM { x: number; y: number; z: number; w: number; d: number; h: number }
export interface RawMesh { positions: V3[]; indices: number[] }
export type WriterPart = { name: string; material: string; box: BoxM; mesh?: undefined } | { name: string; material: string; mesh: RawMesh; box?: undefined };
export interface WriteGlbInput { parts: WriterPart[]; materials: WriterMaterial[]; generator?: string; rootName?: string }

const fail = (m: string): never => { throw new Error(`GLB-WRITE: ${m}`); };

/** #rrggbb → baseColorFactor [r,g,b,alpha] (straight /255 — the reader's inverse). */
export function hexToBaseColor(hex: string, alpha = 1): [number, number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) fail(`not a #rrggbb colour: ${hex}`);
  const n = parseInt((m as RegExpExecArray)[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, alpha];
}

/** The 8 vertices + 12 CCW-outward triangles of a box. */
export function boxMesh(b: BoxM): RawMesh {
  for (const [k, v] of Object.entries(b)) if (!Number.isFinite(v)) fail(`box.${k} is not finite`);
  if (!(b.w > 0 && b.d > 0 && b.h > 0)) fail(`box extents must be positive (w ${b.w} · d ${b.d} · h ${b.h})`);
  const x0 = b.x, y0 = b.y, z0 = b.z, x1 = b.x + b.w, y1 = b.y + b.d, z1 = b.z + b.h;
  const positions: V3[] = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],   // 0..3 bottom ring (CCW seen from above)
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],   // 4..7 top ring
  ];
  const indices = [
    4, 5, 6, 4, 6, 7,       // top (+z)
    0, 2, 1, 0, 3, 2,       // bottom (−z)
    0, 1, 5, 0, 5, 4,       // south (−y)
    2, 3, 7, 2, 7, 6,       // north (+y)
    3, 0, 4, 3, 4, 7,       // west (−x)
    1, 2, 6, 1, 6, 5,       // east (+x)
  ];
  return { positions, indices };
}

const pad4 = (n: number) => (n + 3) & ~3;

/** Compile parts + materials into GLB bytes (header · JSON chunk · BIN chunk). */
export function writeGlb(input: WriteGlbInput): Uint8Array {
  if (!input.parts.length) fail("no parts");
  const matIndex = new Map<string, number>();
  input.materials.forEach((m, i) => { if (matIndex.has(m.name)) fail(`duplicate material ${m.name}`); matIndex.set(m.name, i); });
  // ── BIN layout: per part → indices view (u16 or u32, padded) then positions view (f32) ──
  const views: { byteOffset: number; byteLength: number; target: number }[] = [];
  const accessors: Record<string, unknown>[] = [];
  const meshes: Record<string, unknown>[] = [];
  const nodes: Record<string, unknown>[] = [{ name: input.rootName ?? "world", children: input.parts.map((_, i) => i + 1) }];
  const chunks: Uint8Array[] = [];
  let binLen = 0;
  const pushView = (bytes: Uint8Array, target: number): number => {
    const idx = views.length;
    views.push({ byteOffset: binLen, byteLength: bytes.byteLength, target });
    chunks.push(bytes);
    const padded = pad4(bytes.byteLength);
    if (padded !== bytes.byteLength) chunks.push(new Uint8Array(padded - bytes.byteLength));
    binLen += padded;
    return idx;
  };
  input.parts.forEach((part, pi) => {
    const mi = matIndex.get(part.material);
    if (mi === undefined) fail(`part ${part.name}: unknown material ${part.material}`);
    const mesh = part.box ? boxMesh(part.box) : (part.mesh as RawMesh);
    if (!mesh || !mesh.positions.length || mesh.indices.length % 3 !== 0 || !mesh.indices.length) fail(`part ${part.name}: mesh needs vertices and index triples`);
    for (const k of mesh.indices) if (!Number.isInteger(k) || k < 0 || k >= mesh.positions.length) fail(`part ${part.name}: index ${k} out of range`);
    for (const p of mesh.positions) if (!p.every(Number.isFinite)) fail(`part ${part.name}: non-finite vertex`);
    // indices
    const u32 = mesh.positions.length > 65535;
    const ib = u32 ? new Uint32Array(mesh.indices) : new Uint16Array(mesh.indices);
    const iview = pushView(new Uint8Array(ib.buffer, ib.byteOffset, ib.byteLength), 34963);
    const iacc = accessors.length;
    accessors.push({ bufferView: iview, componentType: u32 ? 5125 : 5123, count: mesh.indices.length, type: "SCALAR", min: [Math.min(...mesh.indices)], max: [Math.max(...mesh.indices)] });
    // positions (float32 — min/max are the STORED float32 values, as the spec requires)
    const pb = new Float32Array(mesh.positions.length * 3);
    mesh.positions.forEach((p, i) => { pb[i * 3] = p[0]; pb[i * 3 + 1] = p[1]; pb[i * 3 + 2] = p[2]; });
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pb.length; i += 3) for (let c = 0; c < 3; c++) { if (pb[i + c] < min[c]) min[c] = pb[i + c]; if (pb[i + c] > max[c]) max[c] = pb[i + c]; }
    const pview = pushView(new Uint8Array(pb.buffer, pb.byteOffset, pb.byteLength), 34962);
    const pacc = accessors.length;
    accessors.push({ bufferView: pview, componentType: 5126, count: mesh.positions.length, type: "VEC3", min, max });
    meshes.push({ name: part.name, primitives: [{ attributes: { POSITION: pacc }, indices: iacc, mode: 4, material: mi }] });
    nodes.push({ name: part.name, mesh: pi });
  });
  const materials = input.materials.map((m) => ({
    name: m.name,
    pbrMetallicRoughness: { baseColorFactor: m.baseColorFactor, metallicFactor: m.metallicFactor ?? 0, roughnessFactor: m.roughnessFactor ?? 0.5 },
    alphaMode: m.alphaMode ?? "OPAQUE",
    doubleSided: false,
  }));
  const json = {
    asset: { version: "2.0", generator: input.generator ?? GLB_GENERATOR },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes, meshes, materials, accessors,
    bufferViews: views.map((v) => ({ buffer: 0, byteOffset: v.byteOffset, byteLength: v.byteLength, target: v.target })),
    buffers: [{ byteLength: binLen }],
  };
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonLen = pad4(jsonBytes.byteLength);
  const total = 12 + 8 + jsonLen + 8 + binLen;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, GLB_MAGIC, true); dv.setUint32(4, GLB_VERSION, true); dv.setUint32(8, total, true);
  dv.setUint32(12, jsonLen, true); dv.setUint32(16, CHUNK_JSON, true);
  out.set(jsonBytes, 20);
  for (let i = 20 + jsonBytes.byteLength; i < 20 + jsonLen; i++) out[i] = 0x20;   // JSON padding is spaces (spec)
  let off = 20 + jsonLen;
  dv.setUint32(off, binLen, true); dv.setUint32(off + 4, CHUNK_BIN, true); off += 8;
  for (const c of chunks) { out.set(c, off); off += c.byteLength; }
  if (off !== total) fail(`internal: wrote ${off} of ${total} bytes`);
  return out;
}

// ── PRIMITIVES ──
export type PartKind = "box" | "cyl" | "sphere" | "torus";
/** One part of a composition: a primitive of full extents `size` [w,d,h] m centred at `center` [x,y,z] m (Z-up, floor-
 *  centre origin), rotated about its own centre by rotX → rotY → rotZ degrees. `segments` (default 12 around; sphere rings
 *  and torus tube default 8) is clamped to 3..64. */
export interface PartSpec { kind: PartKind; size: [number, number, number]; center: [number, number, number]; rotX?: number; rotY?: number; rotZ?: number; segments?: number }

const TAU = Math.PI * 2;
/** Exact cos/sin at the cardinal angles (no 6e-17 drift on a 90° part), Math otherwise. */
export function cosSinDeg(deg: number): [number, number] {
  const r = ((deg % 360) + 360) % 360;
  if (r === 0) return [1, 0]; if (r === 90) return [0, 1]; if (r === 180) return [-1, 0]; if (r === 270) return [0, -1];
  const t = (deg * Math.PI) / 180; return [Math.cos(t), Math.sin(t)];
}
const ring = (n: number, rx: number, ry: number, z: number): V3[] => Array.from({ length: n }, (_, i) => { const t = (TAU * i) / n; return [rx * Math.cos(t), ry * Math.sin(t), z]; });
const seg = (n: number | undefined, d: number) => Math.max(3, Math.min(64, Math.floor(n ?? d)));

/** An (elliptic) cylinder: diameters w (X) and d (Y), height h (Z), centred at the origin. n side quads + two fan caps. */
export function cylMesh(size: [number, number, number], segments?: number): RawMesh {
  const [w, d, h] = size, n = seg(segments, 12);
  const bot = ring(n, w / 2, d / 2, -h / 2), top = ring(n, w / 2, d / 2, h / 2);
  const positions: V3[] = [...bot, ...top, [0, 0, -h / 2], [0, 0, h / 2]];
  const cb = 2 * n, ct = 2 * n + 1, indices: number[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    indices.push(i, j, n + j, i, n + j, n + i);     // side (outward)
    indices.push(ct, n + i, n + j);                 // top cap (up)
    indices.push(cb, j, i);                         // bottom cap (down)
  }
  return { positions, indices };
}

/** An ellipsoid of extents w × d × h centred at the origin: `segments` around (default 12), `rings` latitude bands
 *  (default 8), built bottom → top so every quad winds outward. */
export function sphereMesh(size: [number, number, number], segments?: number, rings?: number): RawMesh {
  const [w, d, h] = size, n = seg(segments, 12), m = seg(rings, 8);
  const positions: V3[] = [[0, 0, -h / 2]];
  for (let j = 1; j < m; j++) {
    const phi = Math.PI - (Math.PI * j) / m;       // π (bottom) → 0 (top)
    const sp = Math.sin(phi), cp = Math.cos(phi);
    for (let i = 0; i < n; i++) { const t = (TAU * i) / n; positions.push([(w / 2) * sp * Math.cos(t), (d / 2) * sp * Math.sin(t), (h / 2) * cp]); }
  }
  positions.push([0, 0, h / 2]);
  const bottom = 0, topIdx = positions.length - 1, at = (j: number, i: number) => 1 + (j - 1) * n + (i % n);
  const indices: number[] = [];
  for (let i = 0; i < n; i++) indices.push(bottom, at(1, i + 1), at(1, i));                          // bottom cap (down)
  for (let j = 1; j < m - 1; j++) for (let i = 0; i < n; i++) {
    const a = at(j, i), b = at(j, i + 1), c = at(j + 1, i + 1), e = at(j + 1, i);
    indices.push(a, b, c, a, c, e);                                                                   // band quad (outward)
  }
  for (let i = 0; i < n; i++) indices.push(topIdx, at(m - 1, i), at(m - 1, i + 1));                  // top cap (up)
  return { positions, indices };
}

/** A torus lying flat: outer extents w × d, tube diameter h (so the major radii are w/2 − h/2 and d/2 − h/2), centred at
 *  the origin; `segments` around the ring (default 12), `tube` around the tube (default 8). */
export function torusMesh(size: [number, number, number], segments?: number, tube?: number): RawMesh {
  const [w, d, h] = size, n = seg(segments, 12), k = seg(tube, 8), r = h / 2, Rx = w / 2 - r, Ry = d / 2 - r;
  if (!(Rx > 0 && Ry > 0)) fail(`torus tube ${h} must be smaller than its extents ${w} × ${d}`);
  const positions: V3[] = [];
  for (let i = 0; i < n; i++) {
    const t = (TAU * i) / n, ct = Math.cos(t), st = Math.sin(t);
    for (let j = 0; j < k; j++) { const u = (TAU * j) / k; positions.push([(Rx + r * Math.cos(u)) * ct, (Ry + r * Math.cos(u)) * st, r * Math.sin(u)]); }
  }
  const at = (i: number, j: number) => (i % n) * k + (j % k), indices: number[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) {
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), e = at(i, j + 1);
    indices.push(a, b, c, a, c, e);
  }
  return { positions, indices };
}

/** Rotate a mesh about the origin by rotX → rotY → rotZ (degrees), then translate. Pure; rotations keep the winding. */
export function transformRawMesh(mesh: RawMesh, rot: { rotX?: number; rotY?: number; rotZ?: number }, center: [number, number, number]): RawMesh {
  const [cx, sx] = cosSinDeg(rot.rotX ?? 0), [cy, sy] = cosSinDeg(rot.rotY ?? 0), [cz, sz] = cosSinDeg(rot.rotZ ?? 0);
  const positions = mesh.positions.map((p): V3 => {
    let [x, y, z] = p;
    [y, z] = [y * cx - z * sx, y * sx + z * cx];     // about X
    [x, z] = [x * cy + z * sy, -x * sy + z * cy];    // about Y
    [x, y] = [x * cz - y * sz, x * sz + y * cz];     // about Z
    return [x + center[0], y + center[1], z + center[2]];
  });
  return { positions, indices: mesh.indices.slice() };
}

/** The mesh of one part spec — primitive centred at the origin → rotated about its centre → placed at `center`. */
export function partMesh(p: PartSpec): RawMesh {
  const [w, d, h] = p.size;
  if (![w, d, h].every((v) => Number.isFinite(v) && v > 0)) fail(`part size must be three positive finite numbers (got ${p.size})`);
  if (!p.center.every(Number.isFinite)) fail(`part center must be finite (got ${p.center})`);
  for (const k of ["rotX", "rotY", "rotZ"] as const) if (p[k] !== undefined && !Number.isFinite(p[k])) fail(`part ${k} must be finite`);
  const base = p.kind === "box" ? boxMesh({ x: -w / 2, y: -d / 2, z: -h / 2, w, d, h })
    : p.kind === "cyl" ? cylMesh(p.size, p.segments)
    : p.kind === "sphere" ? sphereMesh(p.size, p.segments, p.segments !== undefined ? Math.max(3, Math.round(p.segments * 2 / 3)) : undefined)
    : p.kind === "torus" ? torusMesh(p.size, p.segments, p.segments !== undefined ? Math.max(3, Math.round(p.segments * 2 / 3)) : undefined)
    : fail(`unknown part kind ${String((p as { kind: string }).kind)}`);
  return transformRawMesh(base, p, p.center);
}

/** The axis-aligned bounds of a raw mesh's vertices. */
export function rawMeshBounds(m: RawMesh): { min: V3; max: V3 } {
  const min: V3 = [Infinity, Infinity, Infinity], max: V3 = [-Infinity, -Infinity, -Infinity];
  for (const p of m.positions) for (let i = 0; i < 3; i++) { if (p[i] < min[i]) min[i] = p[i]; if (p[i] > max[i]) max[i] = p[i]; }
  return { min, max };
}

// ARCHITECT-2525 · 3D ASSET GLB INTAKE gate (Rev A — the operator's 3D Asset Starter Pack, concept + pack by eXeL AI,
// intake master docs/asks/2026.11.07_architect2525_3d_asset_intake_master.md §30 "minimum tests"). The served library
// public/architect-2525/assets is read through the SAME pure reader the runtime uses (no three.js — the GLB becomes
// triangles into the existing solidFaces painter). Proves: REGISTRY (manifest ids unique, every model/metadata/plan/
// thumbnail path exists, metadata validates against schemas/asset.schema.json) · GEOMETRY (every GLB parses, meshCount
// > 0, triCount > 0, positive finite bounds, bounds within ±20% of dimensionsM — drifts are LISTED as WARN with the
// numbers, never silently failed or silently passed, and written to tests/fixtures/asset-glb-report.json) ·
// PERFORMANCE (the model cache parses ONCE for two instances; instances share the parsed mesh) · PLACEMENT (a 90° yaw
// maps width → depth about the floor-centre pivot; translate; feet at the boundary) · PROJECTION (triangles bridge into
// solidFaces as 3-vertex faces, shade-tagged; plan symbol + 3D model + thumbnail hang off ONE id) · WRITER round trip ·
// the 18 starter GLBs are byte-identical to his pack masters · the runtime entry never fetches at import.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-asset-glb.test.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseGlb, gltfTriangles, readGlb, toFeet, transformMesh, boundsExtents, FT_PER_M, nodeMatrix, mat4Apply } from "../lib/architect-2525/assets/gltf/glb-reader.ts";
import { meshToFaces, faceKindOfNormal } from "../lib/architect-2525/assets/gltf/to-quads.ts";
import { writeGlb, boxMesh, hexToBaseColor, GLB_GENERATOR } from "../lib/architect-2525/assets/gltf/glb-writer.ts";
import { checkAssetMesh, DIM_TOLERANCE, FLOOR_EPS_M } from "../lib/architect-2525/assets/gltf/validate.ts";
import { createModelCache, getAssetMesh, cacheFor, resetModelCache, instanceTriangles, checkTriBudget, MAX_TRIS_PER_ASSET, MAX_TRIS_PER_ROOM, manifestEntry, modelUrl } from "../lib/architect-2525/assets/model-cache.ts";
import { COMPOSITIONS, STUD_2X4, compositionGlbInput, compositionBounds, compositionMetadata } from "../lib/architect-2525/assets/compositions/index.ts";
import { MATERIALS } from "../lib/architect-2525/assets/materials.ts";
import { solidFaces, FACE_SHADE } from "../lib/solid-shade.ts";
import { planSvg } from "../scripts/architect-assets-build.mjs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, "../public/architect-2525/assets");
const PACK = path.resolve(HERE, "../../docs/architecture-2525/asset-library/3d-starter-2026-11-06");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const exists = (p) => fs.existsSync(p);

// ── §1 REGISTRY — the manifest, the schema, unique ids, every path resolves ──
const manifest = readJson(path.join(ROOT, "manifest.json"));
const schema = readJson(path.join(ROOT, "schemas/asset.schema.json"));
const STARTER_IDS = [
  "furniture.sofa.3seat.v1", "furniture.lounge_chair.v1", "furniture.coffee_table.v1", "furniture.bed.queen.v1", "furniture.nightstand.v1",
  "furniture.dresser.v1", "furniture.dining_table.v1", "furniture.dining_chair.v1", "kitchen.base_run.sink.v1", "kitchen.upper_cabinets.v1",
  "appliance.refrigerator.frenchdoor.v1", "bath.toilet.v1", "bath.vanity_sink.v1", "bath.shower.enclosure.v1", "appliance.washer.frontload.v1",
  "appliance.dryer.frontload.v1", "opening.door.interior.v1", "opening.window.unit.v1",
];
ok(exists(path.join(ROOT, "README.md")) && /eXeL AI/.test(fs.readFileSync(path.join(ROOT, "README.md"), "utf8")), "public/architect-2525/assets/README.md states the contract and credits eXeL AI");
ok(manifest.units === "meters" && /Z up/.test(manifest.coordinateSystem) && /floor-center/.test(manifest.pivotConvention), "manifest declares metres · Z up · floor-centre (the pack's contract)");
const ids = manifest.assets.map((a) => a.id);
ok(new Set(ids).size === ids.length, `manifest ids are unique (${ids.length})`);
ok(STARTER_IDS.every((id) => ids.includes(id)), "all 18 starter ids are registered (the id scheme is law)");
ok(COMPOSITIONS.every((c) => ids.includes(c.id)), `every authored composition is registered (${COMPOSITIONS.map((c) => c.id).join(", ")})`);
ok(ids.length === STARTER_IDS.length + COMPOSITIONS.length, `manifest holds exactly the 18 starter + ${COMPOSITIONS.length} built asset(s) (got ${ids.length})`);
const REQUIRED = schema.required;
const MOUNTING = schema.properties.mounting.enum, AUTHORITY = schema.properties.authority.enum;
const metaOf = {};
for (const e of manifest.assets) {
  for (const k of ["model", "metadata", "planSymbol", "thumbnail"]) ok(typeof e[k] === "string" && exists(path.join(ROOT, e[k])), `${e.id}: ${k} path exists (${e[k]})`);
  ok(Object.keys(e).join(",") === "id,label,category,model,metadata,planSymbol,thumbnail", `${e.id}: manifest entry carries exactly id · label · category · model · metadata · planSymbol · thumbnail`);
  if (!exists(path.join(ROOT, e.metadata))) continue;
  const m = readJson(path.join(ROOT, e.metadata)); metaOf[e.id] = m;
  const missing = REQUIRED.filter((k) => !(k in m));
  ok(missing.length === 0, `${e.id}: metadata has every schema-required key (missing: ${missing.join(",")})`);
  ok(m.id === e.id, `${e.id}: metadata id equals the manifest id`);
  ok(path.basename(m.model) === path.basename(e.model) && path.basename(m.planSymbol) === path.basename(e.planSymbol), `${e.id}: metadata model/planSymbol name the same files as the manifest`);
  const d = m.dimensionsM ?? {};
  ok(["width", "depth", "height"].every((k) => typeof d[k] === "number" && d[k] > 0), `${e.id}: dimensionsM width/depth/height > 0`);
  ok(m.pivot?.origin === "FLOOR_CENTER" && m.pivot?.axes === "X=width,Y=depth,Z=up", `${e.id}: pivot FLOOR_CENTER · X=width,Y=depth,Z=up`);
  ok(m.rotation?.axis === "Z" && Array.isArray(m.rotation?.allowedDegrees) && m.rotation.allowedDegrees.every((x) => typeof x === "number"), `${e.id}: rotation about Z with numeric allowedDegrees`);
  ok(MOUNTING.includes(m.mounting), `${e.id}: mounting ∈ ${MOUNTING.join("|")} (got ${m.mounting})`);
  ok(AUTHORITY.includes(m.authority), `${e.id}: authority ∈ ${AUTHORITY.join("|")} (got ${m.authority})`);
  ok(Array.isArray(m.snap) && m.snap.every((s) => typeof s === "string") && Array.isArray(m.rooms) && m.rooms.every((s) => typeof s === "string"), `${e.id}: snap[] and rooms[] are string arrays`);
  if ("phaseCompatibility" in m) ok(Array.isArray(m.phaseCompatibility), `${e.id}: phaseCompatibility is an array`);
  // the thumbnail is a real 256×256 PNG
  const png = fs.readFileSync(path.join(ROOT, e.thumbnail));
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
  ok(png.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && w === 256 && h === 256, `${e.id}: thumbnail is a 256×256 PNG (got ${w}×${h})`);
}

// ── the 18 starter files in the served tree are byte-identical to his pack masters (never re-drawn, never re-exported) ──
for (const id of STARTER_IDS) {
  const e = manifest.assets.find((a) => a.id === id);
  if (!e) continue;
  for (const k of ["model", "metadata", "planSymbol"]) ok(exists(path.join(PACK, e[k])) && sha(path.join(PACK, e[k])) === sha(path.join(ROOT, e[k])), `${id}: served ${k} is byte-identical to the starter pack master`);
}
// the plan-SVG writer reproduces his 18 PLAN symbols exactly (so a generated symbol is in HIS style, byte for byte)
for (const id of STARTER_IDS) {
  const e = manifest.assets.find((a) => a.id === id), m = metaOf[id];
  if (!e || !m) continue;
  ok(planSvg(e.label, m.dimensionsM.width, m.dimensionsM.depth) === fs.readFileSync(path.join(ROOT, e.planSymbol), "utf8"), `${id}: planSvg() reproduces the pack's plan symbol byte-for-byte`);
}

// ── §2 GEOMETRY — every GLB parses through the pure reader; the contract drifts are LISTED (WARN), never hidden ──
const report = { gate: "tests/architect-asset-glb.test.mjs", tolerance: DIM_TOLERANCE, floorEpsM: FLOOR_EPS_M, maxTrisPerAsset: MAX_TRIS_PER_ASSET, maxTrisPerRoom: MAX_TRIS_PER_ROOM, assets: [], warn: [] };
const meshOf = {};
for (const e of manifest.assets) {
  const m = metaOf[e.id]; if (!m) continue;
  let mesh = null;
  try { mesh = readGlb(fs.readFileSync(path.join(ROOT, e.model))); } catch (err) { ok(false, `${e.id}: GLB parses (${err.message})`); continue; }
  meshOf[e.id] = mesh;
  const chk = checkAssetMesh(e.id, mesh, m.dimensionsM, { mounting: m.mounting });
  ok(chk.errors.length === 0, `${e.id}: geometry errors: ${chk.errors.join("; ")}`);
  ok(mesh.meshCount > 0 && mesh.triCount > 0, `${e.id}: meshCount ${mesh.meshCount} > 0 · triCount ${mesh.triCount} > 0`);
  ok(mesh.units === "m", `${e.id}: the reader keeps metres (units ${mesh.units})`);
  const ext = boundsExtents(mesh.bounds);
  ok(ext.w > 0 && ext.d > 0 && ext.h > 0 && [...mesh.bounds.min, ...mesh.bounds.max].every(Number.isFinite), `${e.id}: positive finite extents ${ext.w.toFixed(3)}×${ext.d.toFixed(3)}×${ext.h.toFixed(3)} m`);
  ok(mesh.triangles.every((t) => [t.a, t.b, t.c].every((p) => p.every(Number.isFinite))), `${e.id}: no NaN/Infinity in any vertex`);
  ok(mesh.triCount <= MAX_TRIS_PER_ASSET, `${e.id}: ${mesh.triCount} triangles within the per-asset budget ${MAX_TRIS_PER_ASSET}`);
  ok(mesh.triangles.every((t) => /^#[0-9a-f]{6}$/.test(t.color) && t.opacity > 0 && t.opacity <= 1), `${e.id}: every triangle carries a #rrggbb colour + (0,1] opacity`);
  report.assets.push({ id: e.id, file: e.model, triCount: chk.triCount, meshCount: chk.meshCount, extentsM: chk.extentsM, dimsM: chk.dimsM, deviation: chk.deviation, minZ: chk.minZ, maxZ: chk.maxZ, mounting: m.mounting, withinTolerance: chk.withinTolerance, floating: chk.floating, sunk: chk.sunk, warnings: chk.warnings });
  if (chk.warnings.length) { report.warn.push({ id: e.id, minZ: chk.minZ, extentsM: chk.extentsM, dimsM: chk.dimsM, warnings: chk.warnings }); for (const w of chk.warnings) console.log(`WARN ${e.id}: ${w}`); }
}
fs.mkdirSync(path.join(HERE, "fixtures"), { recursive: true });
fs.writeFileSync(path.join(HERE, "fixtures/asset-glb-report.json"), JSON.stringify(report, null, 2) + "\n");
ok(report.assets.length === manifest.assets.length, `the report covers every registered asset (${report.assets.length}/${manifest.assets.length}) → tests/fixtures/asset-glb-report.json`);
// while a starter model is UNCHANGED (pinned by its pack sha256), its known contract drift MUST be reported — the validator may never go blind
const PACK_SHA = { "furniture.bed.queen.v1": "fa0c440046b47739e379d9548c8ad5d225df8f03cf39a52ac783f76d331305d9" };
const packValidation = exists(path.join(PACK, "docs/VALIDATION.json")) ? readJson(path.join(PACK, "docs/VALIDATION.json")) : null;
for (const v of packValidation?.assets ?? []) PACK_SHA[v.id] = v.sha256;
const pinnedWarn = (id, pred, label) => {
  const e = manifest.assets.find((a) => a.id === id);
  if (!e || !PACK_SHA[id] || sha(path.join(ROOT, e.model)) !== PACK_SHA[id]) return;   // rebuilt → the drift may legitimately be gone
  const w = report.warn.find((x) => x.id === id);
  ok(!!w && pred(w), `${id} (unchanged starter model) is LISTED as WARN: ${label}`);
};
pinnedWarn("furniture.bed.queen.v1", (w) => w.minZ > 0.1 && /floats/.test(w.warnings.join()), "floats — lowest point z ≈ 0.15 m");
pinnedWarn("bath.toilet.v1", (w) => w.minZ > 0.1 && /floats/.test(w.warnings.join()), "floats — lowest point z ≈ 0.18 m");
pinnedWarn("opening.window.unit.v1", (w) => w.minZ < 0 && /sunk/.test(w.warnings.join()), "sunk — lowest point z ≈ −0.02 m");
pinnedWarn("opening.door.interior.v1", (w) => /bounds off/.test(w.warnings.join()), "depth 0.165 m vs dimensionsM 0.12 m");
const roomBudget = checkTriBudget(STARTER_IDS.map((id) => meshOf[id]?.triCount ?? 0));
console.log(`starter pack total: ${roomBudget.roomTris} triangles across 18 assets (room budget ${MAX_TRIS_PER_ROOM}: ${roomBudget.roomOver ? "OVER" : "within"})`);

// ── §3 PERFORMANCE — the model cache: ONE fetch + ONE parse for two concurrent instances; feet memoised once ──
{
  let fetches = 0;
  const fetchBytes = async (url) => { fetches++; return fs.readFileSync(path.join(ROOT, url)); };
  const cache = createModelCache(manifest, fetchBytes);
  const id = "appliance.refrigerator.frenchdoor.v1";
  const [a, b] = await Promise.all([cache.get(id), cache.get(id)]);
  ok(a === b, "two concurrent instances of one id receive the SAME parsed mesh object");
  ok(fetches === 1 && cache.parseCount === 1 && cache.fetchCount === 1, `two instances → one fetch (${fetches}) and one parse (${cache.parseCount})`);
  const c = await cache.get(id);
  ok(c === a && cache.parseCount === 1, "a later instance still reuses the cached parse");
  const [f1, f2] = await Promise.all([cache.getFt(id), cache.getFt(id)]);
  ok(f1 === f2 && f1.units === "ft" && near(boundsExtents(f1.bounds).w, boundsExtents(a.bounds).w * FT_PER_M, 1e-9), "the feet mesh is converted once and memoised (1 m = 3.280839895 ft)");
  ok(a.units === "m", "the cached metre mesh is NOT mutated by the feet conversion");
  let rejected = false;
  await cache.get("no.such.asset.v9").catch(() => { rejected = true; });
  ok(rejected && cache.parseCount === 1, "an unknown id rejects (never a blank mesh, never a parse)");
  resetModelCache(manifest);
  await getAssetMesh(id, manifest, fetchBytes); await getAssetMesh(id, manifest, fetchBytes);
  ok(cacheFor(manifest)?.parseCount === 1, "getAssetMesh(id, manifest, fetchBytes) memoises per manifest — two calls, one parse");
  resetModelCache(manifest);
  ok(modelUrl(manifest, id, "/architect-2525/assets") === "/architect-2525/assets/models/refrigerator.glb" && manifestEntry(manifest, id).label === "Refrigerator", "modelUrl joins the base url and the pack's relative model path");
}

// ── §4 PLACEMENT — feet at the boundary · 90° yaw maps width → depth · translate · instances share the mesh ──
{
  const sofa = meshOf["furniture.sofa.3seat.v1"];
  const ft = toFeet(sofa), e0 = boundsExtents(ft.bounds);
  ok(ft.units === "ft" && near(e0.w, 2.1 * FT_PER_M, 1e-6) && near(e0.d, 0.86 * FT_PER_M, 1e-6), `toFeet: sofa 2.10 × 0.86 m → ${e0.w.toFixed(3)} × ${e0.d.toFixed(3)} ft`);
  const r90 = transformMesh(ft, { x: 0, y: 0, z: 0 }, 90), e90 = boundsExtents(r90.bounds);
  ok(near(e90.w, e0.d, 1e-9) && near(e90.d, e0.w, 1e-9) && near(e90.h, e0.h, 1e-9), "a 90° yaw maps width → depth exactly (cardinal yaws are exact, no 6e-17 drift)");
  ok(near(r90.bounds.min[2], ft.bounds.min[2]) && near(r90.bounds.max[2], ft.bounds.max[2]), "yaw about Z never tilts the asset off the floor");
  const mv = transformMesh(ft, { x: 5, y: 3, z: 0.5 }, 0);
  ok(near(mv.bounds.min[0] - ft.bounds.min[0], 5) && near(mv.bounds.min[1] - ft.bounds.min[1], 3) && near(mv.bounds.min[2] - ft.bounds.min[2], 0.5), "translate shifts the bounds by exactly the placement");
  const r180 = transformMesh(ft, { x: 0, y: 0, z: 0 }, 180), r360 = transformMesh(ft, { x: 0, y: 0, z: 0 }, 360);
  ok(near(boundsExtents(r180.bounds).w, e0.w) && near(r360.bounds.min[0], ft.bounds.min[0]), "180° keeps the extents; 360° is the identity");
  const before = JSON.stringify(sofa.bounds);
  const i1 = instanceTriangles(sofa, { x: 5, y: 5, z: 0, rotationDeg: 90 }), i2 = instanceTriangles(sofa, { x: 1, y: 1, z: 0, rotationDeg: 0 });
  ok(i1.length === sofa.triCount && i2.length === sofa.triCount, "instanceTriangles returns every triangle of the shared mesh for each instance");
  ok(JSON.stringify(sofa.bounds) === before && sofa.units === "m", "the shared (cached) mesh is untouched by instancing — transforms are per instance");
  ok(i1.every((t) => t.a.length === 3) && !i1.some((t) => t.a.some((v) => !Number.isFinite(v))), "instance triangles are finite 3-vectors in feet");
  let threw = false; try { transformMesh(ft, { x: NaN, y: 0, z: 0 }, 0); } catch { threw = true; }
  ok(threw, "a non-finite placement throws (NaN never reaches a face)");
  // node transforms: a translated node moves its mesh by the TRS (the reader applies node matrices)
  const n = nodeMatrix({ translation: [1, 2, 3], rotation: [0, 0, Math.SQRT1_2, Math.SQRT1_2], scale: [2, 2, 2] });
  const p = mat4Apply(n, [1, 0, 0]);
  ok(near(p[0], 1, 1e-9) && near(p[1], 4, 1e-9) && near(p[2], 3, 1e-9), "nodeMatrix composes T·R·S (90° about Z, ×2, +[1,2,3]: [1,0,0] → [1,4,3])");
}

// ── §5 PROJECTION — triangles bridge into the ONE solidFaces painter as 3-vertex faces, shade-tagged by normal ──
{
  const stud = meshOf[STUD_2X4.id];
  const faces = meshToFaces(stud);
  ok(faces.length === 12 && faces.every((f) => f.pts.length === 3), `the stud's 12 triangles become 12 three-vertex faces (${faces.length})`);
  const kinds = faces.reduce((m, f) => ((m[f.kind] = (m[f.kind] ?? 0) + 1), m), {});
  ok(kinds.top === 2 && kinds.floor === 2 && kinds.front === 4 && kinds.side === 4, `face kinds from normals: top 2 · floor 2 · front 4 · side 4 (got ${JSON.stringify(kinds)})`);
  ok(faces.every((f) => f.color === MATERIALS.WOOD.fill && f.opacity === 1), "the stud's faces carry the WOOD material colour (ONLY WOOD IS TAN — FRAME_COLOR, one source)");
  ok(faceKindOfNormal([0, 0, 1]) === "top" && faceKindOfNormal([0, 0, -1]) === "floor" && faceKindOfNormal([0, 1, 0]) === "front" && faceKindOfNormal([1, 0, 0]) === "side", "faceKindOfNormal: +z top · −z floor · ±y front · ±x side (the walk's wall tagging)");
  ok(Object.keys(FACE_SHADE).includes(faces[0].kind), "the tagged kinds are FACE_SHADE keys (the shared shader applies unchanged)");
  const ortho = (p) => ({ x: p[0] * 100, y: -p[2] * 100, depth: p[1] + 10 });   // a never-refusing projector
  const painted = solidFaces(faces, ortho);
  ok(painted.length === 12 && painted.every((f) => f.d.split(" ").length === 3), "solidFaces paints 3-vertex faces unchanged (no change to lib/solid-shade.ts)");
  ok(painted.every((f, i) => i === 0 || painted[i - 1].depth >= f.depth), "painter order FAR → NEAR holds for triangles");
  const glass = meshOf["bath.shower.enclosure.v1"];
  ok(meshToFaces(glass).some((f) => f.opacity < 1), "the shower's glass triangles carry their BLEND opacity through the bridge");
}

// ── §6 WRITER — round trip: composition → writeGlb → parseGlb → the same bounds, triangles, colour; byte-stable ──
{
  const bytes = writeGlb(compositionGlbInput(STUD_2X4));
  const doc = parseGlb(bytes);
  ok(doc.json.asset.version === "2.0" && doc.json.asset.generator === GLB_GENERATOR, `the GLB is glTF 2.0 stamped ${GLB_GENERATOR}`);
  const mesh = gltfTriangles(doc);
  const want = compositionBounds(STUD_2X4);
  ok(mesh.triCount === 12 * STUD_2X4.parts.length && mesh.meshCount === STUD_2X4.parts.length, `round trip: ${mesh.triCount} triangles · ${mesh.meshCount} mesh(es)`);
  ok([0, 1, 2].every((i) => near(mesh.bounds.min[i], want.min[i], 1e-6) && near(mesh.bounds.max[i], want.max[i], 1e-6)), "round trip: bounds equal the composition's boxes");
  const ext = boundsExtents(mesh.bounds);
  ok(near(ext.w, 0.0381, 1e-4) && near(ext.d, 0.0889, 1e-4) && near(ext.h, 2.4384, 1e-4), `the stud is 1½″ × 3½″ × 8′ in metres (${ext.w.toFixed(4)} × ${ext.d.toFixed(4)} × ${ext.h.toFixed(4)})`);
  ok(near(mesh.bounds.min[2], 0) && near(mesh.bounds.min[0], -0.0381 / 2, 1e-6) && near(mesh.bounds.min[1], -0.0889 / 2, 1e-6), "origin is floor-centre (z 0, footprint centred on the origin)");
  ok(mesh.materials.length === 1 && mesh.materials[0] === MATERIALS.WOOD.fill, `the material colour round-trips to ${MATERIALS.WOOD.fill} (baseColorFactor ↔ hex)`);
  ok(Buffer.compare(Buffer.from(bytes), Buffer.from(writeGlb(compositionGlbInput(STUD_2X4)))) === 0, "writeGlb is byte-stable (no clock, no random)");
  ok(Buffer.compare(Buffer.from(bytes), fs.readFileSync(path.join(ROOT, "models/stud_2x4.glb"))) === 0, "the served models/stud_2x4.glb IS the current build's bytes (public never stale)");
  ok(JSON.stringify(readJson(path.join(ROOT, "metadata/stud_2x4.json"))) === JSON.stringify(compositionMetadata(STUD_2X4)), "the served metadata/stud_2x4.json IS the composition's metadata");
  ok(hexToBaseColor("#ff8000")[0] === 1 && near(hexToBaseColor("#ff8000")[1], 128 / 255) && hexToBaseColor("#ff8000")[2] === 0, "hexToBaseColor maps #rrggbb → [r,g,b] /255");
  ok(boxMesh({ x: 0, y: 0, z: 0, w: 1, d: 1, h: 1 }).indices.length === 36, "boxMesh is 12 triangles");
  // refusals
  const throws = (f) => { try { f(); return false; } catch { return true; } };
  ok(throws(() => parseGlb(new Uint8Array(10))), "parseGlb refuses a truncated header");
  const badMagic = new Uint8Array(bytes); badMagic[0] = 0x00;
  ok(throws(() => parseGlb(badMagic)), "parseGlb refuses a bad magic");
  ok(throws(() => parseGlb(bytes.subarray(0, bytes.byteLength - 4))), "parseGlb refuses a header length that does not match the bytes");
  const badVer = new Uint8Array(bytes); badVer[4] = 1;
  ok(throws(() => parseGlb(badVer)), "parseGlb refuses container version 1");
  ok(throws(() => writeGlb({ parts: [{ name: "x", material: "nope", box: { x: 0, y: 0, z: 0, w: 1, d: 1, h: 1 } }], materials: [] })), "writeGlb refuses an unknown material");
  ok(throws(() => writeGlb({ parts: [{ name: "x", material: "m", box: { x: 0, y: 0, z: 0, w: 0, d: 1, h: 1 } }], materials: [{ name: "m", baseColorFactor: [1, 1, 1, 1] }] })), "writeGlb refuses a zero-extent box");
  // a NaN vertex in the BIN is refused by the reader, never carried into a face
  const nanBytes = new Uint8Array(bytes);
  const dv = new DataView(nanBytes.buffer);
  const jsonLen = dv.getUint32(12, true);
  const binStart = 20 + jsonLen + 8;
  const posView = doc.json.bufferViews[doc.json.accessors[doc.json.meshes[0].primitives[0].attributes.POSITION].bufferView];
  dv.setFloat32(binStart + posView.byteOffset, NaN, true);
  ok(throws(() => gltfTriangles(parseGlb(nanBytes))), "a NaN vertex in the BIN chunk is refused (throws), never painted");
}

// ── §7 BUDGET — a WARN flag, never a throw ──
{
  const b1 = checkTriBudget([700, 100]);
  ok(b1.assetOver && !b1.roomOver && b1.warnings.length === 1, `one 700-tri instance → assetOver (warn: ${b1.warnings[0]})`);
  const b2 = checkTriBudget(Array(50).fill(100));
  ok(!b2.assetOver && b2.roomOver && b2.roomTris === 5000, "50 × 100 tris → roomOver (5000 > 4000)");
  const b3 = checkTriBudget([NaN, -1, Infinity]);
  ok(!b3.assetOver && !b3.roomOver && b3.roomTris === 0, "garbage counts are zeroed, never thrown");
  ok(MAX_TRIS_PER_ASSET === 600 && MAX_TRIS_PER_ROOM === 4000, "budget constants: 600 per asset · 4000 per room");
}

// ── §8 RUNTIME ENTRY — loadAssetMeshFt exists, never fetches at import, and serves the browser path end-to-end ──
{
  const origFetch = globalThis.fetch;
  let calls = 0, urls = [];
  globalThis.fetch = async (url) => {
    calls++; urls.push(String(url));
    const rel = String(url).replace(/^\/architect-2525\/assets\//, "");
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) return { ok: false, status: 404, json: async () => ({}), arrayBuffer: async () => new ArrayBuffer(0) };
    const buf = fs.readFileSync(p);
    return { ok: true, status: 200, json: async () => JSON.parse(buf.toString("utf8")), arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
  };
  try {
    const RT = await import("../lib/architect-2525/assets/index-runtime.ts");
    ok(typeof RT.loadAssetMeshFt === "function" && RT.ASSET_BASE_URL === "/architect-2525/assets", "index-runtime exports loadAssetMeshFt and the served base url");
    ok(calls === 0, "importing index-runtime performs no fetch");
    RT.resetRuntimeAssets();
    const m1 = await RT.loadAssetMeshFt("furniture.sofa.3seat.v1");
    ok(m1.units === "ft" && m1.triCount === 144, `loadAssetMeshFt serves the sofa in feet (${m1.triCount} tris)`);
    ok(calls === 2 && urls[0] === "/architect-2525/assets/manifest.json" && urls[1] === "/architect-2525/assets/models/sofa_3seat.glb", `the browser path fetches the manifest then the GLB (${urls.join(" · ")})`);
    const m2 = await RT.loadAssetMeshFt("furniture.sofa.3seat.v1");
    ok(m2 === m1 && calls === 2, "a second placement of the same id fetches nothing and parses nothing");
    await RT.loadAssetMeshFt("furniture.dining_chair.v1");
    ok(calls === 3, "a different id fetches only its own GLB (the manifest is fetched once per page)");
    let bad = false; await RT.loadAssetMeshFt("no.such.asset.v9").catch(() => { bad = true; });
    ok(bad, "an unknown id rejects through the runtime entry");
    RT.resetRuntimeAssets();
  } finally { globalThis.fetch = origFetch; }
}

console.log(`architect-asset-glb: ${pass} passed, ${fail} failed · WARN ${report.warn.length} (tests/fixtures/asset-glb-report.json)`);
process.exit(fail ? 1 : 0);

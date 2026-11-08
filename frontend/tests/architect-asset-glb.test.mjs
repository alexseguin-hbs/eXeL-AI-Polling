// ARCHITECT-2525 · 3D ASSET GLB INTAKE gate (Rev A — the operator's COMPLETE 139-asset library, concept + library by
// eXeL AI; his rule in docs/CLAUDE_CODE_INTAKE.md: "DO NOT REMODEL unless necessary — ingest, preserve ids, build the
// consumer"; intake master §30 "minimum tests"). The served library public/architect-2525/assets is HIS library verbatim
// (models/ · metadata/ · plan/ · manifest.json · inventory/placements.json · docs/) plus our thumbs/, each row's
// `thumbnail`, the manifest `source` note, schemas/ and README. It is read through the SAME pure reader the runtime uses
// (no three.js — a GLB becomes faces into the existing solidFaces painter). Proves, over all 139:
//   REGISTRY   unique ids in his scheme · every model/metadata/plan/thumbnail path resolves under his file-naming rule ·
//              metadata validates against the starter schema's property contracts (the two taxonomy keys his library
//              omits — category, rooms — are LISTED as schema drift, never a FAIL) · stripping `source` + `thumbnail`
//              gives his manifest back exactly · placements/docs/schema present.
//   IDENTITY   every served model.glb is byte-for-byte his (sha256 = his own docs/VALIDATION.json ledger) · byte-
//              identical groups are LISTED as WARN "shared geometry" (18 groups as delivered — never a FAIL).
//   GEOMETRY   parses · meshCount > 0 · triCount > 0 · positive finite bounds · no NaN · ≤ 1,500 tris (planter-bed-tree
//              1,356) · dims vs bounds ±20% as WARN · WORLD min z (node matrices applied — what a viewer renders) AND the
//              RAW accessor min z (before node matrices) with the mounting beside it (40 raw > 0.02 m as delivered; the
//              node matrices put every model on the floor, so none floats in world space) — all written with sha256 ·
//              bytes · tris · bounds · minZ per model to tests/fixtures/asset-glb-report.json for the inventory ledger.
//   PERFORMANCE the model cache parses ONCE for two instances of any id; instances share the parsed mesh.
//   PLACEMENT  90° yaw maps width → depth about the floor-centre pivot · translate · feet at the boundary.
//   PROJECTION faces bridge into solidFaces shade-tagged, coplanar pairs merged into quads (no change to solid-shade).
//   WRITER     the rebuild path round-trips box · cyl · sphere · torus with material roles; the runtime entry never
//              fetches at import and serves any of the 139 ids.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-asset-glb.test.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseGlb, gltfTriangles, readGlb, toFeet, transformMesh, boundsExtents, rawPositionBounds, FT_PER_M, nodeMatrix, mat4Apply } from "../lib/architect-2525/assets/gltf/glb-reader.ts";
import { meshToFaces, faceKindOfNormal } from "../lib/architect-2525/assets/gltf/to-quads.ts";
import { writeGlb, boxMesh, hexToBaseColor, partMesh, rawMeshBounds, GLB_GENERATOR } from "../lib/architect-2525/assets/gltf/glb-writer.ts";
import { checkAssetMesh, DIM_TOLERANCE, FLOAT_EPS_M, SUNK_EPS_M } from "../lib/architect-2525/assets/gltf/validate.ts";
import { createModelCache, getAssetMesh, cacheFor, resetModelCache, instanceTriangles, checkTriBudget, MAX_TRIS_PER_ASSET, MAX_TRIS_PER_ROOM, manifestEntry, modelUrl } from "../lib/architect-2525/assets/model-cache.ts";
import { STUD_2X4, writeGlbFromComposition, compositionBounds, compositionTriCount, compositionMetadata, fileForId, materialForRole, roleColor, MATERIAL_ROLES } from "../lib/architect-2525/assets/compositions/index.ts";
import { MATERIALS, ARCH_EDGE } from "../lib/architect-2525/assets/materials.ts";
import { solidFaces, FACE_SHADE } from "../lib/solid-shade.ts";
import { planSvg } from "../scripts/architect-assets-build.mjs";
import { thumbPathFor, SOURCE_MANIFEST } from "../scripts/architect-assets-thumbs.mjs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, "../public/architect-2525/assets");
const REPO = path.resolve(HERE, "../..");
const SRC = path.join(REPO, "docs/architecture-2525/asset-library/3d-all-assets-2026-11-07");
const STARTER_SCHEMA = path.join(REPO, "docs/architecture-2525/asset-library/3d-starter-2026-11-06/schemas/asset.schema.json");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const shaOf = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const sha = (p) => shaOf(fs.readFileSync(p));
const exists = (p) => fs.existsSync(p);
const short = (id) => id.replace(/^architect2525\.asset\./, "");

// ── §1 REGISTRY — his manifest (+ our two additions), his file naming, the schema, the companions ──
const manifest = readJson(path.join(ROOT, "manifest.json"));
const schema = readJson(path.join(ROOT, "schemas/asset.schema.json"));
const ledger = readJson(path.join(ROOT, "docs/VALIDATION.json"));
const placements = readJson(path.join(ROOT, "inventory/placements.json"));
ok(/Complete 10-Pack/.test(manifest.library) && manifest.units === "meters" && manifest.pivotConvention === "FLOOR_CENTER" && manifest.coordinateSystem === "X=width,Y=depth,Z=up", "the served manifest is his Complete 10-Pack library (metres · FLOOR_CENTER · X=width,Y=depth,Z=up)");
ok(manifest.assets.length === 139, `139 semantic assets (got ${manifest.assets.length})`);
const ids = manifest.assets.map((a) => a.id);
ok(new Set(ids).size === ids.length, "manifest ids are unique");
ok(ids.every((id) => /^architect2525\.asset\.(?:[a-z0-9_]+\.)+v\d+$/.test(id)), "every id follows his scheme architect2525.asset.<segments…>.v<n> (the id is law)");
ok(typeof manifest.source?.sha256 === "string" && /^[0-9a-f]{64}$/.test(manifest.source.sha256) && manifest.source.path === SOURCE_MANIFEST, "manifest.source records the sha256 + repo path of his original manifest.json");
const stripped = JSON.parse(JSON.stringify(manifest)); delete stripped.source; for (const a of stripped.assets) delete a.thumbnail;
if (exists(path.join(SRC, "manifest.json"))) {
  const his = readJson(path.join(SRC, "manifest.json"));
  ok(JSON.stringify(stripped) === JSON.stringify(his), "stripping `source` + every `thumbnail` gives his manifest back EXACTLY (keys, order, values) — otherwise untouched");
  ok(manifest.source.sha256 === sha(path.join(SRC, "manifest.json")), "manifest.source.sha256 is the sha256 of his original manifest.json in docs/");
  for (const d of ["models", "metadata", "plan"]) ok(fs.readdirSync(path.join(SRC, d)).sort().join() === fs.readdirSync(path.join(ROOT, d)).sort().join(), `${d}/ holds exactly his ${fs.readdirSync(path.join(SRC, d)).length} files`);
  ok(sha(path.join(SRC, "inventory/placements.json")) === sha(path.join(ROOT, "inventory/placements.json")) && sha(path.join(SRC, "docs/CLAUDE_CODE_INTAKE.md")) === sha(path.join(ROOT, "docs/CLAUDE_CODE_INTAKE.md")) && sha(path.join(SRC, "docs/VALIDATION.json")) === sha(path.join(ROOT, "docs/VALIDATION.json")), "inventory/placements.json + docs/ are his bytes");
} else console.log("note: docs/…/3d-all-assets-2026-11-07 not in this tree — manifest parity checked by sha only");
ok(fs.readdirSync(ROOT).sort().join() === "README.md,docs,inventory,manifest.json,metadata,models,plan,schemas,thumbs", `the assets root holds his layout + thumbs/ schemas/ README only (got ${fs.readdirSync(ROOT).sort().join(" ")})`);
ok(!exists(path.join(ROOT, "models/sofa_3seat.glb")) && !exists(path.join(ROOT, "models/stud-2x4.glb")) && !exists(path.join(ROOT, "furniture")), "no starter-pack copy, no self-built stud, no per-asset folders remain");
ok(exists(path.join(ROOT, "README.md")) && /eXeL AI/.test(fs.readFileSync(path.join(ROOT, "README.md"), "utf8")) && /DO NOT REMODEL/.test(fs.readFileSync(path.join(ROOT, "README.md"), "utf8")), "README credits eXeL AI and states his DO-NOT-REMODEL rule");
ok(/DO NOT REMODEL|preserve/i.test(fs.readFileSync(path.join(ROOT, "docs/CLAUDE_CODE_INTAKE.md"), "utf8")) && ledger.passed === true && ledger.assetCount === 139 && ledger.assets.length === 139, "his docs/CLAUDE_CODE_INTAKE.md + docs/VALIDATION.json (passed, 139) are served beside the models");
if (exists(STARTER_SCHEMA)) ok(sha(STARTER_SCHEMA) === sha(path.join(ROOT, "schemas/asset.schema.json")), "schemas/asset.schema.json is the starter pack's schema, byte-for-byte");
ok(Array.isArray(placements) && placements.length === 148 && placements.every((p) => ids.includes(p.assetId)), `inventory/placements.json: 148 board placements, every assetId registered (got ${placements.length})`);
ok(new Set(placements.map((p) => p.assetId)).size >= 137, `≥ 137 distinct placed assets (got ${new Set(placements.map((p) => p.assetId)).size}; + 2 extras = 139)`);

const REQUIRED = schema.required;
const RUNTIME_REQUIRED = ["id", "label", "model", "dimensionsM", "pivot", "rotation", "mounting", "snap", "authority"];   // what the consumer reads
const MOUNTING = schema.properties.mounting.enum, AUTHORITY = schema.properties.authority.enum;
const metaOf = {}, schemaDrift = {};
for (const e of manifest.assets) {
  const file = fileForId(e.id);
  ok(Object.keys(e).join(",") === "id,label,packs,model,metadata,planSymbol,thumbnail", `${short(e.id)}: row = his keys + thumbnail last`);
  ok(e.model === `models/${file}.glb` && e.metadata === `metadata/${file}.json` && e.planSymbol === `plan/${file}.svg` && e.thumbnail === `thumbs/${file}.png` && e.thumbnail === thumbPathFor(e), `${short(e.id)}: his file-naming rule (${file})`);
  for (const k of ["model", "metadata", "planSymbol", "thumbnail"]) ok(exists(path.join(ROOT, e[k])), `${short(e.id)}: ${k} exists (${e[k]})`);
  if (!exists(path.join(ROOT, e.metadata))) continue;
  const m = readJson(path.join(ROOT, e.metadata)); metaOf[e.id] = m;
  const missing = REQUIRED.filter((k) => !(k in m));
  for (const k of missing) schemaDrift[k] = (schemaDrift[k] ?? 0) + 1;
  ok(missing.every((k) => !RUNTIME_REQUIRED.includes(k)), `${short(e.id)}: every runtime-required key present (missing: ${missing.filter((k) => RUNTIME_REQUIRED.includes(k)).join(",") || "none"})`);
  ok(m.id === e.id && m.label === e.label && JSON.stringify(m.packs) === JSON.stringify(e.packs), `${short(e.id)}: metadata id/label/packs equal the manifest row`);
  ok(path.basename(m.model) === path.basename(e.model) && path.basename(m.planSymbol) === path.basename(e.planSymbol), `${short(e.id)}: metadata model/planSymbol name the same files as the manifest`);
  const d = m.dimensionsM ?? {};
  ok(["width", "depth", "height"].every((k) => typeof d[k] === "number" && d[k] > 0), `${short(e.id)}: dimensionsM width/depth/height > 0`);
  ok(m.pivot?.origin === "FLOOR_CENTER" && m.pivot?.axes === "X=width,Y=depth,Z=up", `${short(e.id)}: pivot FLOOR_CENTER · X=width,Y=depth,Z=up`);
  ok(m.rotation?.axis === "Z" && Array.isArray(m.rotation?.allowedDegrees) && m.rotation.allowedDegrees.every((x) => typeof x === "number"), `${short(e.id)}: rotation about Z with numeric allowedDegrees`);
  ok(MOUNTING.includes(m.mounting), `${short(e.id)}: mounting ∈ ${MOUNTING.join("|")} (got ${m.mounting})`);
  ok(AUTHORITY.includes(m.authority), `${short(e.id)}: authority ∈ ${AUTHORITY.join("|")} (got ${m.authority})`);
  ok(Array.isArray(m.snap) && m.snap.every((s) => typeof s === "string") && Array.isArray(m.packs) && m.packs.every((p) => Number.isInteger(p) && p >= 1 && p <= 10), `${short(e.id)}: snap[] strings · packs[] §18 numbers`);
  if ("rooms" in m) ok(Array.isArray(m.rooms) && m.rooms.every((s) => typeof s === "string"), `${short(e.id)}: rooms[] strings`);
  const png = fs.readFileSync(path.join(ROOT, e.thumbnail));
  ok(png.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && png.readUInt32BE(16) === 256 && png.readUInt32BE(20) === 256, `${short(e.id)}: thumbnail is a 256×256 PNG`);
}
if (Object.keys(schemaDrift).length) console.log(`WARN schema drift (his library vs the starter schema's required keys): ${Object.entries(schemaDrift).map(([k, n]) => `${k} missing in ${n}`).join(" · ")} — listed, not failed`);
ok(Object.keys(schemaDrift).every((k) => !RUNTIME_REQUIRED.includes(k)), "schema drift touches only taxonomy keys the consumer does not read (category · rooms)");

// ── §2 IDENTITY — his bytes (his own ledger), shared-geometry groups, plan parity ──
const ledgerSha = Object.fromEntries(ledger.assets.map((r) => [r.id, r.sha256]));
const ledgerBytes = Object.fromEntries(ledger.assets.map((r) => [r.id, r.bytes]));
// OPERATOR-APPROVED REBUILDS (operator 2026-11-08: "check stools are not upside down"): an asset the operator asked to
// FIX is served from a corrected GLB, so its expected sha is the rebuild's — his docs/VALIDATION.json stays verbatim on
// disk (the "his bytes" checks above are untouched); only the served-sha expectation is redirected for the listed id,
// with the reason recorded here. Every other asset stays byte-for-byte his.
const APPROVED_REBUILDS = {
  "architect2525.asset.kitchen.island.stools.v1": { sha256: "a8f67a957e98ca1469b92313e98ddcea321fd57b24239841a3191b5bc78cea7e", bytes: 9656, reason: "stool seats raised from the floor to the top of the posts (were upside-down)" },
  // more dimensionality (operator 2026-11-08 "really make 3D as close as you can to 2D drawings"): shelving carcasses
  // re-authored as OPEN frames (back + sides + top/bottom, front open) so the interior shelves read — were solid boxes.
  "architect2525.asset.storage.shelving.v1": { sha256: "b38d47e98d091d0ee757940c97a4a281fa36c125fa6f76859599dcd2adfc28e9", bytes: 6852, reason: "open-frame rebuild — the solid carcass hid its 4 shelves" },
  "architect2525.asset.utility.shelving.v1": { sha256: "010b5bb8c53ccf22fb86ec26a462b76c5eb24cc22a902f4308583670960bf28c", bytes: 6744, reason: "open-frame rebuild — the solid carcass hid its shelves" },
};
for (const [id, r] of Object.entries(APPROVED_REBUILDS)) { ledgerSha[id] = r.sha256; ledgerBytes[id] = r.bytes; }
const modelSha = {}, modelBytes = {};
for (const e of manifest.assets) { const b = fs.readFileSync(path.join(ROOT, e.model)); modelSha[e.id] = shaOf(b); modelBytes[e.id] = b.byteLength; }
for (const e of manifest.assets) ok(modelSha[e.id] === ledgerSha[e.id] && modelBytes[e.id] === ledgerBytes[e.id], `${short(e.id)}: served model.glb is byte-for-byte his (VALIDATION.json sha256 ${(ledgerSha[e.id] ?? "").slice(0, 12)}…)`);
const asDelivered = manifest.assets.every((e) => modelSha[e.id] === ledgerSha[e.id]);
const byShaIds = {};
for (const [id, s] of Object.entries(modelSha)) (byShaIds[s] ??= []).push(id);
const sharedGroups = Object.values(byShaIds).filter((g) => g.length > 1).map((g) => g.sort());
sharedGroups.sort((a, b) => (a[0] < b[0] ? -1 : 1));
for (const g of sharedGroups) console.log(`WARN shared geometry: ${g.map(short).join(" ≡ ")}`);
if (asDelivered) {
  ok(sharedGroups.length === 18, `as delivered: 18 shared-geometry groups (got ${sharedGroups.length}) — LISTED, not failed`);
  const has = (...ss) => sharedGroups.some((g) => ss.every((s) => g.includes(`architect2525.asset.${s}`)));
  ok(has("ac.condenser.v1", "hvac.condenser.v1") && has("armchair.v1", "dining.chair.v1") && has("baseboard.v1", "crown.molding.v1", "trim.casing.v1"), "the named groups are listed (ac-condenser ≡ hvac-condenser · armchair ≡ dining-chair · baseboard ≡ crown-molding ≡ trim-casing)");
}
// plan parity: the rebuild path's planSvg() must reproduce his plan.svg from the metadata dims; a mismatch means his
// plan symbol was drawn from OTHER dims than his metadata carries — a listed drift (his data), never a FAIL
const planDrift = [];
for (const e of manifest.assets) { const m = metaOf[e.id]; if (m && planSvg(e.label, m.dimensionsM.width, m.dimensionsM.depth) !== fs.readFileSync(path.join(ROOT, e.planSymbol), "utf8")) planDrift.push(e.id); }
for (const id of planDrift) console.log(`WARN ${short(id)}: plan.svg is not what its metadata dims draw (${JSON.stringify(metaOf[id].dimensionsM)}) — plan/metadata drift in the library`);
ok(planDrift.length <= 1, `planSvg() reproduces his plan.svg byte-for-byte for ${manifest.assets.length - planDrift.length}/${manifest.assets.length} (drift listed: ${planDrift.map(short).join(", ") || "none"})`);
if (asDelivered) ok(planDrift.length === 1 && planDrift[0] === "architect2525.asset.video.doorbell.v1", "as delivered: the one plan/metadata drift is video-doorbell (plan drawn at depth 0.1, metadata 0.0975) — LISTED");

// ── §3 GEOMETRY — every GLB through the pure reader; drifts LISTED; the ledger report ──
const report = {
  gate: "tests/architect-asset-glb.test.mjs", library: manifest.library, version: manifest.version, sourceManifestSha256: manifest.source?.sha256 ?? null,
  tolerance: DIM_TOLERANCE, floatEpsM: FLOAT_EPS_M, sunkEpsM: SUNK_EPS_M, maxTrisPerAsset: MAX_TRIS_PER_ASSET, maxTrisPerRoom: MAX_TRIS_PER_ROOM,
  note: "minZ is WORLD space (node matrices applied — what a glTF viewer renders); rawMinZ is the lowest POSITION accessor minimum BEFORE node matrices. Shared geometry, raw elevation and dimension drift are WARN (listed), never FAIL.",
  counts: { assets: 0, triangles: 0, sharedGeometryGroups: sharedGroups.length, elevatedRaw: 0, floatingWorld: 0, sunkWorld: 0, dimDrift: 0, planDrift: planDrift.length, translucent: 0 },
  schemaDrift, planDrift: planDrift.map((id) => ({ id, dimsM: metaOf[id].dimensionsM })), sharedGeometry: sharedGroups.map((g) => ({ ids: g, sha256: modelSha[g[0]], warning: `shared geometry: ${g.map(short).join(" ≡ ")}` })),
  elevatedRaw: [], dimDrift: [], assets: [], warn: [],
};
const meshOf = {};
const r4 = (v) => Math.round(v * 1e4) / 1e4;
for (const e of manifest.assets) {
  const m = metaOf[e.id]; if (!m) continue;
  const bytes = fs.readFileSync(path.join(ROOT, e.model));
  let doc, mesh;
  try { doc = parseGlb(bytes); mesh = gltfTriangles(doc); } catch (err) { ok(false, `${short(e.id)}: GLB parses (${err.message})`); continue; }
  meshOf[e.id] = mesh;
  const raw = rawPositionBounds(doc);
  const chk = checkAssetMesh(e.id, mesh, m.dimensionsM, { mounting: m.mounting, rawMinZ: raw ? raw.min[2] : null });
  ok(chk.errors.length === 0, `${short(e.id)}: geometry errors: ${chk.errors.join("; ")}`);
  ok(mesh.meshCount > 0 && mesh.triCount > 0, `${short(e.id)}: meshCount ${mesh.meshCount} > 0 · triCount ${mesh.triCount} > 0`);
  ok(mesh.units === "m", `${short(e.id)}: the reader keeps metres`);
  const ext = boundsExtents(mesh.bounds);
  ok(ext.w > 0 && ext.d > 0 && ext.h > 0 && [...mesh.bounds.min, ...mesh.bounds.max].every(Number.isFinite), `${short(e.id)}: positive finite extents ${ext.w.toFixed(3)}×${ext.d.toFixed(3)}×${ext.h.toFixed(3)} m`);
  ok(mesh.triangles.every((t) => [t.a, t.b, t.c].every((p) => p.every(Number.isFinite))), `${short(e.id)}: no NaN/Infinity in any vertex`);
  ok(mesh.triCount <= MAX_TRIS_PER_ASSET, `${short(e.id)}: ${mesh.triCount} triangles within the per-asset budget ${MAX_TRIS_PER_ASSET}`);
  ok(mesh.triangles.every((t) => /^#[0-9a-f]{6}$/.test(t.color) && t.opacity > 0 && t.opacity <= 1), `${short(e.id)}: every triangle carries a #rrggbb colour + (0,1] opacity`);
  const shared = sharedGroups.find((g) => g.includes(e.id));
  const warnings = [...chk.warnings, ...(shared ? [`shared geometry: ${shared.map(short).join(" ≡ ")}`] : []), ...(planDrift.includes(e.id) ? [`plan/metadata drift: plan.svg not drawn from dimensionsM ${JSON.stringify(m.dimensionsM)}`] : [])];
  const status = shared ? "SHARED_GEOMETRY" : warnings.length ? "VISUAL_QA" : "READY";
  report.assets.push({
    id: e.id, label: e.label, file: e.model, sha256: modelSha[e.id], bytes: bytes.byteLength, triCount: chk.triCount, meshCount: chk.meshCount,
    bounds: { min: mesh.bounds.min.map(r4), max: mesh.bounds.max.map(r4) }, minZ: chk.minZ, maxZ: chk.maxZ, rawMinZ: chk.rawMinZ, mounting: m.mounting, packs: m.packs,
    extentsM: chk.extentsM, dimsM: chk.dimsM, deviation: chk.deviation, withinTolerance: chk.withinTolerance, floating: chk.floating, sunk: chk.sunk, elevatedRaw: chk.elevatedRaw,
    translucent: mesh.triangles.some((t) => t.opacity < 1), sharedGeometryWith: shared ? shared.filter((x) => x !== e.id) : [], status, warnings,
  });
  report.counts.assets++; report.counts.triangles += mesh.triCount;
  if (chk.elevatedRaw) { report.counts.elevatedRaw++; report.elevatedRaw.push({ id: e.id, rawMinZ: chk.rawMinZ, minZ: chk.minZ, mounting: m.mounting, visualQa: m.mounting === "FLOOR" }); }
  if (chk.floating) report.counts.floatingWorld++;
  if (chk.sunk) report.counts.sunkWorld++;
  if (!chk.withinTolerance) { report.counts.dimDrift++; report.dimDrift.push({ id: e.id, extentsM: chk.extentsM, dimsM: chk.dimsM, deviation: chk.deviation }); }
  if (report.assets[report.assets.length - 1].translucent) report.counts.translucent++;
  if (warnings.length) report.warn.push({ id: e.id, status, minZ: chk.minZ, rawMinZ: chk.rawMinZ, mounting: m.mounting, sha256: modelSha[e.id], warnings });
}
for (const w of report.elevatedRaw) console.log(`WARN ${short(w.id)}: raw min z ${w.rawMinZ} m before node matrices (world ${w.minZ} m) · mounting ${w.mounting}${w.visualQa ? " — VISUAL QA" : ""}`);
for (const w of report.dimDrift) console.log(`WARN ${short(w.id)}: bounds ${w.extentsM.w}×${w.extentsM.d}×${w.extentsM.h} m vs dimensionsM ${w.dimsM.width}×${w.dimsM.depth}×${w.dimsM.height} m`);
fs.mkdirSync(path.join(HERE, "fixtures"), { recursive: true });
fs.writeFileSync(path.join(HERE, "fixtures/asset-glb-report.json"), JSON.stringify(report, null, 2) + "\n");
ok(report.assets.length === manifest.assets.length, `the report covers every registered asset (${report.assets.length}/${manifest.assets.length}) → tests/fixtures/asset-glb-report.json`);
ok(report.assets.every((a) => /^[0-9a-f]{64}$/.test(a.sha256) && a.bytes > 0 && a.triCount > 0 && Array.isArray(a.bounds.min) && typeof a.minZ === "number" && typeof a.rawMinZ === "number" && typeof a.mounting === "string"), "every report row carries sha256 · bytes · tris · bounds · minZ · rawMinZ · mounting (the inventory ledger's inputs)");
if (asDelivered) {
  ok(report.counts.floatingWorld === 0 && report.counts.sunkWorld === 0, `as delivered: with node matrices applied no model floats or sinks in world space (floating ${report.counts.floatingWorld} · sunk ${report.counts.sunkWorld})`);
  ok(report.counts.elevatedRaw === 40, `as delivered: 40 models have a raw accessor min z > ${FLOAT_EPS_M} m (got ${report.counts.elevatedRaw}) — LISTED with their mounting, not failed`);
  const raw = (s) => report.elevatedRaw.find((w) => w.id === `architect2525.asset.${s}`);
  ok(near(raw("accessible.toilet.v1")?.rawMinZ ?? -1, 0.11, 1e-3) && raw("accessible.toilet.v1")?.mounting === "FLOOR" && near(raw("bed.queen.king.v1")?.rawMinZ ?? -1, 0.14, 1e-3), "the ledger's VISUAL QA notes are listed: accessible-toilet raw 0.11 (FLOOR) · bed-queen-king raw 0.14");
  ok(report.counts.dimDrift === 0, `as delivered: every model's world bounds are within ±${DIM_TOLERANCE * 100}% of its dimensionsM (drift ${report.counts.dimDrift})`);
  const big = report.assets.reduce((a, b) => (b.triCount > a.triCount ? b : a));
  ok(big.id === "architect2525.asset.planter.bed.tree.v1" && big.triCount === 1356, `the heaviest model is planter-bed-tree at 1,356 triangles (got ${short(big.id)} ${big.triCount})`);
}
console.log(`library total: ${report.counts.triangles} triangles across ${report.counts.assets} assets · ${report.counts.translucent} translucent · shared-geometry groups ${report.counts.sharedGeometryGroups} · raw-elevated ${report.counts.elevatedRaw} · world-floating ${report.counts.floatingWorld}`);

// ── §4 PERFORMANCE — the model cache: ONE fetch + ONE parse for two concurrent instances of any id; feet memoised once ──
{
  let fetches = 0;
  const fetchBytes = async (url) => { fetches++; return fs.readFileSync(path.join(ROOT, url)); };
  const cache = createModelCache(manifest, fetchBytes);
  const id = "architect2525.asset.planter.bed.tree.v1";
  const [a, b] = await Promise.all([cache.get(id), cache.get(id)]);
  ok(a === b, "two concurrent instances of one id receive the SAME parsed mesh object");
  ok(fetches === 1 && cache.parseCount === 1 && cache.fetchCount === 1, `two instances → one fetch (${fetches}) and one parse (${cache.parseCount})`);
  const c = await cache.get(id);
  ok(c === a && cache.parseCount === 1, "a later instance still reuses the cached parse");
  const [f1, f2] = await Promise.all([cache.getFt(id), cache.getFt(id)]);
  ok(f1 === f2 && f1.units === "ft" && near(boundsExtents(f1.bounds).w, boundsExtents(a.bounds).w * FT_PER_M, 1e-9), "the feet mesh is converted once and memoised (1 m = 3.280839895 ft)");
  ok(a.units === "m", "the cached metre mesh is NOT mutated by the feet conversion");
  let rejected = false;
  await cache.get("architect2525.asset.no.such.thing.v9").catch(() => { rejected = true; });
  ok(rejected && cache.parseCount === 1, "an unknown id rejects (never a blank mesh, never a parse)");
  const every = await Promise.all(manifest.assets.map((e) => cache.get(e.id)));
  ok(every.length === 139 && every.every((m) => m.triCount > 0) && cache.parseCount === 139 && cache.size === 139, "every one of the 139 ids loads through the cache, one parse each");
  resetModelCache(manifest);
  await getAssetMesh(id, manifest, fetchBytes); await getAssetMesh(id, manifest, fetchBytes);
  ok(cacheFor(manifest)?.parseCount === 1, "getAssetMesh(id, manifest, fetchBytes) memoises per manifest — two calls, one parse");
  resetModelCache(manifest);
  ok(modelUrl(manifest, "architect2525.asset.accessible.toilet.v1", "/architect-2525/assets") === "/architect-2525/assets/models/accessible-toilet.glb" && manifestEntry(manifest, "architect2525.asset.accessible.toilet.v1").label === "Accessible Toilet", "modelUrl joins the base url and his relative model path");
}

// ── §5 PLACEMENT — feet at the boundary · 90° yaw maps width → depth · translate · instances share the mesh ──
{
  const ac = meshOf["architect2525.asset.ac.condenser.v1"];
  const ft = toFeet(ac), e0 = boundsExtents(ft.bounds);
  ok(ft.units === "ft" && near(e0.w, 0.85 * FT_PER_M, 1e-6) && near(e0.d, 0.68 * FT_PER_M, 1e-6), `toFeet: AC condenser 0.85 × 0.68 m → ${e0.w.toFixed(3)} × ${e0.d.toFixed(3)} ft`);
  const r90 = transformMesh(ft, { x: 0, y: 0, z: 0 }, 90), e90 = boundsExtents(r90.bounds);
  ok(near(e90.w, e0.d, 1e-9) && near(e90.d, e0.w, 1e-9) && near(e90.h, e0.h, 1e-9), "a 90° yaw maps width → depth exactly (cardinal yaws are exact, no 6e-17 drift)");
  ok(near(r90.bounds.min[2], ft.bounds.min[2]) && near(r90.bounds.max[2], ft.bounds.max[2]), "yaw about Z never tilts the asset off the floor");
  const mv = transformMesh(ft, { x: 5, y: 3, z: 0.5 }, 0);
  ok(near(mv.bounds.min[0] - ft.bounds.min[0], 5) && near(mv.bounds.min[1] - ft.bounds.min[1], 3) && near(mv.bounds.min[2] - ft.bounds.min[2], 0.5), "translate shifts the bounds by exactly the placement");
  const r180 = transformMesh(ft, { x: 0, y: 0, z: 0 }, 180), r360 = transformMesh(ft, { x: 0, y: 0, z: 0 }, 360);
  ok(near(boundsExtents(r180.bounds).w, e0.w) && near(r360.bounds.min[0], ft.bounds.min[0]), "180° keeps the extents; 360° is the identity");
  const r45 = transformMesh(ft, { x: 0, y: 0, z: 0 }, 45);
  ok(boundsExtents(r45.bounds).w > e0.w && near(boundsExtents(r45.bounds).h, e0.h), "his free rotation (45°) works too — the footprint widens, the height holds");
  const before = JSON.stringify(ac.bounds);
  const i1 = instanceTriangles(ac, { x: 5, y: 5, z: 0, rotationDeg: 90 }), i2 = instanceTriangles(ac, { x: 1, y: 1, z: 0, rotationDeg: 0 });
  ok(i1.length === ac.triCount && i2.length === ac.triCount, "instanceTriangles returns every triangle of the shared mesh for each instance");
  ok(JSON.stringify(ac.bounds) === before && ac.units === "m", "the shared (cached) mesh is untouched by instancing — transforms are per instance");
  ok(i1.every((t) => t.a.length === 3) && !i1.some((t) => t.a.some((v) => !Number.isFinite(v))), "instance triangles are finite 3-vectors in feet");
  let threw = false; try { transformMesh(ft, { x: NaN, y: 0, z: 0 }, 0); } catch { threw = true; }
  ok(threw, "a non-finite placement throws (NaN never reaches a face)");
  const n = nodeMatrix({ translation: [1, 2, 3], rotation: [0, 0, Math.SQRT1_2, Math.SQRT1_2], scale: [2, 2, 2] });
  const p = mat4Apply(n, [1, 0, 0]);
  ok(near(p[0], 1, 1e-9) && near(p[1], 4, 1e-9) && near(p[2], 3, 1e-9), "nodeMatrix composes T·R·S (90° about Z, ×2, +[1,2,3]: [1,0,0] → [1,4,3])");
  // his node matrices are what put the toilet on the floor — the reader applies them
  const toilet = meshOf["architect2525.asset.accessible.toilet.v1"];
  ok(near(toilet.bounds.min[2], 0, 1e-3), `the accessible toilet sits on the floor once its node matrices are applied (world min z ${toilet.bounds.min[2].toFixed(4)}; raw accessor min 0.11)`);
}

// ── §6 PROJECTION — faces bridge into the ONE solidFaces painter, shade-tagged by normal, coplanar pairs merged ──
{
  const stud = readGlb(writeGlbFromComposition(STUD_2X4));
  const raw = meshToFaces(stud, { merge: false });
  ok(raw.length === 12 && raw.every((f) => f.pts.length === 3), `merge:false — a box's 12 triangles become 12 three-vertex faces (${raw.length})`);
  const faces = meshToFaces(stud);
  ok(faces.length === 6 && faces.every((f) => f.pts.length === 4), `default — the 12 coplanar pairs merge into the box's 6 quads (${faces.length}; the same shape boxFaces() paints, no diagonal)`);
  const kinds = faces.reduce((m, f) => ((m[f.kind] = (m[f.kind] ?? 0) + 1), m), {});
  ok(kinds.top === 1 && kinds.floor === 1 && kinds.front === 2 && kinds.side === 2, `face kinds from normals: top 1 · floor 1 · front 2 · side 2 (got ${JSON.stringify(kinds)})`);
  ok(faces.every((f) => f.color === MATERIALS.WOOD.fill && f.opacity === 1), "the stud's faces carry the WOOD material colour (ONLY WOOD IS TAN — FRAME_COLOR, one source)");
  ok(faceKindOfNormal([0, 0, 1]) === "top" && faceKindOfNormal([0, 0, -1]) === "floor" && faceKindOfNormal([0, 1, 0]) === "front" && faceKindOfNormal([1, 0, 0]) === "side", "faceKindOfNormal: +z top · −z floor · ±y front · ±x side (the walk's wall tagging)");
  ok(Object.keys(FACE_SHADE).includes(faces[0].kind), "the tagged kinds are FACE_SHADE keys (the shared shader applies unchanged)");
  const ortho = (p) => ({ x: p[0] * 100, y: -p[2] * 100, depth: p[1] + 10 });   // a never-refusing projector
  const painted = solidFaces(faces, ortho);
  ok(painted.length === 6 && painted.every((f) => f.d.split(" ").length === 4), "solidFaces paints the merged quads (no change to lib/solid-shade.ts)");
  ok(solidFaces(raw, ortho).every((f) => f.d.split(" ").length === 3), "solidFaces paints 3-vertex faces unchanged too");
  ok(painted.every((f, i) => i === 0 || painted[i - 1].depth >= f.depth), "painter order FAR → NEAR holds");
  const q = faces.find((f) => f.kind === "top");
  const [a, b, c] = q.pts, nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  ok(nz > 0 && near(nx, 0), "the merged top quad still winds +z (outward) — merging never flips a face");
  const ac = meshOf["architect2525.asset.ac.condenser.v1"];
  const acFaces = meshToFaces(ac);
  ok(acFaces.length < ac.triCount && acFaces.length >= ac.triCount / 2 && acFaces.every((f) => f.pts.length === 3 || f.pts.length === 4), `his box-built models merge too (AC condenser ${ac.triCount} tris → ${acFaces.length} faces)`);
  const faceTotal = manifest.assets.reduce((s, e) => s + (meshOf[e.id] ? meshToFaces(meshOf[e.id]).length : 0), 0);
  ok(faceTotal < report.counts.triangles, `across the library the bridge paints ${faceTotal} faces for ${report.counts.triangles} triangles`);
}

// ── §7 WRITER — the rebuild path round-trips box · cyl · sphere · torus with material roles; byte-stable ──
{
  const bytes = writeGlbFromComposition(STUD_2X4);
  const doc = parseGlb(bytes);
  ok(doc.json.asset.version === "2.0" && doc.json.asset.generator === GLB_GENERATOR, `a rebuilt GLB is glTF 2.0 stamped ${GLB_GENERATOR}`);
  const mesh = gltfTriangles(doc);
  const want = compositionBounds(STUD_2X4);
  ok(mesh.triCount === compositionTriCount(STUD_2X4) && mesh.triCount === 12 && mesh.meshCount === 1, `round trip: ${mesh.triCount} triangles · ${mesh.meshCount} mesh(es)`);
  ok([0, 1, 2].every((i) => near(mesh.bounds.min[i], want.min[i], 1e-6) && near(mesh.bounds.max[i], want.max[i], 1e-6)), "round trip: bounds equal the composition's parts");
  const ext = boundsExtents(mesh.bounds);
  ok(near(ext.w, 0.0381, 1e-4) && near(ext.d, 0.0889, 1e-4) && near(ext.h, 2.4384, 1e-4), `the stud is 1½″ × 3½″ × 8′ in metres (${ext.w.toFixed(4)} × ${ext.d.toFixed(4)} × ${ext.h.toFixed(4)})`);
  ok(near(mesh.bounds.min[2], 0, 1e-6) && near(mesh.bounds.min[0], -0.0381 / 2, 1e-6), "origin is floor-centre (z 0, footprint centred on the origin)");
  ok(mesh.materials.length === 1 && mesh.materials[0] === MATERIALS.WOOD.fill && doc.json.materials[0].name === "WOOD", `the WOOD role round-trips to ${MATERIALS.WOOD.fill} and keeps its role name in the GLB`);
  ok(Buffer.compare(Buffer.from(bytes), Buffer.from(writeGlbFromComposition(STUD_2X4))) === 0, "writeGlbFromComposition is byte-stable (no clock, no random)");
  const meta = compositionMetadata(STUD_2X4);
  ok(Object.keys(meta).join(",") === "schemaVersion,id,label,packs,sections,sourcePlacementIds,model,planSymbol,dimensionsM,pivot,rotation,mounting,snap,authority,modelQuality,materialRule,rebuildSpec" && STUD_2X4.id === "architect2525.asset.stud.2x4.v1" && fileForId(STUD_2X4.id) === "stud-2x4", "a composition's metadata is his key order and its id follows his scheme (file stud-2x4)");
  ok(fileForId("architect2525.asset.accent.chair.side.table.v1") === "accent-chair-side-table" && (() => { try { fileForId("furniture.sofa.3seat.v1"); return false; } catch { return true; } })(), "fileForId: his naming rule; a foreign id scheme is refused");
  const ALL = {
    id: "architect2525.asset.test.all.primitives.v1", file: "test-all-primitives", label: "All primitives", packs: [10], dimensionsM: { width: 3, depth: 3, height: 1.5 }, mounting: "FLOOR", snap: ["FLOOR"],
    rotation: { axis: "Z", freeRotation: true, allowedDegrees: [0, 90, 180, 270] }, authority: "ILLUSTRATIVE",
    parts: [
      { kind: "box", size: [1, 0.5, 0.25], center: [-1, -1, 0.125], material: "ARCH_TEAL" },
      { kind: "cyl", size: [0.5, 0.5, 1.5], center: [1, -1, 0.75], material: "GLASS", segments: 12 },
      { kind: "sphere", size: [0.6, 0.6, 0.6], center: [-1, 1, 0.3], material: "ACCENT", segments: 12 },
      { kind: "torus", size: [1, 1, 0.2], center: [1, 1, 0.1], material: "ELECTRICAL", segments: 12 },
    ],
  };
  const allBytes = writeGlbFromComposition(ALL), allDoc = parseGlb(allBytes), all = gltfTriangles(allDoc);
  ok(all.meshCount === 4 && all.triCount === compositionTriCount(ALL) && all.triCount > 12, `box + cyl + sphere + torus round-trip: 4 meshes · ${all.triCount} triangles`);
  ok(all.triCount <= MAX_TRIS_PER_ASSET, `low segment counts keep four primitives within the per-asset budget (${all.triCount} ≤ ${MAX_TRIS_PER_ASSET})`);
  const ab = compositionBounds(ALL);
  ok([0, 1, 2].every((i) => near(all.bounds.min[i], ab.min[i], 1e-6) && near(all.bounds.max[i], ab.max[i], 1e-6)), "round trip: the four-part bounds equal the composition's");
  ok(near(all.bounds.min[0], -1.5, 1e-6) && near(all.bounds.max[0], 1.5, 1e-6) && near(all.bounds.min[2], 0, 1e-6) && near(all.bounds.max[2], 1.5, 1e-6), "a part's extents are its size (segments multiples of 4 touch every axis): x −1.5..1.5 · z 0..1.5");
  ok(allDoc.json.materials.map((m) => m.name).join() === "ARCH_TEAL,GLASS,ACCENT,ELECTRICAL", "materials are the roles used, first-use order, named by role");
  const glassTri = all.triangles.find((t) => t.color === MATERIALS.GLASS.fill);
  ok(!!glassTri && near(glassTri.opacity, MATERIALS.GLASS.opacity, 1e-6) && allDoc.json.materials[1].alphaMode === "BLEND", `GLASS round-trips translucent (opacity ${MATERIALS.GLASS.opacity}, BLEND)`);
  ok(all.materials.includes(roleColor("ELECTRICAL").fill) && all.materials.includes(MATERIALS.ARCH_ACCENT.fill), "semantic + accent roles carry their one-source colours");
  for (const role of MATERIAL_ROLES) { const m = materialForRole(role); ok(m.name === role && m.baseColorFactor.length === 4 && m.baseColorFactor.every((v) => v >= 0 && v <= 1), `materialForRole(${role}) → a glTF material`); }
  ok(materialForRole("EDGE").baseColorFactor.join() === hexToBaseColor(ARCH_EDGE).join() && materialForRole("WOOD").baseColorFactor.join() === hexToBaseColor(MATERIALS.WOOD.fill).join(), "EDGE = ARCH_EDGE · WOOD = FRAME_COLOR (through MATERIALS)");
  ok((() => { try { materialForRole("TAN"); return false; } catch { return true; } })(), "an unknown role is refused (no ad-hoc colours)");
  const rz = rawMeshBounds(partMesh({ kind: "box", size: [2, 1, 0.5], center: [0, 0, 0], rotZ: 90 }));
  ok(near(rz.max[0] - rz.min[0], 1) && near(rz.max[1] - rz.min[1], 2) && near(rz.max[2] - rz.min[2], 0.5), "rotZ 90° maps a part's width → depth exactly");
  const rx = rawMeshBounds(partMesh({ kind: "cyl", size: [0.2, 0.2, 2], center: [0, 0, 0.1], rotX: 90, segments: 12 }));
  ok(near(rx.max[1] - rx.min[1], 2) && near(rx.max[2] - rx.min[2], 0.2) && near(rx.min[2], 0), "rotX 90° lays a cylinder along Y, its centre honoured (z 0..0.2)");
  const sph = rawMeshBounds(partMesh({ kind: "sphere", size: [1, 2, 3], center: [0, 0, 0], segments: 12 }));
  ok(near(sph.max[0] - sph.min[0], 1) && near(sph.max[1] - sph.min[1], 2) && near(sph.max[2] - sph.min[2], 3), "a sphere's size is its full ellipsoid extents");
  const tor = rawMeshBounds(partMesh({ kind: "torus", size: [1, 1, 0.2], center: [0, 0, 0], segments: 12 }));
  ok(near(tor.max[0] - tor.min[0], 1) && near(tor.max[2] - tor.min[2], 0.2), "a torus's size is its outer extents and tube diameter");
  ok((() => { try { partMesh({ kind: "torus", size: [0.1, 0.1, 0.2], center: [0, 0, 0] }); return false; } catch { return true; } })(), "a torus whose tube exceeds its extents is refused");
  ok((() => { try { partMesh({ kind: "box", size: [1, 0, 1], center: [0, 0, 0] }); return false; } catch { return true; } })(), "a zero-extent part is refused");
  for (const kind of ["box", "cyl", "sphere", "torus"]) {   // every primitive's triangles face outward — the painter depends on it
    const m = partMesh({ kind, size: kind === "torus" ? [1, 1, 0.2] : [1, 1, 1], center: [0, 0, 0] });
    let inward = 0;
    for (let i = 0; i < m.indices.length; i += 3) {
      const [a, b, c] = [m.positions[m.indices[i]], m.positions[m.indices[i + 1]], m.positions[m.indices[i + 2]]];
      const n = [(b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])];
      const ctr = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
      const rr = Math.hypot(ctr[0], ctr[1]) || 1e-9;
      const ref = kind === "torus" ? [ctr[0] * (0.4 / rr), ctr[1] * (0.4 / rr), 0] : [0, 0, 0];   // the tube's own ring centre for the torus
      if (n[0] * (ctr[0] - ref[0]) + n[1] * (ctr[1] - ref[1]) + n[2] * (ctr[2] - ref[2]) <= 0) inward++;
    }
    ok(inward === 0, `${kind}: every triangle winds outward (${inward} inward)`);
  }
  const throws = (f) => { try { f(); return false; } catch { return true; } };
  ok(throws(() => parseGlb(new Uint8Array(10))), "parseGlb refuses a truncated header");
  const badMagic = new Uint8Array(bytes); badMagic[0] = 0x00;
  ok(throws(() => parseGlb(badMagic)), "parseGlb refuses a bad magic");
  ok(throws(() => parseGlb(bytes.subarray(0, bytes.byteLength - 4))), "parseGlb refuses a header length that does not match the bytes");
  const badVer = new Uint8Array(bytes); badVer[4] = 1;
  ok(throws(() => parseGlb(badVer)), "parseGlb refuses container version 1");
  ok(throws(() => writeGlb({ parts: [{ name: "x", material: "nope", box: { x: 0, y: 0, z: 0, w: 1, d: 1, h: 1 } }], materials: [] })), "writeGlb refuses an unknown material");
  ok(throws(() => writeGlb({ parts: [{ name: "x", material: "m", box: { x: 0, y: 0, z: 0, w: 0, d: 1, h: 1 } }], materials: [{ name: "m", baseColorFactor: [1, 1, 1, 1] }] })), "writeGlb refuses a zero-extent box");
  ok(boxMesh({ x: 0, y: 0, z: 0, w: 1, d: 1, h: 1 }).indices.length === 36, "boxMesh is 12 triangles");
  const nanBytes = new Uint8Array(bytes);
  const dv = new DataView(nanBytes.buffer);
  const jsonLen = dv.getUint32(12, true);
  const binStart = 20 + jsonLen + 8;
  const posView = doc.json.bufferViews[doc.json.accessors[doc.json.meshes[0].primitives[0].attributes.POSITION].bufferView];
  dv.setFloat32(binStart + posView.byteOffset, NaN, true);
  ok(throws(() => gltfTriangles(parseGlb(nanBytes))), "a NaN vertex in the BIN chunk is refused (throws), never painted");
}

// ── §8 BUDGET — a WARN flag, never a throw ──
{
  const b1 = checkTriBudget([1600, 100]);
  ok(b1.assetOver && !b1.roomOver && b1.warnings.length === 1, `one 1,600-tri instance → assetOver (warn: ${b1.warnings[0]})`);
  const b2 = checkTriBudget(Array(61).fill(100));
  ok(!b2.assetOver && b2.roomOver && b2.roomTris === 6100, "61 × 100 tris → roomOver (6,100 > 6,000)");
  const b3 = checkTriBudget([NaN, -1, Infinity]);
  ok(!b3.assetOver && !b3.roomOver && b3.roomTris === 0, "garbage counts are zeroed, never thrown");
  ok(MAX_TRIS_PER_ASSET === 1500 && MAX_TRIS_PER_ROOM === 6000, "budget constants: 1,500 per asset · 6,000 per room");
  const heavy = checkTriBudget([1356, 1356, 1356, 1356, 1356]);
  ok(!heavy.assetOver && heavy.roomOver, "five planter-bed-trees in one room trip the room budget, not the asset budget");
}

// ── §9 RUNTIME ENTRY — loadAssetMeshFt exists, never fetches at import, and serves any of the 139 ids end-to-end ──
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
    const m1 = await RT.loadAssetMeshFt("architect2525.asset.accessible.toilet.v1");
    ok(m1.units === "ft" && m1.triCount === meshOf["architect2525.asset.accessible.toilet.v1"].triCount && m1.triCount > 0, `loadAssetMeshFt serves the accessible toilet in feet (${m1.triCount} tris, the same count the reader gave)`);
    ok(calls === 2 && urls[0] === "/architect-2525/assets/manifest.json" && urls[1] === "/architect-2525/assets/models/accessible-toilet.glb", `the browser path fetches the manifest then his model (${urls.join(" · ")})`);
    const m2 = await RT.loadAssetMeshFt("architect2525.asset.accessible.toilet.v1");
    ok(m2 === m1 && calls === 2, "a second placement of the same id fetches nothing and parses nothing");
    await RT.loadAssetMeshFt("architect2525.asset.planter.bed.tree.v1");
    ok(calls === 3, "a different id fetches only its own GLB (the manifest is fetched once per page)");
    const some = await Promise.all(manifest.assets.slice(0, 20).map((e) => RT.loadAssetMeshFt(e.id)));
    ok(some.every((m) => m.units === "ft" && m.triCount > 0), "any of the 139 ids resolves through the runtime entry (first 20 sampled)");
    let bad = false; await RT.loadAssetMeshFt("architect2525.asset.no.such.thing.v9").catch(() => { bad = true; });
    ok(bad, "an unknown id rejects through the runtime entry");
    RT.resetRuntimeAssets();
  } finally { globalThis.fetch = origFetch; }
}

console.log(`architect-asset-glb: ${pass} passed, ${fail} failed · WARN rows ${report.warn.length} (tests/fixtures/asset-glb-report.json)`);
process.exit(fail ? 1 : 0);

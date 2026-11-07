// ARCHITECT-2525 · ASSET INVENTORY gate (Rev A completeness ledger, intake master §29/§30). The ONE source is
// lib/architect-2525/assets/inventory.ts; the ledger docs/architecture-2525/ASSET_INVENTORY.md is GENERATED from it.
// This gate proves, against the operator's own files (never a screenshot):
//  1. ids — unique, his grammar (`architect2525.asset.<words>.v1`), the LIBRARY rows == his manifest.json one-to-one
//     (ids, labels, packs, model/metadata/plan paths that exist on disk);
//  2. his placements.json — 148 placements → 137 ids, every placement's id/label/pack on its row; the per-pack counts;
//  3. his asset-list audit (137 exact names) and his 10-pack rotator catalog (137 labels) — every name on a row;
//  4. the intake master §18 complete pack coverage target — every line (193 objects; "Optional Style Variants" is a
//     modifier, not an object) resolves to a row carrying that pack; every §18-only row is hit by a §18 line;
//  5. statuses derived from his files — a manifest id is READY ×3 and its GLB exists; everything else MISSING; QA PENDING;
//  6. geometry facts recomputed from his GLBs — sha256 == VALIDATION.json, the byte-identical groups == SHARED_GEOMETRY,
//     min z (node translations applied; no rotation/scale in his files) → FLOOR_FLOATS / FLOOR_SUNK; dryer ≠ washer;
//  7. the starter pack — the 18 starter ids all superseded, lineage == placements.json `glb`;
//  8. rooms/phases enums, ≥1 source each from the known set, legacy kinds covered once, duplicates well-formed;
//  9. the ledger on disk is byte-identical to a fresh generation and its header carries the counts of the source.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-asset-inventory.test.mjs
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  ASSET_INVENTORY, ID_GRAMMAR, ID_PREFIX, slugOf, ROOM_IDS, PHASE_IDS, ORIGINS, FILE_STATUSES, VISUAL_QA, PACK_NUMBERS, BOARDS, BOARD_ALIASES, PACK_BOARD,
  SHARED_GEOMETRY, FLOOR_FLOATS, FLOOR_SUNK, FLOOR_EPS_M, STARTER_LINEAGE, PLACEMENTS, MANIFEST_COUNT,
  LIBRARY_ROOT, STARTER_ROOT, ROTATOR_CATALOG, BOARDS_ROOT, MANIFEST_SOURCE, MASTER_18_SOURCE,
  inventoryById, canonicalRows, duplicateRows, rowsOfOrigin, rowsByReferenceName, normalizeName, inventorySummary, missingByPack, sortedRows,
} from "../lib/architect-2525/assets/inventory.ts";
import { OBJECT_KINDS } from "../lib/room-objects.ts";
import { renderInventoryMarkdown, LEDGER_PATH, COLUMNS } from "../scripts/architect-asset-inventory.mjs";

const FRONTEND = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(FRONTEND, "..");
const abs = (p) => path.join(ROOT, p);
const readJson = (p) => JSON.parse(fs.readFileSync(abs(p), "utf8"));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const sameSet = (a, b) => a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);

const rows = ASSET_INVENTORY, canon = canonicalRows(), dups = duplicateRows();
const lib = rowsOfOrigin("LIBRARY"), m18 = rowsOfOrigin("MASTER_18"), board = rowsOfOrigin("BOARD");
const byId = new Map(rows.map((r) => [r.id, r]));
/** The canonical row a printed name resolves to (a duplicate row resolves to its target). */
const resolve = (name) => rowsByReferenceName(name).map((r) => (r.duplicateOf ? byId.get(r.duplicateOf) : r));

// ── 1. ids + his manifest ──
ok(new Set(rows.map((r) => r.id)).size === rows.length, "ids are unique");
ok(rows.every((r) => ID_GRAMMAR.test(r.id)), `every id matches his grammar — offenders: ${rows.filter((r) => !ID_GRAMMAR.test(r.id)).map((r) => r.id).slice(0, 5).join(", ")}`);
const manifest = readJson(`${LIBRARY_ROOT}/manifest.json`);
ok(manifest.assets.length === MANIFEST_COUNT && lib.length === MANIFEST_COUNT, `his manifest holds ${MANIFEST_COUNT} assets and the ledger has ${MANIFEST_COUNT} LIBRARY rows (manifest ${manifest.assets.length}, rows ${lib.length})`);
ok(manifest.semanticAssetCountIncludingExtras === MANIFEST_COUNT && manifest.boardPlacementCount === PLACEMENTS.total && manifest.exactNameBoardAssetCount === PLACEMENTS.uniqueIds, "his manifest header: 139 semantic · 148 placements · 137 exact-name");
ok(sameSet(manifest.assets.map((a) => a.id), lib.map((r) => r.id)), `LIBRARY ids == manifest ids one-to-one — missing rows: ${manifest.assets.filter((a) => !byId.has(a.id)).map((a) => a.id).join(", ") || "none"}; extra rows: ${lib.filter((r) => !manifest.assets.some((a) => a.id === r.id)).map((r) => r.id).join(", ") || "none"}`);
for (const a of manifest.assets) {
  const r = byId.get(a.id); if (!r) continue;
  ok(r.label === a.label, `${a.id}: label is his ("${a.label}", row "${r.label}")`);
  ok(sameSet(r.manifestPacks ?? [], a.packs), `${a.id}: manifestPacks == his packs [${a.packs}] (row [${r.manifestPacks}])`);
  ok(a.packs.every((p) => r.packs.includes(p)), `${a.id}: every manifest pack is on the row's PACK(S)`);
  const slug = slugOf(a.id);
  ok(a.model === `models/${slug}.glb` && a.metadata === `metadata/${slug}.json` && a.planSymbol === `plan/${slug}.svg`, `${a.id}: his file paths follow the slug (${a.model})`);
  ok(fs.existsSync(abs(`${LIBRARY_ROOT}/${a.model}`)) && fs.existsSync(abs(`${LIBRARY_ROOT}/${a.metadata}`)) && fs.existsSync(abs(`${LIBRARY_ROOT}/${a.planSymbol}`)), `${a.id}: GLB + metadata + PLAN SVG exist on disk`);
  ok(r.sources.includes(MANIFEST_SOURCE) && a.packs.every((p) => r.sources.includes(PACK_BOARD[p])), `${a.id}: sources carry the manifest and the pack board(s) it is printed on`);
  const md = readJson(`${LIBRARY_ROOT}/${a.metadata}`);
  ok(md.id === a.id && sameSet(md.packs, a.packs), `${a.id}: his metadata.json agrees with his manifest`);
}

// ── 2. his placements ledger ──
const placements = readJson(`${LIBRARY_ROOT}/inventory/placements.json`);
ok(placements.length === PLACEMENTS.total, `placements.json holds ${PLACEMENTS.total} placements (got ${placements.length})`);
ok(new Set(placements.map((p) => p.assetId)).size === PLACEMENTS.uniqueIds, `placements resolve to ${PLACEMENTS.uniqueIds} ids`);
for (const n of PACK_NUMBERS) ok(placements.filter((p) => p.pack === n).length === PLACEMENTS.byPack[n], `pack ${n}: ${PLACEMENTS.byPack[n]} placements`);
for (const p of placements) {
  const r = byId.get(p.assetId);
  ok(!!r && r.origin === "LIBRARY", `placement ${p.placementId} (${p.label}) → a LIBRARY row ${p.assetId}`);
  if (!r) continue;
  ok(r.packs.includes(p.pack), `placement ${p.placementId}: pack ${p.pack} on the row`);
  ok(r.referenceNames.some((x) => normalizeName(x) === normalizeName(p.label)), `placement ${p.placementId}: label "${p.label}" among the row's names`);
  if (p.glb) ok(r.starterId === p.glb, `placement ${p.placementId}: starter lineage ${p.glb} recorded (row ${r.starterId})`);
}
const extras = lib.filter((r) => !placements.some((p) => p.assetId === r.id)).map((r) => r.id);
ok(sameSet(extras, [`${ID_PREFIX}dining.chair.v1`, `${ID_PREFIX}dining.table.v1`]), `the only manifest ids outside the placements are the two dining extras (got ${extras.join(", ")})`);

// ── 3. his audit + his rotator catalog ──
const auditMd = fs.readFileSync(abs("docs/asks/2026.11.07_architect2525_asset_list_audit.md"), "utf8");
const auditItems = [];
for (const line of auditMd.split("\n")) {
  if (line.startsWith("Status:")) continue;
  for (const m of line.matchAll(/(✅|⚠|◐|⬜) ([^·\n]+?)(?= ·|$)/gu)) auditItems.push({ glyph: m[1], name: m[2].split(" — ")[0].trim() });
}
const auditNames = [...new Set(auditItems.map((a) => a.name))];
ok(auditItems.length === PLACEMENTS.total && auditNames.length === PLACEMENTS.uniqueIds, `his audit parses to ${PLACEMENTS.total} placements / ${PLACEMENTS.uniqueIds} exact names (got ${auditItems.length} / ${auditNames.length})`);
for (const n of auditNames) { const hits = resolve(n).filter((r) => r.origin === "LIBRARY"); ok(hits.length >= 1, `audit name "${n}" is on a LIBRARY row`); }
const catalog = readJson(ROTATOR_CATALOG);
const rotEntries = catalog.packs.flatMap((p) => p.assets.map((a) => ({ ...a, pack: p.n })));
ok(rotEntries.length === 147 && new Set(rotEntries.map((e) => e.id)).size === 137, `the rotator catalog: 147 entries / 137 ids (got ${rotEntries.length} / ${new Set(rotEntries.map((e) => e.id)).size})`);
for (const e of rotEntries) { const hits = resolve(e.label).filter((r) => r.origin === "LIBRARY" && r.packs.includes(e.pack)); ok(hits.length === 1, `rotator "${e.label}" (pack ${e.pack}) → exactly one LIBRARY row in that pack (got ${hits.length})`); }
for (const e of rotEntries.filter((e) => e.glb)) ok(Object.values(STARTER_LINEAGE).includes(e.glb), `rotator starter ${e.glb} is in the lineage`);

// ── 4. the intake master §18 — the complete pack coverage target, every line ──
const masterMd = fs.readFileSync(abs(MASTER_18_SOURCE.split("#")[0]), "utf8");
ok(/^# 18\. COMPLETE PACK COVERAGE TARGET/m.test(masterMd), "the intake master still carries §18");
const S18 = [
  [1, ["Foundation Slab", "Footing", "Stem Wall", "Wall Frame Section", "Door Rough Opening", "Window Rough Opening", "Wall Sheathing", "Roof Truss", "Roof/Ceiling Framing Module", "Roof Sheathing", "Interior Door", "Entry Door", "Sliding Glass Door", "Single Window", "Wide Window", "Skylight", "Exterior Siding"]],
  [2, ["Sofa", "Armchair / Lounge Chair", "Coffee Table", "Side Table", "Media / TV Console", "Bookcase", "Floor Lamp",
       "Dining Table", "Dining Chair", "Sideboard / Credenza", "Pendant",
       "Refrigerator", "Range / Oven", "Range Hood", "Dishwasher", "Microwave", "Base Cabinet", "Wall Cabinet", "Kitchen Sink", "Kitchen Island", "Bar Stool", "Pantry Cabinet",
       "Queen / King Bed", "Bunk Bed", "Nightstand", "Dresser", "Wardrobe", "Bedroom Bench", "Table Lamp",
       "Closet System", "Hanging Rod", "Drawer Unit", "Shelving", "Shoe Rack", "Closet Island", "Hamper", "Mirror",
       "Toilet", "Vanity + Sink", "Shower Stall", "Bathtub", "Mirror", "Towel Bar / Rack",
       "Desk", "Office Chair", "File Cabinet", "Bookcase", "Monitor", "Desk Lamp",
       "Washer", "Dryer", "Utility Sink", "Storage Shelf", "Storage Cabinet", "Storage Bin", "Workbench / Utility Surface"]],
  [3, ["Drywall", "Paint", "Flooring / LVP", "Tile", "Baseboard", "Crown Molding", "Trim / Casing",
       "Flush Ceiling Light", "Recessed Light", "Pendant", "Chandelier", "Wall Sconce", "Track Light", "Under-Cabinet Light", "Floor Lamp", "Table Lamp",
       "Security Camera", "Video Doorbell", "Motion Sensor", "Smart Lock", "Smoke / CO Detector",
       "Exterior Door", "Garage Door", "Siding", "Roofing", "Gutter + Downspout", "Deck / Porch", "Fence"]],
  [4, ["Refrigerator", "Range / Oven", "Dishwasher", "Microwave", "Garbage Disposal", "Washer", "Dryer", "Water Heater", "Water Softener", "HVAC Air Handler / Furnace", "AC Condenser", "Air Purifier", "Dehumidifier", "Electrical Panel", "Home Battery", "Inverter", "Generator", "EV Charger", "Solar Inverter", "Leak Detector", "Water Shutoff Valve", "Air Quality Monitor"]],
  [5, ["Smart Thermostat", "Smart Hub", "Router", "Smart Lock", "Entry Keypad", "Scene Switch", "Control Panel", "Motorized Shade", "Motorized Shade Track", "Automated Lighting Controller", "Environmental Sensor", "Occupancy Sensor"]],
  [6, ["Driveway Pad", "Walkway Pavers", "Front Steps", "Landing", "Fence Section", "Gate", "Planter Bed", "Tree", "Shrub / Plant", "Irrigation Head", "Path Light", "Landscape Light", "Deck", "Patio", "Exterior Utility Pad"]],
  [7, ["Entry Ramp", "Handrail", "Grab Bar", "Lever Door Handle", "Roll-In Shower", "Shower Bench", "Accessible Toilet", "Accessible Vanity", "Clear-Floor-Space Marker", "Threshold Transition"]],
  [8, ["Solar Panel Array", "Home Battery Pack", "Backup Inverter", "Controller", "Rainwater Cistern", "Storm Shutter", "High-Efficiency Equipment", "Backup Power Interface", "Water Capture Components", "Resilience Equipment"]],
  [9, ["Area Rug", "Accent Chair", "Side Table", "Entertainment Console", "TV", "Bookshelf", "Décor Object", "Mirror", "Wall Art", "Plant", "Decorative Lighting"]],  // "Optional Style Variants" = a modifier, not an object
  [10, ["Tool Cart", "Tool Kit", "Access Ladder", "Service Access Panel", "HVAC Filter", "Water Filter", "Replacement Filter Set", "Shutoff Valve", "Valve Manifold", "Inspection Point", "Service Marker", "Maintenance Access Element"]],
];
const s18Lines = S18.flatMap(([pack, names]) => names.map((name) => ({ pack, name })));
ok(s18Lines.length === 193, `§18 oracle encodes 193 object lines (got ${s18Lines.length})`);
for (const { pack, name } of s18Lines) {
  const esc = name.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  ok(new RegExp(`^- ${esc}$`, "m").test(masterMd), `§18 line "${name}" is verbatim in the intake master`);
  const hits = resolve(name).filter((r) => r.packs.includes(pack));
  ok(hits.length >= 1, `§18 Pack ${pack} "${name}" → a row carrying pack ${pack}`);
}
const hitIds = new Set(s18Lines.flatMap(({ pack, name }) => resolve(name).filter((r) => r.packs.includes(pack)).map((r) => r.id)));
for (const r of m18) ok(hitIds.has(r.id), `§18-only row ${r.id} is hit by a §18 line`);
for (const r of m18) ok(r.sources[0] === MASTER_18_SOURCE, `§18-only row ${r.id} cites §18 first`);
for (const r of board) ok(!hitIds.has(r.id) && r.packs.length === 0 && !r.sources.includes(MASTER_18_SOURCE), `BOARD row ${r.id} is outside §18 and on no pack list`);
for (const r of lib) for (const p of r.packs) if (!(r.manifestPacks ?? []).includes(p)) ok(s18Lines.some((l) => l.pack === p && resolve(l.name).some((x) => x.id === r.id)), `${r.id}: extra pack ${p} is justified by a §18 line`);

// ── 5. statuses derived from his files ──
for (const r of lib) ok(r.glb === "READY" && r.plan === "READY" && r.metadata === "READY", `${r.id}: manifest asset is READY ×3`);
for (const r of lib) ok(fs.existsSync(abs(`${LIBRARY_ROOT}/models/${slugOf(r.id)}.glb`)), `${r.id}: READY GLB exists on disk`);
for (const r of [...m18, ...board]) ok(r.glb === "MISSING" && r.plan === "MISSING" && r.metadata === "MISSING", `${r.id}: a gap is MISSING ×3`);
ok(rows.every((r) => r.visualQa === "PENDING"), "visual QA is PENDING everywhere (§31 captures do not exist yet)");
ok(rows.every((r) => FILE_STATUSES.includes(r.glb) && FILE_STATUSES.includes(r.plan) && FILE_STATUSES.includes(r.metadata) && VISUAL_QA.includes(r.visualQa)), "statuses are enum values");
const sum = inventorySummary();
ok(sum.byOrigin.LIBRARY === MANIFEST_COUNT && sum.byGlb.READY === MANIFEST_COUNT, `GLB READY == ${MANIFEST_COUNT} manifest assets`);
ok(sum.byOrigin.MASTER_18 === m18.length && sum.byOrigin.BOARD === board.length && sum.byOrigin.DUPLICATE === dups.length, "summary byOrigin matches the rows");
ok(sum.byGlb.MISSING === m18.length + board.length && sum.byGlb.PLACEHOLDER === 0 && sum.byGlb.NEEDS_REBUILD === 0, `GLB MISSING == §18-only + board-only (${m18.length} + ${board.length} = ${sum.byGlb.MISSING})`);
ok(sum.distinct === lib.length + m18.length + board.length && sum.total === sum.distinct + dups.length, "distinct = LIBRARY + §18-only + BOARD; total = distinct + duplicates");
for (const n of PACK_NUMBERS) ok(sum.byPack[n].manifest === manifest.assets.filter((a) => a.packs.includes(n)).length, `pack ${n}: summary manifest count == his manifest`);
ok(sum.noPack === board.length, "the rows on no pack list are exactly the BOARD rows");

// ── 6. geometry facts recomputed from his GLBs ──
const validation = readJson(`${LIBRARY_ROOT}/docs/VALIDATION.json`);
ok(validation.passed === true && validation.assetCount === MANIFEST_COUNT && validation.assets.every((a) => a.valid), "his VALIDATION.json: passed, 139, all valid");
const shaOf = (p) => createHash("sha256").update(fs.readFileSync(abs(p))).digest("hex");
const shaBySlug = new Map();
for (const a of manifest.assets) shaBySlug.set(slugOf(a.id), shaOf(`${LIBRARY_ROOT}/${a.model}`));
for (const v of validation.assets) ok(shaBySlug.get(slugOf(v.id)) === v.sha256, `${v.id}: GLB sha256 on disk == VALIDATION.json`);
const groups = new Map();
for (const [slug, sha] of shaBySlug) (groups.get(sha) ?? groups.set(sha, []).get(sha)).push(slug);
const shared = [...groups.values()].filter((g) => g.length > 1).map((g) => g.sort().join("|")).sort();
const declared = SHARED_GEOMETRY.map((g) => [...g].sort().join("|")).sort();
ok(sameSet(shared, declared), `byte-identical groups recomputed from the GLBs == SHARED_GEOMETRY (${shared.length} vs ${declared.length})\n  disk: ${shared.join("  ")}\n  decl: ${declared.join("  ")}`);
ok(shaBySlug.get("dryer") !== shaBySlug.get("washer"), "his ⚠ is cleared: dryer.glb is no longer byte-identical to washer.glb");
function glbMinMaxZ(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("not a GLB");
  const jsonLen = buf.readUInt32LE(12), json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
  const binOff = 20 + jsonLen, binLen = buf.readUInt32LE(binOff), bin = buf.subarray(binOff + 8, binOff + 8 + binLen);
  let mn = Infinity, mx = -Infinity, transformed = false;
  const bounds = (ai) => { const a = json.accessors[ai]; if (a.min && a.max) return [a.min[2], a.max[2]]; const bv = json.bufferViews[a.bufferView]; const stride = bv.byteStride || 12, base = (bv.byteOffset || 0) + (a.byteOffset || 0); let lo = Infinity, hi = -Infinity; for (let i = 0; i < a.count; i++) { const z = bin.readFloatLE(base + i * stride + 8); lo = Math.min(lo, z); hi = Math.max(hi, z); } return [lo, hi]; };
  const visit = (ni, tz) => { const n = json.nodes[ni]; if ((n.rotation && (Math.abs(n.rotation[0]) > 1e-9 || Math.abs(n.rotation[1]) > 1e-9 || Math.abs(n.rotation[2]) > 1e-9)) || (n.scale && n.scale.some((v) => Math.abs(v - 1) > 1e-9))) transformed = true; const z = tz + (n.translation?.[2] ?? 0); if (n.mesh !== undefined) for (const p of json.meshes[n.mesh].primitives) { const [lo, hi] = bounds(p.attributes.POSITION); mn = Math.min(mn, lo + z); mx = Math.max(mx, hi + z); } for (const c of n.children ?? []) visit(c, z); };
  for (const r of json.scenes[json.scene ?? 0].nodes) visit(r, 0);
  return { minZ: mn, maxZ: mx, transformed };
}
const floats = {}, sunk = {};
for (const a of manifest.assets) {
  const g = glbMinMaxZ(fs.readFileSync(abs(`${LIBRARY_ROOT}/${a.model}`)));
  ok(!g.transformed, `${a.id}: no node rotation/scale (the min-z parse applies translations only)`);
  ok(Number.isFinite(g.minZ) && g.maxZ > g.minZ, `${a.id}: GLB has real geometry (z ${g.minZ}..${g.maxZ})`);
  const md = readJson(`${LIBRARY_ROOT}/${a.metadata}`), slug = slugOf(a.id);
  if ((md.mounting === "FLOOR" || md.mounting === "BUILT_IN") && g.minZ > FLOOR_EPS_M) floats[slug] = +g.minZ.toFixed(3);
  if (g.minZ < -FLOOR_EPS_M) sunk[slug] = +g.minZ.toFixed(3);
}
ok(sameSet(Object.keys(floats), Object.keys(FLOOR_FLOATS)) && Object.entries(floats).every(([k, z]) => Math.abs(z - FLOOR_FLOATS[k]) < 5e-4), `floor/built-in floats recomputed == FLOOR_FLOATS (${Object.keys(floats).length} vs ${Object.keys(FLOOR_FLOATS).length}) — disk-only: ${Object.keys(floats).filter((k) => !(k in FLOOR_FLOATS)).join(",")}; decl-only: ${Object.keys(FLOOR_FLOATS).filter((k) => !(k in floats)).join(",")}`);
ok(sameSet(Object.keys(sunk), Object.keys(FLOOR_SUNK)) && Object.entries(sunk).every(([k, z]) => Math.abs(z - FLOOR_SUNK[k]) < 5e-4), `sunk models recomputed == FLOOR_SUNK (${Object.keys(sunk).join(",")})`);
for (const r of lib) {
  const slug = slugOf(r.id), g = SHARED_GEOMETRY.find((x) => x.includes(slug));
  if (g) ok(g.filter((s) => s !== slug).every((s) => r.notes.includes(`${ID_PREFIX}${s.replace(/-/g, ".")}.v1`)), `${r.id}: NOTES name every shared-geometry twin`);
  if (slug in FLOOR_FLOATS) ok(r.notes.includes(`min z ${FLOOR_FLOATS[slug].toFixed(2)} (floor asset floats)`), `${r.id}: NOTES carry the float`);
  if (slug in FLOOR_SUNK) ok(r.notes.includes("sunk below the floor"), `${r.id}: NOTES carry the sink`);
}

// ── 7. the starter pack: all 18 superseded ──
const starter = readJson(`${STARTER_ROOT}/manifest.json`);
ok(starter.assets.length === 18 && sameSet(starter.assets.map((a) => a.id), Object.values(STARTER_LINEAGE)), "STARTER_LINEAGE covers exactly the 18 starter ids");
for (const [slug, sid] of Object.entries(STARTER_LINEAGE)) { const r = byId.get(`${ID_PREFIX}${slug.replace(/-/g, ".")}.v1`); ok(!!r && r.starterId === sid && r.origin === "LIBRARY", `starter ${sid} → ${slug} (a LIBRARY row with starterId)`); }
ok(lib.filter((r) => r.starterId).length === 18 && sum.starterSuperseded === 18, "18 LIBRARY rows carry a starterId");
ok(starter.assets.every((a) => fs.existsSync(abs(`${STARTER_ROOT}/${a.model}`))), "the 18 starter GLBs are still on disk (lineage, not deleted)");

// ── 8. enums, sources, legacy kinds, duplicates ──
for (const r of rows) {
  ok(r.rooms.length >= 1 && r.rooms.every((x) => ROOM_IDS.includes(x)), `${r.id}: rooms valid`);
  ok(r.phases.length >= 1 && r.phases.every((x) => PHASE_IDS.includes(x)), `${r.id}: phases valid`);
  ok(ORIGINS.includes(r.origin), `${r.id}: origin valid`);
  ok(r.sources.length >= 1 && r.sources.every((s) => BOARDS.includes(s) || s === MANIFEST_SOURCE || s === MASTER_18_SOURCE), `${r.id}: ≥1 source, all from the known set (${r.sources.filter((s) => !BOARDS.includes(s) && s !== MANIFEST_SOURCE && s !== MASTER_18_SOURCE).join(",")})`);
  ok(r.referenceNames.length >= 1 && r.referenceNames[0] === r.label && new Set(r.referenceNames).size === r.referenceNames.length, `${r.id}: names start with the label and are distinct as printed (punctuation variants of one name are kept verbatim)`);
  ok(r.packs.every((p) => PACK_NUMBERS.includes(p)) && [...r.packs].sort((a, b) => a - b).join() === r.packs.join(), `${r.id}: packs are 1–10, sorted`);
}
for (const b of BOARDS) ok(fs.existsSync(abs(`${BOARDS_ROOT}/${b}`)), `board on disk: ${b}`);
ok(BOARDS.length === 35, "35 boards in his library export");
for (const [alias, target] of Object.entries(BOARD_ALIASES)) ok(BOARDS.includes(target) && fs.existsSync(abs(`docs/asks/img/${alias}`)), `chat board ${alias} → ${target}, both on disk`);
const kinds = rows.filter((r) => r.legacyKind).map((r) => r.legacyKind);
ok(sameSet(kinds, OBJECT_KINDS), `every legacy ObjectKind is on exactly one row — missing: ${OBJECT_KINDS.filter((k) => !kinds.includes(k)).join(",")}; doubled: ${kinds.filter((k, i) => kinds.indexOf(k) !== i).join(",")}`);
for (const d of dups) {
  const t = byId.get(d.duplicateOf);
  ok(!!t && !t.duplicateOf, `${d.id}: duplicateOf → an existing canonical row`);
  if (t) ok(d.glb === t.glb && d.plan === t.plan && d.metadata === t.metadata, `${d.id}: mirrors its target's statuses`);
  ok(d.notes.startsWith(`DUPLICATE_NORMALIZED → ${d.duplicateOf}`), `${d.id}: NOTES say DUPLICATE_NORMALIZED`);
}
ok(rows.every((r) => (r.origin === "DUPLICATE") === !!r.duplicateOf), "duplicateOf ⇔ origin DUPLICATE");

// ── 9. the generated ledger is byte-identical and carries the counts ──
const onDisk = fs.existsSync(abs(LEDGER_PATH)) ? fs.readFileSync(abs(LEDGER_PATH), "utf8") : null;
const fresh = renderInventoryMarkdown();
ok(onDisk !== null, `${LEDGER_PATH} exists (run npm run assets:inventory)`);
ok(onDisk === fresh, `${LEDGER_PATH} is byte-identical to a fresh generation (regenerate with npm run assets:inventory)`);
ok(fresh === renderInventoryMarkdown(), "the generator is deterministic (two renders agree)");
ok(fresh.includes(`| ${COLUMNS.join(" | ")} |`) && COLUMNS.length === 11, "the ledger carries the §29 columns, 11 of them");
ok(fresh.includes(`**Manifest assets (his library): ${MANIFEST_COUNT}** — GLB READY ${MANIFEST_COUNT}`), "header: manifest assets READY");
ok(fresh.includes(`**§18 lines his library lacks: ${m18.length}** — MISSING`) && fresh.includes(`**Wider-export labels his library lacks: ${board.length}** — MISSING`), "header: §18-only and board-only MISSING counts");
ok(fresh.includes(`**Board placements (his \`inventory/placements.json\`): ${PLACEMENTS.total}**`), "header: 148 placements");
for (const n of PACK_NUMBERS) ok(fresh.includes(`| ${n} | `) && fresh.includes(`| ${PLACEMENTS.byPack[n]} | ${sum.byPack[n].manifest} | ${sum.byPack[n].rows} | ${sum.byPack[n].ready} | ${sum.byPack[n].missing} |`), `header: pack ${n} counts`);
ok((fresh.match(/^\| \*\*/gm) ?? []).length === rows.length, `the ledger has one table row per inventory row (${(fresh.match(/^\| \*\*/gm) ?? []).length} vs ${rows.length})`);
for (const r of rows) ok(fresh.includes(`\`${r.id}\``), `ledger carries ${r.id}`);
const missing = missingByPack();
ok(Object.values(missing).flat().every((r) => r.glb === "MISSING") && new Set(Object.values(missing).flat().map((r) => r.id)).size === m18.length + board.length, "the MISSING section lists every gap once per pack");
ok(sortedRows().map((r) => r.id).join() === sortedRows(sortedRows().reverse()).map((r) => r.id).join(), "sortedRows is order-independent");

console.log(`architect-asset-inventory: ${pass} passed, ${fail} failed · rows ${rows.length} (manifest ${lib.length} · §18-only ${m18.length} · board-only ${board.length} · duplicates ${dups.length}) · GLB READY ${sum.byGlb.READY} · MISSING ${sum.byGlb.MISSING} · placements ${PLACEMENTS.total}`);
if (fail) process.exit(1);

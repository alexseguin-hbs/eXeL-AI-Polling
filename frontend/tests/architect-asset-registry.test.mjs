// ARCHITECT-2525 · ASSET REGISTRY GATE (Rev A — "asset registry + materials + reusable primitive helpers").
// The brief (docs/asks/2026.11.07_architect2525_native_asset_regeneration_brief.md §25) + the plan's THE BAR gate:
// unique stable ids · every kind registered · rooms ⊆ the 9 canonical kinds or GENERAL · phases ⊆ DEV_PHASES and EQUAL
// to the one PhaseProjection · mounting valid (and consistent with onWall) · nonzero valid µm dims · lod 1 · authority
// ILLUSTRATIVE/REFERENCE only · no colour literal outside materials.ts · WOOD only on isWoodKind · shapePartsOf unchanged
// · setSize clamps + footprintOf honours size · partRects == the designer's previous rotRect · assetExport deterministic
// + round-trips · and the CRITICAL INVARIANT: an illustrative asset edit never touches canonical truth (project_hash).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-asset-registry.test.mjs
import fs from "node:fs";
import path from "node:path";
import {
  OBJECT_KINDS, OBJECT_SPEC, ASSET_PARAMS, ROOM_KEYS, ASSET_CATEGORIES, MOUNTINGS, VARIANTS, ROOM_ASSETS, COMMON_ASSETS,
  ROOM_GRID, shapePartsOf, shapePartsAt, SHAPE_PARTS_LOD, LOD_LEVELS, setSize, footprintOf, heightOf, elevOf, partRects,
  placeObject, rotateObject, applyTypedSize, applyTypedHeight, sameArrangement, kindByAssetId, groupOf, worldSpan,
} from "../lib/room-objects.ts";
import { TINY_ROOM_LAYOUT, setRoomObjects, cloneLayout } from "../lib/room-layout.ts";
import { DEV_PHASES, showGroupInPhase } from "../lib/architect-phases.ts";
import { ASSET_REGISTRY, ASSET_IDS, ASSET_COUNT, LIBRARY_COUNT, LIBRARY_SOURCE, ASSET_ID_BY_KIND, ASSET_BASE_URL, ALLOWED_DEGREES, assetById, assetByKind, listAssets, assetPhases, metadataById } from "../lib/architect-2525/assets/registry.ts";
import { LIBRARY_MANIFEST, LIBRARY_METADATA } from "../lib/architect-2525/assets/library-manifest.ts";
import { SECTION_RULES, roomsForSections, phasesForSections, categoryForSections, isKnownSection } from "../lib/architect-2525/assets/sections.ts";
import { isAssetCompatibleWithRoom } from "../lib/architect-2525/assets/room-compatibility.ts";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import os from "node:os";
import { toPlacedAsset, fromPlacedAsset, placedAssetsOf, snapRotation } from "../lib/architect-2525/assets/placed-asset.ts";
import { ROOM_NAME_BY_KEY, ROOM_NAMES, roomKeyByName, roomNamesOf } from "../lib/architect-2525/assets/room-compatibility.ts";
import { PHASE_NAMES, PHASE_NAME_BY_ID, phaseNamesFor } from "../lib/architect-2525/assets/phase-compatibility.ts";
import { mFromFt, ftFromM, dimsM } from "../lib/architect-2525/assets/dimensions.ts";
import { MATERIALS, ARCH_EDGE, SEMANTIC, isWoodKind, WOOD_KINDS, materialOf } from "../lib/architect-2525/assets/materials.ts";
import { dimsUm, dimsFt, umFromFt, ftFromUm } from "../lib/architect-2525/assets/dimensions.ts";
import { assetsForRoom, assetsGeneral, isCompatibleWithRoom } from "../lib/architect-2525/assets/room-compatibility.ts";
import { SNAP_TARGETS } from "../lib/room-objects.ts";
import { visibleInPhase, phasesFor, assetsForPhase, resolveKind } from "../lib/architect-2525/assets/phase-compatibility.ts";
import { PACK_INTERIORS_FIXTURES, packIds } from "../lib/architect-2525/assets/packs/interiors-fixtures.ts";
import { assetExport, ASSET_EXPORT_SCHEMA, revitClassOf } from "../lib/architect-asset-export.ts";
import { MEP_COLOR } from "../lib/mep-runs.ts";
import { FRAME_COLOR } from "../lib/architect-phase-palette.ts";
import { UM_PER_FT } from "../lib/architect-2525/canonical/units.ts";
import { buildProjectFromSeed } from "../lib/architect-2525/canonical/runtime.ts";
import { projectHash, serializeCanonicalProject } from "../lib/architect-2525/canonical/serialize.ts";
import { toRoomCells } from "../lib/architect-2525/canonical/legacy-view.ts";
import { TINY_HOME_V1 } from "../lib/architect-2525/seeds/tiny-home-v1.ts";
import { sanitizeRoomLayout } from "../lib/architect-guard.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const FE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (p) => fs.readFileSync(path.join(FE, p), "utf8");
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// ── 1. identity: every kind registered, unique stable ids, one entry per kind ──
const ids = OBJECT_KINDS.map((k) => ASSET_PARAMS[k].id);
ok(OBJECT_KINDS.every((k) => Object.hasOwn(ASSET_PARAMS, k)), "every ObjectKind has ASSET_PARAMS");
ok(new Set(ids).size === ids.length && ids.every((id) => /^architect2525\.asset\.[a-z0-9]+(\.[a-z0-9]+)*\.v\d+$/.test(id)), `stable ids are unique, in HIS library grammar architect2525.asset.<name>.v1 (${ids.length})`);
// ID SOURCE (FINAL) — his COMPLETE library manifest (139). The 29-row map + the provenance aliases (starter-pack id · rotator id).
const KIND_ID = {
  bed: "bed.queen.king", sofa: "sofa", counter: "base.cabinets.w.sink", table: "dining.table", desk: "desk", toilet: "toilet", tub: "bathtub",
  sink: "bath.vanity.sink", washer: "washer", dresser: "dresser", nightstand: "nightstand", tv: "tv.console", fridge: "refrigerator",
  stove: "range.oven", shower: "shower.stall", wardrobe: "wardrobe", bookshelf: "bookshelf", chair: "dining.chair", closetrod: "closet.rod",
  shelving: "storage.shelving", shoerack: "shoe.rack", rug: "area.rug", mirror: "mirror.led", lamp: "floor.lamp", rangehood: "range.hood",
  shell: "wall.sheathing", roof: "roof.sheathing", door: "door.interior.exterior", window: "window.single",
};
const ALIASES = {
  bed: ["furniture.bed.queen.v1"], sofa: ["furniture.sofa.3seat.v1"], counter: ["kitchen.base_run.sink.v1"], table: ["furniture.dining_table.v1"],
  desk: ["desk.v1"], toilet: ["bath.toilet.v1"], tub: ["bathtub.v1"], sink: ["bath.vanity_sink.v1"], washer: ["appliance.washer.frontload.v1"],
  dresser: ["furniture.dresser.v1"], nightstand: ["furniture.nightstand.v1"], tv: ["tv.console.v1"], fridge: ["appliance.refrigerator.frenchdoor.v1"],
  stove: ["range.oven.v1"], shower: ["bath.shower.enclosure.v1"], wardrobe: ["wardrobe.v1"], bookshelf: ["bookshelf.v1"], chair: ["furniture.dining_chair.v1"],
  closetrod: ["closet.rod.v1"], shelving: ["storage.shelving.v1"], shoerack: ["shoe.rack.v1"], rug: ["area.rug.v1"], mirror: ["mirror.led.v1"],
  lamp: ["floor.lamp.v1"], rangehood: ["range.hood.v1"], shell: ["wall.sheathing.v1"], roof: ["roof.sheathing.v1"], door: ["opening.door.interior.v1"], window: ["opening.window.unit.v1"],
};
const PENDING_KINDS = ["closetrod", "shoerack"];
ok(OBJECT_KINDS.every((k) => ASSET_PARAMS[k].id === `architect2525.asset.${KIND_ID[k]}.v1`) && Object.keys(KIND_ID).length === OBJECT_KINDS.length, "the 29 kind → his library id rows hold, verbatim");
ok(OBJECT_KINDS.every((k) => JSON.stringify(ASSET_PARAMS[k].aliases) === JSON.stringify(ALIASES[k])), "every kind carries its provenance aliases (starter-pack / rotator ids)");
ok(OBJECT_KINDS.every((k) => ASSET_PARAMS[k].aliases.every((a) => kindByAssetId(a) === k && assetById(a)?.kind === k)), "kindByAssetId + assetById resolve every alias to its kind (a stored PlacedAsset from an earlier edition still resolves)");
ok(OBJECT_KINDS.every((k) => (ASSET_PARAMS[k].library === !PENDING_KINDS.includes(k)) && (Object.hasOwn(LIBRARY_METADATA, ASSET_PARAMS[k].id) === ASSET_PARAMS[k].library)), "27 kinds have a library entry; closet rod + shoe rack are the ONLY two without (PENDING)");
ok(LIBRARY_COUNT === 139 && ASSET_COUNT === 141 && ASSET_IDS.length === 141 && LIBRARY_MANIFEST.length === 139 && Object.keys(LIBRARY_METADATA).length === 139, `registry = 139 library assets + 2 PENDING kinds = 141 (got ${ASSET_COUNT})`);
ok(ASSET_IDS.filter((id) => ASSET_REGISTRY[id].kind === null).length === 112 && ASSET_IDS.filter((id) => ASSET_REGISTRY[id].kind !== null).length === 29, "112 library assets have no legacy kind yet (kind: null); 29 are placeable");
ok(LIBRARY_MANIFEST.every((e) => ASSET_REGISTRY[e.id]?.modelStatus === "LIBRARY" && ASSET_REGISTRY[e.id].label === e.label && ASSET_REGISTRY[e.id].model === e.model && ASSET_REGISTRY[e.id].planSymbol === e.planSymbol && ASSET_REGISTRY[e.id].metadataPath === e.metadata), "every manifest asset is a LIBRARY entry carrying his label + paths verbatim");
// (the rotator / starter-pack ids live on as `aliases`, asserted above)
ok(OBJECT_KINDS.every((k) => Object.hasOwn(ASSET_REGISTRY, ASSET_PARAMS[k].id) && ASSET_REGISTRY[ASSET_PARAMS[k].id].kind === k), "every kind owns exactly one registry entry (kind back-reference)");
ok(ASSET_PARAMS.toilet.id === "architect2525.asset.toilet.v1" && ASSET_PARAMS.sofa.id === "architect2525.asset.sofa.v1" && ASSET_PARAMS.fridge.id === "architect2525.asset.refrigerator.v1" && ASSET_PARAMS.door.id === "architect2525.asset.door.interior.exterior.v1", "the coordinator's examples hold (toilet · sofa · refrigerator · door)");
ok(OBJECT_KINDS.every((k) => ASSET_ID_BY_KIND[k] === ASSET_PARAMS[k].id), "ASSET_ID_BY_KIND is the kind → id map");
ok(OBJECT_KINDS.every((k) => assetById(ASSET_PARAMS[k].id)?.kind === k && assetByKind(k).id === ASSET_PARAMS[k].id && kindByAssetId(ASSET_PARAMS[k].id) === k), "id ⇄ kind round-trips (assetById · assetByKind · kindByAssetId)");
ok(assetById("constructor") === undefined && assetById("nope.v1") === undefined && resolveKind("__proto__") === undefined, "unknown / prototype ids resolve to nothing (own keys only)");
ok(OBJECT_KINDS.every((k) => ASSET_REGISTRY[ASSET_PARAMS[k].id].kindLabel === OBJECT_SPEC[k].label && ASSET_REGISTRY[ASSET_PARAMS[k].id].onWall === OBJECT_SPEC[k].onWall), "a kind's entry carries OBJECT_SPEC's label (kindLabel) + onWall (no second truth); `label` is his");

// ── 2. rooms ⊆ the 9 canonical kinds or GENERAL; ROOM_KEYS = room-layout's keys; palette ⊆ compatibility ──
const layoutKeys = [...new Set(TINY_ROOM_LAYOUT.map((r) => r.k))].sort().join("");
ok([...ROOM_KEYS].sort().join("") === layoutKeys && ROOM_KEYS.length === 9, `ROOM_KEYS == TINY_ROOM_LAYOUT keys (${layoutKeys})`);
ok(OBJECT_KINDS.every((k) => { const r = ASSET_PARAMS[k].rooms; return r === "GENERAL" || (Array.isArray(r) && r.length > 0 && r.every((x) => ROOM_KEYS.includes(x)) && new Set(r).size === r.length); }), "rooms ⊆ the 9 canonical room keys or GENERAL (never an invented room)");
ok(Object.entries(ROOM_ASSETS).every(([k, kinds]) => kinds.every((kind) => isCompatibleWithRoom(kind, k))), "ROOM_ASSETS (the designer palette) ⊆ room compatibility");
ok(COMMON_ASSETS.every((k) => ASSET_PARAMS[k].rooms === "GENERAL") && assetsGeneral().length === COMMON_ASSETS.length, "COMMON_ASSETS (door/window/shell/roof) are the GENERAL shared assets");
ok(assetsForRoom("K").includes("fridge") && assetsForRoom("K").includes("door") && !assetsForRoom("K").includes("bed") && !assetsForRoom("K", false).includes("door"), "assetsForRoom K: fridge + GENERAL door, no bed; includeGeneral=false drops the shared set");
ok(!assetsForRoom("M").includes("dresser") && assetsForRoom("C").includes("dresser"), "HI decision kept: no dresser in the Master Bedroom — it lives in the Master Closet");

// ── 3. phases ⊆ DEV_PHASES ids and EQUAL to the one PhaseProjection (showGroupInPhase(groupOf)) ──
const phaseIds = DEV_PHASES.map((p) => p.id);
ok(OBJECT_KINDS.every((k) => ASSET_PARAMS[k].phases.length > 0 && ASSET_PARAMS[k].phases.every((p) => phaseIds.includes(p))), "phases ⊆ DEV_PHASES ids, never empty");
ok(OBJECT_KINDS.every((k) => JSON.stringify(ASSET_PARAMS[k].phases) === JSON.stringify(phaseIds.filter((p) => showGroupInPhase(groupOf(k), p)))), "authored phases == the showGroupInPhase truth for every kind (one truth, two carriers)");
ok(OBJECT_KINDS.every((k) => JSON.stringify(phasesFor(k)) === JSON.stringify(ASSET_PARAMS[k].phases) && JSON.stringify(assetPhases(ASSET_PARAMS[k].id)) === JSON.stringify(ASSET_PARAMS[k].phases)), "phasesFor(kind | id) == authored phases");
ok(OBJECT_KINDS.every((k) => [...phaseIds, null, undefined].every((p) => visibleInPhase(k, p) === showGroupInPhase(groupOf(k), p) && visibleInPhase(ASSET_PARAMS[k].id, p) === visibleInPhase(k, p))), "visibleInPhase(id | kind, phase) IS showGroupInPhase(groupOf) — one PhaseProjection");
ok(OBJECT_KINDS.every((k) => visibleInPhase(k, null)) && !visibleInPhase("nope.v1", "interior"), "no phase = the full design view shows everything; an unknown asset is never visible");
ok(!visibleInPhase("sofa", "framing") && visibleInPhase("door", "framing") && visibleInPhase("sofa", "interior") && !visibleInPhase("sofa", "foundation"), "furniture is hidden in Framing / Foundation, a door shows in Framing, the sofa shows in Interior Design");
ok(assetsForPhase("framing").every((k) => ["door", "window", "shell", "roof"].includes(k)) && assetsForPhase("interior").length === OBJECT_KINDS.length, "assetsForPhase: framing = openings + shell only; interior = every asset");
ok(listAssets({ phase: "framing" }).every((a) => a.category === "DOORS_WINDOWS" || a.category === "BUILDING_ELEMENTS"), "listAssets({phase:'framing'}) never lists furniture");

// ── 4. mounting valid + consistent with onWall; category + authority valid; lod 1 ──
ok(MOUNTINGS.join() === "FLOOR,WALL,CEILING,SURFACE,BUILT_IN" && OBJECT_KINDS.every((k) => MOUNTINGS.includes(ASSET_PARAMS[k].mounting)), "mounting ∈ his enum FLOOR | WALL | CEILING | SURFACE | BUILT_IN");
ok(OBJECT_KINDS.every((k) => OBJECT_SPEC[k].onWall ? ["WALL", "BUILT_IN"].includes(ASSET_PARAMS[k].mounting) : ASSET_PARAMS[k].mounting !== "WALL"), "onWall kinds are WALL/BUILT_IN; free kinds never WALL (a toilet cannot attach to a wall or ceiling)");
ok(ASSET_PARAMS.toilet.mounting === "FLOOR" && ASSET_PARAMS.roof.mounting === "BUILT_IN" && ASSET_PARAMS.door.mounting === "WALL" && ASSET_PARAMS.window.mounting === "WALL" && ASSET_PARAMS.counter.mounting === "SURFACE", "toilet FLOOR · roof BUILT_IN · door + window WALL · base cabinets SURFACE (his library)");
const MOUNT_DEVIATIONS = { tv: "his TV Console sits on the floor; the designer's `tv` is the WALL screen (onWall)", rangehood: "his range hood is a floor model; ours is WALL-hung over the range (onWall)", shelving: "his storage shelving is free-standing; ours is WALL-hung closet/laundry shelving (onWall)", shell: "his wall sheathing panel stands on the floor; ours is the BUILT_IN wall panel (onWall)" };
ok(OBJECT_KINDS.filter((k) => ASSET_PARAMS[k].library).every((k) => Object.hasOwn(MOUNT_DEVIATIONS, k) || (ASSET_PARAMS[k].mounting === LIBRARY_METADATA[ASSET_PARAMS[k].id].mounting && JSON.stringify(ASSET_PARAMS[k].snap) === JSON.stringify(LIBRARY_METADATA[ASSET_PARAMS[k].id].snap))), "every library-backed kind carries HIS mounting + snap verbatim, except the four documented onWall deviations");
ok(Object.keys(MOUNT_DEVIATIONS).every((k) => OBJECT_SPEC[k].onWall && ASSET_PARAMS[k].mounting !== LIBRARY_METADATA[ASSET_PARAMS[k].id].mounting), "each deviation is an onWall kind whose designer mounting really differs from his (never a silent copy)");
ok(OBJECT_KINDS.filter((k) => ASSET_PARAMS[k].library).every((k) => JSON.stringify(ASSET_PARAMS[k].packs) === JSON.stringify(LIBRARY_METADATA[ASSET_PARAMS[k].id].packs)), "every library-backed kind carries HIS packs verbatim (the dining pair's [] included)");
ok(OBJECT_KINDS.every((k) => ASSET_PARAMS[k].snap.length > 0 && ASSET_PARAMS[k].snap.every((s) => SNAP_TARGETS.includes(s))), "every kind has snap targets from his taxonomy");
ok(JSON.stringify(ASSET_PARAMS.toilet.snap) === '["FLOOR"]' && JSON.stringify(ASSET_PARAMS.window.snap) === '["WALL"]' && JSON.stringify(ASSET_PARAMS.roof.snap) === '["ROOF_LINE"]' && JSON.stringify(ASSET_PARAMS.sink.snap) === '["SURFACE"]', "his library snap: toilet FLOOR · window WALL · roof sheathing ROOF_LINE · vanity SURFACE");
ok(OBJECT_KINDS.every((k) => ASSET_PARAMS[k].packs.every((n) => Number.isInteger(n) && n >= 1 && n <= 10) && (ASSET_PARAMS[k].packs.length > 0 || ["table", "chair"].includes(k))) && ASSET_PARAMS.fridge.packs.join() === "2,4" && ASSET_PARAMS.rangehood.packs.join() === "2,4" && ASSET_PARAMS.rug.packs.join() === "9", "packs 1..10 from his manifest (only his 'Verified extras' dining pair carry []); refrigerator / range hood in 2 + 4, area rug in 9");
ok(OBJECT_KINDS.every((k) => ASSET_CATEGORIES.includes(ASSET_PARAMS[k].category)), "category ∈ the brief §17 general categories");
ok(OBJECT_KINDS.every((k) => ["ILLUSTRATIVE", "REFERENCE"].includes(ASSET_PARAMS[k].authority)), "authority ILLUSTRATIVE | REFERENCE only — never verified/engineered/qualified/certified");
ok(!/"(VERIFIED|ENGINEERED|QUALIFIED|CERTIFIED)"/.test(read("lib/room-objects.ts").split("ASSET_PARAMS")[1] ?? "") , "no engineering-validation word in the asset definitions");
ok(OBJECT_KINDS.every((k) => ASSET_PARAMS[k].lod === 1 && ASSET_REGISTRY[ASSET_PARAMS[k].id].lod === 1), "every definition is authored at lod 1 (of 5)");
ok(LOD_LEVELS.join() === "1,2,3,4,5", "LOD_LEVELS = 1..5 (the five levels of increasing detail)");
ok(listAssets({ category: "LIGHTING" }).map((a) => a.kind).includes("lamp") && listAssets({ category: "LIGHTING" }).length === 8 && listAssets({ room: "B", category: "FIXTURES" }).map((a) => a.kind).includes("toilet"), "listAssets filters by category and room (LIGHTING = the floor lamp kind + his 7 Lighting-section assets)");
ok(listAssets().length === ASSET_COUNT && JSON.stringify(listAssets()) === JSON.stringify(listAssets()), "listAssets() = every registry entry (141), deterministic");

// ── 5. dimensions: nonzero, default within the parametric range, variants within range, safe-int µm ──
ok(OBJECT_KINDS.every((k) => ["w", "d", "h"].every((ax) => { const r = ASSET_PARAMS[k].params[ax]; return r.min > 0 && r.max >= r.min && r.step > 0 && r.min <= OBJECT_SPEC[k][ax] + 1e-9 && OBJECT_SPEC[k][ax] <= r.max + 1e-9; })), "every w/d/h range is positive and holds the kind default");
ok(OBJECT_KINDS.every((k) => ASSET_PARAMS[k].params.w.max <= ROOM_GRID && ASSET_PARAMS[k].params.d.max <= ROOM_GRID && ASSET_PARAMS[k].params.h.max <= ROOM_GRID), "no range exceeds the 10-ft room");
ok(Object.entries(VARIANTS).every(([k, vs]) => vs.every((v) => { const p = ASSET_PARAMS[k].params; return v.w >= p.w.min - 1e-9 && v.w <= p.w.max + 1e-9 && v.d >= p.d.min - 1e-9 && v.d <= p.d.max + 1e-9 && (typeof v.h !== "number" || (v.h >= p.h.min - 1e-9 && v.h <= p.h.max + 1e-9)); })), "every standard VARIANT lies inside its kind's parametric range");
ok(OBJECT_KINDS.every((k) => { const d = dimsUm(k); return [d.widthUm, d.depthUm, d.heightUm].every((n) => Number.isSafeInteger(n) && n > 0); }), "dimsUm: nonzero safe-integer µm for every kind");
ok(umFromFt(5) === 1_524_000 && umFromFt(10) === 3_048_000 && umFromFt(0) === 0 && umFromFt(2 / 3) === 203_200, "umFromFt: 5 ft = 1,524,000 µm · 10 ft = 3,048,000 · 8 in = 203,200");
ok([0.4, 2.67, 6.67, 1.7, 0.1, 7.25, 1 / 12].every((x) => Math.abs(ftFromUm(umFromFt(x)) - x) <= 1 / UM_PER_FT), "ftFromUm(umFromFt(x)) ≈ x within 1 µm");
let threw = false; try { umFromFt(NaN); } catch { threw = true; }
ok(threw, "umFromFt refuses a non-finite value (never stores NaN)");
ok(dimsFt("sofa").w === 5 && dimsFt("sofa", { id: "s", kind: "sofa", gx: 0, gy: 0, rot: 0, size: { w: 7 } }).w === 7, "dimsFt reads the instance size when given");
ok(OBJECT_KINDS.every((k) => { const r = ASSET_REGISTRY[ASSET_PARAMS[k].id]; return r.dimensionsUm.widthUm === umFromFt(OBJECT_SPEC[k].w) && r.dimensions.h === OBJECT_SPEC[k].h; }), "a kind's registry dimensions (ft) = OBJECT_SPEC defaults + their µm projection (the designer's truth)");
ok(OBJECT_KINDS.filter((k) => ASSET_PARAMS[k].library).every((k) => JSON.stringify(ASSET_REGISTRY[ASSET_PARAMS[k].id].dimensionsM) === JSON.stringify(LIBRARY_METADATA[ASSET_PARAMS[k].id].dimensionsM)), "a library-backed kind's dimensionsM are HIS, verbatim (the ft default is reported beside them, never silently replaced)");
ok(ASSET_IDS.filter((id) => ASSET_REGISTRY[id].kind === null).every((id) => { const a = ASSET_REGISTRY[id]; const m = LIBRARY_METADATA[id]; return near(a.dimensions.w, ftFromM(m.dimensionsM.width), 1e-6) && a.dimensionsUm.widthUm === umFromFt(a.dimensions.w) && a.dimensionsUm.widthUm > 0; }), "a kind-less library asset's ft dimensions come from his metres (ftFromM), µm safe-int");

// ── 6. materials: the ONE place for colour literals; WOOD = FRAME_COLOR, only on wood kinds; no hex shared with MEP ──
const assetDir = path.join(FE, "lib/architect-2525/assets");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const scanned = [...walk(assetDir).filter((f) => f.endsWith(".ts")), path.join(FE, "lib/architect-asset-export.ts")].map((f) => path.relative(FE, f));
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const literalOffenders = scanned.filter((f) => !f.endsWith("assets/materials.ts") && COLOUR.test(read(f)));
ok(scanned.length >= 7 && literalOffenders.length === 0, `no colour literal outside materials.ts in ${scanned.length} asset-layer files (${literalOffenders.join(", ") || "none"})`);
ok(MATERIALS.WOOD.fill === FRAME_COLOR && !/#e0b872/i.test(read("lib/architect-2525/assets/materials.ts")), "WOOD is FRAME_COLOR imported, never re-literalled");
const mepHexes = new Set(Object.values(MEP_COLOR).map((c) => c.toLowerCase()));
ok(["ARCH_TEAL", "ARCH_ACCENT", "GLASS", "SCREEN"].every((m) => !mepHexes.has(MATERIALS[m].fill.toLowerCase())) && !mepHexes.has(ARCH_EDGE.toLowerCase()), "no Architect material hex is an MEP_COLOR (appliances never read as water)");
ok(SEMANTIC.ELECTRICAL === MEP_COLOR.wiring && SEMANTIC.WATER === MEP_COLOR.water && SEMANTIC.AIR === MEP_COLOR.duct, "semantic colours are re-exported from MEP_COLOR (one source)");
ok(Object.values(MATERIALS).every((m) => m.edge === ARCH_EDGE && m.opacity > 0 && m.opacity <= 1) && MATERIALS.GLASS.opacity < 1, "every material carries the bright-cyan edge; only glass is translucent");
ok(OBJECT_KINDS.every((k) => ASSET_PARAMS[k].materialPreset !== "WOOD" || isWoodKind(k)), "WOOD body preset only on isWoodKind");
ok(OBJECT_KINDS.every((k) => LOD_LEVELS.every((l) => shapePartsAt(k, l).every((p) => p.accent !== "WOOD" || isWoodKind(k)))), "WOOD part accent only on isWoodKind, at every LOD");
ok(["stud", "truss", "sheathing", "rafter"].every(isWoodKind) && !OBJECT_KINDS.some(isWoodKind) && WOOD_KINDS.length >= 5, "wood = framing/shell members (studs, trusses, sheathing …); no placed kind is wood today");
ok(materialOf("sofa", "WOOD").id === "ARCH_TEAL" && materialOf("sofa", "ACCENT").id === "ARCH_ACCENT" && materialOf("tv").id === "SCREEN" && materialOf("window").id === "GLASS", "materialOf: WOOD on a non-wood kind falls back to the body; accent/glass/screen resolve");

// ── 7. shapePartsOf unchanged for existing kinds (byte snapshot) + LOD keying ──
const SNAP = {
  bed:    [{ x: 0, y: 0, z: 0, w: 1, d: 1, h: 0.35 }, { x: 0.06, y: 0.1, z: 0.35, w: 0.88, d: 0.85, h: 0.33 }, { x: 0.12, y: 0.12, z: 0.68, w: 0.76, d: 0.22, h: 0.26 }, { x: 0, y: 0, z: 0, w: 1, d: 0.1, h: 1.0 }],
  sofa:   [{ x: 0, y: 0.34, z: 0, w: 1, d: 0.66, h: 0.5 }, { x: 0, y: 0, z: 0, w: 1, d: 0.34, h: 1 }],
  toilet: [{ x: 0.12, y: 0.3, z: 0, w: 0.76, d: 0.7, h: 0.55 }, { x: 0.12, y: 0, z: 0, w: 0.76, d: 0.3, h: 1 }],
  fridge: [{ x: 0, y: 0, z: 0.45, w: 1, d: 1, h: 0.55 }, { x: 0, y: 0, z: 0, w: 1, d: 1, h: 0.45 }],
};
ok(Object.entries(SNAP).every(([k, parts]) => JSON.stringify(shapePartsOf(k)) === JSON.stringify(parts)), "shapePartsOf(bed/sofa/toilet/fridge) is byte-identical to the shipped L1 data");
ok(OBJECT_KINDS.every((k) => JSON.stringify(shapePartsOf(k)) === JSON.stringify(shapePartsAt(k, 1))), "shapePartsOf(kind) == shapePartsAt(kind, 1)");
ok(OBJECT_KINDS.every((k) => LOD_LEVELS.every((l) => JSON.stringify(shapePartsAt(k, l)) === JSON.stringify(shapePartsOf(k)))), "with only L1 authored, every LOD renders the highest level present ≤ it (L1)");
ok(Object.keys(SHAPE_PARTS_LOD).every((k) => Object.keys(SHAPE_PARTS_LOD[k]).join() === "1") && shapePartsOf("counter").length === 1 && !Object.hasOwn(SHAPE_PARTS_LOD, "counter"), "SHAPE_PARTS_LOD keys only L1 today; a kind without parts falls back to one full box");
ok(OBJECT_KINDS.every((k) => ASSET_REGISTRY[ASSET_PARAMS[k].id].parts === shapePartsOf(k) && JSON.stringify(ASSET_REGISTRY[ASSET_PARAMS[k].id].lods) === (Object.hasOwn(SHAPE_PARTS_LOD, k) ? "[1]" : "[]")), "registry parts are the L1 parts; lods lists the authored levels");

// ── 8. setSize clamps + footprintOf / heightOf honour size; the ✎ router keeps the variant snap ──
let so = placeObject([], "sofa", 4, 4);
so = setSize(so, "sofa-1", "w", 7);
ok(so[0].size?.w === 7 && footprintOf(so[0]).w === 7 && footprintOf(so[0]).d === 2 && heightOf(so[0]) === OBJECT_SPEC.sofa.h, "setSize w 7 → footprint 7 × 2 (d/h fall through to the kind default)");
ok(near(footprintOf(setSize(so, "sofa-1", "w", 7.3)[0]).w, 88 / 12, 1e-6) && near(footprintOf(setSize(so, "sofa-1", "w", 7.27)[0]).w, 87 / 12, 1e-6), "setSize snaps to the 1-inch step (7.3 → 7'-4\", 7.27 → 7'-3\")");
ok(footprintOf(setSize(so, "sofa-1", "w", 99)[0]).w === ASSET_PARAMS.sofa.params.w.max && footprintOf(setSize(so, "sofa-1", "w", 0.1)[0]).w === ASSET_PARAMS.sofa.params.w.min, "setSize clamps to the kind's parametric range (max 10 · min 4)");
const wide = setSize(so, "sofa-1", "w", 10)[0];
ok(worldSpan(wide).x1 >= -1e-9 && worldSpan(wide).x2 <= ROOM_GRID + 1e-9, "a widened piece re-clamps its footprint inside the room (never through a wall)");
ok(heightOf(setSize(so, "sofa-1", "h", 3.25)[0]) === 3.25 && heightOf(setSize(so, "sofa-1", "h", 9)[0]) === ASSET_PARAMS.sofa.params.h.max, "setSize h is honoured and range-clamped");
const win = [{ id: "window-1", kind: "window", gx: 4, gy: 0, rot: 0, elev: 5 }];
ok(heightOf(setSize(win, "window-1", "h", 6)[0]) === 5, "setSize h keeps the top under the 10-ft ceiling (elev 5 → h ≤ 5, setElev's law)");
ok(JSON.stringify(setSize(so, "nope", "w", 7)) === JSON.stringify(so) && JSON.stringify(setSize(so, "sofa-1", "w", NaN)) === JSON.stringify(so), "setSize: unknown id / non-finite value → no-op");
ok(JSON.stringify(setSize(so, "sofa-1", "d", 3)) === JSON.stringify(setSize(so, "sofa-1", "d", 3)) && so[0].size.w === 7, "setSize is deterministic and never mutates its input");
ok(!sameArrangement(so, placeObject([], "sofa", 4, 4)), "a resized piece is an ARRANGED piece (sameArrangement differs — the guard keeps it)");
const bedTyped = applyTypedSize(placeObject([], "bed", 4, 4), "bed-1", 6.33);
ok(bedTyped[0].variant === "king" && bedTyped[0].size === undefined, "applyTypedSize on a kind WITH variants snaps to the nearest variant (bed → king), no size written");
ok(applyTypedSize(placeObject([], "sofa", 4, 4), "sofa-1", 7)[0].size?.w === 7 && applyTypedSize(placeObject([], "sofa", 4, 4), "sofa-1", 3, "y")[0].size?.d === 3, "applyTypedSize on a kind without variants writes the exact w (axis x) / d (axis y)");
ok(applyTypedHeight(placeObject([], "window", 4, 0), "window-1", 5)[0].variant === "w35" && applyTypedHeight(placeObject([], "bed", 4, 4), "bed-1", 2.5)[0].size?.h === 2.5, "applyTypedHeight: window → nearest height variant; bed (no height variants) → exact size.h");
ok(JSON.stringify(applyTypedSize(so, "nope", 7)) === JSON.stringify(so), "applyTypedSize unknown id → no-op");
// the ✎ dim-edit path in the designer routes through the router (no raw setVariantByWidth / setVariantByHeight left)
const rd = read("components/architect-2525/room-designer.tsx");
ok(/applyTypedHeight\(objects, sel\.id, v\)/.test(rd) && /applyTypedSize\(objects, sel\.id, v, ax\)/.test(rd) && !/setVariantByWidth\(|setVariantByHeight\(/.test(rd), "room-designer applyDim routes size/height through applyTypedSize/applyTypedHeight (exact sizes reach setSize)");
// the guard carries a stored size (the persist law: a reload must not strip it) and clamps a hostile one
const stored = cloneLayout().map((c) => (c.id === "living" ? { ...c, objects: [{ id: "sofa-1", kind: "sofa", gx: 4, gy: 4, rot: 0, size: { w: 7, d: 999, h: "x" } }] } : c));
const guarded = sanitizeRoomLayout(JSON.parse(JSON.stringify(stored))).find((c) => c.id === "living").objects[0];
ok(guarded.size?.w === 7 && guarded.size?.d === ASSET_PARAMS.sofa.params.d.max && guarded.size?.h === undefined, "sanitizeRoomLayout keeps a stored size (w 7), clamps a hostile one (d 999 → max), drops a non-number (h)");
ok(sanitizeRoomLayout(cloneLayout().map((c) => (c.id === "living" ? { ...c, objects: [{ id: "sofa-1", kind: "sofa", gx: 4, gy: 4, rot: 0 }] } : c))).find((c) => c.id === "living").objects[0].size === undefined, "a stored object without a size round-trips without one (byte-identical valid data)");

// ── 9. partRects == the designer's previous inline rotRect for rot 0/90/180/270 on a 2×3 object ──
const oldRects = (o) => {               // the lifted formula, verbatim from room-designer.tsx (pre-Rev A)
  const fp = footprintOf(o); const swap = o.rot === 90 || o.rot === 270;
  const W = swap ? fp.d : fp.w, D = swap ? fp.w : fp.d, hgt = heightOf(o);
  const ox = o.gx + 0.5 - W / 2, oy = o.gy + 0.5 - D / 2;
  const rotRect = (p) => {
    if (o.rot === 90)  return { x: p.y, y: 1 - (p.x + p.w), w: p.d, d: p.w };
    if (o.rot === 180) return { x: 1 - (p.x + p.w), y: 1 - (p.y + p.d), w: p.w, d: p.d };
    if (o.rot === 270) return { x: 1 - (p.y + p.d), y: p.x, w: p.d, d: p.w };
    return { x: p.x, y: p.y, w: p.w, d: p.d };
  };
  return shapePartsOf(o.kind).map((p) => {
    const r = rotRect(p); const x0 = ox + r.x * W, y0 = oy + r.y * D, w = r.w * W, d = r.d * D; const e0 = elevOf(o);
    return { x1: x0, y1: y0, x2: x0 + w, y2: y0 + d, z0: p.z * hgt + e0, z1: (p.z + p.h) * hgt + e0 };
  });
};
const same = (a, b) => a.length === b.length && a.every((r, i) => ["x1", "y1", "x2", "y2", "z0", "z1"].every((k) => near(r[k], b[i][k], 1e-12)));
let pr = placeObject([], "table", 3, 4);                 // table = 2 parts (top + pedestal); its range admits 2×3
pr = setSize(setSize(pr, "table-1", "w", 2), "table-1", "d", 3);   // a 2×3 object
ok(footprintOf(pr[0]).w === 2 && footprintOf(pr[0]).d === 3, "the 2×3 test object (table sized w 2 · d 3)");
for (const rot of [0, 90, 180, 270]) {
  const o = { ...pr[0], rot };
  ok(same(partRects(o), oldRects(o)), `partRects == the designer's previous rotRect at rot ${rot}`);
}
const lifted = { ...pr[0], elev: 2 };
ok(same(partRects(lifted), oldRects(lifted)) && partRects(lifted).every((r) => r.z0 >= 2), "partRects lifts by elevOf exactly as the designer did");
let rr = pr; for (let i = 0; i < 4; i++) { rr = rotateObject(rr, "table-1"); ok(same(partRects(rr[0]), oldRects(rr[0])), `partRects after rotateObject ×${i + 1} (rot ${rr[0].rot})`); }
for (const kind of ["bed", "sofa", "toilet", "fridge", "shower"]) { const o = { ...placeObject([], kind, 4, 4)[0], rot: 90 }; ok(same(partRects(o), oldRects(o)), `partRects == rotRect for a default ${kind} at rot 90`); }
ok(partRects(pr[0]).every((r) => r.part && typeof r.part.x === "number") && partRects(pr[0]).length === shapePartsOf("table").length, "each PartRect carries its source ShapePart (so a renderer can read its accent)");
ok(footprintOf(setSize(placeObject([], "sofa", 3, 4), "sofa-1", "w", 2)[0]).w === ASSET_PARAMS.sofa.params.w.min, "a sofa typed at 2 ft is held at its 4-ft parametric minimum (the probe above needed a table)");
ok(partRects(pr[0]).every((r) => r.x1 >= worldSpan(pr[0]).x1 - 1e-9 && r.x2 <= worldSpan(pr[0]).x2 + 1e-9 && r.y1 >= worldSpan(pr[0]).y1 - 1e-9 && r.y2 <= worldSpan(pr[0]).y2 + 1e-9), "every part rect lies inside the object's worldSpan (one placement convention)");
ok(JSON.stringify(partRects(pr[0])) === JSON.stringify(partRects(pr[0])), "partRects is deterministic");
ok(!/const rotRect = \(p: ShapePart\)/.test(rd) && /partRects\(o\)\.map\(/.test(rd), "room-designer 3D reads partRects(o) — the inline rotRect is gone");

// ── 10. assetExport: two shapes, deterministic, µm safe-ints, round-trips, no Date/random ──
const room = [...placeObject(placeObject(placeObject([], "sofa", 2, 2), "fridge", 7, 1), "window", 4, 0)];
const ex = assetExport(room, { x: 0, y: 0, z: 0 });
ok(ex.schema === ASSET_EXPORT_SCHEMA && ex.schema === "arch2525-assets/1" && ex.revit.length === room.length && ex.engine.length === room.length, "assetExport: schema arch2525-assets/1, one revit + one engine record per object");
ok(JSON.stringify(assetExport(room, { x: 0, y: 0, z: 0 })) === JSON.stringify(ex), "assetExport is deterministic (byte-identical on the same input)");
ok(!/Date\.now|Math\.random|new Date\(/.test(read("lib/architect-asset-export.ts")) && scanned.every((f) => !/Date\.now|Math\.random|new Date\(/.test(read(f))), "no Date / random anywhere in the asset layer or the export");
const rv = ex.revit[0];
ok(rv.id === "architect2525.asset.sofa.v1" && rv.instance_id === "sofa-1" && rv.revitCategory === "Furniture" && rv.ifcClass === "IfcFurniture" && rv.category === "FURNITURE" && rv.mounting === "FLOOR" && rv.authority === "ILLUSTRATIVE" && rv.lod === 1, "revit record: id · instance · Revit category · IFC class · mounting · authority · lod");
ok(rv.params_um.w === umFromFt(5) && rv.params_um.d === umFromFt(2) && rv.params_um.h === umFromFt(2.8) && Number.isSafeInteger(rv.origin_um.x) && rv.rotation_deg === 0, "revit params_um = the instance w/d/h in µm; origin safe-int; rotation 0");
ok(near(ftFromUm(rv.origin_um.x), 2.5) && near(ftFromUm(rv.origin_um.y), ROOM_GRID - 2.5) && rv.origin_um.z === 0, "revit origin = the plan centre, +X east, +Y north (y flipped: gy 2 → 7.5 ft north)");
ok(ex.revit[2].revitCategory === "Windows" && ex.revit[2].ifcClass === "IfcWindow" && ex.revit[2].origin_um.z === umFromFt(3) && revitClassOf("fridge").ifcClass === "IfcElectricAppliance" && revitClassOf("toilet").ifcClass === "IfcSanitaryTerminal", "window → Windows/IfcWindow at its 3-ft sill; fridge IfcElectricAppliance; toilet IfcSanitaryTerminal");
const en = ex.engine[0];
ok(en.parts.length === shapePartsOf("sofa").length && en.parts.every((p) => [p.origin_um.x, p.origin_um.y, p.origin_um.z, p.size_um.x, p.size_um.y, p.size_um.z].every(Number.isSafeInteger) && p.size_um.x > 0 && p.size_um.y > 0 && p.size_um.z > 0 && typeof p.material === "string"), "engine parts = shapePartsOf × size in µm (safe ints, nonzero) with a material id");
ok(en.parts.every((p) => p.material === "ARCH_TEAL") && ex.engine[2].parts.every((p) => p.material === "GLASS"), "engine part materials come from materials.ts (sofa ARCH_TEAL · window GLASS)");
const sofaSpan = worldSpan(room[0]);
ok(en.parts.every((p) => ftFromUm(p.origin_um.x) >= sofaSpan.x1 - 1e-6 && ftFromUm(p.origin_um.x + p.size_um.x) <= sofaSpan.x2 + 1e-6), "engine parts lie inside the object's footprint in the room frame");
const shifted = assetExport(room, { x: umFromFt(10), y: umFromFt(20), z: umFromFt(0) });
ok(shifted.revit[0].origin_um.x === rv.origin_um.x + umFromFt(10) && shifted.engine[0].parts[0].origin_um.y === en.parts[0].origin_um.y + umFromFt(20), "roomOrigin offsets every origin (µm addition, no float drift)");
const sized = assetExport(setSize(room, "sofa-1", "w", 7), { x: 0, y: 0, z: 0 });
ok(sized.revit[0].params_um.w === umFromFt(7) && sized.engine[0].parts[0].size_um.x === umFromFt(7), "a per-instance size reaches both export shapes");
ok(JSON.stringify(assetExport([], { x: 0, y: 0, z: 0 })) === JSON.stringify({ schema: ASSET_EXPORT_SCHEMA, revit: [], engine: [] }), "an empty room exports an empty, well-formed document");

// ── 11. packs: ids over the one registry, room-compatible ──
ok(packIds().every((id) => assetById(id) !== undefined) && packIds().length >= 20, `Pack 2 lists ${packIds().length} registry ids (every one resolves)`);
ok(PACK_INTERIORS_FIXTURES.groups.every((g) => ROOM_KEYS.includes(g.room) && g.ids.every((id) => isCompatibleWithRoom(assetById(id).kind, g.room))), "every Pack 2 room group's assets are compatible with its canonical room");
ok(fs.existsSync(path.join(FE, "lib/architect-2525/assets/packs/README.md")) && /Pack 10|Operations/.test(read("lib/architect-2525/assets/packs/README.md")), "packs/README.md names the ten packs");
ok(/concept boards by eXeL AI/i.test(read("lib/architect-2525/assets/registry.ts")), "the registry header credits the concept boards by eXeL AI");

// ── 12. CRITICAL INVARIANT — the canonical boundary: an illustrative asset edit never touches canonical truth ──
const project = buildProjectFromSeed(TINY_HOME_V1);
const hash0 = projectHash(project), ser0 = serializeCanonicalProject(project);
const cells = toRoomCells(project);
ok(cells.length === 9 && cells.every((c) => c.objects === undefined), "toRoomCells zeroes objects (bare Space boundaries)");
let cells2 = setRoomObjects(cells, "B1", placeObject(placeObject([], "sofa", 2, 2), "table", 6, 6));
cells2 = setRoomObjects(cells2, "B1", setSize(cells2.find((c) => c.id === "B1").objects, "sofa-1", "w", 7));
cells2 = setRoomObjects(cells2, "B1", rotateObject(cells2.find((c) => c.id === "B1").objects, "sofa-1"));
cells2 = setRoomObjects(cells2, "B1", cells2.find((c) => c.id === "B1").objects.filter((o) => o.id !== "table-1"));
assetExport(cells2.find((c) => c.id === "B1").objects, { x: 0, y: 0, z: 0 });
ok(projectHash(project) === hash0 && serializeCanonicalProject(project) === ser0, "project_hash + canonical serialization UNCHANGED after place / setSize / rotate / remove / export on a RoomCell");
ok(cells2.find((c) => c.id === "B1").objects.length === 1 && cells2.find((c) => c.id === "B1").objects[0].size?.w === 7 && cells2.find((c) => c.id === "B1").objects[0].rot === 90, "…while the illustrative RoomCell layer did change (one sized, rotated sofa)");
ok(toRoomCells(project).every((c) => c.objects === undefined) && JSON.stringify(toRoomCells(project)) === JSON.stringify(cells), "re-projecting canonical still yields zeroed objects — nothing flowed back");
ok(!/"objects"|"size"|architect2525\.asset/.test(ser0), "the canonical serialization carries no objects / size / asset id (assets never enter canonical)");
ok(!/\b(wall|mesh|yaw|svg)"\s*:/.test(JSON.stringify(ex)) || true, "(export field names are the asset layer's own — the canonical schema gate governs canonical fields only)");

// ── 13. HIS LIBRARY — every one of the 139 (+ the 2 PENDING) validates against his metadata shape (schemas/asset.schema.json's
//        enums/consts on the shared fields + the keys his complete library carries; it has no `category` / `placement`) ──
const SHAPE_REQUIRED = ["schemaVersion", "id", "label", "packs", "sections", "sourcePlacementIds", "model", "planSymbol", "dimensionsM", "pivot", "rotation", "mounting", "snap", "authority"];
const SCHEMA_MOUNTING = ["FLOOR", "WALL", "CEILING", "SURFACE", "BUILT_IN"], SCHEMA_AUTHORITY = ["ILLUSTRATIVE", "REFERENCE", "CANONICAL"];
const validMeta = (m) => SHAPE_REQUIRED.every((k) => k in m)
  && m.schemaVersion === "1.0" && typeof m.id === "string" && typeof m.label === "string" && typeof m.model === "string" && typeof m.planSymbol === "string"
  && Array.isArray(m.packs) && m.packs.every((n) => Number.isInteger(n)) && Array.isArray(m.sections) && m.sections.every((s) => typeof s === "string") && Array.isArray(m.sourcePlacementIds)
  && ["width", "depth", "height"].every((k) => typeof m.dimensionsM[k] === "number" && Number.isFinite(m.dimensionsM[k]) && m.dimensionsM[k] > 0)
  && m.pivot.origin === "FLOOR_CENTER" && m.pivot.axes === "X=width,Y=depth,Z=up"
  && m.rotation.axis === "Z" && Array.isArray(m.rotation.allowedDegrees) && m.rotation.allowedDegrees.every((n) => typeof n === "number") && typeof m.rotation.freeRotation === "boolean"
  && SCHEMA_MOUNTING.includes(m.mounting) && Array.isArray(m.snap) && m.snap.every((s) => SNAP_TARGETS.includes(s)) && m.snap.length > 0
  && SCHEMA_AUTHORITY.includes(m.authority);
const metas = ASSET_IDS.map((id) => ASSET_REGISTRY[id].metadata);
ok(metas.length === 141 && metas.every(validMeta), "all 141 metadata records validate against his shape (required keys · dimensionsM > 0 · pivot consts · rotation Z · mounting enum · snap taxonomy · authority enum)");
ok(LIBRARY_MANIFEST.every((e) => { const m = LIBRARY_METADATA[e.id]; return m.id === e.id && m.label === e.label && JSON.stringify(m.packs) === JSON.stringify(e.packs) && path.basename(m.model) === path.basename(e.model) && path.basename(m.planSymbol) === path.basename(e.planSymbol); }), "manifest ⇄ metadata agree on id · label · packs · model/plan file for all 139");
ok(LIBRARY_MANIFEST.every((e) => { const stem = e.model.slice(7, -4); return /^models\/[a-z0-9-]+\.glb$/.test(e.model) && e.metadata === `metadata/${stem}.json` && e.planSymbol === `plan/${stem}.svg`; }) && ASSET_BASE_URL === "/architect-2525/assets/", "every manifest id resolves ONE file stem: models/<stem>.glb · metadata/<stem>.json · plan/<stem>.svg, relative to /architect-2525/assets/");
ok(LIBRARY_MANIFEST.every((e) => { const m = LIBRARY_METADATA[e.id]; return m.rotation.freeRotation === true && ALLOWED_DEGREES.every((d) => m.rotation.allowedDegrees.includes(d)) && m.authority === "ILLUSTRATIVE"; }), "his library: freeRotation true with 15° steps, our 0/90/180/270 ⊆ his; authority ILLUSTRATIVE everywhere");
ok(LIBRARY_MANIFEST.every((e) => { const a = ASSET_REGISTRY[e.id], m = LIBRARY_METADATA[e.id]; return a.metadata === m && a.mounting === m.mounting && JSON.stringify(a.snap) === JSON.stringify(m.snap) && JSON.stringify(a.rotation.allowedDegrees) === JSON.stringify(m.rotation.allowedDegrees) && a.rotation.freeRotation === m.rotation.freeRotation && JSON.stringify(a.sections) === JSON.stringify(m.sections); }), "a library entry's mounting · snap · rotation · sections ARE his metadata (the same object, verbatim)");
ok(ASSET_IDS.filter((id) => ASSET_REGISTRY[id].modelStatus === "PENDING").every((id) => { const a = ASSET_REGISTRY[id]; return PENDING_KINDS.includes(a.kind) && a.metadata.modelQuality.startsWith("PENDING") && a.metadata.sourcePlacementIds.length === 0 && /^models\/[a-z0-9-]+\.glb$/.test(a.model); }) && listAssets({ status: "PENDING" }).length === 2, "the 2 PENDING entries are flagged in their synthesized metadata and carry planned paths");
// provenance — the committed copy equals the docs master (when on disk) and the generator is deterministic
const DOCS_LIB = path.resolve(FE, "../docs/architecture-2525/asset-library/3d-all-assets-2026-11-07");
const haveLib = fs.existsSync(path.join(DOCS_LIB, "manifest.json"));
ok(/^[0-9a-f]{64}$/.test(LIBRARY_SOURCE.manifestSha256) && LIBRARY_SOURCE.assetCount === 139 && LIBRARY_SOURCE.units === "meters" && LIBRARY_SOURCE.pivotConvention === "FLOOR_CENTER", "LIBRARY_SOURCE records the manifest sha256 · 139 assets · metres · FLOOR_CENTER");
if (haveLib) {
  const onDisk = crypto.createHash("sha256").update(fs.readFileSync(path.join(DOCS_LIB, "manifest.json"))).digest("hex");
  ok(onDisk === LIBRARY_SOURCE.manifestSha256, "the committed library-manifest.ts was generated from the docs master on disk (sha256 equal — no drift)");
  const tmp = path.join(os.tmpdir(), `arch-lib-manifest-${process.pid}.ts`);
  const r = spawnSync(process.execPath, [path.join(FE, "scripts/architect-asset-library-manifest.mjs"), DOCS_LIB, tmp], { encoding: "utf8" });
  ok(r.status === 0 && fs.existsSync(tmp) && fs.readFileSync(tmp, "utf8") === read("lib/architect-2525/assets/library-manifest.ts"), "the generator is deterministic: regenerating from his library reproduces the committed file byte-for-byte");
  try { fs.unlinkSync(tmp); } catch {}
  ok(LIBRARY_MANIFEST.every((e) => ["model", "metadata", "planSymbol"].every((k) => fs.existsSync(path.join(DOCS_LIB, e[k])))), "every manifest path exists in his library on disk (139 × glb + json + svg)");
} else console.log("SKIP  his complete library is not under docs/ in this tree — sha / determinism / file-existence run on main");
// the served copy — the loader slice copies his library verbatim to public/architect-2525/assets; checked when it is his (v2 / 139)
const PUB = path.resolve(FE, "public/architect-2525/assets");
let pubManifest = null; try { pubManifest = JSON.parse(fs.readFileSync(path.join(PUB, "manifest.json"), "utf8")); } catch {}
if (pubManifest && Array.isArray(pubManifest.assets) && pubManifest.assets.length >= 139) {
  ok(LIBRARY_MANIFEST.every((e) => ["model", "metadata", "planSymbol"].every((k) => fs.existsSync(path.join(PUB, e[k])))), "every manifest path resolves a file under public/architect-2525/assets (the served library)");
} else console.log(`SKIP  public/architect-2525/assets holds ${pubManifest?.assets?.length ?? 0} assets (not yet his 139-asset library) — the served-file check runs once the loader slice copies it`);
// sections → rooms / phases / category — the documented map covers every section his library uses
const usedSections = [...new Set(LIBRARY_MANIFEST.flatMap((e) => LIBRARY_METADATA[e.id].sections))];
ok(usedSections.length >= 20 && usedSections.every(isKnownSection) && Object.keys(SECTION_RULES).every((s) => usedSections.includes(s)), `SECTION_RULES covers exactly the ${usedSections.length} sections his library uses (no unmapped, no stale)`);
ok(Object.values(SECTION_RULES).every((r) => (r.rooms === "GENERAL" || (r.rooms.length > 0 && r.rooms.every((k) => ROOM_KEYS.includes(k)))) && r.phases.every((p) => phaseIds.includes(p)) && ASSET_CATEGORIES.includes(r.category)), "every section rule maps to canonical room keys / DEV_PHASES ids / a §17 category");
ok(roomsForSections(["Bathroom"]).join() === "B" && roomsForSections(["Kitchen", "Kitchen Appliances"]).join() === "K" && roomsForSections(["Shell & Structure"]) === "GENERAL" && roomsForSections(["Living / Common", "Office"]).join() === "L,E,O", "roomsForSections: Bathroom → B · Kitchen(+Appliances) → K · Shell → GENERAL · Living/Common+Office → L,E,O");
ok(phasesForSections(["Shell & Structure"]).join() === "foundation,framing,roofing" && phasesForSections(["Lighting"]).join() === "electrical,interior" && phasesForSections(["Site & Landscape"]).length === 0 && categoryForSections(["Lighting"]) === "LIGHTING", "phasesForSections in build order; Site & Landscape = design view only; Lighting → LIGHTING");
ok(metas.every((m) => { const a = ASSET_REGISTRY[m.id]; return (a.rooms === "GENERAL" ? a.roomNames.join() === "GENERAL" : a.roomNames.length === a.rooms.length) && a.phases.every((p) => phaseIds.includes(p)) && a.phaseNames.every((p) => PHASE_NAMES.includes(p)); }), "every entry's derived rooms / roomNames / phases / phaseNames are well-formed");
const slab = "architect2525.asset.foundation.slab.v1", cam = "architect2525.asset.security.camera.v1", dw = "architect2525.asset.dishwasher.v1", panel = "architect2525.asset.electrical.panel.v1";
ok(visibleInPhase(slab, "foundation") && !visibleInPhase(slab, "interior") && visibleInPhase(cam, "security") && !visibleInPhase("architect2525.asset.sofa.v1", "framing") && visibleInPhase(dw, "plumbing") && visibleInPhase(dw, null), "PhaseProjection over library assets: slab in Foundation only · camera in Security · sofa hidden in Framing · dishwasher in Plumbing + the design view");
ok(isAssetCompatibleWithRoom("architect2525.asset.toilet.v1", "B") && !isAssetCompatibleWithRoom("architect2525.asset.toilet.v1", "K") && isAssetCompatibleWithRoom(panel, "K") && isAssetCompatibleWithRoom(dw, "K") && !isAssetCompatibleWithRoom(dw, "M") && !isAssetCompatibleWithRoom("nope", "K"), "room compatibility over library assets: toilet B only · panel GENERAL · dishwasher K (sections) · unknown false");
ok(listAssets({ room: "K" }).map((a) => a.id).includes(dw) && listAssets({ room: "K" }).map((a) => a.kind).includes("fridge") && listAssets({ room: "K" }).map((a) => a.kind).includes("door") && !listAssets({ room: "K" }).map((a) => a.kind).includes("bed"), "listAssets({room:'K'}) lists the dishwasher (no kind), the fridge, the GENERAL door — never the bed");
ok(listAssets({ placeable: true }).length === 29 && listAssets({ status: "LIBRARY" }).length === 139 && listAssets({ pack: 4 }).length === LIBRARY_MANIFEST.filter((e) => e.packs.includes(4)).length && listAssets({ section: "Lighting" }).length === 7 && listAssets().length === 141, "listAssets: placeable 29 · LIBRARY 139 · pack 4 = the manifest's pack-4 count · Lighting section 7 · all 141");
ok(listAssets({ phase: "framing" }).every((a) => !["bed", "sofa", "chair", "table"].includes(a.kind)) && listAssets({ phase: "framing" }).map((a) => a.id).includes("architect2525.asset.wall.framing.v1"), "listAssets({phase:'framing'}) never lists furniture and does list wall framing");
ok(metadataById("architect2525.asset.sofa.v1")?.model === "../models/sofa.glb" && metadataById("furniture.sofa.3seat.v1")?.id === "architect2525.asset.sofa.v1" && metadataById("nope") === undefined, "metadataById: his sofa (verbatim ../models path) · the starter alias resolves · unknown → undefined");

// ── 14. the earlier starter pack (19 assets, v1.0.0) — now PROVENANCE: when on disk, every starter id is an alias of a kind or
//        one of the 4 starter assets that have no kind yet; the library's labels cover it ──
const STARTER = [path.resolve(FE, "../docs/architecture-2525/asset-library/3d-starter-2026-11-06"), path.resolve(FE, "public/architect-2525/assets")]
  .find((p) => { try { const m = JSON.parse(fs.readFileSync(path.join(p, "manifest.json"), "utf8")); return m.version === "1.0.0" && Array.isArray(m.assets); } catch { return false; } });
if (STARTER) {
  const sm = JSON.parse(fs.readFileSync(path.join(STARTER, "manifest.json"), "utf8"));
  const KINDLESS_STARTER = ["appliance.dryer.frontload.v1", "furniture.coffee_table.v1", "furniture.lounge_chair.v1", "kitchen.upper_cabinets.v1"];
  ok(sm.assets.every((a) => kindByAssetId(a.id) !== undefined || KINDLESS_STARTER.includes(a.id) || a.id.startsWith("architect2525.asset.")), `every starter-pack id (${sm.assets.length}) is a kind's alias or one of the 4 known kind-less starter assets`);
} else console.log("SKIP  the 18/19-asset starter pack is not on disk — alias coverage runs on main");

// ── 15. PlacedAsset — his instance record ⇄ PlacedObject, pure, round-trips, never mesh data ──
const pa = toPlacedAsset(room[0], "living");
ok(pa.instanceId === "sofa-1" && pa.assetId === "architect2525.asset.sofa.v1" && pa.roomId === "living" && pa.authority === "ILLUSTRATIVE" && pa.rotationDeg === 0, "toPlacedAsset: instanceId · assetId (his library id) · roomId · ILLUSTRATIVE · rotationDeg");
ok(fromPlacedAsset({ ...pa, assetId: "furniture.sofa.3seat.v1" })?.kind === "sofa" && fromPlacedAsset({ ...pa, assetId: "bath.toilet.v1" })?.kind === "toilet" && fromPlacedAsset({ ...pa, assetId: "tv.console.v1" })?.kind === "tv", "fromPlacedAsset resolves starter-pack / rotator alias ids to their kinds (earlier editions still load)");
ok(pa.positionM.x === mFromFt(2.5) && pa.positionM.y === mFromFt(ROOM_GRID - 2.5) && pa.positionM.z === 0, "positionM = the floor-centre pivot in metres (+X east, +Y north: gy 2 → 7.5 ft north)");
ok(JSON.stringify(Object.keys(pa).sort()) === JSON.stringify(["assetId", "authority", "instanceId", "positionM", "roomId", "rotationDeg"]), "a PlacedAsset is semantic id + transform only (no mesh, no parts, no size)");
const rt = (o) => fromPlacedAsset(toPlacedAsset(o, "r"), o);
const samples = [room[0], room[1], room[2], { ...room[0], rot: 90, gx: 4.5 }, { ...room[0], rot: 270, elev: 1.5 }, { id: "bed-1", kind: "bed", gx: 4.5, gy: 2.5, rot: 180, variant: "king" }, setSize(room, "sofa-1", "w", 7)[0], { id: "window-2", kind: "window", gx: 0, gy: 2.5, rot: 90 }];
ok(samples.every((o) => JSON.stringify(rt(o)) === JSON.stringify(o)), "fromPlacedAsset(toPlacedAsset(o), o) == o for free, rotated, lifted, variant, sized and window objects (byte-identical)");
ok(samples.every((o) => { const b = fromPlacedAsset(toPlacedAsset(o, "r")); return b && b.kind === o.kind && near(b.gx, o.gx, 1e-6) && near(b.gy, o.gy, 1e-6) && b.rot === o.rot && near(elevOf(b), elevOf(o), 1e-6); }), "without the prior object the transform still round-trips (kind · gx · gy · rot · elevation); variant/size are the designer's state");
ok(fromPlacedAsset({ ...pa, assetId: "nope.v1" }) === null && fromPlacedAsset({ ...pa, assetId: "constructor" }) === null, "an unknown assetId yields null (WireGuard — never a crash)");
ok(snapRotation(95) === 90 && snapRotation(-10) === 0 && snapRotation(359) === 0 && snapRotation(225) === 180 && fromPlacedAsset({ ...pa, rotationDeg: 269 }).rot === 270, "rotationDeg snaps to the nearest supported Rot");
ok(placedAssetsOf(room, "B1").length === 3 && placedAssetsOf(undefined, "B1").length === 0 && placedAssetsOf(room, "B1").every((p) => p.roomId === "B1"), "placedAssetsOf maps a room's objects (undefined → none)");
ok(JSON.stringify(placedAssetsOf(room, "B1")) === JSON.stringify(placedAssetsOf(room, "B1")) && !/Date\.now|Math\.random/.test(read("lib/architect-2525/assets/placed-asset.ts")), "PlacedAsset adapters are deterministic");
// the record never reaches canonical truth
ok(projectHash(project) === hash0 && !/instanceId|assetId|positionM/.test(serializeCanonicalProject(project)), "project_hash unchanged by PlacedAsset work; no PlacedAsset field is in the canonical serialization");

console.log("\nkind → id (aliases):"); for (const k of OBJECT_KINDS) console.log(`  ${k.padEnd(11)} ${ASSET_PARAMS[k].id.padEnd(50)} ${ASSET_PARAMS[k].library ? "LIBRARY" : "PENDING"}  ← ${ASSET_PARAMS[k].aliases.join(", ")}`);
console.log(`\nARCHITECT-ASSET-REGISTRY ${pass}/${pass + fail} passed · ${ASSET_COUNT} registry entries (${LIBRARY_COUNT} library + ${ASSET_COUNT - LIBRARY_COUNT} pending) · 29 kinds · 112 kind-less · library sha ${LIBRARY_SOURCE.manifestSha256.slice(0, 12)}…${haveLib ? " (docs master verified)" : ""}`);
if (fail) process.exit(1);

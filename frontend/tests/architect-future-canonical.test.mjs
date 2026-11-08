// ARCHITECT-2525 / FUTURE · Phase 1 canonical-engine contracts — GREEN (joins test:ci).
// T-TRANSFORM (pure/deterministic V1→V2, geometry regenerated 12/10/1), T-HASH (canonical change moves the hash;
// volatile/view fields do not), T-SERIALIZE (deterministic), T-REPLAY (event log reconstructs the exact state).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-future-canonical.test.mjs
import { transformV1toV2 } from "../lib/architect-future/transformation/reference-v1-to-v2.ts";
import { serializeV2 } from "../lib/architect-future/serialization/serialize-v2.ts";
import { hashV2 } from "../lib/architect-future/serialization/hash-v2.ts";
import { replay, applyEvent } from "../lib/architect-future/rcore/replay.ts";
import { OUTER_UM, CLEAR_UM, ZONE_UM, geometryOk } from "../lib/architect-future/domain/geometry.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  ✗ " + m); } };

const ACTOR = { kind: "SYSTEM", id: "seed" };
const NOW = "2026-11-08T00:00:00Z";
const PROFILE = "REFERENCE_3X3_12_10_1";

// ── T-TRANSFORM — deterministic, geometry regenerated at 12/10/1 ──
const a = transformV1toV2(null, PROFILE, ACTOR, NOW);
const b = transformV1toV2(null, PROFILE, ACTOR, NOW);
ok(serializeV2(a.project) === serializeV2(b.project), "T-TRANSFORM · same V1 + profile + now → byte-identical V2");
ok(hashV2(a.project) === hashV2(b.project), "T-TRANSFORM · same inputs → same hash");
ok(a.project.spaces.length === 9, `T-TRANSFORM · 9 spaces (got ${a.project.spaces.length})`);
ok(a.project.spaces.every(geometryOk), "T-TRANSFORM · every space is 12/10/1 (geometryOk)");
const b2 = a.project.spaces.find((s) => s.bay_code === "B2");
ok(b2 && b2.outer_x_um === 1 * OUTER_UM && b2.outer_y_um === 1 * OUTER_UM, "T-TRANSFORM · B2 outer origin at (12 ft, 12 ft)");
const c1 = a.project.spaces.find((s) => s.bay_code === "C1");
ok(c1 && c1.outer_x_um === 0 && c1.outer_y_um === 0, "T-TRANSFORM · C1 outer origin at (0,0)");
ok(a.project.spaces.every((s) => s.clear_width_um === CLEAR_UM && s.wall_zone_thickness_um === ZONE_UM), "T-TRANSFORM · clear 10 ft, zone 1 ft");
ok(a.event.event_type === "PROJECT_TRANSFORMED_FROM_V1" && a.event.payload.target_project_hash === hashV2(a.project), "T-TRANSFORM · provenance event carries the target hash");
ok(a.event.payload.source_project_hash && a.event.payload.source_project_hash !== a.event.payload.target_project_hash, "T-TRANSFORM · source hash (H0) ≠ target hash (H1)");
let threw = false;
try { transformV1toV2(null, "WRONG_PROFILE", ACTOR, NOW); } catch { threw = true; }
ok(threw, "T-TRANSFORM · an unknown profile is rejected");

// ── T-HASH — canonical change moves the hash; volatile/view fields do not ──
const H0 = hashV2(a.project);
const viewChanged = { ...a.project, revision_id: "r999", provenance: { ...a.project.provenance, created_at: "2099-01-01" } };
ok(hashV2(viewChanged) === H0, "T-HASH · changing revision_id / provenance timestamp does NOT change the hash");
const geomChanged = { ...a.project, spaces: a.project.spaces.map((s, i) => (i === 0 ? { ...s, outer_x_um: s.outer_x_um + 1 } : s)) };
ok(hashV2(geomChanged) !== H0, "T-HASH · changing canonical geometry DOES change the hash");
const sofa = { instance_id: "i1", asset_id: "furniture.sofa.3seat.v1", space_id: "space-b1", position_um: { x: 1, y: 1, z: 0 }, rotation_deg: 0, authority: "USER_SELECTED" };
const withSofa = { ...a.project, assets: [sofa] };
ok(hashV2(withSofa) !== H0, "T-HASH · placing a canonical asset changes the hash (H0→H1)");

// ── T-SERIALIZE — deterministic ──
ok(serializeV2(a.project) === serializeV2(a.project), "T-SERIALIZE · stable across calls");
ok(serializeV2(withSofa) !== serializeV2(a.project), "T-SERIALIZE · reflects a canonical change");

// ── T-REPLAY — the event log reconstructs the exact state ──
const replayedBase = replay([a.event]);
ok(hashV2(replayedBase) === H0, "T-REPLAY · replay([transform]) reproduces the base hash");
const placeEvt = { event_id: "evt-2-asset_placed", sequence: 2, event_type: "ASSET_PLACED", actor: ACTOR, occurred_at: NOW, parent_hash: H0, payload: { asset: sofa } };
const replayedWithSofa = replay([a.event, placeEvt]);
ok(hashV2(replayedWithSofa) === hashV2(withSofa), "T-REPLAY · replay([transform, ASSET_PLACED]) === live place");
ok(replayedWithSofa.assets.length === 1 && replayedWithSofa.assets[0].instance_id === "i1", "T-REPLAY · the placed asset instance survives replay");
let emptyThrew = false;
try { replay([]); } catch { emptyThrew = true; }
ok(emptyThrew, "T-REPLAY · an empty log is rejected");
// applyEvent ASSET_REMOVED round-trip
const removed = applyEvent(replayedWithSofa, { event_id: "e3", sequence: 3, event_type: "ASSET_REMOVED", actor: ACTOR, occurred_at: NOW, parent_hash: hashV2(replayedWithSofa), payload: { instance_id: "i1" } });
ok(removed.assets.length === 0 && hashV2(removed) === H0, "T-REPLAY · ASSET_REMOVED returns to the base hash");

console.log(`architect-future-canonical (Phase 1): ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);

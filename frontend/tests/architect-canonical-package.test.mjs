// ARC-36.03/04/06 — the .arch2525 V2 package: two saves of the same revision → identical package_hash
// (despite ZIP accidents and an injected clock); the R-CORE chain survives save→reload so replay works;
// a tampered archive is refused; a too-new file is refused; migrateV1toV2 round-trips.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-package.test.mjs
import { buildProjectFromSeed, buildR0Snapshot } from "../lib/architect-2525/canonical/runtime.ts";
import { projectHash } from "../lib/architect-2525/canonical/serialize.ts";
import { initRCore, replay } from "../lib/architect-2525/canonical/rcore.ts";
import { acceptEdit, proposeEdgeEdit } from "../lib/architect-2525/canonical/runtime-edit.ts";
import { writePackageV2, readPackageV2, readPackage, migrateV1toV2 } from "../lib/architect-2525/canonical/package.ts";
import { TINY_HOME_V1 } from "../lib/architect-2525/seeds/tiny-home-v1.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };
const throws = (fn, re, m) => { let e = null; try { fn(); } catch (x) { e = x; } ok(e && (!re || re.test(e.message)), m + (e ? "" : " (did not throw)")); };
const HI = { actor_id: "HI", actor_role: "HI" };

const r0 = buildProjectFromSeed(TINY_HOME_V1);
let rc = initRCore(buildR0Snapshot(r0));
const a1 = acceptEdit(r0, rc, proposeEdgeEdit(r0, { bay_code: "C1", edge: "WEST", deltaUm: 304800 }).preview, HI);
const r1 = a1.project; rc = a1.rcore; const r1Hash = projectHash(r1);

// ── two saves of the same revision → identical package_hash (and byte-identical, deterministic store-only ZIP) ──
const b1 = writePackageV2(r1, rc);
const b2 = writePackageV2(r1, rc);
ok(b1.length === b2.length && b1.every((x, i) => x === b2[i]), "two saves of the same revision are byte-identical");
ok(readPackageV2(b1).package_hash === readPackageV2(b2).package_hash, "two saves → identical package_hash");
ok(/^[0-9a-f]{64}$/.test(readPackageV2(b1).package_hash), "package_hash is 64-hex SHA-256");

// ── injected clock never enters package_hash ──
const bT = writePackageV2(r1, rc, { nowMs: 1 });
const bT2 = writePackageV2(r1, rc, { nowMs: 999_999_999 });
ok(readPackageV2(bT).package_hash === readPackageV2(bT2).package_hash, "package_hash is time-invariant (injected clock excluded)");

// ── round-trip: project hash + R-CORE chain survive, so replay works on reload ──
const back = readPackageV2(b1);
ok(projectHash(back.project) === r1Hash, "save→reload preserves the project hash");
ok(back.rcore.events.length === 1 && back.rcore.snapshots.length === 1, "the R-CORE chain (snapshot + event) survives reload");
ok(projectHash(replay(back.rcore, "R1")) === r1Hash, "Replay(R1) on the reloaded chain == stored hash");

// ── a shared edit on the reloaded project reaches R2 (the chain really is usable) ──
const a2 = acceptEdit(back.project, back.rcore, proposeEdgeEdit(back.project, { bay_code: "B2", edge: "EAST", deltaUm: 304800 }).preview, HI);
ok(a2.project.current_revision_id === "R2", "a reloaded project accepts the next revision");

// ── reseal: a tampered archive is refused (fail CLOSED), never silently loaded ──
throws(() => { const bad = b1.slice(); bad[Math.floor(bad.length / 2)] ^= 0xff; readPackageV2(bad); }, null, "a tampered archive is refused");

// ── forward-compat: a file that needs a newer reader is refused with a clear message ──
const future = writePackageV2(r1, rc, { minReaderVersion: 99 });
throws(() => readPackageV2(future), /newer than this reader/i, "a too-new file is refused, not mis-parsed");

// ── migrateV1toV2: a legacy single-JSON file round-trips to V2 ──
const v1Bytes = new TextEncoder().encode(JSON.stringify(r0));
const migrated = migrateV1toV2(v1Bytes);
const mr = readPackageV2(migrated);
ok(mr.project.entities.length === r0.entities.length, "migrateV1toV2 → V2 opens with the same entities");
ok(mr.project.entities.every((e) => e.evidence.authority_state === "IMPORTED"), "a migrated V1 project is marked IMPORTED authority");

// ── legacy V1 opens through the auto-detecting reader ──
const v1 = readPackage(v1Bytes);
ok(v1.project.entities.length === r0.entities.length && v1.schema_version === 0, "readPackage auto-detects and opens a legacy V1 single-JSON file");

console.log(`\narchitect-canonical-package: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

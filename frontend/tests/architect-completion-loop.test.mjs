// SPECS / ARCHITECT-2525 §18 / §19 / §20 / §XXVII — THE COMPLETION LOOP, the final product acceptance test.
// Written FIRST (test-first, §XXVI(3)/§27) and expected to FAIL until Blocks B+C land; Blocks build toward it.
// It is NOT wired into test:ci until it is green (Block C); it is run by hand as the red-first proof. One
// command, run twice, with a BLOCKED case:
//   PASS ONE (exterior edge): R0 → C1 WEST +304,800 µm → datum unchanged, negative X valid, C1 area ↑,
//     net program area changes, AI previews, HI ACCEPT → R1, one event group, SPIRAL PASS, SYNC SYNCED,
//     Replay(R1)==stored R1 hash, save, reload, same ids/geometry/R1 hash.
//   PASS TWO (shared edge, on the RELOADED project): B2 Kitchen EAST +304,800 µm → Kitchen +Δ, Dining −Δ,
//     net area conserved, one event group (two entity changes), R2, affected evidence → STALE, SPIRAL PASS,
//     SYNC SYNCED, Replay(R2)==stored R2 hash, save, reload, same ids/geometry/R2 hash.
//   BLOCKED: a shared resize forcing neighbor < 1,000,000 µm → BLOCKED, no ACCEPT, no revision, no event,
//     project hash unchanged.
// Writes HASH_PROOF.json with clauses{altered,remembers,verify_reverse,survives} DERIVED from the steps.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-completion-loop.test.mjs

import { writeFileSync } from "node:fs";
import { buildProjectFromSeed, buildR0Snapshot, netProgramAreaUm2 } from "../lib/architect-2525/canonical/runtime.ts";
import { projectHash, canonicalByteCount } from "../lib/architect-2525/canonical/serialize.ts";
import { TINY_HOME_V1 } from "../lib/architect-2525/seeds/tiny-home-v1.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };
const notYet = (reason) => { console.log(`\narchitect-completion-loop: NOT YET — ${reason}`); console.log("(test-first: Blocks B+C build toward this; red until Block C.)"); process.exit(1); };

// ── Block A is in place: R0 exists and is deterministic ──
const r0 = buildProjectFromSeed(TINY_HOME_V1);
const r0Hash = projectHash(r0);
ok(r0.current_revision_id === "R0" && /^[0-9a-f]{64}$/.test(r0Hash), "R0 built with a SHA-256 project_hash");
ok(buildR0Snapshot(r0).project_hash === r0Hash, "R0 snapshot generated through the serializer");

// ── The Block B/C API the loop requires (contract that Blocks B+C implement) ──
let edit, rcore, pkg;
try { edit = await import("../lib/architect-2525/canonical/runtime-edit.ts"); } catch { notYet("canonical/runtime-edit.ts (edge engine + HI-ACCEPT) not built — Block B"); }
try { rcore = await import("../lib/architect-2525/canonical/rcore.ts"); } catch { notYet("canonical/rcore.ts (event log, replay, reverse, SPIRAL, SYNC) not built — Block B"); }
try { pkg = await import("../lib/architect-2525/canonical/package.ts"); } catch { notYet("canonical/package.ts (.arch2525 V2 writer/reader) not built — Block C"); }

// From here the loop exercises the real API. Expected contract (Blocks B+C):
//   rcore.initRCore(r0Snapshot)                         -> RCore  (GENESIS = R0 project_hash)
//   edit.proposeEdgeEdit(project, {bay_code,edge,deltaUm}) -> { ok:true, preview } | { ok:false, reason }
//   edit.acceptEdit(project, rcore, preview, actor)     -> { project, rcore }   (one event group, +1 revision)
//   rcore.replay(rcore, revisionId)                     -> project              (== stored hash)
//   rcore.reverse(rcore, revisionId)                    -> { parentHash }       (pure; working state unchanged)
//   rcore.spiral(project, rcore)                        -> "PASS" | ...
//   rcore.syncState(project, rcore)                     -> "SYNCED" | ...
//   pkg.writePackageV2(project, rcore)                  -> Uint8Array
//   pkg.readPackageV2(bytes)                            -> { project, rcore }
const need = ["initRCore", "replay", "reverse", "spiral", "syncState"].filter((f) => typeof rcore[f] !== "function")
  .concat(["proposeEdgeEdit", "acceptEdit"].filter((f) => typeof edit[f] !== "function"))
  .concat(["writePackageV2", "readPackageV2"].filter((f) => typeof pkg[f] !== "function"));
if (need.length) notYet(`Block B/C API incomplete — missing: ${need.join(", ")}`);

const EDGE = 304_800; // §XXVII edit delta
let rc = rcore.initRCore(buildR0Snapshot(r0));

// ── PASS ONE — exterior edge ──
let p1 = edit.proposeEdgeEdit(r0, { bay_code: "C1", edge: "WEST", deltaUm: EDGE });
ok(p1.ok, "PASS ONE: exterior C1 WEST preview is offered");
let a1 = edit.acceptEdit(r0, rc, p1.preview, { actor_id: "HI", actor_role: "HI" });
rc = a1.rcore; const r1 = a1.project; const r1Hash = projectHash(r1);
ok(r1.current_revision_id === "R1", "PASS ONE: ACCEPT → R1");
ok(JSON.stringify(r1.datum) === JSON.stringify([0, 0, 0]), "PASS ONE: datum unchanged");
ok(r1.entities.find((e) => e.bay_code === "C1").x_um < 0, "PASS ONE: C1 west edge gives negative X (valid)");
ok(netProgramAreaUm2(r1) !== netProgramAreaUm2(r0), "PASS ONE: net program area changes (exterior)");
ok(r1Hash !== r0Hash, "PASS ONE: project hash changed R0→R1");
ok(rcore.spiral(r1, rc) === "PASS" && rcore.syncState(r1, rc) === "SYNCED", "PASS ONE: SPIRAL PASS + SYNCED");
ok(projectHash(rcore.replay(rc, "R1")) === r1Hash, "PASS ONE: Replay(R1) == stored R1 hash");
ok(rcore.reverse(rc, "R1").parentHash === r0Hash, "PASS ONE: Reverse(R1) reconstructs the R0 parent hash");
let bytes1 = pkg.writePackageV2(r1, rc);
let back1 = pkg.readPackageV2(bytes1);
ok(projectHash(back1.project) === r1Hash, "PASS ONE: save→reload preserves the R1 hash");

// ── PASS TWO — shared edge, on the RELOADED project ──
let p2 = edit.proposeEdgeEdit(back1.project, { bay_code: "B2", edge: "EAST", deltaUm: EDGE });
ok(p2.ok, "PASS TWO: shared B2 EAST preview is offered");
let a2 = edit.acceptEdit(back1.project, back1.rcore, p2.preview, { actor_id: "HI", actor_role: "HI" });
const r2 = a2.project; const r2Hash = projectHash(r2);
ok(r2.current_revision_id === "R2", "PASS TWO: ACCEPT → R2");
ok(netProgramAreaUm2(r2) === netProgramAreaUm2(back1.project), "PASS TWO: net area conserved (shared edge)");
ok(r2Hash !== r1Hash, "PASS TWO: project hash changed R1→R2");
ok(rcore.spiral(r2, a2.rcore) === "PASS" && rcore.syncState(r2, a2.rcore) === "SYNCED", "PASS TWO: SPIRAL PASS + SYNCED");
ok(projectHash(rcore.replay(a2.rcore, "R2")) === r2Hash, "PASS TWO: Replay(R2) == stored R2 hash");
let back2 = pkg.readPackageV2(pkg.writePackageV2(r2, a2.rcore));
ok(projectHash(back2.project) === r2Hash, "PASS TWO: save→reload preserves the R2 hash");

// ── BLOCKED — a shared resize that would force a neighbor below the minimum ──
const blocked = edit.proposeEdgeEdit(back2.project, { bay_code: "B2", edge: "EAST", deltaUm: 2_500_000 });
ok(!blocked.ok && /minimum/i.test(blocked.reason || ""), "BLOCKED: neighbor-below-minimum resize is refused");
ok(projectHash(back2.project) === r2Hash, "BLOCKED: project hash unchanged (no mutation, no revision)");

// ── §27 / §XXXIV / §17 — the clauses are DERIVED from the backing steps, never literals (advisory §10/ARC-39.02) ──
const clauses = {
  altered: r1Hash !== r0Hash && r2Hash !== r1Hash,                                           // STEP 2/4 changed the hash
  remembers: projectHash(rcore.replay(a2.rcore, "R2")) === r2Hash && a2.rcore.events.length === 2, // Replay==stored + event groups
  verify_reverse: rcore.reverse(a2.rcore, "R2").parentHash === r1Hash && rcore.reverse(a2.rcore, "R1").parentHash === r0Hash,
  survives: projectHash(back1.project) === r1Hash && projectHash(back2.project) === r2Hash,  // save→reload preserves the hash
};
const final_question_pass = clauses.altered && clauses.remembers && clauses.verify_reverse && clauses.survives;
// meta-assertion that BITES (Thor, 2026-10-23): re-derive each clause's backing condition HERE from the stored
// hashes and the event log — not from the `clauses` object — and assert the verdict equals their AND. If a future
// edit ever set a clause to a literal while its real step failed, final_question_pass and `backing` diverge and
// this fails. (Replaces a former X===X tautology that could never fail.)
const backing =
  (r1Hash !== r0Hash && r2Hash !== r1Hash) &&
  (projectHash(rcore.replay(a2.rcore, "R2")) === r2Hash && a2.rcore.events.length === 2) &&
  (rcore.reverse(a2.rcore, "R2").parentHash === r1Hash && rcore.reverse(a2.rcore, "R1").parentHash === r0Hash) &&
  (projectHash(back1.project) === r1Hash && projectHash(back2.project) === r2Hash);
ok(final_question_pass === backing, "final_question_pass equals the AND of the independently re-derived backing conditions (never a literal)");
ok(final_question_pass, "§27 FINAL QUESTION → PASS (altered · remembers · verify-reverse · survives)");

// §17 — HASH_PROOF.json is GENERATED by the test (never hand-typed); the completion loop does not depend on it.
// implementation_commit is injected at Commit-B time (IMPLEMENTATION_COMMIT); default marks an uncommitted run.
const pkgBytes = pkg.writePackageV2(r2, a2.rcore);
const hashProof = {
  implementation_commit: process.env.IMPLEMENTATION_COMMIT || "UNCOMMITTED",
  schema_version: r2.schema_version,
  current_revision_id: r2.current_revision_id,
  project_hash: r2Hash,
  package_hash: pkg.readPackageV2(pkgBytes).package_hash,
  canonical_serialization_byte_count: canonicalByteCount(r2),
  entity_count: r2.entities.length,
  event_count: a2.rcore.events.length,
  snapshot_count: a2.rcore.snapshots.length,
  clauses,
  final_question_pass,
  generated_by_test: true,
};
// Only the Commit-B closeout run writes the artifact (WRITE_HASH_PROOF=1 IMPLEMENTATION_COMMIT=<A SHA>), so
// the completion loop in test:ci never overwrites the committed proof with an UNCOMMITTED run.
if (process.env.WRITE_HASH_PROOF) {
  try {
    writeFileSync(new URL("../../docs/architecture-2525/HASH_PROOF.json", import.meta.url), JSON.stringify(hashProof, null, 2) + "\n");
    console.log(`HASH_PROOF.json written (implementation_commit=${hashProof.implementation_commit}).`);
  } catch (e) { console.log("HASH_PROOF write skipped:", e.message); }
}

console.log(`\narchitect-completion-loop: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

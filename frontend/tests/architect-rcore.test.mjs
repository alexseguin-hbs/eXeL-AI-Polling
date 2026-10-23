// ARC-35 — R-CORE: the memory. Only HI ACCEPT commits; event groups chain from the R0 GENESIS; replay
// reconstructs; reverse is a pure parent-hash check; SPIRAL PASS; SYNC SYNCED; HOLD/REJECT/BLOCKED write
// nothing; the edge engine conserves interior area / changes exterior / blocks below the minimum (neighbor
// AND self); a snapshot lands at R10 and replay crosses it; STALE/SUPERSEDED have named producers.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-rcore.test.mjs
import { buildProjectFromSeed, buildR0Snapshot, netProgramAreaUm2 } from "../lib/architect-2525/canonical/runtime.ts";
import { projectHash } from "../lib/architect-2525/canonical/serialize.ts";
import { TINY_HOME_V1 } from "../lib/architect-2525/seeds/tiny-home-v1.ts";
import {
  initRCore, replay, reverse, spiral, syncState, verifyChain, headRevision,
  invalidateEvidence, supersedeEvidence,
} from "../lib/architect-2525/canonical/rcore.ts";
import { proposeEdgeEdit, acceptEdit, holdEdit, rejectEdit } from "../lib/architect-2525/canonical/runtime-edit.ts";
import { MIN_DIMENSION_UM } from "../lib/architect-2525/canonical/units.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };
const HI = { actor_id: "HI", actor_role: "HI" };
const space = (p, bay) => p.entities.find((e) => e.bay_code === bay);

const r0 = buildProjectFromSeed(TINY_HOME_V1);
const r0Hash = projectHash(r0);
let rc = initRCore(buildR0Snapshot(r0));

// ── GENESIS ──
ok(rc.events.length === 0 && rc.snapshots.length === 1 && rc.snapshots[0].project_hash === r0Hash, "GENESIS: R0 snapshot only");
ok(spiral(r0, rc) === "NOT_RUN", "SPIRAL NOT_RUN before any committed edit");

// ── PASS ONE — exterior C1 WEST +304,800 ──
const pr1 = proposeEdgeEdit(r0, { bay_code: "C1", edge: "WEST", deltaUm: 304800 });
ok(pr1.ok && pr1.preview.status === "PROPOSED" && pr1.preview.proposed_change.interior === false, "exterior C1 WEST preview offered");
const a1 = acceptEdit(r0, rc, pr1.preview, HI, { timestamp_ms: 111, local_date: "October 23, 2026 · Central" });
const r1 = a1.project; rc = a1.rcore; const r1Hash = projectHash(r1);
ok(r1.current_revision_id === "R1" && rc.events.length === 1, "ACCEPT → R1, one event group");
ok(space(r1, "C1").x_um === -304800, "C1 west edge → x_um negative (datum unmoved, §05)");
ok(JSON.stringify(r1.datum) === "[0,0,0]", "datum unchanged");
ok(netProgramAreaUm2(r1) === netProgramAreaUm2(r0) + 304800 * 3048000, "exterior edit changes net program area");
ok(r1Hash !== r0Hash && rc.events[0].prev_hash === r0Hash, "hash R0→R1 changed; event prev_hash = R0 GENESIS");
ok(r1.plan_state === "REVIEWABLE", "ACCEPT keeps plan_state REVIEWABLE (not HI_APPROVED)");

// ── PASS TWO — interior B2 EAST +304,800 (net conserved) ──
const pr2 = proposeEdgeEdit(r1, { bay_code: "B2", edge: "EAST", deltaUm: 304800 });
ok(pr2.ok && pr2.preview.proposed_change.interior === true, "interior B2 EAST preview offered");
const a2 = acceptEdit(r1, rc, pr2.preview, HI); const r2 = a2.project; rc = a2.rcore; const r2Hash = projectHash(r2);
ok(r2.current_revision_id === "R2" && rc.events.length === 2, "ACCEPT → R2, two event groups");
ok(space(r2, "B2").width_um === 3352800 && space(r2, "B3").width_um === 2743200 && space(r2, "B3").x_um === 6400800, "Kitchen +Δ, Dining −Δ (shared edge moved)");
ok(netProgramAreaUm2(r2) === netProgramAreaUm2(r1), "interior edit conserves net program area");
ok(rc.events[1].changes.filter((c) => c.entity_type === "SPACE" && /_um$/.test(c.field)).length >= 2, "R2 event group carries both entities' geometry changes");

// ── replay / reverse / SPIRAL / SYNC ──
ok(projectHash(replay(rc, "R1")) === r1Hash, "Replay(R1) == stored R1 hash");
ok(projectHash(replay(rc, "R2")) === r2Hash, "Replay(R2) == stored R2 hash");
const rev2 = reverse(rc, "R2");
ok(rev2.parentHash === r1Hash, "Reverse(R2) reconstructs the R1 parent hash");
ok(reverse(rc, "R1").parentHash === r0Hash, "Reverse(R1) reconstructs the R0 parent hash");
ok(projectHash(r2) === r2Hash, "reverse is PURE — working R2 unchanged");
ok(spiral(r2, rc) === "PASS", "SPIRAL PASS at head");
ok(syncState(r2, rc) === "SYNCED", "R-CORE SYNCED");
ok(verifyChain(rc).ok, "chain verifies root→head");

// ── determinism: timestamp_ms/local_date are hash-excluded ──
let rcA = initRCore(buildR0Snapshot(r0));
const eA = acceptEdit(r0, rcA, proposeEdgeEdit(r0, { bay_code: "C1", edge: "WEST", deltaUm: 304800 }).preview, HI, { timestamp_ms: 1, local_date: "A" });
let rcB = initRCore(buildR0Snapshot(r0));
const eB = acceptEdit(r0, rcB, proposeEdgeEdit(r0, { bay_code: "C1", edge: "WEST", deltaUm: 304800 }).preview, HI, { timestamp_ms: 999999, local_date: "Z" });
ok(projectHash(eA.project) === projectHash(eB.project), "two runs differing only in ◬ timestamp/웃 date → identical project_hash");
ok(eA.rcore.events[0].event_hash === eB.rcore.events[0].event_hash, "event_hash excludes timestamp/local_date");

// ── HOLD / REJECT write nothing ──
const held = holdEdit(pr2.preview);
ok(held.status === "HELD" && held.proposed_change, "HOLD keeps the preview live");
const cleared = rejectEdit();
ok(cleared.status === "CLEARED" && cleared.proposed_change === null, "REJECT clears the viewport");
ok(headRevision(rc) === "R2" && rc.events.length === 2 && projectHash(r2) === r2Hash, "HOLD/REJECT leave R-CORE and the project untouched");

// ── BLOCKED: neighbor below minimum (interior) and self below minimum (exterior) ──
const bN = proposeEdgeEdit(r2, { bay_code: "B2", edge: "EAST", deltaUm: 2_500_000 });
ok(!bN.ok && /neighbor dimension below minimum/i.test(bN.reason), "interior resize past the neighbor floor → BLOCKED");
const bS = proposeEdgeEdit(r2, { bay_code: "C1", edge: "WEST", deltaUm: -3_000_000 });
ok(!bS.ok && /edited dimension below minimum/i.test(bS.reason), "exterior shrink past the self floor → BLOCKED (Enki)");
ok(projectHash(r2) === r2Hash && rc.events.length === 2, "a BLOCKED proposal mutates nothing, adds no revision");

// ── exact-floor fencepost: == MIN allowed, one µm below blocked (strict <) ──
const toExact = space(r2, "B3").width_um - MIN_DIMENSION_UM; // shrink B3 to exactly MIN via B2 EAST
ok(proposeEdgeEdit(r2, { bay_code: "B2", edge: "EAST", deltaUm: toExact }).ok, "neighbor at exactly 1,000,000 µm is ALLOWED");
ok(!proposeEdgeEdit(r2, { bay_code: "B2", edge: "EAST", deltaUm: toExact + 1 }).ok, "neighbor at 999,999 µm is BLOCKED");

// ── snapshot cadence: a snapshot at R10; replay(R11) reconstructs FROM it ──
let rcC = initRCore(buildR0Snapshot(r0));
let pc = r0, lastHash = r0Hash;
for (let i = 0; i < 11; i++) {
  const pr = proposeEdgeEdit(pc, { bay_code: "C1", edge: "WEST", deltaUm: 1_000_000 });
  ok(pr.ok, `cadence edit ${i + 1} offered`);
  const a = acceptEdit(pc, rcC, pr.preview, HI); pc = a.project; rcC = a.rcore; lastHash = projectHash(pc);
}
ok(headRevision(rcC) === "R11", "11 revisions committed");
ok(rcC.snapshots.some((s) => s.revision_id === "R10"), "a snapshot exists at R10 (cadence)");
ok(projectHash(replay(rcC, "R11")) === lastHash, "Replay(R11) == stored (reconstructed across the R10 snapshot)");
ok(projectHash(replay(rcC, "R7")) === projectHash(replay(rcC, "R7")), "replay is deterministic for a mid revision");

// ── §XX — STALE / SUPERSEDED producers ──
const stale = invalidateEvidence(r2, [space(r2, "B2").entity_id], "R3", "re-simulated");
ok(space(stale, "B2").evidence.validity === "STALE" && space(stale, "B2").evidence.invalidated_by_revision_id === "R3", "invalidateEvidence → STALE with the invalidating revision");
const sup = supersedeEvidence(stale, [space(stale, "B2").entity_id], "R4");
ok(space(sup, "B2").evidence.validity === "SUPERSEDED", "supersedeEvidence → SUPERSEDED (named producer)");
ok(space(r2, "B2").evidence.validity === "CURRENT", "the transitions are pure (original R2 unchanged)");

console.log(`\narchitect-rcore: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

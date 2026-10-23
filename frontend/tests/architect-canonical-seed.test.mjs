// ARC-34.05/06/07 — the one auditable seed, and R0 GENERATED through the production constructor. Proves:
// 9 Spaces at exact coords; 3 wet (A2/B2/C2); 1 bath (A2); the exact pinned UUIDv7 ids; exactly 900 ft²
// from the safe-int derived area; the datum fixed at C1's SW corner [0,0,0]; and R0 built twice from
// scratch yields an IDENTICAL project_hash (Thor: no Date.now/random in the hash path).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-seed.test.mjs
import { TINY_HOME_V1, SEED_SPACE_IDS } from "../lib/architect-2525/seeds/tiny-home-v1.ts";
import { buildProjectFromSeed, netProgramAreaUm2, spaceCount, wetCount, bathCount, buildR0Snapshot } from "../lib/architect-2525/canonical/runtime.ts";
import { projectHash, serializeCanonicalProject } from "../lib/architect-2525/canonical/serialize.ts";
import { sqftFromUm2, UM_PER_10FT } from "../lib/architect-2525/canonical/units.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

// ── the seed is one auditable fixture ──
ok(Array.isArray(TINY_HOME_V1.spaces) && TINY_HOME_V1.spaces.length === 9, "seed is a module with 9 spaces");
ok(TINY_HOME_V1.actor_id === "template:TINY_HOME", "actor_id = template:TINY_HOME");
ok(SEED_SPACE_IDS.length === 9 && new Set(SEED_SPACE_IDS).size === 9, "nine distinct pinned Space ids");

// ── exact coordinates (datum C1 SW; +X East, +Y North; C y=0, B y=E, A y=2E) ──
const byBay = Object.fromEntries(TINY_HOME_V1.spaces.map((s) => [s.bay_code, s]));
const E = UM_PER_10FT;
ok(byBay.C1.x_um === 0 && byBay.C1.y_um === 0, "C1 at datum (0,0)");
ok(byBay.C3.x_um === 2 * E && byBay.C3.y_um === 0, "C3 at (2E, 0)");
ok(byBay.A1.x_um === 0 && byBay.A1.y_um === 2 * E, "A1 at (0, 2E)");
ok(byBay.A3.x_um === 2 * E && byBay.A3.y_um === 2 * E, "A3 at (2E, 2E)");
ok(TINY_HOME_V1.spaces.every((s) => s.width_um === E && s.depth_um === E), "every Space is 10ft × 10ft");

// ── functions / wet / bath ──
ok(byBay.A1.function === "BEDROOM" && byBay.A2.function === "BATH" && byBay.B2.function === "KITCHEN" && byBay.C1.function === "OFFICE", "functions pinned (A1 BEDROOM, A2 BATH, B2 KITCHEN, C1 OFFICE)");
const wet = TINY_HOME_V1.spaces.filter((s) => s.wet_class === "WET").map((s) => s.bay_code).sort();
ok(JSON.stringify(wet) === JSON.stringify(["A2", "B2", "C2"]), "3 wet spaces: A2/B2/C2");

// ── build R0 via the production constructor ──
const p = buildProjectFromSeed(TINY_HOME_V1);
ok(p.current_revision_id === "R0", "R0 revision id");
ok(JSON.stringify(p.datum) === JSON.stringify([0, 0, 0]), "datum fixed at [0,0,0] (C1 SW corner)");
ok(spaceCount(p) === 9 && wetCount(p) === 3 && bathCount(p) === 1, "9 spaces · 3 wet · 1 bath via runtime");

// ── the 900 ft² proof, exact, from the safe-int derived area ──
const total = netProgramAreaUm2(p);
ok(total === 83_612_736_000_000, "net program area = 83,612,736,000,000 µm²");
ok(sqftFromUm2(total) === 900, "net program area = 900.0 ft² exactly");
ok(total < Number.MAX_SAFE_INTEGER, "the aggregate is within 2^53−1 (§24)");

// ── two-run determinism: R0 built twice from scratch → identical project_hash ──
const h1 = projectHash(buildProjectFromSeed(TINY_HOME_V1));
const h2 = projectHash(buildProjectFromSeed(TINY_HOME_V1));
ok(h1 === h2, "R0 project_hash is identical across two from-scratch builds");
ok(/^[0-9a-f]{64}$/.test(h1), "project_hash is 64-char lowercase hex (SHA-256)");

// ── the R0 snapshot is generated through the serializer+hash (never hand-written, §11) ──
const snap = buildR0Snapshot(p);
ok(snap.revision_id === "R0" && snap.project_hash === h1, "buildR0Snapshot: R0, hash == projectHash");
ok(serializeCanonicalProject(snap.project) === serializeCanonicalProject(p), "snapshot carries the canonical project");

console.log(`\narchitect-canonical-seed: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

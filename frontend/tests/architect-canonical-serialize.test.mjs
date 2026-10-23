// ARC-36.01 — the one canonical serializer: a volatile-only change is byte-identical; NFD normalizes to NFC;
// entity arrays sort by the raw case-preserved entity_id; an added optional field leaves a legacy hash unchanged.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-serialize.test.mjs
import { serializeCanonicalProject, projectHash, canonicalHash } from "../lib/architect-2525/canonical/serialize.ts";
import { buildProjectFromSeed } from "../lib/architect-2525/canonical/runtime.ts";
import { TINY_HOME_V1 } from "../lib/architect-2525/seeds/tiny-home-v1.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

const p = buildProjectFromSeed(TINY_HOME_V1);
const base = serializeCanonicalProject(p);
const baseHash = projectHash(p);

// ── volatile-only change → byte-identical ──
const pv = structuredClone(p);
pv.created_at = "2026-10-23T00:00:00Z"; pv.updated_at = "2026-10-23T12:00:00Z"; pv.package_hash = "deadbeef";
pv.camera = { zoom: 2 }; pv.selection = ["x"]; pv.ui = { tab: "design" };
ok(serializeCanonicalProject(pv) === base, "a volatile-only change is byte-identical");
ok(projectHash(pv) === baseHash, "volatile change leaves project_hash unchanged");

// ── key order independence (sorted keys) ──
const reordered = structuredClone(p);
reordered.entities = reordered.entities.slice().reverse(); // reverse the array order; serializer re-sorts by entity_id
ok(serializeCanonicalProject(reordered) === base, "entity array order does not affect the canonical bytes (sorted by entity_id)");

// ── NFD → NFC byte-identical ──
const nfc = structuredClone(p); const nfd = structuredClone(p);
const i = nfc.entities.findIndex((e) => e.bay_code === "A2");
nfc.entities[i].legacy_slug = "café";           // NFC é
nfd.entities[i].legacy_slug = "café";          // NFD e + combining acute
ok(serializeCanonicalProject(nfc) === serializeCanonicalProject(nfd), "NFD and NFC strings serialize byte-identically");

// ── case-sensitive entity_id sort ──
const caseP = {
  schema_version: 1, project_id: "X", portfolio_stage: "G2_PLAN", plan_state: "REVIEWABLE",
  datum: [0, 0, 0], current_revision_id: "R0", financial_record_id: null, financial_record_hash: null,
  entities: [
    { entity_id: "m-0000-7000-8000-aa", entity_type: "SITE", parent_id: null, revision_id: "R0", evidence: { authority_state: "ASSUMED", validity: "CURRENT", source_revision_id: "R0", invalidated_by_revision_id: null, invalidated_reason: null } },
    { entity_id: "M-0000-7000-8000-AA", entity_type: "SITE", parent_id: null, revision_id: "R0", evidence: { authority_state: "ASSUMED", validity: "CURRENT", source_revision_id: "R0", invalidated_by_revision_id: null, invalidated_reason: null } },
  ],
};
const cs = serializeCanonicalProject(caseP);
ok(cs.indexOf('"M-0000') < cs.indexOf('"m-0000'), "entity_id sort is case-sensitive ('M'=0x4d before 'm'=0x6d)");

// ── an added optional (undefined) field leaves the hash unchanged; a null is kept ──
const added = structuredClone(p);
added.entities[0].future_optional = undefined;
ok(projectHash(added) === baseHash, "an undefined optional field is omitted → hash unchanged");
const withNull = structuredClone(p); withNull.entities[0].future_optional = null;
ok(projectHash(withNull) !== baseHash, "a null field IS canonical content → hash differs (null never stands in for absent)");

// ── canonicalHash is stable and volatile-aware too ──
ok(canonicalHash({ a: 1, b: 2 }) === canonicalHash({ b: 2, a: 1 }), "canonicalHash is key-order independent");
ok(/^[0-9a-f]{64}$/.test(baseHash), "project_hash is 64-hex SHA-256");

console.log(`\narchitect-canonical-serialize: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

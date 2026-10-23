// ARC-34.02/03/04/08 — the canonical schema. Nine Spaces as a polymorphic entity hierarchy with stable
// UUIDv7 identity; EvidenceState two-dimensional (authority × validity); PortfolioStage disjoint from the
// estimate GATE firewall; the Financial boundary reserved-nullable; the four anticipatory AuthorityStates
// never emitted by a V1 path; a case-preserved non-UUID id round-trips; an additive field leaves a legacy
// project_hash unchanged.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-schema.test.mjs
import { readFileSync } from "node:fs";
import {
  AUTHORITY_STATES, ANTICIPATORY_AUTHORITY_STATES, EVIDENCE_VALIDITIES,
  PORTFOLIO_STAGES, PLAN_STATES, ENTITY_TYPES, SPACE_FUNCTIONS, WET_CLASSES,
} from "../lib/architect-2525/canonical/types.ts";
import { isUuidV7, isEntityId } from "../lib/architect-2525/canonical/uuidv7.ts";
import { GATES } from "../lib/architect-estimate.ts";
import { buildProjectFromSeed } from "../lib/architect-2525/canonical/runtime.ts";
import { serializeCanonicalProject, projectHash } from "../lib/architect-2525/canonical/serialize.ts";
import { TINY_HOME_V1, SEED_SPACE_IDS } from "../lib/architect-2525/seeds/tiny-home-v1.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

// ── §08 — AuthorityState (9) and EvidenceValidity (3) are orthogonal; STALE is a validity, not an authority ──
ok(AUTHORITY_STATES.length === 9, "9 AuthorityState values");
ok(!AUTHORITY_STATES.includes("STALE"), "STALE is NOT an AuthorityState value");
ok(EVIDENCE_VALIDITIES.length === 3 && EVIDENCE_VALIDITIES.includes("STALE") && EVIDENCE_VALIDITIES.includes("SUPERSEDED") && EVIDENCE_VALIDITIES.includes("CURRENT"), "validity = CURRENT/STALE/SUPERSEDED");
ok(AUTHORITY_STATES.includes("SIMULATED"), "SIMULATED is an AuthorityState (SIMULATED+STALE is representable)");
ok(ANTICIPATORY_AUTHORITY_STATES.length === 4 && ANTICIPATORY_AUTHORITY_STATES.every((a) => AUTHORITY_STATES.includes(a)), "4 anticipatory states, all members of AuthorityState");

// ── §X — PortfolioStage (7), disjoint from the estimate GATE firewall, never a bare G# ──
ok(PORTFOLIO_STAGES.length === 7 && PORTFOLIO_STAGES[1] === "G2_PLAN", "7 PortfolioStage members incl. G2_PLAN");
ok(PORTFOLIO_STAGES.every((s) => !GATES.includes(s)), "no PortfolioStage equals any GATES[] label");
ok(PORTFOLIO_STAGES.every((s) => !/^G\d+$/.test(s)), "no PortfolioStage is a bare G<n> token");
ok(PLAN_STATES.includes("REVIEWABLE") && PLAN_STATES.includes("HI_APPROVED"), "PlanState = REVIEWABLE/HI_APPROVED");
ok(ENTITY_TYPES.length === 5 && SPACE_FUNCTIONS.length === 9 && WET_CLASSES.length === 2, "5 entity types, 9 functions, 2 wet classes");

// ── §VIII(5) — identity: the nine seed ids are pinned UUIDv7 literals; isUuidV7 gates generation only ──
ok(SEED_SPACE_IDS.length === 9 && SEED_SPACE_IDS.every(isUuidV7), "9 seed Space ids are valid UUIDv7 literals");
ok(isEntityId("22-char-base64-IFC-GlobalId") && !isUuidV7("3t7R$notauuid"), "entity_id accepts a non-UUID token; isUuidV7 rejects it (generation-only)");

// ── build R0 and inspect the canonical shape ──
const p = buildProjectFromSeed(TINY_HOME_V1);
const spaces = p.entities.filter((e) => e.entity_type === "SPACE");
ok(p.entities.length === 13, "13 entities (Project+Site+Building+Storey+9 Spaces)");
ok(spaces.length === 9, "9 Space entities");
ok(p.portfolio_stage === "G2_PLAN" && p.plan_state === "REVIEWABLE", "R0 is G2_PLAN / REVIEWABLE");
ok(spaces.every((s) => s.evidence.authority_state === "ASSUMED" && s.evidence.validity === "CURRENT" && s.evidence.source_revision_id === "R0"), "every Space evidence = ASSUMED/CURRENT/R0");

// ── §08 — a SIMULATED+STALE evidence state is representable ──
const simStale = { authority_state: "SIMULATED", validity: "STALE", source_revision_id: "R1", invalidated_by_revision_id: "R2", invalidated_reason: "re-simulated" };
ok(AUTHORITY_STATES.includes(simStale.authority_state) && EVIDENCE_VALIDITIES.includes(simStale.validity), "SIMULATED+STALE representable");

// ── §3.3 — Financial boundary is reserved-nullable (present AND null) ──
ok("financial_record_id" in p && p.financial_record_id === null, "financial_record_id present and null");
ok("financial_record_hash" in p && p.financial_record_hash === null, "financial_record_hash present and null");

// ── banned canonical field names (§3.4/§XI/§22): walk every key in the serialized R0 ──
const BANNED = new Set(["웃", "◬", "♡", "mot", "rate", "time_capital", "yaw", "svg", "mesh", "wall"]);
const keys = new Set();
(function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") for (const k of Object.keys(v)) { keys.add(k); walk(v[k]); } })(JSON.parse(serializeCanonicalProject(p)));
ok([...keys].every((k) => !BANNED.has(k)), `no banned canonical field name (keys: ${[...keys].filter((k) => BANNED.has(k)).join(",") || "none banned"})`);

// ── no V1 path emits the 4 anticipatory AuthorityStates ──
ok(p.entities.every((e) => !ANTICIPATORY_AUTHORITY_STATES.includes(e.evidence.authority_state)), "no R0 entity carries an anticipatory AuthorityState");
const runtimeSrc = readFileSync(new URL("../lib/architect-2525/canonical/runtime.ts", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/"[^"]*"/g, '""');
ok(ANTICIPATORY_AUTHORITY_STATES.every((a) => !runtimeSrc.includes(a)), "runtime.ts emits no anticipatory AuthorityState literal");

// ── ARC-36.01 — case-preserved sort key: two ids differing only in case round-trip, sort case-sensitively ──
const caseProj = {
  schema_version: 1, project_id: "X", portfolio_stage: "G2_PLAN", plan_state: "REVIEWABLE",
  datum: [0, 0, 0], current_revision_id: "R0", financial_record_id: null, financial_record_hash: null,
  entities: [
    { entity_id: "ZZZZZZZZ-0000-7000-8000-0000000000aa", entity_type: "SITE", parent_id: null, revision_id: "R0", evidence: { authority_state: "ASSUMED", validity: "CURRENT", source_revision_id: "R0", invalidated_by_revision_id: null, invalidated_reason: null }, name: "lower" },
    { entity_id: "ZZZZZZZZ-0000-7000-8000-0000000000AA", entity_type: "SITE", parent_id: null, revision_id: "R0", evidence: { authority_state: "ASSUMED", validity: "CURRENT", source_revision_id: "R0", invalidated_by_revision_id: null, invalidated_reason: null }, name: "UPPER" },
  ],
};
const ser = serializeCanonicalProject(caseProj);
ok(ser.includes("0000000000aa") && ser.includes("0000000000AA"), "both case variants preserved byte-exact");
ok(ser.indexOf("0000000000AA") < ser.indexOf("0000000000aa"), "sort is case-sensitive ('A'=0x41 before 'a'=0x61)");

// ── ARC-34.02 — an additive (undefined) optional field leaves the project_hash unchanged ──
const h0 = projectHash(p);
const p2 = structuredClone(p);
p2.entities[0].a_future_optional_field = undefined; // additive, absent-valued
ok(projectHash(p2) === h0, "an additive undefined field leaves the legacy project_hash unchanged");

console.log(`\narchitect-canonical-schema: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

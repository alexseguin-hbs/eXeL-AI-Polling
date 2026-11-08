// ARCHITECT-2525 / FUTURE · Phase 4 simulation + reference + review contracts — GREEN (joins test:ci).
// T-RATINGS (ReferenceClaim ≠ DesignTarget ≠ ProjectQualification; a score can never fake a qualification),
// T-ACTOR-AUTH (Submit ≠ Review ≠ Approve; approve/qualify need an AUTHENTICATED human — enforced in the reducer AND on
// replay, plan §40.7; no AI/SYSTEM can reach APPROVED), T-HEALTH (Project Health derives from canonical state and only
// echoes it), plus benchmarks on separate axes (FCRS-28). Pure logic; the React Review tab reads these.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-future-review.test.mjs
import { transformV1toV2 } from "../lib/architect-future/transformation/reference-v1-to-v2.ts";
import { ratingsView, targetFromReference } from "../lib/architect-future/selectors/ratings.ts";
import { submit, review, approve, declareBuildReady, qualify } from "../lib/architect-future/state/authority-machine.ts";
import { projectHealth, HEALTH_CATEGORIES } from "../lib/architect-future/selectors/health.ts";
import { benchmarks } from "../lib/architect-future/simulation/compare.ts";
import { replay, applyEvent } from "../lib/architect-future/rcore/replay.ts";
import { hashV2 } from "../lib/architect-future/serialization/hash-v2.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  ✗ " + m); } };
const SYSTEM = { kind: "SYSTEM", id: "ai" };
const GUEST = { kind: "UNAUTHENTICATED_HUMAN", id: "u" };
const SIGNED = { kind: "AUTHENTICATED_HUMAN", id: "auth-sub-1" };
const NOW = "2026-11-08T00:00:00Z";
const base = transformV1toV2(null, "REFERENCE_3X3_12_10_1", GUEST, NOW).project;
const t = transformV1toV2(null, "REFERENCE_3X3_12_10_1", GUEST, NOW).event;

// ── T-RATINGS ── three separate records, never conflated
const ref = { claim_id: "icon-wall", label: "ICON wall-system", evidence: "REFERENCE", source: "ICON deck", received_date: "2026-11-02" };
const target = targetFromReference(ref, "$34 / wall ft²", GUEST, NOW);
ok(target.from_reference_id === ref.claim_id && target.actor === GUEST, "T-RATINGS · a DesignTarget points back at the reference (human-authored)");
ok(ref.evidence === "REFERENCE" && !("qualified_by" in ref), "T-RATINGS · the ReferenceClaim is NOT mutated into a qualification");
const q = qualify("Wall rating", "R-22", "project-specific test report #5", SIGNED, NOW);
ok(q.accepted && q.qualification && q.qualification.qualified_by === SIGNED, "T-RATINGS · a qualification needs evidence + an authenticated human");
const view = ratingsView([ref], [target], q.qualification ? [q.qualification] : []);
ok(view.references.length === 1 && view.targets.length === 1 && view.qualifications.length === 1, "T-RATINGS · the three lists stay separate");
ok(view.counts.references === 1 && view.counts.targets === 1 && view.counts.qualifications === 1, "T-RATINGS · counts per record type");
// a score can never fake a qualification
ok(!qualify("x", "PASS", "test", SYSTEM, NOW).accepted, "T-RATINGS · an AI/SYSTEM cannot qualify");
ok(!qualify("x", "PASS", "test", GUEST, NOW).accepted, "T-RATINGS · an unauthenticated person cannot qualify");
ok(!qualify("x", "PASS", "", SIGNED, NOW).accepted, "T-RATINGS · no evidence → no qualification");

// ── T-ACTOR-AUTH ── Submit ≠ Review ≠ Approve; approve needs an authenticated human
ok(base.authority.plan === "DRAFT", "T-ACTOR-AUTH · a new plan is a DRAFT");
ok(!approve(base, SYSTEM).accepted, "T-ACTOR-AUTH · an AI/SYSTEM cannot approve");
ok(!approve(base, GUEST).accepted, "T-ACTOR-AUTH · an unauthenticated person cannot approve");
const s = submit(base, GUEST, NOW);
ok(s.accepted && s.project.authority.plan === "SUBMITTED", "T-ACTOR-AUTH · a person may submit a draft");
const r = review(s.project, GUEST, NOW);
ok(r.accepted && r.project.authority.plan === "REVIEWED", "T-ACTOR-AUTH · a person may review a submitted plan");
ok(!approve(base, SIGNED).accepted, "T-ACTOR-AUTH · approve is rejected before review (Submit ≠ Approve)");
const a = approve(r.project, SIGNED, NOW);
ok(a.accepted && a.project.authority.plan === "APPROVED", "T-ACTOR-AUTH · an authenticated human approves a reviewed plan");
ok(!declareBuildReady(base, SIGNED).accepted && declareBuildReady(a.project, SIGNED, NOW).accepted, "T-ACTOR-AUTH · build-ready only after approval, authenticated");
ok(!submit(base, SYSTEM).accepted, "T-ACTOR-AUTH · an AI/SYSTEM cannot even submit");

// replay enforcement (plan §40.7): a forged PLAN_APPROVED by SYSTEM can never reach APPROVED
const mk = (seq, type, actor) => ({ event_id: "e" + seq, sequence: seq, event_type: type, actor, occurred_at: NOW, parent_hash: "", payload: {} });
const forged = replay([t, mk(2, "PLAN_APPROVED", SYSTEM)]);
ok(forged.authority.plan === "DRAFT", "T-ACTOR-AUTH · replay IGNORES an AI-authored approval (stays DRAFT)");
const legit = replay([t, mk(2, "PLAN_SUBMITTED", GUEST), mk(3, "PLAN_REVIEWED", GUEST), mk(4, "PLAN_APPROVED", SIGNED)]);
ok(legit.authority.plan === "APPROVED", "T-ACTOR-AUTH · replay of a valid ladder reaches APPROVED");
const forgedHuman = applyEvent(base, mk(2, "PLAN_SUBMITTED", SYSTEM));
ok(forgedHuman.authority.plan === "DRAFT", "T-ACTOR-AUTH · the reducer ignores an AI-authored submit");

// ── T-HEALTH ── derived from canonical state, one finding per category, each with a source
const h = projectHealth(base);
ok(h.length === HEALTH_CATEGORIES.length, "T-HEALTH · one finding per category");
ok(h.every((f) => f.source && f.detail), "T-HEALTH · every finding points at a canonical source");
ok(h.find((f) => f.category === "GEOMETRY").ok === true, "T-HEALTH · GEOMETRY ok for the 9-room reference house");
ok(h.find((f) => f.category === "SYSTEMS").ok === false, "T-HEALTH · SYSTEMS flags that no method is chosen (UNDECIDED)");
const hFrame = projectHealth({ ...base, construction: { method: "FRAME" } });
ok(hFrame.find((f) => f.category === "SYSTEMS").ok === true, "T-HEALTH · SYSTEMS ok once a method is chosen");
ok(h.find((f) => f.category === "ECONOMICS").detail.includes("240,000"), "T-HEALTH · ECONOMICS echoes the canonical baseline (no invented number)");
const forgedApproved = { ...base, authority: { plan: "APPROVED", by: SYSTEM, at: NOW } };
ok(projectHealth(forgedApproved).find((f) => f.category === "AUTHORITY").ok === false, "T-HEALTH · AUTHORITY flags an approval without a signed-in person");

// ── benchmarks on separate axes (FCRS-28) ──
const b = benchmarks();
const units = new Set(b.map((x) => x.unit));
ok(units.size === b.length, "BENCHMARK · every benchmark is a distinct axis (no shared unit)");
ok(b.find((x) => x.id === "baseline_total").value === 240000, "BENCHMARK · the baseline axis is the $240,000 total");
ok(b.find((x) => x.id === "wall_system").unit === "$/wall ft²", "BENCHMARK · the wall benchmark is $/wall ft², its own axis");

console.log(`architect-future-review (Phase 4): ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);

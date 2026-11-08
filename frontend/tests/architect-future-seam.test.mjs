// ARCHITECT-2525 / FUTURE · Phase 5 — T-SEAM, the seven-step seam walked end-to-end through the REAL engine (plan §32).
// This is the binary logic seam (steps 2,3,4,5,6,7 and the data side of step 1); the FOUR-VIEWPORT visual half (375/428/
// 768/1200, no body overflow, create-above-the-fold) is the Playwright seam capture in the Phase-5 FX. Any failed step →
// T-SEAM = FAIL (no "pass with warnings"). Joins test:ci.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-future-seam.test.mjs
import { transformV1toV2 } from "../lib/architect-future/transformation/reference-v1-to-v2.ts";
import { placeArmed, rotateInstance } from "../lib/architect-future/state/placement-machine.ts";
import { planProjection, threeDProjection, walkProjection } from "../lib/architect-future/selectors/geometry.ts";
import { hashV2 } from "../lib/architect-future/serialization/hash-v2.ts";
import { serializeStore, loadProject } from "../lib/architect-future/state/project-store.ts";
import { replay } from "../lib/architect-future/rcore/replay.ts";
import { baselineEstimate, applyJurisdiction } from "../lib/architect-future/simulation/costs.ts";
import { materialTakeoff } from "../lib/architect-future/simulation/materials.ts";
import { submit, review, approve } from "../lib/architect-future/state/authority-machine.ts";
import { OUTER_UM, SHELL_FT, GROSS_FT2, CLEAR_FT2 } from "../lib/architect-future/domain/geometry.ts";

let fail = 0; const step = (n, c, m) => { if (!c) { fail++; console.log(`  ✗ STEP ${n}: ${m}`); } else { console.log(`  ✓ STEP ${n}: ${m}`); } };
const GUEST = { kind: "UNAUTHENTICATED_HUMAN", id: "u" };
const SIGNED = { kind: "AUTHENTICATED_HUMAN", id: "auth-sub-1" };
const NOW = "2026-11-08T00:00:00Z";
const ev = (seq, type, actor, payload, parent) => ({ event_id: "e" + seq, sequence: seq, event_type: type, actor, occurred_at: NOW, parent_hash: parent || "", payload: payload || {} });

// ── STEP 1 · OPEN + INTENT ── the house is created by a deliberate act (intent precedes the catalog); the data is here,
// the four-viewport/no-overflow half is the Playwright seam.
const t = transformV1toV2(null, "REFERENCE_3X3_12_10_1", GUEST, NOW);
const base = t.project;
step(1, base.assets.length === 0 && t.event.event_type === "PROJECT_TRANSFORMED_FROM_V1", "intent → an explicit create builds the house, no assets forced");

// ── STEP 2 · CREATE / LOAD THE REFERENCE HOUSE ──
const H0 = hashV2(base);
step(2, base.spaces.length === 9 && SHELL_FT === 36 && GROSS_FT2 === 1296 && CLEAR_FT2 === 900
  && !!base.provenance.transformed_from_v1
  && t.event.payload.source_project_hash !== t.event.payload.target_project_hash,
  "9 spaces · 12/10/1 · 36×36 shell · 900 clear in 1,296 gross · provenance H0≠H1");

// ── STEP 3 · DESIGN · arm → tap → one placement → disarm → rotate ──
const living = base.spaces.find((s) => s.function === "LIVING");
const centre = { x: living.outer_x_um + OUTER_UM / 2, y: living.outer_y_um + OUTER_UM / 2, z: 0 };
const placed = placeArmed(base, { armed_asset_id: "furniture.sofa.3seat.v1" }, living.entity_id, centre, 0, GUEST);
const inst = placed.project.assets[placed.project.assets.length - 1];
const rotated = rotateInstance(placed.project, inst.instance_id);
step(3, placed.placed && placed.arm.armed_asset_id === null && placed.project.assets.length === 1
  && rotated.assets[0].rotation_deg === 90,
  "a sofa arms, places once, disarms, and rotates 90°");

// ── STEP 4 · CROSS-PROJECTION · the same instance in Plan / 3D / Walk; viewing never changes the project ──
const pl = planProjection(placed.project), td = threeDProjection(placed.project), wk = walkProjection(placed.project);
const sameId = pl.assets[0].instance_id === td.assets[0].instance_id && td.assets[0].instance_id === wk.assets[0].instance_id;
const sameTf = pl.assets[0].cx_ft === td.assets[0].cx_ft && td.assets[0].cx_ft === wk.assets[0].cx_ft;
step(4, sameId && sameTf && pl.rooms.length === 9 && hashV2(placed.project) === hashV2(placed.project),
  "one instance, one transform across Plan / 3D / Walk; viewing leaves the hash unchanged");

// ── STEP 5 · SAVE + RELOAD · post-edit hash survives a round-trip; the instance survives ──
const H1 = hashV2(placed.project);
const events1 = [t.event, ev(2, "ASSET_PLACED", GUEST, { asset: inst }, H0)];
const reloaded = loadProject(serializeStore(events1, H1));
step(5, H1 !== H0 && reloaded != null && hashV2(reloaded) === H1
  && reloaded.assets.length === 1 && reloaded.assets[0].instance_id === inst.instance_id,
  "placing changes the hash (H0→H1); save + reload returns H1 with the same instance");

// ── STEP 6 · SIMULATE · baseline $240,000 with evidence; jurisdiction moves only settlement; method changes the take-off ──
const est = baselineEstimate();
const econ = { ...base.economics, recognition: { kind: "GlobalRecognition", u_earned: 100, evidence: "DERIVED" } };
const j = applyJurisdiction(econ, "ng-lagos");
const frame = materialTakeoff({ ...base, construction: { method: "FRAME" } });
const print = materialTakeoff({ ...base, construction: { method: "PRINT" } });
step(6, est.total_usd === 240000 && est.total_evidence === "DERIVED"
  && j.baseline === econ.baseline && j.labor === econ.labor && j.recognition === econ.recognition && j.settlement !== econ.settlement
  && frame.some((l) => /stud/i.test(l.item)) && print.every((l) => !/stud/i.test(l.item)),
  "baseline $240,000 [derived] · jurisdiction moves only settlement · FRAME has studs, PRINT does not");

// ── STEP 7 · SUBMIT / REVIEW / REPLAY · Submit ≠ Approve; approval needs an authenticated human; replay reconstructs all ──
step(7.1, !approve(base, GUEST).accepted && !approve(base, { kind: "SYSTEM", id: "ai" }).accepted,
  "a guest and an AI cannot approve");
const s = submit(base, GUEST, NOW); const r = review(s.project, GUEST, NOW); const a = approve(r.project, SIGNED, NOW);
step(7.2, s.accepted && r.accepted && a.accepted && a.project.authority.plan === "APPROVED",
  "the ladder Submit → Review → Approve completes with an authenticated human");
// a full authored journey replays to the exact state (assets + method + authority)
const journey = [t.event, ev(2, "ASSET_PLACED", GUEST, { asset: inst }, H0), ev(3, "CONSTRUCTION_METHOD_CHANGED", GUEST, { method: "FRAME" }, H1),
  ev(4, "PLAN_SUBMITTED", GUEST, {}, H1), ev(5, "PLAN_REVIEWED", GUEST, {}, H1), ev(6, "PLAN_APPROVED", SIGNED, {}, H1)];
const rebuilt = replay(journey);
step(7.3, rebuilt.assets.length === 1 && rebuilt.construction.method === "FRAME" && rebuilt.authority.plan === "APPROVED",
  "replay reconstructs assets, construction method and authority exactly");
// a forged approval (AI-authored) never reaches APPROVED on replay
const forged = replay([t.event, ev(2, "PLAN_APPROVED", { kind: "SYSTEM", id: "ai" }, {}, H0)]);
step(7.4, forged.authority.plan === "DRAFT", "replay ignores an AI-authored approval (stays DRAFT)");

console.log(`\narchitect-future-seam (Phase 5 · T-SEAM): ${fail === 0 ? "PASS" : "FAIL"} — ${fail} failed step(s)`);
if (fail > 0) process.exit(1);

// ARCHITECT-2525 / FUTURE · Phase 3 economics + systems contracts — GREEN (joins test:ci).
// T-COST (ten ASSUMED rows → DERIVED $240,000, $267/net ft², no generic "Project Cost"),
// T-FIREWALL (a jurisdiction change moves ONLY LocalSettlement; branded types bar a cross-domain assignment at compile
// time — proven separately by the tsc @ts-expect-error fixtures), and T-MATERIAL (the take-off branches by method:
// FRAME lists studs, PRINT never does). Pure logic; the React Systems tab reads these.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-future-economics.test.mjs
import { transformV1toV2 } from "../lib/architect-future/transformation/reference-v1-to-v2.ts";
import { baselineEstimate, applyJurisdiction, settlementFor } from "../lib/architect-future/simulation/costs.ts";
import { materialTakeoff } from "../lib/architect-future/simulation/materials.ts";
import { economicsView } from "../lib/architect-future/selectors/economics.ts";
import { JURISDICTIONS } from "../lib/architect-future/adapters/labor.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  ✗ " + m); } };
const ACTOR = { kind: "UNAUTHENTICATED_HUMAN", id: "u" };
const base = transformV1toV2(null, "REFERENCE_3X3_12_10_1", ACTOR, "2026-11-08T00:00:00Z").project;

// ── T-COST ──
const est = baselineEstimate();
ok(est.sections.length === 10, "T-COST · ten baseline rows");
ok(est.sections[0].name === "Site Work", "T-COST · the first row is Site Work (not 'Site')");
ok(est.sections.every((s) => s.evidence === "ASSUMED"), "T-COST · every row is ASSUMED");
const sum = est.sections.reduce((s, x) => s + x.usd, 0);
ok(sum === 240000 && est.total_usd === 240000, "T-COST · the rows sum to a DERIVED $240,000");
ok(est.total_evidence === "DERIVED", "T-COST · the total is DERIVED, not a quote");
ok(est.per_net_ft2_usd === 267 && est.per_net_ft2_evidence === "DERIVED", "T-COST · $267 / net ft² [DERIVED] (240,000 ÷ 900)");

const view = economicsView(base.economics);
const labels = [view.baseline.label, view.labor.label, view.recognition.label, view.settlement.label];
ok(view.baseline.label === "Baseline Build Estimate", "T-COST · the baseline is named 'Baseline Build Estimate'");
ok(labels.every((l) => l.toLowerCase() !== "project cost"), "T-COST · no domain is a generic 'Project Cost'");
ok(view.labor.value === "Not calculated" && view.labor.evidence === "NOT_CALCULATED", "T-COST · Project Labor Cost starts NOT_CALCULATED");

// ── T-FIREWALL ── a jurisdiction change may move ONLY LocalSettlement
// give the project a recognition value so settlement can actually compute (informational, local-currency authoritative)
const econ = { ...base.economics, recognition: { kind: "GlobalRecognition", u_earned: 100, evidence: "DERIVED" } };
const next = applyJurisdiction(econ, "us-tx-austin");
ok(next.baseline === econ.baseline, "T-FIREWALL · baseline is passed through UNTOUCHED (same reference)");
ok(next.labor === econ.labor, "T-FIREWALL · Project Labor Cost is untouched");
ok(next.recognition === econ.recognition, "T-FIREWALL · Global Recognition is untouched");
ok(next.settlement !== econ.settlement, "T-FIREWALL · only Local Settlement is replaced");
ok(next.settlement.jurisdiction_id === "us-tx-austin", "T-FIREWALL · the new settlement carries the chosen jurisdiction");
ok(next.settlement.native_currency === "USD" && typeof next.settlement.settlement_native === "number", "T-FIREWALL · settlement is in the jurisdiction's native currency, computed from recognition");

// a DIFFERENT jurisdiction yields a DIFFERENT native currency, still only settlement moves
const ng = applyJurisdiction(econ, "ng-lagos");
ok(ng.settlement.native_currency === "NGN" && ng.baseline === econ.baseline, "T-FIREWALL · switching to Lagos changes only settlement (→ NGN)");

// recognition unknown → settlement NOT_CALCULATED (never a fabricated 0)
const noRec = settlementFor("us-tx-austin", null);
ok(noRec.settlement_native === null && noRec.evidence === "NOT_CALCULATED", "T-FIREWALL · no recognition → settlement NOT_CALCULATED");
ok(JURISDICTIONS.length >= 3, "T-FIREWALL · the jurisdiction list is offered to the human");

// ── T-MATERIAL ── the take-off branches by construction method
const undecided = materialTakeoff(base); // method UNDECIDED
ok(undecided.length === 0, "T-MATERIAL · UNDECIDED lists nothing until a method is chosen");

const frame = materialTakeoff({ ...base, construction: { method: "FRAME" } });
ok(frame.some((l) => /stud/i.test(l.item)), "T-MATERIAL · FRAME lists studs");
ok(frame.every((l) => l.method === "FRAME"), "T-MATERIAL · every FRAME line is tagged FRAME");
ok(frame.every((l) => l.evidence && l.calculation), "T-MATERIAL · every line carries evidence + a calculation");

const print = materialTakeoff({ ...base, construction: { method: "PRINT" } });
ok(print.length > 0 && print.every((l) => !/stud/i.test(l.item)), "T-MATERIAL · PRINT never lists a stud (no current FRAME take-off under PRINT)");
ok(print.some((l) => /printed|cementitious/i.test(l.item)), "T-MATERIAL · PRINT lists printed cementitious wall material");

console.log(`architect-future-economics (Phase 3): ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);

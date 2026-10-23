// ARC-37.03 — the hermetic edit contract (no browser, in test:ci once green): select Space → edge / function /
// wet edit → AI PROPOSED IMPACT preview (no revision) → ACCEPT (one revision) / HOLD (keep, write nothing) /
// REJECT (clear, write nothing); a HELD preview whose base advanced is INVALIDATED (green-but-false closed);
// and a SOURCE SCAN that architect-design.tsx's accept path no longer calls the legacy mutators.
// TEST-FIRST: the source scan is RED until the Block-D UI wiring severs the legacy path; not wired into test:ci
// until green (like the completion loop was through Block C).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-edit.test.mjs
import { readFileSync } from "node:fs";
import { buildProjectFromSeed, buildR0Snapshot } from "../lib/architect-2525/canonical/runtime.ts";
import { projectHash } from "../lib/architect-2525/canonical/serialize.ts";
import { initRCore, headRevision } from "../lib/architect-2525/canonical/rcore.ts";
import { proposeEdgeEdit, proposeAttrEdit, acceptEdit, holdEdit, rejectEdit } from "../lib/architect-2525/canonical/runtime-edit.ts";
import { TINY_HOME_V1 } from "../lib/architect-2525/seeds/tiny-home-v1.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };
const throws = (fn, re, m) => { let e = null; try { fn(); } catch (x) { e = x; } ok(e && (!re || re.test(e.message)), m + (e ? "" : " (did not throw)")); };
const HI = { actor_id: "HI", actor_role: "HI" };
const space = (p, bay) => p.entities.find((e) => e.bay_code === bay);

const r0 = buildProjectFromSeed(TINY_HOME_V1);
let rc = initRCore(buildR0Snapshot(r0));
const h0 = projectHash(r0);

// ── PROPOSED shows the impact but commits NOTHING ──
const prev = proposeEdgeEdit(r0, { bay_code: "C1", edge: "WEST", deltaUm: 304800 });
ok(prev.ok && prev.preview.status === "PROPOSED", "edge edit → a PROPOSED preview");
ok(rc.events.length === 0 && projectHash(r0) === h0, "a preview commits no revision and mutates nothing");

// ── ACCEPT → exactly one revision; plan_state stays REVIEWABLE (ACCEPT ≠ plan approval) ──
const a1 = acceptEdit(r0, rc, prev.preview, HI);
ok(a1.project.current_revision_id === "R1" && a1.rcore.events.length === 1, "ACCEPT → exactly one revision R1");
ok(a1.project.plan_state === "REVIEWABLE", "after an edit ACCEPT, plan_state is REVIEWABLE (never HI_APPROVED)");

// ── HOLD keeps the preview, REJECT clears it — both write nothing ──
const held = holdEdit(prev.preview);
ok(held.status === "HELD" && held.proposed_change, "HOLD keeps the live preview");
const cleared = rejectEdit();
ok(cleared.status === "CLEARED" && cleared.proposed_change === null, "REJECT clears the viewport");
ok(headRevision(rc) === "R0" && rc.events.length === 0 && projectHash(r0) === h0, "HOLD/REJECT leave R-CORE and the project untouched (the base rcore never advanced)");

// ── green-but-false closed: a HELD preview whose base advanced is INVALIDATED, not silently applied ──
let rc2 = initRCore(buildR0Snapshot(r0));
const stale = proposeEdgeEdit(r0, { bay_code: "C1", edge: "WEST", deltaUm: 304800 }); // built against R0
const adv = acceptEdit(r0, rc2, proposeEdgeEdit(r0, { bay_code: "B2", edge: "EAST", deltaUm: 304800 }).preview, HI); // head → R1
throws(() => acceptEdit(adv.project, adv.rcore, stale.preview, HI), /out of date/i, "a stale-base HELD preview is INVALIDATED on ACCEPT (no silent apply against the advanced base)");
ok(adv.rcore.events.length === 1, "the stale ACCEPT added no revision");

// ── function edit → FUNCTION_CHANGE revision; wet edit → WET_CHANGE revision ──
let rc3 = initRCore(buildR0Snapshot(r0));
const pf = proposeAttrEdit(r0, { bay_code: "A3", function: "OFFICE" });
ok(pf.ok && pf.preview.proposed_change.kind === "attr", "a function change → an attr preview");
const af = acceptEdit(r0, rc3, pf.preview, HI);
ok(space(af.project, "A3").function === "OFFICE" && af.rcore.events[0].event_type === "FUNCTION_CHANGE", "ACCEPT a function change → the Space function updates, event_type FUNCTION_CHANGE");
const pw = proposeAttrEdit(af.project, { bay_code: "A3", wet_class: "WET" });
const aw = acceptEdit(af.project, af.rcore, pw.preview, HI);
ok(space(aw.project, "A3").wet_class === "WET" && aw.rcore.events[1].event_type === "WET_CHANGE", "ACCEPT a wet-class change → the Space wet_class updates, event_type WET_CHANGE");
const bad = proposeAttrEdit(r0, { bay_code: "A3", function: "BALLROOM" });
ok(!bad.ok && /unknown function/i.test(bad.reason), "an unknown function is refused (ok:false)");

// ── SOURCE SCAN: architect-design.tsx's accept path no longer calls the legacy mutators (TEST-FIRST: red until wired) ──
const design = readFileSync(new URL("../components/architect-2525/architect-design.tsx", import.meta.url), "utf8");
const legacyCalls = (design.match(/\b(moveRoomInLayout|resizeRoomInLayout)\s*\(/g) || []).length;
ok(legacyCalls === 0, `architect-design.tsx accept path calls the legacy mutators ${legacyCalls} time(s) — must be 0 (rewired to the canonical runtime). TEST-FIRST red until Block-D UI wiring.`);

console.log(`\narchitect-edit: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

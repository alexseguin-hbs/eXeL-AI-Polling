// SensorFusion-2525 correction binding (MoT decision B, migration 054).
// A member cannot file a correction under someone else's name, and self-review is refused regardless of case.
// The database proof is supabase/tests/054_sensor_fusion_correction_binding.sim.sql (SIMULATED seats, rolled back).
// Run: node --experimental-strip-types --experimental-loader ./tests/ts-alias-loader.mjs tests/sensor-fusion-binding.test.mjs
import fs from "node:fs";
import path from "node:path";
import { authorizeReviewer, correctionInsertRow, level2Decision, requireMemberSession } from "../lib/sensor-fusion/collab.ts";
import { sameMember, acceptMark } from "../lib/sensor-fusion/workflow.ts";

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else {
    fail++;
    console.error("FAIL:", msg);
  }
}

const root = path.resolve(import.meta.dirname, "../..");
const sql = fs.readFileSync(path.join(root, "supabase/migrations/054_sensor_fusion_correction_binding.sql"), "utf8");
const sim = fs.readFileSync(path.join(root, "supabase/tests/054_sensor_fusion_correction_binding.sim.sql"), "utf8");
const old044 = fs.readFileSync(path.join(root, "supabase/migrations/044_sensor_fusion_collab_progress.sql"), "utf8");
const code = sql.replace(/^\s*--.*$/gm, "");

// --- Numbering: the binding migration must not collide with another migration number.
const migDir = path.join(root, "supabase/migrations");
const sameNumber = fs.readdirSync(migDir).filter((f) => f.startsWith("054_"));
ok(sameNumber.length === 1 && sameNumber[0] === "054_sensor_fusion_correction_binding.sql", "054 is used by the binding migration only (main already has two 053s)");

// --- Additive only: nothing from 040-045 is dropped or rewritten.
ok(!/\bDROP\s+(TABLE|COLUMN|CONSTRAINT|FUNCTION)\b/i.test(code), "054 drops no table, column, constraint, or function");
ok(!/ALTER\s+TABLE[^;]*\bDROP\b/i.test(code), "054 has no ALTER TABLE ... DROP");
ok(!/DROP POLICY IF EXISTS "Members append corrections in their project"/.test(code), "054 keeps the 044 membership policy");
ok((code.match(/DROP POLICY IF EXISTS "([^"]+)"/g) || []).every((m) => m.includes("Corrections are filed as the signed-in member")), "054 only re-creates its own policy (idempotent)");
ok(/ADD COLUMN IF NOT EXISTS corrected_by_uid UUID DEFAULT auth\.uid\(\)/.test(code), "corrections gain corrected_by_uid defaulting to auth.uid()");
ok(/ADD COLUMN IF NOT EXISTS inserted_by_uid UUID DEFAULT auth\.uid\(\)/.test(code), "labels gain inserted_by_uid provenance");
ok(/ADD COLUMN IF NOT EXISTS display_name TEXT/.test(code), "seats gain a server-set display_name");
ok(/CREATE UNIQUE INDEX IF NOT EXISTS sensor_fusion_members_display_key[\s\S]*sensor_fusion_member_key\(display_name\)/.test(code), "two seats cannot share a name in any case");

// --- Binding to the signed-in member.
ok(/AS RESTRICTIVE\s+FOR INSERT\s+TO authenticated\s+WITH CHECK \(corrected_by_uid = auth\.uid\(\)\)/.test(code), "RESTRICTIVE insert policy binds corrected_by_uid to auth.uid()");
ok(/NEW\.corrected_by_uid := me;/.test(code), "trigger overwrites a client-supplied uid with the caller");
ok(/sensor_fusion_member_key\(NEW\.corrected_by\) <> public\.sensor_fusion_member_key\(seat_name\)/.test(code), "trigger refuses a name that is not the caller's seat name");
ok(/NEW\.corrected_by := seat_name;/.test(code), "stored corrected_by is the canonical seat name");
ok(/IF seat_name IS NULL THEN\s+RAISE EXCEPTION/.test(code), "fails closed when the caller has no named seat");
ok(/NEW\.labeled_by := label_by;/.test(code), "labeled_by comes from the label row, so omitting it cannot skip independence");
ok(/label_project IS DISTINCT FROM NEW\.project_id/.test(code), "a label from another project cannot be corrected");
ok(/BEFORE INSERT ON public\.sensor_fusion_label_corrections/.test(code), "binding trigger runs before insert");
ok(/SECURITY INVOKER/.test(code) && !/SECURITY DEFINER/.test(code), "new functions are SECURITY INVOKER (no new definer surface)");
ok((code.match(/SET search_path =/g) || []).length >= 3, "every new function pins search_path");
ok(/REVOKE ALL ON FUNCTION public\.sensor_fusion_member_key\(TEXT\) FROM anon/.test(code), "anon cannot execute the key function");

// --- Case-insensitive independence on both tables.
ok(/sensor_fusion_correction_independent_ci[\s\S]*sensor_fusion_member_key\(corrected_by\) <> public\.sensor_fusion_member_key\(labeled_by\)/.test(code), "corrections independence ignores case/spacing");
ok(/sensor_fusion_labels_independent_reviewer_ci[\s\S]*sensor_fusion_member_key\(reviewed_by\) <> public\.sensor_fusion_member_key\(labeled_by\)/.test(code), "label review independence ignores case/spacing");
ok(/corrected_by IS DISTINCT FROM labeled_by/.test(old044), "044 had the case-sensitive check this fixes (history preserved)");

// --- SQL key function mirrors the client memberName() exactly. Re-implement the SQL steps in JS and compare.
function sqlKey(raw) {
  const up = (raw ?? "guest").toUpperCase();
  const kept = up.replace(/[^A-Z0-9 ._-]/g, "").replace(/\s+/g, " ").trim();
  return kept || "GUEST";
}
ok(/upper\(COALESCE\(raw, 'guest'\)\), '\[\^A-Z0-9 \._-\]', '', 'g'\), '\\s\+', ' ', 'g'\)/.test(code), "SQL key uses the same upper/strip/collapse steps as memberName()");
const names = ["Alex", "alex", "ALEX ", "  a l e x", "Al ex", "Jordan", "jordan.r", "J-O_R.D", "", "guest", "Guest", "Zoë", "Ann\tLee", "ann  lee", "O'Neil", "oneil", "Sim Tester A", "SIM  tester a"];
for (const x of names) for (const y of names) {
  ok(sameMember(x, y) === (sqlKey(x) === sqlKey(y)), `client sameMember and SQL key agree for ${JSON.stringify(x)} vs ${JSON.stringify(y)}`);
}

// --- Client: self-review refused regardless of case or spacing.
for (const [labeler, reviewer] of [["Alex", "alex"], ["Alex", "ALEX"], ["Alex", "  aLeX  "], ["Ann Lee", "ann   lee"], ["J.R", "j.r"]]) {
  const gate = authorizeReviewer(labeler, reviewer);
  ok(gate.ok === false, `authorizeReviewer refuses ${JSON.stringify(labeler)} reviewing as ${JSON.stringify(reviewer)}`);
  const decision = level2Decision({ labeler, reviewer, kind: "adjust", from: { left: 1 }, to: { left: 2 }, at: "t" });
  ok(decision.ok === false, `level2Decision refuses ${JSON.stringify(reviewer)} adjusting ${JSON.stringify(labeler)}`);
  let threw = false;
  try {
    correctionInsertRow({ owner: "uid-a", projectId: "p", pictureId: "x", event: { at: "t", by: reviewer, kind: "reject", from: {}, to: {} }, labeledBy: labeler });
  } catch {
    threw = true;
  }
  ok(threw, `correctionInsertRow refuses ${JSON.stringify(reviewer)} correcting ${JSON.stringify(labeler)}`);
  const accepted = acceptMark({ id: "b", name: "deer", left: 0, top: 0, right: 1, bottom: 1, level: 1, by: labeler }, reviewer, "t");
  ok(accepted.ok === false, `acceptMark refuses ${JSON.stringify(reviewer)} accepting ${JSON.stringify(labeler)}'s box`);
}
ok(authorizeReviewer("Alex", "Jordan").ok === true, "an independent reviewer is still allowed (capability preserved)");

// --- Client row carries the signed-in uid; local box ids never reach the UUID column.
const gated = requireMemberSession({ user: { id: "0b6c7d1e-1111-4222-8333-944455556666" } });
ok(gated.ok === true, "member session gate passes with a user id");
const row = correctionInsertRow({
  owner: gated.owner,
  projectId: "sensor-fusion",
  pictureId: "deer_0008.png",
  labelId: "deer_0008.png-0",
  event: { at: "t", by: "Jordan", kind: "adjust", from: { left: 1 }, to: { left: 2 } },
  labeledBy: "Alex",
});
ok(row.corrected_by_uid === gated.owner, "correction row carries corrected_by_uid = signed-in uid");
ok(row.label_id === null, "a device-local box id is not sent as label_id (would fail the UUID column)");
const row2 = correctionInsertRow({
  owner: gated.owner,
  projectId: "sensor-fusion",
  pictureId: "deer_0008.png",
  labelId: "7d3f0c52-9a7e-4c1b-8f00-1234567890ab",
  event: { at: "t", by: "Jordan", kind: "adjust", from: {}, to: {} },
  labeledBy: "Alex",
});
ok(row2.label_id === "7d3f0c52-9a7e-4c1b-8f00-1234567890ab", "a real label UUID is kept");

// --- The simulated DB proof covers every refusal and rolls back.
for (const tag of ["dup-seat-name", "spoof-name", "uid-bound+independent-allowed", "self-review-case", "label-self-review-case", "non-member", "server-case"]) {
  ok(sim.includes(`ok:${tag}`), `simulated DB proof covers ${tag}`);
}
ok(/RAISE EXCEPTION 'SIM054 RESULT/.test(sim), "simulated DB proof always rolls back (ends in RAISE)");
ok(/SIMULATED/.test(sim) && !/INSERT INTO auth\.users/i.test(sim), "simulated proof is labeled and invents no auth users");

console.log(`sensor-fusion-binding: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

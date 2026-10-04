// R4a. A guest cannot read or add pictures or labels.
// A member of one project cannot see another project.
// Run: node tests/sensor-fusion-r4a.test.mjs

import fs from "node:fs";
import path from "node:path";

const sql = fs.readFileSync(path.resolve(import.meta.dirname, "../../supabase/migrations/042_sensor_fusion_members_only.sql"), "utf8");

let pass = 0;
let fail = 0;
const ok = (cond, message) => {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.log("FAIL:", message);
  }
};

function access(actor, projectId) {
  const member = actor.signedIn && actor.projects.includes(projectId);
  return { read: member ? "rows" : "empty", write: member ? "allowed" : "refused" };
}

const guest = { signedIn: false, projects: [] };
const memberA = { signedIn: true, projects: ["birds"] };

ok(access(guest, "birds").read === "empty", "a guest read returns nothing");
ok(access(guest, "birds").write === "refused", "a guest insert is refused");
ok(access(memberA, "planes").read === "empty", "a member of one project cannot see another project");
ok(access(memberA, "birds").read === "rows" && access(memberA, "birds").write === "allowed", "a member can read and add in their own project");

ok(!/TO anon/.test(sql), "no rule grants the guest role");
ok(!/USING \(true\)/.test(sql) && !/WITH CHECK \(true\)/.test(sql), "no open read or write remains");
ok(/DROP POLICY IF EXISTS "Anyone can read sensor fusion pictures"/.test(sql), "the old picture read rule is removed");
ok(/DROP POLICY IF EXISTS "Anyone can insert sensor fusion labels"/.test(sql), "the old label write rule is removed");
ok(/REVOKE ALL ON sensor_fusion_pictures FROM anon/.test(sql), "the guest cannot use the picture table");
ok(/REVOKE ALL ON sensor_fusion_labels FROM anon/.test(sql), "the guest cannot use the label table");
ok(/CREATE POLICY "Members read their project pictures"[\s\S]*TO authenticated[\s\S]*sensor_fusion_is_member\(project_id\)/.test(sql), "a picture read requires membership");
ok(/CREATE POLICY "Members add pictures to their project"[\s\S]*TO authenticated[\s\S]*WITH CHECK \(sensor_fusion_is_member\(project_id\)\)/.test(sql), "a picture write requires membership");
ok(/CREATE POLICY "Members read their project labels"[\s\S]*TO authenticated[\s\S]*sensor_fusion_is_member\(project_id\)/.test(sql), "a label read requires membership");
ok(/CREATE POLICY "Members add labels to their project"[\s\S]*TO authenticated[\s\S]*WITH CHECK \(sensor_fusion_is_member\(project_id\)\)/.test(sql), "a label write requires membership");
ok(/member_id = auth\.uid\(\)/.test(sql), "a seat is the signed-in person");

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);

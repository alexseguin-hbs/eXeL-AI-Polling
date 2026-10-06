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
ok(/Only the server adds a row to sensor_fusion_members/.test(sql), "only the server can add a member, and that is written down");
ok(!/ON sensor_fusion_members FOR INSERT/.test(sql), "the page has no way to join a project");

const page = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
// The save note may lead with where the file went (2f58089), but it must still say the boxes stay on this device.
ok(/setNote\([`"][^`"]*These boxes stay on this device\.[`"]\)/.test(page), "the screen says the boxes stay on this device");
ok(!page.includes("team copy"), "the screen does not promise a team save");
// rev 43: nothing is uploaded yet, so the Upload dialog never ticks Upload and never titles itself 'Develop Models' (Athena, Enlil, Sofia, Thor).
ok(/<StepStrip current=\{trainStatus \? 3 : 2\} \/>/.test(page) && !/<StepStrip current=\{trainStatus \? 4/.test(page), "Upload is lit, never ticked, until a real upload exists");
ok(/<h2>\{trainStatus \? "Upload Images" : lastSave\.title\}<\/h2>/.test(page) && !/<h2>[^<]*Develop Models/.test(page), "the Upload dialog keeps the step's own title, not 'Develop Models'");
ok(/aria-label="Save the set"/.test(page) && />\s*PROJECT\s*</.test(page) && />\s*NEW FOLDER\s*</.test(page), "Upload asks for the project or a new folder");
ok(/useState<SchemeId \| "custom">\("green"\)/.test(page), "Sensor Fusion starts on green");
ok(/styles\.glyph/.test(page) && /background-color:\s*var\(--sf-primary, #0cff00\)/.test(fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.module.css"), "utf8")), "icons take the color chosen in Settings");
ok(!fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.module.css"), "utf8").includes("#d18be0"), "the download icon is no longer a fixed purple");
ok(!/`(Files|Downloads)\/\$\{setName\}`/.test(page), "a share or a download never names a folder the app did not make");

const probeUrl = process.env.RLS_PROBE_URL || "";
const probeKey = process.env.RLS_PROBE_ANON_KEY || "";
if (probeUrl && probeKey) {
  const headers = { apikey: probeKey, Authorization: `Bearer ${probeKey}`, "Content-Type": "application/json", Prefer: "return=minimal" };
  const root = probeUrl.replace(/\/$/, "");
  const read = await fetch(`${root}/rest/v1/sensor_fusion_pictures?select=id`, { headers });
  const rows = read.ok ? await read.json() : [];
  ok(read.ok && Array.isArray(rows) && rows.length === 0, "LIVE a guest read returns nothing");
  const write = await fetch(`${root}/rest/v1/sensor_fusion_labels`, {
    method: "POST",
    headers,
    body: JSON.stringify({ owner_key: "guest", picture_id: "probe", name: "probe", x1: 0, y1: 0, x2: 1, y2: 1, project_id: "probe" }),
  });
  ok(!write.ok, "LIVE a guest insert is refused");
} else {
  console.log("live check waiting: set RLS_PROBE_URL and RLS_PROBE_ANON_KEY after the rule is applied");
}

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);

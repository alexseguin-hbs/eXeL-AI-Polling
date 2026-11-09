// SensorFusion class reuse / did-you-mean (CRS-08.04–08.05). Migration 059.
import fs from "node:fs";
import path from "node:path";
import { classNameKey, editDistance, resolveClassInput, suggestClasses } from "../lib/sensor-fusion/classes.ts";

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error("FAIL:", msg); }
}

const root = path.resolve(import.meta.dirname, "../..");
const sql = fs.readFileSync(path.join(root, "supabase/migrations/059_sensor_fusion_anon_heart_trace.sql"), "utf8");
const sim = fs.readFileSync(path.join(root, "supabase/tests/059_sensor_fusion_anon_heart_trace.sim.sql"), "utf8");
const code = sql.replace(/^\s*--.*$/gm, "");

ok(!/\bDROP\s+(TABLE|COLUMN)\b/i.test(code), "059 drops no table/column");
ok(/sensor_fusion_classes/.test(code) && /sensor_fusion_work_events/.test(code), "059 creates classes + work_events");
ok(/sensor_fusion_join_seat/.test(code), "059 has join seat RPC");
ok(/sensor_fusion_resolve_class/.test(code), "059 has resolve class RPC");
ok(/sensor_fusion_merge_class/.test(code), "059 has merge class RPC");
ok(/AS RESTRICTIVE[\s\S]*actor_uid = auth\.uid\(\)/.test(code), "work events RESTRICTIVE bind to auth.uid()");
ok(/NEW\.delta_human := 0/.test(code), "trigger forces 웃=0 (CRS-25.02)");
ok(/is_anonymous BOOLEAN NOT NULL DEFAULT false/.test(code), "members gain is_anonymous");
ok(/SIM059 RESULT/.test(sim), "sim harness present");

// normalize: deer head / Deer Head / deer-head / deer_head → same key
const variants = ["deer head", "Deer Head", "deer-head", "deer_head", "DEER  HEAD", "DeerHead"];
const keys = variants.map(classNameKey);
ok(keys.every((k) => k === keys[0]), `variants share key (${keys[0]}): ${keys.join(",")}`);
ok(classNameKey("cars") === classNameKey("car") || classNameKey("cars") === "car", "naive plural cars→car");
ok(classNameKey("dogs") === "dog", "dogs→dog");
ok(editDistance("deerhead", "deerhead") === 0, "distance 0 identical");
ok(editDistance("deerhead", "dearhead") === 1, "distance 1 typo");

const classes = [
  { class_id: "1", project_id: "p", canonical_name: "Deer Head", name_key: classNameKey("Deer Head"), use_count: 5 },
  { class_id: "2", project_id: "p", canonical_name: "car", name_key: classNameKey("car"), use_count: 9 },
  { class_id: "3", project_id: "p", canonical_name: "dog", name_key: classNameKey("dog"), use_count: 2 },
];

ok(resolveClassInput("deer-head", classes).kind === "exact", "exact reuse deer-head");
ok(resolveClassInput("Deer Head", classes).kind === "exact", "exact reuse Deer Head");
const near = resolveClassInput("dear head", classes);
ok(near.kind === "near" && near.match.canonical_name === "Deer Head", "did-you-mean dear head → Deer Head");
ok(resolveClassInput("bicycle", classes).kind === "new", "new class bicycle");

const suggestions = suggestClasses("de", classes);
ok(suggestions[0]?.canonical_name === "Deer Head", "suggest de → Deer Head");
const byUse = suggestClasses("", classes);
ok(byUse[0]?.canonical_name === "car", "empty query most-used first (car)");

console.log(`sensor-fusion-classes: pass=${pass} fail=${fail}`);
if (fail) process.exit(1);

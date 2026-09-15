// ONE MODEL → FOUR ENGINES, proven on geometry nobody in this process invented.
// The reference X-BAT wireframe is hand-written four times (py/obj/cs/cpp). We carry its OBJ into the
// canonical model and round-trip it: every segment and the sha256 must survive model → .obj → parsed again.
// If the exporter ever lies, this goes red on a real airframe.
//   node tests/wire-export.test.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const ROOT = path.resolve(process.cwd(), "..");
const { exportAll, canonicalHash, canonicalSegments } = await import(`file://${ROOT}/scripts/wire-export.mjs`);
const { parseLineObj } = await import(`file://${ROOT}/scripts/wire-xbat-model.mjs`);
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const MODEL_PATH = path.join(ROOT, "docs/security-2525/xbat-wireframe/xbat.wire.json");
ok(fs.existsSync(MODEL_PATH), "the X-BAT model is carried in the repo");
const model = JSON.parse(fs.readFileSync(MODEL_PATH, "utf8"));
const files = exportAll(model);

// ── the hand-written source, and the two degenerate segments it actually contains ──
const srcObj = fs.readFileSync(path.join(ROOT, "docs/security-2525/xbat-wireframe/xbat_3rdpass_wireframe.obj"), "utf8");
const src = parseLineObj(srcObj);
ok(src.rawEdges === 1757 && src.edges.length === 1755,
   `the hand-written OBJ declares 1757 segments; 2 have identical endpoints and are dropped (kept ${src.edges.length})`);
ok(model.edges.length === src.edges.length, `the model carries every real segment (${model.edges.length})`);

// ── ROUND TRIP: model → .obj → parsed → the same geometry, the same hash ──
const objOut = files["xbat.obj"];
const back = parseLineObj(objOut);
const backModel = { vertices: back.vertices, edges: back.edges };
ok(back.edges.length === model.edges.length, `re-parsed .obj has the same segment count (${back.edges.length})`);
ok(canonicalHash(backModel) === canonicalHash(model), "re-parsed .obj hashes IDENTICALLY to the model — the export is lossless");
const a = canonicalSegments(model), c = canonicalSegments(backModel);
ok(a.length === c.length && a.every((s, i) => s === c[i]), "every segment survives, endpoint for endpoint");

// ── the four targets agree on what they contain ──
const hash = JSON.parse(files["xbat.hash.json"]);
ok(hash.edges === model.edges.length && hash.vertices === model.vertices.length, "the manifest counts match the model");
ok(hash.sha256 === canonicalHash(model), "the manifest carries the model's hash");
for (const k of ["py", "obj", "unity", "unreal"]) ok(typeof hash.axisMap[k] === "string", `the axis map declares ${k} — a convention is never assumed`);
const count = (s, re) => (s.match(re) ?? []).length;
ok(count(files["xbat.obj"], /^l /gm) === model.edges.length, ".obj emits one l per segment");
ok(count(files["xbat.py"], /^    \(\(/gm) === model.edges.length, ".py emits one tuple per segment");
ok(count(files["xbat.cs"], /new\[\]\{ new Vector3/g) === model.edges.length, ".cs emits one Vector3 pair per segment");
ok(count(files["xbat.cpp"], /\{ FVector\(/g) === model.edges.length, ".cpp emits one FVector pair per segment");

// ── axis conversion is correct, not merely declared ──
// a point 1 m east, 2 m north, 3 m up
const probe = { meta: { ...model.meta, id: "probe" }, units: "m", frame: model.frame,
  vertices: [[0,0,0],[1,2,3]], edges: [[0,1]],
  groups: [{ id: "p", kind: "polyline", role: "blank", edge0: 0, edgeN: 1, lod: 0 }], overlays: [] };
const p = exportAll(probe);
ok(/^v 1\.000000 2\.000000 3\.000000$/m.test(p["probe.obj"]), "OBJ keeps ENU: X=east Y=north Z=up, metres");
ok(/new Vector3\(1\.000000f, 3\.000000f, 2\.000000f\)/.test(p["probe.cs"]), "Unity gets X=east, Y=up, Z=north (Y-up)");
ok(/FVector\(200\.000000f, 100\.000000f, 300\.000000f\)/.test(p["probe.cpp"]), "Unreal gets X=north, Y=east, Z=up in CENTIMETRES");

// ── determinism + the --check refusal ──
ok(JSON.stringify(exportAll(model)) === JSON.stringify(files), "exporting twice produces byte-identical output");
const tmp = fs.mkdtempSync("/tmp/wire-");
execFileSync("node", [path.join(ROOT, "scripts/wire-export.mjs"), MODEL_PATH, "--out", tmp], { stdio: "pipe" });
let checkOk = true; try { execFileSync("node", [path.join(ROOT, "scripts/wire-export.mjs"), MODEL_PATH, "--out", tmp, "--check"], { stdio: "pipe" }); } catch { checkOk = false; }
ok(checkOk, "--check passes against freshly written output");
fs.appendFileSync(path.join(tmp, "xbat.obj"), "\nl 1 2\n");
let refused = false; try { execFileSync("node", [path.join(ROOT, "scripts/wire-export.mjs"), MODEL_PATH, "--out", tmp, "--check"], { stdio: "pipe" }); } catch { refused = true; }
ok(refused, "--check REFUSES a hand-edited output — the model is the only place to edit");
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`wire-export: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);

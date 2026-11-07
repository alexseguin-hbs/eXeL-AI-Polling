// ARCHITECT-2525 · 3D ASSET BUILD DETERMINISM gate (Rev A). scripts/architect-assets-build.mjs compiles the authored
// compositions (lib/architect-2525/assets/compositions/) into .glb + metadata.json + plan.svg + a manifest entry
// through the pure in-repo GLB writer. Proves: the build is DETERMINISTIC (two runs into two fresh trees seeded with the
// served manifest → byte-identical outputs; a second run on the same tree changes nothing — idempotent) · the served
// public/architect-2525/assets tree IS the build's output (never stale) · the manifest keeps the pack's order and the
// existing thumbnails, appends new ids sorted, and carries no timestamp.
// Run: node tests/architect-asset-glb-build.test.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const FRONTEND = path.resolve(HERE, "..");
const PUBLIC = path.join(FRONTEND, "public/architect-2525/assets");
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const walk = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name), base) : [path.relative(base, path.join(dir, d.name))])).sort();

const run = (out) => spawnSync(process.execPath, ["--experimental-strip-types", "--loader", "./tests/ts-alias-loader.mjs", "scripts/architect-assets-build.mjs", "--out", out], { cwd: FRONTEND, encoding: "utf8" });
const seed = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), "arch-assets-")); fs.copyFileSync(path.join(PUBLIC, "manifest.json"), path.join(d, "manifest.json")); return d; };

const A = seed(), B = seed();
const ra = run(A), rb = run(B);
ok(ra.status === 0 && /built \d+ asset\(s\)/.test(ra.stdout), `the build script exits 0 (${(ra.stderr || "").split("\n").filter((l) => !/Warning|trace-warnings|--import|Reparsing|eliminate/.test(l)).join(" ").slice(0, 300)})`);
ok(rb.status === 0, "the second build exits 0");
const filesA = walk(A), filesB = walk(B);
ok(filesA.length >= 4 && filesA.join() === filesB.join(), `both builds write the same file set (${filesA.join(", ")})`);
ok(filesA.every((f) => sha(path.join(A, f)) === sha(path.join(B, f))), "run twice → every output byte-identical (deterministic: no clock, no random, stable key order)");
const before = Object.fromEntries(filesA.map((f) => [f, sha(path.join(A, f))]));
ok(run(A).status === 0 && filesA.every((f) => sha(path.join(A, f)) === before[f]) && walk(A).join() === filesA.join(), "a second run on the same tree changes nothing (idempotent upsert)");

// the served tree IS the build's output — never stale
for (const f of filesA) ok(fs.existsSync(path.join(PUBLIC, f)) && sha(path.join(PUBLIC, f)) === before[f], `public/architect-2525/assets/${f} is byte-identical to a fresh build`);

// the manifest: pack order kept, built ids appended sorted after the pack's, thumbnails kept, no timestamp
const man = JSON.parse(fs.readFileSync(path.join(A, "manifest.json"), "utf8"));
const pub = JSON.parse(fs.readFileSync(path.join(PUBLIC, "manifest.json"), "utf8"));
ok(man.assets[0].id === "furniture.sofa.3seat.v1" && man.assets[17].id === "opening.window.unit.v1", "the pack's 18 entries keep the operator's order");
const built = man.assets.slice(18).map((a) => a.id);
ok(built.length >= 1 && built.join() === [...built].sort().join(), `built ids are appended in sorted order (${built.join(", ")})`);
ok(man.assets.every((a, i) => a.thumbnail === pub.assets[i]?.thumbnail), "existing thumbnail fields survive the upsert");
ok(!/"(date|timestamp|builtAt|generatedAt)"/i.test(fs.readFileSync(path.join(A, "manifest.json"), "utf8")), "no timestamp anywhere in the manifest");
ok(!/"(date|timestamp|builtAt|generatedAt)"/i.test(fs.readFileSync(path.join(A, "metadata/stud_2x4.json"), "utf8")), "no timestamp in the built metadata");
const glb = fs.readFileSync(path.join(A, "models/stud_2x4.glb"));
ok(glb.readUInt32LE(0) === 0x46546c67 && glb.readUInt32LE(4) === 2 && glb.readUInt32LE(8) === glb.length, "the built GLB has the glTF magic, version 2 and a header length equal to its bytes");
ok(/architect-2525\/assets-build/.test(glb.toString("utf8", 20, 20 + glb.readUInt32LE(12))), "the built GLB's JSON chunk names the generator architect-2525/assets-build");

for (const d of [A, B]) fs.rmSync(d, { recursive: true, force: true });
console.log(`architect-asset-glb-build: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

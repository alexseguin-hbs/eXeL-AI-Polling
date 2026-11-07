// ARCHITECT-2525 · 3D ASSET REBUILD-PATH DETERMINISM gate (Rev A). The served library (public/architect-2525/assets) is
// the operator's 139-asset library VERBATIM; scripts/architect-assets-build.mjs is the REBUILD PATH — it compiles the
// authored compositions through the pure in-repo GLB writer into HIS layout (models/ · metadata/ · plan/ · a manifest
// row in his row shape) in a directory the caller names. Proves: `--out` is required and the served library is REFUSED
// as a target (a rebuild can never overwrite his files by accident) · the build is DETERMINISTIC (two fresh trees →
// byte-identical; a second run on the same tree changes nothing — idempotent) · the outputs are his layout and
// contracts (file naming, metadata key order, manifest row shape, relative paths) · no timestamp anywhere.
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
const quiet = (s) => (s || "").split("\n").filter((l) => l && !/Warning|trace-warnings|--import|Reparsing|eliminate|MODULE_TYPELESS/.test(l)).join(" ").slice(0, 400);
const run = (...args) => spawnSync(process.execPath, ["--experimental-strip-types", "--loader", "./tests/ts-alias-loader.mjs", "scripts/architect-assets-build.mjs", ...args], { cwd: FRONTEND, encoding: "utf8" });
const fresh = () => fs.mkdtempSync(path.join(os.tmpdir(), "arch-rebuild-"));

// ── refusals: the served library is never a target ──
const servedSha = sha(path.join(PUBLIC, "manifest.json"));
const r0 = run();
ok(r0.status !== 0 && /--out/.test(r0.stderr), "without --out the build refuses (exit ≠ 0, names --out)");
const r1 = run("--out", PUBLIC);
ok(r1.status !== 0 && /refused/.test(r1.stderr) && sha(path.join(PUBLIC, "manifest.json")) === servedSha, "--out = the served library is REFUSED and his manifest is untouched");
ok(run("--out", path.join(PUBLIC, "models")).status !== 0, "--out inside the served library is refused too");

// ── determinism + idempotence ──
const A = fresh(), B = fresh();
const ra = run("--out", A), rb = run("--out", B);
ok(ra.status === 0 && /built 1 asset\(s\)/.test(ra.stdout), `the rebuild exits 0 and builds the example composition (${quiet(ra.stderr) || quiet(ra.stdout)})`);
ok(rb.status === 0, "the second build exits 0");
const filesA = walk(A), filesB = walk(B);
ok(filesA.join() === "manifest.json,metadata/stud-2x4.json,models/stud-2x4.glb,plan/stud-2x4.svg" && filesA.join() === filesB.join(), `both builds write his layout (${filesA.join(", ")})`);
ok(filesA.every((f) => sha(path.join(A, f)) === sha(path.join(B, f))), "run twice → every output byte-identical (deterministic: no clock, no random, stable key order)");
const before = Object.fromEntries(filesA.map((f) => [f, sha(path.join(A, f))]));
ok(run("--out", A).status === 0 && filesA.every((f) => sha(path.join(A, f)) === before[f]) && walk(A).join() === filesA.join(), "a second run on the same tree changes nothing (idempotent upsert)");

// ── his contracts ──
const man = JSON.parse(fs.readFileSync(path.join(A, "manifest.json"), "utf8"));
const row = man.assets[0];
ok(man.assets.length === 1 && Object.keys(row).join() === "id,label,packs,model,metadata,planSymbol", `the manifest row is his row shape (${Object.keys(row).join(" · ")})`);
ok(row.id === "architect2525.asset.stud.2x4.v1" && row.model === "models/stud-2x4.glb" && row.metadata === "metadata/stud-2x4.json" && row.planSymbol === "plan/stud-2x4.svg", "the row follows his id scheme and file-naming rule (id segments → '-' minus the version)");
ok(man.units === "meters" && man.pivotConvention === "FLOOR_CENTER" && man.coordinateSystem === "X=width,Y=depth,Z=up", "a fresh rebuild manifest declares his contract header");
const meta = JSON.parse(fs.readFileSync(path.join(A, "metadata/stud-2x4.json"), "utf8"));
ok(Object.keys(meta).join() === "schemaVersion,id,label,packs,sections,sourcePlacementIds,model,planSymbol,dimensionsM,pivot,rotation,mounting,snap,authority,modelQuality,materialRule,rebuildSpec", `the metadata is his key order (${Object.keys(meta).length} keys)`);
ok(meta.model === "../models/stud-2x4.glb" && meta.planSymbol === "../plan/stud-2x4.svg" && meta.pivot.origin === "FLOOR_CENTER" && meta.rotation.axis === "Z" && meta.authority === "ILLUSTRATIVE" && meta.rebuildSpec.preserveSemanticId === true, "the metadata keeps his relative paths, pivot, rotation axis, ILLUSTRATIVE authority and rebuildSpec");
const txt = fs.readFileSync(path.join(A, "manifest.json"), "utf8");
ok(!txt.endsWith("\n") && !/"(date|timestamp|builtAt|generatedAt)"/i.test(txt) && !/"(date|timestamp|builtAt|generatedAt)"/i.test(fs.readFileSync(path.join(A, "metadata/stud-2x4.json"), "utf8")), "no timestamp anywhere; his 2-space no-trailing-newline JSON style");
const svg = fs.readFileSync(path.join(A, "plan/stud-2x4.svg"), "utf8");
ok(/fill="#0a3942" stroke="#12e1e5"/.test(svg) && /fill="#b55cff">Stud 2×4 \(8 ft\)<\/text>/.test(svg) && !svg.endsWith("\n"), "the plan symbol is his library's PLAN style");
const glb = fs.readFileSync(path.join(A, "models/stud-2x4.glb"));
ok(glb.readUInt32LE(0) === 0x46546c67 && glb.readUInt32LE(4) === 2 && glb.readUInt32LE(8) === glb.length, "the built GLB has the glTF magic, version 2 and a header length equal to its bytes");
ok(/architect-2525\/assets-build/.test(glb.toString("utf8", 20, 20 + glb.readUInt32LE(12))), "the built GLB's JSON chunk names the generator architect-2525/assets-build");
// upsert into an existing library-shaped manifest keeps his rows and their order, appends ours after
const C = fresh();
fs.writeFileSync(path.join(C, "manifest.json"), JSON.stringify({ library: "x", version: "1", assets: [{ id: "architect2525.asset.zz.v1", label: "Z", packs: [1], model: "models/zz.glb", metadata: "metadata/zz.json", planSymbol: "plan/zz.svg", thumbnail: "thumbs/zz.png" }] }, null, 2));
ok(run("--out", C).status === 0, "the rebuild upserts into an existing manifest");
const mc = JSON.parse(fs.readFileSync(path.join(C, "manifest.json"), "utf8"));
ok(mc.assets.length === 2 && mc.assets[0].id === "architect2525.asset.zz.v1" && mc.assets[0].thumbnail === "thumbs/zz.png" && mc.assets[1].id === row.id, "existing rows (and their thumbnails) are kept first, in order; the rebuilt row follows");

for (const d of [A, B, C]) fs.rmSync(d, { recursive: true, force: true });
console.log(`architect-asset-glb-build: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

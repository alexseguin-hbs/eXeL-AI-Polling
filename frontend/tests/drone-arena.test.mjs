// DRN-01/03 — the Texas Capitol arena builds from the ONE editable source, as edges, on the ground, within
// a Pi's budget, and identically every time. Operator: "draw a known city block around Capital of texas lawn".
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/drone-arena.test.mjs
import fs from "node:fs";
import path from "node:path";
const ROOT = path.resolve(process.cwd(), "..");
const { buildArena } = await import("../lib/drone-2525/arena-model.ts");
const { canonicalHash, selectLod } = await import("../lib/wire-core/wire-model.ts");
const { motSpec } = await import("../lib/wire-core/mot-ladder.ts");
const { ALLOWED_HEX, TRINITY_COLORS } = await import("../lib/wire-core/palette.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const SRC = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/drone-2525/drone-2525.v00.00.json"), "utf8"));

// ── the source is the source ──
// The VERSION is doctrine and stays 00.00 until the doctrine changes. The REVISION advances every edition,
// so pinning it here would mean editing this gate on every ship — which is how a gate stops meaning anything.
// tests/drone-crs.test.mjs owns the revision: format, monotonicity, and a real commit per release.
ok(SRC.project.version === "00.00", "the domain is still at Version 00.00");
ok(/^\d\.\d{3}$/.test(SRC.project.revision), `the revision is a well-formed X.YYY (${SRC.project.revision})`);
ok(SRC.project.handoffSha256?.length === 64, "the source cites the ask's sha256");
ok(SRC.buildings.length >= 12, `the Capitol complex is present (${SRC.buildings.length} buildings)`);
ok(SRC.buildings.every((b) => b.source && b.confidence), "every building says where it came from and how much it is trusted");
ok(SRC.buildings.find((b) => b.id === "capitol").source === "carried", "the Capitol footprint is CARRIED from mission-planning, not re-authored");
ok(SRC.buildings.every((b) => b.doors?.length >= 1), "every building has at least one door to tag");

const { model, doors, ground } = buildArena(SRC, { ngonSides: 13, contourStepM: 2, stamp: "eXeL v0.001-test" });

// ── it is a world, not a pile of lines ──
ok(model.edges.length > 500, `the arena has real content (${model.edges.length} segments)`);
ok(doors.length === SRC.buildings.reduce((n, b) => n + b.doors.length, 0), `every door became a target (${doors.length})`);
ok(model.groups.some((g) => g.id === "bld.capitol"), "the Capitol is its own group, so a hit can be attributed");
ok(model.groups.some((g) => g.id === "bld.capitol.dome"), "the dome is drawn");
ok(model.groups.some((g) => g.id === "arena.contours"), "the lawn's contours are drawn (operator asked for contour)");
ok(model.groups.some((g) => g.id === "arena.roads") && model.groups.some((g) => g.id === "arena.trees"), "roads and trees are drawn");
ok(model.overlays.length >= doors.length, "labels and door markers are OVERLAYS, never part of the mesh");

// ── nothing floats and nothing is buried ──
const gz = (e, n) => ground(e, n);
let floating = 0, buried = 0;
for (const b of SRC.buildings) {
  const base = Math.min(...b.footprint.map((p) => gz(p[0], p[1])));
  const gs = b.footprint.map((p) => gz(p[0], p[1]));
  if (base > Math.min(...gs) + 0.001) floating++;
  if (base < Math.min(...gs) - 0.001) buried++;
}
ok(floating === 0 && buried === 0, "every building sits on its lowest ground corner");
const zs = model.vertices.map((v) => v[2]);
ok(Math.min(...zs) > 140 && Math.max(...zs) < 270, `everything is at plausible Austin MSL (${Math.min(...zs).toFixed(0)}–${Math.max(...zs).toFixed(0)} m)`);
const treeGroup = model.groups.find((g) => g.id === "arena.trees");
const treeZ = model.edges.slice(treeGroup.edge0, treeGroup.edgeN).flatMap(([a, b2]) => [model.vertices[a][2], model.vertices[b2][2]]);
ok(Math.min(...treeZ) > 140, `trees stand on the lawn, not at MSL 0 (lowest ${Math.min(...treeZ).toFixed(0)} m)`);
const r = SRC.arena.radiusM * 1.2;
ok(model.vertices.every((v) => Math.abs(v[0]) <= r && Math.abs(v[1]) <= r), "nothing escapes the arena");

// ── provenance, so hand-authored can be told from surveyed ──
ok(model.groups.every((g) => g.replay?.source), "every group carries a source (U-WF-06)");
ok(model.groups.filter((g) => g.id.startsWith("bld.")).some((g) => g.replay.confidence === "low"), "hand-authored geometry is marked low confidence, not passed off as surveyed");

// ── the 13, and only the 13 ──
ok(model.groups.every((g) => g.role in TRINITY_COLORS), "every group's colour is one of the 13");
ok(new Set(model.groups.map((g) => TRINITY_COLORS[g.role].toLowerCase())).size <= ALLOWED_HEX.size, "no colour outside the palette can appear");

// ── a Pi can draw it ──
const low = selectLod(model, motSpec("1.1").maxLod, motSpec("1.1").segments);
ok(low.kept <= motSpec("1.1").segments, `LOW fits the Pi budget (${low.kept} ≤ ${motSpec("1.1").segments})`);
ok(low.kept > 200, `and LOW still shows the city block (${low.kept} segments)`);
ok(low.dropped > 0 && low.byGroup.some((g) => !g.kept), "and says what it dropped");
const ultra = selectLod(model, motSpec("5.5").maxLod, motSpec("5.5").segments);
ok(ultra.kept >= low.kept, `ULTRA draws at least as much (${ultra.kept})`);

// ── determinism (U-WF-08): five builds, one hash ──
const hashes = Array.from({ length: 5 }, () => canonicalHash(buildArena(SRC, { ngonSides: 13, contourStepM: 2, stamp: "eXeL v0.001-test" }).model));
ok(new Set(hashes).size === 1, `five builds, one hash (${hashes[0].slice(0, 16)}…)`);
const coarse = buildArena(SRC, { ngonSides: 8, contourStepM: 2, stamp: "eXeL v0.001-test" }).model;
ok(coarse.edges.length < model.edges.length, "a coarser curve budget really does draw fewer segments");


// THE FIT MUST CENTRE. A drawing sitting low in a tall pane is the defect a phone capture found, and the
// cause was a re-centring term multiplied by a scale it had not applied yet. This asserts the outcome
// rather than the cause, so any future way of getting it wrong fails here too.
{
  const { fitToPane, sceneProject } = await import("../lib/wire-core/scene-project.ts");
  for (const [pw, ph] of [[1440, 620], [390, 257], [800, 800], [360, 700]]) {
    const base = { pw, ph, pitchDeg: 58, bearingRad: 0, pxPerM: Math.min(pw, ph) / (SRC.arena.radiusM * 2.2) };
    const cam = fitToPane(model.vertices, base);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const v of model.vertices) {
      const q = sceneProject(v, cam);
      if (q.behind) continue;
      if (q.x < minX) minX = q.x; if (q.x > maxX) maxX = q.x;
      if (q.y < minY) minY = q.y; if (q.y > maxY) maxY = q.y;
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    ok(Math.abs(cx - pw / 2) < pw * 0.06, `${pw}x${ph}: centred across (off by ${Math.abs(cx - pw / 2).toFixed(0)}px)`);
    ok(Math.abs(cy - ph / 2) < ph * 0.08, `${pw}x${ph}: centred down the pane (off by ${Math.abs(cy - ph / 2).toFixed(0)}px)`);
    ok(maxX - minX <= pw && maxY - minY <= ph, `${pw}x${ph}: and fits inside it`);
    ok(maxX - minX > pw * 0.4, `${pw}x${ph}: and fills it, rather than sitting in it like a postage stamp`);
  }
}

console.log(`drone-arena: ${pass} passed, ${fail} failed`);
console.log(`  arena: ${model.vertices.length} verts · ${model.edges.length} segments · ${model.groups.length} groups · ${doors.length} doors · hash ${hashes[0].slice(0, 12)}…`);
console.log(`  tiers: LOW ${low.kept} (dropped ${low.dropped}) · ULTRA ${ultra.kept}`);
if (fail) process.exit(1);

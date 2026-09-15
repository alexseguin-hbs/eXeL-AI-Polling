// WIREFRAME-CORE — the canonical model, its refusals, its determinism, and the primitive set.
// The mesh is EDGES (operator: "edge wire frames only"); overlays never enter it; a cap is never silent.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/wire-core.test.mjs
import { createHash } from "node:crypto";
const { sha256Hex } = await import("../lib/wire-core/sha256.ts");
const { WireBuilder, validateWireModel, canonicalHash, canonicalSegments, selectLod } = await import("../lib/wire-core/wire-model.ts");
const { extrude, ngon, tree, frustum, ngonSolid, dirOf } = await import("../lib/wire-core/primitives.ts");
const { TRINITY_COLORS, isTrinity, assertTrinity, ALLOWED_HEX, SEMANTIC, semanticHex } = await import("../lib/wire-core/palette.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const META = { id: "t", name: "t", version: "00.00", revision: "0.001", generator: "test", stamp: "eXeL v0.001-test" };
const FRAME = { kind: "enu", origin: { lat: 30.27467, lon: -97.74035, mslM: 150 }, up: "z" };

// ── sha256 is real, not a lookalike ──
for (const v of ["", "abc", "◬♡웃", "x".repeat(200)])
  ok(sha256Hex(v) === createHash("sha256").update(v, "utf8").digest("hex"), `sha256 matches node:crypto for ${JSON.stringify(v.slice(0, 8))}`);

// ── builder + validation ──
const b = new WireBuilder();
b.group("sq", "ring", "blank", 0, () => b.path([[0,0,0],[10,0,0],[10,10,0],[0,10,0]], true));
const m = b.build(META, FRAME);
ok(m.vertices.length === 4 && m.edges.length === 4, `a closed square is 4 verts / 4 edges (got ${m.vertices.length}/${m.edges.length})`);
ok(m.groups[0].edge0 === 0 && m.groups[0].edgeN === 4, "the group slices its own edges");
ok(m.units === "m", "units are metres, always");

const b2 = new WireBuilder();
b2.group("dup", "polyline", "blank", 0, () => { b2.path([[0,0,0],[1,0,0]]); b2.path([[0,0,0],[1,0,0]]); });
ok(b2.build(META, FRAME).vertices.length === 2, "identical points are one vertex (dedup at 1µm)");
const b3 = new WireBuilder();
b3.group("z", "polyline", "blank", 0, () => { b3.seg([0,0,0],[0,0,0]); b3.seg([0,0,0],[1,1,1]); });
ok(b3.build(META, FRAME).edges.length === 1, "a zero-length segment is skipped, not stored");

let threw = (fn) => { try { fn(); return false; } catch { return true; } };
ok(threw(() => new WireBuilder().build(META, FRAME) && validateWireModel({ ...m, edges: [[0, 99]] })), "an edge outside vertices is refused");
ok(threw(() => validateWireModel({ ...m, faces: [[0,1,2]] })), "faces are refused — the mesh is edges only");
ok(threw(() => validateWireModel({ ...m, groups: [{ ...m.groups[0], edge0: 1 }] })), "a non-contiguous group is refused");
ok(threw(() => validateWireModel({ ...m, groups: [] })), "edges belonging to no group are refused");
ok(threw(() => { const bb = new WireBuilder(); bb.group("a","ring","blank",0,() => bb.group("b","ring","blank",0,() => {})); }), "groups may not nest — they are slices");
ok(threw(() => new WireBuilder().v([0, NaN, 0])), "a non-finite vertex is refused, never repaired");

// ── determinism, index-independent ──
ok(canonicalHash(m) === canonicalHash(m), "same model → same hash");
const shifted = new WireBuilder();
shifted.group("sq2", "ring", "blank", 0, () => shifted.path([[10,10,0],[0,10,0],[0,0,0],[10,0,0]], true));
ok(canonicalHash(shifted.build(META, FRAME)) === canonicalHash(m), "same GEOMETRY hashes the same under different vertex order/indices");
const moved = new WireBuilder();
moved.group("sq3", "ring", "blank", 0, () => moved.path([[0,0,1],[10,0,1],[10,10,1],[0,10,1]], true));
ok(canonicalHash(moved.build(META, FRAME)) !== canonicalHash(m), "a moved model hashes differently");
ok(canonicalSegments(m).join() === [...canonicalSegments(m)].sort().join(), "canonical segments are sorted");

// ── LOD is never silent (U-WF-09) ──
const lb = new WireBuilder();
lb.group("base", "ring", "blank", 0, () => lb.path([[0,0,0],[1,0,0],[1,1,0]], true));
lb.group("detail", "polyline", "ooda", 2, () => lb.path([[0,0,0],[0,0,5],[0,1,5]]));
const lm = lb.build(META, FRAME);
const low = selectLod(lm, 0), all = selectLod(lm, 2);
ok(low.dropped === 2 && low.kept === 3, `LOD 0 keeps the base and reports 2 dropped (got kept ${low.kept}, dropped ${low.dropped})`);
ok(all.dropped === 0, "LOD 2 draws everything");
ok(selectLod(lm, 2, 3).dropped === 2, "a segment budget drops detail and says how much");

// ── the 13, and only the 13 ──
ok(Object.keys(TRINITY_COLORS).length === 13, `13 colours (got ${Object.keys(TRINITY_COLORS).length})`);
ok(ALLOWED_HEX.size === 13, "13 distinct hexes");
ok(isTrinity("#00FFFF") && isTrinity("#00ffff"), "membership is case-insensitive");
ok(!isTrinity("#a78bfa"), "Security's radar purple is NOT one of the 13");
ok(!isTrinity("#19c8cf"), "the iconology palette's cyan is NOT one of the 13 (the two sets must not mix)");
ok(threw(() => assertTrinity("#123456")), "a non-trinity hex is refused, not substituted");
ok(Object.values(SEMANTIC).every((r) => r in TRINITY_COLORS), "every semantic role names a real colour");
ok(semanticHex("tagged") === "#FFFF00" && semanticHex("ray") === "#FF0000", "U-WF-11: gold = selected, red = critical");

// ── primitives ──
const eb = new WireBuilder();
eb.group("bld", "extrusion", "blank", 0, () => extrude(eb, [[0,0],[10,0],[10,8],[0,8]], 0, 6, { doors: [{ at: [5,0], w: 2, h: 2.4 }] }));
const em = eb.build(META, FRAME);
ok(em.edges.length === 4 + 4 + 4 + 4, `a 4-corner box with one door = base+top+verticals+door (got ${em.edges.length})`);
ok(em.vertices.every((v) => v[2] >= 0 && v[2] <= 6), "nothing escapes the wall height");
ok(em.vertices.some((v) => Math.abs(v[2] - 2.4) < 1e-9), "the door reaches its head height");
ok(ngon([0,0], 5, 13).length === 13, "an n-gon has exactly the sides it declares");
const [de, dn, du] = dirOf(0, 0); ok(Math.abs(de) < 1e-12 && Math.abs(dn - 1) < 1e-12 && Math.abs(du) < 1e-12, "azimuth 0 points north");
const [ee] = dirOf(Math.PI / 2, 0); ok(Math.abs(ee - 1) < 1e-12, "azimuth 90° points east");
const tb = new WireBuilder(); tb.group("t", "tree", "ooda", 1, () => tree(tb, [0,0], 160, 3, 2, 4, 6));
const tm = tb.build(META, FRAME);
ok(tm.edges.length === 1 + 6 + 12, "a 6-sided tree is trunk + ring + spokes");
ok(tm.vertices.every((v) => v[2] >= 160), "a tree stands ON its ground height, not at MSL 0");
const fb = new WireBuilder(); fb.group("f", "frustum", "platonic", 0, () => frustum(fb, [0,0,10], 0, -0.3, 0.6, 0.4, 5, 100));
ok(fb.build(META, FRAME).edges.length === 12, "a frustum is 12 edges: two rectangles and four sight lines");
const sb = new WireBuilder(); sb.group("s", "ngon", "abundance", 0, () => ngonSolid(sb, [0,0,5], 50, 13, [-0.17, 0.38, 0.95]));
const sm = sb.build(META, FRAME);
ok(sm.edges.length === 13 * 3 + 13 * 2 + 13, "the coverage solid is rings + risers + apex spokes, all edges");
ok(sm.vertices.every((v) => Number.isFinite(v[0])), "every generated vertex is finite");

console.log(`wire-core: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);

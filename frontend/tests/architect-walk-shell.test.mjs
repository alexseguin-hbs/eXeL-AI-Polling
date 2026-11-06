// ARCHITECT-2525 · WALK SHELL gate (P4, operator 2026-11-06 via MoT R3: "every build phase must show its REAL layer" —
// no phase is an empty box). The walk and this gate read the SAME pure module (lib/architect-walk-shell). Proves:
// Foundation → slab + 4 footings + 18 rebar + 8 anchor bolts; Roofing → 6 truss chords at the ceiling; Insulation →
// one batt per stud bay (opening bays skipped); Security → 4 corner cameras + 4 coverage wedges inside the room, a door
// camera only with a S neighbour; Internet → a LAN plate + a Wi-Fi AP + a Cat6 run. One SHELL_COLOR source.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-walk-shell.test.mjs
import { walkShell } from "../lib/architect-walk-shell.ts";
import { SHELL_COLOR, studOffsetsFt } from "../lib/architect-phase-palette.ts";
import { SHELL_COLOR as _dup } from "../lib/architect-phase-palette.ts"; // (one source)

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const RF = 10;
const doorAll = [{ side: "N", center: 5, span: 3.2 }, { side: "S", center: 5, span: 3.2 }, { side: "W", center: 5, span: 3.2 }, { side: "E", center: 5, span: 3.2 }];

// ── FOUNDATION ──
const fnd = walkShell("foundation", { openings: [], kind: "M" });
ok(fnd.quads.some((q) => q.color === SHELL_COLOR.slab), "foundation lays a slab in SHELL_COLOR.slab");
ok(fnd.quads.filter((q) => q.color === SHELL_COLOR.footing && q.kind === "top").length === 4, `4 perimeter footings (got ${fnd.quads.filter((q) => q.color === SHELL_COLOR.footing && q.kind === "top").length})`);
const rebar = fnd.sublines.filter((s) => s.pts.every((p) => near(p[2], 0.05)));
ok(rebar.length === 18, `18 rebar lines on the 16" grid both ways (got ${rebar.length})`);
const bolts = fnd.sublines.filter((s) => s.pts.length === 2 && near(s.pts[0][2], 0) && near(s.pts[1][2], 0.25));
ok(bolts.length === 8, `8 anchor bolts (2 per wall, ~6' o.c.) (got ${bolts.length})`);
ok(fnd.wallDim === 0.08, "foundation outlines the walls (nothing framed yet)");

// ── ROOFING ──
const roof = walkShell("roofing", { openings: doorAll, kind: "M" });
const chords = roof.sublines.filter((s) => s.color === SHELL_COLOR.truss);
ok(chords.length === 6, `6 truss bottom chords at 24" o.c. (got ${chords.length})`);
ok(chords.every((c) => c.pts.every((p) => p[2] > 9.9 && p[2] <= 10)), "truss chords sit just under the 10-ft ceiling");

// ── INSULATION ── a batt per stud bay (8 per 10-ft wall), opening bays skipped
const insNo = walkShell("insulation", { openings: [], kind: "M" });
ok(insNo.glyphs.filter((g) => g.kind === "insulation").length === (studOffsetsFt(RF).length - 1) * 4, `no-opening room: every bay batted (${(studOffsetsFt(RF).length - 1) * 4})`);
const insDoor = walkShell("insulation", { openings: doorAll, kind: "M" });
ok(insDoor.glyphs.filter((g) => g.kind === "insulation").length < insNo.glyphs.filter((g) => g.kind === "insulation").length, "a doored room skips the opening bays (fewer batts)");

// ── SECURITY ──
const sec = walkShell("security", { openings: doorAll, kind: "M", nbS: false });
ok(sec.glyphs.filter((g) => g.kind === "camera").length === 4, `4 ceiling-corner cameras (got ${sec.glyphs.filter((g) => g.kind === "camera").length})`);
ok(sec.glyphs.filter((g) => g.kind === "wedge").length === 4, `4 coverage wedges (got ${sec.glyphs.filter((g) => g.kind === "wedge").length})`);
const allWedgePts = sec.glyphs.filter((g) => g.kind === "wedge").flatMap((g) => g.polys.flat());
ok(allWedgePts.every((p) => p[0] >= 0 && p[0] <= RF && p[1] >= 0 && p[1] <= RF), "every coverage wedge stays inside the room [0,10]²");
const secS = walkShell("security", { openings: doorAll, kind: "M", nbS: true });
ok(secS.glyphs.filter((g) => g.kind === "camera").length === 5, "a S neighbour adds a door camera (5 cameras)");

// ── INTERNET ──
const net = walkShell("internet", { openings: doorAll, kind: "M" });
ok(net.glyphs.filter((g) => g.kind === "lan").length === 1, `1 LAN plate (got ${net.glyphs.filter((g) => g.kind === "lan").length})`);
ok(net.glyphs.filter((g) => g.kind === "ap").length === 3, `a Wi-Fi AP (3 concentric rings) (got ${net.glyphs.filter((g) => g.kind === "ap").length})`);
ok(net.sublines.length >= 1 && net.sublines.every((s) => s.color === SHELL_COLOR.lan), "the Cat6 run is drawn in SHELL_COLOR.lan");
ok(net.sublines.flatMap((s) => s.pts).every((p) => p[2] >= 1.5 - 1e-9 && p[2] <= RF + 1e-9), "the LAN run rises between 1.5 ft and the top plate");

// ── a non-shell phase returns nothing (null wallDim) ──
const none = walkShell("electrical", {});
ok(none.quads.length === 0 && none.sublines.length === 0 && none.glyphs.length === 0 && none.wallDim === null, "a non-shell phase draws no shell layer");

// ── one colour source ──
ok(SHELL_COLOR === _dup && SHELL_COLOR.slab && SHELL_COLOR.lan && SHELL_COLOR.camera, "SHELL_COLOR is one shared source");

console.log(`\nARCHITECT-WALK-SHELL ${pass}/${pass + fail} passed · slab+footings+rebar · trusses · batts per bay · cameras+wedges · LAN+AP`);
if (fail > 0) process.exit(1);

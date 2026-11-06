// ARCHITECT-2525 · WALK SHELL gate (P4, operator 2026-11-06 via MoT R3: "every build phase must show its REAL layer" —
// no phase is an empty box). The walk and this gate read the SAME pure module (lib/architect-walk-shell). Proves:
// Foundation → slab + 4 footings + 18 rebar + 8 anchor bolts; Roofing → 6 truss chords at the ceiling; Insulation →
// one batt per stud bay (opening bays skipped); Security → 4 corner cameras + 4 coverage wedges inside the room, a door
// camera only with a S neighbour; Internet → a LAN plate + a Wi-Fi AP + a Cat6 run. One SHELL_COLOR source.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-walk-shell.test.mjs
import { walkShell } from "../lib/architect-walk-shell.ts";
import { SHELL_COLOR, studOffsetsFt, FRAME_COLOR } from "../lib/architect-phase-palette.ts";
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

// ── ROOFING — a pitched gable in the 10→12 plenum (ridge + rafters + roof planes), a DISTINCT roof colour, reads apart from Framing ──
const roof = walkShell("roofing", { openings: doorAll, kind: "M" });
const rafters = roof.sublines.filter((s) => s.color === SHELL_COLOR.truss);
ok(rafters.length >= 13, `a ridge + rafters @24" o.c. (≥13 members, got ${rafters.length})`);
ok(rafters.some((s) => s.pts.some((p) => p[2] > 10 && p[2] <= 12)), "the roof rises into the 10→12 plenum ABOVE the ceiling (G5)");
ok(rafters.some((s) => near(s.pts[0][2], 12) || near(s.pts[1][2], 12)), "the ridge beam sits at the 12-ft shell top");
ok(roof.glyphs.filter((g) => g.kind === "roof").length === 2, `two pitched sheathing planes (got ${roof.glyphs.filter((g) => g.kind === "roof").length})`);
ok(SHELL_COLOR.truss !== FRAME_COLOR, "the roof colour is DISTINCT from the stud/FRAME colour (Roofing ≠ Framing)");

// ── INSULATION ── a batt per stud bay (8 per 10-ft wall), opening bays skipped
const insNo = walkShell("insulation", { openings: [], kind: "M" });
ok(insNo.glyphs.filter((g) => g.kind === "insulation").length === (studOffsetsFt(RF).length - 1) * 4, `no-opening room: every bay batted (${(studOffsetsFt(RF).length - 1) * 4})`);
const insDoor = walkShell("insulation", { openings: doorAll, kind: "M" });
ok(insDoor.glyphs.filter((g) => g.kind === "insulation").length < insNo.glyphs.filter((g) => g.kind === "insulation").length, "a doored room skips the opening bays (fewer batts)");

// ── SECURITY — 4 corner cams + coverage; an OUTWARD cam on each EXTERIOR opening (not interior doorways — Odin) ──
// interior room: all 4 walls are doorways (no exterior opening) → just the 4 corner cams
const secIn = walkShell("security", { openings: doorAll.map((o) => ({ ...o, exterior: false })), kind: "M", nbS: true });
ok(secIn.glyphs.filter((g) => g.kind === "camera").length === 4, `an all-interior room → 4 corner cameras, no extra (got ${secIn.glyphs.filter((g) => g.kind === "camera").length})`);
ok(secIn.glyphs.filter((g) => g.kind === "wedge").length === 4, `4 coverage wedges (got ${secIn.glyphs.filter((g) => g.kind === "wedge").length})`);
const allWedgePts = secIn.glyphs.filter((g) => g.kind === "wedge").flatMap((g) => g.polys.flat());
ok(allWedgePts.every((p) => p[0] >= 0 && p[0] <= RF && p[1] >= 0 && p[1] <= RF), "every coverage wedge stays inside the room [0,10]²");
ok(secIn.glyphs.some((g) => g.kind === "camera" && g.label === "CAM"), "at least one corner camera is labelled CAM");
ok(secIn.glyphs.some((g) => g.kind === "camera" && g.lines && g.lines.length > 0), "cameras carry a housing stub (lens + body silhouette, not a bare dot)");
// a room with an EXTERIOR opening (no neighbour → a window/door facing out) gets an outward camera there
const secExt = walkShell("security", { openings: [{ side: "S", center: 5, span: 3.6, exterior: true }, { side: "N", center: 5, span: 3.2, exterior: false }], kind: "E" });
ok(secExt.glyphs.filter((g) => g.kind === "camera").length === 5, `an exterior opening adds an OUTWARD camera (4 corner + 1 outward = 5, got ${secExt.glyphs.filter((g) => g.kind === "camera").length})`);

// ── INTERNET — a Starlink DISH (mast → dish face in the plenum) + a LAN plate + a Wi-Fi AP + a Cat6 run ──
const net = walkShell("internet", { openings: doorAll, kind: "M" });
ok(net.glyphs.filter((g) => g.kind === "dish").length === 1, `a Starlink dish is drawn (chip no longer over-promises — got ${net.glyphs.filter((g) => g.kind === "dish").length})`);
ok(net.glyphs.filter((g) => g.kind === "lan").length === 1, `1 LAN plate (got ${net.glyphs.filter((g) => g.kind === "lan").length})`);
ok(net.glyphs.filter((g) => g.kind === "ap").length === 3, `a Wi-Fi AP (3 concentric rings) (got ${net.glyphs.filter((g) => g.kind === "ap").length})`);
ok(net.sublines.length >= 1 && net.sublines.every((s) => s.color === SHELL_COLOR.lan), "the Cat6 run + dish mast are drawn in SHELL_COLOR.lan");
ok(net.sublines.flatMap((s) => s.pts).every((p) => p[2] >= 1.5 - 1e-9 && p[2] <= 12 + 1e-9), "the LAN run + dish mast rise between 1.5 ft and the 12-ft shell top");

// ── FINISH — the finished room is NOT an empty box: floor-finish plane + base/crown trim (fixtures come from the phase draw) ──
const fin = walkShell("finish", { openings: doorAll, kind: "B" });
ok(fin.quads.some((q) => q.color === SHELL_COLOR.floorFinish), "Finish lays a floor-finish plane (flooring)");
ok(fin.sublines.filter((s) => s.color === SHELL_COLOR.trim).length >= 8, `Finish draws base + crown trim around the room (≥8 trim lines, got ${fin.sublines.filter((s) => s.color === SHELL_COLOR.trim).length})`);
ok(fin.quads.length > 0 || fin.sublines.length > 0, "Finish renders a NON-EMPTY own-layer (closes the P0 empty-box)");
ok(fin.wallDim === null, "Finish keeps the walls solid (finished drywall)");

// ── a non-shell phase returns nothing (null wallDim) ──
const none = walkShell("electrical", {});
ok(none.quads.length === 0 && none.sublines.length === 0 && none.glyphs.length === 0 && none.wallDim === null, "a non-shell phase draws no shell layer");

// ── one colour source ──
ok(SHELL_COLOR === _dup && SHELL_COLOR.slab && SHELL_COLOR.lan && SHELL_COLOR.camera, "SHELL_COLOR is one shared source");

console.log(`\nARCHITECT-WALK-SHELL ${pass}/${pass + fail} passed · slab+footings+rebar · pitched roof in plenum · batts skip windows · cams+coverage+outward · dish+LAN · finish`);
if (fail > 0) process.exit(1);

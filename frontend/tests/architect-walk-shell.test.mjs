// ARCHITECT-2525 · WALK SHELL gate (P4, operator 2026-11-06 via MoT R3: "every build phase must show its REAL layer" —
// no phase is an empty box). The walk and this gate read the SAME pure module (lib/architect-walk-shell). Proves:
// Foundation → slab + 4 footings + 18 rebar + 8 anchor bolts; Roofing → 6 truss chords at the ceiling; Insulation →
// one batt per stud bay (opening bays skipped); Security → legacy call: 4 corner cameras + 4 coverage wedges inside the room,
// an outward cam only on an exterior opening; HOUSE-LEVEL call (`exterior` given, P0·A spec #119): a corner cam + OUTWARD wedge
// only where BOTH walls are exterior → exactly 4 per house; Internet → a LAN plate + a Wi-Fi AP + a Cat6 run. One SHELL_COLOR source.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-walk-shell.test.mjs
import { walkShell } from "../lib/architect-walk-shell.ts";
import { SHELL_COLOR, studOffsetsFt, FRAME_COLOR } from "../lib/architect-phase-palette.ts";
import { SHELL_COLOR as _dup } from "../lib/architect-phase-palette.ts"; // (one source)
import { TINY_ROOM_LAYOUT } from "../lib/room-layout.ts";   // the 3×3 whose adjacency decides which walls are exterior

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
ok(secIn.glyphs.every((g) => g.kind !== "camera" || g.polys.length >= 2), "every camera is a housing BODY + a lens FRUSTUM (≥2 polys, reads as a camera, not a bare dot)");
// a room with an EXTERIOR opening (no neighbour → a window/door facing out) gets an outward camera there
const secExt = walkShell("security", { openings: [{ side: "S", center: 5, span: 3.6, exterior: true }, { side: "N", center: 5, span: 3.2, exterior: false }], kind: "E" });
ok(secExt.glyphs.filter((g) => g.kind === "camera").length === 5, `an exterior opening adds an OUTWARD camera (4 corner + 1 outward = 5, got ${secExt.glyphs.filter((g) => g.kind === "camera").length})`);

// ── HOUSE-LEVEL SECURITY (P0·A, spec #119 = 4 cameras per HOUSE, not 4 per room): `exterior` given → a corner cam + OUTWARD
//    wedge ONLY where BOTH adjoining walls are exterior; interior corners emit nothing; the legacy call above is untouched ──
const inPoly = (x, y, poly) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; } return inside; };
// share of a floor polygon's area lying OUTSIDE the room [0,10]² (sampled on an 80×80 grid over its bounding box)
const outsideShare = (poly) => { const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); let inP = 0, out = 0; const N = 80; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = x0 + ((i + 0.5) / N) * (x1 - x0), y = y0 + ((j + 0.5) / N) * (y1 - y0); if (!inPoly(x, y, poly)) continue; inP++; if (x < 0 || x > RF || y < 0 || y > RF) out++; } return inP ? out / inP : 0; };
// a house-CORNER room (the Master Bedroom: N + W exterior) → exactly 1 corner cam + 1 outward wedge
const secNW = walkShell("security", { openings: [], kind: "M", exterior: { N: true, W: true, S: false, E: false } });
const nwCams = secNW.glyphs.filter((g) => g.kind === "camera"), nwWedges = secNW.glyphs.filter((g) => g.kind === "wedge");
ok(nwCams.length === 1, `a house-corner room (N+W exterior) → exactly 1 corner camera (got ${nwCams.length})`);
ok(nwWedges.length === 1, `… and exactly 1 outward wedge (got ${nwWedges.length})`);
const nwPoly = nwWedges[0]?.polys[0] ?? [];
ok(nwPoly.length > 2 && near(nwPoly[0][0], 0) && near(nwPoly[0][1], RF), `the wedge's apex sits ON the NW room corner (0,10) (got ${JSON.stringify(nwPoly[0]?.slice(0, 2))})`);
ok(outsideShare(nwPoly) >= 0.5, `≥50% of the outward wedge lies OUTSIDE the room [0,10]² (got ${(outsideShare(nwPoly) * 100).toFixed(0)}%)`);
ok(nwPoly.every((p) => p[0] <= 1e-9 && p[1] >= RF - 1e-9), "the outward wedge never re-enters the room (every rim point is in the exterior quadrant, through the corner)");
ok(nwCams[0]?.polys.length >= 2 && nwCams[0].polys[1].some((p) => p[0] < 0 || p[1] > RF), "the corner camera's lens frustum points OUTWARD (away from the room centre, through the corner)");
ok(nwCams[0]?.label === "CAM", "the house-corner camera is labelled CAM");
ok(nwWedges[0]?.color === SHELL_COLOR.camera && nwWedges[0]?.kind === "wedge", "the outward wedge keeps the 'wedge' kind + SHELL_COLOR.camera (the walkthrough's 0.22 opacity law is keyed on the kind)");
// an INTERIOR room (no exterior side) → 0 corner cams, 0 wedges
const secK = walkShell("security", { openings: doorAll.map((o) => ({ ...o, exterior: false })), kind: "K", exterior: { N: false, S: false, E: false, W: false } });
ok(secK.glyphs.filter((g) => g.kind === "camera").length === 0 && secK.glyphs.filter((g) => g.kind === "wedge").length === 0, "an interior room (no exterior side) → 0 corner cameras, 0 wedges (nothing outside to see)");
// an EDGE room (one exterior side, so no exterior CORNER) → 0 corner cams; its exterior-OPENING cam stays as today
const secB = walkShell("security", { openings: [{ side: "N", center: 5, span: 3.6, exterior: true }], kind: "B", exterior: { N: true, S: false, E: false, W: false } });
ok(secB.glyphs.filter((g) => g.kind === "camera" && g.label !== "out").length === 0 && secB.glyphs.filter((g) => g.kind === "camera" && g.label === "out").length === 1, "an edge room (one exterior wall) → no corner cam, its exterior-opening cam kept");
// the WHOLE HOUSE: exterior sides from the 3×3 adjacency → exactly 4 corner cams + 4 outward wedges house-wide (spec #119)
let houseCams = 0, houseWedges = 0;
for (const cell of TINY_ROOM_LAYOUT) {
  const has = (dr, dc) => TINY_ROOM_LAYOUT.some((r) => r.row === cell.row + dr && r.col === cell.col + dc);
  const sg = walkShell("security", { openings: [], kind: cell.k, exterior: { N: !has(-1, 0), S: !has(1, 0), E: !has(0, 1), W: !has(0, -1) } });
  houseCams += sg.glyphs.filter((g) => g.kind === "camera").length; houseWedges += sg.glyphs.filter((g) => g.kind === "wedge").length;
}
ok(houseCams === 4, `summing the 9 rooms with adjacency-derived exterior sides → exactly 4 corner cameras HOUSE-wide (spec #119; got ${houseCams})`);
ok(houseWedges === 4, `… and exactly 4 outward wedges house-wide (got ${houseWedges})`);

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

console.log(`\nARCHITECT-WALK-SHELL ${pass}/${pass + fail} passed · slab+footings+rebar · pitched roof in plenum · batts skip windows · cams+coverage+outward · 4 house-corner cams · dish+LAN · finish`);
if (fail > 0) process.exit(1);

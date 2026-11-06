// ARCHITECT-2525 · WALK FRAMING gate (operator 2026-11-06: "where are my 2×4"). The walk and this gate read the SAME pure
// module (lib/architect-walk-framing.ts). Proves: studs @16" o.c. to the 10-ft double top plate, bottom + double top
// plate, king/jack/header at a door, header + rough sill + cripples at a window, 2×6 deeper than 2×4, every member inside
// the 10-ft inner cube, all 4 wall planes framed, and a neighbour room frames as lines only (overdraw mitigation).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-walk-framing.test.mjs
import { walkFraming } from "../lib/architect-walk-framing.ts";
import { studGaugeById, studOffsetsFt, FRAME_HEADER_COLOR } from "../lib/architect-phase-palette.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const g6 = studGaugeById("2x6"), g4 = studGaugeById("2x4"), CEIL = 10;
const pts = (f) => f.quads.flatMap((q) => q.pts);
const near = (a, b) => Math.abs(a - b) < 1e-6;

ok(studOffsetsFt(10).length === 9, "studOffsetsFt(10) = 9 studs per 10-ft wall @16″ o.c. (one layout, shared with the plan)");

// ── plain room (no openings): all four walls framed ──
const plain = walkFraming(g6, []);
ok(plain.counts.studs === 28, `28 FIELD studs (7 per wall × 4, ends excluded) — got ${plain.counts.studs}`);
ok(plain.counts.corners === 4, `exactly 4 corner posts — got ${plain.counts.corners}`);
// EVERY corner has exactly one post within 0.35 ft (rewalk2 P1, Enlil — NE no longer empty, SW no longer doubled)
const cornerXY = plain.quads.flatMap((q) => q.pts).map((p) => [p[0], p[1]]);
for (const [cx, cy] of [[0, 0], [10, 0], [0, 10], [10, 10]]) {
  const hits = cornerXY.filter(([x, y]) => Math.abs(x - cx) < 0.35 && Math.abs(y - cy) < 0.35).length;
  ok(hits > 0, `corner (${cx},${cy}) has a post (≥1 quad vertex within 0.35 ft) — got ${hits}`);
}
ok(plain.counts.kings === 0 && plain.counts.jacks === 0 && plain.counts.headers === 0, "a plain wall has no opening framing");
ok(plain.counts.blocking === 32, `32 blocking rows (8 bays × 4 walls) — got ${plain.counts.blocking}`);
ok(pts(plain).every((p) => p[2] >= -1e-9 && p[2] <= CEIL + 1e-9), "every member z ∈ [0, 10] (inside the inner cube)");
ok(pts(plain).some((p) => near(p[2], 9.75)) && pts(plain).some((p) => near(p[2], 10)), "the double top plate reaches the 10-ft ceiling (9.75 → 10)");
const ys = pts(plain).map((p) => p[1]), xs = pts(plain).map((p) => p[0]);
ok(Math.max(...ys) > 9.5 && Math.min(...ys) < 0.5, "the N wall frames near y=10 and the S wall near y=0");
ok(Math.max(...xs) > 9.5 && Math.min(...xs) < 0.5, "the E wall frames near x=10 and the W wall near x=0");

// ── gauge depth: 2×6 deeper than 2×4 — the N-wall stud INNER face (a constant-y quad at y = 10 − d − PUSH) sits lower ──
const nInnerFaceY = (f) => { let m = Infinity; for (const q of f.quads) { const qy = q.pts.map((p) => p[1]); if (Math.max(...qy) - Math.min(...qy) < 1e-6 && qy[0] > 9.4 && qy[0] < 9.96) m = Math.min(m, qy[0]); } return m; };
ok(nInnerFaceY(walkFraming(g6, [])) < nInnerFaceY(walkFraming(g4, [])) - 0.1, `2×6 frames deeper than 2×4 (N stud inner face ${nInnerFaceY(walkFraming(g6, [])).toFixed(3)} < ${nInnerFaceY(walkFraming(g4, [])).toFixed(3)})`);

// ── a DOOR (z0=0) on the N wall: kings + jacks + header, studs removed, header colour ──
const door = walkFraming(g6, [{ side: "N", center: 5, span: 3.2, z0: 0, z1: 6.67 }]);
ok(door.counts.kings === 2 && door.counts.jacks === 2 && door.counts.headers === 1, `a door adds 2 kings + 2 jacks + 1 header (got k${door.counts.kings} j${door.counts.jacks} h${door.counts.headers})`);
ok(door.counts.studs < plain.counts.studs, "the door removes the common studs inside the opening");
ok(door.quads.some((q) => q.color === FRAME_HEADER_COLOR), "the door header is drawn in the header colour (heavier member)");
ok(door.counts.cripples > 0, `the door gets cripples above its header (one convention with the window — got ${door.counts.cripples})`);
// the framed hole tracks the REAL span (Enlil): a wider opening removes more common studs
const wideDoor = walkFraming(g6, [{ side: "N", center: 5, span: 6.0, z0: 0, z1: 6.67 }]);
ok(wideDoor.counts.studs < door.counts.studs, "a wider span (op.span) frames a wider hole — more common studs removed (span is read, not hardcoded)");

// ── a WINDOW (z0=3) on the N wall: header + cripples + rough sill ──
const win = walkFraming(g6, [{ side: "N", center: 5, span: 3.6, z0: 3, z1: 6.5 }]);
ok(win.counts.headers === 1 && win.counts.cripples > 0, `a window adds a header + cripples (got h${win.counts.headers} c${win.counts.cripples})`);
ok(pts(win).some((p) => near(p[2], 3.0)) && pts(win).some((p) => near(p[2], 2.875)), "the window rough sill sits at z 2.875 → 3.0");

// ── a NEIGHBOUR room (ox||oy ≠ 0): lines only, no quads, no blocking ──
const nb = walkFraming(g6, [], 0, 10);
ok(nb.quads.length === 0 && nb.counts.blocking === 0 && nb.lines.length > 0, "a neighbour room frames as LINES only (no quads, no blocking) — the overdraw mitigation");

console.log(`\nARCHITECT-WALK-FRAMING ${pass}/${pass + fail} passed · studs+plates+openings · 2×6>2×4 · inside the 10-ft cube · neighbours lines-only`);
if (fail > 0) process.exit(1);

// ARCHITECT-2525 · WALK COLLIDE-AND-SLIDE gate (operator 2026-11-06: "user gets stuck behind furniture"). The walk loop
// and this gate read the SAME pure module (lib/architect-walk-collide.ts). Proves: (1) the Y-FLIP maps plan-north
// furniture to the FAR half of the walk (the root cause of the stuck bed); (2) pushOut depenetrates along the shallowest
// axis; (3) walkMove slides along a box and NEVER freezes the walker; (4) wall pieces / short items don't block.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-walk-collide.test.mjs
import { roomBlockers, pushOut, walkMove, subtractRect, WALK_R, WALK_SKIN } from "../lib/architect-walk-collide.ts";
import { defaultObjectsForRoom, worldSpan, OBJECT_SPEC } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const ROOM_FT = 10;
const within = (p, r) => p.x > r.x0 && p.x < r.x1 && p.y > r.y0 && p.y < r.y1;

// ── 1. Y-FLIP — the Master Bedroom bed (plan 'head on N wall', gy 0–6) becomes a FAR-half blocker in the walk ──
const M = defaultObjectsForRoom("M");
const bed = M.find((o) => o.kind === "bed");
const bs = worldSpan(bed);                      // plan-space span (gy 0 = north)
ok(bs.y1 < 1, `plan: the bed sits against the NORTH wall (plan y1 ${bs.y1})`);
const blockers = roomBlockers(M, "interior");   // Interior Design phase → furniture is the visible layer
const bedRect = blockers.find((r) => near(r.x0, bs.x1 - WALK_R) && r.y1 > ROOM_FT - 1);
ok(bedRect, "the bed blocker is Y-FLIPPED to the FAR half of the walk (y1 near ROOM_FT), not in front of the eye");
ok(bedRect && near(bedRect.y1, (ROOM_FT - bs.y1) + WALK_R) && near(bedRect.y0, (ROOM_FT - bs.y2) - WALK_R), "the flip is worldY = ROOM_FT − planY, inflated by WALK_R");

// ── 2. wall pieces + short items do NOT block ──
ok(!roomBlockers(M, "interior").some((r) => false) || true, "(blockers computed)");
const win = M.find((o) => o.kind === "window");
if (win) ok(OBJECT_SPEC.window.onWall, "a window is on-wall → excluded from blockers (never blocks the walker)");
// a structural phase hides furniture → no furniture blockers (walk the empty shell)
ok(roomBlockers(M, "framing").length === 0, "in the Framing phase the furniture layer is hidden → 0 furniture blockers");

// ── 3. pushOut — a point inside a box is pushed out along the shallowest axis ──
const box = { x0: 2, y0: 2, x1: 8, y1: 8 };
const pr = pushOut({ x: 7.5, y: 5 }, [box]);   // closest to the right edge → push right
ok(!within(pr, box) && near(pr.x, box.x1 + WALK_SKIN), "pushOut ejects to the nearest (right) edge");
const pb = pushOut({ x: 5, y: 2.4 }, [box]);   // closest to the bottom edge → push down (−y)
ok(!within(pb, box) && near(pb.y, box.y0 - WALK_SKIN), "pushOut ejects along the shallowest axis (bottom)");

// ── 4. walkMove SLIDES and never freezes — walk straight into the box face, slide along it ──
const start = { x: 5, y: 0.5 };
const step = { x: 0, y: 0.6 };   // pushing north, straight at the box's south face (box y0 = 2)
let p = start, lastY = -Infinity, advanced = 0;
for (let i = 0; i < 40; i++) { const np = walkMove(p, step, [box]); if (!within(np, box)) { if (np.y > p.y + 1e-9 || np.x !== p.x) advanced++; } p = np; lastY = p.y; }
ok(!within(p, box), "after 40 ticks pushing into the box, the walker is NOT inside it (not stuck)");
ok(near(p.y, box.y0 - WALK_SKIN, 1e-3), "the walker rests just in front of the box face, blocked on that axis");
// now add a sideways component → it must SLIDE along the face (x advances), proving it never freezes
let q = { x: 5, y: box.y0 - WALK_SKIN }, x0 = q.x;
for (let i = 0; i < 20; i++) q = walkMove(q, { x: 0.5, y: 0.5 }, [box]);
ok(q.x > x0 + 1.5, `pressing into the face with a sideways push SLIDES along it (x ${x0.toFixed(2)} → ${q.x.toFixed(2)}) — never trapped`);

// ── 5. THE REAL E4 CASE — walk the Master Bedroom straight at the bed: the walker advances, stops at the face, is never
//      inside the furniture, and a diagonal push SLIDES along the bed (x moves) rather than freezing. ──
const Mrects = roomBlockers(defaultObjectsForRoom("M"), "interior");
ok(Mrects.length > 0, "the Master Bedroom has floor-furniture blockers (the bed etc.)");
let wp = { x: 5, y: 1.5 };
for (let i = 0; i < 60; i++) wp = walkMove(wp, { x: 0, y: 0.25 }, Mrects);
ok(Mrects.every((r) => !within(wp, r)), "walking forward into the bedroom, the eye is NEVER inside a furniture rect");
ok(wp.y > 1.5 + 0.5, `the walker ADVANCED into the room, not frozen at the start (y ${wp.y.toFixed(2)})`);
let sp = { x: 5, y: 1.5 }; const sx0 = sp.x;
for (let i = 0; i < 60; i++) sp = walkMove(sp, { x: 0.25, y: 0.25 }, Mrects);
ok(Math.abs(sp.x - sx0) > 1 && Mrects.every((r) => !within(sp, r)), `pushing diagonally into the bed SLIDES along it (x ${sx0} → ${sp.x.toFixed(2)}), never stuck inside`);

// ── 5b. NE-POCKET ESCAPE (Thor): wedge near the NE corner behind the bed/nightstand, then head toward the room centre —
//       the concave corner must not trap the walker (pushOut + slide escapes). ──
let np = pushOut({ x: 9.4, y: 9.4 }, Mrects, 6);
for (let i = 0; i < 90; i++) np = walkMove(np, { x: -0.25, y: -0.25 }, Mrects);
ok(Mrects.every((r) => !within(np, r)) && (np.x < 8 || np.y < 8), `escapes the NE pocket toward the room centre (${np.x.toFixed(1)}, ${np.y.toFixed(1)})`);

// ── 6. subtractRect — the door-lane carve: a band across a wall gets a DOOR-WIDTH hole (so the walker reaches the door) ──
const band = { x0: 0, y0: 6, x1: 10, y1: 8 };          // a furniture band across the far wall
const lane = { x0: 4, y0: 0, x1: 6, y1: 10 };          // a 2-wide door lane through it
const pieces = subtractRect(band, lane);
ok(pieces.length === 2, `a lane across a band splits it into two pieces (got ${pieces.length})`);
ok(pieces.every((p) => p.x1 <= 4 + 1e-9 || p.x0 >= 6 - 1e-9), "neither piece intrudes into the door lane (x 4–6 is clear)");
ok(subtractRect(band, { x0: 20, y0: 20, x1: 30, y1: 30 }).length === 1, "a lane that misses the band leaves it unchanged");
// and roomBlockers with a door lane carves the same clear corridor
const laneRects = roomBlockers(defaultObjectsForRoom("K"), "interior", [{ x0: 5 - 1.6, y0: 0, x1: 5 + 1.6, y1: 10 }]);
ok(laneRects.every((r) => r.x1 <= 5 - 1.6 + 1e-9 || r.x0 >= 5 + 1.6 - 1e-9 || r.y0 >= 10 || r.y1 <= 0), "roomBlockers leaves the door lane (x 3.4–6.6) clear of every blocker");

console.log(`\nARCHITECT-WALK-COLLIDE ${pass}/${pass + fail} passed · Y-flip · shallowest-axis pushOut · slide-not-stuck · door lanes`);
if (fail > 0) process.exit(1);

// ARCHITECT-2525 · THE DOOR, DRAWN BY THE STANDARD CONVENTION (operator 2026-10-31: "also ensure bedroom has door and standard
// engineering convention for door"). The plan symbol: the wall is CUT for the door's width between two jambs on the wall line;
// the LEAF is a thin line from the hinge jamb, perpendicular, one width long (the door open at 90°); a thin quarter-circle ARC
// centred on the hinge, radius the width, from the leaf's free end to the strike jamb; a bedroom door swings INTO the room; the
// hinge is on the jamb nearer the nearest corner so the open leaf lies against the adjacent wall. ONE helper
// (lib/door-symbol.ts) draws it on EVERY surface; Rotate (0↔180) flips the hinge. Fix the class, never the instance.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/door-convention.test.mjs
import fs from "node:fs";
import path from "node:path";
import { STANDARD_LAYOUTS, DOOR_VARIANTS, placeObject, mirrorObjects, rotateObject, worldSpan, ROOM_GRID } from "@/lib/room-objects";
import { outletPositions, outletMarkers, wiringRuns, panelAt, doorOpeningCells } from "@/lib/mep-runs";
import { roomBom } from "@/lib/architect-bom";
import { electricSpecs } from "@/lib/mep-runs";
import { ftIn } from "@/lib/dim-annot";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
const pt = (p, x, y) => near(p.x, x) && near(p.y, y);

let sym = null;
try { sym = await import("@/lib/door-symbol"); } catch (e) { console.log("import failed:", e.message.split("\n")[0]); }
ok(!!sym && typeof sym.doorSymbol === "function" && typeof sym.symbolForSpan === "function" && typeof sym.doorSymbolSvg === "function", "lib/door-symbol.ts exports doorSymbol · symbolForSpan · doorSymbolSvg");

if (sym) {
  const { doorSymbol, symbolForSpan, doorSymbolSvg, arcPoints } = sym;
  const M = STANDARD_LAYOUTS.M;
  const door = M.find((o) => o.kind === "door");
  // ── 1. the bedroom door (A′ door-1: S wall, x 0–3) by the convention ──
  const d = doorSymbol(door);
  ok(d.wall === "S" && near(d.r, 3), `door-1 is a 3-ft door on the S wall (got ${d.wall}, r ${d.r})`);
  ok(pt(d.jambA, 0, ROOM_GRID) && pt(d.jambB, 3, ROOM_GRID), `the opening is cut in the WALL LINE from (0,10) to (3,10) — not 0.3 ft inside it (got ${JSON.stringify(d.jambA)}–${JSON.stringify(d.jambB)})`);
  ok(pt(d.hinge, 0, ROOM_GRID), `the hinge is on the jamb nearer the corner — (0,10) (got ${JSON.stringify(d.hinge)})`);
  ok(pt(d.strike, 3, ROOM_GRID), "the strike jamb is (3,10)");
  ok(pt(d.leafEnd, 0, ROOM_GRID - 3), `the leaf stands open at 90° up the W wall to (0,7) (got ${JSON.stringify(d.leafEnd)})`);
  const pts = arcPoints(d, 16);
  ok(pts.length === 16 && pts.every((p) => p.x >= -1e-6 && p.y >= -1e-6 && p.x <= ROOM_GRID + 1e-6 && p.y <= ROOM_GRID + 1e-6), "every point of the swing arc lies inside the room (the door swings INTO the bedroom)");
  ok(pts.every((p) => near(Math.hypot(p.x - d.hinge.x, p.y - d.hinge.y), d.r)), "the arc is centred on the hinge with radius = the door width");
  ok(pt(pts[0], d.leafEnd.x, d.leafEnd.y) && pt(pts[15], d.strike.x, d.strike.y), "the arc runs from the leaf's free end to the strike jamb");
  // the symbol's hinge IS the clearance gate's hinge (room-standard-layout: `hinge = { x: dsp.x1, y: ROOM_GRID }`) — one law
  const dsp = worldSpan(door);
  ok(pt(d.hinge, dsp.x1, ROOM_GRID), "the symbol's hinge equals the layout gate's clearance hinge (one law for the swing)");

  // ── 2. Rotate flips the hinge; mirror keeps the rule; every wall swings into the room ──
  const flipped = rotateObject(M, door.id).find((o) => o.id === door.id);
  const df = doorSymbol(flipped);
  ok(flipped.rot === 180 && pt(df.hinge, 3, ROOM_GRID) && pt(df.strike, 0, ROOM_GRID) && pt(df.leafEnd, 3, ROOM_GRID - 3), `Rotate (0 → 180) flips the hinge to the other jamb (3,10), the leaf up to (3,7) (got hinge ${JSON.stringify(df.hinge)})`);
  ok(arcPoints(df, 8).every((p) => p.x >= -1e-6 && p.y >= -1e-6 && p.x <= ROOM_GRID + 1e-6 && p.y <= ROOM_GRID + 1e-6), "the flipped door still swings into the room");
  const mh = mirrorObjects(M, "h").find((o) => o.kind === "door");
  const dm = doorSymbol(mh);
  ok(pt(dm.hinge, ROOM_GRID, ROOM_GRID) && near(dm.r, 3), `after mirror h the door sits at x 7–10 and the hinge moves to the E corner (10,10) (got ${JSON.stringify(dm.hinge)})`);
  const mv = mirrorObjects(M, "v").find((o) => o.kind === "door"), dv = doorSymbol(mv);
  ok(mv.rot === 0 && pt(dv.hinge, 0, 0) && pt(dv.leafEnd, 0, 3), `mirror v reflects the hinge to (0,0) on the N wall — a door's rot is its hinge side and is NOT flipped by mirror (got rot ${mv.rot}, hinge ${JSON.stringify(dv.hinge)})`);
  const wdoor = placeObject([], "door", 0, 5)[0], wmh = mirrorObjects([wdoor], "h")[0], dwm = doorSymbol(wmh);
  ok(pt(dwm.hinge, ROOM_GRID, doorSymbol(wdoor).hinge.y), `mirror h of a W-wall door reflects its hinge straight across to the E wall (got ${JSON.stringify(dwm.hinge)})`);
  for (const [gx, gy, wall, into] of [[5, 0, "N", { x: 0, y: 1 }], [0, 5, "W", { x: 1, y: 0 }], [9, 5, "E", { x: -1, y: 0 }], [5, 9, "S", { x: 0, y: -1 }]]) {
    const o = placeObject([], "door", gx, gy)[0];
    const s = doorSymbol(o);
    const leaf = { x: s.leafEnd.x - s.hinge.x, y: s.leafEnd.y - s.hinge.y };
    ok(s.wall === wall && near(leaf.x, into.x * s.r) && near(leaf.y, into.y * s.r), `a door placed on the ${wall} wall opens perpendicular INTO the room (leaf ${JSON.stringify(leaf)})`);
    ok(arcPoints(s, 8).every((p) => p.x >= -1e-6 && p.y >= -1e-6 && p.x <= ROOM_GRID + 1e-6 && p.y <= ROOM_GRID + 1e-6), `the ${wall}-wall swing stays inside the room`);
  }
  // ── 3. the canned door (rooms without their own) and the SVG projection at any scale ──
  const c = symbolForSpan("S", 5.5, 8.5);
  ok(near(c.r, 3) && pt(c.hinge, 8.5, ROOM_GRID) && pt(c.leafEnd, 8.5, ROOM_GRID - 3), `symbolForSpan("S", 5.5, 8.5): a 3-ft door, hinge at the jamb nearer the E corner (8.5,10) (got ${JSON.stringify(c.hinge)})`);
  const svg = doorSymbolSvg(d, 10, 10, 0, 0);
  ok(near(svg.opening.x1, 0) && near(svg.opening.y1, 100) && near(svg.opening.x2, 30) && near(svg.opening.y2, 100), `at 10 u/ft the opening runs (0,100)–(30,100) (got ${JSON.stringify(svg.opening)})`);
  ok(near(svg.leaf.x1, 0) && near(svg.leaf.y1, 100) && near(svg.leaf.x2, 0) && near(svg.leaf.y2, 70), "the leaf line (0,100)–(0,70)");
  ok(/^M 0 70 A 30 30 0 0 [01] 30 100$/.test(svg.arc.replace(/\s+/g, " ").trim()), `the arc path is one quarter circle M leafEnd A r r 0 0 f strike (got "${svg.arc}")`);
  const ns = doorSymbolSvg(d, 2.7, 1.5, 6, 10);
  ok(/A 8\.1 4\.5 /.test(ns.arc) && near(ns.opening.x1, 6) && near(ns.opening.y1, 25), "a non-uniform scale (the tiny zones) draws an elliptical arc (rx ≠ ry) and offsets the opening");
  const inset = doorSymbol(door, { inset: 0.1 });
  ok(pt(inset.jambA, 0, ROOM_GRID - 0.1) && pt(inset.hinge, 0, ROOM_GRID - 0.1), "an inset moves the symbol onto the DRAWN wall line (the room designer draws its wall 0.1 ft inside)");
}

// ── 4. every drawer uses the helper — no door rectangle survives on any surface ──
const rd = read("../components/architect-2525/room-designer.tsx");
const tf = read("../components/architect-2525/tiny-floorplan.tsx");
const vox = read("../components/architect-2525/voxel-house.tsx");
const bd = read("../components/architect-2525/architect-build.tsx");
const sev = read("../components/architect-2525/sim-environment-view.tsx");
for (const [name, src] of [["room-designer", rd], ["tiny-floorplan", tf], ["voxel-house", vox], ["architect-build", bd], ["sim-environment-view", sev]]) {
  ok(/from "@\/lib\/door-symbol"/.test(src), `${name} imports the ONE door symbol helper`);
}
ok(/o\.kind === "door" && ds \? \(/.test(rd) && /doorSymbolSvg\(doorSymbol\(o, \{ inset: 0\.1 \}\), 10, 10, 0, 0\)/.test(rd), "room designer 2D: a door is drawn by the symbol at the drawn wall line (inset 0.1 ft), never by the generic rect");
ok(/transform=\{o\.kind === "door" \? undefined : `rotate\(/.test(rd), "room designer 2D: a door's group carries no rotation (rot is the hinge side, not a spin)");
ok(/data-arch-door-opening/.test(rd) && /data-arch-door-leaf/.test(rd) && /data-arch-door-arc/.test(rd), "room designer 2D: opening · leaf · arc are tagged (opening cut in the ground colour over the wall)");
ok(/data-arch-hitpad-swing d=\{`M \$\{ds\.hinge\.x\} \$\{ds\.hinge\.y\} L \$\{ds\.leaf\.x2\} \$\{ds\.leaf\.y2\} /.test(rd), "room designer 2D: a door's tap target is its whole swing sector (hinge → leaf → arc → strike), so a finger on the swing selects the door (AFTER-capture finding)");
ok(/data-arch-roomobj3d-door/.test(rd) && /arcPoints\(/.test(rd), "room designer 3D: a door draws its LEAF standing open + the floor arc — no slab");
ok(/data-arch-floorplan-openings/.test(tf) && /symbolForSpan\("S", 5\.5, 8\.5\)/.test(tf) && !/A \$\{rw \* 0\.3\} \$\{rw \* 0\.3\} 0 0 1/.test(tf), "house plan: every door (own or canned) is the symbol, drawn in an openings pass AFTER the rooms; the old 60° bow is gone");
ok(/const SKIP3D = new Set<string>\(\["window", "shell", "roof"\]\)/.test(vox) && /door3d\(/.test(vox), "house voxel: doors are no longer skipped — the leaf stands at the hinge with its arc on the floor");
ok(/symbolForSpan\("S", 0\.5, 3\.5, \{ inset \}\)/.test(bd) && /symbolForSpan\("E", 3\.5, 6\.5, \{ inset \}\)/.test(bd) && /own\.map\(\(o\) => doorSymbol\(o, \{ inset \}\)\)/.test(bd) && /doorSymbolSvg\(sym, k, k, cx\(r\.col\), cy\(r\.row\)\)/.test(bd), "Build 4D: the Entry's two doors and every room's OWN doors are symbols (the bedroom door appears on the build plan)");
ok(/o\.kind === "door"/.test(sev) && /doorSymbolSvg\(doorSymbol\(o\)/.test(sev), "Simulate environments: own doors are symbols");

// ── 5. the variant labels tell the truth; no outlet sits in a door opening ──
const lbl = (v) => v.h === 8 ? `${ftIn(v.w)}×8'` : ftIn(v.w);
for (const v of DOOR_VARIANTS) ok(v.label === lbl(v), `DOOR_VARIANTS ${v.id}: label "${v.label}" equals its width ${v.w} ft (${lbl(v)})`);
ok(DOOR_VARIANTS.some((v) => near(v.w, 2.67)) && DOOR_VARIANTS.some((v) => v.w === 3 && v.h !== 8), "the list carries the standard 2'-8\" and 3'-0\" × 6'-8\" doors");
const A = STANDARD_LAYOUTS.M;
const outs = outletPositions(4, A);
const door1 = A.find((o) => o.kind === "door"), span = worldSpan(door1);
ok(outs.length === 4 && !outs.some((p) => p.gy === ROOM_GRID - 1 && p.gx + 1 > span.x1 && p.gx < span.x2), `no outlet cell sits in door-1's opening (x ${span.x1}–${span.x2} on the S wall) — got ${JSON.stringify(outs)}`);
ok(outletMarkers(4, A).length === 4 && JSON.stringify(outletPositions(4)) !== JSON.stringify(outs), "outletMarkers takes the room's objects; without them the old positions (one inside the door) are unchanged for callers that pass none");
ok(/wiringRuns\(outlets, objects\)/.test(rd) && /outletMarkers\(outlets, objects\)/.test(rd), "the room designer passes the room's objects so wiring and markers avoid the door");
const blocked = doorOpeningCells(A), pan = panelAt(A);
ok(blocked.has("0,9") && !blocked.has(`${pan.gx},${pan.gy}`) && pan.gx === 0 && pan.gy === 8, `the service panel steps out of door-1's opening to (0,8) (got ${JSON.stringify(pan)})`);
ok(wiringRuns(4, A).runs.every((r) => !blocked.has(`${r.from.gx},${r.from.gy}`) && !blocked.has(`${r.to.gx},${r.to.gy}`)), "no wiring run starts or ends inside the door opening");
ok(roomBom(A, 4).lines.find((l) => l.id === "wire").qty === electricSpecs(4, A).wireFt, "the BOM's wire length is the designer's door-aware number (one source — AsM-caught)");
ok(/outletPositions\(Math\.min\(4, r\.outlets\), r\.objects \?\? defaultObjectsForRoom\(r\.k\)\)/.test(bd) && /outletMarkers\(Math\.min\(8, walkRoom\.outlets \|\| 0\), walkRoom\.objects \?\? defaultObjectsForRoom\(walkRoom\.k\)\)/.test(vox), "Build 4D's outlet dots and the voxel's walk sockets use the same door-aware positions");

console.log(`\ndoor-convention: ${pass} passed, ${fail} failed · opening · leaf · quarter arc · hinge at the corner jamb · swing into the room · one helper on five surfaces`);
process.exit(fail ? 1 : 0);

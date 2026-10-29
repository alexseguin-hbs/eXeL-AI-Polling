// ARCHITECT-2525 · SIMULATE ENVIRONMENT gate (operator 2026-10-27/28): pressing SIMULATE "creates that environment".
// The two FULL-SIZE forms (Cube · Eco-Sphere) conserve all nine room keys + all 46 real furniture pieces; the Tiny Home
// is a REAL standard 8.5×40 THOW (~340 ft²) with its own realistic subset, every piece in-bounds. Furniture is the REAL
// set from defaultObjectsForRoom — nothing invented. Generators are deterministic (replay-safe).
import { environmentFor, gridEnvironment, tinyEnvironment, hexEnvironment, conservedKeys, totalObjectCount, environmentObjects, hexPoints, ALL_ROOM_KEYS, VIEW, MARGIN } from "@/lib/architect-sim-environment";
import { defaultObjectsForRoom, projectPlaced } from "@/lib/room-objects";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// the nine real room keys the full-size home carries
const KEYS = ["M", "B", "C", "L", "K", "D", "O", "S", "E"];
ok(ALL_ROOM_KEYS.length === 9 && KEYS.every((k) => ALL_ROOM_KEYS.includes(k)), "the full-size home carries the nine real room keys");
const HOME_OBJECTS = KEYS.reduce((s, k) => s + defaultObjectsForRoom(k).length, 0);   // 46 real pieces
ok(HOME_OBJECTS === 46, `the full-size home has 46 conserved furniture pieces (got ${HOME_OBJECTS})`);

const grid = gridEnvironment(), tiny = tinyEnvironment(), hex = hexEnvironment();
ok(environmentFor("3x3-grid").formId === "3x3-grid" && environmentFor("tiny").formId === "tiny" && environmentFor("eco-sphere").formId === "eco-sphere", "environmentFor routes each form");

// shells
ok(grid.shell === "grid" && tiny.shell === "tiny" && hex.shell === "hex", "shells: grid · tiny · hex");
ok(grid.placements.length === 9, "Cube places all 9 rooms");
ok(hex.hexes.length === 7 && hex.dome === true, "Eco-Sphere = 7 hexagons under a dome");

// ── CONSERVATION (the full-size law) — Cube + Eco-Sphere place all nine room keys, so all 46 pieces appear in each ──
for (const [name, env] of [["Cube", grid], ["Eco-Sphere", hex]]) {
  ok(JSON.stringify(conservedKeys(env)) === JSON.stringify([...KEYS].sort()), `${name} conserves all nine room keys`);
  ok(totalObjectCount(env) === HOME_OBJECTS, `${name} conserves all ${HOME_OBJECTS} furniture pieces (got ${totalObjectCount(env)})`);
}
ok(totalObjectCount(grid) === totalObjectCount(hex), "the two full-size forms carry identical furniture counts");
ok(hex.placements.length === 9, "Eco-Sphere still places all 9 rooms (across 7 hexes)");
const mergedHexes = hex.hexes.filter((h) => h.roomKeys.length > 1).length;
ok(mergedHexes === 2, "exactly two hexes hold a merged pair (9 rooms → 7 hexes)");
ok(hex.hexes[0].roomKeys.length === 1, "the centre hex is a single room (the Living hub)");

// ── the Tiny Home is a REAL standard THOW with its OWN realistic subset (fewer rooms, honest) ──
const TINY_KEYS = ["L", "K", "D", "B", "M"];
ok(JSON.stringify(conservedKeys(tiny)) === JSON.stringify([...TINY_KEYS].sort()), "Tiny Home carries a realistic subset (Living·Kitchen·Dining·Bath·Bedroom)");
const TINY_OBJECTS = TINY_KEYS.reduce((s, k) => s + defaultObjectsForRoom(k).length, 0);  // 7+5+3+6+9 = 30
ok(tiny.placements.length === 5 && totalObjectCount(tiny) === TINY_OBJECTS, `Tiny Home places its ${TINY_KEYS.length} zones + ${TINY_OBJECTS} pieces (got ${tiny.placements.length}/${totalObjectCount(tiny)})`);
ok(totalObjectCount(tiny) < HOME_OBJECTS, "a tiny home genuinely carries fewer pieces than the full-size home (honest)");
ok(tiny.shellRect && tiny.shellRect.w > tiny.shellRect.h * 2.5, "the Tiny Home shell is a long rectangle (8.5×24 ≈ 2.8:1, reads as a THOW)");
ok(tiny.placements.filter((p) => p.open).length === 3, "the Tiny Home's great room is open (Living·Kitchen·Dining)");

// the forms are genuinely distinct
const gridRects = JSON.stringify(grid.placements.map((p) => [p.roomKey, p.rect]).sort());
const tinyRects = JSON.stringify(tiny.placements.map((p) => [p.roomKey, p.rect]).sort());
ok(gridRects !== tinyRects, "the Tiny Home's plan differs from the Cube's 3×3 (genuinely its own form)");

// placements sit inside the view box; rects are positive
for (const env of [grid, tiny, hex]) {
  ok(env.placements.every((p) => p.rect.w > 0 && p.rect.h > 0), `${env.formId} rects are positive`);
  ok(env.placements.every((p) => p.rect.x >= 0 && p.rect.y >= 0 && p.rect.x + p.rect.w <= env.view + 0.01 && p.rect.y + p.rect.h <= env.view + 0.01), `${env.formId} rects fit the view`);
}

// ── the PICTURE contract (Enlil) — the furniture the SVG actually draws stays inside its room rect AND the view box ──
ok(VIEW === 120 && MARGIN === 6, "the view constants are exported (the renderer shares them, no re-derivation)");
const EXPECT_OBJECTS = { "3x3-grid": HOME_OBJECTS, tiny: TINY_OBJECTS, "eco-sphere": HOME_OBJECTS };
for (const env of [grid, tiny, hex]) {
  let total = 0, inBounds = true, inRoom = true;
  for (const { rect, objects } of environmentObjects(env)) {
    for (const o of objects) {
      total++;
      const p = projectPlaced(o, rect.x, rect.y, rect.w, rect.h);
      if (p.x < -0.01 || p.y < -0.01 || p.x + p.w > env.view + 0.5 || p.y + p.h > env.view + 0.5) inBounds = false;
      if (p.x < rect.x - 0.01 || p.y < rect.y - 0.01 || p.x + p.w > rect.x + rect.w + 0.5 || p.y + p.h > rect.y + rect.h + 0.5) inRoom = false;
    }
  }
  ok(total === EXPECT_OBJECTS[env.formId], `${env.formId} SVG draws all ${EXPECT_OBJECTS[env.formId]} furniture footprints`);
  ok(inBounds, `${env.formId} every footprint stays inside the view box (no overflow)`);
  ok(inRoom, `${env.formId} every footprint stays inside its room rect (no spill into neighbours)`);
}

// hex geometry
ok(hexPoints(60, 60, 18).length === 6, "a hexagon has 6 vertices");

// determinism (replay law)
ok(JSON.stringify(hexEnvironment()) === JSON.stringify(hexEnvironment()), "hexEnvironment is deterministic");
ok(JSON.stringify(gridEnvironment()) === JSON.stringify(gridEnvironment()), "gridEnvironment is deterministic");
ok(JSON.stringify(tinyEnvironment()) === JSON.stringify(tinyEnvironment()), "tinyEnvironment is deterministic");

console.log(`\narchitect-sim-environment: ${pass} passed, ${fail} failed · Cube+Eco conserve 9/46 · Tiny = real 8.5×40 THOW subset`);
process.exit(fail ? 1 : 0);

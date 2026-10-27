// ARCHITECT-2525 · SIMULATE ENVIRONMENT gate (operator 2026-10-27): pressing SIMULATE "creates that environment".
// The LAW: "all rooms furniture of 3x3 should be placed somewhere in Tiny home and Hex Ecosphere." So every form places
// all nine real room keys (furniture conserved), the Eco-Sphere is 7 hexagons (1 centre + 6), and the generators are
// deterministic (replay-safe). Furniture is the REAL set from defaultObjectsForRoom — nothing invented.
import { environmentFor, gridEnvironment, openEnvironment, hexEnvironment, conservedKeys, totalObjectCount, environmentObjects, hexPoints, ALL_ROOM_KEYS, VIEW, MARGIN } from "@/lib/architect-sim-environment";
import { defaultObjectsForRoom, projectPlaced } from "@/lib/room-objects";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// the nine real room keys
const KEYS = ["M", "B", "C", "L", "K", "D", "O", "S", "E"];
ok(ALL_ROOM_KEYS.length === 9 && KEYS.every((k) => ALL_ROOM_KEYS.includes(k)), "the home carries the nine real room keys");
const HOME_OBJECTS = KEYS.reduce((s, k) => s + defaultObjectsForRoom(k).length, 0);   // 46 real pieces
ok(HOME_OBJECTS === 46, `the home has 46 conserved furniture pieces (got ${HOME_OBJECTS})`);

const grid = gridEnvironment(), open = openEnvironment(), hex = hexEnvironment();
ok(environmentFor("3x3-grid").formId === "3x3-grid" && environmentFor("tiny").formId === "tiny" && environmentFor("eco-sphere").formId === "eco-sphere", "environmentFor routes each form");

// shells
ok(grid.shell === "grid" && open.shell === "open" && hex.shell === "hex", "shells: grid · open · hex");
ok(grid.placements.length === 9 && open.placements.length === 9, "Cube + Tiny place all 9 rooms");
ok(hex.hexes.length === 7 && hex.dome === true, "Eco-Sphere = 7 hexagons under a dome");

// ── CONSERVATION (the operator's law) — every form places all nine room keys, so all 46 pieces appear in each ──
for (const [name, env] of [["Cube", grid], ["Tiny Home", open], ["Eco-Sphere", hex]]) {
  ok(JSON.stringify(conservedKeys(env)) === JSON.stringify([...KEYS].sort()), `${name} conserves all nine room keys`);
  ok(totalObjectCount(env) === HOME_OBJECTS, `${name} conserves all ${HOME_OBJECTS} furniture pieces (got ${totalObjectCount(env)})`);
}
ok(totalObjectCount(grid) === totalObjectCount(open) && totalObjectCount(open) === totalObjectCount(hex), "furniture count is identical across all three forms");

// Eco-Sphere merges nine rooms into seven hexagons (two merges) and still places all nine
ok(hex.placements.length === 9, "Eco-Sphere still places all 9 rooms (across 7 hexes)");

// the OPEN Tiny Home is GENUINELY open — not the Cube's identical 3×3 cells (Enki)
const gridRects = JSON.stringify(grid.placements.map((p) => [p.roomKey, p.rect]).sort());
const openRects = JSON.stringify(open.placements.map((p) => [p.roomKey, p.rect]).sort());
ok(gridRects !== openRects, "Tiny Home's open plan differs from the Cube's 3×3 (genuinely open, not a clone)");
const mergedHexes = hex.hexes.filter((h) => h.roomKeys.length > 1).length;
ok(mergedHexes === 2, "exactly two hexes hold a merged pair (9 rooms → 7 hexes)");
ok(hex.hexes[0].roomKeys.length === 1, "the centre hex is a single room (the Living hub)");

// placements sit inside the view box; rects are positive
for (const env of [grid, open, hex]) {
  ok(env.placements.every((p) => p.rect.w > 0 && p.rect.h > 0), `${env.formId} rects are positive`);
  ok(env.placements.every((p) => p.rect.x >= 0 && p.rect.y >= 0 && p.rect.x + p.rect.w <= env.view + 0.01 && p.rect.y + p.rect.h <= env.view + 0.01), `${env.formId} rects fit the view`);
}

// ── the PICTURE contract (Enlil) — the furniture the SVG actually draws stays inside its room rect AND the view box,
//    so a mis-projection / overflow / dropped placement fails the gate, not just a count. Gates pixels, not only lib counts. ──
ok(VIEW === 120 && MARGIN === 6, "the view constants are exported (the renderer shares them, no re-derivation)");
for (const env of [grid, open, hex]) {
  let total = 0, inBounds = true, inRoom = true;
  for (const { rect, objects } of environmentObjects(env)) {
    for (const o of objects) {
      total++;
      const p = projectPlaced(o, rect.x, rect.y, rect.w, rect.h);
      if (p.x < -0.01 || p.y < -0.01 || p.x + p.w > env.view + 0.5 || p.y + p.h > env.view + 0.5) inBounds = false;
      if (p.x < rect.x - 0.01 || p.y < rect.y - 0.01 || p.x + p.w > rect.x + rect.w + 0.5 || p.y + p.h > rect.y + rect.h + 0.5) inRoom = false;
    }
  }
  ok(total === 46, `${env.formId} SVG draws all 46 furniture footprints`);
  ok(inBounds, `${env.formId} every footprint stays inside the view box (no overflow)`);
  ok(inRoom, `${env.formId} every footprint stays inside its room rect (no spill into neighbours)`);
}

// hex geometry
ok(hexPoints(60, 60, 18).length === 6, "a hexagon has 6 vertices");

// determinism (replay law)
ok(JSON.stringify(hexEnvironment()) === JSON.stringify(hexEnvironment()), "hexEnvironment is deterministic");
ok(JSON.stringify(gridEnvironment()) === JSON.stringify(gridEnvironment()), "gridEnvironment is deterministic");

console.log(`\narchitect-sim-environment: ${pass} passed, ${fail} failed · 3 forms × same home, furniture conserved, 7-hex Eco-Sphere`);
process.exit(fail ? 1 : 0);

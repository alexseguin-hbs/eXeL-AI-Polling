// ARCHITECT-2525 room-layout lock — pure move/swap/resize/sqft semantics (P3 cube modification).
// Run: node --experimental-strip-types tests/room-layout.test.mjs
import { TINY_ROOM_LAYOUT, cloneLayout, roomAt, layoutSqft, moveRoomInLayout, resizeRoomInLayout, TINY_SIDE_FT, setRoomElement, toggleRoomFurniture, layoutTotals, moduleHash, ELEMENT_MAX } from "../lib/room-layout.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };

// 1. The finalized Tiny Home = 9 rooms, 900 ft², 30 ft side.
ok(TINY_ROOM_LAYOUT.length === 9, "9 rooms");
ok(layoutSqft(TINY_ROOM_LAYOUT) === 900, "default layout = 900 ft²");
ok(TINY_SIDE_FT === 30, "30 ft side");

// 2. clone is a deep copy (mutating the clone never touches the source).
const c = cloneLayout(); c[0].row = 2;
ok(TINY_ROOM_LAYOUT[0].row === 0, "cloneLayout is a deep copy");

// 3. roomAt finds the occupant of a cell.
ok(roomAt(TINY_ROOM_LAYOUT, 1, 1)?.k === "K", "roomAt(1,1) = Kitchen");
ok(roomAt(TINY_ROOM_LAYOUT, 0, 0)?.k === "M", "roomAt(0,0) = Master Bedroom");

// 4. move swaps with the displaced room and keeps the grid full.
const moved = moveRoomInLayout(TINY_ROOM_LAYOUT, "master-bed", 1, 0); // M (0,0) → (1,0), swaps with L
ok(roomAt(moved, 1, 0)?.k === "M", "M moved to (1,0)");
ok(roomAt(moved, 0, 0)?.k === "L", "L swapped back to (0,0)");
ok(moved.length === 9 && new Set(moved.map((r) => `${r.row},${r.col}`)).size === 9, "grid still full, no overlaps");

// 5. out-of-bounds move is a no-op (returns an equivalent layout).
const oob = moveRoomInLayout(TINY_ROOM_LAYOUT, "master-bed", -1, 0); // north of row 0
ok(roomAt(oob, 0, 0)?.k === "M", "out-of-bounds move is a no-op");

// 6. move is pure — the source is never mutated.
ok(TINY_ROOM_LAYOUT[0].row === 0 && TINY_ROOM_LAYOUT[0].col === 0, "moveRoomInLayout does not mutate source");

// 7. resize within the 10-ft envelope grows area; clamps to max 2 cells.
const grown = resizeRoomInLayout(TINY_ROOM_LAYOUT, "living", 2, 1);
ok(grown.find((r) => r.id === "living").w === 2, "living stretched to 2 cells wide");
ok(layoutSqft(grown) === 1000, "sqft tracks the stretch (900 + 100)");
const clamped = resizeRoomInLayout(TINY_ROOM_LAYOUT, "living", 9, 9);
ok(clamped.find((r) => r.id === "living").w === 2, "resize clamps to max 2 cells (within 10 ft)");

// 8. per-room element editing (Enter-room → optimize it only).
const w0 = TINY_ROOM_LAYOUT.find((r) => r.id === "living").windows;
const inc = setRoomElement(TINY_ROOM_LAYOUT, "living", "windows", 1);
ok(inc.find((r) => r.id === "living").windows === w0 + 1, "setRoomElement +1 window");
const clampHi = setRoomElement(TINY_ROOM_LAYOUT, "living", "windows", 99);
ok(clampHi.find((r) => r.id === "living").windows === ELEMENT_MAX, "element clamps to ELEMENT_MAX");
const clampLo = setRoomElement(TINY_ROOM_LAYOUT, "entry", "outlets", -99);
ok(clampLo.find((r) => r.id === "entry").outlets === 0, "element clamps to 0 (no negative)");
ok(TINY_ROOM_LAYOUT.find((r) => r.id === "living").windows === w0, "setRoomElement is pure (source unchanged)");

// 9. furniture toggle + totals = Σ rooms + deterministic module hash.
ok(toggleRoomFurniture(TINY_ROOM_LAYOUT, "office").find((r) => r.id === "office").furniture === false, "toggleRoomFurniture flips off");
const tot = layoutTotals(TINY_ROOM_LAYOUT);
ok(tot.rooms === 9 && tot.windows === TINY_ROOM_LAYOUT.reduce((s, r) => s + r.windows, 0), "layoutTotals = Σ per-room");
ok(moduleHash(TINY_ROOM_LAYOUT) === moduleHash(cloneLayout()) && moduleHash(inc) !== moduleHash(TINY_ROOM_LAYOUT), "moduleHash deterministic + changes on edit");

console.log(`\nROOM-LAYOUT ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);

// ARC-37.02 — the legacy-view adapter: canonical Runtime → RoomCell[] (structural fields from canonical, every
// non-canonical field zeroed — no refabricated openings), with a semantic bay_code→(row,col) mapping; and
// applyEdgeEdit bridging a legacy edge drag to the canonical edge engine. Proven BEFORE any Block-D UI opens.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-legacy-view.test.mjs
import { buildProjectFromSeed } from "../lib/architect-2525/canonical/runtime.ts";
import { toRoomCells, applyEdgeEdit } from "../lib/architect-2525/canonical/legacy-view.ts";
import { TINY_HOME_V1 } from "../lib/architect-2525/seeds/tiny-home-v1.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

const p = buildProjectFromSeed(TINY_HOME_V1);
const cells = toRoomCells(p);
const byId = Object.fromEntries(cells.map((c) => [c.id, c]));

// ── nine RoomCells with the required legacy shape ──
ok(cells.length === 9, "9 RoomCells");
const REQ = ["id", "k", "label", "row", "col", "w", "d", "windows", "doors", "outlets", "furniture"];
ok(cells.every((c) => REQ.every((f) => f in c)), "every RoomCell carries all required legacy fields");

// ── structural fields from canonical ──
ok(byId.C1.k === "O" && byId.A2.k === "B" && byId.B2.k === "K", "k maps from canonical function (C1 OFFICE→O, A2 BATH→B, B2 KITCHEN→K)");
ok(cells.every((c) => c.w === 1 && c.d === 1), "seed Spaces are 1×1 cells (10ft each)");

// ── the non-canonical fields are ZEROED — no refabricated openings ──
ok(cells.every((c) => c.windows === 0 && c.doors === 0 && c.outlets === 0 && c.furniture === false && c.objects === undefined), "windows/doors/outlets=0, furniture=false, objects=undefined (bare Space boundaries)");

// ── semantic bay_code → (row,col): A north=row0, C south=row2; 1 west=col0, 3 east=col2 ──
ok(byId.C1.row === 2 && byId.C1.col === 0, "C1 → row 2 (south), col 0 (west)");
ok(byId.A3.row === 0 && byId.A3.col === 2, "A3 → row 0 (north), col 2 (east)");
ok(byId.A1.row === 0 && byId.A1.col === 0, "A1 → row 0, col 0");
ok(byId.C3.row === 2 && byId.C3.col === 2, "C3 → row 2, col 2");
ok(byId.B2.row === 1 && byId.B2.col === 1, "B2 → row 1, col 1 (centre)");

// ── pure / deterministic ──
ok(JSON.stringify(toRoomCells(p)) === JSON.stringify(toRoomCells(p)), "toRoomCells is pure/deterministic");

// ── applyEdgeEdit bridges to the canonical edge engine (exterior + interior + blocked) ──
const ext = applyEdgeEdit(p, "C1", "WEST", 304800);
ok(ext.ok && ext.preview.proposed_change.interior === false, "applyEdgeEdit C1 WEST → exterior preview");
const inte = applyEdgeEdit(p, "B2", "EAST", 304800);
ok(inte.ok && inte.preview.proposed_change.interior === true, "applyEdgeEdit B2 EAST → interior preview (neighbor B3)");
const blocked = applyEdgeEdit(p, "B2", "EAST", 2_500_000);
ok(!blocked.ok && /minimum/i.test(blocked.reason), "applyEdgeEdit past the floor → BLOCKED");

console.log(`\narchitect-legacy-view: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

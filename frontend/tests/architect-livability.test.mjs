// ARCHITECT-2525 · LIV-6 — THE LIVABILITY GATE (operator 2026-11-11 "make sq footage is livable 900 sq ft"). The house is
// provably a real home: CONNECTED (every room walkable, suite private) · LIT (every habitable room has daylight — a window or
// borrowed light through a cased opening) · FUNCTIONED (every room has its anchor furniture). The Overview SHOWS the computed
// headline, so the app proves the 900 ft² is livable rather than asserting it. lib/architect-livability.ts is the one source.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-livability.test.mjs
import { livabilityReport, litRooms, ROOM_FUNCTION, HABITABLE_KEYS } from "@/lib/architect-livability";
import { TINY_ROOM_LAYOUT } from "@/lib/room-layout";
import { defaultObjectsForRoom } from "@/lib/room-objects";
import fs from "node:fs";
import path from "node:path";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");

// ── 1. THE HOUSE IS LIVABLE ──
const r = livabilityReport();
ok(r.livable === true, "the 900 ft² house is LIVABLE (connected ∧ lit ∧ functioned)");
ok(r.headline === "900 ft² · 1 bed · 1 bath · livable", `the headline reads the computed truth (got "${r.headline}")`);
ok(r.connected, "connected — every room walkable from the front door, suite private");
ok(r.allHabitableLit, "lit — every habitable room (bedroom · living · office · dining) has daylight");
ok(r.allFunctioned, "functioned — every room carries its anchor furniture");
ok(r.bedrooms === 1 && r.baths === 1 && r.netSqft === 900, "1 bed · 1 bath · 900 ft² net");

// ── 2. BORROWED LIGHT is load-bearing: the windowless centre Kitchen is lit THROUGH its cased openings ──
ok(defaultObjectsForRoom("K").filter((o) => o.kind === "window").length === 0, "the Kitchen has no window of its own (it is the dead-centre cell)");
ok(r.lit.K === true, "the Kitchen is LIT anyway — borrowed light through the cased opening to the windowed Dining room");
const litNoCased = litRooms(TINY_ROOM_LAYOUT, (k) => defaultObjectsForRoom(k).filter((o) => !o.cased));
ok(!litNoCased.has("K"), "remove the cased openings and the Kitchen goes DARK — borrowed light is load-bearing (the social core earns its keep)");

// ── 3. every room is functioned by its anchor (a bedroom has a bed, a kitchen a stove, a bath a toilet …) ──
for (const rc of TINY_ROOM_LAYOUT) {
  const anchors = ROOM_FUNCTION[rc.k] ?? [];
  const objs = defaultObjectsForRoom(rc.k);
  ok(anchors.length === 0 || anchors.some((a) => objs.some((o) => o.kind === a)), `${rc.k} (${rc.label}) has its anchor furniture (${anchors.join("/")})`);
}

// ── 4. the Overview SHOWS the livability headline (source-scan) — the app proves it, not just the gate ──
const cmd = read("../components/architect-2525/command-ux1.tsx");
ok(/livabilityReport\(\)/.test(cmd) && /\.headline/.test(cmd), "the Overview reads livabilityReport().headline (the computed livability truth is shown)");
ok(/Livable/.test(cmd), "the Overview renders a Livable tile/line");

console.log(`\narchitect-livability: ${pass} passed, ${fail} failed · the 900 ft² is PROVABLY livable — connected · lit (borrowed light) · functioned`);
process.exit(fail ? 1 : 0);

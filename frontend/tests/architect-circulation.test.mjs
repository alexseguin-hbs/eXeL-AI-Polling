// ARCHITECT-2525 · LIV-1 — THE CIRCULATION GATE (operator 2026-11-11 "make sq footage is livable 900 sq ft"; 12-AsM plan
// review P0: the seeded house was door-DISCONNECTED — from the front door only 3/9 rooms were reachable, and the bath opened
// into the kitchen while the closet opened into the dining room). This gate LOCKS a walkable, livable topology on the ONE
// door-connectivity graph (lib/architect-circulation.ts): every room reachable from the front door; the master suite private
// and internally connected; no public room routed through a bedroom. A cased opening counts as a passage; a window does not.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-circulation.test.mjs
import { circulationReport, buildGraph, neighbourOf, reachable, isPassage, SUITE_KEYS, PUBLIC_KEYS, ENTRY_KEY } from "@/lib/architect-circulation";
import { TINY_ROOM_LAYOUT } from "@/lib/room-layout";
import { defaultObjectsForRoom } from "@/lib/room-objects";
import fs from "node:fs";
import path from "node:path";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// ── 1. the helper primitives ──
ok(neighbourOf({ row: 1, col: 1 }, "N") === "B" && neighbourOf({ row: 1, col: 1 }, "S") === "S" && neighbourOf({ row: 1, col: 1 }, "W") === "L" && neighbourOf({ row: 1, col: 1 }, "E") === "D", "neighbourOf maps the centre (Kitchen) to B/S/L/D on N/S/W/E");
ok(neighbourOf({ row: 0, col: 0 }, "N") === null && neighbourOf({ row: 0, col: 0 }, "W") === null, "neighbourOf returns null at the exterior shell (no neighbour)");
ok(isPassage({ kind: "door" }) && !isPassage({ kind: "window" }) && isPassage({ kind: "door", cased: true }), "a door (swing/cased) is a passage; a window is not");

// ── 2. THE LIVABLE INVARIANT on the shipped layout ──
const r = circulationReport();
ok(r.severed.length === 0, `every room is reachable from the front door (severed: ${r.severed.join(" ") || "none"})`);
ok(r.reachableFromEntry.length === 9, `all 9 rooms reachable from Entry (got ${r.reachableFromEntry.length})`);
ok(r.suiteConnected, "the master suite {M,B,C} is internally connected (bedroom → bath → closet)");
ok(r.suiteAttachPoints.length === 1 && r.suiteAttachPoints[0] === "L", `the suite attaches to the public zone at EXACTLY one door — the Living room (got ${r.suiteAttachPoints.join(" ")})`);
ok(r.publicThroughSuite.length === 0, `no public room is reached only by passing through a private suite room (got ${r.publicThroughSuite.join(" ") || "none"})`);

// ── 3. the cased opening IS the bridge (LIV-3): D↔K is a cased opening and the house is severed without it ──
ok(r.edges.includes("D-K"), "the Dining↔Kitchen cased opening is an edge (the social-core bridge)");
ok(r.edges.includes("B-M") && r.edges.includes("B-C"), "the ensuite (B↔M) and walk-in (B↔C) are edges — the private suite chain");
ok(!r.edges.includes("B-K") && !r.edges.includes("C-D"), "the bath no longer opens into the kitchen, nor the closet into the dining room (LIV-3 fixed the adjacencies)");
// prove the cased opening is LOAD-BEARING: treat cased openings as non-passages → the Kitchen (and its wet column) severs
const gNoCased = buildGraph(TINY_ROOM_LAYOUT, (k) => defaultObjectsForRoom(k).filter((o) => !o.cased));
const reachNoCased = reachable(gNoCased, ENTRY_KEY);
ok(!reachNoCased.has("K") || reachNoCased.size < 9, "the cased opening is load-bearing — without it the house is NOT fully connected (the D↔K bridge matters)");

// ── 4. LIV-5 — the 3D walk crosses ONLY at real openings (one opening model, not "walk through any wall") ──
const walkSrc = fs.readFileSync(path.resolve(path.dirname(new URL(import.meta.url).pathname), "../components/architect-2525/architect-walkthrough.tsx"), "utf8");
ok(/op\.N && canCrossDoor/.test(walkSrc) && /op\.S && canCrossDoor/.test(walkSrc), "the walk gates each crossing on a real opening (op.N/op.S …), not on bare adjacency");
ok(!/!!n\.N && canCrossDoor/.test(walkSrc), "the walk no longer crosses on bare neighbour adjacency (!!n.N) — the over-connecting model is gone");
ok(/const openWall = \{/.test(walkSrc) && /nbDoorCtr/.test(walkSrc), "the walk derives openWall from this room's AND the neighbour's placed openings (the shared-wall opening)");
ok(/openWall\.N \? doorOpen : null/.test(walkSrc), "the walk draws a doorway only where an opening exists, else a solid wall");

console.log(`\narchitect-circulation: ${pass} passed, ${fail} failed · every room walkable from the front door · suite private + connected · cased opening = the social-core bridge · the 3D walk crosses only at real openings`);
process.exit(fail ? 1 : 0);

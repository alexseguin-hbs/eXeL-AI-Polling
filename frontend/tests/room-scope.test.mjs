// ROOM-SCOPE lock — the context-scoped Vision Tree derivation (per-room infrastructure) is pure + deterministic and
// DERIVED from the palette (plumbing iff a wet fixture is offered), so tree/MEP/BOM can't diverge. Closet ⊉ plumbing.
// Run: node --experimental-strip-types --loader ./tests/ts-ext-loader.mjs tests/room-scope.test.mjs
import { roomSystems, isVisibleForRoom, ROOM_VISIBLE } from "../lib/architect-layers.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };
const PLUMB = "physical/plumbing", ELEC = "physical/electrical", COMMS = "physical/communications-low-voltage", EXT = "physical/exterior";

// ── Electrical is ALWAYS essential (operator: carry electrical for the entered room) ──
ok(["M", "B", "C", "L", "K", "D", "O", "S", "E"].every((k) => roomSystems(k).essential.includes(ELEC)), "Electrical is essential in every room");

// ── Plumbing iff the room's palette has a wet fixture ──
ok(roomSystems("B").essential.includes(PLUMB), "B Bath → Plumbing essential (toilet/tub/sink)");
ok(roomSystems("K").essential.includes(PLUMB) && roomSystems("K").essential.includes(ELEC), "K Kitchen → Plumbing + Electrical essential");
ok(roomSystems("S").essential.includes(PLUMB), "S Storage·Laundry → Plumbing (washer+sink)");
ok(roomSystems("D").essential.includes(PLUMB), "D Dining → Plumbing DERIVED via counter (operator ACCEPTED)");
ok(!roomSystems("M").essential.includes(PLUMB), "M Bedroom → NO Plumbing");
ok(!roomSystems("O").essential.includes(PLUMB), "O Office → NO Plumbing");
ok(!roomSystems("C").essential.includes(PLUMB) && !roomSystems("C").secondary.includes(PLUMB), "C Closet → NO Plumbing/sinks (operator rule ✅)");

// ── Comms/Low-Voltage secondary where an AV/data asset (tv/desk) exists ──
ok(roomSystems("M").secondary.includes(COMMS) && roomSystems("O").secondary.includes(COMMS) && roomSystems("L").secondary.includes(COMMS), "Comms secondary in bedroom/office/living (tv/desk)");
ok(!roomSystems("C").secondary.includes(COMMS) && !roomSystems("B").secondary.includes(COMMS), "no Comms in closet/bath (no AV/desk)");

// ── Exterior only for Entry/Porch ──
ok(roomSystems("E").secondary.includes(EXT) && !roomSystems("M").secondary.includes(EXT), "Exterior only in E · Entry/Porch");

// ── universal secondary systems present everywhere ──
ok(["physical/mechanical", "physical/interior", "physical/building-envelope", "physical/structure"].every((s) => roomSystems("C").secondary.includes(s)), "closet still carries Mechanical/Interior/Envelope/Structure (universal)");

// ── isVisibleForRoom: the tree-filter predicate ──
ok(isVisibleForRoom(PLUMB, "physical", "B") === true, "isVisibleForRoom: Plumbing visible in Bath");
ok(isVisibleForRoom(PLUMB, "physical", "M") === false, "isVisibleForRoom: Plumbing hidden in Bedroom");
ok(isVisibleForRoom(PLUMB, "physical", "C") === false, "isVisibleForRoom: Plumbing hidden in Closet ✅");
ok(isVisibleForRoom("physical/plumbing/fixtures", "physical", "B") === true && isVisibleForRoom("physical/plumbing/fixtures", "physical", "M") === false, "descendants follow their system (Plumbing/Fixtures B yes, M no)");
ok(isVisibleForRoom("physical/electrical", "physical", "M") === true, "Electrical visible in every room");
ok(isVisibleForRoom("physical/site", "physical", "M") === false && isVisibleForRoom("physical/spaces", "physical", "B") === false, "house-level systems (Site/Spaces) hidden inside a room");
ok(isVisibleForRoom("physical/foundation", "physical", "C") === false && isVisibleForRoom("physical/fire-protection", "physical", "B") === false, "house-only branches (Foundation/Fire-Protection) hidden inside a room");
ok(isVisibleForRoom("physical/electrical", "physical", "C") === true, "the room's essential system branch renders (Electrical in Closet)");
// fail-open + scope guards
ok(isVisibleForRoom(PLUMB, "physical", null) === true, "no room focused → whole tree visible");
ok(isVisibleForRoom(PLUMB, "physical", "ZZ") === true, "unknown room key → fail-open, never blank");
ok(isVisibleForRoom("operational/documents", "operational", "M") === true, "Operational/Lifecycle scopes stay full in a room");

// ── the room tree is a SUBSET of the house tree (nothing orphaned) ──
ok(Object.keys(ROOM_VISIBLE).length === 9, "ROOM_VISIBLE covers all 9 rooms");
ok(ROOM_VISIBLE.B.has(PLUMB) && !ROOM_VISIBLE.M.has(PLUMB), "ROOM_VISIBLE consistent with roomSystems");
// determinism
ok(JSON.stringify(roomSystems("K")) === JSON.stringify(roomSystems("K")), "roomSystems deterministic");

console.log(`\nROOM-SCOPE ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);

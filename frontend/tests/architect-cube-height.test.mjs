// ARCHITECT-2525 · THE CUBE HAS ONE HEIGHT (operator 2026-11-06: "ceilings are 10 feet; what do you think a cube is").
// A room is a 10×10×10 CUBE. Walk R2 regressed this by hardcoding CEIL_FT = 8 in the walkthrough; this REVERT-CLASS gate
// fails the build if the ceiling/storey height ever drifts off the ONE source (room-layout STOREY_FT = ROOM_FT = 10) or is
// hardcoded to 8 anywhere on the walk/MEP/framing path.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-cube-height.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOM_FT, STOREY_FT, SHELL_FT, PLENUM_FT, HOUSE_FT, HOUSE_H } from "../lib/room-layout.ts";
import { DUCT_Z } from "../lib/architect-walk-mep.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };

// 1. the nested cube — INNER clear 10×10×10, OUTER shell 12×12×12, a 2-ft plenum between (one source, can't drift)
ok(ROOM_FT === 10 && STOREY_FT === 10 && STOREY_FT === ROOM_FT, `inner: STOREY_FT === ROOM_FT === 10 — got STOREY_FT ${STOREY_FT}, ROOM_FT ${ROOM_FT}`);
ok(SHELL_FT === 12 && SHELL_FT - STOREY_FT === 2 && PLENUM_FT === 2, `outer shell SHELL_FT === 12 and the plenum SHELL_FT − CEIL_FT === 2 (got ${SHELL_FT})`);
ok(HOUSE_FT === 3 * SHELL_FT && HOUSE_FT === 36 && HOUSE_H === SHELL_FT && HOUSE_H === 12, `whole house 36×36×12 (one storey): HOUSE_FT === 3×SHELL === 36, HOUSE_H === SHELL === 12 (got ${HOUSE_FT}×${HOUSE_H})`);

// 2. the walk binds its ceiling to the source, never a literal 8
const walk = read("components/architect-2525/architect-walkthrough.tsx");
ok(/const CEIL_FT = STOREY_FT\b/.test(walk), "the walkthrough binds CEIL_FT to STOREY_FT (the cube), not a literal");
ok(!/CEIL_FT\s*=\s*8\b/.test(walk), "the walkthrough never hardcodes CEIL_FT = 8 (the R2 revert)");
ok(/import \{ STOREY_FT \} from "@\/lib\/room-layout"/.test(walk), "the walkthrough imports STOREY_FT (the one cube source)");

// 3. the MEP keys the top plate + duct to the cube, not 8; the duct sits just under the 10-ft ceiling
const mep = read("lib/architect-walk-mep.ts");
ok(/const TOP_PLATE = RF\b/.test(mep) && !/TOP_PLATE\s*=\s*8\b/.test(mep), "walk-mep TOP_PLATE keys to the cube (RF = ROOM_GRID = 10), never 8");
ok(DUCT_Z > STOREY_FT && DUCT_Z <= SHELL_FT, `DUCT_Z sits in the plenum ABOVE the 10-ft inner ceiling (got ${DUCT_Z}, in (${STOREY_FT}, ${SHELL_FT}])`);

console.log(`\nARCHITECT-CUBE-HEIGHT ${pass}/${pass + fail} passed · the 10-ft cube has ONE height source (no drift to 8)`);
if (fail > 0) process.exit(1);

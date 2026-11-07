// ARCHITECT-2525 · ONE SOURCE gate (Wave 0 · P0·I, operator 2026-11-07 via MoT). The 10-ft room edge, the opening standard and the
// F9 stretch fence each have ONE source in lib/room-layout.ts — every walk/plan lib READS it, none re-declares it:
//  1. ROOM_FT — architect-walk-nav + dim-annot re-export room-layout's (no `ROOM_FT = <literal>` of their own); runtime-equal, 10.
//     (room-objects ROOM_GRID belongs to the asset-registry slice: asserted EQUAL at runtime here, not yet a re-export.)
//  2. OPENING_STD — DOOR_W 3'-0" (the designer's default door; `ftIn` never prints a "3'-2″" door), DOOR_H 6'-8", the 82½" R.O.
//     head, the window 3.6 × (sill 3 → head 6.5). walk-nav DOOR_W + walk-framing HDR_DOOR/WIN_SILL/WIN_HEAD read it; the
//     walkthrough's DOOR_H/WIN_* must EQUAL it (a literal today, or bound to OPENING_STD once its owner switches — either is green).
//  3. F9 fence — resizeRoomInLayout can never exceed STRETCH_MAX_CELLS = 1 (the walk draws 10×10 until Rev K honours w/d), and
//     the Design surface's stretch control is disabled (no dead-but-enabled button).
//  4. tiny-floorplan.tsx — its walls come from the ONE framing palette (FRAME_COLOR), no framing colour literal in the file.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-one-source.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOM_FT as RL_ROOM_FT, STOREY_FT, OPENING_STD, STRETCH_MAX_CELLS, resizeRoomInLayout, layoutSqft, TINY_ROOM_LAYOUT } from "../lib/room-layout.ts";
import { ROOM_FT as NAV_ROOM_FT, DOOR_W, canCrossDoor } from "../lib/architect-walk-nav.ts";
import { ROOM_FT as DIM_ROOM_FT, ftIn } from "../lib/dim-annot.ts";
import { ROOM_GRID, DOOR_VARIANTS } from "../lib/room-objects.ts";
import { FRAME_COLOR, FRAME_HEADER_COLOR } from "../lib/architect-phase-palette.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;

// ── 1. ONE 10-ft SOURCE ──
ok(RL_ROOM_FT === 10 && STOREY_FT === RL_ROOM_FT, `room-layout ROOM_FT is the 10-ft source (got ${RL_ROOM_FT})`);
ok(NAV_ROOM_FT === RL_ROOM_FT, `architect-walk-nav ROOM_FT === room-layout ROOM_FT at runtime (got ${NAV_ROOM_FT})`);
ok(DIM_ROOM_FT === RL_ROOM_FT, `dim-annot ROOM_FT === room-layout ROOM_FT at runtime (got ${DIM_ROOM_FT})`);
ok(ROOM_GRID === RL_ROOM_FT, `room-objects ROOM_GRID === room-layout ROOM_FT at runtime (got ${ROOM_GRID}) — the registry slice owns its re-export`);
const nav = read("lib/architect-walk-nav.ts"), dim = read("lib/dim-annot.ts");
ok(!/\bROOM_FT\s*=\s*[\d.]/.test(nav), "architect-walk-nav.ts declares NO `ROOM_FT = <literal>` of its own");
ok(!/\bROOM_FT\s*=\s*[\d.]/.test(dim), "dim-annot.ts declares NO `ROOM_FT = <literal>` of its own");
ok(/import \{[^}]*\bROOM_FT\b[^}]*\} from "\.\/room-layout"/.test(nav) && /export \{[^}]*\bROOM_FT\b[^}]*\}/.test(nav), "architect-walk-nav.ts imports ROOM_FT from ./room-layout and re-exports it (consumers compile unchanged)");
ok(/import \{[^}]*\bROOM_FT\b[^}]*\} from "\.\/room-layout"/.test(dim) && /export \{[^}]*\bROOM_FT\b[^}]*\}/.test(dim), "dim-annot.ts imports ROOM_FT from ./room-layout and re-exports it");

// ── 2. ONE OPENING STANDARD ──
ok(OPENING_STD.DOOR_W_FT === 3 && near(OPENING_STD.DOOR_H_FT, 6.67) && OPENING_STD.DOOR_RO_H_FT === 6.875, `OPENING_STD door = 3'-0" × 6'-8", R.O. head 82½" (got ${OPENING_STD.DOOR_W_FT} × ${OPENING_STD.DOOR_H_FT}, R.O. ${OPENING_STD.DOOR_RO_H_FT})`);
ok(OPENING_STD.WIN_W_FT === 3.6 && OPENING_STD.WIN_SILL_FT === 3 && OPENING_STD.WIN_HEAD_FT === 6.5, "OPENING_STD window = 3.6 wide, sill 3 → head 6.5");
ok(OPENING_STD.WIN_HEAD_FT > OPENING_STD.WIN_SILL_FT && OPENING_STD.WIN_HEAD_FT < STOREY_FT && OPENING_STD.DOOR_RO_H_FT > OPENING_STD.DOOR_H_FT && OPENING_STD.DOOR_RO_H_FT < STOREY_FT, "the standard is physically ordered: sill < head < the 10-ft ceiling; leaf < R.O. head < ceiling");
ok(ftIn(OPENING_STD.DOOR_W_FT) === `3'-0"` && ftIn(OPENING_STD.DOOR_H_FT) === `6'-8"`, `the standard prints as the trade does: ${ftIn(OPENING_STD.DOOR_W_FT)} × ${ftIn(OPENING_STD.DOOR_H_FT)}`);
ok(ftIn(3.2) === `3'-2"` && OPENING_STD.DOOR_W_FT !== 3.2, `3.2 ft would print "${ftIn(3.2)}" — a door that does not exist; the standard is 3'-0"`);
const d32 = DOOR_VARIANTS.find((v) => v.id === "d32");
ok(!!d32 && d32.w === OPENING_STD.DOOR_W_FT && near(d32.h, OPENING_STD.DOOR_H_FT), `the designer's default door (DOOR_VARIANTS "d32" ${d32?.label}) IS the standard (${d32?.w} × ${d32?.h})`);
ok(DOOR_W === OPENING_STD.DOOR_W_FT, `architect-walk-nav DOOR_W reads OPENING_STD.DOOR_W_FT at runtime (got ${DOOR_W})`);
ok(canCrossDoor(DOOR_W / 2) && !canCrossDoor(DOOR_W / 2 + 0.05), "the door-span rule is keyed to the standard width");
ok(!/\bDOOR_W\s*=\s*[\d.]/.test(nav) && /\bOPENING_STD\b/.test(nav), "architect-walk-nav.ts has no `DOOR_W = <literal>` — it reads OPENING_STD");
const fr = read("lib/architect-walk-framing.ts");
ok(/import \{[^}]*\bOPENING_STD\b[^}]*\} from "\.\/room-layout"/.test(fr), "architect-walk-framing.ts imports OPENING_STD from ./room-layout");
ok(!/\b(HDR_DOOR|WIN_SILL|WIN_HEAD)\s*=\s*[\d.]/.test(fr), "architect-walk-framing.ts has no HDR_DOOR / WIN_SILL / WIN_HEAD literal (each is bound to OPENING_STD)");
ok(/HDR_DOOR = OPENING_STD\.DOOR_RO_H_FT/.test(fr) && /WIN_SILL = OPENING_STD\.WIN_SILL_FT/.test(fr) && /WIN_HEAD = OPENING_STD\.WIN_HEAD_FT/.test(fr), "the framing's header underside / sill / head are the standard's R.O. head / sill / head");
// the walkthrough (owned by another slice) must EQUAL the standard — a literal that matches, or a binding to OPENING_STD, is green
const walk = read("components/architect-2525/architect-walkthrough.tsx");
const walkUsesStd = /\bOPENING_STD\b/.test(walk);
const checkWalk = (name, key) => {
  const m = walk.match(new RegExp(`\\b${name}\\s*=\\s*([^,;\\n]+)`));
  if (!m) { ok(walkUsesStd, `walkthrough no longer declares ${name} — then it must read OPENING_STD (it does not)`); return; }
  const rhs = m[1].trim();
  if (/^[\d.]+$/.test(rhs)) ok(near(Number(rhs), OPENING_STD[key]), `walkthrough ${name} = ${rhs} EQUALS OPENING_STD.${key} = ${OPENING_STD[key]}`);
  else ok(new RegExp(`OPENING_STD\\.${key}\\b`).test(rhs), `walkthrough ${name} is bound to OPENING_STD.${key} (got "${rhs}")`);
};
checkWalk("DOOR_H", "DOOR_H_FT"); checkWalk("WIN_W", "WIN_W_FT"); checkWalk("WIN_SILL", "WIN_SILL_FT"); checkWalk("WIN_HEAD", "WIN_HEAD_FT");
ok(/import \{[^}]*\bDOOR_W\b[^}]*\} from "@\/lib\/architect-walk-nav"/.test(walk) && !/\bDOOR_W\s*=\s*[\d.]/.test(walk), "the walkthrough takes DOOR_W from architect-walk-nav (the standard), never a local literal");

// ── 3. F9 STRETCH FENCE ──
ok(STRETCH_MAX_CELLS === 1, `STRETCH_MAX_CELLS = 1 (got ${STRETCH_MAX_CELLS})`);
const big = resizeRoomInLayout(TINY_ROOM_LAYOUT, "living", 9, 9, 9).find((r) => r.id === "living");
ok(big.w === 1 && big.d === 1, `resizeRoomInLayout cannot exceed 1 cell even with w=d=9 and max=9 (got ${big.w}×${big.d})`);
ok(layoutSqft(resizeRoomInLayout(TINY_ROOM_LAYOUT, "living", 2, 2)) === 900, "a fenced stretch leaves the house at 900 ft²");
const design = read("components/architect-2525/architect-design.tsx");
const calls = design.match(/resizeRoomInLayout\(([^()]*)\)/g) || [];
ok(calls.length >= 1 && calls.every((c) => (c.match(/,/g) || []).length <= 3), "architect-design.tsx never passes its own `max` to resizeRoomInLayout (the fence is the lib's)");
ok((design.match(/data-arch-stretch-(?:inc|dec)=\{dim\}\s+disabled\b/g) || []).length === 2, "the two F9 stretch buttons are disabled (fenced, not dead-but-enabled)");
ok(/fenced until the WalkSpace contract \(Rev K\) honours w\/d/i.test(read("lib/room-layout.ts")), "room-layout.ts states the fence in code: fenced until the WalkSpace contract (Rev K) honours w/d");

// ── 4. 2D PLAN RECOLOUR — tiny-floorplan draws its walls from the one framing palette ──
const tiny = read("components/architect-2525/tiny-floorplan.tsx");
ok(/import \{[^}]*\bFRAME_COLOR\b[^}]*\} from "@\/lib\/architect-phase-palette"/.test(tiny), "tiny-floorplan.tsx imports FRAME_COLOR from the one palette");
ok(/\bwall:\s*FRAME_COLOR\b/.test(tiny), "tiny-floorplan.tsx binds its wall colour to FRAME_COLOR");
const frameHexes = [FRAME_COLOR, FRAME_HEADER_COLOR, "#c084fc"].map((h) => h.toLowerCase());
ok(!frameHexes.some((h) => tiny.toLowerCase().includes(h)), `tiny-floorplan.tsx carries no framing colour literal (${frameHexes.join(" / ")})`);

console.log(`\nARCHITECT-ONE-SOURCE ${pass}/${pass + fail} passed · ROOM_FT ×1 · OPENING_STD (3'-0" × 6'-8", window 3.6 × 3→6.5) · F9 fenced at 1 cell · 2D walls from FRAME_COLOR`);
if (fail > 0) process.exit(1);

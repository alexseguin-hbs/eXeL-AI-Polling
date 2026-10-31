// ROOM STANDARD LAYOUT gate (R5, 2026-10-31) — the R-CORE LOCK for an HI decision the operator had to repeat.
// Room Designer decision card (SAVE-FEEDBACK): PROCEED · Layout A · simplify S1 · "No dresser; place that in other room.
// Table / vanity with mirror works". Repeated 2026-10-30 on the live site's busy bedroom: "stop reverting; this is why
// you have R-Core: we already said this is too busy." CLAUDE.md: "every invariant gets a gate; an invariant defended
// only by a comment is already lost." This gate fails the build if the Master Bedroom default ever returns to the greedy
// packer, re-admits a dresser or wardrobe, loses its two windows, or if the designer stops opening in Simple mode.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/room-standard-layout.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STANDARD_LAYOUTS, standardLayoutFor, defaultObjectsForRoom, ROOM_ASSETS, paletteForRoom, worldSpan, elevOf, heightOf, OBJECT_SPEC, ROOM_GRID, STD_SILL_FT, wallOf } from "../lib/room-objects.ts";
import { sanitizeRoomLayout } from "../lib/architect-guard.ts";
import { TINY_ROOM_LAYOUT } from "../lib/room-layout.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const kinds = (objs) => objs.map((o) => o.kind);
const count = (objs, k) => objs.filter((o) => o.kind === k).length;

// ── 1. the Master Bedroom's default IS the decided layout, not the packer ──
const M = defaultObjectsForRoom("M");
ok(STANDARD_LAYOUTS.M && JSON.stringify(M) === JSON.stringify(STANDARD_LAYOUTS.M), "the Master Bedroom default is STANDARD_LAYOUTS.M (Layout A) — never the greedy packer");
ok(standardLayoutFor("M") !== STANDARD_LAYOUTS.M && JSON.stringify(standardLayoutFor("M")) === JSON.stringify(STANDARD_LAYOUTS.M), "standardLayoutFor returns a fresh copy (a saved edit never mutates the decided layout)");
ok(standardLayoutFor("K") === null && standardLayoutFor("ZZZ") === null, "rooms without a decided layout fall back to the packer (null)");
ok(JSON.stringify(defaultObjectsForRoom("M")) === JSON.stringify(M), "deterministic (replay law)");

// ── 2. Layout A, piece by piece (HI: bed centred on the back wall · two nightstands · desk/vanity + mirror · rug · 2 windows · door) ──
ok(count(M, "bed") === 1 && count(M, "nightstand") === 2 && count(M, "desk") === 1 && count(M, "mirror") === 1 && count(M, "rug") === 1 && count(M, "window") === 2 && count(M, "door") === 1, `Layout A = 1 bed · 2 nightstands · 1 desk (vanity) · 1 mirror · 1 rug · 2 windows · 1 door (got ${kinds(M).join(",")})`);
ok(M.length === 9, `nine pieces — nothing more (the "too busy" fix): ${M.length}`);
ok(count(M, "dresser") === 0 && count(M, "wardrobe") === 0, "NO dresser, NO wardrobe in the bedroom (HI: 'No dresser; place that in other room')");
ok(count(M, "tv") === 0 && count(M, "chair") === 0 && count(M, "lamp") === 0, "tv · chair · lamp are NOT placed by default (still offered in the palette)");
const bed = M.find((o) => o.kind === "bed"), bs = worldSpan(bed);
ok(Math.abs((bs.x1 + bs.x2) / 2 - ROOM_GRID / 2) < 1e-9 && Math.abs(bs.y1) < 1e-9, `the bed is centred on the back (N) wall, head against it (x ${bs.x1}–${bs.x2} · y ${bs.y1}–${bs.y2})`);
const ns = M.filter((o) => o.kind === "nightstand").map(worldSpan);
ok(ns.length === 2 && ns.some((s) => s.x2 <= bs.x1 + 1e-9) && ns.some((s) => s.x1 >= bs.x2 - 1e-9) && ns.every((s) => s.y1 < 2), "one nightstand each side of the bed's head");
const desk = M.find((o) => o.kind === "desk"), ds = worldSpan(desk), mirror = M.find((o) => o.kind === "mirror");
ok(OBJECT_SPEC.mirror.onWall && wallOf(mirror.gx, mirror.gy) === wallOf(desk.gx, desk.gy), "the wall mirror hangs on the same wall as the desk (the vanity)");
const ms = worldSpan(mirror);
ok(ms.x1 >= ds.x1 - 1e-9 && ms.x2 <= ds.x2 + 1e-9 && ms.y1 >= ds.y1 - 1e-9 && ms.y2 <= ds.y2 + 1e-9, "the mirror sits ABOVE the desk (its wall span is within the desk's span)");
ok(elevOf(mirror) >= heightOf(desk), `the mirror is hung above the desk top (elev ${elevOf(mirror)} ft ≥ desk ${heightOf(desk)} ft)`);
const rug = worldSpan(M.find((o) => o.kind === "rug"));
ok(rug.y1 >= bs.y2 - 1e-9, "the rug lies at the FOOT of the bed (no pile under it)");
const wins = M.filter((o) => o.kind === "window");
const extWalls = new Set(["N", "W"]); // M sits at row 0 · col 0 of the 3×3 → its exterior walls are N and W
ok(wins.every((w) => extWalls.has(wallOf(w.gx, w.gy))) && new Set(wins.map((w) => wallOf(w.gx, w.gy))).size === 2, "the two windows are on the two EXTERIOR walls (N and W — one each)");
ok(wins.every((w) => elevOf(w) === STD_SILL_FT), "windows at the standard 3-ft sill");
const mCell = TINY_ROOM_LAYOUT.find((r) => r.k === "M");
ok(mCell && mCell.row === 0 && mCell.col === 0 && mCell.windows === 2, "the canonical 3×3 puts the Master Bedroom at row 0 · col 0 with 2 windows (the layout's wall choice is derived from it)");
const door = M.find((o) => o.kind === "door");
ok(wallOf(door.gx, door.gy) === "S", "the door is on the S wall — the entry from the Living Room (row 1 · col 0)");
const dsp = worldSpan(door);
ok(dsp.x2 <= ds.x1 + 1e-9 || dsp.x1 >= ds.x2 - 1e-9 || dsp.y1 >= ds.y2 - 1e-9, "the door is clear of the vanity");

// ── 3. physical sanity: everything inside the room; floor pieces never overlap; wall pieces hang above what they cross ──
const inside = (o) => { const s = worldSpan(o); return s.x1 >= -1e-9 && s.y1 >= -1e-9 && s.x2 <= ROOM_GRID + 1e-9 && s.y2 <= ROOM_GRID + 1e-9; };
ok(M.every(inside), "every Layout A piece sits fully inside the 10×10 room");
const overlap = (a, b) => { const A = worldSpan(a), B = worldSpan(b); return Math.max(0, Math.min(A.x2, B.x2) - Math.max(A.x1, B.x1)) * Math.max(0, Math.min(A.y2, B.y2) - Math.max(A.y1, B.y1)); };
const hung = (a, b) => (OBJECT_SPEC[a.kind].onWall && elevOf(a) >= heightOf(b) - 1e-9) || (OBJECT_SPEC[b.kind].onWall && elevOf(b) >= heightOf(a) - 1e-9);
let worst = 0; for (let i = 0; i < M.length; i++) for (let j = i + 1; j < M.length; j++) if (!hung(M[i], M[j])) worst = Math.max(worst, overlap(M[i], M[j]));
ok(worst < 0.01, `no floor overlap in Layout A (worst ${worst.toFixed(3)} ft²)`);
ok(new Set(M.map((o) => o.id)).size === M.length, "ids are unique");

// ── 4. the palette: no dresser/wardrobe offered in the bedroom; desk + mirror are; the closet keeps the clothes storage ──
ok(!ROOM_ASSETS.M.includes("dresser") && !ROOM_ASSETS.M.includes("wardrobe"), "ROOM_ASSETS.M offers no dresser and no wardrobe");
ok(ROOM_ASSETS.M.includes("desk") && ROOM_ASSETS.M.includes("mirror") && paletteForRoom("M").includes("window") && paletteForRoom("M").includes("door"), "ROOM_ASSETS.M offers the desk (table/vanity) + mirror; openings via the common palette");
ok(ROOM_ASSETS.C.includes("wardrobe") && ROOM_ASSETS.C.includes("dresser"), "the Master Closet (C) carries the wardrobe + dresser — 'place that in other room'");

// ── 5. the layout survives the WireGuard round-trip EXACTLY (half-foot centres are not rounded away on reload) ──
const san = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "M" ? { ...r, objects: M } : r)));
ok(JSON.stringify(san.find((r) => r.k === "M").objects) === JSON.stringify(M), "Layout A round-trips through sanitizeRoomLayout unchanged (gx 4.5 stays 4.5)");

// ── 6. SIMPLE is the designer's default; ⚙ Advanced is opt-in; the CAD chrome is gated on it ──
const rd = fs.readFileSync(path.join(ROOT, "components/architect-2525/room-designer.tsx"), "utf8");
ok(/localStorage\.getItem\("arch2525\.roomSimple"\) !== "0"/.test(rd) && /return true;\s*\n\s*try \{ return localStorage\.getItem\("arch2525\.roomSimple"\)/.test(rd), "simpleMode defaults to TRUE (Simple) and persists under arch2525.roomSimple");
ok(/const advanced = !simpleMode;/.test(rd) && /data-arch-room-simple=\{simpleMode \? "1" : "0"\}/.test(rd), "the header carries the Simple ⇄ ⚙ Advanced toggle");
for (const [re, what] of [
  [/\{interactive && advanced && sel && \(\(\) => \{\s*\n\s*const fp = footprintOf\(sel\);\s*\n\s*const ann = annotateObject/, "2D CAD dimension callouts"],
  [/\{interactive && advanced && sel && dimEntry && /, "the feet-inches keypad"],
  [/\{advanced && sel && \(\(\) => \{\s*\n\s*const o = objects\.find\(\(x\) => x\.id === selId\); if \(!o\) return null;/, "the 3D height rails"],
  [/\{advanced && <button data-arch-room-link/, "the North-lock buttons"],
  [/\{advanced && <span data-arch-nudge/, "the nudge pad"],
  [/\{advanced && objects\.length > 0 && \(\(\) => \{\s*\n\s*const bom = roomBom/, "the BOM quote"],
  [/\{advanced && <div data-arch-playtest/, "the guided demo"],
  [/\{simpleMode \? \(/, "the single-pane Simple layout"],
]) ok(re.test(rd), `${what} is gated on Advanced`);
ok(/data-arch-roomobj-name/.test(rd) && /\{interactive && sel && simpleMode && \(\(\) => \{/.test(rd), "the NAME BADGE still names a tapped element in Simple mode (re-homed outside the CAD callouts)");
ok(/data-arch-roomobj-rotate/.test(rd) && /data-arch-roomobj-delete/.test(rd) && /data-arch-roomobj-size/.test(rd) && /data-arch-roomdesign-undo/.test(rd), "Simple keeps the core loop: Size · Rotate · Delete · Undo");

console.log(`\nROOM-STANDARD-LAYOUT ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);

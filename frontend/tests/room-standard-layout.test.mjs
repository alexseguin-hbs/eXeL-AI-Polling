// ROOM STANDARD LAYOUT gate (R5 2026-10-31 · R5b) — the R-CORE LOCK for HI decisions the operator had to repeat.
// Room Designer decision card (SAVE-FEEDBACK): PROCEED · Layout A · simplify S1 · "No dresser; place that in other room.
// Table / vanity with mirror works". Repeated 2026-10-30 on the live site's busy bedroom: "stop reverting; this is why
// you have R-Core: we already said this is too busy." Then, after the fleet measured R5's Layout A (the vanity 6" from the
// bed, the door sweeping it), his 2026-10-31 answers: LAYOUT A′ WITHOUT RUG — "only have furniture, no rugs or curtains
// till the later polish stage after the house is designed with the interior stage". CLAUDE.md: "every invariant gets a
// gate; an invariant defended only by a comment is already lost." This gate fails the build if the Master Bedroom default
// ever returns to the greedy packer, re-admits a dresser / wardrobe / rug, loses a window, breaks a clearance, lets a wall
// piece turn into the room, loses the half-foot centres, lets a hostile kind through the WireGuard, or stops opening Simple.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/room-standard-layout.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  STANDARD_LAYOUTS, STANDARD_LAYOUT_REV, standardLayoutFor, defaultObjectsForRoom, ROOM_ASSETS, paletteForRoom, worldSpan, elevOf,
  heightOf, OBJECT_SPEC, ROOM_GRID, STD_SILL_FT, wallOf, wallOfObject, wallRot, alignedRot, placeObject, moveObject, rotateObject,
  mirrorObjects, clampFootprint, STANDARD_LAYOUT_EDITIONS,
} from "../lib/room-objects.ts";
import { sanitizeRoomLayout, MAX_OBJECTS_PER_ROOM } from "../lib/architect-guard.ts";
import { TINY_ROOM_LAYOUT } from "../lib/room-layout.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const kinds = (objs) => objs.map((o) => o.kind);
const count = (objs, k) => objs.filter((o) => o.kind === k).length;
const near = (a, b) => Math.abs(a - b) < 1e-9;
const isFloor = (o) => !OBJECT_SPEC[o.kind].onWall;   // a wall piece at a sill / hung on the wall is not a floor obstacle
const overlap = (a, b) => { const A = worldSpan(a), B = worldSpan(b); return Math.max(0, Math.min(A.x2, B.x2) - Math.max(A.x1, B.x1)) * Math.max(0, Math.min(A.y2, B.y2) - Math.max(A.y1, B.y1)); };
const rectOverlap = (o, R) => { const A = worldSpan(o); return Math.max(0, Math.min(A.x2, R.x2) - Math.max(A.x1, R.x1)) * Math.max(0, Math.min(A.y2, R.y2) - Math.max(A.y1, R.y1)); };

// ── 1. the Master Bedroom's default IS the decided layout, not the packer ──
const M = defaultObjectsForRoom("M");
ok(STANDARD_LAYOUTS.M && JSON.stringify(M) === JSON.stringify(STANDARD_LAYOUTS.M), "the Master Bedroom default is STANDARD_LAYOUTS.M (Layout A′) — never the greedy packer");
ok(standardLayoutFor("M") !== STANDARD_LAYOUTS.M && JSON.stringify(standardLayoutFor("M")) === JSON.stringify(STANDARD_LAYOUTS.M), "standardLayoutFor returns a fresh copy (a saved edit never mutates the decided layout)");
ok(standardLayoutFor("K") === null && standardLayoutFor("ZZZ") === null, "rooms without a decided layout fall back to the packer (null)");
ok(JSON.stringify(defaultObjectsForRoom("M")) === JSON.stringify(M), "deterministic (replay law)");
ok(STANDARD_LAYOUT_REV === 2, "the standard-layout edition is 2 (Layout A′) — bump it when the decided layout changes again");

// ── 2. Layout A′, piece by piece (HI: bed centred on the back wall · two nightstands · vanity + mirror OPPOSITE the bed · 2 windows · door · NO rug) ──
ok(count(M, "bed") === 1 && count(M, "nightstand") === 2 && count(M, "desk") === 1 && count(M, "mirror") === 1 && count(M, "window") === 2 && count(M, "door") === 1, `Layout A′ = 1 bed · 2 nightstands · 1 desk (vanity) · 1 mirror · 2 windows · 1 door (got ${kinds(M).join(",")})`);
ok(M.length === 8, `eight pieces — nothing more (the "too busy" fix): ${M.length}`);
ok(count(M, "dresser") === 0 && count(M, "wardrobe") === 0, "NO dresser, NO wardrobe in the bedroom (HI: 'No dresser; place that in other room')");
ok(count(M, "rug") === 0, "NO rug (HI 2026-10-31: 'only furniture — no rugs or curtains till the later polish stage')");
ok(count(M, "tv") === 0 && count(M, "chair") === 0 && count(M, "lamp") === 0, "tv · chair · lamp are NOT placed by default (still offered in the palette)");
const bed = M.find((o) => o.kind === "bed"), bs = worldSpan(bed);
ok(near((bs.x1 + bs.x2) / 2, ROOM_GRID / 2) && near(bs.y1, 0), `the bed is centred on the back (N) wall, head against it (x ${bs.x1}–${bs.x2} · y ${bs.y1}–${bs.y2})`);
const ns = M.filter((o) => o.kind === "nightstand").map(worldSpan);
ok(ns.length === 2 && ns.some((s) => s.x2 <= bs.x1 + 1e-9) && ns.some((s) => s.x1 >= bs.x2 - 1e-9) && ns.every((s) => near(s.y1, 0)), "one nightstand each side of the bed's head, flush with the N wall");
const desk = M.find((o) => o.kind === "desk"), ds = worldSpan(desk), mirror = M.find((o) => o.kind === "mirror"), ms = worldSpan(mirror);
ok(wallOf(desk.gx, desk.gy) === "S" && near(ds.y2, ROOM_GRID), `the vanity stands against the S wall, OPPOSITE the bed (y ${ds.y1}–${ds.y2})`);
ok(OBJECT_SPEC.mirror.onWall && wallOfObject(mirror) === "S" && ms.x1 >= ds.x1 - 1e-9 && ms.x2 <= ds.x2 + 1e-9, "the wall mirror hangs on the S wall within the vanity's span");
ok(elevOf(mirror) >= heightOf(desk), `the mirror is hung above the vanity top (elev ${elevOf(mirror)} ft ≥ desk ${heightOf(desk)} ft)`);
const wins = M.filter((o) => o.kind === "window");
const extWalls = new Set(["N", "W"]); // M sits at row 0 · col 0 of the 3×3 → its exterior walls are N and W
ok(wins.every((w) => extWalls.has(wallOfObject(w))) && new Set(wins.map((w) => wallOfObject(w))).size === 2, "the two windows are on the two EXTERIOR walls (N and W — one each)");
ok(wins.every((w) => elevOf(w) === STD_SILL_FT), "windows at the standard 3-ft sill");
ok(wins.every((w) => { const s = worldSpan(w), v = wallOfObject(w) === "W" || wallOfObject(w) === "E"; const a1 = v ? s.y1 : s.x1, a2 = v ? s.y2 : s.x2; return a1 >= 0.5 - 1e-9 && a2 <= ROOM_GRID - 0.5 + 1e-9; }), "no window runs into a corner (½ ft of framing kept at each end along its wall)");
const mCell = TINY_ROOM_LAYOUT.find((r) => r.k === "M");
ok(mCell && mCell.row === 0 && mCell.col === 0 && mCell.windows === 2, "the canonical 3×3 puts the Master Bedroom at row 0 · col 0 with 2 windows (the layout's wall choice is derived from it)");
const door = M.find((o) => o.kind === "door"), dsp = worldSpan(door);
ok(wallOfObject(door) === "S", "the door is on the S wall — the entry from the Living Room (row 1 · col 0)");

// ── 3. CLEARANCES (I-RD-5: ~24″ walkways · ~36″ at the chair). Floor pieces only; a window at its sill is not an obstacle. ──
const floor = M.filter(isFloor);
const footHalf = { x1: 0, x2: ROOM_GRID, y1: bs.y1 + (bs.y2 - bs.y1) / 2, y2: bs.y2 };   // the bed's foot half (the head half holds the nightstands by design)
const aisleW = Math.min(bs.x1, ...floor.filter((o) => o !== bed && rectOverlap(o, { x1: 0, x2: bs.x1, y1: footHalf.y1, y2: footHalf.y2 }) > 0).map((o) => worldSpan(o).x1));
const aisleE = Math.min(ROOM_GRID - bs.x2, ...floor.filter((o) => o !== bed && rectOverlap(o, { x1: bs.x2, x2: ROOM_GRID, y1: footHalf.y1, y2: footHalf.y2 }) > 0).map((o) => ROOM_GRID - worldSpan(o).x2));
ok(aisleW >= 2 - 1e-9 && aisleE >= 2 - 1e-9, `walkways beside the bed ≥ 24″ (W ${aisleW} ft · E ${aisleE} ft)`);
ok(ds.y1 - bs.y2 >= 2 - 1e-9, `bed foot → vanity ≥ 24″ (${ds.y1 - bs.y2} ft)`);
const chairZone = { x1: ds.x2 - 2.5, x2: ds.x2, y1: ds.y1 - 3, y2: ds.y1 };   // 36″ in front of the vanity, beside the bed
ok(floor.filter((o) => o !== desk).every((o) => rectOverlap(o, chairZone) < 1e-9), `a 36″ chair zone in front of the vanity (x ${chairZone.x1}–${chairZone.x2} · y ${chairZone.y1}–${chairZone.y2}) is clear of furniture`);
// the 3-ft door leaf sweeps a quarter circle from its W jamb on the S wall — nothing stands in it
const hinge = { x: dsp.x1, y: ROOM_GRID }, r = dsp.x2 - dsp.x1;
const inSweep = (o) => { const s = worldSpan(o); const px = Math.max(s.x1, Math.min(hinge.x, s.x2)), py = Math.max(s.y1, Math.min(hinge.y, s.y2)); return Math.hypot(px - hinge.x, py - hinge.y) < r - 1e-9; };
ok(floor.every((o) => !inSweep(o)), `the ${r}-ft door swing (from the W jamb) is clear of all furniture`);
let worst = 0; for (let i = 0; i < floor.length; i++) for (let j = i + 1; j < floor.length; j++) worst = Math.max(worst, overlap(floor[i], floor[j]));
ok(worst < 0.01, `no floor overlap in Layout A′ (worst ${worst.toFixed(3)} ft²)`);
const inside = (o) => { const s = worldSpan(o); return s.x1 >= -1e-9 && s.y1 >= -1e-9 && s.x2 <= ROOM_GRID + 1e-9 && s.y2 <= ROOM_GRID + 1e-9; };
ok(M.every(inside), "every Layout A′ piece sits fully inside the 10×10 room");
ok(new Set(M.map((o) => o.id)).size === M.length, "ids are unique");

// ── 4. the palette: no dresser / wardrobe / rug offered in the bedroom; desk + mirror are; the closet keeps the clothes storage ──
ok(!ROOM_ASSETS.M.includes("dresser") && !ROOM_ASSETS.M.includes("wardrobe"), "ROOM_ASSETS.M offers no dresser and no wardrobe");
ok(ROOM_ASSETS.M.includes("desk") && ROOM_ASSETS.M.includes("mirror") && paletteForRoom("M").includes("window") && paletteForRoom("M").includes("door"), "ROOM_ASSETS.M offers the desk (table/vanity) + mirror; openings via the common palette");
ok(ROOM_ASSETS.C.includes("wardrobe") && ROOM_ASSETS.C.includes("dresser"), "the Master Closet (C) carries the wardrobe + dresser — 'place that in other room'");
ok(Object.values(ROOM_ASSETS).every((list) => !list.includes("rug")) && Object.values(STANDARD_LAYOUTS).every((l) => l.every((o) => o.kind !== "rug")), "no rug in ANY default palette or standard layout (HI 2026-10-31: no rugs or curtains till the polish stage)");
ok(Object.hasOwn(OBJECT_SPEC, "rug"), "the rug KIND still exists (nothing deleted — it returns at the polish stage)");

// ── 5. the layout survives the WireGuard round-trip EXACTLY, and the standard-layout edition is honoured ──
const san = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "M" ? { ...r, objects: M, layoutRev: STANDARD_LAYOUT_REV } : r)));
ok(JSON.stringify(san.find((r) => r.k === "M").objects) === JSON.stringify(M), "Layout A′ round-trips through sanitizeRoomLayout unchanged (gx 4.5 stays 4.5)");
const legacyCell = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "M" ? { ...r, objects: [{ id: "dresser-1", kind: "dresser", gx: 2, gy: 7, rot: 0 }, { id: "bed-1", kind: "bed", gx: 0, gy: 0, rot: 0 }] } : r))).find((r) => r.k === "M");
ok(JSON.stringify(legacyCell.objects) === JSON.stringify(STANDARD_LAYOUTS.M) && legacyCell.layoutRev === STANDARD_LAYOUT_REV, "a bedroom saved at an OLDER edition (no layoutRev — e.g. with its dresser) is re-seated to Layout A′ on load ('stop reverting' reaches every device)");
const currentCell = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "M" ? { ...r, objects: [{ id: "lamp-1", kind: "lamp", gx: 2, gy: 2, rot: 0 }], layoutRev: STANDARD_LAYOUT_REV } : r))).find((r) => r.k === "M");
ok(currentCell.objects.length === 1 && currentCell.objects[0].kind === "lamp" && currentCell.layoutRev === STANDARD_LAYOUT_REV, "a bedroom written at the CURRENT edition keeps the operator's own arrangement");
// R5b (Krishna): a seed MERGES into a saved copy, it never replaces the user's own arrangement — only an UNTOUCHED prior edition re-seats.
const LAYOUT_A_R5 = STANDARD_LAYOUT_EDITIONS[1].M;
const untouchedA = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "M" ? { ...r, objects: LAYOUT_A_R5.map((o) => ({ ...o })), layoutRev: 1 } : r))).find((r) => r.k === "M");
ok(JSON.stringify(untouchedA.objects) === JSON.stringify(STANDARD_LAYOUTS.M) && untouchedA.layoutRev === STANDARD_LAYOUT_REV, "an UNTOUCHED Layout A (edition 1, exactly as R5 seeded it) is re-seated to A′");
const customA = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "M" ? { ...r, objects: [...LAYOUT_A_R5.map((o) => (o.id === "bed-1" ? { ...o, gx: 7 } : { ...o })), { id: "lamp-9", kind: "lamp", gx: 2, gy: 2, rot: 0 }], layoutRev: 1 } : r))).find((r) => r.k === "M");
ok(customA.objects.some((o) => o.kind === "lamp") && customA.objects.find((o) => o.kind === "bed").gx === 7 && customA.layoutRev === STANDARD_LAYOUT_REV, "a bedroom the user ARRANGED at edition 1 (bed moved, a lamp added) is KEPT and stamped with the current edition");
const forged = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "M" ? { ...r, objects: [{ id: "lamp-1", kind: "lamp", gx: 2, gy: 2, rot: 0 }], layoutRev: 9999 } : r))).find((r) => r.k === "M");
ok(forged.layoutRev === STANDARD_LAYOUT_REV && forged.objects.length === 1 && forged.objects[0].kind === "lamp", "a stamp above the current edition is clamped to it — a forged 9999 can never opt out of a future edition");
let threwK = false; try { sanitizeRoomLayout([{ id: "c", k: "constructor", label: "x", row: 0, col: 0, objects: [] }, { id: "p", k: "__proto__", label: "x", row: 0, col: 0 }]); } catch { threwK = true; }
ok(!threwK && standardLayoutFor("constructor") === null && Array.isArray(paletteForRoom("constructor")) && defaultObjectsForRoom("__proto__").length === 0, "a room key that is an inherited Object key never throws through the guard, the palette or the defaults (Thor)");
const emptied = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "M" ? { ...r, objects: [], layoutRev: STANDARD_LAYOUT_REV } : r))).find((r) => r.k === "M");
ok(Array.isArray(emptied.objects) && emptied.objects.length === 0, "an emptied room ([]) stays empty on reload (it used to come back as the default)");
const packedCell = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "K" ? { ...r, objects: [{ id: "stove-1", kind: "stove", gx: 3, gy: 3, rot: 0 }] } : r))).find((r) => r.k === "K");
ok(packedCell.objects.length === 1 && packedCell.layoutRev === undefined, "a room without a decided layout keeps its stored objects and gets no edition stamp");

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
// R5b — Mission-Planning parity: select-after-place · the tap threshold · the palette above the pane · finger-sized chips · a hit pad on thin pieces · the Simple help tells the truth
ok(/const next = placeObject\(objects, tool, p\.gx, p\.gy\);\s*\n\s*commit\(next\);\s*\n\s*setSelId\(next\[next\.length - 1\]\.id\);/.test(rd), "the piece just placed is selected (select-after-place, Mission Planning)");
ok(/dragStart\.current = \{ x: e\.clientX, y: e\.clientY \}; dragMoved\.current = false;/.test(rd) && /Math\.abs\(e\.clientX - s0\.x\) \+ Math\.abs\(e\.clientY - s0\.y\) < 8\) return;/.test(rd), "a tap never moves a piece — the drag starts after ~8 px");
ok(/moveObject\(objects, o\.id, p\.gx, p\.gy, OBJECT_SPEC\[o\.kind\]\.onWall \? \(dragWall\.current \?\? undefined\) : undefined\)/.test(rd), "a dragged wall piece carries the wall the drag LOCKED");
ok(/\{simpleMode \? \(\s*\n\s*<div className="flex flex-col gap-2">\s*\n\s*\{paletteEl\}/.test(rd), "in Simple the palette sits ABOVE the pane");
ok(/min-h-\[44px\] cursor-grab/.test(rd), "palette chips are finger-sized (≥ 44 px)");
ok(/data-arch-hitpad/.test(rd), "thin wall pieces carry a transparent hit pad");
ok(/\{advanced \? t\("arch\.room\.helpViews"\) : t\("arch\.room\.helpViewsSimple"\)\}/.test(rd) && !/title=\{advanced \? "Advanced:/.test(rd), "the Simple help describes ONE pane and the mode button's tooltip is a lexicon key");

// ── 7. R5b — a wall object is ALWAYS wall-aligned: placed, moved, rotated (flip), mirrored, and after the WireGuard round-trip ──
ok(wins.every((w) => w.rot === wallRot(wallOfObject(w))) && door.rot === wallRot(wallOfObject(door)) && mirror.rot === wallRot(wallOfObject(mirror)), "every Layout A′ wall piece runs along its wall (N/S → 0 · W/E → 90)");
const pw = placeObject([], "window", 0, 4)[0];
ok(wallOfObject(pw) === "W" && pw.rot === 90 && worldSpan(pw).x2 <= 1, `a window placed on the W wall runs along it (rot 90, got ${pw.rot} on ${wallOfObject(pw)})`);
const pn = placeObject([], "door", 5, 0)[0];
ok(wallOfObject(pn) === "N" && pn.rot === 0, "a door placed on the N wall runs along it (rot 0)");
const rw = rotateObject([pw], pw.id)[0];
ok(rw.rot === 270 && wallOfObject(rw) === "W" && worldSpan(rw).x2 <= 1 && near(rw.gy, pw.gy), "Rotate on a wall object FLIPS it (90 → 270) and it stays on its wall, never perpendicular");
ok(rotateObject([rw], rw.id)[0].rot === 90 && near(rotateObject([rw], rw.id)[0].gy, pw.gy), "a second Rotate flips it back — ×2 is the identity for a wall piece");
const mv = moveObject([pn], pn.id, 9, 5)[0];
ok(wallOfObject(mv) === "E" && mv.rot === 90, "a wall object moved from the N wall to the E wall takes the E wall's alignment (rot 90)");
const mvLocked = moveObject([pw], pw.id, 0, 0, "W")[0];
ok(mvLocked.rot === 90 && wallOfObject(mvLocked) === "W", "a drag that LOCKED the W wall keeps W at the corner cell (wallOf alone would say N)");
ok(wallOfObject({ gx: 0, gy: 0, rot: 90 }) === "W" && wallOfObject({ gx: 0, gy: 0, rot: 0 }) === "N", "wallOfObject breaks a corner tie by the piece's own axis");
ok(alignedRot(180, "N") === 180 && alignedRot(90, "N") === 0 && alignedRot(270, "E") === 270 && alignedRot(0, "W") === 90, "alignedRot keeps a 180° flip and snaps a perpendicular rotation to the wall");
const legacy = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "M" ? { ...r, layoutRev: STANDARD_LAYOUT_REV, objects: [{ id: "window-9", kind: "window", gx: 0, gy: 5, rot: 0 }] } : r))).find((r) => r.k === "M").objects[0];
ok(legacy.rot === 90, `the WireGuard normalises a legacy misaligned W-wall window to rot 90 (got ${legacy.rot})`);
// the R5 half-foot behaviour, finally gated: mirror h/v and rotate keep the half-foot centres (a Math.round revert fails here)
const mh = mirrorObjects(M, "h"), mvv = mirrorObjects(M, "v");
ok(near(mh.find((o) => o.kind === "bed").gx, 4.5) && near(mh.find((o) => o.kind === "desk").gx, ROOM_GRID - 1 - 7.5) && mh.every(inside), "mirror h keeps the half-foot centres (bed 4.5 → 4.5 · vanity 7.5 → 1.5) and everything inside");
ok(JSON.stringify(mirrorObjects(mh, "h")) === JSON.stringify(M) && JSON.stringify(mirrorObjects(mvv, "v")) === JSON.stringify(M), "mirror is an involution (h∘h = id · v∘v = id)");
ok(mvv.find((o) => o.kind === "bed").rot === 180 && mh.find((o) => o.kind === "window" && wallOfObject(o) === "E")?.rot === 270, "mirror maps the orientation (v: the headboard turns to the S wall · h: the W window becomes an E window)");
const rb = rotateObject(M, "bed-1").find((o) => o.id === "bed-1");
ok(rb.rot === 90 && near(rb.gx, 4.5) && near(rb.gy, 2.5), "Rotate keeps the bed's half-foot pivot (4.5 / 2.5)");
ok(near(clampFootprint(0, 0, 5, 6, 0).gx, 2) && near(clampFootprint(0, 0, 5, 6, 0).gy, 2.5) && near(moveObject([bed], "bed-1", 4, 0)[0].gy, 2.5), "an integer drag lands FLUSH to the wall (the rounded cell is clamped to the fractional bounds — J1)");

// ── 8. R5b — the WireGuard admits only OWN kinds, caps the volume, clamps a stored footprint inside, keeps a flush thin piece ──
const hostile = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "M" ? { ...r, layoutRev: STANDARD_LAYOUT_REV, objects: [
  { id: "x1", kind: "constructor", gx: 1, gy: 1, rot: 0 }, { id: "x2", kind: "__proto__", gx: 1, gy: 1, rot: 0 }, { id: "x3", kind: "toString", gx: 1, gy: 1, rot: 0 }, { id: "x4", kind: "hasOwnProperty", gx: 1, gy: 1, rot: 0 },
  { id: "bed-9", kind: "bed", gx: 9, gy: 9, rot: 0 }, { id: "ok-1", kind: "lamp", gx: 2, gy: 2, rot: 0 }, { id: "mirror-flush", kind: "mirror", gx: -0.4, gy: 5, rot: 90 } ] } : r))).find((r) => r.k === "M").objects;
ok(hostile.length === 3 && hostile.every((o) => Object.hasOwn(OBJECT_SPEC, o.kind)), "inherited-property kinds (constructor / __proto__ / toString / hasOwnProperty) are dropped by the WireGuard (kept: " + hostile.map((o) => o.kind).join(",") + ")");
const bed9 = hostile.find((o) => o.kind === "bed"); const b9 = worldSpan(bed9);
ok(b9.x2 <= ROOM_GRID + 1e-9 && b9.y2 <= ROOM_GRID + 1e-9 && b9.x1 >= -1e-9, "a stored bed at gx 9 is clamped fully inside the room on load (x " + b9.x1 + "–" + b9.x2 + " · y " + b9.y1 + "–" + b9.y2 + ")");
const flush = hostile.find((o) => o.kind === "mirror");
ok(near(flush.gx, -0.4) && near(worldSpan(flush).x1, 0), "a thin wall piece flush to the W wall (gx −0.4, a legal half-foot centre) survives the round-trip unmoved");
const flood = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "M" ? { ...r, layoutRev: STANDARD_LAYOUT_REV, objects: Array.from({ length: 50000 }, (_, i) => ({ id: "l" + i, kind: "lamp", gx: 1, gy: 1, rot: 0 })) } : r))).find((r) => r.k === "M").objects;
ok(flood.length === MAX_OBJECTS_PER_ROOM, `a stored array of 50,000 objects is capped at ${MAX_OBJECTS_PER_ROOM} (got ${flood.length})`);
const longId = sanitizeRoomLayout(TINY_ROOM_LAYOUT.map((r) => (r.k === "M" ? { ...r, layoutRev: STANDARD_LAYOUT_REV, objects: [{ id: "x".repeat(5000), kind: "lamp", gx: 1, gy: 1, rot: 0 }, { id: "dup", kind: "lamp", gx: 1, gy: 1, rot: 0 }, { id: "dup", kind: "lamp", gx: 2, gy: 2, rot: 0 }] } : r))).find((r) => r.k === "M").objects;
ok(longId.length === 2 && longId[0].id.length === 64, "ids are capped at 64 chars and duplicate ids are dropped");

console.log(`\nROOM-STANDARD-LAYOUT ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);

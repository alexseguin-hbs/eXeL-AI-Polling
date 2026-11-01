// ARCHITECT-2525 · THE PHASE MENU gate (operator 2026-11-01: "Phase menu should only show relevant items for framing;
// show 2x4 and 2x6 · remove non standard menus · the visual window is key focus like security 2525, all other menus
// support this"). The one source is lib/architect-phase-palette; the Room Designer renders off it. This gate pins the
// pure mapping + the stud members + the stud skeleton, and (source regex) that room-designer.tsx renders them.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-phase-palette.test.mjs
import fs from "node:fs";
import path from "node:path";
import {
  phasePaletteMode, phaseAllowedGroups, STUD_GAUGES, DEFAULT_STUD_GAUGE, STUD_SPACING_IN,
  studGaugeById, studSkeleton, roomStudSkeleton,
} from "@/lib/architect-phase-palette";
import { ROOM_GRID } from "@/lib/room-objects";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// ── the mapping: a construction phase shows ONLY its own menu; no phase / Interior Design keeps the full palette ──
ok(phasePaletteMode(null) === "furniture", "no phase selected → the full furniture palette (unchanged)");
ok(phasePaletteMode(undefined) === "furniture", "undefined phase → the full furniture palette");
ok(phasePaletteMode("interior") === "furniture", "Interior Design → the full furniture palette (the staging phase)");
ok(phasePaletteMode("framing") === "framing", "Framing → the 2×4 / 2×6 stud menu (operator: 'show 2x4 and 2x6')");
ok(phasePaletteMode("plumbing") === "fixtures" && phasePaletteMode("sewer") === "fixtures", "Plumbing/Sewer → the fixtures they serve");
ok(phasePaletteMode("finish") === "openings", "Finish → doors/windows set in the framed openings");
for (const p of ["foundation", "roofing", "electrical", "internet", "security", "insulation"])
  ok(phasePaletteMode(p) === "none", `${p} → no placement menu (the model is the key focus) `);
ok(phasePaletteMode("not-a-phase") === "furniture", "an unknown phase id falls back to the full palette (never a blank menu)");

// ── the allowed furniture groups per mode — framing + none show NO furniture (the non-standard menus are removed) ──
ok(phaseAllowedGroups("furniture") === "all", "furniture mode shows every group");
{ const g = phaseAllowedGroups("fixtures"); ok(Array.isArray(g) && g.includes("Kitchen") && g.includes("Bath") && !g.includes("Sleep"), "fixtures mode shows only Kitchen + Bath (the plumbing fixtures)"); }
{ const g = phaseAllowedGroups("openings"); ok(Array.isArray(g) && g.length === 1 && g[0] === "Openings", "openings mode shows only Openings"); }
ok(Array.isArray(phaseAllowedGroups("framing")) && phaseAllowedGroups("framing").length === 0, "framing mode shows NO furniture groups (studs only)");
ok(Array.isArray(phaseAllowedGroups("none")) && phaseAllowedGroups("none").length === 0, "none mode shows NO furniture groups");

// ── the framing members the operator named: 2×4 and 2×6, real lumber, framed at 16" o.c. ──
ok(STUD_GAUGES.length === 2, "exactly two framing members (2×4 + 2×6)");
{ const a = STUD_GAUGES.find((g) => g.id === "2x4"), b = STUD_GAUGES.find((g) => g.id === "2x6");
  ok(a && a.label === "2×4" && a.depthIn === 3.5 && a.thickIn === 1.5, "2×4 is actual 1.5\"×3.5\"");
  ok(b && b.label === "2×6" && b.depthIn === 5.5 && b.thickIn === 1.5, "2×6 is actual 1.5\"×5.5\"");
  ok(b.depthIn > a.depthIn, "a 2×6 wall is deeper than a 2×4 (the member reads deeper on the plan)"); }
ok(DEFAULT_STUD_GAUGE === "2x6", "the default is 2×6 (exterior / load-bearing — the home envelope)");
ok(STUD_SPACING_IN === 16, "studs frame at 16\" on-centre");
ok(studGaugeById("2x4").id === "2x4" && studGaugeById(null).id === DEFAULT_STUD_GAUGE && studGaugeById("junk").id === DEFAULT_STUD_GAUGE, "studGaugeById resolves a known id and falls back to the default");

// ── the stud skeleton — deterministic, inside the room, deeper for 2×6, one tick per stud × 4 walls ──
{
  const a = studSkeleton(ROOM_GRID, studGaugeById("2x4"));
  const b = studSkeleton(ROOM_GRID, studGaugeById("2x6"));
  ok(a.perWall >= 8 && a.ticks.length === a.perWall * 4, `one stud mark per wall stud, four walls (perWall ${a.perWall}, ticks ${a.ticks.length})`);
  ok(b.depth > a.depth, "the 2×6 skeleton reads deeper into the room than the 2×4");
  ok(a.spacingFt > 1.3 && a.spacingFt < 1.34, "studs are laid at 16\" o.c. (1.333 ft)");
  // every stud mark is inside the 0..100 viewBox (no stud drawn outside the room)
  ok(a.ticks.every((s) => [s.x1, s.y1, s.x2, s.y2].every((v) => v >= 0 && v <= 100)), "every stud mark sits inside the room plan");
  // determinism: same inputs → identical output
  ok(JSON.stringify(studSkeleton(ROOM_GRID, studGaugeById("2x4"))) === JSON.stringify(a), "studSkeleton is deterministic (identical inputs → identical output)");
  ok(JSON.stringify(roomStudSkeleton("2x4")) === JSON.stringify(a), "roomStudSkeleton('2x4') === studSkeleton(10, 2×4)");
}

// ── the Room Designer renders off the one source (source regex — no React) ──
const HERE = path.dirname(new URL(import.meta.url).pathname);
const rd = fs.readFileSync(path.resolve(HERE, "../components/architect-2525/room-designer.tsx"), "utf8");
ok(/phasePaletteMode\(phase\)/.test(rd), "room-designer computes the palette mode from phasePaletteMode(phase) (one source)");
ok(/data-arch-palette-mode="framing"/.test(rd) && /data-arch-stud=\{g\.id\}/.test(rd), "the Framing menu renders the 2×4 / 2×6 stud selector");
ok(/phaseAllowedGroups\(/.test(rd) && /allowed === "all" \|\| allowed\.includes\(group\)/.test(rd), "the furniture palette is FILTERED to the phase's allowed groups (non-standard menus removed)");
ok(/data-arch-framing-studs/.test(rd) && /studSkel\.ticks\.map/.test(rd), "the plan draws the stud skeleton in the Framing phase (the model is the key focus)");
ok(/data-arch-palette-mode="none"/.test(rd), "a construction phase with no menu names its work in one line (the model is the focus)");

console.log(`\narchitect-phase-palette: ${pass} passed, ${fail} failed · the phase menu shows only relevant items (framing = 2×4/2×6)`);
process.exit(fail ? 1 : 0);

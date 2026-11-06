// ARCHITECT-2525 · PHASE-DISTINCT gate (fleet NEW-1, operator 2026-11-06 via MoT: "SHARPEN THE E1 GATE … each phase's
// render is NON-EMPTY and DISTINCT — no two phases draw the same thing"). This is the whole point of R3: every build phase
// shows its OWN real layer in the walk. The gate replays each phase through the SAME pure modules the walk uses
// (walkFraming · walkMep · walkShell, routed by phaseById/phaseDraw) and asserts: (1) every phase renders something; (2) no
// two phases produce the identical render signature (identical-render groups are size 1).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-phase-distinct.test.mjs
import { DEV_PHASES, phaseById, phaseDraw } from "../lib/architect-phases.ts";
import { walkFraming } from "../lib/architect-walk-framing.ts";
import { walkMep } from "../lib/architect-walk-mep.ts";
import { walkShell } from "../lib/architect-walk-shell.ts";
import { studGaugeById } from "../lib/architect-phase-palette.ts";
import { defaultObjectsForRoom } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };

const gauge = studGaugeById("2x6");
const openings = ["N", "S", "W", "E"].map((side) => ({ side, center: 5, span: 3.2, z0: 0, z1: 6.67 }));
const shellOpenings = ["N", "S", "W", "E"].map((side) => ({ side, center: 5, span: 3.2 }));
const roomObjs = defaultObjectsForRoom("B"); // a bath — richest fixtures for the plumbing phases
const SHELL = new Set(["foundation", "roofing", "insulation", "security", "internet", "finish"]);
const STRUCT = new Set(["framing", "roofing", "insulation"]); // phases that keep the stud frame on

// The render signature the WALK produces for a phase — mirrors the walkthrough's phase→module routing.
function sig(id) {
  const parts = [];
  const d = phaseDraw(id);
  if (STRUCT.has(id)) parts.push("studs:" + walkFraming(gauge, openings).counts.studs);
  if (SHELL.has(id)) { const s = walkShell(id, { gauge, openings: shellOpenings, kind: "B", nbS: true }); parts.push("shellQ:" + s.quads.length, "shellS:" + s.sublines.length, "shellG:" + s.glyphs.map((g) => g.kind).sort().join("+")); }
  const shows = phaseById(id)?.shows;
  if (shows === "wiring" || shows === "water" || shows === "sewer" || shows === "duct") { const m = walkMep(shows, 6, roomObjs, 0, 0, "M"); parts.push("mep:" + shows + ":L" + m.lines.length + ":S" + m.sublines.length + ":G" + m.glyphs.map((g) => g.kind).sort().join("+")); }
  if (d.furniture) parts.push("furniture");
  return parts.join("|");
}

// ── (1) every phase renders a NON-EMPTY layer ──
const sigs = {};
for (const p of DEV_PHASES) {
  const s = sig(p.id);
  sigs[p.id] = s;
  ok(s.length > 0, `${p.label} renders a non-empty layer in the walk (sig "${s}")`);
}

// ── (2) every phase's render is DISTINCT — no two phases draw the same thing (identical-render groups size 1) ──
const seen = new Map();
for (const [id, s] of Object.entries(sigs)) { if (!seen.has(s)) seen.set(s, []); seen.get(s).push(id); }
for (const [s, ids] of seen) ok(ids.length === 1, `render "${s}" is drawn by exactly ONE phase (got ${ids.length}: ${ids.join(", ")})`);
ok(seen.size === DEV_PHASES.length, `all ${DEV_PHASES.length} phases have distinct renders (got ${seen.size} unique signatures)`);

// ── spot-check the headline pairs that used to look alike ──
ok(sigs.plumbing !== sigs.sewer, "Plumbing ≠ Sewer (water supply vs DWV)");
ok(sigs.framing !== sigs.roofing && sigs.roofing !== sigs.insulation, "Framing ≠ Roofing ≠ Insulation (studs vs trusses vs batts)");
ok(sigs.foundation !== sigs.insulation && sigs.security !== sigs.internet, "Foundation ≠ Insulation · Security ≠ Internet");
ok(sigs.electrical !== sigs.plumbing && sigs.interior !== sigs.finish, "Electrical ≠ Plumbing · Interior ≠ Finish");
ok(sigs.hvac && sigs.hvac.includes("duct") && sigs.hvac !== sigs.electrical, "HVAC renders the duct layer and is distinct from Electrical (the reachable HVAC phase)");
ok(sigs.framing !== sigs.roofing, "Roofing ≠ Framing (pitched roof in the plenum, distinct colour — not the stud wall)");

console.log(`\nARCHITECT-PHASE-DISTINCT ${pass}/${pass + fail} passed · every phase renders a NON-EMPTY, DISTINCT layer in the walk`);
if (fail > 0) process.exit(1);

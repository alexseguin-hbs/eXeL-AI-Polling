// ARCHITECT-2525 · DIRECTIONS DRIFT GATE — "the build directions MATCH the drawing" (Revision A · P0·H, 5 Masters; plan
// WAVE 2 — Pillar 3). The build instructions (lib/architect-build-instructions.ts) once hardcoded an 8-ft wall against the
// 10-ft storey the walk draws (room-layout STOREY_FT), printed outlets at "12–16″" against the 18″ the walk mounts them at
// (mep-runs OUTLET_AFF_FT), framed studs from its own `16/12` instead of the one STUD_SPACING_IN the plan + walk share,
// and 5 of the 12 walk phases had no directions at all (12 DEV_PHASES vs 6 BUILD_ORDER elements, no map).
// This gate is CROSS-SOURCE: it reads the directions' NUMERIC fields and the drawing's own constants and asserts they are
// the same number — red on the drifted code, green once the directions read the one source. Three parts:
//   (a) SOURCE SCAN — the module imports the one source for each number and no drifted literal survives;
//   (b) NUMERIC — for the Cube form, wall height === STOREY_FT · stud spacing === STUD_SPACING_IN · outlet AFF text ===
//       ftIn(OUTLET_AFF_FT) · outlets/circuits/amps === the per-room electricSpecs the designer/BOM/walk read, summed;
//   (c) PHASE → ELEMENT — every DEV_PHASES id resolves through ONE pure map (elementForPhase) to a BUILD_ORDER element
//       or an explicit null ("no take-off"), with no fourth vocabulary.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildInstructions, formGeometry, BUILD_ORDER } from "@/lib/architect-build-instructions";
import * as Phases from "@/lib/architect-phases";
import { ELEMENTS, SIM_MODELS, modelById } from "@/lib/architect-sim-options";
import { STOREY_FT, TINY_ROOM_LAYOUT, layoutTotals } from "@/lib/room-layout";
import { STUD_SPACING_IN, STUD_GAUGES, studOffsetsFt } from "@/lib/architect-phase-palette";
import { OUTLET_AFF_FT, electricSpecs } from "@/lib/mep-runs";
import { ftIn } from "@/lib/dim-annot";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(here, "../lib/architect-build-instructions.ts"), "utf8");

// ── (a) SOURCE SCAN — one source per number, imported; no drifted literal survives ──────────────────────────────────
const importsFrom = (mod, name) => {
  const re = new RegExp(`import\\s*(?:type\\s*)?\\{([^}]*)\\}\\s*from\\s*["'](?:@/lib/|\\./)${mod}["']`, "g");
  let m; while ((m = re.exec(src))) if (m[1].split(",").some((s) => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0] === name)) return true;
  return false;
};
ok(importsFrom("room-layout", "STOREY_FT"), "build-instructions imports STOREY_FT from room-layout (the 10-ft storey the walk draws)");
ok(importsFrom("architect-phase-palette", "STUD_SPACING_IN"), "build-instructions imports STUD_SPACING_IN from architect-phase-palette (the one stud spacing)");
ok(importsFrom("architect-phase-palette", "STUD_GAUGES"), "build-instructions imports STUD_GAUGES from architect-phase-palette (the 2×4 / 2×6 the framing phase offers)");
ok(importsFrom("mep-runs", "OUTLET_AFF_FT"), "build-instructions imports OUTLET_AFF_FT from mep-runs (the outlet height the walk mounts)");
ok(importsFrom("mep-runs", "electricSpecs"), "build-instructions imports electricSpecs from mep-runs (circuits + amps, the designer's formula)");
ok(importsFrom("dim-annot", "ftIn"), "build-instructions imports ftIn from dim-annot (one feet-inches formatter)");
ok(!/\bht\s*=\s*8\b/.test(src), "no literal `ht = 8` survives (wall height is STOREY_FT)");
ok(!/wallHt:\s*8\b/.test(src), "no literal `wallHt: 8` survives");
ok(!/12–16″|12-16″|12–16"/.test(src), "no literal `12–16″` outlet height survives (it is ftIn(OUTLET_AFF_FT))");
ok(!/\b16\s*\/\s*12\b/.test(src), "no literal `16/12` stud step survives (it is STUD_SPACING_IN / studOffsetsFt)");
ok(!/\b(?:Main panel|panel)\b[^\n]*"200 A"/.test(src), "no hardcoded \"200 A\" panel survives (amps come from electricSpecs)");

// ── (b) NUMERIC — the Cube's directions carry the drawing's numbers ───────────────────────────────────────────────────
const cube = modelById("3x3-grid");
ok(!!cube, "the Cube 3×3 model exists");
const bi = buildInstructions("3x3-grid");
const truth = bi.truth;
ok(truth && typeof truth === "object", "buildInstructions() carries a NUMERIC `truth` block (H1: directions are numbers, not prose)");
// wall height — every form is the one storey
for (const m of SIM_MODELS) ok(formGeometry(m).wallHt === STOREY_FT, `${m.id} formGeometry.wallHt === STOREY_FT (${STOREY_FT} ft) — got ${formGeometry(m).wallHt}`);
ok(truth?.wallHtFt === STOREY_FT, `truth.wallHtFt === STOREY_FT (${STOREY_FT}) — got ${truth?.wallHtFt}`);
// stud spacing + gauges — the one framing source
ok(truth?.studSpacingIn === STUD_SPACING_IN, `truth.studSpacingIn === STUD_SPACING_IN (${STUD_SPACING_IN}) — got ${truth?.studSpacingIn}`);
ok(JSON.stringify(truth?.studGauges) === JSON.stringify(STUD_GAUGES.map((g) => g.label)), `truth.studGauges === STUD_GAUGES labels (${STUD_GAUGES.map((g) => g.label).join(" / ")}) — got ${JSON.stringify(truth?.studGauges)}`);
const framing = bi.phases.find((p) => p.element === "Wall System");
const studItem = framing?.steps.flatMap((s) => s.items).find((it) => /stud/i.test(it.equipment));
ok(!!studItem && studItem.count.includes(`@${STUD_SPACING_IN}″ o.c.`), `the stud line prints the one spacing "@${STUD_SPACING_IN}″ o.c." — got "${studItem?.count}"`);
ok(!!studItem && studItem.dimensions.includes(`${STOREY_FT}′ wall`), `the stud line prints the ${STOREY_FT}′ wall — got "${studItem?.dimensions}"`);
ok(!!studItem && STUD_GAUGES.every((g) => studItem.equipment.includes(g.label)), `the stud member names the framing gauges (${STUD_GAUGES.map((g) => g.label).join(" / ")}) — got "${studItem?.equipment}"`);
// the stud COUNT follows studOffsetsFt (the plan + walk layout), not a private step
{
  const g = formGeometry(cube);
  const expected = Math.round((studOffsetsFt(g.extWallLF).length + studOffsetsFt(g.intWallLF).length) * 1.15);
  const n = studItem ? parseInt((/≈\s*([\d,]+)/.exec(studItem.count) || [])[1]?.replace(/,/g, "") ?? "NaN", 10) : NaN;
  ok(n === expected, `the Cube stud count derives from studOffsetsFt (${expected}) — got ${n}`);
}
// outlets — the height the walk mounts them at, as feet-inches
const elec = bi.phases.find((p) => p.element === "Electrical");
const outletItem = elec?.steps.flatMap((s) => s.items).find((it) => /outlet/i.test(it.equipment));
ok(truth?.outletAffFt === OUTLET_AFF_FT, `truth.outletAffFt === OUTLET_AFF_FT (${OUTLET_AFF_FT}) — got ${truth?.outletAffFt}`);
ok(truth?.outletAffText === ftIn(OUTLET_AFF_FT), `truth.outletAffText === ftIn(OUTLET_AFF_FT) ("${ftIn(OUTLET_AFF_FT)}") — got "${truth?.outletAffText}"`);
ok(!!outletItem && outletItem.dimensions.includes(ftIn(OUTLET_AFF_FT)), `the outlet line prints ${ftIn(OUTLET_AFF_FT)} AFF (= ${OUTLET_AFF_FT * 12}″) — got "${outletItem?.dimensions}"`);
ok(ftIn(OUTLET_AFF_FT) === `1'-6"`, "ftIn(OUTLET_AFF_FT) reads 1'-6\" — the 18″ the walk draws");
// outlets / circuits / amps / wire — the per-room electricSpecs the designer, BOM and walk read, summed over the 9 rooms
{
  const rooms = TINY_ROOM_LAYOUT.map((r) => electricSpecs(r.outlets));
  const exp = { outlets: layoutTotals(TINY_ROOM_LAYOUT).outlets, circuits: rooms.reduce((s, e) => s + e.circuits, 0), amps: rooms.reduce((s, e) => s + e.amps, 0), wireFt: rooms.reduce((s, e) => s + e.wireFt, 0) };
  ok(truth?.outlets === exp.outlets, `truth.outlets === the standard layout's outlets (${exp.outlets}) — got ${truth?.outlets}`);
  ok(truth?.circuits === exp.circuits, `truth.circuits === Σ per-room electricSpecs.circuits (${exp.circuits}) — got ${truth?.circuits}`);
  ok(truth?.amps === exp.amps, `truth.amps === Σ per-room electricSpecs.amps (${exp.amps}) — got ${truth?.amps}`);
  ok(truth?.wireFt === exp.wireFt, `truth.wireFt === Σ per-room electricSpecs.wireFt (${exp.wireFt}) — got ${truth?.wireFt}`);
  ok(!!outletItem && new RegExp(`≈\\s*${exp.outlets}\\s*outlets`).test(outletItem.count), `the outlet line counts the layout's ${exp.outlets} outlets — got "${outletItem?.count}"`);
  const circItem = elec?.steps.flatMap((s) => s.items).find((it) => /^circuits$/i.test(it.equipment));
  ok(!!circItem && new RegExp(`≈\\s*${exp.circuits}\\b`).test(circItem.count), `the circuits line counts ${exp.circuits} (≤8 outlets per 15 A circuit) — got "${circItem?.count}"`);
  const panelItem = elec?.steps.flatMap((s) => s.items).find((it) => /panel/i.test(it.equipment));
  ok(!!panelItem && panelItem.dimensions.includes(`${exp.amps} A`), `the panel line carries the ${exp.amps} A branch load from electricSpecs — got "${panelItem?.dimensions}"`);
}
// the truth block is one source with the geometry it describes (no second copy of the wall height)
ok(truth?.wallHtFt === formGeometry(cube).wallHt, "truth.wallHtFt is the same number as formGeometry.wallHt");

// ── (c) PHASE → ELEMENT — one pure map, every walk phase resolves, no fourth vocabulary ───────────────────────────────
const { DEV_PHASES } = Phases;
ok(typeof Phases.elementForPhase === "function", "architect-phases exports elementForPhase(phaseId) (pure)");
ok(Phases.PHASE_ELEMENT && typeof Phases.PHASE_ELEMENT === "object", "architect-phases exports the PHASE_ELEMENT map (one source)");
const map = Phases.PHASE_ELEMENT ?? {};
const efp = typeof Phases.elementForPhase === "function" ? Phases.elementForPhase : () => undefined;
const ids = DEV_PHASES.map((p) => p.id);
ok(ids.length === 12, `12 DEV_PHASES (got ${ids.length})`);
for (const id of ids) {
  ok(Object.prototype.hasOwnProperty.call(map, id), `phase "${id}" is an EXPLICIT key of PHASE_ELEMENT (an element or null — never defaulted)`);
  const el = efp(id);
  ok(el === null || ELEMENTS.includes(el), `elementForPhase("${id}") → an ELEMENTS name or null — got ${JSON.stringify(el)}`);
  ok(el === null || BUILD_ORDER.includes(el), `elementForPhase("${id}") → a BUILD_ORDER element (the directions' six) — got ${JSON.stringify(el)}`);
  ok(el === (map[id] ?? null), `elementForPhase("${id}") reads PHASE_ELEMENT (no second map)`);
}
ok(Object.keys(map).every((k) => ids.includes(k)), `PHASE_ELEMENT has no key outside DEV_PHASES (no fourth vocabulary) — extra: ${Object.keys(map).filter((k) => !ids.includes(k)).join(",") || "none"}`);
ok(Object.keys(map).length === ids.length, `PHASE_ELEMENT covers exactly the ${ids.length} phases (got ${Object.keys(map).length})`);
for (const el of BUILD_ORDER) ok(ids.some((id) => efp(id) === el), `BUILD_ORDER element "${el}" is reached by at least one walk phase`);
// the seven construction phases that have a take-off, and the five that honestly have none
const expectMap = { foundation: "Foundation", framing: "Wall System", roofing: "Roof", plumbing: "Plumbing", sewer: "Plumbing", electrical: "Electrical", hvac: "HVAC", internet: null, security: null, insulation: null, finish: null, interior: null };
for (const [id, el] of Object.entries(expectMap)) ok(efp(id) === el, `elementForPhase("${id}") === ${JSON.stringify(el)} — got ${JSON.stringify(efp(id))}`);
ok(efp("nope") === null && efp(null) === null && efp(undefined) === null, "an unknown / empty phase id → null (no crash, no guess)");
ok(Object.values(map).filter((v) => v === null).length === 5, `exactly 5 phases have no take-off (got ${Object.values(map).filter((v) => v === null).length})`);

// determinism (replay law) — the truth block is pure
ok(JSON.stringify(buildInstructions("3x3-grid").truth) === JSON.stringify(buildInstructions("3x3-grid").truth), "the truth block is deterministic");

console.log(`\narchitect-directions-drift: ${pass} passed, ${fail} failed · wall ${STOREY_FT}′ · studs @${STUD_SPACING_IN}″ · outlets ${ftIn(OUTLET_AFF_FT)} AFF · 12 phases → 6 elements or null`);
process.exit(fail ? 1 : 0);

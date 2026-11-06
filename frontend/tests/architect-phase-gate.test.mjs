// ARCHITECT-2525 · PHASE-GATE gate (fleet NEW-2, operator 2026-11-06 via MoT: "PHASE-GATE THE MEP OVERLAYS … a layer
// shows ONLY in its phase … Add a gate: a non-electrical phase renders 0 wires/outlets"). The walk drives its MEP
// overlay from the SELECTED PHASE (architect-walkthrough.tsx): when a phase is selected, ONLY that phase's own
// `shows` layer is drawn — the Design-Settings toggles are an overview-only aid. This gate replays that exact pure
// decision over EVERY phase and feeds it through the real walkMep module, proving:
//   · Electrical is the ONLY phase that draws wires + outlet boxes;
//   · a non-electrical phase (Framing, Plumbing, Sewer, …) renders 0 wires AND 0 outlet boxes;
//   · each MEP phase draws EXACTLY its own layer (water→water, sewer→sewer, wiring→wiring) and nothing else.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-phase-gate.test.mjs
import { DEV_PHASES, phaseById } from "../lib/architect-phases.ts";
import { walkMep } from "../lib/architect-walk-mep.ts";
import { MEP_COLOR } from "../lib/mep-runs.ts";
import { defaultObjectsForRoom } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };

// The SAME decision the walk makes (architect-walkthrough.tsx): a selected phase shows ONLY its own layer.
// showSockets is the overview ⚡ aid → it only fires when NO phase is selected (!hasPhase).
function layersFor(phaseId, { showSockets = true } = {}) {
  const pShows = phaseById(phaseId)?.shows;
  const hasPhase = !!phaseById(phaseId);
  const layers = [];
  if (hasPhase) {
    if (pShows === "wiring" || pShows === "water" || pShows === "sewer") layers.push(pShows);
  }
  const socketsOnly = !hasPhase && showSockets && !layers.includes("wiring");
  return { layers, socketsOnly };
}

// Count ELECTRICAL wires + outlet boxes the walk would render (6 receptacles, a bath's fixtures available). "wires"
// means the WIRING layer only — a phase's own water pipes / sewer drains are its legitimate layer, not a wire leak.
function wiresAndOutlets(phaseId) {
  const { layers, socketsOnly } = layersFor(phaseId);
  let wires = 0, outlets = 0;
  for (const layer of layers) {
    const g = walkMep(layer, 6, defaultObjectsForRoom("B"));
    if (layer === "wiring") wires += g.lines.length;
    outlets += g.boxes.filter((b) => b.kind === "outlet").length;
  }
  if (socketsOnly) { const g = walkMep("wiring", 6, []); outlets += g.boxes.filter((b) => b.kind === "outlet").length; }
  return { wires, outlets, layers, socketsOnly };
}

// ── EVERY phase: only Electrical draws wires + outlet boxes; every other phase renders 0 wires AND 0 outlets ──
for (const p of DEV_PHASES) {
  const { wires, outlets } = wiresAndOutlets(p.id);
  if (p.id === "electrical") {
    ok(wires > 0 && outlets === 6, `Electrical draws its wiring layer (wires ${wires} · outlets ${outlets})`);
  } else {
    ok(wires === 0, `${p.label} renders 0 electrical wires (got ${wires}) — no wiring leak outside the Electrical phase`);
    ok(outlets === 0, `${p.label} renders 0 outlet boxes (got ${outlets}) — the ⚡ aid is suppressed under a phase`);
  }
}

// ── each MEP phase draws EXACTLY its own layer ──
ok(layersFor("plumbing").layers.join() === "water", "Plumbing draws only the water layer");
ok(layersFor("sewer").layers.join() === "sewer", "Sewer draws only the sewer layer");
ok(layersFor("electrical").layers.join() === "wiring", "Electrical draws only the wiring layer");
ok(layersFor("framing").layers.length === 0, "Framing draws NO MEP layer (it is the structure phase)");
ok(layersFor("foundation").layers.length === 0 && !layersFor("foundation").socketsOnly, "Foundation draws no MEP + no ⚡ aid");

// ── the ⚡ aid is OVERVIEW-only: no phase selected → the Sockets toggle can show outlet boxes ──
const overview = layersFor(null, { showSockets: true });
ok(overview.socketsOnly === true, "no phase selected → the ⚡ Sockets aid is available (overview only)");
const overviewOutlets = wiresAndOutlets(null).outlets;
ok(overviewOutlets === 6, `overview with ⚡ on draws the outlet boxes (got ${overviewOutlets})`);

// ── colour source is shared (one MEP_COLOR), so a phase's layer reads in its canonical colour ──
ok(walkMep("water", 0, defaultObjectsForRoom("B")).color === MEP_COLOR.water, "Plumbing's water layer uses the shared MEP_COLOR.water");

console.log(`\nARCHITECT-PHASE-GATE ${pass}/${pass + fail} passed · a layer shows ONLY in its phase · non-electrical → 0 wires/outlets · ⚡ aid is overview-only`);
if (fail > 0) process.exit(1);

// ARCHITECT-2525 · DEVELOPMENT PHASES gate (operator 2026-10-25: "there needs to be modes of phases of development";
// 2026-10-31: "roofing is not 8 … roof needs to be close to framing; maybe after" · "Place icons and phases in order
// of build" · "insulation is likely something to add throughout" · "mode should only show that layer of key elements
// (not furniture. add Interior Design one element for toggle"). Holds the phases to their contract: the REAL BUILD
// ORDER (Roofing right after Framing; Insulation after the rough-ins; Interior Design last), each phase's real specs +
// the operator's blurb, what each phase DRAWS (only its own layer; furniture ONLY on Interior Design), and the one
// ordered list every surface reads (so the order is consistent throughout).
import { DEV_PHASES, phaseById, PHASE_ORDER, BUILD_PHASES, phaseDraw } from "../lib/architect-phases.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// THE BUILD ORDER — the one source every surface reads (operator 2026-10-31). Roofing is 3 (right after Framing), NOT last.
const ORDER = ["foundation", "framing", "roofing", "plumbing", "sewer", "electrical", "hvac", "internet", "security", "insulation", "finish", "interior"];
ok(DEV_PHASES.length === 12, `exactly 12 phases (got ${DEV_PHASES.length})`);
ok(JSON.stringify(PHASE_ORDER) === JSON.stringify(ORDER), `PHASE_ORDER is the build order (got ${PHASE_ORDER.join(",")})`);
ORDER.forEach((id, i) => {
  const p = DEV_PHASES[i];
  ok(!!p && p.id === id, `phase ${i + 1} is ${id} (got ${p && p.id})`);
  ok(!!p && p.order === i + 1, `${id} carries build order ${i + 1}`);
});
// Roofing is right after Framing (the dry-in order) — his loud ask "roofing is not 8".
ok(phaseById("roofing").order === 3 && phaseById("framing").order === 2, "Roofing (3) comes right after Framing (2) — dry-in before the rough-ins");
ok(phaseById("roofing").order < phaseById("plumbing").order && phaseById("roofing").order < phaseById("electrical").order, "Roofing is before the MEP rough-ins");
ok(phaseById("insulation").order > phaseById("security").order && phaseById("insulation").order < phaseById("finish").order, "Insulation after the rough-ins, before Finish");
ok(phaseById("interior").order === 12, "Interior Design is the last phase (staging)");
// HVAC (Air Flow) is an MEP rough-in: right after Electrical, before Internet (R3 reinforcement — the duct phase the walk reaches)
ok(phaseById("hvac").order === 7 && phaseById("hvac").shows === "duct" && phaseById("hvac").draw.mep === "duct", "HVAC (Air Flow) is order 7 and shows the duct layer");
ok(phaseById("hvac").order > phaseById("electrical").order && phaseById("hvac").order < phaseById("internet").order, "HVAC sits between Electrical and Internet");

for (const p of DEV_PHASES) {
  ok(!!p.label && !!p.blurb && p.blurb.length > 10, `${p.id} has a label + blurb`);
  ok(Array.isArray(p.specs) && p.specs.length >= 3 && p.specs.every((s) => typeof s === "string" && s.length > 5), `${p.id} has >= 3 real specs`);
  ok(!!p.color && !!p.icon, `${p.id} has a color + icon`);
  ok(typeof p.treeGroup === "string" && p.treeGroup.startsWith("physical/"), `${p.id} treeGroup is a physical discipline group`);
  ok(typeof p.buildPhase === "boolean" && !!p.draw, `${p.id} carries buildPhase + a draw layer`);
}

// the four MEP phases map to their wireframe layer; the others draw no MEP run
ok(phaseById("plumbing").shows === "water" && phaseById("plumbing").draw.mep === "water", "plumbing → water layer");
ok(phaseById("sewer").shows === "sewer" && phaseById("sewer").draw.mep === "sewer", "sewer → sewer layer");
ok(phaseById("electrical").shows === "wiring" && phaseById("electrical").draw.mep === "wiring", "electrical → wiring layer");
ok(phaseById("framing").shows === "structure" && phaseById("framing").draw.structure === true, "framing → structure layer");
for (const id of ["foundation", "roofing", "internet", "security", "insulation", "finish", "interior"]) ok(phaseById(id).shows === null, `${id} shows no MEP run (shows=null)`);

// A PHASE SHOWS ONLY ITS LAYER — furniture ONLY on Interior Design (operator 2026-10-31)
ok(phaseById("interior").draw.furniture === true, "Interior Design shows the furniture layer");
for (const p of DEV_PHASES) ok(p.id === "interior" || p.draw.furniture === false, `${p.id} does NOT show furniture (only Interior Design does)`);
ok(phaseById("interior").buildPhase === false, "Interior Design is staging, not a build-time phase");
// no phase selected → the full design view (everything)
ok(phaseDraw(null).furniture && phaseDraw(null).structure && phaseDraw(null).openings, "no phase selected → draw everything (the full design view)");
ok(phaseDraw("nope").furniture, "an unknown phase id falls back to the full view");

// BUILD_PHASES = the construction phases that take build time (Interior Design excluded)
ok(BUILD_PHASES.length === 11 && !BUILD_PHASES.some((p) => p.id === "interior"), "BUILD_PHASES = 11 construction phases, Interior Design excluded");
ok(BUILD_PHASES.every((p) => p.buildPhase), "every BUILD_PHASE is a construction phase");

// the operator's intent words survive in the content
ok(/starlink/i.test(phaseById("internet").specs.join(" ")), "Internet is optimized for Starlink + LAN");
ok(/talisman|sensorfusion|sensor fusion/i.test(phaseById("security").specs.join(" ")), "Security = Talisman / SensorFusion camera network");
ok(/4 cameras.*corner|corner.*camera/i.test(phaseById("security").specs.join(" ")), "Security default = 4 corner roof cameras");
ok(/cement|slab|concrete|base/i.test(phaseById("foundation").blurb + phaseById("foundation").specs.join(" ")), "Foundation = cement + base");
ok(/waste|toilet|drain|dwv/i.test(phaseById("sewer").blurb + phaseById("sewer").specs.join(" ")), "Sewer = waste / sink / shower / toilet");
ok(/r-?20|r-?49|iecc|ach50|insulat/i.test(phaseById("insulation").specs.join(" ")), "Insulation = R-value envelope (IECC)");
ok(/drywall|flooring|trim|paint/i.test(phaseById("finish").specs.join(" ")), "Finish = drywall / flooring / trim / paint");
ok(/furniture/i.test(phaseById("interior").specs.join(" ")), "Interior Design = the furniture layer");
ok(phaseById("nope") === null, "an unknown phase id resolves to null");

// ALIGN TO THE EXISTING MENU (operator 2026-10-25) — each phase maps to a real Vision-Tree discipline group id.
const GROUPS = {
  foundation: "physical/foundation", framing: "physical/structure", roofing: "physical/building-envelope",
  plumbing: "physical/plumbing", sewer: "physical/plumbing", electrical: "physical/electrical",
  hvac: "physical/hvac", internet: "physical/communications-low-voltage", security: "physical/communications-low-voltage",
  insulation: "physical/building-envelope", finish: "physical/interior-finish", interior: "physical/interior",
};
for (const [id, g] of Object.entries(GROUPS)) ok(phaseById(id).treeGroup === g, `${id} aligns to the Vision-Tree group ${g}`);

console.log(`\narchitect-phases: ${pass} passed, ${fail} failed · 12 build-ordered phase modes (roofing after framing; HVAC after electrical; insulation; interior design)`);
process.exit(fail ? 1 : 0);

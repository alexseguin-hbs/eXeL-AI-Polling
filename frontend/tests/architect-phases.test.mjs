// ARCHITECT-2525 · DEVELOPMENT PHASES gate (operator 2026-10-25: "there needs to be modes of phases of development").
// Holds the eight phase modes to their contract: build order, real specs, the operator's blurb, and the four
// MEP phases mapping to an existing wireframe layer (the four new ones honestly spec-only until their layer ships).
import { DEV_PHASES, phaseById } from "../lib/architect-phases.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const ORDER = ["foundation", "framing", "electrical", "plumbing", "sewer", "internet", "security", "roofing"];
ok(DEV_PHASES.length === 8, `exactly 8 phases (got ${DEV_PHASES.length})`);
ORDER.forEach((id, i) => {
  const p = DEV_PHASES[i];
  ok(!!p && p.id === id, `phase ${i + 1} is ${id} (got ${p && p.id})`);
  ok(!!p && p.order === i + 1, `${id} carries build order ${i + 1}`);
});
for (const p of DEV_PHASES) {
  ok(!!p.label && !!p.blurb && p.blurb.length > 10, `${p.id} has a label + blurb`);
  ok(Array.isArray(p.specs) && p.specs.length >= 3 && p.specs.every((s) => typeof s === "string" && s.length > 5), `${p.id} has >= 3 real specs`);
  ok(!!p.color && !!p.icon, `${p.id} has a color + icon`);
}
// the four systems that already have a wireframe layer map to it; the four new ones are spec-only (honest) for now
ok(phaseById("framing").shows === "structure", "framing → structure layer");
ok(phaseById("electrical").shows === "wiring", "electrical → wiring layer");
ok(phaseById("plumbing").shows === "water", "plumbing → water layer");
ok(phaseById("sewer").shows === "sewer", "sewer → sewer layer");
for (const id of ["foundation", "internet", "security", "roofing"]) ok(phaseById(id).shows === null, `${id} is spec-only until its layer ships (shows=null)`);
// the operator's intent words survive in the content
ok(/starlink/i.test(phaseById("internet").specs.join(" ")), "Internet is optimized for Starlink + LAN");
ok(/sensorfusion|sensor fusion/i.test(phaseById("security").specs.join(" ")), "Security = camera network / sensor fusion");
ok(/cement|slab|concrete|base/i.test(phaseById("foundation").blurb + phaseById("foundation").specs.join(" ")), "Foundation = cement + base");
ok(/waste|toilet|drain|dwv/i.test(phaseById("sewer").blurb + phaseById("sewer").specs.join(" ")), "Sewer = waste / sink / shower / toilet");
ok(phaseById("nope") === null, "an unknown phase id resolves to null");
// ALIGN TO THE EXISTING MENU (operator 2026-10-25) — each phase maps to a real Vision-Tree discipline group id, so
// selecting a phase scopes that menu to its layer (only-modify-those). The four new phases reuse the right group too.
const GROUPS = {
  foundation: "physical/foundation", framing: "physical/structure", electrical: "physical/electrical",
  plumbing: "physical/plumbing", sewer: "physical/plumbing", internet: "physical/communications-low-voltage",
  security: "physical/communications-low-voltage", roofing: "physical/building-envelope",
};
for (const [id, g] of Object.entries(GROUPS)) ok(phaseById(id).treeGroup === g, `${id} aligns to the Vision-Tree group ${g}`);
for (const p of DEV_PHASES) ok(typeof p.treeGroup === "string" && p.treeGroup.startsWith("physical/"), `${p.id} treeGroup is a physical discipline group`);

console.log(`\narchitect-phases: ${pass} passed, ${fail} failed · 8 development phase modes`);
process.exit(fail ? 1 : 0);

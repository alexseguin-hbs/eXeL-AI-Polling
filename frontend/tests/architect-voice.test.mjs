// ARCHITECT-2525 · HUMAN VOICE GATE (operator 2026-11-01: "some text is for computers AI & Analytics … now optimized for
// UX of H.I." · the standing "THE SIGNER NEVER MEETS THE MACHINE" law). No machine / dev / analytics word on a human
// path in the home-design PRODUCT. Modelled on tests/sign-lexicon-voice.test.mjs. Scans the RENDERED strings (comments
// stripped) of each CLEANED surface and fails on a banned term. The cleaned-surface list GROWS as each surface is
// refactored human-first (R-UX6, one revision at a time) — so the gate is green for what is done and never regresses.
// Run: node tests/architect-voice.test.mjs
import fs from "node:fs";
import path from "node:path";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");   // only RENDERED copy is judged, never code comments

// Machine / dev / platform / analytics vocabulary that must never face a person using Architect-2525.
// NOTE: estimate language the operator himself sanctioned — ASSUMED, DERIVED, "NOT CALCULATED" (the honest THOW / Overview
// states) — is NOT banned; the refactor rewords the FRAMING around them into plain words. SSSES / SPIRAL / R-CORE get NO
// exemption (operator 2026-11-01: they belong to building the platform, not to the product).
const BANNED = /\bNOT_RUN\b|\bNOT STARTED\b|engine-derived|\bfrom the (estimate )?engine\b|\bdeterministic\b|\bcanonical\b|\bvoxel\b|\bwireframe\b|\bR-CORE\b|\bSSSES\b|\bSPIRAL\b|\bREPLAY ENGINE\b|\bDIGITAL TWINS?\b|project_hash|\bOBSERVABILITY\b|\bREVIEWABLE\b|V2525-\d|\brun all 3 first\b/;

// the CLEANED surfaces — each is added in the revision that refactored it human-first (R-UX6)
const CLEANED = [
  "../components/architect-2525/simulate-options.tsx",   // D1 (2026-11-01): Simulate — live, no run button, human copy
];
for (const f of CLEANED) {
  const src = strip(read(f));
  const hit = src.match(BANNED);
  ok(!hit, `${f.replace("../components/architect-2525/", "")} — no machine/dev word on the human path (got "${hit ? hit[0] : "none"}")`);
}

// the Simulate surface specifically speaks human (positive checks)
const so = strip(read("../components/architect-2525/simulate-options.tsx"));
ok(/THREE WAYS TO BUILD YOUR HOME/.test(so), "the Simulate heading speaks to a person (not 'SIMULATE · ALTERNATIVE DESIGN OPTIONS')");
ok(/not a final engineering check/.test(so), "the honesty note is reworded human ('a quick design preview — not a final engineering check')");
ok(/scored live from your 3×3 design/.test(so), "the subtitle says the designs are scored live from the 3×3");

console.log(`\narchitect-voice: ${pass} passed, ${fail} failed · no machine words on the human path (cleaned surfaces: ${CLEANED.length})`);
process.exit(fail ? 1 : 0);

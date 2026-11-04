// ARCHITECT-2525 · IMMERSION (walk + look-around) + the Simulate→Design click (operator 2026-11-03:
// "walk floors overhead view and immersion view and look around to see walls, corners"; "ensure immersion mode is
// added to 3x3"; "click one of images → open that build type in the Design tab"). Source-scan gate, like
// architect-sim-print. INVARIANTS: walk mode's look angle is FREE (not locked), the Cube mockup on Simulate is a
// click target that opens the Design Room Designer, and the shell maps the form id → market + jumps to Design→Model.
// Run: node tests/architect-immersion.test.mjs
import fs from "node:fs";
import path from "node:path";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const voxel = read("../components/architect-2525/voxel-house.tsx");
const opts = read("../components/architect-2525/simulate-options.tsx");
const panels = read("../components/architect-2525/architect-panels2.tsx");
const shell = read("../components/architect-2525/command-ux1.tsx");

// ── IMMERSION look-around: walk mode no longer LOCKS the tilt; pitch is free so you can look up/down at walls/corners ──
ok(!/effPitch\s*=\s*walk\s*\?\s*20/.test(voxel), "the old locked walk tilt (effPitch = walk ? 20 : …) is GONE — the look angle is no longer pinned");
ok(/const\s+effPitch\s*=\s*pitch\b/.test(voxel), "walk uses the live pitch (free look up/down to see walls & corners)");
ok(/useEffect\(\s*\(\)\s*=>\s*\{\s*cam\.setPitch\(walk\s*\?/.test(voxel), "entering walk drops the camera to eye level once (cam.setPitch on the walk toggle), then the user looks around freely");
ok(/const\s+effZoom\s*=\s*walk\s*\?\s*3\.2\s*:\s*zoom/.test(voxel), "walk still stands inside the room (effZoom 3.2) — the immersion position is kept");
ok(/import\s*\{[^}]*\buseEffect\b[^}]*\}\s*from\s*"react"/.test(voxel), "useEffect is imported for the walk eye-level effect");

// ── the Simulate mockup is a CLICK TARGET that opens the build in Design (operator: click the image) ──
ok(/onOpenInDesign\?\:\s*\(formId:\s*string\)\s*=>\s*void/.test(opts), "SimulateOptions accepts an onOpenInDesign(formId) callback");
ok(/data-arch-sim-open=\{m\.id\}/.test(opts) && /onClick=\{\(\)\s*=>\s*onOpenInDesign\(m\.id\)\}/.test(opts), "the mockup is wrapped in a click target (data-arch-sim-open) that calls onOpenInDesign(m.id)");
ok(/onOpenInDesign\s*&&\s*m\.id\s*===\s*"3x3-grid"/.test(opts), "the Cube (3x3-grid) mockup is the wired click target this revision (editable geometry exists); other forms land in their geometry revisions");
ok(/aria-label=\{`Edit the \$\{m\.label\} rooms in Design/.test(opts), "the click target has a human aria-label (accessibility)");
ok(/walk the floors/.test(opts), "the affordance tells the user clicking walks the floors in Design");

// ── the callback is threaded through the panel wrapper, not dropped ──
ok(/SimulatePanel\(\{\s*designRooms,\s*onOpenInDesign\s*\}/.test(panels) && /<SimulateOptions\s+designRooms=\{designRooms\}\s+onOpenInDesign=\{onOpenInDesign\}/.test(panels), "SimulatePanel threads onOpenInDesign down to SimulateOptions");

// ── the shell maps the form id → market and jumps to Design → Model (reuse: setActiveTab + setSub, no new nav) ──
ok(/const\s+openBuildInDesign\s*=\s*\(formId:\s*string\)\s*=>/.test(shell), "command-ux1 defines openBuildInDesign(formId)");
ok(/formId\s*===\s*"3x3-grid"\s*\?\s*"full"\s*:\s*formId\s*===\s*"tiny"\s*\?\s*"tiny"\s*:\s*null/.test(shell), "it maps 3x3-grid→full, tiny→tiny, else null (eco-sphere not editable yet)");
ok(/setActiveTab\("Design"\)/.test(shell) && /setSub\("Design",\s*"Model"\)/.test(shell), "it switches to Design and the Model sub-tab (reuses the existing tab/sub setters)");
ok(/<SimulatePanel\s+designRooms=\{designRooms\}\s+onOpenInDesign=\{openBuildInDesign\}\s*\/>/.test(shell), "the shell passes openBuildInDesign into SimulatePanel");

// ── reuse, not rebuild: the click path adds NO cost engine + NO new 3D engine (immersion reuses voxel-house/useRCoreGestures) ──
ok(!/function\s+costBreakdown\b|function\s+catalogSum\b|function\s+costFor\b/.test(opts), "the Simulate click wiring does not re-define any cost engine (presentation only)");
ok(/useRCoreGestures/.test(voxel) && !/from\s+"three"|@react-three|babylonjs/.test(voxel), "immersion reuses the existing useRCoreGestures camera — no new 3D engine imported");

console.log(`\narchitect-immersion: ${pass} passed, ${fail} failed · walk look-around is free (see walls/corners) · the Cube mockup opens the Design Room Designer · one engine, reused`);
process.exit(fail ? 1 : 0);

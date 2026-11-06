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
const walk = read("../components/architect-2525/architect-walkthrough.tsx");
const icons = read("../components/architect-2525/architect-walk-icons.tsx");
const design = read("../components/architect-2525/architect-design.tsx");
const solid = read("../lib/solid-shade.ts");
const rd = read("../components/architect-2525/room-designer.tsx");

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

// ── R6b · the FIRST-PERSON WALKTHROUGH (operator 2026-11-04: "walk through doesn't work … build out walk through functionality") ──
ok(/function\s+ArchitectWalkthrough\b/.test(walk), "architect-walkthrough.tsx exports ArchitectWalkthrough — a real first-person interior view");
ok(/const\s+project\s*=\s*\(p:\s*V3\)/.test(walk) && /depth\s*>\s*near/.test(walk), "it uses a purpose-built pinhole camera with near-plane cull (not the map-tilt sceneProject that clipped inside the box)");
ok(/START_IN\s*=\s*1\.5/.test(walk) && /y:\s*START_IN/.test(walk) && /collideAndSlide|walkMove/.test(walk), "the eye starts INSIDE the room (START_IN = 1.5 ft past the south door) and walks it with collide-and-slide — a real walkthrough, not a doorway peep (operator 2026-11-06)");
ok(/setYaw\(/.test(walk) && /setPitch\(/.test(walk), "drag looks around — yaw (turn) + pitch (up/down) to see the walls & corners");
ok(/wallQuads/.test(walk) && /data-arch-walkpad/.test(walk) && /onStep\?\./.test(walk), "it renders the room shell (wallQuads: walls/floor/ceiling) and a step pad that walks room to room");
ok(/addDoor\(/.test(walk) && /nb\.N/.test(walk), "doorways are drawn on walls that have an adjoining room, with the neighbour's label");
// WALK-11 (operator 2026-11-06, Sofia/Asar P0): the picture FILLS the box — the viewBox tracks the measured container (no
// fixed 760), f is taken from BOTH HFOV/VFOV, and preserveAspectRatio slices so there is no letterbox.
ok(/new ResizeObserver/.test(walk) && /setVb\(/.test(walk) && /const W = vb\.w, H = vb\.h/.test(walk), "the walk measures its container (ResizeObserver) and sizes the viewBox to it — the picture fills the box, no fixed 760 letterbox");
ok(/preserveAspectRatio="xMidYMid slice"/.test(walk) && /Math\.min\(\(W \/ 2\) \/ Math\.tan\(HFOV \/ 2\), \(H \/ 2\) \/ Math\.tan\(VFOV \/ 2\)\)/.test(walk), "the focal length keeps the FOV from BOTH axes and the svg slices — no dead bands on a portrait phone");
// WALK-P1 look fix: rightward look input yaws EAST (the drag + stick both subtract the x input)
ok(/setYaw\(d\.yaw - \(e\.clientX - d\.x\)/.test(walk) && /setYaw\(\(y\) => y - lk\.x \* LOOK_YAW/.test(walk), "LOOK right → turn right/east (the inverted-look fix)");
// WALK-05 door-aware collision: the door lanes are carved so every room is reachable, and the shower is served
ok(/roomBlockers\(roomObjs, phase, doorLanes\)/.test(walk) && /doorLanes\.push/.test(walk), "door-width lanes are carved to every doorway (roomBlockers takes doorLanes)");
// P1 FRAMING + fleet NEW-2 phase-gated MEP: the walk shows the studs in the Framing phase, and a MEP layer shows ONLY in its own phase.
ok(/framingOn = phaseById\(phase\)\?\.id === "framing"/.test(walk) && /walkFraming\(/.test(walk), "the Framing phase renders the studs (walkFraming) in the walk");
ok(/const hasPhase = !!phaseById\(phase\)/.test(walk) && /if \(hasPhase\)/.test(walk) && /pShows === "wiring" \|\| pShows === "water" \|\| pShows === "sewer"/.test(walk), "the MEP overlay is phase-gated — a selected phase shows ONLY its own layer");
ok(/setShowSockets\(shows === "wiring"\)/.test(design), "selectPhase drives sockets from the phase (only Electrical) — no overlay leaks across phases");
// P2/P3/P4 layers render through the ONE subline + glyph pass (plumbing valves, duct parts, shell cameras/batts all share it)
ok(/data-arch-walk-subline/.test(walk) && /data-arch-walk-glyph=/.test(walk), "the walk renders MEP/shell sublines + glyphs (P2 valves · P3 ducts · P4 cameras/batts) through one pass");
ok(/walkShell\(/.test(walk) && /const structureOn = framingOn/.test(walk), "the shell phases draw via walkShell, and roofing/insulation keep the stud frame on");
// C1 overhead minimap: the current room lit + a live eye dot + facing wedge, collapsible (the walk keeps the majority — E2)
ok(/data-arch-walk-map\b/.test(walk) && /data-arch-walk-map-eye/.test(walk) && /data-arch-walk-map-wedge/.test(walk), "the walk carries an overhead minimap with a live eye dot + facing wedge");
ok(/const \[mapOpen, setMapOpen\]/.test(walk) && /data-arch-walk-map-toggle/.test(walk), "the minimap is collapsible (mapOpen) — the walk keeps the majority of the screen (E2)");

// ── custom walkthrough iconology, NOT emoji (operator 2026-11-04: "don't use emojies; create your own walkthrough raster iconology") ──
ok(/export function WalkGlyph\b/.test(icons) && /export function MoveChevron\b/.test(icons) && /<svg/.test(icons), "architect-walk-icons.tsx is a drawn SVG glyph set (WalkGlyph · MoveChevron · LookGlyph · DoorGlyph · EditGlyph) — my own iconology");
ok(!/🚶|✎|🏃|👣|➡|⬆|⬇|⬅/.test(icons), "the icon set contains NO emoji — every glyph is drawn SVG");

// ── the Design walk mode renders the walkthrough; the toggle uses the drawn EditGlyph + the operator's WalkRaster (no emoji) ──
ok(/<ArchitectWalkthrough\s+room=\{walkRoom\}\s+layout=\{roomLayout\}\s+onStep=\{walkStep\}/.test(design), "Design → Walk renders <ArchitectWalkthrough> (not the tilted voxel dollhouse)");
ok(/\{m === "edit" \? <><EditGlyph[\s\S]{0,80}?<WalkRaster/.test(design), "the Edit ⇄ Walk toggle uses EditGlyph (Edit) + the operator's WalkRaster (Walk) — his picture, not a drawing (2026-11-06 'use this'); locked further by architect-walk-raster");
ok(!/🚶|✎/.test(design), "no 🚶 / ✎ emoji remain in architect-design.tsx");

// ── R6c · ONE shared solid-faces shader (operator 2026-11-04: "use mission planning radar 3D visual … objects and walls mimic shading … same function") ──
ok(/export function shade\b/.test(solid) && /export const FACE_SHADE\b/.test(solid) && /export function solidFaces\b/.test(solid) && /export function boxFaces\b/.test(solid), "lib/solid-shade.ts exports the one shared shader: shade · FACE_SHADE · solidFaces · boxFaces");
ok(/if \(ps\.some\(\(p\) => !p\)\) continue/.test(solid), "solidFaces culls by REFUSAL (drops any face with a behind/non-finite vertex), like the radar push()");
ok(/out\.sort\(\(a, b\) => b\.depth - a\.depth\)/.test(solid), "ONE painter-sort convention (FAR→NEAR) — resolves the sign that differed across the three copies");
ok(/wire-core is EDGE-ONLY|OUTSIDE wire-core/.test(solid), "the shader lives OUTSIDE wire-core (edge-only by law) — it is presentation");
// walls AND furniture through the shared shader
ok(/from "@\/lib\/solid-shade"/.test(walk) && !/const shade = \(hex/.test(walk), "the walkthrough imports the shared shader (its inline shade copy is gone)");
ok(/boxFaces\(/.test(walk) && /room\.objects \?\? defaultObjectsForRoom/.test(walk) && /solidFaces\(\[\.\.\.wallQuads, \.\.\.furnQuads\]/.test(walk), "the walkthrough renders FURNITURE (boxFaces from room.objects ?? defaultObjectsForRoom) AND walls through ONE solidFaces() call");
ok(/shade\(fc\.color \?\? C\.wall, FACE_SHADE\[fc\.kind\]\)/.test(walk), "each face is filled via the shared shade() + FACE_SHADE (objects and walls mimic the radar shading)");
// the Architect voxel is de-duped onto the shared shader
ok(/import \{ shade, FACE_SHADE \} from "@\/lib\/solid-shade"/.test(rd) && !/function shade\(hex: string/.test(rd), "the room voxel (room-designer) imports the shared shade/FACE_SHADE — its local copy is removed (de-dup, same values)");

console.log(`\narchitect-immersion: ${pass} passed, ${fail} failed · walk look-around free · Cube opens the Designer · first-person walkthrough (no-clip pinhole) · ONE shared solid-faces shader for walls + furniture (de-duped from the radar) · drawn iconology, no emoji`);
process.exit(fail ? 1 : 0);

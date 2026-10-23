// ARC-37.01 — Vector Glass: canonical Runtime → WireframeAdapter → Line[]. PLAN gives the 9 Space rectangles,
// VECTOR-3D their isometric boundary boxes; no Wall/Door/Window; selection highlights one Space; the renderer
// owns no geometry (it only receives Line[]).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-wireframe.test.mjs
import { buildProjectFromSeed } from "../lib/architect-2525/canonical/runtime.ts";
import { toWireframe } from "../lib/architect-2525/canonical/wireframe.ts";
import { TINY_HOME_V1, SEED_SPACE_IDS } from "../lib/architect-2525/seeds/tiny-home-v1.ts";
import { UM_PER_10FT } from "../lib/architect-2525/canonical/units.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

const p = buildProjectFromSeed(TINY_HOME_V1);

// ── PLAN: 9 Space rectangles, 4 boundary lines each ──
const planScene = toWireframe(p, { view: "PLAN", grid: false, north: false });
const planSpace = planScene.lines.filter((l) => l.kind === "space");
ok(planScene.view === "PLAN", "PLAN view");
ok(planSpace.length === 36, "9 Spaces × 4 boundary lines = 36 PLAN lines");
ok(new Set(planSpace.map((l) => l.space_id)).size === 9, "lines cover all 9 distinct Space ids");
ok(planSpace.every((l) => SEED_SPACE_IDS.includes(l.space_id)), "every PLAN line names a canonical Space id");

// C1 rectangle corners match the canonical geometry (datum corner at 0,0; 10ft × 10ft)
const c1 = planSpace.filter((l) => l.bay_code === "C1");
const pts = new Set(c1.flatMap((l) => [`${l.a[0]},${l.a[1]}`, `${l.b[0]},${l.b[1]}`]));
ok(pts.has("0,0") && pts.has(`${UM_PER_10FT},0`) && pts.has(`0,${UM_PER_10FT}`) && pts.has(`${UM_PER_10FT},${UM_PER_10FT}`), "C1 PLAN rect corners match canonical µm geometry");

// ── only derived Space-boundary line kinds; no wall/door/window ──
const KINDS = new Set(planScene.lines.map((l) => l.kind));
ok([...KINDS].every((k) => ["space", "grid", "north", "selection"].includes(k)), "line kinds are boundary/grid/north/selection only — no wall/door/window");

// ── grid + north are optional reference lines ──
const withRefs = toWireframe(p, { view: "PLAN" });
ok(withRefs.lines.some((l) => l.kind === "grid"), "grid reference lines present when requested");
ok(withRefs.lines.some((l) => l.kind === "north"), "north indicator present when requested");

// ── VECTOR-3D: an isometric boundary box per Space (floor + ceiling + verticals = 12 lines) ──
const iso = toWireframe(p, { view: "VECTOR3D", grid: false, north: false });
const isoSpace = iso.lines.filter((l) => l.kind === "space");
ok(iso.view === "VECTOR3D" && isoSpace.length === 108, "9 Spaces × 12 boundary-box lines = 108 VECTOR-3D lines");
ok(JSON.stringify(planScene.bounds) !== JSON.stringify(iso.bounds), "PLAN and VECTOR-3D project to different bounds");

// ── selection highlights exactly the selected Space ──
const sel = toWireframe(p, { view: "PLAN", grid: false, north: false, selectedId: SEED_SPACE_IDS[0] });
const selected = sel.lines.filter((l) => l.kind === "selection");
ok(selected.length === 4 && selected.every((l) => l.space_id === SEED_SPACE_IDS[0]), "selection: exactly the 4 lines of the selected Space are kind 'selection'");
ok(sel.lines.filter((l) => l.kind === "space").length === 32, "the other 8 Spaces stay kind 'space'");

// ── bounds are finite and non-degenerate ──
const b = planScene.bounds;
ok([b.minX, b.minY, b.maxX, b.maxY].every(Number.isFinite) && b.maxX > b.minX && b.maxY > b.minY, "scene bounds are finite and non-degenerate");

// ── pure: two calls give identical scenes ──
ok(JSON.stringify(toWireframe(p, { view: "PLAN" })) === JSON.stringify(toWireframe(p, { view: "PLAN" })), "toWireframe is pure/deterministic");

console.log(`\narchitect-wireframe: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

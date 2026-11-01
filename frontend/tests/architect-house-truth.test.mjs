// ARCHITECT-2525 · THE ONE MASTER HOUSE-TRUTH — the behavioral gate (operator 2026-11-01, 3 screenshots:
// "3x3 900 sq ft does not match House Build Spec; … master source of data that flows through to all components.
//  triple check since you failed all cost, dimensions, detail element build on length of material").
// Proves the HOUSE BUILD SPEC's master reads ONE source: 900 ft² (geometry) === 900 ft² (cost model), $240,000
// (one-cost-truth), 9 rooms, 30×30, the real build reconciling to the headline, and a material take-off. The
// legacy shared default (DEFAULT_PARAMS.areaSqft) stays 2,000 — the firewall (architect-product-truth) is untouched.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-house-truth.test.mjs
import { canonicalHouseTruth, canonicalModel } from "@/lib/architect-house-truth";
import { costFor, costBreakdown } from "@/lib/architect-sim-options";
import { buildProjectFromSeed, netProgramAreaUm2, spaceCount } from "@/lib/architect-2525/canonical/runtime";
import { sqftFromUm2 } from "@/lib/architect-2525/canonical/units";
import { TINY_HOME_V1 } from "@/lib/architect-2525/seeds/tiny-home-v1";
import { DEFAULT_PARAMS } from "@/lib/architect-project";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const h = canonicalHouseTruth();
const m = canonicalModel();
const project = buildProjectFromSeed(TINY_HOME_V1);
const geomSqft = Math.round(sqftFromUm2(netProgramAreaUm2(project)));

// ── DIMENSIONS — one source: the seed geometry + the FX01a cube/shell model ──
ok(h.areaSqft === 900, `master area = 900 ft² NET from geometry (got ${h.areaSqft})`);
ok(geomSqft === 900, `geometry netProgramArea = 900 ft² (got ${geomSqft})`);
ok(h.netSqft === 900, `net (interior) = 900 ft² (got ${h.netSqft})`);
ok(h.rooms === 9 && spaceCount(project) === 9, `master rooms = 9 (got ${h.rooms})`);
// operator FX01a: 10′ interior rooms · 12′ cube (1′ service cavity each side) · 36′ shell · 1,296 ft² gross
ok(h.dims.roomFt === 10, `interior room = 10′ (got ${h.dims.roomFt})`);
ok(h.dims.cavityFt === 2, `service cavity = 2′ per cube, 1′ each side (got ${h.dims.cavityFt})`);
ok(h.dims.cubeFt === 12, `cube = 12′ (10′ interior + 1′ each side) (got ${h.dims.cubeFt})`);
ok(h.dims.shellWidthFt === 36 && h.dims.shellDepthFt === 36, `shell = 36′ × 36′ (3 cubes) (got ${h.dims.shellWidthFt}×${h.dims.shellDepthFt})`);
ok(h.grossSqft === 1296, `gross (shell) = 1,296 ft² (got ${h.grossSqft})`);
ok(h.dims.wallHeightFt === 10, `master wall height = 10 ft (got ${h.dims.wallHeightFt})`);

// ── TRIPLE-CHECK — the geometry area and the cost-model area AGREE (one house, never two) ──
ok(m.areaFt2 === geomSqft, `cost-model area (${m.areaFt2}) === geometry area (${geomSqft}) — one house`);

// ── COST — one source: the one-cost-truth engine ──
ok(h.costUsd === 240000, `master cost = $240,000 from costFor (got $${h.costUsd})`);
ok(h.costUsd === costFor(m, m.native), `master cost === costFor(cube, native) ($${h.costUsd})`);
ok(h.costPerFt2 === Math.round(240000 / 900), `master $/ft² = cost ÷ area ($${h.costPerFt2}/ft²)`);
ok(h.months > 0 && h.laborHours > 0, `master carries build months (${h.months}) + labour hours (${h.laborHours})`);

// ── BUILD — the real elements reconcile to the $240,000 headline (no fourth engine, no $2,000 stub) ──
const buildSum = h.build.reduce((a, p) => a + p.usd, 0);
ok(Math.abs(buildSum - h.costUsd) <= h.build.length, `build-by-phase Σ ($${buildSum}) reconciles to the headline ($${h.costUsd})`);
ok(h.build.length >= 4, `the house shows its real install phases (got ${h.build.length})`);
const phaseIds = h.build.map((p) => p.phase);
ok(phaseIds.includes("foundation") && phaseIds.includes("framing") && phaseIds.includes("mep") && phaseIds.includes("finish"),
  `the build covers foundation · framing · mep · finish (got ${phaseIds.join(", ")})`);
// the breakdown the master groups is the SAME engine breakdown (not a parallel one)
const bd = costBreakdown(m, m.native);
const bdSum = bd.elements.reduce((a, e) => a + e.usd, 0) + bd.remainder.usd + (bd.fixed?.usd ?? 0);
ok(bdSum === 240000, `costBreakdown reconciles to $240,000 (got $${bdSum}) — the master's one source`);

// ── MATERIAL — the take-off (length of material) on the BUILT SHELL (36×36) ──
const slab = h.materials.find((x) => x.item === "Concrete slab");
const wall = h.materials.find((x) => x.item === "Wall framing");
const studs = h.materials.find((x) => /studs/.test(x.item));
const plate = h.materials.find((x) => x.item === "Plate lumber");
ok(slab && slab.qty === 1296 && slab.unit === "ft²", `slab take-off = 1,296 ft² (shell footprint) (got ${slab?.qty})`);
ok(wall && wall.qty === 288 && wall.unit === "lin ft", `wall framing = 288 lin ft (144 ext + 144 int, 12′ cube grid) (got ${wall?.qty})`);
ok(studs && studs.qty > 0 && studs.unit === "ea", `studs counted from the shell @16" o.c. (got ${studs?.qty})`);
ok(plate && plate.qty === 864 && plate.unit === "lin ft", `plate lumber = 864 lin ft (288 × 3) (got ${plate?.qty})`);

// ── ROOM CELLS — the shared geometry for the 2D plan + 3D view (FX01b: one house, two views) ──
ok(h.roomCells.length === 9, `9 room cells for the 2D⇄3D view (got ${h.roomCells.length})`);
ok(h.roomCells.every((c) => c.col >= 0 && c.col <= 2 && c.row >= 0 && c.row <= 2), "every room cell is on the 3×3 grid (col/row 0..2)");
ok(h.roomCells.filter((c) => c.wet).length === 3, `3 wet rooms (utility · kitchen · bath) marked (got ${h.roomCells.filter((c) => c.wet).length})`);

// ── FIREWALL — the shared legacy default is UNCHANGED (canonical surfaces read 900 from canonical, not the default) ──
ok(DEFAULT_PARAMS.areaSqft === 2000, `DEFAULT_PARAMS.areaSqft stays 2000 (firewall — architect-product-truth untouched)`);

// ── DETERMINISM ──
ok(JSON.stringify(canonicalHouseTruth()) === JSON.stringify(h), "canonicalHouseTruth is deterministic");

console.log(`\narchitect-house-truth: ${pass} passed, ${fail} failed · one master: 900 ft² (geometry) === cost-model · $240,000 (one-cost-truth) · build reconciles · material take-off`);
process.exit(fail ? 1 : 0);

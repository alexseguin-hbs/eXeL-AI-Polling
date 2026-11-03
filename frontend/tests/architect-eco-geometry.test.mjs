// ARCHITECT-2525 · Eco-Sphere REFERENCE geometry (operator 2026-11-03: "update dimensions of 900 sq ft hex for each
// room per eXeL AI" + the 40-ft 10.09° hex-dome panel from the A01 infographic). This gate EXECUTES the pure module
// (so the numbers are proven by running the derivation, not by reading a comment) AND source-scans the Eco-Sphere
// See-details surfacing. INVARIANTS: the seven floor hexes sum to exactly 900 ft²; every hex metric is the regular-
// hexagon derivation of its one seed; the FLOOR and the ROOF/DOME are SEPARATE geometries; the module is PURE (it
// never imports the cost/canonical engine, so it can move no cost); the blocks are Eco-only and labelled REFERENCE.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-eco-geometry.test.mjs
import fs from "node:fs";
import path from "node:path";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");

const G = await import("../lib/architect-eco-geometry.ts");

// ── the pure hexagon derivation ──
const h = G.hexFromSide(1);
ok(near(h.flatToFlat, Math.sqrt(3), 1e-9), "hexFromSide: flat-to-flat = √3·s");
ok(near(h.pointToPoint, 2, 1e-9), "hexFromSide: point-to-point = 2·s");
ok(near(h.area, (3 * Math.sqrt(3)) / 2, 1e-9), "hexFromSide: area = (3√3/2)·s²");
const rt = G.hexFromArea(G.hexFromSide(5).area);
ok(near(rt.side, 5, 1e-9), "hexFromArea ∘ hexFromSide round-trips the side (derivation is consistent, not typed)");

// ── FLOOR: seven equal hexagons tile EXACTLY 900 ft² ──
const f = G.ecoFloor();
ok(f.rooms === 7 && f.totalFt2 === 900, "floor is 7 rooms totalling 900 ft² (canonical, unchanged)");
ok(near(f.perHexFt2 * 7, 900, 1e-9), "Σ seven hex areas === 900 ft² EXACTLY (the governing invariant)");
ok(near(f.perHexFt2, 128.57, 0.01), `per-hex ≈ 128.57 ft² (got ${f.perHexFt2.toFixed(2)})`);
ok(near(f.sideFt, 7.03, 0.02), `floor hex side ≈ 7.03 ft (got ${f.sideFt.toFixed(2)})`);
ok(near(f.flatToFlatFt, 12.18, 0.02), `floor flat-to-flat ≈ 12.18 ft (got ${f.flatToFlatFt.toFixed(2)})`);
ok(near(f.pointToPointFt, 14.07, 0.02), `floor point-to-point ≈ 14.07 ft (got ${f.pointToPointFt.toFixed(2)})`);
ok(near(f.overallWidthFt, 35.17, 0.1) && near(f.overallDepthFt, 36.55, 0.1), `floor overall ≈ 35.17 × 36.55 ft (got ${f.overallWidthFt.toFixed(2)} × ${f.overallDepthFt.toFixed(2)})`);
ok(/excludes wall thickness/.test(f.note), "floor carries the operator's basis note (excludes wall thickness)");

// ── ROOF / DOME PANEL: the A01 panel 04 figures, derived from the 0.619 m side + the 40-ft dome ──
const r = G.ecoRoofPanel();
ok(near(r.panel.sideM, 0.619, 0.001), `dome panel side ≈ 0.619 m (got ${r.panel.sideM})`);
ok(near(r.panel.flatToFlatM, 1.073, 0.002), `dome panel flat-to-flat ≈ 1.073 m (got ${r.panel.flatToFlatM.toFixed(3)})`);
ok(near(r.panel.pointToPointM, 1.238, 0.002), `dome panel point-to-point ≈ 1.238 m (got ${r.panel.pointToPointM.toFixed(3)})`);
ok(near(r.panel.areaM2, 0.995, 0.003), `dome panel area ≈ 0.995 m² (got ${r.panel.areaM2.toFixed(3)})`);
ok(near(r.panel.areaFt2, 10.72, 0.05), `dome panel area ≈ 10.72 ft² (got ${r.panel.areaFt2.toFixed(2)})`);
ok(near(r.panel.flatToFlatFt, 3.52, 0.02), `dome panel flat-to-flat ≈ 3.52 ft (got ${r.panel.flatToFlatFt.toFixed(2)})`);
ok(r.dome.diameterFt === 40 && r.dome.radiusFt === 20, "dome is 40 ft dia / 20 ft radius");
ok(near(r.dome.targetAngleDeg, 10.09, 0.001), "dome target angular increment 10.09° (A01)");
ok(near(r.dome.hemisphereFt2, 2513, 2), `half-dome surface ≈ 2,513 ft² (got ${Math.round(r.dome.hemisphereFt2)})`);
ok(r.panelCount === "tessellation-dependent", "panel count is tessellation-dependent, never a fabricated number");

// ── FLOOR and ROOF are SEPARATE geometries (room hex ≫ panel hex) ──
ok(f.sideFt > r.panel.sideFt * 3, "the floor room hex is far larger than the dome panel hex — two separate geometries, not one");

// ── PURITY / firewall: the module imports NOTHING from the cost or canonical engine (so it can move no cost) ──
const src = read("../lib/architect-eco-geometry.ts");
ok(!/\bimport\b/.test(src.replace(/\/\/[^\n]*/g, "")), "architect-eco-geometry.ts imports nothing — a pure maths module (firewalled from cost/canonical)");
ok(/REFERENCE|validation-required|1st-pass/i.test(src), "the module declares itself REFERENCE / 1st-pass / validation-required");
ok(/\$231,?500|Eco-Sphere stays|move/i.test(src), "the module states it moves no cost (Eco-Sphere $231,500 unchanged)");

// ── the Eco-Sphere See-details surfacing (eco-only, both blocks, labelled, voice-safe) ──
const opts = read("../components/architect-2525/simulate-options.tsx");
ok(/import \{ ecoFloorLabel, ecoRoofLabel \} from "@\/lib\/architect-eco-geometry"/.test(opts), "simulate-options imports the two label builders");
ok(/m\.id === "eco-sphere" &&[\s\S]{0,400}data-arch-eco-geometry/.test(opts), "the HEX DIMENSIONS block is gated eco-only (m.id === 'eco-sphere')");
ok(/data-arch-eco-floor[\s\S]{0,260}ecoFloorLabel\(\)/.test(opts), "the FLOOR reference block renders ecoFloorLabel()");
ok(/data-arch-eco-roof[\s\S]{0,260}ecoRoofLabel\(\)/.test(opts), "the ROOF reference block renders ecoRoofLabel()");
ok(/HEX DIMENSIONS[\s\S]{0,160}(reference|to be validated)/i.test(opts), "the block is labelled reference / to-be-validated (product-truth)");

console.log(`\narchitect-eco-geometry: ${pass} passed, ${fail} failed · 7 hex floor = 900 ft² exact · regular-hex derivation (not typed) · FLOOR + ROOF/DOME separate · pure module (no cost) · Eco-only reference blocks`);
process.exit(fail ? 1 : 0);

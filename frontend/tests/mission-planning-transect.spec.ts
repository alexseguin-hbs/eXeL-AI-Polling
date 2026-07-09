import { test, expect } from "@playwright/test";
import { computeTransect, sampleTransect, projectOntoLine, distKm, type AltObject } from "../lib/transect";

// SECURITY-2525 · altitude transect engine — pure math proof (the ELEVATION PROFILE / TRANSECT).
// Terrain + airborne objects share ONE vertical scale, all from the single DEM sampler.

const flat = () => 100;                       // 100 m terrain everywhere
const ramp = (lat: number, lon: number) => (lon + 98) * 1000; // rises W→E

test("sampleTransect returns n inclusive points from t=0 to t=1", () => {
  const s = sampleTransect([30, -98], [30, -97], 11, flat);
  expect(s.length).toBe(11);
  expect(s[0].t).toBe(0);
  expect(s[10].t).toBe(1);
  expect(s.every((p) => p.elevM === 100)).toBeTruthy();
});

test("distKm ≈ great-circle at transect scale (1° lon at 30°N ≈ 96 km)", () => {
  expect(distKm([30, -98], [30, -97])).toBeGreaterThan(90);
  expect(distKm([30, -98], [30, -97])).toBeLessThan(100);
});

test("projectOntoLine: midpoint → t≈0.5, on-axis → offAxis≈0; clamps beyond ends", () => {
  const a: [number, number] = [30, -98], b: [number, number] = [30, -97];
  const mid = projectOntoLine([30, -97.5], a, b);
  expect(mid.t).toBeCloseTo(0.5, 2);
  expect(mid.offAxisKm).toBeLessThan(0.01);
  expect(projectOntoLine([30, -96], a, b).t).toBe(1);   // beyond b → clamp 1
  expect(projectOntoLine([30, -99], a, b).t).toBe(0);   // before a → clamp 0
});

test("AGL object plots at terrain+altitude; MSL object plots at its own altitude", () => {
  const objs: AltObject[] = [
    { lat: 30, lon: -97.5, altM: 500, altRef: "AGL", label: "drone" },
    { lat: 30, lon: -97.5, altM: 500, altRef: "MSL", label: "jet" },
  ];
  const p = computeTransect([30, -98], [30, -97], flat, objs);
  const agl = p.objects.find((o) => o.label === "drone")!;
  const msl = p.objects.find((o) => o.label === "jet")!;
  expect(agl.mslM).toBe(600);  // 100 terrain + 500 AGL
  expect(msl.mslM).toBe(500);  // MSL as-is
});

test("vertical scale spans terrain AND object MSL (airborne raises maxEl)", () => {
  const p = computeTransect([30, -98], [30, -97], flat,
    [{ lat: 30, lon: -97.5, altM: 3000, altRef: "MSL", label: "high" }]);
  expect(p.maxEl).toBeGreaterThanOrEqual(3000); // object lifts the shared axis
  expect(p.minEl).toBeLessThanOrEqual(100);
});

test("corridor filter drops off-axis objects", () => {
  const far: AltObject = { lat: 31.5, lon: -97.5, altM: 500, altRef: "MSL", label: "far" }; // ~166 km off
  const p = computeTransect([30, -98], [30, -97], flat, [far], 120, 5);
  expect(p.objects.length).toBe(0);
});

test("deterministic + reflects terrain via the sampler (ramp rises along track)", () => {
  const a: [number, number] = [30, -98], b: [number, number] = [30, -97];
  const p1 = computeTransect(a, b, ramp);
  const p2 = computeTransect(a, b, ramp);
  expect(p1.samples.map((s) => s.elevM)).toEqual(p2.samples.map((s) => s.elevM));
  expect(p1.samples[p1.samples.length - 1].elevM).toBeGreaterThan(p1.samples[0].elevM);
});

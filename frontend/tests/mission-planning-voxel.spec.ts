import { test, expect } from "@playwright/test";
import { altitudeBandFt, altitudeBandM, bandOccupancy, ftFromM, mFromFt, BAND_LABELS } from "../lib/voxel";

// SECURITY-2525 · altitude voxel bands (stackable cubes) — pure math proof.

test("feet↔metres round-trip", () => {
  expect(ftFromM(mFromFt(2450))).toBeCloseTo(2450, 6);
  expect(mFromFt(1000)).toBeCloseTo(304.8, 3);
});

test("altitudeBandFt maps to the correct band + edges", () => {
  expect(altitudeBandFt(0).label).toBe("SURFACE");
  expect(altitudeBandFt(400).index).toBe(1);      // 0–500
  expect(altitudeBandFt(2450).index).toBe(3);     // 1k–2.5k (the X-BAT swarm in the mockup)
  expect(altitudeBandFt(2450).label).toBe("1k–2.5k");
  expect(altitudeBandFt(9000).index).toBe(6);     // 7.5k–10k
  expect(altitudeBandFt(12000).label).toBe("10k+");
});

test("band edges are inclusive at the ceiling (500 → band 1, not 2)", () => {
  expect(altitudeBandFt(500).index).toBe(1);
  expect(altitudeBandFt(501).index).toBe(2);
});

test("sub-surface altitude → SUBSURFACE band (index -1)", () => {
  expect(altitudeBandFt(-84).index).toBe(-1);
  expect(altitudeBandFt(-84).label).toBe("SUBSURFACE");
});

test("altitudeBandM converts metres first (2450 ft ≈ 746.8 m → band 3)", () => {
  expect(altitudeBandM(mFromFt(2450)).index).toBe(3);
});

test("bandOccupancy counts the cube stack per band, ignoring subsurface", () => {
  const alts = [0, 400, 400, 2450, 9000].map(mFromFt).concat([mFromFt(-50)]);
  const occ = bandOccupancy(alts);
  expect(occ.length).toBe(BAND_LABELS.length);
  expect(occ[0]).toBe(1);  // SURFACE (0 ft)
  expect(occ[1]).toBe(2);  // two at 400 ft
  expect(occ[3]).toBe(1);  // 2450 ft
  expect(occ[6]).toBe(1);  // 9000 ft
  expect(occ.reduce((a, b) => a + b, 0)).toBe(5); // subsurface excluded
});

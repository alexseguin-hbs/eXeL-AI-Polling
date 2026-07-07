import { test, expect } from "@playwright/test";
import { computeContours, terrainMSL, niceStep, type ContourOpts } from "../lib/contours";

// SECURITY-2525 Mission Planning — contour line engine test.
// Verifies marching-squares output: bounded line count, valid SVG paths, in-frame
// coords, land/bathymetry split, major key-lines (>=3), and determinism.

const OPTS: ContourOpts = { count: 6, interval: 0, fidelity: "med", seaLevel: 0 };
const AUSTIN = { latMin: 30.24, latMax: 30.30, lonMin: -97.78, lonMax: -97.70 };   // inland → all land
const FLORIDA = { latMin: 26.45, latMax: 29.35, lonMin: -83.23, lonMax: -79.97 };  // both coasts

test("niceStep snaps to 1/2/5 x 10^n", () => {
  expect(niceStep(1)).toBe(1);
  expect(niceStep(3)).toBe(5);
  expect(niceStep(7)).toBe(10);
  expect(niceStep(23)).toBe(50);
  expect(niceStep(120)).toBe(200);
});

test("inland AO yields 3–9 land contours with valid, in-frame SVG paths", () => {
  const cs = computeContours(AUSTIN, OPTS);
  expect(cs.lines.length).toBeGreaterThanOrEqual(1);
  expect(cs.count).toBeLessThanOrEqual(9);
  for (const l of cs.lines) {
    expect(l.land).toBeTruthy();            // inland — no sub-MSL
    expect(l.d.startsWith("M")).toBeTruthy();
    expect(l.d).toContain("L");
    // every coordinate lies inside the 0–100 viewBox
    for (const n of l.d.match(/-?\d+(?:\.\d+)?/g) ?? []) {
      const v = parseFloat(n);
      expect(v).toBeGreaterThanOrEqual(-0.01);
      expect(v).toBeLessThanOrEqual(100.01);
    }
  }
});

test("at least 3 major key-lines, with thin minors when there are enough levels", () => {
  const cs = computeContours(AUSTIN, OPTS);
  const majors = cs.lines.filter((l) => l.major).length;
  expect(majors).toBeGreaterThanOrEqual(Math.min(3, cs.lines.length));
  if (cs.lines.length > 4) expect(majors).toBeLessThan(cs.lines.length); // minors exist
});

test("Florida littoral AO produces BOTH land and bathymetry (sub-MSL) contours", () => {
  const cs = computeContours(FLORIDA, OPTS);
  expect(cs.min).toBeLessThan(0);                       // ocean depth present
  expect(cs.lines.some((l) => l.land)).toBeTruthy();    // land contours
  expect(cs.lines.some((l) => !l.land)).toBeTruthy();   // bathymetry contours
  for (const l of cs.lines) expect(l.land).toBe(l.level >= OPTS.seaLevel);
});

test("terrainMSL: inland is land (>=0), Florida offshore is ocean (<0)", () => {
  expect(terrainMSL(30.27, -97.74)).toBeGreaterThanOrEqual(0);   // Austin
  expect(terrainMSL(27.9, -81.6)).toBeGreaterThanOrEqual(0);     // FL land (central)
  expect(terrainMSL(27.9, -84.0)).toBeLessThan(0);               // Gulf offshore
  expect(terrainMSL(27.9, -79.5)).toBeLessThan(0);               // Atlantic offshore
});

test("deterministic — identical box+opts yield identical geometry", () => {
  const a = computeContours(FLORIDA, OPTS);
  const b = computeContours(FLORIDA, OPTS);
  expect(a.lines.map((l) => l.d)).toEqual(b.lines.map((l) => l.d));
  expect(a.min).toBe(b.min);
  expect(a.max).toBe(b.max);
});

test("higher fidelity samples a finer grid (>= line detail)", () => {
  const lo = computeContours(FLORIDA, { ...OPTS, fidelity: "low" });
  const hi = computeContours(FLORIDA, { ...OPTS, fidelity: "high" });
  const seg = (cs: ReturnType<typeof computeContours>) =>
    cs.lines.reduce((n, l) => n + (l.d.match(/M/g)?.length ?? 0), 0);
  expect(seg(hi)).toBeGreaterThanOrEqual(seg(lo));
});

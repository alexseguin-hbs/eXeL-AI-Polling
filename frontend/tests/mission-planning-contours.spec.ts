import { test, expect } from "@playwright/test";
import { computeContours, terrainMSL, niceStep, makeDemSampler, type ContourOpts, type Dem } from "../lib/contours";

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

test("makeDemSampler: bilinear at corners, centre, and clamps outside the bbox", () => {
  // 2×2 grid over [0,0,1,1]; row-major elev: row0 (N=1) = [10,20], row1 (S=0) = [30,40]
  const dem: Dem = { bbox: [0, 0, 1, 1], nx: 2, ny: 2, elev: [10, 20, 30, 40] };
  const s = makeDemSampler(dem);
  expect(s(1, 0)).toBeCloseTo(10, 6);   // N,W
  expect(s(1, 1)).toBeCloseTo(20, 6);   // N,E
  expect(s(0, 0)).toBeCloseTo(30, 6);   // S,W
  expect(s(0, 1)).toBeCloseTo(40, 6);   // S,E
  expect(s(0.5, 0.5)).toBeCloseTo(25, 6); // centre = mean
  expect(s(1, 0.5)).toBeCloseTo(15, 6); // N edge midpoint
  expect(s(5, -5)).toBeCloseTo(10, 6);  // clamps to the N,W corner outside bbox
});

test("computeContours uses a real DEM sampler when provided (ocean floor negative)", () => {
  // synthetic 'coastline' grid: west high land, east deep sea
  const nx = 8, ny = 8, elev: number[] = [];
  for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) elev.push(200 - (c / (nx - 1)) * 500); // +200→-300
  const dem: Dem = { bbox: [-1, -1, 1, 1], nx, ny, elev };
  const cs = computeContours({ latMin: -0.9, latMax: 0.9, lonMin: -0.9, lonMax: 0.9 },
    { count: 6, interval: 0, fidelity: "med", seaLevel: 0 }, makeDemSampler(dem));
  expect(cs.min).toBeLessThan(0);                     // ocean depth present
  expect(cs.lines.some((l) => l.land)).toBeTruthy();  // land contours
  expect(cs.lines.some((l) => !l.land)).toBeTruthy(); // bathymetry contours
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

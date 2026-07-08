import { test, expect } from "@playwright/test";
import { bufferPolygon, polygonArea } from "../lib/aor";

// SECURITY-2525 Mission Planning — AOR buffer engine test.
// AOR = AO polygon expanded outward by N km (10–100). Verifies the buffer grows the
// polygon, scales with distance, is centroid-stable, and no-ops on degenerate input.

// A ~small square AO around Austin (lat,lon).
const AO: [number, number][] = [[30.30, -97.78], [30.30, -97.70], [30.24, -97.70], [30.24, -97.78]];
const centroid = (p: [number, number][]) => [
  p.reduce((a, q) => a + q[0], 0) / p.length,
  p.reduce((a, q) => a + q[1], 0) / p.length,
];

test("buffer grows the polygon outward (area increases)", () => {
  const a0 = Math.abs(polygonArea(AO));
  const a25 = Math.abs(polygonArea(bufferPolygon(AO, 25)));
  expect(a25).toBeGreaterThan(a0);
});

test("larger buffer distance → larger polygon (monotonic)", () => {
  const a10 = Math.abs(polygonArea(bufferPolygon(AO, 10)));
  const a50 = Math.abs(polygonArea(bufferPolygon(AO, 50)));
  const a100 = Math.abs(polygonArea(bufferPolygon(AO, 100)));
  expect(a50).toBeGreaterThan(a10);
  expect(a100).toBeGreaterThan(a50);
});

test("buffer keeps the same centroid (expands symmetrically)", () => {
  const c0 = centroid(AO), c1 = centroid(bufferPolygon(AO, 40));
  expect(c1[0]).toBeCloseTo(c0[0], 3);
  expect(c1[1]).toBeCloseTo(c0[1], 3);
});

test("each vertex moves outward by ~km along its centroid radial", () => {
  // corner distance from centroid grows by ~km (in km) after buffering
  const [clat, clon] = centroid(AO);
  const cosc = Math.cos((clat * Math.PI) / 180);
  const distKm = ([la, lo]: [number, number]) =>
    Math.hypot((la - clat) * 110.574, (lo - clon) * 111.32 * cosc);
  const before = distKm(AO[0]);
  const after = distKm(bufferPolygon(AO, 30)[0]);
  expect(after - before).toBeCloseTo(30, 0); // within ~1 km
});

test("degenerate input is a no-op (fewer than 3 vertices or km<=0)", () => {
  expect(bufferPolygon(AO, 0)).toEqual(AO);
  expect(bufferPolygon([[0, 0], [1, 1]], 25)).toEqual([[0, 0], [1, 1]]);
});

test("deterministic — identical input yields identical geometry", () => {
  expect(bufferPolygon(AO, 33)).toEqual(bufferPolygon(AO, 33));
});

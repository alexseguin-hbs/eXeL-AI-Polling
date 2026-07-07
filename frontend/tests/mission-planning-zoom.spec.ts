import { test, expect } from "@playwright/test";
import {
  stepZoom, zoomSweep, bandOf, shouldHandOffToWorld,
  MIN_SPAN_KM, MAX_SPAN_KM, WORLD_HANDOFF_KM,
} from "../lib/zoom-continuum";

// SECURITY-2525 Mission Planning — zoom continuum test.
// Steps 10 m / 10 km / 100 km / 1000 km in and out and asserts the single-map
// continuum stays bounded, monotonic, smooth (bounded per-step ratio) and hands
// off to Earth only at the continental limit.

test("clamps at 10 m (in) and continental (out) bounds", () => {
  expect(stepZoom(MIN_SPAN_KM, "in")).toBe(MIN_SPAN_KM);
  expect(stepZoom(MAX_SPAN_KM, "out")).toBe(MAX_SPAN_KM);
});

test("each zoom step is smooth (<=15% span change)", () => {
  for (const s of [0.01, 0.5, 10, 100, 1000, 1999]) {
    const out = stepZoom(s, "out");
    const back = stepZoom(s, "in");
    expect(out / s).toBeLessThanOrEqual(1.1500001);
    expect(s / back).toBeLessThanOrEqual(1.1500001);
  }
});

test("in↔out round-trips return to origin at every scale (10 m / 10 km / 100 km / 1000 km)", () => {
  for (const scale of [0.01, 10, 100, 1000]) {
    const roundTrip = stepZoom(stepZoom(scale, "out"), "in");
    // within floating tolerance of the (possibly clamped) origin
    const origin = Math.min(MAX_SPAN_KM, Math.max(MIN_SPAN_KM, scale));
    expect(Math.abs(roundTrip - origin)).toBeLessThan(1e-6 + origin * 1e-6);
  }
});

test("full sweep 10 m → 1000 km is monotonic and covers every scale band", () => {
  const seq = zoomSweep(MIN_SPAN_KM, 1000);
  for (let i = 1; i < seq.length; i++) expect(seq[i]).toBeGreaterThan(seq[i - 1]);
  const bands = new Set(seq.map(bandOf));
  for (const b of ["site", "city", "metro", "region"]) expect(bands.has(b as never)).toBeTruthy();
});

test("full sweep 1000 km → 10 m is monotonic decreasing back to detail", () => {
  const seq = zoomSweep(1000, MIN_SPAN_KM);
  for (let i = 1; i < seq.length; i++) expect(seq[i]).toBeLessThan(seq[i - 1]);
  expect(seq[seq.length - 1]).toBeCloseTo(MIN_SPAN_KM, 6);
});

test("Earth hand-off only triggers at the continental limit, not at AO/metro scales", () => {
  expect(shouldHandOffToWorld(10)).toBeFalsy();     // 10 km — city
  expect(shouldHandOffToWorld(100)).toBeFalsy();    // 100 km — metro
  expect(shouldHandOffToWorld(1000)).toBeFalsy();   // 1000 km — region
  expect(shouldHandOffToWorld(WORLD_HANDOFF_KM)).toBeTruthy();
  expect(shouldHandOffToWorld(MAX_SPAN_KM)).toBeTruthy();
});

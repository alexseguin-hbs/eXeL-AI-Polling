/**
 * SECURITY-2525 · Mission Planning zoom continuum
 * ================================================
 * One geometric zoom from 10 m detail out to ~2000 km (continental), then a hand-off
 * to the Earth/world view. Pure + deterministic so it can be unit-tested at the
 * 10 m / 10 km / 100 km / 1000 km step scales without a browser.
 */
export const MIN_SPAN_KM = 0.01; // ~10 m across the view
export const MAX_SPAN_KM = 6000; // continental — zoom Texas→USA→continent before the Earth view (more transition)
export const ZOOM_FACTOR = 1.15; // per wheel notch / pinch tick
export const WORLD_HANDOFF_KM = MAX_SPAN_KM * 0.995;

/** One zoom step, clamped to the continuum bounds. */
export function stepZoom(spanKm: number, dir: "in" | "out", factor = ZOOM_FACTOR): number {
  const next = dir === "out" ? spanKm * factor : spanKm / factor;
  return Math.min(MAX_SPAN_KM, Math.max(MIN_SPAN_KM, next));
}

/** True when a further zoom-OUT should hand the view off to the Earth/world map. */
export function shouldHandOffToWorld(spanKm: number): boolean {
  return spanKm >= WORLD_HANDOFF_KM;
}

export type Band = "site" | "block" | "city" | "metro" | "region" | "continent";
/** Human scale band for a given span (drives the adaptive breadcrumb + tests). */
export function bandOf(spanKm: number): Band {
  if (spanKm < 0.05) return "site";      // ~10 m — individual placements
  if (spanKm < 2) return "block";        // streets / buildings
  if (spanKm < 20) return "city";        // ~10 km — city + buffer
  if (spanKm < 200) return "metro";      // ~100 km — metro / AO context
  if (spanKm < 1500) return "region";    // ~1000 km — state / region
  return "continent";
}

/** Sequence of spans stepping in or out from `fromKm` until reaching `toKm`. */
export function zoomSweep(fromKm: number, toKm: number, factor = ZOOM_FACTOR): number[] {
  const out = toKm > fromKm;
  const seq: number[] = [Math.min(MAX_SPAN_KM, Math.max(MIN_SPAN_KM, fromKm))];
  let s = seq[0];
  for (let i = 0; i < 2000; i++) {
    const n = stepZoom(s, out ? "out" : "in", factor);
    if (n === s) break; // clamped — cannot progress further
    seq.push(n);
    s = n;
    if (out ? s >= toKm : s <= toKm) break;
  }
  return seq;
}

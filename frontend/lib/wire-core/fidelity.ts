// ADAPTIVE FIDELITY (operator 2026-09-15): "if compute is higher, resolution upgrade and frame rate upgrade
// (only per Edge sensor CNN compute and available compute)."
//
// TWO LAWS, and the whole file exists to keep them:
//  1. THE SENSOR IS PAID FIRST. The Edge sensor's CNN takes its reserve out of every frame before the
//     renderer is allowed to want anything. A prettier picture never starves edge detection.
//  2. A TIER CHANGES WHAT IS DRAWN, NEVER WHAT IS TRUE. The WireModel and its canonicalHash are identical
//     at every tier; a tier only chooses an LOD slice and a paint cadence. (Gated: the hash is compared
//     across all four tiers in tests/drone-fidelity.test.mjs.)
//
// And it is never silent (U-WF-09): every change returns a reason for the HUD to show.
// Pure — no DOM, no clock, no Math.random. Time arrives as an argument.
import type { Lod } from "./wire-model";

export type Tier = "low" | "med" | "high" | "ultra";
export const TIER_ORDER: Tier[] = ["low", "med", "high", "ultra"];

export interface TierSpec {
  segments: number;   // hard cap on drawn segments
  fps: number;        // target paint cadence
  dpr: number;        // device-pixel-ratio cap ("resolution upgrade")
  ngonSides: number;  // how round a circle is allowed to be
  maxLod: Lod;        // which detail groups may draw
  bloom: boolean;
}
/** Baseline = a Raspberry-Pi-class head (U-WF-07). ULTRA is a desktop with the sensor on an accelerator. */
export const TIERS: Record<Tier, TierSpec> = {
  // LOW keeps LOD 1 deliberately: roads, contours and mounts cost little and are what make a city block
  // legible. Only LOD-2 detail (trees, windows) is surrendered. LOD 0 is the emergency floor the segment
  // budget falls back to on an arena far larger than this one.
  low:   { segments: 1200, fps: 15, dpr: 1,   ngonSides: 8,  maxLod: 1, bloom: false },
  med:   { segments: 2000, fps: 20, dpr: 1,   ngonSides: 13, maxLod: 2, bloom: false },
  high:  { segments: 3000, fps: 30, dpr: 1.5, ngonSides: 26, maxLod: 2, bloom: true },
  ultra: { segments: 4000, fps: 60, dpr: 2,   ngonSides: 39, maxLod: 2, bloom: true },
};

/** What the Edge sensor costs on this head, declared per HAL profile — never guessed at runtime. */
export interface SensorProfile { id: string; cnnReserveMs: number }
export const SENSOR_PROFILES: Record<string, SensorProfile> = {
  /** Pi-class: Canny-class extraction on the CPU. */
  "pi-baseline": { id: "pi-baseline", cnnReserveMs: 18 },
  /** Edge accelerator (Coral / NPU): a real CNN, and cheaper than the CPU fallback. */
  "edge-accel": { id: "edge-accel", cnnReserveMs: 6 },
  /** No sensor attached (the stationary turret sim): nothing is reserved. */
  none: { id: "none", cnnReserveMs: 0 },
};

export const UPGRADE_HEADROOM = 0.6;     // must fit in 60% of the budget before asking for more
export const UPGRADE_HOLD_MS = 3000;     // ...and hold it for 3s, so the tier cannot oscillate

/** Milliseconds per frame this tier leaves the RENDERER after the sensor takes its reserve. */
export function renderBudgetMs(tier: Tier, sensor: SensorProfile): number {
  return 1000 / TIERS[tier].fps - sensor.cnnReserveMs;
}
/** A tier is impossible when the CNN alone cannot fit inside its frame — say so, don't silently limp. */
export const tierFeasible = (tier: Tier, sensor: SensorProfile): boolean => renderBudgetMs(tier, sensor) > 0;

export interface FidelityState {
  tier: Tier;
  manualCap: Tier;                 // the operator's ceiling; auto-upgrade never passes it
  headroomSince: number | null;
  reason: string;
}
export const initFidelity = (manualCap: Tier = "ultra", start: Tier = "low"): FidelityState =>
  ({ tier: start, manualCap, headroomSince: null, reason: "start" });

const idx = (t: Tier) => TIER_ORDER.indexOf(t);
const stepTier = (t: Tier, d: number, cap: Tier): Tier =>
  TIER_ORDER[Math.max(0, Math.min(Math.min(idx(cap), TIER_ORDER.length - 1), idx(t) + d))];

export interface FidelityStep { state: FidelityState; changed: boolean; reason: string }
/**
 * One measurement in, one decision out. `renderMs` is the time the LAST frame spent drawing (sensor time
 * excluded — it has already been reserved). Downgrade is immediate; upgrade must earn UPGRADE_HOLD_MS.
 */
export function stepFidelity(state: FidelityState, renderMs: number, sensor: SensorProfile, now: number): FidelityStep {
  const budget = renderBudgetMs(state.tier, sensor);
  const keep = (reason: string, headroomSince = state.headroomSince): FidelityStep =>
    ({ state: { ...state, headroomSince, reason }, changed: false, reason });

  if (!Number.isFinite(renderMs) || renderMs < 0) return keep("no measurement");

  if (budget <= 0) {
    const down = stepTier(state.tier, -1, state.manualCap);
    const reason = `${sensor.id} reserves ${sensor.cnnReserveMs}ms — ${state.tier} is not feasible`;
    if (down === state.tier) return keep(`${reason}; already at ${state.tier}`);
    return { state: { ...state, tier: down, headroomSince: null, reason }, changed: true, reason };
  }
  if (renderMs > budget) {
    const down = stepTier(state.tier, -1, state.manualCap);
    const reason = `frame ${renderMs.toFixed(1)}ms over ${budget.toFixed(1)}ms budget`;
    if (down === state.tier) return keep(`${reason}; already at ${state.tier}`);
    return { state: { ...state, tier: down, headroomSince: null, reason: `down → ${down}: ${reason}` }, changed: true, reason: `down → ${down}: ${reason}` };
  }
  if (renderMs <= budget * UPGRADE_HEADROOM) {
    const since = state.headroomSince ?? now;
    const held = now - since;
    const up = stepTier(state.tier, +1, state.manualCap);
    if (up === state.tier) return keep(`at ceiling ${state.manualCap}`, since);
    if (held < UPGRADE_HOLD_MS) return keep(`headroom ${(held / 1000).toFixed(1)}s of ${UPGRADE_HOLD_MS / 1000}s`, since);
    if (!tierFeasible(up, sensor)) return keep(`${up} not feasible with ${sensor.id}`, since);
    const reason = `up → ${up}: ${held / 1000}s headroom at ${renderMs.toFixed(1)}ms`;
    return { state: { ...state, tier: up, headroomSince: null, reason }, changed: true, reason };
  }
  return keep(`holding ${state.tier}`, null);
}

/** What the HUD must show — the tier is never a silent decision (U-WF-09). */
export const fidelityLabel = (s: FidelityState, sensor: SensorProfile, lod?: { kept: number; dropped: number }): string =>
  `${s.tier.toUpperCase()} · ${TIERS[s.tier].fps}fps · dpr ${TIERS[s.tier].dpr}` +
  (sensor.cnnReserveMs ? ` · sensor ${sensor.cnnReserveMs}ms` : "") +
  (lod ? ` · ${lod.kept} drawn${lod.dropped ? `, ${lod.dropped} dropped` : ""}` : "");

/**
 * VISION-2525 R-CORE INTERACTION — the ONE shared direct-manipulation model every 2525 surface speaks.
 * =================================================================================================
 * Mirrors Security-2525 Mission-Planning EXACTLY so the Architect voxels, the celestial globes, and the tactical
 * map all feel identical (operator: "same left and right click and two finger zoom and rotation as mission
 * planning; R-Core for all areas of interaction"):
 *   • LEFT-drag  → PAN (screen-space translate)
 *   • RIGHT-drag → ROTATE bearing (horizontal) + TILT pitch (vertical)
 *   • TWO fingers → pinch = ZOOM · twist = BEARING · vertical = TILT (all at once)
 *   • WHEEL      → ZOOM
 * This module is the PURE, deterministic reducer math (no React, no DOM) so it is unit-tested and reused by the
 * `use-rcore-gestures` hook and any consumer. Constants match mission-planning.tsx (pinch damp 0.5, right-drag
 * pitch·0.35 / bearing −(dx/w)·π, two-finger tilt ·0.25).
 */
export interface GestureCfg {
  minPitch: number; maxPitch: number; minZoom: number; maxZoom: number;
  pinchDamp: number; rightPitch: number; twoFingerTilt: number; wheelStep: number;
  sensitivity: number; // S4 — global rotate/tilt feel scalar (1 = Mission-Planning parity; <1 = calmer/slower)
}
export const RCORE_CFG: GestureCfg = {
  minPitch: 11, maxPitch: 88, minZoom: 0.4, maxZoom: 6,
  // S4 — matched EXACTLY to mission-planning.tsx: pinch damp 0.5 (:791), wheel 1.15 (:663), tilt 0.25, right-pitch 0.35.
  pinchDamp: 0.5, rightPitch: 0.35, twoFingerTilt: 0.25, wheelStep: 0.15, sensitivity: 1,
};

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
/** Normalize an angle delta to (−π, π] so a twist across the ±π seam doesn't spin the world. */
export const wrapAngle = (a: number): number => {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x < -Math.PI) x += 2 * Math.PI;
  return x;
};

/** RIGHT-drag → bearing/pitch deltas. bearing += −(dx/width)·π (MP) ; pitch += dy·rightPitch. Scaled by sensitivity. */
export function rightDrag(dx: number, dy: number, width: number, cfg: GestureCfg = RCORE_CFG): { dBearing: number; dPitch: number } {
  const s = cfg.sensitivity ?? 1;
  return { dBearing: -(dx / Math.max(1, width)) * Math.PI * s, dPitch: dy * cfg.rightPitch * s };
}

export interface PinchState { dist: number; ang: number; cy: number }
/**
 * Two-finger update from the previous→current finger-pair geometry. Returns the zoom multiplier (spread = >1 =
 * zoom in, damped), the bearing twist delta, and the tilt delta from the vertical midpoint move — all together,
 * Google-Maps style, exactly like mission-planning.tsx:1783-1798.
 */
export function pinchUpdate(prev: PinchState, cur: PinchState, cfg: GestureCfg = RCORE_CFG): { zoomFactor: number; dBearing: number; dPitch: number } {
  const s = cfg.sensitivity ?? 1;
  const zoomFactor = 1 + (cur.dist / Math.max(1, prev.dist) - 1) * cfg.pinchDamp; // spread → dist↑ → factor>1 → zoom in
  const dBearing = wrapAngle(cur.ang - prev.ang) * s;
  const dPitch = (cur.cy - prev.cy) * cfg.twoFingerTilt * s;
  return { zoomFactor, dBearing, dPitch };
}

/** Geometry of a finger pair (for pinch/twist/tilt): separation, angle, and vertical midpoint. */
export function pairGeometry(ax: number, ay: number, bx: number, by: number): PinchState {
  return { dist: Math.hypot(ax - bx, ay - by), ang: Math.atan2(by - ay, bx - ax), cy: (ay + by) / 2 };
}

/** WHEEL → zoom multiplier (scroll up = zoom in). */
export function wheelZoom(deltaY: number, cfg: GestureCfg = RCORE_CFG): number {
  return deltaY < 0 ? 1 + cfg.wheelStep : 1 / (1 + cfg.wheelStep);
}

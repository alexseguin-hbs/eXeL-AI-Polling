// TAP, DOUBLE-TAP, DRAG — and the T-box. The pure half of touch targeting, gated without a DOM.
//
// r.050: click → AMBER + Tn; double-click → fire, which is refused unless the box is already RED. The
// arena already owns a pointer drag (orbit), so a tap has to be told apart from a drag by movement and
// time, and the schema's own `dragView: 'gimbal look if HI'` decides who owns the drag: the seat does.
//
// Hit-testing projects each door with the SAME sceneProject call the overlay draws it with, so what a
// finger lands on is what the eye sees — never a second projection that could disagree.
import { sceneProject, type SceneCam } from "@/lib/wire-core/scene-project";
import type { TargetView } from "@/lib/drone-2525/targets";
import type { SlotN } from "@/lib/drone-2525/slots";

export interface PointerSample { x: number; y: number; t: number }

/** A press that moved less than this, for less than this, is a tap. Anything else is a drag. */
export const TAP_MAX_PX = 8;
export const TAP_MAX_MS = 400;
/** Two taps this close in space and time are one double-tap. */
export const DOUBLE_MS = 350;
export const DOUBLE_PX = 14;
/** How far from a door's projected point a tap still means that door. */
export const HIT_RADIUS_PX = 24;

/** Tap or drag — from where the pointer went down and where it came up. */
export function classifyPress(down: PointerSample, up: PointerSample): "tap" | "drag" {
  const moved = Math.hypot(up.x - down.x, up.y - down.y);
  return moved <= TAP_MAX_PX && up.t - down.t <= TAP_MAX_MS ? "tap" : "drag";
}

/** Is this tap the second half of a double-tap on the first? */
export function isDoubleTap(prev: PointerSample | null, now: PointerSample): boolean {
  if (!prev) return false;
  return now.t - prev.t <= DOUBLE_MS && Math.hypot(now.x - prev.x, now.y - prev.y) <= DOUBLE_PX;
}

/**
 * The nearest live door within reach of a tap, by projected pixel distance. Doors behind the camera are
 * dropped, never clamped (the overlay's own rule). Returns null when nothing is close enough — a tap on
 * empty lawn is not a designation of the nearest thing to it.
 */
export function hitDoor(px: number, py: number, views: readonly TargetView[], cam: SceneCam, radiusPx = HIT_RADIUS_PX): TargetView | null {
  let best: { v: TargetView; d: number } | null = null;
  for (const v of views) {
    if (v.phase !== "up" && v.phase !== "captured") continue;
    const q = sceneProject(v.door.at, cam);
    if (q.behind) continue;
    const d = Math.hypot(q.x - px, q.y - py);
    if (d <= radiusPx && (!best || d < best.d)) best = { v, d };
  }
  return best?.v ?? null;
}

/**
 * THE T-BOX, in the vector language: four bracket corners around the mark and n ticks on the top edge for
 * Tn — one, two or three strokes, so the slot number is read as a count rather than as a glyph that would
 * need a font and a fill. Amber and red are the caller's colours; this is only the geometry.
 */
export function tboxPath(x: number, y: number, r: number, n: SlotN): string {
  const a = r * 0.45;                                            // bracket arm length
  const c = [
    `M${x - r} ${y - r + a}L${x - r} ${y - r}L${x - r + a} ${y - r}`,
    `M${x + r - a} ${y - r}L${x + r} ${y - r}L${x + r} ${y - r + a}`,
    `M${x + r} ${y + r - a}L${x + r} ${y + r}L${x + r - a} ${y + r}`,
    `M${x - r + a} ${y + r}L${x - r} ${y + r}L${x - r} ${y + r - a}`,
  ];
  const ticks: string[] = [];
  const gap = 4, h = 5, x0 = x - ((n - 1) * gap) / 2;
  for (let i = 0; i < n; i++) ticks.push(`M${x0 + i * gap} ${y - r - 2}L${x0 + i * gap} ${y - r - 2 - h}`);
  return [...c, ...ticks].join("");
}

/**
 * Voice arrives as a growing transcript; only the words since the last commit are a new command. Returns
 * the new tail and the length to remember. A restart (shorter text) starts over rather than replaying.
 */
export function newSpeech(full: string, handledLen: number): { tail: string; len: number } {
  const len = full.length;
  if (len < handledLen) return { tail: full, len };
  return { tail: full.slice(handledLen), len };
}

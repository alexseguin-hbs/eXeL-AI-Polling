// LINE OF SIGHT (DRN-05) — can this gimbal actually reach that door?
//
// INVARIANT, in the operator's terms: A SHOT THAT THE WORLD BLOCKS IS REPORTED AS BLOCKED, AND BY WHAT.
// A game that lets a laser pass through the Capitol is not a rehearsal of anything. Two things can stand in
// the way and both are checked: the GROUND (a rise between the turret and a door on the far side) and a
// BUILDING (its footprint extruded to its height — the same prism the arena draws, not a second model).
//
// Pure, deterministic, no clock. The march step is declared rather than adaptive so a replay of the same
// shot reaches the same verdict on any machine.
import type { Vec3 } from "@/lib/wire-core/wire-model";
import type { EN } from "@/lib/wire-core/primitives";

export interface Prism { id: string; footprint: EN[]; baseU: number; topU: number }

/** Why a sight line failed, in words a HUD can show without naming a data structure. */
export type LosBlock = { by: "terrain"; atM: number } | { by: "building"; id: string; atM: number };
export interface LosResult { clear: boolean; rangeM: number; block: LosBlock | null; samples: number }

const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Even-odd ray crossing. A point exactly on an edge counts as inside — a door sits on its own wall. */
export function pointInPoly(p: EN, poly: EN[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * March from eye to target. `ignore` is the prism that OWNS the target — a door is on its building's wall,
 * so that building must not be allowed to block its own door, and saying so explicitly is safer than
 * nudging the endpoint inward and hoping.
 */
export function lineOfSight(
  eye: Vec3, target: Vec3,
  ground: (e: number, n: number) => number,
  prisms: readonly Prism[],
  opts: { stepM?: number; ignore?: string; clearanceM?: number } = {},
): LosResult {
  const stepM = opts.stepM ?? 2;
  const clearance = opts.clearanceM ?? 0.25;
  const rangeM = Math.hypot(target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]);
  const n = Math.max(2, Math.ceil(rangeM / stepM));
  // Start past the eye and stop short of the target: both endpoints are ON a surface by construction.
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const p = lerp3(eye, target, t);
    const atM = rangeM * t;
    if (p[2] < ground(p[0], p[1]) - clearance) return { clear: false, rangeM, block: { by: "terrain", atM }, samples: n };
    for (const pr of prisms) {
      if (pr.id === opts.ignore) continue;
      if (p[2] > pr.topU || p[2] < pr.baseU) continue;
      if (pointInPoly([p[0], p[1]], pr.footprint)) return { clear: false, rangeM, block: { by: "building", id: pr.id, atM }, samples: n };
    }
  }
  return { clear: true, rangeM, block: null, samples: n };
}

/** The ground profile under a sight line — what a terrain strip in the HUD draws. */
export function transect(eye: Vec3, target: Vec3, ground: (e: number, n: number) => number, samples = 48): { t: number; groundU: number; rayU: number }[] {
  const out = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = lerp3(eye, target, t);
    out.push({ t, groundU: ground(p[0], p[1]), rayU: p[2] });
  }
  return out;
}

/** One line in plain words: what stopped the shot, and how far along it. Never names a data structure. */
export function losReason(r: LosResult, nameOf: (id: string) => string): string {
  if (r.clear) return "clear";
  if (r.block?.by === "terrain") return `ground in the way, ${Math.round(r.block.atM)} m out`;
  if (r.block?.by === "building") return `${nameOf(r.block.id)} in the way, ${Math.round(r.block.atM)} m out`;
  return "blocked";
}

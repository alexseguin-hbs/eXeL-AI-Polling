// THE CAMERA — one projection every 2525 surface shares.
//
// Ported from the projector inside radarSolidFaces (components/security-2525/mission-planning.tsx:449-489),
// which was written to agree EXACTLY with the CSS transform the ground layers use:
//     perspective(780px) rotateX(pitch) scale(1.2), transform-origin 50% 60%
// so SVG solids and CSS layers land on the same pixels. Extracting it (rather than writing a second camera)
// is what keeps a drone, a radar dome and a building in one world instead of three that nearly line up.
//
// Pure: no DOM, no clock. Culling is REFUSAL, never a clamp — a point behind the camera plane is dropped and
// reported, because clamping it would draw a line to somewhere that does not exist.
import type { Vec3 } from "./wire-model";

export interface SceneCam {
  pw: number; ph: number;        // pane size, px
  pitchDeg: number;              // rotateX — 0 is straight down, 88 is nearly edge-on
  bearingRad: number;            // map rotation about the up axis
  pxPerM: number;                // ground scale
  perspective?: number;          // CSS perspective, px (780 — the value the scene already uses)
  scale?: number;                // CSS scale (1.2)
  originX?: number;              // transform-origin fractions (0.5 / 0.6)
  originY?: number;
  nearPx?: number;               // cull margin in front of the eye (60 — mission-planning's rz2 >= 720)
}
export interface Projected { x: number; y: number; depth: number; behind: boolean }

export function sceneProject(v: Vec3, cam: SceneCam): Projected {
  const P = cam.perspective ?? 780, S = cam.scale ?? 1.2;
  const ox = cam.originX ?? 0.5, oy = cam.originY ?? 0.6, near = cam.nearPx ?? 60;
  const b = cam.bearingRad, cb = Math.cos(b), sb = Math.sin(b);
  // world (east, north, up) metres → map-rotated pixels, screen y down
  const e = v[0] * cb + v[1] * sb;
  const n = -v[0] * sb + v[1] * cb;
  const px = e * cam.pxPerM, py = -n * cam.pxPerM, pz = v[2] * cam.pxPerM;
  // rotateX(pitch): (y, z) → (y cosθ − z sinθ, y sinθ + z cosθ)
  const t = (cam.pitchDeg * Math.PI) / 180, ct = Math.cos(t), st = Math.sin(t);
  const y2 = py * ct - pz * st;
  const z2 = py * st + pz * ct;
  const denom = P - z2;
  if (!(denom > near) || !Number.isFinite(denom)) return { x: NaN, y: NaN, depth: -Infinity, behind: true };
  const k = (P / denom) * S;
  const x = ox * cam.pw + px * k;
  const y = oy * cam.ph + y2 * k;
  if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e5 || Math.abs(y) > 1e5) {
    return { x: NaN, y: NaN, depth: z2, behind: true };
  }
  return { x, y, depth: z2, behind: false };
}

/** The CSS transform the ground layers must use for SVG and CSS to coincide. */
export const cssTransform = (cam: SceneCam): string =>
  `perspective(${cam.perspective ?? 780}px) rotateX(${cam.pitchDeg}deg) scale(${cam.scale ?? 1.2})`;

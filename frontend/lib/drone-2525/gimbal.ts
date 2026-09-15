// ONE GIMBAL, TWO MOUNTS (DRN-04, U-WF-02/10).
//
// Operator 2026-09-15: "gimbal should be able to operate on fixed turret as well (we can test this way
// faster stationary before R-Core building on fixed wing). design must be the same for both."
//
// INVARIANT, in the operator's terms: WHAT A TARGETEER LEARNS ON THE TURRET IS WHAT THEY FLY WITH.
// There is exactly one Gimbal record, one slew law, one frustum and one aim readout. A mount contributes
// only WHERE the gimbal sits and HOW its base is oriented — nothing about how it behaves. If a second
// behaviour ever appears for the airframe, this invariant is broken and the gate in drone-gimbal fails.
//
// Angles: azimuth is degrees clockwise from north (0 = north, 90 = east), matching the domain's homeAz and
// the A.B..C convention the other 2525 surfaces speak. Elevation is degrees above the horizon.
// Pure: no clock, no DOM, no Math.random — a replay re-runs these functions and gets the same aim.
import type { Vec3 } from "@/lib/wire-core/wire-model";

export type MountKind = "turret" | "airframe";

/** Where the gimbal is bolted. The only thing a mount decides. */
export interface Mount {
  id: string;
  kind: MountKind;
  label: string;
  /** Base position in the arena frame: east, north metres, and height above that ground point. */
  at: [number, number];
  heightM: number;
  /** Where it rests when nobody is driving it. */
  homeAz: number;
  homeEl: number;
}

/** The gimbal's declared limits and optics — one record, read by both mounts. */
export interface GimbalSpec {
  panMinDeg: number; panMaxDeg: number;
  tiltMinDeg: number; tiltMaxDeg: number;
  slewDegPerSec: number;
  hfovDeg: number; vfovDeg: number;
  nearM: number; rangeM: number;
}

/** Where it is pointing right now, and where it has been told to point. */
export interface GimbalState { az: number; el: number; cmdAz: number; cmdEl: number }

const DEG = Math.PI / 180;
const clampDeg = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Shortest signed turn from a to b, in degrees, over the -180..180 wrap. */
export function shortestTurn(a: number, b: number): number {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}
export const normAz = (a: number) => ((a % 360) + 360) % 360;

export const initGimbal = (m: Mount): GimbalState =>
  ({ az: normAz(m.homeAz), el: m.homeEl, cmdAz: normAz(m.homeAz), cmdEl: m.homeEl });

/** Aim the gimbal. The command is clamped to the DECLARED limits — a command outside them is refused
 *  down to the limit, not silently obeyed, so the readout never shows an angle the hardware cannot hold. */
export function command(s: GimbalState, spec: GimbalSpec, az: number, el: number): GimbalState {
  const panFull = spec.panMaxDeg - spec.panMinDeg >= 360;
  return {
    ...s,
    cmdAz: panFull ? normAz(az) : normAz(clampDeg(az, spec.panMinDeg, spec.panMaxDeg)),
    cmdEl: clampDeg(el, spec.tiltMinDeg, spec.tiltMaxDeg),
  };
}

/** Advance the physical gimbal toward its command at the declared slew rate. dt seconds. */
export function slew(s: GimbalState, spec: GimbalSpec, dt: number): GimbalState {
  const step = Math.max(0, spec.slewDegPerSec * Math.max(0, dt));
  const dA = shortestTurn(s.az, s.cmdAz), dE = s.cmdEl - s.el;
  // A GIMBAL THAT HAS ARRIVED RETURNS THE SAME OBJECT. Returning a fresh one every frame made every memo
  // keyed on the gimbal recompute while nothing was moving — including the frame test over every live
  // target. Identity is the signal React reads; handing it a new object is telling it something changed.
  if (dA === 0 && dE === 0) return s;
  const move = (d: number) => (Math.abs(d) <= step ? d : Math.sign(d) * step);
  return { ...s, az: normAz(s.az + move(dA)), el: s.el + move(dE) };
}

/** True once the gimbal has actually reached its command — a shot may only be taken when it has. */
export const onTarget = (s: GimbalState, tolDeg = 0.5) =>
  Math.abs(shortestTurn(s.az, s.cmdAz)) <= tolDeg && Math.abs(s.cmdEl - s.el) <= tolDeg;

/** The gimbal's eye in world coordinates. groundAt lets a turret stand on the terrain it is bolted to. */
export const eyeOf = (m: Mount, groundAt: (e: number, n: number) => number): Vec3 =>
  [m.at[0], m.at[1], groundAt(m.at[0], m.at[1]) + m.heightM];

/** Unit vector for an azimuth/elevation pair in the arena frame (east, north, up). */
export function aimVector(azDeg: number, elDeg: number): Vec3 {
  const a = azDeg * DEG, e = elDeg * DEG, c = Math.cos(e);
  return [Math.sin(a) * c, Math.cos(a) * c, Math.sin(e)];      // az 0 = +north, az 90 = +east
}

/** The aim that would put a world point in the centre of frame, and how far away it is. */
export function aimAt(eye: Vec3, p: Vec3): { az: number; el: number; rangeM: number } {
  const de = p[0] - eye[0], dn = p[1] - eye[1], du = p[2] - eye[2];
  const flat = Math.hypot(de, dn);
  return {
    az: normAz((Math.atan2(de, dn) / DEG)),
    el: (Math.atan2(du, flat) / DEG),
    rangeM: Math.hypot(flat, du),
  };
}

/** Is a world point inside the sensor's cone right now — and by how much, so a HUD can show near-misses. */
export interface InFrame { inFrame: boolean; dAz: number; dEl: number; rangeM: number; tooNear: boolean; tooFar: boolean }
export function inFrame(eye: Vec3, s: GimbalState, spec: GimbalSpec, p: Vec3): InFrame {
  const a = aimAt(eye, p);
  const dAz = shortestTurn(s.az, a.az), dEl = a.el - s.el;
  const tooNear = a.rangeM < spec.nearM, tooFar = a.rangeM > spec.rangeM;
  return {
    inFrame: Math.abs(dAz) <= spec.hfovDeg / 2 && Math.abs(dEl) <= spec.vfovDeg / 2 && !tooNear && !tooFar,
    dAz, dEl, rangeM: a.rangeM, tooNear, tooFar,
  };
}

/** The A.B..C readout every 2525 surface shows: bearing, elevation, range — one format, both mounts. */
export const aimReadout = (s: GimbalState, rangeM?: number): string =>
  `A ${s.az.toFixed(0).padStart(3, "0")}° · B ${s.el >= 0 ? "+" : ""}${s.el.toFixed(0)}°` +
  (rangeM == null ? "" : ` · C ${rangeM.toFixed(0)} m`);

/** Read the domain's mount records. A turret and an airframe differ ONLY in these fields. */
export const turretMount = (t: { id: string; label: string; at: [number, number]; heightM: number; homeAz: number; homeEl: number }): Mount =>
  ({ ...t, kind: "turret" });
export const airframeMount = (id: string, label: string, at: [number, number], aglM: number, homeAz = 0, homeEl = -10): Mount =>
  ({ id, label, kind: "airframe", at, heightM: aglM, homeAz, homeEl });

// TWO SEATS, TWO EYES — ONE GEOMETRY FOR EVERY VEHICLE (operator deck r.050, adopted 2026-09-16).
//
// Operator 2026-09-15: "make sure view from HI gimbal laser cockpit for HI pilot are different per
// dimensions of aircraft or quad." Operator deck r.013 → r.050, CONTRACT.seat: pilot canopy +0.18 L,
// targeteer belly −0.15 L, turret separation 0 — "same map on turret, VTOL, Manta, Ark, MASS droid: one
// mount, two seats." Decision 2026-09-16: adopt the deck's geometry as canonical.
//
// WHAT CHANGED, ON THE RECORD (ledger rev 18, a correction). The first edition carried two geometries — a
// tighter one for the hover and a wider one for the wing — and reported 18 cm and 37 cm between the eyes.
// The deck declares ONE geometry for every vehicle and every flight mode, with the targeteer AFT of centre
// where the first edition had them forward: pilot {f +0.18, u +0.12}, targeteer {f −0.15, u −0.04}. On the
// 0.7777 m fuselage that is 28.5 cm between the two eyes, in the hover and on the wing alike. The
// discipline is unchanged: the offsets are FRACTIONS OF THE NOSE-TO-TAIL LENGTH (never the span), so a
// Manta or a droid gets its own parallax for free; a turret is exactly zero by construction.
//
// The fractions live in lib/2525-core/controls.ts (SEAT_GEOMETRY) beside the rest of the schema, so this
// file cannot drift from the deck without the controls-schema gate noticing.
//
// Pure: no clock, no DOM. The ground sampler is passed in, as everywhere else in this domain.
import { GLYPH_UNIT_M } from "./airframe-glyph";
import { SEAT_GEOMETRY } from "@/lib/2525-core/controls";
import type { Mount } from "./gimbal";
import type { FlightMode } from "./flight";
import type { Vec3 } from "@/lib/wire-core/wire-model";

export type Seat = "pilot" | "targeteer";

/** Where a seat sits in the airframe's own body frame: forward, right, up — as fractions of its length. */
export interface SeatOffset { fwd: number; right: number; up: number }

/**
 * ONE GEOMETRY. The pilot looks out of the canopy, forward and above the centre; the targeteer looks down a
 * gimbal slung under the belly, aft and below. The same on rotors and on the wing — the deck's contract,
 * and the reason a crew's pictures agree the same way through a transition.
 */
export const SEAT_OFFSETS: Readonly<Record<Seat, SeatOffset>> = {
  pilot:     { fwd: SEAT_GEOMETRY.pilot.f,     right: SEAT_GEOMETRY.pilot.r,     up: SEAT_GEOMETRY.pilot.u },
  targeteer: { fwd: SEAT_GEOMETRY.targeteer.f, right: SEAT_GEOMETRY.targeteer.r, up: SEAT_GEOMETRY.targeteer.u },
};

/** The turret's separation, from the same contract: exactly zero. */
export const TURRET_SEPARATION_M = SEAT_GEOMETRY.turretSep;

/**
 * The eye for one seat. A TURRET has no two seats to separate — one head, one mount, and both people are
 * looking down the same barrel — so the offset is zero and the function says so by construction rather than
 * by inventing a parallax that does not exist.
 */
export function seatEye(
  mount: Mount, seat: Seat, flightMode: FlightMode,
  groundAt: (e: number, n: number) => number,
): Vec3 {
  const base: Vec3 = [mount.at[0], mount.at[1], groundAt(mount.at[0], mount.at[1]) + mount.heightM];
  if (mount.kind === "turret") return TURRET_SEPARATION_M === 0 ? base : base;   // zero by contract, not by a small invented number

  void flightMode;                                              // one geometry in every mode (r.050); kept in the signature so callers need not change
  const o = SEAT_OFFSETS[seat];
  const L = GLYPH_UNIT_M;                                       // nose-to-tail, never the span
  const hr = (mount.homeAz * Math.PI) / 180;                    // the airframe's heading
  const ch = Math.cos(hr), sh = Math.sin(hr);
  // body (forward, right) → arena (east, north), yawed by the heading
  return [
    base[0] + (o.fwd * sh + o.right * ch) * L,
    base[1] + (o.fwd * ch - o.right * sh) * L,
    base[2] + o.up * L,
  ];
}

/** How far apart the two people actually are, in metres. Shown, because a crew should know. */
export function seatSeparationM(mount: Mount, flightMode: FlightMode, groundAt: (e: number, n: number) => number): number {
  const a = seatEye(mount, "pilot", flightMode, groundAt);
  const b = seatEye(mount, "targeteer", flightMode, groundAt);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** One line for the HUD: whose eye this is and how far it is from the other seat's. */
export const seatEyeLine = (seat: Seat, mount: Mount, flightMode: FlightMode, groundAt: (e: number, n: number) => number): string =>
  mount.kind === "turret"
    ? "one head, one mount"
    : `${seat === "pilot" ? "canopy" : "sensor"} · ${seatSeparationM(mount, flightMode, groundAt).toFixed(1)} m from the other seat`;

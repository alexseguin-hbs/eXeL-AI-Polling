// TWO SEATS, TWO EYES — and the distance between them comes from the aircraft, not from taste.
//
// Operator 2026-09-15: "make sure view from HI gimbal laser cockpit for HI pilot are different per
// dimensions of aircraft or quad."
//
// Until now both seats looked from the same point, which quietly said the two people are in the same place.
// They are not. A pilot looks out of the front of the airframe; a targeteer looks down a gimbal slung under
// it — and on a rotor-borne quad that is a different separation than on the wing, because in the hover the
// canopy is barely ahead of the mast while in flight the nose stretches out in front.
//
// THE OFFSETS ARE FRACTIONS OF THE AIRFRAME'S OWN NOSE-TO-TAIL LENGTH, so an aircraft of another size gets
// a different parallax for free and nobody has to remember to update a constant.
//
// CORRECTED 2026-09-16. The first edition multiplied these fractions by `AIRFRAME_EXTENT.lengthM`, which —
// because the glyph builder trusted a wrong `frame` block over the drawing's own header — was the SPAN, not
// the fuselage. The law was right and the axis was wrong, so the crew parallax was measured across the
// wing. It now scales by GLYPH_UNIT_M, the nose-to-tail length, and at the declared 0.7777 m foil that is
// about 18 cm between the two eyes in the hover and 37 cm on the wing: a hand's width, which is the honest
// answer for an aircraft this size.
//
// Pure: no clock, no DOM. The ground sampler is passed in, as everywhere else in this domain.
import { GLYPH_UNIT_M } from "./airframe-glyph";
import type { Mount } from "./gimbal";
import type { FlightMode } from "./flight";
import type { Vec3 } from "@/lib/wire-core/wire-model";

export type Seat = "pilot" | "targeteer";

/** Where a seat sits in the airframe's own body frame: forward, right, up — as fractions of its length. */
export interface SeatOffset { fwd: number; right: number; up: number }

/**
 * ROTORS: the airframe hangs level under its discs and the two crew positions are close together — the
 * canopy is barely ahead of the mast and the gimbal is slung just under the belly, close in, because a
 * sensor on a hovering machine wants to look straight down without the airframe in the way. Roughly
 * eighteen centimetres between the eyes on this airframe.
 *
 * WING: flying, the machine stretches out. The nose — and the pilot in it — is far in front, while the
 * sensor stays under the fuselage centre of gravity and drops to clear the wing root. The two eyes pull
 * roughly twice as far apart as they were in the hover, which is exactly what a crew notices at transition:
 * the targeteer's picture stops agreeing with the pilot's.
 *
 * At the declared 1.111 m foil that is about 18 cm in the hover and 37 cm on the wing. Small numbers, and
 * the right ones: on an aircraft this size the camera and the gimbal really are a hand's width apart.
 */
export const SEAT_OFFSETS: Record<"quad" | "wing", Record<Seat, SeatOffset>> = {
  quad: {
    pilot:     { fwd: 0.22, right: 0, up: 0.06 },
    targeteer: { fwd: 0.06, right: 0, up: -0.10 },
  },
  wing: {
    pilot:     { fwd: 0.46, right: 0, up: 0.10 },
    targeteer: { fwd: 0.12, right: 0, up: -0.24 },
  },
};

/** A transition is neither, so it reads as the mode it is becoming rather than snapping at the end. */
const frameOf = (m: FlightMode): "quad" | "wing" => (m === "wing" ? "wing" : "quad");

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
  if (mount.kind === "turret") return base;

  const o = SEAT_OFFSETS[frameOf(flightMode)][seat];
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

// FLIGHT (DRN-08) — a fixed-wing VTOL that hovers on four rotors and cruises on a wing, and the energy that
// costs. Operator 2026-09-15: "We will also allow for fix wing vertical take off drone (like quantum systems
// that can operate in plane fix wing or quadcopter mode) … with lift effect, physics basics, battery estimates".
//
// THE INVARIANT, in the operator's terms: EVERY NUMBER HERE IS A BOUNDING ESTIMATE AND SAYS SO. This is a
// first-order model built on brochure-class figures for a 5 kg airframe. It is good enough to make a
// rehearsal feel like a rehearsal and to size a battery argument; it is not design evidence, and the banner
// that says so is on every screen that shows it.
//
// The one piece of real aerodynamics that earns its place is the STALL SPEED, because it is what makes the
// transition a decision rather than a button: below it the wing carries nothing and the rotors must.
//     V_stall = sqrt( 2 m g / (rho S CLmax) )
//
// Pure: no clock, no DOM, no Math.random. `step` takes dt and returns the next state.
export type FlightMode = "quad" | "transition" | "wing";

export interface Airframe {
  massKg: number; wingAreaM2: number; CLmax: number; CLcruise: number; CD0: number;
  cruiseMs: number; VneMs: number; rotors: number; rotorThrustMaxN: number;
  hoverPowerW: number; cruisePowerW: number; transitionMinAglM: number; rhoKgM3: number;
}
export interface Battery { capacityWh: number; reserveFrac: number }

export const G = 9.81;

/** Velocity lost per second to rotor drag in the hover. The quad's terminal speed is acc / this. */
export const DAMP_PER_S = 0.9;
/**
 * How far over its own stall the rotors must be able to push the aircraft before the wing is asked to fly.
 * 1.35 is a margin, not a measurement, and it is stated here rather than buried in an acceleration.
 * lib/drone-2525 gates this in tests/drone-flight.test.mjs: if the terminal speed ever falls to the stall
 * speed, the transition becomes unreachable and the aircraft can never become an aeroplane.
 */
export const QUAD_TERMINAL_OVER_STALL = 1.35;
/** What the rotors can actually work up to, for this airframe. Derived, never typed. */
export const quadTerminalMs = (a: Airframe): number => QUAD_TERMINAL_OVER_STALL * stallSpeedMs(a);

/** Below this airspeed the wing carries nothing. The single number the whole transition turns on. */
export const stallSpeedMs = (a: Airframe): number =>
  Math.sqrt((2 * a.massKg * G) / (a.rhoKgM3 * a.wingAreaM2 * a.CLmax));

/** Lift the wing actually makes at this airspeed, newtons. Quadratic in speed, as lift is. */
export const liftN = (a: Airframe, airspeedMs: number, cl = a.CLcruise): number =>
  0.5 * a.rhoKgM3 * airspeedMs * airspeedMs * a.wingAreaM2 * cl;

/** The share of the aircraft's weight the wing is carrying right now, 0..1+. */
export const wingShare = (a: Airframe, airspeedMs: number): number =>
  Math.min(1.4, liftN(a, airspeedMs, a.CLmax) / (a.massKg * G));

/** Parasite drag only — a bounding estimate, and the reason cruise is not free. */
export const dragN = (a: Airframe, airspeedMs: number): number =>
  0.5 * a.rhoKgM3 * airspeedMs * airspeedMs * a.wingAreaM2 * a.CD0;

export interface FlightState {
  mode: FlightMode;
  /** Position in the arena frame: east, north metres, and height above ground. */
  e: number; n: number; aglM: number;
  /** Velocity, metres per second, in the same frame. */
  ve: number; vn: number; vu: number;
  headingDeg: number;
  /** Fraction of the battery's USABLE energy left, 1 → 0. The reserve is never part of this. */
  energy: number;
  /** Seconds spent in the transition, so it takes time rather than happening on a keypress. */
  transitionS: number;
  /** Why the last refusal happened, in words. Empty when nothing was refused. */
  refused: string;
}

export const TRANSITION_S = 4;
/**
 * Where a rehearsal loiters. An airframe sitting on the lawn sees nothing but grass, so a round that starts
 * on the ground starts blind — which is how the first walkthrough found this: the machine targeteer never
 * asked to shoot anything, because from 0 m with the camera tilted down there was nothing to ask about.
 */
export const LOITER_AGL_M = 45;

/** The climb input a take-off needs right now, and whether it is finished. Uses the same physics as a stick. */
export function takeoffInput(s: FlightState, targetAglM = LOITER_AGL_M): { climb: number; done: boolean } {
  const gap = targetAglM - s.aglM;
  if (gap <= 1) return { climb: 0, done: true };
  return { climb: Math.min(1, gap / 12), done: false };     // eases off as it arrives, rather than overshooting
}

export const initFlight = (e = 0, n = -260, headingDeg = 0): FlightState =>
  ({ mode: "quad", e, n, aglM: 0, ve: 0, vn: 0, vu: 0, headingDeg, energy: 1, transitionS: 0, refused: "" });

export interface FlightInput {
  /** -1..1 — climb in quad, or pitch in wing. */
  climb: number;
  /** -1..1 — forward. */
  forward: number;
  /** -1..1 — strafe in quad, bank in wing. */
  lateral: number;
  /** -1..1 — yaw. */
  yaw: number;
  /** The operator asked to change mode this tick. */
  toggleMode?: boolean;
}

export const airspeedOf = (s: FlightState): number => Math.hypot(s.ve, s.vn);

/** Watts being drawn right now: the rotors carry whatever the wing does not. */
export function powerW(a: Airframe, s: FlightState): number {
  if (s.mode === "wing") return a.cruisePowerW + dragN(a, airspeedOf(s)) * airspeedOf(s) * 0.1;
  const carried = s.mode === "transition" ? wingShare(a, airspeedOf(s)) : 0;
  const rotorShare = Math.max(0, 1 - carried);
  return a.cruisePowerW * 0.2 + a.hoverPowerW * rotorShare;
}

/** Usable watt-hours: the reserve is never spent by the simulation, so endurance is quoted honestly. */
export const usableWh = (b: Battery): number => b.capacityWh * (1 - b.reserveFrac);

/** Minutes left at the current draw. A bounding estimate, like everything else here. */
export const minutesLeft = (a: Airframe, b: Battery, s: FlightState): number => {
  const w = powerW(a, s);
  return w <= 0 ? Infinity : (usableWh(b) * s.energy) / w * 60;
};
/** Kilometres left if it flies on as it is flying now. */
export const rangeKm = (a: Airframe, b: Battery, s: FlightState): number =>
  (minutesLeft(a, b, s) * 60 * airspeedOf(s)) / 1000;

/** Can it go to the wing right now — and if not, WHY, in words the pilot can act on. */
export function canTransition(a: Airframe, s: FlightState): { ok: boolean; why: string } {
  if (s.mode === "wing") return { ok: true, why: "already on the wing" };
  if (s.aglM < a.transitionMinAglM) return { ok: false, why: `too low — needs ${a.transitionMinAglM} m above ground, has ${s.aglM.toFixed(0)} m` };
  const v = airspeedOf(s), stall = stallSpeedMs(a);
  if (v < stall) return { ok: false, why: `too slow — the wing carries nothing under ${stall.toFixed(1)} m/s, flying at ${v.toFixed(1)}` };
  return { ok: true, why: `${v.toFixed(1)} m/s over a ${stall.toFixed(1)} m/s stall` };
}

/**
 * One tick. Quad flies like a quad: direct velocity with drag. Wing flies like a wing: it must keep its
 * speed up or it falls out of the sky, which is the whole point of having two modes.
 */
export function stepFlight(a: Airframe, b: Battery, s: FlightState, i: FlightInput, dt: number): FlightState {
  const d = Math.max(0, Math.min(0.1, dt));
  let { mode, transitionS, refused } = { mode: s.mode, transitionS: s.transitionS, refused: "" };

  if (i.toggleMode) {
    if (mode === "wing") { mode = "transition"; transitionS = 0; }
    else if (mode === "quad") {
      const t = canTransition(a, s);
      if (t.ok) { mode = "transition"; transitionS = 0; } else refused = t.why;
    }
  }

  const heading = (s.headingDeg + i.yaw * (mode === "wing" ? 35 : 70) * d + 360) % 360;
  const hr = (heading * Math.PI) / 180;
  const fwd: [number, number] = [Math.sin(hr), Math.cos(hr)];
  const right: [number, number] = [Math.cos(hr), -Math.sin(hr)];

  let ve = s.ve, vn = s.vn, vu = s.vu;
  const stall = stallSpeedMs(a);

  if (mode === "wing") {
    // On the wing: thrust forward, drag back, and altitude traded against speed by pitching.
    const thrust = 14 * Math.max(0, 0.35 + i.forward * 0.65);
    const v = Math.hypot(ve, vn) || 0.001;
    const drag = dragN(a, v) / a.massKg;
    ve += (fwd[0] * thrust - (ve / v) * drag) * d + right[0] * i.lateral * 3 * d;
    vn += (fwd[1] * thrust - (vn / v) * drag) * d + right[1] * i.lateral * 3 * d;
    const speed = Math.hypot(ve, vn);
    if (speed > a.VneMs) { const k = a.VneMs / speed; ve *= k; vn *= k; }
    // Pitch trades height for speed. Below the stall the wing stops carrying and it sinks, hard.
    const carried = wingShare(a, speed);
    vu = i.climb * 4 + (carried >= 1 ? 0 : -(1 - carried) * 9);
  } else {
    // Rotors: direct, damped, and every newton of it costs hover power.
    //
    // THE QUAD MUST BE ABLE TO REACH ITS OWN STALL SPEED — and now it is DERIVED to, not typed to.
    //
    // The first draft had acceleration 9 against damping 1.8: terminal 5 m/s against an 8.4 m/s stall, so a
    // transition to the wing could begin, complete, and instantly fall back, forever. That was fixed by
    // hand-typing `acc = 14`, which gave about 15 m/s — fine for THAT stall. Then 2026-09-16 derived the
    // wing from the drawing, the stall moved to 14.4 m/s, and 15 against 14.4 is the same bug with a
    // thinner margin. A constant tuned against one airframe is a constant that breaks on the next one.
    //
    // So the requirement is written as the requirement: terminal speed is a stated multiple of whatever
    // this airframe's stall happens to be. Terminal is acc / DAMP_PER_S, so acc follows from the margin.
    const acc = QUAD_TERMINAL_OVER_STALL * DAMP_PER_S * stallSpeedMs(a);
    ve += (fwd[0] * i.forward + right[0] * i.lateral) * acc * d;
    vn += (fwd[1] * i.forward + right[1] * i.lateral) * acc * d;
    const damp = 1 - DAMP_PER_S * d;
    ve *= damp; vn *= damp;
    vu = i.climb * 5;
    if (mode === "transition") {
      transitionS += d;
      if (transitionS >= TRANSITION_S) { mode = s.mode === "wing" ? "quad" : "wing"; transitionS = 0; }
    }
  }

  const aglM = Math.max(0, s.aglM + vu * d);
  if (aglM === 0 && vu < 0) vu = 0;                       // on the ground, not through it
  // Falling out of the wing puts it back on its rotors rather than into the lawn. The threshold is the
  // STALL SPEED itself, not a fraction of it: below the stall the wing is carrying nothing, which is the
  // definition of the number, so there is no honest reason to pick anything else.
  if (mode === "wing" && (aglM < 3 || Math.hypot(ve, vn) < stall)) {
    mode = "quad"; refused = refused || "wing stalled — back on the rotors";
  }

  const spent = (powerW(a, { ...s, mode, ve, vn, vu, aglM }) * d) / 3600;   // watt-hours this tick
  const energy = Math.max(0, s.energy - spent / usableWh(b));

  return {
    mode, transitionS, refused,
    e: s.e + ve * d, n: s.n + vn * d, aglM,
    ve, vn, vu, headingDeg: heading, energy,
  };
}

/** One line for the HUD: mode, speed, height, and what is left. Always a bounding estimate. */
export const flightLine = (a: Airframe, b: Battery, s: FlightState): string =>
  `${s.mode.toUpperCase()} · ${airspeedOf(s).toFixed(0)} m/s · ${s.aglM.toFixed(0)} m AGL · ` +
  `${Math.round(s.energy * 100)}% · ~${minutesLeft(a, b, s).toFixed(0)} min`;

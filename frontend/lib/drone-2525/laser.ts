// THE BEAM, THE SHIELD, AND THE TIME IT TAKES — Drone-2525's engagement rules.
//
// Operator 2026-09-16: "Come up with lasers YAG rules and shields and laser time on target for bringing
// down drone safely to ground with special lighting effects; take inspiration from Independence Day and
// Ender's Game, and Laser tag Battle House arena in Barrington outside Chicago."
//
// ── WHAT IS TAKEN FROM EACH ──────────────────────────────────────────────────────────────────────
// INDEPENDENCE DAY — the shield comes down first, and the beam is visibly HELD rather than fired and
//   forgotten. Nothing reaches the airframe until the shield has absorbed what it can.
// ENDER'S GAME — freeze, do not destroy. A defeated aircraft is DISABLED and flown down under control; it
//   is never deleted mid-air. This is also the operator's own words: "bringing down drone safely to ground."
// BATTLE HOUSE, BARRINGTON — an arena people walk into: a clock, a score, two teams, and a reactivation
//   delay rather than a permanent removal. A round ends; it does not exterminate.
//
// ── WHY A FLUENCE MODEL AND NOT A HIT-POINT ONE ──────────────────────────────────────────────────
// A hit-point model would make range irrelevant and the beam a trigger. Directed energy is not like that:
// what matters is IRRADIANCE at the target (watts per square centimetre) accumulated over DWELL TIME, which
// is energy per unit area — fluence. The beam spreads with range and the air absorbs some of it, so the
// same weapon needs seconds at 600 m and under a second at 100 m. That single fact produces the whole game:
// you must close, and you must hold.
//
// Nd:YAG is 1064 nm; the constants below are game-scale BOUNDING ESTIMATES, declared in the domain and
// never design evidence. The physics is first-order on purpose — beam spread, atmospheric attenuation,
// accumulation, and cooling. Nothing here models a real weapon.
//
// Pure: no clock, no DOM, no Math.random. Every function takes its time step. The same beam held for the
// same seconds at the same range always gives the same answer, so a round replays.

/** 1064 nm. Named because the rules are about a specific class of emitter, not "a laser". */
export const WAVELENGTH_NM = 1064;

export interface BeamSpec {
  /** Power at the aperture, watts. */
  powerW: number;
  /** Beam radius where it leaves the aperture, metres. */
  apertureRadiusM: number;
  /** Half-angle spread, milliradians. This is what makes range matter. */
  divergenceMrad: number;
  /** Atmospheric attenuation, per kilometre. Clear-air bounding figure at 1064 nm. */
  attenuationPerKm: number;
  /** Past this the emitter will not fire at all — it is not merely weak, it is refused. */
  maxRangeM: number;
  /**
   * FINE-TRACK LOCK, seconds. The director needs this long back on a target before it delivers full power;
   * below it, power ramps linearly from zero.
   *
   * This exists because the first edition of this module CLAIMED "you must hold the beam" and did not
   * actually make it so — energy was energy, so eighty half-tick flicks delivered exactly what two held
   * seconds did, and the gate caught the gap between the claim and the code. A real beam director does not
   * work that way: coming back onto a target costs settling time. So the mechanic is now real, and it is
   * what makes flicking between targets a losing tactic rather than a neutral one.
   */
  lockS: number;
}

export interface Defences {
  /** What the shield can absorb before it fails, joules per square centimetre. */
  shieldJcm2: number;
  /** What the airframe absorbs after that before it is disabled. */
  hullJcm2: number;
  /** How fast a shield comes back once it has been left alone, per second. */
  shieldRegenJcm2PerS: number;
  /** How long it must be left alone before regeneration begins, seconds. */
  shieldRegenDelayS: number;
  /** How fast accumulated hull heat bleeds away when the beam comes off, per second. */
  hullCoolJcm2PerS: number;
}

/**
 * Where an aircraft is in its life. `disabled` is the instant of defeat; `descending` is the controlled
 * flight down that follows it; `grounded` is a safe landing. There is deliberately no "destroyed".
 */
export type Condition = "flying" | "shieldDown" | "disabled" | "descending" | "grounded";

export interface DamageState {
  /** Shield remaining, J/cm². Starts at capacity. */
  shield: number;
  /** Heat accumulated in the airframe, J/cm². */
  hull: number;
  /** Unbroken seconds the beam has been on this target. Resets when it comes off. */
  dwellS: number;
  /** Seconds since the beam last touched it, for the regeneration delay. */
  quietS: number;
  condition: Condition;
  /** Height above ground during the descent, metres. Only meaningful once disabled. */
  aglM: number;
  /** The tMs at which it was disabled, so a round can replay the moment. */
  disabledAtMs: number | null;
}

export const initDamage = (d: Defences, aglM = 0): DamageState => ({
  shield: d.shieldJcm2, hull: 0, dwellS: 0, quietS: 0, condition: "flying", aglM, disabledAtMs: null,
});

// ── THE BEAM ─────────────────────────────────────────────────────────────────────────────────────

/** Spot radius at range, metres. Aperture plus spread — the only reason range matters. */
export const spotRadiusM = (b: BeamSpec, rangeM: number): number =>
  b.apertureRadiusM + (b.divergenceMrad / 1000) * Math.max(0, rangeM);

/** What survives the air between here and there, 0..1. */
export const transmission = (b: BeamSpec, rangeM: number): number =>
  Math.exp(-b.attenuationPerKm * (Math.max(0, rangeM) / 1000));

/**
 * Irradiance on the target, W/cm². This is the number the whole model turns on: power that survives the
 * air, spread over the spot the beam has grown into by the time it arrives.
 */
export function irradianceWcm2(b: BeamSpec, rangeM: number): number {
  if (rangeM > b.maxRangeM) return 0;              // refused, not merely weak
  const rCm = spotRadiusM(b, rangeM) * 100;
  const areaCm2 = Math.PI * rCm * rCm;
  return areaCm2 > 0 ? (b.powerW * transmission(b, rangeM)) / areaCm2 : 0;
}

/**
 * How much of the beam is actually landing, 0..1, given how long it has been continuously on this target.
 * Zero at the instant of acquisition, full once the director has settled.
 */
export const lockFraction = (b: BeamSpec, dwellS: number): number =>
  b.lockS > 0 ? Math.max(0, Math.min(1, dwellS / b.lockS)) : 1;

/**
 * Seconds of unbroken beam needed to take the shield down from full, at this range — INCLUDING the lock
 * ramp, because a player holds a trigger, not an integral. Infinity if the beam cannot reach at all.
 *
 * The ramp delivers half of what a full-power beam would over its own duration, so the ramp costs lockS/2
 * seconds of energy. That is a closed form, not a simulation, so the published table and the running game
 * cannot disagree.
 */
export const dwellToShieldDownS = (b: BeamSpec, d: Defences, rangeM: number): number => withLock(b, d.shieldJcm2, rangeM);
/** Seconds of unbroken beam to go from full shield to disabled. The number a player actually feels. */
export const dwellToDisableS = (b: BeamSpec, d: Defences, rangeM: number): number => withLock(b, d.shieldJcm2 + d.hullJcm2, rangeM);

/** Seconds of held beam to deliver this much fluence, ramp included. */
function withLock(b: BeamSpec, needJcm2: number, rangeM: number): number {
  const e = irradianceWcm2(b, rangeM);
  if (e <= 0) return Infinity;
  const duringRamp = e * b.lockS / 2;                       // the triangle under the ramp
  return needJcm2 <= duringRamp
    ? b.lockS * Math.sqrt(Math.max(0, needJcm2) / Math.max(1e-12, duringRamp))
    : b.lockS + (needJcm2 - duringRamp) / e;
}

// ── HOLDING IT ───────────────────────────────────────────────────────────────────────────────────

/**
 * One tick of the engagement. `onTarget` is whether the beam is actually on it THIS instant — the caller
 * decides that from the gimbal cone and line of sight, because those already exist and this module does
 * not re-derive them.
 *
 * Off target, two things happen and they are the reason the game is about holding: the dwell resets, and
 * once the quiet period has passed the shield comes back. A player who flicks between targets achieves
 * nothing at all; a player who holds one wins. That is the Independence Day beam and the Battle House
 * sensor in the same rule.
 *
 * ALREADY DISABLED IS ALREADY DISABLED. A beam on an aircraft that is on its way down does nothing. There
 * is no way in this function to make a descent worse, which is the point of the whole safety framing.
 */
export function applyBeam(
  s: DamageState, b: BeamSpec, d: Defences,
  { rangeM, dtS, onTarget, tMs }: { rangeM: number; dtS: number; onTarget: boolean; tMs: number },
): DamageState {
  const dt = Math.max(0, Math.min(0.25, dtS));
  if (s.condition === "disabled" || s.condition === "descending" || s.condition === "grounded") return s;

  if (!onTarget) {
    const quietS = s.quietS + dt;
    const regen = quietS >= d.shieldRegenDelayS ? d.shieldRegenJcm2PerS * dt : 0;
    const shield = Math.min(d.shieldJcm2, s.shield + regen);
    const hull = Math.max(0, s.hull - d.hullCoolJcm2PerS * dt);
    return {
      ...s, shield, hull, dwellS: 0, quietS,
      condition: shield > 0 ? "flying" : "shieldDown",
    };
  }

  // The lock ramp is integrated across the tick rather than sampled at one end, so the answer does not
  // depend on how finely the caller ticks. Same seconds held, same energy, at any dt.
  const f0 = lockFraction(b, s.dwellS), f1 = lockFraction(b, s.dwellS + dt);
  const delivered = irradianceWcm2(b, rangeM) * dt * ((f0 + f1) / 2);   // J/cm² this tick
  let shield = s.shield, hull = s.hull;
  // The shield takes it first, and only what is left over reaches the airframe. A tick never spends more
  // than it delivered: the overflow is computed, not approximated.
  const intoShield = Math.min(shield, delivered);
  shield -= intoShield;
  hull += delivered - intoShield;

  const disabled = hull >= d.hullJcm2;
  return {
    ...s,
    shield, hull: Math.min(hull, d.hullJcm2),
    dwellS: s.dwellS + dt, quietS: 0,
    condition: disabled ? "disabled" : shield > 0 ? "flying" : "shieldDown",
    disabledAtMs: disabled ? (s.disabledAtMs ?? tMs) : s.disabledAtMs,
  };
}

// ── BRINGING IT DOWN SAFELY ──────────────────────────────────────────────────────────────────────

/**
 * How fast a disabled aircraft descends, metres per second. Slow on purpose: the operator asked for it to
 * come down SAFELY, and the physical end of this programme is a real machine over a real floor with real
 * people on it. A disabled aircraft is under control the whole way down; it does not fall.
 */
export const DESCENT_MS = 1.6;
/** Below this it is on the ground and the descent is over. */
export const TOUCHDOWN_AGL_M = 0.3;

/** One tick of the way down. The only thing that can change a disabled aircraft's state. */
export function stepDescent(s: DamageState, dtS: number): DamageState {
  if (s.condition !== "disabled" && s.condition !== "descending") return s;
  const dt = Math.max(0, Math.min(0.25, dtS));
  const aglM = Math.max(0, s.aglM - DESCENT_MS * dt);
  return { ...s, aglM, condition: aglM <= TOUCHDOWN_AGL_M ? "grounded" : "descending" };
}

/** How long this aircraft still needs to reach the ground, seconds — so a round can wait for it. */
export const secondsToGround = (s: DamageState): number =>
  s.condition === "grounded" ? 0 : Math.max(0, (s.aglM - TOUCHDOWN_AGL_M) / DESCENT_MS);

// ── WHAT IT LOOKS LIKE ───────────────────────────────────────────────────────────────────────────

/**
 * THE LIGHTING, INSIDE THE VECTOR LAW. No glow, no gradient, no bloom — those are forbidden on this
 * surface. What a stroke CAN do is change which of the thirteen it is and how heavy it is, and that is
 * enough to read an engagement at a glance:
 *
 *   tracking     the beam is on it and the shield is holding      emerald, hairline
 *   absorbing    the shield is being spent                        orange, normal
 *   shieldDown   the shield has failed — the flare moment         gold, bold
 *   burning      heat is going into the airframe                  red, bold
 *   descending   disabled, under control, on its way down         infrared, hairline
 *   grounded     down and safe                                    white, hairline
 */
export type BeamStage = "idle" | "tracking" | "absorbing" | "shieldDown" | "burning" | "descending" | "grounded";

export function beamStage(s: DamageState, onTarget: boolean): BeamStage {
  if (s.condition === "grounded") return "grounded";
  if (s.condition === "disabled" || s.condition === "descending") return "descending";
  if (!onTarget) return "idle";
  if (s.hull > 0) return "burning";
  if (s.condition === "shieldDown") return "shieldDown";
  if (s.dwellS > 0) return "absorbing";
  return "tracking";
}

/** Semantic palette role per stage. Names roles, never hexes — the palette owns the colours. */
export const STAGE_ROLE = {
  idle: "frustum", tracking: "frustum", absorbing: "pending", shieldDown: "tagged",
  burning: "ray", descending: "blocked", grounded: "hud",
} as const;

/** Stroke weight per stage, from the vector law's own ladder. The pulse IS the effect. */
export const STAGE_WEIGHT = {
  idle: "hairline", tracking: "hairline", absorbing: "normal", shieldDown: "bold",
  burning: "bold", descending: "hairline", grounded: "hairline",
} as const;

/**
 * The shield ring's radius, as a fraction of the aircraft's span — drawn as a declared n-gon like every
 * other curve on this surface. It shrinks as the shield is spent, so a player reads the state from the
 * SHAPE rather than from a number, which is what makes it legible at forty-two aircraft.
 */
export const shieldRingFrac = (s: DamageState, d: Defences): number =>
  d.shieldJcm2 > 0 ? 0.6 + 0.6 * Math.max(0, Math.min(1, s.shield / d.shieldJcm2)) : 0;

// ── WHAT A PERSON READS ──────────────────────────────────────────────────────────────────────────

/** One line, in plain words, about one target. No unit a player has to convert in their head. */
export function engagementLine(s: DamageState, b: BeamSpec, d: Defences, rangeM: number): string {
  if (s.condition === "grounded") return "down and safe";
  if (s.condition === "disabled" || s.condition === "descending") return `coming down · ${s.aglM.toFixed(0)} m`;
  if (rangeM > b.maxRangeM) return `out of reach · ${rangeM.toFixed(0)} m`;
  const left = s.condition === "shieldDown"
    ? (d.hullJcm2 - s.hull) / Math.max(1e-9, irradianceWcm2(b, rangeM))
    : dwellToDisableS(b, d, rangeM) - s.dwellS;
  const pct = Math.round((s.shield / d.shieldJcm2) * 100);
  return `${s.condition === "shieldDown" ? "shield down" : `shield ${pct}%`} · hold ${Math.max(0, left).toFixed(1)}s`;
}

/** The whole side's state in one phrase, for the round strip. */
export const downedCount = (all: readonly DamageState[]): number =>
  all.filter((s) => s.condition === "disabled" || s.condition === "descending" || s.condition === "grounded").length;

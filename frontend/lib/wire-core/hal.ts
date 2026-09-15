// THE HAL — what the MACHINE is, as opposed to what the picture asks for (lib/wire-core/mot-ladder.ts).
//
// Vision • 2525 § XI: the robot, or the operator, picks the compute. Three declared classes plus AUTO, which
// lets the unit choose its own class from what it actually measures rather than from what it was told.
//
// THE RULE THAT DOES NOT BEND: the sensor is paid FIRST. The CNN reserve comes out of the frame budget
// before the renderer may want a single millisecond of it. A prettier picture is never bought with a
// blinder sensor.
//
// Pure: no clock, no DOM. `pickHal` takes a measurement as an argument; it never takes one itself.
export type HalId = "pi" | "edge" | "accel";
export type HalChoice = HalId | "auto";

export interface HalProfile {
  id: HalId;
  label: string;
  /** Milliseconds per frame this class has, in total, for sensing AND drawing. */
  frameBudgetMs: number;
  /** What the edge sensor stack costs on this class at band 1. Higher bands scale it (see halCnnMs). */
  cnnMs: number;
  /** Plain words for a person: what this class of machine is. */
  about: string;
}

export const HAL_PROFILES: Record<HalId, HalProfile> = {
  pi:    { id: "pi",    label: "PI-CLASS",    frameBudgetMs: 66, cnnMs: 18, about: "a single-board computer doing its own edge extraction" },
  edge:  { id: "edge",  label: "EDGE-SOC",    frameBudgetMs: 33, cnnMs: 12, about: "an embedded system-on-chip with a small vision block" },
  accel: { id: "accel", label: "ACCELERATOR", frameBudgetMs: 16, cnnMs:  8, about: "a dedicated neural accelerator alongside the processor" },
};
export const HAL_ORDER: HalId[] = ["pi", "edge", "accel"];

/**
 * AUTO. The unit reads its own sustained frame rate and says which class it belongs to. The thresholds are
 * the frame budgets themselves turned back into frame rates, so the boundary is not a taste value:
 * a machine holding fewer than 1000/66 ≈ 15 fps is Pi-class; one holding 1000/16 ≈ 60 fps is accelerator-class.
 */
export function pickHal(measuredFps: number): HalProfile {
  if (!Number.isFinite(measuredFps) || measuredFps <= 0) return HAL_PROFILES.edge;   // unknown: the middle
  if (measuredFps < 1000 / HAL_PROFILES.pi.frameBudgetMs + 3) return HAL_PROFILES.pi;
  if (measuredFps >= 1000 / HAL_PROFILES.accel.frameBudgetMs) return HAL_PROFILES.accel;
  return HAL_PROFILES.edge;
}
export const resolveHal = (choice: HalChoice, measuredFps: number): HalProfile =>
  choice === "auto" ? pickHal(measuredFps) : HAL_PROFILES[choice];

/** What the sensor stack costs on THIS machine at THIS rung: the rung's demand, scaled by the class. */
export function halCnnMs(hal: HalProfile, rungCnnMs: number): number {
  const scale = hal.cnnMs / HAL_PROFILES.pi.cnnMs;      // Pi is the reference the rungs are written against
  return Math.round(rungCnnMs * scale * 10) / 10;
}

/** Milliseconds left for DRAWING, after the sensor has been paid. Negative means the rung does not fit. */
export const renderHeadroomMs = (hal: HalProfile, rungCnnMs: number, measuredFrameMs: number): number =>
  hal.frameBudgetMs - halCnnMs(hal, rungCnnMs) - measuredFrameMs;

/** Can this machine sense at this rung at all, before any question of drawing? */
export const sensorFits = (hal: HalProfile, rungCnnMs: number): boolean =>
  halCnnMs(hal, rungCnnMs) < hal.frameBudgetMs;

export const halLabel = (hal: HalProfile, choice: HalChoice): string =>
  `${choice === "auto" ? "AUTO → " : ""}${hal.label} · ${hal.frameBudgetMs}ms frame · cnn ${hal.cnnMs}ms`;

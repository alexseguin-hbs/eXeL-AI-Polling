// CALIBRATION — the only place demand (the MoT rung) and capability (the HAL) are allowed to meet.
//
// Operator 2026-09-15: "Ultimately this will be used to test new compute and sensor for self test of edge
// compute and edge sensor for robotics and complex systems with a self calibration goal of 6 - 15 minutes
// in first release."
//
// TWO THINGS LIVE HERE, and they are different:
//
//  1. THE LIVE LOOP  (`calStep`) — a unit already running holds the reference stream if it can, and when it
//     cannot it degrades in a declared order and SAYS SO. Order matters and is not arbitrary: a sensor the
//     unit can live without goes before a pixel, and a pixel goes before a frame.
//         hold 1080p30 → shed a sensor (CHEM → MAG → ACOUSTIC → IR, never EO) → drop resolution → drop Hz
//     Climbing back needs sustained headroom, so the picture cannot oscillate.
//
//  2. THE SELF-TEST  (`planSelfCal` / `calSweepStep`) — a cold machine walks the ladder from 1.1 upward and
//     reports the highest rung it can hold at the reference stream. That is the answer the operator wants
//     from a new board or a new sensor: not "it works", but "this is the rung it holds".
//
// Pure: every function takes its measurements as arguments. Nothing here reads a clock or a device.
import { MOT_LEVELS, motSpec, motStep, motAtMost, motIndex, SENSOR_LADDER, type MotLevel, type SensorModule } from "./mot-ladder";
import { HAL_PROFILES, halCnnMs, renderHeadroomMs, sensorFits, type HalProfile } from "./hal";
import { STREAMS, streamAt, isReference, type StreamSpec } from "./stream";

// ── 1 · THE LIVE LOOP ────────────────────────────────────────────────────────────────────────────────
export const HOLD_TICKS_TO_CLIMB = 3;     // three consecutive readings of headroom before asking for more
/**
 * How much spare a machine must show before it may ask for more, as a FRACTION of its own frame budget.
 * A fixed millisecond threshold does not work across these classes: 8 ms is a rounding error on a 66 ms
 * Pi frame and half the whole budget on a 16 ms accelerator frame, so an accelerator could never climb.
 * A fraction is scale-free, which is the only way one rule can serve three very different machines.
 */
export const CLIMB_HEADROOM_FRACTION = 0.15;
export const climbThresholdMs = (hal: HalProfile): number => hal.frameBudgetMs * CLIMB_HEADROOM_FRACTION;

export interface CalState {
  level: MotLevel;          // what is being asked for
  cap: MotLevel;            // the ceiling a person set; calibration may go below it, never above
  streamIdx: number;        // which rung of the stream ladder is live
  sensors: SensorModule[];  // which modules are live right now (a subset of the rung's demand)
  held: number;             // consecutive readings with headroom
  reason: string;           // why the last change happened, in words a person can read (English; logs, exports, tests)
  /**
   * The same reason as a lexicon key and its arguments, so a screen can say it in the reader's language
   * (drone.cal.<k>, filled with {a} {b}). Appended beside `reason`, never instead of it: the English stays
   * the record; this is what the HUD renders. Every branch below sets both, and the gate counts them.
   */
  why: { k: CalReasonKey; a?: string; b?: string };
}

export type CalReasonKey =
  | "cold_start" | "no_measurement" | "shed" | "stream_down" | "level_down" | "floor"
  | "headroom" | "stream_up" | "sensor_on" | "level_up" | "ceiling" | "holding";

export const initCal = (level: MotLevel = "1.1", cap: MotLevel = "5.5"): CalState =>
  ({ level: motAtMost(level, cap), cap, streamIdx: 0, sensors: [...motSpec(motAtMost(level, cap)).sensors], held: 0, reason: "cold start", why: { k: "cold_start" } });

export interface CalReading { hal: HalProfile; frameMs: number }
export interface CalResult { state: CalState; changed: boolean }

/** One reading in, one decision out. Degrade immediately; climb only on sustained headroom. */
export function calStep(s: CalState, r: CalReading): CalResult {
  const spec = motSpec(s.level);
  const head = renderHeadroomMs(r.hal, spec.cnnMs, r.frameMs);
  const keep = (reason: string, why: CalState["why"], held = s.held): CalResult => ({ state: { ...s, held, reason, why }, changed: false });

  if (!Number.isFinite(r.frameMs) || r.frameMs < 0) return keep("no measurement", { k: "no_measurement" });

  if (head < 0) {
    // (a) shed a module the unit can live without — never EO, which is what seeing IS.
    if (s.sensors.length > 1) {
      const dropped = s.sensors[s.sensors.length - 1];
      const sensors = s.sensors.slice(0, -1);
      const reason = `over budget by ${(-head).toFixed(1)}ms — ${dropped} shed`;
      return { state: { ...s, sensors, held: 0, reason, why: { k: "shed", a: (-head).toFixed(1), b: dropped } }, changed: true };
    }
    // (b) then a pixel.
    if (s.streamIdx < STREAMS.length - 1) {
      const next = s.streamIdx + 1;
      const reason = `over budget — stream down to ${streamAt(next).id}`;
      return { state: { ...s, streamIdx: next, held: 0, reason, why: { k: "stream_down", a: streamAt(next).id } }, changed: true };
    }
    // (c) then, only then, ask for less picture.
    const down = motStep(s.level, -1);
    if (down !== s.level) {
      return { state: { ...s, level: down, sensors: [...motSpec(down).sensors], streamIdx: 0, held: 0, reason: `over budget at the floor stream — down to MoT ${down}`, why: { k: "level_down", a: down } }, changed: true };
    }
    return keep(`over budget and already at ${s.level} on ${streamAt(s.streamIdx).id}`, { k: "floor", a: s.level, b: streamAt(s.streamIdx).id }, 0);
  }

  if (head > climbThresholdMs(r.hal)) {
    const held = s.held + 1;
    if (held < HOLD_TICKS_TO_CLIMB) return keep(`headroom ${head.toFixed(1)}ms, ${held} of ${HOLD_TICKS_TO_CLIMB}`, { k: "headroom", a: head.toFixed(1), b: `${held} of ${HOLD_TICKS_TO_CLIMB}` }, held);
    // Climb back in the reverse order it fell: pixels first, then modules, then the rung itself.
    if (!isReference(s.streamIdx)) {
      const next = s.streamIdx - 1;
      return { state: { ...s, streamIdx: next, held: 0, reason: `headroom held — stream up to ${streamAt(next).id}`, why: { k: "stream_up", a: streamAt(next).id } }, changed: true };
    }
    if (s.sensors.length < spec.sensors.length) {
      const add = spec.sensors[s.sensors.length];
      return { state: { ...s, sensors: [...s.sensors, add], held: 0, reason: `headroom held — ${add} back on`, why: { k: "sensor_on", a: add } }, changed: true };
    }
    const up = motStep(s.level, +1);
    if (up !== s.level && motIndex(up) <= motIndex(s.cap) && sensorFits(r.hal, motSpec(up).cnnMs)) {
      return { state: { ...s, level: up, sensors: [...motSpec(up).sensors], held: 0, reason: `headroom held — up to MoT ${up}`, why: { k: "level_up", a: up } }, changed: true };
    }
    return keep(`at the ceiling ${s.cap}`, { k: "ceiling", a: s.cap }, 0);
  }

  return keep(`holding ${s.level} on ${streamAt(s.streamIdx).id}`, { k: "holding", a: s.level, b: streamAt(s.streamIdx).id }, 0);
}

/** What the DATA panel shows: stream, HAL, sensors, and the last decision. */
export const calLine = (s: CalState, hal: HalProfile): string =>
  `${streamAt(s.streamIdx).id} · ${hal.label} · ${s.sensors.join("·")} · ${s.reason}`;
/** The same line with the reason left to the caller to translate: everything but the words. */
export const calLinePrefix = (s: CalState, hal: HalProfile): string =>
  `${streamAt(s.streamIdx).id} · ${hal.label} · ${s.sensors.join("·")} · `;

// ── 2 · THE SELF-TEST ────────────────────────────────────────────────────────────────────────────────
// The operator's budget is 6 to 15 minutes. That is not decoration: it is what makes the dwell time a
// derived number rather than a guess. 25 rungs into 6 minutes is 14.4 s each; into 15 minutes, 36 s each.
export const SELF_CAL_MIN_MINUTES = 6;
export const SELF_CAL_MAX_MINUTES = 15;
/** Below this a reading is a peak, not a sustained rate, so the answer would not mean anything. */
export const MIN_DWELL_S = 12;
export const MAX_DWELL_S = 36;
/** Two consecutive failures end the sweep: a ladder that failed here cannot pass higher up. */
export const FAIL_STREAK_TO_STOP = 2;

export interface SelfCalPlan {
  rungs: MotLevel[];
  dwellS: number;
  budgetMinutes: number;
  worstCaseMinutes: number;
  note: string;
}

/** Fit the sweep to the budget, and refuse a budget that cannot hold a sustained reading per rung. */
export function planSelfCal(budgetMinutes: number, rungs: MotLevel[] = MOT_LEVELS): SelfCalPlan {
  const b = Math.max(SELF_CAL_MIN_MINUTES, Math.min(SELF_CAL_MAX_MINUTES, budgetMinutes));
  const raw = (b * 60) / rungs.length;
  const dwellS = Math.max(MIN_DWELL_S, Math.min(MAX_DWELL_S, Math.round(raw)));
  const worstCaseMinutes = Math.round(((dwellS * rungs.length) / 60) * 10) / 10;
  return {
    rungs, dwellS, budgetMinutes: b, worstCaseMinutes,
    note: `${rungs.length} rungs × ${dwellS}s = ${worstCaseMinutes} min if every rung is tried; the sweep stops early once ${FAIL_STREAK_TO_STOP} rungs in a row fail.`,
  };
}

export interface RungResult {
  level: MotLevel;
  measuredFps: number;
  frameMs: number;
  headroomMs: number;
  /** A rung PASSES when the machine holds the reference stream with the sensor already paid for. */
  pass: boolean;
  why: string;
}

/** Judge one rung from one sustained measurement. The reference stream is the bar, not a nicer number. */
export function judgeRung(level: MotLevel, hal: HalProfile, measuredFps: number, stream: StreamSpec = STREAMS[0]): RungResult {
  const spec = motSpec(level);
  const frameMs = measuredFps > 0 ? 1000 / measuredFps : Infinity;
  const headroomMs = renderHeadroomMs(hal, spec.cnnMs, Number.isFinite(frameMs) ? frameMs : hal.frameBudgetMs * 2);
  if (!sensorFits(hal, spec.cnnMs)) {
    return { level, measuredFps, frameMs, headroomMs, pass: false, why: `the sensor alone needs ${halCnnMs(hal, spec.cnnMs)}ms of a ${hal.frameBudgetMs}ms frame` };
  }
  const holdsStream = measuredFps >= stream.hz;
  const pass = holdsStream && headroomMs >= 0;
  return {
    level, measuredFps, frameMs, headroomMs, pass,
    why: pass
      ? `holds ${stream.id} with ${headroomMs.toFixed(1)}ms to spare`
      : !holdsStream
        ? `${measuredFps.toFixed(0)} fps is under the ${stream.hz} Hz reference`
        : `over the ${hal.frameBudgetMs}ms frame budget by ${(-headroomMs).toFixed(1)}ms`,
  };
}

export interface SweepState { idx: number; results: RungResult[]; failStreak: number; done: boolean }
export const initSweep = (): SweepState => ({ idx: 0, results: [], failStreak: 0, done: false });

/** Fold one rung's measurement into the sweep. Pure — the caller owns the clock and the measuring. */
export function calSweepStep(sw: SweepState, plan: SelfCalPlan, hal: HalProfile, measuredFps: number): SweepState {
  if (sw.done || sw.idx >= plan.rungs.length) return { ...sw, done: true };
  const r = judgeRung(plan.rungs[sw.idx], hal, measuredFps);
  const failStreak = r.pass ? 0 : sw.failStreak + 1;
  const idx = sw.idx + 1;
  return { idx, results: [...sw.results, r], failStreak, done: idx >= plan.rungs.length || failStreak >= FAIL_STREAK_TO_STOP };
}

export interface SelfCalReport {
  ceiling: MotLevel | null;      // the highest rung this machine HELD — null if it held none
  tried: number;
  passed: number;
  hal: string;
  stream: string;
  sensorsAtCeiling: SensorModule[];
  elapsedS: number;
  results: RungResult[];
  headline: string;
  headlineKey: { k: "holds"; a: string; b: string; c: string } | { k: "held_none"; a: string; b: string };
}

/** The answer, in one sentence a person can act on. */
export function selfCalReport(sw: SweepState, plan: SelfCalPlan, hal: HalProfile): SelfCalReport {
  const passed = sw.results.filter((r) => r.pass);
  const ceiling = passed.length ? passed[passed.length - 1].level : null;
  const sensorsAtCeiling = ceiling ? motSpec(ceiling).sensors : [];
  const elapsedS = sw.results.length * plan.dwellS;
  return {
    ceiling, tried: sw.results.length, passed: passed.length,
    hal: hal.label, stream: STREAMS[0].id, sensorsAtCeiling, elapsedS, results: sw.results,
    headline: ceiling
      ? `This machine holds MoT ${ceiling} at ${STREAMS[0].id} with ${sensorsAtCeiling.join(", ")} running.`
      : `This machine held no rung at ${STREAMS[0].id}. The lowest rung tried was ${plan.rungs[0]}.`,
    // The headline as a lexicon key + args (drone.selfcal.holds / held_none), beside the English, for the screen.
    headlineKey: ceiling
      ? { k: "holds" as const, a: String(ceiling), b: STREAMS[0].id, c: sensorsAtCeiling.join(", ") }
      : { k: "held_none" as const, a: STREAMS[0].id, b: String(plan.rungs[0]) },
  };
}

export { HAL_PROFILES, SENSOR_LADDER };

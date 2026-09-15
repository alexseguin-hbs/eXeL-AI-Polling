"use client";
// THE SELF-TEST, ON A REAL MACHINE — the impure half of lib/wire-core/calibrate.ts.
//
// Everything that decides anything is pure and lives in calibrate.ts. This file owns only the two things
// that cannot be: the clock, and counting the frames a browser actually painted. It is the same sustained
// measurement the Security-2525 speed test already uses (components/security-2525/fps-governor.ts
// runSpeedTest) — counted frames over a real interval, never a peak — so a Drone-2525 answer and a
// Security-2525 answer are comparable rather than merely similar.
//
// Operator 2026-09-15: "this will be used to test new compute and sensor for self test of edge compute and
// edge sensor for robotics and complex systems with a self calibration goal of 6 - 15 minutes."
import {
  planSelfCal, initSweep, calSweepStep, selfCalReport,
  type SelfCalPlan, type SelfCalReport, type SweepState,
} from "./calibrate";
import { resolveHal, type HalChoice, type HalProfile } from "./hal";
import { motSpec, type MotLevel } from "./mot-ladder";

/** What the caller must provide: a way to actually DRAW at a rung, so the measurement means something. */
export interface RungLoad {
  /** Called once per animation frame while a rung is under test. Do the rung's real work here. */
  paint: (level: MotLevel) => void;
}

export interface SelfCalProgress {
  rung: number;
  total: number;
  level: MotLevel;
  measuredFps: number | null;
  elapsedS: number;
  remainingS: number;
  line: string;
}

export interface SelfCalOptions {
  budgetMinutes?: number;
  hal?: HalChoice;
  onProgress?: (p: SelfCalProgress) => void;
  /** Cooperative cancel — an operator can stop a 15-minute run without killing the page. */
  signal?: { aborted: boolean };
  /** Tests inject a fake clock and a fake frame source; the browser supplies the real ones. */
  now?: () => number;
  raf?: (cb: (t: number) => void) => number;
}

/** Count frames actually painted over `ms`, painting the rung's real load each time. Sustained, not peak. */
function measureRung(level: MotLevel, ms: number, load: RungLoad, o: Required<Pick<SelfCalOptions, "now" | "raf">>): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const start = o.now();
    const tick = () => {
      load.paint(level);
      frames++;
      const t = o.now();
      if (t - start >= ms) { resolve(Math.round((frames * 1000) / Math.max(1, t - start))); return; }
      o.raf(tick);
    };
    o.raf(tick);
  });
}

/**
 * Walk the ladder from 1.1 upward, measuring each rung under real load, and report the highest rung this
 * machine HELD at the reference stream. Stops early once the ladder has clearly been exceeded — a rung that
 * failed cannot be rescued by a harder one, so continuing would spend the operator's minutes on a
 * foregone conclusion.
 */
export async function runSelfCal(load: RungLoad, opts: SelfCalOptions = {}): Promise<SelfCalReport> {
  const now = opts.now ?? (() => performance.now());
  const raf = opts.raf ?? ((cb) => requestAnimationFrame(cb));
  const plan: SelfCalPlan = planSelfCal(opts.budgetMinutes ?? 8);

  // The HAL class is measured before the sweep, on the cheapest rung, so AUTO is decided by this machine
  // rather than by a label someone typed.
  const probeFps = await measureRung("1.1", 1500, load, { now, raf });
  const hal: HalProfile = resolveHal(opts.hal ?? "auto", probeFps);

  let sw: SweepState = initSweep();
  const t0 = now();
  while (!sw.done && !opts.signal?.aborted) {
    const level = plan.rungs[sw.idx];
    opts.onProgress?.({
      rung: sw.idx + 1, total: plan.rungs.length, level, measuredFps: null,
      elapsedS: Math.round((now() - t0) / 1000),
      remainingS: (plan.rungs.length - sw.idx) * plan.dwellS,
      line: `measuring MoT ${level} · ${motSpec(level).sensors.join("·")}`,
    });
    const fps = await measureRung(level, plan.dwellS * 1000, load, { now, raf });
    sw = calSweepStep(sw, plan, hal, fps);
    const last = sw.results[sw.results.length - 1];
    opts.onProgress?.({
      rung: sw.idx, total: plan.rungs.length, level, measuredFps: fps,
      elapsedS: Math.round((now() - t0) / 1000),
      remainingS: (plan.rungs.length - sw.idx) * plan.dwellS,
      line: `MoT ${level} · ${fps} fps · ${last.pass ? "held" : "failed"} · ${last.why}`,
    });
  }
  return selfCalReport(sw, plan, hal);
}

/** The report as a file a person can keep, in the shape the exporter already speaks. */
export const selfCalPack = (r: SelfCalReport, meta: { version: string; revision: string; modelHash: string }) => ({
  format: "VISION-2525-SELFCAL-1",
  ...meta,
  machine: r.hal,
  reference: r.stream,
  ceiling: r.ceiling,
  sensorsAtCeiling: r.sensorsAtCeiling,
  tried: r.tried,
  passed: r.passed,
  elapsedS: r.elapsedS,
  headline: r.headline,
  rungs: r.results.map((x) => ({ level: x.level, fps: x.measuredFps, headroomMs: Math.round(x.headroomMs * 10) / 10, pass: x.pass, why: x.why })),
});

"use client";

// THE ROUND'S TWO CLOCKS AND ITS FLYING, lifted out of the component that was doing everything.
//
// TWO CLOCKS, DELIBERATELY. The gimbal slews on every animation frame, because a camera that steps ten
// times a second looks broken. Everything else — target states, the score, the tally, every heads-up
// number, and the forty-two aircraft — reads the GAME clock at ten times a second, and nothing in that
// list is worth sixty React renders a second. Measured on the built site, splitting them cut renders in
// the round by about six times and changed nothing a person can see.
//
// The flight loop is separate again, and runs ONLY on the device holding the pilot's seat. A device that
// does not hold it advances nothing and shows what the pilot sends; the two-device run found the phone
// simulating its own flight and fighting the pilot's, which is why that guard is here and not a comment.
import { useCallback, useEffect, useRef, useState } from "react";
import { slew, type GimbalSpec, type GimbalState } from "./gimbal";
import { stepFlight, takeoffInput, LOITER_AGL_M, type Airframe, type Battery, type FlightState } from "./flight";
import { autoPilot } from "./ai-crew";
import { stepSwarm, type Swarm } from "./swarm";

/** How often the game clock is published to React. The gimbal still slews every frame. */
export const GAME_TICK_MS = 100;

export interface RoundClockOpts {
  running: boolean;
  flying: boolean;
  /** True only on the device that holds the pilot's seat. */
  iFly: boolean;
  /** "AI" hands the flying to a declared pattern rather than to the sticks. */
  pilotIsMachine: boolean;
  engagement: boolean;
  spec: GimbalSpec;
  airframe: Airframe;
  battery: Battery;
  swarm: React.MutableRefObject<Swarm>;
  /** Live stick positions, read from a ref so the loop never re-subscribes. */
  stick: React.MutableRefObject<{ fwd: number; lat: number; climb: number; yaw: number }>;
  setGim: React.Dispatch<React.SetStateAction<GimbalState>>;
  setFlight: React.Dispatch<React.SetStateAction<FlightState>>;
}

export interface RoundClock {
  tMs: number;
  tMsRef: React.MutableRefObject<number>;
  swarmTick: number;
  climbing: boolean;
  setClimbing: (v: boolean) => void;
  resetClock: () => void;
}

export function useRoundClock(o: RoundClockOpts, flight: FlightState): RoundClock {
  const [tMs, setTMs] = useState(0);
  const tMsRef = useRef(0);
  const [swarmTick, setSwarmTick] = useState(0);
  const [climbing, setClimbing] = useState(false);
  const climbingRef = useRef(false);
  useEffect(() => { climbingRef.current = climbing; }, [climbing]);

  // The two clocks.
  useEffect(() => {
    if (!o.running) return;
    let raf = 0, last = performance.now(), published = tMsRef.current;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      tMsRef.current += dt * 1000;
      o.setGim((g) => slew(g, o.spec, dt));                   // smooth, every frame
      if (tMsRef.current - published >= GAME_TICK_MS) {       // coarse, ten times a second
        const step = (tMsRef.current - published) / 1000;
        published = tMsRef.current;
        if (o.engagement) { stepSwarm(o.swarm.current, step); setSwarmTick((v) => v + 1); }
        setTMs(tMsRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.running, o.engagement]);

  // The flying, on the pilot's device only.
  useEffect(() => {
    if (!o.running || !o.flying || !o.iFly) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (o.pilotIsMachine) {
        const p = autoPilot(tMsRef.current / 1000);
        o.setFlight((f) => ({ ...f, e: p.e, n: p.n, aglM: p.aglM, headingDeg: p.headingDeg, mode: "wing", refused: "" }));
      } else {
        const k = o.stick.current;
        o.setFlight((f) => {
          // A take-off is a commanded climb through the same physics as a stick, not a teleport: the
          // aircraft really flies up and really spends the energy. Whether it is still climbing is read
          // from a ref — listing it as a dependency tore this loop down mid-climb, which is why the
          // aircraft used to stall at 8 m of a 45 m climb.
          const lift = climbingRef.current ? takeoffInput(f) : null;
          return stepFlight(o.airframe, o.battery, f,
            { climb: lift && !lift.done ? lift.climb : k.climb, forward: k.fwd, lateral: k.lat, yaw: k.yaw }, dt);
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.running, o.flying, o.iFly, o.pilotIsMachine]);

  // The climb ends when the aircraft has ARRIVED, judged from the height it reached — not decided inside
  // another component's state updater, where React is free to run it more than once.
  useEffect(() => {
    if (climbing && flight.aglM >= LOITER_AGL_M - 1) setClimbing(false);
  }, [climbing, flight.aglM]);

  // STABLE, because callers put it in dependency arrays. Returned as a fresh function each render it made
  // the round's reset effect fire on every render, which stopped the round before it could run and took
  // the crew link down with it — the two-device gate caught that within a minute of the split.
  const resetClock = useCallback(() => {
    tMsRef.current = 0; setTMs(0); setSwarmTick(0); setClimbing(false);
  }, []);
  return { tMs, tMsRef, swarmTick, climbing, setClimbing, resetClock };
}

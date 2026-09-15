"use client";

// THE STATIONARY ROUND — the operator's items 1 and 2: "Security Turrets" and "Security Capital", pop-up
// door targets that do not move or fly. One gimbal on a fixed mount, aimed at a door; capture it, then
// shoot it. The same gimbal record and the same slew law will drive the airframe in Pass 1b — this surface
// is how that design gets tested faster, standing still, exactly as the operator asked.
//
// Everything a person reads here is a t() key. Everything drawn is one of the 13, edges only, in the
// arena's OWN camera — there is no second projection and no second world.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { VECTOR_LAW, strokeProps } from "@/lib/wire-core/vector-law";
import { sceneProject } from "@/lib/wire-core/scene-project";
import { canonicalHash } from "@/lib/wire-core/wire-model";
import { DRONE_DOMAIN } from "@/lib/drone-2525/domain.gen";
import {
  initGimbal, command, slew, onTarget, eyeOf, aimAt, inFrame, aimReadout, turretMount, airframeMount, shortestTurn,
  type GimbalState, type Mount,
} from "@/lib/drone-2525/gimbal";
import { lineOfSight, losReason, type Prism } from "@/lib/drone-2525/los";
import { buildSchedule, targetsAt, roundLengthMs, targetRole, type TargetView } from "@/lib/drone-2525/targets";
import { initGame, capture, shoot, endRound, score, transcript, type GameState } from "@/lib/drone-2525/game";
import { buildArena } from "@/lib/drone-2525/arena-model";
import {
  initFlight, stepFlight, canTransition, flightLine, airspeedOf, minutesLeft, stallSpeedMs,
  takeoffInput, LOITER_AGL_M, type FlightState,
} from "@/lib/drone-2525/flight";
import {
  CREWS, shotNeedsApproval, autoPilot, autoTargeteer, initApproval, requestShot, resolveRequest,
  mayFire, approvalPrompt, type CrewId,
} from "@/lib/drone-2525/ai-crew";
import { initSi, openCall, recogniseAdopted, openCallOf, tally } from "@/lib/drone-2525/si-pod";
import { initLink, seatUrl, seatFromParams, linkLine, linkUp, type Seat } from "@/lib/drone-2525/link";
import { useDroneLink } from "@/lib/drone-2525/use-drone-link";
import { CrewSeatPanel } from "./crew-seat-panel";
import { SiPanel } from "./si-panel";
import { ArenaView, type ArenaCtx } from "./arena-view";
import type { MotLevel } from "@/lib/wire-core/mot-ladder";
import type { HalChoice } from "@/lib/wire-core/hal";

export type RoundMode = "turrets" | "capital" | "drone" | "multi";
const SPEC = DRONE_DOMAIN.gimbal as unknown as Parameters<typeof command>[1];
const AIRFRAME = DRONE_DOMAIN.airframe as unknown as Parameters<typeof stepFlight>[0];
const BATTERY = DRONE_DOMAIN.battery as unknown as Parameters<typeof stepFlight>[1];
const FLYING = (m: RoundMode) => m === "drone" || m === "multi";
/** Who is watching. A machine's shot is held until this person says otherwise, by name. */
const WATCH = "the watch officer";
/** How often the game clock is published to React. The gimbal still slews every frame. */
const GAME_TICK_MS = 100;
const TSPEC = {
  seed: Number(DRONE_DOMAIN.targets.seed), upMs: Number(DRONE_DOMAIN.targets.upMs),
  downMs: Number(DRONE_DOMAIN.targets.downMs), concurrent: Number(DRONE_DOMAIN.targets.concurrent),
};

/**
 * THE ROUND — all four of the operator's modes, on one gimbal.
 *
 *   SECURITY TURRETS   one fixed turret. Most of the block is behind a building from any single mount,
 *                      which is the point: it teaches where a fixed position is blind.
 *   SECURITY CAPITAL   the whole block. The round moves you to whichever turret can reach the next door.
 *   TWO-PERSON DRONE   the same gimbal on a flying airframe. One seat flies, one seat aims. On a single
 *                      screen you hold both, and the seat you are in is always named.
 *   MIXED CREW         a machine takes one seat or both — and a machine that is AIMING must ask a named
 *                      person before any shot. That gate is lib/drone-2525/ai-crew.ts and it has no
 *                      bypass; this component can only ask it, never overrule it.
 *
 * LINK-2525 in one sentence: the mount changes, the gimbal does not.
 */
export function Round({ mode, level, hal }: { mode: RoundMode; level: MotLevel; hal: HalChoice }) {
  const { t } = useLexicon();
  const mounts = useMemo<Mount[]>(() => DRONE_DOMAIN.turrets.map(turretMount), []);
  const [mountIdx, setMountIdx] = useState(0);
  const [crewId, setCrewId] = useState<CrewId>("hi_pilot");
  const [flight, setFlight] = useState<FlightState>(() => initFlight());
  const [approval, setApproval] = useState(initApproval);
  const [askedFor, setAskedFor] = useState<string | null>(null);
  const stick = useRef({ fwd: 0, lat: 0, climb: 0, yaw: 0 });
  const [climbing, setClimbing] = useState(false);
  const [si, setSi] = useState(initSi);

  const crew = mode === "multi" ? CREWS[crewId] : CREWS.two_hi;
  const flying = FLYING(mode);

  // LINK-2525: the SAME gimbal record, bolted to a different thing. Nothing about its behaviour changes.
  const mount = useMemo(
    () => (flying ? airframeMount("vtol-01", "VTOL TRINITY", [flight.e, flight.n], flight.aglM, flight.headingDeg, -12) : mounts[mountIdx]),
    [flying, flight.e, flight.n, flight.aglM, flight.headingDeg, mounts, mountIdx],
  );

  const [gim, setGim] = useState<GimbalState>(() => initGimbal(mount));
  const [game, setGame] = useState<GameState>(() => initGame(0));
  const [tMs, setTMs] = useState(0);
  const tMsRef = useRef(0);
  // WHICH SEAT THIS DEVICE HOLDS. A link opened on the second person's phone puts them straight into the
  // other seat; a device that arrived on its own holds both, which is practice rather than a crew, and the
  // panel says which of the two is happening.
  const joined = useMemo(() => (typeof window === "undefined" ? null : seatFromParams(window.location.search)), []);
  const [crewCode, setCrewCode] = useState(() => joined?.code ?? "");
  const [mySeat, setMySeat] = useState<Seat | null>(() => joined?.seat ?? null);
  const twoDevice = Boolean(crewCode && mySeat);
  const link = useDroneLink(mySeat ?? "pilot", crewCode, tMs, twoDevice);
  const iFly = !twoDevice || mySeat === "pilot";
  const iAim = !twoDevice || mySeat === "targeteer";
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState<string>("");

  // ONE WORLD. The door positions and the terrain come from the footprints, not from the curve budget, so
  // this build agrees with whatever the renderer chose to paint at the current tier — and the HAL gate holds
  // it to that, asserting 14 doors at every tier. Nothing here is a second source of truth.
  const world = useMemo(() => {
    const a = buildArena(DRONE_DOMAIN, { ngonSides: 13, contourStepM: 2, stamp: "game" });
    return { doors: a.doors, ground: a.ground, hash: canonicalHash(a.model) };
  }, []);
  const prisms = useMemo<Prism[]>(() => {
    return DRONE_DOMAIN.buildings.map((b) => {
      const base = world.ground(b.footprint[0][0], b.footprint[0][1]);
      return { id: b.id, footprint: b.footprint, baseU: base, topU: base + b.heightM };
    });
  }, [world]);

  const schedule = useMemo(() => buildSchedule(world.doors, TSPEC), [world]);
  const roundMs = useMemo(() => roundLengthMs(schedule), [schedule]);
  const views = useMemo(() => targetsAt(world.doors, schedule, game.tags, tMs), [world, schedule, game.tags, tMs]);
  const eye = useMemo(() => eyeOf(mount, world.ground), [world, mount]);

  // The target the sensor is actually looking at: up (or already captured) and inside the cone.
  const framed: TargetView | null = useMemo(() => {
    const live = views.filter((v) => v.phase === "up" || v.phase === "captured");
    let best: { v: TargetView; off: number } | null = null;
    for (const v of live) {
      const f = inFrame(eye, gim, SPEC, v.door.at);
      if (!f.inFrame) continue;
      const off = Math.hypot(f.dAz, f.dEl);
      if (!best || off < best.off) best = { v, off };
    }
    return best?.v ?? null;
  }, [views, gim, eye]);

  // A sight line is a hundred-sample march through fourteen building prisms. It depends on WHERE the
  // camera is and WHICH door it is looking at — not on the angle it happens to be at this instant. Keying
  // it on the door id rather than on the framed object stops it recomputing every single frame for a door
  // that has not moved. This was the hot path, and it was entirely wasted work.
  const framedDoorId = framed?.door.id ?? null;
  const los = useMemo(() => {
    if (!framed) return null;
    return lineOfSight(eye, framed.door.at, world.ground, prisms, { ignore: framed.door.buildingId });
    // framed is deliberately not a dependency: framedDoorId is what actually changes the answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eye, framedDoorId, world, prisms]);

  // The clock. Deterministic where it matters: every event records the tMs it happened at, so a replay
  // reconstructs the round from the log rather than from wall time.
  // TWO CLOCKS, DELIBERATELY. The gimbal slews every frame, because a camera that steps ten times a second
  // looks broken. Everything else — target states, the score, the tally, every HUD number — reads the GAME
  // clock, and nothing in that list is worth sixty React renders a second. Measured on the built site,
  // splitting them cut renders in this component by about six times and changed nothing a person can see.
  useEffect(() => {
    if (!running) return;
    let raf = 0, last = performance.now(), published = tMsRef.current;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      tMsRef.current += dt * 1000;
      setGim((g) => slew(g, SPEC, dt));                       // smooth, every frame
      if (tMsRef.current - published >= GAME_TICK_MS) {       // coarse, ten times a second
        published = tMsRef.current;
        setTMs(tMsRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  useEffect(() => {
    if (running && roundMs > 0 && tMs > roundMs) { setRunning(false); setGame((g) => endRound(g, tMs)); }
  }, [running, tMs, roundMs]);

  // FLIGHT. A person flies with the sticks; a machine flies a declared pattern. Either way the airframe
  // obeys the same physics, so what a pilot learns watching the machine is true when they take over.
  // ONLY THE SEAT THAT FLIES SIMULATES FLIGHT. The two-device run found this the hard way: the targeteer's
  // phone was running its own copy of the physics with its own (empty) sticks while also applying what the
  // pilot sent, so the two fought and the screens disagreed about the height. A device that does not hold
  // the pilot's seat now advances nothing; it shows what the pilot tells it.
  const climbingRef = useRef(false);
  useEffect(() => { climbingRef.current = climbing; }, [climbing]);
  useEffect(() => {
    if (!running || !flying || !iFly) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (crew.pilot === "AI") {
        const p = autoPilot(tMsRef.current / 1000);
        setFlight((f) => ({ ...f, e: p.e, n: p.n, aglM: p.aglM, headingDeg: p.headingDeg, mode: "wing", refused: "" }));
      } else {
        const k = stick.current;
        setFlight((f) => {
          // A take-off is a commanded climb through the same physics as a stick, not a teleport: the
          // aircraft really flies up, spends the energy, and eases off as it reaches its loiter height.
          // Whether it is still climbing is read from a ref, not from a dependency — listing `climbing`
          // tore this loop down and rebuilt it mid-climb, which is why the aircraft used to stall at 8 m.
          const lift = climbingRef.current ? takeoffInput(f) : null;
          return stepFlight(AIRFRAME, BATTERY, f,
            { climb: lift && !lift.done ? lift.climb : k.climb, forward: k.fwd, lateral: k.lat, yaw: k.yaw }, dt);
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, flying, crew.pilot, iFly]);

  // The climb ends when the aircraft has arrived, judged from the height it actually reached — not decided
  // inside another component's state updater, where React is free to run it more than once.
  useEffect(() => {
    if (climbing && flight.aglM >= LOITER_AGL_M - 1) setClimbing(false);
  }, [climbing, flight.aglM]);

  /**
   * "Next door" hands the targeteer a door they can ACTUALLY reach, not merely the closest one.
   * Instrumenting a played round showed the naive pick failing twice over: it offered doors the Capitol
   * stood in front of, and doors whose window would close before the gimbal finished swinging. Both are
   * refusals a player can do nothing about, so the button no longer offers them.
   */
  const nextTarget = useCallback(() => {
    const live = views.filter((v) => v.phase === "up" || v.phase === "captured");
    if (!live.length) { setNote(t("drone.game.no_target")); return; }

    // In CAPITAL the whole block is in play, so every turret is a candidate seat; in TURRETS you stay put.
    const seats = mode === "capital" ? mounts.map((m, i) => ({ m, i })) : [{ m: mount, i: mountIdx }];
    const cand = seats.flatMap(({ m, i }) => {
      const seatEye = eyeOf(m, world.ground);
      const here = i === mountIdx;
      return live.map((v) => {
        const a = aimAt(seatEye, v.door.at);
        // Nearest by the SHORTEST TURN, not raw degrees: a door at 5° is ten degrees from a gimbal at 355°,
        // not three hundred and fifty. Subtracting would skip the door right beside you.
        const turn = here ? Math.abs(shortestTurn(gim.az, a.az)) : Math.abs(shortestTurn(m.homeAz, a.az));
        const swingMs = (turn / Number(SPEC.slewDegPerSec)) * 1000;
        const leftMs = v.window.endMs - tMs;
        const reach = lineOfSight(seatEye, v.door.at, world.ground, prisms, { ignore: v.door.buildingId });
        // A seat you have to move to costs the player a beat, so a reachable door here beats one over there.
        return { v, a, seat: i, cost: turn + (here ? 0 : 400), ok: reach.clear && leftMs > swingMs + 1500 };
      });
    });

    const usable = cand.filter((c) => c.ok);
    if (!usable.length) { setNote(t("drone.game.no_reachable")); return; }
    const fresh = usable.filter((c) => c.v.door.id !== framed?.door.id);
    const pick = (fresh.length ? fresh : usable).sort((p, q) => p.cost - q.cost)[0];
    if (pick.seat !== mountIdx) setMountIdx(pick.seat);
    setGim((g) => command(g, SPEC, pick.a.az, pick.a.el));
    setNote(`${mounts[pick.seat].label} → ${pick.v.door.label}`);
  }, [views, eye, gim.az, framed, t, tMs, world, prisms, mode, mounts, mount, mountIdx]);

  // THE MACHINE TARGETEER. It aims and then it ASKS. There is no branch here that fires.
  //
  // The live world is read through a ref rather than through the effect's dependencies. That is not a
  // style choice: the first version listed `views` as a dependency, and `views` is recomputed on every
  // animation frame, so the interval was torn down and rebuilt sixty times a second and could never reach
  // its 2.6-second tick. The machine sat silent and the approval gate never got a chance to be tested —
  // which the walkthrough capture found, and no unit test would have.
  const live = useRef({ eye, gim, views, world, prisms, t });
  useEffect(() => { live.current = { eye, gim, views, world, prisms, t }; });

  useEffect(() => {
    if (!running || crew.targeteer !== "AI") return;
    const id = window.setInterval(() => {
      const L = live.current;
      const aim = autoTargeteer(L.eye, L.gim, L.views, L.world.ground, L.prisms, { nearM: Number(SPEC.nearM), rangeM: Number(SPEC.rangeM) });
      if (!aim.level) { setNote(L.t("drone.crew.ai_looking")); return; }
      setGim((g) => command(g, SPEC, aim.az, aim.el));
      setNote(`${L.t("drone.crew.ai_aiming")} ${aim.why}`);
      const target = aim.level;
      setApproval((ap) => {
        if (ap.pending) return ap;
        const reqId = `r${target.door.id}-${Math.round(tMsRef.current)}`;
        setAskedFor(reqId);
        // SI takes the decision the round already has. It does not invent one to vote on.
        setSi((s0) => openCall(s0, reqId, `${L.t("si.question")} ${target.door.label}?`, tMsRef.current));
        return requestShot(ap, {
          id: reqId, doorId: target.door.id, doorLabel: target.door.label, askedAtMs: tMsRef.current,
          az: aim.az, el: aim.el, rangeM: aimAt(L.eye, target.door.at).rangeM,
          claim: L.t("drone.crew.ai_claim"),
        });
      });
    }, 2600);
    return () => window.clearInterval(id);
  }, [running, crew.targeteer]);

  // A human answers, by name. This is the only thing that can retire a machine's question.
  const decide = useCallback((verdict: "approved" | "held") => {
    setApproval((ap) => {
      const { state, decision } = resolveRequest(ap, verdict, crew.approver || WATCH, tMsRef.current);
      if (decision) {
        setNote(`${decision.verdict === "approved" ? t("drone.crew.approved") : t("drone.crew.held")} — ${decision.by}`);
        // Judged after the fact, exactly as the pod ladder intends: whoever argued the way the person went
        // moves from noted to adopted. Nothing here changed what the person decided.
        setSi((s0) => recogniseAdopted(s0, decision.request.id, verdict === "approved" ? "approve" : "hold", tMsRef.current));
      }
      return state;
    });
  }, [crew.approver, t]);

  const doCapture = useCallback(() => {
    setGame((g) => {
      const next = capture(g, { tMs, target: framed, los, edges: framed ? 480 : 0, az: gim.az, el: gim.el });
      setNote(next.events.at(-1)?.why ?? "");
      return next;
    });
  }, [tMs, framed, los, gim]);

  const doShoot = useCallback(() => {
    // THE GATE. Consulted every time, with no way past it: a machine-aimed shot needs a named approval.
    const permit = mayFire(crew, approval, askedFor);
    if (!permit.ok) { setNote(`${t("drone.crew.refused")} — ${permit.why}`); return; }
    setGame((g) => {
      const next = shoot(g, {
        tMs, target: framed, los, onTarget: onTarget(gim), az: gim.az, el: gim.el,
        reason: los && !los.clear ? losReason(los, (id) => DRONE_DOMAIN.buildings.find((b) => b.id === id)?.label ?? id) : undefined,
      });
      setNote(next.events.at(-1)?.why ?? "");
      return next;
    });
  }, [tMs, framed, los, gim, crew, approval, askedFor, t]);

  const reset = useCallback(() => {
    setGame(initGame(0)); setTMs(0); setRunning(false); setNote("");
    setGim(initGimbal(mount));
  }, [mount]);
  // Moving to another turret re-homes the gimbal and NOTHING else: a score already earned survives the
  // walk across the lawn, which is the "a completed action is never lost" rule applied to the seat change.
  useEffect(() => { setGim(initGimbal(mounts[mountIdx])); }, [mountIdx, mounts]);
  // A change of MODE is a different exercise, so that does start over.
  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [mode]);

  // Each seat says only what it controls, a few times a second. The pure gate refuses anything else.
  const lastSay = useRef(0);
  useEffect(() => {
    if (!twoDevice || !running) return;
    if (tMs - lastSay.current < 220) return;
    lastSay.current = tMs;
    if (mySeat === "pilot") {
      link.say({ kind: "flight", flight: { e: flight.e, n: flight.n, aglM: flight.aglM, ve: flight.ve, vn: flight.vn, vu: flight.vu, headingDeg: flight.headingDeg, mode: flight.mode, energy: flight.energy } });
    } else {
      link.say({ kind: "gimbal", az: gim.az, el: gim.el, doorId: framed?.door.id ?? null });
    }
  }, [twoDevice, running, tMs, mySeat, flight, gim.az, gim.el, framed, link]);

  // What the other seat says is applied here, and only here.
  useEffect(() => {
    if (!twoDevice) return;
    if (mySeat === "targeteer" && link.state.theirFlight) {
      const f = link.state.theirFlight.flight;
      setFlight((cur) => ({ ...cur, ...f }));
    }
    if (mySeat === "pilot" && link.state.theirGimbal) {
      const g = link.state.theirGimbal;
      setGim((cur) => ({ ...cur, az: g.az, el: g.el, cmdAz: g.az, cmdEl: g.el }));
    }
  }, [twoDevice, mySeat, link.state.theirFlight, link.state.theirGimbal]);

  const s = score(game);
  const hudFont = { fontFamily: "ui-monospace, monospace", fontSize: "clamp(9px, 2.4vw, 11px)", letterSpacing: "0.06em" };
  const btn = (on: boolean, hex: string, enabled = true) => ({
    background: "transparent", border: `1px solid ${on ? hex : "#2a2a2a"}`, color: enabled ? (on ? hex : "#8a8a8a") : "#4a4a4a",
    padding: "7px clamp(9px, 2.4vw, 14px)", ...hudFont, textTransform: "uppercase" as const,
    cursor: enabled ? "pointer" : "not-allowed", borderRadius: 2, minHeight: 34,
  });

  // The overlay: targets, the sensor cone, and the sight line — drawn in the arena's camera, edges only.
  const overlay = useCallback((ctx: ArenaCtx) => {
    const p = (v: [number, number, number]) => sceneProject(v, ctx.cam);
    const marks: React.ReactNode[] = [];
    for (const v of views) {
      const q = p(v.door.at);
      if (q.behind) continue;                                  // dropped, never clamped
      const role = targetRole(v.phase);
      const r = v.phase === "up" ? 7 + 5 * (1 - v.progress) : 5;
      const hex = semanticHex(role);
      // A target is a diamond of four segments — a closed ring, no fill (the vector law).
      const d = `M${q.x} ${q.y - r}L${q.x + r} ${q.y}L${q.x} ${q.y + r}L${q.x - r} ${q.y}Z`;
      marks.push(<path key={v.door.id} d={d} {...strokeProps(hex, VECTOR_LAW.stroke.normal)} />);
    }
    if (framed) {
      const a = p(eye), b = p(framed.door.at);
      if (!a.behind && !b.behind) {
        const hex = semanticHex(los && !los.clear ? "blocked" : "ray");
        marks.push(<path key="sight" d={`M${a.x} ${a.y}L${b.x} ${b.y}`} {...strokeProps(hex, VECTOR_LAW.stroke.hairline)} />);
      }
    }
    return (
      <svg width={ctx.cam.pw} height={ctx.cam.ph} viewBox={`0 0 ${ctx.cam.pw} ${ctx.cam.ph}`} style={{ display: "block" }} aria-hidden>
        {marks}
      </svg>
    );
  }, [views, eye, framed, los]);

  return (
    <div data-drone-game>
      <ArenaView
        source={DRONE_DOMAIN}
        level={level}
        hal={hal}
        overlay={overlay}
        hudLeft={<span style={{ ...hudFont, color: semanticHex("mount") }} data-drone-aim>{aimReadout(gim, los?.rangeM)}</span>}
        hudRight={
          <span style={{ ...hudFont, color: semanticHex("tagged") }} data-drone-score>
            {t("drone.game.tagged")} {s.tagged}/{world.doors.length} · {t("drone.game.captured")} {s.captured}
          </span>
        }
      />

      {/* THE QUESTION. When a machine wants to shoot, this is the only thing that matters on the screen,
          so it is the first thing under the arena and it is impossible to miss. Nothing fires behind it. */}
      {approval.pending ? (
        <div data-drone-approval style={{ border: `2px solid ${semanticHex("pending")}`, padding: 12, margin: "10px 0" }}>
          <div style={{ ...hudFont, color: semanticHex("pending"), marginBottom: 8, fontSize: "clamp(11px, 3vw, 13px)" }}>
            {approvalPrompt(approval.pending)}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button data-drone-approve onClick={() => decide("approved")} style={btn(true, semanticHex("tree"))}>{t("drone.crew.approve")}</button>
            <button data-drone-hold onClick={() => decide("held")} style={btn(true, semanticHex("ray"))}>{t("drone.crew.hold")}</button>
          </div>
          {si.on && openCallOf(si, tMs) ? (
            <div data-si-advice style={{ ...hudFont, color: semanticHex("tagged"), marginTop: 8 }}>
              {t("si.advice")} {tally(si, openCallOf(si, tMs)!, tMs).line}
            </div>
          ) : null}
          <div style={{ ...hudFont, color: semanticHex("hud"), opacity: 0.6, marginTop: 6 }}>{t("drone.crew.gate_note")}</div>
        </div>
      ) : null}

      {/* Controls — one thumb, 34px touch targets, wrapping at phone width */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "10px 0" }}>
        <button data-drone-run onClick={() => {
          const next = !running;
          setRunning(next);
          if (next && flying && crew.pilot === "HI" && iFly && flight.aglM < 2) setClimbing(true);
        }} style={btn(running, semanticHex("tree"))}>
          {running ? t("drone.game.pause") : t("drone.game.start")}
        </button>
        {iAim ? <button data-drone-next onClick={nextTarget} style={btn(false, semanticHex("door"))}>{t("drone.game.next_target")}</button> : null}
        {iAim ? (
          <button data-drone-capture onClick={doCapture} disabled={!framed} style={btn(false, semanticHex("frustum"), Boolean(framed))}>
            {t("drone.game.capture")}
          </button>
        ) : null}
        {iAim ? (
          <button data-drone-shoot onClick={doShoot} disabled={!framed} style={btn(false, semanticHex("ray"), Boolean(framed))}>
            {t("drone.game.shoot")}
          </button>
        ) : null}
        <button data-drone-reset onClick={reset} style={btn(false, semanticHex("contour"))}>{t("drone.game.reset")}</button>
        {flying && crew.pilot === "HI" && iFly ? (
          <button data-drone-takeoff onClick={() => { if (flight.aglM < 2) { setClimbing(true); setRunning(true); } else { setClimbing(false); stick.current.climb = -1; setTimeout(() => { stick.current.climb = 0; }, 3000); } }}
                  style={btn(climbing, semanticHex("tree"))}>
            {flight.aglM < 2 ? t("drone.fly.takeoff") : t("drone.fly.land")}
          </button>
        ) : null}
        {flying && crew.pilot === "HI" && iFly ? (
          <button data-drone-wing onClick={() => setFlight((f) => stepFlight(AIRFRAME, BATTERY, f, { climb: 0, forward: 1, lateral: 0, yaw: 0, toggleMode: true }, 0.016))}
                  style={btn(flight.mode === "wing", semanticHex("frustum"))}>
            {flight.mode === "wing" ? t("drone.fly.to_quad") : t("drone.fly.to_wing")}
          </button>
        ) : null}
        {mode === "multi" ? (
          <select data-drone-crew value={crewId} onChange={(e) => setCrewId(e.target.value as CrewId)}
                  style={{ ...btn(true, semanticHex("pending")), minWidth: 130 }}>
            <option value="hi_pilot">{t("drone.crew.hi_pilot")}</option>
            <option value="ai_pilot">{t("drone.crew.ai_pilot")}</option>
            <option value="both_ai">{t("drone.crew.both_ai")}</option>
          </select>
        ) : null}
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
          {flying ? (
            <span data-drone-flight style={{ ...hudFont, color: semanticHex("mount") }}>
              {flightLine(AIRFRAME, BATTERY, flight)}{flight.refused ? ` · ${flight.refused}` : ""}
            </span>
          ) : null}
          {flying ? null : <span style={{ ...hudFont, color: semanticHex("hud"), opacity: 0.6 }}>{t("drone.game.turret")}</span>}
          {flying ? null : mounts.map((m, i) => (
            <button key={m.id} data-drone-mount={m.id} onClick={() => setMountIdx(i)} style={btn(i === mountIdx, semanticHex("mount"))}>
              {m.id.replace("t-", "")}
            </button>
          ))}
        </div>
      </div>

      {/* THE STICKS. Left moves the body, right moves the head — the scheme the operator specified. They
          appear only when a person actually holds the pilot's seat; a machine-flown airframe shows none,
          because a control that does nothing is worse than no control. */}
      {flying && crew.pilot === "HI" && iFly ? (
        <div data-drone-sticks style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "8px 0" }}>
          <Stick label={t("drone.fly.body")} onMove={(x, y) => { stick.current.lat = x; stick.current.fwd = -y; }} hex={semanticHex("mount")} />
          <Stick label={t("drone.fly.head")} onMove={(x, y) => { stick.current.yaw = x; stick.current.climb = -y; }} hex={semanticHex("frustum")} />
          <div style={{ ...hudFont, color: semanticHex("hud"), opacity: 0.6, alignSelf: "center", maxWidth: 260, lineHeight: 1.6 }}>
            {t("drone.fly.help")}
          </div>
        </div>
      ) : null}

      {flying ? (
        <CrewSeatPanel
          mySeat={mySeat} setMySeat={setMySeat} code={crewCode} setCode={setCrewCode}
          line={twoDevice ? linkLine(link.state, tMs) : ""}
          up={twoDevice && linkUp(link.state, tMs)} paths={link.paths}
          urlFor={(seat) => seatUrl(typeof window === "undefined" ? "" : window.location.origin, crewCode, seat)}
        />
      ) : null}

      <SiPanel si={si} setSi={setSi} nowMs={tMs} />

      {/* What just happened, in words — never a silent press */}
      <div style={{ ...hudFont, color: semanticHex("hud"), opacity: 0.8, minHeight: 18 }} data-drone-note>
        {note || (framed ? framed.door.label : t("drone.game.no_target"))}
      </div>
      <div data-drone-crewline style={{ ...hudFont, color: semanticHex("pending"), opacity: 0.85, marginTop: 4 }}>
        {t("drone.crew.seats")} {crew.pilot === "HI" ? t("drone.crew.person") : t("drone.crew.machine")} {t("drone.crew.flies")} · {crew.targeteer === "HI" ? t("drone.crew.person") : t("drone.crew.machine")} {t("drone.crew.aims")}
        {shotNeedsApproval(crew) ? ` · ${t("drone.crew.gate_on")}` : ""}
        {approval.decisions.length ? ` · ${approval.approved} ${t("drone.crew.approved")}, ${approval.held} ${t("drone.crew.held")}` : ""}
      </div>
      <div style={{ ...hudFont, color: semanticHex("hud"), opacity: 0.5, marginTop: 4 }}>
        {t("drone.game.accuracy")} {(s.accuracy * 100).toFixed(0)}% · {t("drone.game.clock")} {(tMs / 1000).toFixed(0)}s / {(roundMs / 1000).toFixed(0)}s
      </div>

      {/* The round's own working — the log the score rests on */}
      {game.events.length > 1 ? (
        <details style={{ marginTop: 10 }}>
          <summary style={{ ...hudFont, color: semanticHex("hud"), opacity: 0.7, cursor: "pointer" }}>{t("drone.game.log")}</summary>
          <pre style={{ ...hudFont, color: semanticHex("hud"), opacity: 0.65, whiteSpace: "pre-wrap", margin: "6px 0 0" }}>
            {transcript(game).slice(-12).join("\n")}
          </pre>
        </details>
      ) : null}

    </div>
  );
}

/** One thumb stick. Pure input: it reports a normalised vector and owns no game state. */
function Stick({ label, onMove, hex }: { label: string; onMove: (x: number, y: number) => void; hex: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const set = (e: React.PointerEvent) => {
    const r = box.current?.getBoundingClientRect(); if (!r) return;
    const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
    const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    const m = Math.max(1, Math.hypot(x, y));
    const nx = x / m, ny = y / m;
    setKnob({ x: nx, y: ny }); onMove(nx, ny);
  };
  const clear = () => { setKnob({ x: 0, y: 0 }); onMove(0, 0); };
  return (
    <div style={{ textAlign: "center" }}>
      <div ref={box} data-drone-stick={label}
           onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); set(e); }}
           onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") set(e); }}
           onPointerUp={clear} onPointerCancel={clear}
           style={{ width: 92, height: 92, border: `1px solid ${hex}`, borderRadius: "50%", position: "relative", touchAction: "none", cursor: "grab" }}>
        <div style={{ position: "absolute", width: 26, height: 26, border: `1px solid ${hex}`, borderRadius: "50%",
                      left: 33 + knob.x * 26, top: 33 + knob.y * 26, pointerEvents: "none" }} />
      </div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: hex, opacity: 0.8, marginTop: 4, letterSpacing: "0.08em" }}>{label}</div>
    </div>
  );
}

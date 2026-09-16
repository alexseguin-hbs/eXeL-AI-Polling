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
import { MONO, btn } from "./ui";
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
import { worldAt } from "@/lib/drone-2525/world";
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
import { seatEye, seatEyeLine } from "@/lib/drone-2525/seat-view";
import { initSlots, designate, nextFreeSlot, approve, canFire, clearSlot, pruneSlots, slotLine, refusalToast, slotOf, selectSlot, type SlotN } from "@/lib/drone-2525/slots";
import { useControls, type GimbalRate } from "@/lib/drone-2525/use-controls";
import { applySets, getSets, initSets, subscribeSets } from "@/lib/2525-core/stick-sets";
import { initLedger, decide as recordDecision, ev as recordEvent, type Stamp } from "@/lib/drone-2525/decisions";
import { useDroneLink } from "@/lib/drone-2525/use-drone-link";
import { CrewSeatPanel } from "./crew-seat-panel";
import { initSwarm, stepSwarm, planSwarmDraw, swarmLine, aliveCount, SWARM_N } from "@/lib/drone-2525/swarm";
import { GLYPH_COST } from "@/lib/drone-2525/airframe-glyph";
import { motSpec } from "@/lib/wire-core/mot-ladder";
import { useRoundClock, GAME_TICK_MS } from "@/lib/drone-2525/use-round-clock";
import { SwarmLayer } from "./swarm-layer";
import { ApprovalBanner } from "./approval-banner";
import { RoundStatus } from "./round-status";
import { RoundOverlay } from "./round-overlay";
import { Stick, HoldButton } from "./stick";
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
  // The R stick is the HEAD (EXEL-2525-CONTROLS-1): its reading is a gimbal RATE, integrated each frame by
  // the controls hook through command(), so the declared pan/tilt limits and the slew law still apply.
  const headStick = useRef({ x: 0, y: 0 });
  // Stick calibration — sensitivity, deadzone, trim — read once from what a previous visit saved.
  const [sets, setSetsState] = useState(getSets);
  useEffect(() => { setSetsState(initSets()); return subscribeSets(setSetsState); }, []);
  const [si, setSi] = useState(initSi);
  // T1 · T2 · T3 and AMBER → RED (operator r.049/r.050): a designation is amber and cannot fire; only a
  // named APPROVE makes red; only red can fire. And the RECORD: every designate, approve, refusal and shot
  // is a decision with a name on it, kept beside the game rather than inferred from it afterwards.
  const [slots, setSlots] = useState(initSlots);
  const [ledger, setLedger] = useState(() => initLedger(DRONE_DOMAIN.project.revision));
  // FORTY-TWO AIRCRAFT, 21 v 21. Held in a ref, not in state: the columns are written in place by the tick,
  // and putting them in state would mean React comparing forty-two aircraft sixty times a second to learn
  // what the tick already knows. A counter published on the game clock is what the screen actually needs.
  const swarm = useRef(initSwarm(Number(DRONE_DOMAIN.targets.seed)));

  const crew = mode === "multi" ? CREWS[crewId] : CREWS.two_hi;
  const flying = FLYING(mode);
  /** The engagement runs in the flying modes: an aircraft on its own over an empty lawn is not one. */
  const engagement = flying;


  // LINK-2525: the SAME gimbal record, bolted to a different thing. Nothing about its behaviour changes.
  const mount = useMemo(
    () => (flying ? airframeMount("vtol-01", "VTOL TRINITY", [flight.e, flight.n], flight.aglM, flight.headingDeg, -12) : mounts[mountIdx]),
    [flying, flight.e, flight.n, flight.aglM, flight.headingDeg, mounts, mountIdx],
  );

  const [gim, setGim] = useState<GimbalState>(() => initGimbal(mount));
  const [game, setGame] = useState<GameState>(() => initGame(0));
  // WHICH SEAT THIS DEVICE HOLDS. A link opened on the second person's phone puts them straight into the
  // other seat; a device that arrived on its own holds both, which is practice rather than a crew, and the
  // panel says which of the two is happening.
  const joined = useMemo(() => (typeof window === "undefined" ? null : seatFromParams(window.location.search)), []);
  const [crewCode, setCrewCode] = useState(() => joined?.code ?? "");
  const [mySeat, setMySeat] = useState<Seat | null>(() => joined?.seat ?? null);
  const twoDevice = Boolean(crewCode && mySeat);
  const iFly = !twoDevice || mySeat === "pilot";
  const iAim = !twoDevice || mySeat === "targeteer";
  const [running, setRunning] = useState(false);

  // The clocks, the flying and the swarm tick — one hook, because they are one concern and the round was
  // 500 lines with them inlined, against this repository's own 300-line rule.
  const { tMs, tMsRef, swarmTick, climbing, setClimbing, resetClock } = useRoundClock({
    running, flying, iFly, pilotIsMachine: crew.pilot === "AI", engagement,
    spec: SPEC, airframe: AIRFRAME, battery: BATTERY, swarm, stick, setGim, setFlight,
  }, flight);

  // The crew link reads the game clock for its own timestamps, so it is created after it.
  const link = useDroneLink(mySeat ?? "pilot", crewCode, tMs, twoDevice);
  const { say } = link;
  const [note, setNote] = useState<string>("");

  // ONE WORLD. The door positions and the terrain come from the footprints, not from the curve budget, so
  // this build agrees with whatever the renderer chose to paint at the current tier — and the HAL gate holds
  // it to that, asserting 14 doors at every tier. Nothing here is a second source of truth.
  const world = useMemo(() => {
    const a = worldAt(DRONE_DOMAIN, 13, "game");
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
  // THE EYE, QUANTISED. `mount` is rebuilt every frame from the flight state, so keying the eye on the
  // object identity made every downstream memo — including the hundred-sample sight line — recompute sixty
  // times a second while flying. The audit caught the Efficiency claim being false for exactly this reason.
  // A camera that moved less than a decimetre has not moved for any purpose the sight line cares about.
  //
  // AND THERE ARE TWO OF THEM. Operator 2026-09-15: "make sure view from HI gimbal laser cockpit for HI
  // pilot are different per dimensions of aircraft or quad." The pilot looks out of the canopy; the
  // targeteer looks down a gimbal slung under the belly, and on this airframe that is 18 cm apart in the
  // hover and 37 cm on the wing — a fraction of the airframe's own nose-to-tail length, not typed here.
  // (Those figures read 8.7 m and 18.6 m until 2026-09-16, when the aircraft was declared at its true
  // 1.111 m foil and the scaling axis was corrected from the span to the fuselage.)
  // A TURRET returns the same point for both seats, by construction, so the stationary modes are unchanged.
  //
  //   sensorEye  — where the gimbal actually is. Framing, the sight line, the range readout and the laser
  //                all start here, WHOEVER is looking, because that is where the sensor is bolted.
  //   myEye      — where the person at THIS screen is. It is what their own seat marker is drawn from, and
  //                it is why a pilot's picture is not the targeteer's picture.
  const eyeKey = `${Math.round(mount.at[0] * 10)}:${Math.round(mount.at[1] * 10)}:${Math.round(mount.heightM * 10)}`;
  const mySeatOr: Seat = mySeat ?? (iAim ? "targeteer" : "pilot");
  /* eslint-disable react-hooks/exhaustive-deps */
  const sensorEye = useMemo(() => seatEye(mount, "targeteer", flight.mode, world.ground), [world, eyeKey, flight.mode]);
  const myEye = useMemo(() => seatEye(mount, mySeatOr, flight.mode, world.ground), [world, eyeKey, flight.mode, mySeatOr]);
  /* eslint-enable react-hooks/exhaustive-deps */
  // Everything downstream of the sensor reads the sensor's eye. Named once so no call site has to remember.
  const eye = sensorEye;

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
  // A slot whose door has closed or been tagged is dropped, not left pointing at nothing. pruneSlots
  // returns the same object when nothing changed, so this is a no-op render on the ticks that change nothing.
  useEffect(() => {
    const live = new Set(views.filter((v) => v.phase === "up" || v.phase === "captured").map((v) => v.door.id));
    setSlots((s) => pruneSlots(s, live));
  }, [views]);
  const los = useMemo(() => {
    if (!framed) return null;
    return lineOfSight(eye, framed.door.at, world.ground, prisms, { ignore: framed.door.buildingId });
    // framed is deliberately not a dependency: framedDoorId is what actually changes the answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eye, framedDoorId, world, prisms]);

  // The clock. Deterministic where it matters: every event records the tMs it happened at, so a replay
  // reconstructs the round from the log rather than from wall time.

  useEffect(() => {
    if (running && roundMs > 0 && tMs > roundMs) { setRunning(false); setGame((g) => endRound(g, tMs)); }
  }, [running, tMs, roundMs]);

  // FLIGHT. A person flies with the sticks; a machine flies a declared pattern. Either way the airframe
  // obeys the same physics, so what a pilot learns watching the machine is true when they take over.

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
      const fromSeat = eyeOf(m, world.ground);
      const here = i === mountIdx;
      return live.map((v) => {
        const a = aimAt(fromSeat, v.door.at);
        // Nearest by the SHORTEST TURN, not raw degrees: a door at 5° is ten degrees from a gimbal at 355°,
        // not three hundred and fifty. Subtracting would skip the door right beside you.
        const turn = here ? Math.abs(shortestTurn(gim.az, a.az)) : Math.abs(shortestTurn(m.homeAz, a.az));
        const swingMs = (turn / Number(SPEC.slewDegPerSec)) * 1000;
        const leftMs = v.window.endMs - tMs;
        const reach = lineOfSight(fromSeat, v.door.at, world.ground, prisms, { ignore: v.door.buildingId });
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
  // Written in place rather than replaced: this ran on every render and allocated a six-field object each
  // time, sixty times a second, to hand the interval below values it reads at most once every 2.6 seconds.
  const live = useRef({ eye, gim, views, world, prisms, t });
  live.current.eye = eye; live.current.gim = gim; live.current.views = views;
  live.current.world = world; live.current.prisms = prisms; live.current.t = t;

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

  // THE STAMP every decision and event is written with. The seat is the actor; challenge and difficulty
  // are the round's defaults until CH1–CH5 / DIFF 1–5 land in this app; the score is the tag count, which
  // is what the round has for a score today. Nothing here reads a clock — tMs is the game clock.
  const stampNow = useCallback((): Stamp => {
    const cur = slots.current ? slots.s[slots.current] : null;
    return {
      t: tMsRef.current / 1000, actor: mySeatOr,
      designated: Boolean(cur), hiApproved: cur?.phase === "red",
      authorityLevel: 1, challenge: 1, diff: 3,
      blu: score(game).tagged, red: 0,
    };
  }, [slots, mySeatOr, game]);

  // TARGET → AMBER. Puts the door in view into the next free slot as a designation that CANNOT fire, and
  // records it by name. click / the TARGET button / voice "target" all come here (r.050: redundant paths
  // onto one action). Re-targeting the door already held is a no-op rather than a second record.
  const doorLabel = useCallback((id: string) => views.find((v) => v.door.id === id)?.door.label ?? id, [views]);
  const designateInto = useCallback((n: SlotN) => {
    if (!framed) { setNote(t("drone.game.no_target")); return; }
    const id = framed.door.id;
    if (slotOf(slots, id) === n) { setNote(slotLine(slots, doorLabel)); return; }
    setSlots((s) => designate(s, n, id, mySeatOr, tMsRef.current));
    setLedger((L) => {
      const a = recordDecision(L, "DESIGNATE", id, stampNow(), { slot: n });
      return recordEvent(a.ledger, "DESIGNATE", id, "AMBER", stampNow()).ledger;
    });
    setNote(`T${n} · AMBER · ${framed.door.label}`);
  }, [framed, slots, mySeatOr, t, stampNow, doorLabel]);
  const doTarget = useCallback(() => {
    designateInto(slotOf(slots, framed?.door.id ?? "") ?? nextFreeSlot(slots));
  }, [designateInto, slots, framed]);
  // The 1 / 2 / 3 keys (and voice "T2"): a held slot becomes the current one and the gimbal swings to its
  // door; an empty slot takes the door in view as a new amber mark. Neither path changes a box's colour.
  const doSlot = useCallback((n: SlotN) => {
    const held = slots.s[n];
    if (!held) { designateInto(n); return; }
    setSlots((s) => selectSlot(s, n));
    const v = views.find((x) => x.door.id === held.doorId);
    if (v) { const a = aimAt(eye, v.door.at); setGim((g) => command(g, SPEC, a.az, a.el)); }
    setNote(slotLine(selectSlot(slots, n), doorLabel));
  }, [slots, designateInto, views, eye, doorLabel]);

  // APPROVE → RED. The second authority. On one device that is the same person acting as HI-2, and the
  // record says so (approvalKind reads two-step when approver === designator). A named approver in the
  // crew — the watch officer in the mixed modes — is a different actor and reads two-person.
  const doApprove = useCallback(() => {
    const n = slots.current;
    const cur = n ? slots.s[n] : null;
    if (!n || !cur) { setNote(refusalToast("NO_RED_BOX")); return; }
    if (cur.phase === "red") return;
    // WHO IS APPROVING. If the mark is MINE — this seat designated it — then approving it is the same
    // person acting as HI-2, and the record must say two-step, not borrow the crew's named approver and
    // read as two-person. The named approver (the watch officer) is a different actor only when the mark
    // came from someone else: the machine targeteer, or the other seat over the link.
    const by = cur.by === mySeatOr ? mySeatOr : (crew.approver || WATCH);
    setSlots((s) => approve(s, n, by, tMsRef.current));
    setLedger((L) => {
      const a = recordDecision(L, "APPROVE", cur.doorId, { ...stampNow(), actor: by, hiApproved: true }, { by, from: cur.by, slot: n });
      return recordEvent(a.ledger, "APPROVE", cur.doorId, "RED", { ...stampNow(), hiApproved: true }, by === cur.by ? "HI-2" : "HI").ledger;
    });
    setNote(`T${n} · RED · ${by === cur.by ? "HI-2" : by}`);
  }, [slots, crew.approver, mySeatOr, stampNow]);

  const doCapture = useCallback(() => {
    setGame((g) => {
      const next = capture(g, { tMs, target: framed, los, edges: framed ? 480 : 0, az: gim.az, el: gim.el });
      setNote(next.events.at(-1)?.why ?? "");
      return next;
    });
  }, [tMs, framed, los, gim]);

  const doShoot = useCallback(() => {
    // THE GATE, IN TWO LAYERS, NEITHER OF WHICH CAN BE SKIPPED.
    // First r.050's: no red box, no shot. A shot with nothing designated is NO_RED_BOX; a shot on an amber
    // box is AMBER_NO_APPROVE. Both are refused AND RECORDED — a refusal is a decision, and a decision that
    // is only toasted is a decision that is lost.
    const check = canFire(slots);
    if (!check.ok) {
      const reason = check.refusal ?? "NO_RED_BOX";
      setLedger((L) => recordDecision(L, "REJECT", check.doorId ?? "NONE", stampNow(), { reason }).ledger);
      setNote(refusalToast(reason));
      return;
    }
    // Then the machine gate that was already here: a machine-aimed shot needs a named approval.
    const permit = mayFire(crew, approval, askedFor);
    if (!permit.ok) { setNote(`${t("drone.crew.refused")} — ${permit.why}`); return; }
    const doorId = check.doorId!;
    setGame((g) => {
      const next = shoot(g, {
        tMs, target: framed, los, onTarget: onTarget(gim), az: gim.az, el: gim.el,
        reason: los && !los.clear ? losReason(los, (id) => DRONE_DOMAIN.buildings.find((b) => b.id === id)?.label ?? id) : undefined,
      });
      setNote(next.events.at(-1)?.why ?? "");
      return next;
    });
    setLedger((L) => {
      const a = recordDecision(L, "SIM-ACTION", doorId, stampNow(), { slot: check.slot ?? 0 });
      return recordEvent(a.ledger, "SIM-ACTION", doorId, `T${check.slot}`, stampNow()).ledger;
    });
    // A box that has been fired on is spent. Red is for one shot, not a standing licence.
    if (check.slot) setSlots((s) => clearSlot(s, check.slot!));
  }, [tMs, framed, los, gim, crew, approval, askedFor, t, slots, stampNow]);

  const reset = useCallback(() => {
    setGame(initGame(0)); resetClock(); setRunning(false); setNote("");
    setGim(initGimbal(mount));
  }, [mount, resetClock]);

  // THE KEYBOARD AND THE R STICK, through the ref bus. The arrows and the R stick are a gimbal rate at the
  // declared slew speed; command() clamps them to the declared limits. A human input takes the gimbal:
  // any pending auto-aim is simply overwritten, which is the arbitration the two writers needed.
  const onGimbalRate = useCallback((r: GimbalRate | null, dt: number) => {
    if (!r) return;
    const rate = Number(SPEC.slewDegPerSec);
    setGim((g) => command(g, SPEC, g.cmdAz + r.pan * rate * dt, g.cmdEl + r.tilt * rate * dt));
  }, []);
  const humanPilot = flying && crew.pilot === "HI" && iFly;
  useControls({
    enabled: true, stick, headStick, onGimbalRate,
    handlers: { onTarget: doTarget, onSlot: doSlot, onCycle: nextTarget, onFire: doShoot, onCapture: doCapture, onApprove: doApprove },
    mayFly: humanPilot, mayAim: iAim,
  });
  // Moving to another turret re-homes the gimbal and NOTHING else: a score already earned survives the
  // walk across the lawn, which is the "a completed action is never lost" rule applied to the seat change.
  useEffect(() => { setGim(initGimbal(mounts[mountIdx])); }, [mountIdx, mounts]);
  // A change of MODE is a different exercise, so that does start over.
  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [mode]);

  // Each seat says only what it controls, a few times a second. The pure gate refuses anything else.
  // ONE INTERVAL, NOT A PER-FRAME EFFECT. Listing `flight`, `gim` and `framed` as dependencies meant React
  // tore this down and rebuilt it every frame to do nothing for fifty-nine of every sixty.
  //
  // The dependency is `link.say`, NOT `link`. The hook returns a fresh object every render, so depending on
  // the object destroyed this interval every hundred milliseconds — faster than its own period, so it never
  // fired once and the two devices went silent. `say` itself is stable. The two-device gate caught it; the
  // lesson is that an interval whose owner is rebuilt faster than its period is not an interval.
  const sending = useRef({ flight, gim, framed, mySeat });
  sending.current.flight = flight; sending.current.gim = gim;
  sending.current.framed = framed; sending.current.mySeat = mySeat;
  useEffect(() => {
    if (!twoDevice || !running) return;
    const id = window.setInterval(() => {
      const c = sending.current;
      if (c.mySeat === "pilot") {
        const f = c.flight;
        say({ kind: "flight", flight: { e: f.e, n: f.n, aglM: f.aglM, ve: f.ve, vn: f.vn, vu: f.vu, headingDeg: f.headingDeg, mode: f.mode, energy: f.energy } });
      } else {
        say({ kind: "gimbal", az: c.gim.az, el: c.gim.el, doorId: c.framed?.door.id ?? null });
      }
    }, 220);
    return () => window.clearInterval(id);
  }, [twoDevice, running, say]);

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

  // The swarm's share of the rung's budget, and which silhouette each aircraft gets. Recomputed on the
  // game clock: forty-two distances do not need re-sorting sixty times a second.
  const swarmPlan = useMemo(() => {
    if (!engagement) return null;
    const spec = motSpec(level);
    const share = Math.min(Math.floor(spec.segments * 0.45), GLYPH_COST.near * SWARM_N);
    return planSwarmDraw(swarm.current, mount.at[0], mount.at[1], share);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagement, level, swarmTick, mount.at[0], mount.at[1]]);

  const s = score(game);

  // Everything drawn on top of the world, in the world's own camera.
  const overlay = useCallback((ctx: ArenaCtx) => (
    <RoundOverlay ctx={ctx} views={views} eye={eye} myEye={myEye} framed={framed} los={los} swarm={swarm.current} swarmPlan={swarmPlan} />
  ), [views, eye, myEye, framed, los, swarmPlan]);

  return (
    <div data-drone-game>
      <ArenaView
        source={DRONE_DOMAIN}
        level={level}
        hal={hal}
        reserve={swarmPlan?.cost ?? 0}
        overlay={overlay}
        hudLeft={
          <>
            <span style={{ ...MONO, color: semanticHex("mount") }} data-drone-aim>{aimReadout(gim, los?.rangeM)}</span>
            <span style={{ ...MONO, color: semanticHex(slots.current && slots.s[slots.current]?.phase === "red" ? "ray" : "pending") }} data-drone-slot>
              {slotLine(slots, (id) => world.doors.find((d) => d.id === id)?.label ?? id)}
            </span>
            <span style={{ ...MONO, color: semanticHex("frustum") }} data-drone-seat-eye>
              {seatEyeLine(mySeatOr, mount, flight.mode, world.ground)}
            </span>
            {engagement && swarmPlan ? (
              <span style={{ ...MONO, color: semanticHex("ray") }} data-drone-swarm-line>{swarmLine(swarm.current, swarmPlan)}</span>
            ) : null}
          </>
        }
        hudRight={
          <span style={{ ...MONO, color: semanticHex("tagged") }} data-drone-score>
            {t("drone.game.tagged")} {s.tagged}/{world.doors.length} · {t("drone.game.captured")} {s.captured}
          </span>
        }
      />

      {approval.pending ? (
        <ApprovalBanner
          pending={approval.pending}
          advice={si.on && openCallOf(si, tMs) ? tally(si, openCallOf(si, tMs)!, tMs).line : null}
          onDecide={decide}
        />
      ) : null}

      {/* Controls — one thumb, 34px touch targets, wrapping at phone width */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "10px 0" }}>
        <button data-drone-run onClick={() => {
          const next = !running;
          setRunning(next);
          if (next && flying && crew.pilot === "HI" && iFly && flight.aglM < 2) setClimbing(true);
        }} style={btn({ on: running, hex: semanticHex("tree") })}>
          {running ? t("drone.game.pause") : t("drone.game.start")}
        </button>
        {iAim ? <button data-drone-next onClick={nextTarget} style={btn({ hex: semanticHex("door") })}>{t("drone.game.next_target")}</button> : null}
        {iAim ? (
          <button data-drone-capture onClick={doCapture} disabled={!framed} style={btn({ hex: semanticHex("frustum"), enabled: Boolean(framed) })}>
            {t("drone.game.capture")}
          </button>
        ) : null}
        {iAim ? (
          <button data-drone-target onClick={doTarget} disabled={!framed} style={btn({ hex: semanticHex("pending"), enabled: Boolean(framed) })}>
            {t("drone.game.target")}
          </button>
        ) : null}
        {iAim ? (
          <button data-drone-approve onClick={doApprove} disabled={!(slots.current && slots.s[slots.current]?.phase === "amber")}
                  style={btn({ hex: semanticHex("ray"), enabled: Boolean(slots.current && slots.s[slots.current]?.phase === "amber") })}>
            {t("drone.game.approve")}
          </button>
        ) : null}
        {iAim ? (
          <button data-drone-shoot onClick={doShoot} disabled={!canFire(slots).ok} style={btn({ hex: semanticHex("ray"), enabled: canFire(slots).ok })}>
            {t("drone.game.shoot")}
          </button>
        ) : null}
        <button data-drone-reset onClick={reset} style={btn({ hex: semanticHex("contour") })}>{t("drone.game.reset")}</button>
        {flying && crew.pilot === "HI" && iFly ? (
          <button data-drone-takeoff onClick={() => { if (flight.aglM < 2) { setClimbing(true); setRunning(true); } else { setClimbing(false); stick.current.climb = -1; setTimeout(() => { stick.current.climb = 0; }, 3000); } }}
                  style={btn({ on: climbing, hex: semanticHex("tree") })}>
            {flight.aglM < 2 ? t("drone.fly.takeoff") : t("drone.fly.land")}
          </button>
        ) : null}
        {flying && crew.pilot === "HI" && iFly ? (
          <button data-drone-wing onClick={() => setFlight((f) => stepFlight(AIRFRAME, BATTERY, f, { climb: 0, forward: 1, lateral: 0, yaw: 0, toggleMode: true }, 0.016))}
                  style={btn({ on: flight.mode === "wing", hex: semanticHex("frustum") })}>
            {flight.mode === "wing" ? t("drone.fly.to_quad") : t("drone.fly.to_wing")}
          </button>
        ) : null}
        {mode === "multi" ? (
          <select data-drone-crew value={crewId} onChange={(e) => setCrewId(e.target.value as CrewId)}
                  style={{ ...btn({ on: true, hex: semanticHex("pending") }), minWidth: 130 }}>
            <option value="hi_pilot">{t("drone.crew.hi_pilot")}</option>
            <option value="ai_pilot">{t("drone.crew.ai_pilot")}</option>
            <option value="both_ai">{t("drone.crew.both_ai")}</option>
          </select>
        ) : null}
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
          {flying ? (
            <span data-drone-flight style={{ ...MONO, color: semanticHex("mount") }}>
              {flightLine(AIRFRAME, BATTERY, flight)}{flight.refused ? ` · ${flight.refused}` : ""}
            </span>
          ) : null}
          {flying ? null : <span style={{ ...MONO, color: semanticHex("hud"), opacity: 0.6 }}>{t("drone.game.turret")}</span>}
          {flying ? null : mounts.map((m, i) => (
            <button key={m.id} data-drone-mount={m.id} onClick={() => setMountIdx(i)} style={btn({ on: i === mountIdx, hex: semanticHex("mount") })}>
              {m.id.replace("t-", "")}
            </button>
          ))}
        </div>
      </div>

      {/* THE STICKS, per EXEL-2525-CONTROLS-1: L is the BODY, R is the HEAD. The body stick and the turn /
          climb buttons appear only when a person actually holds the pilot's seat — a machine-flown airframe
          shows none, because a control that does nothing is worse than no control. The head stick appears
          for whoever aims, which in the turret modes is one centred look-stick above the dock (r.048).
          Every reading passes through the saved calibration, so a resting thumb reads zero. */}
      {humanPilot || iAim ? (
        <div data-drone-sticks data-drone-sticks-layout={humanPilot ? "crew" : "look"}
             style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "8px 0", alignItems: "center", justifyContent: humanPilot ? "flex-start" : "center" }}>
          {humanPilot ? (
            <Stick label={t("drone.fly.body")} hex={semanticHex("mount")}
                   onMove={(x, y) => { const v = applySets({ x, y }, "L", sets); stick.current.lat = v.x; stick.current.fwd = -v.y; }} />
          ) : null}
          {humanPilot ? (
            <div data-drone-yaw-climb style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, alignItems: "center" }}>
              <HoldButton id="yaw.left" label="◄" hex={semanticHex("mount")} onHold={(d) => { stick.current.yaw = d ? -1 : 0; }} />
              <HoldButton id="yaw.right" label="►" hex={semanticHex("mount")} onHold={(d) => { stick.current.yaw = d ? 1 : 0; }} />
              <div style={{ ...MONO, gridColumn: "1 / -1", textAlign: "center", color: semanticHex("mount"), opacity: 0.8, fontSize: 10, letterSpacing: "0.08em" }}>{t("drone.fly.yaw")}</div>
              <HoldButton id="climb.up" label="▲" hex={semanticHex("mount")} onHold={(d) => { stick.current.climb = d ? 1 : 0; }} />
              <HoldButton id="climb.down" label="▼" hex={semanticHex("mount")} onHold={(d) => { stick.current.climb = d ? -1 : 0; }} />
              <div style={{ ...MONO, gridColumn: "1 / -1", textAlign: "center", color: semanticHex("mount"), opacity: 0.8, fontSize: 10, letterSpacing: "0.08em" }}>{t("drone.fly.climb")}</div>
            </div>
          ) : null}
          {iAim ? (
            <Stick label={t("drone.fly.head")} hex={semanticHex("frustum")}
                   onMove={(x, y) => { headStick.current = applySets({ x, y }, "R", sets); }} />
          ) : null}
          {humanPilot ? (
            <div style={{ ...MONO, color: semanticHex("hud"), opacity: 0.6, alignSelf: "center", maxWidth: 260, lineHeight: 1.6 }}>
              {t("drone.fly.help")}
            </div>
          ) : null}
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

      <RoundStatus
        note={note || (framed ? framed.door.label : t("drone.game.no_target"))}
        crew={crew} approval={approval} game={game} tMs={tMs} roundMs={roundMs}
      />

    </div>
  );
}

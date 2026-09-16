"use client";

// THE KEYBOARD, THROUGH THE REF BUS — WASD / arrows / QE / UJ / T / 1 2 3 / F / C, per EXEL-2525-CONTROLS-1.
//
// Drone-2525 had no keyboard handling at all — not one keydown — while the operator's schema binds
// nineteen actions to keys. This hook adds them without touching the flight loop, because the loop
// already reads `stick.current` once per frame from a ref (use-round-clock.ts:89) and never re-subscribes.
// A held key WRITES THAT REF, exactly as a thumb does, so keys and sticks compose for free: last writer
// wins per axis, and a stick released with a key still down reads the key.
//
// The R stick's keys — the arrows — drive the GIMBAL, as the schema says (R = HEAD/GIMBAL), through
// `command()` so the declared pan/tilt limits and the slew law both still apply. They do NOT drive airframe
// yaw and climb; those are Q/E and U/J.
//
// ONE-SHOT ACTIONS GO THROUGH REFS, NEVER DEPENDENCIES. `nextTarget` in round.tsx is rebuilt ten times a
// second (it depends on `views` and `tMs`); binding it as an effect dependency would tear the listener
// down and rebuild it on every game tick — the exact defect documented at round.tsx:248 for the machine
// targeteer's interval. The callbacks are read through a ref at the instant the key lands.
//
// Keys are ignored while an <input>, <textarea> or contenteditable has focus: a person typing a crew code
// is not flying.
import { useEffect, useRef } from "react";
import { KEY_TO_ACTION, HELD_ACTIONS, type Action } from "@/lib/2525-core/controls";

export interface StickAxes { fwd: number; lat: number; climb: number; yaw: number }
export interface GimbalRate { pan: number; tilt: number }

/** What the held keys add up to, as stick axes. Pure, so it can be gated without a DOM. */
export function axesFromHeld(held: ReadonlySet<Action>): StickAxes {
  const on = (a: Action) => (held.has(a) ? 1 : 0);
  return {
    fwd: on("body.forward") - on("body.back"),
    lat: on("body.strafe-right") - on("body.strafe-left"),
    climb: on("climb.up") - on("climb.down"),
    yaw: on("yaw.right") - on("yaw.left"),
  };
}

/** What the held arrows add up to, as a gimbal rate in −1..1 per axis. Pure. */
export function gimbalRateFromHeld(held: ReadonlySet<Action>): GimbalRate {
  const on = (a: Action) => (held.has(a) ? 1 : 0);
  return { pan: on("head.pan-right") - on("head.pan-left"), tilt: on("head.tilt-up") - on("head.tilt-down") };
}

/**
 * Keys and the R stick drive the same gimbal, so they add and clamp: an arrow held while the thumb is on
 * the stick is one rate, not two writers. Stick up (y < 0 on screen) is tilt up. Pure.
 */
export function combineGimbalRate(keys: GimbalRate, stick: { x: number; y: number } | null): GimbalRate {
  const c = (v: number) => Math.max(-1, Math.min(1, v));
  return { pan: c(keys.pan + (stick?.x ?? 0)), tilt: c(keys.tilt - (stick?.y ?? 0)) };
}

/** True when the key press belongs to a text field, not to the aircraft. */
export function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== "string") return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable === true;
}

export interface ControlsHandlers {
  onTarget: () => void;
  onSlot: (n: 1 | 2 | 3) => void;
  onCycle: () => void;
  onFire: () => void;
  onCapture: () => void;
  onApprove: () => void;
}

export interface UseControlsOptions {
  /** Whether keys should do anything at all right now — a targeteer's device should not fly, and vice versa. */
  enabled: boolean;
  /** The ref the flight loop reads. Written in place; the loop never re-subscribes. */
  stick: React.MutableRefObject<StickAxes>;
  /** Called every animation frame with the arrows' rate while any arrow is held; null when none is. */
  onGimbalRate: (r: GimbalRate | null, dtS: number) => void;
  /** The R thumb stick's calibrated reading, if the screen has one. Added to the arrows each frame. */
  headStick?: React.MutableRefObject<{ x: number; y: number }>;
  handlers: ControlsHandlers;
  /** Which of the held axes this seat may drive. A targeteer's device gets the gimbal, not the body. */
  mayFly: boolean;
  mayAim: boolean;
}

/**
 * Mount once. Effect dependencies are only `enabled`, `mayFly`, `mayAim` — everything that changes fast
 * is read through refs, so the listeners live as long as the round does.
 */
export function useControls(o: UseControlsOptions): void {
  const handlers = useRef(o.handlers); handlers.current = o.handlers;
  const rate = useRef(o.onGimbalRate); rate.current = o.onGimbalRate;
  const stick = o.stick;
  const headStick = o.headStick;
  const held = useRef(new Set<Action>());
  // Which axes the keys drove last frame, so a released key writes zero once and then leaves the stick alone.
  const lastBody = useRef(false), lastClimb = useRef(false), lastYaw = useRef(false);

  useEffect(() => {
    if (!o.enabled || typeof window === "undefined") return;
    const H = held.current;
    H.clear();

    const apply = () => {
      if (o.mayFly) {
        const a = axesFromHeld(H);
        // Only overwrite an axis the keys are actually driving, so a thumb on the stick keeps its own axis.
        const anyBody = H.has("body.forward") || H.has("body.back") || H.has("body.strafe-left") || H.has("body.strafe-right");
        const anyClimb = H.has("climb.up") || H.has("climb.down");
        const anyYaw = H.has("yaw.left") || H.has("yaw.right");
        if (anyBody || lastBody.current) { stick.current.fwd = a.fwd; stick.current.lat = a.lat; }
        if (anyClimb || lastClimb.current) stick.current.climb = a.climb;
        if (anyYaw || lastYaw.current) stick.current.yaw = a.yaw;
        lastBody.current = anyBody; lastClimb.current = anyClimb; lastYaw.current = anyYaw;
      }
    };

    const down = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const a = KEY_TO_ACTION[e.code];
      if (!a) return;
      if (HELD_ACTIONS.has(a)) {
        const isHead = a.startsWith("head.");
        if ((isHead && !o.mayAim) || (!isHead && !o.mayFly)) return;
        e.preventDefault();
        if (e.repeat) return;
        H.add(a); apply();
        return;
      }
      e.preventDefault();
      if (e.repeat) return;                                   // a held F is not a stream of shots
      const h = handlers.current;
      if (!o.mayAim) return;                                  // one-shots are the targeteer's
      if (a === "target.cycle") h.onCycle();
      else if (a === "target.slot-1") h.onSlot(1);
      else if (a === "target.slot-2") h.onSlot(2);
      else if (a === "target.slot-3") h.onSlot(3);
      else if (a === "fire") h.onFire();
      else if (a === "capture") h.onCapture();
      else if (a === "approve") h.onApprove();
    };
    const up = (e: KeyboardEvent) => {
      const a = KEY_TO_ACTION[e.code];
      if (a && H.has(a)) { H.delete(a); apply(); }
    };
    // Losing the window mid-hold must not leave an axis pinned. A key released on another tab never
    // reaches us, so the blur is the release.
    const blur = () => { H.clear(); apply(); lastBody.current = lastClimb.current = lastYaw.current = false; if (o.mayFly) { stick.current.fwd = 0; stick.current.lat = 0; stick.current.climb = 0; stick.current.yaw = 0; } };

    // The arrows are a RATE: integrated per frame by the caller through command(), so the gimbal obeys
    // its slew law. Reported as null when no arrow is held, so the caller does nothing rather than
    // integrating zero sixty times a second.
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const g = combineGimbalRate(gimbalRateFromHeld(H), headStick?.current ?? null);
      rate.current(g.pan === 0 && g.tilt === 0 ? null : g, dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      blur();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.enabled, o.mayFly, o.mayAim]);
}

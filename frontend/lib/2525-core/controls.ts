// EXEL-2525-CONTROLS-1 — the operator deck's bindings, AS DATA, for every 2525 vehicle.
//
// Operator 2026-09-16, r.013 through r.075: "operator deck is on the glass, same bindings as a drone / droid /
// avatar … Same map on turret, VTOL, Manta, Ark, MASS droid — one mount, two seats."
//
// This is a transcription of `window.CONTROLS` from the operator's own build (docs/drone-2525/operator-deck/
// drone-2525_r.075.html), byte-checked across eleven revisions: the block has been IDENTICAL from r.013 to
// r.075 apart from its revision field, so it is a settled contract and not a moving target. It lives in
// lib/2525-core rather than lib/drone-2525 on purpose — it names six vehicles, and only one of them exists
// in this repo today. Manta, Ark, Security and the droid import THIS file when their turn comes, rather than
// each typing the same map again, which is the drift WIREFRAME-CORE U-WF-05 exists to prevent.
//
// Pure data and pure functions. No React, no DOM, no drone import. A gate (tests/controls-schema.test.mjs)
// asserts this file says exactly what r.075 says, field for field, and that the vehicle list is not quietly
// narrowed to the one vehicle that happens to exist.

export const CONTROLS_SCHEMA = "EXEL-2525-CONTROLS-1" as const;

/** The six the operator named. Order is his. Only `turret` and `vtol-quadwing` exist in this repo today. */
export const VEHICLES = [
  "turret", "vtol-quadwing", "manta-99-66", "manta-mini-66-33", "ark-sail-33", "mass-droid",
] as const;
export type Vehicle = (typeof VEHICLES)[number];

export interface StickBinding {
  role: string;
  up: string; down: string; left: string; right: string;
  /** The key cluster that drives the same axes when there is no stick. */
  keys: "WASD" | "ARROWS";
}

/**
 * The bindings, verbatim. The two sticks are the operator surface; the aux keys and the touch gestures are
 * redundant paths onto the same actions, and voice is a path for TARGET, not a replacement for it.
 */
export const EXEL_2525_CONTROLS = {
  schema: CONTROLS_SCHEMA,
  version: "00.00",
  revision: "0.075",
  vehicle: VEHICLES,
  sticks: {
    L: { role: "BODY", up: "forward", down: "back", left: "strafe-left", right: "strafe-right", keys: "WASD" },
    R: { role: "HEAD/GIMBAL", up: "tilt-up", down: "tilt-down", left: "pan-left", right: "pan-right", keys: "ARROWS" },
  } satisfies Record<"L" | "R", StickBinding>,
  aux: {
    yaw: "QE", climb: "UJ", targetCycle: "T", slots: "123", fire: "F", capture: "C",
    voice: ["T 1", "T 2", "T 3", "F 3", "CAPTURE"],
  },
  touch: {
    tap: "assign T1 if cursor near object",
    doubleTap: "FIRE",
    dragView: "gimbal look if HI",
  },
  seats: {
    pilot: "canopy +0.18L",
    targeteer: "belly gimbal -0.15L",
    turret: "same point sep 0",
  },
  authority: "named HI required before AI fire",
  share: "paste window.CONTROLS and window.PARITY.contract",
} as const;

/**
 * THE SEAT GEOMETRY, AS NUMBERS. The strings above are the operator's own phrasing; these are the values
 * his CONTRACT block declares (`seats:{pilot:{f:0.18,r:0,u:0.12},tgt:{f:-0.15,r:0,u:-0.04},turretSep:0}`)
 * and the ones lib/drone-2525/seat-view.ts adopts as canonical. Fractions of the FUSELAGE, never metres,
 * so they scale with the aircraft for free. Note the targeteer sits AFT of centre.
 */
export const SEAT_GEOMETRY = {
  pilot: { f: 0.18, r: 0, u: 0.12 },
  targeteer: { f: -0.15, r: 0, u: -0.04 },
  turretSep: 0,
} as const;

// ── THE ACTIONS A BINDING NAMES ───────────────────────────────────────────────────────────────────
// Every path — stick, key, tap, voice — resolves to one of these. A deck that can emit an action this
// list does not name has drifted from the contract, and the gate refuses it.
export const ACTIONS = [
  "body.forward", "body.back", "body.strafe-left", "body.strafe-right",
  "head.tilt-up", "head.tilt-down", "head.pan-left", "head.pan-right",
  "yaw.left", "yaw.right", "climb.up", "climb.down",
  "target.cycle", "target.slot-1", "target.slot-2", "target.slot-3",
  "approve", "fire", "capture",
] as const;
export type Action = (typeof ACTIONS)[number];

/**
 * KEY → ACTION, derived from the schema rather than typed beside it, so the two cannot disagree. Uses
 * KeyboardEvent.code so a layout that puts Q somewhere else still works by position — which is what a
 * stick replacement should do. Approve has no key in r.075's schema; it is a face button and a net message.
 */
export const KEY_TO_ACTION: Readonly<Record<string, Action>> = {
  KeyW: "body.forward", KeyS: "body.back", KeyA: "body.strafe-left", KeyD: "body.strafe-right",
  ArrowUp: "head.tilt-up", ArrowDown: "head.tilt-down", ArrowLeft: "head.pan-left", ArrowRight: "head.pan-right",
  KeyQ: "yaw.left", KeyE: "yaw.right",
  KeyU: "climb.up", KeyJ: "climb.down",
  KeyT: "target.cycle",
  Digit1: "target.slot-1", Digit2: "target.slot-2", Digit3: "target.slot-3",
  Numpad1: "target.slot-1", Numpad2: "target.slot-2", Numpad3: "target.slot-3",
  KeyF: "fire", KeyC: "capture",
};

/** The held-axis keys, as opposed to the one-shot ones. A held key writes a stick axis every frame. */
export const HELD_ACTIONS: ReadonlySet<Action> = new Set<Action>([
  "body.forward", "body.back", "body.strafe-left", "body.strafe-right",
  "head.tilt-up", "head.tilt-down", "head.pan-left", "head.pan-right",
  "yaw.left", "yaw.right", "climb.up", "climb.down",
]);

/**
 * VOICE → ACTION, r.075's grammar ported verbatim. Returns null for anything it does not recognise, and it
 * recognises very little on purpose: "target" with an optional slot, "fire" with an optional slot, and
 * "capture"/"photo". A phrase this does not match does nothing, silently, which is the correct behaviour for
 * a microphone in a room full of people.
 *
 * Voice is a path for TARGET, never a permission. A spoken "fire" is a request that still needs a red box.
 */
const NUM: Record<string, 1 | 2 | 3> = { one: 1, two: 2, three: 3, "1": 1, "2": 2, "3": 3 };
export function voiceToAction(transcript: string): { action: Action; slot?: 1 | 2 | 3 } | null {
  const t = transcript.toLowerCase().trim();
  const m = t.match(/\b(?:target|t)\s*(one|two|three|1|2|3)?\b/);
  if (m) return m[1] ? { action: `target.slot-${NUM[m[1]]}` as Action, slot: NUM[m[1]] } : { action: "target.cycle" };
  const f = t.match(/\b(?:fire|f)\s*(one|two|three|1|2|3)?\b/);
  if (f) return f[1] ? { action: "fire", slot: NUM[f[1]] } : { action: "fire" };
  if (/\b(?:capture|photo)\b/.test(t)) return { action: "capture" };
  if (/\bapprove\b/.test(t)) return { action: "approve" };
  return null;
}

// ── THE R-CORE LOOP AND ITS FIVE SYSTEMS, from the same build ─────────────────────────────────────
/**
 * REALITY → OBSERVE → RECORD → REPLAY → SIMULATE → VERIFY → IMPROVE → REALITY. Eight entries because it is
 * a cycle and the operator writes it closed. (His prompt file states a seven-step development doctrine,
 * PLAY → RECORD → REPLAY → COMPARE → QUALIFY → IMPROVE → SHARE; that is the prototype-scale expression of
 * this one, kept as DOCTRINE below rather than merged into it.)
 */
export const RCORE_LOOP = [
  "REALITY", "OBSERVE", "RECORD", "REPLAY", "SIMULATE", "VERIFY", "IMPROVE", "REALITY",
] as const;
export const DOCTRINE = ["PLAY", "RECORD", "REPLAY", "COMPARE", "QUALIFY", "IMPROVE", "SHARE"] as const;

/** The five systems, which are Vision • 2525 sections III–VII by another name. */
export const RCORE_SYS = {
  COMM: "COMM-2525", LINK: "LINK-2525", EDGE: "EDGE-2525", SYNC: "SYNC-2525", UCRS: "UCRS-2525",
} as const;

/**
 * R-CORE — Recursive Continuous Operational Reality Ecosystem. Kept here as the one sentence the operator
 * gave, because every surface that shows the loop should say the same thing about what it is for.
 */
export const RCORE_SENTENCE =
  "R-CORE coordinates; it does not dominate. Humanity remains the authority." as const;

/**
 * THE FIVE PILLARS — the five systems with the learnings every 2525 project has paid for (operator 2026-10-23:
 * "update R-CORE 5 pillars per all learnings of all 2525 projects"). RCORE_SYS keeps the bare name→code map that
 * controls-schema pins; this carries the role (Vision • 2525 §III–VII) and one grounded learning each. A learning
 * is a law the work proved, not a wish. Append to a learning; do not rewrite it — a pillar's record is append-only
 * like every other (SYNC). Drone-2525 evidence cites the current revision only, never a rewrite of its history.
 */
export const RCORE_PILLARS = [
  {
    code: "COMM-2525", name: "COMM", section: "III", role: "the signal fabric that keeps people connected when pressure rises",
    learning:
      "Redundancy is counted in INDEPENDENT PROVIDERS, not in code paths. The live-response Trinity shipped as three send " +
      "paths and four receive channels, but all terminated at one vendor — one provider wearing three coats, so a single " +
      "outage was a total outage while the sender was told 'delivered'. Genuine redundancy adds providers in different " +
      "failure domains (Cloudflare KV, a device-held outbox) and gates the provider count. Nothing is swallowed: every " +
      "attempt and every failure is recorded, and a path that fell back announces its lateness rather than lying by silence.",
  },
  {
    code: "LINK-2525", name: "LINK", section: "IV", role: "coordination continuity — the mission carries its context with it",
    learning:
      "A message addressed to one system never lands on another's mark, and a retry carries enough context to be re-run " +
      "correctly later. The two-phone lawn room (WebRTC + the lawn verbs + the light-codex pairing) is LINK in miniature: " +
      "each system drives only its own track, a peer's row for the other system is record-only (Drone-2525 r.229, H03 — no " +
      "cross-talk), and one replay hash holds on both phones. Link 16 is 512×3 (A–B); LINK-2525 evolves to 3600×7 (A–G) — " +
      "the UCRS bearing circle × seven levels — kept as the forward addressing spec (DD-150), not retrofitted onto a shipped rung.",
  },
  {
    code: "EDGE-2525", name: "EDGE", section: "V", role: "the edge works when the centre is unreachable — the device holds the work",
    learning:
      "The point of need holds the work when the centre is gone. The operator deck is ONE self-contained file that fetches " +
      "nothing and plays offline — the strongest EDGE proof in the system. A completed signature lives on the signer's phone " +
      "and carries every mark even when the database is unreachable: a completed signature is never discarded. And a screen a " +
      "person can reach never names a database, a migration or an RPC — the machine recedes so the shared intent stays visible.",
  },
  {
    code: "SYNC-2525", name: "SYNC", section: "VI", role: "operational truth preserved when events move faster than institutions can record them",
    learning:
      "The record is itself a redundancy mechanism — what live delivery loses, replay reconstructs. The append-only ledger, " +
      "the chain-hashed register and the deck's embedded R-CORE record (carried through the revision before its own, lag exactly " +
      "one) make the past replay what it actually shipped. A new edition is an APPEND, never an edit; a correction is a new row. " +
      "Drone-2525's training record is SYNC: Train Down (a start button and a timer to knock every target down) and Qual-40 " +
      "(the military-grade annual qualification) write START/TIME and hits, misses and rounds as rows, while Train Up — the " +
      "default on the Range and every training location, all targets up with no start, a hit knocking a target down and it " +
      "popping back up for endless practice — is infinite and writes no scored run.",
  },
  {
    code: "UCRS-2525", name: "UCRS", section: "VII", role: "one spatial language for every mission",
    learning:
      "Every bearing is UCRS-2525, written AAAA.BBBB — 0000 and 3600 are north, 1800 is south, 1800.5 reads 1800.1800. The " +
      "Capital-lawn seats (A1–A4, the S1/S2 cues, C1/C2, G1, the T1 high track) each carry a UCRS arc, and the deck's targeting " +
      "and the lawn siting record speak one coordinate language — so a message arriving by any route is recognisably about the " +
      "same place, and no system has to translate another's grid.",
  },
] as const;

/**
 * THE FIDELITY LAW, cutting across all five pillars (operator, Trinity-everywhere): a shot is scored from the SHARED
 * STATE — position, time, and TARGET → APPROVE → FIRE — never from the picture. A low-fidelity wire client and a
 * high-resolution client read the same truth, so the 1983 wireframe view ships and richer engines attach later as
 * views over the same record. Silence is never consent; humanity remains the authority (RCORE_SENTENCE).
 */
export const RCORE_FIDELITY_LAW =
  "A shot is scored from the shared state — position, time, and TARGET → APPROVE → FIRE — never from the picture." as const;

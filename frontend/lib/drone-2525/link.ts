// TWO PEOPLE, TWO DEVICES, ONE AIRCRAFT (DRN-09).
//
// Operator 2026-09-15: "Ensure 2x people on drone has one on control as PILOT and another on phone or PC on
// gimbal as Targeteer." The single-screen version that shipped before this was one person holding both
// seats, which is not a crew — it is a person with two hands.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE INVARIANT: A SEAT MAY ONLY SEND WHAT THAT SEAT CONTROLS.
//
// The pilot flies and cannot aim, capture or shoot. The targeteer aims, captures and shoots, and cannot
// fly. This is not a UI convention that a future screen could quietly break — `authored` refuses a message
// whose payload does not belong to the seat that sent it, and every transport goes through it on the way
// in as well as on the way out. Two people who can both fly are not a crew either.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// Pure: no clock, no DOM, no network, no Math.random. The transports live in use-drone-link.ts; everything
// that DECIDES anything is here, where it can be tested without two phones.
import type { FlightState } from "./flight";

export type Seat = "pilot" | "targeteer";
export const SEATS: Seat[] = ["pilot", "targeteer"];
export const otherSeat = (s: Seat): Seat => (s === "pilot" ? "targeteer" : "pilot");

/** What the PILOT is allowed to say: where the aircraft is and what it is doing. Nothing about aiming. */
export interface FlightMsg {
  kind: "flight";
  seat: "pilot";
  seq: number;
  atMs: number;
  flight: Pick<FlightState, "e" | "n" | "aglM" | "ve" | "vn" | "vu" | "headingDeg" | "mode" | "energy">;
}

/** What the TARGETEER is allowed to say: where the camera is looking and what it did. Nothing about flying. */
export interface GimbalMsg {
  kind: "gimbal";
  seat: "targeteer";
  seq: number;
  atMs: number;
  az: number;
  el: number;
  /** An action already taken, so the other screen can show it — never an instruction to the pilot. */
  did?: "capture" | "shoot" | null;
  doorId?: string | null;
}

/** Either seat may say it is here. Presence is not control. */
export interface HelloMsg { kind: "hello"; seat: Seat; seq: number; atMs: number; name: string }

export type LinkMsg = FlightMsg | GimbalMsg | HelloMsg;

/**
 * THE GATE. Does this message belong to the seat that claims to have sent it?
 * Called on send AND on receive: a device that trusts what arrives is a device that can be driven by
 * anything that can reach the channel.
 */
export function authored(m: LinkMsg): { ok: boolean; why: string } {
  if (!m || typeof m !== "object") return { ok: false, why: "not a message" };
  if (!SEATS.includes(m.seat)) return { ok: false, why: `"${String(m.seat)}" is not a seat` };
  if (!Number.isFinite(m.seq) || !Number.isFinite(m.atMs)) return { ok: false, why: "no sequence or time" };
  if (m.kind === "flight") {
    if (m.seat !== "pilot") return { ok: false, why: "only the pilot flies" };
    const f = m.flight;
    if (!f || ![f.e, f.n, f.aglM, f.ve, f.vn, f.vu, f.headingDeg, f.energy].every(Number.isFinite))
      return { ok: false, why: "the flight state is not a set of numbers" };
    return { ok: true, why: "the pilot said where the aircraft is" };
  }
  if (m.kind === "gimbal") {
    if (m.seat !== "targeteer") return { ok: false, why: "only the targeteer aims" };
    if (!Number.isFinite(m.az) || !Number.isFinite(m.el)) return { ok: false, why: "the aim is not a pair of angles" };
    if (m.did != null && m.did !== "capture" && m.did !== "shoot") return { ok: false, why: `"${m.did}" is not something a targeteer does` };
    return { ok: true, why: "the targeteer said where the camera is looking" };
  }
  if (m.kind === "hello") {
    if (typeof m.name !== "string") return { ok: false, why: "a seat arriving must say who it is" };
    return { ok: true, why: "a seat arrived" };
  }
  return { ok: false, why: `"${String((m as { kind?: unknown }).kind)}" is not a kind of message` };
}

// ── WHAT THIS DEVICE KNOWS ABOUT THE OTHER ONE ──────────────────────────────────────────────────────
export interface LinkState {
  /** The seat THIS device holds. It never changes while a round is running. */
  me: Seat;
  code: string;
  /** Last accepted message from the other seat, and when. */
  theirFlight: FlightMsg | null;
  theirGimbal: GimbalMsg | null;
  theirName: string;
  lastHeardMs: number;
  /** Sequence numbers already seen, so a message arriving twice on two transports lands once. */
  seenSeq: Record<Seat, number>;
  accepted: number;
  refused: number;
  lastRefusal: string;
}

export const initLink = (me: Seat, code: string): LinkState => ({
  me, code, theirFlight: null, theirGimbal: null, theirName: "",
  lastHeardMs: 0, seenSeq: { pilot: -1, targeteer: -1 }, accepted: 0, refused: 0, lastRefusal: "",
});

/** How long after the last word from the other seat this device calls the link quiet. */
export const LINK_QUIET_MS = 4000;
export const linkUp = (s: LinkState, nowMs: number): boolean =>
  s.lastHeardMs > 0 && nowMs - s.lastHeardMs < LINK_QUIET_MS;

/**
 * Take one message off any transport. Refuses in three cases, each counted and named:
 * it is not authored by the seat it claims, it is this device's own echo, or it is older than one already
 * accepted from that seat. Duplicates are the NORMAL case with several transports, not an error.
 */
export function receive(s: LinkState, m: LinkMsg, nowMs: number): LinkState {
  const a = authored(m);
  if (!a.ok) return { ...s, refused: s.refused + 1, lastRefusal: a.why };
  if (m.seat === s.me) return s;                                   // our own words, come back around
  if (m.seq <= s.seenSeq[m.seat]) return s;                        // already had this one, on another path
  const next: LinkState = {
    ...s,
    seenSeq: { ...s.seenSeq, [m.seat]: m.seq },
    lastHeardMs: nowMs,
    accepted: s.accepted + 1,
  };
  if (m.kind === "flight") return { ...next, theirFlight: m };
  if (m.kind === "gimbal") return { ...next, theirGimbal: m };
  return { ...next, theirName: m.name || next.theirName };
}

/** What this device is allowed to build and send. A seat cannot compose the other seat's message. */
export function compose(s: LinkState, seq: number, atMs: number, payload:
  | { kind: "flight"; flight: FlightMsg["flight"] }
  | { kind: "gimbal"; az: number; el: number; did?: GimbalMsg["did"]; doorId?: string | null }
  | { kind: "hello"; name: string },
): LinkMsg | null {
  if (payload.kind === "flight" && s.me !== "pilot") return null;
  if (payload.kind === "gimbal" && s.me !== "targeteer") return null;
  const m = { ...payload, seat: s.me, seq, atMs } as LinkMsg;
  return authored(m).ok ? m : null;
}

/** One line for the HUD: who is on the other end, and whether they are still there. */
export const linkLine = (s: LinkState, nowMs: number): string => {
  const who = otherSeat(s.me);
  const name = s.theirName ? ` ${s.theirName}` : "";
  if (!linkUp(s, nowMs)) return `${who}${name} — not heard from`;
  return `${who}${name} — connected · ${s.accepted} received${s.refused ? `, ${s.refused} refused` : ""}`;
};

// ── THE JOIN CODE ───────────────────────────────────────────────────────────────────────────────────
/** The second person opens this on their own phone or computer, already in the seat the first one is not. */
export const seatUrl = (origin: string, code: string, seat: Seat): string =>
  `${origin.replace(/\/$/, "")}/main/Drone-2525/?crew=${encodeURIComponent(code)}&seat=${seat}`;

/** Read a seat out of a link somebody opened. Anything unrecognised means "no seat", never a default one. */
export function seatFromParams(search: string): { code: string; seat: Seat } | null {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const code = (p.get("crew") || "").trim().toUpperCase();
  const seat = p.get("seat");
  if (!code) return null;
  if (seat !== "pilot" && seat !== "targeteer") return null;
  return { code, seat };
}

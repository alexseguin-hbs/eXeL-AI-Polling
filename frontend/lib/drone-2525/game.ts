// THE ROUND (DRN-06) — capture, shoot, score, replay.
//
// INVARIANT, in the operator's terms (AAR 2026-09-09, FIX THE CLASS): A COMPLETED ACTION IS NEVER LOST.
// A capture or a hit is appended to the replay log in the SAME reducer step that changes the score — one
// pure transition, so there is no window in which a player has been credited but the record does not show
// it, and none in which the record shows something the score does not. Nothing here touches storage, a
// clock or the network, because every one of those is a way to lose half a transition.
//
// Second invariant: A SHOT THE WORLD BLOCKS IS A MISS WITH A REASON, never a silent no-op. Every attempt
// produces an event, so "nothing happened when I pressed fire" cannot occur.
import type { ArenaDoor } from "./arena-model";
import type { LosResult } from "./los";
import { emptyTags, isActionable, type TagState, type TargetView } from "./targets";

export type GameEventKind = "capture" | "hit" | "miss" | "start" | "end";
export interface GameEvent {
  seq: number;
  tMs: number;
  kind: GameEventKind;
  doorId?: string;
  /** Plain words: what happened, or why it did not. Shown to a person, never a data structure name. */
  why: string;
  az?: number; el?: number; rangeM?: number;
  /** Segment count of the edge set the sensor extracted at capture — a capture stores edges, not a photo. */
  edges?: number;
}

export interface GameState {
  startedAtMs: number;
  tags: TagState;
  events: GameEvent[];
  captures: number;
  hits: number;
  misses: number;
  seq: number;
  finished: boolean;
}

export const initGame = (tMs = 0): GameState => ({
  startedAtMs: tMs, tags: emptyTags(), captures: 0, hits: 0, misses: 0, seq: 1, finished: false,
  events: [{ seq: 0, tMs, kind: "start", why: "round opened" }],
});

/** Score: a door counts once it is TAGGED — captured and then hit. Captures alone are progress, not points. */
export const score = (g: GameState) => ({
  tagged: g.tags.tagged.size,
  captured: g.tags.captured.size,
  hits: g.hits,
  misses: g.misses,
  accuracy: g.hits + g.misses === 0 ? 1 : g.hits / (g.hits + g.misses),
});

const append = (g: GameState, e: Omit<GameEvent, "seq">): GameEvent[] => [...g.events, { ...e, seq: g.seq }];

export interface CaptureArgs { tMs: number; target: TargetView | null; los: LosResult | null; edges: number; az: number; el: number }

/**
 * CAPTURE — the sensor stores the extracted EDGE SET of what it is looking at. It is the first half of
 * tagging a door and it can fail for exactly three reasons, each of which is said out loud.
 */
export function capture(g: GameState, a: CaptureArgs): GameState {
  const base = { tMs: a.tMs, az: a.az, el: a.el, edges: a.edges };
  if (g.finished) return g;
  if (!a.target || !isActionable(a.target))
    return { ...g, seq: g.seq + 1, misses: g.misses, events: append(g, { ...base, kind: "miss", why: "no door in frame" }) };
  if (a.los && !a.los.clear)
    return { ...g, seq: g.seq + 1, events: append(g, { ...base, kind: "miss", doorId: a.target.door.id, why: "the way is blocked", rangeM: a.los.rangeM }) };
  if (g.tags.captured.has(a.target.door.id))
    return { ...g, seq: g.seq + 1, events: append(g, { ...base, kind: "miss", doorId: a.target.door.id, why: "already captured" }) };

  // One step: the tag, the count and the record move together or not at all.
  const captured = new Set(g.tags.captured); captured.add(a.target.door.id);
  return {
    ...g, seq: g.seq + 1, captures: g.captures + 1,
    tags: { captured, tagged: g.tags.tagged },
    events: append(g, { ...base, kind: "capture", doorId: a.target.door.id, why: "picture taken", rangeM: a.los?.rangeM }),
  };
}

export interface ShootArgs { tMs: number; target: TargetView | null; los: LosResult | null; onTarget: boolean; az: number; el: number; reason?: string }

/** SHOOT — only lands on a door that was captured first, is up now, is in the clear, and is actually aimed at. */
export function shoot(g: GameState, a: ShootArgs): GameState {
  const base = { tMs: a.tMs, az: a.az, el: a.el };
  if (g.finished) return g;
  const miss = (why: string, doorId?: string, rangeM?: number): GameState =>
    ({ ...g, seq: g.seq + 1, misses: g.misses + 1, events: append(g, { ...base, kind: "miss", doorId, why, rangeM }) });

  if (!a.target || !isActionable(a.target)) return miss("no door in frame");
  const id = a.target.door.id;
  if (!a.onTarget) return miss("still slewing", id);
  if (a.los && !a.los.clear) return miss(a.reason ?? "the way is blocked", id, a.los.rangeM);
  if (!g.tags.captured.has(id)) return miss("capture the door before you shoot it", id);
  if (g.tags.tagged.has(id)) return miss("already tagged", id);

  const tagged = new Set(g.tags.tagged); tagged.add(id);
  return {
    ...g, seq: g.seq + 1, hits: g.hits + 1,
    tags: { captured: g.tags.captured, tagged },
    events: append(g, { ...base, kind: "hit", doorId: id, why: "door tagged", rangeM: a.los?.rangeM }),
  };
}

export const endRound = (g: GameState, tMs: number): GameState =>
  g.finished ? g : { ...g, finished: true, seq: g.seq + 1, events: append(g, { tMs, kind: "end", why: "round closed" }) };

/** The replay bundle (U-WF-06): everything needed to argue about the round after it ends. */
export interface ReplayBundle {
  version: string; revision: string; modelHash: string; seed: number; mount: string;
  startedAtMs: number; events: GameEvent[]; score: ReturnType<typeof score>; doors: string[];
}
export const bundle = (g: GameState, meta: { version: string; revision: string; modelHash: string; seed: number; mount: string }, doors: readonly ArenaDoor[]): ReplayBundle =>
  ({ ...meta, startedAtMs: g.startedAtMs, events: g.events, score: score(g), doors: doors.map((d) => d.id) });

/** Every event, in one line each, in the order they happened — the score's own working. */
export const transcript = (g: GameState): string[] =>
  g.events.map((e) => `${(e.tMs / 1000).toFixed(1)}s  ${e.kind.padEnd(7)} ${e.doorId ?? "—"}  ${e.why}`);

/**
 * ARCHITECT-2525 · CIRCULATION — is the house WALKABLE? (LIV-1, operator 2026-11-11 "make sq footage is livable 900 sq ft";
 * 12-AsM plan review P0: the seeded house was door-DISCONNECTED — from the front door only 3/9 rooms were reachable.)
 * ===========================================================================================================================
 * The ONE source for the door-connectivity graph: the placed opening objects in each room's STANDARD_LAYOUT (a door OR a cased
 * opening on a shared INTERIOR wall is a passage; a window is not). Every surface that asks "can you walk from A to B" — the
 * circulation gate, the livability metric, the 3D walk — reads THIS, so the drawn plan and the walk can never tell two stories.
 * Pure + deterministic (no Date.now / Math.random) → replayable, gate-checked.
 */
import { TINY_ROOM_LAYOUT, type RoomCell } from "./room-layout";
import { defaultObjectsForRoom, wallOfObject, type PlacedObject, type Wall } from "./room-objects";

/** The private rooms of the master suite — reachable only from within the suite, never a through-route to a public room. */
export const SUITE_KEYS = ["M", "B", "C"] as const;
/** The public rooms — the social + service zone, connected from the front door without passing through a private room. */
export const PUBLIC_KEYS = ["E", "D", "K", "L", "O", "S"] as const;
/** The front-door room (the entry). */
export const ENTRY_KEY = "E";

/** The neighbour room key across a given wall of a cell (row 0 = North; N→row-1, S→row+1, W→col-1, E→col+1), or null at the shell. */
export function neighbourOf(cell: Pick<RoomCell, "row" | "col">, wall: Wall, layout: RoomCell[] = TINY_ROOM_LAYOUT): string | null {
  const dr = wall === "N" ? -1 : wall === "S" ? 1 : 0;
  const dc = wall === "W" ? -1 : wall === "E" ? 1 : 0;
  return layout.find((r) => r.row === cell.row + dr && r.col === cell.col + dc)?.k ?? null;
}

/** An opening object is a passage: a door (swing/slide) OR a cased opening. Windows are not passages. */
export function isPassage(o: PlacedObject): boolean {
  return o.kind === "door";
}

export interface CirculationGraph {
  edges: Set<string>;                         // "A-B" (sorted), one per connecting opening on a shared interior wall
  adj: Record<string, string[]>;              // adjacency list
  keys: string[];                             // all room keys
}

/** Build the undirected room-connectivity graph from the placed opening objects of every room. */
export function buildGraph(layout: RoomCell[] = TINY_ROOM_LAYOUT, objectsFor: (k: string) => PlacedObject[] = defaultObjectsForRoom): CirculationGraph {
  const cellByKey: Record<string, RoomCell> = {};
  for (const r of layout) cellByKey[r.k] = r;
  const edges = new Set<string>();
  for (const r of layout) {
    for (const o of objectsFor(r.k)) {
      if (!isPassage(o)) continue;
      const n = neighbourOf(r, wallOfObject(o), layout);
      if (n) edges.add([r.k, n].sort().join("-"));
    }
  }
  const adj: Record<string, string[]> = {};
  for (const e of edges) {
    const [a, b] = e.split("-");
    (adj[a] ??= []).push(b);
    (adj[b] ??= []).push(a);
  }
  return { edges, adj, keys: layout.map((r) => r.k) };
}

/** The set of rooms reachable from `start` over the graph, optionally with some nodes BLOCKED (removed) — for through-route tests. */
export function reachable(g: CirculationGraph, start: string, blocked: Set<string> = new Set()): Set<string> {
  const seen = new Set<string>([start]);
  const q = [start];
  while (q.length) {
    const x = q.shift()!;
    for (const y of g.adj[x] ?? []) if (!blocked.has(y) && !seen.has(y)) { seen.add(y); q.push(y); }
  }
  return seen;
}

export interface CirculationReport {
  edges: string[];
  reachableFromEntry: string[];
  severed: string[];                          // rooms NOT reachable from the entry — must be empty for a livable house
  suiteConnected: boolean;                    // the master suite {M,B,C} is internally connected
  suiteAttachPoints: string[];                // public rooms that open into the suite (should be exactly one — the suite entry)
  publicThroughSuite: string[];               // public rooms reachable ONLY by passing through a suite room (should be empty)
}

/** The full livability-circulation report for a layout. A livable house: severed empty · suite connected · suite attaches to
 * the public zone at exactly ONE door · no public room routes through a private suite room. */
export function circulationReport(layout: RoomCell[] = TINY_ROOM_LAYOUT, objectsFor: (k: string) => PlacedObject[] = defaultObjectsForRoom): CirculationReport {
  const g = buildGraph(layout, objectsFor);
  const present = new Set(g.keys);
  const suite = SUITE_KEYS.filter((k) => present.has(k));
  const publics = g.keys.filter((k) => !suite.includes(k as any));
  const fromEntry = reachable(g, ENTRY_KEY);
  const severed = g.keys.filter((k) => !fromEntry.has(k));
  // suite internally connected: BFS within the suite reaches every suite room from the first suite room
  const suiteSub: CirculationGraph = { edges: g.edges, keys: suite as any, adj: Object.fromEntries(suite.map((k) => [k, (g.adj[k] ?? []).filter((n) => suite.includes(n as any))])) };
  const suiteConnected = suite.length === 0 || reachable(suiteSub, suite[0]).size === suite.length;
  // suite attach points: public rooms adjacent to a suite room
  const suiteSet = new Set<string>(suite);
  const suiteAttachPoints = publics.filter((p) => (g.adj[p] ?? []).some((n) => suiteSet.has(n)));
  // public rooms that can ONLY be reached from the entry by passing through a suite room:
  const entryNoSuite = reachable(g, ENTRY_KEY, suiteSet);
  const publicThroughSuite = publics.filter((p) => p !== ENTRY_KEY && fromEntry.has(p) && !entryNoSuite.has(p));
  return {
    edges: [...g.edges].sort(),
    reachableFromEntry: [...fromEntry].sort(),
    severed: severed.sort(),
    suiteConnected,
    suiteAttachPoints: suiteAttachPoints.sort(),
    publicThroughSuite: publicThroughSuite.sort(),
  };
}

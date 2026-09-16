// FORTY-TWO AIRCRAFT — twenty-one against twenty-one (operator 2026-09-15: "optimize to 42 total").
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// WHY FLAT ARRAYS AND NOT FORTY-TWO OBJECTS.
//
// Forty-two objects rebuilt immutably on every tick is forty-two allocations a tick — 420 a second at the
// game clock, several thousand if anyone moves it to the frame clock — and every one of them becomes
// garbage. The existing mover loop in the security surface does exactly that and throttles itself to 20 fps
// because of it. Columns in `Float64Array` cost nothing per tick: `stepSwarm` writes in place and allocates
// NOTHING, which is the difference between 42 aircraft being free and 42 aircraft being the bottleneck.
//
// ONE BUDGET, TWO CONSUMERS. In an engagement the aircraft ARE the world. The swarm takes its share of the
// rung's segment budget first and the Capitol block gets the rest, so at a low rung the world thins out
// rather than the aircraft vanishing. A pilot who can see the Capitol but not the twenty-one aircraft
// closing on them has the wrong picture.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// Pure and seeded: no clock, no DOM, no Math.random. The same seed flies the same engagement.
import { GLYPH_COST, AIRFRAME_EXTENT, type GlyphBand } from "./airframe-glyph";

/** The vocabulary the security surface already uses for a side (components/security-2525/asset-icons.tsx). */
export type Affiliation = "friendly" | "hostile";
export const SIDES: Affiliation[] = ["friendly", "hostile"];

export const PER_SIDE = 21;
export const SWARM_N = PER_SIDE * 2;

/** Columns, not rows. Index 0..20 is friendly, 21..41 is hostile — the side is the index range. */
export interface Swarm {
  n: number;
  e: Float64Array; nCoord: Float64Array; aglM: Float64Array;
  ve: Float64Array; vn: Float64Array; vu: Float64Array;
  headingDeg: Float64Array;
  /** 1 while flying, 0 once removed from the engagement. Never deleted — a replay needs the whole roster. */
  alive: Float64Array;
  seed: number;
}

export const sideOf = (i: number): Affiliation => (i < PER_SIDE ? "friendly" : "hostile");
export const idOf = (i: number): string => `${sideOf(i) === "friendly" ? "B" : "R"}${String(i % PER_SIDE + 1).padStart(2, "0")}`;

/** Deterministic 32-bit mix, the one the rest of this domain uses for seeded choices. */
function mix(seed: number, i: number): number {
  let h = (seed ^ (i * 2654435761)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0; h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/**
 * Two formations facing each other across the lawn, laid out from the seed. Friendly comes from the south,
 * hostile from the north, both at a declared height band, so the first frame is already an engagement
 * rather than forty-two aircraft sitting on the grass.
 */
export function initSwarm(seed = 20260915, radiusM = 380): Swarm {
  const n = SWARM_N;
  const s: Swarm = {
    n,
    e: new Float64Array(n), nCoord: new Float64Array(n), aglM: new Float64Array(n),
    ve: new Float64Array(n), vn: new Float64Array(n), vu: new Float64Array(n),
    headingDeg: new Float64Array(n), alive: new Float64Array(n).fill(1), seed,
  };
  for (let i = 0; i < n; i++) {
    const friendly = i < PER_SIDE, k = i % PER_SIDE;
    const r = mix(seed, i);
    const spread = (k - (PER_SIDE - 1) / 2) * 34;                 // a line abreast, 34 m apart
    const depth = (k % 3) * 55;                                   // three ranks, so it reads as a formation
    s.e[i] = spread + (r - 0.5) * 18;
    s.nCoord[i] = (friendly ? -radiusM + depth : radiusM - depth) + (r - 0.5) * 18;
    s.aglM[i] = 60 + (k % 4) * 22 + r * 12;                       // stacked, so they do not occupy one plane
    s.headingDeg[i] = friendly ? 0 : 180;
    const v = 15 + r * 6;
    s.ve[i] = 0;
    s.vn[i] = friendly ? v : -v;
    s.vu[i] = 0;
  }
  return s;
}

export const CLOSE_M = 90;
const TURN_DEG_PER_S = 28;

/**
 * One tick, IN PLACE. Each aircraft steers toward the nearest living opponent and holds its height band.
 * Allocates nothing: no object literal, no array, no closure per entity. That is the entire point.
 */
export function stepSwarm(s: Swarm, dt: number): void {
  const d = Math.max(0, Math.min(0.25, dt));
  for (let i = 0; i < s.n; i++) {
    if (s.alive[i] === 0) continue;
    const mine = i < PER_SIDE;
    // Nearest living opponent, by squared distance — no square root in the inner loop.
    let best = -1, bestD2 = Infinity;
    const lo = mine ? PER_SIDE : 0, hi = mine ? s.n : PER_SIDE;
    for (let j = lo; j < hi; j++) {
      if (s.alive[j] === 0) continue;
      const de = s.e[j] - s.e[i], dn = s.nCoord[j] - s.nCoord[i];
      const d2 = de * de + dn * dn;
      if (d2 < bestD2) { bestD2 = d2; best = j; }
    }
    if (best >= 0) {
      const de = s.e[best] - s.e[i], dn = s.nCoord[best] - s.nCoord[i];
      const want = ((Math.atan2(de, dn) * 180) / Math.PI + 360) % 360;
      let turn = ((want - s.headingDeg[i] + 540) % 360) - 180;
      const step = TURN_DEG_PER_S * d;
      if (turn > step) turn = step; else if (turn < -step) turn = -step;
      s.headingDeg[i] = (s.headingDeg[i] + turn + 360) % 360;
      // Break off rather than merge: inside the close range it holds its turn instead of flying through.
      const speed = bestD2 < CLOSE_M * CLOSE_M ? 11 : 17;
      const hr = (s.headingDeg[i] * Math.PI) / 180;
      s.ve[i] = Math.sin(hr) * speed;
      s.vn[i] = Math.cos(hr) * speed;
    }
    s.e[i] += s.ve[i] * d;
    s.nCoord[i] += s.vn[i] * d;
    s.aglM[i] += s.vu[i] * d;
  }
}

/** Remove one aircraft from the engagement. It stays in the roster so a replay still has its whole story. */
export function downAircraft(s: Swarm, i: number): void {
  if (i >= 0 && i < s.n) s.alive[i] = 0;
}
export const aliveCount = (s: Swarm, side?: Affiliation): number => {
  let n = 0;
  const lo = side === "hostile" ? PER_SIDE : 0, hi = side === "friendly" ? PER_SIDE : s.n;
  for (let i = lo; i < hi; i++) if (s.alive[i] === 1) n++;
  return n;
};

// ── THE BUDGET SPLIT ────────────────────────────────────────────────────────────────────────────────
export interface SwarmDraw {
  /** How many segments the swarm will use, so the world can be given the rest. */
  cost: number;
  /** Which glyph each living aircraft gets, by distance from the eye. */
  band: GlyphBand[];
  drawn: number;
  dropped: number;
}

// ── HOW BIG IS IT ON SCREEN? (screen-size bands, 2026-09-16) ────────────────────────────────────
// This used to be two absolute distances — 260 m and 700 m — tuned against nothing, which meant the rule
// broke at every change of scale. Grow the aircraft and everything inside 700 m is a wall of overlapping
// silhouettes; shrink it, as the 1.111 m foil does, and "near" is a sub-pixel dot given 24 segments.
//
// What actually decides how much detail is worth drawing is HOW MANY PIXELS THE AIRCRAFT COVERS. That is a
// function of its span, its range and the camera — so it is computed, and it is right at 1.111 m, at
// 11.111 m and at the old 38.6 m without anyone retuning a constant. FIX THE CLASS, NOT THE INSTANCE.
export const BAND_PX = { dot: 2, far: 6, mid: 16 } as const;

/** Apparent width in pixels of an aircraft of this span, at this range, through this camera. */
export const apparentPx = (spanM: number, rangeM: number, focalPx: number): number =>
  rangeM > 0 ? (spanM * focalPx) / rangeM : Infinity;

/**
 * Which silhouette earns its segments at this apparent size. Below BAND_PX.dot the aircraft is smaller than
 * a mark can be drawn — so it gets the one-segment mark and its POSITION stays true. It is never dropped
 * for being small; the floor is on the symbol, not on the truth.
 */
export const bandFor = (spanM: number, rangeM: number, focalPx: number): GlyphBand => {
  const px = apparentPx(spanM, rangeM, focalPx);
  return px < BAND_PX.dot ? "dot" : px < BAND_PX.far ? "far" : px < BAND_PX.mid ? "mid" : "near";
};

/** The camera the planner reasons about when a caller has not told it one. Matches the arena's own. */
export const DEFAULT_FOCAL_PX = 620;

/**
 * Choose a glyph per aircraft and report the cost, in TWO PASSES, because the order matters:
 *
 *   1. EVERY LIVING AIRCRAFT GETS DRAWN if the budget can hold it at all, at the smallest size.
 *   2. Only then is the surplus spent upgrading the nearest ones to a bigger silhouette.
 *
 * The first draft did it the other way round — nearest first, at whatever size it wanted — and the table
 * told on it immediately: the seven closest aircraft ate the whole share and the other thirty-five
 * disappeared. An aircraft you cannot see is not a detail you gave up; it is an aircraft you do not know
 * about. Nothing vanishes while anything else still has detail to surrender.
 */
export function planSwarmDraw(
  s: Swarm, eyeE: number, eyeN: number, budget: number,
  opts: { spanM?: number; focalPx?: number } = {},
): SwarmDraw {
  const spanM = opts.spanM ?? AIRFRAME_EXTENT.spanM;
  const focalPx = opts.focalPx ?? DEFAULT_FOCAL_PX;
  const band: GlyphBand[] = new Array(s.n).fill("dot");
  const order: number[] = [];
  for (let i = 0; i < s.n; i++) if (s.alive[i] === 1) order.push(i);
  // Nearest first, so the surplus in pass two reaches the aircraft that matter most.
  order.sort((a, b) => {
    const da = (s.e[a] - eyeE) ** 2 + (s.nCoord[a] - eyeN) ** 2;
    const db = (s.e[b] - eyeE) ** 2 + (s.nCoord[b] - eyeN) ** 2;
    return da - db;
  });

  // Pass one: presence. Everyone who fits at the smallest size is in — and the smallest size is now ONE
  // segment, which is what lets all forty-two fly on the lowest rung of the ladder. Forty-two marks cost 42
  // of rung 1.1's 280 segments; forty-two deltas cost 168, and the share the round actually hands over at
  // that rung is 126 — so under the old floor eleven aircraft were dropped on the level we promise runs
  // everything. They were counted and reported, never silent, but they were not on the screen.
  const drawnIdx: number[] = [];
  let cost = 0, dropped = 0;
  for (const i of order) {
    if (cost + GLYPH_COST.dot > budget) { dropped++; continue; }
    cost += GLYPH_COST.dot; drawnIdx.push(i);
  }

  // Pass two: detail, nearest first, only from what is genuinely spare, and never more than the aircraft's
  // apparent size has earned. Upgrading a one-pixel object to a 24-segment planform spends the budget on
  // something nobody can see.
  for (const i of drawnIdx) {
    const dist = Math.hypot(s.e[i] - eyeE, s.nCoord[i] - eyeN);
    const want = bandFor(spanM, dist, focalPx);
    if (want === "dot") continue;
    const upgrade = GLYPH_COST[want] - GLYPH_COST[band[i]];
    if (cost + upgrade > budget) continue;
    cost += upgrade; band[i] = want;
  }
  return { cost, band, drawn: drawnIdx.length, dropped };
}

/**
 * What the HUD says about the engagement. Never silent about what it could not draw — and never silent
 * about what it drew LARGER than life either. An aircraft on the one-segment mark is smaller than the mark
 * that represents it: its position is true, its size is a floor, and a person reading the screen is owed
 * that distinction rather than left to assume the picture is to scale.
 */
export const swarmLine = (s: Swarm, d: SwarmDraw): string => {
  const marks = d.band.filter((b, i) => b === "dot" && s.alive[i] === 1).length;
  return `${aliveCount(s, "friendly")} v ${aliveCount(s, "hostile")} · ${d.drawn} drawn`
    + `${marks ? `, ${marks} at the mark` : ""}${d.dropped ? `, ${d.dropped} too far to draw` : ""} · ${d.cost} seg`;
};

// ARCHITECT-2525 · WALK — EVERY ROOM'S DOORWAYS ARE REACHABLE (operator 2026-11-06, Enki/E4: "door-blocking in 8 of 9
// rooms"). The round-1 self-test only drove the hand-tuned Master Bedroom; this gate flood-fills the walkable free space
// of ALL NINE rooms (the real defaultObjectsForRoom packer output + the decided layouts) and asserts a clear lane reaches
// EVERY adjoining doorway — proving the door-aware collision (door lanes carved in roomBlockers) works generally, not by
// per-layout hand-tuning. Pure (no browser): same roomBlockers + door-lane maths the walk uses.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-walk-rooms.test.mjs
import { roomBlockers, pushOut, WALK_R } from "../lib/architect-walk-collide.ts";
import { DOOR_W, ROOM_FT } from "../lib/architect-walk-nav.ts";
import { defaultObjectsForRoom, wallOf } from "../lib/room-objects.ts";
import { TINY_ROOM_LAYOUT } from "../lib/room-layout.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const START_IN = 1.5;
const within = (p, r) => p.x > r.x0 && p.x < r.x1 && p.y > r.y0 && p.y < r.y1;
const free = (p, rects) => !rects.some((r) => within(p, r));
const wallDoorCenter = (objs, side) => { for (const o of objs) if (o.kind === "door" && wallOf(o.gx, o.gy) === side) return side === "N" || side === "S" ? o.gx + 0.5 : ROOM_FT - (o.gy + 0.5); return null; };

// flood-fill the free grid (0.2 ft) from a start cell; return a Set of "ix,iy" reachable keys
function flood(start, rects) {
  const S = 0.2, N = Math.round(ROOM_FT / S);
  const key = (ix, iy) => `${ix},${iy}`;
  const cell = (ix, iy) => ({ x: (ix + 0.5) * S, y: (iy + 0.5) * S });
  // snap start to the nearest free cell (push the body out of any furniture first)
  const sp = pushOut(start, rects, 6);
  let six = Math.round(sp.x / S - 0.5), siy = Math.round(sp.y / S - 0.5);
  six = Math.max(0, Math.min(N - 1, six)); siy = Math.max(0, Math.min(N - 1, siy));
  const seen = new Set(); const q = [[six, siy]]; seen.add(key(six, siy));
  while (q.length) {
    const [ix, iy] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = ix + dx, ny = iy + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const k = key(nx, ny); if (seen.has(k)) continue;
      if (free(cell(nx, ny), rects)) { seen.add(k); q.push([nx, ny]); }
    }
  }
  return { seen, S, key, N };
}
const reachable = (fl, p) => { const ix = Math.max(0, Math.min(fl.N - 1, Math.round(p.x / fl.S - 0.5))), iy = Math.max(0, Math.min(fl.N - 1, Math.round(p.y / fl.S - 0.5))); return fl.seen.has(fl.key(ix, iy)); };

for (const cell of TINY_ROOM_LAYOUT) {
  const objs = defaultObjectsForRoom(cell.k);
  const nb = {
    N: TINY_ROOM_LAYOUT.find((r) => r.row === cell.row - 1 && r.col === cell.col),
    S: TINY_ROOM_LAYOUT.find((r) => r.row === cell.row + 1 && r.col === cell.col),
    E: TINY_ROOM_LAYOUT.find((r) => r.row === cell.row && r.col === cell.col + 1),
    W: TINY_ROOM_LAYOUT.find((r) => r.row === cell.row && r.col === cell.col - 1),
  };
  const dc = { N: wallDoorCenter(objs, "N") ?? ROOM_FT / 2, S: wallDoorCenter(objs, "S") ?? ROOM_FT / 2, E: wallDoorCenter(objs, "E") ?? ROOM_FT / 2, W: wallDoorCenter(objs, "W") ?? ROOM_FT / 2 };
  const lanes = [];
  if (nb.N) lanes.push({ x0: dc.N - DOOR_W / 2, y0: 0, x1: dc.N + DOOR_W / 2, y1: ROOM_FT });
  if (nb.S) lanes.push({ x0: dc.S - DOOR_W / 2, y0: 0, x1: dc.S + DOOR_W / 2, y1: ROOM_FT });
  if (nb.E) lanes.push({ x0: 0, y0: dc.E - DOOR_W / 2, x1: ROOM_FT, y1: dc.E + DOOR_W / 2 });
  if (nb.W) lanes.push({ x0: 0, y0: dc.W - DOOR_W / 2, x1: ROOM_FT, y1: dc.W + DOOR_W / 2 });
  const blockers = roomBlockers(objs, "interior", lanes);
  const spawn = { x: wallDoorCenter(objs, "S") ?? ROOM_FT / 2, y: START_IN };
  const fl = flood(spawn, blockers);
  const doorPt = { N: { x: dc.N, y: ROOM_FT - WALK_R - 0.1 }, S: { x: dc.S, y: WALK_R + 0.1 }, E: { x: ROOM_FT - WALK_R - 0.1, y: dc.E }, W: { x: WALK_R + 0.1, y: dc.W } };
  for (const side of ["N", "S", "E", "W"]) {
    if (!nb[side]) continue;
    ok(reachable(fl, doorPt[side]), `${cell.k} (${cell.label}): the ${side} doorway to ${nb[side].k} is reachable on foot`);
  }
}

console.log(`\nARCHITECT-WALK-ROOMS ${pass}/${pass + fail} passed · every adjoining doorway reachable in all 9 rooms (door-aware lanes)`);
if (fail > 0) process.exit(1);

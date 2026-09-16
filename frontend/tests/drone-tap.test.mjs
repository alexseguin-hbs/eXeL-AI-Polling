// TOUCH TARGETING — tap vs drag, double-tap, the door under a finger, the T-box, and the voice tail.
import { classifyPress, isDoubleTap, hitDoor, tboxPath, newSpeech, TAP_MAX_PX, TAP_MAX_MS, DOUBLE_MS, HIT_RADIUS_PX } from '../lib/drone-2525/tap-target.ts';
import { sceneProject } from '../lib/wire-core/scene-project.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

// ── TAP OR DRAG ─────────────────────────────────────────────────────────────────────────────────
ok(classifyPress({ x: 10, y: 10, t: 0 }, { x: 12, y: 11, t: 120 }) === 'tap', 'a short still press is a tap');
ok(classifyPress({ x: 10, y: 10, t: 0 }, { x: 40, y: 10, t: 120 }) === 'drag', 'a press that moved is a drag — the orbit / look keeps it');
ok(classifyPress({ x: 10, y: 10, t: 0 }, { x: 10, y: 10, t: TAP_MAX_MS + 1 }) === 'drag', 'a long hold is not a tap');
ok(classifyPress({ x: 0, y: 0, t: 0 }, { x: TAP_MAX_PX, y: 0, t: 10 }) === 'tap', 'the movement limit is inclusive');

// ── DOUBLE-TAP ──────────────────────────────────────────────────────────────────────────────────
ok(!isDoubleTap(null, { x: 0, y: 0, t: 100 }), 'a first tap is never a double');
ok(isDoubleTap({ x: 0, y: 0, t: 100 }, { x: 5, y: 5, t: 100 + DOUBLE_MS }), 'two taps close in space and time are one double');
ok(!isDoubleTap({ x: 0, y: 0, t: 100 }, { x: 5, y: 5, t: 100 + DOUBLE_MS + 1 }), 'a beat too late is two taps');
ok(!isDoubleTap({ x: 0, y: 0, t: 100 }, { x: 60, y: 0, t: 200 }), 'the same moment somewhere else is two taps');

// ── THE DOOR UNDER A FINGER, by the overlay's own projection ────────────────────────────────────
const cam = { pw: 800, ph: 500, pitchDeg: 58, bearingRad: 0, pxPerM: 2 };
const door = (id, at, phase = 'up') => ({ door: { id, label: id, at, buildingId: 'b' }, phase, progress: 0.5, window: { startMs: 0, endMs: 9e9 } });
const views = [door('a', [0, 0, 0]), door('b', [60, 0, 0]), door('c', [0, 60, 0], 'closed'), door('d', [-60, 0, 0], 'tagged')];
const pa = sceneProject([0, 0, 0], cam), pb = sceneProject([60, 0, 0], cam);
ok(hitDoor(pa.x, pa.y, views, cam)?.door.id === 'a', 'a tap on a door hits it');
ok(hitDoor(pa.x + HIT_RADIUS_PX - 1, pa.y, views, cam)?.door.id === 'a', 'within the radius still hits');
ok(hitDoor(pa.x + HIT_RADIUS_PX + 40, pa.y + 200, views, cam) === null, 'a tap on empty lawn hits nothing — not the nearest thing to it');
ok(hitDoor(pb.x, pb.y, views, cam)?.door.id === 'b', 'the nearest door wins');
const pc = sceneProject([0, 60, 0], cam);
ok(hitDoor(pc.x, pc.y, views, cam) === null, 'a closed door cannot be marked');
const pd = sceneProject([-60, 0, 0], cam);
ok(hitDoor(pd.x, pd.y, views, cam) === null, 'a tagged door cannot be marked again');
ok(hitDoor(pa.x, pa.y, [door('z', [0, -5000, 0])], cam) === null, 'a door behind the camera is dropped, never clamped onto the screen');

// ── THE T-BOX ───────────────────────────────────────────────────────────────────────────────────
for (const n of [1, 2, 3]) {
  const d = tboxPath(100, 100, 12, n);
  const moves = (d.match(/M/g) || []).length;
  ok(moves === 4 + n, `T${n} is four corners and ${n} tick(s) — the number is a count, not a glyph (${moves} strokes)`);
  ok(!/fill|text|font/.test(d), 'the box is path data only');
}
ok(tboxPath(0, 0, 10, 1).includes('M-10 -5.5L-10 -10L-5.5 -10'), 'the first corner is a bracket at the top left');

// ── THE VOICE TAIL ──────────────────────────────────────────────────────────────────────────────
let v = newSpeech('target one', 0);
ok(v.tail === 'target one' && v.len === 10, 'the first commit is all new');
v = newSpeech('target one fire', v.len);
ok(v.tail === ' fire', 'the next commit yields only the new words — "target one" is not heard twice');
v = newSpeech('capture', v.len);
ok(v.tail === 'capture' && v.len === 7, 'a restarted transcript starts over rather than replaying');

console.log(`\ndrone-tap: ${pass} passed, ${fail} failed · tap ≤${TAP_MAX_PX}px/${TAP_MAX_MS}ms · double ≤${DOUBLE_MS}ms · hit ${HIT_RADIUS_PX}px · T-box = brackets + ticks`);
process.exit(fail ? 1 : 0);

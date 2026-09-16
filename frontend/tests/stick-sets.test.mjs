// STICK CALIBRATION — the gate for sensitivity, deadzone and trim.
//
// The claims: a resting thumb inside the deadzone reads exactly zero (the defect the raw stick has today);
// leaving the deadzone is continuous, not a jump; trim moves the centre; gain scales; nothing escapes the
// unit disc; an absurd saved value is clamped rather than obeyed; and a set survives a reload.
import {
  DEFAULT_SETS, SETS_KEY, SETS_LIMITS, sanitize, applySets, setFromStick, zeroTrims, resetSets,
  getSets, setSets, initSets, subscribeSets, setsLine,
} from '../lib/2525-core/stick-sets.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const near = (a, b, t = 1e-9) => Math.abs(a - b) <= t;

// ── r.050's DEFAULTS ────────────────────────────────────────────────────────────────────────────
ok(DEFAULT_SETS.l === 1 && DEFAULT_SETS.r === 1, 'sensitivity 1.00 both sides');
ok(DEFAULT_SETS.dead === 0.08, 'deadzone 0.08 — the r.050 default');
ok(DEFAULT_SETS.lx === 0 && DEFAULT_SETS.ry === 0, 'no trim');
ok(SETS_KEY === 'exel-2525-sets', 'persisted under r.050\'s key');

// ── THE DEADZONE IS THE POINT ───────────────────────────────────────────────────────────────────
{
  const s = { ...DEFAULT_SETS };
  const rest = applySets({ x: 0.03, y: -0.05 }, 'L', s);
  ok(rest.x === 0 && rest.y === 0, 'a thumb resting 6% off centre reads EXACTLY zero — the raw stick would fly sideways');
  const edge = applySets({ x: 0.08, y: 0 }, 'L', s);
  ok(edge.x === 0 && edge.y === 0, 'the edge of the deadzone is inside it');
  const just = applySets({ x: 0.0801, y: 0 }, 'L', s);
  ok(just.x > 0 && just.x < 0.001, `just outside it reads just above zero (${just.x.toFixed(5)}) — continuous, no jump`);
  const full = applySets({ x: 1, y: 0 }, 'L', s);
  ok(near(full.x, 1) && full.y === 0, 'full deflection still reads full');
  const half = applySets({ x: 0.54, y: 0 }, 'L', s);
  ok(half.x > 0.49 && half.x < 0.51, `half throw reads about half (${half.x.toFixed(3)}) after the remap`);
}

// ── TRIM MOVES THE CENTRE ───────────────────────────────────────────────────────────────────────
{
  let s = { ...DEFAULT_SETS };
  const drift = { x: 0.15, y: -0.10 };                    // this thumb rests here
  ok(applySets(drift, 'R', s).x > 0, 'before trim, the resting thumb reads as input');
  s = setFromStick(s, 'R', drift);
  ok(s.rx === -0.15 && s.ry === 0.10, 'SET FROM STICK stores the negative of the rest');
  ok(s.lx === 0 && s.ly === 0, 'and touches only that side');
  const at = applySets(drift, 'R', s);
  ok(at.x === 0 && at.y === 0, 'after trim, the same rest reads zero');
  ok(applySets({ x: 0.15 + 0.5, y: -0.10 }, 'R', s).x > 0.4, 'and pushing from that rest reads as input');
  s = zeroTrims(s);
  ok(s.rx === 0 && s.ry === 0 && s.dead === DEFAULT_SETS.dead, 'ZERO clears trims and keeps the deadzone');
}

// ── GAIN SCALES, AND NOTHING ESCAPES THE DISC ───────────────────────────────────────────────────
{
  const s = sanitize({ l: 2, r: 0.5 });
  const L = applySets({ x: 0.4, y: 0 }, 'L', s), R = applySets({ x: 0.4, y: 0 }, 'R', s);
  ok(L.x > R.x * 3, `L at ×2 reads more than R at ×0.5 for the same throw (${L.x.toFixed(3)} vs ${R.x.toFixed(3)})`);
  const big = applySets({ x: 0.9, y: 0.9 }, 'L', sanitize({ l: 4 }));
  ok(near(Math.hypot(big.x, big.y), 1), 'a large gain is clamped to the unit disc, never past it');
  for (let i = 0; i < 200; i++) {
    const a = (i / 200) * Math.PI * 2;
    const v = applySets({ x: Math.cos(a), y: Math.sin(a) }, 'L', s);
    ok(Math.hypot(v.x, v.y) <= 1 + 1e-9, `the rim stays inside the disc at ${(a * 180 / Math.PI).toFixed(0)}°`);
  }
}

// ── ABSURD VALUES ARE CLAMPED, NOT OBEYED ───────────────────────────────────────────────────────
{
  const s = sanitize({ l: 50, r: -1, dead: 0.9, lx: 7, ry: NaN });
  ok(s.l === SETS_LIMITS.sens[1] && s.r === SETS_LIMITS.sens[0], `gain is clamped to ${SETS_LIMITS.sens.join('–')}`);
  ok(s.dead === SETS_LIMITS.dead[1], `deadzone is clamped to at most ${SETS_LIMITS.dead[1]} — a stick that is all deadzone is not a stick`);
  ok(s.lx === SETS_LIMITS.trim[1], 'trim is clamped');
  ok(s.ry === 0, 'a NaN becomes the default, not a NaN');
  ok(JSON.stringify(sanitize(null)) === JSON.stringify(DEFAULT_SETS), 'nothing saved means the defaults');
  ok(JSON.stringify(resetSets()) === JSON.stringify(DEFAULT_SETS), 'RESET SETS is the defaults');
}

// ── PERSISTENCE, WITH AND WITHOUT STORAGE ───────────────────────────────────────────────────────
{
  // No localStorage in node: every call must still work and the set must still apply for this session.
  ok(typeof globalThis.localStorage === 'undefined', 'this test runs without storage on purpose');
  const seen = [];
  const off = subscribeSets((s) => seen.push(s.dead));
  const s1 = setSets({ dead: 0.12 });
  ok(s1.dead === 0.12 && getSets().dead === 0.12, 'a set applies without storage');
  ok(seen.length === 1 && seen[0] === 0.12, 'and subscribers hear it');
  off();
  setSets({ dead: 0.2 });
  ok(seen.length === 1, 'an unsubscribed listener hears nothing more');
  ok(initSets().dead === 0.2, 'init without storage keeps what this session set');

  // With a storage stub: a saved set survives a "reload".
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  setSets({ l: 1.5, rx: 0.1 });
  ok(store.get(SETS_KEY) !== undefined, 'a set is written under the key');
  const back = JSON.parse(store.get(SETS_KEY));
  ok(back.l === 1.5 && back.rx === 0.1 && back.dead === 0.2, 'the whole set is written, not one field');
  store.set(SETS_KEY, JSON.stringify({ l: 99, dead: 'x' }));
  ok(initSets().l === SETS_LIMITS.sens[1] && initSets().dead === DEFAULT_SETS.dead, 'a corrupt saved set is sanitised on read, not trusted');
  store.set(SETS_KEY, '{not json');
  ok(typeof initSets().l === 'number', 'unparseable storage does not throw');
  delete globalThis.localStorage;
}

ok(/L ×1\.00 · R ×1\.00 · dead 0\.08/.test(setsLine(DEFAULT_SETS)), `a settings row reads plainly: "${setsLine(DEFAULT_SETS)}"`);

console.log(`\nstick-sets: ${pass} passed, ${fail} failed · dead ${DEFAULT_SETS.dead} · a resting thumb reads zero · persisted at ${SETS_KEY}`);
process.exit(fail ? 1 : 0);

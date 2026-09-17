// THE GUIDED START — the ladder is forward-only, the turret is always open, a joiner is never locked out,
// and a first-timer lands on CH0. Pure logic, plus a mocked localStorage for the persistence round-trip.
import fs from 'node:fs';
import {
  STAGE_MODES, LAST_STAGE, initialProgression, stageIndex, unlocked, advance,
  startingChallenge, startingMode, loadProgression, saveProgression, STAGE_KEY,
} from '../lib/drone-2525/progression.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

// ── THE ORDER (operator: stationary → targets → flying → the 2-HI pair) ──────────────────────────
ok(STAGE_MODES.join(',') === 'turrets,capital,drone,multi', 'the four stages, in the operator\'s order');
ok(LAST_STAGE === 3, 'four stages, indices 0..3');
ok(stageIndex('turrets') === 0 && stageIndex('multi') === 3 && stageIndex('nope') === -1, 'stageIndex maps a mode to its rung');

// ── FIRST VISIT → TURRET + CH0 ───────────────────────────────────────────────────────────────────
const init = initialProgression();
ok(init.reached === 0 && init.firstVisit === true, 'a first visit has reached 0 and firstVisit true');
ok(startingMode() === 'turrets', 'everyone starts on the turret');
ok(startingChallenge(init) === 0, 'a first-timer starts on CH0 TRAINING');
ok(startingChallenge({ reached: 0, firstVisit: false }) === 1, 'a returning player starts on CH1, not training');

// ── UNLOCK: turret always, later stages gated, joiner always ─────────────────────────────────────
ok(unlocked(init, 'turrets') === true, 'the turret is always open');
ok(unlocked(init, 'capital') === false && unlocked(init, 'drone') === false, 'later stages are locked at the start');
ok(unlocked({ reached: 2, firstVisit: false }, 'drone') === true && unlocked({ reached: 2, firstVisit: false }, 'multi') === false, 'the ladder opens exactly up to where it has reached');
ok(unlocked(init, 'multi', true) === true, 'a crew joiner is never locked out of the mode they were invited into');
ok(unlocked(init, 'nope') === false, 'a mode that is not on the ladder is not unlocked');

// ── ADVANCE: forward only, from the frontier, on a tagged round, capped ──────────────────────────
ok(advance(init, { mode: 'turrets', tagged: 1 }).reached === 1, 'clearing the frontier stage opens the next');
ok(advance(init, { mode: 'turrets', tagged: 0 }).reached === 0, 'a stage played with nothing tagged does not advance');
ok(advance(init, { mode: 'drone', tagged: 5 }).reached === 0, 'a non-frontier mode never skips the ladder forward');
ok(advance({ reached: 1, firstVisit: false }, { mode: 'turrets', tagged: 3 }).reached === 1, 'replaying an earlier stage never regresses or re-advances');
let p = init; for (let i = 0; i < 10; i++) p = advance(p, { mode: STAGE_MODES[p.reached], tagged: 1 });
ok(p.reached === LAST_STAGE, 'the ladder caps at the last stage no matter how many rounds are played');
ok(advance(init, { mode: 'turrets', tagged: 1 }).firstVisit === false, 'advancing clears firstVisit');

// ── PERSISTENCE (mocked localStorage) ────────────────────────────────────────────────────────────
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
ok(loadProgression().firstVisit === true, 'nothing stored → a first visit');
saveProgression({ reached: 2, firstVisit: false });
ok(loadProgression().reached === 2 && loadProgression().firstVisit === false, 'a saved ladder is read back, and is no longer a first visit');
store.set(STAGE_KEY, JSON.stringify({ reached: 99 }));
ok(loadProgression().reached === LAST_STAGE, 'an out-of-range stored stage clamps to the last stage');
store.set(STAGE_KEY, '{not json');
ok(loadProgression().reached === 0 && loadProgression().firstVisit === true, 'garbage in the store degrades to a first visit, never a throw');

// ── THE ROUND AND THE SHELL USE IT ───────────────────────────────────────────────────────────────
const ux = fs.readFileSync(new URL('../components/drone-2525/command-ux1.tsx', import.meta.url), 'utf8');
ok(/from "@\/lib\/drone-2525\/progression"/.test(ux), 'the command shell imports the guided start');
ok(/startingMode\(\)/.test(ux) && /startingChallenge\(/.test(ux), 'the shell initialises mode and challenge from the ladder');
ok(/unlocked\(prog, m\.id, isJoiner\)/.test(ux), 'the mode buttons are locked by the ladder (joiner exempt)');
ok(/<StageStrip mode=\{mode\}/.test(ux), 'the shell mounts a "you are here" strip for the current stage');
ok(/data-drone-stage=/.test(fs.readFileSync(new URL('../components/drone-2525/stage-strip.tsx', import.meta.url), 'utf8')), 'the strip names the current stage');
ok(/onRoundEnd=\{[^}]*advance\(/.test(ux), 'the shell advances the ladder when a round ends');
const round = fs.readFileSync(new URL('../components/drone-2525/round.tsx', import.meta.url), 'utf8');
ok(/onRoundEnd\?\.\(\{ mode, tagged:/.test(round), 'the round reports its mode and tagged count when it ends');

console.log(`\ndrone-progression: ${pass} passed, ${fail} failed · turret always open · forward-only · joiner exempt · first visit → CH0`);
process.exit(fail ? 1 : 0);

// EXEL-2525-CONTROLS-1 — the gate that holds the repo's copy to the operator's own file.
//
// lib/2525-core/controls.ts is a TRANSCRIPTION of `window.CONTROLS` from the operator's r.050 build. A
// transcription drifts the first time somebody edits one side and not the other, so this gate does not
// trust the transcription: it opens the carried r.050 (docs/drone-2525/operator-deck/drone-2525_r.050.html),
// lifts the `window.CONTROLS = {...}` block and the `seats:` block of his CONTRACT out of it, and compares
// field for field. If he ships r.051 with a changed binding, the carried file changes, and this fails until
// the transcription is updated — which is the point.
//
// It also holds the things the transcription ADDS and could get wrong on its own: the key map covers every
// aux key the schema names, every held action is a declared action, the voice grammar is r.050's grammar,
// and the vehicle list is not quietly narrowed to the one vehicle this repo can currently fly.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONTROLS_SCHEMA, VEHICLES, EXEL_2525_CONTROLS, SEAT_GEOMETRY,
  ACTIONS, KEY_TO_ACTION, HELD_ACTIONS, voiceToAction,
  RCORE_LOOP, DOCTRINE, RCORE_SYS, RCORE_SENTENCE,
} from '../lib/2525-core/controls.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const HEAD = path.join(ROOT, 'docs/drone-2525/operator-deck/drone-2525_r.050.html');
const html = readFileSync(HEAD, 'utf8');

// ── LIFT THE OPERATOR'S OWN BLOCKS OUT OF HIS FILE ──────────────────────────────────────────────
// The blocks are plain object literals. Evaluating them in a bare Function scope is safe here: the file is
// a carried, hashed artefact, and the block is extracted by delimiter, not executed as a page.
const lift = (re, label) => {
  const m = html.match(re);
  if (!m) throw new Error(`could not find ${label} in ${path.relative(ROOT, HEAD)}`);
  return new Function(`return (${m[1]});`)();
};
const HIS = lift(/window\.CONTROLS\s*=\s*(\{[\s\S]*?\n\});/, 'window.CONTROLS');
const HIS_SEATS = lift(/seats:\s*(\{pilot:\{[^}]*\},tgt:\{[^}]*\},turretSep:[^}]*\})/, 'CONTRACT.seats');
const HIS_LOOP = lift(/const RCORE_LOOP\s*=\s*(\[[^\]]*\]);/, 'RCORE_LOOP');
const HIS_SYS = lift(/const RCORE_SYS\s*=\s*(\{[^}]*\});/, 'RCORE_SYS');

// ── FIELD FOR FIELD ─────────────────────────────────────────────────────────────────────────────
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
ok(HIS.schema === CONTROLS_SCHEMA && HIS.schema === 'EXEL-2525-CONTROLS-1', `the schema id is the operator's (${HIS.schema})`);
ok(HIS.revision === EXEL_2525_CONTROLS.revision, `the revision matches HEAD (${HIS.revision})`);
ok(same(HIS.vehicle, [...VEHICLES]), `the vehicle list is his, in his order (${HIS.vehicle.join(', ')})`);
ok(VEHICLES.length === 6, 'six vehicles — not narrowed to the one this repo can fly today');
ok(VEHICLES.includes('manta-99-66') && VEHICLES.includes('ark-sail-33') && VEHICLES.includes('mass-droid'),
   'Manta, Ark and the droid are still named, so the other domains inherit rather than retype');
for (const s of ['L', 'R']) {
  ok(same(HIS.sticks[s], EXEL_2525_CONTROLS.sticks[s]), `stick ${s} binds exactly as r.050 binds it (${HIS.sticks[s].role})`);
}
ok(same(HIS.aux, EXEL_2525_CONTROLS.aux), 'the aux keys and voice phrases are his');
ok(same(HIS.touch, EXEL_2525_CONTROLS.touch), 'the touch gestures are his');
ok(same(HIS.seats, EXEL_2525_CONTROLS.seats), 'the seat phrasing is his');
ok(HIS.authority === EXEL_2525_CONTROLS.authority, `the authority line is his: "${HIS.authority}"`);
ok(HIS.share === EXEL_2525_CONTROLS.share, 'and so is the share instruction');

// The numbers behind the seat phrasing come from his CONTRACT block, not from the words.
ok(same(HIS_SEATS.pilot, SEAT_GEOMETRY.pilot), `pilot seat is his CONTRACT's (${JSON.stringify(HIS_SEATS.pilot)})`);
ok(same(HIS_SEATS.tgt, SEAT_GEOMETRY.targeteer), `targeteer seat is his CONTRACT's (${JSON.stringify(HIS_SEATS.tgt)})`);
ok(HIS_SEATS.turretSep === SEAT_GEOMETRY.turretSep && SEAT_GEOMETRY.turretSep === 0, 'a turret has one head: separation exactly zero');
ok(SEAT_GEOMETRY.targeteer.f < 0 && SEAT_GEOMETRY.pilot.f > 0, 'the targeteer sits aft of centre and the pilot forward — the fact the phrasing hides');
ok(Math.abs(SEAT_GEOMETRY.pilot.f) < 1 && Math.abs(SEAT_GEOMETRY.targeteer.f) < 1, 'offsets are fractions of the fuselage, not metres');

// The loop and the five systems, verbatim.
ok(same(HIS_LOOP, [...RCORE_LOOP]), `the R-CORE loop is his, closed: ${RCORE_LOOP.join(' → ')}`);
ok(RCORE_LOOP[0] === 'REALITY' && RCORE_LOOP[RCORE_LOOP.length - 1] === 'REALITY', 'and it begins and ends in reality');
ok(same(HIS_SYS, RCORE_SYS), 'the five systems are his: COMM · LINK · EDGE · SYNC · UCRS');
ok(DOCTRINE.length === 7 && DOCTRINE[0] === 'PLAY' && DOCTRINE[6] === 'SHARE', 'the seven-step doctrine is kept beside the loop, not merged into it');
ok(/does not dominate/.test(RCORE_SENTENCE) && /Humanity remains the authority/.test(RCORE_SENTENCE), 'and the sentence about authority is the one he gave');

// ── WHAT THE TRANSCRIPTION ADDS, HELD TO THE SCHEMA ─────────────────────────────────────────────
{
  const actions = new Set(ACTIONS);
  for (const [code, a] of Object.entries(KEY_TO_ACTION)) ok(actions.has(a), `${code} → ${a} is a declared action`);
  for (const a of HELD_ACTIONS) ok(actions.has(a), `held action ${a} is a declared action`);
  // Every key cluster the schema names has a binding.
  const codes = Object.keys(KEY_TO_ACTION);
  const has = (...cs) => cs.every((c) => codes.includes(c));
  ok(has('KeyW', 'KeyA', 'KeyS', 'KeyD'), `L stick keys ${HIS.sticks.L.keys} are bound`);
  ok(has('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'), `R stick keys ${HIS.sticks.R.keys} are bound`);
  ok(has('KeyQ', 'KeyE'), `yaw ${HIS.aux.yaw} is bound`);
  ok(has('KeyU', 'KeyJ'), `climb ${HIS.aux.climb} is bound`);
  ok(has('KeyT'), `target cycle ${HIS.aux.targetCycle} is bound`);
  ok(has('Digit1', 'Digit2', 'Digit3'), `slots ${HIS.aux.slots} are bound`);
  ok(has('KeyF') && has('KeyC'), `fire ${HIS.aux.fire} and capture ${HIS.aux.capture} are bound`);
  ok(!Object.values(KEY_TO_ACTION).includes('approve'), 'APPROVE has no key — it is a face button and a net message, never a keystroke that could be held');
  // The axis keys are the held ones and the one-shot keys are not.
  ok(HELD_ACTIONS.has('body.forward') && HELD_ACTIONS.has('head.pan-left') && HELD_ACTIONS.has('climb.up'), 'axes are held');
  ok(!HELD_ACTIONS.has('fire') && !HELD_ACTIONS.has('capture') && !HELD_ACTIONS.has('target.slot-1'), 'fire, capture and slots are one-shot');
}

// ── THE VOICE GRAMMAR IS r.050's, AND IT IS SMALL ON PURPOSE ────────────────────────────────────
{
  for (const [phrase, want] of [
    ['target one', { action: 'target.slot-1', slot: 1 }], ['T 2', { action: 'target.slot-2', slot: 2 }],
    ['target 3', { action: 'target.slot-3', slot: 3 }], ['target', { action: 'target.cycle' }],
    ['fire 3', { action: 'fire', slot: 3 }], ['fire', { action: 'fire' }], ['F 1', { action: 'fire', slot: 1 }],
    ['capture', { action: 'capture' }], ['take a photo', { action: 'capture' }], ['approve', { action: 'approve' }],
  ]) ok(same(voiceToAction(phrase), want), `"${phrase}" → ${JSON.stringify(want)}`);
  for (const phrase of HIS.aux.voice) ok(voiceToAction(phrase) !== null, `the schema's own phrase "${phrase}" is understood`);
  for (const noise of ['hello', 'turn left', 'fire in the hole is a song', 'targeting system', 'the weather is nice']) {
    const r = voiceToAction(noise);
    // "fire in the hole" DOES match — a word-boundary grammar cannot tell context, which is why voice can
    // never be a permission. "targeting" does NOT match: \btarget\b holds at the word's end. Both recorded.
    if (noise === 'fire in the hole is a song') {
      ok(r !== null, `"${noise}" is recognised — the grammar is word-boundary only, which is why voice can never be a permission`);
    } else {
      ok(r === null, `"${noise}" does nothing`);
    }
  }
  ok(voiceToAction('FIRE') !== null && voiceToAction('Fire') !== null, 'case does not matter');
}

console.log(`\ncontrols-schema: ${pass} passed, ${fail} failed · ${CONTROLS_SCHEMA} r${EXEL_2525_CONTROLS.revision} · ${VEHICLES.length} vehicles · ${Object.keys(KEY_TO_ACTION).length} keys · held to ${path.relative(ROOT, HEAD)}`);
process.exit(fail ? 1 : 0);

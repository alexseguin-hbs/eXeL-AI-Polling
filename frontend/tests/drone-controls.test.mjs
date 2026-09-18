// THE KEYBOARD THROUGH THE REF BUS — the gate for the pure half of use-controls.
//
// The hook itself needs a window; what it computes does not. axesFromHeld and gimbalRateFromHeld are the
// whole mapping from "which keys are down" to "what the flight loop reads", and they are gated here so a
// binding change is caught without a browser. isTyping is gated because a person typing a crew code must
// not fly the aircraft with it.
import fs from 'node:fs';
import { axesFromHeld, gimbalRateFromHeld, combineGimbalRate, isTyping } from '../lib/drone-2525/use-controls.ts';
import { KEY_TO_ACTION, HELD_ACTIONS } from '../lib/2525-core/controls.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const held = (...codes) => new Set(codes.map((c) => KEY_TO_ACTION[c]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── WASD IS THE BODY ────────────────────────────────────────────────────────────────────────────
ok(same(axesFromHeld(held()), { fwd: 0, lat: 0, climb: 0, yaw: 0 }), 'nothing held: every axis zero');
ok(axesFromHeld(held('KeyW')).fwd === 1, 'W is forward — stick-up is nose forward, per r.044');
ok(axesFromHeld(held('KeyS')).fwd === -1, 'S is back');
ok(axesFromHeld(held('KeyD')).lat === 1 && axesFromHeld(held('KeyA')).lat === -1, 'D right, A left');
ok(axesFromHeld(held('KeyW', 'KeyS')).fwd === 0, 'W and S together cancel — no drift from a chord');
ok(axesFromHeld(held('KeyW', 'KeyD')).fwd === 1 && axesFromHeld(held('KeyW', 'KeyD')).lat === 1, 'a diagonal is both');

// ── Q/E YAW, U/J CLIMB — THE AIRFRAME, NOT THE GIMBAL ───────────────────────────────────────────
ok(axesFromHeld(held('KeyE')).yaw === 1 && axesFromHeld(held('KeyQ')).yaw === -1, 'E yaws right, Q left');
ok(axesFromHeld(held('KeyU')).climb === 1 && axesFromHeld(held('KeyJ')).climb === -1, 'U climbs, J dives');
ok(same(gimbalRateFromHeld(held('KeyQ', 'KeyU')), { pan: 0, tilt: 0 }), 'yaw and climb do NOT move the gimbal');

// ── ARROWS ARE THE HEAD ─────────────────────────────────────────────────────────────────────────
ok(same(gimbalRateFromHeld(held()), { pan: 0, tilt: 0 }), 'no arrows: no gimbal rate');
ok(gimbalRateFromHeld(held('ArrowRight')).pan === 1 && gimbalRateFromHeld(held('ArrowLeft')).pan === -1, 'right/left pan');
ok(gimbalRateFromHeld(held('ArrowUp')).tilt === 1 && gimbalRateFromHeld(held('ArrowDown')).tilt === -1, 'up/down tilt');
ok(same(axesFromHeld(held('ArrowUp', 'ArrowRight')), { fwd: 0, lat: 0, climb: 0, yaw: 0 }), 'arrows do NOT move the airframe — R is HEAD/GIMBAL, as the schema says');
ok(gimbalRateFromHeld(held('ArrowLeft', 'ArrowRight')).pan === 0, 'opposite arrows cancel');

// ── HELD VS ONE-SHOT ────────────────────────────────────────────────────────────────────────────
for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyU', 'KeyJ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
  ok(HELD_ACTIONS.has(KEY_TO_ACTION[code]), `${code} is a held axis`);
for (const code of ['KeyF', 'KeyC', 'KeyT', 'Digit1', 'Digit2', 'Digit3'])
  ok(!HELD_ACTIONS.has(KEY_TO_ACTION[code]), `${code} is one-shot — holding it is not a stream of actions`);
ok(same(axesFromHeld(new Set(['fire', 'capture', 'target.slot-1'])), { fwd: 0, lat: 0, climb: 0, yaw: 0 }), 'one-shot actions never move an axis even if listed as held');

// ── TYPING IS NOT FLYING ────────────────────────────────────────────────────────────────────────
const el = (tagName, extra = {}) => ({ tagName, ...extra });
ok(isTyping(el('INPUT')), 'an input swallows keys');
ok(isTyping(el('TEXTAREA')) && isTyping(el('SELECT')), 'so do a textarea and a select');
ok(isTyping(el('DIV', { isContentEditable: true })), 'and a contenteditable');
ok(!isTyping(el('DIV')) && !isTyping(el('BUTTON')) && !isTyping(el('CANVAS')), 'a div, a button, a canvas do not');
ok(!isTyping(null) && !isTyping({}), 'nothing, or something without a tag, does not');

// ── THE R STICK AND THE ARROWS ARE ONE RATE ─────────────────────────────────────────────────────
ok(same(combineGimbalRate({ pan: 0, tilt: 0 }, null), { pan: 0, tilt: 0 }), 'no stick, no arrows: nothing');
ok(same(combineGimbalRate({ pan: 0, tilt: 0 }, { x: 0.5, y: 0 }), { pan: 0.5, tilt: 0 }), 'stick right pans right');
ok(combineGimbalRate({ pan: 0, tilt: 0 }, { x: 0, y: -0.7 }).tilt === 0.7, 'stick UP (screen y negative) tilts UP');
ok(combineGimbalRate({ pan: 1, tilt: 0 }, { x: 1, y: 0 }).pan === 1, 'an arrow plus a full stick is clamped to one rate, not two');
ok(combineGimbalRate({ pan: 1, tilt: 0 }, { x: -1, y: 0 }).pan === 0, 'an arrow against the stick cancels');

// ── THE ROUND MOUNTS IT, AND R IS THE HEAD ──────────────────────────────────────────────────────
// Source-level: the schema says R = HEAD/GIMBAL. The shipped round used the R stick for airframe yaw and
// climb; this holds the rebinding, and holds that the keyboard is actually mounted rather than merely written.
const round = fs.readFileSync(new URL('../components/drone-2525/round.tsx', import.meta.url), 'utf8');
ok(/useControls\(\{/.test(round), 'round.tsx mounts useControls');
ok(/onSlot: doSlot/.test(round) && /onFire: \(\) => doShoot\(\)/.test(round) && /onApprove: doApprove/.test(round), 'slots, fire and approve are bound through the hook');
const deck = fs.readFileSync(new URL('../components/drone-2525/control-deck.tsx', import.meta.url), 'utf8');
ok(/<ControlDeck/.test(round) && !/<Stick /.test(round), 'the sticks live in the deck, not in the round (the 300-line rule)');
ok(!/drone\.fly\.head[^\n]*\n[^\n]*stick\.current\.yaw/.test(deck), 'the R stick no longer writes airframe yaw');
ok(/headStick\.current = applySets\(\{ x, y \}, "R", sets\)/.test(deck), 'the R stick writes the head rate, through the saved calibration');
ok(/applySets\(\{ x, y \}, "L", sets\)/.test(deck), 'the L stick passes through the saved calibration too');
ok(/humanPilot \|\| iAim \?/.test(deck), 'the stick row renders for whoever aims, so turret mode has its look-stick');
ok(/data-drone-set="from-stick"/.test(deck) && /data-drone-set="reset"/.test(deck) && /data-drone-set="zero"/.test(deck), 'SET FROM STICK, ZERO and RESET SETS are on the deck');
ok(/data-drone-keymap/.test(deck) && /@media print/.test(deck), 'the keyboard map exists and prints');
ok(/data-drone-voice/.test(deck), 'voice is offered on the deck');
ok(/onTap=\{onArenaTap\}/.test(round) && /drag=\{iAim \? "look" : "orbit"\}/.test(round), 'tap targets, and the aiming seat owns the drag (dragView: gimbal look if HI)');
ok(/if \(double\)/.test(round) && /doShoot\(next\)/.test(round), 'a double-tap fires through the same doShoot, so it cannot skip APPROVE');
ok(/data-drone-hold=\{id\}/.test(fs.readFileSync(new URL('../components/drone-2525/stick.tsx', import.meta.url), 'utf8')), 'a hold button exists for the axes R used to carry');
// r.052/r.068 hardening: the stick releases on the two paths iOS takes without a pointerup (lost capture,
// window blur), stops the arena orbit-drag firing under it, and parks/travels from the true measured centre.
const stickSrc = fs.readFileSync(new URL('../components/drone-2525/stick.tsx', import.meta.url), 'utf8');
ok(/onLostPointerCapture=\{clear\}/.test(stickSrc), 'the stick releases on lost pointer capture (an iOS freeze path)');
ok(/addEventListener\("blur"/.test(stickSrc), 'the stick releases on window blur (the other iOS path that sends no pointerup)');
ok(/e\.stopPropagation\(\)/.test(stickSrc), 'a press on the stick does not also fire the arena orbit-drag under it');
ok(/travel = centre \* 0\.92/.test(stickSrc) && /const centre = \(size - knobSize\) \/ 2/.test(stickSrc), 'the knob parks at the true centre and travels 0.92 (r.068), not a hard-coded 26 px');

console.log(`\ndrone-controls: ${pass} passed, ${fail} failed · WASD body · arrows gimbal · QE yaw · UJ climb · typing is not flying`);
process.exit(fail ? 1 : 0);

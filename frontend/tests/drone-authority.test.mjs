// THE AUTHORITY LADDER — five levels, operator 2026-09-15: "5 levels where level 1 is more manual HI and
// level 5 is more complex AI vs SI".
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE ONE THAT OUTRANKS EVERY OTHER CHECK IN THIS FILE:
//
//     AT EVERY LEVEL, A NAMED HUMAN DECISION EXISTS BEFORE ANY MACHINE SHOT.
//     SILENCE IS NEVER CONSENT, ON ANY RUNG.
//
// A ladder that scales autonomy by letting a machine fire because nobody objected is not this ladder. What
// scales is the BREADTH of one decision and WHO makes it. The last block of this file walks all five levels
// and requires a refusal from every one of them when nothing has been decided.
// ═══════════════════════════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import {
  AUTHORITY, AUTHORITY_LEVELS, levelFromBand, mandateFrom, endMandate, mandateLive,
  coversShot, groupStanding, authorityLine, MANDATE_MAX_MS,
} from '../lib/drone-2525/authority.ts';
import { mayFire, CREWS, initApproval, requestShot, resolveRequest } from '../lib/drone-2525/ai-crew.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const req = { id: 'r1', doorId: 'R07', doorLabel: 'R07', askedAtMs: 0, az: 0, el: 0, rangeM: 300, claim: 'an opposing aircraft' };
const approved = (by = 'the watch officer', at = 1000) =>
  resolveRequest(requestShot(initApproval(), req), 'approved', by, at).decision;

// ── FIVE LEVELS ON THE BAND THAT ALREADY EXISTS ─────────────────────────────────────────────────
ok(AUTHORITY_LEVELS.join() === '1,2,3,4,5', 'five levels');
ok(levelFromBand(1) === 1 && levelFromBand(5) === 5, 'the MoT band IS the authority level — one control, not two');
ok(levelFromBand(0) === 1 && levelFromBand(9) === 5, 'a band off the end is held at the end, never wrapped');
ok(AUTHORITY[1].covers === 'shot' && AUTHORITY[1].decider === 'person', 'level 1 is a named person, every shot');
ok(AUTHORITY[5].decider === 'group', 'level 5 is the key group');
ok(AUTHORITY[2].covers === 'target', 'level 2 is one aircraft at a time');
ok(AUTHORITY[3].covers === 'window' && AUTHORITY[3].decider === 'person', 'level 3 is one person, a window');
ok(AUTHORITY[4].covers === 'window' && AUTHORITY[4].decider === 'group', 'level 4 is the group, the same window');
for (const l of AUTHORITY_LEVELS) {
  ok(/named person|key group/.test(authorityLine(l)), `level ${l} says in words who authorises what: "${authorityLine(l)}"`);
}
// Autonomy rises monotonically: breadth never narrows as the level goes up.
const breadth = { shot: 0, target: 1, window: 2 };
for (let i = 1; i < 5; i++) {
  ok(breadth[AUTHORITY[i + 1].covers] >= breadth[AUTHORITY[i].covers], `level ${i + 1} is never narrower than level ${i}`);
}

// ── A MANDATE CANNOT BE INVENTED ────────────────────────────────────────────────────────────────
ok(mandateFrom(approved(), 3, 'hostile', 1000) !== null, 'an approved, named decision can become a mandate');
{
  const held = resolveRequest(requestShot(initApproval(), req), 'held', 'the watch officer', 1000).decision;
  ok(mandateFrom(held, 3, 'hostile', 1000) === null, 'a REFUSAL cannot become a mandate');
  const nameless = { ...approved(), by: '   ' };
  ok(mandateFrom(nameless, 3, 'hostile', 1000) === null, 'and neither can a decision with no name behind it');
}
{
  const m = mandateFrom(approved('A. Seguin'), 3, 'hostile', 1000, 999_999_999);
  ok(m.endsAtMs - m.grantedAtMs === MANDATE_MAX_MS, `a mandate cannot be granted for longer than ${MANDATE_MAX_MS / 60000} minutes, whatever is asked`);
  ok(m.by === 'A. Seguin', 'and it carries the name that granted it');
  ok(mandateLive(m, 2000) && !mandateLive(m, 1000 + MANDATE_MAX_MS + 1), 'it is live until it lapses, and not after');
}

// ── LEVEL 1: EVERY SHOT, SEPARATELY ─────────────────────────────────────────────────────────────
{
  const m = mandateFrom(approved(), 3, 'hostile', 1000);
  const r = coversShot(1, m, 'R07', 'hostile', 1100);
  ok(!r.ok, 'at level 1 no mandate covers anything — every shot is its own question');
  ok(/asked separately/.test(r.why), 'and it says so');
}

// ── LEVEL 2: ONE AIRCRAFT, ONCE ─────────────────────────────────────────────────────────────────
{
  const m = mandateFrom(approved(), 2, 'hostile', 1000);
  ok(coversShot(2, m, 'R07', 'hostile', 1100).ok, 'the aircraft that was approved is covered');
  const other = coversShot(2, m, 'R11', 'hostile', 1100);
  ok(!other.ok, 'a DIFFERENT aircraft is not');
  ok(/authorised one aircraft, and this is not it/.test(other.why), `and the refusal says why: "${other.why}"`);
}

// ── LEVEL 3: A DECLARED WINDOW, AND ONLY WHAT IT DECLARES ───────────────────────────────────────
{
  const m = mandateFrom(approved('the pilot'), 3, 'hostile', 1000);
  ok(coversShot(3, m, 'R07', 'hostile', 1100).ok, 'any aircraft on the named side is covered');
  ok(coversShot(3, m, 'R19', 'hostile', 1100).ok, 'including one nobody named individually');
  const wrongSide = coversShot(3, m, 'B04', 'friendly', 1100);
  ok(!wrongSide.ok, 'the OTHER side is not — a window is not a licence');
  ok(/authorised action against hostile, not friendly/.test(wrongSide.why), `and it names both: "${wrongSide.why}"`);
  ok(!coversShot(3, m, 'R07', 'hostile', 1000 + MANDATE_MAX_MS + 1).ok, 'and it stops covering when it lapses');
  ok(/lapsed/.test(coversShot(3, m, 'R07', 'hostile', 1000 + MANDATE_MAX_MS + 1).why), 'saying so');
  ok(!coversShot(4, m, 'R07', 'hostile', 1100).ok, 'authority given at one level does not carry to another');
}

// ── ENDING IT IS ALWAYS AVAILABLE, AT EVERY LEVEL ───────────────────────────────────────────────
for (const l of [2, 3, 4, 5]) {
  const m = mandateFrom(approved(), l, 'hostile', 1000);
  ok(coversShot(l, m, 'R07', 'hostile', 1100).ok, `level ${l} covers a shot while it is live`);
  const stopped = endMandate(m, 'the watch officer', 1200);
  ok(!coversShot(l, stopped, 'R07', 'hostile', 1300).ok, `level ${l}: ending it stops the next shot`);
  ok(/ended by the watch officer/.test(coversShot(l, stopped, 'R07', 'hostile', 1300).why), `level ${l}: and names who ended it`);
  ok(endMandate(stopped, 'someone else', 1400).endedBy === 'the watch officer', `level ${l}: the first person to end it is the one recorded`);
}

// ── LEVEL 5: THE GROUP IS THE STANDING CHECK, AND AN ABSENT GROUP IS NOT A PERMISSIVE ONE ───────
ok(groupStanding('approve', true).ok, 'a group with quorum behind it is authority');
ok(!groupStanding('hold', true).ok, 'a group saying hold stops it');
ok(/saying hold/.test(groupStanding('hold', true).why), 'and says that is why');
ok(!groupStanding(null, true).ok, 'an evenly split group is not authority');
ok(!groupStanding('approve', false).ok, 'and NO QUORUM IS NOT PERMISSION — an absent group does not authorise anything');
ok(/not enough of the group has answered/.test(groupStanding('approve', false).why), 'which it says plainly');

// ═══ SILENCE IS NEVER CONSENT, ON ANY RUNG ══════════════════════════════════════════════════════
for (const l of AUTHORITY_LEVELS) {
  ok(!coversShot(l, null, 'R07', 'hostile', 5000).ok, `level ${l}: with NOTHING decided, no shot is covered`);
  const lapsed = mandateFrom(approved(), l, 'hostile', 0, 1000);
  if (lapsed) ok(!coversShot(l, lapsed, 'R07', 'hostile', 99_999).ok, `level ${l}: a lapsed authority covers nothing`);
  else pass++;
}
{
  // And the gate underneath is untouched: a machine still may not fire without a named decision.
  const ap = requestShot(initApproval(), req);
  ok(!mayFire(CREWS.both_ai, ap, 'r1').ok, 'the shot gate still refuses a pending request, ladder or no ladder');
  const done = resolveRequest(ap, 'approved', 'the watch officer', 2000);
  ok(mayFire(CREWS.both_ai, done.state, 'r1').ok, 'and still opens only for a named approval');
}
{
  // The ladder cannot reach into the gate and open it.
  const src = fs.readFileSync('lib/drone-2525/authority.ts', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok(!/mayFire|resolveRequest\s*\(/.test(src), 'nothing in the ladder can open the shot gate or retire a request');
  ok(/import type \{ ShotDecision \}/.test(fs.readFileSync('lib/drone-2525/authority.ts', 'utf8')),
     'it reads a decision that already happened, and only as a type');
}

console.log(`\ndrone-authority: ${pass} passed, ${fail} failed · 5 levels · silence is never consent on any of them`);
process.exit(fail ? 1 : 0);

// SI — the key-group consensus engine (placeholder). Operator 2026-09-15.
//
// THE INVARIANT THAT OUTRANKS EVERY OTHER TEST IN THIS FILE:
//
//     SI PRIORITISES. A NAMED PERSON STILL DECIDES.
//
// There is no function in si-pod.ts that can approve a shot, and the human-authority gate never consults
// it. A consensus engine that could out-vote a person would invert the doctrine this whole domain holds,
// so the first thing this file does is prove, at the source level, that the two modules do not touch.
import fs from 'node:fs';
import {
  initSi, setSiOn, invite, uninvite, isKeyMember, inviteCode, issueInvite, inviteLive, admits,
  openCall, openCallOf, closeCall, castVote, tally, owed, owedTotal, ledgerLines,
  SI_CHOICES, SI_GLYPH, QUORUM_FRACTION, recogniseAdopted,
  CALL_WINDOW_MS, INVITE_LENGTH, INVITE_TTL_MS, SI_SEAMS,
} from '../lib/drone-2525/si-pod.ts';
import { heartsForRung, RUNGS } from '../lib/pod-clock.ts';
import { mayFire, CREWS, initApproval, requestShot, resolveRequest } from '../lib/drone-2525/ai-crew.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

// ═══ SI CANNOT DECIDE ═══════════════════════════════════════════════════════════════════════════
{
  const si = fs.readFileSync('lib/drone-2525/si-pod.ts', 'utf8');
  const crew = fs.readFileSync('lib/drone-2525/ai-crew.ts', 'utf8');
  ok(!/from ["']\.\/ai-crew["']/.test(si), 'the consensus engine does not import the authority gate');
  ok(!/from ["']\.\/si-pod["']/.test(crew), 'and the authority gate does not import the consensus engine');
  // Prose may explain what the module must never do; only CODE is judged by that rule.
  const code = si.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok(!/resolveRequest|mayFire/.test(code), 'nothing in the consensus engine can retire a request or open the gate');
  // The real proof: a unanimous key group changes nothing about what may fire.
  const req = { id: 'r1', doorId: 'd1', doorLabel: 'TEXAS CAPITOL', askedAtMs: 0, az: 0, el: 0, rangeM: 200, claim: 'a door' };
  let ap = requestShot(initApproval(), req);
  let s = setSiOn(initSi(), true, 0);
  for (const n of ['a', 'b', 'c', 'd', 'e']) s = invite(s, { id: n, name: `Member ${n}`, role: 'crew' }, 0);
  s = openCall(s, 'r1', 'Shoot the Capitol door?', 0);
  for (const n of ['a', 'b', 'c', 'd', 'e']) s = castVote(s, 'r1', n, 'approve', 100);
  const t = tally(s, openCallOf(s, 100), 100);
  ok(t.approve === 5 && t.lean === 'approve' && t.quorum, 'the whole key group says approve');
  ok(!mayFire(CREWS.both_ai, ap, 'r1').ok, 'and STILL nothing may fire — the group advises, it does not decide');
  ok(/waiting for a person/.test(mayFire(CREWS.both_ai, ap, 'r1').why), 'the gate still waits for a person');
  const after = resolveRequest(ap, 'approved', 'the watch officer', 200);
  ok(mayFire(CREWS.both_ai, after.state, 'r1').ok, 'only the named person opens it, unanimity or not');
}

// ── THE SWITCH: OFF IS THE NORMAL STATE ─────────────────────────────────────────────────────────
{
  const s0 = initSi();
  ok(s0.on === false, 'shared intent starts switched off');
  ok(s0.roster.length === 0 && s0.calls.length === 0 && s0.ledger.length === 0, 'and empty');
  ok(openCall(s0, 'c1', 'q', 0).calls.length === 0, 'no call can open while it is off — no silent background poll');
  const on = setSiOn(s0, true, 0);
  ok(on.on === true, 'it can be switched on');
  ok(setSiOn(on, true, 0) === on, 'switching it on twice changes nothing');
  // Turning it off closes an open call rather than leaving people waiting on a dead question.
  let s = invite(on, { id: 'a', name: 'A', role: 'crew' }, 0);
  s = openCall(s, 'c1', 'q', 0);
  ok(openCallOf(s, 100) !== null, 'a call is open');
  s = setSiOn(s, false, 100);
  ok(openCallOf(s, 100) === null, 'switching off closes it, rather than leaving the group waiting');
}

// ── THE KEY GROUP IS CLOSED ─────────────────────────────────────────────────────────────────────
{
  let s = setSiOn(initSi(), true, 0);
  s = invite(s, { id: 'a', name: 'Ada', role: 'pilot' }, 10);
  ok(s.roster.length === 1 && s.roster[0].invitedAtMs === 10, 'inviting somebody records when');
  ok(s.roster[0].role === 'pilot', 'and what they are in the room for');
  s = invite(s, { id: 'a', name: 'Ada again', role: 'x' }, 20);
  ok(s.roster.length === 1, 'the same person cannot be invited twice');
  ok(invite(s, { id: '', name: 'nobody', role: 'x' }, 30).roster.length === 1, 'an invitation with no id is refused');
  ok(invite(s, { id: 'b', name: '  ', role: 'x' }, 30).roster.length === 1, 'and one with no name');
  ok(isKeyMember(s, 'a') && !isKeyMember(s, 'zz'), 'membership is a fact about the roster, not about who is asking');
  ok(uninvite(s, 'a').roster.length === 0, 'and can be withdrawn');
}

// ── THE INVITATION: A CODE, NOT AN OPEN LINK ────────────────────────────────────────────────────
{
  ok(inviteCode('x').length === INVITE_LENGTH, `a code is ${INVITE_LENGTH} characters, from the pod's own generator`);
  ok(inviteCode('x') === inviteCode('x'), 'the same seed gives the same code — a replay is replayable');
  ok(inviteCode('x') !== inviteCode('y'), 'and a different seed a different code');
  ok(!/[01ILO]/.test(inviteCode('any-seed-at-all')), 'no look-alike characters: a code read off a screen types back the same');
  ok(/^[A-HJ-NP-Z2-9]+$/.test(inviteCode('zz')), 'and it uses the alphabet the rest of this repository already uses');
  for (let i = 0; i < 40; i++) ok(!/[01ILO]/.test(inviteCode('s' + i)), `code ${i} avoids look-alikes`);

  let s = setSiOn(initSi(), true, 0);
  ok(issueInvite(s, 'https://x.test', 'seed', 0).invite === null, 'an empty roster gets no invitation — never an open link');
  s = invite(s, { id: 'a', name: 'Ada', role: 'crew' }, 0);
  s = issueInvite(s, 'https://x.test/', 'seed', 1000);
  ok(s.invite !== null, 'a roster gets one');
  ok(s.invite.to.length === 1 && s.invite.to[0] === 'a', 'and it names who it was issued to');
  ok(s.invite.url.includes('/main/Drone-2525/?si=') && s.invite.url.includes(s.invite.code), 'the link carries the code');
  ok(!s.invite.url.includes('//main'), 'and a trailing slash on the host does not double up');
  ok(s.invite.expiresAtMs === 1000 + INVITE_TTL_MS, `it expires after ${INVITE_TTL_MS / 60000} minutes`);
  ok(inviteLive(s, 2000) && !inviteLive(s, 1000 + INVITE_TTL_MS + 1), 'and it is live until then, and not after');

  // The door: both halves must hold.
  ok(admits(s, s.invite.code, 'a', 2000).ok, 'a key member with the live code is admitted');
  ok(admits(s, s.invite.code.toLowerCase(), 'a', 2000).ok, 'and case does not matter when typing it');
  ok(!admits(s, 'WRONGC', 'a', 2000).ok, 'a wrong code is refused');
  ok(/does not match/.test(admits(s, 'WRONGC', 'a', 2000).why), 'and says so plainly');
  ok(!admits(s, s.invite.code, 'stranger', 2000).ok, 'the right code in the wrong hands is refused');
  ok(/not on the roster/.test(admits(s, s.invite.code, 'stranger', 2000).why), 'and says it is a key-group call');
  ok(!admits(s, s.invite.code, 'a', 1000 + INVITE_TTL_MS + 1).ok, 'an expired invitation is refused');
  ok(!admits(setSiOn(s, false, 0), s.invite.code, 'a', 2000).ok, 'and nothing is admitted while SI is switched off');
}

// ── THE CALL IS REAL-TIME, AND VOLUNTEER ────────────────────────────────────────────────────────
{
  let s = setSiOn(initSi(), true, 0);
  for (const n of ['a', 'b', 'c', 'd']) s = invite(s, { id: n, name: n.toUpperCase(), role: 'crew' }, 0);
  s = openCall(s, 'c1', 'Shoot the Capitol door?', 1000);
  const call = openCallOf(s, 1000);
  ok(call !== null && call.question.includes('Capitol'), 'a call carries the decision in plain words');
  ok(call.closesAtMs === 1000 + CALL_WINDOW_MS, `and closes after ${CALL_WINDOW_MS / 1000} seconds`);
  ok(openCall(s, 'c1', 'again', 1000).calls.length === 1, 'the same call cannot be opened twice');

  s = castVote(s, 'c1', 'a', 'hold', 1100);
  ok(s.calls[0].votes.length === 1, 'a key member may vote');
  s = castVote(s, 'c1', 'stranger', 'approve', 1100);
  ok(s.calls[0].votes.length === 1, 'somebody off the roster may not');
  s = castVote(s, 'c1', 'a', 'approve', 1200);
  ok(s.calls[0].votes.length === 1 && s.calls[0].votes[0].choice === 'approve', 'and may change their mind while it is open');

  const closed = closeCall(s, 'c1', 1300);
  ok(openCallOf(closed, 1400) === null, 'a call can be closed early');
  ok(castVote(closed, 'c1', 'b', 'hold', 1400).calls[0].votes.length === 1, 'and late input does not change a closed tally');
  ok(SI_CHOICES.includes('abstain'), 'abstaining is a choice a person can actually make');
}

// ── THE TALLY: SILENCE IS NOT A VOTE ────────────────────────────────────────────────────────────
{
  let s = setSiOn(initSi(), true, 0);
  for (const n of ['a', 'b', 'c', 'd', 'e']) s = invite(s, { id: n, name: n, role: 'crew' }, 0);
  s = openCall(s, 'c1', 'q', 0);
  let t = tally(s, openCallOf(s, 0), 0);
  ok(t.heard === 0 && t.silent === 5, 'before anybody answers, the whole roster is silent');
  ok(!t.quorum, 'and there is no quorum');
  ok(/not enough to read the group/.test(t.line), `the line says so rather than showing a fake result: "${t.line}"`);

  s = castVote(s, 'c1', 'a', 'hold', 100);
  s = castVote(s, 'c1', 'b', 'hold', 200);
  t = tally(s, openCallOf(s, 200), 200);
  ok(t.heard === 2 && !t.quorum, `two of five is not a quorum at ${QUORUM_FRACTION * 100}%`);
  s = castVote(s, 'c1', 'c', 'approve', 300);
  t = tally(s, openCallOf(s, 300), 300);
  ok(t.quorum, 'three of five is');
  ok(t.hold === 2 && t.approve === 1 && t.lean === 'hold', 'and the lean is what the group actually said');
  ok(/2 say hold/.test(t.line), `read as a sentence: "${t.line}"`);

  s = castVote(s, 'c1', 'd', 'approve', 400);
  t = tally(s, openCallOf(s, 400), 400);
  ok(t.lean === null && /evenly split/.test(t.line), 'an even split is reported as an even split, not broken arbitrarily');

  s = castVote(s, 'c1', 'e', 'abstain', 500);
  t = tally(s, openCallOf(s, 500), 500);
  ok(t.abstain === 1 && t.silent === 0, 'a spoken abstention is heard, and is not the same as silence');
  ok(t.secondsLeft > 0 && t.secondsLeft <= CALL_WINDOW_MS / 1000, `the clock is shown (${t.secondsLeft}s left)`);
  ok(tally(s, openCallOf(s, 500), 999999).secondsLeft === 0, 'and never goes negative');
}
{
  const empty = openCall(setSiOn(initSi(), true, 0), 'c1', 'q', 0);
  ok(/nobody is on the roster/.test(tally(empty, empty.calls[0], 0).line), 'with an empty roster it says so rather than dividing by zero');
}

// ── THE REWARD USES THE LADDER THAT ALREADY EXISTS ─────────────────────────────────────────────
{
  const si = fs.readFileSync('lib/drone-2525/si-pod.ts', 'utf8');
  ok(/from "@\/lib\/pod-clock"/.test(si), 'the heart values come from the pod ladder, not from this module');
  ok(!/SI_PER_INPUT|EARLY_BONUS/.test(si), 'and no fourth value was invented on a three-rung ladder');
  ok(heartsForRung('noted') === 1 && heartsForRung('adopted') === 3 && heartsForRung('foundational') === 7,
     'the ladder is the one pod-clock declares: 1, 3, 7');
  ok(RUNGS.length === 4, 'four rungs including none, and nothing in between');
}
{
  let s = setSiOn(initSi(), true, 0);
  for (const n of ['a', 'b', 'c', 'd', 'e']) s = invite(s, { id: n, name: `M-${n}`, role: 'crew' }, 0);
  s = openCall(s, 'c1', 'q', 0);
  s = castVote(s, 'c1', 'a', 'hold', 100);
  s = castVote(s, 'c1', 'b', 'hold', 110);
  s = castVote(s, 'c1', 'c', 'approve', 120);

  ok(owed(s, 'a') === heartsForRung('noted'), `a volunteer input is noted: ${owed(s, 'a')} ${SI_GLYPH}`);
  ok(s.ledger.every((x) => x.rung === 'noted'), 'and nothing is adopted before anybody has decided');
  ok(owed(s, 'd') === 0, 'somebody who stayed silent is recognised with nothing — silence earns nothing');
  ok(owed(s, 'stranger') === 0, 'and somebody off the roster earns nothing at all');

  const before = owedTotal(s);
  s = castVote(s, 'c1', 'a', 'approve', 200);
  ok(owedTotal(s) === before, 'changing your mind does not earn a second recognition');

  // AFTER THE FACT: the person decided to hold. Those who argued hold move to adopted.
  s = recogniseAdopted(s, 'c1', 'hold', 500);
  ok(owed(s, 'b') === heartsForRung('noted') + heartsForRung('adopted'),
     `somebody who argued the way the decision went reaches adopted: ${owed(s, 'b')} ${SI_GLYPH}`);
  ok(owed(s, 'c') === heartsForRung('noted'), 'somebody who argued the other way keeps their noted, and no more');
  ok(owed(s, 'a') === heartsForRung('noted'), 'and so does somebody who changed their mind away from it');
  const twice = recogniseAdopted(s, 'c1', 'hold', 600);
  ok(owedTotal(twice) === owedTotal(s), 'recognising the same decision twice adds nothing');
  ok(recogniseAdopted(s, 'c1', 'abstain', 700) === s, 'a decision to abstain adopts nobody');

  ok(!s.ledger.some((x) => x.rung === 'foundational'),
     'nothing here hands out foundational — seven hearts is a human judgement, not a rule');

  const lines = ledgerLines(s);
  ok(lines.length === s.ledger.length && lines.every((l) => l.includes(SI_GLYPH)), 'the ledger is one readable line per recognition');
  ok(lines[0].includes('M-a') && lines[0].includes('noted'), 'naming the person and the rung, not an id and a number');
}

// ── THE PLACEHOLDER SAYS WHAT IT IS NOT ─────────────────────────────────────────────────────────
{
  ok(SI_SEAMS.length === 3, 'three things this placeholder does not do');
  for (const s of SI_SEAMS) {
    ok(s.missing.length > 10 && s.seam.length > 20 && s.then.length > 10,
       `each is named, with the function that will carry it: "${s.missing}"`);
  }
  ok(SI_SEAMS.some((s) => /api\.post\('\/sessions'\)/.test(s.seam)), 'the polling seam points at the existing Cube 1 call, not a new one');
  ok(SI_SEAMS.some((s) => /cube8_tokens/.test(s.seam)), 'the token seam points at the existing append-only ledger');
  ok(SI_SEAMS.some((s) => /Recognition is recorded here and nowhere else/.test(s.missing)),
     'and it is honest that recognition reaches no ledger anywhere yet');
}

console.log(`\nsi-pod: ${pass} passed, ${fail} failed · off by default · noted ${heartsForRung('noted')}${SI_GLYPH} / adopted ${heartsForRung('adopted')}${SI_GLYPH} · quorum ${QUORUM_FRACTION * 100}%`);
process.exit(fail ? 1 : 0);

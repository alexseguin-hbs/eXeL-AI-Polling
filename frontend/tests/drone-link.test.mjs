// TWO PEOPLE, TWO DEVICES, ONE AIRCRAFT (DRN-09) — operator 2026-09-15:
// "Ensure 2x people on drone has one on control as PILOT and another on phone or PC on gimbal as Targeteer."
//
// THE INVARIANT: A SEAT MAY ONLY SEND WHAT THAT SEAT CONTROLS.
// The pilot flies and cannot aim, capture or shoot. The targeteer aims, captures and shoots, and cannot fly.
// Two people who can both fly are not a crew; one person holding both seats is not a crew either.
import fs from 'node:fs';
import {
  SEATS, otherSeat, authored, initLink, receive, compose, linkUp, linkLine, LINK_QUIET_MS,
  seatUrl, seatFromParams,
} from '../lib/drone-2525/link.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const FLIGHT = { e: 10, n: -20, aglM: 45, ve: 1, vn: 2, vu: 0, headingDeg: 90, mode: 'quad', energy: 0.9 };
const flightMsg = (over = {}) => ({ kind: 'flight', seat: 'pilot', seq: 1, atMs: 100, flight: FLIGHT, ...over });
const gimbalMsg = (over = {}) => ({ kind: 'gimbal', seat: 'targeteer', seq: 1, atMs: 100, az: 45, el: -10, ...over });

// ═══ THE SEAT GATE ══════════════════════════════════════════════════════════════════════════════
ok(SEATS.join() === 'pilot,targeteer', 'two seats, named');
ok(otherSeat('pilot') === 'targeteer' && otherSeat('targeteer') === 'pilot', 'and each knows the other');

ok(authored(flightMsg()).ok, 'the pilot may say where the aircraft is');
ok(authored(gimbalMsg()).ok, 'the targeteer may say where the camera is looking');

// The two refusals that make it a crew rather than two people with the same controls.
{
  const r = authored(flightMsg({ seat: 'targeteer' }));
  ok(!r.ok, 'the TARGETEER CANNOT FLY');
  ok(/only the pilot flies/.test(r.why), `and is told exactly that: "${r.why}"`);
}
{
  const r = authored(gimbalMsg({ seat: 'pilot' }));
  ok(!r.ok, 'the PILOT CANNOT AIM');
  ok(/only the targeteer aims/.test(r.why), `and is told exactly that: "${r.why}"`);
}
{
  ok(!authored(gimbalMsg({ seat: 'pilot', did: 'shoot' })).ok, 'and the pilot cannot shoot, however the message is dressed');
  ok(!authored(gimbalMsg({ did: 'fly' })).ok, 'a targeteer cannot smuggle an action that is not theirs');
  ok(/is not something a targeteer does/.test(authored(gimbalMsg({ did: 'fly' })).why), 'and the refusal names it');
  ok(authored(gimbalMsg({ did: 'capture' })).ok, 'capture is theirs');
  ok(authored(gimbalMsg({ did: 'shoot' })).ok, 'and so is shoot');
}
// Rubbish is refused rather than trusted, because a transport anybody can post to is exactly that.
ok(!authored(null).ok, 'nothing is not a message');
ok(!authored({ kind: 'flight', seat: 'captain', seq: 1, atMs: 1, flight: FLIGHT }).ok, 'a seat that does not exist is refused');
ok(!authored({ kind: 'mutiny', seat: 'pilot', seq: 1, atMs: 1 }).ok, 'a kind that does not exist is refused');
ok(/is not a kind of message/.test(authored({ kind: 'mutiny', seat: 'pilot', seq: 1, atMs: 1 }).why), 'and named');
ok(!authored(flightMsg({ seq: NaN })).ok, 'a message with no sequence is refused');
ok(!authored(flightMsg({ flight: { ...FLIGHT, aglM: NaN } })).ok, 'a flight state with a hole in it is refused');
ok(!authored(gimbalMsg({ az: 'left' })).ok, 'an aim that is not a pair of angles is refused');

// ── COMPOSING: A SEAT CANNOT BUILD THE OTHER SEAT'S MESSAGE ─────────────────────────────────────
{
  const pilot = initLink('pilot', 'ABC123');
  const tgt = initLink('targeteer', 'ABC123');
  ok(compose(pilot, 1, 0, { kind: 'flight', flight: FLIGHT }) !== null, 'the pilot can compose a flight message');
  ok(compose(pilot, 1, 0, { kind: 'gimbal', az: 1, el: 2 }) === null, 'and cannot compose an aim');
  ok(compose(tgt, 1, 0, { kind: 'gimbal', az: 1, el: 2 }) !== null, 'the targeteer can compose an aim');
  ok(compose(tgt, 1, 0, { kind: 'flight', flight: FLIGHT }) === null, 'and cannot compose a flight message');
  ok(compose(pilot, 1, 0, { kind: 'hello', name: 'Ada' }) !== null, 'either may say they have arrived');
  const m = compose(tgt, 7, 500, { kind: 'gimbal', az: 1, el: 2 });
  ok(m.seat === 'targeteer' && m.seq === 7 && m.atMs === 500, 'a composed message carries its own seat, sequence and time');
}

// ── RECEIVING: OWN ECHO, DUPLICATES AND STALE MESSAGES ──────────────────────────────────────────
{
  let s = initLink('pilot', 'ABC123');
  s = receive(s, gimbalMsg({ seq: 1 }), 1000);
  ok(s.theirGimbal?.az === 45 && s.accepted === 1, 'the pilot hears the targeteer');
  ok(s.lastHeardMs === 1000 && linkUp(s, 1500), 'and the link reads as up');
  ok(!linkUp(s, 1000 + LINK_QUIET_MS + 1), `and as quiet after ${LINK_QUIET_MS / 1000}s of silence`);

  // Duplicates are the NORMAL case with three transports, not an error.
  const before = s.accepted;
  s = receive(s, gimbalMsg({ seq: 1 }), 1100);
  ok(s.accepted === before, 'the same message on a second path lands once');
  ok(s.refused === 0, 'and is not counted as a refusal — arriving twice is what the paths are for');

  s = receive(s, gimbalMsg({ seq: 0, az: 999 }), 1200);
  ok(s.theirGimbal.az === 45, 'an older message does not overwrite a newer one');
  s = receive(s, gimbalMsg({ seq: 2, az: 90 }), 1300);
  ok(s.theirGimbal.az === 90, 'and a newer one does');

  // Our own words coming back around change nothing.
  const own = receive(s, flightMsg({ seq: 99 }), 1400);
  ok(own.accepted === s.accepted && own.theirFlight === null, "a device ignores its own echo");
}
{
  // A device that trusts what arrives can be driven by anything that can reach the channel.
  let s = initLink('pilot', 'ABC123');
  s = receive(s, flightMsg({ seat: 'targeteer', seq: 5 }), 1000);
  ok(s.theirFlight === null, 'a flight message claiming to be from the targeteer is not accepted on the way IN either');
  ok(s.refused === 1 && /only the pilot flies/.test(s.lastRefusal), 'it is counted and the reason kept');
  ok(s.accepted === 0, 'and nothing was accepted');
}
{
  let s = initLink('targeteer', 'ABC123');
  s = receive(s, { kind: 'hello', seat: 'pilot', seq: 1, atMs: 0, name: 'Ada' }, 1000);
  ok(s.theirName === 'Ada', 'a seat arriving says who it is');
  ok(/pilot Ada/.test(linkLine(s, 1200)), `and the line names them: "${linkLine(s, 1200)}"`);
  ok(/not heard from/.test(linkLine(s, 9_000_000)), 'and says plainly when they have gone quiet');
  ok(/connected/.test(linkLine(s, 1200)), 'and when they are there');
}

// ── THE SECOND PERSON'S LINK ────────────────────────────────────────────────────────────────────
{
  const u = seatUrl('https://x.test/', 'CREW42', 'targeteer');
  ok(u === 'https://x.test/main/Drone-2525/?crew=CREW42&seat=targeteer', `the link carries the crew and the seat: ${u}`);
  ok(!u.includes('//main'), 'and a trailing slash on the host does not double up');
  const r = seatFromParams('?crew=crew42&seat=pilot');
  ok(r.code === 'CREW42' && r.seat === 'pilot', 'opening it puts that person straight into that seat');
  ok(seatFromParams('?crew=X&seat=captain') === null, 'a seat that does not exist gives no seat, never a default one');
  ok(seatFromParams('?seat=pilot') === null, 'and a seat with no crew gives none either');
  ok(seatFromParams('') === null, 'and an empty link gives none');
}

// ── THREE PATHS, AND THE ONE THAT IS DELIBERATELY ABSENT ────────────────────────────────────────
{
  const raw = fs.readFileSync('lib/drone-2525/use-drone-link.ts', 'utf8');
  // Prose may explain what the file deliberately does not use; only CODE is judged by that rule.
  const hook = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok(/BroadcastChannel/.test(hook), 'path A: the same browser, another tab');
  ok(/\/api\/drone-link/.test(hook), 'path B: any device, through the Pages function');
  ok(/addEventListener\("storage"/.test(hook), 'path C: the fallback when BroadcastChannel is absent');
  ok(!/supabase/i.test(hook), 'and NOT the polling app\'s broadcast channels, which are locked');
  ok(/deliberately NOT a fourth path/.test(raw), 'and the file says out loud that leaving them alone was a choice');
  ok(/receive\(s, m, now\.current\)/.test(hook), 'everything arriving goes through the same pure gate');
  const fn = fs.readFileSync('functions/api/drone-link.js', 'utf8');
  ok(/Number\(prev\.seq\) < Number\(msg\.seq\)/.test(fn), 'the store keeps only the newest word from a seat');
  ok(/expirationTtl: 3600/.test(fn), 'and a crew code does not outlive the hour');
  ok(/not authoritative/i.test(fn), 'the endpoint says in its own header that both devices still check');
}

console.log(`\ndrone-link: ${pass} passed, ${fail} failed · pilot flies · targeteer aims · neither does the other`);
process.exit(fail ? 1 : 0);

// CH1–CH5 / DIFF 1–5 — the deck's challengeSpec, verbatim, and how it lands on this arena.
import fs from 'node:fs';
import {
  challengeSpec, targetSpecFor, doorsInPlay, ch5RefusesSelfApproval, challengeLine, CH_NAMES, RATE_REF,
  DEFAULT_CHALLENGE, DEFAULT_DIFF, CH5_REASON,
} from '../lib/drone-2525/challenge.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

// ── VERBATIM AGAINST r.050 ──────────────────────────────────────────────────────────────────────
// The deck's own function, lifted from the carried HTML and evaluated, so the port is checked against the
// source and not against a memory of it.
const html = fs.readFileSync(new URL('../../docs/drone-2525/operator-deck/drone-2525_r.050.html', import.meta.url), 'utf8');
const m = html.match(/function challengeSpec\(\)\{([\s\S]*?)\n\}/);
ok(Boolean(m), 'r.050 declares challengeSpec()');
const deck = new Function('state', m[1].replace(/const c=/, 'const c=') + '');
for (let c = 1; c <= 5; c++) for (let d = 1; d <= 5; d++) {
  const theirs = deck({ challenge: c, diff: d });
  const ours = challengeSpec(c, d);
  const same = ['quota', 'rate', 'spd', 'moving', 'axes', 'net', 'pops', 'name'].every((k) => theirs[k] === ours[k]);
  ok(same, `CH${c} D${d}: quota ${ours.quota} rate ${ours.rate} spd ${ours.spd} axes ${ours.axes} — field for field the deck's`);
}
ok(challengeSpec().name === 'CH1 LAWN D3' && DEFAULT_CHALLENGE === 1 && DEFAULT_DIFF === 3, 'the defaults are the deck\'s: CH1 LAWN D3');
ok(CH_NAMES.join(' ') === 'LAWN AXIS MIX RING NET', 'the five names');
ok(challengeSpec(9, -2).c === 5 && challengeSpec(9, -2).d === 1, 'out-of-range is clamped, as the deck clamps');
ok(challengeSpec(NaN, NaN).name === 'CH1 LAWN D3', 'garbage falls to the defaults');

// ── HOW IT LANDS ON THE ARENA ───────────────────────────────────────────────────────────────────
const base = { seed: 2525, upMs: 9000, downMs: 2000, concurrent: 2 };
ok(RATE_REF === 38, 'the reference rate is CH1 D3\'s (38)');
ok(targetSpecFor(base, challengeSpec(1, 3)).downMs === 2000, 'CH1 D3 leaves the gap as the arena declares it');
const c5 = targetSpecFor(base, challengeSpec(5, 5)), c1 = targetSpecFor(base, challengeSpec(1, 1));
ok(c1.upMs === 5000 && c5.upMs === 9000, `a door stays up 4 + CH seconds, as the deck's pops do (CH1 ${c1.upMs} ms, CH5 ${c5.upMs} ms)`);
ok(c5.downMs < c1.downMs, `harder spawns sooner: the gap is ${c5.downMs} ms at CH5 D5 against ${c1.downMs} ms at CH1 D1 — rate is the deck's spawn interval, never a door's life`);
ok(c5.upMs > 1500 + 3000, 'and every window clears the round\'s reach margin with room to swing — the first edition did not, and CH5 D5 could not be played');
ok(c1.concurrent === 1 && targetSpecFor(base, challengeSpec(3, 3)).concurrent === 2 && c5.concurrent === 3, 'concurrent doors grow 1 → 2 → 3 with the challenge');
ok(c5.seed === base.seed && c5.concurrent === 3, 'seed is the arena\'s, untouched; CH5 opens three at once');
ok(doorsInPlay(challengeSpec(1, 1), 14) === 7 && doorsInPlay(challengeSpec(5, 5), 14) === 14, 'quota 7 at CH1 D1, the whole block (14) at CH5 D5');
ok(doorsInPlay(challengeSpec(5, 5), 3) === 3, 'never more doors than the block has');
let monotone = true;
for (let c = 1; c < 5; c++) for (let d = 1; d <= 5; d++) {
  const a = challengeSpec(c, d), b = challengeSpec(c + 1, d);
  if (b.quota <= a.quota || b.rate > a.rate) monotone = false;
}
ok(monotone, 'a higher challenge always asks for more doors and gives no more time');

// ── CH5 NET: A SECOND PERSON ────────────────────────────────────────────────────────────────────
const net = challengeSpec(5, 3), lawn = challengeSpec(1, 3);
ok(net.net && !lawn.net, 'only CH5 is on the net');
ok(ch5RefusesSelfApproval(net, 'targeteer', 'targeteer'), 'on the net, a device approving its own mark is refused');
ok(!ch5RefusesSelfApproval(net, 'pilot', 'targeteer'), 'a different person may approve it');
ok(!ch5RefusesSelfApproval(lawn, 'targeteer', 'targeteer'), 'below CH5 the amber → red two-step stands (self-approval reads HI-2)');
ok(CH5_REASON === 'CH5_NO_APPROVE', 'the refusal is recorded under the deck\'s own reason code');
ok(/NET: second person approves/.test(challengeLine(net, 14)) && !/second person/.test(challengeLine(lawn, 7)), 'the HUD says so only on the net');

// ── THE ROUND USES IT, AND THE REFUSAL IS ON THE RECORD ─────────────────────────────────────────
const round = fs.readFileSync(new URL('../components/drone-2525/round.tsx', import.meta.url), 'utf8');
ok(/challengeSpec\(challenge, diff\)/.test(round), 'the round builds its spec from the two dropdowns');
ok(/targetSpecFor\(TSPEC, CH\)/.test(round) && /doorsInPlay\(CH, /.test(round), 'the schedule and the doors in play come from it');
ok(/ch5RefusesSelfApproval\(CH, by, cur\.by\)/.test(round) && /"HOLD"[^\n]*CH5_REASON/.test(round), 'a CH5 self-approval is refused AND recorded as a HOLD');
const ux = fs.readFileSync(new URL('../components/drone-2525/command-ux1.tsx', import.meta.url), 'utf8');
ok(/data-drone-ch\b/.test(ux) && /data-drone-diff\b/.test(ux), 'CH and DIFF are dropdowns in the top bar, not a hidden selector');
ok(!/\bTG\b|tgSpec/.test(round + ux), 'TG is not resurrected as a second level system');

console.log(`\ndrone-challenge: ${pass} passed, ${fail} failed · 25 CH×DIFF cells verbatim from r.050 · CH5 = a second person`);
process.exit(fail ? 1 : 0);

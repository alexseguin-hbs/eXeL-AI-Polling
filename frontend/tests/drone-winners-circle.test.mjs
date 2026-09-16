// FROM OPEN PLAY TO A REAL ARENA — the gate for the progression and the one-in-nine cut.
//
// Four claims, and the last one is the only one that can hurt somebody if it is wrong:
//
//   1. THE CUT IS ONE NINTH, and it is the R-CORE gate rather than a number picked for a tournament.
//   2. THE STANDING IS AUDITABLE — same results, same table, ties broken on declared criteria in order.
//   3. THE SCORE DOES NOT SELECT FOR THE WRONG BEHAVIOUR. A crew that shoots a lot is not the crew we want
//      in a room with real machines; discipline and accuracy outweigh kills, on purpose.
//   4. THE PHYSICAL GATE IS NOT ABOUT SKILL. Winning does not make a crew safe to put on a floor. Every
//      condition is a person or a physical fact, and a refusal says which one is missing.
import {
  ADVANCE_FRACTION, MIN_FIELD, STAGES, score, standing, advanceCount, toCircle, draw,
  admitToPhysical, nextStep, standingLine,
} from '../lib/drone-2525/winners-circle.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const rec = (crewId, o = {}) => ({
  crewId, played: 10, downed: 5, beamEfficiency: 0.5, decisionsHonoured: 20, decisionsLapsed: 0, ...o,
});
const field = (n, f = (i) => ({})) => Array.from({ length: n }, (_, i) => rec(`C${String(i + 1).padStart(3, '0')}`, f(i)));

// ── 1 · THE CUT IS ONE NINTH ────────────────────────────────────────────────────────────────────
{
  ok(Math.abs(ADVANCE_FRACTION - 1 / 9) < 1e-15, 'the fraction is exactly one ninth, not 0.111 rounded');
  ok(Math.abs(ADVANCE_FRACTION * 100 - 11.111111111111111) < 1e-12, 'which is the 11.1% the operator named');
  ok(advanceCount(9) === 1, 'nine advance one');
  ok(advanceCount(90) === 10, 'ninety advance ten');
  ok(advanceCount(900) === 100, 'nine hundred advance a hundred');
  ok(advanceCount(8) === 0, `a field of eight advances nobody — under ${MIN_FIELD} the gate is real, not a courtesy`);
  ok(advanceCount(0) === 0, 'and an empty field advances nobody, without dividing by anything');
  // Floor, not round: rounding up would soften the gate on exactly the fields where it matters most.
  ok(advanceCount(17) === 1, 'seventeen advance one, not two — the gate floors');
  for (let n = MIN_FIELD; n < 400; n++) {
    ok(advanceCount(n) <= n * ADVANCE_FRACTION + 1e-9, `a field of ${n} never advances more than one ninth`);
  }
}

// ── 2 · THE STANDING IS AUDITABLE ───────────────────────────────────────────────────────────────
{
  const rs = field(30, (i) => ({ downed: i % 7, beamEfficiency: 0.3 + (i % 5) * 0.12, decisionsLapsed: i % 3 }));
  const a = standing(rs).map((r) => r.crewId);
  const b = standing([...rs].reverse()).map((r) => r.crewId);
  ok(a.join() === b.join(), 'the same results give the same table whatever order they arrive in');
  for (let i = 1; i < a.length; i++) {
    const x = standing(rs)[i - 1], y = standing(rs)[i];
    ok(score(x) >= score(y) - 1e-12, `the table is in order at place ${i + 1}`);
  }
  // Ties break on declared criteria, in the declared order, and never on chance.
  const tied = [rec('B', { beamEfficiency: 0.5 }), rec('A', { beamEfficiency: 0.5 })];
  ok(standing(tied)[0].crewId === 'A', 'an exact tie breaks on the crew id, deterministically');
  const eff = [rec('A', { downed: 4, beamEfficiency: 0.9 }), rec('B', { downed: 9, beamEfficiency: 0.2 })];
  ok(standing(eff)[0].crewId === 'A', 'and accuracy outranks a bigger tally');
}

// ── 3 · THE SCORE DOES NOT SELECT FOR THE WRONG BEHAVIOUR ───────────────────────────────────────
{
  const sprayer = rec('SPRAY', { downed: 10, beamEfficiency: 0.15, decisionsHonoured: 10, decisionsLapsed: 10 });
  const careful = rec('CARE', { downed: 4, beamEfficiency: 0.85, decisionsHonoured: 20, decisionsLapsed: 0 });
  ok(score(careful) > score(sprayer),
     `the careful crew out-ranks the one that shot more (${score(careful).toFixed(2)} against ${score(sprayer).toFixed(2)}) — this is what the physical stage requires`);

  const lapsed = rec('LAPSE', { decisionsHonoured: 0, decisionsLapsed: 20 });
  const answered = rec('ANSWER', { decisionsHonoured: 20, decisionsLapsed: 0 });
  ok(score(answered) > score(lapsed), 'a crew whose decisions go unanswered ranks below one whose do not');
  ok(score(answered) - score(lapsed) > 4, 'and it costs them a great deal, because it should cost them a season');

  ok(score(rec('NONE', { played: 0 })) === 0, 'a crew that has not played scores nothing');
  const withUnplayed = toCircle({ id: 's', records: [...field(9), rec('GHOST', { played: 0, beamEfficiency: 1 })] });
  ok(!withUnplayed.circle.some((r) => r.crewId === 'GHOST'), 'and cannot advance on a perfect record of no matches');
  ok(withUnplayed.ranked === 9, 'the ranked field counts only those who played');
}

// ── THE SEASON, AND THE CUT SAID OUT LOUD ───────────────────────────────────────────────────────
{
  const s = { id: '2026-A', records: field(99, (i) => ({ downed: i % 11, beamEfficiency: 0.2 + (i % 9) * 0.09 })) };
  const a = toCircle(s);
  ok(a.advancing === 11, `ninety-nine who played advance eleven (${a.advancing})`);
  ok(a.circle.length === 11, 'and the circle holds exactly that many');
  ok(a.cutLine !== null && a.cutLine > 0, `the cut line is published (${a.cutLine.toFixed(3)}) — a cut nobody can see is a cut nobody trusts`);
  ok(/one ninth/.test(a.why), `and the reason says why: "${a.why}"`);
  const everyoneIn = a.circle.every((c) => score(c) >= a.cutLine - 1e-12);
  ok(everyoneIn, 'nobody in the circle is below the line');
  const small = toCircle({ id: 'tiny', records: field(5) });
  ok(small.advancing === 0 && /advances nobody/.test(small.why), `a five-crew season advances nobody and says so: "${small.why}"`);
}

// ── THE DRAW ────────────────────────────────────────────────────────────────────────────────────
{
  const c = toCircle({ id: 's', records: field(90, (i) => ({ downed: i % 13 })) }).circle;
  const d = draw(c);
  ok(d.length === 5, `ten in the circle draw into five pairings (${d.length})`);
  ok(d[0].a === c[0].crewId && d[0].b === c[c.length - 1].crewId, 'first is drawn against last');
  const seen = new Set();
  for (const p of d) { for (const id of [p.a, p.b]) if (id) { ok(!seen.has(id), `${id} appears once`); seen.add(id); } }
  ok(seen.size === c.length, 'and everyone in the circle is in the draw');
  const odd = draw(c.slice(0, 7));
  ok(odd[odd.length - 1].b === null, 'an odd circle leaves one crew unpaired, said plainly rather than given a silent bye');
  ok(draw([]).length === 0, 'an empty circle draws nothing, without throwing');
  ok(draw(c).map((p) => p.a).join() === draw(c).map((p) => p.a).join(), 'and the bracket can be published before it is played');
}

// ── 4 · THE PHYSICAL GATE IS NOT ABOUT SKILL ────────────────────────────────────────────────────
{
  const ready = { safetyOfficer: 'Dana Reyes', bothTeamsPresent: true, arenaClear: true, descentChecked: true };
  ok(admitToPhysical(ready).ok, 'with everything in place, the match goes ahead');
  ok(/Dana Reyes/.test(admitToPhysical(ready).why), 'and the clearance carries the name of who gave it');

  for (const [k, v, expect] of [
    ['safetyOfficer', '', /named safety officer/],
    ['safetyOfficer', '   ', /named safety officer/],
    ['bothTeamsPresent', false, /both crews/],
    ['arenaClear', false, /not clear/],
    ['descentChecked', false, /descent/],
  ]) {
    const r = admitToPhysical({ ...ready, [k]: v });
    ok(!r.ok, `without ${k}, the match does not happen`);
    ok(expect.test(r.why), `and the refusal says which one is missing: "${r.why}"`);
  }

  // The claim that matters: NOTHING about winning can open this gate.
  const champion = rec('CHAMP', { downed: 999, beamEfficiency: 1, decisionsLapsed: 0 });
  ok(score(champion) > 0, 'a perfect record is still a record');
  ok(!admitToPhysical({ ...ready, arenaClear: false }).ok,
     'and it does not clear an arena — winning is a separate question from being safe to put on a floor');
}

// ── WHAT A PERSON READS ─────────────────────────────────────────────────────────────────────────
{
  ok(STAGES.join() === 'open,circle,tournament,physical', 'four stages, in order, and the last one is real');
  const a = toCircle({ id: 's', records: field(27) });
  ok(/top 3 of 27/.test(nextStep('open', a)), `open play is told exactly what it takes: "${nextStep('open', a)}"`);
  ok(/one ninth/.test(nextStep('open')), 'and told the rule even without a season in front of it');
  ok(/cleared by name/.test(nextStep('tournament')), 'the tournament is told the floor must be cleared by name before anyone flies');
  ok(/nothing here is a simulation/.test(nextStep('physical')), 'and the physical stage says plainly that it is not a simulation');
  const line = standingLine(rec('C001', { decisionsLapsed: 2 }), 1);
  ok(/2 decision\(s\) lapsed/.test(line), `a board says when a crew let decisions lapse: "${line}"`);
  ok(/every decision answered/.test(standingLine(rec('C002'), 2)), 'and when it did not');
  ok(!/J\/cm|fluence|quorum/i.test(line), 'with no jargon a player has to decode');
}

const season = toCircle({ id: '2026-A', records: field(99, (i) => ({ downed: i % 11, beamEfficiency: 0.2 + (i % 9) * 0.09 })) });
console.log(`\ndrone-winners-circle: ${pass} passed, ${fail} failed · ${season.ranked} played → ${season.advancing} in the circle (one ninth) → a draw of ${draw(season.circle).length} → a floor cleared by name`);
process.exit(fail ? 1 : 0);

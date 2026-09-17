// THE DECISION RECORD IS READ, NOT A WRITE-ONLY SINK (Gate 4; the 48-agent fleet).
// round.tsx wrote decisions that nothing read: replayHash/metricsOf/feedLine/sidecarOf were exported and
// never called, the stamp hardcoded authorityLevel:1, and the ledger never re-initialised per run. This
// gates the honest record: the stamp reads WHO is in the loop, metrics/hash/sidecar are computed FROM the
// ledger and shown, and each run owns its record.
import fs from 'node:fs';
import { authorityLevelOf, CREWS } from '../lib/drone-2525/ai-crew.ts';
import { initLedger, decide, ev, stampOf, metricsOf, replayHash, sidecarOf, feedLine } from '../lib/drone-2525/decisions.ts';

let pass=0, fail=0; const ok=(c,m)=>{ if(c) pass++; else { fail++; console.log('FAIL:',m); } };

// ── AUTHORITY FROM THE CREW, NOT A LITERAL ───────────────────────────────────────────────────────
ok(authorityLevelOf(CREWS.two_hi)===1, 'two humans deciding = authority 1');
ok(authorityLevelOf(CREWS.hi_pilot)===2 && authorityLevelOf(CREWS.ai_pilot)===2, 'a human authorising an AI-involved shot = 2');
ok(authorityLevelOf(CREWS.both_ai)===3, 'a watch officer over two machines = 3');
ok(new Set([1,2,3].map(x=>x)).size===3 && authorityLevelOf(CREWS.two_hi)!==authorityLevelOf(CREWS.both_ai), 'the level varies by crew, so a two-HI run and a mixed-crew run are distinguishable');

// ── stampOf IS HONEST AND PURE ───────────────────────────────────────────────────────────────────
{
  const amber = stampOf(1, 'targeteer', { phase:'amber' }, 1, 3, 3, 5);
  ok(amber.designated===true && amber.hiApproved===false && amber.red===0, 'an amber mark: designated, not approved, red defaults 0 (no opposing scorer in the live round)');
  const red = stampOf(2, 'pilot', { phase:'red' }, 2, 1, 2, 9);
  ok(red.hiApproved===true && red.authorityLevel===2 && red.challenge===1 && red.blu===9, 'a red mark: approved, carries the real authority/challenge/score');
  ok(stampOf(3,'x',null,1,0,1,0).designated===false, 'nothing designated reads designated:false');
}

// ── metricsOf / replayHash / sidecar ARE COMPUTED FROM THE LEDGER ────────────────────────────────
{
  let L = initLedger('0.015');
  const st = (cur=null,al=1) => stampOf(1,'targeteer',cur,al,1,3,0);
  L = decide(L,'DESIGNATE','d1',st(),{slot:1}).ledger; L = ev(L,'DESIGNATE','d1','AMBER',st()).ledger;
  L = decide(L,'HOLD','d1',st({phase:'amber'}),{reason:'CH5_NO_APPROVE'}).ledger;
  L = decide(L,'REJECT','NONE',st(),{reason:'NO_RED_BOX'}).ledger;
  L = decide(L,'APPROVE','d1',{...st({phase:'red'}),actor:'pilot'},{by:'pilot',from:'targeteer',slot:1}).ledger; L = ev(L,'APPROVE','d1','RED',st({phase:'red'})).ledger;
  const m = metricsOf(L);
  ok(m.designations===1 && m.hiHolds===1 && m.authFailures===1 && m.approvals===1, `metrics count from the record (des ${m.designations} hold ${m.hiHolds} refuse ${m.authFailures} appr ${m.approvals})`);
  ok(m.twoPersonApprovals===1, 'a pilot approving a targeteer\'s mark is a two-person approval');
  ok(/^[0-9a-f]{16}$/.test(m.replayHash) && m.replayHash===replayHash(L), 'the replay hash is FNV-1a 64 over the ledger');
  let L2 = decide(initLedger('0.015'),'DESIGNATE','dX',st(),{slot:1}).ledger;
  ok(replayHash(L)!==replayHash(L2), 'a different record hashes differently');
  const side = sidecarOf(L, 2525);
  ok(side.format==='EXEL-2525-SIDECAR-1' && side.seed===2525 && side.metrics.replayHash===m.replayHash && side.decisions.length>=4, 'the sidecar carries the metrics, decisions and events beside the fixture');
  ok(typeof feedLine(L.events[0])==='string' && feedLine(L.events[0]).includes('|'), 'feedLine renders an event row');
}

// ── THE ROUND READS IT AND RE-INITS PER RUN ──────────────────────────────────────────────────────
const strip = (src)=>src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
const round = strip(fs.readFileSync(new URL('../components/drone-2525/round.tsx', import.meta.url),'utf8'));
const rs = fs.readFileSync(new URL('../components/drone-2525/round-status.tsx', import.meta.url),'utf8');
ok(/stampOf\(/.test(round) && /authorityLevelOf\(crew\)/.test(round), 'the round stamps with authorityLevelOf(crew), not a hardcoded 1');
ok(!/authorityLevel:\s*1\b/.test(round), 'no hardcoded authorityLevel:1 remains in the round');
ok(/setLedger\(initLedger\(/.test(round), 'the ledger re-inits on reset — each run owns its record');
ok(/ledger=\{ledger\}/.test(round) && /seed=\{Number\(DRONE_DOMAIN\.targets\.seed\)\}/.test(round), 'the round hands the ledger and seed to the record surface');
ok(/metricsOf\(ledger\)/.test(rs) && /replayHash/.test(rs) && /sidecarOf\(ledger, seed\)/.test(rs) && /feedLine\(/.test(rs), 'RoundStatus READS the ledger (metrics, hash, sidecar, feed) — not a write-only sink');
ok(/data-drone-metrics/.test(rs) && /data-drone-replayhash/.test(rs) && /data-drone-save/.test(rs) && /data-drone-export/.test(rs), 'the record, the hash and SAVE/EXPORT are on the glass');

console.log(`\ndrone-ledger: ${pass} passed, ${fail} failed · authority from the crew · metrics + hash + sidecar read from the record · re-init per run`);
process.exit(fail?1:0);

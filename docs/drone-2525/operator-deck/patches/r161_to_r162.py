# r.161 -> r.162 — the QUAL timer and the vertical red · yellow · green light (operator 2026-10-05 16.24 CST, ASK.md Addendum 13, verbatim).
#  1. The start light stands VERTICAL on the right: red on top, yellow, green at the bottom, like a range light.
#  2. QUAL · 40 only: the lamps count the last three seconds of the group's window, one second each — red at window − 2, yellow at
#     window − 1, green at the window's end (the group is done, the next set is coming; green holds one second). Otherwise dark.
#     The windows stay the program of record the operator supplied (1 = 5 s · 2 = 8 s · 3 = 12 s · 4 = 16 s); three targets light red
#     at 10, yellow at 11, green at 12. His "3 s per target" is offered as his call in the release note.
#  3. A timer under the lamps: the seconds left on the group that is up ("12 S"), or the seconds to the next group ("NEXT 3 S").
#  4. (Addendum 14: "system forgets target was targeted or approved") In TRAINING · RESET a marked and approved target keeps its mark and
#     its approval through the hit and the return: F fires again as soon as it stands; while it is down F holds (no round). The mark ends on
#     RESTART, a lane or mode change, or a new mark. TRAINING · DOWN and QUAL unchanged. QA MARK_SURVIVES_THE_RETURN.
#  5. (Addendum 15: "If something is marked Target, it stays target ... target all 3-4 or all pop ups, then go to each one to approve, system
#     remembers. I can only shoot targets approved.") Solo, TRAIN UP and QUAL 40: any number of marks; TARGET on a marked target focuses it, APPROVE and
#     FIRE act on the mark under the bullseye; a new mark never drops another; a mark outlives its target going down. TRAIN DOWN: a hit ends that mark
#     only. A room keeps its per-shot approval. QA MARKS_ARE_REMEMBERED.
#  6. (Addendum 17: "also add R for reload on PC computer.") R is the RELOAD button, through focus like T / Space / F. QA KEY_R_RELOADS.
#  Training keeps the r.157 light (green while targets stand) and shows no timer. QA QUAL_LIGHT_LAST_THREE_SECONDS, QUAL_TIMER_COUNTS;
#  START_LIGHT_SEQUENCE re-pointed. The fire doctrine is untouched.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.161.html'); DST=os.path.join(DECK,'drone-2525_r.162.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
rep("#startLight .lamps{display:flex;gap:5px}",
    "#startLight .lamps{display:flex;flex-direction:column;gap:5px} /* r.162 (Addendum 13): vertical, red on top, green at the bottom */\n#startLight #startTime{font-size:13px;letter-spacing:.06em;font-weight:600;color:#E8D5B0;font-variant-numeric:tabular-nums;min-height:15px}\n#startLight #startTime:empty{display:none}")
rep("#startLight i{width:12px;height:12px;","#startLight i{width:14px;height:14px;")
rep('<b id="startWord">WAIT</b></div>','<b id="startWord">WAIT</b><b id="startTime"></b></div>')
rep("  if(chNum()!==0||!rangeArmed()) return 'R';",
    "  if(chNum()!==0) return 'R'; if(!rangeArmed()) return state.rangeMode==='qual40'?'O':'R';")
rep("  if(state.qualDone) return 'R';\n  const R=rangeRun(state.lane||0);\n  if(R.phase==='up'){ if((R.cur||[]).some(id=>up(PLATES.find(p=>p.id===id)))) return 'G'; const nx=engagementAt(state.lane||0,R.k+1); if(!nx) return 'R'; const rest=(R.eng&&nx.ph!==R.eng.ph)?PHASE_GAP_S:ENG_GAP_S; return (Math.max(0,(R.eng?R.eng.sec:5)-R.t)+rest)<=3?'Y':'R'; }\n  const gap=R.phase==='phasegap'?PHASE_GAP_S:ENG_GAP_S; return (gap-(R.t||0))<=3?'Y':'R'; }",
    "  if(state.qualDone) return 'R';\n  return qualLamp(rangeRun(state.lane||0)); }\nfunction qualLamp(R){ /* r.162 (Addendum 13): the last three seconds of the group's window, one second a lamp — red at window − 2, yellow at window − 1, green at the end (held one second into the rest); dark otherwise */\n  const t=R.t||0; if(R.phase==='up'){ const sec=R.eng?R.eng.sec:5; return t>=sec-1?'Y':t>=sec-2?'R':'O'; }\n  return (R.eng&&R.eng.n>0&&t<1)?'G':'O'; }\nfunction qualTimer(){ /* r.162: seconds left on the group that is up, or to the next group; empty outside QUAL */\n  if(chNum()!==0||state.rangeMode!=='qual40'||state.qualDone||!rangeArmed()) return ''; const R=rangeRun(state.lane||0); const t=R.t||0;\n  if(R.phase==='up') return Math.max(0,Math.ceil((R.eng?R.eng.sec:5)-t-1e-9))+' S';\n  const gap=R.phase==='phasegap'?PHASE_GAP_S:ENG_GAP_S; return 'NEXT '+Math.max(0,Math.ceil(gap-t-1e-9))+' S'; }")
rep("function lightWord(L){ return L==='G'?'FIRE':L==='Y'?'READY':'WAIT'; }","function lightWord(L){ return L==='G'?'FIRE':L==='Y'?'READY':L==='O'?'':'WAIT'; }")
rep("  paintLight(startLight()); }",
    "  paintLight(startLight()); paintTimer(); }\nfunction paintTimer(){ const tm=document.getElementById('startTime'); if(!tm) return; const v=qualTimer(); if(tm.textContent!==v) tm.textContent=v; const q=chNum()===0&&state.rangeMode==='qual40'; const w=document.getElementById('startWord'); if(w&&q&&w.textContent!=='') w.textContent=''; } /* in QUAL the timer speaks for the light; the lamp's place (red top, green bottom) carries it for colour-blind players */")
# START_LIGHT_SEQUENCE re-pointed to the r.162 law
rep("/* r.157 · START_LIGHT_SEQUENCE (Addendum 1) — a QUAL start walks red → yellow → green → yellow → green, red then yellow across the phase rest, red at the end; training is green while targets stand */",
    "/* r.157 → r.162 · START_LIGHT_SEQUENCE — QUAL: dark, then red → yellow → green across each group's last three seconds; the phase rest opens green then goes dark; red when the qualification is done; training is green while targets stand */")
rep("s.indexOf('R → Y → G → Y → G')===0&&seq[seq.length-1]==='R'&&done&&marks[0]==='rest R'&&marks[1]==='rest end Y'&&s.indexOf('G → R → Y → G')>0&&",
    "s.indexOf('O → R → Y → G → O → R → Y → G')===0&&seq[seq.length-1]==='R'&&done&&marks[0]==='rest G'&&marks[1]==='rest end O'&&")
ROW=r'''    { /* r.162 · QUAL_LIGHT_LAST_THREE_SECONDS + QUAL_TIMER_COUNTS (Addendum 13) — engagement 4 is three targets on a 12 s window */
      const qaA=state.qaArmed, ph0=state.lobby&&state.lobby.phase, S0=state._qaSilent; state._qaSilent=true; state.qaArmed=true; if(state.lobby) state.lobby.phase='SETUP';
      state.rangeMode='qual40'; rangeReset(); qualResetTower(); const R=rangeRun(state.lane||0); let k3=false; for(let i=0;i<4000&&!k3;i++){ rangeTick(0.05); if(R.phase==='up'&&R.k===3) k3=true; }
      const sec=R.eng?R.eng.sec:0, n3=R.cur.length; const first={}; let tm0=''; let tGap=''; let t=0;
      for(let i=0;i<20*16;i++){ const L=startLight(); const at=R.phase==='up'?R.t:sec+R.t; if(!(L in first)) first[L]=+at.toFixed(2); if(i===10) tm0=qualTimer(); if(R.phase!=='up'&&!tGap&&R.t>0.5) tGap=qualTimer(); rangeTick(0.05); if(R.phase==='up'&&R.k===4) break; }
      state._qaSilent=S0; state.qaArmed=qaA; if(state.lobby) state.lobby.phase=ph0; state.rangeMode='bounce'; qualResetTower(); rangeReset(); paintCues();
      const near=(a,b)=>a!=null&&Math.abs(a-b)<=0.06;
      push('QUAL_LIGHT_LAST_THREE_SECONDS', n3===3&&sec===12&&near(first.R,10)&&near(first.Y,11)&&near(first.G,12)&&near(first.O,0), 'three targets, '+sec+' s up: red at '+first.R+' s, yellow at '+first.Y+' s, green at '+first.G+' s, dark from '+first.O+' s');
      push('QUAL_TIMER_COUNTS', tm0==='12 S'&&/^NEXT [123] S$/.test(tGap), 'half a second into the group the timer reads '+tm0+'; in the rest it reads '+tGap); }
'''
rep("    { /* r.157 · START_LIGHT_WORDS", ROW+"    { /* r.157 · START_LIGHT_WORDS")
rep("if(hit.dead){const sn=(state.desig&&state.desig.slot)||n||state.slot||1; state.hiApproved=false;state.hiLock=false;state.desig=null; if(state.tgtSlot) delete state.tgtSlot[sn];}",
    "if(hit.dead&&keepsMark(s.ref)){ toast('HIT · '+plateWord(s.id)+' · STILL RED · F WHEN IT STANDS'); } else if(hit.dead){const sn=(state.desig&&state.desig.slot)||n||state.slot||1; state.hiApproved=false;state.hiLock=false;state.desig=null; if(state.tgtSlot) delete state.tgtSlot[sn];} /* r.162 (Addendum 14): in TRAIN UP the shooter's own mark and approval ride the target down and back up */")
rep("  if(state.desig&&state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)){ decide('REJECT',state.desig.id,{reason:'TARGET_GONE'});",
    "  if(state.desig&&state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)&&keepsMark(state.desig.ref)){ decide('HOLD',state.desig.id,{reason:'TARGET_RETURNING'}); toast(plateWord(state.desig.id)+' IS COMING BACK UP · STILL RED · F WHEN IT STANDS'); return; } /* r.162: a held mark waits for its target; no round, no release */\n  if(state.desig&&state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)){ decide('REJECT',state.desig.id,{reason:'TARGET_GONE'});")
rep("q._ret=0; rangeRelease(q); } anyUp=true;","q._ret=0; if(!keepsMark(q)) rangeRelease(q); } anyUp=true;")
rep("function roundOpen(){","function keepsMark(q){ const d=state.desig; return !!q&&!!q.form&&chNum()===0&&(state.rangeMode||'bounce')==='bounce'&&rangeTraining()&&!!d&&(d.ref===q||d.id===q.id)&&d.how==='HI-2'&&!/^ASM@/.test(String(d.by||''))&&!(state.lobby&&state.lobby.phase==='LIVE'); } /* r.162 (Addendum 14): TRAIN UP, solo — the target comes back, so the shooter's own mark and approval stay; a room's or the AI's mark still needs a fresh approval for every shot */\nfunction roundOpen(){")
ROW2=r'''    { /* r.162 · MARK_SURVIVES_THE_RETURN (Addendum 14) — TRAIN UP: mark + approve once, then F, F, F */
      const l0=state.lane, z0=state.zoom, s0=state.unit, qaA=state.qaArmed, S0=state._qaSilent, sd0=state.simDirect; state._qaSilent=true; state.qaArmed=true; state.lane=20; parkRangeTurrets(); state.rangeMode='bounce'; rangeReset(); state.unit='T21'; const uu=units['T21']; state.zoom=1; state.desig=null; state.tgtSlot={}; state.simDirect=false;
      const q=plateOf(20,'C-150R'); aimUnitAt(uu,q,-40,40); designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const h0=state.rangeHit|0; fireN(1); const hit1=(state.rangeHit|0)===h0+1; const red1=!!state.desig&&state.desig.id===q.id&&state.desig.phase==='red';
      for(let i=0;i<20&&q.up;i++) rangeTick(0.05); const r0=state.mag.rounds; fireN(1); const held=!q.up&&state.mag.rounds===r0&&!!state.desig&&state.desig.phase==='red';
      for(let i=0;i<(RETURN_S+1)*20&&!q.up;i++) rangeTick(0.05); aimUnitAt(uu,q,-40,40); const back=!!q.up&&!!state.desig&&state.desig.id===q.id&&state.desig.phase==='red'; fireN(1); const hit2=(state.rangeHit|0)===h0+2;
      state.desig=null; state.tgtSlot={}; state.unit=s0; state.lane=l0; state.zoom=z0; state.qaArmed=qaA; state._qaSilent=S0; state.simDirect=sd0; parkRangeTurrets(); rangeReset();
      push('MARK_SURVIVES_THE_RETURN', hit1&&red1&&held&&back&&hit2, 'one mark, one approval: hit '+hit1+' · still red '+red1+' · F while down holds, no round '+held+' · back up still red '+back+' · second hit '+hit2); }
'''
rep("    { /* r.157 · START_LIGHT_WORDS", ROW2+"    { /* r.157 · START_LIGHT_WORDS")
rep("const h50=shootPlate('C-50',0); push('RANGE_HIT_50', h50.red&&h50.dead&&h50.cleared,","const h50=shootPlate('C-50',0); push('RANGE_HIT_50', h50.red&&h50.dead&&(h50.cleared||keepsMark(h50.q)),")
rep("state.hiApproved=true; q.up=false; const h0=state.rangeHit|0; fireN(1); push('EXPIRED_TARGET_SCORES_NOTHING',","state.hiApproved=true; q.up=false; const m0=state.rangeMode; state.rangeMode='stay'; const h0=state.rangeHit|0; fireN(1); state.rangeMode=m0; push('EXPIRED_TARGET_SCORES_NOTHING',")
rep("state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-100C'); aimPlate(q,0);\n      const lit=()=>","state.rangeMode='stay'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-100C'); aimPlate(q,0); /* r.162: TRAIN DOWN, where a hit ends the mark; in TRAIN UP the mark stays and FIRE stays lit */\n      const lit=()=>")
rep("const cleared=!state.desig&&!Object.keys(state.tgtSlot||{}).length; const dN=(state.decisions||[]).length; fireN(1); const refused=(state.decisions||[]).slice(dN).some(d=>d.reason==='NO_RED_BOX')&&q.lifePct===100&&q.up===false;","const cleared=keepsMark(q)?!!markSlotOf(q.id):(!state.desig&&!Object.keys(state.tgtSlot||{}).length); const dN=(state.decisions||[]).length; fireN(1); const refused=(state.decisions||[]).slice(dN).some(d=>d.reason==='NO_RED_BOX'||d.reason==='TARGET_RETURNING')&&q.lifePct===100&&q.up===false; /* r.162 (Addendum 15): in QUAL 40 the solo mark stays with its target; a late FIRE still never lands */")
rep("/^LAST · 150 M RIGHT · DOWN$/.test(last)","/^(LAST · 150 M RIGHT · DOWN|RED · T1 · 150 M RIGHT · PRESS FIRE)$/.test(last)")
rep("push('RANGE_HIT_300', h300.red&&h300.dead&&h300.cleared,","push('RANGE_HIT_300', h300.red&&h300.dead&&(h300.cleared||keepsMark(h300.q)),")
# ── Addendum 15: marks are remembered — mark many, approve each, fire only approved (solo; a room keeps per-shot approval) ──
rep("function keepsMark(q){ const d=state.desig; return !!q&&!!q.form&&chNum()===0&&(state.rangeMode||'bounce')==='bounce'&&rangeTraining()&&!!d&&(d.ref===q||d.id===q.id)&&d.how==='HI-2'&&!/^ASM@/.test(String(d.by||''))&&!(state.lobby&&state.lobby.phase==='LIVE'); }",
    "function marksPersist(){ const m=state.rangeMode||'bounce'; return chNum()===0&&(m==='bounce'||m==='qual40')&&!(state.lobby&&state.lobby.phase==='LIVE'); } /* r.162 (Addendum 15): TRAIN UP and QUAL 40 — the target stands again, so a mark stays a mark */\nfunction ownMark(m){ return !!m&&!/^ASM@/.test(String(m.by||''))&&!/^PEER/.test(String(m.how||'')); }\nfunction markSlotOf(id){ const t=state.tgtSlot||{}; return Object.keys(t).find(k=>t[k]&&t[k].id===id)||null; }\nfunction focusMark(k){ const sl=(state.tgtSlot||{})[k]; if(!sl) return null; state.desig={id:sl.id,kind:kindOfRef(sl.ref),ref:sl.ref,by:sl.by||SID,t:state.clock,slot:+k,phase:sl.phase||'amber',how:sl.phase==='red'?(sl.howRed||'HI-2'):(sl.how||'LOCAL'),approvedBy:sl.approvedBy||null,sameDevice:true}; state.slot=+k; state.hiApproved=sl.phase==='red'; return state.desig; } /* r.162 (Addendum 15): the mark under the bullseye becomes the one TARGET, APPROVE and FIRE act on; the others keep their boxes */\nfunction keepsMark(q){ if(!q||!q.form||!marksPersist()) return false; const d=state.desig; if(d&&(d.ref===q||d.id===q.id)&&ownMark(d)) return true; const k=markSlotOf(q.id); return !!k&&ownMark(state.tgtSlot[k]); } /* r.162 (Addenda 14–15): the shooter's own mark rides its target down and back up; the AI's or another seat's mark still needs a fresh approval for every shot */")
rep("  if(state.desig&&state.desig.id!==lk.id&&!/^PEER/.test(String(state.desig.how||''))&&!/^ASM@/.test(String(state.desig.by||''))) releaseAuthority('RE-MARK');",
    "  { const k0=markSlotOf(lk.id); if(k0&&marksPersist()){ const d0=focusMark(k0); const red=d0.phase==='red'; toast((red?'RED BOX · ':'AMBER · ')+plateWord(lk.id)+(red?' · PRESS FIRE':' · PRESS APPROVE')); log('TGT',lk.id,'KEPT'); list(); return d0; } } /* r.162 (Addendum 15): an earlier mark is remembered, never re-made */\n  if(!marksPersist()&&state.desig&&state.desig.id!==lk.id&&!/^PEER/.test(String(state.desig.how||''))&&!/^ASM@/.test(String(state.desig.by||''))) releaseAuthority('RE-MARK'); /* r.162: only where marks do not persist (TRAIN DOWN, a room) */")
rep("  if(sl) sl.phase='red';","  if(sl){ sl.phase='red'; sl.howRed=state.desig.how; sl.approvedBy=actor; } /* r.162: the slot carries its approval, so focusing it again brings the red box back */")
rep("function rangeRelease(q){ if(!q) return;","function rangeRelease(q){ if(!q) return; if(keepsMark(q)){ q.mist=false; return; } /* r.162 (Addendum 15): a remembered mark survives its target going down when it will stand again */")
rep("  if(!state.desig){toast('NO AMBER · MARK A TARGET FIRST');return;}",
    "  if(slot==null&&marksPersist()&&typeof lockOn==='function'){ const lk=lockOn(); const k=lk&&markSlotOf(lk.id); if(k&&(!state.desig||state.desig.id!==lk.id)) focusMark(k); } /* r.162 (Addendum 15): APPROVE acts on the mark under the bullseye */\n  if(!state.desig){toast('NO AMBER · MARK A TARGET FIRST');return;}")
rep("if(state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)){ decide('HOLD',state.desig.id,{reason:'TARGET_DOWN'}); releaseAuthority('TARGET DOWN');",
    "if(state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)&&keepsMark(state.desig.ref)){ decide('HOLD',state.desig.id,{reason:'TARGET_RETURNING'}); toast(plateWord(state.desig.id)+' IS DOWN · IT STAYS MARKED · APPROVE WHEN IT STANDS'); return; } /* r.162 */\n  if(state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)){ decide('HOLD',state.desig.id,{reason:'TARGET_DOWN'}); releaseAuthority('TARGET DOWN');")
rep("  if(!roundOpen()){ decide('REJECT',(state.desig&&state.desig.id)||'NONE',{reason:'ROUND_NOT_OPEN'}); toast('PRESS PRACTICE, OR START THE ROOM, BEFORE YOU FIRE'); return; }",
    "  if(!roundOpen()){ decide('REJECT',(state.desig&&state.desig.id)||'NONE',{reason:'ROUND_NOT_OPEN'}); toast('PRESS PRACTICE, OR START THE ROOM, BEFORE YOU FIRE'); return; }\n  if(marksPersist()&&typeof lockOn==='function'){ const lk=lockOn(); const k=lk&&markSlotOf(lk.id); if(k&&(!state.desig||state.desig.id!==lk.id)){ focusMark(k); n=+k; } } /* r.162 (Addendum 15): FIRE acts on the mark under the bullseye — only a red one fires */")
ROW3=r'''    { /* r.162 · MARKS_ARE_REMEMBERED (Addendum 15) — mark three, approve two, fire only the approved; TRAIN UP, TRAIN DOWN and QUAL 40 */
      const l0=state.lane, z0=state.zoom, s0=state.unit, qaA=state.qaArmed, S0=state._qaSilent, sd0=state.simDirect, m0=state.rangeMode; state._qaSilent=true; state.qaArmed=true; state.simDirect=false; state.lane=20; parkRangeTurrets(); state.unit='T21'; const uu=units['T21']; state.zoom=1;
      const look=b=>{ const q=plateOf(20,b); aimUnitAt(uu,q,-40,40); state.aimRef=q; return q; }; const ph=b=>{ const k=markSlotOf(plateOf(20,b).id); return k?state.tgtSlot[k].phase:'none'; };
      state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={};
      ['C-100L','C-150R','C-200L'].forEach(b=>{ look(b); markLock(lockOn(),'QA'); }); const three=Object.keys(state.tgtSlot).length===3;
      look('C-100L'); approveDesig('HI-2'); look('C-150R'); approveDesig('HI-2'); const twoRed=ph('C-100L')==='red'&&ph('C-150R')==='red'&&ph('C-200L')==='amber';
      look('C-100L'); const h0=state.rangeHit|0; fireN(state.slot||1); const hitA=(state.rangeHit|0)===h0+1; look('C-200L'); const r0=state.mag.rounds; fireN(state.slot||1); const refused=(state.rangeHit|0)===h0+1&&state.mag.rounds===r0;
      look('C-150R'); fireN(state.slot||1); const hitB=(state.rangeHit|0)===h0+2; const keptUp=ph('C-100L')==='red'&&ph('C-150R')==='red'&&ph('C-200L')==='amber';
      state.rangeMode='stay'; rangeReset(); state.desig=null; state.tgtSlot={}; ['C-100L','C-150R'].forEach(b=>{ look(b); markLock(lockOn(),'QA'); approveDesig('HI-2'); }); look('C-100L'); fireN(state.slot||1); for(let i=0;i<30;i++) rangeTick(0.05); const downGone=ph('C-100L')==='none'&&ph('C-150R')==='red';
      state.rangeMode='qual40'; rangeReset(); qualResetTower(); state.desig=null; state.tgtSlot={}; const qq=rangeExpose(20,'C-150L'); aimUnitAt(uu,qq,-40,40); state.aimRef=qq; markLock(lockOn(),'QA'); for(let i=0;i<(EXPOSURE_BY_COUNT[1]+0.5)*20;i++) rangeTick(0.05); const qualKept=!qq.up&&!!markSlotOf(qq.id);
      state.desig=null; state.tgtSlot={}; state.aimRef=null; state.unit=s0; state.lane=l0; state.zoom=z0; state.qaArmed=qaA; state._qaSilent=S0; state.simDirect=sd0; state.rangeMode=m0; qualResetTower(); parkRangeTurrets(); rangeReset();
      push('MARKS_ARE_REMEMBERED', three&&twoRed&&hitA&&refused&&hitB&&keptUp&&downGone&&qualKept, 'TRAIN UP: three marked '+three+' · two approved, one still amber '+twoRed+' · hit an approved one '+hitA+' · the amber one refused, no round '+refused+' · the other approved one hit '+hitB+' · marks kept '+keptUp+' · TRAIN DOWN: the hit one gone, the other still red '+downGone+' · QUAL 40: the mark outlives the group '+qualKept); }
'''
rep("    { /* r.157 · START_LIGHT_WORDS", ROW3+"    { /* r.157 · START_LIGHT_WORDS")
rep("only.length===1&&only[0]===q2.id","(marksPersist()?(only.length===2&&only.includes(q2.id)):(only.length===1&&only[0]===q2.id))") # r.162: TRAIN UP keeps the earlier mark
rep("&&moved<1.5&&rel&&oldGone","&&moved<1.5&&(marksPersist()?!oldGone:(rel&&oldGone))") # r.162 (Addendum 15): the earlier mark is remembered
rep("the unfinished 100 C released on the record: '+rel","the 100 C '+(marksPersist()?'still marked (TRAIN UP remembers): '+!oldGone:'released on the record: '+rel)")
rep("(q1.holes||[]).length===1 && !state.desig &&","(q1.holes||[]).length===1 && (!state.desig||keepsMark(q1)) &&")
rep("push('PEER_HIT_TALLIES_AND_CLEARS', (state.rangeHit|0)===h0+1&&!state.desig&&","push('PEER_HIT_TALLIES_AND_CLEARS', (state.rangeHit|0)===h0+1&&(!state.desig||keepsMark(q))&&")
rep("{ const e0=(state.events||[]).length; rangeResetOnRecord('QA');","{ state.desig=null; state.tgtSlot={}; state.hiApproved=false; const e0=(state.events||[]).length; rangeResetOnRecord('QA');")
rep("/^(LAST · 150 M RIGHT · DOWN|RED · T1 · 150 M RIGHT · PRESS FIRE)$/","/^(LAST · 150 M RIGHT · DOWN|RED · T\\d+ · 150 M RIGHT · PRESS FIRE)$/")
# ── Addendum 17: R reloads on a PC ──
rep("const GAME_KEYS=new Set(['Space','KeyT','KeyF','ArrowUp'","const GAME_KEYS=new Set(['Space','KeyT','KeyF','KeyR','ArrowUp'")
rep("  if(e.code==='KeyF'){e.preventDefault();fireN(state.slot||1);}","  if(e.code==='KeyR'){e.preventDefault();magReload();} /* r.162 (Addendum 17): R is the RELOAD button */\n  if(e.code==='KeyF'){e.preventDefault();fireN(state.slot||1);}")
ROW4=r'''    { /* r.162 · KEY_R_RELOADS (Addendum 17) — R is the RELOAD button, even with a button holding focus */
      const m0=state.rangeMode, it=document.getElementById('intro'), itD=it?it.style.display:null; if(it) it.style.display='none'; state.rangeMode='bounce'; rangeReset(); state.mag.rounds=3; const b=document.getElementById('btnRangeReset')||document.querySelector('button'); if(b) b.focus();
      window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR',key:'r',bubbles:true})); const full=state.mag.rounds===state.mag.cap; const r1=state.mag.rounds; window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR',key:'r',bubbles:true})); const refusedFull=state.mag.rounds===r1;
      if(it) it.style.display=itD; if(b) b.blur(); state.rangeMode=m0; rangeReset();
      push('KEY_R_RELOADS', full&&refusedFull, 'with a button focused, R with 3 rounds left loaded a full magazine ('+r1+' RDS); R again on a full magazine changed nothing'); }
'''
rep("    { /* r.157 · START_LIGHT_WORDS", ROW4+"    { /* r.157 · START_LIGHT_WORDS")
c=s.count("revision:'0.161'"); rep("revision:'0.161'","revision:'0.162'",c)
h=s.count("r0.161"); rep("r0.161","r0.162",h)
for dead in ["revision:'0.161'","r0.161","if(chNum()!==0||!rangeArmed()) return 'R';"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

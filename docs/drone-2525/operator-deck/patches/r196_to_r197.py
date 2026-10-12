# r.196 -> r.197 — TRAIN DOWN: the clock under the stop light, from START to the last target, ON THE RECORD (operator 2026-10-11, verbatim:
# "Train-Down where we have timer under stop light tonsee how fast to target all 3" · "that way a 3v3 drone can have challenges targeting
# number of targets (6 people per team), to find the best time similar to Train-Down at "The Range."").
# Ports r.182 (`aac4db9b`, a hand edit never registered) onto the r.196 base, and puts it on the record:
#  INVARIANT (r.197): TRAIN DOWN is a timed run. START raises the lane's targets and opens the clock as a decision row behind the same door
#  as a shot; the clock stops the instant the last target is down and the time is a decision row; both rows reach every seat and enter the
#  replay hash. Armed (mode picked, RESTART, a lane change): every target down, the light WAIT, the button START. The target set is DECLARED
#  on the START row (targets:N — the lane's 11 today; a 3-target run is one constant), so the 3v3 challenge later varies it, not the mode.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
BASE_REV='196'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]  # the base is the carried, registered r.196 — asserted against its own hash record
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.197.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.196')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)

# 0 · the deck declares itself
c=s.count("revision:'0.196'"); rep("revision:'0.196'","revision:'0.197'",c)
h=s.count("r0.196"); rep("r0.196","r0.197",h)

# 1 · the clock, armed / running / done — and START, TIME as decisions
rep("function rangeArmed(){ const ph=state.lobby&&state.lobby.phase; return ph==='PRACTICE'||ph==='LIVE'||!!state.qaArmed; }",
    """const TRAIN_DOWN_N=0; /* r.197 (operator 2026-10-11: "timer under stop light to see how fast to target all 3"): 0 = every target in the lane (11); a number raises the nearest that many. DECLARED on the START row (targets:N) so a 3-target run — or the 3v3 challenge — is one constant, never a second mode. */
function downClockWord(){ const s=Math.max(0,state.downT||0); const m=Math.floor(s/60); const r=s-m*60; const w=Math.floor(r); const t=Math.floor((r-w)*10); return m+':'+(w<10?'0':'')+w+'.'+t; }
function downSet(){ const ps=platesHere().filter(q=>!onSheet()||sheetHas(q)); if(!(TRAIN_DOWN_N>0)) return ps; return ps.slice().sort((a,b)=>(a.z||0)-(b.z||0)).slice(0,TRAIN_DOWN_N); }
function downArm(){ state.downGo=false; state.downT=0; state.rangeAllDown=false; platesHere().forEach(q=>{ q.up=false; q.lifePct=0; q.life=0; q.fall=1; q._down=false; q._dead=0; q._eng=false; q._ret=0; q.mist=false; rangeRelease(q); }); } /* r.197: armed — every target down, the light WAIT, the button START */
function downStart(){ state.downGo='run'; state.downT=0; state.rangeAllDown=false; state.rangeHit=0; state.rangeMiss=0; magLoad('RESET'); const set=downSet(); platesHere().forEach(q=>{ const on=set.includes(q); q.holes=[]; q._hit=false; q.up=on; q.lifePct=on?100:0; q.life=on?1e9:0; q.fall=on?0:1; q._dead=0; q._down=false; q._eng=false; q._ret=0; q.mist=false; }); }
function downStartOnRecord(why){ /* r.197 INVARIANT: TRAIN DOWN is a timed run on the record — START is a decision row behind the same door as a shot; the time is a decision row; both reach every seat */
  if(!roundOpen()){ decide('REJECT','RANGE',{reason:'ROUND_NOT_OPEN',why:'START'}); toast('PRESS PRACTICE, OR START THE ROOM, BEFORE YOU START THE CLOCK'); return false; }
  if(state.downGo==='run'){ decide('REJECT','RANGE',{reason:'CLOCK_RUNNING',why:'START'}); toast('THE CLOCK IS RUNNING · HIT EVERY TARGET'); return false; }
  releaseAuthority('START'); decide('START','RANGE',{why,mode:'stay',lane:state.lane|0,targets:downSet().length}); downStart(); return true; }
function downStop(){ state.downGo='done'; state.rangeAllDown=true; if(lapseIsMine()) decide('TIME','RANGE',{mode:'stay',lane:state.lane|0,ms:Math.round((state.downT||0)*1000),hits:state.rangeHit|0,misses:state.rangeMiss|0}); toast('ALL DOWN · '+downClockWord()); } /* the lane's clock owner writes the time; a peer reads it from the row */
function rangeArmed(){ const ph=state.lobby&&state.lobby.phase; return ph==='PRACTICE'||ph==='LIVE'||!!state.qaArmed; }""")
rep("    state.rangeAllDown=(mode==='stay'&&!anyUp);",
    "    if(mode==='stay'){ if(state.downGo==='run'){ state.downT=(state.downT||0)+dt; if(!anyUp) downStop(); } else if(state.downGo!=='done') state.rangeAllDown=false; } else state.rangeAllDown=false; /* r.197: the clock runs from START to the last target; ALL DOWN only then */")
rep("rangeRunReset(); state.lastBand=''; state.rangeAllDown=false; state.rangeHit=0; state.rangeMiss=0; state.rangeLapsed=0; }",
    "rangeRunReset(); state.lastBand=''; state.rangeAllDown=false; state.rangeHit=0; state.rangeMiss=0; state.rangeLapsed=0; state.downGo=false; state.downT=0; } /* r.197: a reset also clears the TRAIN DOWN clock */")
# the light carries the clock: START (armed) · TIME m:ss.t (running) · ALL DOWN m:ss.t (done); QUAL keeps its timer
rep("function paintTimer(){ const tm=document.getElementById('startTime'); if(!tm) return; const v=qualTimer(); if(tm.textContent!==v) tm.textContent=v; const q=chNum()===0&&state.rangeMode==='qual40'; const w=document.getElementById('startWord'); if(w&&q&&w.textContent!=='') w.textContent=''; }",
    "function paintTimer(){ const tm=document.getElementById('startTime'); if(!tm) return; const w=document.getElementById('startWord'); if(chNum()===0&&state.rangeMode==='stay'){ /* r.197: the TRAIN DOWN clock under the lamps */ const c=state.downGo==='run'||state.downGo==='done'?downClockWord():''; const word=state.downGo==='done'?'ALL DOWN':state.downGo==='run'?'TIME':'START'; if(tm.textContent!==c) tm.textContent=c; if(w&&w.textContent!==word) w.textContent=word; return; } const v=qualTimer(); if(tm.textContent!==v) tm.textContent=v; const q=chNum()===0&&state.rangeMode==='qual40'; if(w&&q&&w.textContent!=='') w.textContent=''; }")
rep("  const rr=document.getElementById('btnRangeReset'); if(rr) rr.classList.toggle('call',chNum()===0&&((state.rangeMode==='qual40'&&!!state.qualDone)||(state.rangeMode==='stay'&&!!state.rangeAllDown)));",
    "  const rr=document.getElementById('btnRangeReset'); if(rr){ const stay=chNum()===0&&state.rangeMode==='stay'; const waiting=stay&&state.downGo!=='run'&&state.downGo!=='done'; const word=waiting?'START':'RESTART'; if(rr.textContent!==word) rr.textContent=word; rr.classList.toggle('call',waiting||(chNum()===0&&((state.rangeMode==='qual40'&&!!state.qualDone)||(stay&&!!state.rangeAllDown)))); } /* r.197: the button says START while the lane is armed */")
rep("const _rr=document.getElementById('btnRangeReset'); if(_rr)_rr.onclick=()=>{ if(rangeResetOnRecord('BUTTON')) toast('RESTARTED · '+modeSentence()); };",
    "const _rr=document.getElementById('btnRangeReset'); if(_rr)_rr.onclick=()=>{ if(chNum()===0&&state.rangeMode==='stay'&&state.downGo!=='run'&&state.downGo!=='done'){ if(downStartOnRecord('BUTTON')){ toast('START · HIT EVERY TARGET IN THE LANE'); paintCues(); } return; } /* r.197 */ if(rangeResetOnRecord('BUTTON')) toast('RESTARTED · '+modeSentence()); };")
rep("} else ps.textContent=chNum()===0?((onSheet()?'SHEET 25 M · ':'')+RANGE_MODE_NAME[state.rangeMode||'bounce']+' · HIT '+(state.rangeHit|0)+' · MISS '+(state.rangeMiss|0)+(state.rangeAllDown?' · ALL DOWN · PRESS RESTART':'')):('BLU '+(state.blu|0)+' · RED '+(state.red|0));",
    "} else { const stay=state.rangeMode==='stay'; const clock=stay?(state.downGo==='done'?(' · ALL DOWN · '+downClockWord()):state.downGo==='run'?(' · '+downClockWord()):' · PRESS START'):''; ps.textContent=chNum()===0?((onSheet()?'SHEET 25 M · ':'')+RANGE_MODE_NAME[state.rangeMode||'bounce']+clock+' · HIT '+(state.rangeHit|0)+' · MISS '+(state.rangeMiss|0)):('BLU '+(state.blu|0)+' · RED '+(state.red|0)); } /* r.197: TRAIN DOWN carries its clock on the strip */")
rep("function noLockMsg(){ if(+state.challenge===0&&typeof rangeRun==='function'){ if(state.rangeAllDown) return 'ALL DOWN · PRESS RESTART';",
    "function noLockMsg(){ if(+state.challenge===0&&typeof rangeRun==='function'){ if(state.rangeMode==='stay'&&state.downGo==='done') return 'ALL DOWN · '+downClockWord()+' · PRESS RESTART'; if(state.rangeMode==='stay'&&state.downGo!=='run') return 'PRESS START · THE CLOCK RUNS TO THE LAST TARGET'; if(state.rangeAllDown) return 'ALL DOWN · PRESS RESTART';")
# the rows travel: START and TIME like RESET; a peer START runs my clock on the same lane, a peer TIME is the time
rep("  if((kind==='HOLD'||kind==='REJECT'||kind==='RESET'||kind==='RELOAD')&&!state.linkMute",
    "  if((kind==='HOLD'||kind==='REJECT'||kind==='RESET'||kind==='RELOAD'||kind==='START'||kind==='TIME')&&!state.linkMute")
rep("toast('THE OTHER SEAT RESTARTED '+laneWord()); } /* r.134: a reset reaches every peer as the same row */",
    "toast('THE OTHER SEAT RESTARTED '+laneWord()); } /* r.134: a reset reaches every peer as the same row */\n  else if(row.verb==='START' && row.peerId && row.peerId!==SID){ if(row.data&&(row.data.lane|0)===(state.lane|0)){ if(state.rangeMode!=='stay'){ state.rangeMode='stay'; const rm=document.getElementById('rngMode'); if(rm) rm.value='stay'; } downStart(); toast('THE OTHER SEAT STARTED THE CLOCK · HIT EVERY TARGET'); } } /* r.197: one clock per lane on every phone */\n  else if(row.verb==='TIME' && row.peerId && row.peerId!==SID){ if(row.data&&(row.data.lane|0)===(state.lane|0)&&state.rangeMode==='stay'){ state.downGo='done'; state.downT=(row.data.ms||0)/1000; state.rangeAllDown=true; } } /* r.197: the time is the row, not my stopwatch */")
# entering the mode, RESTART, a lane change: armed
rep("    rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false;\n    aimUnitAt(u,q,-20,8);\n  }\n  toast(modeSentence());",
    "    rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false;\n    aimUnitAt(u,q,-20,8);\n  }\n  if(state.rangeMode==='stay') downArm(); /* r.197: TRAIN DOWN opens armed — every target down until START (after the reset that stands them) */\n  toast(modeSentence());")
rep("if(typeof qualResetTower==='function'&&!rangeTraining()) qualResetTower(); /* r.137: a new lane in training stands every target; in QUAL it starts the program over */",
    "if(state.rangeMode==='stay') downArm(); /* r.197 */ if(typeof qualResetTower==='function'&&!rangeTraining()) qualResetTower(); /* r.137: a new lane in training stands every target; in QUAL it starts the program over */")

# 2 · QA — the all-down row goes through START; the clock and the record measured
rep("    { platesHere().forEach(q=>{ if(q.up){ q.lifePct=0; q.fall=0.05; } }); for(let i=0;i<40;i++) rangeTick(0.05); push('MODE_DOWN_ALL_DOWN', state.rangeAllDown===true && platesHere().every(q=>!q.up) && /ALL DOWN/.test(noLockMsg()), 'TRAIN DOWN: with every target down the strip says ALL DOWN · RESET'); }",
    "    { const qaA=state.qaArmed; state.qaArmed=true; downArm(); const armed=platesHere().every(q=>!q.up); downStartOnRecord('QA'); const up=platesHere().every(q=>q.up); platesHere().forEach(q=>{ if(q.up){ q.lifePct=0; q.fall=0.05; } }); for(let i=0;i<40;i++) rangeTick(0.05); push('MODE_DOWN_ALL_DOWN', armed&&up&&state.rangeAllDown===true&&state.downGo==='done'&&platesHere().every(q=>!q.up)&&/ALL DOWN/.test(noLockMsg()), 'TRAIN DOWN: armed with every target down '+armed+' · START stands them '+up+' · every target down again: the strip says ALL DOWN with the time ('+noLockMsg()+')'); state.qaArmed=qaA; } /* r.197: through START */")
ROWS=r"""    { /* r.197 · TRAIN_DOWN_CLOCK (operator 2026-10-11: "timer under stop light to see how fast") — armed: every target down, the button START, the light WAIT; START: every target up, the clock runs under the lamps; the last target down stops it; the time is on the light, in the strip and on the record */
      const l0=state.lane, s0=state.unit, qaA=state.qaArmed, S0=state._qaSilent, m0=state.rangeMode; state._qaSilent=true; state.qaArmed=true; state.lane=20; parkRangeTurrets(); state.unit='T21'; state.rangeMode='stay'; rangeReset(); downArm(); paintCues();
      const sw=()=>(document.getElementById('startWord')||{}).textContent, st=()=>(document.getElementById('startTime')||{}).textContent, btn=()=>(document.getElementById('btnRangeReset')||{}).textContent;
      const armed=platesHere().every(q=>!q.up)&&state.downGo===false&&startLight()==='R'&&btn()==='START'&&sw()==='START'&&st()==='';
      const e0=(state.events||[]).length; const ok1=downStartOnRecord('QA'); const row=(state.events||[]).slice(e0).find(e=>e.verb==='START'); const up=ok1&&platesHere().every(q=>q.up)&&state.downGo==='run'&&!!row&&!!row.data&&row.data.targets===11&&startLight()==='G';
      for(let i=0;i<10;i++) rangeTick(0.05); paintCues(); const running=(state.downT||0)>=0.45&&sw()==='TIME'&&st()===downClockWord()&&btn()==='RESTART';
      platesHere().forEach(q=>{ q.lifePct=0; q.fall=0.05; }); for(let i=0;i<40&&state.downGo!=='done';i++) rangeTick(0.05); const tRow=(state.events||[]).slice(e0).find(e=>e.verb==='TIME'); const stopped=state.downGo==='done'&&state.rangeAllDown===true&&!!tRow&&!!tRow.data&&Math.abs((tRow.data.ms|0)-Math.round((state.downT||0)*1000))<=50;
      paintCues(); hudScore(); const word=downClockWord(); const said=sw()==='ALL DOWN'&&st()===word&&(document.getElementById('phScore')||{}).textContent.indexOf('ALL DOWN · '+word)>=0&&/ALL DOWN/.test(noLockMsg());
      state.unit=s0; state.lane=l0; state.qaArmed=qaA; state._qaSilent=S0; state.rangeMode=m0; parkRangeTurrets(); rangeReset(); paintCues();
      push('TRAIN_DOWN_CLOCK', armed&&up&&running&&stopped&&said, 'armed: every target down, START, WAIT '+armed+' · START: every target up, a START row with targets 11, the light FIRE '+up+' · running: TIME '+running+' · the last target stops the clock, a TIME row within 50 ms '+stopped+' · ALL DOWN · '+word+' on the light, the strip and the hint '+said); }
    { /* r.197 · TRAIN_DOWN_ON_THE_RECORD — START is refused before the round opens (a REJECT row) and while the clock runs (a REJECT row); START and TIME are canonical rows and the replay hash moves with them */
      const l0=state.lane, s0=state.unit, qaA=state.qaArmed, S0=state._qaSilent, m0=state.rangeMode; state._qaSilent=true; state.lane=20; parkRangeTurrets(); state.unit='T21'; state.rangeMode='stay'; rangeReset(); downArm();
      state.qaArmed=false; const ph=state.lobby&&state.lobby.phase; if(state.lobby) state.lobby.phase='WAITING'; const e0=(state.events||[]).length; const closed=!downStartOnRecord('QA')&&platesHere().every(q=>!q.up); const r1=(state.events||[]).slice(e0).find(e=>e.verb==='REJECT'); const closedRow=!!r1&&!!r1.data&&r1.data.reason==='ROUND_NOT_OPEN'; if(state.lobby) state.lobby.phase=ph; state.qaArmed=true;
      const h0=replayHash(); const started=downStartOnRecord('QA'); const twice=!downStartOnRecord('QA'); const r2=(state.events||[]).slice(-1)[0]; const twiceRow=!!r2&&r2.verb==='REJECT'&&!!r2.data&&r2.data.reason==='CLOCK_RUNNING';
      platesHere().forEach(q=>{ q.lifePct=0; q.fall=0.05; }); for(let i=0;i<40&&state.downGo!=='done';i++) rangeTick(0.05); const rows=(state.events||[]).slice(e0).map(e=>e.verb); const moved=replayHash()!==h0; const onRecord=rows.includes('START')&&rows.includes('TIME')&&moved;
      state.unit=s0; state.lane=l0; state.qaArmed=qaA; state._qaSilent=S0; state.rangeMode=m0; parkRangeTurrets(); rangeReset(); paintCues();
      push('TRAIN_DOWN_ON_THE_RECORD', closed&&closedRow&&started&&twice&&twiceRow&&onRecord, 'START before the round: refused, REJECT ROUND_NOT_OPEN '+(closed&&closedRow)+' · START '+started+' · START again while running: refused, REJECT CLOCK_RUNNING '+(twice&&twiceRow)+' · rows '+rows.filter(v=>v==='START'||v==='TIME'||v==='REJECT').join(',')+' · the replay hash moved '+moved); }
"""
rep("    { /* r.157 · QUAL_DONE_SAYS_RESTART", ROWS+"    { /* r.157 · QUAL_DONE_SAYS_RESTART")

# 3 · the deck says what it is
rep('overflow:auto">r.196 RESTORE',
    'overflow:auto">r.197 TRAIN DOWN · pick it and every target is down, the light says WAIT, the button says START. START stands the lane and runs the clock under the lamps. The last target down stops it. START and the time are on the record, on every phone.\nr.196 RESTORE')
for dead in ["revision:'0.196'","r0.196</span>"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

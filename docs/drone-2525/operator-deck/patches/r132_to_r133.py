# r.132 -> r.133 — the fold of the 38-AsM team test (docs/assessments/2026-09-19_r132_asm_team_test.md).
# Every replacement asserts its exact anchor and count; a miss REFUSES (nothing is written).
import hashlib
SRC='/home/user/eXeL-AI-Polling/docs/drone-2525/operator-deck/drone-2525_r.132.html'
DST='/home/user/eXeL-AI-Polling/docs/drone-2525/operator-deck/drone-2525_r.133.html'
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── D1 · the score strip wraps; nothing a player must read is clipped (s04 s10 s13 s15 s16 s17 s24 s26) ──
rep("#playHud{position:absolute;left:8px;right:8px;top:6px;z-index:2;display:flex;gap:12px;flex-wrap:nowrap;pointer-events:none;font-size:10px;letter-spacing:.1em;color:#3DCC8A;opacity:.85;overflow:hidden;white-space:nowrap}",
    "#playHud{position:absolute;left:8px;right:8px;top:6px;z-index:2;display:flex;gap:4px 12px;flex-wrap:wrap;pointer-events:none;font-size:10px;letter-spacing:.1em;color:#3DCC8A;opacity:.85;overflow:visible;white-space:normal} /* r.133: the strip WRAPS — at 320-390 px the HIT/MISS/LAPSED, the QUAL clock and ALL DOWN · RESET were clipped off the phone */\n#playHud #phScore{flex-basis:100%}")
rep("#board{position:absolute;left:8px;top:28px;","#board{position:absolute;left:8px;top:44px;")

# ── D7 · desktop: the panel lives in the strip the stage reserves for it, not on the picture (s09 s25) ──
rep("#app.desk #stage{margin-right:min(300px,32vw)}",
    "#app.desk #stage{margin-right:min(300px,32vw)}\n#app.desk #side{right:calc(-1 * min(300px,32vw));width:min(300px,32vw)} /* r.133: the panel sat ON the right quarter of the picture while the reserved strip stayed black */")

# ── D2 · the score is written when it changes, not one frame later (s01 s06 s08 s15 s17 s22 s25 s26) ──
rep("""  const ps=document.getElementById('phScore'); if(ps){
    if(chNum()===0&&state.rangeMode==='qual40'){
      const tb=QUAL_TABLES[state.qualTbl||0]||QUAL_TABLES[2];
      const rem=state.qualDone?0:state.qualStarted?Math.max(0,Math.ceil(tb.sec-(state.clock-(state.qualT0||state.clock)))):tb.sec;
      ps.textContent=state.qualDone?('QUAL '+(state.qualH||0)+'/40 '+qualBadge(state.qualH||0)):('T'+tb.id+' '+(state.qualTblH||0)+'/'+(state.qualTblR||0)+' of '+tb.lim+' · '+rem+'s · TOTAL '+(state.qualH||0)+'/'+(state.qualR||0)+(state.qualExpired?' · LAPSED '+state.qualExpired:''));
    } else ps.textContent=chNum()===0?(RANGE_MODE_NAME[state.rangeMode||'bounce']+' · HIT '+(state.rangeHit|0)+' · MISS '+(state.rangeMiss|0)+' · LAPSED '+(state.rangeLapsed|0)+(state.rangeAllDown?' · ALL DOWN · RESET':'')):('BLU '+(state.blu|0)+' · RED '+(state.red|0));
  }
""","""  hudScore();
""")
rep("function applyHit(ref,id){",
"""/* r.133: ONE writer for the score strip, called every frame AND at the moment a hit, miss or lapse lands — the seats read
   "HIT 2" beside a toast saying the third hit had landed, because the strip was repainted a frame later. */
function hudScore(){
  const ps=document.getElementById('phScore'); if(!ps) return;
  if(chNum()===0&&state.rangeMode==='qual40'){
    const tb=QUAL_TABLES[state.qualTbl||0]||QUAL_TABLES[2];
    const rem=state.qualDone?0:state.qualStarted?Math.max(0,Math.ceil(tb.sec-(state.clock-(state.qualT0||state.clock)))):tb.sec;
    ps.textContent=state.qualDone?('QUAL '+(state.qualH||0)+'/40 '+qualBadge(state.qualH||0)):('TABLE '+tb.id+' · '+(state.qualTblH||0)+'/'+(state.qualTblR||0)+' of '+tb.lim+' · '+rem+' S LEFT · TOTAL '+(state.qualH||0)+'/'+(state.qualR||0)+(state.qualExpired?' · LAPSED '+state.qualExpired:''));
  } else ps.textContent=chNum()===0?(RANGE_MODE_NAME[state.rangeMode||'bounce']+' · HIT '+(state.rangeHit|0)+' · MISS '+(state.rangeMiss|0)+' · LAPSED '+(state.rangeLapsed|0)+(state.rangeAllDown?' · ALL DOWN · PRESS RESET':'')):('BLU '+(state.blu|0)+' · RED '+(state.red|0));
}
function bandWord(b){ return ({CIRCLE:'IN THE AIMING CIRCLE',SILHOUETTE:'ON THE SILHOUETTE',DOWN:'TARGET ALREADY DOWN',SPENT:'ROUND ALREADY SPENT',CULLED:'OUT OF THE PICTURE'})[b]||b; } /* r.133: the band in the player's words; the record keeps the band name */
function applyHit(ref,id){""")
rep("  if(isPlate){ if(hit) state.rangeHit=(state.rangeHit|0)+1; else state.rangeMiss=(state.rangeMiss|0)+1; }",
    "  if(isPlate){ if(hit) state.rangeHit=(state.rangeHit|0)+1; else state.rangeMiss=(state.rangeMiss|0)+1; hudScore(); }")
rep("(state.lastBand?' · '+state.lastBand:'')","(state.lastBand?' · '+bandWord(state.lastBand):'')",2)

# ── D9 · a stranger's words on the strip and the picker ──
rep("else if(ls){pd.textContent='LAST T'+ls.slot+' '+ls.id+' '+(ls.dead?'DOWN':((ls.life|0)+'%'))+(ls.direct?' DIRECT':' OFF'); pd.style.color='#F0A020';}",
    "else if(ls){pd.textContent='LAST T'+ls.slot+' '+ls.id+' '+(ls.dead?'DOWN':((ls.life|0)+'%'+(ls.direct?' DIRECT':' OFF'))); pd.style.color='#F0A020';} /* r.133: a downed target is DOWN — 'DIRECT' is also the link path's name */")
rep("else if(ph==='amber'){pd.textContent='AMBER T'+(state.desig.slot||1)+' '+state.desig.id; pd.style.color='#F0A020';}",
    "else if(ph==='amber'){pd.textContent='AMBER T'+(state.desig.slot||1)+' '+state.desig.id+(state.desig.by&&state.desig.by!==SID?' · MARKED BY '+state.desig.by:''); pd.style.color='#F0A020';} /* r.133: the AI member's mark is attributed on the strip */")
rep('<option value="range">SCEN · 50M RANGE</option>','<option value="range">SCEN · RANGE 50-300 M</option>')
rep("<h2>TEAM SECRETS · HOST</h2>","<h2>TEAM SECRETS</h2>")
rep("hc.textAlign='right';hc.fillStyle=T13.ROAD;hc.fillText(units[state.unit].label+' · SPIRAL v'+state.spiral,W-12,H-20);",
    "hc.textAlign='right';hc.fillStyle=T13.ROAD;hc.fillText(units[state.unit].label+' · SPIRAL v'+state.spiral,W-12,H-52); /* r.133: off the LOCK line it overprinted at 320 px */")
rep("hc.fillStyle=T13.LOCK;hc.fillText('LOCK',60,H-36);","hc.fillStyle=T13.SI;hc.fillText('LOCK',60,H-36); /* r.133: LOCK is aim, never authority — it is not drawn in the red box's colour */")
rep("    toast(k+' '+(id||'')+(pay&&pay.reason?' · '+pay.reason:''));",
    "    toast('THE OTHER SEAT · '+k+(id&&id!=='NONE'?' '+id:'')+(pay&&pay.reason?' · '+String(pay.reason).replace(/_/g,' '):'')); /* r.133: the joiner read the host's refused second pull as its own */")

# ── D5 · one sentence for an empty range, whoever asks (s10 s16) ──
rep("if(!s){toast('NO T'+n);log('TGT','none',n);return null;}",
    "if(!s){toast(+state.challenge===0?noLockMsg():('NO T'+n));log('TGT','none',n);return null;} /* r.133: key 1 says what the TARGET button and voice say */")

# ── D6 · a hit target leaves the lock and its caption at once (s01-s03 s14) ──
rep("if(o.up!==false&&(o.fall||0)<0.25){const s=sc(worldOf(o)); if(s.dot>0.82)","if(o.up!==false&&(o.fall||0)<0.25&&!(o.lifePct<=0)){const s=sc(worldOf(o)); if(s.dot>0.82)")
rep("platesHere().forEach(p=>{if(!p.up||(p.fall||0)>0.25)return;","platesHere().forEach(p=>{if(!p.up||(p.fall||0)>0.25||p.lifePct<=0)return;")
rep("(typeof platesHere==='function'?platesHere():QUAL).forEach(p=>{if(!p.up||(p.fall||0)>0.25)return;","(typeof platesHere==='function'?platesHere():QUAL).forEach(p=>{if(!p.up||(p.fall||0)>0.25||p.lifePct<=0)return;")
rep("platesHere().forEach(q=>{ if(!q.up||(q.fall||0)>0.25) return; const r=plateRect(q);","platesHere().forEach(q=>{ if(!q.up||(q.fall||0)>0.25||q.lifePct<=0) return; const r=plateRect(q);")

# ── D3 · the approver's device tallies and clears from the same canonical row (s06 s09 s13 s23 s24) ──
rep("""      if((o.lifePct||0)<=0&&!o.form) o.up=false;
    }
  }
  if(row.verb==='LAPSE' && id){""","""      if((o.lifePct||0)<=0&&!o.form) o.up=false;
      if(o.form&&row.peerId&&row.peerId!==SID){ o._eng=true; if(/^HIT/.test(res)){ state.rangeHit=(state.rangeHit|0)+1; rangeRelease(o); toast('THE OTHER SEAT HIT · '+id); } hudScore(); } /* r.133: the approver saw HIT 0 and a red box on a dead target — the peer's HIT row now tallies and takes the box down here too */
    }
  }
  if(row.verb==='MISS' && id && row.peerId && row.peerId!==SID){ const o=findTgt(id); if(o&&o.form){ o._eng=true; if(String(row.result||'')==='MISS'){ state.rangeMiss=(state.rangeMiss|0)+1; toast('THE OTHER SEAT MISSED · '+id); } hudScore(); } }
  if(row.verb==='LAPSE' && id){""")

# ── D10/D8 · no lapse counts before the round starts (s07 s06 s13 s20 s21 s22) ──
rep("if(L.i===mine){ if(!q._eng){ rangeLapse(q); state.rangeLapsed=(state.rangeLapsed|0)+1; } } rangeRelease(q); }",
    "if(L.i===mine&&rangeArmed()){ if(!q._eng){ rangeLapse(q); state.rangeLapsed=(state.rangeLapsed|0)+1; hudScore(); } } rangeRelease(q); }")
rep("function rangeLapse(q){","function rangeArmed(){ const ph=state.lobby&&state.lobby.phase; return ph==='PRACTICE'||ph==='LIVE'||!!state.qaArmed; } /* r.133: the range ran and lapsed 54 targets behind the intro and 1 in every waiting room — a lapse counts only once someone may fire */\nfunction rangeLapse(q){")
rep("function toolSelfTest(){","function toolSelfTest(){\n  state.qaArmed=true;")
rep("  state.qa={pass,total:rows.length,rev:BUILD.revision,t:Date.now(),known:KNOWN};","  state.qaArmed=false; state.qa={pass,total:rows.length,rev:BUILD.revision,t:Date.now(),known:KNOWN};")
rep("try{toolSelfTest();}catch(e){ state.qa=","try{toolSelfTest();}catch(e){ state.qaArmed=false; state.qa=")

# ── D11 · a refusal names the next action; a toast lives long enough to be read (s07 s12) ──
rep("if(ch!==0){toast('PRACTICE / NO ROOM · CH0 ONLY');return false;}",
    "if(ch!==0){toast('PRACTICE ALONE IS CH0 ONLY · PICK CH0 TRAIN, OR ENTER THE WAITING ROOM FOR CH'+ch);return false;}")
rep("toast._=setTimeout(()=>t.style.display='none',1400);}","toast._=setTimeout(()=>t.style.display='none',Math.max(1400,Math.min(4200,45*String(m).length)));} /* r.133: a long sentence stays up long enough to be read */")

# ── D12/D13 · TARGET aims as well as marks; the approver's head turns to what it is approving (s20 s21) ──
rep("if(_ft)_ft.onclick=()=>{const lk=lockOn(); state.slot=state.slot||1; if(!lk){toast(noLockMsg());return;} designate({id:lk.id,kind:lk.kind,ref:lk.ref},SID); toast('AMBER · T'+state.slot+' '+lk.id+' · WAIT APPROVE');};",
    "if(_ft)_ft.onclick=()=>{const lk=lockOn(); state.slot=state.slot||1; if(!lk){toast(noLockMsg());return;} designate({id:lk.id,kind:lk.kind,ref:lk.ref},SID); const u=units[state.unit]; if(u&&u.kind==='turret'&&lk.ref) aimUnitAt(u,lk.ref,-40,20); toast('AMBER · T'+state.slot+' '+lk.id+' · WAIT APPROVE');}; /* r.133: TARGET puts the head ON the mark (key 1 already did) — a red box 130 px off the pip was read as a refusal */")
rep("  state.desig={id,kind:(kind&&kind!=='obj')?kind:kindOfRef(ref),ref,by,t:state.clock,slot:n,phase:'amber',how:'PEER'};\n  return {accepted:true,msg:'NET AMBER T'+n+' '+id};",
    "  state.desig={id,kind:(kind&&kind!=='obj')?kind:kindOfRef(ref),ref,by,t:state.clock,slot:n,phase:'amber',how:'PEER'};\n  { const u=units[state.unit]; if(u&&u.kind==='turret'&&!state.qaArmed) aimUnitAt(u,ref,-40,20); } /* r.133: the approver looks at what it is approving — the box was off the joiner's screen */\n  return {accepted:true,msg:'NET AMBER T'+n+' '+id};")

# ── D4 · the AI member: ticked in live play, spots from the pit, fires only on red and through the one path (s05 s11 s18 s19) ──
rep("  if(+state.challenge===0) rangeTick(dt);","  if(+state.challenge===0) rangeTick(dt);\n  asmTick(dt); /* r.133: asmTick was defined and never called from live play — the AI member was dead code behind a working button */")
rep("    let best=live[0],bd=1e9;\n    live.forEach(o=>{const ow=worldOf(o); const d=Math.hypot(ow.x-u.x,ow.z-u.z); if(d<bd){bd=d;best=o;}});",
    "    const pit=(+state.challenge===0&&units[state.unit])?units[state.unit]:u; /* r.133: on the range the AI member spots from the seated lane's pit — its own mount can stand 300 m from the lane */\n    let best=live[0],bd=1e9;\n    live.forEach(o=>{const ow=worldOf(o); const d=Math.hypot(ow.x-pit.x,ow.z-pit.z); if(d<bd){bd=d;best=o;}});")
rep("""    if(state.asmFire && state.desig && state.desig.id===best.id && challengeSpec().c<5){
      best.up=false; state.hits++; const pts=best.id.indexOf('UAV')===0?250:100;
      if((u.team||'BLU')==='RED') state.red+=pts; else state.blu+=pts;
      state.score+=pts; feed((u.team||'BLU')+' AsM '+best.id); log('ASM',id,best.id);
      state.desig=null;
    }""","""    if(state.asmFire && state.desig && state.desig.id===best.id && state.desig.phase==='red' && !state.desig.asmFired && challengeSpec().c<5){ /* r.133: the AI member fires ONLY on a red box (a named human approved), once per box, through the one fire path — the r.132 branch downed the target on amber with no APPROVE and no record */
      state.desig.asmFired=true; feed((u.team||'BLU')+' AsM FIRE '+best.id); log('ASM',id,best.id); fireN(state.desig.slot||state.slot||1);
    }""")
rep("asmSpot:true,asmFire:false","asmSpot:false,asmFire:false")
rep('<button id="btnAsm" type="button">AsM SPOT</button>','<button id="btnAsm" type="button">AsM OFF</button>')
rep("  if(state.asmSpot && !state.asmFire){state.asmFire=true;_asm.textContent='AsM FIRE';toast('AsM MAY FIRE · HI still designates');}\n  else if(state.asmFire){state.asmSpot=false;state.asmFire=false;_asm.textContent='AsM OFF';toast('AsM OFF · HI ONLY');}\n  else {state.asmSpot=true;_asm.textContent='AsM SPOT';toast('AsM SPOT · HI FIRES');}",
    "  if(state.asmSpot && !state.asmFire){state.asmFire=true;_asm.textContent='AsM FIRE';toast('AsM FIRES AFTER YOUR APPROVE · YOU STILL MARK OR APPROVE');}\n  else if(state.asmFire){state.asmSpot=false;state.asmFire=false;_asm.textContent='AsM OFF';toast('AsM OFF · HUMANS ONLY');}\n  else {state.asmSpot=true;_asm.textContent='AsM SPOT';toast('AsM SPOT · THE AI MARKS, YOU APPROVE AND FIRE');} /* r.133: OFF is the default; the cycle is OFF → SPOT → FIRE */")

# ── QA rows ──
rep("    push('HOLD_ROWS_TRAVEL',","""    { const hp=document.getElementById('playHud'); const cs=hp?getComputedStyle(hp):null; push('HUD_SCORE_WRAPS', !!cs&&cs.whiteSpace!=='nowrap'&&cs.overflow!=='hidden'&&cs.flexWrap==='wrap', 'the score strip wraps instead of clipping HIT/MISS/LAPSED and the QUAL clock off a phone'); }
    { rangeReset(); const q=rangeExpose(0,'C-300'); const sA=state.asmSpot,sF=state.asmFire,sL=state.hiLock; state.asmSpot=true; state.asmFire=false; state.hiLock=false; state.desig=null; state.tgtSlot={}; for(let i=0;i<10;i++) asmTick(0.1);
      push('ASM_SPOTS_FROM_PIT', !!(state.desig&&state.desig.id===q.id&&state.desig.phase==='amber'&&state.desig.by!==SID), 'the AI member marks a 300 m silhouette from the seated pit, in its own name · '+(state.desig?state.desig.id+' by '+state.desig.by:'none'));
      const h0=state.rangeHit|0; state.asmFire=true; for(let i=0;i<10;i++) asmTick(0.1);
      push('ASM_FIRE_NEEDS_RED', (state.rangeHit|0)===h0&&q.lifePct>0&&!!state.desig&&state.desig.phase==='amber', 'with AsM FIRE on, an amber mark never fires: no human APPROVE, no shot');
      push('ASM_TICKED_LIVE', /asmTick\\(dt\\)/.test(spawn.toString()), 'the AI member is ticked from the live loop (it was dead code in r.132)');
      state.asmSpot=sA; state.asmFire=sF; state.hiLock=sL; state.desig=null; state.tgtSlot={}; }
    { rangeReset(); const q=rangeExpose(0,'C-150L'); state.desig=null; state.tgtSlot={}; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const h0=state.rangeHit|0; applyWorld({verb:'HIT',id:q.id,result:'HIT CIRCLE',peerId:'QA-PEER'});
      push('PEER_HIT_TALLIES_AND_CLEARS', (state.rangeHit|0)===h0+1&&!state.desig&&q.lifePct<=0, 'a HIT row from the other seat counts on this device and takes the red box down with the target');
      state.desig=null; state.tgtSlot={}; }
    push('EMPTY_RANGE_ONE_SENTENCE', /noLockMsg\\(\\)/.test(targetN.toString()), 'key 1, the TARGET button and voice say the same sentence when nothing is up');
    { const ph0=state.lobby&&state.lobby.phase; if(state.lobby) state.lobby.phase='SETUP'; state.qaArmed=false; rangeReset(); const q=rangeExpose(0,'C-50'); const l0=state.rangeLapsed|0; for(let i=0;i<(EXPOSURE_S[50]+0.5)*20;i++) rangeTick(0.05);
      push('RANGE_IDLE_BEFORE_START', (state.rangeLapsed|0)===l0&&!q.up, 'a target that lapses behind the intro or the waiting room is not a lapse against the player'); if(state.lobby) state.lobby.phase=ph0; state.qaArmed=true; }
    push('HOLD_ROWS_TRAVEL',""")


# ── the reducer keeps the author designate() wrote (s18: the AI's mark was re-stamped with the human's id) ──
rep("state.desig={id,kind:kindOfRef(o),ref:o||{id,x:0,y:1,z:0},phase:'amber',how:'PEER',slot:(same&&same.slot)||state.slot||1,by:row.peerId||(same&&same.by)||SID,t:state.clock};",
    "state.desig={id,kind:kindOfRef(o),ref:o||{id,x:0,y:1,z:0},phase:'amber',how:(same&&same.how)||'PEER',slot:(same&&same.slot)||state.slot||1,by:(same&&same.by)||row.peerId||SID,t:state.clock}; /* r.133: a local row keeps the author designate() wrote — the AI member's mark was re-stamped with the human's id */")


# ── on the range the AI member sees ONLY the seated lane's silhouettes (a nearer lawn pop-up stole "best" and its 80 m gate) ──
rep("  const live=[...pops.filter(p=>p.up),...drones.filter(d=>d.up),...((+state.challenge===0&&typeof platesHere==='function')?platesHere().filter(q=>q.up&&(q.fall||0)<0.25&&q.lifePct>0):[])]; /* r.132: on the range the AI member sees the exposed silhouette */",
    "  const live=(+state.challenge===0&&typeof platesHere==='function')?platesHere().filter(q=>q.up&&(q.fall||0)<0.25&&q.lifePct>0):[...pops.filter(p=>p.up),...drones.filter(d=>d.up)]; /* r.133: on the range the AI member sees ONLY the seated lane's exposed silhouette — a nearer lawn pop-up was chosen as best and then failed its own 80 m gate, so no plate was ever marked */")

c=s.count("revision:'0.132'"); rep("revision:'0.132'","revision:'0.133'",c)
h=s.count("r0.132"); rep("r0.132","r0.133",h)
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

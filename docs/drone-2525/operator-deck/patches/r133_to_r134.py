# r.133 -> r.134 — the fold of team-test wave 3 (12 seats on the served r.133) and the 48-lens fleet review.
# Every replacement asserts its exact anchor and count; a miss REFUSES (nothing is written).
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')) # r.134: paths relative to the patch (Krishna A: absolute /home/user paths could not run in CI)
SRC=os.path.join(DECK,'drone-2525_r.133.html')
DST=os.path.join(DECK,'drone-2525_r.134.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── D15 · RESET is on the record, on the peer, and asks before discarding a live table (s33) ──
rep("const _rr=document.getElementById('btnRangeReset'); if(_rr)_rr.onclick=()=>{ resetRangePlates(); if(typeof goRange==='function') goRange(); toast('RANGE RESET'); };",
"""function rangeResetOnRecord(why){ /* r.134: a reset is a decision — one canonical row here and on every peer; a live QUAL table asks first */
  const live=state.rangeMode==='qual40'&&(state.qualR|0)>0&&!state.qualDone;
  if(live&&why==='BUTTON'&&!(state._resetArm&&performance.now()-state._resetArm<4000)){ state._resetArm=performance.now(); toast('PRESS RESET AGAIN TO DISCARD '+(state.qualR|0)+' ROUNDS OF THIS TABLE'); return false; }
  state._resetArm=0; decide('RESET','RANGE',{why,mode:state.rangeMode,lane:state.lane|0,qualR:state.qualR|0,qualH:state.qualH|0});
  resetRangePlates(); if(typeof goRange==='function') goRange(); state.lastShot=null; return true; }
const _rr=document.getElementById('btnRangeReset'); if(_rr)_rr.onclick=()=>{ if(rangeResetOnRecord('BUTTON')) toast('RANGE RESET · ON THE RECORD'); };""")
rep("""  state.rangeMode=e.target.value;
  resetRangePlates();""","""  state.rangeMode=e.target.value;
  rangeResetOnRecord('MODE');""")
rep("  if(typeof goRange==='function') goRange();\n  toast(RANGE_MODE_NAME[state.rangeMode]", "  toast(RANGE_MODE_NAME[state.rangeMode]") if s.count("  if(typeof goRange==='function') goRange();\n  toast(RANGE_MODE_NAME[state.rangeMode]")==1 else None
rep("if((kind==='HOLD'||kind==='REJECT')&&!state.linkMute","if((kind==='HOLD'||kind==='REJECT'||kind==='RESET')&&!state.linkMute")
rep("  if(row.verb==='LAPSE' && id){ const o=findTgt(id); if(o){ o.up=false; o.fall=1; } }",
    "  if(row.verb==='LAPSE' && id){ const o=findTgt(id); if(o){ o.up=false; o.fall=1; } }\n  if(row.verb==='RESET' && row.peerId && row.peerId!==SID){ if(typeof resetRangePlates==='function') resetRangePlates(); if(typeof goRange==='function') goRange(); state.lastShot=null; toast('THE OTHER SEAT RESET THE RANGE'); } /* r.134: a reset reaches every peer as the same row */")

# ── D16 · the link has a heartbeat; a lost approver is said, and its red box goes back to amber (s35) ──
rep("  if(k==='HELLO'||k==='PRESENCE'){\n    state.com.peers=Math.max(2,state.com.peers);",
    "  if(k==='HELLO'||k==='PRESENCE'){\n    state.com.lastPeerAt=performance.now(); if(state.com.path==='DROPPED'&&state.link&&state.link.dc&&state.link.dc.readyState==='open'){ state.com.path='DIRECT'; toast('THE OTHER SEAT IS BACK'); } /* r.134: liveness */\n    state.com.peers=Math.max(2,state.com.peers);")
rep("setInterval(()=>{ if(state.link&&state.link.mode!=='TAB' || (state.com.peers>0)) commHello(); },4000);",
"""function linkLost(why){ /* r.134: the strip read DIRECT · 2p · MATCH for 48 s after the other phone was gone; a lost approver is said, and its approval does not outlive it */
  if(state.com.path!=='DIRECT') return; state.com.path='DROPPED'; state.com.peers=1; state.sync='ALONE';
  if(state.desig&&state.desig.phase==='red'&&state.desig.how&&/PEER/.test(String(state.desig.how))){ state.desig.phase='amber'; state.hiApproved=false; decide('HOLD',state.desig.id,{reason:'APPROVER_LOST',why}); }
  else decide('HOLD','LINK',{reason:'PEER_LOST',why});
  toast('THE OTHER SEAT IS GONE ('+why+') · YOU ARE ALONE · A RED BOX GOES BACK TO AMBER'); const p=document.getElementById('pathTxt'); if(p) p.textContent='DROPPED · 1p'; }
setInterval(()=>{ if(state.link&&state.link.mode!=='TAB' || (state.com.peers>0)) commHello(); if(state.com.path==='DIRECT'&&state.com.peers>=2&&state.com.lastPeerAt&&performance.now()-state.com.lastPeerAt>12000) linkLost('SILENT 12 S'); },4000);""")
rep("    if(['disconnected','failed','closed'].includes(s)) proofMark('disconnectSeen',true);",
    "    if(['disconnected','failed','closed'].includes(s)) proofMark('disconnectSeen',true);\n    if(['failed','closed'].includes(s)&&typeof linkLost==='function') linkLost('LINK '+String(s).toUpperCase());")
rep("  dc.addEventListener&&dc.addEventListener('close',()=>proofMark('disconnectSeen',true));",
    "  dc.addEventListener&&dc.addEventListener('close',()=>{proofMark('disconnectSeen',true); if(typeof linkLost==='function') linkLost('CHANNEL CLOSED');});")

# ── D17 · VOICE says the outcome, not the intent; OFF works; a negation is a HOLD (s36) ──
rep("  if(!SR){toast('NO MIC API');return;}","  if(!SR){toast('NO SPEECH SERVICE IN THIS BROWSER · USE TARGET / APPROVE / FIRE');return;}")
rep("  if(state.voice&&state.rec){try{state.rec.stop();}catch(_){} state.voice=false;voiceSync();toast('VOICE OFF');return;}",
    "  if(state.rec){try{state.rec.stop();}catch(_){} state.rec=null; state.voice=false;voiceSync();toast('VOICE OFF');return;} /* r.134: a second press always turns it off, even after the recognizer died */")
rep("  r.onerror=()=>{state.voice=false;};",
    "  r.onerror=e=>{ const why=e&&e.error||''; state.voice=false; state.rec=null; voiceSync(); log('VOICE','ERR',why); toast('VOICE OFF · '+(why==='not-allowed'||why==='audio-capture'||why==='service-not-allowed'?'THIS DEVICE CANNOT LISTEN':why==='no-speech'?'HEARD NOTHING':'NO SPEECH SERVICE')+' · USE TARGET / APPROVE / FIRE'); }; /* r.134: the button said ON while the recognizer had died */")
rep("    if(/\\b(?:approve|approved|cleared)\\b/.test(t)){ approveDesig('HI-2'); toast('VOICE APPROVE'); return; }\n    if(/\\b(?:hold|cease|check|stop|don'?t|do not|no)\\b/.test(t)){ toast('VOICE HOLD'); log('VOICE','HOLD',t); return; }",
    "    if(/\\b(?:hold|cease|check|stop|don'?t|do not|no|not)\\b/.test(t)){ toast('VOICE HOLD'); log('VOICE','HOLD',t); return; } /* r.134: a negation is heard BEFORE consent — \"don't approve\" used to approve */\n    if(/\\b(?:approve|approved|cleared)\\b/.test(t)){ approveDesig('HI-2'); toast('VOICE APPROVE'); return; }")
rep("toast('VOICE ON · say TARGET');}catch(e){toast('MIC BLOCKED');}","toast('LISTENING · say TARGET, APPROVE, FIRE');}catch(e){state.rec=null;state.voice=false;voiceSync();toast('MIC BLOCKED · USE TARGET / APPROVE / FIRE');}")

# ── D18 · MAP view keeps the strip and the phase honest; the legend leaves the strip; no Capitol doors on the range map (s28) ──
rep("""  if(state.viewMode==='map'){
    state.map=state.map||{x:0,z:8};
    state.map.x+=(state.joy.lx||0)*90*dt;
    state.map.z+=-(state.joy.ly||0)*90*dt;
    return;
  }""","""  if(state.viewMode==='map'){
    state.map=state.map||{x:0,z:8};
    state.map.x+=(state.joy.lx||0)*90*dt;
    state.map.z+=-(state.joy.ly||0)*90*dt;
    hudScore(); hudPhase(); return; /* r.134: the strip froze at TARGET FIRST through amber → red → HIT while the map was up */
  }""")
rep("""  const pd=document.getElementById('phDes'); if(pd){
    const ph=state.desig&&state.desig.phase;""","""  hudPhase();
}
function hudPhase(){ /* r.134: one writer for the phase strip, run in every view */
  const pd=document.getElementById('phDes'); if(pd){
    const ph=state.desig&&state.desig.phase;""")
rep("""    else {pd.textContent='TARGET FIRST'; pd.style.color='#C9A227';}
  }
  const pe=document.getElementById('phSeat'); if(pe) pe.textContent=(state.unit||'')+' 웃';
""","""    else {pd.textContent='TARGET FIRST'; pd.style.color='#C9A227';}
  }
  const pe=document.getElementById('phSeat'); if(pe) pe.textContent=(state.unit||'')+' 웃';
}
function hudTail(){
""")
rep("hc.fillText('MAP · 42 LANES · tap L## · QUAL gold · UP green · DOWN blue',12,22);","hc.fillText('MAP · 42 LANES · tap L## · QUAL gold · UP green · DOWN blue',12,H-64); /* r.134: off the score strip it overprinted */")
rep("  doors.forEach(d=>segs(box(d.x,d.y,d.z,2,3,.2),hot(d)?T13.LOCK:T13.GIMBAL));","  if(chNum()!==0) doors.forEach(d=>segs(box(d.x,d.y,d.z,2,3,.2),hot(d)?T13.LOCK:T13.GIMBAL)); /* r.134: no Capitol doors on the range map */")
rep("  doors.forEach(d=>mark(d));","  if(chNum()!==0) doors.forEach(d=>mark(d));")

# ── D19 · the AI loop stops for the tick after its own shot and never marks a dead plate (s38) ──
rep("  Object.keys(units).forEach(id=>{\n    const u=units[id]; if(u.kind!=='turret'||id===state.unit) return;",
    "  let asmFiredThisTick=false;\n  Object.keys(units).forEach(id=>{\n    const u=units[id]; if(u.kind!=='turret'||id===state.unit||asmFiredThisTick) return;")
rep("    if(state.asmSpot && !state.hiLock && !state.desig && bd<(best.form?340:80)){","    if(state.asmSpot && !state.hiLock && !state.desig && best.up!==false && !(best.lifePct<=0) && bd<(best.form?340:80)){ /* r.134: never a dead plate (the second turret re-marked what the first had just downed) */")
rep("      state.desig.asmFired=true; feed((u.team||'BLU')+' AsM FIRE '+best.id); log('ASM',id,best.id); fireN(state.desig.slot||state.slot||1);",
    "      state.desig.asmFired=true; asmFiredThisTick=true; feed((u.team||'BLU')+' AsM FIRE '+best.id); log('ASM',id,best.id); fireN(state.desig.slot||state.slot||1);")

# ── D20 · a setting you change says so (s31) ──
rep("hp.onchange=e=>{state.hal=e.target.value;state.stream=0;state.liveMods=['EO'];log('HAL',state.hal);};","hp.onchange=e=>{state.hal=e.target.value;state.stream=0;state.liveMods=['EO'];log('HAL',state.hal);toast('HARDWARE PROFILE · '+state.hal);};")
rep("document.getElementById('motLvl').onchange=e=>{state.level=e.target.value;log('MOT',state.level,spec().band);sample({ev:'MOT'});};","document.getElementById('motLvl').onchange=e=>{state.level=e.target.value;log('MOT',state.level,spec().band);sample({ev:'MOT'});toast('MoT '+state.level+' · '+spec().band+' · '+spec().seg+' SEGMENTS');};")
rep("document.getElementById('cilTxt').textContent=state.fps.toFixed(0)+'/'+S.fps+' '+state.segs+'s cnn'+S.cnn;","document.getElementById('cilTxt').textContent=state.fps.toFixed(0)+'/'+S.fps+' '+state.segs+'s cnn'+S.cnn+(chNum()===0&&typeof pipFloorPx==='function'?' pip '+pipFloorPx()+'px':''); /* r.134: the pip floor the comment promised */")

# ── D21 · REPLAY reachable on a phone; PLAY plays; « » step one row (s30) ──
rep('      <button id="btnAsm" type="button">AsM OFF</button>','      <button id="btnAsm" type="button">AsM OFF</button>\n      <button id="btnReplayTgl" type="button">REPLAY</button>')
rep("#replayBar{display:flex;align-items:center;gap:6px;padding:4px 8px;border-top:1px solid #122;font-size:10px;color:var(--r);flex-wrap:wrap}","#replayBar{display:flex;align-items:center;gap:6px;padding:4px 8px;border-top:1px solid #122;font-size:10px;color:var(--r);flex-wrap:wrap}\n#app.replay #replayBar{display:flex !important;position:fixed;left:0;right:0;bottom:calc(140px + env(safe-area-inset-bottom));z-index:7;background:rgba(0,0,0,.92)} /* r.134: the phone and landscape hid the bar; MORE → REPLAY shows it */")
rep("const _asm=document.getElementById('btnAsm');","const _rpt=document.getElementById('btnReplayTgl'); if(_rpt)_rpt.onclick=()=>{ const on=document.getElementById('app').classList.toggle('replay'); toast(on?'REPLAY · DRAG THE BAR · PLAY STEPS THE RECORD':'REPLAY HIDDEN'); };\nconst _asm=document.getElementById('btnAsm');")
rep("sl.value=Math.max(0,+sl.value-4);replayScrub(+sl.value);","const nR=(state.replay||[]).length, stR=nR>1?100/(nR-1):4; sl.value=Math.max(0,+sl.value-stR);replayScrub(+sl.value);")
rep("sl.value=Math.min(100,+sl.value+4);replayScrub(+sl.value);","const nR=(state.replay||[]).length, stR=nR>1?100/(nR-1):4; sl.value=Math.min(100,+sl.value+stR);replayScrub(+sl.value);")
rep("function phys(dt){","function phys(dt){\n  if(state.rpPlay){ state._rpT=(state._rpT||0)+dt; if(state._rpT>0.6){ state._rpT=0; const sl=document.getElementById('rpScrub'); if(sl){ const nR=(state.replay||[]).length, stR=nR>1?100/(nR-1):100; const nv=Math.min(100,+sl.value+stR); sl.value=nv; replayScrub(nv); if(nv>=100){ state.rpPlay=false; const b=document.getElementById('rpPlay'); if(b) b.textContent='PLAY'; } } } } /* r.134: PLAY was inert */")

# ── the board follows a lapse; a sky tap is not a mark; solo refusals name the next press; desk stick off the panel; one revision string (s27 s32 s29) ──
rep("delete state.tgtSlot[k]; }); q.mist=false; }","delete state.tgtSlot[k]; }); q.mist=false; if(typeof list==='function') list(); } /* r.134: the board kept a dead amber row after a lapse */")
rep("  const obj=pickNear(sx,sy) || (lockOn() && {ref:lockOn().ref,kind:lockOn().kind,id:lockOn().id});\n  if(!obj){toast('CLICK A MARK');return;}",
    "  const nearPip=Math.hypot(sx-view.width/2,sy-view.height*0.46)<60; const lk0=nearPip?lockOn():null;\n  const obj=pickNear(sx,sy) || (lk0 && {ref:lk0.ref,kind:lk0.kind,id:lk0.id}); /* r.134: a tap on blank sky no longer marks whatever sits in the cone */\n  if(!obj){toast('TAP THE TARGET, OR PRESS TARGET');return;}")
rep("toast(state.desig&&state.desig.phase==='amber'?'AMBER · SECOND HI APPROVE':'NO RED BOX');","toast(state.desig&&state.desig.phase==='amber'?(state.lobby&&state.lobby.phase==='LIVE'?'AMBER · THE OTHER SEAT MUST APPROVE':'AMBER · PRESS APPROVE FIRST'):'NO RED BOX · MARK A TARGET FIRST');")
rep("#app.desk #stage{margin-right:min(300px,32vw)}","#app.desk #stage{margin-right:min(300px,32vw)}\n#app.desk #joyR,#app.desk.turret #joyR{right:calc(min(300px,32vw) + 8px)} /* r.134: the stick sat on the side panel's corner */")
rep("      <h3>UPDATES r.128</h3>","      <h3>UPDATES</h3>")
rep("log('BOOT','0.125','QA IN TOOL');","log('BOOT',BUILD.revision,'QA IN TOOL');")
rep("rel.textContent='EVIDENCE FIXTURE r0.103 · HI 0/42';","rel.textContent='HISTORICAL FIXTURE (r0.103) · HI 0/42';")
# the score strip is written after the qualification bookkeeping, not before (s34)
rep("  if(isPlate){ if(hit) state.rangeHit=(state.rangeHit|0)+1; else state.rangeMiss=(state.rangeMiss|0)+1; hudScore(); }","  if(isPlate){ if(hit) state.rangeHit=(state.rangeHit|0)+1; else state.rangeMiss=(state.rangeMiss|0)+1; }")
rep("  if(hit) return {dead:true,direct:true,pts:100,result:'HIT'};","  hudScore(); /* r.134: after the qualification bookkeeping, so the strip never lags the toast */\n  if(hit) return {dead:true,direct:true,pts:100,result:'HIT'};")

# ── QA rows ──
rep("    push('HOLD_ROWS_TRAVEL',","""    { const e0=(state.events||[]).length; rangeResetOnRecord('QA'); push('RESET_ON_RECORD', (state.events||[]).length===e0+1&&(state.events||[])[e0].verb==='RESET', 'a range reset is one canonical row (it used to leave the record and the peer untouched)'); }
    { const p0=state.com.path, pe0=state.com.peers, sy0=state.sync, d0=state.desig; state.com.path='DIRECT'; state.com.peers=2; state.sync='MATCH'; rangeReset(); const q=rangeExpose(0,'C-100L'); state.desig=null; state.tgtSlot={}; designate({id:q.id,kind:'pop',ref:q},'peer-Z'); state.desig.how='PEER HI-2'; state.desig.phase='red'; state.hiApproved=true;
      linkLost('QA'); push('LOST_APPROVER_IS_SAID', state.com.path==='DROPPED'&&state.com.peers===1&&!!state.desig&&state.desig.phase==='amber'&&!state.hiApproved, 'a lost link is said on the strip and a peer-approved red box goes back to amber');
      state.com.path=p0; state.com.peers=pe0; state.sync=sy0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    push('VOICE_NEGATION_HOLDS', voiceToggle.toString().indexOf("hold|cease")<voiceToggle.toString().indexOf("approve|approved"), 'a spoken negation is heard before consent');
    push('MAP_KEEPS_THE_STRIP', /hudPhase\\(\\)/.test(phys.toString()), 'the phase strip is written in MAP view too');
    push('ASM_NEVER_MARKS_DEAD', /best\\.up!==false && !\\(best\\.lifePct<=0\\)/.test(asmTick.toString()) && /asmFiredThisTick/.test(asmTick.toString()), 'the AI loop stops for the tick after its own shot and never marks a dead plate');
    push('HOLD_ROWS_TRAVEL',""")


# ── the host keeps both team codes and says so (the unaided join was impossible: the RED digits were shown to nobody) — Christo/Sofia A ──
rep("  set('wrOtherCode','PRIVATE');","  { const other=(state.lobby&&state.lobby.team==='BLU')?'RED':'BLU'; const oc=(state.lobby&&state.lobby.host&&typeof lobbyTeamCode==='function')?lobbyTeamCode(other):''; set('wrOtherCode', oc?(oc+' · GIVE THESE 6 DIGITS TO THE OTHER SEAT'):'PRIVATE'); } /* r.134: the host minted both codes; a joiner never sees the other team's */")
rep("lcSetStatus(state.lobby&&state.lobby.host?'HOST OFFER · SHARE OFFER + TEAM 6':'HOST OFFER · SHARE OFFER + 6 DIGITS');","lcSetStatus(state.lobby&&state.lobby.host?'HOST OFFER · SEND THE OFFER TEXT + THE OTHER TEAM\\'S 6 DIGITS (ON YOUR CARD)':'HOST OFFER · SHARE OFFER + 6 DIGITS');")
# ── the approver's qualification counters and last-shot follow the peer's rows; a peer LAPSE releases the box (Christo/Odin A) ──
rep("if(/^HIT/.test(res)){ state.rangeHit=(state.rangeHit|0)+1; rangeRelease(o); toast('THE OTHER SEAT HIT · '+id); } hudScore(); }",
    "if(state.rangeMode==='qual40'&&(o.lane|0)===(state.lane|0)&&typeof qualRecordShot==='function') qualRecordShot(/^HIT/.test(res),id); /* r.134: the approver's tables move with the shooter's rows */ if(/^HIT/.test(res)){ state.rangeHit=(state.rangeHit|0)+1; state.lastShot={id,slot:(state.desig&&state.desig.slot)||1,life:0,direct:true,dead:true}; rangeRelease(o); toast('THE OTHER SEAT HIT · '+id); } hudScore(); }")
rep("if(String(row.result||'')==='MISS'){ state.rangeMiss=(state.rangeMiss|0)+1; toast('THE OTHER SEAT MISSED · '+id); } hudScore(); } }",
    "if(String(row.result||'')==='MISS'){ if(state.rangeMode==='qual40'&&(o.lane|0)===(state.lane|0)&&typeof qualRecordShot==='function') qualRecordShot(false,id); state.rangeMiss=(state.rangeMiss|0)+1; toast('THE OTHER SEAT MISSED · '+id); } hudScore(); } }")
rep("  if(row.verb==='LAPSE' && id){ const o=findTgt(id); if(o){ o.up=false; o.fall=1; } }\n  if(row.verb==='RESET'","  if(row.verb==='LAPSE' && id){ const o=findTgt(id); if(o){ o.up=false; o.fall=1; if(row.peerId&&row.peerId!==SID) rangeRelease(o); } } /* r.134: a peer's lapsed target takes my box with it */\n  if(row.verb==='RESET'")
# ── the replay bar lives outside #app: toggle on body ──
rep("#app.replay #replayBar{display:flex !important;","body.replay #replayBar{display:flex !important;")
rep("const on=document.getElementById('app').classList.toggle('replay');","const on=document.body.classList.toggle('replay');")


# ── the AI member is an actor on the record (Pangu A / Asar A): its mark and its shot carry ASM@<device>; a human approving an AI mark is HI OVER AI, never held for "two humans" ──
rep("      designate({id:best.id,kind:best.id.indexOf('UAV')===0?'uav':'pop',ref:best},u.label||id);","      designate({id:best.id,kind:best.id.indexOf('UAV')===0?'uav':'pop',ref:best},'ASM@'+SID); /* r.134: one actor id for the AI member, on the record — it used to sign as whichever turret the loop reached first */")
rep("  ev('DESIGNATED',obj.id,'AMBER',{slot:n});toast('AMBER · WAIT APPROVE '+obj.id);","  ev('DESIGNATED',obj.id,'AMBER',{slot:n,by:src||SID});toast('AMBER · WAIT APPROVE '+obj.id); /* r.134: the row names the marker */")
rep("    if(row.peerId&&row.peerId!==SID){ peerDesig(id,row.peerId,row.data&&row.data.slot,null); }","    if(row.peerId&&row.peerId!==SID){ peerDesig(id,(row.data&&row.data.by&&/^ASM@/.test(String(row.data.by)))?row.data.by:row.peerId,row.data&&row.data.slot,null); } /* r.134: an AI mark arrives as the AI's, not the host's */")
rep("  if(state.lobby&&state.lobby.phase==='LIVE'&&!byPeer){","  const aiMark=/^ASM@/.test(String(state.desig.by||'')); /* r.134: a human approving the AI's mark is the first human — never held for a second */\n  if(state.lobby&&state.lobby.phase==='LIVE'&&!byPeer&&!aiMark){")
rep("  state.desig.how=byPeer?'PEER':'HI-2'; /* r.131: PEER only when another seated human marked it */","  state.desig.how=aiMark?'HI OVER AI':byPeer?'PEER':'HI-2'; /* r.131: PEER only when another seated human marked it · r.134: HI OVER AI when the AI marked */")
rep("  if(live&&(!member||by===d.by)){ if(!quiet) decide('HOLD',id,{reason:'TWO_HUMANS',designatedBy:d.by,approvedBy:by}); return {accepted:false,msg:'TWO HUMANS · A SECOND SEATED PERSON MUST APPROVE'}; }","  const aiMark=/^ASM@/.test(String(d.by||''));\n  if(live&&(!member||by===d.by)&&!aiMark){ if(!quiet) decide('HOLD',id,{reason:'TWO_HUMANS',designatedBy:d.by,approvedBy:by}); return {accepted:false,msg:'TWO HUMANS · A SECOND SEATED PERSON MUST APPROVE'}; }")
rep("  d.phase='red'; d.approvedBy=by; d.how='PEER HI-2'; d.sameDevice=false;","  d.phase='red'; d.approvedBy=by; d.how=aiMark?'PEER HI OVER AI':'PEER HI-2'; d.sameDevice=false;")
rep("function netEvent(verb,id,result){\n  const row=ev(verb,id,result);","function netEvent(verb,id,result){\n  const row=ev(verb,id,result,state._shooter?{by:state._shooter}:undefined); /* r.134: a HIT/MISS row names the shooter when it is the AI member */")
rep("      state.desig.asmFired=true; asmFiredThisTick=true; feed((u.team||'BLU')+' AsM FIRE '+best.id); log('ASM',id,best.id); fireN(state.desig.slot||state.slot||1);","      state.desig.asmFired=true; asmFiredThisTick=true; feed((u.team||'BLU')+' AsM FIRE '+best.id); log('ASM',id,best.id); state._shooter='ASM@'+SID; try{ fireN(state.desig.slot||state.slot||1); } finally { state._shooter=null; }")
rep("    push('ASM_NEVER_MARKS_DEAD',","""    { rangeReset(); const q=rangeExpose(0,'C-100R'); const sA=state.asmSpot,sF=state.asmFire,sL=state.hiLock; state.asmSpot=true; state.asmFire=true; state.hiLock=false; state.desig=null; state.tgtSlot={}; for(let i=0;i<5;i++) asmTick(0.1);
      const byAi=!!(state.desig&&/^ASM@/.test(String(state.desig.by||''))); const dRow=(state.events||[]).slice().reverse().find(e=>e.verb==='DESIGNATED'&&e.id===q.id); aimPlate(q,0); approveDesig('HI-2'); const h0=state.rangeHit|0; for(let i=0;i<3;i++) asmTick(0.1);
      const hRow=(state.events||[]).slice().reverse().find(e=>(e.verb==='HIT'||e.verb==='MISS')&&e.id===q.id);
      push('ASM_IS_AN_ACTOR', byAi&&!!dRow&&dRow.data&&/^ASM@/.test(String(dRow.data.by||''))&&!!hRow&&hRow.data&&/^ASM@/.test(String(hRow.data.by||''))&&(state.rangeHit|0)===h0+1&&!state.desig, 'the AI member marks and fires as ASM@<device> on the record: mark row by AI, HIT row by AI, once, box cleared · '+(hRow?hRow.verb+' by '+(hRow.data&&hRow.data.by):'no shot row'));
      state.asmSpot=sA; state.asmFire=sF; state.hiLock=sL; state.desig=null; state.tgtSlot={}; }
    push('ASM_NEVER_MARKS_DEAD',""")


# ── FLEET A FOLD · the authority bit has ONE consumer (Thor A): a scene change, a mode change, a reset or a lost approver releases it with a row ──
rep("function rangeResetOnRecord(why){","function releaseAuthority(why){ /* r.134: the red box was a stored bit that outlived a scene change, a reset and its approver — one consumer, one row */\n  const had=state.desig&&state.desig.id; if(state.desig||state.hiApproved||Object.keys(state.tgtSlot||{}).length){ decide('HOLD',had||'NONE',{reason:'AUTHORITY_RELEASED',why}); }\n  state.desig=null; state.hiApproved=false; state.hiLock=false; state.tgtSlot={}; state.pending=null; const ap=document.getElementById('approve'); if(ap) ap.classList.remove('show'); if(typeof list==='function') list(); return had; }\nfunction rangeResetOnRecord(why){")
rep("  state._resetArm=0; decide('RESET','RANGE',{why,mode:state.rangeMode,lane:state.lane|0,qualR:state.qualR|0,qualH:state.qualH|0});","  state._resetArm=0; releaseAuthority('RESET'); decide('RESET','RANGE',{why,mode:state.rangeMode,lane:state.lane|0,qualR:state.qualR|0,qualH:state.qualH|0});")
rep("const _ch=document.getElementById('chLvl'); if(_ch)_ch.onchange=e=>{state.challenge=+e.target.value;state.phase='static';state.hits=0;","const _ch=document.getElementById('chLvl'); if(_ch)_ch.onchange=e=>{releaseAuthority('SCENE CHANGE'); state.challenge=+e.target.value;state.phase='static';state.hits=0;")
rep("  if(state.desig&&state.desig.phase==='red'&&state.desig.how&&/PEER/.test(String(state.desig.how))){ state.desig.phase='amber'; state.hiApproved=false; decide('HOLD',state.desig.id,{reason:'APPROVER_LOST',why}); }\n  else decide('HOLD','LINK',{reason:'PEER_LOST',why});",
    "  if(state.desig&&state.desig.phase==='red'&&state.desig.how&&/PEER/.test(String(state.desig.how))){ state.desig.phase='amber'; state.hiApproved=false; if(state.tgtSlot){ Object.keys(state.tgtSlot).forEach(k=>{ if(state.tgtSlot[k]&&state.tgtSlot[k].id===state.desig.id) state.tgtSlot[k].phase='amber'; }); } decide('HOLD',state.desig.id,{reason:'APPROVER_LOST',why}); }\n  else decide('HOLD','LINK',{reason:'PEER_LOST',why});")
# CH5: no second, weaker approval primitive — a red box whose approval was spent asks for a fresh APPROVE, never a popup
rep("  if(chNum()===5 && !state.hiApproved){","  if(chNum()===5 && !state.hiApproved){ decide('HOLD',s.id,{reason:'CH5_APPROVE_AGAIN'}); toast('CH5 · APPROVE AGAIN FOR THIS SHOT'); log('CH5','HOLD',s.id); return; } /* r.134: the CH5 popup was a second approval primitive with no author, no two-humans rule and no wire row (Thor A) */\n  if(false){")
# the door tag goes through the record and consumes the box
rep("function commit(d){d.tagged=true;state.pending=null;state.score+=250;document.getElementById('approve').classList.remove('show');log('OK',d.id,'HI');sample({ev:'TAG',id:d.id});toast('TAGGED '+d.id);list();}",
    "function commit(d){d.tagged=true;state.pending=null;state.score+=250;document.getElementById('approve').classList.remove('show');log('OK',d.id,'HI');sample({ev:'TAG',id:d.id});decide('SIM-ACTION',d.id,{tag:true,pts:250}); netEvent('TAG',d.id,'TAGGED'); state.desig=null; state.hiApproved=false; if(state.tgtSlot){ Object.keys(state.tgtSlot).forEach(k=>{ if(state.tgtSlot[k]&&state.tgtSlot[k].id===d.id) delete state.tgtSlot[k]; }); } toast('TAGGED '+d.id);list();} /* r.134: a tag is on the record and consumes the box (it used to fire N times on one approve with no row) */")
# a dead target cannot be marked or approved
rep("  if(ref) ref.mist=true;\n","  if(ref&&(ref.up===false||ref.lifePct<=0)){ toast('THAT TARGET IS DOWN · MARK ANOTHER'); return; } /* r.134: no mark on a dead target */\n  if(ref) ref.mist=true;\n")
rep("  if(!state.desig){toast('NO AMBER');return;}","  if(!state.desig){toast('NO AMBER · MARK A TARGET FIRST');return;}\n  if(state.desig.how!=='PEER'&&state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)){ decide('HOLD',state.desig.id,{reason:'TARGET_DOWN'}); releaseAuthority('TARGET DOWN'); toast('THAT TARGET IS ALREADY DOWN · MARK THE NEXT'); return; } /* r.134: no approval on a dead target — judged on the marker's device; a peer's mark is judged where it was made (the range clock is per device until r.135) */")
# inputs: keys ignore text fields and the intro; the voice grammar drops the lone "f"
rep("window.addEventListener('keydown',e=>{\n  state.keys[e.code]=true;","window.addEventListener('keydown',e=>{\n  { const ae=document.activeElement; if(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return; const it=document.getElementById('intro'); if(it&&it.style.display!=='none'&&getComputedStyle(it).display!=='none') return; } /* r.134: typing a room code behind the intro marked a target and sent it down the wire (Thor A) */\n  state.keys[e.code]=true;")
rep("const f=t.match(/\\b(?:fire|f)\\s*(one|two|three|1|2|3)?\\b/);","const f=t.match(/\\bfire\\s*(one|two|three|1|2|3)?\\b|\\bf\\s*(one|two|three|1|2|3)\\b/); /* r.134: a lone 'f' in ambient speech no longer fires */")
# the wire never runs a row whose author is not the envelope's peer
rep("  const evt=m.event||pay.event||null;","  const evt=m.event||pay.event||null;\n  if(evt&&evt.verb&&(!evt.peerId||(evt.peerId===SID&&!(state.events||[]).some(e=>e&&e.eventId===evt.eventId)))){ decide('REJECT',evt.id||'NONE',{reason:'ROW_AUTHOR_MISMATCH',from:m.peerId||m.sid||''}); return; } /* r.134: an embedded row signed as me (or as nobody) used to take the local branch and turn amber red with no approver (Thor A) */")
# refusals live above the intro; a lapse says so in every mode; the first sentence names the next tap
rep("#toast{position:fixed;left:10px;bottom:92px;color:var(--g);font-size:12px;z-index:6;display:none}","#toast{position:fixed;left:10px;bottom:92px;color:var(--g);font-size:12px;z-index:41;display:none} /* r.134: above the intro (z 40) — every SELECT-screen refusal was drawn underneath it (Athena A) */")
rep("function rangeLapse(q){ /* an exposure ended with the target still standing: in QUAL · 40 that is an unfired MISS round */","function rangeLapse(q){ /* an exposure ended with the target still standing: in QUAL · 40 that is an unfired MISS round */\n  if(state.rangeMode!=='qual40'){ if(typeof ev==='function') ev('LAPSE',q.id,'LAPSED'); toast('LAPSED · '+plateBase(q.id)+' · MARK THE NEXT ONE'); return; } /* r.134: a training lapse is said and is a row (it was a silent counter) */")
rep("toast('AMBER · T'+state.slot+' '+lk.id+' · WAIT APPROVE');","toast('AMBER · T'+state.slot+' '+lk.id+(state.lobby&&state.lobby.phase==='LIVE'?' · WAIT FOR THE OTHER SEAT TO APPROVE':' · NOW PRESS APPROVE'));")
rep("    push('ASM_NEVER_MARKS_DEAD',","""    { rangeReset(); const q=rangeExpose(0,'C-200L'); state.desig=null; state.tgtSlot={}; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const red0=!!(state.desig&&state.desig.phase==='red'); const e0=(state.events||[]).length; releaseAuthority('QA SCENE'); push('AUTHORITY_HAS_ONE_CONSUMER', red0&&!state.desig&&!state.hiApproved&&(state.events||[]).length===e0+1&&(state.events||[])[e0].verb==='HOLD', 'a scene change, reset or lost approver releases the red box with one HOLD row'); }
    { rangeReset(); const q=rangeExpose(0,'C-100L'); q.lifePct=0; state.desig=null; state.tgtSlot={}; designate({id:q.id,kind:'pop',ref:q},'QA'); push('NO_MARK_ON_A_DEAD_TARGET', !state.desig, 'a downed target cannot be marked'); q.lifePct=100; designate({id:q.id,kind:'pop',ref:q},'QA'); q.lifePct=0; approveDesig('HI-2'); push('NO_APPROVE_ON_A_DEAD_TARGET', !state.desig||state.desig.phase!=='red', 'a downed target cannot be approved'); state.desig=null; state.tgtSlot={}; }
    push('TOAST_ABOVE_INTRO', (+getComputedStyle(document.getElementById('toast')).zIndex||0)>(+getComputedStyle(document.getElementById('intro')).zIndex||0), 'a refusal is drawn above the intro');
    push('ASM_NEVER_MARKS_DEAD',""")

c=s.count("revision:'0.133'"); rep("revision:'0.133'","revision:'0.134'",c)
h=s.count("r0.133"); rep("r0.133","r0.134",h)
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

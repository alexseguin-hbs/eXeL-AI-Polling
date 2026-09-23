# r.147 -> r.148 — THE EYE OUTRANKS THE MARK (the 48-agent fleet on r.147, 2026-09-23; ask docs/asks/2026-09-23_target_resets_to_50L_fleet_test.md).
# Twelve lenses converged: r.147's pip rule ran only on an EMPTY board. lockOn kept the marked target (mine, the other seat's, or the AI's)
# anywhere inside a 35° cone BEFORE the pip rule, so once any amber stood — the deck parks the head on a 50 m plate, the first TARGET marks
# it, the AI member marks the nearest plate in metres the moment a box clears — every later TARGET re-marked that plate and swung the head
# back to it: the operator's "target approve and fire keeps resetting to 50 m left target", reproduced verbatim on r.147 (Athena B, Pangu
# A/B, Aset A, Enki A, Christo A/B, Odin A). THE CLASS, folded here as one rule with its members:
#   1 a mark is held only while the bullseye is ON it (a plate's outline + 8 px; 28 px for anything else); otherwise the pip rule runs;
#   2 TARGET / key N / voice on the current mark keeps its phase and its author (no re-DESIGNATED row, red never demoted, a peer's or the
#     AI's mark never re-signed) and the head moves only after a mark was made; marking a different target releases my own unfinished mark
#     with one row;
#   3 T1 · T2 · T3 obey the reach on every craft (the assign and door pools rank by the pip too) and key 2/3 refuse like key 1;
#   4 the AI member spots THROUGH THE BULLSEYE (pipRank from the seated camera) and says so when it has to fall back to metres; it never
#     moves the seated human's head; it waits 1.2 s after a shot so the HIT sentence can be read;
#   5 a FIRE with no box is booked against NONE, never the nearest plate;
#   6 the board sits under the strip in portrait (they overprinted at 390 px);
#   7 the wire: APPROVE's author is the authenticated sender; a peer HIT row downs a plate only with an APPROVE for it on this record;
#   8 the EYE comment says 24 px (measured), not ~20.
# Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.147.html'); DST=os.path.join(DECK,'drone-2525_r.148.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── 1 · a mark is held only while the bullseye is on it ──
rep("""  if(state.desig&&state.desig.ref){
    const o=state.desig.ref;
    if(o.up!==false&&(o.fall||0)<0.25&&!(o.lifePct<=0)){const s=sc(worldOf(o)); if(s.dot>0.82) return {id:o.id,dist:s.dist,kind:state.desig.kind||'pop',ref:o};}
  }""",
"""  if(state.desig&&state.desig.ref){ /* r.148: the marked target keeps LOCK only while the bullseye is ON it — the 35° cone held a mark from the far edge of the picture and TARGET swung the head back to it (the operator's "keeps resetting to 50 m left") */
    const o=state.desig.ref;
    if(o.up!==false&&(o.fall||0)<0.25&&!(o.lifePct<=0)&&pipOn(o,c)){const s=sc(worldOf(o)); return {id:o.id,dist:s.dist,kind:state.desig.kind||'pop',ref:o,px:0};}
  }""")
rep("function lockOn(){\n  const u=units[state.unit],c=camOf(u);",
"""function pipOn(o,c){ /* r.148: is the bullseye ON this target — a plate's projected outline + 8 px, anything else within 28 px of its centre (the r.143 'on it' test, now the one hold rule) */
  const W=view.width,H=view.height,px=W/2,py=H*.46,m=8; c=c||camOf(units[state.unit]);
  if(o&&o.form&&typeof plateRect==='function'){ const r=plateRect(o); return !!r&&Math.abs(px-r.cx)<=r.half+m&&py>=r.top-m&&py<=r.bot+m; }
  const w=worldOf(o); const pr=proj([w.x,w.y,w.z],c,W,H); return !!pr&&pr.x>=0&&pr.x<=W&&pr.y>=0&&pr.y<=H&&Math.hypot(pr.x-px,pr.y-py)<=28; }
function lockOn(){
  const u=units[state.unit],c=camOf(u);""")

# ── 2 · one door for the button, the keys and voice: markLock ──
rep("function targetN(n){\n  const s=slots().find(x=>x.n===n);",
"""function markLock(lk,via){ /* r.148: ONE door for TARGET, key N and voice. On the current mark: keep its phase and its author, say who marked it. On another target: release my own unfinished mark (one row), mark the new one, then look at it. Nothing under the bullseye: the one sentence, no move. */
  if(!lk){ toast(+state.challenge===0?noLockMsg():'NO TARGET UNDER THE BULLSEYE · PUT IT ON ONE'); log('TGT','none',via||'BTN'); return null; }
  if(state.desig&&state.desig.id===lk.id){ const by=String(state.desig.by||''), how=String(state.desig.how||''), red=state.desig.phase==='red';
    if(/^PEER/.test(how)) toast('THE OTHER SEAT MARKED IT · '+(red?'THE OTHER SEAT FIRES':'PRESS APPROVE')); else if(/^ASM@/.test(by)) toast('THE AI MARKED IT · '+(red?'PRESS FIRE':'PRESS APPROVE')); else toast((red?'RED BOX · ':'AMBER · ')+plateWord(lk.id)+(red?' · PRESS FIRE':' · PRESS APPROVE'));
    log('TGT',lk.id,'SAME'); return state.desig; }
  if(state.desig&&state.desig.id!==lk.id&&!/^PEER/.test(String(state.desig.how||''))&&!/^ASM@/.test(String(state.desig.by||''))) releaseAuthority('RE-MARK'); /* my own unfinished mark goes, on the record; a peer's or the AI's mark stays theirs */
  designate({id:lk.id,kind:lk.kind,ref:lk.ref},SID); if(!state.desig||state.desig.id!==lk.id) return null;
  const u=units[state.unit]; if(u&&u.kind==='turret'&&lk.ref) aimUnitAt(u,lk.ref,-40,20); return state.desig; }
function targetN(n){
  const s=slots().find(x=>x.n===n);""")
rep("  if(!s||(n===1&&s.px!=null&&s.px>LOCK_REACH_PX)){toast(+state.challenge===0?noLockMsg():('NO T'+n));log('TGT','none',n);return null;} /* r.133: key 1 says what the TARGET button and voice say · r.147: and marks what the button marks — T1 within the bullseye's reach, or nothing */\n  state.slot=n;\n  const u=units[state.unit];\n  aimUnitAt(u,s.ref,-40,20);\n  mistOn(s.ref,s.id);designate({id:s.id,kind:s.kind,ref:s.ref},SID); log('TGT',s.id,'T'+n);sample({ev:'TGT',n});list();return s;",
"""  if(!s||s.px==null||s.px>LOCK_REACH_PX){toast(+state.challenge===0?noLockMsg():('NO T'+n));log('TGT','none',n);return null;} /* r.133: key 1 says what the TARGET button and voice say · r.148: every key obeys the reach — key 2 marked a plate 141 px off the pip and swung the head */
  state.slot=n;
  const d=markLock({id:s.id,kind:s.kind,ref:s.ref,px:s.px},'T'+n); if(!d) return null; if(d.id===s.id&&d.by===SID) mistOn(s.ref,s.id); log('TGT',s.id,'T'+n);sample({ev:'TGT',n});list();return s;""")
rep("if(_ft)_ft.onclick=()=>{const lk=lockOn(); state.slot=state.slot||1; if(!lk){toast(noLockMsg());return;} designate({id:lk.id,kind:lk.kind,ref:lk.ref},SID); const u=units[state.unit]; if(u&&u.kind==='turret'&&lk.ref) aimUnitAt(u,lk.ref,-40,20);};",
    "if(_ft)_ft.onclick=()=>{ state.slot=state.slot||1; markLock(lockOn(),'BTN'); }; /* r.148: the button goes through the one door */")
rep("    if(m){const map={one:1,two:2,three:3,'1':1,'2':2,'3':3};state.slot=map[m[1]]; const lk=lockOn(); if(lk){designate({id:lk.id,kind:lk.kind,ref:lk.ref},SID);toast('VOICE T'+state.slot+' '+lk.id);} else targetN(state.slot); return;}\n    if(/\\b(?:target|lock)\\b/.test(t)){const lk=lockOn(); if(!lk){toast(noLockMsg());return;} state.slot=state.slot||1; designate({id:lk.id,kind:lk.kind,ref:lk.ref},SID); toast('VOICE TARGET '+lk.id); return;}",
    "    if(m){const map={one:1,two:2,three:3,'1':1,'2':2,'3':3}; targetN(map[m[1]]); return;} /* r.148: voice 'target N' is key N */\n    if(/\\b(?:target|lock)\\b/.test(t)){ state.slot=state.slot||1; markLock(lockOn(),'VOICE'); return;}")

# ── 3 · T1 · T2 · T3 by the pip on every craft ──
rep("""  if(state.assign&&state.assign[1]&&state.mode!=='turret'){
    const a=state.assign[1];
    const rest=doors.filter(d=>d!==a.ref).slice(0,2).map((d,i)=>({n:i+2,ref:d,kind:'door',id:d.id}));
    return [{n:1,ref:a.ref,kind:a.kind,id:a.id}].concat(rest);
  }""",
"""  const uS=units[state.unit]; const cS=uS?camOf(uS):null, WS=view.width, HS=view.height; const pxOf=(o)=>{ if(!cS) return null; const w=worldOf(o); const p=proj([w.x,w.y,w.z],cS,WS,HS); return (p&&p.x>=0&&p.x<=WS&&p.y>=0&&p.y<=HS)?Math.hypot(p.x-WS/2,p.y-HS*.46):null; }; /* r.148: every pool carries the pip distance; off the picture is null and never marks */
  if(state.assign&&state.assign[1]&&state.mode!=='turret'){
    const a=state.assign[1];
    const rest=pipRank(doors.filter(d=>d!==a.ref).map(d=>({id:d.id,kind:'door',ref:d,world:d,dist:cS?Math.hypot(d.x-cS.x,d.z-cS.z):0})),cS,WS,HS).slice(0,2).map((k,i)=>({n:i+2,ref:k.ref,kind:'door',id:k.id,px:k.px}));
    return [{n:1,ref:a.ref,kind:a.kind,id:a.id,px:pxOf(a.ref)}].concat(rest);
  }""")
rep("  return doors.filter(d=>d.slot).map(d=>({n:d.slot,ref:d,kind:'door',id:d.id}));\n}",
    "  return doors.filter(d=>d.slot).map(d=>({n:d.slot,ref:d,kind:'door',id:d.id,px:pxOf(d)})).filter(x=>x.px!=null); /* r.148: a numbered door behind the camera is not a slot */\n}")

# ── 4 · the AI member spots through the bullseye, never moves the seat, waits for the HIT to be read ──
rep("  if(!live.length) return;\n  let asmFiredThisTick=false;",
    "  if(!live.length) return;\n  if(state.lastShot&&state.lastShot.t!=null&&(state.clock-state.lastShot.t)<1.2&&!state.desig) return; /* r.148: the HIT sentence is read before the AI marks again (it re-marked in the same frame) */\n  let asmFiredThisTick=false;")
rep("    let best=live[0],bd=1e9;\n    live.forEach(o=>{const ow=worldOf(o); const d=Math.hypot(ow.x-pit.x,ow.z-pit.z); if(d<bd){bd=d;best=o;}});",
"""    let best=null,bd=1e9,why='METRES'; { const seat=units[state.unit]; if(seat&&typeof pipRank==='function'){ const sc2=camOf(seat); const r=pipRank(live.map(o=>{const w=worldOf(o); return {id:o.id,kind:'pop',ref:o,world:w,dist:Math.hypot(w.x-pit.x,w.z-pit.z)};}),sc2,view.width,view.height)[0]; if(r&&r.px<=LOCK_REACH_PX){ best=r.ref; bd=r.dist; why='PIP'; } } } /* r.148: the AI spots THROUGH THE BULLSEYE first — it marked the nearest plate in metres (the 50 L) while the human looked at the 150 R */
    if(!best){ best=live[0]; live.forEach(o=>{const ow=worldOf(o); const d=Math.hypot(ow.x-pit.x,ow.z-pit.z); if(d<bd){bd=d;best=o;}}); }
    state._asmWhy=why;""")
rep("      { const su=units[state.unit]; if(su&&su.kind==='turret'&&state.desig&&state.desig.id===best.id) aimUnitAt(su,best,-40,20); } /* r.133: the seat looks at what the AI marked, as it does for a peer's mark */",
    "      /* r.148: the AI paints its box; it never moves the seated human's head (the r.133 aim swung the seat 7.9° onto the AI's plate, unsaid) */")
rep("toast('AMBER · '+plateWord(obj.id)+(seatWord(src)?' · MARKED BY '+seatWord(src):'')+(state.lobby&&state.lobby.phase==='LIVE'?' · WAIT FOR THE OTHER SEAT TO APPROVE':' · NOW PRESS APPROVE'));",
    "toast('AMBER · '+plateWord(obj.id)+(seatWord(src)?' · MARKED BY '+seatWord(src):'')+(/^ASM@/.test(String(src||''))&&state._asmWhy==='METRES'?' · NOT UNDER YOUR BULLSEYE':'')+(state.lobby&&state.lobby.phase==='LIVE'?' · WAIT FOR THE OTHER SEAT TO APPROVE':' · NOW PRESS APPROVE')); /* r.148: the AI says when its mark is not the one under the pip */")
rep("    state.lastShot={id:o.id||'BULL-1',slot:state.slot||1,life:o.lifePct||0,direct:!!hit.direct,band,dead:!!hit.dead};",
    "    state.lastShot={id:o.id||'BULL-1',slot:state.slot||1,life:o.lifePct||0,direct:!!hit.direct,band,dead:!!hit.dead,t:state.clock};")
rep("    state.lastShot={id:s.id,slot:n||state.slot||1,life:s.ref.lifePct||0,direct:!!hit.direct,dead:!!hit.dead};",
    "    state.lastShot={id:s.id,slot:n||state.slot||1,life:s.ref.lifePct||0,direct:!!hit.direct,dead:!!hit.dead,t:state.clock};")

rep("function rangeReset(){ magLoad('RESET');","function rangeReset(){ state.lastShot=null; magLoad('RESET'); /* r.148: a reset forgets the last shot, so the AI's 1.2 s courtesy never outlives the table */")

# ── 5 · a FIRE with no box is booked against NONE ──
rep("  const s=(state.desig&&{n:n||state.slot||1,ref:state.desig.ref,kind:state.desig.kind,id:state.desig.id})||(n&&slots().find(x=>x.n===n));",
    "  const s=(state.desig&&{n:n||state.slot||1,ref:state.desig.ref,kind:state.desig.kind,id:state.desig.id})||null; /* r.148: with no mark the refusal names NONE — it named the nearest plate on the picture, on both phones, hashed */")

# ── 6 · the board under the strip in portrait ──
rep("#board{position:absolute;left:8px;top:44px;z-index:2;",
    "#board{position:absolute;left:8px;top:74px;z-index:2; /* r.148: under the strip (top:42px, two lines) — they overprinted at 390 px */")

# ── 7 · the wire ──
rep("    const by=m.by||pay.by||m.peerId||m.sid;",
    "    const by=m.peerId||m.sid||m.by||pay.by; /* r.148: the approver is the authenticated sender, never a claimed field — a joiner signed the host's approval (Thor B) */")
rep("  if(row.verb==='HIT' && id){\n    const o=findTgt(id); if(o){",
    "  if(row.verb==='HIT' && id){\n    const o=findTgt(id); if(o&&row.peerId&&row.peerId!==SID&&!(state.events||[]).some(e=>e&&e.verb==='APPROVE'&&e.id===id)&&!(state.desig&&state.desig.id===id&&state.desig.phase==='red')){ log('REJECT',id,'HIT_WITHOUT_RED_BOX'); toast('THE OTHER SEAT REPORTED A HIT ON A TARGET NOBODY APPROVED · IGNORED'); return; } /* r.148: a peer's HIT row downs a plate only with an APPROVE for it on this record (a replay-log refusal, not a hashed row, so an honest peer never forks the hash) */\n    if(o){")

# ── 8 · the EYE comment ──
rep("so a 50 m F is ~20 px wide at 1× on any phone","so a 50 m F is 24 px wide at 1× on any phone (measured, r.147 fleet)")

# ── QA rows ──
rep("    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',",
    """    { state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.zoom=1; state.asmSpot=false; const q1=platesHere().find(p=>p.base==='C-100C'), q2=platesHere().find(p=>p.base==='C-150R'); aimPlate(q1,0); const d1=markLock(lockOn(),'QA'); aimPlate(q2,20); const pan0=u0.pan,tilt0=u0.tilt; const e0=(state.events||[]).length; const d2=markLock(lockOn(),'QA'); const moved=Math.hypot(u0.pan-pan0,u0.tilt-tilt0); const rel=(state.events||[]).slice(e0).some(e=>e&&e.verb==='HOLD'&&e.data&&e.data.why==='RE-MARK'); const oldGone=!Object.keys(state.tgtSlot||{}).some(k=>state.tgtSlot[k]&&state.tgtSlot[k].id===q1.id);
      push('TARGET_FOLLOWS_THE_EYE', !!d1&&d1.id===q1.id&&!!d2&&d2.id===q2.id&&moved<1.5&&rel&&oldGone, 'the 100 C marked; bullseye moved beside the 150 R; TARGET marks '+(d2?d2.id:'none')+' and the head moves '+moved.toFixed(2)+'° (not back to the old mark); the unfinished 100 C released on the record: '+rel);
      aimPlate(q2,0); approveDesig('HI-2'); const e1=(state.events||[]).length; const d3=markLock(lockOn(),'QA'); push('TARGET_ON_OWN_MARK_KEEPS_PHASE', !!d3&&d3.id===q2.id&&state.desig.phase==='red'&&(state.events||[]).length===e1, 'TARGET on my own red box keeps it red and writes no row (it demoted red to amber)'); state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    { rangeReset(); state.desig=null; state.tgtSlot={}; const q=platesHere().find(p=>p.base==='C-150R'); aimPlate(q,0); u0.tilt+=Math.atan2(200,focalPx())*180/Math.PI; const t2=targetN(2), t3=targetN(3); push('KEYS_2_3_OBEY_THE_REACH', t2===null&&t3===null&&!state.desig, 'bullseye in the sky: key 2 and key 3 refuse like key 1 (key 2 had marked a plate 141 px off and swung the head)'); }
    { rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-150R'); aimPlate(q,20); const pan0=u0.pan,tilt0=u0.tilt; const sA=state.asmSpot,sF=state.asmFire; state.asmSpot=true; state.asmFire=false; state.lastShot=null; for(let i=0;i<10;i++) asmTick(0.1); const moved=Math.hypot(u0.pan-pan0,u0.tilt-tilt0); const by=String(state.desig&&state.desig.by||'');
      push('ASM_SPOTS_THE_PIP_AND_NEVER_MOVES_IT', !!state.desig&&state.desig.id===q.id&&/^ASM@/.test(by)&&moved<1e-6, 'AsM SPOT with the bullseye beside the 150 R: the AI marks '+(state.desig?state.desig.id:'none')+' (not the 50 L in metres) and the seat\\'s head moves '+moved.toFixed(3)+'°');
      state.asmSpot=false; const q50=platesHere().find(p=>p.base==='C-50L'); state.desig=null; state.tgtSlot={}; designate({id:q50.id,kind:'pop',ref:q50},'ASM@QA'); aimPlate(q,20); const pB=u0.pan; const d=markLock(lockOn(),'QA'); const mv=Math.abs(u0.pan-pB);
      push('TARGET_OVER_AI_AMBER_MARKS_THE_PIP', !!d&&d.id===q.id&&d.by===SID&&mv<1.5&&!!(state.tgtSlot&&Object.keys(state.tgtSlot).some(k=>state.tgtSlot[k]&&state.tgtSlot[k].id===q50.id)), 'the AI\\'s amber on the 50 L stands; bullseye beside the 150 R; TARGET marks '+(d?d.id:'none')+' by me, head '+mv.toFixed(2)+'°; the AI\\'s box keeps its author');
      state.asmSpot=sA; state.asmFire=sF; state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    { rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; u0.tilt+=Math.atan2(300,focalPx())*180/Math.PI; const dN=(state.decisions||[]).length; fireN(1); const last=(state.decisions||[]).slice(dN).pop(); push('REJECT_NEVER_NAMES_AN_UNMARKED_TARGET', !!last&&last.reason==='NO_RED_BOX'&&last.id==='NONE', 'FIRE with nothing marked is refused against NONE ('+(last?last.id+' '+last.reason:'no row')+'), not the nearest plate'); }
    { rangeReset(); state.desig=null; state.tgtSlot={}; const q=platesHere().find(p=>p.base==='C-150R'); aimPlate(q,0); markLock(lockOn(),'QA'); list(); const b=document.getElementById('board'), h=document.getElementById('playHud'); const rb=b&&b.getBoundingClientRect(), rh=h&&h.getBoundingClientRect(); const disjoint=!rb||!rh||rb.height===0||rh.height===0||rb.top>=rh.bottom||rh.top>=rb.bottom||rb.left>=rh.right||rh.left>=rb.right;
      push('BOARD_NEVER_OVER_THE_STRIP', disjoint, 'with a mark on the board, #board and the strip do not overlap ('+(rb?Math.round(rb.top)+'-'+Math.round(rb.bottom):'-')+' vs '+(rh?Math.round(rh.top)+'-'+Math.round(rh.bottom):'-')+')'); state.desig=null; state.tgtSlot={}; }
    { rangeReset(); state.desig=null; state.tgtSlot={}; const q=platesHere().find(p=>p.base==='C-200L'); const h0=state.rangeHit|0; applyWorld({verb:'HIT',id:q.id,result:'HIT CIRCLE',peerId:'QA-PEER',data:{}}); push('PEER_HIT_NEEDS_RED_ON_RECORD', q.up===true&&q.lifePct===100&&(state.rangeHit|0)===h0, 'a peer HIT row for a plate nobody approved leaves it standing ('+q.id+' up='+q.up+' life='+q.lifePct+')'); }
    { rangeReset(); state.desig=null; state.tgtSlot={}; const q=platesHere().find(p=>p.base==='C-150R'); aimPlate(q,0); const sA=state.asmSpot; state.asmSpot=true; state.lastShot={id:'X',t:state.clock}; asmTick(0.1); const early=state.desig; state.lastShot={id:'X',t:state.clock-2}; asmTick(0.1); const late=state.desig; push('AI_WAITS_FOR_THE_HIT_TO_BE_READ', !early&&!!late&&late.id===q.id, 'within 1.2 s of a shot the AI marks nothing ('+(early?early.id:'none')+'); after it, the plate under the bullseye ('+(late?late.id:'none')+')'); state.asmSpot=sA; state.desig=null; state.tgtSlot={}; state.lastShot=null; }
    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',""")

c=s.count("revision:'0.147'"); rep("revision:'0.147'","revision:'0.148'",c)
h=s.count("r0.147"); rep("r0.147","r0.148",h)
for dead in ["if(s.dot>0.82) return {id:o.id","(n===1&&s.px!=null&&s.px>LOCK_REACH_PX)","aimUnitAt(su,best,-40,20)","const by=m.by||pay.by||m.peerId||m.sid;","~20 px wide"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

# r.204 -> r.205 — THE FALL ENDS WITH THE WINDOW (the operator's phantom box: his picture b1314c11 on r0.198, QUAL 40 · PHASE 3 · ENG 13/18 ·
#  1 UP — a flat gold box with the silhouette's marks squashed into it, beside a bare post; the twelve Masters' QUAL-40 AAR, 2026-10-12,
#  docs/assessments/2026-10-12_drone2525_qual40_ux_pass_12asm.md, B1, all twelve: "one clock must finish every fall it starts").
#  CAUSE (read on the r.204 bytes, unchanged since r.198): a hit starts the plate's fall (applyHit; the other seat's HIT row in applyWorld) and
#  leaves it standing until the fall lands (0.4 s at 2.4/s); in QUAL 40 only the open window ticks a fall (rangeTick, R.phase==='up'). The
#  window's close downed only a plate that still had life (lifePct>0) and then emptied the exposure (R.cur=[]), so a plate hit in the last
#  0.4 s was left standing, dead and half-fallen; qualDropStrays — the sweep that holds "a plate stands only while its own exposure is up" —
#  spared exactly that plate by name, every tick, until the cold range. Asar's geometry places his box at the 300 M, frozen at the close of
#  ENG 10 (the last and farthest shot before the 10 s rest).
#  INVARIANT (r.205, this phone, solo and room): when an exposure window closes, every plate of that engagement is down — hit or not; nothing
#  stands or hangs half-fallen through the gap, the rest or the next engagement, whether the round came from this seat's FIRE or from the
#  other seat's HIT row landing while the exposure is open; only a plate that STOOD unengaged at the close is booked NOT ENGAGED — a hit at
#  the buzzer is a hit. (Booking across the two phones' window boundary — a row landing after this phone's close, in its gap, or in the
#  next exposure of the same silhouette — is a separate member, not changed here.)
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
BASE_REV='204'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.205.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.204')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
def cut(a,b):
    if s.count(a)!=1 or s.count(b)!=1: raise SystemExit(f'REFUSE: markers not unique: {a[:60]!r} / {b[:60]!r}')
    i=s.index(a); j=s.index(b,i); return s[i:j]

# 0 · the deck declares itself
rep("revision:'0.204'","revision:'0.205'",1)
rep("r0.204","r0.205",1)

# 1 · the window's close downs EVERY plate of its engagement, hit or not; the lapse stays for a plate that stood unengaged
old=cut("  if(R.t>=(R.eng?R.eng.sec:5)){ /* the window ends:","    const nxt=engagementAt(mine,R.k+1);")
CLOSE_OLD="cur.forEach(q=>{ if(q.up&&q.lifePct>0){ q.up=false; q.fall=1; if(mine===(state.lane||0)&&rangeArmed()&&lapseIsMine()&&!q._eng){ rangeLapse(q,false); state.rangeLapsed=(state.rangeLapsed|0)+1; hudScore(); } rangeRelease(q); } });"
if old.count(CLOSE_OLD)!=1: raise SystemExit('REFUSE: the window-end block is not the r.198 one')
rep(CLOSE_OLD,
    "cur.forEach(q=>{ if(q.up){ const stood=q.lifePct>0; q.up=false; q.fall=1; if(stood&&mine===(state.lane||0)&&rangeArmed()&&lapseIsMine()&&!q._eng){ rangeLapse(q,false); state.rangeLapsed=(state.rangeLapsed|0)+1; hudScore(); } rangeRelease(q); } }); /* r.205: the close downs EVERY plate of the engagement, hit or not — a plate hit in the last 0.4 s of its window was left standing half-fallen for the rest of the table (the operator's phantom box); only a plate that STOOD unengaged is a lapse, so a hit at the buzzer is a hit */",1)

# 2 · the stray sweep spares nothing outside the exposure (the class: whatever door leaves a dead plate standing outside its window)
rep("if(keep&&keep.has(q.id)) return; if(!state.qualDone&&q.lifePct<=0&&(q.fall||0)>0&&(q.fall||0)<1) return; q.up=false;",
    "if(keep&&keep.has(q.id)) return; q.up=false;",1)
rep("function qualDropStrays(){ /* r.198 (r.181 carried): a plate stands only while its own exposure is up; anything else is a phantom and goes down, released */",
    "function qualDropStrays(){ /* r.198 (r.181 carried): a plate stands only while its own exposure is up; anything else is a phantom and goes down, released */ /* r.205 INVARIANT: when an exposure window closes, every plate of that engagement is down — nothing stands or hangs half-fallen between engagements; no exemption for a plate mid-fall: nothing ticks its fall once its window is gone, so the exemption WAS the operator's phantom box */",1)

# 3 · the gate — red on r.204 (every leg hangs), red with step 1 alone (the sweep), red with step 2 alone (down at the close), green with both
ROW="""    { /* r.205 · FALL_ENDS_WITH_THE_WINDOW (the operator's phantom box — his r0.198 picture, a flat gold box beside a bare post at ENG 13/18 · 1 UP: a plate hit in the last 0.4 s of its window, frozen half-fallen until the cold range; the twelve Masters' QUAL-40 AAR, 2026-10-12, B1) — INVARIANT: when an exposure window closes, every plate of that engagement is down on this phone, hit or not; nothing stands or hangs half-fallen through the gap or the rest; a hit at the buzzer is booked a hit, never NOT ENGAGED. Four shots: this seat's FIRE and the other seat's HIT row 0.2 s before a 5 s window closes, a FIRE 0.05 s before it, and the 300 M 0.2 s before ENG 5's 16 s window closes into the 10 s rest (his plate); after each close a dead plate set standing outside the exposure is down after one tick (the sweep spares nothing) */
      const m0=state.rangeMode, d0=state.desig, s0=state.tgtSlot, a0=state.hiApproved, l0=state.lastShot, b0=state.lastBand, n0=state.lane, S0=state._qaSilent, q0=state.qaArmed; let ok=true, note='';
      try{ state._qaSilent=true; state.qaArmed=true; state.lane=0; const fire=()=>fireN(1);
        [['solo',null,0.2,fire],['room',null,0.2,q=>applyWorld({verb:'HIT',id:q.id,result:'HIT CIRCLE',peerId:'QA-PEER',seq:0,data:{}})],['solo at the buzzer',null,0.05,fire],['his 300 M into the rest',4,0.2,fire]].forEach(([who,k,left,shoot])=>{
          state.rangeMode='qual40'; rangeReset(); qualResetTower(); const R=rangeRun(0); let q=null;
          if(k==null) q=rangeExpose(0,'C-150L'); else { R.k=k; R.phase='gap'; R.t=ENG_GAP_S; rangeTick(0.05); q=plateOf(0,'C-300'); } /* rangeExpose: a one-target window of EXPOSURE_BY_COUNT[1] s · k=4: the program's own ENG 5, four targets for 16 s, the last of phase 1 */
          const sec=R.eng.sec, nUp=R.cur.length, inEng=!!q&&R.cur.includes(q.id);
          aimPlate(q,0); state.tgtSlot={}; state.desig=null; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2');
          for(let i=0,m=Math.round((sec-left)*20);i<m;i++) rangeTick(0.05); const tShot=R.t, h0=state.rangeHit|0; shoot(q);
          const hit=inEng&&(state.rangeHit|0)===h0+1&&q.lifePct<=0&&q.up===true&&(q.fall||0)>0&&(q.fall||0)<1;
          let closed=false, hung=true; for(let i=0;i<10&&!closed;i++){ rangeTick(0.05); if(R.phase!=='up'){ closed=true; hung=!!q.up||(q.fall||0)<1; } }
          const rest=R.phase==='phasegap', downAtClose=closed&&!hung&&platesHere().every(p=>!p.up);
          const bH=state.qualH|0, bR=state.qualR|0, bX=state.qualExpired|0, booked=bH===1&&bR===nUp&&bX===nUp-1&&(state.rangeLapsed|0)===nUp-1;
          const nb=(engagementAt(0,R.k)||{bases:[]}).bases, st=platesHere().find(p=>p!==q&&!nb.includes(p.base)); st.up=true; st.lifePct=0; st.life=0; st.fall=0.5; rangeTick(0.05); const swept=!st.up&&(st.fall||0)>=1;
          let next=false, clear=true; for(let i=0,m=((rest?PHASE_GAP_S:ENG_GAP_S)+0.5)*20;i<m&&!next;i++){ rangeTick(0.05); if(R.phase==='up'&&R.eng&&R.eng.n>0) next=true; else if(platesHere().some(p=>p.up)) clear=false; } /* the gap and the rest: the strip says 0 UP, so the painter must draw nothing on my lane, every tick */
          let drawn=-1, upN=-1; if(next){ let c=0; drawPlates((arr,col)=>{ if(col===T13.SI) c++; }); drawn=c; upN=R.cur.filter(id=>{ const p=PLATES.find(x=>x.id===id); return p&&p.up&&p.lifePct>0; }).length; }
          const noDeadStanding=!platesHere().some(p=>p.up&&p.lifePct<=0);
          ok=ok&&hit&&downAtClose&&booked&&swept&&clear&&next&&upN>0&&drawn===upN&&noDeadStanding&&rest===(k!=null);
          note+=(note?' · ':'')+who+': hit at '+tShot.toFixed(2)+' of '+sec+' s '+hit+' · down at the close '+downAtClose+' · booked '+bH+' hit of '+bR+', not engaged '+bX+' '+booked+' · a dead plate outside the exposure swept '+swept+' · the lane empty through the '+(rest?'rest':'gap')+' '+clear+' · next exposure drawn '+drawn+' = '+upN+' UP · none standing dead '+noDeadStanding; }); }
      catch(e){ ok=false; note='threw '+String(e).slice(0,100); }
      finally{ state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.rangeMode=m0; state.lane=n0; rangeReset(); qualResetTower(); state.desig=d0; state.tgtSlot=s0; state.hiApproved=a0; state.lastShot=l0; state.lastBand=b0; state._qaSilent=S0; state.qaArmed=q0; }
      push('FALL_ENDS_WITH_THE_WINDOW', ok, note); }
"""
rep("    { /* r.157 · QUAL_DONE_SAYS_RESTART", ROW+"    { /* r.157 · QUAL_DONE_SAYS_RESTART")


# 5 · ONE PAINTER FOR A TARGET'S COLOUR (operator 2026-10-12 ~21:05: "buttoms and colors around boxing amber vs red
#     should match"; the twelve Masters G1/G3). The mist flag beat the slot's phase, so a TARGETED plate — amber box,
#     amber caption — painted its silhouette in LOCK red, and a plate whose mark had ended could keep the red.
rep("(mine?own:segs)(silMesh(q), q.mist?T13.LOCK:phaseCol(q,(sheet&&!q.up)?T13.STROKE:mine?T13.SI:T13.STROKE)); /* r.196: amber marked, red approved; a mist stays red */",
    "(mine?own:segs)(silMesh(q), phaseCol(q, q.mist?T13.LOCK:(sheet&&!q.up)?T13.STROKE:mine?T13.SI:T13.STROKE)); /* r.205 INVARIANT (operator 2026-10-12 ~21:05, \"buttoms and colors around boxing amber vs red should match\"): ONE PAINTER - a target's colour is its slot's phase, amber marked and red approved, before anything else; the mist colours only a target that carries no phase. r.196 had the mist first, so every TARGETED plate wore the approved red while its box was amber. */",1)

# 6 · THE LIT BUTTON WEARS ITS TARGET'S COLOUR (DD-15, the same sentence). FIRE already wore LOCK red; APPROVE wore the
#     cue green, so an amber box lit a green APPROVE.
rep('<b id="fAppr">APPROVE</b>','<b id="fAppr" class="appr">APPROVE</b>',1)
rep("#face b.fire{color:var(--l)} /* r.157: FIRE's red border is its lit state, at red only */",
    "#face b.appr{color:var(--g)} /* r.205 (DD-15, operator ~21:05): APPROVE wears the AMBER of the box it acts on, as FIRE wears the red of its own; TARGET keeps the cue colour */\n#face b.fire{color:var(--l)} /* r.157: FIRE's red border is its lit state, at red only */",1)

# 7 · NO WORDS ON THE STAGE (operator 2026-10-12 ~20:44: "remove all text from middle; targets only"). The per-plate
#     caption is retired with its whole placement machinery (r.138 sides and stacking, r.204 ceiling, floor, 40 px
#     tether). His lane signs stay (his 21:20 answer: "Signs stay") and keep the one keep-out list.
CAPS = cut("function captionCeiling(H,x0,x1){","/* r.145 LANE MARKERS (operator 2026-09-23, the range photograph)")
if "function plateCaptionRects(hc,W,H){" not in CAPS: raise SystemExit('REFUSE: the caption block is not the r.204 one')
rep(CAPS, "function plateCaptionRects(){ return []; } /* r.205 (DD-14, operator 2026-10-12 ~20:44: \"remove all text from middle; targets only\"): THE STAGE CARRIES TARGETS ONLY. No per-plate caption is measured, placed or drawn, so none can cross a box, a control, the bullseye or another caption. His lane signs stay (his 21:20 answer, \"Signs stay\") and boardLabels keeps the one keep-out list for them. captionCeiling, captionFloor and the r.138/r.204 placement are retired with the captions. */\n", 1)
rep("{ const rects=plateCaptionRects(hc,W,H); hc.font='11px ui-monospace,monospace'; rects.forEach(c=>{ hc.textAlign=c.align; hc.fillStyle=c.ph==='RED'?T13.LOCK:c.ph==='AMBER'?T13.GIMBAL:T13.SI; hc.fillText(c.cap,c.cx,c.cy); }); hc.textAlign='left'; hc.font='12px ui-monospace,monospace'; } }",
    "}", 1)
rep("const taken=plateCaptionRects(hc,W,H).map(c=>({x0:c.x0,x1:c.x1,y0:c.y0,y1:c.y1})); const out=[];",
    "const taken=[]; const out=[]; /* r.205 (DD-14): no caption is left to dodge; the signs keep clear of the controls, the bullseye and each other */",1)

# 8 · THE BOOT SELF-CHECK NEVER TAKES A RANGE A PLAYER IS USING (H1, measured 2026-10-13 on the LIVE r.204: tap TARGET
#     inside the first ~2 s and the mark is gone 150 ms later; the deferred row seized the range, ran its test on
#     lane 01 and handed the marks, the approval and the magazine back EMPTY. Stack: the TARGET button -> the row at
#     play.html:4951 -> designate -> tgtSlot REPLACED.)
rep("const sv={lane:state.lane,mode:state.rangeMode,zoom:state.zoom,view:state.viewMode,desig:state.desig,slots:state.tgtSlot,hi:state.hiApproved,armed:state.qaArmed,silent:state._qaSilent,pan:units[state.unit].pan,tilt:units[state.unit].tilt};",
    "const sv={lane:state.lane,mode:state.rangeMode,zoom:state.zoom,view:state.viewMode,desig:state.desig,slots:state.tgtSlot,hi:state.hiApproved,armed:state.qaArmed,silent:state._qaSilent,pan:units[state.unit].pan,tilt:units[state.unit].tilt,mag:state.mag&&{n:state.mag.n,rounds:state.mag.rounds},plates:(typeof PLATES!=='undefined'?PLATES:[]).map(p=>({p,up:p.up,lifePct:p.lifePct,life:p.life,fall:p.fall,holes:p.holes,_hit:p._hit,_down:p._down,_dead:p._dead,_eng:p._eng,_ret:p._ret,mist:p.mist}))}; /* r.205 INVARIANT (H1): the boot self-check BORROWS the range and gives it back exactly as it found it - the player's marks, his approval, his magazine and every plate of every lane. It used to hand them back empty, so a TARGET tapped in the first seconds vanished 150 ms later and the first magazine became 30. */",1)
rep("state.desig=null; state.tgtSlot={}; state.hiApproved=false; rangeReset(); state.lane=sv.lane; state.rangeMode=sv.mode; state.zoom=sv.zoom; state.viewMode=sv.view; state.qaArmed=sv.armed; state._qaSilent=sv.silent; units[state.unit].pan=sv.pan; units[state.unit].tilt=sv.tilt; if(typeof list==='function') list(); }",
    "state.lane=sv.lane; state.rangeMode=sv.mode; state.zoom=sv.zoom; state.viewMode=sv.view; sv.plates.forEach(r=>{ r.p.up=r.up; r.p.lifePct=r.lifePct; r.p.life=r.life; r.p.fall=r.fall; r.p.holes=r.holes; r.p._hit=r._hit; r.p._down=r._down; r.p._dead=r._dead; r.p._eng=r._eng; r.p._ret=r._ret; r.p.mist=r.mist; }); state.desig=sv.desig; state.tgtSlot=sv.slots; state.hiApproved=sv.hi; if(sv.mag&&state.mag){ state.mag.n=sv.mag.n; state.mag.rounds=sv.mag.rounds; } state.qaArmed=sv.armed; state._qaSilent=sv.silent; units[state.unit].pan=sv.pan; units[state.unit].tilt=sv.tilt; if(typeof list==='function') list(); if(typeof hudMag==='function') hudMag(); if(typeof paintCues==='function') paintCues(); } /* r.205 (H1): everything borrowed is given back */",1)

# 7b · the rows that measured the captions go with them
LBL = cut("    { /* r.157 · LABELS_ONLY_WHILE_MARKED", "    { const z0=state.zoom, u0k=state.unit; state.rangeMode='qual40';")
if "push('LABELS_ONLY_WHILE_MARKED'" not in LBL: raise SystemExit('REFUSE: the labels row is not the r.204 one')
rep(LBL, "", 1)   # retired with the captions: NO_WORDS_ON_THE_STAGE takes its place
rep("+' | '+plateCaptionRects(document.getElementById('hud').getContext('2d'),W,H).map(c=>c.cap).join(' ')", "", 1)
# the caption half of r.204's row goes; the BOARDS keep their gate
rep("const rects=plateCaptionRects(hc2,Wv,Hv); const boards=boardLabels(hc2,Wv,Hv,camOf(uu)); /* the canvas as it is now — the QA block's W,H were read at its start, before the range layout */ const far=rects.filter(c=>{ const q=platesHere().find(p=>p.id===c.id); const r=q&&plateRect(q); if(!r||!(r.bot>captionCeiling(Hv)&&r.top<captionFloor(Hv))) return false; return Math.max(0,r.top-c.y1,c.y0-r.bot)>40; }).length; const capHit=rects.filter(c=>ko.some(t=>hit(c,t))).length, boardHit=boards.filter(b=>ko.some(t=>hit(b,t))).length; const who=rects.filter(c=>ko.some(t=>hit(c,t))).map(c=>c.cap+' on '+ko.find(t=>hit(c,t)).id).concat(boards.filter(b=>ko.some(t=>hit(b,t))).map(b=>'board '+b.sh+' on '+ko.find(t=>hit(b,t)).id)).map(x=>x+' at '+z+'×'+(dp?' pan'+dp:'')+(dt?' tilt'+dt:'')); return {n:rects.length,b:boards.length,capHit,boardHit,far,ko:ko.length,all:rects.length===marks,who}; };",
    "const boards=boardLabels(hc2,Wv,Hv,camOf(uu)); /* r.205 (DD-14): there are no captions to measure; his lane signs are what must stay clear */ const boardHit=boards.filter(b=>ko.some(t=>hit(b,t))).length; const who=boards.filter(b=>ko.some(t=>hit(b,t))).map(b=>'board '+b.sh+' on '+ko.find(t=>hit(b,t)).id).map(x=>x+' at '+z+'×'+(dp?' pan'+dp:'')+(dt?' tilt'+dt:'')); return {n:0,b:boards.length,capHit:0,boardHit,far:0,ko:ko.length,all:true,who}; };",1)
rep("push('CAPTIONS_CLEAR_OF_THE_CONTROLS', clear&&every&&marks>0&&clearQ&&nearAll, 'elements over the stage '",
    "push('BOARDS_CLEAR_OF_THE_CONTROLS', clear&&every&&marks>0&&clearQ&&nearAll, 'elements over the stage '",1)
rep("catch(e){ push('CAPTIONS_CLEAR_OF_THE_CONTROLS',false,'threw '+String(e).slice(0,120)); }",
    "catch(e){ push('BOARDS_CLEAR_OF_THE_CONTROLS',false,'threw '+String(e).slice(0,120)); }",1)
rep("' words on any element'+(who.length?' ('+who.join(' · ')+')':'')+' · every one of the '+marks+' marks captioned at every look '+every+' · every caption within 40 px of its plate '+nearAll+' (captions '+Math.min.apply(null,runs.map(x=>x.n))+'–'+Math.max.apply(null,runs.map(x=>x.n))+', boards '+Math.min.apply(null,runs.map(x=>x.b))+'–'+Math.max.apply(null,runs.map(x=>x.b))+')",
    "' sign words on any element'+(who.length?' ('+who.join(' · ')+')':'')+' · with '+marks+' targets marked and no caption anywhere '+every+' '+nearAll+' (boards '+Math.min.apply(null,runs.map(x=>x.b))+'–'+Math.max.apply(null,runs.map(x=>x.b))+')",1)
rep("+' words on any element'+(whoQ.length?' ('+whoQ.join(' · ')+')':'')+', every mark captioned '+clearQ);",
    "+' sign words on any element'+(whoQ.length?' ('+whoQ.join(' · ')+')':'')+', the stance box on the row '+clearQ);",1)

# 10 · A PRESS NEVER TOUCHES A TARGET YOU ARE NOT ON (the seven-lens SSSES round on the LIVE r.204, CLASS 1a;
#      his 21:05 "system should always remember what silouettes are targeted"). APPROVE and FIRE tested the CURRENT
#      mark for being down BEFORE r.204's test of the plate under the bullseye, and the down-refusal called
#      releaseAuthority, which empties state.tgtSlot wholesale: one press aimed at an unmarked plate could book two
#      rows against a plate he was not looking at AND delete every standing red box on the lane.
NM = "  if(slot==null&&marksPersist()&&typeof lockOn==='function'&&platesHere().some(p=>p.id===state.desig.id)){ const lk=lockOn(); if(lk&&lk.id!==state.desig.id&&!markSlotOf(lk.id)){ decide('HOLD','NONE',{reason:'NOT_MARKED',under:lk.id}); toast('NOT MARKED · '+plateWord(lk.id)+' · PRESS TARGET FIRST',lk.id); return; } }"
if s.count(NM)!=1: raise SystemExit('REFUSE: the r.204 NOT_MARKED guard is not once')
rep(NM+" /* r.204: on the range, APPROVE acts on the plate under the bullseye and never o", " /* r.205: hoisted above the down-guards — see below */ /* r.204: on the range, APPROVE acts on the plate under the bullseye and never o",1)
rep("  if(!state.desig){toast('NO AMBER · MARK A TARGET FIRST');return;}",
    "  if(!state.desig){toast('NO AMBER · MARK A TARGET FIRST');return;}\n"+NM+" /* r.205 INVARIANT (CLASS 1a): a press is judged on the target UNDER THE BULLSEYE before anything is judged on the current mark, so a press aimed at an unmarked plate never books a row against another plate and never releases its box. It sat BELOW the two down-guards, and TARGET_DOWN called releaseAuthority, which empties every slot. */",1)
rep("decide('HOLD',state.desig.id,{reason:'TARGET_DOWN'}); releaseAuthority('TARGET DOWN');",
    "decide('HOLD',state.desig.id,{reason:'TARGET_DOWN'}); dropMark(state.desig.id,'TARGET DOWN');",1)
rep("decide('REJECT',state.desig.id,{reason:'TARGET_GONE'}); releaseAuthority('TARGET GONE');",
    "decide('REJECT',state.desig.id,{reason:'TARGET_GONE'}); dropMark(state.desig.id,'TARGET GONE');",1)
rep("function releaseAuthority(why){ /* r.134: the red box was a stored bit that outlived a scene change, a reset and its approver — one consumer, one row */",
    "function dropMark(id,why){ /* r.205 (CLASS 1a): ONE target's box ends — never the lane's. releaseAuthority empties every slot; a refusal about one plate that is down must not delete the standing red boxes beside it. */\n  if(!id) return null; if(state.desig&&state.desig.id===id){ decide('HOLD',id,{reason:'AUTHORITY_RELEASED',why:why}); state.desig=null; state.hiApproved=false; state.hiLock=false; }\n  Object.keys(state.tgtSlot||{}).forEach(k=>{ const sl=state.tgtSlot[k]; if(sl&&sl.id===id) delete state.tgtSlot[k]; });\n  state.pending=null; const ap0=document.getElementById('approve'); if(ap0) ap0.classList.remove('show'); if(typeof list==='function') list(); return id; }\nfunction releaseAuthority(why){ /* r.134: the red box was a stored bit that outlived a scene change, a reset and its approver — one consumer, one row */",1)

# 10b · the r.134 row keeps its meaning under the hoist. It proves a DEAD plate is never approved — and it still
#      does: the wire approval is refused TARGET_DOWN, and the local press, aimed at a standing unmarked plate, is
#      refused NOT_MARKED and names THAT plate (the hoist's whole point). Two refusals, nothing red, as before.
rep("const h0=(state.events||[]).filter(e=>e&&e.verb==='HOLD'&&e.result==='TARGET_DOWN').length; wireApprove(q.id,'QA-PEER2',true);",
    "const dead=e=>e&&e.verb==='HOLD'&&(e.result==='TARGET_DOWN'||e.result==='NOT_MARKED'); const h0=(state.events||[]).filter(dead).length; wireApprove(q.id,'QA-PEER2',true);",1)
rep("const h1=(state.events||[]).filter(e=>e&&e.verb==='HOLD'&&e.result==='TARGET_DOWN').length;\n      push('PEER_APPROVE_OF_A_DEAD_PLATE_REFUSED', notRed&&stillNotRed&&h1===h0+2, 'a peer mark whose plate is down: APPROVE and a wire APPROVE both HOLD TARGET_DOWN \u00d72 ('+(h1-h0)+'), nothing red');",
    "const h1=(state.events||[]).filter(dead).length; const last=(state.events||[]).slice(-1).map(e=>e&&e.result).join('');\n      push('PEER_APPROVE_OF_A_DEAD_PLATE_REFUSED', notRed&&stillNotRed&&h1===h0+2&&last==='NOT_MARKED', 'a peer mark whose plate is down: the wire approval HOLDs TARGET_DOWN and the local press, aimed at a standing unmarked plate, HOLDs NOT_MARKED for THAT plate (r.205 CLASS 1a) \u2014 two refusals ('+(h1-h0)+'), last '+last+', nothing red');",1)

# 11 · THE EMPTY MAGAZINE SAYS ONE THING (CLASS 1c; his 21:05 "if targeted, approve is next step"). nextStep blanked
#      EVERY cue on an empty magazine, so APPROVE went dark on a standing amber that approving would still turn red —
#      approving costs no round, and approveDesig still works. stepFor already keeps FIRE dark on an empty magazine.
rep("function nextStep(){ if(!roundOpen()||state.viewMode==='map') return ''; if(state.mag&&(state.mag.rounds|0)<=0) return ''; /* an empty magazine: RELOAD is the one cue */",
    "function nextStep(){ if(!roundOpen()||state.viewMode==='map') return ''; /* r.205 (CLASS 1c): an empty magazine darkens FIRE ONLY (stepFor's own test) — TARGET and APPROVE cost no round, and his rule is that a targeted silhouette's next step is APPROVE */",1)
rep("(approveWorksHere(d)?((state.mag&&(state.mag.rounds|0)<=0)?'PRESS RELOAD':'PRESS APPROVE'):'THE OTHER SEAT APPROVES')",
    "(approveWorksHere(d)?'PRESS APPROVE':'THE OTHER SEAT APPROVES')",1)
rep("pd.textContent=plateWord(lk.id)+' · '+((state.mag&&(state.mag.rounds|0)<=0)?'PRESS RELOAD':'PRESS TARGET');",
    "pd.textContent=plateWord(lk.id)+' · PRESS TARGET';",1)

# 12 · NOTHING UNDER THE BULLSEYE NAMES NOTHING (CLASS 1d; DD-13e shipped half — with blank sky the recital still read
#      "LAST · 50 M LEFT · DOWN", another plate, which is his 18:40 sentence word for word).
rep("    else if(ls){pd.textContent='LAST · '+plateWord(ls.id)+' · '+(ls.dead?'DOWN':",
    "    else if(marksPersist()&&!d&&state.viewMode!=='map'&&typeof lockOn==='function'&&!lockOn()){ pd.textContent='TARGET FIRST'; pd.style.color='#C9A227'; } /* r.205 (CLASS 1d, DD-13e completed): with NOTHING under the bullseye the recital names NO plate — not the last one shot */\n    else if(ls){pd.textContent='LAST · '+plateWord(ls.id)+' · '+(ls.dead?'DOWN':",1)

# 13b · THE SELF-CHECK GIVES BACK EVERYTHING IT TOOK, not only the marks (the round on the simulated bytes): the row
#      calls rangeReset() under mode 'bounce', and that replaces state.mag with a fresh 30-round training magazine and
#      clears the clock, the tallies, the last shot and the lane's own run. It now hands all of it back.
rep("mag:state.mag&&{n:state.mag.n,rounds:state.mag.rounds},plates:",
    "mag:state.mag&&Object.assign({},state.mag),run:(function(){ try{ const R=rangeRun(state.lane||0); return {R:R,copy:Object.assign({},R,{cur:(R.cur||[]).slice()})}; }catch(e){ return null; } })(),hud:{downGo:state.downGo,downT:state.downT,rangeHit:state.rangeHit,rangeMiss:state.rangeMiss,rangeLapsed:state.rangeLapsed,lastShot:state.lastShot,lastBand:state.lastBand,rangeAllDown:state.rangeAllDown,pending:state.pending,qualDone:state.qualDone,qualH:state.qualH,qualR:state.qualR,qualExpired:state.qualExpired},plates:",1)
rep("if(sv.mag&&state.mag){ state.mag.n=sv.mag.n; state.mag.rounds=sv.mag.rounds; }",
    "if(sv.mag) state.mag=Object.assign({},sv.mag); /* the WHOLE magazine: rangeReset's magLoad had replaced it with a 30-round training one, cap and all */ if(sv.run&&sv.run.R) Object.assign(sv.run.R,sv.run.copy); if(sv.hud) Object.keys(sv.hud).forEach(k=>{ state[k]=sv.hud[k]; });",1)

# 13c · A PEER'S REFUSAL ABOUT ANOTHER PLATE DOES NOT END MY RED BOX (CLASS 1a across the wire). The handler demoted my
#      box for any peer HOLD of those four reasons; two of them name a plate, and only that plate's row is mine to obey.
rep("/^(APPROVER_LOST|PEER_LOST|AUTHORITY_RELEASED|TARGET_DOWN)$/.test(String(row.data.reason||''))){ /* r.136: a peer's ordinary release (scene change, reset, lane change, dead target) demotes my box too */ if(state.desig&&state.desig.phase==='red'){",
    "/^(APPROVER_LOST|PEER_LOST|AUTHORITY_RELEASED|TARGET_DOWN)$/.test(String(row.data.reason||''))){ /* r.136: a peer's ordinary release (scene change, reset, lane change, dead target) demotes my box too */ const named=/^(AUTHORITY_RELEASED|TARGET_DOWN)$/.test(String(row.data.reason||'')); /* r.205 (CLASS 1a over the wire): those two name a PLATE — only that plate's row ends my box; APPROVER_LOST and PEER_LOST are about the seat and still end it */ if(state.desig&&state.desig.phase==='red'&&(!named||String(row.id||'')===String(state.desig.id))){",1)

# 13d · FIRE IS NOT LIT WHERE FIRE IS REFUSED (the round on the simulated bytes): in QUAL 40 a plate already engaged
#      this exposure refuses a second round ("ONE ROUND PER TARGET"), and the button was lit for it anyway.
rep("if(d.phase==='red') return (fireWorksHere(d)&&!(state.mag&&(state.mag.rounds|0)<=0)&&(!d.ref||fireOnIt({kind:d.kind||kindOfRef(d.ref),ref:d.ref})))?'FIRE':'';",
    "if(d.phase==='red') return (fireWorksHere(d)&&!(state.mag&&(state.mag.rounds|0)<=0)&&!(state.rangeMode==='qual40'&&d.ref&&d.ref._eng)&&(!d.ref||fireOnIt({kind:d.kind||kindOfRef(d.ref),ref:d.ref})))?'FIRE':'';",1)

# 13e · THE SAME HOIST IN fireN (the round on the simulated bytes: CLASS 1a had been closed for APPROVE only).
rep("if(state.desig&&state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)&&keepsMark(state.desig.ref)){ decide('HOLD',state.desig.id,{reason:'TARGET_RETURNING'}); toast(plateWord(state.desig.id)+' IS COMING BACK UP · STILL RED · F WHEN IT STANDS'); return; }",
    "if(state.desig&&marksPersist()&&typeof lockOn==='function'&&platesHere().some(p=>p.id===state.desig.id)){ const lk=lockOn(); if(lk&&lk.id!==state.desig.id&&!markSlotOf(lk.id)){ decide('HOLD','NONE',{reason:'NOT_MARKED',under:lk.id}); toast('NOT MARKED · '+plateWord(lk.id)+' · PRESS TARGET FIRST',lk.id); return; } } /* r.205 INVARIANT (CLASS 1a, the same hoist as APPROVE): FIRE is judged on the target UNDER THE BULLSEYE before anything is judged on the mark behind it */\n  if(state.desig&&state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)&&keepsMark(state.desig.ref)){ decide('HOLD',state.desig.id,{reason:'TARGET_RETURNING'}); toast(plateWord(state.desig.id)+' IS COMING BACK UP · STILL RED · F WHEN IT STANDS'); return; }",1)

# 13f · THE MAP SAYS WHAT THE MAP IS (the round: with lockOn() blind on the map, TARGET there said "NO TARGET UNDER
#      THE BULLSEYE · PUT IT ON ONE" — asking him to do on the map the one thing the map cannot do).
rep("if(!lk){ toast(+state.challenge===0?noLockMsg():'NO TARGET UNDER THE BULLSEYE · PUT IT ON ONE'); log('TGT','none',via||'BTN'); return null; }",
    "if(!lk){ toast(state.viewMode==='map'?'THE MAP HAS NO BULLSEYE · GO BACK TO THE OPERATOR VIEW TO MARK':(+state.challenge===0?noLockMsg():'NO TARGET UNDER THE BULLSEYE · PUT IT ON ONE')); log('TGT','none',via||'BTN'); return null; } /* r.205 (CLASS 1b): on the map the refusal names the reason, not an impossible instruction */",1)

# 13g · the r.141/r.204 row keeps its meaning under the fireN hoist, and gains the plate's name. Pressing FIRE with the
#      bullseye on an UNMARKED plate while a red box stands elsewhere is still refused, still spends no round and still
#      leaves the red box red; the refusal now names the plate he is actually on instead of the one he is not.
rep("push('FIRE_SAYS_WHERE', red0&&!!last&&last.verb==='REJECT'&&last.result==='TARGET_OFF_PICTURE'&&r1===r0&&still&&q50.up!==false, 'red box on the 50 L, bullseye on the 150 R: FIRE → '+(last?last.verb+' '+last.result:'no row')+' · rounds unchanged ('+r0+'→'+r1+') · the box is still red on '+(state.desig?state.desig.id:'none'));",
    "push('FIRE_SAYS_WHERE', red0&&!!last&&last.verb==='HOLD'&&last.result==='NOT_MARKED'&&!!last.data&&last.data.under===q150.id&&r1===r0&&still&&q50.up!==false, 'red box on the 50 L, bullseye on the 150 R: FIRE → '+(last?last.verb+' '+last.result+' under '+((last.data||{}).under||'none'):'no row')+' · rounds unchanged ('+r0+'→'+r1+') · the box is still red on '+(state.desig?state.desig.id:'none'));",1)

# 12b · the gate for 10-13, red on the r.204 bytes on every leg
ROW3 = """    { /* r.205 · A_PRESS_NEVER_TOUCHES_A_TARGET_YOU_ARE_NOT_ON (the seven-lens SSSES round on the live r.204, classes 1a-1d; his 21:05 "system should always remember what silouettes are targeted" and 18:40 "target that has not been target says approve from another target") - INVARIANT: a press is judged on the target under the bullseye before anything is judged on the mark behind it; a refusal about one target ends that target's box and no other; an empty magazine darkens FIRE and nothing else, because TARGET and APPROVE cost no round; with nothing under the bullseye the glass names no plate at all; and the MAP, which has no bullseye, keeps the current mark. Four legs. */
      const m0=state.rangeMode, d0=state.desig, s0=state.tgtSlot, a0=state.hiApproved, v0=state.viewMode, z0=state.zoom, L0=state.lastShot, S0=state._qaSilent, q0=state.qaArmed, mg=state.mag&&{n:state.mag.n,rounds:state.mag.rounds}; let ok=true, note='';
      try{ state._qaSilent=true; state.qaArmed=true; state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.zoom=1;
        const uu=units[state.unit]; const look=(b)=>{ const q=plateOf(state.lane,b); aimUnitAt(uu,q,-40,40); state.aimRef=q; return q; };
        /* 1a - a fallen mark must not take the standing red boxes with it */
        const A=look('C-100L'); markLock(lockOn(),'QA'); approveDesig('HI-2'); const redA=(markSlotOf(A.id)&&state.tgtSlot[markSlotOf(A.id)].phase)==='red';
        const Bp=look('C-150R'); markLock(lockOn(),'QA'); Bp.up=false; Bp.lifePct=0; look('C-250'); const n0=Object.keys(state.tgtSlot||{}).length; const e0=(state.events||[]).length;
        approveDesig('HI-2'); const rows=(state.events||[]).slice(e0).map(e=>e&&e.result).join(','); const kept=(markSlotOf(A.id)&&state.tgtSlot[markSlotOf(A.id)].phase)==='red'; const n1=Object.keys(state.tgtSlot||{}).length;
        const legA=redA&&kept&&/NOT_MARKED/.test(rows)&&!/AUTHORITY_RELEASED/.test(rows)&&n1===n0;
        /* 1a again - the same press with FIRE, which had no guard of its own */
        state.desig=null; state.tgtSlot={}; state.hiApproved=false; const A2=look('C-100C'); markLock(lockOn(),'QA'); approveDesig('HI-2');
        const B2=look('C-200R'); markLock(lockOn(),'QA'); approveDesig('HI-2'); B2.up=false; B2.lifePct=0; look('C-250');
        const n2=Object.keys(state.tgtSlot||{}).length, e2=(state.events||[]).length, h2=state.rangeHit|0, mg2=state.mag?(state.mag.rounds|0):0;
        fireN(state.slot||1); /* the FIRE button's own call */ const rows2=(state.events||[]).slice(e2).map(e=>e&&e.result).join(',');
        const legF=/NOT_MARKED/.test(rows2)&&!/AUTHORITY_RELEASED/.test(rows2)&&!/TARGET_GONE/.test(rows2)&&Object.keys(state.tgtSlot||{}).length===n2&&(state.rangeHit|0)===h2&&(state.mag?(state.mag.rounds|0):0)===mg2&&(markSlotOf(A2.id)&&state.tgtSlot[markSlotOf(A2.id)].phase)==='red';
        B2.up=true; B2.lifePct=100; B2.fall=0;
        /* 1c - an empty magazine darkens FIRE only */
        Bp.up=true; Bp.lifePct=100; Bp.fall=0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; const C=look('C-200L'); markLock(lockOn(),'QA'); if(state.mag) state.mag.rounds=0; paintCues(); hudPhase();
        const stepEmpty=nextStep(); const stripEmpty=(document.getElementById('phDes')||{}).textContent||''; const legC=stepEmpty==='APPROVE'&&/PRESS APPROVE$/.test(stripEmpty);
        /* 1d - nothing under the bullseye names nothing */
        if(state.mag&&mg) state.mag.rounds=mg.rounds; state.desig=null; state.tgtSlot={}; state.lastShot={id:C.id,dead:true,life:0}; look('C-100C'); uu.tilt+=Math.atan2(300,focalPx())*180/Math.PI; paintCues(); hudPhase();
        const skyLock=lockOn(), skyStep=nextStep(), skyStrip=(document.getElementById('phDes')||{}).textContent||''; const legD=!skyLock&&skyStep===''&&skyStrip==='TARGET FIRST';
        /* 1b - the map has no bullseye, so the current mark stands */
        state.desig=null; state.tgtSlot={}; const E=look('C-250'); markLock(lockOn(),'QA'); state.viewMode='map'; const mapLock=lockOn(); const mapMark=(typeof markUnderBullseye==='function')&&markUnderBullseye(); const e1=(state.events||[]).length; approveDesig('HI-2'); const mapRows=(state.events||[]).slice(e1).map(e=>e&&e.result).join(',');
        const legB=mapLock===null&&!!mapMark&&mapMark.id===E.id&&!/NOT_MARKED/.test(mapRows)&&!!state.desig&&state.desig.phase==='red'; state.viewMode='op';
        ok=legA&&legF&&legC&&legD&&legB;
        note='a fallen mark leaves the standing red box alone and the press names the plate under the bullseye '+legA+' (FIRE the same '+legF+', rows '+rows2+')'+' (rows '+rows+', slots '+n0+'→'+n1+', the red held '+kept+') · an empty magazine still lights APPROVE on an amber '+legC+' ('+stepEmpty+' / "'+stripEmpty+'") · nothing under the bullseye names nothing '+legD+' (lock '+(skyLock?skyLock.id:'none')+', lit "'+skyStep+'", strip "'+skyStrip+'") · the MAP keeps the mark '+legB+' (lock '+String(mapLock)+', rows '+mapRows+')'; }
      catch(e){ ok=false; note='threw '+String(e).slice(0,110); }
      finally{ state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.viewMode=v0; state.zoom=z0; state.lastShot=L0; if(state.mag&&mg){ state.mag.n=mg.n; state.mag.rounds=mg.rounds; } state.rangeMode=m0; rangeReset(); state.desig=d0; state.tgtSlot=s0; state.hiApproved=a0; state._qaSilent=S0; state.qaArmed=q0; }
      push('A_PRESS_NEVER_TOUCHES_A_TARGET_YOU_ARE_NOT_ON', ok, note); }
"""
rep("    { /* r.157 · QUAL_DONE_SAYS_RESTART", ROW3+"    { /* r.157 · QUAL_DONE_SAYS_RESTART",1)

# 13 · THE MAP HAS NO BULLSEYE (CLASS 1b; round 9's blocking item). lockOn() was map-blind, so on the map an unmarked
#      plate under an invisible bullseye won the three buttons and APPROVE booked NOT_MARKED against a plate the map
#      cannot show. The code's own comment already said the map keeps the current mark.
rep("function lockOn(){","function lockOn(){ if(state.viewMode==='map') return null; /* r.205 (CLASS 1b): the MAP has no bullseye — nothing is under it, so the current mark stands (the r.133 reading the comments already claimed) */",1)

# 9 · the gates, each red on the r.204 bytes first
ROW2 = """    { /* r.205 · SILHOUETTE_COLOUR_IS_THE_PHASE (operator 2026-10-12 ~21:05: "buttoms and colors around boxing amber vs red should match") - INVARIANT: a target's colour on the glass is its slot's phase. Unmarked: the stroke. TARGETED: GIMBAL amber, the colour of its box. APPROVED: LOCK red, the colour of its box. A plate whose mark has ended goes back to the stroke, and a mark held on one target never colours another. Read from the painter itself: drawPlates runs with a collector in place of segs and each silhouette is matched to its plate by where its own segments sit in the world. */
      const m0=state.rangeMode, d0=state.desig, s0=state.tgtSlot, a0=state.hiApproved, S0=state._qaSilent, q0=state.qaArmed, n0=state.lane; let ok=true, note='', _dbg=[];
      try{ state._qaSilent=true; state.qaArmed=true; state.lane=20; state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false;
        const mean=(arr)=>{ let sx=0,sy=0,sz=0,n=0; (arr||[]).forEach(sg=>{ if(!sg) return; sg.forEach(pt=>{ if(!pt) return; sx+=pt[0]; sy+=pt[1]; sz+=pt[2]; n++; }); }); return n?[sx/n,sy/n,sz/n,n]:null; }; const read=(q)=>{ const w=mean(silMesh(q)); if(!w) return null; let best=null, bd=1e9; drawPlates((arr,col)=>{ const g=mean(arr); if(!g||g[3]!==w[3]) return; const d=Math.hypot(g[0]-w[0],g[1]-w[1],g[2]-w[2]); if(d<bd){ bd=d; best=col; } }); _dbg=_dbg.concat([+bd.toFixed(3)]); return bd<0.05?best:null; }; /* the plate is found by its OWN mesh: silMesh(q) gives the very segments the painter hands over, so the match is exact and no neighbour can be taken for it */
        const uu=units[state.unit]; const qs=['C-150R','C-200L','C-250'].map(b=>plateOf(state.lane,b)).filter(Boolean);
        const unm=read(qs[0]);
        aimUnitAt(uu,qs[0],-40,40); state.aimRef=qs[0]; markLock(lockOn(),'QA'); const amb=read(qs[0]); const other=read(qs[2]);
        approveDesig('HI-2'); const red=read(qs[0]);
        aimUnitAt(uu,qs[1],-40,40); state.aimRef=qs[1]; markLock(lockOn(),'QA'); const amb2=read(qs[1]); const redStill=read(qs[0]);
        rangeRelease(qs[1]); const back=read(qs[1]);
        const plain=(c)=>c!==T13.LOCK&&c!==T13.GIMBAL;
        ok = plain(unm) && amb===T13.GIMBAL && plain(other) && red===T13.LOCK && amb2===T13.GIMBAL && redStill===T13.LOCK && plain(back);
        note='unmarked '+unm+' · TARGETED '+amb+' (want '+T13.GIMBAL+') · an untouched neighbour '+other+' · APPROVED '+red+' (want '+T13.LOCK+') · a second TARGETED '+amb2+' while the first holds '+redStill+' · the mark ended '+back+' · the match on each read '+_dbg.join('/'); }
      catch(e){ ok=false; note='threw '+String(e).slice(0,110); }
      finally{ state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.rangeMode=m0; state.lane=n0; rangeReset(); state.desig=d0; state.tgtSlot=s0; state.hiApproved=a0; state._qaSilent=S0; state.qaArmed=q0; }
      push('SILHOUETTE_COLOUR_IS_THE_PHASE', ok, note); }
    { /* r.205 · BUTTON_WEARS_ITS_TARGETS_COLOUR (DD-15, the same sentence) - INVARIANT: a button carries the colour of the box it acts on. APPROVE is the GIMBAL amber of an amber box, FIRE the LOCK red of a red box, TARGET the cue colour. */
      const rgb=(h)=>{ const n=parseInt(h.slice(1),16); return 'rgb('+((n>>16)&255)+', '+((n>>8)&255)+', '+(n&255)+')'; };
      const cs=(id)=>getComputedStyle(document.getElementById(id)).color;
      const t=cs('fTgt'), a=cs('fAppr'), f=cs('fFire');
      push('BUTTON_WEARS_ITS_TARGETS_COLOUR', a===rgb(T13.GIMBAL)&&f===rgb(T13.LOCK)&&t!==rgb(T13.GIMBAL)&&t!==rgb(T13.LOCK),
        'TARGET '+t+' (the cue colour) · APPROVE '+a+' (want '+rgb(T13.GIMBAL)+', the amber box) · FIRE '+f+' (want '+rgb(T13.LOCK)+', the red box)'); }
    { /* r.205 · NO_WORDS_ON_THE_STAGE (operator 2026-10-12 ~20:44: "remove all text from middle; targets only") - INVARIANT: the painter writes no words over the stage but his lane signs and the three lines that were always at the edges (the corner, the frame rate, LOCK). Every fillText of a whole frame is intercepted and read, with six targets marked, at 1x, 3.3x and 8x. */
      const m0=state.rangeMode, d0=state.desig, s0=state.tgtSlot, z0=state.zoom, S0=state._qaSilent, q0=state.qaArmed; let ok=true, note='';
      try{ state._qaSilent=true; state.qaArmed=true; state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={};
        const uu=units[state.unit]; platesHere().filter(p=>p.up).sort((a,b)=>a.z-b.z).slice(0,6).forEach(q=>{ aimUnitAt(uu,q,-40,40); state.aimRef=q; markLock(lockOn(),'QA'); }); approveDesig('HI-2');
        const marks=Object.keys(state.tgtSlot||{}).length; const hx=document.getElementById('hud').getContext('2d'); const bad=[]; let total=0;
        const sign=/^[0-9]+ [0-9]+$/, fps=/^[0-9]+ FPS$/;
        [1,3.3,8].forEach(z=>{ state.zoom=z; state.tickN=(state.tickN|0)+1; const ft=hx.fillText; const seen=[];
          hx.fillText=function(txt){ seen.push(String(txt)); return ft.apply(this,arguments); };
          try{ draw(); } finally { hx.fillText=ft; }
          total+=seen.length;
          seen.forEach(w=>{ const fine=sign.test(w)||w===cornerLabel()||fps.test(w)||w==='LOCK'||w===lockText(lockOn())||w===''||/^[0-9]+$/.test(w); if(!fine){ if(bad.length<6) bad.push(z+'x \\''+w+'\\''); ok=false; } }); });
        note=marks+' marked, '+total+' words drawn over three looks (1x, 3.3x, 8x); anything but a lane sign, the corner, the frame rate or LOCK: '+(bad.length?bad.join(' · '):'none'); }
      catch(e){ ok=false; note='threw '+String(e).slice(0,110); }
      finally{ state.desig=null; state.tgtSlot={}; state.zoom=z0; state.rangeMode=m0; rangeReset(); state.desig=d0; state.tgtSlot=s0; state._qaSilent=S0; state.qaArmed=q0; }
      push('NO_WORDS_ON_THE_STAGE', ok, note); }
"""
rep("    { /* r.157 · QUAL_DONE_SAYS_RESTART", ROW2+"    { /* r.157 · QUAL_DONE_SAYS_RESTART",1)


# 4 · the deck says what it is
rep('overflow:auto">r.204 THE BUTTONS FOLLOW THE BULLSEYE · ',
    'overflow:auto">r.205 THE GLASS TELLS THE TRUTH ABOUT EVERY TARGET · a target wears its own step: amber when it is targeted, red when it is approved, on the silhouette as on the box, and the button you press wears that colour too (APPROVE amber, FIRE red). The middle of the picture carries TARGETS ONLY - the per-target words are gone, the lane signs stay. A target you hit in the last moment of its window goes down when the window closes, so nothing stands or hangs half-fallen afterwards and a hit at the buzzer counts as a hit. And the deck\'s own self-check now borrows the range and gives it back exactly as it found it, so a target you mark in the first seconds stays marked; THE BUTTONS FOLLOW THE BULLSEYE · ')
for dead in ["revision:'0.204'",'overflow:auto">r.204','r0.204',"if(!state.qualDone&&q.lifePct<=0&&(q.fall||0)>0&&(q.fall||0)<1) return;",CLOSE_OLD,'q.mist?T13.LOCK:phaseCol(q,','function captionCeiling','function captionFloor','<b id="fAppr">APPROVE</b>','plateCaptionRects(hc,W,H)','plateCaptionRects(hc2,Wv,Hv)',"push('LABELS_ONLY_WHILE_MARKED'","push('CAPTIONS_CLEAR_OF_THE_CONTROLS'"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead[:60]}')
for need in ["/* r.205 · FALL_ENDS_WITH_THE_WINDOW","push('FALL_ENDS_WITH_THE_WINDOW'","const stood=q.lifePct>0;","push('SILHOUETTE_COLOUR_IS_THE_PHASE'","push('BUTTON_WEARS_ITS_TARGETS_COLOUR'","push('NO_WORDS_ON_THE_STAGE'","phaseCol(q, q.mist?T13.LOCK:",'#face b.appr{color:var(--g)}','<b id="fAppr" class="appr">APPROVE</b>','function plateCaptionRects(){ return []; }',"r.205 (H1): everything borrowed is given back","r.205 INVARIANT (CLASS 1a)","function dropMark(id,why)","r.205 (CLASS 1b): the MAP has no bullseye","r.205 (CLASS 1c)","r.205 (CLASS 1d, DD-13e completed)","push('A_PRESS_NEVER_TOUCHES_A_TARGET_YOU_ARE_NOT_ON'","r.205 (CLASS 1a over the wire)","push('BOARDS_CLEAR_OF_THE_CONTROLS', clear&&every"]:
    if s.count(need)!=1: raise SystemExit('REFUSE: not in once ('+str(s.count(need))+'): '+need)
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

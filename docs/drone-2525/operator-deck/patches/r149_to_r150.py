# r.149 -> r.150 — THE FIRE GATE READS THE PICTURE (the 48-agent fleet on r.147, MoT 1 items 1–4; operator 2026-09-23 "fix all AsM
# identified issues"; docs/asks/2026-09-23_drs_bu_sbu_alpha_needs.md). Invariant, in the player's terms: A ROUND OR A TAG IS SPENT ONLY ON
# A RED BOX THE BULLSEYE IS ON; every path that spends (FIRE, key, double-tap, Enter, YES, the AI) passes the same gate, and the gate's
# refusal costs nothing and writes one row. The amber→red two-step is untouched — this adds a third question AFTER red: is the bullseye
# on it? Members folded: A1 FIRE_SAYS_WHERE (a red box on the 50 L with the ring on the 150 R spent a round and said MISS) · A2 FIRE from
# the MAP view · A4 commit() tagged +250 with no red box (Enter / YES on a peer's REQ) · A18 the AI stayed silent after EMPTY_MAGAZINE +
# reload · A19 the dead !state.hiLock guard · A21 a hand-set red on a non-range kind shot BULL-1 · A22 the AI reads the HIT for 1.4 s ·
# B15 a peer's dead mark could be approved · B16 the approver's quad/VTOL was never turned onto a peer's mark (never for an AI mark — the
# AI moves no seated head) · E4 the loop row cannot pass by saying "not exercised" · E5 DRAW_COMPLETES decides on three frames and the
# error COUNT · E9 the deck's own SSSES row (it could not fail) is gone. Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.149.html'); DST=os.path.join(DECK,'drone-2525_r.150.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── 0 · the AI's reading time is a declared constant (A22: 1.2 s was under the 1.4 s the fleet's gates ask) ──
rep("const LOCK_REACH_PX=48;",
    "const LOCK_REACH_PX=48; const ASM_READ_S=1.4; /* r.150: the AI reads the HIT sentence for 1.4 s before it marks again (Sofia/Asar: the toast minimum) */")
rep("(state.clock-state.lastShot.t)<1.2&&!state.desig) return;",
    "(state.clock-state.lastShot.t)<ASM_READ_S&&!state.desig) return;")
rep("'within 1.2 s of a shot the AI marks nothing ('", "'within '+ASM_READ_S+' s of a shot the AI marks nothing ('")

# ── 1 · A19 · the dead guard: nothing ever set hiLock true ──
if s.count("hiLock=true")!=0: raise SystemExit('REFUSE: hiLock=true exists — the guard is not dead')
rep("if(state.asmSpot && !state.hiLock && !state.desig && best.up!==false",
    "if(state.asmSpot && !state.desig && best.up!==false")

# ── 2 · A18 · the AI re-arms on a reload ──
rep("magLoad('MANUAL'); toast('RELOADED · MAG '",
    "magLoad('MANUAL'); if(state.desig) state.desig.asmFired=false; /* r.150 (Pangu B): the AI re-arms on a reload — it stayed silent after EMPTY_MAGAZINE with the box still red */ toast('RELOADED · MAG '")

# ── 3 · A1 / A1b / A2 · FIRE reads the picture: a round is spent only with the bullseye on the red box ──
rep("  if(!magHasRound()){ decide('REJECT',s.id,{reason:'EMPTY_MAGAZINE'}); toast('EMPTY · PRESS RELOAD'); return; } /* r.138: a shot needs a round; a refusal never costs one */",
"""  if(!magHasRound()){ decide('REJECT',s.id,{reason:'EMPTY_MAGAZINE'}); toast('EMPTY · PRESS RELOAD'); return; } /* r.138: a shot needs a round; a refusal never costs one */
  if(!state.simDirect){ const offMap=state.viewMode==='map'; let on=false; const tgt=(s.kind==='ring'&&rings[0])?rings[0]:s.ref;
    if(!offMap&&tgt){ if(tgt.form){ on=(typeof pipOn==='function')&&!!pipOn(tgt); } else { const cam=camOf(units[state.unit]),W=view.width,H=view.height; const w=worldOf(tgt); const pr=proj([w.x,w.y,w.z],cam,W,H); on=!!pr&&pr.x>=0&&pr.x<=W&&pr.y>=0&&pr.y<=H&&Math.hypot(pr.x-W/2,pr.y-H*.46)<=32; } }
    if(!on){ decide('REJECT',s.id,{reason:'TARGET_OFF_PICTURE',via:offMap?'MAP':'PIP'}); toast('YOUR RED BOX IS ON THE '+plateWord(s.id)+' · YOUR BULLSEYE IS NOT · '+(offMap?'LEAVE THE MAP':'PUT IT ON IT')); return; }
  } /* r.150 (fleet r.147, MoT 1 #1 FIRE_SAYS_WHERE; Athena/Thor/Enki B): a round is spent only with the bullseye ON the red box (simDirect — the batch's own short-circuit, never a player's — bypasses it, as it bypasses the hit test) — a shot with the ring on the 150 R and the box on the 50 L spent a round, said MISS, and never said where the box was. The refusal costs nothing, keeps the box red, and names the target. Plates use the one hold rule (pipOn: outline + 8 px); every other kind the 32 px the hit test uses. The MAP view has no picture, so it cannot fire (Thor B). */""")

# ── 4 · A21 · the ring branch shoots the ring, never a hand-set red on some other kind ──
rep("    const o=rings[0]||s.ref; const pr=proj([o.x,o.y,o.z],cam,W,H);",
    "    if(s.kind!=='ring'){ decide('REJECT',s.id,{reason:'NOT_A_RANGE_TARGET',kind:s.kind}); toast('THAT IS NOT A RANGE TARGET · MARK A SILHOUETTE OR THE BULL'); return; } /* r.150 (Thor B A9d): a forged red on a non-range kind at CH0 was routed to BULL-1 */\n    const o=rings[0]||s.ref; const pr=proj([o.x,o.y,o.z],cam,W,H);")

# ── 5 · A4 · a tag spends only on a red box under the bullseye; a pending request dies with the scene ──
rep("function commit(d){d.tagged=true;",
    "function commit(d){ { let on=false; try{ on=!!(d&&state.desig&&state.desig.id===d.id&&state.desig.phase==='red'&&(typeof pipOn!=='function'||pipOn(d))); }catch(e){ on=false; } if(!on){ decide('REJECT',(d&&d.id)||'NONE',{reason:'TAG_NEEDS_RED_BOX'}); state.pending=null; const ap0=document.getElementById('approve'); if(ap0) ap0.classList.remove('show'); toast('MARK IT, GET IT APPROVED, THEN TAG'); return; } } /* r.150 (Thor A B1, MoT 1 #3): Enter or YES on a peer's REQ scored +250 and wrote SIM-ACTION + TAG with no mark and no approve */ d.tagged=true;")
rep("function rangeRelease(q){ if(!q) return;", "function rangeRelease(q){ if(!q) return; state.pending=null;")
rep("function rangeReset(){ state.lastShot=null; magLoad('RESET');", "function rangeReset(){ state.lastShot=null; state.pending=null; magLoad('RESET');")
rep("    state.pending={id,from:m.sid};", "    state.pending=(typeof roundOpen==='function'&&roundOpen())?{id,from:m.sid}:null; /* r.150: a request outside a round parks nothing */")

# ── 6 · B15 · no approval on a dead plate, whoever marked it; the wire path judges the same ──
rep("if(state.desig.how!=='PEER'&&state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)){ decide('HOLD',state.desig.id,{reason:'TARGET_DOWN'});",
    "if(state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)){ decide('HOLD',state.desig.id,{reason:'TARGET_DOWN'});")
rep("  if(d.phase!=='amber'){ decide('HOLD',id,{reason:'WIRE_APPROVE_NOT_AMBER',by,phase:d.phase}); return {accepted:false,msg:'PEER APPROVE · NOT AMBER'}; } /* r.135: a refused wire approval is a HOLD row beside it, quiet or not */",
    "  if(d.phase!=='amber'){ decide('HOLD',id,{reason:'WIRE_APPROVE_NOT_AMBER',by,phase:d.phase}); return {accepted:false,msg:'PEER APPROVE · NOT AMBER'}; } /* r.135: a refused wire approval is a HOLD row beside it, quiet or not */\n  if(d.ref&&(d.ref.up===false||d.ref.lifePct<=0)){ decide('HOLD',id,{reason:'TARGET_DOWN',by}); return {accepted:false,msg:'PEER APPROVE · THAT TARGET IS DOWN'}; } /* r.150 (Thor A B3, MoT 1 #4): an APPROVE row stood on a corpse when the mark was a peer's */")

# ── 7 · B16 · the approver looks at a peer's mark from any seat; never when the AI marked (the AI moves no seated head) ──
rep("  { const u=units[state.unit]; if(u&&u.kind==='turret'&&!state.qaArmed) aimUnitAt(u,ref,-40,20); } /* r.133: the approver looks at what it is approving — the box was off the joiner's screen */",
    "  { const u=units[state.unit]; if(u&&!state.qaArmed&&!/^ASM@/.test(String(by||''))) aimUnitAt(u,ref,-40,20); } /* r.133: the approver looks at what it is approving — the box was off the joiner's screen · r.150 (Christo/Thor A): any seat kind, quad and VTOL too; never for an AI mark (r.148: the AI moves no seated head) */")

# ── 8 · E4 / E5 / E9 · rows that cannot pass by saying so ──
rep("rows.push({id:'ASM_MARKED_BY_THE_LOOP',ok:true,note:'not exercised here: the round had started before the check (drone-deck-qa boots the deck alone and proves it)'})",
    "rows.push({id:'ASM_MARKED_BY_THE_LOOP',ok:false,note:'NOT EXERCISED: the round had started before the check (drone-deck-qa boots the deck alone and proves it) — a row that was not run is red, never green (MoT 11)'})")
rep("const done=(state.drawDone||0)>0, err=!!state.drawErr;",
    "const done=(state.drawDone||0)>=3, err=!!state.drawErr||(state.drawErrN|0)>0; /* r.150 (Enlil/MoT 2 #4): three frames and the error COUNT, not frame one */")
rep("  push('SSSES', S&&S.avg>0, JSON.stringify(S));\n", "  /* r.150: the deck's own SSSES row is gone — it could not fail (MoT 3); the scorer in scripts/drone-spiral9.mjs measures or says UNMEASURED */\n")

# ── 9 · the rows ──
rep("    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',",
"""    /* r.150 · THE FIRE GATE READS THE PICTURE */
    { state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.zoom=1; state.viewMode='op'; const q50=platesHere().find(p=>p.base==='C-50L'), q150=platesHere().find(p=>p.base==='C-150R');
      aimPlate(q50,0); markLock(lockOn(),'QA'); approveDesig('HI-2'); const red0=!!(state.desig&&state.desig.phase==='red'&&state.desig.id===q50.id);
      aimPlate(q150,0); const r0=state.mag.rounds|0; fireN(1); const last=(state.events||[])[(state.events||[]).length-1]; const r1=state.mag.rounds|0; const still=!!(state.desig&&state.desig.phase==='red'&&state.desig.id===q50.id);
      push('FIRE_SAYS_WHERE', red0&&!!last&&last.verb==='REJECT'&&last.result==='TARGET_OFF_PICTURE'&&r1===r0&&still&&q50.up!==false, 'red box on the 50 L, bullseye on the 150 R: FIRE → '+(last?last.verb+' '+last.result:'no row')+' · rounds unchanged ('+r0+'→'+r1+') · the box is still red on '+(state.desig?state.desig.id:'none'));
      aimPlate(q50,0); const r2=state.mag.rounds|0, h0=state.rangeHit|0; fireN(1); const r3=state.mag.rounds|0;
      push('FIRE_ON_THE_BOX_STILL_HITS', (state.rangeHit|0)===h0+1&&r3===r2-1, 'bullseye back on the 50 L: FIRE → HIT · rounds '+r2+'→'+r3);
      state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    { state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-100C'); aimPlate(q,0); markLock(lockOn(),'QA'); approveDesig('HI-2'); state.viewMode='map'; const r0=state.mag.rounds|0; fireN(1); const last=(state.events||[])[(state.events||[]).length-1]; state.viewMode='op';
      push('FIRE_FROM_MAP_REFUSED', !!last&&last.verb==='REJECT'&&last.result==='TARGET_OFF_PICTURE'&&last.data&&last.data.via==='MAP'&&(state.mag.rounds|0)===r0&&q.up!==false, 'a red box left up in the MAP view: FIRE → '+(last?last.result+' via '+(last.data&&last.data.via):'no row')+' · rounds unchanged ('+r0+')'); state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    { state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-50L'); aimPlate(q,0); markLock(lockOn(),'QA'); approveDesig('HI-2'); const r=plateRect(q); aimPlate(q,(r?r.half:12)+4);
      const ap0=(state.events||[]).filter(e=>e&&e.verb==='APPROVE').length, e0=(state.events||[]).length; fireN(1); fireN(1); const evs=(state.events||[]).slice(e0); const miss=evs.filter(e=>e&&e.verb==='MISS').length, ap1=(state.events||[]).filter(e=>e&&e.verb==='APPROVE').length;
      push('ONE_ROW_PER_PULL', miss===2&&ap1===ap0&&!!(state.desig&&state.desig.phase==='red'), '4 px outside the 50 L silhouette (inside the hold rule): 2 pulls → 2 rows · 1 APPROVE ('+miss+' MISS rows, approvals '+ap0+'→'+ap1+', box '+(state.desig?state.desig.phase:'none')+')'); state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    { rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const dd=(typeof doors!=='undefined'&&doors[0])||{id:'D-QA',x:0,y:1,z:60}; const sc0=state.score|0, e0=(state.events||[]).length; state.pending=dd; commit(dd); const l1=(state.events||[])[(state.events||[]).length-1]; const tag=(state.events||[]).slice(e0).some(e=>e&&(e.verb==='TAG'||(e.verb==='SIM-ACTION'&&e.data&&e.data.tag)));
      push('TAG_NEEDS_RED_BOX', (state.score|0)===sc0&&!!l1&&l1.verb==='REJECT'&&l1.result==='TAG_NEEDS_RED_BOX'&&state.pending===null&&!tag, 'YES / Enter on a pending request with no red box: '+(l1?l1.verb+' '+l1.result:'no row')+' · score unchanged ('+sc0+') · no TAG row'); }
    { rangeReset(); const q=platesHere().find(p=>p.base==='C-100L'); state.pending={id:'X'}; rangeReset(); const a=state.pending; state.pending={id:'X'}; rangeRelease(q); const b=state.pending;
      push('PENDING_DIES_WITH_THE_SCENE', a===null&&b===null, 'a pending request is null after RESET ('+String(a)+') and after a RELEASE ('+String(b)+')'); }
    { rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-200R'); peerDesig(q.id,'QA-PEER',1,'pop'); q.up=false; const h0=(state.events||[]).filter(e=>e&&e.verb==='HOLD'&&e.result==='TARGET_DOWN').length; wireApprove(q.id,'QA-PEER2',true); const stillNotRed=!(state.tgtSlot[1]&&state.tgtSlot[1].phase==='red'); approveDesig('HI-2'); const notRed=!(state.desig&&state.desig.phase==='red'); const h1=(state.events||[]).filter(e=>e&&e.verb==='HOLD'&&e.result==='TARGET_DOWN').length;
      push('PEER_APPROVE_OF_A_DEAD_PLATE_REFUSED', notRed&&stillNotRed&&h1===h0+2, 'a peer mark whose plate is down: APPROVE and a wire APPROVE both HOLD TARGET_DOWN ×2 ('+(h1-h0)+'), nothing red'); q.up=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    { rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-250'); const sv=state.unit, ua=state.qaArmed; state.qaArmed=false; state.unit='D1'; const u=units.D1; const p0=u.pan, t0=u.tilt; peerDesig(q.id,'QA-PEER',1,'pop'); const p1=u.pan, t1=u.tilt; const on=(typeof pipOn==='function')&&!!pipOn(q,camOf(u)); state.unit=sv; state.qaArmed=ua;
      push('APPROVE_LOOKS_AT_THE_MARK', on&&(p1!==p0||t1!==t0), 'a VTOL seat receiving a peer mark is turned onto it: pan '+p0.toFixed(1)+'°→'+p1.toFixed(1)+'° · under the bullseye '+on); state.desig=null; state.tgtSlot={}; }
    { rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-250'); aimPlate(platesHere().find(p=>p.base==='C-100C'),0); const ua=state.qaArmed; state.qaArmed=false; const p0=u0.pan, t0=u0.tilt; peerDesig(q.id,'ASM@QA',1,'pop'); const moved=Math.hypot(u0.pan-p0,u0.tilt-t0); state.qaArmed=ua;
      push('AI_MARK_NEVER_TURNS_THE_SEAT', moved<1e-9&&!!(state.tgtSlot[1]&&state.tgtSlot[1].id===q.id), 'a peer mark signed ASM@ lands in the slot and the seated head moves '+moved.toFixed(3)+'°'); state.desig=null; state.tgtSlot={}; }
    { state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-150L'); aimPlate(q,0); const sA=state.asmSpot,sF=state.asmFire; markLock(lockOn(),'QA'); approveDesig('HI-2'); state.asmSpot=true; state.asmFire=true; state.mag.rounds=0; const e0=(state.events||[]).length; asmTick(0.1); const empty=(state.events||[]).slice(e0).some(e=>e&&e.verb==='REJECT'&&e.result==='EMPTY_MAGAZINE'); const armedOff=!!(state.desig&&state.desig.asmFired); magReload(); const rel=(state.events||[]).slice(e0).some(e=>e&&e.verb==='RELOAD'); asmTick(0.1); const fired=(state.events||[]).slice(e0).some(e=>e&&(e.verb==='HIT'||e.verb==='MISS')); state.asmSpot=sA; state.asmFire=sF;
      push('AI_RESUMES_AFTER_RELOAD', empty&&armedOff&&rel&&fired, 'the AI on a red box with an empty magazine: REJECT EMPTY_MAGAZINE then RELOAD then FIRE ('+(fired?'fired':'still silent')+')'); state.desig=null; state.tgtSlot={}; state.hiApproved=false; rangeReset(); }
    { rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-100R'); aimPlate(q,0); const ring=rings[0]; const l0=ring?ring.lifePct:null, r0=state.mag.rounds|0; state.desig={id:q.id,kind:'buoy',ref:q,by:SID,t:state.clock,slot:1,phase:'red',how:'HI-2'}; state.hiApproved=true; fireN(1); const last=(state.events||[])[(state.events||[]).length-1];
      push('FORGED_RED_NEVER_HITS_THE_RING', !!last&&last.verb==='REJECT'&&last.result==='NOT_A_RANGE_TARGET'&&(ring?ring.lifePct===l0:true)&&(state.mag.rounds|0)===r0, 'a hand-set red of kind buoy on a silhouette: '+(last?last.verb+' '+last.result:'no row')+' · BULL-1 untouched ('+l0+'→'+(ring?ring.lifePct:'-')+') · rounds unchanged'); state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    { rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-150R'); aimPlate(q,0); const t0=u0.tilt; u0.tilt=40; const d=targetN(1); const none=!state.desig; u0.tilt=t0;
      push('KEY1_REFUSES_THE_GRASS', d===null&&none, 'bullseye in the sky: key 1 refused · NO TARGET UNDER THE BULLSEYE · nothing marked'); }
    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',""")

# ── 10 · the TARGET button row is deferred: its onclick is wired after the boot QA runs (r.146 idiom: evidence, then a ceiling) ──
rep("  /* r.130 deferred row: draw() cannot run inside boot QA (later consts are in their TDZ), so the loop runs it and this row reads the outcome.",
"""  /* r.150 deferred row (Enlil, MoT 2 #3): no row ever CLICKED the TARGET button — its onclick is wired after the boot QA, so this row waits for it, then presses it with a mark live and the bullseye beside another plate. */
  setTimeout(()=>{ try{ if(state.outcomes!==rows) return; const fb=document.getElementById('fTgt'); if(!fb||typeof fb.onclick!=='function'){ rows.push({id:'TARGET_BUTTON_FOLLOWS_THE_EYE',ok:false,note:'the TARGET button has no handler at check time'}); }
    else { const sv={lane:state.lane,mode:state.rangeMode,zoom:state.zoom,view:state.viewMode,desig:state.desig,slots:state.tgtSlot,hi:state.hiApproved,armed:state.qaArmed,silent:state._qaSilent,pan:units[state.unit].pan,tilt:units[state.unit].tilt}; state.qaArmed=true; state._qaSilent=true; state.lane=0; state.rangeMode='bounce'; state.zoom=1; state.viewMode='op'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false;
      const uu=units[state.unit]; const q1=platesHere().find(p=>p.base==='C-100C'), q2=platesHere().find(p=>p.base==='C-150R'); aimUnitAt(uu,q1,-40,40); markLock(lockOn(),'QA'); aimUnitAt(uu,q2,-40,40); const p0=uu.pan,t0=uu.tilt; fb.onclick(); const moved=Math.hypot(uu.pan-p0,uu.tilt-t0); const d=state.desig; const only=Object.keys(state.tgtSlot||{}).filter(k=>state.tgtSlot[k]).map(k=>state.tgtSlot[k].id);
      rows.push({id:'TARGET_BUTTON_FOLLOWS_THE_EYE',ok:!!d&&d.id===q2.id&&moved<1.5&&only.length===1&&only[0]===q2.id,note:'the 100 C marked; bullseye beside the 150 R; the TARGET button marks '+(d?d.id:'none')+' and the head moves '+moved.toFixed(2)+'° · slots '+only.join(',')});
      state.desig=null; state.tgtSlot={}; state.hiApproved=false; rangeReset(); state.lane=sv.lane; state.rangeMode=sv.mode; state.zoom=sv.zoom; state.viewMode=sv.view; state.qaArmed=sv.armed; state._qaSilent=sv.silent; units[state.unit].pan=sv.pan; units[state.unit].tilt=sv.tilt; if(typeof list==='function') list(); }
    state.qa={pass:rows.filter(x=>x.ok).length,total:rows.length,rev:BUILD.revision,t:Date.now(),known:(state.qa&&state.qa.known)}; const qn=document.getElementById('qaOps'); if(qn) qn.textContent=state.qa.pass+'/'+state.qa.total; }catch(e){ rows.push({id:'TARGET_BUTTON_FOLLOWS_THE_EYE',ok:false,note:'threw '+String(e).slice(0,100)}); state.qaArmed=false; state._qaSilent=false; } }, 1500);
  /* r.130 deferred row: draw() cannot run inside boot QA (later consts are in their TDZ), so the loop runs it and this row reads the outcome.""")

# ── 11 · re-pointed r.130 row: 20 px beside a 300 m plate is now a refusal that spends nothing (the class the gate exists for) ──
rep("push('RANGE_MISS_300_OFF20', m300.red&&!m300.dead&&m300.q.lifePct===100, '20 px beside a 300 m plate · dead='+m300.dead+' (the old 32 px rule scored this a HIT)');",
    "push('RANGE_MISS_300_OFF20', m300.red&&!m300.dead&&m300.q.lifePct===100&&m300.rounds1===m300.rounds0&&m300.last==='TARGET_OFF_PICTURE', '20 px beside a 300 m plate · dead='+m300.dead+' · '+m300.last+' · rounds unchanged ('+m300.rounds0+'→'+m300.rounds1+') (r.130: the old 32 px rule scored this a HIT; r.150: it is a refusal that spends nothing, not a MISS that spends a round)');")
rep("      designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const red=!!(state.desig&&state.desig.phase==='red'); fireN(1);\n      return {q,red,dead:!!(state.lastShot&&state.lastShot.dead),band:state.lastBand,cleared:!state.desig}; }",
    "      designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const red=!!(state.desig&&state.desig.phase==='red'); const rounds0=state.mag?state.mag.rounds|0:0; fireN(1); const lastE=(state.events||[])[(state.events||[]).length-1];\n      return {q,red,dead:!!(state.lastShot&&state.lastShot.dead),band:state.lastBand,cleared:!state.desig,rounds0,rounds1:state.mag?state.mag.rounds|0:0,last:lastE?String(lastE.result||''):''}; }")

# ── 12 · four r.131–r.142 rows fired with the bullseye 25° or 80 px off the plate to make a MISS; under the gate a MISS is aimed 4 px outside the silhouette (inside the 8 px hold rule) — corrections, on the record ──
rep("const s1=fireAt(qa,80); const s2=fireAt(qa,0);", "const s1=fireAt(qa,(plateRect(qa)||{half:12}).half+4); const s2=fireAt(qa,0); /* r.150: a miss is 4 px outside the silhouette, inside the hold rule — 80 px off the plate is now a refusal that spends nothing */")
rep("for(let i=0;i<10;i++){ const q=rangeExpose(0,'C-50'); aimPlate(q,80);", "for(let i=0;i<10;i++){ const q=rangeExpose(0,'C-50'); aimPlate(q,(plateRect(q)||{half:12}).half+4); /* r.150: a spent round is a MISS inside the hold rule, not a shot 80 px off the plate */")
rep("const u=units[state.unit]; const pan0=u.pan; u.pan+=25; /* aim off the plate */ state.desig.by=SID; state.desig.how='HI-2'; fireN(1); u.pan=pan0;",
    "const u=units[state.unit]; const pan0=u.pan; aimPlate(q,(plateRect(q)||{half:12}).half+4); /* r.150: a miss with the bullseye on the box's edge (25° off is now a refusal) */ state.desig.by=SID; state.desig.how='HI-2'; fireN(1); u.pan=pan0;")

# ── 13 · the r.131 ring fixture (a synthetic object of kind obj) was routed to BULL-1 by the very hole A21 closes; the row now marks the real ring ──
rep("    designate({id:'QA-HIT',kind:'ring',ref:{id:'QA-HIT',x:0,y:2,z:26,lifePct:100,up:true}},'QA'); approveDesig('HI-2'); fireN(1);",
    "    const rq=rings[0]; rq.lifePct=100; rq.up=true; rq._eng=false; designate({id:rq.id,kind:'ring',ref:rq},'QA'); approveDesig('HI-2'); fireN(1); /* r.150: the real ring — a synthetic kind-obj stand-in rode the hole that routed any non-range kind to BULL-1 (Thor B A9d) */")

c=s.count("revision:'0.149'"); rep("revision:'0.149'","revision:'0.150'",c)
h=s.count("r0.149"); rep("r0.149","r0.150",h)
for dead in ["push('SSSES'","!state.hiLock &&","state.pending={id,from:m.sid};","ok:true,note:'not exercised here"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

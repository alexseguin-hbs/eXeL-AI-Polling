import re, hashlib
SRC='/home/user/eXeL-AI-Polling/docs/drone-2525/operator-deck/drone-2525_r.130.html'
DST='/home/user/eXeL-AI-Polling/docs/drone-2525/operator-deck/drone-2525_r.131.html'
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:80]!r}, found {c}')
    n[0]+=1
    return s.replace(old,new)
def ins_before(anchor,text): return rep(anchor,text+anchor)
def ins_after(anchor,text): return rep(anchor,anchor+text)

# ── A · the basis leftovers the fleet found (lens 1A/1B) ──────────────────────────────────────────
s=ins_before("function camOf(u){",
"""/* r.131 ONE world position for any target (plates are lane-local; qWorld places them; the aiming point is the
   centre of mass) and ONE aim from the camera EYE. r.130 aimed from the unit origin (1.6 m under a turret's eye,
   ~1.8° high at 50 m) and boxed plates at their raw lane-local coordinates. */
function worldOf(ref){ if(!ref) return {x:0,y:1.2,z:0,base:0};
  if(ref.form&&ref.id&&String(ref.id).charAt(0)==='C'&&typeof qWorld==='function'){ const w=qWorld(ref); const base=w.y||0; return {x:w.x,y:base+ref.h*(ref.form==='F'?0.42:0.78*0.55),z:w.z,base}; }
  return {x:ref.x||0,y:(ref.y||1.2),z:ref.z||0,base:(ref.y||0)}; }
function aimUnitAt(u,ref,lo,hi){ const w=worldOf(ref); const c=camOf(u); const dx=w.x-c.x,dy=w.y-c.y,dz=w.z-c.z; const d=Math.hypot(dx,dz)||1;
  let pan=(yawTo(dx,dz)-u.yaw)*180/Math.PI; pan=((pan+540)%360)-180; u.pan=pan;
  u.tilt=Math.max(lo==null?-40:lo,Math.min(hi==null?20:hi,Math.atan2(dy,d)*180/Math.PI)); return w; }
""")
s=rep("  let x=u.x+sy*off.f+cy*off.r;\n  let z=u.z-cy*off.f+sy*off.r;",
      "  const fb=fwdOf(u.yaw,0), rb=rightOf(u.yaw); /* r.131: the seat offset rides the one basis (r.130 still used the old inverted forward here) */\n  let x=u.x+fb.fx*off.f+rb.rx*off.r;\n  let z=u.z+fb.fz*off.f+rb.rz*off.r;")
s=rep("u.x=Math.sin(a)*110; u.y=0; u.z=20+Math.cos(a)*130; u.yaw=a; u.label='TURRET '+i+'/42';",
      "u.x=Math.sin(a)*110; u.y=0; u.z=20+Math.cos(a)*130; u.yaw=yawTo(0-u.x,20-u.z); /* r.131: face the Capitol */ u.label='TURRET '+i+'/42';")
s=rep("  return {x:m.x,y,z:m.z,yaw,tilt,fx:Math.sin(yaw)*Math.cos(tilt),fy:Math.sin(tilt),fz:-Math.cos(yaw)*Math.cos(tilt)};",
      "  const f=fwdOf(yaw,tilt); return {x:m.x,y,z:m.z,yaw,tilt,fx:f.fx,fy:f.fy,fz:f.fz};")
s=rep("  const dx=s.ref.x-u.x,dz=s.ref.z-u.z;\n  u.pan=(yawTo(dx,dz)*180/Math.PI)-u.yaw*180/Math.PI;\n  u.tilt=Math.max(-40,Math.min(20,Math.atan2((s.ref.y||1.2)-u.y,Math.hypot(dx,dz))*180/Math.PI));",
      "  aimUnitAt(u,s.ref,-40,20);")
s=rep("  const dx=0-u.x, dz=20-u.z;\n  u.pan=(yawTo(dx,dz)*180/Math.PI)-(u.yaw*180/Math.PI);\n  u.tilt=-8;",
      "  aimUnitAt(u,{x:0,y:8,z:20},-8,-8);")
s=rep("    const dx=best.x-u.x,dz=best.z-u.z;\n    const want=(yawTo(dx,dz)*180/Math.PI)-u.yaw*180/Math.PI;\n    u.pan+=(want-u.pan)*Math.min(1,2*dt);",
      "    const cw=camOf(u), bw=worldOf(best); const dx=bw.x-cw.x,dz=bw.z-cw.z;\n    let want=(yawTo(dx,dz)*180/Math.PI)-u.yaw*180/Math.PI; want=((want+540)%360)-180; let dp=want-u.pan; dp=((dp+540)%360)-180;\n    u.pan+=dp*Math.min(1,2*dt);")
s=rep("""    const wq=qWorld(q);
    const dx=wq.x-u.x, dz=wq.z-u.z;
    u.pan=(yawTo(dx,dz)*180/Math.PI)-u.yaw*180/Math.PI;
    u.tilt=Math.max(-20,Math.min(8,Math.atan2((wq.y||0.4)-u.y,Math.hypot(dx,dz))*180/Math.PI));
    rangeReset();""","""    rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false;
    aimUnitAt(u,q,-20,8);""")
s=rep("  function sc(p){const dx=p.x-u.x,dy=(p.y||0)-u.y,dz=p.z-u.z,dist=Math.hypot(dx,dy,dz)||1;return {dot:(c.fx*dx+c.fy*dy+c.fz*dz)/dist,dist};}",
      "  function sc(p){const dx=p.x-c.x,dy=(p.y||0)-c.y,dz=p.z-c.z,dist=Math.hypot(dx,dy,dz)||1;return {dot:(c.fx*dx+c.fy*dy+c.fz*dz)/dist,dist};} /* r.131: the cone is the camera's, from the eye */")
s=rep("    if(o.up!==false){const s=sc(o); if(s.dot>0.82) return {id:o.id,dist:s.dist,kind:state.desig.kind||'pop',ref:o};}",
      "    if(o.up!==false&&(o.fall||0)<0.25){const s=sc(worldOf(o)); if(s.dot>0.82) return {id:o.id,dist:s.dist,kind:state.desig.kind||'pop',ref:o};}")
s=rep("const s=sc(qWorld(p));","const s=sc(worldOf(p));",2)
s=rep("  const w=(ref&&ref.id&&String(ref.id).charAt(0)==='C'&&typeof qWorld==='function')?qWorld(ref):ref;\n  const pr=proj([w.x,w.y||1.2,w.z],cam,W,H);",
      "  const w=worldOf(ref);\n  const pr=proj([w.x,w.y,w.z],cam,W,H);")
# tap-to-designate sees the range; double-tap fires only on the red box itself
s=rep("  if(state.mode==='turret') return pops.filter(p=>p.up).map(p=>({ref:p,kind:'pop',id:p.id}));\n  return doors.map(d=>({ref:d,kind:'door',id:d.id}));",
      "  const tur=state.mode==='turret'||(units[state.unit]||{}).kind==='turret';\n  if(tur&&chNum()===0&&typeof platesHere==='function') return platesHere().filter(q=>q.up&&(q.fall||0)<0.25&&q.lifePct>0).map(q=>({ref:q,kind:'pop',id:q.id})).concat(pops.filter(p=>p.up).map(p=>({ref:p,kind:'pop',id:p.id})));\n  if(tur) return pops.filter(p=>p.up).map(p=>({ref:p,kind:'pop',id:p.id}));\n  return doors.map(d=>({ref:d,kind:'door',id:d.id}));")
s=rep("    const pr=proj([c.ref.x,c.ref.y,c.ref.z],cam,W,H);\n    if(!pr)return;\n    const d=Math.hypot(pr.x-sx,pr.y-sy);",
      "    const cw=worldOf(c.ref); const pr=proj([cw.x,cw.y,cw.z],cam,W,H);\n    if(!pr)return;\n    const d=Math.hypot(pr.x-sx,pr.y-sy);")
s=rep("  if(state._tap && now-state._tap<320){\n    state._tap=0;\n    fireN(state.slot||1); return;\n  }",
      "  if(state._tap && now-state._tap<320){\n    state._tap=0;\n    const on=pickNear(sx,sy); if(!(on&&state.desig&&on.id===state.desig.id)){ toast('DOUBLE-TAP THE RED BOX TO FIRE'); return; } /* r.131: never on blank sky */\n    fireN(state.slot||1); return;\n  }")
# turret look through the control law, scaled by zoom; drag scaled by zoom
s=rep("    u.pan += -state.joy.rx*120*dt;\n    u.tilt += state.joy.ry*90*dt;",
      "    const zf=1/Math.max(0.55,Math.min(3.2,state.zoom||1)); /* r.131: through controlLaw (deadzone · sens · trim · arrows) and scaled by zoom */\n    u.pan += -lookX*120*dt*zf;\n    u.tilt += lookY*90*dt*zf;")
s=rep("      u.pan-=dx*.08; u.tilt-=dy*.08;","      { const zf=1/Math.max(0.55,Math.min(3.2,state.zoom||1)); u.pan-=dx*.08*zf; u.tilt-=dy*.08*zf; }")
# voice: APPROVE exists; 'hold fire' never fires
s=ins_before("    const f=t.match(/\\b(?:fire|f)\\s*(one|two|three|1|2|3)?\\b/);",
"""    if(/\\b(?:approve|approved|cleared)\\b/.test(t)){ approveDesig('HI-2'); toast('VOICE APPROVE'); return; }
    if(/\\b(?:hold|cease|check|stop|don'?t|do not|no)\\b/.test(t)){ toast('VOICE HOLD'); log('VOICE','HOLD',t); return; }
""")
# the challenge picker no longer re-aims at the bull ring; the scenario picker seats a turret
s=rep("""  if(state.challenge===0 && units[state.unit] && rings[0]){
    const u=units[state.unit],o=rings[0];
    const dx=o.x-u.x,dz=o.z-u.z;
    u.pan=(yawTo(dx,dz)*180/Math.PI)-u.yaw*180/Math.PI;
    u.tilt=Math.max(-25,Math.min(10,Math.atan2((o.y||2)-u.y,Math.hypot(dx,dz))*180/Math.PI));
    rings[0].up=true; rings[0].lifePct=100;
  }
};""","""  /* r.131: CH0 is the RANGE. goRange() has already parked, reset and pre-aimed at the first exposure; r.130's handler
     re-aimed at the bull ring here, so TARGET/FIRE scored BULL-1 instead of a plate (lens 10B). The ring stays down. */
  if(state.challenge===0 && rings[0]){ rings[0].up=false; }
};""")
s=rep("  if(!['T1','T01','D1','D1Q'].includes(state.unit)) applyMode('turret');",
      "  if(!['T1','T01','D1','D1Q'].includes(state.unit)||state.mode!=='turret') applyMode('turret'); /* r.131: the range is always a turret seat (slots/candidates key on it) */")
s=rep("  if(state.mode==='turret') return ((chNum()===0&&typeof platesHere==='function'?platesHere():QUAL).filter(q=>q.up).concat(pops.filter(p=>p.up))).slice(0,3).map((p,i)=>({n:i+1,ref:p,kind:'pop',id:p.id}));",
      "  if(state.mode==='turret'||(units[state.unit]||{}).kind==='turret') return ((chNum()===0&&typeof platesHere==='function'?platesHere():QUAL).filter(q=>q.up&&(q.fall||0)<0.25&&q.lifePct>0).concat(pops.filter(p=>p.up))).slice(0,3).map((p,i)=>({n:i+1,ref:p,kind:'pop',id:p.id}));")

# ── B · exposure-scoped engagement (lens 2A/2B/3A/3B/4A/4B/6A) ────────────────────────────────────
s=rep("function rangeReset(){ (PLATES||QUAL).forEach(q=>{q.up=false;q.lifePct=100;q.life=0;q.fall=1;q._dead=0;q._down=false;q.mist=false;}); rangeRunReset(); state.lastBand=''; }",
      "function rangeReset(){ (PLATES||QUAL).forEach(q=>{q.up=false;q.lifePct=100;q.life=0;q.fall=1;q._dead=0;q._down=false;q._eng=false;q.mist=false;}); rangeRunReset(); state.lastBand=''; state.rangeAllDown=false; state.rangeHit=0; state.rangeMiss=0; }\n"
      "/* r.131: authority is scoped to the EXPOSURE — when a target goes down (hit or lapsed) its amber/red box goes with it. */\n"
      "function rangeRelease(q){ if(!q) return; if(state.desig&&(state.desig.ref===q||state.desig.id===q.id)){ state.desig=null; state.hiApproved=false; } Object.keys(state.tgtSlot||{}).forEach(k=>{ const sl=state.tgtSlot[k]; if(sl&&(sl.ref===q||sl.id===q.id)) delete state.tgtSlot[k]; }); q.mist=false; }")
s=rep("function exposureOrder(lane){ const r=mulberry32(2525+(lane|0)); const idx=QUAL.map((_,i)=>i); for(let i=idx.length-1;i>0;i--){const j=Math.floor(r()*(i+1)); const t=idx[i]; idx[i]=idx[j]; idx[j]=t;} return idx; }",
      "function exposureOrder(lane){ const L=lane|0; const c=exposureOrder._c||(exposureOrder._c={}); if(c[L]) return c[L]; const r=mulberry32(2525+L); const idx=QUAL.map((_,i)=>i); for(let i=idx.length-1;i>0;i--){const j=Math.floor(r()*(i+1)); const t=idx[i]; idx[i]=idx[j]; idx[j]=t;} c[L]=idx; return idx; }")
s=rep("  q.up=true;q.lifePct=100;q.life=EXPOSURE_S[q.z]||5;q.fall=0;q._dead=0;q.mist=false; R.phase='up';R.cur=q.id;R.t=0; return q; }",
      "  q.up=true;q.lifePct=100;q.life=EXPOSURE_S[q.z]||5;q.fall=0;q._dead=0;q._eng=false;q.mist=false; const ord=exposureOrder(lane); const ki=ord.indexOf(QUAL.findIndex(x=>x.id===base)); if(ki>=0) R.k=ki; R.phase='up';R.cur=q.id;R.q=q;R.t=0; return q; }")
s=rep("      if(!q||(mode==='stay'&&q._down)){ R.k++; R.t=EXPOSURE_GAP_S; return; }\n      q.up=true;q.lifePct=100;q.life=e.sec;q.fall=0;q._dead=0;q.mist=false; R.phase='up';R.cur=q.id;R.t=0;",
      "      const tbNow=(mode==='qual40'&&L.i===mine)?(QUAL_TABLES[state.qualTbl||0]||QUAL_TABLES[2]):null;\n      if(!q||(mode==='stay'&&q._down)||(tbNow&&tbNow.cap(q.id)<=0)){ R.k++; R.t=EXPOSURE_GAP_S; if(mode==='stay'&&L.i===mine&&!platesHere().some(p=>!p._down)) state.rangeAllDown=true; return; } /* r.131: a table only exposes what it can score; TRAINING·DOWN says ALL DOWN */\n      q.up=true;q.lifePct=100;q.life=e.sec;q.fall=0;q._dead=0;q._eng=false;q.mist=false; R.phase='up';R.cur=q.id;R.q=q;R.t=0;")
s=rep("    const q=PLATES.find(p=>p.id===R.cur); if(!q){R.phase='gap';R.t=0;return;}\n    if(q.lifePct<=0){ q.fall=Math.min(1,(q.fall||0)+dt*2.4); if(q.fall>=1){ q.up=false; if(mode==='stay') q._down=true; R.phase='gap';R.t=0;R.k++; } return; }\n    q.life-=dt;\n    if(q.life<=0){ q.up=false; q.fall=1; R.phase='gap';R.t=0;R.k++; if(L.i===mine) rangeLapse(q); }",
      "    const q=(R.q&&R.q.id===R.cur)?R.q:PLATES.find(p=>p.id===R.cur); R.q=q; if(!q){R.phase='gap';R.t=0;return;}\n    if(q.lifePct<=0){ q.fall=Math.min(1,(q.fall||0)+dt*2.4); if(q.fall>=1){ q.up=false; if(mode==='stay') q._down=true; rangeRelease(q); R.phase='gap';R.t=0;R.k++; } return; }\n    q.life-=dt;\n    if(q.life<=0){ q.up=false; q.fall=1; R.phase='gap';R.t=0;R.k++; if(L.i===mine){ if(!q._eng){ rangeLapse(q); state.rangeMiss=(state.rangeMiss|0)+1; } } rangeRelease(q); }")
# a lapse is a canonical event; a table advance is a canonical event; the tally is per table too
s=rep("  if(state.rangeMode!=='qual40'||state.qualDone) return; const r=qualRecordShot(false,q.id); if(r&&r.accepted){ state.qualExpired=(state.qualExpired||0)+1;",
      "  if(state.rangeMode!=='qual40'||state.qualDone) return; const r=qualRecordShot(false,q.id); if(r&&r.accepted){ state.qualExpired=(state.qualExpired||0)+1; if(typeof ev==='function') ev('LAPSE',q.id,'UNFIRED MISS');")
s=rep("  const from=tb;\n  if(idx<QUAL_TABLES.length-1){\n    state.qualTbl=idx+1;\n    state.qualTblR=0;",
      "  const from=tb;\n  if(typeof ev==='function') ev('QUAL','T'+from.id,reason+' '+(state.qualH||0)+'/'+(state.qualR||0));\n  if(idx<QUAL_TABLES.length-1){\n    state.qualTbl=idx+1;\n    state.qualTblR=0; state.qualTblH=0;")
s=rep("  state.qualR=0; state.qualH=0; state.qualTbl=0; state.qualTblR=0;","  state.qualR=0; state.qualH=0; state.qualTbl=0; state.qualTblR=0; state.qualTblH=0;")
s=rep("  if(hit && used<cap){\n    state.qualH=(state.qualH||0)+1;","  if(hit && used<cap){\n    state.qualH=(state.qualH||0)+1; state.qualTblH=(state.qualTblH||0)+1;")
s=rep("  state.qualR=(state.qualR||0)+1;","  if((state.qualR||0)>=40){ state.qualDone=true; return {accepted:false,done:true,table:tb,badge:qualBadge(state.qualH||0)}; } /* r.131: never a 41st round */\n  state.qualR=(state.qualR||0)+1;")
s=rep("  {id:'I',pos:'PRONE SUP',lim:20,sec:120,cap:id=>2},\n  {id:'II',pos:'PRONE UNSUP',lim:10,sec:60,cap:id=>1},\n  {id:'III',pos:'KNEEL',lim:10,sec:60,cap:id=>{",
      "  /* r.131: each table clock covers its exposures (avg 5.2 s) + 1.5 s gaps with slack: 20×6.7+8, 10×6.7+8 (DECLARED — r.130's 120/60/60 could not fit their own exposures, lens 4A). */\n  {id:'I',pos:'PRONE SUP',lim:20,sec:142,cap:id=>2},\n  {id:'II',pos:'PRONE UNSUP',lim:10,sec:75,cap:id=>1},\n  {id:'III',pos:'KNEEL',lim:10,sec:75,cap:id=>{")
s=rep("    QUAL_TABLES[0].lim===20 && QUAL_TABLES[0].sec===120 &&\n    QUAL_TABLES[1].lim===10 && QUAL_TABLES[1].sec===60 &&\n    QUAL_TABLES[2].lim===10 && QUAL_TABLES[2].sec===60,\n    '20/120 · 10/60 · 10/60');",
      "    QUAL_TABLES[0].lim===20 && QUAL_TABLES[0].sec>=20*6.7 &&\n    QUAL_TABLES[1].lim===10 && QUAL_TABLES[1].sec>=10*6.7 &&\n    QUAL_TABLES[2].lim===10 && QUAL_TABLES[2].sec>=10*6.7,\n    '20/142 · 10/75 · 10/75 · each clock covers its exposures + gaps');")
# applyHit: a plate must be UP, not falling, the lane's current exposure; one round per exposure in QUAL·40; never resurrect
s=rep("  const ph=isPlate?plateHit(ref):null; state.lastBand=ph?ph.band:'';\n  const off=pipOff(ref);\n  const hit=!!state.simDirect || (ph?ph.hit:off<32);\n  if(hit){ref.lifePct=0;ref.fall=0.05;ref.mist=false;ref.up=true;}",
      "  if(isPlate){ const R=rangeRun(ref.lane||0); const live=!!ref.up&&(ref.fall||0)<0.25&&ref.lifePct>0&&R.cur===ref.id;\n    if(!live){ state.lastBand='DOWN'; toast('TARGET DOWN · WAIT FOR THE NEXT EXPOSURE'); netEvent('MISS',id,'MISS DOWN'); return {dead:false,direct:false,pts:0,result:'MISS'}; }\n    if(state.rangeMode==='qual40'&&ref._eng){ state.lastBand='SPENT'; toast('ONE ROUND PER EXPOSURE'); return {dead:false,direct:false,pts:0,result:'REFUSED'}; }\n    ref._eng=true; }\n  const ph=isPlate?plateHit(ref):null; state.lastBand=ph?ph.band:'';\n  const off=pipOff(ref);\n  const hit=!!state.simDirect || (ph?ph.hit:off<32);\n  if(hit){ref.lifePct=0;ref.fall=0.05;ref.mist=false; if(!isPlate) ref.up=true;}\n  if(isPlate){ if(hit) state.rangeHit=(state.rangeHit|0)+1; else state.rangeMiss=(state.rangeMiss|0)+1; }")
s=rep("  netEvent(hit?'HIT':'MISS',id,hit?'HIT':'MISS');","  netEvent(hit?'HIT':'MISS',id,hit?('HIT'+(state.lastBand?' '+state.lastBand:'')):'MISS'); /* r.131: the band is on the record */")
s=rep("  if(chNum()===0){\n    if(state.rangeMode==='qual40'){","  if(chNum()===0){\n    if(state.rangeMode==='qual40'&&isPlate){ /* r.131: only a silhouette is a qualification round — never the bull ring */")
s=rep("if(hit.dead){const sn=(state.desig&&state.desig.slot)||n||state.slot||1; state.hiApproved=false;state.hiLock=false;state.desig=null; if(state.tgtSlot) delete state.tgtSlot[sn];} else {state.desig.phase='red';state.hiApproved=true;}",
      "if(hit.dead){const sn=(state.desig&&state.desig.slot)||n||state.slot||1; state.hiApproved=false;state.hiLock=false;state.desig=null; if(state.tgtSlot) delete state.tgtSlot[sn];} else if(state.desig){state.desig.phase='red';state.hiApproved=false; /* r.131: red holds for THIS exposure; the CH5 second authority is per shot */}")
# the reducer applies HIT / MISS / LAPSE (r.130's HIT branch parsed a '%' nothing ever wrote)
s=rep("      const m=String(row.result||'').match(/(\\d+)%/);\n      if(m) o.lifePct=+m[1];\n      if((o.lifePct||0)<=0) o.up=false;",
      "      const res=String(row.result||''); const m=res.match(/(\\d+)%/);\n      if(m) o.lifePct=+m[1]; else if(/^HIT/.test(res)){ o.lifePct=0; if(!(o.fall>0)) o.fall=0.05; } /* r.131: a HIT row downs the target on every peer */\n      if((o.lifePct||0)<=0&&!o.form) o.up=false;")
s=ins_before("  if(row.verb==='SCORE'){","  if(row.verb==='LAPSE' && id){ const o=findTgt(id); if(o){ o.up=false; o.fall=1; } }\n")
# the angular pip floor (lens 3A/7B/8B): same standard at every zoom and screen size
s=rep("const PIP_FLOOR_PX=6;","const PIP_FLOOR_MRAD=3; /* r.131: the floor is an ANGLE (a 3 mrad dispersion cone, min 3 px), so the standard does not change with pinch zoom or screen size — DECLARED */\nfunction pipFloorPx(){ const H=view.height; const fov=38/Math.max(0.55,Math.min(3.2,state.zoom||1)); const f=(H*.52)/Math.tan(fov*Math.PI/180); return Math.max(3, f*PIP_FLOOR_MRAD/1000); }")
s=rep("  const cx=(a.x+b.x)/2, half=Math.max(PIP_FLOOR_PX,Math.abs(b.x-a.x)/2), bot=Math.max(a.y,b.y), top=Math.min(t.y,bot-2*PIP_FLOOR_PX);",
      "  const fl=pipFloorPx(); const cx=(a.x+b.x)/2, half=Math.max(fl,Math.abs(b.x-a.x)/2), bot=Math.max(a.y,b.y), top=Math.min(t.y,bot-2*fl);")
s=rep("  if(!(Math.abs(px-r.cx)<=r.half && py>=r.top-PIP_FLOOR_PX && py<=r.bot+PIP_FLOOR_PX)) return {hit:false,band:'MISS'};",
      "  const fl=pipFloorPx(); if(!(Math.abs(px-r.cx)<=r.half && py>=r.top-fl && py<=r.bot+fl)) return {hit:false,band:'MISS'};")
s=rep("const rpx=(c&&e)?Math.max(PIP_FLOOR_PX,Math.abs(e.x-c.x)):PIP_FLOOR_PX;","const rpx=(c&&e)?Math.max(fl,Math.abs(e.x-c.x)):fl;")
# seatLane: clear the box, pre-aim, restart the lane
s=rep("  if(u&&u.kind==='turret'){\n    u.x=L.x;u.y=L.y;u.z=0;u.yaw=0;u.pan=0;u.tilt=0;\n  }\n  toast(L.id+' · '+L.kind",
      "  if(u&&u.kind==='turret'){\n    u.x=L.x;u.y=L.y;u.z=0;u.yaw=0;u.pan=0;u.tilt=0;\n    state.desig=null; state.tgtSlot={}; state.hiApproved=false; rangeRunReset(state.lane); (typeof platesHere==='function'?platesHere():[]).forEach(q=>{q.up=false;q.fall=1;q.lifePct=100;q._eng=false;}); const q0=rangeFirstPlate(); if(q0) aimUnitAt(u,q0,-20,8); /* r.131: a new lane starts clean and pre-aimed */\n  }\n  toast(L.id+' · '+L.kind")
# RESET button (TRAINING · DOWN: stays down until RESET — there was no RESET)
s=rep('      <option value="qual40">QUAL · 40</option>\n    </select>','      <option value="qual40">QUAL · 40</option>\n    </select>\n    <button type="button" id="btnRangeReset" title="raise every target again">RESET</button>')
s=ins_before("const _rm=document.getElementById('rngMode');","const _rr=document.getElementById('btnRangeReset'); if(_rr)_rr.onclick=()=>{ resetRangePlates(); if(typeof goRange==='function') goRange(); toast('RANGE RESET'); };\n")

# ── C · the picture (lens 7A/7B/10A/10B) ───────────────────────────────────────────────────────────
s=rep("  liveMeshes().forEach(m=>segs(m.s,m.c));\n  if(S.seg-state.segs>80) drawSwarm(segs,S,cam,W,H);",
      "  if(chNum()!==0){ liveMeshes().forEach(m=>segs(m.s,m.c)); if(S.seg-state.segs>120) drawSwarm(segs,S,cam,W,H); } /* r.131: the range is a range — no lake craft, no swarm down the lanes */")
s=rep("  else WIRE.g.forEach(g=>{if(S.maj===1&&(g.n==='cvc'||g.n==='wings'))return;segs(g.s,S.maj===1&&g.n==='capitol'?T13.TAG:g.c);});",
      "  else { drawTargets(segs); WIRE.g.forEach(g=>{if(S.maj===1&&(g.n==='cvc'||g.n==='wingEW'||g.n==='wingNS'))return;segs(g.s,S.maj===1&&g.n==='capitol'?T13.TAG:g.c);}); } /* r.131: what you must hit gets the budget first on EVERY channel */")
s=rep("  doors.forEach(d=>{segs(box(d.x,d.y,d.z,2,3.2,.2),hot(d)?T13.LOCK:d.tagged?T13.TAG:T13.GIMBAL); if(!d.tagged) bullseye(d.x,d.y,d.z,segs);});\n  pops.forEach(p=>{if(p.up){segs(box(p.x,p.y+1.2,p.z,1.6,2.2,.12),(hot(p)||p.mist)?T13.LOCK:T13.SI); bullseye(p.x,p.y+1.2,p.z,segs);}});\n","")
s=ins_before("function drawPlates(segs){","function drawTargets(segs){\n  doors.forEach(d=>{segs(box(d.x,d.y,d.z,2,3.2,.2),hot(d)?T13.LOCK:d.tagged?T13.TAG:T13.GIMBAL); if(!d.tagged) bullseye(d.x,d.y,d.z,segs);});\n  pops.forEach(p=>{if(p.up){segs(box(p.x,p.y+1.2,p.z,1.6,2.2,.12),(hot(p)||p.mist)?T13.LOCK:T13.SI); bullseye(p.x,p.y+1.2,p.z,segs);}});\n}\n")
s=rep("  const cap=Math.min(SWARM.length*AIR.glyph, Math.floor(S.seg*0.55));","  const cap=Math.max(0,Math.min(SWARM.length*AIR.glyph, Math.floor(S.seg*0.55), (S.seg-state.segs)-120)); /* r.131: never more than the headroom left after what must be hit */")
s=rep("if(g.lane!=null&&S.maj===1&&Math.abs(g.lane-(state.lane||0))>1) return;","if(g.lane!=null&&S.maj<=2&&Math.abs(g.lane-(state.lane||0))>1) return;")
# the world box and the T-box follow worldOf; plates get one caption, not three labels
s=rep("    segs(box(o.x||0,o.y||1.2,o.z||0,3.4,3.8,3.4), red?T13.LOCK:T13.GIMBAL);",
      "    const ow=worldOf(o); const isP=!!o.form; segs(box(ow.x,isP?(ow.base||0):(o.y||1.2),ow.z,isP?Math.max(1.2,o.w*1.6):3.4,isP?o.h*1.3:3.8,isP?1.2:3.4), red?T13.LOCK:T13.GIMBAL);")
s=rep("      segs(ring(o.x||0,(o.y||1.2)+2.2,o.z||0,r,12), T13.LOCK);","      segs(ring(ow.x,(isP?(ow.base||0)+o.h:(o.y||1.2)+2.2),ow.z,r,12), T13.LOCK);")
s=rep("  const pts=[[o.x-1.4,(o.y||1.2)-0.2,o.z-1.4],[o.x+1.4,(o.y||1.2)-0.2,o.z-1.4],[o.x+1.4,(o.y||1.2)+2.4,o.z+1.4],[o.x-1.4,(o.y||1.2)+2.4,o.z+1.4]];",
      "  const ow=worldOf(o); const isP=!!(o.form&&o.id&&String(o.id).charAt(0)==='C'); const hw=isP?Math.max(0.6,o.w):1.4, y0w=isP?(ow.base||0)-0.1:(o.y||1.2)-0.2, y1w=isP?(ow.base||0)+o.h+0.2:(o.y||1.2)+2.4;\n  const pts=[[ow.x-hw,y0w,ow.z-hw],[ow.x+hw,y0w,ow.z-hw],[ow.x+hw,y1w,ow.z+hw],[ow.x-hw,y1w,ow.z+hw]];")
s=rep("  pr.forEach(p=>{x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);});\n  hc.strokeStyle=col; hc.lineWidth=2; hc.beginPath();\n  hc.rect(x0-4,y0-4,x1-x0+8,y1-y0+8); hc.stroke();",
      "  pr.forEach(p=>{x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);});\n  { const mw=Math.max(0,8-(x1-x0)/2), mh=Math.max(0,8-(y1-y0)/2); x0-=mw;x1+=mw;y0-=mh;y1+=mh; } /* r.131: one box, never smaller than 16 px */")
s=rep("  hc.fillText('T'+(slot||1)+(red?' RED':' AMBER')+' '+life+'%',x0-2,y0-8);","  if(!isP) hc.fillText('T'+(slot||1)+(red?' RED':' AMBER')+' '+life+'%',x0-2,y0-8); /* r.131: a plate's caption lives with its bracket */")
s=rep("    const o=sl.ref; if(o.up===false)return;\n    const pr=proj([o.x,(o.y||1.2)+2.6,o.z],cam,W,H); if(!pr)return;",
      "    const o=sl.ref; if(o.up===false||o.form)return; /* r.131: plates carry one caption, not a third label */\n    const pr=proj([o.x,(o.y||1.2)+2.6,o.z],cam,W,H); if(!pr)return;")
s=rep("""  if(chNum()===0&&typeof platesHere==='function'){ platesHere().forEach(q=>{ if(!q.up||(q.fall||0)>0.25) return; const r=plateRect(q); if(!r) return;
    const hw=Math.max(r.half,8), t=Math.min(r.top,r.bot-16); hc.strokeStyle=hot(q)?T13.LOCK:T13.SI; hc.lineWidth=1;
    hc.beginPath(); hc.moveTo(r.cx-hw-4,t+6); hc.lineTo(r.cx-hw-4,t-4); hc.lineTo(r.cx-hw+6,t-4);
    hc.moveTo(r.cx+hw+4,r.bot-6); hc.lineTo(r.cx+hw+4,r.bot+4); hc.lineTo(r.cx+hw-6,r.bot+4); hc.stroke();
    hc.fillStyle=T13.SI; hc.font='10px ui-monospace,monospace'; hc.textAlign='left'; hc.fillText(q.base+' '+Math.max(0,Math.ceil(q.life))+'s',r.cx+hw+8,t+4); }); }
""","""  if(chNum()===0&&typeof platesHere==='function'){ platesHere().forEach(q=>{ if(!q.up||(q.fall||0)>0.25) return; const r=plateRect(q); if(!r) return;
    const hw=Math.max(r.half,8), t=Math.min(r.top,r.bot-16); const isHot=hot(q); const slK=Object.keys(state.tgtSlot||{}).find(k=>state.tgtSlot[k]&&state.tgtSlot[k].id===q.id);
    if(!isHot){ hc.strokeStyle=T13.SI; hc.lineWidth=1; hc.beginPath(); hc.moveTo(r.cx-hw-4,t+6); hc.lineTo(r.cx-hw-4,t-4); hc.lineTo(r.cx-hw+6,t-4); hc.moveTo(r.cx+hw+4,r.bot-6); hc.lineTo(r.cx+hw+4,r.bot+4); hc.lineTo(r.cx+hw-6,r.bot+4); hc.stroke(); }
    const ph=isHot?(state.desig&&state.desig.phase==='red'?'RED':'AMBER'):''; const cap=(slK?'T'+slK+' · ':'')+(q.pos||q.base)+' · '+Math.max(0,Math.ceil(q.life))+'s'+(ph?' · '+ph:'');
    hc.font='11px ui-monospace,monospace'; hc.textAlign='left'; hc.fillStyle=ph==='RED'?T13.LOCK:ph==='AMBER'?T13.GIMBAL:T13.SI;
    const cw=hc.measureText(cap).width; const cx=Math.min(W-cw-6,Math.max(6,r.cx+hw+10)), cy=Math.max(14,Math.min(H-44,t-8)); hc.fillText(cap,cx,cy); }); hc.font='12px ui-monospace,monospace'; } /* r.131: ONE caption per exposed plate — slot · range · seconds · phase — clamped to the canvas */
""")
s=rep("  if(lk){hc.textAlign='left';hc.fillStyle=T13.LOCK;hc.fillText('LOCK',12,H-36);hc.fillStyle=T13.GIMBAL;hc.fillText(lk.id+' '+lk.dist.toFixed(0)+'M',12,H-20);}",
      "  if(lk){hc.font='12px ui-monospace,monospace';hc.textAlign='left';hc.fillStyle=T13.LOCK;hc.fillText('LOCK',60,H-36);hc.fillStyle=T13.GIMBAL;hc.fillText(lk.id+' '+lk.dist.toFixed(0)+'M',60,H-20);} /* r.131: clear of the kebab button */")
s=rep("    } else ps.textContent=(chNum()===0?(RANGE_MODE_NAME[state.rangeMode||'bounce']+' · PIP FLOOR '+PIP_FLOOR_PX+' PX · '):'')+'BLU '+(state.blu|0)+' · RED '+(state.red|0);",
      "    } else ps.textContent=chNum()===0?(RANGE_MODE_NAME[state.rangeMode||'bounce']+' · HIT '+(state.rangeHit|0)+' · MISS '+(state.rangeMiss|0)+(state.rangeAllDown?' · ALL DOWN · RESET':'')):('BLU '+(state.blu|0)+' · RED '+(state.red|0));")
s=rep("      ps.textContent=state.qualDone?('QUAL '+(state.qualH||0)+'/40 '+qualBadge(state.qualH||0)):('T'+tb.id+' '+(state.qualH||0)+'/'+(state.qualR||0)+' · '+rem+'s');",
      "      ps.textContent=state.qualDone?('QUAL '+(state.qualH||0)+'/40 '+qualBadge(state.qualH||0)):('T'+tb.id+' '+(state.qualTblH||0)+'/'+(state.qualTblR||0)+' of '+tb.lim+' · '+rem+'s · TOTAL '+(state.qualH||0)+'/'+(state.qualR||0)+(state.qualExpired?' · LAPSED '+state.qualExpired:''));")

# ── D · evidence honesty (lens 5B/8A) ─────────────────────────────────────────────────────────────
s=rep("    outcomes:state.outcomes||[], qa:state.qa||null,",
      "    qual:{mode:state.rangeMode,R:state.qualR|0,H:state.qualH|0,tbl:state.qualTbl|0,expired:state.qualExpired|0,done:!!state.qualDone,badge:(state.qualR|0)>=40?qualBadge(state.qualH|0):'',lane:state.lane|0,rangeHit:state.rangeHit|0,rangeMiss:state.rangeMiss|0},\n    outcomes:state.outcomes||[], qa:state.qa||null,")
s=rep("n=n||6; opt=opt||{}; const sim=opt.sim!==false;","n=n||6; opt=opt||{}; const sim=true; /* r.131: every trial forces simDirect, so the label says SIM whatever the caller asked (r.102's lesson) */")
s=rep("    state.simDirect=true;\n    state.challenge=ch; state.desig=null; state.hiApproved=false;","    state.simDirect=true; state.linkMute=true; /* r.131: batch shots never leave this device */\n    state.challenge=ch; state.desig=null; state.hiApproved=false;")
s=rep("  function restore(s){state.events=s.events;","  function restore(s){state.linkMute=false;state.simDirect=false;state.events=s.events;")
s=rep("function linkSend(obj){\n  try{ if(ch) ch.postMessage(obj); }catch(_){}","function linkSend(obj){\n  if(state.linkMute) return; /* r.131: QA and batch runs are local */\n  try{ if(ch) ch.postMessage(obj); }catch(_){}")
s=rep("function toolSelfTest(){","function toolSelfTest(){\n  const evSave={events:(state.events||[]).slice(),replay:(state.replay||[]).slice(),decisions:(state.decisions||[]).slice(),evSeq:state.evSeq||0,decN:state.decN||0,score:state.score|0,hits:state.hits|0,blu:state.blu|0,red:state.red|0,rangeHit:state.rangeHit|0,rangeMiss:state.rangeMiss|0}; state.linkMute=true; /* r.131: QA never enters the canonical record, the room, or the player's first screen */")
s=rep("  const pass=rows.filter(x=>x.ok).length;",
      "  state.events=evSave.events; state.replay=evSave.replay; state.decisions=evSave.decisions; state.evSeq=evSave.evSeq; state.decN=evSave.decN; state.score=evSave.score; state.hits=evSave.hits; state.blu=evSave.blu; state.red=evSave.red; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.rangeHit=evSave.rangeHit; state.rangeMiss=evSave.rangeMiss; state.linkMute=false; if(rings[0]) rings[0].up=false;\n  push('QA_LEAVES_NO_TRACE', (state.events||[]).length===evSave.events.length && !state.desig && !Object.keys(state.tgtSlot||{}).length, 'events '+(state.events||[]).length+' as before · no designation left on the first screen');\n  const pass=rows.filter(x=>x.ok).length;")
s=rep("  setTimeout(()=>{ const ok=(state.drawDone||0)>0&&!state.drawErr; rows.push(","  setTimeout(()=>{ if(state.outcomes!==rows) return; const ok=(state.drawDone||0)>0&&!state.drawErr; rows.push(")
s=rep("const n=document.getElementById('qaOps'); if(n) n.textContent=state.qa.pass+'/'+rows.length; },1500);",
      "const n=document.getElementById('qaOps'); if(n) n.textContent=state.qa.pass+'/'+rows.length; state.qa.t=Date.now(); const qo=document.getElementById('qaOut'); if(qo) qo.textContent+=(ok?'OK ':'NO ')+'DRAW_COMPLETES '+rows[rows.length-1].note+'\\n'; },1500);")
s=rep("try{toolSelfTest();}catch(e){ console&&console.warn&&console.warn(e); }",
      "try{toolSelfTest();}catch(e){ state.qa={pass:0,total:1,rev:BUILD.revision,t:Date.now(),known:KNOWN,threw:String(e)}; state.outcomes=[{id:'QA_THREW',ok:false,note:String(e).slice(0,140)}]; const qn=document.getElementById('qaOps'); if(qn) qn.textContent='QA THREW'; state.linkMute=false; console&&console.warn&&console.warn(e); } /* r.131: a QA that throws is a red row, never a blank panel */")

# ── E · the approve record tells the truth; spiral cannot clobber a live box ───────────────────────
s=rep("  state.desig.how=(actor==='HI-2'||actor===SID)?'HI-2':'PEER';","  state.desig.how=byPeer?'PEER':'HI-2'; /* r.131: PEER only when another seated human marked it */")
s=rep("  const sameDevice=actor==='HI-2'||actor===SID;","  const sameDevice=!byPeer;")
s=rep("samePerson:actor===state.desig.by,sameDevice,","samePerson:!byPeer,sameDevice,")
s=rep("function spiralTest(){\n  state.spiral++;","function spiralTest(){\n  if(state.lobby&&state.lobby.phase==='LIVE'){toast('SPIRAL · NOT IN A LIVE ROOM');return;} if(state.desig){toast('SPIRAL · CLEAR THE BOX FIRST');return;} /* r.131 */\n  state.spiral++;")

# ── F · QA rows: picture-terms, per-plate, one round per exposure, release on lapse ───────────────
s=rep("    function aimPlate(q,offPx){ const w=qWorld(q); const c0=camOf(u0); const dx=w.x-c0.x,dy=(w.y||1.2)-c0.y,dz=w.z-c0.z; const d=Math.hypot(dx,dy,dz);\n      u0.pan=(yawTo(dx,dz)-u0.yaw)*180/Math.PI; u0.tilt=Math.asin(dy/d)*180/Math.PI;",
      "    function aimPlate(q,offPx){ aimUnitAt(u0,q,-40,40); /* r.131: centre of mass, from the eye */")
s=rep("    state.rangeMode='bounce'; rangeReset(); const qb=rangeExpose(0,'C-50'); qb.lifePct=0; qb.fall=0.05; for(let i=0;i<120;i++) rangeTick(0.05);\n    push('MODE_RESET_RETURNS', platesHere().some(q=>q.up) && !qb._down, 'TRAINING · RESET: after a hit the lane keeps exposing · up='+platesHere().filter(q=>q.up).map(q=>q.base).join(','));",
      "    state.rangeMode='bounce'; rangeReset(); const qb=rangeExpose(0,'C-50'); qb.lifePct=0; qb.fall=0.05; let back=-1; for(let i=0;i<2400;i++){ rangeTick(0.05); if(i>20&&qb.up&&qb.lifePct>0){ back=i; break; } }\n    push('MODE_RESET_RETURNS', back>0 && !qb._down, 'TRAINING · RESET: the HIT plate itself came back up after '+(back*0.05).toFixed(1)+' s');")
s=rep("    push('MODE_QUAL_TIMED', started && state.qualR===r0+1 && (state.qualExpired||0)>=1 && state.qualTblR===1, ",
      "    push('MODE_QUAL_TIMED', started && state.qualR===r0+1 && (state.qualExpired||0)>=1 && state.qualTblR===1 && (state.qualH||0)===0 && (state.events||[]).some(e=>e.verb==='LAPSE'), ")
s=rep("    state.rangeMode=sv2.mode; rangeReset(); qualResetTower(); state.zoom=sv2.zoom;",
      r"""    /* r.131 — the rows the fleet said were missing */
    { u0.pan=0; u0.tilt=0; const c=camOf(u0); const p3=proj((w=>[w.x,w.y,w.z])(worldOf(platesHere().find(q=>q.base==='C-300'))),c,W,H), p2=proj((w=>[w.x,w.y,w.z])(worldOf(platesHere().find(q=>q.base==='C-250'))),c,W,H);
      push('PIT_SEES_300_RIGHT_250_LEFT', !!p3&&!!p2&&p3.x>W/2&&p2.x<W/2, 'the picture is not mirrored: 300 M right, 250 M left'); }
    { const svp=u0.pan; state.unit='T01'; state.challenge=0; state.viewMode='op'; state.relinq=false; u0.pan=0; u0.tilt=0; const c=camOf(u0); const P=[c.x+c.fx*60,c.y,c.z+c.fz*60]; const x0=proj(P,c,W,H).x; state.joy={lx:0,ly:0,rx:1,ry:0}; for(let i=0;i<10;i++) phys(0.05); state.joy={lx:0,ly:0,rx:0,ry:0}; const x1=proj(P,camOf(u0),W,H).x; u0.pan=svp;
      push('PAN_RIGHT_MOVES_WORLD_LEFT', x1<x0-5, 'R-stick right: a fixed point slid '+(x0-x1).toFixed(0)+' px left on screen'); }
    { const u=units.D1Q; const sv={x:u.x,y:u.y,z:u.z,yaw:u.yaw,pan:u.pan,tilt:u.tilt,vx:u.vx,vz:u.vz,vy:u.vy}; u.x=20;u.z=70;u.y=30;u.yaw=Math.PI/2;u.pan=0;u.tilt=0;u.vx=0;u.vz=0;u.vy=0; state.unit='D1Q'; state.challenge=1; state.relinq=false;
      const c=camOf(u); const P=[c.x+c.fx*60,c.y,c.z+c.fz*60]; const d0=Math.hypot(P[0]-u.x,P[2]-u.z); state.joy={lx:0,ly:-1,rx:0,ry:0}; for(let i=0;i<14;i++) phys(0.05); state.joy={lx:0,ly:0,rx:0,ry:0}; const d1=Math.hypot(P[0]-u.x,P[2]-u.z); const dx=u.x-20; Object.assign(u,sv);
      push('FWD_AT_YAW90', d1<d0-2 && dx<-0.25, 'yaw 90°: the body closed on the point on screen ('+d0.toFixed(1)+' → '+d1.toFixed(1)+' m) and moved −x ('+dx.toFixed(2)+')'); }
    state.unit='T01'; state.challenge=0; state.lane=0; state.rangeMode='bounce'; goRange(); state.zoom=1; if(state.lobby) state.lobby.phase='WAITING';
    { rangeReset(); const q=rangeExpose(0,'C-100C'); u0.pan=0; u0.tilt=0; state.tgtSlot={}; state.desig=null; const t1=targetN(1); approveDesig('HI-2'); fireN(1);
      push('TARGETN_HITS_THE_EXPOSED_PLATE', !!t1&&t1.id===q.id&&!!(state.lastShot&&state.lastShot.dead), 'key 1 aims from the eye and the shot lands · '+(t1?t1.id:'none')+' · band='+state.lastBand); }
    { rangeReset(); const q=rangeExpose(0,'C-150L'); aimPlate(q,0); state.tgtSlot={}; state.desig=null; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const red0=!!(state.desig&&state.desig.phase==='red'); for(let i=0;i<(EXPOSURE_S[150]+0.3)*20;i++) rangeTick(0.05);
      const cleared=!state.desig&&!Object.keys(state.tgtSlot||{}).length; const dN=(state.decisions||[]).length; fireN(1); const refused=(state.decisions||[]).slice(dN).some(d=>d.reason==='NO_RED_BOX')&&q.lifePct===100&&q.up===false;
      push('LAPSE_RELEASES_THE_BOX', red0&&cleared&&refused, 'the red box went down with its target; a late FIRE is refused and never resurrects it'); }
    { state.rangeMode='qual40'; rangeReset(); qualResetTower(); const q=rangeExpose(0,'C-50'); aimPlate(q,80); state.tgtSlot={}; state.desig=null; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); fireN(1); const r1=state.qualR|0, b1=state.lastBand; fireN(1); const r2=state.qualR|0, b2=state.lastBand; for(let i=0;i<(EXPOSURE_S[50]+0.3)*20;i++) rangeTick(0.05); const r3=state.qualR|0;
      push('ONE_ROUND_PER_EXPOSURE', r1===1&&b1==='MISS'&&r2===1&&b2==='SPENT'&&r3===1&&(state.qualH|0)===0, 'a miss costs one round · a second pull is SPENT · the lapse charges nothing more · rounds='+r3); state.rangeMode='bounce'; qualResetTower(); }
    { rangeReset(); const q=rangeExpose(0,'C-200R'); const ev0=(state.events||[]).length; applyWorld({verb:'HIT',id:q.id,result:'HIT CIRCLE',seq:0}); const downed=q.lifePct===0; applyWorld({verb:'LAPSE',id:q.id,result:'UNFIRED MISS',seq:0}); const dropped=q.up===false&&q.fall===1;
      push('REDUCER_HIT_AND_LAPSE_DOWN_THE_PLATE', downed&&dropped, 'a HIT row downs the plate on any peer; a LAPSE row drops it'); }
    { state.rangeMode='qual40'; rangeResetTowerQA=null; rangeReset(); qualResetTower(); state.qualTbl=2; rangeRunReset(); let far=0, raised=0; for(let i=0;i<4000&&raised<10;i++){ rangeTick(0.05); const R=rangeRun(0); if(R.phase==='up'&&R.q&&R.q._exp!==raised+1000){ } }
      const seen=[]; rangeReset(); qualResetTower(); state.qualTbl=2; for(let i=0;i<6000&&seen.length<10;i++){ rangeTick(0.05); const R=rangeRun(0); if(R.phase==='up'&&R.q&&seen[seen.length-1]!==R.q.id) seen.push(R.q.id); }
      push('TABLE_III_EXPOSES_ONLY_SCORABLE', seen.length>=6 && seen.every(id=>QUAL_TABLES[2].cap(id)>0), 'kneeling table exposes 50/100/150 only · '+seen.map(plateBase).join(' ')); state.rangeMode='bounce'; qualResetTower(); }
    state.rangeMode=sv2.mode; rangeReset(); qualResetTower(); state.zoom=sv2.zoom;""")
# (the throwaway line above is kept syntactically harmless: declare it)
s=rep("    { state.rangeMode='qual40'; rangeResetTowerQA=null; rangeReset(); qualResetTower(); state.qualTbl=2; rangeRunReset(); let far=0, raised=0; for(let i=0;i<4000&&raised<10;i++){ rangeTick(0.05); const R=rangeRun(0); if(R.phase==='up'&&R.q&&R.q._exp!==raised+1000){ } }\n      const seen=[];",
      "    { state.rangeMode='qual40';\n      const seen=[];")


# ── the last two captures: FPS off the HUD line; on the range LOCK is a plate or nothing ──────────
s=rep("hc.textAlign='right';hc.fillStyle=T13.ROAD;hc.fillText((state.fps|0)+' FPS',W-12,18);","hc.textAlign='right';hc.fillStyle=T13.ROAD;hc.fillText((state.fps|0)+' FPS',W-12,H-36); /* r.131: off the HUD line it was overprinting */")
s=rep("if(pb) return pb; }\n  rings.forEach(p=>{if(p.up===false)return;","if(pb) return pb; return null; } /* r.131: from the pit, LOCK is an exposed silhouette or nothing — never a door 46 m away */\n  rings.forEach(p=>{if(p.up===false)return;")
s=ins_before("function lockOn(){","function noLockMsg(){ if(+state.challenge===0&&typeof rangeRun==='function'){ const R=rangeRun(state.lane||0); const left=R.phase==='gap'?Math.max(0,EXPOSURE_GAP_S-(R.t||0)):0; return state.rangeAllDown?'ALL DOWN · RESET':('NO TARGET UP · NEXT IN '+left.toFixed(1)+' S'); } return 'NO LOCK'; }\n")
cnt=s.count("toast('NO LOCK')"); s=rep("toast('NO LOCK')","toast(noLockMsg())",cnt)


s=rep('inside the aiming circle records CIRCLE. PIP_FLOOR_PX keeps a 300 m','inside the aiming circle records CIRCLE. The angular pip floor (pipFloorPx) keeps a 300 m')

# ── revision stamps ────────────────────────────────────────────────────────────────────────────────
c=s.count("revision:'0.130'"); s=rep("revision:'0.130'","revision:'0.131'",c)
h=s.count("r0.130"); s=rep("r0.130","r0.131",h)
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest()[:16],'rev',c,'hdr',h)

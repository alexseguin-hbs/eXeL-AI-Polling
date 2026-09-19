import re, sys, hashlib
SRC='/home/user/eXeL-AI-Polling/docs/drone-2525/operator-deck/drone-2525_r.129.html'
DST='/home/user/eXeL-AI-Polling/docs/drone-2525/operator-deck/drone-2525_r.130.html'
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:70]!r}, found {c}')
    n[0]+=1
    return s.replace(old,new)
def ins_before(anchor,text):
    return rep(anchor,text+anchor)

# ── R130-1 one forward basis ───────────────────────────────────────────────────────────────────
s=ins_before("function camOf(u){",
"""/* r.130 ONE FORWARD BASIS (operator 2026-09-19, "range with turrets actually works"): forward is what proj() puts at
   screen centre — proj rotates by rz=-sy*dx+cy*dz, so forward=(-sin yaw, cos yaw), right=(cos yaw, sin yaw).
   camOf, lockOn, phys, every aim (yawTo) and the QA read THIS; nothing else derives a forward. Before r.130 camOf
   said forward=(sin yaw,-cos yaw) — the exact opposite — so the range pit looked away from its plates, LOCK named
   objects behind the picture, and left-stick forward flew QUAD/VTOL away from what was on screen. */
function fwdOf(yaw,tilt){const ct=Math.cos(tilt||0);return {fx:-Math.sin(yaw)*ct,fy:Math.sin(tilt||0),fz:Math.cos(yaw)*ct};}
function rightOf(yaw){return {rx:Math.cos(yaw),rz:Math.sin(yaw)};}
function yawTo(dx,dz){return Math.atan2(-dx,dz);}
""")
s=rep("  return {x,y:ey,z,yaw,tilt,fx:Math.sin(yaw)*Math.cos(tilt),fy:Math.sin(tilt),fz:-Math.cos(yaw)*Math.cos(tilt)};",
      "  const f=fwdOf(yaw,tilt); return {x,y:ey,z,yaw,tilt,fx:f.fx,fy:f.fy,fz:f.fz};")
s=rep("    const fy=cam.fy; const fx=Math.sin(u.yaw), fz=-Math.cos(u.yaw);\n    const rx=Math.cos(u.yaw), rz=Math.sin(u.yaw);",
      "    const fy=cam.fy; const fb=fwdOf(u.yaw,0), fx=fb.fx, fz=fb.fz;\n    const rb=rightOf(u.yaw), rx=rb.rx, rz=rb.rz;")
s=rep("    const fx=Math.sin(byaw),fz=-Math.cos(byaw);","    const fb=fwdOf(byaw,0),fx=fb.fx,fz=fb.fz;")
s=rep("Math.atan2(dx,-dz)","yawTo(dx,dz)",5)

# ── R130-2 the pit faces the plates ────────────────────────────────────────────────────────────
s=rep("u.yaw=Math.PI;","u.yaw=0;",4)
s=rep("units.T1.yaw=Math.PI;","units.T1.yaw=0;")
s=rep("Math.abs(p0u.yaw-Math.PI)<1e-6","Math.abs(p0u.yaw)<1e-6")
s=rep("    /* CH0 invariant: selected turret stays on its own pit and looks +Z downrange. */",
      "    /* CH0 invariant: selected turret stays on its own pit and looks +Z downrange (yaw 0 under the one forward basis). */")
s=rep("  state.challenge=0;\n  state.viewMode='map';\n  state.lane=(state.lane==null?20:state.lane);\n  state.zoom=Math.min(state.zoom||1,0.55);",
      "  state.challenge=0;\n  state.viewMode='op';\n  state.lane=(state.lane==null?20:state.lane);\n  state.zoom=Math.max(state.zoom||1,1);")
s=rep("  const q=QUAL[0];\n  if(u&&q){","  const q=rangeFirstPlate();\n  if(u&&q){")
s=rep("    (PLATES||QUAL).forEach(x=>{x.up=true;x.lifePct=100;x.fall=0;x._dead=0;});\n    state.qualI=0;","    rangeReset();")
s=rep("  toast('50M RANGE · '+L.id+' '+L.kind);","  toast('RANGE · '+L.id+' '+L.kind+' · '+RANGE_MODE_NAME[state.rangeMode||'bounce']);")

# ── R130-5 the sheet's layout ──────────────────────────────────────────────────────────────────
s=rep("  {id:'C-250B',pos:'250M E',x:6.4,y:0,z:250,w:0.42,h:0.92,form:'E'},\n  {id:'C-300',pos:'300M E',x:0,y:0,z:300,w:0.34,h:0.78,form:'E'}",
      "  {id:'C-100C',pos:'100M F',x:0,y:0,z:100,w:1.35,h:0.82,form:'F'},\n  {id:'C-300',pos:'300M E',x:6.4,y:0,z:300,w:0.34,h:0.78,form:'E'}")
s=rep("    if(/^C-50$/.test(b)||/^C-100[LR]$/.test(b)) return 2;","    if(/^C-50$/.test(b)||/^C-100[LCR]$/.test(b)) return 2;")

# ── R130-3/7 pop-ups per lane + three modes (the range engine) ─────────────────────────────────
s=rep("""function qualResetPlatesForTable(){
   (typeof platesHere==='function'?platesHere():QUAL).forEach(q=>{q.up=true;q.lifePct=100;q.life=99;q.fall=0;q._dead=0;q.mist=false;});
}""","""function qualResetPlatesForTable(){
  /* r.130: a new table starts with every plate DOWN; the lane's exposure sequence raises them one at a time. */
  (typeof platesHere==='function'?platesHere():QUAL).forEach(q=>{q.up=false;q.lifePct=100;q.life=0;q.fall=1;q._dead=0;q._down=false;q.mist=false;});
  if(typeof rangeRunReset==='function') rangeRunReset(state.lane||0);
}
/* r.130 POP-UPS PER LANE (operator 2026-09-19): "each lane has pop ups at various distances". A target is UP only while
   its exposure runs. Exposure by distance per FM 3-22.9 record fire (docs/drone-2525/RANGE_QUALIFICATION_RESEARCH.md):
   3 s at 50 m, +1 s per 50 m, 8 s at 300 m. Each lane runs its own seeded order, so lane L01 and L02 raise
   different plates at the same moment. Three modes on state.rangeMode, the operator's names:
     bounce = TRAINING · RESET  — a target that goes down comes back up on its next exposure
     stay   = TRAINING · DOWN   — a target that goes down stays down until RESET
     qual40 = QUAL · 40         — the timed test: tables I/II/III = 20/10/10 exposures, a lapsed exposure is an UNFIRED MISS */
const EXPOSURE_S={50:3,100:4,150:5,200:6,250:7,300:8};
const EXPOSURE_GAP_S=1.5;
const PIP_FLOOR_PX=6;
const RANGE_MODE_NAME={bounce:'TRAINING · RESET',stay:'TRAINING · DOWN',qual40:'QUAL · 40'};
const RANGE_RUN={};
function exposureOrder(lane){ const r=mulberry32(2525+(lane|0)); const idx=QUAL.map((_,i)=>i); for(let i=idx.length-1;i>0;i--){const j=Math.floor(r()*(i+1)); const t=idx[i]; idx[i]=idx[j]; idx[j]=t;} return idx; }
function exposureAt(lane,k){ const ord=exposureOrder(lane); const q=QUAL[ord[((k|0)%ord.length+ord.length)%ord.length]]; return {base:q.id,z:q.z,sec:EXPOSURE_S[q.z]||5}; }
function rangeRun(lane){ return RANGE_RUN[lane]||(RANGE_RUN[lane]={k:0,phase:'gap',t:0,cur:null}); }
function rangeRunReset(lane){ if(lane==null){ Object.keys(RANGE_RUN).forEach(k=>delete RANGE_RUN[k]); } else delete RANGE_RUN[lane]; }
function rangeReset(){ (PLATES||QUAL).forEach(q=>{q.up=false;q.lifePct=100;q.life=0;q.fall=1;q._dead=0;q._down=false;q.mist=false;}); rangeRunReset(); state.lastBand=''; }
function rangeFirstPlate(){ const lane=state.lane||0; const e=exposureAt(lane,0); return (PLATES||[]).find(p=>p.lane===lane&&p.base===e.base)||QUAL.find(q=>q.id===e.base)||QUAL[0]; }
function rangeExpose(lane,base){ /* raise one named plate now (QA + pre-aim); the lane's run resumes from it */
  const q=(PLATES||[]).find(p=>p.lane===lane&&p.base===base); if(!q) return null; const R=rangeRun(lane);
  q.up=true;q.lifePct=100;q.life=EXPOSURE_S[q.z]||5;q.fall=0;q._dead=0;q.mist=false; R.phase='up';R.cur=q.id;R.t=0; return q; }
function rangeLapse(q){ /* an exposure ended with the target still standing: in QUAL · 40 that is an unfired MISS round */
  if(state.rangeMode!=='qual40'||state.qualDone) return; const r=qualRecordShot(false,q.id); if(r&&r.accepted){ state.qualExpired=(state.qualExpired||0)+1;
    toast('LAPSED · '+plateBase(q.id)+' · UNFIRED MISS · '+r.hits+'/'+r.round+(r.advance&&!r.advance.done?' → T'+r.advance.to.id+' READY':'')+(r.done?' '+qualBadge(r.hits):'')); } }
function rangeTick(dt){
  const mode=state.rangeMode||'bounce'; const mine=state.lane||0;
  LANES.forEach(L=>{
    const R=rangeRun(L.i); R.t+=dt;
    if(R.phase==='gap'){
      if(R.t<EXPOSURE_GAP_S) return;
      if(mode==='qual40'&&L.i===mine&&state.qualDone) return;
      const e=exposureAt(L.i,R.k); const q=PLATES.find(p=>p.lane===L.i&&p.base===e.base);
      if(!q||(mode==='stay'&&q._down)){ R.k++; R.t=EXPOSURE_GAP_S; return; }
      q.up=true;q.lifePct=100;q.life=e.sec;q.fall=0;q._dead=0;q.mist=false; R.phase='up';R.cur=q.id;R.t=0;
      if(mode==='qual40'&&L.i===mine) qualStartCurrent();
      return;
    }
    const q=PLATES.find(p=>p.id===R.cur); if(!q){R.phase='gap';R.t=0;return;}
    if(q.lifePct<=0){ q.fall=Math.min(1,(q.fall||0)+dt*2.4); if(q.fall>=1){ q.up=false; if(mode==='stay') q._down=true; R.phase='gap';R.t=0;R.k++; } return; }
    q.life-=dt;
    if(q.life<=0){ q.up=false; q.fall=1; R.phase='gap';R.t=0;R.k++; if(L.i===mine) rangeLapse(q); }
  });
}
/* r.130 SCALE-TRUE HIT: a silhouette is hit when the pip sits inside its projected outline (the sheet: "scored as hits
   if they hit anywhere in the silhouette"); inside the aiming circle records CIRCLE. PIP_FLOOR_PX keeps a 300 m
   plate hittable on a phone and is shown on the HUD. */
function plateRect(q){
  const w=qWorld(q),cam=camOf(units[state.unit]),W=view.width,H=view.height,k=Math.max(0.06,1-(q.fall||0));
  const a=proj([w.x-q.w/2,w.y,w.z],cam,W,H),b=proj([w.x+q.w/2,w.y,w.z],cam,W,H),t=proj([w.x,w.y+q.h*k,w.z],cam,W,H);
  if(!a||!b||!t) return null;
  const cx=(a.x+b.x)/2, half=Math.max(PIP_FLOOR_PX,Math.abs(b.x-a.x)/2), bot=Math.max(a.y,b.y), top=Math.min(t.y,bot-2*PIP_FLOOR_PX);
  return {cx,half,top,bot};
}
function plateHit(q){
  const r=plateRect(q); if(!r) return {hit:false,band:'CULLED'};
  const px=view.width/2, py=view.height*0.46;
  if(!(Math.abs(px-r.cx)<=r.half && py>=r.top-PIP_FLOOR_PX && py<=r.bot+PIP_FLOOR_PX)) return {hit:false,band:'MISS'};
  const w=qWorld(q),cam=camOf(units[state.unit]),W=view.width,H=view.height;
  const cy=q.form==='F'?w.y+q.h*0.42:w.y+q.h*0.78*0.55, cr=q.form==='F'?Math.min(0.22,q.w*0.12):Math.min(0.16,q.w*0.22);
  const c=proj([w.x,cy,w.z],cam,W,H), e=proj([w.x+cr,cy,w.z],cam,W,H); const rpx=(c&&e)?Math.max(PIP_FLOOR_PX,Math.abs(e.x-c.x)):PIP_FLOOR_PX;
  return {hit:true,band:(c&&Math.hypot(px-c.x,py-c.y)<=rpx)?'CIRCLE':'SILHOUETTE'};
}""")
s=rep("""  if(+state.challenge===0){
    (PLATES||QUAL).forEach(q=>{
      if(q.lifePct<=0){
        q.fall=Math.min(1,(q.fall||0)+dt*2.4); q.up=true;
        const mode=state.rangeMode||'bounce';
        if(mode==='bounce'){ q._dead=(q._dead||0)+dt; if(q._dead>2.4){q.up=true;q.lifePct=100;q.life=99;q.fall=0;q._dead=0;} }
      }
      else { q.up=true; }
    });
  }""","  if(+state.challenge===0) rangeTick(dt);")

# ── R130-4 applyHit is plate-aware ─────────────────────────────────────────────────────────────
s=rep("  const off=pipOff(ref);\n  const hit=!!state.simDirect || off<32;",
      "  const isPlate=!!(ref&&ref.id&&String(ref.id).charAt(0)==='C'&&ref.form&&typeof plateHit==='function');\n  const ph=isPlate?plateHit(ref):null; state.lastBand=ph?ph.band:'';\n  const off=pipOff(ref);\n  const hit=!!state.simDirect || (ph?ph.hit:off<32);")
s=rep("  } else toast(hit?'HIT':'MISS');","  } else toast((hit?'HIT':'MISS')+(state.lastBand?' · '+state.lastBand:''));",2)

# ── lockOn: on the range an exposed plate wins; a turret never locks a buoy ────────────────────
s=rep("  let b=null,bd=1e9;\n  rings.forEach(p=>{if(p.up===false)return;",
      "  let b=null,bd=1e9;\n  /* r.130: on the range an EXPOSED silhouette in the cone is the lock, before the bull ring or anything else. */\n  if(+state.challenge===0 && u.kind==='turret' && typeof platesHere==='function'){ let pb=null,pd=1e9; platesHere().forEach(p=>{if(!p.up||(p.fall||0)>0.25)return;const s=sc(qWorld(p));if(s.dot>.82&&s.dist<340&&s.dist<pd){pd=s.dist;pb={id:p.id,dist:s.dist,kind:'pop',ref:p,lane:p.lane};}}); if(pb) return pb; }\n  rings.forEach(p=>{if(p.up===false)return;")
s=rep("  if(typeof buoys!=='undefined')buoys.forEach(p=>{const s=sc(p);","  if(typeof buoys!=='undefined' && u.kind!=='turret')buoys.forEach(p=>{const s=sc(p);")

# ── picker + toasts + HUD ──────────────────────────────────────────────────────────────────────
s=rep('      <option value="bounce">RANGE · PRACTICE UP</option>\n      <option value="stay">RANGE · PRACTICE STAY</option>\n      <option value="qual40">RANGE · QUAL 40</option>',
      '      <option value="bounce">TRAINING · RESET</option>\n      <option value="stay">TRAINING · DOWN</option>\n      <option value="qual40">QUAL · 40</option>')
s=rep("  toast(state.rangeMode==='qual40'?'QUAL 40 · HIT/MISS · 23 MARKSMAN 30 SHARP 36 EXPERT':state.rangeMode==='stay'?'PRACTICE · STAY DOWN':'PRACTICE · DOWN THEN UP');",
      "  toast(RANGE_MODE_NAME[state.rangeMode]+(state.rangeMode==='qual40'?' · 40 EXPOSURES · 23 MARKSMAN 30 SHARP 36 EXPERT':state.rangeMode==='stay'?' · A TARGET THAT GOES DOWN STAYS DOWN':' · A TARGET THAT GOES DOWN COMES BACK UP'));")
s=rep("    } else ps.textContent='BLU '+(state.blu|0)+' · RED '+(state.red|0);",
      "    } else ps.textContent=(chNum()===0?(RANGE_MODE_NAME[state.rangeMode||'bounce']+' · PIP FLOOR '+PIP_FLOOR_PX+' PX · '):'')+'BLU '+(state.blu|0)+' · RED '+(state.red|0);")
s=rep("    hc.fillText(L.id+' '+L.kind[0],pr.x,pr.y);","    if(L.i%7===0||Math.abs(L.i-(state.lane||0))<=2) hc.fillText(L.id+' '+L.kind[0],pr.x,pr.y);")
s=ins_before("  if(lk){hc.textAlign='left';hc.fillStyle=T13.LOCK;hc.fillText('LOCK',12,H-36);",
"""  /* r.130: an exposed silhouette on my lane gets a hairline screen bracket + its seconds left, so a 300 m pop-up is findable on a phone. */
  if(chNum()===0&&typeof platesHere==='function'){ platesHere().forEach(q=>{ if(!q.up||(q.fall||0)>0.25) return; const r=plateRect(q); if(!r) return;
    const hw=Math.max(r.half,8), t=Math.min(r.top,r.bot-16); hc.strokeStyle=hot(q)?T13.LOCK:T13.SI; hc.lineWidth=1;
    hc.beginPath(); hc.moveTo(r.cx-hw-4,t+6); hc.lineTo(r.cx-hw-4,t-4); hc.lineTo(r.cx-hw+6,t-4);
    hc.moveTo(r.cx+hw+4,r.bot-6); hc.lineTo(r.cx+hw+4,r.bot+4); hc.lineTo(r.cx+hw-6,r.bot+4); hc.stroke();
    hc.fillStyle=T13.SI; hc.font='10px ui-monospace,monospace'; hc.textAlign='left'; hc.fillText(q.base+' '+Math.max(0,Math.ceil(q.life))+'s',r.cx+hw+8,t+4); }); }
""")

# ── QA rows ────────────────────────────────────────────────────────────────────────────────────
s=rep("    '50/100×2 · 150×1 · farther×0');\n","    '50/100×2 · 150×1 · farther×0');\n"+r"""
  /* r.130 (operator 2026-09-19): the range with turrets actually works — one forward basis, pit faces the plates,
     per-lane exposures, scale-true hits, three modes. NO simDirect anywhere below: every HIT here is an aimed shot. */
  { const W=view.width,H=view.height;
    const cT=camOf(units.T1); const pf=proj([cT.x+cT.fx*60,cT.y+cT.fy*60,cT.z+cT.fz*60],cT,W,H);
    push('PROJ_FWD_AGREES', !!pf && Math.abs(pf.x-W/2)<1 && Math.abs(pf.y-H*.46)<1 && Math.abs(pf.z-60)<.5, pf?('camera forward lands at screen centre · z='+pf.z.toFixed(1)):'culled');
    function seeSign(id){ const u=units[id]; if(!u) return {ok:false,d0:0,d1:0}; const sv={x:u.x,y:u.y,z:u.z,yaw:u.yaw,pan:u.pan,tilt:u.tilt,vx:u.vx,vz:u.vz,vy:u.vy};
      u.x=0;u.z=0;u.y=30;u.yaw=0;u.pan=0;u.tilt=0;u.vx=0;u.vz=0;u.vy=0; state.unit=id;state.challenge=1;state.viewMode='op';state.relinq=false;
      const c=camOf(u); const P=[c.x+c.fx*60,c.y,c.z+c.fz*60]; const pr=proj(P,c,W,H); const d0=Math.hypot(P[0]-u.x,P[2]-u.z);
      state.joy={lx:0,ly:-1,rx:0,ry:0}; for(let i=0;i<14;i++) phys(0.05); const d1=Math.hypot(P[0]-u.x,P[2]-u.z); state.joy={lx:0,ly:0,rx:0,ry:0};
      Object.assign(u,sv); return {ok:!!pr&&Math.abs(pr.x-W/2)<1&&d1<d0-2,d0,d1}; }
    ['D1Q','D1','R2'].forEach(id=>{const r=seeSign(id); push('FWD_IS_WHAT_YOU_SEE_'+id, r.ok, 'to the point on screen: '+r.d0.toFixed(1)+' → '+r.d1.toFixed(1)+' m');});
    const sv2={unit:state.unit,ch:state.challenge,lane:state.lane,mode:state.rangeMode,zoom:state.zoom,view:state.viewMode,lobby:state.lobby&&state.lobby.phase,desig:state.desig,slots:state.tgtSlot,hi:state.hiApproved,sd:state.simDirect};
    state.simDirect=false; state.lane=0; state.rangeMode='bounce'; goRange(); state.zoom=1; const u0=units[state.unit]; u0.pan=0;u0.tilt=0; if(state.lobby) state.lobby.phase='WAITING';
    const cam0=camOf(u0); const seen=platesHere().filter(q=>{const w=qWorld(q);return !!proj([w.x,w.y||1.2,w.z],cam0,W,H);}).length;
    push('RANGE_SEES_PLATES', seen===10, seen+'/10 silhouettes project at pan 0 from the pit');
    push('ALTC_LAYOUT', QUAL.length===10 && QUAL.filter(q=>q.z===100&&q.form==='F').length===3 && QUAL.filter(q=>q.z===250).length===1 && QUAL.filter(q=>q.z===300).length===1 && QUAL.find(q=>q.z===250).x<0 && QUAL.find(q=>q.z===300).x>0, '50 F · 100 F×3 · 150 E×2 · 200 E×2 · 250 left · 300 right (sheet 9127)');
    const o0=exposureOrder(0), o1=exposureOrder(1), o0b=exposureOrder(0);
    push('RANGE_POP_SCHEDULE', o0.join()===o0b.join() && o0.join()!==o1.join() && new Set(o0).size===10 && EXPOSURE_S[50]===3 && EXPOSURE_S[300]===8, 'L01 '+o0.join('')+' · L02 '+o1.join('')+' · 3 s @50 → 8 s @300');
    function aimPlate(q,offPx){ const w=qWorld(q); const c0=camOf(u0); const dx=w.x-c0.x,dy=(w.y||1.2)-c0.y,dz=w.z-c0.z; const d=Math.hypot(dx,dy,dz);
      u0.pan=(yawTo(dx,dz)-u0.yaw)*180/Math.PI; u0.tilt=Math.asin(dy/d)*180/Math.PI;
      if(offPx){ const fov=38/Math.max(0.55,Math.min(3.2,state.zoom||1)); const f=(H*.52)/Math.tan(fov*Math.PI/180); u0.pan+=Math.atan2(offPx,f)*180/Math.PI; } }
    function shootPlate(base,offPx){ rangeReset(); const q=rangeExpose(0,base); aimPlate(q,offPx||0); state.tgtSlot={}; state.desig=null; state.hiApproved=false;
      designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const red=!!(state.desig&&state.desig.phase==='red'); fireN(1);
      return {q,red,dead:!!(state.lastShot&&state.lastShot.dead),band:state.lastBand,cleared:!state.desig}; }
    const lk0=(()=>{rangeReset(); rangeExpose(0,'C-50'); u0.pan=0;u0.tilt=0; const l=lockOn(); return l&&l.id;})();
    push('RANGE_LOCK_PLATE', lk0==='C-50-L01', 'LOCK from the pit at pan 0 = '+lk0);
    const h50=shootPlate('C-50',0); push('RANGE_HIT_50', h50.red&&h50.dead&&h50.cleared, 'aimed · red='+h50.red+' dead='+h50.dead+' band='+h50.band+' cleared='+h50.cleared);
    const h300=shootPlate('C-300',0); push('RANGE_HIT_300', h300.red&&h300.dead&&h300.cleared, 'aimed · red='+h300.red+' dead='+h300.dead+' band='+h300.band);
    const m300=shootPlate('C-300',20); push('RANGE_MISS_300_OFF20', m300.red&&!m300.dead&&m300.q.lifePct===100, '20 px beside a 300 m plate · dead='+m300.dead+' (the old 32 px rule scored this a HIT)');
    const h50b=shootPlate('C-50',10); push('RANGE_HIT_50_OFF10', h50b.red&&h50b.dead, '10 px inside the 50 m F · dead='+h50b.dead+' band='+h50b.band);
    /* three modes, the operator's names */
    state.rangeMode='bounce'; rangeReset(); const qb=rangeExpose(0,'C-50'); qb.lifePct=0; qb.fall=0.05; for(let i=0;i<120;i++) rangeTick(0.05);
    push('MODE_RESET_RETURNS', platesHere().some(q=>q.up) && !qb._down, 'TRAINING · RESET: after a hit the lane keeps exposing · up='+platesHere().filter(q=>q.up).map(q=>q.base).join(','));
    state.rangeMode='stay'; rangeReset(); const qs=rangeExpose(0,'C-50'); qs.lifePct=0; qs.fall=0.05; for(let i=0;i<40;i++) rangeTick(0.05); let sawUp=false; for(let k=0;k<12;k++){ for(let i=0;i<120;i++) rangeTick(0.05); if(qs.up) sawUp=true; }
    push('MODE_DOWN_STAYS', qs._down===true && !sawUp && !qs.up, 'TRAINING · DOWN: C-50 stays down through 12 more exposures');
    state.rangeMode='qual40'; rangeReset(); qualResetTower(); const e0=exposureAt(0,0); for(let i=0;i<40;i++) rangeTick(0.05); const started=state.qualStarted; const r0=state.qualR; for(let i=0;i<(e0.sec+0.3)*20;i++) rangeTick(0.05);
    push('MODE_QUAL_TIMED', started && state.qualR===r0+1 && (state.qualExpired||0)>=1 && state.qualTblR===1, 'QUAL · 40: first exposure '+e0.base+' '+e0.sec+' s · lapsed = UNFIRED MISS · rounds '+state.qualR);
    state.rangeMode=sv2.mode; rangeReset(); qualResetTower(); state.zoom=sv2.zoom; state.viewMode=sv2.view; if(state.lobby) state.lobby.phase=sv2.lobby; state.desig=sv2.desig; state.tgtSlot=sv2.slots; state.hiApproved=sv2.hi; state.lane=sv2.lane; state.challenge=sv2.ch; state.unit=sv2.unit; state.simDirect=sv2.sd; }
""")


# ── the reducer keeps the target's kind and the designator's identity ─────────────────────────
s=ins_before("function applyWorld(",
"""/* r.130: the reducer rebuilt every designation as kind:'obj' and dropped WHO marked it. At CH0 fireN then routed a
   designated silhouette down the bull-ring path (shooting BULL-1, never the plate), and approveDesig's two-humans
   rule (r.129, identity-based) never saw a peer's identity. Kind comes from the target; identity from the row. */
function kindOfRef(ref){ if(!ref) return 'obj'; if(ref.form) return 'pop'; if(typeof rings!=='undefined'&&rings.includes(ref)) return 'ring';
  if(typeof pops!=='undefined'&&(pops.includes(ref)||/^POP-/.test(ref.id||''))) return 'pop'; if(typeof drones!=='undefined'&&drones.includes(ref)) return 'uav';
  if(typeof foils!=='undefined'&&foils.includes(ref)) return 'foil'; if(typeof doors!=='undefined'&&doors.includes(ref)) return 'door';
  if(typeof buoys!=='undefined'&&buoys.includes(ref)) return 'buoy'; return 'obj'; }
""")
s=rep("    state.desig={id,kind:'obj',ref:o||{id,x:0,y:1,z:0},phase:'amber',how:'PEER',slot:state.slot||1};",
      "    const same=state.desig&&state.desig.id===id?state.desig:null;\n    state.desig={id,kind:kindOfRef(o),ref:o||{id,x:0,y:1,z:0},phase:'amber',how:'PEER',slot:(same&&same.slot)||state.slot||1,by:row.peerId||(same&&same.by)||SID,t:state.clock};")
s=rep(",id:state.desig.id})||(n&&slots().find(x=>x.n===n));",
      ",id:state.desig.id})||(n&&slots().find(x=>x.n===n));\n  if(s&&s.ref&&(s.kind==='obj'||!s.kind)) s.kind=kindOfRef(s.ref); /* r.130: the kind is the target's, never a placeholder */")
s=rep("      u.x=0;u.z=0;u.y=30;u.yaw=0;u.pan=0;u.tilt=0;u.vx=0;u.vz=0;u.vy=0; state.unit=id;",
      "      u.x=20;u.z=70;if(u.kind!=='droid')u.y=30;u.yaw=0;u.pan=0;u.tilt=0;u.vx=0;u.vz=0;u.vy=0; state.unit=id; /* the lawn, not the Capitol wall */")


# ── r.129 defect: bullseye() called draw()'s local segs from top level → every frame aborted after the doors ──
s=rep("function bullseye(x,y,z){ segs(ring(x,y,z,0.62,16),T13.SI); segs(ring(x,y,z,0.28,12),T13.SI); segs([[[x,y-0.08,z],[x,y+0.08,z]]],T13.SI); }",
      "function bullseye(x,y,z,segs){ /* r.130: segs is draw()'s local — r.129 referenced it from here, threw ReferenceError on every frame, and the loop's try/catch hid it: nothing after the doors was ever drawn. */ segs(ring(x,y,z,0.62,16),T13.SI); segs(ring(x,y,z,0.28,12),T13.SI); segs([[[x,y-0.08,z],[x,y+0.08,z]]],T13.SI); }")
s=rep("if(!d.tagged) bullseye(d.x,d.y,d.z);","if(!d.tagged) bullseye(d.x,d.y,d.z,segs);")
s=rep("bullseye(p.x,p.y+1.2,p.z);","bullseye(p.x,p.y+1.2,p.z,segs);")
s=rep("  hc.textAlign='right';hc.fillStyle=T13.ROAD;hc.fillText(units[state.unit].label+' · SPIRAL v'+state.spiral,W-12,H-20);\n}",
      "  hc.textAlign='right';hc.fillStyle=T13.ROAD;hc.fillText(units[state.unit].label+' · SPIRAL v'+state.spiral,W-12,H-20);\n  state.drawDone=(state.drawDone||0)+1; /* r.130: the frame reached its last line (the QA row DRAW_COMPLETES reads this) */\n}")
# ── render exceptions are recorded, never hidden; DRAW_COMPLETES is a deferred row fed by the frame loop ──
s=rep("  }catch(_){ }\n  requestAnimationFrame(loop);","  }catch(e){ state.drawErr=String(e); state.drawErrN=(state.drawErrN||0)+1; } /* r.130: recorded, never hidden — r.129's bullseye/segs ReferenceError truncated every frame in silence */\n  requestAnimationFrame(loop);")
s=rep("  state.qa={pass,total:rows.length,rev:BUILD.revision,t:Date.now(),known:KNOWN};",
      "  state.qa={pass,total:rows.length,rev:BUILD.revision,t:Date.now(),known:KNOWN};\n  /* r.130 deferred row: draw() cannot run inside boot QA (later consts are in their TDZ), so the loop runs it and this row reads the outcome 1.5 s later. */\n  setTimeout(()=>{ const ok=(state.drawDone||0)>0&&!state.drawErr; rows.push({id:'DRAW_COMPLETES',ok,note:ok?('frames ran to their last line: '+state.drawDone+' · segs='+state.segs+' dropped='+state.dropped):('render exception: '+String(state.drawErr||'no frame completed').slice(0,90))}); state.qa.pass+=ok?1:0; state.qa.total=rows.length; const n=document.getElementById('qaOps'); if(n) n.textContent=state.qa.pass+'/'+rows.length; },1500);")
# ── what you must hit gets the budget first ──
s=rep("  const addR=(c,s)=>{if(!OK.has(c))throw 0; RANGE_WIRE.push({c,s});};","  const addR=(c,s,lane)=>{if(!OK.has(c))throw 0; RANGE_WIRE.push({c,s,lane});};")
s=rep("    addR(col,[[[L.x,y1,0],[L.x,y2,300]], ...box(L.x,y1,0,2.2,1.2,2.2)]);","    addR(col,[[[L.x,y1,0],[L.x,y2,300]]]); addR(col,box(L.x,y1,0,2.2,1.2,2.2),L.i);")
s=rep("  if(chNum()===0) RANGE_WIRE.forEach(g=>segs(g.s,g.c));\n  else WIRE.g.forEach(",
      "  if(chNum()===0){ drawPlates(segs); RANGE_WIRE.forEach(g=>{ if(g.lane!=null&&S.maj===1&&Math.abs(g.lane-(state.lane||0))>1) return; segs(g.s,g.c); }); } /* r.130: silhouettes before the wire; pit boxes only near my lane at MoT 1 */\n  else WIRE.g.forEach(")
s=rep("""  (PLATES||QUAL).forEach(q=>{
    if(!q.up)return;
    const mine=q.lane==null||q.lane===(state.lane||0);
    if(!mine && Math.abs((q.lane||0)-(state.lane||0))>1) return;
    if(!mine && q.base!=='C-50') return;
    segs(silMesh(q),(hot(q)||q.mist)?T13.LOCK:mine?T13.SI:T13.STROKE);
  });
""","  if(chNum()!==0) drawPlates(segs);\n")
s=ins_before("function drawTbox(o,slot,cam,W,H,phase){",
"""/* r.130: what you must hit gets the segment budget FIRST. At CH0 the lane's exposed silhouettes are drawn before the range
   wire (601 segments of grid, lanes and 42 pit boxes); at MoT 1.1 the budget is 280, so r.128/r.129 dropped every silhouette. */
function drawPlates(segs){
  (PLATES||QUAL).forEach(q=>{
    if(!q.up)return;
    const mine=q.lane==null||q.lane===(state.lane||0);
    if(!mine && Math.abs((q.lane||0)-(state.lane||0))>1) return;
    if(!mine && q.base!=='C-50') return;
    segs(silMesh(q),(hot(q)||q.mist)?T13.LOCK:mine?T13.SI:T13.STROKE);
  });
}
""")

# ── revision stamps ────────────────────────────────────────────────────────────────────────────
c129=s.count("revision:'0.129'"); s=rep("revision:'0.129'","revision:'0.130'",c129)
h=s.count("r0.129"); s=rep("r0.129","r0.130",h)
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest()[:16],'rev-stamps',c129,'header',h)

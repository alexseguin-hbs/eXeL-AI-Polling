# r.146 -> r.147 — LOCK IS THE TARGET NEAREST THE BULLSEYE ON THE PICTURE, NEVER THE NEAREST IN METRES (operator 2026-09-23,
# docs/asks/2026-09-23_target_resets_to_50L_fleet_test.md: "target approve and fire keeps resetting to 50 m left target; fix").
# Reproduced on the served r.146: bullseye 20 px beside the 150 R → LOCK C-50L (a plate whose centre was 21 px OFF the left edge of the
# screen), and TARGET then swung the head 7° onto it. THE CLASS: every fallback in lockOn() picked the nearest candidate IN METRES inside a
# 35° cone — plates, rings, buoys, pops, aircraft, foils, doors alike — so whenever the pip was not exactly inside a plate's outline (an 11 px
# plate at 150 m on a phone) the 50 m pair won, and the Capital scenes had the same rule. Now ONE rule for every kind and every scene:
# the candidate whose projection is nearest the pip, on the picture, within LOCK_REACH_PX; off-screen never; nothing within reach → no lock.
# The marked target's hysteresis and the plate-under-the-pip pass (r.143) stay. Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.146.html'); DST=os.path.join(DECK,'drone-2525_r.147.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── R147-1 · the one rule ──
rep("function lockOn(){\n  const u=units[state.unit],c=camOf(u);",
"""const LOCK_REACH_PX=48; /* r.147 DECLARED (operator 2026-09-23): LOCK is the target nearest the bullseye ON THE PICTURE, within this many px of the pip — 26 mrad at 1×, finer as the optic zooms — never the nearest in metres. The 50 L at the screen's edge had been taking TARGET while the pip sat on the 150 R. The same rule serves the range, the Capital and every scene. */
function pipRank(cands,c,W,H){ const px=W/2,py=H*.46; const out=[]; cands.forEach(k=>{ const w=k.world; const p=proj([w.x,w.y,w.z],c,W,H); if(!p||p.x<0||p.x>W||p.y<0||p.y>H) return; /* off the picture is never a candidate */ out.push({id:k.id,dist:k.dist,kind:k.kind,ref:k.ref,lane:k.lane,px:Math.hypot(p.x-px,p.y-py)}); }); return out.sort((a,b)=>(a.px-b.px)||(a.dist-b.dist)); } /* every target on the picture, nearest to the bullseye first — T1 · T2 · T3 read this order */
function pipNearest(cands,c,W,H){ const r=pipRank(cands,c,W,H)[0]; return r&&r.px<=LOCK_REACH_PX?r:null; }
function lockOn(){
  const u=units[state.unit],c=camOf(u);""")
i=s.index("  let b=null,bd=1e9;\n  /* r.130: on the range an EXPOSED silhouette in the cone is the lock, before the bull ring or anything else. */")
j=s.index("  return d2;\n}\nfunction extract(){")
old_tail=s[i:j+len("  return d2;\n}\n")]
if "s.dot>.82&&s.dist<340&&s.dist<bd" not in old_tail or "if(ub) return ub; }" not in old_tail: raise SystemExit('REFUSE: lockOn tail is not the r.146 shape')
new_tail="""  const W=view.width,H=view.height; const cand=[]; const add=(o,kind,w,cap,extra)=>{ const sd=sc(w); if(cap&&sd.dist>cap) return; if(sd.dot<=0) return; cand.push(Object.assign({id:o.id,kind,ref:o,dist:sd.dist,world:w},extra||{})); }; /* r.147: one pool, one rule — nearest to the pip on the picture */
  /* r.130: on the range an EXPOSED silhouette is the lock, before the bull ring or anything else. */
  if(+state.challenge===0 && u.kind==='turret' && typeof platesHere==='function'){ { let ub=null,ud=1e9; const px=W/2,py=H*.46,m=8; platesHere().forEach(p=>{ if(!p.up||(p.fall||0)>0.25||p.lifePct<=0) return; const r=plateRect(p); if(!r) return; if(Math.abs(px-r.cx)<=r.half+m&&py>=r.top-m&&py<=r.bot+m){ const s2=sc(worldOf(p)); if(s2.dist<ud){ ud=s2.dist; ub={id:p.id,dist:s2.dist,kind:'pop',ref:p,lane:p.lane}; } } }); if(ub) return ub; } /* r.143: the plate under the pip wins over a nearer plate beside it — LOCK is the thing in the crosshair */
    platesHere().forEach(p=>{ if(!p.up||(p.fall||0)>0.25||p.lifePct<=0) return; add(p,'pop',worldOf(p),340,{lane:p.lane}); }); return pipNearest(cand,c,W,H); } /* r.131: from the pit, LOCK is an exposed silhouette or nothing — never a door 46 m away */
  rings.forEach(p=>{ if(p.up===false) return; add(p,'ring',p); });
  if(typeof buoys!=='undefined' && u.kind!=='turret') buoys.forEach(p=>add(p,'buoy',p));
  pops.forEach(p=>{ if(!p.up) return; add(p,'pop',p,80); });
  (typeof platesHere==='function'?platesHere():QUAL).forEach(p=>{ if(!p.up||(p.fall||0)>0.25||p.lifePct<=0) return; add(p,'pop',worldOf(p),340,{lane:p.lane}); });
  drones.forEach(d=>{ if(!d.up) return; add(d,'uav',d,120); });
  foils.forEach(d=>{ if(!d.up) return; add(d,'foil',d,160); });
  const b=pipNearest(cand,c,W,H); if(b) return b;
  const dc=[]; doors.forEach(d=>{ const sd=sc(d); if(sd.dist<70&&sd.dot>0) dc.push({id:d.id,kind:'door',ref:d,dist:sd.dist,world:d}); }); return pipNearest(dc,c,W,H); /* a door only when nothing else is near the pip */
}
"""
s=s[:i]+new_tail+s[j+len("  return d2;\n}\n"):]; n[0]+=1

# ── R147-1b · T1 · T2 · T3 are the targets nearest the bullseye on the picture, in that order (key 1 and voice "target one" said the 50 L) ──
rep("  if(state.mode==='turret'||(units[state.unit]||{}).kind==='turret') return ((chNum()===0&&typeof platesHere==='function'?platesHere():QUAL).filter(q=>q.up&&(q.fall||0)<0.25&&q.lifePct>0).concat(pops.filter(p=>p.up))).slice(0,3).map((p,i)=>({n:i+1,ref:p,kind:'pop',id:p.id}));",
    "  if(state.mode==='turret'||(units[state.unit]||{}).kind==='turret'){ const u=units[state.unit],c=camOf(u),W=view.width,H=view.height; const cand=[]; const put=(p,w)=>cand.push({id:p.id,kind:'pop',ref:p,lane:p.lane,world:w,dist:Math.hypot(w.x-c.x,w.z-c.z)}); (chNum()===0&&typeof platesHere==='function'?platesHere():QUAL).forEach(q=>{ if(q.up&&(q.fall||0)<0.25&&q.lifePct>0) put(q,worldOf(q)); }); pops.forEach(p=>{ if(p.up) put(p,p); }); return pipRank(cand,c,W,H).slice(0,3).map((k,i)=>({n:i+1,ref:k.ref,kind:'pop',id:k.id,px:k.px})); } /* r.147: T1 · T2 · T3 are the three targets nearest the bullseye on the picture — the array order had made T1 the 50 L for ever */")
rep("  if(!s){toast(+state.challenge===0?noLockMsg():('NO T'+n));log('TGT','none',n);return null;} /* r.133: key 1 says what the TARGET button and voice say */",
    "  if(!s||(n===1&&s.px!=null&&s.px>LOCK_REACH_PX)){toast(+state.challenge===0?noLockMsg():('NO T'+n));log('TGT','none',n);return null;} /* r.133: key 1 says what the TARGET button and voice say · r.147: and marks what the button marks — T1 within the bullseye's reach, or nothing */")

# ── R147-2 · the words say what to do ──
rep("'NO TARGET IN THE PICTURE · TURN TO ONE'","'NO TARGET UNDER THE BULLSEYE · PUT IT ON ONE'",2)

# ── QA rows ──
rep("    const lk0=(()=>{rangeReset(); rangeExpose(0,'C-50'); u0.pan=0;u0.tilt=0; const l=lockOn(); return l&&l.id;})();",
    "    const lk0=(()=>{rangeReset(); const q=rangeExpose(0,'C-50'); aimPlate(q,0); const l=lockOn(); return l&&l.id;})(); /* r.147: the bullseye on the exposed plate (at pan 0 it sits on the grass, and grass never locks) */")
rep("    push('RANGE_LOCK_PLATE', lk0==='C-50-L01', 'LOCK from the pit at pan 0 = '+lk0);",
    "    push('RANGE_LOCK_PLATE', lk0==='C-50-L01', 'LOCK from the pit, bullseye on the exposed 50 R = '+lk0);")
rep("    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',",
    """    { state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.zoom=1; const q=platesHere().find(p=>p.base==='C-150R'); aimPlate(q,20); const lk=lockOn(); const l50=plateRect(platesHere().find(p=>p.base==='C-50L')); const off=!l50||l50.cx-l50.half<0||l50.cx+l50.half>W; const pn=pipNearest([{id:'X',kind:'pop',ref:{},dist:1,world:worldOf(platesHere().find(p=>p.base==='C-50L'))}],camOf(u0),W,H); u0.tilt+=Math.atan2(200,focalPx())*180/Math.PI; const sky=lockOn();
      push('LOCK_IS_NEAREST_TO_THE_PIP', !!lk&&lk.id===q.id&&lk.px<=LOCK_REACH_PX&&(!off||pn===null)&&!sky, 'bullseye 20 px beside the 150 R: LOCK '+(lk?lk.id+' at '+lk.px.toFixed(0)+' px':'none')+', not the 50 L '+(off?'off the picture (never a candidate)':'on the picture')+'; bullseye in the sky: '+(sky?sky.id:'none')); }
    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',""")
rep("      push('TARGETN_HITS_THE_EXPOSED_PLATE', !!t1&&t1.id===q.id&&!!(state.lastShot&&state.lastShot.dead), 'key 1 aims from the eye and the shot lands · '+(t1?t1.id:'none')+' · band='+state.lastBand); }",
    """      push('TARGETN_HITS_THE_EXPOSED_PLATE', !!t1&&t1.id===q.id&&!!(state.lastShot&&state.lastShot.dead), 'key 1 aims from the eye and the shot lands · '+(t1?t1.id:'none')+' · band='+state.lastBand); }
    { state.rangeMode='bounce'; rangeReset(); state.tgtSlot={}; state.desig=null; state.hiApproved=false; state.zoom=1; const q=platesHere().find(p=>p.base==='C-150R'); aimPlate(q,20); const pan0=u0.pan,tilt0=u0.tilt; const t=targetN(1); const moved=Math.hypot(u0.pan-pan0,u0.tilt-tilt0); approveDesig('HI-2'); const red=!!(state.desig&&state.desig.phase==='red'&&state.desig.id===q.id); fireN(1); const hit=!!(state.lastShot&&state.lastShot.dead);
      push('TARGET_MARKS_THE_PIP', !!t&&t.id===q.id&&moved<1.5&&red&&hit, 'bullseye 20 px beside the 150 R with every target up: TARGET marks '+(t?t.id:'none')+' and the head moves '+moved.toFixed(2)+'° onto it (not 7° to the 50 L); APPROVE reds it; FIRE lands'); state.desig=null; state.tgtSlot={}; state.hiApproved=false; }""")
rep("    state.unit='T01'; state.challenge=0; state.lane=0; state.rangeMode='bounce'; goRange(); state.zoom=1; if(state.lobby) state.lobby.phase='WAITING';\n    { rangeReset(); const q=rangeExpose(0,'C-100C');",
    """    { /* r.147: the same rule on the Capital — a door beside the pip, not the nearest door in the cone */ const svU=state.unit,svC=state.challenge; let pick=null; Object.keys(units).some(id=>{ const t=units[id]; if(t.kind!=='turret'||t.team!=='CAP') return false; const near=doors.map(d=>({d,dist:Math.hypot(d.x-t.x,d.z-t.z)})).filter(x=>x.dist<60).sort((a,b)=>a.dist-b.dist); if(near.length<2) return false; pick={id,t,far:near[near.length-1].d,close:near[0].d}; return true; });
      if(pick){ state.unit=pick.id; state.challenge=1; state.viewMode='op'; state.relinq=false; state.desig=null; state.tgtSlot={}; const sv={yaw:pick.t.yaw,pan:pick.t.pan,tilt:pick.t.tilt}; aimUnitAt(pick.t,pick.far,-40,40); pick.t.pan+=Math.atan2(20,focalPx())*180/Math.PI; const lk=lockOn(); pick.t.yaw=sv.yaw; pick.t.pan=sv.pan; pick.t.tilt=sv.tilt;
        push('CAP_LOCK_IS_THE_PIP', !!lk&&lk.id===pick.far.id&&lk.kind==='door', 'Capital, '+pick.id+': bullseye 20 px beside door '+pick.far.id+' → LOCK '+(lk?lk.id:'none')+' (the nearer door '+pick.close.id+' does not take it)'); }
      else push('CAP_LOCK_IS_THE_PIP', false, 'no Capital turret with two doors within 60 m — the row cannot be exercised');
      state.unit=svU; state.challenge=svC; }
    state.unit='T01'; state.challenge=0; state.lane=0; state.rangeMode='bounce'; goRange(); state.zoom=1; if(state.lobby) state.lobby.phase='WAITING';
    { rangeReset(); const q=rangeExpose(0,'C-100C');""")

rep("    { rangeReset(); const q=rangeExpose(0,'C-100C'); u0.pan=0; u0.tilt=0; state.tgtSlot={}; state.desig=null; const t1=targetN(1); approveDesig('HI-2'); fireN(1);",
    "    { rangeReset(); const q=rangeExpose(0,'C-100C'); aimPlate(q,20); /* r.147: within the bullseye's reach — at pan 0 the pip sat on the grass 55 px off the plate, and key 1 now refuses that as the button does */ state.tgtSlot={}; state.desig=null; const t1=targetN(1); approveDesig('HI-2'); fireN(1);")

c=s.count("revision:'0.146'"); rep("revision:'0.146'","revision:'0.147'",c)
h=s.count("r0.146"); rep("r0.146","r0.147",h)
for dead in ["s.dot>.82&&s.dist<340&&s.dist<bd",".slice(0,3).map((p,i)=>({n:i+1,ref:p,kind:'pop',id:p.id}));","s.dot>.97&&s.dist<70&&s.dist<dd","NO TARGET IN THE PICTURE · TURN TO ONE"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

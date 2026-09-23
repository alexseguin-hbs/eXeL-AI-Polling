# r.139 -> r.140 — THE DARK GREEN PLATES AND THE 25 M ALT-C SHEET (operator 2026-09-23, docs/asks/2026-09-23_targets_bigger_altc_sheet.md).
#   F-type silhouette 26" × 21" (NSN 6920-00-071-4589, NCSS / Action Target) — "a little bigger"; E-type stays 19.5" × 40".
#   TARGETS picker: POP-UPS · 50–300 M (as before) or ALT-C SHEET · 25 M — one 17" × 22" sheet at 25 m carrying the ten silhouettes
#   scaled by 25/range so each subtends the angle of the real target; paper does not fall — a hit is a hole; the three modes still apply.
# Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.139.html'); DST=os.path.join(DECK,'drone-2525_r.140.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── R140-1 · the F-type is the wide shouldered plate: 26" × 21" (SOURCED) ──
rep("w:0.495,h:0.508,form:'F'}","w:0.660,h:0.533,form:'F'}",5)
rep("/* r.138: every silhouette at its REAL size — F 0.495 × 0.508 m, E 0.495 × 1.016 m (Range Systems E-type sheet 19.5\" × 40\"); the angular pip floor (3 mrad) is what keeps a 300 m E hittable, not a fat mesh */",
    "/* r.138/r.140: every silhouette at its REAL size — F 0.660 × 0.533 m (26\" × 21\", NSN 6920-00-071-4589, the dark green shouldered plate), E 0.495 × 1.016 m (19.5\" × 40\"); the angular pip floor (3 mrad) is what keeps a 300 m E hittable, not a fat mesh */")

# ── R140-2 · the sheet: geometry through TWO functions every consumer already goes through ──
rep("function qWorld(q){\n  const L=(q&&q.lane!=null&&typeof LANES!=='undefined'&&LANES[q.lane])|| (typeof laneNow==='function'?laneNow():{x:0,y:2.2,slope:0});\n  return {x:q.x+(L.x||0), y:(q.y||0)+(L.y-2.2)+(L.slope||0)*(q.z||0), z:q.z};\n}",
    """/* r.140 THE 25 M ALT-C SHEET (operator 2026-09-23): one 17" × 22" sheet at 25 m (Rite in the Rain 9127 / Qualification Targets Inc.)
   carrying the ten silhouettes scaled by 25/range, so each subtends the angle of the real target at 50–300 m. Positions on the sheet
   follow the printed layout (50 bottom centre · 100 × 3 · 150 left/right · 200 × 2 · 250 top-left · 300 top-right); the sheet has ONE
   50 m silhouette (the 50 R), as printed. Sheet bottom 1.1 m above the lane (DECLARED: a target frame at chest height). Paper never
   falls: a hit is a HOLE (drawn), the silhouette stays; TRAINING · DOWN scores a hit silhouette out (dim), QUAL · 40 runs the same
   engagement program on the sheet. Invariant: every consumer of a plate's place and size goes through qWorld() and plateDims(). */
const SHEET={w:0.4318,h:0.5588,z:25,base:1.1};
const SHEET_LAYOUT={'C-50':[0,0.005],'C-100L':[-0.13,0.19],'C-100R':[0.13,0.19],'C-100C':[0,0.30],'C-150L':[-0.17,0.30],'C-150R':[0.17,0.30],'C-200L':[-0.05,0.43],'C-200R':[0.05,0.43],'C-250':[-0.17,0.455],'C-300':[0.17,0.47]};
function onSheet(){ return state.targets==='sheet'; }
function sheetHas(q){ return !!SHEET_LAYOUT[q&&(q.base||q.id)]; }
function plateDims(q){ if(onSheet()&&sheetHas(q)){ const k=SHEET.z/(q.z||SHEET.z); return {w:q.w*k,h:q.h*k}; } return {w:q.w,h:q.h}; }
function qWorld(q){
  const L=(q&&q.lane!=null&&typeof LANES!=='undefined'&&LANES[q.lane])|| (typeof laneNow==='function'?laneNow():{x:0,y:2.2,slope:0});
  if(onSheet()&&sheetHas(q)){ const p=SHEET_LAYOUT[q.base||q.id]; return {x:p[0]+(L.x||0), y:SHEET.base+p[1]+(L.y-2.2)+(L.slope||0)*SHEET.z, z:SHEET.z}; }
  return {x:q.x+(L.x||0), y:(q.y||0)+(L.y-2.2)+(L.slope||0)*(q.z||0), z:q.z};
}
function sheetWorld(lane){ const L=LANES[lane|0]||laneNow(); const y0=SHEET.base+(L.y-2.2)+(L.slope||0)*SHEET.z; return {x:L.x||0,y0,y1:y0+SHEET.h,z:SHEET.z}; }""")
rep("  const x=wq.x,y=wq.y||0,z=wq.z+(q.fall||0)*q.h*0.4,w=q.w,h=q.h*k;",
    "  const D=plateDims(q); const x=wq.x,y=wq.y||0,z=wq.z+(q.fall||0)*D.h*0.4,w=D.w,h=D.h*k;")
rep("  const w=qWorld(q),cam=camOf(units[state.unit]),W=view.width,H=view.height,k=Math.max(0.06,1-(q.fall||0));\n  const a=proj([w.x-q.w/2,w.y,w.z],cam,W,H),b=proj([w.x+q.w/2,w.y,w.z],cam,W,H),t=proj([w.x,w.y+q.h*k,w.z],cam,W,H);",
    "  const w=qWorld(q),cam=camOf(units[state.unit]),W=view.width,H=view.height,k=Math.max(0.06,1-(q.fall||0)); const D=plateDims(q);\n  const a=proj([w.x-D.w/2,w.y,w.z],cam,W,H),b=proj([w.x+D.w/2,w.y,w.z],cam,W,H),t=proj([w.x,w.y+D.h*k,w.z],cam,W,H);")
rep("  const cy=q.form==='F'?w.y+q.h*0.42:w.y+q.h*0.78*0.55, cr=q.form==='F'?Math.min(0.22,q.w*0.12):Math.min(0.16,q.w*0.22);",
    "  const D=plateDims(q); const cy=q.form==='F'?w.y+D.h*0.42:w.y+D.h*0.78*0.55, cr=q.form==='F'?Math.min(0.22,D.w*0.12):Math.min(0.16,D.w*0.22);")
rep("  if(ref.form&&ref.id&&String(ref.id).charAt(0)==='C'&&typeof qWorld==='function'){ const w=qWorld(ref); const base=w.y||0; return {x:w.x,y:base+ref.h*(ref.form==='F'?0.42:0.78*0.55),z:w.z,base}; }",
    "  if(ref.form&&ref.id&&String(ref.id).charAt(0)==='C'&&typeof qWorld==='function'){ const w=qWorld(ref); const base=w.y||0; const D=plateDims(ref); return {x:w.x,y:base+D.h*(ref.form==='F'?0.42:0.78*0.55),z:w.z,base}; }")
rep("    const ow=worldOf(o); const isP=!!o.form; segs(box(ow.x,isP?(ow.base||0):(o.y||1.2),ow.z,isP?Math.max(1.2,o.w*1.6):3.4,isP?o.h*1.3:3.8,isP?1.2:3.4), red?T13.LOCK:T13.GIMBAL);",
    "    const ow=worldOf(o); const isP=!!o.form; const D=isP?plateDims(o):{w:0,h:0}; segs(box(ow.x,isP?(ow.base||0):(o.y||1.2),ow.z,isP?Math.max(onSheet()?0.3:1.2,D.w*1.6):3.4,isP?D.h*1.3:3.8,isP?(onSheet()?0.3:1.2):3.4), red?T13.LOCK:T13.GIMBAL);")
rep("  const ow=worldOf(o); const isP=!!(o.form&&o.id&&String(o.id).charAt(0)==='C'); const hw=isP?Math.max(0.6,o.w):1.4, y0w=isP?(ow.base||0)-0.1:(o.y||1.2)-0.2, y1w=isP?(ow.base||0)+o.h+0.2:(o.y||1.2)+2.4;",
    "  const ow=worldOf(o); const isP=!!(o.form&&o.id&&String(o.id).charAt(0)==='C'); const D=isP?plateDims(o):{w:0,h:0}; const hw=isP?Math.max(onSheet()?0.15:0.6,D.w):1.4, y0w=isP?(ow.base||0)-(onSheet()?0.02:0.1):(o.y||1.2)-0.2, y1w=isP?(ow.base||0)+D.h+(onSheet()?0.04:0.2):(o.y||1.2)+2.4;")

# ── R140-3 · paper does not fall: a hit is a hole ──
rep("  if(hit){ref.lifePct=0;ref.fall=0.05;ref.mist=false; if(!isPlate) ref.up=true;}",
    """  if(hit){ if(isPlate&&onSheet()&&sheetHas(ref)){ const r=plateRect(ref), D=plateDims(ref); const ppm=r?Math.max(1,(r.bot-r.top)/Math.max(0.02,D.h)):1; ref.holes=(ref.holes||[]).concat([{dx:r?(view.width/2-r.cx)/ppm:0,dy:r?(r.bot-view.height*0.46)/ppm:D.h*0.4}]); ref._hit=true; ref.mist=false; if(state.rangeMode==='stay'){ ref.up=false; ref._down=true; } rangeRelease(ref); } /* r.140: on the sheet a hit is a hole; the silhouette stays (DOWN scores it out) */
    else {ref.lifePct=0;ref.fall=0.05;ref.mist=false; if(!isPlate) ref.up=true;} }""")
rep("function drawPlates(segs){\n  (PLATES||QUAL).forEach(q=>{\n    if(!q.up)return;\n    const mine=q.lane==null||q.lane===(state.lane||0);\n    if(!mine && Math.abs((q.lane||0)-(state.lane||0))>1) return;\n    if(!mine && q.base!=='C-50') return;\n    segs(silMesh(q),(hot(q)||q.mist)?T13.LOCK:mine?T13.SI:T13.STROKE);\n  });\n}",
    """function drawPlates(segs){
  const sheet=onSheet();
  if(sheet){ const sw=sheetWorld(state.lane||0); const hw=SHEET.w/2; segs([[[sw.x-hw,sw.y0,sw.z],[sw.x+hw,sw.y0,sw.z]],[[sw.x+hw,sw.y0,sw.z],[sw.x+hw,sw.y1,sw.z]],[[sw.x+hw,sw.y1,sw.z],[sw.x-hw,sw.y1,sw.z]],[[sw.x-hw,sw.y1,sw.z],[sw.x-hw,sw.y0,sw.z]]],T13.STROKE); } /* r.140: the 17" × 22" sheet at 25 m */
  (PLATES||QUAL).forEach(q=>{
    const mine=q.lane==null||q.lane===(state.lane||0);
    if(sheet){ if(!mine||!sheetHas(q)) return; }
    else { if(!q.up)return; if(!mine && Math.abs((q.lane||0)-(state.lane||0))>1) return; if(!mine && q.base!=='C-50') return; }
    segs(silMesh(q),(hot(q)||q.mist)?T13.LOCK:(sheet&&!q.up)?T13.STROKE:mine?T13.SI:T13.STROKE);
    if(sheet&&q.holes&&q.holes.length){ const w=qWorld(q); q.holes.forEach(h=>segs(ring(w.x+h.dx,w.y+h.dy,w.z-0.01,0.006,6),T13.LOCK)); } /* a hole per hit, where the pip sat */
  });
}""")
rep("function rangeReset(){ magLoad('RESET'); const up=rangeTraining(); (PLATES||QUAL).forEach(q=>{q.up=up;",
    "function rangeReset(){ magLoad('RESET'); const up=rangeTraining(); (PLATES||QUAL).forEach(q=>{q.holes=[];q._hit=false;q.up=up&&(!onSheet()||sheetHas(q));")
rep("(typeof platesHere==='function'?platesHere():[]).forEach(q=>{const up=rangeTraining();q.up=up;",
    "(typeof platesHere==='function'?platesHere():[]).forEach(q=>{const up=rangeTraining()&&(!onSheet()||sheetHas(q));q.up=up;")

# ── the engagement program on the sheet picks only silhouettes the sheet carries ──
rep("  const bases=e.ranges.map(z=>{ const c=QUAL.filter(q=>q.z===z); if(k===0&&z===50) return 'C-50'; return c[Math.floor(r()*c.length)].id; });",
    "  const bases=e.ranges.map(z=>{ let c=QUAL.filter(q=>q.z===z); if(typeof onSheet==='function'&&onSheet()) c=c.filter(q=>sheetHas(q)); if(k===0&&z===50) return 'C-50'; return c[Math.floor(r()*c.length)].id; }); /* r.140: the sheet has one 50 m silhouette */")

# ── R140-4 · the picker, the record, the words ──
rep("rangeMode:'bounce',lane:20,mag:{cap:30,rounds:30,n:1,changes:0},","rangeMode:'bounce',lane:20,targets:'pop',mag:{cap:30,rounds:30,n:1,changes:0},")
rep("""    <select id="lanePick" title="lane"></select>
    <select id="rngMode" title="range mode">""",
    """    <select id="lanePick" title="lane"></select>
    <select id="tgtPick" title="targets">
      <option value="pop">POP-UPS · 50–300 M</option>
      <option value="sheet">ALT-C SHEET · 25 M</option>
    </select>
    <select id="rngMode" title="range mode">""")
rep("  state._resetArm=0; releaseAuthority('RESET'); decide('RESET','RANGE',{why,mode:state.rangeMode,lane:state.lane|0,qualR:state.qualR|0,qualH:state.qualH|0});",
    "  state._resetArm=0; releaseAuthority('RESET'); decide('RESET','RANGE',{why,mode:state.rangeMode,targets:state.targets||'pop',lane:state.lane|0,qualR:state.qualR|0,qualH:state.qualH|0});")
rep("  if(row.verb==='RESET' && row.peerId && row.peerId!==SID){ releaseAuthority('PEER RESET'); if(row.data&&row.data.mode&&RANGE_MODE_NAME[row.data.mode]){ state.rangeMode=row.data.mode; const rm=document.getElementById('rngMode'); if(rm) rm.value=row.data.mode; }",
    "  if(row.verb==='RESET' && row.peerId && row.peerId!==SID){ releaseAuthority('PEER RESET'); if(row.data&&row.data.mode&&RANGE_MODE_NAME[row.data.mode]){ state.rangeMode=row.data.mode; const rm=document.getElementById('rngMode'); if(rm) rm.value=row.data.mode; } if(row.data&&(row.data.targets==='pop'||row.data.targets==='sheet')){ state.targets=row.data.targets; const tp=document.getElementById('tgtPick'); if(tp) tp.value=row.data.targets; } /* r.140: the sheet travels with the reset */")
rep("if(_rm)_rm.onchange=e=>{",
    """{ const tp=document.getElementById('tgtPick'); if(tp) tp.onchange=e=>{ const prev=state.targets||'pop', next=e.target.value; const live=state.rangeMode==='qual40'&&(state.qualR|0)>0&&!state.qualDone;
  if(live&&!(state._resetArm&&performance.now()-state._resetArm<4000)){ state._resetArm=performance.now(); e.target.value=prev; toast('CHANGE THE TARGETS AGAIN TO DISCARD '+(state.qualR|0)+' ROUNDS OF THIS TABLE'); return; }
  state.targets=next; rangeResetOnRecord('TARGETS'); toast(next==='sheet'?'ALT-C SHEET · 25 M · TEN SILHOUETTES SCALED TO 50–300 M · A HIT IS A HOLE':'POP-UPS · 50–300 M'); if(typeof goRange==='function') goRange(); }; }
if(_rm)_rm.onchange=e=>{""")
rep("  toast('RANGE · '+L.id+' '+L.kind+' · '+RANGE_MODE_NAME[state.rangeMode||'bounce']);",
    "  toast('RANGE · '+L.id+' '+L.kind+' · '+(onSheet()?'SHEET 25 M · ':'')+RANGE_MODE_NAME[state.rangeMode||'bounce']);")
rep("  } else ps.textContent=chNum()===0?(RANGE_MODE_NAME[state.rangeMode||'bounce']+' · HIT '",
    "  } else ps.textContent=chNum()===0?((onSheet()?'SHEET 25 M · ':'')+RANGE_MODE_NAME[state.rangeMode||'bounce']+' · HIT '")

# ── QA rows ──
rep("      push('SILHOUETTES_TRUE_SCALE', QUAL.every(q=>Math.abs(q.w-0.495)<1e-9&&(q.form==='F'?Math.abs(q.h-0.508)<1e-9:Math.abs(q.h-1.016)<1e-9)) && !!a&&!!tt&&Math.abs(a.y-tt.y)<8, 'F 0.495 × 0.508 m · E 0.495 × 1.016 m · a 300 m E is '+(a&&tt?Math.abs(a.y-tt.y).toFixed(1):'?')+' px tall at 1× (the 3 mrad floor keeps it hittable)'); }",
    """      push('SILHOUETTES_TRUE_SCALE', QUAL.every(q=>q.form==='F'?(Math.abs(q.w-0.660)<1e-9&&Math.abs(q.h-0.533)<1e-9):(Math.abs(q.w-0.495)<1e-9&&Math.abs(q.h-1.016)<1e-9)) && !!a&&!!tt&&Math.abs(a.y-tt.y)<8, 'F 0.660 × 0.533 m (26" × 21", the dark green shouldered plate) · E 0.495 × 1.016 m · a 300 m E is '+(a&&tt?Math.abs(a.y-tt.y).toFixed(1):'?')+' px tall at 1× (the 3 mrad floor keeps it hittable)'); }
    { const t0=state.targets; state.targets='pop'; state.rangeMode='bounce'; rangeReset(); u0.pan=0;u0.tilt=0; state.zoom=1; const popH={}; platesHere().forEach(q=>{ if(!sheetHas(q)) return; const w=qWorld(q); const c=camOf(u0); const a=proj([w.x,w.y,w.z],c,W,H), t=proj([w.x,w.y+plateDims(q).h,w.z],c,W,H); popH[q.base]=(a&&t)?Math.abs(a.y-t.y):null; });
      state.targets='sheet'; rangeReset(); const fit=platesHere().filter(sheetHas).every(q=>{ const p=SHEET_LAYOUT[q.base], D=plateDims(q); return p[0]-D.w/2>=-SHEET.w/2-1e-9&&p[0]+D.w/2<=SHEET.w/2+1e-9&&p[1]>=0&&p[1]+D.h<=SHEET.h+1e-9; });
      const ratios=platesHere().filter(sheetHas).map(q=>plateDims(q).h/SHEET.z/(q.h/q.z)); const angular=ratios.every(r=>Math.abs(r-1)<1e-9);
      let seen=0; const sheetH={}; platesHere().forEach(q=>{ if(!sheetHas(q)) return; const w=qWorld(q); const c=camOf(u0); const a=proj([w.x,w.y,w.z],c,W,H), t=proj([w.x,w.y+plateDims(q).h,w.z],c,W,H); if(a&&t){ seen++; sheetH[q.base]=Math.abs(a.y-t.y); } });
      const angleMatch=Object.keys(SHEET_LAYOUT).every(b=>popH[b]>0&&sheetH[b]>0&&Math.abs(sheetH[b]/popH[b]-1)<0.06); const worst=Math.max(...Object.keys(SHEET_LAYOUT).map(b=>Math.abs((sheetH[b]||0)/(popH[b]||1)-1)));
      push('SHEET_SCALES_TO_ANGLE', platesHere().filter(sheetHas).length===10 && angular && fit && seen===10 && angleMatch, 'ten silhouettes on the 17" × 22" sheet at 25 m, each scaled by 25/range: on screen each is the same height as the real target at its range (worst '+(worst*100).toFixed(1)+' %), all inside the sheet, all in the picture from the pit');
      state.targets='sheet'; state.rangeMode='bounce'; rangeReset(); const q1=platesHere().find(q=>q.base==='C-100C'); aimPlate(q1,0); state.tgtSlot={}; state.desig=null; state.hiApproved=false; designate({id:q1.id,kind:'pop',ref:q1},'QA'); approveDesig('HI-2'); const h0=state.rangeHit|0; fireN(1);
      push('SHEET_HIT_IS_A_HOLE', (state.rangeHit|0)===h0+1 && q1.up===true && q1.lifePct===100 && (q1.holes||[]).length===1 && !state.desig && platesHere().filter(q=>q.up).length===10 && !platesHere().find(q=>q.base==='C-50L').up && (()=>{ for(let i=0;i<100;i++) rangeTick(0.05); return !platesHere().find(q=>q.base==='C-50L').up && platesHere().filter(q=>q.up).length===10; })(), 'on the sheet a hit is a hole: the silhouette stays up, the box clears, HIT counts; the 50 L (not on the sheet) is never a phantom target, not even after the 3 s return');
      state.rangeMode='stay'; rangeReset(); const q2=platesHere().find(q=>q.base==='C-100C'); aimPlate(q2,0); state.tgtSlot={}; state.desig=null; state.hiApproved=false; designate({id:q2.id,kind:'pop',ref:q2},'QA'); approveDesig('HI-2'); fireN(1);
      push('SHEET_DOWN_SCORES_OUT', q2.up===false && q2._down===true && (q2.holes||[]).length===1 && platesHere().filter(sheetHas).filter(q=>q.up).length===9, 'TRAINING · DOWN on the sheet: a hit silhouette is scored out (dim), the other nine stand');
      state.rangeMode='qual40'; rangeReset(); qualResetTower(); { const R=rangeRun(0); let k4=false; for(let i=0;i<4000&&!k4;i++){ rangeTick(0.05); if(R.phase==='up'&&R.k===4) k4=true; } const upIds=platesHere().filter(q=>q.up).map(q=>q.base).sort().join('/'); const cur=R.cur.map(id=>PLATES.find(p=>p.id===id)).filter(Boolean);
        push('SHEET_QUAL_ENGAGES', k4 && cur.length===4 && cur.every(q=>sheetHas(q)&&q.up) && platesHere().filter(q=>q.up).length===4 && Math.abs(plateDims(cur[0]).h-cur[0].h*SHEET.z/cur[0].z)<1e-9, 'QUAL on the sheet: engagement 5 lights four scaled silhouettes ('+upIds+'), the rest are dim; windows, rounds and misses unchanged'); }
      state.targets=t0||'pop'; state.rangeMode='bounce'; qualResetTower(); rangeReset(); }""")

rep("      if(m) o.lifePct=+m[1]; else if(/^HIT/.test(res)){ o.lifePct=0; if(!(o.fall>0)) o.fall=0.05; } /* r.131: a HIT row downs the target on every peer */",
    "      if(m) o.lifePct=+m[1]; else if(/^HIT/.test(res)){ if(o.form&&typeof onSheet==='function'&&onSheet()&&sheetHas(o)){ if(row.peerId&&row.peerId!==SID){ o.holes=(o.holes||[]).concat([{dx:0,dy:plateDims(o).h*(o.form==='F'?0.42:0.43)}]); o._hit=true; if(state.rangeMode==='stay'){ o.up=false; o._down=true; } } } else { o.lifePct=0; if(!(o.fall>0)) o.fall=0.05; } } /* r.131: a HIT row downs the target on every peer · r.140: on the sheet it is a hole (a peer's row puts it at the centre of mass); paper never falls */")
rep("      if(!q.up){ if(mode==='bounce'){ q._ret=(q._ret||0)+dt; if(q._ret>=RETURN_S){",
    "      if(!q.up){ if(mode==='bounce'&&(!onSheet()||sheetHas(q))){ q._ret=(q._ret||0)+dt; if(q._ret>=RETURN_S){")
c=s.count("revision:'0.139'"); rep("revision:'0.139'","revision:'0.140'",c)
h=s.count("r0.139"); rep("r0.139","r0.140",h)
for dead in ["w:0.495,h:0.508"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

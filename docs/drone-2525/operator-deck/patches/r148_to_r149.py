# r.148 -> r.149 — A BOX ONLY AROUND THE MARKED TARGET: AMBER ON TARGET, RED ON APPROVE, THE VOXEL IN 3D (operator 2026-09-23,
# docs/asks/2026-09-23_edge_markers_only_when_targeted.md, the phone screenshot beside it: every standing silhouette wore a white corner
# bracket). The r.130 hairline bracket on every exposed silhouette goes; the marked target keeps its amber / red T-box on the picture and
# gets the 3D wire box (the voxel) in the world in the same colour — for EVERY marked slot, not only the current one. The three range
# modes are unchanged and re-stated: TRAINING · RESET a hit target goes down and pops back up; TRAINING · DOWN it stays down until RESET;
# QUAL · 40 the engagement's targets rise together and a hit one stays down for the rest of its window (the program re-uses a lifter for a
# later engagement, as the real range does: 40 targets on 11 lifters). Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.148.html'); DST=os.path.join(DECK,'drone-2525_r.149.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── 1 · no bracket unless targeted ──
rep("    if(!isHot){ hc.strokeStyle=(near&&near.id===q.id)?T13.LOCK:T13.SI; hc.lineWidth=1; hc.beginPath(); /* r.143: the bracket turns red with the bullseye */ hc.moveTo(r.cx-hw-4,t+6); hc.lineTo(r.cx-hw-4,t-4); hc.lineTo(r.cx-hw+6,t-4); hc.moveTo(r.cx+hw+4,r.bot-6); hc.lineTo(r.cx+hw+4,r.bot+4); hc.lineTo(r.cx+hw-6,r.bot+4); hc.stroke(); }",
    "    /* r.149 (operator): no edge markers unless targeted — the r.130 hairline bracket on every standing silhouette is gone; the marked target wears the amber T-box, the approved one the red T-box (drawTbox), and the voxel in the world (slotBoxes) */")

# ── 2 · the voxel around every marked slot, in its phase colour ──
rep("function drawTbox(o,slot,cam,W,H,phase){",
"""function slotBoxes(){ /* r.149: the 3D wire box (the voxel) around EVERY marked target — amber while marked, red once approved; one pure list for the painter and the QA */
  const out=[]; Object.keys(state.tgtSlot||{}).forEach(k=>{ const sl=state.tgtSlot[k]; if(!sl||!sl.ref||sl.ref.up===false||sl.ref.lifePct<=0) return; const o=sl.ref, red=sl.phase==='red'; const ow=worldOf(o); const isP=!!o.form; const D=isP?plateDims(o):{w:0,h:0};
    out.push({id:sl.id,n:+k,red,col:red?T13.LOCK:T13.GIMBAL,s:box(ow.x,isP?(ow.base||0):(o.y||1.2),ow.z,isP?Math.max(onSheet()?0.3:1.2,D.w*1.6):3.4,isP?D.h*1.3:3.8,isP?(onSheet()?0.3:1.2):3.4)}); }); return out; }
function drawTbox(o,slot,cam,W,H,phase){""")
rep("""  if(state.desig&&state.desig.ref){
    const o=state.desig.ref; const red=state.desig.phase==='red';
    const ow=worldOf(o); const isP=!!o.form; const D=isP?plateDims(o):{w:0,h:0}; segs(box(ow.x,isP?(ow.base||0):(o.y||1.2),ow.z,isP?Math.max(onSheet()?0.3:1.2,D.w*1.6):3.4,isP?D.h*1.3:3.8,isP?(onSheet()?0.3:1.2):3.4), red?T13.LOCK:T13.GIMBAL);""",
"""  slotBoxes().forEach(b=>segs(b.s,b.col)); /* r.149: the voxel around every marked target, amber / red */
  if(state.desig&&state.desig.ref){
    const o=state.desig.ref; const red=state.desig.phase==='red';
    const ow=worldOf(o); const isP=!!o.form; const D=isP?plateDims(o):{w:0,h:0};""")

# ── QA rows ──
rep("    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',",
    """    { state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.zoom=1; const q=platesHere().find(p=>p.base==='C-150R'); aimPlate(q,0); const b0=slotBoxes(); markLock(lockOn(),'QA'); const b1=slotBoxes(); approveDesig('HI-2'); const b2=slotBoxes();
      push('VOXEL_BOX_FOLLOWS_THE_MARK', b0.length===0&&b1.length===1&&b1[0].id===q.id&&b1[0].col===T13.GIMBAL&&b1[0].s.length===12&&b2.length===1&&b2[0].col===T13.LOCK, 'no box with nothing marked; TARGET → one 12-edge voxel in amber around '+(b1[0]&&b1[0].id)+'; APPROVE → the same box red'); state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    { const src=String((typeof draw==='function'?draw:function(){}).toString()); push('NO_BRACKET_UNLESS_TARGETED', !/moveTo\\(r\\.cx-hw-4,t\\+6\\)/.test(src)&&/slotBoxes\\(\\)\\.forEach/.test(src)&&typeof slotBoxes==='function', 'the painter draws no edge marker on an unmarked silhouette; the marked ones get the T-box and the voxel'); }
    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',""")

c=s.count("revision:'0.148'"); rep("revision:'0.148'","revision:'0.149'",c)
h=s.count("r0.148"); rep("r0.148","r0.149",h)
for dead in ["hc.moveTo(r.cx-hw-4,t+6)","hc.strokeStyle=(near&&near.id===q.id)?T13.LOCK:T13.SI"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

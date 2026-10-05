# r.155 -> r.156 — THE HIT SPLASH STARTS AT THE CENTRE OF THE HIT TARGET (operator 2026-10-04, verbatim: "make sure splash on drone
# originates from center of hit target", then "fix splash"; docs/drone-2525/rounds/2026.10.04_09.17..48_19_rounds/ASK.md Addendum 2,
# with his phone screenshot addendum2_splash_screenshot.png).
# Defect in r.155 (applyHit): state.fx={t,id,direct:hit,life,x:ref.x,y:ref.y,z:ref.z} and the draw ringed (f.x, f.y||1.2, f.z). A range
# plate keeps LANE-LOCAL x and y=0 (its world place is qWorld(q): + the lane's x offset, + the lane's ground height, + its slope), so the
# splash drew beside the plate at the lane-local point (lane 21, 300 m E at 3x: 5 m to the side and 7.4 m above the downhill plate,
# 91 px right and 135 px above it on a 390x844 phone; lane 1: 205 m to the side); and it flashed on a MISS too.
# Found while capturing (the second half of "fix splash"): the splash was drawn AFTER the world wire through the budgeted segs(), and at
# MoT 1 (280 segments) the range wire had already spent the budget (segs=280, dropped=499 on lane 21 at 3x) — so the ring was dropped
# whole and the operator saw no splash at all where he hit.
# Fix (the class, not the instance): the splash stores the TARGET (ref), never a copied position, and one helper splashCentre(f) asks
# worldOf(ref) — the same centre of mass the aim and the hit test use (qWorld + plateDims for a plate; the craft's own place for a drone)
# — every frame, so it rides a moving drone and lowers with a falling plate (y = base + (centre − base)·(1 − fall), the silhouette's own
# shrink). A miss sets no splash. The ring is the shot's own answer: it is drawn outside the world budget (16 segments for 0.45 s, still
# counted in state.segs), so the budget can never drop it. The only readers of state.fx are applyHit (writer) and the draw (reader).
# Boot-QA row SPLASH_FROM_TARGET_CENTRE: hits a 50 m and a 300 m plate on the seated lane through the one fire path, projects the splash
# centre with the draw's own projector and holds it within 2 px of the plate's projected worldOf centre; then a deliberate miss (40 px
# beside a 300 m plate, scored through applyHit itself so the miss branch really runs) leaves no new splash; and one synchronous draw()
# right after the 300 m hit must put all 16 splash segments on the canvas whatever the world wire dropped.
# Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.155.html'); DST=os.path.join(DECK,'drone-2525_r.156.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# -- 1 . applyHit: a hit stores the target itself; a miss sets no splash --
rep("  state.fx={t:state.clock,id,direct:hit,life:hit?0:ref.lifePct,x:ref.x,y:ref.y,z:ref.z};\n",
    "  if(hit) state.fx={t:state.clock,id,direct:true,ref}; /* r.156: the splash keeps the TARGET (its place is asked every frame through worldOf); a miss draws no splash */\n")

# -- 2 . splashCentre(f): the centre of mass of the hit target, lowered with its fall --
rep("function aimUnitAt(u,ref,lo,hi){",
    "function splashCentre(f){ /* r.156 (operator 2026-10-04): the hit splash originates from the centre of the hit target — worldOf is the one centre of mass (qWorld + plateDims for a plate); a falling plate's centre lowers toward its base as the silhouette folds */\n"
    "  const ref=f&&f.ref; const c=worldOf(ref); let y=c.y; const fall=ref&&ref.fall>0?Math.min(1,ref.fall):0;\n"
    "  if(fall>0) y=(c.base||0)+(c.y-(c.base||0))*(1-fall); return {x:c.x,y,z:c.z}; }\n"
    "function aimUnitAt(u,ref,lo,hi){")

# -- 3 . the draw asks splashCentre every frame (follows the falling plate / the moving drone); same 0.45 s ring, LOCK red --
rep("    const f=state.fx, k=1-(state.clock-f.t)/0.45;\n    segs(ring(f.x,f.y||1.2,f.z,1.2+3*(1-k),16), f.direct?T13.LOCK:T13.GIMBAL);\n",
    "    const f=state.fx, k=1-(state.clock-f.t)/0.45, c=splashCentre(f); /* r.156: from the centre of the hit target, every frame */\n"
    "    let fxN=0; v.strokeStyle=T13.LOCK; v.lineWidth=fw; v.beginPath(); ring(c.x,c.y,c.z,1.2+3*(1-k),16).forEach(e=>{ const a=proj(e[0],cam,W,H),b=proj(e[1],cam,W,H); if(a&&b){ v.moveTo(a.x,a.y); v.lineTo(b.x,b.y); fxN++; } }); v.stroke();\n"
    "    state.segs+=fxN; state.fxSegs=fxN; /* r.156: the shot's own answer is never the line the budget drops (through segs() at MoT 1 the world wire had spent all 280 and the ring was dropped whole) */\n")

# -- 4 . the boot-QA row: the splash lands on the plate's centre at 50 m and 300 m; a miss draws none --
rep("    { state.zoom=1; const f=focalPx(); const half=fovDeg(H); const q50=platesHere().find(q=>q.base==='C-50');",
"""    { /* r.156 · SPLASH_FROM_TARGET_CENTRE — the hit splash projects onto the hit plate's centre of mass (the draw's projector), and a miss draws none */
      const offOf=base=>{ state.fx=null; const r=shootPlate(base,0); const f=state.fx; const cam=camOf(units[state.unit]); const c=(f&&f.ref)?splashCentre(f):null, w=worldOf(r.q);
        const pc=c?proj([c.x,c.y,c.z],cam,W,H):null, pw=proj([w.x,w.y,w.z],cam,W,H); return {ok:r.dead&&!!f&&f.ref===r.q&&!!pc&&!!pw, off:(pc&&pw)?Math.hypot(pc.x-pw.x,pc.y-pw.y):999}; };
      const s50=offOf('C-50'), s300=offOf('C-300'); const fx0=state.fx;
      const dd0=state.drawDone; state.fxSegs=0; let drawn=0, dropped=0, dErr=''; try{ draw(); drawn=state.fxSegs|0; dropped=state.dropped|0; }catch(e){ dErr=String(e&&e.message||e).slice(0,60); } state.drawDone=dd0; /* one frame, right after the hit: every splash segment reaches the canvas */
      rangeReset(); const qm=rangeExpose(0,'C-300'); aimPlate(qm,40); const ms0=state.rangeMiss|0; const hm=applyHit(qm,qm.id); const missed=!hm.dead&&qm.lifePct===100&&state.lastBand==='MISS'; state.rangeMiss=ms0;
      const none=state.fx===fx0; state.fx=null;
      push('SPLASH_FROM_TARGET_CENTRE', s50.ok&&s300.ok&&s50.off<=2&&s300.off<=2&&missed&&none&&drawn===16, '50m off '+s50.off.toFixed(1)+'px · 300m off '+s300.off.toFixed(1)+'px · miss: '+(missed?(none?'no splash':'a splash was drawn'):'not a miss ('+state.lastBand+')')+' · drawn '+drawn+'/16 segs (world wire dropped '+dropped+')'+(dErr?' · draw threw '+dErr:'')); }
    { state.zoom=1; const f=focalPx(); const half=fovDeg(H); const q50=platesHere().find(q=>q.base==='C-50');""")

# -- 5 . the deck declares itself r.156 (BUILD const + the header span + the carried-note strings) --
c=s.count("revision:'0.155'"); rep("revision:'0.155'","revision:'0.156'",c)
h=s.count("r0.155"); rep("r0.155","r0.156",h)

for dead in ["revision:'0.155'",'r0.155','x:ref.x,y:ref.y,z:ref.z','ring(f.x,f.y||1.2','f.direct?T13.LOCK']:
    if dead in s: raise SystemExit(f'REFUSE: stale symbol survives: {dead} x{s.count(dead)}')
for need in ['function splashCentre(f)',"push('SPLASH_FROM_TARGET_CENTRE'",'if(hit) state.fx=','state.fxSegs=fxN']:
    if s.count(need)!=1: raise SystemExit(f'REFUSE: {need} must appear exactly once, found {s.count(need)}')
if s.count('state.fx=')!=4: raise SystemExit(f"REFUSE: expected 4 writers of state.fx (applyHit + 3 in QA), found {s.count('state.fx=')}")
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

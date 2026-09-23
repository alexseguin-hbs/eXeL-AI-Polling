# r.142 -> r.143 — NO HORIZON LINE; A WHITE BULLSEYE THAT TURNS RED NEAR A TARGET; THE SILHOUETTE'S BRACKET RED WITH IT
# (operator 2026-09-23, docs/asks/2026-09-23_reticle_white_red_no_horizon.md). The amber → red designation box of the fire gate is
# doctrine and is untouched: NEAR is aim, never authority. Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.142.html'); DST=os.path.join(DECK,'drone-2525_r.143.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── R143-1 · the green horizon line goes ──
rep("  v.strokeStyle=T13.TAG;v.beginPath();v.moveTo(0,H*.46);v.lineTo(W,H*.46);v.stroke();\n",
    "  /* r.143: the green horizon line is gone (operator) — the world's own wire says where the ground is */\n")

# ── R143-2 · NEAR: the pip on or within 8 px of the locked target — aim, never authority ──
rep("function noLockMsg(){",
    """function reticleNear(){ /* r.143: the locked target when the pip sits on it (a plate's projected outline + 8 px; any other target within 28 px of its centre) */
  const lk=(typeof lockOn==='function')?lockOn():null; if(!lk||!lk.ref) return null; const W=view.width,H=view.height,px=W/2,py=H*.46,m=8;
  if(lk.ref.form&&typeof plateRect==='function'){ const r=plateRect(lk.ref); if(!r) return null; return (Math.abs(px-r.cx)<=r.half+m&&py>=r.top-m&&py<=r.bot+m)?lk:null; }
  const w=worldOf(lk.ref); const pr=proj([w.x,w.y,w.z],camOf(units[state.unit]),W,H); return (pr&&Math.hypot(pr.x-px,pr.y-py)<=28)?lk:null; }
function noLockMsg(){""")

# ── R143-3 · the bullseye is white; red only when near ──
rep("  const lk=lockOn();\n  const col=lk?T13.LOCK:T13.TAG;\n  hc.save();",
    "  const lk=lockOn(); const near=reticleNear(); state.reticleNear=near?near.id:null;\n  const col=near?T13.LOCK:T13.SI; /* r.143: a white bullseye that turns red when the pip is on a target (operator); the palette's white is SI */\n  hc.save();")
rep("    if(!isHot){ hc.strokeStyle=T13.SI; hc.lineWidth=1; hc.beginPath();",
    "    if(!isHot){ hc.strokeStyle=(near&&near.id===q.id)?T13.LOCK:T13.SI; hc.lineWidth=1; hc.beginPath(); /* r.143: the bracket turns red with the bullseye */")

# ── QA rows ──
rep("    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',",
    """    { state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; /* a red box left by the miss row would hold LOCK by design (hysteresis) */ const q=platesHere().find(p=>p.base==='C-100C'); aimPlate(q,0); const onT=reticleNear(); aimPlate(q,30); const offT=reticleNear(); /* 30 px: clear of the 100 C's outline + 8 px, short of the 100 R at +69 px */ u0.pan+=25; const away=reticleNear();
      push('RETICLE_RED_NEAR_TARGET', !!onT&&onT.id===q.id&&!offT&&!away, 'the bullseye is white; on the 100 m F it is red ('+(onT?onT.id:'none')+'), 30 px beside it white, 25° away white — aim, never authority');
      aimPlate(q,0); const lk1=lockOn(); push('LOCK_IS_THE_THING_IN_THE_CROSSHAIR', !!lk1&&lk1.id===q.id, 'with every target up, LOCK names the 100 m F under the pip, not the nearer 50 beside it ('+(lk1?lk1.id:'none')+')'); }
    { try{ const vc=document.getElementById('view'); const ctx=vc.getContext('2d'); const y=Math.round(vc.height*.46); const xs=[3,Math.round(vc.width/4),Math.round(vc.width*3/4),vc.width-3]; const green=xs.filter(x=>{ const d=ctx.getImageData(x,y,1,1).data; return d[1]>d[0]+60&&d[1]>d[2]+60; });
      push('NO_HORIZON_LINE', green.length===0&&!/lineTo\\(W,H\\*\\.46\\)/.test(draw.toString()), 'no green line across the picture at the horizon ('+xs.length+' samples, '+green.length+' green)'); }catch(e){ push('NO_HORIZON_LINE', false, 'could not read the picture: '+String(e).slice(0,60)); } }
    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',""")

# ── LOCK is the thing in the crosshair (r.130 invariant) — with every target up, the nearest-in-cone rule named the 50 while the pip sat on the 100 ──
rep("  if(+state.challenge===0 && u.kind==='turret' && typeof platesHere==='function'){ let pb=null,pd=1e9;",
    "  if(+state.challenge===0 && u.kind==='turret' && typeof platesHere==='function'){ { let ub=null,ud=1e9; const W=view.width,H=view.height,px=W/2,py=H*.46,m=8; platesHere().forEach(p=>{ if(!p.up||(p.fall||0)>0.25||p.lifePct<=0) return; const r=plateRect(p); if(!r) return; if(Math.abs(px-r.cx)<=r.half+m&&py>=r.top-m&&py<=r.bot+m){ const s2=sc(worldOf(p)); if(s2.dist<ud){ ud=s2.dist; ub={id:p.id,dist:s2.dist,kind:'pop',ref:p,lane:p.lane}; } } }); if(ub) return ub; } /* r.143: the plate under the pip wins over a nearer plate beside it — LOCK is the thing in the crosshair */ let pb=null,pd=1e9;")
c=s.count("revision:'0.142'"); rep("revision:'0.142'","revision:'0.143'",c)
h=s.count("r0.142"); rep("r0.142","r0.143",h)
for dead in ["v.moveTo(0,H*.46);v.lineTo(W,H*.46)","const col=lk?T13.LOCK:T13.TAG;"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

# r.150 -> r.151 — POP-UP TARGETS FIRE AGAIN (operator: "pop-up targets no longer work"; the 48-agent fleet's r.147 order,
# MoT 1 item 5 "one under the pip"). Invariant, in the player's terms: IF YOU CAN LOCK IT YOU CAN FIRE IT. r.150's FIRE gate
# taught every path to spend a round only with the bullseye on the red box; its non-plate branch projected worldOf(tgt) — a
# pop's BASE, y≈1.2 — and accepted only within 32 px of the pip, but a pop is DRAWN at body-centre p.y+1.2 (≈2.4) and the LOCK
# reaches LOCK_REACH_PX (48 px). So a TURRET / CAPITAL lawn pop could be marked and approved (the LOCK reached it) yet FIRE was
# refused TARGET_OFF_PICTURE — "pop-up targets no longer work." Range plates (tgt.form) use pipOn and were never affected.
# The fix is one value: the non-plate FIRE tolerance becomes LOCK_REACH_PX, so the gate accepts exactly what the LOCK accepts.
# Scope is strict — pipOn, the lock, the draw and plate handling are untouched. A new boot-QA row FIRE_HITS_A_POP proves it end
# to end: a lawn pop, marked and approved, the bullseye on its drawn silhouette (its base past 32 px, within LOCK_REACH_PX) —
# FIRE now spends a round where r.150 refused; and on the base a FIRE lands a HIT with SIM-ACTION on the record. Every
# replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.150.html'); DST=os.path.join(DECK,'drone-2525_r.151.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── 1 · THE FIX · the FIRE gate's non-plate branch accepts what the LOCK accepts (LOCK_REACH_PX, not 32) ──
rep("pr.y>=0&&pr.y<=H&&Math.hypot(pr.x-W/2,pr.y-H*.46)<=32; } }",
    "pr.y>=0&&pr.y<=H&&Math.hypot(pr.x-W/2,pr.y-H*.46)<=LOCK_REACH_PX; } } /* r.151: a pop the LOCK reaches (LOCK_REACH_PX) is fireable — its base is 1.2 m below the drawn silhouette, so 32 px refused a marked, approved lawn pop and 'pop-up targets no longer worked' */")

# ── 2 · the boot-QA row that proves it: a lawn pop fires again, and lands on the base ──
rep("""      push('FIRE_ON_THE_BOX_STILL_HITS', (state.rangeHit|0)===h0+1&&r3===r2-1, 'bullseye back on the 50 L: FIRE → HIT · rounds '+r2+'→'+r3);
      state.desig=null; state.tgtSlot={}; state.hiApproved=false; }""",
"""      push('FIRE_ON_THE_BOX_STILL_HITS', (state.rangeHit|0)===h0+1&&r3===r2-1, 'bullseye back on the 50 L: FIRE → HIT · rounds '+r2+'→'+r3);
      state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    { /* r.151 · FIRE HITS A POP — a TURRET lawn pop the LOCK reaches (≤LOCK_REACH_PX) but r.150 refused to fire (32 px against the base, 1.2 m below the drawn silhouette). */
      const svU=state.unit, svC=state.challenge, svM=state.mode, svV=state.viewMode, svZ=state.zoom, svRM=state.rangeMode, svLane=state.lane, svSD=state.simDirect;
      state.challenge=1; state.mode='turret'; state.unit=units.T01?'T01':(units.T1?'T1':state.unit); state.viewMode='op'; state.zoom=1; state.simDirect=false; state.lane=0;
      state.desig=null; state.tgtSlot={}; state.hiApproved=false; pops.forEach(p=>p.up=false);
      const uu=units[state.unit], W=view.width, H=view.height; const pp=pops[0]; pp.x=0; pp.y=1.2; pp.z=60; pp.up=true; pp.life=9; pp.lifePct=100; pp.fall=0; pp.mist=false; pp._hit=false; pp.holes=[];
      if(!state.mag) magLoad('INIT');
      /* A · bullseye on the DRAWN silhouette: its base sits 40 px off the pip, past r.150's 32 and within LOCK_REACH_PX */
      aimUnitAt(uu,pp,-40,40); uu.pan+=Math.atan2(40,focalPx())*180/Math.PI;
      const wb=worldOf(pp), prb=proj([wb.x,wb.y,wb.z],camOf(uu),W,H); const dHi=prb?Math.hypot(prb.x-W/2,prb.y-H*.46):999;
      designate({id:pp.id,kind:'pop',ref:pp},'QA'); approveDesig('HI-2'); const redA=!!(state.desig&&state.desig.phase==='red'&&state.desig.id===pp.id);
      const rA0=state.mag.rounds|0, eA=(state.events||[]).length; fireN(1); const rA1=state.mag.rounds|0, evA=(state.events||[]).slice(eA);
      const spentA=rA1===rA0-1, offA=evA.some(e=>e&&e.verb==='REJECT'&&e.result==='TARGET_OFF_PICTURE'), actA=evA.some(e=>e&&(e.verb==='HIT'||e.verb==='MISS'||e.verb==='SIM-ACTION'));
      /* B · bullseye on the base → a HIT with the round spent and SIM-ACTION on the record */
      pp.up=true; pp.lifePct=100; pp.fall=0; pp._hit=false; state.desig=null; state.tgtSlot={}; state.hiApproved=false; aimUnitAt(uu,pp,-40,40);
      const wb2=worldOf(pp), prb2=proj([wb2.x,wb2.y,wb2.z],camOf(uu),W,H); const dLo=prb2?Math.hypot(prb2.x-W/2,prb2.y-H*.46):999;
      designate({id:pp.id,kind:'pop',ref:pp},'QA'); approveDesig('HI-2');
      const rB0=state.mag.rounds|0, eB=(state.events||[]).length; fireN(1); const rB1=state.mag.rounds|0, evB=(state.events||[]).slice(eB);
      const spentB=rB1===rB0-1, hitB=evB.some(e=>e&&(e.verb==='HIT'||e.verb==='SIM-ACTION')), offB=evB.some(e=>e&&e.verb==='REJECT'&&e.result==='TARGET_OFF_PICTURE');
      push('FIRE_HITS_A_POP', redA&&dHi>32&&dHi<=LOCK_REACH_PX&&spentA&&!offA&&actA&&dLo<=32&&spentB&&hitB&&!offB, 'a turret lawn pop, marked+approved: bullseye on the drawn silhouette (base '+dHi.toFixed(0)+' px below the pip, past 32 within '+LOCK_REACH_PX+') FIRE spends a round ('+rA0+'→'+rA1+') where r.150 refused; on the base ('+dLo.toFixed(0)+' px) FIRE → HIT/SIM-ACTION ('+rB0+'→'+rB1+')');
      pp.up=false; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.unit=svU; state.challenge=svC; state.mode=svM; state.viewMode=svV; state.zoom=svZ; state.rangeMode=svRM; state.lane=svLane; state.simDirect=svSD; }""")

# ── 3 · the deck declares itself r.151 (BUILD const + the header span + the two carried-note strings) ──
c=s.count("revision:'0.150'"); rep("revision:'0.150'","revision:'0.151'",c)
h=s.count("r0.150"); rep("r0.150","r0.151",h)

for dead in ["Math.hypot(pr.x-W/2,pr.y-H*.46)<=32; } }","revision:'0.150'","r0.150"]:
    if dead in s: raise SystemExit(f'REFUSE: stale symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

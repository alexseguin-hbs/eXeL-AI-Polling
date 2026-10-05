# r.164 -> r.165 — reselect to approve, and a shot target goes away (operator 2026-10-05, ASK.md Addendum 22 + 23, verbatim:
# "target is not allowing to be reselected to approve ; test throughally" · "Splash stays way too long" · "targets do not disappear when shot").
#  1. THE "SPLASH" THAT STAYED was not the splash: the red damage ring over the current mark (lifePct < 100) was drawn on a target that was DOWN, and
#     since r.162 the mark stays — so a ring ~2.6 m wide sat on the fallen target until it stood again. The ring now shows only on a standing target.
#  2. RESELECT TO APPROVE: SPACE and RIGHT CLICK first make the mark under the bullseye (or the clicked one) the current mark, then approve it; they used
#     to stop at "RED · FIRE" when the current mark was a different, red target. A TAP on a marked target focuses it (it re-marked it, demoting red to
#     amber); a DOUBLE-TAP fires any red mark it lands on. Marking again never re-makes a mark.
#  3. TRAIN DOWN remembers marks as TRAIN UP and QUAL 40 do (a new mark no longer drops an earlier unapproved one); only the hit target's mark ends.
#  QA RESELECT_TO_APPROVE (every door, all three modes), NO_RING_ON_A_DOWN_TARGET; MARKS_ARE_REMEMBERED's TRAIN DOWN half made strict.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.164.html'); DST=os.path.join(DECK,'drone-2525_r.165.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
# 1 · the damage ring only on a standing target
rep("    if(o.lifePct!=null && o.lifePct<100){\n      const r=0.6+ (100-o.lifePct)*0.02;",
    "    if(o.lifePct!=null && o.lifePct<100 && o.lifePct>0 && o.up!==false){ /* r.165 (Addenda 22–23): never on a target that is down — it read as a splash that never ended */\n      const r=0.6+ (100-o.lifePct)*0.02;")
# 3 · marks persist in all three range modes; a hit target keeps its mark only where it stands again
rep("function marksPersist(){ const m=state.rangeMode||'bounce'; return chNum()===0&&(m==='bounce'||m==='qual40')&&!(state.lobby&&state.lobby.phase==='LIVE'); }",
    "function marksPersist(){ return chNum()===0&&!(state.lobby&&state.lobby.phase==='LIVE'); } /* r.165: TRAIN UP, TRAIN DOWN and QUAL 40 all remember marks (Addendum 15); a room keeps per-shot approval */\nfunction modeReturns(){ const m=state.rangeMode||'bounce'; return m==='bounce'||m==='qual40'; } /* a target stands again in TRAIN UP and QUAL 40; in TRAIN DOWN a hit is for good */")
rep("function keepsMark(q){ if(!q||!q.form||!marksPersist()) return false;","function keepsMark(q){ if(!q||!q.form||!marksPersist()||!modeReturns()) return false;")
# 2 · SPACE / RIGHT CLICK: focus the mark under the bullseye (or the clicked target) first
rep("function pcTargetApprove(obj){","function pcTargetApprove(obj){ /* r.165 (Addendum 22): reselect first — the target clicked, else the one under the bullseye */\n  { const lk=obj||lockOn(); const k=lk&&markSlotOf(lk.id); if(k&&(!state.desig||state.desig.id!==lk.id)) focusMark(k); else if(lk&&!k&&state.desig&&state.desig.id!==lk.id){ state.slot=state.slot||1; if(obj) designate({id:obj.id,kind:obj.kind,ref:obj.ref},SID); else markLock(lk,'KEY'); return state.desig&&state.desig.id===lk.id?'target':'none'; } }")
# designate: a target already marked is focused, never re-made (a re-mark demoted red to amber)
rep("  if(ref&&(ref.up===false||ref.lifePct<=0)){ toast('THAT TARGET IS DOWN · MARK ANOTHER'); return; } /* r.134: no mark on a dead target */",
    "  if(ref&&(ref.up===false||ref.lifePct<=0)){ toast('THAT TARGET IS DOWN · MARK ANOTHER'); return; } /* r.134: no mark on a dead target */\n  { const ex0=markSlotOf(obj.id); if(ex0&&marksPersist()&&ownMark(state.tgtSlot[ex0])){ const d0=focusMark(ex0); toast('T'+ex0+' · '+plateWord(obj.id)+(d0.phase==='red'?' · RED · PRESS FIRE':' · AMBER · PRESS APPROVE')); list(); return; } } /* r.165: a marked target is focused, never re-made */")
# tap / double-tap on any marked target
rep("    const on=pickNear(sx,sy); if(!(on&&state.desig&&on.id===state.desig.id)){",
    "    const on=pickNear(sx,sy); { const kd=on&&markSlotOf(on.id); if(kd&&(!state.desig||state.desig.id!==on.id)) focusMark(kd); } /* r.165: a double-tap fires any red mark it lands on */ if(!(on&&state.desig&&on.id===state.desig.id)){")
rep("  if(state.desig&&state.desig.id===obj.id){ toast('T'+(state.desig.slot||1)",
    "  { const kt=markSlotOf(obj.id); if(kt&&(!state.desig||state.desig.id!==obj.id)) focusMark(kt); } /* r.165: a tap on a marked target makes it the current mark */\n  if(state.desig&&state.desig.id===obj.id){ toast('T'+(state.desig.slot||1)")
# the strict TRAIN DOWN half of MARKS_ARE_REMEMBERED
rep("['C-100L','C-150R'].forEach(b=>{ look(b); markLock(lockOn(),'QA'); approveDesig('HI-2'); }); look('C-100L'); fireN(state.slot||1); for(let i=0;i<30;i++) rangeTick(0.05); const downGone=ph('C-100L')==='none'&&ph('C-150R')==='red';",
    "['C-100L','C-150R'].forEach(b=>{ look(b); markLock(lockOn(),'QA'); approveDesig('HI-2'); }); const bothRed=ph('C-100L')==='red'&&ph('C-150R')==='red'; const hD=state.rangeHit|0; look('C-100L'); fireN(state.slot||1); const hitD=(state.rangeHit|0)===hD+1; for(let i=0;i<30;i++) rangeTick(0.05); const downGone=bothRed&&hitD&&ph('C-100L')==='none'&&ph('C-150R')==='red'; /* r.165: strict — both marked and red before the shot, the shot lands */")
ROW=r'''    { /* r.165 · RESELECT_TO_APPROVE (Addendum 22, "test throughally") — every door, in TRAIN UP, TRAIN DOWN and QUAL 40 · NO_RING_ON_A_DOWN_TARGET */
      const l0=state.lane, z0=state.zoom, s0=state.unit, qaA=state.qaArmed, S0=state._qaSilent, sd0=state.simDirect, m0=state.rangeMode; state._qaSilent=true; state.qaArmed=true; state.simDirect=false; state.lane=20; parkRangeTurrets(); state.unit='T21'; const uu=units['T21']; state.zoom=1;
      const look=b=>{ const q=plateOf(20,b); aimUnitAt(uu,q,-40,40); state.aimRef=q; return q; }; const ph=b=>{ const k=markSlotOf(plateOf(20,b).id); return k?state.tgtSlot[k].phase:'none'; };
      const res=[]; const run=(mode)=>{ state.rangeMode=mode; rangeReset(); if(mode==='qual40') qualResetTower(); state.desig=null; state.tgtSlot={};
        const bs=mode==='qual40'?['C-50','C-100C']:['C-50L','C-50','C-100L','C-100C','C-100R']; if(mode==='qual40'){ bs.forEach(b=>{ const q=plateOf(20,b); q.up=true; q.lifePct=100; q.fall=0; q._eng=false; }); const R=rangeRun(20); R.phase='up'; R.cur=bs.map(b=>plateOf(20,b).id); R.t=0; }
        bs.forEach(b=>{ look(b); markLock(lockOn(),'QA'); }); const marked=bs.every(b=>ph(b)==='amber');
        look(bs[0]); pcTargetApprove(null); const space1=ph(bs[0])==='red';             /* SPACE on T1 */
        look(bs[1]); const r2=pcTargetApprove(null); const space2=ph(bs[1])==='red'&&r2==='approve'; /* SPACE on T2 while T1 is red — the reported bug */
        let rclick=true, tbtn=true, voice=true, tapKeep=true;
        if(bs.length>=5){ const o3=plateOf(20,bs[2]); look(bs[0]); pcTargetApprove({id:o3.id,kind:'pop',ref:o3}); rclick=ph(bs[2])==='red';   /* RIGHT CLICK on T3 with the bullseye elsewhere */
          look(bs[3]); approveDesig('HI-2'); tbtn=ph(bs[3])==='red';                                             /* APPROVE button on T4 */
          look(bs[4]); voiceAct('approve'); voice=ph(bs[4])==='red';                                              /* voice "approve" on T5 */
          look(bs[0]); designate({id:plateOf(20,bs[0]).id,kind:'pop',ref:plateOf(20,bs[0])},SID); tapKeep=ph(bs[0])==='red'&&state.desig&&state.desig.id===plateOf(20,bs[0]).id; } /* a re-mark never demotes red */
        const h0=state.rangeHit|0; look(bs[1]); fireN(state.slot||1); const fired=(state.rangeHit|0)===h0+1;
        res.push(mode+': marked '+marked+' · space T1 '+space1+' · space T2 after T1 red '+space2+' · right click '+rclick+' · approve button '+tbtn+' · voice '+voice+' · re-mark keeps red '+tapKeep+' · fire '+fired);
        return marked&&space1&&space2&&rclick&&tbtn&&voice&&tapKeep&&fired; };
      const okU=run('bounce'), okD=run('stay'), okQ=run('qual40');
      state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; const qd=look('C-100L'); markLock(lockOn(),'QA'); approveDesig('HI-2'); fireN(state.slot||1); for(let i=0;i<30;i++) rangeTick(0.05); const dd0=state.drawDone; let ringSegs=-1; { const before=state.segs; try{ const sg0=state.segs; draw(); }catch(e){} } 
      const o=state.desig&&state.desig.ref; const ringWould=!!o&&o.lifePct!=null&&o.lifePct<100&&o.lifePct>0&&o.up!==false; const downNow=!!o&&o.up===false; state.drawDone=dd0;
      state.desig=null; state.tgtSlot={}; state.aimRef=null; state.unit=s0; state.lane=l0; state.zoom=z0; state.qaArmed=qaA; state._qaSilent=S0; state.simDirect=sd0; state.rangeMode=m0; qualResetTower(); parkRangeTurrets(); rangeReset();
      push('RESELECT_TO_APPROVE', okU&&okD&&okQ, res.join(' || '));
      push('NO_RING_ON_A_DOWN_TARGET', downNow&&!ringWould&&/o\.up!==false\)\{ \/\* r\.165/.test(draw.toString()), 'the hit target is down and still marked ('+downNow+'); the damage ring is not drawn on it ('+!ringWould+')'); }
'''
rep("    { /* r.157 · START_LIGHT_WORDS", ROW+"    { /* r.157 · START_LIGHT_WORDS")
rep("  if(d&&d.phase!=='red'&&(!obj||obj.id===d.id)){ approveDesig('HI-2'); return 'approve'; }","  if(d&&d.phase!=='red'&&(!obj||obj.id===d.id)){ approveDesig('HI-2', obj?(markSlotOf(obj.id)||undefined):undefined); return 'approve'; } /* r.165: a right click approves the target clicked, not whatever the bullseye reads */")
c=s.count("revision:'0.164'"); rep("revision:'0.164'","revision:'0.165'",c)
h=s.count("r0.164"); rep("r0.164","r0.165",h)
for dead in ["revision:'0.164'","r0.164"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

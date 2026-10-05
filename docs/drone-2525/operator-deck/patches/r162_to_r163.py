# r.162 -> r.163 — T-numbers in marking order; approve and fire by number (operator 2026-10-05, ASK.md Addendum 18, verbatim:
# "we need T1, T2, T3 as order of targets gets labeled.  So I can Approve T3 and Fire T3, or Approve T1, Approve T3 and Fire 1").
#  1. A new mark takes the next number after the highest one standing (T1, T2, T3 … in the order they were marked); a target already marked keeps
#     its number; RESTART starts again at T1.
#  2. KEYS 1–9: with TN standing, the key turns the head onto TN and makes it the mark SPACE approves and F fires (3 · SPACE · F = approve T3, fire T3).
#     With no TN, keys 1–3 keep their r.148 meaning (mark the Nth target nearest the bullseye).
#  3. VOICE: "approve 3" / "approve T3" approves T3 wherever it is; "fire 1" / "fire T1" turns onto T1 and fires it only if it is red; "target 3"
#     goes to T3 when it exists; "target" marks what the bullseye is on; "reload" reloads. One parser (voiceCmd) for every phrase; negations hold.
#  4. (Addendum 21: "Splash now stays too long after firing.") The splash was timed on the game clock, which runs slow below 20 fps (dt is capped at
#     0.05 s); it is now 0.3 s of wall-clock time. QA SPLASH_IS_SHORT.
#  Doctrine unchanged: FIRE still refuses anything not red and anything the bullseye is not on. QA T_NUMBERS_IN_MARKING_ORDER, VOICE_BY_NUMBER.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.162.html'); DST=os.path.join(DECK,'drone-2525_r.163.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
rep("""  const used=new Set(Object.keys(state.tgtSlot||{}).map(Number));
  let n=state.slot||1;
  if(used.has(n) && state.tgtSlot[n] && state.tgtSlot[n].id!==obj.id){
    n=1; while(n<=99 && used.has(n)) n++;
    if(n>99) n=1;
  }""","""  let n; { const ex=markSlotOf(obj.id); if(ex) n=+ex; else { const ks=Object.keys(state.tgtSlot||{}).map(Number).filter(x=>x>0); n=ks.length?Math.max(...ks)+1:1; } } /* r.163 (Addendum 18): T-numbers count up in the order targets are marked; a marked target keeps its number */""")
rep("function voiceSync(){",r'''function goToT(n){ /* r.163 (Addendum 18): TN becomes the mark SPACE approves and F fires; the head turns onto it */
  const k=String(n); const sl=state.tgtSlot&&state.tgtSlot[k]; if(!sl) return null; focusMark(k); const u=units[state.unit]; if(u&&sl.ref){ aimUnitAt(u,sl.ref,-40,40); state.aimRef=sl.ref; state.aimKind=kindOfRef(sl.ref); }
  toast('T'+n+' · '+plateWord(sl.id)+' · '+(sl.phase==='red'?'RED · PRESS FIRE':'AMBER · PRESS APPROVE')); list(); return sl; }
function approveN(n){ const k=String(n); const sl=state.tgtSlot&&state.tgtSlot[k]; if(!sl){ toast('NO T'+n+' · MARK IT FIRST'); return false; } if(sl.phase==='red'){ toast('T'+n+' IS ALREADY RED'); return false; } approveDesig('HI-2',k); return !!(state.tgtSlot[k]&&state.tgtSlot[k].phase==='red'); } /* r.163: approve TN wherever it is — a human decision, not an aim */
function fireTN(n){ const sl=goToT(n); if(!sl){ toast('NO T'+n+' · MARK IT FIRST'); return false; } fireN(+n); return true; } /* r.163: turn onto TN, then the one fire gate (red, and the bullseye on it) */
function voiceCmd(t){ /* r.163: one parser for every spoken phrase — returns true when it acted or held */
  const W={one:1,two:2,to:2,too:2,three:3,four:4,for:4,five:5,six:6,seven:7,eight:8,nine:9}; const num=x=>x==null?null:(W[x]||(+x||null));
  if(/\b(?:hold|cease|check|stop|don'?t|do not|no|not)\b/.test(t)){ toast('VOICE HOLD'); log('VOICE','HOLD',t); return true; }
  let m=t.match(/\bapprove[ds]?\s*(?:t\s*)?(one|two|to|too|three|four|for|five|six|seven|eight|nine|[1-9])\b/); if(m){ approveN(num(m[1])); return true; }
  m=t.trim().match(/^(?:fire|f)\s*(?:t\s*)?(one|two|to|too|three|four|for|five|six|seven|eight|nine|[1-9])$/); if(m){ fireTN(num(m[1])); return true; }
  m=t.match(/\b(?:target|t)\s*(one|two|to|too|three|four|for|five|six|seven|eight|nine|[1-9])\b/); if(m){ const k=num(m[1]); if(state.tgtSlot&&state.tgtSlot[String(k)]) goToT(k); else if(k<=3) targetN(k); else toast('NO T'+k); return true; }
  if(/\breload\b/.test(t)){ magReload(); return true; }
  return false; }
function voiceSync(){''')
rep("    log('VOICE','',t);","    log('VOICE','',t); if(voiceCmd(t)) return; /* r.163: numbered phrases first; the rest below as before */")
for d in range(1,10):
    old=f"  if(e.code==='Digit{d}'||e.code==='Numpad{d}')targetN({d});" if d<=3 else None
    if old: rep(old,f"  if(e.code==='Digit{d}'||e.code==='Numpad{d}'){{ if(state.tgtSlot&&state.tgtSlot['{d}']) goToT({d}); else targetN({d}); }} /* r.163: key N goes to TN when it stands */")
rep("  if(e.code==='KeyR'){e.preventDefault();magReload();}","  { const dm=e.code.match(/^(?:Digit|Numpad)([4-9])$/); if(dm&&state.tgtSlot&&state.tgtSlot[dm[1]]) goToT(+dm[1]); } /* r.163: keys 4–9 go to T4–T9 */\n  if(e.code==='KeyR'){e.preventDefault();magReload();}")
ROW=r'''    { /* r.163 · T_NUMBERS_IN_MARKING_ORDER + VOICE_BY_NUMBER (Addendum 18) */
      const l0=state.lane, z0=state.zoom, s0=state.unit, qaA=state.qaArmed, S0=state._qaSilent, sd0=state.simDirect, m0=state.rangeMode; state._qaSilent=true; state.qaArmed=true; state.simDirect=false; state.lane=20; parkRangeTurrets(); state.unit='T21'; const uu=units['T21']; state.zoom=1;
      const look=b=>{ const q=plateOf(20,b); aimUnitAt(uu,q,-40,40); state.aimRef=q; return q; }; const T=k=>state.tgtSlot[String(k)]; const idOf=b=>plateOf(20,b).id;
      state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.slot=2;
      ['C-200L','C-100L','C-150R'].forEach(b=>{ look(b); markLock(lockOn(),'QA'); }); const order=!!T(1)&&!!T(2)&&!!T(3)&&T(1).id===idOf('C-200L')&&T(2).id===idOf('C-100L')&&T(3).id===idOf('C-150R');
      look('C-100L'); markLock(lockOn(),'QA'); const keeps=Object.keys(state.tgtSlot).length===3&&T(2).id===idOf('C-100L');
      approveN(3); approveN(1); const reds=T(3).phase==='red'&&T(1).phase==='red'&&T(2).phase==='amber';
      look('C-150R'); const h0=state.rangeHit|0; fireTN(1); const fired1=(state.rangeHit|0)===h0+1; const r0=state.mag.rounds; fireTN(2); const amberRefused=(state.rangeHit|0)===h0+1&&state.mag.rounds===r0;
      for(let i=0;i<(RETURN_S+1.2)*20;i++) rangeTick(0.05);
      voiceCmd('approve t2'); const v1=T(2).phase==='red'; look('C-200L'); voiceCmd('fire two'); const v2=(state.rangeHit|0)===h0+2; voiceCmd("don't fire three"); const v3=(state.rangeHit|0)===h0+2;
      state.desig=null; state.tgtSlot={}; state.aimRef=null; state.unit=s0; state.lane=l0; state.zoom=z0; state.qaArmed=qaA; state._qaSilent=S0; state.simDirect=sd0; state.rangeMode=m0; parkRangeTurrets(); rangeReset();
      push('T_NUMBERS_IN_MARKING_ORDER', order&&keeps&&reds&&fired1&&amberRefused, 'marked 200 L, 100 L, 150 R → T1 · T2 · T3 in that order '+order+' · re-marking 100 L keeps T2 '+keeps+' · approve T3, approve T1 '+reds+' · fire 1 from the 150 R turned onto T1 and hit '+fired1+' · fire 2 on amber refused, no round '+amberRefused);
      push('VOICE_BY_NUMBER', v1&&v2&&v3, '"approve t2" turned T2 red '+v1+' · "fire two" turned onto T2 and hit '+v2+' · "don\'t fire three" held '+v3); }
'''
rep("    { /* r.157 · START_LIGHT_WORDS", ROW+"    { /* r.157 · START_LIGHT_WORDS")
# ── Addendum 21: the splash stays too long — it was timed on the game clock, which runs slow when the frame rate drops (dt is capped at 0.05 s) ──
rep("state.fx={t:state.clock,id,direct:true,ref:o}","state.fx={t:state.clock,id,direct:true,ref:o,w:performance.now()}",2)
rep("state.fx={t:state.clock,id,direct:true,ref}","state.fx={t:state.clock,id,direct:true,ref,w:performance.now()}")
rep("  if(state.fx && state.clock-state.fx.t<0.45){\n    const f=state.fx, k=1-(state.clock-f.t)/0.45, c=splashBase(f);",
    "  if(state.fx && splashAge(state.fx)<SPLASH_MS){\n    const f=state.fx, k=1-splashAge(f)/SPLASH_MS, c=splashBase(f); /* r.163 (Addendum 21): wall-clock time, 0.3 s — the game clock ran slow on a busy PC and the splash hung */")
rep("function splashBase(f){","const SPLASH_MS=300; function splashAge(f){ return f&&f.w!=null?performance.now()-f.w:(state.clock-(f?f.t:0))*1000; } /* r.163 (Addendum 21) */\nfunction splashBase(f){")
ROW5=r"""    { /* r.163 · SPLASH_IS_SHORT (Addendum 21) — 0.3 s of real time, whatever the frame rate */
      const q=plateOf(state.lane||0,'C-100C')||platesHere()[0]; const dd0=state.drawDone; let on=0, off=0;
      state.fx={t:state.clock,id:q.id,direct:true,ref:q,w:performance.now()}; state.fxSegs=0; try{ draw(); on=state.fxSegs|0; }catch(e){}
      state.fx={t:state.clock,id:q.id,direct:true,ref:q,w:performance.now()-(SPLASH_MS+50)}; state.fxSegs=0; try{ draw(); off=state.fxSegs|0; }catch(e){}
      state.fx=null; state.drawDone=dd0;
      push('SPLASH_IS_SHORT', SPLASH_MS===300&&on>0&&off===0, 'the splash draws at once ('+on+' segments) and is gone '+SPLASH_MS+' ms later on the wall clock ('+off+' segments) — it no longer stretches when the frame rate drops'); }
"""
rep("    { /* r.157 · START_LIGHT_WORDS", ROW5+"    { /* r.157 · START_LIGHT_WORDS")
c=s.count("revision:'0.162'"); rep("revision:'0.162'","revision:'0.163'",c)
h=s.count("r0.162"); rep("r0.162","r0.163",h)
for dead in ["revision:'0.162'","r0.162","let n=state.slot||1;\n  if(used.has(n)"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

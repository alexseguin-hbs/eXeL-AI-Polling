# r.160 -> r.161 — the PC keys always work and the mouse aims (operator 2026-10-05, ASK.md Addendum 12 + "ensure click on mouse moves
# position of turret to center bulleye on target", verbatim in the round folder).
#  1. KEYS ALWAYS REACH THE GAME: when a button or a picker holds keyboard focus, T / Space / F / arrows / WASD blur it and do not reach
#     it (a focused button took Space for itself, a picker took the letters). F fires the marked slot even if no slot number was set.
#  2. LEFT CLICK AIMS: a left click on a target turns the turret / gimbal so the bullseye centres on it (aimUnitAt); a left click on blank
#     ground turns the head toward the clicked point; a left click on the red-marked target that is already under the bullseye fires (fireN,
#     which refuses anything not red). RIGHT CLICK aims at the clicked target first, then marks / approves (pcTargetApprove).
#  3. The mark toast says the target in plain words ("150 M RIGHT"), not its id.
# QA KEYS_BEAT_FOCUS, MOUSE_CLICK_CENTRES_THE_BULLSEYE. The fire doctrine is untouched.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.160.html'); DST=os.path.join(DECK,'drone-2525_r.161.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
rep("if(ae&&ae.tagName==='SELECT') ae.blur();","if(ae&&(ae.tagName==='SELECT'||ae.tagName==='BUTTON')&&GAME_KEYS.has(e.code)){ e.preventDefault(); ae.blur(); } else if(ae&&ae.tagName==='SELECT') ae.blur(); /* r.161: the game keys always reach the game — a focused button took Space, a picker took the letters */")
rep("window.addEventListener('keydown',e=>{","const GAME_KEYS=new Set(['Space','KeyT','KeyF','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD']);\nwindow.addEventListener('keydown',e=>{")
rep("if(e.code==='KeyF'&&state.slot)fireN(state.slot);","if(e.code==='KeyF'){e.preventDefault();fireN(state.slot||1);} /* r.161: F fires whether or not a slot number was set */")
rep("  if(e.pointerType==='mouse'&&e.button===0){ fireN(state.slot||1); return; }",
    "  if(e.pointerType==='mouse'&&e.button===0){ mouseAim((d.sx-r.left)*(view.width/r.width),(d.sy-r.top)*(view.height/r.height)); return; } /* r.161: LEFT CLICK centres the bullseye on what you clicked; on the red mark already under it, FIRE */")
rep("if(e.pointerType==='mouse'&&e.button===2&&state.viewMode!=='map'){ const r=view.getBoundingClientRect(); pcTargetApprove(pickNear((e.clientX-r.left)*(view.width/r.width),(e.clientY-r.top)*(view.height/r.height))); return; }",
    "if(e.pointerType==='mouse'&&e.button===2&&state.viewMode!=='map'){ const r=view.getBoundingClientRect(); const ob=pickNear((e.clientX-r.left)*(view.width/r.width),(e.clientY-r.top)*(view.height/r.height)); if(ob&&units[state.unit]){ aimUnitAt(units[state.unit],ob.ref,-40,40); state.aimRef=ob.ref; state.aimKind=ob.kind; } pcTargetApprove(ob); return; } /* r.161: RIGHT CLICK aims at the target, then marks / approves */")
rep("  const W=view.width,H=view.height; const cand=[]; const add=(o,kind,w,cap,extra)=>",
    "  { const a=state.aimRef; if(a&&a.up!==false&&!(a.lifePct<=0)&&pipOn(a,c)){ const s=sc(worldOf(a)); return {id:a.id,dist:s.dist,kind:a.form?'tgt':(state.aimKind||'pop'),ref:a,px:0}; } } /* r.161: the target the mouse just centred is the one T / Space mark, while the bullseye stays on it (overlapping plates at 1x chose the far one) */\n  const W=view.width,H=view.height; const cand=[]; const add=(o,kind,w,cap,extra)=>")
rep("  if(e.code==='KeyT'){e.preventDefault();targetN(((state.slot||0)%99)+1);}","  if(e.code==='KeyT'){e.preventDefault();state.slot=state.slot||1;markLock(lockOn(),'KEY');} /* r.161 (\"T for Target ... do not work\"): T is the TARGET button — it marks what the bullseye is on; it stepped to the next slot on every press and marked a different target */")
rep("  targetN(((state.slot||0)%99)+1); return 'target'; }","  state.slot=state.slot||1; markLock(lockOn(),'KEY'); return state.desig?'target':'none'; }")
rep("function pcTargetApprove(obj){",
r'''function mouseAim(sx,sy){ /* r.161 (operator: "click on mouse moves position of turret to center bulleye on target"): one door for the left click */
  const u=units[state.unit]; if(!u) return 'none'; const obj=pickNear(sx,sy); const d=state.desig;
  if(d&&d.phase==='red'&&obj&&obj.id===d.id&&pipOn(d.ref)){ fireN(state.slot||1); return 'fire'; }
  if(obj){ aimUnitAt(u,obj.ref,-40,40); state.aimRef=obj.ref; state.aimKind=obj.kind; toast('ON '+plateWord(obj.id)+' · RIGHT CLICK OR T TO MARK'); return 'aim'; }
  const W=view.width,H=view.height,f=focalPx(); u.pan=(u.pan||0)+Math.atan((sx-W/2)/f)*180/Math.PI; u.tilt=Math.max(-40,Math.min(20,(u.tilt||0)-Math.atan((sy-H*0.46)/f)*180/Math.PI)); return 'turn'; }
function pcTargetApprove(obj){''')
rep("toast('MIST '+ (id|| (ref&&ref.id||'')) +' · RED ON NET');","toast('MARKED '+plateWord(id|| (ref&&ref.id||''))+' · RED ON NET');")
ROW=r'''    { /* r.161 · KEYS_BEAT_FOCUS + MOUSE_CLICK_CENTRES_THE_BULLSEYE */
      const l0=state.lane, z0=state.zoom; state.lane=20; parkRangeTurrets(); state.rangeMode='bounce'; rangeReset(); const s0=state.unit; state.unit='T21'; const uu=units['T21']; state.zoom=1; state.desig=null; state.tgtSlot={};
      aimUnitAt(uu,plateOf(20,'C-50'),-40,40); const q=plateOf(20,'C-150R'); const cam=camOf(uu); const w=worldOf(q); const pr=proj([w.x,w.y,w.z],cam,view.width,view.height);
      const r1=pr?mouseAim(pr.x,pr.y):'off'; const lk=lockOn(); const centred=pipOn(q)&&!!lk&&lk.id===q.id;
      const pan0=uu.pan; mouseAim(view.width*0.75,view.height*0.46); const turned=uu.pan>pan0;
      const it=document.getElementById('intro'), itD=it?it.style.display:null; if(it) it.style.display='none'; /* the keys are refused behind the intro (r.134); a player meets them with it closed */
      aimUnitAt(uu,q,-40,40); state.aimRef=q; const b=document.getElementById('btnRangeReset')||document.querySelector('button'); if(b) b.focus(); window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyT',key:'t',bubbles:true})); const markedT=!!state.desig&&state.desig.id===q.id; if(b) b.focus(); window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true})); const red=!!state.desig&&state.desig.phase==='red'; const blurred=document.activeElement!==b;
      const h0=state.rangeHit|0; const pr2=proj([w.x,w.y,w.z],camOf(uu),view.width,view.height); const r3=pr2?mouseAim(pr2.x,pr2.y):'off'; const fired=(state.rangeHit|0)===h0+1;
      if(it) it.style.display=itD; if(b) b.blur(); state.aimRef=null; state.desig=null; state.tgtSlot={}; state.unit=s0; state.lane=l0; state.zoom=z0; parkRangeTurrets(); rangeReset();
      push('MOUSE_CLICK_CENTRES_THE_BULLSEYE', r1==='aim'&&centred&&turned&&r3==='fire'&&fired, 'a left click on the 150 M RIGHT: '+r1+' (bullseye on it '+centred+'); a click on blank ground turns the head toward it '+turned+'; a left click on the red mark under the bullseye: '+r3+' (hit '+fired+')');
      push('KEYS_BEAT_FOCUS', markedT&&red&&blurred, 'with a button holding focus, T marked ('+markedT+'), Space approved ('+red+'), the button let go ('+blurred+')'); }
'''
rep("    push('HOLD_ROWS_TRAVEL',", ROW+"    push('HOLD_ROWS_TRAVEL',")
rep(r"/e\.pointerType==='mouse'&&e\.button===0\)\{ fireN\(/.test(src)&&/e\.code==='KeyF'&&state\.slot\)fireN/.test(src)",r"/e\.pointerType==='mouse'&&e\.button===0\)\{ mouseAim\(/.test(src)&&/e\.code==='KeyF'\)\{e\.preventDefault\(\);fireN\(/.test(src)")
c=s.count("revision:'0.160'"); rep("revision:'0.160'","revision:'0.161'",c)
h=s.count("r0.160"); rep("r0.160","r0.161",h)
for dead in ["revision:'0.160'","r0.160","toast('MIST '","&&state.slot)fireN(state.slot)"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

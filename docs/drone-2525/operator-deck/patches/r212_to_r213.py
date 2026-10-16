#!/usr/bin/env python3
# Drone-2525 r.212 -> r.213 — THE MOUSE MOVES THE AIM (DD-74 .. DD-77)
#
#  HIS ASK (2026-10-16, with the deck at r0.212 on his screen):
#    "allow for mouse controller to operate similar to arrows (to move turret arround).  Right click of mouse can
#     operate for Target and Approve, left click to fire.  This will use similar Call of Duty and Battle Field
#     computer operations (think Rainbow 6 and Rogue Spear)."
#  and then, naming the point of it:
#    "Remember the key for this update was using mouse cursor to move the target, for optimized mouse play for
#     turret, that we can later apply to drone and robotics, as well as fixed wing and foil"
#
#  THE HONEST HEADLINE: three of the four behaviours he lists ALREADY SHIP, and have since r.159/r.161 — the right
#  click targets then approves (pcTargetApprove), and the left click fires a red mark under the bullseye
#  (mouseAim). What the deck could not do at ALL is MOVE THE HEAD WITH THE MOUSE: there is drag-look only (a
#  button must be held) and the string "pointerLock" does not occur anywhere in the 1.15 MB file. So this is one
#  listener set, not a rebuild, and the release note says so first.
#
#  INVARIANT (written into the deck as a comment): while the cursor is captured, moving the mouse turns the seated
#  craft's head exactly as the arrows do — the same direction, the same sensitivity dial, the same clamp in phys —
#  and the two buttons are the F and SPACE doors, nothing new. With the cursor free NOTHING changes: every shipped
#  handler is byte-identical and a touch device never reaches a line of this.
#
#  DD-75 · EVERY CRAFT, NOT THE TURRET ALONE. mouseLook mirrors the split phys already makes (the turret scaled by
#  the picture's real half-angle, every other craft at its own rate), so a drone, a robot, a fixed wing or a foil
#  seat inherits mouse play by being seated — no second control path to write when they arrive.
#
#  DD-77 · THE DOOR IS M, NOT A PLAIN CLICK. His two answers collide on one point: the mouselook answer said a
#  click on the stage captures, his left-click answer said that OUTSIDE mouselook a plain click keeps its present
#  meaning. If a plain click captures there is no outside left, and r.161's click-to-aim — his own ask — dies on
#  desktop. The plain click wins; M is the door. Reversible in one word.
#
#  THE SIGN IS DERIVED, NEVER CHOSEN. camOf sets cam.yaw = u.yaw + u.pan and proj puts a point straight ahead at
#  W/2 + sin(yaw)*f/tz, so pan INCREASING slides the world right — the head turned LEFT. The shipped rows
#  TURRET_LOOK_LEFT (:4357) and PAN_RIGHT_MOVES_WORLD_LEFT (:4601) measure exactly that. Likewise tilt increasing
#  looks UP. So "look right" is pan DOWN and "look down" is tilt DOWN — which is the pair of lines the drag-look
#  already ships, and mouseLook reuses them rather than inventing a second convention that could drift from the
#  arrows. MOUSELOOK_TURNS_THE_HEAD_LIKE_THE_ARROWS measures the mouse against the arrows through the real
#  integrator, so the claim is a gate and not a comment.
#
#  THE CAPTURED CLICK IS SWALLOWED IN THE CAPTURE PHASE. Under pointer lock clientX/clientY are frozen, so the
#  shipped right-button fast path would pickNear a point the player is not on. The new listeners are registered
#  capture-phase and stopPropagation while held: the shipped handlers never run, stay byte-identical (so
#  PC_KEYS_AND_MOUSE's four source regexes keep matching), and state.drag / state.ptrs are never populated, so the
#  drag-look and the pinch return at their own first line.
#
#  FROZEN SPANS MOVED: none. Every region touched (GAME_KEYS and the keydown block, mouseAim, pcTargetApprove,
#  controlLaw, phys, the markup, the append zone) is FREE in tests/range-spans.json — checked, not assumed.
#
import hashlib,json,os,re,subprocess,tempfile
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
ROOT=os.path.normpath(os.path.join(DECK,'..','..','..'))
BASE_REV='212'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.213.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.212')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)

# ── M0 · the corner and BUILD read one number ─────────────────────────────────────────────────────────
rep("revision:'0.212'","revision:'0.213'",1)
rep("r0.212","r0.213",1)

# ── M1 · CONTROLS says how, beside the lines it already has (no new box on the picture) ───────────────
rep("""      <div>CLICK / TAP = TARGET (amber) · DOUBLE TAP = FIRE (needs red box)</div>""",
    """      <div>CLICK / TAP = TARGET (amber) · DOUBLE TAP = FIRE (needs red box)</div>
      <div>MOUSE · PRESS M FOR MOUSE LOOK · ESC RELEASES</div>
      <div>IN MOUSE LOOK · MOVE = AIM · RIGHT = TARGET then APPROVE · LEFT = FIRE</div>""",1)

# ── M2 · M is the door, and it reaches the game from a focused button like every other game key ───────
rep("""const GAME_KEYS=new Set(['Space','KeyT','KeyF','KeyR','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD']);""",
    """const GAME_KEYS=new Set(['Space','KeyT','KeyF','KeyR','KeyM','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD']);""",1)
rep("""  if(e.code==='KeyP')spiralTest();""",
    """  if(e.code==='KeyM'){e.preventDefault();lookToggle();} /* r.213 (DD-74/DD-77): M captures the cursor — the mouse then moves the aim as the arrows do; Esc releases. A PLAIN CLICK is not the door: it would leave no "outside mouse look", and r.161's click-to-aim (his own ask) would be unreachable on a desktop for ever. */
  if(e.code==='KeyP')spiralTest();""",1)

# ── M3 · the look itself, in the append zone, hoisted so the boot self-check can read it ──────────────
APPEND = """
/* ── r.213 · MOUSE LOOK (DD-74 … DD-77, operator 2026-10-16) ──────────────────────────────────────────
   "allow for mouse controller to operate similar to arrows (to move turret arround).  Right click of mouse
    can operate for Target and Approve, left click to fire."   …and then, naming the point of it:
   "the key for this update was using mouse cursor to move the target, for optimized mouse play for turret,
    that we can later apply to drone and robotics, as well as fixed wing and foil"

   INVARIANT: while the cursor is captured, moving the mouse turns the SEATED CRAFT's head exactly as the arrows
   do — same direction, same sensitivity dial, same clamp in phys — and the two buttons are the F and SPACE doors,
   nothing new. With the cursor free NOTHING changes: every shipped handler above is untouched and a touch device
   never reaches a line of this.

   DD-75 · EVERY CRAFT. mouseLook mirrors the split phys already makes (turret scaled by the picture's real
   half-angle; every other craft at its own rate), so a drone, a robot, a fixed wing or a foil seat inherits mouse
   play by being seated. There is no second control path to write when they arrive.

   THE SIGN IS DERIVED. camOf sets cam.yaw = u.yaw + u.pan, and proj puts a point straight ahead at
   W/2 + sin(yaw)*f/tz — so pan INCREASING slides the world right, i.e. the head turned LEFT (which is what the
   shipped rows TURRET_LOOK_LEFT and PAN_RIGHT_MOVES_WORLD_LEFT measure). Likewise tilt increasing looks UP.
   "Look right" is therefore pan DOWN and "look down" is tilt DOWN — the pair of lines the drag-look already
   ships, reused here rather than a second convention that could drift from the arrows. */
function lookSens(){ const s=state.sets||{}; return (s.r>0.05?s.r:1); } /* the ONE look dial — R SENS, the same number the arrows and the right stick read. No second slider, no second stored field. */
function lookActive(){ try{ return document.pointerLockElement===view; }catch(_){ return false; } }
function mouseLook(dx,dy){ /* dx,dy are CSS px of mouse travel: movementX / movementY under pointer lock */
  if(state.viewMode==='map') return 'map';                    /* the overhead map has no head to turn */
  const u=units[state.unit]; if(!u) return 'none';
  const zf=(u.kind==='turret')?(fovDeg()/38):1;               /* r.141: the turret's look is scaled by the picture's real half-angle, so the same travel moves the same fraction of the screen at any zoom. Every other craft keeps its own rate — the same split phys makes at its turret / else branches. */
  const k=lookSens()*0.08*zf;
  u.pan-=dx*k; u.tilt-=dy*k;                                  /* phys clamps both on the next frame (turret tilt -80..40, pan normalised) */
  return 'look'; }
function lookFire(){ return fireN(state.slot||1),'fire'; }    /* the left button IS F — the one fire gate, which refuses anything not red and not under the bullseye */
function lookMark(){ return pcTargetApprove(null); }          /* the right button IS SPACE — target, then approve, and it never fires */
function lookToggle(){
  if(!view||!view.requestPointerLock){ toast('MOUSE LOOK NEEDS A DESKTOP BROWSER'); return false; }
  if(lookActive()){ try{ const x=document.exitPointerLock(); if(x&&x.catch) x.catch(function(){}); }catch(_){ } return false; }
  if(state.viewMode==='map'){ toast('MOUSE LOOK · NOT ON THE MAP'); return false; }
  /* in current browsers this RETURNS A PROMISE that rejects when the document is not focused or a lock was just
     released — a bare try/catch would miss it and leave an unhandled rejection on the page the boot QA reads */
  try{ const r=view.requestPointerLock(); if(r&&r.catch) r.catch(function(){ toast('MOUSE LOOK · CLICK THE PICTURE FIRST, THEN M'); }); }catch(_){ }
  return true; }
(function mouseLookWire(){ try{
  if(!view||!view.requestPointerLock) return;
  /* ON WINDOW, CAPTURE PHASE, and only while the cursor is held. Under pointer lock clientX/clientY are frozen,
     so the shipped right-button fast path would pickNear a point the player is not on, and the drag-look would
     read a frozen delta. Swallowing the event before it reaches the canvas leaves state.drag and state.ptrs
     empty, so the drag-look and the pinch return at their own first line, and every shipped handler stays
     byte-identical and simply never runs while mouse look is on.
     WHY WINDOW AND NOT THE CANVAS: at the TARGET node the DOM runs capturing and bubbling listeners in
     REGISTRATION order, so a capture listener added here — after the shipped ones, far below them in the file —
     would still run second and could not pre-empt them. Measured, not assumed: with the swallow on the canvas a
     synthetic pointerdown still set state.drag, and MOUSELOOK_LEAVES_THE_TOUCH_PATH_ALONE read it. On window the
     capture phase reaches us first, one node up, and stopPropagation() keeps the event off the canvas entirely. */
  const swallow=function(e){ if(!lookActive()) return; e.preventDefault(); e.stopPropagation(); };
  window.addEventListener('pointerdown',function(e){ if(!lookActive()) return; e.preventDefault(); e.stopPropagation();
    if(e.button===2) lookMark(); else if(e.button===0) lookFire(); },true);
  window.addEventListener('pointerup',swallow,true);
  window.addEventListener('pointermove',swallow,true);
  document.addEventListener('mousemove',function(e){ if(!lookActive()) return; mouseLook(e.movementX||0,e.movementY||0); },false);
  document.addEventListener('contextmenu',function(e){ if(lookActive()) e.preventDefault(); },true); /* scoped: right-click everywhere else on the page still works */
  document.addEventListener('pointerlockchange',function(){ toast(lookActive()?'MOUSE LOOK ON · MOVE TO AIM · RIGHT TARGETS THEN APPROVES · LEFT FIRES · ESC RELEASES':'MOUSE LOOK OFF'); },false);
  let told=false; /* said ONCE, the first time a mouse is seen on the glass — a toast, so the picture gains nothing */
  view.addEventListener('pointermove',function(e){ if(told||lookActive()||e.pointerType!=='mouse') return; told=true; toast('MOUSE LOOK · PRESS M · ESC RELEASES'); },false);
}catch(e){ try{ log('MOUSE','WIRE',String(e).slice(0,80)); }catch(_){ } } })();
"""
_tail="""  }catch(e){ try{ log('RCORE','WIRE',String(e).slice(0,80)); }catch(_){ } }
})();
"""
rep(_tail,_tail+APPEND,1)

# ── M5 · THE RECORD THE DECK CARRIES, REGENERATED FROM THE LEDGER ────────────────────────────────────
#  r.212's whole subject: a patcher that does not regenerate this block ships a deck whose embedded record is
#  stale, deck-rcore goes red, and because the deck gates run in prebuild the CLOUDFLARE BUILD FALLS WITH IT —
#  which is how r.211 was pushed, reported green, and never served. The gate holds the lag to exactly one AND
#  requires the ledger's last row to name THIS revision, so at r.213's ship the file must end at rev 91 (r.213's
#  own release row, written by the bookkeeping) and the deck must embed through 90.
LEDGER=json.load(open(os.path.join(ROOT,'docs','traceability','drone-2525.ledger.json'),encoding='utf-8'))
THROUGH=len(LEDGER['entries'])
if THROUGH!=90: raise SystemExit('REFUSE: expected the ledger to end at rev 90 (r.212 released); found %d'%THROUGH)
MODEL=re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
_e=[]
for e in LEDGER['entries'][:THROUGH]:
    o={'rev':e['rev'],'date':e['date'],'kind':e['kind'],'text':MODEL.sub('an external model',e.get('text','')),'commit':e.get('commit','')}
    if 'shipped' in e: o['shipped']=e['shipped']
    _e.append(o)
BLOCK=json.dumps({'section':LEDGER['section'],'route':LEDGER['route'],'through':THROUGH,'entries':_e},ensure_ascii=False,separators=(',',':'))
for bad in ['</script','<!--','-->','\u2028','\u2029']:
    if bad in BLOCK: raise SystemExit('REFUSE: the ledger block carries %r, which would break the inline script'%bad)
_old=re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/',s)
if not _old: raise SystemExit('REFUSE: no RCORE_LEDGER block in the r.212 base')
if json.loads(_old.group(1)).get('through')!=89: raise SystemExit('REFUSE: expected the r.212 base to embed through 89')
s=s[:_old.start()]+'/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER='+BLOCK+';/*RCORE_LEDGER_END*/'+s[_old.end():]
n[0]+=1
_new=json.loads(re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/',s).group(1))
if _new['through']!=90 or len(_new['entries'])!=90: raise SystemExit('REFUSE: the embedded block is not through 90')
if json.dumps(_new['entries'],ensure_ascii=False,separators=(',',':'))!=json.dumps(_e,ensure_ascii=False,separators=(',',':')):
    raise SystemExit('REFUSE: the embedded entries are not the ledger entries')

# ── M4 · the three rows, after the r.161 mouse rows they extend ───────────────────────────────────────
ROWS = """
    { /* r.213 (DD-74/DD-75) · MOUSELOOK_TURNS_THE_HEAD_LIKE_THE_ARROWS — "operate similar to arrows (to move turret
         arround)", measured against the arrows through the one control law and the one integrator, so the claim is
         a gate and not a comment. And measured on a DRONE seat too, because his next sentence is that this applies
         to drone and robotics, fixed wing and foil. */
      const l0=state.lane, z0=state.zoom, s0=state.unit, v0=state.viewMode, k0=state.keys, j0={...state.joy}, c0=state.challenge, rl0=state.relinq;
      state.lane=20; parkRangeTurrets(); state.rangeMode='bounce'; rangeReset(); state.unit='T21'; state.zoom=1; state.viewMode='op'; state.challenge=0; state.relinq=false;
      const uu=units['T21']; const sv={pan:uu.pan,tilt:uu.tilt};
      uu.pan=0; uu.tilt=0; state.keys={ArrowRight:true}; state.joy={lx:0,ly:0,rx:0,ry:0}; for(let i=0;i<6;i++) phys(0.05); const aPan=uu.pan;
      uu.pan=0; uu.tilt=0; state.keys={ArrowUp:true};    for(let i=0;i<6;i++) phys(0.05); const aTilt=uu.tilt;
      state.keys={};
      uu.pan=0; uu.tilt=0; const mv=mouseLook(100,0); const mPan=uu.pan;
      uu.pan=0; uu.tilt=0; mouseLook(0,-100); const mTilt=uu.tilt;
      const sr=state.sets.r; state.sets.r=2; uu.pan=0; mouseLook(100,0); const mPan2=uu.pan; state.sets.r=sr;
      /* DD-75, the half of it a sign test cannot see: the TURRET's look is scaled by the picture's real half-angle
         (r.141), so the same travel moves the same FRACTION OF THE SCREEN at any zoom — while every other craft
         keeps its own rate. Measured as it is lived: zoom in and the turret's degrees per 100 px must SHRINK, and
         a QUAD's must not move at all. Without this the row stays green on a deck where the turret is no longer
         scaled, which is exactly what the sabotage pass found. */
      uu.pan=0; state.zoom=3; mouseLook(100,0); const mPanZ=uu.pan; state.zoom=1;
      let drone=0, droneZ=0; const dq=units.D1Q;
      if(dq){ const dsv={pan:dq.pan,tilt:dq.tilt}; state.unit='D1Q'; state.challenge=1;
        dq.pan=0; mouseLook(100,0); drone=dq.pan;
        dq.pan=0; state.zoom=3; mouseLook(100,0); droneZ=dq.pan; state.zoom=1;
        dq.pan=dsv.pan; dq.tilt=dsv.tilt; state.unit='T21'; state.challenge=0; }
      const turretScaled=Math.abs(mPanZ)<Math.abs(mPan)*0.6, droneFlat=Math.abs(droneZ-drone)<0.01;
      uu.pan=sv.pan; uu.tilt=sv.tilt;
      const vm0=state.viewMode; state.viewMode='map'; const onMap=mouseLook(100,0); state.viewMode=vm0;
      const same=(a,b)=>a!==0&&b!==0&&((a<0)===(b<0));
      const src1=document.documentElement.innerHTML;
      const wired1=/document\\.pointerLockElement===view/.test(src1)&&/mouseLook\\(e\\.movementX\\|\\|0,e\\.movementY\\|\\|0\\)/.test(src1)&&/e\\.code==='KeyM'\\)\\{e\\.preventDefault\\(\\);lookToggle\\(\\)/.test(src1);
      state.lane=l0; state.zoom=z0; state.unit=s0; state.viewMode=v0; state.keys=k0; state.joy=j0; state.challenge=c0; state.relinq=rl0; parkRangeTurrets(); rangeReset();
      push('MOUSELOOK_TURNS_THE_HEAD_LIKE_THE_ARROWS', mv==='look'&&same(mPan,aPan)&&same(mTilt,aTilt)&&Math.abs(mPan2)>Math.abs(mPan)*1.9&&drone!==0&&turretScaled&&droneFlat&&onMap==='map'&&wired1,
        'mouse right '+mPan.toFixed(2)+'\\u00b0 vs ArrowRight '+aPan.toFixed(2)+'\\u00b0; mouse up '+mTilt.toFixed(2)+'\\u00b0 vs ArrowUp '+aTilt.toFixed(2)+'\\u00b0; R SENS 2x gives '+mPan2.toFixed(2)+'\\u00b0; a QUAD seat turns '+drone.toFixed(2)+'\\u00b0; at 3x the turret moves '+mPanZ.toFixed(2)+'\u00b0 (scaled by the picture '+turretScaled+') while the QUAD still moves '+droneZ.toFixed(2)+'\u00b0 ('+droneFlat+'); the map has no head ('+onMap+'); M and movementX wired ('+wired1+')'); }
    { /* r.213 (DD-76) · MOUSELOOK_CLICKS_ARE_FIRE_AND_TARGET — inside mouse look the right button IS SPACE and the
         left button IS F, so the three-step gate cannot drift: pcTargetApprove still never fires, and fireN is
         still the one door that refuses anything not red and not under the bullseye. */
      const l0=state.lane, s0=state.unit; state.lane=20; parkRangeTurrets(); state.rangeMode='bounce'; rangeReset(); state.unit='T21'; const uu=units['T21']; state.desig=null; state.tgtSlot={};
      const q=plateOf(20,'C-100C'); aimUnitAt(uu,q,-40,40); state.aimRef=q;
      const m1=lookMark(), p1=state.desig&&state.desig.phase;
      const h0=state.rangeHit|0; lookFire(); const amberHeld=(state.rangeHit|0)===h0;
      const m2=lookMark(), p2=state.desig&&state.desig.phase;
      const m3=lookMark();
      const h1=state.rangeHit|0; lookFire(); const fired=(state.rangeHit|0)===h1+1;
      const src2=document.documentElement.innerHTML;
      const wired2=/if\\(e\\.button===2\\) lookMark\\(\\); else if\\(e\\.button===0\\) lookFire\\(\\);/.test(src2)&&/window\\.addEventListener\\('pointerdown',function\\(e\\)\\{ if\\(!lookActive\\(\\)\\) return;/.test(src2);
      const gate=/pcTargetApprove\\(null\\)/.test(lookMark.toString())&&/fireN\\(state\\.slot\\|\\|1\\)/.test(lookFire.toString());
      state.aimRef=null; state.desig=null; state.tgtSlot={}; state.unit=s0; state.lane=l0; parkRangeTurrets(); rangeReset();
      push('MOUSELOOK_CLICKS_ARE_FIRE_AND_TARGET', m1==='target'&&p1==='amber'&&amberHeld&&m2==='approve'&&p2==='red'&&m3==='red'&&fired&&gate&&wired2,
        'right '+m1+' ('+p1+'), left refused on amber ('+amberHeld+'), right '+m2+' ('+p2+'), right says '+m3+', left HIT ('+fired+'); the two doors are pcTargetApprove and fireN ('+gate+')'); }
    { /* r.213 (his answer: "his phone is completely untouched") · MOUSELOOK_LEAVES_THE_TOUCH_PATH_ALONE — with the
         cursor free, r.161's door is unedited, the shipped handlers are still wired, every new listener asks
         lookActive() first, and a TOUCH pointerdown still reaches the shipped path it always did. */
      const src3=document.documentElement.innerHTML;
      const r161=/RIGHT CLICK OR T TO MARK/.test(mouseAim.toString())&&/return 'turn'/.test(mouseAim.toString());
      const shipped=/e\\.pointerType==='mouse'&&e\\.button===0\\)\\{ mouseAim\\(/.test(src3)&&/e\\.pointerType==='mouse'&&e\\.button===2/.test(src3);
      const asks=(src3.match(/if\\(!lookActive\\(\\)\\) return;/g)||[]).length>=3;
      const upOneNode=/window\\.addEventListener\\('pointerdown',function\\(e\\)\\{ if\\(!lookActive\\(\\)\\) return;/.test(src3)&&!/view\\.addEventListener\\('pointerdown',function\\(e\\)\\{ if\\(!lookActive/.test(src3); /* at the TARGET node capture and bubble listeners run in REGISTRATION order, so a swallow on the canvas could never pre-empt the shipped handlers above it — it has to be one node up */
      const free=!lookActive();
      const d0=state.drag, pt0={...state.ptrs}; state.drag=null; state.ptrs={};
      let touchRan=false;
      try{ view.dispatchEvent(new PointerEvent('pointerdown',{pointerId:7213,pointerType:'touch',clientX:9,clientY:9,bubbles:true,cancelable:true})); touchRan=!!state.drag; }catch(_){ touchRan='no PointerEvent'; }
      try{ view.releasePointerCapture(7213); }catch(_){ }
      state.drag=d0; state.ptrs=pt0;
      const onGlass=!/PRESS M FOR MOUSE LOOK/.test((document.getElementById('dock')||{textContent:''}).textContent||'');
      const inPanel=/PRESS M FOR MOUSE LOOK/.test((document.getElementById('side')||{textContent:''}).textContent||'');
      push('MOUSELOOK_LEAVES_THE_TOUCH_PATH_ALONE', r161&&shipped&&asks&&upOneNode&&free&&touchRan===true&&onGlass&&inPanel,
        "r.161's door unedited ("+r161+'), the shipped mouse handlers still wired ('+shipped+'), every new listener asks first ('+asks+'), the swallow sits one node up where capture is really first ('+upOneNode+'), nothing captured at boot ('+free+'), a touch pointerdown still reaches the shipped path ('+touchRan+'), the words are in CONTROLS and not on the picture ('+inPanel+'/'+onGlass+')'); }
"""
_anchor="""      push('KEYS_BEAT_FOCUS', markedT&&red&&blurred, 'with a button holding focus, T marked ('+markedT+'), Space approved ('+red+'), the button let go ('+blurred+')'); }
"""
rep(_anchor,_anchor+ROWS.lstrip('\n'),1)

# ── stale: nothing may still claim r.212 ──────────────────────────────────────────────────────────────
for bad in ["revision:'0.212'","r0.212",'"through":89']:
    if bad in s: raise SystemExit('REFUSE: stale %r survived'%bad)
# ── present: the look, its door, its words, and everything r.212 shipped, untouched ───────────────────
for need in ["revision:'0.213'","r0.213","function mouseLook(dx,dy)","function lookToggle()","function lookActive()",
             "document.pointerLockElement===view","e.movementX||0,e.movementY||0","PRESS M FOR MOUSE LOOK",
             "window.addEventListener('pointerdown',function(e){ if(!lookActive()) return;",
             "e.code==='KeyM'","MOUSELOOK_TURNS_THE_HEAD_LIKE_THE_ARROWS","MOUSELOOK_CLICKS_ARE_FIRE_AND_TARGET",
             "MOUSELOOK_LEAVES_THE_TOUCH_PATH_ALONE","THE_SHEET_NAMES_THE_MAP","RCORE_IS_ON_THE_GLASS",'"through":90',
             "Scan to share The Range","rungTitle"]:
    if need not in s: raise SystemExit('REFUSE: %r missing'%need)
# ── the four PC_KEYS_AND_MOUSE source pins must still match, byte for byte ────────────────────────────
for pin in ["e.code==='Space'){e.preventDefault();pcTargetApprove(null)","e.pointerType==='mouse'&&e.button===2",
            "e.pointerType==='mouse'&&e.button===0){ mouseAim(","e.code==='KeyF'){e.preventDefault();fireN("]:
    if pin not in s: raise SystemExit('REFUSE: a PC_KEYS_AND_MOUSE source pin was broken: %r'%pin)
# ── the drag-look line the new look reuses is still the shipped one ───────────────────────────────────
if "{ const zf=fovDeg()/38; u.pan-=dx*.08*zf; u.tilt-=dy*.08*zf; }" not in s:
    raise SystemExit('REFUSE: the shipped drag-look line moved — mouseLook claims to reuse it')

# ── the script still parses (the embedded record is DATA, stripped before the code is checked) ────────
_m=re.findall(r'<script>([\s\S]*?)</script>',s)
if len(_m)!=2: raise SystemExit('REFUSE: expected 2 inline scripts, found %d'%len(_m))
for _i,_src in enumerate(_m):
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as _f:
        _f.write(_src); _p=_f.name
    _r=subprocess.run(['node','--check',_p],capture_output=True,text=True); os.unlink(_p)
    if _r.returncode!=0: raise SystemExit('REFUSE: script #%d does not parse\n%s'%(_i+1,_r.stderr[:2000]))

open(DST,'w',encoding='utf-8').write(s)
print('r.213 written: %d edits · %d bytes · sha256 %s'%(n[0],len(s.encode('utf-8')),hashlib.sha256(s.encode('utf-8')).hexdigest()))

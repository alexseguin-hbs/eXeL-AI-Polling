#!/usr/bin/env python3
# Drone-2525 r.213 -> r.214 — MOUSE LOOK IS MOUSE-ONLY, AND THE GATE THAT MISSED IT CAN SEE IT NOW
#
#  HIS ORDER (2026-10-17): "AsM 111 and MoT 333 test new updates; spiral test, and SSSES TEST; make changes without
#  loosing functionality, ensure you did not break anything up tothis point by reviewing R-CORE HISTORY".
#
#  The battery ran on the LIVE r.213: twelve Masters at 111 words, seven SSSES/Spiral lenses, 22 distinct BLOCKING
#  claims each put to three independent refuters, 10 surviving, then a 333-word synthesis. Every member below is a
#  survivor. NOTHING HERE REMOVES ANYTHING THAT WORKS — his binding constraint.
#
#  THE ONE THAT MATTERS, found independently by Thor, Enki and the security lens: r.213's three window listeners
#  gate on lookActive() and NEVER on e.pointerType. While the cursor is captured a TOUCH or PEN pointerdown runs
#  lookFire() — a round goes downrange from a finger — and the shipped canvas touch path goes dead underneath it.
#  Pointer lock is a mouse-only state by definition, so the guard costs nothing and restores the touch path. This
#  is my defect, introduced in r.213, and it is the exact thing his answer forbade: "his phone is completely
#  untouched". On a hybrid machine it was not.
#
#  AND MY OWN GATE COULD NOT SEE IT. MOUSELOOK_LEAVES_THE_TOUCH_PATH_ALONE probes touch only with the cursor FREE,
#  and counts the STRING "if(!lookActive()) return;" rather than the listeners — so a fourth unguarded listener,
#  or an unguarded pointer type, leaves it green. The row now probes a second time with the lock held (through an
#  explicit QA seam, the deck's own idiom) and names each registration instead of counting a string.
#
#  FROZEN SPANS MOVED: none. Every region touched is FREE in tests/range-spans.json.
#
import hashlib,json,os,re,subprocess,tempfile
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
ROOT=os.path.normpath(os.path.join(DECK,'..','..','..'))
BASE_REV='213'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.214.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.213')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)

# ── M0 · one revision number ──────────────────────────────────────────────────────────────────────────
rep("revision:'0.213'","revision:'0.214'",1)
rep("r0.213","r0.214",1)

# ── M1 · KeyM does not repeat (MoT fix 4: a held key was a burst of lock toggles and toasts) ──────────
rep("  if(e.code==='KeyM'){e.preventDefault();lookToggle();}",
    "  if(e.code==='KeyM'&&!e.repeat){e.preventDefault();lookToggle();} /* r.214: !e.repeat — a HELD M was a burst of toggles and toasts (MoT fix 4) */",1)

# ── M2 · lookActive gains ONE explicit QA seam, so a gate can hold the lock it cannot request ─────────
#  Headless Chromium grants pointer lock only sometimes, and no script can set document.pointerLockElement. The
#  deck already carries QA seams of exactly this shape (state.qaArmed). Without it, the touch-while-locked leg
#  below cannot exist — and that leg is the one that would have caught r.213's defect.
rep("function lookActive(){ try{ return document.pointerLockElement===view; }catch(_){ return false; } }",
    "function lookActive(){ if(state._qaLock) return true; /* r.214: the ONE seam, so a boot row can hold a lock it cannot request — headless grants pointer lock only sometimes and no script can set document.pointerLockElement */\n  try{ return document.pointerLockElement===view; }catch(_){ return false; } }",1)

# ── M3 · MOUSE LOOK IS MOUSE-ONLY, and a swallowed pointerup still finishes its cleanup ───────────────
OLD_WIRE = """  const swallow=function(e){ if(!lookActive()) return; e.preventDefault(); e.stopPropagation(); };
  window.addEventListener('pointerdown',function(e){ if(!lookActive()) return; e.preventDefault(); e.stopPropagation();
    if(e.button===2) lookMark(); else if(e.button===0) lookFire(); },true);
  window.addEventListener('pointerup',swallow,true);
  window.addEventListener('pointermove',swallow,true);
  document.addEventListener('mousemove',function(e){ if(!lookActive()) return; mouseLook(e.movementX||0,e.movementY||0); },false);
  document.addEventListener('contextmenu',function(e){ if(lookActive()) e.preventDefault(); },true);"""
NEW_WIRE = """  /* r.214 · MOUSE LOOK IS MOUSE-ONLY. r.213 gated these on lookActive() alone, so on a hybrid machine a TOUCH or
     PEN pointerdown ran lookFire() while the cursor was captured — a round downrange from a finger — and the
     shipped canvas touch path went dead underneath it. Found independently by Thor, Enki and the SSSES security
     lens on the live bytes. Pointer lock is a mouse-only state by definition, so this guard removes no mouse
     behaviour and GIVES BACK the touch path. His phone was supposed to be untouched; on those machines it wasn't. */
  const mouseOnly=function(e){ return !e.pointerType || e.pointerType==='mouse'; };
  /* r.214 · a swallowed pointerup must still finish the canvas path's cleanup. The shipped handler nulls state.drag
     at its own pointerup; swallowing that event stranded the drag, so after the lock was released a bare mouse move
     with no button held still turned the head (measured: pan -5.256 -> -10.705 where the control arm did not move). */
  const swallow=function(e){ if(!lookActive()||!mouseOnly(e)) return;
    if(e.type==='pointerup'){ state.drag=null; state.pinch=null; try{ delete state.ptrs[e.pointerId]; }catch(_){ } }
    e.preventDefault(); e.stopPropagation(); };
  window.addEventListener('pointerdown',function(e){ if(!lookActive()||!mouseOnly(e)) return; e.preventDefault(); e.stopPropagation();
    if(e.button===2) lookMark(); else if(e.button===0) lookFire(); },true);
  window.addEventListener('pointerup',swallow,true);
  window.addEventListener('pointermove',swallow,true);
  document.addEventListener('mousemove',function(e){ if(!lookActive()) return; mouseLook(e.movementX||0,e.movementY||0); },false);
  document.addEventListener('contextmenu',function(e){ if(lookActive()) e.preventDefault(); },true);"""
rep(OLD_WIRE,NEW_WIRE,1)

# ── M4 · M refuses under an open overlay — including the panel that teaches M ─────────────────────────
rep("  if(state.viewMode==='map'){ toast('MOUSE LOOK · NOT ON THE MAP'); return false; }",
    """  if(state.viewMode==='map'){ toast('MOUSE LOOK · NOT ON THE MAP'); return false; }
  /* r.214 · NOT UNDER AN OPEN SCREEN. Capturing the cursor behind CONTROLS, the share sheet or the R-CORE panel
     leaves that screen up with every click in it dead — and CONTROLS is where the only line teaching M lives, so
     the instruction led straight into the trap. Refuse and say which screen owns the glass. */
  { const own=(document.getElementById('side')||{classList:{contains:function(){return false;}}}).classList.contains('open')?'CONTROLS'
      :((document.getElementById('qrSheet')||{classList:{contains:function(){return false;}}}).classList.contains('on')?'THE SHARE SHEET'
      :(((document.getElementById('rcorePanel')||{getAttribute:function(){return 'true';}}).getAttribute('aria-hidden')==='false')?'R-CORE':''));
    if(own){ toast('CLOSE '+own+' FIRST · THEN PRESS M'); return false; } }""",1)

# ── M5 · the boot self-check serialises the 1.17 MB document ONCE, not four times ─────────────────────
rep("""      const src=document.documentElement.innerHTML; const wired=""","""      const src=QA_SRC; const wired=""",1)
rep("      const src1=document.documentElement.innerHTML;","      const src1=QA_SRC;",1)
rep("      const src2=document.documentElement.innerHTML;","      const src2=QA_SRC;",1)
rep("      const src3=document.documentElement.innerHTML;","      const src3=QA_SRC;",1)
rep("  state.qaArmed=true;","""  state.qaArmed=true;
  /* r.214 · ONE serialisation of the 1.17 MB document for the whole self-check. Four source-reading rows each
     called document.documentElement.innerHTML — three of them added by r.213 — inside this one function. The
     string is identical for all of them; reading it once is the same proof at a quarter of the boot cost. */
  const QA_SRC=document.documentElement.innerHTML;""",1)

# ── M6 · the row that missed it can see it now: probe WITH the lock held, and name each registration ──
OLD_ROW = """      const asks=(src3.match(/if\\(!lookActive\\(\\)\\) return;/g)||[]).length>=3;"""
NEW_ROW = """      /* r.214 · this used to COUNT A STRING, so a fourth listener — or an unguarded pointer type — left it green.
         Name each registration instead, and require the mouse-only guard on the two handlers that act. */
      const asks=/window\\.addEventListener\\('pointerdown',function\\(e\\)\\{ if\\(!lookActive\\(\\)\\|\\|!mouseOnly\\(e\\)\\) return;/.test(src3)
        && /const swallow=function\\(e\\)\\{ if\\(!lookActive\\(\\)\\|\\|!mouseOnly\\(e\\)\\) return;/.test(src3)
        && /window\\.addEventListener\\('pointerup',swallow,true\\);/.test(src3)
        && /window\\.addEventListener\\('pointermove',swallow,true\\);/.test(src3)
        && /document\\.addEventListener\\('mousemove',function\\(e\\)\\{ if\\(!lookActive\\(\\)\\) return;/.test(src3);"""
rep(OLD_ROW,NEW_ROW,1)

# (the lock-held legs CANNOT live in this row: toolSelfTest runs synchronously long before the wire IIFE
#  registers its listeners, so a "with the lock held a finger fires nothing" assertion here passes because
#  NOTHING IS LISTENING — a false pass. They move to the deferred row in M9, after the wiring exists.)

# ── M8 · the three source pins r.213 wrote now describe r.214's source ───────────────────────────────
#  The INVARIANT each pin defends is unchanged; the LINE it quotes moved when the mouse-only guard and the
#  key-repeat guard went in. Each is re-expressed here and shown in redfirst/r214.md to still fail when its own
#  invariant is removed — a pin that cannot fail is not a pin.
rep("""e\\.code==='KeyM'\\)\\{e\\.preventDefault\\(\\);lookToggle\\(\\)/.test(src1)""",
    """e\\.code==='KeyM'&&!e\\.repeat\\)\\{e\\.preventDefault\\(\\);lookToggle\\(\\)/.test(src1)""",1)
rep("""const wired2=/if\\(e\\.button===2\\) lookMark\\(\\); else if\\(e\\.button===0\\) lookFire\\(\\);/.test(src2)&&/window\\.addEventListener\\('pointerdown',function\\(e\\)\\{ if\\(!lookActive\\(\\)\\) return;/.test(src2);""",
    """const wired2=/if\\(e\\.button===2\\) lookMark\\(\\); else if\\(e\\.button===0\\) lookFire\\(\\);/.test(src2)&&/window\\.addEventListener\\('pointerdown',function\\(e\\)\\{ if\\(!lookActive\\(\\)\\|\\|!mouseOnly\\(e\\)\\) return;/.test(src2);""",1)
rep("""const upOneNode=/window\\.addEventListener\\('pointerdown',function\\(e\\)\\{ if\\(!lookActive\\(\\)\\) return;/.test(src3)&&!/view\\.addEventListener\\('pointerdown',function\\(e\\)\\{ if\\(!lookActive/.test(src3);""",
    """const upOneNode=/window\\.addEventListener\\('pointerdown',function\\(e\\)\\{ if\\(!lookActive\\(\\)\\|\\|!mouseOnly\\(e\\)\\) return;/.test(src3)&&!/view\\.addEventListener\\('pointerdown',function\\(e\\)\\{ if\\(!lookActive/.test(src3);""",1)

# ── M9 · THE NEW ROW, DEFERRED — every r.214 fix that had no gate gets one, measured where it is real ─
#  It must be deferred: toolSelfTest runs synchronously, long before the mouse-look IIFE registers its window
#  listeners, so any assertion about them made inside toolSelfTest passes because nothing is listening. That is a
#  gate that cannot fail, and finding it is why this row exists. The deck already has the pattern — r.209's and
#  r.210's rows use the same setTimeout, guarded on state.outcomes identity and on not having run before.
ROW = """
  setTimeout(()=>{ try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='MOUSE_LOOK_LEAVES_NO_TRACE')) return;
    /* r.214 · MOUSE_LOOK_LEAVES_NO_TRACE. Three fixes the battery asked for, each measured against a LIVE listener.
       (a) a finger must not fire while the cursor is captured — r.213's listeners gated on the lock and never on
           the pointer type, so on a hybrid machine a touch ran fireN and the canvas touch path went dead;
       (b) a swallowed pointerup must still finish the canvas path's cleanup, or the aim turns with no button held;
       (c) M must refuse while a screen owns the glass — CONTROLS is where the only line teaching M lives. */
    const sv={drag:state.drag,pinch:state.pinch,ptrs:{...state.ptrs},hit:state.rangeHit|0};
    /* (a) */
    state.drag=null; state.ptrs={}; state._qaLock=true;
    let fingerSafe=false, fingerRan=false;
    try{ view.dispatchEvent(new PointerEvent('pointerdown',{pointerId:9101,pointerType:'touch',clientX:9,clientY:9,bubbles:true,cancelable:true}));
         fingerSafe=(state.rangeHit|0)===sv.hit; fingerRan=!!state.drag; }catch(_){ }
    try{ view.releasePointerCapture(9101); }catch(_){ }
    /* (b) */
    state.drag={x:5,y:5,sx:5,sy:5,moved:0,t:0}; state.ptrs={9102:{x:5,y:5}};
    try{ window.dispatchEvent(new PointerEvent('pointerup',{pointerId:9102,pointerType:'mouse',button:0,clientX:5,clientY:5,bubbles:true,cancelable:true})); }catch(_){ }
    const dragCleared = state.drag===null && !state.ptrs[9102];
    state._qaLock=false;
    /* (c) */
    const sd=document.getElementById('side'); const wasOpen=!!(sd&&sd.classList.contains('open'));
    if(sd) sd.classList.add('open');
    const refused = lookToggle()===false && !lookActive();
    if(sd&&!wasOpen) sd.classList.remove('open');
    /* (d) one serialisation of the 1.17 MB document for the whole self-check */
    const ts=toolSelfTest.toString();
    /* The needle is BUILT, never written whole: this file's comment above and this very line both contain the
       words, and a literal here would count itself. Assembling it keeps the assertion honest. */
    const NEEDLE='='+'document.documentElement'+'.inner'+'HTML';
    const once = (ts.split(NEEDLE).length-1)===1
      && ts.indexOf('const src=QA_SRC;')>0 && ts.indexOf('const src1=QA_SRC;')>0
      && ts.indexOf('const src2=QA_SRC;')>0 && ts.indexOf('const src3=QA_SRC;')>0;
    state.drag=sv.drag; state.pinch=sv.pinch; state.ptrs=sv.ptrs;
    rows.push({id:'MOUSE_LOOK_LEAVES_NO_TRACE',ok:(fingerSafe&&fingerRan&&dragCleared&&refused&&once),
      note:'with the cursor captured a finger fires nothing ('+fingerSafe+') and still reaches the shipped path ('+fingerRan+'); a swallowed pointerup still clears the drag ('+dragCleared+'); M refuses while CONTROLS owns the glass ('+refused+'); the self-check serialises the document once, not four times ('+once+')'});
    state.qa={rev:BUILD.revision,total:rows.length,red:rows.filter(x=>!x.ok).length};
  }catch(e){ try{ log('QA','MOUSELOOK',String(e).slice(0,80)); }catch(_){ } } }, 900);
"""
_anchor_row = """  setTimeout(()=>{ try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='RCORE_IS_ON_THE_GLASS')) return;"""
rep(_anchor_row, ROW.strip('\n')+"\n"+_anchor_row, 1)

# ── M7 · the record the deck carries, regenerated through rev 91 (the step r.211 omitted) ─────────────
LEDGER=json.load(open(os.path.join(ROOT,'docs','traceability','drone-2525.ledger.json'),encoding='utf-8'))
THROUGH=len(LEDGER['entries'])
if THROUGH!=92: raise SystemExit('REFUSE: expected the ledger to end at rev 92 (the register correction, appended before this patcher); found %d'%THROUGH)
MODEL=re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
_e=[]
for e in LEDGER['entries'][:THROUGH]:
    o={'rev':e['rev'],'date':e['date'],'kind':e['kind'],'text':MODEL.sub('an external model',e.get('text','')),'commit':e.get('commit','')}
    if 'shipped' in e: o['shipped']=e['shipped']
    _e.append(o)
BLOCK=json.dumps({'section':LEDGER['section'],'route':LEDGER['route'],'through':THROUGH,'entries':_e},ensure_ascii=False,separators=(',',':'))
for bad in ['</script','<!--','-->',' ',' ']:
    if bad in BLOCK: raise SystemExit('REFUSE: the ledger block carries %r'%bad)
_old=re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/',s)
if not _old: raise SystemExit('REFUSE: no RCORE_LEDGER block')
if json.loads(_old.group(1)).get('through')!=90: raise SystemExit('REFUSE: expected the r.213 base to embed through 90')
s=s[:_old.start()]+'/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER='+BLOCK+';/*RCORE_LEDGER_END*/'+s[_old.end():]
n[0]+=1
_new=json.loads(re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/',s).group(1))
if _new['through']!=92 or len(_new['entries'])!=92: raise SystemExit('REFUSE: the embedded block is not through 92')

# ── stale / present ───────────────────────────────────────────────────────────────────────────────────
for bad in ["revision:'0.213'","r0.213",'"through":90',"const src=document.documentElement.innerHTML","const src1=document.documentElement.innerHTML"]:
    if bad in s: raise SystemExit('REFUSE: stale %r survived'%bad)
for need in ["revision:'0.214'","r0.214",'"through":92',"const mouseOnly=function(e)","!lookActive()||!mouseOnly(e)",
             "state._qaLock","!e.repeat","CLOSE '+own+' FIRST","const QA_SRC=document.documentElement.innerHTML;",
             "MOUSE_LOOK_LEAVES_NO_TRACE","fingerSafe","MOUSELOOK_TURNS_THE_HEAD_LIKE_THE_ARROWS","THE_SHEET_NAMES_THE_MAP","RCORE_IS_ON_THE_GLASS"]:
    if need not in s: raise SystemExit('REFUSE: %r missing'%need)
for pin in ["e.code==='Space'){e.preventDefault();pcTargetApprove(null)","e.pointerType==='mouse'&&e.button===2",
            "e.pointerType==='mouse'&&e.button===0){ mouseAim(","e.code==='KeyF'){e.preventDefault();fireN("]:
    if pin not in s: raise SystemExit('REFUSE: a PC_KEYS_AND_MOUSE source pin was broken: %r'%pin)
if "{ const zf=fovDeg()/38; u.pan-=dx*.08*zf; u.tilt-=dy*.08*zf; }" not in s:
    raise SystemExit('REFUSE: the shipped drag-look line moved')

_m=re.findall(r'<script>([\s\S]*?)</script>',s)
if len(_m)!=2: raise SystemExit('REFUSE: expected 2 inline scripts, found %d'%len(_m))
for _i,_src in enumerate(_m):
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as _f:
        _f.write(_src); _p=_f.name
    _r=subprocess.run(['node','--check',_p],capture_output=True,text=True); os.unlink(_p)
    if _r.returncode!=0: raise SystemExit('REFUSE: script #%d does not parse\n%s'%(_i+1,_r.stderr[:2000]))

open(DST,'w',encoding='utf-8').write(s)
print('r.214 written: %d edits · %d bytes · sha256 %s'%(n[0],len(s.encode('utf-8')),hashlib.sha256(s.encode('utf-8')).hexdigest()))

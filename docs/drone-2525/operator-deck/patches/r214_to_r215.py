#!/usr/bin/env python3
# Drone-2525 r.214 -> r.215 — THE HISTORY OWNS THE SCREEN (DD-78)
#
#  HIS WORDS (2026-10-17, with shot68, the deck's R-CORE panel open on his phone):
#    "Ensure this is full screen for portraight and landscape and pc; also I dont see </> and </> Code unlock of code"
#
#  THIS REVISION ANSWERS THE FIRST HALF. Measured on the live r.214 bytes: the panel is an INSET CARD —
#  .rcSheet is max-width 640px and max-height 88vh inside an overlay that adds 8px of side padding. On his phone
#  the game shows around it; in landscape it is a letterbox; on a desktop it is a 640 px column adrift in the
#  middle of the display. No gate pins that geometry (checked), so nothing is re-expressed here.
#
#  THE SECOND HALF — the deck's own </> Code chip — is DD-79 and is its own revision, because it is not a CSS
#  change: the deck's panel is a hand-written vanilla port with only cmpVU and cmpVS, and giving it Code mode
#  means inlining the 40,904 B code index, porting the cube, and carrying his two rasters into a file that is
#  forbidden to fetch anything. Saying that plainly beats bundling it half-done into a one-line fix.
#
#  A READING COLUMN INSIDE THE FULL BLEED, declared and reversible in one number: the sheet fills the screen, and
#  the CONTENT is centred at 1100 px so a 2560 px monitor does not run prose the whole way across. "Full screen"
#  is about the panel owning the glass, which it now does edge to edge; a line of text 2560 px wide would be
#  obeying the letter and losing the point. One constant if he wants it truly edge to edge.
#
import hashlib,json,os,re,subprocess,tempfile
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
ROOT=os.path.normpath(os.path.join(DECK,'..','..','..'))
BASE_REV='214'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.215.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.214')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)

rep("revision:'0.214'","revision:'0.215'",1)
rep("r0.214","r0.215",1)

# ── M1 · the overlay stops insetting the sheet ───────────────────────────────────────────────────────
rep("#rcorePanel{position:fixed;inset:0;z-index:80;display:none;background:rgba(3,10,13,0.72);align-items:flex-start;justify-content:center;padding:max(env(safe-area-inset-top,0px),12px) 8px 12px;overflow-y:auto}",
    "#rcorePanel{position:fixed;inset:0;z-index:80;display:none;background:#030a0d;align-items:stretch;justify-content:center;padding:0;overflow:hidden}/* r.215 (DD-78): no padding, no scrim showing the game behind — the history OWNS the screen */",1)

# ── M2 · the sheet goes full bleed, in every orientation and on a desktop ────────────────────────────
rep("#rcorePanel .rcSheet{width:100%;max-width:640px;max-height:88vh;overflow-y:auto;background:#0a1518;color:#e2ecec;border:1px solid #22363a;border-radius:14px;box-shadow:0 0 40px #C9A22722;",
    "#rcorePanel .rcSheet{width:100%;max-width:none;height:100%;max-height:none;overflow-y:auto;-webkit-overflow-scrolling:touch;background:#0a1518;color:#e2ecec;border:0;border-radius:0;box-shadow:none;",1)

# ── M3 · the sticky header clears the notch, now that nothing above it does ──────────────────────────
rep("#rcorePanel .rcHead{position:sticky;top:0;background:#0a1518;border-bottom:1px solid #22363a;padding:12px 76px;",
    "#rcorePanel .rcHead{position:sticky;top:0;background:#0a1518;border-bottom:1px solid #22363a;padding:calc(12px + env(safe-area-inset-top,0px)) 76px 12px;",1)
rep("#rcorePanel .rcHeadBtns{position:absolute;right:12px;top:50%;transform:translateY(-50%);",
    "#rcorePanel .rcHeadBtns{position:absolute;right:max(12px,env(safe-area-inset-right,0px));top:calc(50% + env(safe-area-inset-top,0px)/2);transform:translateY(-50%);",1)

# ── M4 · a reading column inside the full bleed, and the body clears the home bar ────────────────────
rep("#rcorePanel .rcBody{padding:16px;display:flex;flex-direction:column;gap:14px}",
    "#rcorePanel .rcBody{padding:16px max(16px,env(safe-area-inset-left,0px)) calc(16px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:14px;width:100%;max-width:1100px;margin:0 auto}/* r.215: full bleed owns the glass; the CONTENT keeps a reading width so a 2560px monitor does not run prose end to end — one number if he wants it edge to edge */",1)

# ── M5 · the row: the panel fills the screen, in both orientations and on a desktop ──────────────────
ROW = """
  setTimeout(()=>{ try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='THE_HISTORY_OWNS_THE_SCREEN')) return;
    /* r.215 (DD-78) · THE_HISTORY_OWNS_THE_SCREEN. He asked for full screen in portrait, in landscape and on a
       desktop; the panel was a 640 x 88vh card with the game showing around it. Open it for real and measure the
       sheet against the viewport. Red-first on the r.214 bytes: 640 wide whatever the screen, and 88% tall. */
    const g=document.getElementById('rcoreBadge'), ic=document.getElementById('rcIcon'), w=document.getElementById('rcorePanel');
    if(!g||!ic||!w){ rows.push({id:'THE_HISTORY_OWNS_THE_SCREEN',ok:false,note:'no badge or panel to measure'}); return; }
    const wasOpen=w.classList.contains('on');
    if(!wasOpen){ try{ ic.click(); }catch(_){ } try{ (document.getElementById('rcPill')||ic).click(); }catch(_){ } }
    const sh=document.getElementById('rcSheet');
    const r=sh?sh.getBoundingClientRect():{width:0,height:0,left:0,top:0};
    const W=innerWidth, H=innerHeight;
    const fills = sh && r.width>=W-1 && r.height>=H-1 && r.left<=1 && r.top<=1;
    const cs = sh?getComputedStyle(sh):{};
    const uncapped = sh && (cs.maxWidth==='none'||parseFloat(cs.maxWidth)>=W) && (cs.maxHeight==='none'||parseFloat(cs.maxHeight)>=H);
    if(!wasOpen){ const x=document.getElementById('rcX'); if(x) try{ x.click(); }catch(_){ } }
    rows.push({id:'THE_HISTORY_OWNS_THE_SCREEN',ok:!!(fills&&uncapped),
      note:'the sheet measures '+Math.round(r.width)+'x'+Math.round(r.height)+' in a '+W+'x'+H+' window at ('+Math.round(r.left)+','+Math.round(r.top)+') — fills '+!!fills+', uncapped '+!!uncapped});
    state.qa={rev:BUILD.revision,total:rows.length,red:rows.filter(x=>!x.ok).length};
  }catch(e){ try{ log('QA','FULLSCREEN',String(e).slice(0,80)); }catch(_){ } } }, 1100);
"""
_a = """  setTimeout(()=>{ try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='MOUSE_LOOK_LEAVES_NO_TRACE')) return;"""
rep(_a, ROW.strip('\n')+"\n"+_a, 1)

# ── M6 · the record, regenerated through rev 93 ──────────────────────────────────────────────────────
LEDGER=json.load(open(os.path.join(ROOT,'docs','traceability','drone-2525.ledger.json'),encoding='utf-8'))
THROUGH=len(LEDGER['entries'])
if THROUGH!=93: raise SystemExit('REFUSE: expected the ledger to end at rev 93 (r.214 released); found %d'%THROUGH)
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
if json.loads(_old.group(1)).get('through')!=92: raise SystemExit('REFUSE: expected the r.214 base to embed through 92')
s=s[:_old.start()]+'/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER='+BLOCK+';/*RCORE_LEDGER_END*/'+s[_old.end():]
n[0]+=1
_new=json.loads(re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/',s).group(1))
if _new['through']!=93 or len(_new['entries'])!=93: raise SystemExit('REFUSE: the embedded block is not through 93')

for bad in ["revision:'0.214'","r0.214",'"through":92',"max-width:640px;max-height:88vh"]:
    if bad in s: raise SystemExit('REFUSE: stale %r survived'%bad)
for need in ["revision:'0.215'","r0.215",'"through":93',"max-width:none;height:100%;max-height:none",
             "THE_HISTORY_OWNS_THE_SCREEN","max-width:1100px;margin:0 auto",
             "MOUSE_LOOK_LEAVES_NO_TRACE","const mouseOnly=function(e)","THE_SHEET_NAMES_THE_MAP"]:
    if need not in s: raise SystemExit('REFUSE: %r missing'%need)

_m=re.findall(r'<script>([\s\S]*?)</script>',s)
if len(_m)!=2: raise SystemExit('REFUSE: expected 2 inline scripts, found %d'%len(_m))
for _i,_src in enumerate(_m):
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as _f:
        _f.write(_src); _p=_f.name
    _r=subprocess.run(['node','--check',_p],capture_output=True,text=True); os.unlink(_p)
    if _r.returncode!=0: raise SystemExit('REFUSE: script #%d does not parse\n%s'%(_i+1,_r.stderr[:2000]))

open(DST,'w',encoding='utf-8').write(s)
print('r.215 written: %d edits · %d bytes · sha256 %s'%(n[0],len(s.encode('utf-8')),hashlib.sha256(s.encode('utf-8')).hexdigest()))

# r.208 -> r.209 — THE SHEET NAMES THE MAP.
#  Operator 2026-10-14, SENT TWICE with the same screenshot (shot58, sha256 660e8c66...e133e7):
#    "This should have the range at top"
#  His law: when the operator repeats himself, the last answer missed — change what you do, not how you describe
#  it. So this is its own revision, built first and alone, ahead of the map ladder it belongs to (DD-48).
#
#  MEASURED on the shipped r.208 bytes: the QR share sheet heads "LANE 21 · TURRET · TRAIN UP" (written at
#  play.html:8084, static default at :660) and NEVER says which map the lane is on. With the ladder coming
#  (DD-47: THE RANGE -> THE CAPITAL -> AUSTIN -> landmarks -> cities -> the State of Texas) that is the missing
#  word, and on the Capital it is the difference between a shareable station and an unshareable one.
#
#  THREE EDITS, all inside the QR IIFE and the static markup — neither is span-frozen:
#   M1  the heading leads with the map:  THE RANGE · LANE 21 · TURRET · TRAIN UP
#                                        THE CAPITAL · TURRET 7/42 · TRAIN UP
#       units[id].label is ALREADY 'TURRET i/42' (play.html:804) — reused, not re-derived.
#   M2  the static default at :660 moves with it, so the sheet never flashes the old words before paintQr runs.
#   M3  shareUrl() gains a NEW BRANCH ABOVE the Range line. The Range line is left BYTE-IDENTICAL, which is why
#       drone-playable.test.mjs:87's pin needs no re-expression and why Verify Live's own fetch of
#       play.html?range=21&role=turret&mode=train-up keeps working unchanged. The map is ADDITIVE, never a
#       replacement. A matching ?map= reader lands with the ladder (r.211), not here — a link nothing reads yet
#       would be a promise the deck cannot keep.
#
#  rungIsRange() is landed here as ONE hoisted function in the append zone (after const _mp, play.html:5768 —
#  nothing frozen follows it before </script>), so r.211's ladder EXTENDS it instead of introducing it. It must
#  be a `function` declaration and not a const: toolSelfTest() runs at :5341, above it, and a const there is in
#  its temporal dead zone at boot — the TDZ failure r.208 records at :5727 ("VAR, not let ... a deck that never
#  finished booting").
#
#  THE RANGE IS NOT TOUCHED (DD-35): no frozen span is edited; tests/range-frozen.test.mjs (100 spans) and
#  tests/range-2525.test.mjs (the source-text pins) prove it in the same commit, and both play-throughs are
#  re-run on the shipped bytes.
import hashlib,os,subprocess,tempfile
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
BASE_REV='208'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.209.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.208')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)

# 0 · the deck declares itself
rep("revision:'0.208'","revision:'0.209'",1)
rep("r0.208","r0.209",1)

# 1 · rungIsRange() — the ladder's first member, in the append zone, hoisted (NOT const: toolSelfTest runs above).
#     r.211 extends this one function with state._selMap; everything else in the ladder is built on it.
rep("""const _mp=document.getElementById('modePick');""",
    """/* r.209 (DD-47/DD-48): the ladder's first member. THE RANGE is rung 0 of the map ladder he named -
   THE RANGE -> THE CAPITAL -> CITY OF AUSTIN -> LANDMARKS OF TEXAS -> MAJOR TEXAS CITIES -> THE STATE OF TEXAS.
   r.209 only needs to tell the first rung from the rest so the share sheet can name it; r.211 extends THIS
   function with state._selMap rather than writing a second one. A hoisted function declaration, never a const:
   toolSelfTest() runs above this line and a const here is in its temporal dead zone at boot. */
function rungIsRange(){ return chNum()===0; }
function rungWord(){ return rungIsRange()?'THE RANGE':'THE CAPITAL'; }
function rungSeat(){
  if(rungIsRange()) return (typeof laneWord==='function'?laneWord():('LANE '+(((state.lane|0)+1))));
  var id=String(state.unit||'T01'), u=(typeof units!=='undefined')&&units[id], lab=(u&&u.label)||'';
  if(/^TURRET\\b/.test(lab)) return lab;   /* units[].label is already 'TURRET i/42' (r.131) - reused, not re-derived */
  return 'TURRET '+((id.replace(/^T/,'')|0)||1)+'/42';   /* the range parks these same 42 units and renames them LANE n; off the range the seat is a station, never a lane */
}
const _mp=document.getElementById('modePick');""",1)

# 2 · M1 — the heading leads with the map. laneWord()/RANGE_MODE_NAME are untouched; the map is prefixed and the
#     seat is read from the rung, so a Capital station reads THE CAPITAL · TURRET 7/42 · TRAIN UP.
rep("""    if(title) title.textContent=(typeof laneWord==='function'?laneWord():('LANE '+(((state.lane|0)+1))))+' · TURRET · '+((typeof RANGE_MODE_NAME!=='undefined'&&RANGE_MODE_NAME[state.rangeMode||'bounce'])||'TRAIN UP');""",
    """    /* r.209 (DD-48, operator 2026-10-14 twice: "This should have the range at top"): the sheet says WHERE the
       shot is before it says which lane and which programme. THE RANGE · LANE 21 · TURRET · TRAIN UP, and on
       the Capital THE CAPITAL · TURRET 7/42 · TRAIN UP. */
    var _w=(typeof rungWord==='function')?rungWord():'THE RANGE', _s=(typeof rungSeat==='function')?rungSeat():('LANE '+(((state.lane|0)+1)));
    /* the seat already names the craft on a station (TURRET 7/42); on a lane it does not, so the range keeps his own ' · TURRET · ' */
    if(title) title.textContent=_w+' · '+_s+(/^TURRET\\b/.test(_s)?'':' · TURRET')+' · '+((typeof RANGE_MODE_NAME!=='undefined'&&RANGE_MODE_NAME[state.rangeMode||'bounce'])||'TRAIN UP');""",1)

# 3 · M2 — the static default moves with it, so the sheet never flashes the old words before paintQr runs.
rep("""<h2 id="qrTitle">LANE 21 · TURRET · TRAIN UP</h2>""",
    """<h2 id="qrTitle">THE RANGE · LANE 21 · TURRET · TRAIN UP</h2>""",1)

# 4 · M3 — the link learns the map, ADDITIVELY. The Range's return is left BYTE-IDENTICAL on its own line:
#     drone-playable.test.mjs:87 pins its exact source text, and .github/workflows/verify-live.yml fetches
#     play.html?range=21&role=turret&mode=train-up on every run. A Capital station gets its own form so it can
#     be shared at all; the reader for it lands with the ladder in r.211.
rep("""    var lane=((state.lane|0)+1);
    var host=(location.protocol==='http:'||location.protocol==='https:')?location.origin:'https://exel-ai-polling.explore-096.workers.dev';
    return host+'/drone-2525/play.html?range='+lane+'&role=turret&mode='+mode;""",
    """    var host=(location.protocol==='http:'||location.protocol==='https:')?location.origin:'https://exel-ai-polling.explore-096.workers.dev';
    /* r.209 (DD-48): a Capital station could not be shared at all - ?range= means the LANE. The map is ADDITIVE:
       the Range's own line below is byte-identical to r.208's, so the pinned source text and Verify Live's fetch
       of ?range=21&role=turret&mode=train-up are untouched. The ?map= reader lands with the ladder (r.211). */
    if(typeof rungIsRange==='function'&&!rungIsRange()) return host+'/drone-2525/play.html?map=capital&station='+((state.unit||'T01').replace(/^T/,'')|0)+'&role=turret&mode='+mode;
    var lane=((state.lane|0)+1);
    return host+'/drone-2525/play.html?range='+lane+'&role=turret&mode='+mode;""",1)

# 4b · the deck measures it. The sheet is painted by an IIFE that runs AFTER the boot self-check, so the row is
#      DEFERRED (the r.208 pattern): it presses the REAL #btnQr, reads the REAL heading and link, and gives the
#      sheet back closed. The Capital half is read from the naming functions inside ONE synchronous block - no
#      frame can interleave, so the scene is never entered and nothing on the range can drift.
rep("""  /* r.208 deferred row \u00b7 THE_CAPITOL_IS_DRAWN""",
    """  /* r.209 deferred row \u00b7 THE_SHEET_NAMES_THE_MAP (operator 2026-10-14, sent TWICE with shot58: "This should have
     the range at top"). The share sheet is wired by an IIFE far below the boot self-check, so this row waits for it,
     presses the real button, reads what he would read, and closes the sheet again. */
  setTimeout(()=>{ try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='THE_SHEET_NAMES_THE_MAP')) return;
    const b=document.getElementById('btnQr'), sh=document.getElementById('qrSheet'), ti=document.getElementById('qrTitle'), ur=document.getElementById('qrUrl');
    if(!b||!sh||!ti||!ur||typeof rungWord!=='function'){ rows.push({id:'THE_SHEET_NAMES_THE_MAP',ok:false,note:'the share sheet is not on the page at check time'}); }
    else { const wasOn=sh.classList.contains('on'); b.click();
      const t=String(ti.textContent||''), u=String(ur.textContent||'');
      /* ONE synchronous read of the other rung - rungWord/rungSeat do not yield, so no frame runs and the scene is never entered */
      const capPair=(function(){ const c0=state.challenge; try{ state.challenge=1; const w=rungWord(), q=rungSeat(); return w+' \u00b7 '+q+(/^TURRET/.test(q)?'':' \u00b7 TURRET')+' \u00b7 '+((RANGE_MODE_NAME&&RANGE_MODE_NAME[state.rangeMode||'bounce'])||'TRAIN UP'); } finally { state.challenge=c0; } })();
      if(!wasOn){ const x=document.getElementById('qrClose'); if(x) x.click(); }
      const rangeHead=/^THE RANGE \u00b7 LANE \\d+ \u00b7 TURRET \u00b7 /.test(t), oldForm=/\\?range=\\d+&role=turret&mode=/.test(u), capHead=/^THE CAPITAL \u00b7 /.test(capPair);
      rows.push({id:'THE_SHEET_NAMES_THE_MAP',ok:rangeHead&&oldForm&&capHead,note:'the sheet heads "'+t+'" and links '+u.replace(/^https?:\\/\\/[^/]+/,'')+' \u00b7 off the range the same sheet heads "'+capPair+'" \u2014 the map first, and the range link byte-identical so a QR already in his hand still opens'});
    }
    state.qa={pass:rows.filter(x=>x.ok).length,total:rows.length,rev:BUILD.revision,t:Date.now(),known:(state.qa&&state.qa.known)}; const qn=document.getElementById('qaOps'); if(qn) qn.textContent=state.qa.pass+'/'+state.qa.total;
  }catch(e){ rows.push({id:'THE_SHEET_NAMES_THE_MAP',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1500);
  /* r.208 deferred row \u00b7 THE_CAPITOL_IS_DRAWN""",1)

# 5 · presence: the new members are in once, and the pinned Range line survives verbatim
for need in ["function rungIsRange(){ return chNum()===0; }",
             "function rungWord(){ return rungIsRange()?'THE RANGE':'THE CAPITAL'; }",
             "function rungSeat(){",
             "<h2 id=\"qrTitle\">THE RANGE · LANE 21 · TURRET · TRAIN UP</h2>",
             "return host+'/drone-2525/play.html?range='+lane+'&role=turret&mode='+mode;",
             "?map=capital&station=",
             "r.209 (DD-48, operator 2026-10-14 twice",
             "(/^TURRET\\b/.test(_s)?'':' \u00b7 TURRET')",
             "push({id:'THE_SHEET_NAMES_THE_MAP',ok:rangeHead&&oldForm&&capHead",
             "r.209 deferred row \u00b7 THE_SHEET_NAMES_THE_MAP"]:
    if s.count(need)!=1: raise SystemExit('REFUSE: not in once ('+str(s.count(need))+'): '+need)

# 6 · stale: the old heading and the old lane-first title write must be gone
for dead in ["<h2 id=\"qrTitle\">LANE 21 · TURRET · TRAIN UP</h2>",
             "if(title) title.textContent=(typeof laneWord==='function'?laneWord():('LANE '+(((state.lane|0)+1))))+' · TURRET · '",
             "revision:'0.208'","r0.208"]:
    if dead in s: raise SystemExit('REFUSE: stale remains: '+dead[:80])

# 7 · THE CUT IS PARSED BEFORE IT IS WRITTEN
import re as _re
_m=max(_re.findall(r'<script[^>]*>(.*?)</script>', s, _re.S), key=len)
with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as _f:
    _f.write(_m); _p=_f.name
_r=subprocess.run(['node','--check',_p],capture_output=True,text=True)
os.unlink(_p)
if _r.returncode!=0: raise SystemExit('REFUSE: the cut does not parse —\n'+(_r.stderr or '')[:1200])
print('parsed OK ('+str(len(_m))+' chars of script)')

open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

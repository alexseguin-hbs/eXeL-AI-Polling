# r.221 -> r.222 — CRS-CL.H01, THE GLASS HALF ONLY (operator 2026-10-21)
#  "In capPaintLawn, write HIT n · MISS n from the counts already in capIntroRows. The Range score stays as it is."
#  The lawn's hits and misses are already stored (CTIME); #phScore on the lawn still reads "BLU 0 · RED 0" because that
#  line in hudScore is gated to the Range (chNum()===0). capPaintLawn runs after hudScore every frame (phys: hudScore();
#  ... paintCues(); and paintCues tail-calls capPaintLawn), so writing #phScore there wins the BLU/RED else branch — the
#  same mechanism r.197 uses for #startWord/#startTime. One edit in the FREE capPaintLawn, one boot gate, red first on the
#  r.221 bytes (the lawn strip reads BLU 0 · RED 0 there). The Range score line is untouched; no new control, no new row,
#  no station moved, Train Up/Qual 40/the Sentinel cue unchanged.
import hashlib, os, re, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
# allow a standalone scratch run: resolve DECK to the repo operator-deck if the layout differs
if not os.path.exists(os.path.join(DECK, 'HASHES_r221.sha256')):
    DECK = os.path.join(ROOT, 'docs', 'drone-2525', 'operator-deck')
BASE_REV = '221'; NEW_REV = '222'
BASE_SHA = open(os.path.join(DECK, 'HASHES_r' + BASE_REV + '.sha256'), encoding='utf-8').read().split()[0]
SRC = os.path.join(DECK, 'drone-2525_r.' + BASE_REV + '.html')
s = open(SRC, encoding='utf-8').read()
if hashlib.sha256(s.encode('utf-8')).hexdigest() != BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.' + BASE_REV)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: raise SystemExit('REFUSE: expected %d of %r, found %d' % (count, old[:90], n))
    s = s.replace(old, new, count); return s

CAP = "  paintLight(capLight()); const R=state.capRun||{}; const stay=capIntroDrill()==='stay'; const d=capIntroTrack();\n"
ANCHOR = "  /* r.219 · the five lawn rows. ONE door (pickScenario('capital') -> capIntroEnter), every unit snapshotted and\n"
for need in [CAP, ANCHOR, "function capIntroRows(R){", "function capPaintLawn(){"]:
    if need not in s: raise SystemExit('REFUSE: the r.221 base does not carry: ' + need[:60])
for dead in ["LAWN_SHOWS_HIT_MISS", "r.222: CRS-CL.H01 glass half", "capPaintScore"]:
    if dead in s: raise SystemExit('REFUSE: r.222 is already in the base: ' + dead)
# red-first evidence: the lawn strip still reads BLU/RED in the base
if "('BLU '+(state.blu|0)+' · RED '+(state.red|0))" not in s: raise SystemExit('REFUSE: the BLU/RED lawn branch (the r.222 gap) is not in the base')

# === the head ================================================================================================
rep("<span>r0.221</span>", "<span>r0.222</span>")
rep("revision:'0.221'", "revision:'0.222'")

# === the embedded R-CORE record moves on one row (lag exactly one, deck-rcore): through 100 -> through 101 ====
LEDGER = json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku|Fable|Mythos)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
THROUGH = 101
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
if not re.match(r'^[0-9a-f]{7,40}$', str(LEDGER['entries'][100].get('shipped', ''))): raise SystemExit('REFUSE: rev 101 (r.221) has no ship commit yet: ' + str(LEDGER['entries'][100].get('shipped')))
_e = []
for e in LEDGER['entries'][:THROUGH]:
    o = {'rev': e['rev'], 'date': e['date'], 'kind': e['kind'], 'text': MODEL.sub('an external model', e.get('text', '')), 'commit': e.get('commit', '')}
    if 'shipped' in e: o['shipped'] = e['shipped']
    _e.append(o)
BLOCK = json.dumps({'section': LEDGER['section'], 'route': LEDGER['route'], 'through': THROUGH, 'entries': _e}, ensure_ascii=False, separators=(',', ':'))
for bad in ['</script', '<!--', '-->', ' ', ' ']:
    if bad in BLOCK: raise SystemExit('REFUSE: the ledger block carries %r' % bad)
_old = re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/', s)
if not _old: raise SystemExit('REFUSE: the embedded ledger block was not found')
if json.loads(_old.group(1)).get('through') != 100: raise SystemExit('REFUSE: expected the r.221 base to embed through 100')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]

# === M1 · the glass half: capPaintLawn writes HIT n · MISS n on the lawn strip =================================
rep(CAP, CAP +
    "  capPaintScore(); /* r.222: CRS-CL.H01 glass half - after hudScore, so the lawn strip reads HIT n · MISS n, not BLU/RED; why the observer too: see capPaintScore */\n")
# (the SSSES gate's kept attempt 3: the typeof guard was dead - capPaintScore is a hoisted declaration in the same script - and the 433-character comment repeated the banner; succinctness 74 -> 78 with the pass line, the Range and the glass unchanged)

# === M3 · the one writer, and the observer that re-asserts it before every paint (the twelve at play) ===========
TAIL = "  decide('HOLD',sh.id,{reason:'BEFORE_CUE'}); toast('CUE · NOT NAMED · WAIT FOR SENTINEL'); return true; }\n\n</script>"
if s.count(TAIL) != 1: raise SystemExit('REFUSE: the append-zone tail (capCueHold) is not unique')
WRITER = r"""  decide('HOLD',sh.id,{reason:'BEFORE_CUE'}); toast('CUE · NOT NAMED · WAIT FOR SENTINEL'); return true; }

/* ===================================================================================================================
   r.222 — CRS-CL.H01, THE GLASS HALF (operator 2026-10-21: "In capPaintLawn, write HIT n · MISS n from the counts
   already in capIntroRows. The Range score stays as it is."). INVARIANT: while the lawn intro is up, the score strip
   (#phScore) and its full-screen mirror (#magStrip) read HIT n · MISS n from the counts already stored, and never
   BLU/RED — in every painted frame, paused or not. ONE writer, capPaintScore(): called by capPaintLawn every frame
   (after hudScore — phys: hudScore() then paintCues->capPaintLawn, the r.197 mechanism), AND re-asserted by a
   lawn-owned MutationObserver as a microtask whenever anything else writes #phScore while capIntro() — microtasks run
   before rendering, so no BLU/RED frame reaches paint. Why the frame painter alone was not enough (the twelve at
   play, 2026-10-21): (a) hudMag copies #phScore into #magStrip BEFORE hudScore overwrites it, so the mirror painted
   BLU for one frame after a hit (Aset); (b) PAUSE stops phys, so an event-time hudScore() from applyHit left BLU on
   the glass until unpause (Krishna). hudScore is not edited — its "BLU n · RED n" line is the off-Range else branch and stays as it
   is (on the Range hudScore prints MODE · HIT n · MISS n); no new control, no new row. The observer never loops: the
   writer writes only when the text differs.
   =================================================================================================================== */
function capPaintScore(){ const ps=document.getElementById('phScore'), ms=document.getElementById('magStrip'); if(!ps) return; const c=state.capRun?capIntroRows(state.capRun):{hits:0,misses:0}; const t='HIT '+(c.hits|0)+' · MISS '+(c.misses|0); if(ps.textContent!==t) ps.textContent=t; if(ms&&ms.textContent!==t) ms.textContent=t; }
(function(){ try{ const ps=document.getElementById('phScore'); if(!ps||typeof MutationObserver!=='function') return; new MutationObserver(()=>{ if(typeof capIntro==='function'&&capIntro()) capPaintScore(); }).observe(ps,{childList:true,characterData:true,subtree:true}); }catch(e){ try{ log('LAWN','SCORE',String(e).slice(0,80)); }catch(_){ } } })();

</script>"""
s = s.replace(TAIL, WRITER, 1)

# === M2 · the boot-QA row, deferred, before the r.221 lawn block ==============================================
ROW = r"""  /* r.222 · the lawn strip shows HIT and MISS, never BLU/RED (operator 2026-10-21: CRS-CL.H01, the glass half).
     Red on the r.221 bytes: #phScore on the lawn falls into hudScore's else branch and reads "BLU 0 · RED 0", because
     that line is gated to the Range. Green on the cut: capPaintLawn (which runs after hudScore each frame) writes
     HIT n · MISS n from capIntroRows. Same door, snapshot and restore as the lawn block; the Range strip is unread. */
  setTimeout(async ()=>{ const _s0=state._qaSilent, pz0=state.paused; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='LAWN_SHOWS_HIT_MISS')) return;
    const snap=rangeSnap(); const ph0=state.lobby?state.lobby.phase:null; const q0=state.qaArmed;
    const sv=Object.keys(units).filter(id=>units[id]&&units[id].kind==='turret').map(id=>[id,units[id].x,units[id].y,units[id].z,units[id].yaw,units[id].pan,units[id].tilt,units[id].label]);
    const pops0=pops.map(p=>p.up); const dr0=drones.map(d=>({up:d.up,x:d.x,y:d.y,z:d.z,life:d.life,lifePct:d.lifePct,fall:d.fall,vx:d.vx,vz:d.vz,mist:d.mist}));
    const cl0=state.clock, tk0=state.tick, mg0=state.mag?Object.assign({},state.mag):null;
    let ok=false, note='';
    try{ state.qaArmed=true; state._qaSilent=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false;
      pickScenario('capital'); state.capDrill='stay'; capIntroReset('QA'); capIntroStart();                 /* lawn TRAIN DOWN, armed then running */
      hudScore(); paintCues();                                                                              /* hudScore writes BLU/RED; capPaintLawn (in paintCues) overrides it */
      const t=(document.getElementById('phScore')||{}).textContent||'';
      ok = /^HIT \d+ · MISS \d+$/.test(t) && t.indexOf('BLU')<0 && t.indexOf('RED')<0;
      note = 'the lawn strip reads "'+t+'" - HIT and MISS, not BLU/RED: '+ok;
      state.paused=true; hudScore(); await Promise.resolve(); const tp=(document.getElementById('phScore')||{}).textContent||''; state.paused=pz0; /* PAUSE stops phys, so no frame painter runs; an event-time hudScore() (applyHit) must still leave HIT/MISS on the glass before paint — the lawn's observer re-asserts it as a microtask (Krishna, the twelve at play) */
      ok = ok && /^HIT \d+ · MISS \d+$/.test(tp) && tp.indexOf('BLU')<0;
      note += ' · paused, after an event-time hudScore() the strip reads "'+tp+'": '+(/^HIT/.test(tp));
    }catch(e){ note='threw '+String(e).slice(0,100); }
    finally { state.paused=pz0; try{ pickScenario('range'); }catch(_){ } state.capStep=null; state.capRun=null; state.capDrill=null; sv.forEach(a=>{ const t=units[a[0]]; if(t){ t.x=a[1];t.y=a[2];t.z=a[3];t.yaw=a[4];t.pan=a[5];t.tilt=a[6];t.label=a[7]; } }); pops.forEach((p,i)=>{ p.up=pops0[i]; }); drones.forEach((dd,i)=>Object.assign(dd,dr0[i])); state.challenge=snap.challenge; state.rangeMode=snap.rangeMode; state.lane=snap.lane; state.zoom=snap.zoom; state.phase=snap.phase; state.hits=snap.hits; state.passed=snap.passed; state.unit=snap.unit; state.mode=snap.mode; state.viewMode=snap.view; state.clock=cl0; state.tick=tk0; if(mg0) state.mag=mg0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; if(state.lobby) state.lobby.phase=ph0; state.qaArmed=q0; state._qaSilent=_s0; rangeReset(); }
    rows.push({id:'LAWN_SHOWS_HIT_MISS',ok,note});
  }catch(e){ state._qaSilent=_s0; if(!rows.some(x=>x.id==='LAWN_SHOWS_HIT_MISS')) rows.push({id:'LAWN_SHOWS_HIT_MISS',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1762); /* after the r.221 four-numbers row (1748) completes */
"""
rep(ANCHOR, ROW + ANCHOR)

# === the invariants ==========================================================================================
if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')
if "r.222: CRS-CL.H01 glass half" not in s or 'LAWN_SHOWS_HIT_MISS' not in s or 'function capPaintScore(' not in s or s.count('new MutationObserver(()=>{ if(typeof capIntro===') != 1: raise SystemExit('REFUSE: the glass half (writer, observer, row) did not land')
if "if(+state.challenge===0) rangeTick(" not in s: raise SystemExit('REFUSE: the frozen range tick call moved')
if "QUAL 40 IS TRAINING · ON THE RANGE" not in s: raise SystemExit('REFUSE: the lawn QUAL 40 refusal was removed')
if "('BLU '+(state.blu|0)+' · RED '+(state.red|0))" not in s: raise SystemExit('REFUSE: the Range/else hudScore line was changed')
if "decide('CTIME','LAWN',{mode:'stay',seat:'A1',ms:ms,hits:c.hits,misses:c.misses,rounds:(c.hits|0)+(c.misses|0)})" not in s: raise SystemExit('REFUSE: the r.221 CTIME fourth number was disturbed')
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit('REFUSE: script #%d does not parse: %s' % (i, r.stderr[:300]))

OUT = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(OUT, 'w', encoding='utf-8').write(s)
print('OK r.%s -> r.%s · %d bytes · sha256 %s' % (BASE_REV, NEW_REV, len(s.encode('utf-8')), hashlib.sha256(s.encode('utf-8')).hexdigest()[:16]))

# r.224 -> r.225 — H01: TRAIN DOWN ENDS AND THE STRIP KEEPS THE FOUR (operator 2026-10-21, the night brief)
#  "r.225 · H01. Train Down ends and the strip keeps hits, misses, rounds, and time. The toast may expire. The strip does
#  not. HI 1 · systems 1 · partners 0."
#  The four numbers CTIME already stores (hits, misses, rounds, ms) are kept in state.capLast when the run ends; the
#  lawn's one strip writer (capPaintScore, r.222) reads them while the run is done — and while the next run is merely
#  armed by RESTART, until START opens a live run — so the strip reads HIT n · MISS n · n RDS · m:ss.t and stays.
#  Leaving the lawn or changing the drill clears them (capIntroReset for ENTER / MODE; never for RESTART). No new row, no
#  new verb: the record is untouched. All in the FREE capIntro* family; no frozen definition moves.
import hashlib, os, re, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
if not os.path.exists(os.path.join(DECK, 'HASHES_r224.sha256')):
    DECK = os.path.join(ROOT, 'docs', 'drone-2525', 'operator-deck')
BASE_REV = '224'; NEW_REV = '225'
DEV = os.environ.get('DECK_DEV') == '1'
BASE_SHA = open(os.path.join(DECK, 'HASHES_r' + BASE_REV + '.sha256'), encoding='utf-8').read().split()[0] if os.path.exists(os.path.join(DECK, 'HASHES_r' + BASE_REV + '.sha256')) else None
SRC = os.environ.get('DECK_SRC') or os.path.join(DECK, 'drone-2525_r.' + BASE_REV + '.html')
s = open(SRC, encoding='utf-8').read()
if not DEV and hashlib.sha256(s.encode('utf-8')).hexdigest() != BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.' + BASE_REV)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: raise SystemExit('REFUSE: expected %d of %r, found %d' % (count, old[:90], n))
    s = s.replace(old, new, count); return s

RESET = "function capIntroReset(why){ const d=capIntroTrack(); if(!d) return;"
DONE = "decide('CTIME','LAWN',{mode:'stay',seat:'A1',ms:ms,hits:c.hits,misses:c.misses,rounds:(c.hits|0)+(c.misses|0)});"
SCORE = "const c=state.capRun?capIntroRows(state.capRun):{hits:0,misses:0}; const t='HIT '+(c.hits|0)+' · MISS '+(c.misses|0);"
TAIL = "}catch(e){ try{ log('RANGE','DRONE',String(e).slice(0,80)); }catch(_){ } } })();\n\n</script>"
ROWANCHOR = "  /* r.224 · the Range's one drone, off by default (operator 2026-10-21:"
for need in [RESET, DONE, SCORE, TAIL, ROWANCHOR, "function capPaintScore(){", "function capClockWord(sec){", "function capIntroPress(){", "function capIntroMode(v){"]:
    if s.count(need) != 1: raise SystemExit('REFUSE: the r.224 base does not carry exactly one of: ' + need[:70])
for dead in ['capStripText', 'state.capLast', 'THE_STRIP_KEEPS_THE_FOUR']:
    if dead in s: raise SystemExit('REFUSE: r.225 is already in the base: ' + dead)

# === the head ================================================================================================
rep("<span>r0.224</span>", "<span>r0.225</span>")
rep("revision:'0.224'", "revision:'0.225'")

# === the embedded R-CORE record moves on one row (lag exactly one, deck-rcore): through 103 -> 104 ============
LEDGER = json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku|Fable|Mythos)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
THROUGH = 104
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
if not DEV and not re.match(r'^[0-9a-f]{7,40}$', str(LEDGER['entries'][103].get('shipped', ''))): raise SystemExit('REFUSE: rev 104 (r.224) has no ship commit yet: ' + str(LEDGER['entries'][103].get('shipped')))
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
if json.loads(_old.group(1)).get('through') != 103: raise SystemExit('REFUSE: expected the r.224 base to embed through 103')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]

# === M1 · the four numbers are kept when the run ends (beside the CTIME row — the same four, no new row) =========
rep(DONE, DONE + " state.capLast={hits:c.hits|0,misses:c.misses|0,rounds:(c.hits|0)+(c.misses|0),ms:ms}; /* r.225: the four numbers the strip keeps */")
# === M2 · a new visit or a new drill forgets them; RESTART (the next run, armed) keeps them until START ===========
rep(RESET, RESET + " if(why!=='RESTART') state.capLast=null; /* r.225: the strip's four stay through RESTART, not through a new drill or a new visit */")
# === M3 · the one strip writer reads them =========================================================================
rep(SCORE, "const t=capStripText(); /* r.225: the four stay after the run ends */")
# === M4 · the text itself (append zone, hoisted) =================================================================
FOUR = r"""}catch(e){ try{ log('RANGE','DRONE',String(e).slice(0,80)); }catch(_){ } } })();

/* ===================================================================================================================
   r.225 — H01: TRAIN DOWN ENDS AND THE STRIP KEEPS THE FOUR (operator 2026-10-21: "Train Down ends and the strip
   keeps hits, misses, rounds, and time. The toast may expire. The strip does not."). INVARIANT: when a lawn Train Down
   run ends the strip reads the run's four numbers — HIT n · MISS n · n RDS · m:ss.t, the same four CTIME stored — and
   keeps reading them: through the ALL DOWN toast's expiry, through RESTART (the next run armed, not started), until
   START opens a live run, the drill changes or the player leaves the lawn. No new row, no new verb.
   =================================================================================================================== */
function capStripText(){ const R=state.capRun, L=state.capLast;
  if(L&&R&&(R.go==='done'||R.go==='armed')) return 'HIT '+(L.hits|0)+' · MISS '+(L.misses|0)+' · '+(L.rounds|0)+' RD'+((L.rounds|0)===1?'':'S')+' · '+capClockWord((L.ms||0)/1000);
  const c=R?capIntroRows(R):{hits:0,misses:0}; return 'HIT '+(c.hits|0)+' · MISS '+(c.misses|0); }

</script>"""
rep(TAIL, FOUR)

# === M5 · the boot-QA row ======================================================================================
ROW = r"""  /* r.225 · the strip keeps the four (operator 2026-10-21: "Train Down ends and the strip keeps hits, misses, rounds,
     and time. The toast may expire. The strip does not."). Red on the r.224 bytes: after ALL DOWN the strip reads HIT n ·
     MISS n (no rounds, no time) and RESTART wipes it to HIT 0 · MISS 0. Green on the cut: at ALL DOWN the strip reads the
     four; after RESTART (armed) it still reads the four; at START (a live run) it reads the live HIT 0 · MISS 0. Same
     door, snapshot and restore as the lawn rows. */
  setTimeout(()=>{ const _s0=state._qaSilent; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='THE_STRIP_KEEPS_THE_FOUR')) return;
    const snap=rangeSnap(); const ph0=state.lobby?state.lobby.phase:null; const q0=state.qaArmed;
    const sv=Object.keys(units).filter(id=>units[id]&&units[id].kind==='turret').map(id=>[id,units[id].x,units[id].y,units[id].z,units[id].yaw,units[id].pan,units[id].tilt,units[id].label]);
    const pops0=pops.map(p=>p.up); const dr0=drones.map(d=>({up:d.up,x:d.x,y:d.y,z:d.z,life:d.life,lifePct:d.lifePct,fall:d.fall,vx:d.vx,vz:d.vz,mist:d.mist}));
    const cl0=state.clock, tk0=state.tick, mg0=state.mag?Object.assign({},state.mag):null;
    let ok=false, note='';
    try{ state.qaArmed=true; state._qaSilent=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false;
      pickScenario('capital'); const d=capIntroTrack(), u=units[state.unit]; const ps=document.getElementById('phScore');
      const strip=()=>{ capPaintScore(); return ps?ps.textContent:''; };
      capIntroMode('stay'); const started=capIntroPress();                                                /* START */
      aimUnitAt(u,d,-40,40); state.aimRef=d; markLock(lockOn(),'BTN'); approveDesig('HI-2');
      for(let i=0;i<50;i++){ state.clock+=0.05; capIntroTick(0.05); }                                   /* the Sentinel names it */
      fireN(state.desig&&state.desig.slot||1); for(let i=0;i<30;i++){ state.clock+=0.05; capIntroTick(0.05); }
      const done=!!state.capRun&&state.capRun.go==='done'; const t1=strip();
      const four=/^HIT 1 · MISS 0 · 1 RD · \d+:\d\d\.\d$/.test(t1)&&!!state.capLast&&state.capLast.hits===1&&state.capLast.misses===0&&state.capLast.rounds===1&&typeof state.capLast.ms==='number';
      for(let i=0;i<80;i++){ state.clock+=0.05; capIntroTick(0.05); } const t1b=strip();               /* four seconds on: the toast may expire, the strip does not */
      const rearmed=capIntroPress(); const armed=!!state.capRun&&state.capRun.go==='armed'; const t2=strip();   /* RESTART: the next run armed */
      const kept=t2===t1&&t1b===t1;
      const started2=capIntroPress(); const live=!!state.capRun&&state.capRun.go==='run'; const t3=strip();     /* START: a live run */
      ok = started&&done&&four&&rearmed&&armed&&kept&&started2&&live&&/^HIT 0 · MISS 0$/.test(t3);
      note = 'ALL DOWN: the strip reads "'+t1+'" (the four) '+four+' · 4 s later "'+t1b+'" · after RESTART (armed '+armed+') "'+t2+'" kept '+kept+' · after START (live '+live+') "'+t3+'"';
    }catch(e){ note='threw '+String(e).slice(0,100); }
    finally { try{ pickScenario('range'); }catch(_){ } state.capStep=null; state.capRun=null; state.capDrill=null; state.capLast=null; sv.forEach(a=>{ const t=units[a[0]]; if(t){ t.x=a[1];t.y=a[2];t.z=a[3];t.yaw=a[4];t.pan=a[5];t.tilt=a[6];t.label=a[7]; } }); pops.forEach((p,i)=>{ p.up=pops0[i]; }); drones.forEach((dd,i)=>Object.assign(dd,dr0[i])); state.challenge=snap.challenge; state.rangeMode=snap.rangeMode; state.lane=snap.lane; state.zoom=snap.zoom; state.phase=snap.phase; state.hits=snap.hits; state.passed=snap.passed; state.unit=snap.unit; state.mode=snap.mode; state.viewMode=snap.view; state.clock=cl0; state.tick=tk0; if(mg0) state.mag=mg0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.aimRef=null; if(state.lobby) state.lobby.phase=ph0; state.qaArmed=q0; state._qaSilent=_s0; rangeReset(); }
    rows.push({id:'THE_STRIP_KEEPS_THE_FOUR',ok,note});
  }catch(e){ state._qaSilent=_s0; if(!rows.some(x=>x.id==='THE_STRIP_KEEPS_THE_FOUR')) rows.push({id:'THE_STRIP_KEEPS_THE_FOUR',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1805); /* after the r.224 row (1790) */
"""
rep(ROWANCHOR, ROW + ROWANCHOR)

# === the invariants ==========================================================================================
if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')
for must in ['function capStripText(', "rows.push({id:'THE_STRIP_KEEPS_THE_FOUR',ok,note})", 'const t=capStripText();', 'state.capLast={hits:', "if(why!=='RESTART') state.capLast=null;", 'function capPaintScore(', 'function rangeDroneTick(', 'function foilDraw(']:
    if s.count(must) != 1: raise SystemExit('REFUSE: expected exactly one %r' % must)
if s.count("'THE_STRIP_KEEPS_THE_FOUR'") != 4: raise SystemExit('REFUSE: the row id must appear exactly four times')
if "if(+state.challenge===0) rangeTick(" not in s: raise SystemExit('REFUSE: the frozen range tick call moved')
if "QUAL 40 IS TRAINING · ON THE RANGE" not in s: raise SystemExit('REFUSE: the lawn QUAL 40 refusal was removed')
if "('BLU '+(state.blu|0)+' · RED '+(state.red|0))" not in s: raise SystemExit('REFUSE: the Range/else hudScore line was changed')
if s.count("decide('CTIME'") != 1 or "decide('CLAST'" in s: raise SystemExit('REFUSE: a new row or verb was added')
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit('REFUSE: script #%d does not parse: %s' % (i, r.stderr[:300]))

OUT = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(OUT, 'w', encoding='utf-8').write(s)
print('OK r.%s -> r.%s · %d bytes · sha256 %s' % (BASE_REV, NEW_REV, len(s.encode('utf-8')), hashlib.sha256(s.encode('utf-8')).hexdigest()[:16]))

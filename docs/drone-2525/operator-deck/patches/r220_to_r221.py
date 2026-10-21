# r.220 -> r.221 — INTRODUCTORY ON THE CAPITAL LAWN: TRAIN DOWN WRITES THE FOURTH NUMBER (operator 2026-10-21)
#  "Train Down writes hits, misses, rounds, and time. No time means it does not count." On the lawn the TRAIN DOWN
#  run already writes CSTART + CTIME{ms,hits,misses}; this revision adds the fourth number, rounds, to CTIME (rounds =
#  HIT + MISS rows = rounds spent, which the magazine matches). Train Up stays infinite practice (no start, no timer, no
#  run record); Qual 40 stays refused on the lawn (one track is not a 40-target qual); the Range is untouched (r0.220);
#  a person is never a target, the Capitol and its facades are not targets. One edit in the FREE capIntroTick, one boot
#  gate, red first on the r.220 bytes (CTIME has no rounds there). No toggle, no Range control.
import hashlib, os, re, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
BASE_REV = '220'; NEW_REV = '221'
BASE_SHA = open(os.path.join(DECK, 'HASHES_r' + BASE_REV + '.sha256'), encoding='utf-8').read().split()[0]
SRC = os.path.join(DECK, 'drone-2525_r.' + BASE_REV + '.html')
s = open(SRC, encoding='utf-8').read()
if hashlib.sha256(s.encode('utf-8')).hexdigest() != BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.' + BASE_REV)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: raise SystemExit('REFUSE: expected %d of %r, found %d' % (count, old[:90], n))
    s = s.replace(old, new, count); return s

for need in ["const c=capIntroRows(R); decide('CTIME','LAWN',{mode:'stay',seat:'A1',ms:ms,hits:c.hits,misses:c.misses});",
             "function capIntroStart(){",
             "  /* r.219 · the five lawn rows. ONE door (pickScenario('capital') -> capIntroEnter), every unit snapshotted and"]:
    if need not in s: raise SystemExit('REFUSE: the r.220 base does not carry: ' + need[:60])
for dead in ['rounds:(c.hits', 'LAWN_TRAIN_DOWN_FOUR_NUMBERS', 'state.aerial', 'btnAerial']:
    if dead in s: raise SystemExit('REFUSE: r.221 is already in the base: ' + dead)

# === the head ================================================================================================
rep("<span>r0.220</span>", "<span>r0.221</span>")
rep("revision:'0.220'", "revision:'0.221'")

# === the embedded R-CORE record moves on one row (lag exactly one, deck-rcore) ===============================
LEDGER = json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku|Fable|Mythos)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
THROUGH = 100
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
if not re.match(r'^[0-9a-f]{7,40}$', str(LEDGER['entries'][99].get('shipped', ''))): raise SystemExit('REFUSE: rev 100 (r.220) has no ship commit yet: ' + str(LEDGER['entries'][99].get('shipped')))
_e = []
for e in LEDGER['entries'][:THROUGH]:
    o = {'rev': e['rev'], 'date': e['date'], 'kind': e['kind'], 'text': MODEL.sub('an external model', e.get('text', '')), 'commit': e.get('commit', '')}
    if 'shipped' in e: o['shipped'] = e['shipped']
    _e.append(o)
BLOCK = json.dumps({'section': LEDGER['section'], 'route': LEDGER['route'], 'through': THROUGH, 'entries': _e}, ensure_ascii=False, separators=(',', ':'))
for bad in ['</script', '<!--', '-->', ' ', ' ']:
    if bad in BLOCK: raise SystemExit('REFUSE: the ledger block carries %r' % bad)
_old = re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/', s)
if not _old: raise SystemExit('REFUSE: the embedded ledger block was not found')
if json.loads(_old.group(1)).get('through') != 99: raise SystemExit('REFUSE: expected the r.220 base to embed through 99')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]

# === M1 · the fourth number: CTIME carries rounds on a lawn TRAIN DOWN run ====================================
rep("const c=capIntroRows(R); decide('CTIME','LAWN',{mode:'stay',seat:'A1',ms:ms,hits:c.hits,misses:c.misses});",
    "const c=capIntroRows(R); decide('CTIME','LAWN',{mode:'stay',seat:'A1',ms:ms,hits:c.hits,misses:c.misses,rounds:(c.hits|0)+(c.misses|0)}); /* r.221: the fourth number - hits, misses, rounds (HIT+MISS = rounds spent, the magazine matches) and time; no time means it does not count (his 2026-10-21) */")

# === M2 · the boot-QA row, deferred between the cue rows (1745) and the r.219 lawn block (1750) ================
ANCHOR = "  /* r.219 · the five lawn rows. ONE door (pickScenario('capital') -> capIntroEnter), every unit snapshotted and\n"
ROW = r"""  /* r.221 · a lawn TRAIN DOWN run writes the four numbers (operator 2026-10-21: "Train Down writes hits, misses,
     rounds, and time. No time means it does not count."). Red on the r.220 bytes: CTIME there carries ms/hits/misses
     but no rounds. Same door, snapshot and restore as the lawn block. TRAIN UP writes no CSTART/CTIME (infinite
     practice); QUAL 40 is refused on the lawn (one track is not a 40-target qual) — both asserted here too. */
  setTimeout(()=>{ const _s0=state._qaSilent; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='LAWN_TRAIN_DOWN_FOUR_NUMBERS')) return;
    const ev=()=>state.events||[], dec=()=>state.decisions||[];
    const snap=rangeSnap(); const ph0=state.lobby?state.lobby.phase:null; const q0=state.qaArmed;
    const sv=Object.keys(units).filter(id=>units[id]&&units[id].kind==='turret').map(id=>[id,units[id].x,units[id].y,units[id].z,units[id].yaw,units[id].pan,units[id].tilt,units[id].label]);
    const pops0=pops.map(p=>p.up); const dr0=drones.map(d=>({up:d.up,x:d.x,y:d.y,z:d.z,life:d.life,lifePct:d.lifePct,fall:d.fall,vx:d.vx,vz:d.vz,mist:d.mist}));
    const cl0=state.clock, tk0=state.tick, mg0=state.mag?Object.assign({},state.mag):null;
    let ok=false, note='';
    try{ state.qaArmed=true; state._qaSilent=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false;
      pickScenario('capital'); state.capDrill='stay'; capIntroReset('QA');
      const d=capIntroTrack(), u=units[state.unit];
      const qualRefused = capIntroMode('qual40')===false && capIntroDrill()==='stay';            /* QUAL 40 stays refused on the lawn */
      state.capDrill='stay'; capIntroReset('QA');
      const k0=dec().length, mg=state.mag?(state.mag.rounds|0):-1;
      const started = capIntroStart();                                                           /* CSTART, the track stands, the clock opens */
      const CS=dec().slice(k0).find(r=>r.kind==='CSTART'&&r.mode==='stay');
      const aim=()=>{ aimUnitAt(u,d,-40,40); state.aimRef=d; paintCues(); };
      aim(); markLock(lockOn(),'BTN'); approveDesig('HI-2');
      for(let i=0;i<60;i++){ state.clock+=0.05; capIntroTick(0.05); }                             /* the Sentinel names it first (r.220) */
      fireN(state.desig&&state.desig.slot||1);
      for(let i=0;i<60;i++){ state.clock+=0.05; capIntroTick(0.05); }                             /* the fall completes, CTIME is written */
      const CT=dec().slice(k0).find(r=>r.kind==='CTIME'&&r.mode==='stay');
      const hitrows=ev().slice((CS&&CS!=null)?0:0).filter(e=>(e.verb==='HIT'||e.verb==='MISS')&&e.id===d.id);
      const h=CT?(CT.hits|0):-1, m=CT?(CT.misses|0):-2, rd=CT?CT.rounds:undefined, tms=CT?CT.ms:undefined;
      const fourNumbers = !!CT && typeof tms==='number' && tms>=0 && typeof rd==='number' && rd===(h+m) && (h+m)>=1;
      const magMatch = mg<0 ? true : (mg-(state.mag?(state.mag.rounds|0):mg))===(h+m);            /* rounds spent = the magazine delta */
      ok = !!CS && fourNumbers && magMatch && qualRefused;
      note = 'CSTART '+!!CS+' · CTIME {ms '+tms+', hits '+h+', misses '+m+', rounds '+rd+'} · rounds = hits+misses '+(rd===(h+m))+' · magazine matches '+magMatch+' · QUAL 40 refused on the lawn '+qualRefused;
    }catch(e){ note='threw '+String(e).slice(0,100); }
    finally { try{ pickScenario('range'); }catch(_){ } state.capStep=null; state.capRun=null; state.capDrill=null; sv.forEach(a=>{ const t=units[a[0]]; if(t){ t.x=a[1];t.y=a[2];t.z=a[3];t.yaw=a[4];t.pan=a[5];t.tilt=a[6];t.label=a[7]; } }); pops.forEach((p,i)=>{ p.up=pops0[i]; }); drones.forEach((dd,i)=>Object.assign(dd,dr0[i])); state.challenge=snap.challenge; state.rangeMode=snap.rangeMode; state.lane=snap.lane; state.zoom=snap.zoom; state.phase=snap.phase; state.hits=snap.hits; state.passed=snap.passed; state.unit=snap.unit; state.mode=snap.mode; state.viewMode=snap.view; state.clock=cl0; state.tick=tk0; if(mg0) state.mag=mg0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; if(state.lobby) state.lobby.phase=ph0; state.qaArmed=q0; state._qaSilent=_s0; rangeReset(); }
    rows.push({id:'LAWN_TRAIN_DOWN_FOUR_NUMBERS',ok,note});
  }catch(e){ state._qaSilent=_s0; if(!rows.some(x=>x.id==='LAWN_TRAIN_DOWN_FOUR_NUMBERS')) rows.push({id:'LAWN_TRAIN_DOWN_FOUR_NUMBERS',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1748); /* between the cue rows (1745) and the r.219 lawn block (1750) */
"""
rep(ANCHOR, ROW + ANCHOR)

# === the invariants ==========================================================================================
if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')
if 'rounds:(c.hits|0)+(c.misses|0)' not in s or 'LAWN_TRAIN_DOWN_FOUR_NUMBERS' not in s: raise SystemExit('REFUSE: the fourth number did not land')
if "if(+state.challenge===0) rangeTick(" not in s: raise SystemExit('REFUSE: the frozen range tick call moved')
if "QUAL 40 IS TRAINING · ON THE RANGE" not in s: raise SystemExit('REFUSE: the lawn QUAL 40 refusal was removed')
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit('REFUSE: script #%d does not parse: %s' % (i, r.stderr[:300]))

OUT = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(OUT, 'w', encoding='utf-8').write(s)
print('OK r.%s -> r.%s · %d bytes · sha256 %s' % (BASE_REV, NEW_REV, len(s.encode('utf-8')), hashlib.sha256(s.encode('utf-8')).hexdigest()[:16]))

# r.225 -> r.226 — H01: THE FOIL DROPS, IT DOES NOT VANISH (operator 2026-10-21, the night brief)
#  "r.226 · H01. Only if the r.223 foil vanishes instead of dropping. Reuse the fall the plates already use. If it already
#  drops, SKIP." It vanishes (the r.223 spiral, backward): the HIT row lowers a non-plate in the same press — applyWorld,
#  `if((o.lifePct||0)<=0&&!o.form) o.up=false;` — so capIntroTick's fall ramp (the plates' own 0→1 fall at 2.4/s, r.206's
#  shape) is dead for a local hit and the painter's `if(!d.up) return` removes the foil on the next frame. r.226 lets the
#  lawn's track keep its feet through its fall exactly as a plate does (the same applyWorld line exempts it), drops it to
#  the ground on the plates' ramp (d.y from the track's altitude to 1 m as fall goes 0→1), noses the foil over as it falls
#  (foilDraw pitches by fall), drops its mark at the first frame of the fall (so a second FIRE has no red box), and keeps a
#  falling track out of the lock. The CTIME row, the four numbers and the strip are untouched.
import hashlib, os, re, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
if not os.path.exists(os.path.join(DECK, 'HASHES_r225.sha256')):
    DECK = os.path.join(ROOT, 'docs', 'drone-2525', 'operator-deck')
BASE_REV = '225'; NEW_REV = '226'
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

WORLD = "      if((o.lifePct||0)<=0&&!o.form) o.up=false;"
RAMP = "  if(struck&&R.hitT==null){ if(d.up){ d.fall=Math.min(1,(d.fall||0)+dt*2.4); if(d.fall<1) return; d.up=false; }"
LOCK = "  drones.forEach(d=>{ if(!d.up) return; add(d,'uav',d,340); });"
ATT = "  const A=foilAtt(d); state.foilAtt=A; const P=(px,py,pz)=>proj(foilToDeck(d,px,py,pz,A),cam,W,H), B=(f,i)=>P(f[i],f[i+1],f[i+2]);"
ROWANCHOR = "  /* r.225 · the strip keeps the four (operator 2026-10-21:"
for need in [WORLD, RAMP, LOCK, ATT, ROWANCHOR, "function capIntroAltM(", "function capIntroTrack(){", "function dropMark(id,why){"]:
    if s.count(need) != 1: raise SystemExit('REFUSE: the r.225 base does not carry exactly one of: ' + need[:70])
for dead in ['THE_FOIL_DROPS', 'R.falling']:
    if dead in s: raise SystemExit('REFUSE: r.226 is already in the base: ' + dead)

# === the head ================================================================================================
rep("<span>r0.225</span>", "<span>r0.226</span>")
rep("revision:'0.225'", "revision:'0.226'")

# === the embedded R-CORE record moves on one row (lag exactly one, deck-rcore): through 104 -> 105 ============
LEDGER = json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku|Fable|Mythos)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
THROUGH = 105
if DEV and len(LEDGER['entries']) < THROUGH: THROUGH = len(LEDGER['entries'])   # a dev build before the previous records commit embeds what the ledger has
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
if not DEV and not re.match(r'^[0-9a-f]{7,40}$', str(LEDGER['entries'][104].get('shipped', ''))): raise SystemExit('REFUSE: rev 105 (r.225) has no ship commit yet: ' + str(LEDGER['entries'][104].get('shipped')))
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
if not DEV and json.loads(_old.group(1)).get('through') != 104: raise SystemExit('REFUSE: expected the r.225 base to embed through 104')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]

# === M1 · the HIT row leaves the lawn's track on its feet through its fall, as it leaves a plate (FREE applyWorld) ===
rep(WORLD, "      if((o.lifePct||0)<=0&&!o.form&&!(typeof capIntroTrack==='function'&&o===capIntroTrack())) o.up=false; /* r.226: the lawn's track falls like a plate — its own tick lowers it when the fall ends */")
# === M2 · the plates' ramp drops it to the ground; its mark goes at the first frame of the fall (FREE capIntroTick) ===
rep(RAMP, "  if(struck&&R.hitT==null){ if(d.up){ if(!R.falling){ R.falling=true; if(typeof dropMark==='function') dropMark(d.id,'FALL'); } d.fall=Math.min(1,(d.fall||0)+dt*2.4); d.y=1+(capIntroAltM()-1)*(1-d.fall); /* r.226: it drops, it does not vanish — the plates' own ramp (2.4/s), the altitude to the ground, the foil nosing over (foilDraw) */ if(d.fall<1) return; d.up=false; }")
# === M3 · a falling track is not a lock (FREE lockOn) ===========================================================
rep(LOCK, "  drones.forEach(d=>{ if(!d.up||d.lifePct<=0) return; add(d,'uav',d,340); }); /* r.226: a falling track is not a lock */")
# === M4 · the foil noses over as it falls (FREE foilDraw) ======================================================
rep(ATT, "  const A=foilAtt(d); if((d.fall||0)>0) A.pitch-=Math.min(1,d.fall)*Math.PI/2; /* r.226: it noses over as it falls */ state.foilAtt=A; const P=(px,py,pz)=>proj(foilToDeck(d,px,py,pz,A),cam,W,H), B=(f,i)=>P(f[i],f[i+1],f[i+2]);")

# === M5 · the boot-QA row ======================================================================================
ROW = r"""  /* r.226 · the foil drops, it does not vanish (operator 2026-10-21: "Only if the r.223 foil vanishes instead of
     dropping. Reuse the fall the plates already use."). Red on the r.225 bytes: the HIT row lowers the track in the
     same press, so right after FIRE it is down and gone. Green on the cut: right after FIRE the track still stands at
     lifePct 0 with its fall begun and its mark dropped; over the plates' ramp it sinks to the ground and the foil is
     still drawn; at the ramp's end it is down and CTIME holds one hit. Same door, snapshot and restore as the lawn rows. */
  setTimeout(()=>{ const _s0=state._qaSilent; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='THE_FOIL_DROPS')) return;
    const snap=rangeSnap(); const ph0=state.lobby?state.lobby.phase:null; const q0=state.qaArmed; const z0=state.zoom, vm0=state.viewMode;
    const sv=Object.keys(units).filter(id=>units[id]&&units[id].kind==='turret').map(id=>[id,units[id].x,units[id].y,units[id].z,units[id].yaw,units[id].pan,units[id].tilt,units[id].label]);
    const pops0=pops.map(p=>p.up); const dr0=drones.map(d=>({up:d.up,x:d.x,y:d.y,z:d.z,life:d.life,lifePct:d.lifePct,fall:d.fall,vx:d.vx,vz:d.vz,mist:d.mist}));
    const cl0=state.clock, tk0=state.tick, mg0=state.mag?Object.assign({},state.mag):null;
    let ok=false, note='';
    try{ state.qaArmed=true; state._qaSilent=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false;
      pickScenario('capital'); state.viewMode='op'; state.zoom=1; const d=capIntroTrack(), u=units[state.unit];
      capIntroMode('stay'); capIntroPress();                                                              /* START */
      aimUnitAt(u,d,-40,40); state.aimRef=d; markLock(lockOn(),'BTN'); approveDesig('HI-2');
      for(let i=0;i<50;i++){ state.clock+=0.05; capIntroTick(0.05); }                                   /* the Sentinel names it */
      const y0=d.y; const k0=(state.decisions||[]).length; fireN(state.desig&&state.desig.slot||1);
      const stillUp=d.up===true&&d.lifePct<=0&&(d.fall||0)>0;                                            /* not vanished: on its feet at the first frame of the fall */
      state.clock+=0.1; capIntroTick(0.1); const markGone=!state.desig&&!(lockOn()&&lockOn().id===d.id); draw(); const drawn=(state.foilSegs|0)>0&&d.up&&d.fall<1;
      state.clock+=0.1; capIntroTick(0.1); const sinking=d.up&&d.y<y0-1&&d.fall>0.3&&d.fall<1;         /* 0.2 s in: half-fallen, lower than it stood */
      let n=0; while(d.up&&n<20){ state.clock+=0.05; capIntroTick(0.05); n++; } const down=!d.up&&d.fall>=1;
      const CT=(state.decisions||[]).slice(k0).find(r=>r.kind==='CTIME'); const once=!!CT&&CT.hits===1&&CT.misses===0&&(state.decisions||[]).slice(k0).filter(r=>r.kind==='CTIME').length===1;
      ok = stillUp&&markGone&&drawn&&sinking&&down&&once;
      note = 'after FIRE: still up at lifePct 0 with the fall begun '+stillUp+' · the mark dropped at the first frame '+markGone+' · the foil still drawn while falling '+drawn+' · 0.2 s in: sinking (y '+y0.toFixed(1)+' → '+d.y.toFixed(1)+' m) '+sinking+' · down at the ramp\'s end in '+((n+4)*50)+' ms '+down+' · one CTIME, one hit '+once;
    }catch(e){ note='threw '+String(e).slice(0,100); }
    finally { state.zoom=z0; state.viewMode=vm0; try{ pickScenario('range'); }catch(_){ } state.capStep=null; state.capRun=null; state.capDrill=null; state.capLast=null; sv.forEach(a=>{ const t=units[a[0]]; if(t){ t.x=a[1];t.y=a[2];t.z=a[3];t.yaw=a[4];t.pan=a[5];t.tilt=a[6];t.label=a[7]; } }); pops.forEach((p,i)=>{ p.up=pops0[i]; }); drones.forEach((dd,i)=>Object.assign(dd,dr0[i])); state.challenge=snap.challenge; state.rangeMode=snap.rangeMode; state.lane=snap.lane; state.zoom=snap.zoom; state.phase=snap.phase; state.hits=snap.hits; state.passed=snap.passed; state.unit=snap.unit; state.mode=snap.mode; state.viewMode=snap.view; state.clock=cl0; state.tick=tk0; if(mg0) state.mag=mg0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.aimRef=null; if(state.lobby) state.lobby.phase=ph0; state.qaArmed=q0; state._qaSilent=_s0; rangeReset(); }
    rows.push({id:'THE_FOIL_DROPS',ok,note});
  }catch(e){ state._qaSilent=_s0; if(!rows.some(x=>x.id==='THE_FOIL_DROPS')) rows.push({id:'THE_FOIL_DROPS',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1820); /* after the r.225 row (1805) */
"""
rep(ROWANCHOR, ROW + ROWANCHOR)

# === the invariants ==========================================================================================
if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')
for must in ["rows.push({id:'THE_FOIL_DROPS',ok,note})", "R.falling=true;", "d.y=1+(capIntroAltM()-1)*(1-d.fall);", "A.pitch-=Math.min(1,d.fall)*Math.PI/2;", "if(!d.up||d.lifePct<=0) return; add(d,'uav',d,340);", 'function capStripText(', 'function rangeDroneTick(', 'function foilDraw(']:
    if s.count(must) != 1: raise SystemExit('REFUSE: expected exactly one %r' % must)
if s.count("'THE_FOIL_DROPS'") != 4: raise SystemExit('REFUSE: the row id must appear exactly four times')
if "if(+state.challenge===0) rangeTick(" not in s: raise SystemExit('REFUSE: the frozen range tick call moved')
if "QUAL 40 IS TRAINING · ON THE RANGE" not in s: raise SystemExit('REFUSE: the lawn QUAL 40 refusal was removed')
if s.count("decide('CTIME'") != 1: raise SystemExit('REFUSE: a new row was added')
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit('REFUSE: script #%d does not parse: %s' % (i, r.stderr[:300]))

OUT = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(OUT, 'w', encoding='utf-8').write(s)
print('OK r.%s -> r.%s · %d bytes · sha256 %s' % (BASE_REV, NEW_REV, len(s.encode('utf-8')), hashlib.sha256(s.encode('utf-8')).hexdigest()[:16]))

# r.223 -> r.224 — THE RANGE'S ONE DRONE, OFF BY DEFAULT (operator 2026-10-21, the night brief)
#  "r.224 · Range. One control, DRONE, off by default. Off means Lane 21 is the lane. No drone is drawn. The red T1 box does
#  not sit on the lane. The three drills, the magazine, RELOAD, and the three presses stay. range-frozen may change only for
#  this control. Do not repaint the magazine. On has three levels only: SLOW, MEDIUM, FAST. One drone, not a swarm. SLOW
#  stays up longest and crosses slowest. FAST stays up shortest and crosses fastest. A hit takes it down and spends one
#  round. A miss leaves it up until the level's time ends. The button is not on the score strip. Pass: DRONE off shows no
#  drone. DRONE on, FAST, one hit takes that drone down."
#  One <select id="drnLvl"> behind MORE (off · slow · medium · fast), the Range's only; state.rangeDrone undefined by
#  default, so the Range is byte-identical until the player turns it on. One drone - the pool's LAST member (never the
#  lawn's drones[0]) - stood by rangeDroneTick() from the FREE spawn(), crossing the lane at 120 m, 10 m up, carried by the
#  deck's own drone mover; the FREE lockOn's range branch takes it, the FREE fireN routes a uav to its own branch on CH0 only
#  while the control is on, the FREE applyHit tallies it on the strip. No frozen definition moves.
import hashlib, os, re, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
if not os.path.exists(os.path.join(DECK, 'HASHES_r223.sha256')):
    DECK = os.path.join(ROOT, 'docs', 'drone-2525', 'operator-deck')
BASE_REV = '223'; NEW_REV = '224'
BASE_SHA = open(os.path.join(DECK, 'HASHES_r' + BASE_REV + '.sha256'), encoding='utf-8').read().split()[0]
SRC = os.path.join(DECK, 'drone-2525_r.' + BASE_REV + '.html')
s = open(SRC, encoding='utf-8').read()
if hashlib.sha256(s.encode('utf-8')).hexdigest() != BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.' + BASE_REV)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: raise SystemExit('REFUSE: expected %d of %r, found %d' % (count, old[:90], n))
    s = s.replace(old, new, count); return s

LANEPICK = '    <select id="lanePick" title="lane"></select>\n'
LOCKRANGE = "add(p,'pop',worldOf(p),340,{lane:p.lane}); }); return pipNearest(cand,c,W,H); }"
FIRECH0 = "if(s.kind==='ring'||((+state.challenge===0)&&s.kind!=='pop')){"
TALLY = "  if(isPlate){ if(hit) state.rangeHit=(state.rangeHit|0)+1; else state.rangeMiss=(state.rangeMiss|0)+1; }"
SPAWN = "  if(+state.challenge===0) rangeTick(state.rangeDtNow!=null?state.rangeDtNow:dt);"
TAIL = "/* stroke only — this function never fills */\n}\n\n</script>"
ROWANCHOR = "  /* r.223 · the thing you shoot on the lawn is the foil (operator 2026-10-21)."
MOVER = "  drones.forEach(d=>{\n    if(!d.up)return;\n    if(state.phase==='moving'){\n      const w=1.2+CH.c*0.25;"
for need in [LANEPICK, LOCKRANGE, FIRECH0, TALLY, SPAWN, TAIL, ROWANCHOR, MOVER, "function aimUnitAt(u,ref,lo,hi){", "function dropMark(id,why){", "  const rangeSnap=()=>({"]:
    if s.count(need) != 1: raise SystemExit('REFUSE: the r.223 base does not carry exactly one of: ' + need[:70])
for dead in ['drnLvl', 'rangeDroneOn', 'RANGE_DRONE_CONTROL', 'state.rangeDrone']:
    if dead in s: raise SystemExit('REFUSE: r.224 is already in the base: ' + dead)

# === the head ================================================================================================
rep("<span>r0.223</span>", "<span>r0.224</span>")
rep("revision:'0.223'", "revision:'0.224'")

# === the embedded R-CORE record moves on one row (lag exactly one, deck-rcore): through 102 -> 103 ============
LEDGER = json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku|Fable|Mythos)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
THROUGH = 103
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
if os.environ.get('DECK_DEV') != '1' and not re.match(r'^[0-9a-f]{7,40}$', str(LEDGER['entries'][102].get('shipped', ''))): raise SystemExit('REFUSE: rev 103 (r.223) has no ship commit yet: ' + str(LEDGER['entries'][102].get('shipped')))
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
if json.loads(_old.group(1)).get('through') != 102: raise SystemExit('REFUSE: expected the r.223 base to embed through 102')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]

# === M1 · the control, behind MORE, the Range's only (markup + two CSS rules; lines above the first declaration are free) =====
rep(LANEPICK, LANEPICK + '    <select id="drnLvl" title="the Range\'s one drone · off, or one drone crossing the lane: slow, medium, fast"><option value="off" selected>DRONE OFF</option><option value="slow">DRONE SLOW</option><option value="medium">DRONE MEDIUM</option><option value="fast">DRONE FAST</option></select> <!-- r.224: one control, off by default; behind MORE, never on the score strip -->\n')
_hide = re.search(r'^(#app\.range:not\(\.more\) #modePick,[^\n]*?)\{display:none\}', s, re.M)
if not _hide: raise SystemExit('REFUSE: the MORE hide rule was not found')
s = s[:_hide.start()] + _hide.group(1) + ',#app.range:not(.more) #drnLvl{display:none}' + s[_hide.end():]
_hl = s.index('#app.range:not(.more) #modePick,'); _eol = s.index('\n', _hl)
s = s[:_eol] + '\n#app:not(.range) #drnLvl{display:none} /* r.224: the DRONE control is the Range\'s (operator: "One control, DRONE, off by default … The button is not on the score strip") */' + s[_eol:]

# === M2 · the FREE lockOn's range branch takes the drone when the control is on ================================
rep(LOCKRANGE, "add(p,'pop',worldOf(p),340,{lane:p.lane}); }); if(rangeDroneOn()){ const dd=rangeDroneObj(); if(dd&&dd.up&&dd.lifePct>0&&(dd.fall||0)<0.25) add(dd,'uav',dd,340); } /* r.224: the Range's one drone is a lock while the control is on */ return pipNearest(cand,c,W,H); }")

# === M3 · the FREE fireN sends the Range's drone down its own branch (the CH0 non-pop route stays for everything else) ====
rep(FIRECH0, "if(s.kind==='ring'||((+state.challenge===0)&&s.kind!=='pop'&&!(s.kind==='uav'&&rangeDroneOn()))){ /* r.224: the Range's one drone fires as a uav */")

# === M4 · the FREE applyHit tallies the drone on the strip like a plate ========================================
rep(TALLY, "  if(isPlate||rangeDroneIs(ref)){ if(hit) state.rangeHit=(state.rangeHit|0)+1; else state.rangeMiss=(state.rangeMiss|0)+1; } /* r.224: the Range's drone counts on the strip */")

# === M5 · the FREE spawn ticks the drone after the frozen range tick (the pinned line stays byte-identical); its own
#        drone mover (the capital swirl, which the Range's phase 'moving' would apply) leaves the Range's drone alone ====
rep(SPAWN, SPAWN + "\n  if(+state.challenge===0) rangeDroneTick(state.rangeDtNow!=null?state.rangeDtNow:dt); /* r.224: the Range's one drone, off by default */")
rep(MOVER, "  drones.forEach(d=>{\n    if(!d.up)return;\n    if(rangeDroneIs(d)) return; /* r.224: the Range's drone crosses the lane on its own tick, never the swirl */\n    if(state.phase==='moving'){\n      const w=1.2+CH.c*0.25;")

# === M6 · the drone itself: levels, stand, down, tick, the control's wire (append zone; hoisted functions) =====
FOIL_TAIL = r"""/* stroke only — this function never fills */
}

/* ===================================================================================================================
   r.224 — THE RANGE'S ONE DRONE, OFF BY DEFAULT (operator 2026-10-21: "One control, DRONE, off by default. Off means
   Lane 21 is the lane. No drone is drawn … On has three levels only: SLOW, MEDIUM, FAST. One drone, not a swarm. SLOW
   stays up longest and crosses slowest. FAST stays up shortest and crosses fastest. A hit takes it down and spends one
   round. A miss leaves it up until the level's time ends. The button is not on the score strip."). INVARIANT: with the
   control off the Range is the Range — no drone stands, none is drawn, none is a lock, nothing on the strip changes; on,
   exactly ONE drone (the pool's last member, never the lawn's drones[0]) crosses the lane at 120 m and 10 m up, stands
   for the level's seconds, falls to a hit (one round, the three presses) and goes down at the level's end if missed, and
   stands again after a gap. The deck's own drone mover carries it; the FREE spawn ticks it; no frozen definition moves.
   =================================================================================================================== */
function rangeDroneLevels(){ return {slow:{up:14,v:2.5},medium:{up:9,v:5},fast:{up:5,v:9}}; }   /* seconds up · metres per second across the lane */
function rangeDroneOn(){ return chNum()===0 && !!rangeDroneLevels()[state.rangeDrone]; }
function rangeDroneObj(){ return (typeof drones!=='undefined'&&drones.length)?drones[drones.length-1]:null; }
function rangeDroneIs(o){ return !!o && rangeDroneOn() && o===rangeDroneObj(); }
function rangeDroneStand(){ const d=rangeDroneObj(), L=rangeDroneLevels()[state.rangeDrone]; if(!d||!L) return; const lane=LANES[state.lane|0]||LANES[20];
  d.x=lane.x-L.v*L.up/2; d.y=10; d.z=120; d.vx=L.v; d.vz=0; d.vy=0; d.up=true; d.life=1e9; d.lifePct=100; d.fall=0; d.mist=false; d._a=0;   /* enters from the left so it crosses the lane's centre at half its time */
  state.rangeDroneRun={upT:state.clock,level:state.rangeDrone}; }
function rangeDroneDown(why){ const d=rangeDroneObj(); if(!d) return; const was=d.up; d.up=false; d.vx=0; d.vz=0; d.lifePct=100; d.fall=0; d.mist=false; state.rangeDroneDownT=state.clock; state.rangeDroneRun=null; if(was&&typeof dropMark==='function') dropMark(d.id,why); }
function rangeDroneLower(d){ if(!d) return; if(d.up||d.lifePct<=0||(d.fall||0)>0){ d.up=false; d.vx=0; d.vz=0; d.lifePct=100; d.fall=0; d.mist=false; } }
function rangeDroneTick(dt){ const d=rangeDroneObj(); if(!d) return;
  /* off: the Range is the Range — no drone stands here, the control's own and none other (a lawn boot row leaves the lawn's
     track standing 374 m down the lane; on the Range it is lowered like any other) */
  if(!rangeDroneOn()){ if(d.up||d.lifePct<=0) rangeDroneDown('OFF'); drones.forEach(x=>{ if(x!==d) rangeDroneLower(x); }); return; }
  drones.forEach(x=>{ if(x!==d) rangeDroneLower(x); });   /* one drone, not a swarm */
  const L=rangeDroneLevels()[state.rangeDrone], R=state.rangeDroneRun;
  if(!d.up){ if(R){ rangeDroneDown('DOWN'); return; }   /* the HIT row lowers a drone synchronously (applyWorld, r.131): the hit took it down — start the gap, never re-stand it in the same breath */
    if(state.rangeDroneDownT==null||(state.clock-state.rangeDroneDownT)>=2) rangeDroneStand(); return; }   /* two seconds down, then it stands again */
  if(d.lifePct<=0){ d.vx=0; d.vz=0; d.fall=Math.min(1,(d.fall||0)+dt*2.4); if(d.fall>=1) rangeDroneDown('DOWN'); return; }   /* a hit takes it down */
  d.x+=d.vx*dt;   /* its own crossing: SLOW slowest, FAST fastest */
  if(R&&(state.clock-R.upT)>=L.up) rangeDroneDown('TIME');   /* a miss leaves it up until the level's time ends */
}
(function(){ try{ const sel=document.getElementById('drnLvl'); if(!sel) return;
  sel.onchange=function(){ const v=rangeDroneLevels()[this.value]?this.value:'off'; state.rangeDrone=v; this.value=v; state.rangeDroneDownT=null;
    if(v==='off') rangeDroneDown('OFF'); decide('DRONE','RANGE',{level:v,lane:(state.lane|0)+1});
    toast(v==='off'?'DRONE OFF · '+laneWord(state.lane|0)+' IS THE LANE':'DRONE '+v.toUpperCase()+' · ONE DRONE CROSSES THE LANE · TARGET · APPROVE · FIRE'); if(typeof paintCues==='function') paintCues(); };
}catch(e){ try{ log('RANGE','DRONE',String(e).slice(0,80)); }catch(_){ } } })();

</script>"""
rep(TAIL, FOIL_TAIL)

# === M7 · the boot-QA row ======================================================================================
ROW = r"""  /* r.224 · the Range's one drone, off by default (operator 2026-10-21: "Pass: DRONE off shows no drone. DRONE on, FAST,
     one hit takes that drone down."). Red on the r.223 bytes: there is no control and no drone on the Range. Green on the
     cut: off — the control reads off, no drone stands, the lock is not a uav; the three levels ordered; FAST — one drone
     stands, the lock takes it, TARGET → APPROVE → FIRE spends one round and strikes it, it falls and goes down, the strip
     counts the hit; off again — none. Same snapshot and restore as the lawn rows. */
  setTimeout(()=>{ const _s0=state._qaSilent; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='RANGE_DRONE_CONTROL')) return;
    const snap=rangeSnap(); const q0=state.qaArmed; const sel=document.getElementById('drnLvl'); const d=rangeDroneObj(); const u=units[state.unit];
    const u0=u?{pan:u.pan,tilt:u.tilt}:null; const d0=d?Object.assign({},d):null; const rd0=state.rangeDrone, run0=state.rangeDroneRun, dn0=state.rangeDroneDownT;
    const mg0=state.mag?Object.assign({},state.mag):null; const rh0=state.rangeHit|0, rm0=state.rangeMiss|0, bl0=state.blu|0, sc0=state.score|0, cl0=state.clock, ar0=state.aimRef;
    let ok=false, note='';
    try{ state.qaArmed=true; state._qaSilent=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false;
      const L=rangeDroneLevels(); const opts=sel?[...sel.options].map(o=>o.value).join(','):'none';
      const leak=drones.filter(x=>x.up).map(x=>x.id).join('+')||'none'; rangeDroneTick(0);   /* the control's own tick lowers whatever a boot row left standing on the Range */
      const lk0=lockOn(); const offOk=!!sel&&opts==='off,slow,medium,fast'&&sel.value==='off'&&!rangeDroneOn()&&drones.every(x=>!x.up)&&!(lk0&&lk0.kind==='uav');
      const order=L.slow.up>L.medium.up&&L.medium.up>L.fast.up&&L.slow.v<L.medium.v&&L.medium.v<L.fast.v;
      sel.value='fast'; sel.dispatchEvent(new Event('change',{bubbles:true})); rangeDroneTick(0.1); const stood=!!d&&d.up&&rangeDroneOn()&&state.rangeDrone==='fast'&&drones.filter(x=>x.up).length===1;
      aimUnitAt(u,d,-40,40); state.aimRef=null; const lk=lockOn(); const locked=!!lk&&lk.kind==='uav'&&lk.id===d.id;   /* the TARGET button's own path: no mouse aimRef, the pool under the pip */
      markLock(lk,'QA'); approveDesig('HI-2'); const red=!!state.desig&&state.desig.phase==='red'&&state.desig.id===d.id;
      const r0=state.mag?state.mag.rounds|0:0; fireN(1); const struck=d.lifePct<=0; const spent=state.mag?(r0-(state.mag.rounds|0))===1:false;
      let n=0; while(d.up&&n<40){ rangeDroneTick(0.1); state.clock+=0.1; n++; } const down=!d.up;
      sel.value='off'; sel.dispatchEvent(new Event('change',{bubbles:true})); rangeDroneTick(0.1); const offAgain=!rangeDroneOn()&&!d.up;
      const tallied=((state.rangeHit|0)-rh0)===1;
      ok = offOk&&order&&stood&&locked&&red&&struck&&spent&&down&&offAgain&&tallied;
      note = 'off: '+opts+', value off, no drone (a boot row had left '+leak+' standing; lowered), lock not a uav: '+offOk+' · levels slow '+L.slow.up+' s / '+L.slow.v+' m/s · medium '+L.medium.up+' s / '+L.medium.v+' · fast '+L.fast.up+' s / '+L.fast.v+' ordered: '+order+' · FAST: one stood '+stood+' · lock uav '+locked+' · red '+red+' · hit '+struck+' · one round '+spent+' · down in '+n+' ticks '+down+' · strip +1 '+tallied+' · off again '+offAgain;
    }catch(e){ note='threw '+String(e).slice(0,100); }
    finally { try{ if(sel) sel.value='off'; state.rangeDrone=rd0; state.rangeDroneRun=run0; state.rangeDroneDownT=dn0; if(d&&d0) Object.assign(d,d0); if(u&&u0){ u.pan=u0.pan; u.tilt=u0.tilt; } state.aimRef=ar0; }catch(_){ }
      state.rangeHit=rh0; state.rangeMiss=rm0; state.blu=bl0; state.score=sc0; state.clock=cl0; if(mg0) state.mag=mg0; state.desig=null; state.tgtSlot={}; state.hiApproved=false;
      state.challenge=snap.challenge; state.rangeMode=snap.rangeMode; state.lane=snap.lane; state.zoom=snap.zoom; state.phase=snap.phase; state.hits=snap.hits; state.passed=snap.passed; state.unit=snap.unit; state.mode=snap.mode; state.viewMode=snap.view; state.qaArmed=q0; state._qaSilent=_s0; rangeReset(); }
    rows.push({id:'RANGE_DRONE_CONTROL',ok,note});
  }catch(e){ state._qaSilent=_s0; if(!rows.some(x=>x.id==='RANGE_DRONE_CONTROL')) rows.push({id:'RANGE_DRONE_CONTROL',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1790); /* after the r.223 row (1775) */
"""
rep(ROWANCHOR, ROW + ROWANCHOR)

# === the invariants ==========================================================================================
if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')
for must in ['function rangeDroneLevels(', 'function rangeDroneOn(', 'function rangeDroneObj(', 'function rangeDroneIs(', 'function rangeDroneStand(', 'function rangeDroneDown(', 'function rangeDroneLower(', 'function rangeDroneTick(', 'if(rangeDroneIs(d)) return;', 'id="drnLvl"', "rows.push({id:'RANGE_DRONE_CONTROL',ok,note})", "rangeDroneTick(state.rangeDtNow!=null?state.rangeDtNow:dt)", 'function foilDraw(', 'function capPaintScore(']:
    if s.count(must) != 1: raise SystemExit('REFUSE: expected exactly one %r' % must)
if s.count("'RANGE_DRONE_CONTROL'") != 4: raise SystemExit('REFUSE: the row id must appear exactly four times')
if s.count(SPAWN) != 1: raise SystemExit('REFUSE: the frozen range tick call moved')
if "QUAL 40 IS TRAINING · ON THE RANGE" not in s: raise SystemExit('REFUSE: the lawn QUAL 40 refusal was removed')
if "('BLU '+(state.blu|0)+' · RED '+(state.red|0))" not in s: raise SystemExit('REFUSE: the Range/else hudScore line was changed')
if not re.search(r'^#app\.range:not\(\.more\) #modePick,', s, re.M): raise SystemExit('REFUSE: the MORE hide rule no longer leads with #modePick')
if s.count('#app.range:not(.more) #drnLvl{display:none}') != 1 or s.count('#app:not(.range) #drnLvl{display:none}') != 1: raise SystemExit('REFUSE: the two DRONE rules are not each exactly once')
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit('REFUSE: script #%d does not parse: %s' % (i, r.stderr[:300]))

OUT = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(OUT, 'w', encoding='utf-8').write(s)
print('OK r.%s -> r.%s · %d bytes · sha256 %s' % (BASE_REV, NEW_REV, len(s.encode('utf-8')), hashlib.sha256(s.encode('utf-8')).hexdigest()[:16]))

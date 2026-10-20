# r.219 -> r.220 — SENTINEL NAMES IT BEFORE FIRE COUNTS (CRS-CL.H01.S; cue only, per DD-141 "nothing else in that revision")
#  (2026-10-20; DD-137/138/139 lawn CRS line 26 "Sentinel names it before Fire counts"; CL.04.01 "No shot before the cue";
#   H01.S "Enki's Spark only. One air track."; DD-140 "execute the Fable generated plan"; DD-141 narrows r.220 to the cue —
#   the swarm predicate is a later revision.)
#
#  INVARIANT (r.220): on the lawn no round leaves before the cue names the track — a FIRE pressed before the name is refused
#  in one line (CUE · NOT NAMED · WAIT FOR SENTINEL) and recorded (HOLD · BEFORE_CUE), spends no round, keeps the red mark;
#  TARGET and APPROVE are not gated; the cue is a row on the record (CUE, actor S1) written once per standing, CUE_S after the
#  track stands. A1, S1 and S2 only; H02/H03/H04 use this same scene. Every edit in a free span; every new definition a
#  hoisted function in the append zone. NOT HERE: the swarm predicate (its own later revision), CL.05, the ladder lock.
import hashlib, os, re, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
BASE_REV = '219'; NEW_REV = '220'
BASE_SHA = open(os.path.join(DECK, 'HASHES_r' + BASE_REV + '.sha256'), encoding='utf-8').read().split()[0]
SRC = os.path.join(DECK, 'drone-2525_r.' + BASE_REV + '.html')
s = open(SRC, encoding='utf-8').read()
if hashlib.sha256(s.encode('utf-8')).hexdigest() != BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.' + BASE_REV)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: raise SystemExit('REFUSE: expected %d of %r, found %d' % (count, old[:90], n))
    s = s.replace(old, new, count); return s

for need in ["  if(!magHasRound()){ decide('REJECT',s.id,{reason:'EMPTY_MAGAZINE'});", "function capIntroTick(dt){",
             "state.capRun={go:stay?'armed':'run',t0:state.clock,e0:(state.events||[]).length,hitT:null,ms:null,why:why};"]:
    if need not in s: raise SystemExit('REFUSE: the r.219 base does not carry: ' + need[:60])
for dead in ['capCue', 'BEFORE_CUE', "'CUE'", 'NO_SHOT_BEFORE_THE_CUE']:
    if dead in s: raise SystemExit('REFUSE: r.220 is already in the base: ' + dead)

# === the head ================================================================================================
rep("<span>r0.219</span>", "<span>r0.220</span>")
rep("revision:'0.219'", "revision:'0.220'")

# === the embedded R-CORE record moves on one row (lag exactly one, deck-rcore) ===============================
LEDGER = json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku|Fable|Mythos)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
THROUGH = 99
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
if not re.match(r'^[0-9a-f]{7,40}$', str(LEDGER['entries'][98].get('shipped', ''))): raise SystemExit('REFUSE: rev 99 (r.219) has no ship commit yet: ' + str(LEDGER['entries'][98].get('shipped')))
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
if json.loads(_old.group(1)).get('through') != 98: raise SystemExit('REFUSE: expected the r.219 base to embed through 98')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]

# === M1 · the cue gate on FIRE: after every refusal the Range already has, before a round could be spent ========
rep("  if(!magHasRound()){ decide('REJECT',s.id,{reason:'EMPTY_MAGAZINE'});",
    "  if(typeof capCueHold==='function'&&capCueHold(s)) return; /* r.220: on the lawn no round leaves before the Sentinel names the track (CRS-CL.H01.S; delta line 26) — HOLD BEFORE_CUE, no round */\n  if(!magHasRound()){ decide('REJECT',s.id,{reason:'EMPTY_MAGAZINE'});")

# === M1 · the cue itself: once per standing, CUE_S after the track stands ======================================
rep("state.capRun={go:stay?'armed':'run',t0:state.clock,e0:(state.events||[]).length,hitT:null,ms:null,why:why};",
    "state.capRun={go:stay?'armed':'run',t0:state.clock,e0:(state.events||[]).length,hitT:null,ms:null,why:why,cued:false,upT:state.clock}; /* r.220: a standing is named CUE_S after it stands */")
rep("capIntroReset('START'); const d=capIntroTrack(); d.up=true; state.capRun.go='run'; state.capRun.t0=state.clock; state.capRun.e0=(state.events||[]).length;",
    "capIntroReset('START'); const d=capIntroTrack(); d.up=true; state.capRun.go='run'; state.capRun.t0=state.clock; state.capRun.e0=(state.events||[]).length; state.capRun.cued=false; state.capRun.upT=state.clock;")
rep("if(!d.up&&capIntroDrill()==='bounce'&&R.hitT!=null&&(state.clock-R.hitT)>=RETURN_S){ d.lifePct=100; d.fall=0; d.mist=false; d.up=true; R.hitT=null; }",
    "if(!d.up&&capIntroDrill()==='bounce'&&R.hitT!=null&&(state.clock-R.hitT)>=RETURN_S){ d.lifePct=100; d.fall=0; d.mist=false; d.up=true; R.hitT=null; R.cued=false; R.upT=state.clock; } /* r.220: a returned track is named again */")
rep("function capIntroTick(dt){ const d=capIntroTrack(), R=state.capRun; if(!d||!R) return; state.phase='static';\n  if(R.go==='armed'){ d.up=false; return; }",
    "function capIntroTick(dt){ const d=capIntroTrack(), R=state.capRun; if(!d||!R) return; state.phase='static';\n  if(R.go==='armed'){ d.up=false; return; }\n  if(d.up&&d.lifePct>0&&!R.cued&&(state.clock-(R.upT==null?R.t0:R.upT))>=capCueS()) capCue(R,d); /* r.220: the Sentinel sweep names the standing track */")

# === the r.219 rows learn to wait for the name before they fire (their ids and their claims unchanged) ===========
rep("const e0=ev().length; const mg=state.mag?(state.mag.rounds|0):-1; fireN(state.desig&&state.desig.slot||1);",
    "for(let i=0;i<50;i++){ state.clock+=0.05; capIntroTick(0.05); } /* r.220: the Sentinel names it first */ const e0=ev().length; const mg=state.mag?(state.mag.rounds|0):-1; fireN(state.desig&&state.desig.slot||1);")
rep("aim(); markLock(lockOn(),'BTN'); approveDesig('HI-2'); fireN(state.desig&&state.desig.slot||1); for(let i=0;i<30;i++){ state.clock+=0.05; capIntroTick(0.05); }",
    "aim(); markLock(lockOn(),'BTN'); approveDesig('HI-2'); for(let i=0;i<50;i++){ state.clock+=0.05; capIntroTick(0.05); } /* r.220: the name first */ fireN(state.desig&&state.desig.slot||1); for(let i=0;i<30;i++){ state.clock+=0.05; capIntroTick(0.05); }")

# === the two boot rows, deferred before the r.219 lawn block (1750) and the ASM loop row (1900) ==================
ANCHOR = "  /* r.219 · the five lawn rows. ONE door (pickScenario('capital') -> capIntroEnter), every unit snapshotted and\n"
ROWS = r"""  /* r.220 · the Sentinel cue (CRS-CL.H01.S; delta line 26). Two rows, each red on the r.219 bytes by the deck's own
     behaviour (a round leaves before any name; no CUE row exists). Same door, same snapshot, same restore as the r.219
     block. The swarm predicate is a later revision (DD-141: nothing else in r.220). */
  setTimeout(()=>{ const _s0=state._qaSilent; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='NO_SHOT_BEFORE_THE_CUE')) return;
    const ev=()=>state.events||[], dec=()=>state.decisions||[];
    const snap=rangeSnap(); const ph0=state.lobby?state.lobby.phase:null; const q0=state.qaArmed;
    const sv=Object.keys(units).filter(id=>units[id]&&units[id].kind==='turret').map(id=>[id,units[id].x,units[id].y,units[id].z,units[id].yaw,units[id].pan,units[id].tilt,units[id].label]);
    const pops0=pops.map(p=>p.up); const dr0=drones.map(d=>({up:d.up,x:d.x,y:d.y,z:d.z,life:d.life,lifePct:d.lifePct,fall:d.fall,vx:d.vx,vz:d.vz,mist:d.mist}));
    const cl0=state.clock, tk0=state.tick, mg0=state.mag?Object.assign({},state.mag):null;
    const rec={shot:[false,''],cue:[false,'']};
    try{ state.qaArmed=true; state._qaSilent=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false;
      pickScenario('capital');
      const d=capIntroTrack(), u=units[state.unit];
      const aim=()=>{ aimUnitAt(u,d,-40,40); state.aimRef=d; paintCues(); };
      const R0=state.capRun; const cued0=!!(R0&&R0.cued);
      aim(); markLock(lockOn(),'BTN'); approveDesig('HI-2'); const red=!!state.desig&&state.desig.id===d.id&&state.desig.phase==='red';
      const e0=ev().length, k0=dec().length; const mg=state.mag?(state.mag.rounds|0):-1;
      fireN(state.desig&&state.desig.slot||1);
      const hold=dec().slice(k0).find(r=>r.kind==='HOLD'&&r.reason==='BEFORE_CUE'); const hit0=ev().slice(e0).some(e=>e.verb==='HIT'&&e.id===d.id); const spent0=!!state.mag&&(state.mag.rounds|0)!==mg; const stillRed=!!state.desig&&state.desig.id===d.id&&state.desig.phase==='red';
      let cueAt=-1; for(let i=0;i<60;i++){ state.clock+=0.05; capIntroTick(0.05); if(cueAt<0&&state.capRun&&state.capRun.cued) cueAt=i; }
      const CUE=dec().slice(k0).filter(r=>r.kind==='CUE'&&r.id===d.id);
      const e1=ev().length; fireN(state.desig&&state.desig.slot||1); const hit1=ev().slice(e1).some(e=>e.verb==='HIT'&&e.id===d.id); const spent1=!!state.mag&&(state.mag.rounds|0)===mg-1;
      rec.shot=[!cued0&&red&&!!hold&&!hit0&&!spent0&&stillRed&&cueAt>=0&&hit1&&spent1, 'red '+red+' · FIRE before the name → HOLD BEFORE_CUE '+!!hold+', HIT row '+hit0+', round spent '+spent0+', the mark kept '+stillRed+' · named at tick '+cueAt+' ('+(cueAt*0.05).toFixed(2)+' s) · FIRE after the name → HIT row '+hit1+', one round spent '+spent1];
      for(let i=0;i<130;i++){ state.clock+=0.05; capIntroTick(0.05); } /* the fall, the return after RETURN_S, the second name after CUE_S */
      const CUE2=dec().slice(k0).filter(r=>r.kind==='CUE'&&r.id===d.id); const c1=CUE[0]||{};
      rec.cue=[CUE.length===1&&c1.actor==='S1'&&c1.by==='S1'&&c1.bearing===1800&&typeof c1.t==='number'&&CUE2.length===2&&!!d.up&&d.lifePct>0, 'CUE rows after the first standing '+CUE.length+' (actor '+(c1.actor||'—')+' · by '+(c1.by||'—')+' · bearing '+(c1.bearing||'—')+' · t '+c1.t+') · after the hit, the fall and the return '+CUE2.length+' · the track standing again '+(!!d.up&&d.lifePct>0)];
    }catch(e){ const m='threw '+String(e).slice(0,100); Object.keys(rec).forEach(k=>{ if(!rec[k][1]) rec[k]=[false,m]; }); }
    finally { try{ pickScenario('range'); }catch(_){ } state.capStep=null; state.capRun=null; state.capDrill=null; sv.forEach(a=>{ const t=units[a[0]]; if(t){ t.x=a[1];t.y=a[2];t.z=a[3];t.yaw=a[4];t.pan=a[5];t.tilt=a[6];t.label=a[7]; } }); pops.forEach((p,i)=>{ p.up=pops0[i]; }); drones.forEach((dd,i)=>Object.assign(dd,dr0[i])); state.challenge=snap.challenge; state.rangeMode=snap.rangeMode; state.lane=snap.lane; state.zoom=snap.zoom; state.phase=snap.phase; state.hits=snap.hits; state.passed=snap.passed; state.unit=snap.unit; state.mode=snap.mode; state.viewMode=snap.view; state.clock=cl0; state.tick=tk0; if(mg0) state.mag=mg0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; if(state.lobby) state.lobby.phase=ph0; state.qaArmed=q0; state._qaSilent=_s0; rangeReset(); }
    rows.push({id:'NO_SHOT_BEFORE_THE_CUE',ok:rec.shot[0],note:rec.shot[1]}); rows.push({id:'THE_CUE_IS_ON_THE_RECORD',ok:rec.cue[0],note:rec.cue[1]});
  }catch(e){ state._qaSilent=_s0; ['NO_SHOT_BEFORE_THE_CUE','THE_CUE_IS_ON_THE_RECORD'].forEach(id=>{ if(!rows.some(x=>x.id===id)) rows.push({id,ok:false,note:'threw '+String(e).slice(0,100)}); }); } }, 1745); /* before the r.219 lawn block (1750) and the ASM loop row (1900) */
"""
rep(ANCHOR, ROWS + ANCHOR)

# === the append zone: hoisted functions after the r.219 lawn block ===============================================
TAIL_ANCHOR = "}catch(e){ try{ log('LAWN','WIRE',String(e).slice(0,80)); }catch(_){ } } })();\n\n</script>"
CUE = r"""}catch(e){ try{ log('LAWN','WIRE',String(e).slice(0,80)); }catch(_){ } } })();

/* ===================================================================================================================
   r.220 — SENTINEL NAMES IT BEFORE FIRE COUNTS (CRS-CL.H01.S; delta line 26). INVARIANT: on the lawn no round leaves
   before the cue names the track — a FIRE pressed before the name is refused in one line and recorded (HOLD · BEFORE_CUE)
   and spends no round; TARGET and APPROVE are not gated; the cue is a row (CUE, actor S1) written once per standing,
   CUE_S after the track stands. S1 and S2 are cue-only seats (CRS-CL.12: 0000.3600, no shot); the row names S1. The cue
   is Introductory's and is CL.08's stand-in in embryo: a row the next gun can read. A1, S1 and S2 only; H02/H03/H04 use
   this same scene. Per DD-141 the swarm predicate is a later revision — nothing else is in r.220.
   =================================================================================================================== */
function capCueS(){ return 2; }                     /* the Sentinel names a standing track this long after it stands (Decision 22) */
function capCue(R,d){ R.cued=true; R.cueT=state.clock; decide('CUE',d.id,{actor:'S1',by:'S1',seat:'S1',bearing:1800,tracks:1}); toast('SENTINEL · 1800 · ONE TRACK'); }
function capCueHold(sh){ if(!capIntro()) return false; const d=capIntroTrack(), R=state.capRun; if(!d||!sh||sh.id!==d.id||!R) return false; if(R.cued) return false;
  decide('HOLD',sh.id,{reason:'BEFORE_CUE'}); toast('CUE · NOT NAMED · WAIT FOR SENTINEL'); return true; }

</script>"""
rep(TAIL_ANCHOR, CUE)

if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')
if 'swarmAllowed' in s: raise SystemExit('REFUSE: r.220 is cue-only — no swarm predicate (DD-141)')
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit('REFUSE: script #%d does not parse: %s' % (i, r.stderr[:300]))

out = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(out, 'w', encoding='utf-8').write(s)
print('r.' + NEW_REV, len(s.encode('utf-8')), 'B', hashlib.sha256(s.encode('utf-8')).hexdigest())

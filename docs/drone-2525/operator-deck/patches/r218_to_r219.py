# r.218 -> r.219 — A MAN ALONE PLAYS TRAIN UP AND TRAIN DOWN ON THE LAWN (CRS-CL.INTRO.01, less the cue — r.220)
#  (2026-10-19; his Key Deliverable: "Introductory mode is the foundation. Nothing in Intermediate, Advanced, or
#   Real-World advances until Introductory works" — step 1, one player; the CRS delta of the same day is the source.)
#
#  INVARIANT (r.219): one player, ONE air track, the same three presses and the same glass as the Range, START · time ·
#  hits · misses · who pressed on the record — and the Range untouched. The frozen Range engine is never edited, only
#  called; every new definition is a hoisted function in the append zone at the end of script #1.
#
#  WHAT THE LAWN LACKED, measured on the shipped r.218 bytes (every number re-verified at this tree):
#   - the TARGET button could not reach anything: lockOn's fallback pool capped pop-ups at 80 m and drones at 120 m while
#     every lawn object stands 150-262 m from a station - and a TAP marked anyway (pickNear -> candidates has no cap), so
#     the deck contradicted itself. Both caps become the Range's own 340; asmTick's twin (bd < 80) the same.
#   - marksPersist() was chNum()===0: off the Range the lit button, the recital and the amber silhouette were all off, and
#     "target all, approve all, fire all" was impossible. On Introductory it is now true (narrowly - the Capital's other
#     challenges are untouched).
#   - the magazine and the light were CSS-hidden off the Range (#app.range ...). A sibling class `cap`, two rules, and the
#     lawn's own lamp/clock painter after the frozen paintLight/paintTimer.
#   - "lawn pops" spawned INSIDE the Capitol footprint, eight of them, expiring in 4-6 s; the delta's Introductory is
#     "one air track, single shot". One drones[] member stands bearing-fixed at 1800 x 150 m, hovering, life 1e9.
#   - the twelve AI seats marked and fired anything standing; on Introductory asmTick returns at its first line.
#   - the seat: CL.12 faces A1 at 1800, down Congress; the record's sourced t-south stands at [0,-210] (deck z = +210)
#     with homeAz 0. The unit is placed ON that station and homed to 1800 - a facing correction recorded in
#     lawnSeatsRecord.corrections LC-01; the position is the record's, no station moves. The Capitol is behind him.
#   - START/TIME: the lawn's own verbs CSTART / CTIME / CRESET so a Range row and a lawn row never read alike.
#   - the three pickers whose change re-seats the Range (RESTART -> rangeResetOnRecord -> goRange; MODE; LANE; TARGETS)
#     are wrapped from the append zone or disabled on the lawn - the shipped handlers are byte-identical.
#  NOT HERE, by the plan: the Sentinel cue (r.220), the swarm predicate (r.220), CL.05 the Capitol as a non-target
#  (r.221), the ?map= reader (waits for the ladder lock, delta line 31), QUAL 40 on the lawn (his gap).
import hashlib, os, re, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
BASE_REV = '218'; NEW_REV = '219'
BASE_SHA = open(os.path.join(DECK, 'HASHES_r' + BASE_REV + '.sha256'), encoding='utf-8').read().split()[0]
SRC = os.path.join(DECK, 'drone-2525_r.' + BASE_REV + '.html')
s = open(SRC, encoding='utf-8').read()
if hashlib.sha256(s.encode('utf-8')).hexdigest() != BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.' + BASE_REV)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {n}')
    s = s.replace(old, new, count); return s

for need in ["add(p,'pop',p,80); });", "add(d,'uav',d,120); });", "function marksPersist(){ return chNum()===0&&!(state.lobby&&state.lobby.phase==='LIVE'); }",
             "paintLight(startLight()); paintTimer(); paintQualOver(); paintPos(); }", "const popOn=g===1||g===3||(g===5 && cap);"]:
    if need not in s: raise SystemExit('REFUSE: the r.218 base does not carry: ' + need[:60])
for dead in ['capIntro(', 'capStep', 'CSTART', 'A_MAN_CAN_PLAY_THE_LAWN_ALONE']:
    if dead in s: raise SystemExit('REFUSE: r.219 is already in the base: ' + dead)

# === the head ================================================================================================
rep("<span>r0.218</span>", "<span>r0.219</span>")
rep("revision:'0.218'", "revision:'0.219'")

# === the embedded R-CORE record moves on one row (lag exactly one, deck-rcore) ===============================
LEDGER = json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
THROUGH = 98
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
if not re.match(r'^[0-9a-f]{7,40}$', str(LEDGER['entries'][97].get('shipped', ''))): raise SystemExit('REFUSE: rev 98 (r.218) has no ship commit yet: ' + str(LEDGER['entries'][97].get('shipped')))
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
if json.loads(_old.group(1)).get('through') != 97: raise SystemExit('REFUSE: expected the r.218 base to embed through 97')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]

# === M2 · the chrome: a sibling class, two rules, nothing of .range widened ==================================
rep("\n</style>", "\n#app.cap #magWell{display:block} /* r.219: the lawn shows the magazine too - a sibling of .range, never a widening of it (its selectors are pinned by two gates) */\n"
    "#app.cap #startLight{display:flex;width:56px;height:75px;box-sizing:border-box;padding:3px 2px 2px;gap:0;justify-content:flex-start} /* r.219: the same light, the lawn's own lamp and clock painted into it */\n"
    "#app.cap #rngMode{order:1}#app.cap #btnRangeReset{order:3;margin-left:auto}\n</style>")
rep("if(app) app.classList.toggle('range',chNum()===0); if(app) app.classList.toggle('qual',",
    "if(app) app.classList.toggle('range',chNum()===0); if(typeof capChrome==='function') capChrome(app); if(app) app.classList.toggle('qual',")
rep("paintLight(startLight()); paintTimer(); paintQualOver(); paintPos(); }",
    "paintLight(startLight()); paintTimer(); if(typeof capIntro==='function'&&capIntro()) capPaintLawn(); paintQualOver(); paintPos(); }")

# === M1 · reach: the button reaches what a tap reaches - the Range's own number ===============================
rep("add(p,'pop',p,80); });", "add(p,'pop',p,340); }); /* r.219: was 80 - every lawn object stands 150-262 m out and a TAP had no cap at all */")
rep("add(d,'uav',d,120); });", "add(d,'uav',d,340); }); /* r.219: was 120 - the Introductory track stands at 150 m */")
rep("function asmTick(dt){\n  if(!state.asmSpot && !state.asmFire) return;",
    "function asmTick(dt){\n  if(typeof capIntro==='function'&&capIntro()) return; /* r.219: one player - the AI seats hold on Introductory */\n  if(!state.asmSpot && !state.asmFire) return;")
rep("bd<(best.form?340:80)){", "bd<340){ /* r.219: the AI's half of the same 80 m contradiction */")

# === M3 · the glass reads the lawn ===========================================================================
rep("function marksPersist(){ return chNum()===0&&!(state.lobby&&state.lobby.phase==='LIVE'); }",
    "function marksPersist(){ return (chNum()===0||(typeof capIntro==='function'&&capIntro()))&&!(state.lobby&&state.lobby.phase==='LIVE'); } /* r.219: Introductory too - target all, approve all, fire all on the lawn; the Capital's other challenges untouched */")

# === M5 · one air track: the eight pops, the Congress drones and the foils do not spawn on Introductory ======
rep("  const popOn=g===1||g===3||(g===5 && cap);\n  const uavOn=g>=2;\n  const foilOn=g===5 && cap;\n",
    "  const intro=typeof capIntro==='function'&&capIntro(); /* r.219: Introductory is ONE air track (delta line 26) */\n  const popOn=(g===1||g===3||(g===5 && cap))&&!intro;\n  const uavOn=g>=2&&!intro;\n  const foilOn=g===5 && cap && !intro;\n  if(intro) capIntroTick(dt);\n")
rep("function waveCheck(){\n  const need=challengeSpec().quota;",
    "function waveCheck(){\n  if(typeof capIntro==='function'&&capIntro()) return; /* r.219: no wave, no MOVING phase on Introductory - the track holds its bearing */\n  const need=challengeSpec().quota;")

# === M4 · the seat: the one door onto the Capital seats A1 on the record's t-south, facing 1800 =================
rep("if(v==='range'){ state.mode='range';", "if(v==='range'){ state.capStep=null; state.capRun=null; state.mode='range';")
rep("state.zoom=0.55; if(typeof restoreCapitolTurrets==='function') restoreCapitolTurrets();",
    "state.zoom=0.55; if(typeof restoreCapitolTurrets==='function') restoreCapitolTurrets(); if(typeof capIntroEnter==='function') capIntroEnter(); /* r.219 */")

# === the six boot rows, deferred beside the share sheet's own =================================================
ANCHOR = "  }catch(e){ rows.push({id:'THE_SHARE_LINE_KEEPS_ITS_WORDS',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1700);\n"
ROWS = ANCHOR + r"""  /* r.219 · TRAINING_IS_ON_THE_RECORD (delta line 25 / 183 - Introductory only after Training is on the record).
     A PRECONDITION row, kept for ever: measured on the shipped r.218 bytes before any lawn code and green there by
     design; it goes red the day a HIT/MISS row stops being written or the TIME row loses its counts. From the ROWS alone. */
  setTimeout(()=>{ const _s0=state._qaSilent; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='TRAINING_IS_ON_THE_RECORD')) return;
    const ev=()=>state.events||[], dec=()=>state.decisions||[];
    const m0=state.rangeMode, q0=state.qaArmed, d0=state.desig, s0=state.tgtSlot, a0=state.hiApproved, sd0=state.simDirect; let ok=false, note='';
    try{ state.qaArmed=true; state._qaSilent=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.simDirect=true;
      state.rangeMode='stay'; rangeReset(); downArm(); const e0=ev().length, k0=dec().length;
      const st=downStartOnRecord('QA'); platesHere().forEach(q=>{ if(q.up) applyHit(q,q.id); }); for(let i=0;i<40;i++) rangeTick(0.05);
      const rowsD=ev().slice(e0), decD=dec().slice(k0); const hit=rowsD.filter(e=>e.verb==='HIT').length, miss=rowsD.filter(e=>e.verb==='MISS').length;
      const S=decD.find(r=>r.kind==='START'), T=decD.find(r=>r.kind==='TIME'); const allT=rowsD.every(e=>typeof e.t==='number');
      state.rangeMode='bounce'; rangeReset(); const e1=ev().length; const p=platesHere().find(q=>q.up); if(p) applyHit(p,p.id); const up1=ev().slice(e1).filter(e=>e.verb==='HIT'||e.verb==='MISS').length;
      const cold=/decide\('COLD','RANGE',\{mode:'qual40',lane:[^}]*hits:[^}]*rounds:[^}]*score:/.test(String(qualFinish));
      ok=!!st&&!!S&&!!T&&typeof T.ms==='number'&&T.hits===hit&&T.misses===miss&&(hit+miss)>=1&&allT&&up1===1&&cold;
      note='TRAIN DOWN from the rows: START '+(S?'targets '+S.targets:'MISSING')+' · '+hit+' HIT + '+miss+' MISS rows = '+(hit+miss)+' rounds · TIME '+(T?T.ms+' ms, hits '+T.hits+', misses '+T.misses:'MISSING')+' · every row stamped t '+allT+' · TRAIN UP: one shot, '+up1+' HIT/MISS row · QUAL 40: the COLD row carries hits, rounds, score '+cold;
    }catch(e){ note='threw '+String(e).slice(0,100); } finally { state.simDirect=sd0; state.rangeMode=m0; rangeReset(); state.desig=d0; state.tgtSlot=s0; state.hiApproved=a0; state.qaArmed=q0; state._qaSilent=_s0; }
    rows.push({id:'TRAINING_IS_ON_THE_RECORD',ok,note});
  }catch(e){ state._qaSilent=_s0; rows.push({id:'TRAINING_IS_ON_THE_RECORD',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1760); /* before the ASM loop row's own 1900 ms setup: this row resets the Range and must be done with it first */
  /* r.219 · the five lawn rows. ONE door (pickScenario('capital') -> capIntroEnter), every unit snapshotted and
     restored in the finally (the fleet's structural finding: a Capital row that does not re-home measures a world
     the player never occupies), the Range reset after. Each row is red on the r.218 bytes: there is no lawn there. */
  setTimeout(()=>{ const _s0=state._qaSilent; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='A_MAN_CAN_PLAY_THE_LAWN_ALONE')) return;
    const ev=()=>state.events||[], dec=()=>state.decisions||[];
    const snap=rangeSnap(); const ph0=state.lobby?state.lobby.phase:null; const q0=state.qaArmed;
    const sv=Object.keys(units).filter(id=>units[id]&&units[id].kind==='turret').map(id=>[id,units[id].x,units[id].y,units[id].z,units[id].yaw,units[id].pan,units[id].tilt,units[id].label]);
    const pops0=pops.map(p=>p.up); const dr0=drones.map(d=>({up:d.up,x:d.x,y:d.y,z:d.z,life:d.life,lifePct:d.lifePct,fall:d.fall,vx:d.vx,vz:d.vz,mist:d.mist}));
    const sp0=state.asmSpot, sf0=state.asmFire, cl0=state.clock, tk0=state.tick, mg0=state.mag?Object.assign({},state.mag):null;
    const rec={alone:[false,''],one:[false,''],glass:[false,''],ai:[false,''],record:[false,'']};
    try{ state.qaArmed=true; state._qaSilent=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false;
      pickScenario('capital');
      const d=capIntroTrack(), u=units[state.unit];
      const seated=state.unit===capIntroSeat()&&!!u&&Math.abs(u.x-capIntroAt().x)<0.5&&Math.abs(u.z-capIntroAt().z)<0.5&&Math.abs(u.yaw-yawTo(0,1))<1e-6;
      const aim=()=>{ aimUnitAt(u,d,-40,40); state.aimRef=d; paintCues(); };
      const lit=()=>[...document.querySelectorAll('#fTgt,#fAppr,#fFire')].filter(b=>b.classList.contains('lit')).map(b=>b.id).join(',');
      aim(); const l0=lit(); const lk=lockOn(); const onIt=!!lk&&lk.id===d.id;
      markLock(lockOn(),'BTN'); paintCues(); const l1=lit(); const amber=!!state.desig&&state.desig.id===d.id&&state.desig.phase==='amber';
      approveDesig('HI-2'); paintCues(); const l2=lit(); const red=!!state.desig&&state.desig.id===d.id&&state.desig.phase==='red';
      const e0=ev().length; const mg=state.mag?(state.mag.rounds|0):-1; fireN(state.desig&&state.desig.slot||1); const hitRow=ev().slice(e0).some(e=>e.verb==='HIT'&&e.id===d.id); const spent=!!state.mag&&(state.mag.rounds|0)===mg-1; const down=d.lifePct<=0;
      rec.alone=[capIntro()&&chNum()===1&&roundOpen()&&seated&&onIt&&amber&&red&&hitRow&&spent&&down, 'capIntro '+capIntro()+' · CH'+chNum()+' · roundOpen '+roundOpen()+' · seated on t-south facing 1800 '+seated+' · under the bullseye '+(lk?lk.id:'nothing')+' · TARGET → '+(amber?'amber':'NO AMBER')+' · APPROVE → '+(red?'red':'NO RED')+' · FIRE → HIT row '+hitRow+', one round spent '+spent+', track down '+down];
      rec.glass=[marksPersist()&&l0==='fTgt'&&l1==='fAppr'&&l2==='fFire', 'marksPersist '+marksPersist()+' · lit: unmarked → '+(l0||'none')+' · amber → '+(l1||'none')+' · red → '+(l2||'none')];
      capIntroReset('QA'); let bad=0, worst='', maxUp=0, minUp=99;
      for(let i=0;i<600;i++){ state.tick=(state.tick|0)+1; state.clock+=0.05; spawn(0.05); const up=[...pops,...drones,...foils].filter(o=>o.up); if(up.length>maxUp) maxUp=up.length; if(up.length<minUp) minUp=up.length; const dz=d.z-u.z, dx=d.x-u.x; const b=Math.round(((((180+yawTo(dx,dz)*180/Math.PI)%360)+360)%360)*10); /* UCRS from the deck's own yaw basis: 0000 north, 1800 south */ if(up.length!==1||!d.up||!(d.lifePct>0)||Math.abs(b-1800)>10||pops.some(p=>p.up)){ bad++; if(!worst) worst='tick '+i+': up '+up.map(o=>o.id).join('+')+' bearing '+b; } }
      rec.one=[bad===0&&maxUp===1&&minUp===1, '600 ticks · standing objects min '+minUp+' max '+maxUp+' · bearing 1800 held '+(bad===0)+' · ground pops spawned '+pops.some(p=>p.up)+(worst?' · FIRST FAULT '+worst:'')];
      state.desig=null; state.tgtSlot={}; state.asmSpot=true; state.asmFire=true; const k0=dec().length; for(let i=0;i<20;i++) asmTick(0.1); const asmRows=dec().slice(k0).filter(r=>/^ASM@/.test(String(r.actor||''))).length;
      rec.ai=[!state.desig&&asmRows===0, 'asmSpot + asmFire on, 20 ticks: the AI marked '+(state.desig?state.desig.id:'nothing')+' · AI rows '+asmRows]; state.asmSpot=sp0; state.asmFire=sf0;
      capIntroMode('stay'); const e1=ev().length, k1=dec().length; const started=capIntroPress(); const CS=dec().slice(k1).find(r=>r.kind==='CSTART');
      aim(); markLock(lockOn(),'BTN'); approveDesig('HI-2'); fireN(state.desig&&state.desig.slot||1); for(let i=0;i<30;i++){ state.clock+=0.05; capIntroTick(0.05); }
      const CT=dec().slice(k1).find(r=>r.kind==='CTIME'); const hitsR=ev().slice(e1).filter(e=>e.verb==='HIT'&&e.id===d.id).length; const who=dec().slice(k1).every(r=>!!r.actor);
      rec.record=[started&&!!CS&&CS.targets===1&&CS.seat==='A1'&&!!CT&&typeof CT.ms==='number'&&CT.ms>=0&&CT.hits===hitsR&&CT.hits===1&&CT.misses===0&&who&&!!state.capRun&&state.capRun.go==='done', 'START pressed '+started+' → CSTART '+(CS?'targets '+CS.targets+' seat '+CS.seat:'MISSING')+' · HIT rows '+hitsR+' · CTIME '+(CT?CT.ms+' ms, hits '+CT.hits+', misses '+CT.misses:'MISSING')+' · every row names who pressed '+who+' · run '+(state.capRun?state.capRun.go:'none')];
    }catch(e){ const m='threw '+String(e).slice(0,100); Object.keys(rec).forEach(k=>{ if(!rec[k][1]) rec[k]=[false,m]; }); }
    finally { try{ pickScenario('range'); }catch(_){ } state.capStep=null; state.capRun=null; state.capDrill=null; sv.forEach(a=>{ const t=units[a[0]]; if(t){ t.x=a[1];t.y=a[2];t.z=a[3];t.yaw=a[4];t.pan=a[5];t.tilt=a[6];t.label=a[7]; } }); pops.forEach((p,i)=>{ p.up=pops0[i]; }); drones.forEach((dd,i)=>Object.assign(dd,dr0[i])); state.challenge=snap.challenge; state.rangeMode=snap.rangeMode; state.lane=snap.lane; state.zoom=snap.zoom; state.phase=snap.phase; state.hits=snap.hits; state.passed=snap.passed; state.unit=snap.unit; state.mode=snap.mode; state.viewMode=snap.view; state.clock=cl0; state.tick=tk0; if(mg0) state.mag=mg0; state.asmSpot=sp0; state.asmFire=sf0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; if(state.lobby) state.lobby.phase=ph0; state.qaArmed=q0; state._qaSilent=_s0; rangeReset(); }
    rows.push({id:'A_MAN_CAN_PLAY_THE_LAWN_ALONE',ok:rec.alone[0],note:rec.alone[1]}); rows.push({id:'ONE_AIR_TRACK_ON_THE_LAWN',ok:rec.one[0],note:rec.one[1]}); rows.push({id:'THE_GLASS_READS_THE_LAWN',ok:rec.glass[0],note:rec.glass[1]}); rows.push({id:'ONLY_THE_PLAYER_FIRES',ok:rec.ai[0],note:rec.ai[1]}); rows.push({id:'THE_LAWN_RUN_IS_ON_THE_RECORD',ok:rec.record[0],note:rec.record[1]});
  }catch(e){ state._qaSilent=_s0; ['A_MAN_CAN_PLAY_THE_LAWN_ALONE','ONE_AIR_TRACK_ON_THE_LAWN','THE_GLASS_READS_THE_LAWN','ONLY_THE_PLAYER_FIRES','THE_LAWN_RUN_IS_ON_THE_RECORD'].forEach(id=>{ if(!rows.some(x=>x.id===id)) rows.push({id,ok:false,note:'threw '+String(e).slice(0,100)}); }); } }, 1750); /* before the ASM loop row (1900): its finally resets the Range, which would re-stand every plate under that row's single exposure */
"""
rep(ANCHOR, ROWS)

# === the append zone: every new definition a hoisted function at the end of script #1 ==========================
TAIL_ANCHOR = "}catch(e){ try{ log('MOUSE','WIRE',String(e).slice(0,80)); }catch(_){ } } })();\n\n</script>"
LAWN = r"""}catch(e){ try{ log('MOUSE','WIRE',String(e).slice(0,80)); }catch(_){ } } })();

/* ===================================================================================================================
   r.219 — A MAN ALONE PLAYS TRAIN UP AND TRAIN DOWN ON THE LAWN (CRS-CL.INTRO.01, less the cue, which is r.220).
   INVARIANT: one player, ONE air track, the same three presses and the same glass as the Range, START · time · hits ·
   misses · who pressed on the record — and the Range untouched. The frozen Range engine is called, never edited.
   The seat is A1 of CRS-CL.12 — the record's sourced t-south station [0,-210] (deck z = +210), faced to 1800 down
   Congress (lawnSeatsRecord.corrections LC-01: the turrets row records homeAz 0 and is not edited). The Capitol is
   behind the player: that is where the threat comes from in the paper and in the CRS. The track is one drones[]
   member, bearing-fixed and hovering (CL.04.02's "low, slow, bearing fixed"; the drill is the three presses, not the
   lead). Rows: CSTART / CTIME / CRESET are the lawn's own verbs so a Range row never reads like a lawn row.
   =================================================================================================================== */
/* hoisted FUNCTIONS, never var/const: toolSelfTest() runs synchronously above this zone, and a var here is still
   undefined when the scenario-picker row enters the Capital (the r.208 lesson, met again on this cut's first boot). */
function capIntroSeat(){ return 'T01'; }
function capIntroAt(){ return {x:0,z:210}; }      /* docs/drone-2525/drone-2525.v00.00.json turrets[t-south].at = [0,-210]; deck z = -(record y) */
function capIntroRangeM(){ return 150; }          /* the one air track stands this far down Congress (1800) — Introductory's distance, declared */
function capIntroAltM(){ return 12; }
function capIntro(){ return chNum()!==0 && state.capStep==='intro'; }
function capIntroDrill(){ return state.capDrill==='stay'?'stay':'bounce'; }
function capIntroTrack(){ return (typeof drones!=='undefined'&&drones[0])||null; }
function capIntroEnter(){ /* the one door: pickScenario('capital') after restoreCapitolTurrets */
  state.capStep='intro'; if(!state.capDrill) state.capDrill='bounce';
  const u=units[capIntroSeat()]; if(u){ u.x=capIntroAt().x; u.y=0; u.z=capIntroAt().z; u.yaw=yawTo(0,1); u.pan=0; u.tilt=Math.atan2(capIntroAltM()-1.6,capIntroRangeM())*180/Math.PI; }
  state.unit=capIntroSeat(); state.zoom=1; state.phase='static';
  capIntroReset('ENTER'); if(typeof hudMag==='function') hudMag();
}
function capIntroReset(why){ const d=capIntroTrack(); if(!d) return;
  d.x=capIntroAt().x; d.z=capIntroAt().z+capIntroRangeM(); d.y=capIntroAltM(); d.vx=0; d.vz=0; d.mist=false; d.lifePct=100; d.fall=0; d.life=1e9; d._a=0;
  const stay=capIntroDrill()==='stay'; d.up=!stay;      /* TRAIN UP: the track stands; TRAIN DOWN: armed, down until START */
  state.capRun={go:stay?'armed':'run',t0:state.clock,e0:(state.events||[]).length,hitT:null,ms:null,why:why};
  if(typeof releaseAuthority==='function') releaseAuthority('LAWN '+why);
}
function capIntroRows(R){ const ev=(state.events||[]).slice((R&&R.e0)|0).filter(e=>e&&e.id===(capIntroTrack()||{}).id); return {hits:ev.filter(e=>e.verb==='HIT').length,misses:ev.filter(e=>e.verb==='MISS').length}; } /* counted from the row INDEX at START, never from t: a row's t is stored to two decimals and can round below the clock it was born on */
function capIntroStart(){ /* START through the real button: a CSTART row, the track stands, the clock opens */
  if(!capIntro()) return false;
  if(!roundOpen()){ decide('REJECT','LAWN',{reason:'ROUND_NOT_OPEN'}); toast('PRESS PRACTICE BEFORE YOU START'); return false; }
  const R=state.capRun; if(R&&R.go==='run'){ decide('REJECT','LAWN',{reason:'CLOCK_RUNNING'}); toast('THE CLOCK IS RUNNING · HIT THE TRACK'); return false; }
  capIntroReset('START'); const d=capIntroTrack(); d.up=true; state.capRun.go='run'; state.capRun.t0=state.clock; state.capRun.e0=(state.events||[]).length;
  decide('CSTART','LAWN',{why:'BUTTON',mode:capIntroDrill(),seat:'A1',targets:1}); toast('START · ONE TRACK · 1800'); return true;
}
function capIntroPress(){ /* the RESTART button on the lawn: START when TRAIN DOWN is armed, RESTART otherwise */
  const R=state.capRun; if(capIntroDrill()==='stay'&&R&&R.go==='armed') return capIntroStart();
  capIntroReset('RESTART'); decide('CRESET','LAWN',{mode:capIntroDrill(),seat:'A1',why:'BUTTON'}); toast('LAWN · '+(capIntroDrill()==='stay'?'TRAIN DOWN · PRESS START':'TRAIN UP · ONE TRACK · 1800')); return true;
}
function capIntroMode(v){ /* the MODE picker on the lawn: TRAIN UP or TRAIN DOWN; QUAL 40 is Training, on the Range (CL.03) */
  if(v==='qual40'){ toast('QUAL 40 IS TRAINING · ON THE RANGE'); return false; }
  state.capDrill=v==='stay'?'stay':'bounce'; capIntroReset('MODE'); decide('CRESET','LAWN',{mode:capIntroDrill(),seat:'A1',why:'MODE'});
  toast('LAWN · '+RANGE_MODE_NAME[capIntroDrill()]+(capIntroDrill()==='stay'?' · PRESS START':' · ONE TRACK · 1800')); return true;
}
function capIntroTick(dt){ const d=capIntroTrack(), R=state.capRun; if(!d||!R) return; state.phase='static';
  if(R.go==='armed'){ d.up=false; return; }                                   /* TRAIN DOWN before START: down, waiting */
  const struck=(d.lifePct<=0)||(!d.up&&R.hitT==null);                        /* a hit leaves lifePct 0; the fire path may also drop `up` itself */
  if(struck&&R.hitT==null){ if(d.up){ d.fall=Math.min(1,(d.fall||0)+dt*2.4); if(d.fall<1) return; d.up=false; }
    R.hitT=state.clock; if(typeof dropMark==='function') dropMark(d.id,'DOWN');
    if(capIntroDrill()==='stay'&&R.go==='run'){ R.go='done'; const ms=Math.round((state.clock-R.t0)*1000); R.ms=ms; const c=capIntroRows(R); decide('CTIME','LAWN',{mode:'stay',seat:'A1',ms:ms,hits:c.hits,misses:c.misses}); toast('ALL DOWN · '+capClockWord(ms/1000)); }
    return; }
  if(!d.up&&capIntroDrill()==='bounce'&&R.hitT!=null&&(state.clock-R.hitT)>=RETURN_S){ d.lifePct=100; d.fall=0; d.mist=false; d.up=true; R.hitT=null; } /* TRAIN UP: the track comes back after RETURN_S, like a plate */
  if(d.up){ d.vx=0; d.vz=0; d.x=capIntroAt().x; d.z=capIntroAt().z+capIntroRangeM(); }
}
function capClockWord(sec){ const s=Math.max(0,sec||0); const m=Math.floor(s/60), r=s-m*60, w=Math.floor(r), t=Math.floor((r-w)*10); return m+':'+String(w).padStart(2,'0')+'.'+t; }
function capLight(){ const d=capIntroTrack(), R=state.capRun; if(!d||!R||R.go==='armed'||R.go==='done') return 'R'; return d.up&&d.lifePct>0?'G':'R'; }
function capChrome(app){ /* every frame from paintCues: the class, and the two pickers whose change re-seats the Range are closed on the lawn */
  const on=capIntro(); if(app) app.classList.toggle('cap',on);
  ['lanePick','tgtPick'].forEach(id=>{ const el=document.getElementById(id); if(el&&el.disabled!==on) el.disabled=on; });
  const rm=document.getElementById('rngMode'); if(rm){ const q=rm.querySelector('option[value="qual40"]'); if(q&&q.disabled!==on) q.disabled=on; if(on&&rm.value!==capIntroDrill()) rm.value=capIntroDrill(); }
}
function capPaintLawn(){ /* after the frozen painters, in the same frame: the lamp, the word and the clock, the button's word */
  paintLight(capLight()); const R=state.capRun||{}; const stay=capIntroDrill()==='stay'; const d=capIntroTrack();
  const w=document.getElementById('startWord'), tm=document.getElementById('startTime');
  const word=stay?(R.go==='armed'?'START':R.go==='done'?'ALL DOWN':'TIME'):(d&&d.up&&d.lifePct>0?'FIRE':'WAIT');
  const clock=stay?(R.go==='run'?capClockWord(state.clock-R.t0):R.go==='done'?capClockWord((R.ms||0)/1000):''):'';
  if(w&&w.textContent!==word) w.textContent=word; if(tm&&tm.textContent!==clock) tm.textContent=clock;
  const rr=document.getElementById('btnRangeReset'); if(rr){ const bw=stay&&R.go==='armed'?'START':'RESTART'; if(rr.textContent!==bw) rr.textContent=bw; rr.classList.toggle('call',stay&&(R.go==='armed'||R.go==='done')); }
}
(function(){ try{ /* the shipped handlers are byte-identical; the lawn wraps them from here (one door per thing) */
  const rr=document.getElementById('btnRangeReset'); if(rr){ const prev=rr.onclick; rr.onclick=function(e){ if(capIntro()){ capIntroPress(); paintCues(); return; } return prev?prev.call(this,e):undefined; }; }
  const rm=document.getElementById('rngMode'); if(rm){ const prev=rm.onchange; rm.onchange=function(e){ if(capIntro()){ if(!capIntroMode(this.value)) this.value=capIntroDrill(); paintCues(); return; } return prev?prev.call(this,e):undefined; }; }
}catch(e){ try{ log('LAWN','WIRE',String(e).slice(0,80)); }catch(_){ } } })();

</script>"""
rep(TAIL_ANCHOR, LAWN)

if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit(f'REFUSE: script #{i} does not parse: {r.stderr[:300]}')

out = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(out, 'w', encoding='utf-8').write(s)
print('r.' + NEW_REV, len(s.encode('utf-8')), 'B', hashlib.sha256(s.encode('utf-8')).hexdigest())

# r.228 -> r.229 — H03: 1v1, ONE HI PER SYSTEM, TWO SYSTEMS (operator 2026-10-21, the night brief; CRS-CL.H03)
#  "r.229 · H03. 1v1. HI 2 · systems 2 · partners on one system 0. Each owns one platform and one air track. Each can
#  take the other. A press does not land on the other system's mark." The two "systems" are the two team-phones of the
#  already-qualified 1v1 room (one BLU, one RED) — match stays 1 (editing QUALIFIED_MATCH would unlock unqualified 2v2
#  for the Range). The discriminator is TEAMS, CL.15's own frame: opposite teams on the lawn = two systems (H03); same
#  team = H02's one system. Each phone drives ONLY its own system's track (BLU->drones[0]/A1, RED->drones[1]/A2); a
#  peer's lawn row is record-only (no cross-talk); each phone's single HI self-approves its own mark; CSTART/CTIME name
#  that system's one HI with its own system. Introductory scenario (Enki's Spark, one track each); harder scenarios come
#  at later rungs ("depends on scenario", operator 2026-10-22). Every function edited is FREE (none in range-spans.json);
#  a same-team / no-lawn snapshot takes the byte-identical H02/old branch it always did.
import hashlib, os, re, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
if not os.path.exists(os.path.join(DECK, 'HASHES_r228.sha256')):
    DECK = os.path.join(ROOT, 'docs', 'drone-2525', 'operator-deck')
BASE_REV = '228'; NEW_REV = '229'
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

# the r.228 base must carry these (presence), and must NOT already carry r.229 (absence)
for need in [
    "lawn:(+state._selCh===1)   /* r.228 (H02):",
    "function capLawnCrew(){ return typeof capIntro==='function'&&capIntro()&&!!(state.lobby&&state.lobby.phase==='LIVE'&&state.lobby.launch&&state.lobby.launch.lawn===true); }",
    "function capIntroTrack(){ return (typeof drones!=='undefined'&&drones[0])||null; }",
    "function capLawnPeer(row){ const d=capIntroTrack(), data=row.data||{}; if(!d) return;",
    "!(state.lobby&&state.lobby.phase==='LIVE')||capLawnCrew()))",
    "if(state.lobby&&state.lobby.phase==='LIVE'&&!byPeer&&!capLawnCrew()){",
    "if(live&&(!member||(by===d.by&&!capLawnCrew()))){",
    "toast(data.lawn===true?'ROOM LIVE · TWO HI · ONE SYSTEM':('ROOM LIVE · '+data.match+'v'+data.match+' · '+state.lobby.team));",
    "function capLawnHi(){ const lb=state.lobby;",
    "<span>r0.228</span>", "revision:'0.228'",
    "rows.push({id:'TWO_HI_ONE_SYSTEM',ok,note});",
]:
    if s.count(need) != 1: raise SystemExit('REFUSE: the r.228 base does not carry exactly one of: ' + need[:70])
if s.count("system:'A1',hi:capLawnHi()") != 3: raise SystemExit('REFUSE: expected 3 of CSTART/CTIME system:A1,hi:capLawnHi')
for dead in ['capLawn1v1', 'capLawnSystems', 'capOwnSystem', 'capSystemHi', 'ONE_HI_PER_SYSTEM', 'systems:(((+state._selCh===1)']:
    if dead in s: raise SystemExit('REFUSE: r.229 is already in the base: ' + dead)

# === the corner + BUILD ======================================================================================
rep("<span>r0.228</span>", "<span>r0.229</span>")
rep("revision:'0.228'", "revision:'0.229'")

# === M1 · the launch-snapshot discriminator: opposite teams on the lawn = two systems (H03) ==================
rep("    lawn:(+state._selCh===1)   /* r.228 (H02): the CH1 LAWN chip's own word — the room opens on the lawn; a snapshot without it lands where it always did */",
    "    lawn:(+state._selCh===1),   /* r.228 (H02): the CH1 LAWN chip's own word — the room opens on the lawn; a snapshot without it lands where it always did */\n"
    "    systems:(((+state._selCh===1)&&new Set((seats||[]).map(x=>x&&x.team).filter(Boolean)).size>1)?2:1)   /* r.229 (H03): opposite teams on the lawn = 1v1, two systems (CL.15 'one BluFor vs one RedFor'); same team = H02's one system */")

# === M2 · the new per-system helpers (before capLawnPeer), and the per-system track ==========================
rep("function capLawnPeer(row){ const d=capIntroTrack(), data=row.data||{}; if(!d) return;",
    "function capLawnSystems(){ return +(state.lobby&&state.lobby.launch&&state.lobby.launch.systems)||1; }\n"
    "function capLawn1v1(){ return typeof capIntro==='function'&&capIntro()&&!!(state.lobby&&state.lobby.phase==='LIVE'&&state.lobby.launch&&state.lobby.launch.lawn===true)&&capLawnSystems()===2; }   /* r.229 (H03): one HI per system, two systems — distinct from capLawnCrew (H02, one system, two HI) */\n"
    "function capLawnTeam(){ const lb=state.lobby; const m=lb&&lb.members&&lb.members[SID]; return (m&&m.team)||(lb&&lb.team)||'BLU'; }\n"
    "function capOwnSystem(){ return (typeof capLawn1v1==='function'&&capLawn1v1()&&capLawnTeam()==='RED')?'A2':'A1'; }   /* BLU=A1, RED=A2; H02 and solo stay A1 */\n"
    "function capSystemHi(sys){ const lb=state.lobby; if(lb&&lb.phase==='LIVE'&&lb.members){ const m=Object.keys(lb.members).filter(id=>id&&lb.members[id]&&(((lb.members[id].team==='RED')?'A2':'A1')===sys)).sort(); if(m.length) return m; } return [SID]; }\n"
    "function capOwnHi(){ return (typeof capLawn1v1==='function'&&capLawn1v1())?capSystemHi(capOwnSystem()):capLawnHi(); }\n"
    "function capLawnPeer(row){ const d=capIntroTrack(), data=row.data||{}; if(!d) return;\n"
    "  if(typeof capLawn1v1==='function'&&capLawn1v1()) return; /* r.229 (H03): each phone drives only its own system's track; a peer's lawn row is record-only — no cross-talk */")

rep("function capIntroTrack(){ return (typeof drones!=='undefined'&&drones[0])||null; }",
    "function capIntroTrack(){ const i=(typeof capLawn1v1==='function'&&capLawn1v1()&&(typeof capLawnTeam==='function')&&capLawnTeam()==='RED')?1:0; return (typeof drones!=='undefined'&&drones[i])||null; }   /* r.229 (H03): BLU drives drones[0]/A1, RED drives drones[1]/A2; H02 and solo keep drones[0] */")

# === M3 · capLawnCrew is H02 only (systems:1); H03 takes the capLawn1v1 path ==================================
rep("function capLawnCrew(){ return typeof capIntro==='function'&&capIntro()&&!!(state.lobby&&state.lobby.phase==='LIVE'&&state.lobby.launch&&state.lobby.launch.lawn===true); }",
    "function capLawnCrew(){ return typeof capIntro==='function'&&capIntro()&&!!(state.lobby&&state.lobby.phase==='LIVE'&&state.lobby.launch&&state.lobby.launch.lawn===true)&&(+(state.lobby.launch.systems)||1)!==2; }   /* r.229: H02 = one system, two HI (systems!==2); H03's two systems take capLawn1v1 */")

# === M4 · the bullseye reading and self-approve hold on the lawn for H03 too ==================================
rep("!(state.lobby&&state.lobby.phase==='LIVE')||capLawnCrew()))",
    "!(state.lobby&&state.lobby.phase==='LIVE')||capLawnCrew()||capLawn1v1()))")
rep("if(state.lobby&&state.lobby.phase==='LIVE'&&!byPeer&&!capLawnCrew()){",
    "if(state.lobby&&state.lobby.phase==='LIVE'&&!byPeer&&!capLawnCrew()&&!capLawn1v1()){")
rep("if(live&&(!member||(by===d.by&&!capLawnCrew()))){",
    "if(live&&(!member||(by===d.by&&!capLawnCrew()&&!capLawn1v1()))){")

# === M5 · CSTART/CTIME name this system's one HI with its own system (H03); H02 stays A1/whole-room ===========
rep("system:'A1',hi:capLawnHi()", "system:capOwnSystem(),hi:capOwnHi()", 3)

# === M6 · the room-entry toast names the 1v1 ================================================================
rep("toast(data.lawn===true?'ROOM LIVE · TWO HI · ONE SYSTEM':('ROOM LIVE · '+data.match+'v'+data.match+' · '+state.lobby.team));",
    "toast(data.lawn===true?((+data.systems||1)===2?'ROOM LIVE · 1v1 · BLU vs RED · ONE HI EACH':'ROOM LIVE · TWO HI · ONE SYSTEM'):('ROOM LIVE · '+data.match+'v'+data.match+' · '+state.lobby.team));   /* r.229 (H03): 1v1 names the two systems */")

# === M6b · the self-approve acts and the "other seat" wording is suppressed for H03 too (the play found a dark APPROVE) ===
rep("if(!(state.lobby&&state.lobby.phase==='LIVE')||capLawnCrew()) return true; return !!(d.by",
    "if(!(state.lobby&&state.lobby.phase==='LIVE')||capLawnCrew()||capLawn1v1()) return true; return !!(d.by")   # approveWorksHere: own amber mark is approvable in H03
rep("((byPeer&&!capLawnCrew())?' · THE OTHER SEAT FIRES':' · NOW PRESS FIRE')",
    "((byPeer&&!capLawnCrew()&&!capLawn1v1())?' · THE OTHER SEAT FIRES':' · NOW PRESS FIRE')")   # T1
rep("((state.lobby&&state.lobby.phase==='LIVE'&&!capLawnCrew())?'AMBER · THE OTHER SEAT MUST APPROVE':'AMBER · PRESS APPROVE FIRST')",
    "((state.lobby&&state.lobby.phase==='LIVE'&&!capLawnCrew()&&!capLawn1v1())?'AMBER · THE OTHER SEAT MUST APPROVE':'AMBER · PRESS APPROVE FIRST')")   # T2
rep("((state.lobby&&state.lobby.phase==='LIVE'&&!capLawnCrew())?' · WAIT FOR THE OTHER SEAT TO APPROVE':",
    "((state.lobby&&state.lobby.phase==='LIVE'&&!capLawnCrew()&&!capLawn1v1())?' · WAIT FOR THE OTHER SEAT TO APPROVE':")   # T3
rep("if(capLawnCrew()&&typeof capIntroTrack==='function'){ const dT=capIntroTrack();",
    "if((capLawnCrew()||capLawn1v1())&&typeof capIntroTrack==='function'){ const dT=capIntroTrack();")   # fireN: a second FIRE on the struck own track is refused in H03 too

# === M6c · the no-cross-talk guard: in H03 a peer's row for the OTHER system's track is record-only (the play's bug) ===
rep("const id=row.id, data=row.data||{};",
    "if(typeof capLawn1v1==='function'&&capLawn1v1()&&row.peerId&&row.peerId!==SID&&!/^(LOBBY_|CSTART|CTIME|CRESET|CUE)/.test(String(row.verb||''))){ const _mine=(typeof capIntroTrack==='function'&&capIntroTrack()&&capIntroTrack().id); if(_mine&&row.id&&row.id!==_mine) return; } /* r.229 (H03): a peer's row for the OTHER system's track stays on the record (one hash) and drives nothing on this phone — no cross-talk (the two-phone play's bug: a mark/approve for the other track was applied here and relayed a HOLD back) */\n  const id=row.id, data=row.data||{};")

# === M7 · the H03 boot-QA row: ONE_HI_PER_SYSTEM / NO_CROSS_TALK ============================================
H03ROW = r"""
  /* r.229 · one HI per system, two systems (CRS-CL.H03: "1v1. One HI per system. Each owns one platform. No cross-talk.").
     Red on the r.228 bytes: no systems discriminator (an opposite-team room was still H02's one shared system), capLawn1v1 is
     undefined, CSTART names the whole room. Green on the cut: a LIVE lawn room of two members on OPPOSITE teams (BLU/RED) has
     systems:2 in its snapshot; capLawn1v1 is true and capLawnCrew is false; this (BLU) phone owns system A1 and drives
     drones[0]; its one HI self-approves its own mark (no TWO_HUMANS); FIRE strikes its own track, one round; CSTART and CTIME
     name only this system's one HI (length 1) with system A1; and a peer CSTART for the other system (A2, from RED) is
     record-only — this phone's own run is untouched (no cross-talk). Same snapshot/restore as the H02 row. */
  setTimeout(()=>{ const _s0=state._qaSilent; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='ONE_HI_PER_SYSTEM')) return;
    const snap=rangeSnap(); const q0=state.qaArmed; const sd0=state.simDirect; const sc0=state._selCh;
    const lb0=state.lobby?{phase:state.lobby.phase,host:state.lobby.host,team:state.lobby.team,members:state.lobby.members,launch:state.lobby.launch}:null;
    const cpSave=state.com?state.com.path:undefined;
    const sv=Object.keys(units).filter(id=>units[id]&&units[id].kind==='turret').map(id=>[id,units[id].x,units[id].y,units[id].z,units[id].yaw,units[id].pan,units[id].tilt,units[id].label]);
    const pops0=pops.map(p=>p.up); const dr0=drones.map(d=>({up:d.up,x:d.x,y:d.y,z:d.z,life:d.life,lifePct:d.lifePct,fall:d.fall,vx:d.vx,vz:d.vz,mist:d.mist}));
    const cl0=state.clock, tk0=state.tick, mg0=state.mag?Object.assign({},state.mag):null; const intro=document.getElementById('intro'); const in0=intro?intro.style.display:null;
    let ok=false, note='';
    try{ state.qaArmed=true; state._qaSilent=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.simDirect=true;
      const dec=()=>state.decisions||[];
      if(!state.lobby) state.lobby={}; state.lobby.phase='LIVE'; state.lobby.host=true; state.lobby.team='BLU';
      state.lobby.members={[SID]:{peerId:SID,team:'BLU',ready:true,auth:true},'peer-B':{peerId:'peer-B',team:'RED',ready:true,auth:true}};   /* OPPOSITE teams = two systems */
      state._selCh=1; const snapL=lobbyLaunchSnapshot(); const sys2=snapL.systems===2&&snapL.lawn===true; state._selCh=sc0; state.lobby.launch={lawn:true,systems:2,match:1};
      pickScenario('capital');
      const is1v1=capLawn1v1()&&!capLawnCrew()&&capLawnSystems()===2; const onLawn=capIntro()&&chNum()===1&&state.lobby.phase==='LIVE'&&marksPersist();
      const ownSys=capOwnSystem()==='A1'; const d=capIntroTrack(); const ownTrack=d===drones[0]; const u=units[state.unit];
      state.capDrill='stay'; capIntroReset('QA'); const k0=dec().length, mg=state.mag?(state.mag.rounds|0):-1;
      capIntroStart(); const CS=dec().slice(k0).find(r=>r.kind==='CSTART'); const csOne=!!CS&&CS.system==='A1'&&Array.isArray(CS.hi)&&CS.hi.length===1&&CS.hi[0]===SID;
      const aim=()=>{ aimUnitAt(u,d,-40,40); state.aimRef=d; paintCues(); };
      aim(); markLock(lockOn(),'BTN'); const amber=!!(state.desig&&state.desig.phase==='amber'&&state.desig.id===d.id);
      approveDesig('HI-2'); const selfRed=!!(state.desig&&state.desig.phase==='red'&&state.desig.id===d.id)&&!dec().slice(k0).some(r=>r.reason==='TWO_HUMANS');
      const rc0=JSON.stringify(Object.assign({},state.capRun)); const o1=drones[1]?drones[1].up:false;
      capLawnPeer({verb:'CSTART',peerId:'peer-B',data:{mode:'stay',system:'A2',hi:['peer-B']}});   /* the other system's row — record-only here */
      const noCross=JSON.stringify(Object.assign({},state.capRun))===rc0&&((drones[1]?drones[1].up:false)===o1);
      for(let i=0;i<60;i++){ state.clock+=0.05; capIntroTick(0.05); } const cued=!!(state.capRun&&state.capRun.cued);
      fireN(state.desig&&state.desig.slot||1); const struck=d.lifePct<=0; const mg1=state.mag?(state.mag.rounds|0):-1;
      for(let i=0;i<60;i++){ state.clock+=0.05; capIntroTick(0.05); }
      const CT=dec().slice(k0).find(r=>r.kind==='CTIME'); const ctOne=!!CT&&CT.system==='A1'&&Array.isArray(CT.hi)&&CT.hi.length===1&&CT.hi[0]===SID;
      ok = sys2&&is1v1&&onLawn&&ownSys&&ownTrack&&csOne&&amber&&selfRed&&noCross&&cued&&struck&&(mg<0||mg-mg1===1)&&ctOne;
      note = 'systems:2 in the snapshot '+sys2+' · capLawn1v1 not crew '+is1v1+' · on the lawn in LIVE '+onLawn+' · own system A1 '+ownSys+' · own track drones[0] '+ownTrack+' · CSTART one HI, system A1 '+csOne+' · my mark amber '+amber+' · my own approve red (no TWO_HUMANS) '+selfRed+' · a peer CSTART for A2 is record-only (no cross-talk) '+noCross+' · cued '+cued+' · FIRE struck my track '+struck+' (rounds '+mg+'→'+mg1+') · CTIME one HI, system A1 '+ctOne;
    }catch(e){ note='threw '+String(e).slice(0,100); }
    finally { try{ pickScenario('range'); }catch(_){ } state.capStep=null; state.capRun=null; state.capDrill=null; state.capLast=null; if(intro) intro.style.display=in0; state.simDirect=sd0; state._selCh=sc0; sv.forEach(a=>{ const t=units[a[0]]; if(t){ t.x=a[1];t.y=a[2];t.z=a[3];t.yaw=a[4];t.pan=a[5];t.tilt=a[6];t.label=a[7]; } }); pops.forEach((p,i)=>{ p.up=pops0[i]; }); drones.forEach((dd,i)=>Object.assign(dd,dr0[i])); state.challenge=snap.challenge; state.rangeMode=snap.rangeMode; state.lane=snap.lane; state.zoom=snap.zoom; state.phase=snap.phase; state.hits=snap.hits; state.passed=snap.passed; state.unit=snap.unit; state.mode=snap.mode; state.viewMode=snap.view; state.clock=cl0; state.tick=tk0; if(mg0) state.mag=mg0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.aimRef=null; if(state.lobby&&lb0){ state.lobby.phase=lb0.phase; state.lobby.host=lb0.host; state.lobby.team=lb0.team; state.lobby.members=lb0.members; state.lobby.launch=lb0.launch; } if(state.com&&cpSave!==undefined) state.com.path=cpSave; state.qaArmed=q0; state._qaSilent=_s0; rangeReset(); }
    rows.push({id:'ONE_HI_PER_SYSTEM',ok,note});
  }catch(e){ state._qaSilent=_s0; if(!rows.some(x=>x.id==='ONE_HI_PER_SYSTEM')) rows.push({id:'ONE_HI_PER_SYSTEM',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1860); /* after the H02 row (1850) */"""
rep("}, 1850); /* after the r.227 row (1835) */",
    "}, 1850); /* after the r.227 row (1835) */" + H03ROW)

# === the embedded R-CORE record moves on one row (lag exactly one, deck-rcore): through 108 -> 109 ===========
#  r.228 shipped (ledger rev 109 = r.228's release, c84f7c4). r.229 embeds all 109 entries the ledger now carries;
#  the bookkeeping appends rev 110 (r.229's own release) AFTER this cut is frozen, so the ledger file ends one entry
#  longer than the deck -> lag exactly one, through === entries.length (deck-rcore.test.mjs:42-44). The redaction
#  regex is textually identical to the gate's MODEL_RE so the deck text matches redact(ledger.text) field for field.
import json as _json
LEDGER = _json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
THROUGH = 109
if DEV and len(LEDGER['entries']) < THROUGH: THROUGH = len(LEDGER['entries'])
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
if not DEV and LEDGER['entries'][108].get('kind') != 'release': raise SystemExit('REFUSE: entries[108] (rev 109) must be the r.228 release')
if not DEV and not re.match(r'^[0-9a-f]{7,40}$', str(LEDGER['entries'][108].get('shipped', ''))): raise SystemExit('REFUSE: rev 109 (r.228) has no ship commit yet: ' + str(LEDGER['entries'][108].get('shipped')))
_e = []
for e in LEDGER['entries'][:THROUGH]:
    o = {'rev': e['rev'], 'date': e['date'], 'kind': e['kind'], 'text': MODEL.sub('an external model', e.get('text', '')), 'commit': e.get('commit', '')}
    if 'shipped' in e: o['shipped'] = e['shipped']
    _e.append(o)
BLOCK = _json.dumps({'section': LEDGER['section'], 'route': LEDGER['route'], 'through': THROUGH, 'entries': _e}, ensure_ascii=False, separators=(',', ':'))
for bad in ['</script', '<!--', '-->', ' ', ' ']:
    if bad in BLOCK: raise SystemExit('REFUSE: the ledger block carries %r' % bad)
_old = re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/', s)
if not _old: raise SystemExit('REFUSE: the embedded ledger block was not found')
if not DEV and _json.loads(_old.group(1)).get('through') != 108: raise SystemExit('REFUSE: expected the r.228 base to embed through 108')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]

# === invariants + node --check ===============================================================================
if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')
for must in ['function capLawn1v1(', 'function capLawnSystems(', 'function capOwnSystem(', 'function capSystemHi(', 'function capOwnHi(',
             "system:capOwnSystem(),hi:capOwnHi()", "(+(state.lobby.launch.systems)||1)!==2",
             "a peer's lawn row is record-only", "ROOM LIVE · 1v1 · BLU vs RED · ONE HI EACH"]:
    if s.count(must) != 1 and must != "system:capOwnSystem(),hi:capOwnHi()": raise SystemExit('REFUSE: expected exactly one %r' % must)
if s.count("system:capOwnSystem(),hi:capOwnHi()") != 3: raise SystemExit('REFUSE: expected 3 CSTART/CTIME per-system edits')
# the shipped H02 and Range pins must be intact
if s.count("rows.push({id:'TWO_HI_ONE_SYSTEM',ok,note});") != 1: raise SystemExit('REFUSE: the r.228 H02 boot row was disturbed')
if "QUAL 40 IS TRAINING · ON THE RANGE" not in s: raise SystemExit('REFUSE: the lawn QUAL 40 refusal was removed')
if not re.search(r"reason:'TWO_HUMANS'", s) or not re.search(r"state\.lobby\.phase==='LIVE'&&!byPeer", s): raise SystemExit('REFUSE: the r.129 two-humans pins would break')
if "if(+state.challenge===0) rangeTick(" not in s: raise SystemExit('REFUSE: the frozen range tick call moved')
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit('REFUSE: script #%d does not parse: %s' % (i, r.stderr[:300]))

OUT = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(OUT, 'w', encoding='utf-8').write(s)
print('OK r.228 -> r.229 · %d bytes · sha256 %s' % (len(s.encode('utf-8')), hashlib.sha256(s.encode('utf-8')).hexdigest()[:16]))

# r.227 -> r.228 — H02: TWO HI ON ONE SYSTEM (operator 2026-10-21, the night brief)
#  "r.228 · H02. Two HI, one system, one partner. The pilot and the gunner. A press from either is accepted. A second
#  FIRE on the same mark is refused. The record names both." (CRS-CL.H02: HI 2 · systems 1 · partners 1 · scene H01.S.)
#  INVARIANT: two phones in one room sit on one lawn system (A1) and one air track; TARGET, APPROVE and FIRE from either
#  phone are accepted and land on the same mark; a FIRE on a track the other HI already took is refused and spends
#  nothing; one record on both phones names both HI on the run's rows. Measured on the r.227 bytes: the room's launch
#  snapshot had no lawn door (a CH1 room landed on the old ring seat), the four lawn verbs (CSTART/CTIME/CRESET/CUE)
#  never travelled, marksPersist() was false in a room, approveDesig/wireApprove held TWO_HUMANS on a self-approve and
#  fireN refused the approver's seat (NOT_THE_MARKERS_SEAT), and a second FIRE on a struck track was a TARGET_GONE.
#  Every function edited is FREE (none in range-spans.json); the old capitol two-phone seat is untouched — a launch
#  snapshot without `lawn` takes the byte-identical branch it always did (CH0 / CH3 / CH5 rooms, the e2e, the boot rows).
import hashlib, os, re, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
if not os.path.exists(os.path.join(DECK, 'HASHES_r227.sha256')):
    DECK = os.path.join(ROOT, 'docs', 'drone-2525', 'operator-deck')
BASE_REV = '227'; NEW_REV = '228'
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

TAIL = "(function(){ try{ var q=new URLSearchParams(location.search||''); if(q.get('map')&&!q.get('range')) openMapLink(q.get('map')); }catch(e){ try{ log('LAWN','LINK',String(e).slice(0,80)); }catch(_){ } } })();\n\n</script>"
ROWANCHOR = "  /* r.227 · the link opens the lawn only on a Training record (operator 2026-10-21:"
SNAP = "    preLaunchHash:replayHash()\n  };"
DOOR = "  if(state.challenge===0&&typeof goRange==='function')goRange();\n  rcoreStep('REALITY');\n  toast('ROOM LIVE · '"
WIRE = "(kind==='HOLD'||kind==='REJECT'||kind==='RESET'||kind==='RELOAD'||kind==='START'||kind==='TIME'||kind==='COLD')&&!state.linkMute"
SCORE = "  if(row.verb==='SCORE'){\n"
CUE = "if(d.up&&d.lifePct>0&&!R.cued&&(state.clock-(R.upT==null?R.t0:R.upT))>=capCueS()) capCue(R,d);"
CTIME = "    if(capIntroDrill()==='stay'&&R.go==='run'){ R.go='done'; const ms=Math.round((state.clock-R.t0)*1000); R.ms=ms; const c=capIntroRows(R); decide('CTIME','LAWN',{mode:'stay',seat:'A1',ms:ms,hits:c.hits,misses:c.misses,rounds:(c.hits|0)+(c.misses|0)});"
CSTART = "decide('CSTART','LAWN',{why:'BUTTON',mode:capIntroDrill(),seat:'A1',targets:1});"
MARKS = "function marksPersist(){ return (chNum()===0||(typeof capIntro==='function'&&capIntro()))&&!(state.lobby&&state.lobby.phase==='LIVE'); }"
APPR = "  if(state.lobby&&state.lobby.phase==='LIVE'&&!byPeer){ /* r.135: in a room the AI's mark is approved by the OTHER seat"
WAPPR = "  if(live&&(!member||by===d.by)){ decide('HOLD',id,{reason:'TWO_HUMANS',designatedBy:d.by,approvedBy:by});"
SEAT = "markerSeat!==SID&&state.lobby&&state.lobby.phase==='LIVE'){ decide('REJECT',state.desig.id,{reason:'NOT_THE_MARKERS_SEAT'});"
SDEF = "  const s=(state.desig&&{n:n||state.slot||1,ref:state.desig.ref,kind:state.desig.kind,id:state.desig.id})||null; /* r.148:"
for need in [TAIL, ROWANCHOR, SNAP, DOOR, WIRE, SCORE, CUE, CTIME, CSTART, MARKS, APPR, WAPPR, SEAT, SDEF, "function lobbyEnterLive(data){", "function lobbyLaunchSnapshot(){", "function capIntroTick(dt){", "function capCueHold(sh){"]:
    if s.count(need) != 1: raise SystemExit('REFUSE: the r.227 base does not carry exactly one of: ' + need[:70])
for dead in ['capLawnCrew', 'capLawnWrites', 'capLawnHi', 'capLawnPeer', 'TWO_HI_ONE_SYSTEM', 'ALREADY_DOWN', 'data.lawn===true', 'Math.max(state.evSeq||0,+pay.evSeq||0)', 'qa:!!state.qaArmed']:
    if dead in s: raise SystemExit('REFUSE: r.228 is already in the base: ' + dead)

# === the head ================================================================================================
rep("<span>r0.227</span>", "<span>r0.228</span>")
rep("revision:'0.227'", "revision:'0.228'")

# === the embedded R-CORE record moves on one row (lag exactly one, deck-rcore): through 106 -> 107 ============
LEDGER = json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku|Fable|Mythos)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
THROUGH = 108
if DEV and len(LEDGER['entries']) < THROUGH: THROUGH = len(LEDGER['entries'])
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
if not DEV and not re.match(r'^[0-9a-f]{7,40}$', str(LEDGER['entries'][106].get('shipped', ''))): raise SystemExit('REFUSE: rev 107 (r.227) has no ship commit yet: ' + str(LEDGER['entries'][106].get('shipped')))
if not DEV and not (len(LEDGER['entries']) >= 108 and LEDGER['entries'][107].get('kind') == 'correction'): raise SystemExit('REFUSE: rev 108 must be the correction of revs 104/106/107 (appended before the cut)')
_e = []
for e in LEDGER['entries'][:THROUGH]:
    o = {'rev': e['rev'], 'date': e['date'], 'kind': e['kind'], 'text': MODEL.sub('an external model', e.get('text', '')), 'commit': e.get('commit', '')}
    if 'shipped' in e: o['shipped'] = e['shipped']
    _e.append(o)
BLOCK = json.dumps({'section': LEDGER['section'], 'route': LEDGER['route'], 'through': THROUGH, 'entries': _e}, ensure_ascii=False, separators=(',', ':'))
for bad in ['</script', '<!--', '-->', '\u00a0', '\u202f']:
    if bad in BLOCK: raise SystemExit('REFUSE: the ledger block carries %r' % bad)
_old = re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/', s)
if not _old: raise SystemExit('REFUSE: the embedded ledger block was not found')
if not DEV and json.loads(_old.group(1)).get('through') != 106: raise SystemExit('REFUSE: expected the r.227 base to embed through 106')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]

# === M1 · the lawn door: the CH1 LAWN chip's own word, carried by the launch snapshot; the old seat untouched ======
rep(SNAP, "    preLaunchHash:replayHash(),\n    lawn:(+state._selCh===1)   /* r.228 (H02): the CH1 LAWN chip's own word — the room opens on the lawn; a snapshot without it lands where it always did */\n  };")
rep(DOOR, "  if(state.challenge===0&&typeof goRange==='function')goRange();\n  if(data.lawn===true&&typeof pickScenario==='function') pickScenario('capital'); /* r.228 (H02): both phones on one lawn system, A1, one air track — the one door r.208/r.219 built; LIVE stays */\n  rcoreStep('REALITY');\n  toast('ROOM LIVE · '")
rep("  toast('ROOM LIVE · '+data.match+'v'+data.match+' · '+state.lobby.team);", "  toast(data.lawn===true?'ROOM LIVE · TWO HI · ONE SYSTEM':('ROOM LIVE · '+data.match+'v'+data.match+' · '+state.lobby.team)); /* r.228 (H02): a one-system room names what it is, not a side (Christo, the fourth round) */")

# === M2 · the four lawn verbs on the wire, applied by the peer; the host's clock writes CUE and CTIME =============
rep(WIRE, "(kind==='HOLD'||kind==='REJECT'||kind==='RESET'||kind==='RELOAD'||kind==='START'||kind==='TIME'||kind==='COLD'||kind==='CSTART'||kind==='CTIME'||kind==='CRESET'||kind==='CUE')&&!state.linkMute")
rep(SCORE, "  if(/^(CSTART|CTIME|CRESET|CUE)$/.test(String(row.verb||''))&&row.peerId&&row.peerId!==SID&&typeof capLawnPeer==='function'&&typeof capIntro==='function'&&capIntro()){ capLawnPeer(row); } /* r.228 (H02): the lawn's rows reach the other HI on the same system (one clock per room: the host's CUE and CTIME) */\n" + SCORE)
rep(CUE, "if(d.up&&d.lifePct>0&&!R.cued&&(state.clock-(R.upT==null?R.t0:R.upT))>=capCueS()&&capLawnWrites()) capCue(R,d);")
rep(CTIME, "    if(capIntroDrill()==='stay'&&R.go==='run'&&capLawnWrites()){ R.go='done'; const ms=Math.round((state.clock-R.t0)*1000); R.ms=ms; const c=capIntroRows(R); decide('CTIME','LAWN',{mode:'stay',seat:'A1',ms:ms,hits:c.hits,misses:c.misses,rounds:(c.hits|0)+(c.misses|0),system:'A1',hi:capLawnHi()});")
rep(CSTART, "decide('CSTART','LAWN',{why:'BUTTON',mode:capIntroDrill(),seat:'A1',targets:1,system:'A1',hi:capLawnHi()}); /* r.228: the record names both HI */")

# === M3 · either HI's press is accepted on the lawn (the Range room untouched) ==================================
rep(MARKS, "function marksPersist(){ return (typeof capIntro==='function'&&capIntro()&&(!(state.lobby&&state.lobby.phase==='LIVE')||capLawnCrew()))||(chNum()===0&&!(state.lobby&&state.lobby.phase==='LIVE')); } /* r.228 (H02): on the lawn the bullseye reading holds in a room too — two HI on one system act on one mark */")
rep(APPR, "  if(state.lobby&&state.lobby.phase==='LIVE'&&!byPeer&&!capLawnCrew()){ /* r.228 (H02): on the lawn one system carries two HI and a press from either is accepted — the pilot may approve the gunner's mark and his own */ /* r.135: in a room the AI's mark is approved by the OTHER seat")
rep(WAPPR, "  if(live&&(!member||(by===d.by&&!capLawnCrew()))){ decide('HOLD',id,{reason:'TWO_HUMANS',designatedBy:d.by,approvedBy:by});")
rep(SEAT, "markerSeat!==SID&&state.lobby&&state.lobby.phase==='LIVE'&&!capLawnCrew()){ decide('REJECT',state.desig.id,{reason:'NOT_THE_MARKERS_SEAT'});")

# === M4 · a second FIRE on the same mark is refused (the track the other HI took is down; no round) ==============
rep(SDEF, "  if(capLawnCrew()&&typeof capIntroTrack==='function'){ const dT=capIntroTrack(); if(dT&&dT.lifePct<=0&&(!state.desig||state.desig.id===dT.id)){ decide('REJECT',dT.id,{reason:'ALREADY_DOWN'}); if(state.desig&&state.desig.id===dT.id&&typeof dropMark==='function') dropMark(dT.id,'ALREADY DOWN'); const h=(state.events||[]).slice().reverse().find(e=>e&&e.verb==='HIT'&&e.id===dT.id&&!e.qa); toast('ALREADY DOWN · '+((h&&h.peerId&&h.peerId!==SID)?'THE OTHER HI TOOK IT':'YOU TOOK IT')); return; } } /* r.228 (H02): a second FIRE on the same mark is refused — the one track is struck; no round leaves, the row says why */\n" + SDEF)

# === M4b · the room's snapshot never rewinds this phone's own event counter (the play's finding) =================
#  Measured on every deck since r.219 (the real e2e red on r.219/r.221/r.223/r.226, green on r.216/r.218): the SNAPSHOT
#  handler set state.evSeq to the host's counter; eventIds are per phone (SID-E<n>), so the joiner's next row reused an id
#  the host already held and was dropped as a duplicate — its READY never landed (ROOM HOLD · WAIT BOTH READY), and no
#  room could launch. The counter is monotonic per phone from here.
SNAPSEQ = "    if(pay.evSeq!=null)state.evSeq=pay.evSeq;"
if s.count(SNAPSEQ) != 1: raise SystemExit('REFUSE: the snapshot evSeq line is not unique')
rep(SNAPSEQ, "    if(pay.evSeq!=null)state.evSeq=Math.max(state.evSeq||0,+pay.evSeq||0); /* r.228: a peer's snapshot never rewinds THIS phone's counter — eventIds are per phone, and a rewound counter reused an id the host already held (every room since r.219 stalled at READY) */")

# === M4c · a phone's self-check never drives another phone's world (the Range room's play finding) ==================
#  With the counter fixed the real e2e reached the Range room and found the next latent fault: the joiner's SNAPSHOT replays
#  the host's whole history through applyWorld — the host's boot self-check START(stay)/TIME/RESET rows included — so the
#  joiner's lane stood armed in TRAIN DOWN (every plate down) and the joiner's APPROVE was refused TARGET_DOWN. Every row
#  the self-check writes is stamped qa:true (ev, FREE); a peer's qa row is kept on the record (one hash on both phones)
#  but never applied to this phone's world (applyWorld, FREE). The room's own LOBBY_* rows are never qa rows.
EVROW = "  let row={eventId:SID+'-E'+state.evSeq,seq:state.evSeq,logicalClock,t:+state.clock.toFixed(2),"
AWHEAD = "function applyWorld(row){\n  if(!row) return;\n  const id=row.id, data=row.data||{};"
for need in [EVROW, AWHEAD]:
    if s.count(need) != 1: raise SystemExit('REFUSE: the r.227 base does not carry exactly one of: ' + need[:60])
rep(EVROW, "  let row={eventId:SID+'-E'+state.evSeq,seq:state.evSeq,logicalClock,t:+state.clock.toFixed(2),qa:!!state.qaArmed, /* r.228: a self-check row says so, and no peer applies it to its world */")
rep(AWHEAD, "function applyWorld(row){\n  if(!row) return;\n  if(row.qa&&row.peerId&&row.peerId!==SID&&!/^LOBBY_/.test(String(row.verb||''))) return; /* r.228: another phone's self-check row stays on the record (one hash) and drives nothing here — the joiner's lane was armed in TRAIN DOWN by the host's boot rows (the real e2e, once the room could launch) */\n  const id=row.id, data=row.data||{};")

# === M7 · the glass speaks the lawn's rule where the press acts (the twelve's first round: Aset, Christo, Sofia; Asar) =====
#  The two predicates the lit button and the recital read (approveWorksHere / fireWorksHere, FREE) still carried the Range's
#  LIVE rule, so the joiner's FIRE was dark under "THE OTHER SEAT FIRES" and then struck — r.207's law broken on the row's
#  own press. The predicates and the four Range-rule toast tails learn the lawn crew; a partner's HIT on the track sets
#  this phone's lastShot so both recitals read LAST · UAV-1 · DOWN.
AWH = "if(!(state.lobby&&state.lobby.phase==='LIVE')) return true; return !!(d.by&&d.by!==SID&&state.lobby.members&&state.lobby.members[d.by]); }"
FWH = "return !(d.how&&/^PEER/.test(String(d.how))&&markerSeat&&markerSeat!==SID&&state.lobby&&state.lobby.phase==='LIVE'); }"
T1 = "(byPeer?' · THE OTHER SEAT FIRES':' · NOW PRESS FIRE'),state.desig.id);"
T2 = "(state.lobby&&state.lobby.phase==='LIVE'?'AMBER · THE OTHER SEAT MUST APPROVE':'AMBER · PRESS APPROVE FIRST')"
T3 = "(state.lobby&&state.lobby.phase==='LIVE'?' · WAIT FOR THE OTHER SEAT TO APPROVE':"
T4 = "if(/^PEER/.test(how)) toast('THE OTHER SEAT MARKED IT · '+(red?'THE OTHER SEAT FIRES':'PRESS APPROVE'));"
FX = "if(!o.form&&row.peerId&&row.peerId!==SID&&/^HIT/.test(res)) state.fx={t:state.clock,id,direct:true,ref:o,w:performance.now()};"
for need in [AWH, FWH, T1, T2, T3, T4, FX]:
    if s.count(need) != 1: raise SystemExit('REFUSE: the r.227 base does not carry exactly one of: ' + need[:60])
rep(AWH, "if(!(state.lobby&&state.lobby.phase==='LIVE')||capLawnCrew()) return true; return !!(d.by&&d.by!==SID&&state.lobby.members&&state.lobby.members[d.by]); } /* r.228: on the lawn either HI approves — the lit button and the recital say so */")
rep(FWH, "return !(d.how&&/^PEER/.test(String(d.how))&&markerSeat&&markerSeat!==SID&&state.lobby&&state.lobby.phase==='LIVE'&&!capLawnCrew()); } /* r.228: on the lawn either HI fires */")
rep(T1, "((byPeer&&!capLawnCrew())?' · THE OTHER SEAT FIRES':' · NOW PRESS FIRE'),state.desig.id);")
rep(T2, "((state.lobby&&state.lobby.phase==='LIVE'&&!capLawnCrew())?'AMBER · THE OTHER SEAT MUST APPROVE':'AMBER · PRESS APPROVE FIRST')")
rep(T3, "((state.lobby&&state.lobby.phase==='LIVE'&&!capLawnCrew())?' · WAIT FOR THE OTHER SEAT TO APPROVE':")
rep(T4, "if(by&&by!==SID&&!/^ASM@/.test(by)) toast(capLawnCrew()?('THE OTHER HI MARKED IT · '+(red?'PRESS FIRE':'PRESS APPROVE')):('THE OTHER SEAT MARKED IT · '+(red?'THE OTHER SEAT FIRES':'PRESS APPROVE')));")
rep(FX, "if(!o.form&&row.peerId&&row.peerId!==SID&&/^HIT/.test(res)){ state.fx={t:state.clock,id,direct:true,ref:o,w:performance.now()}; if(typeof capLawnCrew==='function'&&capLawnCrew()&&o===capIntroTrack()) state.lastShot={id,slot:1,life:0,direct:true,dead:true,by:row.peerId}; } /* r.228: in a lawn room a partner's hit on the track is this phone's LAST too (Asar); the old capitol seat untouched (Thor) */")

# === M8 · the twelve's second round (Christo + Sofia; Enki) ======================================================
HEAD = "(aiMark?'YOU APPROVED THE AI\\'S MARK':state.desig.sameDevice?'APPROVED BY YOU':'APPROVED BY THE OTHER SEAT')"
LATE = "    return; }\n  if(!d.up&&capIntroDrill()==='bounce'&&R.hitT!=null&&(state.clock-R.hitT)>=RETURN_S)"
for need in [HEAD, LATE]:
    if s.count(need) != 1: raise SystemExit('REFUSE: the r.227 base does not carry exactly one of: ' + need[:60])
rep(HEAD, "(aiMark?'YOU APPROVED THE AI\\'S MARK':(state.desig.sameDevice||capLawnCrew())?'APPROVED BY YOU':'APPROVED BY THE OTHER SEAT')")
rep(LATE, "    return; }\n  if(capIntroDrill()==='stay'&&R.go==='run'&&R.hitT!=null&&capLawnWrites()){ R.go='done'; const ms=Math.round((R.hitT-R.t0)*1000); R.ms=ms; const c=capIntroRows(R); decide('CTIME','LAWN',{mode:'stay',seat:'A1',ms:ms,hits:c.hits,misses:c.misses,rounds:(c.hits|0)+(c.misses|0),system:'A1',hi:capLawnHi()}); state.capLast={hits:c.hits|0,misses:c.misses|0,rounds:(c.hits|0)+(c.misses|0),ms:ms}; toast('ALL DOWN · '+capClockWord(ms/1000)); return; } /* r.228: the HI left alone closes a run whose hit landed before the loss was detected — the time is the hit's (Enki, the second round) */\n  if(!d.up&&capIntroDrill()==='bounce'&&R.hitT!=null&&(state.clock-R.hitT)>=RETURN_S)")

# === M9 · the twelve's third round (Aset + Sofia): one system has no other seat ==================================
APPR = "'RED BOX · '+plateWord(id)+' · APPROVED BY THE OTHER SEAT · NOW PRESS FIRE'"
RELAY = "toast('THE OTHER SEAT · '+k+(id&&id!=='NONE'?' '+plateWord(id):'')"
SEATW = "return (state.desig&&state.desig.by===by&&state.desig.viaAI)?'THE OTHER SEAT\\'S AI':'THE OTHER SEAT'; }"
RELOADT = "toast('THE OTHER SEAT RELOADED · MAG '"
WITHDREW = "toast('THE OTHER SEAT WITHDREW · YOUR RED BOX IS AMBER AGAIN')"
NOBODY = "toast('THE OTHER SEAT REPORTED A HIT ON A TARGET NOBODY APPROVED · IGNORED')"
if s.count(APPR) != 2: raise SystemExit('REFUSE: expected two APPROVED BY THE OTHER SEAT messages, found %d' % s.count(APPR))
for need in [RELAY, SEATW, RELOADT, WITHDREW, NOBODY]:
    if s.count(need) != 1: raise SystemExit('REFUSE: the r.227 base does not carry exactly one of: ' + need[:60])
rep(APPR, "'RED BOX · '+plateWord(id)+' · APPROVED BY '+seatName()+' · NOW PRESS FIRE'", 2)
rep(RELAY, "toast(seatName()+' · '+k+(id&&id!=='NONE'?' '+plateWord(id):'')")
rep(SEATW, "return (state.desig&&state.desig.by===by&&state.desig.viaAI)?(seatName()+'\\'S AI'):seatName(); }")
rep(RELOADT, "toast(seatName()+' RELOADED · MAG '")
rep(WITHDREW, "toast(seatName()+' WITHDREW · YOUR RED BOX IS AMBER AGAIN')")
rep(NOBODY, "toast(seatName()+' REPORTED A HIT ON A TARGET NOBODY APPROVED · IGNORED')")

# === M5 · the helpers (append zone; hoisted functions) ========================================================
HELP = r"""(function(){ try{ var q=new URLSearchParams(location.search||''); if(q.get('map')&&!q.get('range')) openMapLink(q.get('map')); }catch(e){ try{ log('LAWN','LINK',String(e).slice(0,80)); }catch(_){ } } })();

/* ===================================================================================================================
   r.228 — H02: TWO HI ON ONE SYSTEM (operator 2026-10-21: "Two HI, one system, one partner. The pilot and the gunner. A
   press from either is accepted. A second FIRE on the same mark is refused. The record names both." — CRS-CL.H02: HI 2 ·
   systems 1 · partners 1 · scene H01.S). INVARIANT: two phones in one room sit on one lawn system (A1) and one air
   track; TARGET, APPROVE and FIRE from either phone are accepted and land on the same mark; a FIRE on a track the other
   HI already took is refused (ALREADY_DOWN) and spends nothing; one record on both phones names both HI (the hi field
   of CSTART and CTIME; every HIT, MISS, APPROVE and DESIGNATED row already carries its phone). The door is the CH1 LAWN
   chip's own word (lawn:true in the launch snapshot); a snapshot without it lands where it always did — the old capitol
   two-phone seat is untouched. One clock per room (r.197's law): the host's tick writes CUE and CTIME; the joiner plays
   the fall and reads the host's rows. Pilot and gunner are not named in rows (the lawn turret has no one flying — the
   control law is a later row); the magazine stays per phone (magSpend is frozen; r.138). The two-FIRE race inside one
   wire latency is named, not fixed.
   =================================================================================================================== */
function capLawnCrew(){ return typeof capIntro==='function'&&capIntro()&&!!(state.lobby&&state.lobby.phase==='LIVE'&&state.lobby.launch&&state.lobby.launch.lawn===true); }   /* a lawn room: one system, two HI — keyed on the room's door (launch.lawn), never on this phone's scenery (Thor) */
function capLawnWrites(){ return !capLawnCrew()||!!(state.lobby&&state.lobby.host)||!!(state.com&&state.com.path==='DROPPED'); }   /* outside a lawn crew a phone keeps its own clock (r.227); in the crew the host's clock writes CUE and CTIME, or the HI left alone (Enki, Krishna) */
function seatName(){ return (typeof capLawnCrew==='function'&&capLawnCrew())?'THE OTHER HI':'THE OTHER SEAT'; }   /* one system has no other seat (Aset, Sofia) */
function capLawnHi(){ const lb=state.lobby; if(lb&&lb.phase==='LIVE'&&lb.members){ const m=Object.keys(lb.members).filter(Boolean).sort(); if(m.length) return m; } return [SID]; }
function capLawnPeer(row){ const d=capIntroTrack(), data=row.data||{}; if(!d) return;
  if(row.verb==='CRESET'){ state.capDrill=data.mode==='stay'?'stay':'bounce'; capIntroReset(data.why==='BUTTON'?'RESTART':'PEER MODE'); const rm=document.getElementById('rngMode'); if(rm) rm.value=capIntroDrill(); toast('THE OTHER HI · '+(data.why==='BUTTON'?'RESTART':RANGE_MODE_NAME[capIntroDrill()])); return; }
  if(row.verb==='CSTART'){ state.capDrill=data.mode==='stay'?'stay':'bounce'; capIntroReset('START'); d.up=true; const R=state.capRun; R.go='run'; R.t0=state.clock; R.e0=(state.events||[]).length; R.cued=false; R.upT=state.clock; toast('THE OTHER HI STARTED · ONE TRACK · 1800'); return; }
  const R=state.capRun; if(!R) return;
  if(row.verb==='CUE'){ R.cued=true; R.cueT=state.clock; toast('SENTINEL · 1800 · ONE TRACK'); return; }
  if(row.verb==='CTIME'){ const ms=+data.ms||0; R.go='done'; R.ms=ms; if(d.up){ d.fall=1; d.y=1; d.up=false; if(typeof dropMark==='function') dropMark(d.id,'DOWN'); } if(R.hitT==null) R.hitT=state.clock; /* the fall ends with the host's row, never frozen mid-air (Krishna) */ state.capLast={hits:data.hits|0,misses:data.misses|0,rounds:data.rounds|0,ms:ms}; toast('ALL DOWN · '+capClockWord(ms/1000)); return; } }

</script>"""
rep(TAIL, HELP)

# === M6 · the boot-QA row ======================================================================================
ROW = r"""  /* r.228 · two HI on one system (operator 2026-10-21: "Two HI, one system, one partner. The pilot and the gunner. A press
     from either is accepted. A second FIRE on the same mark is refused. The record names both."). Red on the r.227 bytes: the
     launch snapshot has no lawn door, the lawn verbs are not on the wire, a self-approve in a LIVE room holds TWO_HUMANS and the
     CSTART row names one HI. Green on the cut: in a LIVE lawn room of two members the snapshot carries lawn:true and the door is
     in lobbyEnterLive; the four verbs are on the wire; my own mark, my own approve: red; the other HI's fresh mark, approved by
     that HI over the wire: red; FIRE from the seat that did not mark it: a hit, one round; a second FIRE on the struck track:
     REJECT ALREADY_DOWN, the magazine unchanged; CSTART and CTIME name both HI. Same snapshot and restore as the lawn rows. */
  setTimeout(()=>{ const _s0=state._qaSilent; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='TWO_HI_ONE_SYSTEM')) return;
    const snap=rangeSnap(); const q0=state.qaArmed; const sd0=state.simDirect; const sc0=state._selCh;
    const lb0=state.lobby?{phase:state.lobby.phase,host:state.lobby.host,members:state.lobby.members,launch:state.lobby.launch}:null;
    const cpSave=state.com?state.com.path:undefined;
    const sv=Object.keys(units).filter(id=>units[id]&&units[id].kind==='turret').map(id=>[id,units[id].x,units[id].y,units[id].z,units[id].yaw,units[id].pan,units[id].tilt,units[id].label]);
    const pops0=pops.map(p=>p.up); const dr0=drones.map(d=>({up:d.up,x:d.x,y:d.y,z:d.z,life:d.life,lifePct:d.lifePct,fall:d.fall,vx:d.vx,vz:d.vz,mist:d.mist}));
    const cl0=state.clock, tk0=state.tick, mg0=state.mag?Object.assign({},state.mag):null; const intro=document.getElementById('intro'); const in0=intro?intro.style.display:null;
    let ok=false, note='';
    try{ state.qaArmed=true; state._qaSilent=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.simDirect=true;
      const dec=()=>state.decisions||[];
      if(!state.lobby) state.lobby={}; state.lobby.phase='LIVE'; state.lobby.host=true;
      state.lobby.members={[SID]:{peerId:SID,team:'BLU',ready:true,auth:true},'peer-B':{peerId:'peer-B',team:'BLU',ready:true,auth:true}};
      state._selCh=1; const snapL=lobbyLaunchSnapshot(); const doorInSnap=snapL.lawn===true; state._selCh=sc0; state.lobby.launch={lawn:true,match:1};
      const door=/data\.lawn===true/.test(String(lobbyEnterLive)); const wire=/kind==='CSTART'\|\|kind==='CTIME'\|\|kind==='CRESET'\|\|kind==='CUE'/.test(String(decide));
      pickScenario('capital'); const onLawn=capIntro()&&chNum()===1&&state.unit===capIntroSeat()&&state.lobby.phase==='LIVE'&&marksPersist()&&capLawnCrew();
      const d=capIntroTrack(), u=units[state.unit];
      state.capDrill='stay'; capIntroReset('QA'); const k0=dec().length, mg=state.mag?(state.mag.rounds|0):-1;
      capIntroStart(); const CS=dec().slice(k0).find(r=>r.kind==='CSTART'); const names=!!CS&&Array.isArray(CS.hi)&&CS.hi.length===2&&CS.hi.includes(SID)&&CS.hi.includes('peer-B')&&CS.system==='A1';
      const aim=()=>{ aimUnitAt(u,d,-40,40); state.aimRef=d; paintCues(); };
      aim(); markLock(lockOn(),'BTN'); const amber=!!(state.desig&&state.desig.phase==='amber'&&state.desig.id===d.id);
      approveDesig('HI-2'); const selfRed=!!(state.desig&&state.desig.phase==='red'&&state.desig.id===d.id)&&!dec().slice(k0).some(r=>r.reason==='TWO_HUMANS');   /* my mark, my approve: accepted on the lawn */
      dropMark(d.id,'QA'); const pd=peerDesig(d.id,'peer-B',1,'uav'); const wa=wireApprove(d.id,'peer-B',true);                                              /* the other HI's mark, approved by that HI */
      const peerRed=!!(pd&&pd.accepted&&wa&&wa.accepted&&state.desig&&state.desig.phase==='red'&&state.desig.by==='peer-B');
      for(let i=0;i<60;i++){ state.clock+=0.05; capIntroTick(0.05); } const cued=!!(state.capRun&&state.capRun.cued);                                  /* the Sentinel names it (the host writes) */
      fireN(state.desig&&state.desig.slot||1); const struck=d.lifePct<=0; const mg1=state.mag?(state.mag.rounds|0):-1;                                     /* FIRE from the seat that did not mark it */
      const k1=dec().length; fireN(1); const rej=dec().slice(k1).find(r=>r.kind==='REJECT'&&r.reason==='ALREADY_DOWN'); const mg2=state.mag?(state.mag.rounds|0):-1; const second=!!rej&&mg2===mg1;
      for(let i=0;i<60;i++){ state.clock+=0.05; capIntroTick(0.05); }                                                                                      /* the fall completes, CTIME is written */
      const CT=dec().slice(k0).find(r=>r.kind==='CTIME'); const ctNames=!!CT&&Array.isArray(CT.hi)&&CT.hi.length===2&&CT.system==='A1';
      /* the HI left alone (the second round, Enki): as the joiner — no clock of its own — a hit lands, the fall ends, the run stays open; the link drops; the next tick closes it with the hit's own time */
      const cp0=state.com?state.com.path:null; state.lobby.host=false; if(state.com) state.com.path='DIRECT'; capIntroReset('QA'); capIntroStart(); const R2=state.capRun; R2.cued=true;
      aim(); markLock(lockOn(),'BTN'); approveDesig('HI-2'); fireN(state.desig&&state.desig.slot||1); for(let i=0;i<30;i++){ state.clock+=0.05; capIntroTick(0.05); }
      const openAfterHit=R2.go==='run'&&R2.hitT!=null; const k2=dec().length; if(state.com) state.com.path='DROPPED'; state.clock+=0.05; capIntroTick(0.05);
      const CT2=dec().slice(k2).find(r=>r.kind==='CTIME'); const lateClose=openAfterHit&&R2.go==='done'&&!!CT2&&Math.abs((CT2.ms|0)-Math.round((R2.hitT-R2.t0)*1000))<=1; if(state.com) state.com.path=cp0; state.lobby.host=true;
      ok = doorInSnap&&door&&wire&&onLawn&&names&&amber&&selfRed&&peerRed&&cued&&struck&&(mg<0||mg-mg1===1)&&second&&ctNames&&lateClose;
      note = 'door in the snapshot '+doorInSnap+' · in lobbyEnterLive '+door+' · the four verbs on the wire '+wire+' · both on the lawn in LIVE '+onLawn+' · CSTART names both '+names+' · my mark amber '+amber+' · my own approve red (no TWO_HUMANS) '+selfRed+' · the other HI\'s mark approved by that HI '+peerRed+' · cued '+cued+' · FIRE from the other seat struck it '+struck+' (rounds '+mg+'→'+mg1+') · a second FIRE refused ALREADY_DOWN, no round '+second+' ('+mg1+'→'+mg2+') · CTIME names both '+ctNames+' · the HI left alone closes the run with the hit\'s own time '+lateClose;
    }catch(e){ note='threw '+String(e).slice(0,100); }
    finally { try{ pickScenario('range'); }catch(_){ } state.capStep=null; state.capRun=null; state.capDrill=null; state.capLast=null; if(intro) intro.style.display=in0; state.simDirect=sd0; state._selCh=sc0; sv.forEach(a=>{ const t=units[a[0]]; if(t){ t.x=a[1];t.y=a[2];t.z=a[3];t.yaw=a[4];t.pan=a[5];t.tilt=a[6];t.label=a[7]; } }); pops.forEach((p,i)=>{ p.up=pops0[i]; }); drones.forEach((dd,i)=>Object.assign(dd,dr0[i])); state.challenge=snap.challenge; state.rangeMode=snap.rangeMode; state.lane=snap.lane; state.zoom=snap.zoom; state.phase=snap.phase; state.hits=snap.hits; state.passed=snap.passed; state.unit=snap.unit; state.mode=snap.mode; state.viewMode=snap.view; state.clock=cl0; state.tick=tk0; if(mg0) state.mag=mg0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.aimRef=null; if(state.lobby&&lb0){ state.lobby.phase=lb0.phase; state.lobby.host=lb0.host; state.lobby.members=lb0.members; state.lobby.launch=lb0.launch; } if(state.com&&cpSave!==undefined) state.com.path=cpSave; state.qaArmed=q0; state._qaSilent=_s0; rangeReset(); }
    rows.push({id:'TWO_HI_ONE_SYSTEM',ok,note});
  }catch(e){ state._qaSilent=_s0; if(!rows.some(x=>x.id==='TWO_HI_ONE_SYSTEM')) rows.push({id:'TWO_HI_ONE_SYSTEM',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1850); /* after the r.227 row (1835) */
"""
rep(ROWANCHOR, ROW + ROWANCHOR)

# === the invariants ==========================================================================================
if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')
for must in ['function capLawnCrew(', 'function capLawnWrites(', 'function capLawnHi(', 'function capLawnPeer(', "rows.push({id:'TWO_HI_ONE_SYSTEM',ok,note})", "lawn:(+state._selCh===1)", "data.lawn===true&&typeof pickScenario==='function'", "reason:'ALREADY_DOWN'", 'state.evSeq=Math.max(state.evSeq||0,+pay.evSeq||0)', 'qa:!!state.qaArmed,', "if(row.qa&&row.peerId&&row.peerId!==SID", "||capLawnCrew()) return true; return !!(d.by", "state.lobby.launch.lawn===true); }", "(state.desig.sameDevice||capLawnCrew())?'APPROVED BY YOU'", "the HI left alone closes a run", 'function seatName(', "'YOU TOOK IT'", 'function trainingOnTheRecord(', 'function openMapLink(', 'function capStripText(', 'function rangeDroneTick(', 'function foilDraw(']:
    if s.count(must) != 1: raise SystemExit('REFUSE: expected exactly one %r' % must)
if s.count("'TWO_HI_ONE_SYSTEM'") != 4: raise SystemExit('REFUSE: the row id must appear exactly four times')
if s.count("if(q&&q.get('range')) enterTheRange(parseInt(q.get('range'),10)||21, q.get('mode')||'train-up'); /* r.187: the QR link opens its lane */") != 1: raise SystemExit('REFUSE: the ?range= reader moved')
if "if(+state.challenge===0) rangeTick(" not in s: raise SystemExit('REFUSE: the frozen range tick call moved')
if "QUAL 40 IS TRAINING · ON THE RANGE" not in s: raise SystemExit('REFUSE: the lawn QUAL 40 refusal was removed')
if not re.search(r"reason:'TWO_HUMANS'", s) or not re.search(r"state\.lobby\.phase==='LIVE'&&!byPeer", s): raise SystemExit('REFUSE: the r.129 two-humans pins would break')
if s.count("rangeDroneTick(") < 2: raise SystemExit('REFUSE: the Range drone tick moved')
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit('REFUSE: script #%d does not parse: %s' % (i, r.stderr[:300]))

OUT = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(OUT, 'w', encoding='utf-8').write(s)
print('OK r.%s -> r.%s · %d bytes · sha256 %s' % (BASE_REV, NEW_REV, len(s.encode('utf-8')), hashlib.sha256(s.encode('utf-8')).hexdigest()[:16]))

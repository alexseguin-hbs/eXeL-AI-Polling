# r.226 -> r.227 — H01: THE LINK OPENS THE LAWN ONLY ON A TRAINING RECORD (operator 2026-10-21, the night brief)
#  "r.227 · H01. ?map=capital opens the lawn on Train Up only when Training's three drills are on the record. An empty
#  record refuses. One player, one air track, A1 only." And the doctrine behind it (CRS-CL.10, the brief's closed
#  list): "A link, a menu, or a query string cannot open a step whose line above is empty."
#  r.209 taught the share sheet to write ?map=capital&station=…; nothing read it (the only reader is ?range=, inside the
#  arcade() IIFE in enterTheRange's frozen span — never edited). r.227 adds the reader in the append zone, AFTER arcade()
#  has consumed ?range= (a QR link to the Range behaves exactly as before), behind ONE predicate over the session's own
#  record: TRAIN UP = a plate HIT row outside every TRAIN DOWN window; TRAIN DOWN = a START row with its TIME row; QUAL 40
#  = a COLD row. All three, or the link refuses with a REJECT row (EMPTY_RECORD, via LINK) and one sentence, and the intro
#  stays. The record dies on a reload, so a link opened fresh refuses — which is the lock's own point. The menu path is
#  not touched here (the next row's business; named). One player, one air track, A1 — the lawn r.219 built.
import hashlib, os, re, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
if not os.path.exists(os.path.join(DECK, 'HASHES_r226.sha256')):
    DECK = os.path.join(ROOT, 'docs', 'drone-2525', 'operator-deck')
BASE_REV = '226'; NEW_REV = '227'
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

TAIL = "  const c=R?capIntroRows(R):{hits:0,misses:0}; return 'HIT '+(c.hits|0)+' · MISS '+(c.misses|0); }\n\n</script>"
ROWANCHOR = "  /* r.226 · the foil drops, it does not vanish (operator 2026-10-21:"
RANGE_READER = "  if(q&&q.get('range')) enterTheRange(parseInt(q.get('range'),10)||21, q.get('mode')||'train-up'); /* r.187: the QR link opens its lane */"
for need in [TAIL, ROWANCHOR, RANGE_READER, "function pickScenario(v){", "function qualFinish(){", "function downStartOnRecord(", "function capIntroEnter(){"]:
    if s.count(need) != 1: raise SystemExit('REFUSE: the r.226 base does not carry exactly one of: ' + need[:70])
for dead in ['trainingOnTheRecord', 'openMapLink', 'THE_LINK_REFUSES_AN_EMPTY_RECORD', "q.get('map')"]:
    if dead in s: raise SystemExit('REFUSE: r.227 is already in the base: ' + dead)

# === the head ================================================================================================
rep("<span>r0.226</span>", "<span>r0.227</span>")
rep("revision:'0.226'", "revision:'0.227'")

# === the embedded R-CORE record moves on one row (lag exactly one, deck-rcore): through 105 -> 106 ============
LEDGER = json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku|Fable|Mythos)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
THROUGH = 106
if DEV and len(LEDGER['entries']) < THROUGH: THROUGH = len(LEDGER['entries'])
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
if not DEV and not re.match(r'^[0-9a-f]{7,40}$', str(LEDGER['entries'][105].get('shipped', ''))): raise SystemExit('REFUSE: rev 106 (r.226) has no ship commit yet: ' + str(LEDGER['entries'][105].get('shipped')))
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
if not DEV and json.loads(_old.group(1)).get('through') != 105: raise SystemExit('REFUSE: expected the r.226 base to embed through 105')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]

# === M1 · the predicate, the door and the reader (append zone; hoisted functions; the reader runs after arcade()) =====
LOCK = r"""  const c=R?capIntroRows(R):{hits:0,misses:0}; return 'HIT '+(c.hits|0)+' · MISS '+(c.misses|0); }

/* ===================================================================================================================
   r.227 — H01: THE LINK OPENS THE LAWN ONLY ON A TRAINING RECORD (operator 2026-10-21: "?map=capital opens the lawn on
   Train Up only when Training's three drills are on the record. An empty record refuses. One player, one air track, A1
   only." — CRS-CL.10: "A link, a menu, or a query string cannot open a step whose line above is empty."). INVARIANT:
   the ?map=capital link (the share sheet's own, r.209) opens the lawn on TRAIN UP only when the session's record holds
   TRAIN UP (a plate HIT row outside every TRAIN DOWN window), TRAIN DOWN (a START row with its TIME row) and QUAL 40
   (a COLD row); otherwise it writes a REJECT row (EMPTY_RECORD, via LINK), says which drills are missing, and leaves
   the intro where it is. The reader runs AFTER arcade() has consumed ?range= (a Range link behaves as before). The
   record dies on a reload, so a link opened fresh refuses — the lock's own point. The menu path is not locked here.
   =================================================================================================================== */
function trainingOnTheRecord(){ const ev=state.events||[], dec=state.decisions||[];
  const wins=[]; dec.forEach(r=>{ if(r&&r.kind==='START'&&r.mode==='stay'&&r.id==='RANGE'){ const T=dec.find(x=>x&&x.kind==='TIME'&&x.mode==='stay'&&x.t>=r.t); if(T) wins.push([r.t,T.t]); } });
  const plateHit=e=>!!e&&e.verb==='HIT'&&/^C-/.test(String(e.id||''));
  const up=ev.some(e=>plateHit(e)&&!wins.some(w=>e.t>=w[0]&&e.t<=w[1]));
  const down=wins.length>0;
  const qual=dec.some(r=>r&&r.kind==='COLD'&&r.mode==='qual40');
  return {up,down,qual,ok:up&&down&&qual}; }
function openMapLink(map){ if(map!=='capital') return false; const T=trainingOnTheRecord();
  if(!T.ok){ decide('REJECT','LAWN',{reason:'EMPTY_RECORD',via:'LINK',up:T.up,down:T.down,qual:T.qual});
    toast('TRAINING FIRST · THE RANGE · '+[T.up?'':'TRAIN UP',T.down?'':'TRAIN DOWN',T.qual?'':'QUAL 40'].filter(Boolean).join(' · ')+' NOT ON THE RECORD'); return false; }
  const intro=document.getElementById('intro'); if(intro) intro.style.display='none';
  if(!(state.lobby&&state.lobby.phase==='LIVE')){ if(!state.lobby) state.lobby={}; state.lobby.phase='PRACTICE'; state.lobby.host=false; }   /* the Range link's own practice line (r.192) */
  state.capDrill='bounce'; pickScenario('capital'); const mp=document.getElementById('modePick'); if(mp) mp.value='capital'; return true; }
(function(){ try{ var q=new URLSearchParams(location.search||''); if(q.get('map')&&!q.get('range')) openMapLink(q.get('map')); }catch(e){ try{ log('LAWN','LINK',String(e).slice(0,80)); }catch(_){ } } })();

</script>"""
rep(TAIL, LOCK)

# === M2 · the boot-QA row ======================================================================================
ROW = r"""  /* r.227 · the link opens the lawn only on a Training record (operator 2026-10-21: "?map=capital opens the lawn on Train
     Up only when Training's three drills are on the record. An empty record refuses."). Red on the r.226 bytes: there is no
     reader and no door. Green on the cut: on an empty record the door refuses, writes REJECT EMPTY_RECORD via LINK and
     opens nothing; with the three drills on the record (TRAIN UP a plate hit outside every TRAIN DOWN window, TRAIN DOWN
     its START and TIME, QUAL 40 its COLD row — made here through the deck's own doors) the door opens the lawn on TRAIN UP,
     one player, one air track, A1. Same snapshot and restore as the lawn rows. */
  setTimeout(()=>{ const _s0=state._qaSilent; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='THE_LINK_REFUSES_AN_EMPTY_RECORD')) return;
    const snap=rangeSnap(); const ph0=state.lobby?state.lobby.phase:null; const q0=state.qaArmed; const sd0=state.simDirect; const qd0=state.qualDone, qs0=state.qualStarted;
    const sv=Object.keys(units).filter(id=>units[id]&&units[id].kind==='turret').map(id=>[id,units[id].x,units[id].y,units[id].z,units[id].yaw,units[id].pan,units[id].tilt,units[id].label]);
    const pops0=pops.map(p=>p.up); const dr0=drones.map(d=>({up:d.up,x:d.x,y:d.y,z:d.z,life:d.life,lifePct:d.lifePct,fall:d.fall,vx:d.vx,vz:d.vz,mist:d.mist}));
    const cl0=state.clock, tk0=state.tick, mg0=state.mag?Object.assign({},state.mag):null; const intro=document.getElementById('intro'); const in0=intro?intro.style.display:null;
    let ok=false, note='';
    try{ state.qaArmed=true; state._qaSilent=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false;
      const dec=()=>state.decisions||[];
      const D0=state.decisions, E0=state.events; state.decisions=[]; state.events=[];                           /* an empty record */
      const r1=openMapLink('capital'); const T1=trainingOnTheRecord(); const rej=dec().find(r=>r.kind==='REJECT'&&r.reason==='EMPTY_RECORD'&&r.via==='LINK'); const stayed=!capIntro()&&state.capStep!=='intro';
      const refused=r1===false&&!T1.ok&&!!rej&&stayed;
      state.decisions=D0; state.events=E0;                                                                      /* the real record back */
      state.simDirect=true; const T2=trainingOnTheRecord();                                                      /* the three drills, through the deck's own doors */
      state.rangeMode='stay'; rangeReset(); downArm(); downStartOnRecord('QA'); platesHere().forEach(q=>{ if(q.up) applyHit(q,q.id); }); for(let i=0;i<40;i++) rangeTick(0.05);
      state.clock+=0.5; state.rangeMode='bounce'; rangeReset(); const p=platesHere().find(q=>q.up); if(p) applyHit(p,p.id);
      state.clock+=0.5; state.rangeMode='qual40'; rangeReset(); state.qualDone=false; qualFinish();
      const T3=trainingOnTheRecord(); state.rangeMode='bounce'; rangeReset();
      const r2=openMapLink('capital'); const opened=r2===true&&capIntro()&&chNum()===1&&capIntroDrill()==='bounce'&&state.unit===capIntroSeat()&&[...pops,...drones,...foils].filter(o=>o.up).length===1;
      ok = refused&&T3.ok&&opened;
      note = 'empty record: refused '+refused+' (REJECT EMPTY_RECORD via LINK '+(!!rej)+', the intro stayed '+stayed+') · before the drills: up '+T2.up+' down '+T2.down+' qual '+T2.qual+' · after the three through the deck\'s doors: up '+T3.up+' down '+T3.down+' qual '+T3.qual+' · the link opens the lawn on TRAIN UP, A1, one track: '+opened;
    }catch(e){ note='threw '+String(e).slice(0,100); }
    finally { try{ pickScenario('range'); }catch(_){ } state.capStep=null; state.capRun=null; state.capDrill=null; state.capLast=null; if(intro) intro.style.display=in0; state.simDirect=sd0; state.qualDone=qd0; state.qualStarted=qs0; sv.forEach(a=>{ const t=units[a[0]]; if(t){ t.x=a[1];t.y=a[2];t.z=a[3];t.yaw=a[4];t.pan=a[5];t.tilt=a[6];t.label=a[7]; } }); pops.forEach((p,i)=>{ p.up=pops0[i]; }); drones.forEach((dd,i)=>Object.assign(dd,dr0[i])); state.challenge=snap.challenge; state.rangeMode=snap.rangeMode; state.lane=snap.lane; state.zoom=snap.zoom; state.phase=snap.phase; state.hits=snap.hits; state.passed=snap.passed; state.unit=snap.unit; state.mode=snap.mode; state.viewMode=snap.view; state.clock=cl0; state.tick=tk0; if(mg0) state.mag=mg0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.aimRef=null; if(state.lobby) state.lobby.phase=ph0; state.qaArmed=q0; state._qaSilent=_s0; rangeReset(); }
    rows.push({id:'THE_LINK_REFUSES_AN_EMPTY_RECORD',ok,note});
  }catch(e){ state._qaSilent=_s0; if(!rows.some(x=>x.id==='THE_LINK_REFUSES_AN_EMPTY_RECORD')) rows.push({id:'THE_LINK_REFUSES_AN_EMPTY_RECORD',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1835); /* after the r.226 row (1820) */
"""
rep(ROWANCHOR, ROW + ROWANCHOR)

# === the invariants ==========================================================================================
if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')
for must in ['function trainingOnTheRecord(', 'function openMapLink(', "rows.push({id:'THE_LINK_REFUSES_AN_EMPTY_RECORD',ok,note})", "q.get('map')&&!q.get('range')", 'function capStripText(', 'function rangeDroneTick(', 'function foilDraw(']:
    if s.count(must) != 1: raise SystemExit('REFUSE: expected exactly one %r' % must)
if s.count("'THE_LINK_REFUSES_AN_EMPTY_RECORD'") != 4: raise SystemExit('REFUSE: the row id must appear exactly four times')
if s.count(RANGE_READER) != 1: raise SystemExit('REFUSE: the ?range= reader moved')
if "if(+state.challenge===0) rangeTick(" not in s: raise SystemExit('REFUSE: the frozen range tick call moved')
if "QUAL 40 IS TRAINING · ON THE RANGE" not in s: raise SystemExit('REFUSE: the lawn QUAL 40 refusal was removed')
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit('REFUSE: script #%d does not parse: %s' % (i, r.stderr[:300]))

OUT = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(OUT, 'w', encoding='utf-8').write(s)
print('OK r.%s -> r.%s · %d bytes · sha256 %s' % (BASE_REV, NEW_REV, len(s.encode('utf-8')), hashlib.sha256(s.encode('utf-8')).hexdigest()[:16]))

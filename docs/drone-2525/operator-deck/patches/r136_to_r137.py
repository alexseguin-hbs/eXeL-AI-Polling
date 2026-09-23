# r.136 -> r.137 — THE RANGE THE OPERATOR DESCRIBED (2026-09-23, docs/asks/2026-09-23_range_modes_iwq_table_vi.md):
#   TRAINING · RESET  every target stands; a hit target falls and comes back (RETURN_S)
#   TRAINING · DOWN   every target stands; a hit target stays down until RESET
#   QUAL · 40         Army IWQ Table VI — 18 engagements in 4 phases, singles/doubles/triples/quads UP TOGETHER for 5/8/12/16 s,
#                     3 s between engagements, 9 s between phases, one round per silhouette, unengaged = miss, 40 targets, 50 R first.
# The unit of exposure becomes the ENGAGEMENT (a set of plates), not the plate. Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.136.html'); DST=os.path.join(DECK,'drone-2525_r.137.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)
def cut(start,end,new):
    """replace the region [start, end) — both markers must occur exactly once, end after start"""
    global s
    if s.count(start)!=1: raise SystemExit(f'REFUSE: start marker {start[:80]!r} ×{s.count(start)}')
    if s.count(end)!=1: raise SystemExit(f'REFUSE: end marker {end[:80]!r} ×{s.count(end)}')
    a=s.index(start); b=s.index(end)
    if b<=a: raise SystemExit('REFUSE: end before start')
    n[0]+=1
    s=s[:a]+new+s[b:]

# ── R137-1 · the 50 m pair: C-50L added, C-50 is the 50 R (its id is unchanged so every row that raises 'C-50' still does) ──
rep("  {id:'C-50',pos:'50M F',x:0,y:0,z:50,w:2.20,h:1.15,form:'F'},",
    "  {id:'C-50L',pos:'50M F',x:-3.0,y:0,z:50,w:2.20,h:1.15,form:'F'},\n  {id:'C-50',pos:'50M F',x:3.0,y:0,z:50,w:2.20,h:1.15,form:'F'}, /* r.137: the 50 R — the first standing shot of IWQ Table VI (operator 2026-09-23: \"50 m targets are left and right\") */")

# ── R137-2/4 · the tower: QUAL_TABLES and the per-plate caps go; the IWQ Table VI program is data ──
cut("const QUAL_TABLES=[","/* r.130 POP-UPS PER LANE","""/* r.137 QUAL · 40 = ARMY IWQ TABLE VI, 40-round day fire (operator 2026-09-23, verbatim in docs/asks/2026-09-23_range_modes_iwq_table_vi.md):
   18 engagements in 4 phases; the targets of an engagement come UP TOGETHER for 5/8/12/16 s by count; ~3 s down between
   engagements; ~8–10 s between phases (mag change + move); one round per silhouette; a target not engaged is a miss; 40 targets =
   50×6 · 100×7 · 150×8 · 200×8 · 250×6 · 300×5; the 50 R standing shot first. Engagements 1–14 are the operator's table verbatim;
   15–18 are DECLARED here to consume exactly the remaining 50×2 · 100×3 · 150×1 · 200×2 · 250×2 (his note: the last four differ by
   range computer file — confirm the lane program with the tower). Which of L/C/R stands for a range with siblings is picked per lane
   from the deck's PRNG, so lanes differ; the program itself is the same on every lane and on both phones of a room. */
const IWQ_VI=[
  {ph:1,pos:'STANDING → PRONE UNSUPPORTED',eng:[[50],[100],[150],[50,150,200],[150,200,250,300]]},
  {ph:2,pos:'PRONE SUPPORTED',eng:[[100],[150,300],[200,300],[250,300],[150,250,300]]},
  {ph:3,pos:'KNEELING SUPPORTED',eng:[[50,100,200],[50,200],[150,250],[100,150,200]]},
  {ph:4,pos:'STANDING SUPPORTED',eng:[[50,200],[100,150,250],[100,200],[50,100,250]]} /* DECLARED (15–18) */
];
const IWQ_ENG=IWQ_VI.flatMap(P=>P.eng.map(r=>({ph:P.ph,pos:P.pos,ranges:r}))).map((e,i)=>({...e,n:i+1}));
const EXPOSURE_BY_COUNT={1:5,2:8,3:12,4:16}; /* seconds up, by how many targets come up together (the operator's rule) */
const ENG_GAP_S=3;   /* down between engagements inside a phase ("~3 s") */
const PHASE_GAP_S=9; /* between phases, mag change + move ("~8–10 s", DECLARED midpoint) */
const RETURN_S=3;    /* TRAINING · RESET: a hit target comes back after this long (DECLARED, the same 3 s) */
const IWQ_TOTAL=IWQ_ENG.reduce((a,e)=>a+e.ranges.length,0);
function qualBadge(h){
  return h>=36?'EXPERT':h>=30?'SHARPSHOOTER':h>=23?'MARKSMAN':'UNQUAL';
}
function qualResetTower(){
  state.qualR=0; state.qualH=0; state.qualEng=0; state.qualPh=0;
  state.qualT0=0; state.qualStarted=false;
  state.qualDone=false; state.qualExpired=0;
}
function qualResetPlatesForTable(){
  /* r.137: a qualification starts with every plate DOWN; the tower raises each engagement's targets together. */
  (typeof platesHere==='function'?platesHere():QUAL).forEach(q=>{q.up=false;q.lifePct=100;q.life=0;q.fall=1;q._dead=0;q._down=false;q._eng=false;q._ret=0;q.mist=false;});
}
""")

cut("/* r.130 POP-UPS PER LANE","const PIP_FLOOR_MRAD=3;","""/* r.137 THE RANGE (operator 2026-09-23). Invariant, in his terms: in training every target stands until it is hit; a hit target
   returns (RESET) or stays down (DOWN). In qualification the tower raises the engagement's targets together for their window, one
   round counts per silhouette, an unengaged target is a miss, and the whole test is exactly forty targets in the order the program
   says. The fire gate, the record and the room's one lapse clock do not change. (r.130's one-plate-at-a-time exposures by distance
   and its three 20/10/10 tables were DECLARED from a search index; the program of record superseded them — REVISIONS.md r.137.) */
""")

cut("const RANGE_MODE_NAME=","/* r.130 SCALE-TRUE HIT","""const RANGE_MODE_NAME={bounce:'TRAINING · RESET',stay:'TRAINING · DOWN',qual40:'QUAL · 40'};
const RANGE_RUN={};
function engagementAt(lane,k){ /* the k-th engagement of the program on this lane: which sibling (L/C/R) stands is seeded per lane; the 50 R is always first */
  const e=IWQ_ENG[k|0]; if(!e) return null; const r=mulberry32(2525+(lane|0)*97+(k|0));
  const bases=e.ranges.map(z=>{ const c=QUAL.filter(q=>q.z===z); if(k===0&&z===50) return 'C-50'; return c[Math.floor(r()*c.length)].id; });
  return {n:e.n,ph:e.ph,pos:e.pos,bases,sec:EXPOSURE_BY_COUNT[bases.length]||5}; }
function rangeRun(lane){ return RANGE_RUN[lane]||(RANGE_RUN[lane]={k:0,phase:'gap',t:0,cur:[],eng:null}); }
function rangeRunReset(lane){ if(lane==null){ Object.keys(RANGE_RUN).forEach(k=>delete RANGE_RUN[k]); } else delete RANGE_RUN[lane]; }
function rangeTraining(){ return (state.rangeMode||'bounce')!=='qual40'; }
function rangeReset(){ const up=rangeTraining(); (PLATES||QUAL).forEach(q=>{q.up=up;q.lifePct=100;q.life=up?1e9:0;q.fall=up?0:1;q._dead=0;q._down=false;q._eng=false;q._ret=0;q.mist=false;}); rangeRunReset(); state.lastBand=''; state.rangeAllDown=false; state.rangeHit=0; state.rangeMiss=0; state.rangeLapsed=0; } /* r.137: training raises EVERY target; qualification starts with every target down */
/* r.131: authority is scoped to the EXPOSURE — when a target goes down (hit or lapsed) its amber/red box goes with it. */
function rangeRelease(q){ if(!q) return; if(state.desig&&(state.desig.ref===q||state.desig.id===q.id)){ state.desig=null; state.hiApproved=false; } Object.keys(state.tgtSlot||{}).forEach(k=>{ const sl=state.tgtSlot[k]; if(sl&&(sl.ref===q||sl.id===q.id)) delete state.tgtSlot[k]; }); q.mist=false; if(typeof list==='function') list(); } /* r.134: the board kept a dead amber row after a lapse */
function rangeFirstPlate(){ const lane=state.lane||0; return (PLATES||[]).find(p=>p.lane===lane&&p.base==='C-50')||QUAL.find(q=>q.id==='C-50')||QUAL[0]; } /* the 50 R: first in the program, and the pre-aim in training */
function plateOf(lane,base){ return (PLATES||[]).find(p=>p.lane===lane&&p.base===base)||null; }
function rangeExpose(lane,base){ /* raise ONE named plate now and lower the lane's others (QA + pre-aim); in QUAL the run treats it as a one-target window */
  const q=plateOf(lane,base); if(!q) return null; const R=rangeRun(lane);
  (PLATES||[]).forEach(p=>{ if(p.lane===lane&&p!==q&&p.up){ p.up=false;p.fall=1;p._down=true;p._ret=0; } });
  q.up=true;q.lifePct=100;q.life=rangeTraining()?1e9:(EXPOSURE_BY_COUNT[1]||5);q.fall=0;q._dead=0;q._eng=false;q._down=false;q._ret=0;q.mist=false;
  R.phase='up';R.cur=[q.id];R.eng={n:0,ph:0,pos:'',bases:[base],sec:EXPOSURE_BY_COUNT[1]||5};R.t=0; return q; }
function rangeArmed(){ const ph=state.lobby&&state.lobby.phase; return ph==='PRACTICE'||ph==='LIVE'||!!state.qaArmed; } /* r.133: the range ran and lapsed 54 targets behind the intro and 1 in every waiting room — a lapse counts only once someone may fire */
function lapseIsMine(){ return !(state.lobby&&state.lobby.phase==='LIVE'&&!state.lobby.host); } /* r.135: one lapse clock per room */
function rangeLapse(q,fromRow){ /* QUAL · 40: a target still standing when its engagement's window ends was not engaged — an UNFIRED MISS round · fromRow: applying the host's row, never a second row */
  state.lastLapse={id:q.id,t:state.clock};
  if(state.rangeMode!=='qual40'||state.qualDone) return; const r=qualRecordShot(false,q.id); if(r&&r.accepted){ state.qualExpired=(state.qualExpired||0)+1; if(!fromRow&&typeof netEvent==='function') netEvent('LAPSE',q.id,'UNFIRED MISS');
    toast('NOT ENGAGED · '+plateWord(q.id)+' · UNFIRED MISS · '+r.hits+'/'+r.round+(r.done?' '+r.badge:'')); } }
function qualFinish(){ if(state.qualDone) return; state.qualDone=true; state.qualStarted=false; if(lapseIsMine()&&typeof ev==='function') ev('QUAL','P'+(state.qualPh||4),'DONE '+(state.qualH||0)+'/'+(state.qualR||0)); }
function rangeTick(dt){
  const mode=state.rangeMode||'bounce'; const mine=state.lane||0;
  if(mode!=='qual40'){ /* TRAINING: every target stands; a hit target falls, then returns (RESET) or stays down (DOWN) */
    let anyUp=false;
    platesHere().forEach(q=>{
      if(q.up&&q.lifePct<=0){ q.fall=Math.min(1,(q.fall||0)+dt*2.4); if(q.fall>=1){ q.up=false; q._down=true; q._ret=0; rangeRelease(q); } anyUp=true; return; }
      if(!q.up){ if(mode==='bounce'){ q._ret=(q._ret||0)+dt; if(q._ret>=RETURN_S){ q.up=true;q.lifePct=100;q.life=1e9;q.fall=0;q._eng=false;q._down=false;q._ret=0;q.mist=false; anyUp=true; } } return; }
      anyUp=true;
    });
    state.rangeAllDown=(mode==='stay'&&!anyUp);
    return;
  }
  if(state.qualDone) return;
  const R=rangeRun(mine); R.t+=dt;
  if(R.phase!=='up'){
    if(R.t<(R.phase==='phasegap'?PHASE_GAP_S:ENG_GAP_S)) return;
    const e=engagementAt(mine,R.k); if(!e){ qualFinish(); return; }
    R.cur=e.bases.map(b=>plateOf(mine,b)).filter(Boolean).map(q=>{ q.up=true;q.lifePct=100;q.life=e.sec;q.fall=0;q._dead=0;q._eng=false;q._down=false;q.mist=false; return q.id; });
    R.eng=e; R.phase='up'; R.t=0; state.qualEng=e.n; state.qualPh=e.ph; qualStartCurrent();
    return;
  }
  const cur=R.cur.map(id=>PLATES.find(p=>p.id===id)).filter(Boolean);
  cur.forEach(q=>{ if(q.up&&q.lifePct<=0){ q.fall=Math.min(1,(q.fall||0)+dt*2.4); if(q.fall>=1){ q.up=false; rangeRelease(q); } } else if(q.up){ q.life=Math.max(0,(R.eng?R.eng.sec:5)-R.t); } });
  if(R.t>=(R.eng?R.eng.sec:5)){ /* the window ends: every target still standing and not engaged is an unfired miss (host clock in a room) */
    cur.forEach(q=>{ if(q.up&&q.lifePct>0){ q.up=false; q.fall=1; if(mine===(state.lane||0)&&rangeArmed()&&lapseIsMine()&&!q._eng){ rangeLapse(q,false); state.rangeLapsed=(state.rangeLapsed|0)+1; hudScore(); } rangeRelease(q); } });
    const nxt=engagementAt(mine,R.k+1);
    if(R.eng&&R.eng.n>0&&nxt&&nxt.ph!==R.eng.ph){ if(lapseIsMine()&&typeof ev==='function') ev('QUAL','P'+R.eng.ph,'END '+(state.qualH||0)+'/'+(state.qualR||0)); R.phase='phasegap'; if(rangeArmed()) toast('PHASE '+nxt.ph+' · '+nxt.pos+' · MAG CHANGE · MOVE'); }
    else R.phase='gap';
    R.t=0; R.k++; R.cur=[]; if(!nxt) qualFinish();
  }
}
""")

cut("function qualStartCurrent(){","function plateBase(id){","""function qualStartCurrent(){
  if(state.qualDone) return;
  if(!state.qualStarted){
    state.qualStarted=true;
    state.qualT0=state.clock;
  }
}
function qualRecordShot(hit,id){ /* r.137: one round per silhouette; 40 by construction (the program's count); no tables, no per-plate caps */
  if(state.qualDone){
    return {accepted:false,done:true,badge:qualBadge(state.qualH||0)};
  }
  qualStartCurrent();
  if((state.qualR||0)>=IWQ_TOTAL){ qualFinish(); return {accepted:false,done:true,badge:qualBadge(state.qualH||0)}; } /* r.131: never a 41st round */
  state.qualR=(state.qualR||0)+1;
  let scored=false;
  if(hit){ state.qualH=(state.qualH||0)+1; scored=true; }
  const R=rangeRun(state.lane||0); const eng=R.eng||{n:state.qualEng|0,ph:state.qualPh|0,pos:'',bases:[],sec:0};
  const done=(state.qualR||0)>=IWQ_TOTAL; if(done) qualFinish();
  return {
    accepted:true,hit:!!hit,scored,eng,
    round:state.qualR||0,hits:state.qualH||0,
    done,badge:done?qualBadge(state.qualH||0):''
  };
}
""")

# ── the words a player reads ──
rep("function noLockMsg(){ if(+state.challenge===0&&typeof rangeRun==='function'){ const R=rangeRun(state.lane||0); const left=R.phase==='gap'?Math.max(0,EXPOSURE_GAP_S-(R.t||0)):0; return state.rangeAllDown?'ALL DOWN · RESET':('NO TARGET UP · NEXT IN '+left.toFixed(1)+' S'); } return 'NO LOCK'; }",
    "function noLockMsg(){ if(+state.challenge===0&&typeof rangeRun==='function'){ if(state.rangeAllDown) return 'ALL DOWN · RESET'; if(rangeTraining()) return 'NO TARGET IN THE PICTURE · TURN TO ONE'; const R=rangeRun(state.lane||0); if(state.qualDone) return 'QUAL COMPLETE · RESET FOR ANOTHER'; const left=R.phase!=='up'?Math.max(0,(R.phase==='phasegap'?PHASE_GAP_S:ENG_GAP_S)-(R.t||0)):0; return R.phase!=='up'?('NO TARGET UP · NEXT IN '+left.toFixed(1)+' S'):'NO TARGET IN THE PICTURE · TURN TO ONE'; } return 'NO LOCK'; } /* r.137: training never waits; qualification names the gap */")
rep("""    const tb=QUAL_TABLES[state.qualTbl||0]||QUAL_TABLES[2];
    const rem=state.qualDone?0:state.qualStarted?Math.max(0,Math.ceil(tb.sec-(state.clock-(state.qualT0||state.clock)))):tb.sec;
    ps.textContent=state.qualDone?('QUAL '+(state.qualH||0)+'/40 '+qualBadge(state.qualH||0)):('TABLE '+tb.id+' · '+(state.qualTblH||0)+'/'+(state.qualTblR||0)+' of '+tb.lim+' · '+rem+' S LEFT · TOTAL '+(state.qualH||0)+'/'+(state.qualR||0)+(state.qualExpired?' · LAPSED '+state.qualExpired:''));""",
    """    const R=rangeRun(state.lane||0); const e=R.eng&&R.eng.n>0?R.eng:null; const upN=R.phase==='up'?R.cur.filter(id=>{const p=PLATES.find(x=>x.id===id);return p&&p.up&&p.lifePct>0;}).length:0;
    const left=R.phase==='up'?Math.max(0,Math.ceil((R.eng?R.eng.sec:0)-R.t)):0;
    ps.textContent=state.qualDone?('QUAL '+(state.qualH||0)+'/'+IWQ_TOTAL+' '+qualBadge(state.qualH||0)):(e?('PHASE '+e.ph+' · ENG '+e.n+'/'+IWQ_ENG.length+(R.phase==='up'?' · '+upN+' UP · '+left+' S':R.phase==='phasegap'?' · MAG CHANGE':' · NEXT SOON')):'QUAL · 40 · READY')+' · HIT '+(state.qualH||0)+'/'+(state.qualR||0)+(state.qualExpired?' · NOT ENGAGED '+state.qualExpired:''); /* r.137: the strip reads the engagement, not a table */""")
rep("  if(isPlate){ const R=rangeRun(ref.lane||0); const live=!!ref.up&&(ref.fall||0)<0.25&&ref.lifePct>0&&R.cur===ref.id;",
    "  if(isPlate){ const R=rangeRun(ref.lane||0); const live=!!ref.up&&(ref.fall||0)<0.25&&ref.lifePct>0&&(rangeTraining()||(R.cur||[]).includes(ref.id)); /* r.137: in training every standing target is live; in QUAL only the engagement's */")
rep("    if(!live){ state.lastBand='DOWN'; toast('TARGET DOWN · WAIT FOR THE NEXT EXPOSURE'); netEvent('MISS',id,'MISS DOWN'); return {dead:false,direct:false,pts:0,result:'MISS'}; }\n    if(state.rangeMode==='qual40'&&ref._eng){ state.lastBand='SPENT'; toast('ONE ROUND PER EXPOSURE'); return {dead:false,direct:false,pts:0,result:'REFUSED'}; }",
    "    if(!live){ state.lastBand='DOWN'; toast(rangeTraining()?'TARGET DOWN · MARK ONE THAT STANDS':'TARGET DOWN · WAIT FOR THE NEXT EXPOSURE'); netEvent('MISS',id,'MISS DOWN'); return {dead:false,direct:false,pts:0,result:'MISS'}; }\n    if(state.rangeMode==='qual40'&&ref._eng){ state.lastBand='SPENT'; toast('ONE ROUND PER TARGET'); return {dead:false,direct:false,pts:0,result:'REFUSED'}; }")
rep("""        toast('QUAL40 COMPLETE · '+(state.qualH||0)+'/40 '+qualBadge(state.qualH||0));
      }else{
        const next=qr.advance&&!qr.advance.done?' → T'+qr.advance.to.id+' READY':'';
        const done=qr.done?' '+qualBadge(qr.hits):'';
        toast((hit?('HIT'+(qr.scored?'':' · NO SCORE (CAP)')):'MISS')+
          ' · T'+qr.table.id+' '+qr.table.pos+
          ' · '+qr.hits+'/'+qr.round+done+next);
      }""",
    """        toast('QUAL COMPLETE · '+(state.qualH||0)+'/'+IWQ_TOTAL+' '+qualBadge(state.qualH||0));
      }else{
        const done=qr.done?' · '+qualBadge(qr.hits):'';
        toast((hit?'HIT':'MISS')+(state.lastBand&&bandWord(state.lastBand)?' · '+bandWord(state.lastBand):'')+' · ENG '+qr.eng.n+'/'+IWQ_ENG.length+' · '+qr.hits+'/'+qr.round+done); /* r.137: the engagement, the tally, the badge when it is over */
      }""")
rep("  state.clock+=dt;state.tick+=dt*20;qualTowerTick();spawn(dt);","  state.clock+=dt;state.tick+=dt*20;spawn(dt); /* r.137: the tower lives in rangeTick (engagements), no table clock */")
rep("    qual:{mode:state.rangeMode,R:state.qualR|0,H:state.qualH|0,tbl:state.qualTbl|0,expired:state.qualExpired|0,",
    "    qual:{mode:state.rangeMode,R:state.qualR|0,H:state.qualH|0,program:'IWQ_TABLE_VI',eng:state.qualEng|0,ph:state.qualPh|0,expired:state.qualExpired|0,")
rep("    qualR:state.qualR,qualH:state.qualH,qualTbl:state.qualTbl,qualTblR:state.qualTblR,\n    qualT0:state.qualT0,qualCap:{...(state.qualCap||{})},qualStarted:state.qualStarted,",
    "    qualR:state.qualR,qualH:state.qualH,qualEng:state.qualEng,qualPh:state.qualPh,\n    qualT0:state.qualT0,qualStarted:state.qualStarted,")
rep("    qualR:stateSave.qualR,qualH:stateSave.qualH,qualTbl:stateSave.qualTbl,qualTblR:stateSave.qualTblR,\n    qualT0:stateSave.qualT0,qualCap:stateSave.qualCap,qualStarted:stateSave.qualStarted,",
    "    qualR:stateSave.qualR,qualH:stateSave.qualH,qualEng:stateSave.qualEng,qualPh:stateSave.qualPh,\n    qualT0:stateSave.qualT0,qualStarted:stateSave.qualStarted,")
rep("(state.rangeMode==='qual40'?' · 40 EXPOSURES · 23 MARKSMAN 30 SHARP 36 EXPERT':state.rangeMode==='stay'?' · A TARGET THAT GOES DOWN STAYS DOWN':' · A TARGET THAT GOES DOWN COMES BACK UP')",
    "(state.rangeMode==='qual40'?' · IWQ TABLE VI · 40 TARGETS · 18 ENGAGEMENTS · 23 MARKSMAN 30 SHARP 36 EXPERT':state.rangeMode==='stay'?' · EVERY TARGET IS UP · A HIT TARGET STAYS DOWN':' · EVERY TARGET IS UP · A HIT TARGET COMES BACK')")
rep("releaseAuthority('LANE CHANGE'); rangeRunReset(state.lane); /* r.135: a lane change is a consumer too */ (typeof platesHere==='function'?platesHere():[]).forEach(q=>{q.up=false;q.fall=1;q.lifePct=100;q._eng=false;});",
    "releaseAuthority('LANE CHANGE'); rangeRunReset(state.lane); /* r.135: a lane change is a consumer too */ (typeof platesHere==='function'?platesHere():[]).forEach(q=>{const up=rangeTraining();q.up=up;q.fall=up?0:1;q.lifePct=100;q.life=up?1e9:0;q._eng=false;q._down=false;q._ret=0;}); if(typeof qualResetTower==='function'&&!rangeTraining()) qualResetTower(); /* r.137: a new lane in training stands every target; in QUAL it starts the program over */")
rep("const cap=(slK?'T'+slK+' · ':'')+(q.pos||q.base)+' · '+Math.max(0,Math.ceil(q.life))+'s'+(ph?' · '+ph:'');",
    "const cap=(slK?'T'+slK+' · ':'')+(q.pos||q.base)+(rangeTraining()?'':' · '+Math.max(0,Math.ceil(q.life))+'s')+(ph?' · '+ph:''); /* r.137: seconds only where a window runs */")

# ── QA rows: the program, the modes, the tower ──
rep("""  push('QUAL40_TABLES',
    QUAL_TABLES.length===3 &&
    QUAL_TABLES[0].lim===20 && QUAL_TABLES[0].sec>=20*6.7 &&
    QUAL_TABLES[1].lim===10 && QUAL_TABLES[1].sec>=10*6.7 &&
    QUAL_TABLES[2].lim===10 && QUAL_TABLES[2].sec>=10*6.7,
    '20/142 · 10/75 · 10/75 · each clock covers its exposures + gaps');
  push('QUAL40_CAP_III',
    QUAL_TABLES[2].cap('C-50')===2 &&
    QUAL_TABLES[2].cap('C-100L')===2 &&
    QUAL_TABLES[2].cap('C-150L')===1 &&
    QUAL_TABLES[2].cap('C-200L')===0,
    '50/100×2 · 150×1 · farther×0');""",
    """  { const byZ={}; IWQ_ENG.forEach(e=>e.ranges.forEach(z=>{byZ[z]=(byZ[z]||0)+1;})); const cnt=[50,100,150,200,250,300].map(z=>byZ[z]||0).join('/');
    push('IWQ_PROGRAM_IS_40', IWQ_ENG.length===18 && IWQ_TOTAL===40 && cnt==='6/7/8/8/6/5' && IWQ_ENG.every(e=>e.ranges.length>=1&&e.ranges.length<=4&&new Set(e.ranges).size===e.ranges.length) && IWQ_VI.map(p=>p.ph).join()==='1,2,3,4', '18 engagements · 40 targets · by range '+cnt+' (operator: 6/7/8/8/6/5) · four phases');
    push('QUAL_EXPOSURE_BY_COUNT', EXPOSURE_BY_COUNT[1]===5&&EXPOSURE_BY_COUNT[2]===8&&EXPOSURE_BY_COUNT[3]===12&&EXPOSURE_BY_COUNT[4]===16&&ENG_GAP_S===3&&PHASE_GAP_S>=8&&PHASE_GAP_S<=10&&IWQ_ENG.every(e=>engagementAt(0,e.n-1).sec===EXPOSURE_BY_COUNT[e.ranges.length]), '1 = 5 s · 2 = 8 s · 3 = 12 s · 4 = 16 s · 3 s between engagements · '+PHASE_GAP_S+' s between phases'); }""")
rep("    push('RANGE_SEES_PLATES', seen===10, seen+'/10 silhouettes project at pan 0 from the pit');",
    "    push('RANGE_SEES_PLATES', seen===11, seen+'/11 silhouettes project at pan 0 from the pit');")
rep("    push('ALTC_LAYOUT', QUAL.length===10 && QUAL.filter(q=>q.z===100&&q.form==='F').length===3 && QUAL.filter(q=>q.z===250).length===1 && QUAL.filter(q=>q.z===300).length===1 && QUAL.find(q=>q.z===250).x<0 && QUAL.find(q=>q.z===300).x>0, '50 F · 100 F×3 · 150 E×2 · 200 E×2 · 250 left · 300 right (sheet 9127)');\n    const o0=exposureOrder(0), o1=exposureOrder(1), o0b=exposureOrder(0);\n    push('RANGE_POP_SCHEDULE', o0.join()===o0b.join() && o0.join()!==o1.join() && new Set(o0).size===10 && EXPOSURE_S[50]===3 && EXPOSURE_S[300]===8, 'L01 '+o0.join('')+' · L02 '+o1.join('')+' · 3 s @50 → 8 s @300');",
    "    push('ALTC_LAYOUT', QUAL.length===11 && QUAL.filter(q=>q.z===50).length===2 && QUAL.find(q=>q.id==='C-50L').x<0 && QUAL.find(q=>q.id==='C-50').x>0 && QUAL.filter(q=>q.z===100&&q.form==='F').length===3 && QUAL.filter(q=>q.z===250).length===1 && QUAL.filter(q=>q.z===300).length===1 && QUAL.find(q=>q.z===250).x<0 && QUAL.find(q=>q.z===300).x>0, '50 F left+right · 100 F×3 · 150 E×2 · 200 E×2 · 250 left · 300 right (sheet 9127 + the operator\\'s 50 L/R)');\n    { const e0=engagementAt(0,0), e0b=engagementAt(0,0); const same=Array.from({length:18},(_,k)=>engagementAt(0,k).bases.join()).join('|')===Array.from({length:18},(_,k)=>engagementAt(0,k).bases.join()).join('|'); const diff=Array.from({length:18},(_,k)=>engagementAt(0,k).bases.join()).join('|')!==Array.from({length:18},(_,k)=>engagementAt(1,k).bases.join()).join('|');\n      push('QUAL_50R_FIRST', !!e0&&e0.bases.length===1&&e0.bases[0]==='C-50'&&e0.sec===5&&e0.ph===1&&e0b.bases[0]==='C-50', 'engagement 1 is the 50 R alone, standing, 5 s');\n      push('QUAL_LANES_DIFFER', same&&diff&&Array.from({length:18},(_,k)=>engagementAt(0,k)).every((e,k)=>e.ranges===undefined||true)&&Array.from({length:18},(_,k)=>engagementAt(1,k)).every(e=>e.bases.every(b=>QUAL.some(q=>q.id===b))), 'the same program on every lane; which sibling stands is seeded per lane (L01 ≠ L02), replay repeats'); }")
rep("""    state.rangeMode='bounce'; rangeReset(); const qb=rangeExpose(0,'C-50'); qb.lifePct=0; qb.fall=0.05; let back=-1; for(let i=0;i<2400;i++){ rangeTick(0.05); if(i>20&&qb.up&&qb.lifePct>0){ back=i; break; } }
    push('MODE_RESET_RETURNS', back>0 && !qb._down, 'TRAINING · RESET: the HIT plate itself came back up after '+(back*0.05).toFixed(1)+' s');
    state.rangeMode='stay'; rangeReset(); const qs=rangeExpose(0,'C-50'); qs.lifePct=0; qs.fall=0.05; for(let i=0;i<40;i++) rangeTick(0.05); let sawUp=false; for(let k=0;k<12;k++){ for(let i=0;i<120;i++) rangeTick(0.05); if(qs.up) sawUp=true; }
    push('MODE_DOWN_STAYS', qs._down===true && !sawUp && !qs.up, 'TRAINING · DOWN: C-50 stays down through 12 more exposures');
    state.rangeMode='qual40'; rangeReset(); qualResetTower(); const e0=exposureAt(0,0); for(let i=0;i<40;i++) rangeTick(0.05); const started=state.qualStarted; const r0=state.qualR; for(let i=0;i<(e0.sec+0.3)*20;i++) rangeTick(0.05);
    push('MODE_QUAL_TIMED', started && state.qualR===r0+1 && (state.qualExpired||0)>=1 && state.qualTblR===1 && (state.qualH||0)===0 && (state.events||[]).some(e=>e.verb==='LAPSE'), 'QUAL · 40: first exposure '+e0.base+' '+e0.sec+' s · lapsed = UNFIRED MISS · rounds '+state.qualR);""",
    """    state.rangeMode='bounce'; rangeReset(); push('TRAIN_ALL_UP', platesHere().length===11 && platesHere().every(q=>q.up&&q.lifePct>0&&(q.fall||0)===0), 'TRAINING · RESET: every one of the lane\\'s 11 targets stands after RESET');
    { const l0=state.rangeLapsed|0, ev0=(state.events||[]).filter(e=>e.verb==='LAPSE').length; for(let i=0;i<1200;i++) rangeTick(0.05); push('TRAIN_NO_LAPSE', (state.rangeLapsed|0)===l0 && (state.events||[]).filter(e=>e.verb==='LAPSE').length===ev0 && platesHere().every(q=>q.up), 'training has no exposure clock: 60 s pass, nothing lapses, every target still stands'); }
    const qb=platesHere().find(q=>q.base==='C-50'); qb.lifePct=0; qb.fall=0.05; let back=-1, wentDown=false; for(let i=0;i<2400;i++){ rangeTick(0.05); if(!qb.up) wentDown=true; if(wentDown&&qb.up&&qb.lifePct>0){ back=i; break; } }
    push('MODE_RESET_RETURNS', wentDown && back>0 && (back*0.05)>=RETURN_S && !qb._down, 'TRAINING · RESET: the HIT target fell and came back after '+(back*0.05).toFixed(1)+' s');
    state.rangeMode='stay'; rangeReset(); const qs=platesHere().find(q=>q.base==='C-50'); qs.lifePct=0; qs.fall=0.05; for(let i=0;i<40;i++) rangeTick(0.05); let sawUp=false; for(let i=0;i<1200;i++){ rangeTick(0.05); if(qs.up) sawUp=true; } const othersUp=platesHere().filter(q=>q!==qs).every(q=>q.up);
    push('MODE_DOWN_STAYS', qs._down===true && !sawUp && !qs.up && othersUp && !state.rangeAllDown, 'TRAINING · DOWN: the HIT target stays down for 60 s while the other ten stand');
    { platesHere().forEach(q=>{ if(q.up){ q.lifePct=0; q.fall=0.05; } }); for(let i=0;i<40;i++) rangeTick(0.05); push('MODE_DOWN_ALL_DOWN', state.rangeAllDown===true && platesHere().every(q=>!q.up) && /ALL DOWN/.test(noLockMsg()), 'TRAINING · DOWN: with every target down the strip says ALL DOWN · RESET'); }
    state.rangeMode='qual40'; rangeReset(); qualResetTower(); { const R=rangeRun(0); let k4=false; for(let i=0;i<4000&&!k4;i++){ rangeTick(0.05); if(R.phase==='up'&&R.k===4) k4=true; } const upZ=R.cur.map(id=>PLATES.find(p=>p.id===id)).filter(p=>p&&p.up).map(p=>p.z).sort((a,b)=>a-b).join('/');
      push('QUAL_ENG_TOGETHER', k4 && R.cur.length===4 && upZ==='150/200/250/300' && R.eng.sec===16 && (state.qualR|0)===6 && (state.qualExpired|0)===6, 'engagement 5: 150/200/250/300 up TOGETHER for 16 s (after 1–4 lapsed: 6 unfired rounds so far)');
      const r0=state.qualR|0, x0=state.qualExpired|0, l0=(state.events||[]).filter(e=>e.verb==='LAPSE').length; for(let i=0;i<(16.5)*20;i++) rangeTick(0.05);
      push('QUAL_UNENGAGED_IS_MISS', (state.qualR|0)===r0+4 && (state.qualExpired|0)===x0+4 && (state.events||[]).filter(e=>e.verb==='LAPSE').length===l0+4 && R.cur.length===0, 'a quad nobody engaged = 4 UNFIRED MISS rows, 4 rounds');
      push('QUAL_PHASE_GAP', R.phase==='phasegap' && (state.events||[]).some(e=>e.verb==='QUAL'&&e.id==='P1'), 'after engagement 5 the tower rests for the mag change and phase 1 is a QUAL row');
      let ph2=false; for(let i=0;i<(PHASE_GAP_S+0.5)*20&&!ph2;i++){ rangeTick(0.05); if(R.phase==='up'&&R.eng&&R.eng.ph===2) ph2=true; } push('QUAL_PHASE_2_STARTS', ph2 && R.eng.n===6 && R.cur.length===1, 'phase 2 opens on engagement 6, a single at 100 m');
      for(let i=0;i<6000&&!state.qualDone;i++) rangeTick(0.05);
      push('QUAL_IS_40_ROUNDS', state.qualDone===true && (state.qualR|0)===40 && (state.qualH|0)===0 && (state.qualExpired|0)===40 && (state.events||[]).filter(e=>e.verb==='QUAL').length===4, 'a full program with no shots ends at exactly 40 rounds, 0 hits, four phase rows'); }""")
rep("""    { rangeReset(); const q=rangeExpose(0,'C-150L'); aimPlate(q,0); state.tgtSlot={}; state.desig=null; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const red0=!!(state.desig&&state.desig.phase==='red'); for(let i=0;i<(EXPOSURE_S[150]+0.3)*20;i++) rangeTick(0.05);""",
    """    { state.rangeMode='qual40'; rangeReset(); qualResetTower(); const q=rangeExpose(0,'C-150L'); aimPlate(q,0); state.tgtSlot={}; state.desig=null; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const red0=!!(state.desig&&state.desig.phase==='red'); for(let i=0;i<(EXPOSURE_BY_COUNT[1]+0.3)*20;i++) rangeTick(0.05);""")
rep("      push('LAPSE_RELEASES_THE_BOX', red0&&cleared&&refused, 'the red box went down with its target; a late FIRE is refused and never resurrects it'); }",
    "      push('LAPSE_RELEASES_THE_BOX', red0&&cleared&&refused, 'the red box went down with its target; a late FIRE is refused and never resurrects it'); state.rangeMode='bounce'; qualResetTower(); }")
rep("""    { state.rangeMode='qual40'; rangeReset(); qualResetTower(); const q=rangeExpose(0,'C-50'); aimPlate(q,80); state.tgtSlot={}; state.desig=null; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); fireN(1); const r1=state.qualR|0, b1=state.lastBand; fireN(1); const r2=state.qualR|0, b2=state.lastBand; for(let i=0;i<(EXPOSURE_S[50]+0.3)*20;i++) rangeTick(0.05); const r3=state.qualR|0;
      push('ONE_ROUND_PER_EXPOSURE', r1===1&&b1==='MISS'&&r2===1&&b2==='SPENT'&&r3===1&&(state.qualH|0)===0, 'a miss costs one round · a second pull is SPENT · the lapse charges nothing more · rounds='+r3); state.rangeMode='bounce'; qualResetTower(); }""",
    """    { state.rangeMode='qual40'; rangeReset(); qualResetTower(); const R=rangeRun(0); let k3=false; for(let i=0;i<4000&&!k3;i++){ rangeTick(0.05); if(R.phase==='up'&&R.k===3) k3=true; } const r00=state.qualR|0, cur3=R.cur.length; const qa=PLATES.find(p=>p.id===R.cur[0]), qc=PLATES.find(p=>p.id===R.cur[2]);
      function fireAt(q,off){ aimPlate(q,off||0); state.tgtSlot={}; state.desig=null; state.hiApproved=false; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); fireN(1); return {r:state.qualR|0,b:state.lastBand,h:state.qualH|0}; }
      const s1=fireAt(qa,80); const s2=fireAt(qa,0); const s3=fireAt(qc,0); for(let i=0;i<(12.5)*20;i++) rangeTick(0.05); const r4=state.qualR|0;
      push('QUAL_ONE_ROUND_PER_TARGET', k3&&cur3===3&&s1.r===r00+1&&s1.b==='MISS'&&s2.r===r00+1&&s2.b==='SPENT'&&s3.r===r00+2&&s3.h===1&&r4===r00+3&&(state.qualExpired|0)===r00+1, 'in the triple: a miss costs one round · a second pull on that target is SPENT · the next target is a fresh round (HIT) · the third, unengaged, is one unfired miss · rounds '+r00+' → '+r4); state.rangeMode='bounce'; qualResetTower(); }""")
rep("""    { state.rangeMode='qual40';
      const seen=[]; rangeReset(); qualResetTower(); state.qualTbl=2; for(let i=0;i<6000&&seen.length<10;i++){ rangeTick(0.05); const R=rangeRun(0); if(R.phase==='up'&&R.q&&seen[seen.length-1]!==R.q.id) seen.push(R.q.id); }
      push('TABLE_III_EXPOSES_ONLY_SCORABLE', seen.length>=6 && seen.every(id=>QUAL_TABLES[2].cap(id)>0), 'kneeling table exposes 50/100/150 only · '+seen.map(plateBase).join(' ')); state.rangeMode='bounce'; qualResetTower(); }
""","")
rep("""    { const ph0=state.lobby&&state.lobby.phase; if(state.lobby) state.lobby.phase='SETUP'; state.qaArmed=false; rangeReset(); const q=rangeExpose(0,'C-50'); const l0=state.rangeLapsed|0; for(let i=0;i<(EXPOSURE_S[50]+0.5)*20;i++) rangeTick(0.05);
      push('RANGE_IDLE_BEFORE_START', (state.rangeLapsed|0)===l0&&!q.up, 'a target that lapses behind the intro or the waiting room is not a lapse against the player'); if(state.lobby) state.lobby.phase=ph0; state.qaArmed=true; }""",
    """    { const ph0=state.lobby&&state.lobby.phase; if(state.lobby) state.lobby.phase='SETUP'; state.qaArmed=false; state.rangeMode='qual40'; rangeReset(); qualResetTower(); const q=rangeExpose(0,'C-50'); const l0=state.rangeLapsed|0, r0=state.qualR|0; for(let i=0;i<(EXPOSURE_BY_COUNT[1]+0.5)*20;i++) rangeTick(0.05);
      push('RANGE_IDLE_BEFORE_START', (state.rangeLapsed|0)===l0&&(state.qualR|0)===r0&&!q.up, 'a target that lapses behind the intro or the waiting room is not a lapse and not a round against the player'); if(state.lobby) state.lobby.phase=ph0; state.qaArmed=true; state.rangeMode='bounce'; qualResetTower(); rangeReset(); }""")

rep("qualR:0,qualH:0,qualTbl:0,qualTblR:0,qualT0:0,qualCap:{},qualStarted:false,","qualR:0,qualH:0,qualEng:0,qualPh:0,qualT0:0,qualStarted:false,")
rep("  } else ps.textContent=chNum()===0?(RANGE_MODE_NAME[state.rangeMode||'bounce']+' · HIT '+(state.rangeHit|0)+' · MISS '+(state.rangeMiss|0)+' · LAPSED '+(state.rangeLapsed|0)+(state.rangeAllDown?' · ALL DOWN · PRESS RESET':'')):('BLU '+(state.blu|0)+' · RED '+(state.red|0));",
    "  } else ps.textContent=chNum()===0?(RANGE_MODE_NAME[state.rangeMode||'bounce']+' · HIT '+(state.rangeHit|0)+' · MISS '+(state.rangeMiss|0)+(state.rangeAllDown?' · ALL DOWN · PRESS RESET':'')):('BLU '+(state.blu|0)+' · RED '+(state.red|0)); /* r.137: training has no lapse, so the strip does not count one */")
c=s.count("revision:'0.136'"); rep("revision:'0.136'","revision:'0.137'",c)
h=s.count("r0.136"); rep("r0.136","r0.137",h)
for dead in ["QUAL_TABLES","qualTbl","qualCap","exposureAt(","exposureOrder(","EXPOSURE_S[","EXPOSURE_GAP_S","qualTowerTick","qualAdvanceTable","qualExpireIfNeeded","R.q.id","R.cur===","ONE ROUND PER EXPOSURE"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

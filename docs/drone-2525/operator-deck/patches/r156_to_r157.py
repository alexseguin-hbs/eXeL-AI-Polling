# r.156 -> r.157 — DRONE ROUND 1 OF 19 (operator 2026-10-04, docs/drone-2525/rounds/2026.10.04_09.17..48_19_rounds/ASK.md, Addenda 1-5,
# and the Drone-2525 asks of 2026.10.04 in docs/asks/).
#  1. THE SPLASH STARTS AT THE BOTTOM OF THE HIT TARGET (Addendum 5, verbatim: "splash-ring as oval from bottom of target works";
#     supersedes Addendum 4 — the camera-facing burst is NOT built). The same flat ring (1.2 -> 4.2 m, 16 segments, LOCK red, 0.45 s,
#     outside the world budget, nothing on a miss) is centred on baseOf(target): a plate's foot (qWorld, with the fold's z shift so it
#     stays under the falling silhouette); the ground under a door, a pop-up, a drone or an aircraft (the scene ground, y 0). r.156's
#     centre of mass (0.18-0.44 m above the foot) is gone. QA row SPLASH_FROM_TARGET_BASE replaces SPLASH_FROM_TARGET_CENTRE.
#  2. LABELS ONLY WHILE MARKED (his pick, 4b9a6ca): plateCaptionRects skips every target that is neither the marked one nor in a slot;
#     the marked caption reads in plain words ("T1 · 150 M RIGHT · AMBER").
#  3. THE RANGE MENU (his pick "Mode + Restart + Lane"): TRAIN UP · TRAIN DOWN · QUAL 40, RESTART, LANE 21 stay on the range; scenario,
#     platform, water, MoT, targets, CH, DIFF and HAL go behind MORE. A pick says once what happens next ("LANE 21 · QUAL 40 · 40
#     TARGETS · 4 MAGAZINES · STARTS ON GREEN"); goRange owns the one sentence, so nothing overwrites it in the same tick.
#  4. LANE MARKERS ON BOTH SIDES ("◂ 40 · 41 ▸"; lane 1's outer edge "1 ▸", lane 42's "◂ 42"): 252 boards on 129 posts, each lane's
#     boards on its own ground; my two edges bright, a shared post drawn once.
#  5. 15 M LANES: ONE constant LANE_W=15 drives the lane centres and LANE_HALF_W; every one of the 462 targets stands >= 0.85 m inside
#     its own lines (the 150/250/300 m targets stood outside the 10 m lanes).
#  6. THE NEXT BUTTON IS THE LIT ONE (TARGET -> APPROVE -> FIRE, read from state.desig; FIRE's red border is its lit state, at red only);
#     RELOAD calls for itself (empty, or the QUAL phase rest with a part-used magazine; never full); RESTART lights when the table is over.
#     Styling only: every tap still goes through its own gate, a wrong-order tap keeps its one-line refusal, nothing auto-advances.
#  7. ONE PLAIN STATUS LINE: plateWord on the strip, the LOCK line and the label; no "CH0 D3" on the range; no board line on the range
#     (the strip says it once); the corner says "LANE 21" (SPIRAL vN only with ?diag=1); no slope word anywhere ("L21 DOWN" is gone).
#  8. THE START LIGHT (Addendum 1), upper right, with the word under it: RED WAIT · YELLOW READY · GREEN FIRE — red before the round,
#     between positions and when done; yellow in the 3 s before each QUAL engagement and the last 3 s of the phase rest; green while my
#     targets stand (training: green whenever targets stand). Not a button, gates nothing.
#  9. THE RANGE SHOWS LANES AND TARGETS ONLY (Addendum 3): the slope-coloured lane rays, the firing line, the distance lines, the berm and
#     the blue ground grid are gone on the range; the dim grid spans all 42 lanes.
# 10. MY LANE IS NEVER DROPPED: my targets and my two edges of boards are drawn outside the world budget (counted) — at MoT 1.1 on lane 21
#     the neighbour lane's silhouettes had spent the 280 segments and the player saw captions with no silhouettes under them.
# 11. ROOMS SCORE BY LANE (12-shooter round, Odin/Thor/Thoth): another lane's Restart row restarts only that lane (never my mode, my
#     table or my box); another lane's HIT/MISS rows drop its plate but never touch my strip or toasts; a joiner on a lane the host does
#     not sit on books its own lane's unfired misses (the host's clock ran only the host's lane); my lane's peer HIT draws the same splash.
# 12. QUAL ENDS WITH A SCORECARD AND THE NEXT STEP: "QUAL DONE · 36 OF 40 · EXPERT · PRESS RESTART" (toast + strip), RESTART lit, light red.
# The fire doctrine is untouched: TARGET (amber) -> APPROVE (red, a named human) -> FIRE; simulation only.
# Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.156.html'); DST=os.path.join(DECK,'drone-2525_r.157.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ---------------------------------------------------------------------------------------------------------------------------------
# CSS
rep(r'''#magBar #btnReload{border-color:#C9A227;color:#C9A227}''',
r'''#magBar #btnReload{border-color:#1C2A3A;color:#E8D5B0} /* r.157: RELOAD rests like the bar's other buttons, so its glow means something */
#magBar #btnReload.call{border-color:#C9A227;color:#C9A227;box-shadow:0 0 10px #C9A227} /* r.157: RELOAD calls for itself — empty, or the QUAL phase rest with a part-used magazine; never full */
#startLight{position:absolute;right:8px;top:42px;z-index:4;display:none;flex-direction:column;align-items:center;gap:3px;padding:4px 7px;border:1px solid #1C2A3A;border-radius:6px;background:rgba(0,0,0,.6);pointer-events:none} /* r.157 (Addendum 1): the range tower's start light, upper right */
#app.range #startLight{display:flex}
#startLight .lamps{display:flex;gap:5px}
#startLight i{width:12px;height:12px;border-radius:50%;border:1px solid #1C2A3A;opacity:.35}
#startLight i.r{border-color:#E24B3B}#startLight i.y{border-color:#F0A020}#startLight i.g{border-color:#3DCC8A}
#startLight.R i.r{background:#E24B3B;opacity:1;box-shadow:0 0 8px #E24B3B}#startLight.Y i.y{background:#F0A020;opacity:1;box-shadow:0 0 8px #F0A020}#startLight.G i.g{background:#3DCC8A;opacity:1;box-shadow:0 0 8px #3DCC8A}
#startLight b{font-size:9px;letter-spacing:.14em;font-weight:500;color:#E8D5B0}
#startLight.R b{color:#E24B3B}#startLight.Y b{color:#F0A020}#startLight.G b{color:#3DCC8A}
#playHud #phCH:empty{display:none} /* r.157: no "CH0 D3" on the range */
#app.range:not(.more) #modePick,#app.range:not(.more) #plat,#app.range:not(.more) #water,#app.range:not(.more) #motLvl,#app.range:not(.more) #tgtPick,#app.range:not(.more) #chLvl,#app.range:not(.more) #diffLvl,#app.range:not(.more) #halPick{display:none} /* r.157 (operator 2026-10-04, his pick "Mode + Restart + Lane"): on the range only the mode, Restart and the lane show; the rest is behind MORE */
#app.range #rngMode{order:1}#app.range #btnRangeReset{order:2}#app.range #lanePick{order:3}
#btnRangeReset.call{border-color:#3DCC8A;color:#3DCC8A;box-shadow:0 0 10px #3DCC8A} /* r.157: RESTART is lit when QUAL is done or every target is down */''')
rep(r'''#toast{position:fixed;left:10px;bottom:92px;color:var(--g);font-size:12px;z-index:41;display:none}''',
r'''#toast{position:fixed;left:10px;bottom:92px;color:var(--g);font-size:12px;z-index:41;display:none;max-width:calc(100vw - 104px)} /* r.157: the one sentence wraps before the right column, where LANE 21 and the HEAD stick live */''')
rep(r'''state.desig.phase==='red')?'RED · PEER HI-2 · '+id:'PEER APPROVE HELD'}''',
r'''state.desig.phase==='red')?'RED BOX · '+plateWord(id)+' · APPROVED BY THE OTHER SEAT · NOW PRESS FIRE':'PEER APPROVE HELD'}''')  # r.157: plain words on the marker phone (it read RED · PEER HI-2 · C-50-L21)
rep(r'''  return {accepted:true,msg:'RED · PEER HI-2 · '+id};''',
r'''  return {accepted:true,msg:'RED BOX · '+plateWord(id)+' · APPROVED BY THE OTHER SEAT · NOW PRESS FIRE'};''')
rep(r'''function plateWord(id){ const b=(typeof plateBase==='function'?plateBase(id):String(id||'')); const m=String(b).match(/^C-(\d+)([LRC])?$/); if(!m) return String(b); return m[1]+' M'+(m[2]==='L'?''',
r'''function plateWord(id){ const b=(typeof plateBase==='function'?plateBase(id):String(id||'')); const m=String(b).match(/^C-(\d+)([LRC])?$/); if(!m) return String(b); if(!m[2]&&b==='C-50') m[2]='R'; /* r.157: the 50 R is "50 M RIGHT" — two 50s stand on every lane */ return m[1]+' M'+(m[2]==='L'?''')
rep(r'''#face b.fire{border-color:var(--l);color:var(--l)}''',
r'''#face b.fire{color:var(--l)} /* r.157: FIRE's red border is its lit state, at red only */
#face b{opacity:.5}
#face b.lit{opacity:1;border-color:currentColor;box-shadow:0 0 10px currentColor} /* r.157: the next step is the lit one (TARGET → APPROVE → FIRE); the others dim and stay tappable */''')
rep(r'''  #playHud{top:6px;left:8px;right:344px;font-size:10px} /* r.139: landscape — the strip and the magazine line share one row, side by side */
}''',
r'''  #playHud{top:6px;left:8px;right:344px;font-size:10px} /* r.139: landscape — the strip and the magazine line share one row, side by side */
  #startLight{top:42px} /* r.157: under the magazine line */
}
@media(orientation:portrait){ #app.range #playHud{right:80px} } /* r.157: the strip leaves the right edge to the start light under the magazine line */''')

# ---------------------------------------------------------------------------------------------------------------------------------
# HTML: the mode names, RESTART, the start light
rep(r'''      <option value="bounce">TRAINING · RESET</option>
      <option value="stay">TRAINING · DOWN</option>
      <option value="qual40">QUAL · 40</option>
    </select>
    <button type="button" id="btnRangeReset" title="raise every target again">RESET</button>''',
r'''      <option value="bounce" title="every target up · a hit comes back up">TRAIN UP</option>
      <option value="stay" title="every target up · a hit stays down">TRAIN DOWN</option>
      <option value="qual40" title="40 targets · 4 magazines · starts on green">QUAL 40</option>
    </select>
    <button type="button" id="btnRangeReset" title="start this mode again">RESTART</button>''')
rep(r'''<button id="btnFull" type="button" title="full screen" aria-label="full screen">⤢</button></div>''',
r'''<button id="btnFull" type="button" title="full screen" aria-label="full screen">⤢</button></div>
    <div id="startLight" class="R" data-s="R" role="status" aria-label="start light WAIT"><span class="lamps"><i class="r"></i><i class="y"></i><i class="g"></i></span><b id="startWord">WAIT</b></div>''')

# ---------------------------------------------------------------------------------------------------------------------------------
# lapse ownership: one clock per lane
rep(r'''function lapseIsMine(){ return !(state.lobby&&state.lobby.phase==='LIVE'&&!state.lobby.host); } /* r.135: one lapse clock per room */''',
r'''function lapseIsMine(){ if(!(state.lobby&&state.lobby.phase==='LIVE'&&!state.lobby.host)) return true; const hl=hostLane(); return hl==null||hl!==(state.lane|0); } /* r.135: one lapse clock per room · r.157: one per LANE — the host's clock runs only the host's lane, so a joiner on another lane books its own unfired misses (a joiner who let engagement 1 lapse read HIT 0/0 and no one booked it) */''')

# QUAL ends with a scorecard and the next step
rep(r'''function qualFinish(){ if(state.qualDone) return; state.qualDone=true; state.qualStarted=false; if(lapseIsMine()&&typeof ev==='function') ev('QUAL','P'+(state.qualPh||4),'DONE '+(state.qualH||0)+'/'+(state.qualR||0)); }''',
r'''function qualFinish(){ if(state.qualDone) return; state.qualDone=true; state.qualStarted=false; if(lapseIsMine()&&typeof ev==='function') ev('QUAL','P'+(state.qualPh||4),'DONE '+(state.qualH||0)+'/'+(state.qualR||0)); toast(qualCard()); } /* r.157: the table ends with its score and the next step */
/* r.157 ROUND 1 (operator 2026-10-04, docs/drone-2525/rounds/2026.10.04_09.17..48_19_rounds/ASK.md + Addenda 1–5): the words on the
   glass, the lit button, RELOAD's call and the start light read ONE state. Styling and words only — no tap is gated here. */
function laneWord(i){ return 'LANE '+((((i==null)?state.lane:i)|0)+1); } /* a lane is its number — no slope word on the glass */
function modeSentence(){ const m=state.rangeMode||'bounce'; return laneWord()+' · '+(onSheet()?'SHEET 25 M · ':'')+RANGE_MODE_NAME[m]+' · '+(m==='qual40'?'40 TARGETS · 4 MAGAZINES · STARTS ON GREEN':m==='stay'?'EVERY TARGET UP · A HIT STAYS DOWN':'EVERY TARGET UP · A HIT COMES BACK UP'); } /* Addendum 1: a pick says once what happens next */
function qualCard(){ return 'QUAL DONE · '+(state.qualH||0)+' OF '+IWQ_TOTAL+' · '+qualBadge(state.qualH||0)+' · PRESS RESTART'; }
function hostLane(){ const lb=state.lobby||{}; const hid=state.com&&state.com.hostId; if(!hid) return null; const seats=(lb.launch&&lb.launch.seats)||[]; const s=seats.find(x=>x&&x.peerId===hid)||(lb.members&&lb.members[hid]); return (s&&s.lane!=null)?(+s.lane):null; }
function approveWorksHere(){ const d=state.desig; if(!d||d.phase!=='amber') return false; if(!(state.lobby&&state.lobby.phase==='LIVE')) return true; return !!(d.by&&d.by!==SID&&state.lobby.members&&state.lobby.members[d.by]); } /* the same test approveDesig applies (TWO_HUMANS) */
function fireWorksHere(){ const d=state.desig; if(!d||d.phase!=='red') return false; const markerSeat=String(d.by||'').replace(/^ASM@/,''); return !(d.how&&/^PEER/.test(String(d.how))&&markerSeat&&markerSeat!==SID&&state.lobby&&state.lobby.phase==='LIVE'); } /* the same test fireN applies (NOT_THE_MARKERS_SEAT) */
function nextStep(){ if(!roundOpen()||state.viewMode==='map') return ''; if(state.mag&&(state.mag.rounds|0)<=0) return ''; /* an empty magazine: RELOAD is the one cue */ const d=state.desig;
  if(d&&d.phase==='red') return (fireWorksHere()&&!(state.mag&&(state.mag.rounds|0)<=0))?'FIRE':''; /* an empty magazine: RELOAD calls instead */
  if(d&&d.phase==='amber') return approveWorksHere()?'APPROVE':'';
  if(chNum()===0&&!platesHere().some(q=>q.up&&q.lifePct>0&&(q.fall||0)<0.25&&!(state.rangeMode==='qual40'&&q._eng))) return '';
  return 'TARGET'; }
function reloadCalls(){ const m=state.mag; if(!m||(m.rounds|0)>=(m.cap|0)) return false; const q=state.rangeMode==='qual40'&&+state.challenge===0;
  if((m.rounds|0)<=0) return !(q&&(m.n|0)>=4); /* a fifth magazine would be refused, so it does not call */
  if(q&&chNum()===0&&!state.qualDone){ const R=rangeRun(state.lane||0); return R.phase==='phasegap'&&(m.n|0)<4; } return false; }
function startLight(){ /* Addendum 1: RED wait · YELLOW ready · GREEN fire — read from the clock the targets obey */
  if(chNum()!==0||!rangeArmed()) return 'R';
  const up=q=>!!q&&!!q.up&&q.lifePct>0&&(!onSheet()||sheetHas(q));
  if(rangeTraining()){ if(platesHere().some(up)) return 'G'; return (state.rangeMode||'bounce')==='bounce'?'Y':'R'; }
  if(state.qualDone) return 'R';
  const R=rangeRun(state.lane||0);
  if(R.phase==='up'){ if((R.cur||[]).some(id=>up(PLATES.find(p=>p.id===id)))) return 'G'; const nx=engagementAt(state.lane||0,R.k+1); if(!nx) return 'R'; const rest=(R.eng&&nx.ph!==R.eng.ph)?PHASE_GAP_S:ENG_GAP_S; return (Math.max(0,(R.eng?R.eng.sec:5)-R.t)+rest)<=3?'Y':'R'; }
  const gap=R.phase==='phasegap'?PHASE_GAP_S:ENG_GAP_S; return (gap-(R.t||0))<=3?'Y':'R'; }
function lightWord(L){ return L==='G'?'FIRE':L==='Y'?'READY':'WAIT'; } /* redundant with the colour, for colour-blind players */
function paintLight(L){ const sl=document.getElementById('startLight'); if(!sl||sl.getAttribute('data-s')===L) return; sl.setAttribute('data-s',L); sl.className=L; const w=document.getElementById('startWord'); if(w) w.textContent=lightWord(L); sl.setAttribute('aria-label','start light '+lightWord(L)); }
function paintCues(){ const app=document.getElementById('app'); if(app) app.classList.toggle('range',chNum()===0);
  const nx=nextStep(); [['fTgt','TARGET'],['fAppr','APPROVE'],['fFire','FIRE']].forEach(p=>{ const b=document.getElementById(p[0]); if(b) b.classList.toggle('lit',nx===p[1]); });
  const rl=document.getElementById('btnReload'); if(rl) rl.classList.toggle('call',reloadCalls());
  const rr=document.getElementById('btnRangeReset'); if(rr) rr.classList.toggle('call',chNum()===0&&((state.rangeMode==='qual40'&&!!state.qualDone)||(state.rangeMode==='stay'&&!!state.rangeAllDown)));
  paintLight(startLight()); }
function lockText(lk){ if(!lk) return ''; return (lk.ref&&lk.ref.form)?plateWord(lk.id):(String(lk.id)+' '+(+lk.dist||0).toFixed(0)+'M'); } /* the LOCK line in plain words */
function isDiag(){ try{ return /[?&]diag=1(&|$)/.test(location.search||''); }catch(e){ return false; } }
function cornerLabel(){ const u=units[state.unit]||{}; return (u.label||'')+(isDiag()?' · SPIRAL v'+state.spiral:''); } /* "LANE 21"; the build counter only with ?diag=1 */
function laneRestartFromRow(d){ /* another lane's Restart touches only that lane — never my mode, my table or my box */
  const ln=d.lane|0, train=(d.mode||'bounce')!=='qual40', sheet=d.targets==='sheet';
  PLATES.forEach(q=>{ if(q.lane!==ln) return; const up=train&&(!sheet||!!SHEET_LAYOUT[q.base]); q.holes=[]; q._hit=false; q.up=up; q.lifePct=100; q.life=up?1e9:0; q.fall=up?0:1; q._dead=0; q._down=false; q._eng=false; q._ret=0; q.mist=false; });
  rangeRunReset(ln); toast(laneWord(ln)+' RESTARTED'); }''')

rep(r'''const RANGE_MODE_NAME={bounce:'TRAINING · RESET',stay:'TRAINING · DOWN',qual40:'QUAL · 40'};''',
r'''const RANGE_MODE_NAME={bounce:'TRAIN UP',stay:'TRAIN DOWN',qual40:'QUAL 40'}; /* r.157 (operator 2026-10-04): his names — Train Up · Train Down · Qual 40 */''')

# ---------------------------------------------------------------------------------------------------------------------------------
# the splash: from the bottom of the hit target
rep(r'''function splashCentre(f){ /* r.156 (operator 2026-10-04): the hit splash originates from the centre of the hit target — worldOf is the one centre of mass (qWorld + plateDims for a plate); a falling plate's centre lowers toward its base as the silhouette folds */
  const ref=f&&f.ref; const c=worldOf(ref); let y=c.y; const fall=ref&&ref.fall>0?Math.min(1,ref.fall):0;
  if(fall>0) y=(c.base||0)+(c.y-(c.base||0))*(1-fall); return {x:c.x,y,z:c.z}; }''',
r'''function baseOf(ref){ /* r.157 (operator 2026-10-04, Addendum 5: "splash-ring as oval from bottom of target works"): the BOTTOM of a target, centred under it — a plate's foot (qWorld), moving back with the fold exactly as silMesh draws it; for a door, a pop-up, a drone or an aircraft the ground under it (the scene ground is y 0). Never worldOf(): for anything but a plate that is its stored height (a door's 3.2 m, a drone's 12 m). */
  if(!ref) return {x:0,y:0,z:0};
  if(ref.form&&ref.id&&String(ref.id).charAt(0)==='C'&&typeof qWorld==='function'){ const w=qWorld(ref); const D=plateDims(ref); return {x:w.x,y:w.y||0,z:w.z+(ref.fall||0)*D.h*0.4}; }
  return {x:ref.x||0,y:0,z:ref.z||0}; }
function splashBase(f){ return baseOf(f&&f.ref); } /* r.157: the ring's centre, asked every frame — it rides a moving drone and stays under a falling plate */''')
rep(r'''    const f=state.fx, k=1-(state.clock-f.t)/0.45, c=splashCentre(f); /* r.156: from the centre of the hit target, every frame */''',
r'''    const f=state.fx, k=1-(state.clock-f.t)/0.45, c=splashBase(f); /* r.157: from the bottom of the hit target (r.156: its centre), every frame — the same flat ring, read as an oval */''')

# ---------------------------------------------------------------------------------------------------------------------------------
# 15 m lanes, one constant; no slope word on the turret label
rep(r'''const RANGE_WIRE=[];
const LANES=Array.from({length:42},(_,i)=>{''',
r'''const RANGE_WIRE=[];
const LANE_W=15, LANE_HALF_W=LANE_W/2; /* r.157 (operator 2026-10-04: "ensure targets are in between left and right lane markers"): ONE lane width drives the lane centres, the lane lines and the boards — 15 m, so the widest silhouette (the 300 m E at 6.4 m) keeps 0.85 m inside its lines (10 m lanes put the 150/250/300 m targets in the neighbour's lane) */
const LANES=Array.from({length:42},(_,i)=>{''')
rep(r'''  return {id:'L'+String(i+1).padStart(2,'0'),i,x:-205+i*10,z:0,y:2.2+ (kind==='UP'?1.4:kind==='DOWN'?-0.6:0),kind,slope};''',
r'''  return {id:'L'+String(i+1).padStart(2,'0'),i,x:(i-20.5)*LANE_W,z:0,y:2.2+ (kind==='UP'?1.4:kind==='DOWN'?-0.6:0),kind,slope};''')
rep(r'''    u.x=L.x; u.y=L.y; u.z=0; u.yaw=0; u.pan=0; u.tilt=0; u.label=L.id+' '+L.kind;''',
r'''    u.x=L.x; u.y=L.y; u.z=0; u.yaw=0; u.pan=0; u.tilt=0; u.label=laneWord(L.i); /* r.157: "LANE 21", no slope word */''')

# the range wire: lanes and targets only (Addendum 3)
rep(r'''  const grid=[];
  for(let z=-8;z<=310;z+=25) grid.push([[-220,0,z],[220,0,z]]);
  for(let x=-220;x<=220;x+=20) grid.push([[x,0,-8],[x,0,310]]);
  addR(T13.STROKE,grid);
  addR(T13.GIMBAL,[[[-210,0,0],[210,0,0]]]);
  [50,100,150,200,250,300].forEach(m=>addR(T13.ROAD,[[[-210,0,m],[210,0,m]]]));
  addR(T13.WIRE,box(0,0,308,430,3.2,6));
  LANES.forEach(L=>{
    const y1=L.y, y2=L.y+L.slope*300;
    const col=L.kind==='QUAL'?T13.GIMBAL:L.kind==='UP'?T13.TAG:T13.WATER;
    addR(col,[[[L.x,y1,0],[L.x,y2,300]]]); addR(col,box(L.x,y1,0,2.2,1.2,2.2),L.i);
  });''',
r'''  const span=LANES.length*LANE_HALF_W+10; /* r.157: the dim ground spans every lane (42 × 15 m) */
  const grid=[];
  for(let z=-8;z<=310;z+=25) grid.push([[-span,0,z],[span,0,z]]);
  for(let x=-Math.floor(span/20)*20;x<=span;x+=20) grid.push([[x,0,-8],[x,0,310]]);
  RANGE_WIRE.push({c:T13.STROKE,s:grid,lane:null,map:true}); /* r.157: the ground grid is the MAP's only — on the range picture it drew lines across the lanes */
  /* r.157 (Addendum 3, his 7:48 screenshots): the range shows lanes and targets only — the slope-coloured lane rays (green/orange/blue), the firing line, the distance lines and the berm crossed the picture; the pits stay, neutral */
  LANES.forEach(L=>{ addR(T13.STROKE,box(L.x,L.y,0,2.2,1.2,2.2),L.i); });''')

# the map: no slope words or slope colours
rep(r'''      segs(box(L.x,L.y,0,3.2,1.6,3.2), mine?T13.LOCK:L.kind==='QUAL'?T13.GIMBAL:L.kind==='UP'?T13.TAG:T13.WATER);''',
r'''      segs(box(L.x,L.y,0,3.2,1.6,3.2), mine?T13.LOCK:T13.WIRE); /* r.157: lanes by number, not by slope colour */''')
rep(r'''  hc.fillText('MAP · 42 LANES · tap L## · QUAL gold · UP green · DOWN blue',12,H-64);''',
r'''  hc.fillText('MAP · 42 LANES · TAP A LANE TO SIT IN IT',12,H-64);''')
rep(r'''    if(L.i%7===0||Math.abs(L.i-(state.lane||0))<=2) hc.fillText(L.id+' '+L.kind[0],pr.x,pr.y);''',
r'''    if(L.i%7===0||Math.abs(L.i-(state.lane||0))<=2) hc.fillText(String(L.i+1),pr.x,pr.y);''')

# ---------------------------------------------------------------------------------------------------------------------------------
# draw(): no blue ground grid on the range; my lane outside the budget; LOCK + corner in plain words
rep(r'''  state.segs=0;state.dropped=0;''',
r'''  state.segs=0;state.dropped=0;state.ownSegs=0;state.ownCulled=0;''')
rep(r'''  for(let i=-200;i<=200;i+=S.grid){''',
r'''  for(let i=-200;i<=200&&chNum()!==0;i+=S.grid){ /* r.157: not on the range — at MoT 1 these were the blue lines across the picture (Addendum 3) */''')
rep(r'''      v.moveTo(a.x,a.y);v.lineTo(b.x,b.y);state.segs++;
    });
    v.stroke();
  }
  if(chNum()===0){ drawPlates(segs); drawLaneMarkers(segs); RANGE_WIRE.forEach(''',
r'''      v.moveTo(a.x,a.y);v.lineTo(b.x,b.y);state.segs++;
    });
    v.stroke();
  }
  function segsOwn(arr,col){ /* r.157: my lane's targets and its two edges of boards are the shooter's own picture — drawn outside the world budget (counted), the way the splash is; at MoT 1.1 on lane 21 the neighbour lane's silhouettes spent the 280 and mine were dropped */
    v.strokeStyle=col;v.lineWidth=fw;v.beginPath();
    arr.forEach(e=>{ const a=proj(e[0],cam,W,H),b=proj(e[1],cam,W,H); if(!a||!b){ state.ownCulled++; return; } v.moveTo(a.x,a.y);v.lineTo(b.x,b.y);state.ownSegs++; }); /* counted into state.segs at the end of the frame, so they never spend the world's budget either */
    v.stroke();
  }
  if(chNum()===0){ drawPlates(segs,segsOwn); drawLaneMarkers(segs,segsOwn); RANGE_WIRE.forEach(''')
rep(r'''RANGE_WIRE.forEach(g=>{ if(g.lane!=null&&S.maj<=2&&Math.abs(g.lane-(state.lane||0))>1) return; segs(g.s,g.c); }); } /* r.130''',
r'''RANGE_WIRE.forEach(g=>{ if(g.map) return; if(g.lane!=null&&S.maj<=2&&Math.abs(g.lane-(state.lane||0))>1) return; segs(g.s,g.c); }); } /* r.130''')
rep(r'''hc.fillText(_fT,W-12,hudStatusY(W,H,hc.measureText(((units[state.unit]||{}).label||'')+' · SPIRAL v'+state.spiral).width,hc.measureText(_fT).width).f); }''',
r'''hc.fillText(_fT,W-12,hudStatusY(W,H,hc.measureText(cornerLabel()).width,hc.measureText(_fT).width).f); }''')
rep(r'''{ const _sT=units[state.unit].label+' · SPIRAL v'+state.spiral; hc.fillText(''',
r'''{ const _sT=cornerLabel(); hc.fillText(''')
rep(r'''const fr=f.getBoundingClientRect(); state.faceBox={l:fr.left-sr.left,t:fr.top-sr.top,r:fr.right-sr.left,b:fr.bottom-sr.top,jt:rr.top-sr.top};''',
r'''const fr=f.getBoundingClientRect(); state.faceBox={l:fr.left-sr.left,t:fr.top-sr.top,r:fr.right-sr.left,b:fr.bottom-sr.top,jt:rr.top-sr.top,jl:rr.left-sr.left,jr:rr.right-sr.left,jb:rr.bottom-sr.top}; /* r.157: the stick's box too, so "LANE 21" never prints over it */''')
rep(r'''  const hit=(y,w)=>W-12-w<fb.r&&W-12>fb.l&&y+4>fb.t&&y-12<fb.b;
  if(hit(s,wS)||hit(f,wF)){''',
r'''  const hit=(y,w)=>(W-12-w<fb.r&&W-12>fb.l&&y+4>fb.t&&y-12<fb.b)||(fb.jl!=null&&W-12-w<fb.jr&&W-12>fb.jl&&y+4>fb.jt-16&&y-12<fb.jb); /* r.157: nor over the HEAD stick or its label (Sofia: the corner printed over the stick) */
  if(hit(s,wS)||hit(f,wF)){''')
rep(r'''  slotBoxes().forEach(b=>segs(b.s,b.col)); /* r.149: the voxel around every marked target, amber / red */''',
r'''  slotBoxes().forEach(b=>(chNum()===0?segsOwn:segs)(b.s,b.col)); /* r.149: the voxel around every marked target, amber / red · r.157: on the range it is my lane's own line, never the budget's to drop */''')
rep(r'''  state.drawDone=(state.drawDone||0)+1; /* r.130: the frame reached its last line (the QA row DRAW_COMPLETES reads this) */''',
r'''  state.segs+=state.ownSegs|0; /* r.157: my lane's own lines, counted once the world has had its budget */
  state.drawDone=(state.drawDone||0)+1; /* r.130: the frame reached its last line (the QA row DRAW_COMPLETES reads this) */''')
rep(r'''function hudPhase(){ /* r.134: one writer for the phase strip, run in every view */''',
r'''function hudPhase(){ /* r.134: one writer for the phase strip, run in every view */
  { const pc=document.getElementById('phCH'); if(pc) pc.textContent=chNum()===0?'':'CH'+chNum()+' D'+(state.diff||3); } /* r.157: no "CH0 D3" on the range — the strip's writer owns it */''')
rep(r'''push('MAP_KEEPS_THE_STRIP', !thrown&&/AMBER/.test(pdT)&&pdT.indexOf(q.id)>=0,''',
r'''push('MAP_KEEPS_THE_STRIP', !thrown&&/AMBER/.test(pdT)&&pdT.indexOf(plateWord(q.id))>=0&&pdT.indexOf(q.id)<0,''')
rep(r'''hc.fillStyle=T13.GIMBAL;hc.fillText(lk.id+' '+lk.dist.toFixed(0)+'M',60,H-20);}''',
r'''hc.fillStyle=T13.GIMBAL;hc.fillText(lockText(lk),60,H-20);} /* r.157: "50 M RIGHT", not C-50-L21 */''')
rep(r'''  if(chNum()===0&&typeof laneMarkers==='function'){ hc.font='10px ui-monospace,monospace'; hc.textAlign='center'; lanesInView().forEach(l=>laneMarkers(l).forEach(m=>{ const pr=proj([m.x,m.y0+MARKER_POST+MARKER_BOARD/2,m.z],cam,W,H); if(!pr||pr.x<0||pr.x>W||pr.y<0||pr.y>H) return; hc.fillStyle=l===(state.lane||0)?T13.SI:T13.STROKE; hc.fillText(String(m.n),pr.x,pr.y+3); })); hc.textAlign='left'; }''',
r'''  if(chNum()===0&&typeof laneMarkers==='function'){ hc.textAlign='center'; boardLabels(hc,W,H,cam).forEach(b=>{ hc.fillStyle=b.mine?T13.SI:T13.STROKE; hc.fillText(b.txt,b.x,b.y); }); hc.textAlign='left'; } /* r.157: each board names the lane on each side ("◂ 21 · 22 ▸"), written above its board; a nearer board's words win and a farther one that would overprint is not written (the "21 21" stacking) */''')

# labels only while marked, in plain words
rep(r'''    const ph=isHot?(state.desig&&state.desig.phase==='red'?'RED':'AMBER'):''; const cap=(slK?'T'+slK+' · ':'')+(q.pos||q.base)+(rangeTraining()?'':' · '+Math.max(0,Math.ceil(q.life))+'s')+(ph?' · '+ph:'');''',
r'''    if(!isHot&&!slK) return; /* r.157 (operator 2026-10-04, his pick "Label only while marked"): a standing target carries no label — only the marked one (amber or red) */
    const ph=isHot?(state.desig&&state.desig.phase==='red'?'RED':'AMBER'):(state.tgtSlot[slK].phase==='red'?'RED':'AMBER'); const cap=(slK?'T'+slK+' · ':'')+plateWord(q.id)+(rangeTraining()?'':' · '+Math.max(0,Math.ceil(q.life))+'s')+(ph?' · '+ph:''); /* r.157: plain words, the toast's own ("150 M RIGHT"), never "150M E" */''')

# lane markers on both sides
rep(r'''const LANE_MARKER_Z=[100,200,300]; const LANE_HALF_W=5; const MARKER_POST=1.2, MARKER_BOARD=0.5;
function laneMarkers(lane){ const L=LANES[lane|0]; if(!L) return []; const out=[]; const y0=z=>(L.y-2.2)+(L.slope||0)*z;
  LANE_MARKER_Z.forEach(z=>{ out.push({lane:L.i,n:L.i+1,x:L.x-LANE_HALF_W,z,y0:y0(z),edge:'L'}); if(L.i===LANES.length-1) out.push({lane:L.i,n:L.i+1,x:L.x+LANE_HALF_W,z,y0:y0(z),edge:'R'}); }); return out; }''',
r'''const LANE_MARKER_Z=[100,200,300]; const MARKER_POST=1.2, MARKER_BOARD=0.5; /* r.157: LANE_HALF_W is LANE_W/2, declared once with the lanes */
/* r.157 (operator 2026-10-04: "ensure lane markers exist at 100, 200, and 300 m on both sides of each lane (<— 40 , 41 —>)"): every lane
   has a board on BOTH edges at 100/200/300 m, standing on its own lane's ground; each names the lane on each side of the line with an
   arrow pointing to it ("◂ 40 · 41 ▸"), lane 1's outer edge "1 ▸", lane 42's "◂ 42" — 252 boards on 129 posts. */
function laneBoardText(a,b){ return (a&&b)?('◂ '+a+' · '+b+' ▸'):b?(b+' ▸'):('◂ '+a); }
function laneMarkers(lane){ const L=LANES[lane|0]; if(!L) return []; const out=[]; const y0=z=>(L.y-2.2)+(L.slope||0)*z; const n=L.i+1, N=LANES.length, a=n>1?n-1:0, b=n<N?n+1:0;
  LANE_MARKER_Z.forEach(z=>{ out.push({lane:L.i,n,x:L.x-LANE_HALF_W,z,y0:y0(z),edge:'L',left:a,right:n,txt:laneBoardText(a,n)}); out.push({lane:L.i,n,x:L.x+LANE_HALF_W,z,y0:y0(z),edge:'R',left:n,right:b,txt:laneBoardText(n,b)}); }); return out; }''')
rep(r'''function drawLaneMarkers(segs){ lanesInView().forEach(l=>laneMarkers(l).forEach(m=>segs(markerSegs(m),l===(state.lane||0)?T13.SI:T13.STROKE))); }''',
r'''function markersInView(){ const me=state.lane||0; const out=[]; lanesInView().forEach(l=>laneMarkers(l).forEach(m=>{ if((l<me&&m.edge==='R')||(l>me&&m.edge==='L')) return; out.push(m); })); return out; } /* r.157: my two edges and the neighbours' far edges — a shared post is drawn once, as mine */
function boardLabels(hc,W,H,cam){ /* r.157: the boards' words, nearest first (mine before a neighbour's at the same range), above each board, never over a caption or another board's words — one placement for the painter and the QA */
  hc.font='10px ui-monospace,monospace'; const me=state.lane||0; const taken=plateCaptionRects(hc,W,H).map(c=>({x0:c.x0,x1:c.x1,y0:c.y0,y1:c.y1})); const out=[];
  taken.push({x0:W/2-46,x1:W/2+46,y0:H*.46-46,y1:H*.46+46}); /* nor over the bullseye */
  { const st=document.getElementById('stage'); const sr=st&&st.getBoundingClientRect(); if(sr) ['playHud','magBar','startLight','board'].forEach(id=>{ const e=document.getElementById(id); if(!e||getComputedStyle(e).display==='none') return; const r=e.getBoundingClientRect(); if(r.width>0&&r.height>0) taken.push({x0:r.left-sr.left,x1:r.right-sr.left,y0:r.top-sr.top,y1:r.bottom-sr.top,dom:id}); }); } /* nor under the strip, the magazine line or the light (the DOM sits over the canvas, so words there overprint) */
  markersInView().slice().sort((a,b)=>(a.z-b.z)||((b.lane===me)-(a.lane===me))).forEach(m=>{ const pr=proj([m.x,m.y0+MARKER_POST+MARKER_BOARD,m.z],cam,W,H); if(!pr||pr.x<0||pr.x>W||pr.y<0||pr.y>H) return; const tw=hc.measureText(m.txt).width; const r={x0:pr.x-tw/2-2,x1:pr.x+tw/2+2,y0:pr.y-15,y1:pr.y-1};
    if(taken.some(t=>r.x0<t.x1&&t.x0<r.x1&&r.y0<t.y1&&t.y0<r.y1)) return; taken.push(r); out.push({txt:m.txt,x:pr.x,y:pr.y-4,mine:m.lane===me,lane:m.lane,z:m.z,edge:m.edge,...r}); }); return out; }
function drawLaneMarkers(segs,own){ own=own||segs; const me=state.lane||0; markersInView().forEach(m=>(m.lane===me?own:segs)(markerSegs(m),m.lane===me?T13.SI:T13.STROKE)); }''')
rep(r'''function drawPlates(segs){
  const sheet=onSheet();
  if(sheet){ const sw=sheetWorld(state.lane||0); const hw=SHEET.w/2; segs(''',
r'''function drawPlates(segs,own){ own=own||segs; /* r.157: my lane's targets go through own (outside the world budget); the neighbours' through segs */
  const sheet=onSheet();
  if(sheet){ const sw=sheetWorld(state.lane||0); const hw=SHEET.w/2; own(''')
rep(r'''    segs(silMesh(q),(hot(q)||q.mist)?T13.LOCK:(sheet&&!q.up)?T13.STROKE:mine?T13.SI:T13.STROKE);
    if(sheet&&q.holes&&q.holes.length){ const w=qWorld(q); q.holes.forEach(h=>segs(''',
r'''    (mine?own:segs)(silMesh(q),(hot(q)||q.mist)?T13.LOCK:(sheet&&!q.up)?T13.STROKE:mine?T13.SI:T13.STROKE);
    if(sheet&&q.holes&&q.holes.length){ const w=qWorld(q); q.holes.forEach(h=>own(''')

# ---------------------------------------------------------------------------------------------------------------------------------
# one plain status line
rep(r'''  const ch=document.getElementById('phCH'); if(ch) ch.textContent='CH'+chNum()+' D'+(state.diff||3);''',
r'''  const ch=document.getElementById('phCH'); if(ch) ch.textContent=chNum()===0?'':'CH'+chNum()+' D'+(state.diff||3); /* r.157: no "CH0 D3" on the range */''')
rep(r'''  const pch=document.getElementById('phCH'); if(pch) pch.textContent='CH'+chNum()+' D'+(state.diff||3);
  hudPhase(); hudTail(u,S);''',
r'''  const pch=document.getElementById('phCH'); if(pch) pch.textContent=chNum()===0?'':'CH'+chNum()+' D'+(state.diff||3);
  hudPhase(); paintCues(); hudTail(u,S); /* r.157: the lit button, RELOAD's call and the start light, every frame */''')
rep(r'''    if(ph==='red'){pd.textContent='RED T'+(state.desig.slot||state.slot||1)+' '+state.desig.id; pd.style.color='#E24B3B';}
    else if(ph==='amber'){pd.textContent='AMBER T'+(state.desig.slot||1)+' '+state.desig.id+(seatWord(state.desig.by)?' · MARKED BY '+seatWord(state.desig.by):''); pd.style.color='#F0A020';} /* r.133: the AI member's mark is attributed on the strip */
    else if(ls){pd.textContent='LAST T'+ls.slot+' '+ls.id+' '+(ls.dead?'DOWN':((ls.life|0)+'%'+(ls.direct?' DIRECT':' OFF'))); pd.style.color='#F0A020';} /* r.133: a downed target is DOWN — 'DIRECT' is also the link path's name */''',
r'''    if(ph==='red'){pd.textContent='RED · T'+(state.desig.slot||state.slot||1)+' · '+plateWord(state.desig.id)+' · '+(fireWorksHere()?'PRESS FIRE':'THE OTHER SEAT FIRES'); pd.style.color='#E24B3B';} /* r.157: one plain line — the target in words and the next step */
    else if(ph==='amber'){pd.textContent='AMBER · T'+(state.desig.slot||1)+' · '+plateWord(state.desig.id)+(seatWord(state.desig.by)?' · MARKED BY '+seatWord(state.desig.by):'')+' · '+(approveWorksHere()?'PRESS APPROVE':'THE OTHER SEAT APPROVES'); pd.style.color='#F0A020';} /* r.133: the AI member's mark is attributed on the strip */
    else if(ls){pd.textContent='LAST · '+plateWord(ls.id)+' · '+(ls.dead?'DOWN':(String(ls.id||'').charAt(0)==='C'?'MISS':((ls.life|0)+'%'+(ls.direct?' DIRECT':' OFF')))); pd.style.color='#F0A020';} /* r.133: a downed target is DOWN · r.157: plain words, never C-100C-L21 */''')
rep(r'''  if(b) b.innerHTML=rows.map(r=>`<div class="${r.phase==='red'?'r':'a'}">T${r.n} ${r.phase==='red'?'RED':'AMBER'} ${r.id}</div>`).join('')||'';''',
r'''  if(b) b.innerHTML=chNum()===0?'':(rows.map(r=>`<div class="${r.phase==='red'?'r':'a'}">T${r.n} ${r.phase==='red'?'RED':'AMBER'} ${plateWord(r.id)}</div>`).join('')||''); /* r.157: on the range the strip says it once; elsewhere in plain words */''')
rep(r'''(state.rangeAllDown?' · ALL DOWN · PRESS RESET':'')''',
r'''(state.rangeAllDown?' · ALL DOWN · PRESS RESTART':'')''')
rep(r'''    ps.textContent=state.qualDone?('QUAL '+(state.qualH||0)+'/'+IWQ_TOTAL+' '+qualBadge(state.qualH||0)):(e?''',
r'''    ps.textContent=state.qualDone?qualCard():(e?''')
rep(r''':'QUAL · 40 · READY')+' · HIT ''',
r''':'QUAL 40 · READY')+' · HIT ''')
rep(r'''if(state.rangeAllDown) return 'ALL DOWN · RESET';''',
r'''if(state.rangeAllDown) return 'ALL DOWN · PRESS RESTART';''')
rep(r'''if(state.qualDone) return 'QUAL COMPLETE · RESET FOR ANOTHER';''',
r'''if(state.qualDone) return 'QUAL DONE · PRESS RESTART FOR ANOTHER';''')
rep(r'''        const done=qr.done?' · '+qualBadge(qr.hits):'';''',
r'''        const done=qr.done?' · '+qualCard():''; /* r.157: the last round says the score and the next step */''')
rep(r'''{toast('WRONG LANE · SIT '+(LANES[ref.lane]&&LANES[ref.lane].id)+' TO ENGAGE');return;}''',
r'''{toast('WRONG LANE · SIT IN '+laneWord(ref.lane)+' TO ENGAGE');return;}''')

# ---------------------------------------------------------------------------------------------------------------------------------
# rooms score by lane
rep(r'''if(/^HIT/.test(res)){ state.rangeHit=(state.rangeHit|0)+1; state.lastShot={id,slot:(state.desig&&state.desig.slot)||1,life:0,direct:true,dead:true,by:row.data&&row.data.by}; rangeRelease(o); toast(''',
r'''if(/^HIT/.test(res)){ const myLane=(o.lane|0)===(state.lane|0); if(myLane){ state.rangeHit=(state.rangeHit|0)+1; state.lastShot={id,slot:(state.desig&&state.desig.slot)||1,life:0,direct:true,dead:true,by:row.data&&row.data.by}; state.fx={t:state.clock,id,direct:true,ref:o}; } rangeRelease(o); if(myLane) toast(''')
rep(r'''      if((o.lifePct||0)<=0&&!o.form) o.up=false;''',
r'''      if((o.lifePct||0)<=0&&!o.form) o.up=false;
      if(!o.form&&row.peerId&&row.peerId!==SID&&/^HIT/.test(res)) state.fx={t:state.clock,id,direct:true,ref:o}; /* r.157: the other seat's hit splashes here too, at the same base point */''')
rep(r'''state.rangeMiss=(state.rangeMiss|0)+1; state.lastShot={id,slot:1,life:100,direct:false,dead:false,by:row.data&&row.data.by}; toast('THE OTHER SEAT MISSED · '+plateWord(id)); }''',
r'''if((o.lane|0)===(state.lane|0)){ state.rangeMiss=(state.rangeMiss|0)+1; state.lastShot={id,slot:1,life:100,direct:false,dead:false,by:row.data&&row.data.by}; toast('THE OTHER SEAT MISSED · '+plateWord(id)); } } /* r.157: another lane's miss never reaches my strip */''')
rep(r'''  if(row.verb==='RESET' && row.peerId && row.peerId!==SID){ releaseAuthority('PEER RESET');''',
r'''  if(row.verb==='RESET' && row.peerId && row.peerId!==SID && row.data && row.data.lane!=null && (row.data.lane|0)!==(state.lane|0)){ laneRestartFromRow(row.data); } /* r.157: another lane's Restart restarts only that lane */
  else if(row.verb==='RESET' && row.peerId && row.peerId!==SID){ releaseAuthority('PEER RESET');''')
rep(r'''state.lastShot=null; toast('THE OTHER SEAT RESET THE RANGE'); }''',
r'''state.lastShot=null; toast('THE OTHER SEAT RESTARTED '+laneWord()); }''')

# ---------------------------------------------------------------------------------------------------------------------------------
# menu wiring, the one sentence per pick
rep(r'''_more.onclick=()=>{ const on=_mpop.style.display==='flex'; _mpop.style.display=on?'none':'flex'; _mpop.classList.toggle('hide',on); };''',
r'''_more.onclick=()=>{ const on=_mpop.style.display==='flex'; _mpop.style.display=on?'none':'flex'; _mpop.classList.toggle('hide',on); const app=document.getElementById('app'); if(app) app.classList.toggle('more',!on); _more.classList.toggle('on',!on); }; /* r.157: MORE also shows the range's hidden pickers */''')
rep(r'''toast('PRESS RESET AGAIN TO DISCARD '+(state.qualR|0)+' ROUNDS OF THIS TABLE');''',
r'''toast('PRESS RESTART AGAIN TO DISCARD '+(state.qualR|0)+' ROUNDS OF THIS TABLE');''')
rep(r'''if(rangeResetOnRecord('BUTTON')) toast('RANGE RESET · ON THE RECORD'); };''',
r'''if(rangeResetOnRecord('BUTTON')) toast('RESTARTED · '+modeSentence()); };''')
rep(r'''  rangeResetOnRecord('MODE');
  toast(RANGE_MODE_NAME[state.rangeMode]+(state.rangeMode==='qual40'?' · IWQ TABLE VI · 40 TARGETS · 18 ENGAGEMENTS · 4 MAGAZINES OF 10 · YOU RELOAD AT EACH POSITION · OPTIC 3× · 23 MARKSMAN 30 SHARP 36 EXPERT':state.rangeMode==='stay'?' · EVERY TARGET IS UP · A HIT TARGET STAYS DOWN':' · EVERY TARGET IS UP · A HIT TARGET COMES BACK'));
  if(typeof goRange==='function') goRange();''',
r'''  rangeResetOnRecord('MODE'); /* r.157: goRange says the one sentence ("LANE 21 · QUAL 40 · 40 TARGETS · 4 MAGAZINES · STARTS ON GREEN") — the 148-character line here was overwritten in the same tick */''')
rep(r'''    toast('QUAL40 LANE LOCK · '+laneNow().id);''',
r'''    toast('QUAL 40 IS RUNNING · '+laneWord()+' STAYS');''')
rep(r'''  toast(L.id+' · '+L.kind+(L.slope>0?' UPHILL':L.slope<0?' DOWNHILL':' FLAT QUAL'));''',
r'''  toast(laneWord()+' · YOUR TARGETS ARE IN FRONT OF YOU'); /* r.157: no slope word */''')
rep(r'''  const mp=document.getElementById('modePick'); if(mp)mp.value='range';''',
r'''  const mp=document.getElementById('modePick'); if(mp)mp.value='range';
  const pl=document.getElementById('plat'); if(pl) pl.value='T1'; /* r.157: the platform picker says TURRET while I sit in a turret (it said QUAD) */''')
rep(r'''  toast('RANGE · '+L.id+' '+L.kind+' · '+(onSheet()?'SHEET 25 M · ':'')+RANGE_MODE_NAME[state.rangeMode||'bounce']);''',
r'''  toast(modeSentence()); if(typeof paintCues==='function') paintCues(); /* r.157: the one sentence for the pick */''')
rep(r'''  LANES.forEach(L=>{const o=document.createElement('option'); o.value=String(L.i); o.textContent=L.id+' '+L.kind; lp.appendChild(o);});''',
r'''  LANES.forEach(L=>{const o=document.createElement('option'); o.value=String(L.i); o.textContent=laneWord(L.i); lp.appendChild(o);}); /* r.157: "LANE 21" */''')
rep(r'''  toast('CH0 PRACTICE · NO ROOM');''',
r'''  toast('PRACTICE · '+modeSentence()); /* r.157: the mode and the next step */''')

# ---------------------------------------------------------------------------------------------------------------------------------
# QA rows
rep(r'''    { /* r.156 · SPLASH_FROM_TARGET_CENTRE — the hit splash projects onto the hit plate's centre of mass (the draw's projector), and a miss draws none */
      const offOf=base=>{ state.fx=null; const r=shootPlate(base,0); const f=state.fx; const cam=camOf(units[state.unit]); const c=(f&&f.ref)?splashCentre(f):null, w=worldOf(r.q);
        const pc=c?proj([c.x,c.y,c.z],cam,W,H):null, pw=proj([w.x,w.y,w.z],cam,W,H); return {ok:r.dead&&!!f&&f.ref===r.q&&!!pc&&!!pw, off:(pc&&pw)?Math.hypot(pc.x-pw.x,pc.y-pw.y):999}; };
      const s50=offOf('C-50'), s300=offOf('C-300'); const fx0=state.fx;''',
r'''    { /* r.157 · SPLASH_FROM_TARGET_BASE (Addendum 5: "splash-ring as oval from bottom of target works") — on the HIT frame (fall 0.05) the ring's centre is the plate's foot (world ≤ 0.05 m, derived here from qWorld, not from the helper), it projects under the plate (≤ 2 px across, at or below its bottom edge), it is NOT the centre of mass (≥ 0.15 m below it), the ring is an oval on the picture (wider than tall); a door and a drone ring the ground under them; a miss draws none; one frame strokes all 16 segments */
      const at=base=>{ state.fx=null; const r=shootPlate(base,0); const f=state.fx; const q=r.q; const cam=camOf(units[state.unit]); const c=(f&&f.ref)?splashBase(f):null; const w=qWorld(q), D=plateDims(q); const want={x:w.x,y:w.y||0,z:w.z+(q.fall||0)*D.h*0.4};
        const dist=c?Math.hypot(c.x-want.x,c.y-want.y,c.z-want.z):99; const above=c?(worldOf(q).y-c.y):0; const rc=plateRect(q); const pc=c?proj([c.x,c.y,c.z],cam,W,H):null;
        const pts=c?ring(c.x,c.y,c.z,1.2,16).map(e=>proj(e[0],cam,W,H)).filter(Boolean):[]; let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; pts.forEach(p=>{ x0=Math.min(x0,p.x); x1=Math.max(x1,p.x); y0=Math.min(y0,p.y); y1=Math.max(y1,p.y); });
        const dx=(pc&&rc)?Math.abs(pc.x-rc.cx):99, under=(pc&&rc)?(pc.y-rc.bot):-99;
        return {ok:r.dead&&!!f&&f.ref===q&&(q.fall||0)<=0.05+1e-9&&dist<=0.05&&dx<=2&&under>=-1&&above>=0.15&&pts.length===16&&(x1-x0)>(y1-y0), dist, dx, under, above, w:x1-x0, h:y1-y0}; };
      const s50=at('C-50'), s300=at('C-300'); const fx0=state.fx;''')
rep(r'''      const none=state.fx===fx0; state.fx=null;
      push('SPLASH_FROM_TARGET_CENTRE', s50.ok&&s300.ok&&s50.off<=2&&s300.off<=2&&missed&&none&&drawn===16, '50m off '+s50.off.toFixed(1)+'px · 300m off '+s300.off.toFixed(1)+'px · miss: '+(missed?(none?'no splash':'a splash was drawn'):'not a miss ('+state.lastBand+')')+' · drawn '+drawn+'/16 segs (world wire dropped '+dropped+')'+(dErr?' · draw threw '+dErr:'')); }''',
r'''      const none=state.fx===fx0; state.fx=null;
      const dB=baseOf(doors[0]), uB=baseOf(drones[0]); const groundOk=dB.y===0&&dB.x===doors[0].x&&dB.z===doors[0].z&&uB.y===0&&uB.x===drones[0].x&&uB.z===drones[0].z;
      const fmt=x=>x.dist.toFixed(3)+' m from the foot · '+x.dx.toFixed(1)+' px across · '+x.under.toFixed(1)+' px at the bottom edge · '+x.above.toFixed(2)+' m below the centre of mass · oval '+x.w.toFixed(0)+'×'+x.h.toFixed(0)+' px';
      push('SPLASH_FROM_TARGET_BASE', s50.ok&&s300.ok&&missed&&none&&drawn===16&&groundOk, '50m: '+fmt(s50)+' · 300m: '+fmt(s300)+' · door and drone ring the ground under them: '+groundOk+' · miss: '+(missed?(none?'no splash':'a splash was drawn'):'not a miss ('+state.lastBand+')')+' · drawn '+drawn+'/16 segs (world wire dropped '+dropped+')'+(dErr?' · draw threw '+dErr:'')); }''')
rep(r'''    { const mine=laneMarkers(state.lane||0); const last=laneMarkers(LANES.length-1); const zs=mine.map(m=>m.z).sort((a,b)=>a-b).join('/'); const seen={}; drawLaneMarkers((arr,col)=>{ seen[col]=(seen[col]||0)+arr.length; });
      const L=LANES[state.lane||0]; const atEdge=mine.every(m=>Math.abs(m.x-(L.x-LANE_HALF_W))<1e-9&&m.n===L.i+1); const inPic=mine.every(m=>{ const pr=proj([m.x,m.y0+MARKER_POST,m.z],camOf(u0),W,H); return !!pr; });
      push('LANE_MARKERS_100_200_300', mine.length===3&&zs==='100/200/300'&&atEdge&&last.length===6&&last.every(m=>m.n===42)&&(seen[T13.SI]||0)===15&&inPic, 'lane '+(L.i+1)+': numbered boards on posts at its left edge at '+zs+' m (the last lane has both edges); mine bright, the neighbours\' dim; '+(seen[T13.SI]||0)+' segments of mine drawn'); }''',
r'''    { /* r.157 · LANE_MARKERS_100_200_300 — both edges of every lane, "◂ 40 · 41 ▸" (operator 2026-10-04) */
      const all=[]; LANES.forEach(L=>laneMarkers(L.i).forEach(m=>all.push(m))); const posts=new Set(all.map(m=>m.x.toFixed(3)+'@'+m.z)); const bound=x=>{ const k=(x+LANES.length*LANE_HALF_W)/LANE_W; return Math.abs(k-Math.round(k))<1e-9&&k>-1e-9&&k<LANES.length+1e-9; };
      const named=all.every(m=>m.txt===laneBoardText(m.left,m.right)&&(m.edge==='L'?(m.right===m.n&&m.left===(m.n>1?m.n-1:0)):(m.left===m.n&&m.right===(m.n<LANES.length?m.n+1:0)))&&(!m.left||m.txt.indexOf('◂ '+m.left)===0)&&(!m.right||m.txt.indexOf(m.right+' ▸')>=0));
      const ground=all.every(m=>{ const Lm=LANES[m.lane]; return Math.abs(m.y0-((Lm.y-2.2)+(Lm.slope||0)*m.z))<=0.1; });
      const L=LANES[state.lane||0]; const mine=laneMarkers(L.i); const zs=[...new Set(mine.map(m=>m.z))].sort((a,b)=>a-b).join('/'); const both=mine.filter(m=>m.edge==='L').length===3&&mine.filter(m=>m.edge==='R').length===3;
      const ends=laneMarkers(0).some(m=>m.edge==='L'&&m.txt==='1 ▸')&&laneMarkers(LANES.length-1).some(m=>m.edge==='R'&&m.txt==='◂ 42')&&laneMarkers(20).some(m=>m.edge==='R'&&m.txt==='◂ 21 · 22 ▸');
      const seen={}; drawLaneMarkers((arr,col)=>{ seen[col]=(seen[col]||0)+arr.length; }); const inPic=mine.every(m=>!!proj([m.x,m.y0+MARKER_POST,m.z],camOf(u0),W,H));
      const view=markersInView(); const vPosts=new Set(view.map(m=>m.x.toFixed(3)+'@'+m.z));
      push('LANE_MARKERS_100_200_300', all.length===252&&posts.size===129&&all.every(m=>bound(m.x))&&named&&ground&&zs==='100/200/300'&&both&&ends&&(seen[T13.SI]||0)===30&&inPic&&vPosts.size===view.length, all.length+' boards on '+posts.size+' posts, every one on a lane line; lane '+(L.i+1)+' has both edges at '+zs+' m ("'+mine[0].txt+'" · "'+mine[1].txt+'"); lane 21 | 22 reads "◂ 21 · 22 ▸"; the outer edges read "1 ▸" and "◂ 42"; every board stands on its own lane\'s ground; '+(seen[T13.SI]||0)+' segments of mine drawn bright; '+view.length+' boards in view, no post drawn twice'); }
    { /* r.157 · BOARD_LABELS_NEVER_OVERPRINT — on lane 21 at 1× and 3×, the boards' words never overlap each other or a caption (r.156 stacked "21 21"), and my two nearest boards are always written */
      const l0=state.lane, z0=state.zoom; state.lane=20; parkRangeTurrets(); state.rangeMode='bounce'; rangeReset(); const uu=units['T21']; const s0=state.unit; state.unit='T21'; const hc=document.getElementById('hud').getContext('2d'); const res=[];
      [[1,'C-50'],[3,'C-150R'],[1,'C-250']].forEach(([z,base])=>{ state.zoom=z; aimUnitAt(uu,plateOf(20,base),-40,40); const bl=boardLabels(hc,W,H,camOf(uu)); let clash=0; for(let i=0;i<bl.length;i++) for(let j=i+1;j<bl.length;j++){ const a=bl[i],b=bl[j]; if(a.x0<b.x1&&b.x0<a.x1&&a.y0<b.y1&&b.y0<a.y1) clash++; } res.push({z,base,n:bl.length,clash,mine100:bl.filter(b=>b.mine&&b.z===100).length,txt:bl.map(b=>b.txt).join(' | ')}); });
      state.unit=s0; state.lane=l0; state.zoom=z0; parkRangeTurrets(); rangeReset();
      push('BOARD_LABELS_NEVER_OVERPRINT', res.every(r=>r.clash===0&&r.n>0)&&res[0].mine100>=1, res.map(r=>r.z+'× on the '+plateWord(r.base)+': '+r.n+' boards written, '+r.clash+' overlaps ('+r.txt+')').join(' · ')); }
    { /* r.157 · TARGETS_INSIDE_LANE — every one of the 462 targets between its own lane's lines, with ≥ 0.5 m to spare */
      const gap=q=>Math.abs(qWorld(q).x-LANES[q.lane].x)+q.w/2; const bad=PLATES.filter(q=>gap(q)>LANE_HALF_W-0.5+1e-9); const worst=Math.max(...PLATES.map(gap));
      push('TARGETS_INSIDE_LANE', PLATES.length===462&&bad.length===0&&LANE_W===15&&LANES.every((Lx,i)=>i===0||Math.abs(Lx.x-LANES[i-1].x-LANE_W)<1e-9), PLATES.length+' targets, each between its own lane\'s lines with ≥ 0.5 m to spare (lanes '+LANE_W+' m apart, the widest stands '+worst.toFixed(2)+' m from its lane centre, the line at '+LANE_HALF_W+' m)'+(bad.length?' · outside: '+bad.slice(0,3).map(q=>q.id).join(','):'')); }''')
rep(r'''    { state.rangeMode='bounce'; rangeReset(); u0.pan=0;u0.tilt=0; state.zoom=1; const hc=document.getElementById('hud').getContext('2d'); const rs=plateCaptionRects(hc,W,H); let clash=0; for(let i=0;i<rs.length;i++) for(let j=i+1;j<rs.length;j++){ const a=rs[i],b=rs[j]; if(a.x0<b.x1&&b.x0<a.x1&&a.y0<b.y1&&b.y0<a.y1) clash++; }
      const sides=rs.every(c=>(c.side==='L'&&c.align==='right')||(c.side==='R'&&c.align==='left')||(c.side==='C'&&c.align==='center'));
      push('LABELS_DO_NOT_OVERLAP', rs.length===11 && clash===0 && sides && rs.every(c=>c.x0>=0&&c.x1<=W), rs.length+' captions at pan 0 · left targets right-justified, right targets left-justified, centre above · overlaps '+clash); }''',
r'''    { /* r.157 · LABELS_ONLY_WHILE_MARKED (operator 2026-10-04, his pick) — no label on a standing target in any mode; the marked one carries one, in plain words */
      state.rangeMode='bounce'; rangeReset(); u0.pan=0;u0.tilt=0; state.zoom=1; state.desig=null; state.tgtSlot={}; state.hiApproved=false; const hc=document.getElementById('hud').getContext('2d');
      const n0=plateCaptionRects(hc,W,H).length; state.rangeMode='stay'; rangeReset(); const n1=plateCaptionRects(hc,W,H).length; state.rangeMode='qual40'; rangeReset(); qualResetTower(); rangeExpose(0,'C-150R'); const n2=plateCaptionRects(hc,W,H).length;
      state.rangeMode='bounce'; qualResetTower(); rangeReset(); const q=platesHere().find(p=>p.base==='C-150R'); aimPlate(q,0); markLock(lockOn(),'QA'); const a=plateCaptionRects(hc,W,H); approveDesig('HI-2'); const r=plateCaptionRects(hc,W,H);
      const okA=a.length===1&&a[0].id===q.id&&a[0].cap.indexOf(plateWord(q.id))>=0&&/AMBER/.test(a[0].cap)&&!/C-\d/.test(a[0].cap)&&a[0].x0>=0&&a[0].x1<=W; const okR=r.length===1&&/RED/.test(r[0].cap)&&r[0].align==='left';
      push('LABELS_ONLY_WHILE_MARKED', n0===0&&n1===0&&n2===0&&okA&&okR, 'nothing marked: '+n0+' / '+n1+' / '+n2+' labels (TRAIN UP / TRAIN DOWN / QUAL 40 with a target up) · marked: "'+(a[0]?a[0].cap:'none')+'" · approved: "'+(r[0]?r[0].cap:'none')+'"'); state.desig=null; state.tgtSlot={}; state.hiApproved=false; }''')
rep(r"""      push('BOARD_NEVER_OVER_THE_STRIP', disjoint, 'with a mark on the board, #board and the strip do not overlap ('""",
r"""      push('BOARD_NEVER_OVER_THE_STRIP', disjoint, 'with a mark, #board ('+((b&&b.textContent)?'on':'empty on the range — the strip says it once')+') and the strip do not overlap ('""")

NEW_ROWS = r'''    { /* r.157 · MY_LANE_NEVER_DROPPED — with the world budget spent, every line of my lane's targets and of my two edges of boards is still drawn (they never enter the budget); one real frame strokes them */
      const l0=state.lane; state.rangeMode='bounce'; state.lane=20; rangeReset(); let own=0; const expect=platesHere().filter(q=>q.up).reduce((a,q)=>a+silMesh(q).length,0)+30;
      drawPlates(()=>{ /* the budget is spent: every budgeted line is dropped */ },arr=>{ own+=arr.length; }); drawLaneMarkers(()=>{},arr=>{ own+=arr.length; });
      state.lane=l0; rangeReset(); const dd=state.drawDone; let frame='', fOk=false; try{ draw(); fOk=(state.ownSegs|0)>0&&(state.ownCulled|0)===0; frame='one frame on lane '+((l0|0)+1)+': '+(state.ownSegs|0)+' of my own lines drawn, '+(state.ownCulled|0)+' culled, the world dropped '+(state.dropped|0); }catch(e){ frame='draw threw '+String(e).slice(0,50); } state.drawDone=dd;
      push('MY_LANE_NEVER_DROPPED', own===expect&&fOk&&/drawPlates\(segs,segsOwn\); drawLaneMarkers\(segs,segsOwn\);/.test(draw.toString()), 'lane 21 with the world budget spent: '+own+'/'+expect+' of my targets\' and boards\' lines still drawn · '+frame); }
    { /* r.157 · NEXT_BUTTON_LIT (ask 2026.10.04_09.16..32) — exactly the step that will work is lit: TARGET, then APPROVE, then FIRE; an empty magazine lights none (RELOAD calls); styling only */
      state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-100C'); aimPlate(q,0);
      const lit=()=>{ paintCues(); return ['fTgt','fAppr','fFire'].filter(id=>{ const b=document.getElementById(id); return !!b&&b.classList.contains('lit'); }).map(id=>({fTgt:'TARGET',fAppr:'APPROVE',fFire:'FIRE'})[id]).join('+')||'none'; };
      const s0=lit(); markLock(lockOn(),'QA'); const s1=lit(); approveDesig('HI-2'); const s2=lit(); const r0=state.mag.rounds; state.mag.rounds=0; const s3=lit(); state.mag.rounds=r0; fireN(1); const s4=lit();
      const on=+getComputedStyle(document.getElementById('fTgt')).opacity, dim=+getComputedStyle(document.getElementById('fAppr')).opacity; const fireBorder=getComputedStyle(document.getElementById('fFire')).borderTopColor;
      const qaA=state.qaArmed, ph0=state.lobby&&state.lobby.phase; state.qaArmed=false; if(state.lobby) state.lobby.phase='SETUP'; const s5=lit(); state.qaArmed=qaA; if(state.lobby) state.lobby.phase=ph0; lit();
      push('NEXT_BUTTON_LIT', s0==='TARGET'&&s1==='APPROVE'&&s2==='FIRE'&&s3==='none'&&s4==='TARGET'&&s5==='none'&&on>dim&&!/226, 75, 59/.test(fireBorder), 'aim: '+s0+' · TARGET → '+s1+' · APPROVE → '+s2+' · empty magazine on red → '+s3+' (RELOAD calls) · after the hit → '+s4+' · before the round opens → '+s5+' · lit '+on+' vs dim '+dim+' · FIRE unlit has no red border'); state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    { /* r.157 · RELOAD_CALLS — RELOAD glows when empty and at the QUAL phase rest with a part-used magazine; never full; never when no magazine is left */
      const rl=document.getElementById('btnReload'); const call=()=>{ paintCues(); return rl.classList.contains('call'); };
      state.rangeMode='bounce'; rangeReset(); const full=call(); state.mag.rounds=17; const part=call(); state.mag.rounds=0; const empty=call();
      state.rangeMode='qual40'; rangeReset(); qualResetTower(); const R=rangeRun(state.lane||0); R.phase='up'; state.mag.rounds=4; const qUp=call(); R.phase='phasegap'; R.t=0; const qGap=call(); state.mag.rounds=state.mag.cap; const qGapFull=call(); state.mag.rounds=0; state.mag.n=4; const qNoMag=call();
      state.rangeMode='bounce'; qualResetTower(); rangeReset(); call();
      push('RELOAD_CALLS', !full&&!part&&empty&&!qUp&&qGap&&!qGapFull&&!qNoMag, 'training: full '+full+' · 17 rounds '+part+' · empty '+empty+' · QUAL: up with 4 rounds '+qUp+' · phase rest with 4 rounds '+qGap+' · phase rest full '+qGapFull+' · empty with no magazine left '+qNoMag); }
    { /* r.157 · START_LIGHT_SEQUENCE (Addendum 1) — a QUAL start walks red → yellow → green → yellow → green, red then yellow across the phase rest, red at the end; training is green while targets stand */
      const seq=[]; const rec=()=>{ paintCues(); const L=startLight(); if(seq[seq.length-1]!==L) seq.push(L); return L; };
      const qaA=state.qaArmed, ph0=state.lobby&&state.lobby.phase, S0=state._qaSilent; state._qaSilent=true; state.qaArmed=false; if(state.lobby) state.lobby.phase='SETUP';
      state.rangeMode='qual40'; rangeReset(); qualResetTower(); rec(); state.qaArmed=true; const marks=[];
      for(let i=0;i<20*400&&!state.qualDone;i++){ rangeTick(0.05); const L=rec(); const R=rangeRun(state.lane||0); if(R.phase==='phasegap'&&marks.length===0) marks.push('rest '+L); if(R.phase==='phasegap'&&R.t>PHASE_GAP_S-3+0.05&&marks.length===1) marks.push('rest end '+L); }
      const done=!!state.qualDone; rec(); state._qaSilent=S0;
      state.rangeMode='bounce'; qualResetTower(); rangeReset(); const tUp=startLight(); platesHere().forEach(q=>{ q.up=false; }); const tBack=startLight(); state.rangeMode='stay'; const tDone=startLight(); state.rangeMode='bounce'; rangeReset();
      state.qaArmed=qaA; if(state.lobby) state.lobby.phase=ph0; paintCues();
      const s=seq.join(' → ');
      push('START_LIGHT_SEQUENCE', s.indexOf('R → Y → G → Y → G')===0&&seq[seq.length-1]==='R'&&done&&marks[0]==='rest R'&&marks[1]==='rest end Y'&&s.indexOf('G → R → Y → G')>0&&tUp==='G'&&tBack==='Y'&&tDone==='R', 'QUAL 40: '+s.slice(0,28)+' … '+s.slice(-14)+' ('+seq.length+' changes) · '+marks.join(' · ')+' · done '+done+' · training: up '+tUp+', all down returning '+tBack+', TRAIN DOWN all down '+tDone); }
    { /* r.157 · START_LIGHT_WORDS — the light carries its word for colour-blind players */
      const got=['R','Y','G'].map(L=>{ paintLight(L); const sl=document.getElementById('startLight'), w=document.getElementById('startWord'); const lamp=sl&&sl.querySelector('i.'+({R:'r',Y:'y',G:'g'})[L]); return L+':'+(w?w.textContent:'')+':'+(sl?sl.className:'')+':'+(lamp?getComputedStyle(lamp).opacity:''); }); paintCues();
      push('START_LIGHT_WORDS', got.join(' ')==='R:WAIT:R:1 Y:READY:Y:1 G:FIRE:G:1', got.join(' · ')+' — RED WAIT · YELLOW READY · GREEN FIRE, the lit lamp full and the others dim'); }
    { /* r.157 · START_LIGHT_CLEAR — upper right, never over the magazine line, RELOAD, the buttons, the sticks or the strip, in this orientation */
      const app=document.getElementById('app'); const hadR=app.classList.contains('range'); app.classList.add('range'); syncSticks(); placeFace();
      const rc=id=>{ const e=document.getElementById(id); if(!e) return null; const cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden') return null; const r=e.getBoundingClientRect(); return (r.width>0&&r.height>0)?r:null; };
      const hits=(a,b)=>!!a&&!!b&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
      const sl=rc('startLight'), st=rc('stage'); const clash=['magBar','btnReload','face','joyR','joyL','playHud','board','toast'].filter(id=>hits(sl,rc(id)));
      const inside=!!sl&&!!st&&sl.left>=st.left-0.5&&sl.right<=st.right+0.5&&sl.top>=st.top-0.5&&sl.bottom<=st.bottom+0.5; const upperRight=!!sl&&!!st&&sl.right>=st.right-24&&sl.top<=st.top+st.height*0.25;
      push('START_LIGHT_CLEAR', !!sl&&inside&&upperRight&&clash.length===0, 'the light sits at the upper right ('+(sl?Math.round(sl.left)+','+Math.round(sl.top)+' '+Math.round(sl.width)+'×'+Math.round(sl.height):'not shown')+') at '+innerWidth+'×'+innerHeight+' and touches none of the magazine line, RELOAD, the buttons, the sticks or the strip'+(clash.length?' · overlaps '+clash.join(','):'')); if(!hadR) app.classList.remove('range'); }
    { /* r.157 · NO_RAW_IDS_ON_GLASS (ask 09.16..32, Addendum 3) — aim → amber → red → hit: the strip, the board, the toast, the LOCK line, the corner, the pickers and the label never show a raw id, a slope word, CH0 D3 or the build counter */
      const RAW=/C-\d+[LRC]?-L\d+|\bL\d\d (QUAL|UP|DOWN)\b|CH\d D\d|SPIRAL v|TRAINING · |QUAL · 40/; const S0=state._qaSilent; state._qaSilent=false; const seen=[];
      const grab=tag=>{ hudScore(); hudPhase(); list(); paintCues(); const t=['phCH','phDes','phScore','board','toast','startWord'].map(id=>{ const e=document.getElementById(id); return e?e.textContent:''; }).join(' | ')+' | '+lockText(lockOn())+' | '+cornerLabel()+' | '+[...document.querySelectorAll('#lanePick option, #rngMode option')].map(o=>o.textContent).join(' ')+' | '+document.getElementById('btnRangeReset').textContent+' | '+plateCaptionRects(document.getElementById('hud').getContext('2d'),W,H).map(c=>c.cap).join(' '); seen.push(tag+': '+t); return RAW.test(t); };
      state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; const q=platesHere().find(p=>p.base==='C-150R'); aimPlate(q,0);
      const b0=grab('aim'); markLock(lockOn(),'QA'); const b1=grab('amber'); approveDesig('HI-2'); const b2=grab('red'); fireN(1); const b3=grab('hit'); state._qaSilent=S0;
      const bad=seen.filter(x=>RAW.test(x)); const last=document.getElementById('phDes').textContent;
      push('NO_RAW_IDS_ON_GLASS', !b0&&!b1&&!b2&&!b3&&/^LAST · 150 M RIGHT · DOWN$/.test(last), 'aim → amber → red → hit: every line on the glass says "'+plateWord(q.id)+'", never a raw id'+(bad.length?' · RAW: '+bad[0].slice(0,120):' · last strip "'+last+'"')); state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    { /* r.157 · RANGE_MENU_ON_SCREEN (his pick "Mode + Restart + Lane") — on the range the mode, RESTART and the lane sit on one row inside the screen; the other eight pickers are behind MORE */
      const app=document.getElementById('app'); const hadR=app.classList.contains('range'), hadM=app.classList.contains('more'), f0=app.classList.contains('full'); if(f0) setFull(false); app.classList.add('range'); app.classList.remove('more');
      const lpk=document.getElementById('lanePick'), filled=!!lpk&&lpk.options.length>0; if(lpk&&!filled) LANES.forEach(L=>{ const o=document.createElement('option'); o.value=String(L.i); o.textContent=laneWord(L.i); lpk.appendChild(o); }); /* the boot QA runs before fillLanes: measure the picker as the player sees it */
      const vis=id=>{ const e=document.getElementById(id); if(!e) return null; if(getComputedStyle(e).display==='none') return null; const r=e.getBoundingClientRect(); return (r.width>0&&r.height>0)?r:null; };
      const on=['rngMode','btnRangeReset','lanePick'].map(vis); const all3=on.every(Boolean); const inView=all3&&on.every(r=>r.left>=0&&r.right<=innerWidth+0.5&&r.top>=0&&r.bottom<=innerHeight);
      const oneRow=all3&&Math.abs(on[0].top-on[1].top)<2&&Math.abs(on[1].top-on[2].top)<2, order=all3&&on[0].left<on[1].left&&on[1].left<on[2].left;
      const HID=['modePick','plat','water','motLvl','tgtPick','chLvl','diffLvl','halPick']; const hidden=HID.filter(id=>!vis(id)).length; app.classList.add('more'); const shown=HID.filter(id=>!!vis(id)).length;
      app.classList.toggle('more',hadM); app.classList.toggle('range',hadR); if(f0) setFull(true);
      const names=[...document.querySelectorAll('#rngMode option')].map(o=>o.textContent).join(' · '), btn=document.getElementById('btnRangeReset').textContent, lane=(document.querySelector('#lanePick option[value="20"]')||{}).textContent;
      if(lpk&&!filled) lpk.innerHTML='';
      push('RANGE_MENU_ON_SCREEN', inView&&oneRow&&order&&hidden===8&&shown===8&&names==='TRAIN UP · TRAIN DOWN · QUAL 40'&&btn==='RESTART'&&lane==='LANE 21', 'on the range: '+names+' · '+btn+' · '+lane+' — mode, Restart and lane on one row inside '+innerWidth+'×'+innerHeight+' ('+(inView?'all on the glass':'OFF THE GLASS')+', the lane picker '+Math.round(all3?on[2].right:0)+' px at its right edge); the other '+hidden+' pickers are behind MORE ('+shown+' come back with it)'); }
    { /* r.157 · QUAL_DONE_SAYS_RESTART — the 40th round ends with the score, the badge and the next step; RESTART lit; the light red */
      state.rangeMode='qual40'; rangeReset(); qualResetTower(); state.qualR=39; state.qualH=36; const S0=state._qaSilent; state._qaSilent=false; qualRecordShot(true,'X'); const t=document.getElementById('toast').textContent; hudScore(); const strip=document.getElementById('phScore').textContent; paintCues(); const lit=document.getElementById('btnRangeReset').classList.contains('call'); const L=startLight(); state._qaSilent=S0;
      push('QUAL_DONE_SAYS_RESTART', state.qualDone===true&&/QUAL DONE · 37 OF 40 · EXPERT · PRESS RESTART/.test(t)&&/QUAL DONE · 37 OF 40 · EXPERT · PRESS RESTART/.test(strip)&&lit&&L==='R', 'the 40th round: toast "'+t+'" · strip "'+strip+'" · RESTART lit '+lit+' · light '+L); state.rangeMode='bounce'; qualResetTower(); rangeReset(); paintCues(); }
    { /* r.157 · rooms score by lane (12-shooter round: Odin, Thor, Thoth) */
      const S0=state._qaSilent; state._qaSilent=false;
      state.rangeMode='qual40'; rangeReset(); qualResetTower(); for(let i=0;i<70;i++) rangeTick(0.05); state.qualR=5; state.qualH=4; const qf=plateOf(5,'C-50'); qf.up=false; qf.lifePct=0;
      applyWorld({verb:'RESET',id:'RANGE',peerId:'QA-PEER',data:{why:'BUTTON',mode:'bounce',targets:'pop',lane:5,qualR:3,qualH:3}}); const t1=document.getElementById('toast').textContent;
      const keep=state.rangeMode==='qual40'&&(state.qualR|0)===5&&(state.qualH|0)===4&&qf.up===true&&qf.lifePct===100&&/LANE 6 RESTARTED/.test(t1);
      push('ROOM_RESET_IS_MY_LANE', keep, 'a Restart row from lane 6 while I shoot QUAL 40 on lane '+((state.lane|0)+1)+': my mode '+state.rangeMode+', my table '+(state.qualH|0)+'/'+(state.qualR|0)+'; lane 6 stands again; the toast says "'+t1+'"');
      state.rangeMode='bounce'; qualResetTower(); rangeReset(); const h0=state.rangeHit|0, m0=state.rangeMiss|0; const qh=plateOf(5,'C-100C'), qm=plateOf(5,'C-200L'), mineQ=platesHere().find(p=>p.base==='C-150L'); state.fx=null;
      state.events=(state.events||[]).concat([{verb:'APPROVE',id:qh.id,committed:false},{verb:'APPROVE',id:mineQ.id,committed:false}]);
      applyWorld({verb:'HIT',id:qh.id,result:'HIT CIRCLE',peerId:'QA-PEER',data:{}}); const h1=state.rangeHit|0, fxForeign=!!state.fx; applyWorld({verb:'MISS',id:qm.id,result:'MISS',peerId:'QA-PEER',data:{}}); applyWorld({verb:'HIT',id:mineQ.id,result:'HIT CIRCLE',peerId:'QA-PEER',data:{}}); const fxMine=!!(state.fx&&state.fx.ref===mineQ);
      push('FOREIGN_LANE_HIT_NOT_MY_STRIP', qh.lifePct<=0&&h1===h0&&!fxForeign&&(state.rangeMiss|0)===m0&&(state.rangeHit|0)===h0+1&&!!state.lastShot&&state.lastShot.id===mineQ.id&&fxMine, 'lane 6\'s HIT and MISS rows drop its plate but leave my strip alone (HIT '+h0+'→'+h1+', MISS '+m0+'→'+(state.rangeMiss|0)+'); a peer HIT on my lane counts once ('+(state.rangeHit|0)+') and draws the same splash here ('+fxMine+')'); state.fx=null; state.lastShot=null;
      const lb=state.lobby; const sv={phase:lb.phase,host:lb.host,launch:lb.launch,hid:state.com.hostId}; lb.phase='LIVE'; lb.host=false; state.com.hostId='QA-HOST'; lb.launch={seats:[{peerId:'QA-HOST',lane:5}]}; const other=lapseIsMine(); lb.launch={seats:[{peerId:'QA-HOST',lane:state.lane|0}]}; const same=lapseIsMine(); lb.launch={seats:[{peerId:'QA-HOST',lane:5}]};
      state.rangeMode='qual40'; rangeReset(); qualResetTower(); const x0=state.qualExpired|0, e0=(state.events||[]).filter(e=>e&&e.verb==='LAPSE').length; for(let i=0;i<(ENG_GAP_S+EXPOSURE_BY_COUNT[1]+0.3)*20;i++) rangeTick(0.05); const booked=(state.qualExpired|0)-x0, rowsN=(state.events||[]).filter(e=>e&&e.verb==='LAPSE').length-e0;
      lb.phase=sv.phase; lb.host=sv.host; lb.launch=sv.launch; state.com.hostId=sv.hid; state._qaSilent=S0;
      push('ROOM_LAPSE_ON_EVERY_LANE', other===true&&same===false&&booked===1&&rowsN===1, 'a joiner on lane '+((state.lane|0)+1)+' with the host on lane 6 runs its own lane\'s clock ('+other+'; on the host\'s own lane it leaves it to the host: '+(!same)+'); engagement 1 left unfired books '+booked+' unfired miss and '+rowsN+' row');
      state.rangeMode='bounce'; qualResetTower(); rangeReset(); paintCues(); }
    push('HOLD_ROWS_TRAVEL','''
rep(r'''    push('HOLD_ROWS_TRAVEL',''', NEW_ROWS)

# ---------------------------------------------------------------------------------------------------------------------------------
# the old mode names left in comments and QA notes read as his names too (one name per fact)
t=s.count('TRAINING · RESET'); rep('TRAINING · RESET','TRAIN UP',t)
t=s.count('TRAINING · DOWN'); rep('TRAINING · DOWN','TRAIN DOWN',t)

# the deck declares itself r.157 (BUILD const + the header span + the carried-note strings)
c=s.count("revision:'0.156'"); rep("revision:'0.156'","revision:'0.157'",c)
h=s.count("r0.156"); rep("r0.156","r0.157",h)

for dead in ["revision:'0.156'",'r0.156','splashCentre','TRAINING · RESET','QUAL · 40<','x:-205+i*10','const LANE_HALF_W=5',"L.id+' '+L.kind",'RANGE RESET · ON THE RECORD',"'SPIRAL v'+state.spiral; hc",'tap L##']:
    if dead in s: raise SystemExit(f'REFUSE: stale symbol survives: {dead} x{s.count(dead)}')
for need in ['function baseOf(ref)','function splashBase(f)',"push('SPLASH_FROM_TARGET_BASE'",'const LANE_W=15, LANE_HALF_W=LANE_W/2;','function laneBoardText(a,b)','function startLight()','function paintCues()','id="startLight"',"push('LABELS_ONLY_WHILE_MARKED'","push('START_LIGHT_SEQUENCE'","push('NO_RAW_IDS_ON_GLASS'","push('RANGE_MENU_ON_SCREEN'","push('MY_LANE_NEVER_DROPPED'","push('ROOM_LAPSE_ON_EVERY_LANE'","push('BOARD_LABELS_NEVER_OVERPRINT'"]:
    if s.count(need)!=1: raise SystemExit(f'REFUSE: {need} must appear exactly once, found {s.count(need)}')
if s.count('state.fx=')!=8: raise SystemExit(f"REFUSE: expected 8 writers of state.fx (applyHit + 2 peer-row + 5 in QA), found {s.count('state.fx=')}")
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

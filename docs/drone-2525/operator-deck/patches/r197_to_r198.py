# r.197 -> r.198 — QUAL: the five Table VI positions as 1983 edge rasters, one at a time, matched to the four magazines; the range goes
# cold (operator 2026-10-11, verbatim: "i need Raster for each pose" · "I want clear rasters for 5 shooting positions; same height as
# magazines and stop light accept a rounded square" · "we match the shooting position tonthe target and 4 magazines that we actually test in
# wualifications for army range" · "mini poses are raster sinplications 1983 starwars video game style with words of these 5" ·
# "standing; Prone unsupported, Prone Supported, Kneeling Supported, Standing Supported").
#  INVARIANT (r.198): in QUAL the pose on the card is the position the current engagement is fired from and the magazine is the one the
#  Army test loads for that phase (1 STANDING · 2–5 PRONE UNSUPPORTED · MAG 1 · 6–10 PRONE SUPPORTED · MAG 2 · 11–14 KNEELING SUPPORTED ·
#  MAG 3 · 15–18 STANDING SUPPORTED · MAG 4); every target still needs TARGET → APPROVE → FIRE; the table ends cold, on the record.
#  The five rasters are the operator's OWN TC 3-22.9 figures, traced at high resolution by scripts/trace-poses.mjs (recipe docs/drone-2525/poses/
#  poses.v2.json): the person in T13.SI, the rifle in T13.DOME, outlines in T13.ROAD — never stick figures, the gun never the person's colour
#  (operator 2026-10-12) — embedded here as data URIs so the deck stays one file. The cold range is r.179/r.181 (50826908/84c86cf9, hand edits never registered)
#  carried onto this base with a COLD decision row.
import hashlib,os,base64
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
POSES=os.path.normpath(os.path.join(DECK,'..','poses'))
BASE_REV='197'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]  # the base is the carried, registered r.197 — asserted against its own hash record
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.198.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.197')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
def repline(prefix,new):
    """replace the whole (unique) line that starts with `prefix`"""
    global s
    lines=s.split('\n'); k=[i for i,l in enumerate(lines) if l.startswith(prefix)]
    if len(k)!=1: raise SystemExit(f'REFUSE: expected one line starting {prefix[:80]!r}, found {len(k)}')
    n[0]+=1; lines[k[0]]=new; s='\n'.join(lines)
PNG=[]
for i in range(5):
    b=open(os.path.join(POSES,f'pose-{i}.png'),'rb').read()
    if not b.startswith(b'\x89PNG') or len(b)>20000: raise SystemExit(f'REFUSE: pose-{i}.png is not a small PNG')
    PNG.append('data:image/png;base64,'+base64.b64encode(b).decode('ascii'))

# 0 · the deck declares itself
c=s.count("revision:'0.197'"); rep("revision:'0.197'","revision:'0.198'",c)
h=s.count("r0.197"); rep("r0.197","r0.198",h)

# 1 · the pose card — a rounded square of the magazine's height between the count and the light, QUAL only
rep("#magWell #magRounds{font-size:13px;line-height:12px;font-weight:700;letter-spacing:.04em;color:#3DCC8A;font-family:ui-monospace,Menlo,monospace}",
    "#magWell #magRounds{font-size:13px;line-height:12px;font-weight:700;letter-spacing:.04em;color:#3DCC8A;font-family:ui-monospace,Menlo,monospace}\n#magWell #posWell{display:none;position:absolute;top:0;left:calc(50% + 32px);width:75px;height:75px;box-sizing:border-box;border:1px solid #1C2A3A;border-radius:12px;background:rgba(0,0,0,.55);padding:3px 2px 2px;flex-direction:column;align-items:center;justify-content:flex-start;gap:1px;pointer-events:none;color:#E8D5B0} /* r.198 (operator 2026-10-11): the firing position — a rounded square of the magazine's height, between the count and the light, one pose at a time */\n#app.range.qual #magWell #posWell{display:flex}\n#magWell #posImg{width:52px;height:52px;flex:none;display:block;image-rendering:auto}\n#magWell #posName{font-size:7px;line-height:7px;letter-spacing:.06em;font-weight:500;color:#E8D5B0;text-align:center;max-width:69px;white-space:normal}\n#magWell #posWell.cold #posName{color:#E24B3B}\n#magWell #magReload.locked{opacity:.45}\n#qualOver{display:none;position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);z-index:6;width:min(92%,440px);text-align:center;pointer-events:none;color:#C9A227;letter-spacing:.14em;line-height:1.55;background:rgba(0,0,0,.86);border:1px solid #E24B3B;border-radius:12px;padding:18px 14px 16px} /* r.198 (r.179/r.181 carried): the table ends cold */\n#qualOver.on{display:block}\n#qualOver b{display:block;color:#E24B3B;font-size:28px;font-weight:700;letter-spacing:.22em;margin:0 0 8px}\n#qualOver span{display:block;font-size:14px}")
rep('    </div>\n    <div id="startLight" class="R" data-s="R"',
    '      <div id="posWell" aria-hidden="true"><img id="posImg" alt="" src=""><b id="posName"></b></div>\n    </div>\n    <div id="startLight" class="R" data-s="R"')
rep('    <div id="board"></div>\n','    <div id="board"></div>\n    <div id="qualOver" aria-hidden="true"></div>\n')
rep("const TRAIN_DOWN_N=0;",
    "const POSES=['STANDING','PRONE UNSUPPORTED','PRONE SUPPORTED','KNEELING SUPPORTED','STANDING SUPPORTED']; /* r.198 (operator 2026-10-11): the five Table VI positions, his words, his order */\n"
    "const POSE_BY_ENG=[0,1,1,1,1,2,2,2,2,2,3,3,3,3,4,4,4,4]; /* engagement 1..18 → pose: 1 STANDING (the 50 R) · 2–5 PRONE UNSUPPORTED (MAG 1) · 6–10 PRONE SUPPORTED (MAG 2) · 11–14 KNEELING SUPPORTED (MAG 3) · 15–18 STANDING SUPPORTED (MAG 4) — the magazine is the phase */\n"
    "const POSE_PNG=['"+"','".join(PNG)+"']; /* r.198: five 256-px rasters traced from the operator's own TC 3-22.9 pages by scripts/trace-poses.mjs (docs/drone-2525/poses/poses.v2.json) — the person T13.SI, the rifle T13.DOME, outlines T13.ROAD — embedded so the deck stays one file */\n"
    "function qualPose(){ if(chNum()!==0||state.rangeMode!=='qual40') return -1; if(state.qualDone) return 5; const R=rangeRun(state.lane||0), e=R.eng; if(!e||!(e.n>0)) return 0; const k=R.phase==='phasegap'?(e.n|0):((e.n|0)-1); return k>=POSE_BY_ENG.length?5:POSE_BY_ENG[Math.max(0,k)]; } /* the position of the engagement that is up, the next one in the rest between phases */\n"
    "function paintPos(){ const el=document.getElementById('posWell'); if(!el) return; const n=qualPose(); const img=document.getElementById('posImg'), nm=document.getElementById('posName'); const t=n<0?'':(n>=5?'RANGE IS COLD':POSES[n]); if(nm&&nm.textContent!==t) nm.textContent=t; const src=(n>=0&&n<5)?POSE_PNG[n]:''; if(img&&img.getAttribute('src')!==src) img.setAttribute('src',src); el.classList.toggle('cold',n>=5); }\n"
    "const TRAIN_DOWN_N=0;")
rep("function paintCues(){ const app=document.getElementById('app'); if(app) app.classList.toggle('range',chNum()===0);",
    "function paintCues(){ const app=document.getElementById('app'); if(app) app.classList.toggle('range',chNum()===0); if(app) app.classList.toggle('qual',chNum()===0&&state.rangeMode==='qual40'); /* r.198: the pose card shows in QUAL */")
rep("  paintLight(startLight()); paintTimer(); }","  paintLight(startLight()); paintTimer(); paintQualOver(); paintPos(); }")

# 2 · the table ends cold (r.179/r.181 carried): every plate down, marks cleared, CEASE FIRE on the glass, RELOAD reads UNLOAD, a COLD row
repline("function qualFinish(){",
    "function qualFinish(){ if(state.qualDone) return; state.qualDone=true; state.qualStarted=false; platesHere().forEach(q=>{ q.up=false; q.lifePct=0; q.life=0; q.fall=1; q._down=true; q._dead=1; q._ret=0; q.mist=false; }); state.desig=null; state.hiApproved=false; state.pending=null; state.tgtSlot={}; const R=rangeRun(state.lane||0); R.cur=[]; R.phase='done'; if(lapseIsMine()){ if(typeof ev==='function') ev('QUAL','P'+(state.qualPh||4),'DONE '+(state.qualH||0)+'/'+(state.qualR||0)); decide('COLD','RANGE',{mode:'qual40',lane:state.lane|0,hits:state.qualH|0,rounds:state.qualR|0,score:qualBadge(state.qualH|0)}); } toast(qualCard()); } /* r.198 (r.179 carried): the table ends cold — every plate down, no phantom left standing, the score a decision row */")
rep("function qualCard(){ return 'QUAL DONE · '+(state.qualH||0)+' OF '+IWQ_TOTAL+' · '+qualBadge(state.qualH||0)+' · PRESS RESTART'; }",
    "function qualCard(){ return 'CEASE FIRE · '+(state.qualH||0)+' OF '+IWQ_TOTAL+' · '+qualBadge(state.qualH||0)+' · RANGE IS COLD · PRESS RESTART'; }")
rep("if(state.qualDone) return 'QUAL DONE · PRESS RESTART FOR ANOTHER';","if(state.qualDone) return 'CEASE FIRE · QUALIFICATION COMPLETE · PRESS RESTART';")
rep("const v=qualTimer(); if(tm.textContent!==v) tm.textContent=v; const q=chNum()===0&&state.rangeMode==='qual40'; if(w&&q&&w.textContent!=='') w.textContent=''; }",
    "if(chNum()===0&&state.rangeMode==='qual40'&&state.qualDone){ if(tm.textContent!=='COLD') tm.textContent='COLD'; if(w&&w.textContent!=='CEASE FIRE') w.textContent='CEASE FIRE'; return; } /* r.198 */ const v=qualTimer(); if(tm.textContent!==v) tm.textContent=v; const q=chNum()===0&&state.rangeMode==='qual40'; if(w&&q&&w.textContent!=='') w.textContent=''; }")
rep("function magReload(){ /* r.142: the shooter's own reload — refused when full; in QUAL four magazines as issued, a fifth is refused on the record */",
    "function magReload(){ /* r.142: the shooter's own reload — refused when full; in QUAL four magazines as issued, a fifth is refused on the record */\n  if(chNum()===0&&state.rangeMode==='qual40'&&state.qualDone){ toast('CEASE FIRE · UNLOAD AND SHOW CLEAR · RANGE IS COLD'); return false; } /* r.198: a cold line loads nothing */")
rep("const mr=document.getElementById('magReload'); if(mr) mr.classList.toggle('call',reloadCalls());",
    "const mr=document.getElementById('magReload'); if(mr) mr.classList.toggle('call',reloadCalls()); { const lab=mr&&mr.querySelector('b'); const q=chNum()===0&&state.rangeMode==='qual40'; const done=q&&!!state.qualDone; const no=q&&state.mag&&(state.mag.n|0)>=4&&(state.mag.rounds|0)<=0; const word=done?'UNLOAD':(no?'NO MAG':'RELOAD'); if(lab&&lab.textContent!==word) lab.textContent=word; if(mr) mr.classList.toggle('locked',!!(done||no)); } /* r.198: RELOAD reads UNLOAD on a cold line, NO MAG when the fourth is spent */")
rep("function drawPlates(segs,own){ own=own||segs; /* r.157: my lane's targets go through own (outside the world budget); the neighbours' through segs */",
    "function drawPlates(segs,own){ own=own||segs; /* r.157: my lane's targets go through own (outside the world budget); the neighbours' through segs */\n  if(state.rangeMode==='qual40'&&state.qualDone) return; /* r.198: a cold line draws no silhouette */")
rep("  if(chNum()===0&&typeof laneMarkers==='function'){ hc.textAlign='center';","  if(chNum()===0&&typeof laneMarkers==='function'&&!(state.rangeMode==='qual40'&&state.qualDone)){ hc.textAlign='center';")
rep("function drawLaneMarkers(segs,own){ own=own||segs;","function drawLaneMarkers(segs,own){ if(state.rangeMode==='qual40'&&state.qualDone) return; /* r.198: a cold line draws no boards — they read as targets left standing */ own=own||segs;")
rep("ALL DOWN only then */\n    return;\n  }\n  if(state.qualDone) return;",
    "ALL DOWN only then */\n    return;\n  }\n  qualDropStrays(); if(state.qualDone) return;")
rep("function qualCard(){","function qualDropStrays(){ /* r.198 (r.181 carried): a plate stands only while its own exposure is up; anything else is a phantom and goes down, released */\n  if(chNum()!==0||state.rangeMode!=='qual40') return; const R=rangeRun(state.lane||0); const keep=(!state.qualDone&&R.phase==='up')?new Set(R.cur||[]):null;\n  platesHere().forEach(q=>{ if(!q.up) return; if(keep&&keep.has(q.id)) return; if(!state.qualDone&&q.lifePct<=0&&(q.fall||0)>0&&(q.fall||0)<1) return; q.up=false; q.lifePct=0; q.life=0; q.fall=1; q._down=true; q._ret=0; rangeRelease(q); }); }\nfunction paintQualOver(){ const el=document.getElementById('qualOver'); if(!el) return; const on=chNum()===0&&state.rangeMode==='qual40'&&!!state.qualDone; el.classList.toggle('on',on); if(!on){ el.removeAttribute('data-s'); return; } const h=state.qualH|0; const sig=h+'/'+(state.qualR|0); if(el.getAttribute('data-s')===sig) return; el.setAttribute('data-s',sig); el.textContent=''; [['b','CEASE FIRE'],['span','UNLOAD'],['span','SHOW CLEAR'],['span',h+' OF '+IWQ_TOTAL+' · '+qualBadge(h)],['span','THE LINE IS CLEAR'],['span','RANGE IS COLD · PRESS RESTART']].forEach(([t,w])=>{ const e=document.createElement(t); e.textContent=w; el.appendChild(e); }); }\nfunction qualCard(){")
rep("if((kind==='HOLD'||kind==='REJECT'||kind==='RESET'||kind==='RELOAD'||kind==='START'||kind==='TIME')&&!state.linkMute",
    "if((kind==='HOLD'||kind==='REJECT'||kind==='RESET'||kind==='RELOAD'||kind==='START'||kind==='TIME'||kind==='COLD')&&!state.linkMute")

# 3 · QA — the cold words; the pose follows the engagement; the card measured; the table ends cold
rep("/QUAL DONE · 37 OF 40 · EXPERT · PRESS RESTART/","/CEASE FIRE · 37 OF 40 · EXPERT · RANGE IS COLD · PRESS RESTART/",2)
ROWS=r"""    { /* r.198 · POSE_MATCHES_THE_ENGAGEMENT (operator 2026-10-11: "we match the shooting position to the target and 4 magazines") — the card follows the Table VI engagement: 1 STANDING · 2–5 PRONE UNSUPPORTED · 6–10 PRONE SUPPORTED · 11–14 KNEELING SUPPORTED · 15–18 STANDING SUPPORTED · the rest between phases shows the next · done: RANGE IS COLD · outside QUAL no card */
      const l0=state.lane, qaA=state.qaArmed, S0=state._qaSilent, m0=state.rangeMode; state._qaSilent=true; state.qaArmed=true; state.lane=20; state.rangeMode='qual40'; rangeReset(); qualResetTower(); const R=rangeRun(20);
      const at=(k,ph)=>{ R.k=k; R.phase=ph; R.eng=engagementAt(20,k); R.cur=[]; paintCues(); return qualPose()+':'+(document.getElementById('posName')||{}).textContent+':'+((document.getElementById('posImg')||{}).getAttribute('src')===POSE_PNG[qualPose()]); };
      const got=[at(0,'up'),at(1,'up'),at(4,'up'),at(5,'up'),at(9,'up'),at(10,'up'),at(13,'up'),at(14,'up'),at(17,'up'),at(4,'phasegap'),at(9,'phasegap')].join(' · ');
      const want=['0:STANDING:true','1:PRONE UNSUPPORTED:true','1:PRONE UNSUPPORTED:true','2:PRONE SUPPORTED:true','2:PRONE SUPPORTED:true','3:KNEELING SUPPORTED:true','3:KNEELING SUPPORTED:true','4:STANDING SUPPORTED:true','4:STANDING SUPPORTED:true','2:PRONE SUPPORTED:true','3:KNEELING SUPPORTED:true'].join(' · ');
      state.qualDone=true; paintCues(); const cold=qualPose()===5&&(document.getElementById('posName')||{}).textContent==='RANGE IS COLD'&&document.getElementById('posWell').classList.contains('cold'); state.qualDone=false;
      state.rangeMode='bounce'; rangeReset(); paintCues(); const hidden=qualPose()===-1&&getComputedStyle(document.getElementById('posWell')).display==='none'&&document.querySelectorAll('#posWell img').length===1;
      state.lane=l0; state.qaArmed=qaA; state._qaSilent=S0; state.rangeMode=m0; qualResetTower(); rangeReset(); paintCues();
      push('POSE_MATCHES_THE_ENGAGEMENT', got===want&&cold&&hidden, got+' · done '+cold+' · outside QUAL no card '+hidden); }
    { /* r.198 · POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT (operator 2026-10-11: "same height as magazines and stop light accept a rounded square") — in QUAL the pose card is a rounded square of the magazine card's height, between the count and the light, on the same row */
      const app=document.getElementById('app'); const hadR=app.classList.contains('range'), hadQ=app.classList.contains('qual'); app.classList.add('range'); app.classList.add('qual');
      const rc=sel=>{ const e=document.querySelector(sel); if(!e) return null; const cs=getComputedStyle(e); if(cs.display==='none') return null; const r=e.getBoundingClientRect(); return (r.width>0&&r.height>0)?r:null; };
      const pw=rc('#posWell'), rl=rc('#magReload'), bd=rc('#magWell .body'), sl=rc('#startLight'), im=rc('#posImg'); const cs=getComputedStyle(document.getElementById('posWell'));
      const all=!!pw&&!!rl&&!!bd&&!!sl; const sq=all&&Math.abs(pw.width-pw.height)<=1&&Math.abs(pw.height-rl.height)<=1&&parseFloat(cs.borderTopLeftRadius)>=10; const row=all&&Math.abs(pw.top-rl.top)<=2; const between=all&&bd.right<=pw.left+0.5&&pw.right<=sl.left+0.5; const pic=!!im&&Math.abs(im.width-im.height)<=1&&im.width>=44;
      app.classList.toggle('range',hadR); app.classList.toggle('qual',hadQ);
      push('POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT', sq&&row&&between&&pic, 'card '+(pw?Math.round(pw.width)+'×'+Math.round(pw.height):'-')+' vs the magazine '+(rl?Math.round(rl.height):'-')+' tall, radius '+cs.borderTopLeftRadius+' · one row '+row+' · between the count and the light '+between+' · the figure '+(im?Math.round(im.width)+'×'+Math.round(im.height):'-')); }
    { /* r.198 · QUAL_ENDS_COLD (the Army's end of a table; r.179/r.181 carried) — after the 40th round every plate is down, the marks are cleared, the glass says CEASE FIRE · UNLOAD · SHOW CLEAR · RANGE IS COLD, RELOAD reads UNLOAD and refuses, the light says CEASE FIRE · COLD, a COLD row carries hits/rounds/score */
      const l0=state.lane, s0=state.unit, qaA=state.qaArmed, S0=state._qaSilent, m0=state.rangeMode; state._qaSilent=true; state.qaArmed=true; state.lane=20; parkRangeTurrets(); state.unit='T21'; const uu=units['T21']; state.rangeMode='qual40'; rangeReset(); qualResetTower(); state.desig=null; state.tgtSlot={};
      const q=rangeExpose(20,'C-100C'); aimUnitAt(uu,q,-40,40); state.aimRef=q; designate({id:q.id,kind:'pop',ref:q},'QA'); const marked=!!markSlotOf(q.id);
      state.qualR=39; state.qualH=36; const e0=(state.events||[]).length; qualRecordShot(true,'X'); paintCues();
      const down=platesHere().every(p=>!p.up), clear=!state.desig&&Object.keys(state.tgtSlot||{}).length===0; const ov=document.getElementById('qualOver'); const over=ov.classList.contains('on')&&/CEASE FIRE/.test(ov.textContent)&&/RANGE IS COLD/.test(ov.textContent);
      const lab=(document.querySelector('#magReload b')||{}).textContent; const r0=state.mag.rounds; const refused=magReload()===false&&state.mag.rounds===r0; const row=(state.events||[]).slice(e0).find(e=>e.verb==='COLD'); const cold=!!row&&!!row.data&&row.data.hits===37&&row.data.rounds===40;
      const light=(document.getElementById('startWord')||{}).textContent==='CEASE FIRE'&&(document.getElementById('startTime')||{}).textContent==='COLD';
      state.qualDone=false; state.qualR=0; state.qualH=0; state.desig=null; state.tgtSlot={}; state.unit=s0; state.lane=l0; state.qaArmed=qaA; state._qaSilent=S0; state.rangeMode=m0; qualResetTower(); parkRangeTurrets(); rangeReset(); paintCues();
      push('QUAL_ENDS_COLD', marked&&down&&clear&&over&&lab==='UNLOAD'&&refused&&cold&&light, 'a mark before the last round '+marked+' · every plate down '+down+' · marks cleared '+clear+' · CEASE FIRE … RANGE IS COLD on the glass '+over+' · RELOAD reads '+lab+' and refuses '+refused+' · COLD row 37/40 '+cold+' · the light says CEASE FIRE · COLD '+light); }
"""
rep("    { /* r.157 · QUAL_DONE_SAYS_RESTART", ROWS+"    { /* r.157 · QUAL_DONE_SAYS_RESTART")

# 4 · the deck says what it is
rep('overflow:auto">r.197 TRAIN DOWN',
    'overflow:auto">r.198 QUAL · the firing position on a card the magazine\'s height — your own TC 3-22.9 figure, the rifle in gold, with its word, one at a time: STANDING, PRONE UNSUPPORTED, PRONE SUPPORTED, KNEELING SUPPORTED, STANDING SUPPORTED — the magazine is the phase. The table ends cold: CEASE FIRE, UNLOAD, SHOW CLEAR, the score, RANGE IS COLD.\nr.197 TRAIN DOWN')
for dead in ["revision:'0.197'","r0.197</span>","QUAL DONE · "]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

# r.195 -> r.196 — RESTORE (operator 2026-10-11, docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md, verbatim:
# "please review Drone-2525 / R-CORE AND recent revisions was messed up by Grok. I need help restoring functionality; attached is the last
# know version" · "all targets must have user Target, Approve, and fire / targets turn Amber when targeted and after approved turn red" ·
# "r.178 was the last working version before magazins and distorted targets became a reoccuring issue" · "r.195 is soo beyond messed up as
# targets dont work" · "ensure magazines don't get distorted; heres correct ones").
#
# THE SOURCE IS r.178, NOT r.195. r.166–r.195 were hand edits to play.html that never entered this register (no carried file, no patch, no
# hash); r.178 (`af6f65e0`) is the operator's baseline and is carried beside r.195 (`14a930d0`, the bytes served with a red gate) so the
# record shows both. This patch is named r195_to_r196 because r.196 FOLLOWS r.195 in the register; its SRC is drone-2525_r.178.html.
#
# INVARIANT (r.196): every standing target needs TARGET -> APPROVE -> FIRE from the person on the glass, in every mode; a target is drawn
# at its true size and hit on that size; the served deck is a carried, hashed, registered revision; a red gate never ships.
#  1. QUAL 40 drops a mark on a hit and a plate that just stood is unmarked (r.169 `b6487246`, undone by `b2dfa80a`): keepsMark is false
#     in every mode — no mark rides a target down and back up (r.162's held mark is retired: TRAIN UP had already dropped it in r.166).
#  2. The r0.178 picture (shots 1–2, 10–11): RELOAD at the left, the round count CENTRED, the start light at the right, on ONE row at the
#     light's height; the magazine drawing keeps its 48:96 viewBox at 26×52 CSS px (never scaled unevenly); mode · lane · RESTART at the
#     right on the menu row; the strip above the row, the score under it.
#  3. The Range opens from the intro (THE RANGE — the third option, no lane number) and from the QR link (?range=&role=&mode=) straight onto Lane 21 TRAIN UP in
#     PRACTICE (r.187 `ddb5108d` + r.192 `43a0dc46`), so TARGET, APPROVE and FIRE work the moment the lane shows.
#  4. QA rows re-stated to the operator's rule: EVERY_TARGET_NEEDS_TARGET_APPROVE_FIRE replaces MARK_SURVIVES_THE_RETURN;
#     MARKS_ARE_REMEMBERED (the hit ones released, the amber one kept; QUAL ends unmarked); NO_RING_ON_A_DOWN_TARGET (down AND unmarked);
#     RANGE_MENU_ON_SCREEN (RESTART at the right); new MAG_ROW_ONE_LINE and PLATE_DRAWN_AT_TRUE_SIZE (measured).
#  Nothing r.179–r.195 added beyond this list is in r.196 (the cold range, the TRAIN DOWN clock, the poses, the fixed R-CORE badge):
#  r.197–r.199 carry those on this base.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.178.html'); DST=os.path.join(DECK,'drone-2525_r.196.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
BASE_REV='178'; BASE_SHA='d39875bec3f4e2c5e53a56c21c3e5095825691301582b634d7ac493ba30e8f66'  # the base is declared and asserted, never inferred from N-1
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not r.178 (af6f65e0)')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
def cut(start,endline,new):
    """replace from the unique line `start` through the end of the unique line containing `endline`"""
    global s
    if s.count(start)!=1 or s.count(endline)!=1: raise SystemExit(f'REFUSE: block anchors not unique {start[:60]!r} / {endline[:60]!r}')
    a=s.index(start); b=s.index('\n',s.index(endline))+1
    if b<=a: raise SystemExit('REFUSE: block end before start')
    n[0]+=1; s=s[:a]+new+s[b:]

# 0 · the deck declares itself (r.178's BUILD still said '0.166' — the stale class; the header said r0.178) — first, before any comment below names the r0.178 picture
c=s.count("revision:'0.166'"); rep("revision:'0.166'","revision:'0.196'",c)
h=s.count("r0.178"); rep("r0.178","r0.196",h)
# 1 · every target needs TARGET -> APPROVE -> FIRE, in every mode
rep("function keepsMark(q){ if(!q||!q.form||!marksPersist()||!modeReturns()||(state.rangeMode||'bounce')==='bounce') return false; /* r.166: TRAIN UP drops the mark on a hit. Next shot is TARGET, then APPROVE, then FIRE. */ const d=state.desig; if(d&&(d.ref===q||d.id===q.id)&&ownMark(d)) return true; const k=markSlotOf(q.id); return !!k&&ownMark(state.tgtSlot[k]); }",
    "function keepsMark(q){ return false; } /* r.196 INVARIANT (operator 2026-10-11: \"all targets must have user Target, Approve, and fire\"): no mark survives its target going down — in TRAIN UP, TRAIN DOWN and QUAL 40 the next shot is TARGET, then APPROVE, then FIRE. r.166 did this for TRAIN UP, r.169 for QUAL 40; b2dfa80a undid r.169. The r.162 held mark is retired. */")
rep("    R.cur=e.bases.map(b=>plateOf(mine,b)).filter(Boolean).map(q=>{ q.up=true;q.lifePct=100;q.life=e.sec;q.fall=0;q._dead=0;q._eng=false;q._down=false;q.mist=false; return q.id; });",
    "    R.cur=e.bases.map(b=>plateOf(mine,b)).filter(Boolean).map(q=>{ q.up=true;q.lifePct=100;q.life=e.sec;q.fall=0;q._dead=0;q._eng=false;q._down=false;q.mist=false; rangeRelease(q); return q.id; }); /* r.169/r.196: a plate that just stood is unmarked. TARGET, then APPROVE, then FIRE. */")
rep("if((state.rangeMode||'bounce')==='bounce') toast('HIT · '+plateWord(s.id)+' · TARGET · APPROVE · FIRE');}",
    "if((state.rangeMode||'bounce')!=='stay') toast('HIT · '+plateWord(s.id)+' · TARGET · APPROVE · FIRE');} /* r.196: TRAIN UP and QUAL 40 say the next three words; TRAIN DOWN's hit stays down */")

# 1b · the silhouette's colour reads the slot phase: amber while marked, red once approved (the box and the caption already did; the plate itself went red on the mark)
rep("function hot(o){return !!(state.desig&&o&&(o.id===state.desig.id||o===state.desig.ref));}",
    "function hot(o){return !!(state.desig&&o&&(o.id===state.desig.id||o===state.desig.ref));}\nfunction phaseOf(o){ if(!o) return null; const d=state.desig; if(d&&(o.id===d.id||o===d.ref)) return d.phase==='red'?'red':'amber'; const k=markSlotOf(o.id); return k&&state.tgtSlot[k]?(state.tgtSlot[k].phase==='red'?'red':'amber'):null; } /* r.196: one phase for every painter */\nfunction phaseCol(o,dflt){ const p=phaseOf(o); return p==='red'?T13.LOCK:p==='amber'?T13.GIMBAL:dflt; } /* r.196 (operator 2026-10-11: \"targets turn Amber when targeted and after approved turn red\"): the silhouette, its glyph, its box and its caption read ONE phase — amber marked, red approved */")
rep("      segs(silMesh(q), hot(q)?T13.LOCK:mine?T13.SI:T13.STROKE);","      segs(silMesh(q), phaseCol(q, mine?T13.SI:T13.STROKE)); /* r.196: amber marked, red approved */")
rep("    hc.fillStyle=hot(o)?T13.LOCK:T13.TAG; hc.fillText(glyph(ctrl||o.ctrl||'HI'),pr.x,pr.y);","    hc.fillStyle=phaseCol(o,T13.TAG); hc.fillText(glyph(ctrl||o.ctrl||'HI'),pr.x,pr.y);")
rep("    (mine?own:segs)(silMesh(q),(hot(q)||q.mist)?T13.LOCK:(sheet&&!q.up)?T13.STROKE:mine?T13.SI:T13.STROKE);","    (mine?own:segs)(silMesh(q), q.mist?T13.LOCK:phaseCol(q,(sheet&&!q.up)?T13.STROKE:mine?T13.SI:T13.STROKE)); /* r.196: amber marked, red approved; a mist stays red */")

# 2 · the r0.178 picture: one row — RELOAD left, count centred, light right; the drawing 1:2; menu mode · lane · RESTART(right)
rep("#magWell{position:absolute;left:8px;top:92px;z-index:4;display:none;gap:12px;align-items:flex-end;pointer-events:none}\n#app.range #magWell{display:flex}\n#magWell button,#magWell .body{width:86px;background:rgba(0,0,0,.55);border:1px solid #1C2A3A;border-radius:10px;color:#7AB8C4;padding:8px 4px 6px;display:flex;flex-direction:column;align-items:center;gap:4px}\n#magWell button{pointer-events:auto;min-height:112px}\n#magWell .body{pointer-events:none;min-height:112px}\n#magWell svg{width:36px;height:82px;display:block}\n#magWell b{font-size:13px;letter-spacing:.14em;font-weight:500;color:#7AB8C4}\n#magWell #magRounds{font-size:22px;font-weight:700;letter-spacing:.04em;color:#3DCC8A;font-family:ui-monospace,Menlo,monospace}",
    "#magWell{position:absolute;left:8px;right:8px;top:42px;z-index:4;display:none;height:0;pointer-events:none} /* r.196: ONE row with the start light (the r0.178 picture) — RELOAD at the left, the round count centred, the light at the right */\n#app.range #magWell{display:block}\n#magWell button,#magWell .body{position:absolute;top:0;height:75px;box-sizing:border-box;background:rgba(0,0,0,.55);border:1px solid #1C2A3A;border-radius:10px;color:#7AB8C4;padding:4px 7px 3px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:2px}\n#magWell button{pointer-events:auto;left:0;min-height:0}\n#magWell .body{pointer-events:none;left:50%;transform:translateX(-50%)}\n#magWell svg{width:26px;height:52px;flex:none;display:block} /* r.196: the 48:96 drawing at exactly 1:2 — a magazine is never scaled unevenly (operator 2026-10-11, \"ensure magazines don't get distorted\") */\n#magWell b{font-size:11px;line-height:12px;letter-spacing:.14em;font-weight:500;color:#7AB8C4}\n#magWell #magRounds{font-size:13px;line-height:12px;font-weight:700;letter-spacing:.04em;color:#3DCC8A;font-family:ui-monospace,Menlo,monospace}")
rep("#app.range #rngMode{order:1}#app.range #btnRangeReset{order:2}#app.range #lanePick{order:3}",
    "#app.range #rngMode{order:1}#app.range #lanePick{order:2}#app.range #btnRangeReset{order:3;margin-left:auto} /* r.196: mode, lane, RESTART at the right — the r0.178 picture */")
rep("@media(orientation:portrait){ #app.range #playHud{right:80px} } /* r.157: the strip leaves the right edge to the start light under the magazine line */",
    "@media(orientation:portrait){ #app.range #playHud{top:6px;right:252px} #app.range #playHud #phScore{position:absolute;left:0;top:112px;width:calc(100% + 244px)} } /* r.196: on the range the strip sits beside the magazine line, above the row; the score line under the row (the r0.178 picture) */")

# 3 · THE RANGE from the intro and from the QR link, in PRACTICE
rep('    <button type="button" data-next="sc1" onclick="window.showScr&&window.showScr(\'sc1\')">SKIP TO SELECT</button>\n',
    '    <button type="button" data-next="sc1" onclick="window.showScr&&window.showScr(\'sc1\')">SKIP TO SELECT</button>\n    <button type="button" class="toRange">THE RANGE</button>\n') # operator 2026-10-11: THE RANGE is the THIRD option, no lane number
rep('    <button type="button" id="btnPractice">PRACTICE · NO ROOM · CH0 ONLY</button>\n',
    '    <button type="button" id="btnPractice">PRACTICE · NO ROOM · CH0 ONLY</button>\n    <button type="button" class="toRange">THE RANGE</button>\n')
rep("(function arcade(){\n  const intro=document.getElementById('intro'); if(!intro) return;",
    """function enterTheRange(lane, mode){ /* r.187/r.192 (carried in r.196): the intro's THE RANGE button and the QR link open Lane 21 in PRACTICE so TARGET, APPROVE and FIRE work at once */
  var n=(lane|0); if(!(n>=1&&n<=42)) n=21;
  var m=(mode==='train-down'||mode==='stay')?'stay':(mode==='qual40'?'qual40':'bounce');
  state.lane=n-1;
  state.rangeMode=m;
  state._selCraft='turret';
  state._selCh=0;
  state.challenge=0;
  var rm=document.getElementById('rngMode'); if(rm) rm.value=m;
  var intro=document.getElementById('intro'); if(intro) intro.style.display='none';
  if(typeof applyMode==='function') applyMode('turret');
  if(!(state.lobby&&state.lobby.phase==='LIVE')){ if(!state.lobby) state.lobby={}; state.lobby.phase='PRACTICE'; state.lobby.host=false; } /* r.192: The Range is a practice line. A lock could turn red while TARGET and FIRE still refused. */
  var c=document.getElementById('chLvl'); if(c) c.value='0';
  if(typeof goRange==='function') goRange();
  if(m==='stay'&&typeof downArm==='function') downArm();
  if(typeof paintCues==='function') paintCues();
  if(typeof rcoreStep==='function') rcoreStep('REALITY');
  if(typeof toast==='function') toast('THE RANGE');
}
(function arcade(){
  const intro=document.getElementById('intro'); if(!intro) return;
  intro.querySelectorAll('.toRange').forEach(b=>b.onclick=()=>enterTheRange(21,'train-up'));""")
rep("  const wjc=document.getElementById('wrJoinCode');if(wjc)wjc.oninput=e=>{e.target.value=String(e.target.value||'').replace(/\\D/g,'').slice(0,6);};\n})();",
    "  const wjc=document.getElementById('wrJoinCode');if(wjc)wjc.oninput=e=>{e.target.value=String(e.target.value||'').replace(/\\D/g,'').slice(0,6);};\n  var q; try{ q=new URLSearchParams(location.search||''); }catch(e){ q=null; }\n  if(q&&q.get('range')) enterTheRange(parseInt(q.get('range'),10)||21, q.get('mode')||'train-up'); /* r.187: the QR link opens its lane */\n})();")

# 4 · QA rows re-stated to the rule
cut("    { /* r.162 · MARK_SURVIVES_THE_RETURN (Addendum 14) — TRAIN UP: mark + approve once, then F, F, F */",
    "push('MARK_SURVIVES_THE_RETURN',",
    r"""    { /* r.196 · EVERY_TARGET_NEEDS_TARGET_APPROVE_FIRE (operator 2026-10-11) — in TRAIN UP, TRAIN DOWN and QUAL 40: F on an unmarked target is refused, TARGET makes it amber, F is refused, APPROVE makes it red, F hits; a target that stands again is unmarked */
      const l0=state.lane, z0=state.zoom, s0=state.unit, qaA=state.qaArmed, S0=state._qaSilent, sd0=state.simDirect, m0=state.rangeMode; state._qaSilent=true; state.qaArmed=true; state.simDirect=false; state.lane=20; parkRangeTurrets(); state.unit='T21'; const uu=units['T21']; state.zoom=1;
      const phs=q=>{ const k=markSlotOf(q.id); return k?state.tgtSlot[k].phase:'none'; }; const slot=q=>+(markSlotOf(q.id)||0); const res=[];
      const run=(mode)=>{ state.rangeMode=mode; rangeReset(); if(mode==='qual40') qualResetTower(); state.desig=null; state.tgtSlot={};
        const q=mode==='qual40'?rangeExpose(20,'C-150L'):plateOf(20,'C-150R'); aimUnitAt(uu,q,-40,40); state.aimRef=q;
        const h0=state.rangeHit|0, r0=state.mag.rounds; fireN(1); const bare=(state.rangeHit|0)===h0&&state.mag.rounds===r0&&phs(q)==='none';            /* F with nothing marked: refused, no round */
        designate({id:q.id,kind:'pop',ref:q},'QA'); const amber=phs(q)==='amber'; fireN(slot(q)); const amberHeld=(state.rangeHit|0)===h0&&state.mag.rounds===r0;  /* TARGET → amber; F refused */
        approveDesig('HI-2'); const red=phs(q)==='red'; fireN(slot(q)); const hit=(state.rangeHit|0)===h0+1&&state.mag.rounds===r0-1;                       /* APPROVE → red; F → HIT, one round */
        for(let i=0;i<20&&q.up;i++) rangeTick(0.05); const downBare=!q.up&&phs(q)==='none';                                                              /* the hit target goes down and its mark goes with it */
        let again=true; if(mode==='bounce'){ for(let i=0;i<(RETURN_S+1)*20&&!q.up;i++) rangeTick(0.05); aimUnitAt(uu,q,-40,40); const h1=state.rangeHit|0, r1=state.mag.rounds; fireN(1); const refused=(state.rangeHit|0)===h1&&state.mag.rounds===r1; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); fireN(slot(q)); again=!!q.up&&phs(q)==='none'?false:true; again=refused&&(state.rangeHit|0)===h1+1; }
        res.push(mode+': bare F refused '+bare+' · TARGET amber '+amber+' · amber F refused '+amberHeld+' · APPROVE red '+red+' · F hit '+hit+' · down and unmarked '+downBare+(mode==='bounce'?' · back up: bare F refused, TARGET · APPROVE · F hits again '+again:''));
        return bare&&amber&&amberHeld&&red&&hit&&downBare&&again; };
      const okU=run('bounce'), okD=run('stay'), okQ=run('qual40');
      state.desig=null; state.tgtSlot={}; state.aimRef=null; state.unit=s0; state.lane=l0; state.zoom=z0; state.qaArmed=qaA; state._qaSilent=S0; state.simDirect=sd0; state.rangeMode=m0; qualResetTower(); parkRangeTurrets(); rangeReset();
      push('EVERY_TARGET_NEEDS_TARGET_APPROVE_FIRE', okU&&okD&&okQ, res.join(' || ')); }
""")
rep("const ph=b=>{ const k=markSlotOf(plateOf(20,b).id); return k?state.tgtSlot[k].phase:'none'; };",
    "const ph=b=>{ const k=markSlotOf(plateOf(20,b).id); return k?state.tgtSlot[k].phase:'none'; }; const sl=b=>+(markSlotOf(plateOf(20,b).id)||0);", 2)
rep("look('C-100L'); const h0=state.rangeHit|0; fireN(state.slot||1); const hitA=(state.rangeHit|0)===h0+1; look('C-200L'); const r0=state.mag.rounds; fireN(state.slot||1); const refused=(state.rangeHit|0)===h0+1&&state.mag.rounds===r0;",
    "look('C-100L'); const h0=state.rangeHit|0; fireN(sl('C-100L')); const hitA=(state.rangeHit|0)===h0+1; look('C-200L'); const r0=state.mag.rounds; fireN(sl('C-200L')); const refused=(state.rangeHit|0)===h0+1&&state.mag.rounds===r0;")
rep("look('C-150R'); fireN(state.slot||1); const hitB=(state.rangeHit|0)===h0+2; const keptUp=ph('C-100L')==='red'&&ph('C-150R')==='red'&&ph('C-200L')==='amber';",
    "look('C-150R'); fireN(sl('C-150R')); const hitB=(state.rangeHit|0)===h0+2; const keptUp=ph('C-100L')==='none'&&ph('C-150R')==='none'&&ph('C-200L')==='amber'; /* r.196: the hit ones are released, the amber one is kept */")
rep("const hD=state.rangeHit|0; look('C-100L'); fireN(state.slot||1); const hitD=(state.rangeHit|0)===hD+1;",
    "const hD=state.rangeHit|0; look('C-100L'); fireN(sl('C-100L')); const hitD=(state.rangeHit|0)===hD+1;")
rep("const qualKept=!qq.up&&!!markSlotOf(qq.id);","const qualFresh=!qq.up&&!markSlotOf(qq.id); /* r.169/r.196: the group ends unmarked */")
rep("push('MARKS_ARE_REMEMBERED', three&&twoRed&&hitA&&refused&&hitB&&keptUp&&downGone&&qualKept, 'TRAIN UP: three marked '+three+' · two approved, one still amber '+twoRed+' · hit an approved one '+hitA+' · the amber one refused, no round '+refused+' · the other approved one hit '+hitB+' · marks kept '+keptUp+' · TRAIN DOWN: the hit one gone, the other still red '+downGone+' · QUAL 40: the mark outlives the group '+qualKept); }",
    "push('MARKS_ARE_REMEMBERED', three&&twoRed&&hitA&&refused&&hitB&&keptUp&&downGone&&qualFresh, 'TRAIN UP: three marked '+three+' · two approved, one still amber '+twoRed+' · hit an approved one '+hitA+' · the amber one refused, no round '+refused+' · the other approved one hit '+hitB+' · the hit ones released, the amber one kept '+keptUp+' · TRAIN DOWN: the hit one gone, the other still red '+downGone+' · QUAL 40: the group ends unmarked '+qualFresh); }")
rep("const o=state.desig&&state.desig.ref; const ringWould=!!o&&o.lifePct!=null&&o.lifePct<100&&o.lifePct>0&&o.up!==false; const downNow=!!o&&o.up===false; state.drawDone=dd0;",
    "const o=qd, od=state.desig&&state.desig.ref; const ringWould=!!od&&od.lifePct!=null&&od.lifePct<100&&od.lifePct>0&&od.up!==false; const downNow=!!o&&o.up===false&&!markSlotOf(o.id)&&!state.desig; state.drawDone=dd0; /* r.196: the hit target is down AND unmarked */")
rep("push('NO_RING_ON_A_DOWN_TARGET', downNow&&!ringWould&&/o\\.up!==false\\)\\{ \\/\\* r\\.165/.test(draw.toString()), 'the hit target is down and still marked ('+downNow+'); the damage ring is not drawn on it ('+!ringWould+')'); }",
    "push('NO_RING_ON_A_DOWN_TARGET', downNow&&!ringWould&&/o\\.up!==false\\)\\{ \\/\\* r\\.165/.test(draw.toString()), 'the hit target is down and unmarked ('+downNow+'); the damage ring is not drawn on it ('+!ringWould+')'); }")
rep("const oneRow=all3&&Math.abs(on[0].top-on[1].top)<2&&Math.abs(on[1].top-on[2].top)<2, order=all3&&on[0].left<on[1].left&&on[1].left<on[2].left;",
    "const oneRow=all3&&Math.abs(on[0].top-on[1].top)<2&&Math.abs(on[1].top-on[2].top)<2, order=all3&&on[0].left<on[2].left&&on[2].left<on[1].left; /* r.196: mode, lane, RESTART at the right (the r0.178 picture) */")
rep("' — mode, Restart and lane on one row inside '+innerWidth+'×'+innerHeight+'","' — mode, lane and RESTART (at the right) on one row inside '+innerWidth+'×'+innerHeight+'")
rep("'the magazine line and the strip are disjoint in this orientation ('+innerWidth+'×'+innerHeight+': '+(innerWidth>innerHeight?'landscape, side by side':'portrait, stacked')+')'",
    "'the magazine line and the strip are disjoint in this orientation ('+innerWidth+'×'+innerHeight+': '+(innerWidth>innerHeight?'landscape':'portrait')+', '+((a.bottom<=b.top||b.bottom<=a.top)?'stacked':'side by side')+')'")
ROWS=r"""    { /* r.196 · MAG_ROW_ONE_LINE (operator 2026-10-11: the r0.178 picture is the master; "ensure magazines don't get distorted") — RELOAD at the left, the count centred, the light at the right, on ONE row of one height, clear of the strip and the magazine line; the drawing keeps 1:2 */
      const app=document.getElementById('app'); const hadR=app.classList.contains('range'); app.classList.add('range');
      const rc=sel=>{ const e=document.querySelector(sel); if(!e) return null; const cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden') return null; const r=e.getBoundingClientRect(); return (r.width>0&&r.height>0)?r:null; };
      const rl=rc('#magReload'), bd=rc('#magWell .body'), sl=rc('#startLight'), st=rc('#stage'), s1=rc('#magReload svg'), s2=rc('#magWell .body svg'), hud=rc('#playHud'), ps=rc('#phScore'), mb=rc('#magBar');
      const all=!!rl&&!!bd&&!!sl&&!!st&&!!s1&&!!s2; const oneTop=all&&Math.abs(rl.top-bd.top)<=2&&Math.abs(bd.top-sl.top)<=2; const oneH=all&&Math.abs(rl.height-bd.height)<=1&&Math.abs(bd.height-sl.height)<=4;
      const off=all?((bd.left+bd.right)/2-(st.left+st.right)/2):NaN; const centred=all&&Math.abs(off)<=2; const order=all&&rl.right<bd.left&&bd.right<sl.left;
      const asp=r=>r?r.width/r.height:0; const trueShape=all&&Math.abs(asp(s1)-0.5)<=0.02&&Math.abs(asp(s2)-0.5)<=0.02&&Math.abs(s1.height-s2.height)<=1;
      const hits=(a,b)=>!!a&&!!b&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom; const clear=all&&[rl,bd,sl].every(r=>!hits(hud,r)&&!hits(mb,r));
      const scoreOk=innerWidth>innerHeight?(!!ps&&[rl,bd,sl].every(r=>!hits(ps,r))):(!!ps&&!!rl&&ps.top>=rl.bottom-0.5);
      if(!hadR) app.classList.remove('range');
      push('MAG_ROW_ONE_LINE', oneTop&&oneH&&centred&&order&&trueShape&&clear&&scoreOk, 'tops '+[rl,bd,sl].map(r=>r?Math.round(r.top):'-').join('/')+' · heights '+[rl,bd,sl].map(r=>r?Math.round(r.height):'-').join('/')+' · count centre off '+(isNaN(off)?'-':off.toFixed(1))+' px · RELOAD < count < light '+order+' · magazine aspect '+asp(s1).toFixed(2)+'/'+asp(s2).toFixed(2)+' · clear of the strip and the magazine line '+clear+' · the score '+(innerWidth>innerHeight?'beside':'under')+' the row '+scoreOk+' at '+innerWidth+'×'+innerHeight); }
    { /* r.196 · PLATE_DRAWN_AT_TRUE_SIZE (operator 2026-10-11, "distorted targets"): the drawn silhouette spans exactly plateDims at every zoom and range — the hit test and the amber/red box read the same outline (r.138/r.141); no pixel floor enlarges a far plate */
      const l0=state.lane, z0=state.zoom; state.lane=20; const res=[]; let okAll=true;
      [['C-50',1],['C-50',3],['C-300',1],['C-300',3]].forEach(([b,zm])=>{ const q=plateOf(20,b); if(!q){ okAll=false; res.push(b+' missing'); return; } state.zoom=zm; const up=q.up, f=q.fall; q.up=true; q.fall=0; const D=plateDims(q); const segs=silMesh(q); let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; segs.forEach(sg=>sg.forEach(p=>{ x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]); })); const w=x1-x0,h=y1-y0; const ok1=Math.abs(w-D.w)<=0.02&&Math.abs(h-D.h)<=0.02; okAll=okAll&&ok1; res.push(b+' ×'+zm+': drawn '+w.toFixed(3)+'×'+h.toFixed(3)+' m vs plate '+D.w.toFixed(3)+'×'+D.h.toFixed(3)+' m'); q.up=up; q.fall=f; });
      state.lane=l0; state.zoom=z0;
      push('PLATE_DRAWN_AT_TRUE_SIZE', okAll&&!/<28/.test(silMesh.toString()), res.join(' · ')+' · no pixel floor in silMesh'); }
    { /* r.196 · PHASE_COLOUR_FOLLOWS_THE_SLOT (operator 2026-10-11: "targets turn Amber when targeted and after approved turn red") — the silhouette's colour is the slot's phase: amber marked, red approved, plain otherwise; the plate itself used to go red on the mark */
      const l0=state.lane, s0=state.unit, qaA=state.qaArmed, S0=state._qaSilent, m0=state.rangeMode; state._qaSilent=true; state.qaArmed=true; state.lane=20; parkRangeTurrets(); state.unit='T21'; const uu=units['T21']; state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={};
      const q=plateOf(20,'C-100C'), q2=plateOf(20,'C-150R'); const plain=phaseCol(q,'X')==='X';
      aimUnitAt(uu,q,-40,40); designate({id:q.id,kind:'pop',ref:q},'QA'); const amber=phaseCol(q,'X')===T13.GIMBAL;
      aimUnitAt(uu,q2,-40,40); designate({id:q2.id,kind:'pop',ref:q2},'QA'); const firstStillAmber=phaseCol(q,'X')===T13.GIMBAL&&phaseCol(q2,'X')===T13.GIMBAL; /* the earlier mark keeps its phase when the current mark moves */
      aimUnitAt(uu,q,-40,40); approveDesig('HI-2', markSlotOf(q.id)); const red=phaseCol(q,'X')===T13.LOCK&&phaseCol(q2,'X')===T13.GIMBAL;
      state.desig=null; state.tgtSlot={}; const released=phaseCol(q,'X')==='X'&&phaseCol(q2,'X')==='X';
      const src=drawPlates.toString(); const onePainter=!/hot\(q\)\?T13\.LOCK/.test(src)&&/phaseCol\(q,/.test(src);
      state.unit=s0; state.lane=l0; state.qaArmed=qaA; state._qaSilent=S0; state.rangeMode=m0; parkRangeTurrets(); rangeReset();
      push('PHASE_COLOUR_FOLLOWS_THE_SLOT', plain&&amber&&firstStillAmber&&red&&released&&onePainter, 'unmarked plain '+plain+' · marked amber '+amber+' · a second mark leaves the first amber '+firstStillAmber+' · approved red, the other still amber '+red+' · released plain '+released+' · the plate painter reads the phase '+onePainter); }
"""
rep("    { /* r.157 · QUAL_DONE_SAYS_RESTART", ROWS+"    { /* r.157 · QUAL_DONE_SAYS_RESTART")

# 5 · the deck says what it is
rep('<pre id="updBox" style="white-space:pre-wrap;font-size:9px;color:#7AB8C4;max-height:220px;overflow:auto">r.178 ROUNDS',
    '<pre id="updBox" style="white-space:pre-wrap;font-size:9px;color:#7AB8C4;max-height:220px;overflow:auto">r.196 RESTORE · the r0.178 base, carried and hashed. Every target in every mode: TARGET, APPROVE, FIRE — amber, then red, then the shot. A marked target is amber; approved, it is red. Plates at their true size. RELOAD left, the count centred, the light right, one row. THE RANGE on the first screen and on the QR link.\nr.178 ROUNDS')
for dead in ["revision:'0.166'","r0.178</span>","MARK_SURVIVES_THE_RETURN","qualKept"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

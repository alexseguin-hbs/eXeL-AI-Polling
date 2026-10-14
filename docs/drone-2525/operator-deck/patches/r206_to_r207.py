# r.206 -> r.207 — THE GLASS KEEPS ITS PROMISES.
#  Operator 2026-10-13 (D-22): "The leftovers first". What is broken NOW, before the range officer:
#   D-24  a DARK button does not act — APPROVE is dark off the target and still reddened the mark and wrote an
#         APPROVE row into the record, the replay hash and the room (measured: 8.22 px clear of the outline, all
#         three buttons dark, strip "AMBER · T1 · 200 M RIGHT · AIM ON IT", and the press still carried).
#   D-25  the MAP leaves his sentence alone — r.206's own fix sent the map through paintCues, whose toast block
#         reads lockOn(), null there, so opening the MAP hid the step toast AND cleared toast._plate, so it never
#         came back. A regression r.206 introduced, named here rather than found on his phone.
#   D-26  a mark that ends takes its colour with it through EVERY door — r.206 claimed that and dropMark, the door
#         r.205 itself added and r.206's own two down-refusals use, never cleared the flag.
#   D-21  his decision: a lane sign clipped at the edge is SHRUNK on its own post, never moved off it, down to his
#         own 9 px floor; below that it is not drawn. r.159 untouched.
#   plus the restore hole in r.206's own new row, and the three QA legs that approve without aiming first.
import hashlib,os,subprocess,tempfile
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
BASE_REV='206'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.207.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.206')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)

# 0 · the deck declares itself
rep("revision:'0.206'","revision:'0.207'",1)
rep("r0.206","r0.207",1)

# 1 · D-24 · A DARK BUTTON DOES NOT ACT. FIRE has refused this since r.141 (TARGET_OFF_PICTURE, "YOUR RED BOX IS ON
#     THE 200 M RIGHT · YOUR BULLSEYE IS NOT"); APPROVE had no on-target test at all, so the glass said no and the
#     action said yes. The MAP is exempt by the same rule lockOn() already follows: it has no bullseye, so being
#     "on" a target is not a question it can answer, and r.206's CLASS 1b decided the current mark stands there.
rep(" aimed at an unmarked plate never books a row against another plate and never releases its box. It sat BELOW the two down-guards, and TARGET_DOWN called releaseAuthority, which empties every slot. */",
    " aimed at an unmarked plate never books a row against another plate and never releases its box. It sat BELOW the two down-guards, and TARGET_DOWN called releaseAuthority, which empties every slot. */",1)

# 1b0 · the guard sits BELOW the two down-guards, not above them. "Is the target still there?" is answered before
#      "are you aiming at it?" — a target that is DOWN cannot be aimed at, so NOT_ON_IT would be the wrong sentence
#      and, worse, it turned NO_APPROVE_ON_A_DEAD_TARGET away from the branch it is named for while leaving it green.
rep("""  if(state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)){ decide('HOLD',state.desig.id,{reason:'TARGET_DOWN'}); dropMark(state.desig.id,'TARGET DOWN'); toast('THAT TARGET IS ALREADY DOWN · MARK THE NEXT'); return; }""",
    """  if(state.desig.ref&&(state.desig.ref.up===false||state.desig.ref.lifePct<=0)){ decide('HOLD',state.desig.id,{reason:'TARGET_DOWN'}); dropMark(state.desig.id,'TARGET DOWN'); toast('THAT TARGET IS ALREADY DOWN · MARK THE NEXT'); return; }
  if(slot==null&&state.viewMode!=='map'&&marksPersist()&&state.desig.ref&&platesHere().some(p=>p.id===state.desig.id)&&typeof fireOnIt==='function'&&!fireOnIt({kind:state.desig.kind||kindOfRef(state.desig.ref),ref:state.desig.ref})){ decide('HOLD',state.desig.id,{reason:'NOT_ON_IT'}); toast(plateWord(state.desig.id)+' \u00b7 AIM ON IT'); return; } /* r.207 INVARIANT (D-24): A DARK BUTTON DOES NOT ACT. r.206 stopped LIGHTING APPROVE off the target; pressing it anyway still reddened the mark and wrote an APPROVE row into the record, the replay hash and the room, so the glass said no and the action said yes. FIRE has refused exactly this since r.141. It sits BELOW the down-guards on purpose: a target that is DOWN is answered as down, not as un-aimed. The MAP is exempt because it has no bullseye to be on - lockOn's own rule and r.206's CLASS 1b. SCOPE, stated rather than implied: marksPersist() and platesHere() put this on THE RANGE, in solo play; in a challenge and in a LIVE room a dark APPROVE still acts, which is CLASS 1e's ground and is owed with it. */""",1)

# 1b · the three QA legs that approve WITHOUT aiming first. The player aims; so must they. Each edit is setup only —
#      none of the three rows' subjects move. (The fourth row the guard touches, A_PRESS_NEVER_TOUCHES…, needs no
#      aim: its map leg cannot aim, which is what the exemption above is for.)
rep("function shootPlate(base,offPx){ rangeReset(); const q=rangeExpose(0,base); aimPlate(q,offPx||0); state.tgtSlot={}; state.desig=null; state.hiApproved=false;\n      designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const red=",
    "function shootPlate(base,offPx){ rangeReset(); const q=rangeExpose(0,base); aimPlate(q,0); state.tgtSlot={}; state.desig=null; state.hiApproved=false; /* r.207 (D-24): mark and approve ON the plate, as a player does */\n      designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); if(offPx) aimPlate(q,offPx); /* …and only THEN step the bullseye off it, which is what the offPx callers are testing */ const red=",1)
rep("{ const n1=state.mag.n, r1=state.mag.rounds; const q=PLATES.find(p=>p.id===R.cur[0]); state.mag.rounds=0;",
    "{ const n1=state.mag.n, r1=state.mag.rounds; const q=PLATES.find(p=>p.id===R.cur[0]); aimPlate(q,0); /* r.207 (D-24): the leg never aimed; FIRE's EMPTY_MAGAZINE check sits above its on-target check, so the refusal it tests is unchanged */ state.mag.rounds=0;",1)
rep("{ rangeReset(); const q=rangeExpose(0,'C-200L'); state.desig=null; state.tgtSlot={}; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const red0=",
    "{ rangeReset(); const q=rangeExpose(0,'C-200L'); aimPlate(q,0); /* r.207 (D-24): aiming is setup for getting the box red; the row's subject is that RELEASING it writes exactly one HOLD */ state.desig=null; state.tgtSlot={}; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const red0=",1)

# 1c · TWO MORE LEGS THAT APPROVE WITHOUT AIMING — found by the round on this very cut, and the most important thing
#      it found: the new guard INTERCEPTED them, so each stopped reaching the branch it is named for and BOTH STAYED
#      GREEN at all four viewports. That is the exact class this revision exists to close — "a row that can go green
#      by not being exercised is not a gate" (the twelve Masters' fleet). The same one-line edit as the other three.
rep("{ rangeReset(); const q=rangeExpose(0,'C-150L'); state.desig=null; state.tgtSlot={}; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const h0=state.rangeHit|0;",
    "{ rangeReset(); const q=rangeExpose(0,'C-150L'); aimPlate(q,0); /* r.207 (D-24): mark and approve ON the plate, or the new on-target guard refuses first and this row measures an amber box while calling it red */ state.desig=null; state.tgtSlot={}; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const h0=state.rangeHit|0;",1)


# 2 · D-25 · THE MAP LEAVES HIS SENTENCE ALONE (the regression r.206 introduced).
rep("{ const tt=document.getElementById('toast'); if(tt&&toast._plate&&tt.style.display!=='none'&&marksPersist()&&typeof lockOn==='function'){",
    "{ const tt=document.getElementById('toast'); if(tt&&toast._plate&&tt.style.display!=='none'&&state.viewMode!=='map'&&marksPersist()&&typeof lockOn==='function'){ /* r.207 INVARIANT (D-25): a view with no bullseye cannot judge whether the plate under it changed, so it takes nothing away from him. r.206 reached this block from the map for the first time (phys's map return now calls paintCues to unfreeze the buttons) and lockOn() is null there, so opening the MAP hid his step sentence AND cleared toast._plate — it never came back. */",1)

# 3 · D-26 · THROUGH EVERY DOOR. r.206 said a mark that ends takes its colour with it and closed releaseAuthority;
#     dropMark — the door r.205 added, used by both of r.206's own down-refusals — still left the flag standing.
rep("  Object.keys(state.tgtSlot||{}).forEach(k=>{ const sl=state.tgtSlot[k]; if(sl&&sl.id===id) delete state.tgtSlot[k]; });\n  state.pending=null; const ap0=document.getElementById('approve');",
    "  Object.keys(state.tgtSlot||{}).forEach(k=>{ const sl=state.tgtSlot[k]; if(sl&&sl.id===id) delete state.tgtSlot[k]; });\n  { const o=(typeof PLATES!=='undefined'?PLATES:[]).find(q=>q.id===id)||(typeof pops!=='undefined'?pops:[]).find(q=>q.id===id)||(typeof drones!=='undefined'?drones:[]).find(q=>q.id===id); if(o) o.mist=false; } /* r.207 (D-26): this door ends ONE target's mark, so it ends ONE target's colour — r.206 closed releaseAuthority and left dropMark, the door r.205 added and r.206's own two down-refusals use, so the orphan red could still be made through it */\n  state.pending=null; const ap0=document.getElementById('approve');",1)

# 4 · the restore hole in r.206's own new row (its sibling BUTTONS_ARE_DARK_OFF_THE_PICTURE already does it this way)
rep("const m0=state.rangeMode, d0=state.desig, s0=state.tgtSlot, a0=state.hiApproved, L0=state.lastShot, S0=state._qaSilent, q0=state.qaArmed, aR=state.aimRef; let ok=true, note='';",
    "const m0=state.rangeMode, d0=state.desig, s0=state.tgtSlot, a0=state.hiApproved, L0=state.lastShot, S0=state._qaSilent, q0=state.qaArmed, aR=state.aimRef, v0=state.viewMode; let ok=true, note=''; /* r.207: viewMode is saved HERE — the row flips to the map inside its try, and a throw there left the boot screen on the one view where nothing can light */",1)
rep("finally{ uu.pan=pp; uu.tilt=tt; state.aimRef=aR; state.lastShot=L0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.rangeMode=m0;",
    "finally{ uu.pan=pp; uu.tilt=tt; state.aimRef=aR; state.lastShot=L0; state.viewMode=v0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.rangeMode=m0;",1)

# 5 · D-21 (HIS DECISION, 2026-10-13: "Shrink them at the edge") · A SIGN SHOWS ITS WHOLE NUMBER. boardLabels judged a
#     sign's visibility on the board's CENTRE and then drew the box plus or minus half a width, so a sign near either
#     edge lost its first digit — his shot51, "0 21" for "20 21". It now SHRINKS on its own post until the whole box
#     is inside the picture, down to SIGN_MIN_PX, his own legibility floor; below that it is not drawn, because a
#     clipped number and an illegible one are both worse than none. It never moves sideways: r.159, his rule that a
#     sign stays on its post's line (LANE_NUMBERS_ON_THE_SIGN holds it to 1 px), is untouched.
rep("const fs=Math.max(SIGN_MIN_PX,Math.min(14,bh*1.5)); const hw=Math.max(1,bw,tw*fs/20+3), hh=Math.max(1,bh,fs*0.6+1);",
    "let fs=Math.max(SIGN_MIN_PX,Math.min(14,bh*1.5));\n"
    "    { const room=Math.min(pr.x-2,W-2-pr.x); /* r.207 (D-21, his word: \"Shrink them at the edge\"): the half-width the picture leaves this post */\n"
    "      if(room<Math.max(1,bw)) return; /* even the real board will not fit beside its own post: not drawn, never clipped */\n"
    "      if(tw>0&&tw*fs/20+3>room){ fs=(room-3)*20/tw; if(fs<SIGN_MIN_PX) return; } } /* shrink the number until the box is inside, and stop at his 9 px floor */\n"
    "    const hw=Math.max(1,bw,tw*fs/20+3), hh=Math.max(1,bh,fs*0.6+1);",1)

# 6 · the gates. Each is shown RED on the r.206 bytes before the fix, and each fails with NOT EXERCISED rather than
#     passing by omission.
# 6a · ONE_MEANING_OF_UNDER_THE_BULLSEYE now PRESSES the dark button instead of only comparing lit-ness (its own
#      comment said "lights AND ACTS" while the row measured only the light — a gate claiming more than it measures).
rep("        const amberCss='rgb(240, 160, 32)'; const ranLast=/^LAST · /.test(lastTxt);",
    "        rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; uu.pan=pp; uu.tilt=tt;\n"
    "        const z=plateOf(state.lane,'C-100C'); aimUnitAt(uu,z,-40,40); state.aimRef=z; markLock(lockOn(),'QA'); state.aimRef=null;\n"
    "        let band=0; for(let i=0;i<40&&!band;i++){ uu.pan+=0.08; if(!fireOnIt({kind:'pop',ref:z})) band=i+1; }\n"
    "        const e9=(state.events||[]).length; approveDesig('HI-2'); const after=(markSlotOf(z.id)&&state.tgtSlot[markSlotOf(z.id)].phase)||'none';\n"
    "        const rows9=(state.events||[]).slice(e9).map(e=>e&&e.result).join(',');\n"
    "        const darkHolds=band>0&&after==='amber'&&/NOT_ON_IT/.test(rows9)&&!/SOLO/.test(rows9); /* r.207 (D-24): the row PRESSES the dark button now */\n"
    "        const amberCss='rgb(240, 160, 32)'; const ranLast=/^LAST · /.test(lastTxt);",1)
rep("else if(!ranLast){ ok=false; note='NOT EXERCISED: the LAST line did not show on the map",
    "else if(!band){ ok=false; note='NOT EXERCISED: the bullseye never left the mark inside forty steps'; }\n        else if(!ranLast){ ok=false; note='NOT EXERCISED: the LAST line did not show on the map",1)
rep("else { ok = bad===0 && unmarked!==amberCss && sky!==amberCss && lastCol!==amberCss;",
    "else { ok = bad===0 && unmarked!==amberCss && sky!==amberCss && lastCol!==amberCss && darkHolds;",1)
rep("and on the LAST line '+lastCol+' (the amber of a mark is '+amberCss+')'; } }",
    "and on the LAST line '+lastCol+' (the amber of a mark is '+amberCss+') · a DARK APPROVE pressed '+band*0.08+'° off the target leaves the mark '+after+' and books '+(rows9||'nothing')+' '+darkHolds; } }",1)

# 6b · NO_COLOUR_WITHOUT_A_MARK now opens BOTH doors. Its comment said "EVERY door"; it opened releaseAuthority only,
#      and dropMark is the one r.205 added and r.206's own down-refusals use.
rep("        else { releaseAuthority('QA');\n          const orphans=platesHere().filter(q=>q.mist&&!markSlotOf(q.id)&&!(state.desig&&state.desig.id===q.id));\n          const boxes=(typeof slotBoxes==='function')?slotBoxes().length:-1;\n          ok = orphans.length===0 && boxes===0;\n          note='two marked (one approved), then releaseAuthority: targets still wearing a colour with no mark '+orphans.length+' ('+orphans.map(q=>plateWord(q.id)).join(', ')+') · boxes drawn '+boxes; } }",
    "        else { dropMark(A.id,'QA'); /* r.207 (D-26): the OTHER door first — the one r.205 added and r.206's two down-refusals use */\n"
    "          const orphD=platesHere().filter(q=>q.mist&&!markSlotOf(q.id)&&!(state.desig&&state.desig.id===q.id));\n"
    "          releaseAuthority('QA');\n"
    "          const orphans=platesHere().filter(q=>q.mist&&!markSlotOf(q.id)&&!(state.desig&&state.desig.id===q.id));\n"
    "          const boxes=(typeof slotBoxes==='function')?slotBoxes().length:-1;\n"
    "          ok = orphD.length===0 && orphans.length===0 && boxes===0;\n"
    "          note='two marked (one approved); after dropMark, targets wearing a colour with no mark '+orphD.length+' ('+orphD.map(q=>plateWord(q.id)).join(', ')+'); after releaseAuthority, '+orphans.length+' ('+orphans.map(q=>plateWord(q.id)).join(', ')+') · boxes drawn '+boxes; } }",1)

# 6c · THE_MAP_KEEPS_HIS_SENTENCE — the regression r.206 introduced, gated so it cannot come back.
ROW5 = """    { /* r.207 · THE_MAP_KEEPS_HIS_SENTENCE (D-25) - INVARIANT: a view with no bullseye takes nothing away from him. r.206's own fix for the frozen lit button sent the map through paintCues for the first time, whose toast block reads lockOn() - null on the map - so opening the MAP hid the sentence telling him his next step AND cleared toast._plate, and it never came back. One real map frame, then back. */
      const m0=state.rangeMode, d0=state.desig, s0=state.tgtSlot, a0=state.hiApproved, v0=state.viewMode, S0=state._qaSilent, q0=state.qaArmed; let ok=true, note='';
      try{ state.qaArmed=true; state._qaSilent=false; state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.viewMode='op';
        const uu=units[state.unit]; const q=plateOf(state.lane,'C-200R'); aimUnitAt(uu,q,-40,40); state.aimRef=q; markLock(lockOn(),'QA');
        const tt=document.getElementById('toast'); toast('NOW PRESS APPROVE',q.id);
        const before=tt.style.display;
        if(before==='none'){ ok=false; note='NOT EXERCISED: no step toast was showing before the map'; }
        else { state.viewMode='map'; phys(0.05); const onMap=tt.style.display; const plateOnMap=toast._plate;
          state.viewMode='op'; phys(0.05); const back=tt.style.display;
          ok = onMap!=='none' && back!=='none' && !!plateOnMap;
          note='a step toast showing on the picture ('+before+'), through one real MAP frame ('+onMap+', its plate '+(plateOnMap||'cleared')+'), and back on the picture ('+back+')'; } }
      catch(e){ ok=false; note='threw '+String(e).slice(0,110); }
      finally{ state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.viewMode=v0; state.rangeMode=m0; rangeReset(); state.desig=d0; state.tgtSlot=s0; state.hiApproved=a0; state._qaSilent=S0; state.qaArmed=q0; }
      push('THE_MAP_KEEPS_HIS_SENTENCE', ok, note); }
"""
rep("    { /* r.157 · QUAL_DONE_SAYS_RESTART", ROW5+"    { /* r.157 · QUAL_DONE_SAYS_RESTART",1)

# 6d · LANE_NUMBERS_ON_THE_SIGN also holds that every sign it DOES draw is wholly inside the picture (his shot51).
rep("if(!c||!l||Math.abs(c.x-b.x)>1||(b.x1-b.x0)/2+1e-6<Math.max(1,Math.abs(c.x-l.x))||b.fs<SIGN_MIN_PX||tw>b.x1-b.x0||b.sh!==signShort(m)) bad++;",
    "if(!c||!l||Math.abs(c.x-b.x)>1||(b.x1-b.x0)/2+1e-6<Math.max(1,Math.abs(c.x-l.x))||b.fs<SIGN_MIN_PX||tw>b.x1-b.x0||b.sh!==signShort(m)||b.x0<1.5||b.x1>W-1.5) bad++; /* r.207 (D-21): …and the whole sign is inside the picture — the centre was tested and the box drawn plus or minus half a width, so an edge sign lost its first digit (his shot51) */",1)
rep("without legible numbers (≥ '+SIGN_MIN_PX+' px, short form like \"20 21\") inside a board at least its real 0.",
    "without legible numbers (≥ '+SIGN_MIN_PX+' px, short form like \"20 21\"), on their own post and wholly inside the picture, inside a board at least its real 0.",1)

# 6e · …and the row DELIBERATELY WALKS A SIGN TO THE EDGE, so it cannot pass by omission. Its four fixed looks happen
#      to produce a clipped sign at 844x390 and 428x926 and none at 390x844 and 375x667 — a row that is red only at
#      some sizes is the same failure the fleet named. It now pans until a sign's post is within a half-width of an
#      edge, and says NOT EXERCISED if it never finds one.
rep("        res.push(z+'× '+plateWord(base)+': '+bl.length); });\n      state.unit=s0; state.lane=l0; state.zoom=z0; parkRangeTurrets(); rangeReset();",
    "        res.push(z+'× '+plateWord(base)+': '+bl.length); });\n"
    "      let edgeLooks=0, edgeBad=0, edgeSmall=0, edgeWorst=''; /* r.207 (D-21): walk a sign to the edge on purpose */\n"
    "      { state.zoom=3; const anchor=plateOf(20,'C-100C')||plateOf(20,'C-50'); if(anchor){ const p0=uu.pan;\n"
    "        for(let k=-80;k<=80;k++){ uu.pan=p0+k*0.5; const cam2=camOf(uu); const bl2=boardLabels(hc,W,H,cam2);\n"
    "          const near=bl2.filter(b=>b.x0<(b.x1-b.x0)||b.x1>W-(b.x1-b.x0)); if(!near.length) continue; edgeLooks++;\n"
    "          const out2=bl2.filter(b=>b.x0<1.5||b.x1>W-1.5); edgeSmall+=bl2.filter(b=>b.fs>SIGN_MIN_PX+0.01&&b.fs<13.99).length; if(out2.length){ edgeBad+=out2.length; if(!edgeWorst) edgeWorst=out2[0].sh+' at x0 '+Math.round(out2[0].x0); } }\n"
    "        uu.pan=p0; } }\n"
    "      state.unit=s0; state.lane=l0; state.zoom=z0; parkRangeTurrets(); rangeReset();",1)
rep("push('LANE_NUMBERS_ON_THE_SIGN', n>0&&bad===0&&MARKER_BOARD_W===0.6&&MARKER_BOARD===0.35,",
    "push('LANE_NUMBERS_ON_THE_SIGN', n>0&&bad===0&&edgeLooks>0&&edgeBad===0&&MARKER_BOARD_W===0.6&&MARKER_BOARD===0.35,",1)
rep("' signs written ('+res.join(' · ')+'), '+bad+",
    "' signs written ('+res.join(' · ')+'), '+(edgeLooks?(edgeLooks+' looks with a sign against an edge, '+edgeBad+' of them drawn outside the picture, '+edgeSmall+' shrunk to fit'+(edgeWorst?' ('+edgeWorst+')':'')):'NOT EXERCISED: no look put a sign against an edge')+', '+bad+",1)

# 7 · the deck says what it is
rep('overflow:auto">r.206 NO COLOUR WITHOUT A MARK · ',
    "overflow:auto\">r.207 THE GLASS KEEPS ITS PROMISES · what the glass shows is what the deck does: a button that is dark does not act if you press it, a view with no bullseye takes nothing away from you, a mark that ends takes its colour with it through every door, and a lane sign shows its whole number - shrunk on its own post where the picture is tight, never moved off it and never cut; NO COLOUR WITHOUT A MARK · ",1)

for dead in ["revision:'0.206'",'overflow:auto">r.206','r0.206',
             "const fs=Math.max(SIGN_MIN_PX,Math.min(14,bh*1.5)); const hw=",
             "aimPlate(q,offPx||0); state.tgtSlot={}; state.desig=null; state.hiApproved=false;\n      designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const red=",
             "tt.style.display!=='none'&&marksPersist()&&typeof lockOn==='function'"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead[:60]}')
for need in ["r.207 INVARIANT (D-24): A DARK BUTTON DOES NOT ACT",
             "r.207 INVARIANT (D-25): a view with no bullseye cannot judge",
             "r.207 (D-26): this door ends ONE target's mark",
             "r.207 (D-21, his word:",
             "push('THE_MAP_KEEPS_HIS_SENTENCE'",
             "const darkHolds=band>0&&after==='amber'",
             "dropMark(A.id,'QA');",
             "state.viewMode=v0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.rangeMode=m0;",
             'overflow:auto">r.207 THE GLASS KEEPS ITS PROMISES · ',
             "let edgeLooks=0, edgeBad=0, edgeSmall=0, edgeWorst='';","edgeLooks>0&&edgeBad===0"]:
    if s.count(need)!=1: raise SystemExit('REFUSE: not in once ('+str(s.count(need))+'): '+need)

# 8 · THE CUT IS PARSED BEFORE IT IS WRITTEN. Twice in r.205/r.206 a cut was written that did not parse, and the
#     failure only showed when a browser booted it. The deck's one inline script is extracted and handed to node.
import re as _re
_m=max(_re.findall(r'<script[^>]*>(.*?)</script>', s, _re.S), key=len)
with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as _f:
    _f.write(_m); _p=_f.name
_r=subprocess.run(['node','--check',_p],capture_output=True,text=True)
os.unlink(_p)
if _r.returncode!=0: raise SystemExit('REFUSE: the cut does not parse —\n'+(_r.stderr or '')[:1200])
print('parsed OK ('+str(len(_m))+' chars of script)')

open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

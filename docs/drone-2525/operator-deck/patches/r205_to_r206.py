# r.205 -> r.206 — NO COLOUR WITHOUT A MARK, AND ONE MEANING OF "UNDER THE BULLSEYE".
#  The twelve Masters' fleet (145 agents, docs/assessments/2026-10-13_drone2525_fleet12_phantom_and_colour.md) left five
#  defects OPEN on the LIVE r.205, all of them against his 21:15 criterion: "ensure all targets and siloeets have the
#  proper color boxing with button when bulleseye osnover target". Two were re-verified here on the shipped bytes
#  before a line was written (scratchpad/r206/probe1.mjs).
#  INVARIANTS (r.206): a target with no box is the plain silhouette, no mark no colour · the box goes to the silhouette
#  the bullseye is ON, never to a nearer one beside it · no bullseye, nothing lit · one meaning of "under the bullseye"
#  for amber and red alike · amber means marked, and only marked.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
BASE_REV='205'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.206.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.205')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)

# 0 · the deck declares itself
rep("revision:'0.205'","revision:'0.206'",1)
rep("r0.205","r0.206",1)

# 1 · D1 — A TARGET WITH NO BOX IS THE PLAIN SILHOUETTE. releaseAuthority let go of the mark and kept the colour: the
#     mist flag stayed true on every plate it released, and r.205's painter reads the mist as the default WHERE THERE IS
#     NO PHASE - so an unmarked, unboxed, standing target wore the approved red for ever and never healed. Eleven call
#     sites share this door (RE-MARK, ROOM START, SCENE CHANGE, RESET, TARGET_DOWN/GONE, a peer's reset, a lane change).
#     rangeReset was already clean, which is why r.205's own SILHOUETTE_COLOUR_IS_THE_PHASE row is green over this.
rep("  state.desig=null; state.hiApproved=false; state.hiLock=false; state.tgtSlot={}; state.pending=null; const ap=document.getElementById('approve');",
    "  state.desig=null; state.hiApproved=false; state.hiLock=false; state.tgtSlot={}; state.pending=null;\n"
    "  (typeof PLATES!=='undefined'?PLATES:[]).forEach(q=>{q.mist=false;}); (typeof pops!=='undefined'?pops:[]).forEach(q=>{q.mist=false;}); (typeof drones!=='undefined'?drones:[]).forEach(q=>{q.mist=false;}); /* r.206 INVARIANT (D1): the colour goes with the mark. This door released the mark and left the mist flag standing, and the painter reads the mist where there is no phase - so a standing, unmarked, unboxed target wore the approved red for ever. Every target this door releases goes back to the plain silhouette. */\n"
    "  const ap=document.getElementById('approve');",1)

# 2 · D2 — THE BOX GOES TO THE SILHOUETTE THE BULLSEYE IS ON. The admission margin was 8 px and the tie-break was world
#     metres, so a NEARER plate up to 8 px beside the pip took the box, the round and the kill from the plate the pip
#     was inside: measured 12 of 45 aim points by the fleet, 2 of 10 here. The deck's own r.147 line already declares
#     "nearest to the pip on the picture, never the nearest in metres". Two passes: strictly inside first, the 8 px
#     reach only as a fallback, and within each pass the nearest to the OUTLINE wins, metres only breaking an exact tie.
rep("{ let ub=null,ud=1e9; const px=W/2,py=H*.46,m=8; platesHere().forEach(p=>{ if(!p.up||(p.fall||0)>0.25||p.lifePct<=0) return; const r=plateRect(p); if(!r) return; if(Math.abs(px-r.cx)<=r.half+m&&py>=r.top-m&&py<=r.bot+m){ const s2=sc(worldOf(p)); if(s2.dist<ud){ ud=s2.dist; ub={id:p.id,dist:s2.dist,kind:'pop',ref:p,lane:p.lane}; } } }); if(ub) return ub; }",
    "{ const px=W/2,py=H*.46; const pick=(m)=>{ let ub=null,ubo=1e9,ubd=1e9; platesHere().forEach(p=>{ if(!p.up||(p.fall||0)>0.25||p.lifePct<=0) return; const r=plateRect(p); if(!r) return; const dxO=Math.abs(px-r.cx)-r.half, dyO=Math.max(r.top-py,py-r.bot), out=Math.max(dxO,dyO); if(dxO>m||dyO>m) return; const s2=sc(worldOf(p)); if(out<ubo-1e-9||(Math.abs(out-ubo)<=1e-9&&s2.dist<ubd)){ ubo=out; ubd=s2.dist; ub={id:p.id,dist:s2.dist,kind:'pop',ref:p,lane:p.lane}; } }); return ub; }; const ub=pick(0)||pick(8); if(ub) return ub; } /* r.206 INVARIANT (D2): a plate the bullseye is strictly INSIDE wins before any plate merely within reach of it, and inside each pass the nearest to the OUTLINE wins - world metres break an exact tie only. The r.143 reach stays as the fallback so a 300 m plate is still takeable; it no longer beats the plate under the pip (the box, the round and the kill went to a plate he was not on, 12 of 45 aim points). */",1)

# 3 · D3 — NO BULLSEYE, NOTHING LIT. The map's early return painted the score and the strip and left the buttons alone,
#     so a lit FIRE stayed lit - and glowing - on the one view that has no bullseye at all, refusing every press.
rep("    hudScore(); hudPhase(); return; /* r.134: the strip froze at TARGET FIRST through amber → red → HIT while the map was up */",
    "    hudScore(); hudPhase(); paintCues(); return; /* r.134: the strip froze at TARGET FIRST through amber → red → HIT while the map was up */ /* r.206 INVARIANT (D3): and the BUTTONS froze with it - paintCues is their only writer, so a lit FIRE stayed lit and glowing on the one view with no bullseye, refusing every press. paintCues touches the HUD only (the three buttons, RELOAD's call, RESTART's word, the light, the timer, the pose card); it draws nothing on the picture. */",1)

# 4 · D4 — ONE MEANING OF "UNDER THE BULLSEYE". stepFor carried the on-target test on the RED branch only, so across a
#     28 px band (8 to 35.9 px clear of the outline) the same pixel lit APPROVE - and APPROVE acted - where FIRE went
#     dark and said AIM ON IT. Amber is narrowed to red's honest rule; red is NOT widened (widening it would light a
#     button the deck then refuses and fail the green transit leg that r.204 earned).
rep("if(d.phase==='amber') return approveWorksHere(d)?'APPROVE':''; return null; }",
    "if(d.phase==='amber') return (approveWorksHere(d)&&(!d.ref||fireOnIt({kind:d.kind||kindOfRef(d.ref),ref:d.ref})))?'APPROVE':''; return null; } /* r.206 (D4): amber answers the same question red does - is the bullseye ON it */",1)
rep("(approveWorksHere(d)?'PRESS APPROVE':'THE OTHER SEAT APPROVES')",
    "(approveWorksHere(d)?((d.ref&&!fireOnIt({kind:d.kind||kindOfRef(d.ref),ref:d.ref}))?'AIM ON IT':'PRESS APPROVE'):'THE OTHER SEAT APPROVES')",1)

# 5 · D5 — AMBER MEANS MARKED, AND ONLY MARKED. The recital painted an UNTARGETED plate, and a DOWN plate, in the amber
#     he reserves for a targeted one, while its own "nothing under the bullseye" line already had a pre-mark gold.
rep("pd.textContent=plateWord(lk.id)+' · PRESS TARGET'; pd.style.color='#F0A020';",
    "pd.textContent=plateWord(lk.id)+' · PRESS TARGET'; pd.style.color='#C9A227';",1)
rep("else if(ls){pd.textContent='LAST · '+plateWord(ls.id)+' · '+(ls.dead?'DOWN':(String(ls.id||'').charAt(0)==='C'?'MISS':((ls.life|0)+'%'+(ls.direct?' DIRECT':' OFF')))); pd.style.color='#F0A020';}",
    "else if(ls){pd.textContent='LAST · '+plateWord(ls.id)+' · '+(ls.dead?'DOWN':(String(ls.id||'').charAt(0)==='C'?'MISS':((ls.life|0)+'%'+(ls.direct?' DIRECT':' OFF')))); pd.style.color=T13.SI;} /* r.206 (D5): the LAST line is not a mark, so it is not amber */",1)

# 5b · the gates. Each is red on the r.205 bytes and green here, and each pushes ok:false with NOT EXERCISED rather
#      than going green by omission (the fleet's deeper finding: r.205's own colour row is green over D1 because its
#      release leg calls rangeRelease, the one door that already cleared the flag).
ROW4 = """    { /* r.206 · NO_COLOUR_WITHOUT_A_MARK (the twelve Masters, D1; his 21:15 \\"ensure all targets and siloeets have the proper color boxing\\") - INVARIANT: a target with no box is the plain silhouette. A mark that ends takes its colour with it, through EVERY door, releaseAuthority included - the door r.205's own colour row never opens. */
      const m0=state.rangeMode, d0=state.desig, s0=state.tgtSlot, a0=state.hiApproved, S0=state._qaSilent, q0=state.qaArmed; let ok=true, note='';
      try{ state._qaSilent=true; state.qaArmed=true; state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false;
        const uu=units[state.unit]; const A=plateOf(state.lane,'C-100C'), B=plateOf(state.lane,'C-200R');
        aimUnitAt(uu,A,-40,40); state.aimRef=A; markLock(lockOn(),'QA'); approveDesig('HI-2');
        aimUnitAt(uu,B,-40,40); state.aimRef=B; markLock(lockOn(),'QA');
        const armed=(markSlotOf(A.id)&&state.tgtSlot[markSlotOf(A.id)].phase)==='red'&&!!markSlotOf(B.id);
        if(!armed){ ok=false; note='NOT EXERCISED: the two marks were not made (A '+String(markSlotOf(A.id))+', B '+String(markSlotOf(B.id))+')'; }
        else { releaseAuthority('QA');
          const orphans=platesHere().filter(q=>q.mist&&!markSlotOf(q.id)&&!(state.desig&&state.desig.id===q.id));
          const boxes=(typeof slotBoxes==='function')?slotBoxes().length:-1;
          ok = orphans.length===0 && boxes===0;
          note='two marked (one approved), then releaseAuthority: targets still wearing a colour with no mark '+orphans.length+' ('+orphans.map(q=>plateWord(q.id)).join(', ')+') · boxes drawn '+boxes; } }
      catch(e){ ok=false; note='threw '+String(e).slice(0,110); }
      finally{ state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.rangeMode=m0; rangeReset(); state.desig=d0; state.tgtSlot=s0; state.hiApproved=a0; state._qaSilent=S0; state.qaArmed=q0; }
      push('NO_COLOUR_WITHOUT_A_MARK', ok, note); }
    { /* r.206 · THE_BOX_GOES_TO_THE_PLATE_UNDER_THE_PIP (the twelve Masters, D2; the deck's own r.147 line: LOCK is the target nearest the pip ON THE PICTURE, never the nearest in metres) - INVARIANT: whenever the bullseye is strictly inside exactly one standing silhouette, that silhouette is the one the three buttons act on. A nearer plate beside it took the box, the round and the kill. */
      const m0=state.rangeMode, d0=state.desig, s0=state.tgtSlot, S0=state._qaSilent, q0=state.qaArmed, aR=state.aimRef; let ok=true, note='';
      const uu=units[state.unit]; const p0=uu.pan, t0=uu.tilt;
      try{ state._qaSilent=true; state.qaArmed=true; state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.aimRef=null;
        const ups=platesHere().filter(q=>q.up&&q.lifePct>0); const px=view.width/2, py=view.height*0.46;
        const inside=(q)=>{ const r=plateRect(q); return !!r&&px>r.cx-r.half&&px<r.cx+r.half&&py>r.top&&py<r.bot; };
        let tested=0, wrong=0, ex='';
        for(let dp=-10;dp<=10;dp++) for(let dt=-6;dt<=6;dt++){
          uu.pan=p0+dp*0.25; uu.tilt=t0+dt*0.25; const hit=ups.filter(inside);
          if(hit.length!==1) continue; tested++; const lk=lockOn();
          if(!lk||lk.id!==hit[0].id){ wrong++; if(!ex) ex=' (the bullseye inside '+plateWord(hit[0].id)+', the box to '+(lk?plateWord(lk.id):'none')+')'; } }
        if(!tested){ ok=false; note='NOT EXERCISED: no aim point was strictly inside exactly one silhouette'; }
        else { ok=wrong===0; note=tested+' aim points with the bullseye strictly inside exactly one silhouette · the box went elsewhere '+wrong+' times'+ex; } }
      catch(e){ ok=false; note='threw '+String(e).slice(0,110); }
      finally{ uu.pan=p0; uu.tilt=t0; state.aimRef=aR; state.desig=null; state.tgtSlot={}; state.rangeMode=m0; rangeReset(); state.desig=d0; state.tgtSlot=s0; state._qaSilent=S0; state.qaArmed=q0; }
      push('THE_BOX_GOES_TO_THE_PLATE_UNDER_THE_PIP', ok, note); }
    { /* r.206 · BUTTONS_ARE_DARK_OFF_THE_PICTURE (the twelve Masters, D3) - INVARIANT: no bullseye, nothing lit. The map has no bullseye at all, and a lit FIRE stayed lit and glowing there, refusing every press, because the map's early return never reached the buttons' only painter. */
      const m0=state.rangeMode, d0=state.desig, s0=state.tgtSlot, a0=state.hiApproved, v0=state.viewMode, S0=state._qaSilent, q0=state.qaArmed; let ok=true, note='';
      try{ state._qaSilent=true; state.qaArmed=true; state.rangeMode='bounce'; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.viewMode='op';
        const uu=units[state.unit]; const q=plateOf(state.lane,'C-200R'); aimUnitAt(uu,q,-40,40); state.aimRef=q; markLock(lockOn(),'QA'); approveDesig('HI-2'); paintCues();
        const lit=()=>[...document.querySelectorAll('#fTgt,#fAppr,#fFire')].filter(b=>b.classList.contains('lit')).map(b=>b.id).join(',');
        const on=lit();
        if(on!=='fFire'){ ok=false; note='NOT EXERCISED: FIRE was not lit on the picture first (lit '+(on||'none')+')'; }
        else { state.viewMode='map'; phys(0.05); const onMap=lit(); state.viewMode='op'; phys(0.05); const back=lit();
          ok = onMap==='' && back==='fFire';
          note='a red mark standing: lit on the picture '+on+' · on the MAP, after one real frame, lit '+(onMap||'none')+' (want none) · back on the picture '+(back||'none'); } }
      catch(e){ ok=false; note='threw '+String(e).slice(0,110); }
      finally{ state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.viewMode=v0; state.rangeMode=m0; rangeReset(); state.desig=d0; state.tgtSlot=s0; state.hiApproved=a0; state._qaSilent=S0; state.qaArmed=q0; }
      push('BUTTONS_ARE_DARK_OFF_THE_PICTURE', ok, note); }
    { /* r.206 · ONE_MEANING_OF_UNDER_THE_BULLSEYE (the twelve Masters, D4 and D5) - INVARIANT: amber and red answer the SAME question about being on a target, so there is no band where one button lights and acts while the other goes dark and says AIM ON IT; and the amber of a mark is used for a mark and nothing else, so the recital never paints an untargeted or a downed plate in it. Walked off one mark 0.08 deg at a time, once amber and once red, at the same offsets. */
      const m0=state.rangeMode, d0=state.desig, s0=state.tgtSlot, a0=state.hiApproved, L0=state.lastShot, S0=state._qaSilent, q0=state.qaArmed, aR=state.aimRef; let ok=true, note='';
      const uu=units[state.unit]; const pp=uu.pan, tt=uu.tilt;
      try{ state._qaSilent=true; state.qaArmed=true; state.rangeMode='bounce';
        const walk=(red)=>{ rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false; uu.pan=pp; uu.tilt=tt;
          const q=plateOf(state.lane,'C-50L'); aimUnitAt(uu,q,-40,40); state.aimRef=q; markLock(lockOn(),'QA'); if(red) approveDesig('HI-2');
          const rows=[]; for(let i=0;i<40;i++){ uu.pan+=0.08; state.aimRef=null; paintCues(); rows.push([...document.querySelectorAll('#fTgt,#fAppr,#fFire')].filter(b=>b.classList.contains('lit')).length>0); } return rows; };
        const amb=walk(false), red=walk(true); let bad=0; for(let i=0;i<40;i++) if(amb[i]!==red[i]) bad++;
        rangeReset(); state.desig=null; state.tgtSlot={}; (typeof PLATES!=='undefined'?PLATES:[]).forEach(q=>{q.mist=false;}); uu.pan=pp; uu.tilt=tt;
        const p=plateOf(state.lane,'C-300'); aimUnitAt(uu,p,-40,40); state.aimRef=p; hudPhase(); const pd=document.getElementById('phDes');
        const unmarked=pd.style.color; state.lastShot={id:p.id,dead:true,life:0}; state.aimRef=null; uu.tilt+=Math.atan2(300,focalPx())*180/Math.PI; hudPhase(); const sky=pd.style.color;
        const v1=state.viewMode; state.viewMode='map'; hudPhase(); const lastTxt=pd.textContent, lastCol=pd.style.color; state.viewMode=v1; /* the LAST line is reached on the MAP and in a room, where the nothing-under-the-bullseye clause does not run */
        const amberCss='rgb(240, 160, 32)'; const ranLast=/^LAST · /.test(lastTxt);
        if(!amb.length||!red.length){ ok=false; note='NOT EXERCISED: the offset walk did not run'; }
        else if(!ranLast){ ok=false; note='NOT EXERCISED: the LAST line did not show on the map (read \"'+lastTxt+'\")'; }
        else { ok = bad===0 && unmarked!==amberCss && sky!==amberCss && lastCol!==amberCss;
          note='40 offsets walked off one mark, amber and red: they answer differently at '+bad+' of them · the recital on an UNMARKED plate '+unmarked+', with nothing under the bullseye '+sky+', and on the LAST line '+lastCol+' (the amber of a mark is '+amberCss+')'; } }
      catch(e){ ok=false; note='threw '+String(e).slice(0,110); }
      finally{ uu.pan=pp; uu.tilt=tt; state.aimRef=aR; state.lastShot=L0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.rangeMode=m0; rangeReset(); state.desig=d0; state.tgtSlot=s0; state.hiApproved=a0; state._qaSilent=S0; state.qaArmed=q0; }
      push('ONE_MEANING_OF_UNDER_THE_BULLSEYE', ok, note); }
"""
rep("    { /* r.157 · QUAL_DONE_SAYS_RESTART", ROW4+"    { /* r.157 · QUAL_DONE_SAYS_RESTART",1)

# 6 · the deck says what it is
rep('overflow:auto">r.205 THE GLASS TELLS THE TRUTH ABOUT EVERY TARGET · ',
    "overflow:auto\">r.206 NO COLOUR WITHOUT A MARK · a target with no box is the plain silhouette, so a mark that ends takes its colour with it; the box goes to the silhouette the bullseye is ON, never to a nearer one beside it; on the map, where there is no bullseye, no button is lit; amber and red answer the same question about being on a target; and the amber of a mark is used for a mark and nothing else; THE GLASS TELLS THE TRUTH ABOUT EVERY TARGET · ",1)

for dead in ["revision:'0.205'",'overflow:auto">r.205','r0.205',
             "const px=W/2,py=H*.46,m=8;",
             "if(d.phase==='amber') return approveWorksHere(d)?'APPROVE':'';",
             "pd.style.color='#F0A020'; } /* r.204 (operator 2026-10-12 18:40",
             "hudScore(); hudPhase(); return; /* r.134"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead[:60]}')
for need in ["r.206 INVARIANT (D1): the colour goes with the mark",
             "r.206 INVARIANT (D2): a plate the bullseye is strictly INSIDE wins",
             "r.206 INVARIANT (D3): and the BUTTONS froze with it",
             "r.206 (D4): amber answers the same question red does",
             "r.206 (D5): the LAST line is not a mark",
             "const ub=pick(0)||pick(8); if(ub) return ub; }",
             "hudScore(); hudPhase(); paintCues(); return;",
             'overflow:auto">r.206 NO COLOUR WITHOUT A MARK · ',
             "push('NO_COLOUR_WITHOUT_A_MARK'","push('THE_BOX_GOES_TO_THE_PLATE_UNDER_THE_PIP'",
             "push('BUTTONS_ARE_DARK_OFF_THE_PICTURE'","push('ONE_MEANING_OF_UNDER_THE_BULLSEYE'"]:
    if s.count(need)!=1: raise SystemExit('REFUSE: not in once ('+str(s.count(need))+'): '+need)
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

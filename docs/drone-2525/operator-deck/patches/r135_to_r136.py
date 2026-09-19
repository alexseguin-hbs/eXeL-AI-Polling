# r.135 -> r.136 — the fold of the fleet's synthesis: the r.135 regression (an AI mark in a room refused for every seat) and the
# small classes the twelve syntheses converged on. Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.135.html'); DST=os.path.join(DECK,'drone-2525_r.136.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── REGRESSION (Thor/Asar/Christo syntheses): the marker's seat is the human OR its own AI; the approver's phone is told the other seat fires ──
rep("  if(state.desig&&state.desig.how&&/^PEER/.test(String(state.desig.how))&&state.desig.by&&state.desig.by!==SID&&state.lobby&&state.lobby.phase==='LIVE'){ decide('REJECT',state.desig.id,{reason:'NOT_THE_MARKERS_SEAT'}); toast('THE SEAT THAT MARKED IT FIRES · YOU APPROVED'); return; }",
    "  { const markerSeat=String(state.desig&&state.desig.by||'').replace(/^ASM@/,''); if(state.desig&&state.desig.how&&/^PEER/.test(String(state.desig.how))&&markerSeat&&markerSeat!==SID&&state.lobby&&state.lobby.phase==='LIVE'){ decide('REJECT',state.desig.id,{reason:'NOT_THE_MARKERS_SEAT'}); toast('THE SEAT THAT MARKED IT FIRES · YOU APPROVED'); return; } } /* r.136: the marker's seat is the human or its own AI — r.135 cut the rule one token too wide and no seat could fire an AI mark in a room (Thor/Asar/Christo syntheses) */")
rep("+' · NOW PRESS FIRE'); /* r.135: one name per fact, in the player's words */","+(byPeer?' · THE OTHER SEAT FIRES':' · NOW PRESS FIRE')); /* r.135: one name per fact · r.136: the approver is never sent to the button that refuses it (Christo synthesis) */")
# ── every peer release reaches the shooter (Thor synthesis) ──
rep("  if(row.verb==='HOLD' && row.peerId && row.peerId!==SID && row.data && /^(APPROVER_LOST|PEER_LOST)$/.test(String(row.data.reason||''))){","  if(row.verb==='HOLD' && row.peerId && row.peerId!==SID && row.data && /^(APPROVER_LOST|PEER_LOST|AUTHORITY_RELEASED|TARGET_DOWN)$/.test(String(row.data.reason||''))){ /* r.136: a peer's ordinary release (scene change, reset, lane change, dead target) demotes my box too */")
rep("  state.lobby.launch=data;\n  state.lobby.phase='LIVE';","  state.lobby.launch=data;\n  releaseAuthority('ROOM START'); /* r.136: no red box crosses from the waiting room into LIVE (Thor synthesis) */\n  state.lobby.phase='LIVE';")
rep("    d.life-=dt; if(d.life<=0)d.up=false;","    d.life-=dt; if(d.life<=0){ d.up=false; if(state.desig&&state.desig.id===d.id) releaseAuthority('TARGET GONE'); } /* r.136: an expired drone takes its box with it */")
# ── two rows assert what they name (Enlil synthesis) ──
rep("designate({id:q.id,kind:'pop',ref:q},'QA'); let thrown=null; try{ phys(0.001); }catch(e){ thrown=String(e); } const pdT=(document.getElementById('phDes')||{}).textContent||''; state.viewMode=vm; state.desig=null; state.tgtSlot={}; push('MAP_KEEPS_THE_STRIP', !thrown&&/AMBER/.test(pdT),",
    "designate({id:q.id,kind:'pop',ref:q},'QA'); { const pdE=document.getElementById('phDes'); if(pdE) pdE.textContent='—'; } let thrown=null; try{ phys(0.001); }catch(e){ thrown=String(e); } const pdT=(document.getElementById('phDes')||{}).textContent||''; state.viewMode=vm; state.desig=null; state.tgtSlot={}; push('MAP_KEEPS_THE_STRIP', !thrown&&/AMBER/.test(pdT)&&pdT.indexOf(q.id)>=0,")
rep("      linkLost('QA'); push('LOST_APPROVER_IS_SAID', state.com.path==='DROPPED'&&state.com.peers===1&&!!state.desig&&state.desig.phase==='amber'&&!state.hiApproved,",
    "      linkLost('QA'); const saidT=(document.getElementById('toast')||{}).textContent||''; push('LOST_APPROVER_IS_SAID', state.com.path==='DROPPED'&&state.com.peers===1&&!!state.desig&&state.desig.phase==='amber'&&!state.hiApproved&&/THE OTHER SEAT IS GONE/.test(saidT)&&/AMBER AGAIN/.test(saidT),")
# ── QA row: the AI's mark in a room fires from the host's seat ──
rep("    push('HOLD_ROWS_TRAVEL',","""    { const ph0=state.lobby&&state.lobby.phase, m0=state.lobby&&state.lobby.members; if(state.lobby){ state.lobby.phase='LIVE'; state.lobby.members={[SID]:{team:'BLU'},'peer-H':{team:'RED'}}; } rangeReset(); const q=rangeExpose(0,'C-200L'); state.desig=null; state.tgtSlot={}; designate({id:q.id,kind:'pop',ref:q},'ASM@'+SID); const own=approveDesig('HI-2'); const heldOwn=!!(state.desig&&state.desig.phase==='amber'); const a=wireApprove(q.id,'peer-H',true); aimPlate(q,0); const h0=state.rangeHit|0; fireN(1);
      push('AI_MARK_FIRES_IN_A_ROOM', heldOwn&&a.accepted&&(state.rangeHit|0)===h0+1&&!state.desig, 'in a room the AI\\'s mark is held on its own seat, approved by the other seat, and fired by the seat that owns the AI (r.135 refused every seat)'); if(state.lobby){ state.lobby.phase=ph0; state.lobby.members=m0; } state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    push('HOLD_ROWS_TRAVEL',""")

c=s.count("revision:'0.135'"); rep("revision:'0.135'","revision:'0.136'",c)
h=s.count("r0.135"); rep("r0.135","r0.136",h)
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

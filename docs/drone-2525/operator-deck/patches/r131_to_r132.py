import re, hashlib
SRC='/home/user/eXeL-AI-Polling/docs/drone-2525/operator-deck/drone-2525_r.131.html'
DST='/home/user/eXeL-AI-Polling/docs/drone-2525/operator-deck/drone-2525_r.132.html'
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:80]!r}, found {c}')
    n[0]+=1
    return s.replace(old,new)
def ins_before(anchor,text): return rep(anchor,text+anchor)

# ── usability walk (docs/assessments/2026-09-19_r131_usability_walk.md) ──────────────────────────
s=rep("state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.rangeHit=evSave.rangeHit",
      "state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.lastShot=null; state.lastBand=''; state.rangeHit=evSave.rangeHit")
s=rep("  state.slot=state.slot||1;\n  designate({id:obj.id,kind:obj.kind,ref:obj.ref},SID);\n  toast('T'+state.slot+' '+obj.id+' AMBER');",
      "  if(state.desig&&state.desig.id===obj.id){ toast('T'+(state.desig.slot||1)+' '+obj.id+' '+String(state.desig.phase||'').toUpperCase()+(state.desig.phase==='red'?' · DOUBLE-TAP TO FIRE':' · APPROVE')); return; } /* r.132: a tap on the marked target keeps its phase (double-tap-to-fire works) */\n  state.slot=state.slot||1;\n  designate({id:obj.id,kind:obj.kind,ref:obj.ref},SID);\n  toast('T'+state.slot+' '+obj.id+' AMBER');")
s=rep("        toast((hit?'HIT':'MISS')+(qr.scored?'':' NO-SCORE')+","        toast((hit?('HIT'+(qr.scored?'':' · NO SCORE (CAP)')):'MISS')+")
s=rep("if(L.i===mine){ if(!q._eng){ rangeLapse(q); state.rangeMiss=(state.rangeMiss|0)+1; } }","if(L.i===mine){ if(!q._eng){ rangeLapse(q); state.rangeLapsed=(state.rangeLapsed|0)+1; } }")
s=rep("' · HIT '+(state.rangeHit|0)+' · MISS '+(state.rangeMiss|0)+","' · HIT '+(state.rangeHit|0)+' · MISS '+(state.rangeMiss|0)+' · LAPSED '+(state.rangeLapsed|0)+")
s=rep("state.rangeAllDown=false; state.rangeHit=0; state.rangeMiss=0; }","state.rangeAllDown=false; state.rangeHit=0; state.rangeMiss=0; state.rangeLapsed=0; }")
s=rep("rangeHit:state.rangeHit|0,rangeMiss:state.rangeMiss|0},","rangeHit:state.rangeHit|0,rangeMiss:state.rangeMiss|0,rangeLapsed:state.rangeLapsed|0},")
# the MORE menu had no handler at all
s=ins_before("const _rr=document.getElementById('btnRangeReset');",
 "const _more=document.getElementById('btnMore'), _mpop=document.getElementById('morePop'); if(_more&&_mpop) _more.onclick=()=>{ const on=_mpop.style.display==='flex'; _mpop.style.display=on?'none':'flex'; _mpop.classList.toggle('hide',on); }; /* r.132: MORE had no handler — AsM seat, RELINQUISH, T prev/next were unreachable everywhere */\n")
# the AI member sees the range
s=rep("  const live=[...pops.filter(p=>p.up),...drones.filter(d=>d.up)];\n  if(!live.length) return;",
      "  const live=[...pops.filter(p=>p.up),...drones.filter(d=>d.up),...((+state.challenge===0&&typeof platesHere==='function')?platesHere().filter(q=>q.up&&(q.fall||0)<0.25&&q.lifePct>0):[])]; /* r.132: on the range the AI member sees the exposed silhouette */\n  if(!live.length) return;")
s=rep("    live.forEach(o=>{const d=Math.hypot(o.x-u.x,o.z-u.z); if(d<bd){bd=d;best=o;}});","    live.forEach(o=>{const ow=worldOf(o); const d=Math.hypot(ow.x-u.x,ow.z-u.z); if(d<bd){bd=d;best=o;}});")
s=rep("    if(state.asmSpot && !state.hiLock && !state.desig && bd<80){","    if(state.asmSpot && !state.hiLock && !state.desig && bd<(best.form?340:80)){")

# ── the wire path goes through the same rules as the buttons (fleet lens 6A/6B/9A) ──────────────
s=ins_before("function approveDesig(who){",
r"""/* r.132 THE WIRE PATH OBEYS THE SAME RULES AS THE BUTTONS. A peer's mark lands in a slot with its author, honours the lane
   guard, and never overwrites a red box; a peer's approval needs an amber mark and — in a LIVE room — a seated human other
   than the marker; a snapshot hands over amber, never red. Testable in place (QA rows PEER_DESIG_TO_SLOT, WIRE_APPROVE_*,
   SNAPSHOT_NEVER_RED, FOREIGN_LANE_MARK_NOT_MY_BOX). */
function peerDesig(id,by,slot,kind){
  const pool=[].concat(pops||[],drones||[],doors||[],rings||[],typeof PLATES!=='undefined'?PLATES:(typeof QUAL!=='undefined'?QUAL:[]),typeof foils!=='undefined'?foils:[]);
  const ref=pool.find(o=>o.id===id);
  if(!ref){ decide('REJECT',id,{reason:'PEER_MARK_UNKNOWN',by}); return {accepted:false,msg:'PEER MARK · UNKNOWN '+id}; }
  if(ref.lane!=null&&ref.lane!==(state.lane||0)){ decide('HOLD',id,{reason:'PEER_MARK_OTHER_LANE',by,lane:ref.lane}); return {accepted:false,msg:'PEER MARK · '+((LANES[ref.lane]||{}).id||('L'+ref.lane))+' · NOT MY LANE'}; }
  state.tgtSlot=state.tgtSlot||{};
  let n=+slot||0; if(!n||(state.tgtSlot[n]&&state.tgtSlot[n].id!==id)){ n=1; while(n<=99&&state.tgtSlot[n]&&state.tgtSlot[n].id!==id) n++; }
  state.tgtSlot[n]={id,ref,phase:'amber',by,how:'PEER'}; ref.mist=true;
  if(state.desig&&state.desig.phase==='red'&&state.desig.id!==id) return {accepted:true,msg:'PEER MARK T'+n+' '+id+' · YOUR RED BOX HOLDS'};
  state.desig={id,kind:(kind&&kind!=='obj')?kind:kindOfRef(ref),ref,by,t:state.clock,slot:n,phase:'amber',how:'PEER'};
  return {accepted:true,msg:'NET AMBER T'+n+' '+id};
}
function wireApprove(id,by,quiet){
  const slK=state.tgtSlot&&Object.keys(state.tgtSlot).find(k=>state.tgtSlot[k]&&state.tgtSlot[k].id===id);
  const d=(state.desig&&state.desig.id===id)?state.desig:(slK?state.tgtSlot[slK]:null);
  if(!d){ if(!quiet) decide('HOLD',id,{reason:'WIRE_APPROVE_NO_MARK',by}); return {accepted:false,msg:'PEER APPROVE · NO SUCH MARK'}; }
  if(d.phase!=='amber'){ if(!quiet) decide('HOLD',id,{reason:'WIRE_APPROVE_NOT_AMBER',by,phase:d.phase}); return {accepted:false,msg:'PEER APPROVE · NOT AMBER'}; }
  const live=!!(state.lobby&&state.lobby.phase==='LIVE');
  const member=!!(state.lobby&&state.lobby.members&&state.lobby.members[by]);
  if(live&&(!member||by===d.by)){ if(!quiet) decide('HOLD',id,{reason:'TWO_HUMANS',designatedBy:d.by,approvedBy:by}); return {accepted:false,msg:'TWO HUMANS · A SECOND SEATED PERSON MUST APPROVE'}; }
  d.phase='red'; d.approvedBy=by; d.how='PEER HI-2'; d.sameDevice=false;
  if(state.desig&&state.desig.id===id){ state.desig.phase='red'; state.desig.approvedBy=by; state.desig.how='PEER HI-2'; state.desig.sameDevice=false; state.hiApproved=true; }
  if(slK) state.tgtSlot[slK].phase='red';
  if(!quiet) decide('APPROVE',id,{hiApproved:true,designatedBy:d.by,approvedBy:by,samePerson:by===d.by,sameDevice:false,transport:(state.link&&state.link.mode)||'TAB',how:'PEER HI-2'});
  return {accepted:true,msg:'RED · PEER HI-2 · '+id};
}
function importSnapshotDesig(pay){
  if(!pay) return;
  if(pay.desig) state.desig=Object.assign({},pay.desig,{phase:'amber',how:'PEER',sameDevice:false,approvedBy:null});
  if(pay.tgtSlot){ state.tgtSlot={}; Object.keys(pay.tgtSlot).forEach(k=>{ const sl=pay.tgtSlot[k]; if(sl) state.tgtSlot[k]=Object.assign({},sl,{phase:'amber'}); }); }
  state.hiApproved=false;
  if(pay.lobby&&pay.lobby.phase==='LIVE'&&state.lobby) state.lobby.phase='LIVE';
}
""")
s=rep("""  if(k==='DESIG'){
    const pool=[].concat(pops||[],drones||[],doors||[],rings||[],typeof PLATES!=='undefined'?PLATES:(typeof QUAL!=='undefined'?QUAL:[]));
    const ref=pool.find(o=>o.id===id);
    state.desig={id,kind:m.kind||pay.kind||'obj',ref:ref||{id,x:0,y:1,z:0},by:m.peerId||m.sid,t:state.clock,slot:pay.slot||state.slot||1,phase:'amber',how:'PEER'};
    if(!canonicalEvent) ev('DESIGNATED',id,'AMBER');
    proofMark('amberPeer',true);
    toast('NET AMBER '+id); list();
  }
  if(k==='APPROVE'){
    if(state.desig&&state.desig.id===id){
      state.desig.phase='red';state.desig.approvedBy=m.by||pay.by||m.sid;state.desig.how='PEER HI-2';state.desig.sameDevice=false;state.hiApproved=true;
      const sl=state.tgtSlot&&state.tgtSlot[state.desig.slot];if(sl)sl.phase='red';
      if(!canonicalEvent)ev('APPROVE',id,'RED PEER');
      proofMark('redPeer',true);
      toast('RED · PEER HI-2');list();
    }
  }""","""  if(k==='DESIG'){
    /* r.132: one rule for the wire — peerDesig (slot, author, lane guard, never over a red box). When the envelope carried a
       canonical row, applyWorld already ran it; here we only speak. */
    const r=canonicalEvent?{accepted:!!(state.desig&&state.desig.id===id)||!!(state.tgtSlot&&Object.keys(state.tgtSlot).some(k=>state.tgtSlot[k]&&state.tgtSlot[k].id===id)),msg:'NET AMBER '+id}:peerDesig(id,m.peerId||m.sid,pay.slot,m.kind||pay.kind);
    if(r.accepted){ if(!canonicalEvent) ev('DESIGNATED',id,'AMBER',{slot:pay.slot||1}); proofMark('amberPeer',true); }
    toast(r.msg); list();
  }
  if(k==='APPROVE'){
    const by=m.by||pay.by||m.peerId||m.sid;
    const r=canonicalEvent?{accepted:!!(state.desig&&state.desig.id===id&&state.desig.phase==='red'),msg:(state.desig&&state.desig.id===id&&state.desig.phase==='red')?'RED · PEER HI-2 · '+id:'PEER APPROVE HELD'}:wireApprove(id,by,false);
    if(r.accepted){ if(!canonicalEvent)ev('APPROVE',id,'RED PEER'); proofMark('redPeer',true); }
    toast(r.msg); list();
  }""")
s=rep("""    const o=findTgt(id);
    const same=state.desig&&state.desig.id===id?state.desig:null;
    state.desig={id,kind:kindOfRef(o),ref:o||{id,x:0,y:1,z:0},phase:'amber',how:'PEER',slot:(same&&same.slot)||state.slot||1,by:row.peerId||(same&&same.by)||SID,t:state.clock};
    if(o) o.mist=true;""","""    if(row.peerId&&row.peerId!==SID){ peerDesig(id,row.peerId,row.data&&row.data.slot,null); } /* r.132: a peer's row obeys the wire rule */
    else {
    const o=findTgt(id);
    const same=state.desig&&state.desig.id===id?state.desig:null;
    state.desig={id,kind:kindOfRef(o),ref:o||{id,x:0,y:1,z:0},phase:'amber',how:'PEER',slot:(same&&same.slot)||state.slot||1,by:row.peerId||(same&&same.by)||SID,t:state.clock};
    if(o) o.mist=true; }""")
s=rep("    if(state.desig&&state.desig.id===id){ state.desig.phase='red'; state.hiApproved=true; }",
      "    if(row.peerId&&row.peerId!==SID){ wireApprove(id,row.peerId,true); } /* r.132: a peer's approval obeys the wire rule */\n    else if(state.desig&&state.desig.id===id&&state.desig.phase==='amber'){ state.desig.phase='red'; state.hiApproved=true; }")
s=rep("    if(pay.desig)state.desig=pay.desig;\n    if(pay.tgtSlot)state.tgtSlot=pay.tgtSlot;","    importSnapshotDesig(pay); /* r.132: amber, never red; keeps LIVE */")
s=rep("    if(pay.hiApproved!=null)state.hiApproved=pay.hiApproved;","    state.hiApproved=false; /* r.132: an approval is never imported */")
m=re.search(r"lobby:\{match:state\.lobby\.match", s)
if m: s=s[:m.start()]+"lobby:{phase:state.lobby.phase,match:state.lobby.match"+s[m.end():]; n[0]+=1
else: print('note: snapshot payload has no lobby.match literal — phase not added to snapSend')
s=rep("  state.tgtSlot[n]={id:obj.id,ref:ref,phase:'amber'};","  state.tgtSlot[n]={id:obj.id,ref:ref,phase:'amber',by:src||SID,how:'LOCAL'};")
s=rep("  ev('DESIGNATED',obj.id,'AMBER');toast('AMBER · WAIT APPROVE '+obj.id);","  ev('DESIGNATED',obj.id,'AMBER',{slot:n});toast('AMBER · WAIT APPROVE '+obj.id);")
s=rep("function approveDesig(who){\n  if(!state.desig){toast('NO AMBER');return;}",
      "function approveDesig(who,slot){\n  if(slot!=null&&state.tgtSlot&&state.tgtSlot[slot]&&(!state.desig||state.desig.id!==state.tgtSlot[slot].id)){ const sl=state.tgtSlot[slot]; if(sl.phase==='amber') state.desig={id:sl.id,kind:kindOfRef(sl.ref),ref:sl.ref,by:sl.by||SID,t:state.clock,slot:+slot,phase:'amber',how:sl.how||'LOCAL'}; } /* r.132: approve BY SLOT — six ambers, six approvals */\n  if(!state.desig){toast('NO AMBER');return;}")
s=rep("  if(s&&s.ref&&(s.kind==='obj'||!s.kind)) s.kind=kindOfRef(s.ref); /* r.130: the kind is the target's, never a placeholder */",
      "  if(s&&s.ref&&(s.kind==='obj'||!s.kind)) s.kind=kindOfRef(s.ref); /* r.130: the kind is the target's, never a placeholder */\n  if(n&&state.desig&&state.desig.slot&&n!==state.desig.slot&&state.tgtSlot&&state.tgtSlot[n]&&state.tgtSlot[n].id!==state.desig.id){ decide('REJECT',state.tgtSlot[n].id,{reason:'NOT_THE_RED_TARGET',slot:n}); toast('T'+n+' IS NOT THE RED TARGET'); return; } /* r.132: the slot you name is the slot you fire */")

# ── QA rows ───────────────────────────────────────────────────────────────────────────────────────
s=rep("    state.rangeMode=sv2.mode; rangeReset(); qualResetTower(); state.zoom=sv2.zoom;",
r"""    /* r.132 — the wire path and the AI member */
    { rangeReset(); const q=rangeExpose(0,'C-100L'); state.tgtSlot={}; state.desig=null; state.hiApproved=false; if(!state.lobby) state.lobby={}; const sP=state.lobby.phase, sM=state.lobby.members; state.lobby.phase='LIVE'; state.lobby.members={'peer-A':{peerId:'peer-A',team:'BLU',ready:true,auth:true},'peer-B':{peerId:'peer-B',team:'BLU',ready:true,auth:true}}; state.lobby.members[SID]={peerId:SID,team:'BLU',ready:true,auth:true};
      const d1=peerDesig(q.id,'peer-A',2,null); const inSlot=!!(state.tgtSlot[2]&&state.tgtSlot[2].id===q.id&&state.tgtSlot[2].by==='peer-A'); const mine=!!(state.desig&&state.desig.id===q.id&&state.desig.by==='peer-A');
      push('PEER_DESIG_TO_SLOT', d1.accepted&&inSlot&&mine, 'a peer mark lands in T2 with its author and becomes my amber');
      const a1=wireApprove(q.id,'peer-A'); const a2=wireApprove(q.id,'peer-B'); const red=!!(state.desig&&state.desig.phase==='red'&&state.desig.approvedBy==='peer-B'&&state.tgtSlot[2].phase==='red');
      push('WIRE_APPROVE_TWO_HUMANS', !a1.accepted&&a2.accepted&&red, 'the marker cannot approve over the wire; a second seated human can · '+a1.msg+' / '+a2.msg);
      const a3=wireApprove(q.id,'peer-A'); push('WIRE_APPROVE_NEEDS_AMBER', !a3.accepted, 'a stale APPROVE on a red box is held: '+a3.msg);
      const qf=PLATES.find(p=>p.lane===5&&p.base==='C-50'); const d2=peerDesig(qf.id,'peer-A',3,null); push('FOREIGN_LANE_MARK_NOT_MY_BOX', !d2.accepted&&!!state.desig&&state.desig.id===q.id, 'a mark on L06 never becomes my box: '+d2.msg);
      const q2=rangeExpose(0,'C-150R'); const d3=peerDesig(q2.id,'peer-B',4,null); push('PEER_MARK_NEVER_OVERWRITES_RED', d3.accepted&&state.desig.id===q.id&&state.desig.phase==='red'&&!!state.tgtSlot[4]&&state.tgtSlot[4].id===q2.id, 'a new peer mark goes to the board (T4); my red box holds');
      const dN=(state.decisions||[]).length; fireN(4); push('FIRE_SLOT_MISMATCH_REFUSED', (state.decisions||[]).slice(dN).some(d=>d.reason==='NOT_THE_RED_TARGET'), 'FIRE T4 while T2 is the red box is refused by name');
      importSnapshotDesig({desig:{id:q.id,phase:'red',by:'peer-A',slot:2},tgtSlot:{2:{id:q.id,phase:'red'}},hiApproved:true,lobby:{phase:'LIVE'}}); push('SNAPSHOT_NEVER_RED', !!state.desig&&state.desig.phase==='amber'&&!state.hiApproved&&state.tgtSlot[2].phase==='amber'&&state.lobby.phase==='LIVE', 'a snapshot hands over amber, never red, and keeps LIVE');
      state.lobby.phase=sP; state.lobby.members=sM; state.desig=null; state.tgtSlot={}; state.hiApproved=false; }
    { rangeReset(); const q=rangeExpose(0,'C-100C'); const sA=state.asmSpot,sF=state.asmFire,sL=state.hiLock; state.asmSpot=true; state.asmFire=false; state.hiLock=false; state.desig=null; state.tgtSlot={}; for(let i=0;i<10;i++) asmTick(0.1);
      push('ASM_SEES_THE_RANGE', !!(state.desig&&state.desig.id===q.id&&state.desig.phase==='amber'), 'with AsM SPOT on, the AI member marks the exposed silhouette · '+(state.desig?state.desig.id+' by '+state.desig.by:'none')); state.asmSpot=sA; state.asmFire=sF; state.hiLock=sL; state.desig=null; state.tgtSlot={}; }
    state.rangeMode=sv2.mode; rangeReset(); qualResetTower(); state.zoom=sv2.zoom;""")


s=rep("push('PEER_DESIG_PLATES',/PLATES/.test(commIn.toString()),'peer resolves suffixed plate IDs');","push('PEER_DESIG_PLATES',/PLATES/.test(peerDesig.toString())&&/peerDesig\\(/.test(commIn.toString()),'peer resolves suffixed plate IDs (peerDesig, called from commIn)');")


s=rep("  state.com.path=path||state.com.path||'LOCAL';","  { const dcOpen=!!(state.link&&state.link.dc&&state.link.dc.readyState==='open'); state.com.path=dcOpen?'DIRECT':(path||state.com.path||'LOCAL'); } /* r.132: a tab message never downgrades a live DIRECT link */")


s=rep("  ev(kind,id,rec.reason||rec.how||kind);\n  sample({ev:'DEC',rec});\n  return rec;",
      "  ev(kind,id,rec.reason||rec.how||kind);\n  if((kind==='HOLD'||kind==='REJECT')&&!state.linkMute&&typeof linkSend==='function'&&typeof commEnv==='function'){ const last=(state.events||[])[(state.events||[]).length-1]; if(last) linkSend(Object.assign(commEnv(kind,{id,reason:rec.reason||'',event:last}),{id})); } /* r.132: a HOLD/REJECT is one canonical row on every peer — the two-phone walk found the host's refused self-approve missing from the joiner's hash */\n  sample({ev:'DEC',rec});\n  return rec;")
s=rep("    if(!canonicalEvent)ev(k,id||'',k+' NET');\n    toast(k+' '+(id||''));","    if(!canonicalEvent)ev(k,id||'',k+' NET');\n    toast(k+' '+(id||'')+(pay&&pay.reason?' · '+pay.reason:''));")
s=rep("    state.rangeMode=sv2.mode; rangeReset(); qualResetTower(); state.zoom=sv2.zoom;","    push('HOLD_ROWS_TRAVEL', /linkSend\\(/.test(decide.toString()) && /event:last/.test(decide.toString()), 'a HOLD/REJECT decision is transmitted as its own canonical row (one decision, one row, on every peer)');\n    state.rangeMode=sv2.mode; rangeReset(); qualResetTower(); state.zoom=sv2.zoom;")


s=rep("    await new Promise(r=>pc.onicecandidate=e=>{ if(!e.candidate) r(); });","    await new Promise(r=>{ let done=false; const fin=()=>{ if(!done){ done=true; r(); } }; pc.onicecandidate=e=>{ if(!e.candidate) fin(); else if(e.candidate.candidate&&/typ host/.test(e.candidate.candidate)) setTimeout(fin,1500); }; setTimeout(fin,8000); }); /* r.132: a phone with no internet must not wait out the STUN timeout (40-90 s) — the offer is ready 1.5 s after the first host candidate */",2)

c=s.count("revision:'0.131'"); s=rep("revision:'0.131'","revision:'0.132'",c)
h=s.count("r0.131"); s=rep("r0.131","r0.132",h)
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest()[:16],'rev',c,'hdr',h)

# r.137 -> r.138 — LABELS, TRUE-SCALE SILHOUETTES, THE ZOOM LAW, MAGAZINE + RELOAD, FULL SCREEN
# (operator 2026-09-23, docs/asks/2026-09-23_labels_scale_zoom_reload_fullscreen.md; answers: no 75 m; FIRE stays the third pill;
#  QUAL = four 10-round magazines, training and every craft = 30-round magazines).
# Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.137.html'); DST=os.path.join(DECK,'drone-2525_r.138.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── R138-1 · true-scale silhouettes (SOURCED: E-type 19.5" × 40" = 0.495 × 1.016 m; F-type 19.5" × 20" = 0.495 × 0.508 m) ──
rep("w:2.20,h:1.15,form:'F'}","w:0.495,h:0.508,form:'F'}",2)
rep("w:1.35,h:0.82,form:'F'}","w:0.495,h:0.508,form:'F'}",3)
rep("w:0.72,h:1.28,form:'E'}","w:0.495,h:1.016,form:'E'}",2)
rep("w:0.52,h:1.02,form:'E'}","w:0.495,h:1.016,form:'E'}",2)
rep("w:0.42,h:0.92,form:'E'}","w:0.495,h:1.016,form:'E'}")
rep("w:0.34,h:0.78,form:'E'}","w:0.495,h:1.016,form:'E'}")
rep("].map(q=>({...q,up:true,lifePct:100,life:99,mist:false,kind:'pop'}));",
    "].map(q=>({...q,up:true,lifePct:100,life:99,mist:false,kind:'pop'})); /* r.138: every silhouette at its REAL size — F 0.495 × 0.508 m, E 0.495 × 1.016 m (Range Systems E-type sheet 19.5\" × 40\"); the angular pip floor (3 mrad) is what keeps a 300 m E hittable, not a fat mesh */")

# ── R138-3 · the zoom law: one clamp, one cap ──
rep("function pipFloorPx(){ const H=view.height; const fov=38/Math.max(0.55,Math.min(3.2,state.zoom||1));",
    "function zoomMax(){ const u=units[state.unit]||{}; const tur=u.kind==='turret'||state.mode==='turret'; return (tur&&state.rangeMode==='qual40'&&+state.challenge===0)?3:30; } /* r.138 ZOOM LAW (operator): the turret sees 3× in qualification, 30× in training; every craft (drone, aircraft, robot, boat) sees 30× optical. Zoom is an optic, never authority. */\nfunction zoomClamp(z){ return Math.max(0.55,Math.min(zoomMax(),z||1)); }\nfunction pipFloorPx(){ const H=view.height; const fov=38/zoomClamp(state.zoom);")
rep("Math.max(0.55,Math.min(3.2,state.zoom||1))","zoomClamp(state.zoom)",5)
rep("      state.zoom=Math.max(0.55,Math.min(3.2,(state.pinch.z0||1)*(d/state.pinch.d0)));",
    "      state.zoom=zoomClamp((state.pinch.z0||1)*(d/state.pinch.d0)); if(typeof hudMag==='function') hudMag();")
rep("  state.rangeMode=next;\n  rangeResetOnRecord('MODE');",
    "  state.rangeMode=next; if((state.zoom||1)>zoomMax()) state.zoom=zoomMax(); /* r.138: the qualification optic is 3× */\n  rangeResetOnRecord('MODE');")
rep("' · IWQ TABLE VI · 40 TARGETS · 18 ENGAGEMENTS · 23 MARKSMAN 30 SHARP 36 EXPERT'","' · IWQ TABLE VI · 40 TARGETS · 18 ENGAGEMENTS · 4 MAGAZINES OF 10 · OPTIC 3× · 23 MARKSMAN 30 SHARP 36 EXPERT'")

# ── R138-2 · justified, stacked captions: one placement function for the painter AND the QA row ──
rep("""    const ph=isHot?(state.desig&&state.desig.phase==='red'?'RED':'AMBER'):''; const cap=(slK?'T'+slK+' · ':'')+(q.pos||q.base)+(rangeTraining()?'':' · '+Math.max(0,Math.ceil(q.life))+'s')+(ph?' · '+ph:''); /* r.137: seconds only where a window runs */
    hc.font='11px ui-monospace,monospace'; hc.textAlign='left'; hc.fillStyle=ph==='RED'?T13.LOCK:ph==='AMBER'?T13.GIMBAL:T13.SI;
    const cw=hc.measureText(cap).width; const cx=Math.min(W-cw-6,Math.max(6,r.cx+hw+10)), cy=Math.max(14,Math.min(H-44,t-8)); hc.fillText(cap,cx,cy); }); hc.font='12px ui-monospace,monospace'; } /* r.131: ONE caption per exposed plate — slot · range · seconds · phase — clamped to the canvas */""",
    """    }); { const rects=plateCaptionRects(hc,W,H); hc.font='11px ui-monospace,monospace'; rects.forEach(c=>{ hc.textAlign=c.align; hc.fillStyle=c.ph==='RED'?T13.LOCK:c.ph==='AMBER'?T13.GIMBAL:T13.SI; hc.fillText(c.cap,c.cx,c.cy); }); hc.textAlign='left'; hc.font='12px ui-monospace,monospace'; } } /* r.138: left targets read to the LEFT of the plate (right-justified), right targets to the RIGHT (left-justified), centre targets above; same-side captions stack so none overlaps — plateCaptionRects is the one placement the painter and the QA row share */""")
rep("function drawPlates(segs){",
    """function plateCaptionRects(hc,W,H){ /* r.138: ONE caption per standing plate — slot · range · seconds · phase — justified by side and stacked so no two overlap (operator 2026-09-23) */
  const LH=13; const out=[];
  platesHere().forEach(q=>{ if(!q.up||(q.fall||0)>0.25||q.lifePct<=0) return; const r=plateRect(q); if(!r) return;
    const hw=Math.max(r.half,8), t=Math.min(r.top,r.bot-16); const isHot=hot(q); const slK=Object.keys(state.tgtSlot||{}).find(k=>state.tgtSlot[k]&&state.tgtSlot[k].id===q.id);
    const ph=isHot?(state.desig&&state.desig.phase==='red'?'RED':'AMBER'):''; const cap=(slK?'T'+slK+' · ':'')+(q.pos||q.base)+(rangeTraining()?'':' · '+Math.max(0,Math.ceil(q.life))+'s')+(ph?' · '+ph:'');
    hc.font='11px ui-monospace,monospace'; const cw=hc.measureText(cap).width; const side=q.x<0?'L':q.x>0?'R':'C';
    let align,cx,cy; if(side==='L'){ align='right'; cx=Math.max(cw+6,Math.min(W-6,r.cx-hw-10)); cy=t-8; } else if(side==='R'){ align='left'; cx=Math.min(W-cw-6,Math.max(6,r.cx+hw+10)); cy=t-8; } else { align='center'; cx=Math.min(W-cw/2-6,Math.max(cw/2+6,r.cx)); cy=t-20; }
    cy=Math.max(14,Math.min(H-44,cy)); const x0=align==='right'?cx-cw:align==='center'?cx-cw/2:cx;
    out.push({id:q.id,side,align,cap,ph,cx,cy,x0,x1:x0+cw,y0:cy-11,y1:cy+2}); });
  ['L','R','C'].forEach(sd=>{ const col=out.filter(c=>c.side===sd).sort((a,b)=>a.cy-b.cy); let prev=null; col.forEach(c=>{ if(prev&&c.y0<prev.y1+1){ const dy=prev.y1+1-c.y0; c.cy+=dy; c.y0+=dy; c.y1+=dy; } prev=c; }); });
  out.forEach(c=>{ if(c.y1>H-30){ const dy=c.y1-(H-30); c.cy-=dy; c.y0-=dy; c.y1-=dy; } });
  return out; }
function drawPlates(segs){""")

# ── R138-4 · magazine and reload ──
rep("rangeMode:'bounce',lane:20,","rangeMode:'bounce',lane:20,mag:{cap:30,rounds:30,n:1,changes:0},")
rep("function qualResetTower(){\n  state.qualR=0;","""function magCap(){ return (state.rangeMode==='qual40'&&+state.challenge===0)?10:30; } /* r.138 MAGAZINE (operator): QUAL · 40 = four 10-round magazines (IWQ Table VI, a change at every position); training and every craft = 30-round magazines, reload any time */
function magHasRound(){ if(!state.mag) magLoad('INIT'); return (state.mag.rounds|0)>0; }
function magSpend(){ if(!state.mag) magLoad('INIT'); state.mag.rounds=Math.max(0,(state.mag.rounds|0)-1); if(typeof hudMag==='function') hudMag(); }
function magLoad(why){ /* RESET/INIT refill silently (the RESET row already exists); PHASE (the tower's mag change) and MANUAL (the button) are rows that travel */
  const cap=magCap(); const prev=state.mag||{n:0,changes:0}; const fresh=(why==='PHASE'||why==='MANUAL');
  state.mag={cap,rounds:cap,n:fresh?(prev.n|0)+1:1,changes:fresh?(prev.changes|0)+1:0};
  if(fresh&&typeof decide==='function') decide('RELOAD','MAG',{why,cap,n:state.mag.n});
  if(typeof hudMag==='function') hudMag(); }
function hudMag(){ const t=document.getElementById('magTxt'); if(!t) return; const m=state.mag||{cap:30,rounds:30,n:1}; const q=state.rangeMode==='qual40'&&+state.challenge===0; const z=(zoomClamp(state.zoom)).toFixed(1).replace(/\\.0$/,'');
  t.textContent=(q?'MAG '+m.n+'/4':'MAG '+m.n)+' · '+m.rounds+' RDS · ZOOM '+z+'×/'+zoomMax()+'×'; const st=document.getElementById('magStrip'); const ps=document.getElementById('phScore'); if(st&&ps) st.textContent=ps.textContent||''; }
function qualResetTower(){
  magLoad('RESET'); state.qualR=0;""")
rep("  if(s.kind==='ring'||((+state.challenge===0)&&s.kind!=='pop')){",
    "  if(!magHasRound()){ decide('REJECT',s.id,{reason:'EMPTY_MAGAZINE'}); toast('EMPTY · PRESS RELOAD'); return; } /* r.138: a shot needs a round; a refusal never costs one */\n  if(s.kind==='ring'||((+state.challenge===0)&&s.kind!=='pop')){")
rep("    const hit=applyHit(o,o.id||'BULL-1');","    const hit=applyHit(o,o.id||'BULL-1'); if(hit.result!=='REFUSED') magSpend();")
rep("    const hit=applyHit(s.ref,s.id);","    const hit=applyHit(s.ref,s.id); if(hit.result!=='REFUSED') magSpend();")
rep("R.phase='phasegap'; if(rangeArmed()) toast('PHASE '+nxt.ph+' · '+nxt.pos+' · MAG CHANGE · MOVE'); }",
    "R.phase='phasegap'; magLoad('PHASE'); if(rangeArmed()) toast('PHASE '+nxt.ph+' · '+nxt.pos+' · MAG CHANGE · MOVE'); } /* r.138: the tower's mag change loads the next 10 on the record */")
rep("if((kind==='HOLD'||kind==='REJECT'||kind==='RESET')&&!state.linkMute","if((kind==='HOLD'||kind==='REJECT'||kind==='RESET'||kind==='RELOAD')&&!state.linkMute")
rep("  if(row.verb==='RESET' && row.peerId && row.peerId!==SID){",
    "  if(row.verb==='RELOAD' && row.peerId && row.peerId!==SID){ state.peerMag={n:row.data&&row.data.n,cap:row.data&&row.data.cap,why:row.data&&row.data.why}; toast('THE OTHER SEAT RELOADED · MAG '+((row.data&&row.data.n)||'?')); } /* r.138: a peer's reload is shown, never applied to my magazine */\n  if(row.verb==='RESET' && row.peerId && row.peerId!==SID){")
rep("function rangeReset(){ const up=rangeTraining();","function rangeReset(){ magLoad('RESET'); const up=rangeTraining();")
rep("function hudScore(){","function hudScore(){ if(typeof hudMag==='function') hudMag();")

# ── R138-5/6 · the magazine bar at the top of the picture, and full screen ──
rep("""    <div id="playHud"><b id="phCH">CH0</b><span id="phDes">LOOK</span><span id="phScore">0</span></div>""",
    """    <div id="playHud"><b id="phCH">CH0</b><span id="phDes">LOOK</span><span id="phScore">0</span></div>
    <div id="magBar"><button id="btnReload" type="button" title="load a fresh magazine">RELOAD</button><span id="magTxt">MAG 1 · 30 RDS</span><span id="magStrip"></span><button id="btnFull" type="button" title="hide the words, keep the controls">FULL</button></div>""")
rep("#playHud #phScore{flex-basis:100%}",
    """#playHud #phScore{flex-basis:100%}
#magBar{position:absolute;right:8px;top:6px;z-index:4;display:flex;gap:8px;align-items:center;font-size:10px;letter-spacing:.1em;color:#C9A227;pointer-events:none;white-space:nowrap} /* r.138: reload + round counter at the top of the field of view */
#magBar button{pointer-events:auto;min-height:32px;padding:0 10px;border:1px solid #1C2A3A;background:#000;color:#E8D5B0;font-size:10px;letter-spacing:.1em;border-radius:4px}
#magBar #btnReload{border-color:#C9A227;color:#C9A227}
#magBar #magStrip{display:none;color:#3DCC8A}
#playHud{right:190px}
#app.full .bar,#app.full #playHud,#app.full #dock,#app.full #side{display:none} /* r.138 FULL SCREEN: the words hide, the sticks, TARGET · APPROVE · FIRE, RELOAD and the counter stay */
#app.full #magBar{left:8px;right:8px;justify-content:space-between}
#app.full #magBar #magStrip{display:inline;overflow:hidden;text-overflow:ellipsis;max-width:45vw}
#app.full #stage{margin-right:0}""")
rep("  <div class=\"bar\">\n    <b>eXeL</b><span>r0.137</span>",
    "  <div class=\"bar\">\n    <b>eXeL</b><span>r0.137</span><button id=\"btnFullBar\" type=\"button\" title=\"full screen\">FULL</button>")
rep("function saveSets(){try{localStorage.setItem('exel-2525-sets',JSON.stringify(state.sets));}catch(_){}}",
    """function saveSets(){try{localStorage.setItem('exel-2525-sets',JSON.stringify(state.sets));}catch(_){}}
function setFull(on){ /* r.138: a CSS mode first (works everywhere), the browser's fullscreen when it is offered — never required */
  const app=document.getElementById('app'); if(!app) return; on=!!on; app.classList.toggle('full',on); state.sets.full=on; saveSets();
  ['btnFull','btnFullBar'].forEach(id=>{ const b=document.getElementById(id); if(b) b.textContent=on?'EXIT':'FULL'; });
  try{ if(on&&!document.fullscreenElement&&document.documentElement.requestFullscreen){ const p=document.documentElement.requestFullscreen(); if(p&&p.catch) p.catch(()=>{}); } if(!on&&document.fullscreenElement&&document.exitFullscreen){ const p=document.exitFullscreen(); if(p&&p.catch) p.catch(()=>{}); } }catch(_){}
  try{ window.dispatchEvent(new Event('resize')); }catch(_){} if(typeof hudMag==='function') hudMag(); }
document.addEventListener('fullscreenchange',()=>{ const app=document.getElementById('app'); if(!document.fullscreenElement&&app&&app.classList.contains('full')&&state._fullApi){ setFull(false); } state._fullApi=!!document.fullscreenElement; });""")
rep("const _rm=document.getElementById('rngMode');",
    """{ const bR=document.getElementById('btnReload'); if(bR) bR.onclick=()=>{ if(state.mag&&state.mag.rounds===state.mag.cap){ toast('MAGAZINE FULL · '+state.mag.rounds+' RDS'); return; } magLoad('MANUAL'); toast('RELOADED · MAG '+state.mag.n+' · '+state.mag.rounds+' RDS'); };
  ['btnFull','btnFullBar'].forEach(id=>{ const b=document.getElementById(id); if(b) b.onclick=()=>setFull(!document.getElementById('app').classList.contains('full')); });
  const stg=document.getElementById('stage'); if(stg) stg.addEventListener('wheel',e=>{ if(state.viewMode==='map') return; e.preventDefault(); state.zoom=zoomClamp((state.zoom||1)*(e.deltaY<0?1.12:1/1.12)); hudMag(); },{passive:false}); /* r.138: a mouse can zoom too (pinch was the only optic) */
  if(state.sets&&state.sets.full) setFull(true); hudMag(); }
const _rm=document.getElementById('rngMode');""")

# ── QA rows ──
rep("    const h50b=shootPlate('C-50',10); push('RANGE_HIT_50_OFF10', h50b.red&&h50b.dead, '10 px inside the 50 m F · dead='+h50b.dead+' band='+h50b.band);",
    """    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2', h50b.red&&h50b.dead, '2 px inside the true-scale 50 m F · dead='+h50b.dead+' band='+h50b.band);
    { const q3=platesHere().find(q=>q.base==='C-300'); u0.pan=0;u0.tilt=0; const c=camOf(u0); const w3=qWorld(q3); const a=proj([w3.x,w3.y,w3.z],c,W,H), tt=proj([w3.x,w3.y+q3.h,w3.z],c,W,H);
      push('SILHOUETTES_TRUE_SCALE', QUAL.every(q=>Math.abs(q.w-0.495)<1e-9&&(q.form==='F'?Math.abs(q.h-0.508)<1e-9:Math.abs(q.h-1.016)<1e-9)) && !!a&&!!tt&&Math.abs(a.y-tt.y)<8, 'F 0.495 × 0.508 m · E 0.495 × 1.016 m · a 300 m E is '+(a&&tt?Math.abs(a.y-tt.y).toFixed(1):'?')+' px tall at 1× (the 3 mrad floor keeps it hittable)'); }
    { state.rangeMode='bounce'; rangeReset(); u0.pan=0;u0.tilt=0; state.zoom=1; const hc=document.getElementById('hud').getContext('2d'); const rs=plateCaptionRects(hc,W,H); let clash=0; for(let i=0;i<rs.length;i++) for(let j=i+1;j<rs.length;j++){ const a=rs[i],b=rs[j]; if(a.x0<b.x1&&b.x0<a.x1&&a.y0<b.y1&&b.y0<a.y1) clash++; }
      const sides=rs.every(c=>(c.side==='L'&&c.align==='right')||(c.side==='R'&&c.align==='left')||(c.side==='C'&&c.align==='center'));
      push('LABELS_DO_NOT_OVERLAP', rs.length===11 && clash===0 && sides && rs.every(c=>c.x0>=0&&c.x1<=W), rs.length+' captions at pan 0 · left targets right-justified, right targets left-justified, centre above · overlaps '+clash); }
    { const z0=state.zoom, u0k=state.unit; state.rangeMode='qual40'; rangeReset(); qualResetTower(); const zq=zoomMax(); state.rangeMode='bounce'; rangeReset(); const zt=zoomMax(); state.unit='D1Q'; const zd=zoomMax(); state.unit=u0k;
      state.zoom=zoomClamp(99); const capped=state.zoom; state.zoom=30; const fl30=pipFloorPx(); const h300z=shootPlate('C-300',0); state.zoom=1;
      push('ZOOM_LAW', zq===3&&zt===30&&zd===30&&capped===30&&fl30>=3&&h300z.red&&h300z.dead, 'turret+QUAL 3× · turret+training 30× · QUAD 30× · pinch past the cap holds at '+capped+'× · floor '+fl30.toFixed(1)+' px at 30× · 300 m HIT at 30×'); state.zoom=z0; }
    { state.rangeMode='bounce'; rangeReset(); const c30=!!state.mag&&state.mag.cap===30&&state.mag.rounds===30; const q=rangeExpose(0,'C-50'); aimPlate(q,0); state.tgtSlot={}; state.desig=null; state.hiApproved=false; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); fireN(1); push('TRAINING_MAG_30', c30&&state.mag.rounds===29, 'training and every craft: a 30-round magazine after RESET; one shot leaves 29'); rangeReset(); }""")
rep("      push('QUAL_PHASE_GAP', R.phase==='phasegap' && (state.events||[]).some(e=>e.verb==='QUAL'&&e.id==='P1'), 'after engagement 5 the tower rests for the mag change and phase 1 is a QUAL row');",
    """      push('QUAL_PHASE_GAP', R.phase==='phasegap' && (state.events||[]).some(e=>e.verb==='QUAL'&&e.id==='P1'), 'after engagement 5 the tower rests for the mag change and phase 1 is a QUAL row');
      push('PHASE_CHANGES_MAG', !!state.mag&&state.mag.n===2&&state.mag.rounds===10&&state.mag.cap===10&&(state.events||[]).some(e=>e.verb==='RELOAD'&&e.data&&e.data.why==='PHASE'), 'the phase rest loads magazine 2 of 4 (10 rounds) as a RELOAD row');""")
rep("      push('QUAL_ONE_ROUND_PER_TARGET', k3&&cur3===3&&s1.r===r00+1&&s1.b==='MISS'&&s2.r===r00+1&&s2.b==='SPENT'&&s3.r===r00+2&&s3.h===1&&r4===r00+3&&(state.qualExpired|0)===r00+1, 'in the triple: a miss costs one round · a second pull on that target is SPENT · the next target is a fresh round (HIT) · the third, unengaged, is one unfired miss · rounds '+r00+' → '+r4); state.rangeMode='bounce'; qualResetTower(); }",
    """      push('QUAL_ONE_ROUND_PER_TARGET', k3&&cur3===3&&s1.r===r00+1&&s1.b==='MISS'&&s2.r===r00+1&&s2.b==='SPENT'&&s3.r===r00+2&&s3.h===1&&r4===r00+3&&(state.qualExpired|0)===r00+1, 'in the triple: a miss costs one round · a second pull on that target is SPENT · the next target is a fresh round (HIT) · the third, unengaged, is one unfired miss · rounds '+r00+' → '+r4); state.rangeMode='bounce'; qualResetTower(); }
    { state.rangeMode='qual40'; rangeReset(); qualResetTower(); const cap0=state.mag.cap, r0=state.mag.rounds; let spent=0; for(let i=0;i<10;i++){ const q=rangeExpose(0,'C-50'); aimPlate(q,80); state.tgtSlot={}; state.desig=null; state.hiApproved=false; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const b=state.mag.rounds; fireN(1); if(state.mag.rounds===b-1) spent++; }
      const q=rangeExpose(0,'C-50'); aimPlate(q,0); state.tgtSlot={}; state.desig=null; state.hiApproved=false; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const eN=(state.events||[]).length, dN=(state.decisions||[]).length; fireN(1);
      const refused=(state.decisions||[]).slice(dN).some(d=>d.reason==='EMPTY_MAGAZINE'); const noShot=!(state.events||[]).slice(eN).some(e=>e.verb==='HIT'||e.verb==='MISS'); const stillUp=q.up&&q.lifePct===100;
      push('EMPTY_MAG_REFUSES', cap0===10&&r0===10&&spent===10&&state.mag.rounds===0&&refused&&noShot&&stillUp, 'QUAL: ten rounds spend the magazine; the eleventh pull is refused EMPTY_MAGAZINE, writes no shot and downs nothing');
      const e1=(state.events||[]).length; magLoad('MANUAL'); const row=(state.events||[])[e1];
      push('RELOAD_ON_RECORD', state.mag.rounds===10&&state.mag.n===2&&(state.events||[]).length===e1+1&&!!row&&row.verb==='RELOAD'&&row.data&&row.data.why==='MANUAL', 'RELOAD refills ten and is one canonical row (why MANUAL, magazine 2)');
      state.desig=null; state.tgtSlot={}; state.hiApproved=false; state.rangeMode='bounce'; qualResetTower(); rangeReset(); }""")
rep("    { const hp=document.getElementById('playHud'); const cs=hp?getComputedStyle(hp):null; push('HUD_SCORE_WRAPS',",
    """    { const it=document.getElementById('intro'); const itD=it?it.style.display:''; if(it) it.style.display='none'; const f0=!!(state.sets&&state.sets.full); setFull(true);
      const vis=id=>{ const el=document.getElementById(id); if(!el) return false; const cs=getComputedStyle(el); const r=el.getBoundingClientRect(); return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0; };
      const bar=document.querySelector('#app .bar'); const barHidden=!!bar&&getComputedStyle(bar).display==='none'; const hudHidden=getComputedStyle(document.getElementById('playHud')).display==='none'; const dockHidden=getComputedStyle(document.getElementById('dock')).display==='none';
      const hitPill=id=>{ const el=document.getElementById(id); const r=el.getBoundingClientRect(); const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); return !!e&&(e===el||el.contains(e)); };
      push('FULL_SCREEN_KEEPS_CONTROLS', barHidden&&hudHidden&&dockHidden&&vis('joyR')&&vis('face')&&vis('magBar')&&vis('btnReload')&&hitPill('fTgt')&&hitPill('fAppr')&&hitPill('fFire')&&hitPill('btnReload'), 'FULL: the bars, the strip and the dock hide; the HEAD stick, TARGET · APPROVE · FIRE, RELOAD and the counter stay and are the top element under a finger');
      setFull(f0); if(it) it.style.display=itD; }
    { const hp=document.getElementById('playHud'); const cs=hp?getComputedStyle(hp):null; push('HUD_SCORE_WRAPS',""")

rep("  document.getElementById('app').className=phone?'phone':'desk';","  { const app=document.getElementById('app'); app.classList.toggle('phone',phone); app.classList.toggle('desk',!phone); } /* r.138: layout used to REWRITE the class list on every resize — a rotation dropped 'turret' and 'full' (fix the class: toggle, never assign) */")
c=s.count("revision:'0.137'"); rep("revision:'0.137'","revision:'0.138'",c)
h=s.count("r0.137"); rep("r0.137","r0.138",h)
for dead in ["Math.min(3.2,","RANGE_HIT_50_OFF10","w:2.20,h:1.15","w:1.35,h:0.82"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

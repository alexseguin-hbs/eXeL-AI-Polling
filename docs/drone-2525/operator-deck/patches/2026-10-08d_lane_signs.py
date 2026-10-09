# 2026-10-08 (operator): "200 and 300 signs ... should be standard lane markers ... the 300 sometimes disappears; mimic reality so we
# can always see ... should be smaller just like target is smaller (proportional to reality)."
#  * The 100/200/300 M dashed berms + fixed-size "100 M" plates + the ▲/▼ off-screen chips are REMOVED.
#  * In their place: a real range distance-marker sign at 100, 200 and 300 m — a white 1.0 × 0.6 m board with black numerals on a 1.0 m
#    post, standing 3.0 m outside MY lane's left line (DECLARED from common rifle-range yardage boards). It lives in world space and goes
#    through the deck's own proj(), exactly like the targets, so a 300 m board is 1/3 the size of the 100 m board at every zoom.
#  * Never culled for "room": the old plates were skipped whenever every candidate slot touched the bullseye keep-out (H*.46 ± 46 px),
#    a lane-board word, a HUD box or a target — the 300 m berm sits ~10 px under the bullseye at 0.6×–1×, so its plate was dropped.
#    A sign is now drawn whenever any part of it is in the picture (min 2 × 1 px so sub-pixel never blinks out); the numerals appear
#    once the board is tall enough to carry them (≥ 5 px), like reading a real board through the optic.
#  * Painted after the lane-number boards, and a lane-number word yields where it would overprint a distance board.
#  * Centre magazine fill + number: green 21+, amber 6-20, red 0-5 rounds left (live, and on reload).
#  * The text RELOAD button on the magazine bar is hidden (the left magazine is the reload; R key / voice unchanged).
#  * The floating in-scene target callout is gone; the one status line (#phDes) sits above the icon row (portrait: in the magazine line).
#  * Clear centre: my own lane's edge number tags are not painted beside my targets (posts stay; neighbours' far boards keep numbers).
#  * Target state persists per target; TARGET/APPROVE/FIRE lights follow the target under the reticle (none/amber/red).
#  * Both magazine icons are mirrored back (operator 2026-10-08: flip left-to-right relative to the live look) — the scaleX(-1) is dropped.
# Run from the repo root AFTER 2026-10-08_qr_berms_mags_range.py, 2026-10-08b_select_city_range.py, 2026-10-08c_select_back_next.py:
#   python3 docs/drone-2525/operator-deck/patches/2026-10-08d_lane_signs.py
import os, re
ROOT=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'frontend','public','drone-2525','play.html')
s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    c=s.count(a)
    if c!=1: raise SystemExit(f'REFUSE: expected 1 of {a[:90]!r}, found {c}')
    s=s.replace(a,b)
# 1. paint the distance signs AFTER the lane-number boards (the old call sat before them)
rep("  if(typeof drawRangeDistances==='function') drawRangeDistances(hc,W,H,cam); /* eXeL 2026-10-08: 100/200/300 M berms */\n","")
rep("/* r.145: the lane number on each board */\n",
    "/* r.145: the lane number on each board */\n  if(typeof drawRangeDistances==='function') drawRangeDistances(hc,W,H,cam); /* eXeL 2026-10-08d: 100/200/300 m distance boards, world-sized, over the lane words */\n")
# 2. replace the berm painter (function body up to the QR helpers) with the world-space distance boards
a=s.index('function drawRangeDistances(hc,W,H,cam){'); b=s.index('function openRangeQr(){')
NEW=r'''const RANGE_SIGN={w:1.0,h:0.6,post:1.0,out:3.0,pole:0.1}; /* eXeL 2026-10-08d (operator: "standard lane markers ... proportional to reality"): a range distance board — 1.0 × 0.6 m, white, black numerals, on a 1.0 m post, 3.0 m outside (on the berm, clear of every target) MY lane's left line (DECLARED) */
function rangeSigns(){ const L=laneNow(); if(!L) return []; return LANE_MARKER_Z.map(z=>({z,x:L.x-LANE_HALF_W-RANGE_SIGN.out,y0:(L.y-2.2)+(L.slope||0)*z,txt:String(z)})); }
function rangeSignRect(sg,cam,W,H){ /* the board and post through the deck's proj() — the same projection, the same scale as the targets; null only when behind the eye */
  const S=RANGE_SIGN, yb=sg.y0+S.post, yt=yb+S.h; const tl=proj([sg.x-S.w/2,yt,sg.z],cam,W,H), br=proj([sg.x+S.w/2,yb,sg.z],cam,W,H), ft=proj([sg.x,sg.y0,sg.z],cam,W,H), pw=proj([sg.x+S.pole/2,sg.y0,sg.z],cam,W,H);
  if(!tl||!br||!ft) return null; let x0=Math.min(tl.x,br.x), x1=Math.max(tl.x,br.x), y0=Math.min(tl.y,br.y), y1=Math.max(tl.y,br.y);
  const cx=(x0+x1)/2, cy=(y0+y1)/2; const w=Math.max(2,x1-x0), h=Math.max(1,y1-y0); x0=cx-w/2; x1=cx+w/2; y0=cy-h/2; y1=cy+h/2; /* a sub-pixel board never blinks out */
  const postW=Math.max(1,pw?Math.abs(pw.x-ft.x)*2:1); const inFrame=x1>=0&&x0<=W&&Math.min(y0,ft.y)<=H&&Math.max(y1,ft.y)>=0;
  return {x0,x1,y0,y1,w,h,cx,cy,footX:ft.x,footY:ft.y,postW,inFrame}; }
function rangeSignRects(){ try{ if(chNum()!==0||state.viewMode==='map') return []; const W=view.width,H=view.height,cam=camOf(units[state.unit]); return rangeSigns().map(sg=>rangeSignRect(sg,cam,W,H)).filter(r=>r&&r.inFrame); }catch(_){ return []; } }
function drawRangeDistances(hc,W,H,cam){ /* every distance board in the picture is drawn, at its real projected size — never moved, never enlarged, never skipped for room */
  if(chNum()!==0||state.viewMode==='map') return; if(!laneNow()) return; window.__signsDrawn=[];
  hc.save(); hc.setLineDash([]); hc.textAlign='center'; hc.textBaseline='middle';
  rangeSigns().slice().sort((p,q)=>q.z-p.z).forEach(sg=>{ const r=rangeSignRect(sg,cam,W,H); if(!r||!r.inFrame) return;
    hc.globalAlpha=1; hc.fillStyle='#9AA3AD'; hc.fillRect(r.footX-r.postW/2,r.y1,r.postW,Math.max(0,r.footY-r.y1)); /* the post */
    hc.fillStyle='#F4F4F0'; hc.fillRect(r.x0,r.y0,r.w,r.h); /* the board */
    if(r.w>=6){ hc.strokeStyle='#1A1A1A'; hc.lineWidth=Math.max(0.5,Math.min(2,r.h*0.04)); hc.strokeRect(r.x0+hc.lineWidth/2,r.y0+hc.lineWidth/2,r.w-hc.lineWidth,r.h-hc.lineWidth); }
    let fs=r.h*0.74; if(fs>=5){ hc.font='bold 100px ui-monospace,monospace'; const tw=hc.measureText(sg.txt).width||1; fs=Math.min(fs,100*r.w*0.84/tw); if(fs>=5){ hc.font='bold '+fs.toFixed(1)+'px ui-monospace,monospace'; hc.fillStyle='#111111'; hc.fillText(sg.txt,r.cx,r.cy+fs*0.04); } }
    window.__signsDrawn.push({z:sg.z,w:+r.w.toFixed(1),h:+r.h.toFixed(1),fs:fs>=5?+fs.toFixed(1):0}); });
  hc.restore();
}
(function signsYield(){ /* a lane-number word never overprints a distance board: wrap the deck's "a sign never covers a target" test with "nor a distance board" */
  if(typeof signCoversTarget!=='function') return; const base=signCoversTarget;
  window.signCoversTarget=function(r){ if(base(r)) return true; return rangeSignRects().some(b=>r.x0<b.x1&&b.x0<r.x1&&r.y0<b.y1&&b.y0<r.y1); }; })();
'''
s=s[:a]+NEW+s[b:]
rep("/* eXeL 2026-10-08 (operator, Fitness-2525 agent): RANGE DISTANCE BERMS + LANE 21 QR + DEEP LINK.",
    "/* eXeL 2026-10-08 (operator, Fitness-2525 agent): RANGE DISTANCE BOARDS (2026-10-08d) + LANE 21 QR + DEEP LINK.")
# 3. the magazines, mirrored back left-to-right
rep(".magHud svg{width:24px;height:46px;display:block;transform:scaleX(-1)} /* operator 2026-10-08: mirrored from the PMAG photo — the weapon points RIGHT */",
    ".magHud svg{width:24px;height:46px;display:block} /* operator 2026-10-08d: flipped left-to-right again (relative to the 2026-10-08 scaleX(-1) look) */")
# 4. the centre magazine's fill and number take the colour of the rounds left: green 21+, amber 6-20, red 0-5 (operator 2026-10-08d)
rep("document.getElementById('magRds').textContent=String(r);",
    "document.getElementById('magRds').textContent=String(r); { const col=r>20?'#3DCC8A':r>5?'#F0A020':'#E24B3B'; f.setAttribute('fill',col); f.setAttribute('opacity',r>20?'.6':'.55'); const nb=document.getElementById('magRds'); nb.style.color=col; M.dataset.band=r>20?'green':r>5?'amber':'red'; } /* eXeL 2026-10-08d: green 21+ · amber 6-20 · red 0-5, on every change and on reload */")
# 5. the text RELOAD button on the magazine bar is hidden — the left magazine icon is the reload (it calls the same btnReload.onclick); R key and "reload" voice unchanged
rep("#magM.low b{color:#E24B3B}#magM.empty{border-color:#E24B3B}",
    "#magM.low b{color:#E24B3B}#magM.empty{border-color:#E24B3B}\n#magBar #btnReload{display:none!important} /* eXeL 2026-10-08d (operator): the left magazine IS the reload button; the text RELOAD is retired (handler kept, R key kept) */")
# 6. the deck's own QA follows: in FULL the reload control that must stay visible and tappable is now the left magazine (#magL)
rep("vis('magBar')&&vis('btnReload')&&hitPill('fTgt')&&hitPill('fAppr')&&hitPill('fFire')&&hitPill('btnReload')",
    "vis('magBar')&&vis('magL')&&hitPill('fTgt')&&hitPill('fAppr')&&hitPill('fFire')&&hitPill('magL')")
# 7. (operator 2026-10-08d: "range clutter") the floating target callout ("T1 · 100 M LEFT · RED") is no longer painted in the scene; the
#    caption list itself (plateCaptionRects) stays for the QA. The lane-number words no longer dodge the invisible callouts.
rep("{ const rects=plateCaptionRects(hc,W,H); hc.font='11px ui-monospace,monospace'; rects.forEach(c=>{",
    "{ const rects=[]; /* eXeL 2026-10-08d: no target callout in the scene — the status line above the icons says it */ hc.font='11px ui-monospace,monospace'; rects.forEach(c=>{")
rep("const taken=plateCaptionRects(hc,W,H).map(c=>({x0:c.x0,x1:c.x1,y0:c.y0,y1:c.y1}));",
    "const taken=[]; /* eXeL 2026-10-08d: the callouts are off the scene, nothing to dodge */")
#    The one target-status line (#phDes, "RED · T1 · 100 M LEFT · PRESS FIRE") sits ABOVE the icon row: in landscape it already does (the
#    strip shares the magazine line's row); in portrait it is moved into the magazine line, left of "MAG 1 · 30 RDS", once — never twice.
rep("#magBar #btnReload{display:none!important}",
    "#magBar #btnReload{display:none!important}\n@media(orientation:portrait){ #app.range #magBar{left:8px} #magBar #phDes{margin-right:auto;flex:1 1 0;min-width:0;white-space:normal;line-height:1.2;max-height:3.6em;overflow:hidden;text-align:left;font-size:10px;letter-spacing:.1em} } /* eXeL 2026-10-08d: the target status above the icons */")
rep("  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();\n})();\n</script>",
    "  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();\n})();\n(function statusAboveIcons(){ /* eXeL 2026-10-08d: portrait range — #phDes lives in the magazine line (above the icons); otherwise back in the strip. Same node, same writer (hudPhase). */\n  function place(){ try{ const d=document.getElementById('phDes'), bar=document.getElementById('magBar'), hud=document.getElementById('playHud'), app=document.getElementById('app'); if(d&&bar&&hud&&app){ const up=app.classList.contains('range')&&innerHeight>innerWidth; if(up&&d.parentNode!==bar) bar.insertBefore(d,document.getElementById('magTxt')); else if(!up&&d.parentNode!==hud) hud.insertBefore(d,document.getElementById('phScore')); } }catch(_){} requestAnimationFrame(place); }\n  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',place); else place();\n})();\n</script>")
# 8. (operator 2026-10-08d: "the centre of the range must be as clear as possible — only the amber and red boxes on or near targets")
#    MY lane's two edge words ("20 21", "21 22") are no longer painted beside my targets; the posts stay, and the neighbours' far-edge
#    boards (out at the next lane lines) still carry their numbers.
rep("boardLabels(hc,W,H,cam).forEach(b=>{ hc.globalAlpha=b.mine?1:0.45;",
    "boardLabels(hc,W,H,cam).filter(b=>!b.mine).forEach(b=>{ hc.globalAlpha=b.mine?1:0.45; /* eXeL 2026-10-08d: no lane-number tag beside my own targets */")
# 9. (operator 2026-10-08d) every target keeps its own state; the lit button follows the target UNDER THE RETICLE: an unmarked one ->
#    TARGET, an amber-boxed one -> APPROVE (still a human approval), a red-boxed one -> FIRE. Marks are never reset by aim changes; a
#    marked target under the bullseye becomes the current mark (focusMark — the same rule APPROVE and FIRE already use on press), so the
#    status line names it too. Nothing under the reticle: the deck's own cue (the current mark's next step) as before.
rep("function nextStep(){ if(!roundOpen()||state.viewMode==='map') return ''; if(state.mag&&(state.mag.rounds|0)<=0) return ''; /* an empty magazine: RELOAD is the one cue */ const d=state.desig;",
    "function nextStep(){ if(!roundOpen()||state.viewMode==='map') return ''; if(state.mag&&(state.mag.rounds|0)<=0) return ''; /* an empty magazine: RELOAD is the one cue */ const d=state.desig;\n  if(chNum()===0&&marksPersist()&&typeof reticleTarget==='function'){ const rt=reticleTarget(); if(rt){ const sl=rt.k&&state.tgtSlot[rt.k]; if(sl&&sl.phase==='red') return fireWorksHere()?'FIRE':''; if(sl) return approveWorksHere()?'APPROVE':''; return 'TARGET'; } } /* eXeL 2026-10-08d: the cue follows the target under the reticle */")
rep("function paintCues(){ const app=document.getElementById('app'); if(app) app.classList.toggle('range',chNum()===0);",
    "function paintCues(){ const app=document.getElementById('app'); if(app) app.classList.toggle('range',chNum()===0);\n  try{ if(chNum()===0&&marksPersist()&&roundOpen()&&typeof reticleTarget==='function'){ const rt=reticleTarget(); if(rt&&rt.k&&(!state.desig||state.desig.id!==rt.id)) focusMark(rt.k); } }catch(_){} /* eXeL 2026-10-08d: a marked target under the bullseye is the current mark — its box, its phase, untouched */")
rep("function openRangeQr(){",
    "function reticleTarget(){ /* eXeL 2026-10-08d: the range target the bullseye is ON (pipOn, the deck's one hold rule) and its mark slot, or null */ const u=units[state.unit]; if(!u||typeof lockOn!=='function') return null; const lk=lockOn(); if(!lk||!lk.ref||!lk.ref.form) return null; if(!pipOn(lk.ref,camOf(u))) return null; return {id:lk.id,k:markSlotOf(lk.id)}; }\nfunction openRangeQr(){")
open(p,'w',encoding='utf-8').write(s)
print('applied: 100/200/300 m distance boards (world-sized, never culled), berm plates + chips removed, magazines mirrored, centre magazine coloured by rounds left, text RELOAD hidden, target status above the icons, clear centre, cues follow the reticle')

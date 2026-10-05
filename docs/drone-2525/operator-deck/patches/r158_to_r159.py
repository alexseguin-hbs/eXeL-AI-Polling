# r.158 -> r.159 — the signs like the photo, and the PC controls (operator 2026-10-05, ASK.md Addenda 9-10, verbatim there).
#  1. THE SIGNS (Addendum 10: "Signs need to be smaller like uploaded images (realistic as photo uploaded)", "DO not cover targets with
#     signs", "And have White/Black like uploaded image"): a 0.6 x 0.35 m board, drawn at its real projected size (never enlarged to fit
#     its words), white with black numbers sized to the board; a sign whose board would cover a standing target of my lane is not drawn
#     (its post stays). QA LANE_NUMBERS_ON_THE_SIGN (rewritten) and SIGNS_NEVER_COVER_TARGETS.
#  2. PC CONTROLS (Addendum 9): arrows aim the turret; WASD moves a drone and the arrows aim its head (unchanged, proven by a row);
#     RIGHT CLICK = TARGET, and on an amber mark = APPROVE; LEFT CLICK = FIRE; T = TARGET; SPACE = TARGET, and on an amber mark =
#     APPROVE; F = FIRE. One door (pcTargetApprove) for the right click and Space. QA PC_KEYS_AND_MOUSE.
# The fire doctrine is untouched: TARGET (amber) -> APPROVE (red, a named human) -> FIRE; FIRE still refuses anything not red.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.158.html'); DST=os.path.join(DECK,'drone-2525_r.159.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)

# 1 · signs
rep("const MARKER_POST=1.2, MARKER_BOARD=0.6, MARKER_BOARD_W=1.2;","const MARKER_POST=1.2, MARKER_BOARD=0.35, MARKER_BOARD_W=0.6; /* r.159 (Addendum 10): the lane board at its real size, like the range photo */")
rep(r'''const bw=pl?Math.abs(pr.x-pl.x):0, bh=pt?Math.abs(pr.y-pt.y):0; const hw=Math.max(bw,tw/2+4), hh=Math.max(bh,8); const r={x0:pr.x-hw,x1:pr.x+hw,y0:pr.y-hh,y1:pr.y+hh}; /* r.158: the numbers sit ON the board, centred; the board on the screen is never smaller than its words */
    if(taken.some(t=>r.x0<t.x1&&t.x0<r.x1&&r.y0<t.y1&&t.y0<r.y1)) return; taken.push(r); out.push({txt:m.txt,x:pr.x,y:pr.y,mine:m.lane===me,lane:m.lane,z:m.z,edge:m.edge,...r}); }); return out; }''',
r'''const bw=pl?Math.abs(pr.x-pl.x):0, bh=pt?Math.abs(pr.y-pt.y):0; const hw=Math.max(1,bw), hh=Math.max(1,bh); const r={x0:pr.x-hw,x1:pr.x+hw,y0:pr.y-hh,y1:pr.y+hh}; /* r.159: the board at its real projected size — never enlarged to fit its words */
    const fs=Math.min(hh*1.5,10*(2*hw-2)/Math.max(1,tw)); /* the numbers sized to the board (tw measured at 10 px) */
    if(signCoversTarget(r)) return; /* r.159: a sign never covers a target */
    if(taken.some(t=>r.x0<t.x1&&t.x0<r.x1&&r.y0<t.y1&&t.y0<r.y1)) return; taken.push(r); out.push({txt:m.txt,x:pr.x,y:pr.y,fs,mine:m.lane===me,lane:m.lane,z:m.z,edge:m.edge,...r}); }); return out; }
function signCoversTarget(r){ /* r.159 (Addendum 10, "DO not cover targets with signs"): true when the board's rectangle touches a standing target of my lane on the screen */ return platesHere().some(q=>{ if(!q.up) return false; const pr=plateRect(q); return !!pr&&r.x0<pr.cx+pr.half+2&&pr.cx-pr.half-2<r.x1&&r.y0<pr.bot+2&&pr.top-2<r.y1; }); }''')
rep(r'''boardLabels(hc,W,H,cam).forEach(b=>{ const c=b.mine?T13.SI:T13.STROKE; hc.strokeStyle=c; hc.lineWidth=1; hc.strokeRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0); hc.fillStyle=c; hc.fillText(b.txt,b.x,b.y); }); hc.textAlign='left'; hc.textBaseline='alphabetic'; }''',
r'''boardLabels(hc,W,H,cam).forEach(b=>{ hc.globalAlpha=b.mine?1:0.45; hc.fillStyle='#FFFFFF'; hc.fillRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0); if(b.fs>=5){ hc.font=b.fs.toFixed(1)+'px ui-monospace,monospace'; hc.fillStyle='#000000'; hc.fillText(b.txt,b.x,b.y); } hc.globalAlpha=1; }); hc.font='10px ui-monospace,monospace'; hc.textAlign='left'; hc.textBaseline='alphabetic'; } /* r.159 (Addendum 10): white board, black numbers, real size — like the range photo */''')
OLD_ROW_START="    { /* r.158 · LANE_NUMBERS_ON_THE_SIGN"
i=s.find(OLD_ROW_START); j=s.find("    { /* r.158 · LANE_LINES_SIGN_TO_SIGN",i)
if i<0 or j<0: raise SystemExit('REFUSE: sign row anchors')
NEWROW=r'''    { /* r.159 · LANE_NUMBERS_ON_THE_SIGN + SIGNS_NEVER_COVER_TARGETS — real-size white boards, black numbers inside, never on a target */
      const l0=state.lane, z0=state.zoom; state.lane=20; parkRangeTurrets(); state.rangeMode='bounce'; rangeReset(); const uu=units['T21']; const s0=state.unit; state.unit='T21'; const hc=document.getElementById('hud').getContext('2d'); const res=[]; let cover=0, bad=0, n=0;
      [[1,'C-50'],[3,'C-100C'],[3,'C-200L'],[3,'C-300']].forEach(([z,base])=>{ state.zoom=z; aimUnitAt(uu,plateOf(20,base),-40,40); const cam=camOf(uu); const bl=boardLabels(hc,W,H,cam); n+=bl.length;
        bl.forEach(b=>{ const m=markersInView().find(k=>k.txt===b.txt&&k.z===b.z&&k.lane===b.lane); const c=m&&proj([m.x,m.y0+MARKER_POST+MARKER_BOARD/2,m.z],cam,W,H), l=m&&proj([m.x-MARKER_BOARD_W/2,m.y0+MARKER_POST+MARKER_BOARD/2,m.z],cam,W,H); hc.font='10px ui-monospace,monospace'; const tw=hc.measureText(b.txt).width*b.fs/10;
          if(!c||!l||Math.abs(c.x-b.x)>1||Math.abs((b.x1-b.x0)/2-Math.max(1,Math.abs(c.x-l.x)))>1||(b.fs>=5&&tw>b.x1-b.x0)) bad++; if(signCoversTarget(b)) cover++; });
        res.push(z+'× '+plateWord(base)+': '+bl.length); });
      state.unit=s0; state.lane=l0; state.zoom=z0; parkRangeTurrets(); rangeReset();
      push('LANE_NUMBERS_ON_THE_SIGN', n>0&&bad===0&&MARKER_BOARD_W===0.6&&MARKER_BOARD===0.35, n+' signs written ('+res.join(' · ')+'), '+bad+' not at their real 0.6 × 0.35 m size or with numbers off the board; white board, black numbers');
      push('SIGNS_NEVER_COVER_TARGETS', cover===0, cover+' signs on a standing target across 1× and 3× views of lane 21 (operator: "DO not cover targets with signs")'); }
'''
s=s[:i]+NEWROW+s[j:]; n[0]+=1

# 2 · PC controls
rep("  if(e.code==='KeyX'||e.code==='Space'){e.preventDefault();mark();}",
    "  if(e.code==='KeyX'){e.preventDefault();mark();}\n  if(e.code==='Space'){e.preventDefault();pcTargetApprove(null);} /* r.159 (Addendum 9): SPACE = TARGET, and on an amber mark = APPROVE */")
rep("function voiceSync(){",
r'''function pcTargetApprove(obj){ /* r.159 (Addendum 9): ONE door for SPACE and the right click — nothing marked: TARGET (the thing clicked, else under the bullseye); an amber mark: APPROVE; a red mark: say FIRE. Never fires. */
  const d=state.desig; if(d&&d.phase==='red'){ toast('RED · LEFT CLICK OR F TO FIRE'); return 'red'; }
  if(d&&d.phase!=='red'&&(!obj||obj.id===d.id)){ approveDesig('HI-2'); return 'approve'; }
  if(obj){ state.slot=state.slot||1; designate({id:obj.id,kind:obj.kind,ref:obj.ref},SID); return 'target'; }
  targetN(((state.slot||0)%99)+1); return 'target'; }
function voiceSync(){''')
rep("view.addEventListener('pointerdown',e=>{\n  if(e.target.closest && e.target.closest('#joyL,#joyR,#side,.dock,.bar')) return;",
    "view.addEventListener('contextmenu',e=>e.preventDefault()); /* r.159: the right click belongs to TARGET / APPROVE */\nview.addEventListener('pointerdown',e=>{\n  if(e.target.closest && e.target.closest('#joyL,#joyR,#side,.dock,.bar')) return;\n  if(e.pointerType==='mouse'&&e.button===2&&state.viewMode!=='map'){ const r=view.getBoundingClientRect(); pcTargetApprove(pickNear((e.clientX-r.left)*(view.width/r.width),(e.clientY-r.top)*(view.height/r.height))); return; } /* r.159: RIGHT CLICK = TARGET, on amber = APPROVE */")
rep("  if(d.moved>14)return;\n  const sx=(d.sx-r.left)*(view.width/r.width), sy=(d.sy-r.top)*(view.height/r.height);\n  const now=performance.now();",
    "  if(d.moved>14)return;\n  if(e.pointerType==='mouse'&&e.button===0){ fireN(state.slot||1); return; } /* r.159 (Addendum 9): LEFT CLICK = FIRE (FIRE refuses anything not red, as the button does) */\n  const sx=(d.sx-r.left)*(view.width/r.width), sy=(d.sy-r.top)*(view.height/r.height);\n  const now=performance.now();")
PCROW=r'''    { /* r.159 · PC_KEYS_AND_MOUSE — arrows aim the turret, WASD moves a drone, SPACE / right click = TARGET then APPROVE, F / left click = FIRE */
      const t=controlLaw({kind:'turret'},{ArrowRight:true,ArrowUp:true},{},null,false), q=controlLaw({kind:'quad'},{KeyW:true,KeyD:true,ArrowLeft:true},{},null,false);
      const l0=state.lane; state.lane=20; parkRangeTurrets(); state.rangeMode='bounce'; rangeReset(); const s0=state.unit; state.unit='T21'; const uu=units['T21']; state.desig=null; state.tgtSlot={}; aimUnitAt(uu,plateOf(20,'C-100C'),-40,40);
      const a1=pcTargetApprove(null), ph1=state.desig&&state.desig.phase; const a2=pcTargetApprove(null), ph2=state.desig&&state.desig.phase; const a3=pcTargetApprove(null);
      const src=document.documentElement.innerHTML; const wired=/e\.code==='Space'\)\{e\.preventDefault\(\);pcTargetApprove\(null\)/.test(src)&&/e\.pointerType==='mouse'&&e\.button===2/.test(src)&&/e\.pointerType==='mouse'&&e\.button===0\)\{ fireN\(/.test(src)&&/e\.code==='KeyF'&&state\.slot\)fireN/.test(src)&&/e\.code==='KeyT'/.test(src);
      state.desig=null; state.tgtSlot={}; state.unit=s0; state.lane=l0; parkRangeTurrets(); rangeReset();
      push('PC_KEYS_AND_MOUSE', t.bodyOn===false&&t.lookX>0&&t.lookY>0&&q.bodyOn===true&&q.fwd>0&&q.str>0&&q.lookX<0&&a1==='target'&&ph1==='amber'&&a2==='approve'&&ph2==='red'&&a3==='red'&&wired, 'turret: arrows aim (look '+t.lookX+','+t.lookY+'), no body; drone: W/D move ('+q.fwd+','+q.str+') and ← aims; SPACE/right click: '+a1+' ('+ph1+') → '+a2+' ('+ph2+') → '+a3+' (never fires); F and left click fire'); }
'''
rep("    push('HOLD_ROWS_TRAVEL',", PCROW+"    push('HOLD_ROWS_TRAVEL',")

c=s.count("revision:'0.158'"); rep("revision:'0.158'","revision:'0.159'",c)
h=s.count("r0.158"); rep("r0.158","r0.159",h)
for dead in ["revision:'0.158'","r0.158","e.code==='KeyX'||e.code==='Space'","hc.strokeRect(b.x0,b.y0"]:
    if dead in s: raise SystemExit(f'REFUSE: stale symbol survives: {dead}')
for need in ["push('SIGNS_NEVER_COVER_TARGETS'","push('PC_KEYS_AND_MOUSE'","function pcTargetApprove(obj)","function signCoversTarget(r)","push('LANE_NUMBERS_ON_THE_SIGN'"]:
    if s.count(need)!=1: raise SystemExit(f'REFUSE: {need} x{s.count(need)}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

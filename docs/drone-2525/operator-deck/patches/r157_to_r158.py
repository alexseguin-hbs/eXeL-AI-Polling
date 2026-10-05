# r.157 -> r.158 — no grey phantom targets; the lane numbers ON a real sign board (operator 2026-10-05, verbatim in
# docs/drone-2525/rounds/2026.10.04_09.17..48_19_rounds/ASK.md Addendum 6: "for Range on Qual and Train Up and Train Down, there are grey
# phantom targets. Also the lane markers need to be on the actual "sign" <-- 20 21 --> like attached" — a white board on a post, "5 6").
#  1. NO PHANTOMS: on the range only MY lane's standing targets are drawn. r.144 drew the neighbouring lanes' (±1) silhouettes dim grey —
#     those were the "grey phantom targets". The targets still stand on all 42 lanes (EVERY_LANE_HAS_THE_TARGETS holds); they are simply
#     not drawn from another lane. QA row NO_PHANTOM_TARGETS replaces NEIGHBOUR_LANES_DRAWN.
#  2. THE SIGN: each lane marker is a board on a post, 1.2 m wide x 0.6 m tall (was a 0.5 m square), and its numbers ("◂ 20 · 21 ▸")
#     are written ON the board, centred, with the board drawn around them on the screen (never smaller than the words). r.157 wrote the
#     words in the air above a small square. QA row LANE_NUMBERS_ON_THE_SIGN.
#  3. THE LANE LINES (Addendum 7): a very faded (35%) dotted grey line along each lane edge, sign to sign, 100 -> 200 -> 300 m. QA row LANE_LINES_SIGN_TO_SIGN.
# The fire doctrine is untouched: TARGET (amber) -> APPROVE (red, a named human) -> FIRE; simulation only.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.157.html'); DST=os.path.join(DECK,'drone-2525_r.158.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)

# 1 · no phantoms
rep(r'''    else { if(!q.up)return; if(!mine && Math.abs((q.lane||0)-(state.lane||0))>1) return; } /* r.144: the neighbouring lanes (±1) show every standing silhouette, dim — the targets are on each of the 42 lanes (operator); marking and firing stay on my lane */''',
r'''    else { if(!q.up||!mine) return; } /* r.158 (operator 2026-10-05: "there are grey phantom targets"): only MY lane's standing targets are drawn — r.144's dim neighbour silhouettes were the phantoms; every lane still carries its targets */''')
rep(r'''    { const seen={}; drawPlates((arr,col)=>{ seen[col]=(seen[col]||0)+1; }); const nb=LANES.filter(L=>L.i!==(state.lane||0)&&Math.abs(L.i-(state.lane||0))<=1).length; const mineN=platesHere().filter(q=>q.up).length;
      push('NEIGHBOUR_LANES_DRAWN', (seen[T13.SI]||0)===mineN&&(seen[T13.STROKE]||0)===nb*QUAL.length, 'my lane draws its '+mineN+' silhouettes; the '+nb+' neighbouring lane(s) draw all '+(nb*QUAL.length)+' of theirs, dim (a real range shows the lanes beside you)'); }''',
r'''    { const seen={}; let foreign=0; const mineIds=new Set(platesHere().map(q=>q.id)); drawPlates((arr,col)=>{ seen[col]=(seen[col]||0)+1; }); (PLATES||[]).forEach(q=>{ if(q.up&&!mineIds.has(q.id)) foreign++; }); const mineN=platesHere().filter(q=>q.up).length;
      push('NO_PHANTOM_TARGETS', (seen[T13.SI]||0)===mineN&&(seen[T13.STROKE]||0)===0&&foreign>0, 'my lane draws its '+mineN+' standing silhouettes and nothing else: '+(seen[T13.STROKE]||0)+' grey silhouettes drawn while '+foreign+' targets stand on the other lanes (operator 2026-10-05: no grey phantom targets)'); }''')

# 3 · the lane lines (Addendum 7: "also show line of lanes from sign to sign at 100 200 and 300 markers... very faded dotted grey line")
rep(r"""function drawLaneMarkers(segs,own){""",
r"""function laneLineSegs(){ /* r.158 (Addendum 7): along each lane edge in view, sign to sign — 100 → 200 → 300 m — between the posts' feet */ const by={}; markersInView().forEach(m=>{ const k=m.x.toFixed(3); (by[k]=by[k]||[]).push(m); }); const out=[]; Object.values(by).forEach(ms=>{ ms.sort((a,b)=>a.z-b.z); for(let i=1;i<ms.length;i++) out.push([[ms[i-1].x,ms[i-1].y0,ms[i-1].z],[ms[i].x,ms[i].y0,ms[i].z]]); }); return out; }
function drawLaneLines(v,cam,W,H){ v.save(); v.setLineDash([2,7]); v.globalAlpha=0.35; v.strokeStyle=T13.STROKE; v.lineWidth=1; v.beginPath(); laneLineSegs().forEach(e=>{ const a=proj(e[0],cam,W,H), b=proj(e[1],cam,W,H); if(a&&b){ v.moveTo(a.x,a.y); v.lineTo(b.x,b.y); } }); v.stroke(); v.restore(); } /* very faded, dotted, grey — a guide, never a target */
function drawLaneMarkers(segs,own){""")
rep("if(chNum()===0){ drawPlates(segs,segsOwn); drawLaneMarkers(segs,segsOwn);","if(chNum()===0){ drawPlates(segs,segsOwn); drawLaneMarkers(segs,segsOwn); drawLaneLines(v,cam,W,H);")

# 2 · the sign
rep("const MARKER_POST=1.2, MARKER_BOARD=0.5;","const MARKER_POST=1.2, MARKER_BOARD=0.6, MARKER_BOARD_W=1.2; /* r.158: a sign board 1.2 m × 0.6 m on its post, the numbers on it */")
rep(r"""function markerSegs(m){ const b=MARKER_BOARD/2, yb=m.y0+MARKER_POST, yt=yb+MARKER_BOARD; return [[[m.x,m.y0,m.z],[m.x,yb,m.z]],[[m.x-b,yb,m.z],[m.x+b,yb,m.z]],[[m.x+b,yb,m.z],[m.x+b,yt,m.z]],[[m.x+b,yt,m.z],[m.x-b,yt,m.z]],[[m.x-b,yt,m.z],[m.x-b,yb,m.z]]]; }""",
r"""function markerSegs(m){ const yb=m.y0+MARKER_POST; return [[[m.x,m.y0,m.z],[m.x,yb,m.z]]]; } /* r.158: the post; the sign board itself is drawn once, on the screen, around its numbers (boardLabels) — r.157's small square showed through the sign */""")
rep(r'''const pr=proj([m.x,m.y0+MARKER_POST+MARKER_BOARD,m.z],cam,W,H); if(!pr||pr.x<0||pr.x>W||pr.y<0||pr.y>H) return; const tw=hc.measureText(m.txt).width; const r={x0:pr.x-tw/2-2,x1:pr.x+tw/2+2,y0:pr.y-15,y1:pr.y-1};''',
r'''const yc=m.y0+MARKER_POST+MARKER_BOARD/2, pr=proj([m.x,yc,m.z],cam,W,H); if(!pr||pr.x<0||pr.x>W||pr.y<0||pr.y>H) return; const tw=hc.measureText(m.txt).width; const pl=proj([m.x-MARKER_BOARD_W/2,yc,m.z],cam,W,H), pt=proj([m.x,yc+MARKER_BOARD/2,m.z],cam,W,H); const bw=pl?Math.abs(pr.x-pl.x):0, bh=pt?Math.abs(pr.y-pt.y):0; const hw=Math.max(bw,tw/2+4), hh=Math.max(bh,8); const r={x0:pr.x-hw,x1:pr.x+hw,y0:pr.y-hh,y1:pr.y+hh}; /* r.158: the numbers sit ON the board, centred; the board on the screen is never smaller than its words */''')
rep("taken.push(r); out.push({txt:m.txt,x:pr.x,y:pr.y-4,mine:m.lane===me,lane:m.lane,z:m.z,edge:m.edge,...r}); }); return out; }",
    "taken.push(r); out.push({txt:m.txt,x:pr.x,y:pr.y,mine:m.lane===me,lane:m.lane,z:m.z,edge:m.edge,...r}); }); return out; }")
rep(r'''hc.textAlign='center'; boardLabels(hc,W,H,cam).forEach(b=>{ hc.fillStyle=b.mine?T13.SI:T13.STROKE; hc.fillText(b.txt,b.x,b.y); }); hc.textAlign='left'; }''',
r'''hc.textAlign='center'; hc.textBaseline='middle'; boardLabels(hc,W,H,cam).forEach(b=>{ const c=b.mine?T13.SI:T13.STROKE; hc.strokeStyle=c; hc.lineWidth=1; hc.strokeRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0); hc.fillStyle=c; hc.fillText(b.txt,b.x,b.y); }); hc.textAlign='left'; hc.textBaseline='alphabetic'; } /* r.158: the sign — a board with its numbers on it ("◂ 20 · 21 ▸"), like the range's white lane boards */''')
NEW=r'''    { /* r.158 · LANE_NUMBERS_ON_THE_SIGN — every written board's numbers sit inside its board, centred on the board's own centre */
      const l0=state.lane, z0=state.zoom; state.lane=20; parkRangeTurrets(); state.rangeMode='bounce'; rangeReset(); const uu=units['T21']; const s0=state.unit; state.unit='T21'; const hc=document.getElementById('hud').getContext('2d'); state.zoom=1; aimUnitAt(uu,plateOf(20,'C-50'),-40,40); const cam=camOf(uu);
      const bl=boardLabels(hc,W,H,cam); hc.font='10px ui-monospace,monospace'; let bad=0; bl.forEach(b=>{ const tw=hc.measureText(b.txt).width; const m=markersInView().find(k=>k.txt===b.txt&&k.z===b.z&&k.lane===b.lane); const c=m&&proj([m.x,m.y0+MARKER_POST+MARKER_BOARD/2,m.z],cam,W,H); if(!c||Math.abs(c.x-b.x)>1||Math.abs(c.y-b.y)>1||b.x-tw/2<b.x0||b.x+tw/2>b.x1||b.y-5<b.y0||b.y+5>b.y1) bad++; });
      state.unit=s0; state.lane=l0; state.zoom=z0; parkRangeTurrets(); rangeReset();
      push('LANE_NUMBERS_ON_THE_SIGN', bl.length>0&&bad===0&&MARKER_BOARD_W===1.2&&MARKER_BOARD===0.6, bl.length+' signs written on lane 21, '+bad+' with words off their board ('+bl.slice(0,3).map(b=>'"'+b.txt+'"').join(' · ')+'); each board 1.2 × 0.6 m on its post, the numbers centred on it'); }
    { /* r.158 · LANE_LINES_SIGN_TO_SIGN — a faded dotted grey line along each lane edge, 100 → 200 → 300 m, from post to post */
      const ls=laneLineSegs(); const me=state.lane||0; const L=LANES[me]; const mine=ls.filter(e=>Math.abs(e[0][0]-(L.x-LANE_HALF_W))<1e-6||Math.abs(e[0][0]-(L.x+LANE_HALF_W))<1e-6); const steps=mine.every(e=>e[1][2]-e[0][2]===100&&e[0][0]===e[1][0]);
      push('LANE_LINES_SIGN_TO_SIGN', mine.length===4&&steps&&/setLineDash\(\[2,7\]\)/.test(drawLaneLines.toString())&&/globalAlpha=0\.35/.test(drawLaneLines.toString()), mine.length+' dotted lines along my lane\'s two edges (100→200, 200→300 m), '+ls.length+' in view, faded grey 35%, dash 2/7'); }
    push('HOLD_ROWS_TRAVEL','''
rep("    push('HOLD_ROWS_TRAVEL',",NEW)

rep("(seen[T13.SI]||0)===30&&inPic","(seen[T13.SI]||0)===6&&inPic")
rep(".reduce((a,q)=>a+silMesh(q).length,0)+30;",".reduce((a,q)=>a+silMesh(q).length,0)+6; /* r.158: my 6 posts (the boards are drawn on the screen) */")
rep("'+(seen[T13.SI]||0)+' segments of mine drawn bright;","'+(seen[T13.SI]||0)+' posts of mine drawn bright (the boards on the screen, with their numbers);")
c=s.count("revision:'0.157'"); rep("revision:'0.157'","revision:'0.158'",c)
h=s.count("r0.157"); rep("r0.157","r0.158",h)
for dead in ["NEIGHBOUR_LANES_DRAWN","revision:'0.157'","r0.157","MARKER_BOARD/2, yb","[[m.x-b,yb,m.z]"]:
    if dead in s: raise SystemExit(f'REFUSE: stale symbol survives: {dead}')
for need in ["push('LANE_LINES_SIGN_TO_SIGN'","function drawLaneLines(v,cam,W,H)","push('NO_PHANTOM_TARGETS'","push('LANE_NUMBERS_ON_THE_SIGN'","MARKER_BOARD_W=1.2"]:
    if s.count(need)!=1: raise SystemExit(f'REFUSE: {need} x{s.count(need)}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

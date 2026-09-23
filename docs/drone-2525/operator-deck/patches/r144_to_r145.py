# r.144 -> r.145 — LANE MARKERS AT THE EDGES OF EACH LANE, AT 100, 200 AND 300 M (operator 2026-09-23, docs/asks/2026-09-23_lane_markers.md,
# the range photograph beside it): white numbered signboards on posts at the lane edges, like the real range. Wire idiom: a post and a
# square board (five segments), the lane number on the board (HUD text), for the shooter's lane and the lanes beside it. One pure
# laneMarkers(lane) serves the painter, the HUD and the QA. Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.144.html'); DST=os.path.join(DECK,'drone-2525_r.145.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

rep("function drawPlates(segs){",
    """/* r.145 LANE MARKERS (operator 2026-09-23, the range photograph): a white numbered signboard on a post at each lane's left edge at
   100, 200 and 300 m (the back of the lane), and at the right edge of the last lane — the number is the lane the board opens. Post 1.2 m,
   board 0.5 × 0.5 m above it (DECLARED from the photograph). Drawn for my lane and the lanes beside it; the number is HUD text. */
const LANE_MARKER_Z=[100,200,300]; const LANE_HALF_W=5; const MARKER_POST=1.2, MARKER_BOARD=0.5;
function laneMarkers(lane){ const L=LANES[lane|0]; if(!L) return []; const out=[]; const y0=z=>(L.y-2.2)+(L.slope||0)*z;
  LANE_MARKER_Z.forEach(z=>{ out.push({lane:L.i,n:L.i+1,x:L.x-LANE_HALF_W,z,y0:y0(z),edge:'L'}); if(L.i===LANES.length-1) out.push({lane:L.i,n:L.i+1,x:L.x+LANE_HALF_W,z,y0:y0(z),edge:'R'}); }); return out; }
function markerSegs(m){ const b=MARKER_BOARD/2, yb=m.y0+MARKER_POST, yt=yb+MARKER_BOARD; return [[[m.x,m.y0,m.z],[m.x,yb,m.z]],[[m.x-b,yb,m.z],[m.x+b,yb,m.z]],[[m.x+b,yb,m.z],[m.x+b,yt,m.z]],[[m.x+b,yt,m.z],[m.x-b,yt,m.z]],[[m.x-b,yt,m.z],[m.x-b,yb,m.z]]]; }
function lanesInView(){ const me=state.lane||0; return LANES.filter(L=>Math.abs(L.i-me)<=1).map(L=>L.i); }
function drawLaneMarkers(segs){ lanesInView().forEach(l=>laneMarkers(l).forEach(m=>segs(markerSegs(m),l===(state.lane||0)?T13.SI:T13.STROKE))); }
function drawPlates(segs){""")
rep("  if(chNum()===0){ drawPlates(segs); RANGE_WIRE.forEach(",
    "  if(chNum()===0){ drawPlates(segs); drawLaneMarkers(segs); RANGE_WIRE.forEach(")
rep("  if(lk){hc.font='12px ui-monospace,monospace';hc.textAlign='left';hc.fillStyle=T13.SI;hc.fillText('LOCK',60,H-36);",
    """  if(chNum()===0&&typeof laneMarkers==='function'){ hc.font='10px ui-monospace,monospace'; hc.textAlign='center'; lanesInView().forEach(l=>laneMarkers(l).forEach(m=>{ const pr=proj([m.x,m.y0+MARKER_POST+MARKER_BOARD/2,m.z],cam,W,H); if(!pr||pr.x<0||pr.x>W||pr.y<0||pr.y>H) return; hc.fillStyle=l===(state.lane||0)?T13.SI:T13.STROKE; hc.fillText(String(m.n),pr.x,pr.y+3); })); hc.textAlign='left'; } /* r.145: the lane number on each board */
  if(lk){hc.font='12px ui-monospace,monospace';hc.textAlign='left';hc.fillStyle=T13.SI;hc.fillText('LOCK',60,H-36);""")

# ── QA rows ──
rep("    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',",
    """    { const mine=laneMarkers(state.lane||0); const last=laneMarkers(LANES.length-1); const zs=mine.map(m=>m.z).sort((a,b)=>a-b).join('/'); const seen={}; drawLaneMarkers((arr,col)=>{ seen[col]=(seen[col]||0)+arr.length; });
      const L=LANES[state.lane||0]; const atEdge=mine.every(m=>Math.abs(m.x-(L.x-LANE_HALF_W))<1e-9&&m.n===L.i+1); const inPic=mine.every(m=>{ const pr=proj([m.x,m.y0+MARKER_POST,m.z],camOf(u0),W,H); return !!pr; });
      push('LANE_MARKERS_100_200_300', mine.length===3&&zs==='100/200/300'&&atEdge&&last.length===6&&last.every(m=>m.n===42)&&(seen[T13.SI]||0)===15&&inPic, 'lane '+(L.i+1)+': numbered boards on posts at its left edge at '+zs+' m (the last lane has both edges); mine bright, the neighbours\\' dim; '+(seen[T13.SI]||0)+' segments of mine drawn'); }
    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',""")

c=s.count("revision:'0.144'"); rep("revision:'0.144'","revision:'0.145'",c)
h=s.count("r0.144"); rep("r0.144","r0.145",h)
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

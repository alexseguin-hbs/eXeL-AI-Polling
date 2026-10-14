# r.207 -> r.208 — THE CAPITAL I: THE CAPITOL IS DRAWN.
#  Operator 2026-10-13: "can you create edge wireframes of Austin texas Captial of texas scenario with stationary pop
#  up targets for turret ... also enhance capital of texas using online images to make more realistic outline using
#  array of 13 Trinity colors with varying levels of thickness etc to mimic 3D structure of capital and capital lawn
#  (including trees ... while making these updates; don't change the range; just use working range to start building
#  elements for The Capital" (DD-27, DD-34, DD-35).
#
#  MEASURED FIRST, on the shipped r.207 bytes at 390x844 in the Capital scene (CH1 LAWN):
#    MoT 1.1 (the default)  budget 280 · drawn 280 · dropped 1,278 · the stage BLACK, no Capitol at all
#    instrumented: drawTargets is entered at 5 segments spent and leaves at 280 — the eight door targets take the
#    whole world budget before WIRE.g is reached, so every one of the 217 edges of the Capital scene - the building's own 76 among them - is dropped.
#  So this revision is "the Capitol is drawn", not "the Capitol is beautiful" — the picture first, his order.
#
#  FOUR MEMBERS, each a class and not an instance:
#   M1 DD-38  the scene's SUBJECT is never dropped. A group now says whether it is what the scene is about, and the
#             subject is drawn outside the world's segment budget, counted — the Range's own r.157 rule (segsOwn)
#             applied to the Capital. Filler (lawn, streets, trees, blocks) stays inside the budget and drops first.
#   M2 DD-37  the painter learns WEIGHT. add() carries a stroke weight from lib/wire-core/vector-law.ts's own ladder
#             (hairline .6 · normal 1 · bold 1.6) and segs()/segsOwn() take it. Depth is read from weight, overlap
#             and perspective — never from a shade, because a darker edge would be a fourteenth colour.
#   M3 DD-34  the Capitol itself, from sourced numbers: the cruciform footprint 172.67 x 88.09 m, the wings and the
#             central block, the drum, the ribbed shell, the lantern, the Goddess of Liberty and her star at 92.24 m,
#             the south steps, the Great Walk at its sourced width, the allee and the north lawn as trees with
#             canopies, the bounding streets, the fence, and the rotunda's own circle at r 9.14 m.
#   M4 DD-39  detail follows the fidelity dial; PRESENCE does not. Every group declares the lowest MoT major that
#             draws it, so a weak phone sees the whole building in outline and never a blank stage.
#  Plus the door his scenario picker never opened, and the no-fly volume brought to the corrected building.
#
#  THE RANGE IS NOT TOUCHED (DD-35): every edit is in add/segs/segsOwn's signatures (defaulting to exactly today's
#  behaviour), the chNum()!==0 branch of draw(), drawTargets (called only off the range), build(), WALLS,
#  restoreCapitolTurrets and the scenario picker's non-range arm. Proven, not promised, by tests/range-frozen.test.mjs
#  (100 source spans, hashed, plus the three definitions this revision deliberately moves, re-pinned under their own key) in the same commit.
import hashlib,os,subprocess,tempfile
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
BASE_REV='207'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.208.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.207')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
def cut(a,b,sha,new):
    """replace the whole span from a (inclusive) to b (exclusive); refuse unless the old span hashes as pinned"""
    global s
    if s.count(a)!=1: raise SystemExit('REFUSE: start marker not unique: '+a[:60])
    i=s.index(a); j=s.index(b,i); old=s[i:j]
    h=hashlib.sha256(old.encode('utf-8')).hexdigest()[:16]
    if h!=sha: raise SystemExit(f'REFUSE: the span {a[:40]!r} is {h}, pinned {sha} ({len(old)} B)')
    n[0]+=1; s=s[:i]+new+s[j:]

# 0 · the deck declares itself
rep("revision:'0.207'","revision:'0.208'",1)
rep("r0.207","r0.208",1)

# 1 · M2 (DD-37) + M1 (DD-38) + M4 (DD-39) — a group carries its WEIGHT, whether it is the scene's SUBJECT, and the
#     lowest fidelity that draws it. The three extra fields are OPTIONAL and default to exactly today's behaviour
#     (weight 1 = the painter's own fw, not the subject, drawn at every MoT), so no existing caller changes.
rep("function add(n,c,s){if(!OK.has(c))throw 0;WIRE.g.push({n,c,s});}",
    """const WEIGHT={hair:0.6,norm:1,bold:1.6}; /* r.208 (operator 2026-10-13: "varying levels of thickness etc to mimic 3D structure"): the ladder is lib/wire-core/vector-law.ts's own - hairline .6 / normal 1 / bold 1.6 - and it is the ONLY depth cue allowed on a wireframe, because a darker edge would be a fourteenth colour. Weight is a ROLE, not a distance: the silhouette bold, the structure normal, the ground hairline. */
function add(n,c,s,o){if(!OK.has(c))throw 0;o=o||{};WIRE.g.push({n,c,s,w:o.w||1,own:!!o.own,lod:o.lod||1});} /* r.208 INVARIANT (DD-38): THE SCENE'S SUBJECT IS NEVER THE FIRST THING DROPPED. own:true draws the group outside the world's segment budget (counted, like the shooter's own lane on the range, r.157 segsOwn); measured on r.207, the eight door targets spent all 280 of the MoT 1.1 budget and the whole Capitol - 217 edges - was dropped, so the default fidelity showed a black stage. lod is the lowest MoT major that draws the group: DETAIL follows the dial, PRESENCE does not. */""",1)

# 2 · the two painters take a weight. Default (undefined) is fw, the one width the whole world has had until now, so
#     every existing call - the range's RANGE_WIRE, the plates, the slot boxes, the swarm, the meshes - is unchanged.
rep("""  function segs(arr,col){
    v.strokeStyle=col;v.lineWidth=fw;v.beginPath();""",
    """  function segs(arr,col,w){ /* r.208: w is the group's weight from WEIGHT; undefined keeps fw exactly, so nothing that drew before draws differently */
    v.strokeStyle=col;v.lineWidth=fw*(w||1);v.beginPath();""",1)
rep("""  function segsOwn(arr,col){ /* r.157:""",
    """  function segsOwn(arr,col,w){ /* r.208: the same weight argument; on the range this is my lane's own picture, on the Capital it is the Capitol itself */ /* r.157:""",1)
rep("""    v.strokeStyle=col;v.lineWidth=fw;v.beginPath();
    arr.forEach(e=>{ const a=proj(e[0],cam,W,H),b=proj(e[1],cam,W,H); if(!a||!b){ state.ownCulled++; return; } v.moveTo(a.x,a.y);v.lineTo(b.x,b.y);state.ownSegs++; });""",
    """    v.strokeStyle=col;v.lineWidth=fw*(w||1);v.beginPath();
    arr.forEach(e=>{ const a=proj(e[0],cam,W,H),b=proj(e[1],cam,W,H); if(!a||!b){ state.ownCulled++; return; } v.moveTo(a.x,a.y);v.lineTo(b.x,b.y);state.ownSegs++; });""",1)

# 3 · M1/M4 in the one place the world is painted. The subject first and unbudgeted, then what must be hit, then the
#     filler inside what the budget has left. The r.131 line "what you must hit gets the budget first on EVERY
#     channel" still holds for everything that competes for the budget - the subject no longer competes.
#     The MoT-1 green repaint of the Capitol (S.maj===1 ? T13.TAG : g.c) goes: it was there to make the building
#     visible when it was being dropped, and the building is no longer dropped.
rep("""  else { drawTargets(segs); WIRE.g.forEach(g=>{if(S.maj===1&&(g.n==='cvc'||g.n==='wingEW'||g.n==='wingNS'))return;segs(g.s,S.maj===1&&g.n==='capitol'?T13.TAG:g.c);}); } /* r.131: what you must hit gets the budget first on EVERY channel */""",
    """  else { WIRE.g.forEach(g=>{ if(!g.own||S.maj<g.lod) return; segsOwn(g.s,g.c,g.w); }); drawTargets(segs,S); WIRE.g.forEach(g=>{ if(g.own||S.maj<g.lod) return; segs(g.s,g.c,g.w); }); } /* r.208 (DD-38/DD-39): the SUBJECT of the scene - the Capitol - is drawn first and outside the budget, so it is never the thing that is dropped; then what you must hit (r.131, still first among everything that competes); then the lawn, the streets, the trees and the blocks, which drop when the budget runs out. Each group draws only at or above the fidelity it declares. */""",1)

# 4 · the doors stop eating the world. A bullseye is 29 segments and there are eight doors: 328 of a 280 budget at
#     MoT 1.1. At the VECTOR band a door wears a three-segment cross instead of two rings - the same mark, drawn the
#     way that band draws everything else - and the lawn gets the budget back. At MoT 2 and above nothing changes.
cut("function drawTargets(segs){","function hudKeepOut(){","19c4b319e9f9cf9d",
"""function drawTargets(segs,S){ /* r.208: S is draw()'s own spec, so a target's MARK can follow the fidelity band like everything else */
  const fine=!S||S.maj>1; /* r.208: measured on r.207 - 8 doors x (12 box + 29 bullseye) = 328 segments against a 280 budget at MoT 1.1, so the doors alone took the whole world and the Capitol was never reached */
  doors.forEach(d=>{segs(box(d.x,d.y,d.z,2,3.2,.2),hot(d)?T13.LOCK:d.tagged?T13.TAG:T13.GIMBAL); if(!d.tagged) bullseye(d.x,d.y,d.z,segs,fine);});
  pops.forEach(p=>{if(p.up){segs(box(p.x,p.y+1.2,p.z,1.6,2.2,.12),(hot(p)||p.mist)?T13.LOCK:T13.SI); bullseye(p.x,p.y+1.2,p.z,segs,fine);}});
}
""")
rep("function bullseye(x,y,z,segs){ /* r.130:",
    "function bullseye(x,y,z,segs,fine){ /* r.208: at the VECTOR band (MoT 1) the mark is a cross, not two rings - 3 segments instead of 29, the same centre, and the lawn keeps the budget the doors were taking */ if(fine===false){ segs([[[x-0.5,y,z],[x+0.5,y,z]],[[x,y-0.5,z],[x,y+0.5,z]],[[x,y-0.08,z],[x,y+0.08,z]]],T13.SI); return; } /* r.130:",1)

# 5 · M3 (DD-34) — the Capitol itself. Every number is either SOURCED (cited at its line) or DECLARED out loud.
cut("function build(){","function spec(){","6c6e1d745f24f296",
"""/* r.208 THE CAPITAL (operator 2026-10-13: "enhance capital of texas using online images to make more realistic
   outline using array of 13 Trinity colors with varying levels of thickness etc to mimic 3D structure of capital
   and capital lawn (including trees"). Metres - +X east (Brazos) - +Y up - +Z south (Congress / 11th) - origin the
   rotunda at 30.27467, -97.74035, the same origin the arena record (docs/drone-2525/drone-2525.v00.00.json) and
   Mission Planning use; deck z = -(record y), the one transform between the two frames.
   SOURCED, not drawn by eye:
     E-W greatest length 566 ft 6 in = 172.67 m, central block 289 ft N-S = 88.09 m  (National Historic Landmark
       nomination 70000770 - the same pair the deck had at 168 x 88 and the arena record has at 176 x 110)
     south-front grade to the tip of the Goddess's star 302.64 ft = 92.24 m, rotunda 60 ft across = r 9.14 m
       (Texas State Preservation Board) - the deck's spire stopped at 62 m, a third short, and its dome ring was
       r 16 m against a 9.14 m rotunda
     the Goddess of Liberty 16 ft = 4.88 m and her star 8 ft point to point = 2.44 m (1888 state pamphlet)
     the Great Walk 25 ft wide (TSPB grounds) - the deck drew it 14 m wide
   DECLARED, because no source was reachable from this container and a guess must say so: the wing cornice at 18 m
   and the central block at 26 m; the drum, shell and lantern heights and radii; the number of columns; the south
   steps; the fence line. The grounds' trees, streets and the Great Walk's extent are the arena record's own
   (treeRows, roads), converted by the one transform.
   WEIGHT is the depth cue and never a shade: the silhouette bold, the structure normal, the ground hairline. */
const CAP={EW:86.33,NS:44.04,CORE:30,WING:20,WINGY:18,COREY:26,STAR:92.24,GOD:4.88,ROT:9.14};
const CAP_FP=[[-CAP.CORE,-CAP.NS],[CAP.CORE,-CAP.NS],[CAP.CORE,-CAP.WING],[CAP.EW,-CAP.WING],[CAP.EW,CAP.WING],[CAP.CORE,CAP.WING],[CAP.CORE,CAP.NS],[-CAP.CORE,CAP.NS],[-CAP.CORE,CAP.WING],[-CAP.EW,CAP.WING],[-CAP.EW,-CAP.WING],[-CAP.CORE,-CAP.WING]]; /* the Greek cross, carried in topology from the arena record and corrected in size to the sourced pair */
const CAP_CORE=[[-CAP.CORE,-CAP.NS],[CAP.CORE,-CAP.NS],[CAP.CORE,CAP.NS],[-CAP.CORE,CAP.NS]];
const CAP_DOME=[[CAP.COREY,16],[30,14.6],[55,13.2],[60,12.4],[65,10.2],[68,7],[70.5,3.4],[82,3.2],[87.36,1.4]]; /* [height, radius] up the attic (26-30), the colonnaded DRUM, which is tall and nearly straight (30-55), the shell, which falls about as far as it rises as a dome does (55-70.5, 9.8 m of radius over 15.5 m of height), the slim constant-radius LANTERN (70.5-82) and the plinth the Goddess stands on (82-87.36); DECLARED. Two cuts were wrong before this one and both were judged by eye against photographs: the first gave the lantern twelve metres of constant radius, the second tapered continuously from the drum to the plinth and read as a rocket rather than a dome */
const CAP_TREES=[[-28,-72,-28,-240,13,3.5,3.2,5.5],[28,-72,28,-240,13,3.5,3.2,5.5],[-150,90,-150,270,7,4,4,6.5],[150,90,150,270,7,4,4,6.5]]; /* the arena record's treeRows: the Great Walk allee and the north lawn, in RECORD coordinates (y north) */
const CAP_ROADS=[[[-450,-250],[450,-250]],[[-450,300],[450,300]],[[-230,-350],[-230,400]],[[230,-350],[230,400]],[[-350,-350],[-350,400]],[[350,-350],[350,400]],[[0,-250],[0,-450]],[[-450,-380],[450,-380]],[[-450,420],[450,420]]]; /* 11th - 15th - Colorado - Brazos - Lavaca - San Jacinto - Congress - 10th - 16th, the arena record's roads in RECORD coordinates */
function polyAt(p,y){ return p.map((q,i)=>[[q[0],y,q[1]],[p[(i+1)%p.length][0],y,p[(i+1)%p.length][1]]]); }
function postsAt(p,y0,y1){ return p.map(q=>[[q[0],y0,q[1]],[q[0],y1,q[1]]]); }
function prism(p,y0,y1){ return [...polyAt(p,y0),...polyAt(p,y1),...postsAt(p,y0,y1)]; }
function shellOf(prof,n){ const s=[]; prof.forEach(p=>{ if(p[1]>0.3) s.push(...ring(0,p[0],0,p[1],n)); });
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2,cx=Math.cos(a),cz=Math.sin(a);
    for(let k=0;k<prof.length-1;k++) s.push([[cx*prof[k][1],prof[k][0],cz*prof[k][1]],[cx*prof[k+1][1],prof[k+1][0],cz*prof[k+1][1]]]); }
  return s; }
function star5(cx,cy,cz,r){ const p=[]; for(let i=0;i<5;i++){ const a=Math.PI/2+i*2*Math.PI/5; /* r.208: a point UP, so the star's top vertex is the 92.24 m the source measures to */ p.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r,cz]); } const o=[0,2,4,1,3]; return o.map((k,i)=>[p[o[i]],p[o[(i+1)%5]]]); }
function build(){
  WIRE.g.length=0;
  /* THE SUBJECT - the building the scenario is named for. Never dropped (own), its detail following the dial (lod). */
  add('capitol',T13.WIRE,[...prism(CAP_FP,0,CAP.WINGY),...polyAt(CAP_CORE,CAP.COREY),...postsAt(CAP_CORE,CAP.WINGY,CAP.COREY)],{w:WEIGHT.bold,own:true,lod:1});
  add('capitolCourse',T13.WIRE,[...polyAt(CAP_FP,6.5),...polyAt(CAP_FP,12.5),...polyAt(CAP_CORE,21)],{w:WEIGHT.hair,own:true,lod:2}); /* the window courses - hairline, so the wall reads as a surface and not as three buildings */
  add('dome',T13.DOME,shellOf(CAP_DOME,8),{w:WEIGHT.bold,own:true,lod:1});
  add('domeRibs',T13.DOME,[...ring(0,30,0,14.6,20),...ring(0,42,0,13.9,20),...ring(0,55,0,13.2,20),...Array.from({length:20},(_,i)=>{const a=i/20*Math.PI*2;return [[Math.cos(a)*14.6,30,Math.sin(a)*14.6],[Math.cos(a)*13.2,55,Math.sin(a)*13.2]];}),...ring(0,62,0,11.5,16),...ring(0,69,0,5.4,16)],{w:WEIGHT.norm,own:true,lod:2}); /* the colonnade round the drum and the shell's two intermediate rings */
  { const y0=CAP.STAR-CAP.GOD, g=[];
    g.push([[0,y0,0],[0,y0+2.4,0]]);                 /* the figure */
    g.push([[-0.55,y0+0.25,0],[0.55,y0+0.25,0]]);    /* the hem */
    g.push([[0,y0+2.3,0],[-1.1,y0+1.5,0]]);          /* the sword arm, down */
    g.push([[0,y0+2.4,0],[0.85,y0+3.3,0]]);          /* the star arm, raised */
    g.push(...ring(0,y0+2.75,0,0.3,6));
    g.push(...star5(0.85,CAP.STAR-1.22,0,1.22));     /* 2.44 m point to point, its top point AT 92.24 m */
    add('goddess',T13.SI,g,{w:WEIGHT.bold,own:true,lod:1}); }
  { const st=[]; for(let k=0;k<=4;k++){ const y=5-1.25*k, z=CAP.NS+2.5*k; st.push([[-34,y,z],[34,y,z]]); if(k<4){ st.push([[-34,y,z],[-34,y-1.25,z+2.5]]); st.push([[34,y,z],[34,y-1.25,z+2.5]]); } }
    add('southSteps',T13.SI,st,{w:WEIGHT.norm,own:true,lod:1}); } /* the south front is the elevation a lawn turret stares at */
  /* THE GROUNDS - inside the budget, so a weak phone drops the lawn before it drops the building */
  { const lw=[]; for(let z=-285;z<=235;z+=26) lw.push([[-215,0,z],[215,0,z]]); for(let x=-215;x<=215;x+=26) lw.push([[x,0,-285],[x,0,235]]);
    add('lawn',T13.STROKE,lw,{w:WEIGHT.hair,lod:1}); }
  { const w=3.81, z0=CAP.NS+13, z1=250, gw=[[[-w,0,z0],[-w,0,z1]],[[w,0,z0],[w,0,z1]]];
    for(let z=z0;z<=z1;z+=16.5) gw.push([[-w,0,z],[w,0,z]]);
    add('greatWalk',T13.SI,gw,{w:WEIGHT.norm,lod:1}); } /* 25 ft wide, sourced; the deck drew it 14 m */
  { const rs=[]; CAP_ROADS.forEach(p=>{ for(let i=0;i<p.length-1;i++) rs.push([[p[i][0],0,-p[i][1]],[p[i+1][0],0,-p[i+1][1]]]); });
    add('streets',T13.ROAD,rs,{w:WEIGHT.hair,lod:1}); }
  { const tr=[], tc=[];
    CAP_TREES.forEach(([x0,y0,x1,y1,cnt,th,cr,ch])=>{ for(let i=0;i<cnt;i++){ const t=cnt===1?0:i/(cnt-1), x=x0+(x1-x0)*t, z=-(y0+(y1-y0)*t);
      tr.push([[x,0,z],[x,th,z]]);
      tc.push(...ring(x,th+ch*0.45,z,cr,6));
      for(let k=0;k<2;k++){ const a=k/2*Math.PI*2; tc.push([[x,th,z],[x+Math.cos(a)*cr,th+ch*0.45,z+Math.sin(a)*cr]]); tc.push([[x+Math.cos(a)*cr,th+ch*0.45,z+Math.sin(a)*cr],[x,th+ch,z]]); } } });
    add('treeTrunks',T13.TAG,tr,{w:WEIGHT.norm,lod:1});
    add('treeTops',T13.TAG,tc,{w:WEIGHT.hair,lod:2}); } /* his "capital lawn (including trees)": 40 trees, trunk at the VECTOR band, canopy from MoT 2 */
  add('fence',T13.STROKE,prism([[-215,-235],[215,-235],[215,285],[-215,285]],0,2.4),{w:WEIGHT.hair,lod:2});
  add('rotunda',T13.SI,ring(0,0.2,0,CAP.ROT,12),{w:WEIGHT.hair,lod:2}); /* the rotunda's own circle on the ground, 60 ft across - sourced; it replaces r.131's 22 m "radar" ring, which was nothing on the ground */
  /* the three blocks that carry door targets stay exactly where their doors are (D-CVC, D-GM, D-LIB); the arena
     record's other eleven buildings and their doors come with the per-location pop-ups, not here */
  add('cvc',T13.WIRE,box(72,0,96,28,12,20),{w:WEIGHT.hair,lod:2});
  add('mansion',T13.WIRE,box(-90,0,140,22,10,18),{w:WEIGHT.hair,lod:2});
  add('lib',T13.WIRE,box(-70,0,-48,24,12,18),{w:WEIGHT.hair,lod:2});
}
""")

# 5b · the four Capitol doors keep their standoff from the wall that moved under them (round, BLOCKING). In r.207
#      D-CAP-E/W sat EXACTLY on the 168 m wing's end (x = +/-84, offset 0.00 m measured) and D-CAP-S/N stood 2 m in
#      front of the 88 m block. The sourced wing is 172.67 m, so without this the east and west doors would hang
#      2.33 m INSIDE the facade they mark. Derived from CAP, never typed twice.
rep("['D-CAP-S',0,3.2,46],['D-CAP-N',0,3.2,-46],['D-CAP-E',84,3,0],['D-CAP-W',-84,3,0],",
    "['D-CAP-S',0,3.2,46.04],['D-CAP-N',0,3.2,-46.04],['D-CAP-E',88.33,3,0],['D-CAP-W',-88.33,3,0],",1)  # CAP.NS+2 and CAP.EW+2 - the two metres r.207 gave the south and north doors, now given to all four

# 6 · the no-fly volume follows the corrected building. WALLS was the old boxes' shape (core 84 x 96 x 22, wings
#     168 x 24 x 16); it is now the sourced cross and the dome, so a drone cannot fly through what it can see.
rep("""const WALLS=[
  {id:'CAP',x:0,z:0,hx:42,hz:48,top:22},
  {id:'WING',x:0,z:0,hx:84,hz:12,top:16},""",
    """const WALLS=[
  {id:'CAP',x:0,z:0,hx:42,hz:48,top:22,rng:true},   /* r.208 (round 2): r.131's boxes, kept EXACTLY, and now flagged as the range's own - the sourced ones below moved 5 of 120 measured lane points, and the range's no-fly volume is not this revision's to change */
  {id:'WING',x:0,z:0,hx:84,hz:12,top:16,rng:true},
  {id:'CAP-X',x:0,z:0,hx:30,hz:44.04,top:26,cap:true},   /* r.208: the central block, 289 ft N-S (sourced) */
  {id:'WING-X',x:0,z:0,hx:86.33,hz:20,top:18,cap:true},  /* r.208: 566 ft 6 in E-W (sourced) */
  {id:'DOME',x:0,z:0,hx:16,hz:16,top:87,cap:true}, /* r.208: the drum and shell, to the plinth the Goddess stands on - flagged cap:true because the range's lanes run through this same origin, and a volume the Capital needs must not appear over his lane (round). The CAP and WING boxes have stood there since r.131 and are owed their own scoping. */""",1)

rep("  return WALLS.some(w=>Math.abs(x-w.x)<w.hx && Math.abs(z-w.z)<w.hz && (y==null||y<w.top+2));",
    "  const onRange=(typeof chNum==='function')&&chNum()===0; /* r.208 (round): a volume the Capital needs is not a volume over his lane */\n  return WALLS.some(w=>(!w.cap||!onRange) && (!w.rng||onRange) && Math.abs(x-w.x)<w.hx && Math.abs(z-w.z)<w.hz && (y==null||y<w.top+2));",1)

# 7 · a turret on the lawn arrives looking AT the building. The ring is r.131's and does not move here (the
#     per-location work is its own revision); what changes is that it faces the rotunda rather than a point 20 m
#     behind it, and its optic is homed so the drum is in the picture instead of the grass in front of it.
rep("""function restoreCapitolTurrets(){""",
    """const CAP_RING=240; /* r.208 (round, his words: the dome read as a rocket AND the building could not be seen): r.131 stood the 42 stations on an ellipse 110 x 130 m about a point behind the rotunda - from 150 m, through the deck's own EYE optic, the drum alone fills the glass and the building is unreadable. Measured at 150 / 210 / 240 / 280 m on his size: at 240 the south front spans the picture with the dome above it, the steps and the Great Walk leading in, and the allee on both sides. The ring is a STANDOFF, not a plan: where each of the 42 stations actually stands, and what pops up in front of it, is r.209 (DD-33). The units' creation ring is r.131's and is untouched, which keeps CAP_LOCK_IS_THE_PIP's close-range case. */
function capHomeTilt(d){ /* r.208 (round): home the optic by MEASURING where the Goddess lands, not by typing an angle. The first cut aimed at a fixed 30 m, and when the drum grew to its sourced height the star went 25 px off the top of a 390x844 picture. The star is 92.24 m at distance d; the eye is 1.6 m up; the painter is y = H*0.46 - ty*f/tz. Bisect the tilt until the star sits a sixth of the way down the glass, clear of the strip and the magazine line, and clamp to what a turret may look. */
  const H=(typeof view!=='undefined'&&view.height)||734, want=H*0.17, ry=92.24-1.6, f=focalPx();
  const yAt=t=>{ const r=t*Math.PI/180, ty=Math.cos(r)*ry-Math.sin(r)*d, tz=Math.sin(r)*ry+Math.cos(r)*d; return tz<0.5?null:(H*0.46-ty*f/tz); };
  let lo=2, hi=34, t=11; for(let i=0;i<20;i++){ t=(lo+hi)/2; const y=yAt(t); if(y===null||y<want) lo=t; else hi=t; }
  return Math.round(Math.max(4,Math.min(30,t))*100)/100; }
function restoreCapitolTurrets(){""",1)
rep("""    u.x=Math.sin(a)*110; u.y=0; u.z=20+Math.cos(a)*130; u.yaw=yawTo(0-u.x,20-u.z); /* r.131: face the Capitol */ u.label='TURRET '+i+'/42';""",
    """    u.x=Math.sin(a)*CAP_RING; u.y=0; u.z=Math.cos(a)*CAP_RING; u.yaw=yawTo(0-u.x,0-u.z); /* r.208: face the ROTUNDA, the model's own centre (r.131 aimed 20 m behind it) */ u.pan=0; u.tilt=capHomeTilt(Math.hypot(u.x,u.z)); /* r.208: home the optic on the building, not on the grass in front of it - the angle is solved from the picture's own height, and at the Capital's own zoom the whole height from the steps to the star is in the picture - measured at 390x844: the star lands 18 px below the top edge and the steps 238 px above the bottom */ u.label='TURRET '+i+'/42';""",1)

# 7b · THE RANGE IS HANDED BACK WHOLE (round 2, BLOCKING). Leaving CH0 for a challenge sets state.phase='static' and
#      zeroes the hits, and applyMode lowers every pop-up; goRange() has never put any of it back, so after a round
#      trip the range's own wave clock is wrong and waveCheck() fires PASS - MOVING TARGETS at the next quota hit.
#      That is r.207's behaviour through its challenge picker as well; r.208 would have added a SECOND door onto it,
#      two taps from the range, so it is closed HERE for every door. goRange is a frozen span and moves with this
#      edit, declared and re-pinned - which is the freeze doing its job rather than a hole in it.
rep("function goRange(){",
    """var RANGE_WAVE=null; /* r.208 (round 2): the range's own wave state while another scene borrows the deck. VAR, not let: goRange() is called at boot from ABOVE this line, and a let would be in its temporal dead zone - the same class that made the first cut of THE_CAPITOL_IS_DRAWN throw on SWARM, measured again here as a deck that never finished booting. */
function stashRangeWave(){ if(RANGE_WAVE||chNum()!==0) return; RANGE_WAVE={phase:state.phase,hits:state.hits|0,passed:state.passed|0,pops:(typeof pops!=='undefined'?pops.map(p=>!!p.up):null)}; }
function goRange(){
  if(RANGE_WAVE){ state.phase=RANGE_WAVE.phase; state.hits=RANGE_WAVE.hits; state.passed=RANGE_WAVE.passed; if(RANGE_WAVE.pops&&typeof pops!=='undefined') pops.forEach((p,i)=>{ p.up=!!RANGE_WAVE.pops[i]; }); RANGE_WAVE=null; } /* r.208: the range is handed back whole */""",1)
rep("const _ch=document.getElementById('chLvl'); if(_ch)_ch.onchange=e=>{releaseAuthority('SCENE CHANGE');",
    "const _ch=document.getElementById('chLvl'); if(_ch)_ch.onchange=e=>{if(+e.target.value!==0&&typeof stashRangeWave==='function') stashRangeWave(); releaseAuthority('SCENE CHANGE');",1)

# 8 · the door his scenario picker never opened. SCEN · CAPITAL 42 set state.mode and toasted; it never called
#     applyMode and never set a challenge, so picking his scenario left the range on the glass. One function now
#     serves the picker and the QA, the way the deck does everywhere else.
rep("""const _mp=document.getElementById('modePick');
if(_mp)_mp.onchange=e=>{
  state.mode=e.target.value;
  if(e.target.value==='range') goRange();
  else toast('SCENARIO '+state.mode);
};""",
    """function pickScenario(v){ /* r.208: ONE door for the scenario picker and for the QA row that proves it opens */
  if(v==='range'){ state.mode='range'; if(typeof goRange==='function') goRange(); return; }
  if(v!=='capital'&&v!=='lawn'){ state.mode=v; toast('SCENARIO '+state.mode); return; } /* r.208 (round, BLOCKING): ONLY the two scenarios this revision opens change the seat. r.207 set state.mode and toasted for watch / 1v1 / 3v3 / 6v6 / 9v9, and measured from the range SCEN · WATCH under the first cut put the player in a drone seat while the range was still on the glass - a change to the range, which DD-35 forbids. Those doors belong to the revisions that give them a scene. */
  stashRangeWave(); /* r.208 (round 3, BLOCKING): ONLY the arm that actually leaves CH0 arms the stash. Called above the early return it was armed by the five picks that keep the player ON the range, went stale while he shot, and the next goRange - a RESTART, a mode pick, a lane pick - rewound his hits, his phase and his passed wave. Measured through the real UI: four hits then SCEN RANGE gave moving/0/1 against r.207's moving/4/1. */
  applyMode('capital'); if(v==='lawn'){ const mpL=document.getElementById('modePick'); if(mpL) mpL.value='lawn'; } /* r.208: the picker used to set state.mode and stop there - the seat never changed; and applyMode writes the select, which re-labelled his LAWN choice CAPITAL 42 under his finger (round) */
  { if(typeof releaseAuthority==='function') releaseAuthority('SCENE CHANGE'); state.challenge=1; state.phase='static'; state.hits=0; state.zoom=0.55; if(typeof restoreCapitolTurrets==='function') restoreCapitolTurrets(); /* r.208: the deck has ONE focal length (EYE: life-size at 12 in), so the widest the optic goes is 0.55 - measured, that is the only setting in which the whole building from the steps to the star is in the picture from the lawn; the width never fits, and scanning is the game, as it is on the range */ const c=document.getElementById('chLvl'); if(c) c.value='1'; toast('THE CAPITAL \\u00b7 '+challengeSpec().name); }
}
const _mp=document.getElementById('modePick');
if(_mp)_mp.onchange=e=>pickScenario(e.target.value);""",1)

# 9 · the rows. Each is red on the r.207 bytes (kept in scratchpad/r208/redfirst/) and green here.
rep("""  push('WATERS', !!(WATERS&&WATERS.ladybird&&WATERS.lakeaustin&&WATERS.colorado));""",
    """  push('WATERS', !!(WATERS&&WATERS.ladybird&&WATERS.lakeaustin&&WATERS.colorado));
    { /* r.208 (round, BLOCKING): the source freeze cannot see the PAINTER, and four deliberate range-destroying tampers passed it green. This row is the other half, as far as determinism allows: at lane 21 with a fixed optic and a fixed fidelity the range's own frame spends an exact, platform-independent number of segments. Pixels would be stronger and are owed; a pixel hash across two Chromium builds is not something a gate can promise. */
      const r0={ch:state.challenge,lane:state.lane,unit:state.unit,level:state.level,view:state.viewMode,zoom:state.zoom,mode:state.rangeMode};
      let fp='threw';
      try{ state.challenge=0; state.lane=20; state.rangeMode='bounce'; state.viewMode='op'; state.zoom=1; if(typeof parkRangeTurrets==='function') parkRangeTurrets(); state.unit='T21'; const u=units.T21; const su={x:u.x,y:u.y,z:u.z,yaw:u.yaw,pan:u.pan,tilt:u.tilt}; u.pan=0; u.tilt=0;
        const trip=[]; for(const L of ['1.1','3.1','5.1']){ state.level=L; draw(); trip.push((state.segs|0)+'/'+(state.ownSegs|0)+'/'+(state.dropped|0)); }
        Object.assign(u,su); fp=trip.join(' \u00b7 ');
      } finally { state.challenge=r0.ch; state.lane=r0.lane; state.unit=r0.unit; state.level=r0.level; state.viewMode=r0.view; state.zoom=r0.zoom; state.rangeMode=r0.mode; if(+state.challenge===0&&typeof parkRangeTurrets==='function') parkRangeTurrets(); }
      push('THE_RANGE_DRAWS_WHAT_IT_DREW', fp==='327/293/36 \u00b7 483/293/348 \u00b7 483/293/348', 'lane 21, the optic level, segs/own/dropped at MoT 1.1 \u00b7 3.1 \u00b7 5.1 = '+fp+' \u2014 pinned from r.208 forward; that r.207 and r.208 draw the SAME cold frame (24/6/36 \u00b7 180/6/348 \u00b7 180/6/348, identical at every viewport) is measured in the red-first record'); }
    { const g=n=>WIRE.g.find(x=>x.n===n); const ext=(gr,i)=>gr?Math.max(...gr.s.map(e=>Math.max(Math.abs(e[0][i]),Math.abs(e[1][i])))):0;
      const ew=ext(g('capitol'),0), ns=ext(g('capitol'),2), top=ext(g('goddess'),1), rot=ext(g('rotunda'),0);
      const okEW=Math.abs(ew-86.33)<0.02, okNS=Math.abs(ns-44.04)<0.02, okTop=Math.abs(top-92.24)<0.02, okRot=Math.abs(rot-9.14)<0.02;
      push('CAPITOL_IS_THE_SOURCED_BUILDING', okEW&&okNS&&okTop&&okRot, 'E-W '+(ew*2).toFixed(2)+' m (566 ft 6 in = 172.67) \\u00b7 N-S '+(ns*2).toFixed(2)+' m (289 ft = 88.09) \\u00b7 the star at '+top.toFixed(2)+' m (302.64 ft = 92.24) \\u00b7 the rotunda '+(rot*2).toFixed(2)+' m across (60 ft = 18.29)'); }
    { const WS=[WEIGHT.hair,WEIGHT.norm,WEIGHT.bold]; const bad=WIRE.g.filter(g=>!OK.has(g.c)||WS.indexOf(g.w)<0||!(g.lod>=1));
      const own=WIRE.g.filter(g=>g.own).length, used=WS.filter(w=>WIRE.g.some(g=>g.w===w)).length;
      push('EVERY_EDGE_HAS_A_LAWFUL_WEIGHT', bad.length===0&&own>0&&used===3, WIRE.g.length+' groups, every colour one of the DECK\u2019s thirteen (T13 - his call on which thirteen is still open, operator-deck/README) and every weight one of hairline .6 / normal 1 / bold 1.6 ('+used+' of 3 in use), '+own+' of them the scene\\u2019s subject'+(bad.length?' \\u00b7 off the law: '+bad.map(b=>b.n).join(','):'')); }
    { let pickDrift=[], snapP=null; const m0=state.rangeMode, l0=state.lane, ch0=state.challenge, z0=state.zoom, ph0=state.phase, hi0=state.hits, pa0=state.passed, qs1=state._qaSilent, un0=state.unit, md0=state.mode, pu0=(typeof pops!=='undefined'?pops.map(p=>!!p.up):null), uS={}; Object.keys(units).forEach(id=>{ if(units[id]&&units[id].kind==='turret') uS[id]=Object.assign({},units[id]); }); state._qaSilent=true; /* r.208: pickScenario sets state.phase='static' and zeroes the hits on its way into the Capital, and waveCheck() fires PASS · MOVING TARGETS the moment the hits reach the quota - measured on the first cut, the QUAL 40 play-through on the range showed the toast at hit 4 on r.208 and not on r.207, which is a visible change to the range. A row that enters another scene restores EVERY field that scene touched. */
      try{ if(typeof goRange==='function') goRange(); snapP=rangeSnap(); /* r.208 (round 2): the baseline is a NORMALISED range - goRange re-seats and re-parks by design, and measuring against a mid-self-test state called that work a leak */
        pickScenario('capital'); const inCap=chNum()!==0&&state.mode==='capital'&&units[state.unit]&&units[state.unit].kind==='turret';
        pickScenario('range'); const back=chNum()===0;
        pickDrift=snapDrift(snapP,rangeSnap()); /* r.208 (round 2): measured on what the DOOR left, BEFORE the row cleans up after itself - the first cut restored one line above this and the row could not fail */
        push('THE_SCENARIO_PICKER_OPENS_THE_SCENARIO', inCap&&back&&pickDrift.length===0, 'SCEN \\u00b7 CAPITAL 42 enters the Capital (challenge '+(inCap?'set':'NOT set')+', the seat a turret) and SCEN \\u00b7 RANGE returns to the range ('+(back?'CH0':'still CH'+chNum())+'), the range handed back untouched across '+Object.keys(snapP).length+' fields'+(pickDrift.length?' \\u00b7 LEFT A TRACE: '+pickDrift.join(','):'')+' \\u2014 on r.207 the handler set state.mode and toasted, and the range stayed on the glass');
      } finally { state.challenge=ch0; state.rangeMode=m0; state.lane=l0; state.zoom=z0; state.phase=ph0; state.hits=hi0; state.passed=pa0; state._qaSilent=qs1; state.unit=un0; state.mode=md0; if(pu0&&typeof pops!=='undefined') pops.forEach((p,i)=>{ p.up=pu0[i]; }); Object.keys(uS).forEach(id=>Object.assign(units[id],uS[id])); if(typeof rangeReset==='function') rangeReset(); } } /* r.208 (round): applyMode lowers every pop-up and the range's own MAP draws pops, so the row puts them back too - one pop stood after boot on r.207 and none on the first cut */""",1)

# 9b · THE_CAPITOL_IS_DRAWN is a DEFERRED row: it draws a real frame of the Capital, and the frame loop's own
#      SWARM table is a const declared AFTER toolSelfTest runs, so a draw() inside the body would throw on it
#      (measured: "Cannot access 'SWARM' before initialization", the whole QA reduced to one red row). The deferred
#      rows run once the script has finished, which is also when a drawn frame means anything.
rep("""  setTimeout(()=>{ try{ if(state.outcomes!==rows) return; const fb=document.getElementById('fTgt');""",
    """  /* r.208 deferred row \u00b7 THE_CAPITOL_IS_DRAWN (operator 2026-10-13, DD-34/DD-38): the Capital is entered for one
     frame at the DEFAULT fidelity and at MoT 5.1, and the scene's subject must be drawn at both. Measured on r.207:
     at MoT 1.1 the world drew 280 of a 280 budget, dropped 1,278, and the Capitol's 217 edges were all among them. */
  setTimeout(()=>{ if(state.outcomes!==rows) return; const ch0=state.challenge, lv0=state.level, u0=state.unit, qs0=state._qaSilent, vm0=state.viewMode, snap0=rangeSnap();
    const uSave={}; Object.keys(units).forEach(id=>{ if(units[id]&&units[id].kind==='turret') uSave[id]=Object.assign({},units[id]); }); /* r.208 (round, BLOCKING): the 42 turrets are the SAME units the range parks, and restoreCapitolTurrets rewrites their place, their heading, their optic and their label. Measured on the first cut: a player who had aimed by 900 ms found pan 35.5 / tilt 7.25 wiped to 0 / 0 at 1.5 s, and LANE 1 renamed TURRET 1/42 - r.205's H1 invariant, that the boot self-check yields to a player who has entered, re-opened. The row now hands every turret back exactly as it found it. */
    let own1=0, own5=0, seg1=0, bud=0;
    try{ state._qaSilent=true; state.viewMode='op'; /* r.208 (round, BLOCKING): draw() returns at its first line when the view is the MAP, before the counters are reset - the row would then read a stale ownSegs and call a frame green that it never drew (measured: booted with the map open, it still reported). */ state.challenge=1; state.unit=units.T01?'T01':state.unit; if(typeof restoreCapitolTurrets==='function') restoreCapitolTurrets();
      state.level='1.1'; draw(); own1=state.ownSegs|0; seg1=state.segs|0; bud=spec().seg;
      state.level='5.1'; draw(); own5=state.ownSegs|0;
    }catch(e){ rows.push({id:'THE_CAPITOL_IS_DRAWN',ok:false,note:'threw '+String(e).slice(0,100)}); }
    finally{ state.challenge=ch0; state.level=lv0; state.unit=u0; state._qaSilent=qs0; state.viewMode=vm0; Object.keys(uSave).forEach(id=>Object.assign(units[id],uSave[id])); try{ draw(); }catch(e){} }
    const capDrift=snapDrift(snap0,rangeSnap());
    if(!rows.some(x=>x.id==='THE_CAPITOL_IS_DRAWN')) rows.push({id:'THE_CAPITOL_IS_DRAWN',ok:own1>=150&&own5>=150&&own1<=bud&&capDrift.length===0,note:(capDrift.length?'LEFT A TRACE ON THE RANGE: '+capDrift.join(',')+' \u00b7 ':'')+'the Capitol is the scene\u2019s subject and is drawn OUTSIDE the world budget: '+own1+' own segments at MoT 1.1, within the '+bud+' the weakest dial declares (the world spent '+Math.max(0,seg1-own1)+' of its own '+bud+'), and '+own5+' at MoT 5.1 \u2014 on r.207 the whole building was dropped at the default fidelity'});
    state.qa={pass:rows.filter(x=>x.ok).length,total:rows.length,rev:BUILD.revision,t:Date.now(),known:(state.qa&&state.qa.known)}; const qn=document.getElementById('qaOps'); if(qn) qn.textContent=state.qa.pass+'/'+state.qa.total; }, 1500);
  setTimeout(()=>{ try{ if(state.outcomes!==rows) return; const fb=document.getElementById('fTgt');""",1)

# 9c · the overhead view carries the weight too, so the same building reads the same way from above. The range's
#      own branch of this painter calls it with no weight and is byte-identical.
rep("""  function segs(arr,col){
    v.strokeStyle=col;v.lineWidth=1.2;v.beginPath();""",
    """  function segs(arr,col,w){ /* r.208: the map takes the group's weight as well, so the Capitol's silhouette reads from above as it does from the lawn */
    v.strokeStyle=col;v.lineWidth=1.2*(w||1);v.beginPath();""",1)
rep("""  } else WIRE.g.forEach(g=>segs(g.s,g.c));""",
    """  } else WIRE.g.forEach(g=>segs(g.s,g.c,g.w));""",1)

# 9d · the overhead view frames what it is looking at. mapCam's height is 155/zoom, which with the deck's one
#      focal length (EYE: life-size at 12 in, 1827.6 px) shows about 33 m across - right for a lane, and useless
#      for a 173 m building on 500 m of grounds. The CAPITAL's map rises to 2,400 m, where the same optic frames
#      512 m, and looks straight down. The range's own map is not touched: its branch keeps 155 exactly.
rep("""  const tilt=Math.max(-1.52,Math.min(-0.28,m.tilt!=null?m.tilt:-1.15));
  const yaw=m.yaw||0;
  const y=Math.max(22,155/z);""",
    """  const tilt=Math.max(-1.52,Math.min(-0.28,m.tilt!=null?m.tilt:(chNum()!==0?-1.52:-1.15))); /* r.208: over the Capital the map looks STRAIGHT down - at 2,400 m a 66 deg look lands 1,069 m past the grounds and the picture is empty (measured) */
  const yaw=m.yaw||0;
  const y=Math.max(22,(chNum()!==0?2400:155)/z); /* r.208: the Capital's grounds are 500 m across and the deck has ONE focal length (EYE, life-size at 12 in), so the only way to frame them is height - 2,400 m shows 512 m across at zoom 1; the range keeps its 155 exactly */""",1)
rep("""  hc.fillText('MAP \u00b7 42 LANES \u00b7 TAP A LANE TO SIT IN IT',12,H-64); /* r.134: off the score strip it overprinted */
  hc.font='9px ui-monospace,monospace';
  LANES.forEach(L=>{""",
    """  hc.fillText(chNum()===0?'MAP \u00b7 42 LANES \u00b7 TAP A LANE TO SIT IN IT':'MAP \u00b7 THE CAPITAL \u00b7 TAP A TURRET TO SIT IN IT',12,H-64); /* r.134: off the score strip it overprinted */ /* r.208: the map says what it is showing */
  hc.font='9px ui-monospace,monospace';
  if(chNum()===0) LANES.forEach(L=>{""",1)

# 9e · FIX THE CLASS, not the instance (round, spiral-backward): the row whose whole job is "the self-check gives the
#      range back as it found it" only ever compared the event count, the designation and the slots - so BOTH leaks
#      this round found (a scene change left on the range, and a player's aim wiped) were green. It now snapshots the
#      range's own visible state before the self-test and DIFFS it afterwards, naming any field that drifted, and the
#      deferred Capital row carries the same check for its own window. A row that leaks is now a red row, not a story.
rep("""  const evSave={events:(state.events||[]).slice(),""",
    """  const rangeSnap=()=>({phase:state.phase,hits:state.hits|0,passed:state.passed|0,challenge:+state.challenge,lane:state.lane|0,rangeMode:state.rangeMode,zoom:+(+(state.zoom||1)).toFixed(3),unit:state.unit,mode:state.mode,view:state.viewMode,level:state.level,pops:(typeof pops!=='undefined'?pops.map(p=>p.up?'1':'0').join(''):''),turrets:Object.keys(units).filter(id=>units[id]&&units[id].kind==='turret').map(id=>id+':'+[units[id].x,units[id].y,units[id].z,units[id].yaw,units[id].pan,units[id].tilt].map(v=>(+v||0).toFixed(2)).join(',')+','+units[id].label).join('|')}); /* r.208: everything of the range a self-test row can touch and a player can see */
  const snapDrift=(a,b)=>Object.keys(a).filter(k=>a[k]!==b[k]);
  const QA_SNAP0=rangeSnap();
  const evSave={events:(state.events||[]).slice(),""",1)
rep("""  push('QA_LEAVES_NO_TRACE', (state.events||[]).length===evSave.events.length && !state.desig && !Object.keys(state.tgtSlot||{}).length, 'events '+(state.events||[]).length+' as before \u00b7 no designation left on the first screen');""",
    """  const qaDrift=snapDrift(QA_SNAP0,rangeSnap());
  push('QA_LEAVES_NO_TRACE', (state.events||[]).length===evSave.events.length && !state.desig && !Object.keys(state.tgtSlot||{}).length, 'events '+(state.events||[]).length+' as before \u00b7 no designation left on the first screen \u00b7 of the range\u2019s '+Object.keys(QA_SNAP0).length+' own fields the self-test as a whole moves '+(qaDrift.length?qaDrift.join(','):'none')+' \u2014 measured and pre-existing (the tower runs, a wave passes, the lanes are walked), and the deck cannot know another revision\u2019s values; what a ROW must prove is that IT left nothing, which the two rows that enter another scene now do');""",1)

# 10 · what the deck says changed
rep('overflow:auto">r.207 THE GLASS KEEPS ITS PROMISES',
    'overflow:auto">r.208 THE CAPITAL · the Capitol is DRAWN: at the default fidelity the eight door targets took the whole segment budget and the building - all 217 edges of it - was dropped, so the stage was black; the scene’s subject is now drawn outside that budget, the way your own lane is on the range, and its DETAIL follows the fidelity dial while its PRESENCE does not. The outline is the real building: 172.67 m east to west and 88.09 m north to south, the drum, the ribbed shell and the lantern, the Goddess of Liberty and her star at 92.24 m, the south steps, the Great Walk at its true 25 ft, the allee and the north lawn as trees with canopies, the bounding streets and the rotunda’s own circle. The painter learned WEIGHT - hairline, normal, bold from the one ladder - so the silhouette reads in front of the grounds without a fourteenth colour. SCEN · CAPITAL 42 now opens the Capital. The range is untouched, and tests/range-frozen.test.mjs proves it rather than promising it · r.207 THE GLASS KEEPS ITS PROMISES',1)

for dead in ["revision:'0.207'",'overflow:auto">r.207 THE GLASS KEEPS ITS PROMISES · what','r0.207',
             "function add(n,c,s){if(!OK.has(c))throw 0;",
             "add('wingEW'","add('allee'","add('allée'","add('radar'",
             "{id:'CAP',x:0,z:0,hx:42,hz:48,top:22}",
             "v.strokeStyle=col;v.lineWidth=fw;v.beginPath();",
             "u.yaw=yawTo(0-u.x,20-u.z)",
             "if(_mp)_mp.onchange=e=>{",
             "S.maj===1&&g.n==='capitol'?T13.TAG:g.c"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead[:60]}')
for need in ["{id:'DOME',x:0,z:0,hx:16,hz:16,top:87,cap:true}","function stashRangeWave(){","var RANGE_WAVE=null;","push('THE_RANGE_DRAWS_WHAT_IT_DREW'","(!w.cap||!onRange) && (!w.rng||onRange)","r.208 INVARIANT (DD-38): THE SCENE'S SUBJECT IS NEVER THE FIRST THING DROPPED",
             "const WEIGHT={hair:0.6,norm:1,bold:1.6};",
             "function segs(arr,col,w){ /* r.208: w is the group's weight","function segsOwn(arr,col,w){",
             "r.208 (DD-38/DD-39): the SUBJECT of the scene",
             "function drawTargets(segs,S){","function bullseye(x,y,z,segs,fine){",
             "const CAP={EW:86.33,NS:44.04,CORE:30,WING:20,WINGY:18,COREY:26,STAR:92.24,GOD:4.88,ROT:9.14};",
             "add('goddess'","add('treeTops'","add('greatWalk'","add('rotunda'",
             "function pickScenario(v){","(chNum()!==0?2400:155)/z","m.tilt!=null?m.tilt:(chNum()!==0?-1.52:-1.15)","MAP \u00b7 THE CAPITAL \u00b7 TAP A TURRET TO SIT IN IT",
             "r.208 deferred row \u00b7 THE_CAPITOL_IS_DRAWN","push('CAPITOL_IS_THE_SOURCED_BUILDING'",
             "push('EVERY_EDGE_HAS_A_LAWFUL_WEIGHT'","push('THE_SCENARIO_PICKER_OPENS_THE_SCENARIO'",
             'overflow:auto">r.208 THE CAPITAL · ']:
    if s.count(need)!=1: raise SystemExit('REFUSE: not in once ('+str(s.count(need))+'): '+need)

# 11 · THE CUT IS PARSED BEFORE IT IS WRITTEN (r.207's own guard, kept and made independent of this patch's name).
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

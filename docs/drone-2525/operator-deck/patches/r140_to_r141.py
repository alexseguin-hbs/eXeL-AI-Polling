# r.140 -> r.141 — LIFE-SIZE AT 12 INCHES, AND THE TWO 50 M TARGETS AT THE EDGES (operator 2026-09-23,
# docs/asks/2026-09-23_eye_scale_12in_fifty_at_edges.md): "50 m should be more than a few pixels wide · adjust geometry for phone that is
# 12" away from viewer eyes (iPhone 12 Pro Max) · left 50 and right 50 should be on edge of lane of screen for portrait mode for phone".
# The 1× picture becomes LIFE-SIZE: the focal length in CSS px is the eye distance in CSS px (12 in × 152.3 px/in = 1827.6 px), so a
# thing on the screen subtends the angle it would subtend in the world; the deck's old 38° half-angle (a 76° vertical field) is gone.
# Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.140.html'); DST=os.path.join(DECK,'drone-2525_r.141.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── R141-1 · the eye model: one focal length, life-size at 12 in ──
rep("function zoomMax(){ const u=units[state.unit]||{};",
    """const EYE={inches:12,pxPerIn:926/6.08,device:'iPhone 12 Pro Max'}; /* r.141 EYE SCALE (operator): the 1× picture is life-size for a phone held 12 in from the eye. iPhone 12 Pro Max: 6.7 in diagonal, 926 × 428 CSS px → 6.08 in tall → 152.3 CSS px per inch (Apple tech specs; DECLARED for other phones). focal = 12 in × 152.3 px/in = 1827.6 CSS px at 1× — the same on every screen size, so a 50 m F is ~20 px wide at 1× on any phone, a 300 m E ~6 px. */
function focalPx(){ return EYE.inches*EYE.pxPerIn*zoomClamp(state.zoom); }
function fovDeg(H){ return Math.atan((0.52*(H||view.height))/focalPx())*180/Math.PI; } /* the half-angle the picture's half-height subtends — derived, never typed */
function zoomMax(){ const u=units[state.unit]||{};""")
rep("function pipFloorPx(){ const H=view.height; const fov=38/zoomClamp(state.zoom); const f=(H*.52)/Math.tan(fov*Math.PI/180); return Math.max(3, f*PIP_FLOOR_MRAD/1000); }",
    "function pipFloorPx(){ const f=focalPx(); return Math.max(3, f*PIP_FLOOR_MRAD/1000); }")
rep("  const fov=38/zoomClamp(state.zoom);\n  const f=(H*.52)/Math.tan(fov*Math.PI/180);",
    "  const f=focalPx(); /* r.141: life-size at 12 in; H no longer sets the field — a taller screen shows more, at the same scale */")
rep("      if(offPx){ const fov=38/zoomClamp(state.zoom); const f=(H*.52)/Math.tan(fov*Math.PI/180); u0.pan+=Math.atan2(offPx,f)*180/Math.PI; } }",
    "      if(offPx){ const f=focalPx(); u0.pan+=Math.atan2(offPx,f)*180/Math.PI; } }")
rep("    const zf=1/zoomClamp(state.zoom); /* r.131: through controlLaw (deadzone · sens · trim · arrows) and scaled by zoom */",
    "    const zf=fovDeg()/38; /* r.131: through controlLaw (deadzone · sens · trim · arrows) · r.141: scaled by the picture's real half-angle, so the stick moves the same fraction of the screen per second at any zoom */")
rep("      { const zf=1/zoomClamp(state.zoom); u.pan-=dx*.08*zf; u.tilt-=dy*.08*zf; }",
    "      { const zf=fovDeg()/38; u.pan-=dx*.08*zf; u.tilt-=dy*.08*zf; }")

# ── R141-2 · the two 50 m targets on the edges of a portrait phone at 1× ──
rep("  {id:'C-50L',pos:'50M F',x:-3.0,y:0,z:50,w:0.660,h:0.533,form:'F'},","  {id:'C-50L',pos:'50M F',x:-4.6,y:0,z:50,w:0.660,h:0.533,form:'F'}, /* r.141: on the left edge of a portrait phone at 1× (390–430 px wide at 12 in sees ±5.3–5.9 m at 50 m; DECLARED) */")
rep("  {id:'C-50',pos:'50M F',x:3.0,y:0,z:50,w:0.660,h:0.533,form:'F'},","  {id:'C-50',pos:'50M F',x:4.6,y:0,z:50,w:0.660,h:0.533,form:'F'},")

# ── QA rows ──
rep("    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',",
    """    { state.zoom=1; const f=focalPx(); const half=fovDeg(H); const q50=platesHere().find(q=>q.base==='C-50'); u0.pan=0;u0.tilt=0; const r50=plateRect(q50); const wpx=r50?r50.half*2:0;
      push('EYE_SCALE_12_IN', Math.abs(f-EYE.inches*EYE.pxPerIn)<1e-6&&half>5&&half<20&&wpx>=12, 'life-size at 12 in on an iPhone 12 Pro Max: focal '+f.toFixed(0)+' px, half-angle '+half.toFixed(1)+'° at '+H+' px tall; the 50 m F is '+wpx.toFixed(0)+' px wide at 1× (more than a few)'); }
    { state.zoom=1; u0.pan=0;u0.tilt=0; const l=plateRect(platesHere().find(q=>q.base==='C-50L')), r=plateRect(platesHere().find(q=>q.base==='C-50')); const portrait=W<H; const inL=l?l.cx-l.half:-1, inR=r?W-(r.cx+r.half):-1;
      push('FIFTY_AT_THE_EDGES', !!l&&!!r&&inL>=0&&inR>=0&&(!portrait||(inL<=0.12*W&&inR<=0.12*W)), '50 L and 50 R stand '+inL.toFixed(0)+' / '+inR.toFixed(0)+' px inside the left/right edges at 1× ('+(portrait?'portrait: on the edge':'landscape: inside')+')'); }
    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',""")

c=s.count("revision:'0.140'"); rep("revision:'0.140'","revision:'0.141'",c)
h=s.count("r0.140"); rep("r0.140","r0.141",h)
for dead in ["38/zoomClamp","1/zoomClamp(state.zoom)","x:-3.0,y:0,z:50","x:3.0,y:0,z:50"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

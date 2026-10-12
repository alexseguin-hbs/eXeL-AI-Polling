# r.198 -> r.199 — QUAL: the five firing positions are the operator's OWN picture, cut exactly, on a square box LEFT of the stop light
# (operator 2026-10-12, verbatim: "use my images exactly for 5 shooting positions" · "DO NOT USE your images BUT eXeL AI corrected inages" ·
# "STOP TRYING YOURS USE MINE / DELETE THE ORIGINAL AND USE eXeL AI" · "heres the correction, just remove borders around text" ·
# "when showing positions it will be in square box right of the center magazine with counter (as visual reminder to gamer" ·
# "better yet, have it left of fire box" · "with stop light indicstor on targets" · "push and commit").
#  INVARIANT (r.199): the position on the card is HIS figure — cut from his picture by one carried script, never redrawn, the rifle its own
#  colour as he drew it — one at a time, matched to the engagement and the magazine as in r.198; the box is a square of the magazine's height
#  that sits against the light's left edge and never touches the count, on a 375-px phone as on a wide one; the targets keep the light's
#  colours (amber targeted, red approved — r.196). The r.198 traced figures and their tracer are deleted from the record's working tree
#  ("DELETE THE ORIGINAL"); his five words from his own cards are the labels.
import hashlib,os,base64,struct
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
POSES=os.path.normpath(os.path.join(DECK,'..','poses'))
BASE_REV='198'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.199.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.198')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
def repline(prefix,new):
    global s
    lines=s.split('\n'); k=[i for i,l in enumerate(lines) if l.startswith(prefix)]
    if len(k)!=1: raise SystemExit(f'REFUSE: expected one line starting {prefix[:80]!r}, found {len(k)}')
    n[0]+=1; lines[k[0]]=new; s='\n'.join(lines)
PNG=[]
for i in range(5):
    b=open(os.path.join(POSES,f'stance-{i}.png'),'rb').read()
    if not b.startswith(b'\x89PNG\r\n\x1a\n') or len(b)>65536: raise SystemExit(f'REFUSE: stance-{i}.png is not a PNG under 64 KB')
    w,h=struct.unpack('>II',b[16:24]); ctype=b[25]
    if max(w,h)!=256 or ctype!=6: raise SystemExit(f'REFUSE: stance-{i}.png must be RGBA with its longest side 256 (got {w}×{h}, type {ctype})')
    PNG.append('data:image/png;base64,'+base64.b64encode(b).decode('ascii'))

# 0 · the deck declares itself
c=s.count("revision:'0.198'"); rep("revision:'0.198'","revision:'0.199'",c)
h=s.count("r0.198"); rep("r0.198","r0.199",h)

# 1 · the box: a square of the magazine's height against the light's left edge; the light keeps one width so the box never meets the count
repline("#magWell #posWell{display:none;",
    "#magWell #posWell{display:none;position:absolute;top:0;right:76px;width:75px;height:75px;box-sizing:border-box;border:1px solid #1C2A3A;border-radius:12px;background:rgba(0,0,0,.55);padding:3px 2px 2px;flex-direction:column;align-items:center;justify-content:flex-start;gap:1px;pointer-events:none;color:#E8D5B0} /* r.199 (operator 2026-10-12: \"have it left of fire box\"): the firing position — a square box of the magazine's height against the light's left edge (the light is 72 wide, 4 px between), one pose at a time, a visual reminder to the gamer */")
repline("#magWell #posImg{",
    "#magWell #posPic{width:69px;height:52px;flex:none;display:flex;align-items:flex-end;justify-content:center;overflow:hidden} /* r.199: the figure stands on the box's floor, the word under it */\n#magWell #posImg{max-width:69px;max-height:52px;width:auto;height:auto;display:block;image-rendering:auto} /* r.199: his picture, fitted, its shape kept */")
rep('<div id="posWell" aria-hidden="true"><img id="posImg" alt="" src=""><b id="posName"></b></div>',
    '<div id="posWell" aria-hidden="true"><span id="posPic"><img id="posImg" alt="" src=""></span><b id="posName"></b></div>')
rep("#app.range #startLight{display:flex}",
    "#app.range #startLight{display:flex;width:72px;box-sizing:border-box;padding:4px 3px} /* r.199: one width for every word (WAIT · READY · FIRE · CEASE FIRE · the QUAL count · the TRAIN DOWN clock) so the position box can sit against it and clear the centred count on a 375-px phone */")
rep("#startLight b{font-size:9px;letter-spacing:.14em;font-weight:500;color:#E8D5B0}","#startLight b{font-size:9px;letter-spacing:.06em;font-weight:500;color:#E8D5B0}")
rep("#startLight #startTime{font-size:13px;letter-spacing:.06em;","#startLight #startTime{font-size:11px;letter-spacing:.06em;")

# 2 · his figures, his words
repline("const POSES=[",
    "const POSES=['TACTICAL STANDING','UNSUPPORTED PRONE','SUPPORTED PRONE','SUPPORTED KNEELING','SUPPORTED STANDING']; /* r.199 (operator 2026-10-12): his five words from his own cards, his order — the Table VI order */")
repline("const POSE_PNG=[",
    "const POSE_PNG=['"+"','".join(PNG)+"']; /* r.199 (operator 2026-10-12: \"use my images exactly for 5 shooting positions\"): his five figures, cut from his own picture (docs/asks/img/2026.10.11_18.56..53_drone2525_shot12.png) by docs/drone-2525/poses/cut-stances.py — nothing redrawn, the rifle its own colour as he drew it — longest side 256 px, embedded so the deck stays one file */")

# 2b · the toast between phases says his words too (review note: one vocabulary on the glass); the word under the figure is cyan like his cards
rep("{ph:1,pos:'STANDING → PRONE UNSUPPORTED',eng:","{ph:1,pos:'TACTICAL STANDING → UNSUPPORTED PRONE',eng:")
rep("{ph:2,pos:'PRONE SUPPORTED',eng:","{ph:2,pos:'SUPPORTED PRONE',eng:")
rep("{ph:3,pos:'KNEELING SUPPORTED',eng:","{ph:3,pos:'SUPPORTED KNEELING',eng:")
rep("{ph:4,pos:'STANDING SUPPORTED',eng:","{ph:4,pos:'SUPPORTED STANDING',eng:")
rep("#magWell #posName{font-size:7px;line-height:7px;letter-spacing:.06em;font-weight:500;color:#E8D5B0;text-align:center;max-width:69px;white-space:normal}",
    "#magWell #posName{font-size:7px;line-height:7px;letter-spacing:.06em;font-weight:500;color:#7AB8C4;text-align:center;max-width:69px;white-space:normal} /* r.199: his word in the cyan of his cards (T13.WIRE), no border */")

# 3 · QA — the card measured against the light; the words
rep("    { /* r.198 · POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT (operator 2026-10-11: \"same height as magazines and stop light accept a rounded square\") — in QUAL the pose card is a rounded square of the magazine card's height, between the count and the light, on the same row */",
    "    { /* r.199 · POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT (operator 2026-10-11: \"same height as magazines and stop light accept a rounded square\" · 2026-10-12: \"have it left of fire box\") — in QUAL the position box is a square of the magazine card's height, against the light's left edge (≤ 8 px), clear of the centred count (≥ 4 px), on the same row; the figure box 69×52 with his picture fitted inside, its shape kept */")
rep("const pw=rc('#posWell'), rl=rc('#magReload'), bd=rc('#magWell .body'), sl=rc('#startLight'), im=rc('#posImg'); const cs=getComputedStyle(document.getElementById('posWell'));",
    "const pw=rc('#posWell'), rl=rc('#magReload'), bd=rc('#magWell .body'), sl=rc('#startLight'), pp=rc('#posPic'); const cs=getComputedStyle(document.getElementById('posWell')); const ics=getComputedStyle(document.getElementById('posImg'));")
rep("const between=all&&bd.right<=pw.left+0.5&&pw.right<=sl.left+0.5; const pic=!!im&&Math.abs(im.width-im.height)<=1&&im.width>=44;",
    "const left=all&&bd.right+4<=pw.left+0.5&&pw.right<=sl.left+0.5&&sl.left-pw.right<=8; const pic=!!pp&&Math.round(pp.width)===69&&Math.round(pp.height)===52&&ics.maxWidth==='69px'&&ics.maxHeight==='52px';")
rep("push('POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT', sq&&row&&between&&pic, 'card '+(pw?Math.round(pw.width)+'×'+Math.round(pw.height):'-')+' vs the magazine '+(rl?Math.round(rl.height):'-')+' tall, radius '+cs.borderTopLeftRadius+' · one row '+row+' · between the count and the light '+between+' · the figure '+(im?Math.round(im.width)+'×'+Math.round(im.height):'-')); }",
    "push('POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT', sq&&row&&left&&pic, 'card '+(pw?Math.round(pw.width)+'×'+Math.round(pw.height):'-')+' vs the magazine '+(rl?Math.round(rl.height):'-')+' tall, radius '+cs.borderTopLeftRadius+' · one row '+row+' · against the light, clear of the count '+left+' ('+(all?Math.round(sl.left-pw.right)+' px to the light, '+Math.round(pw.left-bd.right)+' px from the count':'-')+') · the figure box '+(pp?Math.round(pp.width)+'×'+Math.round(pp.height):'-')+', his picture fitted '+pic); }")
rep("const want=['0:STANDING:true','1:PRONE UNSUPPORTED:true','1:PRONE UNSUPPORTED:true','2:PRONE SUPPORTED:true','2:PRONE SUPPORTED:true','3:KNEELING SUPPORTED:true','3:KNEELING SUPPORTED:true','4:STANDING SUPPORTED:true','4:STANDING SUPPORTED:true','2:PRONE SUPPORTED:true','3:KNEELING SUPPORTED:true'].join(' · ');",
    "const want=['0:TACTICAL STANDING:true','1:UNSUPPORTED PRONE:true','1:UNSUPPORTED PRONE:true','2:SUPPORTED PRONE:true','2:SUPPORTED PRONE:true','3:SUPPORTED KNEELING:true','3:SUPPORTED KNEELING:true','4:SUPPORTED STANDING:true','4:SUPPORTED STANDING:true','2:SUPPORTED PRONE:true','3:SUPPORTED KNEELING:true'].join(' · ');")

# 4 · the deck says what it is
rep('overflow:auto">r.198 QUAL · the firing position',
    'overflow:auto">r.199 QUAL · the five positions are your own picture (eXeL AI), cut exactly — the tan figure, the dark rifle, the sandbag, the post, the wall — on a square box against the light\'s left edge, with your words: TACTICAL STANDING, UNSUPPORTED PRONE, SUPPORTED PRONE, SUPPORTED KNEELING, SUPPORTED STANDING. The targets carry the light\'s colours: amber targeted, red approved.\nr.198 QUAL · the firing position')
for dead in ["revision:'0.198'","r0.198</span>","left:calc(50% + 32px)","'STANDING','PRONE UNSUPPORTED'","#magWell #posImg{width:52px"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

# r.199 -> r.200 — the magazine drawn as the operator's OWN r0.178 picture (operator 2026-10-12, verbatim: "fix fucking magazine proportions" ·
# "I even have correct zoomed version ton-use to copy exactly" · "also here is original magazine, ya need to flip around y axis to match correct
# image. Also see right proportion of range (as Grok messed up original layout)" · "why dont the magazines still not look like image 3?").
#  FINDING: the r0.178 code (af6f65e0) draws a three-dimensional box in perspective (a trapezoid and a side plane) at 36×82; his r0.178 picture
#  (docs/asks/img/…shot1.png, image 3) draws a FLAT magazine — the neck with the feed lips, the body tapering with the bend past two thirds, the
#  sloped floor, a window, a grid of four rows and two columns — with ink 17×46 CSS in a 57×71 card. The picture never came from that code.
#  INVARIANT (r.200): both cards draw ONE outline, measured from his picture into the 48×96 viewBox (ink x 7.6–39.7, y 4.6–91.2, ratio 0.37),
#  rendered in the 26×52 box (1:2, never stretched) so the ink is ≈ 17×47 CSS as in his picture; the count magazine lights its 19 round lines
#  inside that body; the RELOAD word's spacing brings the card to his width.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
BASE_REV='199'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.200.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.199')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
def cut(a,b):
    """the unique substring from marker a to marker b (inclusive of a, exclusive of b)"""
    if s.count(a)!=1 or s.count(b)!=1: raise SystemExit(f'REFUSE: markers not unique: {a[:60]!r} / {b[:60]!r}')
    i=s.index(a); j=s.index(b,i); return s[i:j]
RELOAD='<svg viewBox="0 0 48 96" aria-hidden="true"><g fill="none" stroke="#7AB8C4" stroke-linejoin="round" stroke-linecap="round"><path d="M11.5 4.6H26.2L29.5 7.9 30.7 11.7 32 24 32.7 37 34 46 35.2 58 36.5 66 38.5 73 39.7 81 39.1 86.4 16.2 91.2 15.3 89 7.6 11.7V9.8L11.5 7.9Z" stroke-width="1.7"/><path d="M12.2 5.3L29 7.4" stroke-width="1.1"/><rect x="22.4" y="16.2" width="5.8" height="5.1" stroke-width="1.1"/><path d="M9.7 38.3H31.9M11.2 54.4H34.5M12.7 69.8H37.5M14 81.5H38.8M17.1 38.3L21.8 89.9M24.5 38.3L30.7 88.2" stroke-width="1.05"/></g></svg>'
COUNT='<svg viewBox="0 0 48 96" aria-hidden="true"><g id="magFrame" fill="none" stroke="#C9A227" stroke-linejoin="round" stroke-linecap="round"><path d="M11.5 4.6H26.2L29.5 7.9 30.7 11.7 32 24 32.7 37 34 46 35.2 58 36.5 66 38.5 73 39.7 81 39.1 86.4 16.2 91.2 15.3 89 7.6 11.7V9.8L11.5 7.9Z" stroke-width="1.7"/><path d="M12.2 5.3L29 7.4" stroke-width="1.1"/><rect x="22.4" y="16.2" width="5.8" height="5.1" stroke-width="1.1"/><path d="M9.7 38.3H31.9M11.2 54.4H34.5M12.7 69.8H37.5M14 81.5H38.8M17.1 38.3L21.8 89.9M24.5 38.3L30.7 88.2" stroke-width="1.05"/></g><g id="magRibs" fill="none"><path data-rib="0" d="M11.1 33h20.0" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="1" d="M11.4 36h19.8" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="2" d="M11.7 39h19.9" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="3" d="M12.0 42h20.0" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="4" d="M12.3 45h20.2" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="5" d="M12.6 48h20.2" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="6" d="M12.9 51h20.2" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="7" d="M13.2 54h20.2" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="8" d="M13.5 57h20.2" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="9" d="M13.8 60h20.3" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="10" d="M14.1 63h20.5" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="11" d="M14.4 66h20.7" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="12" d="M14.7 69h21.3" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="13" d="M15.0 72h21.8" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="14" d="M15.3 75h22.1" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="15" d="M15.6 78h22.3" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="16" d="M15.9 81h22.4" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="17" d="M16.2 84h21.8" stroke="none" stroke-width="2.15" stroke-linecap="butt"/><path data-rib="18" d="M16.5 87h18.3" stroke="none" stroke-width="2.15" stroke-linecap="butt"/></g></svg>'

# 0 · the deck declares itself
rep("revision:'0.199'","revision:'0.200'",1)
h=s.count("r0.199"); rep("r0.199","r0.200",h)

# 1 · both magazines are his drawing
old=cut('<svg viewBox="0 0 48 96" aria-hidden="true"><g fill="none" stroke="#7AB8C4"','<b>RELOAD</b>')
if 'M16 22l18-4 4 66-22 4z' not in old or not old.endswith('</svg>'): raise SystemExit('REFUSE: the RELOAD drawing is not the r.178 box')
rep(old,RELOAD)
old=cut('<svg viewBox="0 0 48 96" aria-hidden="true"><g id="magFrame"','<b id="magRounds">')
if old.count('data-rib=')!=19 or 'M16 22l18-4 4 66-22 4z' not in old or not old.endswith('</svg>'): raise SystemExit('REFUSE: the count drawing is not the r.178 box with 19 round lines')
rep(old,COUNT)
rep("#magWell b{font-size:11px;line-height:12px;letter-spacing:.14em;font-weight:500;color:#7AB8C4}",
    "#magWell b{font-size:11px;line-height:12px;letter-spacing:.06em;font-weight:500;color:#7AB8C4} /* r.200: the RELOAD card at his width (≈ 59 px, his 57) */")

# 2 · QA — the magazine measured against his picture
rep("    { /* r.157 · QUAL_DONE_SAYS_RESTART", '    { /* r.200 · LIGHT_WORDS_FIT_ONE_WIDTH (review, Thor/Sofia on r.199: "NEXT 10 S" wrapped in the 72-px light and the light grew; the 83-px light sat on the strip\'s line) — the light keeps 72×75 for every word it can show, nothing wraps, and it is the row\'s height like the magazines and the box */\n      const sl=document.getElementById(\'startLight\'), sw=document.getElementById(\'startWord\'), st=document.getElementById(\'startTime\'); const w0=sw.textContent, t0=st.textContent; const app=document.getElementById(\'app\'); const hadR=app.classList.contains(\'range\'); app.classList.add(\'range\');\n      const got=[]; let okAll=true; for(const [a,b] of [[\'\',\'NEXT 10 S\'],[\'TIME\',\'12:34.5\'],[\'CEASE FIRE\',\'COLD\'],[\'ALL DOWN\',\'\'],[\'WAIT\',\'\'],[\'READY\',\'12 S\']]){ sw.textContent=a; st.textContent=b; const r=sl.getBoundingClientRect(); const fit=Math.abs(r.width-72)<=1&&Math.abs(r.height-75)<=1&&st.scrollWidth<=st.clientWidth+1&&sw.scrollWidth<=sw.clientWidth+1; okAll=okAll&&fit; got.push(Math.round(r.width)+\'×\'+Math.round(r.height)+\' at "\'+(a+\' \'+b).trim()+\'"\'); }\n      sw.textContent=w0; st.textContent=t0; if(!hadR) app.classList.remove(\'range\');\n      push(\'LIGHT_WORDS_FIT_ONE_WIDTH\', okAll, got.join(\' · \')+\' · no wrap \'+okAll); }\n'+'    { /* r.200 · MAGAZINE_IS_HIS_DRAWING (operator 2026-10-12: "fix fucking magazine proportions" · "why dont the magazines still not look like image 3?") — both cards draw the magazine of his r0.178 picture: one outline (the neck, the tapered body with the bend, the sloped floor), ink ≈ 17×47 CSS in the 26×52 box (his 17×46), ratio 0.37, the window, four grid rows and two columns, the 19 round lines inside the body */\n      const app=document.getElementById(\'app\'); const hadR=app.classList.contains(\'range\'); app.classList.add(\'range\');\n      const rc=sel=>{ const e=document.querySelector(sel); if(!e) return null; const r=e.getBoundingClientRect(); return (r.width>0&&r.height>0)?r:null; };\n      const p1=document.querySelector(\'#magReload svg path\'), p2=document.querySelector(\'#magFrame path\'); const s1=rc(\'#magReload svg\'), s2=rc(\'#magWell .body svg\');\n      const b1=p1?p1.getBBox():null, b2=p2?p2.getBBox():null; const same=!!p1&&!!p2&&p1.getAttribute(\'d\')===p2.getAttribute(\'d\'); const ratio=b1?b1.width/b1.height:0;\n      const ink=(b1&&s1)?[b1.width*s1.width/48,b1.height*s1.height/96]:[0,0]; const inkOk=Math.abs(ink[0]-17.4)<=1.5&&Math.abs(ink[1]-46.9)<=2&&Math.abs(ratio-0.37)<=0.03&&!!s1&&!!s2&&Math.abs(s1.width-26)<=1&&Math.abs(s1.height-52)<=1&&Math.abs(s2.width-26)<=1;\n      const grid=document.querySelector(\'#magReload svg path:nth-of-type(3)\'); const gd=grid?grid.getAttribute(\'d\'):\'\'; const gridOk=(gd.match(/H/g)||[]).length===4&&(gd.match(/L/g)||[]).length===2; const win=!!document.querySelector(\'#magReload svg rect\')&&!!document.querySelector(\'#magFrame rect\');\n      const ribs=[...document.querySelectorAll(\'#magRibs [data-rib]\')]; const inside=ribs.length===19&&!!b2&&ribs.every(r=>{ const b=r.getBBox(); return b.x>=b2.x&&b.x+b.width<=b2.x+b2.width&&b.y>=b2.y&&b.y+b.height<=b2.y+b2.height; });\n      if(!hadR) app.classList.remove(\'range\');\n      push(\'MAGAZINE_IS_HIS_DRAWING\', same&&inkOk&&gridOk&&win&&inside, \'outline \'+(b1?b1.width.toFixed(1)+\'×\'+b1.height.toFixed(1):\'-\')+\' of 48×96 · ratio \'+ratio.toFixed(2)+\' · ink \'+ink[0].toFixed(1)+\'×\'+ink[1].toFixed(1)+\' CSS in a \'+(s1?Math.round(s1.width)+\'×\'+Math.round(s1.height):\'-\')+\' box · both cards one outline \'+same+\' · grid 4 rows 2 columns \'+gridOk+\' · window \'+win+\' · 19 round lines inside the body \'+inside); }\n'+"    { /* r.157 · QUAL_DONE_SAYS_RESTART")


# 2b · the light (review of r.199): the row's height like the magazines and the box, one width, no word wraps; the box clears the count on narrow phones
rep("#app.range #startLight{display:flex;width:72px;box-sizing:border-box;padding:4px 3px}",
    "#app.range #startLight{display:flex;width:72px;height:75px;box-sizing:border-box;padding:2px 3px;gap:2px;justify-content:center}")
rep("#startLight .lamps{display:flex;flex-direction:column;gap:5px}","#startLight .lamps{display:flex;flex-direction:column;gap:4px}")
rep("#startLight i{width:14px;height:14px;border-radius:50%;border:1px solid #1C2A3A;opacity:.35}","#startLight i{width:12px;height:12px;border-radius:50%;border:1px solid #1C2A3A;opacity:.35}")
rep("#startLight b{font-size:9px;letter-spacing:.06em;font-weight:500;color:#E8D5B0}","#startLight b{font-size:9px;line-height:10px;letter-spacing:.06em;font-weight:500;color:#E8D5B0}")
rep("#startLight #startTime{font-size:11px;letter-spacing:.06em;font-weight:600;color:#E8D5B0;font-variant-numeric:tabular-nums;min-height:15px}",
    "#startLight #startTime{font-size:11px;letter-spacing:0;white-space:nowrap;font-weight:600;color:#E8D5B0;font-variant-numeric:tabular-nums;min-height:13px} /* r.200: \"NEXT 10 S\" and the clock fit the 72-px light, nothing wraps */")
rep("#app.range.qual #magWell #posWell{display:flex}",
    "#app.range.qual #magWell #posWell{display:flex}\n@media (max-width:367px){#app.range #startLight{width:64px} #magWell #posWell{right:68px} #startLight #startTime{font-size:10px}} /* r.200: on a phone narrower than 368 px the light gives 8 px so the box still clears the centred count */")
rep("1 STANDING (the 50 R) · 2–5 PRONE UNSUPPORTED (MAG 1) · 6–10 PRONE SUPPORTED (MAG 2) · 11–14 KNEELING SUPPORTED (MAG 3) · 15–18 STANDING SUPPORTED (MAG 4)",
    "1 TACTICAL STANDING (the 50 R) · 2–5 UNSUPPORTED PRONE (MAG 1) · 6–10 SUPPORTED PRONE (MAG 2) · 11–14 SUPPORTED KNEELING (MAG 3) · 15–18 SUPPORTED STANDING (MAG 4)")
rep("the card follows the Table VI engagement: 1 STANDING · 2–5 PRONE UNSUPPORTED · 6–10 PRONE SUPPORTED · 11–14 KNEELING SUPPORTED · 15–18 STANDING SUPPORTED",
    "the card follows the Table VI engagement: 1 TACTICAL STANDING · 2–5 UNSUPPORTED PRONE · 6–10 SUPPORTED PRONE · 11–14 SUPPORTED KNEELING · 15–18 SUPPORTED STANDING")
rep("const left=all&&bd.right+4<=pw.left+0.5&&pw.right<=sl.left+0.5&&sl.left-pw.right<=8;",
    "const left=all&&bd.right+4<=pw.left+0.5&&pw.right<=sl.left+0.5&&sl.left-pw.right<=8; const lit=all&&Math.abs(sl.height-pw.height)<=1;")
rep("push('POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT', sq&&row&&left&&pic,","push('POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT', sq&&row&&left&&pic&&lit,")
rep("+', his picture fitted '+pic); }","+', his picture fitted '+pic+' · the light '+(sl?Math.round(sl.height):'-')+' tall '+lit); }")

# 3 · the deck says what it is
rep('overflow:auto">r.199 QUAL · the five positions',
    'overflow:auto">r.200 THE MAGAZINE · drawn as your r0.178 picture, both cards: the neck with the feed lips, the body tapering with the bend, the sloped floor, the window, the grid of four rows and two columns; the round lines inside the body; the RELOAD card at your width. The code of r0.178 drew a box in perspective — your picture never came from it; the picture is the master.\nr.199 QUAL · the five positions')
for dead in ["revision:'0.199'","letter-spacing:.06em;font-weight:600;color:#E8D5B0;font-variant-numeric","r0.199</span>","M16 22l18-4 4 66-22 4z","letter-spacing:.14em;font-weight:500;color:#7AB8C4}"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
if s.count('d="'+'M11.5 4.6H26.2L29.5 7.9 30.7 11.7 32 24 32.7 37 34 46 35.2 58 36.5 66 38.5 73 39.7 81 39.1 86.4 16.2 91.2 15.3 89 7.6 11.7V9.8L11.5 7.9Z'+'"')!=2: raise SystemExit('REFUSE: the outline must appear exactly twice')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

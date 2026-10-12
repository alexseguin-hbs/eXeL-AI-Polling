# r.202 -> r.203 — THE ROUNDS AS IN HIS PICTURE (operator 2026-10-12, on the LIVE r.202, verbatim: "rounds mist be in magazine", then his
#  reference shot40 — the r.200 preview, this session's render of the magazine drawn from his r0.178 picture, which he sent back as his
#  reference: his choice, the session's render — the two magazines at 10×, the counter at 30 with nineteen distinct bars INSIDE the walls,
#  OVER the grid (the gold shows in the gaps), below the window).
#  CAUSE: r.202's fill was cut from his r0.178 phone photo at 29 (shot30): twenty-eight thin lines from just under the body's top line, running
#  through the window — at the card's size a hatch, on the phone a solid block over the window; the rounds did not read as inside the magazine.
#  The paint order (fill over frame) changed almost no pixel the eye can see (the Spiral round's pixel diff) — it was not the cause.
#  INVARIANT (r.203): the counter's rounds are his reference's bars — distinct, inside the walls, over the grid, below the window — one bar
#  per round (the lowest r of his nineteen; nineteen to thirty is the full picture); the frame is the uncovered magazine (walls, window, the
#  full grid: the RELOAD drawing in gold) under the bars; the RELOAD ink and the counter's frame and fill are rasters cut from shot40, pinned,
#  never redrawn; the cards, the light and the box of r.202 unchanged.
import hashlib,os,re,base64,json
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
MAG=os.environ.get('MAG_DIR') or os.path.join(DECK,'..','magazine')
BASE_REV='202'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.203.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.202')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
def uri(name):
    b=open(os.path.join(MAG,name),'rb').read()
    if len(b)>20000 or b[:8]!=b'\x89PNG\r\n\x1a\n': raise SystemExit('REFUSE: '+name+' is not a small PNG')
    return 'data:image/png;base64,'+base64.b64encode(b).decode('ascii')
PINS={'reload-ink.png': '32f9dfac91d47cefde285768194b5f716608d03cf8c4c0aa56cbcc725af1b720', 'count-frame.png': 'b476d95135760e2ff9368ae429b854166c42d90f6c278082d4f2fa7d857c4c9d', 'count-fill-green.png': '0e2cd4ef5208e8cc946131ac1b889a97b491100a2423073c9504d9744148aba9', 'count-fill-amber.png': 'f23d3aa0c5fcaff129ecfffe2fa1bf2414669b994fff45ea760bb04979fcf2d4', 'count-fill-red.png': 'aa51381f6a176c5205c7df712876c8baaca253dbaddbf2a29e63b7203016c47a', 'BARS.json': '59db64fcccaa86b3316bbda4745c12aafd61fa6cafaf271b6b0424b706f9cb4a'}   # the six sha256 of the cut, as literals: a replay that finds other bytes in ../magazine refuses
for name,h in PINS.items():
    if hashlib.sha256(open(os.path.join(MAG,name),'rb').read()).hexdigest()!=h: raise SystemExit('REFUSE: '+name+' is not the pinned cut')
if open(os.path.join(MAG,'MAGAZINE.sha256'),encoding='utf-8').read()!=''.join(f'{h}  {n}\n' for n,h in PINS.items()): raise SystemExit('REFUSE: MAGAZINE.sha256 is not the pinned record')
BARS=json.load(open(os.path.join(MAG,'BARS.json'),encoding='utf-8'))
if BARS['bars']!=19 or len(BARS['tops_pct'])!=19: raise SystemExit('REFUSE: BARS.json is not his nineteen bars')

# 0 · the deck declares itself
rep("revision:'0.202'","revision:'0.203'",1)
rep("r0.202","r0.203",1)

# 1 · his rasters from shot40 in place of the shot30/31 cut — the same five names, the same 72×192 canvas, the same embeds
m=re.search(r"const MAG_PNG=\{ink:'(data:image/png;base64,[A-Za-z0-9+/=]+)',frame:'(data:image/png;base64,[A-Za-z0-9+/=]+)',green:'(data:image/png;base64,[A-Za-z0-9+/=]+)',amber:'(data:image/png;base64,[A-Za-z0-9+/=]+)',red:'(data:image/png;base64,[A-Za-z0-9+/=]+)'\};",s)
if not m: raise SystemExit('REFUSE: MAG_PNG of r.202 not found')
old={'ink':m.group(1),'frame':m.group(2),'green':m.group(3),'amber':m.group(4),'red':m.group(5)}
new={'ink':uri('reload-ink.png'),'frame':uri('count-frame.png'),'green':uri('count-fill-green.png'),'amber':uri('count-fill-amber.png'),'red':uri('count-fill-red.png')}
for k,c in (('ink',2),('frame',2),('green',2),('amber',1),('red',1)): rep(old[k],new[k],c)   # MAG_PNG + the at-rest <img> for ink, frame and the green fill

# 2 · where his bars sit: one bar per round
rep("const MAG_FILL_TOP=11.3, MAG_FILL_BOTTOM=92.0;","const MAG_FILL_TOP=%s, MAG_FILL_BOTTOM=%s, MAG_BARS=%d, MAG_BAR_TOPS=%s;"%(BARS['tops_pct'][0],BARS['bottom_pct'],BARS['bars'],json.dumps(BARS['tops_pct'])))
rep("/* r.202: where his green fill sits in the frame's canvas (% of its height), measured from his picture at 29 */","/* r.203: his nineteen bars (shot40) in the frame's canvas — the top of each bar and the foot, % of its height, measured from the cut (BARS.json) */")
rep("const frac=Math.min(1,r/29); const cut=MAG_FILL_TOP+(MAG_FILL_BOTTOM-MAG_FILL_TOP)*(1-frac);","const cut=r>=MAG_BARS?MAG_BAR_TOPS[0]:(r<=0?MAG_FILL_BOTTOM:MAG_BAR_TOPS[MAG_BARS-r]);")
rep("/* r.202: his fill, one line per round at any cap (his picture at 29 is the full fill: 3 rounds show three lines in a 10-round magazine as in a 30), in his colour; the frame raster never changes */","/* r.203: his bars (shot40), one bar per round at any cap — the lowest r of his nineteen; nineteen to thirty is the full picture (3 rounds show three bars in a 10-round magazine as in a 30) — in his colour; the frame raster never changes; the bars are painted over its grid */")

# 3 · the paint order: the bars over the grid (as in shot40) — the r.202 markup order, kept
rep("#magWell #magFill{clip-path:inset(var(--cut,11.3%) 0 0 0)}",
    "#magWell #magFill{clip-path:inset(var(--cut,32.0%) 0 0 0)} /* r.203: the bars are painted OVER the frame's grid, inside the walls, as in his drawing (shot40) — the fill follows the frame in the markup, nothing raises the frame */")

# 4 · the gates re-stated: MAGAZINE_KEEPS_ITS_FRAME at his bars; BARS_OVER_THE_GRID; ROUNDS_ARE_INSIDE_THE_MAGAZINE (pixels, deferred)
rep("const cuts=Math.abs(a30.cut-MAG_FILL_TOP)<=0.5&&a3.cut>a12.cut&&a12.cut>a20.cut&&Math.abs(a3.cut-(MAG_FILL_TOP+(MAG_FILL_BOTTOM-MAG_FILL_TOP)*(1-3/29)))<=0.5; const anyCap=Math.abs(q3.cut-a3.cut)<=0.05&&Math.abs(q10.cut-(MAG_FILL_TOP+(MAG_FILL_BOTTOM-MAG_FILL_TOP)*(1-10/29)))<=0.5&&",
    "const cuts=Math.abs(a30.cut-MAG_BAR_TOPS[0])<=0.5&&a3.cut>a12.cut&&a12.cut>a20.cut&&Math.abs(a3.cut-MAG_BAR_TOPS[MAG_BARS-3])<=0.5; const anyCap=Math.abs(q3.cut-a3.cut)<=0.05&&Math.abs(q10.cut-MAG_BAR_TOPS[MAG_BARS-10])<=0.5&&")
rep("% · at 30 '+a30.cut.toFixed(1)+'% (his 29 look) · one line per round in a 10-round magazine '","% · at 30 '+a30.cut.toFixed(1)+'% (his 30 look, nineteen bars) · one bar per round in a 10-round magazine '")
rep("/* r.202 · MAGAZINE_KEEPS_ITS_FRAME — the frame raster never changes with the count; the fill raster is clipped from the top one line per round at any cap (his picture at 29 is the full fill; 3 rounds show three lines in QUAL's 10-round magazines as in a 30) and recoloured by his rule (green ≥ 20 · amber 6–19 · red ≤ 5); the number carries the same colour */",
    "/* r.202/r.203 · MAGAZINE_KEEPS_ITS_FRAME — the frame raster never changes with the count; the fill raster (his nineteen bars, shot40) is clipped from the top one bar per round at any cap (3 rounds show three bars in QUAL's 10-round magazines as in a 30; nineteen to thirty is the full picture) and recoloured by his rule (green ≥ 20 · amber 6–19 · red ≤ 5); the number carries the same colour */")
ROW="""    { /* r.203 · BARS_OVER_THE_GRID (operator 2026-10-12: "rounds mist be in magazine" · shot40: the bars sit over the grid, the gold shows in the gaps) — the fill raster is painted over the frame raster: both absolute siblings in one 18×48 box, the fill after the frame, nothing raising the frame above it */
      const app=document.getElementById('app'); const hadR=app.classList.contains('range'); app.classList.add('range');
      try{ const fr=document.getElementById('magFrame'), fi=document.getElementById('magFill'); const csF=fr?getComputedStyle(fr):null, csI=fi?getComputedStyle(fi):null;
        const z=v=>{ const n=parseInt(v,10); return isNaN(n)?0:n; }; const order=!!fr&&!!fi&&fr.parentNode===fi.parentNode&&csF.position==='absolute'&&csI.position==='absolute'&&(fr.compareDocumentPosition(fi)&Node.DOCUMENT_POSITION_FOLLOWING)!==0&&z(csI.zIndex)>=z(csF.zIndex);
        const a=fr?fr.getBoundingClientRect():null, b=fi?fi.getBoundingClientRect():null; const same=!!a&&!!b&&a.width>0&&a.height>0&&Math.abs(a.left-b.left)<=0.5&&Math.abs(a.top-b.top)<=0.5&&Math.abs(a.width-b.width)<=0.5&&Math.abs(a.height-b.height)<=0.5;
        push('BARS_OVER_THE_GRID', order&&same, 'the fill painted over the frame '+order+' (fill z '+(csI?csI.zIndex:'-')+' · frame z '+(csF?csF.zIndex:'-')+') · one box '+same+(a?' '+a.width.toFixed(1)+'×'+a.height.toFixed(1):'')); }
      finally{ if(!hadR) app.classList.remove('range'); } }
"""
rep("    { /* r.157 · QUAL_DONE_SAYS_RESTART", ROW+"    { /* r.157 · QUAL_DONE_SAYS_RESTART")
PIX="""  /* r.203 deferred row · ROUNDS_ARE_INSIDE_THE_MAGAZINE (operator 2026-10-12: "rounds mist be in magazine" · shot40) — the PIXELS, not the CSS: the frame, fill and RELOAD rasters are decoded to a canvas; every opaque fill row lies between the frame's walls; the bars begin below the window (MAG_FILL_TOP) and end at the foot; there are MAG_BARS distinct bars with a gap between each; the frame's grid is whole (its interior rows at least 95 % of the RELOAD ink's — a frame cut from a covered magazine would carry holes where the bars were). Decoding is asynchronous, so the row decides when the pictures have loaded. */
  setTimeout(()=>{ if(state.outcomes!==rows) return; const im=src=>new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>rej(new Error('no decode')); i.src=src; });
    const done=(ok,note)=>{ if(state.outcomes!==rows) return; /* a later run owns the rows now */ rows.push({id:'ROUNDS_ARE_INSIDE_THE_MAGAZINE',ok,note}); state.qa={pass:rows.filter(x=>x.ok).length,total:rows.length,rev:BUILD.revision,t:Date.now(),known:(state.qa&&state.qa.known)}; const qn=document.getElementById('qaOps'); if(qn) qn.textContent=state.qa.pass+'/'+state.qa.total; const qo=document.getElementById('qaOut'); if(qo) qo.textContent+=(ok?'OK ':'NO ')+'ROUNDS_ARE_INSIDE_THE_MAGAZINE '+note+'\\n'; };
    Promise.all([im(MAG_PNG.frame),im(MAG_PNG.green),im(MAG_PNG.ink)]).then(([f,g,k])=>{ const W=f.naturalWidth,H=f.naturalHeight; if(W!==72||H!==192||g.naturalWidth!==72||g.naturalHeight!==192||k.naturalWidth!==72||k.naturalHeight!==192){ done(false,'rasters '+W+'×'+H+' / '+g.naturalWidth+'×'+g.naturalHeight+' / '+k.naturalWidth+'×'+k.naturalHeight); return; }
      const px=img=>{ const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'); x.drawImage(img,0,0); return x.getImageData(0,0,W,H).data; }; const F=px(f), G=px(g), K=px(k);
      const span=(d,y)=>{ let l=-1,r=-1; for(let i=0;i<W;i++){ if(d[(y*W+i)*4+3]>96){ if(l<0) l=i; r=i; } } return [l,r]; };
      let inside=true, first=-1, last=-1, bars=0, on=false, fillRows=0; for(let y=0;y<H;y++){ const [gl,gr]=span(G,y); const has=gl>=0; if(has){ fillRows++; if(first<0) first=y; last=y; const [fl,frr]=span(F,y); if(!(fl>=0&&gl>fl&&gr<frr)) inside=false; } if(has&&!on){ on=true; bars++; } else if(!has&&on) on=false; }
      const interior=(d,y)=>{ const [l,r]=span(d,y); if(l<0) return 0; let c=0; for(let x=l+4;x<r-3;x++) if(d[(y*W+x)*4+3]>96) c++; return c; }; let gridF=0, gridK=0; for(let y=70;y<180;y++){ if(interior(F,y)>0) gridF++; if(interior(K,y)>0) gridK++; } const whole=gridK>0&&gridF>=0.95*gridK;
      const top=100*first/H, bot=100*(last+1)/H; const placed=Math.abs(top-MAG_FILL_TOP)<=1.5&&Math.abs(bot-MAG_FILL_BOTTOM)<=1.5&&top>25; const ok=inside&&bars===MAG_BARS&&placed&&fillRows>0&&whole;
      done(ok,'every fill row between the walls '+inside+' · '+bars+' distinct bars (his '+MAG_BARS+') '+(bars===MAG_BARS)+' · the bars from '+top.toFixed(1)+'% to '+bot.toFixed(1)+'% of the body, below the window '+placed+' · the grid whole ('+gridF+' of '+gridK+' rows) '+whole); }).catch(e=>done(false,'threw '+String(e).slice(0,100))); }, 1200);
"""
rep("  /* r.150 deferred row (Enlil, MoT 2 #3):", PIX+"  /* r.150 deferred row (Enlil, MoT 2 #3):")

# 5 · the deck says what it is
rep('overflow:auto">r.202 THE ROW IS YOUR PICTURES · RELOAD and the counter are rasters cut from your images, nothing redrawn; the cards at your proportions; the counter\'s fill clipped by the rounds left, green at 20 and above, amber 6 to 19, red 5 and under, the frame always gold;',
    'overflow:auto">r.203 THE ROUNDS AS IN YOUR PICTURE · the counter\'s rounds are the nineteen bars of your reference, inside the walls, over the grid, below the window, one bar per round; RELOAD and the counter are rasters cut from that picture, nothing redrawn; the cards at your proportions; green at 20 and above, amber 6 to 19, red 5 and under, the frame always gold;')
for dead in ["revision:'0.202'",'overflow:auto">r.202','r0.202',"r/29","(1-3/29)","MAG_FILL_TOP=11.3","#magFrame{z-index","FRAME_OVER_THE_ROUNDS","#magWell svg{",'<svg viewBox="0 0 48 96"',"@media (max-width:367px)","const cascade"]+list(old.values()):
    if dead in s: raise SystemExit(f'REFUSE: stale {dead[:60]}')
for need in ["/* r.203 · BARS_OVER_THE_GRID","ROUNDS_ARE_INSIDE_THE_MAGAZINE (operator","MAG_BAR_TOPS=["]:
    if s.count(need)!=1: raise SystemExit('REFUSE: not in once: '+need)
for k in new:
    if s.count(new[k])!=(2 if k in ('ink','frame','green') else 1): raise SystemExit('REFUSE: embed count off for '+k)
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

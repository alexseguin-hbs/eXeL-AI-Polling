# r.151 -> r.152 — THE FULL-SCREEN CONTROL IS AN ICON, NOT A WORD (operator 2026-09-24, docs/asks/2026-09-24_drone_popups_box_maximize.md:
# "Add maximize from Mission Planning in upper right versus words to indicate Full Screen Mode (and minimize arrows instead of Exit)").
# The deck carried two <button>FULL</button> controls (btnFullBar in the top .bar, btnFull in #magBar) whose toggle wrote the WORDS
# 'EXIT'/'FULL'. The operator asked for the Mission-Planning affordance the rest of the app already uses — the ChartFrame convention in
# frontend/app/SoI-2525/page.tsx (`portfolioMax ? "⤡" : "⤢"`) and Security-2525 Mission Planning's Maximize2/Minimize2: maximize ⤢ to
# enter full screen, minimize ⤡ to exit. Scope is strict — ONLY the label glyphs, the two buttons' titles, and the top-bar button's
# position/size change. The fullscreen BEHAVIOUR (setFull → requestFullscreen/exitFullscreen, #app.full hiding the words, keeping the
# sticks · TARGET · APPROVE · FIRE · RELOAD) is untouched. A new boot-QA row FULLSCREEN_IS_AN_ICON proves it end to end in the served
# bytes: off → ⤢/⤢, full → ⤡/⤡, never the word. Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.151.html'); DST=os.path.join(DECK,'drone-2525_r.152.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── 1 · the top-bar full-screen button becomes the maximize icon ⤢ (title kept descriptive; aria-label for the icon) ──
rep('<button id="btnFullBar" type="button" title="full screen">FULL</button>',
    '<button id="btnFullBar" type="button" title="full screen" aria-label="full screen">⤢</button>')

# ── 2 · the #magBar full-screen button becomes the maximize icon ⤢ (title now the operator's words; aria-label for the icon) ──
rep('<button id="btnFull" type="button" title="hide the words, keep the controls">FULL</button>',
    '<button id="btnFull" type="button" title="full screen" aria-label="full screen">⤢</button>')

# ── 3 · the toggle writes the maximize/minimize GLYPHS (never the words), and keeps title + aria-label descriptive ──
rep("['btnFull','btnFullBar'].forEach(id=>{ const b=document.getElementById(id); if(b) b.textContent=on?'EXIT':'FULL'; });",
    "['btnFull','btnFullBar'].forEach(id=>{ const b=document.getElementById(id); if(b){ b.textContent=on?'⤡':'⤢'; b.title=on?'exit full screen':'full screen'; b.setAttribute('aria-label',on?'exit full screen':'full screen'); } }); /* r.152: the full-screen control is the Mission-Planning maximize (⤢) / minimize (⤡) icon, never the word EXIT/FULL */")

# ── 4 · the top-bar maximize icon sits at the UPPER RIGHT (order last; the existing flex:1 spacer right-aligns it without disturbing the
#        CONTROLS/DATA/MORE dropdowns) at a comfortable tap size ──
rep(".bar b{color:var(--t)}",
    ".bar b{color:var(--t)}\n#btnFullBar{order:9;margin-left:8px;font-size:16px;line-height:1;padding:2px 12px} /* r.152: the maximize icon at the top-bar upper-right — order last so the flex spacer right-aligns it past the dropdowns, bumped to a comfortable tap size */")

# ── 5 · the #magBar maximize icon reads at a comfortable size (its 10 px would render the glyph too small) ──
rep("#magBar #btnReload{border-color:#C9A227;color:#C9A227}",
    "#magBar #btnReload{border-color:#C9A227;color:#C9A227}\n#magBar #btnFull{font-size:15px;line-height:1} /* r.152: the maximize/minimize glyph large enough to tap */")

# ── 6 · the boot-QA row that proves the control is an icon, both toggle states, in the served bytes ──
rep("    { const hp=document.getElementById('playHud'); const cs=hp?getComputedStyle(hp):null; push('HUD_SCORE_WRAPS',",
    "    { /* r.152 · FULLSCREEN IS AN ICON — the top-bar and magBar full-screen controls carry the maximize/minimize glyph, never the word. */\n      const bb=document.getElementById('btnFullBar'), bm=document.getElementById('btnFull'); const f0=!!document.getElementById('app').classList.contains('full');\n      setFull(false); const offBar=bb?String(bb.textContent).trim():'', offMag=bm?String(bm.textContent).trim():'';\n      setFull(true); const onBar=bb?String(bb.textContent).trim():'', onMag=bm?String(bm.textContent).trim():'';\n      setFull(f0);\n      push('FULLSCREEN_IS_AN_ICON', offBar==='⤢'&&offMag==='⤢'&&onBar==='⤡'&&onMag==='⤡', 'the full-screen control is the maximize/minimize icon, never the word: off → ⤢/⤢ ('+offBar+'/'+offMag+'), full → ⤡/⤡ ('+onBar+'/'+onMag+')'); }\n    { const hp=document.getElementById('playHud'); const cs=hp?getComputedStyle(hp):null; push('HUD_SCORE_WRAPS',")

# ── 7 · the deck declares itself r.152 (BUILD const + the header span + the carried-note strings) ──
c=s.count("revision:'0.151'"); rep("revision:'0.151'","revision:'0.152'",c)
h=s.count("r0.151"); rep("r0.151","r0.152",h)

for dead in ['<button id="btnFullBar" type="button" title="full screen">FULL</button>',
             '<button id="btnFull" type="button" title="hide the words, keep the controls">FULL</button>',
             "if(b) b.textContent=on?'EXIT':'FULL';",
             "revision:'0.151'","r0.151"]:
    if dead in s: raise SystemExit(f'REFUSE: stale symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)

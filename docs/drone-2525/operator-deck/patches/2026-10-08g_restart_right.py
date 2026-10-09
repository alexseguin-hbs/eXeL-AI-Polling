# 2026-10-08 (operator): on the range's second top row RESTART moves to the right end with a restart icon before its word
# ("↻ RESTART"); TRAIN UP and LANE 21 stay on the left. The icon is an inline SVG (aria-hidden), so the button's text stays "RESTART".
# The deck's own QA (RANGE_MENU_ON_SCREEN) now expects the row order mode · lane · restart.
# Run from the repo root AFTER 2026-10-08_qr_berms_mags_range.py, ...b, ...c, ...d (order among ...e/...f/...g is free):
#   python3 docs/drone-2525/operator-deck/patches/2026-10-08g_restart_right.py
import os
ROOT=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'frontend','public','drone-2525','play.html')
s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    c=s.count(a)
    if c!=1: raise SystemExit(f'REFUSE: expected 1 of {a[:90]!r}, found {c}')
    s=s.replace(a,b)
rep("#app.range #rngMode{order:1}#app.range #btnRangeReset{order:2}#app.range #lanePick{order:3}",
    "#app.range #rngMode{order:1}#app.range #lanePick{order:2}#app.range #btnRangeReset{order:3;margin-left:auto;display:inline-flex;align-items:center;gap:6px} /* eXeL 2026-10-08g: RESTART at the right end */")
rep('<button type="button" id="btnRangeReset" title="start this mode again">RESTART</button>',
    '<button type="button" id="btnRangeReset" title="start this mode again"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;flex:none"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>RESTART</button>')
rep("const on=['rngMode','btnRangeReset','lanePick'].map(vis);",
    "const on=['rngMode','lanePick','btnRangeReset'].map(vis); /* eXeL 2026-10-08g: RESTART sits at the right end */")
open(p,'w',encoding='utf-8').write(s)
print('applied: RESTART at the right end of the range row, with a restart icon')

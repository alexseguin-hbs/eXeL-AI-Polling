# 2026-10-08 (operator): every select step gets a BACK button — BACK on the left, NEXT moved to the right, same button style.
# SELECT CITY BACK -> the start/TODAY screen; SELECT CRAFT BACK -> SELECT CITY; SELECT RANGE BACK -> SELECT CRAFT.
# "The Range" stays directly below the SELECT CITY row. The waiting room already has BACK TO SETUP.
# Run from the repo root AFTER 2026-10-08_qr_berms_mags_range.py and 2026-10-08b_select_city_range.py:
#   python3 docs/drone-2525/operator-deck/patches/2026-10-08c_select_back_next.py
import os
ROOT=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'frontend','public','drone-2525','play.html')
s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    c=s.count(a)
    if c!=1: raise SystemExit(f'REFUSE: expected 1 of {a[:90]!r}, found {c}')
    s=s.replace(a,b)
B=lambda t:'<button type="button" class="navBack" onclick="window.showScr&&window.showScr(\'%s\')">BACK</button>'%t
rep('''    <p class="fine">Only CAPITAL plays in 1.1. Others qualify later.</p>\n    <button type="button" data-next="sc2">NEXT</button>\n''',
    '''    <p class="fine">Only CAPITAL plays in 1.1. Others qualify later.</p>\n    <div class="navrow">'''+B('sc0')+'''<button type="button" data-next="sc2">NEXT</button></div>\n''')
rep('''      \n    </div>\n    <button type="button" data-next="sc3">NEXT</button>\n''',
    '''      \n    </div>\n    <div class="navrow">'''+B('sc1')+'''<button type="button" data-next="sc3">NEXT</button></div>\n''')
rep('''    <button type="button" id="btnPractice">PRACTICE · NO ROOM · CH0 ONLY</button>\n''',
    '''    <button type="button" id="btnPractice">PRACTICE · NO ROOM · CH0 ONLY</button>\n    <div class="navrow">'''+B('sc2')+'''</div>\n''')
rep('#intro button{margin:6px 6px 0 0;padding:10px 14px;background:#000;color:#3DCC8A;border:1px solid #3DCC8A;letter-spacing:.08em}',
    '#intro button{margin:6px 6px 0 0;padding:10px 14px;background:#000;color:#3DCC8A;border:1px solid #3DCC8A;letter-spacing:.08em}\n#intro .navrow{display:flex;justify-content:space-between;align-items:center;max-width:560px} /* eXeL 2026-10-08 (operator): BACK left, NEXT right on every select step */\n#intro .navrow button:last-child:not(:first-child){margin-right:0}')
open(p,'w',encoding='utf-8').write(s)
print('applied: BACK / NEXT nav rows on SELECT CITY, SELECT CRAFT, SELECT RANGE')

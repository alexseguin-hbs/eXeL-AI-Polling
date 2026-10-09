# 2026-10-08 (operator): on SELECT CITY, a "The Range" button directly below NEXT -> LANE 21 · TURRET · TRAIN UP (same deep link as the QR
# and the start screen), so anyone who picked the wrong option jumps straight to the range.
# Run from the repo root AFTER 2026-10-08_qr_berms_mags_range.py:
#   python3 docs/drone-2525/operator-deck/patches/2026-10-08b_select_city_range.py
import os
ROOT=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'frontend','public','drone-2525','play.html')
s=open(p,encoding='utf-8').read()
a='Only CAPITAL plays in 1.1. Others qualify later.</p>\n    <button type="button" data-next="sc2">NEXT</button>\n'
c=s.count(a)
if c!=1: raise SystemExit(f'REFUSE: expected 1 SELECT CITY NEXT anchor, found {c}')
s=s.replace(a,a+"    <div><button type=\"button\" id=\"btnTheRange2\" onclick=\"location.href='/drone-2525/play.html?range=21&amp;role=turret&amp;mode=train-up'\">The Range</button></div>\n")
open(p,'w',encoding='utf-8').write(s)
print('applied: SELECT CITY -> The Range')

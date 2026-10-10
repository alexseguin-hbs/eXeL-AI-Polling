# 2026-10-10 (operator, 3:41 PM CT): main moved to r0.178 (magazine well, live lane QR sheet) without the 2026-10-08 patches a-h, so the
# live range lost: the Divinity-format "The Range" QR modal, the deep link (?range=21&role=turret&mode=train-up), the intro "The Range"
# button, BACK/NEXT, the magazines on the start light's row (RELOAD left, rounds in the CENTRE), the clear centre / reticle-following
# cues / status above the icons, RESTART at the right with its icon, and the TARGET -> APPROVE -> FIRE cycle in QUAL 40 and TRAIN DOWN.
# This script re-applies a-h ON TOP OF r0.178 without removing r0.178's work:
#   * r0.178's header QR button stays; it now opens "The Range" modal (r0.178's lane sheet and its code are kept, unused by the button).
#   * r0.178's side-by-side #magWell stays in the page and keeps updating, but is not shown on the range: the operator asked for the
#     wireframe magazines on the start light's row — RELOAD at the left, the round count in the centre of the screen width.
#   * Rounds colours (operator 2026-10-10, overrides 2026-10-08d and r0.178): 20-30 green, 5-19 amber, 0-4 red — fill and number.
# Run from the repo root on main's r0.178 play.html (needs the sibling 2026-10-08*.py patchers, node and the frontend "qrcode" package,
# and frontend/components/drone-2525/qr-mini.tsx from the drone-2525-qr branch):
#   python3 docs/drone-2525/operator-deck/patches/2026-10-10a_r178_restore.py
import os
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.normpath(os.path.join(HERE,'..','..','..','..'))
p=os.path.join(ROOT,'frontend','public','drone-2525','play.html')
if not os.path.exists(os.path.join(ROOT,'frontend','components','drone-2525','qr-mini.tsx')): raise SystemExit('REFUSE: frontend/components/drone-2525/qr-mini.tsx is missing (take it from drone-2525-qr)')
if open(p,encoding='utf-8').read().count('<b>eXeL</b><span>r0.178</span><button id="btnQr"')!=1: raise SystemExit('REFUSE: not the r0.178 deck')
def run(name, edit=None):
    src=open(os.path.join(HERE,name),encoding='utf-8').read()
    if edit: src=edit(src)
    exec(compile(src,os.path.join(HERE,name),'exec'),{'__file__':os.path.join(HERE,name),'__name__':'__main__'})
# patch a: everything except its own header QR button — r0.178 already has one in that place
HDR="    ('<b>eXeL</b><span>r0.166</span><button id=\"btnFullBar\"', '<b>eXeL</b><span>r0.166</span>'+QR_BTN+'<button id=\"btnFullBar\"'),\n"
TSX="patch(os.path.join(FE,'components','drone-2525','command-ux1.tsx'), ["
def skip_hdr(src):
    if src.count(HDR)!=1: raise SystemExit('REFUSE: patch a header line not found')
    src=src.replace(HDR,'')
    cux=open(os.path.join(ROOT,'frontend','components','drone-2525','command-ux1.tsx'),encoding='utf-8').read()
    if 'DroneQrMini' in cux: # the /drone-2525/ shell already mounts the mini QR (e.g. a tree merged with fitness-deploy) - do not mount it twice
        if src.count(TSX)!=1: raise SystemExit('REFUSE: patch a command-ux1 block not found')
        src=src.replace(TSX,'(lambda *a: None)(os.path.join(FE,\'components\',\'drone-2525\',\'command-ux1.tsx\'), [')
    return src
run('2026-10-08_qr_berms_mags_range.py', skip_hdr)
for n in ['2026-10-08b_select_city_range.py','2026-10-08c_select_back_next.py','2026-10-08d_lane_signs.py','2026-10-08e_qr_style.py',
          '2026-10-08f_lane_signs_restore.py','2026-10-08g_restart_right.py','2026-10-08h_qual40_three_step.py']: run(n)
s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    c=s.count(a)
    if c!=1: raise SystemExit(f'REFUSE: expected 1 of {a[:90]!r}, found {c}')
    s=s.replace(a,b)
# 1. r0.178's header QR button opens The Range (Divinity format)
rep("if(btn) btn.addEventListener('click', openQr);",
    "if(btn) btn.addEventListener('click', function(){ if(typeof openRangeQr==='function') openRangeQr(); else openQr(); }); /* eXeL 2026-10-10a: the header QR opens The Range */")
# 2. the magazines live on the start light's row (#magL / #magM); r0.178's magazine well is kept but not shown on the range
rep("#app.range #magWell{display:flex}",
    "#app.range #magWell{display:none} /* eXeL 2026-10-10a (operator): the wireframe magazines sit on the start light's row — #magL RELOAD left, #magM rounds centre */")
# 3. rounds colours: 20-30 green, 5-19 amber, 0-4 red (fill + number), in our magazine and in r0.178's
rep("{ const col=r>20?'#3DCC8A':r>5?'#F0A020':'#E24B3B'; f.setAttribute('fill',col); f.setAttribute('opacity',r>20?'.6':'.55'); const nb=document.getElementById('magRds'); nb.style.color=col; M.dataset.band=r>20?'green':r>5?'amber':'red'; } /* eXeL 2026-10-08d: green 21+ · amber 6-20 · red 0-5, on every change and on reload */",
    "{ const col=r>=20?'#3DCC8A':r>=5?'#F0A020':'#E24B3B'; f.setAttribute('fill',col); f.setAttribute('opacity',r>=20?'.6':'.55'); const nb=document.getElementById('magRds'); nb.style.color=col; M.dataset.band=r>=20?'green':r>=5?'amber':'red'; } /* eXeL 2026-10-10a (operator): green 20-30 · amber 5-19 · red 0-4, on every change and on reload */")
rep("M.classList.toggle('low',r>0&&r<=Math.ceil(cap/5));", "M.classList.toggle('low',r>0&&r<5);")
rep("const r=m.rounds|0; const tone=r<=5?'#E24B3B':(r<=20?'#F0A020':'#3DCC8A');",
    "const r=m.rounds|0; const tone=r<5?'#E24B3B':(r<20?'#F0A020':'#3DCC8A'); /* eXeL 2026-10-10a: 20+ green, 5-19 amber, 0-4 red */")
rep("frame.setAttribute('stroke', r>20?'#C9A227':tone);", "frame.setAttribute('stroke', r>=20?'#C9A227':tone);")
rep("r.178 ROUNDS · green above 20, amber from 6 to 20, red at 5 or below.", "r.178 ROUNDS · green 20 and up, amber 5 to 19, red below 5 (eXeL 2026-10-10a).")
open(p,'w',encoding='utf-8').write(s)
print('applied: 2026-10-08 a-h on r0.178 + The Range from the header QR, magazines on the start light row, rounds 20+/5-19/0-4')

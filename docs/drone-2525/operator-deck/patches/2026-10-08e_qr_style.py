# 2026-10-08 (operator): the Drone-2525 QR overlay in play.html takes the Divinity Guide QR modal's format exactly
# (app/divinity-guide/page.tsx): dark teal backdrop (hsl 183 30% 6% / .95 + blur), round X top-right, 24 px bold cyan title,
# 14 px italic grey subtitle, white rounded-2xl card (p-24, shadow-2xl) with a 280 px QR, 12 px "Scan to share ..." caption,
# 10 px grey URL line, rounded-full muted "Copy Link" pill — system sans, as the Divinity page.
# Content: "The Range" · "Lane 21 · Turret · Mode: Train - Up" · "Scan to share The Range" · the short clean URL
#   https://exel-ai-polling.explore-096.workers.dev/drone-2525/play?range=21&role=turret&mode=train-up
# (the Worker's asset handler serves /drone-2525/play as play.html, query intact). The QR is regenerated for that URL as
# public/drone-2525/qr-range21-play.svg (new name, so no cached old code is ever shown). The /drone-2525/ page's qr-mini.tsx is
# restyled the same way in the repo (not by this script).
# Run from the repo root AFTER 2026-10-08_qr_berms_mags_range.py, ...b, ...c and 2026-10-08d_lane_signs.py:
#   python3 docs/drone-2525/operator-deck/patches/2026-10-08e_qr_style.py      (needs node + the frontend's "qrcode" package)
import os, subprocess
ROOT=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
FE=os.path.join(ROOT,'frontend')
p=os.path.join(FE,'public','drone-2525','play.html')
s=open(p,encoding='utf-8').read()
URL='https://exel-ai-polling.explore-096.workers.dev/drone-2525/play?range=21&role=turret&mode=train-up'
OLD='https://exel-ai-polling.explore-096.workers.dev/drone-2525/play.html?range=21&role=turret&mode=train-up'
def rep(a,b):
    global s
    c=s.count(a)
    if c!=1: raise SystemExit(f'REFUSE: expected 1 of {a[:90]!r}, found {c}')
    s=s.replace(a,b)
rep("const RANGE_DEEP_LINK='"+OLD+"';","const RANGE_DEEP_LINK='"+URL+"'; /* eXeL 2026-10-08e: the short clean form */")
a=s.index('<div id="rangeQr"'); b=s.index('</div>\n<style>',a)+len('</div>\n')
if s.count('<div id="rangeQr"')!=1: raise SystemExit('REFUSE: rangeQr')
SANS='ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Arial,sans-serif'
U=URL.replace('&','&amp;')
NEW=('<div id="rangeQr" role="dialog" aria-modal="true" aria-label="The Range QR code" onclick="if(event.target===this)closeRangeQr()" style="display:none;position:fixed;inset:0;z-index:60;background:hsl(183 30% 6% / .95);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:'+SANS+';color:hsl(210 40% 98%);letter-spacing:normal;text-transform:none"> <!-- eXeL 2026-10-08e: the Divinity Guide QR modal, line for line -->\n'
 '  <button type="button" onclick="closeRangeQr()" aria-label="close" style="position:absolute;top:16px;right:16px;padding:8px;border:0;border-radius:9999px;background:transparent;color:hsl(210 40% 98%);min-width:0;min-height:0;line-height:0;cursor:pointer;box-shadow:none" onmouseover="this.style.background=\'hsl(183 33% 17%)\'" onmouseout="this.style.background=\'transparent\'"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>\n'
 '  <h2 style="margin:0 0 4px;font-size:24px;line-height:32px;font-weight:700;color:#00FFFF;letter-spacing:normal">The Range</h2>\n'
 '  <p style="margin:0 0 24px;font-size:14px;line-height:20px;font-style:italic;color:hsl(183 11% 64%)">Lane 21 · Turret · Mode: Train - Up</p>\n'
 '  <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 25px 50px -12px rgba(0,0,0,.25)"><img src="/drone-2525/qr-range21-play.svg" alt="QR code: The Range — Lane 21, turret, Train - Up" width="280" height="280" style="display:block;width:min(280px,calc(100vw - 96px),50vh);height:auto;aspect-ratio:1;border-radius:8px"/></div>\n'
 '  <p style="margin:24px 0 0;font-size:12px;line-height:16px;color:hsl(183 11% 64%)">Scan to share The Range</p>\n'
 '  <p id="rangeQrUrl" style="margin:4px 0 0;font-size:10px;line-height:14px;color:hsl(183 11% 64% / .6);word-break:break-all;max-width:min(420px,calc(100vw - 32px))">'+U+'</p>\n'
 '  <button type="button" onclick="try{navigator.clipboard.writeText(RANGE_DEEP_LINK);toast(\'LINK COPIED\');}catch(e){}" style="margin-top:16px;padding:8px 16px;font-family:inherit;font-size:12px;line-height:16px;letter-spacing:normal;text-transform:none;border:0;border-radius:9999px;background:hsl(183 33% 17%);color:hsl(210 40% 98%);min-height:0;cursor:pointer;box-shadow:none">Copy Link</button>\n'
 '</div>\n')
s=s[:a]+NEW+s[b:]
open(p,'w',encoding='utf-8').write(s)
subprocess.run(['node','-e','require("qrcode").toString(process.argv[1],{type:"svg",errorCorrectionLevel:"Q",margin:0,color:{dark:"#000000",light:"#ffffff"}}).then(s=>require("fs").writeFileSync("public/drone-2525/qr-range21-play.svg",s))',URL],cwd=FE,check=True)
print('applied: Divinity-format QR overlay (The Range), short URL, qr-range21-play.svg')

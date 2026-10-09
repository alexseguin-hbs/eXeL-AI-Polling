# 2026-10-08 (operator, via the Fitness-2525 agent) — applied to the SERVED deck frontend/public/drone-2525/play.html (r0.166):
#  1. Mini QR icon in the top bar -> overlay with a QR to LANE 21 · TURRET · TRAIN UP (+ /drone-2525/qr-range21-trainup.svg).
#  2. Deep link: play.html?range=21&role=turret&mode=train-up (also lane=, mode=train-down|qual40); absent params change nothing.
#  3. Range distance berms: a dashed ground line across MY lane at 100 / 200 / 300 m with a fixed-size "100 M" plate (every zoom 0.6x-30x);
#     a berm off the picture is pinned at the edge ("▲ 300 M").
#  4. HUD magazines on the start light's row: LEFT = RELOAD (same handler as the RELOAD button), CENTRE = rounds left (fill + ticks + number),
#     PMAG line art mirrored for a weapon pointing RIGHT.
#  5. Intro screen: "The Range" button next to SKIP TO SELECT -> the same deep link.
#  6. React shell (/drone-2525/): mounts <DroneQrMini/> (components/drone-2525/qr-mini.tsx) next to the DRONE · 2525 title.
# Run from the repo root:  python3 docs/drone-2525/operator-deck/patches/2026-10-08_qr_berms_mags_range.py
import os, subprocess
ROOT=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
FE=os.path.join(ROOT,'frontend')
URL='https://exel-ai-polling.explore-096.workers.dev/drone-2525/play.html?range=21&role=turret&mode=train-up'

def patch(path, reps):
    s=open(path,encoding='utf-8').read()
    for old,new in reps:
        c=s.count(old)
        if c!=1: raise SystemExit(f'REFUSE: expected 1 of {old[:90]!r} in {path}, found {c}')
        s=s.replace(old,new)
    open(path,'w',encoding='utf-8').write(s)

QR_BTN='<button id="btnRangeQr" type="button" title="QR · Lane 21 turret · Train Up" aria-label="QR code" onclick="openRangeQr()" style="padding:2px 8px;min-height:28px"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="10" y="10" width="2" height="2"/><rect x="13" y="10" width="2" height="2"/><rect x="10" y="13" width="2" height="2"/><rect x="13" y="13" width="2" height="2"/><rect x="3" y="3" width="2" height="2" fill="#000"/><rect x="11" y="3" width="2" height="2" fill="#000"/><rect x="3" y="11" width="2" height="2" fill="#000"/></svg></button>'

ADDON=r'''<script>
/* eXeL 2026-10-08 (operator, Fitness-2525 agent): RANGE DISTANCE BERMS + LANE 21 QR + DEEP LINK. Self-contained; reads the deck's own proj/laneNow/LANE_MARKER_Z. */
const RANGE_DEEP_LINK='https://exel-ai-polling.explore-096.workers.dev/drone-2525/play.html?range=21&role=turret&mode=train-up';
function drawRangeDistances(hc,W,H,cam){ /* a ground berm across MY lane at 100 / 200 / 300 m, each with a readable "100 M" plate — fixed-size text at every zoom (0.6×–30×) */
  if(chNum()!==0||state.viewMode==='map') return; const L=laneNow(); if(!L) return; const taken=[{x0:W/2-46,x1:W/2+46,y0:H*.46-46,y1:H*.46+46}];
  try{ boardLabels(hc,W,H,cam).forEach(b=>taken.push(b)); }catch(_){}
  { const st=document.getElementById('stage'), sr=st&&st.getBoundingClientRect(); if(sr) ['playHud','magBar','startLight','face','joyL','joyR','magL','magM'].forEach(id=>{ const e=document.getElementById(id); if(!e||getComputedStyle(e).display==='none') return; const r=e.getBoundingClientRect(); if(r.width>0&&r.height>0) taken.push({x0:r.left-sr.left,x1:r.right-sr.left,y0:r.top-sr.top,y1:r.bottom-sr.top}); }); }
  const off=[]; hc.save(); hc.font='bold 12px ui-monospace,monospace'; hc.textAlign='center'; hc.textBaseline='middle';
  LANE_MARKER_Z.forEach(z=>{ const gy=(L.y-2.2)+(L.slope||0)*z; const a=proj([L.x-LANE_HALF_W,gy,z],cam,W,H), b=proj([L.x+LANE_HALF_W,gy,z],cam,W,H); if(!a||!b) return;
    hc.setLineDash([6,4]); hc.globalAlpha=0.75; hc.strokeStyle='#7AB8C4'; hc.lineWidth=2; hc.beginPath(); hc.moveTo(a.x,a.y); hc.lineTo(b.x,b.y); hc.stroke(); hc.setLineDash([]); hc.globalAlpha=1;
    const lo=Math.max(Math.min(a.x,b.x),6), hi=Math.min(Math.max(a.x,b.x),W-6); const ym=(a.y+b.y)/2; if(hi-lo<20||ym<0||ym>H){ if(hi-lo>=20||ym<0||ym>H) off.push({z,up:ym<0}); return; }
    const txt=z+' M', tw=hc.measureText(txt).width+10, th=16; const yAt=x=>a.y+(b.y-a.y)*((x-a.x)/((b.x-a.x)||1));
    const xs=[0.18,0.82,0.35,0.65,0.5,0.06,0.94].map(f=>lo+(hi-lo)*f).concat([lo-tw/2-6,hi+tw/2+6]);
    for(const dy of [0,th+2,-(th+2),2*(th+2),-2*(th+2)]) for(const x0 of xs){ const x=Math.max(tw/2+4,Math.min(W-tw/2-4,x0)); const y=yAt(x)+dy; if(y<th||y>H-th) continue; const r={x0:x-tw/2,x1:x+tw/2,y0:y-th/2,y1:y+th/2};
      if(typeof signCoversTarget==='function'&&signCoversTarget(r)) continue; if(taken.some(t=>r.x0<t.x1&&t.x0<r.x1&&r.y0<t.y1&&t.y0<r.y1)) continue;
      taken.push(r); hc.strokeStyle='#7AB8C4'; hc.lineWidth=1; hc.beginPath(); if(dy){ hc.moveTo(x,yAt(x)); hc.lineTo(x,dy>0?r.y0:r.y1); } else if(x<lo){ hc.moveTo(r.x1,y); hc.lineTo(lo,yAt(lo)); } else if(x>hi){ hc.moveTo(r.x0,y); hc.lineTo(hi,yAt(hi)); } hc.stroke(); hc.fillStyle='#000000'; hc.fillRect(r.x0,r.y0,tw,th); hc.strokeStyle='#7AB8C4'; hc.lineWidth=1; hc.strokeRect(r.x0+0.5,r.y0+0.5,tw-1,th-1); hc.fillStyle='#E8D5B0'; hc.fillText(txt,x,y+0.5); return; } });
  if(off.length){ /* a berm outside the picture (high zoom) is still named, pinned at the edge it lies past: "▲ 300 M" */ hc.textAlign='left'; const hb=document.getElementById('playHud'); const st=document.getElementById('stage'); let yT=(hb&&st)?(hb.getBoundingClientRect().bottom-st.getBoundingClientRect().top+14):40, yB=H-96;
    off.forEach(o=>{ const txt=(o.up?'\u25B2 ':'\u25BC ')+o.z+' M', tw=hc.measureText(txt).width+10, y=o.up?yT:yB; hc.fillStyle='#000000'; hc.fillRect(8,y-8,tw,16); hc.strokeStyle='#7AB8C4'; hc.lineWidth=1; hc.strokeRect(8.5,y-7.5,tw-1,15); hc.fillStyle='#E8D5B0'; hc.fillText(txt,13,y+0.5); if(o.up) yT+=19; else yB-=19; }); }
  hc.restore();
}
function openRangeQr(){ const o=document.getElementById('rangeQr'); if(o) o.style.display='flex'; }
function closeRangeQr(){ const o=document.getElementById('rangeQr'); if(o) o.style.display='none'; }
(function rangeDeepLink(){ /* ?range=21&role=turret&mode=train-up (also lane=, mode=train-down|qual40) — absent params change nothing */
  let q; try{ q=new URLSearchParams(location.search||''); }catch(_){ return; } if(!q.has('range')&&!q.has('lane')&&!q.has('role')) return;
  const role=String(q.get('role')||'turret').toLowerCase(); if(role!=='turret') return;
  const n=parseInt(q.get('range')||q.get('lane')||'21',10), lane=(n>=1&&n<=LANES.length)?n-1:20;
  const md=String(q.get('mode')||'train-up').toLowerCase().replace(/[^a-z0-9]/g,''); const rm={trainup:'bounce',bounce:'bounce',traindown:'stay',stay:'stay',qual40:'qual40'}[md]||'bounce';
  const go=()=>{ try{ state._selCraft='turret'; state._selCh=0; state.lane=lane; state.rangeMode=rm; const rs=document.getElementById('rngMode'); if(rs) rs.value=rm; const lp=document.getElementById('lanePick'); if(lp) lp.value=String(lane); practiceNoRoom(); }catch(e){ console.warn('deep link',e); } };
  if(document.readyState==='complete') setTimeout(go,0); else window.addEventListener('load',()=>setTimeout(go,0));
})();
</script>
<div id="rangeQr" role="dialog" aria-modal="true" onclick="if(event.target===this)closeRangeQr()" style="display:none;position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.94);flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;text-align:center;color:#E8D5B0">
  <button type="button" onclick="closeRangeQr()" aria-label="close" style="position:absolute;top:10px;right:10px;font-size:16px;min-width:44px;min-height:44px">✕</button>
  <div style="font-size:16px;letter-spacing:.18em;color:#3DCC8A">LANE 21 · TURRET · TRAIN UP</div>
  <div style="background:#fff;padding:12px;border-radius:12px"><img src="/drone-2525/qr-range21-trainup.svg" alt="QR code: Lane 21 turret operator, Train Up" width="240" height="240" style="display:block;width:min(240px,60vh);height:min(240px,60vh)"/></div>
  <div style="font-size:10px;color:#7AB8C4;word-break:break-all;max-width:420px" id="rangeQrUrl">https://exel-ai-polling.explore-096.workers.dev/drone-2525/play.html?range=21&amp;role=turret&amp;mode=train-up</div>
  <button type="button" onclick="try{navigator.clipboard.writeText(RANGE_DEEP_LINK);toast('LINK COPIED');}catch(e){}">COPY LINK</button>
</div>
<style>
/* eXeL 2026-10-08 (operator): two PMAG-style magazines on the start light's row — LEFT = RELOAD, CENTRE = rounds left */
.magHud{position:absolute;top:42px;z-index:4;display:none;flex-direction:column;align-items:center;gap:3px;padding:4px 7px;border:1px solid #1C2A3A;border-radius:6px;background:rgba(0,0,0,.6);min-height:0;font:inherit;color:#E8D5B0}
#app.range .magHud{display:flex}
#magL{left:8px;pointer-events:auto;cursor:pointer}
#magM{left:50%;transform:translateX(-50%);pointer-events:none}
.magHud svg{width:24px;height:46px;display:block;transform:scaleX(-1)} /* operator 2026-10-08: mirrored from the PMAG photo — the weapon points RIGHT */
.magHud b{font-size:9px;letter-spacing:.14em;font-weight:500;color:#E8D5B0;font-variant-numeric:tabular-nums}
#magL{color:#7AB8C4}#magL b{color:#7AB8C4}
#magL.call{border-color:#C9A227;box-shadow:0 0 10px #C9A227;color:#C9A227}#magL.call b{color:#C9A227}
#magM.low b{color:#E24B3B}#magM.empty{border-color:#E24B3B}
@media(orientation:portrait){ #app.range #playHud{top:122px} }
</style>
<script>
(function magHud(){ /* the magazine is line art in the HUD palette, after a 30-round PMAG: curved body, feed lips, waffle panels, base plate */
  const body='M4 4 L18 2 L19.5 6 Q20.5 32 25.5 54 L24.8 58.5 L10 61 L8.4 57.5 Q4.6 32 4 4 Z';
  const art=(fill)=>'<svg viewBox="0 0 28 62" aria-hidden="true"><defs><clipPath id="mc'+fill+'"><path d="'+body+'"/></clipPath></defs>'+
    (fill?'<rect id="magFill" x="0" y="62" width="28" height="0" fill="#F0A020" opacity=".55" clip-path="url(#mc'+fill+')"/><g id="magTicks" clip-path="url(#mc'+fill+')"></g>':'')+
    '<path d="'+body+'" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'+
    '<path d="M6 3.6 L6.5 1.2 L16 0.4 L17 2.2" fill="none" stroke="currentColor" stroke-width="1"/><path d="M14 9 L17.5 8.6 L17.6 12 L14.1 12.4 Z" fill="none" stroke="currentColor" stroke-width=".7"/>'+
    '<path d="M5 25 L20.8 23.6 M5.9 36 L22.2 34.6 M7 47 L23.9 45.4 M11 25 Q11.6 42 13.6 59 M16.5 24.4 Q17.6 41 19.6 58.3" fill="none" stroke="currentColor" stroke-width=".6" opacity=".6"/>'+
    '<path d="M8 55.6 L25 53 L24.8 58.5 L10 61 Z" fill="none" stroke="currentColor" stroke-width="1"/></svg>';
  function mount(){ const st=document.getElementById('stage'); if(!st||document.getElementById('magL')) return;
    const L=document.createElement('button'); L.id='magL'; L.type='button'; L.className='magHud'; L.title='load a fresh magazine'; L.setAttribute('aria-label','reload'); L.innerHTML=art(0)+'<b>RELOAD</b>';
    L.onclick=()=>{ const b=document.getElementById('btnReload'); if(b&&b.onclick) b.onclick(); else if(typeof magReload==='function') magReload(); }; /* the same door as the RELOAD button */
    const M=document.createElement('div'); M.id='magM'; M.className='magHud'; M.setAttribute('role','status'); M.innerHTML=art(1).replace('fill="none" stroke="currentColor" stroke-width="1.4"','fill="none" stroke="#C9A227" stroke-width="1.4"')+'<b id="magRds">30</b>';
    M.style.color='#C9A227'; st.appendChild(L); st.appendChild(M); let last=''; 
    (function tick(){ try{ const m=state.mag||{cap:30,rounds:30}; const cap=Math.max(1,m.cap|0), r=Math.max(0,Math.min(cap,m.rounds|0)); const call=typeof reloadCalls==='function'&&reloadCalls(); const k=r+'/'+cap+'/'+call;
      if(k!==last){ last=k; const top=5, bot=57, h=(bot-top)*r/cap; const f=document.getElementById('magFill'); f.setAttribute('y',String(bot-h)); f.setAttribute('height',String(h));
        const g=document.getElementById('magTicks'); let t=''; const n=Math.min(r,cap), step=(bot-top)/cap; for(let i=0;i<n;i++){ const y=bot-step*(i+0.5); t+='<line x1="4" x2="24" y1="'+y.toFixed(2)+'" y2="'+y.toFixed(2)+'" stroke="#000" stroke-width="'+(cap>15?0.35:0.6)+'"/>'; } g.innerHTML=t;
        document.getElementById('magRds').textContent=String(r); M.classList.toggle('low',r>0&&r<=Math.ceil(cap/5)); M.classList.toggle('empty',r===0); M.setAttribute('aria-label',r+' rounds left of '+cap); L.classList.toggle('call',!!call); } }catch(_){} requestAnimationFrame(tick); })();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
})();
</script>
'''

SKIP="    <button type=\"button\" data-next=\"sc1\" onclick=\"window.showScr&&window.showScr('sc1')\">SKIP TO SELECT</button>\n"
DRAW="  if(chNum()===0&&typeof laneMarkers==='function'){ hc.textAlign='center'; hc.textBaseline='middle'; boardLabels("
patch(os.path.join(FE,'public','drone-2525','play.html'), [
    (SKIP, SKIP+"    <button type=\"button\" id=\"btnTheRange\" onclick=\"location.href='/drone-2525/play.html?range=21&amp;role=turret&amp;mode=train-up'\">The Range</button>\n"),
    ('<b>eXeL</b><span>r0.166</span><button id="btnFullBar"', '<b>eXeL</b><span>r0.166</span>'+QR_BTN+'<button id="btnFullBar"'),
    (DRAW, "  if(typeof drawRangeDistances==='function') drawRangeDistances(hc,W,H,cam); /* eXeL 2026-10-08: 100/200/300 M berms */\n"+DRAW),
    ("['playHud','magBar','startLight','board'].forEach(id=>", "['playHud','magBar','startLight','board','magL','magM'].forEach(id=>"),
    ('</body>\n</html>', ADDON+'</body>\n</html>'),
])
patch(os.path.join(FE,'components','drone-2525','command-ux1.tsx'), [
    ('import { DroneIntro } from "./intro";', 'import { DroneIntro } from "./intro";\nimport { DroneQrMini } from "./qr-mini";'),
    ('        <span style={{ fontSize: 13, letterSpacing: "0.18em", color: semanticHex("mount") }}>DRONE · 2525</span>\n',
     '        <span style={{ fontSize: 13, letterSpacing: "0.18em", color: semanticHex("mount") }}>DRONE · 2525</span>\n        <DroneQrMini hex={semanticHex("mount")} />\n'),
])
# the static QR the deck's overlay shows (same encoder family as qrcode.react; level Q)
subprocess.run(['node','-e','require("qrcode").toString(process.argv[1],{type:"svg",errorCorrectionLevel:"Q",margin:1,color:{dark:"#000000",light:"#ffffff"}}).then(s=>require("fs").writeFileSync("public/drone-2525/qr-range21-trainup.svg",s))',URL],cwd=FE,check=True)
print('applied: play.html (QR, deep link, berms, magazines, The Range), command-ux1.tsx (mini QR), qr-range21-trainup.svg')

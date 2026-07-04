// Atlantis Accords — offline standalone HTML package generator (clearance model).
//
// Produces a SELF-CONTAINED .html file the moderator emails as an attachment.
// Access is gated by a 4-digit code (shared out-of-band) AND a CLEARANCE LEVEL
// 1–7 chosen by the sender. Clearance draws that many circles of the Atlantis
// Seed-of-Life, colored by the rainbow, and reveals that many accord sections:
//
//   1 circle  RED     (default — 4-digit key required)   2 circles ORANGE
//   3 YELLOW   4 GREEN   5 BLUE   6 INDIGO/CYAN   7 VIOLET (full visual)
//
// Only the unlocked sections are embedded in the file, so a lower-clearance copy
// physically cannot reveal higher-clearance content — it isn't in the bytes.
//
// ⚠ SECURITY REALITY (moderator-facing, not shown to the reader): a 4-digit code
// is 10,000 combinations and the ciphertext ships inside the file — best-effort
// deterrence + "hiding in plain sight," not strong crypto. One-time lock is soft
// (localStorage). For brute-force-proof / true one-time, use a server-backed model.

import type { AccordSection } from "@/lib/atlantis-accord-data";

const PBKDF2_ITERATIONS = 310_000;

/** Clearance 1–7 → rainbow color (Red … Violet). Index 0 unused. */
export const CLEARANCE_COLORS = [
  "", "#ef4444", "#f59e0b", "#eab308", "#22c55e", "#3b82f6", "#06b6d4", "#8b5cf6",
];
export const CLEARANCE_NAMES = [
  "", "RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "INDIGO", "VIOLET",
];
export const MAX_CLEARANCE = 7;

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s);
}

/** Cryptographically-random 4-digit code (0000–9999). */
export function generate4DigitCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
  return n.toString().padStart(4, "0");
}

async function deriveKey(code: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(code) as BufferSource, "PBKDF2", false, ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt"],
  );
}

/**
 * Build the self-contained HTML string. `clearance` (1–7) selects how many
 * accord sections are embedded + circles drawn + the rainbow color.
 */
export async function buildAtlantisPackageHtml(
  sections: AccordSection[],
  code: string,
  clearance: number,
): Promise<string> {
  const lvl = Math.max(1, Math.min(MAX_CLEARANCE, Math.round(clearance)));
  const unlocked = sections.slice(0, lvl); // only these bytes ship

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(code, salt);

  const payload = JSON.stringify({
    title: "The Atlantis Accords",
    clearance: lvl,
    color: CLEARANCE_COLORS[lvl],
    name: CLEARANCE_NAMES[lvl],
    sections: unlocked.map((s) => ({ tag: s.tag, title: s.title, content: s.content })),
  });
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource }, key,
    new TextEncoder().encode(payload) as BufferSource,
  );

  const pkg = {
    v: 2, id: crypto.randomUUID(), it: PBKDF2_ITERATIONS,
    salt: b64(salt), iv: b64(iv), ct: b64(cipher),
  };
  return htmlTemplate(JSON.stringify(pkg));
}

// ── The standalone document (inert without the code) ─────────────────────────
function htmlTemplate(pkgJson: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Atlantis Accords</title>
<style>
:root{--bg:#0a0e14;--bd:#1e2b3a;--tx:#c8d6e5;--dim:#5f7186}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--tx);font:15px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
.wrap{min-height:100%;display:flex;flex-direction:column}
.gate,.done{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;gap:14px}
h1{font-weight:700;letter-spacing:.12em;margin:0}
.sub{color:var(--dim);font-size:12px;letter-spacing:.2em;text-transform:uppercase}
input[type=tel]{width:160px;text-align:center;font-size:28px;letter-spacing:.4em;padding:10px;border-radius:10px;border:1px solid var(--bd);background:#0b1119;color:var(--tx)}
button{cursor:pointer;border:1px solid var(--bd);background:#152238;color:var(--tx);border-radius:8px;padding:9px 16px;font-weight:600}
button:hover{background:#1b2c46}.err{color:#ef4444;font-size:13px;min-height:18px}
.reader{flex:1;display:none;flex-direction:column}
.top{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--bd);padding:10px 16px}
.top h2{font-size:16px;margin:0}.badge{font-size:10px;letter-spacing:.15em;padding:3px 8px;border-radius:20px;border:1px solid}
.body{flex:1;display:flex;flex-direction:column}
@media(min-width:760px){.body{flex-direction:row}}
.left,.right{padding:18px}
.left{display:flex;align-items:center;justify-content:center}
@media(min-width:760px){.left{width:44%;border-right:1px solid var(--bd)}.right{width:56%;overflow:auto}}
.tiers{display:flex;gap:8px;margin:8px 0 14px;flex-wrap:wrap}
.tier{font-size:12px;padding:5px 12px;border-radius:20px;border:1px solid;background:transparent;cursor:pointer}
.tag{font-size:22px;font-weight:700}.title{color:var(--dim);font-weight:400}
.content{white-space:pre-line;color:#dbe6f2}
.pager{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--bd);padding:10px 16px}
.pager button{width:44px;height:44px;border-radius:50%}
.mini{color:var(--dim);font-size:11px}
</style></head><body>
<div class="wrap">
  <div class="gate" id="gate">
    <h1>THE ATLANTIS ACCORDS</h1>
    <div class="sub">Sealed · Enter access code</div>
    <input id="code" type="tel" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off">
    <div class="err" id="err"></div>
    <button id="unlock">Unlock</button>
    <div class="mini">A four-digit code was shared with you privately.</div>
  </div>
  <div class="done" id="done" style="display:none">
    <h1>Sealed</h1><div class="sub">This copy has been closed and cannot be reopened.</div>
    <div class="mini">Request a fresh copy from the sender.</div>
  </div>
  <div class="reader" id="reader">
    <div class="top"><h2>The Atlantis Accords</h2>
      <div style="display:flex;gap:8px;align-items:center"><span class="badge" id="badge"></span><button id="seal">Close &amp; Seal</button></div></div>
    <div class="body">
      <div class="left" id="left"></div>
      <div class="right">
        <div class="tag" id="tag"></div>
        <div class="tiers" id="tiers"></div>
        <div class="content" id="content"></div>
      </div>
    </div>
    <div class="pager"><button id="prev">‹</button><span class="mini" id="pos"></span><button id="next">›</button></div>
  </div>
</div>
<script id="pkg" type="application/json">${pkgJson}</script>
<script>
(function(){
  var PKG=JSON.parse(document.getElementById('pkg').textContent);
  var VKEY='atlantis_viewed_'+PKG.id;
  var gate=document.getElementById('gate'),reader=document.getElementById('reader'),done=document.getElementById('done');
  function seen(){try{return localStorage.getItem(VKEY)==='1'}catch(e){return false}}
  function mark(){try{localStorage.setItem(VKEY,'1')}catch(e){}}
  if(seen()){gate.style.display='none';done.style.display='flex';return;}
  function d64(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
  async function decrypt(code){
    var salt=d64(PKG.salt),iv=d64(PKG.iv),ct=d64(PKG.ct);
    var base=await crypto.subtle.importKey('raw',new TextEncoder().encode(code),'PBKDF2',false,['deriveKey']);
    var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:PKG.it,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
    var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:iv},key,ct);
    return JSON.parse(new TextDecoder().decode(pt));
  }
  var DATA=null,sec=0,tier=333,COL='#8b5cf6',LVL=7;
  var TC={7:'#c084fc',33:'#ef4444',111:'#22c55e',333:'#3b82f6'};
  // Seed-of-Life: center + 6 hex. Reveal circles 0..LVL-1 (center first).
  function seedPositions(){var R=48,cx=110,cy=110,p=[[cx,cy]];for(var i=0;i<6;i++){var a=i*Math.PI/3-Math.PI/2;p.push([cx+R*Math.cos(a),cy+R*Math.sin(a)]);}return p;}
  function drawLeft(){
    var pos=seedPositions(),g='';
    for(var i=0;i<pos.length;i++){var on=i<LVL;
      g+='<circle data-i="'+i+'" cx="'+pos[i][0].toFixed(1)+'" cy="'+pos[i][1].toFixed(1)+'" r="48" fill="'+(on?COL:'none')+'" fill-opacity="'+(i===sec?0.28:0.12)+'" stroke="'+(on?COL:'#22303f')+'" stroke-width="1.5" '+(on?'style="cursor:pointer"':'')+'></circle>';}
    document.getElementById('left').innerHTML='<svg width="240" height="240" viewBox="0 0 220 220">'+g+'</svg>';
    Array.prototype.forEach.call(document.querySelectorAll('#left circle'),function(c){var i=+c.dataset.i;if(i<LVL&&i<DATA.sections.length)c.onclick=function(){sec=i;render();};});
  }
  function drawTiers(){var t=document.getElementById('tiers');t.innerHTML='';
    [7,33,111,333].forEach(function(n){var b=document.createElement('button');b.className='tier';b.textContent=n+' words';
      b.style.borderColor=TC[n];b.style.color=n===tier?'#fff':TC[n];b.style.background=n===tier?TC[n]:'transparent';
      b.onclick=function(){tier=n;render();};t.appendChild(b);});}
  function render(){
    var s=DATA.sections[sec];
    document.getElementById('tag').innerHTML='<span>'+s.tag+'</span> <span class="title">· '+s.title+'</span>';
    document.getElementById('content').textContent=s.content[tier]||s.content[333];
    document.getElementById('pos').textContent=(sec+1)+' / '+DATA.sections.length;
    drawTiers();drawLeft();
  }
  document.getElementById('unlock').onclick=async function(){
    var c=document.getElementById('code').value.trim();var e=document.getElementById('err');
    if(!/^[0-9]{4}$/.test(c)){e.textContent='Enter the 4-digit code.';return;}
    e.textContent='Unlocking…';
    try{DATA=await decrypt(c);COL=DATA.color;LVL=DATA.clearance;
      var bd=document.getElementById('badge');bd.textContent='CLEARANCE '+DATA.clearance+' · '+DATA.name;bd.style.color=COL;bd.style.borderColor=COL;
      gate.style.display='none';reader.style.display='flex';render();}
    catch(err){e.textContent='Incorrect code.';}
  };
  document.getElementById('code').addEventListener('keydown',function(ev){if(ev.key==='Enter')document.getElementById('unlock').click();});
  document.getElementById('prev').onclick=function(){if(sec>0){sec--;render();}};
  document.getElementById('next').onclick=function(){if(sec<DATA.sections.length-1){sec++;render();}};
  function seal(){mark();DATA=null;reader.style.display='none';gate.style.display='none';done.style.display='flex';}
  document.getElementById('seal').onclick=seal;
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&DATA)mark();});
  window.addEventListener('pagehide',function(){if(DATA)mark();});
})();
</script>
</body></html>`;
}

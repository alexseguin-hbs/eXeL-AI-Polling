// Atlantis Accords — offline standalone HTML package (clearance + Light Codex cover).
//
// Self-contained .html the moderator emails. The COVER is deliberately vague —
// no title text; a clearance-colored border; the clearance level shown only as
// circles (Seed of Life, not words); a single center circle seal; universal
// wonder words; and a Light Codex double-helix band encoding a signed message
// (date · CST time · sender). The full accord content unlocks with a 4-digit PIN
// transferred out-of-band by the sender. One-time view + self-destruct on close.
//
// Clearance 1–7 → rainbow (Red..Violet) = circles drawn = accord sections
// embedded. Only unlocked sections are written into the file.
//
// ⚠ Best-effort exclusivity (moderator-facing): 4-digit = 10k combos, ciphertext
// ships in the file; one-time lock is soft (localStorage). Hides in plain sight;
// not certified secrecy.

import type { AccordSection } from "@/lib/atlantis-accord-data";

const PBKDF2_ITERATIONS = 310_000;

export const CLEARANCE_COLORS = [
  "", "#ef4444", "#f59e0b", "#eab308", "#22c55e", "#3b82f6", "#06b6d4", "#8b5cf6",
];
export const CLEARANCE_NAMES = [
  "", "RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "INDIGO", "VIOLET",
];
export const MAX_CLEARANCE = 7;

// ── Light Codex (double-helix encode) — ported from the reference python ─────
const ALPHA: Record<string, string> = {
  A: "WWCC", B: "RRRR", C: "CWRC", D: "YCCY", E: "CCRR", F: "WRRW", G: "YCYC",
  H: "WWRR", I: "YBBY", J: "CWWC", K: "YYCC", L: "YBYB", M: "WCWC", N: "CWCW",
  O: "RRYY", P: "CCCW", Q: "YYYY", R: "RWWR", S: "WWWC", T: "RWCC", U: "RWRW",
  V: "WRWR", W: "CCRW", X: "WCCW", Y: "YRYR", Z: "YCRB", " ": "BBBB", ".": "BBBW",
};
const NUMBERS: Record<string, string> = {
  "0": "BBBB", "1": "WBBB", "2": "WWBB", "3": "WWWB", "4": "WWWW",
  "5": "VBBB", "6": "VWBB", "7": "VWWB", "8": "VWWW", "9": "VVVV",
};
const TRANSMISSION: Record<string, string> = { "4": "GGGG", "3": "GGGR", "2": "GGRR", "1": "GRRR" };

function encodeChar(ch: string): string {
  if (ch >= "0" && ch <= "9") return NUMBERS[ch];
  const u = ch.toUpperCase();
  return ALPHA[u] ?? ALPHA[" "]; // unsupported → space (BBBB)
}
function encodeMessage(text: string): string {
  let out = "";
  for (const ch of text) out += encodeChar(ch);
  return out;
}
function frame(seq: string): string {
  let out = "";
  for (const c of seq) out += TRANSMISSION[c];
  return out;
}
/** Returns { fwd, rev } token strings (B/R/Y/G/C/V/W) for the double helix. */
function doubleHelix(message: string): { fwd: string; rev: string } {
  const rev = message.split("").reverse().join("");
  return {
    fwd: frame("4321") + encodeMessage(message) + frame("1234"),
    rev: frame("1234") + encodeMessage(rev) + frame("4321"),
  };
}

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s);
}

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

/** Austin (Central) date + time-of-day, codex-safe (digits/letters/space/period). */
function centralStamp(now: Date): { date: string; time: string } {
  const parts = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", ...opts }).formatToParts(now);
  const d = parts({ year: "numeric", month: "2-digit", day: "2-digit" });
  const g = (t: string) => d.find((p) => p.type === t)?.value ?? "";
  const date = `${g("year")}.${g("month")}.${g("day")}`;
  const t = parts({ hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" });
  const gt = (t2: string) => t.find((p) => p.type === t2)?.value ?? "";
  const tz = gt("timeZoneName").replace(/[^A-Z]/g, "");
  const time = `${gt("hour")}.${gt("minute")} ${tz}`;
  return { date, time };
}

export async function buildAtlantisPackageHtml(
  sections: AccordSection[],
  code: string,
  clearance: number,
  sender: string,
): Promise<string> {
  const lvl = Math.max(1, Math.min(MAX_CLEARANCE, Math.round(clearance)));
  const snd = (sender || "eXeL AI").trim();

  const { date, time } = centralStamp(new Date());
  // Signed message encoded into the cover's Light Codex (hides in plain sight).
  const codexMsg =
    `THE ATLANTIS ACCORDS . WRITTEN 2026.07.04 . SENT ${date} ${time} AUSTIN TX . ${snd}`
      .toUpperCase().replace(/[^A-Z0-9 .]/g, " ");
  const helix = doubleHelix(codexMsg);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(code, salt);
  const payload = JSON.stringify({
    title: "The Atlantis Accords",
    // Color-NAME (e.g. "RED") is deliberately NOT embedded — the level is
    // conveyed only by border/accent color, never the spelled-out name.
    clearance: lvl, color: CLEARANCE_COLORS[lvl],
    sender: snd, codexDate: date, cstTime: time,
    // nav = all 7 petal labels (tag + seven-word) so the flower matches the
    // original; full content only for the unlocked (<= clearance) sections.
    nav: sections.map((s) => ({ tag: s.tag, seven: s.content[7] })),
    // Level-1 = the whole transmission: all 7 sections included and readable.
    sections: sections.map((s) => ({ tag: s.tag, title: s.title, content: s.content })),
  });
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource }, key,
    new TextEncoder().encode(payload) as BufferSource,
  );

  const pkg = {
    v: 3, id: crypto.randomUUID(), it: PBKDF2_ITERATIONS,
    salt: b64(salt), iv: b64(iv), ct: b64(cipher),
    // Unencrypted cover meta (vague on purpose — the CONTENT stays sealed):
    lvl, color: CLEARANCE_COLORS[lvl], sender: snd, codexDate: date, cstTime: time,
    fwd: helix.fwd, rev: helix.rev,
  };
  return htmlTemplate(JSON.stringify(pkg));
}

// ── The standalone document ──────────────────────────────────────────────────
function htmlTemplate(pkgJson: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>◬ · ♡ · 웃</title>
<style>
:root{--bg:#0a0e14;--bd:#1e2b3a;--tx:#c8d6e5;--dim:#5f7186}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--tx);font:15px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
.wrap{min-height:100%;display:flex;flex-direction:column}
.frame{position:relative;overflow:hidden;flex:1;margin:16px;border:2px solid #0a0e14;border-radius:8px;display:flex;flex-direction:column;background:var(--bg)}
.cover{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:34px 20px;gap:18px}
.seal{display:flex;align-items:center;justify-content:center}
.wonder{max-width:360px;color:var(--tx);font-size:15px;line-height:1.7}
.hint{color:var(--dim);font-size:11px;letter-spacing:.12em;text-transform:uppercase}
.codexTL{position:fixed;top:2px;left:3px;image-rendering:pixelated;opacity:.95;z-index:5}
.codexBR{position:fixed;bottom:2px;right:3px;image-rendering:pixelated;opacity:.95;z-index:5}
.meta{color:var(--dim);font-size:10px;letter-spacing:.08em;margin-top:6px}
.sealview{flex:1;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;cursor:pointer}
.sealview .hint{animation:pulse 2.4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.35}50%{opacity:.9}}
input[type=tel]{width:150px;text-align:center;font-size:26px;letter-spacing:.4em;padding:9px;border-radius:10px;border:1px solid var(--bd);background:#0b1119;color:var(--tx)}
button{cursor:pointer;border:1px solid var(--bd);background:#152238;color:var(--tx);border-radius:8px;padding:9px 16px;font-weight:600}
button:hover{background:#1b2c46}.err{color:#ef4444;font-size:12px;min-height:16px}
.reader{flex:1;display:none;flex-direction:column}
.top{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--bd);padding:10px 16px}
.top h2{font-size:16px;margin:0}.badge{font-size:10px;letter-spacing:.15em;padding:3px 8px;border-radius:20px;border:1px solid}
.rbody{flex:1;display:flex;flex-direction:column}@media(min-width:760px){.rbody{flex-direction:row}}
.left,.right{padding:18px}.left{display:flex;align-items:center;justify-content:center}
@media(min-width:760px){.left{width:44%;border-right:1px solid var(--bd)}.right{width:56%;overflow:auto}}
.tiers{display:flex;gap:8px;margin:8px 0 14px;flex-wrap:wrap}
.tier{font-size:12px;padding:5px 12px;border-radius:20px;border:1px solid;background:transparent;cursor:pointer}
.tag{font-size:22px;font-weight:700}.title{color:var(--dim);font-weight:400}.content{white-space:pre-line;color:#dbe6f2}
.pager{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--bd);padding:10px 16px}
.pager button{width:44px;height:44px;border-radius:50%}.mini{color:var(--dim);font-size:11px}
.done{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:24px}
</style></head><body>
<div class="wrap">
  <div class="frame" id="frame">
    <!-- Light Codex double helix (2x2 px), forward upper-left + reverse bottom-right.
         HIDDEN signature — plaintext date/time/sender is NOT shown; decode only via
         the SIM Light Codex decoder. -->
    <canvas class="codexTL" id="cxTL"></canvas>
    <canvas class="codexBR" id="cxBR"></canvas>
    <!-- COVER — professional / confidential. Clearance shown only as a growing Seed of Life. -->
    <div class="cover" id="cover">
      <div class="seal" id="seal"></div>
      <div class="wonder">This document is sealed under the seven-circle encryption method. Access is limited to the intended recipient who holds the key.</div>
      <div class="hint">Confidential · Please read privately</div>
      <div>
        <input id="code" type="tel" inputmode="numeric" maxlength="4" placeholder="&#8226;&#8226;&#8226;&#8226;" autocomplete="off"><br>
        <div class="err" id="err"></div>
        <button id="unlock">Enter</button>
      </div>
    </div>
    <!-- SEAL VEIL (after correct PIN; click the seal to expose the Accords) -->
    <div class="sealview" id="sealview"><div class="seal" id="sealBig"></div><div class="hint">Touch the seal to open</div></div>
    <!-- READER (unlocked) -->
    <div class="reader" id="reader">
      <div class="top"><h2>The Atlantis Accords</h2>
        <div style="display:flex;gap:8px;align-items:center"><span class="badge" id="badge"></span><button id="seal2">Close &amp; Seal</button></div></div>
      <div class="rbody">
        <div class="left" id="left"></div>
        <div class="right"><div class="tag" id="rtag"></div><div class="tiers" id="tiers"></div><div class="content" id="rcontent"></div></div>
      </div>
      <div class="pager"><button id="prev">&#8249;</button><span class="mini" id="pos"></span><button id="next">&#8250;</button></div>
    </div>
    <!-- SEALED -->
    <div class="done" id="done" style="display:none"><div style="font-size:26px">&#9679;</div>
      <div class="hint">This copy has been closed and cannot be reopened</div>
      <div class="mini">Request a fresh copy from the sender.</div></div>
  </div>
</div>
<script id="pkg" type="application/json">${pkgJson}</script>
<script>
(function(){
  var PKG=JSON.parse(document.getElementById('pkg').textContent);
  var VKEY='atlantis_viewed_'+PKG.id;
  var frame=document.getElementById('frame'),cover=document.getElementById('cover'),reader=document.getElementById('reader'),done=document.getElementById('done');
  frame.style.setProperty('--clr',PKG.color);document.body.style.background=PKG.color;
  function seen(){try{return localStorage.getItem(VKEY)==='1'}catch(e){return false}}
  function mark(){try{localStorage.setItem(VKEY,'1')}catch(e){}}
  // Growing Seed of Life: N same-size circles (1 = small … 7 = full flower).
  function drawSeal(el,r){var pos=[[0,0]];for(var i=0;i<6;i++){var a=i*Math.PI/3-Math.PI/2;pos.push([r*Math.cos(a),r*Math.sin(a)]);}
    var use=pos.slice(0,PKG.lvl),minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;
    use.forEach(function(p){minx=Math.min(minx,p[0]-r);maxx=Math.max(maxx,p[0]+r);miny=Math.min(miny,p[1]-r);maxy=Math.max(maxy,p[1]+r);});
    var pad=4,w=maxx-minx+2*pad,h=maxy-miny+2*pad,g='';
    use.forEach(function(p){g+='<circle cx="'+(p[0]-minx+pad).toFixed(1)+'" cy="'+(p[1]-miny+pad).toFixed(1)+'" r="'+r+'" fill="'+PKG.color+'" fill-opacity="0.10" stroke="'+PKG.color+'" stroke-width="2"/>';});
    el.innerHTML='<svg width="'+w.toFixed(0)+'" height="'+h.toFixed(0)+'" viewBox="0 0 '+w.toFixed(1)+' '+h.toFixed(1)+'">'+g+'</svg>';}
  drawSeal(document.getElementById('seal'),26);
  // Light Codex double helix — 4x4 px blocks, forward upper-left, reverse bottom-right.
  (function(){var CM={B:[0,0,0],R:[255,0,0],Y:[255,255,0],G:[0,255,0],C:[0,255,255],V:[255,0,255],W:[255,255,255]},BLK=2;
    function draw(id,str){var cv=document.getElementById(id);cv.width=str.length*BLK;cv.height=BLK;var ctx=cv.getContext('2d');
      for(var i=0;i<str.length;i++){var c=CM[str[i]];if(!c)continue;ctx.fillStyle='rgb('+c[0]+','+c[1]+','+c[2]+')';ctx.fillRect(i*BLK,0,BLK,BLK);}}
    draw('cxTL',PKG.fwd);draw('cxBR',PKG.rev);})();
  if(seen()){cover.style.display='none';done.style.display='flex';return;}
  function d64(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
  async function decrypt(code){var salt=d64(PKG.salt),iv=d64(PKG.iv),ct=d64(PKG.ct);
    var base=await crypto.subtle.importKey('raw',new TextEncoder().encode(code),'PBKDF2',false,['deriveKey']);
    var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:PKG.it,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
    var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:iv},key,ct);return JSON.parse(new TextDecoder().decode(pt));}
  var DATA=null,sec=0,tier=7,COL=PKG.color,LVL=PKG.lvl;
  var TC={7:'#c084fc',33:'#ef4444',111:'#22c55e',333:'#3b82f6'};
  // Original AccordFlower geometry: 6 petals (idx 0-5) + EXPAND hub (idx 6).
  var POS=(function(){var CX=300,CY=250,a=[];for(var i=0;i<6;i++){var d=(-120+i*60)*Math.PI/180;a.push({cx:CX+130*Math.cos(d),cy:CY+130*Math.sin(d),r:85});}a.push({cx:CX,cy:CY,r:50});return a;})();
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function wrap(str,per){var w=String(str).split(' '),o=[],c=[];w.forEach(function(x){c.push(x);if(c.join(' ').length>=per){o.push(c.join(' '));c=[];}});if(c.length)o.push(c.join(' '));return o;}
  function drawLeft(){
    var g='',n=DATA.sections.length;
    for(var i=0;i<7;i++){var p=POS[i],on=i<n,act=(i===sec),nv=DATA.nav[i],hub=(i===6);
      var fill=on?COL:'#3a2530',fo=act?(on?0.42:0.20):(on?0.16:0.05),st=act?'#fff':(on?COL:'#3a2530');
      g+='<circle data-i="'+i+'" style="cursor:pointer" cx="'+p.cx.toFixed(1)+'" cy="'+p.cy.toFixed(1)+'" r="'+p.r+'" fill="'+fill+'" fill-opacity="'+fo+'" stroke="'+st+'" stroke-width="'+(act?3:2)+'" '+(on?'':'opacity="0.6"')+'/>';
      var tcol=on?'#fff':'#7a6470';
      g+='<text x="'+p.cx.toFixed(1)+'" y="'+(p.cy-(hub?0:12)).toFixed(1)+'" text-anchor="middle" fill="'+tcol+'" font-size="'+(hub?12:15)+'" font-weight="700" pointer-events="none">'+esc(nv.tag)+'</text>';
      if(!hub){var L=wrap(nv.seven||'',18);L.slice(0,3).forEach(function(ln,li){g+='<text x="'+p.cx.toFixed(1)+'" y="'+(p.cy+6+li*12).toFixed(1)+'" text-anchor="middle" fill="'+(on?'#e6cccc':'#7a6470')+'" font-size="9" pointer-events="none">'+esc(ln)+'</text>';});}
    }
    document.getElementById('left').innerHTML='<svg viewBox="0 0 600 500" width="100%" style="max-height:74vh;overflow:visible">'+g+'</svg>';
    Array.prototype.forEach.call(document.querySelectorAll('#left circle[data-i]'),function(c){c.onclick=function(){sec=+c.dataset.i;render();};});
  }
  function drawTiers(){var t=document.getElementById('tiers');t.innerHTML='';[33,111,333].forEach(function(n){var b=document.createElement('button');b.className='tier';b.textContent=n+' words';b.style.borderColor=TC[n];b.style.color=n===tier?'#fff':TC[n];b.style.background=n===tier?TC[n]:'transparent';b.onclick=function(){tier=n;render();};t.appendChild(b);});}
  function render(){var n=DATA.sections.length,ti=document.getElementById('tiers');
    if(sec<n){var s=DATA.sections[sec];
      document.getElementById('rtag').innerHTML='<span>'+esc(s.tag)+'</span> <span class="title">· '+esc(s.title)+'</span>';
      document.getElementById('rcontent').textContent=s.content[tier]||s.content[333];ti.style.display='flex';}
    else{var nv=DATA.nav[sec];
      document.getElementById('rtag').innerHTML='<span>'+esc(nv.tag)+'</span>';
      document.getElementById('rcontent').innerHTML='<div style="opacity:.75;font-style:italic">'+esc(nv.seven||'')+'</div><div style="margin-top:16px;color:'+COL+'">Sealed at Clearance Level '+DATA.clearance+'. A higher clearance is required to open this section.</div>';ti.style.display='none';}
    document.getElementById('pos').textContent=(sec+1)+' / 7';drawTiers();drawLeft();}
  document.getElementById('unlock').onclick=async function(){var c=document.getElementById('code').value.trim();var e=document.getElementById('err');
    if(!/^[0-9]{4}$/.test(c)){e.textContent='Enter the 4-digit code.';return;}e.textContent='…';
    try{DATA=await decrypt(c);COL=DATA.color;LVL=DATA.clearance;var bd=document.getElementById('badge');bd.textContent='Clearance: Level '+DATA.clearance;bd.style.color=COL;bd.style.borderColor=COL;
      cover.style.display='none';drawSeal(document.getElementById('sealBig'),46);document.getElementById('sealview').style.display='flex';}catch(err){e.textContent='Incorrect code.';}};
  document.getElementById('sealview').onclick=function(){this.style.display='none';reader.style.display='flex';render();};
  document.getElementById('code').addEventListener('keydown',function(ev){if(ev.key==='Enter')document.getElementById('unlock').click();});
  document.getElementById('prev').onclick=function(){if(sec>0){sec--;render();}};
  document.getElementById('next').onclick=function(){if(sec<6){sec++;render();}};
  function seal(){mark();DATA=null;reader.style.display='none';cover.style.display='none';done.style.display='flex';}
  document.getElementById('seal2').onclick=seal;
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&DATA)mark();});
  window.addEventListener('pagehide',function(){if(DATA)mark();});
})();
</script>
</body></html>`;
}

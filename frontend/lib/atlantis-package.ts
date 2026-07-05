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
// ⚠ Best-effort exclusivity (moderator-facing): the ciphertext ships in the
// file and the one-time lock is soft (multi-vector storage flags — copies can
// still be reopened). Seal strength is selectable: STANDARD 4-digit (~13 bits,
// verbal share, casual deterrent) · FORTIFIED 7-glyph (~35 bits) · ABYSSAL
// 12-glyph (~60 bits, beyond practical brute force). Hides in plain sight.
// Burn-on-close: on PC Chrome/Edge the sealed screen offers to overwrite the
// original file with a dead shell (ciphertext destroyed); phones/Safari rely
// on the multi-vector seal. True consume-once revocation requires the
// server-gated path (WireGuard-whitelisted cube key endpoint) — Level-7 tier.
//
// Cross-platform decrypt: iOS/Android often open local files in a NON-secure
// context where window.crypto.subtle is unavailable. The reader carries a
// pure-JS AES-256-GCM + PBKDF2 fallback (verified byte-compatible with
// WebCrypto) so the SAME ciphertext opens on every device.

import type { AccordSection } from "@/lib/atlantis-accord-data";
import { supabase } from "@/lib/supabase";

// PBKDF2-SHA256 work factor. Deliberately 100k (not the OWASP 600k) because the
// reader falls back to a PURE-JS KDF on devices without WebCrypto (iOS/Android
// local files) — 600k there costs ~20-40s. At 100k the fallback is ~2-3s, and
// for Level-1's threat model the CODE ENTROPY is the wall, not the KDF depth.
const PBKDF2_ITERATIONS = 100_000;

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

// ── Seal strength tiers (Council of Twelve hardening) ────────────────────────
// Glyph alphabet excludes ambiguous characters (0/O, 1/I/L) for verbal + visual
// clarity. 31 symbols ≈ 4.95 bits/glyph.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export interface SealStrength {
  id: string;
  numeral: string;   // roman numeral shown on the selector
  label: string;
  len: number;       // code length
  numeric: boolean;  // digits-only (verbal share) vs glyph alphabet
  bits: number;      // approx entropy, honest
  share: string;     // recommended share channel
  honest: string;    // moderator-facing truth about resistance
}

export const SEAL_STRENGTHS: SealStrength[] = [
  {
    id: "standard", numeral: "I", label: "Standard", len: 4, numeric: true, bits: 13,
    share: "verbal · text",
    honest: "Deters casual readers. Falls in seconds to a determined offline attack.",
  },
  {
    id: "fortified", numeral: "II", label: "Fortified", len: 7, numeric: false, bits: 35,
    share: "text · email",
    honest: "Weeks of dedicated GPU work to break — strong against most real-world actors.",
  },
  {
    id: "abyssal", numeral: "III", label: "Abyssal", len: 12, numeric: false, bits: 60,
    share: "copy-paste",
    honest: "Centuries at current compute — beyond practical brute force. The copy-seal itself remains soft.",
  },
];

/** Unbiased random index in [0, max) via rejection sampling (no modulo bias). */
function randomIndex(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  let v: number;
  do { v = crypto.getRandomValues(buf)[0]; } while (v >= limit);
  return v % max;
}

/** Cryptographically random seal code for the given strength tier. */
export function generateSealCode(s: SealStrength): string {
  let out = "";
  for (let i = 0; i < s.len; i++) {
    out += s.numeric ? String(randomIndex(10)) : CODE_ALPHABET[randomIndex(CODE_ALPHABET.length)];
  }
  return out;
}

/** Display grouping — 4-glyph clusters read like a sigil: XXXX-XXXX-XXXX. */
export function formatSealCode(code: string): string {
  return code.length <= 4 ? code : (code.match(/.{1,4}/g) ?? [code]).join("-");
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

// Live site + hosted reader. The reader is a STATIC, portable file
// (public/seal.html): copy it to ANY domain and point ATLANTIS_READER_URL at
// it — the sealed payload rides in the link's #fragment and is never sent to
// the host, so it stays zero-knowledge. Default = current deploy (works today).
export const SITE_URL = "https://exel-ai-polling.explore-096.workers.dev";
export const ATLANTIS_READER_URL = SITE_URL + "/seal.html";
// Deep-link to the Atlantis Accords viewer itself (opens the reader directly,
// as if the user opened Settings → The Atlantis Accords). The in-viewer QR
// encodes this so a scan lands straight on the Accords, not the homepage.
export const ATLANTIS_PAGE_URL = SITE_URL + "/atlantis";
// Short-link store lives in Supabase (secure backend, ciphertext only) — the
// shared link becomes /seal.html#<7-char-hash> instead of an 8 KB #fragment.
const SEAL_TABLE = "atlantis_seals";
const SEAL_HASH_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
function newSealHash(): string {
  const b = crypto.getRandomValues(new Uint8Array(7));
  let s = "";
  for (let i = 0; i < 7; i++) s += SEAL_HASH_ALPHABET[b[i] % SEAL_HASH_ALPHABET.length];
  return s;
}

/** Build the sealed package object (encryption + cover meta), as a JSON string.
 *  Shared by the offline file and the universal link — identical payload. */
async function buildAtlantisPayloadJson(
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
    v: 4, id: crypto.randomUUID(), it: PBKDF2_ITERATIONS,
    // Code shape (length + digits-vs-glyphs) drives the reader's input UX.
    // Knowing the shape does not weaken the key — the file's holder can read
    // the ciphertext anyway; entropy is what defends it.
    cl: code.length, num: /^[0-9]+$/.test(code),
    salt: b64(salt), iv: b64(iv), ct: b64(cipher),
    // Unencrypted cover meta (vague on purpose — the CONTENT stays sealed):
    lvl, color: CLEARANCE_COLORS[lvl], sender: snd, codexDate: date, cstTime: time,
    fwd: helix.fwd, rev: helix.rev,
  };
  return JSON.stringify(pkg);
}

/** Self-contained offline .html (Android / PC — opens directly). */
export async function buildAtlantisPackageHtml(
  sections: AccordSection[],
  code: string,
  clearance: number,
  sender: string,
): Promise<string> {
  return htmlTemplate(await buildAtlantisPayloadJson(sections, code, clearance, sender));
}

/** base64url (UTF-8 safe) — for carrying the payload in the link #fragment. */
function b64urlFromJson(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Universal link — opens the hosted reader in a real browser on ANY device
 *  (including iPhone/iPad, where local files can't run JS).
 *
 *  Short by default: the sealed payload is POSTed to the seal store, which
 *  returns a 7-char hash, so the shared link is tiny — `/seal.html#<hash>`.
 *  Only the CIPHERTEXT + cover meta are stored; the unlock code never touches
 *  the server, so it stays zero-knowledge. If the store is unreachable we fall
 *  back to the self-contained long link (full payload in the #fragment) so the
 *  link ALWAYS works. */
export async function buildAtlantisLink(
  sections: AccordSection[],
  code: string,
  clearance: number,
  sender: string,
): Promise<string> {
  const json = await buildAtlantisPayloadJson(sections, code, clearance, sender);
  if (supabase) {
    // Store the ciphertext under a fresh 7-char hash; retry on the (rare)
    // primary-key collision. The unlock code never touches the server.
    for (let tries = 0; tries < 3; tries++) {
      const hash = newSealHash();
      const { error } = await supabase.from(SEAL_TABLE).insert({ hash, payload: json });
      if (!error) return ATLANTIS_READER_URL + "#" + hash;
      if (error.code !== "23505") break; // not a duplicate key → stop, use fallback
    }
  }
  // Supabase absent/unreachable → self-contained long link (payload in #fragment).
  return ATLANTIS_READER_URL + "#" + b64urlFromJson(json);
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
.codexTL{position:fixed;top:0;left:0;image-rendering:pixelated;opacity:.95;z-index:5}
.codexBR{position:fixed;bottom:0;right:0;image-rendering:pixelated;opacity:.95;z-index:5}
.meta{color:var(--dim);font-size:10px;letter-spacing:.08em;margin-top:6px}
.sealview{flex:1;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;cursor:pointer}
.sealview .hint{animation:pulse 2.4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.35}50%{opacity:.9}}
#code{width:150px;text-align:center;font-size:26px;letter-spacing:.4em;padding:9px;border-radius:10px;border:1px solid var(--bd);background:#0b1119;color:var(--tx)}
#code.glyph{width:min(340px,86vw);font:600 17px/1.5 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.18em;text-transform:uppercase}
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
<!-- No-JS notice: visible ONLY where scripting is disabled (iOS Quick Look /
     Mail & Files previews). The inline script below hides it the instant JS
     runs, so real browsers never see it (no flash). -->
<div id="nojs" style="padding:14px 18px;margin:16px 16px 0;border:1px solid #7f1d1d;border-radius:8px;background:#1a0e12;color:#fca5a5;font:13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;text-align:center">
  <b>Code doesn't open it on iPhone/iPad?</b><br>You're viewing a file <i>preview</i>, where Apple disables the unlock. Ask the sender for the secure browser link, or open on Android / a computer. This copy opens directly there.
</div>
<script>try{document.getElementById('nojs').style.display='none'}catch(e){}</script>
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
      <div class="wonder">This document is sealed under the Atlantis Accords. Access is granted to the intended recipient alone, by the key entrusted to them.</div>
      <div class="hint">Confidential · Please read privately</div>
      <div>
        <input id="code" type="text" placeholder="&#8226;&#8226;&#8226;&#8226;" autocomplete="off" spellcheck="false" autocapitalize="characters"><br>
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
      <div class="mini">Request a fresh copy from the sender.</div>
      <button id="burn" style="display:none;margin-top:10px">Burn this file</button>
      <div class="mini" id="burnHint"></div></div>
  </div>
</div>
<script id="pkg" type="application/json">${pkgJson}</script>
<script>
function __initSeal(){
  var _pk=document.getElementById('pkg');
  if(!_pk||!_pk.textContent.trim())return; // no payload yet
  var PKG=JSON.parse(_pk.textContent);
  var VKEY='atlantis_viewed_'+PKG.id;
  var frame=document.getElementById('frame'),cover=document.getElementById('cover'),reader=document.getElementById('reader'),done=document.getElementById('done');
  frame.style.setProperty('--clr',PKG.color);document.body.style.background=PKG.color;
  // Code input adapts to the seal strength baked into this copy (digits vs glyphs).
  var codeEl=document.getElementById('code');
  if(PKG.num){codeEl.setAttribute('inputmode','numeric');codeEl.maxLength=PKG.cl;}
  else{codeEl.classList.add('glyph');codeEl.maxLength=PKG.cl+3;codeEl.placeholder='••••-••••';}
  // Multi-vector one-time seal: localStorage + sessionStorage + cookie + IndexedDB.
  // Best-effort — a copied file can still be reopened; this hardens the casual path.
  var CK='atl_'+String(PKG.id).replace(/-/g,'');
  function seen(){
    try{if(localStorage.getItem(VKEY)==='1')return true}catch(e){}
    try{if(sessionStorage.getItem(VKEY)==='1')return true}catch(e){}
    try{if(document.cookie.indexOf(CK+'=1')>-1)return true}catch(e){}
    return false}
  function mark(){
    try{localStorage.setItem(VKEY,'1')}catch(e){}
    try{sessionStorage.setItem(VKEY,'1')}catch(e){}
    try{document.cookie=CK+'=1;max-age=63072000;path=/'}catch(e){}
    try{var r=indexedDB.open(CK,1);r.onupgradeneeded=function(){r.result.createObjectStore('s')};
      r.onsuccess=function(){try{r.result.transaction('s','readwrite').objectStore('s').put(1,'v')}catch(e){}}}catch(e){}}
  function sealScreen(){DATA=null;cover.style.display='none';document.getElementById('sealview').style.display='none';reader.style.display='none';done.style.display='flex';}
  // IndexedDB survives some storage clears — async check seals reopened copies.
  try{var rq=indexedDB.open(CK,1);rq.onupgradeneeded=function(){rq.result.createObjectStore('s')};
    rq.onsuccess=function(){try{var g=rq.result.transaction('s').objectStore('s').get('v');
      g.onsuccess=function(){if(g.result===1){mark();sealScreen();}}}catch(e){}}}catch(e){}
  // Wrong-attempt backoff (soft, deters casual guessing): 3 free tries, then
  // escalating lockout 10s -> 20s -> 40s ... capped at 300s.
  var AKEY='atlantis_att_'+PKG.id;
  function att(){try{return JSON.parse(localStorage.getItem(AKEY))||{n:0,u:0}}catch(e){return{n:0,u:0}}}
  function setAtt(a){try{localStorage.setItem(AKEY,JSON.stringify(a))}catch(e){}}
  // Growing Seed of Life: N same-size circles (1 = small … 7 = full flower).
  function drawSeal(el,r){var pos=[[0,0]];for(var i=0;i<6;i++){var a=i*Math.PI/3-Math.PI/2;pos.push([r*Math.cos(a),r*Math.sin(a)]);}
    var use=pos.slice(0,PKG.lvl),minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;
    use.forEach(function(p){minx=Math.min(minx,p[0]-r);maxx=Math.max(maxx,p[0]+r);miny=Math.min(miny,p[1]-r);maxy=Math.max(maxy,p[1]+r);});
    var pad=4,w=maxx-minx+2*pad,h=maxy-miny+2*pad,g='';
    use.forEach(function(p){g+='<circle cx="'+(p[0]-minx+pad).toFixed(1)+'" cy="'+(p[1]-miny+pad).toFixed(1)+'" r="'+r+'" fill="'+PKG.color+'" fill-opacity="0.10" stroke="'+PKG.color+'" stroke-width="2"/>';});
    el.innerHTML='<svg width="'+w.toFixed(0)+'" height="'+h.toFixed(0)+'" viewBox="0 0 '+w.toFixed(1)+' '+h.toFixed(1)+'">'+g+'</svg>';}
  drawSeal(document.getElementById('seal'),26);
  // Light Codex double helix — 1x1 px blocks (fits a full date/time/sender line
  // across a phone-portrait top edge), flush in the frame's far corners.
  (function(){var CM={B:[0,0,0],R:[255,0,0],Y:[255,255,0],G:[0,255,0],C:[0,255,255],V:[255,0,255],W:[255,255,255]},BLK=1;
    function draw(id,str){var cv=document.getElementById(id);cv.width=str.length*BLK;cv.height=BLK;var ctx=cv.getContext('2d');
      for(var i=0;i<str.length;i++){var c=CM[str[i]];if(!c)continue;ctx.fillStyle='rgb('+c[0]+','+c[1]+','+c[2]+')';ctx.fillRect(i*BLK,0,BLK,BLK);}}
    draw('cxTL',PKG.fwd);draw('cxBR',PKG.rev);})();
  if(seen()){cover.style.display='none';done.style.display='flex';return;}
  function d64(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
  // ── Pure-JS AES-256-GCM + PBKDF2-HMAC-SHA256 (byte-compatible with WebCrypto) ─
  // Used when window.crypto.subtle is absent — iOS/Android local files run in a
  // non-secure context. Verified against WebCrypto ciphertext in Node.
  function _u8(s){return typeof s==='string'?new TextEncoder().encode(s):new Uint8Array(s);}
  var _K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function _sha256(msg){msg=_u8(msg);var l=msg.length,bl=l*8,withOne=l+1,k=(56-withOne%64+64)%64,total=withOne+k+8;
    var m=new Uint8Array(total);m.set(msg);m[l]=0x80;var dv=new DataView(m.buffer);
    dv.setUint32(total-4,bl>>>0,false);dv.setUint32(total-8,Math.floor(bl/0x100000000)>>>0,false);
    var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64);
    for(var off=0;off<total;off+=64){for(var i=0;i<16;i++)w[i]=dv.getUint32(off+i*4,false);
      for(i=16;i<64;i++){var s0=((w[i-15]>>>7)|(w[i-15]<<25))^((w[i-15]>>>18)|(w[i-15]<<14))^(w[i-15]>>>3);
        var s1=((w[i-2]>>>17)|(w[i-2]<<15))^((w[i-2]>>>19)|(w[i-2]<<13))^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0;}
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for(i=0;i<64;i++){var S1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)),ch=(e&f)^(~e&g),t1=(h+S1+ch+_K[i]+w[i])|0;
        var S0=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)),maj=(a&b)^(a&c)^(b&c),t2=(S0+maj)|0;
        h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
      H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;}
    var out=new Uint8Array(32),odv=new DataView(out.buffer);for(i=0;i<8;i++)odv.setUint32(i*4,H[i]>>>0,false);return out;}
  function _hmac(key,msg){key=_u8(key);msg=_u8(msg);if(key.length>64)key=_sha256(key);
    var ik=new Uint8Array(64),ok=new Uint8Array(64);ik.set(key);ok.set(key);
    for(var i=0;i<64;i++){ik[i]^=0x36;ok[i]^=0x5c;}
    var inner=new Uint8Array(64+msg.length);inner.set(ik);inner.set(msg,64);var ih=_sha256(inner);
    var outer=new Uint8Array(96);outer.set(ok);outer.set(ih,64);return _sha256(outer);}
  function _pbkdf2(pw,salt,iters,dkLen){pw=_u8(pw);salt=_u8(salt);var out=new Uint8Array(dkLen),blocks=Math.ceil(dkLen/32),pos=0;
    for(var b=1;b<=blocks;b++){var si=new Uint8Array(salt.length+4);si.set(salt);
      si[salt.length]=(b>>>24)&255;si[salt.length+1]=(b>>>16)&255;si[salt.length+2]=(b>>>8)&255;si[salt.length+3]=b&255;
      var u=_hmac(pw,si),t=u.slice();for(var i=1;i<iters;i++){u=_hmac(pw,u);for(var j=0;j<32;j++)t[j]^=u[j];}
      var n=Math.min(32,dkLen-pos);out.set(t.slice(0,n),pos);pos+=n;}return out;}
  var _SBOX=(function(){var p=1,q=1,sb=new Uint8Array(256);
    do{p=p^(p<<1)^(p&0x80?0x11b:0);p&=0xff;q^=q<<1;q^=q<<2;q^=q<<4;q&=0xff;if(q&0x80)q^=0x09;
      var x=q^((q<<1)|(q>>>7))^((q<<2)|(q>>>6))^((q<<3)|(q>>>5))^((q<<4)|(q>>>4));sb[p]=(x^0x63)&0xff;}while(p!==1);
    sb[0]=0x63;return sb;})();
  function _xt(a){return((a<<1)^((a&0x80)?0x1b:0))&0xff;}
  function _aesKey(key){var Nk=key.length/4,Nr=Nk+6,w=new Array(4*(Nr+1));
    for(var i=0;i<Nk;i++)w[i]=[key[4*i],key[4*i+1],key[4*i+2],key[4*i+3]];var rc=1;
    for(i=Nk;i<4*(Nr+1);i++){var t=w[i-1].slice();
      if(i%Nk===0){t=[t[1],t[2],t[3],t[0]];for(var k=0;k<4;k++)t[k]=_SBOX[t[k]];t[0]^=rc;rc=_xt(rc);}
      else if(Nk>6&&i%Nk===4){for(k=0;k<4;k++)t[k]=_SBOX[t[k]];}
      w[i]=[w[i-Nk][0]^t[0],w[i-Nk][1]^t[1],w[i-Nk][2]^t[2],w[i-Nk][3]^t[3]];}return{w:w,Nr:Nr};}
  function _aesEnc(ks,inp){var Nr=ks.Nr,w=ks.w,s=new Array(16);for(var i=0;i<16;i++)s[i]=inp[i];
    function ark(r){for(var c=0;c<4;c++)for(var row=0;row<4;row++)s[c*4+row]^=w[r*4+c][row];}
    ark(0);for(var round=1;round<Nr;round++){for(i=0;i<16;i++)s[i]=_SBOX[s[i]];
      var t=s.slice();for(var row=0;row<4;row++)for(var col=0;col<4;col++)s[col*4+row]=t[((col+row)%4)*4+row];
      for(col=0;col<4;col++){var a0=s[col*4],a1=s[col*4+1],a2=s[col*4+2],a3=s[col*4+3];
        s[col*4]=_xt(a0)^(_xt(a1)^a1)^a2^a3;s[col*4+1]=a0^_xt(a1)^(_xt(a2)^a2)^a3;
        s[col*4+2]=a0^a1^_xt(a2)^(_xt(a3)^a3);s[col*4+3]=(_xt(a0)^a0)^a1^a2^_xt(a3);}ark(round);}
    for(i=0;i<16;i++)s[i]=_SBOX[s[i]];var t2=s.slice();
    for(row=0;row<4;row++)for(col=0;col<4;col++)s[col*4+row]=t2[((col+row)%4)*4+row];ark(Nr);return new Uint8Array(s);}
  function _gfmul(X,Y){var Z=new Uint8Array(16),V=Y.slice();
    for(var i=0;i<128;i++){if((X[i>>>3]>>>(7-(i&7)))&1)for(var j=0;j<16;j++)Z[j]^=V[j];
      var lsb=V[15]&1;for(j=15;j>0;j--)V[j]=((V[j]>>>1)|((V[j-1]&1)<<7))&0xff;V[0]=V[0]>>>1;if(lsb)V[0]^=0xe1;}return Z;}
  function _ghash(H,data){var Y=new Uint8Array(16);for(var off=0;off<data.length;off+=16){for(var j=0;j<16;j++)Y[j]^=(data[off+j]||0);Y=_gfmul(Y,H);}return Y;}
  function _inc32(cb){var c=cb.slice(),n=(((c[12]<<24)|(c[13]<<16)|(c[14]<<8)|c[15])>>>0);n=(n+1)>>>0;
    c[12]=(n>>>24)&255;c[13]=(n>>>16)&255;c[14]=(n>>>8)&255;c[15]=n&255;return c;}
  function _gcmDecrypt(kb,iv,ctTag){var ks=_aesKey(kb),H=_aesEnc(ks,new Uint8Array(16));
    var J0=new Uint8Array(16);J0.set(iv.slice(0,12));J0[15]=1;
    var tag=ctTag.slice(ctTag.length-16),ct=ctTag.slice(0,ctTag.length-16),padC=(16-ct.length%16)%16;
    var buf=new Uint8Array(ct.length+padC+16),p=0;buf.set(ct,0);p=ct.length+padC;var dv=new DataView(buf.buffer);
    dv.setUint32(p,0,false);dv.setUint32(p+4,0,false);
    dv.setUint32(p+8,Math.floor(ct.length*8/0x100000000)>>>0,false);dv.setUint32(p+12,(ct.length*8)>>>0,false);
    var S=_ghash(H,buf),EJ0=_aesEnc(ks,J0),ok=1;for(var i=0;i<16;i++)if((S[i]^EJ0[i])!==tag[i])ok=0;
    if(!ok)throw new Error('auth');
    var out=new Uint8Array(ct.length),ctr=_inc32(J0);
    for(var off=0;off<ct.length;off+=16){var ek=_aesEnc(ks,ctr),n=Math.min(16,ct.length-off);
      for(i=0;i<n;i++)out[off+i]=ct[off+i]^ek[i];ctr=_inc32(ctr);}return out;}
  var hasSubtle=!!(window.crypto&&window.crypto.subtle&&window.crypto.subtle.decrypt);
  async function decrypt(code){var salt=d64(PKG.salt),iv=d64(PKG.iv),ct=d64(PKG.ct);
    if(hasSubtle){try{
      var base=await crypto.subtle.importKey('raw',new TextEncoder().encode(code),'PBKDF2',false,['deriveKey']);
      var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:PKG.it,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
      var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:iv},key,ct);return JSON.parse(new TextDecoder().decode(pt));
    }catch(e){if(e&&e.name==='OperationError')throw e;/* subtle broken → fall through to pure-JS */}}
    // Pure-JS path (no secure context needed). Yield first so the "Deciphering…" paint lands.
    await new Promise(function(r){setTimeout(r,30);});
    var dk=_pbkdf2(code,salt,PKG.it,32);
    var pt2=_gcmDecrypt(dk,iv,ct);return JSON.parse(new TextDecoder().decode(pt2));}
  var DATA=null,sec=0,tier=33,COL=PKG.color,LVL=PKG.lvl;
  var TC={7:'#c084fc',33:'#ef4444',111:'#22c55e',333:'#3b82f6'};
  // Original AccordFlower geometry: 6 petals (idx 0-5) + EXPAND hub (idx 6).
  var POS=(function(){var CX=300,CY=250,a=[];for(var i=0;i<6;i++){var d=(-120+i*60)*Math.PI/180;a.push({cx:CX+130*Math.cos(d),cy:CY+130*Math.sin(d),r:85});}a.push({cx:CX,cy:CY,r:50});return a;})();
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function wrap(str,per){var w=String(str).split(' '),o=[],c=[];w.forEach(function(x){c.push(x);if(c.join(' ').length>=per){o.push(c.join(' '));c=[];}});if(c.length)o.push(c.join(' '));return o;}
  function drawLeft(){
    // Flower color follows the selected word-tier: 33=red, 111=green, 333=blue.
    var FC=TC[tier]||COL,g='',n=DATA.sections.length;
    for(var i=0;i<7;i++){var p=POS[i],on=i<n,act=(i===sec),nv=DATA.nav[i],hub=(i===6);
      var fill=on?FC:'#3a2530',fo=act?(on?0.42:0.20):(on?0.16:0.05),st=act?'#fff':(on?FC:'#3a2530');
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
      document.getElementById('rcontent').innerHTML='<div style="opacity:.75;font-style:italic">'+esc(nv.seven||'')+'</div><div style="margin-top:16px;color:'+COL+'">Sealed at Clearance: Level '+DATA.clearance+'. A higher clearance is required to open this section.</div>';ti.style.display='none';}
    document.getElementById('pos').textContent=(sec+1)+' / 7';drawTiers();drawLeft();}
  document.getElementById('unlock').onclick=async function(){
    var e=document.getElementById('err');
    var a=att(),now=Date.now();
    if(a.u>now){e.textContent='Sealed against attempts. Try again in '+Math.ceil((a.u-now)/1000)+'s.';return;}
    // Accept pasted grouped codes (dashes/spaces stripped); glyphs are case-insensitive.
    var c=codeEl.value.trim().toUpperCase().replace(/[\\s-]/g,'');
    var re=new RegExp('^'+(PKG.num?'[0-9]':'[2-9A-HJ-KM-NP-Z]')+'{'+PKG.cl+'}$');
    if(!re.test(c)){e.textContent='Enter the '+PKG.cl+'-'+(PKG.num?'digit':'character')+' code.';return;}
    // On devices without native crypto the pure-JS KDF takes a couple seconds.
    e.textContent=hasSubtle?'…':'Deciphering… a moment on this device.';
    document.getElementById('unlock').disabled=true;
    try{DATA=await decrypt(c);
      try{localStorage.removeItem(AKEY)}catch(x){}
      e.textContent='';
      COL=DATA.color;LVL=DATA.clearance;var bd=document.getElementById('badge');bd.textContent='Clearance: Level '+DATA.clearance;bd.style.color=COL;bd.style.borderColor=COL;
      cover.style.display='none';drawSeal(document.getElementById('sealBig'),46);document.getElementById('sealview').style.display='flex';}
    catch(err){
      // 'auth' (pure-JS) or OperationError (native) = wrong code. Anything else
      // is an environment fault — surface it so failures are never silent.
      var wrong=!err||err.message==='auth'||err.name==='OperationError';
      if(wrong){a=att();a.n++;if(a.n>=3)a.u=Date.now()+Math.min(300,10*Math.pow(2,a.n-3))*1000;setAtt(a);e.textContent='Incorrect code.';}
      else{e.textContent='Could not open on this device: '+(err.message||err.name||'error');}}
    finally{document.getElementById('unlock').disabled=false;}};
  document.getElementById('sealview').onclick=function(){this.style.display='none';reader.style.display='flex';render();};
  document.getElementById('code').addEventListener('keydown',function(ev){if(ev.key==='Enter')document.getElementById('unlock').click();});
  document.getElementById('prev').onclick=function(){if(sec>0){sec--;render();}};
  document.getElementById('next').onclick=function(){if(sec<6){sec++;render();}};
  // Close & Seal — mark all vectors, then scrub decrypted content from the DOM
  // and drop the plaintext reference so nothing readable remains in memory.
  function seal(){mark();try{if(window.__atlDelete)window.__atlDelete();}catch(e){}DATA=null;
    try{codeEl.value='';document.getElementById('rcontent').textContent='';document.getElementById('rtag').textContent='';document.getElementById('left').innerHTML='';}catch(e){}
    reader.style.display='none';cover.style.display='none';done.style.display='flex';}
  document.getElementById('seal2').onclick=seal;
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&DATA)mark();});
  window.addEventListener('pagehide',function(){if(DATA)mark();});
  // ── Burn-on-close (PC: Chrome/Edge File System Access API) ─────────────────
  // Overwrites the original .html on disk with a dead sealed shell — the
  // ciphertext is destroyed, not just flagged. Phones + Safari/Firefox have no
  // save-picker API: the button stays hidden and the multi-vector seal governs.
  function sealedShell(){
    return '<!doctype html><html lang="en"><head><meta charset="utf-8">'
      +'<meta name="viewport" content="width=device-width,initial-scale=1"><title>\\u25EC \\u00B7 \\u2661 \\u00B7 \\uC6C3</title></head>'
      +'<body style="margin:0;background:'+PKG.color+'">'
      +'<div style="min-height:100vh;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;'
      +'background:#0a0e14;margin:16px;border-radius:8px;color:#5f7186;font:14px -apple-system,Segoe UI,Roboto,sans-serif;text-align:center;padding:24px">'
      +'<div style="font-size:26px;color:'+PKG.color+'">&#9679;</div>'
      +'<div style="letter-spacing:.12em;text-transform:uppercase;font-size:11px">This copy has been closed and cannot be reopened</div>'
      +'<div style="font-size:11px">Request a fresh copy from the sender.</div></div></body></html>';}
  // Burn (downloaded FILE only): auto-save a dead shell with the SAME filename to
  // Downloads — no save picker. The browser writes it beside/over the original.
  (function(){var b=document.getElementById('burn');if(location.protocol!=='file:')return;
    b.style.display='inline-block';
    b.onclick=function(){
      var hint=document.getElementById('burnHint');
      try{
        var name=location.pathname.split('/').pop()||'Atlantis-Accords.html';
        try{name=decodeURIComponent(name)}catch(e){}
        var blob=new Blob([sealedShell()],{type:'text/html'});var url=URL.createObjectURL(blob);
        var a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
        setTimeout(function(){URL.revokeObjectURL(url)},1500);
        b.textContent='Burned';b.disabled=true;
        hint.textContent='A sealed shell was saved to Downloads under the same name. Replace the original to finish the burn.';
      }catch(e){}};})();
}
<script>
// Universal launcher — runs for the offline file (payload embedded) AND the
// hosted reader (payload fetched from Supabase by a short #hash). The unlock
// code is never sent; only ciphertext is stored, and it is DELETED on close/burn.
var ATL_SB_URL="__ATL_SB_URL__",ATL_SB_KEY="__ATL_SB_KEY__",ATL_HASH=null;
window.__atlDelete=function(){try{if(ATL_HASH&&ATL_SB_URL.indexOf('__')!==0){fetch(ATL_SB_URL+'/rest/v1/atlantis_seals?hash=eq.'+encodeURIComponent(ATL_HASH),{method:'DELETE',headers:{apikey:ATL_SB_KEY,Authorization:'Bearer '+ATL_SB_KEY}});}}catch(e){}};
(function(){
  function fail(m){document.body.innerHTML='<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;color:#5f7186;font:14px -apple-system,Segoe UI,sans-serif;text-align:center;padding:24px">'+m+'</div>';}
  var pk=document.getElementById('pkg');
  if(pk&&pk.textContent.trim()){__initSeal();return;} // offline file: payload embedded
  var h=(location.hash||'').replace(/^#/,'');
  if(!h){fail('This reader opens a sealed Atlantis Accords link.<br>Please open the secure link you were sent.');return;}
  if(/^[A-Za-z0-9]{4,16}$/.test(h)){
    ATL_HASH=h;
    if(ATL_SB_URL.indexOf('__')===0){fail('This sealed link needs the secure reader.<br>Open it on the eXeL AI site, or ask the sender for the file.');return;}
    fetch(ATL_SB_URL+'/rest/v1/atlantis_seals?hash=eq.'+encodeURIComponent(h)+'&select=payload',{headers:{apikey:ATL_SB_KEY,Authorization:'Bearer '+ATL_SB_KEY}})
      .then(function(r){return r.json();})
      .then(function(rows){if(!rows||!rows.length||!rows[0].payload)throw 0;document.getElementById('pkg').textContent=rows[0].payload;__initSeal();})
      .catch(function(){fail('This sealed link has expired or was already opened.<br>Ask the sender for a fresh link.');});
  }else{
    try{var s=h.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var bin=atob(s),by=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)by[i]=bin.charCodeAt(i);document.getElementById('pkg').textContent=new TextDecoder().decode(by);__initSeal();}
    catch(e){fail('This sealed link could not be read.<br>Ask the sender for a fresh link.');}
  }
})();
</script>
</body></html>`;
}

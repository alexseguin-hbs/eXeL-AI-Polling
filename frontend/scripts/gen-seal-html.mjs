// Generates frontend/public/seal.html — the STATIC, portable hosted reader for
// Atlantis universal links. Single-sourced from htmlTemplate() in
// lib/atlantis-package.ts: we extract the exact reader (style + body + IIFE)
// and swap the embedded <script id="pkg"> payload for a bootstrap that decodes
// the sealed payload from the URL #fragment. Re-run after editing the reader:
//   node scripts/gen-seal-html.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "lib", "atlantis-package.ts"), "utf8");

// Extract htmlTemplate's template literal (no nested backticks in the reader).
const fnIdx = src.indexOf("function htmlTemplate");
const start = src.indexOf("`", fnIdx);
const end = src.indexOf("`", start + 1);
if (fnIdx < 0 || start < 0 || end < 0) throw new Error("htmlTemplate literal not found");
let tpl = src.slice(start + 1, end);

// Resolve template-literal escapes to their runtime values (\\ -> \, etc.).
tpl = tpl.replace(/\\`/g, "`").replace(/\\\$/g, "$").replace(/\\\\/g, "\\");

// Swap the embedded payload script for the fragment-decoder bootstrap.
const EMBED = '<script id="pkg" type="application/json">${pkgJson}</script>';
if (!tpl.includes(EMBED)) throw new Error("embedded pkg script tag not found");
const BOOTSTRAP =
  '<script id="pkg" type="application/json"></script>\n' +
  "<script>(function(){var h=(location.hash||'').replace(/^#/,'');" +
  "if(!h){document.body.innerHTML='<div style=\\'min-height:100vh;display:flex;align-items:center;justify-content:center;color:#5f7186;font:14px -apple-system,Segoe UI,sans-serif;text-align:center;padding:24px\\'>This reader opens a sealed Atlantis Accords link.<br>Please open the secure link you were sent.</div>';return;}" +
  "try{h=h.replace(/-/g,'+').replace(/_/g,'/');while(h.length%4)h+='=';var bin=atob(h),by=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)by[i]=bin.charCodeAt(i);document.getElementById('pkg').textContent=new TextDecoder().decode(by);}catch(e){}})();</script>";
tpl = tpl.replace(EMBED, BOOTSTRAP);

if (tpl.includes("${")) throw new Error("unresolved interpolation remains: " + tpl.slice(tpl.indexOf("${"), tpl.indexOf("${") + 40));

writeFileSync(join(here, "..", "public", "seal.html"), tpl, "utf8");
console.log("wrote public/seal.html (" + tpl.length + " bytes)");

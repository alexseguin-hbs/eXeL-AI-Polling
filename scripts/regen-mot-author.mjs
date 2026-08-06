/* ── ONE PRODUCER FOR THE AUTHOR EXTRACT ──────────────────────────────────
   frontend/public/whitepaper/mot-author.html is a second copy of a block that
   lives in the ledger. mot-drift-check.mjs has warned since r81 to
   "regenerate the extract; never hand-patch it" — and there was no generator,
   so every update WAS a hand-patch. It drifted: r106 rewrote the seal caption
   (crown inscription, the eagle, the primordial egg, the cuneiform ring) and
   the extract still carried the r99 wording, with the pixel measurements the
   operator asked to have removed.

   This is that generator. It reads the LIVING document, replays mot.author at
   VMAX, and writes the block into the extract's <main>. The shell — head,
   stylesheet, topbar, footer — is preserved byte for byte, because it is the
   extract's own presentation and not content. Content has exactly one source. */
import {chromium} from 'playwright';
import {readFileSync, writeFileSync} from 'fs';
const MASTER='file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const OUT='/home/user/eXeL-AI-Polling/frontend/public/whitepaper/mot-author.html';

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p=await b.newPage();
await p.goto(MASTER); await p.waitForTimeout(600);
const live=await p.evaluate(()=>{
  const pick=id=>{const e=LEDGER.filter(x=>x.id===id&&x.v<=VMAX).sort((a,c)=>a.v-c.v).slice(-1)[0];
                  return e?{v:e.v,html:e.html}:null;};
  return {vmax:VMAX, author:pick('mot.author'), companion:pick('mot.companion')};
});
await b.close();
if(!live.author) throw new Error('mot.author not found in the ledger');

const shell=readFileSync(OUT,'utf8');
const a=shell.indexOf('<main>'), z=shell.indexOf('</main>');
if(a<0||z<0) throw new Error('extract has no <main> — shell changed, stop and look');

/* THE SIGNATURE BLOCK IS SHELL, NOT CONTENT. The extract closes with a signed
   panel — the small seal, "웃 Signed · Human Authority", the name and the motto
   — that the living block does not carry, because in the living document the
   masthead already says who signed it. Regenerating naively DELETED it, which
   is removing something the operator never asked to remove. It is carried
   forward verbatim instead, and it is the ONE thing the generator preserves
   from the old body. If it ever disappears from the source, this throws rather
   than quietly shipping an unsigned page. */
const sigAt = shell.lastIndexOf('<div class="notice sign signature"', z);
if (sigAt < a) throw new Error('signature panel missing from the extract — stop and look');
const signature = shell.slice(sigAt, z).trim();

const body = live.author.html + (live.companion ? '\n' + live.companion.html : '');
const next = shell.slice(0,a+6) + '\n' + body + '\n\n' + signature + '\n' + shell.slice(z);
writeFileSync(OUT,next);
console.log('regenerated from v'+live.vmax+
  ' — mot.author v'+live.author.v+
  (live.companion?' + mot.companion v'+live.companion.v:'')+
  '; main '+(z-a-6)+' -> '+(body.length+2)+' bytes');

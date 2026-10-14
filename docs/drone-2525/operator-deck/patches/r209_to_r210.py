# r.209 -> r.210 — THE ICON AT THE BOTTOM OPENS THE HISTORY CHAIN.
#  Operator 2026-10-14: "Also, not seeing RCORE LOGO TO SEE HISTORY CHAIN", and asked where it belongs:
#    "icon at bottom" · "same as all other rcore single links at bottom below Target Approve, Fire"   (DD-49)
#
#  HE IS RIGHT, AND THIS IS MY DEBT, NOT A NEW ASK. Measured on the shipped r.209 bytes: grep for rcoreBadge,
#  RCORE_LEDGER or data-rcore in frontend/public/drone-2525/play.html returns NOTHING. The deck is the only
#  2525 surface with no badge, no panel and no history, while nine React surfaces — SoI, Security, Architect,
#  Celestial, Financial, Settings, SensorFusion, SIM and the Drone ROUTE — all mount the shared RCoreBadge.
#  So /main/Drone-2525 shows a Drone history and the deck he actually plays shows none. r.195 added a
#  hand-typed five-row history and a fixed badge at z-index 9 over the dock; r.196's restore removed both,
#  correctly, and the shared-format replacement has been deferred at EVERY revision since — thirteen times,
#  r.196 through r.209, tracked in the register's own Owed list.
#
#  INVARIANT: the range's R-CORE history is the SAME history, in the same words and the same two-click shape,
#  as every other 2525 surface — reached by an icon at the bottom of the glass, fed by the shared ledger,
#  never hand-typed and never covering the picture.
#
#  WHAT LANDS
#   M1  the badge: his own reticle raster at rest, his wordmark pill on the first press, the panel on the
#       second. Both rasters INLINED as data URIs (the deck is one file and fetches nothing).
#   M2  placeRcore(): the placement is MEASURED from the same rects placeFace() measures, and re-run by the
#       same MutationObserver. Measured on r.209: below TARGET · APPROVE · FIRE there are 72 px in portrait
#       (390x844, 375x667, 428x926) and only 20 px in landscape (844x390, 667x375), so portrait puts it
#       directly below the buttons — his words exactly — and landscape puts it on the same line to their left,
#       clear of the stick. It also joins hudKeepOut's one list, so no lane sign, caption or status line can
#       land on it.
#   M3  the panel: a port of components/2525-core/rcore-revision-panel.tsx with every data-rcore-* hook and
#       every visible word of the 52 rcore.* lexicon keys, verbatim.
#   M4  the engine: a port of lib/2525-core/revisions.ts + lib/version-diff.ts. PROVEN equal to the shared
#       engine on the real 87-entry ledger — 756 assertions, 0 failures: the adapter entry for entry, the
#       tokenizer, 86 consecutive LCS diffs, the unified and side-by-side renderers, impact, category,
#       first-sentence, redaction, 41 full compareRevisions objects field for field, the unknown-pick
#       fallbacks, the escapers on bidi/zero-width input, and the 3000-token cap.
#   M5  the data: RCORE_LEDGER, the entries of docs/traceability/drone-2525.ledger.json with model ids
#       redacted at embed, THROUGH THE REVISION BEFORE THIS ONE — the deck cannot contain its own release row,
#       which is written in the records commit after these bytes are frozen. tests/deck-rcore.test.mjs holds
#       that lag to exactly one, field for field.
#   M6  three boot rows that measure it at four viewports: RCORE_IS_ON_THE_GLASS, RCORE_IS_THE_SHARED_HISTORY,
#       RCORE_NEVER_COVERS_THE_PICTURE.
#
#  ONE GREEN GATE IS REWRITTEN, AND IT IS NAMED. drone-playable.test.mjs asserted the literal string
#  "#rcoreBadge{position:fixed" was absent. The deck has no flow slot at the bottom: #face is itself
#  position:fixed, and the #app grid's only remaining row (the dock) is display:none at 0 px, so mounting the
#  badge in flow would shrink HIS PICTURE by ~54 px — changing something he did not ask to change. The badge
#  therefore joins the same control layer #face is in, and the invariant that string stood for is kept by
#  MEASUREMENT instead: RCORE_NEVER_COVERS_THE_PICTURE walks every visible box on the page (637 of them at
#  428x926) and fails if the badge touches one. The ban on a hand-typed list (RCORE_HIST) is untouched, and
#  frontend/tests/rcore-revisions.test.mjs — the rule for the REACT surfaces — is not relaxed by one word.
#
#  THE RANGE IS NOT TOUCHED (DD-35): no frozen span is edited; tests/range-frozen.test.mjs (100 definitions)
#  and tests/range-2525.test.mjs prove it in the same commit, and both play-throughs are re-run on the
#  shipped bytes and compared to r.209's field for field.
import base64,hashlib,json,os,re,subprocess,tempfile
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
ROOT=os.path.normpath(os.path.join(DECK,'..','..','..'))
BASE_REV='209'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.210.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.209')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)

# THROUGH: the deck carries the record up to the revision before itself. At build time the ledger's last row
# is r.209's (rev 87); r.210's own row is appended in the records commit, after these bytes are frozen.
LEDGER=json.load(open(os.path.join(ROOT,'docs','traceability','drone-2525.ledger.json'),encoding='utf-8'))
THROUGH=len(LEDGER['entries'])
MODEL=re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
_e=[]
for e in LEDGER['entries'][:THROUGH]:
    o={'rev':e['rev'],'date':e['date'],'kind':e['kind'],'text':MODEL.sub('an external model',e.get('text','')),'commit':e.get('commit','')}
    if 'shipped' in e: o['shipped']=e['shipped']
    _e.append(o)
BLOCK=json.dumps({'section':LEDGER['section'],'route':LEDGER['route'],'through':THROUGH,'entries':_e},ensure_ascii=False,separators=(',',':'))
for bad in ['</script','<!--','-->',' ',' ']:
    if bad in BLOCK: raise SystemExit('REFUSE: the ledger block carries %r, which would break the inline script'%bad)
def _png(name):
    b=open(os.path.join(DECK,'img',name),'rb').read()
    return 'data:image/png;base64,'+base64.b64encode(b).decode('ascii')
ICON=_png('r-core-icon@84.png'); WORD=_png('r-core-wordmark@84.png')

# ── the payload, verbatim as it is emitted ───────────────────────────────────────────────────────
CSS = r"""/* r.210 (DD-49) · R-CORE at the bottom of the glass, and its history panel.
   The BADGE is positioned by placeRcore() from measured rects (the deck has no flow slot at the
   bottom: the #app grid's dock row is display:none at 0px, and filling it would shrink the picture).
   It never overlaps a control — RCORE_NEVER_COVERS_THE_PICTURE measures that at four viewports.
   The PANEL is a fixed modal scrim exactly as the React one is (inset 0, z-index 80, 640 max, 88vh). */
#rcoreBadge{position:fixed;z-index:4;display:flex;align-items:center;justify-content:center;pointer-events:auto}
#rcoreBadge button{background:transparent;border:0;padding:0;margin:0;min-height:0;line-height:0;cursor:pointer;border-radius:10px}
#rcoreBadge button:focus-visible{outline:2px solid #7AB8C4;outline-offset:2px}
/* ONE display height, 42 - the shared RCORE_LOGO_H (lib/2525-core/revisions.ts:31) - and each raster's
   OWN natural width at that height, stated so the row is laid out correctly before the data URI decodes:
   the reticle is 112x84 (4:3 -> 56) and the wordmark 252x84 (3:1 -> 126). Landscape takes 34 for the same
   reason the whole badge moves there - below the buttons the deck leaves only 20 px. */
#rcoreBadge img{display:block}
#rcIconImg{height:42px;width:56px}
#rcPillImg{height:42px;width:126px}
@media(orientation:landscape){#rcIconImg{height:34px;width:45px}#rcPillImg{height:34px;width:102px}}
#rcorePanel{position:fixed;inset:0;z-index:80;display:none;background:rgba(3,10,13,0.72);align-items:flex-start;justify-content:center;padding:max(env(safe-area-inset-top,0px),12px) 8px 12px;overflow-y:auto}
#rcorePanel.on{display:flex}
#rcorePanel .rcSheet{width:100%;max-width:640px;max-height:88vh;overflow-y:auto;background:#0a1518;color:#e2ecec;border:1px solid #22363a;border-radius:14px;box-shadow:0 0 40px #C9A22722;font-family:ui-sans-serif,system-ui,sans-serif}
#rcorePanel .rcHead{position:sticky;top:0;background:#0a1518;border-bottom:1px solid #22363a;padding:12px 76px;display:flex;align-items:center;justify-content:center;z-index:1}
#rcorePanel .rcHeadMid{min-width:0;display:flex;flex-direction:column;align-items:center;text-align:center}
#rcorePanel #rcHeadImg{height:42px;width:auto;display:block}
#rcorePanel .rcHeadSub{font-size:11px;color:#8fa3a6;font-family:ui-monospace,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px;max-width:100%}
#rcorePanel .rcHeadBtns{position:absolute;right:12px;top:50%;transform:translateY(-50%);display:flex;gap:6px}
#rcorePanel .rcHeadBtns button{flex-shrink:0;height:30px;width:30px;border-radius:8px;border:1px solid #22363a;background:#101e22;cursor:pointer;display:grid;place-items:center;font-size:16px;line-height:1;padding:0;min-height:0}
#rcorePanel #rcDl{color:#C9A227}
#rcorePanel #rcX{color:#8fa3a6}
#rcorePanel .rcEmpty{padding:16px;font-size:13px;color:#8fa3a6}
#rcorePanel .rcBody{padding:16px;display:flex;flex-direction:column;gap:14px}
#rcorePanel .rcTag{font-size:11px;border-radius:999px;border:1px solid #22363a;color:#8fa3a6;padding:2px 10px;font-family:ui-monospace,monospace}
#rcorePanel .rcTag.on{border-color:#C9A227;color:#C9A227}
#rcorePanel .rcPick{border:1px solid #22363a;border-radius:10px;background:#101e22;padding:10px 12px;display:flex;flex-direction:column;gap:10px}
#rcorePanel .rcScrubLab{font-size:11px;color:#8fa3a6;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rcorePanel .rcScrubRow{display:flex;align-items:center;gap:6px}
#rcorePanel .rcScrubRow>button{height:24px;width:24px;flex-shrink:0;border-radius:6px;border:1px solid #22363a;background:#132428;color:#e2ecec;cursor:pointer;font-size:13px;line-height:1;padding:0;min-height:0}
#rcorePanel .rcScrubRow>button[disabled]{color:#22363a;cursor:default}
#rcorePanel .rcScrubIn{position:relative;flex:1}
#rcorePanel .rcScrubIn input[type=range]{width:100%;accent-color:#C9A227}
#rcorePanel .rcTicks{position:relative;height:6px;margin-top:2px}
#rcorePanel .rcTicks i{position:absolute;top:0;width:2px;height:6px;transform:translateX(-1px)}
#rcorePanel .rcPresets{display:flex;flex-wrap:wrap;gap:8px}
#rcorePanel .rcPreset{font-size:11px;padding:4px 10px;border-radius:999px;border:1px solid #22363a;background:#132428;color:#C9A227;cursor:pointer;min-height:0}
#rcorePanel .rcPreset.on{border-color:#C9A227;background:#C9A22722}
#rcorePanel .rcChips{display:flex;flex-wrap:wrap;gap:6px;font-size:11px}
#rcorePanel .rcChip{display:inline-flex;align-items:baseline;gap:4px;border-radius:6px;border:1px solid #22363a;padding:2px 8px;min-height:0}
#rcorePanel button.rcChip{cursor:pointer}
#rcorePanel .rcNum{font-family:ui-monospace,monospace;font-weight:700}
#rcorePanel .rcMutedSpan{color:#8fa3a6}
#rcorePanel .rcSummary{font-size:12px;color:#e2ecec;line-height:1.5}
#rcorePanel .rcMuted{font-size:12px;color:#8fa3a6;margin:0}
#rcorePanel .rcH3{font-size:11px;font-weight:600;color:#8fa3a6;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;cursor:inherit}
#rcorePanel .rcRowBetween{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
#rcorePanel .rcModes{display:inline-flex;border:1px solid #22363a;border-radius:8px;overflow:hidden}
#rcorePanel .rcMode{font-size:11px;padding:4px 10px;border:0;background:#101e22;color:#8fa3a6;cursor:pointer;min-height:0}
#rcorePanel .rcMode.on{background:#C9A22722;color:#C9A227}
#rcorePanel .rcKiList{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
#rcorePanel .rcKiList li{display:flex;align-items:center;gap:8px;font-size:12px}
#rcorePanel .rcKi{font-family:ui-monospace,monospace;font-size:10px;color:#8fa3a6;min-width:18px}
#rcorePanel .rcKiT{flex:1;min-width:0;color:#e2ecec}
#rcorePanel .rcImp{font-size:9px;font-weight:700;border-radius:4px;padding:1px 6px;border:1px solid}
#rcorePanel .rcImpRow{display:flex;justify-content:flex-end}
#rcorePanel .rcDiff{border:1px solid #22363a;border-radius:8px;background:#132428;padding:8px 10px}
#rcorePanel .rcDiff p{margin:0;font-size:12px;line-height:1.7;color:#e2ecec}
#rcorePanel .rcDiff del{border-radius:3px;background:rgba(251,113,133,.2);padding:0 2px;color:#fca5b5;text-decoration:line-through}
#rcorePanel .rcDiff ins{border-radius:3px;background:rgba(52,211,153,.2);padding:0 2px;color:#6ee7b7;text-decoration:none}
#rcorePanel .rcSbs{display:grid;grid-template-columns:1fr;gap:8px}
@media(min-width:560px){#rcorePanel .rcSbs{grid-template-columns:1fr 1fr}}
#rcorePanel .rcSbsLab{font-size:10px;color:#8fa3a6;margin-bottom:4px;font-family:ui-monospace,monospace}
#rcorePanel .rcNav{display:flex;align-items:center;justify-content:center;gap:12px;font-size:12px;color:#8fa3a6}
#rcorePanel .rcNav button{font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #22363a;background:#101e22;color:#C9A227;cursor:pointer;min-height:0}
#rcorePanel .rcNav button[disabled]{color:#22363a;cursor:default}
#rcorePanel .rcTableWrap{overflow-x:auto;margin-top:8px}
#rcorePanel table{width:100%;border-collapse:collapse;font-size:11px}
#rcorePanel th,#rcorePanel td{border-bottom:1px solid #22363a;padding:4px 8px;vertical-align:top;text-align:left}
#rcorePanel th{color:#8fa3a6}
#rcorePanel .rcMono{font-family:ui-monospace,monospace}
#rcorePanel .rcList{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
#rcorePanel .rcItem{display:block;width:100%;text-align:left;cursor:pointer;border-radius:8px;border:1px solid #22363a;background:#101e22;padding:8px 10px;min-height:0;color:inherit}
#rcorePanel .rcItem.b{border-color:#C9A227;background:#C9A22714}
#rcorePanel .rcItem.a{border-color:#C9A22766}
#rcorePanel .rcItemTop{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#rcorePanel .rcRev{font-family:ui-monospace,monospace;font-size:12px;font-weight:700}
#rcorePanel .rcKind{font-size:9px;text-transform:uppercase;letter-spacing:.06em;border-radius:4px;padding:1px 6px;border:1px solid}
#rcorePanel .rcDate{font-size:10px;color:#8fa3a6;font-family:ui-monospace,monospace}
#rcorePanel .rcAB{margin-left:auto;font-size:9px;font-weight:700}
#rcorePanel .rcItemT{margin-top:3px;font-size:12px;color:#e2ecec;line-height:1.45}
#rcorePanel .rcCite{margin-top:4px;display:flex;flex-wrap:wrap;align-items:center;gap:5px}
#rcorePanel .rcD{font-size:9px;font-family:ui-monospace,monospace;color:#a78bfa;border:1px solid #a78bfa55;border-radius:4px;padding:0 5px;line-height:15px}
#rcorePanel .rcCommit{font-size:10px;color:#34d399;font-family:ui-monospace,monospace}"""

ENGINE = r"""/* ───────────────────────────────────────────────────────────────────────────────────────────────
   r.210 · R-CORE ON THE RANGE (DD-49). Operator 2026-10-14: "Also, not seeing RCORE LOGO TO SEE
   HISTORY CHAIN", and asked where it belongs: "icon at bottom" · "same as all other rcore single
   links at bottom below Target Approve, Fire".

   INVARIANT: the range's R-CORE history is the SAME history, in the same words and the same
   two-click shape, as every other 2525 surface — reached by an icon at the bottom of the glass,
   fed by the shared ledger, never hand-typed and never covering the picture.

   This is a PORT, not a reinvention. Every function below is the plain-JS twin of a named export
   of frontend/lib/2525-core/revisions.ts or frontend/lib/version-diff.ts, carrying the same
   behaviour field for field; tests/deck-rcore.test.mjs holds them to the shared engine's own
   output on 386 captured vectors. The deck has no bundler and no lexicon, so the engine is inlined
   and the words are the English of the 52 rcore.* lexicon keys, verbatim; the ×33 fill is listed in
   AFTER_FILL and owed (his law: no translation fill before the English is final).

   r.195 did this wrongly — a hand-typed five-row history constant and a fixed badge at z-index 9 over the
   dock — and r.196's restore removed both. This has been owed since, and deferred at every revision
   from r.196 to r.209: thirteen times. It is my debt, not a new ask.
   ─────────────────────────────────────────────────────────────────────────────────────────────── */

/* ── version-diff.ts ───────────────────────────────────────────────────────────────────────── */
/* DIFF_CAP: the one LCS cap, 3000, shared by every surface (version-diff.ts:17). */
function rcStripBidi(s){ return String(s||'').replace(/[‪-‮⁦-⁩‎‏​-‍﻿]/g,''); }
function rcEscHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function rcEscAttr(s){ return rcEscHtml(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function rcTokenize(text){
  return (String(text||'').match(/[぀-ヿ㐀-鿿가-힯豈-﫿]|[0-9]+(?:[.,][0-9]+)*|[^\s぀-ヿ㐀-鿿가-힯豈-﫿]+/g)||[]);
}
/* Longest-common-subsequence token diff. null above the cap. The tie-break is LOAD-BEARING:
   dp[i+1][j] >= dp[i][j+1] emits the DELETION first on a tie, which is what makes the deck's
   output byte-identical to the shared engine's. */
function rcDiffTokens(a,b,cap){
  cap = (cap===undefined) ? 3000 : cap;
  var n=a.length, m=b.length, i, j;
  if(n>cap||m>cap) return null;
  var dp=[]; for(i=0;i<=n;i++) dp.push(new Uint16Array(m+1));
  for(i=n-1;i>=0;i--) for(j=m-1;j>=0;j--)
    dp[i][j] = a[i]===b[j] ? dp[i+1][j+1]+1 : (dp[i+1][j]>=dp[i][j+1] ? dp[i+1][j] : dp[i][j+1]);
  var ops=[]; i=0; j=0;
  while(i<n&&j<m){
    if(a[i]===b[j]){ ops.push({t:0,s:a[i]}); i++; j++; }
    else if(dp[i+1][j]>=dp[i][j+1]){ ops.push({t:-1,s:a[i]}); i++; }
    else { ops.push({t:1,s:b[j]}); j++; }
  }
  while(i<n) ops.push({t:-1,s:a[i++]});
  while(j<m) ops.push({t:1,s:b[j++]});
  return ops;
}
function rcDiffText(oldText,newText,cap){ return rcDiffTokens(rcTokenize(oldText||''),rcTokenize(newText||''),cap===undefined?3000:cap); }
function rcSideBySide(ops){
  if(!ops) return null;
  var left='', right='';
  for(var k=0;k<ops.length;k++){ var o=ops[k], e=rcEscHtml(rcStripBidi(o.s));
    if(o.t===0){ left+=e+' '; right+=e+' '; }
    else if(o.t===-1){ left+='<del>'+e+'</del> '; }
    else { right+='<ins>'+e+'</ins> '; } }
  return {left:left.trim(),right:right.trim()};
}
function rcUnified(ops){
  if(!ops) return null;
  var out='';
  for(var k=0;k<ops.length;k++){ var o=ops[k], e=rcEscHtml(rcStripBidi(o.s));
    if(o.t===0) out+=e+' '; else if(o.t===-1) out+='<del>'+e+'</del> '; else out+='<ins>'+e+'</ins> '; }
  return out.trim();
}

/* ── revisions.ts ──────────────────────────────────────────────────────────────────────────── */
/* No model name ever reaches the glass — the ledger keeps its words, the render redacts. */
var RC_MODEL_RE=/\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?/gi;
function rcRedact(s){ return String(s==null?'':s).replace(RC_MODEL_RE,'an external model'); }
function rcFirstSentence(text,max){
  max = (max===undefined) ? 100 : max;
  var s=String(text==null?'':text).replace(/\s+/g,' ').trim();
  if(!s) return '';
  var stop=s.search(/[.!?](\s|$)/);
  var head = stop>=0 ? s.slice(0,stop+1) : s;
  if(head.length>max) head=head.slice(0,max-1).replace(/\s+$/,'')+'…';
  return head;
}
function rcFromLedger(json){
  var entries=(json&&Array.isArray(json.entries))?json.entries:[];
  var revisions=entries.map(function(e){
    var text=rcRedact(String(e.text==null?'':e.text));
    var c=String(e.commit==null?'':e.commit).trim();
    return {rev:String(e.rev==null?'':e.rev),date:String(e.date==null?'':e.date),
            kind:e.kind?String(e.kind):undefined,title:rcFirstSentence(text),detail:text,
            commit:c?c:undefined};
  });
  return {surface:String((json&&json.section)==null?'':json.section),
          route:String((json&&json.route)==null?'':json.route),
          current:revisions.length?revisions[revisions.length-1].rev:'',revisions:revisions};
}
var RC_IMPACT_RANK={L1:1,L2:2,L3:3,L4:4,L5:5};
/* NOT a kind->impact lookup: the TEXT decides L5 and L4 before the kind is consulted. Nine of the
   drone ledger's rows differ from a naive ladder, which is the first thing a careless port gets wrong. */
function rcImpactOf(r){
  var t=String((r&&r.detail)||'').toLowerCase();
  if(/\binvariant\b|\bauthority\b|\bgovernance\b|\bconstitution|\bontolog|never fires|human approv/.test(t)) return 'L5';
  if(r&&r.kind==='correction') return 'L4';
  if(/\beconomic|\bfunding\b|\bescrow\b|\blegal\b|\bquote\b/.test(t)) return 'L4';
  if(r&&r.kind==='release') return 'L3';
  if(r&&r.kind==='decision') return 'L2';
  return 'L1';
}
var RC_CATEGORY_RULES=[
  [/\bgovernance\b|\bauthority\b|\bapprov|\bhuman\b/,'governance'],
  [/\beconomic|\bfunding\b|\bcost\b|\bbudget\b|\bnpv\b|\brevenue\b/,'economics'],
  [/\bsecurity\b|\bsybil\b|\bpii\b/,'security'],
  [/\bgate\b|\bqualif|\bpilot\b|\brisk\b/,'qualification'],
  [/\bdeterminism\b|\breplay\b|\bhash\b|\bseed\b/,'determinism'],
  [/\blexicon\b|\bi18n\b|\blanguage\b|\btranslat/,'translation']
];
function rcTagsOf(revs){
  var text=revs.map(function(r){ return (r&&r.detail)||''; }).join(' ').toLowerCase(), out=[];
  for(var i=0;i<RC_CATEGORY_RULES.length;i++) if(RC_CATEGORY_RULES[i][0].test(text)) out.push(RC_CATEGORY_RULES[i][1]);
  if(revs.some(function(r){ return r&&r.kind==='correction'; })) out.push('correction');
  return out.filter(function(v,i,a){ return a.indexOf(v)===i; });
}
function rcCategoryOf(r){ var t=rcTagsOf([r]); return t.length?t[0]:'other'; }
function rcFnv1a(s){ var h=0x811c9dc5; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,0x01000193); } return (h>>>0).toString(16).padStart(8,'0'); }
function rcCompare(a,b,history){
  var revs=(history&&history.revisions)||[];
  var idx=function(rev){ for(var i=0;i<revs.length;i++) if(revs[i].rev===rev) return i; return -1; };
  var ia=idx(a), ib=idx(b);
  if(ia<0) ia=0; if(ib<0) ib=revs.length-1;
  var lo=Math.min(ia,ib), hi=Math.max(ia,ib);
  var from=revs[lo]||null, to=revs[hi]||null;
  var crossed=revs.slice(lo+1,hi+1);
  var releasesCrossed=crossed.filter(function(r){ return r.kind==='release'; }).length;
  var added=crossed.filter(function(r){ return r.kind==='ask'||r.kind==='release'; }).length;
  var revised=crossed.filter(function(r){ return r.kind==='decision'||r.kind==='correction'; }).length;
  var carried=lo+1;
  var ops=(from&&to)?rcDiffText(from.detail||'',to.detail||''):null;
  var sbs=rcSideBySide(ops);
  var impact=crossed.length?crossed.reduce(function(acc,r){ var i=rcImpactOf(r); return RC_IMPACT_RANK[i]>RC_IMPACT_RANK[acc]?i:acc; },'L1'):'L1';
  var full=crossed.map(function(r,i){ return {rev:r.rev,title:r.title,kind:r.kind||'',impact:rcImpactOf(r),category:rcCategoryOf(r),i:i}; });
  var strip=function(c){ return {rev:c.rev,title:c.title,kind:c.kind,impact:c.impact,category:c.category}; };
  var perCrossed=full.map(strip);
  var top=full.slice().sort(function(x,y){ return (RC_IMPACT_RANK[y.impact]-RC_IMPACT_RANK[x.impact])||(y.i-x.i); }).slice(0,7).map(strip);
  var sectionsAffected=rcTagsOf(crossed);
  var highestImpactAreas=full.filter(function(c){ return c.impact==='L4'||c.impact==='L5'; }).map(function(c){ return c.category; })
    .filter(function(v,i,a){ return a.indexOf(v)===i; }).slice(0,4);
  var compareHash=rcFnv1a(((from&&from.rev)||'')+'->'+((to&&to.rev)||'')+'|'+crossed.length+'|'+releasesCrossed+'|'+(ops?ops.length:-1));
  return {fromRev:(from&&from.rev)||'',toRev:(to&&to.rev)||'',from:from,to:to,crossed:crossed,
    releasesCrossed:releasesCrossed,added:added,revised:revised,carried:carried,ops:ops,sideBySide:sbs,
    impact:impact,impactTags:rcTagsOf(crossed),changes:crossed.length,perCrossed:perCrossed,top:top,
    sectionsAffected:sectionsAffected,highestImpactAreas:highestImpactAreas,compareHash:compareHash};
}"""

PANEL = r"""/* ── the panel · a port of components/2525-core/rcore-revision-panel.tsx (513 lines) ──────────
   Same parts, same hooks, same words: two impact-ticked scrubbers with steppers, the prev/first
   presets, the filterable stat chips, the summary line, numbered KEY IMPROVEMENTS with L1-L5 chips,
   Unified <-> Side-by-side, the change navigator, the collapsed Details table, the newest-first
   timeline with D# and commit citations, and the self-contained HTML download.
   The panel IS position:fixed by design, exactly as the React one is (inset 0, a modal scrim,
   click-scrim-to-close, max-width 640, max-height 88vh) — it is the BADGE that may never float. */
var RC_PAL={scrim:'rgba(3,10,13,0.72)',bg:'#0a1518',panel:'#101e22',raised:'#132428',ink:'#e2ecec',muted:'#8fa3a6',line:'#22363a'};
var RC_KIND_COLOR={ask:'#f0b429',decision:'#a78bfa',release:'#34d399',correction:'#fb7185'};
var RC_ACCENT='#C9A227'; /* the deck's own gold — the accent the React surfaces pass as a prop */
var RC_T={brand:'R-CORE',version_history:'Version History',icon_aria:'R-CORE — version history',
  open_aria:'Open R-CORE version history and compare',what_changed:'What changed',history:'History',
  before:'before',after:'after',added:'added',revised:'revised',carried_unchanged:'carried unchanged',
  rev_short:'rev',close:'Close',same_rev:'Same revision selected on both sides — pick two to see what changed.',
  too_large:'These revisions are too large for a word-level view — see the timeline below.',
  fewer_than_two:'Fewer than two revisions on record — nothing to compare yet.',
  download:'Download this history (HTML)',vs_previous:'vs previous',first_vs_latest:'v1 vs latest',
  crossed_suffix:'crossed',across:'across',change_one:'change',change_many:'changes',
  section_one:'section',section_many:'sections',release_one:'release',release_many:'releases',
  highest_impact:'highest impact',append_only:'append-only',removed:'removed',
  key_improvements:'Key improvements',unified:'Unified',side_by_side:'Side by side',
  prev_change:'Previous change',next_change:'Next change',details:'Details',filtered:'Filtered',
  revision_col:'Revision',kind_col:'Kind',impact_col:'Impact',date_col:'Date',reason_col:'Reason',
  latest_release:'latest release',historical_release:'historical release',
  impact:{L1:'L1 · editorial',L2:'L2 · clarification',L3:'L3 · functional',L4:'L4 · governance / economic',L5:'L5 · constitutional'}};
function rcKindColor(k){ return (k&&RC_KIND_COLOR[k])||RC_PAL.muted; }
function rcImpactColor(i){ return i==='L5'?'#a78bfa':i==='L4'?'#f0b429':i==='L3'?RC_ACCENT:RC_PAL.muted; }
function rcRevLabel(r){ return 'r'+r.rev+(r.date?' · '+r.date:'')+(r.kind?' · '+r.kind:''); }
function rcDecisionsOf(r){ var m=String((r&&r.detail)||'').match(/\bD\d+\b/g)||[]; return m.filter(function(v,i,a){ return a.indexOf(v)===i; }); }
/* the panel's own state — module-level, like the React component's useState */
var RCP={a:0,b:0,mode:'unified',filter:null,nav:0,open:false,stage:0,h:null};

function rcHistory(){ if(!RCP.h) RCP.h=rcFromLedger(RCORE_LEDGER); return RCP.h; }

function rcPanelHtml(){
  var H=rcHistory(), revs=H.revisions, n=revs.length, T=RC_T, A=RC_ACCENT, E=rcEscHtml;
  var head='<div data-rcore-header class="rcHead">'
    +'<div class="rcHeadMid"><img id="rcHeadImg" src="" alt="'+rcEscAttr(T.brand)+'"/>'
    +'<div class="rcHeadSub">'+E(T.version_history)+' · '+E(H.surface||'—')+(H.route?' · '+E(H.route):'')+' · '+n+' '+E(T.rev_short)+'</div></div>'
    +'<div class="rcHeadBtns">'
    +'<button data-rcore-download type="button" id="rcDl" aria-label="'+rcEscAttr(T.download)+'" title="'+rcEscAttr(T.download)+'">'
    +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg></button>'
    +'<button data-rcore-close type="button" id="rcX" aria-label="'+rcEscAttr(T.close)+'">×</button>'
    +'</div></div>';
  if(n<2) return head+'<p class="rcEmpty">'+E(T.fewer_than_two)+'</p>';
  var aI=Math.max(0,Math.min(RCP.a,n-2)), bI=Math.max(1,Math.min(RCP.b,n-1));
  var cmp=rcCompare(revs[aI].rev,revs[bI].rev,H), same=cmp.fromRev===cmp.toRev;
  var out=[head,'<div class="rcBody">'];
  /* latest / historical tag */
  out.push('<div><span class="rcTag'+(bI===n-1?' on':'')+'">'+E(rcRevLabel(revs[bI]))+' · '+E(bI===n-1?T.latest_release:T.historical_release)+'</span></div>');
  /* the two scrubbers + the presets */
  var ticks=function(side){ var s=''; for(var i=0;i<n;i++){ var im=rcImpactOf(revs[i]);
      s+='<i style="left:'+(n>1?(i/(n-1))*100:0)+'%;background:'+((im==='L5'||im==='L4')?'#f0b429':RC_PAL.line)+'"></i>'; }
    return '<div data-rcore-ticks="'+side+'" class="rcTicks" aria-hidden="true">'+s+'</div>'; };
  var scrub=function(side,label,val,mn,mx){
    return '<div data-rcore-scrub="'+side+'"><div class="rcScrubLab">'+E(label)+'</div><div class="rcScrubRow">'
      +'<button data-rcore-step="'+side+'-prev" type="button" aria-label="step back"'+(val<=mn?' disabled':'')+'>‹</button>'
      +'<div class="rcScrubIn"><input data-testid="rcore-select-'+side+'" id="rcSel'+side.toUpperCase()+'" type="range" min="'+mn+'" max="'+mx+'" step="1" value="'+val+'" aria-label="'+(side==='a'?'Before release':'After release')+'"/>'
      +ticks(side)+'</div>'
      +'<button data-rcore-step="'+side+'-next" type="button" aria-label="step forward"'+(val>=mx?' disabled':'')+'>›</button></div></div>'; };
  out.push('<div class="rcPick">'
    +scrub('a',T.before+' · r'+revs[aI].rev+(revs[aI].title?' · '+revs[aI].title:''),aI,0,n-2)
    +scrub('b',T.after+' · r'+revs[bI].rev+(revs[bI].title?' · '+revs[bI].title:'')+(bI===n-1?' (current)':''),bI,1,n-1)
    +'<div class="rcPresets">'
    +'<button data-rcore-preset="prev" type="button" aria-pressed="'+((aI===n-2&&bI===n-1&&aI!==0)?'true':'false')+'" class="rcPreset'+((aI===n-2&&bI===n-1&&aI!==0)?' on':'')+'">'+E(T.vs_previous)+'</button>'
    +'<button data-rcore-preset="first" type="button" aria-pressed="'+((aI===0&&bI===n-1)?'true':'false')+'" class="rcPreset'+((aI===0&&bI===n-1)?' on':'')+'">'+E(T.first_vs_latest)+'</button>'
    +'</div></div>');
  if(same){ out.push('<p class="rcMuted">'+E(T.same_rev)+'</p>'); }
  else {
    /* stat chips */
    var chip=function(stat,label,value,color,active,btn,valueFirst){
      var inner=valueFirst?('<span class="rcNum" style="color:'+color+'">'+value+'</span><span class="rcMutedSpan">'+E(label)+'</span>')
                          :('<span class="rcMutedSpan">'+E(label)+'</span><span class="rcNum" style="color:'+color+'">'+value+'</span>');
      var st='border-color:'+(active?color:RC_PAL.line)+';background:'+(active?color+'18':'transparent');
      return btn?('<button data-rcore-stat="'+stat+'" type="button" aria-pressed="'+(active?'true':'false')+'" class="rcChip" style="'+st+'">'+inner+'</button>')
                :('<span data-rcore-stat="'+stat+'" class="rcChip" style="'+st+'">'+inner+'</span>'); };
    var chips='';
    if(cmp.added>0) chips+=chip('added',T.added,cmp.added,'#34d399',RCP.filter==='added',true,false);
    if(cmp.revised>0) chips+=chip('revised',T.revised,cmp.revised,'#f0b429',RCP.filter==='revised',true,false);
    chips+=chip('carried',T.carried_unchanged,cmp.carried,RC_PAL.muted,false,false,false);
    chips+=chip('releases',(cmp.releasesCrossed===1?T.release_one:T.release_many)+' '+T.crossed_suffix,cmp.releasesCrossed,RC_PAL.muted,false,false,true);
    out.push('<div data-rcore-sum class="rcChips">'+chips+'</div>');
    /* summary line */
    out.push('<div data-rcore-summary class="rcSummary"><b style="color:'+A+'">'+cmp.changes+'</b> '+E(cmp.changes===1?T.change_one:T.change_many)
      +' '+E(T.across)+' <b>'+cmp.sectionsAffected.length+'</b> '+E(cmp.sectionsAffected.length===1?T.section_one:T.section_many)
      +(cmp.highestImpactAreas.length?(' · '+E(T.highest_impact)+': <span style="color:#f0b429">'+E(cmp.highestImpactAreas.join(', '))+'</span>'):'')
      +' · '+E(T.removed)+' 0 — '+E(T.append_only)+'</div>');
    /* key improvements */
    if(cmp.top.length){
      var li='';
      for(var k=0;k<cmp.top.length;k++){ var it=cmp.top[k], c=rcImpactColor(it.impact);
        li+='<li data-rcore-keyimp-item data-impact="'+it.impact+'"><span class="rcKi">'+String(k+1).padStart(2,'0')+'</span>'
          +'<span class="rcKiT">'+E(it.title||('r'+it.rev))+'</span>'
          +'<span class="rcImp" title="'+rcEscAttr(it.category)+'" style="border-color:'+c+';color:'+c+'">'+it.impact+'</span></li>'; }
      out.push('<div><div class="rcH3">'+E(T.key_improvements)+' · r'+E(cmp.fromRev)+' → r'+E(cmp.toRev)+'</div><ul data-rcore-keyimp class="rcKiList">'+li+'</ul></div>');
    }
    /* what changed */
    out.push('<div><div class="rcRowBetween"><span class="rcH3">'+E(T.what_changed)+'</span>'
      +'<span role="group" class="rcModes">'
      +'<button data-rcore-mode="cmpVU" type="button" aria-pressed="'+(RCP.mode==='unified'?'true':'false')+'" class="rcMode'+(RCP.mode==='unified'?' on':'')+'">'+E(T.unified)+'</button>'
      +'<button data-rcore-mode="cmpVS" type="button" aria-pressed="'+(RCP.mode==='side'?'true':'false')+'" class="rcMode'+(RCP.mode==='side'?' on':'')+'">'+E(T.side_by_side)+'</button>'
      +'</span></div>');
    if(cmp.ops===null) out.push('<p class="rcMuted">'+E(T.too_large)+'</p>');
    else if(RCP.mode==='unified') out.push('<div class="rcDiff"><p>'+(rcUnified(cmp.ops)||'&mdash;')+'</p></div>');
    else out.push('<div class="rcSbs">'
      +'<div class="rcDiff"><div class="rcSbsLab">'+E(T.before)+' · r'+E(cmp.fromRev)+'</div><p>'+((cmp.sideBySide&&cmp.sideBySide.left)||'&mdash;')+'</p></div>'
      +'<div class="rcDiff"><div class="rcSbsLab">'+E(T.after)+' · r'+E(cmp.toRev)+'</div><p>'+((cmp.sideBySide&&cmp.sideBySide.right)||'&mdash;')+'</p></div></div>');
    out.push('</div>');
    /* change navigator */
    if(cmp.perCrossed.length>1) out.push('<div class="rcNav">'
      +'<button data-rcore-nav="prev" type="button"'+(RCP.nav<=0?' disabled':'')+'>‹ '+E(T.prev_change)+'</button>'
      +'<span class="rcNum">'+(RCP.nav+1)+' / '+cmp.perCrossed.length+'</span>'
      +'<button data-rcore-nav="next" type="button"'+(RCP.nav>=cmp.perCrossed.length-1?' disabled':'')+'>'+E(T.next_change)+' ›</button></div>');
    /* details */
    var shown=cmp.perCrossed;
    if(RCP.filter==='added') shown=shown.filter(function(c){ return c.kind==='ask'||c.kind==='release'; });
    else if(RCP.filter==='revised') shown=shown.filter(function(c){ return c.kind==='decision'||c.kind==='correction'; });
    else if(RCP.filter==='removed') shown=[];
    var rows='';
    for(var d=0;d<shown.length;d++){ var c2=shown[d], rr=null;
      for(var z=0;z<revs.length;z++) if(revs[z].rev===c2.rev){ rr=revs[z]; break; }
      rows+='<tr><td class="rcMono" style="color:'+A+'">r'+E(c2.rev)+'</td><td style="color:'+rcKindColor(c2.kind)+'">'+E(c2.kind||'—')+'</td>'
        +'<td><span style="color:'+rcImpactColor(c2.impact)+';font-weight:700">'+c2.impact+'</span></td>'
        +'<td class="rcMono rcMutedSpan">'+E((rr&&rr.date)||'')+'</td><td>'+E(c2.title||'')+'</td></tr>'; }
    if(!shown.length) rows='<tr><td colspan="5" class="rcMutedSpan">—</td></tr>';
    out.push('<details data-rcore-details><summary class="rcH3">'+E(T.details)+(RCP.filter?(' · '+E(T.filtered)+': '+E(T[RCP.filter]||RCP.filter)):'')+'</summary>'
      +'<div class="rcTableWrap"><table><thead><tr><th>'+E(T.revision_col)+'</th><th>'+E(T.kind_col)+'</th><th>'+E(T.impact_col)+'</th><th>'+E(T.date_col)+'</th><th>'+E(T.reason_col)+'</th></tr></thead><tbody>'+rows+'</tbody></table></div></details>');
  }
  /* the timeline — newest first; tap to set After */
  var items='';
  for(var i2=n-1;i2>=0;i2--){ var r=revs[i2], isB=r.rev===cmp.toRev, isA=r.rev===cmp.fromRev, ds=rcDecisionsOf(r);
    var cite='';
    if(ds.length||r.commit){ cite='<div class="rcCite">';
      for(var q=0;q<ds.length;q++) cite+='<span class="rcD">'+rcEscHtml(ds[q])+'</span>';
      if(r.commit) cite+='<span class="rcCommit" title="'+rcEscAttr(RC_T.rev_short)+'"><span aria-hidden="true">⎇ </span>'+rcEscHtml(r.commit)+'</span>';
      cite+='</div>'; }
    items+='<li><button type="button" data-rcore-pick="'+rcEscAttr(r.rev)+'" title="'+rcEscAttr(rcRevLabel(r))+'" class="rcItem'+(isB?' b':isA?' a':'')+'">'
      +'<div class="rcItemTop"><span class="rcRev" style="color:'+A+'">r'+rcEscHtml(r.rev)+'</span>'
      +(r.kind?('<span class="rcKind" style="border-color:'+rcKindColor(r.kind)+';color:'+rcKindColor(r.kind)+'">'+rcEscHtml(r.kind)+'</span>'):'')
      +'<span class="rcDate">'+rcEscHtml(r.date)+'</span>'
      +((isA||isB)?('<span class="rcAB" style="color:'+A+'">'+(isB?RC_T.after:RC_T.before).toUpperCase()+'</span>'):'')
      +'</div><div class="rcItemT">'+rcEscHtml(r.title)+'</div>'+cite+'</button></li>'; }
  out.push('<div><div class="rcH3">'+E(RC_T.history)+'</div><ol data-rcore-list class="rcList">'+items+'</ol></div>');
  if(!same) out.push('<div class="rcImpRow"><span data-rcore-impact class="rcImp" style="border-color:'+rcImpactColor(cmp.impact)+'55;color:'+rcImpactColor(cmp.impact)+'">'+E(RC_T.impact[cmp.impact])+'</span></div>');
  out.push('</div>');
  return out.join('');
}

/* the self-contained HTML download — the living document's down-arrow, deterministic (no clock, no random) */
function rcDownloadHtml(history,cmp){
  var revs=history.revisions||[], surface=rcEscHtml(history.surface||'surface');
  var vmax=revs.length?revs[revs.length-1].rev:'';
  var rowsLedger='';
  for(var i=revs.length-1;i>=0;i--){ var r=revs[i];
    var ds=(String(r.detail==null?'':r.detail).match(/\bD\d+\b/g)||[]).filter(function(v,k,a){ return a.indexOf(v)===k; }).join(' ');
    rowsLedger+='<tr><td class=m>r'+rcEscHtml(r.rev)+'</td><td>'+rcEscHtml(r.date||'')+'</td><td>'+rcEscHtml(r.kind||'')+'</td><td>'+rcEscHtml(r.title||'')+'</td><td class=d>'+rcEscHtml(ds)+'</td><td class=m>'+rcEscHtml(r.commit||'')+'</td></tr>'; }
  var keyimp='';
  for(var k2=0;k2<cmp.top.length;k2++){ var it=cmp.top[k2];
    keyimp+='<li><span class=rk>'+String(k2+1).padStart(2,'0')+'</span> '+rcEscHtml(it.title||('r'+it.rev))+' <span class="imp '+it.impact+'">'+it.impact+'</span></li>'; }
  var diff=rcUnified(cmp.ops)||'—';
  var hi=cmp.highestImpactAreas.length?(' · highest impact: '+rcEscHtml(cmp.highestImpactAreas.join(', '))):'';
  var summary=cmp.changes+' change'+(cmp.changes===1?'':'s')+' across '+cmp.sectionsAffected.length+' section'+(cmp.sectionsAffected.length===1?'':'s')+hi+' · removed 0 — append-only';
  var A=RC_ACCENT;
  return '<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">\n'
   +'<title>R-CORE · '+surface+' · Version History (r'+rcEscAttr(vmax)+')</title>\n<style>\n'
   +':root{color-scheme:dark}\nbody{margin:0;background:#0a1518;color:#e2ecec;font:14px/1.6 ui-sans-serif,system-ui,sans-serif;padding:24px 16px}\n'
   +'.wrap{max-width:820px;margin:0 auto}\nh1{font-size:16px;letter-spacing:.06em;color:'+rcEscAttr(A)+';margin:0 0 4px}\n'
   +'.sub{color:#8fa3a6;font-size:12px;font-family:ui-monospace,monospace;margin-bottom:18px}\n'
   +'h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#8fa3a6;margin:20px 0 8px;border-bottom:1px solid #22363a;padding-bottom:4px}\n'
   +'table{width:100%;border-collapse:collapse;font-size:12px}\nth,td{border-bottom:1px solid #22363a;padding:5px 8px;text-align:left;vertical-align:top}\nth{color:#8fa3a6}\n'
   +'.m{font-family:ui-monospace,monospace}\ntd.m{color:'+rcEscAttr(A)+'}\ntd.d{color:#a78bfa;font-family:ui-monospace,monospace}\n'
   +'.cmp{border:1px solid #22363a;border-radius:8px;background:#101e22;padding:10px 12px}\n.sum{color:#e2ecec;margin:0 0 8px}\n'
   +'ol.ki{list-style:none;margin:0;padding:0}\nol.ki li{display:flex;align-items:center;gap:8px;padding:2px 0}\n'
   +'.rk{font-family:ui-monospace,monospace;color:#8fa3a6;font-size:11px}\n'
   +'.imp{font-size:10px;font-weight:700;border:1px solid;border-radius:4px;padding:1px 5px;margin-left:auto}\n'
   +'.imp.L5{color:#a78bfa;border-color:#a78bfa}.imp.L4{color:#f0b429;border-color:#f0b429}.imp.L3{color:'+rcEscAttr(A)+';border-color:'+rcEscAttr(A)+'}.imp.L2,.imp.L1{color:#8fa3a6;border-color:#8fa3a6}\n'
   +'.diff{background:#132428;border-radius:8px;padding:8px 10px;line-height:1.7}\n'
   +'.diff del{background:rgba(251,113,133,.2);color:#fca5b5;border-radius:3px;padding:0 2px}\n'
   +'.diff ins{background:rgba(52,211,153,.2);color:#6ee7b7;text-decoration:none;border-radius:3px;padding:0 2px}\n'
   +'.foot{color:#8fa3a6;font-size:11px;margin-top:24px;border-top:1px solid #22363a;padding-top:10px}\n'
   +'</style></head><body><div class=wrap>\n<h1>⊕ R-CORE · Version History</h1>\n'
   +'<div class=sub>'+surface+(history.route?(' · '+rcEscHtml(history.route)):'')+' · '+revs.length+' revisions · HEAD r'+rcEscHtml(vmax)+'</div>\n'
   +'<h2>Current comparison — r'+rcEscHtml(cmp.fromRev)+' → r'+rcEscHtml(cmp.toRev)+'</h2>\n'
   +'<div class=cmp>\n<p class=sum>'+rcEscHtml(summary)+'</p>\n<ol class=ki>'+keyimp+'</ol>\n</div>\n'
   +'<h2>What changed — r'+rcEscHtml(cmp.fromRev)+' → r'+rcEscHtml(cmp.toRev)+'</h2>\n<div class=diff>'+diff+'</div>\n'
   +'<h2>Full record — every revision, newest first (append-only)</h2>\n'
   +'<table><thead><tr><th>Revision</th><th>Date</th><th>Kind</th><th>What changed</th><th>Decisions</th><th>Commit</th></tr></thead><tbody>'+rowsLedger+'</tbody></table>\n'
   +'<div class=foot>R-CORE revision record · one self-contained file · read offline · nothing here executes. Impact ladder L1 editorial · L2 clarification · L3 functional · L4 governance/economic · L5 constitutional.</div>\n'
   +'</div></body></html>';
}"""

BADGE = r"""/* ── the badge · a port of components/2525-core/rcore-badge.tsx ───────────────────────────────
   REST    -> the operator's framed reticle raster, at the bottom of the glass
   CLICK 1 -> it becomes the R-CORE wordmark pill
   CLICK 2 -> the version history + compare panel
   Escape dismisses: the panel first, then the pill back to the icon. Exactly the 2026-09-25
   two-click badge, with his own artwork used as-is (never a glyph or a CSS recreation).

   WHERE IT SITS, and why this is not the React component's "normal flow" row. On a React page the
   badge is the last row of a scrolling document. The deck is not a document: it is one fixed
   viewport whose entire bottom chrome - TARGET / APPROVE / FIRE (#face), the stick, the magazine
   line, the stop light - is a positioned layer over the canvas, and its only flow slot (the #app
   grid's dock row) is display:none at 0px, so filling it would shrink HIS PICTURE by ~54px. So the
   badge joins that same control layer, in the band his instruction names, and the rule the React
   assertion stood for is kept by MEASUREMENT instead of by a string: the badge never overlaps a
   control and never leaves the picture, at four viewports, proven by RCORE_NEVER_COVERS_THE_PICTURE.
   Measured on the shipped r.209 bytes: below #face there are 72 px in portrait (390x844, 375x667,
   428x926) and only 20 px in landscape (844x390, 667x375) - which is why the placement is computed
   by placeRcore() the way placeFace() computes its own: measured, never guessed. */
function placeRcore(){
  var g=document.getElementById('rcoreBadge'), f=document.getElementById('face'), st=document.getElementById('stage');
  if(!g||!f||!st) return null;
  var vis=function(e){ if(!e) return null; var cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden') return null;
    var r=e.getBoundingClientRect(); return (r.width>0&&r.height>0)?r:null; };
  var fr=vis(f); if(!fr){ g.style.display='none'; state.rcoreBox=null; return null; }
  g.style.display='flex';
  g.style.left='0px'; g.style.top='0px'; g.style.right='auto'; g.style.bottom='auto'; g.style.transform='none';
  var o=g.getBoundingClientRect(), gw=o.width, gh=o.height;
  var sr=st.getBoundingClientRect(), M=4, GAP=6, vw=innerWidth, vh=innerHeight;
  /* WHAT IT MUST NOT TOUCH: the deck's own controls over the canvas, by the same id list hudKeepOut() keeps —
     the badge is in that list too and is skipped here. Enumerating is not enough on its own, so the boot row
     RCORE_NEVER_COVERS_THE_PICTURE checks the RESULT against every visible box on the page. */
  var busy=[];
  ['face','joyR','joyL','magReload','posWell','startLight','btnFull','btnOps','btnMore','kebab','playHud','phDes','phScore','magBar','board','toast']
    .forEach(function(id){ var r=vis(document.getElementById(id)); if(r) busy.push(r); });
  var cap=vis(document.querySelector('#magWell .body')); if(cap) busy.push(cap);
  var hits=function(x,y){ for(var i=0;i<busy.length;i++){ var r=busy[i];
      if(x<r.right&&x+gw>r.left&&y<r.bottom&&y+gh>r.top) return true; } return false; };
  /* the first free x on this line: the preferred one if it is clear, else the gaps, left to right */
  var freeX=function(y,prefer){
    if(prefer!=null&&prefer>=M&&prefer+gw<=vw-M&&!hits(prefer,y)) return prefer;
    var band=busy.filter(function(r){ return r.top<y+gh&&r.bottom>y; }).slice().sort(function(a,b){ return a.left-b.left; });
    var x=M;
    for(var i=0;i<band.length;i++){ if(x+gw<=band[i].left-GAP) break; x=Math.max(x,band[i].right+GAP); }
    return (x+gw<=vw-M&&!hits(x,y))?x:null;
  };
  var floor=Math.min(vh,sr.bottom)-M, x=null, y, where;
  if(floor-(fr.bottom+GAP)>=gh){                     /* PORTRAIT: his words exactly - below the buttons */
    y=Math.min(floor-gh,fr.bottom+GAP+Math.max(0,(floor-fr.bottom-GAP-gh)/2));
    x=freeX(y,fr.left+fr.width/2-gw/2);              /* centred on the buttons, unless something is there */
    where='below';
  }
  if(x==null){                                       /* LANDSCAPE: no room below - the same line, first free gap */
    y=Math.max(sr.top+M,Math.min(floor-gh,fr.top+fr.height/2-gh/2));
    x=freeX(y,null);
    where='beside';
  }
  if(x==null){ g.style.display='none'; state.rcoreBox=null; return null; }  /* nowhere clear: shown nowhere, never on a control */
  g.style.left=Math.round(x-o.left)+'px'; g.style.top=Math.round(y-o.top)+'px';
  var br=g.getBoundingClientRect();
  state.rcoreBox={l:br.left,t:br.top,r:br.right,b:br.bottom,where:where};
  return state.rcoreBox;
}
function rcSetStage(s){
  RCP.stage=s;
  var i=document.getElementById('rcIcon'), p=document.getElementById('rcPill');
  if(i) i.hidden=(s!==0);
  if(p) p.hidden=(s!==1);
  placeRcore();
}
function rcRender(){
  var w=document.getElementById('rcorePanel'); if(!w) return;
  w.innerHTML='<div class="rcSheet" id="rcSheet">'+rcPanelHtml()+'</div>';
  var hi=document.getElementById('rcHeadImg'); if(hi) hi.src=RCORE_WORDMARK_PNG;
}
function rcOpen(){
  RCP.open=true;
  var H=rcHistory(), n=H.revisions.length;
  if(!RCP.b){ RCP.a=0; RCP.b=n>=1?n-1:0; }
  var w=document.getElementById('rcorePanel'); if(!w) return;
  w.classList.add('on'); w.setAttribute('aria-hidden','false');
  rcRender();
}
function rcClose(){
  RCP.open=false;
  var w=document.getElementById('rcorePanel');
  if(w){ w.classList.remove('on'); w.setAttribute('aria-hidden','true'); w.innerHTML=''; }
  rcSetStage(0);
}
function rcSetA(i){ var n=rcHistory().revisions.length; var a=Math.max(0,Math.min(i,n-2)); RCP.a=a; if(RCP.b<a+1) RCP.b=a+1; RCP.nav=0; rcRender(); }
function rcSetB(i){ var n=rcHistory().revisions.length; var b=Math.max(1,Math.min(i,n-1)); RCP.b=b; if(RCP.a>b-1) RCP.a=b-1; RCP.nav=0; rcRender(); }
function rcDownload(){
  var H=rcHistory(), revs=H.revisions, n=revs.length;
  var cmp=rcCompare(revs[Math.max(0,Math.min(RCP.a,n-2))].rev,revs[Math.max(1,Math.min(RCP.b,n-1))].rev,H);
  var html=rcDownloadHtml(H,cmp);
  var slug=String(H.surface||'surface').replace(/[^A-Za-z0-9_-]+/g,'-');
  var vmax=n?revs[n-1].rev:'', dlDate=n?revs[n-1].date:'';
  try{
    var blob=new Blob([html],{type:'text/html'}), url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download='R-CORE_'+slug+'_r'+vmax+(dlDate?('_'+dlDate):'')+'.html';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); },0);
  }catch(e){ if(typeof toast==='function') toast('DOWNLOAD BLOCKED'); }
}"""

WIRE = r"""/* ── wiring · one delegated listener for the badge, one for the panel ────────────────────────── */
(function rcoreWire(){
  try{
    var bi=document.getElementById('rcIconImg'), bp=document.getElementById('rcPillImg');
    if(bi){ bi.addEventListener('load',function(){ placeRcore(); }); bi.src=RCORE_ICON_PNG; }
    if(bp){ bp.addEventListener('load',function(){ placeRcore(); }); bp.src=RCORE_WORDMARK_PNG; }
    var g=document.getElementById('rcoreBadge');
    if(g) g.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('button'); if(!b) return;
      e.preventDefault(); e.stopPropagation();
      if(b.id==='rcIcon') rcSetStage(1);            /* CLICK 1 — the icon becomes the wordmark pill */
      else if(b.id==='rcPill') rcOpen();            /* CLICK 2 — the history chain */
    });
    var w=document.getElementById('rcorePanel');
    if(w) w.addEventListener('click',function(e){
      var t=e.target;
      if(t===w){ rcClose(); return; }               /* the scrim closes, as the React modal's does */
      var b=t.closest&&t.closest('button'); if(!b) return;
      e.stopPropagation();
      if(b.id==='rcX'){ rcClose(); return; }
      if(b.id==='rcDl'){ rcDownload(); return; }
      var st=b.getAttribute('data-rcore-step');
      if(st){ var d=/-next$/.test(st)?1:-1; if(/^a-/.test(st)) rcSetA(RCP.a+d); else rcSetB(RCP.b+d); return; }
      var ps=b.getAttribute('data-rcore-preset');
      if(ps){ var n=rcHistory().revisions.length;
        if(ps==='prev'){ RCP.a=Math.max(0,n-2); RCP.b=n-1; } else { RCP.a=0; RCP.b=n-1; }
        RCP.nav=0; rcRender(); return; }
      var md=b.getAttribute('data-rcore-mode');
      if(md){ RCP.mode=(md==='cmpVS')?'side':'unified'; rcRender(); return; }
      var sc=b.getAttribute('data-rcore-stat');
      if(sc==='added'||sc==='revised'||sc==='removed'){ RCP.filter=(RCP.filter===sc)?null:sc; rcRender(); return; }
      var nv=b.getAttribute('data-rcore-nav');
      if(nv){ var cn=rcCompare(rcHistory().revisions[RCP.a].rev,rcHistory().revisions[RCP.b].rev,rcHistory()).perCrossed.length;
        RCP.nav=Math.max(0,Math.min(cn-1,RCP.nav+(nv==='next'?1:-1))); rcRender(); return; }
      var pk=b.getAttribute('data-rcore-pick');
      if(pk!=null){ var revs=rcHistory().revisions, i=-1;
        for(var z=0;z<revs.length;z++) if(revs[z].rev===pk){ i=z; break; }
        if(i<=0) rcSetA(0); else rcSetB(i);          /* clicking a revision makes it After */
        return; }
    });
    if(w) w.addEventListener('input',function(e){
      var el=e.target; if(!el||el.type!=='range') return;
      if(el.id==='rcSelA') rcSetA(+el.value); else if(el.id==='rcSelB') rcSetB(+el.value);
    });
    /* Escape dismisses — the panel first, then the pill. CAPTURE on window so the deck's own game
       keys never fire while the history is open: no key may mark, approve or fire behind a modal. */
    window.addEventListener('keydown',function(e){
      if(RCP.open){ if(e.key==='Escape'){ e.preventDefault(); rcClose(); } e.stopPropagation(); return; }
      if(e.key==='Escape'&&RCP.stage===1){ rcSetStage(0); }
    },true);
    rcSetStage(0);
    addEventListener('resize',function(){ placeRcore(); });
    addEventListener('orientationchange',function(){ setTimeout(placeRcore,60); });
  }catch(e){ try{ log('RCORE','WIRE',String(e).slice(0,80)); }catch(_){ } }
})();"""

ROWS = r"""  /* r.210 deferred rows · R-CORE ON THE GLASS (DD-49, operator 2026-10-14: "Also, not seeing RCORE LOGO TO SEE
     HISTORY CHAIN" · "icon at bottom" · "same as all other rcore single links at bottom below Target Approve,
     Fire"). The badge is wired by an IIFE far below the boot self-check and placed from measured rects, so these
     wait for it, then press the real buttons and read the real geometry — and put everything back. */
  setTimeout(()=>{ try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='RCORE_IS_ON_THE_GLASS')) return;
    const g=document.getElementById('rcoreBadge'), ic=document.getElementById('rcIcon'), w=document.getElementById('rcorePanel');
    const face=document.getElementById('face');
    if(!g||!ic||!w||!face||typeof placeRcore!=='function'){
      rows.push({id:'RCORE_IS_ON_THE_GLASS',ok:false,note:'the badge is not on the page at check time'});
      rows.push({id:'RCORE_IS_THE_SHARED_HISTORY',ok:false,note:'no badge, no panel'});
      rows.push({id:'RCORE_NEVER_COVERS_THE_PICTURE',ok:false,note:'no badge to measure'});
    } else {
      const wasOpen=w.classList.contains('on'), wasStage=RCP.stage;
      placeRcore();
      const br=g.getBoundingClientRect(), fr=face.getBoundingClientRect();
      const inPic=br.left>=0&&br.top>=0&&br.right<=innerWidth&&br.bottom<=innerHeight&&br.width>0&&br.height>0;
      const atBottom=br.top>=fr.top-1;                 /* at the bottom: never above the button row */
      const below=br.top>=fr.bottom-1;                 /* his words, where there is room for them */
      /* two presses open the history */
      const img=document.getElementById('rcIconImg'), isData=!!img&&/^data:image\/png;base64,/.test(img.getAttribute('src')||'');
      ic.click();
      const pill=document.getElementById('rcPill'), pillUp=!!pill&&!pill.hidden;
      if(pill) pill.click();
      const opened=w.classList.contains('on'), sheet=document.getElementById('rcSheet');
      const html=sheet?sheet.innerHTML:'';
      rows.push({id:'RCORE_IS_ON_THE_GLASS',ok:inPic&&atBottom&&isData&&pillUp&&opened,
        note:'the reticle sits at '+Math.round(br.left)+','+Math.round(br.top)+' '+Math.round(br.width)+'x'+Math.round(br.height)
          +' ('+((state.rcoreBox&&state.rcoreBox.where)||'?')+' the buttons, which end at y '+Math.round(fr.bottom)+' of '+innerHeight+')'
          +' · inside the picture '+inPic+' · below the row '+below+' · the artwork is inline '+isData
          +' · one press shows the wordmark '+pillUp+' · two presses open the history '+opened});
      /* the history IS the ledger, read through the shared engine */
      const H=rcHistory(), n=H.revisions.length, last=H.revisions[n-1]||{};
      const cmp=rcCompare(H.revisions[0].rev,last.rev,H);
      const parts=['data-rcore-panel','data-rcore-header','data-rcore-download','data-rcore-close','rcore-select-a',
                   'rcore-select-b','data-rcore-preset','data-rcore-stat','data-rcore-summary','data-rcore-keyimp',
                   'data-rcore-mode','data-rcore-nav','data-rcore-details','data-rcore-list','data-rcore-impact'];
      const shell=w.outerHTML||'';
      const missing=parts.filter(p=>html.indexOf(p)<0&&shell.indexOf(p)<0);
      const noModel=!/\bGrok\b|\bOpus\b|\bSonnet\b|\bHaiku\b|\bGemini\b/.test(html);
      const through=RCORE_LEDGER.through|0;
      rows.push({id:'RCORE_IS_THE_SHARED_HISTORY',
        ok:n===RCORE_LEDGER.entries.length&&n===through&&missing.length===0&&cmp.changes===n-1&&!!cmp.ops&&noModel&&H.surface==='Drone-2525',
        note:n+' revisions through r'+through+' · r'+cmp.fromRev+' → r'+cmp.toRev+' crosses '+cmp.changes+' ('+cmp.releasesCrossed+' releases, '
          +cmp.added+' added, '+cmp.revised+' revised, '+cmp.carried+' carried) · impact '+cmp.impact+' · hash '+cmp.compareHash
          +' · every shared part present '+(missing.length===0?'yes':missing.join(','))+' · no model name on the glass '+noModel});
      /* nothing it covers */
      /* the history is a modal over everything; the question is what the BADGE covers on the glass,
         so the panel goes away first and the page is put back as it was before anything is measured */
      if(!wasOpen) rcClose();
      rcSetStage(wasStage);
      placeRcore();
      const br2=g.getBoundingClientRect();
      const inPic2=br2.left>=0&&br2.top>=0&&br2.right<=innerWidth&&br2.bottom<=innerHeight;
      /* EVERY visible thing on the page, not a list I could forget to extend: the badge may overlap
         nothing but the full-area containers it necessarily sits over (#app, #stage, #view, the canvas)
         and its own children. The painter's own words are kept off it by hudKeepOut, which now carries
         the badge's box, so a lane sign or the LOCK line cannot land on it either. */
      const SKIP={APP:1,HTML:1,BODY:1};
      const whole=['app','stage','view','hud','intro'];
      let looked=0; const cover=[];
      document.querySelectorAll('body *').forEach(function(e2){
        if(SKIP[e2.tagName]) return;
        if(g.contains(e2)||e2.contains(g)) return;              /* its own children, and its ancestors */
        if(whole.indexOf(e2.id)>=0||e2.tagName==='CANVAS') return;
        if(e2.closest&&e2.closest('#rcorePanel')) return;        /* the modal is not the glass */
        const cs=getComputedStyle(e2); if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0') return;
        const r2=e2.getBoundingClientRect(); if(r2.width<=0||r2.height<=0) return;
        if(r2.width>=innerWidth*0.95&&r2.height>=innerHeight*0.95) return;  /* a full-page layer */
        looked++;
        if(br2.left<r2.right&&br2.right>r2.left&&br2.top<r2.bottom&&br2.bottom>r2.top)
          cover.push((e2.id?('#'+e2.id):e2.tagName.toLowerCase())+' '+Math.round(r2.x)+','+Math.round(r2.y));
      });
      const kept=(typeof hudKeepOut==='function')&&hudKeepOut().some(function(k){ return k.id==='rcoreBadge'; });
      rows.push({id:'RCORE_NEVER_COVERS_THE_PICTURE',ok:cover.length===0&&inPic2&&kept,
        note:cover.length?('the badge overlaps '+cover.join(', ')+' (of '+looked+' visible boxes)')
          :('the badge overlaps none of the '+looked+' visible boxes on the page and is wholly inside it \u00b7 the painter keeps off it '+kept)});
      /* the page was already put back above, before the measurement — QA_LEAVES_NO_TRACE */
    }
    state.qa={pass:rows.filter(x=>x.ok).length,total:rows.length,rev:BUILD.revision,t:Date.now(),known:(state.qa&&state.qa.known)}; const qn2=document.getElementById('qaOps'); if(qn2) qn2.textContent=state.qa.pass+'/'+state.qa.total;
  }catch(e){ rows.push({id:'RCORE_IS_ON_THE_GLASS',ok:false,note:'threw '+String(e).slice(0,120)}); } }, 1700);"""


# 0 · the deck declares itself
rep("revision:'0.209'","revision:'0.210'",1)
rep("r0.209","r0.210",1)

# 1 · the styles (above the first top-level declaration at play.html:667 — freeze-free ground)
rep("#qrSheet{position:fixed;inset:0;z-index:60;", CSS+"\n#qrSheet{position:fixed;inset:0;z-index:60;",1)

# 2 · the badge markup, inside #app, immediately after TARGET · APPROVE · FIRE
rep("""      <b id="fFire" class="fire">FIRE</b>
    </div>""",
    """      <b id="fFire" class="fire">FIRE</b>
    </div>
    <!-- r.210 (DD-49, operator 2026-10-14: "icon at bottom" - "same as all other rcore single links at bottom
         below Target Approve, Fire"). Two clicks: the reticle becomes the wordmark, the wordmark opens the
         history. Both rasters are his own artwork, inlined as data URIs (the deck is ONE file and fetches
         nothing); placeRcore() puts the row where it covers no control. -->
    <div id="rcoreBadge" data-rcore-badge>
      <button id="rcIcon" data-rcore-icon type="button" aria-label="R-CORE — version history" title="R-CORE — version history"><img id="rcIconImg" src="" alt="R-CORE"/></button>
      <button id="rcPill" data-rcore-pill type="button" hidden aria-label="Open R-CORE version history and compare" title="Open R-CORE version history and compare"><img id="rcPillImg" src="" alt="R-CORE"/></button>
    </div>""",1)

# 3 · the panel shell, beside the QR sheet (a modal, as the React panel is a modal)
rep("""<div id="qrSheet" aria-hidden="true">""",
    """<div id="rcorePanel" data-rcore-panel role="dialog" aria-modal="true" aria-label="R-CORE · Version History" aria-hidden="true"></div>
<div id="qrSheet" aria-hidden="true">""",1)

# 4 · placeFace places the badge too — one measured placement, re-run by the same observer
rep("""  state.facePlace={turret,cols:pick.sh.c,gap:pick.g,above:!!pick.above};
  return state.facePlace;""",
    """  state.facePlace={turret,cols:pick.sh.c,gap:pick.g,above:!!pick.above};
  if(typeof placeRcore==='function') placeRcore(); /* r.210: the R-CORE row is placed from the same measured rects, by the same observer */
  return state.facePlace;""",1)

# 5 · the engine, the data, the panel, the badge and the wiring — the APPEND ZONE, after const _mp.
#     Nothing frozen follows before </script>. The three function groups are `function` DECLARATIONS so they
#     hoist above toolSelfTest(); the three consts are read only from code that runs after them.
rep("""const _mp=document.getElementById('modePick');
if(_mp)_mp.onchange=e=>pickScenario(e.target.value);
""",
    "const _mp=document.getElementById('modePick');\nif(_mp)_mp.onchange=e=>pickScenario(e.target.value);\n\n"
    +ENGINE+"\n\n/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER="+BLOCK+";/*RCORE_LEDGER_END*/\n"
    +"const RCORE_ICON_PNG='"+ICON+"';\nconst RCORE_WORDMARK_PNG='"+WORD+"';\n\n"
    +PANEL+"\n\n"+BADGE+"\n\n"+WIRE+"\n",1)

# 5b · the painter's keep-out list learns the badge, so no sign, caption or status line lands on it
# (the badge's own placement list repeats these ids and must NOT match here, so the anchor carries hudKeepOut's
#  own call shape; the badge is added to the painter's list and skips itself in its own)
rep("'board','toast'].forEach(id=>add(document.getElementById(id),id));",
    "'board','toast','rcoreBadge'].forEach(id=>add(document.getElementById(id),id));", 1)

# 6 · the three deferred rows
rep("""  /* r.208 deferred row · THE_CAPITOL_IS_DRAWN""", ROWS+"""
  /* r.208 deferred row · THE_CAPITOL_IS_DRAWN""",1)

# 7 · presence: every new member is in, exactly once
for need in ["function rcCompare(a,b,history)","function rcDiffTokens(a,b,cap)","function rcRedact(s)",
             "function rcFirstSentence(text,max)","function rcFromLedger(json)","function rcDownloadHtml(history,cmp)",
             "function placeRcore()","function rcPanelHtml()","function rcOpen()","function rcClose()",
             "/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=","const RCORE_ICON_PNG='data:image/png;base64,",
             "const RCORE_WORDMARK_PNG='data:image/png;base64,",
             '<div id="rcoreBadge" data-rcore-badge>','<div id="rcorePanel" data-rcore-panel',
             "'board','toast','rcoreBadge'].forEach(id=>add(",
             "rows.push({id:'RCORE_IS_ON_THE_GLASS',ok:inPic&&atBottom",
             "rows.push({id:'RCORE_IS_THE_SHARED_HISTORY',\n        ok:n===RCORE_LEDGER.entries.length",
             "rows.push({id:'RCORE_NEVER_COVERS_THE_PICTURE',ok:cover.length===0&&inPic2",
             "if(typeof placeRcore==='function') placeRcore();"]:
    if s.count(need)!=1: raise SystemExit('REFUSE: not in once (%d): %s'%(s.count(need),need[:70]))

# 8 · stale: r.195's hand list may never return, and the old revision number must be gone
for dead in ["RCORE_HIST","kind:'approved'","revision:'0.209'","r0.209"]:
    if dead in s: raise SystemExit('REFUSE: stale remains: '+dead)

# 9 · THE CUT IS PARSED BEFORE IT IS WRITTEN
_m=max(re.findall(r'<script[^>]*>(.*?)</script>', s, re.S), key=len)
with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as _f:
    _f.write(_m); _p=_f.name
_r=subprocess.run(['node','--check',_p],capture_output=True,text=True)
os.unlink(_p)
if _r.returncode!=0: raise SystemExit('REFUSE: the cut does not parse —\n'+(_r.stderr or '')[:1200])
print('parsed OK ('+str(len(_m))+' chars of script) · ledger through rev '+str(THROUGH))

open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

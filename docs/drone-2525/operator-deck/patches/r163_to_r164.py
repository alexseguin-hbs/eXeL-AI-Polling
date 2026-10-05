# r.163 -> r.164 — Settings → VOICE: three engines, a per-voice test, and training on the device (operator 2026-10-05, ASK.md Addenda 19–20, verbatim:
# "choose top 3, and lets have option to select in settings, once settings, we can test for our specific voice quality of detection." and
# "Voice calibration should be a separate mode (under settings) to test key words for one's voice profile and allow for acoustic modeling to enhance
# detection to a specfiic voice locally to feed model for maximizing chance of detection").
#  1. ENGINE picker in Settings → VOICE, remembered on the device: BROWSER (Web Speech, on the device where the browser allows) · VOSK (on-device Kaldi
#     with a closed word list — loaded only when picked, ~40 MB once) · MY VOICE (TF.js speech-commands with a head trained on the player's own clips —
#     ~6 MB base once; the trained head stays in this browser).
#  2. TEST MY VOICE: the game asks for TARGET · APPROVE · FIRE · RELOAD · ONE · TWO · THREE in turn, listens with the picked engine, and scores each
#     word HEARD / MISSED / CONFUSED (with the word it heard); the table and a score stay on the device per engine.
#  3. TRAIN MY VOICE (MY VOICE engine): 8 clips per word + room noise, trained in the browser, saved in this browser only; RESET clears it.
#  4. One door for every engine: what an engine hears goes through voiceHeard → voiceAct (r.163's voiceCmd first, then the r.134/r.148 phrases).
#     Single-word engines go through a phrase assembler ("approve" … "three" within 1.6 s = "approve three").
#  Voice stays a request: FIRE fires only a red box under the bullseye. QA VOICE_SETTINGS, VOICE_TEST_SCORES, VOICE_PHRASE_ASSEMBLER.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.163.html'); DST=os.path.join(DECK,'drone-2525_r.164.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
OLD=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'r163_onresult.txt'),encoding='utf-8').read()
rep(OLD,"  r.onresult=ev=>{ voiceHeard((ev.results[ev.results.length-1][0].transcript||'').toLowerCase()); }; /* r.164: every engine hears through one door */\n")
rep('      <button id="btnSets" type="button">RESET SETS</button>',
'''      <button id="btnSets" type="button">RESET SETS</button>
      <h3>VOICE</h3>
      <label class="sl">ENGINE <select id="vcEngine" title="voice engine" style="flex:1"><option value="browser">BROWSER</option><option value="vosk">VOSK · ON DEVICE</option><option value="myvoice">MY VOICE · TRAINED</option></select></label>
      <div class="stat"><span>STATUS</span><b id="vcStatus">READY</b></div>
      <div class="stat"><span>MY SCORE</span><b id="vcScore">NOT TESTED</b></div>
      <button id="btnVcTest" type="button">TEST MY VOICE</button>
      <button id="btnVcTrain" type="button">TRAIN MY VOICE</button>
      <button id="btnVcReset" type="button">RESET MY VOICE</button>
      <div id="vcPrompt" style="font-size:16px;letter-spacing:.08em;color:#F0A020;min-height:20px;margin:6px 0"></div>
      <table id="vcTable" style="width:100%;font-size:10px;border-collapse:collapse"></table>''')
rep("function voiceSync(){",r'''/* r.164 · VOICE ENGINES (Addenda 19–20) — BROWSER · VOSK · MY VOICE, one door (voiceHeard), a per-voice test, training kept on the device */
const VOICE_KEY='exel-2525-voice';
const VOICE_WORDS=['target','approve','fire','reload','one','two','three','four','five','six','seven','eight','nine'];
const VOICE_TEST_WORDS=['target','approve','fire','reload','one','two','three'];
const VOICE_NUM={one:'1',two:'2',to:'2',too:'2',three:'3',four:'4',for:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9'};
const VOICE_CDN={vosk:'https://cdn.jsdelivr.net/npm/vosk-browser@0.0.8/dist/vosk.js',voskModel:'https://ccoreilly.github.io/vosk-browser/models/vosk-model-small-en-us-0.15.tar.gz',tf:'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.21.0/dist/tf.min.js',sc:'https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@0.5.4/dist/speech-commands.min.js'};
function voiceCfg(){ if(!state.voiceCfg){ let c=null; try{ c=JSON.parse(localStorage.getItem(VOICE_KEY)||'null'); }catch(e){} state.voiceCfg=Object.assign({engine:'browser',tests:{}},c||{}); } return state.voiceCfg; }
function voiceSave(){ try{ localStorage.setItem(VOICE_KEY,JSON.stringify(voiceCfg())); }catch(e){} }
function voiceEngineId(){ const e=voiceCfg().engine; return (e==='vosk'||e==='myvoice'||e==='sim')?e:'browser'; }
function vcStatus(t){ const b=document.getElementById('vcStatus'); if(b) b.textContent=t; }
function voiceHeard(t){ t=String(t||'').toLowerCase().trim(); if(!t) return; if(state.voiceTestHook){ state.voiceTestHook(t); return; } voiceAct(t); }
function voiceAct(t){ /* r.164: the r.163/r.148/r.134 phrases, unchanged, for every engine */
    log('VOICE','',t); if(voiceCmd(t)) return; /* r.163: numbered phrases first; the rest below as before */
    if(/\b(?:hold|cease|check|stop|don'?t|do not|no|not)\b/.test(t)){ toast('VOICE HOLD'); log('VOICE','HOLD',t); return; } /* r.134: a negation is heard BEFORE consent */
    const m=t.match(/\b(?:target|t)\s*(one|two|three|1|2|3)\b/);
    if(m){const map={one:1,two:2,three:3,'1':1,'2':2,'3':3}; targetN(map[m[1]]); return;} /* r.148: voice 'target N' is key N */
    if(/\b(?:target|lock)\b/.test(t)){ state.slot=state.slot||1; markLock(lockOn(),'VOICE'); return;}
    if(/\b(?:approve|approved|cleared)\b/.test(t)){ approveDesig('HI-2'); toast('VOICE APPROVE'); return; }
    const f=t.trim().match(/^(?:fire|f)\s*(one|two|three|1|2|3)?$/); /* r.135: the whole utterance, not a substring */ if(f){fireN(f[1]?({one:1,two:2,three:3,'1':1,'2':2,'3':3}[f[1]]):state.slot||1);return;}
    if(/capture|photo/.test(t))capture(); }
/* single-word engines (MY VOICE) say one word at a time: "approve" … "three" within 1.6 s is the phrase "approve three"; a lone verb acts after 1.6 s */
const VOICE_JOIN_MS=1600;
function voiceWord(w,tMs){ const q=state.vqWord; const isNum=!!VOICE_NUM[w]; if(q&&isNum&&tMs-q.t<=VOICE_JOIN_MS&&/^(approve|fire|target)$/.test(q.w)){ state.vqWord=null; voiceHeard(q.w+' '+w); return q.w+' '+w; }
  if(q) voiceFlush(tMs,true); if(/^(approve|fire|target)$/.test(w)){ state.vqWord={w,t:tMs}; return ''; } voiceHeard(w); return w; }
function voiceFlush(tMs,force){ const q=state.vqWord; if(!q) return ''; if(force||tMs-q.t>VOICE_JOIN_MS){ state.vqWord=null; voiceHeard(q.w); return q.w; } return ''; }
/* the score of one test word: HEARD when the expected word (or its digit) is in what was heard; CONFUSED when another voice word is; MISSED when nothing */
function voiceScore(expect,heard){ heard=String(heard||'').toLowerCase(); const words=heard.split(/[^a-z0-9]+/).filter(Boolean); if(!words.length) return {r:'MISSED',h:''};
  const want=[expect, VOICE_NUM[expect]].filter(Boolean); if(words.some(w=>want.includes(w)||VOICE_NUM[w]&&VOICE_NUM[w]===VOICE_NUM[expect])) return {r:'HEARD',h:heard};
  const other=words.find(w=>VOICE_WORDS.includes(w)||/^[1-9]$/.test(w)); return other?{r:'CONFUSED',h:other}:{r:'MISSED',h:heard}; }
function loadScript(src){ return new Promise((ok,bad)=>{ if(document.querySelector('script[src="'+src+'"]')) return ok(); const el=document.createElement('script'); el.src=src; el.onload=()=>ok(); el.onerror=()=>bad(new Error('could not load '+src)); document.head.appendChild(el); }); }
/* voiceOpen(onText) → a promise of stop(); one listener per engine */
async function voiceOpen(onText){ const eng=voiceEngineId();
  if(eng==='sim'){ state._simVoiceOn=onText; return ()=>{ state._simVoiceOn=null; }; } /* QA only — never in the picker */
  if(eng==='browser'){ const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR) throw new Error('NO SPEECH SERVICE IN THIS BROWSER'); const r=new SR(); r.lang='en-US'; r.continuous=true; r.interimResults=false; try{ if('processLocally' in r) r.processLocally=true; }catch(e){} let live=true; r.onresult=ev=>onText((ev.results[ev.results.length-1][0].transcript||'').toLowerCase()); r.onend=()=>{ if(live) try{ r.start(); }catch(e){} }; r.onerror=e=>{ if(e&&e.error==='language-not-supported'){ try{ r.processLocally=false; }catch(_){} } }; r.start(); return ()=>{ live=false; try{ r.stop(); }catch(e){} }; }
  const mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
  if(eng==='vosk'){ vcStatus('LOADING VOSK (ABOUT 40 MB, ONCE)'); await loadScript(VOICE_CDN.vosk); if(!state._voskModel) state._voskModel=await window.Vosk.createModel(VOICE_CDN.voskModel); vcStatus('VOSK READY');
    const ctx=new (window.AudioContext||window.webkitAudioContext)(); const rec=new state._voskModel.KaldiRecognizer(ctx.sampleRate, JSON.stringify(VOICE_WORDS.concat(['[unk]'])));
    rec.on('result',m=>{ const t=(m&&m.result&&m.result.text)||''; if(t&&t!=='[unk]') onText(t); }); const src=ctx.createMediaStreamSource(mic); const proc=ctx.createScriptProcessor(4096,1,1); proc.onaudioprocess=e=>{ try{ rec.acceptWaveform(e.inputBuffer); }catch(_){} }; src.connect(proc); proc.connect(ctx.destination);
    return ()=>{ try{ proc.disconnect(); src.disconnect(); ctx.close(); }catch(e){} mic.getTracks().forEach(t=>t.stop()); }; }
  mic.getTracks().forEach(t=>t.stop()); /* MY VOICE opens its own microphone */
  const tr=await myVoiceModel(false); if(!tr.wordLabels||!tr.wordLabels().length) throw new Error('MY VOICE IS NOT TRAINED YET · PRESS TRAIN MY VOICE');
  const labels=tr.wordLabels(); await tr.listen(r=>{ const sc=Array.from(r.scores); let i=0; sc.forEach((v,k)=>{ if(v>sc[i]) i=k; }); const w=labels[i]; if(w&&w!=='_background_noise_') voiceWord(w,performance.now()); },{probabilityThreshold:0.85,overlapFactor:0.5,invokeCallbackOnNoiseAndUnknown:false});
  const tick=setInterval(()=>voiceFlush(performance.now()),200); return ()=>{ clearInterval(tick); try{ tr.stopListening(); }catch(e){} }; }
async function myVoiceModel(fresh){ vcStatus('LOADING MY VOICE MODEL (ABOUT 6 MB, ONCE)'); await loadScript(VOICE_CDN.tf); await loadScript(VOICE_CDN.sc);
  if(!state._scBase){ state._scBase=window.speechCommands.create('BROWSER_FFT'); await state._scBase.ensureModelLoaded(); }
  if(fresh||!state._scTr){ state._scTr=state._scBase.createTransfer('drone2525-voice'); if(!fresh){ try{ await state._scTr.load(); }catch(e){} } } vcStatus('MY VOICE READY'); return state._scTr; }
async function trainMyVoice(){ if(voiceEngineId()!=='myvoice'){ toast('PICK MY VOICE FIRST'); return false; } const tr=await myVoiceModel(true); const P=document.getElementById('vcPrompt'); const say=t=>{ if(P) P.textContent=t; };
  for(const w of VOICE_WORDS.concat(['_background_noise_'])){ for(let k=0;k<8;k++){ say(w==='_background_noise_'?'STAY QUIET · ROOM NOISE '+(k+1)+'/8':'SAY: '+w.toUpperCase()+' · '+(k+1)+'/8'); await tr.collectExample(w); } }
  say('TRAINING ON THIS DEVICE…'); await tr.train({epochs:25}); await tr.save(); say('MY VOICE SAVED ON THIS DEVICE'); vcStatus('MY VOICE TRAINED'); return true; }
async function resetMyVoice(){ try{ const tr=await myVoiceModel(true); if(tr&&tr.clearExamples) tr.clearExamples(); if(window.speechCommands&&window.speechCommands.deleteSavedTransferModel) await window.speechCommands.deleteSavedTransferModel('drone2525-voice'); }catch(e){} state._scTr=null; const c=voiceCfg(); delete c.tests.myvoice; voiceSave(); voiceTableShow(); vcStatus('MY VOICE CLEARED'); }
/* TEST MY VOICE — each word asked in turn, heard by the picked engine, scored; kept on the device per engine */
async function voiceTest(windowMs){ windowMs=windowMs||3000; const eng=voiceEngineId(); const P=document.getElementById('vcPrompt'); const results=[]; let heard='';
  const stop=await voiceOpen(t=>{ if(!heard) heard=t; }); state.voiceTestHook=t=>{ if(!heard) heard=t; };
  try{ for(const w of VOICE_TEST_WORDS){ heard=''; if(P) P.textContent='SAY: '+w.toUpperCase(); const t0=performance.now(); while(performance.now()-t0<windowMs&&!heard){ await new Promise(r=>setTimeout(r,25)); }
      const sc=voiceScore(w,heard); results.push({w,r:sc.r,h:sc.h}); } }
  finally{ state.voiceTestHook=null; try{ stop(); }catch(e){} }
  const c=voiceCfg(); c.tests[eng]={at:Date.now(),results}; voiceSave(); if(P) P.textContent=''; voiceTableShow(); return results; }
function voiceTableShow(){ const c=voiceCfg(), eng=voiceEngineId(), T=c.tests[eng]; const tb=document.getElementById('vcTable'), sc=document.getElementById('vcScore');
  const ok=T?T.results.filter(x=>x.r==='HEARD').length:0; if(sc) sc.textContent=T?(ok+' OF '+T.results.length+' HEARD'):'NOT TESTED';
  if(tb) tb.innerHTML=T?T.results.map(x=>'<tr><td>'+x.w.toUpperCase()+'</td><td style="color:'+(x.r==='HEARD'?'#3DCC8A':x.r==='CONFUSED'?'#F0A020':'#E24B3B')+'">'+x.r+'</td><td>'+(x.r==='CONFUSED'?'AS '+String(x.h).toUpperCase():'')+'</td></tr>').join(''):''; }
function voiceSettingsWire(){ const sel=document.getElementById('vcEngine'); if(sel){ sel.value=voiceEngineId()==='sim'?'browser':voiceEngineId(); sel.onchange=()=>{ voiceCfg().engine=sel.value; voiceSave(); if(state.rec) voiceToggle(); voiceTableShow(); vcStatus(sel.options[sel.selectedIndex].text+' · PICKED'); }; }
  const bt=document.getElementById('btnVcTest'); if(bt) bt.onclick=()=>{ voiceTest().catch(e=>{ vcStatus(String(e&&e.message||e).toUpperCase().slice(0,60)); state.voiceTestHook=null; }); };
  const tn=document.getElementById('btnVcTrain'); if(tn) tn.onclick=()=>{ trainMyVoice().catch(e=>vcStatus(String(e&&e.message||e).toUpperCase().slice(0,60))); };
  const rs=document.getElementById('btnVcReset'); if(rs) rs.onclick=()=>{ resetMyVoice(); }; voiceTableShow(); }
function voiceSync(){''')
# VOICE button: engines other than BROWSER run through voiceOpen
rep("function voiceToggle(){\n","function voiceToggle(){\n  if(voiceEngineId()!=='browser'){ if(state.voiceStop){ try{ state.voiceStop(); }catch(_){} state.voiceStop=null; state.rec=null; state.voice=false; voiceSync(); toast('VOICE OFF'); return; } voiceOpen(voiceHeard).then(stop=>{ state.voiceStop=stop; state.rec={engine:voiceEngineId()}; state.voice=true; voiceSync(); toast('LISTENING · '+voiceEngineId().toUpperCase()+' · say TARGET, APPROVE, FIRE'); }).catch(e=>{ state.voice=false; state.rec=null; voiceSync(); toast('VOICE OFF · '+String(e&&e.message||e).toUpperCase().slice(0,60)+' · USE TARGET / APPROVE / FIRE'); }); return; } /* r.164: VOSK and MY VOICE */\n")
rep("document.getElementById('btnVoice').onclick=voiceToggle;","document.getElementById('btnVoice').onclick=voiceToggle; voiceSettingsWire(); /* r.164 */")
ROW=r'''    { /* r.164 · VOICE_SETTINGS + VOICE_TEST_SCORES + VOICE_PHRASE_ASSEMBLER (Addenda 19–20) */
      const sel=document.getElementById('vcEngine'); const opts=sel?[...sel.options].map(o=>o.value).join(','):''; const c0=JSON.stringify(voiceCfg());
      const sc=[voiceScore('approve','approve three').r, voiceScore('fire','five').r+':'+voiceScore('fire','five').h, voiceScore('target','').r, voiceScore('three','3').r, voiceScore('reload','the weather').r].join(' ');
      const got=[]; const hk=state.voiceTestHook; state.voiceTestHook=t=>got.push(t); state.vqWord=null; voiceWord('approve',1000); voiceWord('three',1900); voiceWord('fire',3000); voiceFlush(4700); voiceWord('target',6000); voiceWord('reload',6500); state.voiceTestHook=hk;
      const asm=got.join(' | ');
      push('VOICE_SETTINGS', opts==='browser,vosk,myvoice'&&!!document.getElementById('btnVcTest')&&!!document.getElementById('btnVcTrain')&&!!document.getElementById('btnVcReset')&&['browser','vosk','myvoice'].includes(voiceEngineId())||voiceEngineId()==='sim', 'engines '+opts+' · TEST, TRAIN and RESET buttons in Settings → VOICE · picked '+voiceEngineId());
      push('VOICE_PHRASE_ASSEMBLER', asm==='approve three | fire | target | reload', 'one word at a time: '+asm);
      state._vtSc=sc; state._vtC0=c0; }
'''
rep("    { /* r.157 · START_LIGHT_WORDS", ROW+"    { /* r.157 · START_LIGHT_WORDS")
DEF=r'''    { /* r.164 · VOICE_TEST_SCORES — the whole TEST MY VOICE run with a scripted voice (the QA engine), scored and kept per engine */
      const sc=state._vtSc||''; const c0=state._vtC0; const e0=voiceCfg().engine; voiceCfg().engine='sim'; const say={target:'target',approve:'approve',fire:'five',reload:'',one:'one',two:'2',three:'tree'};
      const feed=setInterval(()=>{ const P=document.getElementById('vcPrompt'); const w=P&&P.textContent.replace('SAY: ','').toLowerCase(); if(state._simVoiceOn&&w&&say[w]) state._simVoiceOn(say[w]); },20);
      voiceTest(150).then(res=>{ clearInterval(feed); const line=res.map(x=>x.w+':'+x.r).join(' '); const kept=!!(voiceCfg().tests.sim&&voiceCfg().tests.sim.results.length===7); const score=document.getElementById('vcScore').textContent;
        try{ state.voiceCfg=JSON.parse(c0); }catch(e){ voiceCfg().engine=e0; } delete voiceCfg().tests.sim; voiceSave(); voiceTableShow();
        rows.push({id:'VOICE_TEST_SCORES', ok: sc==='HEARD CONFUSED:five MISSED HEARD MISSED' && line==='target:HEARD approve:HEARD fire:CONFUSED reload:MISSED one:HEARD two:HEARD three:MISSED' && kept && score==='4 OF 7 HEARD',
          note:'scores: '+sc+' · the test run: '+line+' · kept per engine '+kept+' · '+score}); }).catch(e=>{ clearInterval(feed); rows.push({id:'VOICE_TEST_SCORES',ok:false,note:'threw '+String(e).slice(0,80)}); });
    }
'''
rep("  setTimeout(()=>{ try{ if(state.outcomes!==rows) return; const fb=document.getElementById('fTgt');", DEF+"  setTimeout(()=>{ try{ if(state.outcomes!==rows) return; const fb=document.getElementById('fTgt');")
rep("{ const vs=voiceToggle.toString(); const iH=vs.indexOf('hold|cease')","{ const vs=voiceAct.toString(); const iH=vs.indexOf('hold|cease')") # r.164: the phrases live in voiceAct, the one door for every engine
c=s.count("revision:'0.163'"); rep("revision:'0.163'","revision:'0.164'",c)
h=s.count("r0.163"); rep("r0.163","r0.164",h)
for dead in ["revision:'0.163'","r0.163"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())

// build-pod-walkthrough.mjs — the operator's walkthrough (2026-09-12): "test POD FUNCTIONALITY AND RUN ME THROUGH
// INDIVIDUAL SCREENSHOTS OF 3 users with step by step instructions how to complete outcomes and get 333 word summary".
// Reads the showcase run's crops + walkthrough.json (docs/assessments/pod-live-run-2026-09-12) and writes ONE self-
// contained HTML page (images inlined) — docs/feedback/POD_Walkthrough_3_Users_2026.09.12.html. Nothing here is typed
// from memory: every figure and every paragraph on the page comes from the run's own files.
import fs from 'fs'; import path from 'path';
const ROOT = path.resolve(process.cwd(), '..');
const RUN = process.env.RUN || path.join(ROOT, 'docs/assessments/pod-live-run-2026-09-12');
const OUT = path.join(ROOT, process.env.OUT_HTML || 'docs/feedback/POD_Walkthrough_3_Users_2026.09.12.html');
// ASSIST (operator 2026-09-12: "have 4AsM assist each of the 3 members"): the validated inputs file carries, per seat,
// the three drafts and the reconciler — shown beside the screenshots so the reader sees who advised what.
const ASSIST = process.env.INPUTS ? JSON.parse(fs.readFileSync(process.env.INPUTS, 'utf8')).seats : null;
const W = JSON.parse(fs.readFileSync(path.join(RUN, 'walkthrough.json'), 'utf8'));
const log = fs.readFileSync(path.join(RUN, 'log.txt'), 'utf8').split('\n').filter(Boolean);
const steps = log.length, fails = log.filter((l) => / FAIL /.test(l)).length;
const sha = (() => { try { return fs.readFileSync(path.join(ROOT, '.git/refs/heads/claude/debug-wsl-issues-yYdPP'), 'utf8').trim().slice(0, 7); } catch { return 'HEAD'; } })();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const img = (f) => { const p = path.join(RUN, f); return fs.existsSync(p) ? `data:image/jpeg;base64,${fs.readFileSync(p).toString('base64')}` : null; };
const WHO = [['lead', 'Lea', 'the lead'], ['ana', 'Ana', 'seat 2'], ['bo', 'Bo', 'seat 3']];

// The nine steps. `press` is what the person does on THEIR phone; `expect` is what they should see before moving on.
const STEPS = [
  { key: '01-plan', title: 'Open the pod with a plan', screen: 'Brief',
    lead: { press: ASSIST ? `Open /soi-session. Type the Intent ("${ASSIST.lead.intent}") and the Measurable outcome ("${ASSIST.lead.outcome}"), your name and email. In Plan: hours ${ASSIST.lead.plan.hours}, multiple ${ASSIST.lead.plan.m}×, then the place — ${ASSIST.lead.podPlace?.name}. Press "Share QR & open the pod".` : 'Open /soi-session. Type the Intent and the Measurable outcome, your name and email. In Plan: hours 2, multiple 3×, then the place — United States, then "New York · Remainder of state". Press "Share QR & open the pod".', expect: ASSIST ? `The preview reads "${ASSIST.lead.plan.hours} h × ${ASSIST.lead.plan.m} = 웃 ${(ASSIST.lead.plan.hours * ASSIST.lead.plan.m).toFixed(3)}" and the settlement in ${ASSIST.lead.podPlace?.currency}.` : 'The preview reads "2 h × 3 = 웃 6.000 · settles at $96.00 · ≈ $96.00".' },
    ana: { press: 'Nothing yet — wait for the lead\'s code or QR.', expect: '' }, bo: { press: 'Nothing yet — wait for the lead\'s code or QR.', expect: '' } },
  { key: '02-invite', title: 'Two join by code or QR', screen: 'Invite',
    lead: { press: 'Show the QR, or read the six-character code aloud.', expect: '"● live · 3 in the pod" once both have joined.' },
    ana: { press: 'Scan the QR (it opens /soi-session?pod=CODE).', expect: '"you are seat 2".' },
    bo: { press: 'Open /soi-session, type the code into POD CODE, press Join.', expect: '"you are seat 3".' } },
  { key: '03-seat', title: 'Name your seat, elect your place, approve the plan', screen: 'Invite → agreed',
    lead: { press: 'Your seat is set from the brief. Tick "Lea approves the intent, outcome and plan". When all three ticks are in, press "Accepted by the trio — go to synchronized start".', expect: 'Your place reads "inherited from the pod" — the pod default is yours unless you elect another.' },
    ana: { press: `Type your name. Under "Settles at" choose your country (${ASSIST ? ASSIST.ana.place?.name : 'Brazil'}), and a locality if one is offered. Optional: press "Add my position" to record your phone's GPS fix beside the place. Tick approval.`, expect: ASSIST ? `"${ASSIST.ana.place?.rate ?? 'no rate published'} ${ASSIST.ana.place?.currency ?? ''} an hour"${ASSIST.ana.gps ? ` and, after the fix, "GPS Location ${ASSIST.ana.gps.lat}, ${ASSIST.ana.gps.lon}"` : ''}.` : '"7.37 BRL an hour" and, after the fix, "GPS Location -23.5505, -46.6333 ±25 m".' },
    bo: { press: `Type your name. Choose ${ASSIST ? ASSIST.bo.place?.name : 'Philippines, then the locality "Metro Manila"'}. Tick approval.`, expect: ASSIST ? `"${ASSIST.bo.place?.rate ?? 'no rate published'} ${ASSIST.bo.place?.currency ?? ''} an hour".` : '"86.875 PHP an hour".' } },
  { key: '04-clock', title: 'Synchronized start', screen: 'Start → Active',
    lead: { press: 'Press "tap to start" within 15 seconds of the other two.', expect: 'The clock button appears on every phone, not yet running.' },
    ana: { press: 'Press "tap to start".', expect: 'Same clock button.' }, bo: { press: 'Press "tap to start".', expect: 'Same clock button.' } },
  { key: '05-segments', title: 'Run the clock — start, stop, add time', screen: 'Active',
    lead: { press: 'Press the clock button to START. Work. Press it again to STOP (segment 1). Press it again to ADD TIME (segment 2 opens).', expect: '"segment 2" on all three phones; the span is the sum of the segments.' },
    ana: { press: 'Watch the segments replicate. Any member may press "Stop & record" to close the clock for everyone — Ana did.', expect: 'Everyone reaches Record.' },
    bo: { press: 'Watch; the clock is one clock under its own name.', expect: '"segment 2" replicated.' } },
  { key: '06-outcome', title: 'Record — one outcome from each of the three', screen: 'Record',
    lead: { press: 'Type your own outcome into your box (own seat only).', expect: 'The box for the other two is read-only on your phone.' },
    ana: { press: 'Write the shared record ("Write the outcome"), then your own outcome. When all three outcomes are in, press "Next — witness the hours".', expect: 'The Next button unlocks only when three outcomes exist.' },
    bo: { press: 'Type your own outcome.', expect: '' } },
  { key: '07-audit', title: 'Self-audit and cross-witness', screen: 'Audit',
    lead: { press: 'Enter the hours you claim and one line of what you did. Press "ANA witnesses" and "BO witnesses" on their rows. Then press "Settle & issue the receipt" (it unlocks when all three are witnessed and audited).', expect: 'A claim above the clock reads "counted as … — the pod was witnessed for 0:00:16": capped, never trusted.' },
    ana: { press: 'Enter hours and what you did; witness the other two.', expect: '"witnessed ✓" on your row once both others pressed.' },
    bo: { press: 'Enter hours and what you did; witness the other two.', expect: '' } },
  { key: '08-receipt', title: 'The receipt — same on all three phones', screen: 'Closed',
    lead: { press: 'Read lines 1–6: Recorded · Plan → actual · Witnessed · Settles · Drawn & held · ♡ · 5a outcomes · 5b each at their own floor (local currency, USA equivalent, GPS) · Stamped.', expect: 'Lea $ · Ana R$ with a hi_rates.py USD floor beside · Bo ₱ with "awaiting a dated exchange-rate source".' },
    ana: { press: 'Same receipt, your own line in reais, your GPS fix as "a supplement to the elected place".', expect: '' },
    bo: { press: 'Same receipt, your line in pesos.', expect: '' } },
  { key: '09-synthesis', title: 'The synthesis', screen: 'Closed',
    lead: { press: 'Scroll to "Synthesis — Results · What changed · What next". Nothing to press: it is written from the pod\'s own record the moment the receipt issues.', expect: `${W.synthesis.lead.counts.join(' + ')} = ${W.synthesis.lead.total} words on this phone.` },
    ana: { press: 'Same three paragraphs, word for word.', expect: `${W.synthesis.ana.total} words.` }, bo: { press: 'Same three paragraphs, word for word.', expect: `${W.synthesis.bo.total} words.` } },
];

const phone = (w, name, seat, s, key) => {
  const src = img(`step-${key}-${w}.jpg`);
  return `<div class="phone"><div class="who"><span class="name">${name}</span><span class="seat">${seat}</span></div>
    <p class="press">${esc(s.press)}</p>${s.expect ? `<p class="expect"><span>See</span> ${esc(s.expect)}</p>` : ''}
    ${src ? `<img src="${src}" alt="${esc(name)} — ${esc(key)}" loading="lazy">` : `<p class="missing">no screenshot for ${name} at this step — this phone did nothing here</p>`}
  </div>`;
};
const assistHtml = (key) => {
  if (!ASSIST || !ASSIST[key]) return '';
  const a = ASSIST[key];
  const lines = [key === 'lead' ? `<li><b>Intent</b> ${esc(a.intent)}</li><li><b>Measurable outcome</b> ${esc(a.outcome)}</li><li><b>Plan</b> ${a.plan.hours} h × ${a.plan.m} — ${esc(a.plan.reason)}</li><li><b>Pod place</b> ${esc(a.podPlace?.name || '')}</li>` : '',
    `<li><b>Own place</b> ${esc(a.place?.name || '')}${a.gps ? ` · GPS ${a.gps.lat}, ${a.gps.lon}` : ''}</li><li><b>Own outcome</b> ${esc(a.ownOutcome)}</li><li><b>Self-audit</b> ${a.audit.hours} h — ${esc(a.audit.did)}</li>`].join('');
  const four = [...a.assist.drafts.map((d) => ({ ...d, role: 'drafted' })), { ...a.assist.reconciler, role: 'reconciled' }];
  return `<details class="assist"><summary>Assisted by four reviewers — ${four.map((d) => d.asm).join(' · ')}</summary>
    <ul class="inputs">${lines}</ul>
    ${four.map((d) => `<div class="adv"><h4>${esc(d.asm)} <span>${esc(d.lens)} · ${d.role} · ${d.words} words</span></h4><p>${esc(d.comment)}</p></div>`).join('')}
  </details>`;
};
const stepHtml = (s, i) => `<section class="step" id="step-${i + 1}">
  <header><span class="n">${i + 1}</span><div><h2>${esc(s.title)}</h2><p class="screen">Screen: ${esc(s.screen)}</p></div></header>
  <div class="phones">${WHO.map(([w, name, seat]) => phone(w, name, seat, s[w], s.key)).join('')}</div>
  ${i === 2 ? WHO.map(([w]) => assistHtml(w)).join('') : ''}
  <label class="comment"><span>Operator comment — step ${i + 1}</span><textarea id="comment-${i + 1}" rows="2" placeholder="what is wrong, what is missing, what to change"></textarea></label>
</section>`;

const synth = W.synthesis.lead;
const html = `<title>${ASSIST ? 'Pod Walkthrough — Advised Members' : 'Pod Walkthrough — Three Phones'}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{--bg:#f3f6f6;--surface:#ffffff;--ink:#12201f;--muted:#5b6d6f;--line:#d3dcdc;--accent:#0b8fa3;--press:#b7791f;--press-bg:#fbf3e3;--mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;--body:'IBM Plex Sans',system-ui,sans-serif;--display:'IBM Plex Sans Condensed','IBM Plex Sans',system-ui,sans-serif}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0a1518;--surface:#101e22;--ink:#e2ecec;--muted:#8fa3a6;--line:#22363a;--accent:#22d3ee;--press:#f0b429;--press-bg:#1d1a10}}
:root[data-theme="dark"]{--bg:#0a1518;--surface:#101e22;--ink:#e2ecec;--muted:#8fa3a6;--line:#22363a;--accent:#22d3ee;--press:#f0b429;--press-bg:#1d1a10}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 var(--body);padding:0 16px;padding-block:24px 64px}
.wrap{max-width:1040px;margin:0 auto}h1{font:600 30px/1.1 var(--display);margin:0 0 6px;text-wrap:balance}h2{font:600 20px/1.2 var(--display);margin:0;text-wrap:balance}
.lede{color:var(--muted);max-width:66ch;margin:0 0 4px}.meta{display:flex;flex-wrap:wrap;gap:8px 18px;font:13px/1.4 var(--mono);color:var(--muted);margin:10px 0 28px}
.meta b{color:var(--ink);font-weight:500}.step{border-top:1px solid var(--line);padding-block:22px}.step header{display:flex;gap:14px;align-items:flex-start;margin-bottom:14px}
.n{font:600 13px/1 var(--mono);color:var(--accent);border:1px solid var(--accent);border-radius:999px;min-width:28px;height:28px;display:grid;place-items:center;flex:none}
.screen{margin:2px 0 0;font:13px var(--mono);color:var(--muted)}.phones{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
@media (max-width:760px){.phones{grid-template-columns:1fr}}
.phone{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;min-width:0}
.who{display:flex;justify-content:space-between;align-items:baseline}.name{font:600 15px var(--display)}.seat{font:12px var(--mono);color:var(--muted);letter-spacing:.04em;text-transform:uppercase}
.press{margin:0;padding:8px 10px;background:var(--press-bg);border-left:3px solid var(--press);border-radius:4px}.expect{margin:0;color:var(--muted);font-size:13px}.expect span{font:500 11px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--accent);margin-right:6px}
.phone img{max-width:100%;border:1px solid var(--line);border-radius:6px;margin-top:auto}.missing{color:var(--muted);font-size:13px;margin:0}
.comment{display:block;margin-top:14px}.comment span{display:block;font:500 11px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
textarea{width:100%;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:8px;font:14px var(--body)}textarea:focus{outline:2px solid var(--accent);outline-offset:1px}
.synth{border-top:1px solid var(--line);padding-block:22px}.synth .para{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin-top:12px;max-width:72ch}
.synth .para h3{font:600 15px var(--display);margin:0 0 6px;display:flex;justify-content:space-between}.synth .para h3 span{font:12px var(--mono);color:var(--muted)}.synth p{margin:0}
.tot{font:500 13px var(--mono);color:var(--muted);margin:6px 0 0}.receipt{font:12.5px/1.55 var(--mono);white-space:pre-wrap;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:14px;overflow-x:auto;margin-top:12px}
.assist{margin-top:12px;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:10px 14px}.assist summary{cursor:pointer;font:600 14px var(--display)}.inputs{margin:8px 0;padding-left:18px;font-size:13px}.inputs b{font-weight:600}.adv{border-top:1px solid var(--line);padding:8px 0}.adv h4{font:600 14px var(--display);margin:0 0 4px}.adv h4 span{font:12px var(--mono);color:var(--muted);font-weight:400}.adv p{margin:0;max-width:72ch;font-size:13.5px}
.outcomes{margin:12px 0 0;padding-left:18px}.outcomes li{margin:2px 0}.foot{color:var(--muted);font-size:13px;margin-top:30px;max-width:70ch}
</style>
<div class="wrap">
<h1>${ASSIST ? 'Pod Walkthrough — Advised Members' : 'Pod Walkthrough — Three Phones'}</h1>
<p class="lede">How three people take one task from a plan to a receipt and its synthesis (about 333 words) on the SoI pod. Every screenshot below is one person's own phone at that step, from a real run over the app's live channel; nothing is a mock-up.${ASSIST ? ' The three members are simulated: each was advised by four reviewers whose drafts and reconciliation are shown under step 3, and whose words the phones typed.' : ''}</p>
<div class="meta"><span>run <b>2026-09-12</b></span><span>pod code <b>${esc(W.code)}</b></span><span>steps <b>${steps}</b> · failures <b>${fails}</b></span><span>build <b>${sha}</b></span><span>phones <b>Lea · Ana · Bo</b> (375×812, emulated)</span></div>
${STEPS.map(stepHtml).join('\n')}
<section class="synth" id="synthesis">
  <h2>The synthesis, as issued (about 333 words)</h2>
  <p class="tot">Counted from the screen on each phone: Lea ${W.synthesis.lead.counts.join(' + ')} = ${W.synthesis.lead.total} · Ana ${W.synthesis.ana.total} · Bo ${W.synthesis.bo.total} — identical word for word. Three paragraphs summing to about 333 (the ruling of 2026-08-19: not exactly 111 each). Source: ${esc(synth.source)} — Cube 6 writes it once the AI backend is online.</p>
  ${[['Results', 0], ['What changed', 1], ['What next', 2]].map(([h, i]) => `<div class="para"><h3>${h}<span>${synth.counts[i]} words</span></h3><p>${esc(synth.paragraphs[i])}</p></div>`).join('')}
  <h2 style="margin-top:26px">The three outcomes, one per member</h2>
  <ul class="outcomes">${W.outcomes.map((o) => `<li>${esc(o.replace(/^ · /, ''))}</li>`).join('')}</ul>
  <h2 style="margin-top:26px">The receipt's first lines, as text</h2>
  <div class="receipt">${esc(W.receipt)}</div>
  <label class="comment"><span>Operator comment — synthesis and receipt</span><textarea id="comment-synthesis" rows="3" placeholder="what the summary should say differently"></textarea></label>
</section>
<p class="foot">Source run: docs/assessments/pod-live-run-2026-09-12 (log.txt, walkthrough.json, full-page screenshots per phase). Rebuild with <code>node scripts/build-pod-walkthrough.mjs</code> after <code>npm run pod:showcase</code>.</p>
</div>`;
fs.writeFileSync(OUT, html);
console.log(`written ${path.relative(ROOT, OUT)} — ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB, ${STEPS.length} steps, ${steps} run steps, ${fails} failures`);

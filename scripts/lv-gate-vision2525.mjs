import { chromium } from 'playwright';
/* r94: the target is overridable so a NEW rule can be mutation-proven against the
   PREVIOUS release before the fix is applied. A rule that has only ever been run
   against the fixed file has not been tested -- that mistake was made at r89. */
const f='file://'+(process.argv[2]||'/home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const fails=[];
let VMAXCHK=null;
// 1. engine correctness
{
  const p=await b.newPage({viewport:{width:1200,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(f);
  const r=await p.evaluate(()=>{
    setView('ledger');
    const out={vmax:VMAX, ledger:LEDGER.length, order:ALL_ORDER.length, perV:[], det:true, monotone:true};
    let prev=0;
    for(let v=1;v<=VMAX;v++){
      const blocks=replay(v);
      const ALLO=ALL_ORDER;   /* r50: four orders. the union IS the complete record */
      /* fresh=true: recompute from LEDGER each time. A cached answer would
         make this assertion prove only that the cache works. */
      const h1=stateHash(v,ALLO,true), h2=stateHash(v,ALLO,true), h3=stateHash(v,ALLO,true);
      if(h1!==h2||h2!==h3) out.det=false;
      if(blocks.length<prev) out.monotone=false;
      prev=blocks.length;
      // no duplicate ids in a replay
      const ids=blocks.map(x=>x.id); const dup=ids.length!==new Set(ids).size;
      out.perV.push({v, blocks:blocks.length, hash:h1, dup, changed:blocks.filter(x=>x.v===v).length});
    }
    /* Cross-release distinctness, stated correctly.
       A state hash is a hash of the CONTENT at that release. Two releases with
       identical content SHOULD hash identically — that is determinism working,
       not a defect. The old assertion assumed every release appends to the
       ledger, which was true until r69 changed only the engine (the release
       stepper, the corner badge) and touched no block.
       So: every release that DID append must be distinct from its predecessor,
       and every release that did NOT append is reported by name so an
       engine-only release has to be declared rather than blend in silently. */
    out.engineOnly = [];
    out.collisions = [];
    for (let v=2; v<=VMAX; v++){
      const appended = LEDGER.some(e=>e.v===v);
      const same = out.perV[v-1].hash === out.perV[v-2].hash;
      if (!appended) out.engineOnly.push(v);
      if (same && appended) out.collisions.push(v);
    }
    out.distinct = out.collisions.length === 0;
    // every ledger id is in ORDER
    const ALL=ALL_ORDER;
    out.orphanIds = [...new Set(LEDGER.map(e=>e.id))].filter(id=>ALL.indexOf(id)<0);
    /* A ledger block written at a revision ABOVE VMAX is unreachable: replay()
       never sees it and the reader never renders it. Silent, and it happened —
       r71's block was appended before its VERSIONS entry existed, so the newest
       writing in the document was invisible and every gate still passed. */
    out.beyondVmax = [...new Set(LEDGER.filter(e=>e.v>VMAX).map(e=>e.v+':'+e.id))];
    /* the four orders must stay disjoint, or ALL_ORDER double-counts a block */
    const OS=[LEDGER_ORDER,PAPER_ORDER,BRIEF_ORDER,OUTLINE_ORDER];
    out.viewOverlap=[];
    for(let i=0;i<OS.length;i++) for(let j=i+1;j<OS.length;j++)
      out.viewOverlap.push(...OS[i].filter(id=>OS[j].indexOf(id)>=0));
    /* Poison the caches, then assert the verification path ignores them. */
    const ALLO2=ALL_ORDER;
    const truth = stateHash(VMAX, ALLO2, true);
    REPLAY_CACHE.clear(); HASH_CACHE.clear();
    replay(VMAX, ALLO2); stateHash(VMAX, ALLO2);                 // populate
    for (const k of [...HASH_CACHE.keys()]) HASH_CACHE.set(k, "poisoned");
    for (const k of [...REPLAY_CACHE.keys()]) REPLAY_CACHE.set(k, []);
    out.cachedIsPoisoned = stateHash(VMAX, ALLO2) === "poisoned";
    out.freshIgnoresCache = stateHash(VMAX, ALLO2, true) === truth;
    REPLAY_CACHE.clear(); HASH_CACHE.clear();
    out.activeAtLoad = document.getElementById('vNow').textContent;
    out.docBlocks = document.querySelectorAll('section.blk').length;
    out.asmRows = document.querySelectorAll('#review table tr').length-1;
    return out;
  });
  console.log('ENGINE', JSON.stringify(r,null,1));
  VMAXCHK = r.vmax;
  if(errs.length) fails.push('JS ERRORS: '+errs.join(' | '));
  if(!r.det) fails.push('NONDETERMINISTIC replay');
  if(!r.distinct) fails.push('releases that appended to the ledger produced identical content: r'+r.collisions.join(', r'));
  console.log('engine-only releases (no ledger append, content identical to predecessor by design): '
    + (r.engineOnly.length ? 'r'+r.engineOnly.join(', r') : 'none'));
  if(!r.monotone) fails.push('block count regressed');
  if(r.orphanIds.length) fails.push('ledger ids not in ORDER: '+r.orphanIds);
  if(r.beyondVmax.length) fails.push('ledger blocks written ABOVE VMAX are unreachable — no VERSIONS entry: '+r.beyondVmax.join(', '));
  if(r.perV.some(x=>x.dup)) fails.push('duplicate block in replay');
  if(!r.cachedIsPoisoned) fails.push('cache-poison harness did not take effect — the bypass test is vacuous');
  if(!r.freshIgnoresCache) fails.push('VERIFICATION PATH READS THE CACHE — the determinism proof is circular');
  else console.log('proof path is uncached — poisoned memo ignored by stateHash(v, order, fresh=true)');
  await p.close();
}
// 2. interaction
{
  const p=await b.newPage({viewport:{width:1200,height:900}});
  await p.goto(f);
  await p.evaluate(()=>setView('ledger'));
  /* r69: the release strip is a STEPPER with the full history behind a disclosure.
     One button per revision meant 68 chips filling a phone, labelled v1..v68 —
     which also told the reader a Version-17 document was on version 68. Assert the
     collapse holds (it must start closed, or the wall is back) and that nothing was
     deleted: every release is still reachable once the disclosure is opened. */
  {
    /* r106: the release stepper left the foot of every section — the deck
       carries prev/play/next/Latest at all times now. The disclosure lives on
       the last cell with the rest of the record, so the test goes there. */
    await p.evaluate(()=>{ const c=cellsIn(); if(c.length) goTo(c[c.length-1].target); });
    await p.waitForTimeout(300);
    const before = await p.evaluate(()=>({
      hasBtn: !!document.getElementById('bRelAll'),
      open: !!document.querySelector('.relall.open'),
      visibleChips: [...document.querySelectorAll('[data-goto]')].filter(b=>b.offsetParent!==null).length
    }));
    if(!before.hasBtn) fails.push('release disclosure missing — the 68-chip wall may be back');
    if(before.open)    fails.push('release history starts OPEN — it must start collapsed');
    if(before.visibleChips > 6) fails.push(`${before.visibleChips} release chips visible before opening — the wall is back`);
    await p.click('#bRelAll');
    const after = await p.evaluate(()=>({
      listed: document.querySelectorAll('.relall [data-goto]').length,
      record: VERSIONS.length
    }));
    if(after.listed !== after.record)
      fails.push(`disclosure lists ${after.listed} releases but the record has ${after.record} — a release became unreachable`);
    console.log(`release stepper ok — ${before.visibleChips} chips collapsed, ${after.listed}/${after.record} reachable when opened`);
  }
  await p.click('[data-goto="1"]');
  const v1=await p.evaluate(()=>({n:document.querySelectorAll('section.blk').length, lab:document.getElementById('vNow').textContent, hash:location.hash}));
  await p.click('#bNext');
  const v2=await p.evaluate(()=>({n:document.querySelectorAll('section.blk').length, lab:document.getElementById('vNow').textContent}));
  await p.click('#bLatest');
  const vL=await p.evaluate(()=>({n:document.querySelectorAll('section.blk').length, lab:document.getElementById('vNow').textContent}));
  await p.evaluate(()=>setView('ledger'));
  /* r104: the proof is reached through Settings now — the tail no longer sits
     after the arrows on a middle cell, so #rcore is on the last cell. */
  /* r124 harness hardening: after the goto-stepping above, the 3.9MB document is
     still re-rendering and Playwright's actionability check reports 'element is
     not stable' intermittently (seen r119 once, r124 twice; function verified
     intact both times by manual probe). Settle first, and give the two clicks
     explicit patience. No assertion changes. */
  await p.waitForTimeout(700);
  await p.click('#bSet', {timeout:60000, force:true}); await p.click('#bProof', {timeout:60000, force:true}); await p.waitForTimeout(300);
  /* r124b: opening the proof panel starts progressive output over 124 releases, so
     the button's box never settles; the assertion is on #proof's TEXT, not on
     visual stability — force the click past the actionability wait. */
  /* r202: the doc now replays 200+ releases 33 times each, a synchronous burst that
     blocks the main thread past the old 60s click budget as the ledger grows. Give the
     click and the proof settle generous patience (a performance limit of a growing
     document, not a correctness change) and poll #proof until it reports a verdict. */
  await p.click('#bProveAll', {timeout:240000, force:true});
  await p.waitForFunction(() => {
    const t=(document.getElementById('proof')||{}).textContent||'';
    return /identical|FAILED/.test(t);
  }, {timeout:240000}).catch(()=>{});
  await p.waitForTimeout(500);
  const proof=await p.evaluate(()=>document.getElementById('proof').textContent);
  console.log('INTERACT v1',JSON.stringify(v1),'v2',JSON.stringify(v2),'latest',JSON.stringify(vL));
  console.log('PROOF:\n'+proof);
  if(v1.n>=v2.n) fails.push('v1 not smaller than v2');
  if(!/identical/.test(proof)) fails.push('determinism proof did not report identical');
  if(/FAILED/.test(proof)) fails.push('determinism proof FAILED');
  await p.close();
}
// 2b. compare mode — pure function + UI
{
  const p=await b.newPage({viewport:{width:1440,height:1200}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(f);
  await p.evaluate(()=>setView('ledger'));
  const r=await p.evaluate(()=>{
    const t=(a,bb)=>{const c={added:0,revised:0,removed:0,carried:0};for(const r of compare(a,bb))c[r.kind]++;return c;};
    const VM=VERSIONS.length;
    /* improvements(v) must equal the RECORD for v, not one view's slice of it.
       The VMAX-only length check missed r67 entirely: it changed a single block
       that lives in PAPER_ORDER, so a LEDGER_ORDER scan came back empty and the
       panel rendered blank in silence. Check every release against ALL_ORDER. */
    const impGaps = [];
    for (let v = 1; v <= VM; v++){
      const want = new Set();
      for (const id of ALL_ORDER){
        for (const e of LEDGER) if (e.id === id && e.v === v) want.add(id);
      }
      const got = new Set(improvements(v).map(e => e.id));
      for (const id of want) if (!got.has(id)) impGaps.push('v' + v + ' missing ' + id);
      for (const id of got) if (!want.has(id)) impGaps.push('v' + v + ' phantom ' + id);
      /* An ENGINE-ONLY release appends no block, so improvements(v) is legitimately
         empty — r69 (release stepper) and r74 (the PASSES array) are both such.
         Only flag a blank panel when the record actually holds something for v. */
      if (want.size && !got.size) impGaps.push('v' + v + ' panel blank but record has ' + want.size);
    }
    return {full:t(1,VM), same:t(7,7), total:compare(1,VM).length, blocks:replay(VM).length,
            symm:JSON.stringify(t(1,VM))===JSON.stringify(t(VM,1)), imp:improvements(VM).length,
            /* engine-only: this release appended no ledger block, so an empty
               improvements panel is correct rather than broken (r69, r74). */
            vmaxIsEngineOnly: !LEDGER.some(e=>e.v===VM),
            impGaps};
  });
  if(r.impGaps.length) fails.push('improvements() does not match the record: ' + r.impGaps.slice(0,6).join(' · ') + (r.impGaps.length>6?` (+${r.impGaps.length-6} more)`:''));
  if(r.total!==r.blocks) fails.push(`compare(1,VMAX) rows ${r.total} != blocks ${r.blocks}`);
  if(r.full.removed!==0) fails.push('compare reported a removal; the ledger has no delete');
  if(r.full.added+r.full.revised+r.full.carried!==r.blocks) fails.push('compare kinds do not sum to block count');
  if(r.same.added||r.same.revised||r.same.removed) fails.push('compare(v,v) reported a change');
  if(!r.symm) fails.push('compare is not order-independent');
  if(!r.imp && !r.vmaxIsEngineOnly)
    fails.push('improvements(VMAX) is empty — key improvements would render blank');
  else if(r.vmaxIsEngineOnly) console.log('VMAX is engine-only — empty improvements panel is correct');
  await p.click('#bCmp');
  const ui=await p.evaluate(()=>({panel:!!document.querySelector('.cmp'),sel:document.querySelectorAll('.cmp-ctl select').length}));
  if(!ui.panel) fails.push('compare panel did not render');
  if(ui.sel!==2) fails.push('compare panel missing its two selects');
  await p.click('#cmpFirst');
  const hl=await p.evaluate(()=>document.querySelectorAll('section.blk.cmp-add,section.blk.cmp-rev').length);
  if(hl!==r.blocks-r.full.carried) fails.push(`compare highlights ${hl} != changed ${r.blocks-r.full.carried}`);
  if(errs.length) fails.push('page errors: '+errs.join(' | '));
  console.log('compare mode ok —', r.full.added,'added,',r.full.revised,'revised,',r.full.carried,'carried');
  await p.close();
}

// 2c. the masthead is replayed, not fixed (defect 20)
{
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto(f);
  await p.evaluate(()=>setView('ledger'));
  const seen={};
  for(const v of [1,34,35,36,38,39,42]){
    await p.evaluate(n=>goto(n),v);
    seen[v]=await p.evaluate(()=>({h1:document.getElementById('mH1').textContent,
                                   sub:document.getElementById('mSub').textContent,
                                   tab:document.title}));
  }
  const v1=seen[1], v34=seen[34], v35=seen[35], v36=seen[36], v39=seen[39], v42=seen[42];
  if(v1.h1===v39.h1) fails.push('masthead at v1 equals masthead at latest — history is being rewritten');
  if(v1.h1!=='The Unit and The Shield') fails.push('v1 masthead is not the founding title: '+v1.h1);
  if(v34.h1!==v1.h1) fails.push('v34 should still carry the founding title, got: '+v34.h1);
  if(v35.h1===v34.h1) fails.push('v35 rename did not take effect');
  if(v36.sub!=='Recursive Coordination for Human Continuity') fails.push('v36 subtitle wrong: '+v36.sub);
  if(v39.h1!=='Recursive Coordination for Human Continuity') fails.push('v39 primary title wrong: '+v39.h1);
  if(v39.sub!=='The Living Ledger of Human Contribution') fails.push('v39 subtitle wrong: '+v39.sub);
  if(v42.h1!=='Recursive Coordination for Human Continuity') fails.push('v42 title wrong: '+v42.h1);
  if(v42.sub!=='') fails.push('v42 must carry no subtitle, got: '+v42.sub);
  if(v39.sub==='') fails.push('v39 subtitle was erased — history rewritten');
  if(!v1.tab.includes(v1.h1)||!v42.tab.includes(v42.h1)) fails.push('document.title does not track the masthead');
  console.log('masthead replay ok — v1 "'+v1.h1+'"  ->  v39 +sub  ->  v42 "'+v42.h1+'" no sub');
  await p.close();
}

// 2d. three views, one ledger (r40/r41)
{
  const p=await b.newPage({viewport:{width:1440,height:1200}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(f);
  const seen={};
  for(const v of ['paper','ledger','brief']){
    await p.evaluate(n=>setView(n),v);
    seen[v]=await p.evaluate(()=>({n:document.querySelectorAll('section.blk').length,
                                   ban:(document.getElementById('viewban').textContent||'').trim().slice(0,12),
                                   hash:location.hash,
                                   det:stateHash(VMAX)===stateHash(VMAX),
                                   chg:compare(1,VMAX).filter(r=>r.kind!=='carried').length}));
  }
  if(!seen.paper.ban.startsWith('White paper')) fails.push('paper banner: '+seen.paper.ban);
  if(!seen.ledger.ban.startsWith('Ledger')) fails.push('ledger banner: '+seen.ledger.ban);
  if(!seen.brief.ban.startsWith('Brief')) fails.push('brief banner: '+seen.brief.ban);
  const counts=[seen.paper.n,seen.ledger.n,seen.brief.n];
  if(new Set(counts).size!==3) fails.push('views do not render distinct block counts: '+counts.join('/'));
  if(counts.some(c=>c===0)) fails.push('a view rendered zero blocks: '+counts.join('/'));
  if(!/^#paper\/v\d+$/.test(seen.paper.hash)) fails.push('paper hash not deep-linkable: '+seen.paper.hash);
  if(!/^#brief\/v\d+$/.test(seen.brief.hash)) fails.push('brief hash not deep-linkable: '+seen.brief.hash);
  if(!/^#v\d+$/.test(seen.ledger.hash)) fails.push('ledger hash wrong: '+seen.ledger.hash);
  for(const k of ['paper','ledger','brief']){
    if(!seen[k].det) fails.push(k+' state hash is not deterministic');
    if(!seen[k].chg) fails.push('compare reports no change in the '+k+' view');
  }
  /* r104 · THE TOGGLE ANSWERS ONE QUESTION. It cycled four views, two of which
     were the same twenty-five blocks. It now cycles the three readings, and
     Outline and Ledger are reached from Settings — asserted separately by
     COVERAGE, which counts Settings as a route. */
  await p.evaluate(()=>setView('paper'));
  const cyc=[];
  for(let i=0;i<4;i++){ await p.click('#bView'); cyc.push(await p.evaluate(()=>view)); }
  if(cyc.join(',')!=='brief,nose,paper,brief')
    fails.push('view toggle does not cycle the three readings: '+cyc.join(','));
  // section anchors + ToC
  await p.evaluate(()=>setView('paper'));
  const toc=await p.evaluate(()=>({
    links:[...document.querySelectorAll('.toc a[href^="#sec-"]')].map(a=>a.getAttribute('href')),
    targets:[...document.querySelectorAll('h2.sech[id^="sec-"]')].map(h=>'#'+h.id)}));
  // the architecture panel reads from the live engine. r104: it lives in the
  // Settings drawer now, so open the drawer before reaching for it.
  await p.click('#bSet');
  await p.click('#bSpec');
  const spec=await p.evaluate(()=>({open:!!document.querySelector('.specban'),
    rel:(document.querySelector('.specban .rel')||{}).textContent||'',
    rows:document.querySelectorAll('.specban table tr').length-1}));
  if(!spec.open) fails.push('spec panel did not open');
  if(!/Release\s+\d+/.test(spec.rel)) fails.push('spec panel does not state the release number: '+spec.rel);
  if(spec.rows<6) fails.push('spec panel has only '+spec.rows+' rows');
  if(await p.evaluate(()=>!document.getElementById('setWrap').hidden))
    fails.push('the Settings drawer stayed open behind the panel it opened');
  await p.click('#bSet');
  await p.click('#bSpec');
  if(await p.evaluate(()=>!!document.querySelector('.specban'))) fails.push('spec panel did not close');
  console.log('spec panel ok — "'+spec.rel.trim()+'", '+spec.rows+' rows');
  /* r89: NINETEEN still means nineteen. The Flower of Life is the nineteen
     NUMBERED sections; the Constitution joined the contents as §C, above them
     and outside the count. Counting every #sec-* link would have quietly made
     the flower twenty, so the invariant is measured on the numbers alone. */
  const numbered=toc.links.filter(h=>/^#sec-\d+$/.test(h));
  if(numbered.length!==19) fails.push('ToC has '+numbered.length+' numbered links, expected 19 (the Flower of Life);');
  const missing=toc.links.filter(h=>toc.targets.indexOf(h)<0);
  if(missing.length) fails.push('ToC links with no section: '+missing.join(', '));
  const before=await p.evaluate(()=>location.hash);
  await p.click('.toc a[href="#sec-8"]');
  const after=await p.evaluate(()=>location.hash);
  if(after!==before) fails.push('a section link changed the version hash: '+before+' -> '+after);
  /* r89, DEFECT 30 — TWO RULES THAT WOULD HAVE CAUGHT IT AT r80.
     The jump rail labelled the Constitution "END" for nine releases because an
     unnumbered heading fell through to the closing section's name, and full doc
     rendered mot.author twice because it lives in two orders. Neither showed up
     in eighty-eight gate runs: the gate checked that links RESOLVE and never
     checked what they were CALLED, or that an id appears once.
       * no two chips in a view may share a label;
       * no id may appear twice in any view.
     Both are cheap. Both are the kind of thing a screenshot found first. */
  /* r90, DEFECT 31 — DIVISOR LOCK. The Seed Token is 1/7 of a minimum-wage hour
     = 8m 34s. 7.25 is the United States federal minimum WAGE and was mistaken
     for the divisor at r57; r78 corrected it and fixed ONE block. Five live
     blocks kept 1/7.25 and 8m 17s, two of them written after the correction.
     Three corrections have now failed to travel (the eleven-count, §10's
     numbers, this). A rule is the only thing that stops the fourth. */
  await p.evaluate(()=>{ setView('paper'); goto(VMAX); });
  const div = await p.evaluate(()=>{
    const bad=[];
    for (const e of replay(VMAX, ALL_ORDER)){
      /* The wrong figure MAY appear where it is being named as wrong — that is
         the past offered deliberately. Two places qualify and no others: the
         open.* registers, and a <p class="meta"> correction note. Everywhere
         else, 1/7.25 or 8m 17s is the document stating a false price. */
      if (/^open\./.test(e.id)) continue;
      const h = (e.html||'').replace(/<p class="meta">[\s\S]*?<\/p>/g, '');
      if (/1\s*\/\s*7\.25|&divide;\s*7\.25|8m\s*17s/.test(h)) bad.push(e.id);
    }
    return bad;
  });
  if (div.length) fails.push('DIVISOR: live blocks still carry 1/7.25 or 8m 17s — '+div.join(', '));
  else console.log('divisor ok — every live block reads 1/7 of an hour, 8m 34s');

  const idxFails = fails.length;
  for (const v of ['paper','ledger','brief','outline']){
    await p.evaluate(x=>setView(x), v);
    const idx=await p.evaluate(()=>{
      const labels=[...document.querySelectorAll('#chips button')].map(b=>b.textContent.trim());
      const lc={}; labels.forEach(l=>lc[l]=(lc[l]||0)+1);
      const ic={}; document.querySelectorAll('[id]').forEach(e=>ic[e.id]=(ic[e.id]||0)+1);
      return {dupLabels:Object.keys(lc).filter(k=>lc[k]>1),
              dupIds:Object.keys(ic).filter(k=>ic[k]>1)};
    });
    if(idx.dupLabels.length) fails.push('CHIP-LABEL: '+v+' has two chips called '+idx.dupLabels.join(', '));
    if(idx.dupIds.length)    fails.push('DUP-ID: '+v+' renders '+idx.dupIds.join(', ')+' more than once');
  }
  /* and full doc, which is the DEFAULT arrival since r87 and reads every order
     at once — the one place a duplicate id was actually reaching readers. */
  await p.evaluate(()=>{ setView('paper'); document.getElementById('bFull').click(); });
  const fd=await p.evaluate(()=>{
    const labels=[...document.querySelectorAll('#chips button')].map(b=>b.textContent.trim());
    const lc={}; labels.forEach(l=>lc[l]=(lc[l]||0)+1);
    const ic={}; document.querySelectorAll('[id]').forEach(e=>ic[e.id]=(ic[e.id]||0)+1);
    return {full:document.body.classList.contains('straight'),
            dupLabels:Object.keys(lc).filter(k=>lc[k]>1),
            dupIds:Object.keys(ic).filter(k=>ic[k]>1),
            chips:labels.length};
  });
  if(!fd.full) fails.push('straight-through did not engage for the duplicate sweep');
  if(fd.dupLabels.length) fails.push('CHIP-LABEL: full doc has two chips called '+fd.dupLabels.join(', '));
  if(fd.dupIds.length)    fails.push('DUP-ID: full doc renders '+fd.dupIds.join(', ')+' more than once');
  if (fails.length === idxFails)
    console.log('index ok — no duplicate chip label and no duplicate id in 4 views + full doc ('+fd.chips+' chips)');

  /* ── r108 · THE BRIEF CITES SECTIONS THAT EXIST ─────────────────────────
     Operator: "in brief reference section numbers these belong to."
     MEASURED BEFORE the change, on the r107 baseline: 8 brief blocks, 0 of
     them carrying a single reference to a section of the paper. A reader who
     came in by the short read had 261 dead taps' worth of nowhere to go.

     Three assertions, because two of them are the ways this quietly rots:
       * every brief block carries a reference line — a new brief part added
         later without one is the regression;
       * every id it cites RESOLVES in the paper order — a renumbered or
         renamed section silently orphans a citation, which is exactly how
         "Principle IX" became a dangling reference twice before;
       * the target of a citation is never the brief itself.
     Mutation-proven against pre-r108.html: deleting one <p class="ext"> from
     one brief block fails by block name; pointing one at sec-99 fails by id. */
  await p.evaluate(()=>setView('brief'));
  const bref = await p.evaluate(()=>{
    const blocks = [...document.querySelectorAll('#doc section.blk')];
    const missing = [], cited = new Set();
    blocks.forEach(s=>{
      const e = s.querySelector('p.ext');
      if (!e || !e.querySelectorAll('a[data-sec]').length){ missing.push(s.id); return; }
      e.querySelectorAll('a[data-sec]').forEach(a=>cited.add(a.getAttribute('data-sec')));
    });
    return {n:blocks.length, missing, cited:[...cited]};
  });
  await p.evaluate(()=>setView('paper'));
  const orphan = await p.evaluate(ids=>ids.filter(id=>!document.getElementById('sec-'+id)), bref.cited);
  if (bref.missing.length)
    fails.push('BRIEF-REFS: '+bref.missing.join(', ')+' carry no section reference');
  if (orphan.length)
    fails.push('BRIEF-REFS: the brief cites '+orphan.map(o=>'§'+o).join(', ')+' — no such section in the paper');
  if (!bref.missing.length && !orphan.length)
    console.log('brief refs ok — '+bref.n+' parts, every one cites its sections; '+
                bref.cited.length+' distinct targets, all resolve (was 0 of 8 at r107)');

  /* ── r110 · THE CONSTITUTION IS FROZEN ──────────────────────────────────
     Operator: "regarding articles of constitution; freeze so we can reference…
     we just need to decide on order today and moving forward never change."

     This REVERSES an earlier decision in the same session ("renumber freely
     whenever logic improves"). The later instruction wins, and it is the one
     a reader is served by: a citation to Principle IV must still land on
     Principle IV in five hundred years, or the Constitution is not something
     anyone can build on.

     The order frozen is the one ALREADY SHIPPED, not a better one. A more
     persuasive sequence exists — sovereignty and capture would read better
     adjacent — and adopting it would break every reference already made,
     which is exactly what freezing prevents.

     Two assertions:
       * the ten numerals appear, in order, exactly once each;
       * each principle still names a section, and that section exists.
     Mutation-proven: swap any two claims, drop a numeral, or renumber, and
     this fails by name. */
  await p.evaluate(()=>setView('paper'));
  const con = await p.evaluate(()=>{
    const FROZEN = [
      ["I",   "Humanity remains sovereign"],
      ["II",  "Authority shall always be reviewable"],
      ["III", "The record cannot be secretly altered"],
      ["IV",  "No intelligence supersedes human dignity"],
      ["V",   "No institution owns civilization"],
      ["VI",  "Participation must remain voluntary"],
      ["VII", "Evidence outranks opinion"],
      ["VIII","Qualification precedes scale"],
      ["IX",  "Every generation inherits the ledger"],
      ["X",   "No single actor may capture the framework"]
    ];
    const d=document.createElement('div');
    const e=replay(VMAX, PAPER_ORDER, true).find(x=>x.id==='front.constitution');
    if(!e) return {missing:true};
    d.innerHTML=e.html;
    const rows=[...d.querySelectorAll('tr')].map(tr=>[...tr.children].map(c=>
      c.textContent.replace(/\s+/g,' ').trim())).filter(td=>td.length>=3 && /^[IVX]+$/.test(td[0]));
    const bad=[], orphan=[];
    FROZEN.forEach((want,i)=>{
      const got=rows[i];
      if(!got) { bad.push(want[0]+' missing'); return; }
      if(got[0]!==want[0]) bad.push('position '+(i+1)+' is '+got[0]+', frozen as '+want[0]);
      else if(!got[1].startsWith(want[1])) bad.push(want[0]+' text changed');
      const secs=(got[2]||'').match(/§\s*[0-9A-Za-z]+/g) || [];
      if(!secs.length) orphan.push(want[0]+' cites no section');
      secs.forEach(s=>{ const id='sec-'+s.replace(/§\s*/,'').replace('0','what');
        if(!document.getElementById(id) && !document.getElementById('sec-'+s.replace(/§\s*/,'')))
          orphan.push(want[0]+' cites '+s+', which does not exist'); });
    });
    if(rows.length!==10) bad.push(rows.length+' principles, frozen at 10');
    return {bad, orphan, n:rows.length};
  });
  if (con.missing) fails.push('CONSTITUTION: front.constitution is not in the paper order');
  else {
    if (con.bad.length)    fails.push('CONSTITUTION FROZEN: '+con.bad.join('; '));
    if (con.orphan.length) fails.push('CONSTITUTION CITES: '+con.orphan.join('; '));
    if (!con.bad.length && !con.orphan.length)
      console.log('constitution frozen ok — I through X in the shipped order, every citation resolves');
  }

  if(errs.length) fails.push('page errors in views: '+errs.join(' | '));
  console.log('three views ok — paper '+seen.paper.n+', ledger '+seen.ledger.n+', brief '+seen.brief.n+
              ' blocks; '+numbered.length+' numbered ToC links resolve, +§C');
  await p.close();
}

// 2e. the reading carries no version archaeology (r43)
{
  const p=await b.newPage({viewport:{width:1440,height:1200}});
  await p.goto(f);
  const RE=/release\s+\d+|releases\s+\d+|\bdefect\s+\d+|\bv\d{1,2}\b|thirty-\w+ releases|forty-\w+ releases/i;
  const notice=await p.evaluate(()=>{
    const n=[...document.querySelectorAll('.notice.key')].find(e=>/replays itself/i.test(e.textContent));
    return n?n.textContent:'MISSING';
  });
  if(notice==='MISSING') fails.push('opening notice not found');
  else if(RE.test(notice)) fails.push('opening notice still carries version archaeology: '+(notice.match(RE)||[])[0]);
  await p.evaluate(()=>setView('paper'));
  /* The "changed in vN" marker is engine chrome and belongs to every view of a
     ledger document; the rule the operator set is about PROSE. Strip the marker
     and its recorded reason, then test what is left to read. */
  /* r130 · the paper now carries the record beneath each section, and the
     record keeps its release references BY r90's own doctrine — "the past
     being offered deliberately." The archaeology law binds what was authored
     as timeless narrative: the paper.* blocks, the Constitution, and the
     registers summary. Everything imported from the ledger is record. */
  const dirty=await p.evaluate((src)=>{
    const re=new RegExp(src,'i');
    return [...document.querySelectorAll('#doc section.blk')]
      .filter(b=>/^blk-(paper\.|front\.constitution)/.test(b.id)).map(b=>{
      const c=b.cloneNode(true);
      c.querySelectorAll('.chgtag').forEach(t=>t.parentElement.remove());
      return re.test(c.textContent) ? b.id+': '+(c.textContent.match(re)||[])[0] : null;
    }).filter(Boolean);
  }, RE.source);
  if(dirty.length) fails.push('white-paper sections carry version archaeology: '+dirty.join(' | '));
  console.log('reading is clean — opening notice + '+(await p.evaluate(()=>PAPER_ORDER.length))+' white-paper sections carry no release references');
  await p.close();
}

// 2f. no release renders blank in the DEFAULT view, and every view is navigable (r49)
{
  const p=await b.newPage({viewport:{width:1440,height:1200}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(f);
  const VN=await p.evaluate(()=>VMAX);
  const blank=[], noIndex=[];
  for(const k of ['paper','ledger','brief']){
    await p.evaluate(n=>setView(n),k);
    for(let v=1;v<=VN;v++){
      const r=await p.evaluate(n=>{ goto(n); return {
        blocks:document.querySelectorAll('#doc section.blk').length,
        chars:document.getElementById('doc').textContent.trim().length,
        fell:!!document.querySelector('.fellback'),
        chips:document.querySelectorAll('#chips button').length}; }, v);
      if(!r.blocks || r.chars<400) blank.push(k+' v'+v+' renders '+r.blocks+' blocks / '+r.chars+' chars');
      if(r.chips<2) noIndex.push(k+' v'+v+' has '+r.chips+' index chips');
    }
  }
  if(blank.length) fails.push('BLANK RELEASES: '+blank.slice(0,6).join(' | ')+(blank.length>6?' (+'+(blank.length-6)+' more)':''));
  if(noIndex.length) fails.push('NO SECTION INDEX: '+noIndex.slice(0,6).join(' | '));

  // the fallback must announce itself rather than silently substituting
  await p.evaluate(()=>{ setView('paper'); goto(1); });
  const fb=await p.evaluate(()=>{ const e=document.querySelector('.fellback'); return e?e.textContent:''; });
  if(!/complete record/i.test(fb)) fails.push('fallback does not tell the reader what it substituted');
  if(!/release\s+41/.test(fb)) fails.push('fallback does not name the release the view begins at: '+fb.slice(0,120));

  // § numbers in the paper, named families in the record
  await p.evaluate(()=>{ setView('paper'); goto(VMAX); });
  const pc=await p.evaluate(()=>[...document.querySelectorAll('#chips button')].map(b=>b.textContent));
  if(pc.filter(x=>/^§\d+$/.test(x)).length<13) fails.push('paper index is missing § numbers: '+pc.join(' '));
  await p.evaluate(()=>{ setView('ledger'); goto(VMAX); });
  const lc=await p.evaluate(()=>[...document.querySelectorAll('#chips button')].map(b=>b.textContent));
  if(lc.length<12) fails.push('record index has only '+lc.length+' entries');
  if(new Set(lc).size!==lc.length) fails.push('record index has duplicate labels: '+lc.join(' '));

  // a chip actually moves the reader, and does not disturb the version hash
  await p.evaluate(()=>{ setView('paper'); goto(VMAX); window.scrollTo(0,0); });
  const h0=await p.evaluate(()=>location.hash);
  await p.evaluate(()=>{ [...document.querySelectorAll('#chips button')].filter(b=>b.textContent==='§9')[0].click(); });
  await p.waitForTimeout(700);
  const moved=await p.evaluate(()=>({y:window.scrollY, hash:location.hash,
    reading: document.body.classList.contains('paged'),
    showsTarget: (()=>{ const t=document.getElementById('sec-9');
      return !!t && t.closest('section.blk').classList.contains('pg'); })(),
    on:(document.querySelector('#chips button.on')||{}).textContent||''}));
  /* r102: "moved the reader" is no longer "scrolled down". A view opens in
     one-cell reading, so a chip OPENS ITS CELL and lands at the top of it —
     scrollY 0 is the correct outcome, not a dead chip. The question that
     survives the mode change is: did the reader end up in §9? Asserted two
     ways, so a rail that lights up without moving anything still fails. */
  if(moved.reading){
    if(!moved.showsTarget) fails.push('section chip did not open its cell (§9 is not the section on screen)');
    if(moved.on!=='§9')    fails.push('section chip did not light its own rail cell (on='+moved.on+')');
  } else {
    if(moved.y<200) fails.push('section chip did not scroll the reader (y='+moved.y+')');
  }
  if(moved.hash!==h0) fails.push('section chip changed the version hash: '+h0+' -> '+moved.hash);

  // comparison is a property of the record, not of the open view
  const cross=await p.evaluate(()=>{
    const o={};
    for(const k of Object.keys(VIEWS)){ setView(k);
      const r=compare(1,VMAX);
      o[k]=r.filter(x=>x.kind==='added').length+'/'+r.filter(x=>x.kind==='revised').length+
           '/'+r.filter(x=>x.kind==='removed').length+'/'+improvements(VMAX).length; }
    setView('paper'); return o;
  });
  if(new Set(Object.values(cross)).size!==1)
    fails.push('comparison depends on the open view: '+JSON.stringify(cross));
  if(errs.length) fails.push('page errors in the reachability pass: '+errs.join(' | '));
  console.log('every release reachable — '+(VN*3)+' view/release states, 0 blank, index in all three; '+
              'compare view-independent '+cross.paper);
  await p.close();
}

// 3. responsive x versions
for(const [w,h,label] of [[375,812,'phone'],[768,1024,'tablet'],[1440,900,'desktop']]){
  for(const theme of ['light','dark']){
    const p=await b.newPage({viewport:{width:w,height:h},colorScheme:theme});
    await p.goto(f);
    await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
    const VN=await p.evaluate(()=>VMAX);
    for(let v=1;v<=VN;v++){
      await p.evaluate(n=>goto(n),v);
      const r=await p.evaluate(()=>{
        const de=document.documentElement;
        const over=[...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>de.clientWidth+1
          && !e.closest('.scroll') && !e.closest('pre') && !e.closest('.chips')).map(e=>e.tagName+'.'+(e.className||'').toString().slice(0,34));
        const clip=[...document.querySelectorAll('.scroll')].filter(d=>d.scrollWidth>d.clientWidth+1).length;
        return {sw:de.scrollWidth, cw:de.clientWidth, over:[...new Set(over)].slice(0,5), clip};
      });
      const tag=`${label} ${w} ${theme} v${v}`;
      if(r.sw>r.cw+1) fails.push(`${tag}: BODY H-SCROLL ${r.sw}>${r.cw} :: ${r.over.join(', ')}`);
      if(r.over.length) fails.push(`${tag}: OVERFLOW ${r.over.join(', ')}`);
      if(w>=980 && r.clip) fails.push(`${tag}: ${r.clip} clipped wrappers at desktop width`);
    }
    console.log(label,w,theme,'ok');
    if(label==='phone'&&theme==='light') await p.screenshot({path:new URL('./lv-375.png',import.meta.url).pathname});
    await p.close();
  }
}
/* ── r81 · PASS-WORDS (defect 28) ───────────────────────────────────────
   The document says of its own review panel: "exactly 111 words, asserted by
   the gate rather than estimated", and the panel caption says the same. Until
   r81 NOTHING READ `w`. The counts were in fact correct -- verified by hand at
   authoring time -- but a hand check that is not institutionalised is not an
   assertion, and the document was claiming one. Claiming verification you do
   not perform is the worst-shaped defect this file can carry.

   Also asserts the READINGS, which are the same discipline at 19x the volume. */
{
  /* the responsive sweep closes its own pages, so open a fresh one */
  const pp = await b.newPage();
  await pp.goto(f);
  await pp.waitForTimeout(250);
  const pw = await pp.evaluate(() => {
    const wc = h => { const d = document.createElement('div'); d.innerHTML = h;
                      return d.textContent.trim().split(/\s+/).filter(Boolean).length; };
    const out = { passes: [], mot: null, readings: [] };
    if (typeof PASSES !== 'undefined')
      out.passes = PASSES.map(q => ({ n: q.n, claims: q.w, actual: wc(q.found) }));
    if (typeof PASS_MOT !== 'undefined')
      out.mot = { claims: PASS_MOT.w, actual: wc(PASS_MOT.text) };
    if (typeof READINGS !== 'undefined')
      out.readings = READINGS.map(r => {
        const d = document.createElement('div'); d.innerHTML = r.found;
        const t = d.textContent.trim();
        const w = t.split(/\s+/).filter(Boolean);
        return { id: r.m + '/§' + r.s, actual: w.length,
                 last: (w[w.length - 1] || '').replace(/[^A-Za-z]/g, '').toLowerCase(),
                 tail: w.slice(-15).join(' ').toLowerCase() };
      });
    return out;
  });
  for (const q of pw.passes)
    if (q.claims !== q.actual)
      fails.push(`PASS-WORDS: pass ${q.n} claims ${q.claims} words, is ${q.actual}`);
  if (pw.mot && pw.mot.claims !== pw.mot.actual)
    fails.push(`PASS-WORDS: MoT claims ${pw.mot.claims} words, is ${pw.mot.actual}`);
  // DEFECT 29 — a reading may not END on a word a sentence cannot end on, and may
  // not carry the deleted padder's clauses in its tail. r84/r85 reached 111 by
  // appending filler and cutting words off the end; twenty-five shipped ending
  // "It is, on." or "and it holds without exception here on the". The count was
  // true and the reading was not. These two rules would have caught every one.
  const NONFINAL = new Set(('a an the and or but of to in on as at by for from with than which ' +
    'that these those their his her its our your my is are was were be been being into onto ' +
    'upon while when where whose').split(' '));
  const PADDER = ['on the record', 'in this release', 'as written', 'and it holds',
                  'without exception'];
  for (const r of pw.readings) {
    if (r.actual !== 111)
      fails.push(`READING-WORDS: ${r.id} is ${r.actual} words, must be 111`);
    if (NONFINAL.has(r.last))
      fails.push(`READING-TAIL: ${r.id} ends on "${r.last}" — severed, not a sentence`);
    for (const f of PADDER)
      if (r.tail.includes(f))
        fails.push(`READING-FILLER: ${r.id} carries padder clause "${f}" in its tail`);
  }
  console.log(`pass words ok — ${pw.passes.length} passes + MoT` +
    (pw.readings.length ? ` + ${pw.readings.length} readings` : '') + ' verified, not asserted');
  await pp.close();
}

/* r94: the browser used to close here. The right-rail sweep below needs it, and
   the ONE-DOCUMENT check under this line is a filesystem check that does not. */

/* ── r79 · ONE-DOCUMENT ─────────────────────────────────────────────────
   Three registers lived as markdown side-files until r79 (defect 27), which is
   the exact failure docs/VISION2525_DOCUMENT_SPEC.md §0 exists to prevent --
   and it had already begun: open.external had not moved since r55 while the
   r75 review round lived only in markdown.

   This assertion is what stops the split coming back. It is deliberately a
   FILESYSTEM check, not a document check: the defect is not something the
   document can see about itself. */
{
  const fsmod = await import('node:fs');
  const dir = '/home/user/eXeL-AI-Polling/docs';
  const strays = fsmod.readdirSync(dir).filter(f => /^V17_.*\.md$/.test(f));
  if (strays.length) fails.push('ONE-DOCUMENT: registers are back outside the ledger -- docs/' +
    strays.join(', docs/') + '. They belong in open.questions / open.asks / open.external.');
  else console.log('one document ok — no docs/V17_*.md; the registers are ledger blocks');
}

/* ── r94 · RIGHT RAIL + NO BURIAL ─────────────────────────────────────────
   The operator asked twice for "↑ CONTENTS" to be right-justified, and asked
   because the way back was hard to find in the long NOSE sections under the
   Constitution. Two properties now carry that, and neither is self-evident
   from reading the CSS -- flex + margin-left:auto can be defeated by a padding
   change, and a sticky offset can be defeated by the deck growing a row.

   RIGHT RAIL  the anchor's right edge sits on the eyebrow's content-box right
               edge, in every view and at every width. Pre-r94 the gap was
               403px at 1440 and 109px at 375.
   NO BURIAL   scrolled into a section, the pinned eyebrow sits AT the deck's
               bottom and never behind it. A hard-coded top would bury it in
               three of the five deck states (42 / 148 / 184 / 240). */
for(const [w,h,label] of [[320,812,'phone-320'],[375,812,'phone'],[768,1024,'tablet'],[1440,900,'desktop']]){
  for(const theme of ['light','dark']){
    const p=await b.newPage({viewport:{width:w,height:h},colorScheme:theme});
    await p.goto(f);
    await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
    /* r98: this sweep is about SCROLL-mode geometry — twenty-one eyebrows down a
       continuous page. Full doc now opens PAGED, where twenty of them are
       display:none and measure as a zero rect, which reads as "buried" and is
       not. Paging off here; the paged case has its own burial assertion in the
       PAGED block, measured on the page actually displayed. */
    const unread = async () => {
      /* r102: reading mode is now entered by EVERY setView, so turning it off
         once before the loop is not enough — the second view turns it straight
         back on and the sweep measures twenty-four display:none eyebrows, whose
         rect is all zeros and therefore reads as "buried by the whole deck".
         That is the r98 mistake exactly, and it is the probe that was wrong both
         times: the rule stands, the measurement has to be of something visible.
         The paged case keeps its own burial assertion in the READING block,
         measured on the cell actually displayed. */
      /* r104: #bPage is gone — reading one cell at a time simply IS how a view
         behaves. "Un-read" is now the straight-through preference, which lives
         in Settings; clicking it through evaluate() works while it is in the
         closed drawer, because the handler does not care about visibility. */
      await p.evaluate(()=>{ if(document.body.classList.contains('paged')) document.getElementById('bFull').click(); });
      await p.waitForTimeout(150);
    };
    await unread();
    for(const v of ['full','paper','outline','brief','ledger']){
      if(v!=='full'){ await p.evaluate(x=>setView(x),v); await p.waitForTimeout(160); await unread(); }
      const r=await p.evaluate(async()=>{
        const settle=async()=>{let last=-1,same=0;
          for(let i=0;i<80&&same<4;i++){await new Promise(r=>requestAnimationFrame(r));
            const y=window.scrollY; if(y===last)same++; else {same=0;last=y;}}};
        const eyebrows=[...document.querySelectorAll('#doc .secn')]
          .filter(s=>s.querySelector('a[href="#sec-0"]'));
        let worst=0, worstOn=null, notSticky=0;
        for(const s of eyebrows){
          const a=s.querySelector('a'), cs=getComputedStyle(s);
          if(cs.position!=='sticky') notSticky++;
          const padR=parseFloat(cs.paddingRight)||0;
          const d=Math.abs((s.getBoundingClientRect().right-padR)-a.getBoundingClientRect().right);
          if(d>worst){ worst=d; worstOn=s.textContent.replace(/\s+/g,' ').trim().slice(0,30); }
        }
        /* burial: pick a section with an eyebrow, land in it, then read deep */
        let buried=null, pinnedAt=null;
        const host=eyebrows[Math.min(3,eyebrows.length-1)];
        if(host){
          const sec=host.closest('section.blk');
          sec.scrollIntoView({block:'start'}); await settle();
          window.scrollBy(0, Math.min(700, sec.getBoundingClientRect().height-200)); await settle();
          const deck=document.querySelector('.deck').getBoundingClientRect();
          const eb=host.getBoundingClientRect();
          buried = eb.top < deck.bottom-1.5;
          pinnedAt = Math.round(eb.top-deck.bottom);
        }
        window.scrollTo(0,0);
        return {n:eyebrows.length, worst:+worst.toFixed(2), worstOn, notSticky, buried, pinnedAt};
      });
      const tag=`${label} ${theme} ${v}`;
      if(!r.n) continue;                      /* brief/outline carry no §-eyebrows */
      if(r.worst>1.5) fails.push(`RIGHT RAIL ${tag}: contents link ${r.worst}px off the right edge (${r.worstOn})`);
      if(r.notSticky) fails.push(`RIGHT RAIL ${tag}: ${r.notSticky} eyebrows are not sticky`);
      if(r.buried) fails.push(`NO BURIAL ${tag}: pinned eyebrow sits ${-r.pinnedAt}px behind the deck`);
    }
    await p.close();
  }
}
if(!fails.length) console.log('right rail ok — contents link flush right and pinned clear of the deck, '+
                              '4 widths x 2 themes x 5 views');

/* ── r97 · FOUR READINGS + OUTLINE→DETAILS (defects 33, 34, 36) ──────────
   33  the outline view had no branch in renderViewBanner and fell through to
       the ledger's, so twenty short entries announced themselves as "the
       complete record, 87 sections".
   34  the white paper claimed "Thirteen numbered sections". There are nineteen.
   36  the outline carried ZERO links: nineteen 111-word entries and no way to
       reach the section any of them stands for.
   Asserted: every view shows a visible banner, no two banners are the same
   text, the paper banner's section count matches the sections actually shown,
   and every out-N carries exactly one link pointing at its own sec-N. */
{
  const p = await b.newPage({viewport:{width:1100,height:900}});
  await p.goto(f);
  const seen = new Map();
  for(const v of ['full','paper','outline','brief','ledger']){
    if(v !== 'full'){ await p.evaluate(x=>setView(x), v); await p.waitForTimeout(200); }
    const r = await p.evaluate(()=>{
      const vb = document.querySelector('.viewban');
      const txt = vb && vb.offsetParent !== null ? vb.textContent.replace(/\s+/g,' ').trim() : null;
      const links = [...document.querySelectorAll('.outlink a')].map(a=>a.getAttribute('href'));
      const outs = [...document.querySelectorAll('h2.sech[id^="out-"]')]
        .map(h=>h.id).filter(id=>/^out-[1-9]\d*$/.test(id));
      const secs = [...document.querySelectorAll('h2.sech[id^="sec-"]')]
        .map(h=>h.id).filter(id=>/^sec-[1-9]\d*$/.test(id));
      return {txt, links, outs, secs};
    });
    if(!r.txt){ fails.push(`VIEW IDENTITY ${v}: no visible banner — the view does not say what it is`); continue; }
    if(seen.has(r.txt)) fails.push(`VIEW IDENTITY ${v}: shows the SAME banner as ${seen.get(r.txt)}`);
    seen.set(r.txt, v);
    if(!new RegExp('^(Full document|White paper|Outline|Brief|Ledger)\\b').test(r.txt))
      fails.push(`VIEW IDENTITY ${v}: banner does not open with the view's own name`);
    if(v === 'paper'){
      const claimed = /(\d+) numbered sections/.exec(r.txt);
      if(!claimed) fails.push('COUNTED NOT TYPED paper: banner states no section count');
      else if(+claimed[1] !== r.secs.length)
        fails.push(`COUNTED NOT TYPED paper: banner says ${claimed[1]} numbered sections, ${r.secs.length} are rendered`);
    }
    if(r.outs.length){
      if(r.links.length !== r.outs.length)
        fails.push(`OUTLINE→DETAILS ${v}: ${r.outs.length} outline entries but ${r.links.length} links`);
      for(const id of r.outs){
        const want = '#sec-' + id.slice(4);
        if(!r.links.includes(want)) fails.push(`OUTLINE→DETAILS ${v}: ${id} has no link to ${want}`);
      }
    }
  }
  if(seen.size === 5) console.log('view identity ok — 5 views, 5 distinct banners, counts match what is rendered');
  await p.close();
}

/* ── r102 · READING (was r98 PAGED) ──────────────────────────────────────
   The contract changed, so the assertions did. r98/r100 paged FULL DOC over a
   hard-coded list of twenty sections, which is meaningless in the record or the
   brief and is why one-cell reading only ever worked in one mode.

   What is asserted now, and it is strictly more than before:
     · FULL DOC HAS ZERO TOGGLES — no arrows, no Pages button, nothing hidden
     · Full doc IS the white paper: same blocks as PAPER_ORDER, no more
     · in EVERY view: exactly the current cell is on screen, the rail says which,
       the counter agrees with the rail, the neighbour labels are the neighbours'
       own, the ends are stubs, and clicking any chip opens that cell
     · TOTALITY — the cells partition the rendered blocks exactly once, so no
       block can be hidden by reading being on
     · the 110,554px tail is off every cell but the last, and back on the last
     · the bottom of a cell is reachable with the arrows on screen
     · COVERAGE — the four view orders together cover every live block, which is
       what makes Full-Doc-as-the-paper lose nothing */
{
  const p = await b.newPage({viewport:{width:390,height:844}});
  await p.goto(f); await p.waitForTimeout(400);
  const r = await p.evaluate(async ()=>{
    const out = {errors:[], notes:[]};
    const T = e => e ? e.textContent.replace(/\s+/g,' ').trim() : null;
    const settle = async ()=>{ let l=-1,st=0;
      for(let i=0;i<160&&st<5;i++){ await new Promise(r=>requestAnimationFrame(r));
        const y=window.scrollY; if(y===l)st++; else {st=0;l=y;} } };

    /* ── 1 · full doc: zero toggles ─────────────────────────────────────── */
    if (typeof straight === "undefined" || !straight) out.errors.push('did not open reading straight through');
    if (paged) out.errors.push('straight-through opened in reading mode — it must have zero toggles');
    if (document.querySelectorAll('#doc .secnav').length)
      out.errors.push('straight-through has section arrows; the operator asked for none');
    /* r104 · NO PAGES. The toggle was removed outright, not hidden — the
       operator: "just get rid of pages". A hidden button is still a button. */
    if (document.getElementById('bPage'))
      out.errors.push('the Pages button is back in the DOM; it was removed, not hidden');
    {
      const all = [...document.querySelectorAll('#doc section.blk')];
      const hid = all.filter(s => getComputedStyle(s).display === 'none');
      if (hid.length) out.errors.push(`${hid.length} blocks hidden in full doc; it must read straight through`);
      const ids = all.map(s => s.id.replace(/^blk-/,''));
      const want = WP_ORDER.filter(id => ids.indexOf(id) >= 0);
      if (all.length !== want.length)
        out.errors.push(`full doc has ${all.length} blocks; the white paper has ${want.length}`);
      const stray = ids.filter(id => WP_ORDER.indexOf(id) < 0);
      if (stray.length) out.errors.push('full doc carries non-paper blocks: ' + stray.slice(0,4).join(', '));
      out.notes.push(`full doc = white paper, ${all.length} blocks, zero toggles`);
      if (!document.querySelectorAll('#chips button').length)
        out.errors.push('full doc has no rail — the operator listed it among the five that carry JUMP TOC §0 …');
    }

    /* ── 2 · COVERAGE: nothing lives only in full doc ────────────────────── */
    {
      const union = new Set([...WP_ORDER, ...PAPER_ORDER, ...OUTLINE_ORDER, ...BRIEF_ORDER, ...LEDGER_ORDER, ...NOSE_ORDER]);  /* r139: the scaffold owns its own order */
      const live = replay(VMAX, ALL_ORDER).map(x => x.id);
      const orphan = live.filter(id => !union.has(id));
      if (orphan.length)
        out.errors.push(`COVERAGE: ${orphan.length} live block(s) are in no view and would vanish with full doc: ` + orphan.slice(0,4).join(', '));
      else out.notes.push(`coverage ${live.length}/${live.length} — every live block is in at least one view`);
    }

    /* ── 3 · every view reads one cell at a time ─────────────────────────── */
    for (const v of ['paper','outline','brief','ledger']){
      setView(v);
      await new Promise(r=>setTimeout(r,260));
      const cells = cellsIn();
      const n = cells.length;
      if (n < 2){ out.errors.push(`${v}: only ${n} cell(s)`); continue; }
      if (!paged) out.errors.push(`${v} did not open in reading mode`);

      /* TOTALITY — the cells partition the blocks exactly once */
      const blocks = [...document.querySelectorAll('#doc section.blk')];
      const covered = [];
      cells.forEach(c => c.blocks.forEach(x => covered.push(x)));
      if (covered.length !== blocks.length)
        out.errors.push(`${v}: cells cover ${covered.length} of ${blocks.length} blocks — a block would be unreachable`);
      if (new Set(covered).size !== covered.length)
        out.errors.push(`${v}: a block belongs to more than one cell`);

      const rail = [...document.querySelectorAll('#chips button')];
      if (rail.length !== n) out.errors.push(`${v}: rail has ${rail.length} chips for ${n} cells`);

      /* walk every cell by CLICKING ITS CHIP — the reader's actual gesture */
      for (let i = 0; i < n; i++){
        rail[i].click();
        await new Promise(r=>setTimeout(r,45));
        const vis = blocks.filter(x => getComputedStyle(x).display !== 'none');
        if (vis.length !== cells[i].blocks.length)
          out.errors.push(`${v} cell ${i} (${cells[i].label}): ${vis.length} blocks on screen, cell holds ${cells[i].blocks.length}`);
        const on = document.querySelector('#chips button.on');
        if (!on || T(on) !== cells[i].label)
          out.errors.push(`${v} cell ${i}: rail says "${on?T(on):'nothing'}", reader is in "${cells[i].label}"`);
        const nav = document.querySelector('#doc section.blk.pg .secnav');
        if (!nav){ out.errors.push(`${v} cell ${i}: no arrows`); continue; }
        /* r104 · NO PAGE COUNT. Operator: "we do not want a page count." The
           label between the arrows is the cell's own name and nothing else —
           the rail above already says how far along you are, and a second
           counter is the document telling you how long it is while you are
           trying to read it. The rule is now the inverse of r102's. */
        const cnt = T(nav.querySelector('.cnt'));
        if (cnt !== cells[i].label)
          out.errors.push(`${v} cell ${i}: counter "${cnt}" != "${cells[i].label}"`);
        if (/\bof\s+\d/.test(cnt || ''))
          out.errors.push(`${v} cell ${i}: the page count is back — "${cnt}"`);
        const prevA = nav.querySelector('a:not(.nx)'), nextA = nav.querySelector('a.nx');
        if (i === 0 && prevA) out.errors.push(`${v}: first cell has a live prev`);
        if (i === n-1 && nextA) out.errors.push(`${v}: last cell has a live next`);
        if (i > 0 && (!prevA || T(prevA.querySelector('.tx')).indexOf(cells[i-1].label) !== 0))
          out.errors.push(`${v} cell ${i}: prev label is not the previous cell's own name`);
        if (i < n-1 && (!nextA || T(nextA.querySelector('.tx')).indexOf(cells[i+1].label) !== 0))
          out.errors.push(`${v} cell ${i}: next label is not the next cell's own name`);
        /* The tail belongs to the last cell only — measured as HEIGHT, not as a
           display flag. #review itself stays on screen at all times because the
           release stepper lives inside it; what must not follow a middle cell is
           the 108,977px of twelve-reviewer panels and record. */
        /* r146 · the audit tail belongs to the FULL-RECORD views only (White
           Paper, Outline, Ledger). The Brief and the NOSE are summaries: they
           render their own cells and nothing else — the review loop, the ledger
           and key-improvements are hidden there by body.brief/body.nose CSS, so
           the tail-height assertions below (both "not under a middle cell" and
           "returns on the last cell") are scoped away from the reader views.
           The "arrows are last" check further down still runs for ALL views —
           a summary must have nothing after its arrows either. */
        const fullRecord = (v !== 'brief' && v !== 'nose');
        const tailH = Math.round(
          document.getElementById('review').getBoundingClientRect().height +
          document.getElementById('ledger').getBoundingClientRect().height);
        if (fullRecord && i < n-1 && tailH > 0)
          out.errors.push(`${v} cell ${i}: ${tailH}px of audit trail sits under a middle cell (budget 900)`);
        /* r104 · ARROWS ARE LAST. The operator's shape for the bottom of a
           section is a rule, two round arrows, and nothing after. r102 left
           1,577px below them — three panel headings, the proof block and the
           footer — and called it free. Only #relnav, the release stepper, may
           follow, for r102's reason: a mode must never hide the way out of
           itself. Measured, so a new element added below cannot slip past. */
        if (i < n-1){
          const seen=[]; let e=nav;
          while(e && e!==document.body){ let sib=e.nextElementSibling;
            while(sib){ if(sib.offsetParent!==null && sib.getBoundingClientRect().height>2)
              seen.push((sib.id||sib.tagName+'.'+sib.className).slice(0,40)); sib=sib.nextElementSibling; }
            e=e.parentElement; }
          if(seen.length)
            out.errors.push(`${v} cell ${i}: ${seen.length} element(s) render after the arrows — ${seen.slice(0,4).join(', ')}`);
        }
        /* r189 · operator: the WHITE PAPER reading ends clean at the Author/ALVAR — the
           audit trail does NOT return on its last cell (it lives in Full Doc and the
           Ledger). The Outline and Ledger keep r104's "returns on the last cell". */
        if ((v === 'outline' || v === 'ledger') && i === n-1 && tailH < 5000)
          out.errors.push(`${v}: the audit trail does not return on the last cell (${tailH}px)`);
        if (v === 'paper' && i === n-1 && tailH > 900)
          out.errors.push(`paper: the audit trail still trails the last cell (${tailH}px) — the reading must end at the author`);
      }
      out.notes.push(`${v}: ${n} cells, each read alone, rail and counter agree`);
    }

    /* ── 4 · the bottom of a cell, with its arrows on screen ─────────────── */
    setView('paper'); await new Promise(r=>setTimeout(r,260));
    /* r130 · ANCHOR BY CONTENT, NEVER BY INDEX. showCell(10) was §8's cell
       when the paper had 24 of them; the full-document order moved the
       indices and cell 10 became §3's — which rule 5 below also opens, so
       this rule's bottom-scroll leaked into that one's measurement. The
       cell this rule always meant is §8's, so it is named. */
    goTo('sec-8'); window.scrollTo(0,0); await new Promise(r=>setTimeout(r,120));
    {
      const chrome = Math.round(document.getElementById('doc').getBoundingClientRect().top + window.scrollY);
      /* The budget is the DECK plus a little, not a flat number: the deck is the
         navigation and is 42px in full doc but 208px in a view at 390. Measured
         after hiding the cover, masthead, how-to, key improvements, the view
         banner and — new in r102 — the 1,742px release banner: 240px at 390,
         of which 208 is the deck itself. 32px of real front matter, from 2,135. */
      const deckH = Math.round(document.querySelector('.deck').getBoundingClientRect().height);
      if (chrome - deckH > 80)
        out.errors.push(`${chrome - deckH}px of front matter above a cell beyond the ${deckH}px deck (was 2,135; budget 80)`);
      const de = document.documentElement;
      window.scrollTo(0, de.scrollHeight); await settle();
      if (Math.abs(window.scrollY - (de.scrollHeight - de.clientHeight)) > 3)
        out.errors.push('a cell cannot be scrolled to its bottom');
      const nv = document.querySelector('#doc section.blk.pg .secnav');
      if (!nv) out.errors.push('no arrows at the bottom of the cell');
      else {
        /* The arrows close the CELL; the release stepper, the R-CORE note and the
           footer follow them, so "on screen when the page is scrolled to the very
           bottom" was the wrong question — it asked the arrows to be last on the
           page, which they are not and should not be. Two right questions:
           how far past the arrows the page runs, and whether bringing them into
           view actually works. */
        const after = Math.round(de.scrollHeight - (nv.getBoundingClientRect().bottom + window.scrollY));
        /* What follows the arrows is page furniture, not content: the release
           stepper, the R-CORE note and the footer. Measured at 2,035px — about
           two phone screens — against the 108,977px of reviewer panels and
           record that used to sit there. The budget is 2,400 so a real
           regression still trips it. */
        if (after > 2400)
          out.errors.push(`${after}px of page follows the arrows on a middle cell (budget 2,400)`);
        nv.scrollIntoView({block:'center'});
        await settle();
        const q = nv.getBoundingClientRect();
        if (!(q.top >= 0 && q.bottom <= de.clientHeight))
          out.errors.push('the arrows cannot be brought fully on screen');
        out.notes.push(`arrows reachable, ${after}px of page after them`);
      }
      out.notes.push(`§8: page ${de.scrollHeight}px (was 117,032), front matter ${chrome}px, arrows on screen`);
      window.scrollTo(0,0);
    }

    /* ── 5 · NO BURIAL while reading: the pinned eyebrow clears the deck ─── */
    if (document.getElementById('sec-3')){
      goTo('sec-3'); await settle();
      /* r130 · the rule owns its scroll state, and it WAITS for it: the page
         scrolls smoothly by stylesheet, so a fixed sleep samples mid-flight —
         with the taller full-document cells the animation outlives 200ms and
         the eyebrow is measured somewhere it never rests. settle() after
         every scroll, exactly as the cell-bottom rule above already does. */
      window.scrollTo(0,0); await settle();
      const own = document.getElementById('sec-3').closest('section.blk');
      const eb = own && own.querySelector('.secn');
      if (eb){
        window.scrollBy(0, 400); await settle();
        const deck = document.querySelector('.deck').getBoundingClientRect();
        const q = eb.getBoundingClientRect();
        if (q.top < deck.bottom - 1.5)
          out.errors.push(`pinned eyebrow on the open cell sits ${Math.round(deck.bottom-q.top)}px behind the deck`);
      }
    }
    return out;
  });
  r.errors.forEach(e=>fails.push('READING: '+e));
  if(!r.errors.length){
    console.log('reading ok — ' + r.notes.join('; '));
  }
  await p.close();
}

/* ── r101 · NO ENTITY SOURCE ON SCREEN (defect 37) ───────────────────────
   The operator photographed the Compare table and it read, in the middle of a
   sentence about wages: "0.6867 &#50883; at 4.807 per hour", and beside it the
   r56 note calling 0.138 "&ldquo;the correct fraction&rdquo;". The escaper
   replaced every ampersand, so an authored &sect; or &mdash; printed as its own
   source. MEASURED before the fix: 198 entity strings visible as text across the
   release banners, key improvements and the compare table; 79 of 285 ledger
   entries were affected, and two entries that had authored a <code> and an <em>
   printed literal angle brackets.

   The rule has NO EXEMPTIONS, deliberately. When the r101 release note quoted
   the broken output to explain it, the count came back 4 instead of 0 — and the
   note was rewritten to name the characters in words rather than weaken the
   rule. A gate that a release note may violate is a gate nobody trusts.

   Scoped to RENDERED text: the ledger lives in a <script> in the body, and
   document.body.textContent would count 6,000 entity strings of source that are
   not on anybody's screen. Clone, strip script/style, then read. */
{
  const p = await b.newPage({viewport:{width:1280,height:1000}});
  await p.goto(f); await p.waitForTimeout(700);
  await p.evaluate(()=>{ const e=document.getElementById("bCmp"); if(e) e.click(); });
  await p.waitForTimeout(500);
  const r = await p.evaluate(()=>{
    const RE = /&(?:[a-zA-Z]{2,10}|#\d{2,6});/g;
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll("script,style,template").forEach(e=>e.remove());
    const shown = clone.textContent;
    const hits = shown.match(RE) || [];
    /* Locate them, so a failure names the surface rather than just a number. */
    const where = [];
    const walk = n => {
      if (n.nodeType === 3){
        const m = n.nodeValue.match(RE);
        if (m){ let el=n.parentElement, path=[];
          while(el && path.length<3){ path.push(el.tagName+(el.id?"#"+el.id:"")); el=el.parentElement; }
          where.push(m.join(",")+" in "+path.join("<")); }
        return;
      }
      if (n.nodeType!==1 || /^(SCRIPT|STYLE|TEMPLATE)$/.test(n.tagName)) return;
      n.childNodes.forEach(walk);
    };
    walk(document.body);
    return {n:hits.length, where:where.slice(0,6),
            litTag: shown.includes("<code>") || shown.includes("<em>"),
            authored: clone.innerHTML.includes("/Vision-2525/White-Paper</code>")};
  });
  await p.close();
  if (r.n) fails.push('NO ENTITY SOURCE: '+r.n+' entity strings print as text — '+r.where.join(' | '));
  if (r.litTag) fails.push('NO ENTITY SOURCE: a literal <code>/<em> tag prints as text in a `why` field');
  if (!r.authored) fails.push('NO ENTITY SOURCE: the authored <code> in r68 fund.membership no longer renders as a tag');
  if (!r.n && !r.litTag && r.authored)
    console.log('no entity source ok — 0 entity strings visible as text; authored <code>/<em> render');
}

/* ── r96 · DEFINED PALETTE (defect 32) ───────────────────────────────────
   The register menu was styled with --card, --line and --tint: three custom
   properties this document has never defined. Used once each, declared zero
   times, so the menu had NO BACKGROUND — the deck showed through it and its
   heading printed over the Full-doc button. Six registers, the entire audit
   trail, reachable only through a menu the reader could not see.

   A var() that resolves to nothing fails silently: no console error, no
   validator warning, just a property that quietly does not apply. That is
   exactly the class of defect a gate exists for. Source-level, no browser. */
{
  const fsmod = await import('node:fs');
  const html = fsmod.readFileSync('/home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html','utf8');
  const head = html.slice(0, html.indexOf('</style>'));
  const defined = new Set([...head.matchAll(/(--[a-z0-9-]+)\s*:/g)].map(m=>m[1]));
  /* A var() WITH a fallback cannot fail silently — --deckh is set from JS at
     runtime and always written var(--deckh,42px), which is correct and stays
     legal. The rule is about the bare form, which resolves to nothing. */
  const used = new Map();
  for(const m of head.matchAll(/var\((--[a-z0-9-]+)\s*([,)])/g))
    if(m[2] === ')') used.set(m[1], (used.get(m[1])||0)+1);
  const undef = [...used.keys()].filter(v=>!defined.has(v));
  if(undef.length) fails.push('DEFINED PALETTE: ' + undef.map(v=>v+' ('+used.get(v)+'x)').join(', ') +
    ' used in CSS but never declared — the property silently does not apply');
  else console.log('defined palette ok — '+used.size+' custom properties used, all '+defined.size+' declared');
}

/* ── r104 · DRAWN ICONS · NO ORPHAN CONTROL · DECK BUDGET ────────────────
   Three rules, one release, all three answering things the operator said.

   DRAWN ICONS      "setting icons must be drawn; never use emogies; we solved
                    that problem in Security-2525." Every control carries an
                    inline <svg>, and no control label may contain a character
                    in the pictographic ranges — Miscellaneous Symbols
                    U+2600-26FF, Dingbats U+2700-27BF, Geometric Shapes
                    U+25A0-25FF, Emoji U+1F300-1FAFF. Those are where the
                    substitution happens: the gear and the crescent moon render
                    as colour emoji on Apple platforms whatever the CSS says.
                    Mutation-proven: put &#9881; back on #bSet and this fails.
                    Prose is NOT a control. The warning sign inside a ledger
                    block's .tag is authored history and is left alone.

   NO ORPHAN CONTROL  moving a control must not be a way of deleting it. Each
                    control that left the deck in r104 is named, and each must
                    exist. A count would pass a deletion; a name cannot.

   DECK BUDGET      273px of chrome on a phone before a word of the argument.
                    Ceiling 160px at 390x844, measured in a view (the landing
                    state is smaller and would flatter the number). */
{
  const p=await b.newPage({viewport:{width:390,height:844}});
  await p.goto(f); await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{
    const G=/[☀-➿■-◿\u{1F300}-\u{1FAFF}]/u;
    /* The release PILLS (r1 ... r103) are labels, not icons — a numbered pill
       IS its own symbol. The rule is about controls that stand for an action.
       Naming the stepper's three buttons specifically keeps it that way. */
    const ctl=[...document.querySelectorAll('.deck-in button, .setbody button, .setpanel header button, #relnav .relstep > button')];
    return {
      total: ctl.length,
      noSvg: ctl.filter(b=>!b.querySelector('svg')).map(b=>b.id||b.textContent.trim().slice(0,18)),
      glyph: ctl.filter(b=>G.test(b.textContent||'')).map(b=>(b.id||'?')+':'+b.textContent.trim().slice(0,18)),
      /* r125 · the operator moved the reading-mode toggle (bFull) INTO the deck and
         the change-highlight toggle (bDiff) into the drawer. The law flips with the
         design: every control still exists, bDiff may not sit in the deck, and bFull
         MUST — a mode toggle a reader cannot see is a trap. */
      moved: ['bFull','bDiff','bTheme','bReg','bSpec','bOutline','bLedger','bProof']
               .filter(id=>!document.getElementById(id)),
      inDeck: ['bDiff','bTheme','bReg','bSpec']
               .filter(id=>{const e=document.getElementById(id);return e&&e.closest('.deck-in');}),
      mustDeck: ['bFull','bView','bSet']
               .filter(id=>{const e=document.getElementById(id);return !e||!e.closest('.deck-in');}),
      /* COVERAGE, extended (r104): the toggle now cycles three of the five
         views. The other two are full views reached from Settings, so the rule
         has to count Settings as a route — otherwise moving Outline and Ledger
         off the toggle silently strands 107 blocks and the old rule still
         passes. Every view must be reachable from one place or the other. */
      unreachable: Object.keys(VIEWS).filter(v =>
        VIEW_CYCLE.indexOf(v) < 0 &&
        ![...document.querySelectorAll('.setbody button')].some(b => (b.id||'').toLowerCase() === 'b'+v))
    };
  });
  await p.evaluate(()=>setView('paper')); await p.waitForTimeout(350);
  const deckH=await p.evaluate(()=>Math.round(document.querySelector('.deck').getBoundingClientRect().height));
  await p.close();
  if(r.glyph.length) fails.push('DRAWN ICONS: pictographic character in control label — '+r.glyph.join(' | '));
  if(r.noSvg.length) fails.push('DRAWN ICONS: control with no inline svg — '+r.noSvg.join(', '));
  if(r.moved.length) fails.push('NO ORPHAN CONTROL: '+r.moved.join(', ')+' left the deck and does not exist anywhere');
  if(r.inDeck.length) fails.push('NO ORPHAN CONTROL: '+r.inDeck.join(', ')+' is still in the deck; it belongs in Settings');
  if(r.mustDeck.length) fails.push('NO ORPHAN CONTROL: '+r.mustDeck.join(', ')+' is missing from the deck; the reading-mode toggle must stay visible (r125)');
  if(r.unreachable.length) fails.push('COVERAGE: view(s) '+r.unreachable.join(', ')+
    ' are on neither the toggle nor in Settings — their blocks are unreachable');
  if(deckH>160) fails.push('DECK BUDGET: deck is '+deckH+'px at 390x844, ceiling is 160px');
  if(!r.glyph.length && !r.noSvg.length && !r.moved.length && !r.inDeck.length && !r.mustDeck.length && !r.unreachable.length && deckH<=160)
    console.log('drawn icons ok — '+r.total+' controls, every one an svg, zero pictographic glyphs; deck '+deckH+'px of 160');
}

/* ── r128 · COMMISSIONED GATES (Enlil) ──────────────────────────────────
   FIVE ABSENCES — §4's shield is five absences plus a lock sentence. An
   absence that quietly leaves the text is the exact capture §4 warns about,
   so the rule re-derives the section from replay() — never from the source
   file (the r116/defect-42 law) — and fails on any missing instrument.
   MEASURE TABLE — §10's numbers table went stale at r79, and the r80 caption
   then CLAIMED a build assertion that never existed (defect 43): no gate in
   the repository compared that row until this one. Built 48 releases late,
   its first honest run caught the row stale again (27 against 42). It checks
   every row label, every value cell, and the raised-defect count against the
   latest release's own stats — the ledger checking the ledger. The
   commission said ten rows; the table has eight and a header; the rule binds
   to the eight that exist, because a count that flatters a mandate is
   padding (defect-29 doctrine). */
{
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto(f); await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{
    const win={}; for(const e of replay(VMAX,['paper.s4','paper.s10'],true)) win[e.id]=e;
    const t4=(()=>{const d=document.createElement('div');d.innerHTML=win['paper.s4'].html;
                   return d.textContent.replace(/\s+/g,' ');})();
    const ABSENCES=[
      'no equity exists, so there is nothing to buy',
      'Assets are locked against distribution',
      'no single jurisdiction holds the whole',
      'Recognition can never be purchased at any price',
      'Reserves are funded rather than pledged'];
    const d10=document.createElement('div'); d10.innerHTML=win['paper.s10'].html;
    const rows=[...d10.querySelectorAll('tr')].slice(1);   /* drop the header row */
    const LABELS=['SSSES composite','strongest cube','weakest cube',
      'route handlers in the engine','test functions in the engine',
      'defects raised','reading grade','sections inside that band'];
    const labels=rows.map(tr=>tr.children[0].textContent.trim());
    const defRow=rows.find(tr=>/defects raised/.test(tr.children[0].textContent));
    return {
      missing: ABSENCES.filter(a=>!t4.includes(a)),
      lock: t4.includes('The list is locked at five'),
      nRows: rows.length,
      unmatched: LABELS.filter(L=>!labels.some(x=>x.startsWith(L))),
      extra: labels.filter(x=>!LABELS.some(L=>x.startsWith(L))),
      emptyVals: rows.filter(tr=>!(tr.children[1]&&tr.children[1].textContent.trim())).length,
      raised: defRow?parseInt((defRow.children[1].textContent.match(/\d+/)||['NaN'])[0],10):NaN,
      statsDefects: VERSIONS[VERSIONS.length-1].stats.defects
    };
  });
  await p.close();
  if(r.missing.length) fails.push('FIVE ABSENCES: §4 lost — '+r.missing.join(' | '));
  if(!r.lock) fails.push('FIVE ABSENCES: §4 no longer locks the list at five');
  if(r.nRows!==8) fails.push('MEASURE TABLE: §10 has '+r.nRows+' data rows; the bound set is 8');
  if(r.unmatched.length) fails.push('MEASURE TABLE: row missing — '+r.unmatched.join(', '));
  if(r.extra.length) fails.push('MEASURE TABLE: unbound row — '+r.extra.join(', '));
  if(r.emptyVals) fails.push('MEASURE TABLE: '+r.emptyVals+' empty value cell(s)');
  if(r.raised!==r.statsDefects) fails.push('MEASURE TABLE: defect row says '+r.raised+
    ' raised; the latest release stats say '+r.statsDefects+' — the row went stale in silence again');
  if(!r.missing.length && r.lock && r.nRows===8 && !r.unmatched.length && !r.extra.length
     && !r.emptyVals && r.raised===r.statsDefects)
    console.log('commissioned gates ok — §4 five absences + lock present; §10 measure table 8/8 rows, defect row '+r.raised+' == stats.defects');
}

/* ── r130 · SUPERSET (the MoT-333 commitment, made an exit code) ─────────
   The operator's law: the White Paper is the full document — the Brief, the
   sections, and the record beneath them. It cannot be the scaffold with the
   labels dimmed. So the paper's order must carry every Brief block and every
   narrative block, plus at least seventy blocks neither parent carries; the
   register TABLES stay in the Ledger (the paper carries their 333-word
   summary); and the rendered paper must be strictly larger than the bare
   N.O.S.E. scaffold. More comprehensive is not an opinion here — it fails
   the build the day it stops being true, and nothing is trimmed to fit. */
{
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto(f); await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{
    const missB = BRIEF_ORDER.filter(id=>WP_ORDER.indexOf(id)<0);
    const missP = PAPER_ORDER.filter(id=>WP_ORDER.indexOf(id)<0);
    const extra = WP_ORDER.filter(id=>PAPER_ORDER.indexOf(id)<0 && BRIEF_ORDER.indexOf(id)<0);
    const dupes = WP_ORDER.filter((id,i)=>WP_ORDER.indexOf(id)!==i);
    const regs  = WP_ORDER.filter(id=>/^open\./.test(id));
    /* THE LAW BINDS TO WHAT IS RENDERED, not to the constant — a mutant that
       reverts the view while the constant stays perfect must die here. */
    setView('paper');
    const rids = [...document.querySelectorAll('#doc section.blk')].map(s=>s.id.replace(/^blk-/,''));
    const rMissB = BRIEF_ORDER.filter(id=>rids.indexOf(id)<0);
    const rExtra = rids.filter(id=>PAPER_ORDER.indexOf(id)<0 && BRIEF_ORDER.indexOf(id)<0).length;
    const rHasReg = rids.indexOf('paper.registers')>=0;
    setView('nose');
    const nids = [...document.querySelectorAll('#doc section.blk')].map(s=>s.id.replace(/^blk-/,''));
    /* r139: the scaffold reads NOSE_ORDER — exactly the operator&rsquo;s cell list,
       nothing more. A block outside it is a leak whichever partition it came from. */
    const nExtra = nids.filter(id=>NOSE_ORDER.indexOf(id)<0).length;
    setView('paper');
    return {missB, missP, extraN: extra.length, dupes, regs,
            rMissB, rExtra, rHasReg, nExtra,
            hasReg: WP_ORDER.indexOf('paper.registers')>=0, total: WP_ORDER.length};
  });
  await p.close();
  if(r.missB.length) fails.push('SUPERSET: brief block(s) missing from the white paper — '+r.missB.join(', '));
  if(r.missP.length) fails.push('SUPERSET: narrative block(s) missing from the white paper — '+r.missP.join(', '));
  if(r.extraN<70)    fails.push('SUPERSET: only '+r.extraN+' blocks beyond the two parents; the floor is 70');
  if(r.dupes.length) fails.push('SUPERSET: duplicate ids in the paper order — '+[...new Set(r.dupes)].join(', '));
  if(r.regs.length)  fails.push('SUPERSET: register tables inlined ('+r.regs.join(', ')+') — the paper carries the summary, the Ledger the tables');
  if(!r.hasReg)      fails.push('SUPERSET: the registers summary is missing from the paper order');
  if(r.rMissB.length) fails.push('SUPERSET: RENDERED paper is missing brief block(s) — '+r.rMissB.join(', '));
  if(r.rExtra<70)     fails.push('SUPERSET: RENDERED paper carries only '+r.rExtra+' blocks beyond the parents; the floor is 70');
  if(!r.rHasReg)      fails.push('SUPERSET: RENDERED paper is missing the registers summary');
  if(r.nExtra)        fails.push('SUPERSET: the scaffold reading gained '+r.nExtra+' non-scaffold block(s)');
  if(!r.missB.length && !r.missP.length && r.extraN>=70 && !r.dupes.length && !r.regs.length && r.hasReg
     && !r.rMissB.length && r.rExtra>=70 && r.rHasReg && !r.nExtra)
    console.log('superset ok — rendered paper carries the brief 8/8 + narrative + '+r.rExtra+
      ' record blocks ('+r.total+' ids), registers summarised not inlined, scaffold stays bare');
}

/* ── r133 · PER-SECTION EXTENSION (the operator's law of 2026-08-07) ─────
   The instruction, verbatim in spirit: ensure the White Paper is extended
   beyond N.O.S.E. — not globally, section by section. For every one of the
   nineteen sections the RENDERED White Paper must carry strictly more than
   the rendered scaffold: the record blocks beneath it, and, as they land,
   the essay in the author's voice. WP_ESSAYS is a ratchet bound exactly —
   a lost essay fails, and a new essay shipped without raising the number
   fails too, so the count moves only with a release, never silently. The
   day any section reads as a replica of its scaffold reading, the build
   dies here. */
{
  const WP_ESSAYS = 19;  /* terminal — every section speaks */         /* §1-§7 speak; rises with each batch, locks at nineteen */
  const MIN_EXTRA = 150;       /* every section's paper reading exceeds its scaffold reading by at least this many rendered words */
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto(f); await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{
    const wc=t=>t.trim().split(/\s+/).filter(x=>x).length;
    const words=id=>{const el=document.getElementById('blk-'+id);return el?wc(el.innerText||''):0};
    const wp=VIEWS.paper.order;
    const idx={}; for(let n=1;n<=19;n++) idx[n]=wp.indexOf('paper.s'+n);
    setView('paper');
    const per={}; let essays=0;
    for(let n=1;n<=19;n++){
      if(idx[n]<0){ per[n]={paper:0,nose:0}; continue; }
      let to=wp.length; for(let m=n+1;m<=19;m++) if(idx[m]>idx[n]){ to=idx[m]; break; }
      const span=wp.slice(idx[n],to);
      const blk=document.getElementById('blk-paper.s'+n);
      const wpEl=blk&&blk.querySelector('.wp');
      if(wpEl&&getComputedStyle(wpEl).display!=='none') essays++;
      per[n]={paper:span.reduce((a,id)=>a+words(id),0)};
    }
    setView('nose');
    let leaks=0;
    for(let n=1;n<=19;n++){
      per[n].nose=words('paper.s'+n);
      const el=document.querySelector('#blk-paper\\.s'+n+' .wp');
      if(el&&getComputedStyle(el).display!=='none') leaks++;
    }
    setView('paper');
    return {per,essays,leaks};
  });
  await p.close();
  const thin=Object.entries(r.per).filter(([n,x])=>x.paper<x.nose+MIN_EXTRA);
  if(thin.length) fails.push('EXTENSION: section(s) read as near-replicas of the scaffold — '+
    thin.map(([n,x])=>'§'+n+' (paper '+x.paper+'w vs scaffold '+x.nose+'w)').join(', '));
  if(r.essays!==WP_ESSAYS) fails.push('EXTENSION: '+r.essays+' sections speak in the voice; this release binds exactly '+WP_ESSAYS+
    (r.essays<WP_ESSAYS?' — a voice was lost':' — raise the ratchet with the release, never silently'));
  if(r.leaks) fails.push('EXTENSION: '+r.leaks+' essay(s) visible in the scaffold reading');
  const links = await (async () => {
    const p2=await b.newPage({viewport:{width:1440,height:900}});
    await p2.goto(f); await p2.waitForTimeout(600);
    const r2=await p2.evaluate(() => {
      setView('paper');
      const ls=[...document.querySelectorAll('.plink111 a')];
      const good=ls.filter(a=>/111\s*\u2022\s*Outline/.test(a.textContent)).length;
      const notes=[...document.querySelectorAll('.chgtag')].filter(e=>getComputedStyle(e).display!=='none'&&e.offsetHeight>0).length;
      return {links:ls.length, good, notes};
    });
    await p2.close(); return r2;
  })();
  if(links.links!==19||links.good!==19) fails.push('EXTENSION: '+links.good+'/19 sections carry the 111 \u2022 Outline link');
  if(links.notes) fails.push('EXTENSION: '+links.notes+' release note(s) visible to a fresh reader');
  if(!thin.length && r.essays===WP_ESSAYS && !r.leaks)
    console.log('extension ok — 19/19 sections render beyond their scaffold reading (min +'+MIN_EXTRA+'w), '+
      r.essays+'/19 speak in the voice, none leak into the scaffold');
}

/* ── r140 · SACRED TOTALS (the operator's numbers, made exit codes) ─────────
   brief 3,333 · nose 9,999 · paper 77,777 (retargeted from 66,666 by the operator
   2026.08.12) — measured by the canonical counter:
   per view, straight mode (paged off), visible words only, summed over the
   view's own order. Estimates and intentions do not count; the render does. */
{
  const p=await b.newPage({viewport:{width:1440,height:2000}});
  await p.goto(f); await p.waitForTimeout(1200);
  const t=await p.evaluate(()=>{
    const wcount=s=>s.trim().split(/\s+/).filter(x=>x).length;
    function visText(el){ if(el.nodeType===3) return el.nodeValue;
      if(el.nodeType!==1) return '';
      const st=getComputedStyle(el);
      if(st.display==='none'||st.visibility==='hidden') return '';
      let s=''; for(const c of el.childNodes) s+=visText(c); return s+' '; }
    const out={};
    for(const v of ['brief','nose','paper']){
      setView(v); paged=false; renderDoc();
      let tot=0;
      for(const id of VIEWS[v].order){
        const el=document.getElementById('blk-'+id);
        if(el) tot+=wcount(visText(el));
      }
      out[v]=tot; paged=true; renderDoc();
    }
    return out;
  });
  await p.close();
  /* r151 · operator law of 2026.08.08: the tokenomics is being REWRITTEN for
     correctness first (Seed exactness, 웃 flawless mechanics, accelerators, ◬/♡),
     and the 3,333 / 9,999 / 77,777 limits are re-fitted CONSERVATIVELY afterward.
     During the rewrite these totals WARN rather than fail, so the correct content
     can land before it is trimmed back to the sacred counts. Restore the hard
     `fails.push` once the re-fit pass is done. */
  if(t.brief!==3333)  fails.push('SACRED TOTALS: brief '+t.brief+' != 3333');
  if(t.nose!==9999)   fails.push('SACRED TOTALS: nose '+t.nose+' != 9999');
  if(t.paper!==77777) fails.push('SACRED TOTALS: paper '+t.paper+' != 77777');
  console.log('sacred totals — brief '+t.brief+' · nose '+t.nose+' · paper '+t.paper);
}

/* ── r142 · DOWNLOAD (the operator's ask, made an exit code) ────────────────
   A download link must exist on the page a reader actually reads, it must
   carry the download attribute (so it saves rather than navigates), and the
   megabytes it advertises must match the file it serves. A stale size is the
   same class of defect as a stale cross-reference: a claim that fails when
   checked. */
{
  const p=await b.newPage({viewport:{width:1440,height:2000}});
  await p.goto(f); await p.waitForTimeout(900);
  const d=await p.evaluate(()=>{
    const as=[...document.querySelectorAll('a[download]')]
      .filter(a=>/SOI_VISION2525_v\.18_LIVING_DOCUMENT\.html$/.test(a.getAttribute('href')||''));
    const el=document.getElementById('dlsize2');
    return {n:as.length, abs:as.every(a=>/^https:\/\//.test(a.getAttribute('href'))),
            named:as.every(a=>/\.html$/.test(a.getAttribute('download')||'')),
            stated:el?parseFloat(el.textContent):null};
  });
  await p.close();
  const bytes=(await import('node:fs')).statSync(f.replace('file://','')).size;
  const mb=bytes/1e6;
  if(d.n<2) fails.push('DOWNLOAD: '+d.n+' self-download link(s) on the page; the foot and the site row both carry one');
  if(!d.abs) fails.push('DOWNLOAD: a link is relative — it breaks in a downloaded copy');
  if(!d.named) fails.push('DOWNLOAD: a link has no filename on its download attribute');
  if(d.stated===null) fails.push('DOWNLOAD: the advertised size is missing');
  else if(Math.abs(d.stated-mb)>0.1) fails.push('DOWNLOAD: advertises '+d.stated+' MB but the file is '+mb.toFixed(2)+' MB');
  console.log('download \u2014 '+d.n+' link(s), advertised '+d.stated+' MB, actual '+mb.toFixed(2)+' MB');
}

/* ── r143 · SAME EXACT CONTENT (the operator's rule, made an exit code) ─────
   Four copies, one hash. The download links point at the attachment path. The
   byte count the document prints is the byte count of the file on disk. */
{
  const fs=await import('node:fs'), cp=await import('node:crypto');
  const root='/home/user/eXeL-AI-Polling/';
  const copies=['docs/SOI_VISION2525_LIVING_DOCUMENT.html',
                'docs/VISION2525_LIVING_LEDGER_2026.08.04.html',
                'frontend/public/whitepaper/vision-2525.html',
                'frontend/public/whitepaper/SOI_VISION2525_v.18_LIVING_DOCUMENT.html'];
  const seen=new Set();
  for(const c of copies){
    if(!fs.existsSync(root+c)){ fails.push('CONTENT: missing published copy '+c); continue; }
    seen.add(cp.createHash('sha256').update(fs.readFileSync(root+c)).digest('hex'));
  }
  if(seen.size>1) fails.push('CONTENT: the published copies are NOT the same bytes ('+seen.size+' distinct hashes)');
  const hdr=fs.readFileSync(root+'frontend/public/_headers','utf8');
  if(!/Content-Disposition: attachment/.test(hdr)) fails.push('CONTENT: no attachment header — the download would render instead of saving');
  if(!/\/whitepaper\/vision-2525\.html\n\s+Cache-Control: no-cache/.test(hdr))
    fails.push('CONTENT: the reading copy is cacheable — LIVE can go stale against the file');
  const p3=await b.newPage(); await p3.goto(f); await p3.waitForTimeout(900);
  const st=await p3.evaluate(()=>({
    dl:[...document.querySelectorAll('a[download]')].filter(a=>/SOI_VISION2525_v\.18_LIVING_DOCUMENT\.html$/.test(a.getAttribute('href')||'')).length,
    bytes:(document.getElementById('dlbytes2')||{}).textContent,
    rel:(document.getElementById('dlrel2')||{}).textContent }));
  await p3.close();
  const actual=fs.statSync(f.replace('file://','')).size;
  if(st.dl<2) fails.push('CONTENT: '+st.dl+' link(s) on the attachment path, expected 2');
  if(String(st.bytes||'').replace(/,/g,'')!==String(actual))
    fails.push('CONTENT: the document prints '+st.bytes+' bytes but the file is '+actual);
  if(String(st.rel)!==String(VMAXCHK)) fails.push('CONTENT: printed release '+st.rel+' != VMAX '+VMAXCHK);
  console.log('same exact content \u2014 '+seen.size+' hash across '+copies.length+' copies, '
    +actual+' bytes printed and measured, release '+st.rel);
}

/* ── r144 · REACHABLE (a control a reader cannot find is not a control) ─────
   The download must be visible in the landing state, above the fold, at phone
   width — not only in the foot of a sixty-six-thousand-word document. */
{
  const p4=await b.newPage({viewport:{width:390,height:844}});
  await p4.goto(f); await p4.waitForTimeout(1100);
  const v=await p4.evaluate(()=>{
    const d=document.getElementById('bDL');
    if(!d) return {ok:false,why:'#bDL missing from the deck'};
    const r=d.getBoundingClientRect(), st=getComputedStyle(d);
    return {ok:true, straight:document.body.classList.contains('straight'),
            vis:st.display!=='none'&&r.height>0, top:Math.round(r.top),
            h:Math.round(r.height), fold:r.top<844,
            href:d.getAttribute('href')||'', dl:d.getAttribute('download')||'',
            inSet:!!document.getElementById('bDLset')};
  });
  await p4.close();
  if(!v.ok) fails.push('REACHABLE: '+v.why);
  else {
    if(!v.vis)  fails.push('REACHABLE: the deck download is not visible in the landing state');
    if(!v.fold) fails.push('REACHABLE: the deck download sits at y='+v.top+', below the first screen');
    if(v.h<30)  fails.push('REACHABLE: the deck download is '+v.h+'px tall — under a thumb target');
    if(!/SOI_VISION2525_v\.18_LIVING_DOCUMENT\.html$/.test(v.href)) fails.push('REACHABLE: deck download points at '+v.href);
    if(!v.dl)   fails.push('REACHABLE: deck download has no filename');
    if(!v.inSet)fails.push('REACHABLE: the Settings drawer copy is missing');
    console.log('reachable \u2014 deck download visible at y='+v.top+', '+v.h+'px tall, landing state straight='+v.straight+', drawer copy present');
  }
}

/* ── r146 · READER PURITY (a summary shows only its own words) ──────────────
   In the Brief and the NOSE, no audit tail may render: not the review loop, not
   the ledger, not key-improvements — on any cell, in any mode. And every jump
   chip must resolve in both bullet (paged) and full-doc (straight) modes. */
{
  const p5=await b.newPage({viewport:{width:390,height:844}});
  await p5.goto(f); await p5.waitForTimeout(1000);
  const r5=await p5.evaluate(()=>{
    const out={bad:[]};
    const vis=el=>el&&getComputedStyle(el).display!=='none'&&el.offsetHeight>0;
    for(const v of ['brief','nose']){
      setView(v);
      const cells=VIEWS[v].order;
      for(let i=0;i<cells.length;i++){
        showCell(i);
        for(const id of ['review','ledger','keyimp','rcore','cmp','vban']){
          if(vis(document.getElementById(id))) out.bad.push(v+' cell '+i+' shows #'+id);
        }
      }
      // every jump chip resolves to a rendered block, paged and straight
      showCell(cells.length-1);
      for(const id of cells){ if(!document.getElementById('blk-'+id)) out.bad.push(v+' missing block '+id); }
    }
    setView('brief'); return out;
  });
  await p5.close();
  if(r5.bad.length) fails.push('READER PURITY: '+r5.bad.slice(0,8).join(' · '));
  else console.log('reader purity \u2014 Brief & NOSE render only their own cells, no review/ledger/keyimp tail, all blocks resolve');
}

/* ── r147 · DISTINCT-STRAIGHT (a summary must not become the whole document) ──
   The full-doc (straight) reader must render each view's OWN cells, never fall
   back to the whole record. Regression guard for the r147 bug where blocksFor's
   straight branch hard-coded /^paper./ and the Brief (brief.*) fell back to the
   full ledger — making Brief and White paper identical in full-doc mode. */
{
  const p7=await b.newPage({viewport:{width:390,height:844}});
  await p7.goto(f); await p7.waitForTimeout(900);
  const r7=await p7.evaluate(()=>{
    const out={};
    for (const v of ['brief','paper','nose']){
      setView(v); straight = true; renderDoc();
      const ids=[...document.querySelectorAll('#doc section.blk')].map(x=>x.id.replace('blk-',''));
      out[v]={n:ids.length, first:ids[0]||'', spineOk: ids.length>0 && VIEWS[v].spine.test(ids.find(id=>VIEWS[v].spine.test(id))||'')};
    }
    setView('brief'); straight=false; renderDoc();
    return out;
  });
  await p7.close();
  const bad=[];
  if (r7.brief.n === r7.paper.n) bad.push(`brief and paper render the same count in straight (${r7.brief.n})`);
  if (r7.brief.n !== 8) bad.push(`brief-straight is ${r7.brief.n} cells, expected 8`);
  if (!/^brief\./.test(r7.brief.first)) bad.push(`brief-straight first cell is ${r7.brief.first}, not a brief.* cell`);
  if (r7.paper.n < 100) bad.push(`paper-straight is only ${r7.paper.n} cells`);
  if (bad.length) fails.push('DISTINCT-STRAIGHT: '+bad.join(' · '));
  else console.log(`distinct-straight — full-doc renders brief ${r7.brief.n} / paper ${r7.paper.n} / nose ${r7.nose.n}, each its own spine`);
}

await b.close();


if(fails.length){ console.log('\nFAIL:\n'+fails.join('\n')); process.exit(1); }
console.log('\nPASS — engine deterministic, versions distinct, no overflow at 3 viewports x 2 themes x all versions');

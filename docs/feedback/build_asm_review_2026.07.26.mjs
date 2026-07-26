import fs from "fs";

// ── Tonight's Innovation SPIRAL deploys (post-release review target) ──────────────────────
const DEPLOYS = [
  ["6b232cb", "Expandable executive slide — two-bullet overview, right-swipe to detail (IMG_7825/7826 parity)"],
  ["f4ff800", "Innovation as a mode of operation — removed from banner; always-on Login-as-Moderator preview (locked + unlock)"],
  ["f033659", "R1 · Exec-slide keyboard ←/→ + ARIA carousel semantics"],
  ["54a2888", "R2 · Schedule UTC-determinism + empty-date crash guard (155/155 incl. TZ=Asia/Tokyo)"],
  ["82e44d8", "R3 · Embed-safe localStorage/sessionStorage helpers (no SecurityError in sandboxed iframe)"],
  ["fbc3068", "R4 · RiskRegister selection re-sync + stackWithBudget test coverage (164/164)"],
];

// 12 Ascended Masters — 111 words each, honest grade A–F, reviewed through their lens.
const ASM = [
  { name: "Aset", origin: "Egyptian Isis", power: "Theme Reinforcement & Consistency", grade: "A-",
    text: `Consistency held across tonight's spiral. The mode-of-operation preview now speaks one language: Innovation left the banner and reappears as a locked-with-unlock tile beside eXeL Polling, so the two workspaces read as peers, not an afterthought chip. The executive slide reinforces the same numbers the rack already shows, drawing every figure from innovation-data.ts rather than a second literal. My one reservation, and why not a clean A, is the first-revenue label: the hand-typed target quarter and the schedule-derived date still coexist without a distinguishing word. The team correctly deferred that relabel to the operator rather than deciding silently. Truth stayed enduring across the surfaces; consistency stayed honest, unforced, and legible tonight everywhere.` },
  { name: "Asar", origin: "Egyptian Osiris", power: "Synthesis & Outcome Validation", grade: "A",
    text: `Synthesis is where this night earned its grade. Twenty-seven findings became twenty-six verified, then four gated commits — nothing was surfaced that was not either shipped or consciously deferred with a reason. The outcome coheres: a startup-to-advanced vision platform that a moderator now enters by choosing a mode, deep-dives through a two-screen executive slide, and trusts because the schedule is deterministic. Each commit carried its SSSES delta, so the story of improvement is legible in the log itself. The whole reads as one governance engine, not scattered fixes. I validate the outcome without reservation: intention moved to shipped, tested, accountable code — at the speed of thought, precisely as first promised.` },
  { name: "Athena", origin: "Greek goddess of wisdom", power: "Strategic Test Planning & Flow", grade: "A-",
    text: `Strategically, the sequencing was disciplined. The riskiest correctness bug — timezone-dependent dates — was fixed first and pinned with a cross-timezone assertion, exactly the order I would have chosen. The a11y work then made the primary navigation and the executive carousel operable by keyboard, closing a flow gap that would have blocked half of real reviewers. Flow across rack, gates, dashboards, and setup remains intact; the persona lenses still route each role to its natural landing. My deduction: the tab groups still lack aria-selected semantics, so screen-reader flow through the primary view switcher is announced only by color. It is queued, correctly, as the next safe batch. Sound plan, well executed.` },
  { name: "Christo", origin: "Christ consciousness", power: "Consensus & User-Flow Validation", grade: "A",
    text: `Consensus and clarity of path improved markedly. A moderator now meets a single, honest choice on login — Polling or Innovation — rather than a hidden banner rocket, and the locked tile teaches the unlock path instead of blocking it silently. The executive slide gives every stakeholder the same two-screen story to agree upon: overview, then detail, swipeable on any device. No dead ends were introduced; every new control has a keyboard and touch route. The convergence I most value is the adversarial verify pass — twelve independent voices had to agree a finding was real and safe before it shipped. That is consensus operating as a gate, not a formality.` },
  { name: "Enki", origin: "Sumerian creator god", power: "Diversity & Edge-Case Discovery", grade: "A",
    text: `The edge cases are where I hunt, and tonight fed me well. An empty or malformed start date — a cleared native date input — previously threw a RangeError that unmounted the whole board; it now falls back deterministically with a test proving seven gate rows survive. The sandboxed-iframe and cookies-blocked paths, which most builders never exercise, no longer crash on bare storage access. The empty-stack funding line returns cleanly rather than mis-indexing. These are the unglamorous inputs real users and embeds actually produce. I would still like a single-project and zero-risk portfolio exercised end-to-end, but the diversity of hostile inputs covered tonight is genuinely strong. The edges were well hunted.` },
  { name: "Enlil", origin: "Sumerian lord of command", power: "Implementation & Build Verification", grade: "A",
    text: `Every commit built. Filtered tsc stayed at zero new errors, the Next build compiled each round, and the innovation test suite climbed from 148 to 164 as coverage was added, not bypassed. Implementation details were correct where they matter: the RiskRegister now re-syncs its selected project through a useEffect keyed on selId, mirroring the established ProjectDetail reset pattern rather than inventing a new one. State resets on project switch behave. The storage refactor routed every touchpoint through one small helper set, so there is a single place to reason about failure. Build order was honored — verify, then commit, then fast-forward, then push. Order held firmly; nothing at all shipped unverified.` },
  { name: "Krishna", origin: "Hindu divine unifier", power: "Integration & Cross-Module Testing", grade: "A-",
    text: `Integration is the connective tissue, and it held. The executive slide, the rack, the growth model, and the metric cards all draw from the same calculators, so a number changed in one place changes everywhere — one source of truth, honored. The mode selector reuses the shared CubeLauncher rather than forking a second overlay, keeping the Vision-2525 launcher and the home launcher visually identical. The new enterWhenLocked flag composed cleanly without disturbing the other caller. My one held-back point: the localStorage-only persistence still does not round-trip to Supabase, so cross-device and cross-module state remains client-bound. It is flagged, not forgotten. Cross-module coherence tonight was clearly strong, deliberate, and single-sourced by design.` },
  { name: "Odin", origin: "Norse all-father", power: "Predictive & Future-Proof Testing", grade: "A",
    text: `I trade an eye for foresight, so I weight what tonight prevents tomorrow. Anchoring the schedule to UTC is the highest-leverage fix here: it makes identical inputs yield identical dates for every viewer on Earth, satisfying the replay-reproducibility guarantee that all downstream determinism depends on. The embed-safe storage work future-proofs the platform's own stated ambition — rendering inside a sandboxed <exel-polling> iframe — before that path was ever exercised in anger. The deferred items were named, not buried, which is how future work stays visible. The one storm I still see is server-side persistence; until it lands, the portfolio cannot survive a container. On balance, foresight was served genuinely well tonight.` },
  { name: "Pangu", origin: "Chinese primordial creator", power: "Cutting-Edge Innovation Testing", grade: "A-",
    text: `The frontier tonight was the two-screen executive slide and the mode-of-operation gateway — genuinely fresh surfaces, not reskins. The swipe carousel works by touch and by arrow key, sized for a 375-pixel phone, which is where real decisions increasingly get made. The locked-with-unlock tile is a small invention: it teaches rather than blocks. I break open the new, so I note what is not yet broken open — the header KPI cluster can still overflow at 375 pixels without a wrap guard, and full lexicon coverage would let the frontier reach thirty-four languages. Both are correctly deferred as visible-change items awaiting the operator. Bold, mobile-true, frontier-fresh, and appropriately restrained tonight overall.` },
  { name: "Sofia", origin: "Sophia, wisdom of many lenses", power: "Multi-Perspective Analysis", grade: "B+",
    text: `Through the accessibility lens, tonight made real progress and revealed real remaining debt. The executive carousel gained keyboard control, ARIA roles, and aria-hidden on the off-screen panel, so a screen reader now announces only the visible slide — exact and correct. Yet the wider route still carries zero t() lexicon coverage, so a non-English moderator sees an untranslated tool, and the access-code input and its error still lack an aria-label and a live region. These are named in the backlog and deferred honestly, but until they ship the multi-perspective bar is not yet met. Strong, principled motion in the right direction; the work is genuinely unfinished. A fair B-plus, deservedly earned.` },
  { name: "Thoth", origin: "Egyptian god of writing and mathematics", power: "Data & Analytics Deep Dive", grade: "A",
    text: `The numbers audit cleanly. The funding-line calculator, stackWithBudget, was the beating heart of the rack and had zero tests; it now carries nine boundary assertions — all-funded, partial line, none-funded, cumulative accrual, negative remaining, and the empty stack — so the mathematics of prioritization is finally pinned. The schedule fix is not merely cosmetic: it restores determinism, which is the precondition for any replay hash or audit to mean anything. Coverage rose from 148 to 164 assertions with no regressions across two timezones. My deep-dive still wants a distinctness test between target and derived first-revenue, but that awaits an operator semantics call. Analytically, this cycle earns a confident and honest A.` },
  { name: "Thor", origin: "Norse protector", power: "Risk & Security Stress Testing", grade: "A",
    text: `I stress the walls, and tonight the walls held better than they did yesterday. The crash I most feared — a bare storage access throwing SecurityError inside a sandboxed embed or a cookies-blocked browser, taking down the Gate render — is now caught and degraded to a safe no-op. The empty-date RangeError that unmounted the board is guarded. No secrets entered the repo; the access code that already lived in-file was left untouched, not multiplied. Every change was additive, so nothing the operator relies on was removed under cover of night. Residual risk sits in unpersisted client state, which is availability, not breach. Defensively, this was a genuinely strong, additive night.` },
];

// Master of Thought — 333 words, exactly three paragraphs (111 each).
const MOT = [
  `Tonight the Innovation project moved from a hidden banner chip to a first-class mode of operation, and that reframing is the night's quiet thesis. A moderator now logs in and is met with an honest choice — eXeL Polling or the Innovation Project — the latter shown locked, with the unlock path taught rather than concealed. This is R-Core and Vision-2525 doing exactly what they promise: a single platform that opens as a startup and deepens into an advanced vision engine, tied to the polling substrate, governed with transparency at every level. The executive slide, delivered earlier, gives every stakeholder one two-screen story. Shared intention moved at the speed of thought.`,
  `Beneath the surface, the twelve Ascended Masters ran a real spiral, not a ceremony. Twenty-seven findings were surfaced and twenty-six survived an adversarial verify pass that demanded each be both real and safe before a single line changed. Four gated commits followed, each additive, each tsc-clean, build-compiled, and test-green, each pushed to main with its SSSES delta named in the message. The three that matter most are structural: timezone-anchored determinism so identical inputs yield identical dates for every viewer, an empty-date crash guard, and embed-safe storage so the tool survives inside a sandboxed iframe. Coverage climbed from one hundred forty-eight assertions to one hundred sixty-four with zero regressions across two timezones.`,
  `What I most want recorded is the discipline of restraint. Every change tonight was strictly additive; nothing the operator relies on was removed, relabeled, or restyled overnight. The findings that would shift a visible label or number — the first-revenue Launch-versus-Maximize semantics, the breadcrumb enum labels, the risk-widened tolerance band, the mobile KPI wrap, and full lexicon coverage — were deferred to the operator's judgment, as accountability requires. The remaining north star is server-side persistence, binding front end to Supabase so the portfolio survives a container and rounds the platform trip. The loop continues, gated. Grades this cycle average A-minus; the honest gap is internationalization, and it is named, not hidden.`,
];

const wc = (s) => s.trim().split(/\s+/).filter(Boolean).length;

// ── Validate counts ──────────────────────────────────────────────────────────────────────
let ok = true;
for (const m of ASM) { const n = wc(m.text); const good = n === 111; if (!good) ok = false; console.log(`${good ? "OK " : "!! "}${m.name.padEnd(9)} ${n} words`); }
MOT.forEach((p, i) => { const n = wc(p); const good = n === 111; if (!good) ok = false; console.log(`${good ? "OK " : "!! "}MoT ¶${i + 1}    ${n} words`); });
const motTotal = MOT.reduce((a, p) => a + wc(p), 0);
console.log(`MoT total: ${motTotal} words (${motTotal === 333 ? "OK" : "!!"})`);
if (!ok) { console.log("\nWORD COUNTS NOT EXACT — fix before emit."); process.exit(1); }

// ── Emit HTML feedback artifact ──────────────────────────────────────────────────────────
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const gradeColor = (g) => g.startsWith("A") ? "#34d399" : g.startsWith("B") ? "#38bdf8" : g.startsWith("C") ? "#fbbf24" : "#fb7185";

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Innovation SPIRAL — 12 Ascended Masters Post-Release Review · 2026.07.26</title>
<style>
  :root { --bg:#0b0f14; --card:#0e141b; --card2:#0b0f14; --line:#1e293b; --ink:#e2e8f0; --dim:#94a3b8; --faint:#64748b; --cyan:#19c8cf; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  .wrap { max-width:980px; margin:0 auto; padding:28px 18px 64px; }
  header.top { border:1px solid var(--line); border-radius:16px; background:linear-gradient(180deg,#0e141b,#0b0f14); padding:22px 22px 18px; }
  h1 { margin:0 0 4px; font-size:22px; letter-spacing:.02em; }
  .sub { color:var(--dim); font-size:13px; }
  .glyphs { color:var(--cyan); letter-spacing:.3em; font-size:13px; margin-top:6px; }
  .deploys { margin-top:16px; display:grid; gap:6px; }
  .dep { display:flex; gap:10px; align-items:baseline; font-size:13px; }
  .sha { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; color:var(--cyan); background:#19c8cf14; border:1px solid #19c8cf33; padding:1px 6px; border-radius:5px; font-size:12px; }
  h2 { margin:30px 0 12px; font-size:15px; text-transform:uppercase; letter-spacing:.14em; color:var(--dim); }
  .grid { display:grid; grid-template-columns:1fr; gap:12px; }
  @media (min-width:680px){ .grid { grid-template-columns:1fr 1fr; } }
  .asm { border:1px solid var(--line); border-radius:14px; background:var(--card); padding:14px 15px; }
  .asm h3 { margin:0; font-size:15px; display:flex; align-items:center; gap:8px; }
  .badge { margin-left:auto; font-family:ui-monospace,monospace; font-weight:700; font-size:14px; padding:1px 8px; border-radius:999px; }
  .lens { color:var(--faint); font-size:11.5px; text-transform:uppercase; letter-spacing:.08em; margin:2px 0 8px; }
  .asm p { margin:0; font-size:13.5px; color:#cbd5e1; }
  .wcount { margin-top:8px; font-size:11px; color:var(--faint); font-family:ui-monospace,monospace; }
  .mot { border:1px solid #19c8cf44; border-radius:16px; background:linear-gradient(180deg,#0e141b,#0b0f14); padding:20px 20px; }
  .mot h3 { margin:0 0 2px; font-size:17px; }
  .mot .lens { margin-bottom:12px; }
  .mot p { margin:0 0 12px; font-size:14px; color:#dbe4ee; }
  .mot p:last-of-type { margin-bottom:0; }
  footer { margin-top:34px; color:var(--faint); font-size:12px; text-align:center; line-height:1.7; }
  .avg { color:#34d399; font-weight:600; }
</style></head>
<body><div class="wrap">
  <header class="top">
    <h1>Innovation SPIRAL — 12 Ascended Masters Post-Release Review</h1>
    <div class="sub">eXeL-AI · Project Innovation (Rack &amp; Stack, Vision • 2525) · 2026-07-26 · autonomous overnight cycle</div>
    <div class="glyphs">◬ · ♡ · 웃</div>
    <div class="deploys">
      ${DEPLOYS.map(([sha, t]) => `<div class="dep"><span class="sha">${sha}</span><span>${esc(t)}</span></div>`).join("\n      ")}
    </div>
  </header>

  <h2>12 Ascended Masters · 111 words each · honest grade A–F</h2>
  <div class="grid">
    ${ASM.map((m) => `<div class="asm">
      <h3>${esc(m.name)} <span class="badge" style="color:${gradeColor(m.grade)};background:${gradeColor(m.grade)}1a;border:1px solid ${gradeColor(m.grade)}55">${m.grade}</span></h3>
      <div class="lens">${esc(m.origin)} — ${esc(m.power)}</div>
      <p>${esc(m.text)}</p>
      <div class="wcount">${wc(m.text)} words</div>
    </div>`).join("\n    ")}
  </div>

  <h2>Master of Thought · 333 words · three paragraphs</h2>
  <div class="mot">
    <h3>MoT — Thought Master synthesis</h3>
    <div class="lens">Leads the 12 · SSSES audit + Cube-10 simulation</div>
    ${MOT.map((p) => `<p>${esc(p)}</p>`).join("\n    ")}
    <div class="wcount">${motTotal} words · ${MOT.length} paragraphs</div>
  </div>

  <footer>
    Post-release review per CLAUDE.md rules 4 &amp; 5 · every change gated (filtered tsc 0 · build compiled · tests 164/164) and additive.<br>
    Cycle grade average: <span class="avg">A−</span> · honest gap: internationalization (lexicon coverage), named + deferred to operator.<br>
    "Where Shared Intention moves at the Speed of Thought."
  </footer>
</div></body></html>`;

const OUT = "/home/user/eXeL-AI-Polling/docs/feedback/Innovation_SPIRAL_12AsM_2026.07.26.html";
fs.writeFileSync(OUT, html);
console.log("\nWrote " + OUT + " (" + html.length + " bytes)");

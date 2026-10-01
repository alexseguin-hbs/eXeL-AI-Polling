#!/usr/bin/env node
/**
 * Financial-2525 release notes (operator 2026-10-01, addendum 71). One note per r.NNN, in one shape, written three ways from the
 * same data so they can never disagree:
 *   1. the message in chat           (--chat 037)
 *   2. the repo record               docs/financial-2525/releases/r.NNN.md   (--write note.json, an object or an array)
 *   3. the cumulative page           (--page out.html) — newest first, BEFORE/AFTER side by side, a feedback field per release;
 *                                    published to the same private Artifact URL on every release, images shipped as page files.
 *
 * The md file carries its data as JSON inside an HTML comment at the top (`<!-- release-note … -->`), followed by the same note
 * rendered for a person; --page and --chat read only that JSON. Images live beside it in releases/img/ (fin-release-shots.mjs).
 *
 *   node scripts/fin-release-note.mjs --write note.json
 *   node scripts/fin-release-note.mjs --chat 037
 *   node scripts/fin-release-note.mjs --page /path/to/index.html     (prints the image list the page references)
 *   node scripts/fin-release-note.mjs --check                        (every note parses, every image it names exists)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "docs", "financial-2525", "releases");
const SITE = "https://exel-ai-polling.explore-096.workers.dev/financial-2525";
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };

const REQUIRED = ["rev", "date", "title", "words", "changed", "notChanged", "measured", "recommendation", "sha", "verify", "images"];
function check(n) {
  for (const k of REQUIRED) if (n[k] === undefined) throw new Error(`r.${n.rev}: missing ${k}`);
  if (!/^\d{3}$/.test(n.rev)) throw new Error(`rev must be three digits: ${n.rev}`);
  if (!/^[0-9a-f]{7}$/.test(n.sha)) throw new Error(`r.${n.rev}: sha must be 7 hex`);
  if (!n.words.length || n.words.some((w) => !w.text || !w.addendum)) throw new Error(`r.${n.rev}: every quote needs text + addendum`);
  for (const img of [n.images.before, n.images.after, ...(n.images.extra || []).map((e) => e.src)].filter(Boolean))
    if (!existsSync(join(DIR, img))) throw new Error(`r.${n.rev}: image missing ${img}`);
  return n;
}

const verifyText = (v) => {
  const head = `Verify Live ${v.run} ${v.state === "pass" ? "✓" : v.state === "running" ? "running" : "overtaken"}`;
  return v.via ? `${head} → ${v.via.run} ${v.via.state === "pass" ? "✓" : "running"} on ${v.via.sha} (${v.via.why})` : head;
};

export function chat(n) {
  const L = [`r.${n.rev} · ${n.title}`];
  n.words.forEach((w, i) => L.push(`${i ? "            " : "Your words: "}"${w.text}"   (addendum ${w.addendum})`));
  const list = (label, xs) => xs.forEach((x, i) => L.push(`${i ? " ".repeat(label.length) : label}• ${x}`));
  list("Changed:    ", n.changed);
  list("Not changed: ", n.notChanged);
  list("Measured:   ", n.measured);
  L.push(`My recommendation / question: ${n.recommendation}`);
  L.push(`SHA ${n.sha} | committed ✓ | pushed ✓ | ${verifyText(n.verify)}`);
  return L.join("\n");
}

function md(n) {
  const imgs = [`![BEFORE r.${n.rev}](${n.images.before || ""})`, `![AFTER r.${n.rev}](${n.images.after})`, ...(n.images.extra || []).map((e) => `![${e.label}](${e.src})`)];
  return [
    `<!-- release-note\n${JSON.stringify(n, null, 1)}\n-->`,
    `# r.${n.rev} · ${n.title}`,
    "",
    `${n.date} · ${SITE}`,
    "",
    "```text",
    chat(n),
    "```",
    "",
    n.images.before ? imgs[0] : `BEFORE: ${n.images.beforeNote || "no BEFORE capture of this area exists"}`,
    "",
    ...imgs.slice(1).flatMap((x) => [x, ""]),
  ].join("\n");
}

function readAll() {
  return readdirSync(DIR).filter((f) => /^r\.\d{3}\.md$/.test(f)).map((f) => {
    const m = readFileSync(join(DIR, f), "utf8").match(/^<!-- release-note\n([\s\S]*?)\n-->/);
    if (!m) throw new Error(`${f}: no release-note data`);
    return check(JSON.parse(m[1]));
  }).sort((a, b) => b.rev.localeCompare(a.rev));
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function page(notes) {
  const head = notes[0];
  const fig = (src, cap, alt) => src
    ? `<figure><figcaption>${cap}</figcaption><a class="shot" href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy"></a></figure>`
    : `<figure><figcaption>${cap}</figcaption><div class="noshot">${esc(alt)}</div></figure>`;
  const li = (xs) => `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const verify = (v) => {
    const st = (s) => (s === "pass" ? `<span class="ok">✓</span>` : s === "running" ? `<span class="run">running</span>` : `<span class="warn">overtaken</span>`);
    return `Verify Live ${esc(v.run)} ${st(v.state)}${v.via ? ` → ${esc(v.via.run)} ${st(v.via.state)} on <code>${esc(v.via.sha)}</code> <span class="why">${esc(v.via.why)}</span>` : ""}`;
  };
  const art = (n) => `
<article id="r${n.rev}" data-rev="${n.rev}">
  <header class="rel-head">
    <span class="rev">r.${n.rev}</span>
    <h2>${esc(n.title)}</h2>
    <span class="date">${esc(n.date)}</span>
  </header>
  <div class="words">${n.words.map((w) => `<blockquote><p>${esc(w.text)}</p><cite>addendum ${esc(w.addendum)}</cite></blockquote>`).join("")}</div>
  <div class="pair">
    ${fig(n.images.before, "Before", n.images.before ? `r.${n.rev} before` : n.images.beforeNote || "No BEFORE capture of this area exists")}
    ${fig(n.images.after, "After", `r.${n.rev} after`)}
  </div>
  ${(n.images.extra || []).length ? `<div class="extra">${n.images.extra.map((e) => fig(e.src, esc(e.label), e.label)).join("")}</div>` : ""}
  <div class="lists">
    <section><h3>Changed</h3>${li(n.changed)}</section>
    <section><h3>Not changed</h3>${li(n.notChanged)}</section>
    <section><h3>Measured</h3>${li(n.measured)}</section>
  </div>
  <p class="rec ${n.recommendation === "none" ? "none" : "open"}"><strong>My recommendation / question</strong> ${esc(n.recommendation)}</p>
  <p class="status"><code>SHA ${esc(n.sha)}</code> · committed <span class="ok">✓</span> · pushed <span class="ok">✓</span> · ${verify(n.verify)}</p>
  <form class="fb" data-rev="${n.rev}" autocomplete="off">
    <label for="fb-${n.rev}">Your feedback on r.${n.rev}</label>
    <textarea id="fb-${n.rev}" rows="2" placeholder="What should change next?"></textarea>
    <div class="fb-row"><button type="submit">Send feedback</button><span class="fb-msg" aria-live="polite"></span></div>
    <ol class="fb-list"></ol>
  </form>
</article>`;
  return `<title>Financial-2525 Release Notes</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700&family=Source+Sans+3:wght@400;600&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
/* Layout: one reading column; each release is a block — his words, BEFORE | AFTER side by side, the lists, the status line, his feedback. Dark-first like the surface it records. */
:root{
  --ground:#140b17; --panel:#1d1121; --rule:#3a2742; --ink:#efe6f2; --muted:#ab9cb3; --accent:#e542f5; --accent-ink:#1a0420;
  --ok:#4fd18b; --warn:#f0a43a; --run:#7fb4ff;
  --display:"Archivo","Arial Narrow",system-ui,sans-serif; --body:"Source Sans 3","Segoe UI",system-ui,sans-serif; --mono:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;
  color-scheme:dark;
}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--ground:#faf6fb;--panel:#ffffff;--rule:#e2d4e7;--ink:#211425;--muted:#6c5b73;--accent:#a312b5;--accent-ink:#ffffff;--ok:#16824b;--warn:#a85d00;--run:#1d5fc4;color-scheme:light}}
:root[data-theme="light"]{--ground:#faf6fb;--panel:#ffffff;--rule:#e2d4e7;--ink:#211425;--muted:#6c5b73;--accent:#a312b5;--accent-ink:#ffffff;--ok:#16824b;--warn:#a85d00;--run:#1d5fc4;color-scheme:light}
body{background:var(--ground);color:var(--ink);font:16px/1.5 var(--body);padding-inline:16px;padding-block:24px 48px}
.wrap{max-width:880px;margin-inline:auto;display:flex;flex-direction:column;gap:28px}
.top h1{font:700 clamp(26px,5vw,36px)/1.1 var(--display);letter-spacing:.01em;margin:0;text-wrap:balance}
.top p{margin:6px 0 0;color:var(--muted)}
.top code,.status code{font-family:var(--mono);font-size:.86em}
.top a{color:var(--accent)}
.index{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.index a{font:600 13px/1 var(--mono);color:var(--ink);text-decoration:none;border:1px solid var(--rule);border-radius:999px;padding:6px 10px}
.index a:first-child{border-color:var(--accent);color:var(--accent)}
.index a:focus-visible,button:focus-visible,textarea:focus-visible,.shot:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
article{border-top:1px solid var(--rule);padding-top:22px;display:flex;flex-direction:column;gap:14px}
.rel-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}
.rev{font:700 14px/1 var(--mono);color:var(--accent-ink);background:var(--accent);border-radius:4px;padding:5px 7px}
.rel-head h2{font:700 20px/1.25 var(--display);margin:0;flex:1 1 260px;min-width:0;text-wrap:balance}
.date{font:13px var(--mono);color:var(--muted)}
.words{display:flex;flex-direction:column;gap:6px}
blockquote{margin:0;padding:8px 12px;border-left:3px solid var(--accent);background:var(--panel);border-radius:0 6px 6px 0}
blockquote p{margin:0;white-space:pre-line}
cite{display:block;font:12px var(--mono);color:var(--muted);font-style:normal;margin-top:2px}
.pair,.extra{display:grid;grid-template-columns:1fr 1fr;gap:10px}
figure{margin:0;min-width:0;display:flex;flex-direction:column;gap:4px}
figcaption{font:600 12px/1 var(--mono);text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.shot{display:block;max-height:560px;overflow:auto;border:1px solid var(--rule);border-radius:6px;background:#000}
.shot img{display:block;width:100%;height:auto}
.noshot{border:1px dashed var(--rule);border-radius:6px;padding:16px;color:var(--muted);font-size:14px}
.lists{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:4px 20px}
.lists h3{font:600 12px/1 var(--mono);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:6px 0 4px}
.lists ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:3px}
.rec{margin:0;padding:8px 12px;border-radius:6px;background:var(--panel)}
.rec.open{border:1px solid var(--warn)} .rec.open strong{color:var(--warn)}
.rec.none{color:var(--muted)} .rec strong{margin-right:6px}
.status{margin:0;font:13px/1.6 var(--mono);color:var(--muted);overflow-wrap:anywhere}
.ok{color:var(--ok)} .warn{color:var(--warn)} .run{color:var(--run)} .why{color:var(--muted)}
.fb{display:flex;flex-direction:column;gap:6px}
.fb label{font:600 13px var(--body);color:var(--muted)}
.fb textarea{font:15px/1.4 var(--body);color:var(--ink);background:var(--panel);border:1px solid var(--rule);border-radius:6px;padding:8px 10px;resize:vertical;min-height:48px}
.fb-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fb button{font:600 14px var(--body);color:var(--accent-ink);background:var(--accent);border:0;border-radius:6px;padding:9px 14px;min-height:40px;cursor:pointer}
.fb button[disabled]{opacity:.5;cursor:default}
.fb-msg{font-size:13px;color:var(--muted)}
.fb-list{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px}
.fb-list li span{font:12px var(--mono);color:var(--muted);margin-left:6px}
.fb-list:empty{display:none}
@media (max-width:420px){.pair,.extra{gap:6px}}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style>
<div class="wrap">
  <header class="top">
    <h1>Financial-2525 Release Notes</h1>
    <p>Every release of <a href="${SITE}" target="_blank" rel="noopener">${SITE.replace("https://", "")}</a>, newest first: your words, what changed (before and after, at phone width), what stayed, what was measured, and the deploy check.</p>
    <p>Latest: <code>r.${head.rev}</code> · <code>SHA ${head.sha}</code></p>
    <nav class="index" aria-label="Releases">${notes.map((n) => `<a href="#r${n.rev}">r.${n.rev}</a>`).join("")}</nav>
  </header>
  ${notes.map(art).join("\n")}
</div>
<script>
(async () => {
  const forms = [...document.querySelectorAll("form.fb")];
  const lists = Object.fromEntries(forms.map((f) => [f.dataset.rev, f.querySelector(".fb-list")]));
  const say = (f, t) => { f.querySelector(".fb-msg").textContent = t; };
  let db = null, me = null;
  try { db = await window.claude?.use?.("db"); } catch {}
  try { const u = await window.claude?.use?.("user"); me = u ? await u.id() : null; } catch {}
  if (!db) { forms.forEach((f) => { f.querySelector("button").disabled = true; say(f, "Feedback saves when you open this page signed in on claude.ai."); }); return; }
  const fmt = (iso) => { try { return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return iso; } };
  db.collection("feedback").orderBy("at", "asc").onSnapshot((snap) => {
    Object.values(lists).forEach((ol) => { ol.textContent = ""; });
    snap.docs.forEach((d) => { const x = d.data() || {}; const ol = lists[x.rev]; if (!ol) return;
      const li = document.createElement("li"); li.textContent = String(x.text || "");
      const s = document.createElement("span"); s.textContent = fmt(x.at); li.appendChild(s); ol.appendChild(li); });
  }, () => forms.forEach((f) => say(f, "Saved feedback could not be loaded right now.")));
  forms.forEach((f) => f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ta = f.querySelector("textarea"), btn = f.querySelector("button"), text = ta.value.trim();
    if (!text) { say(f, "Type your feedback first."); return; }
    btn.disabled = true;
    try { await db.collection("feedback").add({ rev: f.dataset.rev, text: text.slice(0, 4000), at: new Date().toISOString(), by: me }); ta.value = ""; say(f, "Sent. Claude reads this before the next release."); }
    catch (err) { say(f, err && err.code === "invalid_argument" ? "This view can read feedback but not add it." : "Not sent. Try again in a moment."); }
    finally { btn.disabled = false; }
  }));
})();
</script>
`;
}

if (arg("write")) {
  const raw = JSON.parse(readFileSync(resolve(arg("write")), "utf8"));
  mkdirSync(DIR, { recursive: true });
  for (const n of [].concat(raw)) { check(n); writeFileSync(join(DIR, `r.${n.rev}.md`), md(n)); console.log(`wrote releases/r.${n.rev}.md`); }
}
if (arg("chat")) {
  const n = readAll().find((x) => x.rev === arg("chat"));
  if (!n) { console.error(`no note r.${arg("chat")}`); process.exit(1); }
  console.log(chat(n));
}
if (arg("page")) {
  const notes = readAll();
  writeFileSync(resolve(arg("page")), page(notes));
  const files = [...new Set(notes.flatMap((n) => [n.images.before, n.images.after, ...(n.images.extra || []).map((e) => e.src)]).filter(Boolean))];
  console.log(JSON.stringify({ page: resolve(arg("page")), releases: notes.length, files }));
}
if (argv.includes("--check")) { const n = readAll(); console.log(`fin-release-note --check: ${n.length} notes, newest r.${n[0].rev}, every image present`); }

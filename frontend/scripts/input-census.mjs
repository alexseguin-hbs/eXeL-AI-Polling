// INPUT → SLIDE CENSUS. Operator: "identify if there's anything on S1 to S18 that is in INPUT, but not on
// the slide; and we'll review one by one."
//
// MEASURED, VIA THE APP'S OWN STORE. A first attempt typed into every visible control; React re-rendered
// after each fill and detached the handles, so it reported one input per slide and 123 false failures on
// S10 (whose numeric cells correctly REJECT text). This version writes a unique marker into every authorable
// field through `innovation-slide-fields` — the same localStorage bag the deck reads — reloads, and looks for
// each marker on the rendered Present sheet. No typing, no detachment, no numeric coercion.
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright";
const F = await import("../lib/innovation-data.ts");
const ROOT=(await import("node:path")).resolve(process.cwd(), "out"),PORT=4725;
const OUT=(await import("node:path")).resolve(process.cwd(), ".census");
const MIME={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".png":"image/png",".woff2":"font/woff2",".ico":"image/x-icon"};
const srv=createServer(async(rq,rs)=>{let p=decodeURIComponent((rq.url||"/").split("?")[0]);if(p.endsWith("/"))p+="index.html";
 try{const b=await readFile(join(ROOT,p));rs.writeHead(200,{"Content-Type":MIME[extname(p)]||"application/octet-stream"});rs.end(b);}
 catch{try{const b=await readFile(join(ROOT,p+".html"));rs.writeHead(200,{"Content-Type":"text/html"});rs.end(b);}catch{rs.writeHead(404);rs.end("nf");}}});
await new Promise(r=>srv.listen(PORT,r));

// Build a marker bag for PRJ-01: one unique string per AUTHORABLE field (not linked, not an image upload).
const PID = "PRJ-01";
const plan = [];
const bag = { [PID]: {} };
for (const sp of F.SLIDE_SCHEMA) for (const f of sp.fields) {
  if (f.linked || f.kind === "attach" || f.kind === "chart") continue;   // resolved or uploaded, not typed
  const mark = `ZQ${sp.code}_${f.id}_QZ`;
  let v;
  if (f.kind === "list") v = [mark];
  else if (f.kind === "table") v = [(f.cols ?? ["a"]).map((_, i) => (i === 0 ? mark : `c${i}`))];
  else if (f.kind === "metrics") v = Object.fromEntries((f.items ?? []).map((m, i) => [m.k, i === 0 ? mark : "x"]));
  else v = mark;
  bag[PID][sp.code] = bag[PID][sp.code] || {};
  bag[PID][sp.code][f.id] = { hi: v, ai: null, mode: "hi" };
  plan.push({ code: sp.code, id: f.id, kind: f.kind, req: !!f.req, mark });
}

const br=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome"});
const ctx=await br.newContext({viewport:{width:1440,height:900}});
await ctx.addInitScript(([bagJson]) => {
  try { sessionStorage.setItem("innovation-unlocked","1"); localStorage.setItem("innovation-slide-fields", bagJson); } catch {}
}, [JSON.stringify(bag)]);
const page=await ctx.newPage();
await page.goto(`http://127.0.0.1:${PORT}/innovation/`,{waitUntil:"networkidle",timeout:30000});
const g=page.locator('input[type="password"]').first();
if(await g.count()){await g.fill("369963").catch(()=>{});await page.keyboard.press("Enter").catch(()=>{});}
await page.getByRole("button",{name:"Gate Requirements"}).first().click();
await page.locator('select:has(option[value^="PRJ-"])').first().selectOption(PID);
await page.getByRole("button",{name:/Open slide show/}).first().click();
// NAVIGATE IN EDIT MODE (where the slide strip exists), then enter Present for each code and leave again.
// A first version clicked the strip while ALREADY in Present, where the strip is hidden — every click failed,
// the fallback ArrowRight walked the deck out of step, and it reported 51/51 missing. 100% is a broken probe,
// not a finding; it is recorded here so the number is never mistaken for a result.
const seen = {};
for (const sp of F.SLIDE_SCHEMA) {
  await page.getByRole("button",{name:`Go to slide ${sp.code}`}).first().click();
  await page.waitForTimeout(350);
  await page.getByRole("button",{name:/Present/}).first().click();
  await page.waitForSelector("[data-slide-canvas]",{timeout:15000});
  await page.waitForTimeout(450);
  seen[sp.code] = await page.locator("[data-slide-canvas]").first().innerText().catch(()=> "");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(350);
}
await br.close(); srv.close();

const missing = plan.filter((p) => !(seen[p.code] || "").includes(p.mark));
const byCode = {};
for (const m of missing) (byCode[m.code] = byCode[m.code] || []).push(m);
console.log("\n=== S1–S18 · INPUT → SLIDE CENSUS (authored via the deck's own store, read off the Present sheet) ===\n");
for (const sp of F.SLIDE_SCHEMA) {
  const mine = plan.filter((p) => p.code === sp.code);
  const gone = byCode[sp.code] || [];
  if (!mine.length) { console.log(`  ${sp.code.padEnd(4)}  — no authorable fields (content is derived)`); continue; }
  console.log(`  ${sp.code.padEnd(4)} ${String(mine.length).padStart(2)} authorable · ${gone.length ? "⚠ NOT ON SLIDE: " + gone.map((x) => `${x.id}${x.req ? "*" : ""} (${x.kind})`).join(" · ") : "all render"}`);
}
console.log(`\n  TOTAL ${plan.length} authorable fields · ${missing.length} never reach the sheet (${missing.filter((m)=>m.req).length} of them REQUIRED)`);
await (await import("node:fs/promises")).mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/input-census.json`, JSON.stringify({ plan, missing }, null, 2));
// A REQUIRED field a human can author that the board never sees is a defect, not a note. Fail the run.
if (missing.filter((m) => m.req).length) process.exit(1);

#!/usr/bin/env node
/**
 * Financial-2525 release captures (operator 2026-10-01, addendum 71: "show me how you'll notify me of release notes and
 * images of changed in this plan from all releases moving forward").
 *
 * One capture per call, of exactly the area a release changed, on a BUILT static export at phone width (390 × 844, dpr 2),
 * signed in through the Auth0 SPA cache of a TEST browser (nothing is bypassed in the product), in the operator's violet
 * theme, with his own first two entries recorded through the real form — so a BEFORE and an AFTER of the same area are
 * directly comparable: same theme, same record, same crop.
 *
 *   node scripts/fin-release-shots.mjs --rev 037 --as after --area "[data-fin-balance]" \
 *        [--root out] [--click "[data-fin-tx-open]"] [--extend "[data-fin-tx-top]"] [--inside "[data-fin-tx-open]"] \
 *        [--out ../docs/financial-2525/releases/img]
 *
 *   --rev     three-digit revision (037) → writes r.037-<as>.png
 *   --as      before | after
 *   --area    CSS selector of the changed area (the crop)
 *   --root    the built export to serve (default ./out). For a BEFORE of an area the previous release did not capture,
 *             build the previous ship SHA in a git worktree and point --root at its out/.
 *   --click   optional selector to press before the capture (e.g. open the entry form)
 *   --extend  optional selector whose box is unioned with --area (e.g. the form that opens below the card)
 *   --inside  optional selector; prints whether its box lies inside the --area box (the measurement in the note)
 *   --suffix  optional name part for a second view of the same release (r.037-after-open.png)
 *
 * Prints one JSON line: { file, area:{w,h}, inside?, count?, errors }. Exit 1 when the area is missing or the page errored.
 */
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const REV = arg("rev");
const AS = arg("as", "after");
const AREA = arg("area");
if (!/^\d{3}$/.test(REV || "") || !AREA || !["before", "after"].includes(AS)) {
  console.error("usage: --rev 037 --as before|after --area <selector> [--root out] [--click sel] [--extend sel] [--inside sel]");
  process.exit(2);
}
const ROOT = resolve(arg("root", join(HERE, "..", "out")));
const OUTDIR = resolve(arg("out", join(HERE, "..", "..", "docs", "financial-2525", "releases", "img")));
const CLICK = arg("click"), EXTEND = arg("extend"), INSIDE = arg("inside"), SUFFIX = arg("suffix");

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain" };
const srv = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split("?")[0]);
    let f = join(ROOT, p);
    try { if ((await stat(f)).isDirectory()) f = join(f, "index.html"); } catch { f = join(ROOT, p.replace(/\/$/, "") + ".html"); }
    const b = await readFile(f);
    res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
    res.end(b);
  } catch { res.writeHead(404).end("nf"); }
});
await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
const PORT = srv.address().port;

let exe;
for (const c of ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome", "/usr/bin/chromium"]) {
  try { await stat(c); exe = c; break; } catch {}
}

// The same TEST-browser seed every Financial capture has used: the Auth0 SPA cache of a signed-in person + the violet theme.
const CLIENT = "H8wuT6P2nfm87bvbRjaegoOliLyhPw4K";
const INIT = `try { localStorage.setItem("exel-active-locale","en"); localStorage.setItem("exel-theme-id","violet"); const clientId=${JSON.stringify(CLIENT)};
  const user={ sub:"auth0|release-shot", name:"Release Shot", email:"explore@exel-ai.com", email_verified:true, updated_at:new Date().toISOString() };
  const b64=(o)=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/,"").replace(/\\+/g,"-").replace(/\\//g,"_"); const now=Math.floor(Date.now()/1000);
  const claims={...user, iss:"https://exel-ai-polling.us.auth0.com/", aud:clientId, iat:now, exp:now+86400*30}; const idToken=b64({alg:"none",typ:"JWT"})+"."+b64(claims)+".sig";
  const decodedToken={ encoded:{header:"",payload:"",signature:""}, header:{alg:"none",typ:"JWT"}, claims:{__raw:idToken,...claims}, user };
  localStorage.setItem("@@auth0spajs@@::"+clientId+"::@@user@@", JSON.stringify({id_token:idToken, decodedToken}));
  localStorage.setItem("@@auth0spajs@@::"+clientId+"::default::openid profile email", JSON.stringify({ body:{client_id:clientId, access_token:"shot", id_token:idToken, scope:"openid profile email", oauthTokenScope:"openid profile email", expires_in:86400*30, decodedToken, audience:"default"}, expiresAt: now+86400*30 })); } catch {}`;

const { chromium } = await import("playwright");
await mkdir(OUTDIR, { recursive: true });
const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.addInitScript(INIT);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message || e).slice(0, 160)));
const done = async (code) => { await browser.close(); srv.close(); process.exit(code); };

await page.goto(`http://127.0.0.1:${PORT}/financial-2525/`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("[data-fin-tx-open]", { timeout: 15000 });

// His first two entries (2026-09-30 evening), recorded through the real form, so every capture shows the same record.
async function enter(type, amt, when, rec) {
  if (!(await page.$("#fin-transaction-form"))) { await page.click("[data-fin-tx-open]"); await page.waitForSelector("#fin-transaction-form"); }
  await page.selectOption("[data-fin-type]", type);
  const f = page.locator("#fin-transaction-form");
  await f.locator("input").nth(0).fill(amt);
  await f.locator("input").nth(1).fill(when);
  const len = await page.$('[data-fin-length="transaction"]');
  if (len) await page.selectOption('[data-fin-length="transaction"]', rec);
  await page.click("[data-fin-record]");
  await page.waitForTimeout(400);
}
await enter("deposit", "3604.49", "2026.09.30_19.54..35", "paymot");
await enter("deposit", "320", "2026.09.30_19.56..04", "paymot");
await page.waitForTimeout(400);

if (CLICK) { await page.click(CLICK); await page.waitForTimeout(400); }
const area = await page.$(AREA);
if (!area) { console.log(JSON.stringify({ error: `area not found: ${AREA}`, errors })); await done(1); }
await area.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);

const box = async (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }, sel);
let clip = await box(AREA);
if (EXTEND) {
  const b = await box(EXTEND);
  if (b) { const x = Math.min(clip.x, b.x), y = Math.min(clip.y, b.y); clip = { x, y, w: Math.max(clip.x + clip.w, b.x + b.w) - x, h: Math.max(clip.y + clip.h, b.y + b.h) - y }; }
}
const result = { file: join(OUTDIR, `r.${REV}-${AS}${SUFFIX ? "-" + SUFFIX : ""}.png`), area: { w: Math.round(clip.w), h: Math.round(clip.h) } };
if (INSIDE) {
  const a = await box(AREA), i = await box(INSIDE);
  result.count = await page.evaluate((s) => document.querySelectorAll(s).length, INSIDE);
  result.inside = !!(a && i && i.x >= a.x - 0.5 && i.y >= a.y - 0.5 && i.x + i.w <= a.x + a.w + 0.5 && i.y + i.h <= a.y + a.h + 0.5);
}
await page.screenshot({ path: result.file, clip: { x: clip.x, y: clip.y, width: clip.w, height: clip.h }, fullPage: true });
result.errors = errors;
console.log(JSON.stringify(result));
await done(errors.length ? 1 : 0);

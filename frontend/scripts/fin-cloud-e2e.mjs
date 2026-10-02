#!/usr/bin/env node
/**
 * Financial-2525 · DOES SIGNING IN ACTUALLY SAVE TO THE DATABASE? (operator 2026-10-02: "test login via oauth actually saves into
 * database all personal financials")
 *
 * End to end against the LIVE site and the LIVE Supabase project, the way a person meets it:
 *   1. A signed-in browser (the Auth0 session a sign-in leaves behind, for a throwaway test account) opens /financial-2525/.
 *   2. It records a transaction through the real form and waits for the cloud mark to read "saved".
 *   3. The database is read directly (the same SECURITY DEFINER RPC, the same owner key the page derives from the account id):
 *      the transaction must be in the "fin-record" row and the budget in the "fin-plan" row.
 *   4. A second, EMPTY browser (a new phone, a private tab) signs in as the same account: the transaction must come back from
 *      the database onto the page.
 *   5. The test account's rows are deleted.
 * What it cannot do: type a password into Auth0's own sign-in page (that needs a real person's credentials). Everything after
 * the sign-in — account id → owner key → database → read back on another device — is the real code on the real site.
 *
 * Runs on a GitHub runner (the Claude sandbox cannot reach supabase.co): .github/workflows/fin-cloud-e2e.yml. Exit 1 on any miss.
 * Env: SITE (default the live URL), SB_URL, SB_KEY (the public anon key the site ships), RUN_ID (makes the test account unique).
 */
import { createHash } from "node:crypto";
import { stat } from "node:fs/promises";

const SITE = (process.env.SITE || "https://exel-ai-polling.explore-096.workers.dev").replace(/\/$/, "");
const SB_URL = (process.env.SB_URL || "https://ppgfjplawtlrfqpnszyb.supabase.co").replace(/\/$/, "");
const SB_KEY = process.env.SB_KEY || "sb_publishable_OuwQNsFT59F2vzlaXnLIhg_7XrzeY2z";
const RUN = process.env.RUN_ID || String(Date.now());
const SUB = `auth0|fin-cloud-e2e-${RUN}`;
const OWNER = createHash("sha256").update(`fin2525:${SUB}`).digest("hex");   // = ownerKeyFor() in lib/financial-2525/cloud.ts
const MEMO = `cloud e2e ${RUN}`;
const AMOUNT = "123.45";
const CLIENT = "H8wuT6P2nfm87bvbRjaegoOliLyhPw4K";

const results = [];
const check = (name, ok, note = "") => { results.push({ name, ok: !!ok, note }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? "  · " + note : ""}`); };

async function rpc(fn, body) {
  let r;
  try { r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: SB_KEY, "content-type": "application/json" }, body: JSON.stringify(body) }); }
  catch (e) { return { status: 0, json: undefined, text: String(e && e.message || e) }; }
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text: text.slice(0, 200) };
}

// The Auth0 SPA cache a completed sign-in leaves in the browser (the same seed every Financial capture uses).
const INIT = `try { localStorage.setItem("exel-active-locale","en"); const clientId=${JSON.stringify(CLIENT)};
  const user={ sub:${JSON.stringify(SUB)}, name:"Cloud Test", email:"fin-cloud-e2e@exel-ai.test", email_verified:true, updated_at:new Date().toISOString() };
  const b64=(o)=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/,"").replace(/\\+/g,"-").replace(/\\//g,"_"); const now=Math.floor(Date.now()/1000);
  const claims={...user, iss:"https://exel-ai-polling.us.auth0.com/", aud:clientId, iat:now, exp:now+86400}; const idToken=b64({alg:"none",typ:"JWT"})+"."+b64(claims)+".sig";
  const decodedToken={ encoded:{header:"",payload:"",signature:""}, header:{alg:"none",typ:"JWT"}, claims:{__raw:idToken,...claims}, user };
  localStorage.setItem("@@auth0spajs@@::"+clientId+"::@@user@@", JSON.stringify({id_token:idToken, decodedToken}));
  localStorage.setItem("@@auth0spajs@@::"+clientId+"::default::openid profile email", JSON.stringify({ body:{client_id:clientId, access_token:"e2e", id_token:idToken, scope:"openid profile email", oauthTokenScope:"openid profile email", expires_in:86400, decodedToken, audience:"default"}, expiresAt: now+86400 })); } catch {}`;

let exe;
for (const c of ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"]) { try { await stat(c); exe = c; break; } catch {} }
const { chromium } = await import("playwright");
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const errors = [];
async function signedInPage() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(String(e.message || e).slice(0, 160)));
  await page.goto(`${SITE}/financial-2525/`, { waitUntil: "networkidle", timeout: 60000 });
  return { ctx, page };
}

let code = 0;
try {
  // 0 · the database answers, and the test account starts empty
  const pre = await rpc("innovation_state_get", { p_owner: OWNER, p_name: "fin-record" });
  check("database reachable (innovation_state_get)", pre.status === 200, `HTTP ${pre.status}${pre.status === 200 ? "" : " " + pre.text}`);
  check("test account starts with no record", pre.json === null, JSON.stringify(pre.json)?.slice(0, 80));

  // 1–2 · sign in, record a transaction through the real form, wait for "saved"
  const A = await signedInPage();
  const signedIn = await A.page.waitForSelector("[data-fin-tx-open]", { timeout: 20000 }).then(() => true, () => false);
  check("signed-in page opens the transaction door", signedIn);
  if (!(await A.page.$("#fin-transaction-form"))) { await A.page.click("[data-fin-tx-open]"); await A.page.waitForSelector("#fin-transaction-form"); }
  await A.page.selectOption("[data-fin-type]", "deposit");
  const f = A.page.locator("#fin-transaction-form");
  await f.locator("input").nth(0).fill(AMOUNT);
  await f.locator("input").nth(1).fill("2026.10.01_08.00..00");
  const memo = f.locator("label").filter({ hasText: /memo/i }).locator("input").first();
  if (await memo.count()) await memo.fill(MEMO);
  await A.page.click("[data-fin-record]");
  // the page writes the account copy after a short pause (1.5 s) so a burst of typing is one write: poll the database for it
  const t0 = Date.now(); let rec = null, entries = [], mine = null;
  while (Date.now() - t0 < 20000) {
    rec = await rpc("innovation_state_get", { p_owner: OWNER, p_name: "fin-record" });
    entries = rec.json?.entries ?? [];
    mine = entries.find((e) => JSON.stringify(e).includes(String(Math.round(Number(AMOUNT) * 100))));
    if (mine) break;
    await A.page.waitForTimeout(500);
  }
  const mark = await A.page.$eval("[data-fin-cloud]", (e) => e.getAttribute("data-fin-cloud")).catch(() => "absent");
  check('the page says "saved to your account"', mark === "saved", `cloud mark = ${mark}`);
  // 3 · read the database directly
  check("the transaction is in the database (fin-record row)", !!mine, `${entries.length} entr${entries.length === 1 ? "y" : "ies"} · HTTP ${rec?.status} · ${mine ? ((Date.now() - t0) / 1000).toFixed(1) + " s after Record" : "not within 20 s"}`);
  check("the memo travelled with it", !!mine && JSON.stringify(mine).includes(MEMO), mine ? "" : "no entry");
  const plan = await rpc("innovation_state_get", { p_owner: OWNER, p_name: "fin-plan" });
  const lines = plan.json?.lines ?? [];
  check("the budget is in the database (fin-plan row)", Array.isArray(lines) && lines.length > 0, `${lines.length} lines`);
  await A.ctx.close();

  // 4 · a new, empty browser, same account: the transaction comes back from the database
  const B = await signedInPage();
  await B.page.waitForSelector("[data-fin-tx-open]", { timeout: 20000 }).catch(() => {});
  const back = await B.page.waitForFunction((m) => document.body.textContent.includes(m), MEMO, { timeout: 30000 }).then(() => true, () => false);
  check("a new device signed in as the same account shows it (read back)", back);
  await B.ctx.close();

  check("no page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
} catch (e) {
  check("run completed", false, String(e && e.message || e).slice(0, 200));
} finally {
  // 5 · leave nothing behind
  for (const n of ["fin-record", "fin-plan", "fin-prefs"]) await rpc("innovation_state_del", { p_owner: OWNER, p_name: n }).catch(() => {});
  const gone = await rpc("innovation_state_get", { p_owner: OWNER, p_name: "fin-record" }).catch(() => ({ json: "?" }));
  check("test account removed afterwards", gone.json === null);
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed · account ${SUB} · owner ${OWNER.slice(0, 12)}…`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Financial-2525 · sign-in saves to the database\n\n| Check | Result | Note |\n|---|---|---|\n${results.map((r) => `| ${r.name} | ${r.ok ? "✅" : "❌"} | ${r.note.replace(/\|/g, "/")} |`).join("\n")}\n`);
  }
  code = failed.length ? 1 : 0;
  process.exit(code);
}

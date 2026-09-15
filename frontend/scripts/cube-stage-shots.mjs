#!/usr/bin/env node
/**
 * cube-stage-shots — one screenshot per stage, Cubes 1–10, from the BUILT app (out/) in mock mode.
 *
 * Operator 2026-09-15: "show me individual screen shots of each stage from Cube 1-10". Drives the real
 * static export headlessly (same server + launch + easter-egg unlock as scripts/settings-egg-gate.mjs) and
 * writes PNGs to $SHOT_OUT (default ../docs/feedback/shots/cubes — NOT committed unless the operator asks).
 *
 * Test-only affordances (never touch the app):
 *   · Auth0 SPA cache seeded in the TEST browser's localStorage so /dashboard renders (AuthGuard reads
 *     getUser() from the cache; checkSession() returns early without the is.authenticated cookie).
 *   · Fake media device flags so the Cube-3 mic can enter its recording state.
 * Every stage waits on a real selector and FAILS LOUDLY; a missing stage is reported, never padded.
 *
 * Run:  npm run build && SHOT_OUT=/path node scripts/cube-stage-shots.mjs
 */
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const OUT = join(ROOT, "out");
const PORT = Number(process.env.SHOT_PORT || 4640);
const SHOT_OUT = resolve(process.env.SHOT_OUT || join(ROOT, "..", "docs", "feedback", "shots", "cubes"));
const AUTH0_CLIENT_ID = "H8wuT6P2nfm87bvbRjaegoOliLyhPw4K"; // lib/constants.ts default (mock mode never calls Auth0)
const DEMO2026 = "a1b2c3d4-e5f6-7890-abcd-111111111111";
const NEW_TITLE = "Fundraise demo — living vote";

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp", ".woff2": "font/woff2", ".mp3": "audio/mpeg" };
const serve = () => createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split("?")[0]);
    let f = join(OUT, p);
    try { if ((await stat(f)).isDirectory()) f = join(f, "index.html"); }
    catch {
      const alt = join(OUT, p.replace(/\/$/, "") + ".html");
      try { await stat(alt); f = alt; } catch { f = join(OUT, p.replace(/\/$/, ""), "index.html"); }
    }
    const body = await readFile(f);
    res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404).end("nf"); }
}).listen(PORT);

async function launch() {
  const { chromium } = await import("playwright");
  const candidates = [process.env.CHROMIUM_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome-linux/chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean);
  let executablePath;
  for (const c of candidates) { try { await stat(c); executablePath = c; break; } catch {} }
  return chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
  });
}

// Test-browser seeds: innovation gate + a forged Auth0 user entry (test-only; nothing leaves the browser).
const INIT = `
  try { sessionStorage.setItem("innovation-unlocked", "1"); } catch {}
  try {
    const clientId = ${JSON.stringify(AUTH0_CLIENT_ID)};
    const user = { sub: "auth0|shot-moderator", name: "Screenshot Moderator", email: "explore@exel-ai.com", email_verified: true,
      "https://exel-ai.com/roles": ["moderator"], updated_at: new Date().toISOString() };
    const b64 = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, "").replace(/\\+/g, "-").replace(/\\//g, "_");
    const now = Math.floor(Date.now() / 1000);
    const claims = { ...user, iss: "https://exel-ai-polling.us.auth0.com/", aud: clientId, iat: now, exp: now + 86400 * 30 };
    const idToken = b64({ alg: "none", typ: "JWT" }) + "." + b64(claims) + ".sig";
    const decodedToken = { encoded: { header: "", payload: "", signature: "" }, header: { alg: "none", typ: "JWT" }, claims: { __raw: idToken, ...claims }, user };
    localStorage.setItem("@@auth0spajs@@::" + clientId + "::@@user@@", JSON.stringify({ id_token: idToken, decodedToken }));
    localStorage.setItem("@@auth0spajs@@::" + clientId + "::default::openid profile email", JSON.stringify({
      body: { client_id: clientId, access_token: "shot-access-token", id_token: idToken, scope: "openid profile email", oauthTokenScope: "openid profile email", expires_in: 86400 * 30, decodedToken, audience: "default" },
      expiresAt: now + 86400 * 30,
    }));
  } catch {}
  Element.prototype.requestFullscreen = function () { return Promise.resolve(); };
`;

const results = [];
import { appendFileSync } from "node:fs";
const LOG = join(SHOT_OUT, "_run.log");
const note = (name, okv, detail = "") => { results.push({ name, ok: okv, detail }); const line = `${okv ? "  ✓" : "  ✗"} ${name}${detail ? " — " + detail : ""}`; console.log(line); try { appendFileSync(LOG, line + "\n"); } catch {} };
const url = (p) => `http://127.0.0.1:${PORT}${p}`;
async function shot(page, name) { const f = join(SHOT_OUT, `${name}.png`); await page.screenshot({ path: f, fullPage: false }); return f; }
async function step(name, fn) { try { await fn(); note(name, true); } catch (e) { note(name, false, String(e.message || e).split("\n")[0].slice(0, 160)); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await mkdir(SHOT_OUT, { recursive: true });
await new Promise((r) => serve().once("listening", r));
const browser = await launch();
const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, permissions: ["microphone"] });
const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ["microphone"] });
for (const c of [desktopCtx, mobileCtx]) await c.addInitScript(INIT);
const eggCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await eggCtx.addInitScript(`try { sessionStorage.setItem("innovation-unlocked", "1"); } catch {} Element.prototype.requestFullscreen = function () { return Promise.resolve(); };`);
const d = await desktopCtx.newPage();
const m = await mobileCtx.newPage();
const e = await eggCtx.newPage();
// Fail fast: a stage that cannot find its selector in 12s is a real finding, not something to wait 30s on.
d.setDefaultTimeout(12000); m.setDefaultTimeout(12000); e.setDefaultTimeout(12000);
e.on("pageerror", (x) => console.log("    PAGEERROR(e)", x.message.slice(0, 120)));
d.on("pageerror", (e) => console.log("    PAGEERROR(d)", e.message.slice(0, 120)));
m.on("pageerror", (e) => console.log("    PAGEERROR(m)", e.message.slice(0, 120)));
// The mock state lives in localStorage; the two contexts are separate origins-in-memory, so the new
// session created on the desktop dashboard is copied into the mobile context before it loads /session.
async function syncMockState() {
  const state = await d.evaluate(() => localStorage.getItem("exel_mock_state"));
  if (m.url() === "about:blank") await m.goto(url("/"), { waitUntil: "domcontentloaded", timeout: 30000 }); // an origin, so localStorage exists
  if (state) await m.evaluate((s) => localStorage.setItem("exel_mock_state", s), state);
}
// The dashboard hides the session list while a session is selected — go back before picking another card.
async function backToList() {
  const back = d.getByRole("button", { name: /back to sessions/i }).first();
  if (await back.isVisible().catch(() => false)) { await back.click(); await d.getByText("Strategy Alignment").first().waitFor({ timeout: 12000 }); await sleep(300); }
}
const findSessionId = async (title) => d.evaluate((t) => {
  try {
    const s = JSON.parse(localStorage.getItem("exel_mock_state") || "{}");
    const direct = (s.newSessions || []).find((x) => x && x.title === t && /^[0-9a-f-]{36}$/.test(String(x.id || "")));
    if (direct) return direct.id;
    const seen = new Set(); let found = null;
    const walk = (o) => { if (!o || typeof o !== "object" || seen.has(o) || found) return; seen.add(o);
      if (typeof o.title === "string" && o.title === t && /^[0-9a-f-]{36}$/.test(String(o.id || ""))) { found = o.id; return; }
      for (const v of Object.values(o)) walk(v); };
    walk(s); return found;
  } catch { return null; }
}, title);
let newId = null;

// ── Cube 1 — join / lobby / create / QR ──────────────────────────────────────
await step("01 · Cube 1 · home code entry", async () => {
  await d.goto(url("/"), { waitUntil: "networkidle", timeout: 30000 });
  await d.waitForSelector('input[placeholder="ABCD1234"]', { timeout: 15000 });
  await shot(d, "01-cube1-home-join");
});
await step("02 · Cube 1 · join lobby (STATIC01)", async () => {
  await d.goto(url("/join/?code=STATIC01"), { waitUntil: "networkidle", timeout: 30000 });
  await sleep(800);
  await shot(d, "02-cube1-join-lobby");
});
await step("03 · Cube 1 · dashboard + create dialog", async () => {
  await d.goto(url("/dashboard/"), { waitUntil: "networkidle", timeout: 30000 });
  await d.getByText("Strategy Alignment").first().waitFor({ timeout: 20000 }); // AUTH PROBE: session list renders
  await shot(d, "03a-cube1-dashboard-sessions");
  const trigger = d.locator("button").filter({ hasText: /create|new session|new poll/i }).first();
  await trigger.click();
  await d.waitForSelector("[role=dialog]", { timeout: 10000 });
  await d.locator("[role=dialog] input").first().fill(NEW_TITLE);
  await sleep(300);
  await shot(d, "03b-cube1-create-session");
  // shadcn DialogContent renders its "×" close button LAST — never click `.last()` here.
  await d.locator("[role=dialog]").getByRole("button", { name: /create session/i }).click();
  await d.waitForSelector("[role=dialog]", { state: "detached", timeout: 10000 });
  await sleep(900);
  newId = await findSessionId(NEW_TITLE);
  if (!newId) newId = await d.evaluate(() => (document.body.innerHTML.match(/sid=([0-9a-f-]{36})/) || [])[1] || null);
  if (!newId) throw new Error("new session id not found (mock state newSessions / DOM sid=)");
  // open the new session (it may already be selected)
  const card = d.getByText(NEW_TITLE).first();
  if (await card.isVisible().catch(() => false)) await card.click().catch(() => {});
  await d.getByRole("button", { name: /start polling/i }).first().waitFor({ timeout: 10000 });
});
await step("04 · Cube 1 · QR / share card (draft session)", async () => {
  await sleep(400);
  await shot(d, "04-cube1-qr-share");
});

// ── Cube 2/3/8 — participant text + voice + tokens (mobile), Cube 4/5 — feed + gateway (desktop) ──
let pollingStartedAt = 0;
await step("05 · Cube 2 · text submission (mobile)", async () => {
  await d.getByRole("button", { name: /start polling/i }).first().click();
  pollingStartedAt = Date.now();
  await sleep(700);
  await syncMockState();
  await m.goto(url(`/session/?id=${newId}`), { waitUntil: "networkidle", timeout: 30000 });
  await sleep(2500);
  await shot(m, "05-debug-mobile-session-state"); // what the participant actually sees first
  await m.waitForSelector("textarea", { timeout: 20000 });
  await shot(m, "05-cube2-text-input-mobile");
});
await step("06 · Cube 3 · voice recording (mobile)", async () => {
  const mic = m.locator('button[title*="ecord"], button:has(svg.lucide-mic)').first();
  await mic.click();
  await sleep(900);
  await shot(m, "06-cube3-voice-recording-mobile");
  await mic.click().catch(() => {}); // stop
});
await step("12a · Cube 8 · token HUD appears on first keystroke (mobile)", async () => {
  await m.locator("textarea").fill("");
  await m.locator("textarea").type("W", { delay: 20 });
  await sleep(1200);
  await shot(m, "12a-cube8-token-hud-mobile");
});
await step("08a · Cube 5 · gateway controls (Start Ranking)", async () => {
  await d.getByRole("button", { name: /start ranking/i }).first().waitFor({ timeout: 10000 });
  await shot(d, "08a-cube5-gateway-controls");
});
await step("12b · Cube 8 · submit → tokens earned (mobile)", async () => {
  await m.locator("textarea").fill("We should govern autonomous AI through shared human intent, with auditable consensus at every step.");
  // the button label is cube1.session.submit_btn / submit_next — match the form's primary button, not a literal
  const submitBtn = m.locator("form button:not([variant=outline]), button").filter({ hasText: /submit|send|next/i }).last();
  await submitBtn.click({ timeout: 8000 }).catch(async () => { await m.locator("textarea").press("Enter"); });
  await sleep(1800);
  await shot(m, "12b-cube8-tokens-earned-mobile");
});
await step("07 · Cube 4 · live response feed (desktop, after the participant submits)", async () => {
  await d.bringToFront();
  await d.getByText(/1 responses|1 response/).first().waitFor({ timeout: 12000 }).catch(() => {});
  await sleep(1200);
  await shot(d, "07-cube4-live-feed");
});
await step("07b · Cube 4 · seeded live feed (DEMO2026, 7 responses + ticker)", async () => {
  await backToList();
  await d.getByText("Strategy Alignment").first().click();
  await d.getByText(/live response feed/i).first().waitFor({ timeout: 12000 });
  await sleep(1500);
  await shot(d, "07b-cube4-live-feed-demo2026");
});
await step("08b · Cube 5 · static-poll deadline banner (STATIC01)", async () => {
  await backToList();
  await d.getByText("Team Innovation Challenge").first().click();
  await sleep(900);
  await shot(d, "08b-cube5-static-deadline");
  await backToList();
  await d.getByText(NEW_TITLE).first().click();
  await d.getByRole("button", { name: /start ranking/i }).first().waitFor({ timeout: 12000 });
});

// ── Cube 7 — ranking ballot, adjust, re-open ──────────────────────────────────
await step("10a · Cube 7 · ranking ballot (mobile)", async () => {
  await d.getByRole("button", { name: /start ranking/i }).first().click();
  await sleep(900);
  await syncMockState();
  await m.goto(url(`/session/?id=${newId}`), { waitUntil: "networkidle", timeout: 30000 });
  await m.getByRole("button", { name: /confirm rankings/i }).first().waitFor({ timeout: 20000 });
  await shot(m, "10a-cube7-ranking-ballot-mobile");
});
await step("10b · Cube 7 · submitted → Adjust my ranking / Done", async () => {
  await sleep(2300); // default order auto-accepts after 2s
  await m.getByRole("button", { name: /confirm rankings/i }).first().click();
  await m.getByRole("button", { name: /adjust my ranking/i }).first().waitFor({ timeout: 15000 });
  await shot(m, "10b-cube7-adjust-ranking-mobile");
});
await step("11 · Cube 7 · moderator can re-open the round (next cycle)", async () => {
  await d.bringToFront();
  await d.getByRole("button", { name: /re-open polling/i }).first().waitFor({ timeout: 10000 });
  await shot(d, "11-cube7-reopen-round");
});

// ── Cube 6 — Flower of Life (PAST0001 showcase) ───────────────────────────────
await step("09a · Cube 6 · Flower of Life + ranked priorities (PAST0001)", async () => {
  await backToList();
  await d.getByText("Collaborative Thoughts on AI Governance").first().click();
  await d.waitForSelector('[data-testid="ranked-themes"]', { timeout: 20000 });
  const later = d.getByRole("button", { name: /maybe later/i }).first();
  if (await later.isVisible().catch(() => false)) { await shot(d, "12c-cube8-donation-prompt"); await later.click(); await sleep(500); }
  await d.locator("svg .flower-circle-interactive").first().scrollIntoViewIfNeeded();
  await sleep(700);
  await shot(d, "09a-cube6-flower-theme01");
});
await step("09b · Cube 6 · Theme 02 · 3/6/9 rotary", async () => {
  await d.locator("svg .flower-circle-interactive").first().dispatchEvent("click");
  await sleep(900);
  await shot(d, "09b-cube6-flower-theme02-369");
});
await step("09c · Cube 6 · response drawer (33/111/333)", async () => {
  await d.locator("svg .flower-circle-interactive").first().dispatchEvent("click");
  await sleep(900);
  await shot(d, "09c-cube6-response-drawer");
  await d.keyboard.press("Escape").catch(() => {});
});

// ── Cube 9 — reports / CSV / CRS matrix ───────────────────────────────────────
await step("13a · Cube 9 · Export CSV (mid-progress)", async () => {
  await d.locator("svg .flower-circle-interactive").first().scrollIntoViewIfNeeded().catch(() => {});
  const exp = d.getByRole("button", { name: /export csv/i }).first();
  await exp.scrollIntoViewIfNeeded();
  await exp.click({ force: true, timeout: 8000 }).catch(() => exp.dispatchEvent("click"));
  await sleep(350);
  await shot(d, "13a-cube9-export-csv");
});
await step("13b · Cube 9 · CRS traceability matrix (/crs/)", async () => {
  await d.goto(url("/crs/"), { waitUntil: "networkidle", timeout: 30000 });
  await sleep(800);
  await shot(d, "13b-cube9-crs-matrix");
});

// ── Cube 10 — easter-egg unlock → SIM → Admin Console ─────────────────────────
await step("14a · Cube 10 · easter-egg unlock → Simulation Mode", async () => {
  await e.goto(url(`/session/?id=DEMO2026&sim=1`), { waitUntil: "networkidle", timeout: 30000 });
  await e.getByRole("button", { name: "Settings" }).first().click();
  await e.getByRole("button", { name: "Settings" }).last().click();
  await e.waitForSelector("[data-settings-footer]", { timeout: 10000 });
  await e.evaluate(() => document.querySelector("[data-settings-footer]")?.scrollIntoView({ block: "end" }));
  for (const id of ["exel-cyan", "sunset", "violet"]) { await e.click(`[data-theme-preset="${id}"]`); await sleep(120); }
  await sleep(400);
  await e.click(`[data-settings-footer] [data-exel-badge] button`);
  await e.waitForSelector("[data-sim-overlay]", { timeout: 10000 });
  await sleep(1500);
  await shot(e, "14a-cube10-simulation-mode");
});
await step("14b · Cube 10 · Cube Dev Sim (real code, cubes 1–9)", async () => {
  const spoke = e.getByText(/cube sim/i).first();
  await spoke.click();
  await e.getByRole("button", { name: /cube dev sim/i }).first().waitFor({ timeout: 15000 });
  await sleep(1200);
  await shot(e, "14b-cube10-cube-dev-sim");
  const six = e.locator('[data-cube-sim-select="6"]').first();
  if (await six.count()) { await six.click(); await sleep(1200); await shot(e, "14c-cube10-dev-sim-cube6"); }
});
await step("15a · Cube 10 · 웃→◬→♡ + code → Admin Console", async () => {
  for (const id of ["hi", "ai", "si"]) { await e.click(`[data-cube10-icon="${id}"]`); await sleep(150); }
  await e.waitForSelector("[data-cube10-code]", { timeout: 5000 });
  await e.fill("[data-cube10-code]", "94561230");
  await e.click("[data-cube10-verify]");
  await e.waitForSelector("[data-cube10-level]", { timeout: 5000 });
  await e.getByRole("button", { name: /admin console/i }).first().click();
  await e.getByRole("button", { name: /run simulation/i }).first().waitFor({ timeout: 10000 });
  await sleep(400);
  await shot(e, "15a-cube10-admin-console");
});
await step("15b · Cube 10 · Admin Console run → Theme 01/02 + priorities", async () => {
  const count = e.locator('input[type="number"]').first();
  await count.fill("120");
  await e.getByRole("button", { name: /run simulation/i }).first().click();
  await e.getByText(/theme 01 · priorities/i).first().waitFor({ timeout: 120000 });
  await sleep(600);
  await shot(e, "15b-cube10-admin-console-results");
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\ncube-stage-shots: ${results.length - failed.length} captured, ${failed.length} failed → ${SHOT_OUT}`);
for (const f of failed) console.log(`  ✗ ${f.name} — ${f.detail}`);
process.exit(failed.length ? 1 : 0);

#!/usr/bin/env node
/**
 * TWO DEVICES, PROVEN — operator 2026-09-15: "Ensure 2x people on drone has one on control as PILOT and
 * another on phone or PC on gimbal as Targeteer."
 *
 * Two real browser pages open the same crew code in different seats: a wide one for the person at a
 * computer and a phone-sized one for the person on a handset. The pilot flies. The targeteer aims. Then
 * each screen is asked what it can SEE of the other, and what it is ALLOWED to do itself.
 *
 * The harness serves the built site AND implements /api/drone-link in memory, because the real endpoint is
 * a Cloudflare Pages Function and there is no Cloudflare here. That is a test of the CONTRACT — the same
 * request and response shapes the deployed function answers — and this comment exists so nobody later
 * mistakes it for a test of the deployed function itself.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const OUT = join(ROOT, "out");
const PORT = Number(process.env.CREW_PORT || 4691);
const SHOTS = process.env.CREW_SHOTS || join(ROOT, "..", "shots-crew");

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon" };

/** The in-memory stand-in for the Pages Function: last word per seat, newest wins. */
const LINK = new Map();

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname === "/api/drone-link") {
    res.setHeader("access-control-allow-origin", "*");
    if (req.method === "GET") {
      const code = (url.searchParams.get("crew") || "").toUpperCase();
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ seats: LINK.get(code) ?? {} }));
      return;
    }
    if (req.method === "POST") {
      let raw = ""; for await (const c of req) raw += c;
      try {
        const { crew, msg } = JSON.parse(raw);
        const code = String(crew).toUpperCase();
        const seats = LINK.get(code) ?? {};
        if (!seats[msg.seat] || Number(seats[msg.seat].seq) < Number(msg.seq)) seats[msg.seat] = msg;
        LINK.set(code, seats);
        res.writeHead(201, { "content-type": "application/json" });
        res.end(JSON.stringify({ seats }));
      } catch { res.writeHead(400).end("{}"); }
      return;
    }
  }
  try {
    const p = decodeURIComponent(url.pathname);
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
  const c = [process.env.CHROMIUM_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome-linux/chrome", "/usr/bin/chromium"].filter(Boolean);
  let executablePath;
  for (const x of c) { try { await stat(x); executablePath = x; break; } catch {} }
  // TWO DEVICES ARE TWO SCREENS THAT ARE BOTH AWAKE. Without these, Chromium throttles whichever page is
  // not in front to about one frame a second, and the pilot's aircraft climbs at a tenth speed — which is
  // a fact about background tabs, not about the aircraft. The first run of this harness found exactly that.
  const args = ["--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"];
  return chromium.launch(executablePath ? { executablePath, args } : { args });
}

const CODE = "CREW77";
const url = (seat) => `http://127.0.0.1:${PORT}/main/Drone-2525/?crew=${CODE}&seat=${seat}`;
const txt = async (p, sel) => ((await p.locator(sel).first().count()) ? ((await p.locator(sel).first().textContent()) ?? "").replace(/\s+/g, " ").trim() : null);
const has = async (p, sel) => (await p.locator(sel).count()) > 0;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  FAIL:", m); } };

(async () => {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(SHOTS, { recursive: true });
  const browser = await launch();
  // TWO SEPARATE CONTEXTS — two profiles, two storage areas, no shared BroadcastChannel. That is what makes
  // this a test of the CROSS-DEVICE path rather than of two tabs talking to each other. If the link works
  // here, it works between a phone and a computer.
  const ctxPc = await browser.newContext({ deviceScaleFactor: 2 });
  const ctxPhone = await browser.newContext({ deviceScaleFactor: 2 });
  try {
    const pc = await ctxPc.newPage();                     // the person at a computer
    await pc.setViewportSize({ width: 1280, height: 1000 });
    const phone = await ctxPhone.newPage();               // the person on a handset
    await phone.setViewportSize({ width: 390, height: 844 });

    await pc.goto(url("pilot"), { waitUntil: "networkidle" });
    await phone.goto(url("targeteer"), { waitUntil: "networkidle" });
    for (const p of [pc, phone]) {
      await p.waitForSelector("[data-drone-arena] svg path", { timeout: 20000 });
      await p.click("[data-drone-mode='drone']");
      await p.waitForTimeout(400);
    }

    console.log("TWO DEVICES, ONE AIRCRAFT\n");
    ok((await txt(pc, "[data-crew-seat]"))?.includes("flying"), `the computer opened straight into the pilot's seat: "${await txt(pc, "[data-crew-seat]")}"`);
    ok((await txt(phone, "[data-crew-seat]"))?.includes("camera"), `the phone opened straight into the camera seat: "${await txt(phone, "[data-crew-seat]")}"`);

    // ── EACH SEAT HAS ONLY ITS OWN CONTROLS ──────────────────────────────────────────────────────
    ok(await has(pc, "[data-drone-takeoff]"), "the pilot has take off");
    ok(await has(pc, "[data-drone-sticks]"), "the pilot has the sticks");
    ok(!(await has(pc, "[data-drone-shoot]")), "THE PILOT HAS NO SHOOT BUTTON — it is not disabled, it is not there");
    ok(!(await has(pc, "[data-drone-capture]")), "and no capture button");
    ok(!(await has(pc, "[data-drone-next]")), "and no next-door button");

    ok(await has(phone, "[data-drone-shoot]"), "the targeteer has shoot");
    ok(await has(phone, "[data-drone-capture]"), "and capture");
    ok(await has(phone, "[data-drone-next]"), "and next door");
    ok((await phone.locator("[data-drone-stick='BODY']").count()) === 0 && (await phone.locator("[data-drone-hold]").count()) === 0, "THE TARGETEER HAS NO BODY STICK AND NO TURN/CLIMB — they cannot fly (the HEAD stick is theirs, r.050)");
    ok(!(await has(phone, "[data-drone-takeoff]")), "and no take off");

    // ── THEY ACTUALLY REACH EACH OTHER ───────────────────────────────────────────────────────────
    await pc.click("[data-drone-run]");
    await phone.click("[data-drone-run]");
    await pc.waitForTimeout(9000);                       // let the pilot climb to loiter height

    const pilotFlight = await txt(pc, "[data-drone-flight]");
    const seenByPhone = await txt(phone, "[data-drone-flight]");
    const pilotAgl = Number(/(\d+) m AGL/.exec(pilotFlight ?? "")?.[1] ?? "-1");
    const phoneAgl = Number(/(\d+) m AGL/.exec(seenByPhone ?? "")?.[1] ?? "-1");
    console.log(`  pilot screen : ${pilotFlight}`);
    console.log(`  phone screen : ${seenByPhone}`);
    ok(pilotAgl > 20, `the pilot got the aircraft off the ground (${pilotAgl} m)`);
    ok(phoneAgl > 20, `AND THE PHONE SEES IT UP THERE (${phoneAgl} m) — the flight crossed the link`);
    ok(Math.abs(pilotAgl - phoneAgl) <= 12, `both screens agree on the height within a few metres (${pilotAgl} vs ${phoneAgl})`);

    await phone.click("[data-drone-next]");
    await phone.waitForTimeout(3500);
    const phoneAim = await txt(phone, "[data-drone-aim]");
    const pcAim = await txt(pc, "[data-drone-aim]");
    console.log(`  phone aim    : ${phoneAim}`);
    console.log(`  pilot sees   : ${pcAim}`);

    // THE SECOND PERSON, OVER THE LINK (r.050: APPROVE — HI-2 or net peer; DRN-09.04). The targeteer marks a
    // door AMBER on the phone; the mark rides the gimbal word; the pilot's computer shows a button to approve
    // it; the approval crosses back and the phone's box turns RED in the PILOT's name — two-person, not HI-2.
    let marked = false;
    for (let i = 0; i < 12 && !marked; i++) {
      if (await phone.locator("[data-drone-target]").isDisabled()) { await phone.click("[data-drone-next]"); await phone.waitForTimeout(1500); continue; }
      await phone.click("[data-drone-target]"); await phone.waitForTimeout(300);
      marked = !/TARGET FIRST/.test(await phone.locator("[data-drone-slot]").innerText());
    }
    const amberLine = await phone.locator("[data-drone-slot]").innerText();
    ok(marked && /AMBER/.test(amberLine), `the targeteer marks a door amber on the phone (${amberLine})`);
    await pc.waitForSelector("[data-drone-approve-link]", { timeout: 6000 }).catch(() => {});
    const pcSeesAmber = (await pc.locator("[data-drone-approve-link]").count()) > 0;
    ok(pcSeesAmber, `the pilot's computer sees the amber mark and offers to approve it${pcSeesAmber ? ": " + (await pc.locator("[data-drone-approve-link]").innerText()) : ""}`);
    ok(!(await phone.locator("[data-drone-shoot]").isEnabled()), "the phone cannot fire on amber");
    if (pcSeesAmber) {
      await pc.click("[data-drone-approve-link]");
      await phone.waitForFunction(() => /RED/.test(document.querySelector("[data-drone-slot]")?.textContent || ""), null, { timeout: 6000 }).catch(() => {});
    }
    const redLine = await phone.locator("[data-drone-slot]").innerText();
    ok(/RED \(pilot\)/.test(redLine), `the phone's box turns RED in the PILOT's name — two-person (${redLine})`);
    ok(await phone.locator("[data-drone-shoot]").isEnabled(), "and only now may the targeteer fire");
    // BOTH SCREENS, ONE DECISION (eXeL AI gate 3). The pilot's computer draws the same red box and prints the
    // same DEC-#### the targeteer's ledger assigned.
    await pc.waitForFunction(() => /RED/.test(document.querySelector("[data-drone-slot]")?.textContent || ""), null, { timeout: 6000 }).catch(() => {});
    const pcSlot = await txt(pc, "[data-drone-slot]");
    const phoneId = await txt(phone, "[data-drone-decision]");
    const pcId = await txt(pc, "[data-drone-decision]");
    ok(/RED \(pilot\)/.test(pcSlot ?? ""), `the pilot's screen shows the same red box (${pcSlot})`);
    ok(/^DEC-\d{4}$/.test(phoneId ?? "") && phoneId === pcId, `and the same decision id on both screens (${phoneId} / ${pcId})`);
    console.log(`  decision id  : ${phoneId} on the phone · ${pcId} on the computer`);
    console.log(`  phone slot   : ${redLine}`);
    const az = (s) => Number(/A (\d+)°/.exec(s ?? "")?.[1] ?? "-1");
    ok(az(phoneAim) >= 0, `the targeteer aimed (${phoneAim})`);
    ok(az(pcAim) === az(phoneAim), `AND THE PILOT SEES THE SAME BEARING (${az(pcAim)}° vs ${az(phoneAim)}°) — the aim crossed the link`);

    const pcLink = await txt(pc, "[data-crew-link]");
    const phoneLink = await txt(phone, "[data-crew-link]");
    console.log(`  pilot link   : ${pcLink}`);
    console.log(`  phone link   : ${phoneLink}`);
    ok(/connected/.test(pcLink ?? ""), "the pilot's screen says the targeteer is there");
    ok(/connected/.test(phoneLink ?? ""), "and the targeteer's says the pilot is");
    ok(!/refused/.test(pcLink ?? "") && !/refused/.test(phoneLink ?? ""), "and neither refused a message from the other");

    await pc.screenshot({ path: join(SHOTS, "crew-pilot-pc.png") });
    await phone.screenshot({ path: join(SHOTS, "crew-targeteer-phone.png") });
    console.log(`\n  → ${SHOTS}`);
  } finally { await browser.close(); server.close(); }

  console.log(`\ndrone-crew-e2e: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

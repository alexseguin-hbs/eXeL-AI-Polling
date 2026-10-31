// Worker entry for the Workers Static Assets deploy (wrangler.jsonc `main`).
//
// DEPLOYMENT REALITY: this site is a Next.js static export served as Workers
// Static Assets — the Pages `functions/` convention is NEVER executed here.
// Any dynamic route must live in THIS worker. With both `main` and `assets`
// configured, requests matching a static asset are served directly; everything
// else lands here, and `env.ASSETS.fetch` preserves the configured SPA
// fallback for unknown paths.
//
// Routes:
//   /api/responses · /api/sessions · /api/drone-link · /api/geo  →  the Pages Functions in functions/api,
//     dispatched here (PAGES_ROUTES) because functions/ never runs on this deploy.
//   /Atlantis-Accords/<7-char-hash>  →  302  /seal#<hash>
//     Pretty sealed short link (throwback to the 7 clearance levels). The
//     hosted reader (public/seal.html) fetches the ciphertext from the
//     Supabase seal store by the #hash. Issued links must never fall through
//     to the SPA homepage with a silent 200 (Council of Twelve mandate) —
//     malformed hashes land on the Accords page instead.
//     NOTE: target the EXTENSIONLESS /seal, not /seal.html. Workers Static
//     Assets 307-redirects .html → clean URL, and that second redirect's
//     Location drops the #fragment — losing the hash the reader needs. /seal
//     serves the reader with a terminal 200, so the fragment survives one hop.
//
// SECURITY:
//   1. Edge PREVENTION — deny unambiguous attack signatures in the request
//      PATH (traversal, dotfiles, scanner probes) before they reach assets.
//   2. PAUSE kill-switch — when paused, every route except the home page (/)
//      and static assets returns paused.html with 503. (/main and /main/* are
//      301'd to the root route BEFORE the pause check — /main is never used.)
//   Both fail OPEN: any error leaves the site fully live. Toggle the pause via
//   KV `SITE_STATE:paused` (instant) or env `SITE_PAUSED` (both default OFF).
import { handleDonate, handleDonateVerify } from "./donate-core.js";
import { handleNotify } from "./notify-core.js";
import { handleTmp } from "./tmp-core.js";
import { handleAi } from "./ai-core.js";
import { onRequest as responsesRoute } from "./functions/api/responses.js";
import { onRequest as sessionsRoute } from "./functions/api/sessions.js";
import { onRequest as droneLinkRoute } from "./functions/api/drone-link.js";
import { onRequestGet as geoRoute } from "./functions/api/geo.js";

// The Pages Functions the app calls, dispatched from here because this deploy never runs functions/
// (the /api/donate lesson above, same class). Each answered index.html with a 200 until 2026-10-07:
// Trinity Path C / Channel C (/api/responses), cross-device session lookup (/api/sessions), the
// drone crew link (/api/drone-link) and the minimum-wage country hint (/api/geo). They need only
// request + env + caches.default, all present in a Worker; KV `RESPONSES` is optional (Cache API fallback).
const PAGES_ROUTES = {
  "/api/responses": responsesRoute,
  "/api/sessions": sessionsRoute,
  "/api/drone-link": droneLinkRoute,
  "/api/geo": (ctx) => (ctx.request.method === "GET" || ctx.request.method === "HEAD")
    ? geoRoute(ctx)
    : new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "content-type": "application/json", allow: "GET" } }),
};

// A route that throws answers one generic sentence; the detail goes to the worker log, never to the caller
// (Thor, round 2: internal error text used to leak in the 502 body).
function routeFailed(e) {
  console.error("[worker] route failed:", e && e.stack || e);
  return new Response(JSON.stringify({ error: "The service is unavailable — try again shortly" }), {
    status: 502, headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- /api/donate — LIVE Stripe Checkout (see donate-core.js) ---------------------------------
    // ⚠ THIS ROUTE HAS TO BE HERE, NOT IN functions/. It was written as a Pages Function, and this
    // deploy never runs those (see the header above). The request therefore fell through to
    // env.ASSETS.fetch → SPA fallback → index.html with a 200, so the client got HTML where it
    // expected JSON and showed "Donation could not be started. Please try again." Stripe was never
    // contacted. Handled before the path-signature WAF (fixed paths need none) but NOT before the
    // pause: a paused site must not take money (Thor, wave 3 — the earlier comment had it inverted).
    if (url.pathname.startsWith("/api/donate") && (await isPaused(env))) {
      return new Response(JSON.stringify({ error: "Site paused" }), { status: 503, headers: { "content-type": "application/json" } });
    }
    // --- /api/ai — placement + drafting through OpenAI / Gemini / Grok (ai-core.js; keys are Worker secrets) ---
    if (url.pathname === "/api/ai" || url.pathname === "/api/ai/") {
      if (await isPaused(env)) return new Response(JSON.stringify({ error: "Site paused" }), { status: 503, headers: { "content-type": "application/json" } });
      try { return await handleAi(request, env); }
      catch (e) { return routeFailed(e); }
    }
    // --- /api/tmp — a partly-signed PDF handed over by a 24-hour link (tmp-core.js; KV SIGN_FILES) ---------
    if (url.pathname === "/api/tmp" || url.pathname.startsWith("/api/tmp/")) {
      if (await isPaused(env)) return new Response(JSON.stringify({ error: "Site paused" }), { status: 503, headers: { "content-type": "application/json" } });
      try { return await handleTmp(request, env); }
      catch (e) { return routeFailed(e); }
    }
    if (url.pathname === "/api/notify" || url.pathname === "/api/notify/") {
      if (await isPaused(env)) return new Response(JSON.stringify({ error: "Site paused" }), { status: 503, headers: { "content-type": "application/json" } });
      try { return await handleNotify(request, env); }
      catch (e) { return routeFailed(e); }
    }
    if (url.pathname === "/api/donate/verify" || url.pathname === "/api/donate/verify/") {
      try { return await handleDonateVerify(request, env); }
      catch (e) { return routeFailed(e); }
    }
    if (url.pathname === "/api/donate" || url.pathname === "/api/donate/") {
      try {
        return await handleDonate(request, env);
      } catch (_e) {
        return new Response(JSON.stringify({ error: "Donation service error" }), {
          status: 502, headers: { "content-type": "application/json" },
        });
      }
    }

    const pagesRoute = PAGES_ROUTES[url.pathname.replace(/\/+$/, "")];
    if (pagesRoute) {
      if (await isPaused(env)) return new Response(JSON.stringify({ error: "Site paused" }), { status: 503, headers: { "content-type": "application/json" } });
      try { return await pagesRoute({ request, env: env || {} }); }
      catch (e) { return routeFailed(e); }
    }

    // --- Atlantis short link (unchanged) ---
    const m = url.pathname.match(/^\/Atlantis-Accords\/([^/]+)\/?$/);
    if (m) {
      const hash = m[1];
      if (/^[A-Za-z0-9]{4,16}$/.test(hash)) {
        return Response.redirect(url.origin + "/seal#" + hash, 302);
      }
      return Response.redirect(url.origin + "/Atlantis-Accords/", 302);
    }

    // --- Edge PREVENTION (path only; query strings are never inspected) ---
    try {
      const raw = url.pathname.toLowerCase();
      const dec = decodeURIComponent(raw);
      const SIGS = ["../", "<script", "union select", "/etc/passwd", "/.env", "/.git/", "/wp-admin", "/wp-login"];
      if (raw.includes("%00") || SIGS.some((sig) => dec.includes(sig))) {
        return new Response("Forbidden", { status: 403, headers: { "cache-control": "no-store" } });
      }
    } catch (_e) {
      // malformed percent-encoding — do not block; let ASSETS handle it
    }

    // --- /main is never used (operator 2026-10-30: "/main/Architect-2525/ must post to /Architect-2525/. Main should
    // never be used anywhere. /main is the same as the site root"). ONE permanent redirect, before the asset fetch
    // (run_worker_first guarantees it runs): /main → /, /main/<x> → /<x>, query string preserved (Drone ?crew= / ?si=
    // links), so every old link, ledger route and whitepaper URL lands on the canonical route. Never loops: the
    // target never starts with /main. Gated by tests/main-redirect.test.mjs.
    // R5b: any case (/Main, /MAIN) and a repeated prefix (/main/main/x) collapse in ONE hop.
    const mainHit = url.pathname.match(/^(?:\/main)+(?=\/|$)/i);
    if (mainHit) {
      // a doubled slash after the prefix (/main//x) collapses too — the Location is always same-origin, but "//x" read as a
      // host to a human (Thor NOTE-9)
      const rest = url.pathname.slice(mainHit[0].length).replace(/^\/{2,}/, "/");
      return Response.redirect(url.origin + (rest === "" || rest === "/" ? "/" : rest) + url.search, 301);
    }

    // --- Site pause kill-switch (fails OPEN on any error) ---
    try {
      if (await isPaused(env)) {
        const p = url.pathname;
        const isHome = p === "/";
        const isAsset = p.startsWith("/_next/") || /\.[a-z0-9]+$/i.test(p);
        if (!isHome && !isAsset) {
          const res = await env.ASSETS.fetch(new URL("/paused.html", url.origin));
          return new Response(res.body, {
            status: 503,
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "no-store",
              "retry-after": "600",
            },
          });
        }
      }
    } catch (_err) {
      // fail open — never let the safety check take the site down
    }

    const asset = await env.ASSETS.fetch(request);
    const path = url.pathname;

    // 2026.10.17 · THE DOCUMENT CACHE RULE LIVES HERE, NOT IN _headers, AND THE REASON IS MEASURED.
    // The first cut of this fix put `Cache-Control: no-cache, must-revalidate` on the `/*` block of
    // public/_headers. The live probe added in the same hour showed what Cloudflare Workers Static Assets
    // actually does with two matching rules: it CONCATENATES them. A hashed bundle came back as
    //     cache-control: no-cache, must-revalidate, public, max-age=31536000, immutable
    // — one header carrying both, and `no-cache` wins in every browser, so the immutable year on every
    // hashed asset was silently defeated. Neither "last wins" nor "most specific wins"; both apply.
    // `headers.set` REPLACES, so doing it here cannot collide with anything _headers says, and it keys on
    // what the response actually IS (an HTML document) rather than on a path glob that cannot express
    // "every document except /_next/static".
    const ctype = asset.headers.get("content-type") || "";
    const isDocument = ctype.includes("text/html");
    const isSensorFusion = path === "/SensorFusion-2525" || path.startsWith("/SensorFusion-2525/");
    if (isDocument || isSensorFusion) {
      const headers = new Headers(asset.headers);
      // every document revalidates before reuse — three times the operator was shown a page older than the
      // one the site served (the living document r143, the operator deck r.202, R-CORE 2026.10.17)
      if (isDocument) headers.set("Cache-Control", "no-cache, must-revalidate");
      if (isSensorFusion) headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(self)");
      return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
    }
    return asset;
  },
};

async function isPaused(env) {
  if (!env) return false;
  if (env.SITE_PAUSED === "1") return true;
  if (env.SITE_STATE && typeof env.SITE_STATE.get === "function") {
    const v = await env.SITE_STATE.get("paused");
    if (v === "1" || v === "true") return true;
  }
  return false;
}

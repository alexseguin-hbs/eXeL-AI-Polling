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
// SITE PAUSE (kill-switch):
//   When paused, EVERY route except the home page (/, /main, /main/*) and
//   static assets is served the /paused.html page with a 503. Two independent
//   switches, checked in order, both OPTIONAL and default-OFF:
//     1. KV binding `SITE_STATE`, key "paused" == "1"|"true"  (instant, no deploy)
//     2. env var `SITE_PAUSED` == "1"                          (needs a deploy)
//   The check FAILS OPEN: any missing binding or runtime error leaves the site
//   fully live, so a misconfiguration can never take the platform down. To pause
//   live: `wrangler kv key put --binding=SITE_STATE paused 1` (or set it in the
//   Cloudflare dashboard). To resume: set it to "0" / delete the key.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- Atlantis short link (unchanged) ---
    const m = url.pathname.match(/^\/Atlantis-Accords\/([^/]+)\/?$/);
    if (m) {
      const hash = m[1];
      if (/^[A-Za-z0-9]{4,16}$/.test(hash)) {
        return Response.redirect(url.origin + "/seal#" + hash, 302);
      }
      return Response.redirect(url.origin + "/Atlantis-Accords/", 302);
    }

    // --- Site pause kill-switch (fails OPEN on any error) ---
    try {
      if (await isPaused(env)) {
        const p = url.pathname;
        const isHome = p === "/" || p === "/main" || p === "/main/" || p.startsWith("/main/");
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

    return env.ASSETS.fetch(request);
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

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
// SECURITY:
//   1. Edge PREVENTION — deny unambiguous attack signatures in the request
//      PATH (traversal, dotfiles, scanner probes) before they reach assets.
//   2. PAUSE kill-switch — when paused, every route except the home page
//      (/, /main, /main/*) and static assets returns paused.html with 503.
//   Both fail OPEN: any error leaves the site fully live. Toggle the pause via
//   KV `SITE_STATE:paused` (instant) or env `SITE_PAUSED` (both default OFF).
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

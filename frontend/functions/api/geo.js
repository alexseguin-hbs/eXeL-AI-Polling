/**
 * GET /api/geo — Cloudflare-native IP geolocation for Seed-token pricing.
 * =====================================================================
 * Returns the visitor's country + region (US state) straight from Cloudflare's
 * edge (`request.cf`), so the Seed membership price uses the correct local
 * minimum wage without any external geo API, API key, or CORS round-trip.
 *
 * Response: { country, regionCode, region, city, colo }
 *   country    ISO-3166 alpha-2 (e.g. "US", "NG")
 *   regionCode subdivision code  (e.g. "TX" — US state)
 *   region     subdivision name  (e.g. "Texas")
 *
 * Consumed by frontend/lib/min-wage.ts → detectRegion().
 * Never returns PII beyond coarse location; no IP address is echoed back.
 */
export function onRequestGet({ request }) {
  const cf = request.cf || {};
  const country =
    cf.country || request.headers.get("cf-ipcountry") || null;

  const body = {
    country: country || null,
    regionCode: cf.regionCode || null,
    region: cf.region || null,
    city: cf.city || null,
    colo: cf.colo || null,
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Vary by IP country so the edge cache doesn't serve one region's answer
      // to another; keep it short since a visitor's location rarely changes.
      "cache-control": "private, max-age=300",
    },
  });
}

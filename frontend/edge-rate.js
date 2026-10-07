// A soft per-IP rate limit for worker routes that spend money or write shared state.
// Cloudflare's Cache API is per-colo and not atomic, so this caps abuse from one client
// at one edge; it is not a global quota. The key is CF-Connecting-IP (set by Cloudflare,
// never by the client), falling back to a single shared bucket when it is absent.
export async function overLimit(request, name, max, windowSec = 60) {
  try {
    if (typeof caches === "undefined" || !caches.default) return false;
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const slot = Math.floor(Date.now() / (windowSec * 1000));
    const key = new Request(`https://edge-rate.internal/${name}/${encodeURIComponent(ip)}/${slot}`);
    const hit = await caches.default.match(key);
    const n = hit ? Number(await hit.text()) || 0 : 0;
    if (n >= max) return true;
    await caches.default.put(key, new Response(String(n + 1), { headers: { "cache-control": `max-age=${windowSec}` } }));
    return false;
  } catch {
    return false; // fail open: a broken counter never takes a route down
  }
}

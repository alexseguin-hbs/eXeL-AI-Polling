/**
 * Cloudflare Pages Function — pretty Atlantis Accords share URL.
 *
 * Serves the sealed reader at `/Atlantis-Accords/<7-char-hash>` — a short,
 * on-brand link (a throwback to the 7 clearance levels) instead of the long
 * `/seal.html#<payload>` fragment. The reader (public/seal.html) reads the
 * hash from the path, fetches the stored ciphertext from /api/seal, and
 * decrypts locally. The host only ever holds ciphertext — zero-knowledge.
 */
export async function onRequest(context) {
  const { request, env, params } = context;
  const hash = String(params.hash || "");

  // Bad-shaped hash → send them to the empty-reader message.
  if (!/^[A-Za-z0-9]{4,16}$/.test(hash)) {
    return Response.redirect(new URL("/seal.html", request.url).toString(), 302);
  }

  // Serve the static reader at this pretty path so the URL stays as shared.
  // The reader parses the hash out of location.pathname.
  try {
    const res = await env.ASSETS.fetch(new URL("/seal.html", request.url));
    return new Response(res.body, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    // No asset binding (older runtime) → fall back to the fragment reader.
    return Response.redirect(new URL("/seal.html#" + hash, request.url).toString(), 302);
  }
}

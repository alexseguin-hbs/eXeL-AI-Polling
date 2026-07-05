// Pretty short link for sealed Atlantis Accords packages:
//   /Atlantis-Accords/<7-char-hash>  →  302  /seal.html#<hash>
// The hosted reader (public/seal.html) then fetches the ciphertext from the
// Supabase seal store by the #hash. Restored after 5d10bfa removed the handler
// and previously issued links fell through to the SPA homepage with a silent
// HTTP 200 (Council of Twelve mandate: issued links must never die silently).
export function onRequestGet(context) {
  const hash = context.params.hash;
  const url = new URL(context.request.url);
  // Empty segment (e.g. /Atlantis-Accords/) → serve the static Accords page.
  if (!hash) return context.next();
  if (!/^[A-Za-z0-9]{4,16}$/.test(hash)) {
    // Malformed hash → land on the Accords page, never the SPA homepage.
    return Response.redirect(url.origin + "/Atlantis-Accords/", 302);
  }
  return Response.redirect(url.origin + "/seal.html#" + hash, 302);
}

/** The 24-hour file link (Worker /api/tmp, KV SIGN_FILES). null when the site has no store — the share sheet then carries the file. */
export interface TempLink { token: string; url: string; expires: string }
export async function putTempFile(bytes: Uint8Array, name: string): Promise<TempLink | null> {
  try {
    // a header value must be ISO-8859-1: a non-ASCII file name ("pagaré.pdf") makes fetch throw — URL-encode it, the Worker decodes (reviewer 2026-09-08)
    const res = await fetch("/api/tmp", { method: "POST", headers: { "Content-Type": "application/pdf", "X-File-Name": encodeURIComponent(name) }, body: bytes as BodyInit });
    const ct = res.headers.get("content-type") || ""; if (!ct.includes("application/json")) return null;
    const d = (await res.json()) as { token?: string; url?: string; expires?: string; configured?: boolean; error?: string };
    if (d.configured === false || !d.token || !d.url) return null;
    return { token: d.token, url: d.url, expires: d.expires ?? "" };
  } catch { return null; }
}
export async function getTempFile(token: string): Promise<{ bytes: Uint8Array; name: string } | null> {
  if (!/^[A-Za-z0-9_-]{22}$/.test(token)) return null;
  try {
    const res = await fetch(`/api/tmp/${token}`); if (!res.ok || !(res.headers.get("content-type") || "").includes("pdf")) return null;
    const cd = res.headers.get("content-disposition") || ""; let name = /filename="([^"]+)"/.exec(cd)?.[1] ?? "document.pdf";
    try { const xf = res.headers.get("x-file-name"); if (xf) name = decodeURIComponent(xf); } catch { /* keep the ASCII name */ }   // the real (accented) name rides X-File-Name both ways
    return { bytes: new Uint8Array(await res.arrayBuffer()), name };
  } catch { return null; }
}

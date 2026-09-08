/** The 24-hour file link (Worker /api/tmp, KV SIGN_FILES). null when the site has no store — the share sheet then carries the file. */
export interface TempLink { token: string; url: string; expires: string }
export async function putTempFile(bytes: Uint8Array, name: string): Promise<TempLink | null> {
  try {
    const res = await fetch("/api/tmp", { method: "POST", headers: { "Content-Type": "application/pdf", "X-File-Name": name }, body: bytes as BodyInit });
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
    const cd = res.headers.get("content-disposition") || ""; const name = /filename="([^"]+)"/.exec(cd)?.[1] ?? "document.pdf";
    return { bytes: new Uint8Array(await res.arrayBuffer()), name };
  } catch { return null; }
}

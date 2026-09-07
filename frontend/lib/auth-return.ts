/**
 * Where to land after an Auth0 login. The guard passes `appState.returnTo`; the provider's
 * redirect callback stashes it; the /callback page reads it once. Only a same-origin path is
 * honoured — anything else (a scheme, a protocol-relative `//host`, an empty value) falls back
 * to the workspace selector, so a crafted login link cannot bounce a user off-site.
 * Pure resolver kept DOM-free so tests/auth-return.test.mjs can prove it.
 */
export const DEFAULT_RETURN = "/workspace/";
const KEY = "exel-auth-return";

export function resolveReturnTo(value: unknown, fallback: string = DEFAULT_RETURN): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (!v.startsWith("/") || v.startsWith("//") || /[\s\\]/.test(v) || v.includes("://")) return fallback;
  return v;
}

export function stashReturnTo(value: unknown): void {
  try {
    const v = resolveReturnTo(value, "");
    if (v) sessionStorage.setItem(KEY, v); else sessionStorage.removeItem(KEY);
  } catch { /* storage unavailable — the fallback lands on the workspace */ }
}

/** Read-once: the stash is cleared so a later, unrelated login never replays an old destination. */
export function takeReturnTo(fallback: string = DEFAULT_RETURN): string {
  try {
    const v = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return resolveReturnTo(v, fallback);
  } catch { return fallback; }
}

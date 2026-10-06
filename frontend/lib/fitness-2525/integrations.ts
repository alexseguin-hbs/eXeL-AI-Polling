/**
 * Fitness-2525 · Strava / Garmin Connect client (Worker /api/fitness-2525/*).
 * Tokens stay on the Worker (encrypted in the FITNESS_STORE KV only); the browser never sees them.
 */
export type ProviderId = "strava" | "garmin";

export interface ProviderStatus {
  configured: boolean;
  connected: boolean;
  pending?: boolean;
  name: string | null;
  last_sync: string | null;
  athlete_id?: string | number | null;
  connected_at?: string | null;
  message?: string;
  apply_url?: string;
  storage?: string;
}

const jsonOf = async (res: Response) =>
  ((res.headers.get("content-type") || "").includes("application/json")
    ? ((await res.json().catch(() => ({}))) as Record<string, unknown>)
    : {}) as Record<string, unknown>;

async function authHeaders(getToken: () => Promise<string | null | undefined>): Promise<HeadersInit> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  try {
    const t = await getToken();
    if (t) headers.authorization = `Bearer ${t}`;
  } catch {
    /* proceed unauthenticated — API returns 401 */
  }
  return headers;
}

function asStatus(d: Record<string, unknown>, fallbackPending = false): ProviderStatus {
  return {
    configured: !!d.configured,
    connected: !!d.connected,
    pending: d.pending != null ? !!d.pending : fallbackPending,
    name: d.name != null ? String(d.name) : null,
    last_sync: d.last_sync != null ? String(d.last_sync) : null,
    athlete_id: (d.athlete_id as string | number | null | undefined) ?? null,
    connected_at: d.connected_at != null ? String(d.connected_at) : null,
    message: d.message != null ? String(d.message) : d.error != null ? String(d.error) : undefined,
    apply_url: d.apply_url != null ? String(d.apply_url) : undefined,
    storage: d.storage != null ? String(d.storage) : undefined,
  };
}

export async function fetchProviderStatus(
  provider: ProviderId,
  getToken: () => Promise<string | null | undefined>,
): Promise<ProviderStatus> {
  try {
    const res = await fetch(`/api/fitness-2525/${provider}/status`, {
      headers: await authHeaders(getToken),
      signal: AbortSignal.timeout(20_000),
    });
    const d = await jsonOf(res);
    if (res.status === 401) {
      return { configured: false, connected: false, pending: provider === "garmin", name: null, last_sync: null, message: "Sign in required" };
    }
    if (!res.ok && !d.configured && d.pending) return asStatus(d, true);
    if (!(res.headers.get("content-type") || "").includes("application/json")) {
      return {
        configured: false,
        connected: false,
        pending: provider === "garmin",
        name: null,
        last_sync: null,
        message: provider === "garmin"
          ? "Garmin pending developer approval — connect Garmin to Strava meanwhile"
          : "API unavailable until Worker deploy",
      };
    }
    return asStatus(d, provider === "garmin" && !d.configured);
  } catch {
    return {
      configured: false,
      connected: false,
      pending: provider === "garmin",
      name: null,
      last_sync: null,
      message: provider === "garmin"
        ? "Garmin pending developer approval — connect Garmin to Strava meanwhile"
        : "API unavailable (local next dev has no Worker)",
    };
  }
}

export async function beginConnect(
  provider: ProviderId,
  getToken: () => Promise<string | null | undefined>,
): Promise<{ url?: string; pending?: boolean; message?: string; apply_url?: string; error?: string }> {
  const res = await fetch(`/api/fitness-2525/${provider}/connect`, {
    method: "POST",
    headers: await authHeaders(getToken),
    signal: AbortSignal.timeout(20_000),
  });
  const d = await jsonOf(res);
  if (d.pending || d.configured === false) {
    return {
      pending: true,
      message: String(d.message || "Pending developer approval"),
      apply_url: d.apply_url != null ? String(d.apply_url) : undefined,
    };
  }
  if (d.error) return { error: String(d.error) };
  if (d.url) return { url: String(d.url) };
  return { error: "No authorize URL returned" };
}

export async function disconnectProvider(
  provider: ProviderId,
  getToken: () => Promise<string | null | undefined>,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/fitness-2525/${provider}/disconnect`, {
    method: "POST",
    headers: await authHeaders(getToken),
    signal: AbortSignal.timeout(20_000),
  });
  const d = await jsonOf(res);
  if (!res.ok) return { ok: false, error: String(d.error || res.status) };
  return { ok: true };
}

export async function syncProvider(
  provider: ProviderId,
  getToken: () => Promise<string | null | undefined>,
): Promise<{ ok: boolean; imported?: number; last_sync?: string; name?: string; error?: string; message?: string }> {
  const path = provider === "strava" ? "sync" : "push";
  const res = await fetch(`/api/fitness-2525/${provider}/${path}`, {
    method: "POST",
    headers: await authHeaders(getToken),
    signal: AbortSignal.timeout(60_000),
  });
  const d = await jsonOf(res);
  if (d.pending) return { ok: false, message: String(d.message || "Pending approval") };
  if (!res.ok || d.error) return { ok: false, error: String(d.error || res.status) };
  return {
    ok: true,
    imported: typeof d.imported === "number" ? d.imported : undefined,
    last_sync: d.last_sync != null ? String(d.last_sync) : undefined,
    name: d.name != null ? String(d.name) : undefined,
    message: d.note != null ? String(d.note) : d.message != null ? String(d.message) : undefined,
  };
}

export function formatSyncTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return iso;
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

/**
 * Honest mock-vs-live status + JSON health probe for the polling API.
 * Distinguishes: build-time mock fold, configured live URL, and a reachable JSON health endpoint.
 * HTTP 200 HTML (SPA fallback) is NOT a healthy API.
 */
import { API_BASE_URL } from "./constants";

export type ApiBuildMode = "mock" | "live-configured";

export type ApiProbeStatus =
  | "mock-folded"
  | "live-ok"
  | "live-unreachable"
  | "live-non-json"
  | "live-bad-shape";

export interface ApiConnectivityReport {
  buildMode: ApiBuildMode;
  mockMode: boolean;
  apiBaseUrl: string;
  probe: ApiProbeStatus;
  httpStatus: number | null;
  contentType: string | null;
  detail: string;
  probedAt: string;
  latencyMs: number | null;
}

/** Same rule as lib/api.ts — mock unless NEXT_PUBLIC_MOCK_MODE is exactly "false". */
export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE !== "false";
}

export function buildMode(): ApiBuildMode {
  return isMockMode() ? "mock" : "live-configured";
}

export function healthUrl(base: string = API_BASE_URL): string {
  const root = String(base || "").replace(/\/+$/, "");
  return `${root}/health`;
}

/** True when Content-Type looks like JSON (not HTML SPA fallback). */
export function looksLikeJsonContentType(ct: string | null | undefined): boolean {
  if (!ct) return false;
  return /application\/json|text\/json|\+json/i.test(ct);
}

/** Accept common FastAPI health shapes without inventing fields. */
export function looksLikeHealthBody(body: unknown): boolean {
  if (body == null || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  if (typeof o.status === "string") return true;
  if (typeof o.ok === "boolean") return true;
  if (o.healthy === true || o.healthy === false) return true;
  // Empty object from a stub is still JSON — caller may treat as ok-ish; we require a signal.
  return false;
}

export async function probeApiConnectivity(opts?: {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
}): Promise<ApiConnectivityReport> {
  const mockMode = isMockMode();
  const apiBaseUrl = opts?.baseUrl ?? API_BASE_URL;
  const probedAt = new Date().toISOString();
  if (mockMode) {
    return {
      buildMode: "mock",
      mockMode: true,
      apiBaseUrl,
      probe: "mock-folded",
      httpStatus: null,
      contentType: null,
      detail: "NEXT_PUBLIC_MOCK_MODE is not false — client uses in-browser mock handlers; live /api/v1 is not called.",
      probedAt,
      latencyMs: null,
    };
  }

  const fetchImpl = opts?.fetchImpl ?? fetch;
  const timeoutMs = opts?.timeoutMs ?? 8000;
  const url = healthUrl(apiBaseUrl);
  const t0 = Date.now();
  try {
    const ctrl = typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? { signal: AbortSignal.timeout(timeoutMs) }
      : {};
    const res = await fetchImpl(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      ...(ctrl as RequestInit),
    });
    const latencyMs = Date.now() - t0;
    const contentType = res.headers.get("content-type");
    if (!looksLikeJsonContentType(contentType)) {
      return {
        buildMode: "live-configured",
        mockMode: false,
        apiBaseUrl,
        probe: "live-non-json",
        httpStatus: res.status,
        contentType,
        detail: `Health responded ${res.status} with non-JSON content-type (${contentType || "none"}) — likely SPA/HTML fallback, not FastAPI.`,
        probedAt,
        latencyMs,
      };
    }
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      return {
        buildMode: "live-configured",
        mockMode: false,
        apiBaseUrl,
        probe: "live-non-json",
        httpStatus: res.status,
        contentType,
        detail: "Content-Type claimed JSON but body failed to parse.",
        probedAt,
        latencyMs,
      };
    }
    if (!res.ok) {
      return {
        buildMode: "live-configured",
        mockMode: false,
        apiBaseUrl,
        probe: "live-unreachable",
        httpStatus: res.status,
        contentType,
        detail: `Health HTTP ${res.status}.`,
        probedAt,
        latencyMs,
      };
    }
    if (!looksLikeHealthBody(body)) {
      return {
        buildMode: "live-configured",
        mockMode: false,
        apiBaseUrl,
        probe: "live-bad-shape",
        httpStatus: res.status,
        contentType,
        detail: "JSON health body lacked status/ok/healthy signal.",
        probedAt,
        latencyMs,
      };
    }
    return {
      buildMode: "live-configured",
      mockMode: false,
      apiBaseUrl,
      probe: "live-ok",
      httpStatus: res.status,
      contentType,
      detail: "JSON health endpoint reachable.",
      probedAt,
      latencyMs,
    };
  } catch (e) {
    return {
      buildMode: "live-configured",
      mockMode: false,
      apiBaseUrl,
      probe: "live-unreachable",
      httpStatus: null,
      contentType: null,
      detail: e instanceof Error ? e.message : String(e),
      probedAt,
      latencyMs: Date.now() - t0,
    };
  }
}

export function connectivityLabel(r: ApiConnectivityReport): string {
  switch (r.probe) {
    case "mock-folded":
      return "self-contained (mock)";
    case "live-ok":
      return "live backend (health ok)";
    case "live-non-json":
      return "live URL misrouted (non-JSON)";
    case "live-bad-shape":
      return "live health shape unexpected";
    case "live-unreachable":
      return "live backend unreachable";
    default:
      return r.probe;
  }
}

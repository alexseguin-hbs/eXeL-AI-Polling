/**
 * Provider fee catalog for Moderator Settings → Cost Estimate.
 *
 * Prefer GET /payments/provider-fees (server catalog). Offline/unavailable
 * shows explicitly labeled local UI_ESTIMATE rows — never silent unknown→$0.
 *
 * STT $/min denominator = billable audio minutes (not session wall-clock).
 * Theme02 uses estimated tokens — do not conflate with Financial-2525 MoT $/min.
 */

export const FEE_CATALOG_VERSION = "2026-04.v1";
export const FEE_CURRENCY = "USD";
export const WEEKLY_REFRESH_DAYS = 7;

export const COST_ASSUMPTIONS = {
  users: 1000,
  responsesPerUser: 1,
  wordsPerResponse: 111,
  typeUsers: 500,
  voiceUsers: 500,
  voiceMinutesPerUser: 0.74, // billable audio minutes
  phaseBOverheadPct: 0.3,
  sttDenominator: "billable_audio_minutes",
  themeUnit: "estimated_tokens_chars_div_4",
} as const;

/** STT USD per billable audio minute — unknown providers omitted (not zero). */
export const STT_RATES: Record<string, { rate: number; model: string; status: "known" }> = {
  whisper: { rate: 0.006, model: "whisper-1", status: "known" },
  gemini: { rate: 0.00016, model: "gemini-flash-audio", status: "known" },
  grok: { rate: 0.006, model: "whisper-large-v3", status: "known" },
  aws: { rate: 0.024, model: "aws-transcribe-batch", status: "known" },
};

/** Theme/summary UI static display (panel heritage) — labeled UI_ESTIMATE_STATIC. */
export const SUMMARY_UI_STATIC: Record<string, number> = {
  openai: 0.33,
  gemini: 0.22,
  grok: 5.25,
  claude: 7.87,
};

export type CostComboRow = {
  summary: string;
  v2t: string;
  summaryLabel: string;
  v2tLabel: string;
  isDefault: boolean;
  summaryUsd: number | null;
  v2tUsd: number | null;
  totalUsd: number | null;
  v2tStatus: "estimated_from_catalog" | "unknown_rate";
  verification: "UI_ESTIMATE";
  source: "server" | "offline_local";
};

export const COST_COMBO_DEFS = [
  { summary: "openai", v2t: "whisper", summaryLabel: "OpenAI", v2tLabel: "Whisper", isDefault: true },
  { summary: "gemini", v2t: "gemini", summaryLabel: "Gemini", v2tLabel: "Gemini", isDefault: false },
  { summary: "gemini", v2t: "whisper", summaryLabel: "Gemini", v2tLabel: "Whisper", isDefault: false },
  { summary: "grok", v2t: "whisper", summaryLabel: "Grok", v2tLabel: "Whisper", isDefault: false },
  { summary: "claude", v2t: "whisper", summaryLabel: "Claude", v2tLabel: "Whisper", isDefault: false },
  { summary: "claude", v2t: "azure", summaryLabel: "Claude", v2tLabel: "Azure", isDefault: false },
  { summary: "claude", v2t: "aws", summaryLabel: "Claude", v2tLabel: "AWS", isDefault: false },
] as const;

export type FeeLoadStatus =
  | "idle"
  | "loading"
  | "server_ok"
  | "unavailable"
  | "offline"
  | "bad_shape";

export type ProviderFeesPayload = {
  catalog_version?: string;
  currency?: string;
  assumptions?: Record<string, unknown>;
  freshness?: {
    checked_at?: string;
    stale?: boolean;
    catalog_version?: string;
    next_refresh_due_at?: string | null;
  };
  combos?: Array<{
    summary_provider?: string;
    v2t_provider?: string;
    label?: string;
    is_default?: boolean;
    summary_usd?: string | null;
    v2t_usd?: string | null;
    total_usd?: string | null;
    v2t_verification?: string;
    invoice_accurate?: boolean;
  }>;
  free_tier?: { corrected?: string };
  invoice_accurate?: boolean;
  pricing_activation_enabled?: boolean;
};

export function buildComboRows(
  checkedAtIso: string = "2026-04-01T00:00:00Z",
  source: "server" | "offline_local" = "offline_local",
): {
  rows: CostComboRow[];
  freshness: { checkedAt: string; stale: boolean; catalogVersion: string };
} {
  const audioMin = COST_ASSUMPTIONS.voiceUsers * COST_ASSUMPTIONS.voiceMinutesPerUser;
  const rows: CostComboRow[] = COST_COMBO_DEFS.map((c) => {
    const summaryUsd = SUMMARY_UI_STATIC[c.summary] ?? null;
    const stt = STT_RATES[c.v2t];
    let v2tUsd: number | null = null;
    let v2tStatus: CostComboRow["v2tStatus"] = "unknown_rate";
    if (stt) {
      v2tUsd = Math.round(stt.rate * audioMin * 100) / 100;
      v2tStatus = "estimated_from_catalog";
    }
    // unknown providers (e.g. azure): leave null — never coerce to 0
    const totalUsd =
      summaryUsd != null && v2tUsd != null ? Math.round((summaryUsd + v2tUsd) * 100) / 100 : null;
    return {
      summary: c.summary,
      v2t: c.v2t,
      summaryLabel: c.summaryLabel,
      v2tLabel: c.v2tLabel,
      isDefault: c.isDefault,
      summaryUsd,
      v2tUsd,
      totalUsd,
      v2tStatus,
      verification: "UI_ESTIMATE",
      source,
    };
  });
  const checked = Date.parse(checkedAtIso);
  const stale = !Number.isFinite(checked) || Date.now() - checked > WEEKLY_REFRESH_DAYS * 864e5;
  return {
    rows,
    freshness: { checkedAt: checkedAtIso, stale, catalogVersion: FEE_CATALOG_VERSION },
  };
}

function parseUsd(v: string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Map server /payments/provider-fees combos → panel rows. Unknown rates stay null. */
export function rowsFromServerPayload(payload: ProviderFeesPayload): {
  rows: CostComboRow[];
  freshness: { checkedAt: string; stale: boolean; catalogVersion: string };
} | null {
  if (!payload || !Array.isArray(payload.combos) || payload.combos.length === 0) return null;
  const checkedAt =
    payload.freshness?.checked_at ||
    (typeof payload.assumptions === "object" ? undefined : undefined) ||
    new Date(0).toISOString();
  const catalogVersion =
    payload.freshness?.catalog_version || payload.catalog_version || FEE_CATALOG_VERSION;
  const stale = Boolean(payload.freshness?.stale);
  const rows: CostComboRow[] = payload.combos.map((c, i) => {
    const def = COST_COMBO_DEFS[i];
    const summary = c.summary_provider || def?.summary || "unknown";
    const v2t = c.v2t_provider || def?.v2t || "unknown";
    const label = c.label || `${summary} + ${v2t}`;
    const parts = label.split("+").map((s) => s.trim());
    const summaryUsd = parseUsd(c.summary_usd ?? null);
    const v2tUsd = parseUsd(c.v2t_usd ?? null);
    const totalUsd = parseUsd(c.total_usd ?? null);
    const v2tStatus: CostComboRow["v2tStatus"] =
      c.v2t_verification === "unknown_rate" || v2tUsd == null ? "unknown_rate" : "estimated_from_catalog";
    return {
      summary,
      v2t,
      summaryLabel: parts[0] || summary,
      v2tLabel: parts[1] || v2t,
      isDefault: Boolean(c.is_default ?? def?.isDefault),
      summaryUsd,
      v2tUsd,
      totalUsd: totalUsd ?? (summaryUsd != null && v2tUsd != null ? summaryUsd + v2tUsd : null),
      v2tStatus,
      verification: "UI_ESTIMATE",
      source: "server",
    };
  });
  return {
    rows,
    freshness: { checkedAt: String(checkedAt), stale, catalogVersion: String(catalogVersion) },
  };
}

export type FeeFetchResult = {
  status: FeeLoadStatus;
  payload: ProviderFeesPayload | null;
  rows: CostComboRow[];
  freshness: { checkedAt: string; stale: boolean; catalogVersion: string };
  invoiceAccurate: boolean;
};

/**
 * Load fee catalog: server first. On failure, retain labeled offline local estimates.
 * Never invent rates for unknown providers (null stays null).
 */
export async function loadFeeCatalogForPanel(opts: {
  fetchImpl?: typeof fetch;
  apiBase?: string;
  mockMode?: boolean;
  signal?: AbortSignal;
}): Promise<FeeFetchResult> {
  const offline = buildComboRows("2026-04-01T00:00:00Z", "offline_local");
  const mockMode = opts.mockMode === true;
  if (mockMode) {
    return {
      status: "offline",
      payload: null,
      rows: offline.rows,
      freshness: offline.freshness,
      invoiceAccurate: false,
    };
  }
  const base = (opts.apiBase || "").replace(/\/$/, "");
  const url = `${base}/payments/provider-fees`;
  const fetchImpl = opts.fetchImpl || fetch;
  try {
    const res = await fetchImpl(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: opts.signal,
    });
    if (!res.ok) {
      return {
        status: "unavailable",
        payload: null,
        rows: offline.rows,
        freshness: offline.freshness,
        invoiceAccurate: false,
      };
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return {
        status: "bad_shape",
        payload: null,
        rows: offline.rows,
        freshness: offline.freshness,
        invoiceAccurate: false,
      };
    }
    const payload = (await res.json()) as ProviderFeesPayload;
    const mapped = rowsFromServerPayload(payload);
    if (!mapped) {
      return {
        status: "bad_shape",
        payload,
        rows: offline.rows,
        freshness: offline.freshness,
        invoiceAccurate: false,
      };
    }
    return {
      status: "server_ok",
      payload,
      rows: mapped.rows,
      freshness: mapped.freshness,
      invoiceAccurate: payload.invoice_accurate === true,
    };
  } catch {
    return {
      status: "offline",
      payload: null,
      rows: offline.rows,
      freshness: offline.freshness,
      invoiceAccurate: false,
    };
  }
}

export const FREE_TIER_CORRECTED =
  "Free tier (≤19 users): participants are not charged a session fee; provider STT/Theme02 costs may still accrue and are tracked on the session ledger.";

/**
 * Provider fee catalog for Moderator Settings → Cost Estimate.
 * Mirrors backend fee_catalog / cost_ledger rates. UI_ESTIMATE only —
 * not invoice-verified. Weekly refresh is server-side; client shows freshness.
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

export function buildComboRows(checkedAtIso: string = "2026-04-01T00:00:00Z"): {
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
    };
  });
  const checked = Date.parse(checkedAtIso);
  const stale = !Number.isFinite(checked) || Date.now() - checked > WEEKLY_REFRESH_DAYS * 864e5;
  return {
    rows,
    freshness: { checkedAt: checkedAtIso, stale, catalogVersion: FEE_CATALOG_VERSION },
  };
}

export const FREE_TIER_CORRECTED =
  "Free tier (≤19 users): participants are not charged a session fee; provider STT/Theme02 costs may still accrue and are tracked on the session ledger.";

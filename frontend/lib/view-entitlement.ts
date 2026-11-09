// What the viewer has actually PAID to see — 333-word summaries and Original text.
// The server decides (GET /sessions/{id}/view-entitlement, backed by Stripe webhook-confirmed payments only);
// the tier picked at poll creation is never proof of payment. Pure helpers (unit-locked in
// tests/view-entitlement.test.mjs); the React hook lives in lib/use-view-entitlement.ts.
import type { ThemedResponse, Theme01Label } from "@/lib/types";

export interface ViewEntitlement {
  viewer: "operator" | "creator" | "participant" | "other" | "anonymous";
  basis: string;
  confirmed_paid_cents: number;
  summary_333: boolean;
  original: boolean;
  thresholds: { summary_333_cents: number; original_cents: number };
}

/** Fail closed: anything unexpected (mock mode, offline, error, odd shape) locks both paid views. */
export const LOCKED: ViewEntitlement = {
  viewer: "anonymous",
  basis: "unavailable",
  confirmed_paid_cents: 0,
  summary_333: false,
  original: false,
  thresholds: { summary_333_cents: 999, original_cents: 1111 },
};

export function normalizeEntitlement(raw: unknown): ViewEntitlement {
  if (!raw || typeof raw !== "object") return LOCKED;
  const r = raw as Record<string, unknown>;
  const th = (r.thresholds && typeof r.thresholds === "object" ? r.thresholds : {}) as Record<string, unknown>;
  return {
    viewer: (typeof r.viewer === "string" ? r.viewer : "anonymous") as ViewEntitlement["viewer"],
    basis: typeof r.basis === "string" ? r.basis : "unavailable",
    confirmed_paid_cents: Number.isFinite(Number(r.confirmed_paid_cents)) ? Number(r.confirmed_paid_cents) : 0,
    summary_333: r.summary_333 === true,
    original: r.original === true,
    thresholds: {
      summary_333_cents: Number(th.summary_333_cents) || 999,
      original_cents: Number(th.original_cents) || 1111,
    },
  };
}

const THEME1_TO_CATEGORY: Record<string, "risk" | "support" | "neutral"> = {
  "Risk & Concerns": "risk",
  "Supporting Comments": "support",
  "Neutral Comments": "neutral",
};

export function categoryForTheme1(label: string | null | undefined): "risk" | "support" | "neutral" | undefined {
  return label ? THEME1_TO_CATEGORY[label] : undefined;
}

export function drilldownPath(sessionId: string, level: 3 | 6 | 9, theme: string, theme1?: string | null, limit = 500): string {
  const q = new URLSearchParams({ level: String(level), theme, limit: String(limit) });
  const cat = categoryForTheme1(theme1);
  if (cat) q.set("category", cat);
  return `/sessions/${encodeURIComponent(sessionId)}/drilldown?${q.toString()}`;
}

interface DrilldownItem {
  id: string;
  participant_ref: string | null;
  theme01: string | null;
  theme01_confidence: number | null;
  theme2_3: string | null;
  theme2_6: string | null;
  theme2_9: string | null;
  confidence: number | null;
  summary_33: string;
  summary_111: string;
  summary_333: string | null;
  original: string | null;
}

const pct = (c: unknown) => {
  const n = Number(c);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n <= 1 ? n * 100 : n);
};

/** Drill-down API rows → the drawer's ThemedResponse shape. Locked tiers arrive as null and stay empty here,
 *  so nothing the server withheld can be shown. */
export function drilldownToThemedResponses(raw: unknown): { items: ThemedResponse[]; entitlement: ViewEntitlement } {
  const body = (raw && typeof raw === "object" ? raw : {}) as { items?: unknown; entitlement?: unknown };
  const rows = Array.isArray(body.items) ? (body.items as DrilldownItem[]) : [];
  const items: ThemedResponse[] = rows.map((r) => ({
    id: String(r.id),
    userHash: r.participant_ref || "anon",
    rawText: typeof r.original === "string" ? r.original : "",
    summary33: r.summary_33 || "",
    summary111: r.summary_111 || "",
    summary333: typeof r.summary_333 === "string" ? r.summary_333 : "",
    theme1: (r.theme01 || "Neutral Comments") as Theme01Label,
    theme1Confidence: pct(r.theme01_confidence),
    theme2_9: r.theme2_9 || "",
    theme2_6: r.theme2_6 || "",
    theme2_3: r.theme2_3 || "",
    theme2Confidence: pct(r.confidence),
  }));
  return { items, entitlement: normalizeEntitlement(body.entitlement) };
}

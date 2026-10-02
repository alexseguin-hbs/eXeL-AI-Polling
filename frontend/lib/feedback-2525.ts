/** Feedback-2525 — pure helpers for the operator's feedback reader (addendum 132). */
import { FEEDBACK_SITES } from "./feedback-screen";

export interface FeedbackRow { id: string; screen: string; category: string; feedback_text: string; device_type: string | null; language_code: string | null; is_resolved: boolean; created_at: string }
const SITE_NAME: Record<string, string> = Object.fromEntries([["landing", "eXeL AI Polling"], ["other", "Other"], ["settings", "Settings"], ...FEEDBACK_SITES.map(([, screen, site]) => [screen, site])]);
export const siteName = (screen: string): string => SITE_NAME[screen] ?? screen;

/** Rows → CSV (RFC 4180 quoting). Pure. */
export function feedbackCsv(rows: readonly FeedbackRow[]): string {
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return ["created_at,site,screen,category,device,language,resolved,feedback", ...rows.map((r) => [r.created_at, siteName(r.screen), r.screen, r.category, r.device_type, r.language_code, r.is_resolved ? "yes" : "no", r.feedback_text].map(q).join(","))].join("\n");
}
/** A refusal in plain words. Pure. */
export function feedbackError(message: string): string {
  if (/key not accepted/i.test(message)) return "Key not accepted.";
  if (/product_feedback_list|does not exist|schema cache|Could not find the function/i.test(message)) return "The feedback reader is waiting for its database update (migration 039).";
  return "Could not reach the feedback repository. Try again.";
}


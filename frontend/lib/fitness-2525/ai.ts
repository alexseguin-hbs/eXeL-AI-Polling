/**
 * Fitness-2525 · coaching feedback via Worker /api/ai (same-origin draft task).
 * Providers: Gemini / OpenAI / Grok / Claude. "auto" = cheapest configured (flash/mini first).
 * Cost figures are per-request estimates for a short coach draft — keys never reach the page.
 */
import { aiDraft, aiStatus, anyAi, type AiProvider } from "@/lib/ai";
import type { FitDay, FitWorkout } from "./types";

export { aiStatus, anyAi };
export type { AiProvider };

/** Per-request USD estimate for one Fitness coach draft (≈ flash/mini class). Aligns with Settings cost ranking. */
export const FIT_COACH_COST_USD: Record<Exclude<AiProvider, "auto">, number> = {
  gemini: 0.0004,
  openai: 0.0008,
  grok: 0.008,
  claude: 0.02,
};

export const FIT_COACH_MODEL: Record<Exclude<AiProvider, "auto">, string> = {
  gemini: "gemini-1.5-flash",
  openai: "gpt-4o-mini",
  grok: "grok-2-latest",
  claude: "claude-opus-5",
};

/** Cheapest → most expensive (same order as Worker auto pick). */
export const FIT_PROVIDER_ORDER: Exclude<AiProvider, "auto">[] = ["gemini", "openai", "grok", "claude"];

export function estimateCoachCostUsd(provider: string | null | undefined): number | null {
  if (!provider || provider === "auto") return null;
  const n = FIT_COACH_COST_USD[provider as Exclude<AiProvider, "auto">];
  return typeof n === "number" ? n : null;
}

export function formatCoachCost(usd: number | null | undefined): string {
  if (usd == null || !Number.isFinite(usd)) return "—";
  if (usd < 0.01) return `~$${usd.toFixed(4)}`;
  return `~$${usd.toFixed(3)}`;
}

export interface FitCoachResult {
  provider: string;
  model: string;
  costUsd: number | null;
  title: string;
  body: string;
}

function workoutLine(w: FitWorkout): string {
  const bits = [w.type, w.title, w.status, w.minutes != null ? `${w.minutes} min` : null,
    w.distance ? `${w.distance.value} ${w.distance.unit}` : null, w.notes].filter(Boolean);
  return bits.join(" · ");
}

/** Build a draft prompt so /api/ai task=draft returns a short coach note in title+body. */
export function coachPrompt(day: FitDay, focus: "workout" | "nutrition" | "both" = "both"): string {
  const workouts = (day.workouts || []).map(workoutLine).join("\n- ") || "(none logged)";
  const metrics = [
    day.steps != null ? `steps=${day.steps}` : "steps=blank",
    day.calories_in != null ? `calories_in=${day.calories_in}` : "calories_in=blank",
    day.calories_out != null ? `calories_out=${day.calories_out}` : "calories_out=blank",
    day.weight?.value != null ? `weight=${day.weight.value}${day.weight.unit}` : "weight=blank",
  ].join(", ");
  return [
    "You are a concise Ironman triathlon coach for Fitness-2525 (Ironman Cozumel; cut ~10 lb by 2026-11-05; vitamin-rich fueling).",
    "Write a SHORT coaching note the athlete can edit and save. Do NOT invent weight or calorie numbers the athlete left blank — say what is missing instead of guessing.",
    `Focus: ${focus}.`,
    `Date: ${day.date}. Metrics: ${metrics}.`,
    `Workouts:\n- ${workouts}`,
    day.deficit_note ? `Deficit note: ${day.deficit_note}` : "",
    "Respond as a 'document' draft: title = one-line headline (≤12 words); body = 3–6 short sentences of coaching (intensity vs fuel, recovery, hydration). signers: one entry role=Coach name=Fitness-2525.",
  ].filter(Boolean).join("\n");
}

export async function requestCoachFeedback(
  day: FitDay,
  focus: "workout" | "nutrition" | "both" = "both",
  provider: AiProvider = "auto",
): Promise<FitCoachResult | null> {
  const out = await aiDraft(coachPrompt(day, focus), "English", provider, [{ role: "Coach", name: "Fitness-2525" }]);
  if (!out?.result) return null;
  const used = String(out.provider || "");
  return {
    provider: used,
    model: String(out.model || FIT_COACH_MODEL[used as Exclude<AiProvider, "auto">] || ""),
    costUsd: estimateCoachCostUsd(used),
    title: String(out.result.title || "Coach note"),
    body: String(out.result.body || "").trim(),
  };
}

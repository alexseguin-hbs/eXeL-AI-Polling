/**
 * Fitness-2525 · coaching feedback via Worker /api/ai (same-origin draft task).
 * Uses existing OpenAI / Grok / Gemini / Claude adapters in ai-core.js — no new backend.
 */
import { aiDraft, aiStatus, anyAi, type AiProvider } from "@/lib/ai";
import type { FitDay, FitWorkout } from "./types";

export { aiStatus, anyAi };

export interface FitCoachResult {
  provider: string;
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
  return {
    provider: out.provider,
    title: String(out.result.title || "Coach note"),
    body: String(out.result.body || "").trim(),
  };
}

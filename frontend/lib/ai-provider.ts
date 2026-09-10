/**
 * Which AI answers, chosen once in Settings and remembered — operator 2026-09-10:
 * "AI summary using API into open AI or others via settings".
 *
 * Before this the choice lived as component-local state on two pages and was forgotten on every reload, so a person who
 * preferred one provider had to say so again each time. The preference is per-device and carries no secret: keys are Worker
 * secrets and never reach the page (§4 · the shield). "auto" keeps the Worker's own order.
 *
 * Vision 2525 §18 governs how the answer is then treated: a machine contributes and is attributed; it never decides.
 * Whatever this returns, the text it produces is labelled as AI-written wherever it is shown.
 */
export type AiProvider = "auto" | "openai" | "gemini" | "grok" | "claude";
export const AI_PROVIDER_KEY = "soi.ai.provider";
const VALID: AiProvider[] = ["auto", "openai", "gemini", "grok", "claude"];
export const isProvider = (v: unknown): v is AiProvider => typeof v === "string" && (VALID as string[]).includes(v);

/** The device's choice, or "auto" when nothing was chosen or storage is unreadable. Never throws. */
export function readProvider(): AiProvider {
  try { const v = localStorage.getItem(AI_PROVIDER_KEY); return isProvider(v) ? v : "auto"; } catch { return "auto"; }
}
/** Remember the choice. Silent on a device that refuses storage — a preference is a convenience, never a gate. */
export function saveProvider(p: AiProvider): void {
  try { if (isProvider(p)) localStorage.setItem(AI_PROVIDER_KEY, p); } catch { /* private window: the session's choice still applies */ }
}
/** How the choice reads to a person. Kept here so Settings and every caller say the same words. */
export const PROVIDER_LABEL: Record<AiProvider, string> = {
  auto: "Automatic — whichever is configured",
  openai: "OpenAI", gemini: "Google Gemini", grok: "xAI Grok", claude: "Anthropic Claude",
};

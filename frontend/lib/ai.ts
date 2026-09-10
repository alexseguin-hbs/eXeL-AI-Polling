/** The AI helpers (Worker /api/ai): placement of a signature box and drafting a document — OpenAI, Gemini or Grok, keys on the Worker. */
export type AiProvider = "auto" | "openai" | "gemini" | "grok" | "claude";
export interface AiConfigured { openai: boolean; gemini: boolean; grok: boolean; claude?: boolean }
export interface AiPlace { x: number; y: number; w: number; h: number; date?: { x: number; y: number; w: number; h: number } | null; confidence: number }
export interface AiDraft { title: string; body: string; signers: { role: string; name: string }[] }
const jsonOf = async (res: Response) => ((res.headers.get("content-type") || "").includes("application/json") ? ((await res.json().catch(() => ({}))) as Record<string, unknown>) : {});
export async function aiStatus(): Promise<AiConfigured> {
  try { const d = await jsonOf(await fetch("/api/ai", { signal: AbortSignal.timeout(20_000) })); const c = (d.configured ?? {}) as Partial<AiConfigured>; return { openai: !!c.openai, gemini: !!c.gemini, grok: !!c.grok, claude: !!c.claude }; } catch { return { openai: false, gemini: false, grok: false, claude: false }; }
}
export const anyAi = (c: AiConfigured) => c.openai || c.gemini || c.grok || !!c.claude;
export async function aiPlace(image: string, signer: string, provider: AiProvider = "auto", hint = ""): Promise<{ provider: string; result: AiPlace | null } | null> {
  const d = await jsonOf(await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: "place", image, signer, hint, provider }), signal: AbortSignal.timeout(45_000) }));
  if (d.configured === false) return null; if (d.error) throw new Error(String(d.error));
  return { provider: String(d.provider ?? ""), result: (d.result as AiPlace | null) ?? null };
}
export async function aiDraft(prompt: string, lang: string, provider: AiProvider = "auto", signers: { role: string; name: string }[] = []): Promise<{ provider: string; result: AiDraft } | null> {
  const d = await jsonOf(await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: "draft", prompt, lang, provider, signers }), signal: AbortSignal.timeout(45_000) }));
  if (d.configured === false) return null; if (d.error) throw new Error(String(d.error));
  return { provider: String(d.provider ?? ""), result: d.result as AiDraft };
}

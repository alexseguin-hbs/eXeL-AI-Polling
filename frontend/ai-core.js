/**
 * ai-core.js — /api/ai — the AI helpers behind Sign Doc and Create Doc (operator 2026-09-08 01:25: "AI APIs for where
 * to place signature and create doc — Gemini, OpenAI, Grok"). Three adapters, one shape:
 *   GET  /api/ai                     → { configured: { openai, gemini, grok } }
 *   POST /api/ai { task: "place", image: <data:image/png…>, signer, hint?, provider? }
 *                                    → { provider, model, result: { x, y, w, h, date?: {x,y,w,h}, confidence } }  (page fractions, top-left origin)
 *   POST /api/ai { task: "draft", prompt, lang?, provider? }
 *                                    → { provider, model, result: { title, body, signers: [{ role, name }] } }
 * Keys are Worker secrets — OPENAI_API_KEY, GEMINI_API_KEY, XAI_API_KEY — never in the page; provider "auto" takes
 * the first configured. Same-origin POST only; without any key {configured:false} and the page keeps its own pixel
 * fit (lib/sign-fit) and templates. Nothing here charges the signer.
 */
const json = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", ...extra } });
const MODELS = {
  openai: { place: "gpt-4o-mini", draft: "gpt-4o-mini" },
  gemini: { place: "gemini-1.5-flash", draft: "gemini-1.5-flash" },
  grok: { place: "grok-2-vision-1212", draft: "grok-2-latest" },
};
export const configured = (env) => ({ openai: !!env.OPENAI_API_KEY, gemini: !!env.GEMINI_API_KEY, grok: !!env.XAI_API_KEY });
const pick = (env, want) => { const c = configured(env); if (want && want !== "auto") return c[want] ? want : null; return ["openai", "gemini", "grok"].find((p) => c[p]) || null; };

const placePrompt = (signer, hint) => `This is one page of a document to be signed. Find where the signer "${signer}" should sign: the signature line or box meant for that person or role${hint ? ` (hint: ${hint})` : ""}. Answer with JSON only: {"x":0..1,"y":0..1,"w":0..1,"h":0..1,"date":{"x":..,"y":..,"w":..,"h":..} or null,"confidence":0..1}. x,y are the top-left corner and w,h the size of a signature box sitting ON that line (bottom edge on the line, no taller than the gap to the text above), all as fractions of the page width and height with the origin at the top-left. "date" is the box for the date line of the same signer if there is one. If the page has no place for this signer, return {"x":null,"confidence":0}.`;
const draftPrompt = (prompt, lang) => `Draft a short, plain document from this request, written in ${lang || "English"}. Answer with JSON only: {"title": string, "body": string, "signers": [{"role": string, "name": string}]}. In "body", separate paragraphs with a blank line and start a heading line with "## ". Name the parties as roles (e.g. Lender, Borrower) and use the names given; leave a name empty when none was given. Do not claim to be legal advice. Request: ${prompt}`;

const b64 = (dataUrl) => String(dataUrl || "").replace(/^data:image\/\w+;base64,/, "");
const parseJson = (text) => { const t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""); const s = t.indexOf("{"), e = t.lastIndexOf("}"); return JSON.parse(s >= 0 ? t.slice(s, e + 1) : t); };
const frac = (v) => (typeof v === "number" && isFinite(v) ? Math.min(1, Math.max(0, v)) : null);

async function call(provider, task, env, { text, image }) {
  const model = MODELS[provider][task];
  if (provider === "gemini") {
    const parts = [{ text }]; if (image) parts.push({ inline_data: { mime_type: "image/png", data: b64(image) } });
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ parts }], generationConfig: { response_mime_type: "application/json", temperature: 0 } }) });
    const d = await r.json(); if (!r.ok) throw new Error(`gemini ${r.status}: ${(d.error && d.error.message) || ""}`);
    return { model, text: d.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "" };
  }
  const url = provider === "openai" ? "https://api.openai.com/v1/chat/completions" : "https://api.x.ai/v1/chat/completions";
  const key = provider === "openai" ? env.OPENAI_API_KEY : env.XAI_API_KEY;
  const content = image ? [{ type: "text", text }, { type: "image_url", image_url: { url: image } }] : text;
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ model, temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "user", content }] }) });
  const d = await r.json(); if (!r.ok) throw new Error(`${provider} ${r.status}: ${(d.error && d.error.message) || ""}`);
  return { model, text: d.choices?.[0]?.message?.content || "" };
}

export async function handleAi(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET") return json({ configured: configured(env) });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const origin = request.headers.get("Origin"); if (!origin || origin !== url.origin) return json({ error: "Origin not allowed" }, 403);
  let body; try { body = await request.json(); } catch { return json({ error: "Bad JSON" }, 400); }
  const provider = pick(env, body.provider); if (!provider) return json({ configured: false, providers: configured(env) }, 200);
  const task = body.task;
  try {
    if (task === "place") {
      const image = String(body.image || ""); if (!/^data:image\/(png|jpeg);base64,/.test(image) || image.length > 6_000_000) return json({ error: "A PNG/JPEG data URL under 4.5 MB is required" }, 400);
      const signer = String(body.signer || "the signer").slice(0, 80), hint = String(body.hint || "").slice(0, 200);
      const { model, text } = await call(provider, "place", env, { text: placePrompt(signer, hint), image });
      const p = parseJson(text);
      const x = frac(p.x), y = frac(p.y), w = frac(p.w), h = frac(p.h);
      if (x === null || y === null || w === null || h === null || w === 0 || h === 0) return json({ provider, model, result: null, reason: "no place found" });
      const date = p.date && frac(p.date.x) !== null ? { x: frac(p.date.x), y: frac(p.date.y), w: frac(p.date.w), h: frac(p.date.h) } : null;
      return json({ provider, model, result: { x, y, w, h, date, confidence: frac(p.confidence) ?? 0.5 } });
    }
    if (task === "draft") {
      const prompt = String(body.prompt || "").slice(0, 4000); if (prompt.trim().length < 8) return json({ error: "Say what the document is about" }, 400);
      const { model, text } = await call(provider, "draft", env, { text: draftPrompt(prompt, String(body.lang || "English").slice(0, 40)) });
      const p = parseJson(text);
      const title = String(p.title || "").slice(0, 160), bodyText = String(p.body || "").slice(0, 20000);
      const signers = Array.isArray(p.signers) ? p.signers.slice(0, 6).map((s) => ({ role: String(s.role || "").slice(0, 40), name: String(s.name || "").slice(0, 80) })) : [];
      if (!title || !bodyText) return json({ error: "The model returned no document" }, 502);
      return json({ provider, model, result: { title, body: bodyText, signers } });
    }
    return json({ error: "Unknown task" }, 400);
  } catch (e) { return json({ error: String(e && e.message || e) }, 502); }
}

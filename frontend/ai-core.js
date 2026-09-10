/**
 * ai-core.js — /api/ai — the AI helpers behind Sign Doc and Create Doc (operator 2026-09-08 01:25: "AI APIs for where
 * to place signature and create doc — Gemini, OpenAI, Grok"). Three adapters, one shape:
 *   GET  /api/ai                     → { configured: { openai, gemini, grok, claude } }
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
  openai: { place: "gpt-4o-mini", draft: "gpt-4o-mini", podsum: "gpt-4o-mini" },
  gemini: { place: "gemini-1.5-flash", draft: "gemini-1.5-flash", podsum: "gemini-1.5-flash" },
  grok: { place: "grok-2-vision-1212", draft: "grok-2-latest", podsum: "grok-2-latest" },
  claude: { place: "claude-opus-5", draft: "claude-opus-5", podsum: "claude-opus-5" },   // Anthropic Messages API (ANTHROPIC_API_KEY); operator 2026-09-09: "Grok, OpenAI, or Claude API"
};
export const configured = (env) => ({ openai: !!env.OPENAI_API_KEY, gemini: !!env.GEMINI_API_KEY, grok: !!env.XAI_API_KEY, claude: !!env.ANTHROPIC_API_KEY });
const pick = (env, want) => { const c = configured(env); if (want && want !== "auto") return c[want] ? want : null; return ["claude", "openai", "gemini", "grok"].find((p) => c[p]) || null; };

const placePrompt = (signer, hint) => `This is one page of a document to be signed. Find where the signer "${signer}" should sign: the signature line or box meant for that person or role${hint ? ` (hint: ${hint})` : ""}. Answer with JSON only: {"x":0..1,"y":0..1,"w":0..1,"h":0..1,"date":{"x":..,"y":..,"w":..,"h":..} or null,"confidence":0..1}. x,y are the top-left corner and w,h the size of a signature box sitting ON that line (bottom edge on the line, no taller than the gap to the text above), all as fractions of the page width and height with the origin at the top-left. "date" is the box for the date line of the same signer if there is one. If the page has no place for this signer, return {"x":null,"confidence":0}.`;
const draftPrompt = (prompt, lang, signers) => `You draft complete, plain-language legal documents for two or more private parties to sign. Write in ${lang || "English"}.
Request: ${prompt}
${signers && signers.length ? `Signers (use these exact names and roles; every one gets a signature line): ${signers.map((x) => (x.role ? `${x.role}: ${x.name}` : x.name)).join("; ")}` : "Signers: name them from the request, one role each."}
Write the WHOLE document, not a summary: a title; a recitals paragraph naming the parties, the date placeholder [DATE] and the purpose; numbered sections with headings covering the obligations of each party, amounts / schedules / durations from the request, conditions and consequences of non-performance, term and termination, amendments (in writing, signed by all), governing law as "[STATE/COUNTRY]" unless the request names one, entire agreement, and a closing sentence that the parties sign below. Keep sentences short and definite. Do not invent facts the request does not give: leave a bracketed placeholder like [AMOUNT] instead. End "body" with a "Signatures" heading followed by one line per signer: "Role: Name ____________________ Date: __________".
Answer with JSON only: {"title": string, "body": string, "signers": [{"role": string, "name": string}]}. In "body", separate paragraphs with a blank line and start a heading line with "## ".`;

/**
 * The pod's close-out summary — Vision 2525 §14: "exactly 333 words in three paragraphs (results, what changed, what is
 * next)". The facts come from the pod and the model may not invent past them. A pod whose work ran LONGER than its locked
 * estimate must be reported honestly, because the paper insists the compression hypothesis is allowed to fail.
 */
const podsumPrompt = (f, lang) => `You write the closing record of a work session called a POD: three or more people who worked together and witnessed each other's time. Write in ${lang || "English"}.
Facts you must use and must NOT contradict or embellish:
${JSON.stringify(f)}
Rules: exactly three paragraphs — (1) results, (2) what changed, (3) what is next. Together EXACTLY 333 words, give or take three. Name the people. State the witnessed time as measured, and say when a claim was reduced to the measured figure. If the work took LONGER than the locked estimate, say so plainly and never present it as a success. Never invent a number that is not in the facts. No headings, no bullets, no preamble.
Answer with JSON only: {"paragraphs": [string, string, string]}.`;

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
  if (provider === "claude") {
    // Anthropic Messages API (raw HTTP, like the three other adapters in this Worker): x-api-key + anthropic-version headers;
    // thinking is adaptive by default on claude-opus-5; the answer is the text blocks; a refusal stop reason is an error, not a document
    const content = image ? [{ type: "image", source: { type: "base64", media_type: "image/png", data: b64(image) } }, { type: "text", text }] : [{ type: "text", text }];
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model, max_tokens: 16000, messages: [{ role: "user", content }] }) });
    const d = await r.json(); if (!r.ok) throw new Error(`claude ${r.status}: ${(d.error && d.error.message) || ""}`);
    if (d.stop_reason === "refusal") throw new Error(`claude declined: ${(d.stop_details && d.stop_details.explanation) || "refusal"}`);
    return { model, text: (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("") };
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
      const want = Array.isArray(body.signers) ? body.signers.slice(0, 6).map((x) => ({ role: String((x && x.role) || "").slice(0, 40), name: String((x && x.name) || "").slice(0, 80) })).filter((x) => x.name) : [];
      const { model, text } = await call(provider, "draft", env, { text: draftPrompt(prompt, String(body.lang || "English").slice(0, 40), want) });
      const p = parseJson(text);
      const title = String(p.title || "").slice(0, 160), bodyText = String(p.body || "").slice(0, 20000);
      const signers = want.length ? want : Array.isArray(p.signers) ? p.signers.slice(0, 6).map((s) => ({ role: String(s.role || "").slice(0, 40), name: String(s.name || "").slice(0, 80) })) : [];   // the names the operator typed win
      if (!title || !bodyText) return json({ error: "The model returned no document" }, 502);
      return json({ provider, model, result: { title, body: bodyText, signers } });
    }
    if (task === "podsum") {
      const facts = body.facts && typeof body.facts === "object" ? body.facts : null;
      if (!facts) return json({ error: "facts required" }, 400);
      const { model, text } = await call(provider, "podsum", env, { text: podsumPrompt(facts, String(body.lang || "English").slice(0, 40)) });
      const p = parseJson(text);
      const paragraphs = Array.isArray(p.paragraphs) ? p.paragraphs.map((x) => String(x || "").trim()).filter(Boolean) : [];
      if (paragraphs.length !== 3) return json({ provider, model, error: "The model did not return three paragraphs" }, 502);
      return json({ provider, model, result: { paragraphs, words: paragraphs.join(" ").split(/\s+/).filter(Boolean).length } });
    }
    return json({ error: "Unknown task" }, 400);
  } catch (e) { return json({ error: String(e && e.message || e) }, 502); }
}

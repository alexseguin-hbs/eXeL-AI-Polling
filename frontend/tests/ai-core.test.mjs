// /api/ai — three providers, one shape (operator 01:25): unconfigured → {configured:false}; each adapter's request and
// response shape; fractions validated; drafts shaped. Run: node tests/ai-core.test.mjs
import { handleAi, configured } from "../ai-core.js";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const SITE = "https://exel.test"; const PNG = "data:image/png;base64,iVBORw0KGgo=";
const req = (body, origin = SITE) => new Request(SITE + "/api/ai", { method: "POST", headers: { "content-type": "application/json", ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(body) });
const J = async (r) => ({ status: r.status, body: await r.json() });
const calls = []; const realFetch = globalThis.fetch;
const mock = (reply) => { globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); const body = typeof reply === "function" ? reply(String(url), init) : reply; return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }); }; };

ok(JSON.stringify(configured({})) === '{"openai":false,"gemini":false,"grok":false,"claude":false}' && configured({ GEMINI_API_KEY: "g" }).gemini === true, "configured() reads the four secrets");
let r = await J(await handleAi(new Request(SITE + "/api/ai"), { XAI_API_KEY: "x" })); ok(r.status === 200 && r.body.configured.grok === true && r.body.configured.openai === false, "GET → which providers are configured");
r = await J(await handleAi(req({ task: "place", image: PNG, signer: "Alex" }), {})); ok(r.status === 200 && r.body.configured === false, "no key → {configured:false}");
r = await J(await handleAi(req({ task: "place", image: PNG, signer: "Alex" }, null), { OPENAI_API_KEY: "k" })); ok(r.status === 403, "no Origin → 403");
r = await J(await handleAi(req({ task: "place", image: "http://evil/x.png", signer: "Alex" }), { OPENAI_API_KEY: "k" })); ok(r.status === 400, "the image must be an inline data URL");

// OpenAI: chat completions with an image part; JSON in choices[0].message.content
mock({ choices: [{ message: { content: '```json\n{"x":0.12,"y":0.52,"w":0.33,"h":0.035,"date":{"x":0.16,"y":0.58,"w":0.18,"h":0.012},"confidence":0.9}\n```' } }] });
r = await J(await handleAi(req({ task: "place", image: PNG, signer: "Alex Seguin", provider: "openai" }), { OPENAI_API_KEY: "sk", GEMINI_API_KEY: "g" }));
const oi = JSON.parse(calls.at(-1).init.body);
ok(r.status === 200 && r.body.provider === "openai" && r.body.model === "gpt-4o-mini" && r.body.result.x === 0.12 && r.body.result.date.w === 0.18 && r.body.result.confidence === 0.9, `openai place → fractions + date (got ${JSON.stringify(r.body).slice(0, 120)})`);
ok(calls.at(-1).url.startsWith("https://api.openai.com/") && calls.at(-1).init.headers.authorization === "Bearer sk" && oi.messages[0].content[1].image_url.url === PNG && /Alex Seguin/.test(oi.messages[0].content[0].text) && oi.response_format.type === "json_object", "openai request: bearer key, text + image parts, json mode");

// Gemini: generateContent with inline_data; text in candidates[0].content.parts
mock({ candidates: [{ content: { parts: [{ text: '{"x":0.5,"y":0.52,"w":0.33,"h":0.035,"date":null,"confidence":0.7}' }] } }] });
r = await J(await handleAi(req({ task: "place", image: PNG, signer: "Daniel Vail", provider: "gemini" }), { GEMINI_API_KEY: "gk" }));
const gi = JSON.parse(calls.at(-1).init.body);
ok(r.status === 200 && r.body.provider === "gemini" && r.body.model === "gemini-1.5-flash" && r.body.result.x === 0.5 && r.body.result.date === null, "gemini place → fractions, no date");
ok(/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-1\.5-flash:generateContent\?key=gk$/.test(calls.at(-1).url) && gi.contents[0].parts[1].inline_data.data === "iVBORw0KGgo=" && gi.generationConfig.response_mime_type === "application/json", "gemini request: key in the URL, inline_data, JSON mime");

// Grok (xAI): OpenAI-compatible endpoint, vision model for placement, text model for drafts
mock({ choices: [{ message: { content: '{"x":null,"confidence":0}' } }] });
r = await J(await handleAi(req({ task: "place", image: PNG, signer: "Nobody", provider: "grok" }), { XAI_API_KEY: "xk" }));
ok(r.status === 200 && r.body.provider === "grok" && r.body.model === "grok-2-vision-1212" && r.body.result === null && r.body.reason, "grok place → no place found → result null with a reason");
ok(calls.at(-1).url === "https://api.x.ai/v1/chat/completions" && calls.at(-1).init.headers.authorization === "Bearer xk", "grok request: x.ai endpoint, bearer key");
mock({ choices: [{ message: { content: '{"title":"Pagaré","body":"## Acuerdo\\n\\nDanny paga a Alex $320 al mes.","signers":[{"role":"Prestamista","name":"Alex Seguin"},{"role":"Prestatario","name":"Daniel Vail"}]}' } }] });
r = await J(await handleAi(req({ task: "draft", prompt: "A promissory note: Danny pays Alex $320 a month for 42 months", lang: "Spanish", provider: "grok" }), { XAI_API_KEY: "xk" }));
const di = JSON.parse(calls.at(-1).init.body);
ok(r.status === 200 && r.body.model === "grok-2-latest" && r.body.result.title === "Pagaré" && r.body.result.signers.length === 2 && /Spanish/.test(di.messages[0].content), "grok draft → title, body, signers; the language rides in the prompt");

// auto picks the first configured; out-of-range fractions are clamped; a bad model reply is a 502, not a crash
mock({ choices: [{ message: { content: '{"x":1.4,"y":-0.2,"w":0.3,"h":0.03,"confidence":2}' } }] });
r = await J(await handleAi(req({ task: "place", image: PNG, signer: "A" }), { XAI_API_KEY: "x", OPENAI_API_KEY: "o" })); ok(r.body.provider === "openai" && r.body.result.x === 1 && r.body.result.y === 0 && r.body.result.confidence === 1, "auto → openai first; fractions clamped to 0..1");
mock({ choices: [{ message: { content: "sorry, no" } }] });
r = await J(await handleAi(req({ task: "draft", prompt: "a lease for a bike, monthly" }), { OPENAI_API_KEY: "o" })); ok(r.status === 502, "an unparsable reply → 502 with the error text");
r = await J(await handleAi(req({ task: "draft", prompt: "hi" }), { OPENAI_API_KEY: "o" })); ok(r.status === 400, "a draft needs a real request (≥ 8 chars)");
globalThis.fetch = realFetch;

// Claude (Anthropic Messages API): x-api-key + anthropic-version headers, claude-opus-5, text blocks read back; a refusal is an error;
// Claude is first in the auto order; the typed names ride into the prompt and win over the model's own list (operator 2026-09-09)
{ calls.length = 0;
  mock({ id: "msg_1", stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ title: "Study Agreement", body: "## Recitals\n\nAlex Seguin (Parent) and Lucas Seguin (Child) agree...\n\n## Signatures\n\nParent: Alex Seguin ____ Date: ____", signers: [{ role: "Parent", name: "Model Guess" }] }) }] });
  const d = await J(await handleAi(req({ task: "draft", prompt: "A child and a parent agree the child studies 60 minutes a day", signers: [{ role: "Parent", name: "Alex Seguin" }, { role: "Child", name: "Lucas Seguin" }] }), { ANTHROPIC_API_KEY: "sk-ant-x", OPENAI_API_KEY: "k" }));
  const c = calls[0]; const sent = JSON.parse(c.init.body);
  ok(d.status === 200 && d.body.provider === "claude" && d.body.model === "claude-opus-5", `auto picks Claude first and names the model (${d.body.provider} ${d.body.model})`);
  ok(c.url === "https://api.anthropic.com/v1/messages" && c.init.headers["x-api-key"] === "sk-ant-x" && c.init.headers["anthropic-version"] === "2023-06-01" && sent.model === "claude-opus-5" && sent.max_tokens >= 4000 && sent.messages[0].role === "user", "the Messages API request has the right endpoint, headers, model and shape");
  const promptText = sent.messages[0].content[0].text;
  ok(/Parent: Alex Seguin; Child: Lucas Seguin/.test(promptText) && /WHOLE document/.test(promptText) && /Signatures/.test(promptText) && /governing law/i.test(promptText), "the draft prompt asks for a complete legal document and carries the typed names and roles");
  ok(d.body.result.title === "Study Agreement" && /## Recitals/.test(d.body.result.body) && d.body.result.signers.length === 2 && d.body.result.signers[0].name === "Alex Seguin", "the typed names win over the model's own signer list");
  mock({ id: "msg_2", stop_reason: "refusal", stop_details: { type: "refusal", category: null, explanation: "declined" }, content: [] });
  const rf = await J(await handleAi(req({ task: "draft", prompt: "A child and a parent agree the child studies 60 minutes a day", provider: "claude" }), { ANTHROPIC_API_KEY: "sk-ant-x" }));
  ok(rf.status === 502 && /declined/.test(rf.body.error), "a refusal stop reason is reported, never passed off as a document");
  ok(JSON.stringify(configured({ ANTHROPIC_API_KEY: "a" })) === '{"openai":false,"gemini":false,"grok":false,"claude":true}', "configured() reads the Anthropic key");
}

console.log(`ai-core: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);

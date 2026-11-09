/**
 * exel-ai-polling-api — fronts the FastAPI backend running in a Cloudflare Container.
 * One named instance ("api-v1") because cube5 background pipelines are in-process; state lives in Supabase.
 * The container boots python:3.12-slim, pulls this Worker's own backend bundle (BUNDLE_TOKEN-gated), installs
 * backend/requirements-api.txt with uv, and serves uvicorn on :8000. Secrets reach it only as process env.
 */
import { DurableObject } from "cloudflare:workers";

const PORT = 8000;
const KEEP_WARM_MS = 30 * 60 * 1000; // stay up 30 min after the last request (cold boot ≈ 30–60 s)
const APP_ENV_KEYS = [
  "ENVIRONMENT", "AUTH0_DOMAIN", "AUTH0_API_AUDIENCE", "DEFAULT_AI_PROVIDER", "FRONTEND_URL", "ALLOWED_ORIGINS",
  "BACKEND_URL", "BEHIND_CLOUDFLARE", "LOG_LEVEL", "DATABASE_URL", "GEMINI_API_KEY", "OPENAI_API_KEY", "XAI_API_KEY",
  "SESSION_SECRET", "ENCRYPTION_KEY", "SUPABASE_URL", "SUPABASE_KEY", "CLOUDFLARE_TURNSTILE_SECRET",
];

const BOOT = [
  "mkdir -p /tmp/diag/api/v1",
  "boot() {",
  '  python -c "import os,io,tarfile,urllib.request as u; r=u.Request(os.environ[\'BUNDLE_URL\'], headers={\'x-bundle-token\': os.environ[\'BUNDLE_TOKEN\'], \'user-agent\': \'exel-api-boot/1.0\'}); tarfile.open(fileobj=io.BytesIO(u.urlopen(r, timeout=60).read())).extractall(\'/srv\')" &&',
  "  pip install -q --no-cache-dir --root-user-action=ignore uv &&",
  "  uv pip install --system -q -r /srv/backend/requirements-api.txt",
  "}",
  "if ! boot > /tmp/diag/api/v1/bootlog 2>&1; then echo BOOT_FAILED >> /tmp/diag/api/v1/bootlog; cat /tmp/diag/api/v1/bootlog; exec python -m http.server 8000 -d /tmp/diag; fi",
  "unset BUNDLE_TOKEN",
  "cd /srv/backend",
  "(cd /tmp/diag && python -m http.server 8001 --bind 0.0.0.0 >/dev/null 2>&1 &) ",
  "uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips '*' --timeout-keep-alive 75 >> /tmp/diag/api/v1/bootlog 2>&1 || true",
  "echo APP_EXITED >> /tmp/diag/api/v1/bootlog; tail -n 60 /tmp/diag/api/v1/bootlog | sed -E 's#(postgres(ql)?(\\+asyncpg)?://)[^@ ]*@#\\1***@#g' > /tmp/diag/api/v1/bootlog.tail; mv /tmp/diag/api/v1/bootlog.tail /tmp/diag/api/v1/bootlog",
  "exec python -m http.server 8000 -d /tmp/diag",
].join("\n");

function appEnv(env) {
  const out = {};
  for (const k of APP_ENV_KEYS) if (env[k]) out[k] = String(env[k]);
  // A Stripe key without its webhook secret makes the app refuse to boot (config.startup_config_errors), so the key
  // is forwarded only once STRIPE_WEBHOOK_SECRET exists too.
  if (env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET) {
    out.STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
    out.STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;
  }
  out.BUNDLE_URL = `${env.BACKEND_URL}/__bundle/backend.tar.gz`;
  out.BUNDLE_TOKEN = env.BUNDLE_TOKEN;
  out.PYTHONUNBUFFERED = "1";
  return out;
}

export class ExelApi extends DurableObject {
  async fetch(request) {
    const c = this.ctx.container;
    // Proof instance (token-gated by the Worker): same image/DB/keys, ENVIRONMENT=test so the API's dev moderator
    // can drive an isolated end-to-end proof session without an Auth0 login. Never reachable without PROOF_TOKEN.
    const proof = request.headers.get("x-exel-proof-mode") === "1";
    if (new URL(request.url).pathname === "/__admin/log") {
      if (!c.running) return Response.json({ running: false });
      const r = await c.getTcpPort(8001).fetch("http://container/api/v1/bootlog");
      const t = (await r.text()).replace(/(postgres(ql)?(\+asyncpg)?:\/\/)[^@\s]*@/g, "$1***@").replace(/(sk-|AIza|xai-)[A-Za-z0-9_\-]{8,}/g, "$1***");
      return new Response(t.slice(-60000), { headers: { "content-type": "text/plain" } });
    }
    if (new URL(request.url).pathname === "/__admin/restart") {
      if (c.running) await c.destroy("admin restart");
      return Response.json({ restarted: true });
    }
    if (!c.running) {
      const e = appEnv(this.env);
      if (proof) { e.ENVIRONMENT = "test"; delete e.AUTH0_DOMAIN; }
      c.start({ entrypoint: ["sh", "-c", BOOT], env: e, enableInternet: true });
      c.monitor().catch((e) => console.error("container exited", String(e)));
    }
    await this.ctx.storage.put("lastSeen", Date.now());
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + 60_000);
    const deadline = Date.now() + 150_000;
    let last = "";
    while (Date.now() < deadline) {
      try {
        return await c.getTcpPort(PORT).fetch(request.url.replace(/^https?:\/\/[^/]+/, "http://container"), request.clone());
      } catch (e) {
        last = String(e);
        if (!c.running) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    return Response.json({ detail: "API is starting or unavailable", reason: last.slice(0, 200) }, { status: 503, headers: { "retry-after": "20" } });
  }

  async alarm() {
    const lastSeen = (await this.ctx.storage.get("lastSeen")) || 0;
    if (Date.now() - lastSeen < KEEP_WARM_MS && this.ctx.container.running) await this.ctx.storage.setAlarm(Date.now() + 60_000);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/__bundle/backend.tar.gz") {
      if (!env.BUNDLE_TOKEN || request.headers.get("x-bundle-token") !== env.BUNDLE_TOKEN) return new Response("not found", { status: 404 });
      return env.BUNDLE.fetch(new Request(new URL("/backend.tar.gz", url), { method: "GET" }));
    }
    if (url.pathname === "/__admin/restart" || url.pathname === "/__admin/log") {
      if (request.method !== "POST" || !env.BUNDLE_TOKEN || request.headers.get("x-admin-token") !== env.BUNDLE_TOKEN) return new Response("not found", { status: 404 });
      const name = request.headers.get("x-target") === "proof" ? `${env.API_INSTANCE || "api-v1"}-proof` : env.API_INSTANCE || "api-v1";
      return env.API.getByName(name).fetch(request);
    }
    if (url.pathname === "/" ) return Response.json({ service: "exel-ai-polling-api", health: "/api/v1/health" });
    if (!url.pathname.startsWith("/api/v1/") && url.pathname !== "/api/v1") return new Response("not found", { status: 404 });
    const headers = new Headers(request.headers);
    headers.delete("x-exel-proof-mode");
    const proofTok = headers.get("x-exel-proof-token");
    headers.delete("x-exel-proof-token");
    if (proofTok && env.PROOF_TOKEN && proofTok === env.PROOF_TOKEN) {
      headers.set("x-exel-proof-mode", "1");
      return env.API.getByName(`${env.API_INSTANCE || "api-v1"}-proof`).fetch(new Request(request, { headers }));
    }
    return env.API.getByName(env.API_INSTANCE || "api-v1").fetch(new Request(request, { headers }));
  },
};

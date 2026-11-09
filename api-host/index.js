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
  "SESSION_SECRET", "ENCRYPTION_KEY", "SUPABASE_URL", "CLOUDFLARE_TURNSTILE_SECRET",
];

const BOOT = [
  "set -e",
  'python -c "import os,io,tarfile,urllib.request as u; r=u.Request(os.environ[\'BUNDLE_URL\'], headers={\'x-bundle-token\': os.environ[\'BUNDLE_TOKEN\']}); tarfile.open(fileobj=io.BytesIO(u.urlopen(r, timeout=60).read())).extractall(\'/srv\')"',
  "unset BUNDLE_TOKEN",
  "pip install -q --no-cache-dir --root-user-action=ignore uv",
  "uv pip install --system -q -r /srv/backend/requirements-api.txt",
  "cd /srv/backend",
  "exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips '*' --timeout-keep-alive 75",
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
    if (!c.running) {
      c.start({ entrypoint: ["sh", "-c", BOOT], env: appEnv(this.env), enableInternet: true });
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
    if (url.pathname === "/" ) return Response.json({ service: "exel-ai-polling-api", health: "/api/v1/health" });
    if (!url.pathname.startsWith("/api/v1/") && url.pathname !== "/api/v1") return new Response("not found", { status: 404 });
    return env.API.getByName("api-v1").fetch(request);
  },
};

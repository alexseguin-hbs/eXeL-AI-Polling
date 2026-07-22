# eXeL AI — Site Hardening, Kill-Switch & Attack Alerting

Owner alert address: **explore@eXeL-AI.com** · Owner phone (SMS control): **512.808.8745**

This document describes the platform's defensive-security posture: a real-time
attack-alerting pipeline, an edge-enforced **pause kill-switch** (everything down
except the home page), and an **SMS-verified** control flow. It is split into
**what is live in the repo now** and **what you must provision** (SMS, email, KV,
WAF) — with exact steps. Nothing here weakens the site; every switch defaults OFF
and fails OPEN.

---

## 0. THREAT LEVEL — "Attack Likely → Imminent → In Progress"

`backend/app/core/threat_level.py` (pure, tested — `assess_threat(signals)`) reads a
window of security telemetry and reports one escalating level, the reasons, the
OpenAI-style **"actions we are taking now"**, and two decisions the platform acts on
(`should_alert`, `should_pause`). This is the readout you asked for.

| Level | Means | Example signals | Alert? | Pause? |
|---|---|---|:--:|:--:|
| **Nominal** | quiet | — | — | — |
| **Attack Likely** | reconnaissance / probing | elevated 401/403 bursts, rate-limit breaches, a few blocked payloads | no (monitor) | no |
| **Attack Imminent** | active exploitation attempts | exploit signatures firing (SQLi/XSS/traversal), credential-stuffing across ≥3 IPs, admin-endpoint probing | **yes → explore@eXeL-AI.com** | no |
| **Attack In Progress** | compromise indicators | served-asset integrity fail, unverified-origin state change, RLS-deny spike, exfil-sized response | **yes** | **YES → kill-switch** |

Design: **conservative + monotonic** — any single hard compromise indicator forces
"In Progress" regardless of the softer counts, and only "In Progress" trips the pause.
Thresholds live at the top of the module and are tunable. 13 unit tests
(`tests/core/test_threat_level.py`) lock each tier + the escalation.

**How it connects:** the app anomaly monitor (Phase 2) feeds live `SecuritySignals`
into `assess_threat` every window → on `should_alert` it emails the alert dashboard
(§2b) → on `should_pause` it trips the KV kill-switch (§1). Until the monitor is wired,
run it on-demand against Cloudflare/Supabase logs.

**Edge prevention (LIVE):** `frontend/worker.js` also *denies* unambiguous attack
signatures in the request PATH (traversal `../`, dotfiles `/.env` `/.git/`, scanner
probes `/wp-admin`, `<script`, `union select`, null bytes) with a 403 before they ever
reach the app — the "prevent it from occurring" first layer, fail-open by construction.

---

## 1. PAUSE KILL-SWITCH — LIVE NOW (edge-enforced)

**What it does.** When paused, every route **except** the home page
(`/`, `/main`, `/main/*`) and static assets is served `paused.html` with HTTP
**503**. The homepage stays up. Implemented in `frontend/worker.js` (`isPaused`);
the page is `frontend/public/paused.html`.

**It cannot take the site down by accident.** The check is wrapped in try/catch
and **fails OPEN** — a missing binding or any runtime error leaves the site fully
live. Default state (no KV key, no env var) = **not paused**.

### Two ways to flip it

| Switch | Speed | How |
|---|---|---|
| **KV** `SITE_STATE` key `paused` | **instant, no deploy** | `wrangler kv key put --binding=SITE_STATE paused 1` |
| **env var** `SITE_PAUSED` | next deploy | set in Cloudflare dashboard → Worker → Settings → Variables, or `wrangler.jsonc` `vars` |

**Resume:** set the value to `0`, or `wrangler kv key delete --binding=SITE_STATE paused`.

### One-time KV setup (recommended — enables instant pause)
1. `wrangler kv namespace create SITE_STATE` → copy the returned `id`.
2. In `frontend/wrangler.jsonc`, add:
   ```jsonc
   "kv_namespaces": [{ "binding": "SITE_STATE", "id": "<paste-id>" }]
   ```
3. `cd frontend && npm run build && npx wrangler deploy`.
Now pausing/resuming is a single `wrangler kv key put/delete` — no rebuild.

> Home-page scope: today "home" = `/` **and** `/main*`. If you want ONLY `/main`
> reachable (root `/` also paused), tell me and I'll tighten `isHome`.

---

## 2. REAL-TIME ATTACK ALERTING → single-page HTML emailed to explore@eXeL-AI.com

**Recommended first line = Cloudflare WAF (native, no code).** It detects and
blocks the common attacks (SQLi, XSS, path-traversal, bot floods, credential
stuffing) at the edge before they reach the app, and can **notify** on trigger.

### 2a. Turn on the native detection + email (5 minutes, dashboard)
1. Cloudflare dashboard → your zone/worker → **Security → WAF** → enable
   **Managed Rules** (OWASP core) and **Rate Limiting** rules.
2. **Security → Events** → **Notifications** → create an alert →
   deliver to **explore@eXeL-AI.com** on "Security Events spike" /
   "Rate limit triggered". Cloudflare emails you in real time.

### 2b. App-level anomaly monitor → custom HTML alert email (needs an email sender)
For compromise signals the WAF can't see (auth-failure bursts, admin-endpoint
probing, moderator-token misuse), the worker/backend composes the alert email.
Because Workers dropped free MailChannels, pick ONE sender and add its API key:
- **Resend** (`resend.com`) — simplest for Workers; `RESEND_API_KEY`.
- **SendGrid** — `SENDGRID_API_KEY`.
- **Cloudflare Email Routing** (send via a Worker binding).

The alert body is a **self-contained single-page HTML dashboard** — see the
canonical format at `docs/security-alert-template.html`: severity banner, the
triggering signals table (type · source IP · path · count · first/last seen), the
current SITE STATE, and one-tap **Pause** / **View events** links back to the
control page. No external assets (email-client safe).

**Signals the monitor watches (thresholds are tunable):**
`≥N 401/403 from one IP in 60s` · `admin/moderator endpoint probing` ·
`rate-limit breaches` · `unexpected origin on state-changing requests` ·
`integrity mismatch on a served asset` · `Supabase RLS deny spike`.

---

## 3. SMS-VERIFIED PAUSE CONTROL (6-digit alphanumeric to 512.808.8745)

The control page (`security-control.html`, Phase 2 below) never pauses on a click
alone. Flow:
1. Operator taps **Pause** → server generates a **6-char alphanumeric** code,
   stores its hash + a 5-minute TTL, and **texts it to 512.808.8745**.
2. Operator enters the code → server verifies (hash + TTL + attempt-limit) →
   only then sets the KV `paused` flag. Resume uses the same verified flow.

**Provision (one-time):** an SMS provider for the text to 512.808.8745 —
**Twilio** (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`) is the usual
choice. Keys are **env-only**, never in the repo. The verify endpoint is
rate-limited, single-use, and audit-logged.

---

## 4. WHAT'S IN THE REPO NOW vs WHAT YOU PROVISION

| Piece | State | Your action |
|---|---|---|
| Edge kill-switch (`worker.js` + `paused.html`) | **LIVE** | (optional) bind KV `SITE_STATE` for instant toggle |
| Fail-open safety on the pause check | **LIVE** | — |
| Alert-email HTML dashboard format (`security-alert-template.html`) | **LIVE (template)** | wire a sender (Resend/SendGrid) |
| WAF + native email notifications | **config** | enable in Cloudflare dashboard (§2a) |
| App anomaly monitor → alert email | **Phase 2** | provide email API key; I wire the monitor |
| SMS 6-digit control + `security-control.html` | **Phase 2** | provide Twilio keys; I build the control page + verify endpoint |

## 5. HARDENING CHECKLIST (baseline already in the codebase)
- [x] Security headers / CSP — `core/middleware.py` (`X-Frame-Options`, `Permissions-Policy`)
- [x] Rate limiting — `core/rate_limit.py` (per-endpoint)
- [x] Auth0 JWT + RBAC — `core/auth.py`
- [x] PII detection/anonymization; RLS on Supabase tables
- [x] Secrets env-only; `.env.example` only; `.gitignore` covers `.env`
- [ ] Cloudflare WAF managed rules + rate-limit rules (§2a) — **enable**
- [ ] KV `SITE_STATE` bound for instant pause (§1) — **provision**
- [ ] Email sender for custom alerts (§2b) — **provision**
- [ ] Twilio for SMS-verified control (§3) — **provision**

---

### TL;DR
The **kill-switch is live** — flip one KV key (or env var) and everything but the
home page returns the paused page, with a safety design that can never take the
site down. **Turn on Cloudflare WAF + email notifications today** for real-time
attack alerts (§2a). When you drop in a **Twilio** key and an **email** key, I'll
finish the **SMS-verified control page** and the **custom HTML attack-alert email**
to explore@eXeL-AI.com.

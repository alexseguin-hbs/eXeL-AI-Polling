# Auth0 go-live steps (eXeL AI Polling)

**Owner of these steps: YOU (Auth0 dashboard).**  
Our-side wiring is prepared so that after you finish this checklist, mock mode can be turned off safely.

**Do not flip `NEXT_PUBLIC_MOCK_MODE=false` until every checkbox below is done.**  
Probed 2026-11-09 ~07:25 America/Chicago: Auth0 tenant `exel-ai-polling.us.auth0.com` is up (JWKS + OIDC OK), but **neither** candidate API Identifier exists yet (`Service not found` for both).

---

## Canonical values (must match exactly)

| Item | Value |
|------|--------|
| Tenant / Domain | `exel-ai-polling.us.auth0.com` |
| SPA Application Client ID | `H8wuT6P2nfm87bvbRjaegoOliLyhPw4K` (already defaulted in `frontend/lib/constants.ts`) |
| **API Identifier (Audience)** | `https://api.exel-ai-polling` |
| Role claim namespace | `https://exel-polling.com` |
| Role claim name (full) | `https://exel-polling.com/role` |
| Allowed roles | `moderator` · `user` · `lead_developer` · `admin` |
| Frontend callback | `https://exel-ai-polling.explore-096.workers.dev/callback/` |
| Frontend logout return | `https://exel-ai-polling.explore-096.workers.dev/` |
| Frontend origin (CORS / Allowed Web Origins) | `https://exel-ai-polling.explore-096.workers.dev` |
| API host (backend) | `https://exel-ai-polling-api.explore-096.workers.dev` |

Backend JWT validation: `backend/app/core/auth.py` reads `aud` = `AUTH0_API_AUDIENCE` and role = `payload["https://exel-polling.com/role"]` (default `"user"` if missing).

---

## Step 1 — Create the Auth0 API (Audience)

1. Open [Auth0 Dashboard](https://manage.auth0.com/) → tenant **exel-ai-polling**.
2. **Applications → APIs → Create API**.
3. Name: `eXeL AI Polling API`.
4. **Identifier**: `https://api.exel-ai-polling`  
   - Copy exactly. No trailing slash. This string is the audience.
5. Signing Algorithm: **RS256**.
6. Create.
7. On the API → **Settings**:
   - Allow Skipping User Consent: ON (first-party SPA).
   - Token Expiration: leave default (or 86400).
8. On the API → **Permissions** (RBAC scopes — optional but recommended):
   - `create:sessions`
   - `manage:sessions`
9. On the API → **Settings** → enable **RBAC** and **Add Permissions in the Access Token** if you use Auth0 RBAC permissions (backend also reads `permissions[]`).

**Verify:** In a private window open  
`https://exel-ai-polling.us.auth0.com/authorize?client_id=H8wuT6P2nfm87bvbRjaegoOliLyhPw4K&response_type=code&redirect_uri=https%3A%2F%2Fexel-ai-polling.explore-096.workers.dev%2Fcallback%2F&scope=openid%20profile%20email&audience=https%3A%2F%2Fapi.exel-ai-polling&state=check`  
You should get a **Login** page, **not** `Service not found: https://api.exel-ai-polling`.

---

## Step 2 — SPA Application settings

1. **Applications → Applications** → open the SPA whose Client ID is `H8wuT6P2nfm87bvbRjaegoOliLyhPw4K` (or create a SPA and replace the Client ID in GitHub/Cloudflare build secrets).
2. Application Type: **Single Page Application**.
3. **Settings → Application URIs**
   - Allowed Callback URLs:  
     `https://exel-ai-polling.explore-096.workers.dev/callback/`  
     (add `http://localhost:3000/callback/` for local).
   - Allowed Logout URLs:  
     `https://exel-ai-polling.explore-096.workers.dev/`  
     (add `http://localhost:3000/`).
   - Allowed Web Origins:  
     `https://exel-ai-polling.explore-096.workers.dev`  
     (add `http://localhost:3000`).
   - Allowed Origins (CORS): same as Web Origins.
4. Save.
5. Under **APIs** (or Authorized APIs): authorize this SPA for **eXeL AI Polling API**.

---

## Step 3 — Role claim Action (Post-Login)

Backend expects a custom claim:

```text
https://exel-polling.com/role   →   "moderator" | "user" | "lead_developer" | "admin"
```

Without this claim every token is treated as role `user`, and session create / moderator checkout will 403.

### 3a. Create roles (Authorization Core)

1. **User Management → Roles** → create:
   - `moderator`
   - `user`
   - `lead_developer`
   - `admin`
2. Assign **moderator** (and/or **admin**) to your own user for launch testing.

### 3b. Post-Login Action

1. **Actions → Library → Build Custom → Create Action**
   - Name: `eXeL Polling role claim`
   - Trigger: **Login / Post Login**
2. Paste:

```javascript
/**
 * Adds https://exel-polling.com/role for eXeL AI Polling RBAC.
 * Assign Auth0 Roles named exactly: moderator | user | lead_developer | admin
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://exel-polling.com";
  const assigned = (event.authorization && event.authorization.roles) || [];
  const priority = ["admin", "lead_developer", "moderator", "user"];
  const role = priority.find((r) => assigned.includes(r)) || "user";
  api.idToken.setCustomClaim(`${namespace}/role`, role);
  api.accessToken.setCustomClaim(`${namespace}/role`, role);
  if (event.user.email) {
    api.idToken.setCustomClaim(`${namespace}/email`, event.user.email);
    api.accessToken.setCustomClaim(`${namespace}/email`, event.user.email);
  }
};
```

3. Deploy the Action.
4. **Actions → Flows → Login** → drag `eXeL Polling role claim` into the flow → Apply.

### 3c. Confirm claim

Log in once, decode the access token at jwt.io (paste only on your machine). You must see:

```json
"aud": "https://api.exel-ai-polling",
"https://exel-polling.com/role": "moderator"
```

---

## Step 4 — Tell us / set build secrets (after Steps 1–3)

Set these as **GitHub Actions secrets** (and Cloudflare Workers Builds env if that path ships the frontend):

| Secret / var | Value |
|--------------|--------|
| `NEXT_PUBLIC_AUTH0_DOMAIN` | `exel-ai-polling.us.auth0.com` |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | SPA Client ID |
| `NEXT_PUBLIC_AUTH0_AUDIENCE` | `https://api.exel-ai-polling` |
| `NEXT_PUBLIC_API_URL` | `https://exel-ai-polling-api.explore-096.workers.dev/api/v1` |
| `NEXT_PUBLIC_MOCK_MODE` | `false`  ← **only after Steps 1–3 verified** |

API Worker already has `AUTH0_DOMAIN` in `api-host/wrangler.jsonc`. After merge of the prep PR, it also has `AUTH0_API_AUDIENCE=https://api.exel-ai-polling`. Redeploy API host once so the container sees the audience.

Then rebuild/redeploy the frontend. Confirm in DevTools that API calls hit `exel-ai-polling-api…` (not mock) and that create-session succeeds with a real Bearer token.

---

## What blocks mock-off today (2026-11-09)

| Blocker | Owner |
|---------|--------|
| Auth0 API Identifier `https://api.exel-ai-polling` does not exist (`Service not found`) | **USER** — Step 1 |
| Role claim Action not confirmed in tokens | **USER** — Step 3 |
| `NEXT_PUBLIC_MOCK_MODE` never set false in deploy.yml / Workers Builds | **US** — wired in prep PR; flip secret only after Steps 1–3 |
| Frontend `AUTH0_AUDIENCE` empty in live bundle (defaults blank so SPA never requests an API audience) | **US** — set via `NEXT_PUBLIC_AUTH0_AUDIENCE` secret after Step 1 |
| API Worker missing `AUTH0_API_AUDIENCE` var (was DOMAIN only) | **US** — prep PR adds it |

**We will not set `NEXT_PUBLIC_MOCK_MODE=false` until Step 1 probe returns Login (not Service not found).**

---

## Appendix — GitHub Actions `deploy.yml` wiring (manual until `workflow` scope)

The prep PR cannot update `.github/workflows/deploy.yml` with the current OAuth token (needs `workflow` scope). Apply this manually or via a token that can edit workflows:

In both the **Check required build vars** and **Build** `env:` blocks, add:

```yaml
NEXT_PUBLIC_MOCK_MODE: ${{ secrets.NEXT_PUBLIC_MOCK_MODE }}
```

And extend the setup comment to mention `NEXT_PUBLIC_MOCK_MODE` (set to the literal `false` only after Steps 1–3).

`frontend/scripts/envcheck.mjs` already enforces: when `NEXT_PUBLIC_MOCK_MODE=false`, audience + API URL + Auth0 domain/client id are required.
